/* Cena — O MAR, ditada pelo Isaac (2026-11-11).

   "Um jogo novo que seja de ORCAS, do planeta Terra..."
   "Um jogo novo que é do mar. Nós somos MERGULHADORES e temos de disparar às baleias
   e aos tubarões. E os peixes são maus e nós disparamos e ficam nossos amigos. E
   transformam-se em tubarões bons para comer outros tubarões."

   Como ficou:
   - O Isaac e o pai são mergulhadores (fato, máscara, garrafa de ar e barbatanas).
     Nada-se para todos os lados arrastando o dedo no ecrã (ou com as setas).
     🔫 é a pistola de bolhas (segurar dispara sempre) e as bolhas vão sozinhas ao mau
     mais perto. O pai nada ao lado do Isaac e também dispara.
   - Os maus: os peixes maus (vêm aos cardumes e mordem; alguns cospem), os tubarões
     (andam à roda, tremem e depois atacam a direito) e as baleias zangadas (grandes,
     com muita energia, a soprar bolas de água).
   - Ninguém é comido nem morre (regra da coleção): quando um peixe ou um tubarão fica
     sem energia faz POF de bolhas e transforma-se num TUBARÃO BOM. Os tubarões bons
     vêm connosco e vão atrás dos maus: quando mordem faz CHOMP, saem bolhas e o mau
     passa também a ser bom (os peixes logo à primeira; os tubarões e as baleias precisam
     de mais dentadas). As baleias ficam contentes, deitam água pelo buraco e vão
     embora. Cabem 4 tubarões bons; os que sobram dizem adeus.
   - 🐋 chama a ORCA (enche devagarinho): a orca vem buscar o Isaac, ele vai agarrado
     a ela muito depressa e a orca empurra os maus todos que encontra.
   - Quatro zonas do mar (o recife de coral, o mar alto, o fundo escuro — só se vê à
     volta da lanterna — e o mar do gelo, onde vivem as orcas), cada uma com um chefe
     ao fundo. Quando o Tubarão Gigante fica amigo há festa e depois outra volta, mais
     difícil.
   - É difícil, mas nunca há derrota: cada dentada ou bola tira meio coração; sem
     corações o Isaac sobe a descansar um bocadinho 💤 e volta com 5 corações. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  /* ---------- dificuldade: está tudo aqui para afinar ---------- */
  const DIF = {
    MAXC: 5, DANO: 0.5, INV: 0.9, DESCANSA: 2.5,   // corações, quanto tira cada golpe, invencível depois (s)
    VNADA: 320, BOLHA_V: 950, BOLHA_CD: 0.2, ALCANCE: 850, PAI_CD: 0.9,
    BALA_V: 300, BALA_V_TERRA: 30, BALA_V_RONDA: 40,
    FORCA_TERRA: 0.15, FORCA_RONDA: 0.22,          // em cada zona / volta os maus são mais rápidos
    HP: { peixe: 3, tubarao: 7, baleia: 16 },
    CHEFE_HP: [36, 46, 56, 80], CHEFE_RONDA: 14,
    GRUPOS: 9, GRUPOS_TERRA: 2,
    PEIXE_INT: 2.8, PEIXE_MIN: 1.3,                // cardumes novos a chegar pela direita (s)
    TUB_INT: 12, TUB_MIN: 5.5,                     // tubarões que aparecem por trás (s)
    V_PEIXE: 200, V_TUB: 560, CUSPE: 0.35, CUSPE_TERRA: 0.15, ATRAS: 0.3,
    CD_BALEIA: [2.0, 3.2], CD_CUSPE: [2.4, 4],
    MORDE_CD: 5.0, MORDE_DANO: 4, MORDE_CHEFE: 2, MORDE_ALCANCE: 320, V_AMIGO: 320, MAX_AMIGOS: 4,
    ORCA_T: 15, ORCA_DUR: 5, ORCA_DANO: 6
  };

  const TERRAS = [
    { id: 'recife', nome: 'O recife de coral', fala: 'O recife de coral! Cuidado com os peixes maus!',
      agua: ['#48cae4', '#0096c7'], areia: '#f4d58d',
      chefe: { nome: 'o Peixe-Balão Gigante', det: 'balao', cor: '#ffb703', k: 1 } },
    { id: 'alto', nome: 'O mar alto', fala: 'O mar alto! Aqui há baleias e tubarões!',
      agua: ['#0077b6', '#023e8a'], areia: '#4a6fa5',
      chefe: { nome: 'a Baleia Zangada', det: 'baleia', cor: '#577590', k: 1.5 } },
    { id: 'escuro', nome: 'O fundo escuro', fala: 'O fundo do mar! Está tão escuro! Liga a lanterna!',
      agua: ['#03045e', '#000814'], areia: '#22223b',
      chefe: { nome: 'o Peixe-Lanterna Gigante', det: 'lanterna', cor: '#6d597a', k: 1.3 } },
    { id: 'gelo', nome: 'O mar do gelo', fala: 'O mar do gelo! É aqui que vivem as orcas!',
      agua: ['#90e0ef', '#0077b6'], areia: '#caf0f8',
      chefe: { nome: 'o Tubarão Gigante', det: 'tubarao', cor: '#495057', k: 2.4 }, ultima: true }
  ];
  const PELE = '#f2c6a0';
  const ISAAC = { id: 'mar-isaac', tronco: '#ff7b00', bracos: '#ff7b00', maos: PELE, pele: PELE, pernas: '#1d3557', ancas: '#1d3557', pes: '#1d3557', capuz: '#ff7b00', bar: '#ffd166' };
  const PAI = { id: 'mar-pai', tronco: '#2a9d8f', bracos: '#2a9d8f', maos: PELE, pele: PELE, pernas: '#264653', ancas: '#264653', pes: '#264653', capuz: '#264653', bar: '#e9c46a' };

  let isaac, pai, orca, ents, chefe, tiros, parts, textos, ondas, bolhasFundo, camX, terra, ronda, tempo, LEN;
  let fase, faseT, especial, peixeT, tubT, nid = 0, piloto = false, ultimoPop = 0, conquistadas, stats;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function h01(n) { const v = Math.sin(n * 127.1 + 3.3) * 43758.5; return v - Math.floor(v); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function vscale() { return Math.min(1, G.H / 620, G.W / 700); }
  function vw() { return G.W / vscale(); }
  function vh() { return G.H / vscale(); }
  function SUP() { return 90; }                       // a superfície da água
  function FUNDO() { return vh() - 40; }               // a areia lá em baixo
  function yMin() { return SUP() + 40; }
  function yMax() { return FUNDO() - 40; }
  function fala(t) { if (G.audio.fala) G.audio.fala(t); }
  function sfx(n) { G.audio.sfx(n); }
  function T() { return TERRAS[terra]; }
  function texto(t, x, y, cor) { textos.push({ t: t, x: x, y: y, life: 1.3, age: 0, cor: cor }); }
  function forca() { return 1 + terra * DIF.FORCA_TERRA + (ronda - 1) * DIF.FORCA_RONDA; }
  function balaV() { return DIF.BALA_V + terra * DIF.BALA_V_TERRA + (ronda - 1) * DIF.BALA_V_RONDA; }
  function noEcra(x, m) { return Math.abs(x - camX - vw() / 2) < vw() * (m || 0.55); }
  function Nome(n) { return n.charAt(0).toUpperCase() + n.slice(1); }

  S.enter = function () {
    ronda = 1; tempo = 0; conquistadas = 0;
    stats = { golpes: 0, descansos: 0, amigos: 0, mordidas: 0, orcas: 0, zonas: [] };
    bolhasFundo = [];
    for (let i = 0; i < 40; i++) bolhasFundo.push({ x: Math.random(), y: Math.random(), r: rnd(2, 6), v: rnd(20, 60) });
    comecaTerra(0, 0);
  };

  /* ---------- uma zona nova: cardumes, tubarões e baleias pelo caminho e o chefe ao fundo ---------- */
  function comecaTerra(i, nAmigos) {
    terra = i;
    LEN = 6000 + i * 600;
    camX = 0;
    tiros = []; parts = []; textos = []; ondas = []; ents = []; orca = null;
    const meio = (yMin() + yMax()) / 2;
    isaac = { x: 260, y: meio, vx: 0, vy: 0, dir: 1, cd: 0, coracoes: DIF.MAXC, inv: 2, descansa: 0, tiro: 0, rema: 0 };
    pai = { x: 160, y: meio - 90, vx: 0, vy: 0, dir: 1, cd: 1, tiro: 0, rema: 1 };
    especial = 0.4;
    const n = DIF.GRUPOS + i * DIF.GRUPOS_TERRA + (ronda - 1);
    const de = 1100, ate = LEN - 1500, passo = (ate - de) / n;
    for (let g = 0; g < n; g++) {
      const gx = de + g * passo + rnd(0, passo * 0.4), gy = rnd(yMin() + 60, yMax() - 60);
      const quantos = 3 + Math.floor(rnd(0, 2 + i * 0.5));
      for (let k = 0; k < quantos; k++) ents.push(bicho('peixe', gx + k * 60, gy + rnd(-70, 70)));
      if (Math.random() < 0.35 + i * 0.12) ents.push(bicho('tubarao', gx + 300, rnd(yMin(), yMax())));
      if (i >= 1 && Math.random() < 0.18 + i * 0.08) ents.push(bicho('baleia', gx + 500, rnd(yMin() + 80, yMax() - 80)));
    }
    const cd = T().chefe;
    chefe = bicho('chefe', LEN - 260, meio);
    // (ao alto o chefe encolhe para caber no ecrã)
    chefe.chefe = true; chefe.k = cd.k * clamp(vw() / 1100, 0.62, 1); chefe.cor = cd.cor; chefe.det = cd.det; chefe.nome = cd.nome; chefe.ativo = false;
    chefe.hp = chefe.max = DIF.CHEFE_HP[i] + (ronda - 1) * DIF.CHEFE_RONDA;
    chefe.x0 = chefe.x; chefe.ataque = 0;
    ents.push(chefe);
    // os tubarões bons vêm connosco de zona em zona
    for (let k = 0; k < Math.min(nAmigos, DIF.MAX_AMIGOS); k++) {
      const a = bicho('tubarao', isaac.x - 160 - k * 70, meio + (k % 2 ? -1 : 1) * (70 + k * 20));
      a.equipa = 'bom'; a.cdM = rnd(0.5, 2); ents.push(a);
    }
    peixeT = 3; tubT = 5;
    fase = 'joga'; faseT = 0;
    stats.zonas[i] = { t: 0, golpes: 0 };
    G.banner('🤿 ' + T().nome, 2400);
    fala(T().fala);
  }

  function bicho(tipo, x, y) {
    const hp = (DIF.HP[tipo] || 10) + (ronda - 1) + (terra >= 2 ? 1 : 0);
    const e = { id: ++nid, tipo: tipo, x: x, y: y, vx: 0, vy: 0, dir: -1, equipa: 'mau', hp: hp, max: hp, k: 1,
      cd: rnd(1, 2.5), cd2: rnd(1.5, 3.5), cdM: 0, pisca: 0, transf: 0, boca: 0, foge: 0, t: 0, fase: rnd(0, 6),
      estado: 'ronda', estT: 0, ang: rnd(0, TAU), orcaHit: 0 };
    if (tipo === 'peixe') { e.cuspe = Math.random() < DIF.CUSPE + terra * DIF.CUSPE_TERRA; e.cor = ['#e63946', '#9d4edd', '#f15bb5'][e.id % 3]; e.vel = rnd(0.8, 1.2); }
    return e;
  }
  function maus() { return ents.filter(function (e) { return e.equipa === 'mau' && (!e.chefe || e.ativo); }); }
  function amigos() { return ents.filter(function (e) { return e.equipa === 'bom' && e.tipo === 'tubarao' && !e.vaiCasa; }); }

  // o corpo de cada um (para as bolhas acertarem)
  function caixa(e) {
    const k = e.k || 1;
    if (e.tipo === 'peixe') return { x: e.x, y: e.y, rx: 30, ry: 20 };
    if (e.tipo === 'tubarao') return { x: e.x, y: e.y, rx: 66 * k, ry: 24 * k };
    if (e.tipo === 'baleia') return { x: e.x, y: e.y, rx: 115, ry: 52 };
    // os chefes
    if (e.det === 'balao') { const r = 95 * (1 + (e.incha || 0) * 0.25); return { x: e.x, y: e.y, rx: r, ry: r }; }
    if (e.det === 'baleia') return { x: e.x, y: e.y, rx: 115 * k, ry: 52 * k };
    if (e.det === 'lanterna') return { x: e.x, y: e.y, rx: 90 * k, ry: 70 * k };
    return { x: e.x, y: e.y, rx: 66 * k, ry: 24 * k };
  }
  function dentro(b, x, y, m) { const dx = (x - b.x) / (b.rx + (m || 0)), dy = (y - b.y) / (b.ry + (m || 0)); return dx * dx + dy * dy < 1; }

  /* ---------- a pistola de bolhas ---------- */
  function alvoDe(p) {
    let melhor = null, md = 1e9, atras = null, mda = 1e9;
    for (const e of maus()) {
      const b = caixa(e), dx = b.x - p.x, d = Math.hypot(dx, b.y - p.y);
      if (d > DIF.ALCANCE || !noEcra(b.x, 0.62)) continue;
      if (dx * p.dir > -20) { if (d < md) { md = d; melhor = b; } }
      else if (d < mda) { mda = d; atras = b; }
    }
    return melhor || (atras && mda < 450 ? atras : null);
  }
  function boca(p) { return { x: p.x + p.dir * 56, y: p.y + 10 }; }
  function dispara(p, quem) {
    const alvo = alvoDe(p);
    if (alvo) p.dir = alvo.x >= p.x ? 1 : -1;
    const b = boca(p);
    let ang = alvo ? Math.atan2(alvo.y - b.y, alvo.x - b.x) : (p.dir > 0 ? 0 : Math.PI);
    ang += rnd(-0.03, 0.03);
    tiros.push({ x: b.x, y: b.y, vx: Math.cos(ang) * DIF.BOLHA_V, vy: Math.sin(ang) * DIF.BOLHA_V, nossa: true, tipo: 'bolha', t: 0, pai: quem === 'pai', r: rnd(8, 11) });
    p.tiro = 0.1;
    if (quem !== 'pai') sfx('pop');
  }

  /* ---------- a orca amiga ---------- */
  function chamaOrca() {
    especial = 0; stats.orcas++;
    orca = { x: camX - 200, y: isaac.y, t: 0, fase: 'vem', dir: 1 };
    ondas.push({ x: isaac.x, y: isaac.y, r: 20, t: 0 });
    tiros = tiros.filter(function (s) { return s.nossa || !noEcra(s.x, 0.6); });
    sfx('whee');
    G.banner('🐋 A orca vem ajudar!', 1300);
    fala(['Orca! Anda cá ajudar-nos!', 'Vem aí a orca do planeta Terra!', 'Agarra-te à orca, Isaac!'][Math.floor(rnd(0, 3))]);
  }
  function atualizaOrca(dt, inp) {
    if (!orca) return;
    orca.t += dt;
    if (orca.fase === 'vem') {
      const dx = isaac.x - 20 - orca.x, dy = isaac.y + 34 - orca.y, d = Math.hypot(dx, dy) || 1, v = Math.min(d / dt, 1100);
      orca.x += dx / d * v * dt; orca.y += dy / d * v * dt;
      if (d < 40 || orca.t > 2) { orca.fase = 'leva'; orca.t = 0; sfx('splash'); }
    } else if (orca.fase === 'leva') {
      orca.x = Math.min(orca.x + 520 * dt, limite());
      orca.y = clamp(orca.y + inp.ay * 360 * dt, yMin() + 30, yMax());
      isaac.x = orca.x + 20; isaac.y = orca.y - 34; isaac.dir = 1; isaac.vx = 520; isaac.vy = 0;
      isaac.inv = Math.max(isaac.inv, 0.3);
      const ob = { x: orca.x, y: orca.y, rx: 120, ry: 45 };
      for (const e of maus()) {
        e.orcaHit -= dt;
        const b = caixa(e);
        if (e.orcaHit <= 0 && Math.abs(b.x - ob.x) < b.rx + ob.rx && Math.abs(b.y - ob.y) < b.ry + ob.ry) {
          e.orcaHit = 0.6;
          if (!e.chefe) { e.vx = 500; e.vy = (b.y < ob.y ? -1 : 1) * 300; e.foge = 0.6; }
          bolhas(b.x, b.y, 8);
          acerta(e, DIF.ORCA_DANO);
        }
      }
      if (orca.t > DIF.ORCA_DUR || (chefe.equipa === 'mau' && chefe.ativo && orca.x >= limite() - 5 && orca.t > 1.5)) {
        orca.fase = 'vai'; orca.t = 0; isaac.inv = Math.max(isaac.inv, 1);
        fala('Obrigado, orca! Adeus!');
      }
    } else {
      orca.x += 300 * dt; orca.y += 380 * dt;
      if (orca.y > FUNDO() + 200 || orca.t > 3) orca = null;
    }
  }

  /* ---------- acertar: os maus ficam amigos ---------- */
  function acerta(e, dano) {
    if (e.equipa !== 'mau') return;
    e.hp -= dano; e.pisca = 0.2;
    const b = caixa(e);
    bolhas(b.x, b.y, 3);
    if (e.hp > 0) { if (tempo - ultimoPop > 0.12) { sfx('pop'); ultimoPop = tempo; } return; }
    converte(e);
  }
  function converte(e) {
    if (e.equipa !== 'mau') return;
    e.equipa = 'bom'; e.hp = 0; e.cdM = rnd(1, 2); e.foge = 0; e.estado = 'ronda';
    const b = caixa(e);
    bolhas(b.x, b.y, 18);
    stats.amigos++;
    if (e.chefe) {
      G.addStars(10); sfx('tada');
      G.banner('💙 ' + Nome(e.nome) + ' é nosso amigo!', 2600);
      fala(Nome(e.nome) + ' agora é nosso amigo!');
      for (const m of maus()) converte(m);
      tiros = tiros.filter(function (s) { return s.nossa; });
      fase = 'ganhou'; faseT = 0;
      return;
    }
    texto('💙', b.x, b.y - b.ry - 30);
    G.addStars(1);
    if (e.tipo === 'baleia') {
      // a baleia fica contente: deita água pelo buraco e vai-se embora
      e.vaiCasa = true; e.dir = 1; sfx('splash');
      if (fase === 'joga' && Math.random() < 0.6) fala('A baleia ficou contente!');
      return;
    }
    // o peixe (ou o tubarão mau) faz POF e transforma-se num tubarão bom
    e.tipo = 'tubarao'; e.k = 1; e.transf = 0.8; e.dir = 1;
    sfx('poof');
    if (fase === 'joga' && Math.random() < 0.35) fala(['Agora és um tubarão bom!', 'Mais um tubarão amigo!', 'Boa, Isaac!', 'Vai, tubarão bom!'][Math.floor(rnd(0, 4))]);
    if (amigos().length > DIF.MAX_AMIGOS) { e.vaiCasa = true; texto('👋', b.x, b.y - 70); }
  }
  function magoa() {
    if (isaac.inv > 0 || isaac.descansa > 0 || fase !== 'joga' || (orca && orca.fase === 'leva')) return;
    isaac.coracoes = Math.max(0, isaac.coracoes - DIF.DANO);
    isaac.inv = DIF.INV; G.shake = 0.3;
    stats.golpes++; if (stats.zonas[terra]) stats.zonas[terra].golpes++;
    sfx('ouch');
    bolhas(isaac.x, isaac.y, 6);
    if (isaac.coracoes <= 0) {
      isaac.descansa = DIF.DESCANSA; stats.descansos++;
      G.banner('O Isaac vai descansar um bocadinho 💤', 2300);
      fala('Estou cansado. Vou descansar um bocadinho!');
      tiros = tiros.filter(function (s) { return s.nossa; });
      for (const m of maus()) if (!m.chefe) { m.foge = 2.5; }
    }
  }
  function bolhas(x, y, n) {
    for (let i = 0; i < n; i++) parts.push({ x: x + rnd(-14, 14), y: y + rnd(-14, 14), vx: rnd(-160, 160), vy: rnd(-260, -40), t: 0, life: rnd(0.5, 1), r: rnd(3, 8), bolha: true });
  }
  function tiroMau(x, y, tx, ty, espalha, tipo) {
    const v = balaV(), a = Math.atan2(ty - y, tx - x) + rnd(-espalha, espalha);
    tiros.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, nossa: false, tipo: tipo || 'bola', t: 0 });
  }
  function anel(x, y, n, v, tipo) {
    const a0 = rnd(0, TAU);
    for (let k = 0; k < n; k++) { const a = a0 + k / n * TAU; tiros.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, nossa: false, tipo: tipo || 'espinho', t: 0 }); }
  }

  /* ---------- o piloto automático (para testar) ---------- */
  function autopiloto() {
    let ay = 0, ax = 1, perigo = 0;
    // fugir das bolas que vêm aí
    for (const s of tiros) {
      if (s.nossa) continue;
      const dx = s.x - isaac.x, dy = s.y - isaac.y, d = Math.hypot(dx, dy);
      if (d < 220 && (dx * s.vx + dy * s.vy) < 0) { const p = 1 - d / 220; if (p > perigo) { perigo = p; ay = dy > 0 ? -1 : 1; } }
    }
    // e dos bichos que estão mesmo em cima
    for (const e of maus()) {
      const b = caixa(e), dx = b.x - isaac.x, dy = b.y - isaac.y;
      if (Math.abs(dx) < b.rx + 120 && Math.abs(dy) < b.ry + 70) { if (perigo < 0.6) ay = dy > 0 ? -1 : 1; if (dx > 0) ax = -0.6; perigo = Math.max(perigo, 0.6); }
    }
    if (perigo === 0) {
      const a = alvoDe(isaac);
      if (a) ay = clamp((a.y - isaac.y) / 120, -1, 1);
      else ay = clamp(((yMin() + yMax()) / 2 - isaac.y) / 200, -1, 1);
    }
    if (chefe.equipa === 'mau' && chefe.ativo && isaac.x > limite() - 260) ax = perigo ? -0.3 : 0;
    if (ay > 0 && isaac.y > yMax() - 10) ay = -1;
    if (ay < 0 && isaac.y < yMin() + 10) ay = 1;
    return { ax: ax, ay: ay, fogo: true,
      orca: especial >= 1 && !orca && (maus().filter(function (e) { return noEcra(e.x); }).length >= 4 || chefe.ativo) };
  }
  function leInput() {
    if (piloto) return autopiloto();
    const I = G.input, a = I.axis();
    return { ax: a.x, ay: a.y, fogo: I.isHeld('fire'), orca: I.justPressed('horn') };
  }
  function limite() { return chefe.equipa === 'mau' ? chefe.x0 - 230 * chefe.k : LEN + 900; }

  /* ---------- update ---------- */
  S.update = function (dt) {
    dt = Math.min(dt, 1 / 30);
    tempo += dt;
    const inp = leInput();
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.t += dt;
      if (p.bolha) { p.vx *= 1 - Math.min(1, dt * 3); p.vy += (-120 - p.vy) * Math.min(1, dt * 2); }
      else p.vy += 500 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.t > p.life || p.y < SUP()) parts.splice(i, 1);
    }
    for (let i = textos.length - 1; i >= 0; i--) { textos[i].age += dt; textos[i].y -= 40 * dt; if (textos[i].age > textos[i].life) textos.splice(i, 1); }
    for (let i = ondas.length - 1; i >= 0; i--) { const o = ondas[i]; o.t += dt; o.r += 1300 * dt; if (o.t > 0.8) ondas.splice(i, 1); }
    for (const b of bolhasFundo) { b.y -= b.v * dt / vh(); if (b.y < 0) { b.y = 1; b.x = Math.random(); } }

    if (fase === 'passa') {            // a nadar para a zona seguinte, com os tubarões bons atrás
      faseT += dt;
      isaac.vx = 380; isaac.x += isaac.vx * dt; isaac.dir = 1; isaac.rema += dt * 10;
      isaac.y += ((yMin() + yMax()) / 2 - isaac.y) * Math.min(1, dt * 2);
      segue(pai, isaac.x - 100, isaac.y - 90, dt, 420);
      seguem(dt);
      camX += (isaac.x - vw() * 0.35 - camX) * Math.min(1, dt * 3);
      if (faseT > 2.2) comecaTerra((terra + 1) % TERRAS.length, amigos().length);
      return;
    }
    if (fase === 'festa') {
      faseT += dt;
      if (Math.random() < dt * 5) { const x = camX + rnd(100, vw() - 100), y = rnd(yMin(), yMax()); bolhas(x, y, 14); sfx('pop'); }
      seguem(dt);
      if (faseT > 10) {
        ronda++; conquistadas = 0;
        G.banner('🌊 Outra volta! Agora é mais difícil', 2600);
        comecaTerra(0, amigos().length);
      }
      return;
    }
    if (fase === 'ganhou') {
      faseT += dt;
      if (faseT > 2.8) {
        if (stats.zonas[terra]) stats.zonas[terra].t = +stats.zonas[terra].t.toFixed(1);
        if (T().ultima) {
          fase = 'festa'; faseT = 0; conquistadas = TERRAS.length;
          G.banner('🏆 GANHÁMOS! O MAR É TODO AMIGO! 🐋', 6000);
          fala('Ganhámos! O mar é todo nosso amigo! Boa, Isaac! Boa, pai! Obrigado, orcas!');
          G.addStars(20); sfx('tada');
          return;
        }
        conquistadas = Math.max(conquistadas, terra + 1);
        G.addStars(5);
        fase = 'passa'; faseT = 0; sfx('whoosh');
        G.banner('▶ Para a zona seguinte!', 1800);
        return;
      }
    }
    if (fase === 'joga' && stats.zonas[terra]) stats.zonas[terra].t += dt;

    atualizaIsaac(dt, inp);
    atualizaOrca(dt, inp);
    atualizaPai(dt);
    if (fase === 'joga') chegam(dt);
    atualizaBichos(dt);
    seguem(dt);
    atualizaTiros(dt);
    // ver o chefe ao fundo
    if (!chefe.ativo && isaac.x > chefe.x - 1100) {
      chefe.ativo = true; sfx('sirene');
      G.banner('⚠️ Cuidado! ' + Nome(chefe.nome) + '!', 2400);
      fala('Cuidado! Vem aí ' + chefe.nome + '!');
    }
    ents = ents.filter(function (e) {
      if (e.vaiCasa) return e.x > camX - 300 && e.x < camX + vw() + 300 && e.y > -200;
      if (e.equipa === 'mau' && !e.chefe) return e.x > camX - 900;   // ficam lá para trás
      return true;
    });
    if (document.body) document.body.classList.toggle('mar-orca-espera', especial < 1 || !!orca);
  };

  function segue(p, tx, ty, dt, vmax) {
    const dx = tx - p.x, dy = ty - p.y;
    p.vx += (clamp(dx * 3, -vmax, vmax) - p.vx) * Math.min(1, dt * 4);
    p.vy += (clamp(dy * 3, -vmax, vmax) - p.vy) * Math.min(1, dt * 4);
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.y = clamp(p.y, yMin() - 20, yMax() + 10);
    if (Math.abs(p.vx) > 30) p.dir = p.vx > 0 ? 1 : -1;
    p.rema += dt * (2 + Math.hypot(p.vx, p.vy) / 50);
  }

  function atualizaIsaac(dt, inp) {
    isaac.inv = Math.max(0, isaac.inv - dt); isaac.tiro = Math.max(0, isaac.tiro - dt); isaac.cd -= dt;
    especial = Math.min(1, especial + dt / DIF.ORCA_T * (T().id === 'gelo' ? 1.5 : 1));
    if (orca && orca.fase === 'leva') {
      if (inp.fogo && isaac.cd <= 0) { dispara(isaac, 'isaac'); isaac.cd = DIF.BOLHA_CD; isaac.dir = 1; }
      camX += (camAlvo() - camX) * Math.min(1, dt * 4);
      return;
    }
    if (isaac.descansa > 0) {
      // sobe devagarinho para perto da superfície e descansa
      isaac.descansa -= dt;
      isaac.vx *= 1 - Math.min(1, dt * 3);
      isaac.vy += ((yMin() + 10 - isaac.y) * 2 - isaac.vy) * Math.min(1, dt * 2);
      if (isaac.descansa <= 0) {
        isaac.coracoes = DIF.MAXC; isaac.inv = 2; sfx('suit');
        G.banner('Pronto outra vez! 🤿', 1500); fala('Já descansei! Vamos!');
      }
    } else {
      const v = DIF.VNADA;
      isaac.vx += (inp.ax * v - isaac.vx) * Math.min(1, dt * 5);
      isaac.vy += (inp.ay * v - isaac.vy) * Math.min(1, dt * 5);
      if (Math.abs(inp.ax) > 0.15) isaac.dir = inp.ax > 0 ? 1 : -1;
      if (inp.fogo && isaac.cd <= 0) { dispara(isaac, 'isaac'); isaac.cd = DIF.BOLHA_CD; }
      if (inp.orca && especial >= 1 && !orca) chamaOrca();
    }
    isaac.x += isaac.vx * dt; isaac.y += isaac.vy * dt;
    isaac.x = clamp(isaac.x, Math.max(80, camX + 50), limite());
    isaac.y = clamp(isaac.y, yMin(), yMax());
    isaac.rema += dt * (2 + Math.hypot(isaac.vx, isaac.vy) / 45);
    camX += (camAlvo() - camX) * Math.min(1, dt * 4);
  }
  // a câmara segue o Isaac, mas quando o chefe aparece mostra-o inteiro
  function camAlvo() {
    let a = Math.max(0, isaac.x - vw() * 0.35);
    if (chefe.ativo && chefe.equipa === 'mau') a = Math.max(a, Math.min(isaac.x - 210, chefe.x0 + 200 * chefe.k - vw()));
    return a;
  }

  function atualizaPai(dt) {
    pai.tiro = Math.max(0, pai.tiro - dt); pai.cd -= dt;
    const lado = isaac.y > (yMin() + yMax()) / 2 ? -1 : 1;
    segue(pai, isaac.x - 90, isaac.y + lado * 100, dt, orca && orca.fase === 'leva' ? 600 : 360);
    if (fase === 'joga' && pai.cd <= 0) {
      const a = alvoDe(pai);
      if (a) { dispara(pai, 'pai'); pai.cd = DIF.PAI_CD; } else pai.cd = 0.3;
    }
    if (pai.tiro <= 0 && !alvoDe(pai)) pai.dir = isaac.dir;
  }

  // cardumes novos pela direita e tubarões por trás
  function chegam(dt) {
    if (isaac.descansa > 0) return;
    peixeT -= dt; tubT -= dt;
    const ms = maus();
    if (peixeT <= 0) {
      peixeT = Math.max(DIF.PEIXE_MIN, DIF.PEIXE_INT - terra * 0.4 - (ronda - 1) * 0.4) * rnd(0.8, 1.2);
      if (ms.filter(function (e) { return e.tipo === 'peixe'; }).length < 6 + terra * 2) {
        // quase sempre pela frente, mas às vezes chegam por trás
        const atras = Math.random() < DIF.ATRAS, y = rnd(yMin() + 40, yMax() - 40), n = 2 + Math.floor(rnd(0, 2 + terra * 0.5));
        for (let k = 0; k < n; k++) ents.push(bicho('peixe', atras ? camX - 60 - k * 50 : camX + vw() + 60 + k * 50, y + rnd(-60, 60)));
      }
    }
    if (tubT <= 0) {
      tubT = Math.max(DIF.TUB_MIN, DIF.TUB_INT - terra * 1.4 - (ronda - 1)) * rnd(0.8, 1.2);
      if (ms.filter(function (e) { return e.tipo === 'tubarao'; }).length < 1 + Math.ceil(terra / 2)) {
        const e = bicho('tubarao', camX - 150, rnd(yMin(), yMax())); e.ang = Math.PI; ents.push(e);
        sfx('whoosh');
      }
    }
  }

  function atualizaBichos(dt) {
    const pode = fase === 'joga' && isaac.descansa <= 0, fz = forca();
    for (const e of ents) {
      e.t += dt; e.pisca = Math.max(0, e.pisca - dt); e.transf = Math.max(0, e.transf - dt); e.boca = Math.max(0, e.boca - dt);
      if (e.equipa === 'bom') continue;
      const b = caixa(e), dx = isaac.x - e.x, dy = isaac.y - e.y, d = Math.hypot(dx, dy) || 1;
      const perto = noEcra(e.x, 0.75) || e.chefe;
      if (!perto) continue;
      if (e.foge > 0) {
        e.foge -= dt;
        e.x += e.vx * dt; e.y += e.vy * dt;
        e.vx *= 1 - Math.min(1, dt * 1.5); e.vy *= 1 - Math.min(1, dt * 1.5);
        if (!e.chefe && Math.abs(e.vx) < 60) e.vx = -dx / d * 140;
      } else if (e.tipo === 'peixe') {
        const v = DIF.V_PEIXE * e.vel * Math.sqrt(fz), w = Math.sin(e.t * 3 + e.fase) * 70;
        const tvx = dx / d * v - dy / d * w, tvy = dy / d * v + dx / d * w;
        e.vx += (tvx - e.vx) * Math.min(1, dt * 2); e.vy += (tvy - e.vy) * Math.min(1, dt * 2);
        e.x += e.vx * dt; e.y += e.vy * dt;
        if (e.cuspe && pode && noEcra(e.x)) {
          e.cd2 -= dt;
          if (e.cd2 <= 0) { tiroMau(e.x + (dx > 0 ? 24 : -24), e.y, isaac.x, isaac.y, 0.08, 'tinta'); e.cd2 = rnd(DIF.CD_CUSPE[0], DIF.CD_CUSPE[1]) / fz; sfx('bicho'); }
        }
      } else if (e.tipo === 'tubarao') {
        tubaraoMau(e, dt, fz, pode, dx, dy, d);
      } else if (e.tipo === 'baleia') {
        const lado = e.x > isaac.x ? 1 : -1;
        const tx = isaac.x + lado * 420, ty = clamp(isaac.y + Math.sin(e.t * 0.6 + e.fase) * 120, yMin() + 60, yMax() - 50);
        e.vx += (clamp((tx - e.x) * 0.8, -110, 110) - e.vx) * Math.min(1, dt); e.vy += (clamp((ty - e.y) * 0.8, -90, 90) - e.vy) * Math.min(1, dt);
        e.x += e.vx * dt; e.y += e.vy * dt;
        if (pode && noEcra(e.x)) {
          e.cd -= dt;
          if (e.cd <= 0) {
            for (let k = -1; k <= 1; k++) tiroMau(e.x + (dx > 0 ? 100 : -100), e.y - 10, isaac.x, isaac.y + k * 110, 0.03, 'bola');
            e.cd = rnd(DIF.CD_BALEIA[0], DIF.CD_BALEIA[1]) / fz; sfx('splash');
          }
        }
      } else if (e.chefe && e.ativo) {
        chefeAtua(e, dt, fz, pode, dx, dy);
      }
      if (!e.chefe || e.estado !== 'investe') e.dir = dx > 0 ? 1 : -1;
      if (e.tipo === 'tubarao' && e.estado === 'ataca') e.dir = e.vx > 0 ? 1 : -1;
      if (!e.chefe) e.y = clamp(e.y, yMin() - 10, yMax() + 20);
      // tocar no Isaac: dentada!
      if (pode && dentro(caixa(e), isaac.x, isaac.y, 22)) {
        magoa();
        if (!e.chefe) { e.foge = 1.1; e.vx = -dx / d * 320; e.vy = -dy / d * 320; e.estado = 'ronda'; e.boca = 0.3; }
        else { isaac.vx = -500; }
      }
    }
  }
  function tubaraoMau(e, dt, fz, pode, dx, dy, d) {
    e.estT += dt;
    if (e.estado === 'ronda') {
      e.ang += dt * 0.9 * (e.id % 2 ? 1 : -1);
      const R = 300, tx = isaac.x + Math.cos(e.ang) * R * 1.3, ty = clamp(isaac.y + Math.sin(e.ang) * R * 0.6, yMin(), yMax());
      e.vx += (clamp((tx - e.x) * 2, -280, 280) - e.vx) * Math.min(1, dt * 2);
      e.vy += (clamp((ty - e.y) * 2, -220, 220) - e.vy) * Math.min(1, dt * 2);
      e.x += e.vx * dt; e.y += e.vy * dt;
      e.cd2 -= dt;
      if (pode && e.cd2 <= 0 && noEcra(e.x, 0.5) && d < 700) { e.estado = 'prepara'; e.estT = 0; }
    } else if (e.estado === 'prepara') {           // treme um bocadinho antes de atacar (para dar tempo de fugir)
      e.vx *= 1 - Math.min(1, dt * 6); e.vy *= 1 - Math.min(1, dt * 6);
      if (e.estT > 0.55) {
        e.estado = 'ataca'; e.estT = 0;
        const v = DIF.V_TUB * Math.sqrt(fz);
        e.vx = dx / d * v; e.vy = dy / d * v; e.boca = 0.9; sfx('whoosh');
      }
    } else {                                       // ataca a direito
      e.x += e.vx * dt; e.y += e.vy * dt;
      if (e.estT > 1.0) { e.estado = 'ronda'; e.cd2 = rnd(2.4, 4) / fz; e.ang = Math.atan2(e.y - isaac.y, e.x - isaac.x); }
    }
  }
  function chefeAtua(e, dt, fz, pode, dx, dy) {
    const k = e.k;
    e.incha = Math.max(0, (e.incha || 0) - dt);
    if (e.estado === 'investe') {
      e.estT += dt;
      const ida = e.estT < 0.9;
      e.x += (ida ? -1 : 1) * 700 * dt;
      if (!ida && e.x >= e.x0) { e.x = e.x0; e.estado = 'ronda'; }
      if (e.estT > 2.2) { e.x = e.x0; e.estado = 'ronda'; }
      e.dir = -1;
    } else {
      e.x += (e.x0 - e.x) * Math.min(1, dt * 2);
      const ty = clamp(isaac.y + Math.sin(e.t * 0.8) * 120, yMin() + 40 * k, yMax() - 30 * k);
      e.y += clamp(ty - e.y, -110 * fz * dt, 110 * fz * dt);
    }
    if (!pode) return;
    const b = caixa(e), sx = b.x - b.rx * 0.8, sy = b.y;
    e.cd -= dt;
    if (e.cd <= 0 && e.estado !== 'investe') {
      tiroMau(sx, sy, isaac.x, isaac.y, 0.04, e.det === 'lanterna' ? 'luz' : 'bola');
      e.cd = rnd(1.1, 1.7) / fz;
    }
    e.cd2 -= dt;
    if (e.cd2 > 0 || e.estado === 'investe') return;
    const lista = { balao: ['anel', 'peixes', 'anel', 'leque'], baleia: ['leque', 'investe', 'peixes', 'leque'],
      lanterna: ['rajada', 'peixes', 'anel', 'rajada'], tubarao: ['investe', 'tubaroes', 'leque', 'anel', 'investe', 'peixes'] }[e.det];
    const at = lista[e.ataque % lista.length]; e.ataque++;
    const ult = T().ultima;
    if (at === 'anel') { anel(b.x, b.y, (ult ? 14 : 10) + (ronda - 1) * 2, balaV() * 0.8, e.det === 'balao' ? 'espinho' : 'bola'); e.incha = 0.8; sfx('canhao'); }
    else if (at === 'leque') { const n = ult ? 7 : 5; for (let i = 0; i < n; i++) tiroMau(sx, sy, isaac.x, isaac.y + (i - (n - 1) / 2) * 120, 0.02); sfx('splash'); }
    else if (at === 'rajada') { for (let i = 0; i < 4; i++) { const s = { x: sx, y: sy }; tiroMau(s.x - i * 40, s.y, isaac.x, isaac.y, 0.05, 'luz'); } sfx('zap'); }
    else if (at === 'peixes') {
      if (maus().filter(function (m) { return m.tipo === 'peixe'; }).length < 8) {
        for (let i = 0; i < 3 + terra; i++) ents.push(bicho('peixe', b.x - b.rx, b.y + rnd(-90, 90)));
        sfx('bicho');
      }
    } else if (at === 'tubaroes') {
      if (maus().filter(function (m) { return m.tipo === 'tubarao'; }).length < 3) {
        for (let i = 0; i < 2; i++) { const t2 = bicho('tubarao', b.x - b.rx, b.y + (i ? 120 : -120)); t2.cd2 = rnd(0.5, 1.5); ents.push(t2); }
        sfx('whoosh');
      }
    } else if (at === 'investe') { e.estado = 'investe'; e.estT = 0; e.boca = 1; sfx('roar'); G.shake = 0.25; }
    e.cd2 = rnd(2.4, 3.4) / fz;
  }

  // os tubarões bons vêm atrás de nós e vão morder os maus
  function seguem(dt) {
    const ms = maus();
    let k = 0;
    for (const e of ents) {
      if (e.equipa !== 'bom' || e.chefe) continue;
      if (e.vaiCasa) {
        if (e.tipo === 'baleia') { e.x += 120 * dt; e.y -= 90 * dt; if (Math.random() < dt * 8) parts.push({ x: e.x + 40, y: e.y - 50, vx: rnd(-60, 60), vy: rnd(-300, -200), t: 0, life: 0.7, r: rnd(3, 6), cor: '#caf0f8' }); }
        else { e.x -= 300 * dt; e.dir = -1; }
        continue;
      }
      e.cdM -= dt;
      let alvo = null;
      if (fase === 'joga' && e.cdM <= 0) {
        let md = DIF.MORDE_ALCANCE;
        for (const m of ms) { const mb = caixa(m), dd = Math.hypot(mb.x - e.x, mb.y - e.y) - mb.rx * 0.5; if (dd < md && noEcra(mb.x, 0.6)) { md = dd; alvo = m; } }
      }
      if (alvo) {
        const mb = caixa(alvo), ddx = mb.x - e.x, ddy = mb.y - e.y, dd = Math.hypot(ddx, ddy) || 1;
        e.vx += (ddx / dd * DIF.V_AMIGO - e.vx) * Math.min(1, dt * 4); e.vy += (ddy / dd * DIF.V_AMIGO - e.vy) * Math.min(1, dt * 4);
        e.x += e.vx * dt; e.y += e.vy * dt; e.dir = ddx > 0 ? 1 : -1;
        if (dentro(mb, e.x + e.dir * 50, e.y, 20)) morde(e, alvo);
      } else {
        const fila = Math.floor(k / 2), lado = k % 2 ? -1 : 1;
        const tx = isaac.x - 150 - fila * 90, ty = clamp(isaac.y + lado * (60 + fila * 30) + Math.sin(tempo * 1.5 + k) * 15, yMin(), yMax());
        e.vx += (clamp((tx - e.x) * 3, -460, 460) - e.vx) * Math.min(1, dt * 3);
        e.vy += (clamp((ty - e.y) * 3, -360, 360) - e.vy) * Math.min(1, dt * 3);
        e.x += e.vx * dt; e.y += e.vy * dt;
        if (Math.abs(e.vx) > 40) e.dir = e.vx > 0 ? 1 : -1;
        if (fase === 'festa') e.y += Math.sin(tempo * 4 + k) * 60 * dt;
      }
      k++;
    }
  }
  function morde(e, alvo) {
    e.boca = 0.4; e.cdM = DIF.MORDE_CD; stats.mordidas++;
    const b = caixa(alvo);
    texto('CHOMP!', (e.x + b.x) / 2, b.y - b.ry - 20, '#ffffff');
    bolhas(b.x, b.y, 12);
    sfx('nhac');
    // os peixes passam logo a ser bons; os tubarões e as baleias precisam de mais dentadas
    if (alvo.chefe) acerta(alvo, DIF.MORDE_CHEFE);
    else if (alvo.tipo === 'peixe') converte(alvo);
    else acerta(alvo, DIF.MORDE_DANO);
  }

  function atualizaTiros(dt) {
    const lista = tiros;     // (magoa() pode trocar a lista: acabamos esta volta na antiga)
    for (let i = lista.length - 1; i >= 0; i--) {
      const s = lista[i];
      s.t += dt;
      if (s.nossa) s.vy -= 60 * dt;                     // as bolhas sobem um bocadinho
      s.x += s.vx * dt; s.y += s.vy * dt;
      let fora = s.t > (s.nossa ? 1.1 : 4.5);
      if (s.nossa) {
        for (const e of ents) {
          if (e.equipa !== 'mau' || (e.chefe && !e.ativo)) continue;
          if (dentro(caixa(e), s.x, s.y, 6)) { acerta(e, 1); fora = true; break; }
        }
      } else if (Math.hypot(s.x - isaac.x, s.y - isaac.y) < 30) { magoa(); fora = true; }
      if (s.y < SUP() - 20 || s.y > FUNDO() + 40 || s.x < camX - 200 || s.x > camX + vw() + 200) fora = true;
      if (fora) lista.splice(i, 1);
    }
  }

  /* ---------- desenhar ---------- */
  S.draw = function (c, t) {
    const vs = vscale(), W = vw(), H = vh();
    c.save(); c.scale(vs, vs);
    fundo(c, W, H, t);
    c.save(); c.translate(-camX, 0);
    for (const e of ents) if (e.tipo === 'baleia' || e.chefe) desenhaBicho(c, e, t);
    for (const e of ents) if (!(e.tipo === 'baleia' || e.chefe) && e.equipa === 'mau') desenhaBicho(c, e, t);
    for (const e of ents) if (!(e.tipo === 'baleia' || e.chefe) && e.equipa === 'bom') desenhaBicho(c, e, t);
    if (orca) desenhaOrca(c, orca.x, orca.y, 1, orca.dir, t);
    mergulhador(c, PAI, pai, t, 1.3, false);
    mergulhador(c, ISAAC, isaac, t, 1.15, true);
    for (const s of tiros) desenhaTiro(c, s, t);
    for (const o of ondas) {
      c.globalAlpha = Math.max(0, 1 - o.t / 0.8);
      c.strokeStyle = '#caf0f8'; c.lineWidth = 14; c.beginPath(); c.arc(o.x, o.y, o.r, 0, TAU); c.stroke();
      c.globalAlpha = 1;
    }
    for (const p of parts) {
      c.globalAlpha = Math.max(0, 1 - p.t / p.life);
      if (p.bolha) { c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.stroke(); }
      else { c.fillStyle = p.cor; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); }
    }
    c.globalAlpha = 1;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const tx of textos) {
      c.globalAlpha = Math.max(0, 1 - tx.age / tx.life);
      if (tx.cor) { c.font = 'bold 30px "Comic Sans MS", sans-serif'; c.lineWidth = 6; c.strokeStyle = '#023e8a'; c.strokeText(tx.t, tx.x, tx.y); c.fillStyle = tx.cor; c.fillText(tx.t, tx.x, tx.y); }
      else { c.font = '34px sans-serif'; c.fillStyle = '#000'; c.fillText(tx.t, tx.x, tx.y); }
    }
    c.globalAlpha = 1;
    c.restore();
    if (T().id === 'escuro' && fase !== 'festa') escuridao(c, W, H, t);
    if (fase === 'festa') desenhaFesta(c, W, H, t);
    c.restore();
    hud(c, t);
  };

  function rep(W, par, passo, fn) {
    const off = camX * par, i0 = Math.floor((off - 400) / passo), i1 = Math.ceil((off + W + 400) / passo);
    for (let i = i0; i <= i1; i++) fn(i * passo - off + h01(i * 7) * passo * 0.4, i);
  }
  function fundo(c, W, H, t) {
    const d = T(), sup = SUP(), fu = FUNDO();
    // o céu lá em cima e a água
    c.fillStyle = d.id === 'gelo' ? '#e0fbfc' : (d.id === 'escuro' ? '#5a189a' : '#a2d2ff');
    c.fillRect(0, 0, W, sup + 10);
    const g = c.createLinearGradient(0, sup, 0, H);
    g.addColorStop(0, d.agua[0]); g.addColorStop(1, d.agua[1]);
    c.fillStyle = g; c.fillRect(0, sup, W, H - sup);
    // ondinhas da superfície
    c.fillStyle = 'rgba(255,255,255,.5)';
    c.beginPath(); c.moveTo(0, sup);
    for (let x = 0; x <= W + 20; x += 20) c.lineTo(x, sup + Math.sin((x + camX) * 0.03 + t * 2) * 5);
    c.lineTo(W, sup + 10); c.lineTo(0, sup + 10); c.fill();
    if (d.id === 'gelo') {
      // icebergues a boiar e orcas lá ao longe
      rep(W, 0.3, 520, function (x, i) {
        const w = 120 + h01(i) * 120;
        c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x - w, sup); c.lineTo(x - w * 0.4, sup - 50 - h01(i + 3) * 40); c.lineTo(x + w * 0.5, sup - 30); c.lineTo(x + w, sup); c.fill();
        c.fillStyle = 'rgba(202,240,248,.75)'; c.beginPath(); c.moveTo(x - w, sup); c.lineTo(x + w, sup); c.lineTo(x + w * 0.5, sup + 120 + h01(i + 1) * 80); c.lineTo(x - w * 0.6, sup + 90); c.fill();
      });
      for (let i = 0; i < 2; i++) {
        const x = ((i * 900 - camX * 0.2 + t * 40) % (W + 600) + W + 600) % (W + 600) - 300;
        c.globalAlpha = 0.35; desenhaOrca(c, x, sup + 220 + i * 160 + Math.sin(t + i) * 20, 0.6, 1, t + i); c.globalAlpha = 1;
      }
    } else if (d.id !== 'escuro') {
      // raios de luz a entrar na água
      c.fillStyle = 'rgba(255,255,255,.07)';
      for (let i = 0; i < 5; i++) {
        const x = ((i * 300 - camX * 0.1) % (W + 300) + W + 300) % (W + 300) - 150;
        c.beginPath(); c.moveTo(x, sup); c.lineTo(x + 70, sup); c.lineTo(x + 230 + Math.sin(t * 0.5 + i) * 30, H); c.lineTo(x + 90, H); c.fill();
      }
    }
    // bolhas a subir
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.5;
    for (const b of bolhasFundo) { c.beginPath(); c.arc(b.x * W + Math.sin(t + b.y * 10) * 6, sup + b.y * (H - sup), b.r, 0, TAU); c.stroke(); }
    // ao longe: rochas e coral
    rep(W, 0.35, 360, function (x, i) {
      const alt = 80 + h01(i) * 120;
      c.fillStyle = d.id === 'recife' ? 'rgba(0,80,120,.35)' : 'rgba(0,0,40,.3)';
      c.beginPath(); c.ellipse(x, fu + 10, 200, alt, 0, Math.PI, 0); c.fill();
    });
    // a areia
    c.fillStyle = d.areia;
    c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W + 30; x += 30) c.lineTo(x, fu + Math.sin((x + camX) * 0.01) * 10);
    c.lineTo(W, H); c.fill();
    // mais perto: coral, algas, rochas ou gelo
    rep(W, 1, 260, function (x, i) {
      const k = h01(i + 11), y = fu + Math.sin((x + camX) * 0.01) * 10;
      if (d.id === 'recife') { if (k < 0.5) coral(c, x, y, ['#ff6b6b', '#ff9f1c', '#f15bb5', '#9b5de5'][i & 3], t); else alga(c, x, y, '#2a9d8f', t, i); }
      else if (d.id === 'alto') { if (k < 0.6) alga(c, x, y, '#1b4965', t, i); }
      else if (d.id === 'escuro') { if (k < 0.5) { c.fillStyle = '#3c096c'; c.beginPath(); c.ellipse(x, y, 60, 40, 0, Math.PI, 0); c.fill(); } else alga(c, x, y, '#240046', t, i); }
      else if (k < 0.5) { c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x - 50, y); c.lineTo(x - 10, y - 70 - k * 60); c.lineTo(x + 40, y); c.fill(); }
      if (k > 0.85) { c.fillStyle = d.id === 'escuro' ? '#5a189a' : '#ffafcc'; G.gfx.star(c, x + 60, y - 6, 12, c.fillStyle, 0.3); }
    });
  }
  function coral(c, x, y, cor, t) {
    c.strokeStyle = cor; c.lineWidth = 10; c.lineCap = 'round';
    const bal = Math.sin(t * 1.2 + x * 0.01) * 4;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + bal, y - 70);
    c.moveTo(x, y - 30); c.lineTo(x - 28 + bal, y - 62); c.moveTo(x, y - 40); c.lineTo(x + 30 + bal, y - 80);
    c.moveTo(x - 28 + bal, y - 62); c.lineTo(x - 34 + bal, y - 86); c.stroke();
    c.fillStyle = cor; for (const [a, b] of [[bal, -74], [-34 + bal, -90], [30 + bal, -84]]) { c.beginPath(); c.arc(x + a, y + b, 8, 0, TAU); c.fill(); }
  }
  function alga(c, x, y, cor, t, i) {
    c.strokeStyle = cor; c.lineWidth = 8; c.lineCap = 'round';
    const h = 90 + h01(i + 4) * 90;
    c.beginPath(); c.moveTo(x, y);
    for (let s = 1; s <= 6; s++) c.lineTo(x + Math.sin(t * 1.5 + s * 0.9 + i) * 10 * s / 3, y - h * s / 6);
    c.stroke();
  }
  function escuridao(c, W, H, t) {
    const ix = isaac.x - camX, iy = isaac.y, px = pai.x - camX, py = pai.y;
    // só se vê à volta da lanterna do Isaac (e um bocadinho à volta do pai)
    c.save();
    const g = c.createRadialGradient(ix + isaac.dir * 60, iy, 90, ix + isaac.dir * 60, iy, 430);
    g.addColorStop(0, 'rgba(0,4,20,0)'); g.addColorStop(1, 'rgba(0,4,20,.9)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'lighter';
    const g2 = c.createRadialGradient(px, py, 10, px, py, 160);
    g2.addColorStop(0, 'rgba(255,255,200,.18)'); g2.addColorStop(1, 'rgba(255,255,200,0)');
    c.fillStyle = g2; c.fillRect(px - 160, py - 160, 320, 320);
    c.restore();
    // os olhos dos maus brilham no escuro
    for (const e of ents) {
      if (e.equipa !== 'mau' || !noEcra(e.x, 0.6)) continue;
      const b = caixa(e), ex = e.x - camX + e.dir * b.rx * 0.55, ey = e.y - b.ry * 0.25;
      c.fillStyle = '#ff2d2d'; c.shadowColor = '#ff2d2d'; c.shadowBlur = 10;
      c.beginPath(); c.arc(ex, ey, e.chefe ? 9 : 4, 0, TAU); c.fill();
      if (e.det === 'lanterna') { c.fillStyle = '#fff3b0'; c.shadowColor = '#fff3b0'; c.beginPath(); c.arc(e.x - camX - 150 * e.k, e.y - 120 * e.k + Math.sin(t * 3) * 6, 14, 0, TAU); c.fill(); }
      c.shadowBlur = 0;
    }
    for (const s of tiros) if (!s.nossa) { c.fillStyle = 'rgba(255,240,150,.85)'; c.beginPath(); c.arc(s.x - camX, s.y, 6, 0, TAU); c.fill(); }
  }

  /* ---------- os mergulhadores: o boneco do jogo da Marvel com fato de mergulho ---------- */
  function mergulhador(c, def, p, t, K, eIsaac) {
    const B = G.scenes && G.scenes.marvel && G.scenes.marvel.api && G.scenes.marvel.api.boneco;
    const aDescansar = eIsaac && isaac.descansa > 0;
    const naOrca = eIsaac && orca && orca.fase === 'leva';
    c.save(); c.translate(p.x, p.y);
    if (eIsaac && isaac.inv > 0 && !aDescansar && !naOrca && Math.floor(t * 12) % 2 === 0) c.globalAlpha = 0.55;
    c.scale(p.dir * K, K);
    const incl = aDescansar ? -1.2 : clamp(p.vy / 600, -0.5, 0.5);
    c.rotate(Math.PI / 2 + incl);
    c.translate(0, 36);
    const bate = Math.sin(p.rema) * 0.22;
    const pernas = { dx: 0, dy: 0, r: aDescansar ? 0 : bate };
    // a garrafa de ar nas costas e as barbatanas (por trás do corpo)
    c.save(); c.translate(0, -14); c.rotate(pernas.r); c.translate(0, 14);
    c.fillStyle = '#212529';
    for (const lx of [-5, 5]) { c.beginPath(); c.moveTo(lx - 5, -2); c.lineTo(lx + 5, -2); c.lineTo(lx + 9 + bate * 10, 16); c.lineTo(lx - 7 + bate * 10, 16); c.closePath(); c.fill(); }
    c.fillStyle = def.bar; c.fillRect(-12, 13, 22, 3);
    c.restore();
    c.fillStyle = def.bar; G.gfx.rr(c, -18, -52, 8, 24, 3.5); c.fill();
    c.fillStyle = '#adb5bd'; c.fillRect(-16, -56, 4, 4);
    if (B) {
      B(c, def, { t: t, dir: 1, fase: 0, anda: false, braco: aDescansar ? 0 : (naOrca ? 1.2 : 2.15), cima: false, partes: { pernas: pernas } });
    } else {
      c.fillStyle = def.tronco; G.gfx.rr(c, -10, -50, 20, 30, 6); c.fill();
      c.fillStyle = def.pernas; c.fillRect(-9, -22, 18, 22);
      c.fillStyle = def.pele; c.beginPath(); c.arc(0, -60, 9, 0, TAU); c.fill();
    }
    // o capuz do fato, a máscara e o tubo do ar
    c.fillStyle = def.capuz; G.gfx.rr(c, -9, -70, 18, 7, 3.5); c.fill(); c.fillRect(-9, -66, 4, 12);
    c.fillStyle = 'rgba(170,225,255,.6)'; c.strokeStyle = '#212529'; c.lineWidth = 1.4;
    G.gfx.rr(c, -4.5, -64.5, 12.5, 7, 2.5); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(-2.5, -63.5, 3, 1.5);
    c.strokeStyle = '#343a40'; c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(-14, -55); c.quadraticCurveTo(-6, -48, 4.5, -55.5); c.stroke();
    c.fillStyle = '#343a40'; c.beginPath(); c.arc(5, -55.5, 2, 0, TAU); c.fill();
    c.restore();
    // a pistola de bolhas (na mão, à frente da cabeça)
    if (!aDescansar) {
      c.save(); c.translate(p.x, p.y); c.scale(p.dir * K, K); c.rotate(incl);
      const gx = naOrca ? 18 : 36, gy = naOrca ? 14 : 9;
      c.fillStyle = eIsaac ? '#4cc9f0' : '#80ed99'; G.gfx.rr(c, gx - 6, gy - 5, 22, 10, 4); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(gx + 18, gy, 4.5, 0, TAU); c.fill();
      c.fillStyle = '#495057'; c.fillRect(gx - 2, gy + 3, 5, 8);
      if (p.tiro > 0) { c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.arc(gx + 26, gy, 7, 0, TAU); c.stroke(); }
      c.restore();
    }
    // bolhinhas da respiração e o 💤 a descansar
    if (Math.floor(t * 3 + (eIsaac ? 0 : 1.5)) % 3 === 0) {
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.5;
      const by = p.y - 26 - ((t * 60) % 30);
      c.beginPath(); c.arc(p.x + p.dir * 24, by, 4, 0, TAU); c.stroke();
    }
    if (aDescansar) { c.font = '30px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText('💤', p.x, p.y - 60 - (t * 30) % 30); }
    if (eIsaac && fase === 'joga') {
      const y = p.y - 70 + Math.sin(t * 6) * 4;
      c.fillStyle = '#ffd60a'; c.strokeStyle = '#7a5a00'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(p.x - 10, y - 10); c.lineTo(p.x + 10, y - 10); c.lineTo(p.x, y + 2); c.closePath(); c.fill(); c.stroke();
    }
  }

  /* ---------- os bichos do mar ---------- */
  function olho(c, x, y, r, mau, t) {
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.fillStyle = '#111'; c.beginPath(); c.arc(x + r * 0.25, y + r * 0.1, r * 0.55, 0, TAU); c.fill();
    c.strokeStyle = '#111'; c.lineWidth = Math.max(2, r * 0.35); c.lineCap = 'round';
    if (mau) { c.beginPath(); c.moveTo(x - r * 1.1, y - r * 1.3); c.lineTo(x + r * 1.1, y - r * 0.6); c.stroke(); }
  }
  function dentes(c, x0, x1, y, h) {
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x0, y);
    const n = Math.max(2, Math.round((x1 - x0) / (h * 1.2)));
    for (let i = 0; i < n; i++) { const a = x0 + (x1 - x0) * i / n, b = x0 + (x1 - x0) * (i + 1) / n; c.lineTo((a + b) / 2, y + h); c.lineTo(b, y); }
    c.fill();
  }
  function desenhaBicho(c, e, t) {
    const mau = e.equipa === 'mau';
    c.save(); c.translate(e.x, e.y);
    if (e.pisca > 0 && Math.floor(t * 24) % 2 === 0) c.globalAlpha = 0.55;
    if (e.tipo === 'tubarao' && e.estado === 'prepara' && mau) c.translate(Math.sin(t * 60) * 3, 0);
    if (e.chefe) desenhaChefe(c, e, t, mau);
    else {
      c.scale(e.dir, 1);
      if (e.tipo === 'peixe') peixe(c, e, t);
      else if (e.tipo === 'tubarao') { const k = e.k * (e.transf > 0 ? 1 - e.transf * 0.6 : 1); c.scale(k, k); tubarao(c, mau, t, e.boca > 0, e.id); }
      else if (e.tipo === 'baleia') baleia(c, mau, t, 1, '#577590');
    }
    c.restore();
    // a nuvem de bolhas da transformação
    if (e.transf > 0) {
      c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2.5;
      for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + t * 3, r = 40 + (0.8 - e.transf) * 70; c.beginPath(); c.arc(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r * 0.6, 7, 0, TAU); c.stroke(); }
    }
    if (e.vaiCasa && e.tipo === 'tubarao') { c.font = '22px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText('👋', e.x, e.y - 50); }
    // a energia que falta (só nos maus; a do chefe aparece lá em cima)
    if (mau && !e.chefe && e.hp < e.max) {
      const b = caixa(e), w = 44;
      c.fillStyle = 'rgba(0,0,0,.3)'; G.gfx.rr(c, b.x - w / 2, b.y - b.ry - 18, w, 7, 3); c.fill();
      c.fillStyle = '#80ff72'; G.gfx.rr(c, b.x - w / 2, b.y - b.ry - 18, w * (1 - e.hp / e.max), 7, 3); c.fill();
    }
  }
  function peixe(c, e, t) {
    const abana = Math.sin(t * 12 + e.fase) * 0.3;
    c.fillStyle = e.cor;
    c.save(); c.translate(-22, 0); c.rotate(abana);
    c.beginPath(); c.moveTo(4, 0); c.lineTo(-16, -15); c.lineTo(-12, 0); c.lineTo(-16, 15); c.closePath(); c.fill();
    c.restore();
    c.beginPath(); c.ellipse(0, 0, 26, 17, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.moveTo(-6, -14); c.lineTo(4, -24); c.lineTo(10, -13); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(-6, -12); c.lineTo(-6, 12); c.stroke();
    olho(c, 12, -4, 5.5, true, t);
    c.strokeStyle = '#111'; c.lineWidth = 2; c.beginPath(); c.moveTo(18, 8); c.lineTo(25, 5); c.stroke();
    if (e.cuspe) { c.fillStyle = '#3c096c'; c.beginPath(); c.arc(25, 5, 3, 0, TAU); c.fill(); }
    if (e.boca > 0) dentes(c, 16, 26, 4, 4);
  }
  // o tubarão (visto de lado, a nadar para +x)
  function tubarao(c, mau, t, bocaAberta, id) {
    const cor = mau ? '#6c757d' : (id % 2 ? '#4895ef' : '#2ec4b6'), barriga = mau ? '#dee2e6' : '#e0fbfc';
    const abana = Math.sin(t * 8 + id) * 0.25;
    c.fillStyle = cor;
    // a cauda
    c.save(); c.translate(-56, 0); c.rotate(abana);
    c.beginPath(); c.moveTo(6, 0); c.lineTo(-22, -28); c.lineTo(-14, 0); c.lineTo(-20, 22); c.closePath(); c.fill();
    c.restore();
    // a barbatana de cima e a do lado
    c.beginPath(); c.moveTo(-14, -18); c.lineTo(2, -46); c.lineTo(16, -18); c.fill();
    // o corpo
    c.beginPath(); c.moveTo(-58, 0); c.quadraticCurveTo(-30, -26, 20, -22); c.quadraticCurveTo(62, -14, 70, 2);
    c.quadraticCurveTo(50, 22, 10, 22); c.quadraticCurveTo(-30, 20, -58, 0); c.fill();
    c.fillStyle = barriga; c.beginPath(); c.moveTo(-40, 8); c.quadraticCurveTo(10, 26, 60, 8); c.quadraticCurveTo(30, 14, -40, 8); c.fill();
    c.fillStyle = cor; c.beginPath(); c.moveTo(0, 12); c.lineTo(-16, 32); c.lineTo(16, 16); c.fill();
    // as guelras
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 2;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(28 + i * 6, -8); c.quadraticCurveTo(25 + i * 6, 0, 28 + i * 6, 8); c.stroke(); }
    olho(c, 50, -6, 5, mau, t);
    // a boca: zangada com dentes ou a sorrir
    if (bocaAberta) {
      c.fillStyle = '#9d0208'; c.beginPath(); c.moveTo(70, 4); c.lineTo(40, 6); c.lineTo(66, 20); c.fill();
      dentes(c, 42, 68, 5, 5);
    } else if (mau) {
      c.strokeStyle = '#111'; c.lineWidth = 2; c.beginPath(); c.moveTo(42, 10); c.lineTo(66, 7); c.stroke();
      dentes(c, 46, 64, 8, 4);
    } else {
      c.strokeStyle = '#111'; c.lineWidth = 2.5; c.beginPath(); c.arc(54, 4, 9, 0.3, Math.PI - 0.6); c.stroke();
      c.fillStyle = '#ff6fb1'; c.beginPath(); c.arc(44, 6, 3, 0, TAU); c.fill();
    }
  }
  function baleia(c, mau, t, k, cor) {
    c.scale(k, k);
    const corpo = mau ? cor : '#4cc9f0', abana = Math.sin(t * 2) * 0.2;
    c.fillStyle = corpo;
    c.save(); c.translate(-105, -5); c.rotate(abana);
    c.beginPath(); c.moveTo(10, 0); c.quadraticCurveTo(-20, -10, -40, -36); c.quadraticCurveTo(-30, -6, -14, 0); c.quadraticCurveTo(-30, 6, -40, 34); c.quadraticCurveTo(-20, 10, 10, 0); c.fill();
    c.restore();
    c.beginPath(); c.moveTo(-110, -6); c.quadraticCurveTo(-60, -60, 40, -52); c.quadraticCurveTo(120, -44, 120, 4);
    c.quadraticCurveTo(110, 50, 30, 50); c.quadraticCurveTo(-60, 48, -110, -6); c.fill();
    c.fillStyle = mau ? '#adb5bd' : '#caf0f8';
    c.beginPath(); c.moveTo(-50, 24); c.quadraticCurveTo(40, 64, 112, 18); c.quadraticCurveTo(60, 34, -50, 24); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 2;
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(10 + i * 22, 30 + i * 2); c.lineTo(20 + i * 22, 44); c.stroke(); }
    c.fillStyle = corpo; c.beginPath(); c.moveTo(10, 30); c.lineTo(-20, 64); c.lineTo(36, 38); c.fill();
    olho(c, 78, -6, 7, mau, t);
    c.strokeStyle = '#111'; c.lineWidth = 3;
    if (mau) { c.beginPath(); c.moveTo(80, 22); c.quadraticCurveTo(100, 14, 118, 20); c.stroke(); }
    else { c.beginPath(); c.arc(98, 12, 14, 0.3, Math.PI - 0.5); c.stroke(); }
    // o buraco de respirar (e o repuxo de água quando está contente)
    c.fillStyle = '#212529'; c.beginPath(); c.ellipse(30, -51, 6, 3, 0, 0, TAU); c.fill();
    if (!mau) {
      c.strokeStyle = 'rgba(202,240,248,.9)'; c.lineWidth = 5;
      for (const s of [-1, 0, 1]) { c.beginPath(); c.moveTo(30, -54); c.quadraticCurveTo(30 + s * 20, -100, 30 + s * 40, -80 + Math.sin(t * 8) * 4); c.stroke(); }
    }
  }
  function desenhaOrca(c, x, y, k, dir, t) {
    c.save(); c.translate(x, y); c.scale(dir * k, k);
    const abana = Math.sin(t * 7) * 0.25;
    c.fillStyle = '#111';
    c.save(); c.translate(-96, 0); c.rotate(abana);
    c.beginPath(); c.moveTo(10, 0); c.quadraticCurveTo(-14, -6, -30, -28); c.quadraticCurveTo(-22, -4, -10, 0); c.quadraticCurveTo(-22, 4, -30, 28); c.quadraticCurveTo(-14, 6, 10, 0); c.fill();
    c.restore();
    c.beginPath(); c.moveTo(-10, -30); c.quadraticCurveTo(-4, -78, 12, -96); c.quadraticCurveTo(14, -60, 22, -32); c.fill();   // a barbatana alta
    c.beginPath(); c.moveTo(-100, 0); c.quadraticCurveTo(-60, -40, 30, -36); c.quadraticCurveTo(110, -30, 116, 4);
    c.quadraticCurveTo(100, 36, 20, 36); c.quadraticCurveTo(-60, 30, -100, 0); c.fill();
    c.fillStyle = '#ffffff';
    c.beginPath(); c.moveTo(-40, 18); c.quadraticCurveTo(30, 44, 108, 14); c.quadraticCurveTo(60, 22, 20, 12); c.quadraticCurveTo(-10, 12, -40, 18); c.fill();
    c.beginPath(); c.ellipse(70, -12, 16, 7, -0.15, 0, TAU); c.fill();                       // a mancha branca do olho
    c.fillStyle = 'rgba(200,200,220,.7)'; c.beginPath(); c.ellipse(-6, -28, 18, 6, 0, 0, TAU); c.fill();
    c.fillStyle = '#111'; c.beginPath(); c.moveTo(20, 20); c.lineTo(-6, 52); c.lineTo(44, 28); c.fill();
    c.fillStyle = '#111'; c.beginPath(); c.arc(86, -6, 3.5, 0, TAU); c.fill();
    c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.arc(100, 6, 10, 0.4, Math.PI - 0.8); c.stroke();
    c.restore();
  }
  function desenhaChefe(c, e, t, mau) {
    const k = e.k;
    c.scale(-1, 1);       // os chefes olham para a esquerda (para nós)
    if (e.det === 'balao') {
      const r = 95 * (1 + (e.incha || 0) * 0.25);
      c.fillStyle = mau ? e.cor : '#ffe066';
      c.strokeStyle = mau ? '#9c6644' : '#ffd166'; c.lineWidth = 6;
      for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9); c.lineTo(Math.cos(a) * (r + 26), Math.sin(a) * (r + 26)); c.stroke(); }
      c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(-10, 40, r * 0.6, r * 0.35, 0, 0, TAU); c.fill();
      c.fillStyle = mau ? '#e85d04' : '#ffd166';
      c.beginPath(); c.moveTo(-r + 4, 0); c.lineTo(-r - 40, -30 + Math.sin(t * 8) * 8); c.lineTo(-r - 40, 30 - Math.sin(t * 8) * 8); c.fill();
      olho(c, 40, -30, 18, mau, t); olho(c, 0, -36, 15, mau, t);
      c.fillStyle = mau ? '#9d0208' : '#ff6fb1'; c.beginPath(); c.ellipse(r - 16, 18, 14, mau ? 10 : 14, 0, 0, TAU); c.fill();
    } else if (e.det === 'baleia') {
      baleia(c, mau, t, k, e.cor);
      if (mau) { c.fillStyle = '#ffd166'; c.beginPath(); c.moveTo(30, -50); c.lineTo(40, -80); c.lineTo(55, -60); c.lineTo(70, -84); c.lineTo(80, -48); c.fill(); }
    } else if (e.det === 'lanterna') {
      c.scale(k, k);
      const corpo = mau ? e.cor : '#9d4edd';
      // a cana da lanterna
      c.strokeStyle = corpo; c.lineWidth = 6;
      c.beginPath(); c.moveTo(30, -60); c.quadraticCurveTo(110, -150, 150, -120 + Math.sin(t * 3) * 6); c.stroke();
      c.fillStyle = mau ? '#fff3b0' : '#80ff72'; c.shadowColor = c.fillStyle; c.shadowBlur = 25;
      c.beginPath(); c.arc(150, -120 + Math.sin(t * 3) * 6, 14, 0, TAU); c.fill(); c.shadowBlur = 0;
      c.fillStyle = corpo;
      c.beginPath(); c.moveTo(-90, 0); c.lineTo(-130, -40 + Math.sin(t * 6) * 6); c.lineTo(-130, 40 - Math.sin(t * 6) * 6); c.fill();
      c.beginPath(); c.ellipse(0, 0, 95, 72, 0, 0, TAU); c.fill();
      c.fillStyle = '#10002b'; c.beginPath(); c.moveTo(95, -6); c.quadraticCurveTo(40, 30, 90, 56); c.quadraticCurveTo(60, 20, 95, -6); c.fill();
      c.beginPath(); c.moveTo(40, 4); c.lineTo(98, -4); c.lineTo(84, 50); c.closePath(); c.fill();
      if (mau) { dentes(c, 44, 96, 0, 12); c.save(); c.translate(0, 50); c.scale(1, -1); dentes(c, 44, 84, 0, 10); c.restore(); }
      else { c.strokeStyle = '#ff6fb1'; c.lineWidth = 6; c.beginPath(); c.arc(68, 18, 22, 0.2, Math.PI - 0.6); c.stroke(); }
      olho(c, 46, -30, 14, mau, t);
    } else {
      c.scale(k, k);
      tubarao(c, mau, t, e.boca > 0 || e.estado === 'investe', 1);
      if (mau) { c.strokeStyle = '#adb5bd'; c.lineWidth = 2; c.beginPath(); c.moveTo(10, -16); c.lineTo(24, 4); c.moveTo(16, -16); c.lineTo(4, 2); c.stroke(); }
    }
  }

  function desenhaTiro(c, s, t) {
    if (s.tipo === 'bolha') {
      c.fillStyle = s.pai ? 'rgba(128,237,153,.35)' : 'rgba(162,210,255,.4)';
      c.beginPath(); c.arc(s.x, s.y, s.r, 0, TAU); c.fill();
      c.strokeStyle = '#ffffff'; c.lineWidth = 2.5; c.stroke();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(s.x - s.r * 0.35, s.y - s.r * 0.35, s.r * 0.25, 0, TAU); c.fill();
    } else if (s.tipo === 'espinho') {
      const a = Math.atan2(s.vy, s.vx);
      c.save(); c.translate(s.x, s.y); c.rotate(a);
      c.fillStyle = '#9c6644'; c.beginPath(); c.moveTo(14, 0); c.lineTo(-10, -6); c.lineTo(-10, 6); c.fill();
      c.restore();
    } else if (s.tipo === 'tinta') {
      c.fillStyle = 'rgba(60,9,108,.85)'; c.beginPath(); c.arc(s.x, s.y, 9, 0, TAU); c.fill();
      c.fillStyle = 'rgba(60,9,108,.4)'; c.beginPath(); c.arc(s.x - s.vx * 0.03, s.y - s.vy * 0.03, 7, 0, TAU); c.fill();
    } else if (s.tipo === 'luz') {
      c.fillStyle = 'rgba(255,243,176,.5)'; c.beginPath(); c.arc(s.x, s.y, 13, 0, TAU); c.fill();
      c.fillStyle = '#ffd60a'; c.beginPath(); c.arc(s.x, s.y, 7, 0, TAU); c.fill();
    } else {
      c.fillStyle = 'rgba(0,53,102,.45)'; c.beginPath(); c.arc(s.x, s.y, 14, 0, TAU); c.fill();
      c.fillStyle = '#e63946'; c.beginPath(); c.arc(s.x, s.y, 8, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(s.x - 2, s.y - 2, 3, 0, TAU); c.fill();
    }
  }

  function desenhaFesta(c, W, H, t) {
    // as orcas saltam fora de água
    for (let i = 0; i < 3; i++) {
      const fx = ((t * 0.5 + i / 3) % 1), x = W * (0.2 + i * 0.3), y = SUP() + 80 - Math.sin(fx * Math.PI) * 220;
      c.save(); c.translate(x, y); c.rotate((fx - 0.5) * 1.6); desenhaOrca(c, 0, 0, 0.7, 1, t + i); c.restore();
    }
    G.gfx.label(c, 'GANHÁMOS! O MAR É TODO AMIGO!', W / 2, SUP() + 260, 34, '#ffffff', 'center');
  }

  /* ---------- o painel: corações, estrelas, zonas, tubarões amigos e a orca ---------- */
  function hud(c, t) {
    const k = Math.min(1, G.H / 520);
    c.save(); c.scale(k, k);
    for (let i = 0; i < DIF.MAXC; i++) {
      const x = 28 + i * 36, y = 34, f = clamp(isaac.coracoes - i, 0, 1);
      G.gfx.heart(c, x, y, 30, 'rgba(0,0,0,.18)');
      if (f > 0) {
        c.save();
        if (f < 1) { c.beginPath(); c.rect(x - 20, y - 20, 20, 40); c.clip(); }
        G.gfx.heart(c, x, y, 30, '#ff3b6b');
        c.restore();
      }
    }
    G.gfx.star(c, 30, 76, 16, '#ffd166', 0);
    G.gfx.label(c, '' + G.state.stars, 54, 77, 26, '#b56b00');
    // as quatro zonas: o chefe de cada uma (olho verde quando já é nosso amigo)
    for (let i = 0; i < TERRAS.length; i++) {
      const x = 34 + i * 46, y = 128, atual = i === terra;
      c.save(); c.translate(x, y); c.scale(atual ? 1.15 : 0.95, atual ? 1.15 : 0.95);
      c.fillStyle = atual ? 'rgba(255,214,10,.9)' : 'rgba(255,255,255,.6)';
      c.beginPath(); c.arc(0, 0, 21, 0, TAU); c.fill();
      c.fillStyle = TERRAS[i].chefe.cor; c.beginPath(); c.ellipse(1, 0, 14, 10, 0, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(-10, 0); c.lineTo(-18, -8); c.lineTo(-18, 8); c.fill();
      const nossa = i < conquistadas || (i === terra && (fase === 'ganhou' || fase === 'passa' || fase === 'festa'));
      c.fillStyle = nossa ? '#80ff72' : '#ff2d2d'; c.beginPath(); c.arc(7, -2, 3.5, 0, TAU); c.fill();
      c.restore();
    }
    // os tubarões bons que vêm connosco
    c.save(); c.translate(236, 128); c.scale(0.32, 0.32); tubarao(c, false, t, false, 2); c.restore();
    G.gfx.label(c, '' + amigos().length, 268, 130, 26, '#2a9d8f');
    // a orca (a encher)
    c.save(); c.translate(32, 182);
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.fill();
    const pronto = especial >= 1 && !orca;
    c.strokeStyle = pronto ? '#9ef01a' : '#ffffff'; c.lineWidth = 5;
    c.beginPath(); c.arc(0, 0, 20, -Math.PI / 2, -Math.PI / 2 + TAU * especial); c.stroke();
    c.scale(pronto ? 0.16 + Math.sin(t * 6) * 0.01 : 0.15, pronto ? 0.16 + Math.sin(t * 6) * 0.01 : 0.15);
    desenhaOrca(c, -6, 6, 1, 1, t);
    c.restore();
    // quanto falta até ao chefe
    const f = clamp(isaac.x / chefe.x0, 0, 1);
    G.gfx.rr(c, 64, 177, 220, 10, 5); c.fillStyle = 'rgba(255,255,255,.55)'; c.fill();
    G.gfx.rr(c, 64, 177, Math.max(10, 220 * f), 10, 5); c.fillStyle = '#ffd166'; c.fill();
    // a energia do chefe, lá em cima ao meio
    if (chefe.ativo && chefe.equipa === 'mau') {
      const W = G.W / k, w = Math.min(320, W - 380), x = Math.max(240, W / 2 - w / 2);
      if (w > 80) {
        c.fillStyle = 'rgba(0,0,0,.3)'; G.gfx.rr(c, x, 22, w, 16, 8); c.fill();
        c.fillStyle = '#80ff72'; G.gfx.rr(c, x, 22, Math.max(8, w * (1 - chefe.hp / chefe.max)), 16, 8); c.fill();
        c.fillStyle = chefe.cor; c.beginPath(); c.ellipse(x - 18, 30, 13, 10, 0, 0, TAU); c.fill();
        c.fillStyle = '#ff2d2d'; c.beginPath(); c.arc(x - 24, 28, 3, 0, TAU); c.fill();
      } else {
        // ao alto não cabe ao lado dos corações: vai para baixo do caminho
        const w2 = 220;
        c.fillStyle = 'rgba(0,0,0,.3)'; G.gfx.rr(c, 64, 200, w2, 12, 6); c.fill();
        c.fillStyle = '#80ff72'; G.gfx.rr(c, 64, 200, Math.max(8, w2 * (1 - chefe.hp / chefe.max)), 12, 6); c.fill();
        c.fillStyle = chefe.cor; c.beginPath(); c.ellipse(46, 206, 12, 9, 0, 0, TAU); c.fill();
        c.fillStyle = '#ff2d2d'; c.beginPath(); c.arc(41, 204, 3, 0, TAU); c.fill();
      }
    }
    c.restore();
  }

  S.debug = function () {
    return { terra: T().id, fase: fase, ronda: ronda, x: Math.round(isaac.x), y: Math.round(isaac.y), coracoes: isaac.coracoes,
      descansa: isaac.descansa > 0, maus: maus().length, amigos: amigos().length, especial: +especial.toFixed(2), orca: orca ? orca.fase : null,
      chefe: { ativo: chefe.ativo, hp: chefe.hp, max: chefe.max, bom: chefe.equipa === 'bom' }, tiros: tiros.length,
      conquistadas: conquistadas, piloto: piloto, len: LEN, camX: Math.round(camX), stats: stats };
  };
  S.api = {
    vaiPara: function (i) { comecaTerra(clamp(i | 0, 0, TERRAS.length - 1), amigos().length); },
    autopiloto: function (on) { piloto = on === undefined ? !piloto : !!on; return piloto; },
    isaac: function () { return isaac; }, pai: function () { return pai; }, ents: function () { return ents; }, chefe: function () { return chefe; },
    tiros: function () { return tiros; }, stats: function () { return stats; }, dif: DIF,
    enche: function () { especial = 1; }, chefeQuase: function () { chefe.hp = 1; }
  };

  G.scenes = G.scenes || {};
  G.scenes.mar = S;
})();
