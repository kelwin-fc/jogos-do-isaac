/* Mini-jogo 2 — Castelos: esqueletos bons no castelo azul, esqueletos vermelhos no vermelho.
   Toca nos balões com números para ganhar foguetões; dispara e parte o castelo vermelho.
   Os esqueletos vermelhos nunca se magoam: saltam de paraquedas e ficam amigos. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};
  const COLS = 5;
  let blocks, totalBlocks, balloons, rockets, ebubbles, shields, parts, saved, redSkels;
  let ammo, balloonT, enemyT, phase, pt, cannonAng, cannonKick, blueJump, hintT, rows, clouds;
  let aim, fireCd;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function GY() { return G.H * 0.82; }
  function blockS() { return Math.min(40, Math.max(20, (G.W * 0.34) / COLS)); }
  function redX0() { return G.W * 0.95 - COLS * blockS(); }
  function bpos(b) {
    const s = blockS();
    return { x: redX0() + b.ci * s + s / 2, y: GY() - b.ri * s - s / 2 };
  }
  function blueX() { return G.W * 0.18; }
  function blueW() { return Math.min(G.W * 0.3, 240); }
  function blueH() { return Math.min(G.H * 0.3, 190); }
  function muzzle() { return { x: blueX() + blueW() * 0.38, y: GY() - blueH() - 30 }; }

  S.enter = function () {
    rows = 3 + Math.min(G.state.castleRound, 4);
    blocks = [];
    for (let ci = 0; ci < COLS; ci++) {
      for (let ri = 0; ri < rows; ri++) blocks.push({ ci: ci, ri: ri, alive: true });
      if (ci % 2 === 0) blocks.push({ ci: ci, ri: rows, alive: true, merlon: true });
    }
    totalBlocks = blocks.length;
    redSkels = [0, 2, 4].map(function (ci, i) { return { ci: ci, ejected: false, ord: i }; });
    balloons = []; rockets = []; ebubbles = []; shields = []; parts = []; saved = [];
    ammo = 6; balloonT = 1; enemyT = 3; phase = 'play'; pt = 0;
    cannonAng = -0.7; cannonKick = 0; blueJump = 0; hintT = 0;
    aim = redX0() + COLS * blockS() / 2; fireCd = 0;
    clouds = [];
    for (let i = 0; i < 5; i++) clouds.push({ x: Math.random(), y: rnd(0.06, 0.3), s: rnd(24, 50) });
    G.banner('Toca nos balões 🎈 e dispara foguetões! 🚀', 3200);
  };

  function burst(x, y, n, cols) {
    for (let i = 0; i < n; i++) {
      parts.push({ x: x, y: y, vx: rnd(-170, 170), vy: rnd(-240, 40), rot: rnd(0, TAU), vr: rnd(-7, 7), t: 0, life: rnd(0.5, 1.2), col: cols[(Math.random() * cols.length) | 0] });
    }
  }

  function deadCount() { let d = 0; for (const b of blocks) if (!b.alive) d++; return d; }

  function ejectSkel(sk) {
    if (sk.ejected) return;
    sk.ejected = true;
    const s = blockS();
    saved.push({ x: redX0() + sk.ci * s + s / 2, y: GY() - (rows + 1) * s - 30, state: 'chute', t: 0, home: blueX() + blueW() / 2 + 30 + sk.ord * 34 });
    G.audio.sfx('whee');
  }

  function fire(tx, ty) {
    const m = muzzle();
    ammo--; cannonKick = 0.25;
    const d = Math.hypot(tx - m.x, ty - m.y);
    rockets.push({ x0: m.x, y0: m.y, tx: tx, ty: ty, t: 0, dur: 0.55 + d / 1400, apex: 140 + d * 0.18 });
    G.audio.sfx('whoosh');
  }

  function clampAim(x) { return Math.max(muzzle().x + 120, Math.min(G.W - 14, x)); }

  // ponto de aterragem da mira: topo da coluna de blocos por baixo (ou o chão)
  function aimTarget() {
    const s = blockS(), x0 = redX0();
    let ty = GY();
    const ci = Math.floor((aim - x0) / s);
    if (ci >= 0 && ci < COLS) {
      let top = -1;
      for (const b of blocks) if (b.alive && b.ci === ci && b.ri > top) top = b.ri;
      if (top >= 0) ty = GY() - (top + 1) * s + 4;
    }
    return { x: aim, y: ty };
  }

  function impact(x, y) {
    const R = blockS() * 1.7;
    let popped = 0;
    for (const b of blocks) {
      if (!b.alive) continue;
      const p = bpos(b);
      if (Math.hypot(p.x - x, p.y - y) < R) {
        b.alive = false; popped++;
        burst(p.x, p.y, 6, ['#ffd166', '#ff924c', '#fff', '#ef6461']);
      }
    }
    if (popped > 0) {
      G.addStars(popped);
      G.audio.sfx('pop'); G.audio.sfx('star'); G.shake = 0.25;
      const frac = deadCount() / totalBlocks;
      for (const sk of redSkels) if (frac >= 0.3 * (sk.ord + 1) - 0.05) ejectSkel(sk);
      if (deadCount() === totalBlocks) {
        for (const sk of redSkels) ejectSkel(sk);
        phase = 'win'; pt = 0;
        G.audio.sfx('tada');
        G.banner('Todos amigos! 🎉', 3000);
        burst(G.W * 0.5, G.H * 0.35, 80, G.gfx.FRIEND_COLORS);
      }
    } else {
      burst(x, y, 5, ['#fff', '#ffd166']);
      G.audio.sfx('pop');
    }
  }

  S.update = function (dt, t) {
    const W = G.W, H = G.H;
    pt += dt;
    cannonKick = Math.max(0, cannonKick - dt);
    blueJump = Math.max(0, blueJump - dt);
    hintT = Math.max(0, hintT - dt);

    if (phase === 'win' && pt > 3) {
      G.state.castleRound++;
      S.enter();
      G.banner('Castelo maior! 🏰 Ronda ' + G.state.castleRound, 2600);
      return;
    }

    // balões com números
    balloonT -= dt;
    if (balloonT <= 0 && balloons.length < 4) {
      balloons.push({ x: W + 50, y: rnd(H * 0.08, H * 0.42), n: 1 + ((Math.random() * 3) | 0), t: rnd(0, 6) });
      balloonT = rnd(2, 3.4);
    }
    for (let i = balloons.length - 1; i >= 0; i--) {
      const b = balloons[i];
      b.x -= 44 * dt; b.t += dt;
      if (b.x < -60) balloons.splice(i, 1);
    }

    // apontar o canhão: ◀ ▶ (ou setas), arrastar em baixo, ou tocar onde queremos acertar
    if (phase === 'play') {
      let mv = 0;
      if (G.input.isHeld('left')) mv -= 1;
      if (G.input.isHeld('right')) mv += 1;
      if (mv !== 0) aim = clampAim(aim + mv * 340 * dt);
      const dr = G.input.drag;
      if (dr.on && dr.sy > H * 0.55) aim = clampAim(dr.sx + dr.dx);
      // o cano roda a acompanhar o arco da mira
      const m = muzzle(), tg = aimTarget();
      const apex = 140 + Math.hypot(tg.x - m.x, tg.y - m.y) * 0.18;
      const want = Math.atan2(Math.min(m.y, tg.y) - apex - m.y, (m.x + tg.x) / 2 - m.x);
      cannonAng += (want - cannonAng) * Math.min(1, dt * 8);
    }

    // toque no ecrã
    const tap = G.input.tap;
    if (tap && phase === 'play') {
      let got = null;
      for (const b of balloons) if (Math.hypot(tap.x - b.x, tap.y - b.y) < 60) { got = b; break; }
      if (got) {
        balloons.splice(balloons.indexOf(got), 1);
        ammo += got.n;
        G.audio.dings(got.n);
        burst(got.x, got.y, 8, ['#fff', '#ffd166', '#8ac926']);
      } else if (tap.x > W * 0.5) {
        aim = clampAim(tap.x); // apontar para onde tocámos (disparar é no botão 🚀)
      } else if (tap.x <= W * 0.38) {
        blueJump = 1; G.audio.sfx('giggle');
      }
    }

    // disparar: botão 🚀 ou Espaço — o Isaac decide quando!
    fireCd = Math.max(0, fireCd - dt);
    if ((G.input.justPressed('fire') || G.input.isHeld('fire')) && phase === 'play' && fireCd <= 0) {
      fireCd = 0.5;
      if (ammo > 0) { const tg = aimTarget(); fire(tg.x, tg.y); }
      else { hintT = 1.2; G.audio.sfx('brrr'); G.banner('Toca nos balões 🎈 para teres foguetões!', 2000); }
    }

    // foguetões (arco de bezier)
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.t += dt / r.dur;
      const k = Math.min(1, r.t);
      const mx = (r.x0 + r.tx) / 2, my = Math.min(r.y0, r.ty) - r.apex;
      const u = 1 - k;
      r.x = u * u * r.x0 + 2 * u * k * mx + k * k * r.tx;
      r.y = u * u * r.y0 + 2 * u * k * my + k * k * r.ty;
      r.ang = Math.atan2(
        2 * u * (my - r.y0) + 2 * k * (r.ty - my),
        2 * u * (mx - r.x0) + 2 * k * (r.tx - mx)
      );
      if (Math.random() < 0.6) parts.push({ x: r.x, y: r.y, vx: rnd(-20, 20), vy: rnd(0, 40), rot: rnd(0, TAU), vr: 3, t: 0, life: 0.4, col: '#ffd166' });
      if (r.t >= 1) { rockets.splice(i, 1); impact(r.tx, r.ty); }
    }

    // bolhas dos canhões vermelhos (fazem cócegas no escudo, nunca partem nada)
    enemyT -= dt;
    if (enemyT <= 0 && phase === 'play') {
      enemyT = rnd(4, 6.5);
      const s = blockS();
      ebubbles.push({ x0: redX0() + s, y0: GY() - rows * s, tx: blueX() + rnd(-30, 40), ty: GY() - blueH() - 10, t: 0 });
    }
    for (let i = ebubbles.length - 1; i >= 0; i--) {
      const b = ebubbles[i];
      b.t += dt / 1.7;
      const k = Math.min(1, b.t), u = 1 - k;
      const mx = (b.x0 + b.tx) / 2, my = Math.min(b.y0, b.ty) - 170;
      b.x = u * u * b.x0 + 2 * u * k * mx + k * k * b.tx;
      b.y = u * u * b.y0 + 2 * u * k * my + k * k * b.ty;
      if (b.t >= 1) {
        ebubbles.splice(i, 1);
        shields.push({ x: b.x, y: b.y, t: 0 });
        blueJump = 1;
        G.audio.sfx('boing');
      }
    }
    for (let i = shields.length - 1; i >= 0; i--) { shields[i].t += dt; if (shields[i].t > 0.6) shields.splice(i, 1); }

    // esqueletos resgatados
    for (const sv of saved) {
      sv.t += dt;
      if (sv.state === 'chute') {
        sv.y += 62 * dt; sv.x += Math.sin(sv.t * 2) * 14 * dt;
        if (sv.y >= GY()) { sv.y = GY(); sv.state = 'walk'; G.audio.sfx('giggle'); }
      } else if (sv.state === 'walk') {
        sv.x -= 95 * dt; sv.walk = (sv.walk || 0) + dt * 10;
        if (sv.x <= sv.home) { sv.state = 'home'; G.addStars(2); G.audio.sfx('heart'); }
      }
    }

    // nuvens e confetes
    for (const cl of clouds) { cl.x -= dt * 0.008; if (cl.x < -0.1) cl.x = 1.1; }
    if (phase === 'win' && Math.random() < dt * 12) burst(rnd(0, W), rnd(0, H * 0.3), 3, G.gfx.FRIEND_COLORS);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.rot += p.vr * dt;
      if (p.t > p.life) parts.splice(i, 1);
    }
  };

  S.draw = function (c, t) {
    const W = G.W, H = G.H, gy = GY();
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#7ec8ff'); g.addColorStop(0.75, '#d9f3ff');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    G.gfx.sun(c, W * 0.52, H * 0.1, Math.min(W, H) * 0.055, t);
    for (const cl of clouds) G.gfx.cloud(c, cl.x * W, cl.y * H, cl.s, 0.85);

    // colinas e chão
    c.fillStyle = '#a7dda7';
    c.beginPath(); c.moveTo(0, gy);
    for (let x = 0; x <= W + 40; x += 40) c.lineTo(x, gy - 34 - Math.sin(x * 0.01) * 22);
    c.lineTo(W, gy); c.closePath(); c.fill();
    c.fillStyle = '#8fd694'; c.fillRect(0, gy, W, H - gy);
    c.fillStyle = 'rgba(255,255,255,.35)';
    G.gfx.rr(c, -20, gy, W + 40, 8, 4); c.fill();

    drawBlueCastle(c, t);
    drawRedCastle(c, t);

    // mira: arco pontilhado + alvo onde o foguetão vai cair
    if (phase === 'play') {
      const m = muzzle(), tg = aimTarget();
      const d = Math.hypot(tg.x - m.x, tg.y - m.y);
      const apex = 140 + d * 0.18;
      const mx = (m.x + tg.x) / 2, my = Math.min(m.y, tg.y) - apex;
      for (let k = 0.1; k <= 0.93; k += 0.083) {
        const u = 1 - k;
        const px = u * u * m.x + 2 * u * k * mx + k * k * tg.x;
        const py = u * u * m.y + 2 * u * k * my + k * k * tg.y;
        c.fillStyle = 'rgba(255,255,255,' + (0.9 - k * 0.4).toFixed(2) + ')';
        c.beginPath(); c.arc(px, py, 5.5 - k * 2.5, 0, TAU); c.fill();
      }
      const pulse = 1 + Math.sin(t * 6) * 0.15;
      c.strokeStyle = 'rgba(255,209,102,.95)'; c.lineWidth = 5;
      c.beginPath(); c.arc(tg.x, tg.y, 15 * pulse, 0, TAU); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2.5;
      c.beginPath(); c.arc(tg.x, tg.y, 22 * pulse, 0, TAU); c.stroke();
    }

    // bolhas inimigas
    for (const b of ebubbles) {
      c.fillStyle = 'rgba(255,120,190,.8)';
      c.beginPath(); c.arc(b.x, b.y, 14, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,.6)';
      c.beginPath(); c.arc(b.x - 4, b.y - 4, 4.5, 0, TAU); c.fill();
    }
    // escudo do castelo azul (as bolhas fazem bolinhas e nada parte!)
    for (const sh of shields) {
      const k = sh.t / 0.6;
      c.strokeStyle = 'rgba(140,220,255,' + (0.9 - k * 0.9) + ')';
      c.lineWidth = 6;
      c.beginPath(); c.arc(sh.x, sh.y, 20 + k * 46, 0, TAU); c.stroke();
    }

    // foguetões
    for (const r of rockets) {
      c.save(); c.translate(r.x, r.y); c.rotate((r.ang || 0) + Math.PI / 2); c.scale(0.9, 0.9);
      G.gfx.rocket(c, t);
      c.restore();
    }

    // balões com números
    for (const b of balloons) {
      c.save(); c.translate(b.x, b.y + Math.sin(b.t * 2) * 6);
      G.gfx.balloon(c, b.n, b.t);
      c.restore();
    }

    // esqueletos resgatados (paraquedas → caminhar → festa no castelo azul)
    for (const sv of saved) {
      c.save(); c.translate(sv.x, sv.y);
      if (sv.state === 'chute') { c.scale(0.85, 0.85); G.gfx.parachute(c, sv.t, { skeleton: true }); }
      else if (sv.state === 'walk') { c.scale(-1, 1); G.gfx.skeleton(c, t, { team: 'blue', walk: sv.walk }); }
      else G.gfx.skeleton(c, t, { team: 'blue', cheer: true });
      c.restore();
    }

    // confetes
    for (const p of parts) {
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
      c.globalAlpha = Math.max(0, 1 - p.t / p.life);
      c.fillStyle = p.col; c.fillRect(-5, -3, 10, 6);
      c.restore();
    }

    // HUD: estrelas + foguetões
    G.gfx.star(c, 36, 46, 16, '#ffd166', 0);
    G.gfx.label(c, '' + G.state.stars, 62, 47, 30, '#b56b00');
    const wob = hintT > 0 ? Math.sin(t * 30) * 4 : 0;
    c.save(); c.translate(40 + wob, 100); c.scale(0.75, 0.75); G.gfx.rocket(c, t); c.restore();
    G.gfx.label(c, '' + ammo, 68, 100, 32, ammo > 0 ? '#c1121f' : '#8d99ae');
  };

  function drawBlueCastle(c, t) {
    const gy = GY(), bx = blueX(), bw = blueW(), bh = blueH();
    const x0 = bx - bw / 2;
    // torres
    c.fillStyle = '#4ea8de';
    G.gfx.rr(c, x0 - 18, gy - bh - 34, 42, bh + 34, 8); c.fill();
    G.gfx.rr(c, x0 + bw - 24, gy - bh - 34, 42, bh + 34, 8); c.fill();
    // telhados
    c.fillStyle = '#1982c4';
    [[x0 + 3], [x0 + bw - 3]].forEach(function (o) {
      c.beginPath(); c.moveTo(o[0] - 30, gy - bh - 30); c.lineTo(o[0], gy - bh - 76); c.lineTo(o[0] + 30, gy - bh - 30); c.closePath(); c.fill();
    });
    // bandeira
    c.strokeStyle = '#2b2d42'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(x0 + bw - 3, gy - bh - 76); c.lineTo(x0 + bw - 3, gy - bh - 104); c.stroke();
    c.fillStyle = '#ffca3a';
    c.beginPath(); c.moveTo(x0 + bw - 3, gy - bh - 104);
    c.lineTo(x0 + bw - 3 + 26 + Math.sin(t * 4) * 3, gy - bh - 97);
    c.lineTo(x0 + bw - 3, gy - bh - 90); c.closePath(); c.fill();
    // muralha
    c.fillStyle = '#5fb0e8';
    G.gfx.rr(c, x0, gy - bh, bw, bh, 6); c.fill();
    c.fillStyle = '#4ea8de';
    for (let i = 0; i < 4; i++) G.gfx.rr(c, x0 + 8 + i * (bw - 16 - 18) / 3, gy - bh - 14, 18, 16, 4), c.fill();
    // porta e janelas
    c.fillStyle = '#28527a';
    c.beginPath(); c.arc(bx, gy - 26, 22, Math.PI, 0); c.rect(bx - 22, gy - 26, 44, 26); c.fill();
    c.fillStyle = '#bde0fe';
    c.beginPath(); c.arc(bx - bw * 0.28, gy - bh * 0.6, 8, 0, TAU); c.arc(bx + bw * 0.28, gy - bh * 0.6, 8, 0, TAU); c.fill();
    // esqueletos bons em cima da muralha
    const hop = blueJump > 0 ? Math.abs(Math.sin(t * 10)) * 10 : 0;
    c.save(); c.translate(bx - bw * 0.16, gy - bh - 14 - hop); c.scale(0.8, 0.8);
    G.gfx.skeleton(c, t, { team: 'blue', wave: true });
    c.restore();
    c.save(); c.translate(bx + bw * 0.14, gy - bh - 14 - hop); c.scale(-0.72, 0.72);
    G.gfx.skeleton(c, t + 2, { team: 'blue', wave: blueJump > 0, cheer: blueJump > 0 });
    c.restore();
    // canhão dourado dos foguetões
    const m = muzzle();
    c.save(); c.translate(m.x, m.y + 26); c.rotate(cannonAng + (cannonKick > 0 ? Math.sin(t * 40) * 0.06 : 0));
    c.fillStyle = '#ffb703';
    G.gfx.rr(c, -8, -11, 44, 22, 10); c.fill();
    c.fillStyle = '#fb8500';
    G.gfx.rr(c, 30, -13, 12, 26, 6); c.fill();
    c.restore();
    c.fillStyle = '#6c757d';
    c.beginPath(); c.arc(m.x, m.y + 30, 9, 0, TAU); c.fill();
  }

  function drawRedCastle(c, t) {
    const gy = GY(), s = blockS(), x0 = redX0();
    // blocos (cada tijolo parte-se com os foguetões)
    for (const b of blocks) {
      if (!b.alive) continue;
      const p = bpos(b);
      c.fillStyle = (b.ci + b.ri) % 2 === 0 ? '#ef6461' : '#e8555b';
      G.gfx.rr(c, p.x - s / 2 + 1.5, p.y - s / 2 + 1.5, s - 3, s - 3, 6); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; c.stroke();
    }
    // canhãozinho vermelho no topo (dispara bolhas fofas)
    if (phase === 'play') {
      const cx0 = x0 + s, cy0 = gy - rows * s - 4;
      c.save(); c.translate(cx0, cy0); c.rotate(-2.6);
      c.fillStyle = '#9d4446';
      G.gfx.rr(c, -6, -8, 30, 16, 8); c.fill();
      c.restore();
    }
    // esqueletos vermelhos ainda no castelo (espreitam no topo)
    for (const sk of redSkels) {
      if (sk.ejected) continue;
      const px = x0 + sk.ci * s + s / 2;
      const py = gy - (rows + 1) * s;
      c.save(); c.translate(px, py + Math.sin(t * 3 + sk.ci) * 2); c.scale(-0.7, 0.7);
      G.gfx.skeleton(c, t + sk.ci, { team: 'red' });
      c.restore();
    }
  }

  S.debug = function () {
    return {
      ammo: ammo, phase: phase,
      alive: blocks.filter(function (b) { return b.alive; }).length,
      total: totalBlocks,
      aim: aim, aimTarget: aimTarget(), cannonAng: cannonAng,
      balloons: balloons.map(function (b) { return { x: b.x, y: b.y, n: b.n }; }),
      saved: saved.map(function (s) { return s.state; })
    };
  };

  G.scenes = G.scenes || {};
  G.scenes.castle = S;
})();
