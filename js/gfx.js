/* Desenho cartoon 100% por código — sem imagens. Formas centradas na origem; quem chama faz translate/scale. */
(function () {
  window.G = window.G || {};
  const X = {};
  const TAU = Math.PI * 2;

  X.FRIEND_COLORS = ['#ff595e', '#1982c4', '#8ac926', '#ffca3a', '#ff924c'];

  X.rr = function (c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  };

  X.star = function (c, x, y, r, color, rot) {
    c.save(); c.translate(x, y); c.rotate(rot || 0);
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? r : r * 0.45;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    c.closePath();
    c.fillStyle = color || '#ffd166'; c.fill();
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = r * 0.12; c.stroke();
    c.restore();
  };

  X.heart = function (c, x, y, s, color) {
    c.save(); c.translate(x, y); c.scale(s / 20, s / 20);
    c.beginPath();
    c.moveTo(0, 6);
    c.bezierCurveTo(-14, -6, -7, -16, 0, -8);
    c.bezierCurveTo(7, -16, 14, -6, 0, 6);
    c.fillStyle = color || '#ff5d8f'; c.fill();
    c.restore();
  };

  X.cloud = function (c, x, y, s, alpha) {
    c.save(); c.globalAlpha = (alpha == null ? 0.9 : alpha);
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(x - s * 0.8, y, s * 0.55, 0, TAU);
    c.arc(x, y - s * 0.35, s * 0.7, 0, TAU);
    c.arc(x + s * 0.8, y, s * 0.55, 0, TAU);
    c.arc(x, y + s * 0.15, s * 0.6, 0, TAU);
    c.fill();
    c.restore();
  };

  X.sun = function (c, x, y, r, t) {
    c.save(); c.translate(x, y);
    c.strokeStyle = '#ffd166'; c.lineWidth = r * 0.16; c.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const a = t * 0.15 + (i * TAU) / 12;
      c.beginPath();
      c.moveTo(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25);
      c.lineTo(Math.cos(a) * r * 1.55, Math.sin(a) * r * 1.55);
      c.stroke();
    }
    c.fillStyle = '#ffdd55';
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.fillStyle = '#5a4500';
    c.beginPath(); c.arc(-r * 0.32, -r * 0.15, r * 0.09, 0, TAU); c.fill();
    c.beginPath(); c.arc(r * 0.32, -r * 0.15, r * 0.09, 0, TAU); c.fill();
    c.strokeStyle = '#5a4500'; c.lineWidth = r * 0.08;
    c.beginPath(); c.arc(0, r * 0.1, r * 0.35, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    c.fillStyle = 'rgba(255,120,120,.5)';
    c.beginPath(); c.arc(-r * 0.5, r * 0.15, r * 0.12, 0, TAU); c.arc(r * 0.5, r * 0.15, r * 0.12, 0, TAU); c.fill();
    c.restore();
  };

  /* Avião visto de frente (tamanho base ~120 de envergadura). opts: {thief, color, prop} */
  X.planeFront = function (c, t, opts) {
    opts = opts || {};
    const body = opts.thief ? '#9aa5b1' : (opts.color || '#ff595e');
    const dark = opts.thief ? '#7b8794' : 'rgba(0,0,0,.15)';
    // asas
    X.rr(c, -60, -6, 120, 14, 7); c.fillStyle = body; c.fill();
    c.fillStyle = dark; X.rr(c, -60, 2, 120, 6, 3); c.fill();
    // cauda
    X.rr(c, -4, -34, 8, 22, 4); c.fillStyle = body; c.fill();
    // fuselagem
    c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.fillStyle = body; c.fill();
    c.beginPath(); c.arc(0, -4, 15, Math.PI, 0); c.fillStyle = 'rgba(255,255,255,.35)'; c.fill();
    // cara
    if (opts.thief) {
      X.rr(c, -14, -10, 28, 11, 5); c.fillStyle = '#2b2d42'; c.fill();
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(-6, -4.5, 3.2, 0, TAU); c.arc(6, -4.5, 3.2, 0, TAU); c.fill();
      c.fillStyle = '#2b2d42';
      c.beginPath(); c.arc(-6, -4.5, 1.4, 0, TAU); c.arc(6, -4.5, 1.4, 0, TAU); c.fill();
      c.strokeStyle = '#2b2d42'; c.lineWidth = 2;
      c.beginPath(); c.arc(0, 6, 5, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
      // saco de estrelas roubadas
      c.save(); c.translate(0, 26); c.rotate(Math.sin(t * 3) * 0.1);
      c.beginPath(); c.arc(0, 6, 10, 0, TAU); c.fillStyle = '#b08968'; c.fill();
      c.strokeStyle = '#7f5539'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-5, -2); c.lineTo(5, -2); c.stroke();
      X.star(c, 0, 6, 4.5, '#ffd166', 0);
      c.restore();
    } else {
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(-6, -4, 4, 0, TAU); c.arc(6, -4, 4, 0, TAU); c.fill();
      c.fillStyle = '#2b2d42';
      c.beginPath(); c.arc(-6, -3.5, 1.8, 0, TAU); c.arc(6, -3.5, 1.8, 0, TAU); c.fill();
      c.strokeStyle = '#2b2d42'; c.lineWidth = 2.2; c.lineCap = 'round';
      c.beginPath(); c.arc(0, 4, 6.5, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
      c.fillStyle = 'rgba(255,120,120,.55)';
      c.beginPath(); c.arc(-11, 3, 2.6, 0, TAU); c.arc(11, 3, 2.6, 0, TAU); c.fill();
    }
    // hélice
    if (opts.prop !== false) {
      c.save(); c.translate(0, 0);
      c.strokeStyle = 'rgba(90,69,0,.55)'; c.lineWidth = 3; c.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const a = t * 22 + (i * TAU) / 3;
        c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 26, Math.sin(a) * 26); c.stroke();
      }
      c.fillStyle = '#ffca3a'; c.beginPath(); c.arc(0, 0, 4, 0, TAU); c.fill();
      c.restore();
    }
  };

  /* Avião visto de lado, virado para a direita (comprimento base ~150). */
  X.planeSide = function (c, t, opts) {
    opts = opts || {};
    const body = opts.color || '#ff595e';
    X.rr(c, -75, -18, 130, 36, 18); c.fillStyle = body; c.fill();
    X.rr(c, -75, -18, 130, 14, 10); c.fillStyle = 'rgba(255,255,255,.3)'; c.fill();
    // cauda
    c.beginPath(); c.moveTo(-75, -6); c.lineTo(-95, -34); c.lineTo(-62, -14); c.closePath();
    c.fillStyle = body; c.fill();
    // asa
    X.rr(c, -30, -4, 56, 12, 6); c.fillStyle = 'rgba(0,0,0,.18)'; c.fill();
    // janela / cara
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(28, -6, 7, 0, TAU); c.fill();
    c.fillStyle = '#2b2d42'; c.beginPath(); c.arc(30, -6, 3, 0, TAU); c.fill();
    c.strokeStyle = '#2b2d42'; c.lineWidth = 2.5; c.lineCap = 'round';
    c.beginPath(); c.arc(34, 6, 7, 0.1 * Math.PI, 0.6 * Math.PI); c.stroke();
    // hélice no nariz
    c.fillStyle = '#ffca3a'; c.beginPath(); c.arc(58, 0, 5, 0, TAU); c.fill();
    if (opts.prop) {
      c.strokeStyle = 'rgba(90,69,0,.5)'; c.lineWidth = 4; c.lineCap = 'round';
      const a = t * 26;
      c.beginPath(); c.moveTo(58, -Math.abs(Math.sin(a)) * 26); c.lineTo(58, Math.abs(Math.sin(a)) * 26); c.stroke();
    }
    // rodas
    if (!opts.noWheels) {
      c.fillStyle = '#4a4e69';
      c.beginPath(); c.arc(-20, 24, 8, 0, TAU); c.arc(24, 24, 8, 0, TAU); c.fill();
      c.fillStyle = '#9a8c98';
      c.beginPath(); c.arc(-20, 24, 3.5, 0, TAU); c.arc(24, 24, 3.5, 0, TAU); c.fill();
    }
    // pistola de raios quentes montada debaixo do nariz
    if (opts.gun) {
      c.fillStyle = '#6c757d';
      X.rr(c, 24, 10, 22, 9, 4); c.fill();
      c.fillStyle = '#ff6d00';
      c.beginPath(); c.arc(47, 14.5, 4, 0, TAU); c.fill();
    }
  };

  /* Paraquedas arco-íris com piloto pendurado (raio base ~55). */
  X.parachute = function (c, t, opts) {
    opts = opts || {};
    const R = 55;
    const cols = ['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];
    const sway = Math.sin(t * 1.6) * 0.08;
    c.save(); c.rotate(sway);
    for (let i = 0; i < 6; i++) {
      c.beginPath();
      c.moveTo(0, 0);
      c.arc(0, 0, R, Math.PI + (i * Math.PI) / 6, Math.PI + ((i + 1) * Math.PI) / 6);
      c.closePath();
      c.fillStyle = cols[i]; c.fill();
    }
    c.strokeStyle = 'rgba(80,80,90,.7)'; c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-R, 0); c.lineTo(-10, 46);
    c.moveTo(R, 0); c.lineTo(10, 46);
    c.stroke();
    // piloto pendurado a acenar (ou esqueleto resgatado)
    c.translate(0, 58);
    if (opts.skeleton) {
      c.save(); c.scale(0.62, 0.62); c.translate(0, 30);
      X.skeleton(c, t, { team: opts.team || 'red', wave: true });
      c.restore();
      c.restore();
      return;
    }
    if (opts.zombie) { // zombie de gelo resgatado, pendurado a balançar
      c.save(); c.scale(0.5, 0.5); c.translate(0, 40);
      X.zombie(c, t, {});
      c.restore();
      c.restore();
      return;
    }
    c.fillStyle = opts.suit ? '#ffb703' : '#3a86ff';
    X.rr(c, -10, -8, 20, 24, 8); c.fill();
    c.beginPath(); c.arc(0, -16, 10, 0, TAU); c.fillStyle = '#ffd9b3'; c.fill();
    c.fillStyle = opts.thief ? '#2b2d42' : '#e63946';
    c.beginPath(); c.arc(0, -18, 10, Math.PI, 0); c.fill();
    c.fillStyle = '#2b2d42';
    c.beginPath(); c.arc(-3.5, -15, 1.5, 0, TAU); c.arc(3.5, -15, 1.5, 0, TAU); c.fill();
    c.strokeStyle = '#2b2d42'; c.lineWidth = 1.6;
    c.beginPath(); c.arc(0, -12, 4, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    // braço a acenar
    c.save(); c.translate(9, -4); c.rotate(-0.8 + Math.sin(t * 8) * 0.5);
    c.strokeStyle = opts.suit ? '#ffb703' : '#3a86ff'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 0); c.lineTo(10, -12); c.stroke();
    c.restore();
    c.restore();
  };

  /* Herói a pé, virado p/ direita (altura base ~95, pés em y=0). opts: {walk, suit, gun, wave} */
  X.hero = function (c, t, opts) {
    opts = opts || {};
    const suit = opts.suit;
    const bodyCol = suit ? '#ffb703' : '#3a86ff';
    const walk = opts.walk || 0;
    const l1 = Math.sin(walk) * 10, l2 = -Math.sin(walk) * 10;
    // pernas (dobradas para a frente quando sentado na mota)
    c.strokeStyle = suit ? '#fb8500' : '#264653'; c.lineWidth = 9; c.lineCap = 'round';
    if (opts.sit) {
      c.beginPath(); c.moveTo(-2, -34); c.lineTo(13, -22); c.stroke();
      c.beginPath(); c.moveTo(7, -34); c.lineTo(18, -22); c.stroke();
      c.fillStyle = '#e63946';
      c.beginPath(); c.arc(15, -20, 6, 0, TAU); c.arc(20, -20, 6, 0, TAU); c.fill();
    } else {
      c.beginPath(); c.moveTo(-4, -34); c.lineTo(-4 + l1 * 0.6, -4); c.stroke();
      c.beginPath(); c.moveTo(6, -34); c.lineTo(6 + l2 * 0.6, -4); c.stroke();
      c.fillStyle = '#e63946';
      c.beginPath(); c.arc(-4 + l1 * 0.6, -3, 6, 0, TAU); c.arc(6 + l2 * 0.6, -3, 6, 0, TAU); c.fill();
    }
    // corpo
    X.rr(c, -14, -62, 30, 34, 12); c.fillStyle = bodyCol; c.fill();
    if (suit) { c.fillStyle = 'rgba(255,255,255,.5)'; X.rr(c, -8, -56, 18, 8, 4); c.fill(); }
    // braço com pistola laser
    c.save(); c.translate(8, -52); c.rotate(opts.wave ? (-1.2 + Math.sin(t * 8) * 0.4) : 0);
    c.strokeStyle = bodyCol; c.lineWidth = 8; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 0); c.lineTo(18, 2); c.stroke();
    if (opts.gun && !opts.wave) {
      c.fillStyle = '#6c757d'; X.rr(c, 16, -5, 16, 9, 3); c.fill();
      c.fillStyle = '#ff6d00'; c.beginPath(); c.arc(33, -0.5, 3.5, 0, TAU); c.fill();
    }
    c.restore();
    // cabeça
    c.beginPath(); c.arc(1, -76, 15, 0, TAU); c.fillStyle = '#ffd9b3'; c.fill();
    if (opts.capacete) {
      // capacete de mota a sério: casca inteira, viseira e riscas (na mota leva-se capacete!)
      c.fillStyle = opts.capaceteCor || '#e63946';
      c.beginPath(); c.arc(1, -77, 17, Math.PI * 0.98, Math.PI * 0.1); c.fill();
      X.rr(c, -16, -78, 34, 12, 5); c.fill();
      c.fillStyle = 'rgba(255,255,255,.85)';
      X.rr(c, -6, -92, 8, 16, 3); c.fill();
      c.fillStyle = 'rgba(40,50,70,.85)';                  // viseira escura
      c.beginPath();
      c.moveTo(-2, -80); c.quadraticCurveTo(16, -82, 18, -72);
      c.quadraticCurveTo(8, -68, -2, -70); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.4)';
      c.beginPath(); c.ellipse(9, -77, 5, 2.4, -0.3, 0, TAU); c.fill();
      c.strokeStyle = '#2b2d42'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-14, -68); c.lineTo(-8, -62); c.stroke();   // fivela
    } else {
      // capacete de piloto com óculos
      c.beginPath(); c.arc(1, -79, 15, Math.PI, 0); c.fillStyle = suit ? '#fb8500' : '#e63946'; c.fill();
      X.rr(c, -12, -80, 26, 6, 3); c.fillStyle = '#8ecae6'; c.fill();
      c.fillStyle = '#2b2d42';
      c.beginPath(); c.arc(6, -72, 2, 0, TAU); c.fill();
      c.strokeStyle = '#2b2d42'; c.lineWidth = 1.8; c.lineCap = 'round';
      c.beginPath(); c.arc(6, -68, 4.5, 0.1 * Math.PI, 0.7 * Math.PI); c.stroke();
      c.fillStyle = 'rgba(255,120,120,.5)';
      c.beginPath(); c.arc(11, -69, 2.5, 0, TAU); c.fill();
    }
  };

  /* Zombie de gelo (cubo azul sonolento; base no chão y=0). opts: {melt 0..1} */
  X.zombie = function (c, t, opts) {
    opts = opts || {};
    const melt = opts.melt || 0;
    const squash = 1 - melt * 0.75;
    // poça
    if (melt > 0.05) {
      c.fillStyle = 'rgba(140,200,255,.7)';
      c.beginPath(); c.ellipse(0, 0, 30 + melt * 26, 7 + melt * 4, 0, 0, TAU); c.fill();
    }
    c.save(); c.translate(0, 0); c.scale(1 + melt * 0.25, squash);
    c.globalAlpha = 1 - melt * 0.85;
    const wob = Math.sin(t * 2.2) * 0.05;
    c.rotate(wob);
    // cubo de gelo
    X.rr(c, -30, -72, 60, 72, 14);
    c.fillStyle = 'rgba(120,190,255,.85)'; c.fill();
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 3; c.stroke();
    X.rr(c, -22, -66, 20, 14, 6); c.fillStyle = 'rgba(255,255,255,.45)'; c.fill();
    // fissuras
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(14, -60); c.lineTo(20, -50); c.lineTo(14, -42); c.stroke();
    // bracinhos
    c.strokeStyle = 'rgba(120,190,255,.9)'; c.lineWidth = 10; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-28, -40); c.lineTo(-44, -34 + Math.sin(t * 3) * 4); c.stroke();
    c.beginPath(); c.moveTo(28, -40); c.lineTo(44, -34 + Math.cos(t * 3) * 4); c.stroke();
    // cara sonolenta
    c.strokeStyle = '#2b2d42'; c.lineWidth = 2.6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-16, -46); c.quadraticCurveTo(-10, -42, -4, -46); c.stroke();
    c.beginPath(); c.moveTo(4, -46); c.quadraticCurveTo(10, -42, 16, -46); c.stroke();
    c.fillStyle = '#2b2d42';
    c.beginPath(); c.ellipse(0, -32, 4, 5.5, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(160,120,255,.35)';
    c.beginPath(); c.arc(-20, -34, 4, 0, TAU); c.arc(20, -34, 4, 0, TAU); c.fill();
    c.restore();
  };

  /* Animal feliz libertado (base no chão y=0). kind: 0 macaco, 1 papagaio, 2 rã */
  X.animal = function (c, kind, t) {
    const hop = Math.abs(Math.sin(t * 4)) * 8;
    c.save(); c.translate(0, -hop);
    if (kind === 0) { // macaco
      c.fillStyle = '#8d5524';
      c.beginPath(); c.arc(-16, -30, 7, 0, TAU); c.arc(16, -30, 7, 0, TAU); c.fill(); // orelhas
      c.beginPath(); c.arc(0, -42, 9, 0, TAU); c.fill(); // cabeça topo? corpo
      X.rr(c, -12, -40, 24, 30, 10); c.fill();
      c.beginPath(); c.arc(0, -30, 15, 0, TAU); c.fill();
      c.fillStyle = '#e6b98f';
      c.beginPath(); c.ellipse(0, -27, 10, 9, 0, 0, TAU); c.fill();
      c.strokeStyle = '#8d5524'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(10, -14); c.quadraticCurveTo(26, -18, 24, -32); c.stroke(); // cauda
    } else if (kind === 1) { // papagaio
      c.fillStyle = '#ef233c';
      c.beginPath(); c.ellipse(0, -24, 13, 18, 0, 0, TAU); c.fill();
      c.fillStyle = '#2a9d8f';
      c.beginPath(); c.ellipse(-7, -22, 6, 12, 0.4, 0, TAU); c.fill();
      c.fillStyle = '#ffb703';
      c.beginPath(); c.moveTo(9, -32); c.lineTo(22, -28); c.lineTo(9, -24); c.closePath(); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(4, -34, 4, 0, TAU); c.fill();
      c.fillStyle = '#2b2d42'; c.beginPath(); c.arc(5, -34, 2, 0, TAU); c.fill();
      c.strokeStyle = '#ffb703'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(-4, -6); c.lineTo(-4, 0); c.moveTo(4, -6); c.lineTo(4, 0); c.stroke();
    } else { // rã
      c.fillStyle = '#70e000';
      c.beginPath(); c.ellipse(0, -14, 16, 12, 0, 0, TAU); c.fill();
      c.beginPath(); c.arc(-8, -26, 6, 0, TAU); c.arc(8, -26, 6, 0, TAU); c.fill();
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(-8, -27, 3.5, 0, TAU); c.arc(8, -27, 3.5, 0, TAU); c.fill();
      c.fillStyle = '#2b2d42';
      c.beginPath(); c.arc(-8, -27, 1.6, 0, TAU); c.arc(8, -27, 1.6, 0, TAU); c.fill();
      c.strokeStyle = '#2b2d42'; c.lineWidth = 2; c.lineCap = 'round';
      c.beginPath(); c.arc(0, -14, 8, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    }
    c.restore();
  };

  /* Caixa-presente (base y=0). */
  X.gift = function (c, t) {
    const bounce = Math.abs(Math.sin(t * 2.5)) * 6;
    c.save(); c.translate(0, -bounce);
    X.rr(c, -24, -44, 48, 44, 8); c.fillStyle = '#ef476f'; c.fill();
    c.fillStyle = '#ffd166';
    X.rr(c, -6, -44, 12, 44, 3); c.fill();
    X.rr(c, -28, -50, 56, 12, 6); c.fill();
    c.strokeStyle = '#ffd166'; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.arc(-8, -54, 7, 0.3, Math.PI * 1.3); c.stroke();
    c.beginPath(); c.arc(8, -54, 7, Math.PI * 1.7, Math.PI * 0.8); c.stroke();
    c.restore();
    X.star(c, -30, -60 - bounce, 5, '#fff', t);
    X.star(c, 32, -50 - bounce, 4, '#fff', -t);
  };

  /* Tucano mecânico com chave inglesa (base y=0). */
  X.toucan = function (c, t) {
    c.fillStyle = '#2b2d42';
    c.beginPath(); c.ellipse(0, -30, 16, 22, 0, 0, TAU); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.ellipse(-3, -26, 9, 13, 0, 0, TAU); c.fill();
    // bico grande
    c.fillStyle = '#ff9f1c';
    c.beginPath(); c.moveTo(8, -46); c.quadraticCurveTo(38, -44, 34, -34); c.quadraticCurveTo(20, -30, 8, -36); c.closePath(); c.fill();
    c.fillStyle = '#ffbf69';
    c.beginPath(); c.moveTo(8, -36); c.quadraticCurveTo(20, -30, 32, -34); c.quadraticCurveTo(20, -28, 8, -32); c.closePath(); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(2, -46, 4.5, 0, TAU); c.fill();
    c.fillStyle = '#2b2d42'; c.beginPath(); c.arc(3, -46, 2.2, 0, TAU); c.fill();
    c.strokeStyle = '#ff9f1c'; c.lineWidth = 3.5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-5, -8); c.lineTo(-5, 0); c.moveTo(3, -8); c.lineTo(3, 0); c.stroke();
    // chave inglesa na asa
    c.save(); c.translate(-14, -30); c.rotate(Math.sin(t * 2) * 0.2 - 0.4);
    c.strokeStyle = '#6c757d'; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 0); c.lineTo(-16, -10); c.stroke();
    c.fillStyle = '#6c757d'; c.beginPath(); c.arc(-18, -11, 6, 0, TAU); c.fill();
    c.fillStyle = '#a8dadc'; c.beginPath(); c.arc(-18, -11, 3, 0, TAU); c.fill();
    c.restore();
  };

  /* Balão de fala. */
  X.bubble = function (c, x, y, text) {
    c.save(); c.translate(x, y);
    c.font = 'bold 17px "Comic Sans MS", sans-serif';
    const w = c.measureText(text).width + 24;
    X.rr(c, -w / 2, -36, w, 30, 14);
    c.fillStyle = 'rgba(255,255,255,.95)'; c.fill();
    c.strokeStyle = '#2b6cb0'; c.lineWidth = 2.5; c.stroke();
    c.beginPath(); c.moveTo(-6, -8); c.lineTo(0, 2); c.lineTo(6, -8); c.closePath();
    c.fillStyle = 'rgba(255,255,255,.95)'; c.fill();
    c.fillStyle = '#2b6cb0'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(text, 0, -21);
    c.restore();
  };

  /* Esqueleto fofo (base nos pés y=0, ~72 de altura). opts: {team:'blue'|'red', wave, walk, cheer} */
  X.skeleton = function (c, t, opts) {
    opts = opts || {};
    const scarf = opts.team === 'red' ? '#e63946' : '#1982c4';
    const walk = opts.walk || 0;
    const l1 = Math.sin(walk) * 7, l2 = -Math.sin(walk) * 7;
    const hop = opts.cheer ? Math.abs(Math.sin(t * 6)) * 8 : 0;
    c.save(); c.translate(0, -hop);
    c.strokeStyle = '#fff'; c.lineWidth = 7; c.lineCap = 'round';
    // pernas
    c.beginPath(); c.moveTo(-5, -22); c.lineTo(-5 + l1 * 0.5, -2); c.stroke();
    c.beginPath(); c.moveTo(5, -22); c.lineTo(5 + l2 * 0.5, -2); c.stroke();
    // caixa torácica
    X.rr(c, -12, -46, 24, 26, 10); c.fillStyle = '#fff'; c.fill();
    c.strokeStyle = 'rgba(90,100,120,.45)'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(-8, -38); c.lineTo(8, -38); c.moveTo(-8, -31); c.lineTo(8, -31); c.stroke();
    // braços
    c.strokeStyle = '#fff'; c.lineWidth = 6;
    if (opts.wave || opts.cheer) {
      c.save(); c.translate(10, -42); c.rotate(-1 + Math.sin(t * 7) * 0.45);
      c.beginPath(); c.moveTo(0, 0); c.lineTo(13, -8); c.stroke(); c.restore();
      c.beginPath(); c.moveTo(-10, -42); c.lineTo(-16, -30 + Math.sin(walk) * 3); c.stroke();
    } else {
      c.beginPath(); c.moveTo(-10, -42); c.lineTo(-15, -29); c.stroke();
      c.beginPath(); c.moveTo(10, -42); c.lineTo(15, -29); c.stroke();
    }
    // cachecol da equipa
    c.fillStyle = scarf;
    X.rr(c, -13, -52, 26, 8, 4); c.fill();
    c.save(); c.rotate(Math.sin(t * 3) * 0.15);
    X.rr(c, 8, -50, 7, 16, 3.5); c.fill();
    c.restore();
    // caveira sorridente
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(0, -64, 15, 0, TAU); c.fill();
    X.rr(c, -6, -54, 12, 6, 3); c.fill();
    c.fillStyle = '#2b2d42';
    if (opts.cheer) {
      c.strokeStyle = '#2b2d42'; c.lineWidth = 2.4;
      c.beginPath(); c.arc(-5.5, -66, 3.2, Math.PI, 0); c.stroke();
      c.beginPath(); c.arc(5.5, -66, 3.2, Math.PI, 0); c.stroke();
    } else {
      c.beginPath(); c.arc(-5.5, -66, 3.4, 0, TAU); c.arc(5.5, -66, 3.4, 0, TAU); c.fill();
    }
    c.strokeStyle = '#2b2d42'; c.lineWidth = 2.2; c.lineCap = 'round';
    c.beginPath(); c.arc(0, -60, 6, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
    c.fillStyle = 'rgba(255,120,120,.45)';
    c.beginPath(); c.arc(-10, -60, 2.6, 0, TAU); c.arc(10, -60, 2.6, 0, TAU); c.fill();
    c.restore();
  };

  /* Foguetão a apontar para cima (origem no centro, ~52 de altura), com chama animada. */
  X.rocket = function (c, t) {
    // chama
    const fl = 1 + Math.sin(t * 30) * 0.25;
    c.fillStyle = '#ff9f1c';
    c.beginPath(); c.moveTo(-6, 22); c.quadraticCurveTo(0, 22 + 18 * fl, 6, 22); c.closePath(); c.fill();
    c.fillStyle = '#ffd166';
    c.beginPath(); c.moveTo(-3, 22); c.quadraticCurveTo(0, 22 + 10 * fl, 3, 22); c.closePath(); c.fill();
    // abas
    c.fillStyle = '#1982c4';
    c.beginPath(); c.moveTo(-9, 8); c.lineTo(-18, 24); c.lineTo(-9, 22); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(9, 8); c.lineTo(18, 24); c.lineTo(9, 22); c.closePath(); c.fill();
    // corpo
    X.rr(c, -9, -16, 18, 38, 9); c.fillStyle = '#ff595e'; c.fill();
    X.rr(c, -9, -2, 18, 8, 4); c.fillStyle = '#fff'; c.fill();
    // nariz
    c.fillStyle = '#ffca3a';
    c.beginPath(); c.moveTo(-9, -14); c.quadraticCurveTo(0, -34, 9, -14); c.closePath(); c.fill();
    // janela
    c.beginPath(); c.arc(0, -6, 5.5, 0, TAU); c.fillStyle = '#8ecae6'; c.fill();
    c.lineWidth = 2.5; c.strokeStyle = '#fff'; c.stroke();
  };

  /* Nave de gelo dos zombies, virada p/ a direita (origem no centro, ~100 de largura).
     Um zombie sonolento espreita lá de cima com a sua pistolinha. opts: {melt 0..1} */
  X.iceShip = function (c, t, opts) {
    opts = opts || {};
    const melt = opts.melt || 0;
    c.save();
    c.globalAlpha = 1 - melt * 0.8;
    c.scale(1 + melt * 0.2, 1 - melt * 0.55);
    // asas
    c.fillStyle = 'rgba(80,150,220,.9)';
    X.rr(c, -52, 2, 26, 12, 6); c.fill();
    X.rr(c, 26, 2, 26, 12, 6); c.fill();
    // cubo de gelo (a nave)
    X.rr(c, -30, -22, 60, 46, 12);
    c.fillStyle = 'rgba(120,190,255,.85)'; c.fill();
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 3; c.stroke();
    X.rr(c, -22, -16, 18, 12, 5); c.fillStyle = 'rgba(255,255,255,.45)'; c.fill();
    // hélice no nariz
    c.fillStyle = '#ffca3a';
    c.beginPath(); c.arc(36, 0, 4.5, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(90,69,0,.5)'; c.lineWidth = 3.5; c.lineCap = 'round';
    const a = Math.abs(Math.sin(t * 24)) * 16;
    c.beginPath(); c.moveTo(36, -a); c.lineTo(36, a); c.stroke();
    // zombie piloto a espreitar com a pistolinha
    c.fillStyle = 'rgba(120,190,255,.95)';
    c.beginPath(); c.arc(-2, -32, 12, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2;
    c.beginPath(); c.arc(-2, -32, 12, 0, TAU); c.stroke();
    c.strokeStyle = '#2b2d42'; c.lineWidth = 2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-8, -34); c.quadraticCurveTo(-5, -31, -2, -34); c.stroke();
    c.beginPath(); c.moveTo(2, -34); c.quadraticCurveTo(5, -31, 8, -34); c.stroke();
    c.fillStyle = '#2b2d42';
    c.beginPath(); c.ellipse(0, -26, 2.5, 3.5, 0, 0, TAU); c.fill();
    // bracinho com a pistola
    c.strokeStyle = 'rgba(120,190,255,.95)'; c.lineWidth = 6;
    c.beginPath(); c.moveTo(6, -28); c.lineTo(18, -30); c.stroke();
    c.fillStyle = '#6c757d';
    X.rr(c, 16, -35, 15, 8, 3); c.fill();
    c.fillStyle = '#b5179e';
    c.beginPath(); c.arc(32, -31, 3.5, 0, TAU); c.fill();
    c.restore();
  };

  /* Mota fofa virada p/ a direita (base no chão y=0). opts: {riding} */
  X.bike = function (c, t, opts) {
    opts = opts || {};
    if (opts.kind === 'corrida') { X.bikeCorrida(c, t, opts); return; }
    const spin = opts.riding ? t * 14 : 0.6;
    [[-32], [36]].forEach(function (o) {
      c.fillStyle = '#2b2d42';
      c.beginPath(); c.arc(o[0], -16, 16, 0, TAU); c.fill();
      c.fillStyle = '#9a8c98';
      c.beginPath(); c.arc(o[0], -16, 7, 0, TAU); c.fill();
      c.strokeStyle = '#4a4e69'; c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(o[0] + Math.cos(spin) * 12, -16 + Math.sin(spin) * 12);
      c.lineTo(o[0] - Math.cos(spin) * 12, -16 - Math.sin(spin) * 12);
      c.stroke();
    });
    c.fillStyle = '#fb8500';
    X.rr(c, -34, -42, 64, 18, 9); c.fill();
    c.fillStyle = '#ffb703';
    X.rr(c, -10, -34, 30, 12, 6); c.fill();
    c.fillStyle = '#2b2d42';
    X.rr(c, -36, -51, 26, 9, 4); c.fill();
    c.strokeStyle = '#4a4e69'; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(26, -40); c.lineTo(38, -58); c.stroke();
    c.fillStyle = '#e63946';
    c.beginPath(); c.arc(39, -59, 4.5, 0, TAU); c.fill();
    c.fillStyle = '#ffd166';
    c.beginPath(); c.arc(46, -40, 6, 0, TAU); c.fill();
    if (!opts.riding) {
      c.strokeStyle = '#4a4e69'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(-26, -20); c.lineTo(-20, 0); c.stroke();
    }
  };

  /* Balão com número (origem no centro do balão). */
  /* Mota de corrida: mais baixinha, carenagem, escape e número. */
  X.bikeCorrida = function (c, t, opts) {
    opts = opts || {};
    const spin = opts.riding ? t * 18 : 0.6;
    [[-34], [38]].forEach(function (o) {
      c.fillStyle = '#1d1f2b';
      c.beginPath(); c.arc(o[0], -15, 15, 0, TAU); c.fill();
      c.fillStyle = '#c9d1d9';
      c.beginPath(); c.arc(o[0], -15, 6, 0, TAU); c.fill();
      c.strokeStyle = '#8d99ae'; c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(o[0] + Math.cos(spin) * 11, -15 + Math.sin(spin) * 11);
      c.lineTo(o[0] - Math.cos(spin) * 11, -15 - Math.sin(spin) * 11);
      c.stroke();
    });
    // carenagem baixa e comprida
    c.fillStyle = '#e63946';
    c.beginPath();
    c.moveTo(-38, -30); c.quadraticCurveTo(-10, -44, 30, -40);
    c.quadraticCurveTo(52, -38, 52, -26); c.lineTo(-30, -22);
    c.closePath(); c.fill();
    c.fillStyle = '#ffd166';
    c.beginPath(); c.moveTo(-30, -34); c.lineTo(18, -38); c.lineTo(18, -32); c.lineTo(-30, -28); c.closePath(); c.fill();
    c.fillStyle = '#1d1f2b';                                  // selim
    X.rr(c, -40, -44, 26, 9, 4); c.fill();
    c.fillStyle = '#8d99ae';                                  // escape
    X.rr(c, -52, -26, 22, 8, 4); c.fill();
    c.strokeStyle = '#4a4e69'; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(34, -40); c.lineTo(44, -52); c.stroke();
    c.fillStyle = '#fff';                                     // farol
    c.beginPath(); c.ellipse(50, -33, 7, 5, 0, 0, TAU); c.fill();
    c.fillStyle = '#fff';                                     // número 7
    c.beginPath(); c.arc(4, -33, 7, 0, TAU); c.fill();
    X.label(c, '7', 4, -32, 12, '#e63946', 'center');
    if (!opts.riding) {
      c.strokeStyle = '#4a4e69'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(-28, -20); c.lineTo(-22, 0); c.stroke();
    }
  };

  X.balloon = function (c, n, t) {
    const cols = { 1: '#8ac926', 2: '#ffca3a', 3: '#ff924c' };
    const col = cols[n] || '#b5179e';
    c.save(); c.rotate(Math.sin(t * 1.8) * 0.08);
    // fio
    c.strokeStyle = 'rgba(90,100,120,.6)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, 26); c.quadraticCurveTo(6, 40, 0, 54); c.stroke();
    // balão
    c.beginPath(); c.ellipse(0, 0, 24, 28, 0, 0, TAU);
    c.fillStyle = col; c.fill();
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 3; c.stroke();
    c.beginPath(); c.ellipse(-8, -9, 6, 9, 0.4, 0, TAU);
    c.fillStyle = 'rgba(255,255,255,.5)'; c.fill();
    c.beginPath(); c.moveTo(-5, 27); c.lineTo(5, 27); c.lineTo(0, 33); c.closePath();
    c.fillStyle = col; c.fill();
    // número grande
    c.font = 'bold 28px "Comic Sans MS", sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 5; c.strokeStyle = 'rgba(0,0,0,.25)'; c.strokeText('' + n, 0, 2);
    c.fillStyle = '#fff'; c.fillText('' + n, 0, 2);
    c.restore();
  };

  /* Texto de HUD com contorno. */
  /* contorno: cor do rebordo. Por omissão é branco (texto escuro sobre o céu). Em botões
     coloridos com letras brancas tem de se passar um rebordo ESCURO, senão o branco do
     rebordo come o branco das letras e não se lê nada. 'none' desenha sem rebordo. */
  X.label = function (c, text, x, y, size, color, align, contorno) {
    c.save();
    c.font = 'bold ' + size + 'px "Comic Sans MS", sans-serif';
    c.textAlign = align || 'left'; c.textBaseline = 'middle';
    const rebordo = contorno === undefined ? 'rgba(255,255,255,.9)' : contorno;
    if (rebordo && rebordo !== 'none') {
      c.lineWidth = size * (rebordo === 'rgba(255,255,255,.9)' ? 0.22 : 0.16);
      c.strokeStyle = rebordo; c.lineJoin = 'round';
      c.strokeText(text, x, y);
    }
    c.fillStyle = color || '#2b6cb0'; c.fillText(text, x, y);
    c.restore();
  };

  G.gfx = X;
})();
