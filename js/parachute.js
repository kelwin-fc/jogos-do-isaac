/* Transição — ejeção e descida de paraquedas a apanhar estrelas. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};
  let phase, pt, progress, px, stars, clouds, sparks;

  function rnd(a, b) { return a + Math.random() * (b - a); }

  S.enter = function () {
    phase = 'eject'; pt = 0; progress = 0; px = 0;
    stars = []; sparks = [];
    clouds = [];
    for (let i = 0; i < 7; i++) clouds.push({ x: rnd(0, 1), y: rnd(0, 1), s: rnd(26, 60) });
    G.audio.sfx('whee');
  };

  S.update = function (dt, t) {
    const W = G.W, H = G.H;
    if (phase === 'eject') {
      pt += dt;
      if (Math.random() < 0.5) sparks.push({ x: W / 2 + rnd(-20, 20), y: H * 0.75 - pt * H * 0.5 + 60, t: 0 });
      if (pt > 1.1) { phase = 'fall'; pt = 0; G.banner('Apanha as estrelas! ⭐', 2400); }
    } else if (phase === 'fall') {
      pt += dt;
      progress = Math.min(1, progress + dt / 9);
      px = Math.max(-W * 0.4, Math.min(W * 0.4, px + G.input.axis().x * 320 * dt));
      if (Math.random() < dt * 2.2) stars.push({ x: rnd(W * 0.08, W * 0.92), y: H + 40, r: rnd(14, 20), rot: rnd(0, TAU) });
      const hx = W / 2 + px, hy = H * 0.34 + 58;
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.y -= (170 + progress * 90) * dt; s.rot += dt * 3;
        if (Math.hypot(s.x - hx, s.y - hy) < 78) {
          stars.splice(i, 1); G.addStars(1); G.audio.sfx('star');
          sparks.push({ x: s.x, y: s.y, t: 0 });
        } else if (s.y < -40) stars.splice(i, 1);
      }
      for (const cl of clouds) { cl.y -= dt * 0.16; if (cl.y < -0.15) { cl.y = 1.15; cl.x = Math.random(); } }
      if (progress >= 1) { phase = 'land'; pt = 0; G.audio.sfx('boing'); G.banner('Boing! 🌴', 1600); }
    } else { // land
      pt += dt;
      if (pt > 1.1) G.setScene('jungle');
    }
    for (let i = sparks.length - 1; i >= 0; i--) { sparks[i].t += dt; if (sparks[i].t > 0.5) sparks.splice(i, 1); }
  };

  S.draw = function (c, t) {
    const W = G.W, H = G.H;
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#5bb8ff'); g.addColorStop(1, '#bfe7ff');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    G.gfx.sun(c, W * 0.85, H * 0.12, Math.min(W, H) * 0.06, t);
    for (const cl of clouds) G.gfx.cloud(c, cl.x * W, cl.y * H, cl.s, 0.85);

    // copas da selva a aproximarem-se no fim
    const near = phase === 'land' ? 1 : Math.max(0, (progress - 0.55) / 0.45);
    if (near > 0) {
      const gy = H - near * H * 0.3;
      c.fillStyle = '#2d9d4f';
      for (let i = -1; i < W / 90 + 1; i++) {
        c.beginPath(); c.arc(i * 90 + 45, gy + 60, 70, 0, TAU); c.fill();
      }
      c.fillStyle = '#38b000';
      for (let i = -1; i < W / 70 + 1; i++) {
        c.beginPath(); c.arc(i * 70 + 20, gy + 105, 60, 0, TAU); c.fill();
      }
    }

    for (const s of stars) G.gfx.star(c, s.x, s.y, s.r, '#ffd166', s.rot);
    for (const sp of sparks) G.gfx.star(c, sp.x, sp.y, 16 * (1 - sp.t * 2) + 4, 'rgba(255,255,255,.9)', sp.t * 8);

    if (phase === 'eject') {
      const y = H * 0.85 - (1 - Math.pow(1 - Math.min(1, pt / 1.1), 2)) * H * 0.55;
      c.save(); c.translate(W / 2, y);
      c.save(); c.scale(1.1, 1.1); c.translate(0, -58);
      G.gfx.hero(c, t, { suit: G.state.suit, wave: true });
      c.restore(); c.restore();
      G.gfx.bubble(c, W / 2 + 70, y - 90, 'Uiii!');
    } else if (phase === 'fall') {
      c.save(); c.translate(W / 2 + px, H * 0.34); c.scale(1.25, 1.25);
      G.gfx.parachute(c, t, { suit: G.state.suit });
      c.restore();
    } else { // aterragem fofa
      c.fillStyle = '#38b000'; c.fillRect(0, H * 0.78, W, H);
      const sq = Math.max(0, Math.sin(Math.min(1, pt) * Math.PI));
      c.save(); c.translate(W / 2, H * 0.78 + 4);
      c.scale(1 + sq * 0.25, 1 - sq * 0.3);
      G.gfx.hero(c, t, { suit: G.state.suit });
      c.restore();
      G.gfx.cloud(c, W / 2 - 60, H * 0.78, 18 * (1 - Math.min(1, pt)) + 4, 0.7);
      G.gfx.cloud(c, W / 2 + 60, H * 0.78, 16 * (1 - Math.min(1, pt)) + 4, 0.7);
    }
  };

  G.scenes = G.scenes || {};
  G.scenes.parachute = S;
})();
