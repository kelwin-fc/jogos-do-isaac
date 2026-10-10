/* Cena — OS CARROS DO ISAAC: conduzir sem fim, vista de cima, numa estrada à escolha
   (cidade, campo, neve, deserto). Volante grande que gira com o dedo, pedal azul em pé
   com risco para acelerar muito, pedal baixinho e colorido para parar.
   A estrada tem DOIS SENTIDOS, cruzamentos com semáforos, pessoas a passear e a
   atravessar nas passadeiras, e garagens onde se entra a conduzir para escolher outro
   carro de corrida (sem ninguém a guardar — é só entrar e escolher).
   Nunca acaba e ninguém se magoa: os toques fazem "boing", as pessoas saltam a rir,
   e passar no vermelho só dá um aviso fofo. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  const MAXA = 2.3;                       // curso do volante (rad para cada lado)
  const CRUISE = 120, BRK = 1400, WALKSPD = 175, REV = 210;   // REV = velocidade máxima de marcha atrás
  // 4 faixas: as duas da esquerda vêm ao contrário, as duas da direita são as nossas
  const LANES = [
    { u: -0.375, dir: -1, base: 215 },
    { u: -0.125, dir: -1, base: 300 },
    { u: 0.125, dir: 1, base: 300 },
    { u: 0.375, dir: 1, base: 215 }
  ];
  const OURS = [2, 3];
  const BLOCK = 2400;                     // de cruzamento a cruzamento
  const CYCLE = 14;                       // ciclo do semáforo (vermelho curtinho: 5 s)
  // piscina + rampa: em todos os quarteirões PARES, sempre do lado direito
  const RAMP_OFF = BLOCK * 0.28;          // a rampa vem primeiro...
  const POOL_OFF = BLOCK * 0.57;          // ...e a piscina logo a seguir
  const POOL_L = 700;                     // comprimento da piscina (px)
  const JUMPMIN = 230;                    // devagarinho não salta, é só um saltinho
  const PALETTE = ['#4cc9f0', '#8ac926', '#ff924c', '#b5179e', '#5e60ce', '#f28482', '#00bbf9', '#fdc500'];
  const KINDS = {
    corrida:  { mul: 1.25, max: 780, acc: 640, len: 1.86, low: true, nome: 'Carro de corrida! 🏎️' },
    sedan:    { mul: 1.0,  max: 560, acc: 430, len: 1.72, nome: 'Carro novo! 🚗' },
    taxi:     { mul: 1.05, max: 600, acc: 470, len: 1.72, nome: 'Táxi! 🚕' },
    carrinha: { mul: 0.9,  max: 470, acc: 340, len: 2.02, nome: 'Carrinha! 🚐' },
    gelados:  { mul: 0.85, max: 440, acc: 310, len: 2.1,  nome: 'Carrinha dos gelados! 🍦' },
    policia:  { mul: 1.15, max: 680, acc: 540, len: 1.78, nome: 'Carro da polícia! 🚓 Apanha os ladrões!' }
  };
  // carros de corrida da garagem — todos baixinhos, é só escolher a cor
  const GARAGE = [
    { col: '#ff595e', nome: 'VERMELHO', max: 780 },
    { col: '#4cc9f0', nome: 'AZUL', max: 800 },
    { col: '#8ac926', nome: 'VERDE', max: 760 },
    { col: '#ffca3a', nome: 'AMARELO', max: 820 }
  ];
  const THEMES = {
    cidade:  { nome: 'CIDADE',  emo: '🏙️', ground: '#aeb8bf', road: '#5c6672', curb: '#8d99a6', grip: 11,  tf: 1 },
    campo:   { nome: 'CAMPO',   emo: '🌳', ground: '#79c257', road: '#6b7280', curb: '#57a844', grip: 11,  tf: 1 },
    neve:    { nome: 'NEVE',    emo: '⛄', ground: '#eef6fb', road: '#a8bccd', curb: '#d9eaf5', grip: 3.4, tf: 0.72 },
    deserto: { nome: 'DESERTO', emo: '🌵', ground: '#eccd8f', road: '#7d7468', curb: '#d9b271', grip: 10,  tf: 1 }
  };
  const THEME_KEYS = ['cidade', 'campo', 'neve', 'deserto'];
  const PED_COLS = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#f78c6b', '#c77dff'];
  const HAIR_COLS = ['#3d2b1f', '#6b4423', '#c9a227', '#2b2d42'];

  let theme, mode, prevMode, started;
  let player, cars, cross, peds, hero, stars, parts, flakes;
  let cam, anchor, wheelA, steer, dist, nextKm, nextStarY, chunks, carId;
  let bumpCd, dustCd, lightSeen, garSeen, crossSeen, garNow, rouboCd, apanhados;
  let jump, combo, comboT, boia, rampSeen, poolAviso, poolSeen, poolStarSeen, saltos, banhos;
  let panX = 0;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function rndi(n) { return Math.floor(Math.random() * n); }
  function h01(n) { const s = Math.sin(n * 127.1) * 43758.5; return s - Math.floor(s); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function roadW() { return Math.min(G.W * 0.8, 560); }
  function carWpx() { return roadW() * 0.25 * 0.6; }
  function carLen(car) { return carWpx() * KINDS[car.kind].len; }
  function anchorY() { return mode === 'walk' ? G.H * 0.6 : G.H * 0.72; }
  function scrY(y) { return anchor - (y - cam); }
  // panX: em ecrãs estreitos o mundo desliza para a esquerda para a piscina caber toda
  function scrX(u) { return G.W / 2 + u * roadW() + panX; }
  function T() { return THEMES[theme]; }
  function crossHalf() { return roadW() * 0.31; }      // meia largura da rua transversal
  function uEdge() { return (G.W / 2 + 150 + Math.abs(panX)) / roadW(); }
  function uMaxRoad() { return 0.5 - (carWpx() / 2) / roadW(); }

  /* ---------------------------------------------- semáforos */
  function phaseAt(k, t) {
    const off = h01(k * 3.77) * CYCLE;
    return ((t + off) % CYCLE + CYCLE) % CYCLE;
  }
  function lightMain(k, t) {                            // para quem vai na estrada grande
    const p = phaseAt(k, t);
    return p < 7.5 ? 'verde' : p < 8.8 ? 'amarelo' : 'vermelho';
  }
  function lightCross(k, t) {                           // para quem atravessa
    const p = phaseAt(k, t);
    return p < 8.8 ? 'vermelho' : p < 12.7 ? 'verde' : 'amarelo';
  }
  function nextStop(y, d) {                             // próxima linha de STOP à frente
    const half = crossHalf() + 16;
    const k = d > 0 ? Math.ceil((y + half) / BLOCK) : Math.floor((y - half) / BLOCK);
    return { k: k, y: k * BLOCK - d * half };
  }
  function inBox(y, k) { return Math.abs(y - k * BLOCK) < crossHalf(); }

  /* ---------------------------------------------- garagens */
  function garageK(y) {                                 // uma garagem de 2 em 2 quarteirões
    const k = Math.round((y - BLOCK * 0.42) / BLOCK);
    return (k >= 1 && k % 2 === 1) ? k : null;
  }
  function garageNear(y) {
    for (const k of [garageK(y), garageK(y + BLOCK), garageK(y - BLOCK)]) {
      if (k === null) continue;
      const gy = k * BLOCK + BLOCK * 0.42;
      if (Math.abs(y - gy) < 240) return { k: k, y: gy };
    }
    return null;
  }

  /* ---------------------------------------------- piscina e rampa */
  // uma rampa e uma piscina em cada quarteirão PAR, sempre do lado direito
  function parK(y, off) {
    const k = Math.round((y - off) / BLOCK);
    return (k >= 0 && k % 2 === 0) ? k : null;
  }
  function rampK(y) { return parK(y, RAMP_OFF); }
  function poolK(y) { return parK(y, POOL_OFF); }
  function rampY(k) { return k * BLOCK + RAMP_OFF; }
  function poolY(k) { return k * BLOCK + POOL_OFF; }
  // a piscina começa a seguir ao passeio e estica-se quase até à berma do ecrã
  // (fica sempre uma folga à direita para o carro caber inteiro dentro de água)
  function poolRect() {
    const rw = roadW(), uIn = 0.62;
    const w = Math.max(140, G.W - 72 - (G.W / 2 + uIn * rw));
    return { uIn: uIn, uOut: uIn + w / rw, w: w };
  }
  function poolAt(y, folga) {                           // há piscina à altura de y?
    const k = poolK(y);
    if (k === null) return null;
    return Math.abs(y - poolY(k)) < POOL_L / 2 + (folga || 0) ? k : null;
  }
  function naAgua(u, y) {                               // ...e este ponto está DENTRO de água?
    const k = poolAt(y, -24);
    if (k === null) return null;
    const pr = poolRect();
    return (u > pr.uIn + 0.03 && u < pr.uOut - 0.02) ? k : null;
  }
  function naRampa(u) { return u > -0.03 && u < 0.55; }

  function syncBody() {
    document.body.classList.toggle('walking', mode === 'walk');
    document.body.classList.toggle('picking', mode === 'pick' || mode === 'garagem');
  }

  function mkCar(kind, u, y, state, col) {
    return {
      id: carId++, kind: kind, col: col || PALETTE[rndi(PALETTE.length)],
      u: u, y: y, spd: 0, vu: 0, lane: null, dir: 1, state: state, stopped: false, maxOverride: 0,
      wob: 0, blink: 0, dodge: 0, uOff: 0, waitT: 0, honkCd: rnd(0, 2), replyT: 0, yieldT: 0, stuckT: 0, touched: false,
      ladrao: false, apanhado: 0, visto: 0, ajudou: false, persegue: null, sireneCd: 0,
      brakeT: 0, reCd: 0
    };
  }

  function spark(u, y, n, col) {
    for (let i = 0; i < n; i++) {
      parts.push({ u: u + rnd(-0.02, 0.02), y: y + rnd(-20, 20), vu: rnd(-0.08, 0.08), vy: rnd(-60, 60), t: 0, life: rnd(0.35, 0.8), col: col, txt: null, s: rnd(4, 9) });
    }
  }
  function emo(u, y, txt) {
    parts.push({ u: u, y: y, vu: rnd(-0.03, 0.03), vy: rnd(40, 90), t: 0, life: 1, col: null, txt: txt, s: 22 });
  }

  /* ---------------------------------------------- arranque */
  S.enter = function () {
    theme = theme || 'cidade';
    mode = 'pick'; prevMode = 'drive'; started = false;
    cars = []; cross = []; peds = []; stars = []; parts = []; chunks = {}; carId = 1;
    lightSeen = {}; garSeen = {}; crossSeen = {}; garNow = null;
    jump = null; combo = 0; comboT = 0; boia = 0; saltos = 0; banhos = 0; panX = 0;
    rampSeen = {}; poolAviso = {}; poolSeen = {}; poolStarSeen = {};
    hero = { u: 0.125, y: 0, walk: 0, dir: 0, swim: false };
    dist = 0; nextKm = 1000; nextStarY = 600; bumpCd = 0; dustCd = 0;
    rouboCd = rnd(14, 24); apanhados = 0;
    wheelA = 0; steer = { id: null, a0: 0, w0: 0 };
    player = mkCar('corrida', LANES[2].u, 0, 'player', '#ff595e');
    cars.push(player);
    cam = player.y; anchor = anchorY();
    flakes = [];
    for (let i = 0; i < 70; i++) flakes.push({ x: Math.random(), y: Math.random(), s: rnd(1.5, 4), v: rnd(28, 70), ph: rnd(0, TAU) });
    for (let i = 0; i < 5; i++) spawnTraffic(true);      // estrada mais desimpedida (pedido do Isaac)
    for (let i = 0; i < 8; i++) spawnPed(true);
    syncBody();
  };

  function spawnTraffic(seed) {
    const H = G.H;
    for (let tries = 0; tries < 12; tries++) {
      // a estrada continua cheia de vida, mas com mais carros no sentido contrário
      // (passam a zunir) e menos à frente do Isaac, para ele poder ganhar velocidade
      const li = Math.random() < 0.62 ? rndi(2) : 2 + rndi(2);
      const L = LANES[li];
      let y;
      if (seed) y = player.y + (L.dir > 0 ? rnd(-500, 1300) : rnd(400, H * 2));
      else if (L.dir > 0) y = Math.random() < 0.35 ? cam - H * 0.3 - rnd(220, 900) : cam + H * 0.75 + rnd(150, 900);
      else y = cam + H * 0.8 + rnd(200, 1500);
      let ok = true;
      for (const o of cars) {
        if (Math.abs(o.u - L.u) * roadW() < carWpx() * 1.2 && Math.abs(o.y - y) < 330) { ok = false; break; }
      }
      if (!ok) continue;
      const papel = Math.random();
      let kind, col;
      if (papel < 0.12) { kind = 'policia'; col = '#f1f3f5'; }
      else {
        const r = Math.random();
        kind = r < 0.6 ? 'sedan' : r < 0.72 ? 'taxi' : r < 0.86 ? 'carrinha' : r < 0.94 ? 'gelados' : 'corrida';
        col = kind === 'taxi' ? '#ffca3a' : kind === 'gelados' ? '#f8f9fa' : undefined;
      }
      const car = mkCar(kind, L.u, y, 'traffic', col);
      car.lane = li; car.dir = L.dir;
      car.spd = L.base * T().tf * rnd(0.85, 1.05);
      // um ladrão de vez em quando, mas nunca mais do que dois ao mesmo tempo
      if (kind !== 'policia' && papel > 0.96 && contaLadroes() < 2) car.ladrao = true;
      cars.push(car);
      return;
    }
  }

  // o jogo nunca acaba: apagar marcas de sítios que já ficaram muito para trás
  function prune(obj, keep) {
    const ks = Object.keys(obj);
    if (ks.length <= keep) return;
    for (const k of ks.slice(0, ks.length - keep)) delete obj[k];
  }

  function spawnParked() {
    const lo = Math.floor((cam - 1200) / 1000), hi = Math.floor((cam + G.H * 2) / 1000);
    prune(chunks, 60); prune(lightSeen, 40); prune(garSeen, 20); prune(crossSeen, 120);
    prune(rampSeen, 20); prune(poolAviso, 20); prune(poolSeen, 20); prune(poolStarSeen, 20);
    for (let ch = lo; ch <= hi; ch++) {
      if (chunks[ch]) continue;
      chunks[ch] = true;
      const r = h01(ch * 7.31 + 2.7);
      const n = r < 0.5 ? 1 : r < 0.8 ? 2 : 0;
      for (let i = 0; i < n; i++) {
        const y = ch * 1000 + 120 + h01(ch * 5.77 + i * 8.8) * 760;
        if (garageNear(y) || Math.abs(y - Math.round(y / BLOCK) * BLOCK) < crossHalf() + 160) continue;
        const side = h01(ch * 3.1 + i * 5.7) < 0.5 ? -1 : 1;
        if (side > 0 && poolAt(y, 100) !== null) continue;         // ninguém estaciona na piscina
        const kinds = ['corrida', 'taxi', 'gelados', 'carrinha', 'sedan', 'policia'];
        const kind = kinds[Math.floor(h01(ch * 9.13 + i * 4.4) * kinds.length)];
        const col = PALETTE[Math.floor(h01(ch * 6.17 + i * 3.3) * PALETTE.length)];
        // bem fora da faixa de rodagem, para nunca encravarem quem passa pela berma
        const car = mkCar(kind, side * 0.6, y, 'parked',
          kind === 'taxi' ? '#ffca3a' : kind === 'gelados' ? '#f8f9fa' : kind === 'policia' ? '#f1f3f5' : col);
        car.dir = side > 0 ? 1 : -1;
        cars.push(car);
      }
    }
  }

  // estrelinhas a boiar dentro da piscina (para apanhar a nadar... ou a voar!)
  function spawnPoolStars() {
    const k = poolAt(cam + G.H * 0.9, 500);
    if (k === null || poolStarSeen[k]) return;
    poolStarSeen[k] = true;
    const pr = poolRect();
    for (let i = 0; i < 3; i++) {
      stars.push({
        u: pr.uIn + 0.07 + (pr.uOut - pr.uIn - 0.14) * h01(k * 3.3 + i * 7.7),
        y: poolY(k) + (i - 1) * (POOL_L * 0.27), agua: true
      });
    }
  }

  function contaLadroes() {
    let n = 0;
    for (const c of cars) if (c.ladrao && c.apanhado <= 0) n++;
    return n;
  }

  /* Um ladrão "leva" um carro estacionado e arranca — a polícia vai logo atrás.
     Ninguém se magoa: quando é apanhado devolve tudo e ficam todos amigos. */
  function roubarCarro() {
    if (contaLadroes() >= 2) return;
    const cands = cars.filter(function (c) {
      return c.state === 'parked' && c !== player && c.y > cam + G.H * 0.15 && c.y < cam + G.H * 1.3;
    });
    if (!cands.length) return;
    const c = cands[rndi(cands.length)];
    c.state = 'traffic'; c.lane = 3; c.dir = 1; c.ladrao = true; c.spd = 90; c.touched = true;
    emo(c.u, c.y + 44, '😮');
    if (Math.abs(c.y - cam) < G.H) {
      G.audio.sfx('brrr');
      G.banner('Ó! Um ladrão levou aquele carro! 🚓', 2600);
    }
    garantirPolicia();
  }

  // se um ladrão não tiver polícia no seu sentido, chega uma por trás dele com a sirene
  function garantirPolicia(alvo) {
    const d = alvo ? alvo.dir : 1;
    for (const c of cars) if (c.state === 'traffic' && c.kind === 'policia' && c.dir === d) return;
    const li = d > 0 ? 2 : 1;
    const y = alvo ? alvo.y - d * (G.H * 0.5 + 200) : cam - G.H * 0.3 - 260;
    const car = mkCar('policia', LANES[li].u, y, 'traffic', '#f1f3f5');
    car.lane = li; car.dir = d; car.spd = LANES[li].base * T().tf * 1.3;
    cars.push(car);
    if (Math.abs(y - cam) < G.H * 1.2) G.audio.sfx('sirene');
  }

  function spawnPed(seed) {
    const H = G.H;
    const side = Math.random() < 0.5 ? -1 : 1;
    const y = seed ? cam + rnd(-H * 0.3, H) : (Math.random() < 0.5 ? cam - H * 0.35 - rnd(60, 400) : cam + H * 0.8 + rnd(60, 500));
    peds.push({
      u: side * rnd(0.56, 0.63), y: y, side: side,
      vy: (Math.random() < 0.5 ? -1 : 1) * rnd(45, 85),
      walk: rnd(0, TAU), ang: 0, state: 'walk', hop: 0, waveT: 0, crossT: 0,
      col: PED_COLS[rndi(PED_COLS.length)], hair: HAIR_COLS[rndi(HAIR_COLS.length)]
    });
  }

  /* ---------------------------------------------- volante com o dedo */
  function sceneOn() { return document.body.classList.contains('scene-carros'); }
  function wheelC() {
    const r = clamp(Math.min(G.W, G.H) * 0.16, 74, 118);
    return { x: 26 + r, y: G.H - 26 - r, r: r };
  }
  function angDiff(a, b) {
    let d = a - b;
    while (d > Math.PI) d -= TAU;
    while (d < -Math.PI) d += TAU;
    return d;
  }
  (function bindWheel() {
    const cv = document.getElementById('game');
    cv.addEventListener('pointerdown', function (e) {
      if (!sceneOn() || mode !== 'drive') return;
      const wc = wheelC();
      const dx = e.clientX - wc.x, dy = e.clientY - wc.y;
      const d = Math.hypot(dx, dy);
      if (d < wc.r * 0.38) { doHorn(); return; }
      if (d < wc.r * 1.35) { steer.id = e.pointerId; steer.a0 = Math.atan2(dy, dx); steer.w0 = wheelA; }
    });
    // Estes dois ficam na window (para o dedo poder sair do volante a meio da curva),
    // por isso disparam em TODOS os jogos — e o `steer` só existe depois de entrarmos
    // nos carros. Sem esta guarda, mexer o rato noutra cena rebentava a cada evento.
    window.addEventListener('pointermove', function (e) {
      if (!steer || steer.id === null || e.pointerId !== steer.id) return;
      const wc = wheelC();
      const a = Math.atan2(e.clientY - wc.y, e.clientX - wc.x);
      wheelA = clamp(steer.w0 + angDiff(a, steer.a0), -MAXA, MAXA);
    });
    function up(e) { if (steer && steer.id !== null && e.pointerId === steer.id) steer.id = null; }
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  })();

  function doHorn() {
    const souPolicia = player.kind === 'policia';
    G.audio.sfx(souPolicia ? 'sirene' : 'horn');
    // mostrar o ladrão à polícia: fica mais lento e mais fácil de apanhar
    let apontou = false;
    for (const car of cars) {
      if (!car.ladrao || car.apanhado > 0 || car.state !== 'traffic') continue;
      if (Math.abs(car.y - player.y) > 900) continue;
      if (!car.ajudou) apontou = true;
      car.visto = souPolicia ? 6 : 4;
      car.ajudou = true;                                   // a ajuda do Isaac não se esquece
      emo(car.u, car.y + 46, '🚨');
      garantirPolicia();
    }
    if (apontou && !souPolicia) G.banner('Boa! Mostraste o ladrão à polícia! 🚨', 2200);

    for (const car of cars) {
      if (car.state !== 'traffic') continue;
      const dy = (car.y - player.y) * (car.dir > 0 ? 1 : -1);
      if (car.dir > 0 && (dy < 40 || dy > 540)) continue;
      if (car.dir < 0 && Math.abs(car.y - player.y) > 500) continue;
      if (Math.abs(car.u - player.u) * roadW() > carWpx() * 1.5) continue;
      car.dodge = 1.8;
      car.uOff = car.u <= player.u ? -0.105 : 0.105;
      if (Math.abs(car.u + car.uOff) > 0.46) car.uOff = -car.uOff;
      car.replyT = 0.35;
      emo(car.u, car.y + 40, '🎵');
    }
    for (const p of peds) {                              // as pessoas acenam de volta
      if (Math.abs(p.y - player.y) < 420 && Math.abs(p.u - player.u) < 1) {
        p.waveT = 1.2; emo(p.u, p.y + 30, '👋');
      }
    }
  }

  /* ---------------------------------------------- atualização */
  S.update = function (dt, t) {
    const inp = G.input;
    anchor += (anchorY() - anchor) * Math.min(1, 5 * dt);
    bumpCd = Math.max(0, bumpCd - dt);
    dustCd = Math.max(0, dustCd - dt);

    if (inp.justPressed('road') && mode !== 'pick' && mode !== 'garagem') { prevMode = mode; mode = 'pick'; syncBody(); }

    if (mode === 'pick' || mode === 'garagem') {
      if (G.audio.engineSet) G.audio.engineSet(0);
      if (mode === 'pick') handlePick(inp); else handleGarage(inp);
      updateParts(dt);
      return;
    }

    spawnParked();
    spawnPoolStars();
    comboT = Math.max(0, comboT - dt);
    if (comboT <= 0) combo = 0;                           // a série de saltos arrefece sozinha
    let nTraffic = 0;
    for (const c of cars) if (c.state === 'traffic') nTraffic++;
    if (nTraffic < 6) spawnTraffic(false);              // menos carros a atrapalhar: dá para ganhar velocidade
    if (peds.length < 8) spawnPed(false);

    rouboCd -= dt;                                        // de vez em quando há um roubo
    if (rouboCd <= 0) { rouboCd = rnd(26, 44); roubarCarro(); }
    // nenhum ladrão fica sem polícia atrás dele
    for (const c of cars) {
      if (c.ladrao && c.apanhado <= 0 && c.state === 'traffic') garantirPolicia(c);
    }

    if (mode === 'drive') updateDrive(dt, t, inp);
    else updateWalk(dt, t, inp);

    updateTraffic(dt, t);
    updateCross(dt, t);
    updatePeds(dt, t);
    updateStars(dt);
    updateParts(dt);

    for (let i = cars.length - 1; i >= 0; i--) {
      const c = cars[i];
      // ladrões e polícias em perseguição ficam mais tempo, para a história não se perder
      const folga = (c.ladrao || c.persegue) ? 3200 : 0;
      if (c.state === 'traffic' && (c.y < cam - G.H * 0.3 - 1300 - folga || c.y > cam + G.H * 0.75 + 1800 + folga)) cars.splice(i, 1);
      else if (c.state === 'parked' && !c.touched && c.y < cam - 6000) cars.splice(i, 1);
    }
    for (let i = peds.length - 1; i >= 0; i--) {
      if (Math.abs(peds[i].y - cam) > G.H * 1.6 + 700) peds.splice(i, 1);
    }

    const focus = mode === 'walk' ? hero : player;
    cam += (focus.y - cam) * Math.min(1, 6 * dt);

    // se a piscina não couber no ecrã (telemóvel), o mundo desliza para a esquerda
    const pAlvo = poolAt(focus.y, G.H * 0.8) !== null
      ? Math.min(0, G.W / 2 - 10 - poolRect().uOut * roadW()) : 0;
    panX += (pAlvo - panX) * Math.min(1, 2.2 * dt);

    if (G.audio.engineSet) G.audio.engineSet(mode === 'drive' ? Math.abs(player.spd) / KINDS[player.kind].max : 0);
  };

  /* ---------------------------------------------- salto da rampa */
  function comecarSalto() {
    const spd = Math.abs(player.spd);
    // o tempo no ar é medido para o voo cair mesmo em cima da piscina, seja qual for a
    // velocidade — quem decide se vai à água é o volante, não o pedal
    const dur = clamp((POOL_OFF - RAMP_OFF) / Math.max(spd, 1), 0.7, 1.9) * (1 + combo * 0.08);
    jump = { t: 0, dur: dur, h: 60 + 70 * dur + combo * 18 };       // mais tempo no ar = mais alto
    player.vu = 0; saltos++;
    G.audio.sfx('whee'); G.audio.sfx('vroom');
    G.shake = Math.max(G.shake, 0.14);
    G.banner(combo > 0 ? '🛼 Salto ' + (combo + 1) + '! Mais alto! 🌈' : '🛼 A VOAR! Vira para os lados! ↔️', 1800);
  }

  function updateJump(dt, inp) {
    jump.t += dt;
    const kb = (inp.isHeld('right') ? 1 : 0) - (inp.isHeld('left') ? 1 : 0);
    if (kb !== 0) wheelA = clamp(wheelA + kb * 5.2 * dt, -MAXA, MAXA);
    // no ar manda-se MUITO mais para os lados — é assim que se vai parar à piscina
    const pr = poolRect();
    player.u = clamp(player.u + (wheelA / MAXA) * 0.95 * dt, -uMaxRoad() - 0.2, pr.uOut - 0.07);
    player.y += player.spd * dt;
    dist += Math.abs(player.spd) * dt;
    if (Math.random() < dt * 26) {                        // rasto de arco-íris
      const cols = ['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#4cc9f0', '#b5179e'];
      parts.push({ u: player.u + rnd(-0.04, 0.04), y: player.y - carLen(player) * 0.5, vu: 0, vy: -50, t: 0, life: 0.55, col: cols[rndi(cols.length)], txt: null, s: rnd(5, 11) });
    }
    if (jump.t >= jump.dur) aterrar();
  }

  function aterrar() {
    jump = null;
    const pk = naAgua(player.u, player.y);
    if (pk !== null) { mergulho(); return; }
    G.audio.sfx('boing'); G.shake = Math.max(G.shake, 0.22);
    spark(player.u, player.y, 9, 'rgba(255,255,255,.85)');
    combo = Math.min(4, combo + 1); comboT = 16;
    G.addStars(combo); G.audio.sfx('star');
    G.banner('⭐'.repeat(combo) + ' Que salto! A próxima é mais alta! 🛼', 2200);
    player.stopped = false;
  }

  /* cair na piscina de carro: só faz um SPLASH gigante e toda a gente ri */
  function mergulho() {
    boia = 2.8; banhos++;
    player.spd = 0; player.vu = 0; wheelA = 0; player.stopped = true;
    G.audio.sfx('splash'); G.audio.sfx('tada');
    G.shake = Math.max(G.shake, 0.3);
    for (let i = 0; i < 18; i++) {
      parts.push({ u: player.u + rnd(-0.09, 0.09), y: player.y + rnd(-70, 70), vu: rnd(-0.05, 0.05), vy: rnd(-110, 110), t: 0, life: rnd(0.5, 1), col: 'rgba(185,238,255,.95)', txt: null, s: rnd(5, 13) });
    }
    emo(player.u, player.y + 54, '💦');
    combo = Math.min(4, combo + 1); comboT = 16;
    G.addStars(3);
    G.banner('SPLASH! 🌊 O carro foi à piscina! ⭐⭐⭐', 2800);
  }

  function updateBoia(dt) {
    boia -= dt;
    player.spd = 0;
    if (Math.random() < dt * 6) spark(player.u, player.y + rnd(-40, 40), 1, 'rgba(255,255,255,.85)');
    if (boia <= 0) {                                      // sai da água a pingar e volta à estrada
      player.u = LANES[3].u; player.vu = 0; player.spd = 60; player.stopped = false;
      G.audio.sfx('door'); emo(player.u, player.y + 40, '💧');
      G.banner('Fora da água! 💧 Vamos outra vez! 🚗', 1800);
    }
  }

  function updateDrive(dt, t, inp) {
    if (boia > 0) { updateBoia(dt); return; }
    if (jump) { updateJump(dt, inp); return; }
    const K = KINDS[player.kind];
    const gas = inp.isHeld('gas') || inp.isHeld('up');
    const brake = inp.isHeld('brake') || inp.isHeld('down');
    const max = (player.maxOverride || K.max) * T().tf;

    const revMax = REV * T().tf;

    if (gas) {
      // a acelerar (se vinha de marcha atrás, primeiro trava)
      player.spd = Math.min(max, player.spd + (player.spd < 0 ? BRK : K.acc) * dt);
      player.stopped = false; player.brakeT = 0;
    } else if (brake) {
      player.brakeT += dt;
      if (player.spd > 0) {
        player.spd = Math.max(0, player.spd - (theme === 'neve' ? BRK * 0.45 : BRK) * dt);
        if (player.spd === 0) player.stopped = true;
      } else if (player.brakeT > 0.6) {
        // parado e a continuar a carregar no travão: MARCHA ATRÁS 🔙
        if (player.spd > -1) { G.banner('🔙 Marcha atrás!', 1600); player.reCd = 0; }
        player.spd = Math.max(-revMax, player.spd - K.acc * 0.45 * dt);
        player.stopped = false;
      }
    } else {
      player.brakeT = 0;
      if (player.spd < 0) {                          // largou o travão: a ré vai parando
        player.spd = Math.min(0, player.spd + 520 * dt);
        if (player.spd === 0) player.stopped = true;
      } else if (!player.stopped) {
        if (player.spd > CRUISE) player.spd = Math.max(CRUISE, player.spd - 150 * dt);
        else player.spd = Math.min(CRUISE, player.spd + 70 * dt);
      }
    }

    // "bip bip" enquanto anda para trás, como os camiões
    if (player.spd < -5) {
      player.reCd -= dt;
      if (player.reCd <= 0) { player.reCd = 0.55; G.audio.sfx('re'); }
    } else player.reCd = 0;

    const kb = (inp.isHeld('right') ? 1 : 0) - (inp.isHeld('left') ? 1 : 0);
    if (kb !== 0) wheelA = clamp(wheelA + kb * 5.2 * dt, -MAXA, MAXA);
    else if (steer.id === null) wheelA *= Math.max(0, 1 - 6.5 * dt);

    const sf = Math.min(1, Math.abs(player.spd) / 300);
    const targetVu = (wheelA / MAXA) * 0.62 * sf;
    player.vu += (targetVu - player.vu) * Math.min(1, T().grip * dt);
    player.u += player.vu * dt;

    // a berma da direita abre-se em frente à garagem (entrada bem larga, é só virar)
    const gar = garageNear(player.y);
    const naEntrada = gar && Math.abs(player.y - gar.y) < 240;
    // depois de um salto pode aterrar na relva: em vez de dar um salto de volta, regressa devagarinho
    const naRelva = !naEntrada && player.u > uMaxRoad();
    const uHi = naEntrada ? 0.95 : Math.max(uMaxRoad(), player.u);
    if (player.u < -uMaxRoad() || player.u > uHi) {
      player.u = clamp(player.u, -uMaxRoad(), uHi);
      player.vu = 0;
      if (player.spd > 180 && dustCd <= 0) { dustCd = 0.25; G.shake = Math.max(G.shake, 0.1); spark(player.u, player.y, 4, 'rgba(255,255,255,.8)'); }
    }
    if (naRelva) {
      player.u = Math.max(uMaxRoad(), player.u - 0.75 * dt);   // mais forte que o volante: volta sempre
      player.vu = Math.min(player.vu, 0);
      if (Math.abs(player.spd) > 80 && dustCd <= 0) { dustCd = 0.22; spark(player.u, player.y, 3, 'rgba(255,255,255,.75)'); }
    }
    if (naAgua(player.u, player.y) !== null) { mergulho(); return; }   // foi parar à água? SPLASH
    const garAviso = garageNear(player.y + 620);         // avisar antes de lá chegar
    if (garAviso && !garSeen[garAviso.k] && player.y < garAviso.y - 260) {
      garSeen[garAviso.k] = true;
      G.banner('🔧 Garagem! Vai para a direita ➡️', 2400);
    }
    if (naEntrada && player.u > 0.5) {                   // entrou na garagem!
      garNow = gar; mode = 'garagem'; syncBody();
      player.spd = 0; player.stopped = true; player.vu = 0; wheelA = 0;
      G.audio.sfx('door');
      G.banner('🔧 Escolhe o teu carro de corrida!', 2600);
      return;
    }

    const y0 = player.y;
    player.y += player.spd * dt;

    // RAMPA: passar por cima com velocidade é voar 🌈
    const rk = rampK(player.y);
    if (rk !== null && y0 < rampY(rk) && player.y >= rampY(rk) && naRampa(player.u)) {
      if (player.spd >= JUMPMIN) { comecarSalto(); return; }
      player.wob = 0.4; G.audio.sfx('hop');               // devagarinho é só um saltinho
    }
    // avisos fofos: primeiro a rampa, depois a piscina
    const rAviso = rampK(player.y + 700);
    if (rAviso !== null && !rampSeen[rAviso] && player.y < rampY(rAviso) - 320) {
      rampSeen[rAviso] = true;
      G.banner('🛼 Rampa à frente! Acelera para voar! 💨', 2200);
    }
    const pAviso = poolK(player.y + 600);
    if (pAviso !== null && !poolAviso[pAviso] && player.y > rampY(pAviso) + 80 && player.y < poolY(pAviso) - 300) {
      poolAviso[pAviso] = true;
      G.banner('🏊 Piscina! Pára e sai do carro 🚪 para nadar!', 2400);
    }

    // semáforos: prémio por parar no vermelho, aviso fofo se passar
    const st = nextStop(player.y, 1);
    const luz = lightMain(st.k, t);
    const dToLine = st.y - player.y;
    // parar no vermelho conta sempre — mesmo à espera na fila atrás dos outros carros
    if (luz === 'vermelho' && Math.abs(player.spd) < 15 && dToLine > -15 && dToLine < 1000 && !lightSeen[st.k]) {
      lightSeen[st.k] = 'parou';
      G.addStars(1); G.audio.sfx('star');
      G.banner('⭐ Boa! Paraste no vermelho!', 2000);
    }
    const kBox = Math.round(player.y / BLOCK);
    if (inBox(player.y, kBox) && lightMain(kBox, t) === 'vermelho' && lightSeen[kBox] !== 'parou' && lightSeen[kBox] !== 'passou') {
      lightSeen[kBox] = 'passou';
      G.audio.sfx('brrr');
      G.banner('🚦 Ui! Era vermelho — espera da próxima!', 2200);
    }

    // rede de segurança: nunca ficar preso. Se o acelerador está a fundo e não anda
    // (e não é por causa de um semáforo), chega-se para o lado até se soltar.
    // (medir o que ANDOU, não a velocidade: o toque zera a velocidade só no fim do frame,
    //  e com isso um carro parado no cruzamento podia prender o Isaac para sempre)
    const naFila = luz !== 'verde' && dToLine > -20 && dToLine < 1200;
    if (gas && player.y - y0 < 1.2 && !naFila) player.stuckT += dt; else player.stuckT = 0;
    if (player.stuckT > 2) {
      player.u = clamp(player.u + (player.u > 0 ? -0.55 : 0.55) * dt, -uMaxRoad(), uHi);
    }

    dist += Math.abs(player.spd) * dt;             // o conta-quilómetros conta também a ré
    if (dist / 10 >= nextKm) {
      G.audio.sfx('tada'); G.addStars(2);
      G.banner('🎉 ' + Math.round(nextKm / 1000) + ' km! ⭐⭐', 2200);
      nextKm += 1000;
    }

    if (player.spd > max * 0.9) {
      const cols = ['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];
      parts.push({ u: player.u + rnd(-0.05, 0.05), y: player.y - carLen(player) * 0.55, vu: 0, vy: -40, t: 0, life: 0.5, col: cols[rndi(cols.length)], txt: null, s: rnd(5, 10) });
    } else if (gas && Math.random() < dt * 14) {
      parts.push({ u: player.u + rnd(-0.03, 0.03), y: player.y - carLen(player) * 0.6, vu: 0, vy: -30, t: 0, life: 0.6, col: 'rgba(200,205,215,.65)', txt: null, s: rnd(5, 9) });
    }

    // toques fofos: nos carros da estrada e nos da rua transversal
    for (const o of cars) {
      if (o === player) continue;
      bump(o, (o.state === 'traffic' && o.dir === player.dir) ? o.spd : 0);
    }
    for (const o of cross) bump(o, 0);

    if (inp.justPressed('horn')) doHorn();

    if (inp.justPressed('door')) {
      if (player.spd > 10) { G.audio.sfx('brrr'); G.banner('Trava primeiro! 🛑✋', 1600); }
      else {
        player.state = 'parked'; player.touched = true; player.spd = 0;
        const side = player.u > 0.3 ? -1 : 1;
        hero.u = clamp(player.u + side * 0.14, -0.6, 0.6);
        hero.y = player.y; hero.dir = 0;
        mode = 'walk'; syncBody();
        G.audio.sfx('door');
        G.banner('Vai passear! 🚶 Escolhe outro carro!', 2200);
      }
    }
  }

  function bump(o, oSpd) {
    const du = (player.u - o.u) * roadW();
    const dy = player.y - o.y;
    const w = carWpx() * 0.96, l = (carLen(player) + carLen(o)) / 2;
    if (Math.abs(du) >= w || Math.abs(dy) >= l) return;
    // a conduzir o carro da polícia, encostar a um ladrão é apanhá-lo (sem pancada)
    if (player.kind === 'policia' && o.ladrao && o.apanhado <= 0) { apanhar(o, player); return; }
    // sair pelo lado onde está menos encravado — assim desliza e nunca fica preso
    if (l - Math.abs(dy) <= w - Math.abs(du)) {
      player.y = o.y + (dy > 0 ? l : -l);
      // só trava o movimento que ia contra o obstáculo (deixa sair em marcha atrás)
      if (dy > 0) player.spd = Math.max(player.spd, oSpd * 0.9);
      else player.spd = Math.min(player.spd, oSpd * 0.9);
    } else {
      player.u = o.u + (du > 0 ? (w + 1) : -(w + 1)) / roadW();
      player.vu = 0;
      // encostaste-te? o carro amigo chega-se para o lado — e se não puder, abranda
      if (o.state === 'traffic' && o.lane !== null) {
        const away = du > 0 ? 0.11 : -0.11;
        if (Math.abs(LANES[o.lane].u + away) < 0.46) { o.dodge = 1.6; o.uOff = away; }
        else o.yieldT = 1.8;
      }
    }
    o.wob = 0.6; o.touched = true;
    if (o.state === 'traffic') o.replyT = 0.3;
    if (bumpCd <= 0) {
      bumpCd = 0.5;
      G.audio.sfx('boing'); G.shake = Math.max(G.shake, 0.18);
      spark((player.u + o.u) / 2, (player.y + o.y) / 2, 7, '#ffd166');
    }
  }

  /* Apanhar um ladrão: pára, tira a máscara, devolve tudo e fica amigo. Zero castigos. */
  function apanhar(l, quem) {
    if (l.apanhado > 0) return;
    l.apanhado = 2;
    l.spd = Math.min(l.spd, 40);
    if (quem && quem !== player) quem.yieldT = 0;
    apanhados++;
    const perto = Math.abs(l.y - cam) < G.H;
    if (perto) {
      G.audio.sfx('tada');
      spark(l.u, l.y, 10, '#ffd166');
      emo(l.u, l.y + 46, '👋');
      const bonus = l.ajudou ? 1 : 0;
      G.addStars(2 + bonus);
      if (quem === player) G.banner('Apanhaste o ladrão! Ficou amigo! 🎉⭐⭐', 2800);
      else if (bonus) G.banner('Ajudaste a polícia! ⭐ Ficaram amigos! 🎉', 2800);
      else G.banner('🚓 A polícia apanhou! Devolveu tudo! 🎉', 2600);
    }
  }

  function nearestFreeCar() {
    let best = null, bd = 1e9;
    for (const c of cars) {
      if (c.state !== 'parked') continue;
      const d = Math.abs(c.u - hero.u) * roadW() + Math.abs(c.y - hero.y);
      if (Math.abs(c.u - hero.u) * roadW() < 85 && Math.abs(c.y - hero.y) < 130 && d < bd) { bd = d; best = c; }
    }
    return best;
  }

  function updateWalk(dt, t, inp) {
    const ax = inp.axis();
    const mvx = ax.x, mvy = -ax.y;
    // ao pé da piscina pode-se andar mais para a direita, até dentro de água
    const pr = poolRect();
    const uLim = poolAt(hero.y, 60) !== null ? Math.max(0.62, pr.uOut - 0.03) : 0.62;
    if (Math.abs(mvx) > 0.15 || Math.abs(mvy) > 0.15) {
      hero.u = clamp(hero.u + mvx * (hero.swim ? 0.26 : 0.42) * dt, -0.62, uLim);
      hero.y += mvy * WALKSPD * (hero.swim ? 0.6 : 1) * dt;
      hero.walk += dt * (hero.swim ? 6 : 10);
      hero.dir = hero.swim ? 0 : Math.atan2(mvx, mvy);
    }

    const agora = naAgua(hero.u, hero.y);
    if (agora !== null && !hero.swim) {                    // SPLASH! entrou na água
      hero.swim = true;
      G.audio.sfx('splash'); G.audio.sfx('giggle');
      spark(hero.u, hero.y, 10, 'rgba(185,238,255,.95)');
      if (!poolSeen[agora]) {
        poolSeen[agora] = true; banhos++;
        G.addStars(2); G.audio.sfx('star');
        G.banner('🏊 SPLASH! Que fresquinha! ⭐⭐', 2600);
      } else G.banner('🏊 Outra vez à água! 💦', 1600);
    } else if (agora === null && hero.swim) {
      hero.swim = false;
      G.audio.sfx('hop');
      spark(hero.u, hero.y, 6, 'rgba(185,238,255,.9)');
      G.banner('Fora da água! 💧', 1400);
    }
    if (hero.swim && Math.random() < dt * 4) spark(hero.u + rnd(-0.03, 0.03), hero.y + rnd(-20, 20), 1, 'rgba(255,255,255,.9)');

    if (inp.justPressed('door')) {
      if (hero.swim) {
        G.audio.sfx('giggle');
        G.banner('Sai da água primeiro! 🏊➡️🚗', 1800);
        return;
      }
      const c = nearestFreeCar();
      if (c) {
        c.state = 'player'; c.touched = true; c.spd = 0; c.stopped = true; c.lane = null; c.dir = 1;
        player = c; wheelA = 0; player.vu = 0; hero.swim = false;
        mode = 'drive'; syncBody();
        G.audio.sfx('door'); G.audio.sfx('vroom');
        G.banner(KINDS[c.kind].nome, 2000);
      } else {
        G.audio.sfx('giggle');
        G.banner('Vai para o pé de um carro! 🚗', 1600);
      }
    }
  }

  /* trânsito da estrada grande: segue quem vai à frente, para no vermelho,
     deixa passar as pessoas e o menino a pé */
  function updateTraffic(dt, t) {
    for (const car of cars) {
      car.wob = Math.max(0, car.wob - dt);
      car.blink = Math.max(0, car.blink - dt);
      car.dodge = Math.max(0, car.dodge - dt);
      car.yieldT = Math.max(0, car.yieldT - dt);
      car.honkCd = Math.max(0, car.honkCd - dt);
      if (car.replyT > 0) {
        car.replyT -= dt;
        if (car.replyT <= 0 && Math.abs(car.y - cam) < G.H) G.audio.sfx('beep');
      }
      car.visto = Math.max(0, car.visto - dt);
      if (car.state !== 'traffic') continue;

      // apanhado: pára um bocadinho, devolve tudo e volta a ser um carro normal e feliz
      if (car.apanhado > 0) {
        car.apanhado -= dt;
        car.spd = Math.max(0, car.spd - 900 * dt);
        car.y += car.spd * car.dir * dt;
        car.u += (LANES[car.lane].u - car.u) * Math.min(1, 5 * dt);
        if (car.apanhado <= 0) {
          car.ladrao = false; car.visto = 0; car.ajudou = false;
          car.col = PALETTE[rndi(PALETTE.length)];
          if (Math.abs(car.y - cam) < G.H) { G.audio.sfx('star'); emo(car.u, car.y + 40, '💖'); }
        }
        continue;
      }

      const L = LANES[car.lane], d = car.dir;
      let des = L.base * T().tf * (car.kind === 'corrida' ? 1.25 : 1);
      if (car.ladrao) des *= car.visto > 0 ? 0.55 : 1.12;   // buzinar-lhe deixa-o mais lento

      // a polícia persegue o ladrão mais próximo (e depois volta ao trânsito normal)
      car.persegue = null;
      if (car.kind === 'policia') {
        let alvo = null, bd = 1e9;
        for (const o of cars) {
          if (!o.ladrao || o.apanhado > 0 || o.state !== 'traffic' || o.dir !== d) continue;
          const dy = (o.y - car.y) * d;
          if (dy > -400 && dy < 3600 && Math.abs(dy) < bd) { bd = Math.abs(dy); alvo = o; }
        }
        if (alvo) {
          car.persegue = alvo;
          des = LANES[car.lane].base * T().tf * 1.9;
          if (alvo.lane !== car.lane && car.blink <= 0) {
            const passo = Math.sign(alvo.lane - car.lane);
            const nl = car.lane + passo;
            if (LANES[nl] && LANES[nl].dir === d) {
              let livre = true;
              for (const o of cars) {
                if (o !== car && o !== alvo && Math.abs(o.u - LANES[nl].u) * roadW() < carWpx() * 1.1 && Math.abs(o.y - car.y) < 300) { livre = false; break; }
              }
              if (livre) { car.lane = nl; car.blink = 1; }
            }
          }
          if (car.sireneCd <= 0 && Math.abs(car.y - cam) < G.H) { G.audio.sfx('sirene'); car.sireneCd = 4.5; }
          if (Math.abs(alvo.y - car.y) < carLen(car) * 1.15 && Math.abs(alvo.u - car.u) * roadW() < carWpx() * 1.4) apanhar(alvo, car);
        }
      }
      car.sireneCd = Math.max(0, car.sireneCd - dt);

      // quem vai à frente (na mesma faixa e no mesmo sentido)
      let ld = 1e9, lspd = 0, gapStop = 100;
      for (const o of cars) {
        if (o === car || o === car.persegue) continue;     // a polícia chega-se mesmo ao ladrão
        const ahead = (o.y - car.y) * d;
        if (ahead <= 0 || ahead > 640) continue;
        if (Math.abs(o.u - car.u) * roadW() > carWpx() * 0.95) continue;
        if (ahead < ld) { ld = ahead; lspd = (o.state === 'traffic' && o.dir === d) ? o.spd : 0; gapStop = 55; }
      }
      // o menino a pé
      if (mode === 'walk') {
        const ahead = (hero.y - car.y) * d;
        if (ahead > 0 && ahead < 700 && Math.abs(hero.u - car.u) * roadW() < carWpx() * 1.5 && ahead < ld) {
          ld = ahead; lspd = 0; gapStop = 210;
        }
      }
      // semáforo vermelho (ou amarelo com espaço para travar)
      const st = nextStop(car.y, d);
      const luz = lightMain(st.k, t);
      const dLine = (st.y - car.y) * d;
      if (dLine > 0 && (luz === 'vermelho' || (luz === 'amarelo' && dLine > 90)) && dLine < ld) {
        ld = dLine; lspd = 0; gapStop = 6;
      }
      // pessoas a atravessar o cruzamento à frente
      for (const p of peds) {
        if (p.state !== 'cross') continue;
        const ahead = (p.y - car.y) * d;
        if (ahead <= 0 || ahead > 700) continue;
        if (Math.abs(p.u - car.u) * roadW() > carWpx() * 2.2) continue;
        if (ahead < ld) { ld = ahead; lspd = 0; gapStop = 230; }
      }

      if (ld < 1e9) des = clamp(lspd + (ld - carLen(car) * 1.05 - gapStop) * 2.2, 0, des);
      if (car.yieldT > 0) des = Math.min(des, 45);        // a deixar o Isaac passar
      car.spd += clamp(des - car.spd, -1000 * dt, 380 * dt);
      car.y += car.spd * d * dt;

      // saltinho engraçado de quem passa na rampa
      const rk = rampK(car.y);
      if (rk !== null && car.wob <= 0 && car.spd > 150 && naRampa(car.u) && Math.abs(car.y - rampY(rk)) < 26) {
        car.wob = 0.45;
        if (Math.abs(car.y - cam) < G.H) G.audio.sfx('hop');
      }

      // à frente de uma garagem, a faixa da direita fica livre para quem quer entrar
      if (d > 0 && car.lane === 3 && car.blink <= 0 && garageNear(car.y + 400)) {
        let livre = true;
        for (const o of cars) {
          if (o !== car && Math.abs(o.u - LANES[2].u) * roadW() < carWpx() * 1.1 && Math.abs(o.y - car.y) < 340) { livre = false; break; }
        }
        if (livre) { car.lane = 2; car.blink = 1.2; }
      }

      // fila parada e sem ser por semáforo? muda de faixa com pisca
      const paradoPorLuz = dLine > 0 && dLine < 260 && (luz === 'vermelho' || luz === 'amarelo');
      if (des < 8 && car.spd < 12 && !paradoPorLuz) car.waitT += dt; else car.waitT = 0;
      if (car.waitT > 1.5) {
        car.waitT = 0;
        const opts = [car.lane - 1, car.lane + 1].filter(function (l) { return LANES[l] && LANES[l].dir === d; });
        for (const nl of opts) {
          let free = true;
          for (const o of cars) {
            if (o !== car && Math.abs(o.u - LANES[nl].u) * roadW() < carWpx() * 1.1 && Math.abs(o.y - car.y) < 360) { free = false; break; }
          }
          if (free && mode === 'walk' && Math.abs(hero.u - LANES[nl].u) * roadW() < carWpx() * 1.6 && Math.abs(hero.y - car.y) < 420) free = false;
          if (free) { car.lane = nl; car.blink = 1.2; break; }
        }
        if (car.honkCd <= 0 && Math.abs(car.y - cam) < G.H) { G.audio.sfx('beep'); car.honkCd = 3.5; }
      }

      const tu = LANES[car.lane].u + (car.dodge > 0 ? car.uOff : 0);
      car.u += (tu - car.u) * Math.min(1, 5 * dt);
    }
  }

  /* carros da rua transversal: passam quando o semáforo deles está verde */
  function updateCross(dt, t) {
    const kLo = Math.floor((cam - G.H) / BLOCK), kHi = Math.ceil((cam + G.H) / BLOCK);
    for (let k = kLo; k <= kHi; k++) {
      if (lightCross(k, t) !== 'verde') continue;
      const key = k + ':' + Math.floor(phaseAt(k, t) * 2);
      if (crossSeen[key]) continue;
      crossSeen[key] = true;
      if (Math.random() > 0.55) continue;
      let n = 0;
      for (const cc of cross) if (cc.k === k) n++;
      if (n > 3) continue;
      const d = Math.random() < 0.5 ? 1 : -1;
      const half = crossHalf();
      cross.push({
        k: k, kind: Math.random() < 0.2 ? 'carrinha' : 'sedan',
        col: PALETTE[rndi(PALETTE.length)],
        u: -d * (uEdge() + 0.15), dir: d, spd: rnd(190, 260) * T().tf,
        y: k * BLOCK - d * half * 0.45, state: 'cross', wob: 0, touched: false
      });
    }
    for (let i = cross.length - 1; i >= 0; i--) {
      const cc = cross[i];
      cc.wob = Math.max(0, cc.wob - dt);
      // travar se houver alguém no meio do cruzamento (nunca atropela)
      let livre = true;
      const alvo = [];
      if (mode === 'drive') alvo.push({ u: player.u, y: player.y });
      else alvo.push({ u: hero.u, y: hero.y });
      for (const p of peds) if (p.state === 'cross') alvo.push({ u: p.u, y: p.y });
      for (const a of alvo) {
        const ahead = (a.u - cc.u) * cc.dir * roadW();
        if (ahead > 0 && ahead < 210 && Math.abs(a.y - cc.y) < carWpx() * 2) livre = false;
      }
      if (livre) cc.u += (cc.spd / roadW()) * cc.dir * dt;
      if (Math.abs(cc.u) > uEdge() + 0.3 || Math.abs(cc.y - cam) > G.H * 1.5) cross.splice(i, 1);
    }
  }

  /* pessoas a passear no passeio e a atravessar na passadeira quando os carros têm vermelho */
  function updatePeds(dt, t) {
    for (const p of peds) {
      p.waveT = Math.max(0, p.waveT - dt);
      p.hop = Math.max(0, p.hop - dt);
      if (p.state === 'walk') {
        p.crossT = Math.max(0, p.crossT - dt);
        p.y += p.vy * dt;
        p.walk += dt * 7;
        p.ang = p.vy > 0 ? 0 : Math.PI;
        p.u += (p.side * 0.595 - p.u) * Math.min(1, 2 * dt);   // volta ao passeio
        // decidir atravessar num cruzamento com vermelho para os carros
        const k = Math.round(p.y / BLOCK);
        if (p.crossT <= 0 && Math.abs(p.y - k * BLOCK) < crossHalf() * 0.5 && lightMain(k, t) === 'vermelho' && Math.random() < dt * 1.6) {
          p.state = 'cross'; p.target = -p.side * 0.6; p.y = k * BLOCK;
        }
      } else {                                            // a atravessar (vai sempre até ao fim)
        const dir = Math.sign(p.target - p.u) || 1;
        p.u += dir * (190 / roadW()) * dt;
        p.walk += dt * 9;
        p.ang = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        if (Math.abs(p.u - p.target) < 0.03) {
          p.state = 'walk'; p.side = p.target < 0 ? -1 : 1; p.crossT = 3;
        }
      }
      // se QUALQUER carro chegar demasiado perto, salta para o lado a rir — ninguém se magoa
      if (p.hop <= 0) {
        for (const car of cars) {
          if (car.state === 'parked') continue;
          const du = (p.u - car.u) * roadW(), dy = p.y - car.y;
          if (Math.abs(du) >= 46 || Math.abs(dy) >= 62) continue;
          p.hop = 0.6;
          p.u += (du >= 0 ? 1 : -1) * 0.1;
          p.y += dy >= 0 ? 44 : -44;
          if (Math.abs(p.y - cam) < G.H) { G.audio.sfx('hop'); G.audio.sfx('giggle'); }
          emo(p.u, p.y + 30, '😄');
          break;
        }
      }
    }
  }

  function updateStars(dt) {
    while (nextStarY < cam + G.H * 1.6) {
      stars.push({ u: LANES[OURS[rndi(2)]].u + rnd(-0.02, 0.02), y: nextStarY });
      nextStarY += rnd(380, 820);
    }
    for (let i = stars.length - 1; i >= 0; i--) {
      const st = stars[i];
      let hit;
      if (mode === 'drive') hit = Math.abs(st.u - player.u) * roadW() < carWpx() * 0.8 && Math.abs(st.y - player.y) < carLen(player) * 0.7;
      else hit = Math.abs(st.u - hero.u) * roadW() < 46 && Math.abs(st.y - hero.y) < 52;
      if (hit) {
        stars.splice(i, 1);
        G.addStars(1); G.audio.sfx('star');
        spark(st.u, st.y, 6, '#ffd166');
      } else if (st.y < cam - G.H) stars.splice(i, 1);
    }
  }

  function updateParts(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt;
      if (p.t > p.life) { parts.splice(i, 1); continue; }
      p.u += p.vu * dt; p.y += p.vy * dt;
    }
  }

  /* ---------------------------------------------- ecrãs de escolha */
  function gridRects() {
    const W = G.W, H = G.H;
    const cw = Math.min(W * 0.42, 290), ch = Math.min(H * 0.28, 200);
    const gx = 16, gy = 16;
    const ox = W / 2 - cw - gx / 2, oy = H * 0.2;
    const rs = [];
    for (let i = 0; i < 4; i++) rs.push({ x: ox + (i % 2) * (cw + gx), y: oy + Math.floor(i / 2) * (ch + gy), w: cw, h: ch });
    return rs;
  }
  function hitCard(tap) {
    if (!tap) return -1;
    const rs = gridRects();
    for (let i = 0; i < rs.length; i++) {
      const r = rs[i];
      if (tap.x >= r.x && tap.x <= r.x + r.w && tap.y >= r.y && tap.y <= r.y + r.h) return i;
    }
    return -1;
  }

  function handlePick(inp) {
    const i = hitCard(inp.tap);
    if (i < 0) return;
    theme = THEME_KEYS[i];
    G.audio.sfx('pop');
    if (!started) {
      started = true; mode = 'drive';
      G.banner(theme === 'neve' ? 'Neve! Escorrega um bocadinho! ⛄' : 'Boa viagem! 🚗💨', 2400);
    } else {
      mode = prevMode;
      if (theme === 'neve') G.banner('Cuidado, escorrega! ⛄', 2000);
    }
    syncBody();
  }

  function handleGarage(inp) {
    if (!inp.tap) return;
    const i = hitCard(inp.tap);
    if (i >= 0) {
      const g = GARAGE[i];
      player.kind = 'corrida'; player.col = g.col; player.maxOverride = g.max;
      G.audio.sfx('vroom'); G.audio.sfx('tada');
      G.banner('Carro de corrida ' + g.nome + '! 🏁', 2200);
    } else {
      G.audio.sfx('pop');
    }
    player.u = LANES[3].u; player.vu = 0; player.spd = 0; player.stopped = true;
    mode = 'drive'; garNow = null; syncBody();
  }

  /* ---------------------------------------------- desenho */
  function drawGround(c, t) {
    const W = G.W, H = G.H, th = T(), rw = roadW();
    c.fillStyle = th.ground; c.fillRect(0, 0, W, H);
    const x0 = scrX(-0.5), x1 = scrX(0.5);
    c.fillStyle = th.curb; c.fillRect(x0 - 18, 0, rw + 36, H);
    c.fillStyle = th.road; c.fillRect(x0, 0, rw, H);
    c.fillStyle = 'rgba(255,255,255,.85)';
    c.fillRect(x0 + 3, 0, 5, H); c.fillRect(x1 - 8, 0, 5, H);

    const yLo = cam - (H - anchor) - 200, yHi = cam + anchor + 200;
    // tracinhos entre faixas do mesmo sentido
    c.fillStyle = 'rgba(255,255,255,.6)';
    for (let wy = Math.floor(yLo / 90) * 90; wy < yHi; wy += 90) {
      const sy = scrY(wy);
      for (const u of [-0.25, 0.25]) c.fillRect(scrX(u) - 3, sy - 44, 6, 44);
    }
    // linha do meio: dupla e contínua (não se passa para o outro sentido!)
    c.fillStyle = 'rgba(255,240,150,.95)';
    c.fillRect(scrX(0) - 7, 0, 5, H); c.fillRect(scrX(0) + 2, 0, 5, H);

    // cruzamentos
    const half = crossHalf();
    for (let k = Math.floor(yLo / BLOCK); k <= Math.ceil(yHi / BLOCK); k++) {
      const cy = scrY(k * BLOCK);
      if (cy < -half * 2 - 120 || cy > H + half * 2 + 120) continue;
      c.fillStyle = th.curb; c.fillRect(0, cy - half - 18, W, half * 2 + 36);
      c.fillStyle = th.road; c.fillRect(0, cy - half, W, half * 2);
      // tracinhos da rua transversal
      c.fillStyle = 'rgba(255,255,255,.55)';
      for (let x = 0; x < W; x += 90) { if (x < x0 - 20 || x > x1 + 20) c.fillRect(x, cy - 3, 44, 6); }
      // passadeiras dos dois lados do cruzamento
      c.fillStyle = 'rgba(255,255,255,.85)';
      const n = 8, seg = rw / (n * 2 - 1);
      for (const s of [-1, 1]) {
        const py = cy + s * (half + 6) - (s > 0 ? 0 : 30);
        for (let i = 0; i < n; i++) c.fillRect(x0 + i * 2 * seg, py, seg, 30);
      }
      // linhas de STOP
      c.fillStyle = 'rgba(255,255,255,.9)';
      c.fillRect(scrX(0) + 4, cy + half + 40, rw / 2 - 8, 7);
      c.fillRect(x0 + 4, cy - half - 47, rw / 2 - 8, 7);
    }

    if (theme === 'neve') {
      c.fillStyle = 'rgba(255,255,255,.28)';
      for (let wy = Math.floor(yLo / 160) * 160; wy < yHi; wy += 160) {
        if (h01(wy * 0.013) < 0.45) continue;
        const sy = scrY(wy);
        const ix = scrX((h01(wy * 0.07) - 0.5) * 0.8);
        c.beginPath(); c.ellipse(ix, sy, 34 + h01(wy) * 30, 14, 0, 0, TAU); c.fill();
      }
    }
  }

  function drawItem(c, kind, x, y, s, t) {
    c.save(); c.translate(x, y); c.scale(s, s);
    const th = theme;
    if (th === 'cidade') {
      if (kind === 0) {
        const col = ['#f4a261', '#e76f51', '#8ecae6', '#cdb4db'][Math.floor(h01(x * 0.13 + y) * 4)];
        G.gfx.rr(c, -34, -96, 68, 96, 6); c.fillStyle = col; c.fill();
        c.fillStyle = 'rgba(255,255,240,.85)';
        for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) c.fillRect(-24 + i * 20, -86 + j * 22, 12, 13);
      } else if (kind === 1) {
        c.strokeStyle = '#495057'; c.lineWidth = 6; c.lineCap = 'round';
        c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -64); c.stroke();
        c.fillStyle = '#ffd166'; c.beginPath(); c.arc(0, -70, 9, 0, TAU); c.fill();
      } else {
        c.fillStyle = '#8d5524'; c.fillRect(-4, -22, 8, 22);
        c.fillStyle = '#57a844'; c.beginPath(); c.arc(0, -38, 22, 0, TAU); c.fill();
      }
    } else if (th === 'campo') {
      if (kind === 0) {
        c.fillStyle = '#8d5524'; c.fillRect(-5, -30, 10, 30);
        c.fillStyle = '#40916c';
        c.beginPath(); c.arc(-14, -42, 18, 0, TAU); c.arc(14, -42, 18, 0, TAU); c.arc(0, -56, 21, 0, TAU); c.fill();
      } else if (kind === 1) {
        const col = ['#ff5d8f', '#ffca3a', '#b5179e', '#ff924c'][Math.floor(h01(x + y * 0.11) * 4)];
        c.strokeStyle = '#40916c'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -26); c.stroke();
        for (let i = 0; i < 6; i++) { const a = i * TAU / 6; c.fillStyle = col; c.beginPath(); c.arc(Math.cos(a) * 9, -32 + Math.sin(a) * 9, 7, 0, TAU); c.fill(); }
        c.fillStyle = '#ffd166'; c.beginPath(); c.arc(0, -32, 6, 0, TAU); c.fill();
      } else {
        c.fillStyle = '#fff'; G.gfx.rr(c, -26, -34, 52, 26, 12); c.fill();
        c.fillStyle = '#343a40';
        c.beginPath(); c.arc(-10, -26, 6, 0, TAU); c.arc(8, -18, 5, 0, TAU); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(24, -34, 10, 0, TAU); c.fill();
        c.fillStyle = '#ffc2d1'; c.beginPath(); c.ellipse(27, -31, 5, 3.6, 0, 0, TAU); c.fill();
        c.fillStyle = '#343a40'; c.beginPath(); c.arc(22, -38, 1.7, 0, TAU); c.arc(28, -38, 1.7, 0, TAU); c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = 5; c.lineCap = 'round';
        c.beginPath(); c.moveTo(-18, -10); c.lineTo(-18, 0); c.moveTo(14, -10); c.lineTo(14, 0); c.stroke();
      }
    } else if (th === 'neve') {
      if (kind === 0) {
        c.fillStyle = '#8d5524'; c.fillRect(-4, -18, 8, 18);
        c.fillStyle = '#2d6a4f';
        for (let i = 0; i < 3; i++) {
          const w = 34 - i * 8, yy = -20 - i * 18;
          c.beginPath(); c.moveTo(-w / 2, yy); c.lineTo(w / 2, yy); c.lineTo(0, yy - 22); c.closePath(); c.fill();
        }
        c.fillStyle = 'rgba(255,255,255,.9)';
        c.beginPath(); c.arc(0, -62, 6, 0, TAU); c.arc(-9, -40, 5, 0, TAU); c.arc(10, -24, 5, 0, TAU); c.fill();
      } else if (kind === 1) {
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(0, -14, 15, 0, TAU); c.fill();
        c.beginPath(); c.arc(0, -38, 11, 0, TAU); c.fill();
        c.fillStyle = '#2b2d42';
        c.beginPath(); c.arc(-4, -41, 1.8, 0, TAU); c.arc(4, -41, 1.8, 0, TAU); c.fill();
        c.fillStyle = '#ff7b00';
        c.beginPath(); c.moveTo(0, -38); c.lineTo(12, -35); c.lineTo(0, -34); c.closePath(); c.fill();
        c.strokeStyle = '#2b2d42'; c.lineWidth = 1.6;
        c.beginPath(); c.arc(0, -34, 5, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
        c.fillStyle = '#e63946'; G.gfx.rr(c, -9, -52, 18, 6, 3); c.fill(); G.gfx.rr(c, -6, -62, 12, 11, 3); c.fill();
      } else {
        c.fillStyle = '#adb5bd'; c.beginPath(); c.arc(0, -10, 13, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(0, -17, 11, 5, 0, 0, TAU); c.fill();
      }
    } else {
      if (kind === 0) {
        c.fillStyle = '#2a9d3a';
        G.gfx.rr(c, -8, -54, 16, 54, 8); c.fill();
        G.gfx.rr(c, -26, -40, 14, 8, 4); c.fill(); G.gfx.rr(c, -26, -40, 8, 20, 4); c.fill();
        G.gfx.rr(c, 12, -32, 14, 8, 4); c.fill(); G.gfx.rr(c, 18, -32, 8, 16, 4); c.fill();
        c.fillStyle = '#2b2d42'; c.beginPath(); c.arc(-4, -44, 1.8, 0, TAU); c.arc(4, -44, 1.8, 0, TAU); c.fill();
        c.strokeStyle = '#2b2d42'; c.lineWidth = 1.6;
        c.beginPath(); c.arc(0, -40, 4.5, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
        c.fillStyle = '#ff5d8f'; c.beginPath(); c.arc(0, -56, 4, 0, TAU); c.fill();
      } else if (kind === 1) {
        c.fillStyle = '#c98f5b'; c.beginPath(); c.moveTo(-16, 0); c.lineTo(-8, -18); c.lineTo(8, -14); c.lineTo(16, 0); c.closePath(); c.fill();
      } else {
        c.strokeStyle = '#a1683a'; c.lineWidth = 7; c.lineCap = 'round';
        c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(8, -30, 4, -52); c.stroke();
        c.strokeStyle = '#2a9d3a'; c.lineWidth = 5;
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + (i - 2) * 0.55;
          c.beginPath(); c.moveTo(4, -52); c.quadraticCurveTo(4 + Math.cos(a) * 22, -52 + Math.sin(a) * 22 - 6, 4 + Math.cos(a) * 34, -52 + Math.sin(a) * 34 + 6); c.stroke();
        }
      }
    }
    c.restore();
  }

  function drawScenery(c, t) {
    const H = G.H;
    const yLo = cam - (H - anchor) - 200, yHi = cam + anchor + 250;
    for (let band = Math.floor(yLo / 110); band <= Math.floor(yHi / 110); band++) {
      const by = band * 110 + h01(band * 7.7) * 80;
      if (Math.abs(by - Math.round(by / BLOCK) * BLOCK) < crossHalf() + 90) continue;   // não tapar cruzamentos
      for (let side = 0; side < 2; side++) {
        const hh = h01(band * 3.71 + side * 17.3);
        if (hh < 0.42) continue;
        if (side === 1 && (garageNear(by) || poolAt(by, 120) !== null)) continue;        // nem a garagem, nem a piscina
        const kind = Math.floor(h01(band * 9.11 + side * 5.1) * 3);
        const u = (side === 0 ? -1 : 1) * (0.72 + h01(band * 2.9 + side) * 0.16);
        const x = scrX(u), y = scrY(by);
        if (y < -160 || y > H + 60) continue;
        drawItem(c, kind, x, y, 0.85 + h01(band * 4.3) * 0.5, t);
      }
    }
  }

  /* garagem: um telheiro aberto à beira da estrada, sem ninguém a guardar */
  function drawGarage(c, t) {
    const yLo = cam - G.H, yHi = cam + G.H;
    for (let k = Math.floor(yLo / BLOCK) - 1; k <= Math.ceil(yHi / BLOCK) + 1; k++) {
      if (k < 1 || k % 2 !== 1) continue;
      const gy = k * BLOCK + BLOCK * 0.42;
      const y = scrY(gy);
      if (y < -260 || y > G.H + 260) continue;
      const x = scrX(0.62), w = roadW() * 0.62, h = 210;
      // entrada larga (asfalto a ligar à estrada) com setas a apontar para dentro
      c.fillStyle = 'rgba(90,95,105,.85)';
      c.fillRect(scrX(0.42), y - 240, scrX(0.68) - scrX(0.42), 480);
      c.save();
      c.font = '30px "Segoe UI Emoji", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.globalAlpha = 0.55 + Math.sin(t * 4) * 0.25;
      for (const dy of [-120, 0, 120]) c.fillText('➡️', scrX(0.52), y + dy);
      c.restore();
      // edifício
      c.save(); c.translate(x, y);
      c.fillStyle = 'rgba(0,0,0,.15)'; G.gfx.rr(c, -w / 2 + 6, -h / 2 + 8, w, h, 14); c.fill();
      G.gfx.rr(c, -w / 2, -h / 2, w, h, 14); c.fillStyle = '#e9ecef'; c.fill();
      c.strokeStyle = '#adb5bd'; c.lineWidth = 4; c.stroke();
      // portão aberto virado para a estrada
      G.gfx.rr(c, -w / 2 - 2, -66, 26, 132, 8); c.fillStyle = '#495057'; c.fill();
      c.fillStyle = '#343a40'; G.gfx.rr(c, -w / 2 + 20, -60, 22, 120, 6); c.fill();
      // bandeira de corrida no telhado
      const fx = w / 2 - 34, fy = -h / 2 + 16;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
        c.fillStyle = (i + j) % 2 ? '#fff' : '#2b2d42';
        c.fillRect(fx + i * 9, fy + j * 9, 9, 9);
      }
      // dois carrinhos lá dentro à espera
      c.save(); c.translate(6, -40); c.scale(0.62, 0.62); c.rotate(-Math.PI / 2);
      drawCarShape(c, { kind: 'corrida', col: '#4cc9f0' }, carWpx(), carWpx() * KINDS.corrida.len, t, false);
      c.restore();
      c.save(); c.translate(6, 46); c.scale(0.62, 0.62); c.rotate(-Math.PI / 2);
      drawCarShape(c, { kind: 'corrida', col: '#8ac926' }, carWpx(), carWpx() * KINDS.corrida.len, t, false);
      c.restore();
      c.restore();
      G.gfx.label(c, '🔧 GARAGEM', x, y - h / 2 - 16, 22, '#2b6cb0', 'center');
    }
  }

  /* rampa às riscas na nossa metade da estrada: acelerar em cima dela é VOAR */
  function drawRamp(c, t) {
    const yLo = cam - G.H, yHi = cam + G.H;
    for (let k = Math.floor(yLo / BLOCK) - 1; k <= Math.ceil(yHi / BLOCK) + 1; k++) {
      if (k < 0 || k % 2 !== 0) continue;
      const y = scrY(rampY(k));
      if (y < -220 || y > G.H + 220) continue;
      const xa = scrX(-0.02), xb = scrX(0.5), w = xb - xa, L = 170;
      c.fillStyle = 'rgba(0,0,0,.18)';
      G.gfx.rr(c, xa + 7, y - L / 2 + 9, w, L, 12); c.fill();
      // o tabuleiro fica mais claro à medida que sobe (parece uma subida)
      const g = c.createLinearGradient(0, y + L / 2, 0, y - L / 2);
      g.addColorStop(0, '#98a2ad'); g.addColorStop(1, '#f1f3f5');
      G.gfx.rr(c, xa, y - L / 2, w, L, 12); c.fillStyle = g; c.fill();
      c.save();
      G.gfx.rr(c, xa, y - L / 2, w, L, 12); c.clip();
      for (let i = -3; i * 28 < w + L; i++) {              // riscas alegres na diagonal
        c.fillStyle = i % 2 ? '#ffca3a' : '#2b2d42';
        c.save(); c.translate(xa + i * 28, y - L / 2); c.rotate(0.5);
        c.fillRect(0, 0, 14, L * 2.4);
        c.restore();
      }
      c.restore();
      c.fillStyle = 'rgba(255,255,255,.95)';               // lábio branco no cimo, para o voo
      G.gfx.rr(c, xa, y - L / 2 - 7, w, 11, 5); c.fill();
      c.save();
      c.font = '28px "Segoe UI Emoji", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.globalAlpha = 0.55 + Math.sin(t * 5) * 0.3;
      for (const dx of [0.12, 0.36]) c.fillText('⬆️', scrX(dx), y);
      c.restore();
      // o letreiro fica na berma, onde nenhum carro o tapa
      G.gfx.label(c, '🛼 RAMPA', scrX(0.56), y - L / 2 - 6, 20, '#2b6cb0', 'left');
    }
  }

  /* piscina à beira da estrada: água a mexer, escada, bóia, bola e um patinho */
  function drawPool(c, t) {
    const pr = poolRect();
    const yLo = cam - G.H, yHi = cam + G.H;
    for (let k = Math.floor(yLo / BLOCK) - 1; k <= Math.ceil(yHi / BLOCK) + 1; k++) {
      if (k < 0 || k % 2 !== 0) continue;
      const y = scrY(poolY(k));
      if (y < -POOL_L || y > G.H + POOL_L) continue;
      const x0 = scrX(pr.uIn), x1 = scrX(pr.uOut), w = x1 - x0, h = POOL_L;
      // chão à volta (deck)
      c.fillStyle = '#eef1f4';
      G.gfx.rr(c, x0 - 20, y - h / 2 - 24, w + 40, h + 48, 22); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 3; c.stroke();
      // água
      const g = c.createLinearGradient(x0, y - h / 2, x1, y + h / 2);
      g.addColorStop(0, '#63d3f5'); g.addColorStop(1, '#1c93c8');
      G.gfx.rr(c, x0, y - h / 2, w, h, 18); c.fillStyle = g; c.fill();
      c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 5; c.stroke();
      // ondinhas
      c.save();
      G.gfx.rr(c, x0, y - h / 2, w, h, 18); c.clip();
      c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 3; c.lineCap = 'round';
      for (let i = 0; i < 8; i++) {
        const wy = y - h / 2 + 40 + i * (h - 80) / 7;
        c.beginPath();
        for (let xx = x0 + 10; xx <= x1 - 10; xx += 12) c.lineTo(xx, wy + Math.sin(xx * 0.045 + t * 2.2 + i) * 5);
        c.stroke();
      }
      c.restore();
      // escada do lado da estrada
      c.strokeStyle = '#dee2e6'; c.lineCap = 'round';
      for (const ly of [y - h * 0.28, y + h * 0.28]) {
        c.lineWidth = 5;
        c.beginPath(); c.moveTo(x0 - 12, ly - 15); c.lineTo(x0 + 26, ly - 15);
        c.moveTo(x0 - 12, ly + 15); c.lineTo(x0 + 26, ly + 15); c.stroke();
        c.lineWidth = 3;
        for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x0 - 4 + i * 12, ly - 15); c.lineTo(x0 - 4 + i * 12, ly + 15); c.stroke(); }
      }
      // bóia a boiar
      const bx = x0 + w * 0.62, by = y + h * 0.16 + Math.sin(t * 1.2 + k) * 10;
      c.lineWidth = 10; c.strokeStyle = '#ff595e';
      c.beginPath(); c.arc(bx, by, 20, 0, TAU); c.stroke();
      c.strokeStyle = '#fff'; c.setLineDash([10, 10]); c.stroke(); c.setLineDash([]);
      // bola de praia às cores
      const ax = x0 + w * 0.33, ay = y - h * 0.26 + Math.sin(t * 1.7 + k) * 8;
      ['#ff5d8f', '#ffd166', '#4cc9f0'].forEach(function (col, i) {
        c.fillStyle = col;
        c.beginPath(); c.moveTo(ax, ay);
        c.arc(ax, ay, 13, i * TAU / 3 + t * 0.7, (i + 1) * TAU / 3 + t * 0.7);
        c.closePath(); c.fill();
      });
      // patinho e chapéu de sol no deck
      c.font = '26px "Segoe UI Emoji", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('🦆', x0 + w * 0.5, y + h * 0.36 + Math.sin(t * 1.5) * 6);
      c.font = '34px "Segoe UI Emoji", sans-serif';
      c.fillText('⛱️', x0 - 4, y - h / 2 + 8);
      G.gfx.label(c, '🏊 PISCINA', (x0 + x1) / 2, y - h / 2 - 34, 22, '#2b6cb0', 'center');
    }
  }

  /* máscara e saco de estrelas do ladrão (cai tudo quando é apanhado, e fica a rir) */
  function drawLadrao(c, car, w, h, t) {
    if (!car.ladrao) return;
    const cau = car.apanhado > 0;
    c.fillStyle = '#b08968';                               // saco das estrelas no tejadilho
    c.beginPath(); c.arc(w * 0.27, h * 0.22, w * 0.17, 0, TAU); c.fill();
    c.strokeStyle = '#7f5539'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(w * 0.19, h * 0.13); c.lineTo(w * 0.35, h * 0.13); c.stroke();
    G.gfx.star(c, w * 0.27, h * 0.22, w * 0.09, '#ffd166', cau ? t * 4 : t);
    c.save();
    if (cau) { c.translate(-w * 0.1, h * 0.16); c.rotate(0.7); c.globalAlpha = 0.75; }
    c.fillStyle = '#2b2d42';                               // máscara
    G.gfx.rr(c, -w * 0.26, -h * 0.29, w * 0.52, h * 0.1, 3); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(-w * 0.12, -h * 0.24, w * 0.048, 0, TAU); c.arc(w * 0.12, -h * 0.24, w * 0.048, 0, TAU); c.fill();
    c.restore();
    if (cau) {                                             // cara a rir e coraçãozinho
      c.strokeStyle = '#2b2d42'; c.lineWidth = 2;
      c.beginPath(); c.arc(0, -h * 0.2, w * 0.12, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
      G.gfx.heart(c, w * 0.3, -h * 0.34, w * 0.22, '#ff5d8f');
    }
  }

  /* corpo do carro (nariz para cima). Os de corrida são baixinhos e esguios. */
  function drawCarShape(c, car, w, h, t, driver) {
    const K = KINDS[car.kind];
    const low = !!K.low;
    const bw = low ? w * 0.72 : w;                        // barriga mais estreitinha
    c.fillStyle = 'rgba(0,0,0,.16)';
    G.gfx.rr(c, -bw / 2 + 3, -h / 2 + 5, bw, h, bw * 0.28); c.fill();
    // rodas (nos de corrida ficam de fora, como nos carros a sério)
    c.fillStyle = '#2b2d42';
    const wh = h * (low ? 0.19 : 0.16), ww = w * (low ? 0.2 : 0.16);
    const wx = low ? w * 0.52 : w / 2;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (p) {
      G.gfx.rr(c, p[0] * wx - ww / 2, p[1] * h * 0.31 - wh / 2, ww, wh, 3); c.fill();
    });
    if (low) {
      // nariz em bico + corpo baixinho
      c.beginPath();
      c.moveTo(0, -h / 2);
      c.quadraticCurveTo(bw / 2, -h * 0.3, bw / 2, -h * 0.1);
      c.lineTo(bw / 2, h * 0.36);
      c.quadraticCurveTo(bw / 2, h / 2, bw * 0.34, h / 2);
      c.lineTo(-bw * 0.34, h / 2);
      c.quadraticCurveTo(-bw / 2, h / 2, -bw / 2, h * 0.36);
      c.lineTo(-bw / 2, -h * 0.1);
      c.quadraticCurveTo(-bw / 2, -h * 0.3, 0, -h / 2);
      c.closePath();
      c.fillStyle = car.col; c.fill();
      c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 2.5; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.85)';               // riscas de corrida
      c.fillRect(-bw * 0.09, -h * 0.34, bw * 0.18, h * 0.8);
      c.fillStyle = '#bde0fe';                             // capacete/cockpit pequenino
      c.beginPath(); c.ellipse(0, -h * 0.02, bw * 0.24, h * 0.13, 0, 0, TAU); c.fill();
      c.fillStyle = '#2b2d42';                             // asa traseira
      G.gfx.rr(c, -bw * 0.6, h * 0.4, bw * 1.2, h * 0.09, 4); c.fill();
      c.fillStyle = '#fff9c4';
      c.beginPath(); c.arc(-bw * 0.2, -h * 0.42, 3, 0, TAU); c.arc(bw * 0.2, -h * 0.42, 3, 0, TAU); c.fill();
      c.fillStyle = '#e63946';
      c.beginPath(); c.arc(-bw * 0.24, h * 0.44, 2.8, 0, TAU); c.arc(bw * 0.24, h * 0.44, 2.8, 0, TAU); c.fill();
      if (driver) {
        c.fillStyle = '#ffd9b3'; c.beginPath(); c.arc(0, -h * 0.02, w * 0.09, 0, TAU); c.fill();
        c.fillStyle = '#e63946'; c.beginPath(); c.arc(0, -h * 0.03, w * 0.09, Math.PI, 0); c.fill();
      }
      drawLadrao(c, car, w, h, t);
      return;
    }
    G.gfx.rr(c, -w / 2, -h / 2, w, h, w * 0.28);
    c.fillStyle = car.col; c.fill();
    c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = '#bde0fe';
    G.gfx.rr(c, -w * 0.34, -h * 0.30, w * 0.68, h * 0.17, 5); c.fill();
    G.gfx.rr(c, -w * 0.34, h * 0.14, w * 0.68, h * 0.14, 5); c.fill();
    c.fillStyle = 'rgba(255,255,255,.28)';
    G.gfx.rr(c, -w * 0.36, -h * 0.12, w * 0.72, h * 0.25, 6); c.fill();
    c.fillStyle = '#fff9c4';
    c.beginPath(); c.arc(-w * 0.28, -h / 2 + 3.5, 3.4, 0, TAU); c.arc(w * 0.28, -h / 2 + 3.5, 3.4, 0, TAU); c.fill();
    c.fillStyle = '#e63946';
    c.beginPath(); c.arc(-w * 0.28, h / 2 - 3.5, 3, 0, TAU); c.arc(w * 0.28, h / 2 - 3.5, 3, 0, TAU); c.fill();
    if (car.kind === 'taxi') {
      c.fillStyle = '#2b2d42'; G.gfx.rr(c, -w * 0.16, -h * 0.06, w * 0.32, h * 0.12, 4); c.fill();
      c.fillStyle = '#fff';
      for (let i = 0; i < 3; i++) c.fillRect(-w * 0.13 + i * w * 0.09, -h * 0.03, w * 0.045, h * 0.06);
    } else if (car.kind === 'gelados') {
      c.fillStyle = '#ffc2d1'; c.fillRect(-w / 2 + 3, -h * 0.05, w - 6, h * 0.1);
      c.save(); c.translate(0, -h * 0.02);
      c.fillStyle = '#f5cb5c'; c.beginPath(); c.moveTo(-6, 10); c.lineTo(6, 10); c.lineTo(0, 26); c.closePath(); c.fill();
      c.fillStyle = '#ff8fab'; c.beginPath(); c.arc(0, 6, 7, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 6, 0, TAU); c.fill();
      c.restore();
    } else if (car.kind === 'carrinha') {
      c.fillStyle = 'rgba(255,255,255,.4)'; G.gfx.rr(c, -w * 0.38, -h * 0.05, w * 0.76, h * 0.38, 6); c.fill();
    } else if (car.kind === 'policia') {
      c.fillStyle = '#1971c2';                             // faixa azul
      c.fillRect(-w / 2 + 2, -h * 0.02, w - 4, h * 0.12);
      G.gfx.star(c, 0, h * 0.32, w * 0.12, '#ffd166', 0);  // estrela da polícia
      G.gfx.rr(c, -w * 0.32, -h * 0.19, w * 0.64, h * 0.1, 3); c.fillStyle = '#343a40'; c.fill();
      const on = Math.floor(t * 6) % 2 === 0;              // luzes a piscar
      c.fillStyle = on ? '#ff4d4d' : 'rgba(255,90,90,.28)';
      G.gfx.rr(c, -w * 0.3, -h * 0.183, w * 0.29, h * 0.085, 3); c.fill();
      c.fillStyle = on ? 'rgba(90,150,255,.28)' : '#4d9dff';
      G.gfx.rr(c, w * 0.01, -h * 0.183, w * 0.29, h * 0.085, 3); c.fill();
    }
    if (driver) {
      c.fillStyle = '#ffd9b3'; c.beginPath(); c.arc(0, -h * 0.21, w * 0.11, 0, TAU); c.fill();
      c.fillStyle = car.kind === 'policia' ? '#1971c2' : '#457b9d';
      c.beginPath(); c.arc(0, -h * 0.22, w * 0.11, Math.PI, 0); c.fill();
    }
    drawLadrao(c, car, w, h, t);
  }

  function drawCar(c, car, t) {
    const w = carWpx(), h = carLen(car);
    const x = scrX(car.u), y = scrY(car.y);
    if (y < -h * 2 || y > G.H + h * 2 || x < -w * 3 || x > G.W + w * 3) return;
    const wob = car.wob > 0 ? Math.sin(car.wob * 30) * 0.06 : 0;
    const tilt = car === player && mode === 'drive' ? clamp(player.vu * 1.1, -0.22, 0.22) : 0;
    let ang = 0;
    if (car.state === 'cross') ang = car.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    else if (car.dir < 0 && car.state === 'traffic') ang = Math.PI;
    // altura do salto e balanço de quem está a boiar na piscina
    const alt = (car === player && jump) ? Math.sin(Math.PI * clamp(jump.t / jump.dur, 0, 1)) * jump.h : 0;
    const bob = (car === player && boia > 0) ? Math.sin(t * 3) * 4 : 0;
    if (alt > 1) {                                        // sombra no chão, para se ver a altura
      c.save();
      c.globalAlpha = clamp(0.26 - alt / 900, 0.07, 0.26);
      c.fillStyle = '#000';
      c.beginPath(); c.ellipse(x, y, w * 0.46, h * 0.36, 0, 0, TAU); c.fill();
      c.restore();
    }
    c.save();
    c.translate(x, y - alt + bob);
    c.rotate(ang + wob + tilt);
    if (alt > 0) c.scale(1 + alt / 420, 1 + alt / 420);
    const driver = car.state === 'traffic' || car.state === 'cross' || (car === player && mode === 'drive');
    drawCarShape(c, car, w, h, t, driver);
    if (car === player && mode === 'drive' && KINDS[car.kind].low) {
      c.fillStyle = '#ffd9b3'; c.beginPath(); c.arc(0, -h * 0.02, w * 0.09, 0, TAU); c.fill();
      c.fillStyle = '#e63946'; c.beginPath(); c.arc(0, -h * 0.03, w * 0.09, Math.PI, 0); c.fill();
    }
    if (car.blink > 0 && Math.floor(car.blink * 6) % 2 === 0) {
      c.fillStyle = '#ff9f1c';
      c.beginPath(); c.arc(-w * 0.42, 0, 4.5, 0, TAU); c.arc(w * 0.42, 0, 4.5, 0, TAU); c.fill();
    }
    if (car === player && mode === 'drive' && player.spd < -1) {   // luzes brancas da ré
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(-w * 0.2, h / 2 - 5, 5, 0, TAU); c.arc(w * 0.2, h / 2 - 5, 5, 0, TAU); c.fill();
      c.globalAlpha = 0.35;
      c.beginPath(); c.arc(-w * 0.2, h / 2 - 5, 11, 0, TAU); c.arc(w * 0.2, h / 2 - 5, 11, 0, TAU); c.fill();
      c.globalAlpha = 1;
    }
    c.restore();
    if (car === player && boia > 0) {                     // bóia à volta do carro dentro de água
      c.save();
      c.lineWidth = 12; c.strokeStyle = '#ff595e';
      c.beginPath(); c.ellipse(x, y + bob, w * 0.85, h * 0.6, 0, 0, TAU); c.stroke();
      c.strokeStyle = '#fff'; c.setLineDash([13, 13]); c.stroke(); c.setLineDash([]);
      c.restore();
    }
    if (car === player && mode === 'drive') {
      c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3;
      c.beginPath(); c.ellipse(x, y, w * 0.75, h * 0.62, 0, 0, TAU); c.stroke();
    }
  }

  function drawPed(c, p, t) {
    const x = scrX(p.u), y = scrY(p.y);
    if (y < -50 || y > G.H + 50) return;
    const hop = p.hop > 0 ? Math.sin(p.hop * 9) * 5 : 0;
    c.save(); c.translate(x, y - hop);
    c.fillStyle = 'rgba(0,0,0,.15)';
    c.beginPath(); c.ellipse(2, 4 + hop, 11, 8, 0, 0, TAU); c.fill();
    c.rotate(p.ang);
    const step = Math.sin(p.walk) * 4.5;
    c.fillStyle = '#3d405b';
    c.beginPath(); c.arc(-4.5, -step, 3.2, 0, TAU); c.arc(4.5, step, 3.2, 0, TAU); c.fill();
    c.fillStyle = p.col;
    G.gfx.rr(c, -8, -7.5, 16, 15, 7); c.fill();
    c.fillStyle = '#ffd9b3';
    if (p.waveT > 0) {                                    // bracinho a acenar
      const a = Math.sin(t * 12) * 4;
      c.beginPath(); c.arc(-11, -6 + a, 3.2, 0, TAU); c.fill();
      c.beginPath(); c.arc(10, -step * 0.6, 3, 0, TAU); c.fill();
    } else {
      c.beginPath(); c.arc(-9.5, step * 0.6, 3, 0, TAU); c.arc(9.5, -step * 0.6, 3, 0, TAU); c.fill();
    }
    c.beginPath(); c.arc(0, -2, 6.6, 0, TAU); c.fill();
    c.fillStyle = p.hair;
    c.beginPath(); c.arc(0, -2, 6.6, Math.PI, 0); c.fill();
    c.restore();
  }

  function drawLights(c, t) {
    const yLo = cam - G.H, yHi = cam + G.H;
    const half = crossHalf();
    const CORES = { verde: '#31d843', amarelo: '#ffd166', vermelho: '#ff4d4d' };
    for (let k = Math.floor(yLo / BLOCK); k <= Math.ceil(yHi / BLOCK); k++) {
      const cy = scrY(k * BLOCK);
      if (cy < -220 || cy > G.H + 220) continue;
      const lm = lightMain(k, t), lc = lightCross(k, t);
      // dois para a estrada grande (um por sentido) e dois para a rua transversal
      const posts = [
        { x: scrX(0.56), y: cy + half + 54, luz: lm },
        { x: scrX(-0.56), y: cy - half - 54, luz: lm },
        { x: scrX(-0.56), y: cy + half + 54, luz: lc },
        { x: scrX(0.56), y: cy - half - 54, luz: lc }
      ];
      for (const p of posts) {
        c.save(); c.translate(p.x, p.y);
        c.strokeStyle = 'rgba(60,65,75,.55)'; c.lineWidth = 5; c.lineCap = 'round';
        c.beginPath(); c.moveTo(0, 6); c.lineTo(0, 16); c.stroke();
        G.gfx.rr(c, -9, -30, 18, 40, 6); c.fillStyle = '#343a40'; c.fill();
        c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.stroke();
        const ordem = ['vermelho', 'amarelo', 'verde'];
        for (let i = 0; i < 3; i++) {
          const on = ordem[i] === p.luz;
          c.beginPath(); c.arc(0, -22 + i * 12, 4.6, 0, TAU);
          c.fillStyle = on ? CORES[ordem[i]] : 'rgba(255,255,255,.16)';
          c.fill();
          if (on) {
            c.globalAlpha = 0.35;
            c.beginPath(); c.arc(0, -22 + i * 12, 10, 0, TAU); c.fillStyle = CORES[ordem[i]]; c.fill();
            c.globalAlpha = 1;
          }
        }
        c.restore();
      }
    }
  }

  /* o Isaac a nadar: só a cabecinha, os bracinhos a remar e uma bóia às riscas */
  function drawHeroSwim(c, x, y, t) {
    c.save(); c.translate(x, y + Math.sin(t * 3.4) * 3);
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3;
    c.beginPath(); c.ellipse(0, 6, 26 + Math.sin(t * 4) * 3, 12, 0, 0, TAU); c.stroke();
    c.lineWidth = 9; c.strokeStyle = '#ff595e';
    c.beginPath(); c.arc(0, 0, 15, 0, TAU); c.stroke();
    c.strokeStyle = '#fff'; c.setLineDash([7, 7]); c.stroke(); c.setLineDash([]);
    const a = Math.sin(hero.walk) * 5;
    c.fillStyle = '#ffd9b3';
    c.beginPath(); c.arc(-16, a, 3.6, 0, TAU); c.arc(16, -a, 3.6, 0, TAU); c.fill();
    c.beginPath(); c.arc(0, -4, 8.6, 0, TAU); c.fill();
    c.fillStyle = '#e63946'; c.beginPath(); c.arc(0, -4, 8.6, Math.PI, 0); c.fill();
    c.fillStyle = '#2b2d42';
    c.beginPath(); c.arc(-3, -3, 1.6, 0, TAU); c.arc(3, -3, 1.6, 0, TAU); c.fill();
    c.strokeStyle = '#2b2d42'; c.lineWidth = 1.6;
    c.beginPath(); c.arc(0, -1, 4.5, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    c.restore();
  }

  function drawHero(c, t) {
    const x = scrX(hero.u), y = scrY(hero.y);
    if (hero.swim) { drawHeroSwim(c, x, y, t); return; }
    // a piscina ao lado pisca um convite
    const pk = poolAt(hero.y, 220);
    if (pk !== null) {
      const pr = poolRect();
      c.font = '34px "Segoe UI Emoji", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('🏊', scrX((pr.uIn + pr.uOut) / 2), scrY(poolY(pk)) + Math.sin(t * 4) * 7);
    }
    c.save(); c.translate(x, y); c.rotate(hero.dir);
    c.fillStyle = 'rgba(0,0,0,.16)';
    c.beginPath(); c.ellipse(2, 4, 15, 11, 0, 0, TAU); c.fill();
    const step = Math.sin(hero.walk) * 6;
    c.fillStyle = '#e63946';
    c.beginPath(); c.arc(-6, -step, 4.4, 0, TAU); c.arc(6, step, 4.4, 0, TAU); c.fill();
    c.fillStyle = '#3a86ff';
    G.gfx.rr(c, -11, -10, 22, 20, 9); c.fill();
    c.fillStyle = '#ffd9b3';
    c.beginPath(); c.arc(-13, step * 0.6, 3.6, 0, TAU); c.arc(13, -step * 0.6, 3.6, 0, TAU); c.fill();
    c.beginPath(); c.arc(0, -3, 8.6, 0, TAU); c.fill();
    c.fillStyle = '#e63946';
    c.beginPath(); c.arc(0, -3, 8.6, Math.PI, 0); c.fill();
    G.gfx.rr(c, -4, -14, 8, 6, 3); c.fill();
    c.restore();

    const near = nearestFreeCar();
    if (near) {
      const nx = scrX(near.u), ny = scrY(near.y) - carLen(near) * 0.65 - 14 + Math.sin(t * 5) * 5;
      c.font = '30px "Segoe UI Emoji", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('🚪', nx, ny);
    }
  }

  function drawWheel(c, t) {
    const wc = wheelC(), r = wc.r;
    c.save(); c.translate(wc.x, wc.y);
    c.fillStyle = 'rgba(255,255,255,.30)';
    c.beginPath(); c.arc(0, 0, r * 1.2, 0, TAU); c.fill();
    c.rotate(wheelA);
    c.strokeStyle = '#2b2d42'; c.lineWidth = r * 0.3;
    c.beginPath(); c.arc(0, 0, r * 0.82, 0, TAU); c.stroke();
    c.strokeStyle = '#3a86ff'; c.lineWidth = r * 0.09;
    c.beginPath(); c.arc(0, 0, r * 0.82, 0, TAU); c.stroke();
    c.strokeStyle = '#adb5bd'; c.lineWidth = r * 0.15; c.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + i * TAU / 3;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r * 0.66, Math.sin(a) * r * 0.66); c.stroke();
    }
    c.fillStyle = '#ffca3a';
    c.beginPath(); c.arc(0, -r * 0.82, r * 0.1, 0, TAU); c.fill();
    c.fillStyle = '#ffd166';
    c.beginPath(); c.arc(0, 0, r * 0.3, 0, TAU); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke();
    c.rotate(-wheelA);
    c.font = Math.round(r * 0.32) + 'px "Segoe UI Emoji", sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('📯', 0, 2);
    c.restore();
  }

  function drawHUD(c, t) {
    G.gfx.star(c, 34, 36, 15, '#ffd166', t * 0.6);
    G.gfx.label(c, '' + G.state.stars, 58, 36, 28);
    const m = dist / 10;
    const txt = m < 1000 ? Math.floor(m) + ' m' : (m / 1000).toFixed(1).replace('.', ',') + ' km';
    G.gfx.label(c, '🛣️ ' + txt, 20, 72, 20);
    if (mode === 'drive') {
      const re = player.spd < -1;
      const k = Math.abs(player.spd) / (re ? REV * T().tf : (player.maxOverride || KINDS[player.kind].max) * T().tf);
      G.gfx.rr(c, 20, 92, 150, 16, 8); c.fillStyle = 'rgba(255,255,255,.55)'; c.fill();
      if (k > 0.01) {
        G.gfx.rr(c, 20, 92, Math.max(10, 150 * Math.min(1, k)), 16, 8);
        c.fillStyle = re ? '#ffca3a' : k > 0.85 ? '#ff595e' : '#3a86ff'; c.fill();
      }
      if (re) G.gfx.label(c, '🔙 ré', 182, 100, 20);
      else if (k > 0.85) G.gfx.label(c, '💨', 182, 100, 20);
      if (jump) G.gfx.label(c, '🛼 A VOAR! ↔️', 20, 130, 20);
      else if (combo > 0) G.gfx.label(c, '🛼 x' + (combo + 1), 20, 130, 20);
      // próximo semáforo, grande, no topo
      const st = nextStop(player.y, 1);
      const luz = lightMain(st.k, t);
      if (st.y - player.y < 1400) {
        const cx = G.W - 46, cy = 44;
        G.gfx.rr(c, cx - 20, cy - 34, 40, 74, 12); c.fillStyle = 'rgba(40,44,52,.85)'; c.fill();
        const CORES = { vermelho: '#ff4d4d', amarelo: '#ffd166', verde: '#31d843' };
        ['vermelho', 'amarelo', 'verde'].forEach(function (n, i) {
          c.beginPath(); c.arc(cx, cy - 20 + i * 22, 9, 0, TAU);
          c.fillStyle = n === luz ? CORES[n] : 'rgba(255,255,255,.15)'; c.fill();
        });
      }
    }
  }

  function drawCards(c, t, titulo, itens, pinta) {
    const W = G.W, H = G.H;
    c.fillStyle = 'rgba(30,60,90,.45)'; c.fillRect(0, 0, W, H);
    G.gfx.label(c, titulo, W / 2, H * 0.14, Math.min(34, W * 0.055), '#2b6cb0', 'center');
    const rs = gridRects();
    rs.forEach(function (r, i) { pinta(c, r, itens[i], i, t); });
  }

  function drawPick(c, t) {
    drawCards(c, t, '🛣️ ESCOLHE A ESTRADA!', THEME_KEYS, function (c, r, key, i, t) {
      const th = THEMES[key];
      c.save();
      G.gfx.rr(c, r.x, r.y, r.w, r.h, 22);
      c.fillStyle = th.ground; c.fill();
      c.lineWidth = key === theme && started ? 8 : 5;
      c.strokeStyle = key === theme && started ? '#ffd166' : 'rgba(255,255,255,.9)';
      c.stroke();
      G.gfx.rr(c, r.x, r.y, r.w, r.h, 22); c.clip();
      c.fillStyle = th.road; c.fillRect(r.x + r.w * 0.36, r.y, r.w * 0.28, r.h);
      c.fillStyle = 'rgba(255,240,150,.9)';
      c.fillRect(r.x + r.w / 2 - 1.5, r.y, 3, r.h);
      const old = theme; theme = key;
      drawItem(c, 0, r.x + r.w * 0.16, r.y + r.h * 0.6, 0.75, t);
      drawItem(c, key === 'campo' ? 2 : 1, r.x + r.w * 0.85, r.y + r.h * 0.85, 0.7, t);
      theme = old;
      c.restore();
      c.font = Math.round(r.h * 0.24) + 'px "Segoe UI Emoji", sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(th.emo, r.x + r.w / 2, r.y + r.h * 0.42);
      G.gfx.label(c, th.nome, r.x + r.w / 2, r.y + r.h * 0.78, r.h * 0.16, '#2b6cb0', 'center');
    });
  }

  function drawGaragePick(c, t) {
    drawCards(c, t, '🔧 ESCOLHE O CARRO DE CORRIDA!', GARAGE, function (c, r, g, i, t) {
      c.save();
      G.gfx.rr(c, r.x, r.y, r.w, r.h, 22);
      c.fillStyle = '#e9ecef'; c.fill();
      c.lineWidth = player.col === g.col ? 8 : 5;
      c.strokeStyle = player.col === g.col ? '#ffd166' : 'rgba(255,255,255,.9)';
      c.stroke();
      c.restore();
      c.save();
      c.translate(r.x + r.w / 2, r.y + r.h * 0.46);
      const s = Math.min(r.w / (carWpx() * 2.4), r.h / (carWpx() * KINDS.corrida.len * 1.7));
      c.scale(s, s);
      drawCarShape(c, { kind: 'corrida', col: g.col }, carWpx(), carWpx() * KINDS.corrida.len, t, true);
      c.restore();
      G.gfx.label(c, g.nome, r.x + r.w / 2, r.y + r.h * 0.85, r.h * 0.15, '#2b6cb0', 'center');
    });
  }

  S.draw = function (c, t) {
    const W = G.W, H = G.H;
    drawGround(c, t);
    drawScenery(c, t);
    drawGarage(c, t);
    drawRamp(c, t);
    drawPool(c, t);

    for (const st of stars) {
      const y = scrY(st.y);
      if (y > -30 && y < H + 30) G.gfx.star(c, scrX(st.u), y + Math.sin(t * 3 + st.y) * 4, 15, '#ffd166', t);
    }

    const todos = cars.concat(cross).sort(function (a, b) { return b.y - a.y; });
    for (const car of todos) drawCar(c, car, t);
    for (const p of peds) drawPed(c, p, t);
    if (mode === 'walk') drawHero(c, t);
    drawLights(c, t);

    for (const p of parts) {
      const k = 1 - p.t / p.life;
      c.globalAlpha = k;
      if (p.txt) {
        c.font = p.s + 'px "Segoe UI Emoji", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(p.txt, scrX(p.u), scrY(p.y));
      } else {
        c.fillStyle = p.col;
        c.beginPath(); c.arc(scrX(p.u), scrY(p.y), p.s * k + 1, 0, TAU); c.fill();
      }
      c.globalAlpha = 1;
    }

    if (theme === 'campo' || theme === 'deserto') G.gfx.sun(c, W - 70, 120, 40, t);
    if (theme === 'neve') {
      c.fillStyle = 'rgba(255,255,255,.9)';
      for (const f of flakes) {
        f.y += f.v * 0.016 / H; f.x += Math.sin(t * 1.3 + f.ph) * 0.0006;
        if (f.y > 1) { f.y = -0.02; f.x = Math.random(); }
        c.beginPath(); c.arc(f.x * W, f.y * H, f.s, 0, TAU); c.fill();
      }
    }

    drawHUD(c, t);
    if (mode === 'drive') drawWheel(c, t);
    if (mode === 'pick') drawPick(c, t);
    if (mode === 'garagem') drawGaragePick(c, t);
  };

  // espreitar o estado interno (para testes automáticos)
  S.debug = function (t) {
    const st = nextStop(player.y, 1);
    return {
      mode: mode, theme: theme, started: started,
      spd: Math.round(player.spd), y: Math.round(player.y), u: +player.u.toFixed(3),
      cor: player.col, kind: player.kind,
      wheelA: +wheelA.toFixed(2), dist: Math.round(dist),
      cars: cars.length,
      traffic: cars.filter(function (c) { return c.state === 'traffic'; }).length,
      contramao: cars.filter(function (c) { return c.state === 'traffic' && c.dir < 0; }).length,
      parked: cars.filter(function (c) { return c.state === 'parked'; }).length,
      cross: cross.length, peds: peds.length,
      ladroes: cars.filter(function (c) { return c.ladrao && c.apanhado <= 0; }).length,
      policias: cars.filter(function (c) { return c.kind === 'policia' && c.state === 'traffic'; }).length,
      aApanhar: cars.filter(function (c) { return c.apanhado > 0; }).length,
      apanhados: apanhados,
      policiaParada: cars.filter(function (c) { return c.kind === 'policia' && c.state === 'parked'; }).length,
      estacionados: cars.filter(function (c) { return c.state === 'parked'; })
        .map(function (c) { return { kind: c.kind, u: +c.u.toFixed(3), y: Math.round(c.y) }; }),
      ladroesPos: cars.filter(function (c) { return c.ladrao && c.apanhado <= 0; })
        .map(function (c) { return { u: +c.u.toFixed(3), y: Math.round(c.y), dir: c.dir, visto: +c.visto.toFixed(1) }; }),
      pedsAtravessar: peds.filter(function (p) { return p.state === 'cross'; }).length,
      stars: stars.length, heroY: Math.round(hero.y), heroU: +hero.u.toFixed(3),
      // rampa e piscina
      voando: !!jump, alturaSalto: jump ? Math.round(jump.h) : 0, combo: combo,
      saltos: saltos, banhos: banhos, boia: +boia.toFixed(1), aNadar: !!hero.swim,
      proxRampa: (function () { const k = rampK(player.y + 700); return k === null ? null : Math.round(rampY(k) - player.y); })(),
      proxPiscina: (function () { const k = poolK(player.y + 900); return k === null ? null : Math.round(poolY(k) - player.y); })(),
      naPiscina: naAgua(mode === 'walk' ? hero.u : player.u, mode === 'walk' ? hero.y : player.y),
      poolU: [+poolRect().uIn.toFixed(2), +poolRect().uOut.toFixed(2)],
      proxCruz: st.k, distLinha: Math.round(st.y - player.y),
      luz: t == null ? null : lightMain(st.k, t),
      dodging: cars.filter(function (c2) { return c2.dodge > 0; }).length,
      minCarHero: (function () {
        if (mode !== 'walk') return null;
        let m = 1e9;
        for (const c2 of cars) {
          if (c2.state !== 'traffic') continue;
          if (Math.abs(c2.u - hero.u) * roadW() > carWpx() * 1.2) continue;
          m = Math.min(m, Math.abs(c2.y - hero.y));
        }
        return m === 1e9 ? null : Math.round(m);
      })(),
      preso: +player.stuckT.toFixed(1),
      minCarPed: (function () {          // distância mínima entre pessoa a atravessar e carro EM ANDAMENTO
        let m = 1e9;
        for (const p of peds) {
          if (p.state !== 'cross') continue;
          for (const c2 of cars) {
            if (c2.state !== 'traffic' || c2.spd < 40) continue;
            if (Math.abs(c2.u - p.u) * roadW() > carWpx()) continue;
            m = Math.min(m, Math.abs(c2.y - p.y));
          }
        }
        return m === 1e9 ? null : Math.round(m);
      })()
    };
  };

  G.scenes = G.scenes || {};
  G.scenes.carros = S;
})();
