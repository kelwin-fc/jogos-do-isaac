/* Cena — A CORRIDA DA MARVEL, ditada pelo Isaac (2026-11-19):
     "Um jogo novo: estamos numa corrida da Marvel e quem ganhar vai a uma luta. É uma
      cidade inteira, como a da Marvel verdadeira. Tem todos os personagens, a cama, a
      comida e o cozinheiro. E podemos ver pela janela de uma casa, porque a casa está
      fechada e só dá para entrar pela porta. Mas tem de ser difícil."

   Como ficou:
   - Uma CIDADE INTEIRA vista de lado: casas fechadas (pelas janelas vê-se lá dentro: o
     cozinheiro no fogão, mesas com comida, camas, a sala com a televisão), prédios, o
     restaurante, a Torre dos Vingadores, a prisão e a Casa dos Heróis. Gente a passear.
   - FASE 1, A CORRIDA: escolhe-se o herói no 🦸 e corre-se contra outros quatro heróis
     de uma ponta da cidade até à META, ao pé da Torre. ▶ corre, ⬆ salta e, no ar, ⬆ outra
     vez é o poder de cada um (o Homem de Ferro voa, o Homem-Aranha balança na teia, o
     Thor gira o martelo, a Pantera dá um pulo rápido, a Menina Laser plana nos patins, o
     Capitão e o Hulk dão um salto duplo; o Hulk parte as caixas). ⚡ gasta um TURBO (os
     raios ⚡ apanham-se no caminho). Carros, caixas, cones, barreiras, buracos das obras
     e paragens de autocarro para saltar. Os outros são rápidos: é difícil.
     Se não ficarmos em 1.º: "Quase! Vamos outra vez!" e repete-se (cada vez um bocadinho
     mais fácil). Nunca há derrota.
   - FASE 2, A LUTA (só quem ganha): os vilões atacam a cidade. Damos-lhes com o poder do
     herói (⚡) e quando a energia acaba ficam ALGEMADOS: uns vão para a prisão no carro da
     polícia, outros pedem desculpa e ficam bonzinhos. 💥 é o super poder (enche-se a dar
     nos vilões). Os tiros deles desmontam-nos em peças de Lego (meio coração); sem
     corações vamos DORMIR NA NOSSA CAMA e acordamos "Já descansei! Vamos!".
     Com todos apanhados há festa e troféu, e começa outra corrida, mais difícil.
   - Na luta, à frente de uma porta aparece o 🚪 e entra-se (o mundo fica em pausa): o
     RESTAURANTE (o cozinheiro traz a comida à mesa, comer enche corações), a casa de uma
     família (que nos dá o lanche) e a CASA DOS HERÓIS, com a nossa cama e o botão 😴. */
