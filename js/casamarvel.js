/* Cena — A CASA ASSOMBRADA DA MARVEL, ditada pelo Isaac (2026-11-11).

   "Um jogo novo numa casa assombrada, temos de fugir de muitos monstros. Nós tiramos
   setas, é da Marvel, nós somos o Gavião Arqueiro, e tem a Pantera Negra, todos os
   lutadores da Marvel que existem no mundo. Tem de ser difícil."

   Como ficou:
   - Somos o GAVIÃO ARQUEIRO (fato roxo e preto, arco e aljava) dentro de uma casa
     assombrada enorme e escura. Só se vê bem à volta dele; os relâmpagos lá fora
     iluminam a sala de vez em quando pelas janelas.
   - ◀ ▶ anda e corre, ⬆ salta (e salta outra vez no ar), 🏹 dispara setas (segurar
     dispara sempre; a seta vai ao monstro mais perto que está à frente, em arco) e 💥 é
     a SETA DE LUZ: enche devagarinho e, quando está cheia, rebenta lá em cima, acende a
     sala toda e deixa tontos todos os monstros que se vêem.
   - Muitos monstros vêm atrás de nós, e também por trás: fantasmas que atravessam as
     paredes (e às vezes ficam transparentes e as setas passam-lhes por dentro),
     esqueletos que atiram ossos, múmias, aranhas gigantes que caem do teto, morcegos,
     zombies de Lego e armaduras que ganham vida. Temos de correr!
   - Ninguém morre (regra da coleção): quando um monstro fica sem energia assusta-se ou
     fica bonzinho, diz uma coisa fofinha e vai-se embora a flutuar, volta a dormir ou
     fica nosso amigo a acenar. Nunca há sangue.
   - Os heróis da Marvel estão presos nas salas da casa (em jaulas ou embrulhados em
     teias). Quando o Gavião passa por eles ficam livres e vêm connosco, cada um com o
     seu poder: a Pantera Negra (garras), o Homem-Aranha (teias), o Capitão América
     (escudo), o Thor (relâmpago), o Hulk (SMASH no chão) e o Homem de Ferro (repulsor).
   - Cinco andares: o hall de entrada, a biblioteca, o salão de baile, a cave das múmias
     e o sótão. Ao fundo de cada andar há uma escada para subir. No sótão está o REI
     FANTASMA; quando fica nosso amigo há festa com fogo de artifício e todos os heróis
     a saltar, e depois começa outra volta à casa, mais difícil.
   - É difícil, mas nunca há derrota: cada toque tira meio coração; sem corações o
     Gavião esconde-se num armário a descansar 💤 e volta com os 5 corações. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  /* ---------- dificuldade: está tudo aqui para afinar ---------- */
  const DIF = {
    MAXC: 5, DANO: 0.5, INV: 0.6, DESCANSO: 2.5,     // corações, quanto tira cada toque, invencível depois (s), armário (s)
    HP: { zombie: 5, esqueleto: 4, mumia: 8, aranha: 4, morcego: 3, fantasma: 4, armadura: 10 },
    VEL: { zombie: 110, esqueleto: 150, mumia: 85, aranha: 190, morcego: 250, fantasma: 175, armadura: 200 },
    GRUPOS: 13, GRUPOS_ANDAR: 3,                       // grupos de monstros espalhados pelo andar
    ATRAS_INT: 2.6, ATRAS_MIN: 1.1,                   // monstros que aparecem por trás (s)
    FRENTE_INT: 3.6, FRENTE_MIN: 1.6,                 // fantasmas e morcegos que vêm pela frente (s)
    MAX_MAUS: 30,
    FORCA_ANDAR: 0.12, FORCA_RONDA: 0.22,             // cada andar / volta: mais depressa
    OSSO_CD: [1.3, 2.4], BALA_V: 420,
    FANT_FASE: [2.6, 1.4],                            // fantasmas: tempo visível / tempo transparente (s)
    SETA_V: 1050, SETA_G: 520, SETA_CD: 0.26, ALCANCE: 900,
    ESPECIAL_T: 14, ESPECIAL_DANO: 3, TONTO: 3, LUZ: 4,
    CHEFE_HP: 95, CHEFE_RONDA: 30, CHEFE_CD: 1.2,
    RAIO_LUZ: 270, RELAMPAGO: [5, 11],
    PODER_CD: { pantera: 1.8, aranha: 2.0, capitao: 1.9, thor: 3.2, hulk: 3.6, ferro: 1.4 }
  };
  const GRAV = 2200, SALTO = 860, SALTO2 = 760, VEL = 330, SALA = 1300;

  const ANDARES = [
    { id: 'entrada', nome: 'O hall de entrada', fala: 'A casa assombrada! Cuidado com os monstros!', papel: '#3a2c4f', risca: '#2c2140', chao: '#4a3426',
      maus: ['zombie', 'esqueleto', 'morcego', 'fantasma'], presos: ['pantera'] },
    { id: 'biblioteca', nome: 'A biblioteca', fala: 'A biblioteca! Há aranhas no teto!', papel: '#2f3b2a', risca: '#243020', chao: '#3d2b1f',
      maus: ['fantasma', 'esqueleto', 'aranha', 'morcego'], presos: ['aranha'] },
    { id: 'salao', nome: 'O salão de baile', fala: 'O salão de baile! As armaduras estão a acordar!', papel: '#4a2030', risca: '#3a1825', chao: '#5a3a28',
      maus: ['armadura', 'fantasma', 'zombie', 'esqueleto'], presos: ['capitao'] },
    { id: 'cave', nome: 'A cave das múmias', fala: 'A cave! Cheira a múmia!', papel: '#3b3a33', risca: '#2d2c26', chao: '#33302a',
      maus: ['mumia', 'aranha', 'zombie', 'morcego'], presos: ['thor', 'hulk'] },
    { id: 'sotao', nome: 'O sótão do Rei Fantasma', fala: 'O sótão! Está aqui o Rei Fantasma!', papel: '#2a2440', risca: '#1f1a33', chao: '#3a2a20',
      maus: ['fantasma', 'esqueleto', 'aranha', 'morcego', 'armadura', 'mumia'], presos: ['ferro'], ultimo: true }
  ];
  const PELE = '#f2c6a0';
  const GAVIAO = { id: 'gaviao', tronco: '#4a1a6b', bracos: '#2b2b2b', maos: '#2b2b2b', pele: PELE, pernas: '#2b2b2b', ancas: '#4a1a6b', pes: '#1b1b1b' };
  // se o jogo da Marvel não estiver carregado, os heróis têm estas cores
  const HEROIS_RESERVA = [
    { id: 'ferro', nome: 'Homem de Ferro', tronco: '#b5121b', bracos: '#b5121b', maos: '#e8b923', pernas: '#b5121b', ancas: '#e8b923', pes: '#e8b923', pele: '#e8b923' },
    { id: 'aranha', nome: 'Homem-Aranha', tronco: '#d62828', bracos: '#d62828', maos: '#d62828', pernas: '#1d4e89', ancas: '#1d4e89', pes: '#d62828', pele: '#d62828' },
    { id: 'capitao', nome: 'Capitão América', tronco: '#1d4e89', bracos: '#1d4e89', maos: '#c1121f', pernas: '#1d4e89', ancas: '#1d4e89', pes: '#c1121f' },
    { id: 'thor', nome: 'Thor', capa: '#c1121f', tronco: '#3d405b', bracos: '#3d405b', pernas: '#2b2d42', ancas: '#2b2d42' },
    { id: 'hulk', nome: 'Hulk', grande: 1.35, pele: '#5fb041', tronco: '#5fb041', bracos: '#5fb041', maos: '#5fb041', pernas: '#6a3d9a', ancas: '#6a3d9a', pes: '#5fb041' },
    { id: 'pantera', nome: 'Pantera Negra', pele: '#16161d', tronco: '#1c1c26', bracos: '#1c1c26', maos: '#1c1c26', pernas: '#1c1c26', ancas: '#2b2b3a', pes: '#2b2b3a' }
  ];
  // os monstros de Lego (zombie, múmia e armadura): mau e bonzinho
  const LEGO = {
    zombie: { tronco: '#5d4037', bracos: '#7cb342', maos: '#7cb342', pele: '#8bc34a', pernas: '#37474f', ancas: '#263238', pes: '#3e2723' },
    mumia: { tronco: '#e9e3c9', bracos: '#e9e3c9', maos: '#e9e3c9', pele: '#efe9d0', pernas: '#ddd5b5', ancas: '#cfc6a3', pes: '#cfc6a3' },
    armadura: { tronco: '#9aa5b1', bracos: '#87929e', maos: '#6c757d', pele: '#adb5bd', pernas: '#87929e', ancas: '#5c636a', pes: '#495057', semRosto: true }
  };
  const FRASES = {
    zombie: ['Quero ser teu amigo!', 'Afinal gosto de abraços!'], esqueleto: ['Vou voltar a dormir!', 'Os meus ossinhos estão cansados!'],
    mumia: ['Que bom, um abraço!', 'Já não estou zangada!'], aranha: ['Vou para a minha teia!', 'Desculpa o susto!'],
    morcego: ['Vou dormir de cabeça para baixo!', 'Iiih, que luz!'], fantasma: ['Uuu... afinal sou bonzinho!', 'Buu! Brincadeira!'],
    armadura: ['Ao seu dispor, Gavião!', 'Clanc! Sou da tua equipa!']
  };

  let heroi, ents, setas, balas, fx, parts, textos, presos, equipa, livres, plataformas, janelas, chefe;
  let andar, ronda, tempo, LEN, camX, fase, faseT, especial, luz, relampago, relT, atrasT, frenteT;
  let nid = 0, piloto = false, descansos = 0, ganhos = 0, defsCache = {};

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function escolhe(l) { return l[Math.floor(Math.random() * l.length)]; }
  function vscale() { return Math.min(1, G.H / 620, G.W / 700); }
  function vw() { return G.W / vscale(); }
  function vh() { return G.H / vscale(); }
  // a linha do chão fica acima dos botões (ao alto há duas filas deles)
  function chaoY() {
    const reserva = G.W < 560 && G.H > G.W ? 236 : 122;
    return Math.min(vh() * 0.86, Math.max(vh() * 0.55, (G.H - reserva) / vscale()));
  }
  function teto() { return -Math.min(520, chaoY() - 40); }
  function fala(t) { if (G.audio.fala) G.audio.fala(t); }
  function sfx(n) { G.audio.sfx(n); }
  function A() { return ANDARES[andar]; }
  function texto(t, x, y, cor) { textos.push({ t: t, x: x, y: y, life: 2.2, age: 0, cor: cor || '#fff' }); }
  function forca() { return 1 + andar * DIF.FORCA_ANDAR + (ronda - 1) * DIF.FORCA_RONDA; }
  function noEcra(x, m) { return Math.abs(x - camX - vw() / 2) < vw() * (m || 0.55); }

  /* ---------- os bonecos de Lego vêm do jogo da Marvel ---------- */
  function marvelApi() { const m = G.scenes && G.scenes.marvel; return m && m.api; }
  function defHeroi(id) {
    const api = marvelApi(), l = (api && api.herois) || HEROIS_RESERVA;
    return l.find(function (h) { return h.id === id; }) || HEROIS_RESERVA.find(function (h) { return h.id === id; });
  }
  function defLego(tipo, bom) {
    const k = tipo + (bom ? '-bom' : '-mau');
    if (!defsCache[k]) defsCache[k] = Object.assign({ id: 'cm-' + k, expr: bom ? 'feliz' : 'mau' }, LEGO[tipo]);
    return defsCache[k];
  }
  function figura(c, d, o) {
    const api = marvelApi();
    if (api && api.boneco) { api.boneco(c, d, o); return; }
    // reserva simples (sem o jogo da Marvel)
    const k = d.grande || 1, p = o.anda ? Math.sin(o.fase || 0) * 6 : 0;
    c.save(); c.scale((o.dir || 1) * k, k);
    c.fillStyle = d.pernas; c.fillRect(-9 - p, -24, 8, 24); c.fillRect(1 + p, -24, 8, 24);
    c.fillStyle = d.tronco; G.gfx.rr(c, -12, -51, 24, 27, 4); c.fill();
    c.fillStyle = d.bracos; c.fillRect(8, -50, 6, 18);
    c.fillStyle = d.pele || '#f2c94c'; G.gfx.rr(c, -8, -68, 16, 17, 5); c.fill();
    c.restore();
  }
  function cabeca(c, d, x, y, esc, t) {
    if (G.legoCabecinha) { G.legoCabecinha(c, d, x, y, esc, t, {}); return; }
    c.fillStyle = d.pele || d.tronco; c.beginPath(); c.arc(x, y, 9 * esc, 0, TAU); c.fill();
  }

  S.enter = function () {
    ronda = 1; tempo = 0; livres = []; descansos = 0; ganhos = 0;
    comecaAndar(0);
  };

  /* ---------- um andar novo: salas, monstros, heróis presos e a escada ao fundo ---------- */
  function comecaAndar(i) {
    andar = i;
    LEN = 6000 + i * 600 + (A().ultimo ? 800 : 0);
    camX = 0;
    ents = []; setas = []; balas = []; fx = []; parts = []; textos = []; presos = []; plataformas = []; janelas = [];
    heroi = { x: 160, y: 0, vy: 0, dir: 1, noChao: true, saltos: 0, sobre: null, passo: 0, anda: false, cd: 0, tiro: 0,
      coracoes: DIF.MAXC, inv: 2, descansa: 0 };
    especial = 0.5; luz = 0; relampago = 0; relT = rnd(2, 4);
    // varandas, estantes e mesas onde se pode saltar
    for (let s = 0; s * SALA < LEN; s++) {
      const x0 = s * SALA;
      plataformas.push({ x: x0 + rnd(300, 500), w: rnd(170, 240), y: -140 });
      plataformas.push({ x: x0 + rnd(750, 1000), w: rnd(200, 280), y: -250 });
      if (Math.random() < 0.6) plataformas.push({ x: x0 + rnd(1050, 1200), w: 140, y: -120 });
      janelas.push(x0 + 260, x0 + 900);
    }
    // os monstros espalhados pelo andar
    const n = DIF.GRUPOS + i * DIF.GRUPOS_ANDAR + (ronda - 1) * 2;
    const de = 800, ate = LEN - (A().ultimo ? 1400 : 500), passo = (ate - de) / n;
    for (let g = 0; g < n; g++) {
      const gx = de + g * passo + rnd(0, passo * 0.5);
      const quantos = 1 + Math.floor(rnd(0, 1.6 + i * 0.35));
      for (let k = 0; k < quantos; k++) ents.push(monstro(escolhe(A().maus), gx + k * 80));
    }
    if (i >= 2) for (let k = 0; k < 2 + i; k++) ents.push(monstro('armadura', rnd(1200, LEN - 1000)));
    // os heróis presos (só os que ainda não estão livres)
    const ps = A().presos.filter(function (id) { return livres.indexOf(id) < 0; });
    ps.forEach(function (id, k) {
      const x = LEN * (0.45 + k * 0.25);
      presos.push({ id: id, def: defHeroi(id), x: x, tipo: id === 'aranha' || id === 'hulk' ? 'teia' : 'jaula', livre: false, t: 0 });
      ents.push(monstro(escolhe(A().maus), x + 150));
      ents.push(monstro(escolhe(A().maus), x - 260));
    });
    // a equipa que já está livre vem connosco
    equipa = livres.map(function (id, k) { return aliado(id, heroi.x - 70 - k * 50); });
    chefe = null;
    if (A().ultimo) {
      chefe = monstro('rei', LEN - 420);
      chefe.y = -220; chefe.k = 2.3; chefe.ativo = false; chefe.chefe = true;
      chefe.hp = chefe.max = DIF.CHEFE_HP + (ronda - 1) * DIF.CHEFE_RONDA;
      ents.push(chefe);
    }
    atrasT = 6; frenteT = 5;
    fase = 'joga'; faseT = 0;
    G.banner('🏚️ ' + A().nome, 2400);
    fala(A().fala);
  }

  function monstro(tipo, x) {
    const hp = (DIF.HP[tipo] || 10) + (ronda - 1) + (andar >= 3 ? 1 : 0);
    const e = { id: ++nid, tipo: tipo, x: x, y: 0, vx: 0, vy: 0, dir: -1, estado: 'mau', hp: hp, max: hp, k: 1,
      cd: rnd(1, 3), pisca: 0, tonto: 0, t: rnd(0, 6), passo: 0, fase: 0, fant: rnd(0, DIF.FANT_FASE[0]), transp: false,
      acordada: tipo !== 'armadura', pendura: tipo === 'aranha', saida: null, st: 0, alpha: 1 };
    if (tipo === 'fantasma') e.y = -rnd(80, 220);
    if (tipo === 'morcego') e.y = -rnd(180, 300);
    if (tipo === 'aranha') e.y = teto() + 30;
    return e;
  }
  function aliado(id, x) {
    return { id: id, def: defHeroi(id), x: x, y: id === 'ferro' ? -130 : 0, vy: 0, dir: 1, cd: rnd(0.5, 1.5), passo: 0, anda: false, noChao: true, ataque: 0 };
  }
  function maus() {
    return ents.filter(function (e) { return e.estado === 'mau' && (!e.chefe || e.ativo); });
  }
  function atingivel(e) { return e.estado === 'mau' && !e.transp && (!e.chefe || e.ativo) && e.acordada; }

  // o corpo de cada um (para as setas e os toques)
  function caixa(e) {
    switch (e.tipo) {
      case 'fantasma': return { x: e.x, y: e.y - 30, rx: 30, ry: 38 };
      case 'morcego': return { x: e.x, y: e.y, rx: 34, ry: 18 };
      case 'aranha': return { x: e.x, y: e.y - 26, rx: 44, ry: 28 };
      case 'rei': return { x: e.x, y: e.y - 40 * e.k, rx: 46 * e.k, ry: 60 * e.k };
      case 'armadura': return { x: e.x, y: e.y - 50, rx: 24, ry: 50 };
      default: return { x: e.x, y: e.y - 46, rx: 22, ry: 46 };
    }
  }
  function dentro(b, x, y, m) { const dx = (x - b.x) / (b.rx + (m || 0)), dy = (y - b.y) / (b.ry + (m || 0)); return dx * dx + dy * dy < 1; }
  function toca(b) {   // o monstro toca no Gavião?
    const hy = heroi.y - 46;
    return Math.abs(b.x - heroi.x) < b.rx + 16 && Math.abs(b.y - hy) < b.ry + 44;
  }

  /* ---------- tirar energia aos monstros: ninguém morre, ficam bonzinhos ---------- */
  function feri(e, n) {
    if (e.estado !== 'mau') return;
    e.hp -= n; e.pisca = 0.15;
    if (!e.acordada) acorda(e);
    if (e.hp > 0) return;
    e.hp = 0; e.estado = 'bom'; e.tonto = 0; e.st = 0; e.vx = 0;
    G.addStars(e.chefe ? 0 : 1);
    if (e.chefe) { reiAmigo(); return; }
    e.saida = { fantasma: 'sobe', morcego: 'sobe', aranha: 'sobe', esqueleto: 'dorme' }[e.tipo] || 'acena';
    texto(escolhe(FRASES[e.tipo]), e.x, caixa(e).y - caixa(e).ry - 30, '#ffe66d');
    for (let i = 0; i < 8; i++) parts.push({ x: e.x, y: caixa(e).y, vx: rnd(-160, 160), vy: rnd(-260, -60), t: 0, life: 0.8, cor: escolhe(['#ffd166', '#ff8fab', '#9bf6ff']), r: rnd(3, 6), estrela: true });
    sfx(e.tipo === 'fantasma' ? 'uuu' : (e.tipo === 'esqueleto' ? 'desmonta' : 'pop'));
  }
  function acorda(e) {
    if (e.acordada) return;
    e.acordada = true; e.pisca = 0.3; sfx('tampa');
    texto('Clanc!', e.x, -120, '#adb5bd');
  }
  function reiAmigo() {
    sfx('tada'); G.shake = 0.5;
    texto('Afinal eu só queria amigos para brincar!', chefe.x, chefe.y - 200, '#ffe66d');
    G.banner('👑 O Rei Fantasma ficou nosso amigo!', 2600);
    fala('O Rei Fantasma ficou nosso amigo! Só queria amigos para brincar!');
    for (const e of ents) if (e.estado === 'mau') { e.estado = 'bom'; e.saida = e.tipo === 'fantasma' || e.tipo === 'morcego' ? 'sobe' : 'acena'; }
    balas = [];
    fase = 'ganhou'; faseT = 0;
  }

  /* ---------- o piloto automático (para testar) ---------- */
  function autopiloto() {
    let salta = false;
    for (const e of ents) {
      if (e.estado !== 'mau' || e.transp || e.tonto > 0) continue;
      const b = caixa(e), d = (b.x - heroi.x) * heroi.dir;
      if (d > -30 && d < 150 && b.y > -110) salta = true;
    }
    for (const s of balas) if (Math.abs(s.x - heroi.x) < 140 && s.y > -120) salta = true;
    const perto = chefe && chefe.estado === 'mau' && heroi.x > limite() - 80;
    const vis = maus().filter(function (e) { return noEcra(e.x); }).length;
    return { ax: perto ? (Math.sin(tempo) > 0 ? 0.3 : -0.3) : 1, salta: salta && (heroi.noChao || (heroi.saltos < 2 && heroi.vy > -100)), fogo: true,
      especial: especial >= 1 && (vis >= 4 || (chefe && chefe.ativo && chefe.estado === 'mau')) };
  }
  function leInput() {
    if (piloto) return autopiloto();
    const I = G.input;
    return { ax: I.axis().x, salta: I.justPressed('jump'), fogo: I.isHeld('fire'), especial: I.justPressed('horn') };
  }
  function limite() { return chefe && chefe.estado === 'mau' ? chefe.x - 260 : LEN - 60; }

  /* ---------- update ---------- */
  S.update = function (dt) {
    dt = Math.min(dt, 1 / 30);
    tempo += dt;
    const inp = leInput();
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.t += dt; p.vy += (p.fogo ? 160 : 600) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.t > p.life) parts.splice(i, 1);
    }
    for (let i = textos.length - 1; i >= 0; i--) { textos[i].age += dt; textos[i].y -= 30 * dt; if (textos[i].age > textos[i].life) textos.splice(i, 1); }
    for (let i = fx.length - 1; i >= 0; i--) { fx[i].t += dt; if (fx[i].t > fx[i].life) fx.splice(i, 1); }
    luz = Math.max(0, luz - dt); relampago = Math.max(0, relampago - dt);
    relT -= dt;
    if (relT <= 0) {                 // trovoada lá fora
      relampago = 0.35; relT = rnd(DIF.RELAMPAGO[0], DIF.RELAMPAGO[1]);
      if (Math.random() < 0.6) sfx('trovao');
    }

    if (fase === 'sobe') {           // a subir a escada para o andar seguinte
      faseT += dt;
      heroi.x += 180 * dt; heroi.y = Math.max(-260, heroi.y - 130 * dt); heroi.passo += dt * 10; heroi.anda = true; heroi.dir = 1;
      seguem(dt);
      camX += (heroi.x - vw() * 0.4 - camX) * Math.min(1, dt * 3);
      if (faseT > 2) comecaAndar(andar + 1);
      return;
    }
    if (fase === 'festa') {
      faseT += dt;
      if (Math.random() < dt * 6) fogo(camX + rnd(100, vw() - 100), rnd(-vh() * 0.7, -vh() * 0.35));
      for (const a of equipa) if (a.noChao && a.id !== 'ferro' && Math.random() < dt * 2) { a.vy = -560; a.noChao = false; }
      seguem(dt); atualizaMonstros(dt);
      luz = 1;
      if (faseT > 10) {
        ronda++;
        G.banner('🏚️ Outra volta à casa! Agora é mais difícil', 2600);
        comecaAndar(0);
      }
      return;
    }
    if (fase === 'ganhou') {
      faseT += dt; luz = 1;
      seguem(dt); atualizaMonstros(dt);
      if (faseT > 2.8) {
        fase = 'festa'; faseT = 0; ganhos++;
        G.banner('🏆 GANHÁMOS! A CASA JÁ NÃO É ASSOMBRADA! 🎆', 6000);
        fala('Ganhámos! A casa já não é assombrada! Boa, Gavião Arqueiro!');
        G.addStars(20); sfx('golo');
      }
      return;
    }

    atualizaHeroi(dt, inp);
    chegam(dt);
    atualizaMonstros(dt);
    atualizaSetas(dt);
    atualizaBalas(dt);
    libertaPresos();
    seguem(dt);
    poderes(dt);
    if (chefe && !chefe.ativo && heroi.x > chefe.x - 900) {
      chefe.ativo = true; sfx('uivo'); G.shake = 0.4;
      G.banner('👻 O REI FANTASMA!', 2400);
      fala('Cuidado! É o Rei Fantasma! Setas nele!');
    }
    if (!A().ultimo && heroi.x > LEN - 170 && heroi.descansa <= 0) {
      fase = 'sobe'; faseT = 0; balas = [];
      G.addStars(5); sfx('door');
      G.banner('🪜 Para cima! O andar seguinte!', 1800);
    }
    camX += (clamp(heroi.x - vw() * 0.38 + heroi.dir * 60, 0, LEN + 100 - vw()) - camX) * Math.min(1, dt * 4);
    ents = ents.filter(function (e) {
      if (e.chefe) return true;
      if (e.saida === 'sobe') return e.y > teto() - 200;
      if (e.saida === 'dorme') return e.st < 5;
      if (e.estado === 'bom') return e.x > camX - 300;
      return e.x > camX - 1400 && e.x < LEN + 400;
    });
    if (document.body) document.body.classList.toggle('casa-especial-espera', especial < 1);
  };

  function atualizaHeroi(dt, inp) {
    const h = heroi;
    h.inv = Math.max(0, h.inv - dt); h.tiro = Math.max(0, h.tiro - dt); h.cd -= dt;
    especial = Math.min(1, especial + dt / DIF.ESPECIAL_T);
    if (h.descansa > 0) {             // escondido no armário
      h.descansa -= dt; h.anda = false;
      if (h.descansa <= 0) {
        h.coracoes = DIF.MAXC; h.inv = 2; sfx('suit');
        G.banner('Pronto outra vez! 🏹', 1500); fala('Já descansei! Vamos!');
      }
      return;
    }
    const ax = inp.ax;
    h.anda = Math.abs(ax) > 0.1;
    if (h.anda) { h.dir = ax > 0 ? 1 : -1; h.passo += dt * 12 * Math.abs(ax); }
    h.x = clamp(h.x + ax * VEL * dt, 40, limite());
    if (inp.salta) {
      if (h.noChao) { h.vy = -SALTO; h.noChao = false; h.sobre = null; h.saltos = 1; sfx('hop'); }
      else if (h.saltos < 2) { h.vy = -SALTO2; h.saltos = 2; sfx('whoosh'); }
    }
    const antes = h.y;
    h.vy += GRAV * dt; h.y += h.vy * dt;
    if (h.sobre && Math.abs(h.x - h.sobre.x) > h.sobre.w / 2 + 6) { h.sobre = null; h.noChao = false; }
    if (h.vy >= 0) {
      for (const p of plataformas) {
        if (antes <= p.y + 1 && h.y >= p.y && Math.abs(h.x - p.x) < p.w / 2) { h.y = p.y; h.vy = 0; h.noChao = true; h.sobre = p; h.saltos = 0; }
      }
    }
    if (h.y >= 0) { h.y = 0; h.vy = 0; h.noChao = true; h.sobre = null; h.saltos = 0; }
    if (inp.fogo && h.cd <= 0) { dispara(); h.cd = DIF.SETA_CD; }
    if (inp.especial && especial >= 1) setaDeLuz();
  }

  // o Gavião dispara: a seta vai ao monstro mais perto à frente (ou vira-se se só os há atrás)
  function alvoMaisPerto(x, y, dir, alcance) {
    let melhor = null, md = 1e9;
    for (const e of ents) {
      if (!atingivel(e)) continue;
      const b = caixa(e), dx = b.x - x;
      if (dir && dx * dir < -10) continue;
      const d = Math.hypot(dx, b.y - y);
      if (d < alcance && d < md) { md = d; melhor = e; }
    }
    return melhor;
  }
  function dispara() {
    const h = heroi, ox = h.x + h.dir * 26, oy = h.y - 62;
    let alvo = alvoMaisPerto(ox, oy, h.dir, DIF.ALCANCE);
    if (!alvo) { alvo = alvoMaisPerto(ox, oy, -h.dir, 450); if (alvo) h.dir = -h.dir; }
    let vx = h.dir * DIF.SETA_V, vy = -60;
    if (alvo) {
      const b = caixa(alvo), dx = b.x + (alvo.vx || 0) * 0.15 - (h.x + h.dir * 26), dy = b.y - oy;
      const tt = Math.max(0.08, Math.hypot(dx, dy) / DIF.SETA_V);
      vx = dx / tt; vy = (dy - 0.5 * DIF.SETA_G * tt * tt) / tt;
    }
    setas.push({ x: h.x + h.dir * 26, y: oy, vx: vx, vy: vy, t: 0 });
    h.tiro = 0.18; sfx('arco');
  }
  function setaDeLuz() {
    especial = 0; luz = DIF.LUZ; G.shake = 0.35;
    sfx('zap'); sfx('trovao');
    fx.push({ tipo: 'luz', x: heroi.x, y: heroi.y - 300, t: 0, life: 0.9 });
    G.banner('💥 SETA DE LUZ!', 1200);
    for (const e of ents) {
      if (e.estado !== 'mau' || !noEcra(e.x, 0.6)) continue;
      e.transp = false; e.fant = 0;
      if (!e.chefe) e.tonto = DIF.TONTO;
      feri(e, DIF.ESPECIAL_DANO);
    }
    balas = [];
  }

  /* ---------- monstros novos a chegar: por trás e pela frente ---------- */
  function chegam(dt) {
    if (heroi.descansa > 0) return;
    const nMaus = maus().length;
    atrasT -= dt; frenteT -= dt;
    if (atrasT <= 0) {
      atrasT = Math.max(DIF.ATRAS_MIN, DIF.ATRAS_INT / forca());
      if (nMaus < DIF.MAX_MAUS && heroi.x > 500) {
        const tipo = escolhe(['zombie', 'esqueleto', 'fantasma'].concat(A().maus));
        const e = monstro(tipo === 'aranha' ? 'zombie' : tipo, camX - 60);
        ents.push(e);
      }
    }
    if (frenteT <= 0) {
      frenteT = Math.max(DIF.FRENTE_MIN, DIF.FRENTE_INT / forca());
      if (nMaus < DIF.MAX_MAUS && heroi.x < limite() - 400) ents.push(monstro(Math.random() < 0.55 ? 'fantasma' : 'morcego', camX + vw() + 60));
    }
  }

  function atualizaMonstros(dt) {
    const h = heroi, f = forca(), escondido = h.descansa > 0;
    for (const e of ents) {
      e.t += dt; e.pisca = Math.max(0, e.pisca - dt); e.tonto = Math.max(0, e.tonto - dt);
      if (e.estado === 'bom') { saida(e, dt); continue; }
      if (e.chefe) { rei(e, dt); continue; }
      const v = (DIF.VEL[e.tipo] || 100) * f * (e.tonto > 0 ? 0 : 1);
      const dx = h.x - e.x, alvoX = escondido ? e.x - Math.sign(dx || 1) * 100 : h.x;
      if (Math.abs(alvoX - e.x) > 8) e.dir = alvoX > e.x ? 1 : -1;
      switch (e.tipo) {
        case 'fantasma':           // voa e atravessa as paredes; às vezes fica transparente
          e.fant -= dt;
          if (e.fant <= 0) { e.transp = !e.transp; e.fant = e.transp ? DIF.FANT_FASE[1] : DIF.FANT_FASE[0] + rnd(0, 1); }
          e.vx += (Math.sign(alvoX - e.x) * v - e.vx) * Math.min(1, dt * 2);
          e.vy += ((h.y - 50 + Math.sin(e.t * 2) * 50 - e.y) * 1.4 - e.vy) * Math.min(1, dt * 2);
          if (e.tonto > 0) { e.vx = 0; e.vy = 0; }
          e.x += e.vx * dt; e.y = Math.min(-20, e.y + e.vy * dt);
          break;
        case 'morcego':            // às voltas lá em cima e depois mergulha
          e.vx = Math.sign(alvoX - e.x) * v * (Math.abs(dx) > 120 ? 1 : 0.4);
          e.x += e.vx * dt;
          e.y += ((Math.abs(dx) < 200 ? h.y - 70 : -240) + Math.sin(e.t * 5) * 30 - e.y) * Math.min(1, dt * 2.2) * (e.tonto > 0 ? 0 : 1);
          break;
        case 'aranha':             // pendurada no teto; cai quando passamos por baixo
          if (e.pendura) {
            e.y = teto() + 30 + Math.sin(e.t * 2) * 8;
            if (Math.abs(dx) < 260 && e.tonto <= 0) { e.pendura = false; e.vy = 0; sfx('susto'); }
          } else {
            e.vy += GRAV * 0.6 * dt; e.y = Math.min(0, e.y + e.vy * dt);
            if (e.y >= 0) { e.vx = Math.sign(alvoX - e.x) * v; e.x += e.vx * dt; e.passo += dt * 14; }
          }
          break;
        case 'armadura':           // fica quieta até chegarmos perto, depois acorda e corre
          if (!e.acordada) { if (Math.abs(dx) < 330) acorda(e); break; }
          e.vx = Math.sign(alvoX - e.x) * v; e.x += e.vx * dt; e.passo += dt * 9 * (v > 0 ? 1 : 0);
          break;
        default:                   // zombies, esqueletos e múmias andam atrás de nós
          e.vx = Math.abs(alvoX - e.x) > 10 ? Math.sign(alvoX - e.x) * v : 0; e.x += e.vx * dt; e.passo += dt * (e.tipo === 'esqueleto' ? 12 : 7) * (v > 0 ? 1 : 0);
          if (e.tipo === 'esqueleto' && e.tonto <= 0 && !escondido && Math.abs(dx) < 650 && noEcra(e.x)) {
            e.cd -= dt;
            if (e.cd <= 0) { e.cd = rnd(DIF.OSSO_CD[0], DIF.OSSO_CD[1]) / f; atiraOsso(e); }
          }
      }
      // tocar no Gavião
      if (!escondido && e.tonto <= 0 && !e.transp && e.acordada && h.inv <= 0 && toca(caixa(e))) magoa();
    }
  }
  function saida(e, dt) {
    e.st += dt; e.tonto = 0; e.transp = false;
    if (e.saida === 'sobe') { e.y -= (e.tipo === 'aranha' ? 160 : 110) * dt; e.x += Math.sin(e.st * 3) * 30 * dt; }
    else if (e.saida === 'dorme') e.alpha = clamp(1.5 - e.st / 3.3, 0, 1);
    else if (e.saida === 'acena' && (e.tipo === 'fantasma' || e.tipo === 'morcego')) e.y -= 60 * dt;
  }
  function atiraOsso(e) {
    const dx = heroi.x - e.x, tt = clamp(Math.abs(dx) / 380, 0.6, 1.5);
    balas.push({ tipo: 'osso', x: e.x, y: -80, vx: dx / tt, vy: (heroi.y - 50 + 80 - 0.5 * 900 * tt * tt) / tt, g: 900, t: 0 });
    sfx('hop');
  }

  // o REI FANTASMA: flutua, atira bolas de ectoplasma e chama fantasminhas
  function rei(e, dt) {
    if (!e.ativo) { e.y = -220 + Math.sin(e.t) * 20; return; }
    const h = heroi;
    e.dir = h.x > e.x ? 1 : -1;
    const alvoX = clamp(h.x + 330, LEN - 900, LEN - 200);
    e.x += (alvoX - e.x) * Math.min(1, dt * 0.6);
    e.y = -230 + Math.sin(e.t * 1.3) * 70;
    if (e.tonto > 0) return;
    e.cd -= dt;
    if (e.cd <= 0 && h.descansa <= 0) {
      e.cd = DIF.CHEFE_CD / forca() + rnd(0, 0.6);
      const n = 3 + Math.min(3, andar + ronda - 4), b = caixa(e);
      const a0 = Math.atan2(h.y - 50 - b.y, h.x - b.x);
      for (let i = 0; i < n; i++) {
        const a = a0 + (i - (n - 1) / 2) * 0.22, v = DIF.BALA_V * (0.9 + ronda * 0.1);
        balas.push({ tipo: 'ecto', x: b.x, y: b.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0, t: 0 });
      }
      sfx('uuu');
      if (Math.random() < 0.3 && maus().length < DIF.MAX_MAUS) {
        for (let k = 0; k < 2; k++) { const g = monstro('fantasma', e.x + rnd(-80, 80)); g.y = e.y; ents.push(g); }
      }
    }
    if (h.inv <= 0 && h.descansa <= 0 && toca(caixa(e))) magoa();
  }

  function magoa() {
    const h = heroi;
    if (h.inv > 0 || h.descansa > 0) return;
    h.coracoes = Math.max(0, h.coracoes - DIF.DANO); h.inv = DIF.INV;
    sfx('ouch'); G.shake = Math.max(G.shake, 0.25);
    if (h.coracoes <= 0) {
      h.descansa = DIF.DESCANSO; descansos++;
      h.y = 0; h.vy = 0; h.noChao = true; h.sobre = null;
      sfx('door');
      G.banner('💤 O Gavião escondeu-se no armário a descansar...', 2200);
      fala('Vou esconder-me no armário um bocadinho!');
      // os monstros perto assustam-se e afastam-se
      for (const e of ents) if (e.estado === 'mau' && !e.chefe && Math.abs(e.x - h.x) < 300) e.x += Math.sign(e.x - h.x || 1) * 200;
      balas = [];
    }
  }

  function atualizaSetas(dt) {
    for (let i = setas.length - 1; i >= 0; i--) {
      const s = setas[i];
      s.t += dt; s.vy += DIF.SETA_G * dt; s.x += s.vx * dt; s.y += s.vy * dt;
      let fora = s.t > 1.6 || s.y > 0 || s.y < teto() - 50;
      for (const e of ents) {
        if (fora) break;
        if (!atingivel(e)) continue;
        if (dentro(caixa(e), s.x, s.y, 6)) { feri(e, 1); fora = true; sfx('pop'); }
      }
      if (fora) {
        if (s.y > -2) parts.push({ x: s.x, y: -2, vx: 0, vy: -60, t: 0, life: 0.3, cor: '#adb5bd', r: 3 });
        setas.splice(i, 1);
      }
    }
  }
  function atualizaBalas(dt) {
    for (let i = balas.length - 1; i >= 0; i--) {
      const b = balas[i];
      if (!b) continue;               // (magoa() pode limpar as balas a meio)
      b.t += dt; b.vy += b.g * dt; b.x += b.vx * dt; b.y += b.vy * dt;
      let fora = b.t > 4 || b.y > 0;
      if (!fora && heroi.descansa <= 0 && heroi.inv <= 0 && Math.abs(b.x - heroi.x) < 22 && b.y > heroi.y - 92 && b.y < heroi.y + 4) { magoa(); fora = true; }
      if (fora && balas[i] === b) balas.splice(i, 1);
    }
  }

  function libertaPresos() {
    for (const p of presos) {
      p.t += 0.016;
      if (p.livre || heroi.descansa > 0) continue;
      if (Math.abs(heroi.x - p.x) < 80) {      // basta passar por perto (mesmo a saltar)
        p.livre = true; livres.push(p.id);
        sfx(p.tipo === 'teia' ? 'teia' : 'quebra'); sfx('tada');
        G.addStars(3);
        const nome = p.def.nome || p.id;
        G.banner('🦸 ' + nome + ' está livre!', 2200);
        fala(nome + ' está livre! Vem connosco!');
        texto('Obrigado, Gavião!', p.x, -130, '#9bf6ff');
        const a = aliado(p.id, p.x); a.vy = -600; a.noChao = false; a.y = -10;
        equipa.push(a);
        for (let i = 0; i < 14; i++) parts.push({ x: p.x, y: -50, vx: rnd(-220, 220), vy: rnd(-380, -80), t: 0, life: 0.9, cor: p.tipo === 'teia' ? '#f1f3f5' : '#adb5bd', r: rnd(3, 6) });
      }
    }
  }

  /* ---------- a equipa de heróis segue o Gavião ---------- */
  function seguem(dt) {
    equipa.forEach(function (a, k) {
      a.ataque = Math.max(0, a.ataque - dt);
      const alvo = heroi.x - heroi.dir * (70 + k * 48);
      const dx = alvo - a.x;
      a.anda = Math.abs(dx) > 14;
      if (a.anda) { a.x += Math.sign(dx) * Math.min(Math.abs(dx), (Math.abs(dx) > 300 ? 620 : 360) * dt); a.dir = dx > 0 ? 1 : -1; a.passo += dt * 12; }
      if (a.id === 'ferro') { a.y += (heroi.y - 140 + Math.sin(tempo * 2 + k) * 14 - a.y) * Math.min(1, dt * 3); return; }
      a.vy += GRAV * dt; a.y += a.vy * dt;
      if (a.y >= 0) { a.y = 0; a.vy = 0; a.noChao = true; }
      if (a.noChao && heroi.y < -100 && Math.random() < dt * 1.5) { a.vy = -700; a.noChao = false; }
    });
  }
  function poderes(dt) {
    for (const a of equipa) {
      a.cd -= dt;
      if (a.cd > 0) continue;
      const alcance = a.id === 'hulk' ? 260 : 560;
      const e = alvoMaisPerto(a.x, a.y - 50, 0, alcance);
      if (!e) { a.cd = 0.3; continue; }
      a.cd = (DIF.PODER_CD[a.id] || 1.5) * rnd(0.85, 1.15);
      a.dir = e.x > a.x ? 1 : -1; a.ataque = 0.35;
      const b = caixa(e);
      switch (a.id) {
        case 'pantera':
          a.x = e.x - a.dir * 40; a.vy = -420; a.noChao = false;
          fx.push({ tipo: 'garras', x: b.x, y: b.y, t: 0, life: 0.4 });
          feri(e, 2); sfx('ninja'); break;
        case 'aranha':
          fx.push({ tipo: 'fio', x: a.x, y: a.y - 55, x2: b.x, y2: b.y, cor: '#f1f3f5', t: 0, life: 0.3 });
          fx.push({ tipo: 'teia', x: b.x, y: b.y, t: 0, life: 1.6 });
          e.tonto = Math.max(e.tonto, 2); feri(e, 1); sfx('teia'); break;
        case 'capitao':
          fx.push({ tipo: 'escudo', x: a.x, y: a.y - 45, x2: b.x, y2: b.y, t: 0, life: 0.6 });
          feri(e, 2); sfx('escudo'); break;
        case 'thor':
          fx.push({ tipo: 'raio', x: b.x, y: b.y, t: 0, life: 0.35 });
          relampago = Math.max(relampago, 0.12);
          feri(e, 3); sfx('trovao'); break;
        case 'hulk':
          fx.push({ tipo: 'anel', x: a.x, y: 0, t: 0, life: 0.5 });
          G.shake = Math.max(G.shake, 0.3);
          for (const m of ents) if (atingivel(m) && !m.chefe && Math.abs(m.x - a.x) < 260 && caixa(m).y > -200) { m.tonto = Math.max(m.tonto, 1.5); feri(m, 2); }
          if (e.chefe) feri(e, 2);
          sfx('smash'); break;
        case 'ferro':
          fx.push({ tipo: 'fio', x: a.x + a.dir * 10, y: a.y - 40, x2: b.x, y2: b.y, cor: '#9bf6ff', largo: 6, t: 0, life: 0.2 });
          feri(e, 1.5); sfx('repulsor'); break;
      }
    }
  }

  function fogo(x, y) {
    const cor = escolhe(['#ffd166', '#ff5d8f', '#9bf6ff', '#80ff72', '#c77dff']);
    for (let i = 0; i < 20; i++) {
      const a = i / 20 * TAU;
      parts.push({ x: x, y: y, vx: Math.cos(a) * 240, vy: Math.sin(a) * 240, t: 0, life: 1.1, cor: cor, r: 4, fogo: true });
    }
    sfx('pop');
  }

  /* =================================================================
     DESENHAR
     ================================================================= */
  S.draw = function (c, t) {
    const vs = vscale(), W = vw(), H = vh(), chao = chaoY();
    c.save(); c.scale(vs, vs);
    c.fillStyle = '#120d1c'; c.fillRect(0, 0, W, H);
    c.save(); c.translate(-camX, chao);
    casa(c, W, H, chao, t);
    for (const p of presos) desenhaPreso(c, p, t);
    for (const e of ents) if (e.chefe) desenhaRei(c, e, t);
    for (const e of ents) if (!e.chefe && e.tipo !== 'fantasma' && e.tipo !== 'morcego') desenhaMonstro(c, e, t);
    for (const a of equipa) desenhaAliado(c, a, t);
    desenhaGaviao(c, t);
    for (const e of ents) if (!e.chefe && (e.tipo === 'fantasma' || e.tipo === 'morcego')) desenhaMonstro(c, e, t);
    for (const s of setas) desenhaSeta(c, s);
    for (const f of fx) desenhaFx(c, f, t);
    for (const p of parts) {
      c.globalAlpha = Math.max(0, 1 - p.t / p.life);
      if (p.estrela) G.gfx.star(c, p.x, p.y, p.r * 1.6, p.cor, p.t * 4);
      else { c.fillStyle = p.cor; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); }
    }
    c.globalAlpha = 1;
    c.restore();
    escuro(c, W, H, chao, t);
    // por cima do escuro: as balas dos maus brilham e os textos lêem-se
    c.save(); c.translate(-camX, chao);
    for (const b of balas) desenhaBala(c, b, t);
    for (const tx of textos) {
      c.globalAlpha = Math.max(0, Math.min(1, (tx.life - tx.age) * 2));
      G.gfx.label(c, tx.t, tx.x, tx.y, 22, tx.cor, 'center', 'rgba(0,0,0,.85)');
    }
    c.globalAlpha = 1;
    c.restore();
    if (fase === 'festa') desenhaFesta(c, W, H, t);
    if (fase === 'sobe') { c.fillStyle = 'rgba(0,0,0,' + clamp((faseT - 1) * 1.2, 0, 1) + ')'; c.fillRect(0, 0, W, H); }
    c.restore();
    hud(c, t);
  };

  // as paredes, as janelas com relâmpagos, as portas das salas, o chão e a escada
  function casa(c, W, H, chao, t) {
    const a = A(), x0 = camX - 50, x1 = camX + W + 50, top = -chao - 10, ty = teto();
    c.fillStyle = a.papel; c.fillRect(x0, top, x1 - x0, chao + 10);
    c.fillStyle = a.risca;
    for (let x = Math.floor(x0 / 60) * 60; x < x1; x += 60) c.fillRect(x, ty, 18, -ty);
    // rodapé e lambrim
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x0, -90, x1 - x0, 90);
    c.fillStyle = '#2a1d14'; c.fillRect(x0, -94, x1 - x0, 6);
    // teto com vigas e teias de aranha
    c.fillStyle = '#1a1220'; c.fillRect(x0, top, x1 - x0, ty - top);
    c.fillStyle = '#2b1e2e';
    for (let x = Math.floor(x0 / 220) * 220; x < x1; x += 220) c.fillRect(x, ty - 6, 26, 22);
    c.strokeStyle = 'rgba(230,230,240,.35)'; c.lineWidth = 1.2;
    for (let x = Math.floor(x0 / 700) * 700 + 30; x < x1; x += 700) {
      for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(x, ty); c.lineTo(x + Math.cos(k * 0.38) * 70, ty + Math.sin(k * 0.38) * 70); c.stroke(); }
      for (let r = 20; r < 70; r += 16) { c.beginPath(); c.arc(x, ty, r, 0, Math.PI / 2); c.stroke(); }
    }
    // janelas: lá fora é noite e às vezes há relâmpagos
    for (const jx of janelas) {
      if (jx < x0 - 200 || jx > x1 + 50) continue;
      const jy = Math.max(ty + 40, -330), jw = 110, jh = 160;
      c.fillStyle = '#3d2a1e'; G.gfx.rr(c, jx - 8, jy - 8, jw + 16, jh + 16, 10); c.fill();
      c.fillStyle = relampago > 0 ? '#e8f4ff' : '#1b2a4a'; G.gfx.rr(c, jx, jy, jw, jh, 50); c.fill();
      if (relampago <= 0) { c.fillStyle = '#f1f3c2'; c.beginPath(); c.arc(jx + 75, jy + 45, 16, 0, TAU); c.fill(); c.fillStyle = '#1b2a4a'; c.beginPath(); c.arc(jx + 82, jy + 40, 14, 0, TAU); c.fill(); }
      else { c.strokeStyle = '#ffd60a'; c.lineWidth = 4; c.beginPath(); c.moveTo(jx + 60, jy + 10); c.lineTo(jx + 45, jy + 70); c.lineTo(jx + 65, jy + 75); c.lineTo(jx + 50, jy + 140); c.stroke(); }
      c.fillStyle = '#3d2a1e'; c.fillRect(jx + jw / 2 - 3, jy, 6, jh); c.fillRect(jx, jy + jh / 2 - 3, jw, 6);
    }
    // quadros com olhos que seguem o Gavião, e velas
    for (let x = Math.floor(x0 / SALA) * SALA + 620; x < x1; x += SALA) {
      const qy = Math.max(ty + 50, -300);
      c.fillStyle = '#c9a227'; G.gfx.rr(c, x - 40, qy - 8, 80, 104, 6); c.fill();
      c.fillStyle = '#3b2f2f'; c.fillRect(x - 32, qy, 64, 88);
      c.fillStyle = '#6d597a'; c.beginPath(); c.arc(x, qy + 34, 18, 0, TAU); c.fill();
      c.fillRect(x - 22, qy + 52, 44, 36);
      const ox = clamp((heroi.x - x) / 300, -2, 2);
      c.fillStyle = '#fff'; c.beginPath(); c.arc(x - 7, qy + 32, 4.5, 0, TAU); c.arc(x + 7, qy + 32, 4.5, 0, TAU); c.fill();
      c.fillStyle = '#c1121f'; c.beginPath(); c.arc(x - 7 + ox, qy + 32, 2, 0, TAU); c.arc(x + 7 + ox, qy + 32, 2, 0, TAU); c.fill();
      for (const vx of [x - 140, x + 140]) {
        c.fillStyle = '#5c4033'; c.fillRect(vx - 14, -150, 28, 6);
        c.fillStyle = '#f1f3f5'; c.fillRect(vx - 4, -176, 8, 26);
        c.fillStyle = '#ffb703'; c.beginPath(); c.ellipse(vx, -184 + Math.sin(t * 9 + vx) * 1.5, 4, 8, 0, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,183,3,.15)'; c.beginPath(); c.arc(vx, -182, 30, 0, TAU); c.fill();
      }
    }
    // as portas entre as salas (os fantasmas passam pelas paredes!)
    for (let x = Math.floor(x0 / SALA) * SALA; x < x1; x += SALA) {
      if (x <= 0) continue;
      c.fillStyle = '#21161b'; c.fillRect(x - 30, ty, 60, -ty - 200);
      c.fillStyle = '#4a3426'; G.gfx.rr(c, x - 62, -220, 124, 220, 50); c.fill();
      c.fillStyle = '#0d0910'; G.gfx.rr(c, x - 50, -208, 100, 208, 44); c.fill();
      c.fillStyle = '#6b4a2b'; c.save(); c.translate(x - 50, -208); c.transform(0.45, 0.12, 0, 1, 0, 0); c.fillRect(0, 0, 100, 208); c.restore();
      c.fillStyle = '#c9a227'; c.beginPath(); c.arc(x - 18, -100, 4, 0, TAU); c.fill();
    }
    // as varandas e estantes
    for (const p of plataformas) {
      if (p.x + p.w < x0 || p.x - p.w > x1) continue;
      c.fillStyle = '#5c3d2e'; c.fillRect(p.x - p.w / 2, p.y, p.w, 14);
      c.fillStyle = '#7a5240'; c.fillRect(p.x - p.w / 2, p.y, p.w, 4);
      c.fillStyle = '#3b2a20';
      for (let k = -1; k <= 1; k += 2) c.fillRect(p.x + k * (p.w / 2 - 12) - 4, p.y + 14, 8, -p.y - 14);
      if (a.id === 'biblioteca') for (let k = 0; k < p.w / 14 - 1; k++) { c.fillStyle = ['#9d0208', '#264653', '#e9c46a', '#2a9d8f'][k % 4]; c.fillRect(p.x - p.w / 2 + 6 + k * 14, p.y - 22, 10, 22); }
    }
    // o chão de tábuas
    c.fillStyle = a.chao; c.fillRect(x0, 0, x1 - x0, chao + 20);
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2;
    for (let x = Math.floor(x0 / 90) * 90; x < x1; x += 90) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, chao); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(x0, 0, x1 - x0, 5);
    // a escada ao fundo (ou o trono do Rei Fantasma no sótão)
    if (!a.ultimo) {
      const ex = LEN - 200;
      c.fillStyle = '#5c3d2e';
      for (let k = 0; k < 8; k++) c.fillRect(ex + k * 32, -k * 34 - 34, 300 - k * 32, 34);
      c.fillStyle = '#7a5240'; for (let k = 0; k < 8; k++) c.fillRect(ex + k * 32, -k * 34 - 34, 300 - k * 32, 5);
      G.gfx.label(c, '⬆', ex + 60, -320, 40, '#ffd166', 'center', 'rgba(0,0,0,.6)');
    }
  }

  // o escuro com a luz à volta do Gavião (como a visão no Star Wars assustador)
  function escuro(c, W, H, chao, t) {
    if (fase === 'festa' || fase === 'ganhou') return;
    const px = heroi.x - camX, py = chao + heroi.y - 50;
    const R = luz > 0 ? 900 : DIF.RAIO_LUZ + (equipa.length ? 30 : 0);
    const forte = relampago > 0 ? 0.25 : (luz > 0 ? 0.3 : 0.93);
    c.save();
    const g = c.createRadialGradient(px, py, R * 0.3, px, py, R);
    g.addColorStop(0, 'rgba(8,4,16,0)'); g.addColorStop(1, 'rgba(8,4,16,' + forte + ')');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // no escuro só se vêem os olhos dos monstros a brilhar
    for (const e of ents) {
      if (e.estado !== 'mau' || e.chefe || e.transp) continue;
      const b = caixa(e), sx = b.x - camX, sy = chao + b.y - b.ry * 0.45;
      if (sx < -40 || sx > W + 40 || Math.hypot(sx - px, sy - py) < R * 0.7) continue;
      if (Math.sin(t * 2 + e.id) > 0.9) continue;
      c.fillStyle = 'rgba(255,60,60,.25)'; c.beginPath(); c.arc(sx - 7, sy, 8, 0, TAU); c.arc(sx + 7, sy, 8, 0, TAU); c.fill();
      c.fillStyle = '#ff5d5d'; c.beginPath(); c.arc(sx - 7, sy, 3, 0, TAU); c.arc(sx + 7, sy, 3, 0, TAU); c.fill();
    }
    // o peito do Homem de Ferro também dá luz
    for (const a of equipa) if (a.id === 'ferro') { c.fillStyle = 'rgba(155,246,255,.35)'; c.beginPath(); c.arc(a.x - camX, chao + a.y - 40, 10, 0, TAU); c.fill(); }
    c.restore();
  }

  /* ---------- o Gavião Arqueiro (roxo e preto, com arco, aljava e máscara) ---------- */
  function desenhaGaviao(c, t) {
    const h = heroi;
    c.save(); c.translate(h.x, h.y);
    if (h.descansa > 0) { armario(c, t); c.restore(); return; }
    if (h.inv > 0 && Math.floor(t * 14) % 2 === 0) c.globalAlpha = 0.45;
    const K = 1.3;
    c.scale(h.dir * K, K);
    const braco = h.tiro > 0 ? 1 : 0.88;
    figura(c, GAVIAO, { t: t, dir: 1, fase: h.passo, anda: h.anda && h.noChao, braco: braco, noAr: !h.noChao });
    // o cabelo curto e a máscara roxa
    c.fillStyle = '#6b4a2b'; G.gfx.rr(c, -8.6, -71.5, 17.2, 6.5, 3); c.fill(); c.fillRect(-8.6, -68, 3, 5);
    c.fillStyle = '#5a189a'; G.gfx.rr(c, -6.5, -63.4, 14, 4.6, 2); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(-2.2, -61, 1.6, 1.3, 0, 0, TAU); c.ellipse(4.2, -61, 1.6, 1.3, 0, 0, TAU); c.fill();
    c.fillStyle = '#22223b'; c.beginPath(); c.arc(-1.9, -61, 0.8, 0, TAU); c.arc(4.5, -61, 0.8, 0, TAU); c.fill();
    // a aljava com setas roxas às costas
    c.fillStyle = '#3c096c'; G.gfx.rr(c, -15, -53, 7, 22, 2); c.fill();
    c.fillStyle = '#c77dff'; c.fillRect(-15, -58, 2, 6); c.fillRect(-11, -59, 2, 7);
    // o arco na mão da frente
    const ang = -0.2 - 1.35 * braco, hx = 9.2 - Math.sin(ang) * 18.5, hy = -47 + Math.cos(ang) * 18.5;
    const puxa = h.tiro > 0 ? 7 : 0;
    c.strokeStyle = '#5a189a'; c.lineWidth = 2.8;
    c.beginPath(); c.arc(hx - 4, hy, 17, -1.2, 1.2); c.stroke();
    c.strokeStyle = '#1b1b1b'; c.lineWidth = 1.4; c.beginPath(); c.arc(hx - 4, hy, 17, -0.25, 0.25); c.stroke();
    c.strokeStyle = '#f1f3f5'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(hx - 4 + Math.cos(-1.2) * 17, hy + Math.sin(-1.2) * 17); c.lineTo(hx - 2 - puxa, hy); c.lineTo(hx - 4 + Math.cos(1.2) * 17, hy + Math.sin(1.2) * 17); c.stroke();
    c.restore();
  }
  function armario(c, t) {
    c.fillStyle = '#4a2f22'; G.gfx.rr(c, -46, -150, 92, 150, 8); c.fill();
    c.fillStyle = '#5c3d2e'; c.fillRect(-40, -140, 39, 134); c.fillRect(3, -140, 37, 134);
    c.fillStyle = '#0d0910'; c.fillRect(-1, -140, 4, 134);
    c.fillStyle = '#fff'; c.beginPath(); c.arc(-3, -100, 3, 0, TAU); c.arc(5, -100, 3, 0, TAU); c.fill();
    c.fillStyle = '#c9a227'; c.beginPath(); c.arc(-8, -75, 3, 0, TAU); c.arc(10, -75, 3, 0, TAU); c.fill();
    c.font = '30px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
    c.fillText('💤', 30 + Math.sin(t * 2) * 6, -170 - (t * 20) % 20);
  }

  function desenhaAliado(c, a, t) {
    c.save(); c.translate(a.x, a.y);
    const K = 1.25;
    c.scale(a.dir * K, K);
    figura(c, a.def, { t: t, dir: 1, fase: a.passo, anda: a.anda && a.noChao, braco: a.ataque > 0 ? 1 : 0, noAr: !a.noChao, cima: fase === 'festa' && !a.noChao, jato: a.id === 'ferro' ? 1 : 0 });
    if (a.id === 'thor') { c.fillStyle = '#adb5bd'; c.fillRect(14, -52, 9, 7); c.fillStyle = '#6b4a2b'; c.fillRect(17, -45, 3, 10); }
    if (a.id === 'capitao' && !fx.some(function (f) { return f.tipo === 'escudo'; })) { c.save(); c.translate(-12, -40); escudinho(c, 8); c.restore(); }
    c.restore();
  }
  function escudinho(c, r) {
    const an = ['#c1121f', '#f1f1f1', '#c1121f', '#1d4e89'];
    for (let i = 0; i < 4; i++) { c.fillStyle = an[i]; c.beginPath(); c.arc(0, 0, r * (1 - i * 0.22), 0, TAU); c.fill(); }
    G.gfx.star(c, 0, 0, r * 0.34, '#fff', 0);
  }

  function desenhaPreso(c, p, t) {
    if (p.livre) return;
    c.save(); c.translate(p.x, 0);
    c.save(); c.scale(1.25, 1.25);
    figura(c, p.def, { t: t, dir: -1, fase: 0, anda: false, braco: 0, aceno: Math.max(0, Math.sin(t * 4)), noAr: false });
    c.restore();
    if (p.tipo === 'jaula') {
      c.strokeStyle = '#868e96'; c.lineWidth = 4;
      for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * 18, -115); c.lineTo(k * 18, 0); c.stroke(); }
      c.fillStyle = '#495057'; G.gfx.rr(c, -46, -122, 92, 10, 4); c.fill(); c.fillRect(-46, -4, 92, 6);
      c.fillStyle = '#ffd166'; G.gfx.rr(c, -8, -62, 16, 14, 3); c.fill();
    } else {
      c.fillStyle = 'rgba(241,243,245,.55)'; c.beginPath(); c.ellipse(0, -48, 30, 52, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.5;
      for (let k = 0; k < 8; k++) { c.beginPath(); c.moveTo(-30, -90 + k * 12); c.quadraticCurveTo(0, -84 + k * 12 + Math.sin(k) * 6, 30, -92 + k * 12); c.stroke(); }
    }
    G.gfx.label(c, 'SOCORRO!', 0, -140 + Math.sin(t * 5) * 4, 18, '#ffd166', 'center', 'rgba(0,0,0,.8)');
    c.restore();
  }

  /* ---------- os monstros ---------- */
  function desenhaMonstro(c, e, t) {
    const bom = e.estado !== 'mau';
    c.save(); c.translate(e.x, e.y);
    c.globalAlpha = e.alpha * (e.transp ? 0.25 : 1) * (e.pisca > 0 ? 0.6 : 1);
    if (e.tipo === 'zombie' || e.tipo === 'mumia' || e.tipo === 'armadura') {
      c.scale(e.dir * 1.3, 1.3);
      if (e.saida === 'acena' && e.st > 0.3) c.scale(-1, 1);
      figura(c, defLego(e.tipo, bom), { t: t, dir: 1, fase: e.passo, anda: !bom && e.vx !== 0, braco: bom ? 0 : (e.acordada ? 1 : 0), aceno: bom ? Math.max(0, Math.sin(e.st * 5)) : 0, tonto: e.tonto > 0 });
      if (e.tipo === 'mumia') {         // as ligaduras
        c.strokeStyle = 'rgba(150,140,110,.7)'; c.lineWidth = 0.8;
        for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(-10, -48 + k * 4); c.lineTo(10, -46 + k * 4); c.stroke(); }
        c.beginPath(); c.moveTo(-8, -66); c.lineTo(8, -63); c.moveTo(-8, -57); c.lineTo(8, -60); c.stroke();
      } else if (e.tipo === 'armadura') {   // o capacete com pluma
        c.fillStyle = '#87929e'; c.beginPath(); c.arc(0, -61, 10, Math.PI, 0); c.fill(); c.fillRect(-10, -62, 20, 12);
        c.fillStyle = e.acordada && !bom ? '#ff2d2d' : (bom ? '#80ff72' : '#222'); c.fillRect(-6, -60, 12, 2.5);
        c.fillStyle = '#9d0208'; c.beginPath(); c.moveTo(0, -71); c.quadraticCurveTo(-12, -82, -16, -70); c.quadraticCurveTo(-6, -74, 0, -69); c.fill();
      }
    } else if (e.tipo === 'esqueleto') esqueleto(c, e, t, bom);
    else if (e.tipo === 'fantasma') fantasma(c, e, t, bom, 1);
    else if (e.tipo === 'aranha') aranha(c, e, t, bom);
    else if (e.tipo === 'morcego') morcego(c, e, t, bom);
    c.restore();
    if (e.tonto > 0 && !bom && e.tipo !== 'zombie' && e.tipo !== 'mumia' && e.tipo !== 'armadura') {
      const b = caixa(e);
      for (let i = 0; i < 3; i++) { const a = t * 4 + i / 3 * TAU; G.gfx.star(c, b.x + Math.cos(a) * 18, b.y - b.ry - 6 + Math.sin(a) * 5, 5, '#ffd166', a); }
    }
    if (!bom && e.hp < e.max && !e.chefe) {   // a energia por cima
      const b = caixa(e);
      c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(b.x - 20, b.y - b.ry - 14, 40, 5);
      c.fillStyle = '#ff5d8f'; c.fillRect(b.x - 20, b.y - b.ry - 14, 40 * e.hp / e.max, 5);
    }
  }
  function esqueleto(c, e, t, bom) {
    if (e.saida === 'dorme') {          // um montinho de ossos a dormir
      c.fillStyle = '#f1f3f5';
      for (let k = 0; k < 5; k++) G.gfx.rr(c, -26 + k * 10, -10 - (k % 2) * 6, 22, 6, 3), c.fill();
      c.beginPath(); c.arc(4, -26, 13, 0, TAU); c.fill();
      c.strokeStyle = '#22223b'; c.lineWidth = 2; c.beginPath(); c.moveTo(-3, -28); c.lineTo(1, -28); c.moveTo(7, -28); c.lineTo(11, -28); c.stroke();
      G.gfx.label(c, 'z', 22, -48 - (e.st * 20) % 20, 18, '#9bf6ff', 'center', 'none');
      return;
    }
    c.scale(e.dir * 1.15, 1.15);
    const d = Math.sin(e.passo) * (e.vx !== 0 ? 0.6 : 0);
    c.strokeStyle = e.pisca > 0 ? '#ffe066' : '#f1f3f5'; c.lineCap = 'round';
    c.lineWidth = 5; c.beginPath(); c.moveTo(-5, -38); c.lineTo(-7 - d * 8, 0); c.moveTo(5, -38); c.lineTo(7 + d * 8, 0); c.stroke();
    c.lineWidth = 4; c.beginPath(); c.moveTo(0, -38); c.lineTo(0, -70); c.stroke();
    c.lineWidth = 3;
    for (let k = 0; k < 3; k++) { const y = -66 + k * 8; c.beginPath(); c.moveTo(-11 + k, y + 2); c.quadraticCurveTo(0, y - 4, 11 - k, y + 2); c.stroke(); }
    c.lineWidth = 4; c.beginPath(); c.moveTo(0, -66); c.lineTo(16, -56 - d * 6); c.moveTo(0, -66); c.lineTo(-14, -52 + d * 6); c.stroke();
    c.fillStyle = '#f1f3f5'; c.beginPath(); c.arc(0, -84, 13, 0, TAU); c.fill(); c.fillRect(-7, -76, 14, 8);
    c.fillStyle = bom ? '#22223b' : '#111';
    c.beginPath(); c.arc(-5, -86, 3.6, 0, TAU); c.arc(5, -86, 3.6, 0, TAU); c.fill();
    if (!bom) { c.fillStyle = '#ff2d2d'; c.beginPath(); c.arc(-5, -86, 1.3, 0, TAU); c.arc(5, -86, 1.3, 0, TAU); c.fill(); }
    c.strokeStyle = '#22223b'; c.lineWidth = 1.2;
    c.beginPath(); for (let k = -6; k <= 6; k += 3) { c.moveTo(k, -74); c.lineTo(k, -70); } c.stroke();
  }
  function fantasma(c, e, t, bom, k) {
    const ond = Math.sin(e.t * 5);
    c.scale(e.dir * k, k);
    c.fillStyle = bom ? 'rgba(200,255,240,.9)' : 'rgba(235,240,255,.92)';
    c.beginPath(); c.moveTo(-26, 0);
    c.quadraticCurveTo(-30, -70, 0, -72); c.quadraticCurveTo(30, -70, 26, 0);
    for (let i = 0; i < 4; i++) c.quadraticCurveTo(26 - i * 13 - 6, 10 + (i % 2 ? ond : -ond) * 5, 26 - (i + 1) * 13, 0);
    c.fill();
    c.fillStyle = '#22223b';
    if (bom) {
      c.beginPath(); c.arc(-8, -44, 3.5, 0, TAU); c.arc(8, -44, 3.5, 0, TAU); c.fill();
      c.strokeStyle = '#22223b'; c.lineWidth = 2.2; c.beginPath(); c.arc(0, -36, 7, 0.2, Math.PI - 0.2); c.stroke();
      c.fillStyle = '#ff8fab'; c.beginPath(); c.arc(-16, -36, 4, 0, TAU); c.arc(16, -36, 4, 0, TAU); c.fill();
    } else {
      c.beginPath(); c.ellipse(-9, -46, 5, 7, 0, 0, TAU); c.ellipse(9, -46, 5, 7, 0, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(0, -28, 6, 8 + ond * 2, 0, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(24, -40); c.lineTo(42, -46 + ond * 4); c.lineTo(26, -30); c.closePath(); c.fillStyle = 'rgba(235,240,255,.92)'; c.fill();
    }
  }
  function aranha(c, e, t, bom) {
    if (e.pendura || e.saida === 'sobe') { c.strokeStyle = 'rgba(240,240,250,.7)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -30); c.lineTo(0, teto() - e.y); c.stroke(); }
    c.scale(1.2, 1.2);
    const p = Math.sin(e.passo) * 6;
    c.strokeStyle = bom ? '#9d7bd8' : '#2b2b2b'; c.lineWidth = 4; c.lineCap = 'round';
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
      const yy = -30 + i * 4, ex = s * (30 + i * 4), off = (i % 2 ? p : -p);
      c.beginPath(); c.moveTo(s * 10, yy); c.quadraticCurveTo(s * 24, yy - 22 + off, ex, 0 + (e.pendura ? -10 : 0)); c.stroke();
    }
    c.fillStyle = bom ? '#b8a1e8' : '#1b1b1b';
    c.beginPath(); c.ellipse(-6 * e.dir, -30, 20, 16, 0, 0, TAU); c.fill();
    c.beginPath(); c.arc(14 * e.dir, -26, 11, 0, TAU); c.fill();
    if (!bom) { c.fillStyle = '#c1121f'; c.beginPath(); c.moveTo(-6 * e.dir, -40); c.lineTo(-1 * e.dir, -30); c.lineTo(-6 * e.dir, -22); c.lineTo(-11 * e.dir, -30); c.fill(); }
    c.fillStyle = bom ? '#22223b' : '#ff2d2d';
    for (const [ox, oy] of [[10, -30], [16, -30], [12, -25], [18, -25]]) { c.beginPath(); c.arc(ox * e.dir, oy, 2, 0, TAU); c.fill(); }
    if (bom) { c.strokeStyle = '#22223b'; c.lineWidth = 1.5; c.beginPath(); c.arc(16 * e.dir, -21, 4, 0.2, Math.PI - 0.2); c.stroke(); }
  }
  function morcego(c, e, t, bom) {
    c.scale(1.3, 1.3);
    const a = Math.sin(e.t * 16);
    c.fillStyle = bom ? '#9d7bd8' : '#3c1f5c';
    for (const lado of [-1, 1]) {
      c.beginPath(); c.moveTo(lado * 10, -4);
      c.quadraticCurveTo(lado * 30, -20 - a * 16, lado * 46, -10 - a * 18);
      c.lineTo(lado * 38, 2 - a * 6); c.lineTo(lado * 28, -2 - a * 4); c.lineTo(lado * 18, 6); c.closePath(); c.fill();
    }
    c.beginPath(); c.ellipse(0, 0, 13, 15, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-9, -9); c.lineTo(-7, -22); c.lineTo(-2, -11); c.moveTo(9, -9); c.lineTo(7, -22); c.lineTo(2, -11); c.fill();
    c.fillStyle = bom ? '#1b1b1b' : '#ff2e2e';
    c.beginPath(); c.arc(-5, -3, 2.8, 0, TAU); c.arc(5, -3, 2.8, 0, TAU); c.fill();
    if (bom) { c.strokeStyle = '#1b1b1b'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 4, 4, 0.2, Math.PI - 0.2); c.stroke(); }
    else { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-4, 5); c.lineTo(-2.5, 10); c.lineTo(-1, 5); c.moveTo(4, 5); c.lineTo(2.5, 10); c.lineTo(1, 5); c.fill(); }
  }
  // o REI FANTASMA: um fantasma gigante com coroa
  function desenhaRei(c, e, t) {
    if (!e.ativo && !noEcra(e.x, 0.8)) return;
    const bom = e.estado !== 'mau';
    c.save(); c.translate(e.x, e.y + 20 * e.k);
    c.globalAlpha = e.pisca > 0 ? 0.7 : 1;
    c.fillStyle = bom ? 'rgba(160,255,200,.18)' : 'rgba(200,120,255,.18)';
    c.beginPath(); c.arc(0, -40 * e.k, 90 * e.k, 0, TAU); c.fill();
    fantasma(c, e, t, bom, e.k * 1.6);
    c.restore();
    c.save(); c.translate(e.x, e.y + 20 * e.k - 72 * e.k * 1.6 + 6);
    c.fillStyle = '#ffd166';
    c.beginPath(); c.moveTo(-32, 0); c.lineTo(-32, -26); c.lineTo(-16, -12); c.lineTo(0, -32); c.lineTo(16, -12); c.lineTo(32, -26); c.lineTo(32, 0); c.closePath(); c.fill();
    c.fillStyle = '#e63946'; c.beginPath(); c.arc(0, -10, 5, 0, TAU); c.fill();
    c.restore();
    if (e.tonto > 0 && !bom) for (let i = 0; i < 4; i++) { const a = t * 4 + i / 4 * TAU; G.gfx.star(c, e.x + Math.cos(a) * 50, e.y - 110 + Math.sin(a) * 10, 8, '#ffd166', a); }
  }

  function desenhaSeta(c, s) {
    const a = Math.atan2(s.vy, s.vx);
    c.save(); c.translate(s.x, s.y); c.rotate(a);
    c.strokeStyle = '#d9d9d9'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-26, 0); c.lineTo(10, 0); c.stroke();
    c.fillStyle = '#c77dff'; c.beginPath(); c.moveTo(16, 0); c.lineTo(8, -5); c.lineTo(8, 5); c.closePath(); c.fill();
    c.fillStyle = '#7b2cbf'; c.beginPath(); c.moveTo(-26, 0); c.lineTo(-32, -6); c.lineTo(-20, 0); c.lineTo(-32, 6); c.closePath(); c.fill();
    c.restore();
  }
  function desenhaBala(c, b, t) {
    if (b.tipo === 'osso') {
      c.save(); c.translate(b.x, b.y); c.rotate(b.t * 12);
      c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(0, 0, 18, 0, TAU); c.fill();
      c.fillStyle = '#f8f9fa'; c.fillRect(-12, -3, 24, 6);
      c.beginPath(); c.arc(-12, -3, 4, 0, TAU); c.arc(-12, 3, 4, 0, TAU); c.arc(12, -3, 4, 0, TAU); c.arc(12, 3, 4, 0, TAU); c.fill();
      c.restore();
    } else {
      c.fillStyle = 'rgba(128,255,114,.3)'; c.beginPath(); c.arc(b.x, b.y, 16, 0, TAU); c.fill();
      c.fillStyle = '#80ff72'; c.beginPath(); c.arc(b.x, b.y, 9, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(b.x - 3, b.y - 3, 3, 0, TAU); c.fill();
    }
  }
  function desenhaFx(c, f, t) {
    const k = f.t / f.life;
    c.globalAlpha = Math.max(0, 1 - k);
    if (f.tipo === 'fio') {
      c.strokeStyle = f.cor; c.lineWidth = f.largo || 2.5;
      c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x2, f.y2); c.stroke();
    } else if (f.tipo === 'teia') {
      c.strokeStyle = '#f1f3f5'; c.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x + Math.cos(a) * 30, f.y + Math.sin(a) * 30); c.stroke(); }
      for (const r of [12, 22, 30]) { c.beginPath(); c.arc(f.x, f.y, r, 0, TAU); c.stroke(); }
    } else if (f.tipo === 'garras') {
      c.strokeStyle = '#c77dff'; c.lineWidth = 4;
      for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(f.x - 22, f.y - 22 + i * 12); c.lineTo(f.x + 22, f.y + 6 + i * 12); c.stroke(); }
    } else if (f.tipo === 'escudo') {
      const ida = k < 0.5 ? k * 2 : 2 - k * 2;
      c.globalAlpha = 1;
      c.save(); c.translate(f.x + (f.x2 - f.x) * ida, f.y + (f.y2 - f.y) * ida); c.rotate(t * 20); escudinho(c, 13); c.restore();
    } else if (f.tipo === 'raio') {
      c.strokeStyle = '#9bf6ff'; c.lineWidth = 6;
      c.beginPath(); c.moveTo(f.x + 20, teto());
      for (let y = teto(); y < f.y; y += 40) c.lineTo(f.x + (Math.random() - 0.5) * 40, y);
      c.lineTo(f.x, f.y); c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
    } else if (f.tipo === 'anel') {
      c.strokeStyle = '#80ff72'; c.lineWidth = 10; c.beginPath(); c.ellipse(f.x, f.y, 40 + k * 240, 10 + k * 30, 0, 0, TAU); c.stroke();
    } else if (f.tipo === 'luz') {
      c.fillStyle = '#fff3b0'; c.beginPath(); c.arc(f.x, f.y, 20 + k * 200, 0, TAU); c.fill();
    }
    c.globalAlpha = 1;
  }

  function desenhaFesta(c, W, H, t) {
    G.gfx.label(c, 'GANHÁMOS! A CASA É NOSSA AMIGA!', W / 2, H * 0.22, 34, '#ffd166', 'center', 'rgba(0,0,0,.85)');
    const todos = [GAVIAO].concat(equipa.map(function (a) { return a.def; }));
    todos.forEach(function (d, i) {
      const x = W / 2 + (i - (todos.length - 1) / 2) * 56, y = H * 0.22 + 60 + Math.abs(Math.sin(t * 5 + i)) * -10;
      cabeca(c, d, x, y, 1.6, t);
    });
  }

  /* ---------- o painel: corações, estrelas, andares, heróis livres e a seta de luz ---------- */
  function hud(c, t) {
    const k = Math.min(1, G.H / 520);
    c.save(); c.scale(k, k);
    for (let i = 0; i < DIF.MAXC; i++) {
      const x = 28 + i * 36, y = 34, f = clamp(heroi.coracoes - i, 0, 1);
      G.gfx.heart(c, x, y, 30, 'rgba(255,255,255,.2)');
      if (f > 0) {
        c.save();
        if (f < 1) { c.beginPath(); c.rect(x - 20, y - 20, 20, 40); c.clip(); }
        G.gfx.heart(c, x, y, 30, '#ff3b6b');
        c.restore();
      }
    }
    G.gfx.star(c, 30, 76, 16, '#ffd166', 0);
    G.gfx.label(c, '' + G.state.stars, 54, 77, 26, '#ffd166', 'left', 'rgba(0,0,0,.7)');
    // os cinco andares: uma portinha em cada (o sótão tem coroa)
    for (let i = 0; i < ANDARES.length; i++) {
      const x = 30 + i * 40, y = 124, atual = i === andar, feito = i < andar || fase === 'festa';
      c.save(); c.translate(x, y); c.scale(atual ? 1.15 : 0.9, atual ? 1.15 : 0.9);
      c.fillStyle = atual ? 'rgba(255,214,10,.9)' : 'rgba(255,255,255,.35)';
      c.beginPath(); c.arc(0, 0, 18, 0, TAU); c.fill();
      c.fillStyle = feito ? '#2a9d8f' : '#4a3426'; G.gfx.rr(c, -8, -11, 16, 22, 7); c.fill();
      c.fillStyle = '#ffd166'; c.beginPath(); c.arc(4, 1, 1.8, 0, TAU); c.fill();
      if (ANDARES[i].ultimo) { c.fillStyle = '#ffd166'; c.beginPath(); c.moveTo(-8, -12); c.lineTo(-8, -20); c.lineTo(-3, -15); c.lineTo(0, -21); c.lineTo(3, -15); c.lineTo(8, -20); c.lineTo(8, -12); c.fill(); }
      c.restore();
    }
    // as cabeças dos heróis que já estão livres
    livres.forEach(function (id, i) { cabeca(c, defHeroi(id), 232 + i * 30, 124, 1.15, t); });
    // a seta de luz (a encher)
    c.save(); c.translate(32, 176);
    c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.fill();
    const pronto = especial >= 1;
    c.strokeStyle = pronto ? '#ffd60a' : '#ffffff'; c.lineWidth = 5;
    c.beginPath(); c.arc(0, 0, 20, -Math.PI / 2, -Math.PI / 2 + TAU * especial); c.stroke();
    c.font = (pronto ? 22 + Math.sin(t * 6) * 2 : 20) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000';
    c.fillText('💥', 0, 1);
    c.restore();
    // quanto falta até à escada
    const f = clamp(heroi.x / LEN, 0, 1);
    G.gfx.rr(c, 64, 171, 220, 10, 5); c.fillStyle = 'rgba(255,255,255,.3)'; c.fill();
    G.gfx.rr(c, 64, 171, Math.max(10, 220 * f), 10, 5); c.fillStyle = '#c77dff'; c.fill();
    // a energia do Rei Fantasma, lá em cima ao meio
    if (chefe && chefe.ativo && chefe.estado === 'mau') {
      const W = G.W / k, w = Math.min(320, W - 380), x = Math.max(240, W / 2 - w / 2);
      if (w > 80) {
        c.fillStyle = 'rgba(255,255,255,.25)'; G.gfx.rr(c, x, 22, w, 16, 8); c.fill();
        c.fillStyle = '#80ff72'; G.gfx.rr(c, x, 22, Math.max(8, w * (1 - chefe.hp / chefe.max)), 16, 8); c.fill();
        c.fillStyle = '#ffd166'; c.beginPath(); c.moveTo(x - 30, 40); c.lineTo(x - 30, 22); c.lineTo(x - 22, 30); c.lineTo(x - 17, 18); c.lineTo(x - 12, 30); c.lineTo(x - 4, 22); c.lineTo(x - 4, 40); c.fill();
      }
    }
    c.restore();
  }

  S.debug = function () {
    return { andar: A().id, fase: fase, ronda: ronda, x: Math.round(heroi.x), y: Math.round(heroi.y), coracoes: heroi.coracoes,
      descansa: heroi.descansa > 0, descansos: descansos, maus: maus().length, livres: livres.slice(), equipa: equipa.length,
      presos: presos.filter(function (p) { return !p.livre; }).length, especial: +especial.toFixed(2), luz: +luz.toFixed(1),
      chefe: chefe ? { ativo: chefe.ativo, hp: Math.round(chefe.hp), max: chefe.max, bom: chefe.estado === 'bom' } : null,
      setas: setas.length, balas: balas.length, piloto: piloto, len: LEN, camX: Math.round(camX), ganhos: ganhos };
  };
  S.api = {
    vaiPara: function (i) { comecaAndar(clamp(i | 0, 0, ANDARES.length - 1)); },
    autopiloto: function (on) { piloto = on === undefined ? !piloto : !!on; return piloto; },
    heroi: function () { return heroi; }, ents: function () { return ents; }, chefe: function () { return chefe; },
    equipa: function () { return equipa; }, presos: function () { return presos; }, balas: function () { return balas; },
    liberta: function (ids) { (ids || ['pantera', 'aranha', 'capitao', 'thor', 'hulk', 'ferro']).forEach(function (id) { if (livres.indexOf(id) < 0) { livres.push(id); equipa.push(aliado(id, heroi.x - 80)); } }); },
    enche: function () { especial = 1; }, chefeQuase: function () { if (chefe) chefe.hp = 1; },
    dif: DIF, andares: ANDARES, gaviao: GAVIAO
  };

  G.scenes = G.scenes || {};
  G.scenes.casamarvel = S;
})();
