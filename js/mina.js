/* Cena — A MINA DOS BRILHANTES, inventada em palco nas Bitcoin Talks (2026-11-15).

   "Temos de destruir o chão e apanhar moedas e brilhantes, e no final sai um esqueleto
   gigante: temos de apanhar brilhantes e esmagá-lo com a ferramenta que temos.
   Tem de ser muito difícil."

   Como ficou:
   - Visto de lado. O Isaac mineiro anda com ◀ ▶, salta com ⬆ e parte o chão com a
     picareta ⛏️ (para a frente; com ⬇ ou o botão ⬇️ parte para baixo).
   - Terra parte-se com 1 golpe, pedra com 3, rocha dura com 6. A rocha preta não parte.
     Dentro dos blocos há moedas 🪙 e brilhantes 💎 (vê-se um bocadinho por fora).
   - Difícil: os PEDREGULHOS caem quando se cava por baixo deles (abanam antes); há
     morcegos nas grutas e cada vez mais lá em baixo; a lava queima. 4 corações; sem
     corações volta-se ao último acampamento 🏕️ (nunca há game over).
   - Lá no fundo está a sala do ESQUELETO GIGANTE: pisa o chão (onda — salta!), atira
     ossos, varre com o braço e faz cair pedras e brilhantes do teto. Com 3 brilhantes a
     picareta fica SUPER 💎 e um golpe tira muito; sem brilhantes quase não lhe faz nada.
   - Esmagado, desfaz-se em ossinhos e volta a montar-se como esqueleto bonzinho de
     cachecol azul. Depois há outra mina, mais difícil. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  const TS = 48, COLS = 15, A0 = 58, ROWS = A0 + 11;      // tamanho do bloco, colunas, início da sala do esqueleto
  const CHAO_SALA = (ROWS - 1) * TS;
  const DIF = {
    V: 210, SALTO: 640, GRAV: 1850, CORACOES: 4, INVENC: 1.4,
    GOLPE_CD: 0.2, HP_TERRA: 1, HP_PEDRA: 3, HP_DURA: 6, HP_PEDREG: 2,
    PEDREG_AVISO: 0.55,
    MORCEGO_V: 120, MORCEGO_V_FUNDO: 70, MORCEGO_NASCE: 6, MORCEGO_PERTO: 2,
    BOSS_HP: 130, SUPER_CUSTA: 3, SUPER_DANO: 16, GOLPE_DANO: 1, BOSS_V: 65
  };
  const VAZIO = 0, TERRA = 1, PEDRA = 2, DURA = 3, PEDREG = 4, LAVA = 5, ROCHA = 9;

  let tipo, hp, cont, p, morcegos, coisas, pedrasCaem, parts, textos, ondas, ossos, rochas,
    boss, estado, estadoT, volta = 1, moedas, brilhantes, acamp, cam = { x: 0, y: 0 }, zoom = 1,
    tickPedra = 0, nasceT = 0, tempo = 0, amigo = null, fundoMax = 0;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function sfx(n) { if (G.audio && G.audio.sfx) G.audio.sfx(n); }
  function fala(t) { if (G.audio && G.audio.fala) G.audio.fala(t); }
  function banner(t, ms) { if (G.banner) G.banner(t, ms); }
  function texto(t, x, y, cor) { textos.push({ t: t, x: x, y: y, cor: cor || '#fff', age: 0 }); }
  function I(c, r) { return r * COLS + c; }
  function T(c, r) { if (c < 0 || c >= COLS || r >= ROWS) return ROCHA; if (r < 0) return VAZIO; return tipo[I(c, r)]; }
  function solido(c, r) { const t = T(c, r); return t !== VAZIO && t !== LAVA; }
  function forca() { return 1 + (volta - 1) * 0.25; }

  /* ---------- a mina ---------- */
  function montaMina() {
    tipo = new Array(COLS * ROWS).fill(VAZIO); hp = new Array(COLS * ROWS).fill(0); cont = new Array(COLS * ROWS).fill(null);
    for (let r = 3; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      let t = TERRA;
      const f = r / A0;
      const x = Math.random();
      if (c === 0 || c === COLS - 1) t = ROCHA;
      else if (r >= A0) t = (r === ROWS - 1) ? ROCHA : VAZIO;
      else if (x < 0.06 + f * 0.12) t = PEDREG;
      else if (x < 0.1 + f * 0.25) t = (f > 0.45 && Math.random() < 0.5) ? DURA : PEDRA;
      else if (f > 0.35 && x < 0.16 + f * 0.25) t = DURA;
      else if (f > 0.7 && x < 0.2 + f * 0.25) t = ROCHA;
      tipo[I(c, r)] = t;
    }
    // grutas (com morcegos) e lava
    morcegos = [];
    const grutas = 9 + volta * 2;
    for (let g = 0; g < grutas; g++) {
      const r = Math.floor(rnd(8, A0 - 4)), c = Math.floor(rnd(1, COLS - 4)), w = Math.floor(rnd(3, 5));
      for (let i = 0; i < w; i++) for (let j = 0; j < 2; j++) tipo[I(c + i, r + j)] = VAZIO;
      for (let i = 0; i < w; i++) if (tipo[I(c + i, r + 2)] === PEDREG) tipo[I(c + i, r + 2)] = PEDRA;
      if (Math.random() < 0.55 + r / A0 * 0.4) poeMorcego((c + 1) * TS + TS / 2, (r + 1) * TS);
    }
    const lavas = 6 + volta * 2;
    for (let g = 0; g < lavas; g++) {
      const r = Math.floor(rnd(A0 * 0.45, A0 - 2)), c = Math.floor(rnd(1, COLS - 3));
      for (let i = 0; i < 2; i++) tipo[I(c + i, r)] = LAVA;
    }
    // a primeira fila é sempre terra e o meio de cima não tem pedregulhos (para começar bem)
    for (let c = 1; c < COLS - 1; c++) tipo[I(c, 3)] = TERRA;
    for (let r = 4; r < 7; r++) for (let c = 5; c < 10; c++) if (tipo[I(c, r)] === PEDREG || tipo[I(c, r)] === ROCHA || tipo[I(c, r)] === LAVA) tipo[I(c, r)] = TERRA;
    // por cima da sala: nada de lava a pingar nem rocha que não parte por todo o lado
    for (let c = 1; c < COLS - 1; c++) { tipo[I(c, A0 - 1)] = PEDRA; if (tipo[I(c, A0 - 2)] === ROCHA) tipo[I(c, A0 - 2)] = DURA; }
    // dois degraus na sala do esqueleto
    [3, 4, 10, 11].forEach(function (c) { tipo[I(c, A0 + 6)] = ROCHA; });
    for (let k = 0; k < tipo.length; k++) {
      const t = tipo[k];
      hp[k] = t === TERRA ? DIF.HP_TERRA : t === PEDRA ? DIF.HP_PEDRA : t === DURA ? DIF.HP_DURA : t === PEDREG ? DIF.HP_PEDREG : 0;
      const r = Math.floor(k / COLS);
      if ((t === TERRA || t === PEDRA || t === DURA) && r < A0) {
        const x = Math.random();
        if (x < 0.035 + (t === DURA ? 0.08 : 0)) cont[k] = 'brilhante';
        else if (x < 0.16) cont[k] = 'moeda';
      }
    }
  }

  function poeMorcego(x, y) { morcegos.push({ x: x, y: y, vx: rnd(-1, 1) < 0 ? -60 : 60, vy: 0, tonto: 0, foi: false, fade: 1, t: rnd(0, 6) }); }

  function comeca() {
    montaMina();
    p = { x: COLS * TS / 2, y: 3 * TS - 0.01, vx: 0, vy: 0, w: 28, h: 42, vira: 1, chao: false, hp: DIF.CORACOES, inv: 0, golpeT: 0, swing: 0, tonto: 0 };
    coisas = []; pedrasCaem = []; parts = []; textos = []; ondas = []; ossos = []; rochas = []; boss = null; amigo = null;
    estado = 'mina'; estadoT = 0; acamp = { x: p.x, y: p.y }; fundoMax = 0; nasceT = 4;
  }

  S.enter = function () {
    volta = 1; moedas = 0; brilhantes = 0; tempo = 0;
    comeca();
    banner('⛏️ Parte o chão! Apanha 🪙 e 💎 até ao fundo!', 2800);
    fala('Vamos partir o chão e apanhar brilhantes!');
  };

  /* ---------- física simples de caixas contra os blocos ---------- */
  function move(o, dt) {
    o.x += o.vx * dt;
    let top = o.y - o.h, bot = o.y, l = o.x - o.w / 2, rr = o.x + o.w / 2;
    let r0 = Math.floor(top / TS), r1 = Math.floor((bot - 0.01) / TS);
    if (o.vx > 0) { const c = Math.floor(rr / TS); for (let r = r0; r <= r1; r++) if (solido(c, r)) { o.x = c * TS - o.w / 2 - 0.01; o.vx = 0; break; } }
    else if (o.vx < 0) { const c = Math.floor(l / TS); for (let r = r0; r <= r1; r++) if (solido(c, r)) { o.x = (c + 1) * TS + o.w / 2 + 0.01; o.vx = 0; break; } }
    o.y += o.vy * dt; o.chao = false;
    top = o.y - o.h; bot = o.y; l = o.x - o.w / 2; rr = o.x + o.w / 2;
    const c0 = Math.floor(l / TS), c1 = Math.floor((rr - 0.01) / TS);
    if (o.vy >= 0) { const r = Math.floor(bot / TS); for (let c = c0; c <= c1; c++) if (solido(c, r)) { o.y = r * TS - 0.01; o.vy = 0; o.chao = true; break; } }
    else { const r = Math.floor(top / TS); for (let c = c0; c <= c1; c++) if (solido(c, r)) { o.y = (r + 1) * TS + o.h + 0.01; o.vy = 0; break; } }
  }
  function tocaLava(o) {
    const c0 = Math.floor((o.x - o.w / 2) / TS), c1 = Math.floor((o.x + o.w / 2 - 0.01) / TS);
    const r0 = Math.floor((o.y - o.h) / TS), r1 = Math.floor((o.y + 2) / TS);
    for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) if (T(c, r) === LAVA) return true;
    return false;
  }
  function sobrepoe(o, x, y, w, h) { return Math.abs(o.x - x) < (o.w + w) / 2 && Math.abs((o.y - o.h / 2) - y) < (o.h + h) / 2; }

  /* ---------- partir blocos ---------- */
  function pedacos(x, y, cor, n) {
    for (let i = 0; i < n; i++) parts.push({ x: x, y: y, vx: rnd(-200, 200), vy: rnd(-320, -60), vida: rnd(0.4, 0.8), age: 0, cor: cor, r: rnd(3, 7), g: true });
  }
  const CORES = { 1: '#8b5a2b', 2: '#8d8d8d', 3: '#4a5568', 4: '#7a6a5a', 9: '#222' };
  function golpeBloco(c, r) {
    const t = T(c, r);
    if (t === VAZIO || t === LAVA) return false;
    if (t === ROCHA) { sfx('boing'); texto('🚫', c * TS + TS / 2, r * TS); return true; }
    const k = I(c, r);
    hp[k]--;
    sfx(t === TERRA ? 'kick' : 'quebra');
    pedacos(c * TS + TS / 2, r * TS + TS / 2, CORES[t], 4);
    if (hp[k] <= 0) {
      tipo[k] = VAZIO;
      pedacos(c * TS + TS / 2, r * TS + TS / 2, CORES[t], 8);
      if (cont[k]) { solta(cont[k], c * TS + TS / 2, r * TS + TS / 2); cont[k] = null; }
    }
    return true;
  }
  function solta(qual, x, y, vida) {
    coisas.push({ q: qual, x: x, y: y, vx: rnd(-60, 60), vy: -260, w: 18, h: 18, chao: false, t: 0, vida: vida || 0 });
  }

  function magoa(dx) {
    if (p.inv > 0 || estado === 'desmaia' || estado === 'vitoria') return;
    p.hp--; p.inv = DIF.INVENC;
    p.vx = (dx >= 0 ? 1 : -1) * 260; p.vy = -380;
    G.shake = Math.max(G.shake, 0.35);
    sfx('ouch');
    if (p.hp <= 0) {
      estado = 'desmaia'; estadoT = 2.4;
      banner('😵 Ai! Voltamos ao acampamento 🏕️', 2400);
      fala('Ai! Outra vez!');
    }
  }

  /* ---------- update ---------- */
  S.update = function (dt, t) {
    tempo += dt;
    const In = G.input, ax = In.axis();
    zoom = clamp(Math.min(G.W, G.H) / (8.5 * TS), 0.55, 1.5);

    if (estado === 'desmaia') {
      estadoT -= dt;
      if (estadoT <= 0) {
        estado = boss ? 'boss' : 'mina';
        p.x = acamp.x; p.y = acamp.y; p.vx = 0; p.vy = 0; p.hp = DIF.CORACOES; p.inv = 2;
        // abre espaço à volta do acampamento, para não se ficar entalado
        const c = Math.floor(p.x / TS), r = Math.floor((p.y - 1) / TS);
        if (T(c, r) !== ROCHA) { tipo[I(c, r)] = VAZIO; }
        if (r >= A0) { boss && (boss.x = (p.x < COLS * TS / 2) ? COLS * TS - 140 : 140); }
      }
    }
    if (estado === 'vitoria') {
      estadoT -= dt;
      if (estadoT <= 0) {
        volta++;
        comeca();
        banner('⛏️ Mina nova, mais funda e mais difícil! ★' + volta, 2800);
      }
    }

    // ---- o mineiro ----
    const pode = estado === 'mina' || estado === 'boss' || estado === 'vitoria';
    const alvoV = pode ? ax.x * DIF.V : 0;
    p.vx += (alvoV - p.vx) * Math.min(1, dt * (p.chao ? 14 : 6));
    if (Math.abs(ax.x) > 0.2) p.vira = ax.x > 0 ? 1 : -1;
    if (pode && p.chao && (In.justPressed('jump') || In.isHeld('jump'))) { p.vy = -DIF.SALTO; sfx('hop'); }
    p.vy = Math.min(900, p.vy + DIF.GRAV * dt);
    move(p, dt);
    if (p.inv > 0) p.inv -= dt;
    if (tocaLava(p)) { magoa(-p.vira); if (p.vy > -300) p.vy = -520; }

    // ---- a picareta ----
    p.golpeT -= dt; if (p.swing > 0) p.swing -= dt;
    const baixo = In.isHeld('horn') || In.justPressed('horn') || ((In.isHeld('fire') || In.justPressed('fire')) && ax.y > 0.5);
    const frente = In.isHeld('fire') || In.justPressed('fire');
    if (pode && (frente || baixo) && p.golpeT <= 0) {
      p.golpeT = DIF.GOLPE_CD; p.swing = 0.18;
      let feito = false;
      // primeiro: há alguém para levar com a picareta?
      if (!baixo) feito = golpeBicho();
      if (!feito) {
        const cc = Math.floor(p.x / TS), rr = Math.floor((p.y - p.h / 2) / TS);
        if (baixo) feito = golpeBloco(cc, Math.floor((p.y + 2) / TS));
        else {
          const cf = Math.floor((p.x + p.vira * (p.w / 2 + 10)) / TS);
          feito = golpeBloco(cf, rr) || golpeBloco(cf, Math.floor((p.y - 4) / TS)) || golpeBloco(cc, Math.floor((p.y + 2) / TS));
        }
      }
      if (!feito) sfx('whoosh');
    }

    // ---- pedregulhos que caem ----
    tickPedra -= dt;
    if (tickPedra <= 0) {
      tickPedra = 0.12;
      for (let r = ROWS - 2; r >= 3; r--) for (let c = 1; c < COLS - 1; c++) {
        if (tipo[I(c, r)] === PEDREG && T(c, r + 1) === VAZIO && !pedrasCaem.some(function (q) { return q.c === c && q.r0 === r; })) {
          pedrasCaem.push({ c: c, r0: r, y: r * TS, vy: 0, aviso: DIF.PEDREG_AVISO / Math.sqrt(forca()) });
        }
      }
    }
    for (const q of pedrasCaem) {
      if (q.aviso > 0) {
        q.aviso -= dt;
        if (q.aviso <= 0) { tipo[I(q.c, q.r0)] = VAZIO; sfx('roar'); }
        continue;
      }
      q.vy = Math.min(900, q.vy + DIF.GRAV * dt); q.y += q.vy * dt;
      const x = q.c * TS + TS / 2;
      if (sobrepoe(p, x, q.y + TS / 2, TS - 8, TS - 8) && p.inv <= 0) { magoa(p.x - x); q.parte = true; pedacos(x, q.y + TS / 2, CORES[4], 12); continue; }
      const rb = Math.floor((q.y + TS) / TS);
      if (solido(q.c, rb) || rb >= ROWS - 1) {
        const r = rb - 1;
        if (T(q.c, r) === VAZIO && r < A0) { tipo[I(q.c, r)] = PEDREG; hp[I(q.c, r)] = DIF.HP_PEDREG; cont[I(q.c, r)] = null; }
        else pedacos(x, q.y + TS / 2, CORES[4], 10);
        q.parte = true; G.shake = Math.max(G.shake, 0.2); sfx('canhao');
      }
    }
    pedrasCaem = pedrasCaem.filter(function (q) { return !q.parte; });

    // ---- moedas e brilhantes soltos ----
    for (const o of coisas) {
      o.t += dt;
      o.vy = Math.min(800, o.vy + DIF.GRAV * dt * 0.7);
      o.vx *= Math.pow(0.2, dt);
      move(o, dt);
      if (o.vida && o.t > o.vida) o.apanhada = true;
      if (o.t > 0.25 && Math.abs(o.x - p.x) < 30 && Math.abs((o.y - 9) - (p.y - p.h / 2)) < 36 && estado !== 'desmaia') {
        o.apanhada = true;
        if (o.q === 'moeda') { moedas++; texto('+1 🪙', o.x, o.y - 20, '#ffd60a'); sfx('star'); if (moedas % 10 === 0 && G.addStars) G.addStars(1); }
        else { brilhantes++; texto('+1 💎', o.x, o.y - 20, '#7df9ff'); sfx('suit'); }
      }
    }
    coisas = coisas.filter(function (o) { return !o.apanhada; });

    // ---- morcegos ----
    const fundo = Math.max(0, p.y / TS - 3) / (A0 - 3);
    if (estado === 'mina') {
      nasceT -= dt;
      const perto = morcegos.filter(function (m) { return !m.foi && Math.hypot(m.x - p.x, m.y - p.y) < 500; }).length;
      if (nasceT <= 0) {
        nasceT = Math.max(2.2, DIF.MORCEGO_NASCE - fundo * 3) / forca();
        if (perto < DIF.MORCEGO_PERTO + Math.floor(fundo * 3) + volta - 1 && p.y > 6 * TS) {
          // nasce num buraco já cavado, longe do ecrã
          for (let k = 0; k < 30; k++) {
            const c = Math.floor(rnd(1, COLS - 1)), r = Math.floor(p.y / TS + rnd(-7, 7));
            if (r > 3 && r < A0 && T(c, r) === VAZIO && Math.hypot(c * TS - p.x, r * TS - p.y) > 280) { poeMorcego(c * TS + TS / 2, r * TS + TS / 2); break; }
          }
        }
      }
    }
    for (const m of morcegos) {
      m.t += dt;
      if (m.foi) { m.fade -= dt * 0.6; m.y -= 80 * dt; continue; }
      if (m.tonto > 0) { m.tonto -= dt; m.vy += 300 * dt; m.y += m.vy * dt; if (m.tonto <= 0) { m.foi = true; texto('💚', m.x, m.y - 20); } if (solido(Math.floor(m.x / TS), Math.floor(m.y / TS))) m.vy = 0, m.y -= 300 * dt; continue; }
      const d = Math.hypot(p.x - m.x, (p.y - 20) - m.y);
      const v = (DIF.MORCEGO_V + fundo * DIF.MORCEGO_V_FUNDO) * (1 + (volta - 1) * 0.15);
      let tx, ty;
      if (d < 330 && estado !== 'desmaia') { tx = (p.x - m.x) / d * v; ty = ((p.y - 20) - m.y) / d * v + Math.sin(m.t * 6) * 60; }
      else { tx = m.vx > 0 ? 60 : -60; ty = Math.sin(m.t * 3) * 40; }
      m.vx += (tx - m.vx) * Math.min(1, dt * 3); m.vy += (ty - m.vy) * Math.min(1, dt * 3);
      const nx = m.x + m.vx * dt, ny = m.y + m.vy * dt;
      if (!solido(Math.floor(nx / TS), Math.floor(m.y / TS))) m.x = nx; else m.vx = -m.vx;
      if (!solido(Math.floor(m.x / TS), Math.floor(ny / TS))) m.y = ny; else m.vy = -m.vy * 0.5;
      if (d < 30) magoa(p.x - m.x);
    }
    morcegos = morcegos.filter(function (m) { return m.fade > 0; });

    // ---- acampamentos e a chegada ao fundo ----
    const fila = Math.floor(p.y / TS);
    if (fila > fundoMax) fundoMax = fila;
    if (estado === 'mina' && p.chao) {
      if (fila >= 22 && acamp.y < 20 * TS) { acamp = { x: p.x, y: p.y }; banner('🏕️ Acampamento! Se te magoares voltas aqui.', 2200); sfx('heart'); }
      else if (fila >= 42 && acamp.y < 40 * TS) { acamp = { x: p.x, y: p.y }; banner('🏕️ Acampamento lá no fundo!', 2200); sfx('heart'); }
    }
    if (estado === 'mina' && fila >= A0 && p.chao) acordaBoss();

    if (boss) atualizaBoss(dt, t);

    for (const q of parts) { q.age += dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.g) q.vy += 900 * dt; }
    parts = parts.filter(function (q) { return q.age < q.vida; });
    for (const x of textos) { x.age += dt; x.y -= 40 * dt; }
    textos = textos.filter(function (x) { return x.age < 1.2; });

    const vw = G.W / zoom, vh = G.H / zoom;
    const cx = clamp(p.x - vw / 2, Math.min(0, COLS * TS - vw) / 2 - (vw > COLS * TS ? 0 : 0), Math.max(0, COLS * TS - vw));
    cam.x = vw > COLS * TS ? (COLS * TS - vw) / 2 : cx;
    const ay = clamp(p.y - vh * 0.45, -2 * TS, ROWS * TS - vh);
    cam.y += (ay - cam.y) * Math.min(1, dt * 8);
  };

  function golpeBicho() {
    const alcX = p.x + p.vira * 34, alcY = p.y - p.h / 2;
    for (const m of morcegos) {
      if (m.foi || m.tonto > 0) continue;
      if (Math.abs(m.x - alcX) < 44 && Math.abs(m.y - alcY) < 44) {
        m.tonto = 1.2; m.vy = -100; sfx('boing'); texto('💫', m.x, m.y - 20);
        if (Math.random() < 0.4) solta('moeda', m.x, m.y);
        return true;
      }
    }
    if (boss && !boss.vencido && Math.abs(boss.x - p.x) < boss.w / 2 + 46 && p.y > boss.y - boss.h && p.y - p.h < boss.y) {
      let dano = DIF.GOLPE_DANO;
      if (brilhantes >= DIF.SUPER_CUSTA) {
        brilhantes -= DIF.SUPER_CUSTA; dano = DIF.SUPER_DANO;
        boss.tonto = 1.3; boss.fase = 'anda'; boss.faseT = 1.5;
        G.shake = 0.5; sfx('quebra'); sfx('tada');
        texto('💎💥 -' + dano, boss.x, boss.y - boss.h - 20, '#7df9ff');
        for (let i = 0; i < 10; i++) parts.push({ x: boss.x + rnd(-40, 40), y: boss.y - rnd(0, boss.h), vx: rnd(-260, 260), vy: rnd(-300, 0), vida: 0.7, age: 0, cor: '#7df9ff', r: 5, g: true });
      } else { sfx('kick'); texto('-1', boss.x, boss.y - boss.h, '#fff'); }
      boss.hp -= dano; boss.pisca = 0.12;
      if (boss.hp <= 0) venceBoss();
      return true;
    }
    return false;
  }

  /* ---------- o esqueleto gigante ---------- */
  function acordaBoss() {
    estado = 'boss';
    const hpB = Math.round(DIF.BOSS_HP * forca());
    boss = { x: p.x < COLS * TS / 2 ? COLS * TS - 150 : 150, y: CHAO_SALA, w: 110, h: 260, hp: hpB, max: hpB,
      fase: 'acorda', faseT: 2, vira: -1, pisca: 0, tonto: 0, perna: 0, braco: 0, vencido: false, cai: 0 };
    acamp = { x: p.x, y: p.y };
    morcegos.forEach(function (m) { m.foi = true; });
    sfx('roar'); G.shake = 0.8;
    banner('💀 O ESQUELETO GIGANTE! Apanha 💎 para a super picareta!', 3200);
    fala('Cuidado! O esqueleto gigante!');
  }

  function venceBoss() {
    boss.vencido = true; boss.cai = 0;
    estado = 'vitoria'; estadoT = 7;
    ondas = []; ossos = []; rochas = [];
    sfx('tada'); G.shake = 1;
    for (let i = 0; i < 40; i++) parts.push({ x: boss.x + rnd(-50, 50), y: boss.y - rnd(0, boss.h), vx: rnd(-380, 380), vy: rnd(-520, -80), vida: rnd(1, 1.8), age: 0, cor: '#f1f1e6', r: rnd(5, 10), g: true, osso: true });
    for (let i = 0; i < 15; i++) solta(i % 3 ? 'moeda' : 'brilhante', boss.x + rnd(-40, 40), boss.y - 100);
    banner('💥 ESMAGADO! Desfez-se em ossinhos…', 3000);
    fala('Esmagado! Boa, Isaac!');
    if (G.addStars) G.addStars(25);
    if (G.ze && G.ze.diz) G.ze.diz('Boa, Isaac e Zé!');
    setTimeout(function () {
      if (estado !== 'vitoria') return;
      amigo = { x: boss.x, t: 0 };
      banner('🦴 …e voltou a montar-se: agora é bonzinho! 💙', 3000);
      sfx('suit');
    }, 3000);
  }

  function atualizaBoss(dt, t) {
    const k = boss;
    if (k.pisca > 0) k.pisca -= dt;
    if (amigo) amigo.t += dt;
    if (k.vencido) return;
    const f = forca();
    k.vira = p.x > k.x ? 1 : -1;
    // corpo a corpo também magoa
    if (estado === 'boss' && Math.abs(p.x - k.x) < k.w / 2 && p.y > k.y - k.h + 40) magoa(p.x - k.x);
    if (k.tonto > 0) { k.tonto -= dt; k.perna = 0; k.braco = 0; atualizaAtaques(dt); return; }
    k.faseT -= dt;
    if (k.fase === 'acorda') { if (k.faseT <= 0) { k.fase = 'anda'; k.faseT = 1.5; } }
    else if (k.fase === 'anda') {
      if (Math.abs(p.x - k.x) > 90) k.x += k.vira * DIF.BOSS_V * f * dt;
      k.perna = Math.sin(t * 6) * 0.2;
      if (k.faseT <= 0) {
        const d = Math.abs(p.x - k.x);
        const x = Math.random();
        k.fase = d < 190 && x < 0.45 ? 'varre' : (x < 0.6 ? 'pisa' : 'osso');
        k.faseT = k.fase === 'pisa' ? 0.75 : (k.fase === 'varre' ? 0.6 : 0.5);
        k.n = 0;
      }
    } else if (k.fase === 'pisa') {
      k.perna = Math.min(1, k.perna + dt * 2.2);
      if (k.faseT <= 0) {
        k.perna = 0; G.shake = 0.7; sfx('canhao'); sfx('roar');
        ondas.push({ x: k.x - 40, dir: -1, vida: 2.5 }, { x: k.x + 40, dir: 1, vida: 2.5 });
        // caem pedras do teto… e brilhantes
        const n = 3 + Math.round(volta);
        for (let i = 0; i < n; i++) rochas.push({ x: rnd(TS * 1.5, COLS * TS - TS * 1.5), y: A0 * TS, vy: 0, aviso: rnd(0.6, 1.2) });
        const nb = Math.random() < 0.5 ? 2 : 1;
        for (let i = 0; i < nb; i++) solta('brilhante', rnd(TS * 1.5, COLS * TS - TS * 1.5), A0 * TS + 10, 9);
        k.fase = 'anda'; k.faseT = rnd(1.4, 2.4) / f;
      }
    } else if (k.fase === 'varre') {
      k.braco = Math.min(1, k.braco + dt * 2);
      if (k.faseT <= 0) {
        k.braco = -1; sfx('whoosh');
        // varre rente ao chão à frente: salta!
        if (Math.abs(p.x - (k.x + k.vira * 110)) < 130 && p.y > k.y - 70) magoa(k.vira);
        k.fase = 'anda'; k.faseT = rnd(1.2, 2) / f;
      }
    } else if (k.fase === 'osso') {
      if (k.faseT <= 0) {
        const n = 1 + Math.min(3, volta);
        const Tv = 1.1;
        for (let i = 0; i < n; i++) {
          const tx = p.x + rnd(-60, 60) + p.vx * 0.5, sx = k.x + k.vira * 40, sy = k.y - k.h + 60;
          ossos.push({ x: sx, y: sy, vx: (tx - sx) / Tv, vy: ((p.y - 20) - sy - 0.5 * 900 * Tv * Tv) / Tv, rot: 0 });
        }
        sfx('arco');
        k.fase = 'anda'; k.faseT = rnd(1.2, 2.2) / f;
      }
    }
    k.x = clamp(k.x, TS + k.w / 2, COLS * TS - TS - k.w / 2);
    atualizaAtaques(dt);
  }

  function atualizaAtaques(dt) {
    for (const o of ondas) {
      o.x += o.dir * 380 * forca() * dt; o.vida -= dt;
      if (o.x < TS || o.x > COLS * TS - TS) o.vida = 0;
      if (Math.abs(p.x - o.x) < 26 && p.y > CHAO_SALA - 8 && p.chao) magoa(o.dir);
    }
    ondas = ondas.filter(function (o) { return o.vida > 0; });
    for (const o of ossos) {
      o.vy += 900 * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.rot += dt * 12;
      if (Math.abs(o.x - p.x) < 26 && Math.abs(o.y - (p.y - p.h / 2)) < 30) { magoa(o.vx); o.fim = true; }
      if (o.y > CHAO_SALA || solido(Math.floor(o.x / TS), Math.floor(o.y / TS))) { o.fim = true; pedacos(o.x, o.y, '#f1f1e6', 4); }
    }
    ossos = ossos.filter(function (o) { return !o.fim; });
    for (const r of rochas) {
      if (r.aviso > 0) { r.aviso -= dt; continue; }
      r.vy += 1500 * dt; r.y += r.vy * dt;
      if (Math.abs(r.x - p.x) < 34 && Math.abs(r.y - (p.y - p.h / 2)) < 36) { magoa(p.x - r.x); r.fim = true; pedacos(r.x, r.y, CORES[2], 8); }
      if (r.y > CHAO_SALA - 18 || solido(Math.floor(r.x / TS), Math.floor((r.y + 18) / TS)) && r.y > (A0 + 1) * TS) { r.fim = true; pedacos(r.x, r.y, CORES[2], 8); sfx('kick'); }
    }
    rochas = rochas.filter(function (r) { return !r.fim; });
  }

  /* ---------- desenho ---------- */
  S.draw = function (c, t) {
    const W = G.W, H = G.H;
    // fundo: céu em cima, terra escura cá em baixo
    const sky = (-cam.y) * zoom;
    c.fillStyle = '#2a1a10'; c.fillRect(0, 0, W, H);
    if (sky + 3 * TS * zoom > 0) {
      const g = c.createLinearGradient(0, sky - 400, 0, sky + 3 * TS * zoom);
      g.addColorStop(0, '#5bb8ff'); g.addColorStop(1, '#bfe7ff');
      c.fillStyle = g; c.fillRect(0, 0, W, Math.max(0, sky + 3 * TS * zoom));
    }
    c.save();
    c.scale(zoom, zoom); c.translate(-cam.x, -cam.y);
    const vw = W / zoom, vh = H / zoom;
    const c0 = Math.max(0, Math.floor(cam.x / TS)), c1 = Math.min(COLS - 1, Math.floor((cam.x + vw) / TS));
    const r0 = Math.max(0, Math.floor(cam.y / TS)), r1 = Math.min(ROWS - 1, Math.floor((cam.y + vh) / TS));
    // parede de trás dos túneis
    for (let r = Math.max(3, r0); r <= r1; r++) {
      const esc = clamp(r / ROWS, 0, 1);
      c.fillStyle = r >= A0 ? '#1b1420' : 'rgb(' + Math.round(70 - esc * 40) + ',' + Math.round(45 - esc * 25) + ',' + Math.round(30 - esc * 15) + ')';
      c.fillRect(0, r * TS, COLS * TS, TS);
    }
    // relva e a casinha da mina lá em cima
    if (r0 <= 3) {
      c.fillStyle = '#4caf50'; c.fillRect(0, 3 * TS - 8, COLS * TS, 12);
      c.font = '40px system-ui'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.fillText('🏚️', 2 * TS, 3 * TS - 8); c.fillText('🌲', COLS * TS - 2 * TS, 3 * TS - 8);
    }
    for (let r = r0; r <= r1; r++) for (let cc = c0; cc <= c1; cc++) {
      const tt = tipo[I(cc, r)]; if (tt === VAZIO) continue;
      bloco(c, cc, r, tt, t);
    }
    // a sala do esqueleto
    if (r1 >= A0) {
      c.fillStyle = 'rgba(160,60,200,0.08)'; c.fillRect(TS, A0 * TS, (COLS - 2) * TS, 10 * TS);
      c.font = '30px system-ui'; c.textAlign = 'center';
      for (let i = 0; i < 4; i++) c.fillText('🕯️', TS * 1.5 + i * ((COLS - 3) * TS / 3), A0 * TS + 40);
    }
    // pedregulhos a abanar / a cair
    for (const q of pedrasCaem) {
      const x = q.c * TS + (q.aviso > 0 ? Math.sin(t * 60) * 4 : 0);
      pedregulho(c, x, q.aviso > 0 ? q.r0 * TS : q.y);
    }
    // coisas soltas
    for (const o of coisas) {
      if (o.vida && o.t > o.vida - 2 && Math.floor(t * 10) % 2) continue;
      if (o.q === 'moeda') moeda(c, o.x, o.y - 9, 9, t + o.x); else brilhante(c, o.x, o.y - 10, 11, t);
    }
    // esqueleto
    if (boss) desenhaBoss(c, t);
    if (amigo) esqueletoBom(c, amigo.x, CHAO_SALA, amigo.t);
    for (const o of ondas) {
      c.fillStyle = 'rgba(255,170,60,0.85)';
      c.beginPath(); c.moveTo(o.x - 26, CHAO_SALA); c.quadraticCurveTo(o.x, CHAO_SALA - 50, o.x + 26, CHAO_SALA); c.fill();
    }
    for (const o of ossos) osso(c, o.x, o.y, o.rot, 1);
    for (const r of rochas) {
      if (r.aviso > 0) { c.fillStyle = 'rgba(255,0,0,' + (0.25 + 0.2 * Math.sin(t * 20)) + ')'; c.beginPath(); c.ellipse(r.x, CHAO_SALA - 4, 28, 8, 0, 0, TAU); c.fill(); }
      c.fillStyle = '#8d8d8d'; c.beginPath(); c.arc(r.x, r.y, 18, 0, TAU); c.fill();
    }
    // morcegos
    c.font = '34px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const m of morcegos) {
      c.globalAlpha = clamp(m.fade, 0, 1);
      c.save(); c.translate(m.x, m.y); c.scale(1, 0.8 + Math.abs(Math.sin(m.t * 14)) * 0.3);
      c.fillText('🦇', 0, 0); c.restore();
      if (m.tonto > 0) { c.font = '14px system-ui'; c.fillText('💫', m.x, m.y - 24); c.font = '34px system-ui'; }
      if (m.foi) c.fillText('💚', m.x, m.y - 28);
    }
    c.globalAlpha = 1;
    desenhaMineiro(c, t);
    for (const q of parts) {
      c.globalAlpha = 1 - q.age / q.vida;
      if (q.osso) osso(c, q.x, q.y, q.age * 10, 0.7);
      else { c.fillStyle = q.cor; c.fillRect(q.x - q.r / 2, q.y - q.r / 2, q.r, q.r); }
    }
    c.globalAlpha = 1;
    for (const x of textos) {
      c.globalAlpha = 1 - x.age / 1.2;
      c.font = 'bold 24px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,0.6)'; c.strokeText(x.t, x.x, x.y);
      c.fillStyle = x.cor; c.fillText(x.t, x.x, x.y);
    }
    c.globalAlpha = 1;
    c.restore();
    // escuridão à volta (a lanterna do capacete), mais forte lá em baixo
    const fundo = clamp((p.y / TS - 6) / (A0 - 6), 0, 1);
    if (fundo > 0) {
      const sx = (p.x - cam.x) * zoom, sy = (p.y - 20 - cam.y) * zoom;
      const g = c.createRadialGradient(sx, sy, 120 * zoom, sx, sy, (360 - fundo * 90) * zoom);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,' + (0.25 + fundo * 0.4) + ')');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    }
    hud(c, t);
  };

  function bloco(c, cc, r, tt, t) {
    const x = cc * TS, y = r * TS, k = I(cc, r);
    if (tt === LAVA) {
      c.fillStyle = '#ff6d00'; c.fillRect(x, y, TS, TS);
      c.fillStyle = '#ffd60a';
      for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x + 10 + i * 14, y + 14 + Math.sin(t * 4 + i + cc) * 6, 5, 0, TAU); c.fill(); }
      return;
    }
    if (tt === PEDREG) { pedregulho(c, x, y); return; }
    const cor = tt === TERRA ? (r < 20 ? '#8b5a2b' : '#7a4a22') : tt === PEDRA ? '#8d8d8d' : tt === DURA ? '#4a5568' : '#1d1d24';
    c.fillStyle = cor; c.fillRect(x, y, TS, TS);
    c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(x, y + TS - 5, TS, 5); c.fillRect(x + TS - 4, y, 4, TS);
    c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(x, y, TS, 4);
    // pintinhas
    c.fillStyle = 'rgba(0,0,0,0.15)';
    const s = (cc * 7 + r * 13) % 5;
    c.fillRect(x + 8 + s * 4, y + 12, 5, 4); c.fillRect(x + 28 - s * 2, y + 30, 6, 4);
    if (r === 3 && tt === TERRA) { c.fillStyle = '#4caf50'; c.fillRect(x, y, TS, 8); }
    if (cont[k] === 'moeda') moeda(c, x + TS / 2, y + TS / 2, 9, 0, 0.75);
    else if (cont[k] === 'brilhante') brilhante(c, x + TS / 2, y + TS / 2, 10, t, 0.8);
    // rachas conforme os golpes
    const max = tt === TERRA ? DIF.HP_TERRA : tt === PEDRA ? DIF.HP_PEDRA : tt === DURA ? DIF.HP_DURA : 1;
    const dano = tt === ROCHA ? 0 : 1 - hp[k] / max;
    if (dano > 0) {
      c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x + 6, y + 8); c.lineTo(x + 22, y + 22); c.lineTo(x + 16, y + 40);
      if (dano > 0.4) { c.moveTo(x + 22, y + 22); c.lineTo(x + 42, y + 18); }
      if (dano > 0.7) { c.moveTo(x + 22, y + 22); c.lineTo(x + 36, y + 44); }
      c.stroke();
    }
  }
  function pedregulho(c, x, y) {
    c.fillStyle = '#6d5f52'; c.beginPath(); c.arc(x + TS / 2, y + TS / 2 + 2, TS / 2 - 2, 0, TAU); c.fill();
    c.fillStyle = '#8a7b6c'; c.beginPath(); c.arc(x + TS / 2 - 7, y + TS / 2 - 6, TS / 4, 0, TAU); c.fill();
  }
  function moeda(c, x, y, r, t, a) {
    c.globalAlpha = a || 1;
    const w = t ? Math.abs(Math.cos(t * 4)) * 0.8 + 0.2 : 1;
    c.fillStyle = '#e0a800'; c.beginPath(); c.ellipse(x, y, r * w, r, 0, 0, TAU); c.fill();
    c.fillStyle = '#ffd60a'; c.beginPath(); c.ellipse(x, y, r * w * 0.75, r * 0.75, 0, 0, TAU); c.fill();
    c.globalAlpha = 1;
  }
  function brilhante(c, x, y, r, t, a) {
    c.globalAlpha = a || 1;
    c.fillStyle = '#4cc9f0';
    c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r, y - r * 0.2); c.lineTo(x, y + r); c.lineTo(x - r, y - r * 0.2); c.closePath(); c.fill();
    c.fillStyle = '#bdf6ff';
    c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * 0.4, y - r * 0.2); c.lineTo(x, y + r * 0.3); c.lineTo(x - r * 0.4, y - r * 0.2); c.closePath(); c.fill();
    if (Math.sin(t * 5 + x) > 0.8) { c.fillStyle = '#fff'; c.fillRect(x + r * 0.4, y - r, 3, 3); }
    c.globalAlpha = 1;
  }
  function osso(c, x, y, rot, s) {
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
    c.fillStyle = '#f1f1e6'; c.strokeStyle = '#555'; c.lineWidth = 2;
    c.fillRect(-14, -4, 28, 8);
    [-14, 14].forEach(function (e) { c.beginPath(); c.arc(e, -4, 5, 0, TAU); c.arc(e, 4, 5, 0, TAU); c.fill(); });
    c.restore();
  }

  function desenhaMineiro(c, t) {
    if (estado === 'desmaia') { c.font = '22px system-ui'; c.textAlign = 'center'; c.fillText('💫', p.x, p.y - 56); }
    if (p.inv > 0 && Math.floor(t * 14) % 2 === 0) c.globalAlpha = 0.45;
    c.save(); c.translate(p.x, p.y); c.scale(p.vira, 1);
    const anda = p.chao && Math.abs(p.vx) > 20 ? Math.sin(t * 16) * 5 : 0;
    // pernas
    c.fillStyle = '#2b3a67'; c.fillRect(-10, -14, 8, 14 + anda * 0.3); c.fillRect(2, -14, 8, 14 - anda * 0.3);
    c.fillStyle = '#5a3a1a'; c.fillRect(-12, -3, 11, 4); c.fillRect(1, -3, 11, 4);
    // corpo
    c.fillStyle = '#ff8c42'; c.fillRect(-12, -32, 24, 20);
    c.fillStyle = '#ffd60a'; c.fillRect(-12, -24, 24, 3);
    // cabeça
    c.fillStyle = '#f2c79b'; c.beginPath(); c.arc(0, -40, 10, 0, TAU); c.fill();
    c.fillStyle = '#222'; c.fillRect(3, -42, 3, 3);
    // capacete com lanterna
    c.fillStyle = '#ffd60a'; c.beginPath(); c.arc(0, -44, 11, Math.PI, 0); c.fill(); c.fillRect(-13, -45, 26, 4);
    c.fillStyle = '#fff6b0'; c.beginPath(); c.arc(9, -49, 3.5, 0, TAU); c.fill();
    // picareta
    const sw = p.swing > 0 ? (p.swing / 0.18) : 0;
    c.save(); c.translate(8, -26); c.rotate(-1.3 + (1 - sw) * 0.2 + sw * 2.0 - (p.swing > 0 ? 0 : -0.6));
    c.fillStyle = '#8b5a2b'; c.fillRect(-2, -26, 4, 28);
    c.fillStyle = brilhantes >= DIF.SUPER_CUSTA && boss && !boss.vencido ? '#4cc9f0' : '#9aa5b1';
    c.beginPath(); c.moveTo(-14, -26); c.quadraticCurveTo(0, -34, 14, -26); c.lineTo(0, -29); c.closePath(); c.fill();
    c.restore();
    c.restore();
    c.globalAlpha = 1;
    // brilho da super picareta
    if (brilhantes >= DIF.SUPER_CUSTA && boss && !boss.vencido) {
      c.strokeStyle = 'rgba(125,249,255,' + (0.4 + 0.3 * Math.sin(t * 10)) + ')'; c.lineWidth = 3;
      c.beginPath(); c.arc(p.x + p.vira * 14, p.y - 52, 18, 0, TAU); c.stroke();
    }
  }

  function esqueleto(c, x, y, s, k, t) {
    // k: { perna, braco, vira, tonto }
    c.save(); c.translate(x, y); c.scale(s * (k.vira || 1), s);
    c.lineCap = 'round';
    function linha(x1, y1, x2, y2, w) {
      c.strokeStyle = '#333'; c.lineWidth = w + 4; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      c.strokeStyle = '#f1f1e6'; c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    }
    const pl = k.perna || 0;
    // pernas
    linha(-16, -100, -20 - pl * 10, -50 - pl * 40, 10); linha(-20 - pl * 10, -50 - pl * 40, -18, 0 - pl * 70, 10);
    linha(16, -100, 20, -50, 10); linha(20, -50, 18, 0, 10);
    // bacia
    linha(-24, -102, 24, -102, 12);
    // coluna e costelas
    linha(0, -102, 0, -200, 9);
    for (let i = 0; i < 4; i++) { const yy = -185 + i * 18; linha(-32 + i * 3, yy + 6, 32 - i * 3, yy + 6, 7); }
    // braços
    const b = k.braco || 0;
    linha(-30, -190, -48, -150, 9); linha(-48, -150, -50, -110, 9);
    const ang = b > 0 ? -1.6 * b : (b < 0 ? 1.2 : 0.3);
    const ex = 30 + Math.sin(ang + 0.2) * 45, ey = -190 + Math.cos(ang + 0.2) * 45;
    linha(30, -190, ex, ey, 9); linha(ex, ey, ex + Math.sin(ang) * 45, ey + Math.cos(ang) * 45, 9);
    // caveira
    c.fillStyle = '#f1f1e6'; c.strokeStyle = '#333'; c.lineWidth = 4;
    c.beginPath(); c.arc(0, -232, 30, 0, TAU); c.fill(); c.stroke();
    c.fillRect(-16, -212, 32, 16); c.strokeRect(-16, -212, 32, 16);
    c.fillStyle = '#222';
    c.beginPath(); c.arc(-11, -236, 8, 0, TAU); c.arc(11, -236, 8, 0, TAU); c.fill();
    c.fillStyle = k.tonto ? '#ffd60a' : '#ff3b3b';
    c.beginPath(); c.arc(-11, -236, 3, 0, TAU); c.arc(11, -236, 3, 0, TAU); c.fill();
    c.fillStyle = '#333'; for (let i = -1; i <= 1; i++) c.fillRect(i * 9 - 1, -210, 2, 12);
    c.restore();
  }

  function desenhaBoss(c, t) {
    const k = boss;
    if (k.vencido) return;
    let x = k.x;
    if (k.fase === 'pisa' || k.fase === 'varre') x += Math.sin(t * 50) * 2;
    if (k.fase === 'acorda') c.globalAlpha = clamp(1 - k.faseT / 2, 0.2, 1);
    esqueleto(c, x, k.y, 1.05, { perna: k.fase === 'pisa' ? k.perna : 0, braco: k.fase === 'varre' ? k.braco : (k.braco < 0 ? -1 : 0), vira: k.vira, tonto: k.tonto > 0 }, t);
    c.globalAlpha = 1;
    if (k.pisca > 0) { c.fillStyle = 'rgba(125,249,255,0.35)'; c.fillRect(k.x - 60, k.y - 280, 120, 280); }
    if (k.tonto > 0) { c.font = '22px system-ui'; c.textAlign = 'center'; for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2.1; c.fillText('⭐', k.x + Math.cos(a) * 34, k.y - 285 + Math.sin(a) * 8); } }
    if (k.fase === 'pisa') { c.font = 'bold 36px system-ui'; c.textAlign = 'center'; c.fillText('⬆️ SALTA!', k.x, k.y - 300); }
    if (k.fase === 'varre') {
      c.fillStyle = 'rgba(255,60,60,0.25)';
      c.fillRect(k.x + k.vira * 110 - 130, k.y - 70, 260, 70);
    }
  }

  function esqueletoBom(c, x, y, tt) {
    esqueleto(c, x, y, 0.45, { braco: Math.sin(tt * 6) > 0 ? 0.9 : 0.4, vira: 1 }, tt);
    // cachecol azul, como os do castelo
    c.fillStyle = '#1e88e5'; c.fillRect(x - 16, y - 92, 32, 8); c.fillRect(x + 6, y - 88, 8, 20);
    c.font = '26px system-ui'; c.textAlign = 'center'; c.fillText('💙', x, y - 140 - Math.sin(tt * 3) * 6);
  }

  function hud(c, t) {
    const W = G.W;
    c.save();
    c.textBaseline = 'middle'; c.textAlign = 'left';
    function caixa(x, y, w, h) { c.fillStyle = 'rgba(0,0,0,0.45)'; c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, 14); else c.rect(x, y, w, h); c.fill(); }
    caixa(70, 10, 250, 44);
    moeda(c, 92, 32, 12, t);
    c.fillStyle = '#fff'; c.font = 'bold 22px system-ui, sans-serif'; c.fillText('' + moedas, 110, 33);
    brilhante(c, 182, 32, 13, t);
    c.fillText('' + brilhantes, 200, 33);
    if (boss && !boss.vencido) { c.font = '16px system-ui'; c.fillStyle = brilhantes >= DIF.SUPER_CUSTA ? '#7df9ff' : '#bbb'; c.fillText(brilhantes >= DIF.SUPER_CUSTA ? 'SUPER ⛏️' : '3💎=⛏️', 236, 33); }
    caixa(70, 60, 36 * DIF.CORACOES + 14, 40);
    c.font = '22px system-ui';
    for (let i = 0; i < DIF.CORACOES; i++) { c.globalAlpha = i < p.hp ? 1 : 0.25; c.fillText('❤️', 80 + i * 36, 81); }
    c.globalAlpha = 1;
    // profundidade
    const m = Math.max(0, Math.floor(p.y / TS) - 2);
    c.textAlign = 'right'; c.font = 'bold 18px system-ui, sans-serif'; c.fillStyle = '#fff';
    c.fillText('⬇️ ' + m + ' m' + (volta > 1 ? '  ★' + volta : ''), W - 14, 72);
    if (boss && !boss.vencido) {
      const bw = Math.min(360, W - 40), bx = (W - bw) / 2, by = 112;
      c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(bx - 4, by - 4, bw + 8, 26);
      c.fillStyle = '#e63946'; c.fillRect(bx, by, bw * Math.max(0, boss.hp / boss.max), 18);
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 14px system-ui, sans-serif';
      c.fillText('💀 ESQUELETO GIGANTE', W / 2, by + 9);
    }
    c.restore();
  }

  /* ---------- para testar ---------- */
  S.api = {
    estado: function () { return { estado: estado, volta: volta, moedas: moedas, brilhantes: brilhantes, hp: p.hp, fila: Math.floor(p.y / TS), boss: boss ? boss.hp : null, morcegos: morcegos.length }; },
    vaiAoFundo: function () { p.x = COLS * TS / 2; p.y = (ROWS - 1) * TS - 0.01; p.vy = 0; },
    daBrilhantes: function (n) { brilhantes += n; },
    venceBoss: function () { if (boss && !boss.vencido) { boss.hp = 0; venceBoss(); } }
  };

  G.scenes = G.scenes || {};
  G.scenes.mina = S;
})();
