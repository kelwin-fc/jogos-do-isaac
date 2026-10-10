/* Cena 11 — O ANTIGO EGITO (ditado pelo Isaac em 2026-08-23).

   Regras que ele ditou, tal e qual:
   - Fugimos das COBRAS. Se elas nos tocam, mordem-nos.
   - Para nos defendermos atiramos ESCARAVELHOS egípcios a voar: eles vão atrás da cobra
     e ela foge a correr (ninguém se magoa, é só um susto).
   - Temos de nos esconder nas PIRÂMIDES: à porta da pirâmide já não podemos ser mordidos.
   - Quando somos mordidos NASCEM ITENS que nos limpam (jarros de água do Nilo e flores de lótus).
   - Os TÚNEIS das pirâmides levam-nos às zonas das cobras — e ao FARAÓ, o Pitamena.
   - O faraó fica lá como as múmias: enrola-se em tecido, fecha-se a TAMPA e ele fica fechado
     (feliz, a acenar pela janelinha).
   - Depois do faraó tornamo-nos CAÇADORES e apanhamos cobras coloridas com REDES — de onde
     saem MÚMIAS EM MODO DE TECIDO — e também com SETAS.
   - O ambiente é o DESERTO: montamos CAMELOS e LEOPARDOS e subimos e descemos as dunas.
   - Há HIERÓGLIFOS e as personagens do antigo Egito.
   - Ao fim de cada pirâmide (ou templo) ficamos vestidos: umas tornam-nos MÚMIA, outras
     tornam-nos FARAÓ, e vamos alternando de monumento para monumento.
   - Além de pirâmides há TEMPLOS como o de Karnak, com pilone, colunas e obeliscos.
   - Em algumas partes há o rio NILO: entra-se numa BARCA e há CROCODILOS à volta que
     saltam para nos apanhar — leva-se o barco para a frente ou para trás para os evitar.

   Regras de paz do projeto: ninguém se magoa. A mordidela é um "nhac" de brincadeira que só
   suja e faz cócegas (a água limpa tudo), nunca há game over — sem corações o herói senta-se
   e uma múmia amiga traz-lhe um jarro de água. As cobras apanhadas saem da rede como múmias
   de tecido a dançar e passam a andar connosco. As setas são de brincar, com ventosa e fita. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  const SLOT = 900;                  // um "pedaço" de deserto
  const RUN = 245, JUMPV = 645, GRAV = 1500;
  const REDE_V = 545, SETA_V = 880;
  const MAXAMIGAS = 5;               // múmias de tecido visíveis atrás de nós
  const TLEN = 2650;                 // comprimento do túnel da pirâmide
  const VIDAS_MAX = 3;

  // as cobras coloridas do Isaac — apanhá-las todas de uma vez faz festa
  const CORES = [
    { n: 'verde',   c: '#43aa8b', c2: '#2d6a4f' },
    { n: 'azul',    c: '#4cc9f0', c2: '#3a86ff' },
    { n: 'roxo',    c: '#b56ff0', c2: '#6a4c93' },
    { n: 'laranja', c: '#f8961e', c2: '#e36414' },
    { n: 'rosa',    c: '#ff8fab', c2: '#e05780' },
    { n: 'dourado', c: '#ffd166', c2: '#e0a30a' }
  ];

  let hero, cobras, amigas, redes, setas, itens, bichos, sparks, puffs, graos, confetes, trail;
  let camX, camY, spawnT, vidas, apanhadas, total, cacador, mundo, tunelInfo, cer, ajuda;
  let montarias, coins, avisos, portaPerto, festaT, traje, barcas, crocs;
  let stash = null;                  // o deserto fica guardado enquanto andamos no túnel

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function h01(n) { const s = Math.sin(n * 127.1) * 43758.5; return s - Math.floor(s); }

  // ecrãs baixinhos desenham o mundo mais pequeno (igual à Barbie, aos ninjas e às viúvas)
  function vscale() { return Math.min(1, G.H / 620); }
  function vw() { return G.W / vscale(); }
  function vh() { return G.H / vscale(); }
  function chaoY() { return mundo === 'tunel' ? vh() * 0.80 : vh() * 0.72; }
  function sy(alt) { return chaoY() - (alt - camY); }

  function nivel() { return Math.min(4, 1 + Math.floor(total / 5)); }

  /* ---------- o deserto: dunas, pirâmides, oásis e montarias ---------- */
  function duneRaw(x) {
    return 46 + 44 * Math.sin(x / 380) + 24 * Math.sin(x / 165 + 1.3) + 11 * Math.sin(x / 78 + 0.7);
  }
  // monumentos: umas vezes uma pirâmide, outras um templo com pilone e colunas (Karnak)
  function monumentoAt(i) {
    if (i < 1 || rioAt(i) || h01(i * 3.13 + 0.41) < 0.42) return null;
    const x = i * SLOT + 420 + h01(i * 7.7) * 150;
    const w = 330 + Math.floor(h01(i * 2.7) * 3) * 80;
    const templo = h01(i * 4.77 + 2.2) < 0.42;
    return {
      i: i, x: x, w: w, h: templo ? w * 0.62 : w * 0.84,
      base: duneRaw(x), tipo: templo ? 'templo' : 'piramide'
    };
  }
  function larguraBase(p) { return p.tipo === 'templo' ? p.w * 1.2 : p.w; }
  // umas fazem de nós múmia, outras faraó, alternando de monumento para monumento
  // (regra do Isaac). Conta-se pela ORDEM em que aparecem, não pelo número do pedaço,
  // senão dois monumentos seguidos podiam calhar os dois ao mesmo traje.
  function trajeDe(p) {
    let n = 0;
    for (let k = 1; k < p.i; k++) if (monumentoAt(k)) n++;
    return n % 2 === 0 ? 'farao' : 'momia';
  }
  // a areia achata-se à volta das pirâmides, senão elas assentavam tortas na duna
  function chao(x) {
    const i = Math.floor(x / SLOT);
    let g = duneRaw(x);
    for (let k = i - 1; k <= i + 1; k++) {
      const p = monumentoAt(k);
      if (!p) continue;
      const d = Math.abs(x - p.x), pad = larguraBase(p) * 0.62 + 70, marg = 200;
      if (d < pad) return p.base;
      if (d < pad + marg) {
        const u = (d - pad) / marg, s = u * u * (3 - 2 * u);
        g = p.base + (duneRaw(x) - p.base) * s;
      }
    }
    for (let k = i - 1; k <= i + 1; k++) {              // e mergulha no leito do Nilo
      const r = rioAt(k);
      if (!r) continue;
      if (x <= r.x0 || x >= r.x1) continue;             // na margem o chão é o do deserto
      const marg = 120;
      let u = 1;
      if (x < r.x0 + marg) u = (x - r.x0) / marg;
      else if (x > r.x1 - marg) u = (r.x1 - x) / marg;
      const sm = u * u * (3 - 2 * u);
      g = g + (r.leito - g) * sm;
    }
    return g;
  }
  function oasisAt(i) {
    if (i < 1 || monumentoAt(i) || h01(i * 5.9 + 1.7) < 0.5) return null;
    return { x: i * SLOT + 240 + h01(i * 4.4) * 320, n: 2 + Math.floor(h01(i * 6.6) * 3) };
  }
  // o rio Nilo atravessa o deserto de vez em quando (nunca onde está um monumento)
  function rioAt(i) {
    // o rio manda: onde ele passa não há monumento (senão o Nilo só aparecia lá longe)
    if (i < 2 || h01(i * 7.91 + 1.13) < 0.6) return null;
    const cx = i * SLOT + 450 + h01(i * 3.9) * 120;
    const w = 640 + Math.floor(h01(i * 6.3) * 3) * 110;
    const x0 = cx - w / 2, x1 = cx + w / 2;        // x0 e x1 são a linha de água
    const nivel = Math.min(duneRaw(x0), duneRaw(x1)) - 8;
    return { i: i, x0: x0, x1: x1, cx: cx, nivel: nivel, leito: nivel - 78 };
  }
  function rioEm(x) {
    const i = Math.floor(x / SLOT);
    for (let k = i - 1; k <= i + 1; k++) {
      const r = rioAt(k);
      if (r && x > r.x0 - 4 && x < r.x1 + 4) return r;
    }
    return null;
  }
  function rioPerto(x) {
    const i = Math.floor(x / SLOT);
    for (let k = i - 1; k <= i + 1; k++) {
      const r = rioAt(k);
      if (r && x > r.x0 - 300 && x < r.x1 + 300) return r;
    }
    return null;
  }
  function barcaDe(r) {
    let b = barcas[r.i];
    if (!b) b = barcas[r.i] = { x: r.x0 + 44, v: 0, bob: h01(r.i * 2.2) * 6 };
    return b;
  }
  function crocsDe(r) {
    let a = crocs[r.i];
    if (!a) {
      a = crocs[r.i] = [];
      const n = 2 + Math.floor(h01(r.i * 5.53) * 2);
      for (let k = 0; k < n; k++) {
        a.push({
          x: r.x0 + 130 + ((r.x1 - r.x0 - 260) * (k + 0.5)) / n,
          dir: k % 2 ? 1 : -1, state: 'nada', st: rnd(1.4, 3.4),
          jt: 0, jx0: 0, jx1: 0, wig: rnd(0, 6), alt: r.nivel, ri: 0
        });
      }
    }
    return a;
  }

  function obeliscoAt(i) {
    if (i < 1 || h01(i * 8.17 + 3.1) < 0.62) return null;
    return { x: i * SLOT + 700 + h01(i * 2.9) * 140 };
  }
  function montariaAt(i) {
    if (i < 1 || h01(i * 9.31 + 0.7) < 0.22) return null;
    let x = i * SLOT + 160 + h01(i * 8.3) * 520;
    const r = rioAt(i);
    if (r && x > r.x0 - 90 && x < r.x1 + 90) x = r.x0 - 130;   // à espera na margem, não na água
    return {
      i: i, x: x,
      // à vez, um camelo e um leopardo: com o sorteio antigo saíam dez leopardos
      // seguidos e o camelo só aparecia lá para o fim do deserto
      tipo: i % 2 === 0 ? 'camelo' : 'leopardo'
    };
  }
  function montariaEstado(i) {
    let o = montarias[i];
    if (!o) o = montarias[i] = { livre: true, x: null, walk: 0, acena: 0 };
    return o;
  }
  function estrelasAt(i) {
    const out = [];
    for (let k = 0; k < 3; k++) {
      const x = i * SLOT + 120 + k * 280 + h01(i * 9.1 + k) * 90;
      out.push({ x: x, alt: chao(x) + 62 + h01(i * 4.3 + k) * 70, id: i + '_' + k });
    }
    return out;
  }

  /* ---------- o túnel da pirâmide ---------- */
  function chaoTunelBase(x, blocos) {
    if (x > TLEN - 400) return 138;             // degraus a subir para a câmara do faraó
    if (x > TLEN - 500) return 92;
    if (x > TLEN - 590) return 46;
    for (const b of blocos) if (x > b.x && x < b.x + b.w) return b.alt;
    return 0;
  }
  function gerarTunel(p) {
    const s = p.i;
    const blocos = [], nichos = [], tesouros = [];
    for (let k = 0; k < 5; k++) {
      const x = 420 + k * 420 + h01(s * 3.7 + k) * 120;
      blocos.push({ x: x, w: 170 + Math.floor(h01(s * 5.1 + k) * 2) * 70, alt: 92 + Math.floor(h01(s * 7.3 + k) * 2) * 52 });
    }
    for (let k = 0; k < 3; k++) nichos.push({ x: 640 + k * 700 + h01(s * 2.3 + k) * 140 });
    for (let k = 0; k < 7; k++) {
      const x = 300 + k * 300 + h01(s * 6.7 + k) * 130;
      tesouros.push({ x: x, alt: chaoTunelBase(x, blocos) + 56, id: 't' + s + '_' + k });
    }
    return { p: p, tipo: p.tipo, blocos: blocos, nichos: nichos, tesouros: tesouros };
  }
  function chaoTunel(x) { return chaoTunelBase(x, tunelInfo ? tunelInfo.blocos : []); }
  function solo(x) { return mundo === 'tunel' ? chaoTunel(x) : chao(x); }

  /* ---------- arranque da cena ---------- */
  S.enter = function () {
    hero = {
      x: 170, alt: 0, vy: 0, dir: 1, walk: 0, grounded: true,
      inv: 1.2, suja: 0, tonto: 0, monta: null, sentado: 0, pose: 0,
      fireCd: 0, arcoCd: 0, barca: null
    };
    cobras = []; amigas = []; redes = []; setas = []; itens = []; bichos = [];
    sparks = []; puffs = []; graos = []; confetes = []; trail = [];
    montarias = {}; coins = {}; avisos = {}; barcas = {}; crocs = {};
    camX = 0; spawnT = 1.2; vidas = VIDAS_MAX;
    apanhadas = CORES.map(function () { return 0; });
    total = 0; cacador = false; mundo = 'deserto'; tunelInfo = null; cer = null;
    ajuda = null; portaPerto = null; festaT = 0; stash = null; traje = 'normal';
    hero.alt = chao(hero.x); camY = hero.alt;
    for (let i = 0; i < 3; i++) novaCobra(hero.x + 640 + i * 380);
    botoes();
    G.banner('Foge das cobras! Esconde-te na pirâmide 🔺', 3400);
    setTimeout(function () {
      if (!cacador && G.scenes && G.scenes.egito === S) G.banner('Atira escaravelhos 🪲 — as cobras fogem!', 3000);
    }, 3600);
  };

  // os botões mudam com a história: primeiro atiramos AREIA, depois REDE e SETAS
  function botoes() {
    document.body.classList.toggle('cacador', !!cacador);
    const f = document.getElementById('btnFire');
    if (f) f.textContent = cacador ? '🕸️' : '🪲';
    const h = document.getElementById('btnHorn');
    if (h) h.textContent = '🏹';
  }

  function novaCobra(x) {
    const ci = Math.floor(Math.random() * CORES.length);
    cobras.push({
      x: x, alt: solo(x), ci: ci, dir: -1, wig: rnd(0, 6), state: 'passeia',
      st: rnd(1, 3), levanta: 0, wrap: 0, venia: 0
    });
  }

  function puff(x, alt, n, cor) {
    for (let i = 0; i < (n || 8); i++) {
      puffs.push({
        x: x + rnd(-14, 14), alt: alt + rnd(-10, 14), r: rnd(6, 15),
        vx: rnd(-60, 60), vy: rnd(10, 90), t: 0, life: rnd(0.4, 0.9),
        cor: cor || 'rgba(240,222,180,.9)'
      });
    }
  }
  function spark(x, alt, n, cor) {
    for (let i = 0; i < n; i++) {
      sparks.push({ x: x, alt: alt, vx: rnd(-160, 160), vy: rnd(50, 250), t: 0, life: rnd(0.4, 0.9), cor: cor || '#ffd166' });
    }
  }
  function festa(x, alt) {
    for (let i = 0; i < 44; i++) {
      confetes.push({
        x: x + rnd(-280, 280), alt: alt + rnd(140, 460), vx: rnd(-70, 70), vy: rnd(-40, 40),
        rot: rnd(0, 6), vr: rnd(-6, 6), t: 0, life: rnd(1.6, 3.2),
        cor: ['#ffd166', '#ef476f', '#06d6a0', '#4cc9f0', '#f78c6b'][i % 5]
      });
    }
  }

  /* ---------- segurança: a porta da pirâmide e os nichos do túnel ---------- */
  function seguro() {
    if (hero.monta) return false;
    if (mundo === 'tunel') {
      if (!tunelInfo) return false;
      if (hero.x > TLEN - 420) return true;                 // a câmara do faraó é sagrada
      for (const n of tunelInfo.nichos) if (Math.abs(hero.x - n.x) < 60 && hero.alt < 50) return true;
      return false;
    }
    return !!portaPerto;
  }

  /* ---------- montarias: camelos e leopardos ---------- */
  function montar(i, m, mx) {
    const o = montariaEstado(i);
    o.livre = false; o.x = null;
    hero.monta = { tipo: m.tipo, i: i, walk: 0, salto: 0, calma: 3 };
    hero.x = mx;
    G.audio.sfx(m.tipo === 'camelo' ? 'camelo' : 'roar');
    spark(mx, chao(mx) + 90, 6, '#ffd166');
    G.banner(m.tipo === 'camelo' ? 'Boleia de camelo! 🐫' : 'Boleia de leopardo! 🐆', 2000);
  }
  function desmontar() {
    if (!hero.monta) return null;
    const m = hero.monta, o = montariaEstado(m.i);
    o.livre = true; o.x = hero.x - hero.dir * 80; o.acena = 2.6;
    hero.monta = null;
    return m;
  }
  function velocidade() {
    let v = RUN;
    if (hero.monta) v *= hero.monta.tipo === 'camelo' ? 1.5 : 1.95;
    if (hero.tonto > 0) v *= 0.62;
    return v;
  }

  /* ---------- o Nilo: barca e crocodilos ---------- */
  function embarcar(r) {
    if (hero.barca !== null) return;
    desmontar();
    hero.barca = r.i; hero.vy = 0; hero.grounded = true; hero.inv = Math.max(hero.inv, 1);
    const b = barcaDe(r);
    hero.x = b.x; hero.alt = r.nivel + 14;
    G.audio.sfx('splash');
    G.banner('Barca no Nilo! ◀ ▶ para fugir aos crocodilos 🐊', 3200);
  }
  function desembarcar(r, lado) {
    hero.barca = null;
    hero.x = lado < 0 ? r.x0 - 30 : r.x1 + 30;
    hero.alt = chao(hero.x); hero.vy = 0; hero.dir = lado;
    G.audio.sfx('hop');
    puff(hero.x, hero.alt + 10, 5, 'rgba(200,230,255,.9)');
  }
  // a pé não se entra na água: ou subimos para a barca, ou ficamos na margem
  function travarNaMargem(nx) {
    if (mundo !== 'deserto') return nx;
    const r = rioEm(nx);
    if (!r) return nx;
    const b = barcaDe(r);
    if (Math.abs(nx - b.x) < 62) { embarcar(r); return b.x; }
    return nx < r.cx ? r.x0 - 6 : r.x1 + 6;
  }
  function atualizaBarca(dt, mv, r) {
    const b = barcaDe(r);
    b.v += mv * 430 * dt;
    b.v -= b.v * Math.min(1, dt * 2.1);
    b.v = Math.max(-290, Math.min(290, b.v));
    b.x = Math.max(r.x0 + 26, Math.min(r.x1 - 26, b.x + b.v * dt));
    hero.x = b.x; hero.alt = r.nivel + 14; hero.vy = 0; hero.grounded = true;
    if (mv !== 0) { hero.dir = mv; hero.walk += dt * 4; }
    if (b.x <= r.x0 + 28 && mv < 0) desembarcar(r, -1);
    else if (b.x >= r.x1 - 28 && mv > 0) desembarcar(r, 1);
  }
  function lambidela(cr, r) {
    hero.inv = 2.3; hero.tonto = 0.9;
    vidas = Math.max(0, vidas - 1);
    const b = barcaDe(r);
    b.v = (hero.x < cr.x ? -1 : 1) * 320;
    cr.ri = 1.4;
    G.audio.sfx('gulp'); G.shake = 0.3;
    spark(hero.x, hero.alt + 50, 9, '#8ecae6');
    puff(cr.x, r.nivel + 30, 8, 'rgba(180,230,255,.9)');
    if (vidas <= 0) {                       // no rio são as flores de lótus que nos curam
      vidas = VIDAS_MAX; hero.suja = 0; hero.inv = 3;
      for (let k = 0; k < 3; k++) nascerItem(r.x0 + (r.x1 - r.x0) * (k + 1) / 4);
      G.audio.sfx('tada');
      G.banner('As flores de lótus deram-te os corações! 🌸💗', 3000);
    } else {
      G.banner('Lambidela de crocodilo! 😜 Foge com a barca', 2600);
    }
  }
  function atualizaCrocs(dt) {
    const i0 = Math.floor((camX - 500) / SLOT), i1 = Math.floor((camX + vw() + 500) / SLOT);
    for (let i = Math.max(0, i0); i <= i1; i++) {
      const r = rioAt(i);
      if (!r) continue;
      const naBarca = hero.barca === i;
      for (const cr of crocsDe(r)) {
        cr.wig += dt * 2;
        cr.ri = Math.max(0, cr.ri - dt);
        if (cr.state === 'salta') {
          cr.jt += dt;
          const u = Math.min(1, cr.jt / 0.85);
          cr.x = cr.jx0 + (cr.jx1 - cr.jx0) * u;
          cr.alt = r.nivel + Math.sin(u * Math.PI) * 170;
          if (naBarca && hero.inv <= 0 && u > 0.62 && u < 0.98 && Math.abs(cr.x - hero.x) < 42) lambidela(cr, r);
          if (u >= 1) {
            cr.state = 'nada'; cr.st = rnd(1.8, 3.6); cr.alt = r.nivel;
            cr.dir = cr.jx1 > cr.jx0 ? 1 : -1;
            puff(cr.x, r.nivel + 10, 9, 'rgba(170,225,255,.9)');
            G.audio.sfx('splash');
          }
        } else if (cr.state === 'aviso') {
          cr.st -= dt;
          if (naBarca) cr.x += Math.sign(hero.x - cr.x) * 150 * dt;
          cr.alt = r.nivel;
          if (Math.random() < dt * 16) {
            puffs.push({
              x: cr.x + rnd(-16, 16), alt: r.nivel + rnd(0, 14), r: rnd(3, 7),
              vx: 0, vy: 40, t: 0, life: 0.5, cor: 'rgba(220,245,255,.9)'
            });
          }
          if (cr.st <= 0) {
            cr.state = 'salta'; cr.jt = 0; cr.jx0 = cr.x;
            cr.jx1 = naBarca ? hero.x : cr.x + cr.dir * 150;
            G.audio.sfx('whoosh');
          }
        } else {
          cr.st -= dt;
          cr.x += cr.dir * (70 + h01(cr.wig) * 46) * dt;
          cr.alt = r.nivel;
          if (cr.x < r.x0 + 70) { cr.x = r.x0 + 70; cr.dir = 1; }
          if (cr.x > r.x1 - 70) { cr.x = r.x1 - 70; cr.dir = -1; }
          if (naBarca && cr.st <= 0 && Math.abs(hero.x - cr.x) < 580) {
            cr.state = 'aviso'; cr.st = Math.max(0.6, 1.05 - nivel() * 0.08);
            if (!avisos.croc) { avisos.croc = 1; G.banner('Cuidado, vai saltar! 🐊', 2200); }
          }
        }
      }
    }
  }

  /* ---------- a mordidela (de brincadeira) e a água que limpa ---------- */
  function morder(cb) {
    if (hero.inv > 0 || hero.sentado > 0 || cer) return;
    if (seguro()) return;
    if (hero.monta) { assustarMontaria(cb); return; }
    hero.inv = 2.4; hero.tonto = 1.3; hero.suja = Math.min(3, hero.suja + 1);
    vidas = Math.max(0, vidas - 1);
    hero.vy = 260; hero.grounded = false;
    hero.x -= (cb.x > hero.x ? 1 : -1) * 30;
    cb.state = 'ri'; cb.st = 2.2; cb.dir = cb.x > hero.x ? 1 : -1;
    G.audio.sfx('nhac'); G.shake = 0.3;
    puff(hero.x, hero.alt + 40, 8, 'rgba(198,168,116,.9)');
    nascerItem(hero.x - 180); nascerItem(hero.x + 200);      // "nascem itens que nos limpam"
    if (vidas <= 0) sesta();
    else G.banner('Nhac! 😜 Apanha a água 💧', 2200);
  }
  function assustarMontaria(cb) {
    if (hero.monta.calma > 0) {         // acabámos de subir: é a cobra que se assusta
      assustarCobra(cb);
      return;
    }
    const m = desmontar();
    hero.inv = 1.5; hero.vy = 300; hero.grounded = false;
    cb.state = 'ri'; cb.st = 1.4; cb.dir = cb.x > hero.x ? 1 : -1;
    G.audio.sfx('boing'); spark(hero.x, hero.alt + 70, 7, '#ffd166');
    G.banner('O ' + (m.tipo === 'camelo' ? 'camelo' : 'leopardo') + ' assustou-se! 😄', 2200);
  }
  function sesta() {
    hero.sentado = 3.4; hero.inv = 5; hero.monta && desmontar();
    ajuda = { x: hero.x + (hero.dir > 0 ? -320 : 320), verte: 0 };
    G.audio.sfx('giggle');
    G.banner('Vem aí uma múmia com água fresca 💧', 2800);
  }
  function nascerItem(x) {
    if (mundo === 'tunel') x = Math.max(140, Math.min(TLEN - 260, x));
    else x = Math.max(60, x);
    const r = mundo === 'deserto' ? rioEm(x) : null;
    const g = r ? r.nivel - 18 : solo(x);        // no Nilo, o lótus fica a boiar
    itens.push({ x: x, alt: g + 36, t: rnd(0, 3), tipo: r ? 'lotus' : (Math.random() < 0.5 ? 'jarro' : 'lotus') });
    spark(x, g + 44, 5, '#8ecae6');
  }
  function limpar(it) {
    hero.suja = 0; hero.tonto = 0;
    vidas = Math.min(VIDAS_MAX, vidas + 1);
    G.audio.sfx('splash'); G.addStars(1);
    spark(it.x, it.alt, 12, '#8ecae6');
    puff(it.x, it.alt, 6, 'rgba(180,225,255,.9)');
    G.banner('Limpinho! ✨💧', 1600);
  }

  /* ---------- escaravelhos, redes e setas ---------- */
  // o escaravelho sai a voar, procura a cobra mais perto — e ela foge a correr
  function atirarBicho() {
    bichos.push({
      x: hero.x + hero.dir * 26, alt: hero.alt + 54,
      vx: hero.dir * 330, vy: 70, t: 0, wob: rnd(0, 6), alvo: null
    });
    G.audio.sfx('bicho');
  }
  function assustarCobra(cb) {
    cb.state = 'foge'; cb.st = 3.2; cb.levanta = 0;
    cb.dir = cb.x > hero.x ? 1 : -1;
    G.audio.sfx('guincho');
    spark(cb.x, cb.alt + 34, 8, '#ffd166');
    if (!avisos.bicho) { avisos.bicho = 1; G.banner('A cobra fugiu do escaravelho! 🪲', 2600); }
  }
  function atirarRede() {
    redes.push({ x: hero.x + hero.dir * 22, alt: hero.alt + 48, vx: hero.dir * REDE_V, vy: 235, rot: 0, t: 0 });
    G.audio.sfx('rede');
  }
  function atirarSeta() {
    setas.push({ x: hero.x + hero.dir * 26, alt: hero.alt + 54, vx: hero.dir * SETA_V, vy: 40, dir: hero.dir, t: 0 });
    G.audio.sfx('arco');
  }
  function apanharCobra(cb, como) {
    cb.state = 'preso'; cb.wrap = 0; cb.como = como;
    G.audio.sfx('rede'); G.shake = 0.12;
    spark(cb.x, cb.alt + 34, 9, '#ffffff');
    puff(cb.x, cb.alt + 22, 7, 'rgba(255,255,255,.92)');
  }
  function virarAmiga(cb) {
    amigas.push({ ci: cb.ci, x: cb.x, alt: cb.alt, t: rnd(0, 5), hop: rnd(0, 6) });
    apanhadas[cb.ci]++; total++;
    G.addStars(2); G.audio.sfx('giggle');
    spark(cb.x, cb.alt + 40, 8, CORES[cb.ci].c);
    if (!avisos.momia) {
      avisos.momia = 1;
      G.banner('Saiu uma múmia de tecido! 🧻💃', 2800);
    } else if (total % 6 === 0) {
      G.banner('Já apanhaste ' + total + ' cobras! 🕸️', 2000);
    }
    if (apanhadas.every(function (n) { return n > 0; })) {
      apanhadas = CORES.map(function () { return 0; });
      G.addStars(10); festa(hero.x, hero.alt); festaT = 2.8;
      G.audio.sfx('tada'); G.shake = 0.3;
      G.banner('APANHASTE TODAS AS CORES! 🎉🐍', 3200);
    }
    while (amigas.length > MAXAMIGAS) {                 // as mais antigas vão para casa a acenar
      const f = amigas.shift();
      puff(f.x, f.alt + 30, 8, 'rgba(255,255,255,.9)');
      G.addStars(1);
    }
  }

  /* ---------- entrar e sair do túnel ---------- */
  function entrarTunel(p) {
    desmontar();
    stash = { cobras: cobras, itens: itens, x: hero.x, alt: hero.alt };
    mundo = 'tunel'; tunelInfo = gerarTunel(p);
    cobras = []; itens = []; redes = []; setas = []; graos = []; bichos = []; trail = [];
    hero.x = 150; hero.alt = chaoTunel(150); hero.vy = 0; hero.inv = 1.4; hero.dir = 1;
    camX = 0; camY = 0;
    const n = 3 + Math.min(4, nivel());
    for (let k = 0; k < n; k++) novaCobra(560 + k * 320 + rnd(-70, 70));
    G.audio.sfx('door');
    G.banner(cacador ? 'Zona das cobras! Apanha-as 🕸️🏹' : 'Zona das cobras! Procura o faraó 👑', 3200);
    if (!avisos.nicho) { avisos.nicho = 1; setTimeout(function () { G.banner('Nos buraquinhos ninguém morde 🔦', 2600); }, 3400); }
  }
  function sairTunel() {
    const p = tunelInfo.p;
    mundo = 'deserto'; cer = null; tunelInfo = null;
    cobras = stash ? stash.cobras : []; itens = stash ? stash.itens : [];
    redes = []; setas = []; graos = []; bichos = []; trail = []; stash = null;
    hero.x = p.x + 110; hero.alt = p.base; hero.vy = 0; hero.inv = 1.6; hero.dir = 1;
    camX = hero.x - vw() * 0.38; camY = p.base;
    G.audio.sfx('door');
  }
  // O fundo do monumento nunca é um beco sem saída: chegar lá veste-nos e põe-nos
  // outra vez cá fora (antes ficava-se preso ao pé da gata Bastet).
  function chegouAoFim() {
    if (cer) return;
    const novo = trajeDe(tunelInfo.p);
    hero.x = TLEN - 380; hero.dir = 1; hero.vy = 0; hero.alt = chaoTunel(hero.x);
    if (!cacador) {
      cer = { modo: 'farao', t: 0, passo: 0, traje: novo };
      G.audio.sfx('whistle');
      G.banner('O faraó Pitamena! 👑', 2600);
    } else {
      cer = { modo: 'traje', t: 0, passo: 0, traje: novo };
      G.audio.sfx('whistle');
      G.banner(novo === 'momia' ? 'A sala das ligaduras… 🧻' : 'A sala da coroa… 👑', 2400);
    }
  }
  function vestir(novo) {
    traje = novo;
    G.addStars(4); festa(hero.x, hero.alt + 90); festaT = 2.6;
    G.audio.sfx('tada'); G.shake = 0.2;
    G.banner(novo === 'momia' ? 'Agora és uma MÚMIA! 🧻✨' : 'Agora és o FARAÓ! 👑✨', 3000);
  }
  function atualizaCerimonia(dt) {
    cer.t += dt;
    if (cer.modo === 'traje') {                 // visita seguinte: só a transformação
      if (cer.t > 0.5 && cer.passo < 1) { cer.passo = 1; G.audio.sfx('whoosh'); }
      if (cer.t > 2.1 && cer.passo < 2) { cer.passo = 2; G.audio.sfx('poof'); vestir(cer.traje); }
      if (cer.t > 3.8) sairTunel();
      return;
    }
    if (cer.t > 1.4 && cer.passo < 1) { cer.passo = 1; G.audio.sfx('whoosh'); }          // as fitas enrolam
    if (cer.t > 3.4 && cer.passo < 2) { cer.passo = 2; G.audio.sfx('poof'); }            // já é múmia e entra
    if (cer.t > 4.9 && cer.passo < 3) { cer.passo = 3; G.audio.sfx('tampa'); G.shake = 0.35; }
    if (cer.t > 6.2 && cer.passo < 4) { cer.passo = 4; G.audio.sfx('zap'); }             // hieróglifos acendem
    if (cer.t > 7.4 && cer.passo < 5) {
      cer.passo = 5; cacador = true; botoes();
      traje = cer.traje;                        // e saímos já vestidos deste monumento
      G.addStars(5); G.audio.sfx('tada'); festa(hero.x, hero.alt + 120); festaT = 2.4;
      G.banner('AGORA ÉS CAÇADOR! 🏹🕸️', 3400);
    }
    if (cer.t > 9.6) {
      sairTunel();
      G.banner('Apanha as cobras coloridas! 🕸️🏹', 3200);
    }
  }

  /* ---------- partículas ---------- */
  function particulas(dt) {
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i]; p.t += dt; p.x += p.vx * dt; p.alt += p.vy * dt; p.vy -= 90 * dt;
      if (p.t > p.life) puffs.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]; s.t += dt; s.x += s.vx * dt; s.alt += s.vy * dt; s.vy -= 420 * dt;
      if (s.t > s.life) sparks.splice(i, 1);
    }
    for (let i = graos.length - 1; i >= 0; i--) {
      const g = graos[i]; g.t += dt; g.x += g.vx * dt; g.alt += g.vy * dt; g.vy -= 620 * dt;
      if (g.t > g.life) graos.splice(i, 1);
    }
    for (let i = confetes.length - 1; i >= 0; i--) {
      const f = confetes[i]; f.t += dt; f.x += f.vx * dt; f.alt += f.vy * dt;
      f.vy -= 260 * dt; f.rot += f.vr * dt;
      if (f.t > f.life) confetes.splice(i, 1);
    }
  }

  /* ---------- ciclo ---------- */
  S.update = function (dt, t) {
    const inp = G.input, W = vw();
    festaT = Math.max(0, festaT - dt);
    hero.inv = Math.max(0, hero.inv - dt);
    hero.tonto = Math.max(0, hero.tonto - dt);
    hero.pose = Math.max(0, hero.pose - dt);

    if (cer) { atualizaCerimonia(dt); particulas(dt); return; }

    /* --- sesta: a múmia amiga traz o jarro e limpa-nos (nunca há game over) --- */
    if (hero.sentado > 0) {
      hero.sentado -= dt;
      if (ajuda) {
        const alvo = hero.x + (ajuda.x > hero.x ? 90 : -90);
        ajuda.x += Math.sign(alvo - ajuda.x) * Math.min(Math.abs(alvo - ajuda.x), 210 * dt);
        if (Math.abs(ajuda.x - alvo) < 8) ajuda.verte = Math.min(1, ajuda.verte + dt * 1.4);
        if (ajuda.verte > 0.25 && Math.random() < dt * 22) {
          sparks.push({ x: hero.x + rnd(-24, 24), alt: hero.alt + rnd(40, 90), vx: 0, vy: -120, t: 0, life: 0.5, cor: '#8ecae6' });
        }
      }
      if (hero.sentado <= 0) {
        vidas = VIDAS_MAX; hero.suja = 0; hero.tonto = 0; hero.inv = 2.2; ajuda = null;
        G.audio.sfx('splash'); G.audio.sfx('tada');
        spark(hero.x, hero.alt + 60, 14, '#8ecae6');
        G.banner('Limpinho e fresquinho! 💧✨', 2400);
      }
      particulas(dt);
      return;
    }

    /* --- entrar/sair pelas portas (o ⬆ à porta serve para entrar, não para saltar) --- */
    const subir = inp.justPressed('jump') || inp.justPressed('up');
    let usouSubir = false;
    if (mundo === 'deserto' && portaPerto && subir) { entrarTunel(portaPerto); usouSubir = true; }
    else if (mundo === 'tunel' && hero.x < 140 && subir) { sairTunel(); usouSubir = true; }

    /* --- andar, saltar --- */
    const ax = inp.axis();
    let mv = 0;
    if (inp.isHeld('left')) mv -= 1;
    if (inp.isHeld('right')) mv += 1;
    if (mv === 0 && Math.abs(ax.x) > 0.25) mv = Math.sign(ax.x);
    const rioAqui = (mundo === 'deserto' && hero.barca !== null) ? rioEm(hero.x) : null;
    if (rioAqui) {
      atualizaBarca(dt, mv, rioAqui);
    } else if (mv !== 0) {
      hero.x = travarNaMargem(Math.max(60, hero.x + mv * velocidade() * dt));
      hero.dir = mv;
      hero.walk += dt * (hero.monta ? 9 : 13);
      if (hero.monta) hero.monta.walk += dt * (hero.monta.tipo === 'camelo' ? 5 : 9);
    }
    // segurança: fora de água nunca se fica "dentro" da barca (recalculado, porque
    // podemos ter acabado de embarcar mesmo agora, neste frame)
    if (hero.barca !== null && !rioEm(hero.x)) hero.barca = null;
    if (mundo === 'tunel') hero.x = Math.min(hero.x, TLEN - 120);
    if (!usouSubir && subir && hero.grounded && hero.barca === null) {
      hero.vy = JUMPV * (hero.monta ? (hero.monta.tipo === 'leopardo' ? 1.3 : 1.12) : 1);
      hero.grounded = false;
      G.audio.sfx('hop');
    }

    /* --- botões de ação: areia (fugitivos) / rede e setas (caçadores) --- */
    hero.fireCd -= dt; hero.arcoCd -= dt;
    if (inp.isHeld('fire') && hero.fireCd <= 0) {
      hero.pose = 0.24;
      if (cacador) { hero.fireCd = 0.42; atirarRede(); }
      else { hero.fireCd = 0.45; atirarBicho(); }
    }
    if (cacador && inp.isHeld('horn') && hero.arcoCd <= 0) { hero.arcoCd = 0.55; hero.pose = 0.3; atirarSeta(); }

    /* --- gravidade e chão (as dunas sobem e descem; na barca boiamos) --- */
    if (hero.barca === null) {
      hero.vy -= GRAV * dt;
      hero.alt += hero.vy * dt;
      const g = solo(hero.x);
      hero.grounded = false;
      if (hero.alt <= g) { hero.alt = g; if (hero.vy < 0) hero.vy = 0; hero.grounded = true; }
    }

    /* --- câmara --- */
    camX = Math.max(mundo === 'tunel' ? 0 : -40, hero.x - W * 0.38);
    if (mundo === 'tunel') camX = Math.min(camX, Math.max(0, TLEN + 220 - W));
    // na barca a câmara segue a linha de água (o leito do rio fica lá em baixo)
    const alvoCam = hero.barca !== null ? hero.alt - 14 : solo(hero.x);
    camY += (alvoCam - camY) * Math.min(1, dt * 4.5);

    /* --- rasto para as múmias amigas irem atrás --- */
    if (!trail.length || Math.abs(trail[0].x - hero.x) > 12 || Math.abs(trail[0].alt - hero.alt) > 26) {
      trail.unshift({ x: hero.x, alt: hero.alt, dir: hero.dir });
      if (trail.length > (MAXAMIGAS + 2) * 8 + 14) trail.pop();
    }
    for (let i = 0; i < amigas.length; i++) {
      const f = amigas[i], p = trail[Math.min(trail.length - 1, 12 + i * 10)];
      f.t += dt;
      if (p) {
        f.x += (p.x - f.x) * Math.min(1, dt * 4.5);
        f.alt += (p.alt - f.alt) * Math.min(1, dt * 6);
      }
    }

    /* --- crocodilos e a barca a voltar sozinha à margem onde estamos --- */
    if (mundo === 'deserto') {
      atualizaCrocs(dt);
      if (hero.barca === null) {
        const r = rioPerto(hero.x);
        if (r) {
          const b = barcaDe(r);
          const margem = hero.x < r.cx ? r.x0 + 40 : r.x1 - 40;
          if (Math.abs(b.x - margem) > 14) b.x += Math.sign(margem - b.x) * 105 * dt;
          b.v = 0;
        }
      }
    }

    /* --- montarias --- */
    if (!hero.monta && mundo === 'deserto') {
      const i0 = Math.floor((hero.x - 700) / SLOT), i1 = Math.floor((hero.x + 700) / SLOT);
      for (let i = Math.max(0, i0); i <= i1; i++) {
        const m = montariaAt(i);
        if (!m) continue;
        const o = montariaEstado(i);
        if (!o.livre) continue;
        const mx = o.x === null ? m.x : o.x;
        if (rioEm(mx)) continue;
        if (Math.abs(hero.x - mx) < 62 && Math.abs(hero.alt - chao(mx)) < 100) { montar(i, m, mx); break; }
      }
    }
    if (hero.monta) hero.monta.calma = Math.max(0, hero.monta.calma - dt);
    if (hero.monta && mundo === 'deserto' && portaPerto) desmontar();   // à porta desce-se
    for (const k in montarias) {
      const o = montarias[k];
      if (o.acena > 0) o.acena -= dt;
      o.walk += dt * 2;
    }

    /* --- cobras --- */
    spawnT -= dt;
    if (mundo === 'deserto' && spawnT <= 0) {
      spawnT = Math.max(1.3, 3.4 - nivel() * 0.4);
      const vivas = cobras.filter(function (cb) { return cb.state !== 'preso'; }).length;
      if (vivas < 3 + nivel()) novaCobra(hero.x + (Math.random() < 0.5 ? -1 : 1) * rnd(760, 1150));
    }
    for (let i = cobras.length - 1; i >= 0; i--) {
      const cb = cobras[i];
      cb.wig += dt * (cb.state === 'persegue' ? 8 : 4.5);
      if (cb.state === 'preso') {
        cb.wrap += dt * 1.5;
        if (cb.wrap >= 1) { virarAmiga(cb); cobras.splice(i, 1); }
        continue;
      }
      let vel = 0;
      if (cb.state === 'foge') {
        cb.st -= dt; vel = 205; cb.levanta = 0;
        if (cb.st <= 0) cb.state = 'passeia';
      } else if (cb.state === 'ri') {
        cb.st -= dt; vel = 120; cb.levanta = Math.max(0, (cb.levanta || 0) - dt * 40);
        if (cb.st <= 0) cb.state = 'passeia';
      } else if (cb.state === 'venia') {              // a fazer vénia ao faraó
        cb.st -= dt; vel = 0; cb.levanta = Math.max(0, (cb.levanta || 0) - dt * 70);
        if (cb.st <= 0) cb.state = 'passeia';
      } else {
        const d = hero.x - cb.x;
        // de múmia passamos mais despercebidos; de faraó, elas fazem vénia
        const raio = traje === 'momia' ? 300 : 470;
        cb.venia = Math.max(0, (cb.venia || 0) - dt);
        let persegue = Math.abs(d) < raio && Math.abs(hero.alt - cb.alt) < 220 && !seguro();
        if (persegue && traje === 'farao' && Math.abs(d) < 210 && cb.venia <= 0) {
          cb.state = 'venia'; cb.st = 1.8; cb.venia = 5; persegue = false;
          G.audio.sfx('pop'); spark(cb.x, cb.alt + 40, 4, '#ffd166');
          if (!avisos.venia) { avisos.venia = 1; G.banner('As cobras fazem vénia ao faraó! 👑🐍', 2600); }
        }
        if (persegue) {
          cb.state = 'persegue'; cb.dir = Math.sign(d) || 1;
          vel = 168 + nivel() * 9;
          cb.levanta = Math.min(18, (cb.levanta || 0) + dt * 44);
        } else {
          cb.state = 'passeia';
          cb.levanta = Math.max(0, (cb.levanta || 0) - dt * 34);
          cb.st -= dt;
          if (cb.st <= 0) { cb.st = rnd(1.4, 3.4); cb.dir = Math.random() < 0.5 ? -1 : 1; }
          vel = 92;
        }
      }
      cb.x += cb.dir * vel * dt;
      if (mundo === 'tunel') {
        if (cb.x < 190) { cb.x = 190; cb.dir = 1; }
        if (cb.x > TLEN - 470) { cb.x = TLEN - 470; cb.dir = -1; }
      } else if (cb.x < 40) { cb.x = 40; cb.dir = 1; }
      if (mundo === 'deserto') {                     // as cobras não gostam de água
        const rr = rioEm(cb.x);
        if (rr) { cb.x = cb.x < rr.cx ? rr.x0 - 10 : rr.x1 + 10; cb.dir = cb.x < rr.cx ? -1 : 1; }
      }
      cb.alt = solo(cb.x);
      if (cb.state !== 'foge' && cb.state !== 'venia' &&
          Math.abs(cb.x - hero.x) < 48 && Math.abs(cb.alt - hero.alt) < 92) morder(cb);
      if (mundo === 'deserto' && Math.abs(cb.x - hero.x) > 2400) cobras.splice(i, 1);
    }

    /* --- redes a voar --- */
    for (let i = redes.length - 1; i >= 0; i--) {
      const r = redes[i];
      r.t += dt; r.x += r.vx * dt; r.vy -= 520 * dt; r.alt += r.vy * dt; r.rot += dt * 7;
      let bateu = null;
      for (const cb of cobras) {
        if (cb.state === 'preso') continue;
        if (Math.abs(cb.x - r.x) < 54 && Math.abs((cb.alt + 16) - r.alt) < 62) { bateu = cb; break; }
      }
      if (bateu) { apanharCobra(bateu, 'rede'); redes.splice(i, 1); continue; }
      if (r.alt <= solo(r.x) + 6 || r.t > 3) {
        puff(r.x, Math.max(solo(r.x) + 10, r.alt), 5, 'rgba(255,255,255,.85)');
        redes.splice(i, 1);
      }
    }
    /* --- setas de brincar (ventosa e fita) --- */
    for (let i = setas.length - 1; i >= 0; i--) {
      const s = setas[i];
      s.t += dt; s.x += s.vx * dt; s.vy -= 220 * dt; s.alt += s.vy * dt;
      let bateu = null;
      for (const cb of cobras) {
        if (cb.state === 'preso') continue;
        if (Math.abs(cb.x - s.x) < 44 && Math.abs((cb.alt + 18) - s.alt) < 54) { bateu = cb; break; }
      }
      if (bateu) { apanharCobra(bateu, 'seta'); setas.splice(i, 1); continue; }
      if (s.alt <= solo(s.x) + 4 || s.t > 1.8) {
        puff(s.x, Math.max(solo(s.x) + 8, s.alt), 3, 'rgba(240,222,180,.9)');
        setas.splice(i, 1);
      }
    }

    /* --- escaravelhos a voar atrás das cobras --- */
    for (let i = bichos.length - 1; i >= 0; i--) {
      const b = bichos[i];
      b.t += dt;
      if (!b.alvo || b.alvo.state === 'preso' || b.alvo.state === 'foge') {
        b.alvo = null;
        let md = 640;
        for (const cb of cobras) {
          if (cb.state === 'preso' || cb.state === 'foge') continue;
          const d = Math.abs(cb.x - b.x);
          if (d < md) { md = d; b.alvo = cb; }
        }
      }
      if (b.alvo) {                                    // vai a direito à cobra
        const dx = b.alvo.x - b.x, dy = (b.alvo.alt + 28) - b.alt;
        const n = Math.max(1, Math.hypot(dx, dy));
        b.vx += ((dx / n) * 520 - b.vx) * Math.min(1, dt * 4);
        b.vy += ((dy / n) * 520 - b.vy) * Math.min(1, dt * 4);
        if (Math.abs(dx) < 46 && Math.abs(dy) < 58) {
          assustarCobra(b.alvo);
          puff(b.x, b.alt, 4, 'rgba(255,214,120,.9)');
          bichos.splice(i, 1);
          continue;
        }
      } else {
        b.vy += (Math.sin(b.t * 3 + b.wob) * 90 - b.vy) * Math.min(1, dt * 2);
      }
      b.x += b.vx * dt;
      b.alt += b.vy * dt + Math.sin(b.t * 11 + b.wob) * 22 * dt;
      if (Math.random() < dt * 14) {
        graos.push({ x: b.x, alt: b.alt, vx: rnd(-20, 20), vy: rnd(-40, 10), t: 0, life: 0.5 });
      }
      if (b.t > 3.4 || Math.abs(b.x - hero.x) > 1500 || b.alt < solo(b.x) - 30) {
        spark(b.x, b.alt, 4, '#ffd166');
        bichos.splice(i, 1);
      }
    }

    /* --- itens que nos limpam --- */
    for (let i = itens.length - 1; i >= 0; i--) {
      const it = itens[i];
      it.t += dt;
      if (Math.abs(it.x - hero.x) < 50 && Math.abs(it.alt - (hero.alt + 40)) < 84) { limpar(it); itens.splice(i, 1); continue; }
      if (it.t > 26) itens.splice(i, 1);
    }

    /* --- estrelas do deserto e tesouros do túnel --- */
    if (mundo === 'deserto') {
      const i0 = Math.floor((hero.x - 900) / SLOT), i1 = Math.floor((hero.x + 900) / SLOT);
      for (let i = Math.max(0, i0); i <= i1; i++) {
        for (const s of estrelasAt(i)) {
          if (coins[s.id]) continue;
          if (Math.abs(s.x - hero.x) < 58 && Math.abs(s.alt - (hero.alt + 46)) < 80) {
            coins[s.id] = 1; G.addStars(1); G.audio.sfx('star'); spark(s.x, s.alt, 5, '#ffd166');
          }
        }
      }
      portaPerto = null;
      for (let i = Math.max(0, i0); i <= i1; i++) {
        const p = monumentoAt(i);
        if (!p) continue;
        if (Math.abs(hero.x - p.x) < 68 && hero.alt < p.base + 70) portaPerto = p;
      }
      if (portaPerto && !avisos.porta) { avisos.porta = 1; G.banner('Seguro! ⬆ para entrar no túnel 🔦', 3000); }
    } else {
      for (const s of tunelInfo.tesouros) {
        if (coins[s.id]) continue;
        if (Math.abs(s.x - hero.x) < 58 && Math.abs(s.alt - (hero.alt + 46)) < 84) {
          coins[s.id] = 1; G.addStars(1); G.audio.sfx('star'); spark(s.x, s.alt, 5, '#ffd166');
        }
      }
      if (hero.x > TLEN - 330) chegouAoFim();
    }

    particulas(dt);
  };

  /* =====================================================================
     DESENHOS — está tudo desenhado à mão no canvas (zero imagens, zero emoji
     dentro do canvas, como nos outros jogos). Todos com os pés em y=0 e
     virados para a direita; quem chama é que faz scale(dir, 1).
     ===================================================================== */

  /* hieróglifos: oito sinais desenhados (ankh, olho, ave, água, sol, escaravelho, pena, pirâmide) */
  function glifo(c, k, s, cor) {
    const u = s / 10;
    c.save();
    c.strokeStyle = cor; c.fillStyle = cor;
    c.lineWidth = Math.max(1.2, s * 0.11); c.lineCap = 'round'; c.lineJoin = 'round';
    switch (((k % 8) + 8) % 8) {
      case 0:                                                   // ankh
        c.beginPath(); c.arc(0, -2.6 * u, 2.3 * u, 0, TAU); c.stroke();
        c.beginPath(); c.moveTo(0, -0.3 * u); c.lineTo(0, 4.6 * u); c.stroke();
        c.beginPath(); c.moveTo(-3 * u, 1.1 * u); c.lineTo(3 * u, 1.1 * u); c.stroke();
        break;
      case 1:                                                   // olho de Hórus
        c.beginPath(); c.moveTo(-4 * u, 0); c.quadraticCurveTo(0, -3.4 * u, 4 * u, -0.2 * u);
        c.quadraticCurveTo(0, 2.6 * u, -4 * u, 0); c.stroke();
        c.beginPath(); c.arc(0.2 * u, -0.3 * u, 1.1 * u, 0, TAU); c.fill();
        c.beginPath(); c.moveTo(1.6 * u, 1.5 * u); c.lineTo(1.1 * u, 4.2 * u); c.stroke();
        break;
      case 2:                                                   // ave
        c.beginPath(); c.moveTo(-4.2 * u, 2.4 * u); c.quadraticCurveTo(-1 * u, -2.4 * u, 3 * u, -1.4 * u); c.stroke();
        c.beginPath(); c.arc(3.4 * u, -2.4 * u, 1.1 * u, 0, TAU); c.fill();
        c.beginPath(); c.moveTo(-1.4 * u, 2.6 * u); c.lineTo(-1.8 * u, 4.4 * u); c.stroke();
        break;
      case 3:                                                   // água
        for (let i = -1; i <= 1; i++) {
          c.beginPath();
          c.moveTo(-4 * u, i * 2.3 * u);
          c.quadraticCurveTo(-2 * u, (i * 2.3 - 1.4) * u, 0, i * 2.3 * u);
          c.quadraticCurveTo(2 * u, (i * 2.3 + 1.4) * u, 4 * u, i * 2.3 * u);
          c.stroke();
        }
        break;
      case 4:                                                   // disco solar com asas
        c.beginPath(); c.arc(0, 0, 1.9 * u, 0, TAU); c.fill();
        c.beginPath(); c.moveTo(1.9 * u, 0); c.quadraticCurveTo(4.6 * u, -1.8 * u, 5.4 * u, 0.9 * u); c.stroke();
        c.beginPath(); c.moveTo(-1.9 * u, 0); c.quadraticCurveTo(-4.6 * u, -1.8 * u, -5.4 * u, 0.9 * u); c.stroke();
        break;
      case 5:                                                   // escaravelho
        c.beginPath(); c.ellipse(0, 0.4 * u, 2.4 * u, 3.2 * u, 0, 0, TAU); c.fill();
        for (let i = -1; i <= 1; i += 2) {
          c.beginPath(); c.moveTo(i * 2.2 * u, -1.4 * u); c.lineTo(i * 4.2 * u, -2.8 * u); c.stroke();
          c.beginPath(); c.moveTo(i * 2.4 * u, 1.2 * u); c.lineTo(i * 4.4 * u, 2.2 * u); c.stroke();
        }
        break;
      case 6:                                                   // pena da verdade
        c.beginPath(); c.moveTo(0, 4.4 * u); c.quadraticCurveTo(-2.6 * u, 0, 0, -4.4 * u);
        c.quadraticCurveTo(2.6 * u, 0, 0, 4.4 * u); c.fill();
        break;
      default:                                                  // pirâmide
        c.beginPath(); c.moveTo(-4 * u, 3.2 * u); c.lineTo(0, -3.6 * u); c.lineTo(4 * u, 3.2 * u); c.closePath(); c.stroke();
    }
    c.restore();
  }

  /* painel de hieróglifos numa parede de pedra */
  function painelHier(c, x, y, w, h, seed, brilho) {
    c.save();
    c.fillStyle = '#c9a86a';
    G.gfx.rr(c, x, y, w, h, 6); c.fill();
    c.strokeStyle = 'rgba(90,60,25,.55)'; c.lineWidth = 2.5;
    G.gfx.rr(c, x + 4, y + 4, w - 8, h - 8, 4); c.stroke();
    const cols = Math.max(1, Math.floor(w / 30)), rows = Math.max(1, Math.floor(h / 34));
    const cor = brilho > 0 ? 'rgba(255,214,102,' + (0.55 + 0.45 * brilho) + ')' : 'rgba(96,62,26,.85)';
    for (let i = 0; i < cols; i++) {
      for (let k = 0; k < rows; k++) {
        c.save();
        c.translate(x + w * (i + 0.5) / cols, y + h * (k + 0.5) / rows);
        glifo(c, Math.floor(h01(seed + i * 3.3 + k * 7.7) * 8), Math.min(w / cols, h / rows) * 0.78, cor);
        c.restore();
      }
    }
    if (brilho > 0) {
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 * brilho;
      const gg = c.createLinearGradient(x, y, x, y + h);
      gg.addColorStop(0, '#ffd166'); gg.addColorStop(1, 'rgba(255,209,102,0)');
      c.fillStyle = gg; G.gfx.rr(c, x, y, w, h, 6); c.fill();
      c.restore();
    }
    c.restore();
  }

  /* malha de rede (também serve para a rede a voar) */
  function malha(c, r, n, cor, alpha) {
    c.save();
    c.globalAlpha = alpha === undefined ? 1 : alpha;
    c.strokeStyle = cor; c.lineWidth = 1.8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); c.stroke();
    }
    for (let k = 1; k <= 3; k++) {
      c.beginPath(); c.arc(0, 0, (r * k) / 3, 0, TAU); c.stroke();
    }
    c.restore();
  }

  /* o herói: o Isaac de exploração, com o lenço nemes às riscas */
  function heroArt(c, t, o) {
    o = o || {};
    const walk = o.walk || 0;
    const l1 = Math.sin(walk) * 11, l2 = -Math.sin(walk) * 11;
    const momia = o.traje === 'momia', farao = o.traje === 'farao';
    const pele = momia ? '#f6efdc' : '#c98a55';          // braços e pernas
    const tunica = momia ? '#fdf6e3' : (farao ? '#e6b14a' : '#fdf6e3');
    c.lineCap = 'round';
    // pernas e sandálias
    c.strokeStyle = pele; c.lineWidth = 9;
    if (o.sit) {
      c.beginPath(); c.moveTo(-2, -30); c.lineTo(16, -16); c.stroke();
      c.beginPath(); c.moveTo(7, -30); c.lineTo(20, -12); c.stroke();
    } else if (o.sentado) {
      c.beginPath(); c.moveTo(-2, -24); c.lineTo(22, -18); c.stroke();
      c.beginPath(); c.moveTo(4, -24); c.lineTo(24, -8); c.stroke();
    } else {
      c.beginPath(); c.moveTo(-4, -30); c.lineTo(-4 + l1 * 0.6, -3); c.stroke();
      c.beginPath(); c.moveTo(6, -30); c.lineTo(6 + l2 * 0.6, -3); c.stroke();
      c.fillStyle = '#8d5524';
      c.beginPath();
      c.ellipse(-4 + l1 * 0.6, -1.5, 8, 3.4, 0, 0, TAU);
      c.ellipse(6 + l2 * 0.6, -1.5, 8, 3.4, 0, 0, TAU);
      c.fill();
    }
    const yb = o.sentado ? 12 : 0;                       // sentado, o corpo desce
    c.save(); c.translate(0, yb);
    // túnica (branca; dourada quando somos faraó; ligaduras quando somos múmia)
    c.fillStyle = tunica; G.gfx.rr(c, -15, -60, 32, 34, 11); c.fill();
    c.fillStyle = momia ? '#efe3c8' : '#e8c27a'; G.gfx.rr(c, -15, -41, 32, 7, 3); c.fill();
    if (momia) {
      c.strokeStyle = 'rgba(196,176,136,.9)'; c.lineWidth = 2.2;
      for (let i = 0; i < 5; i++) {
        c.beginPath();
        c.moveTo(-15, -56 + i * 7); c.quadraticCurveTo(1, -59 + i * 7, 17, -54 + i * 7);
        c.stroke();
      }
    }
    // colar largo egípcio
    c.fillStyle = '#4cc9f0';
    c.beginPath(); c.arc(1, -58, 13, 0.05, Math.PI - 0.05); c.fill();
    c.fillStyle = '#ef476f';
    c.beginPath(); c.arc(1, -58, 8, 0.1, Math.PI - 0.1); c.fill();
    // nódoas de quem já levou um nhac
    if (o.suja) {
      c.fillStyle = 'rgba(120,150,90,.55)';
      c.beginPath();
      c.arc(-7, -46, 4.5, 0, TAU); c.arc(8, -52, 3.6, 0, TAU); c.arc(-1, -35, 3.2, 0, TAU);
      c.fill();
    }
    // braços: o da frente aponta com a rede/arco/escaravelho
    c.strokeStyle = pele; c.lineWidth = 8;
    c.beginPath(); c.moveTo(-11, -52); c.lineTo(-19, -34 + Math.sin(walk) * 4); c.stroke();
    const braco = o.pose ? -0.9 : (o.acena ? -1.3 + Math.sin(t * 8) * 0.35 : -0.25);
    c.save(); c.translate(12, -52); c.rotate(braco);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(19, 2); c.stroke();
    if (o.cacador) {                                      // aro da rede na mão
      c.strokeStyle = '#8d5524'; c.lineWidth = 4;
      c.beginPath(); c.arc(28, 2, 10, 0, TAU); c.stroke();
      c.save(); c.translate(28, 2); malha(c, 9, 6, 'rgba(255,255,255,.95)', 0.95); c.restore();
    }
    c.restore();
    // cabeça
    c.fillStyle = momia ? '#fdf6e3' : '#ffd9b3';
    c.beginPath(); c.arc(1, -76, 15, 0, TAU); c.fill();
    if (momia) {                                          // ligaduras na cabeça
      c.strokeStyle = 'rgba(196,176,136,.9)'; c.lineWidth = 2.2;
      for (let i = -2; i <= 2; i++) {
        c.beginPath();
        c.moveTo(-14, -76 + i * 6); c.quadraticCurveTo(1, -79 + i * 6, 15, -74 + i * 6);
        c.stroke();
      }
      c.strokeStyle = '#fdf6e3'; c.lineWidth = 4;         // ligadura solta a abanar
      c.beginPath();
      c.moveTo(-14, -66);
      c.quadraticCurveTo(-28, -60 + Math.sin(t * 5) * 7, -40, -68 + Math.cos(t * 4) * 7);
      c.stroke();
    }
    // lenço nemes às riscas azuis e douradas
    c.save();
    if (momia) c.globalAlpha = 0;                         // a múmia não usa lenço
    c.beginPath(); c.arc(1, -78, 16.5, Math.PI, 0); c.closePath();
    c.fillStyle = '#3a86ff'; c.fill();
    c.strokeStyle = '#ffd166'; c.lineWidth = 3;
    for (let i = -12; i <= 12; i += 8) {
      c.beginPath(); c.moveTo(1 + i, -78); c.lineTo(1 + i, -94 + Math.abs(i) * 0.5); c.stroke();
    }
    c.fillStyle = '#3a86ff';                              // abas do lenço a cair
    G.gfx.rr(c, -19, -80, 10, 26, 4); c.fill();
    G.gfx.rr(c, 11, -80, 10, 26, 4); c.fill();
    c.fillStyle = '#ffd166'; G.gfx.rr(c, -17, -80, 3, 24, 2); c.fill();
    G.gfx.rr(c, 15, -80, 3, 24, 2); c.fill();
    c.fillStyle = '#ffd166';                              // faixa da testa
    G.gfx.rr(c, -14, -84, 30, 6, 3); c.fill();
    c.restore();
    if (farao) {                                          // coroa dupla e barbicha do faraó
      c.fillStyle = '#fdf6e3';
      c.beginPath(); c.ellipse(1, -98, 9, 15, 0, 0, TAU); c.fill();
      c.fillStyle = '#ef476f';
      c.beginPath();
      c.moveTo(-13, -84); c.lineTo(-13, -100);
      c.quadraticCurveTo(-1, -105, 11, -100); c.lineTo(13, -84);
      c.closePath(); c.fill();
      c.beginPath();
      c.moveTo(11, -101); c.quadraticCurveTo(23, -108, 18, -88); c.lineTo(11, -92);
      c.closePath(); c.fill();
      c.fillStyle = '#e0a63c';                            // uraeus
      c.beginPath(); c.arc(-2, -112, 4.5, 0, TAU); c.fill();
      c.fillStyle = '#3a86ff';                            // barbicha
      G.gfx.rr(c, 4, -66, 6, 15, 3); c.fill();
      c.fillStyle = '#ffd166';
      G.gfx.rr(c, -16, -62, 34, 6, 3); c.fill();          // colar de ouro
    }
    // cara
    c.fillStyle = '#2b2d42';
    c.beginPath(); c.arc(8, -76, 2.4, 0, TAU); c.fill();
    c.strokeStyle = '#2b2d42'; c.lineWidth = 2; c.lineCap = 'round';
    c.beginPath();
    if (o.tonto) { c.arc(6, -66, 5, Math.PI * 1.15, Math.PI * 1.85); }
    else { c.arc(6, -70, 5, 0.15 * Math.PI, 0.75 * Math.PI); }
    c.stroke();
    if (o.tonto) {                                        // estrelinhas de tonto
      for (let i = 0; i < 3; i++) {
        const a = t * 5 + (i / 3) * TAU;
        G.gfx.star(c, 1 + Math.cos(a) * 20, -96 + Math.sin(a) * 7, 5, '#ffd166', a);
      }
    }
    // arco às costas, depois de sermos caçadores
    if (o.cacador) {
      c.strokeStyle = '#8d5524'; c.lineWidth = 4;
      c.beginPath(); c.arc(-14, -54, 22, -1.15, 1.15); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(-5, -74); c.lineTo(-5, -34); c.stroke();
    }
    c.restore();
  }

  /* cobra colorida: corpo em onda, cabecinha, língua — e fitas quando é apanhada */
  function cobraArt(c, t, o) {
    const cor = CORES[o.ci], n = 9, seg = 15;
    const lev = o.levanta || 0;
    for (let i = n; i >= 1; i--) {
      const x = -i * seg;
      const y = -9 - Math.sin(o.wig - i * 0.66) * 5;
      const r = 10.5 - i * 0.62;
      c.fillStyle = i % 2 ? cor.c : cor.c2;
      c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    }
    const hy = -13 - lev - Math.sin(o.wig) * 4 + (o.state === 'venia' ? 7 : 0);
    c.fillStyle = cor.c;
    c.beginPath(); c.ellipse(4, hy, 13, 10.5, -0.15, 0, TAU); c.fill();
    c.fillStyle = cor.c2;                                   // capuz de cobra egípcia
    c.beginPath(); c.ellipse(-3, hy + 1, 9, 11, 0, 0, TAU); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(8, hy - 3, 3.6, 0, TAU); c.fill();
    c.fillStyle = '#2b2d42';
    c.beginPath();
    c.arc(9 + (o.state === 'persegue' ? 0.8 : 0), hy - 3, o.state === 'foge' ? 2.6 : 1.9, 0, TAU);
    c.fill();
    if (o.state === 'ri') {                                 // a rir da partida
      c.strokeStyle = '#2b2d42'; c.lineWidth = 1.8;
      c.beginPath(); c.arc(10, hy + 2, 4, 0.1, Math.PI * 0.9); c.stroke();
    } else if (Math.sin(t * 7 + o.wig) > 0.45) {            // língua
      c.strokeStyle = '#ef476f'; c.lineWidth = 2; c.lineCap = 'round';
      c.beginPath();
      c.moveTo(15, hy + 2); c.lineTo(24, hy + 3);
      c.moveTo(24, hy + 3); c.lineTo(28, hy + 0.5);
      c.moveTo(24, hy + 3); c.lineTo(28, hy + 5.5);
      c.stroke();
    }
    if (o.state === 'venia') {                              // vénia ao faraó
      G.gfx.star(c, 12, hy - 26, 6, '#ffd166', t * 3);
      G.gfx.star(c, -6, hy - 32, 4, '#ffe6a7', -t * 2);
    }
    if (o.state === 'foge') {                               // a fugir do escaravelho
      c.fillStyle = 'rgba(240,222,180,.85)';                // pozinho da corrida
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.arc(-26 - i * 12, -6 + Math.sin(t * 9 + i) * 5, 6 - i, 0, TAU);
        c.fill();
      }
      c.fillStyle = '#ef476f';                              // pontinhos de susto
      for (let i = -1; i <= 1; i += 2) {
        c.beginPath(); c.arc(6 + i * 9, hy - 21, 2.6, 0, TAU); c.fill();
      }
    }
    if (o.state === 'preso') {                              // as fitas de tecido a enrolar
      const k = Math.min(1, o.wrap);
      c.strokeStyle = 'rgba(255,255,255,.96)'; c.lineWidth = 7; c.lineCap = 'round';
      for (let i = 0; i <= n; i++) {
        if (i / n > k * 1.15) continue;
        const x = -i * seg, y = -9 - Math.sin(o.wig - i * 0.66) * 5;
        c.beginPath();
        c.moveTo(x - 8, y - 9 - i * 0.2); c.lineTo(x + 8, y + 9 + i * 0.2);
        c.stroke();
      }
      c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 4;
      c.beginPath();
      c.moveTo(10, hy - 14 - k * 10);
      c.quadraticCurveTo(24 + k * 20, hy - 20 - k * 16, 34 + k * 26, hy - 4 - k * 6);
      c.stroke();
    }
  }

  /* múmia de tecido: é assim que as cobras saem da rede — a saltitar e a acenar */
  function momiaCobraArt(c, t, o) {
    const cor = CORES[o.ci];
    const hop = Math.abs(Math.sin(t * 4 + o.hop)) * 9;
    c.save(); c.translate(0, -hop);
    // rolo de ligaduras
    for (let i = 3; i >= 1; i--) {
      c.fillStyle = i % 2 ? '#fdf6e3' : '#efe3c8';
      c.beginPath(); c.ellipse(-i * 4, -8 - i * 2, 15 - i, 8.5 - i * 0.6, 0, 0, TAU); c.fill();
    }
    c.fillStyle = '#fdf6e3';
    c.beginPath(); c.ellipse(3, -30, 14, 13, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(190,170,130,.9)'; c.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      c.beginPath();
      c.moveTo(-10, -30 + i * 5.5); c.quadraticCurveTo(3, -33 + i * 5.5, 16, -29 + i * 5.5);
      c.stroke();
    }
    // olhos grandes e contentes
    c.fillStyle = '#2b2d42';
    c.beginPath(); c.arc(6, -33, 2.8, 0, TAU); c.arc(13, -33, 2.6, 0, TAU); c.fill();
    c.strokeStyle = '#2b2d42'; c.lineWidth = 1.8; c.lineCap = 'round';
    c.beginPath(); c.arc(9, -27, 4.5, 0.12 * Math.PI, 0.88 * Math.PI); c.stroke();
    // laçarote da cor da cobra
    c.fillStyle = cor.c;
    c.beginPath();
    c.moveTo(-4, -40); c.lineTo(-13, -46); c.lineTo(-12, -35); c.closePath();
    c.moveTo(-4, -40); c.lineTo(5, -47); c.lineTo(3, -36); c.closePath();
    c.fill();
    c.fillStyle = cor.c2;
    c.beginPath(); c.arc(-4, -41, 3, 0, TAU); c.fill();
    // ligadura solta a abanar
    c.strokeStyle = '#fdf6e3'; c.lineWidth = 4;
    c.beginPath();
    c.moveTo(-16, -14);
    c.quadraticCurveTo(-28, -10 + Math.sin(t * 6) * 6, -38, -16 + Math.cos(t * 5) * 6);
    c.stroke();
    c.restore();
  }

  /* camelo: duas bossas, pescoço comprido e pestanas */
  function cameloArt(c, t, o) {
    const w = o.walk || 0;
    c.lineCap = 'round';
    c.strokeStyle = '#c99a55'; c.lineWidth = 11;
    for (let i = 0; i < 4; i++) {
      const x = -44 + i * 30, f = Math.sin(w + i * 1.6) * 12;
      c.beginPath(); c.moveTo(x, -74); c.lineTo(x + f * 0.5, -38); c.lineTo(x + f, -3); c.stroke();
    }
    c.fillStyle = '#e0b271';
    c.beginPath(); c.ellipse(0, -92, 62, 30, 0, 0, TAU); c.fill();
    c.beginPath(); c.arc(-20, -112, 20, Math.PI, 0); c.fill();       // bossas
    c.beginPath(); c.arc(18, -116, 22, Math.PI, 0); c.fill();
    c.strokeStyle = '#e0b271'; c.lineWidth = 22; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(50, -100);
    c.quadraticCurveTo(84, -110, 86, -150 + Math.sin(t * 1.6) * 5);
    c.stroke();
    c.fillStyle = '#e0b271';                                         // cabeça
    c.beginPath(); c.ellipse(92, -158 + Math.sin(t * 1.6) * 5, 20, 14, -0.25, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(107, -152 + Math.sin(t * 1.6) * 5, 11, 8, -0.1, 0, TAU); c.fill();
    c.fillStyle = '#c98a55';
    c.beginPath(); c.ellipse(82, -172 + Math.sin(t * 1.6) * 5, 5, 7, 0.4, 0, TAU); c.fill();  // orelha
    c.fillStyle = '#2b2d42';
    c.beginPath(); c.arc(98, -164 + Math.sin(t * 1.6) * 5, 2.6, 0, TAU); c.fill();
    c.strokeStyle = '#2b2d42'; c.lineWidth = 1.8;                    // pestanas
    for (let i = -1; i <= 1; i++) {
      c.beginPath();
      c.moveTo(97 + i * 3, -168 + Math.sin(t * 1.6) * 5);
      c.lineTo(96 + i * 4, -173 + Math.sin(t * 1.6) * 5);
      c.stroke();
    }
    c.strokeStyle = '#c99a55'; c.lineWidth = 5;                      // rabo
    c.beginPath();
    c.moveTo(-60, -100); c.quadraticCurveTo(-76, -92, -74, -66 + Math.sin(t * 3) * 5);
    c.stroke();
    // manta às cores por cima das bossas
    c.fillStyle = '#ef476f'; G.gfx.rr(c, -32, -122, 56, 16, 6); c.fill();
    c.fillStyle = '#4cc9f0'; G.gfx.rr(c, -32, -116, 56, 5, 2); c.fill();
    c.fillStyle = '#ffd166';
    for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(-28 + i * 13, -104, 3.4, 0, TAU); c.fill(); }
  }

  /* leopardo: pintinhas, orelhas redondas e rabo comprido */
  function leopardoArt(c, t, o) {
    const w = o.walk || 0;
    c.lineCap = 'round';
    c.strokeStyle = '#e8a33d'; c.lineWidth = 10;
    for (let i = 0; i < 4; i++) {
      const x = -38 + i * 26, f = Math.sin(w + i * 1.7) * 15;
      c.beginPath(); c.moveTo(x, -58); c.lineTo(x + f * 0.5, -30); c.lineTo(x + f, -3); c.stroke();
    }
    c.fillStyle = '#f4b350';
    c.beginPath(); c.ellipse(0, -70, 58, 26, 0, 0, TAU); c.fill();
    c.strokeStyle = '#f4b350'; c.lineWidth = 17;
    c.beginPath(); c.moveTo(44, -76); c.quadraticCurveTo(66, -84, 70, -96); c.stroke();
    c.fillStyle = '#f4b350';
    c.beginPath(); c.arc(76, -104, 20, 0, TAU); c.fill();
    c.beginPath(); c.arc(64, -120, 8, 0, TAU); c.arc(86, -120, 8, 0, TAU); c.fill();   // orelhas
    c.fillStyle = '#ffd9b3';
    c.beginPath(); c.ellipse(88, -100, 9, 7, 0, 0, TAU); c.fill();
    c.fillStyle = '#2b2d42';
    c.beginPath(); c.arc(82, -110, 2.8, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(94, -101, 3, 2.4, 0, 0, TAU); c.fill();
    c.strokeStyle = '#2b2d42'; c.lineWidth = 1.6;
    c.beginPath(); c.arc(90, -96, 5, 0.1 * Math.PI, 0.8 * Math.PI); c.stroke();
    for (let i = -1; i <= 1; i += 2) {                                                  // bigodes
      c.beginPath(); c.moveTo(94, -100 + i * 3); c.lineTo(112, -102 + i * 7); c.stroke();
    }
    c.strokeStyle = '#f4b350'; c.lineWidth = 8;                                         // rabo
    c.beginPath();
    c.moveTo(-52, -76);
    c.quadraticCurveTo(-84, -86, -80, -116 + Math.sin(t * 3) * 10);
    c.stroke();
    c.fillStyle = 'rgba(60,40,20,.75)';                                                 // pintinhas
    for (let i = 0; i < 14; i++) {
      const a = h01(i * 3.3) * TAU;
      c.beginPath();
      c.arc(-44 + h01(i * 5.1) * 88, -84 + h01(i * 7.7) * 30, 3.4 + h01(i * 2.2) * 1.8, 0, TAU);
      c.fill();
      c.beginPath(); c.arc(70 + Math.cos(a) * 9, -106 + Math.sin(a) * 9, 2.4, 0, TAU); c.fill();
    }
    c.fillStyle = '#ef476f'; G.gfx.rr(c, -22, -92, 44, 12, 5); c.fill();                // manta
  }

  /* pirâmide com porta, tochas e hieróglifos por cima da entrada */
  function piramideArt(c, p, t, brilho) {
    const w = p.w, h = p.h;
    c.fillStyle = 'rgba(150,110,60,.25)';                     // sombra na areia
    c.beginPath(); c.ellipse(10, 6, w * 0.56, 16, 0, 0, TAU); c.fill();
    c.fillStyle = '#eccb8a';
    c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(0, -h); c.lineTo(0, 0); c.closePath(); c.fill();
    c.fillStyle = '#c9a05a';
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -h); c.lineTo(w / 2, 0); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(120,85,35,.25)'; c.lineWidth = 1.6;  // fiadas de blocos
    const nb = 13;
    for (let i = 1; i < nb; i++) {
      const y = -h * i / nb, hw = (w / 2) * (1 - i / nb);
      c.beginPath(); c.moveTo(-hw, y); c.lineTo(hw, y); c.stroke();
    }
    c.fillStyle = '#ffd166';                                   // pedra dourada do topo
    c.beginPath();
    c.moveTo(-w * 0.075, -h * 0.925); c.lineTo(0, -h); c.lineTo(w * 0.075, -h * 0.925);
    c.closePath(); c.fill();
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + Math.sin(t * 2) * 0.12;
    const gg = c.createRadialGradient(0, -h, 2, 0, -h, 60);
    gg.addColorStop(0, '#fff3bf'); gg.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gg; c.beginPath(); c.arc(0, -h, 60, 0, TAU); c.fill();
    c.restore();

    // porta e túnel
    const dw = 52, dh = 128;
    c.fillStyle = '#7a5a2e';
    c.beginPath();
    c.moveTo(-dw - 12, 0); c.lineTo(-dw + 2, -dh - 14); c.lineTo(dw - 2, -dh - 14); c.lineTo(dw + 12, 0);
    c.closePath(); c.fill();
    c.fillStyle = '#241608';
    c.beginPath();
    c.moveTo(-dw, 0); c.lineTo(-dw + 8, -dh); c.lineTo(dw - 8, -dh); c.lineTo(dw, 0);
    c.closePath(); c.fill();
    const lg = c.createLinearGradient(0, -dh, 0, 0);           // luzinha quente lá dentro
    lg.addColorStop(0, 'rgba(255,180,80,.35)'); lg.addColorStop(1, 'rgba(255,140,40,0)');
    c.fillStyle = lg;
    c.beginPath();
    c.moveTo(-dw, 0); c.lineTo(-dw + 8, -dh); c.lineTo(dw - 8, -dh); c.lineTo(dw, 0);
    c.closePath(); c.fill();
    painelHier(c, -70, -dh - 76, 140, 58, p.i * 5.5, brilho);
    tochaArt(c, -dw - 30, -96, t, p.i);
    tochaArt(c, dw + 30, -96, t + 0.7, p.i + 2);
    if (brilho > 0) {                                          // porta a brilhar quando estamos seguros
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4 * brilho;
      const dg = c.createRadialGradient(0, -60, 5, 0, -60, 150);
      dg.addColorStop(0, '#ffd166'); dg.addColorStop(1, 'rgba(255,209,102,0)');
      c.fillStyle = dg; c.beginPath(); c.arc(0, -60, 150, 0, TAU); c.fill();
      c.restore();
    }
  }

  /* templo tipo Karnak: pilone com mastros, sala de colunas atrás e obeliscos à porta */
  function temploArt(c, p, t, brilho) {
    const w = p.w * 1.2, h = p.h;
    const dw = 56, dh = 158;
    c.fillStyle = 'rgba(150,110,60,.25)';
    c.beginPath(); c.ellipse(10, 6, w * 0.56, 16, 0, 0, TAU); c.fill();

    // sala das colunas, a espreitar por cima do pilone
    for (let k = -2; k <= 2; k++) {
      const x = k * 66, ch = h * 0.86 - Math.abs(k) * 10;
      c.fillStyle = k % 2 ? '#d9b878' : '#e0c48a';
      G.gfx.rr(c, x - 19, -ch, 38, ch, 6); c.fill();
      c.fillStyle = '#2f9e44';
      c.beginPath();
      c.moveTo(x - 28, -ch); c.quadraticCurveTo(x, -ch - 34, x + 28, -ch);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(120,85,35,.3)'; c.lineWidth = 1.6;
      for (let i = 1; i < 6; i++) {
        c.beginPath(); c.moveTo(x - 19, -ch + i * (ch / 6)); c.lineTo(x + 19, -ch + i * (ch / 6)); c.stroke();
      }
    }
    // arquitrave por cima das colunas
    c.fillStyle = '#c9a05a';
    G.gfx.rr(c, -w * 0.30, -h * 0.90, w * 0.60, 22, 5); c.fill();

    // as duas torres do pilone, inclinadas
    for (const lado of [-1, 1]) {
      c.fillStyle = lado < 0 ? '#eccb8a' : '#dcb877';
      c.beginPath();
      c.moveTo(lado * dw, 0);
      c.lineTo(lado * (dw + 6), -h);
      c.lineTo(lado * (w / 2 - 14), -h);
      c.lineTo(lado * (w / 2), 0);
      c.closePath(); c.fill();
      c.fillStyle = '#c9a05a';                       // cornija
      c.beginPath();
      c.moveTo(lado * (dw + 4), -h);
      c.lineTo(lado * (w / 2 - 16), -h);
      c.lineTo(lado * (w / 2 - 8), -h - 16);
      c.lineTo(lado * (dw + 2), -h - 16);
      c.closePath(); c.fill();
      painelHier(c, lado < 0 ? -w / 2 + 20 : dw + 22, -h + 30, w / 2 - dw - 40, h - 60,
                 p.i * 7.1 + (lado < 0 ? 0 : 3), brilho);
      // mastro com bandeirola
      const mx = lado * (dw + 34);
      c.strokeStyle = '#8d5524'; c.lineWidth = 6;
      c.beginPath(); c.moveTo(mx, -h - 10); c.lineTo(mx, -h - 92); c.stroke();
      c.fillStyle = lado < 0 ? '#ef476f' : '#4cc9f0';
      c.beginPath();
      c.moveTo(mx, -h - 92);
      c.quadraticCurveTo(mx + lado * 30, -h - 84 + Math.sin(t * 3 + lado) * 6, mx + lado * 46, -h - 66);
      c.lineTo(mx, -h - 58);
      c.closePath(); c.fill();
    }

    // entrada
    c.fillStyle = '#7a5a2e';
    G.gfx.rr(c, -dw - 8, -dh - 18, (dw + 8) * 2, 20, 4); c.fill();
    c.fillStyle = '#241608';
    c.beginPath();
    c.moveTo(-dw, 0); c.lineTo(-dw, -dh); c.lineTo(dw, -dh); c.lineTo(dw, 0);
    c.closePath(); c.fill();
    const lg = c.createLinearGradient(0, -dh, 0, 0);
    lg.addColorStop(0, 'rgba(255,190,90,.4)'); lg.addColorStop(1, 'rgba(255,140,40,0)');
    c.fillStyle = lg;
    c.beginPath();
    c.moveTo(-dw, 0); c.lineTo(-dw, -dh); c.lineTo(dw, -dh); c.lineTo(dw, 0);
    c.closePath(); c.fill();
    c.save(); c.translate(0, -dh - 8); glifo(c, 4, 40, brilho > 0 ? '#ffd166' : 'rgba(96,62,26,.85)'); c.restore();

    // obeliscos e tochas à porta
    for (const lado of [-1, 1]) {
      c.save(); c.translate(lado * (w / 2 + 46), 0); c.scale(0.62, 0.62);
      obeliscoArt(c, t, p.i * 3.3 + lado);
      c.restore();
    }
    tochaArt(c, -dw - 26, -104, t, p.i);
    tochaArt(c, dw + 26, -104, t + 0.7, p.i + 2);
    if (brilho > 0) {
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4 * brilho;
      const dg = c.createRadialGradient(0, -70, 5, 0, -70, 160);
      dg.addColorStop(0, '#ffd166'); dg.addColorStop(1, 'rgba(255,209,102,0)');
      c.fillStyle = dg; c.beginPath(); c.arc(0, -70, 160, 0, TAU); c.fill();
      c.restore();
    }
  }

  function tochaArt(c, x, y, t, seed) {
    c.save(); c.translate(x, y);
    c.fillStyle = '#6b4423'; G.gfx.rr(c, -5, -6, 10, 42, 4); c.fill();
    const f = 1 + Math.sin(t * 9 + (seed || 0)) * 0.16;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5;
    const gg = c.createRadialGradient(0, -14, 2, 0, -14, 60);
    gg.addColorStop(0, '#ffb703'); gg.addColorStop(1, 'rgba(255,183,3,0)');
    c.fillStyle = gg; c.beginPath(); c.arc(0, -14, 60, 0, TAU); c.fill();
    c.restore();
    c.fillStyle = '#f77f00'; c.beginPath();
    c.moveTo(-9, -8); c.quadraticCurveTo(-6, -26 * f, 0, -34 * f);
    c.quadraticCurveTo(6, -26 * f, 9, -8); c.closePath(); c.fill();
    c.fillStyle = '#ffd166'; c.beginPath();
    c.moveTo(-5, -9); c.quadraticCurveTo(-3, -20 * f, 0, -25 * f);
    c.quadraticCurveTo(3, -20 * f, 5, -9); c.closePath(); c.fill();
    c.restore();
  }

  function palmeira(c, s, t) {
    c.save(); c.scale(s, s);
    c.strokeStyle = '#a3743c'; c.lineWidth = 11; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(10, -60, 4, -116); c.stroke();
    c.strokeStyle = 'rgba(120,85,40,.45)'; c.lineWidth = 2;
    for (let i = 1; i < 7; i++) {
      const y = -i * 16;
      c.beginPath(); c.moveTo(-6 + i, y); c.lineTo(10 + i * 0.4, y - 2); c.stroke();
    }
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI * 0.9 + (i / 5) * Math.PI * 0.8 + Math.sin(t * 1.4 + i) * 0.06;
      c.save(); c.translate(4, -118); c.rotate(a);
      c.fillStyle = i % 2 ? '#2f9e44' : '#40916c';
      c.beginPath();
      c.moveTo(0, 0); c.quadraticCurveTo(34, -16, 66, -4);
      c.quadraticCurveTo(34, 6, 0, 6); c.closePath(); c.fill();
      c.restore();
    }
    c.fillStyle = '#c1670c';
    c.beginPath(); c.arc(-4, -110, 5, 0, TAU); c.arc(9, -108, 5, 0, TAU); c.arc(2, -102, 5, 0, TAU); c.fill();
    c.restore();
  }

  function obeliscoArt(c, t, seed) {
    c.fillStyle = 'rgba(150,110,60,.22)';
    c.beginPath(); c.ellipse(0, 4, 34, 9, 0, 0, TAU); c.fill();
    c.fillStyle = '#d9b878';
    c.beginPath();
    c.moveTo(-17, 0); c.lineTo(-12, -150); c.lineTo(12, -150); c.lineTo(17, 0);
    c.closePath(); c.fill();
    c.fillStyle = '#ffd166';
    c.beginPath(); c.moveTo(-12, -150); c.lineTo(0, -176); c.lineTo(12, -150); c.closePath(); c.fill();
    for (let i = 0; i < 5; i++) {
      c.save(); c.translate(0, -22 - i * 26);
      glifo(c, Math.floor(h01(seed + i * 2.7) * 8), 20, 'rgba(96,62,26,.8)');
      c.restore();
    }
  }

  function esfingeArt(c, s) {
    c.save(); c.scale(s, s);
    c.fillStyle = 'rgba(150,110,60,.22)';
    c.beginPath(); c.ellipse(0, 4, 96, 12, 0, 0, TAU); c.fill();
    c.fillStyle = '#d8b47a';
    G.gfx.rr(c, -92, -54, 168, 54, 12); c.fill();                 // corpo deitado
    c.beginPath(); c.ellipse(72, -18, 30, 16, 0, 0, TAU); c.fill();   // patas da frente
    c.fillStyle = '#c9a05a';
    G.gfx.rr(c, 38, -120, 54, 70, 14); c.fill();                  // pescoço/cabeça
    c.fillStyle = '#e5c493';
    c.beginPath(); c.arc(65, -108, 24, 0, TAU); c.fill();
    c.fillStyle = '#3a86ff';                                       // lenço nemes
    c.beginPath(); c.arc(65, -112, 26, Math.PI, 0); c.fill();
    G.gfx.rr(c, 39, -114, 12, 40, 5); c.fill();
    G.gfx.rr(c, 79, -114, 12, 40, 5); c.fill();
    c.fillStyle = '#ffd166'; G.gfx.rr(c, 42, -118, 46, 7, 3); c.fill();
    c.fillStyle = '#2b2d42';
    c.beginPath(); c.arc(74, -108, 3, 0, TAU); c.fill();
    c.strokeStyle = '#2b2d42'; c.lineWidth = 2;
    c.beginPath(); c.arc(72, -100, 6, 0.1 * Math.PI, 0.8 * Math.PI); c.stroke();
    c.restore();
  }

  /* itens que nascem quando somos mordidos: jarro de água do Nilo e flor de lótus */
  function jarroArt(c, t, tipo) {
    const bob = Math.sin(t * 2.6) * 4;
    c.save(); c.translate(0, bob);
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35;
    const gg = c.createRadialGradient(0, 0, 2, 0, 0, 46);
    gg.addColorStop(0, '#8ecae6'); gg.addColorStop(1, 'rgba(142,202,230,0)');
    c.fillStyle = gg; c.beginPath(); c.arc(0, 0, 46, 0, TAU); c.fill();
    c.restore();
    if (tipo === 'lotus') {
      c.fillStyle = '#2f9e44';
      c.beginPath(); c.ellipse(14, 12, 18, 6, 0.1, 0, TAU); c.fill();
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI * 0.9 + (i / 6) * Math.PI * 0.8;
        c.save(); c.rotate(a);
        c.fillStyle = i % 2 ? '#ff8fab' : '#ffc2d1';
        c.beginPath();
        c.moveTo(0, 6); c.quadraticCurveTo(-8, -14, 0, -26); c.quadraticCurveTo(8, -14, 0, 6);
        c.closePath(); c.fill();
        c.restore();
      }
      c.fillStyle = '#ffd166'; c.beginPath(); c.arc(0, -2, 6, 0, TAU); c.fill();
    } else {
      c.fillStyle = '#4cc9f0';
      c.beginPath();
      c.moveTo(-13, -16); c.quadraticCurveTo(-20, 4, -10, 16);
      c.lineTo(10, 16); c.quadraticCurveTo(20, 4, 13, -16); c.closePath(); c.fill();
      c.fillStyle = '#3a86ff'; G.gfx.rr(c, -15, -22, 30, 8, 3); c.fill();
      c.strokeStyle = '#3a86ff'; c.lineWidth = 3;
      c.beginPath(); c.arc(-16, -8, 7, -0.9, 1.5); c.stroke();
      c.beginPath(); c.arc(16, -8, 7, 1.6, 4.1); c.stroke();
      c.save(); c.translate(0, 0); glifo(c, 3, 16, 'rgba(255,255,255,.85)'); c.restore();
      c.fillStyle = 'rgba(255,255,255,.9)';
      c.beginPath(); c.arc(6 + Math.sin(t * 4) * 3, -28, 3, 0, TAU); c.fill();
    }
    c.restore();
  }

  /* escaravelho dourado a voar — o Khepri leva o disco do Sol às costas */
  function escaravelhoVoaArt(c, t, b) {
    const flap = Math.sin(t * 26 + b.wob) * 0.55;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35;
    const gg = c.createRadialGradient(0, 0, 2, 0, 0, 34);
    gg.addColorStop(0, '#ffd166'); gg.addColorStop(1, 'rgba(255,209,102,0)');
    c.fillStyle = gg; c.beginPath(); c.arc(0, 0, 34, 0, TAU); c.fill();
    c.restore();
    c.fillStyle = 'rgba(190,235,255,.7)';                    // asas a bater
    c.beginPath(); c.ellipse(-2, -9, 15, 6, -0.5 + flap, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(6, -9, 15, 6, 0.5 - flap, 0, TAU); c.fill();
    c.strokeStyle = '#8a5a12'; c.lineWidth = 2; c.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      c.beginPath(); c.moveTo(-2, i * 5); c.lineTo(-13, i * 7 - 3); c.stroke();
      c.beginPath(); c.moveTo(6, i * 5); c.lineTo(15, i * 7 - 3); c.stroke();
    }
    c.fillStyle = '#c98a29';
    c.beginPath(); c.ellipse(2, 0, 11, 13, 0, 0, TAU); c.fill();
    c.fillStyle = '#ffd166';
    c.beginPath(); c.ellipse(2, -3, 8.5, 8, 0, 0, TAU); c.fill();
    c.strokeStyle = '#8a5a12'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(2, -10); c.lineTo(2, 11); c.stroke();
    c.fillStyle = '#e07a3a';                                 // disco do Sol
    c.beginPath(); c.arc(2, -15, 5.5, 0, TAU); c.fill();
    c.fillStyle = '#2b2d42';
    c.beginPath(); c.arc(-1, 8, 1.8, 0, TAU); c.arc(6, 8, 1.8, 0, TAU); c.fill();
  }

  /* juncos de papiro da margem */
  function papiroArt(c, s, t, seed) {
    c.save(); c.scale(s, s);
    for (let k = 0; k < 4; k++) {
      const x = -18 + k * 12, h = 74 + h01(seed + k) * 46;
      const sw = Math.sin(t * 1.6 + k + seed) * 7;
      c.strokeStyle = '#5a8f3c'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + sw * 0.4, -h * 0.6, x + sw, -h); c.stroke();
      c.strokeStyle = '#87b34e'; c.lineWidth = 2.4;
      for (let i = 0; i < 6; i++) {                        // a "escova" do papiro
        const a = -Math.PI * 0.85 + (i / 5) * Math.PI * 0.7;
        c.beginPath();
        c.moveTo(x + sw, -h);
        c.lineTo(x + sw + Math.cos(a) * 15, -h + Math.sin(a) * 15);
        c.stroke();
      }
    }
    c.restore();
  }

  /* barca de papiro do Nilo, com as pontas levantadas e o olho de Hórus */
  function barcaArt(c, t, o) {
    const bob = Math.sin(t * 1.9 + (o.bob || 0)) * 3;
    c.save(); c.translate(0, bob);
    c.fillStyle = 'rgba(10,60,90,.28)';
    c.beginPath(); c.ellipse(0, 16, 76, 9, 0, 0, TAU); c.fill();
    c.fillStyle = '#dfae6a';
    c.beginPath();
    c.moveTo(-74, -16);
    c.quadraticCurveTo(0, 30, 74, -16);
    c.lineTo(74, -26);
    c.quadraticCurveTo(0, 12, -74, -26);
    c.closePath(); c.fill();
    c.strokeStyle = '#dfae6a'; c.lineWidth = 12; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-70, -20); c.quadraticCurveTo(-94, -30, -88, -58); c.stroke();
    c.beginPath(); c.moveTo(70, -20); c.quadraticCurveTo(94, -30, 88, -58); c.stroke();
    c.fillStyle = '#ff8fab';                               // flores de lótus nas pontas
    for (const lado of [-1, 1]) {
      c.save(); c.translate(lado * 88, -64);
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI * 0.9 + (i / 4) * Math.PI * 0.8;
        c.save(); c.rotate(a);
        c.beginPath(); c.moveTo(0, 4); c.quadraticCurveTo(-4, -6, 0, -13);
        c.quadraticCurveTo(4, -6, 0, 4); c.closePath(); c.fill();
        c.restore();
      }
      c.restore();
    }
    c.strokeStyle = 'rgba(150,110,60,.55)'; c.lineWidth = 2;   // riscas de junco
    for (let k = -2; k <= 2; k++) {
      c.beginPath();
      c.moveTo(-70, -20 + k * 4); c.quadraticCurveTo(0, 22 + k * 4, 70, -20 + k * 4);
      c.stroke();
    }
    c.save(); c.translate(-30, -6); glifo(c, 1, 26, 'rgba(50,35,15,.75)'); c.restore();
    c.fillStyle = '#4cc9f0'; G.gfx.rr(c, 24, -26, 34, 8, 3); c.fill();   // almofada
    c.strokeStyle = '#8d5524'; c.lineWidth = 5;                          // remo
    c.beginPath(); c.moveTo(40, -24); c.lineTo(78, 6); c.stroke();
    c.fillStyle = '#8d5524';
    c.beginPath(); c.ellipse(80, 9, 9, 5, 0.6, 0, TAU); c.fill();
    c.restore();
  }

  /* crocodilo: à superfície vêem-se só os olhos e o focinho; a saltar vê-se tudo */
  function crocArt(c, t, cr) {
    if (cr.state === 'salta') {
      const u = Math.min(1, cr.jt / 0.85);
      const dir = cr.jx1 >= cr.jx0 ? 1 : -1;
      c.save(); c.scale(dir, 1); c.rotate(-Math.cos(u * Math.PI) * 0.55 * dir * dir);
      c.fillStyle = '#3f8f4f';                                  // cauda
      c.beginPath();
      c.moveTo(-30, -16); c.quadraticCurveTo(-72, -20, -92, -2);
      c.quadraticCurveTo(-66, -6, -30, 2); c.closePath(); c.fill();
      c.fillStyle = '#4faa5c';
      c.beginPath(); c.ellipse(-4, -8, 40, 18, 0, 0, TAU); c.fill();
      c.fillStyle = '#a8d9a0';                                  // barriga
      c.beginPath(); c.ellipse(-4, 0, 34, 9, 0, 0, TAU); c.fill();
      c.strokeStyle = '#3f8f4f'; c.lineWidth = 8; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-18, 4); c.lineTo(-28, 20); c.stroke();
      c.beginPath(); c.moveTo(14, 4); c.lineTo(6, 22); c.stroke();
      c.fillStyle = '#4faa5c';                                  // focinho comprido
      G.gfx.rr(c, 30, -18, 54, 20, 8); c.fill();
      c.fillStyle = '#fdf6e3';                                  // dentinhos de brincadeira
      for (let i = 0; i < 6; i++) {
        c.beginPath();
        c.moveTo(38 + i * 8, -2); c.lineTo(42 + i * 8, 6); c.lineTo(46 + i * 8, -2);
        c.closePath(); c.fill();
      }
      c.fillStyle = '#4faa5c';
      c.beginPath(); c.arc(24, -26, 9, 0, TAU); c.arc(38, -26, 8, 0, TAU); c.fill();
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(38, -28, 4.6, 0, TAU); c.fill();
      c.fillStyle = '#2b2d42';
      c.beginPath(); c.arc(39, -28, 2.4, 0, TAU); c.fill();
      c.fillStyle = '#3f8f4f';                                  // cristas
      for (let i = 0; i < 5; i++) {
        c.beginPath();
        c.moveTo(-26 + i * 13, -22); c.lineTo(-20 + i * 13, -32); c.lineTo(-14 + i * 13, -22);
        c.closePath(); c.fill();
      }
      c.restore();
      return;
    }
    // à superfície: rasto, focinho e olhinhos
    c.save(); c.scale(cr.dir < 0 ? -1 : 1, 1);
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2;
    for (let k = 1; k <= 3; k++) {
      c.beginPath();
      c.ellipse(-30 * k, 3, 22 + k * 8, 5 + k, 0, Math.PI * 1.05, Math.PI * 1.95);
      c.stroke();
    }
    c.fillStyle = '#3f8f4f';
    for (let i = 0; i < 4; i++) {                               // costas fora de água
      c.beginPath();
      c.moveTo(-16 - i * 15, 2); c.lineTo(-10 - i * 15, -9 + Math.sin(cr.wig + i) * 2);
      c.lineTo(-4 - i * 15, 2); c.closePath(); c.fill();
    }
    c.fillStyle = '#4faa5c';
    G.gfx.rr(c, 6, -9, 46, 12, 6); c.fill();                    // focinho
    c.beginPath(); c.arc(0, -12, 8, 0, TAU); c.arc(-11, -11, 7, 0, TAU); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(1, -14, 4, 0, TAU); c.fill();
    c.fillStyle = '#2b2d42';
    c.beginPath(); c.arc(2, -14, 2.2, 0, TAU); c.fill();
    if (cr.state === 'aviso') {                                 // vai saltar!
      c.fillStyle = '#ef476f';
      c.save(); c.scale(cr.dir < 0 ? -1 : 1, 1);
      G.gfx.rr(c, -3, -46, 6, 16, 3); c.fill();
      c.beginPath(); c.arc(0, -25, 3.4, 0, TAU); c.fill();
      c.restore();
    }
    if (cr.ri > 0) {                                            // a rir da lambidela
      G.gfx.star(c, 20, -30, 7, '#ffd166', cr.ri * 6);
    }
    c.restore();
  }

  function redeArt(c, r) {
    c.save(); c.translate(0, 0); c.rotate(r.rot);
    c.fillStyle = 'rgba(255,255,255,.18)';
    c.beginPath(); c.arc(0, 0, 22, 0, TAU); c.fill();
    malha(c, 22, 8, 'rgba(255,255,255,.95)', 1);
    c.strokeStyle = '#fdf6e3'; c.lineWidth = 3.4;
    c.beginPath(); c.arc(0, 0, 22, 0, TAU); c.stroke();
    c.fillStyle = '#e9d9b5';
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU;
      c.beginPath(); c.arc(Math.cos(a) * 22, Math.sin(a) * 22, 3.6, 0, TAU); c.fill();
    }
    c.restore();
  }

  function setaArt(c, s) {
    c.save(); c.scale(s.dir, 1);
    c.strokeStyle = '#a3743c'; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-22, 0); c.lineTo(16, 0); c.stroke();
    c.fillStyle = '#ef476f';                                   // ventosa (é de brincar!)
    c.beginPath(); c.ellipse(20, 0, 7, 8, 0, 0, TAU); c.fill();
    c.fillStyle = '#4cc9f0';                                   // penas
    c.beginPath(); c.moveTo(-22, 0); c.lineTo(-32, -8); c.lineTo(-26, 0); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-22, 0); c.lineTo(-32, 8); c.lineTo(-26, 0); c.closePath(); c.fill();
    c.strokeStyle = '#ffd166'; c.lineWidth = 2.4;              // fita a esvoaçar
    c.beginPath();
    c.moveTo(-24, 0);
    c.quadraticCurveTo(-38, Math.sin(s.t * 18) * 8, -52, Math.cos(s.t * 15) * 9);
    c.stroke();
    c.restore();
  }

  /* o faraó Pitamena: coroa nemes, barbicha e cajado — e as fitas a enrolá-lo */
  function faraoArt(c, t, o) {
    o = o || {};
    const wrap = Math.max(0, Math.min(1, o.wrap || 0));
    c.lineCap = 'round';
    c.strokeStyle = '#c98a55'; c.lineWidth = 10;
    c.beginPath(); c.moveTo(-5, -40); c.lineTo(-7, -3); c.stroke();
    c.beginPath(); c.moveTo(7, -40); c.lineTo(9, -3); c.stroke();
    c.fillStyle = '#fdf6e3'; G.gfx.rr(c, -18, -50, 36, 22, 6); c.fill();     // saiote
    c.fillStyle = '#e0a63c'; G.gfx.rr(c, -19, -80, 38, 34, 12); c.fill();    // torso dourado
    c.fillStyle = '#4cc9f0';
    c.beginPath(); c.arc(0, -78, 16, 0.05, Math.PI - 0.05); c.fill();
    c.fillStyle = '#ef476f';
    c.beginPath(); c.arc(0, -78, 10, 0.1, Math.PI - 0.1); c.fill();
    c.strokeStyle = '#e0a63c'; c.lineWidth = 9;                              // braços
    c.beginPath(); c.moveTo(-16, -72); c.lineTo(-30, -52); c.stroke();
    const bra = o.acena ? -1.25 + Math.sin(t * 7) * 0.4 : -0.5;
    c.save(); c.translate(16, -72); c.rotate(bra);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(20, 0); c.stroke();
    c.restore();
    c.fillStyle = '#ffd9b3';                                                 // cabeça
    c.beginPath(); c.arc(0, -98, 16, 0, TAU); c.fill();
    c.fillStyle = '#3a86ff';                                                 // nemes
    c.beginPath(); c.arc(0, -100, 18, Math.PI, 0); c.fill();
    G.gfx.rr(c, -21, -102, 12, 34, 5); c.fill();
    G.gfx.rr(c, 9, -102, 12, 34, 5); c.fill();
    c.fillStyle = '#ffd166';
    G.gfx.rr(c, -19, -104, 12, 30, 5); c.fill();
    G.gfx.rr(c, 11, -104, 4, 30, 2); c.fill();
    G.gfx.rr(c, -17, -108, 34, 8, 4); c.fill();
    c.fillStyle = '#e0a63c';                                                 // uraeus (a cobrinha de ouro)
    c.beginPath(); c.arc(0, -116, 5, 0, TAU); c.fill();
    c.fillStyle = '#2b2d42';
    c.beginPath(); c.arc(6, -98, 2.6, 0, TAU); c.fill();
    c.strokeStyle = '#2b2d42'; c.lineWidth = 2;
    c.beginPath(); c.arc(3, -92, 6, 0.12 * Math.PI, 0.85 * Math.PI); c.stroke();
    c.fillStyle = '#3a86ff';                                                 // barbicha
    G.gfx.rr(c, -2, -86, 6, 14, 3); c.fill();
    if (!o.semCajado) {                                                      // cajado (só enfeite)
      c.strokeStyle = '#ffd166'; c.lineWidth = 5;
      c.beginPath(); c.moveTo(-34, -34); c.lineTo(-34, -104); c.stroke();
      c.beginPath(); c.arc(-27, -104, 7, Math.PI, TAU); c.stroke();
    }
    if (wrap > 0) {                                                          // fitas de tecido a enrolar
      c.strokeStyle = 'rgba(253,246,227,.97)'; c.lineWidth = 9; c.lineCap = 'round';
      const n = 12;
      for (let i = 0; i < n; i++) {
        if (i / n > wrap) continue;
        const y = -8 - i * 9;
        const bal = Math.sin(t * 3 + i) * 3;
        c.beginPath();
        c.moveTo(-22 + bal, y - 4); c.quadraticCurveTo(0, y + 4, 22 + bal, y - 4);
        c.stroke();
      }
      if (wrap > 0.8) {
        c.fillStyle = '#2b2d42';                                             // olhinhos felizes na múmia
        c.beginPath(); c.arc(-5, -100, 2.6, 0, TAU); c.arc(6, -100, 2.6, 0, TAU); c.fill();
        c.strokeStyle = '#2b2d42'; c.lineWidth = 2;
        c.beginPath(); c.arc(0, -94, 5, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke();
      }
    }
  }

  /* múmia amiga (a que traz água e as que dançam na câmara) */
  function momiaArt(c, t, o) {
    o = o || {};
    const dan = o.danca ? Math.sin(t * 5) * 0.12 : 0;
    c.save(); c.rotate(dan);
    c.lineCap = 'round';
    c.strokeStyle = '#efe3c8'; c.lineWidth = 11;
    c.beginPath(); c.moveTo(-5, -34); c.lineTo(-7, -3); c.stroke();
    c.beginPath(); c.moveTo(6, -34); c.lineTo(9, -3); c.stroke();
    c.fillStyle = '#fdf6e3'; G.gfx.rr(c, -17, -74, 34, 44, 12); c.fill();
    c.strokeStyle = 'rgba(196,176,136,.9)'; c.lineWidth = 2.2;
    for (let i = 0; i < 6; i++) {
      c.beginPath();
      c.moveTo(-17, -70 + i * 7); c.quadraticCurveTo(0, -73 + i * 7, 17, -68 + i * 7);
      c.stroke();
    }
    c.strokeStyle = '#fdf6e3'; c.lineWidth = 9;
    const a1 = o.jarro ? -0.55 : (o.acena ? -1.25 + Math.sin(t * 7) * 0.35 : -0.2 + Math.sin(t * 3) * 0.2);
    c.save(); c.translate(14, -66); c.rotate(a1);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(20, 0); c.stroke();
    if (o.jarro) {                                                  // o jarro a verter água
      c.fillStyle = '#4cc9f0';
      c.beginPath();
      c.moveTo(18, -10); c.quadraticCurveTo(12, 4, 22, 10);
      c.lineTo(36, 8); c.quadraticCurveTo(42, -4, 34, -12); c.closePath(); c.fill();
    }
    c.restore();
    c.save(); c.translate(-14, -66); c.rotate(0.2 - Math.sin(t * 3) * 0.2);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(-18, 4); c.stroke();
    c.restore();
    c.fillStyle = '#fdf6e3';
    c.beginPath(); c.arc(0, -90, 16, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(196,176,136,.9)'; c.lineWidth = 2.2;
    for (let i = -1; i <= 2; i++) {
      c.beginPath();
      c.moveTo(-15, -94 + i * 7); c.quadraticCurveTo(0, -97 + i * 7, 15, -92 + i * 7);
      c.stroke();
    }
    c.fillStyle = '#2b2d42';
    c.beginPath(); c.arc(-5, -92, 2.8, 0, TAU); c.arc(6, -92, 2.8, 0, TAU); c.fill();
    c.strokeStyle = '#2b2d42'; c.lineWidth = 2;
    c.beginPath(); c.arc(0, -86, 5.5, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke();
    c.strokeStyle = '#fdf6e3'; c.lineWidth = 4;                     // ligadura solta
    c.beginPath();
    c.moveTo(-16, -40); c.quadraticCurveTo(-30, -34 + Math.sin(t * 5) * 7, -42, -42 + Math.cos(t * 4) * 7);
    c.stroke();
    c.restore();
  }

  /* sarcófago dourado com tampa que fecha e uma janelinha para o faraó acenar */
  function sarcofagoArt(c, t, o) {
    o = o || {};
    const tampa = Math.max(0, Math.min(1, o.tampa || 0));
    c.fillStyle = 'rgba(90,60,20,.35)';
    c.beginPath(); c.ellipse(0, 6, 58, 12, 0, 0, TAU); c.fill();
    c.fillStyle = '#8d6a2f';                                        // caixa
    c.beginPath();
    c.moveTo(-42, 0); c.lineTo(-42, -140);
    c.quadraticCurveTo(0, -186, 42, -140); c.lineTo(42, 0); c.closePath(); c.fill();
    c.fillStyle = '#241608';
    c.beginPath();
    c.moveTo(-33, -6); c.lineTo(-33, -138);
    c.quadraticCurveTo(0, -176, 33, -138); c.lineTo(33, -6); c.closePath(); c.fill();
    if (tampa > 0) {                                                // a tampa a descer
      c.save();
      c.translate(0, -190 * (1 - tampa));
      c.fillStyle = '#e0a63c';
      c.beginPath();
      c.moveTo(-36, -4); c.lineTo(-36, -138);
      c.quadraticCurveTo(0, -180, 36, -138); c.lineTo(36, -4); c.closePath(); c.fill();
      c.fillStyle = '#3a86ff';                                      // cara da tampa
      c.beginPath(); c.arc(0, -132, 26, Math.PI, 0); c.fill();
      G.gfx.rr(c, -30, -134, 14, 44, 6); c.fill();
      G.gfx.rr(c, 16, -134, 14, 44, 6); c.fill();
      c.fillStyle = '#ffd9b3';
      c.beginPath(); c.arc(0, -126, 20, 0, TAU); c.fill();
      c.fillStyle = '#ffd166'; G.gfx.rr(c, -24, -142, 48, 9, 4); c.fill();
      c.fillStyle = '#2b2d42';
      c.beginPath(); c.arc(-7, -128, 3, 0, TAU); c.arc(7, -128, 3, 0, TAU); c.fill();
      c.strokeStyle = '#2b2d42'; c.lineWidth = 2.4;
      c.beginPath(); c.arc(0, -120, 7, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke();
      c.fillStyle = '#e0a63c';
      G.gfx.rr(c, -30, -92, 60, 10, 4); c.fill();
      painelHier(c, -26, -76, 52, 62, 12.5, o.luz || 0);
      if (tampa > 0.94 && o.janela) {                               // o Pitamena a acenar lá de dentro
        c.save();
        c.translate(0, -46);
        c.fillStyle = '#241608';
        G.gfx.rr(c, -17, -16, 34, 30, 6); c.fill();
        c.fillStyle = '#ffd9b3';
        c.beginPath(); c.arc(0, 2, 10, 0, TAU); c.fill();
        c.fillStyle = '#2b2d42';
        c.beginPath(); c.arc(-4, 0, 1.9, 0, TAU); c.arc(4, 0, 1.9, 0, TAU); c.fill();
        c.strokeStyle = '#2b2d42'; c.lineWidth = 1.7;
        c.beginPath(); c.arc(0, 4, 4, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke();
        c.strokeStyle = '#ffd9b3'; c.lineWidth = 5; c.lineCap = 'round';
        c.beginPath();
        c.moveTo(11, 4); c.lineTo(15 + Math.sin(t * 8) * 4, -8 + Math.cos(t * 8) * 3);
        c.stroke();
        c.restore();
      }
      c.restore();
    }
    c.fillStyle = '#ffd166';                                        // enfeites de ouro na caixa
    G.gfx.rr(c, -46, -8, 92, 10, 4); c.fill();
  }

  /* escriba sentado com papiro — "outras personagens do antigo Egito" */
  function escribaArt(c, t) {
    c.fillStyle = '#c98a55';
    G.gfx.rr(c, -26, -22, 54, 20, 8); c.fill();                     // pernas cruzadas
    c.fillStyle = '#fdf6e3'; G.gfx.rr(c, -16, -60, 34, 40, 10); c.fill();
    c.fillStyle = '#ffd9b3';
    c.beginPath(); c.arc(0, -74, 14, 0, TAU); c.fill();
    c.fillStyle = '#2b2d42';
    c.beginPath(); c.arc(0, -80, 15, Math.PI, 0); c.fill();
    c.beginPath(); c.arc(5, -74, 2.2, 0, TAU); c.fill();
    c.fillStyle = '#efe3c8';                                        // papiro
    G.gfx.rr(c, -6, -44, 40, 22, 4); c.fill();
    c.strokeStyle = '#c98a55'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(14, -56); c.lineTo(24 + Math.sin(t * 6) * 4, -44);
    c.stroke();
    for (let i = 0; i < 3; i++) {
      c.save(); c.translate(2 + i * 12, -33); glifo(c, i + 2, 12, 'rgba(96,62,26,.8)'); c.restore();
    }
  }

  /* gata Bastet de pedra, a guardar a câmara */
  function gataArt(c, t) {
    c.fillStyle = '#3a2f22';
    G.gfx.rr(c, -16, -56, 32, 56, 12); c.fill();
    c.beginPath(); c.arc(0, -66, 15, 0, TAU); c.fill();
    c.beginPath();
    c.moveTo(-13, -74); c.lineTo(-16, -92); c.lineTo(-3, -78); c.closePath();
    c.moveTo(13, -74); c.lineTo(16, -92); c.lineTo(3, -78); c.closePath();
    c.fill();
    c.strokeStyle = '#3a2f22'; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(14, -6); c.quadraticCurveTo(34, -6, 30, -34); c.stroke();
    c.fillStyle = '#ffd166';
    c.beginPath(); c.ellipse(-5, -68, 3, 4.5, 0, 0, TAU); c.ellipse(6, -68, 3, 4.5, 0, 0, TAU); c.fill();
    G.gfx.rr(c, -13, -54, 26, 7, 3); c.fill();                      // colar de ouro
  }

  /* =====================================================================
     DESENHO DAS CENAS
     ===================================================================== */
  function drawHero(c, t) {
    const x = hero.x - camX, y = sy(hero.alt);
    if (seguro() && !hero.monta) {                       // escudinho de "aqui ninguém morde"
      c.save(); c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.3 + Math.sin(t * 4) * 0.08;
      const gg = c.createRadialGradient(x, y - 52, 4, x, y - 52, 92);
      gg.addColorStop(0, '#ffe6a7'); gg.addColorStop(1, 'rgba(255,230,167,0)');
      c.fillStyle = gg; c.beginPath(); c.arc(x, y - 52, 92, 0, TAU); c.fill();
      c.restore();
    }
    c.save(); c.translate(x, y); c.scale(hero.dir < 0 ? -1 : 1, 1);
    if (hero.inv > 0 && hero.sentado <= 0 && Math.floor(t * 12) % 2 === 0) c.globalAlpha = 0.55;
    const op = {
      walk: hero.walk, suja: hero.suja > 0, cacador: cacador,
      pose: hero.pose > 0, tonto: hero.tonto > 0, sentado: hero.sentado > 0,
      acena: festaT > 0,                                // nas festas acena com o braço
      traje: traje
    };
    if (hero.monta) {
      const m = hero.monta;
      if (m.tipo === 'camelo') {
        cameloArt(c, t, { walk: m.walk });
        c.save(); c.translate(-4, -120); c.scale(0.86, 0.86);
        op.sit = true; op.walk = 0; heroArt(c, t, op);
        c.restore();
      } else {
        leopardoArt(c, t, { walk: m.walk });
        c.save(); c.translate(0, -94); c.scale(0.8, 0.8);
        op.sit = true; op.walk = 0; heroArt(c, t, op);
        c.restore();
      }
    } else {
      heroArt(c, t, op);
    }
    c.restore();
    if (ajuda) {                                          // a múmia que traz a água
      c.save(); c.translate(ajuda.x - camX, sy(hero.alt));
      c.scale(ajuda.x > hero.x ? -1 : 1, 1);
      momiaArt(c, t, { jarro: ajuda.verte > 0.2, acena: ajuda.verte <= 0.2 });
      c.restore();
    }
  }

  function drawEntidades(c, t) {
    for (const it of itens) {
      c.save(); c.translate(it.x - camX, sy(it.alt)); jarroArt(c, it.t, it.tipo); c.restore();
    }
    for (const f of amigas) {
      c.save(); c.translate(f.x - camX, sy(f.alt)); momiaCobraArt(c, t, f); c.restore();
    }
    for (const cb of cobras) {
      c.save(); c.translate(cb.x - camX, sy(cb.alt)); c.scale(cb.dir < 0 ? -1 : 1, 1);
      cobraArt(c, t, cb); c.restore();
    }
    drawHero(c, t);
    for (const r of redes) { c.save(); c.translate(r.x - camX, sy(r.alt)); redeArt(c, r); c.restore(); }
    for (const s of setas) { c.save(); c.translate(s.x - camX, sy(s.alt)); setaArt(c, s); c.restore(); }
    for (const b of bichos) {
      c.save(); c.translate(b.x - camX, sy(b.alt));
      c.scale(b.vx < 0 ? -1 : 1, 1);
      escaravelhoVoaArt(c, t, b);
      c.restore();
    }
    for (const g of graos) {                              // a areia que faz as cobras espirrar
      c.globalAlpha = Math.max(0, 1 - g.t / g.life);
      c.fillStyle = '#efdcb0';
      c.beginPath(); c.arc(g.x - camX, sy(g.alt), 3.4, 0, TAU); c.fill();
    }
    c.globalAlpha = 1;
    for (const p of puffs) {
      c.globalAlpha = Math.max(0, 0.8 * (1 - p.t / p.life));
      c.fillStyle = p.cor;
      c.beginPath(); c.arc(p.x - camX, sy(p.alt), p.r, 0, TAU); c.fill();
    }
    c.globalAlpha = 1;
    for (const s of sparks) {
      c.globalAlpha = Math.max(0, 1 - s.t / s.life);
      G.gfx.star(c, s.x - camX, sy(s.alt), 7, s.cor, s.t * 6);
    }
    c.globalAlpha = 1;
    for (const f of confetes) {
      c.globalAlpha = Math.max(0, 1 - f.t / f.life);
      c.save(); c.translate(f.x - camX, sy(f.alt)); c.rotate(f.rot);
      c.fillStyle = f.cor; c.fillRect(-5, -3, 10, 6);
      c.restore();
    }
    c.globalAlpha = 1;
  }

  // setinha dourada a dizer "entra aqui" (desenhada, sem emoji dentro do canvas)
  function setaEntrar(c, x, y, t) {
    const b = Math.sin(t * 4) * 7;
    c.save(); c.translate(x, y + b);
    c.fillStyle = '#ffd166'; c.strokeStyle = '#b56b00'; c.lineWidth = 3; c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(0, -22); c.lineTo(18, 2); c.lineTo(7, 2); c.lineTo(7, 20);
    c.lineTo(-7, 20); c.lineTo(-7, 2); c.lineTo(-18, 2); c.closePath();
    c.fill(); c.stroke();
    c.restore();
  }

  function desenhaRio(c, r, t) {
    const yS = sy(r.nivel);
    c.save();
    c.beginPath();
    c.moveTo(r.x0 - 200 - camX, yS);
    for (let wx = r.x0 - 200; wx <= r.x1 + 200; wx += 12) c.lineTo(wx - camX, Math.max(yS, sy(chao(wx))));
    c.lineTo(r.x1 + 200 - camX, yS);
    c.closePath();
    const g = c.createLinearGradient(0, yS, 0, sy(r.leito) + 40);
    g.addColorStop(0, 'rgba(96,208,238,.95)'); g.addColorStop(1, 'rgba(18,92,128,.95)');
    c.fillStyle = g; c.fill();
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2;      // ondinhas
    for (let k = 0; k < 7; k++) {
      const wx = r.x0 + 40 + ((r.x1 - r.x0 - 80) * k) / 6 + Math.sin(t * 1.2 + k) * 16;
      const y = yS + 10 + (k % 3) * 12;
      c.beginPath();
      c.moveTo(wx - camX - 20, y); c.quadraticCurveTo(wx - camX, y - 5, wx - camX + 20, y);
      c.stroke();
    }
    c.fillStyle = 'rgba(255,255,255,.5)';
    for (let k = 0; k < 5; k++) {
      const wx = r.x0 + 90 + ((r.x1 - r.x0 - 180) * k) / 4;
      c.beginPath();
      c.ellipse(wx - camX + Math.sin(t * 0.8 + k) * 24, yS + 4, 12, 2.4, 0, 0, TAU);
      c.fill();
    }
    // juncos nas margens
    c.save(); c.translate(r.x0 - 26 - camX, sy(chao(r.x0 - 26))); papiroArt(c, 1, t, r.i * 2.3); c.restore();
    c.save(); c.translate(r.x1 + 26 - camX, sy(chao(r.x1 + 26))); c.scale(-1, 1); papiroArt(c, 1, t, r.i * 4.7); c.restore();
    for (const cr of crocsDe(r)) {                                 // os que estão na água
      if (cr.state === 'salta') continue;
      c.save(); c.translate(cr.x - camX, sy(r.nivel)); crocArt(c, t, cr); c.restore();
    }
    const b = barcaDe(r);                                          // a barca
    c.save(); c.translate(b.x - camX, sy(r.nivel)); barcaArt(c, t, b); c.restore();
    if (hero.barca === null && Math.abs(hero.x - b.x) < 260 && Math.abs(hero.alt - r.nivel) < 220) {
      setaEntrar(c, b.x - camX, sy(r.nivel) - 120, t);
    }
  }
  function desenhaCrocsNoAr(c, t) {
    const i0 = Math.floor((camX - 500) / SLOT), i1 = Math.floor((camX + vw() + 500) / SLOT);
    for (let i = Math.max(0, i0); i <= i1; i++) {
      const r = rioAt(i);
      if (!r || !crocs[i]) continue;
      for (const cr of crocs[i]) {
        if (cr.state !== 'salta') continue;
        c.save(); c.translate(cr.x - camX, sy(cr.alt)); crocArt(c, t, cr); c.restore();
      }
    }
  }

  function drawDeserto(c, t) {
    const W = vw(), H = vh(), horiz = chaoY() + 10;
    let g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#4ea8e8'); g.addColorStop(0.42, '#a9dcf5');
    g.addColorStop(0.76, '#ffe3ab'); g.addColorStop(1, '#ffcf8a');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    G.gfx.sun(c, W * 0.8, H * 0.15, Math.min(W, H) * 0.07, t);

    // pirâmides ao longe
    c.fillStyle = 'rgba(203,166,112,.55)';
    for (let i = 0; i < 7; i++) {
      const per = 620, tot = 7 * per;
      const x = ((i * per - camX * 0.3) % tot + tot) % tot - per;
      const hh = 118 + (i % 3) * 46, hw = hh * 0.95;
      c.beginPath();
      c.moveTo(x - hw, horiz - 62); c.lineTo(x, horiz - 62 - hh); c.lineTo(x + hw, horiz - 62);
      c.closePath(); c.fill();
    }
    // duas camadas de dunas de fundo
    function fundoDuna(k, cor, amp, off, dy) {
      c.fillStyle = cor;
      c.beginPath(); c.moveTo(-20, H + 40);
      for (let sx = -20; sx <= W + 20; sx += 20) {
        const wx = camX * k + sx;
        c.lineTo(sx, horiz - dy - amp * Math.sin(wx / 560 + off) - amp * 0.45 * Math.sin(wx / 230 + off * 2));
      }
      c.lineTo(W + 20, H + 40); c.closePath(); c.fill();
    }
    fundoDuna(0.28, '#eccb96', 26, 0.4, 66);
    fundoDuna(0.5, '#e3b97e', 20, 2.1, 30);

    // a areia onde andamos (segue as dunas de verdade)
    c.beginPath(); c.moveTo(-20, H + 60);
    for (let sx = -20; sx <= W + 20; sx += 10) c.lineTo(sx, sy(chao(camX + sx)));
    c.lineTo(W + 20, H + 60); c.closePath();
    const sg = c.createLinearGradient(0, horiz - 120, 0, H);
    sg.addColorStop(0, '#f7e2b2'); sg.addColorStop(1, '#dbb173');
    c.fillStyle = sg; c.fill();
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2.5;
    c.beginPath();
    for (let sx = -20; sx <= W + 20; sx += 10) {
      const y = sy(chao(camX + sx));
      if (sx === -20) c.moveTo(sx, y); else c.lineTo(sx, y);
    }
    c.stroke();
    c.strokeStyle = 'rgba(190,150,95,.45)'; c.lineWidth = 2;   // ondulações da areia
    for (let k = 0; k < 26; k++) {
      const wx = Math.floor((camX - 100) / 90) * 90 + k * 90 + h01(k) * 40;
      const sx = wx - camX;
      if (sx < -60 || sx > W + 60) continue;
      const y = sy(chao(wx)) + 16 + h01(k * 3.3) * 40;
      c.beginPath();
      c.moveTo(sx - 16, y); c.quadraticCurveTo(sx, y - 5, sx + 16, y);
      c.stroke();
    }

    // pirâmides, oásis, obeliscos, estrelas e montarias
    const i0 = Math.floor((camX - 700) / SLOT), i1 = Math.floor((camX + W + 700) / SLOT);
    for (let i = Math.max(0, i0); i <= i1; i++) {
      const rio = rioAt(i);
      if (rio) desenhaRio(c, rio, t);
      const p = monumentoAt(i);
      if (p) {
        if (h01(i * 4.44) > 0.55) {
          const ex = p.x - p.w * 0.78;
          c.save(); c.translate(ex - camX, sy(chao(ex))); esfingeArt(c, 0.72); c.restore();
        }
        c.save(); c.translate(p.x - camX, sy(p.base));
        const brilho = portaPerto && portaPerto.i === p.i ? 1 : 0;
        if (p.tipo === 'templo') temploArt(c, p, t, brilho); else piramideArt(c, p, t, brilho);
        c.restore();
        if (portaPerto && portaPerto.i === p.i) setaEntrar(c, p.x - camX, sy(p.base) - 210, t);
      }
      const oa = oasisAt(i);
      if (oa) {
        const wy = sy(chao(oa.x)) + 6;
        c.fillStyle = 'rgba(76,201,240,.75)';
        c.beginPath(); c.ellipse(oa.x - camX + 40, wy, 78, 15, 0, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2;
        c.beginPath();
        c.ellipse(oa.x - camX + 40, wy - 3 + Math.sin(t * 2) * 2, 52, 8, 0, 0, TAU);
        c.stroke();
        for (let k = 0; k < oa.n; k++) {
          const x = oa.x + k * 74;
          c.save(); c.translate(x - camX, sy(chao(x)));
          palmeira(c, 0.85 + h01(i * 3.1 + k) * 0.35, t + k);
          c.restore();
        }
      }
      const ob = obeliscoAt(i);
      if (ob) { c.save(); c.translate(ob.x - camX, sy(chao(ob.x))); obeliscoArt(c, t, i * 2.2); c.restore(); }
      for (const s of estrelasAt(i)) {
        if (coins[s.id]) continue;
        G.gfx.star(c, s.x - camX, sy(s.alt) + Math.sin(t * 3 + s.x * 0.01) * 4, 13, '#ffd166', t * 2);
      }
      const m = montariaAt(i);
      if (m) {
        const o = montariaEstado(i);
        if (o.livre) {
          const mx = o.x === null ? m.x : o.x;
          c.save(); c.translate(mx - camX, sy(chao(mx)));
          if (m.tipo === 'camelo') cameloArt(c, t, { walk: o.acena > 0 ? o.walk * 2 : Math.sin(t) * 0.4 });
          else leopardoArt(c, t, { walk: o.acena > 0 ? o.walk * 2 : Math.sin(t) * 0.4 });
          c.restore();
        }
      }
    }

    drawEntidades(c, t);
    desenhaCrocsNoAr(c, t);          // o crocodilo no ar passa à frente da barca
  }

  function drawTunel(c, t) {
    const W = vw(), H = vh();
    // só a cerimónia do Pitamena mexe no sarcófago; a do traje deixa tudo como estava
    const cerF = cer && cer.modo === 'farao' ? cer : null;
    const luz = cerF ? Math.max(0, Math.min(1, (cerF.t - 6.2) / 1)) : (cacador ? 1 : 0);
    c.fillStyle = '#20150c'; c.fillRect(0, 0, W, H);

    const templo = tunelInfo && tunelInfo.tipo === 'templo';
    const linha = sy(0);
    if (templo) {
      // sala hipostila: filas de colunas e feixes de sol a entrar pelo teto
      c.fillStyle = '#6b512c'; c.fillRect(0, 0, W, H);
      const passo = 150;
      const k0 = Math.floor((camX - passo) / passo), k1 = Math.floor((camX + W + passo) / passo);
      for (let k = k0; k <= k1; k++) {
        const cx = k * passo - camX, ch = 430;
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.13;
        const sgl = c.createLinearGradient(cx + 74, linha - ch, cx + 74, linha);
        sgl.addColorStop(0, '#fff3bf'); sgl.addColorStop(1, 'rgba(255,243,191,0)');
        c.fillStyle = sgl;
        c.beginPath();
        c.moveTo(cx + 52, linha - ch); c.lineTo(cx + 96, linha - ch);
        c.lineTo(cx + 122, linha); c.lineTo(cx + 26, linha);
        c.closePath(); c.fill();
        c.restore();
        c.fillStyle = k % 2 ? '#c9a05a' : '#d9b878';
        G.gfx.rr(c, cx - 28, linha - ch, 56, ch, 8); c.fill();
        c.fillStyle = '#2f9e44';
        c.beginPath();
        c.moveTo(cx - 40, linha - ch); c.quadraticCurveTo(cx, linha - ch - 44, cx + 40, linha - ch);
        c.closePath(); c.fill();
        c.strokeStyle = 'rgba(110,75,30,.4)'; c.lineWidth = 2;
        for (let i = 1; i < 8; i++) {
          c.beginPath(); c.moveTo(cx - 28, linha - ch + i * (ch / 8)); c.lineTo(cx + 28, linha - ch + i * (ch / 8)); c.stroke();
        }
        c.save(); c.translate(cx, linha - ch * 0.55); glifo(c, k, 34, 'rgba(96,62,26,.75)'); c.restore();
      }
      c.fillStyle = 'rgba(30,18,8,.55)'; c.fillRect(0, 0, W, 54);
    } else {
      // parede de blocos de pedra
      const bw = 96, bh = 48;
      for (let ry = 0; ry * bh < linha + bh * 2; ry++) {
        const y = linha - (ry + 1) * bh;
        const off = (ry % 2) * (bw / 2);
        const sx0 = -(((camX * 0.55 + off) % bw) + bw);
        for (let x = sx0; x < W + bw; x += bw) {
          c.fillStyle = ry % 3 === 0 ? '#8a6a3c' : (ry % 3 === 1 ? '#7d5f34' : '#95744b');
          G.gfx.rr(c, x + 2, y + 2, bw - 4, bh - 4, 4); c.fill();
        }
      }
      c.fillStyle = 'rgba(20,12,6,.65)'; c.fillRect(0, 0, W, 70);   // teto escuro
    }

    // painéis de hieróglifos e tochas ao longo do corredor
    const k0 = Math.floor((camX - 200) / 360), k1 = Math.floor((camX + W + 200) / 360);
    for (let k = k0; k <= k1; k++) {
      const x = k * 360 + 120;
      if (x > TLEN - 620) continue;
      painelHier(c, x - camX, sy(0) - 300, 84, 150, k * 3.7, luz * 0.8);
      tochaArt(c, x - camX + 210, sy(0) - 200, t + k, k);
    }

    // nichos onde ninguém morde
    if (tunelInfo) {
      for (const n of tunelInfo.nichos) {
        const x = n.x - camX, y = sy(0);
        if (x < -200 || x > W + 200) continue;
        c.fillStyle = '#3a2a16';
        c.beginPath();
        c.moveTo(x - 52, y); c.lineTo(x - 52, y - 92);
        c.quadraticCurveTo(x, y - 150, x + 52, y - 92); c.lineTo(x + 52, y);
        c.closePath(); c.fill();
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.32 + Math.sin(t * 3 + n.x) * 0.06;
        const gg = c.createRadialGradient(x, y - 70, 4, x, y - 70, 90);
        gg.addColorStop(0, '#ffd166'); gg.addColorStop(1, 'rgba(255,209,102,0)');
        c.fillStyle = gg; c.beginPath(); c.arc(x, y - 70, 90, 0, TAU); c.fill();
        c.restore();
        c.save(); c.translate(x, y - 78); glifo(c, 0, 44, 'rgba(255,214,120,.9)'); c.restore();
      }
    }

    // a câmara do faraó, ao fundo do corredor
    const cxw = TLEN - 560 - camX;
    if (cxw < W + 200) {
      c.fillStyle = '#7a5a2e'; c.fillRect(cxw, 0, W + 400, H);
      c.fillStyle = '#b98c45';
      c.fillRect(cxw, sy(138) - 420, W + 400, 420);
      painelHier(c, cxw + 60, sy(138) - 380, 120, 220, 21.5, luz);
      painelHier(c, cxw + 470, sy(138) - 380, 120, 220, 33.5, luz);
      for (let k = 0; k < 2; k++) {                               // colunas com capitel de lótus
        const x = cxw + 250 + k * 330;
        c.fillStyle = '#e0c48a'; G.gfx.rr(c, x - 22, sy(138) - 330, 44, 330, 8); c.fill();
        c.fillStyle = '#2f9e44';
        c.beginPath();
        c.moveTo(x - 34, sy(138) - 330); c.quadraticCurveTo(x, sy(138) - 386, x + 34, sy(138) - 330);
        c.closePath(); c.fill();
        c.strokeStyle = 'rgba(120,85,35,.35)'; c.lineWidth = 2;
        for (let i = 1; i < 7; i++) {
          c.beginPath();
          c.moveTo(x - 22, sy(138) - 330 + i * 44); c.lineTo(x + 22, sy(138) - 330 + i * 44);
          c.stroke();
        }
      }
      tochaArt(c, cxw + 200, sy(138) - 200, t, 9);
      tochaArt(c, cxw + 470, sy(138) - 200, t + 1.1, 11);
      // parede do fundo: a sala acaba aqui à vista, não numa parede invisível
      c.fillStyle = '#8a6733'; c.fillRect(cxw + 560, sy(138) - 460, W + 200, 460);
      c.fillStyle = '#c9a05a'; G.gfx.rr(c, cxw + 552, sy(138) - 470, 30, 470, 6); c.fill();
      painelHier(c, cxw + 588, sy(138) - 420, 150, 300, 44.5, luz);
    }

    // chão de pedra (com os degraus e as plataformas)
    c.beginPath(); c.moveTo(-20, H + 60);
    for (let sx = -20; sx <= W + 20; sx += 8) c.lineTo(sx, sy(chaoTunel(camX + sx)));
    c.lineTo(W + 20, H + 60); c.closePath();
    const fg = c.createLinearGradient(0, sy(160), 0, H);
    fg.addColorStop(0, '#a07c46'); fg.addColorStop(1, '#5e4526');
    c.fillStyle = fg; c.fill();
    c.strokeStyle = 'rgba(60,40,18,.5)'; c.lineWidth = 2;
    c.beginPath();
    for (let sx = -20; sx <= W + 20; sx += 8) {
      const y = sy(chaoTunel(camX + sx));
      if (sx === -20) c.moveTo(sx, y); else c.lineTo(sx, y);
    }
    c.stroke();

    // porta de saída, com o Sol lá fora
    const px = 60 - camX;
    if (px > -200) {
      c.fillStyle = '#ffe6a7';
      c.beginPath();
      c.moveTo(px - 46, sy(0)); c.lineTo(px - 38, sy(0) - 130); c.lineTo(px + 38, sy(0) - 130);
      c.lineTo(px + 46, sy(0)); c.closePath(); c.fill();
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4;
      const dg = c.createRadialGradient(px, sy(0) - 70, 4, px, sy(0) - 70, 130);
      dg.addColorStop(0, '#fff3bf'); dg.addColorStop(1, 'rgba(255,243,191,0)');
      c.fillStyle = dg; c.beginPath(); c.arc(px, sy(0) - 70, 130, 0, TAU); c.fill();
      c.restore();
      if (hero.x < 260) setaEntrar(c, px, sy(0) - 190, t);
    }

    // tesouros
    if (tunelInfo) {
      for (const s of tunelInfo.tesouros) {
        if (coins[s.id]) continue;
        G.gfx.star(c, s.x - camX, sy(s.alt) + Math.sin(t * 3 + s.x * 0.01) * 4, 13, '#ffd166', t * 2);
      }
    }

    // gente da câmara: o faraó Pitamena, o escriba e a gata Bastet
    if (cxw < W + 200) {
      const chaoC = sy(138);
      c.save(); c.translate(cxw + 120, chaoC); escribaArt(c, t); c.restore();
      c.save(); c.translate(cxw + 510, chaoC); gataArt(c, t); c.restore();

      const wrap = cerF ? Math.max(0, Math.min(1, (cerF.t - 1.4) / 1.9)) : 0;
      const entra = cerF ? Math.max(0, Math.min(1, (cerF.t - 3.4) / 1.4)) : (cacador ? 1 : 0);
      const tampa = cerF ? Math.max(0, Math.min(1, (cerF.t - 4.9) / 1.1)) : (cacador ? 1 : 0);
      const sarX = cxw + 400;
      if (!cacador || cerF) {
        const fx = sarX - 190 + entra * 180;
        c.save();
        c.translate(fx, chaoC);
        c.globalAlpha = entra > 0.85 ? Math.max(0, 1 - (entra - 0.85) / 0.15) : 1;
        c.scale(-1, 1);
        faraoArt(c, t, { wrap: wrap, acena: !cerF || cerF.t < 1.4, semCajado: wrap > 0.2 });
        c.restore();
        if (wrap > 0 && wrap < 1) {                       // fitas a voar à volta dele
          c.strokeStyle = 'rgba(253,246,227,.9)'; c.lineWidth = 5;
          for (let i = 0; i < 3; i++) {
            const a = t * 4 + i * 2.1;
            c.beginPath();
            c.moveTo(fx + Math.cos(a) * 60, chaoC - 70 + Math.sin(a) * 40);
            c.quadraticCurveTo(fx, chaoC - 120, fx + Math.cos(a + 2) * 60, chaoC - 40 + Math.sin(a + 2) * 40);
            c.stroke();
          }
        }
      }
      c.save(); c.translate(sarX, chaoC);
      sarcofagoArt(c, t, { tampa: tampa, janela: tampa > 0.94, luz: luz });
      c.restore();
      if (cacador && !cerF) {                             // festa das múmias na câmara
        for (let k = 0; k < 3; k++) {
          c.save();
          c.translate(cxw + 260 + k * 120, chaoC);
          c.scale(k % 2 ? -1 : 1, 1);
          momiaArt(c, t + k * 0.7, { danca: true, acena: k === 1 });
          c.restore();
        }
      }
      if (luz > 0) {                                      // luz dourada dos hieróglifos
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.22 * luz;
        const lg2 = c.createLinearGradient(0, chaoC - 420, 0, chaoC);
        lg2.addColorStop(0, '#ffd166'); lg2.addColorStop(1, 'rgba(255,209,102,0)');
        c.fillStyle = lg2; c.fillRect(cxw, chaoC - 420, W + 400, 420);
        c.restore();
      }
    }

    drawEntidades(c, t);

    // cerimónia curta: ficamos múmia (fitas) ou faraó (coroa a descer do teto)
    if (cer && cer.modo === 'traje') {
      const hx = hero.x - camX, hy = sy(hero.alt);
      const k = Math.max(0, Math.min(1, (cer.t - 0.5) / 1.6));
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 * Math.sin(Math.min(1, cer.t / 2) * Math.PI);
      const gg = c.createRadialGradient(hx, hy - 60, 6, hx, hy - 60, 190);
      gg.addColorStop(0, '#ffd166'); gg.addColorStop(1, 'rgba(255,209,102,0)');
      c.fillStyle = gg; c.beginPath(); c.arc(hx, hy - 60, 190, 0, TAU); c.fill();
      c.restore();
      if (cer.traje === 'momia') {
        c.strokeStyle = 'rgba(253,246,227,.95)'; c.lineWidth = 7; c.lineCap = 'round';
        for (let i = 0; i < 7; i++) {
          const a = t * 5 + i * 0.9, r = 46 * (1 - k) + 16;
          const y = hy - 12 - i * 13 - k * 8;
          c.beginPath();
          c.moveTo(hx - r + Math.sin(a) * 6, y);
          c.quadraticCurveTo(hx, y - 12, hx + r - Math.sin(a) * 6, y);
          c.stroke();
        }
      } else {
        const cy = hy - 96 - (1 - k) * 220;
        c.save(); c.translate(hx + 1, cy); c.scale(1.5, 1.5);
        c.fillStyle = '#fdf6e3';
        c.beginPath(); c.ellipse(0, -8, 9, 15, 0, 0, TAU); c.fill();
        c.fillStyle = '#ef476f';
        c.beginPath();
        c.moveTo(-13, 6); c.lineTo(-13, -10); c.quadraticCurveTo(-1, -15, 11, -10);
        c.lineTo(13, 6); c.closePath(); c.fill();
        c.beginPath();
        c.moveTo(11, -11); c.quadraticCurveTo(23, -18, 18, 2); c.lineTo(11, -2);
        c.closePath(); c.fill();
        c.restore();
        for (let i = 0; i < 5; i++) {
          const a = t * 3 + (i / 5) * TAU;
          G.gfx.star(c, hx + Math.cos(a) * 60, hy - 70 + Math.sin(a) * 26, 7, '#ffd166', a);
        }
      }
    }

    // no fim da cerimónia do Pitamena a rede e o arco vêm ter connosco
    if (cer && cer.modo === 'farao' && cer.t > 7.2) {
      const k = Math.min(1, (cer.t - 7.2) / 1.2);
      const hx = hero.x - camX, hy = sy(hero.alt) - 60;
      const ox = hx + 260 * (1 - k), oy = hy - 220 * (1 - k);
      c.save(); c.translate(ox, oy); c.rotate((1 - k) * 6);
      redeArt(c, { rot: 0 });
      c.restore();
      c.save(); c.translate(ox + 40 * k, oy + 20);
      setaArt(c, { dir: 1, t: cer.t });
      c.restore();
      G.gfx.star(c, ox, oy, 16 * (1 - k) + 8, '#ffd166', cer.t * 4);
    }
  }

  /* ---------- HUD: quase tudo em desenhos (o Isaac ainda não lê) ---------- */
  function drawHud(c, t) {
    G.gfx.star(c, 36, 46, 18, '#ffd166', 0);
    G.gfx.label(c, '' + G.state.stars, 64, 47, 32, '#b56b00');

    for (let i = 0; i < VIDAS_MAX; i++) {
      c.globalAlpha = i < vidas ? 1 : 0.28;
      G.gfx.heart(c, 24 + i * 34, 88, 13, i < vidas ? '#ef476f' : '#6b6b6b');
    }
    c.globalAlpha = 1;

    if (traje !== 'normal') {                    // o traje que trouxemos do monumento
      c.save();
      c.translate(30, 148);
      if (traje === 'momia') {
        c.fillStyle = '#fdf6e3';
        c.beginPath(); c.arc(0, 0, 15, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(196,176,136,.95)'; c.lineWidth = 2.4;
        for (let i = -2; i <= 2; i++) {
          c.beginPath();
          c.moveTo(-14, i * 6); c.quadraticCurveTo(0, i * 6 - 3, 14, i * 6 + 1);
          c.stroke();
        }
        c.fillStyle = '#2b2d42';
        c.beginPath(); c.arc(-5, -1, 2.6, 0, TAU); c.arc(5, -1, 2.6, 0, TAU); c.fill();
      } else {
        c.fillStyle = '#ffd9b3';
        c.beginPath(); c.arc(0, 2, 13, 0, TAU); c.fill();
        c.fillStyle = '#3a86ff';
        c.beginPath(); c.arc(0, 0, 15, Math.PI, 0); c.fill();
        G.gfx.rr(c, -17, -1, 8, 20, 3); c.fill();
        G.gfx.rr(c, 9, -1, 8, 20, 3); c.fill();
        c.fillStyle = '#fdf6e3';
        c.beginPath(); c.ellipse(0, -18, 6, 10, 0, 0, TAU); c.fill();
        c.fillStyle = '#ef476f';
        c.beginPath();
        c.moveTo(-10, -8); c.lineTo(-10, -19); c.quadraticCurveTo(0, -23, 9, -19);
        c.lineTo(10, -8); c.closePath(); c.fill();
        c.fillStyle = '#2b2d42';
        c.beginPath(); c.arc(-4, 2, 2.2, 0, TAU); c.arc(5, 2, 2.2, 0, TAU); c.fill();
      }
      c.restore();
    }

    if (!cacador) {
      // bússola: para que lado fica a pirâmide mais perto
      let best = null, bd = 1e9;
      if (mundo === 'deserto') {
        const i0 = Math.floor((hero.x - 3600) / SLOT), i1 = Math.floor((hero.x + 3600) / SLOT);
        for (let i = Math.max(0, i0); i <= i1; i++) {
          const p = monumentoAt(i);
          if (!p) continue;
          const d = Math.abs(p.x - hero.x);
          if (d < bd) { bd = d; best = p; }
        }
      }
      const cx = G.W / 2, cy = 52;
      c.save();
      c.fillStyle = 'rgba(255,255,255,.35)';
      G.gfx.rr(c, cx - 62, cy - 28, 124, 56, 18); c.fill();
      c.fillStyle = '#e8c27a'; c.strokeStyle = '#b58840'; c.lineWidth = 3; c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(cx - 26, cy + 18); c.lineTo(cx, cy - 20); c.lineTo(cx + 26, cy + 18);
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#ffd166';
      c.beginPath();
      c.moveTo(cx - 6, cy - 11); c.lineTo(cx, cy - 20); c.lineTo(cx + 6, cy - 11);
      c.closePath(); c.fill();
      if (mundo === 'deserto' && best) {
        const dir = best.x > hero.x ? 1 : -1;
        const perto = bd < 120;
        c.fillStyle = perto ? '#06d6a0' : '#ef476f';
        const ax = cx + dir * (46 + Math.sin(t * 5) * 4);
        c.beginPath();
        if (perto) { c.arc(ax, cy, 11, 0, TAU); }
        else {
          c.moveTo(ax + dir * 14, cy); c.lineTo(ax - dir * 8, cy - 13); c.lineTo(ax - dir * 8, cy + 13);
          c.closePath();
        }
        c.fill();
      }
      c.restore();
    } else {
      // as cores já apanhadas nesta coleção
      const x0 = G.W / 2 - (CORES.length * 40) / 2;
      for (let i = 0; i < CORES.length; i++) {
        const x = x0 + i * 40 + 20, y = 46;
        c.globalAlpha = apanhadas[i] > 0 ? 1 : 0.34;
        c.fillStyle = CORES[i].c;
        c.beginPath(); c.ellipse(x, y, 15, 12, 0, 0, TAU); c.fill();
        c.fillStyle = CORES[i].c2;
        c.beginPath(); c.ellipse(x - 5, y + 1, 10, 11, 0, 0, TAU); c.fill();
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(x + 5, y - 3, 4, 0, TAU); c.fill();
        c.fillStyle = '#2b2d42';
        c.beginPath(); c.arc(x + 6, y - 3, 2, 0, TAU); c.fill();
        if (apanhadas[i] > 0) {
          c.strokeStyle = '#fdf6e3'; c.lineWidth = 4; c.lineCap = 'round';
          for (let k = -1; k <= 1; k++) {
            c.beginPath();
            c.moveTo(x - 14, y - 8 + k * 8); c.lineTo(x + 14, y - 4 + k * 8);
            c.stroke();
          }
        }
        c.globalAlpha = 1;
      }
      c.save();
      c.translate(G.W / 2 + (CORES.length * 40) / 2 + 34, 46);
      c.scale(0.62, 0.62);
      redeArt(c, { rot: 0 });
      c.restore();
      G.gfx.label(c, '' + total, G.W / 2 + (CORES.length * 40) / 2 + 52, 47, 26, '#5c4326');
    }
  }

  S.draw = function (c, t) {
    const k = vscale();
    c.save(); c.scale(k, k);
    if (mundo === 'tunel') drawTunel(c, t); else drawDeserto(c, t);
    c.restore();
    drawHud(c, t);
  };

  S.debug = function () {
    return {
      mundo: mundo, x: Math.round(hero.x), alt: Math.round(hero.alt),
      grounded: hero.grounded, seguro: seguro(), porta: !!portaPerto,
      monta: hero.monta ? hero.monta.tipo : null, vidas: vidas, suja: hero.suja,
      cacador: cacador, traje: traje, total: total, cores: apanhadas.slice(),
      barca: hero.barca, rio: !!(mundo === 'deserto' && rioPerto(hero.x)),
      cobras: cobras.length, presas: cobras.filter(function (cb) { return cb.state === 'preso'; }).length,
      amigas: amigas.length, itens: itens.length, redes: redes.length, setas: setas.length,
      bichos: bichos.length, fogem: cobras.filter(function (cb) { return cb.state === 'foge'; }).length,
      cer: cer ? { t: +cer.t.toFixed(1), passo: cer.passo } : null,
      stars: G.state.stars, nivel: nivel()
    };
  };

  // atalhos só para testes
  S.api = {
    farao: function () {
      if (mundo !== 'tunel') {
        const p = monumentoAt(Math.floor(hero.x / SLOT) + 1) || monumentoAt(2) ||
          { i: 2, x: 2 * SLOT + 420, w: 330, h: 277, base: duneRaw(2 * SLOT + 420), tipo: 'piramide' };
        entrarTunel(p);
      }
      hero.x = TLEN - 320; hero.alt = chaoTunel(hero.x); camX = Math.max(0, hero.x - vw() * 0.38);
    },
    cacador: function () { cacador = true; botoes(); },
    cobra: function (n) { novaCobra(hero.x + (n || 200)); },
    bicho: function () { atirarBicho(); },
    pos: function (x) { hero.x = x; hero.alt = chao(x); hero.vy = 0; hero.barca = null; camX = x - vw() * 0.38; camY = hero.alt; },
    mapa: function (n) {                       // o que existe em cada pedaco de deserto
      const out = [];
      for (let i = 1; i <= (n || 14); i++) {
        const m = monumentoAt(i), r = rioAt(i), mo = montariaAt(i);
        out.push({ i: i, mon: m ? m.tipo : null, monX: m ? Math.round(m.x) : null,
                   rio: r ? [Math.round(r.x0), Math.round(r.x1)] : null,
                   monta: mo ? mo.tipo : null });
      }
      return out;
    },
    morder: function () { hero.inv = 0; if (cobras[0]) { cobras[0].x = hero.x; morder(cobras[0]); } },
    art: {
      hero: heroArt, cobra: cobraArt, momiaCobra: momiaCobraArt, camelo: cameloArt,
      leopardo: leopardoArt, piramide: piramideArt, farao: faraoArt, momia: momiaArt,
      sarcofago: sarcofagoArt, glifo: glifo, painel: painelHier, esfinge: esfingeArt,
      escaravelho: escaravelhoVoaArt
    }
  };

  G.scenes = G.scenes || {};
  G.scenes.egito = S;
})();
