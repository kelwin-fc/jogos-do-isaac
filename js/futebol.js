/* Mini-jogo 3 — Futebol: penáltis fofos contra o urso guarda-redes.
   Segura no ecrã para carregar a força (a barra sobe e desce), larga para rematar.
   Pouca força: a bola fica a meio e o urso vai buscá-la a rir.
   Muita força no canto: GOLO! O urso às vezes defende — e festeja sempre, golo ou defesa. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};
  const FRIEND = ['#ff595e', '#1982c4', '#8ac926', '#ffca3a', '#ff924c'];

  let phase, pt;            // 'aim' | 'charge' | 'fly' | 'goal' | 'save' | 'short' | 'return'
  let power, chargePh, aimX, kbAim, kbPh, tickAcc;
  let ball, keeper, parts, crowd;
  let golos, shortsSeq, hype, bulgeAmt, kickT, superShot, willGoal, prevDrag, rainbowI;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, k) { return a + (b - a) * k; }

  // geometria responsiva
  function goalCX() { return G.W / 2; }
  function goalW() { return Math.min(G.W * 0.64, 560); }
  function goalH() { return Math.min(G.H * 0.26, goalW() * 0.4); }
  function goalY() { return G.H * 0.46; }
  function spotY() { return G.H * 0.80; }
  function ballR() { return Math.max(20, Math.min(G.W, G.H) * 0.045); }
  function keeperScale() {
    const base = goalH() * 0.82 / 118;
    const grow = 1 + 0.35 * clamp((keeper.y - goalY()) / ((spotY() - goalY()) || 1), 0, 1);
    return base * grow;
  }
  function holdBallPos() { return { x: keeper.x, y: keeper.y - 52 * keeperScale() }; }

  S.enter = function () {
    phase = 'aim'; pt = 0; power = 0; chargePh = 0; aimX = goalCX();
    kbAim = false; kbPh = 0; tickAcc = 0; rainbowI = 0;
    golos = G.state.golos || 0;
    shortsSeq = 0; hype = 0; bulgeAmt = 0; kickT = 0; superShot = false; willGoal = false;
    prevDrag = G.input.drag.on;
    ball = { x: goalCX(), y: spotY(), s: 1, rot: 0, fly: null };
    keeper = { mode: 'idle', x: goalCX(), y: goalY(), rot: 0, k: 0, dir: 1, tx: 0, retX: 0, retY: 0 };
    parts = [];
    crowd = [];
    for (let i = 0; i < 120; i++) crowd.push({ col: FRIEND[(Math.random() * FRIEND.length) | 0], ph: rnd(0, TAU) });
    G.audio.sfx('whistle');
    G.banner('Segura ⚽ e larga para rematar!', 3200);
  };

  function burst(x, y, n, cols) {
    for (let i = 0; i < n; i++) {
      parts.push({ x: x, y: y, vx: rnd(-180, 180), vy: rnd(-260, -20), rot: rnd(0, TAU), vr: rnd(-7, 7), t: 0, life: rnd(0.5, 1.2), col: cols[(Math.random() * cols.length) | 0] });
    }
  }

  function kick(pw) {
    const gw2 = goalW() / 2 * 0.86;
    const tx = clamp(aimX, goalCX() - gw2, goalCX() + gw2);
    const ty = goalY() - goalH() * 0.40;
    kickT = 0.3;
    superShot = pw > 0.93;
    G.audio.sfx('kick');
    if (pw < 0.30) {
      // rolinho curto: a bola nem chega à baliza
      const f = 0.28 + pw * 1.1;
      ball.fly = { x0: ball.x, y0: ball.y, tx: lerp(ball.x, tx, f * 0.6), ty: lerp(spotY(), goalY() + goalH() * 0.1, f), t: 0, dur: 0.9, arc: 0, roll: true };
      phase = 'fly'; willGoal = false;
      return;
    }
    const off = clamp((tx - goalCX()) / gw2, -1, 1);
    let p = 0.22 + 0.40 * Math.abs(off) + 0.35 * pw;
    if (superShot) p = 1;
    willGoal = Math.random() < clamp(p, 0.15, 0.95);
    if (willGoal) {
      const d = Math.abs(off) < 0.18 ? (Math.random() < 0.5 ? -1 : 1) : -Math.sign(off);
      keeper.tx = goalCX() + d * gw2 * 0.55;
    } else {
      keeper.tx = tx;
    }
    keeper.dir = Math.sign(keeper.tx - goalCX()) || (Math.random() < 0.5 ? -1 : 1);
    keeper.mode = 'dive'; keeper.k = 0;
    ball.fly = { x0: ball.x, y0: ball.y, tx: tx, ty: ty, t: 0, dur: lerp(0.95, 0.45, pw), arc: G.H * lerp(0.10, 0.03, pw), roll: false };
    phase = 'fly';
  }

  function resetBall() {
    ball.x = goalCX(); ball.y = spotY(); ball.s = 1; ball.rot = 0; ball.fly = null;
  }

  function startReturn() {
    const gp = keeper.mode === 'hold' ? holdBallPos() : { x: ball.x, y: ball.y };
    ball.fly = { x0: gp.x, y0: gp.y, tx: goalCX(), ty: spotY(), t: 0, dur: 0.8, s0: ball.s };
    keeper.retX = keeper.x; keeper.retY = keeper.y;
    keeper.mode = 'idle';
    phase = 'return'; pt = 0;
    G.audio.sfx('whoosh');
  }

  S.update = function (dt, t) {
    pt += dt;
    hype = Math.max(0, hype - dt);
    kickT = Math.max(0, kickT - dt);
    bulgeAmt = Math.max(0, bulgeAmt - dt * 14);
    const drag = G.input.drag;
    const dragStart = drag.on && !prevDrag;
    prevDrag = drag.on;

    if (phase === 'aim') {
      keeper.mode = 'idle';
      keeper.x = goalCX() + Math.sin(t * 1.6) * goalW() * 0.05;
      keeper.y = goalY(); keeper.rot = 0;
      if (dragStart || G.input.justPressed('fire')) {
        phase = 'charge'; chargePh = 0; power = 0; tickAcc = 0;
        kbAim = !dragStart; kbPh = 0;
        aimX = dragStart ? drag.sx : goalCX();
      }
    } else if (phase === 'charge') {
      chargePh += dt * 1.15;
      const k = chargePh % 2;
      power = k < 1 ? k : 2 - k;
      tickAcc += dt;
      if (tickAcc > 0.1) { tickAcc = 0; G.audio.tick(power); }
      if (kbAim) { kbPh += dt * 2.1; aimX = goalCX() + Math.sin(kbPh) * goalW() * 0.43; }
      else aimX = drag.sx + drag.dx;
      keeper.x = goalCX() + Math.sin(t * 5) * goalW() * 0.03; // urso nervosinho
      const done = kbAim ? !G.input.isHeld('fire') : !drag.on;
      if (done) kick(power);
    } else if (phase === 'fly') {
      const f = ball.fly;
      f.t += dt / f.dur;
      const kRaw = Math.min(1, f.t);
      const k = f.roll ? 1 - (1 - kRaw) * (1 - kRaw) : kRaw;
      ball.x = lerp(f.x0, f.tx, k);
      ball.y = lerp(f.y0, f.ty, k) - (f.arc ? Math.sin(Math.PI * kRaw) * f.arc : 0);
      ball.s = lerp(1, f.roll ? 0.72 : 0.52, k);
      ball.rot += dt * (f.roll ? 6 : 14 + power * 10);
      if (superShot && !f.roll && Math.random() < 0.9) {
        parts.push({ x: ball.x + rnd(-4, 4), y: ball.y + rnd(-4, 4), vx: rnd(-30, 30), vy: rnd(20, 70), rot: rnd(0, TAU), vr: rnd(-6, 6), t: 0, life: 0.5, col: FRIEND[rainbowI++ % FRIEND.length] });
      }
      if (!f.roll && keeper.mode === 'dive') {
        keeper.k = clamp((f.t - 0.35) / 0.5, 0, 1);
        const kk = keeper.k;
        keeper.x = lerp(goalCX(), keeper.tx, kk);
        keeper.y = goalY() - Math.sin(kk * Math.PI) * goalH() * 0.22;
        keeper.rot = keeper.dir * kk * 1.15;
      }
      if (f.t >= 1) {
        if (f.roll) {
          phase = 'short'; pt = 0; shortsSeq++;
          keeper.mode = 'walk'; keeper.k = 0;
          G.audio.sfx('giggle');
          G.banner(shortsSeq >= 2 ? 'Segura mais tempo! ⏳💪' : 'Mais força! 💪', 2000);
        } else if (willGoal) {
          phase = 'goal'; pt = 0; shortsSeq = 0;
          bulgeAmt = 16;
          golos++; G.state.golos = golos;
          G.addStars(superShot ? 3 : 2);
          keeper.mode = 'cheer'; keeper.rot = 0; keeper.y = goalY();
          hype = 2.4;
          G.audio.sfx('tada'); if (superShot) G.audio.sfx('whee');
          G.banner(superShot ? 'SUPER GOLO! 🌈⚽' : 'GOLO! 🎉⚽', 2400);
          burst(ball.x, ball.y, 26, FRIEND);
          burst(goalCX() - goalW() * 0.3, G.H * 0.2, 14, FRIEND);
          burst(goalCX() + goalW() * 0.3, G.H * 0.2, 14, FRIEND);
          if (golos % 5 === 0) { G.banner(golos + ' golos! És um craque! ⭐', 2800); burst(G.W / 2, G.H * 0.3, 60, FRIEND); }
        } else {
          phase = 'save'; pt = 0; shortsSeq = 0;
          keeper.mode = 'hold'; keeper.rot = 0; keeper.x = keeper.tx; keeper.y = goalY();
          ball.s = 0.55;
          hype = 1.2;
          G.audio.sfx('boing'); G.audio.sfx('giggle');
          G.banner('Grande defesa! 🧤', 2000);
          burst(keeper.tx, goalY() - goalH() * 0.4, 6, ['#fff', '#8ecae6']);
        }
      }
    } else if (phase === 'short') {
      if (keeper.mode === 'walk') {
        keeper.k = Math.min(1, keeper.k + dt / 0.75);
        keeper.x = lerp(goalCX(), ball.x, keeper.k);
        keeper.y = lerp(goalY(), ball.y + ballR() * 0.4, keeper.k);
        if (keeper.k >= 1) { keeper.mode = 'hold'; pt = 0; G.audio.sfx('hop'); }
      } else {
        const gp = holdBallPos();
        ball.x = gp.x; ball.y = gp.y;
        if (pt > 0.7) startReturn();
      }
    } else if (phase === 'save') {
      const gp = holdBallPos();
      ball.x = gp.x; ball.y = gp.y;
      if (pt > 1.3) startReturn();
    } else if (phase === 'goal') {
      if (pt > 2.3) { resetBall(); phase = 'aim'; G.audio.sfx('pop'); }
    } else if (phase === 'return') {
      const f = ball.fly;
      f.t += dt / f.dur;
      const k = Math.min(1, f.t), u = 1 - k;
      const mx = (f.x0 + f.tx) / 2, my = Math.min(f.y0, f.ty) - G.H * 0.22;
      ball.x = u * u * f.x0 + 2 * u * k * mx + k * k * f.tx;
      ball.y = u * u * f.y0 + 2 * u * k * my + k * k * f.ty;
      ball.s = lerp(f.s0, 1, k);
      ball.rot += dt * 8;
      keeper.x = lerp(keeper.retX, goalCX(), k);
      keeper.y = lerp(keeper.retY, goalY(), k);
      if (f.t >= 1) { resetBall(); phase = 'aim'; }
    }

    // confetes
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 320 * dt; p.rot += p.vr * dt;
      if (p.t > p.life) parts.splice(i, 1);
    }
  };

  S.draw = function (c, t) {
    const W = G.W, H = G.H, cx = goalCX(), gw = goalW(), gh = goalH(), gy = goalY();
    // céu
    const g = c.createLinearGradient(0, 0, 0, H * 0.32);
    g.addColorStop(0, '#7ec8ff'); g.addColorStop(1, '#bfe7ff');
    c.fillStyle = g; c.fillRect(0, 0, W, H * 0.32);
    G.gfx.sun(c, W * 0.86, H * 0.055, Math.min(W, H) * 0.035, t);
    drawCrowd(c, t);

    // relvado às riscas
    const hor = H * 0.30;
    c.fillStyle = '#6ab547'; c.fillRect(0, hor, W, H - hor);
    c.fillStyle = 'rgba(255,255,255,.09)';
    for (let i = 0; i < 8; i += 2) c.fillRect(0, hor + (H - hor) * i / 8, W, (H - hor) / 8);

    // área de penálti e marca
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 4; c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(cx - gw * 0.72, gy + 6);
    c.lineTo(cx - gw * 0.95, gy + H * 0.20);
    c.lineTo(cx + gw * 0.95, gy + H * 0.20);
    c.lineTo(cx + gw * 0.72, gy + 6);
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,.7)';
    c.beginPath(); c.ellipse(cx, spotY() + ballR() * 0.75, ballR() * 0.55, ballR() * 0.2, 0, 0, TAU); c.fill();

    // baliza: no golo a bola fica atrás da rede (rede faz barriga)
    if (phase === 'goal') {
      drawBallSprite(c, t);
      drawNet(c, { x: ball.x, y: ball.y, amt: 6 + bulgeAmt });
    } else {
      drawNet(c, null);
    }
    drawKeeper(c, t);
    drawPosts(c);
    if (phase !== 'goal') drawBallSprite(c, t);
    drawHero(c, t);
    if (phase === 'charge') drawAim(c, t);

    // confetes
    for (const p of parts) {
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
      c.globalAlpha = Math.max(0, 1 - p.t / p.life);
      c.fillStyle = p.col; c.fillRect(-5, -3, 10, 6);
      c.restore();
    }

    // HUD: estrelas + golos
    G.gfx.star(c, 36, 46, 16, '#ffd166', 0);
    G.gfx.label(c, '' + G.state.stars, 62, 47, 30, '#b56b00');
    ballIcon(c, 38, 98, 14, 0.5);
    G.gfx.label(c, '' + golos, 62, 99, 30, '#1d7a33');
  };

  function drawCrowd(c, t) {
    const W = G.W, H = G.H;
    c.fillStyle = '#b8c0ff';
    c.fillRect(0, H * 0.075, W, H * 0.30 - H * 0.075);
    const y0 = H * 0.115, rh = H * 0.062;
    const sp = Math.max(26, W * 0.036);
    const rowCols = ['#a3a8f0', '#949bee', '#8891ec'];
    let idx = 0;
    for (let r = 0; r < 3; r++) {
      const yy = y0 + r * rh;
      for (let x = -sp / 2 + (r % 2) * sp / 2; x < W + sp; x += sp) {
        const cr = crowd[idx++ % crowd.length];
        const bob = Math.sin(t * 3 + cr.ph) * 2 - (hype > 0 ? Math.abs(Math.sin(t * 8 + cr.ph)) * 7 : 0);
        c.fillStyle = cr.col;
        c.beginPath(); c.arc(x, yy + bob, sp * 0.30, 0, TAU); c.fill();
      }
      c.fillStyle = rowCols[r];
      c.fillRect(0, yy + rh * 0.35, W, rh * 0.75);
    }
  }

  function drawNet(c, bulge) {
    const cx = goalCX(), gw = goalW(), gh = goalH(), gy = goalY();
    const x0 = cx - gw / 2, x1 = cx + gw / 2, y0 = gy - gh;
    function push(px, py) {
      if (!bulge) return { x: px, y: py };
      const dx = px - bulge.x, dy = py - bulge.y;
      const d = Math.hypot(dx, dy) || 1;
      const f = Math.max(0, 1 - d / (gh * 0.55));
      return { x: px + (dx / d) * f * bulge.amt, y: py + (dy / d) * f * bulge.amt };
    }
    c.save();
    c.fillStyle = 'rgba(255,255,255,.10)';
    c.fillRect(x0, y0, gw, gh);
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.6;
    const step = 8;
    for (let x = x0; x <= x1 + 1; x += gw / 14) {
      c.beginPath();
      for (let y = y0; y <= gy + 1; y += step) { const p = push(x, y); y === y0 ? c.moveTo(p.x, p.y) : c.lineTo(p.x, p.y); }
      c.stroke();
    }
    for (let y = y0; y <= gy + 1; y += gh / 8) {
      c.beginPath();
      for (let x = x0; x <= x1 + 1; x += step) { const p = push(x, y); x === x0 ? c.moveTo(p.x, p.y) : c.lineTo(p.x, p.y); }
      c.stroke();
    }
    c.restore();
  }

  function drawPosts(c) {
    const cx = goalCX(), gw = goalW(), gh = goalH(), gy = goalY();
    const x0 = cx - gw / 2, x1 = cx + gw / 2, y0 = gy - gh;
    c.strokeStyle = '#fff'; c.lineCap = 'round';
    c.lineWidth = Math.max(7, gw * 0.02);
    c.beginPath();
    c.moveTo(x0, gy); c.lineTo(x0, y0); c.lineTo(x1, y0); c.lineTo(x1, gy);
    c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.08)'; c.lineWidth = Math.max(3, gw * 0.008);
    c.beginPath();
    c.moveTo(x0 + 4, gy); c.lineTo(x0 + 4, y0 + 4); c.lineTo(x1 + 4, y0 + 4);
    c.stroke();
  }

  function pent(c, x, y, r, a) {
    c.beginPath();
    for (let i = 0; i < 5; i++) {
      const b = a + (i * TAU) / 5;
      const px = x + Math.cos(b) * r, py = y + Math.sin(b) * r;
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.closePath(); c.fill();
  }

  function ballIcon(c, x, y, r, rot) {
    c.save(); c.translate(x, y);
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fillStyle = '#fff'; c.fill();
    c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = Math.max(1.5, r * 0.07); c.stroke();
    c.save();
    c.beginPath(); c.arc(0, 0, r * 0.97, 0, TAU); c.clip();
    c.fillStyle = '#2b2d42';
    for (let i = 0; i < 5; i++) {
      const a = rot + (i * TAU) / 5;
      pent(c, Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8, r * 0.28, a);
    }
    pent(c, 0, 0, r * 0.3, rot);
    c.restore();
    c.fillStyle = 'rgba(255,255,255,.6)';
    c.beginPath(); c.arc(-r * 0.35, -r * 0.42, r * 0.2, 0, TAU); c.fill();
    c.restore();
  }

  function drawBallSprite(c, t) {
    let bx = ball.x;
    const r = ballR() * ball.s;
    if (phase === 'charge') bx += Math.sin(t * 40) * power * 2;
    if (phase === 'aim' || phase === 'charge' || (phase === 'fly' && ball.fly && ball.fly.roll)) {
      c.fillStyle = 'rgba(0,0,0,.15)';
      c.beginPath(); c.ellipse(bx, ball.y + r * 0.95, r * 1.05, r * 0.3, 0, 0, TAU); c.fill();
    }
    ballIcon(c, bx, ball.y, r, ball.rot);
  }

  function drawKeeper(c, t) {
    const s = keeperScale();
    c.save(); c.translate(keeper.x, keeper.y); c.rotate(keeper.rot || 0); c.scale(s, s);
    const m = keeper.mode;
    const hop = m === 'cheer' ? Math.abs(Math.sin(t * 7)) * 12 : (m === 'idle' ? Math.abs(Math.sin(t * 3.2)) * 3 : 0);
    c.translate(0, -hop);
    if (m === 'walk') c.rotate(0.25);
    // pernas e patas
    c.strokeStyle = '#7f5539'; c.lineWidth = 11; c.lineCap = 'round';
    const spread = m === 'dive' || m === 'walk' ? 16 : 12;
    c.beginPath(); c.moveTo(-8, -30); c.lineTo(-spread, -2); c.stroke();
    c.beginPath(); c.moveTo(8, -30); c.lineTo(spread, -2); c.stroke();
    c.fillStyle = '#5e3d20';
    c.beginPath(); c.arc(-spread, -2, 7, 0, TAU); c.arc(spread, -2, 7, 0, TAU); c.fill();
    // camisola amarela com estrela
    G.gfx.rr(c, -26, -78, 52, 52, 20); c.fillStyle = '#ffca3a'; c.fill();
    c.fillStyle = 'rgba(255,255,255,.4)'; G.gfx.rr(c, -26, -78, 52, 14, 12); c.fill();
    G.gfx.star(c, 0, -52, 9, '#fff', 0);
    // braços e luvas grandes
    let ga, gb;
    const d = keeper.dir >= 0 ? 1 : -1;
    if (m === 'dive') { ga = { x: d * 46, y: -98 }; gb = { x: d * 54, y: -76 }; }
    else if (m === 'hold') { ga = { x: -16, y: -50 }; gb = { x: 16, y: -50 }; }
    else if (m === 'cheer') { ga = { x: -34, y: -104 + Math.sin(t * 9) * 5 }; gb = { x: 34, y: -104 + Math.cos(t * 9) * 5 }; }
    else if (m === 'walk') { ga = { x: -30, y: -46 }; gb = { x: 34, y: -50 }; }
    else { ga = { x: -38, y: -78 + Math.sin(t * 3) * 5 }; gb = { x: 38, y: -78 + Math.cos(t * 3) * 5 }; }
    c.strokeStyle = '#ffca3a'; c.lineWidth = 10;
    c.beginPath(); c.moveTo(-20, -70); c.lineTo(ga.x, ga.y); c.stroke();
    c.beginPath(); c.moveTo(20, -70); c.lineTo(gb.x, gb.y); c.stroke();
    c.fillStyle = '#ff924c'; c.strokeStyle = '#fff'; c.lineWidth = 3;
    c.beginPath(); c.arc(ga.x, ga.y, 12, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.arc(gb.x, gb.y, 12, 0, TAU); c.fill(); c.stroke();
    // cabeça de urso
    c.fillStyle = '#8d5524';
    c.beginPath(); c.arc(-14, -106, 8, 0, TAU); c.arc(14, -106, 8, 0, TAU); c.fill();
    c.fillStyle = '#e6b98f';
    c.beginPath(); c.arc(-14, -106, 4, 0, TAU); c.arc(14, -106, 4, 0, TAU); c.fill();
    c.fillStyle = '#8d5524';
    c.beginPath(); c.arc(0, -94, 19, 0, TAU); c.fill();
    c.fillStyle = '#e6b98f';
    c.beginPath(); c.ellipse(0, -88, 10, 8, 0, 0, TAU); c.fill();
    c.fillStyle = '#2b2d42';
    c.beginPath(); c.arc(0, -92, 3, 0, TAU); c.fill();
    if (m === 'hold' || m === 'cheer') {
      c.strokeStyle = '#2b2d42'; c.lineWidth = 2.4; c.lineCap = 'round';
      c.beginPath(); c.arc(-7, -98, 3.4, Math.PI, 0); c.stroke();
      c.beginPath(); c.arc(7, -98, 3.4, Math.PI, 0); c.stroke();
    } else {
      c.fillStyle = '#2b2d42';
      c.beginPath(); c.arc(-7, -98, 2.6, 0, TAU); c.arc(7, -98, 2.6, 0, TAU); c.fill();
    }
    c.strokeStyle = '#2b2d42'; c.lineWidth = 2; c.lineCap = 'round';
    c.beginPath(); c.arc(0, -86, 5, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    c.fillStyle = 'rgba(255,120,120,.45)';
    c.beginPath(); c.arc(-13, -91, 3, 0, TAU); c.arc(13, -91, 3, 0, TAU); c.fill();
    c.restore();
  }

  function drawHero(c, t) {
    const hs = clamp(G.H * 0.155 / 95, 0.75, 1.5);
    const hx = goalCX() - ballR() * 2.6, hy = spotY() + ballR() * 0.9;
    c.save(); c.translate(hx, hy); c.scale(hs, hs);
    if (kickT > 0) {
      const k = 1 - kickT / 0.3;
      c.translate(Math.sin(k * Math.PI) * ballR() * 0.9 / hs, 0);
      c.rotate(-0.12);
      G.gfx.hero(c, t, { walk: 2.2 });
    } else if (phase === 'charge') {
      c.rotate(0.06 + power * 0.1);
      G.gfx.hero(c, t, { walk: 0 });
    } else {
      G.gfx.hero(c, t, { walk: 0 });
    }
    c.restore();
  }

  function drawAim(c, t) {
    const gw2 = goalW() / 2 * 0.86;
    const ax = clamp(aimX, goalCX() - gw2, goalCX() + gw2);
    const ay = goalY() - goalH() * 0.40;
    // pontinhos de guia até ao alvo
    c.fillStyle = 'rgba(255,255,255,.75)';
    for (let i = 1; i <= 5; i++) {
      const k = i / 6;
      const px = lerp(ball.x, ax, k);
      const py = lerp(ball.y, ay, k) - Math.sin(Math.PI * k) * G.H * 0.06;
      c.beginPath(); c.arc(px, py, 4.5 - k * 2, 0, TAU); c.fill();
    }
    // alvo a pulsar
    const r = ballR() * (0.8 + Math.sin(t * 7) * 0.08);
    c.strokeStyle = '#ffd166'; c.lineWidth = 5;
    c.beginPath(); c.arc(ax, ay, r, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2.5;
    c.beginPath(); c.arc(ax, ay, r * 0.55, 0, TAU); c.stroke();
    // barra de força
    const bx = 26, by = G.H * 0.32, bh = G.H * 0.42, bw = 30;
    c.fillStyle = 'rgba(255,255,255,.35)';
    G.gfx.rr(c, bx, by, bw, bh, 14); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 3; c.stroke();
    const fh = Math.max(6, (bh - 6) * power);
    c.fillStyle = 'hsl(' + Math.round(110 - power * 110) + ',80%,55%)';
    G.gfx.rr(c, bx + 3, by + bh - 3 - fh, bw - 6, fh, 11); c.fill();
    ballIcon(c, bx + bw / 2, Math.max(by + 14, by + bh - 3 - fh - 14), 11, t * 3);
    G.gfx.label(c, '💪', bx + bw / 2, by - 22, 26, '#fff', 'center');
  }

  S.debug = function () {
    return {
      phase: phase, power: +power.toFixed(2), golos: golos, aimX: Math.round(aimX),
      willGoal: willGoal, superShot: superShot,
      ball: { x: Math.round(ball.x), y: Math.round(ball.y), s: +ball.s.toFixed(2) },
      keeper: { mode: keeper.mode, x: Math.round(keeper.x), dir: keeper.dir }
    };
  };
  // para testes: remata já com desvio off (-1..1) e força pw (0..1)
  S.debugKick = function (off, pw) {
    if (phase !== 'aim' && phase !== 'charge') return false;
    aimX = goalCX() + off * goalW() / 2 * 0.86;
    kick(clamp(pw, 0, 1));
    return true;
  };

  G.scenes = G.scenes || {};
  G.scenes.futebol = S;
})();
