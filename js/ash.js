/* Cena — O ASH E O PIKACHU, ditada pelo Isaac.

   "O Ash atira a Pokébola e sai o Pikachu. O Pikachu tem de derrotar os outros que
   estão à frente dele, e caminha, e tem de ir para outra cidade. Derrota-os e fica com
   esse poder, e fica com fogo ou, por exemplo, eletricidade."

   Como ficou:
   - Abre com o Ash a atirar a Pokébola: ela abre-se e sai o Pikachu.
   - O caminho vai de cidade em cidade (infinito). Em cada caminho há Pokémon selvagens
     de um tipo (água, fogo, planta, pedra, gelo, fantasma) que NÃO deixam passar: é
     preciso derrotá-los. Derrotar = ficam tontos (estrelinhas à volta da cabeça) e o
     Ash apanha-os com uma Pokébola. Ninguém se magoa.
   - Ao derrotar um Pokémon de um tipo novo, o Pikachu FICA COM ESSE PODER: o botão de
     ataque passa a atirar fogo, água, folhas... e o 🔄 troca de poder.
   - A ordem das cidades é de propósito: o poder que se ganha num caminho é SUPER EFICAZ
     no caminho seguinte (eletricidade > água, água > fogo, fogo > planta...), por isso
     cada poder novo serve logo para alguma coisa.
   - Em cada cidade há um Centro Pokémon (passar à porta enche os corações) e um
     GINÁSIO com um Pokémon grande; ganhar-lhe dá uma insígnia e abre o caminho.
   - Sem corações não há derrota: o Ash vem a correr com uma poção e continua-se.

   3.ª ronda (pedido do Isaac): CAIXINHAS-surpresa no caminho (no chão e no ar, é
   preciso saltar) com poção, bola de campo de força ou estrelas; TRANSFORMAR-NOS nos
   Pokémon que apanhámos (tocar na cara deles no HUD; a do Pikachu volta atrás); e a
   BOLA DE CAMPO DE FORÇA (🛡️): enquanto está ligada, os ataques deles batem na bola e
   não nos tiram corações. Depois tem de recarregar.

   As imagens dos Pokémon vêm da PokeAPI, como na Memória Pokémon (exceção aprovada à
   regra de zero ficheiros). Sem internet desenham-se bonecos de plano B. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  const ARTE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/';
  const RUN = 310, JUMPV = 770, GRAV = 1600;
  const ROTA = 3400, CID = 1500, L = ROTA + CID;   // um caminho + uma cidade
  const TIRO = 640, ALCANCE = 720;
  const MAXCOR = 5;                                 // corações do Pikachu

  /* ---------- poderes ---------- */
  const POD = {
    eletrico: { e: '⚡', cor: '#ffd60a', escura: '#b08900', nome: 'eletricidade', som: 'zap' },
    agua: { e: '💧', cor: '#4cc9f0', escura: '#1f6f99', nome: 'água', som: 'splash' },
    fogo: { e: '🔥', cor: '#ff6d00', escura: '#a33b00', nome: 'fogo', som: 'whoosh' },
    planta: { e: '🍃', cor: '#52b788', escura: '#22643f', nome: 'folhas', som: 'ninja' },
    pedra: { e: '⛰️', cor: '#a68a64', escura: '#5e4b32', nome: 'pedra', som: 'canhao' },
    gelo: { e: '❄️', cor: '#a8e6ff', escura: '#3d7ea6', nome: 'gelo', som: 'teia' },
    fantasma: { e: '👻', cor: '#9d4edd', escura: '#4a1a75', nome: 'fantasma', som: 'poof' }
  };
  // quem é forte contra quem
  const FORTE = {
    eletrico: ['agua'], agua: ['fogo', 'pedra'], fogo: ['planta', 'gelo'],
    planta: ['agua', 'pedra'], pedra: ['fogo', 'gelo'], gelo: ['planta'], fantasma: ['fantasma']
  };

  /* ---------- cidades (a ordem faz o poder novo servir no caminho seguinte) ---------- */
  const TEMAS = [
    { tipo: 'agua', cidade: 'Cidade do Mar', ceu: ['#5bc0ff', '#d6f4ff'], chao: '#f2d49b', chao2: '#d9b26f',
      selv: [7, 54, 60, 129, 118, 116, 158, 393], chefe: 9 },
    { tipo: 'fogo', cidade: 'Cidade do Vulcão', ceu: ['#ff8c5a', '#ffe1b8'], chao: '#9c5b3c', chao2: '#6e3b24',
      selv: [4, 37, 58, 77, 155, 255, 390], chefe: 6 },
    { tipo: 'planta', cidade: 'Cidade da Floresta', ceu: ['#7cd1ff', '#e3fbd9'], chao: '#5cb85c', chao2: '#3e8e41',
      selv: [1, 43, 69, 152, 252, 387, 191], chefe: 3 },
    { tipo: 'pedra', cidade: 'Cidade da Pedra', ceu: ['#9fb8d6', '#efe6d6'], chao: '#9a8f80', chao2: '#6b6258',
      selv: [74, 95, 27, 111, 246, 104], chefe: 248 },
    { tipo: 'gelo', cidade: 'Cidade da Neve', ceu: ['#9fd8ff', '#f4fbff'], chao: '#f1f7ff', chao2: '#c6dcef',
      selv: [86, 220, 361, 363, 215, 459], chefe: 144 },
    { tipo: 'fantasma', cidade: 'Cidade da Noite', ceu: ['#1d1442', '#5a3d8a'], chao: '#3d3360', chao2: '#2a2245',
      selv: [92, 93, 200, 355, 353, 425], chefe: 94 }
  ];
  const NOMES = {
    7: 'Squirtle', 54: 'Psyduck', 60: 'Poliwag', 129: 'Magikarp', 118: 'Goldeen', 116: 'Horsea', 158: 'Totodile',
    393: 'Piplup', 9: 'Blastoise', 4: 'Charmander', 37: 'Vulpix', 58: 'Growlithe', 77: 'Ponyta', 155: 'Cyndaquil',
    255: 'Torchic', 390: 'Chimchar', 6: 'Charizard', 1: 'Bulbasaur', 43: 'Oddish', 69: 'Bellsprout',
    152: 'Chikorita', 252: 'Treecko', 387: 'Turtwig', 191: 'Sunkern', 3: 'Venusaur', 74: 'Geodude', 95: 'Onix',
    27: 'Sandshrew', 111: 'Rhyhorn', 246: 'Larvitar', 104: 'Cubone', 248: 'Tyranitar', 86: 'Seel', 220: 'Swinub',
    361: 'Snorunt', 363: 'Spheal', 215: 'Sneasel', 459: 'Snover', 144: 'Articuno', 92: 'Gastly', 93: 'Haunter',
    200: 'Misdreavus', 355: 'Duskull', 353: 'Shuppet', 425: 'Drifloon', 94: 'Gengar', 25: 'Pikachu'
  };
  const VOAM = { 92: 1, 93: 1, 200: 1, 355: 1, 353: 1, 425: 1, 144: 1, 6: 1 };
  const GRANDES = { 95: 1.45, 111: 1.15, 9: 1, 129: 0.95 };

  const TIPO = { 25: 'eletrico' }, CHEFE = {};
  for (const tm of TEMAS) { for (const id of tm.selv) TIPO[id] = tm.tipo; TIPO[tm.chefe] = tm.tipo; CHEFE[tm.chefe] = 1; }
  const CAMPO = 3.5, CAMPO_RECARGA = 6;

  /* 5.ª ronda de pedidos do Isaac (2026-10-16): "entramos numa casa qualquer, sai uma
     pessoa qualquer e podemos fazer o que essa pessoa faz, tipo comer — e há MUITAS
     comidas, não é só ficar cheio e acabou". E "se o Pikachu se magoa forte tem de ir
     ao hospital, à médica, e quando chegamos lá põem-nos bem". */
  const PESSOAS = [
    { nome: 'a avó', pele: '#f1c27d', cabelo: '#d9d9d9', estilo: 'carrapito', roupa: '#c77dff', calca: '#5a189a' },
    { nome: 'o avô', pele: '#e0ac69', cabelo: '#cfcfcf', estilo: 'careca', roupa: '#588157', calca: '#344e41', oculos: true },
    { nome: 'a mãe', pele: '#f6d1a8', cabelo: '#6f4518', estilo: 'comprido', roupa: '#ff6fb1', calca: '#3a86ff' },
    { nome: 'o pai', pele: '#c68642', cabelo: '#2b2118', estilo: 'curto', roupa: '#3a86ff', calca: '#283618' },
    { nome: 'a menina', pele: '#ffdbac', cabelo: '#e09f3e', estilo: 'comprido', roupa: '#ffd60a', calca: '#ef476f', pequena: true },
    { nome: 'o menino', pele: '#8d5524', cabelo: '#111111', estilo: 'curto', roupa: '#06d6a0', calca: '#073b4c', pequena: true },
    { nome: 'o cozinheiro', pele: '#f1c27d', cabelo: '#5c3d2e', estilo: 'chapeu', roupa: '#ffffff', calca: '#495057' }
  ];
  const MEDICA = { nome: 'a médica', pele: '#ffe0bd', cabelo: '#ff7eb6', estilo: 'medica', roupa: '#ffb3d1', calca: '#ffffff' };
  const COMIDAS = ['🍎', '🍌', '🍓', '🍇', '🍉', '🍰', '🧁', '🍪', '🍩', '🍦', '🍕', '🍔', '🥕', '🥐',
    '🍙', '🧀', '🍫', '🥞', '🍒', '🍐', '🌽', '🥪', '🍝', '🍭'];
  const PRATO = [[340, 300], [410, 300], [480, 300], [550, 300], [340, 342], [410, 342], [480, 342], [550, 342]];
  const PORTA_SAI = { x: 790, y: 250, w: 90, h: 220 };      // a porta para sair, lá dentro
  const DOI = [[-34, -112], [30, -86], [-6, -60]];          // onde dói, no Pikachu deitado
  const CHANSEY = 113;

  function tema(k) { return TEMAS[((k % TEMAS.length) + TEMAS.length) % TEMAS.length]; }
  function etapaDe(x) { return Math.floor(x / L); }
  function cidadeX(k) { return k * L + ROTA; }
  function pcX(k) { return cidadeX(k) + 380; }
  function chefeX(k) { return cidadeX(k) + 900; }
  function ginasioX(k) { return cidadeX(k) + 1000; }
  const CASAS_X = [40, 560, 1350];                          // onde estão as casas, dentro da cidade
  function portasDe(k) {
    if (k < 0) return [];
    const cx = cidadeX(k);
    return [
      { x: cx + CASAS_X[0] + 70, tipo: 'casa', k: k, i: 0 },
      { x: pcX(k), tipo: 'hospital', k: k, i: 9 },
      { x: cx + CASAS_X[1] + 70, tipo: 'casa', k: k, i: 1 },
      { x: cx + CASAS_X[2] + 70, tipo: 'casa', k: k, i: 2 }
    ];
  }

  /* ---------- imagens (PokeAPI, com plano B) ---------- */
  const imagens = {};
  function imagem(id) {
    if (imagens[id]) return imagens[id];
    const r = { img: new Image(), ok: false, falhou: false, tent: 0 };
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

  /* ---------- estado ---------- */
  let hero, ash, maus, chefes, tiros, balas, bolas, orbes, sparks, puffs, coins;
  let camX, fireCd, poderes, poder, fase, faseT, insignias, apanhados, criadas, hudBtns, superCd, avisoT;
  let equipa, campo, campoCd, campoEspera, caixasAbertas, premios;
  let dentro, amb, mimos;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function h01(n) { const s = Math.sin(n * 127.1) * 43758.5; return s - Math.floor(s); }
  // ecrãs baixinhos (e telemóvel ao alto) desenham o mundo mais pequeno
  function vscale() { return Math.min(1, G.H / 620, G.W / 480); }
  function vw() { return G.W / vscale(); }
  function vh() { return G.H / vscale(); }
  // a linha do chão fica sempre acima dos botões (lição das viúvas, em telemóvel deitado)
  // ao alto há duas filas de botões em baixo (◀ ▶ ⚡ e 🔄 ⬆): o chão fica por cima das duas
  function chaoY() {
    const reserva = G.W < 560 && G.H > G.W ? 236 : 122;
    return Math.min(vh() * 0.84, Math.max(vh() * 0.5, (G.H - reserva) / vscale()));
  }
  function sy(alt) { return chaoY() - alt; }
  function fala(t, tom) { if (G.audio.fala) G.audio.fala(t, false, tom); }

  S.enter = function () {
    hero = { x: 330, alt: 0, vy: 0, dir: 1, walk: 0, grounded: true, inv: 0, tonto: 0, atk: 0, cor: MAXCOR, nasce: 0, forma: 25 };
    ash = { x: 170, dir: 1, walk: 0, lanca: 0 };
    maus = []; chefes = {}; tiros = []; balas = []; bolas = []; orbes = []; sparks = []; puffs = [];
    coins = {}; criadas = {}; hudBtns = [];
    camX = 0; fireCd = 0; superCd = 0; avisoT = 0;
    poderes = ['eletrico']; poder = 'eletrico';
    insignias = 0; apanhados = 0;
    equipa = []; campo = 0; campoCd = 0; campoEspera = false; caixasAbertas = {}; premios = [];
    document.body.classList.remove('ash-campo-espera', 'ash-dentro');
    dentro = null; amb = null; mimos = {};
    imagem(CHANSEY);
    fase = 'intro'; faseT = 0;
    imagem(25);
    for (const id of tema(0).selv) imagem(id);
    imagem(tema(0).chefe);
    botaoPoder();
  };

  function botaoPoder() {
    const b = document.getElementById('btnFire');
    if (b) b.textContent = POD[poder].e;
  }

  // cada etapa nasce quando o Pikachu se aproxima: os selvagens do caminho e o chefe do ginásio
  function criaEtapa(k) {
    if (criadas[k]) return;
    criadas[k] = true;
    const tm = tema(k), ciclo = Math.floor(k / TEMAS.length);
    for (let i = 0; i < 6; i++) {
      const id = tm.selv[Math.floor(h01(k * 13.1 + i * 3.7) * tm.selv.length)];
      imagem(id);
      maus.push({
        id: id, tipo: tm.tipo, x: k * L + 900 + i * 420 + h01(k * 7 + i) * 120, alt: 0, base: 0,
        D: 112 * (GRANDES[id] || 1), hp: 4 + ciclo, max: 4 + ciclo, voa: !!VOAM[id],
        estado: 'anda', t: rnd(0, 5), cd: rnd(1.0, 1.8), pisca: 0, k: k, chefe: false,
        vy: 0, desvio: 0, desvioAlvo: 0, reage: 0, escudo: 0, escCd: 0
      });
    }
    imagem(tm.chefe);
    const c = {
      id: tm.chefe, tipo: tm.tipo, x: chefeX(k), alt: 0, base: 0, D: 230, hp: 12 + k * 2, max: 12 + k * 2,
      voa: !!VOAM[tm.chefe], estado: 'anda', t: 0, cd: 1.5, pisca: 0, k: k, chefe: true, alto: false,
      vy: 0, desvio: 0, desvioAlvo: 0, reage: 0, escudo: 0, escCd: 0
    };
    chefes[k] = c;
    maus.push(c);
    // prepara as imagens da etapa seguinte para não aparecerem vazias
    for (const id of tema(k + 1).selv) imagem(id);
  }

  function spark(x, alt, n, col) {
    for (let i = 0; i < n; i++) sparks.push({ x: x, alt: alt, vx: rnd(-160, 160), vy: rnd(40, 260), t: 0, life: rnd(0.4, 0.9), col: col });
  }
  function puff(x, alt, n, col) {
    for (let i = 0; i < (n || 8); i++) puffs.push({ x: x + rnd(-20, 20), alt: alt + rnd(0, 40), r: rnd(12, 26), t: 0, life: rnd(0.5, 0.9), col: col || '#ffffff' });
  }

  function ativos() { return maus.filter(function (m) { return m.estado === 'anda'; }); }
  function centroAlt(m) { return m.alt + m.D * 0.42; }

  function levaToque() {
    if (hero.inv > 0 || fase !== 'jogo' || campo > 0) return;
    hero.inv = 1.5; hero.tonto = 0.9;
    hero.cor = Math.max(0, hero.cor - 1);
    G.audio.sfx('ouch'); G.shake = 0.25;
    spark(hero.x, hero.alt + 50, 7, '#ffd166');
    if (hero.cor <= 0) {                // magoou-se forte: vem a ambulância e vai ao hospital
      fase = 'ambulancia'; faseT = 0;
      balas = [];
      amb = { x: camX - 260, dentro: false, volta: hero.x };
      G.audio.sfx('sirene');
      G.banner('Ai! O Pikachu magoou-se! 🚑', 2600);
      fala('Ai! O Pikachu magoou-se muito! Vamos ao hospital!');
    }
  }

  // transformar-se num Pokémon apanhado (25 = voltar a ser o Pikachu)
  function transforma(id) {
    if (hero.forma === id) return;
    hero.forma = id;
    imagem(id);
    puff(hero.x, hero.alt + 30, 12, '#ffffff');
    spark(hero.x, hero.alt + 60, 16, POD[TIPO[id] || 'eletrico'].cor);
    G.audio.sfx('suit');
    const tipo = TIPO[id] || 'eletrico';
    if (poderes.indexOf(tipo) < 0) poderes.push(tipo);
    poder = tipo; botaoPoder();
    if (id === 25) { G.banner('Pikachu outra vez! ⚡', 1800); fala('Pikachu outra vez!'); }
    else { G.banner('Agora és o ' + NOMES[id] + '! ✨', 2000); fala('Agora és o ' + NOMES[id] + '!'); }
  }

  function ligaCampo(seg) {
    campo = Math.max(campo, seg); campoCd = campo + CAMPO_RECARGA;
    G.audio.sfx('escudo');
    spark(hero.x, hero.alt + 50, 12, '#a0e7ff');
  }
  // o botão 🛡️ fica apagadinho enquanto recarrega
  function botaoCampo() {
    const espera = campo <= 0 && campoCd > 0;
    if (espera !== campoEspera) {
      campoEspera = espera;
      document.body.classList.toggle('ash-campo-espera', espera);
    }
  }

  // caixinhas-surpresa: 4 por caminho, algumas no ar (é preciso saltar)
  function caixasEntre(a, b) {
    const out = [];
    for (let k = Math.max(0, etapaDe(a)); k <= etapaDe(b); k++) {
      for (let j = 0; j < 4; j++) {
        const local = 650 + j * 680 + h01(k * 3.3 + j) * 200;
        if (local > ROTA - 250) continue;
        const q = h01(k * 9.1 + j * 2.7);
        out.push({
          key: k + ':' + j, x: k * L + local,
          alt: h01(k * 5.7 + j * 1.9) > 0.55 ? 150 : 0,
          dentro: q < 0.34 ? 'pocao' : (q < 0.67 ? 'campo' : 'estrelas')
        });
      }
    }
    return out;
  }
  function abreCaixa(cx) {
    caixasAbertas[cx.key] = 1;
    puff(cx.x, cx.alt + 20, 8, '#e9c46a');
    G.audio.sfx('pop');
    premios.push({ x: cx.x, alt: cx.alt + 40, tipo: cx.dentro, t: 0 });
    if (cx.dentro === 'pocao') {
      hero.cor = Math.min(MAXCOR, hero.cor + 2);
      G.audio.sfx('heart');
      G.banner('Uma poção! 💗', 1600);
    } else if (cx.dentro === 'campo') {
      ligaCampo(6);
      G.banner('Bola de campo de força! 🛡️', 1800);
      fala('Campo de força!');
    } else {
      G.addStars(5);
      G.audio.sfx('star');
      G.banner('Cinco estrelas! ⭐', 1500);
    }
  }

  /* ---------- entrar nas casas e no hospital ---------- */
  function portaPerto() {
    if (!hero.grounded) return null;
    for (const d of portasDe(etapaDe(hero.x))) if (Math.abs(hero.x - d.x) < 70) return d;
    return null;
  }

  function novoPrato() {
    const l = COMIDAS.slice().sort(function () { return Math.random() - 0.5; });
    return PRATO.map(function (pos, i) { return { e: l[i], x: pos[0], y: pos[1], comida: false }; });
  }

  function entra(porta, volta) {
    const hosp = porta.tipo === 'hospital';
    const pes = hosp ? MEDICA : PESSOAS[Math.floor(h01(porta.k * 7.7 + porta.i * 3.1) * PESSOAS.length)];
    const faz = hosp ? 'curar' : (h01(porta.k * 2.9 + porta.i * 5.3) < 0.7 ? 'comer' : 'dancar');
    const dores = hosp ? Math.min(3, Math.max(hero.cor <= 0 ? 3 : 0, MAXCOR - hero.cor)) : 0;
    dentro = {
      tipo: porta.tipo, pessoa: pes, faz: faz, k: porta.k, t: 0, volta: volta !== undefined ? volta : porta.x,
      comidas: novoPrato(), voando: [], recarga: 0, nham: 0, come: 0, comeE: '', estrelas: 0, prato: 1,
      danca: 0, dancas: 0,
      marcas: DOI.slice(0, dores).map(function (d) { return { dx: d[0], dy: d[1], feito: 0 }; }),
      curado: dores === 0, fimT: 0, fx: []
    };
    fase = 'dentro'; faseT = 0;
    document.body.classList.add('ash-dentro');
    G.audio.sfx('door');
    if (hosp) {
      if (dores) fala('Olá Pikachu! Eu sou a médica. Onde é que dói? Toca no dói-dói.');
      else {
        fala('Olá Pikachu! Estás ótimo! Toma um miminho.');
        if (!mimos[porta.k]) { mimos[porta.k] = 1; G.addStars(1); G.audio.sfx('star'); }
      }
    } else if (faz === 'comer') fala('Olá Pikachu! Sou ' + pes.nome + '. Senta-te, vamos comer!');
    else fala('Olá Pikachu! Sou ' + pes.nome + '. Vamos dançar!');
  }

  function sai() {
    const d = dentro;
    dentro = null;
    fase = 'jogo'; faseT = 0;
    document.body.classList.remove('ash-dentro');
    hero.x = d.volta; hero.alt = 0; hero.vy = 0; hero.grounded = true; hero.inv = Math.max(hero.inv, 1.5);
    ash.x = hero.x - 130;
    balas = [];
    // quem estava muito perto recua um bocadinho
    for (const m of ativos()) if (m.x > hero.x && m.x - hero.x < 380) m.x = hero.x + 380;
    puff(hero.x, 20, 8, '#ffffff');
    G.audio.sfx('door');
  }

  // a área de 900×620 onde se desenha lá dentro, centrada no ecrã
  function layoutDentro() {
    const k = Math.min(G.W / 900, G.H / 620);
    return { k: k, ox: (G.W - 900 * k) / 2, oy: (G.H - 620 * k) / 2 };
  }

  function dentroFx(x, y, n, col) {
    for (let i = 0; i < n; i++) dentro.fx.push({ x: x, y: y, vx: rnd(-140, 140), vy: rnd(-220, -60), t: 0, life: rnd(0.4, 0.8), col: col });
  }

  function dentroUpdate(dt) {
    const d = dentro, inp = G.input;
    d.t += dt;
    d.nham = Math.max(0, d.nham - dt);
    d.come = Math.max(0, d.come - dt);
    d.danca = Math.max(0, d.danca - dt);
    for (let i = d.fx.length - 1; i >= 0; i--) {
      const f = d.fx[i];
      f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 400 * dt;
      if (f.t > f.life) d.fx.splice(i, 1);
    }
    // a comida voa do prato para a boca do Pikachu: nham!
    for (let i = d.voando.length - 1; i >= 0; i--) {
      const v = d.voando[i];
      v.t += dt;
      if (v.t >= 0.45) {
        d.voando.splice(i, 1);
        d.nham = 0.35;
        G.audio.sfx('nham');
        if (hero.cor < MAXCOR) { hero.cor++; G.audio.sfx('heart'); }
        else if (d.estrelas < 8) { d.estrelas++; G.addStars(1); }
        dentroFx(225, 300, 6, '#ffd166');
      }
    }
    // acabou a comida? vem mais, e mais (há MUITAS comidas)
    if (d.faz === 'comer' && d.comidas.every(function (q) { return q.comida; }) && !d.voando.length) {
      d.recarga += dt;
      if (d.recarga > 0.9) {
        d.recarga = 0; d.prato++;
        d.comidas = novoPrato();
        G.audio.sfx('pop');
        fala(d.prato % 2 ? 'Mais comida!' : 'Ainda há mais!');
      }
    }
    // no hospital: depois dos curativos todos fica bom e volta ao caminho
    if (d.tipo === 'hospital' && d.curado && d.marcas.length) {
      d.fimT += dt;
      if (d.fimT > 2.6) { sai(); return; }
    }
    if (inp.justPressed('down') && d.curado) { sai(); return; }

    if (!inp.tap) return;
    const L = layoutDentro();
    const x = (inp.tap.x - L.ox) / L.k, y = (inp.tap.y - L.oy) / L.k;
    if (d.curado && x > PORTA_SAI.x - 10 && x < PORTA_SAI.x + PORTA_SAI.w + 10 && y > PORTA_SAI.y - 10 && y < PORTA_SAI.y + PORTA_SAI.h + 10) {
      sai(); return;
    }
    if (d.faz === 'comer') {
      for (const q of d.comidas) {
        if (q.comida || Math.hypot(x - q.x, y - q.y) > 38) continue;
        q.comida = true;
        d.voando.push({ e: q.e, x0: q.x, y0: q.y, t: 0 });
        // a pessoa faz o mesmo: também come
        d.come = 0.7; d.comeE = q.e;
        G.audio.sfx('whoosh');
        break;
      }
    } else if (d.faz === 'dancar') {
      if (Math.hypot(x - 450, y - 230) < 70 || (y > 250 && y < 480 && x > 120 && x < 780)) {
        if (d.danca <= 0) {
          d.danca = 2.2; d.dancas++;
          G.audio.sfx('tada'); G.audio.sfx('suit');
          if (hero.cor < MAXCOR) { hero.cor++; G.audio.sfx('heart'); }
          if (d.dancas <= 3) G.addStars(1);
          dentroFx(450, 220, 10, '#ff6fb1');
        }
      }
    } else {
      for (const m of d.marcas) {
        if (m.feito || Math.hypot(x - (400 + m.dx), y - (430 + m.dy)) > 40) continue;
        m.feito = 1;
        G.audio.sfx('pop');
        hero.cor = Math.min(MAXCOR, hero.cor + Math.ceil(MAXCOR / d.marcas.length));
        dentroFx(400 + m.dx, 430 + m.dy, 8, '#ff8fab');
        if (d.marcas.every(function (q) { return q.feito; })) {
          d.curado = true; hero.cor = MAXCOR;
          G.audio.sfx('tada');
          fala('Pronto! Já estás bom, Pikachu!');
        } else fala(['Já está!', 'Mais um!', 'Muito bem!'][Math.floor(Math.random() * 3)]);
        break;
      }
    }
  }

  // a ambulância vem buscar o Pikachu, ele entra, e ela vai para o hospital
  function ambulanciaUpdate(dt) {
    const alvo = hero.x - 30;
    if (faseT < 1.3) amb.x += (alvo - amb.x) * Math.min(1, dt * 4);
    else if (!amb.dentro) {
      amb.dentro = true;
      puff(hero.x, 30, 8, '#ffffff');
      G.audio.sfx('door');
    }
    if (faseT > 1.7) amb.x += 900 * dt * Math.min(1, (faseT - 1.7) * 2);
    if (faseT > 3.0) {
      amb = null;
      G.audio.sfx('sirene');
      entra({ tipo: 'hospital', k: etapaDe(hero.x), i: 9, x: hero.x }, hero.x);
    }
  }

  function atirar() {
    const p = POD[poder];
    // a mira fica marcada no momento em que se atira, à altura do Pokémon no chão
    // (ou no ar, se voa): quem salta na hora certa faz o ataque passar por baixo
    let alvo = null, md = 760;
    for (const m of maus) {
      if (m.estado !== 'anda') continue;
      const dx = (m.x - hero.x) * hero.dir;
      if (dx > -20 && dx < md) { md = dx; alvo = m; }
    }
    const mira = alvo ? (alvo.voa ? centroAlt(alvo) : alvo.D * 0.42) : hero.alt + 42;
    tiros.push({ x: hero.x + hero.dir * 40, x0: hero.x, alt: hero.alt + 42, mira: mira, dir: hero.dir, tipo: poder, t: 0 });
    hero.atk = 0.22;
    G.audio.sfx(p.som);
  }

  function acerta(m, tipo, x, alt) {
    const forte = FORTE[tipo].indexOf(m.tipo) >= 0;
    m.hp -= forte ? 2 : 1;
    m.pisca = 0.3;
    m.x += forte ? 34 : 18;
    spark(x, alt, forte ? 12 : 6, POD[tipo].cor);
    if (forte) {
      G.audio.sfx('trovao');
      if (superCd <= 0) { superCd = 7; G.banner('SUPER EFICAZ! 💥', 1300); fala('É super eficaz!'); }
    } else G.audio.sfx('pop');
    if (m.hp <= 0) derrota(m);
  }

  function derrota(m) {
    m.estado = 'tonto'; m.t = 0; m.hp = 0;
    G.audio.sfx('boing');
    if (m.chefe) {
      G.banner(NOMES[m.id] + ' ficou tonto! 💫', 2200);
      return;
    }
    // o poder fica com o Pikachu: uma bola de energia voa para ele
    orbes.push({ x: m.x, alt: centroAlt(m), tipo: m.tipo, t: 0 });
  }

  function ganhaPoder(tipo) {
    if (poderes.indexOf(tipo) >= 0) { G.addStars(1); return; }
    poderes.push(tipo);
    poder = tipo;
    botaoPoder();
    G.audio.sfx('suit'); G.shake = 0.3;
    spark(hero.x, hero.alt + 60, 24, POD[tipo].cor);
    G.addStars(3);
    G.banner('Poder novo: ' + POD[tipo].e + ' ' + POD[tipo].nome.toUpperCase() + '!', 3000);
    fala('O Pikachu ganhou o poder de ' + POD[tipo].nome + '!');
  }

  // o Ash atira a Pokébola ao Pokémon tonto
  function lancaBola(m) {
    m.estado = 'espera'; m.t = 0;
    ash.lanca = 0.5;
    bolas.push({ x0: ash.x + 20, a0: 130, alvo: m, t: 0, dur: 0.75, fase: 'voa', abana: 0 });
    G.audio.sfx('whoosh');
  }

  /* ---------- atualização ---------- */
  S.update = function (dt, t) {
    const W = vw(), inp = G.input;
    faseT += dt;
    superCd = Math.max(0, superCd - dt);
    avisoT = Math.max(0, avisoT - dt);

    if (fase === 'intro') { introUpdate(dt); efeitos(dt); return; }

    hero.inv = Math.max(0, hero.inv - dt);
    hero.tonto = Math.max(0, hero.tonto - dt);
    hero.atk = Math.max(0, hero.atk - dt);
    hero.nasce = Math.max(0, hero.nasce - dt);

    const k = etapaDe(hero.x);
    criaEtapa(k); criaEtapa(k + 1);

    if (fase === 'ambulancia') { ambulanciaUpdate(dt); efeitos(dt); return; }
    if (fase === 'dentro') { dentroUpdate(dt); return; }

    // ---- andar ----
    const ax = inp.axis();
    let mv = 0;
    if (inp.isHeld('left')) mv -= 1;
    if (inp.isHeld('right')) mv += 1;
    if (mv === 0) mv = Math.abs(ax.x) > 0.25 ? Math.sign(ax.x) : 0;
    const vel = RUN * (hero.tonto > 0 ? 0.45 : 1);
    if (mv !== 0) {
      hero.x = Math.max(80, hero.x + mv * vel * dt);
      hero.dir = mv; hero.walk += dt * 13;
    }
    // não se passa por quem ainda não foi derrotado: é preciso ganhar-lhes
    let bloqueio = Infinity, quemBloqueia = null;
    for (const m of maus) {
      if (m.estado !== 'anda') continue;
      if (m.x < hero.x - 20) continue;
      const lim = m.x - (m.D * (m.chefe ? 0.42 : 0.36) + 34);
      if (lim < bloqueio) { bloqueio = lim; quemBloqueia = m; }
    }
    if (hero.x > bloqueio) {
      hero.x = bloqueio;
      if (avisoT <= 0 && quemBloqueia) {
        avisoT = 4;
        G.banner(quemBloqueia.chefe ? 'Ganha ao Pokémon do ginásio! ' + POD[poder].e : 'Derrota o ' + NOMES[quemBloqueia.id] + ' para passar! ' + POD[poder].e, 2200);
      }
    }

    if ((inp.justPressed('jump') || inp.justPressed('up')) && hero.grounded) {
      hero.vy = JUMPV; hero.grounded = false; G.audio.sfx('hop');
    }
    hero.vy -= GRAV * dt; hero.alt += hero.vy * dt;
    hero.grounded = false;
    if (hero.alt <= 0) { hero.alt = 0; hero.vy = 0; hero.grounded = true; }
    camX = Math.max(0, hero.x - Math.max(W * 0.3, 200));   // o Ash, atrás, também cabe

    // ---- trocar de poder (🔄 ou tocar nos desenhos dos poderes) ----
    if (inp.justPressed('horn') && poderes.length > 1) {
      poder = poderes[(poderes.indexOf(poder) + 1) % poderes.length];
      botaoPoder(); G.audio.sfx('pop');
      spark(hero.x, hero.alt + 60, 8, POD[poder].cor);
    }
    if (inp.tap) {
      const hk = hudK(), tx = inp.tap.x / hk, ty = inp.tap.y / hk;
      for (const b of hudBtns) {
        if (Math.abs(tx - b.x) < b.r + 6 && Math.abs(ty - b.y) < b.r + 6) {
          if (b.forma !== undefined) transforma(b.forma);
          else if (poder !== b.tipo) { poder = b.tipo; botaoPoder(); G.audio.sfx('pop'); spark(hero.x, hero.alt + 60, 8, POD[poder].cor); }
        }
      }
    }

    // ---- atacar ----
    fireCd -= dt;
    if ((inp.justPressed('fire') || inp.isHeld('fire')) && fireCd <= 0 && hero.tonto <= 0) {
      fireCd = 0.36;
      atirar();
    }
    campo = Math.max(0, campo - dt); campoCd = Math.max(0, campoCd - dt);
    // ⬇ à porta de uma casa (ou tocar na casa) é entrar; senão o ⬇/🛡️ faz o campo de força
    const porta = portaPerto();
    let entrar = porta && inp.justPressed('down');
    if (!entrar && inp.tap) {
      const vs = vscale(), wx = inp.tap.x / vs + camX, wy = inp.tap.y / vs, base = sy(0);
      for (const d of portasDe(etapaDe(hero.x))) {
        if (Math.abs(wx - d.x) < 85 && wy > base - 240 && wy < base + 30 && Math.abs(hero.x - d.x) < 260) { entrar = d; break; }
      }
    }
    if (entrar) { entra(entrar === true ? porta : entrar); return; }
    if ((inp.justPressed('door') || inp.justPressed('down')) && campoCd <= 0) ligaCampo(CAMPO);
    botaoCampo();
    if (inp.justPressed('debug9')) {            // teste: salta para a porta do ginásio
      hero.x = chefeX(k) - 600; ash.x = hero.x - 130;
      for (const m of maus) if (!m.chefe && m.k === k && m.estado === 'anda') { m.estado = 'apanhado'; }
    }

    // ---- os nossos ataques (com mira assistida em altura) ----
    for (let i = tiros.length - 1; i >= 0; i--) {
      const s = tiros[i];
      s.t += dt;
      s.x += s.dir * TIRO * dt;
      if (Math.abs(s.x - s.x0) > ALCANCE) { tiros.splice(i, 1); continue; }
      s.alt += Math.max(-520 * dt, Math.min(520 * dt, s.mira - s.alt));
      let bateu = false;
      for (const m of maus) {
        if (m.estado !== 'anda') continue;
        // com o escudo ligado, o ataque faz "boing" na bolha antes de chegar ao corpo
        if (m.escudo > 0 && Math.abs(s.x - m.x) < m.D * 0.58 && Math.abs(s.alt - centroAlt(m)) < m.D * 0.6) {
          spark(s.x, s.alt, 6, '#ffffff'); G.audio.sfx('boing');
          bateu = true; break;
        }
        if (Math.abs(s.x - m.x) < m.D * 0.36 && Math.abs(s.alt - centroAlt(m)) < m.D * 0.48) {
          acerta(m, s.tipo, s.x, s.alt); bateu = true; break;
        }
      }
      if (bateu) tiros.splice(i, 1);
    }

    // ---- os ataques deles: lentos e baixinhos (salta-se por cima) ----
    for (let i = balas.length - 1; i >= 0; i--) {
      const b = balas[i];
      b.t += dt;
      b.x += b.dir * b.v * dt;
      b.alt += (b.altAlvo - b.alt) * Math.min(1, dt * 3);
      if (Math.abs(b.x - hero.x) > W * 1.3 || b.t > 6) { balas.splice(i, 1); continue; }
      if (campo > 0 && Math.abs(b.x - hero.x) < 74 && Math.abs(b.alt - (hero.alt + 46)) < 80) {
        spark(b.x, b.alt, 6, '#a0e7ff'); G.audio.sfx('boing');
        balas.splice(i, 1); continue;
      }
      if (Math.abs(b.x - hero.x) < 34 && Math.abs(b.alt - (hero.alt + 32)) < 38) {
        puff(b.x, b.alt, 6, POD[b.tipo].cor);
        balas.splice(i, 1);
        levaToque();
        if (fase !== 'jogo') break;      // a poção limpa os ataques todos: a lista ficou vazia
      }
    }

    // ---- Pokémon ----
    const frente = (function () {
      let f = null;
      for (const m of maus) {
        if (m.estado !== 'anda' || m.x < hero.x - 40) continue;
        if (!f || m.x < f.x) f = m;
      }
      return f;
    })();
    const parar = Math.min(320, W * 0.55);

    for (let i = maus.length - 1; i >= 0; i--) {
      const m = maus[i];
      m.t += dt; m.pisca = Math.max(0, m.pisca - dt);
      if (m.estado === 'apanhado' || (m.x < camX - 1600 && m.estado === 'anda' && !m.chefe)) { maus.splice(i, 1); continue; }

      if (m.estado === 'tonto' || m.estado === 'espera') {
        // tonto, desce até ao chão (quem voa ou estava a meio de um salto) para a Pokébola o apanhar
        m.alt = Math.max(0, m.alt - 160 * dt);
        if (m.estado === 'tonto') {
          if (m.chefe) { if (m.t > 2.0) chefeVencido(m); }
          else if (m.t > 1.1) lancaBola(m);
        }
        continue;
      }
      if (m.estado !== 'anda') continue;

      // saltar (com gravidade, como o Pikachu) ou, quem voa, fugir para cima/baixo
      m.reage = Math.max(0, m.reage - dt);
      m.escudo = Math.max(0, m.escudo - dt);
      m.escCd = Math.max(0, m.escCd - dt);
      const noChao = !m.voa && m.alt <= 0;
      if (m.voa) {
        m.desvio += (m.desvioAlvo - m.desvio) * Math.min(1, dt * 7);
        if (Math.abs(m.desvioAlvo - m.desvio) < 6) m.desvioAlvo *= Math.pow(0.2, dt);
        m.alt = 70 + Math.sin(m.t * 2.2) * 22 + (m.chefe ? 40 : 0) + m.desvio;
      } else {
        m.vy -= GRAV * dt; m.alt += m.vy * dt;
        if (m.alt <= 0) { m.alt = 0; m.vy = 0; }
      }

      const d = m.x - hero.x;
      const naVista = d < W * 0.78 && d > -W * 0.3;

      // ESQUIVAR e DEFENDER (pedido do Isaac): quando vê um ataque a chegar,
      // salta por cima, foge no ar ou liga um escudo
      if (naVista && m.reage <= 0) {
        for (const s of tiros) {
          const vem = (m.x - s.x) * s.dir;
          if (vem < 40 || vem > 250 || Math.abs(s.alt - centroAlt(m)) > m.D * 0.55) continue;
          const pEsq = Math.min(0.6, 0.4 + m.k * 0.04 + (m.chefe ? 0.05 : 0));
          const pDef = m.escCd > 0 ? 0 : Math.min(0.3, 0.16 + m.k * 0.03);
          const r = Math.random();
          if (r < pEsq && (m.voa || noChao)) {
            if (m.voa) m.desvioAlvo = m.desvio > 20 ? -70 : 110;
            else m.vy = m.chefe ? 620 : 720;
            G.audio.sfx('hop');
            m.reage = rnd(1.0, 1.5);
          } else if (r < pEsq + pDef) {
            m.escudo = m.chefe ? 1.4 : 1.1; m.escCd = rnd(3, 4.5);
            G.audio.sfx('escudo');
            m.reage = rnd(1.0, 1.5);
          } else m.reage = 0.45;     // desta vez não reagiu: volta a olhar daqui a nada
          break;
        }
      }

      // o da frente vem ter connosco e ataca muito; o de trás, se estiver à vista, também ataca
      const ataca = naVista && (m === frente || (d < W * 0.7 && d > 0));
      if (m === frente && naVista && d > parar) {
        m.x -= (m.chefe ? 70 : 95) * dt;
        if (noChao && Math.random() < dt * 0.7) m.vy = 380;
      }
      if (ataca) {
        m.cd -= dt;
        if (m.cd <= 0 && d < W * 0.75 && m.escudo <= 0) {
          const ciclo = Math.floor(m.k / TEMAS.length);
          m.cd = m.chefe ? rnd(1.0, 1.6) : Math.max(0.9, rnd(1.3, 2.0) - ciclo * 0.25);
          if (m !== frente) m.cd *= 1.8;
          // às vezes atiram por cima: só apanha quem salta à toa
          const alto = Math.random() < (m.chefe ? 0.35 : 0.18);
          balas.push({
            x: m.x - m.D * 0.3, alt: centroAlt(m), altAlvo: alto ? 150 : 32, dir: -1,
            v: Math.min(360, 260 + m.k * 12) * (m.chefe ? 1.1 : 1), tipo: m.tipo, t: 0
          });
          G.audio.sfx(POD[m.tipo].som);
        }
      }
    }

    // ---- Pokébolas do Ash: voa → abana 3 vezes → clic! ----
    for (let i = bolas.length - 1; i >= 0; i--) {
      const b = bolas[i];
      b.t += dt;
      const m = b.alvo;
      if (b.fase === 'voa') {
        if (b.t >= b.dur) {
          b.fase = 'abana'; b.t = 0;
          m.estado = 'dentro';
          puff(m.x, centroAlt(m), 10, '#ff4d4d');
          G.audio.sfx('pop');
        }
      } else if (b.fase === 'abana') {
        const n = Math.floor(b.t / 0.5);
        if (n > b.abana && n <= 3) { b.abana = n; G.audio.sfx('clic'); }
        if (b.t > 1.7) {
          b.fase = 'fim'; b.t = 0;
          m.estado = 'apanhado';
          apanhados++;
          equipa = equipa.filter(function (x) { return x !== m.id; });
          equipa.push(m.id);
          G.addStars(2);
          G.audio.sfx('tada');
          spark(m.x, 30, 14, '#ffd166');
          ash.diz = 1.6; ash.nome = (m.chefe ? 'o ' : 'um ') + NOMES[m.id];
          if (m.chefe) {
            G.banner('Apanhaste o ' + NOMES[m.id] + '! 🎉', 2600);
            if (G.audio.fala) G.audio.fala('Apanhei o ' + NOMES[m.id] + '!', true);   // na fila, a seguir à insígnia
            G.addStars(5);
          } else if (apanhados === 1 || apanhados % 5 === 0) fala('Apanhei um ' + NOMES[m.id] + '!');
        }
      } else if (b.t > 0.6) bolas.splice(i, 1);
    }

    // ---- bolas de poder a voar para o Pikachu ----
    for (let i = orbes.length - 1; i >= 0; i--) {
      const o = orbes[i];
      o.t += dt;
      if (o.t < 0.5) { o.alt += 60 * dt; continue; }
      const dx = hero.x - o.x, da = hero.alt + 50 - o.alt;
      const dist = Math.hypot(dx, da);
      const v = 520 + o.t * 300;
      if (dist < 30) { orbes.splice(i, 1); ganhaPoder(o.tipo); continue; }
      o.x += dx / dist * v * dt; o.alt += da / dist * v * dt;
    }

    // ---- o Ash vem atrás ----
    ash.lanca = Math.max(0, ash.lanca - dt);
    ash.diz = Math.max(0, (ash.diz || 0) - dt);
    const quer = hero.x - 130;
    if (Math.abs(quer - ash.x) > 6) {
      const passo = Math.max(-380 * dt, Math.min(380 * dt, (quer - ash.x) * Math.min(1, dt * 5)));
      ash.x += passo;
      if (Math.abs(passo) > 0.4) { ash.walk += dt * 11; ash.dir = Math.sign(passo); }
    } else ash.dir = 1;

    // ---- à porta de uma casa ou do hospital: aparece o 🚪 (e diz-se uma vez) ----
    const pp = portaPerto();
    if (pp && pp !== hero.ultimaPorta) {
      hero.ultimaPorta = pp;
      if (pp.tipo === 'hospital' && hero.cor < MAXCOR) G.banner('A médica põe-te bom! Toca na porta 🚪', 2200);
    } else if (!pp) hero.ultimaPorta = null;

    // ---- estrelas pelo caminho ----
    const i0 = Math.floor((camX - 300) / 260), i1 = Math.floor((camX + W + 300) / 260);
    for (let i = Math.max(0, i0); i <= i1; i++) {
      if (!estrelaEm(i)) continue;
      if (coins[i]) continue;
      const sx = i * 260 + 80, sa = 60 + h01(i * 5.1) * 120;
      if (Math.abs(sx - hero.x) < 44 && Math.abs(sa - (hero.alt + 40)) < 60) {
        coins[i] = 1; G.addStars(1); G.audio.sfx('star'); spark(sx, sa, 5, '#ffd166');
      }
    }
    for (const kk in coins) if (+kk < i0 - 20) delete coins[kk];

    // ---- caixinhas-surpresa: encostar (ou saltar contra elas) abre-as ----
    for (const cx of caixasEntre(camX - 200, camX + W + 200)) {
      if (caixasAbertas[cx.key]) continue;
      if (Math.abs(cx.x - hero.x) < 54 && hero.alt + 84 > cx.alt && hero.alt < cx.alt + 60) abreCaixa(cx);
    }

    efeitos(dt);
  };

  function estrelaEm(i) {
    const x = i * 260 + 80, local = x - etapaDe(x) * L;
    return local > 420 && local < ROTA - 200 && h01(i * 2.3) > 0.35;
  }

  // ganhar ao do ginásio dá a insígnia, o poder dele, e o Ash também o apanha
  // (pedido do Isaac: "também devo conseguir apanhar os grandes")
  function chefeVencido(m) {
    m.estado = 'espera'; m.t = 0;
    insignias++;
    G.addStars(10);
    G.audio.sfx('golo'); G.shake = 0.4;
    spark(m.x, 160, 30, '#ffd166');
    const tm = tema(m.k);
    G.banner('Insígnia! 🏅 Próxima cidade ▶', 3600);
    fala('Ganhaste a insígnia da ' + tm.cidade + '! Vamos para a próxima cidade!');
    // também se fica com o poder do Pokémon do ginásio
    orbes.push({ x: m.x, alt: 120, tipo: m.tipo, t: 0 });
    lancaBola(m);
  }

  function introUpdate(dt) {
    // 0.0–0.5 Ash prepara · 0.5 atira · 1.35 a bola abre e sai o Pikachu · 2.6 começa
    camX = 0;
    if (faseT > 0.35 && !ash.atirou) {
      ash.atirou = true; ash.lanca = 0.5; G.audio.sfx('whoosh');
      fala('Eu escolho-te, Pikachu!');
    }
    ash.lanca = Math.max(0, ash.lanca - dt);
    if (faseT > 1.35 && !ash.abriu) {
      ash.abriu = true; hero.nasce = 0.6;
      puff(hero.x, 40, 14, '#ffffff'); spark(hero.x, 60, 16, '#ffd60a');
      G.audio.sfx('zap'); G.shake = 0.2;
    }
    if (faseT > 2.0 && !ash.pika) { ash.pika = true; fala('Pika pika!', 1.8); }
    hero.nasce = Math.max(0, hero.nasce - dt);
    if (faseT > 2.7) {
      fase = 'jogo'; faseT = 0;
      G.banner('Vai para a cidade! ▶  Ataca ⚡', 3200);
    }
  }

  function efeitos(dt) {
    for (let i = premios.length - 1; i >= 0; i--) {
      const pr = premios[i];
      pr.t += dt; pr.alt += 70 * dt;
      if (pr.t > 1.3) premios.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.t += dt; s.x += s.vx * dt; s.alt += s.vy * dt; s.vy -= 420 * dt;
      if (s.t > s.life) sparks.splice(i, 1);
    }
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      p.t += dt; p.alt += 30 * dt; p.r += 24 * dt;
      if (p.t > p.life) puffs.splice(i, 1);
    }
  }

  /* ---------- desenhos ---------- */
  function pokebola(c, x, y, r, rot) {
    c.save(); c.translate(x, y); c.rotate(rot || 0);
    c.fillStyle = '#ee1c25'; c.beginPath(); c.arc(0, 0, r, Math.PI, 0); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, r, 0, Math.PI); c.fill();
    c.strokeStyle = '#222'; c.lineWidth = Math.max(1.5, r * 0.16);
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
    c.beginPath(); c.moveTo(-r, 0); c.lineTo(r, 0); c.stroke();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, r * 0.32, 0, TAU); c.fill(); c.stroke();
    c.restore();
  }

  // Pikachu de plano B (sem internet), base nos pés, virado para a direita
  function pikaPlanoB(c, D) {
    const k = D / 110;
    c.save(); c.scale(k, k);
    c.fillStyle = '#ffd60a'; c.strokeStyle = '#7a5c00'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(-26, -38); c.lineTo(-52, -70); c.lineTo(-40, -40); c.lineTo(-58, -46); c.lineTo(-30, -24); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(0, -30, 26, 30, 0, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(6, -72, 26, 22, 0, 0, TAU); c.fill(); c.stroke();
    for (const s of [-1, 1]) {
      c.fillStyle = '#ffd60a';
      c.beginPath(); c.moveTo(6 + s * 12, -88); c.lineTo(6 + s * 26, -122); c.lineTo(6 + s * 4, -92); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#222';
      c.beginPath(); c.moveTo(6 + s * 21, -112); c.lineTo(6 + s * 26, -122); c.lineTo(6 + s * 15, -110); c.closePath(); c.fill();
    }
    c.fillStyle = '#222';
    c.beginPath(); c.arc(-2, -76, 4, 0, TAU); c.arc(18, -76, 4, 0, TAU); c.fill();
    c.fillStyle = '#ff4d4d';
    c.beginPath(); c.arc(-10, -64, 6, 0, TAU); c.arc(28, -64, 6, 0, TAU); c.fill();
    c.restore();
  }

  function pokePlanoB(c, m) {
    const p = POD[m.tipo];
    const r = m.D * 0.36;
    c.fillStyle = p.cor; c.strokeStyle = p.escura; c.lineWidth = 4;
    c.beginPath(); c.ellipse(0, -r * 1.1, r, r * 1.08, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(-r * 0.35, -r * 1.25, r * 0.2, 0, TAU); c.arc(r * 0.25, -r * 1.25, r * 0.2, 0, TAU); c.fill();
    c.fillStyle = '#222';
    c.beginPath(); c.arc(-r * 0.4, -r * 1.25, r * 0.1, 0, TAU); c.arc(r * 0.2, -r * 1.25, r * 0.1, 0, TAU); c.fill();
  }

  // desenha um Pokémon com os pés em (0,0). As ilustrações oficiais olham quase todas
  // para a esquerda: "direita" vira a imagem ao contrário.
  function desenhaPoke(c, id, D, direita, planoB) {
    const im = imagem(id);
    if (im.ok) {
      c.save();
      if (direita) c.scale(-1, 1);
      c.drawImage(im.img, -D / 2, -D * 0.94, D, D);
      c.restore();
    } else planoB(c);
  }

  function sombra(c, x, w, alt) {
    c.fillStyle = 'rgba(0,0,0,' + (0.22 * Math.max(0.3, 1 - alt / 300)) + ')';
    c.beginPath(); c.ellipse(x, sy(0) + 4, w, w * 0.22, 0, 0, TAU); c.fill();
  }

  // o Ash: boné vermelho e branco, colete azul, luvas verdes. Base nos pés, ~140 de altura.
  function ashArt(c, t, o) {
    const w = o.walk || 0;
    const p1 = Math.sin(w) * 12, p2 = -Math.sin(w) * 12;
    c.lineCap = 'round';
    // pernas (calças de ganga) e ténis
    c.strokeStyle = '#2a4d8f'; c.lineWidth = 13;
    c.beginPath(); c.moveTo(-6, -66); c.lineTo(-6 + p1 * 0.7, -10); c.stroke();
    c.beginPath(); c.moveTo(7, -66); c.lineTo(7 + p2 * 0.7, -10); c.stroke();
    c.fillStyle = '#222';
    G.gfx.rr(c, -14 + p1 * 0.7, -12, 22, 11, 5); c.fill();
    G.gfx.rr(c, -1 + p2 * 0.7, -12, 22, 11, 5); c.fill();
    c.fillStyle = '#e63946';
    c.fillRect(-10 + p1 * 0.7, -10, 8, 4); c.fillRect(3 + p2 * 0.7, -10, 8, 4);
    // braço de trás
    c.strokeStyle = '#f1c27d'; c.lineWidth = 9;
    c.beginPath(); c.moveTo(-12, -104); c.lineTo(-18 - p1 * 0.5, -76); c.stroke();
    c.fillStyle = '#2a9d55'; c.beginPath(); c.arc(-18 - p1 * 0.5, -74, 6, 0, TAU); c.fill();
    // t-shirt branca e colete azul
    c.fillStyle = '#ffffff'; G.gfx.rr(c, -17, -116, 34, 52, 9); c.fill();
    c.fillStyle = '#1f5fbf'; G.gfx.rr(c, -19, -116, 13, 52, 6); c.fill();
    G.gfx.rr(c, 6, -116, 13, 52, 6); c.fill();
    c.fillStyle = '#ffd60a'; c.fillRect(-19, -88, 13, 4); c.fillRect(6, -88, 13, 4);
    // braço da frente: a atirar fica no ar
    c.strokeStyle = '#f1c27d'; c.lineWidth = 9;
    c.beginPath(); c.moveTo(12, -106);
    if (o.lanca > 0) c.lineTo(28, -140); else c.lineTo(20 + p2 * 0.5, -78);
    c.stroke();
    c.fillStyle = '#2a9d55';
    c.beginPath();
    if (o.lanca > 0) c.arc(29, -143, 6.5, 0, TAU); else c.arc(20 + p2 * 0.5, -76, 6.5, 0, TAU);
    c.fill();
    // cabeça
    c.fillStyle = '#f1c27d'; c.beginPath(); c.arc(2, -132, 17, 0, TAU); c.fill();
    // cabelo preto espetado atrás
    c.fillStyle = '#1b1b1b';
    c.beginPath();
    c.moveTo(-14, -138); c.lineTo(-26, -128); c.lineTo(-14, -126); c.lineTo(-24, -116); c.lineTo(-10, -120);
    c.lineTo(-12, -110); c.lineTo(0, -122); c.closePath(); c.fill();
    // olhos e sorriso
    c.fillStyle = '#222';
    c.beginPath(); c.arc(9, -132, 2.4, 0, TAU); c.fill();
    c.strokeStyle = '#7a3e1d'; c.lineWidth = 2;
    c.beginPath(); c.arc(9, -124, 5, 0.2, Math.PI - 0.6); c.stroke();
    c.strokeStyle = '#c98b5b'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(13, -129); c.lineTo(15, -128); c.stroke();
    // boné: vermelho atrás, branco à frente, pala vermelha e o símbolo verde
    c.fillStyle = '#e63946';
    c.beginPath(); c.arc(0, -138, 18, Math.PI, 0); c.fill();
    c.fillStyle = '#ffffff';
    c.beginPath(); c.moveTo(0, -156); c.quadraticCurveTo(16, -154, 18, -138); c.lineTo(0, -138); c.closePath(); c.fill();
    c.fillStyle = '#2a9d55';
    c.beginPath(); c.arc(8, -146, 4, 0, TAU); c.fill();
    c.fillStyle = '#e63946';
    G.gfx.rr(c, 6, -141, 26, 6, 3); c.fill();
  }

  // ataques: cada poder tem a sua cara
  function tiroArt(c, tipo, t, dir) {
    const p = POD[tipo];
    c.save();
    if (dir < 0) c.scale(-1, 1);
    if (tipo === 'eletrico') {
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45;
      c.fillStyle = '#fff3a0'; c.beginPath(); c.arc(0, 0, 22, 0, TAU); c.fill(); c.restore();
      c.strokeStyle = '#ffd60a'; c.lineWidth = 6; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(-34, -6);
      c.lineTo(-20, 8 * Math.sin(t * 40)); c.lineTo(-8, -9); c.lineTo(4, 7); c.lineTo(16, -4);
      c.stroke();
      c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.stroke();
    } else if (tipo === 'fogo') {
      for (let k = 0; k < 4; k++) {
        c.globalAlpha = 0.7 - k * 0.15;
        c.fillStyle = k % 2 ? '#ffb703' : '#ff6d00';
        c.beginPath(); c.arc(-k * 11, Math.sin(t * 30 + k) * 3, 14 - k * 2.5, 0, TAU); c.fill();
      }
      c.globalAlpha = 1; c.fillStyle = '#fff3b0'; c.beginPath(); c.arc(2, 0, 6, 0, TAU); c.fill();
    } else if (tipo === 'agua') {
      c.fillStyle = '#4cc9f0';
      c.beginPath(); c.moveTo(16, 0); c.quadraticCurveTo(-4, -16, -14, 0); c.quadraticCurveTo(-4, 16, 16, 0); c.fill();
      c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(2, -4, 4, 0, TAU); c.fill();
      c.fillStyle = 'rgba(76,201,240,.6)';
      c.beginPath(); c.arc(-24, 4, 5, 0, TAU); c.arc(-34, -3, 3.5, 0, TAU); c.fill();
    } else if (tipo === 'planta') {
      for (let k = 0; k < 2; k++) {
        c.save(); c.translate(-k * 16, 0); c.rotate(t * 14 + k * 2);
        c.fillStyle = k ? '#2d6a4f' : '#52b788';
        c.beginPath(); c.moveTo(-13, 0); c.quadraticCurveTo(0, -10, 13, 0); c.quadraticCurveTo(0, 10, -13, 0); c.fill();
        c.strokeStyle = '#d8f3dc'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-10, 0); c.lineTo(10, 0); c.stroke();
        c.restore();
      }
    } else if (tipo === 'pedra') {
      c.rotate(t * 9);
      c.fillStyle = '#a68a64'; c.strokeStyle = '#5e4b32'; c.lineWidth = 3;
      c.beginPath();
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * TAU, r = 14 + (k % 2) * 4;
        c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      c.closePath(); c.fill(); c.stroke();
    } else if (tipo === 'gelo') {
      c.rotate(t * 6);
      c.strokeStyle = '#ffffff'; c.lineWidth = 6; c.lineCap = 'round';
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI;
        c.beginPath(); c.moveTo(Math.cos(a) * -15, Math.sin(a) * -15); c.lineTo(Math.cos(a) * 15, Math.sin(a) * 15); c.stroke();
      }
      c.strokeStyle = '#4cc9f0'; c.lineWidth = 3;
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI;
        c.beginPath(); c.moveTo(Math.cos(a) * -15, Math.sin(a) * -15); c.lineTo(Math.cos(a) * 15, Math.sin(a) * 15); c.stroke();
      }
    } else {
      c.fillStyle = 'rgba(157,78,221,.45)'; c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.fill();
      c.fillStyle = '#4a1a75'; c.beginPath(); c.arc(0, 0, 13, 0, TAU); c.fill();
      c.strokeStyle = '#e0aaff'; c.lineWidth = 2.5;
      c.beginPath(); c.arc(0, 0, 8, t * 8, t * 8 + 4); c.stroke();
    }
    c.restore();
    void p;
  }

  function iconePoder(c, tipo, x, y, r, ativo, t) {
    const p = POD[tipo];
    c.save();
    if (ativo) {
      c.fillStyle = 'rgba(255,255,255,.55)';
      c.beginPath(); c.arc(x, y, r + 7 + Math.sin(t * 6) * 1.5, 0, TAU); c.fill();
    }
    c.fillStyle = p.escura; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.strokeStyle = ativo ? '#ffffff' : 'rgba(255,255,255,.6)'; c.lineWidth = ativo ? 4 : 2;
    c.stroke();
    c.translate(x, y); c.scale(r / 26, r / 26);
    tiroArt(c, tipo, t, 1);
    c.restore();
  }

  /* ---------- cenário ---------- */
  function ceu(c, tm, alpha, W, H) {
    c.globalAlpha = alpha;
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, tm.ceu[0]); g.addColorStop(1, tm.ceu[1]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.globalAlpha = 1;
  }

  function fundoLonge(c, tm, alpha, W, t) {
    c.save(); c.globalAlpha = alpha;
    const base = sy(0);
    const tp = tm.tipo;
    if (tp === 'fantasma') {
      c.fillStyle = '#fff3bf'; c.beginPath(); c.arc(W * 0.8, base * 0.25, 40, 0, TAU); c.fill();
      for (let k = 0; k < 30; k++) {
        c.globalAlpha = alpha * (0.4 + 0.6 * Math.abs(Math.sin(t + k)));
        c.fillStyle = '#fff'; c.fillRect((k * 197) % W, (h01(k) * base * 0.6), 2.5, 2.5);
      }
      c.globalAlpha = alpha;
    } else {
      G.gfx.sun(c, W * 0.84, base * 0.2, 34, t);
    }
    // montes/ondas ao longe (paralaxe 0.25)
    const cor = { agua: '#2e86c1', fogo: '#7b2d26', planta: '#5aa469', pedra: '#7d7468', gelo: '#d9ecf7', fantasma: '#2a1f4d' }[tp];
    c.fillStyle = cor;
    if (tp === 'agua') {
      c.fillRect(0, base - 90, W, 90);
      c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 3;
      for (let k = 0; k < W / 60 + 2; k++) {
        const x = k * 60 - ((camX * 0.25) % 60);
        c.beginPath(); c.arc(x, base - 70 + (k % 3) * 22 + Math.sin(t * 2 + k) * 3, 10, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
      }
    } else {
      c.beginPath(); c.moveTo(0, base);
      for (let k = -1; k < W / 160 + 2; k++) {
        const x = k * 160 - ((camX * 0.25) % 160);
        const n = Math.round((camX * 0.25 + k * 160) / 160);
        const hgt = (tp === 'fogo' || tp === 'pedra' ? 170 : 110) + h01(n) * 90;
        if (tp === 'fogo' || tp === 'pedra' || tp === 'gelo') { c.lineTo(x, base - hgt); c.lineTo(x + 80, base - 40); }
        else c.quadraticCurveTo(x + 40, base - hgt, x + 80, base - 40);
      }
      c.lineTo(W, base); c.closePath(); c.fill();
      if (tp === 'gelo') {                // neve nos picos
        c.fillStyle = '#ffffff';
        for (let k = -1; k < W / 160 + 2; k++) {
          const x = k * 160 - ((camX * 0.25) % 160);
          const n = Math.round((camX * 0.25 + k * 160) / 160);
          const hgt = 110 + h01(n) * 90;
          c.beginPath(); c.moveTo(x, base - hgt); c.lineTo(x + 18, base - hgt + 28); c.lineTo(x - 14, base - hgt + 24); c.closePath(); c.fill();
        }
      }
      if (tp === 'fogo') {                // lava a brilhar nos vulcões
        c.fillStyle = '#ffb703';
        for (let k = -1; k < W / 160 + 2; k++) {
          const x = k * 160 - ((camX * 0.25) % 160);
          const n = Math.round((camX * 0.25 + k * 160) / 160);
          if (h01(n * 3.3) < 0.5) continue;
          const hgt = 170 + h01(n) * 90;
          c.beginPath(); c.arc(x, base - hgt, 7 + Math.sin(t * 4 + k) * 2, 0, TAU); c.fill();
        }
      }
    }
    c.restore();
  }

  // árvores, rochas, palmeiras... no mundo, à frente do fundo
  function enfeite(c, tp, x, base, n, t) {
    if (tp === 'agua') {            // palmeira
      c.strokeStyle = '#8d6e4a'; c.lineWidth = 9;
      c.beginPath(); c.moveTo(x, base); c.quadraticCurveTo(x + 14, base - 60, x + 6, base - 120); c.stroke();
      c.fillStyle = '#2d9b5a';
      for (let k = 0; k < 5; k++) {
        c.save(); c.translate(x + 6, base - 120); c.rotate(-2.6 + k * 0.55 + Math.sin(t + n) * 0.05);
        c.beginPath(); c.ellipse(26, 0, 30, 8, 0, 0, TAU); c.fill(); c.restore();
      }
    } else if (tp === 'fogo') {     // rocha com fendas de lava
      c.fillStyle = '#5a2e22';
      c.beginPath(); c.moveTo(x - 40, base); c.lineTo(x - 26, base - 44); c.lineTo(x + 10, base - 56); c.lineTo(x + 38, base); c.closePath(); c.fill();
      c.strokeStyle = '#ff8c00'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(x - 14, base - 40); c.lineTo(x - 4, base - 22); c.lineTo(x + 10, base - 30); c.stroke();
    } else if (tp === 'planta') {   // árvore redonda
      c.fillStyle = '#7f5539'; c.fillRect(x - 7, base - 70, 14, 70);
      c.fillStyle = '#2d6a4f'; c.beginPath(); c.arc(x, base - 92, 38, 0, TAU); c.fill();
      c.fillStyle = '#40916c'; c.beginPath(); c.arc(x - 14, base - 102, 22, 0, TAU); c.fill();
      if (n % 3 === 0) { c.fillStyle = '#e63946'; c.beginPath(); c.arc(x + 14, base - 88, 5, 0, TAU); c.arc(x - 8, base - 80, 5, 0, TAU); c.fill(); }
    } else if (tp === 'pedra') {    // pedregulhos
      c.fillStyle = '#857a6d';
      c.beginPath(); c.ellipse(x, base - 22, 40, 26, 0, Math.PI, 0); c.fill();
      c.fillStyle = '#a39887';
      c.beginPath(); c.ellipse(x + 34, base - 12, 22, 14, 0, Math.PI, 0); c.fill();
    } else if (tp === 'gelo') {     // pinheiro com neve
      c.fillStyle = '#6b4f3a'; c.fillRect(x - 5, base - 26, 10, 26);
      for (let k = 0; k < 3; k++) {
        c.fillStyle = '#2f6f5e';
        c.beginPath(); c.moveTo(x, base - 120 + k * 28); c.lineTo(x + 34 - k * 4, base - 60 + k * 18); c.lineTo(x - 34 + k * 4, base - 60 + k * 18); c.closePath(); c.fill();
        c.fillStyle = '#ffffff';
        c.beginPath(); c.moveTo(x, base - 120 + k * 28); c.lineTo(x + 12, base - 100 + k * 28); c.lineTo(x - 12, base - 100 + k * 28); c.closePath(); c.fill();
      }
    } else {                        // árvore torta da noite com lanterna
      c.strokeStyle = '#1b1430'; c.lineWidth = 8; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, base); c.quadraticCurveTo(x - 10, base - 60, x + 20, base - 100); c.stroke();
      c.lineWidth = 4;
      c.beginPath(); c.moveTo(x + 4, base - 60); c.lineTo(x - 26, base - 84); c.stroke();
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4;
      c.fillStyle = '#c77dff'; c.beginPath(); c.arc(x - 26, base - 76, 22 + Math.sin(t * 3 + n) * 3, 0, TAU); c.fill();
      c.restore();
      c.fillStyle = '#e0aaff'; c.beginPath(); c.arc(x - 26, base - 76, 7, 0, TAU); c.fill();
    }
  }

  function casa(c, x, base, cor, n) {
    c.fillStyle = '#fff4e0'; c.fillRect(x, base - 110, 140, 110);
    c.fillStyle = cor;
    c.beginPath(); c.moveTo(x - 14, base - 106); c.lineTo(x + 70, base - 160); c.lineTo(x + 154, base - 106); c.closePath(); c.fill();
    c.fillStyle = '#8d5a2b'; c.fillRect(x + 56, base - 54, 28, 54);
    c.fillStyle = '#bfe4ff'; c.fillRect(x + 14, base - 86, 30, 26); c.fillRect(x + 96, base - 86, 30, 26);
    c.strokeStyle = '#8d99ae'; c.lineWidth = 2; c.strokeRect(x + 14, base - 86, 30, 26); c.strokeRect(x + 96, base - 86, 30, 26);
    void n;
  }

  function centroPokemon(c, x, base, t) {
    c.fillStyle = '#fff'; c.fillRect(x - 110, base - 150, 220, 150);
    c.fillStyle = '#e63946';
    G.gfx.rr(c, -0 + x - 124, base - 170, 248, 30, 10); c.fill();
    c.fillStyle = '#bfe4ff'; c.fillRect(x - 40, base - 80, 80, 80);
    c.strokeStyle = '#8d99ae'; c.lineWidth = 3; c.strokeRect(x - 40, base - 80, 80, 80);
    c.beginPath(); c.moveTo(x, base - 80); c.lineTo(x, base); c.stroke();
    c.fillStyle = '#bfe4ff'; c.fillRect(x - 96, base - 126, 40, 30); c.fillRect(x + 56, base - 126, 40, 30);
    pokebola(c, x, base - 194, 24, Math.sin(t * 2) * 0.15);
    // cruz cor-de-rosa: aqui ficam bons
    c.fillStyle = '#ff8fab';
    c.fillRect(x - 6, base - 132, 12, 36); c.fillRect(x - 18, base - 120, 36, 12);
  }

  function ginasio(c, x, tm, base, ganho, t) {
    const p = POD[tm.tipo];
    c.fillStyle = '#e9ecef'; c.fillRect(x, base - 220, 320, 220);
    c.fillStyle = p.escura;
    c.beginPath(); c.moveTo(x - 20, base - 216); c.lineTo(x + 160, base - 290); c.lineTo(x + 340, base - 216); c.closePath(); c.fill();
    c.fillStyle = p.cor; c.fillRect(x, base - 216, 320, 18);
    for (let k = 0; k < 4; k++) { c.fillStyle = '#ced4da'; c.fillRect(x + 20 + k * 80, base - 196, 22, 196); }
    c.fillStyle = '#495057'; c.fillRect(x + 120, base - 100, 80, 100);
    // o símbolo do tipo no frontão
    c.save(); c.translate(x + 160, base - 246); c.scale(1.3, 1.3); tiroArt(c, tm.tipo, t, 1); c.restore();
    if (ganho) {                     // depois de ganhar: bandeira de festa
      c.strokeStyle = '#495057'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(x + 300, base - 220); c.lineTo(x + 300, base - 320); c.stroke();
      c.fillStyle = '#ffd166';
      c.beginPath(); c.moveTo(x + 300, base - 320); c.lineTo(x + 340 + Math.sin(t * 5) * 4, base - 306); c.lineTo(x + 300, base - 292); c.closePath(); c.fill();
    }
  }

  function placa(c, x, base, txt) {
    c.fillStyle = '#7f5539'; c.fillRect(x - 5, base - 90, 10, 90);
    G.gfx.rr(c, x - 80, base - 128, 160, 44, 10); c.fillStyle = '#a47148'; c.fill();
    c.strokeStyle = '#5e3a1f'; c.lineWidth = 3; c.stroke();
    G.gfx.label(c, txt, x, base - 106, 17, '#fff', 'center', '#3d2412');
  }

  function caixaArt(c, x, y, t) {        // base em (x, y)
    c.save(); c.translate(x, y);
    G.gfx.rr(c, -28, -56, 56, 56, 8); c.fillStyle = '#d99a4e'; c.fill();
    c.strokeStyle = '#7a4b1c'; c.lineWidth = 4; c.stroke();
    c.strokeStyle = 'rgba(122,75,28,.55)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(-28, -38); c.lineTo(28, -38); c.moveTo(-28, -18); c.lineTo(28, -18); c.stroke();
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25 + 0.15 * Math.sin(t * 4 + x);
    c.fillStyle = '#ffe066'; c.beginPath(); c.arc(0, -28, 38, 0, TAU); c.fill(); c.restore();
    G.gfx.label(c, '?', 0, -27, 36, '#ffd60a', 'center', '#7a4b1c');
    c.restore();
  }

  function premioArt(c, tipo, x, y, t) {
    if (tipo === 'pocao') {
      c.fillStyle = '#9d4edd'; G.gfx.rr(c, x - 10, y - 14, 20, 30, 6); c.fill();
      c.fillStyle = '#e0aaff'; c.fillRect(x - 5, y - 22, 10, 9);
      G.gfx.heart(c, x, y + 2, 14, '#ff8fab');
    } else if (tipo === 'campo') {
      campoArt(c, x, y, 26, t, 1);
    } else {
      G.gfx.star(c, x, y, 18, '#ffd166', t * 3);
    }
  }

  // a bola de campo de força: bolha azul com um arco-íris a rodar
  function campoArt(c, x, y, r, t, a) {
    c.save();
    c.globalAlpha = 0.28 * a;
    const g = c.createRadialGradient(x, y, r * 0.2, x, y, r);
    g.addColorStop(0, 'rgba(160,231,255,0.1)'); g.addColorStop(1, '#4cc9f0');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.globalAlpha = 0.95 * a;
    c.lineWidth = Math.max(2, r * 0.06);
    const cores = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];
    for (let k = 0; k < cores.length; k++) {
      const a0 = t * 2.4 + k * (TAU / cores.length);
      c.strokeStyle = cores[k];
      c.beginPath(); c.arc(x, y, r, a0, a0 + TAU / cores.length); c.stroke();
    }
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = Math.max(1.5, r * 0.05);
    c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.25, Math.PI, Math.PI * 1.5); c.stroke();
    c.restore();
  }

  // a ambulância Pokémon: branca, com a cruz e a luz a piscar
  function ambulanciaArt(c, x, base, t, comPika) {
    c.save(); c.translate(x, base);
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0, 4, 110, 12, 0, 0, TAU); c.fill();
    c.fillStyle = '#ffffff'; c.strokeStyle = '#8d99ae'; c.lineWidth = 3;
    G.gfx.rr(c, -110, -118, 160, 100, 12); c.fill(); c.stroke();
    G.gfx.rr(c, 46, -86, 64, 68, 12); c.fill(); c.stroke();
    c.fillStyle = '#bfe4ff'; G.gfx.rr(c, 60, -78, 40, 30, 6); c.fill();
    c.fillStyle = '#e63946'; c.fillRect(-110, -56, 220, 12);
    c.fillStyle = '#ff4d6d';
    c.fillRect(-46, -106, 18, 50); c.fillRect(-62, -90, 50, 18);
    if (comPika) {                     // o Pikachu à janela, com um penso
      c.save(); c.beginPath(); G.gfx.rr(c, 60, -78, 40, 30, 6); c.clip();
      c.translate(80, -40); desenhaPoke(c, 25, 52, true, function (cc) { pikaPlanoB(cc, 52); }); c.restore();
    }
    const pisca = Math.floor(t * 6) % 2;
    c.fillStyle = pisca ? '#ff4d4d' : '#4dabf7';
    G.gfx.rr(c, -30, -134, 30, 16, 6); c.fill();
    c.fillStyle = pisca ? 'rgba(255,77,77,.3)' : 'rgba(77,171,247,.3)';
    c.beginPath(); c.arc(-15, -126, 30, 0, TAU); c.fill();
    for (const wx of [-70, 66]) {
      c.fillStyle = '#222'; c.beginPath(); c.arc(wx, -14, 18, 0, TAU); c.fill();
      c.fillStyle = '#adb5bd'; c.beginPath(); c.arc(wx, -14, 8, 0, TAU); c.fill();
    }
    c.restore();
  }

  // uma pessoa (pés em 0,0, ~180 de altura). o.come: a levar comida à boca; o.danca: a dançar
  function pessoaArt(c, p, t, o) {
    c.save();
    const k = p.pequena ? 0.78 : 1;
    let bob = 0, braco = 0;
    if (o.danca > 0) { bob = Math.abs(Math.sin(t * 9)) * 16; braco = 1; c.rotate(Math.sin(t * 9) * 0.12); }
    c.translate(0, -bob); c.scale(k, k);
    c.lineCap = 'round';
    // pernas e sapatos
    c.strokeStyle = p.calca; c.lineWidth = 15;
    c.beginPath(); c.moveTo(-10, -72); c.lineTo(-12, -8); c.moveTo(10, -72); c.lineTo(12, -8); c.stroke();
    c.fillStyle = '#333'; G.gfx.rr(c, -26, -12, 22, 12, 5); c.fill(); G.gfx.rr(c, 4, -12, 22, 12, 5); c.fill();
    // corpo (a médica tem a bata branca por cima)
    c.fillStyle = p.roupa; G.gfx.rr(c, -30, -146, 60, 82, 16); c.fill();
    if (p.estilo === 'medica') {
      c.fillStyle = '#ffffff'; G.gfx.rr(c, -20, -132, 40, 66, 10); c.fill();
      c.fillStyle = '#ff4d6d'; c.fillRect(-4, -122, 8, 22); c.fillRect(-11, -115, 22, 8);
    }
    if (p.estilo === 'chapeu') { c.fillStyle = '#e9ecef'; G.gfx.rr(c, -22, -110, 44, 44, 8); c.fill(); }
    // braços: a comer leva a mão à boca; a dançar abana-os no ar
    c.strokeStyle = p.pele; c.lineWidth = 11;
    const ab = Math.sin(t * 9);
    c.beginPath(); c.moveTo(-26, -136);
    if (braco) c.lineTo(-48, -196 + ab * 14); else c.lineTo(-36, -84);
    c.stroke();
    c.beginPath(); c.moveTo(26, -136);
    let mx = 36, my = -84;
    if (braco) { mx = 48; my = -196 - ab * 14; }
    else if (o.come > 0) { const q = Math.sin(Math.min(1, (0.7 - o.come) / 0.35) * Math.PI / 2); mx = 36 - 30 * q; my = -84 - 86 * q; }
    c.lineTo(mx, my); c.stroke();
    if (o.come > 0 && o.comeE && o.come > 0.2) G.gfx.label(c, o.comeE, mx - 4, my - 6, 26, '#fff', 'center', 'none');
    // cabeça
    c.fillStyle = p.pele; c.beginPath(); c.arc(0, -172, 27, 0, TAU); c.fill();
    c.fillStyle = p.cabelo;
    if (p.estilo === 'comprido' || p.estilo === 'medica') {
      c.beginPath(); c.arc(0, -178, 29, Math.PI, 0); c.fill();
      c.fillRect(-29, -180, 10, 44); c.fillRect(19, -180, 10, 44);
      if (p.estilo === 'medica') {   // os dois caracóis de lado e a touca com a cruz
        c.beginPath(); c.arc(-34, -140, 11, 0, TAU); c.arc(34, -140, 11, 0, TAU); c.fill();
        c.fillStyle = '#ffffff'; G.gfx.rr(c, -20, -214, 40, 18, 6); c.fill();
        c.fillStyle = '#ff4d6d'; c.fillRect(-3, -212, 6, 14); c.fillRect(-7, -208, 14, 6);
      }
    } else if (p.estilo === 'curto') {
      c.beginPath(); c.arc(0, -180, 28, Math.PI * 1.05, -0.05); c.fill();
    } else if (p.estilo === 'carrapito') {
      c.beginPath(); c.arc(0, -180, 28, Math.PI, 0); c.fill();
      c.beginPath(); c.arc(0, -206, 13, 0, TAU); c.fill();
    } else if (p.estilo === 'careca') {
      c.beginPath(); c.arc(-24, -176, 9, 0, TAU); c.arc(24, -176, 9, 0, TAU); c.fill();
    } else if (p.estilo === 'chapeu') {
      c.fillStyle = '#ffffff';
      G.gfx.rr(c, -22, -214, 44, 22, 4); c.fill();
      c.beginPath(); c.arc(-12, -214, 14, 0, TAU); c.arc(12, -214, 14, 0, TAU); c.arc(0, -222, 15, 0, TAU); c.fill();
    }
    // cara: olhos, bochechas e um sorriso (a mastigar abre a boca)
    c.fillStyle = '#222';
    c.beginPath(); c.arc(-9, -174, 3.2, 0, TAU); c.arc(9, -174, 3.2, 0, TAU); c.fill();
    if (p.oculos) {
      c.strokeStyle = '#495057'; c.lineWidth = 2;
      c.beginPath(); c.arc(-9, -174, 7, 0, TAU); c.moveTo(16, -174); c.arc(9, -174, 7, 0, TAU); c.stroke();
    }
    c.fillStyle = 'rgba(255,120,140,.45)';
    c.beginPath(); c.arc(-17, -163, 5, 0, TAU); c.arc(17, -163, 5, 0, TAU); c.fill();
    c.strokeStyle = '#7a3e1d'; c.lineWidth = 2.5;
    if (o.come > 0 && o.come < 0.35) { c.fillStyle = '#7a3e1d'; c.beginPath(); c.ellipse(0, -160, 6, 5 + Math.sin(t * 30) * 2, 0, 0, TAU); c.fill(); }
    else { c.beginPath(); c.arc(0, -166, 8, 0.25, Math.PI - 0.25); c.stroke(); }
    c.restore();
  }

  // lá dentro: a casa (comer ou dançar com a pessoa) ou o hospital da médica
  function desenhaDentro(c, t) {
    const d = dentro, L = layoutDentro(), hosp = d.tipo === 'hospital';
    c.fillStyle = hosp ? '#eaf6ff' : '#fff1d6'; c.fillRect(0, 0, G.W, G.H);
    c.save(); c.translate(L.ox, L.oy); c.scale(L.k, L.k);
    // parede, risca e chão
    c.fillStyle = hosp ? '#eaf6ff' : '#fff1d6'; c.fillRect(-400, -200, 1700, 670);
    c.fillStyle = hosp ? '#ffc2d1' : '#f4a261'; c.fillRect(-400, 200, 1700, 16);
    if (!hosp) {
      c.fillStyle = 'rgba(244,162,97,.18)';
      for (let x = -400; x < 1300; x += 60) c.fillRect(x, -200, 26, 400);
    }
    c.fillStyle = hosp ? '#d8e2dc' : '#c08552'; c.fillRect(-400, 470, 1700, 400);
    c.strokeStyle = hosp ? '#b8c4bf' : '#9c6644'; c.lineWidth = 3;
    for (let x = -400; x < 1300; x += hosp ? 90 : 140) { c.beginPath(); c.moveTo(x, 470); c.lineTo(x - 60, 900); c.stroke(); }
    // janela com o céu da cidade
    const tm = tema(d.k);
    c.fillStyle = tm.ceu[0]; c.fillRect(370, 70, 160, 110);
    c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(420, 120, 18, 0, TAU); c.arc(442, 112, 22, 0, TAU); c.arc(466, 122, 16, 0, TAU); c.fill();
    c.strokeStyle = '#ffffff'; c.lineWidth = 8; c.strokeRect(370, 70, 160, 110);
    c.beginPath(); c.moveTo(450, 70); c.lineTo(450, 180); c.stroke();
    // a porta para sair (só depois de ficar bom, no hospital)
    const P = PORTA_SAI;
    c.fillStyle = '#8d5a2b'; G.gfx.rr(c, P.x, P.y, P.w, P.h, 10); c.fill();
    c.fillStyle = '#ffd166'; c.beginPath(); c.arc(P.x + 18, P.y + 116, 7, 0, TAU); c.fill();
    if (d.curado) {
      c.strokeStyle = 'rgba(255,209,102,' + (0.55 + 0.4 * Math.sin(t * 5)) + ')'; c.lineWidth = 7;
      G.gfx.rr(c, P.x - 5, P.y - 5, P.w + 10, P.h + 10, 14); c.stroke();
      G.gfx.label(c, '🚪', P.x + P.w / 2, P.y - 34 + Math.sin(t * 5) * 5, 40, '#fff', 'center', 'none');
    }

    if (hosp) {
      // a cruz na parede, a cama, o Pikachu deitado e os curativos
      c.fillStyle = '#ff8fab'; c.fillRect(140, 60, 40, 120); c.fillRect(100, 100, 120, 40);
      c.fillStyle = '#adb5bd'; c.fillRect(230, 400, 14, 74); c.fillRect(556, 400, 14, 74);
      c.fillStyle = '#ffffff'; G.gfx.rr(c, 230, 380, 340, 40, 12); c.fill();
      c.fillStyle = '#dee2e6'; G.gfx.rr(c, 236, 250, 28, 150, 10); c.fill();
      c.save(); c.translate(400, 430);
      if (d.curado && d.marcas.length) c.translate(0, -Math.abs(Math.sin(t * 7)) * 30);   // fica bom: salta de alegria
      desenhaPoke(c, hero.forma, 170, true, function (cc) { cc.save(); cc.scale(-1, 1); pikaPlanoB(cc, 170); cc.restore(); });
      c.restore();
      c.fillStyle = '#a0c4ff'; G.gfx.rr(c, 250, 382, 300, 52, 14); c.fill();
      c.fillStyle = 'rgba(255,255,255,.4)'; for (let x = 270; x < 540; x += 40) c.fillRect(x, 382, 18, 52);
      for (const m of d.marcas) {
        const x = 400 + m.dx, y = 430 + m.dy;
        if (m.feito) {                 // o penso
          c.save(); c.translate(x, y); c.rotate(-0.5);
          c.fillStyle = '#f4d3a8'; G.gfx.rr(c, -26, -9, 52, 18, 8); c.fill();
          c.fillStyle = '#e9b97a'; G.gfx.rr(c, -9, -7, 18, 14, 3); c.fill();
          c.fillStyle = 'rgba(0,0,0,.18)';
          for (const q of [-18, -13, 13, 18]) { c.beginPath(); c.arc(q, -3, 1.4, 0, TAU); c.arc(q, 3, 1.4, 0, TAU); c.fill(); }
          c.restore();
        } else {                       // o dói-dói a piscar: toca aqui!
          const pul = 1 + Math.sin(t * 8) * 0.15;
          c.fillStyle = 'rgba(255,77,109,.35)'; c.beginPath(); c.arc(x, y, 22 * pul, 0, TAU); c.fill();
          c.fillStyle = '#ff4d6d'; c.beginPath(); c.arc(x, y, 10, 0, TAU); c.fill();
          c.strokeStyle = '#ff4d6d'; c.lineWidth = 3;
          for (let a = 0; a < 6; a++) {
            const an = a / 6 * TAU;
            c.beginPath(); c.moveTo(x + Math.cos(an) * 14, y + Math.sin(an) * 14); c.lineTo(x + Math.cos(an) * 22 * pul, y + Math.sin(an) * 22 * pul); c.stroke();
          }
        }
      }
      // a médica e a Chansey
      c.save(); c.translate(660, 470); pessoaArt(c, MEDICA, t, { danca: d.curado && d.marcas.length ? 1 : 0 }); c.restore();
      c.save(); c.translate(745, 470);
      desenhaPoke(c, CHANSEY, 130, false, function (cc) {
        cc.fillStyle = '#ffb3c6'; cc.beginPath(); cc.ellipse(0, -55, 46, 52, 0, 0, TAU); cc.fill();
      });
      c.restore();
    } else {
      // a mesa com a comida, o Pikachu numa cadeira e a pessoa do outro lado
      c.fillStyle = '#8d5a2b'; c.fillRect(120, 300, 14, 172); c.fillRect(120, 380, 110, 12); c.fillRect(216, 380, 14, 92);
      c.fillStyle = '#8d5a2b'; c.fillRect(310, 372, 16, 100); c.fillRect(574, 372, 16, 100);
      c.fillStyle = '#e76f51'; G.gfx.rr(c, 290, 330, 320, 44, 10); c.fill();
      c.fillStyle = '#ffffff';
      for (let x = 300; x < 600; x += 40) c.fillRect(x, 352, 20, 22);
      c.save(); c.translate(185, 384);
      const salta = d.danca > 0 ? Math.abs(Math.sin(t * 9)) * 26 : 0;
      c.translate(0, -salta);
      if (d.nham > 0) c.scale(1 + d.nham * 0.25, 1 - d.nham * 0.15);
      if (d.danca > 0) c.rotate(Math.sin(t * 9) * 0.18);
      desenhaPoke(c, hero.forma, 150, true, function (cc) { cc.save(); cc.scale(-1, 1); pikaPlanoB(cc, 150); cc.restore(); });
      c.restore();
      c.save(); c.translate(690, 470);
      pessoaArt(c, d.pessoa, t, { come: d.come, comeE: d.comeE, danca: d.danca });
      c.restore();
      if (d.faz === 'comer') {
        c.fillStyle = '#ffffff';
        c.beginPath(); c.ellipse(445, 330, 160, 14, 0, 0, TAU); c.fill();
        for (const q of d.comidas) {
          if (q.comida) continue;
          const bob = Math.sin(t * 3 + q.x) * 2;
          G.gfx.label(c, q.e, q.x, q.y + bob, 46, '#fff', 'center', 'none');
        }
        for (const v of d.voando) {    // a voar para a boca do Pikachu
          const q = Math.min(1, v.t / 0.45);
          const x = v.x0 + (215 - v.x0) * q, y = v.y0 + (300 - v.y0) * q - Math.sin(q * Math.PI) * 80;
          G.gfx.label(c, v.e, x, y, 46 * (1 - q * 0.5), '#fff', 'center', 'none');
        }
      } else {
        // o botão da música: tocar e dançam os dois
        const pul = d.danca > 0 ? 1.15 : 1 + Math.sin(t * 4) * 0.06;
        c.fillStyle = '#ff6fb1'; c.strokeStyle = '#ffffff'; c.lineWidth = 6;
        c.beginPath(); c.arc(450, 230, 54 * pul, 0, TAU); c.fill(); c.stroke();
        G.gfx.label(c, '🎵', 450, 232, 52, '#fff', 'center', 'none');
        if (d.danca > 0) {
          for (let i = 0; i < 4; i++) {
            const q = (t * 0.8 + i / 4) % 1;
            c.globalAlpha = 1 - q;
            G.gfx.label(c, i % 2 ? '🎶' : '🎵', 300 + i * 100, 260 - q * 160, 34, '#fff', 'center', 'none');
          }
          c.globalAlpha = 1;
        }
      }
    }
    for (const f of d.fx) {
      c.globalAlpha = Math.max(0, 1 - f.t / f.life);
      G.gfx.star(c, f.x, f.y, 9, f.col, f.t * 6);
    }
    c.globalAlpha = 1;
    c.restore();
    // corações e estrelas, lá em cima
    const hk = hudK();
    c.save(); c.scale(hk, hk);
    G.gfx.star(c, 34, 40, 17, '#ffd166', 0);
    G.gfx.label(c, '' + G.state.stars, 60, 41, 28, '#b56b00');
    for (let k = 0; k < MAXCOR; k++) G.gfx.heart(c, 32 + k * 30, 82, 30, k < hero.cor ? '#ff4d6d' : 'rgba(255,255,255,.75)');
    c.restore();
  }

  function bub(c, x, y, txt) {
    G.gfx.bubble(c, Math.max(96, Math.min(vw() - 96, x)), Math.max(52, y), txt);
  }

  S.draw = function (c, t) {
    if (fase === 'dentro') { desenhaDentro(c, t); return; }
    const vs = vscale(), W = vw(), H = vh();
    c.save(); c.scale(vs, vs);
    const base = sy(0);

    // céu: mistura dos dois temas perto da passagem de uma cidade para o caminho seguinte
    const meio = camX + W * 0.5;
    const kA = etapaDe(meio), fronteira = (kA + 1) * L;
    ceu(c, tema(kA), 1, W, H);
    fundoLonge(c, tema(kA), 1, W, t);
    const f = Math.max(0, Math.min(1, (meio - (fronteira - 500)) / 800));
    if (f > 0) { ceu(c, tema(kA + 1), f, W, H); fundoLonge(c, tema(kA + 1), f, W, t); }
    const prev = Math.max(0, Math.min(1, (kA * L + 300 - meio) / 800));
    if (prev > 0 && kA > 0) { ceu(c, tema(kA - 1), prev, W, H); fundoLonge(c, tema(kA - 1), prev, W, t); }

    // chão por etapas
    const e0 = etapaDe(camX), e1 = etapaDe(camX + W);
    for (let k = e0; k <= e1; k++) {
      const tm = tema(k);
      const xa = Math.max(0, k * L - camX), xb = Math.min(W, (k + 1) * L - camX);
      c.fillStyle = tm.chao; c.fillRect(xa, base, xb - xa, H - base);
      c.fillStyle = tm.chao2; c.fillRect(xa, base, xb - xa, 12);
      // caminho de terra batida / estrada na cidade
      const cx0 = Math.max(xa, cidadeX(k) - camX), cx1 = xb;
      if (cx1 > cx0) { c.fillStyle = 'rgba(120,120,130,.45)'; c.fillRect(cx0, base + 14, cx1 - cx0, 26); }
    }

    // enfeites do caminho
    const n0 = Math.floor((camX - 200) / 330), n1 = Math.floor((camX + W + 200) / 330);
    for (let n = n0; n <= n1; n++) {
      const x = n * 330 + 60 + h01(n * 1.7) * 100;
      const k = etapaDe(x), local = x - k * L;
      if (local > ROTA - 100 || h01(n * 4.1) < 0.25) continue;
      enfeite(c, tema(k).tipo, x - camX, base + 2, n, t);
    }

    // cidades
    for (let k = e0 - 1; k <= e1; k++) {
      if (k < 0) continue;
      const cx = cidadeX(k) - camX, tm = tema(k);
      if (cx > W + 200 || cx + CID < -200) continue;
      placa(c, cx - 60, base, tm.cidade);
      casa(c, cx + CASAS_X[0], base, POD[tm.tipo].escura, k);
      centroPokemon(c, pcX(k) - camX, base, t);
      casa(c, cx + CASAS_X[1], base, '#577590', k + 1);
      casa(c, cx + CASAS_X[2], base, '#bc4749', k + 2);
      const ch = chefes[k];
      ginasio(c, ginasioX(k) - camX, tm, base, ch && ch.estado !== 'anda' && ch.estado !== 'tonto', t);
    }

    // o 🚪 a saltitar por cima da porta onde o Pikachu está
    const pp = fase === 'jogo' ? portaPerto() : null;
    if (pp) {
      const px = pp.x - camX, py = base - (pp.tipo === 'hospital' ? 230 : 200) + Math.sin(t * 5) * 6;
      c.fillStyle = 'rgba(255,255,255,.92)'; c.strokeStyle = '#8d5a2b'; c.lineWidth = 3;
      c.beginPath(); c.arc(px, py, 26, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#8d5a2b';
      c.beginPath(); c.moveTo(px - 9, py + 30); c.lineTo(px + 9, py + 30); c.lineTo(px, py + 42); c.closePath(); c.fill();
      G.gfx.label(c, '🚪', px, py + 1, 28, '#fff', 'center', 'none');
    }

    // estrelas
    const i0 = Math.floor((camX - 100) / 260), i1 = Math.floor((camX + W + 100) / 260);
    for (let i = Math.max(0, i0); i <= i1; i++) {
      if (!estrelaEm(i) || coins[i]) continue;
      G.gfx.star(c, i * 260 + 80 - camX, sy(60 + h01(i * 5.1) * 120) + Math.sin(t * 3 + i) * 5, 15, '#ffd166', t * 1.2);
    }

    // caixinhas-surpresa
    for (const cx of caixasEntre(camX - 100, camX + W + 100)) {
      if (caixasAbertas[cx.key]) continue;
      const x = cx.x - camX, y = sy(cx.alt) + (cx.alt > 0 ? Math.sin(t * 2.5 + cx.x) * 4 : 0);
      if (x < -80 || x > W + 80) continue;
      if (cx.alt > 0) sombra(c, x, 22, cx.alt);
      caixaArt(c, x, y, t);
    }

    // Pokémon
    for (const m of maus) {
      if (m.estado === 'dentro' || m.estado === 'apanhado') continue;
      const x = m.x - camX;
      if (x < -300 || x > W + 300) continue;
      sombra(c, x, m.D * 0.3, m.alt);
      c.save(); c.translate(x, sy(m.alt));
      if (m.estado === 'tonto') c.rotate(Math.sin(t * 8) * 0.12);
      if (m.pisca > 0 && Math.floor(t * 20) % 2 === 0) c.globalAlpha = 0.5;
      const hop = m.estado === 'anda' ? Math.abs(Math.sin(m.t * 4)) * 4 : 0;
      c.translate(0, -hop);
      if (m.estado === 'espera') c.scale(0.92 + Math.sin(t * 20) * 0.05, 0.92);
      desenhaPoke(c, m.id, m.D, false, function (cc) { pokePlanoB(cc, m); });
      c.restore();
      if (m.escudo > 0 && m.estado === 'anda') {   // bolha de proteção
        const cy = sy(centroAlt(m)), rr = m.D * 0.58, a = Math.min(1, m.escudo * 3);
        c.save();
        c.globalAlpha = a * 0.32;
        c.fillStyle = POD[m.tipo].cor; c.beginPath(); c.arc(x, cy, rr, 0, TAU); c.fill();
        c.globalAlpha = a * 0.9;
        c.strokeStyle = '#ffffff'; c.lineWidth = 4;
        c.beginPath(); c.arc(x, cy, rr + Math.sin(t * 14) * 2, 0, TAU); c.stroke();
        c.beginPath(); c.arc(x - rr * 0.35, cy - rr * 0.35, rr * 0.18, Math.PI, Math.PI * 1.5); c.stroke();
        c.restore();
      }
      const topo = sy(m.alt) - m.D * 0.95;
      if (m.estado === 'tonto' || m.estado === 'espera') {
        for (let k = 0; k < 3; k++) {
          const a = t * 6 + (k / 3) * TAU;
          G.gfx.star(c, x + Math.cos(a) * m.D * 0.25, topo + 10 + Math.sin(a) * 6, 8, '#ffd166', a);
        }
      } else if (m.estado === 'anda' && x < W + 40) {
        // barra de energia em bolinhas (como nos outros jogos, percebe-se sem ler)
        const n = m.max, r = m.chefe ? 6 : 5, larg = n * (r * 2 + 3);
        for (let k = 0; k < n; k++) {
          c.fillStyle = k < m.hp ? POD[m.tipo].cor : 'rgba(255,255,255,.45)';
          c.strokeStyle = POD[m.tipo].escura; c.lineWidth = 1.5;
          c.beginPath(); c.arc(x - larg / 2 + r + k * (r * 2 + 3), topo - 6, r, 0, TAU); c.fill(); c.stroke();
        }
        // o poder que lhe ganha brilha por cima
        if (FORTE[poder].indexOf(m.tipo) >= 0 && Math.sin(t * 5) > 0) {
          G.gfx.label(c, '💥', x, topo - 30, 22, '#fff', 'center', 'none');
        }
      }
    }

    // o Ash
    const ax = ash.x - camX;
    sombra(c, ax, 26, 0);
    c.save(); c.translate(ax, base);
    if (ash.dir < 0) c.scale(-1, 1);
    ashArt(c, t, { walk: ash.walk, lanca: ash.lanca });
    c.restore();
    if (ash.diz > 0) bub(c, ax, base - 160, 'Apanhei ' + ash.nome + '!');

    // o Pikachu
    const intro = fase === 'intro';
    const visivel = (!intro || faseT > 1.35) && !(amb && amb.dentro);
    if (visivel) {
      const hx = hero.x - camX, hy = sy(hero.alt);
      sombra(c, hx, 30, hero.alt);
      c.save(); c.translate(hx, hy);
      if (hero.nasce > 0) { const s = 1 - hero.nasce / 0.6; c.scale(0.3 + 0.7 * s, 0.3 + 0.7 * s); }
      if (hero.tonto > 0) c.rotate(Math.sin(t * 18) * 0.15);
      c.globalAlpha = hero.inv > 0 && Math.floor(t * 10) % 2 === 0 ? 0.55 : 1;
      const corre = hero.grounded && (G.input.isHeld('left') || G.input.isHeld('right'));
      const pulo = corre ? Math.abs(Math.sin(hero.walk)) * 7 : 0;
      c.translate(hero.atk > 0 ? hero.dir * 6 : 0, -pulo);
      // a cor do poder à volta do Pikachu
      if (poder !== 'eletrico' || hero.atk > 0) {
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = hero.atk > 0 ? 0.5 : 0.22;
        c.fillStyle = POD[poder].cor; c.beginPath(); c.arc(0, -46, 52, 0, TAU); c.fill(); c.restore();
      }
      const fid = hero.forma, fD = fid === 25 ? 108 : (CHEFE[fid] ? 165 : Math.min(140, 112 * (GRANDES[fid] || 1)));
      desenhaPoke(c, fid, fD, hero.dir > 0, function (cc) {
        cc.save(); if (hero.dir < 0) cc.scale(-1, 1);
        if (fid === 25) pikaPlanoB(cc, 108); else pokePlanoB(cc, { tipo: TIPO[fid] || 'eletrico', D: fD });
        cc.restore();
      });
      c.restore();
      if (campo > 0) {
        // no fim pisca, para se perceber que vai acabar
        const a = campo < 0.9 && Math.floor(t * 10) % 2 === 0 ? 0.35 : 1;
        campoArt(c, hx, hy - 48, 76, t, a);
      }
      if (hero.tonto > 0) {
        for (let k = 0; k < 3; k++) {
          const a = t * 7 + (k / 3) * TAU;
          G.gfx.star(c, hx + Math.cos(a) * 24, hy - 104 + Math.sin(a) * 7, 7, '#ffd166', a);
        }
      }
      if (intro && faseT > 1.9) bub(c, hx, hy - 110, 'Pika pika! ⚡');
    }

    // a Pokébola da abertura
    if (intro && faseT > 0.35 && faseT < 1.4) {
      const k = Math.min(1, (faseT - 0.35) / 0.9);
      const bx = ash.x + 28 + (hero.x - ash.x - 28) * k - camX;
      const ba = 140 * (1 - k) + Math.sin(k * Math.PI) * 120 + 12;
      pokebola(c, bx, sy(ba), 13, k * 14);
      if (faseT > 1.25) {
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8;
        c.fillStyle = '#fff'; c.beginPath(); c.arc(bx, sy(ba), 50, 0, TAU); c.fill(); c.restore();
      }
    }

    // ataques
    for (const s of tiros) { c.save(); c.translate(s.x - camX, sy(s.alt)); tiroArt(c, s.tipo, t + s.t, s.dir); c.restore(); }
    for (const b of balas) { c.save(); c.translate(b.x - camX, sy(b.alt)); tiroArt(c, b.tipo, t + b.t, -1); c.restore(); }

    // bolas de poder
    for (const o of orbes) {
      const x = o.x - camX, y = sy(o.alt), p = POD[o.tipo];
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6;
      c.fillStyle = p.cor; c.beginPath(); c.arc(x, y, 26 + Math.sin(t * 12) * 4, 0, TAU); c.fill(); c.restore();
      c.save(); c.translate(x, y); tiroArt(c, o.tipo, t, 1); c.restore();
    }

    // Pokébolas do Ash
    for (const b of bolas) {
      const m = b.alvo;
      const tx = m.x, ta = 14;
      if (b.fase === 'voa') {
        const k = Math.min(1, b.t / b.dur);
        const x = b.x0 + (tx - b.x0) * k, a = b.a0 * (1 - k) + ta * k + Math.sin(k * Math.PI) * 140;
        pokebola(c, x - camX, sy(a), 13, k * 16);
      } else if (b.fase === 'abana') {
        const n = Math.floor(b.t / 0.5), dentro = b.t - n * 0.5;
        const rot = n < 3 && dentro < 0.25 ? Math.sin(dentro / 0.25 * TAU) * 0.45 : 0;
        pokebola(c, tx - camX, sy(ta), 15, rot);
      } else {
        c.globalAlpha = Math.max(0, 1 - b.t / 0.6);
        pokebola(c, tx - camX, sy(ta + b.t * 120), 15, 0);
        G.gfx.star(c, tx - camX + 22, sy(ta + 30), 9, '#ffd166', t * 4);
        c.globalAlpha = 1;
      }
    }

    if (amb) ambulanciaArt(c, amb.x - camX, base, t, amb.dentro);

    for (const pr of premios) {
      c.save(); c.globalAlpha = Math.max(0, 1 - pr.t / 1.3);
      premioArt(c, pr.tipo, pr.x - camX, sy(pr.alt), t);
      c.restore();
    }
    for (const p of puffs) {
      c.globalAlpha = Math.max(0, 0.75 * (1 - p.t / p.life));
      c.fillStyle = p.col;
      c.beginPath(); c.arc(p.x - camX, sy(p.alt), p.r, 0, TAU); c.fill();
      c.globalAlpha = 1;
    }
    for (const s of sparks) {
      c.globalAlpha = Math.max(0, 1 - s.t / s.life);
      G.gfx.star(c, s.x - camX, sy(s.alt), 7, s.col, s.t * 6);
      c.globalAlpha = 1;
    }
    if (tema(kA).tipo === 'gelo') {   // neve a cair
      c.fillStyle = 'rgba(255,255,255,.85)';
      for (let k = 0; k < 40; k++) {
        const x = ((k * 97 + t * 30 - camX * 0.4) % W + W) % W, y = ((k * 53 + t * 60) % H);
        c.beginPath(); c.arc(x, y, 2 + (k % 3), 0, TAU); c.fill();
      }
    }
    c.restore();

    hud(c, t);
  };

  /* ---------- HUD (só desenhos: o Isaac ainda não lê) ---------- */
  // em ecrãs baixinhos (telemóvel deitado) a coluna toda encolhe, senão tapava o Pikachu
  function hudK() { return Math.min(1, G.H / 520); }
  function hud(c, t) {
    const hk = hudK();
    c.save(); c.scale(hk, hk);
    // estrelas
    G.gfx.star(c, 34, 40, 17, '#ffd166', 0);
    G.gfx.label(c, '' + G.state.stars, 60, 41, 28, '#b56b00');
    // corações
    for (let k = 0; k < MAXCOR; k++) {
      G.gfx.heart(c, 32 + k * 30, 82, 30, k < hero.cor ? '#ff4d6d' : 'rgba(255,255,255,.55)');
    }
    // Pokémon apanhados
    pokebola(c, 34, 118, 13, 0);
    G.gfx.label(c, '' + apanhados, 56, 119, 24, '#22223b');
    // insígnias: uma bolinha por cidade, com a cor do tipo
    for (let k = 0; k < TEMAS.length; k++) {
      const tm = TEMAS[k], p = POD[tm.tipo];
      const ganha = insignias > k || (insignias >= TEMAS.length);
      const x = 110 + k * 30, y = 118;
      c.beginPath();
      for (let j = 0; j < 10; j++) {
        const a = (j / 10) * TAU - Math.PI / 2, r = j % 2 ? 6 : 13;
        c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      c.closePath();
      c.fillStyle = ganha ? p.cor : 'rgba(255,255,255,.35)'; c.fill();
      c.strokeStyle = ganha ? p.escura : 'rgba(0,0,0,.25)'; c.lineWidth = 2; c.stroke();
    }
    // poderes: tocar num deles escolhe-o
    hudBtns = [];
    const r = 22;
    for (let k = 0; k < poderes.length; k++) {
      const x = 34 + k * (r * 2 + 12), y = 166;
      iconePoder(c, poderes[k], x, y, r, poderes[k] === poder, t);
      hudBtns.push({ x: x, y: y, r: r, tipo: poderes[k] });
    }
    // a nossa equipa: tocar numa cara transforma-nos nesse Pokémon (o Pikachu volta atrás).
    // Deitado vai para cima ao meio; ao alto fica por baixo da barra do caminho.
    if (equipa.length) {
      const deitado = G.W >= 560, GW = G.W / hk;
      const fx0 = deitado ? 330 : 34, fy = deitado ? 44 : 262, passo = 52;
      const cabem = Math.max(2, Math.floor((GW - (deitado ? 130 / hk : 20) - fx0) / passo) + 1);
      const lista = [25].concat(equipa.slice(-(cabem - 1)).reverse());
      for (let i = 0; i < lista.length; i++) {
        const id = lista[i], x = fx0 + i * passo, rr = 22, ativo = hero.forma === id;
        c.save();
        if (ativo) { c.fillStyle = '#ffd60a'; c.beginPath(); c.arc(x, fy, rr + 5, 0, TAU); c.fill(); }
        c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(x, fy, rr, 0, TAU); c.fill();
        c.strokeStyle = POD[TIPO[id] || 'eletrico'].escura; c.lineWidth = 3; c.stroke();
        c.beginPath(); c.arc(x, fy, rr - 1, 0, TAU); c.clip();
        c.translate(x, fy + rr * 0.95);
        desenhaPoke(c, id, rr * 2.3, false, function (cc) {
          cc.fillStyle = POD[TIPO[id] || 'eletrico'].cor;
          cc.beginPath(); cc.arc(0, -rr, rr * 0.7, 0, TAU); cc.fill();
        });
        c.restore();
        hudBtns.push({ x: x, y: fy, r: rr, forma: id });
      }
    }
    // caminho até à próxima cidade: Pikachu a andar para a casa do ginásio
    const k = etapaDe(hero.x);
    const prog = Math.max(0, Math.min(1, (hero.x - k * L) / (chefeX(k) - k * L)));
    const x0 = 24, x1 = Math.min(G.W / hk - 150, 260), y = 214;
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 8; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
    c.strokeStyle = POD[tema(k).tipo].cor; c.lineWidth = 6;
    c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + (x1 - x0) * prog, y); c.stroke();
    // casinha do ginásio no fim
    c.fillStyle = POD[tema(k).tipo].escura;
    c.beginPath(); c.moveTo(x1 - 4, y - 4); c.lineTo(x1 + 14, y - 20); c.lineTo(x1 + 32, y - 4); c.closePath(); c.fill();
    c.fillStyle = '#e9ecef'; c.fillRect(x1, y - 4, 28, 18);
    c.fillStyle = '#ffd60a';
    c.beginPath(); c.arc(x0 + (x1 - x0) * prog, y, 8, 0, TAU); c.fill();
    c.strokeStyle = '#7a5c00'; c.lineWidth = 2; c.stroke();
    c.restore();
  }

  S.debug = function () {
    return {
      fase: fase, x: Math.round(hero.x), alt: Math.round(hero.alt), etapa: etapaDe(hero.x),
      cor: hero.cor, poder: poder, poderes: poderes.slice(), insignias: insignias, apanhados: apanhados,
      ativos: ativos().length, perto: ativos().filter(function (m) { return Math.abs(m.x - hero.x) < vw(); }).length,
      balas: balas.length, tiros: tiros.length, stars: G.state.stars,
      balaBaixa: balas.reduce(function (mn, b) { const dd = b.x - hero.x; return b.altAlvo < 100 && dd > 0 && dd < mn ? dd : mn; }, 9999),
      escudos: maus.filter(function (m) { return m.escudo > 0; }).length,
      forma: hero.forma, equipa: equipa.slice(), campo: +campo.toFixed(1), campoCd: +campoCd.toFixed(1),
      caixas: Object.keys(caixasAbertas).length,
      dentro: dentro ? { tipo: dentro.tipo, faz: dentro.faz, pessoa: dentro.pessoa.nome, comidas: dentro.comidas.filter(function (q) { return !q.comida; }).length,
        prato: dentro.prato, marcas: dentro.marcas.filter(function (m) { return !m.feito; }).length, curado: dentro.curado } : null,
      porta: (function () { const p = portaPerto(); return p ? p.tipo + ':' + p.i : null; })(),
      imagens: Object.keys(imagens).filter(function (k) { return imagens[k].ok; }).length
    };
  };

  G.scenes = G.scenes || {};
  G.scenes.ash = S;
})();
