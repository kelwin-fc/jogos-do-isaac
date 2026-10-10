/* Cena — A Fuga (2D, terceira pessoa): depois da selva, o herói descola e foge
   das naves de gelo dos zombies, que também têm pistolas. Os dois amigos voam
   ao lado dele, cada um com a sua pistola, a ajudar. Ninguém se magoa: as naves
   derretem em vapor e os zombies descem de paraquedas a abanar os bracinhos. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};
  const GOAL = 7;
  let ship, friends, zships, zbullets, rays, chutes, parts, clouds, lines;
  let melted, spawnT, fireCd, inv, flashT, won, pt;

  function rnd(a, b) { return a + Math.random() * (b - a); }

  S.enter = function () {
    ship = { x: G.W * 0.28, y: G.H * 0.45 };
    friends = [
      { ox: -92, oy: -66, color: '#8ac926', fireT: rnd(1, 2), ph: rnd(0, 6) },
      { ox: -84, oy: 72, color: '#1982c4', fireT: rnd(1.5, 2.6), ph: rnd(0, 6) }
    ];
    zships = []; zbullets = []; rays = []; chutes = []; parts = [];
    clouds = [];
    for (let i = 0; i < 8; i++) clouds.push({ x: rnd(0, 1.2), y: rnd(0.04, 0.62), s: rnd(22, 54), spd: rnd(60, 200) });
    lines = [];
    for (let i = 0; i < 6; i++) lines.push({ x: rnd(0, 1.2), y: rnd(0.1, 0.9), len: rnd(40, 90) });
    melted = 0; spawnT = 0.8; fireCd = 0; inv = 0; flashT = 0; won = -1; pt = 0;
    G.state.hearts = 3;
    G.banner('Foge! Derrete as naves de gelo! 🧊✈️', 3000);
  };

  function burst(x, y, n, cols) {
    for (let i = 0; i < n; i++) {
      parts.push({ x: x, y: y, vx: rnd(-160, 160), vy: rnd(-200, 60), rot: rnd(0, TAU), vr: rnd(-6, 6), t: 0, life: rnd(0.5, 1.1), col: cols[(Math.random() * cols.length) | 0] });
    }
  }

  function friendPos(f, t) {
    const k = Math.min(1, G.W / 700); // em ecrãs estreitos voam mais juntos
    return { x: ship.x + f.ox * k + Math.sin(t * 1.3 + f.ph) * 8, y: ship.y + f.oy * k + Math.cos(t * 1.1 + f.ph) * 10 };
  }

  function meltShip(z) {
    zships.splice(zships.indexOf(z), 1);
    melted++;
    G.addStars(3);
    G.audio.sfx('melt'); G.audio.sfx('star');
    burst(z.x, z.y, 12, ['#fff', '#bde0fe', '#ffd166']);
    chutes.push({ x: z.x, y: z.y, t: 0 });
    if (melted >= GOAL && won < 0) {
      won = 0;
      G.audio.sfx('tada');
      G.banner('Fugimos! Todos amigos! 🎉', 2800);
      burst(G.W * 0.5, G.H * 0.3, 70, G.gfx.FRIEND_COLORS);
    }
  }

  S.update = function (dt, t) {
    const W = G.W, H = G.H;
    pt += dt;
    inv = Math.max(0, inv - dt);
    flashT = Math.max(0, flashT - dt);

    if (won >= 0) {
      won += dt;
      if (Math.random() < dt * 10) burst(rnd(0, W), rnd(0, H * 0.3), 3, G.gfx.FRIEND_COLORS);
      if (won > 2.8) { G.setScene('flight'); return; }
    }

    // pilotar a nave
    const ax = G.input.axis();
    ship.x = Math.max(70, Math.min(W * 0.62, ship.x + ax.x * 320 * dt));
    ship.y = Math.max(84, Math.min(H - 112, ship.y + ax.y * 320 * dt));
    ship.tilt = (ship.tilt || 0) + ((ax.y * 0.16) - (ship.tilt || 0)) * Math.min(1, dt * 8);

    // naves de gelo: vêm de trás e da frente
    spawnT -= dt;
    if (spawnT <= 0 && zships.length < 3 && won < 0) {
      spawnT = rnd(1.8, 3.2);
      const fromBehind = Math.random() < 0.38;
      zships.push({
        x: fromBehind ? -80 : W + 90,
        y: rnd(95, H - 150),
        vx: fromBehind ? rnd(150, 200) : -rnd(70, 120),
        hp: 2, shootT: rnd(0.5, 1.2), ph: rnd(0, 6), hitT: 0
      });
    }
    for (let i = zships.length - 1; i >= 0; i--) {
      const z = zships[i];
      z.x += z.vx * dt;
      z.y += Math.sin(t * 1.6 + z.ph) * 26 * dt;
      z.hitT = Math.max(0, z.hitT - dt);
      z.shootT -= dt;
      if (z.shootT <= 0 && won < 0 && z.x > -60 && z.x < W + 80) {
        z.shootT = rnd(2.6, 4.2);
        const d = Math.hypot(ship.x - z.x, ship.y - z.y) || 1;
        zbullets.push({ x: z.x, y: z.y, vx: (ship.x - z.x) / d * 150, vy: (ship.y - z.y) / d * 150 });
        G.audio.sfx('click');
      }
      if (z.x < -140 || z.x > W + 150) zships.splice(i, 1);
    }

    // bolhas geladas dos zombies
    for (let i = zbullets.length - 1; i >= 0; i--) {
      const b = zbullets[i];
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < -40 || b.x > W + 40 || b.y < -40 || b.y > H + 40) { zbullets.splice(i, 1); continue; }
      if (won < 0 && inv <= 0 && Math.hypot(b.x - ship.x, b.y - ship.y) < 38) {
        zbullets.splice(i, 1);
        G.state.hearts--; inv = 1.3; flashT = 0.45;
        G.audio.sfx('brrr'); G.shake = 0.4;
        if (G.state.hearts <= 0) {
          G.audio.sfx('whee');
          G.banner('Uiii! Paraquedas! 🪂', 2000);
          G.setScene('parachute');
          return;
        }
      }
    }

    // a nossa pistola
    fireCd -= dt;
    if ((G.input.justPressed('fire') || G.input.isHeld('fire')) && fireCd <= 0 && won < 0) {
      fireCd = 0.32;
      G.audio.sfx('pew');
      rays.push({ x: ship.x + 56, y: ship.y + 8, vx: 740, vy: 0, col: '#3dff8f' });
    }
    // as pistolas dos dois amigos
    for (const f of friends) {
      f.fireT -= dt;
      if (f.fireT <= 0 && zships.length && won < 0) {
        f.fireT = rnd(2.6, 4);
        const p = friendPos(f, t);
        let best = null, bd = 1e9;
        for (const z of zships) {
          const d = Math.hypot(z.x - p.x, z.y - p.y);
          if (d < bd) { bd = d; best = z; }
        }
        if (best) {
          const d = bd || 1;
          rays.push({ x: p.x + 42, y: p.y + 6, vx: (best.x - p.x) / d * 700, vy: (best.y - p.y) / d * 700, col: f.color });
          G.audio.sfx('pew');
        }
      }
    }

    // raios quentes a voar
    for (let i = rays.length - 1; i >= 0; i--) {
      const r = rays[i];
      r.x += r.vx * dt; r.y += r.vy * dt;
      if (r.x < -60 || r.x > W + 60 || r.y < -60 || r.y > H + 60) { rays.splice(i, 1); continue; }
      for (const z of zships) {
        if (Math.hypot(r.x - z.x, r.y - z.y) < 42) {
          rays.splice(i, 1);
          z.hp--; z.hitT = 0.35;
          burst(z.x, z.y, 5, ['#ffd166', '#fff']);
          if (z.hp <= 0) meltShip(z); else G.audio.sfx('pop');
          break;
        }
      }
    }

    // zombies resgatados de paraquedas
    for (let i = chutes.length - 1; i >= 0; i--) {
      const ch = chutes[i];
      ch.t += dt; ch.y += 58 * dt; ch.x -= 34 * dt;
      if (ch.y > H + 160) chutes.splice(i, 1);
    }

    // cenário a passar depressa
    for (const cl of clouds) { cl.x -= (cl.spd / W) * dt; if (cl.x < -0.15) { cl.x = 1.15; cl.y = rnd(0.04, 0.62); } }
    for (const ln of lines) { ln.x -= (620 / W) * dt; if (ln.x < -0.1) { ln.x = 1.1; ln.y = rnd(0.1, 0.9); } }

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.rot += p.vr * dt;
      if (p.t > p.life) parts.splice(i, 1);
    }
  };

  S.draw = function (c, t) {
    const W = G.W, H = G.H;
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#5bb8ff'); g.addColorStop(0.8, '#bfe7ff');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    G.gfx.sun(c, W * 0.85, H * 0.12, Math.min(W, H) * 0.055, t);
    for (const cl of clouds) G.gfx.cloud(c, cl.x * W, cl.y * H, cl.s, cl.spd > 130 ? 0.9 : 0.55);
    // risquinhas de velocidade
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3; c.lineCap = 'round';
    for (const ln of lines) {
      c.beginPath(); c.moveTo(ln.x * W, ln.y * H); c.lineTo(ln.x * W + ln.len, ln.y * H); c.stroke();
    }
    // copas da selva lá em baixo, a passar a correr
    c.fillStyle = '#2d9d4f';
    const off = (pt * 420) % 56;
    for (let x = -60; x < W + 60; x += 56) {
      c.beginPath(); c.arc(x - off, H - 8, 34, Math.PI, 0); c.fill();
    }
    c.fillStyle = '#217a3c'; c.fillRect(0, H - 12, W, 12);

    // paraquedas dos zombies salvos
    for (const ch of chutes) {
      c.save(); c.translate(ch.x, ch.y); c.scale(0.8, 0.8);
      G.gfx.parachute(c, ch.t, { zombie: true });
      c.restore();
    }

    // naves de gelo
    for (const z of zships) {
      c.save(); c.translate(z.x, z.y);
      c.rotate(Math.sin(t * 2 + z.ph) * 0.05 + (z.hitT > 0 ? Math.sin(t * 30) * 0.12 : 0));
      if (z.vx < 0) c.scale(-1, 1);
      G.gfx.iceShip(c, t + z.ph, {});
      c.restore();
    }

    // bolhas geladas
    for (const b of zbullets) {
      c.fillStyle = 'rgba(160,215,255,.85)';
      c.beginPath(); c.arc(b.x, b.y, 11, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2;
      c.beginPath();
      c.moveTo(b.x - 6, b.y); c.lineTo(b.x + 6, b.y);
      c.moveTo(b.x, b.y - 6); c.lineTo(b.x, b.y + 6);
      c.stroke();
    }

    // raios quentes
    for (const r of rays) {
      const d = Math.hypot(r.vx, r.vy) || 1;
      const ux = r.vx / d, uy = r.vy / d;
      c.save(); c.lineCap = 'round';
      c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 11;
      c.beginPath(); c.moveTo(r.x - ux * 26, r.y - uy * 26); c.lineTo(r.x, r.y); c.stroke();
      c.strokeStyle = r.col; c.lineWidth = 6;
      c.beginPath(); c.moveTo(r.x - ux * 22, r.y - uy * 22); c.lineTo(r.x, r.y); c.stroke();
      c.restore();
    }

    // os dois amigos com as pistolas
    for (const f of friends) {
      const p = friendPos(f, t);
      c.save(); c.translate(p.x, p.y); c.scale(0.78, 0.78);
      G.gfx.planeSide(c, t + f.ph, { color: f.color, prop: true, noWheels: true, gun: true });
      c.restore();
    }

    // a nossa nave (pisca quando está protegida)
    const blink = inv > 0 && Math.floor(t * 10) % 2 === 0;
    c.save(); c.globalAlpha = blink ? 0.55 : 1;
    c.translate(ship.x, ship.y + Math.sin(t * 2.2) * 4);
    c.rotate(ship.tilt || 0);
    G.gfx.planeSide(c, t, { color: '#ff595e', prop: true, noWheels: true, gun: true });
    c.restore();

    // confetes e vapor
    for (const p of parts) {
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
      c.globalAlpha = Math.max(0, 1 - p.t / p.life);
      c.fillStyle = p.col; c.fillRect(-5, -3, 10, 6);
      c.restore();
    }

    // HUD: corações, estrelas e progresso da fuga
    for (let i = 0; i < 3; i++) {
      G.gfx.heart(c, 36 + i * 40, 46, 20, i < G.state.hearts ? '#ff5d8f' : 'rgba(255,255,255,.45)');
    }
    G.gfx.star(c, 36, 96, 16, '#ffd166', 0);
    G.gfx.label(c, '' + G.state.stars, 62, 97, 30, '#b56b00');
    const prY = W < 640 ? H - 58 : 44; // em retrato, a fila fica em baixo
    for (let i = 0; i < GOAL; i++) {
      const x = W / 2 - (GOAL - 1) * 16 + i * 32;
      if (i < melted) G.gfx.star(c, x, prY, 11, '#8ac926', 0);
      else {
        G.gfx.rr(c, x - 10, prY - 10, 20, 20, 6);
        c.fillStyle = 'rgba(140,200,255,.8)'; c.fill();
        c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2; c.stroke();
      }
    }

    // brrr! (toque gelado)
    if (flashT > 0) {
      c.fillStyle = 'rgba(140,200,255,' + (flashT * 0.5) + ')';
      c.fillRect(0, 0, W, H);
    }
  };

  S.debug = function () {
    return {
      melted: melted, active: zships.length, bullets: zbullets.length,
      hearts: G.state.hearts, won: won >= 0, ship: { x: Math.round(ship.x), y: Math.round(ship.y) },
      target: zships.length ? { x: Math.round(zships[0].x), y: Math.round(zships[0].y) } : null,
      zs: zships.map(function (z) { return { x: Math.round(z.x), st: +z.shootT.toFixed(2) }; }),
      zb: zbullets.map(function (b) { return { x: Math.round(b.x), y: Math.round(b.y) }; })
    };
  };

  G.scenes = G.scenes || {};
  G.scenes.escape = S;
})();
