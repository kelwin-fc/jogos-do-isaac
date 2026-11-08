/* Cena — STAR WARS: a nave do bebé verde, ditada pelo Isaac.

   "Nós vamos em nave e conduzimos a nave e nós somos o bebé Yoda. E o bebé Yoda está
   com o seu amigo, que é aquela pessoa que tem pistolas. Os mauzões são disparados
   pelas pistolas e nós também somos disparados pela pistola. E estamos em terra com
   touros, com mauzões, com monstros, com pessoas, do Egito, de bois de Lego gigantes
   que nós podemos estar lá dentro, e em terra do espaço."

   Como ficou:
   - Conduz-se a nave (◀ ▶ mais devagar/depressa, ⬆ sobe, largar desce devagarinho).
     Lá dentro, na cúpula, vão o bebé verde e o amigo de capacete. O amigo é quem
     dispara as pistolas (🔫, segurar dispara sempre) e às vezes dispara sozinho.
   - O bebé tem a FORÇA (✋): levanta a mãozinha, os tiros dos maus param no ar e
     desfazem-se, e os maus que estão no ecrã ficam a flutuar.
   - Os maus também disparam. Cada tiro tira meio coração. Sem corações não há derrota:
     a nave pousa e o amigo arranja-a com a chave (🔧) e seguimos.
   - Sete terras, uma atrás da outra, ligadas por um portal (hiperespaço). Também se
     salta para qualquer terra tocando no desenho dela no canto.
       🐂 touros   — correm e saltam à nave; com dois tiros sentam-se com flores.
       🦹 mauzões  — naves dos maus e soldados no chão com pistolas.
       👾 monstros — atiram gosma; com três tiros riem-se e ficam amigos.
       🏘️ pessoas  — acenam; passar baixinho é um "mais cinco" (🙌).
       🏛️ Egito    — múmias (a ligadura cai e ficam a dançar) e cobras que saltam.
       🧱 Lego     — BOIS DE LEGO GIGANTES: voa-se para a porta e fica-se LÁ DENTRO;
                     o boi anda com ◀ ▶, salta com ⬆ e o pisão faz os maus amigos;
                     ✋ é um MUUU; 🚪 para sair. Lá dentro nenhum tiro nos apanha.
       🪐 espaço   — asteroides e, no fim, a NAVE-MÃE dos maus.
   - Os maus nunca morrem: a nave desfaz-se em pecinhas e o piloto desce de paraquedas
     a acenar; os outros ficam amigos.

   2.ª ronda (pedido do Isaac): "o bebé Yoda pode sair da nave e eu posso andar com
   ele, não com o outro; ele pode ir para cima dos bois; e tenho de sair da nave,
   senão não posso andar fora com o bebé."
   - 🚪 com a nave no ar: a nave pousa e o bebé sai cá para fora. Só o bebé anda
     (◀ ▶, ⬆ salta); o amigo fica na nave, que vem atrás dele devagarinho e continua
     a disparar sozinha. A pé, o botão de disparar passa a ✨: o bebé atira bolinhas
     da Força. ✋ continua a ser a Força grande.
   - O bebé sobe para CIMA dos bois de Lego (as costas e a cabeça são chão) e vai à
     boleia quando o boi anda.
   - 🚪 ao pé da nave = o bebé volta a entrar e a nave levanta voo. No espaço não se
     sai (não há chão). */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  const LEN = 9000;          // comprimento de cada terra (o portal está no fim)
  const MAXC = 5;            // corações
  const GRAV = 1800;
  const OFICINA = 2.8;       // segundos a arranjar a nave

  const TERRAS = [
    { id: 'touros', ic: '🐂', nome: 'Terra dos touros', fala: 'Terra dos touros! Cuidado, eles saltam!', mix: [['touro', 0.65], ['nave', 0.35]], gap: [365, 552] },
    { id: 'mauzoes', ic: '🦹', nome: 'Terra dos mauzões', fala: 'Terra dos mauzões! Dispara, amigo!', mix: [['nave', 0.65], ['soldado', 0.35]], gap: [323, 493] },
    { id: 'monstros', ic: '👾', nome: 'Terra dos monstros', fala: 'Terra dos monstros! Eles atiram gosma!', mix: [['monstro', 0.65], ['nave', 0.35]], gap: [399, 595] },
    { id: 'pessoas', ic: '🏘️', nome: 'Terra das pessoas', fala: 'Terra das pessoas! Dá um mais cinco!', mix: [['pessoa', 0.5], ['nave', 0.35], ['soldado', 0.15]], gap: [280, 442] },
    { id: 'egito', ic: '🏛️', nome: 'Terra do Egito', fala: 'Terra do Egito! Múmias e cobras!', mix: [['mumia', 0.45], ['cobra', 0.35], ['nave', 0.2]], gap: [357, 544] },
    { id: 'lego', ic: '🧱', nome: 'Terra dos bois de Lego', fala: 'Terra dos bois de Lego! Entra na porta do boi!', mix: [['soldado', 0.5], ['nave', 0.5]], gap: [357, 544] },
    { id: 'espaco', ic: '🪐', nome: 'Terra do espaço', fala: 'O espaço! Cuidado com os asteroides!', mix: [['asteroide', 0.5], ['nave', 0.5]], gap: [306, 476] }
  ];

  let s, camX, vel, terra, ronda, ents, tiros, tirosM, parts, textos, pickups, fase, faseT, destino;
  let prox, proxPick, boi, boss, tempo, forcaFx, hudTerras, dentroVisivel, forcaVisivel;
  let pe, fogoAPe;   // o bebé cá fora a pé (null = está na nave)

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function h01(n) { const v = Math.sin(n * 127.1 + 3.3) * 43758.5; return v - Math.floor(v); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function vscale() { return Math.min(1, G.H / 620, G.W / 700); }
  function vw() { return G.W / vscale(); }
  function vh() { return G.H / vscale(); }
  // a linha do chão fica sempre acima dos botões (ao alto há duas filas deles)
  function chaoY() {
    const reserva = G.W < 560 && G.H > G.W ? 236 : 122;
    return Math.min(vh() * 0.86, Math.max(vh() * 0.52, (G.H - reserva) / vscale()));
  }
  // a nave não sobe para cima dos desenhos do canto (corações, estrelas, terras)
  function tetoY() { return Math.min(chaoY() - 160, (Math.min(1, G.H / 520) * 168) / vscale() + 44); }
  function fala(t) { if (G.audio.fala) G.audio.fala(t); }
  function T() { return TERRAS[terra]; }

  S.enter = function () {
    s = { sx: 200, y: 220, vy: 0, wx: 200, inv: 2, flash: 0, tilt: 0, cdTiro: 0, cdAmigo: 1.5, tiroT: 0,
      coracoes: MAXC, forcaCd: 0, forcaT: 0 };
    ronda = 1; tempo = 0; forcaFx = 0; hudTerras = [];
    dentroVisivel = null; forcaVisivel = null; fogoAPe = null;
    comecaTerra(0);
  };

  function comecaTerra(i) {
    terra = i;
    camX = 0; vel = 200;
    ents = []; tiros = []; tirosM = []; parts = []; textos = []; pickups = [];
    boss = null; boi = null; pe = null; botaoFogo(false);
    prox = vw() + 260; proxPick = 520;
    s.sx = vw() * 0.24; s.y = vh() * 0.38; s.vy = 0; s.inv = 1.6;
    fase = 'voa'; faseT = 0;
    if (T().id === 'lego') { spawn('boi', 760); prox = Math.max(prox, 1300); }
    mostraPorta(false);
    G.banner(T().ic + ' ' + T().nome, 2200);
    fala(T().fala);
  }

  // o 🚪 só aparece quando estamos dentro de um boi de Lego
  function mostraPorta(on) {
    if (on === dentroVisivel) return;
    dentroVisivel = on;
    document.body.classList.toggle('sw-dentro', on);
  }
  function mostraForca(pronta) {
    if (pronta === forcaVisivel) return;
    forcaVisivel = pronta;
    document.body.classList.toggle('sw-forca-espera', !pronta);
  }

  // a pé, o botão de disparar é a bolinha da Força do bebé (✨); na nave são as pistolas (🔫)
  function botaoFogo(aPe) {
    if (aPe === fogoAPe) return;
    fogoAPe = aPe;
    document.getElementById('btnFire').textContent = aPe ? '✨' : '🔫';
  }
  // onde estamos agora (a nave, o boi ou o bebé a pé) e o tamanho para os toques
  function eu() {
    if (boi) return { x: boi.x, y: boi.y - 120, mx: 120, my: 90 };
    if (pe) return { x: pe.x, y: pe.y - 32, mx: 16, my: 26 };
    return { x: s.wx, y: s.y, mx: 52, my: 20 };
  }
  function pertoDaNave() { return !!pe && Math.abs(pe.x - s.wx) < 190 && pe.y > s.y - 160; }
  // as partes de cima de um boi de Lego onde o bebé se pode pôr de pé
  function topoBoi(e) {
    return [{ x0: e.x - 150, x1: e.x + 130, y: e.y - 236 }, { x0: e.x + 130, x1: e.x + 152, y: e.y - 192 }, { x0: e.x + 150, x1: e.x + 260, y: e.y - 276 }];
  }

  /* ---------- sair da nave e voltar a entrar ---------- */
  function sairDaNave() {
    fase = 'voa';
    pe = { x: s.wx - 40, y: chaoY(), vy: 0, dir: 1, walk: 0, noChao: true, sobre: null };
    s.y = chaoY() - 34; s.vy = 0; s.tilt = 0;
    botaoFogo(true);
    G.audio.sfx('door');
    fala('O bebé saiu da nave!');
  }
  function entrarNaNave(semSom) {
    if (!pe) return;
    pe = null;
    s.sx = clamp(s.wx - camX, 80, vw() * 0.62); s.vy = -260; s.inv = Math.max(s.inv, 1);
    botaoFogo(false);
    if (!semSom) G.audio.sfx('door');
  }
  // a bolinha da Força que o bebé atira a pé
  function bolinha() {
    const o = { x: pe.x + pe.dir * 22, y: pe.y - 46 };
    let melhor = null, md = 1e9;
    for (const e of ents) {
      if (!atacavel(e)) continue;
      const b = caixa(e), dx = (b.x - o.x) * pe.dir, dy = b.y - o.y;
      if (dx < -10 || dx > 560) continue;
      const d = dx + Math.abs(dy) * 1.2;
      if (d < md) { md = d; melhor = b; }
    }
    let a = melhor ? Math.atan2(melhor.y - o.y, (melhor.x - o.x) * pe.dir) : 0;
    a = clamp(a, -1.1, 0.5);
    tiros.push({ x: o.x, y: o.y, vx: Math.cos(a) * 760 * pe.dir, vy: Math.sin(a) * 760, t: 0, verde: true });
    s.forcaT = Math.max(s.forcaT, 0.25);
    G.audio.sfx('teia');
  }

  /* ---------- aparecer coisas ---------- */
  function escolheTipo() {
    const mix = T().mix;
    let r = Math.random(), tipo = mix[0][0];
    for (const m of mix) { if (r < m[1]) { tipo = m[0]; break; } r -= m[1]; }
    // nunca mais de 4 naves más ao mesmo tempo
    if (tipo === 'nave' && ents.filter(function (e) { return e.tipo === 'nave' && e.estado === 'mau'; }).length >= 4) {
      tipo = mix.length > 1 && mix[0][0] !== 'nave' ? mix[0][0] : (T().id === 'espaco' ? 'asteroide' : 'soldado');
    }
    return tipo;
  }

  function spawn(tipo, x) {
    const chao = chaoY(), r = ronda - 1;
    const e = { tipo: tipo, x: x, y: chao, vx: 0, vy: 0, t: Math.random() * 9, estado: 'mau', pisca: 0, flutua: 0,
      cd: rnd(1.2, 2.6), f: Math.random() * 9, noChao: true, hp: 1 };
    if (tipo === 'nave') { e.y0 = rnd(tetoY() - 10, Math.max(tetoY(), chao - 170)); e.y = e.y0; e.hp = 3 + (r > 0 ? 1 : 0); e.rel = rnd(95, 135); e.noChao = false; e.cor = ['#ef233c', '#ff9f1c', '#9d4edd'][Math.floor(Math.random() * 3)]; }
    else if (tipo === 'touro') { e.hp = 3 + (r > 0 ? 1 : 0); e.vx = -rnd(170, 220); }
    else if (tipo === 'soldado') { e.hp = 2 + (r > 0 ? 1 : 0); e.vx = -rnd(25, 45); e.cd = rnd(1.2, 2.2); e.lego = T().id === 'lego'; }
    else if (tipo === 'monstro') { e.hp = 4 + (r > 0 ? 1 : 0); e.cd = rnd(1.2, 2.4); e.cor = ['#9d4edd', '#2a9d8f', '#ef476f'][Math.floor(Math.random() * 3)]; }
    else if (tipo === 'mumia') { e.hp = 3 + (r > 0 ? 1 : 0); e.vx = -rnd(80, 110); }
    else if (tipo === 'cobra') { e.hp = 2 + (r > 0 ? 1 : 0); e.cd = rnd(0.6, 1.6); }
    else if (tipo === 'pessoa') {
      e.estado = 'amigo';
      e.cor = ['#f4a261', '#e9c46a', '#2a9d8f', '#90be6d', '#f28482', '#bde0fe', '#cdb4db'][Math.floor(Math.random() * 7)];
      e.pele = ['#ffd9b3', '#f1c27d', '#c68642', '#8d5524'][Math.floor(Math.random() * 4)];
      e.cabelo = ['#3b2a20', '#000000', '#e9c46a', '#b5651d'][Math.floor(Math.random() * 4)];
      e.crianca = Math.random() < 0.35;
    }
    else if (tipo === 'asteroide') {
      e.r = rnd(30, 52); e.hp = e.r > 42 ? 4 : 3; e.y = rnd(tetoY(), chao - 40); e.noChao = false;
      e.vy = rnd(-25, 25); e.rot = Math.random() * TAU; e.vr = rnd(-1.2, 1.2);
      e.forma = []; for (let k = 0; k < 9; k++) e.forma.push(0.78 + Math.random() * 0.3);
    }
    else if (tipo === 'boi') {
      e.estado = 'amigo'; e.hp = 99; e.vx = 45; e.cor = ['#a0522d', '#6d4c41', '#c1121f', '#1d3557'][Math.floor(Math.random() * 4)];
      e.passo = 0;
    }
    e.hpMax = e.hp;
    ents.push(e);
    return e;
  }

  function linhaEstrelas(x) {
    const chao = chaoY();
    const y = rnd(tetoY() + 40, chao - 60), n = 5, arco = Math.random() < 0.5;
    for (let k = 0; k < n; k++) {
      pickups.push({ tipo: 'estrela', x: x + k * 60, y: y - (arco ? Math.sin((k / (n - 1)) * Math.PI) * 70 : 0), t: Math.random() * 9 });
    }
    if (s.coracoes < MAXC - 0.4 && Math.random() < 0.25) pickups.push({ tipo: 'coracao', x: x + n * 60 + 80, y: rnd(tetoY() + 20, chao - 70), t: 0 });
  }

  /* ---------- efeitos ---------- */
  function faiscas(x, y, n, cor) {
    for (let i = 0; i < n; i++) parts.push({ k: 'f', x: x, y: y, vx: rnd(-260, 260), vy: rnd(-260, 160), t: 0, life: rnd(0.3, 0.6), cor: cor || '#ffd166', g: 400 });
  }
  function pecinhas(x, y, n) {
    const cores = ['#ef233c', '#ffd60a', '#3a86ff', '#8ac926', '#ffffff', '#8d99ae'];
    for (let i = 0; i < n; i++) parts.push({ k: 'q', x: x + rnd(-30, 30), y: y + rnd(-14, 14), vx: rnd(-220, 220), vy: rnd(-420, -120), t: 0, life: rnd(1, 1.6), cor: cores[i % cores.length], g: 1200, rot: Math.random() * TAU });
  }
  function coracoesSobem(x, y, n) {
    for (let i = 0; i < n; i++) parts.push({ k: 'c', x: x + rnd(-24, 24), y: y, vx: rnd(-20, 20), vy: rnd(-90, -50), t: -i * 0.2, life: 1.4, cor: '#ff5d8f', g: 0 });
  }
  function texto(txt, x, y, cor) { textos.push({ txt: txt, x: x, y: y, t: 0, cor: cor || '#ffd60a' }); }
  function estrelas(n, x, y) { G.addStars(n); texto('+' + n + '⭐', x, y); }

  /* ---------- caixas de acerto ---------- */
  function caixa(e) {
    switch (e.tipo) {
      case 'nave': return { x: e.x, y: e.y, rx: 50, ry: 26 };
      case 'touro': return { x: e.x, y: e.y - 48, rx: 64, ry: 40 };
      case 'soldado': return { x: e.x, y: e.y - 40, rx: 26, ry: 44 };
      case 'monstro': return { x: e.x, y: e.y - 70, rx: 62, ry: 72 };
      case 'mumia': return { x: e.x, y: e.y - 46, rx: 26, ry: 50 };
      case 'cobra': return { x: e.x, y: e.y - 20, rx: 46, ry: 24 };
      case 'asteroide': return { x: e.x, y: e.y, rx: e.r, ry: e.r };
      case 'navemae': return { x: e.x, y: e.y, rx: 175, ry: 72 };
    }
    return null;
  }
  function toca(b, x, y, mx, my) {
    const dx = (x - b.x) / (b.rx + mx), dy = (y - b.y) / (b.ry + my);
    return dx * dx + dy * dy < 1;
  }
  function atacavel(e) { return e.estado === 'mau' && caixa(e) !== null; }

  /* ---------- acertar nos maus ---------- */
  function acerta(e, dano) {
    if (!atacavel(e)) return;
    e.hp -= dano; e.pisca = 0.16;
    const b = caixa(e);
    faiscas(b.x, b.y, 5, '#7bdff2');
    if (e.hp <= 0) converte(e);
    else G.audio.sfx('pop');
  }

  function converte(e) {
    const b = caixa(e);
    switch (e.tipo) {
      case 'nave':
        e.estado = 'fora';
        pecinhas(e.x, e.y, 12);
        ents.push({ tipo: 'piloto', estado: 'amigo', x: e.x, y: e.y - 10, vy: 0, t: 0, noChao: false, f: Math.random() * 9 });
        G.audio.sfx('desmonta'); estrelas(2, e.x, e.y - 40);
        break;
      case 'touro':
        e.estado = 'calmo'; e.vx = 0; coracoesSobem(e.x, e.y - 90, 3);
        G.audio.sfx('giggle'); estrelas(1, e.x, e.y - 110);
        break;
      case 'soldado':
        e.estado = 'bom'; e.vx = 0; G.audio.sfx('pop'); estrelas(1, e.x, e.y - 100);
        break;
      case 'monstro':
        e.estado = 'bom'; coracoesSobem(e.x, e.y - 150, 3); G.audio.sfx('giggle'); estrelas(2, e.x, e.y - 160);
        break;
      case 'mumia':
        e.estado = 'bom'; e.vx = 0;
        for (let i = 0; i < 8; i++) parts.push({ k: 'l', x: e.x + rnd(-16, 16), y: e.y - rnd(20, 90), vx: rnd(-160, 160), vy: rnd(-300, -100), t: 0, life: 1.3, cor: '#f1e3c6', g: 700, rot: Math.random() * TAU });
        G.audio.sfx('whee'); estrelas(2, e.x, e.y - 110);
        break;
      case 'cobra':
        e.estado = 'bom'; G.audio.sfx('giggle'); estrelas(1, e.x, e.y - 70);
        break;
      case 'asteroide':
        e.estado = 'fora';
        for (let k = 0; k < 3; k++) pickups.push({ tipo: 'estrela', x: e.x + rnd(-40, 40), y: e.y + rnd(-40, 40), t: 0 });
        pecinhas(e.x, e.y, 6); G.audio.sfx('quebra');
        break;
      case 'navemae':
        e.estado = 'bom'; boss = e;
        for (let i = 0; i < 40; i++) parts.push({ k: 'q', x: e.x + rnd(-150, 150), y: e.y + rnd(-60, 40), vx: rnd(-300, 300), vy: rnd(-500, -100), t: 0, life: rnd(1.4, 2.2), cor: ['#ffd60a', '#ff5d8f', '#7bdff2', '#8ac926'][i % 4], g: 600, rot: Math.random() * TAU });
        G.audio.sfx('tada'); estrelas(10, e.x, e.y - 100);
        G.banner('A nave-mãe ficou amiga! 🎉', 2600);
        fala('Boa! A nave-mãe ficou nossa amiga!');
        break;
    }
    if (b) faiscas(b.x, b.y, 10, '#ffd60a');
  }

  /* ---------- tiros ---------- */
  function origemTiro() {
    if (boi) return { x: boi.x + 232, y: boi.y - 190 };
    return { x: s.wx + 70, y: s.y - 18 };
  }
  function alvoMaisPerto(o, alcance) {
    let melhor = null, md = 1e9;
    for (const e of ents) {
      if (!atacavel(e)) continue;
      const b = caixa(e), dx = b.x - o.x, dy = b.y - o.y;
      if (dx < -10 || dx > alcance) continue;
      const d = dx + Math.abs(dy) * 1.4;
      if (d < md) { md = d; melhor = b; }
    }
    return melhor;
  }
  function dispara(sozinho) {
    const o = origemTiro(), W = vw();
    const b = alvoMaisPerto(o, W * (pe ? 0.5 : 0.62));
    if (sozinho && !b) return false;
    let a = b ? Math.atan2(b.y - o.y, b.x - o.x) : s.tilt * 0.6;
    a = clamp(a, -0.6, 0.6);
    tiros.push({ x: o.x, y: o.y, vx: Math.cos(a) * 980 + vel, vy: Math.sin(a) * 980, t: 0 });
    s.tiroT = 0.12;
    G.audio.sfx(sozinho ? 'zap' : 'pew');
    return true;
  }
  function tiroMau(x, y, tipo) {
    const q = eu(), alvoX = q.x, alvoY = q.y;
    const sp = (tipo === 'gosma' ? 400 : 340) + (ronda - 1) * 30;
    let a = Math.atan2(alvoY - y, alvoX - x) + rnd(-0.12, 0.12);
    if (tipo === 'gosma') a -= 0.35;   // a gosma vai em arco
    tirosM.push({ x: x, y: y, vx: Math.cos(a) * sp + vel, vy: Math.sin(a) * sp, tipo: tipo, t: 0 });
  }

  /* ---------- magoar a nave (nunca há derrota) ---------- */
  function magoa(x, y) {
    if (s.inv > 0 || fase !== 'voa' || boi) return false;
    s.coracoes = Math.max(0, s.coracoes - 0.5);
    s.inv = 1.4; s.flash = 0.4; G.shake = 0.35;
    faiscas(x, y, 8, '#ff6b6b');
    G.audio.sfx('ouch');
    if (s.coracoes <= 0) {
      entrarNaNave(true);
      fase = 'oficina'; faseT = 0;
      G.banner('Vamos arranjar a nave! 🔧', 2400);
      fala('Oh! O amigo vai arranjar a nave!');
    }
    return true;
  }

  /* ---------- a Força do bebé ---------- */
  function forca() {
    s.forcaCd = 9; s.forcaT = 1.4; forcaFx = 1;
    for (const m of tirosM) faiscas(m.x, m.y, 3, '#9ef01a');
    tirosM.length = 0;
    const W = vw();
    for (const e of ents) {
      if (!atacavel(e)) continue;
      const sx = e.x - camX;
      if (sx < -60 || sx > W + 60) continue;
      e.flutua = 1.5;
      acerta(e, e.tipo === 'navemae' ? 3 : 1);
    }
    G.audio.sfx(boi ? 'roar' : 'whee');
    fala(boi ? 'Muuu!' : 'Força!');
  }

  /* ---------- o boi de Lego ---------- */
  function portaDoBoi(e) { return { x: e.x - 30, y: e.y - 150 }; }
  function entra(e) {
    boi = e; e.montado = true; e.vy = 0;
    s.inv = 0.5;
    mostraPorta(true);
    G.audio.sfx('door');
    G.banner('Dentro do boi de Lego! 🧱🐂', 2200);
    fala('Estamos dentro do boi de Lego!');
  }
  function sai() {
    if (!boi) return;
    const e = boi;
    e.montado = false; boi = null;
    s.sx = clamp(e.x - camX + 40, 90, vw() * 0.6);
    s.y = Math.max(80, e.y - 290); s.vy = -120; s.inv = 1.4;
    e.saiuT = 2.5;       // não voltar a entrar logo a seguir
    mostraPorta(false);
    G.audio.sfx('door');
  }
  function pisao(e) {
    G.shake = 0.5; G.audio.sfx('smash');
    for (let i = 0; i < 10; i++) parts.push({ k: 'p', x: e.x + rnd(-200, 200), y: e.y - 6, vx: rnd(-80, 80), vy: rnd(-90, -30), t: 0, life: 0.7, cor: '#ffffff', g: 0, r: rnd(12, 24) });
    for (const o of ents) {
      if (!atacavel(o) || !o.noChao) continue;
      if (Math.abs(o.x - e.x) < 320) { o.hp = 0; converte(o); }
    }
  }

  /* ---------- saltar para outra terra ---------- */
  function hiper(i) {
    if (fase === 'hiper') return;
    if (boi) sai();
    entrarNaNave(true);
    destino = i; fase = 'hiper'; faseT = 0;
    mostraPorta(false);
    G.audio.sfx('whoosh');
    fala('Hiperespaço!');
  }

  /* ---------- update ---------- */
  S.update = function (dt) {
    tempo += dt;
    const I = G.input, eixo = I.axis(), ax = eixo.x, ay = eixo.y, W = vw(), chao = chaoY();
    forcaFx = Math.max(0, forcaFx - dt);
    s.forcaCd = Math.max(0, s.forcaCd - dt); s.forcaT = Math.max(0, s.forcaT - dt);
    mostraForca(s.forcaCd <= 0);
    updateParts(dt);

    if (fase === 'hiper') {
      faseT += dt;
      s.y += (vh() * 0.45 - s.y) * Math.min(1, dt * 3);
      if (faseT > 1.6) comecaTerra(destino);
      return;
    }

    // tocar no desenho de uma terra (no canto) salta para lá
    if (I.tap) {
      for (const h of hudTerras) {
        const dx = I.tap.x - h.x, dy = I.tap.y - h.y;
        if (dx * dx + dy * dy < (h.r + 6) * (h.r + 6) && h.i !== terra) { hiper(h.i); return; }
      }
    }

    s.inv = Math.max(0, s.inv - dt); s.flash = Math.max(0, s.flash - dt);
    s.cdTiro -= dt; s.cdAmigo -= dt; s.tiroT = Math.max(0, s.tiroT - dt);

    if (fase === 'oficina') {
      faseT += dt;
      vel = Math.max(0, vel - 300 * dt);
      camX += vel * dt;
      s.vy = 0; s.y += (chao - 36 - s.y) * Math.min(1, dt * 3);
      s.wx = camX + s.sx; s.tilt *= 0.9;
      if (faseT > 1 && Math.floor(faseT * 4) !== Math.floor((faseT - dt) * 4)) { faiscas(s.wx + 10, s.y - 10, 4, '#ffd166'); G.audio.sfx('clic'); }
      if (faseT > OFICINA) {
        fase = 'voa'; s.coracoes = MAXC; s.inv = 2;
        G.audio.sfx('suit'); G.banner('A nave está arranjada! 🔧✨', 2000);
      }
    } else if (fase === 'pousa') {
      // a nave pousa e o bebé sai cá para fora
      vel = Math.max(0, vel - 520 * dt); camX += vel * dt;
      s.y += Math.min(460 * dt, chao - 34 - s.y); s.wx = camX + s.sx; s.tilt *= 0.85;
      if (s.y >= chao - 35 && vel < 1) sairDaNave();
    } else if (boi) {
      // dentro do boi: ele anda com as setas, salta com ⬆ e faz pisão ao cair
      const passo = Math.max(30, 140 + ax * 120);
      vel = passo;
      boi.x += passo * dt; boi.passo += passo * dt;
      boi.vy += GRAV * dt; boi.y += boi.vy * dt;
      if (boi.y >= chao) {
        if (boi.vy > 520) pisao(boi);
        boi.y = chao; boi.vy = 0; boi.noChao = true;
      }
      if (I.justPressed('jump') && boi.noChao) { boi.vy = -880; boi.noChao = false; G.audio.sfx('hop'); }
      camX += ((boi.x - W * 0.3) - camX) * Math.min(1, dt * 4);
      s.wx = boi.x; s.y = boi.y - 150; s.vy = 0; s.tilt = 0;
      if (I.justPressed('door')) sai();
    } else if (pe) {
      // o bebé a pé: só ele anda; o amigo fica na nave
      vel = 0;
      // em cima de um boi de Lego o bebé vai montado: as setas mandam o BOI andar
      const cavalga = pe.sobre && !pe.sobre.montado ? pe.sobre : null;
      const v = cavalga ? 0 : ax * 250;
      if (Math.abs(ax) > 0.1) pe.dir = ax > 0 ? 1 : -1;
      if (cavalga) {
        cavalga.vx = Math.abs(ax) > 0.1 ? ax * 190 : 0;
        cavalga.cavalgaT = 0.15;
        if (!cavalga.jaMontou) { cavalga.jaMontou = true; G.banner('Em cima do boi! ◀ ▶ para ele andar 🐂', 2400); }
      }
      pe.x += v * dt; pe.walk += Math.abs(v) * dt;
      if (cavalga) pe.x += cavalga.vx * dt;   // vai com o boi
      pe.x = Math.max(30, pe.x);
      if (I.justPressed('jump') && pe.noChao) { pe.vy = -1010; pe.noChao = false; G.audio.sfx('hop'); }
      pe.vy += GRAV * dt;
      const yAnt = pe.y;
      pe.y += pe.vy * dt;
      pe.noChao = false; pe.sobre = null;
      if (pe.vy >= 0) {
        for (const e of ents) {
          if (e.tipo !== 'boi' || e.montado) continue;
          for (const pl of topoBoi(e)) {
            if (pe.x > pl.x0 && pe.x < pl.x1 && yAnt <= pl.y + 4 && pe.y >= pl.y) {
              pe.y = pl.y; pe.vy = 0; pe.noChao = true; pe.sobre = e;
              if (!e.visitado) { e.visitado = true; estrelas(2, pe.x, pe.y - 90); G.audio.sfx('tada'); fala('Em cima do boi!'); }
            }
          }
        }
      }
      if (pe.y >= chao) { pe.y = chao; pe.vy = 0; pe.noChao = true; }
      camX += (Math.max(0, pe.x - W * 0.4) - camX) * Math.min(1, dt * 4);
      // a nave vem atrás do bebé, baixinho, e pousa quando ele pára
      // (quando arranca, só pára mesmo ao pé dele, para a porta ficar sempre perto)
      const alvoN = pe.x - 130 * pe.dir, dist = Math.abs(s.wx - alvoN);
      if (dist > (Math.abs(ax) > 0.1 ? 150 : 30)) pe.naveVem = true; else if (dist < 12) pe.naveVem = false;
      if (pe.naveVem) s.wx += clamp(alvoN - s.wx, -300 * dt, 300 * dt);
      s.y += ((pe.naveVem ? chao - 90 : chao - 34) - s.y) * Math.min(1, dt * 3);
      s.tilt *= 0.9;
      if (I.justPressed('door') && pertoDaNave()) entrarNaNave();
    } else {
      const parado = boss && boss.estado === 'mau' && camX >= boss.trava;
      vel = parado ? 0 : 200 + Math.max(0, ax) * 150 - Math.max(0, -ax) * 110;
      camX += vel * dt;
      s.sx = clamp(s.sx + ax * 220 * dt, 80, W * 0.62);
      const sobe = I.isHeld('jump') || ay < -0.3;
      const alvo = sobe ? -380 : (ay > 0.3 ? 380 : 135);
      s.vy += (alvo - s.vy) * Math.min(1, dt * 5);
      s.y += s.vy * dt;
      const topo = tetoY();
      if (s.y < topo) { s.y = topo; s.vy = Math.max(0, s.vy); }
      if (s.y > chao - 34) { s.y = chao - 34; s.vy = Math.min(0, s.vy); }
      s.wx = camX + s.sx;
      s.tilt += (clamp(s.vy / 900, -0.3, 0.3) - s.tilt) * Math.min(1, dt * 6);
      // 🚪 com a nave no ar: pousa e o bebé sai (no espaço não há chão)
      if (I.justPressed('door') && fase === 'voa' && T().id !== 'espaco') { fase = 'pousa'; G.audio.sfx('whoosh'); }
    }
    mostraPorta(!!boi || (fase === 'voa' && !pe && T().id !== 'espaco') || pertoDaNave());

    // disparar: o amigo das pistolas (segurar dispara sempre) e às vezes sozinho
    if (fase !== 'oficina') {
      if (I.isHeld('fire') && s.cdTiro <= 0) {
        if (pe) { bolinha(); s.cdTiro = 0.34; } else if (fase !== 'pousa') { dispara(false); s.cdTiro = 0.3; }
      }
      if (s.cdAmigo <= 0) s.cdAmigo = dispara(true) ? 2.6 : 0.5;
      if (I.justPressed('horn') && s.forcaCd <= 0) forca();
    }

    // aparecer maus, estrelas e a nave-mãe
    while (prox < camX + W + 260 && prox < LEN - 500) {
      spawn(escolheTipo(), prox);
      prox += rnd(T().gap[0], T().gap[1]) * Math.max(0.7, 1 - (ronda - 1) * 0.1);
      if (T().id === 'lego' && Math.random() < 0.28 && ents.filter(function (e) { return e.tipo === 'boi'; }).length < 2) spawn('boi', prox + 300);
    }
    while (proxPick < camX + W + 200 && proxPick < LEN - 400) {
      linhaEstrelas(proxPick);
      proxPick += rnd(650, 1050);
    }
    if (T().id === 'espaco' && !boss && camX > LEN - 1700) {
      boss = spawn('navemae', camX + W + 260);
      boss.y = vh() * 0.36; boss.noChao = false; boss.hp = boss.hpMax = 34 + (ronda - 1) * 8; boss.cd = 1.6;
      boss.trava = camX + 120;
      G.banner('A nave-mãe! 🛸', 2000); fala('Olha a nave-mãe dos mauzões!');
    }

    updateEnts(dt, W, chao);
    updateTiros(dt, W, chao);
    updatePickups(dt);

    // o portal no fim da terra (no espaço, só depois da nave-mãe ficar amiga)
    const podePortal = T().id !== 'espaco' || (boss && boss.estado !== 'mau');
    const xNos = boi ? boi.x : (pe ? pe.x : s.wx);
    if (podePortal && xNos > LEN) {
      if (terra === TERRAS.length - 1) ronda++;
      hiper((terra + 1) % TERRAS.length);
      G.addStars(3);
    }
    if (I.justPressed('debug9')) magoa(s.wx, s.y);
  };

  function updateEnts(dt, W, chao) {
    for (let i = ents.length - 1; i >= 0; i--) {
      const e = ents[i];
      e.t += dt; e.pisca = Math.max(0, e.pisca - dt); e.flutua = Math.max(0, e.flutua - dt);
      if (e.saiuT) e.saiuT = Math.max(0, e.saiuT - dt);
      const sx = e.x - camX;
      if (e.estado === 'fora' || (sx < -500 && !e.montado) || (e.tipo === 'navemae' && e.estado === 'bom' && e.y < -300)) { ents.splice(i, 1); continue; }
      const mau = e.estado === 'mau', voando = e.flutua > 0;

      if (e.noChao && e.tipo !== 'boi') {
        e.vy += GRAV * dt; e.y += e.vy * dt;
        if (e.y >= chao) { e.y = chao; e.vy = 0; }
      }

      switch (e.tipo) {
        case 'nave':
          if (voando) break;
          e.x += (vel - e.rel) * dt;
          e.y = e.y0 + Math.sin(e.t * 1.5 + e.f) * 42;
          if (e.y > chao - 120) e.y0 -= 60 * dt;
          e.cd -= dt;
          if (e.cd <= 0 && sx > W * 0.3 && sx < W - 30) {
            tiroMau(e.x - 44, e.y + 6, 'laser'); G.audio.sfx('repulsor');
            e.cd = rnd(1.2, 2.2) / (1 + (ronda - 1) * 0.2);
          }
          break;
        case 'piloto':
          if (e.y < chao) { e.vy = 70; e.y += e.vy * dt; e.x += Math.sin(e.t * 1.6) * 30 * dt; }
          else e.y = chao;
          break;
        case 'touro':
          if (!mau || voando) break;
          e.x += e.vx * dt;
          // salta à nave quando ela vai baixinho
          { const q = eu(); if (e.y >= chao && Math.abs(q.x - e.x) < 330 && q.y > chao - 330 && e.x > q.x - 40) { e.vy = -rnd(760, 900); G.audio.sfx('hop'); } }
          break;
        case 'soldado':
          if (!mau || voando) break;
          e.x += e.vx * dt;
          e.cd -= dt;
          if (e.cd <= 0 && sx > W * 0.25 && sx < W - 20) {
            tiroMau(e.x, e.y - 70, 'laser'); G.audio.sfx('pew');
            e.cd = rnd(1.5, 2.5) / (1 + (ronda - 1) * 0.2);
          }
          break;
        case 'monstro':
          if (!mau || voando) break;
          if (e.y >= chao && Math.sin(e.t * 3 + e.f) > 0.97) e.vy = -380;
          e.cd -= dt;
          if (e.cd <= 0 && sx > W * 0.3 && sx < W - 20) {
            tiroMau(e.x - 30, e.y - 130, 'gosma'); G.audio.sfx('gulp');
            e.cd = rnd(1.6, 2.6) / (1 + (ronda - 1) * 0.2);
          }
          break;
        case 'mumia':
          if (!mau || voando) break;
          e.x += e.vx * dt;
          break;
        case 'cobra':
          if (!mau || voando) break;
          e.cd -= dt;
          if (e.cd <= 0 && e.y >= chao && sx < W) { e.vy = -rnd(820, 1120); e.cd = rnd(1.1, 2); G.audio.sfx('hop'); }
          break;
        case 'pessoa':
          if (!e.hi && Math.abs(eu().x - e.x) < 80 && eu().y > chao - 170 && !boi) {
            e.hi = true; e.vy = -420; estrelas(1, e.x, e.y - 120); texto('🙌', e.x, e.y - 160); G.audio.sfx('pop');
          }
          break;
        case 'asteroide':
          if (voando) { e.rot += dt * 6; break; }
          e.x += (-70) * dt; e.y += e.vy * dt; e.rot += e.vr * dt;
          if ((e.y < tetoY() - 20 && e.vy < 0) || (e.y > chao - 30 && e.vy > 0)) e.vy = -e.vy;
          break;
        case 'boi':
          if (e.montado) break;
          // sem o bebé em cima, o boi volta a passear sozinho
          if (e.cavalgaT > 0) e.cavalgaT -= dt; else e.vx = 45;
          e.x += e.vx * dt; e.passo += e.vx * dt;
          if (e.cavalgaT > 0 && e.vx !== 0) {
            // montado pelo bebé, o boi empurra os maus do chão e eles ficam amigos
            for (const o of ents) if (atacavel(o) && o.noChao && Math.abs(o.x - (e.x + Math.sign(e.vx) * 200)) < 70) { o.hp = 0; converte(o); }
          }
          e.vy += GRAV * dt; e.y += e.vy * dt;
          if (e.y >= chao) { e.y = chao; e.vy = 0; e.noChao = true; }
          // voar para a porta do boi = entrar
          if (fase === 'voa' && !boi && !pe && !e.saiuT) {
            const p = portaDoBoi(e);
            if (Math.abs(s.wx + 40 - p.x) < 95 && Math.abs(s.y - p.y) < 85) entra(e);
          }
          break;
        case 'navemae':
          if (e.estado === 'bom') { e.y -= 90 * dt; e.x += vel * dt; break; }
          e.x += ((camX + W * 0.74) - e.x) * Math.min(1, dt * 1.2);
          e.y = vh() * 0.36 + Math.sin(e.t * 0.9) * 50;
          e.cd -= dt;
          if (e.cd <= 0 && sx < W) {
            for (let k = -1; k <= 1; k++) {
              tiroMau(e.x - 150, e.y + 20 + k * 30, 'laser');
              tirosM[tirosM.length - 1].vy += k * 90;
            }
            G.audio.sfx('repulsor');
            e.cd = rnd(1.1, 1.6) / (1 + (ronda - 1) * 0.15);
          }
          break;
      }

      // encostar a um mau magoa a nave; dentro do boi, o boi empurra-os e ficam amigos
      if (mau && e.estado === 'mau') {
        const b = caixa(e);
        if (!b) continue;
        if (boi) {
          if (e.noChao && Math.abs(e.x - (boi.x + 60)) < 230 && e.y > boi.y - 240) { e.hp = 0; converte(e); }
        } else if (fase === 'voa' && toca(b, eu().x, eu().y, eu().mx, eu().my)) {
          if (magoa(eu().x, eu().y)) {
            if (pe) { pe.vy = -520; pe.noChao = false; pe.x += (pe.x < e.x ? -50 : 50); }
            else s.vy = -320;
            if (e.tipo === 'touro') e.vx = -60;
            if (e.tipo === 'asteroide') { e.vy = -e.vy; e.x += 40; }
          }
        }
      }
    }
  }

  function updateTiros(dt, W, chao) {
    for (let i = tiros.length - 1; i >= 0; i--) {
      const m = tiros[i];
      m.t += dt; m.x += m.vx * dt; m.y += m.vy * dt;
      const sx = m.x - camX;
      if (sx > W + 60 || sx < -60 || m.y < -40 || m.y > chao + 10 || m.t > 2 || (m.verde && m.t > 0.6)) { tiros.splice(i, 1); continue; }
      for (const e of ents) {
        if (!atacavel(e)) continue;
        if (toca(caixa(e), m.x, m.y, 8, 8)) { acerta(e, 1); tiros.splice(i, 1); break; }
      }
    }
    for (let i = tirosM.length - 1; i >= 0; i--) {
      const m = tirosM[i];
      m.t += dt; m.x += m.vx * dt; m.y += m.vy * dt;
      if (m.tipo === 'gosma') m.vy += 520 * dt;
      const sx = m.x - camX;
      if (sx < -80 || sx > W + 120 || m.y < -60 || m.y > chao + 4 || m.t > 6) {
        if (m.y > chao) faiscas(m.x, chao, 3, m.tipo === 'gosma' ? '#80ed99' : '#ff6b6b');
        tirosM.splice(i, 1); continue;
      }
      if (boi) {
        // dentro do boi nada nos apanha: os tiros fazem "boing" no Lego
        if (m.x > boi.x - 180 && m.x < boi.x + 260 && m.y > boi.y - 250 && m.y < boi.y) {
          faiscas(m.x, m.y, 4, '#ffd60a'); tirosM.splice(i, 1);
          if (Math.random() < 0.5) G.audio.sfx('boing');
        }
        continue;
      }
      const q = eu(), dx = (m.x - q.x) / (q.mx + 18), dy = (m.y - (q.y - 6)) / (q.my + 10);
      if (dx * dx + dy * dy < 1 && fase === 'voa') {
        tirosM.splice(i, 1);
        magoa(m.x, m.y);
      }
    }
  }

  function updatePickups(dt) {
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      p.t += dt;
      if (p.x - camX < -100) { pickups.splice(i, 1); continue; }
      let apanha;
      if (boi) apanha = p.x > boi.x - 200 && p.x < boi.x + 280 && p.y > boi.y - 280;
      else { const q = eu(), dx = p.x - q.x, dy = p.y - q.y; apanha = dx * dx + dy * dy < (pe ? 48 * 48 : 58 * 58); }
      if (!apanha || fase === 'oficina') continue;
      pickups.splice(i, 1);
      if (p.tipo === 'estrela') { G.addStars(1); G.audio.sfx('star'); faiscas(p.x, p.y, 4, '#ffd166'); }
      else { s.coracoes = Math.min(MAXC, s.coracoes + 1); G.audio.sfx('heart'); coracoesSobem(p.x, p.y, 2); }
    }
  }

  function updateParts(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt;
      if (p.t >= p.life) { parts.splice(i, 1); continue; }
      if (p.t < 0) continue;
      p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.rot !== undefined) p.rot += dt * 6;
    }
    for (let i = textos.length - 1; i >= 0; i--) {
      textos[i].t += dt;
      if (textos[i].t > 1.2) textos.splice(i, 1);
    }
  }

  /* =================================================================
     DESENHOS
     ================================================================= */

  // o bebé verde de orelhas grandes, com a capinha castanha
  function bebe(c, x, y, k, t, mao) {
    c.save(); c.translate(x, y); c.scale(k, k);
    c.fillStyle = '#c9a47e';
    G.gfx.rr(c, -11, 4, 22, 20, 8); c.fill();
    c.fillStyle = '#a98258'; c.fillRect(-11, 10, 22, 3);
    // orelhas compridas para os lados
    c.fillStyle = '#8fbf6f';
    c.beginPath(); c.moveTo(-8, -6); c.quadraticCurveTo(-26, -14, -31, -6); c.quadraticCurveTo(-20, 0, -8, 2); c.fill();
    c.beginPath(); c.moveTo(8, -6); c.quadraticCurveTo(26, -14, 31, -6); c.quadraticCurveTo(20, 0, 8, 2); c.fill();
    c.fillStyle = '#e8a6a6';
    c.beginPath(); c.moveTo(-10, -5); c.quadraticCurveTo(-22, -10, -27, -6); c.quadraticCurveTo(-18, -2, -10, 0); c.fill();
    c.beginPath(); c.moveTo(10, -5); c.quadraticCurveTo(22, -10, 27, -6); c.quadraticCurveTo(18, -2, 10, 0); c.fill();
    c.fillStyle = '#9fd17f';
    c.beginPath(); c.ellipse(0, -4, 11, 10, 0, 0, TAU); c.fill();
    // olhos grandes e brilhantes
    c.fillStyle = '#1a1a1a';
    c.beginPath(); c.ellipse(-4.5, -5, 3.2, 3.8, 0, 0, TAU); c.ellipse(4.5, -5, 3.2, 3.8, 0, 0, TAU); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(-3.6, -6.4, 1.2, 0, TAU); c.arc(5.4, -6.4, 1.2, 0, TAU); c.fill();
    c.strokeStyle = '#4f7a3a'; c.lineWidth = 1.2;
    c.beginPath(); c.arc(0, 0, 2.5, 0.2, Math.PI - 0.2); c.stroke();
    if (mao) {
      // a mãozinha no ar, a fazer a Força
      c.save(); c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 14);
      c.fillStyle = '#9ef01a'; c.beginPath(); c.arc(14, -20, 9, 0, TAU); c.fill();
      c.restore();
      c.strokeStyle = '#c9a47e'; c.lineWidth = 5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(8, 8); c.lineTo(14, -16); c.stroke();
      c.fillStyle = '#9fd17f'; c.beginPath(); c.arc(14, -18, 4, 0, TAU); c.fill();
    }
    c.restore();
  }

  // o amigo de capacete prateado, com a pistola
  function amigo(c, x, y, k, t, tiro) {
    c.save(); c.translate(x, y); c.scale(k, k);
    c.fillStyle = '#6c757d'; G.gfx.rr(c, -12, 6, 24, 20, 6); c.fill();
    c.fillStyle = '#495057'; c.fillRect(-12, 12, 24, 4);
    c.fillStyle = '#ced4da';
    c.beginPath(); c.arc(0, -4, 12, Math.PI, 0); c.lineTo(12, 8); c.lineTo(-12, 8); c.closePath(); c.fill();
    c.fillStyle = '#212529'; G.gfx.rr(c, -2, -6, 15, 4.5, 2); c.fill();
    c.fillRect(6, -6, 4, 12);
    c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(-5, -10, 3, 0, TAU); c.fill();
    // braço com a pistola apontada para a frente
    c.strokeStyle = '#6c757d'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(6, 12); c.lineTo(22, 8); c.stroke();
    c.fillStyle = '#343a40'; c.fillRect(20, 3, 13, 5); c.fillRect(21, 6, 4, 7);
    if (tiro) { c.fillStyle = '#7bdff2'; c.beginPath(); c.arc(35, 5.5, 5, 0, TAU); c.fill(); }
    c.restore();
  }

  // a nossa nave, de lado e virada para a direita
  function navePrincipal(c, t, tiro, mao, semBebe) {
    // chama do motor
    const ch = 22 + Math.sin(t * 30) * 6 + vel * 0.06;
    let g = c.createLinearGradient(-86 - ch, 0, -80, 0);
    g.addColorStop(0, 'rgba(76,201,240,0)'); g.addColorStop(1, '#bde0fe');
    c.fillStyle = g;
    c.beginPath(); c.moveTo(-82, -12); c.lineTo(-86 - ch, 0); c.lineTo(-82, 12); c.fill();
    // asas
    c.fillStyle = '#8d99ae';
    c.beginPath(); c.moveTo(-30, 12); c.lineTo(-68, 40); c.lineTo(-44, 40); c.lineTo(12, 16); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-36, -12); c.lineTo(-66, -34); c.lineTo(-48, -34); c.lineTo(-10, -14); c.closePath(); c.fill();
    // corpo
    g = c.createLinearGradient(0, -26, 0, 26);
    g.addColorStop(0, '#f1f3f5'); g.addColorStop(1, '#adb5bd');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-82, -16); c.lineTo(40, -20); c.quadraticCurveTo(96, -10, 98, 4); c.quadraticCurveTo(90, 20, 40, 22); c.lineTo(-82, 18); c.closePath();
    c.fill();
    c.strokeStyle = '#6c757d'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#f77f00'; c.fillRect(-70, 2, 120, 6);
    c.fillStyle = '#495057'; G.gfx.rr(c, -92, -14, 14, 28, 4); c.fill();
    // pistolas na frente da nave
    c.fillStyle = '#343a40'; c.fillRect(70, 12, 30, 5);
    // cúpula de vidro com o bebé e o amigo lá dentro
    if (!semBebe) bebe(c, -2, -26, 0.95, t, mao);
    amigo(c, 34, -28, 0.95, t, tiro);
    c.fillStyle = 'rgba(160,220,255,.38)';
    c.beginPath(); c.ellipse(16, -20, 46, 30, 0, Math.PI, 0); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2.5;
    c.beginPath(); c.ellipse(16, -20, 46, 30, 0, Math.PI, 0); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 3;
    c.beginPath(); c.arc(4, -26, 26, Math.PI * 1.12, Math.PI * 1.38); c.stroke();
  }

  // nave dos mauzões, virada para a esquerda, com o piloto de capacete escuro
  function naveMa(c, e, t) {
    c.save(); c.translate(e.x, e.y);
    if (e.flutua > 0) c.rotate(Math.sin(e.t * 9) * 0.5);
    c.fillStyle = '#3d405b';
    c.beginPath(); c.moveTo(-10, -6); c.lineTo(10, -30); c.lineTo(22, -30); c.lineTo(16, -6); c.fill();
    c.beginPath(); c.moveTo(-10, 6); c.lineTo(10, 30); c.lineTo(22, 30); c.lineTo(16, 6); c.fill();
    c.fillStyle = e.pisca > 0 ? '#ffffff' : '#2b2d42';
    c.beginPath(); c.ellipse(0, 0, 48, 17, 0, 0, TAU); c.fill();
    c.fillStyle = e.cor; c.fillRect(-36, 4, 64, 4);
    c.fillStyle = '#343a40'; c.fillRect(-60, 6, 22, 5);
    // piloto
    c.fillStyle = '#1b1b1b'; c.beginPath(); c.arc(-6, -14, 11, Math.PI, 0); c.fill();
    c.fillStyle = '#ef233c'; c.fillRect(-15, -17, 12, 4);
    c.fillStyle = 'rgba(255,90,90,.35)';
    c.beginPath(); c.ellipse(-6, -12, 20, 14, 0, Math.PI, 0); c.fill();
    if (Math.sin(t * 8 + e.f) > 0) { c.fillStyle = '#ff4d6d'; c.beginPath(); c.arc(40, -2, 3.5, 0, TAU); c.fill(); }
    c.restore();
    pontos(c, e.x, e.y - 40, e);
  }

  // as bolinhas por cima de um mau mostram quantos tiros faltam
  function pontos(c, x, y, e) {
    if (e.estado !== 'mau' || e.hpMax < 2) return;
    for (let k = 0; k < e.hpMax; k++) {
      c.fillStyle = k < e.hp ? '#ff6b6b' : 'rgba(255,255,255,.5)';
      c.beginPath(); c.arc(x + (k - (e.hpMax - 1) / 2) * 13, y, 5, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 1.5; c.stroke();
    }
  }

  function piloto(c, e, t) {
    c.save(); c.translate(e.x, e.y);
    const noChao = e.y >= chaoY() - 1;
    if (!noChao) {
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(-24, -76); c.lineTo(-6, -40); c.moveTo(24, -76); c.lineTo(6, -40); c.stroke();
      const cores = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4'];
      for (let k = 0; k < 4; k++) {
        c.fillStyle = cores[k];
        c.beginPath(); c.moveTo(0, -76); c.arc(0, -76, 32, Math.PI + k * Math.PI / 4, Math.PI + (k + 1) * Math.PI / 4); c.fill();
      }
    }
    c.fillStyle = '#2b2d42'; G.gfx.rr(c, -9, -38, 18, 26, 6); c.fill();
    c.strokeStyle = '#2b2d42'; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-4, -14); c.lineTo(-6, 0); c.moveTo(4, -14); c.lineTo(6, 0); c.stroke();
    // a acenar, já sem capacete e a sorrir
    const a = Math.sin(t * 8 + e.f) * 0.5;
    c.beginPath(); c.moveTo(7, -34); c.lineTo(7 + Math.cos(-1.2 + a) * 18, -34 + Math.sin(-1.2 + a) * 18); c.stroke();
    c.fillStyle = '#ffd9b3'; c.beginPath(); c.arc(0, -46, 9, 0, TAU); c.fill();
    c.strokeStyle = '#8d5524'; c.lineWidth = 1.5;
    c.beginPath(); c.arc(0, -45, 4, 0.2, Math.PI - 0.2); c.stroke();
    c.fillStyle = '#222'; c.fillRect(-4, -49, 2, 2); c.fillRect(2, -49, 2, 2);
    if (noChao) { c.fillStyle = '#1b1b1b'; c.beginPath(); c.arc(-18, -6, 7, Math.PI, 0); c.fill(); }
    c.restore();
  }

  function touro(c, e, t) {
    const calmo = e.estado !== 'mau';
    c.save(); c.translate(e.x, e.y);
    if (e.flutua > 0) { c.translate(0, -40); c.rotate(Math.sin(e.t * 8) * 0.3); }
    const pa = calmo ? 0 : Math.sin(e.t * 14) * 10;
    c.fillStyle = '#5c3d2e';
    if (calmo) {
      G.gfx.rr(c, -46, -18, 92, 18, 8); c.fill();
    } else {
      for (const lx of [-36, -20, 20, 36]) { c.save(); c.translate(lx, -24); c.rotate((lx < 0 ? 1 : -1) * pa * 0.03); c.fillRect(-5, 0, 10, 24); c.restore(); }
    }
    c.fillStyle = e.pisca > 0 ? '#ffffff' : '#7f5539';
    c.beginPath(); c.ellipse(0, calmo ? -34 : -48, 54, 30, 0, 0, TAU); c.fill();
    c.strokeStyle = '#7f5539'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(52, calmo ? -40 : -54); c.quadraticCurveTo(66, -60, 62 + Math.sin(e.t * 6) * 6, -76); c.stroke();
    const hy = calmo ? -46 : -60;
    c.fillStyle = e.pisca > 0 ? '#ffffff' : '#6b4226';
    c.beginPath(); c.ellipse(-52, hy, 24, 22, 0, 0, TAU); c.fill();
    c.fillStyle = '#f8edeb';
    c.beginPath(); c.moveTo(-62, hy - 16); c.quadraticCurveTo(-80, hy - 26, -78, hy - 42); c.quadraticCurveTo(-70, hy - 26, -56, hy - 20); c.fill();
    c.beginPath(); c.moveTo(-42, hy - 16); c.quadraticCurveTo(-26, hy - 26, -28, hy - 42); c.quadraticCurveTo(-36, hy - 26, -48, hy - 20); c.fill();
    c.fillStyle = '#e5989b'; c.beginPath(); c.ellipse(-62, hy + 8, 13, 9, 0, 0, TAU); c.fill();
    c.fillStyle = '#3d2b1f'; c.beginPath(); c.arc(-66, hy + 8, 2.5, 0, TAU); c.arc(-58, hy + 8, 2.5, 0, TAU); c.fill();
    if (calmo) {
      c.strokeStyle = '#222'; c.lineWidth = 2;
      c.beginPath(); c.arc(-60, hy - 6, 4, Math.PI, 0); c.arc(-46, hy - 6, 4, Math.PI, 0); c.stroke();
      const flores = ['#ff5d8f', '#ffd60a', '#ffffff', '#c77dff'];
      for (let k = 0; k < 5; k++) { c.fillStyle = flores[k % 4]; c.beginPath(); c.arc(-68 + k * 8, hy - 20 + Math.abs(k - 2) * 2, 4.5, 0, TAU); c.fill(); }
    } else {
      c.fillStyle = '#d00000'; c.beginPath(); c.arc(-60, hy - 5, 3.5, 0, TAU); c.arc(-46, hy - 5, 3.5, 0, TAU); c.fill();
      c.strokeStyle = '#222'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(-66, hy - 13); c.lineTo(-55, hy - 9); c.moveTo(-40, hy - 13); c.lineTo(-51, hy - 9); c.stroke();
      if (e.y >= chaoY() - 1) for (let k = 0; k < 2; k++) { c.fillStyle = 'rgba(200,180,140,.5)'; c.beginPath(); c.arc(40 + k * 18 + Math.sin(e.t * 20 + k) * 4, -6, 8, 0, TAU); c.fill(); }
    }
    c.restore();
    pontos(c, e.x - 10, e.y - 118, e);
  }

  function soldado(c, e, t) {
    const bom = e.estado !== 'mau';
    c.save(); c.translate(e.x, e.y);
    if (e.flutua > 0) { c.translate(0, -40); c.rotate(Math.sin(e.t * 8) * 0.4); }
    const corpo = e.pisca > 0 ? '#ffffff' : (e.lego ? '#3d405b' : '#2b2d42');
    const pa = bom ? 0 : Math.sin(e.t * 9) * 6;
    c.strokeStyle = corpo; c.lineWidth = 9; c.lineCap = e.lego ? 'butt' : 'round';
    c.beginPath(); c.moveTo(-6, -30); c.lineTo(-6 - pa, 0); c.moveTo(6, -30); c.lineTo(6 + pa, 0); c.stroke();
    c.fillStyle = corpo;
    if (e.lego) { c.beginPath(); c.moveTo(-15, -66); c.lineTo(15, -66); c.lineTo(18, -30); c.lineTo(-18, -30); c.closePath(); c.fill(); }
    else { G.gfx.rr(c, -14, -66, 28, 38, 8); c.fill(); }
    c.fillStyle = '#ef233c'; c.fillRect(-14, -46, 28, 4);
    c.strokeStyle = corpo; c.lineWidth = 7;
    if (bom) {
      const a = Math.sin(t * 8 + e.f) * 0.5;
      c.beginPath(); c.moveTo(12, -60); c.lineTo(12 + Math.cos(-1.3 + a) * 22, -60 + Math.sin(-1.3 + a) * 22); c.stroke();
      c.fillStyle = e.lego ? '#ffd60a' : '#ffd9b3';
      if (e.lego) { G.gfx.rr(c, -11, -92, 22, 24, 5); c.fill(); }
      else { c.beginPath(); c.arc(0, -80, 12, 0, TAU); c.fill(); }
      c.strokeStyle = '#6b4226'; c.lineWidth = 2;
      c.beginPath(); c.arc(0, -79, 5, 0.2, Math.PI - 0.2); c.stroke();
      c.fillStyle = '#222'; c.fillRect(-5, -85, 3, 3); c.fillRect(3, -85, 3, 3);
      c.fillStyle = '#1b1b1b'; c.beginPath(); c.arc(-24, -50, 9, Math.PI, 0); c.fill();
    } else {
      // a pistola apontada à nave
      c.beginPath(); c.moveTo(-10, -58); c.lineTo(-20, -82); c.stroke();
      c.fillStyle = '#343a40'; c.save(); c.translate(-21, -84); c.rotate(-1.15); c.fillRect(-3, -4, 18, 7); c.restore();
      c.fillStyle = e.pisca > 0 ? '#fff' : '#1b1b1b';
      if (e.lego) { G.gfx.rr(c, -12, -94, 24, 28, 5); c.fill(); }
      else { c.beginPath(); c.arc(0, -80, 14, Math.PI, 0); c.lineTo(14, -70); c.lineTo(-14, -70); c.closePath(); c.fill(); }
      c.fillStyle = '#ff4d6d'; c.fillRect(-11, -84, 22, 5);
    }
    c.restore();
    pontos(c, e.x, e.y - 108, e);
  }

  function monstro(c, e, t) {
    const bom = e.estado !== 'mau';
    c.save(); c.translate(e.x, e.y);
    if (e.flutua > 0) { c.translate(0, -50); c.rotate(Math.sin(e.t * 7) * 0.25); }
    const sq = 1 + Math.sin(e.t * 5) * 0.04;
    c.scale(1 / sq, sq);
    c.fillStyle = e.pisca > 0 ? '#fff' : (bom ? '#ffafcc' : e.cor);
    c.beginPath();
    c.moveTo(-60, 0); c.quadraticCurveTo(-74, -90, -30, -136); c.quadraticCurveTo(0, -156, 30, -136); c.quadraticCurveTo(74, -90, 60, 0); c.closePath(); c.fill();
    // pelo aos bicos
    c.beginPath();
    for (let k = 0; k <= 8; k++) { const x = -60 + k * 15; c.lineTo(x, 0); c.lineTo(x + 7, 10); }
    c.lineTo(60, 0); c.fill();
    // cornos
    c.fillStyle = '#fefae0';
    c.beginPath(); c.moveTo(-30, -132); c.lineTo(-42, -164); c.lineTo(-16, -140); c.fill();
    c.beginPath(); c.moveTo(30, -132); c.lineTo(42, -164); c.lineTo(16, -140); c.fill();
    // um olho grande
    c.fillStyle = '#fff'; c.beginPath(); c.arc(0, -96, 24, 0, TAU); c.fill();
    const q = eu(), ox = clamp((q.x - e.x) / 300, -1, 1) * 8, oy = clamp((q.y - (e.y - 96)) / 300, -1, 1) * 8;
    c.fillStyle = '#1b1b1b'; c.beginPath(); c.arc(ox, -96 + oy, 10, 0, TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(ox + 3, -99 + oy, 3, 0, TAU); c.fill();
    if (bom) {
      c.fillStyle = '#7a1c3a';
      c.beginPath(); c.arc(0, -52, 22, 0.1, Math.PI - 0.1); c.fill();
      c.fillStyle = '#ff5d8f'; c.beginPath(); c.arc(-36, -64, 8, 0, TAU); c.arc(36, -64, 8, 0, TAU); c.fill();
      const a = Math.sin(t * 7 + e.f);
      c.strokeStyle = '#ffafcc'; c.lineWidth = 12; c.lineCap = 'round';
      c.beginPath(); c.moveTo(56, -70); c.lineTo(84, -110 + a * 14); c.stroke();
    } else {
      c.strokeStyle = '#1b1b1b'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(-26, -122); c.lineTo(-6, -114); c.moveTo(26, -122); c.lineTo(6, -114); c.stroke();
      c.fillStyle = '#3c096c'; c.beginPath(); c.ellipse(0, -50, 28, 13, 0, 0, TAU); c.fill();
      c.fillStyle = '#fff';
      for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * 10 - 4, -60); c.lineTo(k * 10 + 4, -60); c.lineTo(k * 10, -50); c.fill(); }
      c.strokeStyle = e.cor; c.lineWidth = 12; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-56, -70); c.lineTo(-84, -56); c.stroke();
    }
    c.restore();
    pontos(c, e.x, e.y - 186, e);
  }

  function mumia(c, e, t) {
    const bom = e.estado !== 'mau';
    c.save(); c.translate(e.x, e.y);
    if (e.flutua > 0) { c.translate(0, -40); c.rotate(Math.sin(e.t * 8) * 0.4); }
    if (bom) {
      // já sem ligaduras: uma pessoa do Egito a dançar
      const d = Math.sin(t * 8 + e.f);
      c.strokeStyle = '#6b4226'; c.lineWidth = 7; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-5, -30); c.lineTo(-9 - d * 4, 0); c.moveTo(5, -30); c.lineTo(9 - d * 4, 0); c.stroke();
      c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(-14, -64); c.lineTo(14, -64); c.lineTo(20, -24); c.lineTo(-20, -24); c.closePath(); c.fill();
      c.fillStyle = '#2a9d8f'; c.fillRect(-15, -44, 30, 5);
      c.strokeStyle = '#c68642'; c.lineWidth = 6;
      c.beginPath(); c.moveTo(-12, -58); c.lineTo(-26, -78 + d * 8); c.moveTo(12, -58); c.lineTo(26, -78 - d * 8); c.stroke();
      c.fillStyle = '#c68642'; c.beginPath(); c.arc(0, -76, 12, 0, TAU); c.fill();
      c.fillStyle = '#1b1b1b'; c.fillRect(-12, -88, 24, 8);
      c.fillStyle = '#ffd60a'; c.fillRect(-12, -82, 24, 3);
      c.strokeStyle = '#5a2e0e'; c.lineWidth = 2;
      c.beginPath(); c.arc(0, -74, 5, 0.2, Math.PI - 0.2); c.stroke();
    } else {
      const pa = Math.sin(e.t * 7) * 5;
      c.fillStyle = e.pisca > 0 ? '#fff' : '#e9dcc0';
      c.fillRect(-11 - pa, -30, 9, 30); c.fillRect(2 + pa, -30, 9, 30);
      G.gfx.rr(c, -16, -70, 32, 44, 8); c.fill();
      c.fillRect(-36, -64, 24, 9);   // braços esticados para a frente
      c.beginPath(); c.arc(0, -80, 13, 0, TAU); c.fill();
      c.strokeStyle = '#bfae8a'; c.lineWidth = 2;
      for (let k = 0; k < 8; k++) { c.beginPath(); c.moveTo(-16, -66 + k * 9); c.lineTo(16, -62 + k * 9 - 6); c.stroke(); }
      for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-12, -88 + k * 7); c.lineTo(12, -84 + k * 7); c.stroke(); }
      c.fillStyle = '#1b1b1b'; c.fillRect(-10, -84, 20, 6);
      c.fillStyle = '#ffd60a'; c.beginPath(); c.arc(-5, -81, 2, 0, TAU); c.arc(5, -81, 2, 0, TAU); c.fill();
      c.strokeStyle = '#e9dcc0'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(14, -40); c.quadraticCurveTo(26, -30 + Math.sin(e.t * 5) * 6, 22, -14); c.stroke();
    }
    c.restore();
    pontos(c, e.x, e.y - 108, e);
  }

  function cobra(c, e, t) {
    const bom = e.estado !== 'mau';
    c.save(); c.translate(e.x, e.y);
    if (e.flutua > 0) { c.translate(0, -40); c.rotate(Math.sin(e.t * 8) * 0.4); }
    c.strokeStyle = e.pisca > 0 ? '#fff' : (bom ? '#80ed99' : '#2d6a4f'); c.lineWidth = 15; c.lineCap = 'round';
    c.beginPath();
    for (let k = 0; k <= 12; k++) {
      const x = 40 - k * 6.5, y = -10 + Math.sin(k * 0.9 + e.t * 7) * 7 - (k > 9 ? (k - 9) * 9 : 0);
      if (k === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();
    const hx = -38, hy = -40 + Math.sin(12 * 0.9 + e.t * 7) * 7;
    c.fillStyle = e.pisca > 0 ? '#fff' : (bom ? '#80ed99' : '#2d6a4f');
    c.beginPath(); c.ellipse(hx, hy, 14, 11, 0, 0, TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(hx - 3, hy - 4, 4, 0, TAU); c.fill();
    c.fillStyle = '#1b1b1b'; c.beginPath(); c.arc(hx - 4, hy - 4, 2, 0, TAU); c.fill();
    if (bom) {
      c.fillStyle = '#ff5d8f';
      c.beginPath(); c.moveTo(hx + 6, hy - 10); c.lineTo(hx - 4, hy - 20); c.lineTo(hx - 4, hy - 6); c.fill();
      c.beginPath(); c.moveTo(hx + 6, hy - 10); c.lineTo(hx + 16, hy - 20); c.lineTo(hx + 16, hy - 4); c.fill();
      c.strokeStyle = '#1b5e20'; c.lineWidth = 2;
      c.beginPath(); c.arc(hx - 4, hy + 2, 5, 0.2, Math.PI - 0.3); c.stroke();
    } else if (Math.sin(e.t * 9) > 0) {
      c.strokeStyle = '#e63946'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(hx - 14, hy + 2); c.lineTo(hx - 24, hy + 2); c.lineTo(hx - 28, hy - 2); c.moveTo(hx - 24, hy + 2); c.lineTo(hx - 28, hy + 6); c.stroke();
    }
    c.restore();
    pontos(c, e.x, e.y - 76, e);
  }

  function pessoa(c, e, t) {
    c.save(); c.translate(e.x, e.y);
    if (e.crianca) c.scale(0.75, 0.75);
    const a = Math.sin(t * 6 + e.f);
    c.strokeStyle = '#3d405b'; c.lineWidth = 8; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-5, -32); c.lineTo(-7, 0); c.moveTo(5, -32); c.lineTo(7, 0); c.stroke();
    c.fillStyle = e.cor; G.gfx.rr(c, -14, -70, 28, 42, 9); c.fill();
    c.strokeStyle = e.cor; c.lineWidth = 7;
    c.beginPath(); c.moveTo(-12, -62); c.lineTo(-20, -36); c.stroke();
    c.beginPath(); c.moveTo(12, -62); c.lineTo(12 + Math.cos(-1.3 + a * 0.5) * 24, -62 + Math.sin(-1.3 + a * 0.5) * 24); c.stroke();
    c.fillStyle = e.pele; c.beginPath(); c.arc(0, -82, 13, 0, TAU); c.fill();
    c.fillStyle = e.cabelo; c.beginPath(); c.arc(0, -86, 13, Math.PI, 0); c.fill();
    c.fillStyle = '#222'; c.fillRect(-6, -84, 3, 3); c.fillRect(4, -84, 3, 3);
    c.strokeStyle = '#7a3e1d'; c.lineWidth = 2;
    c.beginPath(); c.arc(0, -79, 5, 0.2, Math.PI - 0.2); c.stroke();
    c.restore();
  }

  function asteroide(c, e, t) {
    c.save(); c.translate(e.x, e.y); c.rotate(e.rot);
    c.fillStyle = e.pisca > 0 ? '#fff' : '#8d8575';
    c.beginPath();
    for (let k = 0; k < e.forma.length; k++) {
      const a = (k / e.forma.length) * TAU, r = e.r * e.forma[k];
      c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    c.closePath(); c.fill();
    c.strokeStyle = '#5c5548'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#6f685b';
    c.beginPath(); c.arc(-e.r * 0.3, -e.r * 0.2, e.r * 0.2, 0, TAU); c.arc(e.r * 0.3, e.r * 0.25, e.r * 0.14, 0, TAU); c.fill();
    c.restore();
    pontos(c, e.x, e.y - e.r - 14, e);
  }

  // um tijolo de Lego com pinos em cima
  function tijolo(c, x, y, w, h, cor) {
    c.fillStyle = cor; c.fillRect(x, y, w, h);
    c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(x, y + h - 4, w, 4);
    const n = Math.max(1, Math.round(w / 24));
    for (let k = 0; k < n; k++) {
      const px = x + (k + 0.5) * (w / n);
      c.fillStyle = cor; c.fillRect(px - 7, y - 6, 14, 7);
      c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(px - 7, y - 6, 4, 7);
    }
  }

  // o boi de Lego gigante (virado para a direita); dá para ir lá dentro
  function boiLego(c, e, t) {
    c.save(); c.translate(e.x, e.y);
    const cor = e.cor, escuro = 'rgba(0,0,0,.22)';
    // pernas a andar
    for (let k = 0; k < 4; k++) {
      const lx = [-140, -90, 70, 120][k];
      const sw = Math.sin(e.passo / 40 + (k % 2) * Math.PI) * (e.noChao ? 12 : 4);
      c.save(); c.translate(lx + sw, 0);
      c.fillStyle = cor; c.fillRect(-18, -80, 36, 80);
      c.fillStyle = '#343a40'; c.fillRect(-20, -14, 40, 14);
      c.restore();
    }
    // corpo de tijolos
    tijolo(c, -170, -130, 340, 54, cor);
    tijolo(c, -170, -186, 340, 56, cor);
    tijolo(c, -150, -230, 120, 44, cor);
    tijolo(c, -20, -230, 150, 44, cor);
    c.fillStyle = escuro; c.fillRect(-170, -134, 340, 4); c.fillRect(-170, -190, 340, 4);
    c.fillStyle = '#ffffff'; c.fillRect(-60, -170, 70, 40); c.fillRect(60, -122, 50, 36);
    // cauda
    c.strokeStyle = cor; c.lineWidth = 12; c.lineCap = 'butt';
    c.beginPath(); c.moveTo(-170, -200); c.lineTo(-196, -160 + Math.sin(t * 5) * 8); c.stroke();
    c.fillStyle = '#343a40'; c.fillRect(-204, -166 + Math.sin(t * 5) * 8, 16, 22);
    // cabeça
    tijolo(c, 150, -270, 110, 96, cor);
    c.fillStyle = '#ffadad'; c.fillRect(214, -216, 52, 42);
    c.fillStyle = '#6d2e2e'; c.fillRect(226, -204, 8, 8); c.fillRect(246, -204, 8, 8);
    c.fillStyle = '#ffffff'; c.fillRect(176, -252, 22, 22);
    c.fillStyle = '#1b1b1b'; c.fillRect(184, -246, 11, 12);
    // cornos de tijolo branco
    c.fillStyle = '#fefae0';
    c.fillRect(150, -296, 20, 30); c.fillRect(132, -310, 30, 18);
    c.fillRect(238, -296, 20, 30); c.fillRect(246, -310, 30, 18);
    // a porta (é aqui que a nave entra)
    const p = portaDoBoi(e);
    c.fillStyle = e.montado ? '#bde0fe' : '#3d2b1f';
    G.gfx.rr(c, p.x - e.x - 48, p.y - e.y - 44, 96, 88, 14); c.fill();
    c.strokeStyle = '#ffd60a'; c.lineWidth = 5; c.stroke();
    if (e.montado) {
      // lá dentro: o bebé e o amigo à janela
      bebe(c, p.x - e.x - 18, p.y - e.y + 10, 1.1, t, s.forcaT > 0);
      amigo(c, p.x - e.x + 16, p.y - e.y + 6, 1.1, t, s.tiroT > 0);
      c.fillStyle = 'rgba(160,220,255,.25)'; G.gfx.rr(c, p.x - e.x - 48, p.y - e.y - 44, 96, 88, 14); c.fill();
    } else if (!e.saiuT) {
      // seta a piscar a dizer "entra aqui"
      const b = Math.sin(t * 6) * 8;
      c.fillStyle = '#ffd60a';
      c.beginPath(); c.moveTo(p.x - e.x - 120 + b, p.y - e.y - 16); c.lineTo(p.x - e.x - 70 + b, p.y - e.y); c.lineTo(p.x - e.x - 120 + b, p.y - e.y + 16); c.fill();
      c.font = '34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000';
      c.fillText('🚪', p.x - e.x, p.y - e.y);
    }
    c.restore();
  }

  function naveMae(c, e, t) {
    const bom = e.estado !== 'mau';
    c.save(); c.translate(e.x, e.y);
    if (e.flutua > 0) c.rotate(Math.sin(e.t * 6) * 0.08);
    c.fillStyle = e.pisca > 0 ? '#ffffff' : (bom ? '#e0fbfc' : '#3d405b');
    c.beginPath(); c.moveTo(-190, 10); c.lineTo(150, -70); c.lineTo(190, -10); c.lineTo(170, 50); c.lineTo(-120, 50); c.closePath(); c.fill();
    c.strokeStyle = bom ? '#7bdff2' : '#22223b'; c.lineWidth = 4; c.stroke();
    c.fillStyle = bom ? '#bde0fe' : '#2b2d42';
    c.fillRect(40, -96, 80, 34); c.fillRect(64, -120, 30, 26);
    c.strokeStyle = bom ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.12)'; c.lineWidth = 2;
    for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(-150 + k * 50, 18 - k * 9); c.lineTo(-130 + k * 50, 48); c.stroke(); }
    for (let k = 0; k < 7; k++) {
      c.fillStyle = bom ? ['#ff5d8f', '#ffd60a', '#8ac926'][k % 3] : (Math.sin(t * 6 + k) > 0 ? '#ff4d6d' : '#7a1c2e');
      c.beginPath(); c.arc(-120 + k * 44, 36, 6, 0, TAU); c.fill();
    }
    c.fillStyle = '#343a40'; c.fillRect(-210, 14, 40, 8); c.fillRect(-200, 40, 34, 8);
    if (bom) {
      c.strokeStyle = '#fff'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(80, -120); c.lineTo(80, -170); c.stroke();
      c.fillStyle = '#ff5d8f'; c.beginPath(); c.moveTo(80, -170); c.lineTo(120, -158); c.lineTo(80, -146); c.fill();
      G.gfx.heart(c, 96, -160, 14, '#ffffff');
    }
    c.restore();
  }

  function portal(c, x, y, t, aberto) {
    if (!aberto) return;
    c.save(); c.translate(x, y);
    for (let k = 0; k < 5; k++) {
      c.strokeStyle = ['#c77dff', '#7bdff2', '#ffffff', '#9d4edd', '#4cc9f0'][k];
      c.lineWidth = 10 - k;
      c.beginPath(); c.ellipse(0, 0, 70 - k * 9, 120 - k * 16, 0, t * (2 + k) + k, t * (2 + k) + k + 4.4); c.stroke();
    }
    c.fillStyle = 'rgba(199,125,255,.25)'; c.beginPath(); c.ellipse(0, 0, 60, 104, 0, 0, TAU); c.fill();
    c.restore();
  }

  /* ---------- fundos de cada terra ---------- */
  function ceu(c, W, H, a, b, d) {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, a); g.addColorStop(0.7, b); g.addColorStop(1, d || b);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  // repete uma coisa ao longo do fundo, com paralaxe
  function rep(W, par, esp, fn) {
    const off = camX * par;
    const i0 = Math.floor(off / esp) - 1, i1 = Math.floor((off + W) / esp) + 1;
    for (let i = i0; i <= i1; i++) fn(i * esp - off, i);
  }
  function colinas(c, W, chao, par, alt, cor, f) {
    c.fillStyle = cor;
    c.beginPath(); c.moveTo(0, chao);
    for (let x = 0; x <= W + 20; x += 20) {
      const wx = x + camX * par;
      c.lineTo(x, chao - alt - Math.sin(wx * 0.004 + f) * alt * 0.5 - Math.sin(wx * 0.011 + f * 2) * alt * 0.25);
    }
    c.lineTo(W, chao); c.closePath(); c.fill();
  }

  function fundo(c, W, H, chao, t) {
    const id = T().id;
    if (id === 'touros') {
      ceu(c, W, H, '#5bb8ff', '#c7ecff');
      G.gfx.sun(c, W * 0.82, H * 0.14, 34, t);
      rep(W, 0.08, 420, function (x, i) { G.gfx.cloud(c, x + 100, 60 + h01(i) * 120, 30 + h01(i + 7) * 20, 0.9); });
      colinas(c, W, chao, 0.2, 110, '#9bd88f', 1);
      colinas(c, W, chao, 0.45, 60, '#6cc46f', 4);
      rep(W, 1, 150, function (x) {
        c.fillStyle = '#8d6e4f'; c.fillRect(x, chao - 46, 10, 46);
        c.fillRect(x - 70, chao - 38, 150, 6); c.fillRect(x - 70, chao - 20, 150, 6);
      });
      c.fillStyle = '#58a83f'; c.fillRect(0, chao, W, H - chao);
      rep(W, 1, 90, function (x, i) { c.fillStyle = ['#ff5d8f', '#ffd60a', '#ffffff'][i % 3 < 0 ? 0 : i % 3]; c.beginPath(); c.arc(x + h01(i) * 60, chao + 16 + h01(i + 3) * 30, 4, 0, TAU); c.fill(); });
    } else if (id === 'mauzoes') {
      ceu(c, W, H, '#2b1236', '#7a2a3a', '#a2423d');
      c.fillStyle = '#ffd6a5'; c.beginPath(); c.arc(W * 0.78, H * 0.16, 36, 0, TAU); c.fill();
      c.fillStyle = '#e5989b'; c.beginPath(); c.arc(W * 0.66, H * 0.1, 16, 0, TAU); c.fill();
      rep(W, 0.25, 230, function (x, i) {
        const h = 160 + h01(i) * 160;
        c.fillStyle = '#3a1f3d'; c.fillRect(x, chao - h, 60, h); c.fillRect(x + 22, chao - h - 40, 16, 40);
        c.fillStyle = Math.sin(t * 3 + i) > 0 ? '#ff4d6d' : '#7a1c2e'; c.beginPath(); c.arc(x + 30, chao - h - 44, 5, 0, TAU); c.fill();
      });
      rep(W, 0.55, 380, function (x, i) {
        c.fillStyle = '#2b2d42'; c.fillRect(x, chao - 110, 180, 110); c.fillRect(x + 20, chao - 170, 26, 60); c.fillRect(x + 120, chao - 150, 22, 40);
        c.fillStyle = 'rgba(200,200,200,.25)';
        c.beginPath(); c.arc(x + 33 + Math.sin(t + i) * 6, chao - 186 - ((t * 30) % 40), 14, 0, TAU); c.fill();
        c.fillStyle = '#ffb703'; for (let k = 0; k < 4; k++) c.fillRect(x + 20 + k * 40, chao - 80, 18, 14);
      });
      c.fillStyle = '#3a3a46'; c.fillRect(0, chao, W, H - chao);
      rep(W, 1, 120, function (x) { c.fillStyle = '#4a4e69'; c.fillRect(x, chao, 4, H - chao); c.fillRect(x, chao, 120, 4); });
    } else if (id === 'monstros') {
      ceu(c, W, H, '#1b3a4b', '#5f3a8a', '#7b4fa0');
      for (let k = 0; k < 30; k++) { c.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.4 * h01(k)) + ')'; c.fillRect(h01(k + 1) * W, h01(k + 2) * H * 0.45, 2, 2); }
      colinas(c, W, chao, 0.2, 90, '#4a2c6b', 2);
      rep(W, 0.45, 330, function (x, i) {
        const h = 120 + h01(i) * 110, cor = ['#ef476f', '#06d6a0', '#ffd166', '#118ab2'][Math.abs(i) % 4];
        c.fillStyle = '#f1e3d3'; c.fillRect(x - 12, chao - h, 24, h);
        c.fillStyle = cor; c.beginPath(); c.ellipse(x, chao - h, 70, 38, 0, Math.PI, 0); c.fill();
        c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(x - 24, chao - h - 14, 8, 0, TAU); c.arc(x + 20, chao - h - 22, 6, 0, TAU); c.fill();
      });
      rep(W, 1, 170, function (x, i) {
        c.save(); c.globalAlpha = 0.5 + 0.4 * Math.sin(t * 2 + i);
        c.fillStyle = '#80ffdb'; c.beginPath(); c.arc(x + 40, chao - 22, 7, 0, TAU); c.arc(x + 56, chao - 34, 5, 0, TAU); c.fill();
        c.restore();
        c.strokeStyle = '#2d6a4f'; c.lineWidth = 4; c.beginPath(); c.moveTo(x + 48, chao); c.lineTo(x + 46, chao - 26); c.stroke();
      });
      c.fillStyle = '#4b2a63'; c.fillRect(0, chao, W, H - chao);
    } else if (id === 'pessoas') {
      ceu(c, W, H, '#7cc6ff', '#e0f4ff');
      G.gfx.sun(c, W * 0.15, H * 0.12, 30, t);
      rep(W, 0.08, 460, function (x, i) { G.gfx.cloud(c, x + 100, 50 + h01(i) * 100, 28 + h01(i + 5) * 18, 0.85); });
      rep(W, 0.22, 140, function (x, i) { const h = 150 + h01(i) * 170; c.fillStyle = '#a8b8d0'; c.fillRect(x, chao - h, 110, h); });
      rep(W, 0.6, 240, function (x, i) {
        const h = 120 + h01(i * 3) * 60, cor = ['#f4a261', '#e9c46a', '#2a9d8f', '#f28482', '#bde0fe', '#cdb4db'][Math.abs(i) % 6];
        c.fillStyle = cor; c.fillRect(x, chao - h, 170, h);
        c.fillStyle = '#9b2226'; c.beginPath(); c.moveTo(x - 12, chao - h); c.lineTo(x + 85, chao - h - 60); c.lineTo(x + 182, chao - h); c.fill();
        c.fillStyle = '#ffffff';
        for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) c.fillRect(x + 22 + a * 90, chao - h + 20 + b * 46, 36, 30);
        c.fillStyle = '#6b4226'; c.fillRect(x + 70, chao - 52, 32, 52);
      });
      c.fillStyle = '#c9c9c9'; c.fillRect(0, chao, W, 20);
      c.fillStyle = '#6c757d'; c.fillRect(0, chao + 20, W, H - chao - 20);
      rep(W, 1, 120, function (x) { c.fillStyle = '#fff'; c.fillRect(x, chao + 50, 60, 6); });
    } else if (id === 'egito') {
      ceu(c, W, H, '#ff9e40', '#ffe5a8');
      c.fillStyle = '#fff3b0'; c.beginPath(); c.arc(W * 0.8, H * 0.18, 46, 0, TAU); c.fill();
      rep(W, 0.18, 640, function (x, i) {
        const h = 170 + h01(i) * 90;
        c.fillStyle = '#d4a373'; c.beginPath(); c.moveTo(x, chao); c.lineTo(x + h, chao - h); c.lineTo(x + h * 2, chao); c.fill();
        c.fillStyle = '#b08455'; c.beginPath(); c.moveTo(x + h, chao - h); c.lineTo(x + h * 2, chao); c.lineTo(x + h * 1.3, chao); c.fill();
      });
      rep(W, 0.5, 420, function (x, i) {
        const h = 110 + h01(i) * 40;
        c.strokeStyle = '#8b5e34'; c.lineWidth = 10; c.lineCap = 'round';
        c.beginPath(); c.moveTo(x, chao); c.quadraticCurveTo(x + 12, chao - h / 2, x + 6, chao - h); c.stroke();
        c.strokeStyle = '#2d6a4f'; c.lineWidth = 8;
        for (let k = 0; k < 5; k++) { const a = -Math.PI + k * (Math.PI / 4); c.beginPath(); c.moveTo(x + 6, chao - h); c.quadraticCurveTo(x + 6 + Math.cos(a) * 30, chao - h - 22, x + 6 + Math.cos(a) * 54, chao - h + 10 + Math.abs(Math.sin(a)) * 4); c.stroke(); }
      });
      c.fillStyle = '#e9c46a';
      c.beginPath(); c.moveTo(0, H);
      for (let x = 0; x <= W + 20; x += 20) c.lineTo(x, chao - Math.sin((x + camX) * 0.01) * 6);
      c.lineTo(W, H); c.fill();
    } else if (id === 'lego') {
      ceu(c, W, H, '#4cc9f0', '#bde0fe');
      rep(W, 0.08, 480, function (x, i) {
        const y = 60 + h01(i) * 110;
        c.fillStyle = '#ffffff'; c.fillRect(x, y, 120, 26); c.fillRect(x + 26, y - 22, 70, 24);
      });
      rep(W, 0.3, 300, function (x, i) {
        const n = 2 + Math.floor(h01(i) * 4), cor = ['#ffd60a', '#ef233c', '#3a86ff', '#8ac926', '#ff9f1c'][Math.abs(i) % 5];
        for (let k = 0; k < n; k++) tijolo(c, x + k * 14, chao - 40 - k * 40, 200 - k * 28, 40, cor);
      });
      rep(W, 0.65, 380, function (x, i) {
        c.fillStyle = '#8b5e34'; c.fillRect(x, chao - 90, 28, 90);
        tijolo(c, x - 40, chao - 130, 108, 40, '#2b9348');
        tijolo(c, x - 22, chao - 166, 72, 36, '#55a630');
        if (h01(i) > 0.5) { c.fillStyle = '#ef233c'; c.beginPath(); c.arc(x + 4, chao - 112, 7, 0, TAU); c.fill(); }
      });
      c.fillStyle = '#2fbf4a'; c.fillRect(0, chao, W, H - chao);
      rep(W, 1, 40, function (x) { c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.arc(x + 20, chao + 20, 8, 0, TAU); c.arc(x + 20, chao + 60, 8, 0, TAU); c.fill(); });
    } else {
      ceu(c, W, H, '#05051a', '#141040', '#24124a');
      for (let camada = 0; camada < 3; camada++) {
        const par = 0.05 + camada * 0.15;
        rep(W, par, 300, function (x, i) {
          for (let k = 0; k < 6; k++) {
            const n = i * 13 + k + camada * 101;
            c.fillStyle = 'rgba(255,255,255,' + (0.4 + 0.6 * Math.abs(Math.sin(t * 2 + n))) + ')';
            c.fillRect(x + h01(n) * 300, h01(n + 0.5) * H, 1.5 + camada, 1.5 + camada);
          }
        });
      }
      rep(W, 0.06, 1300, function (x, i) {
        const r = 50 + h01(i) * 60, y = 120 + h01(i + 2) * (H * 0.4), cor = ['#ff9f1c', '#7bdff2', '#c77dff', '#80ed99'][Math.abs(i) % 4];
        c.fillStyle = cor; c.beginPath(); c.arc(x + 400, y, r, 0, TAU); c.fill();
        c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.arc(x + 400 + r * 0.3, y + r * 0.2, r * 0.85, 0, TAU); c.fill();
        if (h01(i + 4) > 0.5) { c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 4; c.beginPath(); c.ellipse(x + 400, y, r * 1.6, r * 0.35, -0.3, 0, TAU); c.stroke(); }
      });
    }
  }

  function desenhaHiper(c, W, H, t) {
    c.fillStyle = '#05051a'; c.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, f = faseT / 1.6;
    c.lineCap = 'round';
    for (let k = 0; k < 90; k++) {
      const a = h01(k) * TAU, d0 = 30 + h01(k + 0.3) * Math.max(W, H) * 0.6;
      const d = d0 * (0.4 + f * 1.4), L = 20 + f * f * 260;
      c.strokeStyle = k % 5 === 0 ? '#7bdff2' : 'rgba(255,255,255,.85)'; c.lineWidth = 2 + (k % 3);
      c.beginPath(); c.moveTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d); c.lineTo(cx + Math.cos(a) * (d + L), cy + Math.sin(a) * (d + L)); c.stroke();
    }
    c.save(); c.translate(cx, cy); c.scale(1.2, 1.2); navePrincipal(c, t, false, false); c.restore();
    const prox = TERRAS[destino];
    c.font = '64px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000';
    c.globalAlpha = Math.min(1, f * 2); c.fillText(prox.ic, cx, cy - 130); c.globalAlpha = 1;
    if (f > 0.85) { c.fillStyle = 'rgba(255,255,255,' + ((f - 0.85) / 0.15) + ')'; c.fillRect(0, 0, W, H); }
  }

  /* ---------- desenhar tudo ---------- */
  S.draw = function (c, t) {
    const k = vscale(), W = vw(), H = vh(), chao = chaoY();
    c.save(); c.scale(k, k);
    if (fase === 'hiper') { desenhaHiper(c, W, H, t); c.restore(); hud(c, t); return; }
    fundo(c, W, H, chao, t);

    c.save(); c.translate(-camX, 0);
    portal(c, LEN + 40, Math.min(chao - 130, H * 0.42), t, T().id !== 'espaco' || (boss && boss.estado !== 'mau'));

    // primeiro o que anda no chão, depois o que voa
    for (const e of ents) {
      const sx = e.x - camX;
      if (sx < -360 || sx > W + 360) continue;
      if (e.tipo === 'boi') boiLego(c, e, t);
      else if (e.tipo === 'touro') touro(c, e, t);
      else if (e.tipo === 'soldado') soldado(c, e, t);
      else if (e.tipo === 'monstro') monstro(c, e, t);
      else if (e.tipo === 'mumia') mumia(c, e, t);
      else if (e.tipo === 'cobra') cobra(c, e, t);
      else if (e.tipo === 'pessoa') pessoa(c, e, t);
    }
    for (const p of pickups) {
      if (p.tipo === 'estrela') G.gfx.star(c, p.x, p.y + Math.sin(p.t * 3) * 5, 15, '#ffd166', p.t * 2);
      else G.gfx.heart(c, p.x, p.y + Math.sin(p.t * 3) * 5, 30, '#ff5d8f');
    }
    for (const e of ents) {
      const sx = e.x - camX;
      if (sx < -360 || sx > W + 360) continue;
      if (e.tipo === 'nave') naveMa(c, e, t);
      else if (e.tipo === 'piloto') piloto(c, e, t);
      else if (e.tipo === 'asteroide') asteroide(c, e, t);
      else if (e.tipo === 'navemae') naveMae(c, e, t);
    }

    // os nossos tiros (azuis) e os deles (vermelhos ou gosma verde)
    c.lineCap = 'round';
    for (const m of tiros) {
      if (m.verde) {
        c.fillStyle = 'rgba(158,240,26,.35)'; c.beginPath(); c.arc(m.x, m.y, 16, 0, TAU); c.fill();
        c.fillStyle = '#d8f3a0'; c.beginPath(); c.arc(m.x, m.y, 8, 0, TAU); c.fill();
        continue;
      }
      const a = Math.atan2(m.vy, m.vx - vel);
      c.strokeStyle = '#7bdff2'; c.lineWidth = 7;
      c.beginPath(); c.moveTo(m.x, m.y); c.lineTo(m.x - Math.cos(a) * 26, m.y - Math.sin(a) * 26); c.stroke();
      c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.stroke();
    }

    if (!boi) {
      c.save(); c.translate(s.wx, s.y + (fase === 'oficina' ? 0 : Math.sin(t * 3) * 3)); c.rotate(s.tilt);
      if (s.inv > 0 && fase === 'voa' && Math.floor(t * 12) % 2 === 0) c.globalAlpha = 0.45;
      navePrincipal(c, t, s.tiroT > 0, s.forcaT > 0, !!pe);
      c.restore();
      if (fase === 'oficina') oficina(c, t);
      if (pe) bebeAPe(c, t);
    }
    if (forcaFx > 0) {
      const o = boi ? { x: boi.x + 30, y: boi.y - 150 } : (pe ? { x: pe.x, y: pe.y - 46 } : { x: s.wx, y: s.y - 26 });
      c.strokeStyle = 'rgba(158,240,26,' + forcaFx + ')'; c.lineWidth = 8;
      for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(o.x, o.y, (1 - forcaFx) * (300 + k * 200) + 20, 0, TAU); c.stroke(); }
    }

    for (const m of tirosM) {
      if (m.tipo === 'gosma') {
        c.fillStyle = '#80ed99'; c.beginPath(); c.arc(m.x, m.y, 12, 0, TAU); c.fill();
        c.fillStyle = '#38b000'; c.beginPath(); c.arc(m.x + 3, m.y + 3, 6, 0, TAU); c.fill();
      } else {
        const a = Math.atan2(m.vy, m.vx - vel);
        c.strokeStyle = '#ff4d6d'; c.lineWidth = 7;
        c.beginPath(); c.moveTo(m.x, m.y); c.lineTo(m.x - Math.cos(a) * 24, m.y - Math.sin(a) * 24); c.stroke();
        c.strokeStyle = '#ffd6dc'; c.lineWidth = 2.5; c.stroke();
      }
    }

    for (const p of parts) {
      if (p.t < 0) continue;
      const a = 1 - p.t / p.life;
      c.globalAlpha = Math.max(0, a);
      if (p.k === 'f') { c.fillStyle = p.cor; c.beginPath(); c.arc(p.x, p.y, 4, 0, TAU); c.fill(); }
      else if (p.k === 'q') { c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.cor; c.fillRect(-7, -5, 14, 10); c.fillRect(-4, -9, 8, 4); c.restore(); }
      else if (p.k === 'l') { c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.cor; c.fillRect(-14, -3, 28, 6); c.restore(); }
      else if (p.k === 'c') G.gfx.heart(c, p.x, p.y, 20, p.cor);
      else if (p.k === 'p') { c.fillStyle = p.cor; c.beginPath(); c.arc(p.x, p.y, p.r * (1 + p.t), 0, TAU); c.fill(); }
    }
    c.globalAlpha = 1;
    for (const tx of textos) {
      c.globalAlpha = Math.max(0, 1 - tx.t / 1.2);
      G.gfx.label(c, tx.txt, tx.x, tx.y - tx.t * 50, 26, tx.cor, 'center', '#3d2b1f');
    }
    c.globalAlpha = 1;
    c.restore();
    c.restore();
    hud(c, t);
  };

  // o bebé cá fora, a pé (só ele anda; vira-se para onde vai)
  function bebeAPe(c, t) {
    const k = 1.7;
    c.save(); c.translate(pe.x, pe.y);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(0, 1, 20, 5, 0, 0, TAU); c.fill();
    if (s.inv > 0 && Math.floor(t * 12) % 2 === 0) c.globalAlpha = 0.45;
    if (pe.dir < 0) c.scale(-1, 1);
    const w = pe.noChao ? Math.sin(pe.walk / 12) * 6 : 3;
    c.fillStyle = '#8fbf6f';
    c.beginPath(); c.ellipse(-8 + w, -5, 8, 5, 0, 0, TAU); c.ellipse(8 - w, -5, 8, 5, 0, 0, TAU); c.fill();
    bebe(c, 0, -8 - 24 * k - (pe.noChao ? Math.abs(Math.sin(pe.walk / 12)) * 2 : 0), k, t, s.forcaT > 0);
    c.restore();
    // a dizer onde é a porta da nave para voltar a entrar
    if (pertoDaNave()) {
      c.font = '30px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000';
      c.fillText('🚪', s.wx, s.y - 70 + Math.sin(t * 5) * 5);
    }
  }

  // o amigo cá fora, a arranjar a nave com a chave
  function oficina(c, t) {
    const x = s.wx + 110, y = chaoY();
    c.save(); c.translate(x, y);
    c.strokeStyle = '#6c757d'; c.lineWidth = 8; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-5, -30); c.lineTo(-7, 0); c.moveTo(5, -30); c.lineTo(7, 0); c.stroke();
    c.fillStyle = '#6c757d'; G.gfx.rr(c, -13, -66, 26, 38, 8); c.fill();
    c.fillStyle = '#ced4da'; c.beginPath(); c.arc(0, -78, 13, 0, TAU); c.fill();
    c.fillStyle = '#212529'; c.fillRect(-12, -80, 15, 5); c.fillRect(-7, -80, 4, 12);
    const a = Math.sin(t * 14) * 0.6;
    c.strokeStyle = '#6c757d'; c.lineWidth = 7;
    c.beginPath(); c.moveTo(-10, -58); c.lineTo(-10 + Math.cos(Math.PI + 0.5 + a) * 22, -58 + Math.sin(Math.PI + 0.5 + a) * 22); c.stroke();
    c.restore();
    c.font = '34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000';
    c.fillText('🔧', x - 32 + Math.sin(t * 14) * 6, y - 74);
  }

  /* ---------- HUD: só desenhos (o Isaac ainda não lê) ---------- */
  function hud(c, t) {
    const k = Math.min(1, G.H / 520);
    // no espaço o céu é escuro: as bolinhas de fundo passam a claras
    const vazio = T().id === 'espaco' || fase === 'hiper' ? 'rgba(255,255,255,.28)' : 'rgba(0,0,0,.35)';
    c.save(); c.scale(k, k);
    // corações (meio coração por cada tiro)
    const cor = fase === 'oficina' ? MAXC * Math.min(1, faseT / OFICINA) : s.coracoes;
    for (let i = 0; i < MAXC; i++) {
      const x = 30 + i * 34, y = 34, f = clamp(cor - i, 0, 1);
      G.gfx.heart(c, x, y, 30, vazio);
      if (f > 0) {
        c.save();
        if (f < 1) { c.beginPath(); c.rect(x - 20, y - 20, 20, 40); c.clip(); }
        G.gfx.heart(c, x, y, 30, '#ff3b6b');
        c.restore();
      }
    }
    G.gfx.star(c, 30, 76, 16, '#ffd166', 0);
    G.gfx.label(c, '' + G.state.stars, 54, 77, 26, '#b56b00');
    // a Força do bebé (a encher)
    c.save(); c.translate(32, 124);
    c.fillStyle = vazio; c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.fill();
    const pronta = s.forcaCd <= 0;
    c.strokeStyle = pronta ? '#9ef01a' : '#ffffff'; c.lineWidth = 5;
    c.beginPath(); c.arc(0, 0, 20, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - s.forcaCd / 9)); c.stroke();
    c.font = (pronta ? 22 + Math.sin(t * 6) * 2 : 20) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#000';
    c.fillText(boi ? '🐂' : '✋', 0, 1);
    c.restore();
    // as sete terras: a de agora maior, com aro amarelo; tocar numa salta para lá
    hudTerras = [];
    for (let i = 0; i < TERRAS.length; i++) {
      const x = 80 + i * 40, y = 124, atual = i === terra || (fase === 'hiper' && i === destino);
      c.fillStyle = atual ? 'rgba(255,214,10,.9)' : vazio;
      c.beginPath(); c.arc(x, y, atual ? 19 : 16, 0, TAU); c.fill();
      c.font = (atual ? 22 : 18) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#000';
      c.fillText(TERRAS[i].ic, x, y + 1);
      hudTerras.push({ i: i, x: x * k, y: y * k, r: 19 * k });
    }
    // quanto falta para o portal
    const f = clamp(camX / LEN, 0, 1);
    G.gfx.rr(c, 14, 152, 340, 10, 5); c.fillStyle = vazio; c.fill();
    G.gfx.rr(c, 14, 152, Math.max(10, 340 * f), 10, 5); c.fillStyle = '#7bdff2'; c.fill();
    c.strokeStyle = '#c77dff'; c.lineWidth = 3; c.beginPath(); c.ellipse(360, 157, 7, 11, 0, 0, TAU); c.stroke();
    // a nave-mãe e quantos tiros ainda aguenta
    if (boss && boss.estado === 'mau') {
      const bw = Math.min(300, G.W / k - 420), bx = G.W / k / 2 - bw / 2;
      if (bw > 80) {
        G.gfx.rr(c, bx, 22, bw, 18, 9); c.fillStyle = 'rgba(0,0,0,.45)'; c.fill();
        G.gfx.rr(c, bx, 22, Math.max(18, bw * boss.hp / boss.hpMax), 18, 9); c.fillStyle = '#ff4d6d'; c.fill();
        c.font = '24px sans-serif'; c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillStyle = '#000';
        c.fillText('🛸', bx - 6, 31);
      }
    }
    c.restore();
  }

  S.debug = function () {
    return {
      fase: fase, terra: T().id, pe: pe ? { x: Math.round(pe.x), y: Math.round(pe.y), sobre: !!pe.sobre } : null, naveX: Math.round(s.wx), ronda: ronda, camX: Math.round(camX), sy: Math.round(s.y), coracoes: s.coracoes,
      ents: ents.length, maus: ents.filter(atacavel).length, tiros: tiros.length, tirosM: tirosM.length,
      boi: !!boi, boss: boss ? boss.estado + ':' + boss.hp : null, stars: G.state.stars, forcaCd: +s.forcaCd.toFixed(1)
    };
  };
  S.api = {
    vaiPara: function (i) { comecaTerra(i); },
    avanca: function (x) { camX = x; prox = Math.max(prox, camX + vw()); proxPick = Math.max(proxPick, camX + vw()); },
    ents: function () { return ents; },
    nave: function () { return s; },
    entra: function () { const e = ents.find(function (o) { return o.tipo === 'boi'; }); if (e) entra(e); return !!e; }
  };

  G.scenes = G.scenes || {};
  G.scenes.starwars = S;
})();
