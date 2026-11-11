/* Cena — A CHITA, ditada pelo Isaac (2026-11-11).

   "Um jogo novo de animais: estamos num bosque e somos uma CHITA. Temos de apanhar
   as CABRAS e todas as GAZELAS. O bosque é GIGANTESCO, um jogo que nunca acaba, e
   podemos andar POR ONDE QUISERMOS."

   Como ficou:
   - Vê-se de cima. Somos uma chita dourada com pintas pretas, as riscas de lágrima na
     cara e a cauda comprida com a ponta preta. Anda-se para todos os lados: arrastar o
     dedo (ou o rato), as setas ◀ ▶ ↑ ↓ ou WASD, ou tocar num sítio e a chita corre lá.
   - 💨 (segurar) é a SUPER-VELOCIDADE da chita: gasta a barrinha do fôlego e, quando se
     larga, a barrinha volta a encher. 🐾 é o SALTO: a chita dá um pulo grande para a
     frente e apanha quem estiver onde ela cai (depois espera um bocadinho).
   - O bosque não tem fim: é inventado aos bocados (pedaços quadrados) à medida que a
     chita anda, sempre igual para o mesmo sítio — árvores, arbustos, pedras, flores,
     clareiras, lagos, riachos, colinas e troncos caídos.
   - Há manadas de CABRAS (fogem devagar mas sobem às pedras: aí só o salto 🐾 lá chega)
     e de GAZELAS (muito rápidas e aos ziguezagues, mas cansam-se), e às vezes coelhos,
     veados e javalis. Algumas manadas têm uma VIGIA que avisa as outras.
   - REGRA DA PAZ: ninguém é comido nem se magoa. "Apanhar" é tocar (como à apanhada):
     faz brilhos e um som alegre, o animal ganha um laço colorido e passa a seguir a
     chita como amigo, num carreirinho. Cabem 12 atrás da chita; os outros vão brincar
     para o prado e contam para a FAMÍLIA.
   - Nunca acaba e nunca se perde: de 10 em 10 cabras ou gazelas há festa com estrelas,
     e de vez em quando aparecem animais especiais (a gazela dourada, a cabra do sino e
     os bebés). O mapinha e a seta mostram sempre onde está a manada mais perto. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  /* ---------- afinação: está tudo aqui ---------- */
  const DIF = {
    TROTE: 260, SPRINT: 560, AGUA: 0.62,                 // velocidades da chita
    GASTO: 0.2, RECUPERA: 0.32, CANSADA_ATE: 0.35,       // fôlego (por segundo)
    SALTO_V: 660, SALTO_DUR: 0.42, SALTO_CD: 1.4, SALTO_ALCANCE: 30,
    TOQUE: 34,                                           // raio da "boca" da chita para apanhar
    V: { cabra: 290, gazela: 455, coelho: 360, veado: 400, javali: 270 },
    ALERTA: { cabra: 250, gazela: 330, coelho: 210, veado: 320, javali: 190 },
    CANSA: { cabra: 5, gazela: 3.4, coelho: 3, veado: 3.6, javali: 6 },
    R: { cabra: 20, gazela: 20, coelho: 12, veado: 24, javali: 21 },
    MEDO: 2.2, VIGIA: 1.7, ROCHA_T: [3.5, 5.5],
    MAX_SEG: 12, ESPACO: 4,                               // amigos atrás da chita e o espaço entre eles
    PERTO: 1500, MIN_PERTO: 12, MIN_MANADAS: 3, MAX_LIVRES: 70,
    ESP_T: 75                                             // pelo menos um especial a cada tantos segundos
  };
  const CH = 640;                                         // o tamanho de cada pedaço do bosque
  const RB = 2600;                                        // de quanto em quanto pode haver um riacho
  const LACOS = ['#ff4d6d', '#4cc9f0', '#ffd60a', '#9b5de5', '#06d6a0', '#ff8fab', '#f77f00', '#3a86ff'];
  const NUM = ['', 'dez', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa', 'cem'];
  const BEBES = { cabra: 'Um cabritinho', gazela: 'Uma gazela bebé', coelho: 'Um coelhinho bebé', veado: 'Um veadinho bebé', javali: 'Um javalizinho bebé' };

  let chita, animais, manadas, seguidores, rasto, parts, textos, chunks, visitados;
  let camX, camY, tempo, nid, piloto, destino, cont, falaT, espT, spawnT, limpaT, sinoT, stats, somSprint;

  /* ---------- ajudas ---------- */
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function escolhe(l) { return l[Math.floor(Math.random() * l.length)]; }
  function difAng(a, b) { return ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI; }
  function vscale() { return clamp(Math.min(G.W / 720, G.H / 640), 0.5, 1.15); }
  function vista() { const vs = vscale(); return { w: G.W / vs, h: G.H / vs }; }
  function sfx(n) { G.audio.sfx(n); }
  function fala(t) { if (G.audio.fala) G.audio.fala(t); }
  function diz(t, forte) { if (forte || tempo - falaT > 3.5) { fala(t); falaT = tempo; } }
  function texto(t, x, y, cor) { textos.push({ t: t, x: x, y: y, age: 0, life: 1.4, cor: cor || '#ffffff' }); }
  function chave(cx, cy) { return cx + ',' + cy; }

  // números "aleatórios" que são sempre iguais para o mesmo sítio do bosque
  function hash(a, b, s) {
    let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(s | 0, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function gerador(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- os riachos: linhas que serpenteiam pelo bosque todo ---------- */
  function temRiacho(j) { return hash(j, 991, 3) < 0.5; }
  function riachoY(j, x) {
    const f = hash(j, 17, 5) * TAU;
    return j * RB + RB * 0.5 + Math.sin(x / 820 + f) * 300 + Math.sin(x / 310 + f * 2) * 70;
  }
  function noRiacho(x, y, m) {
    const j = Math.floor(y / RB);
    for (let k = j - 1; k <= j + 1; k++) if (temRiacho(k) && Math.abs(y - riachoY(k, x)) < 38 + (m || 0)) return true;
    return false;
  }
  function noLago(L, x, y, m) {
    if (!L) return false;
    const dx = (x - L.x) / (L.rx + (m || 0)), dy = (y - L.y) / (L.ry + (m || 0));
    return dx * dx + dy * dy < 1;
  }
  function naAgua(x, y) {
    if (noRiacho(x, y, 0)) return true;
    const ch = chunks.get(chave(Math.floor(x / CH), Math.floor(y / CH)));
    return !!(ch && noLago(ch.lago, x, y, -6));
  }

  /* ---------- um pedaço do bosque ---------- */
  function geraChunk(cx, cy) {
    const r = gerador(Math.floor(hash(cx, cy, 7) * 4294967296));
    const x0 = cx * CH, y0 = cy * CH;
    const h = r();
    let tipo = h < 0.42 ? 'bosque' : (h < 0.68 ? 'clareira' : (h < 0.82 ? 'lago' : 'colina'));
    if (cx === 0 && cy === 0) tipo = 'clareira';
    const ch = { cx: cx, cy: cy, tipo: tipo, obj: [], manchas: [], relva: [], lago: null, colina: null, borboletas: 0 };
    if (tipo === 'lago') ch.lago = { x: x0 + CH * (0.32 + r() * 0.36), y: y0 + CH * (0.32 + r() * 0.36), rx: 120 + r() * 80, ry: 80 + r() * 50, nenufares: 2 + Math.floor(r() * 4) };
    if (tipo === 'colina') ch.colina = { x: x0 + CH * (0.3 + r() * 0.4), y: y0 + CH * (0.3 + r() * 0.4), r: 170 + r() * 90 };
    if (tipo === 'clareira') ch.borboletas = 1 + Math.floor(r() * 3);
    function livre(x, y, m) {
      if (noRiacho(x, y, m)) return false;
      if (noLago(ch.lago, x, y, m)) return false;
      if (cx === 0 && cy === 0 && Math.hypot(x - CH / 2, y - CH / 2) < 230) return false;
      return true;
    }
    function ponto() { return { x: x0 + r() * CH, y: y0 + r() * CH }; }
    // manchas de relva mais clara ou mais escura (para o chão não ser todo igual)
    const nm = 3 + Math.floor(r() * 3);
    for (let i = 0; i < nm; i++) {
      const p = ponto();
      ch.manchas.push({ x: p.x, y: p.y, rx: 90 + r() * 170, ry: 70 + r() * 120,
        cor: tipo === 'bosque' ? (r() < 0.7 ? '#5f9d48' : '#6aa851') : (r() < 0.6 ? '#94cc6c' : '#82bd60') });
    }
    for (let i = 0; i < 14; i++) { const p = ponto(); ch.relva.push({ x: p.x, y: p.y, s: 0.7 + r() * 0.6 }); }
    const nArv = tipo === 'bosque' ? 10 + Math.floor(r() * 6) : (tipo === 'clareira' ? 1 + Math.floor(r() * 3) : 4 + Math.floor(r() * 4));
    for (let i = 0; i < nArv; i++) {
      const p = ponto(), rr = 42 + r() * 34;
      if (livre(p.x, p.y, rr * 0.6)) ch.obj.push({ t: 'arvore', x: p.x, y: p.y, r: rr, pinheiro: r() < 0.35, v: r() });
    }
    const nArb = 2 + Math.floor(r() * 5);
    for (let i = 0; i < nArb; i++) {
      const p = ponto();
      if (livre(p.x, p.y, 20)) ch.obj.push({ t: 'arbusto', x: p.x, y: p.y, r: 18 + r() * 14, bagas: r() < 0.35, v: r() });
    }
    const nRoc = tipo === 'colina' ? 4 + Math.floor(r() * 4) : (tipo === 'lago' ? Math.floor(r() * 2) : 1 + Math.floor(r() * 2));
    for (let i = 0; i < nRoc; i++) {
      let p = ponto();
      if (ch.colina && r() < 0.7) { const a = r() * TAU, d = r() * ch.colina.r * 0.8; p = { x: ch.colina.x + Math.cos(a) * d, y: ch.colina.y + Math.sin(a) * d }; }
      if (livre(p.x, p.y, 30)) ch.obj.push({ t: 'rocha', x: p.x, y: p.y, r: 24 + r() * 16, v: r() });
    }
    const nFlo = tipo === 'clareira' ? 26 + Math.floor(r() * 14) : 6 + Math.floor(r() * 8);
    for (let i = 0; i < nFlo; i++) {
      const p = ponto();
      if (livre(p.x, p.y, 4)) ch.obj.push({ t: 'flor', x: p.x, y: p.y, cor: ['#ff6b9a', '#ffd60a', '#ffffff', '#c77dff', '#ff9f1c'][Math.floor(r() * 5)], v: r() });
    }
    if (r() < 0.28) {
      const p = ponto();
      if (livre(p.x, p.y, 50)) ch.obj.push({ t: 'tronco', x: p.x, y: p.y, ang: r() * Math.PI, len: 70 + r() * 50 });
    }
    if (r() < 0.25) {
      const p = ponto();
      if (livre(p.x, p.y, 10)) ch.obj.push({ t: 'cogumelos', x: p.x, y: p.y, v: r() });
    }
    if (ch.lago) {
      const n = 7 + Math.floor(r() * 5);
      for (let i = 0; i < n; i++) {
        const a = r() * TAU;
        ch.obj.push({ t: 'junco', x: ch.lago.x + Math.cos(a) * (ch.lago.rx + 6), y: ch.lago.y + Math.sin(a) * (ch.lago.ry + 6), v: r() });
      }
    }
    ch.obj.sort(function (a, b) { return a.y - b.y; });
    return ch;
  }
  function chunk(cx, cy) {
    const k = chave(cx, cy);
    let ch = chunks.get(k);
    if (!ch) { ch = geraChunk(cx, cy); chunks.set(k, ch); }
    return ch;
  }
  function rochaPerto(x, y, maxD) {
    const cx = Math.floor(x / CH), cy = Math.floor(y / CH);
    let melhor = null, md = maxD;
    for (let i = cx - 1; i <= cx + 1; i++) for (let j = cy - 1; j <= cy + 1; j++) {
      const ch = chunks.get(chave(i, j));
      if (!ch) continue;
      for (const o of ch.obj) {
        if (o.t !== 'rocha') continue;
        const d = Math.hypot(o.x - x, o.y - y);
        if (d < md) { md = d; melhor = o; }
      }
    }
    return melhor;
  }

  /* ---------- começar ---------- */
  S.enter = function () {
    chunks = new Map(); visitados = new Set();
    animais = []; manadas = []; seguidores = []; rasto = []; parts = []; textos = [];
    tempo = 0; nid = 0; destino = null; falaT = -10; espT = 40; spawnT = 0; limpaT = 0; sinoT = 0; somSprint = -10;
    cont = { cabra: 0, gazela: 0, outros: 0, especiais: 0, familia: 0, total: 0 };
    stats = { apanhados: [], saltos: 0, sprints: 0, rochas: 0, vigias: 0, especiaisVistos: 0 };
    chita = { x: CH / 2, y: CH / 2, vx: 0, vy: 0, a: -Math.PI / 2, passo: 0, folego: 1, cansada: false, corre: false,
      salto: 0, saltoCd: 0, h: 0, lingua: 0 };
    camX = chita.x; camY = chita.y;
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) chunk(i, j);
    // logo ao princípio há gazelas e cabras ali perto
    novaManada(chita.x + 520, chita.y - 260, 'gazela');
    novaManada(chita.x - 480, chita.y + 320, 'cabra');
    novaManada(chita.x + 200, chita.y + 760, null);
    G.banner('🐆 O bosque gigante', 2600);
    diz('Somos uma chita! Vamos apanhar as cabras e as gazelas todas!', true);
  };

  /* ---------- as manadas ---------- */
  function novaManada(x, y, tipoForcado, espForcado) {
    const r = Math.random();
    const tipo = tipoForcado || (r < 0.42 ? 'cabra' : (r < 0.84 ? 'gazela' : escolhe(['coelho', 'veado', 'javali'])));
    const n = { cabra: [4, 7], gazela: [5, 8], coelho: [3, 5], veado: [2, 4], javali: [2, 4] }[tipo];
    const quantos = n[0] + Math.floor(Math.random() * (n[1] - n[0] + 1));
    const m = { id: ++nid, tipo: tipo, x: x, y: y, alerta: 0, cx: x, cy: y, n: 0 };
    manadas.push(m);
    let esp = espForcado || null;
    if (!esp && (espT <= 0 || Math.random() < 0.14)) {
      if (tipo === 'cabra') esp = Math.random() < 0.55 ? 'sino' : 'bebe';
      else if (tipo === 'gazela') esp = Math.random() < 0.6 ? 'dourada' : 'bebe';
      else esp = 'bebe';
    }
    if (esp) { espT = DIF.ESP_T; stats.especiaisVistos++; }
    const comVigia = quantos >= 4 && Math.random() < 0.55;
    for (let i = 0; i < quantos; i++) {
      let px = x, py = y;
      for (let k = 0; k < 8; k++) {
        px = x + rnd(-120, 120); py = y + rnd(-110, 110);
        if (!naAgua(px, py)) break;
      }
      const an = bicho(tipo, px, py, m);
      if (i === 0 && comVigia) an.vigia = true;
      if (i === quantos - 1 && esp) {
        an.esp = esp;
        if (esp === 'bebe') an.r *= 0.65;
      }
      animais.push(an);
    }
    if (esp === 'dourada') { G.banner('✨ Há uma gazela DOURADA no bosque!', 2400); diz('Olha! Há uma gazela dourada no bosque!', true); }
    else if (esp === 'sino') { G.banner('🔔 Ouve-se a cabra do sino!', 2200); diz('Dlim, dlim! É a cabra do sino!'); }
    else if (esp === 'bebe') diz('Há um bebé ali na manada! Que fofinho!');
    return m;
  }
  function bicho(tipo, x, y, m) {
    return { id: ++nid, tipo: tipo, x: x, y: y, vx: 0, vy: 0, ang: rnd(0, TAU), r: DIF.R[tipo], m: m.id,
      estado: 'pasta', medo: 0, cansa: 0, pausa: rnd(0, 2), alvo: null, t: rnd(0, 10), fase: rnd(0, TAU), passo: rnd(0, 6),
      vigia: false, esp: null, rochaT: 0, rochaCd: 0, rocha: null, alt: 0, laco: null, alpha: 1, aviso: 0, pulo: 0 };
  }
  function livres() { return animais.filter(function (a) { return a.estado !== 'amigo' && a.estado !== 'prado'; }); }
  function manadaDe(an) { for (const m of manadas) if (m.id === an.m) return m; return null; }

  /* ---------- o mundo à volta da chita: pedaços novos, animais novos, e arrumar o que fica longe ---------- */
  function mundo(dt) {
    const ccx = Math.floor(chita.x / CH), ccy = Math.floor(chita.y / CH);
    visitados.add(chave(ccx, ccy));
    const v = vista(), raio = Math.ceil(Math.max(v.w, v.h) / 2 / CH) + 1;
    for (let i = ccx - raio; i <= ccx + raio; i++) for (let j = ccy - raio; j <= ccy + raio; j++) chunk(i, j);
    espT -= dt;
    limpaT -= dt;
    if (limpaT <= 0) {
      limpaT = 1;
      const R = raio + 2;
      chunks.forEach(function (ch, k) { if (Math.abs(ch.cx - ccx) > R || Math.abs(ch.cy - ccy) > R) chunks.delete(k); });
      const longe = Math.max(2800, Math.hypot(v.w, v.h) / 2 + 1300);
      animais = animais.filter(function (a) {
        if (a.estado === 'amigo' || a.estado === 'prado') return true;
        return Math.hypot(a.x - chita.x, a.y - chita.y) < longe;
      });
      manadas = manadas.filter(function (m) { return animais.some(function (a) { return a.m === m.id && a.estado !== 'amigo' && a.estado !== 'prado'; }); });
    }
    spawnT -= dt;
    if (spawnT <= 0) {
      spawnT = 0.5;
      const ls = livres();
      let perto = 0;
      const mPerto = new Set();
      for (const a of ls) if (Math.hypot(a.x - chita.x, a.y - chita.y) < DIF.PERTO) { perto++; mPerto.add(a.m); }
      if ((perto < DIF.MIN_PERTO || mPerto.size < DIF.MIN_MANADAS) && ls.length < DIF.MAX_LIVRES) {
        const p = sitioNovo(v);
        if (p) novaManada(p.x, p.y, null);
      }
    }
  }
  // um sítio para uma manada nova: fora do ecrã, de preferência para onde a chita vai e onde ainda não esteve
  function sitioNovo(v) {
    const dMin = Math.hypot(v.w, v.h) / 2 + 120;
    const dirMov = Math.hypot(chita.vx, chita.vy) > 30 ? Math.atan2(chita.vy, chita.vx) : chita.a;
    let melhor = null, ms = -1e9;
    for (let i = 0; i < 10; i++) {
      const a = rnd(0, TAU), d = rnd(dMin, dMin + 450);
      const x = chita.x + Math.cos(a) * d, y = chita.y + Math.sin(a) * d;
      if (naAgua(x, y)) continue;
      let s = Math.cos(difAng(a, dirMov)) * 1.2 + Math.random() * 0.8;
      if (!visitados.has(chave(Math.floor(x / CH), Math.floor(y / CH)))) s += 1.5;
      for (const m of manadas) if (Math.hypot(m.cx - x, m.cy - y) < 500) s -= 2;
      if (s > ms) { ms = s; melhor = { x: x, y: y }; }
    }
    return melhor;
  }

  /* ---------- comandos ---------- */
  function paraMundo(px, py) {
    const vs = vscale();
    return { x: camX + (px - G.W / 2) / vs, y: camY + (py - G.H / 2) / vs };
  }
  function leInput() {
    if (piloto) return autopiloto();
    const I = G.input, a = I.axis();
    let ax = a.x, ay = a.y;
    if (Math.hypot(ax, ay) > 0.15) destino = null;
    else {
      // tocar (ou ter o dedo pousado) num sítio: a chita corre para lá
      if (I.drag && I.drag.on) destino = paraMundo(I.drag.sx + I.drag.dx, I.drag.sy + I.drag.dy);
      else if (I.tap) destino = paraMundo(I.tap.x, I.tap.y);
      if (destino) {
        const dx = destino.x - chita.x, dy = destino.y - chita.y, d = Math.hypot(dx, dy);
        if (d < 26) destino = null;
        else { const f = Math.min(1, d / 90); ax = dx / d * f; ay = dy / d * f; }
      }
    }
    return { ax: ax, ay: ay, corre: I.isHeld('fire'), salta: I.justPressed('horn') };
  }

  /* ---------- o piloto automático (para testar): vai ao animal livre mais perto ---------- */
  function autopiloto() {
    let alvo = null, md = 1e9;
    for (const an of animais) {
      if (an.estado === 'amigo' || an.estado === 'prado') continue;
      let d = Math.hypot(an.x - chita.x, an.y - chita.y);
      if (an.estado === 'rocha' && chita.saltoCd > 0.3) d += 250;
      if (d < md) { md = d; alvo = an; }
    }
    if (!alvo) {
      const a = tempo * 0.2;
      return { ax: Math.cos(a), ay: Math.sin(a), corre: false, salta: false };
    }
    const tx = alvo.x + alvo.vx * 0.22, ty = alvo.y + alvo.vy * 0.22;
    const dx = tx - chita.x, dy = ty - chita.y, d = Math.hypot(dx, dy) || 1;
    const foge = alvo.medo > 0 || alvo.estado === 'rocha';
    const corre = chita.folego > 0.06 && ((foge && d < 650) || d < 280);
    const alinhado = Math.abs(difAng(chita.a, Math.atan2(dy, dx))) < 0.4;
    const salta = d < 230 && alinhado && chita.saltoCd <= 0 && chita.salto <= 0;
    return { ax: dx / d, ay: dy / d, corre: corre, salta: salta };
  }

  /* ---------- update ---------- */
  S.update = function (dt) {
    dt = Math.min(dt, 1 / 30);
    tempo += dt;
    const inp = leInput();
    atualizaChita(dt, inp);
    mundo(dt);
    atualizaAnimais(dt);
    atualizaSeguidores(dt);
    apanhar();
    for (const p of parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94; }
    parts = parts.filter(function (p) { return p.t < p.life; });
    for (const tx of textos) { tx.age += dt; tx.y -= 40 * dt; }
    textos = textos.filter(function (tx) { return tx.age < tx.life; });
    // a câmara segue a chita (e olha um bocadinho para a frente)
    const fx = chita.x + chita.vx * 0.25, fy = chita.y + chita.vy * 0.25;
    camX += (fx - camX) * Math.min(1, dt * 5);
    camY += (fy - camY) * Math.min(1, dt * 5);
    if (typeof document !== 'undefined' && document.body) document.body.classList.toggle('chita-salto-espera', chita.saltoCd > 0 || chita.salto > 0);
  };

  function atualizaChita(dt, inp) {
    const c = chita;
    let ax = inp.ax, ay = inp.ay;
    const mag = Math.min(1, Math.hypot(ax, ay));
    if (mag > 1e-3) { const n = Math.hypot(ax, ay); ax /= n; ay /= n; }
    // o fôlego: a super-velocidade gasta, descansar enche
    const quer = inp.corre && mag > 0.1 && c.salto <= 0;
    const corria = c.corre;
    c.corre = quer && !c.cansada;
    if (c.corre) {
      c.folego -= DIF.GASTO * dt;
      if (!corria) { stats.sprints++; if (tempo - somSprint > 1.2) { sfx('whoosh'); somSprint = tempo; } }
      if (c.folego <= 0) {
        c.folego = 0; c.cansada = true; c.corre = false;
        texto('uf!', c.x, c.y - 50, '#ffe8a3');
        diz('Uf, a chita está cansada. Já recupera!');
      }
    } else {
      c.folego = Math.min(1, c.folego + DIF.RECUPERA * dt * (mag < 0.1 ? 1.5 : 1));
      if (c.cansada && c.folego >= DIF.CANSADA_ATE) c.cansada = false;
    }
    c.saltoCd = Math.max(0, c.saltoCd - dt);
    const agua = naAgua(c.x, c.y);
    if (inp.salta && c.saltoCd <= 0 && c.salto <= 0) {
      if (mag > 0.1) c.a = Math.atan2(ay, ax);
      c.salto = DIF.SALTO_DUR; stats.saltos++;
      sfx('boing');
    }
    if (c.salto > 0) {
      c.salto -= dt;
      const v = DIF.SALTO_V;
      c.vx = Math.cos(c.a) * v; c.vy = Math.sin(c.a) * v;
      c.h = Math.sin(Math.PI * clamp(1 - c.salto / DIF.SALTO_DUR, 0, 1));
      if (c.salto <= 0) {
        c.salto = 0; c.h = 0; c.saltoCd = DIF.SALTO_CD;
        c.vx *= 0.4; c.vy *= 0.4;
        poeira(c.x, c.y, 8);
        if (agua) salpico(c.x, c.y, 10);
      }
    } else {
      const vmax = (c.corre ? DIF.SPRINT : DIF.TROTE) * (agua ? DIF.AGUA : 1);
      const tx = ax * mag * vmax, ty = ay * mag * vmax;
      const k = Math.min(1, dt * (mag > 0.1 ? 7 : 9));
      c.vx += (tx - c.vx) * k; c.vy += (ty - c.vy) * k;
      if (mag > 0.1) {
        const alvo = Math.atan2(ay, ax);
        c.a += difAng(c.a, alvo) * Math.min(1, dt * 11);
      }
    }
    c.x += c.vx * dt; c.y += c.vy * dt;
    const vel = Math.hypot(c.vx, c.vy);
    c.passo += vel * dt * 0.05;
    c.lingua = Math.max(0, c.lingua - dt);
    if (c.corre && Math.random() < dt * 22) poeira(c.x - Math.cos(c.a) * 34, c.y - Math.sin(c.a) * 34, 1);
    if (agua && vel > 60 && c.salto <= 0 && Math.random() < dt * 14) salpico(c.x, c.y, 2);
    // o carreiro por onde a chita passou (os amigos vão por ele)
    if (!rasto.length || Math.hypot(rasto[0].x - c.x, rasto[0].y - c.y) > 12) {
      rasto.unshift({ x: c.x, y: c.y });
      if (rasto.length > (DIF.MAX_SEG + 3) * DIF.ESPACO) rasto.pop();
    }
  }

  function atualizaAnimais(dt) {
    // o meio de cada manada (onde pastam)
    for (const m of manadas) { m.sx = 0; m.sy = 0; m.n = 0; m.alerta = Math.max(0, m.alerta - dt); }
    const porId = {};
    for (const m of manadas) porId[m.id] = m;
    for (const a of animais) {
      if (a.estado === 'amigo' || a.estado === 'prado') continue;
      const m = porId[a.m];
      if (m) { m.sx += a.x; m.sy += a.y; m.n++; }
    }
    for (const m of manadas) if (m.n) { m.cx = m.sx / m.n; m.cy = m.sy / m.n; }
    sinoT -= dt;
    for (const an of animais) {
      an.t += dt;
      an.aviso = Math.max(0, an.aviso - dt);
      if (an.estado === 'prado') {
        // vai brincar para o prado com a família: afasta-se e desaparece devagarinho
        an.vx = Math.cos(an.vaiA) * 150; an.vy = Math.sin(an.vaiA) * 150;
        an.x += an.vx * dt; an.y += an.vy * dt; an.ang = an.vaiA; an.passo += dt * 8;
        an.alpha -= dt / 3.5;
        continue;
      }
      if (an.estado === 'amigo') continue;
      const m = porId[an.m];
      const dx = an.x - chita.x, dy = an.y - chita.y, d = Math.hypot(dx, dy) || 1;
      let alcance = DIF.ALERTA[an.tipo] * (an.vigia ? DIF.VIGIA : 1) * (chita.corre ? 1.15 : 1);
      if (d < alcance) {
        if (an.medo <= 0 && an.estado !== 'rocha') an.aviso = 0.8;
        an.medo = DIF.MEDO;
        if (m && an.vigia && m.alerta <= 0) {
          m.alerta = 3; stats.vigias++;
          texto('!', an.x, an.y - 40, '#ff4d6d');
          sfx('guincho');
          diz('A vigia viu-nos! Corre, chita!');
        }
      }
      if (m && m.alerta > 0 && d < 1000 && an.estado !== 'rocha') an.medo = Math.max(an.medo, 1.2);
      if (an.esp === 'sino' && d < 600 && sinoT <= 0) { sinoT = 1.6; sfx('clic'); }
      const agua = naAgua(an.x, an.y);
      if (an.estado === 'rocha') {
        // em cima da pedra: só o salto da chita lá chega
        an.rochaT -= dt;
        an.vx = 0; an.vy = 0;
        an.alt = 12;
        an.ang += difAng(an.ang, Math.atan2(-dy, -dx)) * Math.min(1, dt * 4);
        if (an.rochaT <= 0) {
          an.estado = 'pasta'; an.alt = 0; an.rochaCd = 7; an.rocha = null;
          const fa = Math.atan2(dy, dx);
          an.x += Math.cos(fa) * 40; an.y += Math.sin(fa) * 40; an.pulo = 0.35;
          an.medo = d < 500 ? DIF.MEDO : 0;
          sfx('hop');
        }
        continue;
      }
      an.rochaCd = Math.max(0, an.rochaCd - dt);
      an.pulo = Math.max(0, an.pulo - dt);
      let tvx = 0, tvy = 0;
      if (an.medo > 0) {
        an.medo -= dt;
        an.cansa += dt;
        an.pausa = 0;
        let fx = dx / d, fy = dy / d;
        if (m && m.n > 1) {
          const mx = m.cx - an.x, my = m.cy - an.y, md = Math.hypot(mx, my);
          if (md > 60) { fx += mx / md * 0.3; fy += my / md * 0.3; }
        }
        if (an.tipo === 'gazela' || an.tipo === 'coelho') {
          // ziguezague!
          const z = Math.sin(an.t * (an.tipo === 'gazela' ? 5 : 7) + an.fase) * 0.9;
          fx += -dy / d * z; fy += dx / d * z;
        }
        if (an.tipo === 'cabra' && an.rochaCd <= 0) {
          const r = rochaPerto(an.x, an.y, 320);
          if (r && Math.hypot(r.x - chita.x, r.y - chita.y) > 90) {
            const rx = r.x - an.x, ry = r.y - an.y, rd = Math.hypot(rx, ry) || 1;
            if (rd < r.r * 0.7) {
              an.estado = 'rocha'; an.rocha = r; an.x = r.x + rnd(-6, 6); an.y = r.y + rnd(-6, 6);
              an.rochaT = rnd(DIF.ROCHA_T[0], DIF.ROCHA_T[1]); stats.rochas++;
              sfx('hop'); texto('🐾?', an.x, an.y - 46, '#ffffff');
              diz('A cabra subiu à pedra! Salta, chita!');
              continue;
            }
            fx = rx / rd; fy = ry / rd;
          }
        }
        const fn = Math.hypot(fx, fy) || 1;
        let v = DIF.V[an.tipo] * (an.esp === 'bebe' ? 0.72 : 1) * (an.esp === 'dourada' ? 1.08 : 1);
        if (an.cansa > DIF.CANSA[an.tipo]) v *= 0.6;
        tvx = fx / fn * v; tvy = fy / fn * v;
        if (an.medo <= 0) an.alvo = null;
      } else {
        an.cansa = Math.max(0, an.cansa - dt * 0.6);
        // pastar: andar devagarinho perto da manada e parar a comer erva
        if (an.pausa > 0) an.pausa -= dt;
        else {
          if (!an.alvo) {
            const bx = m ? m.cx : an.x, by = m ? m.cy : an.y;
            an.alvo = { x: bx + rnd(-90, 90), y: by + rnd(-90, 90) };
          }
          const ax = an.alvo.x - an.x, ay = an.alvo.y - an.y, ad = Math.hypot(ax, ay);
          if (ad < 8) { an.alvo = null; an.pausa = rnd(1, 3.5); }
          else { tvx = ax / ad * 45; tvy = ay / ad * 45; }
        }
      }
      if (agua) { tvx *= 0.6; tvy *= 0.6; }
      const k = Math.min(1, dt * (an.medo > 0 ? 6 : 3));
      an.vx += (tvx - an.vx) * k; an.vy += (tvy - an.vy) * k;
      an.x += an.vx * dt; an.y += an.vy * dt;
      const sp = Math.hypot(an.vx, an.vy);
      if (sp > 8) an.ang += difAng(an.ang, Math.atan2(an.vy, an.vx)) * Math.min(1, dt * 8);
      an.passo += sp * dt * 0.07;
      if (agua && sp > 100 && Math.random() < dt * 6) salpico(an.x, an.y, 1);
    }
    animais = animais.filter(function (a) { return a.estado !== 'prado' || a.alpha > 0; });
  }

  function atualizaSeguidores(dt) {
    for (let i = 0; i < seguidores.length; i++) {
      const an = seguidores[i];
      const idx = Math.min(rasto.length - 1, (i + 1) * DIF.ESPACO);
      let tx = chita.x, ty = chita.y, ang = chita.a;
      if (idx >= 0) {
        tx = rasto[idx].x; ty = rasto[idx].y;
        const nx = rasto[Math.max(0, idx - 1)];
        if (nx !== rasto[idx]) ang = Math.atan2(nx.y - ty, nx.x - tx);
      }
      // cada um vai um bocadinho para o lado, para parecer uma manada e não uma fila
      const lado = Math.sin(i * 1.7 + 0.5) * 18;
      tx += -Math.sin(ang) * lado; ty += Math.cos(ang) * lado;
      const dx = tx - an.x, dy = ty - an.y, d = Math.hypot(dx, dy);
      const v = Math.min(d * 3.5, 700);
      if (d > 3) { an.vx = dx / d * v; an.vy = dy / d * v; } else { an.vx = 0; an.vy = 0; }
      an.x += an.vx * dt; an.y += an.vy * dt;
      const sp = Math.hypot(an.vx, an.vy);
      if (sp > 10) an.ang += difAng(an.ang, Math.atan2(an.vy, an.vx)) * Math.min(1, dt * 8);
      an.passo += sp * dt * 0.07;
    }
  }

  /* ---------- apanhar (tocar!) ---------- */
  function apanhar() {
    const c = chita;
    const bx = c.x + Math.cos(c.a) * 30, by = c.y + Math.sin(c.a) * 30;
    const noAr = c.salto > 0;
    for (const an of animais) {
      if (an.estado === 'amigo' || an.estado === 'prado') continue;
      if (an.estado === 'rocha' && !(noAr && c.h > 0.2)) continue;
      const raio = DIF.TOQUE + an.r + (noAr ? DIF.SALTO_ALCANCE : 0);
      if (Math.hypot(an.x - bx, an.y - by) < raio || Math.hypot(an.x - c.x, an.y - c.y) < raio * 0.8) apanha(an);
    }
  }
  function apanha(an) {
    an.estado = 'amigo'; an.medo = 0; an.alt = 0; an.rocha = null;
    an.laco = LACOS[cont.total % LACOS.length];
    cont.total++;
    const grupo = an.tipo === 'cabra' || an.tipo === 'gazela' ? an.tipo : 'outros';
    cont[grupo]++;
    stats.apanhados.push({ t: +tempo.toFixed(1), tipo: an.tipo, esp: an.esp });
    chita.lingua = 0.8;
    brilhos(an.x, an.y, an.esp ? 30 : 16, an.esp === 'dourada' ? '#ffd60a' : an.laco);
    texto('+' + (an.esp ? 5 : 1), an.x, an.y - 34, '#ffd60a');
    G.addStars(an.esp ? 5 : 1);
    sfx(an.esp ? 'star' : 'pop');
    sfx(an.tipo === 'cabra' ? 'camelo' : 'giggle');
    // os marcos de 10 em 10
    let marco = false;
    if (grupo !== 'outros' && cont[grupo] % 10 === 0) {
      marco = true;
      const n = cont[grupo], k = n / 10;
      const palavra = k < NUM.length ? NUM[k] : '' + n;
      const nome = grupo === 'cabra' ? 'cabras' : 'gazelas';
      G.banner((grupo === 'cabra' ? '🐐 ' : '🦌 ') + n + ' ' + nome + '! ⭐⭐⭐', 2800);
      G.addStars(10); sfx('tada');
      diz('Já são ' + palavra + ' ' + nome + '!', true);
      for (let i = 0; i < 3; i++) brilhos(chita.x + rnd(-80, 80), chita.y + rnd(-80, 80), 12, LACOS[i * 2]);
    }
    if (an.esp) {
      cont.especiais++;
      const msg = an.esp === 'dourada' ? ['✨ A gazela dourada é nossa amiga!', 'Apanhei a gazela dourada! Que brilho!']
        : (an.esp === 'sino' ? ['🔔 A cabra do sino é nossa amiga!', 'Apanhei a cabra do sino! Dlim, dlim!']
          : ['🍼 ' + BEBES[an.tipo] + '!', 'Apanhei ' + BEBES[an.tipo].toLowerCase() + '! Que fofinho!']);
      if (!marco) { G.banner(msg[0], 2200); diz(msg[1], true); }
    } else if (!marco) {
      const l = {
        cabra: ['Apanhei uma cabra!', 'Mais uma cabra amiga!', 'Méé! Apanhei-te!'],
        gazela: ['Apanhei uma gazela!', 'Uma gazela amiga!', 'Que gazela tão rápida!'],
        coelho: ['Apanhei um coelho!'], veado: ['Apanhei um veado!'], javali: ['Apanhei um javali!']
      }[an.tipo];
      diz(escolhe(l));
    }
    seguidores.push(an);
    if (seguidores.length > DIF.MAX_SEG) {
      const sai = seguidores.shift();
      sai.estado = 'prado'; sai.alpha = 1;
      sai.vaiA = Math.atan2(sai.y - chita.y, sai.x - chita.x) + rnd(-0.6, 0.6);
      cont.familia++;
      texto('♥', sai.x, sai.y - 30, '#ff4d6d');
      sfx('heart');
      if (cont.familia === 1 || cont.familia % 10 === 0) diz('Vai brincar para o prado com a família!');
    }
  }

  /* ---------- partículas ---------- */
  function brilhos(x, y, n, cor) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, TAU), v = rnd(80, 260);
      parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: rnd(0.5, 0.9), r: rnd(5, 10), cor: i % 3 ? cor : '#ffffff', tipo: 'estrela', rot: rnd(0, TAU) });
    }
  }
  function poeira(x, y, n) {
    for (let i = 0; i < n; i++) parts.push({ x: x + rnd(-8, 8), y: y + rnd(-8, 8), vx: rnd(-60, 60), vy: rnd(-60, 60), t: 0, life: rnd(0.35, 0.6), r: rnd(6, 12), cor: 'rgba(214,190,140,.7)', tipo: 'p' });
  }
  function salpico(x, y, n) {
    for (let i = 0; i < n; i++) { const a = rnd(0, TAU), v = rnd(40, 140); parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: rnd(0.3, 0.55), r: rnd(3, 6), cor: 'rgba(220,245,255,.9)', tipo: 'p' }); }
  }

  /* ---------- desenhar ---------- */
  S.draw = function (c, t) {
    const vs = vscale(), v = vista();
    const x0 = camX - v.w / 2, y0 = camY - v.h / 2, x1 = x0 + v.w, y1 = y0 + v.h;
    c.fillStyle = '#76b85a'; c.fillRect(0, 0, G.W, G.H);
    c.save();
    c.translate(G.W / 2, G.H / 2); c.scale(vs, vs); c.translate(-camX, -camY);
    const cs = [];
    for (let i = Math.floor(x0 / CH) - 1; i <= Math.floor(x1 / CH) + 1; i++)
      for (let j = Math.floor(y0 / CH) - 1; j <= Math.floor(y1 / CH) + 1; j++) cs.push(chunk(i, j));
    const dentro = function (o, m) { return o.x > x0 - m && o.x < x1 + m && o.y > y0 - m && o.y < y1 + m; };
    // o chão: manchas, colinas e lagos
    for (const ch of cs) for (const mn of ch.manchas) {
      c.fillStyle = mn.cor; c.beginPath(); c.ellipse(mn.x, mn.y, mn.rx, mn.ry, 0, 0, TAU); c.fill();
    }
    for (const ch of cs) if (ch.colina) colina(c, ch.colina);
    riachos(c, x0, y0, x1, y1, t);
    for (const ch of cs) if (ch.lago) lago(c, ch.lago, t);
    for (const ch of cs) for (const g of ch.relva) if (dentro(g, 20)) relva(c, g);
    // o que fica no chão
    for (const ch of cs) for (const o of ch.obj) {
      if (!dentro(o, 140)) continue;
      if (o.t === 'arvore') { c.fillStyle = 'rgba(30,60,20,.28)'; c.beginPath(); c.ellipse(o.x + 14, o.y + 16, o.r, o.r * 0.85, 0, 0, TAU); c.fill(); }
      else if (o.t === 'flor') flor(c, o, t);
      else if (o.t === 'rocha') rocha(c, o);
      else if (o.t === 'tronco') tronco(c, o);
      else if (o.t === 'arbusto') arbusto(c, o);
      else if (o.t === 'junco') junco(c, o, t);
      else if (o.t === 'cogumelos') cogumelos(c, o);
    }
    // os animais e a chita, de cima para baixo
    const ents = [];
    for (const an of animais) if (dentro(an, 80)) ents.push(an);
    ents.push(chita);
    ents.sort(function (a, b) { return a.y - b.y; });
    for (const e of ents) { if (e === chita) desenhaChita(c, chita, t); else desenhaAnimal(c, e, t); }
    // as copas das árvores ficam por cima (ficam transparentes quando há alguém por baixo)
    for (const ch of cs) for (const o of ch.obj) {
      if (o.t !== 'arvore' || !dentro(o, 120)) continue;
      let alpha = 0.95;
      if (Math.hypot(o.x - chita.x, o.y - chita.y) < o.r + 30) alpha = 0.45;
      else for (const an of ents) if (an !== chita && Math.hypot(o.x - an.x, o.y - an.y) < o.r) { alpha = 0.6; break; }
      copa(c, o, alpha, t);
    }
    for (const ch of cs) for (let i = 0; i < ch.borboletas; i++) borboleta(c, ch, i, t);
    // brilhos, poeira e textos
    for (const p of parts) {
      c.globalAlpha = Math.max(0, 1 - p.t / p.life);
      if (p.tipo === 'estrela') G.gfx.star(c, p.x, p.y, p.r, p.cor, p.rot + p.t * 4);
      else { c.fillStyle = p.cor; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); }
    }
    c.globalAlpha = 1;
    for (const tx of textos) {
      c.globalAlpha = Math.max(0, 1 - tx.age / tx.life);
      G.gfx.label(c, tx.t, tx.x, tx.y, 30, tx.cor, 'center', '#3d2b1f');
    }
    c.globalAlpha = 1;
    if (destino && !piloto) {
      c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 4;
      c.beginPath(); c.arc(destino.x, destino.y, 16 + Math.sin(t * 8) * 3, 0, TAU); c.stroke();
    }
    bussola(c, x0, y0, x1, y1, t);
    c.restore();
    hud(c, t);
  };

  function riachos(c, x0, y0, x1, y1, t) {
    const j0 = Math.floor((y0 - 400) / RB), j1 = Math.floor((y1 + 400) / RB);
    for (let j = j0; j <= j1; j++) {
      if (!temRiacho(j)) continue;
      const pts = [];
      for (let x = x0 - 120; x <= x1 + 120; x += 30) pts.push(x, riachoY(j, x));
      const linha = function (cor, w, dash, off) {
        c.strokeStyle = cor; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
        if (c.setLineDash) c.setLineDash(dash || []);
        c.lineDashOffset = off || 0;
        c.beginPath(); c.moveTo(pts[0], pts[1]);
        for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
        c.stroke();
      };
      linha('#c9b07a', 96); linha('#3a9bd9', 74); linha('rgba(150,215,250,.7)', 6, [26, 40], -t * 60);
      if (c.setLineDash) c.setLineDash([]);
    }
  }
  function lago(c, L, t) {
    c.fillStyle = '#d9c38c'; c.beginPath(); c.ellipse(L.x, L.y, L.rx + 12, L.ry + 12, 0, 0, TAU); c.fill();
    c.fillStyle = '#3a9bd9'; c.beginPath(); c.ellipse(L.x, L.y, L.rx, L.ry, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(160,220,255,.55)'; c.beginPath(); c.ellipse(L.x - L.rx * 0.25, L.y - L.ry * 0.3, L.rx * 0.45, L.ry * 0.25, 0, 0, TAU); c.fill();
    for (let i = 0; i < L.nenufares; i++) {
      const a = i * 2.1 + 0.4, x = L.x + Math.cos(a) * L.rx * 0.55, y = L.y + Math.sin(a) * L.ry * 0.5 + Math.sin(t + i) * 2;
      c.fillStyle = '#4caf50'; c.beginPath(); c.arc(x, y, 13, 0.4, TAU - 0.1); c.lineTo(x, y); c.fill();
      if (i % 2 === 0) { c.fillStyle = '#ffafcc'; c.beginPath(); c.arc(x + 3, y - 2, 5, 0, TAU); c.fill(); }
    }
  }
  function colina(c, C) {
    const cores = ['#8dc66a', '#9ad277', '#a8dc86'];
    for (let i = 0; i < 3; i++) {
      const r = C.r * (1 - i * 0.28);
      c.fillStyle = cores[i]; c.beginPath(); c.ellipse(C.x - i * 10, C.y - i * 12, r, r * 0.82, 0, 0, TAU); c.fill();
    }
  }
  function relva(c, g) {
    c.strokeStyle = '#4f8f3c'; c.lineWidth = 2.5; c.lineCap = 'round';
    c.beginPath();
    for (let k = -1; k <= 1; k++) { c.moveTo(g.x + k * 5 * g.s, g.y); c.lineTo(g.x + k * 8 * g.s, g.y - 10 * g.s); }
    c.stroke();
  }
  function flor(c, o, t) {
    const s = 0.8 + o.v * 0.5;
    c.fillStyle = o.cor;
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + o.v * 3; c.beginPath(); c.arc(o.x + Math.cos(a) * 4 * s, o.y + Math.sin(a) * 4 * s, 3.4 * s, 0, TAU); c.fill(); }
    c.fillStyle = o.cor === '#ffd60a' ? '#f77f00' : '#ffd60a'; c.beginPath(); c.arc(o.x, o.y, 2.6 * s, 0, TAU); c.fill();
  }
  function rocha(c, o) {
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(o.x + 6, o.y + 8, o.r, o.r * 0.75, 0, 0, TAU); c.fill();
    c.fillStyle = '#9a9a96'; c.beginPath(); c.ellipse(o.x, o.y, o.r, o.r * 0.8, o.v, 0, TAU); c.fill();
    c.fillStyle = '#b9b9b4'; c.beginPath(); c.ellipse(o.x - o.r * 0.25, o.y - o.r * 0.25, o.r * 0.55, o.r * 0.4, o.v, 0, TAU); c.fill();
    c.strokeStyle = '#7a7a76'; c.lineWidth = 2; c.beginPath(); c.moveTo(o.x + o.r * 0.1, o.y - o.r * 0.1); c.lineTo(o.x + o.r * 0.45, o.y + o.r * 0.25); c.stroke();
  }
  function tronco(c, o) {
    c.save(); c.translate(o.x, o.y); c.rotate(o.ang);
    c.fillStyle = 'rgba(0,0,0,.2)'; G.gfx.rr(c, -o.len / 2 + 6, -12, o.len, 28, 12); c.fill();
    c.fillStyle = '#8b5e34'; G.gfx.rr(c, -o.len / 2, -14, o.len, 28, 12); c.fill();
    c.strokeStyle = '#6f4518'; c.lineWidth = 2;
    for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(-o.len / 2 + 14, i * 7); c.lineTo(o.len / 2 - 18, i * 7 + 2); c.stroke(); }
    c.fillStyle = '#d4a373'; c.beginPath(); c.ellipse(o.len / 2 - 4, 0, 6, 13, 0, 0, TAU); c.fill();
    c.strokeStyle = '#a47148'; c.beginPath(); c.ellipse(o.len / 2 - 4, 0, 3, 7, 0, 0, TAU); c.stroke();
    c.fillStyle = '#6a994e'; c.beginPath(); c.arc(-o.len * 0.15, -12, 7, 0, TAU); c.fill();
    c.restore();
  }
  function arbusto(c, o) {
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(o.x + 5, o.y + 7, o.r, o.r * 0.8, 0, 0, TAU); c.fill();
    const cores = ['#3f8f3a', '#4ea845', '#5cba52'];
    for (let i = 0; i < 4; i++) {
      const a = i * 1.7 + o.v * 5;
      c.fillStyle = cores[i % 3]; c.beginPath(); c.arc(o.x + Math.cos(a) * o.r * 0.4, o.y + Math.sin(a) * o.r * 0.35, o.r * 0.65, 0, TAU); c.fill();
    }
    if (o.bagas) { c.fillStyle = '#e63946'; for (let i = 0; i < 5; i++) { const a = i * 1.3 + o.v; c.beginPath(); c.arc(o.x + Math.cos(a) * o.r * 0.5, o.y + Math.sin(a) * o.r * 0.45, 3.2, 0, TAU); c.fill(); } }
  }
  function junco(c, o, t) {
    c.strokeStyle = '#5a7d2a'; c.lineWidth = 3; c.lineCap = 'round';
    const bal = Math.sin(t * 1.5 + o.v * 6) * 3;
    for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(o.x + k * 4, o.y); c.lineTo(o.x + k * 6 + bal, o.y - 20); c.stroke(); }
    c.fillStyle = '#7b4a24'; c.beginPath(); c.ellipse(o.x + bal, o.y - 22, 3, 7, 0, 0, TAU); c.fill();
  }
  function cogumelos(c, o) {
    for (let i = 0; i < 3; i++) {
      const x = o.x + (i - 1) * 9, y = o.y + (i === 1 ? -4 : 2);
      c.fillStyle = '#f1e3c8'; c.fillRect(x - 2, y, 4, 6);
      c.fillStyle = '#e63946'; c.beginPath(); c.arc(x, y, 6, Math.PI, 0); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x - 2, y - 3, 1.4, 0, TAU); c.arc(x + 2.5, y - 2, 1.2, 0, TAU); c.fill();
    }
  }
  function copa(c, o, alpha, t) {
    c.globalAlpha = alpha;
    const bal = Math.sin(t * 0.8 + o.v * 9) * 2;
    if (o.pinheiro) {
      const cores = ['#2d6a4f', '#40916c', '#52b788'];
      for (let k = 0; k < 3; k++) {
        const r = o.r * (1 - k * 0.3);
        c.fillStyle = cores[k]; c.beginPath();
        for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + k * 0.2, rr = i % 2 ? r * 0.72 : r; c.lineTo(o.x + bal + Math.cos(a) * rr, o.y - k * 4 + Math.sin(a) * rr); }
        c.closePath(); c.fill();
      }
    } else {
      const cores = ['#3a7d32', '#4a9a3f', '#5fb34f'];
      c.fillStyle = cores[0]; c.beginPath(); c.arc(o.x + bal, o.y, o.r, 0, TAU); c.fill();
      for (let i = 0; i < 5; i++) {
        const a = i * 1.26 + o.v * 4;
        c.fillStyle = cores[1 + (i % 2)];
        c.beginPath(); c.arc(o.x + bal + Math.cos(a) * o.r * 0.45, o.y + Math.sin(a) * o.r * 0.45, o.r * 0.5, 0, TAU); c.fill();
      }
      c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(o.x + bal - o.r * 0.3, o.y - o.r * 0.35, o.r * 0.35, 0, TAU); c.fill();
      if (o.v > 0.75) { c.fillStyle = '#e63946'; for (let i = 0; i < 4; i++) { const a = i * 1.6 + o.v; c.beginPath(); c.arc(o.x + Math.cos(a) * o.r * 0.6, o.y + Math.sin(a) * o.r * 0.55, 4, 0, TAU); c.fill(); } }
    }
    c.globalAlpha = 1;
  }
  function borboleta(c, ch, i, t) {
    const bx = ch.cx * CH + CH * (0.3 + 0.4 * hash(ch.cx, ch.cy, 40 + i)), by = ch.cy * CH + CH * (0.3 + 0.4 * hash(ch.cx, ch.cy, 50 + i));
    const x = bx + Math.sin(t * 0.7 + i * 2) * 90, y = by + Math.sin(t * 1.1 + i) * 60;
    const asa = Math.abs(Math.sin(t * 14 + i)) * 7 + 2;
    c.fillStyle = ['#ffb703', '#ff6b9a', '#8ecae6'][i % 3];
    c.beginPath(); c.ellipse(x - 4, y, asa, 6, 0, 0, TAU); c.ellipse(x + 4, y, asa, 6, 0, 0, TAU); c.fill();
    c.fillStyle = '#333'; c.fillRect(x - 1, y - 5, 2, 10);
  }

  /* ---------- a chita, vista de cima ---------- */
  const PINTAS = [[-22, -6, 3.2], [-14, 5, 3], [-6, -8, 2.8], [2, 6, 3.2], [10, -5, 2.8], [18, 4, 2.6], [-26, 4, 2.6], [-10, -1, 2.4],
    [6, -1, 2.4], [22, -3, 2.2], [-18, 9, 2.2], [14, 9, 2.2], [-2, 10, 2.2], [-4, -11, 2.2], [16, -10, 2.2], [-28, -2, 2]];
  function desenhaChita(c, ch, t) {
    const h = ch.h, K = 1 + h * 0.4;
    const vel = Math.hypot(ch.vx, ch.vy), amp = Math.min(1, vel / 300), p = ch.passo;
    // sombra
    c.save(); c.translate(ch.x + h * 18, ch.y + h * 26); c.rotate(ch.a);
    c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(0, 0, 50 * (1 - h * 0.2), 19 * (1 - h * 0.2), 0, 0, TAU); c.fill();
    c.restore();
    c.save(); c.translate(ch.x, ch.y - h * 22); c.rotate(ch.a); c.scale(K * (ch.corre ? 1.08 : 1), K * (ch.corre ? 0.94 : 1));
    // a cauda comprida, a abanar, com anéis e a ponta preta
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const u = i / 10;
      pts.push({ x: -30 - u * 60, y: Math.sin(t * 5 - u * 3 + p * 0.5) * u * (8 + amp * 8) + (h > 0 ? -u * 6 : 0) });
    }
    c.lineCap = 'round';
    for (let i = 0; i < 10; i++) {
      const u = i / 10;
      c.strokeStyle = u >= 0.82 ? '#1a1a1a' : ((u > 0.55 && i % 2 === 0) ? '#2b2b2b' : '#e9a93a');
      c.lineWidth = 8 - u * 3;
      c.beginPath(); c.moveTo(pts[i].x, pts[i].y); c.lineTo(pts[i + 1].x, pts[i + 1].y); c.stroke();
    }
    // as patas (a galopar)
    const patas = [[20, -13, 0], [20, 13, Math.PI], [-20, -13, Math.PI * 0.5], [-20, 13, Math.PI * 1.5]];
    for (const pt of patas) {
      const off = h > 0 ? (pt[0] > 0 ? 10 : -10) : Math.sin(p + pt[2]) * 11 * amp;
      c.fillStyle = '#e09b2d'; c.beginPath(); c.ellipse(pt[0] + off, pt[1] * (h > 0 ? 1.15 : 1), 8, 5, 0, 0, TAU); c.fill();
      c.fillStyle = '#3a2a1a'; c.beginPath(); c.arc(pt[0] + off + 6, pt[1] * (h > 0 ? 1.15 : 1), 1.6, 0, TAU); c.fill();
    }
    // o corpo
    c.fillStyle = '#f4b942'; c.strokeStyle = '#c98a1d'; c.lineWidth = 2.5;
    c.beginPath(); c.ellipse(0, 0, 36, 15, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#f7cd6b'; c.beginPath(); c.ellipse(2, 0, 28, 7, 0, 0, TAU); c.fill();
    c.fillStyle = '#1f1a14';
    for (const s of PINTAS) { c.beginPath(); c.arc(s[0], s[1], s[2], 0, TAU); c.fill(); }
    // a cabeça
    c.fillStyle = '#f4b942'; c.strokeStyle = '#c98a1d';
    c.beginPath(); c.arc(41, 0, 14, 0, TAU); c.fill(); c.stroke();
    // orelhas
    for (const sy of [-1, 1]) {
      c.fillStyle = '#2b2118'; c.beginPath(); c.ellipse(34, sy * 11, 5, 4, 0, 0, TAU); c.fill();
      c.fillStyle = '#f4b942'; c.beginPath(); c.ellipse(35, sy * 10, 3, 2.4, 0, 0, TAU); c.fill();
    }
    // focinho
    c.fillStyle = '#fbe3b0'; c.beginPath(); c.ellipse(51, 0, 7, 7, 0, 0, TAU); c.fill();
    c.fillStyle = '#2b2118'; c.beginPath(); c.moveTo(57, -3); c.lineTo(57, 3); c.lineTo(53, 0); c.closePath(); c.fill();
    // olhos e as riscas de lágrima pretas
    for (const sy of [-1, 1]) {
      c.fillStyle = '#ffbf3c'; c.beginPath(); c.arc(45, sy * 6, 2.8, 0, TAU); c.fill();
      c.fillStyle = '#111'; c.beginPath(); c.arc(46, sy * 6, 1.4, 0, TAU); c.fill();
      c.strokeStyle = '#111'; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(46.5, sy * 8); c.quadraticCurveTo(50, sy * 9.5, 52, sy * 6.5); c.stroke();
    }
    c.fillStyle = '#1f1a14'; c.beginPath(); c.arc(34, -3, 1.6, 0, TAU); c.arc(36, 3, 1.4, 0, TAU); c.fill();
    if (ch.lingua > 0) { c.fillStyle = '#ff7b9c'; c.beginPath(); c.ellipse(59, 2, 4, 2.4, 0.3, 0, TAU); c.fill(); }
    c.restore();
  }

  /* ---------- os animais, vistos de cima ---------- */
  const COR = {
    cabra: ['#f4f1ea', '#d9c7aa', '#e9e4d8'], gazela: ['#d9a066'], coelho: ['#a89584', '#c8b8a6'],
    veado: ['#9c6234'], javali: ['#5b4636']
  };
  function desenhaAnimal(c, an, t) {
    c.save();
    c.globalAlpha = an.estado === 'prado' ? Math.max(0, an.alpha) : 1;
    const s = an.r / DIF.R[an.tipo] * (an.esp === 'bebe' ? 1 : 1);
    const pulo = an.pulo > 0 ? Math.sin(an.pulo / 0.35 * Math.PI) * 14 : 0;
    const hop = an.tipo === 'coelho' && Math.hypot(an.vx, an.vy) > 30 ? Math.abs(Math.sin(an.passo * 1.5)) * 8 : 0;
    const alt = an.alt + pulo + hop;
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(an.x + alt * 0.4, an.y + 4 + alt * 0.4, an.r * 1.15, an.r * 0.6, 0, 0, TAU); c.fill();
    c.translate(an.x, an.y - alt); c.rotate(an.ang); c.scale(s, s);
    const sp = Math.hypot(an.vx, an.vy);
    corpoAnimal(c, an.tipo, { id: an.id, passo: an.passo, amp: Math.min(1, sp / 200), come: an.estado === 'pasta' && an.pausa > 0,
      esp: an.esp, laco: an.laco, bebe: an.esp === 'bebe', vigia: an.vigia }, t);
    c.restore();
    // por cima, sem rodar: o aviso da vigia, a pedra e o brilho dourado
    if (an.aviso > 0 || (an.vigia && an.estado === 'pasta' && an.medo <= 0 && Math.sin(t * 2 + an.id) > 0.6)) {
      G.gfx.label(c, an.aviso > 0 ? '!' : '?', an.x, an.y - 36 - alt, 22, an.aviso > 0 ? '#ff4d6d' : '#ffffff', 'center', '#3d2b1f');
    }
    if (an.esp === 'dourada' && an.estado !== 'prado') G.gfx.star(c, an.x + Math.sin(t * 3 + an.id) * 18, an.y - 20 + Math.cos(t * 4) * 10, 6, '#fff3b0', t * 3);
    if (an.estado === 'rocha') G.gfx.label(c, '🐾', an.x, an.y - 44 - alt + Math.sin(t * 6) * 3, 20, '#ffffff', 'center', 'none');
    if (an.estado === 'amigo' && Math.sin(t * 1.3 + an.id * 2.1) > 0.985) texto('♥', an.x, an.y - 26, an.laco);
  }
  function corpoAnimal(c, tipo, o, t) {
    const p = o.passo, amp = o.amp;
    const cor = COR[tipo][o.id % COR[tipo].length];
    const escuro = tipo === 'javali' ? '#3b2c22' : (tipo === 'veado' ? '#6b3e1e' : (tipo === 'gazela' ? '#5c3a1e' : '#8a7a68'));
    let corpo = o.esp === 'dourada' ? '#ffd23f' : cor;
    const cab = o.bebe ? 1.3 : 1;
    if (tipo === 'coelho') {
      c.fillStyle = corpo; c.beginPath(); c.ellipse(0, 0, 14, 11, 0, 0, TAU); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(-14, 0, 5, 0, TAU); c.fill();
      c.fillStyle = corpo; c.beginPath(); c.arc(13, 0, 8 * cab, 0, TAU); c.fill();
      for (const sy of [-1, 1]) {
        c.fillStyle = corpo; c.beginPath(); c.ellipse(4, sy * 6, 11, 3.6, sy * 0.25, 0, TAU); c.fill();
        c.fillStyle = '#f4b6c2'; c.beginPath(); c.ellipse(4, sy * 6, 7, 1.6, sy * 0.25, 0, TAU); c.fill();
        c.fillStyle = '#111'; c.beginPath(); c.arc(16, sy * 4, 1.5, 0, TAU); c.fill();
      }
      c.fillStyle = '#f4b6c2'; c.beginPath(); c.arc(21, 0, 2, 0, TAU); c.fill();
      if (o.laco) laco(c, 8, 0, o.laco);
      return;
    }
    // patas
    for (const pt of [[12, -8, 0], [12, 8, Math.PI], [-12, -8, Math.PI], [-12, 8, 0]]) {
      const off = Math.sin(p * 2 + pt[2]) * 7 * amp;
      c.fillStyle = escuro; c.beginPath(); c.ellipse(pt[0] + off, pt[1] * 1.15, 4, 2.6, 0, 0, TAU); c.fill();
    }
    // cauda
    c.strokeStyle = tipo === 'gazela' ? '#2b1d10' : corpo; c.lineWidth = tipo === 'javali' ? 2 : 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-19, 0); c.lineTo(-27, Math.sin(t * 6 + o.id) * 3); c.stroke();
    // corpo
    c.fillStyle = corpo; c.beginPath(); c.ellipse(0, 0, 21, tipo === 'javali' ? 12 : 10.5, 0, 0, TAU); c.fill();
    if (tipo === 'gazela') {
      c.fillStyle = o.esp === 'dourada' ? '#f7b801' : '#5c3a1e';
      c.fillRect(-14, -10, 26, 2.4); c.fillRect(-14, 7.6, 26, 2.4);
      c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(-16, 0, 5, 6, 0, 0, TAU); c.fill();
    } else if (tipo === 'veado') {
      c.fillStyle = '#f5e6cc'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-12 + i * 5, (i % 2 ? 4 : -4), 1.8, 0, TAU); c.fill(); }
    } else if (tipo === 'javali') {
      c.strokeStyle = '#2a1e16'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(-16, 0); c.lineTo(12, 0); c.stroke();
    } else if (tipo === 'cabra' && o.id % 3 === 1) {
      c.fillStyle = '#b08968'; c.beginPath(); c.ellipse(-6, 2, 8, 6, 0.4, 0, TAU); c.fill();
    }
    // pescoço e cabeça (a comer erva = cabeça mais à frente e mais baixa)
    const hx = (o.come ? 24 : 21) + (tipo === 'gazela' || tipo === 'veado' ? 3 : 0);
    const hr = (tipo === 'javali' ? 8.5 : 7) * cab;
    c.fillStyle = corpo; c.beginPath(); c.ellipse(hx - 6, 0, 7, 5, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(hx, 0, hr * 1.15, hr, 0, 0, TAU); c.fill();
    // chifres, hastes e presas
    c.lineCap = 'round';
    if (tipo === 'cabra' && !o.bebe) {
      c.strokeStyle = '#8d8478'; c.lineWidth = 3;
      for (const sy of [-1, 1]) { c.beginPath(); c.moveTo(hx - 1, sy * 3); c.quadraticCurveTo(hx - 9, sy * 9, hx - 13, sy * 5); c.stroke(); }
      c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(hx + 7, 0, 3, 2, 0, 0, TAU); c.fill();   // a barbicha
    } else if (tipo === 'gazela' && !o.bebe) {
      c.strokeStyle = '#1f150c'; c.lineWidth = 2.4;
      for (const sy of [-1, 1]) { c.beginPath(); c.moveTo(hx - 2, sy * 2.5); c.quadraticCurveTo(hx - 12, sy * 5, hx - 20, sy * 3); c.stroke(); }
    } else if (tipo === 'veado' && !o.bebe && o.id % 2 === 0) {
      c.strokeStyle = '#7a5230'; c.lineWidth = 2.6;
      for (const sy of [-1, 1]) {
        c.beginPath(); c.moveTo(hx - 2, sy * 3); c.lineTo(hx - 10, sy * 12); c.lineTo(hx - 18, sy * 14);
        c.moveTo(hx - 7, sy * 9); c.lineTo(hx - 4, sy * 16); c.moveTo(hx - 12, sy * 12.6); c.lineTo(hx - 12, sy * 19); c.stroke();
      }
    } else if (tipo === 'javali') {
      c.fillStyle = '#d4a5a5'; c.beginPath(); c.ellipse(hx + 8, 0, 4, 4.5, 0, 0, TAU); c.fill();
      c.strokeStyle = '#ffffff'; c.lineWidth = 2.2;
      for (const sy of [-1, 1]) { c.beginPath(); c.moveTo(hx + 6, sy * 4); c.quadraticCurveTo(hx + 10, sy * 8, hx + 8, sy * 10); c.stroke(); }
    }
    // orelhas e olhos
    for (const sy of [-1, 1]) {
      c.fillStyle = tipo === 'gazela' ? '#c48a52' : corpo;
      c.beginPath(); c.ellipse(hx - 3, sy * (hr + 1.5), tipo === 'cabra' ? 5 : 4, 2.4, sy * 0.6, 0, TAU); c.fill();
      c.fillStyle = '#111'; c.beginPath(); c.arc(hx + 2, sy * hr * 0.55, 1.5 * cab, 0, TAU); c.fill();
    }
    if (tipo === 'gazela') { c.strokeStyle = '#2b1d10'; c.lineWidth = 1.4; for (const sy of [-1, 1]) { c.beginPath(); c.moveTo(hx + 2, sy * 4.5); c.lineTo(hx + 7, sy * 3); c.stroke(); } }
    if (o.esp === 'sino') {
      c.fillStyle = '#ffd166'; c.strokeStyle = '#b5838d'; c.lineWidth = 1.5;
      c.beginPath(); c.arc(hx - 9, 0, 4.5, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#7a5c00'; c.beginPath(); c.arc(hx - 9, 0, 1.4, 0, TAU); c.fill();
    }
    if (o.vigia) { c.strokeStyle = '#ffffff'; c.lineWidth = 1.5; c.beginPath(); c.arc(hx, 0, hr + 3, -0.8, 0.8); c.stroke(); }
    if (o.laco) laco(c, hx - 8, 0, o.laco);
  }
  // o laço colorido dos amigos
  function laco(c, x, y, cor) {
    c.fillStyle = cor;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x - 5, y - 8); c.lineTo(x + 5, y - 8); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(x, y); c.lineTo(x - 5, y + 8); c.lineTo(x + 5, y + 8); c.closePath(); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x, y, 2.6, 0, TAU); c.fill();
    c.strokeStyle = cor; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 2.6, 0, TAU); c.stroke();
  }

  /* ---------- a seta que mostra a manada mais perto (quando não há nenhum animal à vista) ---------- */
  function maisPerto() {
    let alvo = null, md = 1e9;
    for (const an of animais) {
      if (an.estado === 'amigo' || an.estado === 'prado') continue;
      const d = Math.hypot(an.x - chita.x, an.y - chita.y);
      if (d < md) { md = d; alvo = an; }
    }
    return alvo;
  }
  function bussola(c, x0, y0, x1, y1, t) {
    const alvo = maisPerto();
    if (!alvo) return;
    if (alvo.x > x0 + 40 && alvo.x < x1 - 40 && alvo.y > y0 + 40 && alvo.y < y1 - 40) return;
    const a = Math.atan2(alvo.y - chita.y, alvo.x - chita.x), r = 92 + Math.sin(t * 6) * 8;
    c.save(); c.translate(chita.x + Math.cos(a) * r, chita.y + Math.sin(a) * r); c.rotate(a);
    c.fillStyle = alvo.esp === 'dourada' ? '#ffd60a' : '#ffffff'; c.strokeStyle = '#3d2b1f'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(22, 0); c.lineTo(-10, -16); c.lineTo(-4, 0); c.lineTo(-10, 16); c.closePath(); c.fill(); c.stroke();
    c.restore();
  }

  /* ---------- o painel (só desenhos): estrelas, cabras, gazelas, família, fôlego, salto e mapinha ---------- */
  function icone(c, tipo, x, y, k, t, esp) {
    c.save(); c.translate(x, y); c.rotate(-Math.PI / 2); c.scale(k, k);
    corpoAnimal(c, tipo, { id: 0, passo: 0, amp: 0, come: false, esp: esp || null, laco: null }, t);
    c.restore();
  }
  function hud(c, t) {
    const k = clamp(Math.min(G.W, G.H) / 560, 0.62, 1.15);
    const W = G.W / k;
    c.save(); c.scale(k, k);
    c.fillStyle = 'rgba(255,255,255,.72)'; G.gfx.rr(c, 8, 8, 184, 196, 16); c.fill();
    G.gfx.star(c, 32, 32, 15, '#ffd166', 0);
    G.gfx.label(c, '' + G.state.stars, 54, 33, 24, '#b56b00');
    icone(c, 'cabra', 32, 70, 0.75, t);
    G.gfx.label(c, '' + cont.cabra, 54, 70, 26, '#6b4f2a');
    icone(c, 'gazela', 118, 70, 0.75, t);
    G.gfx.label(c, '' + cont.gazela, 138, 70, 26, '#8a4f12');
    icone(c, 'coelho', 32, 108, 0.8, t);
    G.gfx.label(c, '' + cont.outros, 54, 108, 22, '#6b5a4a');
    G.gfx.heart(c, 118, 110, 26, '#ff4d6d');
    G.gfx.label(c, '' + cont.familia, 138, 108, 22, '#c9184a');
    // o fôlego da super-velocidade: riscas de vento + barrinha
    c.strokeStyle = '#4361ee'; c.lineWidth = 3; c.lineCap = 'round';
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(18 + i * 3, 138 + i * 6); c.lineTo(34 + i * 3, 138 + i * 6); c.stroke(); }
    const f = chita.folego;
    c.fillStyle = 'rgba(0,0,0,.18)'; G.gfx.rr(c, 46, 136, 136, 16, 8); c.fill();
    const piscar = chita.cansada && Math.sin(t * 10) > 0;
    c.fillStyle = piscar ? '#ffadad' : (f > 0.5 ? '#52b788' : (f > 0.25 ? '#ffb703' : '#e85d04'));
    G.gfx.rr(c, 46, 136, Math.max(14, 136 * f), 16, 8); c.fill();
    // o salto: pegada com anel que enche
    const pronto = chita.saltoCd <= 0 && chita.salto <= 0;
    const enc = pronto ? 1 : 1 - chita.saltoCd / DIF.SALTO_CD;
    c.save(); c.translate(36, 180);
    c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(0, 0, 18, 0, TAU); c.fill();
    c.strokeStyle = pronto ? '#2dc653' : '#adb5bd'; c.lineWidth = 5;
    c.beginPath(); c.arc(0, 0, 18, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(enc, 0, 1)); c.stroke();
    const s = pronto ? 1 + Math.sin(t * 6) * 0.06 : 0.9;
    c.scale(s, s); c.fillStyle = pronto ? '#6b3e1e' : '#999';
    c.beginPath(); c.ellipse(0, 4, 6, 5, 0, 0, TAU); c.fill();
    for (const d of [[-7, -3], [-2.5, -8], [2.5, -8], [7, -3]]) { c.beginPath(); c.arc(d[0], d[1], 2.6, 0, TAU); c.fill(); }
    c.restore();
    // os amigos atrás da chita (bolinhas com as cores dos laços)
    for (let i = 0; i < DIF.MAX_SEG; i++) {
      const x = 66 + (i % 6) * 20, y = 172 + Math.floor(i / 6) * 18;
      c.fillStyle = i < seguidores.length ? seguidores[i].laco : 'rgba(0,0,0,.12)';
      c.beginPath(); c.arc(x, y, 7, 0, TAU); c.fill();
    }
    mapinha(c, W - 72, 132, 58, t);   // abaixo dos botões 🏠 e 🔊
    c.restore();
  }
  function mapinha(c, mx, my, R, t) {
    const esc = R / DIF.PERTO;
    c.save();
    c.fillStyle = 'rgba(40,90,40,.75)'; c.beginPath(); c.arc(mx, my, R + 4, 0, TAU); c.fill();
    c.fillStyle = 'rgba(160,210,130,.92)'; c.beginPath(); c.arc(mx, my, R, 0, TAU); c.fill();
    c.beginPath(); c.arc(mx, my, R, 0, TAU); c.clip();
    for (const an of animais) {
      if (an.estado === 'amigo' || an.estado === 'prado') continue;
      const dx = (an.x - chita.x) * esc, dy = (an.y - chita.y) * esc;
      if (dx * dx + dy * dy > R * R) continue;
      if (an.esp) G.gfx.star(c, mx + dx, my + dy, 5, '#ffd60a', 0);
      else {
        c.fillStyle = an.tipo === 'cabra' ? '#ffffff' : (an.tipo === 'gazela' ? '#c8742c' : '#6b5a4a');
        c.beginPath(); c.arc(mx + dx, my + dy, 3, 0, TAU); c.fill();
      }
    }
    c.restore();
    // a chita no meio (seta para onde está virada)
    c.save(); c.translate(mx, my); c.rotate(chita.a);
    c.fillStyle = '#f4b942'; c.strokeStyle = '#3d2b1f'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(8, 0); c.lineTo(-5, -5); c.lineTo(-5, 5); c.closePath(); c.fill(); c.stroke();
    c.restore();
    // se o mais perto está fora do mapinha, uma setinha na borda
    const alvo = maisPerto();
    if (alvo && Math.hypot(alvo.x - chita.x, alvo.y - chita.y) * esc > R) {
      const a = Math.atan2(alvo.y - chita.y, alvo.x - chita.x);
      c.save(); c.translate(mx + Math.cos(a) * (R - 6), my + Math.sin(a) * (R - 6)); c.rotate(a);
      c.fillStyle = Math.sin(t * 8) > 0 ? '#ffd60a' : '#ffffff';
      c.beginPath(); c.moveTo(7, 0); c.lineTo(-5, -6); c.lineTo(-5, 6); c.closePath(); c.fill();
      c.restore();
    }
  }

  S.debug = function () {
    return { x: Math.round(chita.x), y: Math.round(chita.y), chunk: [Math.floor(chita.x / CH), Math.floor(chita.y / CH)],
      chunks: chunks.size, visitados: visitados.size, livres: livres().length, manadas: manadas.length,
      seguidores: seguidores.length, familia: cont.familia, cabras: cont.cabra, gazelas: cont.gazela, outros: cont.outros,
      especiais: cont.especiais, total: cont.total, folego: +chita.folego.toFixed(2), cansada: chita.cansada,
      corre: chita.corre, salto: chita.salto > 0, saltoCd: +chita.saltoCd.toFixed(2), piloto: piloto,
      tempo: +tempo.toFixed(1), porMinuto: tempo > 0 ? +(cont.total / tempo * 60).toFixed(1) : 0,
      stats: { saltos: stats.saltos, sprints: stats.sprints, rochas: stats.rochas, vigias: stats.vigias, especiaisVistos: stats.especiaisVistos } };
  };
  S.api = {
    autopiloto: function (on) { piloto = on === undefined ? !piloto : !!on; return piloto; },
    cheetah: function () { return chita; },
    animais: function () { return animais; },
    apanhados: function () { return { cabras: cont.cabra, gazelas: cont.gazela, outros: cont.outros, especiais: cont.especiais, familia: cont.familia, total: cont.total, lista: stats.apanhados }; },
    seguidores: function () { return seguidores; },
    manadas: function () { return manadas; },
    teleporta: function (x, y) { chita.x = x; chita.y = y; camX = x; camY = y; rasto = []; },
    especial: function (esp) {   // 'dourada' | 'sino' | 'bebe': põe uma manada com esse especial ali perto
      const a = chita.a, x = chita.x + Math.cos(a) * 500, y = chita.y + Math.sin(a) * 500;
      return novaManada(x, y, esp === 'dourada' ? 'gazela' : (esp === 'sino' ? 'cabra' : null), esp || 'dourada').id;
    },
    enche: function () { chita.folego = 1; chita.cansada = false; chita.saltoCd = 0; },
    dif: DIF
  };

  G.scenes = G.scenes || {};
  G.scenes.chita = S;
})();
