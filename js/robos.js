/* Cena — OS ROBÔS: o Spidey contra o Venom, ditada pelo Isaac.

   "Nós somos o Spidey e estamos num robô e temos de atirar teias ao Venom, e o Venom
   está num robô, e não há forma de destruir os robôs, e temos de lutar com as nossas
   armas no robô."

   Como ficou:
   - Luta um contra um numa rua da cidade, à noite. Os dois robôs são INDESTRUTÍVEIS:
     quando levam um toque fazem "clang", saltam faíscas e mais nada.
   - As armas do robô do Spidey: o canhão de TEIAS (🕸️), o SOCO do braço grande (👊)
     e a REDE GIGANTE (💥), que carrega com as teias que acertam.
   - Cada teia que acerta fica colada no robô do Venom (vê-se no próprio robô e na
     barra). Com o robô cheio de teias o Venom fica EMBRULHADO e ganha-se a ronda; na
     ronda seguinte ele rasga as teias e volta mais rápido. O Venom vai rasgando as
     teias aos poucos, por isso é preciso não parar.
   - O Venom atira bolas de GOSMA e chicoteia com os tentáculos; também salta por cima
     das teias e defende-se com os braços. A gosma suja o nosso robô: com gosma a mais
     ficamos COLADOS uns segundos (abana-se com qualquer botão para sair mais depressa).
     As nossas teias também apanham as bolas de gosma no ar.
   - Não há derrota: ficar colado só dá tempo ao Venom para rasgar teias.

   2.ª ronda (pedido do Isaac: "mais difícil, que está super fácil; com pessoas, de dia,
   e muitas, muitas ruas e passadeiras"): a luta passou para uma cidade DE DIA com uma
   rua atrás da outra (prédios, lojas, ruas que vão para o fundo, passadeiras e
   semáforos de peões). Há PESSOAS a passear, a atravessar nas passadeiras quando o
   boneco está verde e a fugir dos robôs (ninguém se magoa: elas afastam-se sempre).
   Cada vez que o Venom fica embrulhado, solta-se e FOGE para a rua seguinte, e com
   muitas teias em cima também foge a meio da luta: é preciso ir atrás dele. E está
   bem mais difícil: as teias colam menos, ele rasga-as mais depressa, salta e
   defende-se mais, ataca mais vezes (gosma às duas e às três) e suja mais. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  const SEG = 2600;             // cada ronda é uma rua (um pedaço de cidade)
  const BLOCO = 760, VAO = 190; // um quarteirão e a rua que vai para o fundo
  const CORES = ['#f4a261', '#e9c46a', '#2a9d8f', '#90be6d', '#f28482', '#84a59d', '#bde0fe', '#cdb4db', '#ffafcc'];
  const GRAV = 2100, JUMPV = 980;
  const VEL = 300;
  const TEIA_V = 820, REDE_V = 620;
  const SEPARA = 190;           // os robôs não se atravessam
  const ALTO = 240;             // altura do robô

  let p, v, tiros, gotas, sparks, puffs, textos, camX, fase, faseT, ronda, carga, superAvisado, venc;
  let pessoas, nuvens, tempo, falasT;

  // limites da rua desta ronda: o Venom fica nela; o Spidey pode vir da anterior
  function lo() { return (ronda - 1) * SEG; }
  function hi() { return lo() + SEG; }
  function limP() { return [Math.max(110, lo() - SEG + 110), hi() - 110]; }
  function limV() { return [lo() + 110, hi() - 110]; }
  function zebraX(i) { return i * BLOCO + BLOCO - VAO / 2; }
  function verde(i) { return ((tempo + h01(i * 3.7) * 9) % 9) < 4.5; }

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function h01(n) { const s = Math.sin(n * 127.1) * 43758.5; return s - Math.floor(s); }
  function vscale() { return Math.min(1, G.H / 640, G.W / 720); }
  function vw() { return G.W / vscale(); }
  function vh() { return G.H / vscale(); }
  // ao alto há duas filas de botões em baixo: o chão fica por cima das duas
  function chaoY() {
    const reserva = G.W < 560 && G.H > G.W ? 236 : 122;
    return Math.min(vh() * 0.86, Math.max(vh() * 0.5, (G.H - reserva) / vscale()));
  }
  function sy(alt) { return chaoY() - alt; }
  function fala(t) { if (G.audio.fala) G.audio.fala(t); }

  S.enter = function () {
    p = { x: 620, alt: 0, vy: 0, vx: 0, dir: 1, walk: 0, cdTeia: 0, cdSoco: 0, soco: 0, gosma: 0, colado: 0, pisca: 0, tiro: 0 };
    v = { x: 1200, alt: 0, vy: 0, vx: 0, dir: -1, walk: 0, teias: 0, cd: 1.6, tent: 0, lat: 0, reage: 0, bloq: 0, pisca: 0,
      modo: 'longe', modoT: 3, ri: 0, fogeCd: 6 };
    tiros = []; gotas = []; sparks = []; puffs = []; textos = [];
    camX = 0; fase = 'intro'; faseT = 0; ronda = 1; carga = 0; superAvisado = false; venc = 0;
    pessoas = []; tempo = 0; falasT = 0;
    nuvens = [];
    for (let i = 0; i < 6; i++) nuvens.push({ x: Math.random(), y: 0.08 + Math.random() * 0.3, s: 30 + Math.random() * 40 });
    for (let i = 0; i < 12; i++) novaPessoa(rnd(0, 1700));
    superBotao(false);
    G.banner('Spidey, ao robô! 🕷️🤖', 2200);
    fala('Spidey, ao robô! Atira teias ao Venom!');
  };

  // o botão 💥 da rede gigante só aparece quando está carregada
  let superVisivel = false;
  function superBotao(on) {
    if (on === superVisivel) return;
    superVisivel = on;
    document.body.classList.toggle('robos-super', on);
  }

  function spark(x, alt, n, col) {
    for (let i = 0; i < n; i++) sparks.push({ x: x, alt: alt, vx: rnd(-220, 220), vy: rnd(60, 340), t: 0, life: rnd(0.3, 0.7), col: col || '#ffd166' });
  }
  function puff(x, alt, n, col) {
    for (let i = 0; i < (n || 8); i++) puffs.push({ x: x + rnd(-24, 24), alt: alt + rnd(-10, 30), r: rnd(12, 28), t: 0, life: rnd(0.4, 0.8), col: col || '#ffffff' });
  }
  function texto(txt, x, alt, cor) { textos.push({ txt: txt, x: x, alt: alt, t: 0, cor: cor || '#ffd60a' }); }

  /* ---------- as pessoas da cidade ---------- */
  function novaPessoa(x) {
    const crianca = Math.random() < 0.3;
    pessoas.push({
      x: x, z: Math.random() < 0.6 ? 0 : 1, zAlvo: -1, vx: (Math.random() < 0.5 ? -1 : 1) * rnd(40, 75),
      cor: CORES[Math.floor(Math.random() * CORES.length)], calca: ['#264653', '#3d405b', '#6d597a', '#1d3557'][Math.floor(Math.random() * 4)],
      pele: ['#ffd9b3', '#f1c27d', '#c68642', '#8d5524'][Math.floor(Math.random() * 4)],
      cabelo: ['#3b2a20', '#000000', '#e9c46a', '#b5651d', '#7f7f7f'][Math.floor(Math.random() * 5)],
      crianca: crianca, alt: crianca ? 0.72 : 1, estado: 'anda', medo: 0, t: Math.random() * 9, diz: 0, txt: '', festa: 0, ultZ: -1
    });
  }

  function pessoasUpdate(dt, W) {
    const robos = [p, v];
    for (let i = pessoas.length - 1; i >= 0; i--) {
      const q = pessoas[i];
      q.t += dt; q.diz = Math.max(0, q.diz - dt); q.festa = Math.max(0, q.festa - dt);
      if (q.x < camX - 900 || q.x > camX + W + 900) { pessoas.splice(i, 1); continue; }
      if (q.estado === 'atravessa') {
        q.z += Math.sign(q.zAlvo - q.z) * 0.32 * dt;
        if (Math.abs(q.z - q.zAlvo) < 0.02) { q.z = q.zAlvo; q.estado = 'anda'; }
        continue;
      }
      // um robô perto: foge para o outro lado (nunca é apanhada por nada)
      let perto = null;
      for (const r of robos) if (Math.abs(r.x - q.x) < 220) perto = r;
      if (perto) {
        if (q.medo <= 0 && falasT <= 0 && Math.random() < 0.5) {
          q.diz = 1.3; falasT = 1.6;
          q.txt = ['Ai! 😱', 'Vai, Spidey! 🕷️', 'Socorro! 😮', 'Uau, robôs! 🤩'][Math.floor(Math.random() * 4)];
        }
        q.medo = 0.8;
        q.vx = Math.sign(q.x - perto.x || 1) * (q.crianca ? 170 : 150);
      } else if (q.medo > 0) {
        q.medo -= dt;
        if (q.medo <= 0) q.vx = Math.sign(q.vx) * rnd(40, 75);
      }
      q.x += q.vx * dt;
      // nas passadeiras, com o boneco verde, às vezes atravessam para o outro passeio
      if (q.medo <= 0) {
        const iz = Math.round((q.x - (BLOCO - VAO / 2)) / BLOCO);
        if (Math.abs(q.x - zebraX(iz)) < 5 && q.ultZ !== iz && verde(iz)) {
          q.ultZ = iz;
          if (Math.random() < 0.6) { q.estado = 'atravessa'; q.zAlvo = q.z < 0.5 ? 1 : 0; }
        }
      }
    }
    // a rua nunca fica vazia: aparecem pessoas fora do ecrã
    let vistas = 0;
    for (const q of pessoas) if (q.x > camX && q.x < camX + W) vistas++;
    if (vistas < 12 && pessoas.length < 30) novaPessoa(Math.random() < 0.5 ? camX - 120 : camX + W + 120);
  }

  function festaPessoas() {
    for (const q of pessoas) if (Math.abs(q.x - p.x) < 1400) q.festa = 2.5;
  }

  // nível da ronda: o Venom fica mais rápido, ataca mais e rasga teias mais depressa
  function nivel() { return Math.min(6, ronda - 1); }

  function poeTeias(n, x, alt) {
    v.teias = Math.min(100, v.teias + n);
    venc += n;
    while (venc >= 25) { venc -= 25; G.addStars(1); }
    v.pisca = 0.25;
    spark(x, alt, 6, '#ffffff');
    if (v.teias >= 100 && fase === 'luta') embrulha();
  }

  function embrulha() {
    fase = 'embrulhado'; faseT = 0;
    tiros = []; gotas = [];
    G.addStars(8 + ronda * 2);
    G.audio.sfx('tada'); G.shake = 0.4;
    spark(v.x, 140, 30, '#ffffff');
    G.banner('O Venom ficou embrulhado! 🕸️', 3000);
    festaPessoas();
    fala('Boa! O Venom ficou todo embrulhado nas teias!');
  }

  function sujaRobo(n) {
    if (p.colado > 0 || fase !== 'luta') return;
    p.gosma = Math.min(100, p.gosma + n);
    p.pisca = 0.3;
    G.audio.sfx('gulp'); G.shake = Math.max(G.shake, 0.18);
    puff(p.x, 150, 6, '#2b2440');
    if (p.gosma >= 100) {
      p.colado = 3.0; p.gosma = 0;
      v.teias = Math.max(0, v.teias - 30);      // enquanto estamos colados ele rasga teias
      G.banner('Ficaste colado! Abana-te! ◀ ▶', 2200);
      G.audio.sfx('brrr');
    }
  }

  function atiraTeia(rede) {
    const boca = p.x + p.dir * 92, a = p.alt + 150;
    tiros.push({ x: boca, x0: boca, alt: a, dir: p.dir, rede: !!rede, t: 0 });
    p.tiro = 0.18;
    G.audio.sfx(rede ? 'whoosh' : 'teia');
  }

  function soco() {
    p.soco = 0.3; p.cdSoco = 0.55;
    G.audio.sfx('whoosh');
    const dx = (v.x - p.x) * p.dir;
    if (dx > 0 && dx < 260 && Math.abs(v.alt - p.alt) < 160) {
      const def = v.bloq > 0;
      poeTeias(def ? 2 : 7, v.x - p.dir * 60, v.alt + 140);
      v.vx = p.dir * (def ? 260 : 620);
      if (!def && v.alt <= 0) v.vy = 320;
      G.audio.sfx(def ? 'escudo' : 'smash'); G.shake = Math.max(G.shake, def ? 0.15 : 0.35);
      texto(def ? 'CLANG!' : 'POW!', v.x - p.dir * 40, v.alt + 230, def ? '#dbe4ff' : '#ffd60a');
      spark(v.x - p.dir * 60, v.alt + 140, 12, '#ffd166');
    }
  }

  /* ---------- atualização ---------- */
  S.update = function (dt, t) {
    const inp = G.input;
    faseT += dt;
    p.pisca = Math.max(0, p.pisca - dt); v.pisca = Math.max(0, v.pisca - dt);
    p.soco = Math.max(0, p.soco - dt); p.tiro = Math.max(0, p.tiro - dt);
    p.cdTeia = Math.max(0, p.cdTeia - dt); p.cdSoco = Math.max(0, p.cdSoco - dt);

    if (fase === 'intro' && faseT > 1.6) { fase = 'luta'; faseT = 0; }

    if (fase === 'embrulhado') {
      v.vx *= Math.pow(0.02, dt);
      if (faseT > 3.6) {
        // o Venom rasga as teias todas e a luta recomeça, mais difícil
        ronda++;
        fase = 'luta'; faseT = 0;
        v.teias = 0; venc = 0; v.cd = 1.4; v.tent = 0; v.lat = 0;
        G.audio.sfx('quebra'); G.audio.sfx('roar'); G.shake = 0.35;
        for (let k = 0; k < 18; k++) sparks.push({ x: v.x, alt: rnd(40, 220), vx: rnd(-420, 420), vy: rnd(100, 420), t: 0, life: rnd(0.5, 1), col: '#ffffff' });
        // e foge, com os jatos, para a rua seguinte: é preciso ir atrás dele
        v.x = lo() + 1500; v.alt = 1100; v.vy = 0; v.vx = 0; v.fogeCd = 7;
        G.banner('O Venom fugiu para outra rua! Vai atrás ▶', 2600);
        fala('O Venom fugiu! Vai atrás dele!');
      }
    }

    tempo += dt; falasT = Math.max(0, falasT - dt);

    // ---- o nosso robô ----
    const podeMexer = fase === 'luta' && p.colado <= 0;
    if (p.colado > 0) {
      p.colado -= dt;
      // abanar (qualquer botão) solta mais depressa
      if (inp.justPressed('fire') || inp.justPressed('horn') || inp.justPressed('left') || inp.justPressed('right') || inp.justPressed('jump') || inp.justPressed('up')) {
        p.colado -= 0.32; G.audio.sfx('boing'); puff(p.x, 120, 3, '#2b2440');
      }
      if (p.colado <= 0) { G.audio.sfx('pop'); puff(p.x, 120, 10, '#2b2440'); }
    }
    let mv = 0;
    if (podeMexer) {
      if (inp.isHeld('left')) mv -= 1;
      if (inp.isHeld('right')) mv += 1;
      if (mv === 0) { const ax = inp.axis(); mv = Math.abs(ax.x) > 0.25 ? Math.sign(ax.x) : 0; }
      if ((inp.justPressed('jump') || inp.justPressed('up')) && p.alt <= 0) { p.vy = JUMPV; G.audio.sfx('hop'); puff(p.x, 0, 6, '#ffb703'); }
      if ((inp.justPressed('fire') || inp.isHeld('fire')) && p.cdTeia <= 0) { p.cdTeia = 0.3; atiraTeia(false); }
      if (inp.justPressed('horn') && p.cdSoco <= 0) soco();
      if ((inp.justPressed('door') || inp.justPressed('down')) && carga >= 1) {
        carga = 0; superAvisado = false; superBotao(false);
        atiraTeia(true);
        G.banner('REDE GIGANTE! 💥', 1500);
      }
    }
    const lento = 1 - p.gosma / 100 * 0.45;      // a gosma pesa
    p.x += mv * VEL * lento * dt;
    if (mv !== 0) p.walk += dt * 8;

    // ---- física dos dois ----
    for (const r of [p, v]) {
      r.x += r.vx * dt; r.vx *= Math.pow(0.04, dt);
      r.vy -= GRAV * dt; r.alt += r.vy * dt;
      if (r.alt <= 0) {
        if (r.vy < -700) { G.shake = Math.max(G.shake, 0.15); puff(r.x, 0, 5, '#9aa0b5'); }
        r.alt = 0; r.vy = 0;
      }
      const lim = r === p ? limP() : limV();
      r.x = Math.max(lim[0], Math.min(lim[1], r.x));
    }
    // não se atravessam (se um salta por cima, passa)
    const dd = v.x - p.x;
    if (Math.abs(dd) < SEPARA && Math.abs(v.alt - p.alt) < 170) {
      const s = Math.sign(dd) || 1, falta = (SEPARA - Math.abs(dd)) / 2;
      p.x -= s * falta; v.x += s * falta;
      const lp = limP(), lv = limV();
      if (p.x < lp[0]) { v.x += lp[0] - p.x; p.x = lp[0]; }
      if (v.x > lv[1]) { p.x -= v.x - lv[1]; v.x = lv[1]; }
      if (v.x < lv[0]) { p.x += lv[0] - v.x; v.x = lv[0]; }
      if (p.x > lp[1]) { v.x -= p.x - lp[1]; p.x = lp[1]; }
    }
    p.dir = v.x >= p.x ? 1 : -1;
    v.dir = -p.dir;

    // ---- teias a voar ----
    for (let i = tiros.length - 1; i >= 0; i--) {
      const s = tiros[i];
      s.t += dt;
      s.x += s.dir * (s.rede ? REDE_V : TEIA_V) * dt;
      if (Math.abs(s.x - s.x0) > 980) { tiros.splice(i, 1); continue; }
      // as teias apanham as bolas de gosma no ar
      let apanhou = false;
      for (let j = gotas.length - 1; j >= 0; j--) {
        const g = gotas[j];
        if (Math.abs(g.x - s.x) < (s.rede ? 70 : 34) && Math.abs(g.alt - s.alt) < (s.rede ? 80 : 36)) {
          puff(g.x, g.alt, 6, '#ffffff'); gotas.splice(j, 1); G.audio.sfx('pop');
          texto('PLOFT!', g.x, g.alt + 40, '#ffffff');
          if (!s.rede) { apanhou = true; break; }
        }
      }
      if (apanhou) { tiros.splice(i, 1); continue; }
      if (fase !== 'luta') continue;
      const larg = s.rede ? 115 : 72;
      if (Math.abs(s.x - v.x) < larg && s.alt > v.alt - (s.rede ? 40 : 0) && s.alt < v.alt + ALTO + (s.rede ? 40 : 0)) {
        const frente = (v.x - s.x) * s.dir > -20;
        if (v.bloq > 0 && frente && !s.rede) {
          poeTeias(1.5, s.x, s.alt);
          G.audio.sfx('escudo'); texto('CLANG!', v.x, v.alt + 240, '#dbe4ff');
        } else {
          poeTeias(s.rede ? 22 : 4.5, s.x, s.alt);
          carga = Math.min(1, carga + (s.rede ? 0 : 0.09));
          G.audio.sfx(s.rede ? 'trovao' : 'pop');
          if (s.rede) { G.shake = 0.4; texto('ZAP!', v.x, v.alt + 250, '#ffffff'); v.vx = s.dir * 300; }
        }
        tiros.splice(i, 1);
        if (fase !== 'luta') break;     // ficou embrulhado: a lista de teias foi limpa
      }
    }
    if (carga >= 1 && !superAvisado && fase === 'luta') {
      superAvisado = true;
      G.banner('Rede gigante pronta! 💥', 1800);
      G.audio.sfx('suit');
    }
    superBotao(carga >= 1 && fase !== 'intro');

    // ---- o Venom ----
    v.reage = Math.max(0, v.reage - dt);
    v.bloq = Math.max(0, v.bloq - dt);
    v.ri = Math.max(0, v.ri - dt);
    if (fase === 'luta') {
      const n = nivel();
      const preso = v.teias / 100;                  // as teias pesam-lhe
      const rapido = (1 + n * 0.08) * (1 - preso * 0.55);
      // rasga as teias aos poucos
      v.teias = Math.max(0, v.teias - (4.6 + n * 0.6) * dt);
      const dist0 = Math.abs(v.x - p.x);
      const longeDemais = dist0 > vw() * 0.8;      // longe: vem ao nosso encontro, mas ainda não ataca

      // com muitas teias em cima foge a voar pela rua fora
      v.fogeCd -= dt;
      if (!longeDemais && v.teias > 55 && v.fogeCd <= 0 && v.alt <= 0 && Math.random() < dt * 0.8) {
        v.fogeCd = rnd(6, 9);
        const lv = limV(), paraLa = (lv[1] - v.x > v.x - lv[0]) ? 1 : -1;
        v.vy = JUMPV * 1.15; v.vx = paraLa * 1700;
        G.audio.sfx('whoosh');
        G.banner('O Venom está a fugir! Vai atrás! 🏃', 1600);
      }

      v.modoT -= dt;
      if (v.modoT <= 0) { v.modo = v.modo === 'perto' ? 'longe' : 'perto'; v.modoT = rnd(2.4, 4.2); }
      const dist = Math.abs(v.x - p.x);
      // de longe atira gosma, mas nunca tão longe que saia do ecrã (telemóvel ao alto)
      const quer = v.modo === 'perto' ? 220 : Math.min(520, vw() * 0.6);
      let anda = 0;
      if (v.tent <= 0 && v.lat <= 0) {
        if (dist > quer + 40) anda = 1;     // aproxima-se
        else if (dist < quer - 60 && v.modo === 'longe') anda = -1;   // afasta-se
      }
      // "anda" em coordenadas do Venom: +1 = para a frente (para o Spidey)
      v.x += anda * v.dir * 260 * rapido * dt;
      if (anda !== 0) v.walk += dt * 7;

      // ESQUIVAR e DEFENDER as teias que vêm a caminho
      if (v.reage <= 0) {
        for (const s of tiros) {
          const vem = (v.x - s.x) * s.dir;
          if (vem < 60 || vem > 330) continue;
          const pSalta = Math.min(0.7, 0.38 + n * 0.06), pBloq = Math.min(0.4, 0.22 + n * 0.04);
          const r = Math.random();
          if (r < pSalta && v.alt <= 0) { v.vy = JUMPV * (0.95 + Math.random() * 0.12); G.audio.sfx('hop'); puff(v.x, 0, 6, '#7b2cbf'); }
          else if (r < pSalta + pBloq && !s.rede) { v.bloq = 0.85; }
          v.reage = Math.max(0.35, rnd(0.6, 1.0) - n * 0.05);
          break;
        }
      }
      // às vezes salta para cima de nós por gosto
      if (!longeDemais && v.alt <= 0 && v.tent <= 0 && Math.random() < dt * (0.2 + n * 0.04)) { v.vy = JUMPV * 0.9; v.vx = v.dir * 300; }

      // ataques
      v.cd -= dt;
      if (v.tent > 0) {                       // a preparar o chicote de tentáculos
        v.tent -= dt;
        if (v.tent <= 0) {
          v.lat = 0.32;
          G.audio.sfx('whoosh');
          if (Math.abs(v.x - p.x) < 330 && p.alt < 170) {
            sujaRobo(20 + n * 3);
            p.vx = v.dir * 520;
            texto('SPLAT!', p.x, p.alt + 230, '#c77dff');
          }
        }
      }
      v.lat = Math.max(0, v.lat - dt);
      if (v.cd <= 0 && v.tent <= 0 && v.lat <= 0 && v.bloq <= 0 && !longeDemais) {
        v.cd = Math.max(0.55, rnd(0.95, 1.4) - n * 0.1) / (1 - preso * 0.4);
        if (dist < 300) { v.tent = 0.38; v.ri = 0.6; }
        else {
          // bola de gosma em arco, apontada a onde estamos
          const T = rnd(0.75, 1.0);
          const x0 = v.x + v.dir * 80, a0 = v.alt + 170;
          const alvoX = p.x + rnd(-40, 40), alvoA = p.alt + 120;
          gotas.push({ x: x0, alt: a0, vx: (alvoX - x0) / T, vy: (alvoA - a0) / T + 0.5 * 1400 * T, t: 0 });
          G.audio.sfx('gulp');
          // duas e três seguidas (umas mais curtas, outras mais compridas: não dá para fugir a todas a andar)
          const extra = Math.random() < 0.3 + n * 0.07 ? (n >= 3 && Math.random() < 0.4 ? 2 : 1) : 0;
          for (let e = 1; e <= extra; e++) {
            const T2 = T + 0.22 * e, dx = (e % 2 ? -1 : 1) * 130 * v.dir;
            gotas.push({ x: x0, alt: a0, vx: (alvoX + dx - x0) / T2, vy: (alvoA - a0) / T2 + 0.5 * 1400 * T2, t: 0 });
          }
        }
      }
    } else {
      v.vx *= Math.pow(0.2, dt);
    }

    // ---- bolas de gosma ----
    for (let i = gotas.length - 1; i >= 0; i--) {
      const g = gotas[i];
      g.t += dt; g.x += g.vx * dt; g.vy -= 1400 * dt; g.alt += g.vy * dt;
      if (g.alt <= 0) { puff(g.x, 4, 5, '#2b2440'); gotas.splice(i, 1); continue; }
      if (Math.abs(g.x - p.x) < 80 && g.alt > p.alt && g.alt < p.alt + ALTO) {
        puff(g.x, g.alt, 7, '#2b2440');
        gotas.splice(i, 1);
        sujaRobo(18 + nivel() * 3);
        texto('SPLAT!', p.x, p.alt + 230, '#c77dff');
      }
    }

    // a gosma sai aos poucos (o robô tem limpa-vidros)
    if (p.colado <= 0) p.gosma = Math.max(0, p.gosma - 4 * dt);

    // ---- câmara: o meio dos dois ----
    const W = vw(), meio = (p.x + v.x) / 2;
    let alvoCam = meio - W / 2;
    alvoCam = Math.max(p.x - W + 230, Math.min(p.x - 230, alvoCam));
    alvoCam = Math.max(0, Math.min(hi() + 80 - W, alvoCam));
    camX += (alvoCam - camX) * Math.min(1, dt * 5);
    pessoasUpdate(dt, W);
    for (const n of nuvens) { n.x += dt * 0.008; if (n.x > 1.2) n.x = -0.2; }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.t += dt; s.x += s.vx * dt; s.alt += s.vy * dt; s.vy -= 700 * dt;
      if (s.t > s.life) sparks.splice(i, 1);
    }
    for (let i = puffs.length - 1; i >= 0; i--) {
      const q = puffs[i];
      q.t += dt; q.alt += 26 * dt; q.r += 22 * dt;
      if (q.t > q.life) puffs.splice(i, 1);
    }
    for (let i = textos.length - 1; i >= 0; i--) {
      const q = textos[i];
      q.t += dt; q.alt += 50 * dt;
      if (q.t > 0.8) textos.splice(i, 1);
    }
  };

  /* ---------- desenhos ---------- */
  function teiaRiscos(c, r, n, cor) {          // teia redonda (raios + anéis)
    c.strokeStyle = cor || '#ffffff'; c.lineWidth = Math.max(1.2, r * 0.09);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); c.stroke();
    }
    for (const q of [0.45, 0.85]) {
      c.beginPath();
      for (let k = 0; k <= n; k++) {
        const a = (k / n) * TAU;
        c.lineTo(Math.cos(a) * r * q, Math.sin(a) * r * q);
      }
      c.stroke();
    }
  }

  function caraSpidey(c, r) {
    c.fillStyle = '#e63946'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip();
    c.globalAlpha = 0.55; teiaRiscos(c, r * 1.1, 8, '#22223b'); c.restore();
    c.fillStyle = '#ffffff'; c.strokeStyle = '#22223b'; c.lineWidth = r * 0.1;
    for (const s of [-1, 1]) {
      c.beginPath();
      c.ellipse(s * r * 0.38, -r * 0.08, r * 0.3, r * 0.4, s * 0.5, 0, TAU);
      c.fill(); c.stroke();
    }
  }

  function caraVenom(c, r, t, ri) {
    c.fillStyle = '#14121f'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.fillStyle = 'rgba(140,110,200,.45)'; c.beginPath(); c.arc(-r * 0.35, -r * 0.45, r * 0.3, 0, TAU); c.fill();
    c.fillStyle = '#ffffff';
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(s * r * 0.12, -r * 0.2);
      c.quadraticCurveTo(s * r * 0.7, -r * 0.75, s * r * 0.85, -r * 0.05);
      c.quadraticCurveTo(s * r * 0.5, -r * 0.05, s * r * 0.12, -r * 0.2);
      c.fill();
    }
    // sorriso grande com dentes (faz caretas, mas é um boneco)
    const boca = ri > 0 ? 0.42 : 0.3;
    c.fillStyle = '#ffffff';
    c.beginPath(); c.ellipse(0, r * 0.38, r * 0.62, r * boca, 0, 0, Math.PI); c.fill();
    c.strokeStyle = '#14121f'; c.lineWidth = r * 0.06;
    for (let k = -3; k <= 3; k++) {
      c.beginPath(); c.moveTo(k * r * 0.17, r * 0.38); c.lineTo(k * r * 0.17, r * (0.38 + boca * 0.8)); c.stroke();
    }
    if (ri > 0) {
      c.fillStyle = '#ff5d8f';
      c.beginPath(); c.ellipse(r * 0.1, r * 0.72 + Math.sin(t * 14) * r * 0.06, r * 0.16, r * 0.3, 0.3, 0, TAU); c.fill();
    }
  }

  // um robô (base nos pés, virado para a direita). o = { spidey, walk, soco, tiro, tent, lat, bloq, gosma, colado, teias, t }
  function robo(c, t, o) {
    const sp = o.spidey;
    const corpo = sp ? '#e63946' : '#1b1930', lado = sp ? '#1d4ed8' : '#2e2650', metal = sp ? '#8d99ae' : '#4a4466';
    const w = o.walk || 0;
    const l1 = Math.sin(w) * 16, l2 = -Math.sin(w) * 16;
    c.lineCap = 'round'; c.lineJoin = 'round';
    // pernas
    for (const [lx, pass] of [[-30, l1], [30, l2]]) {
      c.strokeStyle = metal; c.lineWidth = 26;
      c.beginPath(); c.moveTo(lx, -84); c.lineTo(lx + pass * 0.4, -44); c.lineTo(lx + pass, -12); c.stroke();
      c.fillStyle = lado; G.gfx.rr(c, lx + pass - 26, -18, 52, 18, 7); c.fill();
      if (!sp) { c.strokeStyle = '#9d8ad6'; c.lineWidth = 3; c.stroke(); }
      c.fillStyle = '#22223b'; c.beginPath(); c.arc(lx + pass * 0.4, -44, 11, 0, TAU); c.fill();
    }
    // braço de trás (o soco no Spidey, tentáculos no Venom)
    if (sp) braco(c, t, o, false); else tentaculos(c, t, o, false);
    // corpo
    G.gfx.rr(c, -64, -178, 128, 100, 22); c.fillStyle = corpo; c.fill();
    // o robô preto do Venom leva rebordo claro, senão desaparecia nos prédios à noite
    c.strokeStyle = sp ? 'rgba(0,0,0,.35)' : '#9d8ad6'; c.lineWidth = sp ? 4 : 5; c.stroke();
    c.fillStyle = lado; G.gfx.rr(c, -64, -126, 128, 20, 8); c.fill();
    // símbolo de aranha no peito
    c.save(); c.translate(0, -146);
    c.fillStyle = sp ? '#22223b' : '#ffffff'; c.strokeStyle = c.fillStyle; c.lineWidth = 4;
    c.beginPath(); c.ellipse(0, 0, 9, 13, 0, 0, TAU); c.fill();
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
      const a = -0.9 + k * 0.6;
      c.beginPath(); c.moveTo(0, -4 + k * 3);
      c.quadraticCurveTo(s * 18, -10 + k * 6, s * 26, -4 + k * 9 + (k > 1 ? 6 : -6) * Math.sign(a)); c.stroke();
    }
    c.restore();
    // cabine de vidro com o piloto lá dentro
    c.fillStyle = 'rgba(160,220,255,.35)';
    c.beginPath(); c.arc(0, -196, 46, Math.PI, 0); c.lineTo(46, -178); c.lineTo(-46, -178); c.closePath(); c.fill();
    c.save(); c.translate(6, -206);
    if (sp) caraSpidey(c, 26); else caraVenom(c, 28, t, o.ri);
    c.restore();
    c.strokeStyle = metal; c.lineWidth = 6;
    c.beginPath(); c.arc(0, -196, 46, Math.PI, 0); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.55)';
    c.beginPath(); c.ellipse(-20, -218, 10, 6, -0.6, 0, TAU); c.fill();
    // antena com luz
    c.strokeStyle = metal; c.lineWidth = 4;
    c.beginPath(); c.moveTo(-30, -232); c.lineTo(-38, -258); c.stroke();
    c.fillStyle = Math.sin(t * 6) > 0 ? (sp ? '#4cc9f0' : '#c77dff') : '#ffffff';
    c.beginPath(); c.arc(-38, -260, 6, 0, TAU); c.fill();
    // braço da frente
    if (sp) canhao(c, t, o); else tentaculos(c, t, o, true);
    // o Venom a defender-se: braços cruzados à frente da cabine
    if (!sp && o.bloq > 0) {
      c.strokeStyle = '#2e2650'; c.lineWidth = 22;
      c.beginPath(); c.moveTo(40, -170); c.lineTo(84, -120); c.stroke();
      c.beginPath(); c.moveTo(40, -120); c.lineTo(84, -170); c.stroke();
      c.strokeStyle = 'rgba(199,125,255,.8)'; c.lineWidth = 4;
      c.beginPath(); c.arc(62, -146, 46, -1.2, 1.2); c.stroke();
    }
  }

  function braco(c, t, o, frente) {
    void frente;
    const vai = o.soco > 0 ? Math.sin((1 - o.soco / 0.3) * Math.PI) : 0;
    const ox = -46 + vai * 150, oy = -150 + vai * 6;
    c.strokeStyle = '#8d99ae'; c.lineWidth = 20;
    c.beginPath(); c.moveTo(-40, -160); c.lineTo(ox - 10, oy); c.stroke();
    // punho grande vermelho
    c.fillStyle = '#c1121f'; G.gfx.rr(c, ox - 26, oy - 24, 52, 48, 14); c.fill();
    c.strokeStyle = '#22223b'; c.lineWidth = 3;
    for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(ox + 14, oy - 16 + k * 14); c.lineTo(ox + 24, oy - 16 + k * 14); c.stroke(); }
    if (vai > 0.6) {
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3;
      for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(ox - 60 - k * 10, oy - 18 + k * 18); c.lineTo(ox - 34, oy - 18 + k * 18); c.stroke(); }
    }
  }

  function canhao(c, t, o) {
    const recuo = o.tiro > 0 ? -8 : 0;
    c.strokeStyle = '#8d99ae'; c.lineWidth = 20;
    c.beginPath(); c.moveTo(40, -160); c.lineTo(62 + recuo, -152); c.stroke();
    c.fillStyle = '#1d4ed8'; G.gfx.rr(c, 50 + recuo, -170, 50, 34, 10); c.fill();
    c.fillStyle = '#d9d9d9'; G.gfx.rr(c, 92 + recuo, -163, 18, 20, 5); c.fill();
    c.save(); c.translate(70 + recuo, -153); c.scale(0.5, 0.5); teiaRiscos(c, 22, 6, '#ffffff'); c.restore();
    if (o.tiro > 0) {
      c.fillStyle = 'rgba(255,255,255,.85)';
      c.beginPath(); c.arc(116, -153, 12, 0, TAU); c.fill();
    }
  }

  // tentáculos do Venom: a preparar recolhem-se, a chicotear esticam-se
  function tentaculos(c, t, o, frente) {
    const estica = o.lat > 0 ? 1 : 0;
    const prepara = o.tent > 0 ? 1 : 0;
    const n = frente ? 3 : 2;
    for (let k = 0; k < n; k++) {
      const y0 = -160 + k * 18;
      const comp = estica ? 250 : (prepara ? 34 : 70);
      const onda = Math.sin(t * 7 + k * 1.7) * (estica ? 14 : 22);
      c.strokeStyle = frente ? '#14121f' : '#2a2440'; c.lineWidth = 16 - k * 3;
      c.beginPath(); c.moveTo(frente ? 44 : -40, y0);
      c.quadraticCurveTo((frente ? 44 : -40) + comp * 0.5, y0 - 40 + onda, (frente ? 44 : -40) + comp * (frente ? 1 : -0.6), y0 + onda * 0.6);
      c.stroke();
      if (frente) {
        c.strokeStyle = 'rgba(199,125,255,.5)'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(44, y0 - 3);
        c.quadraticCurveTo(44 + comp * 0.5, y0 - 43 + onda, 44 + comp, y0 - 3 + onda * 0.6); c.stroke();
      }
    }
    if (prepara && frente) {
      G.gfx.label(c, '!', 30, -290, 44, '#ff4d6d', 'center', '#14121f');
    }
  }

  // teias coladas no robô do Venom: quanto mais, mais embrulhado
  function teiasNoRobo(c, quanto, t) {
    const n = Math.floor(quanto / 7);
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 3;
    for (let k = 0; k < n; k++) {
      const y = -20 - h01(k * 3.1) * 220, x = -60 + h01(k * 7.7) * 120;
      c.save(); c.translate(x, y); c.rotate(h01(k * 5.3) * TAU);
      teiaRiscos(c, 18 + h01(k) * 14, 6, 'rgba(255,255,255,.9)');
      c.restore();
    }
    if (quanto >= 100) {
      c.lineWidth = 6; c.strokeStyle = '#ffffff';
      for (let k = 0; k < 9; k++) {
        const y = -16 - k * 26;
        c.beginPath(); c.moveTo(-78, y + Math.sin(t * 3 + k) * 3); c.quadraticCurveTo(0, y - 18, 78, y + 8); c.stroke();
      }
    }
  }

  function gosmaNoRobo(c, quanto, colado, t) {
    const n = colado ? 18 : Math.floor(quanto / 8);
    c.fillStyle = '#2b2440';
    for (let k = 0; k < n; k++) {
      const y = -30 - h01(k * 2.9) * 200, x = -56 + h01(k * 6.1) * 112;
      const r = 10 + h01(k * 4.4) * 14 + (colado ? 8 : 0);
      c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(x, y + r, r * 0.3, r * 0.6 + Math.sin(t * 3 + k) * 2, 0, 0, TAU); c.fill();
    }
    if (colado) {
      c.fillStyle = 'rgba(199,125,255,.5)';
      for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(-40 + k * 16, -120 - h01(k) * 60, 4, 0, TAU); c.fill(); }
    }
  }

  // a cidade de dia: céu, prédios ao longe, quarteirões com lojas e ruas que vão para o
  // fundo, passeio de trás, a nossa rua com passadeiras, e o passeio da frente
  function cidade(c, W, H, t) {
    const base = sy(0);
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#5ab8ff'); g.addColorStop(0.65, '#bfe6ff'); g.addColorStop(1, '#e6f6ff');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    G.gfx.sun(c, W * 0.86, base * 0.16, 34, t);
    for (const n of nuvens) G.gfx.cloud(c, n.x * W, n.y * base, n.s, 0.9);
    // prédios ao longe (paralaxe)
    const par = 0.35, larg = 170;
    for (let k = -1; k < W / larg + 2; k++) {
      const n = Math.round((camX * par + k * larg) / larg);
      const x = k * larg - ((camX * par) % larg);
      const h = 200 + h01(n * 1.3) * 230;
      c.fillStyle = '#a9c7e0'; c.fillRect(x + 8, base - 60 - h, larg - 16, h);
      c.fillStyle = 'rgba(255,255,255,.45)';
      for (let jy = 0; jy < h / 40 - 1; jy++) for (let jx = 0; jx < 4; jx++) c.fillRect(x + 22 + jx * 34, base - 60 - h + 18 + jy * 40, 14, 18);
    }
    // quarteirões ao pé (andam com o mundo, por isso as passadeiras batem certo com as ruas)
    const passeio = base - 62;                  // onde começa o passeio de trás
    const b0 = Math.floor((camX - BLOCO) / BLOCO), b1 = Math.floor((camX + W + BLOCO) / BLOCO);
    for (let b = b0; b <= b1; b++) {
      const x0 = b * BLOCO - camX, larguraBloco = BLOCO - VAO;
      // dois ou três prédios por quarteirão
      const nP = 2 + Math.floor(h01(b * 2.2) * 2);
      for (let k = 0; k < nP; k++) {
        const pw = larguraBloco / nP, px = x0 + k * pw;
        const ph = 240 + h01(b * 5.1 + k * 1.7) * 220;
        const cor = CORES[Math.floor(h01(b * 3.3 + k) * CORES.length)];
        c.fillStyle = cor; c.fillRect(px, passeio - ph, pw - 4, ph);
        c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(px, passeio - ph, pw - 4, 10);
        c.fillStyle = '#e9f5ff';
        for (let jy = 0; jy < (ph - 110) / 52; jy++) for (let jx = 0; jx < (pw - 30) / 46; jx++) {
          c.fillRect(px + 16 + jx * 46, passeio - ph + 26 + jy * 52, 24, 30);
        }
        // loja com toldo às riscas e porta
        const toldo = ['#e63946', '#2a9d8f', '#f4a261', '#457b9d'][Math.floor(h01(b * 7 + k) * 4)];
        for (let r = 0; r < (pw - 4) / 20; r++) {
          c.fillStyle = r % 2 ? '#ffffff' : toldo;
          c.fillRect(px + r * 20, passeio - 92, Math.min(20, pw - 4 - r * 20), 18);
        }
        c.fillStyle = '#bde0fe'; c.fillRect(px + 12, passeio - 70, pw * 0.45, 52);
        c.fillStyle = '#6b4423'; c.fillRect(px + pw * 0.62, passeio - 72, 30, 72);
      }
      // a rua que vai para o fundo, entre dois quarteirões
      const rx = x0 + larguraBloco, topo = passeio - 140;
      c.fillStyle = '#8d93a8';
      c.beginPath(); c.moveTo(rx, passeio); c.lineTo(rx + VAO, passeio); c.lineTo(rx + VAO * 0.62, topo); c.lineTo(rx + VAO * 0.38, topo); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 3; c.setLineDash([12, 10]);
      c.beginPath(); c.moveTo(rx + VAO / 2, passeio); c.lineTo(rx + VAO / 2, topo); c.stroke(); c.setLineDash([]);
    }
    // passeio de trás e lancil
    c.fillStyle = '#d6d3cb'; c.fillRect(0, passeio, W, 44);
    c.fillStyle = '#a8a59c'; c.fillRect(0, passeio + 40, W, 6);
    // a nossa rua
    c.fillStyle = '#5c6378'; c.fillRect(0, passeio + 46, W, 110);
    c.strokeStyle = 'rgba(255,214,102,.9)'; c.lineWidth = 5; c.setLineDash([40, 34]);
    c.beginPath(); c.moveTo(-(camX % 74), base + 40); c.lineTo(W, base + 40); c.stroke();
    c.setLineDash([]);
    // passeio da frente
    c.fillStyle = '#d6d3cb'; c.fillRect(0, passeio + 156, W, H - passeio - 156);
    c.fillStyle = '#a8a59c'; c.fillRect(0, passeio + 156, W, 6);
    // passadeiras e semáforos de peões, uma em cada cruzamento
    for (let b = b0; b <= b1; b++) {
      const zx = zebraX(b) - camX;
      if (zx < -150 || zx > W + 150) continue;
      c.fillStyle = 'rgba(255,255,255,.92)';
      for (let k = 0; k < 6; k++) c.fillRect(zx - 60, passeio + 52 + k * 17, 120, 9);
      // semáforo no passeio de trás
      c.fillStyle = '#3d405b'; c.fillRect(zx + 68, passeio - 120, 7, 150);
      G.gfx.rr(c, zx + 58, passeio - 160, 27, 46, 6); c.fillStyle = '#22223b'; c.fill();
      const vd = verde(b);
      c.fillStyle = vd ? '#3a3a3a' : '#ff4d4d'; c.beginPath(); c.arc(zx + 71.5, passeio - 148, 7, 0, TAU); c.fill();
      c.fillStyle = vd ? '#4ade80' : '#3a3a3a'; c.beginPath(); c.arc(zx + 71.5, passeio - 127, 7, 0, TAU); c.fill();
    }
    // o fim da rua desta ronda: barreira da polícia (o Venom não passa daqui)
    const bx = hi() - 60 - camX;
    if (bx > -60 && bx < W + 60) {
      for (let k = 0; k < 5; k++) { c.fillStyle = k % 2 ? '#ffffff' : '#e63946'; c.fillRect(bx - 70 + k * 28, base - 70, 28, 22); }
      c.fillStyle = '#3d405b'; c.fillRect(bx - 66, base - 48, 8, 48); c.fillRect(bx + 58, base - 48, 8, 48);
    }
  }

  // uma pessoa (base nos pés), virada para onde anda
  function pessoaArt(c, q, t) {
    const k = q.alt * (0.62 + 0.3 * q.z);
    const corre = q.medo > 0 ? 2.2 : 1;
    const passo = q.estado === 'atravessa' ? Math.sin(q.t * 7) * 6 : Math.sin(q.t * 8 * corre) * 9;
    const salto = q.festa > 0 ? Math.abs(Math.sin(q.t * 9)) * 16 : 0;
    c.save(); c.scale(k, k); c.translate(0, -salto);
    if (q.vx < 0 && q.estado !== 'atravessa') c.scale(-1, 1);
    c.lineCap = 'round';
    c.strokeStyle = q.calca; c.lineWidth = 9;
    c.beginPath(); c.moveTo(-4, -34); c.lineTo(-4 + passo, -2); c.stroke();
    c.beginPath(); c.moveTo(5, -34); c.lineTo(5 - passo, -2); c.stroke();
    G.gfx.rr(c, -13, -66, 27, 36, 9); c.fillStyle = q.cor; c.fill();
    // braços: no ar quando fogem ou festejam
    c.strokeStyle = q.pele; c.lineWidth = 6;
    const ar = q.medo > 0 || q.festa > 0;
    c.beginPath(); c.moveTo(-11, -60); c.lineTo(ar ? -20 : -14 - passo * 0.4, ar ? -88 : -38); c.stroke();
    c.beginPath(); c.moveTo(12, -60); c.lineTo(ar ? 21 : 15 + passo * 0.4, ar ? -88 : -38); c.stroke();
    c.fillStyle = q.pele; c.beginPath(); c.arc(0, -80, 13, 0, TAU); c.fill();
    c.fillStyle = q.cabelo; c.beginPath(); c.arc(0, -84, 13.5, Math.PI * 1.05, Math.PI * 1.95); c.fill();
    c.fillStyle = '#22223b';
    c.beginPath(); c.arc(5, -81, 1.8, 0, TAU); c.fill();
    if (q.medo > 0) { c.beginPath(); c.arc(6, -73, 3, 0, TAU); c.fill(); }   // boca de "oh!"
    else { c.strokeStyle = '#22223b'; c.lineWidth = 1.5; c.beginPath(); c.arc(4, -76, 4, 0.2, 2.2); c.stroke(); }
    c.restore();
  }

  function desenhaPessoas(c, W, frente, t) {
    const passeio = sy(0) - 62;
    for (const q of pessoas) {
      if ((q.z >= 0.5) !== frente) continue;
      const x = q.x - camX;
      if (x < -60 || x > W + 60) continue;
      const y = passeio + 30 + q.z * 160;
      c.save(); c.translate(x, y); pessoaArt(c, q, t); c.restore();
    }
  }

  function baloesPessoas(c, W) {
    const passeio = sy(0) - 62;
    for (const q of pessoas) {
      if (q.diz <= 0) continue;
      const x = q.x - camX;
      if (x < 40 || x > W - 40) continue;
      G.gfx.bubble(c, Math.max(96, Math.min(W - 96, x)), passeio + 30 + q.z * 160 - 70 * q.alt * (0.62 + 0.3 * q.z) - 10, q.txt);
    }
  }

  function bolaGosma(c, x, y, t) {
    c.fillStyle = '#2b2440';
    c.beginPath(); c.arc(x, y, 18, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(x - 6, y + 16, 6, 10 + Math.sin(t * 12) * 3, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(199,125,255,.75)';
    c.beginPath(); c.arc(x - 6, y - 6, 5, 0, TAU); c.fill();
  }

  S.draw = function (c, t) {
    const vs = vscale(), W = vw(), H = vh();
    c.save(); c.scale(vs, vs);
    cidade(c, W, H, t);
    const base = sy(0);
    desenhaPessoas(c, W, false, t);

    // sombras
    for (const r of [p, v]) {
      c.fillStyle = 'rgba(0,0,0,' + (0.3 * Math.max(0.3, 1 - r.alt / 400)) + ')';
      c.beginPath(); c.ellipse(r.x - camX, base + 6, 80, 14, 0, 0, TAU); c.fill();
    }

    // o Venom
    c.save(); c.translate(v.x - camX, sy(v.alt));
    if (fase === 'embrulhado') c.rotate(Math.sin(t * 9) * 0.05);
    if (v.pisca > 0 && Math.floor(t * 24) % 2 === 0) c.globalAlpha = 0.75;
    c.save(); if (v.dir < 0) c.scale(-1, 1);
    robo(c, t, { spidey: false, walk: v.walk, tent: v.tent, lat: v.lat, bloq: v.bloq, ri: v.ri || (fase === 'embrulhado' ? 0 : 0), t: t });
    c.restore();
    teiasNoRobo(c, fase === 'embrulhado' ? 100 : v.teias, t);
    c.restore();

    // o Spidey
    c.save(); c.translate(p.x - camX, sy(p.alt));
    if (p.colado > 0) c.rotate(Math.sin(t * 20) * 0.03);
    if (p.pisca > 0 && Math.floor(t * 24) % 2 === 0) c.globalAlpha = 0.75;
    c.save(); if (p.dir < 0) c.scale(-1, 1);
    robo(c, t, { spidey: true, walk: p.walk, soco: p.soco, tiro: p.tiro, t: t });
    c.restore();
    gosmaNoRobo(c, p.gosma, p.colado > 0, t);
    c.restore();
    // chamas dos jatos quando estão no ar
    for (const r of [p, v]) {
      if (r.alt <= 4) continue;
      const x = r.x - camX, y = sy(r.alt);
      for (const lx of [-30, 30]) {
        c.fillStyle = r === p ? '#ffb703' : '#c77dff';
        c.beginPath(); c.moveTo(x + lx - 12, y); c.lineTo(x + lx + 12, y); c.lineTo(x + lx, y + 30 + Math.random() * 16); c.closePath(); c.fill();
      }
    }

    desenhaPessoas(c, W, true, t);
    baloesPessoas(c, W);

    if (fase === 'embrulhado') {
      G.gfx.bubble(c, Math.max(110, Math.min(W - 110, v.x - camX)), sy(v.alt) - 280, 'Grrr! Estou preso! 😠');
    } else if (p.colado > 0) {
      G.gfx.bubble(c, Math.max(110, Math.min(W - 110, p.x - camX)), sy(p.alt) - 280, 'Que nojo! Abana! 😝');
    }

    // teias e gosma a voar
    for (const s of tiros) {
      const x = s.x - camX, y = sy(s.alt);
      c.save(); c.translate(x, y); c.rotate(s.t * 8);
      if (s.rede) {
        c.globalAlpha = 0.9; teiaRiscos(c, 70, 10, '#ffffff');
      } else {
        c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.fill();
        teiaRiscos(c, 18, 6, '#ffffff');
      }
      c.restore();
      c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x - s.dir * 18, y); c.lineTo(x - s.dir * 60, y); c.stroke();
    }
    for (const g of gotas) bolaGosma(c, g.x - camX, sy(g.alt), t);

    for (const q of puffs) {
      c.globalAlpha = Math.max(0, 0.75 * (1 - q.t / q.life));
      c.fillStyle = q.col; c.beginPath(); c.arc(q.x - camX, sy(q.alt), q.r, 0, TAU); c.fill();
    }
    c.globalAlpha = 1;
    for (const s of sparks) {
      c.globalAlpha = Math.max(0, 1 - s.t / s.life);
      G.gfx.star(c, s.x - camX, sy(s.alt), 6, s.col, s.t * 8);
    }
    c.globalAlpha = 1;
    for (const q of textos) {
      c.save(); c.globalAlpha = Math.max(0, 1 - q.t / 0.8);
      c.translate(q.x - camX, sy(q.alt)); c.rotate(-0.12); c.scale(1 + q.t * 0.4, 1 + q.t * 0.4);
      G.gfx.label(c, q.txt, 0, 0, 34, q.cor, 'center', '#22223b');
      c.restore();
    }
    c.restore();

    // o Venom está fora do ecrã: uma seta com a cara dele a mostrar para onde ir
    const vx = (v.x - camX) * vs;
    if (fase === 'luta' && (vx > G.W + 20 || vx < -20)) {
      const dir = vx > G.W ? 1 : -1, ax = dir > 0 ? G.W - 60 : 60, ay = G.H * 0.42 + Math.sin(t * 6) * 8;
      c.save(); c.translate(ax, ay);
      c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(0, 0, 34, 0, TAU); c.fill();
      caraVenom(c, 22, t, 0);
      c.restore();
      G.gfx.label(c, dir > 0 ? '▶' : '◀', ax + dir * 52, ay, 40, '#e63946', 'center', '#ffffff');
    }
    hud(c, t);
  };

  /* ---------- HUD: só desenhos (o Isaac ainda não lê) ---------- */
  function hud(c, t) {
    const k = Math.min(1, G.H / 520);
    c.save(); c.scale(k, k);
    G.gfx.star(c, 34, 36, 17, '#ffd166', 0);
    G.gfx.label(c, '' + G.state.stars, 60, 37, 28, '#b56b00');
    // o Venom e as teias que já tem (quando a barra enche fica embrulhado)
    c.save(); c.translate(34, 86); caraVenom(c, 20, t, 0); c.restore();
    barra(c, 64, 74, 170, 24, fase === 'embrulhado' ? 1 : v.teias / 100, '#ffffff', '#5a4b8a', true, t);
    // o nosso robô e a gosma que tem em cima
    c.save(); c.translate(34, 134); caraSpidey(c, 20); c.restore();
    barra(c, 64, 122, 170, 24, p.colado > 0 ? 1 : p.gosma / 100, '#2b2440', '#c77dff', false, t);
    // rede gigante a carregar
    c.save(); c.translate(34, 182);
    c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.fill();
    c.strokeStyle = carga >= 1 ? '#ffd60a' : '#ffffff'; c.lineWidth = 5;
    c.beginPath(); c.arc(0, 0, 20, -Math.PI / 2, -Math.PI / 2 + TAU * carga); c.stroke();
    teiaRiscos(c, carga >= 1 ? 14 + Math.sin(t * 8) * 2 : 12, 6, '#ffffff');
    c.restore();
    // rondas ganhas: uma teiazinha por cada
    for (let i = 0; i < Math.min(ronda - 1, 8); i++) {
      c.save(); c.translate(72 + i * 26, 182); teiaRiscos(c, 10, 6, '#ffd60a'); c.restore();
    }
    c.restore();
  }

  function barra(c, x, y, w, h, f, cor, borda, teia, t) {
    G.gfx.rr(c, x, y, w, h, h / 2); c.fillStyle = 'rgba(0,0,0,.4)'; c.fill();
    if (f > 0) {
      G.gfx.rr(c, x, y, Math.max(h, w * f), h, h / 2); c.fillStyle = cor; c.fill();
      if (teia) {
        c.save(); G.gfx.rr(c, x, y, Math.max(h, w * f), h, h / 2); c.clip();
        c.strokeStyle = 'rgba(90,75,138,.5)'; c.lineWidth = 1.5;
        for (let k = 0; k < w / 12; k++) { c.beginPath(); c.moveTo(x + k * 12, y); c.lineTo(x + k * 12 + 8, y + h); c.stroke(); }
        c.restore();
      }
    }
    G.gfx.rr(c, x, y, w, h, h / 2); c.strokeStyle = f >= 1 && Math.sin(t * 10) > 0 ? '#ffd60a' : borda; c.lineWidth = 3; c.stroke();
  }

  S.debug = function () {
    return {
      fase: fase, ronda: ronda, px: Math.round(p.x), vx: Math.round(v.x), palt: Math.round(p.alt), valt: Math.round(v.alt),
      teias: Math.round(v.teias), gosma: Math.round(p.gosma), colado: +p.colado.toFixed(1), carga: +carga.toFixed(2),
      tiros: tiros.length, gotas: gotas.length, bloq: v.bloq > 0, stars: G.state.stars,
      pessoas: pessoas.length, aAtravessar: pessoas.filter(function (q) { return q.estado === 'atravessa'; }).length,
      gotaPerto: gotas.reduce(function (mn, g) { const d = Math.abs(g.x - p.x); return d < mn ? d : mn; }, 9999)
    };
  };

  G.scenes = G.scenes || {};
  G.scenes.robos = S;
})();
