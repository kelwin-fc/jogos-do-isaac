/* Cena — POKÉBOLA, o futebol dos Pokémon, ditada pelo Isaac (2026-11-12).

   "Um jogo novo do Pokémon, de bolas: nós a jogar futebol com Pokémon, o Pikachu tira
   raio e marcamos golos contra outros Pokémon. Tem de ser difícil."

   Como ficou:
   - Campo visto de cima, a bola é uma Pokébola. A nossa equipa (aro amarelo) é o Pikachu,
     o Bulbasaur, o Eevee e o Snorlax na baliza. Atacamos para a direita (ao alto: para cima).
   - Joga-se com o Pikachu. Quando um colega fica com a bola passamos a mandar nele (anel e
     seta por cima); quando a bola se perde volta-se ao Pikachu.
   - Arrastar o dedo (ou setas/WASD) para andar. ⚽ (espaço): com a bola CHUTA com mira
     assistida para o canto longe do guarda-redes (de muito longe passa a um colega mais à
     frente); sem a bola é o RAIO ⚡ do Pikachu: acerta no adversário mais perto à frente,
     que fica TONTO uns segundos (estrelinhas) e larga a bola. Ninguém se magoa.
   - 📯 (tecla B) é o SUPER RAIO ⚡⚡: um trovão que deixa tontos todos os adversários perto
     do Pikachu (até os de escudo). Depois tem de recarregar.
   - Seis equipas, cada uma mais difícil: Água, Fogo, Planta, Pedra, Fantasma e, na final,
     os Lendários. Ganhar dá a taça e passa à seguinte; depois da final há outra volta,
     mais difícil. Os adversários correm, roubam a bola, passam, rematam com força, fogem
     ao raio e, a partir da Pedra, às vezes têm escudo.
   - Nunca há derrota: se eles marcam é só "golo deles"; se o jogo acaba sem ganharmos é
     "Quase! Vamos à desforra!" e joga-se outra vez contra a mesma equipa. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  /* ---------- dificuldade: está tudo aqui para afinar ---------- */
  const DIF = {
    JOGO_T: 150, GOLOS_FIM: 5,                      // duração do jogo (s) e quem chega primeiro a 5
    V_PIKA: 240, V_COLEGA: 225, V_GR_NOS: 200,      // velocidades da nossa equipa
    V_ELES: 262, V_ELES_NIVEL: 3, V_ELES_RONDA: 10, // velocidades deles (sobe por equipa e por volta)
    V_COM_BOLA: 0.86, ACEL: 7,                      // com a bola anda-se um bocadinho mais devagar
    V_PEGA: 430,                                    // abaixo disto qualquer um domina a bola
    CHUTO_V: 900, CHUTO_LONGE: 620, ERRO_NOS: 0.05, // o nosso chuto (mira assistida) e o erro (rad)
    PASSE_V: 600,
    REMATE_V: 880, REMATE_V_NIVEL: 22, REMATE_DIST: 450, REMATE_DIST_NIVEL: 12, ERRO_ELES: 0.08,
    ROUBO_ELES: 3.5, ROUBO_ELES_NIVEL: 0.2,         // roubos por segundo quando estão encostados
    ROUBO_NOS: 1.4, ROUBO_COLEGAS: 0.6,
    PASSE_PRESSAO: 115, PASSE_P: 0.55, PENSA: 0.35,  // eles passam quando estão apertados
    PRESSAO: [2, 2, 2, 2, 3, 3],                     // quantos deles vão à bola, por equipa
    GR_ELES: 0.75, GR_ELES_NIVEL: 0.045, GR_ELES_RONDA: 0.05, GR_ELES_MAX: 0.85,
    GR_NOS: 0.5, GR_V: 210, GR_MERGULHO: 850, GR_SEGURA: 0.9, GR_SAI: 160,
    BLOQUEIO: 0.35,                                  // um remate que bate num jogador fica pelo caminho
    RAIO_CD: 2, RAIO_FALHA_CD: 0.4, RAIO_ALC: 290, RAIO_CONE: 0.8, RAIO_PERTO: 110,
    TONTO: 1.6, SOLTA_V: 60, GR_TONTO: 0.4,          // o guarda-redes (só o super raio o apanha) recupera depressa
    ESQUIVA: 0.22, ESQUIVA_NIVEL: 0.04, ESQUIVA_RONDA: 0.05, ESQUIVA_MAX: 0.45,
    ESCUDO_NIVEL: 3, ESCUDO_INT: 8, ESCUDO_INT_NIVEL: 0.8, ESCUDO_DUR: 3,
    SUPER_CD: 15, SUPER_R: 300, SUPER_TONTO: 2.6,
    PILOTO_CHUTA: 380                                // o piloto automático remata a esta distância
  };

  /* ---------- o campo (unidades do mundo) ---------- */
  const FL = 1200, FW = 720, CY = FW / 2;           // comprido, largura, meio
  const GOAL = 100, FUNDO = 44, CANTO = 90;         // meia boca da baliza, fundo da rede, cantos redondos
  const BR = 11, PR = 26, GRR = 32;                 // raios: bola, jogador, guarda-redes
  const ARTE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/';

  const NOS = {
    nome: 'Equipa Pikachu', cor: '#ffd60a',
    jog: [
      { nome: 'Pikachu', pid: 25, pika: true, home: [520, CY] },
      { nome: 'Bulbasaur', pid: 1, home: [380, CY - 180] },
      { nome: 'Eevee', pid: 133, home: [380, CY + 180] }
    ],
    gr: { nome: 'Snorlax', pid: 143 }
  };
  const EQUIPAS = [
    { id: 'agua', nome: 'Água', cor: '#4cc9f0', estadio: 'Estádio da Cascata', relva: ['#5fb36a', '#57a862'],
      jog: [{ nome: 'Squirtle', pid: 7 }, { nome: 'Psyduck', pid: 54 }, { nome: 'Poliwag', pid: 60 }], gr: { nome: 'Blastoise', pid: 9 } },
    { id: 'fogo', nome: 'Fogo', cor: '#f3722c', estadio: 'Estádio do Vulcão', relva: ['#7aa95a', '#6f9e50'],
      jog: [{ nome: 'Charmander', pid: 4 }, { nome: 'Vulpix', pid: 37 }, { nome: 'Growlithe', pid: 58 }], gr: { nome: 'Charizard', pid: 6 } },
    { id: 'planta', nome: 'Planta', cor: '#40916c', estadio: 'Estádio da Floresta', relva: ['#4fa35a', '#469850'],
      jog: [{ nome: 'Oddish', pid: 43 }, { nome: 'Bellsprout', pid: 69 }, { nome: 'Tangela', pid: 114 }], gr: { nome: 'Venusaur', pid: 3 } },
    { id: 'pedra', nome: 'Pedra', cor: '#a68a64', estadio: 'Estádio da Montanha', relva: ['#8bab62', '#81a058'],
      jog: [{ nome: 'Geodude', pid: 74 }, { nome: 'Onix', pid: 95 }, { nome: 'Rhyhorn', pid: 111 }], gr: { nome: 'Golem', pid: 76 } },
    { id: 'fantasma', nome: 'Fantasma', cor: '#9d4edd', estadio: 'Estádio da Torre Assombrada', relva: ['#4c8a5a', '#447f51'],
      jog: [{ nome: 'Gastly', pid: 92 }, { nome: 'Haunter', pid: 93 }, { nome: 'Misdreavus', pid: 200 }], gr: { nome: 'Gengar', pid: 94 } },
    { id: 'lendarios', nome: 'Lendários', cor: '#e63946', estadio: 'Estádio dos Lendários', relva: ['#5aae6e', '#50a364'], final: true,
      jog: [{ nome: 'Articuno', pid: 144 }, { nome: 'Zapdos', pid: 145 }, { nome: 'Moltres', pid: 146 }], gr: { nome: 'Mewtwo', pid: 150 } }
  ];
  const CONFETES = ['#ffd60a', '#ff4d6d', '#4cc9f0', '#06d6a0', '#9b5de5', '#ffffff', '#f77f00'];

  let jog, bola, pika, ctrlId, nivel, ronda, placar, relogio, fase, faseT, quemSai;
  let raioCd, superCd, raios, parts, textos, flash, escudoT, nid, piloto, tempo, stats, camX, camY, ultimo;

  /* ---------- ajudas ---------- */
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function difAng(a, b) { return ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI; }
  function fala(t) { if (G.audio && G.audio.fala) G.audio.fala(t); }
  function sfx(n) { if (G.audio && G.audio.sfx) G.audio.sfx(n); }
  function banner(t, ms) { if (G.banner) G.banner(t, ms); }
  function texto(t, x, y, cor) { textos.push({ t: t, x: x, y: y, cor: cor || '#ffffff', age: 0, life: 1.3 }); }
  function EQ() { return EQUIPAS[nivel]; }
  function forca() { return 1 + nivel * 0.06 + (ronda - 1) * 0.08; }
  function vEles() { return DIF.V_ELES + nivel * DIF.V_ELES_NIVEL + (ronda - 1) * DIF.V_ELES_RONDA; }
  function esquivaP() { return Math.min(DIF.ESQUIVA_MAX, DIF.ESQUIVA + nivel * DIF.ESQUIVA_NIVEL + (ronda - 1) * DIF.ESQUIVA_RONDA); }
  function grElesP() { return Math.min(DIF.GR_ELES_MAX, DIF.GR_ELES + nivel * DIF.GR_ELES_NIVEL + (ronda - 1) * DIF.GR_ELES_RONDA); }
  function sentido(eq) { return eq === 'nos' ? 1 : -1; }           // para que lado ataca cada equipa
  function balizaAlvo(eq) { return eq === 'nos' ? FL : 0; }         // a baliza onde cada equipa marca
  function grDe(eq) { return jog.find(function (p) { return p.eq === eq && p.gr; }); }
  function ctrl() { return jog.find(function (p) { return p.id === ctrlId; }) || pika; }
  function outra(eq) { return eq === 'nos' ? 'eles' : 'nos'; }
  // ao alto (telemóvel de pé) o campo roda: a nossa baliza fica em baixo e ataca-se para cima
  function retrato() { return G.H > G.W * 1.05; }

  /* ---------- imagens (PokeAPI, com plano B) ---------- */
  const imagens = {};
  function imagem(id) {
    if (imagens[id]) return imagens[id];
    const r = { img: typeof Image !== 'undefined' ? new Image() : {}, ok: false, falhou: false, tent: 0 };
    const fontes = [ARTE + 'official-artwork/' + id + '.png', ARTE + 'home/' + id + '.png'];
    r.img.crossOrigin = 'anonymous';
    r.img.onload = function () { r.ok = true; };
    r.img.onerror = function () {
      r.tent++;
      if (r.tent < fontes.length) r.img.src = fontes[r.tent];
      else r.falhou = true;
    };
    r.img.src = fontes[0];
    imagens[id] = r;
    return r;
  }

  /* ---------- entrar ---------- */
  S.enter = function () {
    nivel = 0; ronda = 1; tempo = 0; nid = 0;
    if (piloto === undefined) piloto = false;
    stats = { jogos: 0, vitorias: 0, desforras: 0, golosNos: 0, golosEles: 0, raios: 0, acertos: 0, falhados: 0,
      esquivas: 0, escudos: 0, supers: 0, tontosSuper: 0, remates: 0, rematesEles: 0, defesasNos: 0, defesasEles: 0,
      roubosEles: 0, roubosNos: 0, passesEles: 0, tacas: 0, historico: [] };
    parts = []; textos = []; raios = [];
    NOS.jog.concat([NOS.gr]).forEach(function (d) { imagem(d.pid); });
    comecaJogo();
  };

  function novoJogador(eq, d, gr, i) {
    const s = sentido(eq);
    const home = gr ? [eq === 'nos' ? 36 : FL - 36, CY] : (eq === 'nos' ? d.home : [FL - NOS.jog[i].home[0], NOS.jog[i].home[1]]);
    const v = eq === 'nos' ? (gr ? DIF.V_GR_NOS : (d.pika ? DIF.V_PIKA : DIF.V_COLEGA)) : (gr ? DIF.GR_V : vEles());
    return { id: ++nid, eq: eq, gr: !!gr, pika: !!d.pika, nome: d.nome, pid: d.pid, x: home[0], y: home[1], vx: 0, vy: 0,
      r: gr ? GRR : PR, vmax: v, home: { x: home[0], y: home[1] }, dx: s, dy: 0, tonto: 0, escudo: 0, cdPega: 0,
      segura: 0, pensa: Math.random() * DIF.PENSA, esq: 0, bloq: 0, salta: 0 };
  }

  // um jogo novo contra a equipa do nível atual
  function comecaJogo() {
    const E = EQ();
    jog = [];
    NOS.jog.forEach(function (d, i) { jog.push(novoJogador('nos', d, false, i)); });
    jog.push(novoJogador('nos', NOS.gr, true));
    E.jog.forEach(function (d, i) { jog.push(novoJogador('eles', d, false, i)); });
    jog.push(novoJogador('eles', E.gr, true));
    jog.forEach(function (p) { imagem(p.pid); });
    pika = jog.find(function (p) { return p.pika; });
    ctrlId = pika.id;
    bola = { x: FL / 2, y: CY, vx: 0, vy: 0, dono: null, ang: 0, remate: null, para: null, chuto: 0 };
    placar = { nos: 0, eles: 0 };
    relogio = DIF.JOGO_T;
    raioCd = 0; superCd = 0; flash = 0; ultimo = null;
    escudoT = DIF.ESCUDO_INT;
    camX = FL / 2; camY = CY;
    stats.jogos++;
    quemSai = 'nos';
    pontapeSaida();
    const vol = ronda > 1 ? ' (volta ' + ronda + ')' : '';
    banner('⚽ ' + E.estadio + ': contra a equipa ' + E.nome + '!' + vol, 2800);
    fala((E.final ? 'A final! ' : '') + 'Vamos jogar contra a equipa ' + E.nome + '!');
  }

  // toda a gente para o seu lugar e a equipa que sai fica com a bola no meio
  function pontapeSaida() {
    jog.forEach(function (p) {
      p.x = p.home.x; p.y = p.home.y; p.vx = 0; p.vy = 0; p.tonto = 0; p.escudo = 0; p.cdPega = 0; p.segura = 0; p.esq = 0;
      if (!p.gr) p.x = p.eq === 'nos' ? Math.min(p.x, FL / 2 - 110) : Math.max(p.x, FL / 2 + 110);
      p.dx = sentido(p.eq); p.dy = 0;
    });
    const sai = jog.find(function (p) { return p.eq === quemSai && !p.gr && (p.pika || p.nome === EQ().jog[0].nome); });
    sai.x = FL / 2 - sentido(quemSai) * (sai.r + BR + 2); sai.y = CY;
    bola.x = FL / 2; bola.y = CY; bola.vx = 0; bola.vy = 0; bola.dono = sai; bola.remate = null; bola.para = null;
    sai.cdPega = 0;
    fase = 'pronto'; faseT = 1.4;
  }

  /* ---------- update ---------- */
  S.update = function (dt) {
    dt = Math.min(dt, 1 / 30);
    tempo += dt;
    if (typeof document !== 'undefined' && document.body) document.body.classList.toggle('pokebola-super-espera', superCd > 0);
    for (const p of parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; if (p.g) p.vy += p.g * dt; }
    parts = parts.filter(function (p) { return p.t < p.life; });
    for (const tx of textos) tx.age += dt;
    textos = textos.filter(function (tx) { return tx.age < tx.life; });
    for (const r of raios) r.t += dt;
    raios = raios.filter(function (r) { return r.t < r.life; });
    flash = Math.max(0, flash - dt * 2.5);

    if (fase === 'pronto') {
      faseT -= dt;
      if (faseT <= 0) { fase = 'joga'; sfx('apito'); }
    } else if (fase === 'golo') {
      faseT -= dt;
      bolaFisica(dt);
      for (const p of jog) { p.vx *= 0.9; p.vy *= 0.9; p.x += p.vx * dt; p.y += p.vy * dt; }
      if (faseT <= 0) {
        if (placar.nos >= DIF.GOLOS_FIM || placar.eles >= DIF.GOLOS_FIM) acaba();
        else pontapeSaida();
      }
    } else if (fase === 'fim') {
      faseT -= dt;
      if (ultimo === 'ganhou' && Math.random() < dt * 30) confete();
      if (faseT <= 0) seguinte();
    } else {
      joga(dt);
    }
    camara(dt);
  };

  function joga(dt) {
    relogio -= dt;
    raioCd = Math.max(0, raioCd - dt);
    superCd = Math.max(0, superCd - dt);
    // manda-se no colega que tem a bola; sem bola nossa, volta-se ao Pikachu
    ctrlId = (bola.dono && bola.dono.eq === 'nos' && !bola.dono.gr) ? bola.dono.id : pika.id;
    const inp = piloto ? autopiloto() : leInput();
    const c = ctrl();

    // escudos deles a partir da equipa Pedra
    if (nivel >= DIF.ESCUDO_NIVEL || ronda > 1) {
      escudoT -= dt;
      if (escudoT <= 0) {
        escudoT = Math.max(3, DIF.ESCUDO_INT - nivel * DIF.ESCUDO_INT_NIVEL - (ronda - 1)) * rnd(0.8, 1.2);
        const cand = jog.filter(function (p) { return p.eq === 'eles' && !p.gr && p.tonto <= 0 && p.escudo <= 0; });
        if (cand.length) {
          const e = (bola.dono && cand.indexOf(bola.dono) >= 0 && Math.random() < 0.6) ? bola.dono : cand[Math.floor(Math.random() * cand.length)];
          e.escudo = DIF.ESCUDO_DUR; stats.escudos++;
          sfx('escudo'); texto('🛡️', e.x, e.y - 40);
        }
      }
    }

    for (const p of jog) {
      p.cdPega = Math.max(0, p.cdPega - dt);
      p.escudo = Math.max(0, p.escudo - dt);
      p.esq = Math.max(0, p.esq - dt);
      p.bloq = Math.max(0, p.bloq - dt);
      if (p.tonto > 0) {
        p.tonto -= dt;
        p.vx *= Math.exp(-6 * dt); p.vy *= Math.exp(-6 * dt);
        if (Math.random() < dt * 4) parts.push({ x: p.x + rnd(-14, 14), y: p.y - 30, vx: rnd(-20, 20), vy: -30, t: 0, life: 0.6, cor: '#ffd60a', r: 3 });
      } else if (p.esq > 0) {
        // a fugir do raio: desliza para o lado
      } else if (p === c) {
        const vm = p.vmax * (bola.dono === p ? DIF.V_COM_BOLA : 1);
        acelera(p, inp.x * vm, inp.y * vm, dt);
        if (Math.hypot(inp.x, inp.y) > 0.15) { const n = Math.hypot(inp.x, inp.y); p.dx = inp.x / n; p.dy = inp.y / n; }
        else viraPara(p, bola.x, bola.y);
      } else if (p.gr) {
        iaGR(p, dt);
      } else {
        iaCampo(p, dt);
      }
      p.x += p.vx * dt; p.y += p.vy * dt;
      paredesJog(p);
    }
    separa();

    // ações do jogador
    if (inp.fire) {
      if (bola.dono === c) chutaNosso(c);
      else if (c === pika) raio();
    }
    if (inp.super) superRaio();

    posse(dt);
    bolaFisica(dt);
    verGolo();
    if (fase === 'joga' && relogio <= 0) { relogio = 0; acaba(); }
  }

  function acelera(p, tvx, tvy, dt) {
    const k = Math.min(1, dt * DIF.ACEL);
    p.vx += (tvx - p.vx) * k; p.vy += (tvy - p.vy) * k;
  }
  function viraPara(p, x, y) {
    const d = Math.hypot(x - p.x, y - p.y);
    if (d > 1) { p.dx = (x - p.x) / d; p.dy = (y - p.y) / d; }
  }
  function vaiPara(p, x, y, v, dt) {
    const d = Math.hypot(x - p.x, y - p.y);
    if (d < 6) { acelera(p, 0, 0, dt); return; }
    const vv = Math.min(v, d * 4);
    acelera(p, (x - p.x) / d * vv, (y - p.y) / d * vv, dt);
    if (Math.hypot(p.vx, p.vy) > 30) { const n = Math.hypot(p.vx, p.vy); p.dx = p.vx / n; p.dy = p.vy / n; }
  }

  /* ---------- o input (o arrasto roda com o campo ao alto) ---------- */
  function leInput() {
    const I = G.input;
    const a = I ? I.axis() : { x: 0, y: 0 };
    const w = retrato() ? { x: -a.y, y: a.x } : a;
    return { x: w.x, y: w.y, fire: !!(I && I.justPressed('fire')), super: !!(I && I.justPressed('horn')) };
  }

  /* ---------- piloto automático (joga "bem", para medir a dificuldade) ---------- */
  function autopiloto() {
    const c = ctrl();
    const out = { x: 0, y: 0, fire: false, super: false };
    const eles = jog.filter(function (p) { return p.eq === 'eles' && !p.gr && p.tonto <= 0; });
    if (bola.dono === c) {
      // em direção à baliza, a fugir de quem está à frente
      let tx = FL - 40, ty = CY + (c.y - CY) * 0.3;
      let ax = tx - c.x, ay = ty - c.y; const n = Math.hypot(ax, ay) || 1; ax /= n; ay /= n;
      let perto = null, pd = 1e9;
      for (const e of eles) { const d = dist(e, c); if (e.x > c.x - 10 && d < pd) { pd = d; perto = e; } }
      if (perto && pd < 150) { const lado = perto.y > c.y ? -1 : 1; ay += lado * (150 - pd) / 110; }
      const m = Math.hypot(ax, ay) || 1; out.x = ax / m; out.y = ay / m;
      const dg = Math.hypot(FL - c.x, CY - c.y);
      if (dg < DIF.PILOTO_CHUTA || (perto && pd < 60 && dg < 560)) out.fire = true;
    } else if (bola.dono && bola.dono.eq === 'nos') {
      // o Snorlax tem a bola: o Pikachu vai para a frente
      const dx = 760 - c.x, dy = CY - 120 - c.y, n = Math.hypot(dx, dy) || 1;
      if (n > 20) { out.x = dx / n; out.y = dy / n; }
    } else {
      const tx = bola.x + bola.vx * 0.25, ty = bola.y + bola.vy * 0.25;
      const dx = tx - c.x, dy = ty - c.y, n = Math.hypot(dx, dy) || 1;
      if (n > 4) { out.x = dx / n; out.y = dy / n; }
      if (c === pika && raioCd <= 0) {
        const alvo = alvoRaio({ x: out.x, y: out.y });
        if (alvo && (alvo === bola.dono || dist(alvo, bola) < 120)) out.fire = true;
      }
      if (superCd <= 0 && bola.dono && bola.dono.eq === 'eles') {
        const k = jog.filter(function (p) { return p.eq === 'eles' && p.tonto <= 0 && dist(p, pika) < DIF.SUPER_R * 0.9; }).length;
        if (k >= 2 || (bola.dono.x < 300 && dist(bola.dono, pika) < DIF.SUPER_R * 0.9)) out.super = true;
      }
    }
    return out;
  }

  /* ---------- IA dos jogadores de campo (das duas equipas) ---------- */
  function iaCampo(p, dt) {
    const s = sentido(p.eq);
    const vmax = p.vmax;
    if (bola.dono === p) { iaDono(p, dt); return; }
    const nossaBola = bola.dono && bola.dono.eq === p.eq;
    // quem vai à bola: os mais perto da equipa (sem contar com o que o jogador comanda)
    const colegas = jog.filter(function (q) { return q.eq === p.eq && !q.gr && q.id !== ctrlId && q.tonto <= 0; });
    colegas.sort(function (a, b) { return dist(a, bola) - dist(b, bola); });
    const nPressa = p.eq === 'eles' ? DIF.PRESSAO[nivel] + (ronda > 1 ? 1 : 0) : 1;
    const posto = colegas.indexOf(p);
    if (bola.para === p.id) {
      vaiPara(p, bola.x + bola.vx * 0.15, bola.y + bola.vy * 0.15, vmax, dt);
      return;
    }
    if (!nossaBola) {
      let vai = posto >= 0 && posto < nPressa;
      if (p.eq === 'nos') {
        // os nossos colegas ajudam, mas só quando a bola anda perto deles ou solta
        const c = ctrl();
        vai = posto === 0 && (dist(p, bola) < 230 || (!bola.dono && dist(p, bola) < dist(c, bola)));
      }
      if (vai) {
        const t = bola.dono ? 0.1 : 0.25;
        // quem vai à bola tenta pôr-se entre a bola e a sua baliza
        const gx = balizaAlvo(outra(p.eq));
        const bx = bola.x + bola.vx * t, by = bola.y + bola.vy * t;
        const d = Math.hypot(gx - bx, CY - by) || 1;
        const off = bola.dono ? 14 : 0;
        vaiPara(p, bx + (gx - bx) / d * off, by + (CY - by) / d * off, vmax, dt);
        return;
      }
      // a defender: recua e fecha o meio
      const tx = clamp(p.home.x + (bola.x - FL / 2) * 0.55 - s * 70, 80, FL - 80);
      const ty = p.home.y * 0.55 + bola.y * 0.45;
      vaiPara(p, tx, ty, vmax * 0.9, dt);
      return;
    }
    // a apoiar o ataque: à frente da bola, abertos para receber
    const tx = clamp(bola.x + s * 170, 120, FL - 120);
    const ty = clamp(CY + (p.home.y - CY) * 1.35 + (bola.y - CY) * 0.2, 70, FW - 70);
    vaiPara(p, tx, ty, vmax * 0.85, dt);
  }

  // quem tem a bola (IA): avança, foge de quem vem, passa quando está apertado e remata perto
  function iaDono(p, dt) {
    const s = sentido(p.eq), gx = balizaAlvo(p.eq);
    const dg = Math.hypot(gx - p.x, CY - p.y);
    const rivais = jog.filter(function (q) { return q.eq !== p.eq && q.tonto <= 0; });
    let perto = null, pd = 1e9;
    for (const q of rivais) { if (q.gr) continue; const d = dist(q, p); if (d < pd) { pd = d; perto = q; } }
    p.pensa -= dt;
    if (p.pensa <= 0) {
      p.pensa = DIF.PENSA * rnd(0.7, 1.3);
      const dRem = DIF.REMATE_DIST + nivel * DIF.REMATE_DIST_NIVEL;
      if (dg < dRem) { remata(p); return; }
      if (pd < DIF.PASSE_PRESSAO && Math.random() < DIF.PASSE_P) {
        const alvo = colegaLivre(p);
        if (alvo) { passa(p, alvo); return; }
      }
    }
    let ax = gx - p.x, ay = CY - p.y; const n = Math.hypot(ax, ay) || 1; ax /= n; ay /= n;
    if (perto && pd < 170 && (perto.x - p.x) * s > -20) {
      const lado = perto.y > p.y ? -1 : 1;
      ay += lado * (170 - pd) / 100;
      if (p.y < 90) ay = Math.abs(ay); if (p.y > FW - 90) ay = -Math.abs(ay);
    }
    const m = Math.hypot(ax, ay) || 1;
    const v = p.vmax * DIF.V_COM_BOLA;
    acelera(p, ax / m * v, ay / m * v, dt);
    p.dx = ax / m; p.dy = ay / m;
  }

  // o colega mais desmarcado (de preferência mais à frente)
  function colegaLivre(p) {
    const s = sentido(p.eq);
    let melhor = null, mv = -1e9;
    for (const q of jog) {
      if (q.eq !== p.eq || q === p || q.gr || q.tonto > 0) continue;
      let livre = 1e9;
      for (const r of jog) if (r.eq !== p.eq && !r.gr) livre = Math.min(livre, segDist(r, p, q));
      const d = dist(p, q);
      if (livre < 55 || d < 90 || d > 620) continue;
      const v = Math.min(livre, 200) + (q.x - p.x) * s * 0.6;
      if (v > mv) { mv = v; melhor = q; }
    }
    return melhor;
  }
  function segDist(r, a, b) {
    const vx = b.x - a.x, vy = b.y - a.y, l = vx * vx + vy * vy || 1;
    const t = clamp(((r.x - a.x) * vx + (r.y - a.y) * vy) / l, 0, 1);
    return Math.hypot(a.x + vx * t - r.x, a.y + vy * t - r.y);
  }

  /* ---------- guarda-redes ---------- */
  function iaGR(p, dt) {
    const s = sentido(p.eq), gx = p.eq === 'nos' ? 36 : FL - 36;
    if (bola.dono === p) {
      p.segura += dt;
      acelera(p, 0, 0, dt);
      p.dx = s; p.dy = 0;
      if (p.segura > DIF.GR_SEGURA) {
        const alvo = colegaLivre(p) || jog.filter(function (q) { return q.eq === p.eq && !q.gr; })
          .sort(function (a, b) { return dist(a, p) - dist(b, p); })[0];
        if (alvo) passa(p, alvo, 1.15);
        p.segura = 0;
      }
      return;
    }
    p.segura = 0;
    const vem = (bola.vx * -s) > 120 && !bola.dono;
    let tx = gx, ty = CY + clamp((bola.y - CY) * 0.5, -(GOAL - 15), GOAL - 15), v = p.vmax;
    if (vem) {
      const tt = (gx - bola.x) / (bola.vx || 1);
      let py = bola.y + bola.vy * Math.max(0, tt);
      if (bola.remate && bola.remate.eqDef === p.eq) {
        if (bola.remate.defende) { v = DIF.GR_MERGULHO; }
        else { py += bola.remate.engano; v = p.vmax * 0.8; }   // atira-se para o lado errado
      }
      ty = clamp(py, CY - GOAL - 20, CY + GOAL + 20);
    } else if (!bola.dono && Math.abs(bola.x - gx) < DIF.GR_SAI && Math.abs(bola.y - CY) < GOAL + 70) {
      tx = bola.x; ty = bola.y;        // sai da baliza para apanhar a bola solta
    }
    vaiPara(p, tx, ty, v, dt);
    // não sai muito da baliza
    if (p.eq === 'nos') p.x = clamp(p.x, 16, 36 + DIF.GR_SAI); else p.x = clamp(p.x, FL - 36 - DIF.GR_SAI, FL - 16);
    p.y = clamp(p.y, CY - GOAL - 70, CY + GOAL + 70);
  }

  /* ---------- chutos e passes ---------- */
  function lanca(p, ang, v) {
    bola.dono = null;
    bola.x = p.x + Math.cos(ang) * (p.r + BR + 2); bola.y = p.y + Math.sin(ang) * (p.r + BR + 2);
    bola.vx = Math.cos(ang) * v; bola.vy = Math.sin(ang) * v;
    bola.chuto++;
    p.cdPega = 0.35;
    p.dx = Math.cos(ang); p.dy = Math.sin(ang);
    sfx('kick');
  }
  function passa(p, q, mult) {
    const t = dist(p, q) / DIF.PASSE_V * 0.6;
    const tx = q.x + q.vx * t, ty = q.y + q.vy * t;
    lanca(p, Math.atan2(ty - p.y, tx - p.x) + rnd(-0.04, 0.04), DIF.PASSE_V * (mult || 1));
    bola.para = q.id; bola.remate = null;
    if (p.eq === 'eles') stats.passesEles++;
  }
  // remate para o canto mais longe do guarda-redes
  function rematePara(p, v, erro, pGR) {
    const gx = balizaAlvo(p.eq), gr = grDe(outra(p.eq));
    const lado = gr && gr.y > CY ? -1 : 1;
    const ty = CY + lado * (GOAL - 22) + rnd(-12, 12);
    const ang = Math.atan2(ty - p.y, gx - p.x) + rnd(-erro, erro);
    lanca(p, ang, v);
    const dg = Math.hypot(gx - p.x, CY - p.y);
    const pd = clamp(pGR * clamp(dg / 420, 0.55, 1.15), 0.05, 0.95);
    bola.remate = { eqDef: outra(p.eq), defende: Math.random() < pd, engano: (Math.random() < 0.5 ? -1 : 1) * rnd(50, 90) };
    bola.para = null;
  }
  function remata(p) {
    stats.rematesEles++;
    rematePara(p, (DIF.REMATE_V + nivel * DIF.REMATE_V_NIVEL) * (1 + (ronda - 1) * 0.04), DIF.ERRO_ELES, DIF.GR_NOS);
  }
  function chutaNosso(c) {
    const dg = Math.hypot(FL - c.x, CY - c.y);
    if (dg > DIF.CHUTO_LONGE) {
      const q = colegaLivre(c);
      if (q && q.x > c.x + 60) { passa(c, q); return; }
    }
    stats.remates++;
    rematePara(c, DIF.CHUTO_V, DIF.ERRO_NOS, grElesP());
    parts.push({ x: bola.x, y: bola.y, vx: 0, vy: 0, t: 0, life: 0.3, cor: '#ffffff', r: 16, anel: true });
  }

  /* ---------- o raio do Pikachu ---------- */
  function alvoRaio(dir) {
    let fx = dir ? dir.x : pika.dx, fy = dir ? dir.y : pika.dy;
    const n = Math.hypot(fx, fy);
    if (n < 0.1) { fx = pika.dx; fy = pika.dy; } else { fx /= n; fy /= n; }
    const fa = Math.atan2(fy, fx);
    let melhor = null, md = 1e9;
    for (const e of jog) {
      if (e.eq !== 'eles' || e.tonto > 0 || e.gr) continue;   // o guarda-redes não (só o super raio o apanha)
      const d = dist(e, pika);
      if (d > DIF.RAIO_ALC) continue;
      const a = Math.abs(difAng(fa, Math.atan2(e.y - pika.y, e.x - pika.x)));
      if (a > DIF.RAIO_CONE && d > DIF.RAIO_PERTO) continue;
      const v = d - (e === bola.dono ? 120 : 0);   // quem tem a bola é o alvo preferido
      if (v < md) { md = v; melhor = e; }
    }
    return melhor;
  }
  function raio() {
    if (raioCd > 0) return;
    stats.raios++;
    sfx('zap');
    const e = alvoRaio();
    if (!e) {
      raioCd = DIF.RAIO_FALHA_CD;
      raios.push(bolt(pika.x, pika.y, pika.x + pika.dx * 200, pika.y + pika.dy * 200, 0.25));
      stats.falhados++;
      return;
    }
    raioCd = DIF.RAIO_CD;
    if (e.escudo > 0) {
      raios.push(bolt(pika.x, pika.y, e.x, e.y, 0.25));
      sfx('escudo'); texto('Escudo! 🛡️', e.x, e.y - 46, '#bde0fe');
      return;
    }
    if (Math.random() < esquivaP()) {
      // foge para o lado e o raio passa ao lado
      const ox = e.x, oy = e.y, lx = -(e.y - pika.y), ly = e.x - pika.x, n = Math.hypot(lx, ly) || 1, sg = Math.random() < 0.5 ? -1 : 1;
      e.vx = lx / n * sg * 430; e.vy = ly / n * sg * 430; e.esq = 0.35;
      if (e.y + e.vy * 0.35 < 40 || e.y + e.vy * 0.35 > FW - 40) { e.vx = -e.vx; e.vy = -e.vy; }
      raios.push(bolt(pika.x, pika.y, ox, oy, 0.25));
      texto('Fugiu! 💨', e.x, e.y - 46);
      stats.esquivas++;
      return;
    }
    raios.push(bolt(pika.x, pika.y, e.x, e.y, 0.3));
    atordoa(e, DIF.TONTO, pika);
    stats.acertos++;
  }
  function superRaio() {
    if (superCd > 0) return;
    superCd = DIF.SUPER_CD;
    stats.supers++;
    sfx('trovao');
    G.shake = Math.max(G.shake || 0, 0.5);
    flash = 1;
    parts.push({ x: pika.x, y: pika.y, vx: 0, vy: 0, t: 0, life: 0.6, cor: '#ffd60a', r: DIF.SUPER_R, anel: true });
    for (const e of jog) {
      if (e.eq !== 'eles' || dist(e, pika) > DIF.SUPER_R) continue;
      e.escudo = 0;
      raios.push(bolt(pika.x, pika.y, e.x, e.y, 0.5));
      atordoa(e, DIF.SUPER_TONTO, pika);
      stats.tontosSuper++;
    }
    for (let k = 0; k < 6; k++) {
      const a = rnd(0, TAU), r = rnd(80, DIF.SUPER_R);
      raios.push(bolt(pika.x, pika.y, pika.x + Math.cos(a) * r, pika.y + Math.sin(a) * r, 0.4));
    }
    texto('SUPER RAIO! ⚡⚡', pika.x, pika.y - 60, '#ffd60a');
  }
  // fica tonto (estrelinhas) e larga a bola, que salta para o lado de quem lançou o raio
  function atordoa(e, dur, de) {
    e.tonto = Math.max(e.tonto, dur * (e.gr ? DIF.GR_TONTO : 1));
    e.vx *= 0.2; e.vy *= 0.2;
    texto('Tonto! 💫', e.x, e.y - 46, '#ffd60a');
    if (bola.dono === e) {
      bola.dono = null;
      const d = dist(e, de) || 1;
      bola.vx = (de.x - e.x) / d * DIF.SOLTA_V + rnd(-40, 40);
      bola.vy = (de.y - e.y) / d * DIF.SOLTA_V + rnd(-40, 40);
      bola.remate = null; bola.para = null;
      e.cdPega = 0.6;
    }
  }
  function bolt(x0, y0, x1, y1, life) { return { x0: x0, y0: y0, x1: x1, y1: y1, t: 0, life: life, seed: Math.random() * 1000 }; }

  /* ---------- quem fica com a bola ---------- */
  function posse(dt) {
    if (bola.dono) {
      const p = bola.dono;
      if (p.tonto > 0) { bola.dono = null; return; }
      bola.x = p.x + p.dx * (p.r + BR + 1); bola.y = p.y + p.dy * (p.r + BR + 1);
      bola.vx = p.vx; bola.vy = p.vy;
      // a bola não fica do lado de fora das bordas (só pode entrar pela boca da baliza)
      bola.y = clamp(bola.y, BR, FW - BR);
      if (Math.abs(bola.y - CY) >= GOAL - BR) bola.x = clamp(bola.x, BR, FL - BR);
      // roubar: os rivais encostados à bola tiram-na de vez em quando
      for (const q of jog) {
        if (q.eq === p.eq || q.tonto > 0 || q.cdPega > 0) continue;
        if (Math.hypot(q.x - bola.x, q.y - bola.y) > q.r + BR + 6) continue;
        let taxa;
        if (q.eq === 'eles') taxa = (DIF.ROUBO_ELES + nivel * DIF.ROUBO_ELES_NIVEL) * (1 + (ronda - 1) * 0.1);
        else taxa = q.id === pika.id && ctrlId === pika.id ? DIF.ROUBO_NOS : DIF.ROUBO_COLEGAS;
        if (p.gr) taxa *= 0.3;
        if (Math.random() < taxa * dt) {
          bola.dono = q; p.cdPega = 0.7; q.cdPega = 0;
          if (q.eq === 'eles') stats.roubosEles++; else stats.roubosNos++;
          sfx('pop');
          if (q.eq === 'nos') texto('Boa! ⚽', q.x, q.y - 46, '#ffd60a');
          return;
        }
      }
      return;
    }
    const v = Math.hypot(bola.vx, bola.vy);
    let melhor = null, md = 1e9;
    for (const p of jog) {
      if (p.tonto > 0 || p.cdPega > 0) continue;
      const d = Math.hypot(p.x - bola.x, p.y - bola.y);
      if (d > p.r + BR + 4) continue;
      if (p.gr) {
        if (bola.remate && bola.remate.eqDef === p.eq && !bola.remate.defende && v > 300) continue;   // escapou-lhe
      } else if (v > DIF.V_PEGA && bola.para !== p.id) {
        // remate forte: quem está no caminho às vezes trava-o
        if (p.bloq <= 0 && bola.remate && bola.remate.eqDef === p.eq) {
          p.bloq = 0.5;
          if (Math.random() < DIF.BLOQUEIO) {
            const nx = (bola.x - p.x) / (d || 1), ny = (bola.y - p.y) / (d || 1);
            bola.vx = nx * v * 0.35 + rnd(-40, 40); bola.vy = ny * v * 0.35 + rnd(-40, 40);
            bola.remate = null; sfx('boing');
          }
        }
        continue;
      }
      if (d < md) { md = d; melhor = p; }
    }
    if (melhor) {
      if (melhor.gr && bola.remate && bola.remate.eqDef === melhor.eq && v > 300) {
        if (melhor.eq === 'nos') { stats.defesasNos++; texto('Defesa do ' + melhor.nome + '!', melhor.x, melhor.y - 50, '#ffd60a'); }
        else { stats.defesasEles++; texto('Defendeu!', melhor.x, melhor.y - 50); }
        sfx('boing');
      }
      bola.dono = melhor; bola.remate = null; bola.para = null; melhor.segura = 0;
    }
  }

  /* ---------- a bola e as bordas ---------- */
  function bolaFisica(dt) {
    if (bola.dono && fase === 'joga') return;
    bola.x += bola.vx * dt; bola.y += bola.vy * dt;
    const k = Math.exp(-1.1 * dt);
    bola.vx *= k; bola.vy *= k;
    const v = Math.hypot(bola.vx, bola.vy);
    bola.ang += v * dt / BR;
    if (v < 120 && bola.remate) bola.remate = null;
    if (v < 90) bola.para = null;
    // dentro da baliza: fica na rede
    if (bola.x < 0 || bola.x > FL) {
      if (Math.abs(bola.y - CY) < GOAL) {
        if (bola.x < -FUNDO + BR) { bola.x = -FUNDO + BR; bola.vx = Math.abs(bola.vx) * 0.2; }
        if (bola.x > FL + FUNDO - BR) { bola.x = FL + FUNDO - BR; bola.vx = -Math.abs(bola.vx) * 0.2; }
        if (bola.y < CY - GOAL + BR) { bola.y = CY - GOAL + BR; bola.vy = Math.abs(bola.vy) * 0.3; }
        if (bola.y > CY + GOAL - BR) { bola.y = CY + GOAL - BR; bola.vy = -Math.abs(bola.vy) * 0.3; }
        return;
      }
    }
    paredes(bola, BR, 0.72, true);
  }
  // campo com cantos redondos (para a bola não encravar); a boca das balizas fica aberta
  function paredes(o, r, rest, boca) {
    const naBoca = boca && Math.abs(o.y - CY) < GOAL - r * 0.3;
    if (!naBoca) {
      if (o.x < r) { o.x = r; o.vx = Math.abs(o.vx) * rest; }
      if (o.x > FL - r) { o.x = FL - r; o.vx = -Math.abs(o.vx) * rest; }
    }
    if (o.y < r) { o.y = r; o.vy = Math.abs(o.vy) * rest; }
    if (o.y > FW - r) { o.y = FW - r; o.vy = -Math.abs(o.vy) * rest; }
    const cx = o.x < CANTO ? CANTO : (o.x > FL - CANTO ? FL - CANTO : null);
    const cy = o.y < CANTO ? CANTO : (o.y > FW - CANTO ? FW - CANTO : null);
    if (cx !== null && cy !== null) {
      const dx = o.x - cx, dy = o.y - cy, d = Math.hypot(dx, dy);
      if (d > CANTO - r && d > 0) {
        const nx = dx / d, ny = dy / d;
        o.x = cx + nx * (CANTO - r); o.y = cy + ny * (CANTO - r);
        const vn = o.vx * nx + o.vy * ny;
        if (vn > 0) { o.vx -= (1 + rest) * vn * nx; o.vy -= (1 + rest) * vn * ny; }
      }
    }
  }
  function paredesJog(p) {
    paredes(p, p.r * 0.8, 0, false);
  }
  // os jogadores não ficam uns em cima dos outros
  function separa() {
    for (let i = 0; i < jog.length; i++) for (let j = i + 1; j < jog.length; j++) {
      const a = jog[i], b = jog[j];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = (a.r + b.r) * 0.85;
      if (d < m && d > 0.01) {
        const e = (m - d) / 2, nx = dx / d, ny = dy / d;
        a.x -= nx * e; a.y -= ny * e; b.x += nx * e; b.y += ny * e;
      }
    }
  }

  /* ---------- golos ---------- */
  function verGolo() {
    if (Math.abs(bola.y - CY) >= GOAL) return;
    if (bola.x > FL + BR) golo('nos');
    else if (bola.x < -BR) golo('eles');
  }
  function golo(eq) {
    placar[eq]++;
    fase = 'golo'; faseT = 2.6;
    bola.dono = null; bola.remate = null; bola.para = null;
    quemSai = outra(eq);
    if (eq === 'nos') {
      stats.golosNos++;
      sfx('golo'); sfx('multidao');
      G.shake = Math.max(G.shake || 0, 0.35);
      banner('⚽ GOLO! ' + placar.nos + ' – ' + placar.eles, 2200);
      if (G.addStars) G.addStars(3);
      if (G.ze && G.ze.diz) G.ze.diz('Boa, Isaac e Zé!');
      for (let k = 0; k < 60; k++) confete(FL - 20, CY);
      for (const p of jog) if (p.eq === 'nos' && !p.gr) { p.vx = rnd(-60, 60); p.vy = rnd(-60, 60); }
    } else {
      stats.golosEles++;
      sfx('apito');
      banner('Golo deles. Vamos lá, equipa! ' + placar.nos + ' – ' + placar.eles, 2200);
    }
  }

  /* ---------- fim de cada jogo: taça ou desforra (nunca se perde) ---------- */
  function acaba() {
    fase = 'fim';
    const ganhou = placar.nos > placar.eles;
    ultimo = ganhou ? 'ganhou' : 'desforra';
    stats.historico.push({ nivel: nivel, ronda: ronda, nos: placar.nos, eles: placar.eles, ganhou: ganhou });
    sfx('apito');
    if (ganhou) {
      stats.vitorias++;
      faseT = EQ().final ? 6 : 4.5;
      sfx('tada');
      if (G.addStars) G.addStars(EQ().final ? 25 : 10);
      if (EQ().final) {
        stats.tacas++;
        banner('🏆 CAMPEÕES POKÉMON! A taça grande é nossa!', 4500);
        fala('Campeões! Ganhámos a taça grande!');
      } else {
        banner('🏆 Ganhámos à equipa ' + EQ().nome + '! ' + placar.nos + ' – ' + placar.eles, 3500);
        fala('Ganhámos! A taça é nossa!');
      }
    } else {
      stats.desforras++;
      faseT = 3.5;
      banner('Quase! Vamos à desforra! 💪', 3000);
      fala('Quase! Vamos à desforra!');
    }
  }
  function seguinte() {
    if (ultimo === 'ganhou') {
      if (EQ().final) { nivel = 0; ronda++; }
      else nivel++;
    }
    comecaJogo();
  }
  function confete(x, y) {
    const px = x === undefined ? camX + rnd(-400, 400) : x, py = y === undefined ? camY - 300 : y;
    parts.push({ x: px, y: py, vx: rnd(-220, 220), vy: rnd(-200, 120), g: 260, t: 0, life: rnd(1.2, 2.2),
      cor: CONFETES[Math.floor(Math.random() * CONFETES.length)], r: rnd(3, 6), q: true });
  }

  /* ---------- câmara: segue a bola sem sair muito do campo ---------- */
  function escala() {
    const cruz = retrato() ? G.W : G.H, longo = retrato() ? G.H : G.W;
    return clamp(Math.min(cruz / 560, longo / 820), 0.35, 1.3);
  }
  function vista() {
    const s = escala();
    return retrato() ? { lx: G.H / s, ly: G.W / s } : { lx: G.W / s, ly: G.H / s };
  }
  function camara(dt) {
    const v = vista();
    let tx = bola.x, ty = bola.y;
    const mx = Math.max(0, (FL + 2 * FUNDO + 40 - v.lx) / 2), my = Math.max(0, (FW + 60 - v.ly) / 2);
    tx = clamp(tx, FL / 2 - mx, FL / 2 + mx);
    ty = clamp(ty, CY - my, CY + my);
    const k = Math.min(1, dt * 4);
    camX += (tx - camX) * k; camY += (ty - camY) * k;
  }

  /* ---------- desenho ---------- */
  S.draw = function (c, t) {
    const E = EQ(), s = escala(), ret = retrato();
    c.fillStyle = '#2b4a32'; c.fillRect(0, 0, G.W, G.H);
    c.save();
    c.translate(G.W / 2, G.H / 2);
    c.scale(s, s);
    if (ret) c.rotate(-Math.PI / 2);
    c.translate(-camX, -camY);
    desenhaCampo(c, E);
    // jogadores e bola por ordem de profundidade no ecrã
    const lista = jog.slice();
    const prof = function (o) { return ret ? -o.x : o.y; };
    lista.sort(function (a, b) { return prof(a) - prof(b); });
    desenhaBolaSombra(c);
    for (const p of lista) desenhaJogador(c, p, t, ret);
    desenhaBola(c, ret);
    for (const r of raios) desenhaRaio(c, r);
    for (const p of parts) {
      const a = 1 - p.t / p.life;
      c.globalAlpha = Math.max(0, a);
      if (p.anel) {
        c.strokeStyle = p.cor; c.lineWidth = 6;
        c.beginPath(); c.arc(p.x, p.y, p.r * (0.3 + 0.7 * p.t / p.life), 0, TAU); c.stroke();
      } else {
        c.fillStyle = p.cor;
        if (p.q) c.fillRect(p.x - p.r, p.y - p.r * 0.6, p.r * 2, p.r * 1.2);
        else { c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); }
      }
    }
    c.globalAlpha = 1;
    for (const tx of textos) {
      const a = 1 - tx.age / tx.life;
      emPe(c, tx.x, tx.y, ret, function () {
        c.globalAlpha = Math.max(0, a);
        c.font = 'bold 22px system-ui, sans-serif'; c.textAlign = 'center';
        c.lineWidth = 5; c.strokeStyle = 'rgba(0,0,0,0.6)';
        c.strokeText(tx.t, 0, -tx.age * 40); c.fillStyle = tx.cor; c.fillText(tx.t, 0, -tx.age * 40);
        c.globalAlpha = 1;
      });
    }
    c.restore();
    if (flash > 0) { c.fillStyle = 'rgba(255,240,150,' + (flash * 0.45) + ')'; c.fillRect(0, 0, G.W, G.H); }
    desenhaHUD(c, t);
    if (fase === 'fim') desenhaFim(c, t);
    else if (fase === 'pronto') desenhaPronto(c);
  };

  // desenhar "de pé" (texto e bonecos) mesmo com o campo rodado ao alto
  function emPe(c, x, y, ret, fn) {
    c.save(); c.translate(x, y); if (ret) c.rotate(Math.PI / 2); fn(); c.restore();
  }

  function desenhaCampo(c, E) {
    // relva às riscas
    for (let i = 0; i < 12; i++) {
      c.fillStyle = E.relva[i % 2];
      c.fillRect(i * FL / 12, 0, FL / 12 + 1, FW);
    }
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 5;
    // contorno com cantos redondos
    c.beginPath();
    c.moveTo(CANTO, 0); c.lineTo(FL - CANTO, 0); c.arc(FL - CANTO, CANTO, CANTO, -Math.PI / 2, 0);
    c.lineTo(FL, FW - CANTO); c.arc(FL - CANTO, FW - CANTO, CANTO, 0, Math.PI / 2);
    c.lineTo(CANTO, FW); c.arc(CANTO, FW - CANTO, CANTO, Math.PI / 2, Math.PI);
    c.lineTo(0, CANTO); c.arc(CANTO, CANTO, CANTO, Math.PI, Math.PI * 1.5);
    c.stroke();
    // meio-campo e círculo central (com uma Pokébola desenhada)
    c.beginPath(); c.moveTo(FL / 2, 0); c.lineTo(FL / 2, FW); c.stroke();
    c.beginPath(); c.arc(FL / 2, CY, 90, 0, TAU); c.stroke();
    c.beginPath(); c.moveTo(FL / 2 - 90, CY); c.lineTo(FL / 2 + 90, CY); c.stroke();
    c.beginPath(); c.arc(FL / 2, CY, 18, 0, TAU); c.stroke();
    // grandes áreas
    c.strokeRect(0, CY - 200, 170, 400); c.strokeRect(FL - 170, CY - 200, 170, 400);
    c.strokeRect(0, CY - 120, 60, 240); c.strokeRect(FL - 60, CY - 120, 60, 240);
    // balizas: rede atrás da linha (a nossa com aro amarelo, a deles com a cor deles)
    desenhaBaliza(c, 0, -1, NOS.cor);
    desenhaBaliza(c, FL, 1, E.cor);
  }
  function desenhaBaliza(c, x, lado, cor) {
    const x0 = lado < 0 ? x - FUNDO : x;
    c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(x0, CY - GOAL, FUNDO, GOAL * 2);
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1.5;
    c.beginPath();
    for (let yy = CY - GOAL; yy <= CY + GOAL; yy += 14) { c.moveTo(x0, yy); c.lineTo(x0 + FUNDO, yy); }
    for (let xx = x0; xx <= x0 + FUNDO; xx += 11) { c.moveTo(xx, CY - GOAL); c.lineTo(xx, CY + GOAL); }
    c.stroke();
    c.strokeStyle = cor; c.lineWidth = 7;
    c.beginPath(); c.moveTo(x, CY - GOAL); c.lineTo(x + lado * FUNDO, CY - GOAL); c.lineTo(x + lado * FUNDO, CY + GOAL); c.lineTo(x, CY + GOAL); c.stroke();
    c.fillStyle = '#ffffff';
    c.beginPath(); c.arc(x, CY - GOAL, 7, 0, TAU); c.arc(x, CY + GOAL, 7, 0, TAU); c.fill();
  }

  function desenhaJogador(c, p, t, ret) {
    const E = EQ();
    const cor = p.eq === 'nos' ? NOS.cor : E.cor;
    const r = p.r;
    // sombra e aro da equipa no chão
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.beginPath(); c.arc(p.x + 4, p.y + 4, r, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.beginPath(); c.arc(p.x, p.y, r, 0, TAU); c.fill();
    c.strokeStyle = cor; c.lineWidth = p.gr ? 8 : 6;
    if (p.gr) c.setLineDash([10, 6]);
    c.beginPath(); c.arc(p.x, p.y, r, 0, TAU); c.stroke();
    c.setLineDash([]);
    // o controlado: anel branco a pulsar
    if (p.id === ctrlId && fase !== 'fim') {
      c.strokeStyle = 'rgba(255,255,255,' + (0.6 + 0.4 * Math.sin(t * 8)) + ')'; c.lineWidth = 4;
      c.beginPath(); c.arc(p.x, p.y, r + 9, 0, TAU); c.stroke();
    }
    // escudo: bolha azul
    if (p.escudo > 0) {
      c.fillStyle = 'rgba(120,200,255,0.25)'; c.strokeStyle = 'rgba(160,220,255,0.9)'; c.lineWidth = 3;
      c.beginPath(); c.arc(p.x, p.y, r + 16, 0, TAU); c.fill(); c.stroke();
    }
    emPe(c, p.x, p.y, ret, function () {
      const im = imagem(p.pid);
      const tam = r * 2.5;
      const bob = Math.hypot(p.vx, p.vy) > 40 ? Math.abs(Math.sin(t * 12 + p.id)) * 4 : 0;
      if (p.tonto > 0) c.rotate(Math.sin(t * 10) * 0.18);
      if (im.ok) {
        c.drawImage(im.img, -tam / 2, -tam * 0.72 - bob, tam, tam);
      } else {
        c.fillStyle = cor; c.beginPath(); c.arc(0, -r * 0.3 - bob, r * 0.9, 0, TAU); c.fill();
        c.fillStyle = '#1b1b1b'; c.font = 'bold ' + Math.round(r) + 'px system-ui, sans-serif';
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(p.nome[0], 0, -r * 0.3 - bob); c.textBaseline = 'alphabetic';
      }
      // estrelinhas à volta da cabeça
      if (p.tonto > 0) {
        c.font = '16px system-ui, sans-serif'; c.textAlign = 'center';
        for (let k = 0; k < 3; k++) {
          const a = t * 5 + k * TAU / 3;
          c.fillText('⭐', Math.cos(a) * r * 0.9, -tam * 0.75 + Math.sin(a) * 7);
        }
      }
      // a seta por cima do controlado
      if (p.id === ctrlId && fase !== 'fim') {
        const yy = -tam * 0.85 - 10 + Math.sin(t * 6) * 4;
        c.fillStyle = '#ffd60a'; c.strokeStyle = '#1b1b1b'; c.lineWidth = 2.5;
        c.beginPath(); c.moveTo(-11, yy - 14); c.lineTo(11, yy - 14); c.lineTo(0, yy); c.closePath(); c.fill(); c.stroke();
        if (p.pika) {
          c.font = 'bold 13px system-ui, sans-serif'; c.textAlign = 'center';
          c.fillText(raioCd > 0 ? '' : '⚡', 0, yy - 18);
        }
      }
    });
  }

  function desenhaBolaSombra(c) {
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.beginPath(); c.arc(bola.x + 3, bola.y + 3, BR, 0, TAU); c.fill();
  }
  // a bola é uma Pokébola a rolar
  function desenhaBola(c) {
    c.save(); c.translate(bola.x, bola.y); c.rotate(bola.ang);
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(0, 0, BR, 0, TAU); c.fill();
    c.fillStyle = '#e63946'; c.beginPath(); c.arc(0, 0, BR, Math.PI, TAU); c.fill();
    c.strokeStyle = '#1b1b1b'; c.lineWidth = 2;
    c.beginPath(); c.arc(0, 0, BR, 0, TAU); c.stroke();
    c.beginPath(); c.moveTo(-BR, 0); c.lineTo(BR, 0); c.stroke();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(0, 0, BR * 0.35, 0, TAU); c.fill(); c.stroke();
    c.restore();
  }
  // raio em zigue-zague amarelo com miolo branco
  function desenhaRaio(c, r) {
    const a = 1 - r.t / r.life;
    const dx = r.x1 - r.x0, dy = r.y1 - r.y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    const n = Math.max(4, Math.round(l / 28));
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const f = i / n, j = (i === 0 || i === n) ? 0 : (Math.sin(r.seed + i * 12.9 + r.t * 40) * 16);
      pts.push([r.x0 + dx * f + nx * j, r.y0 + dy * f + ny * j]);
    }
    c.globalAlpha = Math.max(0, a);
    c.lineJoin = 'round';
    [[12, 'rgba(255,214,10,0.45)'], [6, '#ffd60a'], [2.5, '#ffffff']].forEach(function (st) {
      c.strokeStyle = st[1]; c.lineWidth = st[0];
      c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
      c.stroke();
    });
    c.globalAlpha = 1;
  }

  /* ---------- HUD: placar no topo ao centro, recargas em baixo à esquerda ---------- */
  function cara(c, pid, x, y, r, cor) {
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    const im = imagem(pid);
    if (im.ok) c.drawImage(im.img, x - r * 1.1, y - r * 1.1, r * 2.2, r * 2.2);
    c.strokeStyle = cor; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
  }
  function desenhaHUD(c, t) {
    const E = EQ();
    const k = clamp(Math.min(G.W, G.H) / 420, 0.75, 1.15);
    const w = 236 * k, h = 50 * k;
    let y = 8;
    if (G.W / 2 + w / 2 > G.W - 118) y = 66;          // não tapar o 🏠/🔊 no telemóvel ao alto
    const x = G.W / 2 - w / 2;
    c.fillStyle = 'rgba(15,25,45,0.82)';
    roundRect(c, x, y, w, h, 14 * k); c.fill();
    cara(c, 25, x + 26 * k, y + h / 2, 17 * k, NOS.cor);
    cara(c, E.gr.pid, x + w - 26 * k, y + h / 2, 17 * k, E.cor);
    c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'bold ' + Math.round(28 * k) + 'px system-ui, sans-serif';
    c.fillText(placar.nos + ' – ' + placar.eles, G.W / 2, y + h * 0.42);
    const mm = Math.floor(Math.ceil(relogio) / 60), ss = Math.ceil(relogio) % 60;
    c.font = 'bold ' + Math.round(12 * k) + 'px system-ui, sans-serif';
    c.fillStyle = '#ffd60a';
    c.fillText('⚡ ' + mm + ':' + (ss < 10 ? '0' : '') + ss + '  ·  ' + E.nome, G.W / 2, y + h * 0.82);
    // por baixo: o estádio e o nível
    c.font = Math.round(12 * k) + 'px system-ui, sans-serif';
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,0.5)';
    const lin = E.estadio + ' · ' + (nivel + 1) + '/' + EQUIPAS.length + (ronda > 1 ? ' · volta ' + ronda : '');
    c.strokeText(lin, G.W / 2, y + h + 12 * k); c.fillText(lin, G.W / 2, y + h + 12 * k);
    c.textBaseline = 'alphabetic';
    // anéis de recarga do raio e do super raio (canto de baixo à esquerda)
    const rr = 26 * k, bx = 16 + rr, by = G.H - 16 - rr;
    anel(c, bx, by, rr, superCd / DIF.SUPER_CD, '⚡⚡', t);
    anel(c, bx + rr * 2 + 14, by + rr * 0.35, rr * 0.65, raioCd / DIF.RAIO_CD, '⚡', t);
  }
  function anel(c, x, y, r, falta, ic, t) {
    const pronto = falta <= 0;
    c.fillStyle = pronto ? 'rgba(255,214,10,' + (0.85 + 0.15 * Math.sin(t * 6)) + ')' : 'rgba(15,25,45,0.75)';
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    if (!pronto) {
      c.strokeStyle = '#ffd60a'; c.lineWidth = 4;
      c.beginPath(); c.arc(x, y, r - 3, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - clamp(falta, 0, 1))); c.stroke();
    }
    c.font = 'bold ' + Math.round(r * 0.75) + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = pronto ? '#1b1b1b' : 'rgba(255,255,255,0.6)';
    c.fillText(ic, x, y + 1); c.textBaseline = 'alphabetic';
  }
  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }
  function desenhaPronto(c) {
    c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'bold ' + Math.round(clamp(G.W / 12, 26, 52)) + 'px system-ui, sans-serif';
    c.lineWidth = 6; c.strokeStyle = 'rgba(0,0,0,0.5)';
    const txt = placar.nos + placar.eles === 0 && relogio >= DIF.JOGO_T - 0.01 ? 'Vamos jogar! ⚽' : 'Pronto... ⚽';
    c.strokeText(txt, G.W / 2, G.H * 0.42); c.fillText(txt, G.W / 2, G.H * 0.42);
    c.textBaseline = 'alphabetic';
  }
  function desenhaFim(c, t) {
    c.fillStyle = 'rgba(10,20,40,0.45)'; c.fillRect(0, 0, G.W, G.H);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const big = clamp(Math.min(G.W, G.H) / 4, 70, 170);
    if (ultimo === 'ganhou') {
      c.font = Math.round(big * (1 + 0.06 * Math.sin(t * 5))) + 'px system-ui, sans-serif';
      c.fillText('🏆', G.W / 2, G.H * 0.4);
      c.font = 'bold ' + Math.round(big * 0.28) + 'px system-ui, sans-serif';
      c.fillStyle = '#ffd60a'; c.lineWidth = 6; c.strokeStyle = 'rgba(0,0,0,0.6)';
      const txt = EQ().final ? 'Campeões Pokémon!' : 'Ganhámos! ' + placar.nos + ' – ' + placar.eles;
      c.strokeText(txt, G.W / 2, G.H * 0.4 + big * 0.75); c.fillText(txt, G.W / 2, G.H * 0.4 + big * 0.75);
    } else {
      c.font = Math.round(big * 0.8) + 'px system-ui, sans-serif';
      c.fillText('💪⚡', G.W / 2, G.H * 0.4);
      c.font = 'bold ' + Math.round(big * 0.26) + 'px system-ui, sans-serif';
      c.fillStyle = '#ffffff'; c.lineWidth = 6; c.strokeStyle = 'rgba(0,0,0,0.6)';
      c.strokeText('Quase! Vamos à desforra!', G.W / 2, G.H * 0.4 + big * 0.7);
      c.fillText('Quase! Vamos à desforra!', G.W / 2, G.H * 0.4 + big * 0.7);
    }
    c.textBaseline = 'alphabetic';
  }

  /* ---------- testes ---------- */
  S.debug = function () {
    const c = ctrl();
    return {
      fase: fase, nivel: nivel, equipa: EQ().nome, estadio: EQ().estadio, ronda: ronda,
      placar: { nos: placar.nos, eles: placar.eles }, relogio: +relogio.toFixed(1),
      controlado: c.nome, piloto: piloto, retrato: retrato(),
      bola: { x: Math.round(bola.x), y: Math.round(bola.y), v: Math.round(Math.hypot(bola.vx, bola.vy)), dono: bola.dono ? bola.dono.nome : null, remate: !!bola.remate },
      raioCd: +raioCd.toFixed(2), superCd: +superCd.toFixed(2),
      tontos: jog.filter(function (p) { return p.tonto > 0; }).map(function (p) { return p.nome; }),
      escudos: jog.filter(function (p) { return p.escudo > 0; }).map(function (p) { return p.nome; }),
      esquivaP: +esquivaP().toFixed(2), grElesP: +grElesP().toFixed(2), vEles: vEles(),
      stats: stats
    };
  };
  S.api = {
    autopiloto: function (on) { piloto = on === undefined ? !piloto : !!on; return piloto; },
    nivel: function (n, r) { nivel = clamp(n | 0, 0, EQUIPAS.length - 1); if (r) ronda = r; comecaJogo(); return EQ().nome; },
    joga: function () { if (fase === 'pronto') { fase = 'joga'; faseT = 0; } },   // salta a contagem do início
    acaba: function () { if (fase === 'joga' || fase === 'golo' || fase === 'pronto') { relogio = 0; acaba(); } },
    marca: function (eq) { if (fase === 'joga') golo(eq === 'eles' ? 'eles' : 'nos'); },
    raio: function () { if (fase === 'joga') raio(); },
    superRaio: function () { if (fase === 'joga') superRaio(); },
    jogadores: function () { return jog; },
    bola: function () { return bola; },
    placar: function () { return { nos: placar.nos, eles: placar.eles }; },
    stats: function () { return stats; },
    equipas: EQUIPAS,
    dif: DIF
  };

  G.scenes = G.scenes || {};
  G.scenes.pokebola = S;
})();
