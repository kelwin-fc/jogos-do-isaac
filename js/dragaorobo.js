/* Cena — O DRAGÃO ROBÔ, um presente do pai (Kelwin) para o Isaac (2026-11-11).

   O pedido do pai: "o pai e o filho andam pelo mundo a disparar flechas e vão num carro
   de corrida a tentar caçar um dragão robô de inteligência artificial. Têm amigos robôs
   bons que os ajudam: o Claude, o ChatGPT, o Gemini. Também disparam com pistolas e com
   uma espingarda de inteligência artificial. O jogo tem de ser difícil, mas pode ser muito
   fácil até chegarem à aldeia dos robôs: uma aldeia no meio de Espanha, com galinhas,
   porcos bravos, ovelhas, patos e um touro. Lá há um lobo robô que quer comer as
   galinhas, os patos e os porcos, mas os porcos dão-lhe cornadas. Os porcos e o touro
   ajudam a lutar contra o lobo."

   Como ficou:
   - O Isaac (pequeno, com o arco 🏹) e o pai (grande, com a pistola 🔫) andam juntos. Um
     é nosso e o outro vem atrás e dispara sozinho; o 🔄 troca quem jogamos.
   - Três robôs amigos voam connosco e disparam: o Claude (cor de laranja, de vez em
     quando traz um coração), o ChatGPT (verde, dispara depressa) e o Gemini (azul e roxo,
     dispara a dobrar). São robôs inventados aqui, só com o nome por cima.
   - ✨ é a ESPINGARDA DE INTELIGÊNCIA ARTIFICIAL: bolas de luz que vão sozinhas a todos os
     robôs maus que se veem. Depois tem de carregar.
   - 1) O caminho dos campos e 2) a estrada no carro de corrida (com disparadores) são
     FÁCEIS. Na estrada caça-se o dragão, mas ele foge para a aldeia.
   - 3) A aldeia dos robôs, no meio de Espanha, é DIFÍCIL. O lobo robô corre atrás das
     galinhas, dos patos e dos porcos, mas nunca apanha ninguém: as galinhas e os patos
     fogem a voar e os porcos bravos dão-lhe cornadas. O touro também ajuda. Sem energia,
     o lobo fica nosso amigo e vai guardar as ovelhas.
   - 4) O dragão robô chega à aldeia (DIFÍCIL). Sem energia, aterra e fica nosso amigo:
     festa, fogo de artifício e a mensagem do pai.
   - Ninguém morre: os robozinhos maus ficam bons e vão para a oficina; sem corações o pai
     e o Isaac sentam-se a descansar um bocadinho e voltam. Nunca há derrota. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  // a mensagem do presente (o Kelwin pode trocar este texto)
  const DEDICATORIA = 'Para o Isaac, do pai ❤️';
  const DEDICATORIA_FALA = 'Para o Isaac, do pai, com muito amor!';

  const GRAV = 2200, SALTO = 900, VEL = 320, MAXC = 5, CARRO_V = 860;
  const IA_CD = 9;                        // a espingarda de IA recarrega em 9 s
  const K_PAI = 1.55, K_FILHO = 1.08;     // o pai é grande e o Isaac é pequeno
  const G_SETA = 520;
  const TERRAS = [
    { id: 'campo', nome: 'O caminho dos campos', icone: '🏹', facil: true, len: 4300,
      fala: 'Vamos caçar o dragão robô! Primeiro, o caminho dos campos.', ceu: ['#7cc6f2', '#e3f6ff'], monte: '#9cc98a', chao: '#7fbf63', caminho: '#d9b47c' },
    { id: 'estrada', nome: 'A estrada do dragão', icone: '🏎️', facil: true, len: 15000, carro: true,
      fala: 'Ao carro de corrida! Vamos atrás do dragão!', ceu: ['#7fb8f0', '#fdf0d5'], monte: '#d4b483', chao: '#e2c27a', caminho: '#6c757d' },
    { id: 'aldeia', nome: 'A aldeia dos robôs', icone: '🐺', facil: false, len: 3400,
      fala: 'A aldeia dos robôs! Cuidado, agora é difícil! O lobo robô quer apanhar as galinhas!', ceu: ['#6fb3e8', '#fde7c2'], monte: '#e0b56d', chao: '#e3c48e', caminho: '#c9a26b' },
    { id: 'dragao', nome: 'O dragão robô!', icone: '🐉', facil: false, len: 3400,
      fala: 'O dragão robô chegou à aldeia! Vamos amansá-lo!', ceu: ['#f4a261', '#fde2c0'], monte: '#d39b5a', chao: '#e3c48e', caminho: '#c9a26b' }
  ];
  // primeiro é fácil, a partir da aldeia é difícil
  const DIF = {
    facil: { hpRodas: 3, hpDrone: 2, cd: [3.4, 4.8], vTiro: 360, dano: 0.5 },
    dificil: { hpRodas: 9, hpDrone: 7, cd: [1.0, 1.8], vTiro: 600, dano: 0.5 }
  };
  const AMIGOS = [
    { nome: 'Claude', cor: '#d97757', escuro: '#a85a3e', olhos: '#fff4e6', forma: 'redondo', ox: -120, oy: -150, cd: [1.9, 2.6], tiros: 1 },
    { nome: 'ChatGPT', cor: '#19a37f', escuro: '#0f7357', olhos: '#e6fff7', forma: 'quadrado', ox: -30, oy: -215, cd: [1.1, 1.6], tiros: 1 },
    { nome: 'Gemini', cor: '#5b6cff', escuro: '#8a4fd8', olhos: '#eef0ff', forma: 'diamante', ox: 65, oy: -165, cd: [2.0, 2.8], tiros: 2 }
  ];
  const PELE = '#f2c6a0';
  const DEF_PAI = { id: 'dr-pai', tronco: '#2f6f4f', bracos: '#2f6f4f', maos: PELE, pele: PELE, pernas: '#34508a', ancas: '#2b2d42', pes: '#3d2c1e' };
  const DEF_FILHO = { id: 'dr-filho', tronco: '#a50044', bracos: '#004d98', maos: PELE, pele: PELE, pernas: '#1d3557', ancas: '#004d98', pes: '#f1f3f5' };

  let terra, ronda, tempo, fase, faseT, camX, LEN, parque;
  let pai, filho, quem, coracoes, inv, descansa, cdIA, cdClaude, iaVista;
  let amigos, robos, tiros, maus, parts, textos, animais, lobo, dragao, carro, spawnT, voo, stats;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function h01(n) { const v = Math.sin(n * 127.1 + 3.3) * 43758.5; return v - Math.floor(v); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function vscale() { return Math.min(1, G.H / 620, G.W / 700); }
  function vw() { return G.W / vscale(); }
  function vh() { return G.H / vscale(); }
  function chaoY() {
    const reserva = G.W < 560 && G.H > G.W ? 236 : 122;
    return Math.min(vh() * 0.86, Math.max(vh() * 0.55, (G.H - reserva) / vscale()));
  }
  // a altura a que voa o dragão: abaixo do HUD, mesmo com o telemóvel deitado
  function ceuY() { return Math.min(330, chaoY() * 0.5); }
  function fala(t) { if (G.audio.fala) G.audio.fala(t); }
  function sfx(n) { G.audio.sfx(n); }
  function T() { return TERRAS[terra]; }
  function D() { return T().facil ? DIF.facil : DIF.dificil; }
  function texto(t, x, y, cor) { textos.push({ t: t, x: x, y: y, life: 1.4, age: 0, cor: cor }); }
  function eu() { return quem === 'pai' ? pai : filho; }
  function outro() { return quem === 'pai' ? filho : pai; }
  function noEcra(x, m) { return x > camX - (m || 0) && x < camX + vw() + (m || 0); }
  function talvez(p, frases) { if (Math.random() < p) fala(frases[Math.floor(Math.random() * frases.length)]); }

  S.enter = function () {
    ronda = 1; tempo = 0; quem = 'filho'; iaVista = false;
    stats = { descansos: [0, 0, 0, 0], tempo: [0, 0, 0, 0], danos: [0, 0, 0, 0], fugas: 0, cornadas: 0 };
    comecaTerra(0);
    fase = 'intro'; faseT = 0;
    document.getElementById('btnChama').textContent = '🔄';
    fala('O dragão robô! ' + DEDICATORIA_FALA);
  };

  /* ---------- as terras ---------- */
  function pessoaNova(qual, x) {
    return { qual: qual, x: x, y: 0, vy: 0, noChao: true, dir: 1, passo: 0, anda: false, cd: 0, arma: 0, saltaEm: -1 };
  }
  function comecaTerra(i) {
    terra = i;
    tiros = []; maus = []; parts = []; textos = [];
    inv = 2; descansa = 0; coracoes = MAXC; cdIA = 0; cdClaude = T().facil ? 12 : 18; spawnT = 4; voo = 6;
    if (i === 3) {                         // continua na aldeia: o dragão chega pelo céu
      robos = robos.filter(function (r) { return !r.mau; });
      const hp = 320 + (ronda - 1) * 60;
      dragao = { kind: 'dragao', x: eu().x + vw() * 0.7, y: -360, hp: hp, max: hp, mau: true, t: 0, estado: 'voa', cd: 3, mergT: 9,
        dir: -1, pisca: 0, festa: 0, chega: 1 };
      fase = 'joga'; faseT = 0;
      G.banner('🐉 ' + T().nome, 2600);
      fala(T().fala);
      sfx('roar');
      return;
    }
    LEN = T().len; camX = 0;
    robos = []; animais = []; lobo = null; dragao = null; carro = null; parque = null;
    pai = pessoaNova('pai', 230); filho = pessoaNova('filho', 150);
    if (quem === 'pai') { pai.x = 230; filho.x = 150; } else { filho.x = 230; pai.x = 150; }
    if (i === 0) {
      for (let g = 0; g < 8; g++) {
        const gx = 900 + g * 390 + rnd(0, 120);
        robos.push(novoRobo(g % 3 === 2 ? 'drone' : 'rodas', gx));
        if (g % 2 === 1) robos.push(novoRobo('rodas', gx + 90));
      }
      parque = LEN - 330;
    } else if (i === 1) {
      carro = { x: 260, y: 0, vy: 0, vx: 0, noChao: true, roda: 0, fogo: 0, bate: 0, cd: 0, lado: 0, dir: 1 };
      for (let x = 1400; x < LEN - 900; x += rnd(520, 760)) robos.push(novoRobo(Math.random() < 0.3 ? 'drone' : 'rodas', x));
      dragao = { kind: 'dragao', x: 900, y: -320, hp: 50 + (ronda - 1) * 10, max: 50 + (ronda - 1) * 10, sobeT: 6, mau: true, t: 0, estado: 'foge',
        cd: 3, dir: -1, pisca: 0, festa: 0, fugitivo: true, fugiu: false };
    } else if (i === 2) {
      parque = 170;
      pai.x = filho.x = 420; outro().x = 340;
      const tipos = ['galinha', 'galinha', 'galinha', 'pato', 'pato', 'porco', 'porco', 'porco', 'ovelha', 'ovelha', 'ovelha', 'galinha', 'pato', 'ovelha'];
      for (let k = 0; k < tipos.length; k++) animais.push(novoAnimal(tipos[k], 700 + k * (LEN - 1000) / tipos.length + rnd(-40, 40)));
      animais.push(novoAnimal('touro', LEN * 0.55));
      const hp = 200 + (ronda - 1) * 40;
      lobo = { kind: 'lobo', x: LEN * 0.62, y: 0, vy: 0, vx: 0, dir: -1, hp: hp, max: hp, mau: true, estado: 'caca', estT: 6, alvo: null,
        confuso: 0, kb: 0, cd: 2.5, pisca: 0, passo: 0, salta: false, svx: 0, festa: 0, uivo: 0 };
      for (let k = 0; k < 5; k++) robos.push(novoRobo(k % 2 ? 'drone' : 'rodas', 1100 + k * 420));
    }
    amigos = AMIGOS.map(function (a, k) {
      return { def: a, x: eu().x + a.ox, y: -200 + a.oy * 0.2, cd: rnd(0.5, 1.5) + k * 0.3, fase: k * 2.1, dir: 1, fogo: 0, festa: 0 };
    });
    fase = 'joga'; faseT = 0;
    G.banner(T().icone + ' ' + T().nome, 2600);
    fala(T().fala);
  }

  function novoRobo(sub, x) {
    const d = D(), hp = (sub === 'drone' ? d.hpDrone : d.hpRodas) + (ronda - 1);
    const by = -rnd(150, 230);
    return { kind: 'robo', sub: sub, x: x, y: sub === 'drone' ? by : 0, by: by, vx: 0, dir: -1, hp: hp, max: hp, mau: true,
      cd: rnd(1.5, 3) + (T().facil ? 1.2 : 0), pisca: 0, passo: rnd(0, 6), festa: 0, t: rnd(0, 6) };
  }
  function novoAnimal(tipo, x) {
    return { tipo: tipo, x: x, y: 0, vx: 0, vy: 0, dir: Math.random() < 0.5 ? -1 : 1, passo: rnd(0, 6), t: rnd(0, 5), anda: rnd(0, 2),
      vel: 0, foge: false, carga: 0, cv: 0, alvoC: null, cd: rnd(0, 2), bica: 0, salta: 0 };
  }

  /* ---------- alvos e tiros ---------- */
  function hostis() {
    const l = [];
    for (const r of robos) if (r.mau) l.push(r);
    if (lobo && lobo.mau) l.push(lobo);
    if (dragao && dragao.mau && !dragao.fugiu && dragao.y > -560) l.push(dragao);
    return l;
  }
  function caixa(e) {
    if (e.kind === 'robo') return e.sub === 'drone' ? { x: e.x, y: e.y, rx: 32, ry: 26 } : { x: e.x, y: e.y - 36, rx: 30, ry: 36 };
    if (e.kind === 'lobo') return { x: e.x, y: e.y - 50, rx: 72, ry: 44 };
    return { x: e.x, y: e.y, rx: 125, ry: 62 };          // o dragão
  }
  function caixaPessoa(p) {
    const k = p.qual === 'pai' ? K_PAI : K_FILHO;
    return { x: p.x, y: p.y - 36 * k, rx: 15 * k, ry: 36 * k };
  }
  function dentro(b, x, y, m) { m = m || 0; return Math.abs(x - b.x) < b.rx + m && Math.abs(y - b.y) < b.ry + m; }
  function alvoPerto(x, y, alcance, frente) {
    let melhor = null, md = 1e9;
    for (const e of hostis()) {
      const b = caixa(e), dx = b.x - x;
      if (frente && dx * frente < -40) continue;
      if (!noEcra(b.x, 60)) continue;
      const d = Math.abs(dx) + Math.abs(b.y - y) * 0.5;
      if (Math.abs(dx) > alcance || d > md) continue;
      md = d; melhor = e;
    }
    return melhor;
  }
  function mira(x, y, e, v) {
    const b = caixa(e), dx = b.x - x, dy = b.y - y, n = Math.hypot(dx, dy) || 1;
    return { vx: dx / n * v, vy: dy / n * v };
  }
  // a seta do Isaac sobe em arco e cai com a gravidade
  function seta(x, y, e, dir) {
    let ang;
    if (e) {
      const b = caixa(e), dx = b.x - x, tvoo = Math.abs(dx) / 980;
      ang = Math.atan2(b.y - 0.5 * G_SETA * tvoo * tvoo - y, dx);
    } else ang = dir < 0 ? Math.PI + 0.1 : -0.1;
    ang += rnd(-0.02, 0.02);
    tiros.push({ tipo: 'seta', x: x, y: y, vx: Math.cos(ang) * 980, vy: Math.sin(ang) * 980, dano: 2, t: 0, vida: 3 });
  }
  function bala(x, y, e, dir, tipo, cor, v, dano) {
    v = v || 1250;
    const m = e ? mira(x, y, e, v) : { vx: dir * v, vy: 0 };
    tiros.push({ tipo: tipo || 'bala', x: x, y: y, vx: m.vx, vy: m.vy, dano: dano || 1, t: 0, vida: 1.2, cor: cor || '#4cc9f0' });
  }
  function maoDe(p) {
    const k = p.qual === 'pai' ? K_PAI : K_FILHO;
    return { x: p.x + p.dir * 27 * k, y: p.y - 47 * k };
  }
  function disparaPessoa(p, auto) {
    const m = maoDe(p);
    const alvo = alvoPerto(m.x, m.y, auto ? 820 : 950, auto ? 0 : p.dir);
    if (auto && !alvo) return false;
    if (alvo) p.dir = caixa(alvo).x > p.x ? 1 : -1;
    const m2 = maoDe(p);
    if (p.qual === 'filho') { seta(m2.x, m2.y, alvo, p.dir); sfx('arco'); }
    else { bala(m2.x + p.dir * 10, m2.y - 4, alvo, p.dir); sfx('pew'); }
    p.arma = 0.18;
    return true;
  }
  function disparaCarro() {
    const car = carro, mx = car.x + car.dir * 80, my = car.y - 50;
    const alvo = alvoPerto(mx, my, 1100, car.dir);
    car.lado = car.lado ? 0 : 1;
    bala(mx, my + (car.lado ? 10 : -12), alvo, car.dir, 'bala', '#ffd166', 1350 + Math.abs(car.vx));
    car.fogo = 0.12;
    sfx('pew');
  }
  // ✨ a espingarda de inteligência artificial: uma bola de luz para cada robô mau que se vê
  function espingarda() {
    if (cdIA > 0 || descansa > 0 || fase !== 'joga') return;
    cdIA = IA_CD;
    const p = carro ? { x: carro.x + carro.dir * 60, y: carro.y - 60 } : maoDe(eu());
    const l = hostis().filter(function (e) { return noEcra(caixa(e).x, 40); }).slice(0, 8);
    const cores = ['#d97757', '#19a37f', '#7b6cff', '#4cc9f0', '#ffd166'];
    if (!l.length) {
      for (let k = -1; k <= 1; k++) tiros.push({ tipo: 'ia', x: p.x, y: p.y, vx: eu().dir * 700, vy: k * 120, dano: 4, t: 0, vida: 1.6, cor: cores[k + 1], alvo: null });
    } else {
      l.forEach(function (e, k) {
        const a = -Math.PI / 2 + (k - (l.length - 1) / 2) * 0.35;
        // a dobrar no dragão e no lobo, que são grandes
        const n = e.kind === 'robo' || e.fugitivo ? 1 : 3;
        for (let j = 0; j < n; j++) tiros.push({ tipo: 'ia', x: p.x, y: p.y, vx: Math.cos(a + j * 0.3) * 520, vy: Math.sin(a + j * 0.3) * 520, dano: 4, t: -j * 0.08, vida: 2.4, cor: cores[(k + j) % cores.length], alvo: e });
      });
    }
    sfx('repulsor'); sfx('zap');
    for (let k = 0; k < 14; k++) parts.push({ x: p.x, y: p.y, vx: rnd(-260, 260), vy: rnd(-260, 120), t: 0, life: rnd(0.4, 0.8), cor: cores[k % 5], r: rnd(3, 6) });
    if (!iaVista) { iaVista = true; G.banner('✨ A espingarda de inteligência artificial!', 2000); fala('Espingarda de inteligência artificial!'); }
    else talvez(0.25, ['Espingarda de inteligência artificial!', 'Toma, robô mau!']);
  }

  /* ---------- acertar: os robôs maus ficam bons ---------- */
  function acerta(e, dano, deAnimal) {
    if (!e.mau) return;
    e.hp -= dano; e.pisca = 0.22;
    const b = caixa(e);
    estrelinhas(b.x, b.y, 4, '#ffd166');
    if (e.hp > 0) { if (!deAnimal) sfx('pop'); return; }
    e.hp = 0;
    if (e.kind === 'robo') {
      e.mau = false; e.festa = 1.4;
      G.addStars(1);
      estrelinhas(b.x, b.y, 12, '#80ffdb');
      texto('💚', b.x, b.y - b.ry - 26);
      sfx('tada');
      talvez(0.3, ['Ficou bonzinho!', 'Vai para a oficina ficar bom!', 'Agora é nosso amigo!']);
    } else if (e.kind === 'lobo') {
      e.mau = false; e.festa = 3; e.kb = 0; e.confuso = 0; e.salta = false;
      G.addStars(10);
      estrelinhas(b.x, b.y, 24, '#80ffdb');
      texto('💚', b.x, b.y - 80);
      sfx('tada');
      G.banner('🐺 O lobo robô ficou bom! Agora guarda as ovelhas 🐑', 3200);
      fala('O lobo robô ficou sem energia e agora é nosso amigo! Vai guardar as ovelhas!');
      faseT = 0;
      for (const r of robos) if (r.mau) { r.hp = 0; r.mau = false; r.festa = 1.4; }
    } else if (e.fugitivo) {
      e.mau = false; e.fugiu = true;
      G.addStars(5);
      sfx('roar');
      G.banner('🐉 Quase! O dragão fugiu para a aldeia dos robôs!', 3000);
      fala('Quase o apanhámos! O dragão fugiu para a aldeia dos robôs! Vamos atrás dele!');
      faseT = 0;
    } else {
      e.mau = false; e.estado = 'aterra'; e.festa = 1;
      G.addStars(25);
      for (const r of robos) if (r.mau) { r.hp = 0; r.mau = false; r.festa = 1.4; }
      maus = [];
      sfx('tada');
      G.banner('🐉 O dragão robô ficou nosso amigo! 🎉', 5000);
      fala('Conseguimos! O dragão robô ficou sem energia e agora é nosso amigo! Viva!');
      fase = 'festa'; faseT = 0;
      setTimeout(function () { if (fase === 'festa') fala(DEDICATORIA_FALA); }, 4200);
    }
  }
  function magoa(dano) {
    if (inv > 0 || descansa > 0 || fase !== 'joga') return;
    coracoes = Math.max(0, coracoes - dano);
    stats.danos[terra] += dano;
    inv = 1.1; G.shake = 0.3;
    sfx('ouch');
    if (carro) carro.bate = 0.4;
    if (coracoes <= 0) {
      descansa = 3;
      stats.descansos[terra]++;
      maus = [];
      G.banner('O pai e o Isaac vão descansar um bocadinho 💤', 2600);
      fala('Estamos cansados. Vamos descansar um bocadinho!');
    }
  }
  function estrelinhas(x, y, n, cor) {
    for (let i = 0; i < n; i++) parts.push({ x: x, y: y, vx: rnd(-220, 220), vy: rnd(-320, -60), t: 0, life: rnd(0.5, 0.9), cor: cor, r: rnd(3, 7) });
  }
  function poeira(x, y) { parts.push({ x: x, y: y, vx: rnd(-60, 60), vy: rnd(-90, -30), t: 0, life: rnd(0.3, 0.6), cor: 'rgba(160,130,90,.6)', r: rnd(5, 9), semGrav: true }); }

  /* ---------- update ---------- */
  S.update = function (dt) {
    dt = Math.min(dt, 1 / 30);
    tempo += dt;
    const I = G.input;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.t += dt; if (!p.semGrav) p.vy += 700 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.t > p.life) parts.splice(i, 1);
    }
    for (let i = textos.length - 1; i >= 0; i--) { textos[i].age += dt; textos[i].y -= 40 * dt; if (textos[i].age > textos[i].life) textos.splice(i, 1); }
    botoes();

    if (fase === 'intro') {
      faseT += dt;
      if (faseT > 4.5 || (faseT > 0.6 && (I.justPressed('fire') || I.justPressed('jump') || I.justPressed('up') || I.justPressed('horn') || I.tap))) {
        fase = 'joga'; faseT = 0;
        G.banner(T().icone + ' ' + T().nome, 2400);
        fala(T().fala);
      }
      return;
    }
    if (fase === 'festa') { festa(dt); return; }
    stats.tempo[terra] += dt;

    if (fase === 'passa') {
      faseT += dt;
      if (carro) { carro.vx = Math.min(CARRO_V * 1.2, carro.vx + 900 * dt); carro.x += carro.vx * dt; carro.roda += carro.vx * dt / 17; pai.x = filho.x = carro.x; }
      else for (const p of [pai, filho]) { p.x += VEL * dt; p.dir = 1; p.passo += dt * 12; p.anda = true; }
      seguirAmigos(dt);
      camara(dt);
      if (faseT > 1.8) comecaTerra(terra + 1);
      return;
    }

    inv = Math.max(0, inv - dt);
    cdIA = Math.max(0, cdIA - dt);
    if (descansa > 0) {
      descansa -= dt;
      if (descansa <= 0) { coracoes = MAXC; inv = 2; sfx('suit'); G.banner('Prontos outra vez! 💪', 1600); }
    }
    if (I.justPressed('chama') && !carro && descansa <= 0) {
      quem = quem === 'pai' ? 'filho' : 'pai';
      sfx('beep');
      G.banner(quem === 'pai' ? '🔫 Agora jogas com o pai' : '🏹 Agora jogas com o Isaac', 1400);
    }
    if (carro) conduz(dt, I); else anda(dt, I);
    if (I.justPressed('horn')) espingarda();
    seguirAmigos(dt);
    amigosDisparam(dt);
    camara(dt);

    atualizaRobos(dt);
    if (lobo) atualizaLobo(dt);
    if (animais.length) atualizaAnimais(dt);
    if (dragao) atualizaDragao(dt);
    atualizaTiros(dt);
    spawns(dt);
    progresso(dt);
  };

  function botoes() {
    const f = document.getElementById('btnFire');
    const ic = carro || quem === 'pai' ? '🔫' : '🏹';
    if (f.textContent !== ic) f.textContent = ic;
    document.body.classList.toggle('dr-ia-espera', cdIA > 0);
    document.body.classList.toggle('dr-carro', !!carro);
  }

  function anda(dt, I) {
    const p = eu(), o = outro(), ax = I.axis().x;
    if (descansa <= 0) {
      p.anda = Math.abs(ax) > 0.1;
      if (p.anda) p.dir = ax > 0 ? 1 : -1;
      p.x += ax * VEL * dt;
      if (p.noChao && p.anda) p.passo += dt * Math.abs(ax) * 12;
      if ((I.justPressed('jump') || I.justPressed('up')) && p.noChao) { p.vy = -SALTO; p.noChao = false; sfx('hop'); o.saltaEm = 0.18; }
      p.cd -= dt;
      if (I.isHeld('fire') && p.cd <= 0) { disparaPessoa(p, false); p.cd = p.qual === 'pai' ? 0.22 : 0.34; }
      // o outro vem atrás de nós e dispara sozinho
      const alvoX = p.x - p.dir * (p.qual === 'pai' ? 80 : 95), d = alvoX - o.x;
      o.anda = Math.abs(d) > 14;
      if (o.anda) { o.x += clamp(d * 4, -VEL * 1.15, VEL * 1.15) * dt; o.dir = d > 0 ? 1 : -1; if (o.noChao) o.passo += dt * 11; }
      if (o.saltaEm >= 0) { o.saltaEm -= dt; if (o.saltaEm < 0 && o.noChao) { o.vy = -SALTO * 0.9; o.noChao = false; } }
      o.cd -= dt;
      if (o.cd <= 0) { o.cd = disparaPessoa(o, true) ? (o.qual === 'pai' ? rnd(0.55, 0.85) : rnd(0.85, 1.25)) : 0.3; }
      if (!o.anda && o.arma <= 0) o.dir = p.dir;
    } else { p.anda = o.anda = false; }
    for (const q of [pai, filho]) {
      q.arma = Math.max(0, q.arma - dt);
      q.vy += GRAV * dt; q.y += q.vy * dt;
      if (q.y >= 0) { q.y = 0; q.vy = 0; q.noChao = true; }
      q.x = clamp(q.x, 60, LEN - 60);
    }
  }
  function conduz(dt, I) {
    const car = carro;
    if (descansa > 0) { car.vx *= 1 - Math.min(1, dt * 3); }
    else {
      const mv = I.axis().x;
      if (Math.abs(mv) > 0.1) car.dir = mv > 0 ? 1 : -1;
      const ac = Math.abs(mv) > 0.1 ? (mv * car.vx < 0 ? 4 : 1.6) : 1.2;
      car.vx += (mv * CARRO_V - car.vx) * Math.min(1, dt * ac);
      if ((I.justPressed('jump') || I.justPressed('up')) && car.noChao) { car.vy = -780; car.noChao = false; sfx('hop'); }
      car.cd -= dt;
      if (I.isHeld('fire') && car.cd <= 0) { disparaCarro(); car.cd = 0.24; }
    }
    car.vy += GRAV * dt; car.x += car.vx * dt; car.y += car.vy * dt;
    if (car.y >= 0) { car.y = 0; car.vy = 0; car.noChao = true; }
    if (car.x < 120 || car.x > LEN - 120) { car.x = clamp(car.x, 120, LEN - 120); car.vx = 0; }
    car.roda += car.vx * dt / 17;
    car.fogo = Math.max(0, car.fogo - dt); car.bate = Math.max(0, car.bate - dt);
    if (Math.abs(car.vx) > 600 && Math.random() < dt * 25) parts.push({ x: car.x - car.dir * 100, y: car.y - 20, vx: -car.dir * rnd(40, 120), vy: rnd(-60, -10), t: 0, life: rnd(0.25, 0.45), cor: Math.random() < 0.5 ? '#ffd166' : '#f77f00', r: rnd(3, 6), semGrav: true });
    pai.x = filho.x = car.x; pai.y = filho.y = car.y; pai.dir = filho.dir = car.dir;
  }
  function camara(dt) {
    const fx = carro ? carro.x + carro.dir * 160 : eu().x;
    const quer = clamp(fx - vw() * (carro ? 0.3 : 0.4), 0, Math.max(0, LEN - vw()));
    camX += (quer - camX) * Math.min(1, dt * (carro ? 6 : 4));
  }

  /* ---------- os amigos robôs: Claude, ChatGPT e Gemini ---------- */
  function seguirAmigos(dt) {
    const p = eu();
    const fx = carro ? carro.x : p.x, fy = carro ? carro.y - 40 : p.y - 60, dir = carro ? carro.dir : p.dir;
    for (const a of amigos) {
      // voam um bocadinho atrás e por cima de nós
      const tx = fx + dir * a.def.ox, ty = fy + a.def.oy;
      a.x += (carro ? carro.vx * dt : 0) + (tx - a.x) * Math.min(1, dt * 3.2);
      a.y += (ty - a.y) * Math.min(1, dt * 3.2);
      a.fogo = Math.max(0, a.fogo - dt); a.festa = Math.max(0, a.festa - dt);
      if (a.fogo <= 0) a.dir = dir;
    }
  }
  function amigosDisparam(dt) {
    if (descansa > 0) return;
    for (const a of amigos) {
      a.cd -= dt;
      if (a.cd > 0) continue;
      const alvo = alvoPerto(a.x, a.y, 860, 0);
      if (!alvo) { a.cd = 0.4; continue; }
      a.dir = caixa(alvo).x > a.x ? 1 : -1;
      for (let k = 0; k < a.def.tiros; k++) bala(a.x + a.dir * 24, a.y - 4 + k * 10, alvo, a.dir, 'laser', a.def.cor, 1050, 1);
      a.fogo = 0.25;
      sfx('zap');
      a.cd = rnd(a.def.cd[0], a.def.cd[1]);
    }
    // o Claude, de vez em quando, traz um coração
    cdClaude -= dt;
    if (cdClaude <= 0) {
      if (coracoes < MAXC) {
        coracoes = Math.min(MAXC, coracoes + 1);
        const c = amigos[0];
        texto('❤️', c.x, c.y - 50);
        estrelinhas(c.x, c.y, 8, '#ff6b8b');
        sfx('heart');
        talvez(0.4, ['O Claude trouxe um coração!', 'Obrigado, Claude!']);
      }
      cdClaude = T().facil ? 12 : 18;
    }
  }

  /* ---------- os robozinhos do dragão ---------- */
  function alvoMau() {
    if (carro) return { x: carro.x, y: carro.y - 40 };
    const p = Math.random() < 0.6 ? eu() : outro(), b = caixaPessoa(p);
    return { x: b.x + p.dir * rnd(0, 40), y: b.y };
  }
  function tiroMau(x, y, tipo, v, dano, alvo, espalha) {
    alvo = alvo || alvoMau();
    let ang = Math.atan2(alvo.y - y, alvo.x - x) + rnd(-espalha, espalha);
    maus.push({ tipo: tipo, x: x, y: y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, dano: dano, t: 0 });
  }
  function atualizaRobos(dt) {
    const p = carro || eu(), d = D();
    for (const e of robos) {
      e.t += dt; e.pisca = Math.max(0, e.pisca - dt); e.festa = Math.max(0, e.festa - dt);
      if (!e.mau) {
        // ficou bom: dá um saltinho de alegria e vai para a oficina
        if (e.festa <= 0) {
          e.dir = -1;
          if (e.sub === 'drone') { e.y -= 220 * dt; e.x -= 60 * dt; } else { e.x -= 230 * dt; e.passo += dt * 10; }
        }
        continue;
      }
      const dx = p.x - e.x, longe = Math.abs(dx);
      e.dir = dx > 0 ? 1 : -1;
      if (longe > vw() * 0.95) continue;               // ainda não nos viu
      if (carro) {
        if (e.sub === 'rodas') { e.x -= 70 * dt; e.passo += dt * 4; }
        else { e.y = e.by + Math.sin(e.t * 2) * 18; }
        if (e.sub === 'rodas' && Math.abs(carro.x - e.x) < 110 && carro.y > -60) {   // o carro dá-lhe um toque: fica bom
          acerta(e, 99, true); sfx('boing');
          continue;
        }
      } else if (e.sub === 'rodas') {
        const quer = longe > 470 ? e.dir * (T().facil ? 110 : 170) : (longe < 260 ? -e.dir * 120 : Math.sin(e.t * 1.3) * 70);
        e.vx += (quer - e.vx) * Math.min(1, dt * 3);
        e.x += e.vx * dt; e.passo += e.vx * dt / 14;
      } else {
        const qx = p.x - e.dir * 280 + Math.sin(e.t * 0.7) * 120;
        e.x += clamp(qx - e.x, -150, 150) * dt * (T().facil ? 0.6 : 1);
        e.y = e.by + Math.sin(e.t * 2) * 20;
      }
      e.x = clamp(e.x, 60, LEN - 60);
      if (descansa > 0 || !noEcra(e.x, -20)) continue;
      e.cd -= dt;
      if (e.cd <= 0) {
        const b = caixa(e);
        tiroMau(b.x + e.dir * 20, b.y - (e.sub === 'drone' ? -10 : 14), 'faisca', d.vTiro + (ronda - 1) * 40, d.dano, null, 0.04);
        e.cd = rnd(d.cd[0], d.cd[1]) / (1 + (ronda - 1) * 0.15);
        sfx('beep');
      }
    }
    robos = robos.filter(function (e) { return e.mau || (e.x > camX - 300 && e.y > -vh() - 200); });
  }
  // na aldeia o dragão manda mais robozinhos (são muitos e difíceis)
  function spawns(dt) {
    if (terra < 2 || descansa > 0) return;
    if (terra === 2 && !(lobo && lobo.mau)) return;
    if (terra === 3 && !(dragao && dragao.mau)) return;
    spawnT -= dt;
    const vivos = robos.filter(function (r) { return r.mau; }).length;
    const cap = (terra === 2 ? 6 : 4) + (ronda - 1);
    if (spawnT <= 0 && vivos < cap) {
      const lado = Math.random() < 0.5 ? -1 : 1;
      const x = clamp(eu().x + lado * (vw() * 0.55 + 60), 80, LEN - 80);
      const r = novoRobo(Math.random() < 0.45 ? 'drone' : 'rodas', x);
      if (r.sub === 'drone') r.y = -vh();
      robos.push(r);
      spawnT = terra === 2 ? rnd(3.5, 5) : rnd(5.5, 7.5);
    }
  }

  /* ---------- o lobo robô: quer as galinhas, os patos e os porcos, mas nunca apanha nenhum ---------- */
  function animalPerto(x, tipos) {
    let m = null, md = 1e9;
    for (const a of animais) {
      if (tipos.indexOf(a.tipo) < 0 || a.foge) continue;
      const d = Math.abs(a.x - x);
      if (d < md) { md = d; m = a; }
    }
    return m;
  }
  function atualizaLobo(dt) {
    const L = lobo;
    L.pisca = Math.max(0, L.pisca - dt); L.festa = Math.max(0, L.festa - dt); L.uivo = Math.max(0, L.uivo - dt);
    L.vy += GRAV * dt; L.y += L.vy * dt;
    if (L.y >= 0) { L.y = 0; L.vy = 0; L.salta = false; }
    if (!L.mau) {
      // o cão pastor: fica ao pé das ovelhas e, quando o dragão chega, ajuda com o laser
      const ov = animalPerto(L.x, ['ovelha']);
      const tx = dragao && dragao.mau ? eu().x + 180 : (ov ? ov.x + 70 : L.x);
      const d = tx - L.x;
      if (Math.abs(d) > 30) { L.x += clamp(d * 2, -240, 240) * dt; L.dir = d > 0 ? 1 : -1; L.passo += dt * 10; }
      if (dragao && dragao.mau && descansa <= 0) {
        L.cd -= dt;
        if (L.cd <= 0) {
          L.dir = dragao.x > L.x ? 1 : -1;
          bala(L.x + L.dir * 80, -80, dragao, L.dir, 'laser', '#80ffdb', 900, 1);
          L.cd = rnd(2.2, 3);
        }
      }
      return;
    }
    if (L.kb) {                                    // a voar com a cornada
      L.x += L.kb * dt; L.kb *= 1 - Math.min(1, dt * 3.5);
      if (Math.abs(L.kb) < 40) L.kb = 0;
      L.passo += dt * 4;
    } else if (L.confuso > 0) {
      L.confuso -= dt;
    } else if (L.estado === 'caca') {
      L.estT -= dt;
      if (!L.alvo || L.alvo.foge) L.alvo = animalPerto(L.x, ['galinha', 'pato', 'porco']);
      const a = L.alvo;
      if (a) {
        const dx = a.x - L.x;
        L.dir = dx > 0 ? 1 : -1;
        L.x += L.dir * (300 + (ronda - 1) * 30) * dt; L.passo += dt * 15;
        if (Math.abs(dx) < 80) {
          if (a.tipo === 'porco') cornada(a, L);
          else escapa(a, L);
        }
      }
      if (L.estT <= 0) { L.estado = 'ataca'; L.estT = rnd(5, 7); L.uivo = 1; sfx('uivo'); }
    } else {
      // vem atrás de nós: salta e dispara o laser dos olhos
      L.estT -= dt;
      const p = eu(), dx = p.x - L.x, d = Math.abs(dx);
      if (!L.salta) L.dir = dx > 0 ? 1 : -1;
      if (L.salta) L.x += L.svx * dt;
      else if (d > 300) { L.x += L.dir * 290 * dt; L.passo += dt * 14; }
      else if (d < 170) { L.x -= L.dir * 200 * dt; L.passo += dt * 10; }
      if (descansa <= 0 && noEcra(L.x, -40)) {
        L.cd -= dt;
        if (L.cd <= 0) {
          if (!L.salta && d < 420 && Math.random() < 0.38) {
            L.vy = -760; L.salta = true; L.svx = L.dir * clamp(d * 1.1, 200, 460); sfx('uivo');
          } else {
            const ox = L.x + L.dir * 86, oy = L.y - 86;
            tiroMau(ox, oy, 'laser', 640 + (ronda - 1) * 40, 0.5, null, 0.03);
            if (L.hp < L.max / 2) tiroMau(ox, oy, 'laser', 600, 0.5, null, 0.12);
            sfx('zap');
          }
          L.cd = rnd(1.0, 1.5) / (1 + (ronda - 1) * 0.15);
        }
      }
      if (L.salta) {
        const b = caixa(L);
        for (const q of [pai, filho]) if (dentro(caixaPessoa(q), b.x, b.y, 50)) { magoa(0.5); break; }
      }
      if (L.estT <= 0 && !L.salta) { L.estado = 'caca'; L.estT = rnd(5, 7); L.alvo = null; }
    }
    L.x = clamp(L.x, 80, LEN - 80);
  }
  function escapa(a, L) {
    a.foge = true; a.vy = -720; a.vx = (a.x >= L.x ? 1 : -1) * rnd(380, 480);
    if (a.x + a.vx * 0.65 > LEN - 100 || a.x + a.vx * 0.65 < 100) a.vx = -a.vx;
    a.y = -1;
    L.confuso = 1.1; L.alvo = null;
    stats.fugas++;
    texto(a.tipo === 'pato' ? 'quá!' : 'có-có!', a.x, a.y - 50, '#7a4a00');
    sfx(a.tipo === 'pato' ? 'quack' : 'guincho');
    for (let k = 0; k < 6; k++) parts.push({ x: a.x, y: a.y - 20, vx: rnd(-120, 120), vy: rnd(-200, -40), t: 0, life: rnd(0.6, 1), cor: '#fff', r: rnd(3, 5) });
    talvez(0.3, a.tipo === 'pato' ? ['O pato voou! O lobo não o apanhou!'] : ['A galinha fugiu! O lobo não a apanhou!']);
  }
  function cornada(a, alvo) {
    a.carga = 0; a.cd = a.tipo === 'touro' ? 9 : 6;
    a.salta = 0.4;
    const forte = a.tipo === 'touro';
    if (alvo.kind === 'lobo') {
      alvo.kb = (alvo.x >= a.x ? 1 : -1) * (forte ? 1100 : 800); alvo.confuso = forte ? 1.4 : 0.9; alvo.vy = -420; alvo.alvo = null; alvo.salta = false;
      if (alvo.estado === 'caca') alvo.estT = Math.min(alvo.estT, 1);
    }
    stats.cornadas++;
    acerta(alvo, forte ? 6 : 3, true);
    const b = caixa(alvo);
    texto(forte ? 'CORNADA DO TOURO!' : 'CORNADA!', b.x, b.y - b.ry - 20, '#9d0208');
    sfx('smash'); G.shake = Math.max(G.shake, 0.25);
    estrelinhas(b.x, b.y, 8, '#ffd166');
    if (alvo.kind === 'lobo') talvez(0.35, forte ? ['Olé! O touro deu uma cornada ao lobo!'] : ['Cornada do porco bravo!', 'Os porcos não deixam!']);
    else if (alvo.kind === 'dragao') talvez(0.5, ['O touro deu uma cornada ao dragão!']);
  }

  /* ---------- os animais da aldeia ---------- */
  function atualizaAnimais(dt) {
    const L = lobo && lobo.mau ? lobo : null;
    for (const a of animais) {
      a.t += dt; a.cd -= dt; a.salta = Math.max(0, a.salta - dt); a.bica = Math.max(0, a.bica - dt);
      const forte = a.tipo === 'porco' || a.tipo === 'touro';
      if (a.foge) {                                 // a voar para longe do lobo
        a.vy += GRAV * 0.55 * dt; a.x += a.vx * dt; a.y += a.vy * dt; a.passo += dt * 30;
        if (a.y >= 0) { a.y = 0; a.vy = 0; a.vx = 0; a.foge = false; }
        a.x = clamp(a.x, 60, LEN - 60);
        continue;
      }
      if (a.carga > 0) {                            // em carga contra o lobo, o dragão ou um robô
        a.carga -= dt; a.x += a.cv * dt; a.passo += dt * 22;
        if (Math.random() < dt * 20) poeira(a.x - a.dir * 30, -6);
        const e = a.alvoC;
        if (!e || !e.mau) a.carga = 0;
        else {
          const b = caixa(e);
          if (Math.abs(b.x - a.x) < b.rx * 0.6 + (a.tipo === 'touro' ? 50 : 30) && b.y + b.ry > -150) cornada(a, e);
        }
        if (a.carga <= 0) a.cv = 0;
        a.x = clamp(a.x, 60, LEN - 60);
        continue;
      }
      // os porcos bravos e o touro atacam quem quer fazer mal
      if (forte && a.cd <= 0) {
        const alc = a.tipo === 'touro' ? 650 : 300;
        let alvo = null;
        if (L && Math.abs(L.x - a.x) < alc) alvo = L;
        else if (a.tipo === 'touro' && dragao && dragao.mau && dragao.y > -190 && Math.abs(dragao.x - a.x) < alc) alvo = dragao;
        else for (const r of robos) if (r.mau && r.sub === 'rodas' && Math.abs(r.x - a.x) < alc * 0.7) { alvo = r; break; }
        if (alvo) {
          a.alvoC = alvo; a.dir = alvo.x > a.x ? 1 : -1;
          a.cv = a.dir * (a.tipo === 'touro' ? 680 : 540); a.carga = a.tipo === 'touro' ? 1.4 : 1;
          sfx(a.tipo === 'touro' ? 'camelo' : 'bicho');
          texto(a.tipo === 'touro' ? '💨' : '❗', a.x, -90);
          continue;
        }
      }
      // os outros fogem do lobo
      if (L && !forte && Math.abs(L.x - a.x) < 210) {
        a.dir = a.x > L.x ? 1 : -1; a.x += a.dir * 170 * dt; a.passo += dt * 16;
      } else {
        // passeiam e bicam o chão
        a.anda -= dt;
        if (a.anda <= 0) {
          a.anda = rnd(1, 3);
          a.vel = Math.random() < 0.4 ? 0 : (a.tipo === 'touro' ? 40 : 55);
          if (Math.random() < 0.5) a.dir = -a.dir;
          if ((a.tipo === 'galinha' || a.tipo === 'pato') && a.vel === 0) a.bica = 0.8;
        }
        a.x += a.dir * a.vel * dt; if (a.vel) a.passo += dt * 8;
      }
      if (a.x < 80) a.dir = 1;
      if (a.x > LEN - 80) a.dir = -1;
      a.x = clamp(a.x, 60, LEN - 60);
    }
  }

  /* ---------- o dragão robô ---------- */
  function atualizaDragao(dt) {
    const Dg = dragao;
    Dg.t += dt; Dg.pisca = Math.max(0, Dg.pisca - dt);
    if (Dg.fugitivo) {
      if (Dg.fugiu) { Dg.x += 900 * dt; Dg.y -= 160 * dt; Dg.dir = 1; return; }
      // vai sempre à frente do carro, a olhar para trás, e às vezes atira uma bola de fogo
      const tx = carro.x + vw() * 0.45;
      Dg.x += carro.vx * dt + (tx - Dg.x) * Math.min(1, dt * 1.5);
      Dg.sobeT -= dt;
      if (Dg.sobeT < -2.5) Dg.sobeT = rnd(5, 7);
      const alto = Dg.sobeT < 0 ? -760 : -ceuY() + Math.sin(Dg.t * 1.4) * 40;   // às vezes foge lá para cima
      Dg.y += (alto - Dg.y) * Math.min(1, dt * 2.5);
      Dg.dir = -1;
      if (descansa <= 0) {
        Dg.cd -= dt;
        if (Dg.cd <= 0) { tiroMau(Dg.x - 110, Dg.y + 10, 'fogo', 380, 0.5, null, 0.05); Dg.cd = rnd(3.2, 4.4); sfx('roar'); }
      }
      return;
    }
    if (!Dg.mau) return;
    const p = eu();
    if (Dg.chega > 0) { Dg.chega -= dt * 0.5; }
    if (Dg.estado === 'voa') {
      const tx = p.x + Math.sin(Dg.t * 0.45) * 330;
      Dg.x += (tx - Dg.x) * Math.min(1, dt * 0.9);
      Dg.y += (-ceuY() + Math.sin(Dg.t * 1.7) * 40 - Dg.y) * Math.min(1, dt * 2);
      Dg.dir = p.x > Dg.x ? 1 : -1;
      if (descansa <= 0) {
        Dg.cd -= dt; Dg.mergT -= dt;
        if (Dg.cd <= 0) {
          const n = 3 + (Dg.hp < Dg.max / 2 ? 1 : 0) + (ronda > 1 ? 1 : 0);
          const bx = Dg.x + Dg.dir * 120, by = Dg.y + 10, al = alvoMau();
          for (let k = 0; k < n; k++) {
            const a = Math.atan2(al.y - by, al.x - bx) + (k - (n - 1) / 2) * 0.16;
            maus.push({ tipo: 'fogo', x: bx, y: by, vx: Math.cos(a) * (500 + (ronda - 1) * 40), vy: Math.sin(a) * (500 + (ronda - 1) * 40), dano: 0.5, t: 0 });
          }
          Dg.cd = rnd(1.8, 2.5) / (1 + (ronda - 1) * 0.12);
          sfx('roar');
        }
        if (Dg.mergT <= 0) {
          Dg.estado = 'mergulho'; Dg.lado = p.x > Dg.x ? 1 : -1; Dg.mx = p.x + Dg.lado * 560; Dg.mergT = rnd(8, 10); Dg.dir = Dg.lado;
          sfx('whoosh'); talvez(0.4, ['Cuidado! O dragão vem a voar baixinho!', 'Salta!']);
        }
      }
    } else if (Dg.estado === 'mergulho') {
      Dg.x += Dg.lado * 620 * dt;
      const falta = (Dg.mx - Dg.x) * Dg.lado;
      Dg.y += ((falta > 260 ? -95 : -ceuY()) - Dg.y) * Math.min(1, dt * 2.4);
      if (falta <= 0 || Dg.x < 100 || Dg.x > LEN - 100) Dg.estado = 'voa';
      if (Dg.y > -200) {
        const b = caixa(Dg);
        for (const q of [pai, filho]) { const c = caixaPessoa(q); if (Math.abs(c.x - b.x) < b.rx * 0.8 + c.rx && Math.abs(c.y - b.y) < b.ry * 0.7 + c.ry) { magoa(1); break; } }
      }
    }
    Dg.x = clamp(Dg.x, 100, LEN - 100);
  }

  /* ---------- os tiros ---------- */
  function atualizaTiros(dt) {
    const hs = hostis();
    for (let i = tiros.length - 1; i >= 0; i--) {
      const s = tiros[i];
      s.t += dt;
      if (s.t < 0) continue;
      if (s.tipo === 'seta') s.vy += G_SETA * dt;
      if (s.tipo === 'ia') {                          // a bola de IA vai sozinha ao alvo
        if (!s.alvo || !s.alvo.mau) s.alvo = alvoPerto(s.x, s.y, 1200, 0);
        if (s.alvo) {
          const b = caixa(s.alvo), dx = b.x - s.x, dy = b.y - s.y, n = Math.hypot(dx, dy) || 1, v = 900;
          s.vx += (dx / n * v - s.vx) * Math.min(1, dt * 5); s.vy += (dy / n * v - s.vy) * Math.min(1, dt * 5);
        }
        if (Math.random() < dt * 40) parts.push({ x: s.x, y: s.y, vx: 0, vy: 0, t: 0, life: 0.3, cor: s.cor, r: 4, semGrav: true });
      }
      s.x += s.vx * dt; s.y += s.vy * dt;
      let fora = s.t > s.vida || s.y > 2;
      if (!fora) for (const e of hs) {
        if (!e.mau) continue;
        if (dentro(caixa(e), s.x, s.y, s.tipo === 'ia' ? 10 : 0)) { acerta(e, s.dano); fora = true; break; }
      }
      if (fora) tiros.splice(i, 1);
    }
    for (let i = maus.length - 1; i >= 0; i--) {
      const s = maus[i];
      if (!s) continue;                        // ficámos sem corações: os tiros maus acabaram todos
      s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.tipo === 'fogo') s.vy += 120 * dt;
      let fora = s.t > 4 || s.y > 4;
      if (!fora) {
        if (carro) { if (dentro({ x: carro.x, y: carro.y - 40, rx: 92, ry: 40 }, s.x, s.y)) { magoa(s.dano); fora = true; } }
        else for (const q of [pai, filho]) if (dentro(caixaPessoa(q), s.x, s.y, 4)) { magoa(s.dano); fora = true; break; }
      }
      if (fora) { if (s.y > 4) poeira(s.x, -4); if (maus[i] === s) maus.splice(i, 1); }
    }
  }

  /* ---------- quando se passa para a terra seguinte ---------- */
  function progresso(dt) {
    if (terra === 0) {
      voo -= dt;
      if (voo <= 0) { voo = rnd(14, 20); if (!S._viu) { S._viu = true; G.banner('🐉 Olha! O dragão robô lá ao longe!', 2200); fala('Olha! O dragão robô lá ao longe!'); } S._voo = 0; }
      if (S._voo !== undefined && S._voo !== null) { S._voo += dt; if (S._voo > 9) S._voo = null; }
      if (eu().x > parque - 90 && descansa <= 0) {
        fase = 'passa'; faseT = 0; sfx('door'); sfx('vroom');
        G.banner('🏎️ Ao carro de corrida!', 1800);
      }
    } else if (terra === 1) {
      if (dragao.fugiu) faseT += dt;
      if (!dragao.fugiu && carro.x > LEN - 600) acerta(dragao, 999, true);
      if (dragao.fugiu && faseT > 3) { fase = 'passa'; faseT = 0; sfx('vroom'); }
    } else if (terra === 2) {
      if (!lobo.mau) { faseT += dt; if (faseT > 4.5) comecaTerra(3); }
    }
  }

  /* ---------- a festa ---------- */
  function festa(dt) {
    faseT += dt;
    const Dg = dragao, p = eu();
    // o dragão aterra ao pé de nós, todo contente
    const tx = clamp(p.x + 300, 200, LEN - 200);
    Dg.x += (tx - Dg.x) * Math.min(1, dt * 1.5);
    Dg.y += (-70 - Dg.y) * Math.min(1, dt * 1.5);
    Dg.dir = -1; Dg.t += dt;
    for (const q of [pai, filho]) {
      q.vy += GRAV * dt; q.y += q.vy * dt;
      if (q.y >= 0) { q.y = 0; q.vy = Math.random() < 0.02 ? -600 : 0; q.noChao = q.vy === 0; }
    }
    for (const a of animais) { a.t += dt; if (a.salta <= 0 && Math.random() < dt * 0.5) a.salta = 0.5; a.salta = Math.max(0, a.salta - dt); }
    if (lobo) lobo.festa = 1;
    seguirAmigos(dt);
    for (const a of amigos) a.festa = 1;
    atualizaRobos(dt);
    camara(dt);
    if (Math.random() < dt * 5) fogo(camX + rnd(100, vw() - 100), rnd(-vh() * 0.75, -vh() * 0.4));
    if (G.input.justPressed('fire')) fogo(eu().x + rnd(-200, 200), rnd(-vh() * 0.7, -vh() * 0.4));
    if (faseT > 22) {
      ronda++;
      comecaTerra(0);
      G.banner('🐉 Outra aventura! Agora é mais difícil', 2600);
    }
  }
  function fogo(x, y) {
    const cor = ['#ffd166', '#4cc9f0', '#ff6fb1', '#8ac926', '#ffffff', '#d97757'][Math.floor(rnd(0, 6))];
    for (let i = 0; i < 20; i++) {
      const a = i / 20 * TAU;
      parts.push({ x: x, y: y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, t: 0, life: 1.1, cor: cor, r: 5 });
    }
    sfx('pop');
  }

  /* ================= desenhar ================= */
  S.draw = function (c, t) {
    const vs = vscale(), W = vw(), H = vh(), chao = chaoY();
    c.save(); c.scale(vs, vs);
    fundo(c, W, H, chao, t);
    c.save(); c.translate(-camX, chao);
    mundo(c, t);
    if (parque) carroCorrida(c, { x: parque, y: 0, dir: 1, roda: 0, fogo: 0, bate: 0, vazio: true }, t);
    for (const a of animais) desenhaAnimal(c, a, t);
    if (lobo) desenhaLobo(c, lobo, t);
    for (const e of robos) desenhaRobo(c, e, t);
    if (carro) carroCorrida(c, carro, t);
    else {
      desenhaPessoa(c, outro(), t, false);
      desenhaPessoa(c, eu(), t, true);
    }
    if (dragao) desenhaDragao(c, dragao, t);
    for (const a of amigos) desenhaAmigo(c, a, t);
    for (const s of tiros) desenhaTiro(c, s, t);
    for (const s of maus) desenhaMau(c, s, t);
    for (const p of parts) { c.globalAlpha = Math.max(0, 1 - p.t / p.life); c.fillStyle = p.cor; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); }
    c.globalAlpha = 1;
    for (const tx of textos) {
      c.globalAlpha = Math.max(0, 1 - tx.age / tx.life);
      if (tx.cor) G.gfx.label(c, tx.t, tx.x, tx.y, 24, tx.cor, 'center');
      else { c.font = '34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000'; c.fillText(tx.t, tx.x, tx.y); }
    }
    c.globalAlpha = 1;
    c.restore();
    c.restore();
    hud(c, t);
    if (fase === 'intro') cartao(c, t, Math.min(1, faseT * 3) * Math.min(1, (4.5 - faseT) * 2), false);
    if (fase === 'festa' && faseT > 2.5) cartao(c, t, Math.min(1, (faseT - 2.5) * 1.5), true);
  };

  /* ---------- o fundo: campos, estrada e a aldeia no meio de Espanha ---------- */
  function rep(W, par, passo, fn) {
    const off = camX * par, i0 = Math.floor((off - 400) / passo), i1 = Math.ceil((off + W + 400) / passo);
    for (let i = i0; i <= i1; i++) fn(i * passo - off + h01(i * 7) * passo * 0.4, i);
  }
  function fundo(c, W, H, chao, t) {
    const d = T();
    const g = c.createLinearGradient(0, 0, 0, chao);
    g.addColorStop(0, d.ceu[0]); g.addColorStop(1, d.ceu[1]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,214,10,.9)'; c.beginPath(); c.arc(W * 0.82, H * 0.14, 40, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,214,10,.25)'; c.beginPath(); c.arc(W * 0.82, H * 0.14, 62, 0, TAU); c.fill();
    for (let i = 0; i < 5; i++) {
      const x = ((i * 380 - camX * 0.1 + t * 12) % (W + 400) + W + 400) % (W + 400) - 200;
      G.gfx.cloud(c, x, H * (0.1 + h01(i) * 0.14), 0.9 + h01(i + 5) * 0.5, 0.85);
    }
    // o dragão lá ao longe, a atravessar o céu (só no caminho dos campos)
    if (terra === 0 && S._voo !== undefined && S._voo !== null) {
      const k = S._voo / 9;
      c.save(); c.translate(W * (1.1 - k * 1.3), chao * 0.3 + Math.sin(k * 9) * 20); c.scale(-0.28, 0.28);
      dragaoCorpo(c, t, true, false, 1);
      c.restore();
    }
    // montes e os moinhos de vento lá em cima (como os de La Mancha)
    rep(W, 0.15, 560, function (x, i) {
      const alt = 120 + h01(i) * 90;
      c.fillStyle = d.monte;
      c.beginPath(); c.moveTo(x - 340, chao); c.quadraticCurveTo(x, chao - alt * 2, x + 340, chao); c.fill();
      if (h01(i + 2) < 0.6) moinho(c, x + (h01(i + 4) - 0.5) * 100, chao - alt * 0.98, 0.55, t + i);
    });
    // mais perto: oliveiras e searas, girassóis e placas, ou as casinhas brancas da aldeia
    rep(W, 0.5, 260, function (x, i) {
      const k = h01(i + 11);
      if (terra === 0) { if (k < 0.55) oliveira(c, x, chao - 18); else fardo(c, x, chao - 18); }
      else if (terra === 1) { if (k < 0.5) girassois(c, x, chao - 26, t); else if (k < 0.75) oliveira(c, x, chao - 26); else moinho(c, x, chao - 30, 0.8, t + i); }
      else { if (k < 0.12) igreja(c, x, chao - 20, t); else if (k < 0.75) casinha(c, x, chao - 20, i); else oliveira(c, x, chao - 20); }
    });
    c.fillStyle = d.chao; c.fillRect(0, chao - 24, W, H - chao + 24);
    if (terra === 1) {
      c.fillStyle = '#495057'; c.fillRect(0, chao - 8, W, 40);
      c.fillStyle = '#f8f9fa';
      for (let x = -(camX % 90); x < W; x += 90) c.fillRect(x, chao + 10, 44, 5);
    } else {
      c.fillStyle = d.caminho; c.fillRect(0, chao - 6, W, 30);
      c.fillStyle = 'rgba(0,0,0,.08)';
      for (let x = -(camX % 60); x < W; x += 60) c.fillRect(x, chao + 6, 22, 5);
    }
  }
  function moinho(c, x, y, k, t) {
    c.save(); c.translate(x, y); c.scale(k, k);
    c.fillStyle = '#fbfbf6'; c.beginPath(); c.moveTo(-26, 0); c.lineTo(-20, -96); c.lineTo(20, -96); c.lineTo(26, 0); c.fill();
    c.fillStyle = '#343a40'; c.beginPath(); c.moveTo(-24, -94); c.lineTo(0, -124); c.lineTo(24, -94); c.fill();
    c.fillStyle = '#495057'; c.fillRect(-6, -30, 12, 30); c.fillRect(-4, -70, 8, 10);
    c.save(); c.translate(0, -100); c.rotate(t * 0.9);
    for (let j = 0; j < 4; j++) {
      c.rotate(TAU / 4);
      c.fillStyle = '#6b4226'; c.fillRect(-2, 0, 4, 66);
      c.strokeStyle = 'rgba(80,60,40,.8)'; c.lineWidth = 1.5; c.strokeRect(2, 14, 14, 50);
      c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(2, 14, 14, 50);
    }
    c.restore();
    c.fillStyle = '#212529'; c.beginPath(); c.arc(0, -100, 5, 0, TAU); c.fill();
    c.restore();
  }
  function oliveira(c, x, y) {
    c.fillStyle = '#6f5a3e';
    c.beginPath(); c.moveTo(x - 9, y); c.quadraticCurveTo(x - 2, y - 30, x - 12, y - 52); c.lineTo(x + 2, y - 52); c.quadraticCurveTo(x + 10, y - 26, x + 9, y); c.fill();
    c.fillStyle = '#7d8f5a';
    c.beginPath(); c.ellipse(x - 4, y - 66, 46, 26, 0, 0, TAU); c.fill();
    c.fillStyle = '#93a56b';
    c.beginPath(); c.ellipse(x + 14, y - 74, 26, 16, 0, 0, TAU); c.ellipse(x - 26, y - 62, 22, 14, 0, 0, TAU); c.fill();
  }
  function fardo(c, x, y) {
    c.fillStyle = '#e9c46a'; c.beginPath(); c.arc(x, y - 22, 24, 0, TAU); c.fill();
    c.strokeStyle = '#c99a2e'; c.lineWidth = 2; c.beginPath(); c.arc(x, y - 22, 14, 0, TAU); c.stroke(); c.beginPath(); c.arc(x, y - 22, 6, 0, TAU); c.stroke();
  }
  function girassois(c, x, y, t) {
    for (let k = 0; k < 3; k++) {
      const gx = x + k * 26 - 26, gy = y - 40 - (k % 2) * 12;
      c.strokeStyle = '#588157'; c.lineWidth = 3; c.beginPath(); c.moveTo(gx, y); c.lineTo(gx, gy); c.stroke();
      c.fillStyle = '#ffd60a';
      for (let j = 0; j < 8; j++) { const a = j / 8 * TAU + Math.sin(t + k) * 0.1; c.beginPath(); c.ellipse(gx + Math.cos(a) * 9, gy + Math.sin(a) * 9, 6, 3, a, 0, TAU); c.fill(); }
      c.fillStyle = '#6f4518'; c.beginPath(); c.arc(gx, gy, 6, 0, TAU); c.fill();
    }
  }
  // as casinhas brancas com telhado de telha
  function casinha(c, x, y, i) {
    const w = 90 + h01(i + 1) * 40, h = 60 + h01(i + 2) * 30;
    c.fillStyle = '#fbf8f0'; c.fillRect(x - w / 2, y - h, w, h);
    c.fillStyle = '#c8553d'; c.beginPath(); c.moveTo(x - w / 2 - 10, y - h + 2); c.lineTo(x - w / 2 + 14, y - h - 26); c.lineTo(x + w / 2 - 14, y - h - 26); c.lineTo(x + w / 2 + 10, y - h + 2); c.fill();
    c.strokeStyle = 'rgba(120,40,20,.35)'; c.lineWidth = 2;
    for (let k = x - w / 2; k < x + w / 2; k += 12) { c.beginPath(); c.moveTo(k, y - h); c.lineTo(k + 6, y - h - 22); c.stroke(); }
    const verde = h01(i + 3) < 0.5;
    c.fillStyle = '#6b4226'; G.gfx.rr(c, x - 12, y - 40, 24, 40, 10); c.fill();
    c.fillStyle = verde ? '#2a9d8f' : '#2b6cb0';
    c.fillRect(x + w / 2 - 34, y - h + 14, 9, 18); c.fillRect(x + w / 2 - 14, y - h + 14, 9, 18);
    c.fillStyle = '#343a40'; c.fillRect(x + w / 2 - 25, y - h + 14, 11, 18);
    if (h01(i + 6) < 0.5) {                    // vasos de flores à janela
      c.fillStyle = '#e63946'; c.beginPath(); c.arc(x - w / 2 + 18, y - h + 26, 5, 0, TAU); c.arc(x - w / 2 + 28, y - h + 24, 5, 0, TAU); c.fill();
    }
  }
  function igreja(c, x, y, t) {
    c.fillStyle = '#f1e3c6'; c.fillRect(x - 26, y - 170, 52, 170);
    c.fillStyle = '#c8553d'; c.beginPath(); c.moveTo(x - 32, y - 168); c.lineTo(x, y - 200); c.lineTo(x + 32, y - 168); c.fill();
    c.fillStyle = '#343a40'; G.gfx.rr(c, x - 10, y - 150, 20, 26, 10); c.fill();
    c.fillStyle = '#e9c46a'; c.beginPath(); c.arc(x, y - 132, 7, 0, TAU); c.fill();
    // o ninho da cegonha lá no alto
    c.fillStyle = '#7f5539'; c.beginPath(); c.ellipse(x, y - 203, 24, 8, 0, 0, TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x + 4, y - 216, 9, 7, 0, 0, TAU); c.fill();
    c.beginPath(); c.arc(x + 12, y - 226, 5, 0, TAU); c.fill();
    c.fillStyle = '#f77f00'; c.beginPath(); c.moveTo(x + 16, y - 227); c.lineTo(x + 30, y - 224 + Math.sin(t * 3) * 2); c.lineTo(x + 16, y - 224); c.fill();
    c.fillStyle = '#fbf8f0'; c.fillRect(x - 70, y - 80, 44, 80);
    c.fillStyle = '#c8553d'; c.beginPath(); c.moveTo(x - 76, y - 78); c.lineTo(x - 48, y - 100); c.lineTo(x - 26, y - 78); c.fill();
  }
  // placas e o arco da entrada da aldeia (no mundo)
  function mundo(c, t) {
    if (terra === 0) {
      placa(c, 520, 'ALDEIA DOS ROBÔS ➜');
      placa(c, LEN - 520, '🏎️ CARRO ➜');
    } else if (terra === 1) {
      for (let x = 1200, k = 0; x < LEN - 600; x += 1800, k++) placa(c, x, 'ALDEIA DOS ROBÔS ' + Math.max(1, Math.round((LEN - x) / 1800)) + ' km');
    } else {
      // o arco da entrada e uma cerca para os animais
      c.fillStyle = '#fbf8f0'; c.fillRect(300, -220, 26, 220); c.fillRect(560, -220, 26, 220);
      c.fillStyle = '#c8553d'; G.gfx.rr(c, 286, -262, 314, 50, 12); c.fill();
      G.gfx.label(c, 'ALDEIA DOS ROBÔS', 443, -237, 26, '#fff', 'center', 'none');
      c.strokeStyle = '#8d6748'; c.lineWidth = 5;
      for (let x = 700; x < LEN - 200; x += 900) {
        c.beginPath(); c.moveTo(x, -34); c.lineTo(x + 260, -34); c.moveTo(x, -16); c.lineTo(x + 260, -16); c.stroke();
        for (let k = 0; k <= 260; k += 65) { c.fillStyle = '#7f5539'; c.fillRect(x + k - 4, -46, 8, 46); }
      }
      // a oficina dos robôs: é para lá que vão os robozinhos que ficaram bons
      c.fillStyle = '#adb5bd'; c.fillRect(LEN - 260, -150, 200, 150);
      c.fillStyle = '#495057'; c.beginPath(); c.moveTo(LEN - 275, -148); c.lineTo(LEN - 160, -200); c.lineTo(LEN - 45, -148); c.fill();
      c.fillStyle = '#343a40'; c.fillRect(LEN - 210, -96, 100, 96);
      G.gfx.label(c, '🔧 OFICINA', LEN - 160, -122, 20, '#fff', 'center', 'none');
    }
  }
  function placa(c, x, txt) {
    c.fillStyle = '#7f5539'; c.fillRect(x - 5, -110, 10, 110);
    c.font = 'bold 20px "Comic Sans MS", sans-serif';
    const w = c.measureText(txt).width + 30;
    c.fillStyle = '#e9c46a'; G.gfx.rr(c, x - w / 2, -150, w, 40, 8); c.fill();
    c.strokeStyle = '#7f5539'; c.lineWidth = 3; c.stroke();
    G.gfx.label(c, txt, x, -130, 20, '#5a3d1e', 'center', 'none');
  }

  /* ---------- o pai e o Isaac (o boneco do jogo da Marvel, com pele de gente) ---------- */
  function pessoa(c, qual, o) {
    const d = qual === 'pai' ? DEF_PAI : DEF_FILHO, K = qual === 'pai' ? K_PAI : K_FILHO;
    const B = G.scenes.marvel && G.scenes.marvel.api && G.scenes.marvel.api.boneco;
    c.save(); c.scale(K, K);
    const braco = o.festa || o.sentado ? 0 : (o.arma > 0 ? 1 : 0.86);
    if (B) B(c, d, { t: o.t, dir: 1, fase: o.passo || 0, anda: !!o.anda, braco: braco, cima: !!o.festa, noAr: !!o.noAr,
      partes: o.sentado ? { pernas: { dx: 2, dy: -2, r: -1.25 } } : null });
    else { c.fillStyle = d.tronco; G.gfx.rr(c, -10, -50, 20, 26, 5); c.fill(); c.fillStyle = d.pernas; c.fillRect(-9, -24, 18, 24); c.fillStyle = PELE; G.gfx.rr(c, -8, -68, 16, 17, 5); c.fill(); }
    cabelo(c, qual);
    if (!o.festa && !o.sentado) {
      const ang = -0.2 - 1.35 * braco, hx = 9.2 - Math.sin(ang) * 18.5, hy = -47 + Math.cos(ang) * 18.5;
      if (qual === 'filho') {
        const puxa = o.arma > 0 ? 7 : 0;
        c.strokeStyle = '#8d5524'; c.lineWidth = 2.6;
        c.beginPath(); c.arc(hx - 4, hy, 17, -1.2, 1.2); c.stroke();
        c.strokeStyle = '#f1f3f5'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(hx - 4 + Math.cos(-1.2) * 17, hy + Math.sin(-1.2) * 17); c.lineTo(hx - 2 - puxa, hy); c.lineTo(hx - 4 + Math.cos(1.2) * 17, hy + Math.sin(1.2) * 17); c.stroke();
        c.fillStyle = '#8d5524'; G.gfx.rr(c, -14, -52, 6, 20, 2); c.fill();
        c.fillStyle = '#ffd166'; c.fillRect(-14, -56, 2, 5); c.fillRect(-10, -57, 2, 6);
      } else {
        // a pistola de laser do pai
        c.fillStyle = '#343a40'; G.gfx.rr(c, hx - 3, hy - 5, 15, 6, 2); c.fill();
        c.fillStyle = '#495057'; c.fillRect(hx - 1, hy, 4, 6);
        c.fillStyle = o.arma > 0 ? '#ffffff' : '#4cc9f0'; c.fillRect(hx + 11, hy - 4, 3, 4);
      }
    }
    c.restore();
  }
  function cabelo(c, qual) {
    if (qual === 'pai') {
      c.fillStyle = '#3b2414';
      G.gfx.rr(c, -8.8, -72.5, 17.6, 7.5, 3.5); c.fill();
      c.fillRect(-8.8, -70, 3.6, 9);
      c.fillStyle = 'rgba(59,36,20,.35)'; G.gfx.rr(c, -6.5, -56.5, 13, 4.5, 2); c.fill();   // a barba por fazer
    } else {
      c.fillStyle = '#7a4a26';
      G.gfx.rr(c, -8.8, -73, 17.6, 7, 3.5); c.fill();
      c.fillRect(-8.8, -70, 3.2, 7);
      c.beginPath(); c.moveTo(2, -66.5); c.lineTo(8.8, -66.5); c.lineTo(8.8, -70); c.fill();   // a franja
    }
  }
  function desenhaPessoa(c, p, t, nosso) {
    c.save(); c.translate(p.x, p.y);
    c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(0, -p.y + 2, p.qual === 'pai' ? 26 : 18, 6, 0, 0, TAU); c.fill();
    if (inv > 0 && descansa <= 0 && fase === 'joga' && Math.floor(t * 12) % 2 === 0) c.globalAlpha = 0.5;
    if (p.dir < 0) c.scale(-1, 1);
    const fest = fase === 'festa';
    if (descansa > 0) {
      pessoa(c, p.qual, { t: t, sentado: true, passo: 0 });
      c.restore();
      c.font = '28px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#000';
      c.fillText('💤', p.x + 10, p.y - (p.qual === 'pai' ? 120 : 90) - (t * 30) % 30);
      return;
    }
    pessoa(c, p.qual, { t: t, passo: p.passo, anda: p.anda && p.noChao, arma: p.arma, noAr: !p.noChao, festa: fest });
    c.restore();
    const topo = p.y - (p.qual === 'pai' ? 122 : 88);
    G.gfx.label(c, p.qual === 'pai' ? 'Pai' : 'Isaac', p.x, topo, 17, p.qual === 'pai' ? '#2f6f4f' : '#a50044', 'center');
    if (nosso && fase === 'joga') {
      const y = topo - 22 + Math.sin(t * 6) * 4;
      c.fillStyle = '#ffd60a'; c.strokeStyle = '#7a5a00'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(p.x - 10, y - 10); c.lineTo(p.x + 10, y - 10); c.lineTo(p.x, y + 2); c.closePath(); c.fill(); c.stroke();
    }
  }
  // a cabeça sozinha (no carro e no cartão)
  function cabeca(c, qual, x, y, k, t) {
    c.save(); c.translate(x, y); c.scale(k, k); c.translate(0, 60);
    c.fillStyle = PELE; G.gfx.rr(c, -8, -68, 16, 17, 5); c.fill();
    c.fillStyle = '#1b1b1b';
    c.beginPath(); c.arc(-3, -61, 1.4, 0, TAU); c.arc(3, -61, 1.4, 0, TAU); c.fill();
    c.strokeStyle = '#1b1b1b'; c.lineWidth = 1; c.beginPath(); c.arc(0, -58, 3.2, 0.25, Math.PI - 0.25); c.stroke();
    cabelo(c, qual);
    c.restore();
  }

  /* ---------- o carro de corrida (com disparadores e o nome do Isaac na porta) ---------- */
  function carroCorrida(c, car, t) {
    const treme = car.bate > 0 ? Math.sin(t * 90) * 3 : 0;
    c.save(); c.translate(car.x + treme, car.y); c.scale(car.dir, 1);
    c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(0, -car.y - 3, 100, 9, 0, 0, TAU); c.fill();
    c.fillStyle = '#212529'; G.gfx.rr(c, -92, -70, 8, 34, 2); c.fill();
    c.fillStyle = '#1d3557'; G.gfx.rr(c, -108, -78, 42, 12, 4); c.fill();
    // os disparadores em cima
    c.fillStyle = '#6c757d'; G.gfx.rr(c, 10, -74, 62, 10, 4); c.fill();
    c.fillStyle = '#495057'; G.gfx.rr(c, 66, -75, 12, 12, 3); c.fill();
    c.fillStyle = '#4cc9f0'; c.fillRect(76, -72, 4, 6);
    // a carroçaria em cunha, cor de laranja com riscas azuis
    c.fillStyle = '#ff7b00';
    c.beginPath(); c.moveTo(-96, -18); c.lineTo(-96, -52); c.lineTo(-36, -58); c.lineTo(26, -54); c.lineTo(100, -30); c.lineTo(100, -16); c.closePath(); c.fill();
    c.fillStyle = '#d65a00'; c.fillRect(-96, -24, 196, 8);
    c.fillStyle = '#1d3557'; c.fillRect(-96, -34, 194, 6);
    c.fillStyle = '#6c757d'; G.gfx.rr(c, 38, -46, 52, 8, 3); c.fill();
    c.fillStyle = '#495057'; G.gfx.rr(c, 84, -47, 12, 10, 3); c.fill();
    // o nome na porta
    c.save(); c.scale(car.dir, 1);
    G.gfx.label(c, 'ISAAC', -24 * car.dir, -43, 15, '#ffffff', 'center', '#1d3557');
    c.restore();
    c.fillStyle = '#22223b'; c.beginPath(); c.ellipse(-8, -55, 42, 9, 0, 0, TAU); c.fill();
    if (!car.vazio) {
      cabeca(c, 'filho', -40, -66 + Math.sin(t * 9) * 1.2, 1.2, t);
      cabeca(c, 'pai', 0, -72, 1.6, t);
    }
    c.fillStyle = 'rgba(189,224,254,.6)';
    c.beginPath(); c.moveTo(20, -55); c.lineTo(32, -54); c.lineTo(24, -78); c.lineTo(16, -78); c.closePath(); c.fill();
    c.fillStyle = '#fff3b0'; G.gfx.rr(c, 92, -31, 8, 7, 2); c.fill();
    if (car.fogo > 0) {
      const k = car.fogo / 0.12;
      c.fillStyle = 'rgba(255,209,102,' + k + ')';
      c.beginPath(); if (car.lado) c.arc(98, -42, 10 * k + 4, 0, TAU); else c.arc(82, -69, 11 * k + 4, 0, TAU); c.fill();
    }
    roda(c, -60, -18, 20, car.roda); roda(c, 66, -16, 17, car.roda * 1.2);
    c.restore();
  }
  function roda(c, x, y, r, a) {
    c.save(); c.translate(x, y); c.rotate(a);
    c.fillStyle = '#212529'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.fillStyle = '#ced4da'; c.beginPath(); c.arc(0, 0, r * 0.5, 0, TAU); c.fill();
    c.fillStyle = '#ff7b00'; for (let k = 0; k < 4; k++) { c.rotate(TAU / 4); c.fillRect(-1.5, 2, 3, r * 0.4); }
    c.restore();
  }

  /* ---------- os robôs amigos (inventados aqui: só o nome é deles) ---------- */
  function desenhaAmigo(c, a, t) {
    const d = a.def, bob = Math.sin(t * 3 + a.fase) * 6 - (a.festa > 0 ? Math.abs(Math.sin(t * 9 + a.fase)) * 14 : 0);
    c.save(); c.translate(a.x, a.y + bob);
    // o jato por baixo
    const fl = 10 + Math.random() * 8;
    c.fillStyle = '#ffb703'; c.beginPath(); c.moveTo(-6, 18); c.lineTo(0, 18 + fl); c.lineTo(6, 18); c.fill();
    c.fillStyle = '#fff3b0'; c.beginPath(); c.moveTo(-3, 18); c.lineTo(0, 14 + fl * 0.6); c.lineTo(3, 18); c.fill();
    c.scale(a.dir, 1);
    // o corpo e o braço com a pistolinha
    c.fillStyle = d.escuro; G.gfx.rr(c, -15, -6, 30, 26, 9); c.fill();
    c.fillStyle = d.cor; G.gfx.rr(c, -13, -5, 26, 21, 8); c.fill();
    c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.arc(0, 6, 4, 0, TAU); c.fill();
    c.strokeStyle = d.escuro; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(10, 4); c.lineTo(22, a.fogo > 0 ? 0 : 6); c.stroke();
    c.fillStyle = '#343a40'; G.gfx.rr(c, 20, (a.fogo > 0 ? -4 : 2), 12, 5, 2); c.fill();
    // a cabeça: redonda (Claude), quadrada (ChatGPT) ou em diamante (Gemini)
    c.fillStyle = d.cor;
    if (d.forma === 'redondo') { c.beginPath(); c.arc(0, -24, 19, 0, TAU); c.fill(); }
    else if (d.forma === 'quadrado') { G.gfx.rr(c, -19, -43, 38, 34, 7); c.fill(); }
    else {
      const g = c.createLinearGradient(-20, -44, 20, -4); g.addColorStop(0, d.cor); g.addColorStop(1, d.escuro);
      c.fillStyle = g; c.beginPath(); c.moveTo(0, -48); c.quadraticCurveTo(22, -26, 0, -2); c.quadraticCurveTo(-22, -26, 0, -48); c.fill();
    }
    // a viseira com os olhos (piscam de vez em quando)
    c.fillStyle = '#1b263b'; G.gfx.rr(c, -12, -32, 24, 14, 6); c.fill();
    const pisca = (t + a.fase) % 3.2 < 0.12;
    c.fillStyle = d.olhos;
    if (pisca) { c.fillRect(-8, -26, 6, 2); c.fillRect(2, -26, 6, 2); }
    else { c.beginPath(); c.ellipse(-4, -25, 3, 4, 0, 0, TAU); c.ellipse(5, -25, 3, 4, 0, 0, TAU); c.fill(); }
    c.strokeStyle = d.olhos; c.lineWidth = 1.5; c.beginPath(); c.arc(0, -16, 4, 0.3, Math.PI - 0.3); c.stroke();
    // as antenas
    c.strokeStyle = d.escuro; c.lineWidth = 2;
    if (d.forma === 'redondo') {
      c.beginPath(); c.moveTo(0, -42); c.lineTo(0, -52); c.stroke();
      G.gfx.heart(c, 0, -56, 11, '#ff6b8b');
    } else if (d.forma === 'quadrado') {
      c.beginPath(); c.moveTo(0, -43); c.lineTo(0, -53); c.stroke();
      c.fillStyle = Math.sin(t * 6) > 0 ? '#c7f9cc' : '#80ed99'; c.beginPath(); c.arc(0, -56, 4.5, 0, TAU); c.fill();
      c.fillStyle = d.escuro; c.fillRect(-23, -32, 4, 12); c.fillRect(19, -32, 4, 12);
    } else {
      c.beginPath(); c.moveTo(-5, -42); c.lineTo(-10, -54); c.moveTo(5, -42); c.lineTo(10, -54); c.stroke();
      G.gfx.star(c, -10, -56, 5, '#ffd166', t); G.gfx.star(c, 10, -56, 5, '#ffd166', -t);
    }
    c.restore();
    G.gfx.label(c, d.nome, a.x, a.y + bob - 78, 16, d.escuro, 'center');
  }

  /* ---------- os robozinhos do dragão (maus de olhos vermelhos, bons de olhos verdes) ---------- */
  function desenhaRobo(c, e, t) {
    const b = caixa(e), bom = !e.mau;
    c.save(); c.translate(e.x, e.y);
    if (e.pisca > 0 && Math.floor(t * 24) % 2 === 0) c.globalAlpha = 0.5;
    const salta = e.festa > 0 ? -Math.abs(Math.sin(t * 10)) * 14 : 0;
    c.translate(0, salta);
    c.scale(e.dir, 1);
    const metal = bom ? '#8ecae6' : '#6c757d', escuro = bom ? '#219ebc' : '#343a40', olho = bom ? '#80ffdb' : '#ff3b3b';
    if (e.sub === 'rodas') {
      c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(0, -e.y + 2 - salta, 30, 6, 0, 0, TAU); c.fill();
      c.fillStyle = '#212529'; G.gfx.rr(c, -26, -18, 52, 18, 9); c.fill();
      c.fillStyle = '#495057';
      for (let k = -1; k <= 1; k++) { c.save(); c.translate(k * 16, -9); c.rotate(e.passo); c.fillRect(-6, -1.5, 12, 3); c.restore(); }
      c.fillStyle = metal; G.gfx.rr(c, -22, -50, 44, 34, 8); c.fill();
      c.fillStyle = escuro; c.fillRect(-22, -30, 44, 4);
      c.fillStyle = metal; c.beginPath(); c.arc(0, -52, 17, Math.PI, 0); c.fill();
      c.fillStyle = '#1b263b'; G.gfx.rr(c, -6, -62, 22, 10, 5); c.fill();
      c.fillStyle = olho; c.beginPath(); c.arc(8, -57, 3.5, 0, TAU); c.fill();
      c.globalAlpha *= 0.3; c.beginPath(); c.arc(8, -57, 8, 0, TAU); c.fill(); c.globalAlpha /= 0.3;
      c.strokeStyle = escuro; c.lineWidth = 2; c.beginPath(); c.moveTo(-4, -68); c.lineTo(-8, -80); c.stroke();
      c.fillStyle = bom ? '#80ffdb' : (Math.sin(t * 8) > 0 ? '#ff3b3b' : '#9d0208'); c.beginPath(); c.arc(-8, -82, 3.5, 0, TAU); c.fill();
      c.fillStyle = '#495057'; G.gfx.rr(c, 16, -42, 18, 7, 3); c.fill();
    } else {
      c.save(); c.translate(0, -24); c.rotate(0);
      c.fillStyle = '#495057'; c.fillRect(-1.5, 0, 3, 8);
      const h = Math.cos(t * 40) * 26;
      c.fillStyle = 'rgba(60,60,60,.7)'; c.fillRect(-Math.abs(h), -2, Math.abs(h) * 2, 4);
      c.restore();
      c.fillStyle = metal; c.beginPath(); c.ellipse(0, 0, 28, 18, 0, 0, TAU); c.fill();
      c.fillStyle = escuro; c.fillRect(-28, -2, 56, 4);
      c.fillStyle = '#1b263b'; G.gfx.rr(c, 2, -8, 20, 10, 5); c.fill();
      c.fillStyle = olho; c.beginPath(); c.arc(13, -3, 3.5, 0, TAU); c.fill();
      c.fillStyle = '#495057'; G.gfx.rr(c, -6, 14, 14, 6, 3); c.fill();
    }
    if (bom) { c.scale(e.dir, 1); G.gfx.heart(c, 0, e.sub === 'drone' ? -40 : -96, 12, '#ff6b8b'); }
    c.restore();
    if (e.mau && e.hp < e.max) barrinha(c, b.x, b.y - b.ry - 16, 40, e.hp / e.max);
  }
  function barrinha(c, x, y, w, f) {
    c.fillStyle = 'rgba(0,0,0,.25)'; G.gfx.rr(c, x - w / 2, y, w, 7, 3); c.fill();
    c.fillStyle = '#ff9f1c'; G.gfx.rr(c, x - w / 2, y, Math.max(3, w * f), 7, 3); c.fill();
  }

  /* ---------- o lobo robô ---------- */
  function desenhaLobo(c, L, t) {
    c.save(); c.translate(L.x, L.y);
    c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(0, -L.y + 2, 70, 8, 0, 0, TAU); c.fill();
    if (L.pisca > 0 && Math.floor(t * 24) % 2 === 0) c.globalAlpha = 0.55;
    const salta = L.festa > 0 && !L.mau ? -Math.abs(Math.sin(t * 8)) * 12 : 0;
    c.translate(0, salta);
    if (L.confuso > 0 && !L.kb) c.rotate(Math.sin(t * 20) * 0.04);
    c.scale(L.dir, 1);
    const bom = !L.mau, metal = bom ? '#a8b8c8' : '#7d8597', escuro = bom ? '#5c677d' : '#33415c', olho = bom ? '#80ffdb' : '#ff3b3b';
    // a cauda, as pernas, o corpo
    c.strokeStyle = escuro; c.lineWidth = 10; c.lineCap = 'round';
    const ab = bom ? Math.sin(t * 14) * 0.5 : 0;
    c.beginPath(); c.moveTo(-60, -64); c.quadraticCurveTo(-90, -70 - ab * 20, -104, -96 - ab * 10); c.stroke();
    const p = Math.sin(L.passo) * 14, q = Math.cos(L.passo) * 14;
    c.lineWidth = 9;
    for (const [lx, o] of [[-40, p], [40, q], [-28, -q], [52, -p]]) {
      c.strokeStyle = lx === -28 || lx === 52 ? escuro : metal;
      c.beginPath(); c.moveTo(lx, -54); c.lineTo(lx + o * 0.6, -26); c.lineTo(lx + o * 0.3, -4); c.stroke();
    }
    c.fillStyle = metal; c.beginPath(); c.ellipse(0, -64, 66, 26, 0, 0, TAU); c.fill();
    c.fillStyle = escuro;
    for (let k = -2; k <= 2; k++) G.gfx.rr(c, k * 22 - 8, -88, 16, 10, 3), c.fill();
    c.fillStyle = bom ? '#80ffdb' : '#ff9f1c'; c.fillRect(-44, -60, 88, 4);
    // a cabeça com focinho e orelhas em bico
    c.fillStyle = metal;
    c.beginPath(); c.moveTo(48, -72); c.lineTo(76, -104); c.lineTo(118, -86); c.lineTo(124, -74); c.lineTo(84, -62); c.closePath(); c.fill();
    c.fillStyle = escuro;
    c.beginPath(); c.moveTo(70, -98); c.lineTo(72, -128); c.lineTo(88, -102); c.fill();
    c.beginPath(); c.moveTo(84, -100); c.lineTo(92, -126); c.lineTo(100, -96); c.fill();
    c.fillStyle = '#212529'; c.beginPath(); c.arc(124, -78, 5, 0, TAU); c.fill();
    c.fillStyle = olho; c.beginPath(); c.ellipse(96, -90, 6, 4, -0.3, 0, TAU); c.fill();
    c.globalAlpha *= 0.3; c.beginPath(); c.arc(96, -90, 12, 0, TAU); c.fill(); c.globalAlpha /= 0.3;
    if (bom) {
      c.fillStyle = '#e63946'; c.beginPath(); c.moveTo(60, -70); c.lineTo(84, -64); c.lineTo(70, -48); c.closePath(); c.fill();   // o lenço do cão pastor
      c.strokeStyle = '#212529'; c.lineWidth = 2; c.beginPath(); c.arc(106, -74, 8, 0.2, 1.4); c.stroke();
    }
    c.restore();
    if (L.confuso > 0 && L.mau) {
      for (let i = 0; i < 3; i++) { const a = t * 5 + i / 3 * TAU; G.gfx.star(c, L.x + L.dir * 90 + Math.cos(a) * 26, L.y - 130 + Math.sin(a) * 8, 6, '#ffd166', a); }
    }
    if (L.uivo > 0 && L.mau) G.gfx.label(c, 'AUUUU!', L.x + L.dir * 100, L.y - 150, 22, '#33415c', 'center');
    if (!L.mau) G.gfx.label(c, '🐑 cão pastor', L.x, L.y - 150, 16, '#33415c', 'center');
  }

  /* ---------- o dragão robô ---------- */
  function desenhaDragao(c, Dg, t) {
    if (Dg.fugiu && Dg.x > camX + vw() + 400) return;
    c.save(); c.translate(Dg.x, Dg.y);
    if (Dg.pisca > 0 && Math.floor(t * 24) % 2 === 0) c.globalAlpha = 0.6;
    c.scale(Dg.dir, 1);
    dragaoCorpo(c, t, Dg.mau || Dg.fugitivo, fase === 'festa', Dg.estado === 'mergulho' ? 2 : 1);
    c.restore();
  }
  // o corpo do dragão virado para a direita; mau = olhos vermelhos, amigo = olhos verdes
  function dragaoCorpo(c, t, mau, contente, bate) {
    const asa = Math.sin(t * 5 * bate) * 0.5;
    const metal = mau ? '#4a4e69' : '#5e7ce2', claro = mau ? '#9a8c98' : '#a9def9', nucleo = mau ? '#ff6d00' : '#4cc9f0', olho = mau ? '#ff3b3b' : '#80ffdb';
    // a asa de trás
    asaDragao(c, -10, -30, -asa - 0.2, metal, mau, 0.85);
    // a cauda com o bico no fim
    c.strokeStyle = metal; c.lineCap = 'round';
    let px = -90, py = 0;
    for (let k = 0; k < 6; k++) {
      const nx = px - 30, ny = py + Math.sin(t * 3 + k * 0.7) * 8 + k * 2;
      c.lineWidth = 26 - k * 3.5; c.beginPath(); c.moveTo(px, py); c.lineTo(nx, ny); c.stroke();
      px = nx; py = ny;
    }
    c.fillStyle = claro; c.beginPath(); c.moveTo(px - 4, py - 14); c.lineTo(px - 30, py); c.lineTo(px - 4, py + 14); c.fill();
    // o corpo, as placas da barriga e o reator no peito
    c.fillStyle = metal; c.beginPath(); c.ellipse(0, 0, 100, 44, 0, 0, TAU); c.fill();
    c.fillStyle = claro;
    for (let k = -3; k <= 2; k++) { G.gfx.rr(c, k * 26 - 10, 16, 22, 14, 4); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.ellipse(-10, -16, 70, 14, 0, 0, TAU); c.fill();
    c.fillStyle = nucleo; c.beginPath(); c.arc(40, 4, 12, 0, TAU); c.fill();
    c.globalAlpha *= 0.35; c.beginPath(); c.arc(40, 4, 20 + Math.sin(t * 8) * 3, 0, TAU); c.fill(); c.globalAlpha /= 0.35;
    // os espinhos das costas
    c.fillStyle = claro;
    for (let k = -3; k <= 2; k++) { c.beginPath(); c.moveTo(k * 26 - 8, -40); c.lineTo(k * 26 + 2, -60); c.lineTo(k * 26 + 12, -40); c.fill(); }
    // as patas
    c.fillStyle = metal; G.gfx.rr(c, -50, 30, 18, 28, 6); c.fill(); G.gfx.rr(c, 30, 30, 18, 28, 6); c.fill();
    c.fillStyle = claro; c.fillRect(-52, 52, 22, 6); c.fillRect(28, 52, 22, 6);
    // o pescoço e a cabeça
    c.strokeStyle = metal; c.lineWidth = 34; c.beginPath(); c.moveTo(70, -10); c.quadraticCurveTo(110, -30, 120, -66); c.stroke();
    c.save(); c.translate(130, -76);
    c.fillStyle = metal; c.beginPath(); c.moveTo(-26, -20); c.lineTo(30, -16); c.lineTo(62, 2); c.lineTo(58, 14); c.lineTo(-20, 22); c.closePath(); c.fill();
    c.fillStyle = claro; c.beginPath(); c.moveTo(-8, 14); c.lineTo(56, 10); c.lineTo(50, 22); c.lineTo(-10, 26); c.closePath(); c.fill();   // o maxilar
    c.fillStyle = claro;
    c.beginPath(); c.moveTo(-20, -18); c.lineTo(-44, -50); c.lineTo(-6, -20); c.fill();
    c.beginPath(); c.moveTo(-2, -18); c.lineTo(-14, -46); c.lineTo(10, -18); c.fill();
    c.fillStyle = '#1b263b'; G.gfx.rr(c, 6, -12, 26, 12, 5); c.fill();
    c.fillStyle = olho; c.beginPath(); c.ellipse(22, -6, 7, 4, 0, 0, TAU); c.fill();
    c.globalAlpha *= 0.3; c.beginPath(); c.arc(22, -6, 14, 0, TAU); c.fill(); c.globalAlpha /= 0.3;
    c.fillStyle = '#212529'; c.beginPath(); c.arc(56, 0, 3, 0, TAU); c.fill();
    if (contente) { c.strokeStyle = '#212529'; c.lineWidth = 3; c.beginPath(); c.arc(34, 12, 12, 0.1, Math.PI - 0.6); c.stroke(); }
    else if (mau && Math.sin(t * 3) > 0.6) {        // fumo das narinas
      c.fillStyle = 'rgba(255,160,60,.6)'; c.beginPath(); c.arc(70 + Math.sin(t * 9) * 4, -4, 6, 0, TAU); c.fill();
    }
    c.restore();
    // a asa da frente
    asaDragao(c, 10, -34, asa, metal, mau, 1);
  }
  function asaDragao(c, x, y, a, metal, mau, k) {
    c.save(); c.translate(x, y); c.rotate(-0.4 + a); c.scale(k, k);
    c.fillStyle = mau ? 'rgba(201,24,74,.55)' : 'rgba(76,201,240,.5)';
    c.beginPath(); c.moveTo(0, 0); c.lineTo(-30, -140); c.lineTo(30, -120); c.lineTo(80, -110); c.lineTo(120, -60); c.lineTo(60, -20); c.closePath(); c.fill();
    c.strokeStyle = metal; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 0); c.lineTo(-30, -140); c.moveTo(0, 0); c.lineTo(30, -120); c.moveTo(0, 0); c.lineTo(80, -110); c.moveTo(0, 0); c.lineTo(120, -60); c.stroke();
    c.fillStyle = mau ? '#ff9f1c' : '#80ffdb';
    for (const [px, py] of [[-30, -140], [30, -120], [80, -110], [120, -60]]) { c.beginPath(); c.arc(px, py, 4, 0, TAU); c.fill(); }
    c.restore();
  }

  /* ---------- os animais da aldeia ---------- */
  function desenhaAnimal(c, a, t) {
    const pulo = a.salta > 0 ? -Math.sin((a.salta / 0.5) * Math.PI) * 18 : 0;
    c.save(); c.translate(a.x, a.y + pulo);
    c.fillStyle = 'rgba(0,0,0,.14)'; c.beginPath(); c.ellipse(0, -a.y - pulo + 2, a.tipo === 'touro' ? 70 : (a.tipo === 'porco' || a.tipo === 'ovelha' ? 36 : 16), 5, 0, 0, TAU); c.fill();
    c.scale(a.dir, 1);
    const p = Math.sin(a.passo) * 6;
    if (a.tipo === 'galinha') {
      const castanha = h01(Math.round(a.x)) < 0.4;
      c.strokeStyle = '#f4a261'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(-3, -10); c.lineTo(-3 - p * 0.5, 0); c.moveTo(4, -10); c.lineTo(4 + p * 0.5, 0); c.stroke();
      c.fillStyle = castanha ? '#bc6c25' : '#fbfbf6'; c.beginPath(); c.ellipse(0, -18, 16, 12, 0, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(-12, -22); c.lineTo(-22, -32); c.lineTo(-16, -16); c.fill();
      const bica = a.bica > 0 ? Math.abs(Math.sin(t * 14)) * 10 : 0;
      c.beginPath(); c.arc(12, -30 + bica, 7, 0, TAU); c.fill();
      c.fillStyle = '#e63946'; c.beginPath(); c.arc(11, -38 + bica, 3, 0, TAU); c.arc(15, -37 + bica, 3, 0, TAU); c.fill();
      c.fillStyle = '#f4a261'; c.beginPath(); c.moveTo(18, -31 + bica); c.lineTo(25, -29 + bica); c.lineTo(18, -27 + bica); c.fill();
      c.fillStyle = '#212529'; c.beginPath(); c.arc(14, -31 + bica, 1.4, 0, TAU); c.fill();
      if (a.foge) { c.fillStyle = castanha ? '#9c5a1e' : '#e9ecef'; c.beginPath(); c.ellipse(-2, -22, 10, 4, Math.sin(t * 40) * 0.8, 0, TAU); c.fill(); }
    } else if (a.tipo === 'pato') {
      c.strokeStyle = '#f77f00'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(-3, -9); c.lineTo(-3 - p * 0.5, 0); c.moveTo(4, -9); c.lineTo(4 + p * 0.5, 0); c.stroke();
      c.fillStyle = '#fbfbf6'; c.beginPath(); c.ellipse(0, -16, 19, 11, 0, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(-16, -18); c.lineTo(-24, -24); c.lineTo(-18, -12); c.fill();
      const bica = a.bica > 0 ? Math.abs(Math.sin(t * 10)) * 8 : 0;
      c.fillStyle = h01(Math.round(a.x) + 1) < 0.5 ? '#2d6a4f' : '#fbfbf6';
      c.beginPath(); c.arc(13, -30 + bica, 7.5, 0, TAU); c.fill();
      c.fillStyle = '#ffb703'; G.gfx.rr(c, 18, -31 + bica, 12, 5, 2.5); c.fill();
      c.fillStyle = '#212529'; c.beginPath(); c.arc(15, -32 + bica, 1.4, 0, TAU); c.fill();
      if (a.foge) { c.fillStyle = '#dee2e6'; c.beginPath(); c.ellipse(-2, -20, 12, 4, Math.sin(t * 40) * 0.8, 0, TAU); c.fill(); }
    } else if (a.tipo === 'ovelha') {
      c.fillStyle = '#212529';
      c.fillRect(-16 - p * 0.3, -12, 5, 12); c.fillRect(12 + p * 0.3, -12, 5, 12); c.fillRect(-8 + p * 0.3, -12, 5, 12); c.fillRect(4 - p * 0.3, -12, 5, 12);
      c.fillStyle = '#f8f9fa';
      for (const [ox, oy, r] of [[-16, -24, 12], [-4, -30, 13], [10, -26, 12], [0, -18, 14], [-14, -16, 10], [14, -16, 10]]) { c.beginPath(); c.arc(ox, oy, r, 0, TAU); c.fill(); }
      c.fillStyle = '#343a40'; c.beginPath(); c.ellipse(26, -26, 9, 7, 0.3, 0, TAU); c.fill();
      c.fillStyle = '#f8f9fa'; c.beginPath(); c.arc(22, -33, 5, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(29, -28, 1.6, 0, TAU); c.fill();
    } else if (a.tipo === 'porco') {
      // o porco bravo: castanho escuro, de cerdas e com dentes de javali
      c.fillStyle = '#4a3426';
      c.fillRect(-22 - p * 0.4, -16, 7, 16); c.fillRect(16 + p * 0.4, -16, 7, 16); c.fillRect(-12 + p * 0.4, -16, 7, 16); c.fillRect(8 - p * 0.4, -16, 7, 16);
      c.fillStyle = '#6b4f3a'; c.beginPath(); c.ellipse(0, -28, 34, 18, 0, 0, TAU); c.fill();
      c.fillStyle = '#3d2b1f';
      for (let k = -24; k <= 16; k += 8) { c.beginPath(); c.moveTo(k, -42); c.lineTo(k + 4, -50); c.lineTo(k + 8, -42); c.fill(); }
      c.fillStyle = '#6b4f3a'; c.beginPath(); c.ellipse(32, -28, 15, 13, 0, 0, TAU); c.fill();
      c.fillStyle = '#c08c6d'; c.beginPath(); c.ellipse(46, -26, 6, 7, 0, 0, TAU); c.fill();
      c.fillStyle = '#3d2b1f'; c.beginPath(); c.arc(45, -28, 1.4, 0, TAU); c.arc(47, -24, 1.4, 0, TAU); c.fill();
      c.strokeStyle = '#fbfbf6'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(40, -20); c.quadraticCurveTo(44, -28, 40, -32); c.stroke();
      c.fillStyle = '#212529'; c.beginPath(); c.arc(32, -34, 2.2, 0, TAU); c.fill();
      c.fillStyle = '#3d2b1f'; c.beginPath(); c.moveTo(22, -40); c.lineTo(26, -50); c.lineTo(30, -40); c.fill();
      c.strokeStyle = '#3d2b1f'; c.lineWidth = 2; c.beginPath(); c.arc(-36, -32, 5, 0, Math.PI * 1.5); c.stroke();
      if (a.carga > 0) G.gfx.label(c, '!', 30, -64, 22, '#9d0208', 'center');
    } else if (a.tipo === 'touro') {
      c.fillStyle = '#1b1b1b';
      c.fillRect(-46 - p * 0.5, -30, 12, 30); c.fillRect(36 + p * 0.5, -30, 12, 30); c.fillRect(-30 + p * 0.5, -30, 12, 30); c.fillRect(22 - p * 0.5, -30, 12, 30);
      c.fillStyle = '#2b2b2b'; c.beginPath(); c.ellipse(0, -56, 62, 32, 0, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(20, -78, 34, 16, 0, 0, TAU); c.fill();    // o cachaço
      c.strokeStyle = '#2b2b2b'; c.lineWidth = 5; c.beginPath(); c.moveTo(-60, -66); c.quadraticCurveTo(-76, -50 + Math.sin(t * 4) * 6, -70, -28); c.stroke();
      c.fillStyle = '#2b2b2b'; c.beginPath(); c.ellipse(64, -60, 22, 20, 0.2, 0, TAU); c.fill();
      c.fillStyle = '#5c4033'; c.beginPath(); c.ellipse(80, -52, 10, 9, 0, 0, TAU); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(64, -66, 3, 0, TAU); c.fill();
      c.fillStyle = '#1b1b1b'; c.beginPath(); c.arc(65, -66, 1.6, 0, TAU); c.fill();
      // os cornos
      c.strokeStyle = '#f1e3c6'; c.lineWidth = 6; c.lineCap = 'round';
      c.beginPath(); c.moveTo(56, -76); c.quadraticCurveTo(60, -100, 80, -104); c.stroke();
      c.beginPath(); c.moveTo(66, -78); c.quadraticCurveTo(76, -96, 94, -96); c.stroke();
      c.strokeStyle = '#495057'; c.lineWidth = 6;
      c.beginPath(); c.moveTo(79, -104); c.lineTo(82, -104); c.moveTo(93, -96); c.lineTo(96, -96); c.stroke();
      if (a.carga > 0) { c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(94 + Math.sin(t * 20) * 3, -50, 6, 0, TAU); c.fill(); }
    }
    c.restore();
  }

  /* ---------- os tiros ---------- */
  function desenhaTiro(c, s, t) {
    if (s.t < 0) return;
    const a = Math.atan2(s.vy, s.vx);
    c.save(); c.translate(s.x, s.y); c.rotate(a);
    if (s.tipo === 'seta') {
      c.strokeStyle = '#8d5524'; c.lineWidth = 3; c.beginPath(); c.moveTo(-28, 0); c.lineTo(10, 0); c.stroke();
      c.fillStyle = '#adb5bd'; c.beginPath(); c.moveTo(16, 0); c.lineTo(6, -6); c.lineTo(6, 6); c.closePath(); c.fill();
      c.fillStyle = '#ffd166'; c.beginPath(); c.moveTo(-28, 0); c.lineTo(-38, -7); c.lineTo(-22, 0); c.lineTo(-38, 7); c.closePath(); c.fill();
    } else if (s.tipo === 'ia') {
      c.fillStyle = s.cor; c.globalAlpha = 0.35; c.beginPath(); c.arc(0, 0, 16, 0, TAU); c.fill();
      c.globalAlpha = 1; c.beginPath(); c.arc(0, 0, 8, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 3.5, 0, TAU); c.fill();
      G.gfx.star(c, 0, 0, 12, 'rgba(255,255,255,.6)', t * 6);
    } else {
      c.fillStyle = s.cor; G.gfx.rr(c, -14, -3, 28, 6, 3); c.fill();
      c.fillStyle = 'rgba(255,255,255,.85)'; G.gfx.rr(c, -8, -1.5, 18, 3, 1.5); c.fill();
    }
    c.restore();
  }
  function desenhaMau(c, s, t) {
    c.save(); c.translate(s.x, s.y);
    if (s.tipo === 'fogo') {
      c.fillStyle = 'rgba(255,109,0,.35)'; c.beginPath(); c.arc(0, 0, 18 + Math.sin(t * 20) * 3, 0, TAU); c.fill();
      c.fillStyle = '#ff9f1c'; c.beginPath(); c.arc(0, 0, 11, 0, TAU); c.fill();
      c.fillStyle = '#ffe066'; c.beginPath(); c.arc(-2, -2, 5, 0, TAU); c.fill();
    } else {
      c.rotate(Math.atan2(s.vy, s.vx));
      c.fillStyle = s.tipo === 'laser' ? 'rgba(255,59,59,.4)' : 'rgba(255,59,59,.3)';
      G.gfx.rr(c, -16, -6, 32, 12, 6); c.fill();
      c.fillStyle = '#ff3b3b'; G.gfx.rr(c, -12, -3, 24, 6, 3); c.fill();
      c.fillStyle = '#ffe3e3'; G.gfx.rr(c, -7, -1.2, 14, 2.4, 1.2); c.fill();
    }
    c.restore();
  }

  /* ---------- o cartão do presente ---------- */
  function cartao(c, t, alfa, festaFinal) {
    if (alfa <= 0) return;
    const W = G.W, H = G.H, k = Math.min(1, W / 520, H / 460);
    c.save(); c.globalAlpha = alfa;
    if (!festaFinal) { c.fillStyle = 'rgba(16,24,48,.55)'; c.fillRect(0, 0, W, H); }
    c.translate(W / 2, festaFinal ? H * 0.3 : H / 2); c.scale(k, k);
    const w = 440, h = festaFinal ? 170 : 250;
    c.fillStyle = 'rgba(0,0,0,.2)'; G.gfx.rr(c, -w / 2 + 6, -h / 2 + 8, w, h, 26); c.fill();
    c.fillStyle = '#fffaf0'; G.gfx.rr(c, -w / 2, -h / 2, w, h, 26); c.fill();
    c.strokeStyle = '#d97757'; c.lineWidth = 6; c.stroke();
    if (!festaFinal) {
      c.save(); c.translate(-150, 40); c.scale(0.22, 0.22); dragaoCorpo(c, t, false, true, 0.6); c.restore();
      G.gfx.label(c, 'O DRAGÃO ROBÔ', 0, -80, 38, '#1d3557', 'center');
      G.gfx.label(c, 'um jogo de presente', 0, -40, 20, '#6c757d', 'center');
      cabeca(c, 'pai', -20, 22, 2.2, t); cabeca(c, 'filho', 28, 30, 1.7, t);
      G.gfx.heart(c, 84, 24 + Math.sin(t * 5) * 3, 26, '#ff3b6b');
      G.gfx.label(c, DEDICATORIA, 0, 88, 30, '#c1121f', 'center');
    } else {
      const pulsa = 1 + Math.sin(t * 4) * 0.06;
      c.save(); c.scale(pulsa, pulsa);
      G.gfx.label(c, '🎉 CONSEGUIMOS! 🎉', 0, -42, 34, '#1d3557', 'center');
      c.restore();
      G.gfx.label(c, DEDICATORIA, 0, 30, 34, '#c1121f', 'center');
    }
    c.restore();
  }

  /* ---------- HUD ---------- */
  function hud(c, t) {
    const k = Math.min(1, G.H / 520, G.W / 420);
    c.save(); c.scale(k, k);
    for (let i = 0; i < MAXC; i++) {
      const x = 28 + i * 36, y = 34, f = clamp(coracoes - i, 0, 1);
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
    // as quatro partes da aventura
    for (let i = 0; i < TERRAS.length; i++) {
      const x = 34 + i * 46, y = 122, atual = i === terra;
      c.fillStyle = i < terra || fase === 'festa' ? 'rgba(128,255,219,.85)' : (atual ? 'rgba(255,214,10,.9)' : 'rgba(255,255,255,.55)');
      c.beginPath(); c.arc(x, y, atual ? 20 : 17, 0, TAU); c.fill();
      c.font = (atual ? 22 : 18) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000';
      c.fillText(TERRAS[i].icone, x, y + 1);
      if (i === 1) { c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x + 26, y - 1, 6, 2); }
    }
    G.gfx.label(c, T().facil ? 'fácil' : 'DIFÍCIL', 34 + 4 * 46 - 4, 123, 16, T().facil ? '#2f9e44' : '#c1121f');
    // a espingarda de IA a carregar
    c.save(); c.translate(32, 170);
    c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.fill();
    const pronta = cdIA <= 0;
    c.strokeStyle = pronta ? '#d97757' : '#ffffff'; c.lineWidth = 5;
    c.beginPath(); c.arc(0, 0, 20, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - cdIA / IA_CD)); c.stroke();
    c.font = (pronta ? 22 + Math.sin(t * 6) * 2 : 18) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000';
    c.fillText('✨', 0, 1);
    c.restore();
    G.gfx.label(c, carro ? 'Pai + Isaac 🏎️' : (quem === 'pai' ? 'Pai 🔫' : 'Isaac 🏹'), 62, 171, 18, '#1d3557');
    c.restore();
    // a energia do lobo ou do dragão, lá em cima ao meio
    let chefe = null, nome = '';
    if (dragao && (dragao.mau && !dragao.fugiu) && fase === 'joga') { chefe = dragao; nome = dragao.fugitivo ? '🐉 Caça ao dragão' : '🐉 Dragão robô'; }
    else if (lobo && lobo.mau) { chefe = lobo; nome = '🐺 Lobo robô'; }
    if (chefe) {
      const kk = Math.min(1, G.W / 640), w = 240;
      c.save(); c.translate(G.W / 2, (G.W < 560 ? 210 : 26) * Math.min(1, G.H / 520)); c.scale(kk, kk);
      G.gfx.label(c, nome, 0, 0, 18, '#22223b', 'center');
      c.fillStyle = 'rgba(0,0,0,.25)'; G.gfx.rr(c, -w / 2, 14, w, 14, 7); c.fill();
      c.fillStyle = '#ff9f1c'; G.gfx.rr(c, -w / 2, 14, Math.max(8, w * chefe.hp / chefe.max), 14, 7); c.fill();
      c.restore();
    }
  }

  S.debug = function () {
    return { terra: T().id, fase: fase, ronda: ronda, quem: quem, x: Math.round(eu().x), coracoes: coracoes, descansa: descansa > 0,
      maus: hostis().length, robos: robos.length, lobo: lobo ? { hp: lobo.hp, mau: lobo.mau, estado: lobo.estado } : null,
      dragao: dragao ? { hp: dragao.hp, mau: dragao.mau, fugiu: !!dragao.fugiu, estado: dragao.estado } : null,
      carro: carro ? Math.round(carro.x) : null, cdIA: +cdIA.toFixed(1), tiros: tiros.length, tirosMaus: maus.length,
      stats: JSON.parse(JSON.stringify(stats)), camX: Math.round(camX), LEN: LEN };
  };
  S.api = {
    vaiPara: function (i) { if (i === 3) { comecaTerra(2); lobo.mau = false; lobo.hp = 0; } comecaTerra(i); fase = 'joga'; },
    eu: eu, outro: outro, pai: function () { return pai; }, filho: function () { return filho; },
    robos: function () { return robos; }, lobo: function () { return lobo; }, dragao: function () { return dragao; },
    carro: function () { return carro; }, animais: function () { return animais; }, amigos: function () { return amigos; },
    hostis: hostis, caixa: caixa, maus: function () { return maus; }, fase: function () { return fase; },
    coracoes: function (v) { if (v !== undefined) coracoes = v; return coracoes; }, cdIA: function () { return cdIA; }
  };

  G.scenes = G.scenes || {};
  G.scenes.dragaorobo = S;
})();
