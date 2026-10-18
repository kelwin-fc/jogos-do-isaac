/* Arranque: canvas, loop, gestor de cenas, splash e estado global. */
(function () {
  window.G = window.G || {};
  const cv = document.getElementById('game');
  const c = cv.getContext('2d');

  G.W = 0; G.H = 0; G.paused = false; G.shake = 0;
  G.state = {
    stars: 0,
    best: +(localStorage.getItem('isaacBest') || 0),
    hearts: 3, round: 1, caught: 0, suit: false,
    castleRound: 1, golos: 0
  };

  // O menu tem de caber sempre: se o bloco de botões passar do ecrã (ecrã baixinho,
  // mais um jogo no futuro), encolhe-o o suficiente para ficar tudo à vista.
  const splashEl = document.getElementById('splash');
  const menuEl = splashEl.querySelector('.menu');
  G.fitSplash = function () {
    menuEl.style.setProperty('--fit', '1');
    if (!document.body.classList.contains('splash-on')) return;
    const cs = getComputedStyle(splashEl);
    const availH = splashEl.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const availW = splashEl.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const r = menuEl.getBoundingClientRect();
    if (!r.height || !r.width || availH <= 0 || availW <= 0) return;
    const k = Math.min(1, availH / r.height, availW / r.width);
    menuEl.style.setProperty('--fit', k.toFixed(4));
  };

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    G.W = window.innerWidth; G.H = window.innerHeight;
    cv.width = Math.round(G.W * dpr); cv.height = Math.round(G.H * dpr);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    G.fitSplash();
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(G.fitSplash);
  resize();

  G.addStars = function (n) {
    G.state.stars += n;
    if (G.state.stars > G.state.best) {
      G.state.best = G.state.stars;
      localStorage.setItem('isaacBest', '' + G.state.best);
    }
  };

  let bannerTimer = null;
  G.banner = function (text, ms) {
    const el = document.getElementById('banner');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(function () { el.classList.remove('show'); }, ms || 2000);
  };

  let cur = null;
  G.setScene = function (name) {
    cur = G.scenes[name];
    document.body.classList.remove('scene-flight', 'scene-jungle', 'scene-parachute', 'scene-castle', 'scene-futebol', 'scene-escape', 'scene-carros', 'scene-barbie', 'scene-ninja', 'scene-morcegos', 'scene-damas', 'scene-viuvas', 'scene-pista', 'scene-egito', 'scene-dragao', 'scene-classico', 'scene-cobras', 'scene-legos', 'scene-marvel', 'scene-mauzoes', 'scene-pokemon', 'scene-ash', 'ash-campo-espera', 'scene-robos', 'robos-super', 'walking', 'picking', 'cacador', 'marvel-porta', 'marvel-campo-espera', 'ash-dentro');
    document.body.classList.add('scene-' + name);
    const motorDragao = name === 'dragao' || name === 'classico';   // os dois jogos do motor do Dragão
    document.getElementById('btnFire').textContent =
      name === 'castle' ? '🚀' : (motorDragao ? '👟' : (name === 'cobras' ? '💨' : (name === 'mauzoes' ? '🧱' : (name === 'robos' ? '🕸️' : '⚡'))));
    // o Egito usa a buzina como ARCO, o Dragão e o Clássico como PASSE e as Cobras
    // como FESTA; nos outros jogos ela volta a ser buzina
    document.getElementById('btnHorn').textContent =
      name === 'egito' ? '🏹' : (motorDragao ? '🤝' : (name === 'cobras' ? '🎉' : (name === 'marvel' ? '🦸' : (name === 'mauzoes' ? '🤝' : (name === 'ash' ? '🔄' : (name === 'robos' ? '👊' : '📯'))))));
    // no jogo do Pikachu o botão da porta é a bola de campo de força
    document.getElementById('btnDoor').textContent = name === 'ash' ? '🛡️' : (name === 'robos' ? '💥' : '🚪');
    cur.enter();
  };

  G.goMenu = function () {
    cur = null;
    document.body.classList.remove('scene-flight', 'scene-jungle', 'scene-parachute', 'scene-castle', 'scene-futebol', 'scene-escape', 'scene-carros', 'scene-barbie', 'scene-ninja', 'scene-morcegos', 'scene-damas', 'scene-viuvas', 'scene-pista', 'scene-egito', 'scene-dragao', 'scene-classico', 'scene-cobras', 'scene-legos', 'scene-marvel', 'scene-mauzoes', 'scene-pokemon', 'scene-ash', 'ash-campo-espera', 'scene-robos', 'robos-super', 'walking', 'picking', 'cacador', 'marvel-porta', 'marvel-campo-espera', 'ash-dentro');
    document.body.classList.add('splash-on');
    if (G.audio.engineSet) G.audio.engineSet(0);
    if (G.audio.cala) G.audio.cala();   // a voz (Legos, Marvel) não fica a falar no menu
    G.fitSplash();
  };

  /* ---------- fundo do menu ----------
     Há dois estilos e o botão 🎛️ troca entre eles (fica guardado no telemóvel):
       'lista'   = versão de sempre — lista de botões e o avião no céu
       'mosaico' = botões em mosaico e uma composição com um bocadinho de cada jogo */
  const TAU = Math.PI * 2;
  const menuClouds = [];
  for (let i = 0; i < 6; i++) menuClouds.push({ x: Math.random(), y: 0.1 + Math.random() * 0.5, s: 26 + Math.random() * 40 });
  const menuEstrelas = [];
  for (let i = 0; i < 60; i++) menuEstrelas.push({ x: Math.random(), y: Math.random() * 0.6, b: Math.random() });

  G.menuEstilo = localStorage.getItem('isaacMenu') || 'mosaico';
  function aplicarEstilo() {
    document.body.classList.toggle('menu-mosaico', G.menuEstilo === 'mosaico');
    G.fitSplash();
  }

  function fundoClassico(c, t) {
    const W = G.W, H = G.H;
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#5bb8ff'); g.addColorStop(0.7, '#bfe7ff'); g.addColorStop(1, '#d9f3ff');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    G.gfx.sun(c, W * 0.82, H * 0.15, Math.min(W, H) * 0.08, t);
    for (const cl of menuClouds) G.gfx.cloud(c, cl.x * W, cl.y * H, cl.s, 0.9);
    c.save();
    c.translate(W / 2, H * 0.72 + Math.sin(t * 1.4) * 12);
    c.rotate(Math.sin(t * 0.9) * 0.06);
    c.scale(1.8, 1.8);
    G.gfx.planeFront(c, t, { color: '#ff595e' });
    c.restore();
  }

  // composição: castelo, futebol, estrada, telhados da Barbie e o telhado dos ninjas,
  // com o dia à esquerda e a noite à direita e o avião a atravessar o céu
  function fundoComposicao(c, t) {
    const W = G.W, H = G.H;
    // ao alto o cenário desce para baixo dos botões, senão ficava tapado por eles
    const u = Math.min(W / 560, H / 640), base = H * (H > W ? 0.93 : 0.82);
    let g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#5bb8ff'); g.addColorStop(0.5, '#bfe7ff'); g.addColorStop(1, '#ffe0bd');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    g = c.createLinearGradient(W * 0.40, 0, W, 0);
    g.addColorStop(0, 'rgba(20,20,60,0)'); g.addColorStop(1, 'rgba(16,16,48,.92)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);

    for (const s of menuEstrelas) {                       // estrelinhas só do lado da noite
      const x = s.x * W;
      if (x < W * 0.5) continue;
      c.globalAlpha = Math.min(1, (x / W - 0.5) * 2.4) * (0.35 + 0.65 * Math.abs(Math.sin(t * 1.3 + s.b * 9)));
      c.fillStyle = '#fff'; c.fillRect(x, s.y * H, 2.5, 2.5);
    }
    c.globalAlpha = 1;
    G.gfx.sun(c, W * 0.10, H * 0.12, 30 * u, t);
    c.fillStyle = '#fff3bf';
    c.beginPath(); c.arc(W * 0.89, H * 0.13, 26 * u, 0, TAU); c.fill();
    for (const cl of menuClouds) if (cl.x < 0.6) G.gfx.cloud(c, cl.x * W, cl.y * H * 0.9, cl.s * u, 0.8);

    // chão: relva, estrada e cidade
    c.fillStyle = '#4aa96c'; c.fillRect(0, base, W * 0.42, H - base);
    c.fillStyle = '#8d99ae'; c.fillRect(W * 0.40, base, W * 0.24, H - base);
    c.fillStyle = '#2b2140'; c.fillRect(W * 0.62, base, W * 0.38, H - base);
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 4 * u;
    c.setLineDash([16 * u, 14 * u]);
    c.beginPath();
    c.moveTo(W * 0.40, base + (H - base) * 0.5); c.lineTo(W * 0.64, base + (H - base) * 0.5); c.stroke();
    c.setLineDash([]);

    // castelo azul com bandeira e um esqueleto amigo
    const cx = W * 0.09;
    c.fillStyle = '#5e60ce'; c.fillRect(cx - 46 * u, base - 88 * u, 92 * u, 88 * u);
    for (let k = 0; k < 4; k++) c.fillRect(cx - 46 * u + k * 25 * u, base - 102 * u, 17 * u, 16 * u);
    c.fillStyle = '#3f3d9e'; c.fillRect(cx - 13 * u, base - 44 * u, 26 * u, 44 * u);
    c.strokeStyle = '#fff'; c.lineWidth = 3 * u;
    c.beginPath(); c.moveTo(cx, base - 102 * u); c.lineTo(cx, base - 142 * u); c.stroke();
    c.fillStyle = '#4cc9f0';
    c.beginPath();
    c.moveTo(cx, base - 142 * u); c.lineTo(cx + 30 * u, base - 132 * u); c.lineTo(cx, base - 122 * u);
    c.closePath(); c.fill();
    c.save(); c.translate(cx + 74 * u, base); c.scale(0.62 * u, 0.62 * u);
    G.gfx.skeleton(c, t, { team: 'blue', wave: true });
    c.restore();

    // baliza e bola a saltar
    const fx = W * 0.27, gw = 88 * u, gh = 58 * u;
    c.strokeStyle = '#fff'; c.lineWidth = 5 * u;
    c.strokeRect(fx - gw / 2, base - gh, gw, gh);
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.6 * u;
    for (let k = 1; k < 5; k++) {
      c.beginPath(); c.moveTo(fx - gw / 2 + (gw / 5) * k, base - gh); c.lineTo(fx - gw / 2 + (gw / 5) * k, base); c.stroke();
      c.beginPath(); c.moveTo(fx - gw / 2, base - gh + (gh / 5) * k); c.lineTo(fx + gw / 2, base - gh + (gh / 5) * k); c.stroke();
    }
    const by = base - 10 * u - Math.abs(Math.sin(t * 2)) * 58 * u;
    c.fillStyle = '#fff'; c.beginPath(); c.arc(fx + 62 * u, by, 10 * u, 0, TAU); c.fill();
    c.fillStyle = '#22223b'; c.beginPath(); c.arc(fx + 62 * u, by, 4 * u, 0, TAU); c.fill();

    // carrinho a passar na estrada
    const carX = W * 0.40 + ((t * 70 * u) % (W * 0.26));
    c.save(); c.translate(carX, base + (H - base) * 0.34); c.scale(u, u);
    c.fillStyle = '#ef476f';
    G.gfx.rr(c, -28, -18, 56, 18, 7); c.fill();
    G.gfx.rr(c, -16, -30, 32, 14, 6); c.fill();
    c.fillStyle = '#bfe4ff'; G.gfx.rr(c, -12, -27, 24, 9, 4); c.fill();
    c.fillStyle = '#22223b';
    c.beginPath(); c.arc(-15, 0, 7, 0, TAU); c.arc(15, 0, 7, 0, TAU); c.fill();
    c.restore();

    // telhados da Barbie, com ela a saltar de um para o outro
    const bx = W * 0.66;
    c.fillStyle = '#ffd6e8'; c.fillRect(bx - 78 * u, base - 76 * u, 62 * u, 76 * u);
    c.fillRect(bx + 16 * u, base - 100 * u, 66 * u, 100 * u);
    c.fillStyle = '#e05780';
    G.gfx.rr(c, bx - 84 * u, base - 86 * u, 74 * u, 12 * u, 5 * u); c.fill();
    G.gfx.rr(c, bx + 10 * u, base - 110 * u, 78 * u, 12 * u, 5 * u); c.fill();
    const jt = (t * 0.5) % 1;
    const jx = bx - 48 * u + jt * 96 * u;
    const jy = base - 86 * u - Math.sin(jt * Math.PI) * 52 * u - jt * 24 * u;
    c.save(); c.translate(jx, jy); c.scale(u, u);
    c.fillStyle = '#ff4fa3';
    c.beginPath(); c.moveTo(-9, -22); c.lineTo(9, -22); c.lineTo(15, 0); c.lineTo(-15, 0); c.closePath(); c.fill();
    c.fillStyle = '#ffd9b3'; c.beginPath(); c.arc(0, -30, 8, 0, TAU); c.fill();
    c.fillStyle = '#ffd75e'; c.beginPath(); c.arc(0, -32, 8.5, Math.PI, 0); c.fill();
    c.fillRect(-9, -32, 5, 16);
    c.restore();
    G.gfx.star(c, jx + 26 * u, jy - 40 * u, 8 * u, '#ffd166', t * 2);

    // telhado dos ninjas, com lampião e uma estrela ninja a voar
    const nx = W * 0.90;
    c.fillStyle = '#8a5a2b';
    G.gfx.rr(c, nx - 62 * u, base - 66 * u, 124 * u, 14 * u, 5 * u); c.fill();
    c.fillStyle = '#6b4423'; c.fillRect(nx - 40 * u, base - 52 * u, 12 * u, 52 * u);
    c.fillRect(nx + 28 * u, base - 52 * u, 12 * u, 52 * u);
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45;
    const lg = c.createRadialGradient(nx - 82 * u, base - 112 * u, 2, nx - 82 * u, base - 112 * u, 54 * u);
    lg.addColorStop(0, '#ffb703'); lg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = lg; c.beginPath(); c.arc(nx - 82 * u, base - 112 * u, 54 * u, 0, TAU); c.fill();
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2;
    c.beginPath();
    c.moveTo(nx - 82 * u, base - 160 * u); c.lineTo(nx - 82 * u, base - 126 * u); c.stroke();
    c.fillStyle = '#ef476f';
    c.beginPath(); c.ellipse(nx - 82 * u, base - 112 * u, 11 * u, 15 * u, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,220,150,.9)';
    c.beginPath(); c.ellipse(nx - 82 * u, base - 112 * u, 6 * u, 9 * u, 0, 0, TAU); c.fill();
    c.save(); c.translate(nx + 4 * u, base - 66 * u); c.scale(u, u);   // ninja verde
    c.strokeStyle = '#22223b'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-3, -24); c.lineTo(-6, -2); c.stroke();
    c.beginPath(); c.moveTo(4, -24); c.lineTo(7, -2); c.stroke();
    c.fillStyle = '#2f9e44'; G.gfx.rr(c, -10, -46, 21, 24, 8); c.fill();
    c.strokeStyle = '#2f9e44'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(-9, -43);
    c.quadraticCurveTo(-24, -40 + Math.sin(t * 6) * 5, -33, -29 + Math.cos(t * 5) * 5); c.stroke();
    c.beginPath(); c.arc(1, -56, 11, 0, TAU); c.fillStyle = '#2f9e44'; c.fill();
    c.fillStyle = '#ffd9b3'; G.gfx.rr(c, -5, -60, 15, 8, 4); c.fill();
    c.restore();
    const sx = nx - 130 * u + ((t * 130 * u) % (170 * u));
    c.save(); c.translate(sx, base - 100 * u); c.rotate(t * 12);
    c.fillStyle = '#dbe4ff';
    c.beginPath();
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * TAU;
      c.lineTo(Math.cos(a) * 9 * u, Math.sin(a) * 9 * u);
      c.lineTo(Math.cos(a + 0.39) * 3 * u, Math.sin(a + 0.39) * 3 * u);
    }
    c.closePath(); c.fill();
    c.restore();

    // o avião a atravessar o céu todo
    const px = ((t * 46 * u) % (W + 340)) - 170;
    c.save();
    c.translate(px, H * 0.33 + Math.sin(t * 1.2) * 10 * u);
    c.scale(0.9 * u, 0.9 * u);
    c.rotate(Math.sin(t * 0.8) * 0.05);
    G.gfx.planeSide(c, t, { color: '#ff595e', prop: true });
    c.restore();
  }

  const menu = {
    enter: function () {}, update: function (dt) {
      for (const cl of menuClouds) { cl.x += dt * 0.015; if (cl.x > 1.15) cl.x = -0.15; }
    },
    draw: function (c, t) {
      if (G.menuEstilo === 'mosaico') fundoComposicao(c, t); else fundoClassico(c, t);
    }
  };
  G.menuScene = menu;   // exposto para se poder testar/fotografar o fundo do menu

  let last = 0;
  function loop(ts) {
    requestAnimationFrame(loop);
    const t = ts / 1000;
    const dt = Math.min(0.05, Math.max(0.001, t - last));
    last = t;
    if (G.paused) return;
    if (window.innerWidth !== G.W || window.innerHeight !== G.H) resize();
    G.shake = Math.max(0, G.shake - dt * 1.1);
    c.save();
    if (G.shake > 0.01) c.translate((Math.random() - 0.5) * G.shake * 24, (Math.random() - 0.5) * G.shake * 24);
    const scene = cur || menu;
    scene.update(dt, t);
    scene.draw(c, t);
    c.restore();
    G.input.endFrame();
  }

  // botões DOM
  function startGame(scene) {
    G.audio.init(); G.audio.resume();
    document.body.classList.remove('splash-on');
    G.setScene(scene);
  }
  document.getElementById('btnPlayFly').addEventListener('click', function () { startGame('flight'); });
  document.getElementById('btnPlayCastle').addEventListener('click', function () { startGame('castle'); });
  document.getElementById('btnPlayFutebol').addEventListener('click', function () { startGame('futebol'); });
  document.getElementById('btnPlayCarros').addEventListener('click', function () { startGame('carros'); });
  document.getElementById('btnPlayBarbie').addEventListener('click', function () { startGame('barbie'); });
  document.getElementById('btnPlayNinja').addEventListener('click', function () { startGame('ninja'); });
  document.getElementById('btnPlayMorcegos').addEventListener('click', function () { startGame('morcegos'); });
  document.getElementById('btnPlayDamas').addEventListener('click', function () { startGame('damas'); });
  document.getElementById('btnPlayViuvas').addEventListener('click', function () { startGame('viuvas'); });
  // a corrida também se joga direta do menu (o Isaac quer entrar "quando ele quiser")
  document.getElementById('btnPlayPista').addEventListener('click', function () {
    G.pistaVolta = 'menu';
    startGame('pista');
  });
  document.getElementById('btnPlayEgito').addEventListener('click', function () { startGame('egito'); });
  document.getElementById('btnPlayDragao').addEventListener('click', function () { startGame('dragao'); });
  document.getElementById('btnPlayCobras').addEventListener('click', function () { startGame('cobras'); });
  document.getElementById('btnPlayClassico').addEventListener('click', function () { startGame('classico'); });
  document.getElementById('btnPlayMarvel').addEventListener('click', function () { startGame('marvel'); });
  document.getElementById('btnPlayMauzoes').addEventListener('click', function () { startGame('mauzoes'); });
  document.getElementById('btnPlayPokemon').addEventListener('click', function () { startGame('pokemon'); });
  document.getElementById('btnPlayAsh').addEventListener('click', function () { startGame('ash'); });
  document.getElementById('btnPlayRobos').addEventListener('click', function () { startGame('robos'); });
  document.getElementById('btnPlayLegos').addEventListener('click', function () { startGame('legos'); });
  document.getElementById('btnHome').addEventListener('click', function () { G.goMenu(); });

  document.getElementById('btnEstilo').addEventListener('click', function () {
    G.menuEstilo = G.menuEstilo === 'mosaico' ? 'lista' : 'mosaico';
    localStorage.setItem('isaacMenu', G.menuEstilo);
    aplicarEstilo();
  });
  aplicarEstilo();

  const sndBtn = document.getElementById('btnSound');
  sndBtn.textContent = localStorage.getItem('isaacSound') === '0' ? '🔇' : '🔊';
  sndBtn.addEventListener('click', function () {
    G.audio.init();
    sndBtn.textContent = G.audio.toggle() ? '🔊' : '🔇';
  });

  document.addEventListener('visibilitychange', function () {
    G.paused = document.hidden;
    if (G.audio.ctx) { if (document.hidden) G.audio.ctx.suspend(); else G.audio.ctx.resume(); }
  });

  /* ---------- instalar no telemóvel (PWA) ----------
     O service worker guarda o jogo para abrir sem internet. Só funciona servido por
     http(s) — aberto por duplo clique (file://) o jogo continua igual, sem instalar.
     O botão 📲 só aparece no menu quando o browser deixa instalar (Android/Chrome);
     no iPhone instala-se pelo botão Partilhar → "Adicionar ao ecrã principal". */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* sem instalar, joga-se na mesma */ });
    });
  }
  const btnInstalar = document.getElementById('btnInstalar');
  let pedidoInstalar = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    pedidoInstalar = e;
    document.body.classList.add('pode-instalar');
  });
  window.addEventListener('appinstalled', function () {
    pedidoInstalar = null;
    document.body.classList.remove('pode-instalar');
  });
  btnInstalar.addEventListener('click', function () {
    if (!pedidoInstalar) return;
    pedidoInstalar.prompt();
    pedidoInstalar.userChoice.then(function () {
      pedidoInstalar = null;
      document.body.classList.remove('pode-instalar');
    });
  });

  G.input.bind();
  requestAnimationFrame(function (ts) { last = ts / 1000; requestAnimationFrame(loop); });
})();