(function () {
  window.G = window.G || {};
  G.scenes = G.scenes || {};
  const TAU = Math.PI * 2;
  const S = {};

  /* ---------- dificuldade: está tudo aqui para afinar ---------- */
  const DIF = {
    // corrida (px, segundos)
    VEL: 440, ACEL: 1150, TRAVA: 1500, GRAV: 2000, SALTO: 820,
    TURBO_K: 1.5, TURBO_T: 1.5, TURBO_MAX: 3, SETA_K: 1.35, SETA_T: 0.8,
    TONTO: 0.6, RECUO: 260, AJUDA_SUBIR: 40, BURACO_T: 1.0, HULK_PARTE: 0.72,
    OBS_GAP: [440, 760], OBS_GAP_RONDA: 0.05, COMBO: 0.1, COMBO_RONDA: 0.04,
    BOOST_OBS: 0.5, BOOST_CHAO: 0.3, PAD: 0.14,
    // os 4 adversários: velocidade, falhas (por obstáculo), espera para gastar o turbo (s), usa o poder no ar
    IA_VEL: [0.94, 0.965, 0.985, 1.0], IA_FALHA: [0.2, 0.14, 0.1, 0.07], IA_TURBO: [1.6, 1.1, 0.8, 0.5], IA_AR: [0.3, 0.45, 0.6, 0.75],
    ELASTICO_D: 500, ELASTICO_K: 0.05,             // quem vai muito à frente abranda, quem vai muito atrás acelera
    RONDA_IA: 0.012, PERDA_AJUSTE: 0.02, PERDA_MAX: 0.1,   // cada ronda: mais rápidos; cada derrota seguida: mais lentos
    ESPERA_AUTO: 8, CONTA: 0.75, PODIO_T: 4.2, FIM_ESPERA: 7,
    // luta
    MAXC: 5, DANO: 0.5, INV: 0.7, MONTA: 0.9, DORME: 3.2, ANDA_K: 0.82,
    HP: 10, HP_RONDA: 2, HP_GRANDE: 5,
    ATIVOS: 4, ATIVOS_RONDA: 0.5, ATIVOS_MAX: 5,
    TIRO_CD: [0.8, 1.4], TIRO_CD_RONDA: 0.07, TIRO_V: 430, TIRO_MIRA: 0.85,
    VILAO_VEL: 160, DIST: [230, 470], VOO_Y: [-120, -200],
    SUPER_N: 16, SUPER_DANO: 3, AMIGO_CADA: 2, POLICIA_V: 650,
    CD_K: 1.0,
    DANO_PODER: { raio: 1, teia: 1, escudo: 1, trovao: 2, smash: 2, garras: 1.5, laser: 1, paus: 2 }
  };

  /* ---------- a cidade ---------- */
  const CIDADE = 14600, PARTIDA = 700, META = 12500;
  const ARENA0 = 10500, ARENA1 = 14450;
  const TORRE_X = 12990, PRISAO_X = 13570, PODIO_X = 12700;
  const FIG = 1.25, R = 16;
  const GRAV = DIF.GRAV, TETO = -900;
  const CASA_W = 320, ANDAR = 135, REST_W = 460, REST_H = 220, HER_W = 340;

  const EDIF = [
    { tipo: 'familia', x: 1600, cor: '#f4a3a8', telhado: '#c1121f' },
    { tipo: 'predio', x: 2500, cor: '#a3c9f4', alto: 430 },
    { tipo: 'familia', x: 3400, cor: '#ffe08a', telhado: '#e07a1f' },
    { tipo: 'predio', x: 4300, cor: '#b5e6b5', alto: 360 },
    { tipo: 'familia', x: 5200, cor: '#a8dadc', telhado: '#1d7874' },
    { tipo: 'predio', x: 6100, cor: '#ffc38a', alto: 470 },
    { tipo: 'familia', x: 7000, cor: '#c9b6e4', telhado: '#6a4c93' },
    { tipo: 'predio', x: 7900, cor: '#f4a3a8', alto: 400 },
    { tipo: 'familia', x: 8800, cor: '#b5e6b5', telhado: '#2d6a4f' },
    { tipo: 'predio', x: 9700, cor: '#a3c9f4', alto: 380 },
    { tipo: 'rest', x: 11000 },
    { tipo: 'familia', x: 11900, cor: '#ffd6a5', telhado: '#9c6644' },
    { tipo: 'torre', x: TORRE_X },
    { tipo: 'prisao', x: PRISAO_X },
    { tipo: 'herois', x: 14100, cor: '#cfe2ff', telhado: '#1d3557' }
  ];

  // como cada herói corre: velocidade, salto e o poder no ar (⬆ outra vez)
  const MOV = {
    ferro:   { vel: 1.0,  salto: 1.0,  ar: 'voo',     t: 1.0,  vy: -40, k: 1.12 },
    aranha:  { vel: 1.01, salto: 1.04, ar: 'teia',    t: 0.8,  vy: 0,   k: 1.2 },
    capitao: { vel: 1.0,  salto: 1.0,  ar: 'duplo',   vy2: 760 },
    thor:    { vel: 0.99, salto: 1.0,  ar: 'martelo', t: 0.85, vy: -20, k: 1.12 },
    hulk:    { vel: 0.97, salto: 1.12, ar: 'duplo',   vy2: 600, parte: true },
    pantera: { vel: 1.03, salto: 1.02, ar: 'dash',    t: 0.35, vy: -110, k: 1.55 },
    laser:   { vel: 1.01, salto: 1.0,  ar: 'patins',  t: 0.75, vy: 30,  k: 1.1 }
  };
  const MOV_PADRAO = { vel: 1, salto: 1, ar: 'duplo', vy2: 700 };

  // gente da cidade (os mesmos ids que o marvel.js conhece, para virem com os pormenores)
  const COZ = { id: 'cozinheiro', tronco: '#eceff4', bracos: '#eceff4', pernas: '#495057', ancas: '#e63946' };
  const POL = { id: 'policia', tronco: '#1d3557', bracos: '#1d3557', pernas: '#111', ancas: '#111' };
  const CIVIS = [
    { id: 'civil1', tronco: '#4361ee', bracos: '#4361ee', pernas: '#2b2d42', ancas: '#2b2d42' },
    { id: 'civil2', tronco: '#ff6fb1', bracos: '#ff6fb1', pernas: '#8e4585', ancas: '#8e4585' },
    { id: 'civil3', tronco: '#2a9d8f', bracos: '#2a9d8f', pernas: '#495057', ancas: '#495057' },
    { id: 'civil4', tronco: '#ffb703', bracos: '#ffb703', pernas: '#6a4c93', ancas: '#6a4c93' },
    { id: 'civil5', tronco: '#e76f51', bracos: '#e76f51', pernas: '#264653', ancas: '#264653' }
  ];
  const CRIANCA = { id: 'crianca', tronco: '#8ac926', bracos: '#8ac926', pernas: '#1982c4', ancas: '#1982c4', grande: 0.72 };
  const PRATOS = ['hamburguer', 'pizza', 'bolo', 'gelado', 'sopa'];
  const NOME_PRATO = { hamburguer: 'Um hambúrguer!', pizza: 'Pizza!', bolo: 'Uma fatia de bolo!', gelado: 'Um gelado!', sopa: 'Uma sopinha quentinha!' };

  /* ---------- utilidades ---------- */
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function sfx(n) { if (G.audio && G.audio.sfx) G.audio.sfx(n); }
  function fala(txt, fila) { if (G.audio && G.audio.fala) G.audio.fala(txt, fila, 1.05); }
  function banner(txt, ms) { if (G.banner) G.banner(txt, ms); }
  function rr(c, x, y, w, h, r) { G.gfx.rr(c, x, y, w, h, r); }
  function label(c, txt, x, y, s, cor, al, cont) { G.gfx.label(c, txt, x, y, s, cor, al, cont); }
  function sombra(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (k > 0) { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
    else { r *= 1 + k; g *= 1 + k; b *= 1 + k; }
    return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
  }
  function baralha(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function classe(nome, on) { if (typeof document !== 'undefined' && document.body) document.body.classList.toggle(nome, !!on); }
  function botao(id, txt) {
    if (typeof document === 'undefined') return;
    const b = document.getElementById(id);
    if (b && b.textContent !== txt) b.textContent = txt;
  }

  // tudo o que vem do jogo da Marvel em Lego, pedido só quando é preciso
  const HER_FALHA = [
    { id: 'ferro', nome: 'Homem de Ferro', poder: 'raio', cd: 0.3, tronco: '#b5121b', bracos: '#b5121b', pernas: '#b5121b' },
    { id: 'aranha', nome: 'Homem-Aranha', poder: 'teia', cd: 0.38, tronco: '#d62828', bracos: '#d62828', pernas: '#1d4e89' }
  ];
  function MA() { return (G.scenes.marvel && G.scenes.marvel.api) || null; }
  function HEROIS() { const m = MA(); return m && m.herois ? m.herois : HER_FALHA; }
  function VILOES() {
    const m = MA();
    return m && m.viloesDef ? m.viloesDef : [{ id: 'loki', nome: 'Loki', cor: '#52b788', tronco: '#1b5e20', bracos: '#1b5e20', pernas: '#111' }];
  }
  function boneco(c, d, o) {
    const m = MA();
    if (m && m.boneco) { m.boneco(c, d, o); return; }
    const k = d.grande || 1;           // reserva simples, se o marvel.js não estiver carregado
    c.save(); c.scale((o.dir || 1) * k, k);
    c.fillStyle = d.pernas || '#333'; c.fillRect(-10, -27, 20, 27);
    c.fillStyle = d.tronco || '#888'; c.fillRect(-12, -50, 24, 24);
    c.fillStyle = d.pele || '#ffd23f'; c.fillRect(-8, -68, 16, 17);
    c.restore();
  }
  function cabecinha(c, d, x, y, esc, t) {
    if (G.legoCabecinha) { G.legoCabecinha(c, d, x, y, esc, t, {}); return; }
    c.fillStyle = d.pele || '#ffd23f'; c.beginPath(); c.arc(x, y, 9 * esc, 0, TAU); c.fill();
  }

  /* ---------- estado ---------- */
  let fase = 'escolha', faseT = 0, ronda = 1, hi = 0, perdas = 0, piloto = false;
  let corredores = [], classif = [], tempoCorrida = 0, contagem = 0, fimT = -1, posFinal = 0;
  let obst = [], boosts = [], pads = [];
  let viloes = [], fila = [], tiros = [], tirosMaus = [], raios = [], ondas = [], arranhoes = [], policias = [], fx = [];
  let civis = [], torcida = [], casas = [], portas = [];
  let vidas = DIF.MAXC, superN = 0, descansos = 0, descRonda = 0, acertos = 0, neutros = 0, lutaT = 0, flash = 0;
  let agenda = [], relogio = 0;
  let dentro = null, cam = { x: 0, y: 0 };
  let portaVis = false, portaIcone = '', hornIcone = '', ultimaClasse = {};
  let resultados = [], lutas = [], ganhou = false;

  function eu() { return corredores[0]; }
  function defHeroi() { return HEROIS()[hi]; }
  function altura(d) { return 72 * FIG * (d.grande || 1); }
  function depois(seg, fn) { agenda.push({ t: relogio + seg, fn: fn }); }
  function escala() { return Math.min(1, G.H / 620, G.W / 520); }
  function chaoPx() { return Math.min(G.H * 0.84, G.H - 122); }
  function vistaW() { return G.W / escala(); }
  function perto(x) { return Math.abs(x - (cam.x + vistaW() / 2)) < vistaW() * 0.7; }
  function faisca(x, y, cor, n, vel, tijolo) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, TAU), v = rnd(0.3, 1) * (vel || 220);
      fx.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, t: 0, vida: rnd(0.4, 0.8), cor: cor, tam: rnd(4, 8), tijolo: !!tijolo });
    }
  }
  function marca(nome, on) { if (ultimaClasse[nome] !== !!on) { ultimaClasse[nome] = !!on; classe(nome, on); } }

  /* ---------- a cidade: casas com janelas, gente a passear ---------- */
  function criaCidade() {
    casas = []; portas = [];
    let fam = 0;
    EDIF.forEach(function (e, i) {
      const ca = { e: e, tipo: e.tipo, x: e.x, janelas: [], festa: 0 };
      if (e.tipo === 'familia' || e.tipo === 'herois') {
        const W = e.tipo === 'herois' ? HER_W : CASA_W, x0 = e.x - W / 2;
        ca.x0 = x0; ca.w = W;
        const jw = 96, jh = 78, gente = [CIVIS[fam % 5], CIVIS[(fam + 2) % 5], CRIANCA, CIVIS[(fam + 4) % 5]];
        const troca = fam % 2 === 1;
        const tipos = e.tipo === 'herois' ? ['sala', 'mesaHerois', 'nossaCama', 'quarto'] :
          (troca ? ['mesa', 'cozinha', 'sala', 'quarto'] : ['cozinha', 'mesa', 'quarto', 'sala']);
        const parede = ['#fff1d6', '#ffe5ec', '#e9f5db', '#e0f2fe'][fam % 4];
        const pos = [[x0 + 22, -42 - jh], [x0 + W - 22 - jw, -42 - jh], [x0 + 22, -ANDAR - 42 - jh], [x0 + W - 22 - jw, -ANDAR - 42 - jh]];
        pos.forEach(function (p, k) {
          ca.janelas.push({ x: p[0], y: p[1], w: jw, h: jh, tipo: tipos[k], parede: parede, quem: [gente[k % 4], gente[(k + 1) % 4]],
            prato: PRATOS[(fam + k) % PRATOS.length], fase: k * 1.7 + fam });
        });
        if (e.tipo === 'familia') fam++;
        portas.push({ x: e.x, tipo: e.tipo, casa: ca });
      } else if (e.tipo === 'rest') {
        const x0 = e.x - REST_W / 2;
        ca.x0 = x0; ca.w = REST_W;
        ca.janelas.push({ x: x0 + 120, y: -170, w: 150, h: 110, tipo: 'mesa', parede: '#ffe8cc', quem: [CIVIS[1], CIVIS[3]], prato: 'pizza', fase: 0 });
        ca.janelas.push({ x: x0 + 292, y: -170, w: 146, h: 110, tipo: 'cozinha', parede: '#e9f5f9', quem: [COZ], prato: 'sopa', fase: 2 });
        portas.push({ x: x0 + 62, tipo: 'rest', casa: ca });
      }
      casas.push(ca);
    });
    civis = [];
    for (let i = 0; i < 16; i++) {
      const crianca = i % 4 === 3;
      civis.push({ def: crianca ? CRIANCA : CIVIS[i % 5], x: rnd(200, CIDADE - 200), dir: Math.random() < 0.5 ? -1 : 1,
        vel: rnd(40, 75), fase: rnd(0, TAU), para: 0 });
    }
    torcida = [];
    for (let i = 0; i < 7; i++) torcida.push({ def: i === 3 ? CRIANCA : CIVIS[i % 5], x: META - 250 + i * 60 + (i > 3 ? 160 : 0), fase: rnd(0, TAU) });
  }

  function updateCivis(dt) {
    for (const p of civis) {
      if (p.para > 0) { p.para -= dt; continue; }
      p.x += p.dir * p.vel * dt; p.fase += dt * 7;
      if (Math.random() < dt * 0.08) p.para = rnd(0.8, 2.5);
      if (Math.random() < dt * 0.05 || p.x < 120 || p.x > CIDADE - 120) p.dir = p.x < 120 ? 1 : (p.x > CIDADE - 120 ? -1 : -p.dir);
    }
  }

  /* ---------- corredores ---------- */
  function novoCorredor(k, lane) {
    const d = HEROIS()[k];
    return { k: k, def: d, mov: MOV[d.id] || MOV_PADRAO, lane: lane, x: PARTIDA, y: 0, vx: 0, vy: 0, noChao: true,
      plana: null, usouAr: false, turbo: 0, cargas: 0, seta: 0, tonto: 0, buraco: null, fase: rnd(0, TAU), chegou: 0,
      dir: 1, cd: 0, braco: 0, desmonta: null, invul: 0, impulso: 0, garraT: 0, pisao: false, velIA: 1, ia: null, dec: {}, batidas: 0 };
  }

  function montaCorredores() {
    const n = HEROIS().length;
    corredores = [novoCorredor(hi, 0)];
    const outros = [];
    for (let j = 1; j < n; j++) outros.push((hi + j) % n);
    const escolhidos = outros.slice(0, Math.min(4, outros.length));
    escolhidos.forEach(function (k, i) {
      const r = novoCorredor(k, i + 1);
      r.ia = { i: i, espera: rnd(0.3, DIF.IA_TURBO[i]) };
      corredores.push(r);
    });
  }

  function trocaHeroi() {
    hi = (hi + 1) % HEROIS().length;
    montaCorredores();
    const d = defHeroi();
    sfx('suit');
    faisca(eu().x, -50, '#ffd166', 14, 220);
    fala(d.nome + '!');
    banner('🦸 ' + d.nome, 1400);
  }

  /* ---------- a pista: obstáculos, raios de turbo e setas no chão ---------- */
  const TIPOS_OBS = [
    { tipo: 'caixas', p: 24, w: 58, h: 56, quebra: true },
    { tipo: 'caixasAltas', p: 12, w: 58, h: 104, quebra: true },
    { tipo: 'cones', p: 11, w: 70, h: 42, quebra: true },
    { tipo: 'carro', p: 15, w: 160, h: 74 },
    { tipo: 'buraco', p: 18, w: 0, h: 0 },
    { tipo: 'barreira', p: 9, w: 30, h: 112, quebra: true },
    { tipo: 'paragem', p: 11, w: 290, h: 96 }
  ];
  const CORES_CARRO = ['#e63946', '#4361ee', '#2a9d8f', '#ffb703', '#8e4585'];
  function sorteiaTipo() {
    let tot = 0; for (const q of TIPOS_OBS) tot += q.p;
    let r = Math.random() * tot;
    for (const q of TIPOS_OBS) { r -= q.p; if (r <= 0) return q; }
    return TIPOS_OBS[0];
  }
  function geraPista() {
    obst = []; boosts = []; pads = [];
    let x = PARTIDA + 750, id = 0;
    const gk = 1 - Math.min(0.3, DIF.OBS_GAP_RONDA * (ronda - 1));
    const combo = DIF.COMBO + DIF.COMBO_RONDA * (ronda - 1);
    while (x < META - 600) {
      const q = sorteiaTipo();
      const w = q.tipo === 'buraco' ? rnd(150, 215) : q.w;
      const o = { id: id++, tipo: q.tipo, x0: x, x1: x + w, h: q.h, quebra: !!q.quebra, partido: false,
        solido: q.tipo !== 'buraco', cor: CORES_CARRO[id % CORES_CARRO.length] };
      obst.push(o);
      if (q.tipo === 'paragem') {
        boosts.push({ x: x + w * 0.35, y: -q.h - 45, pegos: {} });
        boosts.push({ x: x + w * 0.75, y: -q.h - 45, pegos: {} });
      } else if (Math.random() < DIF.BOOST_OBS) {
        boosts.push({ x: x + w / 2 + 70, y: -200, pegos: {} });
      }
      let gap = rnd(DIF.OBS_GAP[0], DIF.OBS_GAP[1]) * gk;
      if (Math.random() < combo && q.tipo !== 'paragem') gap = rnd(140, 180);   // dois seguidos: é preciso o poder do herói
      if (gap > 300) {
        const mx = x + w + gap * 0.5;
        if (Math.random() < DIF.BOOST_CHAO) boosts.push({ x: mx, y: -40, pegos: {} });
        else if (Math.random() < DIF.PAD) pads.push({ x0: mx - 45, x1: mx + 45 });
      }
      x += w + gap;
    }
  }

  /* ---------- física (a mesma para nós e para os outros) ---------- */
  function topo(r) { return DIF.VEL * r.mov.vel * r.velIA; }
  function buracoEm(x) {
    for (const o of obst) {
      if (o.solido) continue;
      if (x > o.x0 + R * 0.5 && x < o.x1 - R * 0.5) return o;
    }
    return null;
  }
  function aterra(x, y0, y1) {
    let melhor = null;
    for (const o of obst) {
      if (!o.solido || o.partido) continue;
      if (x < o.x0 - R * 0.6 || x > o.x1 + R * 0.6) continue;
      const s = -o.h;
      if (y0 <= s + 1 && y1 >= s && (!melhor || s < melhor.y)) melhor = { y: s, o: o };
    }
    if (melhor) return melhor;
    if (y0 <= 1 && y1 >= 0 && !buracoEm(x)) return { y: 0, o: null };
    return null;
  }
  function suporte(r) {
    if (r.y > -1 && r.y < 1) return buracoEm(r.x) ? null : { y: 0 };
    for (const o of obst) {
      if (!o.solido || o.partido) continue;
      if (Math.abs(-o.h - r.y) < 2 && r.x >= o.x0 - R * 0.6 && r.x <= o.x1 + R * 0.6) return { y: -o.h, o: o };
    }
    return null;
  }
  function bateLado(r, nx) {
    for (const o of obst) {
      if (!o.solido || o.partido) continue;
      if (r.y <= -o.h + 3 || r.y > 2) continue;
      if (nx > r.x && r.x + R <= o.x0 + 1 && nx + R > o.x0) {
        if (r.vy < 0 && r.y < -o.h + DIF.AJUDA_SUBIR) continue;   // a subir e quase lá: deixa passar (cai em cima)
        if (r.mov.parte && o.quebra) {
          o.partido = true; r.vx *= DIF.HULK_PARTE;
          if (perto(o.x0)) { sfx('smash'); faisca(o.x0 + 20, -o.h / 2, o.tipo === 'cones' ? '#f77f00' : '#c08552', 12, 300, true); G.shake = Math.max(G.shake || 0, 0.15); }
          continue;
        }
        nx = o.x0 - R - 0.5; r.vx = -DIF.RECUO; r.tonto = DIF.TONTO; r.batidas++; r.plana = null;
        delete r.dec[o.id];              // da próxima vez decide outra vez (os outros não ficam presos)
        if (S.onBate) S.onBate(r, o);
        if (r === eu()) { sfx('boing'); G.shake = Math.max(G.shake || 0, 0.12); }
        faisca(o.x0, r.y - 40, '#ffd166', 5, 160);
        return nx;
      }
      if (nx < r.x && r.x - R >= o.x1 - 1 && nx - R < o.x1) { nx = o.x1 + R + 0.5; r.vx = 0; return nx; }
    }
    return nx;
  }

  function comecaAr(r) {
    r.usouAr = true;
    const m = r.mov, sou = r === eu();
    if (m.ar === 'duplo') {
      r.vy = -m.vy2;
      if (sou) sfx('hop');
      faisca(r.x, r.y, '#fff', 5, 120);
      return;
    }
    r.plana = { tipo: m.ar, t: 0, dur: m.t, vy: m.vy, k: m.k, ax: r.x + Math.max(140, r.vx * m.t * 0.5), ay: r.y - 270 };
    if (m.ar === 'dash') r.vx = Math.max(r.vx, topo(r) * m.k) * (r.dir || 1);
    if (sou) sfx(m.ar === 'teia' ? 'teia' : (m.ar === 'voo' ? 'repulsor' : (m.ar === 'patins' ? 'zap' : 'whoosh')));
  }

  function fisica(r, dt, ctrl, corrida) {
    r.fase += dt * Math.max(3, Math.abs(r.vx) / 26);
    if (r.turbo > 0) r.turbo -= dt;
    if (r.seta > 0) r.seta -= dt;
    if (r.garraT > 0) r.garraT -= dt;
    if (r.buraco) {
      r.buraco.t += dt;
      if (r.buraco.t >= DIF.BURACO_T) {
        const o = r.buraco.o;
        r.buraco = null; r.x = o.x1 + R + 2; r.y = 0; r.vy = -380; r.noChao = false; r.usouAr = true;
        r.vx = topo(r) * 0.3;
        if (r === eu()) sfx('boing');
      }
      return;
    }
    let cx = ctrl.x || 0;
    if (r.tonto > 0) { r.tonto -= dt; cx = 0; r.vx *= Math.max(0, 1 - dt * 4); }
    if (r.desmonta) cx = 0;
    let k = 1;
    if (r.turbo > 0) k *= DIF.TURBO_K;
    if (r.seta > 0) k *= DIF.SETA_K;
    if (r.plana) k *= r.plana.k;
    if (r.impulso > 0) r.impulso -= dt;
    else if (r.tonto <= 0) {
      const alvo = cx * topo(r) * (corrida ? 1 : DIF.ANDA_K) * k;
      const a = (Math.abs(alvo) > Math.abs(r.vx) && alvo * r.vx >= 0) ? DIF.ACEL : DIF.TRAVA;
      if (r.vx < alvo) r.vx = Math.min(alvo, r.vx + a * dt); else r.vx = Math.max(alvo, r.vx - a * dt);
    }
    if (cx) r.dir = cx > 0 ? 1 : -1;
    if (ctrl.vira) r.dir = ctrl.vira;
    if (ctrl.saltar && !r.desmonta && r.tonto <= 0) {
      if (r.noChao) { r.vy = -DIF.SALTO * r.mov.salto; r.noChao = false; r.usouAr = false; if (r === eu()) sfx('hop'); }
      else if (!r.usouAr) comecaAr(r);
    }
    if (r.plana) {
      const P = r.plana; P.t += dt;
      const p = Math.min(1, P.t / P.dur);
      r.vy = P.tipo === 'teia' ? 300 * Math.cos(Math.PI * p) : P.vy;
      if (P.t >= P.dur) r.plana = null;
    } else if (!r.noChao) r.vy += GRAV * dt;
    let nx = r.x + r.vx * dt;
    if (corrida) nx = bateLado(r, nx);
    else nx = clamp(nx, ARENA0, ARENA1);
    r.x = nx;
    if (r.noChao) {
      const s = suporte(r);
      if (!s) {
        if (r.y > -1 && buracoEm(r.x)) { caiBuraco(r); return; }
        r.noChao = false;
      }
      if (corrida) for (const p of pads) if (r.x > p.x0 && r.x < p.x1 && r.y > -1) { if (r.seta <= 0 && r === eu()) sfx('whoosh'); r.seta = DIF.SETA_T; }
    } else {
      const y0 = r.y, y1 = r.y + r.vy * dt;
      if (r.vy >= 0) {
        const s = aterra(r.x, y0, y1);
        if (s) {
          r.y = s.y; r.vy = 0; r.noChao = true; r.plana = null; r.usouAr = false;
          if (r.pisao) { r.pisao = false; smash(); }
        } else if (y1 >= 0 && buracoEm(r.x)) { caiBuraco(r); return; }
        else r.y = y1;
      } else r.y = Math.max(y1, TETO);
    }
  }
  function caiBuraco(r) {
    const o = buracoEm(r.x);
    r.buraco = { o: o, t: 0 }; r.vx = 0; r.vy = 0; r.y = 0; r.noChao = true; r.plana = null; r.batidas++;
    if (r === eu()) { sfx('ouch'); fala('Ups! Caí no buraco!'); }
  }

  /* ---------- quem conduz: o piloto (perfeito para medir, ou com erros para os outros) ---------- */
  function tempoSubir(r, h) {
    const v0 = DIF.SALTO * r.mov.salto, hh = h + 8, disc = v0 * v0 - 2 * GRAV * hh;
    if (disc <= 0) return 0.45;
    return (v0 - Math.sqrt(disc)) / GRAV;
  }
  function proximoObs(r) {
    for (const q of obst) {
      if (q.partido) continue;
      if (q.x0 < r.x + R - 2) continue;
      if (q.x0 - r.x > 700) return null;
      return q;
    }
    return null;
  }
  function vaiBater(r, v) {          // continuando assim, bate de lado ou cai num buraco? (devolve o obstáculo)
    let tl = 1.5;
    const a = GRAV / 2, b = r.vy, cc = r.y;
    const disc = b * b - 4 * a * cc;
    if (disc >= 0) tl = (-b + Math.sqrt(disc)) / (2 * a);
    for (const q of obst) {
      if (q.partido || q.x1 < r.x) continue;
      const tq = (q.x0 - (r.x + R)) / v;
      if (tq > tl + 0.05) break;
      if (q.solido) {
        if (tq < 0) continue;
        const yq = r.y + r.vy * tq + a * tq * tq;
        if (yq > -q.h + 2 && !(r.mov.parte && q.quebra)) return q;
      } else {
        const xl = r.x + v * tl;
        if (xl > q.x0 + R * 0.4 && xl < q.x1 + R) return q;
      }
    }
    return null;
  }
  function decide(r, o, perfeito) {
    if (perfeito) return { falha: false, erro: 0.01, semAr: false };
    const i = r.ia.i;
    return { falha: Math.random() < DIF.IA_FALHA[i], erro: rnd(-0.04, 0.06), semAr: Math.random() > DIF.IA_AR[i] };
  }
  function pilotoCorrida(r, perfeito) {
    const c = { x: 1, saltar: false, turbo: false };
    if (r.buraco || r.tonto > 0) return c;
    const v = Math.max(240, r.vx);
    const o = proximoObs(r);
    if (o) {
      const dec = r.dec[o.id] || (r.dec[o.id] = decide(r, o, perfeito));
      const d = o.x0 - (r.x + R);
      if (r.noChao) {
        const tj = o.solido ? tempoSubir(r, o.h) : 0.02;
        const hulkPassa = r.mov.parte && o.quebra;
        if (!hulkPassa && !dec.falha && d <= v * (tj + dec.erro) + 4) c.saltar = true;
      } else {
        if (o.solido && d < 46 && r.y > -o.h - 4 && !(r.mov.parte && o.quebra)) c.x = 0;   // colado à parede: primeiro sobe
        if (!r.usouAr) {
          const q = vaiBater(r, v);
          const duplo = r.mov.ar === 'duplo';
          const serve = q && (duplo ? true : (!q.solido || r.y < -q.h - 6));
          if (serve && !dec.semAr && (r.vy > -150 || duplo)) c.saltar = true;
        }
      }
    }
    // no ar e sem nada pela frente: o poder também dá velocidade (o piloto perfeito usa sempre)
    if (!c.saltar && !r.noChao && !r.usouAr && r.vy > 120 && r.mov.ar !== 'duplo' && !vaiBater(r, Math.max(240, r.vx))) {
      if (perfeito || (r.ia && Math.random() < DIF.IA_AR[r.ia.i] * 0.03)) c.saltar = true;
    }
    if (r.cargas > 0 && r.turbo <= 0) {
      if (perfeito) c.turbo = true;
      else if (r.ia) { r.ia.espera -= 1 / 60; if (r.ia.espera <= 0) { c.turbo = true; r.ia.espera = rnd(0.4, DIF.IA_TURBO[r.ia.i] * 1.6); } }
    }
    return c;
  }

  /* ---------- fases ---------- */
  function poeNaPartida() {
    montaCorredores();
    geraPista();
    classif = []; tempoCorrida = 0; fimT = -1; posFinal = 0;
    const cansaco = Math.min(DIF.PERDA_MAX, perdas * DIF.PERDA_AJUSTE);
    corredores.forEach(function (r) {
      r.x = PARTIDA; r.y = 0; r.vx = 0; r.vy = 0; r.noChao = true; r.dir = 1;
      if (r.ia) r.base = DIF.IA_VEL[r.ia.i] * (1 + DIF.RONDA_IA * (ronda - 1)) * (1 - cansaco);
    });
    cam.x = clamp(PARTIDA - vistaW() * 0.3, 0, CIDADE - vistaW()); cam.y = 0;
    tiros = []; tirosMaus = []; raios = []; ondas = []; arranhoes = []; policias = [];
  }
  function vaiEscolher() {
    fase = 'escolha'; faseT = 0;
    poeNaPartida();
    marca('cm-horn-espera', false);
    fala('Corrida da Marvel! Escolhe o teu herói no botão do herói!');
    banner('🦸 Escolhe o herói e carrega no ▶', 2600);
  }
  function comecaContagem() {
    fase = 'contagem'; faseT = 0; contagem = 3;
    sfx('beep'); fala('Três!');
  }
  function arranca() {
    fase = 'corrida'; faseT = 0;
    sfx('whistle'); fala('Já!');
    banner('🏁 JÁ!', 900);
  }

  function updateCorrida(dt) {
    tempoCorrida += dt;
    const me = eu();
    const I = G.input;
    corredores.forEach(function (r, i) {
      let ctrl;
      if (r.chegou) ctrl = { x: 0 };
      else if (i === 0) {
        if (piloto) ctrl = pilotoCorrida(r, true);
        else ctrl = { x: I.axis().x, saltar: I.justPressed('jump'), turbo: I.justPressed('fire') };
      } else {
        // elástico: quem vai muito à frente de nós abranda, quem vai muito atrás acelera
        const d = r.x - me.x;
        let el = 1;
        if (!me.chegou) {
          if (d > DIF.ELASTICO_D) el = 1 - DIF.ELASTICO_K;
          else if (d < -DIF.ELASTICO_D) el = 1 + DIF.ELASTICO_K;
        }
        r.velIA = r.base * el;
        ctrl = pilotoCorrida(r, false);
      }
      if (ctrl.turbo && r.cargas > 0 && r.turbo <= 0.1) {
        r.cargas--; r.turbo = DIF.TURBO_T;
        if (i === 0) { sfx('vroom'); fala('Turbo!'); }
      }
      fisica(r, dt, ctrl, true);
      // apanhar raios de turbo
      for (const b of boosts) {
        if (b.pegos[i]) continue;
        if (Math.abs(b.x - r.x) < 40 && Math.abs(b.y - (r.y - 45)) < 48) {
          b.pegos[i] = true;
          r.cargas = Math.min(DIF.TURBO_MAX, r.cargas + 1);
          if (i === 0) { sfx('star'); faisca(b.x, b.y, '#ffd166', 8, 160); }
        }
      }
      if (!r.chegou && r.x >= META) {
        r.chegou = tempoCorrida;
        classif.push(r);
        if (i === 0) {
          posFinal = classif.length;
          fimT = 0;
          if (posFinal === 1) { sfx('tada'); sfx('multidao'); fala('Ganhei! Sou o primeiro!'); banner('🥇 1.º lugar!', 2200); }
          else { sfx('pop'); fala('Cheguei em ' + posFinal + '.º lugar!'); banner(posFinal + '.º lugar', 2000); }
        } else if (perto(META)) sfx('pop');
      }
    });
    // se nós pararmos de correr, a corrida acaba na mesma
    if (fimT < 0 && classif.length >= corredores.length - 1) {
      me.esperaFim = (me.esperaFim || 0) + dt;
      if (me.esperaFim > DIF.FIM_ESPERA) { posFinal = corredores.length; fimT = 0; }
    }
    if (fimT >= 0) { fimT += dt; if (fimT > 1.4) vaiPodio(); }
  }

  function ordemFinal() {
    const resto = corredores.filter(function (r) { return classif.indexOf(r) < 0; }).sort(function (a, b) { return b.x - a.x; });
    return classif.concat(resto);
  }
  function vaiPodio() {
    fase = 'podio'; faseT = 0;
    ganhou = posFinal === 1;
    const ordem = ordemFinal();
    corredores.forEach(function (r) { r.ordem = ordem.indexOf(r); r.vx = 0; r.turbo = 0; r.plana = null; r.buraco = null; });
    resultados.push({ ronda: ronda, pos: posFinal, tempo: +tempoCorrida.toFixed(1), batidas: eu().batidas });
    if (ganhou) {
      perdas = 0;
      G.addStars && G.addStars(3);
      fala('Ganhei a corrida! Agora vou à luta!', true);
      banner('🏆 Ganhaste! Agora, à LUTA!', 2800);
    } else {
      perdas++;
      fala('Quase! Vamos outra vez!', true);
      banner('💪 Quase! Vamos outra vez!', 2800);
    }
  }

  /* ---------- a luta ---------- */
  function comecaLuta() {
    fase = 'luta'; faseT = 0; lutaT = 0;
    obst = []; boosts = []; pads = [];
    const h = eu();
    h.x = META + 120; h.y = 0; h.vx = 0; h.vy = 0; h.noChao = true; h.turbo = 0; h.seta = 0; h.plana = null;
    h.tonto = 0; h.buraco = null; h.velIA = 1; h.cd = 0; h.invul = 1.5; h.desmonta = null; h.dir = -1;
    vidas = DIF.MAXC; superN = 0; descRonda = 0; neutros = 0; acertos = 0;
    viloes = []; tiros = []; tirosMaus = []; raios = []; ondas = []; arranhoes = []; policias = [];
    fila = baralha(VILOES());
    sfx('sirene');
    fala('Os vilões estão a atacar a cidade! Vamos apanhá-los!', true);
    banner('⚠️ Os vilões atacam a cidade!', 2600);
  }
  function hpVilao(d) { return DIF.HP + DIF.HP_RONDA * (ronda - 1) + ((d.grande || 1) > 1.2 ? DIF.HP_GRANDE : 0); }
  function ativosMax() { return Math.min(DIF.ATIVOS_MAX, Math.floor(DIF.ATIVOS + DIF.ATIVOS_RONDA * (ronda - 1))); }
  function soltaVilao() {
    const d = fila.shift();
    const h = eu(), vw = vistaW();
    let lado = Math.random() < 0.5 ? -1 : 1;
    let x = h.x + lado * (vw / 2 + 120);
    if (x < ARENA0 + 40 || x > ARENA1 - 40) { lado = -lado; x = h.x + lado * (vw / 2 + 120); }
    x = clamp(x, ARENA0 + 40, ARENA1 - 40);
    const hp = hpVilao(d);
    const v = { def: d, x: x, y: d.voa ? -320 : 0, vx: 0, vy: 0, noChao: !d.voa, hp: hp, max: hp, estado: 'livre',
      cd: rnd(1.2, 2.4), fase: rnd(0, TAU), hitT: 0, teia: 0, dir: -lado, atira: 0, t: 0, alvoY: rnd(DIF.VOO_Y[1], DIF.VOO_Y[0]), lado: lado, saltaT: rnd(2, 5) };
    viloes.push(v);
    if (viloes.length === 1) { fala(d.nome + ' está a chegar!'); }
  }
  function livres() { return viloes.filter(function (v) { return v.estado === 'livre'; }); }
  function centroY(v) { return v.y - altura(v.def) * 0.5; }

  function updateLuta(dt) {
    lutaT += dt;
    const h = eu(), I = G.input;
    // soltar vilões
    while (fila.length && livres().length < ativosMax()) soltaVilao();
    // nós
    let ctrl;
    if (piloto) ctrl = pilotoLuta(h);
    else ctrl = { x: I.axis().x, saltar: I.justPressed('jump'), ataca: I.isHeld('fire'), super: I.justPressed('horn') };
    if (h.desmonta) ctrl = { x: 0 };
    fisica(h, dt, ctrl, false);
    if (h.cd > 0) h.cd -= dt;
    if (h.invul > 0) h.invul -= dt;
    if (h.braco > 0) h.braco = Math.max(0, h.braco - dt * 4);
    if (ctrl.ataca) ataca();
    if (ctrl.super) superPoder();
    updateDesmonta(h, dt);
    // portas
    let porta = null;
    if (!h.desmonta && h.noChao && h.y > -5) for (const p of portas) if (Math.abs(h.x - p.x) < 46) porta = p;
    mostraPorta(!!porta, '🚪');
    if (porta && !piloto && (I.justPressed('door') || I.justPressed('down'))) { entraInterior(porta, false); return; }
    updateViloes(dt);
    updateTiros(dt);
    updatePolicias(dt);
    // acabou?
    if (!fila.length && viloes.length && viloes.every(function (v) { return v.estado === 'preso' || v.estado === 'amigo'; })) vaiFesta();
  }

  function pilotoLuta(h) {
    const c = { x: 0, saltar: false, ataca: false, super: false, vira: 0 };
    if (h.desmonta) return c;
    for (const tm of tirosMaus) {        // fugir dos tiros que vêm direitos a nós
      const rx = tm.x - h.x, ry = tm.y - (h.y - 45);
      const vv = tm.vx * tm.vx + tm.vy * tm.vy || 1;
      const tt = -(rx * tm.vx + ry * tm.vy) / vv;
      if (tt < 0 || tt > 0.35) continue;
      if (Math.hypot(rx + tm.vx * tt, ry + tm.vy * tt) < 46) { if (h.noChao || !h.usouAr) c.saltar = true; break; }
    }
    let alvo = null, md = 1e9;
    for (const v of livres()) { const dd = Math.abs(v.x - h.x) + Math.abs(centroY(v) - h.y) * 0.5; if (dd < md) { md = dd; alvo = v; } }
    if (!alvo) {
      const pr = viloes.find(function (v) { return v.estado === 'algemado'; });
      if (pr) c.x = Math.sign(pr.x - h.x) * (Math.abs(pr.x - h.x) > 200 ? 1 : 0);
      return c;
    }
    const p = defHeroi().poder;
    const ideal = { raio: 380, teia: 340, escudo: 320, trovao: 380, smash: 140, garras: 160, laser: 150 }[p] || 300;
    const alcance = { raio: 800, teia: 800, escudo: 620, trovao: 600, smash: 290, garras: 240, laser: 880 }[p] || 600;
    const dx = alvo.x - h.x, adx = Math.abs(dx);
    if (adx > ideal + 50) c.x = Math.sign(dx);
    else if (adx < ideal - 70 && ideal > 200) c.x = -Math.sign(dx);
    c.vira = dx >= 0 ? 1 : -1;
    if (c.x && c.x !== c.vira) c.vira = 0;
    const altoDemais = alvo.def.voa && (p === 'smash' || p === 'garras' || p === 'laser') && centroY(alvo) < h.y - 140;
    if (altoDemais && adx < 220 && h.noChao) c.saltar = true;
    if (adx < alcance && (h.dir === Math.sign(dx) || c.vira)) c.ataca = true;
    if (superN >= DIF.SUPER_N && livres().length >= 2) c.super = true;
    return c;
  }

  function alvoMaisPerto(x, y, dir, alcance, qualquerLado) {
    let melhor = null, md = alcance;
    for (const v of livres()) {
      const dx = v.x - x;
      if (!qualquerLado && dx * dir < -30) continue;
      const d = Math.hypot(dx, (centroY(v) - y) * 0.8);
      if (d < md) { md = d; melhor = v; }
    }
    return melhor;
  }
  function raioZig(x1, y1, x2, y2) {
    const pts = [], n = 7;
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      pts.push([x1 + (x2 - x1) * k + (i && i < n ? rnd(-22, 22) : 0), y1 + (y2 - y1) * k + (i && i < n ? rnd(-14, 14) : 0)]);
    }
    return pts;
  }

  function ataca() {
    const h = eu(), d = defHeroi();
    if (h.cd > 0 || h.desmonta) return;
    const mx = h.x + h.dir * 26 * (d.grande || 1), my = h.y - altura(d) * 0.58;
    const cd = (d.cd || 0.4) * DIF.CD_K, D = DIF.DANO_PODER;
    h.braco = 1;
    if (d.poder === 'raio' || d.poder === 'teia') {
      const alvo = alvoMaisPerto(mx, my, h.dir, 820);
      let vx = h.dir, vy = 0;
      if (alvo) { const ax = alvo.x - mx, ay = centroY(alvo) - my, n = Math.hypot(ax, ay) || 1; vx = ax / n; vy = ay / n; if (vx * h.dir < 0.2) { vx = h.dir; vy = 0; } }
      const v = d.poder === 'raio' ? 980 : 780;
      tiros.push({ tipo: d.poder, x: mx, y: my, vx: vx * v, vy: vy * v, vida: 1.0, dano: D[d.poder] });
      sfx(d.poder === 'raio' ? 'repulsor' : 'teia');
      h.cd = cd;
    } else if (d.poder === 'escudo') {
      if (tiros.some(function (t) { return t.tipo === 'escudo'; })) return;
      const alvo = alvoMaisPerto(mx, my, h.dir, 640);
      let vx = h.dir, vy = 0;
      if (alvo) { const ax = alvo.x - mx, ay = centroY(alvo) - my, n = Math.hypot(ax, ay) || 1; vx = ax / n; vy = ay / n; }
      tiros.push({ tipo: 'escudo', x: mx, y: my, vx: vx * 820, vy: vy * 820, vida: 3, ida: 0.6, t: 0, acertou: [], dano: D.escudo });
      sfx('escudo');
      h.cd = cd;
    } else if (d.poder === 'trovao') {
      const alvo = alvoMaisPerto(h.x, my, h.dir, 620, true);
      const tx = alvo ? alvo.x : h.x + h.dir * 300, ty = alvo ? centroY(alvo) : 0;
      raios.push({ t: 0, seg: raioZig(mx, my - 30, tx, ty), cor: 'trovao' });
      if (alvo) acerta(alvo, h.dir, D.trovao); else faisca(tx, -4, '#bde0fe', 10);
      sfx('trovao'); G.shake = Math.max(G.shake || 0, 0.15);
      h.cd = cd;
    } else if (d.poder === 'smash') {
      if (!h.noChao) { h.vy = 1500; h.pisao = true; h.cd = 0.2; return; }
      smash();
      h.cd = cd;
    } else if (d.poder === 'laser') {
      const pertoV = alvoMaisPerto(h.x, my, h.dir, 200);
      if (pertoV) {
        for (const v of livres()) {
          const dx = (v.x - h.x) * h.dir;
          if (dx > -40 && dx < 210 && Math.abs(centroY(v) - my) < 130 * (v.def.grande || 1)) {
            acerta(v, h.dir, D.paus);
            raios.push({ t: 0, seg: raioZig(mx, my, v.x, centroY(v)), cor: 'eletrico' });
          }
        }
        sfx('zap'); G.shake = Math.max(G.shake || 0, 0.08);
        h.cd = cd + 0.1;
      } else {
        const alvo = alvoMaisPerto(mx, my, h.dir, 900);
        const tx = alvo ? alvo.x : mx + h.dir * 650, ty = alvo ? centroY(alvo) : my;
        raios.push({ t: 0, seg: [[mx, my], [tx, ty]], cor: 'laser' });
        if (alvo) { acerta(alvo, h.dir, D.laser); faisca(tx, ty, '#ff4fa3', 8); }
        sfx('repulsor');
        h.cd = cd;
      }
    } else if (d.poder === 'garras') {
      h.vx = h.dir * 1100; h.impulso = 0.2; h.garraT = 0.3; h.invul = Math.max(h.invul, 0.3);
      sfx('whoosh');
      arranhoes.push({ x: h.x + h.dir * 70, y: my, dir: h.dir, t: 0 });
      for (const v of livres()) {
        const dx = (v.x - h.x) * h.dir;
        if (dx > -30 && dx < 250 && Math.abs(centroY(v) - my) < 120 * (v.def.grande || 1)) {
          acerta(v, h.dir, D.garras);
          arranhoes.push({ x: v.x, y: centroY(v), dir: h.dir, t: 0 });
        }
      }
      h.cd = cd;
    }
  }
  function smash() {
    const h = eu();
    ondas.push({ x: h.x, y: h.y, t: 0 });
    sfx('smash'); G.shake = Math.max(G.shake || 0, 0.4);
    faisca(h.x, h.y - 4, '#c9ada7', 18, 380);
    for (const v of livres()) {
      const dx = v.x - h.x, dy = v.y - h.y;
      if (Math.abs(dx) < 300 && Math.abs(dy) < 300) {
        acerta(v, dx >= 0 ? 1 : -1, DIF.DANO_PODER.smash);
        if (!v.def.voa) { v.vy = -520; v.noChao = false; }
      }
    }
  }
  function superPoder() {
    if (superN < DIF.SUPER_N || fase !== 'luta') return;
    superN = 0;
    flash = 0.6;
    sfx('trovao'); sfx('tada'); G.shake = Math.max(G.shake || 0, 0.5);
    fala('Super poder!');
    const cx = cam.x + vistaW() / 2;
    for (const v of livres()) if (Math.abs(v.x - cx) < vistaW() * 0.6) { acerta(v, v.x > eu().x ? 1 : -1, DIF.SUPER_DANO); faisca(v.x, centroY(v), '#ffd166', 12, 260); }
  }
  function acerta(v, dir, dano) {
    if (v.estado !== 'livre') return;
    v.hp -= dano; v.hitT = 0.25; v.vx += dir * 160;
    superN = Math.min(DIF.SUPER_N, superN + dano);
    sfx('kick');
    faisca(v.x, centroY(v), v.def.cor || '#fff', 5, 160);
    if (defHeroi().poder === 'teia') v.teia = 1.6;
    if (v.hp <= 0) algema(v);
  }
  function algema(v) {
    v.estado = 'algemado'; v.t = 0; v.vx = 0; v.hp = 0; v.teia = 0;
    if (v.def.voa) { v.noChao = false; v.vy = 0; }
    neutros++;
    sfx('algemas');
    G.addStars && G.addStars(1);
    banner('🔒 ' + v.def.nome + ' está algemado!', 1500);
    const amigo = neutros % DIF.AMIGO_CADA === 0;
    depois(1.2, function () {
      if (v.estado !== 'algemado') return;
      if (amigo) {
        v.estado = 'amigo'; v.def = Object.assign({}, v.def, { expr: 'feliz' });
        const n = viloes.filter(function (q) { return q.estado === 'amigo'; }).length;
        v.alvoX = TORRE_X - 260 + n * 70; v.t = 0;
        sfx('giggle');
        fala(v.def.nome + ': Desculpa! Agora sou bonzinho!');
      } else chamaPolicia(v);
    });
  }
  function chamaPolicia(v) {
    policias.push({ x: v.x > PRISAO_X ? CIDADE + 100 : ARENA0 - 200, alvo: v, fase: 'vem', t: 0 });
    sfx('sirene');
  }
  function updatePolicias(dt) {
    for (let i = policias.length - 1; i >= 0; i--) {
      const p = policias[i];
      p.t += dt;
      const destino = p.fase === 'vem' ? p.alvo.x : PRISAO_X;
      const dx = destino - p.x;
      p.dir = dx >= 0 ? 1 : -1;
      p.x += clamp(dx, -DIF.POLICIA_V * dt, DIF.POLICIA_V * dt);
      if (Math.abs(dx) < 4) {
        if (p.fase === 'vem') { p.fase = 'leva'; p.alvo.estado = 'carro'; sfx('door'); }
        else { p.alvo.estado = 'preso'; policias.splice(i, 1); if (perto(PRISAO_X)) sfx('prisao'); }
      }
    }
  }

  function updateViloes(dt) {
    const h = eu();
    const cx = cam.x + vistaW() / 2;
    for (const v of viloes) {
      v.t += dt; v.fase += dt * 8;
      if (v.hitT > 0) v.hitT -= dt;
      if (v.atira > 0) v.atira -= dt;
      if (v.teia > 0) v.teia -= dt;
      const d = v.def;
      if (v.estado === 'carro') { const p = policias.find(function (q) { return q.alvo === v; }); if (p) { v.x = p.x; v.y = 0; } continue; }
      if (v.estado === 'preso') continue;
      if (v.estado === 'algemado' || v.estado === 'amigo') {
        if (!v.noChao) { v.vy += GRAV * 0.5 * dt; v.y += v.vy * dt; if (v.y >= 0) { v.y = 0; v.vy = 0; v.noChao = true; } }
        v.vx *= Math.max(0, 1 - dt * 6);
        if (v.estado === 'amigo' && v.noChao) {
          const dx = v.alvoX - v.x;
          v.vx = Math.abs(dx) > 8 ? Math.sign(dx) * 110 : 0;
          if (v.vx) v.dir = Math.sign(v.vx);
        }
        v.x = clamp(v.x + v.vx * dt, ARENA0, ARENA1);
        continue;
      }
      // livre: ficar a uma distância boa de nós e atirar
      const lento = v.teia > 0 ? 0.3 : 1;
      const dx = h.x - v.x, adx = Math.abs(dx);
      v.dir = dx >= 0 ? 1 : -1;
      let alvoVx = 0;
      if (adx > DIF.DIST[1]) alvoVx = Math.sign(dx);
      else if (adx < DIF.DIST[0]) alvoVx = -Math.sign(dx);
      else alvoVx = Math.sin(v.t * 0.9 + v.fase * 0.1) * 0.4;
      const vel = DIF.VILAO_VEL * (1 + 0.06 * (ronda - 1)) * lento;
      v.vx += (alvoVx * vel - v.vx) * Math.min(1, dt * 3);
      v.x = clamp(v.x + v.vx * dt, ARENA0 + 20, ARENA1 - 20);
      if (d.voa) {
        const ay = v.alvoY + Math.sin(v.t * 1.3 + v.fase * 0.05) * 30;
        v.y += (ay - v.y) * Math.min(1, dt * 2);
      } else {
        v.saltaT -= dt;
        if (v.noChao && v.saltaT <= 0) { v.vy = -rnd(500, 700); v.noChao = false; v.saltaT = rnd(2.5, 5); }
        if (!v.noChao) { v.vy += GRAV * dt; v.y += v.vy * dt; if (v.y >= 0) { v.y = 0; v.vy = 0; v.noChao = true; } }
      }
      // atirar (só quem se vê no ecrã)
      v.cd -= dt;
      if (v.cd <= 0) {
        const visivel = Math.abs(v.x - cx) < vistaW() / 2 + 30;
        if (visivel && adx < 760 && !dentro) {
          const ox = v.x + v.dir * 24, oy = centroY(v) - 6;
          const hx = h.x, hy = h.y - 45;
          const dist = Math.hypot(hx - ox, hy - oy);
          const tt = dist / DIF.TIRO_V;
          const px = hx + h.vx * tt * DIF.TIRO_MIRA, py = hy;
          const n = Math.hypot(px - ox, py - oy) || 1;
          const sp = DIF.TIRO_V * (1 + 0.04 * (ronda - 1));
          tirosMaus.push({ x: ox, y: oy, vx: (px - ox) / n * sp, vy: (py - oy) / n * sp, vida: 3, cor: d.cor || '#e63946', grande: (d.grande || 1) > 1.2 });
          v.atira = 0.3;
          if (perto(v.x)) sfx('pew');
        }
        v.cd = rnd(DIF.TIRO_CD[0], DIF.TIRO_CD[1]) * Math.max(0.55, 1 - DIF.TIRO_CD_RONDA * (ronda - 1));
      }
    }
  }

  function updateTiros(dt) {
    const h = eu(), d = defHeroi();
    for (let i = tiros.length - 1; i >= 0; i--) {
      const tr = tiros[i];
      tr.vida -= dt;
      if (tr.tipo === 'escudo') {
        tr.t += dt;
        if (tr.t > tr.ida) {             // volta à mão do Capitão
          const ax = h.x - tr.x, ay = (h.y - 50) - tr.y, n = Math.hypot(ax, ay) || 1;
          tr.vx = ax / n * 900; tr.vy = ay / n * 900;
          if (n < 30) { tiros.splice(i, 1); continue; }
        }
      }
      tr.x += tr.vx * dt; tr.y += tr.vy * dt;
      let fora = tr.vida <= 0;
      for (const v of livres()) {
        if (tr.acertou && tr.acertou.indexOf(v) >= 0) continue;
        const r = 34 * (v.def.grande || 1);
        if (Math.abs(v.x - tr.x) < r && Math.abs(centroY(v) - tr.y) < r * 1.3) {
          acerta(v, tr.vx >= 0 ? 1 : -1, tr.dano);
          if (tr.acertou) tr.acertou.push(v); else { fora = true; break; }
        }
      }
      if (fora) tiros.splice(i, 1);
    }
    // os tiros deles
    const escudoNaMao = d.poder === 'escudo' && !tiros.some(function (t) { return t.tipo === 'escudo'; });
    for (let i = tirosMaus.length - 1; i >= 0; i--) {
      const tm = tirosMaus[i];
      tm.vida -= dt;
      tm.x += tm.vx * dt; tm.y += tm.vy * dt;
      if (tm.vida <= 0 || tm.y > 10) { tirosMaus.splice(i, 1); continue; }
      const hy = h.y - 45 * (d.grande || 1), raio = 24 * (d.grande || 1) + (tm.grande ? 8 : 0);
      if (Math.abs(tm.x - h.x) < raio && Math.abs(tm.y - hy) < raio * 1.6) {
        if (h.desmonta || h.invul > 0) continue;
        if (escudoNaMao && Math.sign(tm.x - h.x) === h.dir && h.braco < 0.3) {   // o escudo do Capitão defende
          tirosMaus.splice(i, 1); sfx('escudo'); faisca(tm.x, tm.y, '#fff', 6, 140); continue;
        }
        tirosMaus.splice(i, 1);
        levaTiro(h);
      }
    }
    for (let i = raios.length - 1; i >= 0; i--) { raios[i].t += dt; if (raios[i].t > 0.28) raios.splice(i, 1); }
    for (let i = ondas.length - 1; i >= 0; i--) { ondas[i].t += dt; if (ondas[i].t > 0.5) ondas.splice(i, 1); }
    for (let i = arranhoes.length - 1; i >= 0; i--) { arranhoes[i].t += dt; if (arranhoes[i].t > 0.4) arranhoes.splice(i, 1); }
  }

  function levaTiro(h) {
    vidas = Math.max(0, vidas - DIF.DANO); acertos++;
    const partes = {};
    for (const n of ['cabeca', 'tronco', 'pernas', 'bracoF', 'bracoT']) {
      partes[n] = { dx: 0, dy: 0, r: 0, vx: rnd(-90, 90), vy: rnd(-160, -60) - (n === 'cabeca' ? 60 : 0), vr: rnd(-7, 7) };
    }
    h.desmonta = { t: 0, partes: partes };
    h.vx = 0; h.plana = null; h.impulso = 0; h.invul = DIF.INV + DIF.MONTA + 0.5;
    sfx('desmonta');
    if (vidas <= 0) depois(DIF.MONTA + 0.6, semCoracoes);
  }
  function updateDesmonta(h, dt) {
    const D = h.desmonta;
    if (!D) return;
    D.t += dt;
    for (const n in D.partes) {
      const p = D.partes[n];
      if (D.t < 0.5) { p.vy += 600 * dt; p.dx += p.vx * dt; p.dy = Math.min(p.dy + p.vy * dt, 40); p.r += p.vr * dt; }
      else { const k = Math.min(1, dt * 7); p.dx -= p.dx * k; p.dy -= p.dy * k; p.r -= p.r * k; }
    }
    if (D.t > 0.5 + DIF.MONTA) { h.desmonta = null; sfx('monta'); }
  }
  function semCoracoes() {
    if (dentro || fase !== 'luta') return;
    descansos++; descRonda++;
    const casa = portas.find(function (p) { return p.tipo === 'herois'; });
    fala('Sem corações! Vou dormir um bocadinho na minha cama!');
    entraInterior(casa, true);
  }

  function vaiFesta() {
    fase = 'festa'; faseT = 0;
    lutas.push({ ronda: ronda, descansos: descRonda, tempo: +lutaT.toFixed(1), acertos: acertos });
    sfx('tada'); sfx('multidao');
    G.addStars && G.addStars(5);
    fala('A cidade está salva! Somos os maiores!', true);
    banner('🏆 A cidade está salva!', 3000);
    marca('cm-horn-espera', true);
  }

  /* ---------- lá dentro: restaurante, casa de família e a nossa casa ---------- */
  function entraInterior(porta, dormir) {
    const h = eu();
    h.vx = 0; h.vy = 0; h.plana = null; h.desmonta = null;
    const tipo = porta.tipo;
    const her = HEROIS();
    const outrosHerois = her.filter(function (d, k) { return k !== hi; });
    const mesas = [];
    const nm = tipo === 'rest' ? 8 : 2;
    for (let i = 0; i < nm; i++) {
      const lug = [null, null], com = [null, null];
      for (let j = 0; j < 2; j++) {
        let def = null;
        if (tipo === 'rest') { if (Math.random() < 0.3) continue; def = Math.random() < 0.25 ? outrosHerois[Math.floor(Math.random() * outrosHerois.length)] : (Math.random() < 0.2 ? CRIANCA : CIVIS[Math.floor(Math.random() * 5)]); }
        else if (tipo === 'familia') def = j ? CRIANCA : CIVIS[(i * 2 + 1) % 5];
        else def = outrosHerois[(i * 2 + j) % outrosHerois.length];
        lug[j] = { def: def, fase: rnd(0, TAU) };
        com[j] = PRATOS[Math.floor(Math.random() * PRATOS.length)];
      }
      mesas.push({ lug: lug, com: com });
    }
    // à nossa mesa senta-se um vilão que agora é amigo (ou um que já está preso, de visita)
    const amigos = viloes.filter(function (v) { return v.estado === 'amigo' || v.estado === 'preso'; });
    let amigo = null;
    if (amigos.length && tipo !== 'familia') {
      const vd = amigos[Math.floor(Math.random() * amigos.length)].def;
      amigo = { def: Object.assign({}, vd, { expr: 'feliz' }), com: PRATOS[Math.floor(Math.random() * PRATOS.length)], fase: rnd(0, TAU) };
    }
    dentro = { porta: porta, tipo: tipo, t: 0, fase: dormir ? 'cama' : 'entra', mesas: mesas, amigo: amigo,
      chef: { fase: 'fogao', t: 0 }, prato: null, come: null, espera: 0.6, n: 0, prox: Math.floor(Math.random() * PRATOS.length),
      dorme: dormir ? { t: 0 } : null };
    marca('cm-dentro', true);
    if (dormir) { sfx('poof'); banner('😴 A dormir na nossa cama…', 2400); return; }
    sfx('door');
    if (tipo === 'rest') { fala('Vamos comer!'); fala('Olá! Senta-te à mesa, que eu já te trago comida!', true); }
    else if (tipo === 'familia') { fala('Olá, herói! Entra! Queres lanchar connosco?'); }
    else { fala('A nossa casa! Aqui está a minha cama.'); }
  }
  function saiInterior(calado) {
    if (!dentro) return;
    const p = dentro.porta, dormiu = !!dentro.dorme;
    dentro = null;
    marca('cm-dentro', false);
    const h = eu();
    h.x = p.x; h.y = 0; h.vx = 0; h.vy = 0; h.noChao = true; h.dir = 1; h.invul = Math.max(h.invul, 1.8);
    tirosMaus = [];
    if (!calado) { sfx('door'); if (!dormiu) fala(p.tipo === 'herois' ? 'Vamos lutar!' : 'Obrigado! Até logo!'); }
  }
  function comeuUm() {
    if (vidas >= DIF.MAXC) { G.addStars && G.addStars(1); sfx('star'); banner('⭐ Nham nham!', 1400); }
    else { vidas = Math.min(DIF.MAXC, vidas + 1); sfx('heart'); banner('❤️ Nham nham!', 1400); }
  }

  function salaL() {
    const D = dentro, W = G.W, H = G.H, deitado = W > H;
    const topo = 60, kh = clamp(H * 0.27, 100, 200), chaoY = topo + kh;
    const fx0 = 16, fx1 = W - 16, fy0 = chaoY + 6, fy1 = H - 12;
    const ks = clamp(kh / 125, 0.75, 1.6);
    const pw = 54 * ks, ph = Math.min(kh - 14, 100 * ks);
    const kx0 = deitado ? W * 0.5 : W * 0.4, kx1 = W - 10;
    let mesas = [], k = 1, cama = null, heroiMesa = 0;
    if (D.tipo === 'rest') {
      const cols = deitado ? 4 : 2, rows = deitado ? 2 : 4;
      const cw = (fx1 - fx0) / cols, chh = (fy1 - fy0) / rows;
      k = Math.min(cw / 165, chh / 92, 1.6);
      for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) mesas.push({ x: fx0 + (q + 0.5) * cw, y: fy0 + (r + 1) * chh - 4 });
      heroiMesa = cols + (deitado ? 1 : 0);
    } else {
      k = clamp(Math.min(W, H) / 430, 0.75, 1.5);
      if (deitado) {
        cama = { x: fx0 + (fx1 - fx0) * 0.24, y: fy0 + (fy1 - fy0) * 0.62, k: k };
        const my = fy0 + Math.min((fy1 - fy0) * 0.55, 120 * k);
        mesas = [{ x: fx0 + (fx1 - fx0) * 0.57, y: my }, { x: fx0 + (fx1 - fx0) * 0.84, y: my }];
      } else {
        cama = { x: W * 0.5, y: fy0 + (fy1 - fy0) * 0.32, k: k };
        const my = fy0 + (fy1 - fy0) * 0.62;
        mesas = [{ x: W * 0.3, y: my }, { x: W * 0.74, y: my }];
      }
    }
    return { W: W, H: H, kh: kh, chaoY: chaoY, mesas: mesas, k: k, ks: ks, kx0: kx0, kx1: kx1, heroiMesa: heroiMesa, cama: cama,
      porta: { x: 22 + pw / 2, w: pw, h: ph }, fogao: { x: kx0 + (kx1 - kx0) * 0.5 } };
  }
  function pratoXY(L) { const m = L.mesas[L.heroiMesa]; return { x: m.x - 34 * L.k, y: m.y - 40 * L.k, r: 44 * L.k + 10 }; }

  function updateDentro(dt) {
    const I = G.input, D = dentro, L = salaL();
    D.t += dt;
    const casa = D.tipo === 'herois';
    if (D.dorme) mostraPorta(false, '😴'); else mostraPorta(true, casa ? '😴' : '🚪');
    if (D.dorme) {
      D.dorme.t += dt;
      if (!D.dorme.cheio && D.dorme.t >= DIF.DORME) {
        D.dorme.cheio = true; vidas = DIF.MAXC;
        sfx('tada'); fala('Já descansei! Vamos!'); banner('❤️ Já descansei! Vamos!', 2000);
      }
      if (D.dorme.cheio && D.dorme.t >= DIF.DORME + 1.4) saiInterior();
      if (I.tap) I.tap = null;
      return;
    }
    let sai = I.justPressed('down') || (!casa && I.justPressed('door'));
    let dorme = casa && I.justPressed('door');
    let come = I.justPressed('fire');
    if (I.tap) {
      const p = I.tap, P = L.porta, pr = pratoXY(L);
      I.tap = null;
      if (Math.abs(p.x - P.x) < P.w / 2 + 14 && p.y > L.chaoY - P.h - 14 && p.y < L.chaoY + 14) sai = true;
      else if (D.prato && Math.hypot(p.x - pr.x, p.y - pr.y) < pr.r) come = true;
      else if (casa && L.cama && Math.abs(p.x - L.cama.x) < 150 * L.k && Math.abs(p.y - (L.cama.y - 30 * L.k)) < 70 * L.k) dorme = true;
    }
    if (piloto) sai = true;
    if (sai) { saiInterior(); return; }
    if (dorme) {
      D.dorme = { t: 0 }; D.prato = null; D.come = null; D.chef.fase = 'fogao';
      sfx('whee'); fala('Vou dormir um bocadinho na minha cama!'); banner('😴 A dormir…', 2000);
      return;
    }
    if (D.fase === 'entra' && D.t > 1.1) { D.fase = 'sentado'; sfx('hop'); }
    const ch = D.chef;
    if (ch.fase === 'fogao') {
      if (D.fase === 'sentado' && !D.prato) {
        D.espera -= dt;
        if (D.espera <= 0) { ch.fase = 'vai'; ch.t = 0; ch.tipo = PRATOS[D.prox % PRATOS.length]; D.prox++; }
      }
    } else if (ch.fase === 'vai') {
      ch.t += dt / 1.4;
      if (ch.t >= 1) { ch.fase = 'pousa'; ch.t = 0; D.prato = { tipo: ch.tipo, t: 0 }; sfx('pop'); fala(NOME_PRATO[ch.tipo] + ' Bom apetite!'); }
    } else if (ch.fase === 'pousa') {
      ch.t += dt; if (ch.t > 0.6) { ch.fase = 'volta'; ch.t = 0; }
    } else if (ch.fase === 'volta') {
      ch.t += dt / 1.2; if (ch.t >= 1) { ch.fase = 'fogao'; ch.t = 0; }
    }
    if (D.prato) D.prato.t += dt;
    if (come && D.prato && !D.come && D.fase === 'sentado') { D.come = { t: 0 }; sfx('nham'); }
    if (D.come) {
      D.come.t += dt;
      if (D.come.t >= 1) { comeuUm(); D.prato = null; D.come = null; D.n++; D.espera = 0.7; }
    }
  }

  /* ---------- o botão da porta e o do herói ---------- */
  function mostraPorta(ver, icone) {
    marca('cm-porta', ver);
    if (icone !== portaIcone) { portaIcone = icone; botao('btnDoor', icone); }
    portaVis = ver;
  }
  function poeHorn(icone, espera) {
    if (icone !== hornIcone) { hornIcone = icone; botao('btnHorn', icone); }
    marca('cm-horn-espera', espera);
  }

  /* =====================================================================
     CICLO
     ===================================================================== */
  S.enter = function () {
    ['cm-porta', 'cm-dentro', 'cm-horn-espera', 'cm-turbo-vazio'].forEach(function (n) { classe(n, false); });
    ultimaClasse = {}; portaIcone = ''; hornIcone = '';
    ronda = 1; perdas = 0; descansos = 0; resultados = []; lutas = []; agenda = []; relogio = 0;
    dentro = null; vidas = DIF.MAXC; superN = 0; fx = []; viloes = []; fila = [];
    if (hi >= HEROIS().length) hi = 0;
    criaCidade();
    mostraPorta(false, '🚪');
    poeHorn('🦸', false);
    botao('btnFire', '⚡');
    vaiEscolher();
  };

  S.update = function (dt) {
    if (!corredores.length) S.enter();
    const I = G.input;
    if (dentro) { updateDentro(dt); return; }   // lá dentro o mundo fica em pausa
    relogio += dt; faseT += dt;
    for (let i = agenda.length - 1; i >= 0; i--) if (relogio >= agenda[i].t) { const a = agenda[i]; agenda.splice(i, 1); a.fn(); }
    if (flash > 0) flash -= dt;
    updateCivis(dt);
    for (const ca of casas) if (ca.festa > 0) ca.festa -= dt;
    if (fase === 'escolha') {
      poeHorn('🦸', false); mostraPorta(false, portaIcone || '🚪'); marca('cm-turbo-vazio', true);
      if (I.justPressed('horn')) trocaHeroi();
      if (piloto || I.justPressed('right') || I.justPressed('jump') || I.justPressed('fire') || faseT > DIF.ESPERA_AUTO) comecaContagem();
      corredores.forEach(function (r) { r.fase += dt * 2; });
    } else if (fase === 'contagem') {
      poeHorn('🦸', true);
      const n = 3 - Math.floor(faseT / DIF.CONTA);
      if (n !== contagem && n > 0) { contagem = n; sfx('beep'); fala(n === 2 ? 'Dois!' : 'Um!'); }
      if (faseT >= DIF.CONTA * 3) arranca();
    } else if (fase === 'corrida') {
      poeHorn('🦸', true);
      marca('cm-turbo-vazio', eu().cargas <= 0);
      updateCorrida(dt);
    } else if (fase === 'podio') {
      poeHorn('🦸', true); marca('cm-turbo-vazio', true);
      if (faseT > DIF.PODIO_T) {
        if (ganhou) comecaLuta();
        else { vaiEscolher(); fase = 'escolha'; faseT = DIF.ESPERA_AUTO - 2.5; }
      }
    } else if (fase === 'luta') {
      poeHorn('💥', superN < DIF.SUPER_N); marca('cm-turbo-vazio', false);
      updateLuta(dt);
    } else if (fase === 'festa') {
      mostraPorta(false, portaIcone);
      if (Math.random() < dt * 8) faisca(cam.x + rnd(0, vistaW()), rnd(-500, -200), ['#ffd166', '#ff5d8f', '#4cc9f0', '#8ac926'][Math.floor(rnd(0, 4))], 10, 260);
      if (faseT > 5.5) { ronda++; vaiEscolher(); }
    }
    // as faíscas
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i]; f.t += dt;
      if (f.t > f.vida) { fx.splice(i, 1); continue; }
      f.vy += 700 * dt; f.x += f.vx * dt; f.y += f.vy * dt;
    }
    camera(dt);
  };

  function camera(dt) {
    const h = eu(), vw = vistaW(), sc = escala();
    let tx;
    if (fase === 'podio') tx = PODIO_X - vw * 0.5;
    else if (fase === 'luta' || fase === 'festa') tx = h.x - vw * 0.5;
    else tx = h.x - vw * 0.3;
    if (fase === 'luta' || fase === 'festa') tx = clamp(tx, ARENA0 - 200, ARENA1 + 150 - vw);
    tx = clamp(tx, 0, CIDADE - vw);
    const k = fase === 'corrida' ? Math.min(1, dt * 12) : Math.min(1, dt * 5);
    cam.x += (tx - cam.x) * k;
    const cp = chaoPx();
    const ty = Math.min(0, (h.y - 60) + (cp - 150) / sc);
    cam.y += (ty - cam.y) * Math.min(1, dt * 4);
  }

  /* =====================================================================
     DESENHO
     ===================================================================== */
  function comida(c, tipo, x, y, k) {
    c.save(); c.translate(x, y); c.scale(k, k);
    c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(0, 20, 30, 8, 0, 0, TAU); c.fill();
    if (tipo === 'hamburguer') {
      c.fillStyle = '#e0a526'; c.beginPath(); c.arc(0, -4, 25, Math.PI, 0); c.fill();
      c.fillStyle = '#6ab04c'; rr(c, -26, -5, 52, 7, 3); c.fill();
      c.fillStyle = '#8b5a2b'; rr(c, -24, 1, 48, 10, 3); c.fill();
      c.fillStyle = '#e0a526'; rr(c, -25, 11, 50, 9, 4); c.fill();
    } else if (tipo === 'pizza') {
      c.fillStyle = '#d98e32'; c.beginPath(); c.ellipse(0, 12, 29, 10, 0, 0, TAU); c.fill();
      c.fillStyle = '#e63946'; c.beginPath(); c.ellipse(0, 11, 24, 7.5, 0, 0, TAU); c.fill();
      c.fillStyle = '#ffd166';
      for (const q of [[-12, 10], [4, 7], [14, 12]]) { c.beginPath(); c.ellipse(q[0], q[1], 6, 2.6, 0, 0, TAU); c.fill(); }
    } else if (tipo === 'bolo') {
      c.fillStyle = '#fff1e6'; rr(c, -20, -12, 40, 30, 4); c.fill();
      c.fillStyle = '#ffafcc'; c.fillRect(-20, 1, 40, 5);
      c.fillStyle = '#ff6fb1'; rr(c, -22, -20, 44, 11, 5); c.fill();
      c.fillStyle = '#d00000'; c.beginPath(); c.arc(0, -24, 5.5, 0, TAU); c.fill();
    } else if (tipo === 'sopa') {
      c.fillStyle = '#4cc9f0';
      c.beginPath(); c.moveTo(-26, 2); c.quadraticCurveTo(-24, 22, 0, 22); c.quadraticCurveTo(24, 22, 26, 2); c.closePath(); c.fill();
      c.fillStyle = '#f4a261'; c.beginPath(); c.ellipse(0, 2, 26, 6, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2.6; c.lineCap = 'round';
      for (const sx of [-9, 0, 9]) { c.beginPath(); c.moveTo(sx, -4); c.quadraticCurveTo(sx - 5, -12, sx, -18); c.quadraticCurveTo(sx + 5, -24, sx, -30); c.stroke(); }
    } else {
      c.fillStyle = '#e8b56b'; c.beginPath(); c.moveTo(-12, 2); c.lineTo(12, 2); c.lineTo(0, 26); c.closePath(); c.fill();
      c.fillStyle = '#ff9ec7'; c.beginPath(); c.arc(-6, -6, 12, 0, TAU); c.fill();
      c.fillStyle = '#fff6e5'; c.beginPath(); c.arc(7, -9, 11, 0, TAU); c.fill();
      c.fillStyle = '#ff4d6d'; c.beginPath(); c.arc(2, -22, 4.5, 0, TAU); c.fill();
    }
    c.restore();
  }

  function cama(c, x, y, k, cor, nossa) {   // pés da cama em (x,y), virada para a direita
    c.save(); c.translate(x, y); c.scale(k, k);
    c.fillStyle = cor; rr(c, -76, -76, 16, 76, 5); c.fill();
    c.fillStyle = sombra(cor, -0.2); rr(c, -80, -82, 24, 12, 5); c.fill();
    if (nossa) G.gfx.star(c, -68, -56, 7, '#ffd166', 0);
    c.fillStyle = cor; rr(c, 60, -46, 14, 46, 5); c.fill();
    c.fillStyle = '#9c6644'; rr(c, -62, -16, 124, 10, 3); c.fill();
    c.fillRect(-58, -8, 7, 8); c.fillRect(51, -8, 7, 8);
    c.fillStyle = '#f8f9fa'; rr(c, -62, -30, 124, 16, 5); c.fill();
    c.fillStyle = '#fff'; rr(c, -58, -42, 36, 16, 7); c.fill();
    c.restore();
  }
  function cobertor(c, x, y, k, cor) {
    c.save(); c.translate(x, y); c.scale(k, k);
    c.fillStyle = cor; rr(c, -24, -34, 86, 24, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-24, -30, 86, 4);
    G.gfx.star(c, 22, -22, 7, '#ffd166', 0);
    c.restore();
  }
  function dorminhoco(c, d, x, y, k, t) {     // alguém deitado na cama (x,y = pés da cama)
    c.save(); c.translate(x - 34 * k, y - 37 * k); c.rotate(-Math.PI / 2); c.scale(k * 0.85, k * 0.85);
    boneco(c, d, { t: t, dir: 1, fase: 0, anda: false, braco: 0 });
    c.restore();
  }
  function zzz(c, x, y, s, t) {
    for (let k = 0; k < 3; k++) {
      const a = (t * 1.4 + k * 0.6) % 2;
      c.globalAlpha = Math.max(0, 1 - a / 2);
      label(c, 'z', x + a * 20 * s, y - a * 34 * s, (16 + k * 5) * s, '#4361ee', 'center');
    }
    c.globalAlpha = 1;
  }

  // o que se vê pela janela: um bocadinho da casa por dentro
  function janela(c, j, t) {
    const x = j.x, y = j.y, w = j.w, h = j.h, pe = y + h - 6, s = FIG * 0.62 * (h / 78);
    c.fillStyle = '#f8f9fa'; rr(c, x - 7, y - 7, w + 14, h + 14, 6); c.fill();
    c.save();
    rr(c, x, y, w, h, 3); c.clip();
    c.fillStyle = j.parede; c.fillRect(x, y, w, h);
    c.fillStyle = 'rgba(255,214,140,.25)'; c.beginPath(); c.arc(x + w / 2, y + 6, w * 0.6, 0, TAU); c.fill();
    c.fillStyle = '#c08552'; c.fillRect(x, y + h - 10, w, 10);
    const cf = j.fase;
    if (j.tipo === 'cozinha') {
      c.fillStyle = 'rgba(72,149,239,.18)';
      for (let a = 0; a < w; a += 14) for (let b = 0; b < h - 40; b += 14) if ((a + b) % 28 === 0) c.fillRect(x + a, y + b, 12, 12);
      const fx = x + w - 38;
      c.fillStyle = '#6c757d'; rr(c, fx, pe - 30, 34, 30, 3); c.fill();
      c.fillStyle = 'rgba(255,138,28,' + (0.5 + Math.sin(t * 7) * 0.2) + ')'; c.fillRect(fx + 6, pe - 16, 22, 5);
      c.fillStyle = '#adb5bd'; rr(c, fx + 4, pe - 44, 26, 14, 4); c.fill();
      for (let i = 0; i < 3; i++) {
        const f = (t * 0.6 + i / 3) % 1;
        c.fillStyle = 'rgba(255,255,255,' + (0.75 * (1 - f)) + ')';
        c.beginPath(); c.arc(fx + 10 + i * 7, pe - 50 - f * 30, 4 + f * 6, 0, TAU); c.fill();
      }
      c.save(); c.translate(x + w * 0.4, pe); c.scale(s, s);
      boneco(c, COZ, { t: t, dir: 1, fase: 0, anda: false, braco: 1.05 + Math.sin(t * 5 + cf) * 0.15 });
      c.restore();
      c.strokeStyle = '#9c6644'; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(fx + 16 + Math.cos(t * 5) * 4, pe - 42); c.lineTo(x + w * 0.4 + 14 * s, pe - 36 * s); c.stroke();
    } else if (j.tipo === 'mesa' || j.tipo === 'mesaHerois') {
      const her = HEROIS();
      const a = j.tipo === 'mesaHerois' ? her[(hi + 3) % her.length] : j.quem[0];
      const b = j.tipo === 'mesaHerois' ? her[(hi + 4) % her.length] : j.quem[1];
      c.save(); c.translate(x + w * 0.24, pe + 8); c.scale(s, s);
      boneco(c, a, { t: t, dir: 1, fase: 0, anda: false, braco: Math.max(0, Math.sin(t * 2.4 + cf)) * 0.8 });
      c.restore();
      c.save(); c.translate(x + w * 0.76, pe + 8); c.scale(s, s);
      boneco(c, b, { t: t, dir: -1, fase: 0, anda: false, braco: Math.max(0, Math.sin(t * 2.1 + cf + 2)) * 0.8 });
      c.restore();
      c.fillStyle = '#fff'; rr(c, x + w * 0.16, pe - 24, w * 0.68, 24, 3); c.fill();
      c.fillStyle = '#e63946';
      for (let q = 0; q < 8; q++) if (q % 2 === 0) c.fillRect(x + w * 0.16 + q * w * 0.085, pe - 24, w * 0.085, 8);
      comida(c, j.prato, x + w * 0.5, pe - 36, 0.42 * (h / 78));
    } else if (j.tipo === 'quarto' || j.tipo === 'nossaCama') {
      const nossa = j.tipo === 'nossaCama', k = 0.5 * (h / 78);
      cama(c, x + w * 0.52, pe, k, nossa ? '#e63946' : '#ff6fb1', nossa);
      if (!nossa) { dorminhoco(c, j.quem[0], x + w * 0.52, pe, k, t); cobertor(c, x + w * 0.52, pe - 4 * k, k, '#ff6fb1'); zzz(c, x + w * 0.2, y + 26, 0.7, t + cf); }
      else {
        cobertor(c, x + w * 0.52, pe - 4 * k, k, '#1d3557');
        G.gfx.star(c, x + w * 0.14, y + 18, 6 + Math.sin(t * 3) * 1.5, '#ffd166', t);
      }
      c.fillStyle = '#ffd166'; c.beginPath(); c.arc(x + 12, y + 18, 6, 0, TAU); c.fill();
    } else if (j.tipo === 'sala') {
      c.fillStyle = '#343a40'; rr(c, x + w - 40, pe - 50, 34, 26, 3); c.fill();
      c.fillStyle = 'hsl(' + ((t * 60 + cf * 40) % 360) + ',70%,65%)'; c.fillRect(x + w - 37, pe - 47, 28, 20);
      c.fillStyle = '#495057'; c.fillRect(x + w - 26, pe - 24, 6, 18);
      c.fillStyle = '#4361ee'; rr(c, x + 6, pe - 30, w * 0.55, 26, 6); c.fill();
      c.save(); c.translate(x + w * 0.3, pe - 6); c.scale(s, s);
      boneco(c, j.quem[0], { t: t, dir: 1, fase: 0, anda: false, braco: Math.max(0, Math.sin(t * 3 + cf)) * 0.9 });
      c.restore();
      c.fillStyle = '#5a78f0'; rr(c, x + 6, pe - 20, w * 0.55, 16, 5); c.fill();
    }
    c.restore();
    // o vidro: dá para ver lá para dentro, mas está fechado
    c.fillStyle = 'rgba(200,230,255,.18)'; rr(c, x, y, w, h, 3); c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)';
    c.beginPath(); c.moveTo(x + 6, y + h * 0.55); c.lineTo(x + w * 0.35, y + 4); c.lineTo(x + w * 0.48, y + 4); c.lineTo(x + 6, y + h * 0.78); c.closePath(); c.fill();
    c.strokeStyle = '#dee2e6'; c.lineWidth = 5; rr(c, x, y, w, h, 3); c.stroke();
    c.strokeStyle = '#f8f9fa'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); c.stroke();
    c.fillStyle = '#e63946'; rr(c, x - 4, y - 4, 12, h * 0.55, 4); c.fill(); rr(c, x + w - 8, y - 4, 12, h * 0.55, 4); c.fill();
  }

  function portaDesenho(c, x, w, h, cor, luz, t) {
    if (luz) { c.fillStyle = 'rgba(255,209,102,' + (0.35 + Math.sin(t * 6) * 0.15) + ')'; rr(c, x - w / 2 - 8, -h - 8, w + 16, h + 8, 10); c.fill(); }
    c.fillStyle = sombra(cor, -0.2); rr(c, x - w / 2, -h, w, h, 6); c.fill();
    c.fillStyle = cor; rr(c, x - w / 2 + 7, -h + 7, w - 14, h - 7, 4); c.fill();
    c.fillStyle = '#ffd166'; c.beginPath(); c.arc(x + w * 0.28, -h * 0.48, 5, 0, TAU); c.fill();
    c.fillStyle = '#6a994e'; rr(c, x - w / 2 - 4, -5, w + 8, 7, 3); c.fill();
  }
  function portaAqui(x) { const h = eu(); return fase === 'luta' && portaVis && Math.abs(h.x - x) < 46; }

  function casaDesenho(c, ca, t) {
    const e = ca.e, x0 = ca.x0, W = ca.w, H = ANDAR * 2;
    c.fillStyle = sombra(e.cor, -0.25); rr(c, x0 - 6, -H - 6, W + 12, H + 6, 6); c.fill();
    c.fillStyle = e.cor; c.fillRect(x0, -H, W, H);
    c.fillStyle = 'rgba(0,0,0,.06)';
    for (let yy = -H + 18; yy < 0; yy += 22) c.fillRect(x0, yy, W, 2);
    c.fillStyle = sombra(e.cor, -0.15); c.fillRect(x0, -ANDAR - 6, W, 8);
    // telhado
    c.fillStyle = e.telhado;
    c.beginPath(); c.moveTo(x0 - 24, -H); c.lineTo(e.x, -H - 92); c.lineTo(x0 + W + 24, -H); c.closePath(); c.fill();
    c.fillStyle = sombra(e.telhado, -0.25); c.fillRect(x0 - 24, -H - 6, W + 48, 8);
    c.fillStyle = sombra(e.telhado, -0.15); rr(c, x0 + W - 90, -H - 86, 36, 60, 4); c.fill();
    for (const j of ca.janelas) janela(c, j, t);
    portaDesenho(c, e.x, 64, 112, '#9c6644', portaAqui(e.x), t);
    if (e.tipo === 'herois') {
      c.fillStyle = '#1d3557'; rr(c, e.x - 120, -H - 40, 240, 30, 8); c.fill();
      label(c, 'CASA DOS HERÓIS', e.x, -H - 25, 17, '#ffd166', 'center', 'none');
      G.gfx.star(c, e.x, -H - 66, 12, '#ffd166', t * 0.5);
    }
  }
  function restDesenho(c, ca, t) {
    const x0 = ca.x0, W = REST_W, H = REST_H, e = ca.e;
    c.fillStyle = '#fff3e0'; rr(c, x0, -H, W, H, 8); c.fill();
    for (const j of ca.janelas) janela(c, j, t);
    for (let k = 0; k * 34 < W; k++) {
      c.fillStyle = k % 2 ? '#e63946' : '#f8f9fa';
      const a = x0 + k * 34, b = Math.min(x0 + (k + 1) * 34, x0 + W);
      c.beginPath(); c.moveTo(a, -H + 8); c.lineTo(b, -H + 8); c.lineTo(b + 10, -H + 40); c.lineTo(a + 10, -H + 40); c.closePath(); c.fill();
    }
    c.fillStyle = '#22223b'; rr(c, e.x - 86, -H - 72, 172, 60, 14); c.fill();
    c.strokeStyle = '#ffd166'; c.lineWidth = 4; rr(c, e.x - 86, -H - 72, 172, 60, 14); c.stroke();
    comida(c, 'hamburguer', e.x - 36, -H - 46, 0.8);
    G.gfx.star(c, e.x + 44, -H - 42, 15, '#ffd166', t);
    portaDesenho(c, x0 + 62, 70, 128, '#a0522d', portaAqui(x0 + 62), t);
  }
  function predioDesenho(c, ca, t) {
    const e = ca.e, W = 300, H = e.alto, x0 = e.x - W / 2;
    c.fillStyle = e.cor; c.fillRect(x0, -H, W, H);
    c.fillStyle = sombra(e.cor, -0.1);
    for (let k = 0; k < W / 20; k++) { rr(c, x0 + k * 20 + 4, -H - 6, 12, 7, 2); c.fill(); }
    for (let yy = -H + 24; yy < -130; yy += 62) for (let xx = x0 + 22; xx < x0 + W - 50; xx += 66) {
      c.fillStyle = 'rgba(255,255,255,.6)'; rr(c, xx, yy, 44, 38, 4); c.fill();
      const lz = ((xx * 7 + yy * 3) | 0) % 5 === 0;
      if (lz) { c.fillStyle = 'rgba(255,214,102,.5)'; rr(c, xx + 3, yy + 3, 38, 32, 3); c.fill(); }
    }
    c.fillStyle = 'rgba(189,224,254,.85)'; rr(c, e.x - 50, -110, 100, 110, 6); c.fill();
    c.strokeStyle = '#f8f9fa'; c.lineWidth = 4; c.beginPath(); c.moveTo(e.x, -110); c.lineTo(e.x, 0); c.stroke();
  }
  function torreDesenho(c, t) {
    const W = 300, H = 820, x0 = TORRE_X - W / 2;
    c.fillStyle = '#3f5c8a'; rr(c, x0, -H, W, H, 10); c.fill();
    c.fillStyle = '#54749f'; c.fillRect(x0 + 18, -H + 12, 28, H - 12);
    c.fillStyle = 'rgba(189,224,254,.55)';
    for (let yy = -H + 60; yy < -60; yy += 54) for (let xx = x0 + 60; xx < x0 + W - 30; xx += 56) c.fillRect(xx, yy, 36, 30);
    c.fillStyle = '#e9ecef'; c.beginPath(); c.arc(TORRE_X, -H + 70, 46, 0, TAU); c.fill();
    label(c, 'A', TORRE_X, -H + 72, 56, '#1d3557', 'center', 'none');
    c.fillStyle = '#2b2d42'; rr(c, TORRE_X - 46, -120, 92, 120, 8); c.fill();
  }
  function prisaoDesenho(c, t) {
    const W = 360, H = 230, x0 = PRISAO_X - W / 2;
    c.fillStyle = '#868e96'; rr(c, x0, -H, W, H, 6); c.fill();
    c.fillStyle = '#6c757d'; for (let yy = -H + 20; yy < 0; yy += 26) c.fillRect(x0, yy, W, 3);
    c.fillStyle = '#343a40'; rr(c, x0 + 30, -H + 40, W - 60, 120, 6); c.fill();
    const presos = viloes.filter(function (v) { return v.estado === 'preso'; });
    presos.forEach(function (v, i) {
      cabecinha(c, v.def, x0 + 70 + i * 48, -H + 110, 1.6, t);
    });
    c.strokeStyle = '#ced4da'; c.lineWidth = 5;
    for (let xx = x0 + 44; xx < x0 + W - 30; xx += 22) { c.beginPath(); c.moveTo(xx, -H + 40); c.lineTo(xx, -H + 160); c.stroke(); }
    c.fillStyle = '#1d3557'; rr(c, PRISAO_X - 70, -H - 34, 140, 30, 8); c.fill();
    G.gfx.star(c, PRISAO_X, -H - 19, 11, '#ffd166', 0);
  }

  function fundo(c, t) {
    const W = G.W, H = G.H, sc = escala(), cp = chaoPx(), chao = cp - cam.y * sc;
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#79c4ff'); g.addColorStop(0.75, '#d8f0ff'); g.addColorStop(1, '#f1f9ff');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 6; i++) {
      const x = ((i * 530 - cam.x * 0.1 + t * 8) % (W + 400) + W + 400) % (W + 400) - 200;
      G.gfx.cloud(c, x, 60 + (i % 3) * 46 - cam.y * sc * 0.2, 30 + (i % 2) * 14, 0.85);
    }
    const px = cam.x * 0.25;
    for (let i = -1; i < 30; i++) {
      const bx = i * 150 - (px % 150), idx = i + Math.floor(px / 150);
      if (bx > W) break;
      const hh = (110 + ((idx * 73) % 7) * 34) * sc;
      c.fillStyle = '#a9cbe6'; c.fillRect(bx, chao - hh, 132, hh);
      c.fillStyle = 'rgba(255,255,255,.35)';
      for (let wy = chao - hh + 14; wy < chao - 20; wy += 26) for (let wx = bx + 14; wx < bx + 120; wx += 30) c.fillRect(wx, wy, 12, 12);
    }
    c.fillStyle = '#b0b7c3'; c.fillRect(0, chao, W, 14 * sc + 4);
    c.fillStyle = '#6c757d'; c.fillRect(0, chao + 14 * sc + 4, W, H);
    c.fillStyle = 'rgba(255,255,255,.7)';
    const dash = 120 * sc;
    for (let x = -((cam.x * sc) % dash); x < W; x += dash) c.fillRect(x, chao + 40 * sc + 10, dash * 0.5, 5);
  }

  function linhaXadrez(c, x, t, meta) {
    for (let r = 0; r < 4; r++) for (let q = 0; q < 2; q++) {
      c.fillStyle = (r + q) % 2 ? '#22223b' : '#fff';
      c.fillRect(x - 12 + q * 12, r * 12, 12, 12);
    }
    if (meta) {
      c.fillStyle = '#495057'; c.fillRect(x - 200, -300, 10, 300); c.fillRect(x + 190, -300, 10, 300);
      for (let q = 0; q < 33; q++) { c.fillStyle = q % 2 ? '#22223b' : '#fff'; c.fillRect(x - 200 + q * 12, -320, 12, 14); c.fillStyle = q % 2 ? '#fff' : '#22223b'; c.fillRect(x - 200 + q * 12, -306, 12, 14); }
      for (let k = 0; k < 3; k++) G.gfx.star(c, x - 120 + k * 120, -340 + Math.sin(t * 3 + k) * 4, 12, '#ffd166', t + k);
    } else {
      c.fillStyle = '#495057'; c.fillRect(x - 4, -170, 8, 170);
      c.fillStyle = '#8ac926'; c.beginPath(); c.moveTo(x + 4, -170); c.lineTo(x + 54, -152); c.lineTo(x + 4, -134); c.closePath(); c.fill();
    }
  }

  function obsDesenho(c, o, t) {
    const x0 = o.x0, w = o.x1 - o.x0;
    if (o.tipo === 'buraco') {
      c.fillStyle = '#3a2c1f'; rr(c, x0, -4, w, 40, 6); c.fill();
      c.fillStyle = '#22180f'; rr(c, x0 + 8, 6, w - 16, 30, 6); c.fill();
      for (const cx of [x0 - 18, x0 + w + 18]) {
        c.fillStyle = '#f77f00'; c.beginPath(); c.moveTo(cx - 12, 0); c.lineTo(cx, -36); c.lineTo(cx + 12, 0); c.closePath(); c.fill();
        c.fillStyle = '#fff'; c.fillRect(cx - 7, -20, 14, 5);
      }
      return;
    }
    if (o.partido) {
      for (let k = 0; k < 5; k++) { c.fillStyle = k % 2 ? '#c08552' : '#a0673a'; rr(c, x0 - 10 + k * 18, -10 - (k % 2) * 6, 16, 10, 2); c.fill(); }
      return;
    }
    if (o.tipo === 'caixas' || o.tipo === 'caixasAltas') {
      const n = o.tipo === 'caixas' ? 1 : 2;
      for (let k = 0; k < n; k++) {
        const y = -56 - k * 48 - (k ? -8 : 0);
        c.fillStyle = '#c08552'; rr(c, x0, k ? -104 : -56, w, k ? 50 : 56, 4); c.fill();
        c.strokeStyle = '#8d5524'; c.lineWidth = 3;
        const yy = k ? -104 : -56, hh = k ? 50 : 56;
        c.strokeRect(x0 + 4, yy + 4, w - 8, hh - 8);
        c.beginPath(); c.moveTo(x0 + 4, yy + 4); c.lineTo(x0 + w - 4, yy + hh - 4); c.stroke();
        if (y > 0) break;
      }
    } else if (o.tipo === 'cones') {
      for (const cx of [x0 + 16, x0 + w - 16]) {
        c.fillStyle = '#f77f00'; c.beginPath(); c.moveTo(cx - 15, 0); c.lineTo(cx, -42); c.lineTo(cx + 15, 0); c.closePath(); c.fill();
        c.fillStyle = '#fff'; c.fillRect(cx - 9, -24, 18, 6);
      }
      c.fillStyle = '#ffd166'; c.fillRect(x0 + 10, -30, w - 20, 5);
    } else if (o.tipo === 'barreira') {
      c.fillStyle = '#e63946'; rr(c, x0, -o.h, w, o.h, 4); c.fill();
      c.fillStyle = '#fff'; for (let yy = -o.h + 10; yy < -10; yy += 26) c.fillRect(x0, yy, w, 11);
    } else if (o.tipo === 'carro') {
      c.fillStyle = o.cor; rr(c, x0, -60, w, 46, 12); c.fill();
      c.beginPath(); c.moveTo(x0 + 30, -60); c.lineTo(x0 + 50, -o.h - 18); c.lineTo(x0 + w - 44, -o.h - 18); c.lineTo(x0 + w - 22, -60); c.closePath(); c.fill();
      c.fillStyle = '#bde0fe'; c.beginPath(); c.moveTo(x0 + 44, -62); c.lineTo(x0 + 58, -o.h - 10); c.lineTo(x0 + w / 2 - 4, -o.h - 10); c.lineTo(x0 + w / 2 - 4, -62); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(x0 + w / 2 + 4, -62); c.lineTo(x0 + w / 2 + 4, -o.h - 10); c.lineTo(x0 + w - 50, -o.h - 10); c.lineTo(x0 + w - 32, -62); c.closePath(); c.fill();
      c.fillStyle = '#22223b';
      for (const wx of [x0 + 34, x0 + w - 34]) { c.beginPath(); c.arc(wx, -14, 15, 0, TAU); c.fill(); c.fillStyle = '#adb5bd'; c.beginPath(); c.arc(wx, -14, 6, 0, TAU); c.fill(); c.fillStyle = '#22223b'; }
      c.fillStyle = '#fff3b0'; c.fillRect(x0 + w - 10, -50, 8, 8);
    } else if (o.tipo === 'paragem') {
      c.fillStyle = '#adb5bd'; c.fillRect(x0 + 10, -o.h, 10, o.h); c.fillRect(x0 + w - 20, -o.h, 10, o.h);
      c.fillStyle = 'rgba(189,224,254,.55)'; c.fillRect(x0 + 20, -o.h + 18, w - 40, o.h - 30);
      c.fillStyle = '#1d7874'; rr(c, x0 - 6, -o.h - 6, w + 12, 18, 6); c.fill();
      c.fillStyle = '#ffd166'; rr(c, x0 + w / 2 - 22, -o.h + 26, 44, 30, 6); c.fill();
      label(c, 'BUS', x0 + w / 2, -o.h + 41, 14, '#22223b', 'center', 'none');
      c.fillStyle = '#9c6644'; rr(c, x0 + 40, -34, w - 80, 10, 3); c.fill();
    }
  }
  function raioTurbo(c, x, y, s, cor) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = cor || '#ffd166'; c.strokeStyle = '#b56b00'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(4, -16); c.lineTo(-8, 2); c.lineTo(0, 2); c.lineTo(-4, 16); c.lineTo(8, -2); c.lineTo(0, -2); c.closePath(); c.fill(); c.stroke();
    c.restore();
  }

  function corredorDesenho(c, r, t, i) {
    const d = r.def, sou = i === 0;
    const dy = -r.lane * 5;
    if (r.buraco) {
      const o = r.buraco.o, k = r.buraco.t / DIF.BURACO_T;
      c.save(); c.beginPath(); c.rect(o.x0 - 60, -600, o.x1 - o.x0 + 120, 600); c.clip();
      c.translate(clamp(r.x, o.x0 + 20, o.x1 - 20), 50 - Math.sin(k * Math.PI) * 30); c.scale(FIG, FIG);
      boneco(c, d, { t: t, dir: 1, fase: 0, anda: false, cima: true, tonto: true });
      c.restore();
      return;
    }
    const P = r.plana;
    if (P && P.tipo === 'teia') {      // o fio da teia, da mão a um sítio lá em cima
      const mx = r.x + 8, my = r.y + dy - altura(d) * 0.95;
      c.strokeStyle = 'rgba(34,34,59,.45)'; c.lineWidth = 5; c.beginPath(); c.moveTo(mx, my); c.lineTo(P.ax, P.ay); c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 2.6; c.stroke();
    }
    if (r.turbo > 0 || r.seta > 0) {   // chamas do turbo e riscos de velocidade
      c.fillStyle = r.turbo > 0 ? 'rgba(255,183,3,.75)' : 'rgba(76,201,240,.6)';
      for (let k = 0; k < 3; k++) {
        const fl = 30 + Math.random() * 30;
        c.beginPath(); c.moveTo(r.x - 14, r.y + dy - 20 - k * 18); c.lineTo(r.x - 14 - fl, r.y + dy - 26 - k * 18); c.lineTo(r.x - 14, r.y + dy - 32 - k * 18); c.closePath(); c.fill();
      }
    }
    if (P && P.tipo === 'dash') {
      c.fillStyle = 'rgba(157,78,221,.4)';
      for (let k = 1; k <= 3; k++) { c.beginPath(); c.ellipse(r.x - k * 18, r.y + dy - 40, 13, 30, 0, 0, TAU); c.fill(); }
    }
    if (P && P.tipo === 'patins') {
      c.fillStyle = 'rgba(0,180,216,.5)'; c.beginPath(); c.ellipse(r.x, r.y + dy + 4, 30, 8, 0, 0, TAU); c.fill();
    }
    c.save(); c.translate(r.x, r.y + dy); c.scale(FIG, FIG);
    if (r.invul > 0 && !r.desmonta && Math.floor(t * 14) % 2) c.globalAlpha = 0.45;
    boneco(c, d, {
      t: t, dir: r.dir, fase: r.fase, anda: r.noChao && Math.abs(r.vx) > 30, noAr: !r.noChao, braco: r.braco || (P ? 0.8 : 0),
      tonto: r.tonto > 0, cima: !!(P && P.tipo === 'teia') || (fase === 'podio' && r.ordem < 3) || (fase === 'festa'),
      jato: P && P.tipo === 'voo' ? 1 : 0, partes: r.desmonta ? r.desmonta.partes : null
    });
    c.restore();
    if (P && P.tipo === 'martelo') {   // o martelo do Thor a girar por cima
      c.save(); c.translate(r.x, r.y + dy - altura(d) - 16); c.rotate(t * 18);
      c.fillStyle = '#6c757d'; rr(c, -14, -8, 28, 16, 3); c.fill();
      c.fillStyle = '#8d5524'; c.fillRect(-2, 6, 4, 18);
      c.restore();
    }
    if (sou && (fase === 'corrida' || fase === 'contagem' || fase === 'escolha')) {   // a setinha amarela por cima de nós
      const y = r.y + dy - altura(d) - 34 + Math.sin(t * 6) * 4;
      c.fillStyle = '#ffd166'; c.strokeStyle = '#22223b'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(r.x - 12, y); c.lineTo(r.x + 12, y); c.lineTo(r.x, y + 16); c.closePath(); c.fill(); c.stroke();
    }
  }

  function vilaoDesenho(c, v, t) {
    if (v.estado === 'preso' || v.estado === 'carro') return;
    const d = v.def, livre = v.estado === 'livre';
    c.save(); c.translate(v.x, v.y); c.scale(FIG, FIG);
    if (v.hitT > 0 && Math.floor(t * 30) % 2) c.globalAlpha = 0.55;
    boneco(c, d, {
      t: t, dir: v.dir, fase: v.fase, anda: livre && Math.abs(v.vx) > 20 && !d.voa || (v.estado === 'amigo' && Math.abs(v.vx) > 10),
      braco: v.atira > 0 ? 1 : (v.estado === 'amigo' && !v.vx ? 0.5 + Math.sin(t * 4 + v.fase * 0.1) * 0.4 : 0),
      tonto: v.estado === 'algemado', algemas: v.estado === 'algemado', noAr: livre && !v.noChao && !d.voa,
      prancha: d.prancha && livre, jato: d.jato && livre ? 0.8 : 0
    });
    if (v.teia > 0 && livre) {
      c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1;
      for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(-14, -20 - k * 9); c.lineTo(14, -24 - k * 8); c.stroke(); }
    }
    c.restore();
    if (livre) {
      const k = d.grande || 1, y = v.y - 98 * FIG * k, n = Math.ceil(v.max / 2);
      for (let i = 0; i < n; i++) {
        const x = v.x + (i - (n - 1) / 2) * 13;
        c.fillStyle = i < v.hp / 2 ? (d.cor || '#e63946') : 'rgba(255,255,255,.6)';
        c.strokeStyle = 'rgba(30,30,50,.6)'; c.lineWidth = 2;
        c.beginPath(); c.arc(x, y, 5, 0, TAU); c.fill(); c.stroke();
      }
    } else if (v.estado === 'amigo') {
      G.gfx.heart(c, v.x, v.y - 112 * (d.grande || 1) + Math.sin(t * 3) * 3, 12, '#ff4d6d');
    }
  }
  function policiaDesenho(c, p, t) {
    c.save(); c.translate(p.x, 0); c.scale(p.dir || 1, 1);
    c.fillStyle = '#f8f9fa'; rr(c, -80, -56, 160, 42, 12); c.fill();
    c.fillStyle = '#1d3557'; rr(c, -80, -36, 160, 14, 4); c.fill();
    c.fillStyle = '#f8f9fa'; c.beginPath(); c.moveTo(-50, -56); c.lineTo(-34, -92); c.lineTo(36, -92); c.lineTo(54, -56); c.closePath(); c.fill();
    c.fillStyle = '#bde0fe'; rr(c, -40, -86, 34, 26, 4); c.fill(); rr(c, 4, -86, 36, 26, 4); c.fill();
    if (p.fase === 'leva') cabecinha(c, p.alvo.def, -23, -78, 0.85, t);
    c.save(); c.translate(18, -66); c.scale(0.7, 0.7); boneco(c, POL, { t: t, dir: 1, fase: 0, anda: false }); c.restore();
    const a = Math.floor(t * 6) % 2;
    c.fillStyle = a ? '#e63946' : '#4361ee'; rr(c, -14, -102, 12, 10, 3); c.fill();
    c.fillStyle = a ? '#4361ee' : '#e63946'; rr(c, 2, -102, 12, 10, 3); c.fill();
    c.fillStyle = '#22223b';
    for (const wx of [-50, 50]) { c.beginPath(); c.arc(wx, -14, 15, 0, TAU); c.fill(); }
    c.restore();
  }
  function podioDesenho(c, t) {
    const blocos = [[0, 96, '#ffd166', '1'], [-110, 64, '#ced4da', '2'], [110, 44, '#e0a526', '3']];
    for (const b of blocos) {
      c.fillStyle = b[2]; rr(c, PODIO_X + b[0] - 50, -b[1], 100, b[1], 6); c.fill();
      label(c, b[3], PODIO_X + b[0], -b[1] / 2, 30, '#22223b', 'center', 'none');
    }
  }
  function posPodio(r) {
    const o = r.ordem;
    if (o === 0) return { x: PODIO_X, y: -96 };
    if (o === 1) return { x: PODIO_X - 110, y: -64 };
    if (o === 2) return { x: PODIO_X + 110, y: -44 };
    return { x: PODIO_X + 200 + (o - 3) * 70, y: 0 };
  }

  S.draw = function (c, t) {
    if (!corredores.length) return;
    if (dentro) { desenhaInterior(c, t); return; }
    const sc = escala(), cp = chaoPx(), vw = vistaW();
    fundo(c, t);
    c.save();
    c.translate(-cam.x * sc, cp - cam.y * sc);
    c.scale(sc, sc);
    const x0 = cam.x - 300, x1 = cam.x + vw + 300;
    for (const ca of casas) {
      if (ca.x + 450 < x0 || ca.x - 450 > x1) continue;
      if (ca.tipo === 'familia' || ca.tipo === 'herois') casaDesenho(c, ca, t);
      else if (ca.tipo === 'rest') restDesenho(c, ca, t);
      else if (ca.tipo === 'predio') predioDesenho(c, ca, t);
      else if (ca.tipo === 'torre') torreDesenho(c, t);
      else if (ca.tipo === 'prisao') prisaoDesenho(c, t);
    }
    for (const p of civis) {
      if (p.x < x0 || p.x > x1) continue;
      c.save(); c.translate(p.x, -8); c.scale(FIG * 0.85, FIG * 0.85);
      boneco(c, p.def, { t: t, dir: p.dir, fase: p.fase, anda: p.para <= 0 });
      c.restore();
    }
    if (META > x0 && META - 400 < x1) for (const p of torcida) {
      c.save(); c.translate(p.x, -10); c.scale(FIG * 0.85, FIG * 0.85);
      boneco(c, p.def, { t: t, dir: p.x < META ? 1 : -1, fase: 0, anda: false, cima: Math.sin(t * 5 + p.fase) > 0 });
      c.restore();
    }
    if (PARTIDA > x0 && PARTIDA < x1) linhaXadrez(c, PARTIDA, t, false);
    if (META > x0 - 300 && META < x1 + 300) linhaXadrez(c, META, t, true);
    if (fase === 'podio' || (PODIO_X > x0 && PODIO_X < x1 && fase !== 'luta' && fase !== 'festa')) podioDesenho(c, t);
    for (const p of pads) {
      if (p.x1 < x0 || p.x0 > x1) continue;
      c.fillStyle = 'rgba(76,201,240,.8)'; rr(c, p.x0, -4, p.x1 - p.x0, 10, 4); c.fill();
      c.fillStyle = '#fff';
      for (let k = 0; k < 3; k++) { const ax = p.x0 + 18 + k * 26; c.beginPath(); c.moveTo(ax, -2); c.lineTo(ax + 10, 1); c.lineTo(ax, 4); c.closePath(); c.fill(); }
    }
    for (const o of obst) if (o.x1 > x0 && o.x0 < x1) obsDesenho(c, o, t);
    for (const b of boosts) if (!b.pegos[0] && b.x > x0 && b.x < x1) {
      const yy = b.y + Math.sin(t * 4 + b.x) * 4;
      c.fillStyle = 'rgba(255,209,102,.35)'; c.beginPath(); c.arc(b.x, yy, 22, 0, TAU); c.fill();
      raioTurbo(c, b.x, yy, 1.2);
    }
    if (fase === 'luta' || fase === 'festa') {
      // os outros heróis vêm ver e torcer, ao pé da Torre
      corredores.forEach(function (r, i) {
        if (i === 0) return;
        const x = TORRE_X - 120 + i * 60, y = fase === 'festa' ? -Math.abs(Math.sin(t * 5 + i)) * 40 : 0;
        c.save(); c.translate(x, y); c.scale(FIG * 0.9, FIG * 0.9);
        boneco(c, r.def, { t: t, dir: -1, fase: 0, anda: false, cima: fase === 'festa', braco: 0.5 + Math.sin(t * 4 + i) * 0.4 });
        c.restore();
      });
      for (const v of viloes) if (v.x > x0 && v.x < x1) vilaoDesenho(c, v, t);
      for (const p of policias) policiaDesenho(c, p, t);
      corredorDesenho(c, eu(), t, 0);
    } else if (fase === 'podio') {
      corredores.slice().sort(function (a, b) { return b.ordem - a.ordem; }).forEach(function (r) {
        const p = posPodio(r);
        c.save(); c.translate(p.x, p.y); c.scale(FIG, FIG);
        boneco(c, r.def, { t: t, dir: 1, fase: 0, anda: false, cima: r.ordem === 0 || Math.sin(t * 4 + r.ordem) > 0.3 });
        c.restore();
        if (r.ordem === 0) { trofeu(c, p.x, p.y - altura(r.def) - 40 + Math.sin(t * 3) * 4, 2.2); }
        if (r === eu()) { const y = p.y - altura(r.def) - (r.ordem === 0 ? 90 : 34); c.fillStyle = '#ffd166'; c.beginPath(); c.moveTo(p.x - 12, y); c.lineTo(p.x + 12, y); c.lineTo(p.x, y + 16); c.closePath(); c.fill(); }
      });
    } else {
      for (let i = corredores.length - 1; i >= 0; i--) corredorDesenho(c, corredores[i], t, i);
    }
    // poderes e tiros
    for (const tr of tiros) {
      if (tr.tipo === 'escudo') {
        c.save(); c.translate(tr.x, tr.y); c.rotate(t * 20);
        const an = ['#c1121f', '#f1f1f1', '#c1121f', '#1d4e89'];
        for (let i = 0; i < 4; i++) { c.fillStyle = an[i]; c.beginPath(); c.arc(0, 0, 18 * (1 - i * 0.22), 0, TAU); c.fill(); }
        c.restore();
      } else if (tr.tipo === 'teia') {
        c.strokeStyle = '#fff'; c.lineWidth = 2;
        c.beginPath(); c.arc(tr.x, tr.y, 10, 0, TAU); c.stroke();
        c.beginPath(); c.moveTo(tr.x - 12, tr.y); c.lineTo(tr.x + 12, tr.y); c.moveTo(tr.x, tr.y - 12); c.lineTo(tr.x, tr.y + 12); c.stroke();
      } else {
        c.fillStyle = 'rgba(143,247,255,.5)'; c.beginPath(); c.arc(tr.x, tr.y, 14, 0, TAU); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(tr.x, tr.y, 7, 0, TAU); c.fill();
      }
    }
    for (const tm of tirosMaus) {
      const rr2 = tm.grande ? 14 : 10;
      c.fillStyle = tm.cor; c.globalAlpha = 0.4; c.beginPath(); c.arc(tm.x, tm.y, rr2 + 6, 0, TAU); c.fill();
      c.globalAlpha = 1; c.beginPath(); c.arc(tm.x, tm.y, rr2, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(tm.x - 3, tm.y - 3, rr2 * 0.35, 0, TAU); c.fill();
    }
    for (const r of raios) {
      const al = 1 - r.t / 0.28;
      c.strokeStyle = r.cor === 'laser' ? 'rgba(255,79,163,' + al + ')' : (r.cor === 'eletrico' ? 'rgba(0,180,216,' + al + ')' : 'rgba(189,224,254,' + al + ')');
      c.lineWidth = r.cor === 'laser' ? 11 : 9; c.lineJoin = 'round';
      c.beginPath(); r.seg.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke();
    }
    for (const a of arranhoes) {
      const k = a.t / 0.4;
      c.save(); c.translate(a.x, a.y); c.scale(a.dir, 1); c.globalAlpha = 1 - k; c.lineCap = 'round';
      for (let i = -1; i <= 1; i++) {
        c.strokeStyle = '#9d4edd'; c.lineWidth = 9;
        c.beginPath(); c.moveTo(-34 + i * 6, -30 + i * 16); c.quadraticCurveTo(0, -8 + i * 16, 34 + i * 6, 14 + i * 16); c.stroke();
      }
      c.restore();
    }
    c.globalAlpha = 1;
    for (const o of ondas) {
      c.strokeStyle = 'rgba(201,173,167,' + (1 - o.t / 0.5) + ')'; c.lineWidth = 10;
      c.beginPath(); c.ellipse(o.x, o.y, 40 + o.t * 560, 16 + o.t * 40, 0, Math.PI, TAU); c.stroke();
    }
    for (const f of fx) {
      c.globalAlpha = Math.max(0, 1 - f.t / f.vida);
      c.fillStyle = f.cor;
      if (f.tijolo) { rr(c, f.x - f.tam, f.y - f.tam * 0.6, f.tam * 2, f.tam * 1.2, 2); c.fill(); }
      else { c.beginPath(); c.arc(f.x, f.y, f.tam * 0.6, 0, TAU); c.fill(); }
    }
    c.globalAlpha = 1;
    c.restore();
    if (flash > 0) { c.fillStyle = 'rgba(255,240,180,' + (flash / 0.6 * 0.7) + ')'; c.fillRect(0, 0, G.W, G.H); }
    if (fase === 'luta') setasViloes(c, t);
    hud(c, t);
  };

  function trofeu(c, x, y, k) {
    c.save(); c.translate(x, y); c.scale(k, k);
    c.fillStyle = '#ffd166'; c.strokeStyle = '#b56b00'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(-10, -12); c.lineTo(10, -12); c.quadraticCurveTo(9, 4, 0, 6); c.quadraticCurveTo(-9, 4, -10, -12); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.arc(-11, -8, 4.5, 0.6, 4.2); c.stroke();
    c.beginPath(); c.arc(11, -8, 4.5, -1.1, 2.5); c.stroke();
    c.fillRect(-2.5, 5, 5, 6); rr(c, -7, 10, 14, 4, 1.5); c.fill(); c.stroke();
    c.restore();
  }
  function coracoes(c, x, cy, cs) {
    for (let i = 0; i < DIF.MAXC; i++) {
      const hx = x + i * cs * 2.2, sobra = vidas - i;
      G.gfx.heart(c, hx, cy, cs, 'rgba(255,255,255,.55)');
      if (sobra >= 1) G.gfx.heart(c, hx, cy, cs, '#ff4d6d');
      else if (sobra >= 0.5) { c.save(); c.beginPath(); c.rect(hx - cs - 2, cy - cs * 1.4, cs + 2, cs * 2.6); c.clip(); G.gfx.heart(c, hx, cy, cs, '#ff4d6d'); c.restore(); }
    }
  }

  function setasViloes(c, t) {
    const sc = escala(), cp = chaoPx(), vw = vistaW();
    for (const v of livres()) {
      const sx = (v.x - cam.x) * sc;
      if (sx > -10 && sx < G.W + 10) continue;
      const dir = sx < 0 ? -1 : 1, x = dir < 0 ? 26 : G.W - 26;
      const y = clamp(cp + (centroY(v) - cam.y) * sc, 120, G.H * 0.42);
      c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(x, y, 20, 0, TAU); c.fill();
      cabecinha(c, v.def, x, y + 2, 0.75, t);
      c.fillStyle = '#e63946';
      c.beginPath(); c.moveTo(x + dir * 30, y); c.lineTo(x + dir * 20, y - 9); c.lineTo(x + dir * 20, y + 9); c.closePath(); c.fill();
    }
    void vw;
  }

  function hud(c, t) {
    const W = G.W, pequeno = Math.min(W, G.H) < 480;
    const dir = W - 130;                       // o canto de cima à direita é do 🏠/🔊
    if (fase === 'escolha' || fase === 'contagem' || fase === 'corrida' || fase === 'podio') {
      // a barra da corrida: da partida à meta, com a cabeça de cada um
      const bx0 = 34, bx1 = Math.max(bx0 + 120, dir - 24), by = pequeno ? 26 : 32;
      c.fillStyle = 'rgba(34,34,59,.55)'; rr(c, bx0 - 22, by - 20, bx1 - bx0 + 50, 40, 14); c.fill();
      c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(bx0, by - 3, bx1 - bx0, 6);
      for (let r = 0; r < 2; r++) for (let q = 0; q < 2; q++) { c.fillStyle = (r + q) % 2 ? '#22223b' : '#fff'; c.fillRect(bx1 - 4 + q * 8, by - 8 + r * 8, 8, 8); }
      const esc = pequeno ? 0.75 : 0.95;
      for (let i = corredores.length - 1; i >= 0; i--) {
        const r = corredores[i], k = clamp((r.x - PARTIDA) / (META - PARTIDA), 0, 1);
        const x = bx0 + k * (bx1 - bx0);
        if (i === 0) { c.fillStyle = '#ffd166'; c.beginPath(); c.arc(x, by, 17 * esc, 0, TAU); c.fill(); }
        cabecinha(c, r.def, x, by + 2, esc * ((r.def.grande || 1) > 1.2 ? 0.8 : 1), t);
      }
      // o lugar e os turbos
      if (fase === 'corrida' || fase === 'podio') {
        const me = eu();
        let pos = 1;
        if (fase === 'podio' || me.chegou) pos = posFinal || 1;
        else { pos = classif.length + 1; for (const r of corredores) if (r !== me && !r.chegou && r.x > me.x) pos++; }
        const ly = by + (pequeno ? 44 : 52);
        c.fillStyle = pos === 1 ? '#ffd166' : 'rgba(255,255,255,.85)'; rr(c, 12, ly - 22, 74, 44, 12); c.fill();
        label(c, pos + '.º', 49, ly + 1, pequeno ? 24 : 28, '#22223b', 'center', 'none');
        for (let i = 0; i < DIF.TURBO_MAX; i++) {
          const x = 108 + i * 30;
          c.fillStyle = 'rgba(34,34,59,.45)'; c.beginPath(); c.arc(x, ly, 13, 0, TAU); c.fill();
          raioTurbo(c, x, ly, 0.7, i < me.cargas ? '#ffd166' : 'rgba(255,255,255,.35)');
        }
        if (me.turbo > 0) label(c, 'TURBO!', 108 + DIF.TURBO_MAX * 30, ly + 1, 18, '#ff8a1c', 'left');
      }
      if (fase === 'escolha') {
        const d = defHeroi();
        const y = G.H * 0.3;
        c.fillStyle = 'rgba(34,34,59,.6)'; rr(c, W / 2 - 150, y - 34, 300, 68, 18); c.fill();
        cabecinha(c, d, W / 2 - 110, y + 2, 1.5, t);
        label(c, d.nome, W / 2 + 18, y - 8, pequeno ? 18 : 22, '#ffd166', 'center', 'none');
        label(c, 'Ronda ' + ronda, W / 2 + 18, y + 18, 15, '#fff', 'center', 'none');
      }
      if (fase === 'contagem') {
        const n = 3 - Math.floor(faseT / DIF.CONTA);
        const k = (faseT % DIF.CONTA) / DIF.CONTA;
        label(c, '' + n, W / 2, G.H * 0.38, (pequeno ? 90 : 130) * (1.3 - k * 0.4), '#ff5d8f', 'center');
      }
      if (fase === 'corrida' && faseT < 0.7) label(c, 'JÁ!', W / 2, G.H * 0.38, pequeno ? 80 : 110, '#8ac926', 'center');
    }
    if (fase === 'luta' || fase === 'festa') {
      // os vilões desta ronda: cara normal à solta, cadeado quando algemados, grades presos, coração amigos
      const vs = viloes.concat(fila.map(function (d) { return { def: d, estado: 'fila' }; }));
      const lado = pequeno ? 30 : 38, gap = 5, tot = vs.length * (lado + gap) - gap;
      const x0 = Math.max(12, Math.min(W / 2 - tot / 2, dir - tot - 10)), y0 = 10;
      c.fillStyle = 'rgba(34,34,59,.55)'; rr(c, x0 - 8, y0 - 6, tot + 16, lado + 12, 12); c.fill();
      vs.forEach(function (v, i) {
        const x = x0 + i * (lado + gap);
        const preso = v.estado === 'preso' || v.estado === 'carro';
        c.fillStyle = preso ? '#495057' : (v.estado === 'amigo' ? '#ffe5ec' : (v.estado === 'fila' ? 'rgba(255,255,255,.45)' : '#f1f3f5'));
        rr(c, x, y0, lado, lado, 8); c.fill();
        cabecinha(c, v.def, x + lado / 2, y0 + lado * 0.54, lado / 26 / ((v.def.grande || 1) > 1.2 ? 1.25 : 1), t);
        if (preso) { c.strokeStyle = '#ced4da'; c.lineWidth = 3; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(x + k * lado / 4, y0 + 2); c.lineTo(x + k * lado / 4, y0 + lado - 2); c.stroke(); } }
        if (v.estado === 'amigo') G.gfx.heart(c, x + lado - 7, y0 + lado - 7, 9, '#ff4d6d');
      });
      const cs = pequeno ? 12 : 15, cy = y0 + lado + 12 + cs;
      c.fillStyle = 'rgba(34,34,59,.45)'; rr(c, 10, cy - cs - 6, DIF.MAXC * cs * 2.2 + 12, cs * 2 + 12, 10); c.fill();
      coracoes(c, 16 + cs, cy, cs);
      // o super 💥 a encher
      const sx = 22 + DIF.MAXC * cs * 2.2 + 10, sw = 70, k = superN / DIF.SUPER_N;
      c.fillStyle = 'rgba(34,34,59,.45)'; rr(c, sx, cy - 9, sw, 18, 9); c.fill();
      c.fillStyle = k >= 1 ? (Math.floor(t * 6) % 2 ? '#ffd166' : '#ff8a1c') : '#ffd166'; rr(c, sx + 2, cy - 7, (sw - 4) * k, 14, 7); c.fill();
      label(c, '💥', sx + sw + 14, cy + 1, 16, '#fff', 'center', 'none');
      label(c, 'Ronda ' + ronda, sx + sw + 34, cy + 1, 15, '#22223b', 'left');
    }
    // estrelas
    if (G.state) {
      const sy = fase === 'luta' || fase === 'festa' ? (pequeno ? 90 : 104) : (pequeno ? 70 : 84);
      G.gfx.star(c, dir + 40, sy, 10, '#ffd166', 0);
      label(c, '' + G.state.stars, dir + 56, sy + 1, 18, '#b56b00', 'left');
    }
    if (fase === 'festa') { trofeu(c, W / 2, G.H * 0.36, 4 + Math.sin(t * 4) * 0.3); }
  }

  /* ---------- o interior em ecrã inteiro ---------- */
  function chefXY(L) {
    const ch = dentro.chef, m = L.mesas[L.heroiMesa];
    const a = { x: L.fogao.x + 40 * L.ks, y: L.chaoY, s: L.ks * 0.95 };
    const b = { x: m.x + 96 * L.k, y: m.y, s: L.k * 0.95 };
    let k = 0;
    if (ch.fase === 'vai') k = ch.t; else if (ch.fase === 'pousa') k = 1; else if (ch.fase === 'volta') k = 1 - ch.t;
    const ida = b.x >= a.x ? 1 : -1;
    return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, s: a.s + (b.s - a.s) * k, dir: ch.fase === 'volta' ? -ida : (ch.fase === 'pousa' ? -1 : ida) };
  }
  function mesaSala(c, L, i, t) {
    const D = dentro, m = L.mesas[i], minha = i === L.heroiMesa, info = D.mesas[i];
    c.save(); c.translate(m.x, m.y); c.scale(L.k, L.k);
    c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(0, 0, 74, 7, 0, 0, TAU); c.fill();
    for (let j = 0; j < 2; j++) {
      const sx = j ? 34 : -34;
      c.fillStyle = '#8d5524'; rr(c, sx - 16, -64, 32, 44, 6); c.fill();
      let quem = null, braco = 0;
      if (minha) {
        if (j === 0 && D.fase !== 'entra' && !D.dorme) { quem = defHeroi(); braco = D.come ? 0.65 + Math.sin(t * 18) * 0.35 : 0; }
        if (j === 1 && D.amigo) { quem = D.amigo.def; braco = Math.max(0, Math.sin(t * 2.6 + D.amigo.fase)) * 0.7; }
        if (j === 1 && !D.amigo && info && info.lug[1]) { quem = info.lug[1].def; }
      } else if (info && info.lug[j]) { quem = info.lug[j].def; braco = Math.max(0, Math.sin(t * 2.2 + info.lug[j].fase)) * 0.7; }
      if (quem) { c.save(); c.translate(sx, -2); boneco(c, quem, { t: t, dir: j ? -1 : 1, fase: 0, anda: false, braco: braco }); c.restore(); }
    }
    c.fillStyle = '#fff'; rr(c, -66, -30, 132, 28, 4); c.fill();
    c.fillStyle = '#e63946';
    for (let q = 0; q < 8; q++) for (let r = 0; r < 3; r++) if ((q + r) % 2 === 0) c.fillRect(-66 + q * 16.5, -30 + r * 9, 16.5, 9);
    c.fillStyle = '#f8f9fa'; c.beginPath(); c.ellipse(0, -30, 70, 7, 0, 0, TAU); c.fill();
    for (let j = 0; j < 2; j++) {
      const sx = j ? 34 : -34;
      let tipo = null, kk = 0.55;
      if (minha) {
        if (j === 0 && D.prato) { tipo = D.prato.tipo; if (D.come) kk *= 1 - D.come.t * 0.8; }
        if (j === 1 && D.amigo) tipo = D.amigo.com;
        if (j === 1 && !D.amigo && info && info.lug[1]) tipo = info.com[1];
      } else if (info && info.lug[j]) tipo = info.com[j];
      if (tipo) comida(c, tipo, sx, -30 - 20 * kk, kk);
    }
    if (minha && D.amigo) G.gfx.heart(c, 34, -96 * (D.amigo.def.grande || 1) + Math.sin(t * 3) * 3, 9, '#ff4d6d');
    if (minha && D.prato && !D.come) {
      c.strokeStyle = 'rgba(255,209,102,' + (0.5 + Math.sin(t * 6) * 0.4) + ')'; c.lineWidth = 4;
      c.beginPath(); c.arc(-34, -40, 30 + Math.sin(t * 6) * 3, 0, TAU); c.stroke();
    }
    c.restore();
  }

  function desenhaInterior(c, t) {
    const L = salaL(), D = dentro, W = L.W, H = L.H, ks = L.ks, cy = L.chaoY, P = L.porta;
    const rest = D.tipo === 'rest', casa = D.tipo === 'herois';
    c.fillStyle = rest ? '#ffe8cc' : (casa ? '#dbeafe' : '#fff1d6'); c.fillRect(0, 0, W, cy);
    c.fillStyle = rest ? '#ffd8a8' : (casa ? '#c7dbfb' : '#ffe5b4');
    for (let x = 0; x < W; x += 36) c.fillRect(x, 0, 16, cy);
    c.fillStyle = casa ? '#c9a27e' : '#d4a373'; c.fillRect(0, cy, W, H - cy);
    c.strokeStyle = 'rgba(120,72,36,.22)'; c.lineWidth = 2;
    for (let y = cy + 24, i = 0; y < H + 26; y += 26, i++) {
      c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
      for (let x = (i % 2) * 60; x < W; x += 120) { c.beginPath(); c.moveTo(x, y - 26); c.lineTo(x, y); c.stroke(); }
    }
    c.fillStyle = '#b5835a'; c.fillRect(0, cy - 8, W, 10);
    // a porta por onde se sai
    c.fillStyle = '#7f5539'; rr(c, P.x - P.w / 2 - 5, cy - P.h - 5, P.w + 10, P.h + 5, 6); c.fill();
    c.fillStyle = '#a0522d'; rr(c, P.x - P.w / 2, cy - P.h, P.w, P.h, 4); c.fill();
    c.fillStyle = '#ffe8a3'; c.beginPath(); c.arc(P.x, cy - P.h * 0.72, P.w * 0.22, 0, TAU); c.fill();
    c.fillStyle = '#ffd166'; c.beginPath(); c.arc(P.x + P.w * 0.3, cy - P.h * 0.42, Math.max(3, P.w * 0.07), 0, TAU); c.fill();
    G.gfx.star(c, P.x, cy - P.h - 16, 8 + Math.sin(t * 4) * 2, '#ffd166', t);
    // janela com a rua lá fora
    const jw = 70 * ks, jh = Math.min(L.kh * 0.5, 60 * ks), jy = cy - L.kh * 0.82;
    for (let x = P.x + P.w / 2 + 26; x + jw < L.kx0 - 16; x += jw + 28) {
      c.fillStyle = '#fff'; rr(c, x - 5, jy - 5, jw + 10, jh + 10, 6); c.fill();
      c.fillStyle = '#90e0ef'; rr(c, x, jy, jw, jh, 4); c.fill();
      c.fillStyle = '#a9cbe6'; c.fillRect(x + 4, jy + jh * 0.45, jw * 0.3, jh * 0.55); c.fillRect(x + jw * 0.5, jy + jh * 0.3, jw * 0.3, jh * 0.7);
      c.fillStyle = '#fff'; c.fillRect(x + jw / 2 - 2, jy, 4, jh); c.fillRect(x, jy + jh / 2 - 2, jw, 4);
      c.fillStyle = '#e63946'; rr(c, x - 10, jy - 8, 14, jh + 16, 5); c.fill(); rr(c, x + jw - 4, jy - 8, 14, jh + 16, 5); c.fill();
    }
    // a cozinha
    const kx0 = L.kx0, kx1 = L.kx1, kTop = cy - L.kh * 0.92;
    c.fillStyle = '#e9f5f9'; c.fillRect(kx0, kTop, kx1 - kx0, cy - kTop);
    c.strokeStyle = 'rgba(72,149,239,.25)'; c.lineWidth = 1.5;
    const az = 18 * ks;
    c.beginPath();
    for (let x = kx0 + az; x < kx1; x += az) { c.moveTo(x, kTop); c.lineTo(x, cy); }
    for (let y = kTop + az; y < cy; y += az) { c.moveTo(kx0, y); c.lineTo(kx1, y); }
    c.stroke();
    c.strokeStyle = '#adb5bd'; c.lineWidth = 3; c.strokeRect(kx0, kTop, kx1 - kx0, cy - kTop);
    const shY = cy - L.kh * 0.7, CT = ['#e63946', '#4361ee', '#ffb703', '#2a9d8f'];
    c.fillStyle = '#9c6644'; c.fillRect(kx0 + 8, shY, kx1 - kx0 - 16, 6 * ks);
    for (let i = 0, x = kx0 + 28 * ks; x < kx1 - 24 * ks; i++, x += 46 * ks) {
      c.fillStyle = CT[i % 4]; rr(c, x - 14 * ks, shY - 20 * ks, 28 * ks, 20 * ks, 5 * ks); c.fill();
    }
    const bw = (kx1 - kx0) * 0.26, bh = 34 * ks;
    c.fillStyle = '#e76f51'; rr(c, kx0 + 8, cy - bh, bw, bh, 4 * ks); c.fill();
    comida(c, 'pizza', kx0 + 8 + bw * 0.5, cy - bh - 12 * ks, 0.5 * ks);
    const fxp = L.fogao.x, fw = 64 * ks, fh = 30 * ks, rebordo = cy - fh - 20 * ks;
    const naCozinha = D.chef.fase === 'fogao';
    if (naCozinha) {
      c.save(); c.translate(fxp + 40 * ks, cy); c.scale(ks * 0.95, ks * 0.95);
      boneco(c, COZ, { t: t, dir: -1, fase: 0, anda: false, braco: 1.1 + Math.sin(t * 5) * 0.12 });
      c.restore();
    }
    c.fillStyle = '#6c757d'; rr(c, fxp - fw / 2, cy - fh, fw, fh, 4 * ks); c.fill();
    c.fillStyle = 'rgba(255,138,28,' + (0.5 + Math.sin(t * 7) * 0.2) + ')'; rr(c, fxp - fw * 0.28, cy - fh * 0.4, fw * 0.56, fh * 0.18, 2 * ks); c.fill();
    c.fillStyle = '#adb5bd'; rr(c, fxp - 22 * ks, rebordo, 44 * ks, 20 * ks, 5 * ks); c.fill();
    c.fillStyle = '#f4a261'; c.beginPath(); c.ellipse(fxp, rebordo, 20 * ks, 4.5 * ks, 0, 0, TAU); c.fill();
    for (let i = 0; i < 3; i++) {
      const f = (t * 0.6 + i / 3) % 1;
      c.fillStyle = 'rgba(255,255,255,' + (0.75 * (1 - f)) + ')';
      c.beginPath(); c.arc(fxp + (i - 1) * 12 * ks, rebordo - 8 * ks - f * 55 * ks, (6 + f * 10) * ks, 0, TAU); c.fill();
    }
    // a cama (na casa da família e na nossa)
    if (L.cama) {
      const B = L.cama, nossa = casa;
      cama(c, B.x, B.y, B.k * 1.25, nossa ? '#e63946' : '#ff6fb1', nossa);
      if (D.dorme) {
        dorminhoco(c, defHeroi(), B.x, B.y, B.k * 1.25, t);
        cobertor(c, B.x, B.y - 4 * B.k * 1.25, B.k * 1.25, '#1d3557');
        if (!D.dorme.cheio) zzz(c, B.x - 50 * B.k, B.y - 80 * B.k, B.k * 1.3, t);
        else for (let k = 0; k < 4; k++) { const a = t * 4 + k * 1.6; G.gfx.star(c, B.x - 40 * B.k + Math.cos(a) * 30, B.y - 90 * B.k + Math.sin(a) * 18, 7, '#ffd166', a); }
      } else {
        cobertor(c, B.x, B.y - 4 * B.k * 1.25, B.k * 1.25, nossa ? '#1d3557' : '#ff6fb1');
        if (nossa) {   // a cama "chama": toca-lhe ou carrega no 😴
          for (let k = 0; k < 2; k++) {
            const a = (t * 1.2 + k) % 2;
            c.globalAlpha = Math.max(0, 1 - a / 2);
            label(c, 'z', B.x - 40 * B.k + a * 16, B.y - 70 * B.k - a * 26, 16 + k * 5, '#4361ee', 'center');
          }
          c.globalAlpha = 1;
        }
      }
    }
    for (let i = 0; i < L.mesas.length; i++) mesaSala(c, L, i, t);
    if (D.fase === 'entra' && !D.dorme) {
      const m = L.mesas[L.heroiMesa], a = Math.min(1, D.t / 1.1);
      const x0 = P.x, y0 = cy + 10, x1 = m.x - 34 * L.k, y1 = m.y - 2 * L.k;
      const s = L.ks + (L.k - L.ks) * a;
      c.save(); c.translate(x0 + (x1 - x0) * a, y0 + (y1 - y0) * a); c.scale(s, s);
      boneco(c, defHeroi(), { t: t, dir: x1 >= x0 ? 1 : -1, fase: t * 12, anda: true });
      c.restore();
    }
    if (!naCozinha) {
      const p = chefXY(L), leva = D.chef.fase === 'vai';
      c.save(); c.translate(p.x, p.y); c.scale(p.s, p.s);
      boneco(c, COZ, { t: t, dir: p.dir, fase: t * 12, anda: D.chef.fase !== 'pousa', braco: leva ? 1 : (D.chef.fase === 'pousa' ? 0.6 : 0) });
      if (leva) comida(c, D.chef.tipo, 28 * p.dir, -59, 0.5);
      c.restore();
    }
    const cs = 12, hw = DIF.MAXC * cs * 2.2;
    c.fillStyle = 'rgba(34,34,59,.55)'; rr(c, 8, 8, hw + 84, 40, 12); c.fill();
    coracoes(c, 14 + cs, 29, cs);
    G.gfx.star(c, 28 + hw, 28, 10, '#ffd166', 0);
    label(c, '' + (G.state ? G.state.stars : 0), 42 + hw, 29, 18, '#fff', 'left', 'none');
  }

  /* ---------- testes e medições ---------- */
  S.debug = function () {
    const me = eu() || {};
    let pos = 0;
    if (fase === 'corrida' && corredores.length) { pos = classif.length + 1; for (const r of corredores) if (r !== me && !r.chegou && r.x > me.x) pos++; }
    return {
      fase: fase, ronda: ronda, heroi: defHeroi() ? defHeroi().id : null, x: Math.round(me.x || 0), y: Math.round(me.y || 0),
      pos: pos, posFinal: posFinal, tempoCorrida: +tempoCorrida.toFixed(1), cargas: me.cargas, turbo: me.turbo > 0,
      corredores: corredores.map(function (r) { return r.def.id + '@' + Math.round(r.x) + (r.chegou ? '✓' : '') + (r.buraco ? ' buraco' : '') + (r.tonto > 0 ? ' tonto' : ''); }),
      obstaculos: obst.length, perdasSeguidas: perdas,
      vidas: vidas, super: +superN.toFixed(1), descansos: descansos, descansosRonda: descRonda, acertos: acertos,
      viloes: viloes.map(function (v) { return v.def.id + ':' + v.estado + ':' + Math.max(0, v.hp).toFixed(1); }), fila: fila.length,
      policias: policias.length, tirosMaus: tirosMaus.length,
      dentro: dentro ? dentro.tipo + ':' + (dentro.dorme ? (dentro.dorme.cheio ? 'acordou' : 'dorme') : dentro.fase) + ':comeu' + dentro.n : null,
      porta: portaVis ? portaIcone : null, horn: hornIcone, piloto: piloto,
      resultados: resultados.slice(-12), lutas: lutas.slice(-6)
    };
  };
  S.api = {
    autopiloto: function (on) { piloto = on === undefined ? !piloto : !!on; return piloto; },
    fase: function () { return fase; },
    heroi: function () { return eu(); },
    corredores: function () { return corredores; },
    viloes: function () { return viloes; },
    troca: function (k) { if (k !== undefined) { hi = ((k % HEROIS().length) + HEROIS().length) % HEROIS().length; montaCorredores(); poeNaPartida(); } else trocaHeroi(); return defHeroi().id; },
    vidas: function (v) { if (v !== undefined) vidas = v; return vidas; },
    ronda: function (r) { if (r !== undefined) ronda = r; return ronda; },
    vaiLuta: function () { posFinal = 1; ganhou = true; comecaLuta(); },
    vaiCorrida: function () { vaiEscolher(); comecaContagem(); },
    acabaLuta: function () { viloes.forEach(function (v) { v.estado = 'preso'; }); fila = []; vaiFesta(); },
    entra: function (tipo) { const p = portas.find(function (q) { return q.tipo === (tipo || 'rest'); }); if (p) entraInterior(p, false); return !!dentro; },
    dorme: function () { const p = portas.find(function (q) { return q.tipo === 'herois'; }); if (!dentro) entraInterior(p, true); else if (dentro.tipo === 'herois') dentro.dorme = { t: 0 }; },
    comePrato: function () { if (dentro && dentro.prato && !dentro.come && dentro.fase === 'sentado') { dentro.come = { t: 0 }; sfx('nham'); } },
    sai: function () { saiInterior(); },
    portas: function () { return portas.map(function (p) { return { tipo: p.tipo, x: p.x }; }); },
    resultados: function () { return { corridas: resultados.slice(), lutas: lutas.slice() }; },
    obst: function () { return obst; },
    dif: DIF, meta: META, partida: PARTIDA, arena: [ARENA0, ARENA1]
  };

  G.scenes.corridamarvel = S;
})();
