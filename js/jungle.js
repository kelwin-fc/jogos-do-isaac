/* Cena 2 — Selva de plataformas: saltar por cima dos zombies de gelo, apanhar a mota
   para ir mais depressa, derreter zombies em animais felizes e voltar ao avião.
   Se um zombie tocar no herói, congela-o e perde 1 coração; aos 0, faz uma sesta e recomeça. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};
  const L = 4400;          // comprimento do nível
  const PX = L - 240;      // posição do avião arranjado
  const WALK = 250, BIKE = 480, CORRIDA = 660, JUMPV = 580, GRAV = 1400;
  const PORTAO = 2750;     // portão da pista de corrida (entra-se de mota de corrida)
  let hero, zombies, bolts, sparks, gift, camX, fireCd, phase, pt, trees, flowers, platforms, bikes;
  let rampas, estrelasAr, portaoBub;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function h01(n) { const s = Math.sin(n * 127.1) * 43758.5; return s - Math.floor(s); }

  S.enter = function () {
    hero = { x: 140, dir: 1, walk: 0, alt: 0, vy: 0, grounded: true, frozen: 0, wasFrozen: false, inv: 0, bike: null, subiuCd: 0 };
    bolts = []; sparks = [];
    zombies = [900, 1350, 1850, 2550, 3050, 3550].map(function (x, i) {
      return { x: x, dir: -1, hp: 2, state: 'walk', t: rnd(0, 6), meltT: 0, kind: i % 3, bub: 0, touchCd: 0 };
    });
    platforms = [
      { x: 860, w: 180, alt: 112 },
      { x: 1330, w: 170, alt: 148 },
      { x: 1830, w: 180, alt: 112 },
      { x: 2520, w: 170, alt: 132 },
      { x: 3030, w: 170, alt: 112 },
      { x: 3530, w: 180, alt: 144 }
    ];
    // Duas motas (pedido do Isaac): a normal e a de CORRIDA. Em cima delas não se dispara —
    // o botão ⚡ serve para descer da mota e voltar a poder derreter zombies.
    bikes = [
      { x: 1600, kind: 'normal', emUso: false },
      { x: 2900, kind: 'corrida', emUso: false }
    ];
    gift = { x: 2150 };
    // Rampas na parte de baixo (pedido do Isaac): a mota de corrida corre e SALTA.
    // A última é a maior — quem a apanha a correr vai pelo ar até ao avião.
    rampas = [
      { x: 640, w: 150, alt: 58 },
      { x: 1980, w: 160, alt: 68 },
      { x: 3180, w: 170, alt: 78 },
      { x: 3700, w: 200, alt: 100, ultima: true }
    ];
    // estrelinhas no ar por cima de cada rampa, para valer a pena saltar alto
    estrelasAr = [];
    for (const r of rampas) {
      for (let k = 0; k < 4; k++) {
        estrelasAr.push({ x: r.x + r.w + 90 + k * 110, alt: r.alt + 60 + k * 34, apanhada: false });
      }
    }
    portaoBub = 0;
    camX = 0; fireCd = 0; phase = 'walk'; pt = 0;
    G.state.hearts = 3;
    trees = []; flowers = [];
    for (let x = 200; x < L; x += 240) trees.push({ x: x + h01(x) * 120, s: 0.8 + h01(x + 1) * 0.5 });
    for (let x = 120; x < L; x += 150) flowers.push({ x: x + h01(x + 2) * 90, c: ['#ff5d8f', '#ffca3a', '#b5179e', '#ff924c'][Math.floor(h01(x + 3) * 4)] });
    G.banner('Salta nas plataformas! ⬆️ Derrete os zombies! ❄️', 3200);
  };

  function spark(x, y, n, col) {
    for (let i = 0; i < n; i++) sparks.push({ x: x, y: y, vx: rnd(-120, 120), vy: rnd(-190, -30), t: 0, life: rnd(0.4, 0.9), col: col });
  }

  function rampaEm(x) {
    for (const r of rampas) if (x >= r.x && x <= r.x + r.w) return r;
    return null;
  }
  function alturaRampa(r, x) {
    return r.alt * Math.max(0, Math.min(1, (x - r.x) / r.w));
  }

  S.update = function (dt, t) {
    const W = G.W, H = G.H, GY = H * 0.8;
    const inp = G.input;

    if (phase === 'takeoff') {
      pt += dt;
      if (Math.random() < 0.6) spark(PX + pt * pt * 260 - 90, GY - 40, 1, '#ffd166');
      if (pt > 2.6) G.setScene('escape'); // a fuga 2D das naves de gelo!
      return;
    }

    if (phase === 'nap') { // sesta fofa: recomeça a selva com os corações cheios
      pt += dt;
      if (pt > 2.4) S.enter();
      return;
    }

    // congelamento
    hero.frozen = Math.max(0, hero.frozen - dt);
    if (hero.frozen <= 0 && hero.wasFrozen) {
      hero.wasFrozen = false; hero.inv = 1.3;
      spark(hero.x, GY - 60 - hero.alt, 10, '#8ecae6');
      G.audio.sfx('pop');
    }
    hero.inv = Math.max(0, hero.inv - dt);

    // andar / conduzir a mota
    const ax = inp.axis();
    let mv = 0;
    if (inp.isHeld('left')) mv -= 1;
    if (inp.isHeld('right')) mv += 1;
    if (mv === 0) mv = Math.abs(ax.x) > 0.25 ? Math.sign(ax.x) : 0;
    const prevX = hero.x;
    hero.vx = 0;
    if (mv !== 0 && hero.frozen <= 0) {
      const spd = hero.bike === 'corrida' ? CORRIDA : (hero.bike ? BIKE : WALK);
      hero.vx = mv * spd;
      hero.x = Math.max(80, Math.min(PX - 40, hero.x + mv * spd * dt));
      hero.dir = mv; hero.walk += dt * (hero.bike ? 16 : 11);
      if (hero.bike && Math.random() < dt * (hero.bike === 'corrida' ? 16 : 9)) {
        spark(hero.x - hero.dir * 50, GY - 14, 1, hero.bike === 'corrida' ? '#ffd166' : 'rgba(210,210,220,.8)');
      }
    }
    camX = Math.max(0, Math.min(L - W, hero.x - W * 0.38));

    // saltar
    if ((inp.justPressed('jump') || inp.justPressed('up')) && hero.grounded && hero.frozen <= 0) {
      hero.vy = JUMPV; hero.grounded = false; G.audio.sfx('hop');
    }
    // física de plataformas (o chão pode ser a subida de uma rampa)
    const prevAlt = hero.alt;
    hero.vy -= GRAV * dt;
    hero.alt += hero.vy * dt;
    hero.grounded = false;
    const rAqui = rampaEm(hero.x);
    const chao = rAqui ? alturaRampa(rAqui, hero.x) : 0;
    if (hero.vy <= 0) {
      for (const p of platforms) {
        if (Math.abs(hero.x - p.x) < p.w / 2 + 10 && prevAlt >= p.alt - 3 && hero.alt <= p.alt) {
          hero.alt = p.alt; hero.vy = 0; hero.grounded = true; break;
        }
      }
      if (!hero.grounded && hero.alt <= chao) { hero.alt = chao; hero.vy = 0; hero.grounded = true; }
    }

    /* ---- rampas: sair pelo cimo a andar = SALTO (a mota de corrida salta muito) ---- */
    if (rAqui && hero.grounded) hero.naRampa = rAqui;
    else if (hero.naRampa && !rAqui) {
      const r = hero.naRampa;
      hero.naRampa = null;
      if (hero.vx > 0 && prevX <= r.x + r.w) {
        const f = hero.bike === 'corrida' ? 1.06 : (hero.bike ? 0.86 : 0.42);
        hero.vy = hero.vx * f; hero.grounded = false;
        hero.voo = 1.4;
        G.audio.sfx('whee'); G.shake = 0.25;
        spark(hero.x, GY - 20, 12, '#ffd166');
        if (r.ultima && hero.bike === 'corrida') G.banner('Salto para o avião! ✈️🏍️', 2200);
        else if (hero.bike === 'corrida') G.banner('Salto gigante! 🏍️💨', 1600);
      }
    }
    hero.voo = Math.max(0, (hero.voo || 0) - dt);
    if (hero.voo > 0 && hero.alt > 10 && Math.random() < dt * 30) {
      spark(hero.x - hero.dir * 30, GY - 20 - hero.alt, 1, '#ffd166');
    }

    // estrelinhas no ar por cima das rampas
    for (const e of estrelasAr) {
      if (e.apanhada) continue;
      if (Math.abs(e.x - hero.x) < 54 && Math.abs(e.alt - hero.alt) < 74) {
        e.apanhada = true; G.addStars(1); G.audio.sfx('star');
        spark(e.x, GY - 20 - e.alt, 5, '#ffd166');
      }
    }

    /* ---- portão da pista de corrida: entra-se DE MOTA DE CORRIDA ---- */
    portaoBub = Math.max(0, portaoBub - dt);
    if (Math.abs(hero.x - PORTAO) < 70 && hero.alt < 60) {
      if (hero.bike === 'corrida') {
        G.pistaVolta = 'jungle';
        G.audio.sfx('vroom'); G.audio.sfx('whistle');
        G.setScene('pista');
        return;
      }
      if (portaoBub <= 0) {
        portaoBub = 3;
        G.banner('A pista é de mota de corrida! 🏁🏍️', 2200);
      }
    }

    // Subir para uma mota (a que estiver ao lado). Vindo na mota normal, chegar à de
    // CORRIDA troca de mota — senão nunca se lá chegava sem descer e fugir a pé, e é
    // com a de corrida que se saltam as rampas e se entra na pista.
    hero.subiuCd = Math.max(0, hero.subiuCd - dt);
    if (hero.subiuCd <= 0) {
      for (const b of bikes) {
        if (b.emUso || Math.abs(hero.x - b.x) > 52 || hero.alt >= 20) continue;
        if (hero.bike === b.kind) continue;
        if (hero.bike && b.kind !== 'corrida') continue;      // só se troca PARA a de corrida
        if (hero.bike) {                                      // a antiga fica estacionada aqui
          const velha = bikes.find(function (o) { return o.kind === hero.bike; });
          if (velha) { velha.x = hero.x - 90; velha.emUso = false; }
        }
        b.emUso = true; hero.bike = b.kind; hero.subiuCd = 0.6;
        G.audio.sfx('vroom');
        G.banner(b.kind === 'corrida'
          ? 'Mota de corrida! 🏁 Capacete posto! ⛑️'
          : 'Mota! 🏍️ Põe o capacete! ⛑️', 2400);
        spark(hero.x, GY - 40, 12, '#ffd166');
        break;
      }
    }

    // disparar raio quente — na mota NÃO se dispara: o ⚡ serve para descer dela
    fireCd -= dt;
    if ((inp.justPressed('fire') || inp.isHeld('fire')) && fireCd <= 0 && hero.frozen <= 0) {
      if (hero.bike) {
        if (inp.justPressed('fire') && hero.subiuCd <= 0) {   // largar a mota onde estamos
          const b = bikes.find(function (o) { return o.kind === hero.bike; });
          if (b) { b.x = hero.x; b.emUso = false; }
          hero.bike = null; hero.subiuCd = 0.4;
          G.audio.sfx('pop');
          G.banner('Desceste da mota! Já podes disparar ⚡', 2000);
        }
      } else {
        fireCd = 0.4; G.audio.sfx('pew');
        bolts.push({ x: hero.x + hero.dir * 44, y: GY - 52 - hero.alt, alt: hero.alt, dir: hero.dir });
      }
    }
    for (let i = bolts.length - 1; i >= 0; i--) {
      const b = bolts[i];
      b.x += b.dir * 780 * dt;
      if (Math.abs(b.x - hero.x) > W) { bolts.splice(i, 1); continue; }
      for (const z of zombies) {
        if (z.state === 'walk' && Math.abs(b.x - z.x) < 36 && b.alt < 70) {
          bolts.splice(i, 1);
          z.hp -= G.state.suit ? 2 : 1;
          spark(z.x, GY - 40, 8, '#ffd166');
          if (z.hp <= 0) { z.state = 'melt'; z.meltT = 0; G.audio.sfx('melt'); }
          else G.audio.sfx('pop');
          break;
        }
      }
    }

    // zombies
    for (const z of zombies) {
      z.t += dt; z.touchCd = Math.max(0, z.touchCd - dt); z.bub = Math.max(0, z.bub - dt);
      if (z.state === 'melt') {
        z.meltT += dt;
        if (Math.random() < 0.3) spark(z.x + rnd(-20, 20), GY - rnd(20, 60), 1, 'rgba(255,255,255,.8)');
        if (z.meltT > 1) { z.state = 'animal'; z.bub = 2.2; G.addStars(3); G.audio.sfx('star'); G.audio.sfx('giggle'); }
        continue;
      }
      if (z.state !== 'walk') continue;
      const d = hero.x - z.x;
      if (Math.abs(d) < 460) { z.dir = Math.sign(d) || -1; z.x += z.dir * 30 * dt; }
      else z.x += Math.sin(z.t * 0.8) * 8 * dt;
      if (z.bub <= 0 && Math.random() < dt * 0.15) z.bub = 1.4;
      // toque no herói: congela e tira um coração (o fato protege; no ar não apanham)
      if (Math.abs(d) < 56 && z.touchCd <= 0 && hero.alt < 46) {
        z.touchCd = 1.5;
        if (G.state.suit) {
          z.x -= Math.sign(d) * 150; G.audio.sfx('pop');
          spark(z.x, GY - 50, 6, '#8ecae6');
        } else if (hero.frozen <= 0 && hero.inv <= 0) {
          hero.frozen = 1.4;
          G.state.hearts = Math.max(0, G.state.hearts - 1);
          G.audio.sfx('brrr'); G.shake = 0.35;
          if (G.state.hearts <= 0) {
            phase = 'nap'; pt = 0;
            G.audio.sfx('boing');
            G.banner('Ohhh… uma sesta quentinha 💤', 2400);
          } else {
            G.banner('Brrr! Congelado! 🧊', 1200);
          }
        }
      }
    }

    // presente com o fato de proteção
    if (!G.state.suit && gift && Math.abs(hero.x - gift.x) < 50 && hero.alt < 30) {
      G.state.suit = true; gift = null;
      G.audio.sfx('suit'); G.banner('Fato de proteção! ✨', 2400);
      spark(hero.x, GY - 60, 22, '#ffd166');
    }

    // chegar ao avião
    if (hero.x >= PX - 90) {
      phase = 'takeoff'; pt = 0;
      G.audio.sfx('tada'); G.audio.sfx('whee');
      G.banner('Boa viagem! ✈️', 2400);
      G.state.hearts = 3;
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 260 * dt;
      if (s.t > s.life) sparks.splice(i, 1);
    }
  };

  S.draw = function (c, t) {
    const W = G.W, H = G.H, GY = H * 0.8;
    // céu
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#8fd3ff'); g.addColorStop(0.7, '#d8f3dc');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    G.gfx.sun(c, W * 0.86, H * 0.12, Math.min(W, H) * 0.06, t);

    // colinas distantes (parallax 0.25)
    c.fillStyle = '#74c69d';
    c.beginPath(); c.moveTo(0, GY);
    for (let x = 0; x <= W + 40; x += 40) {
      const wx = x + camX * 0.25;
      c.lineTo(x, GY - 70 - Math.sin(wx * 0.006) * 40 - Math.sin(wx * 0.017) * 18);
    }
    c.lineTo(W, GY); c.closePath(); c.fill();

    // árvores (parallax 0.55)
    for (const tr of trees) {
      const x = tr.x - camX * 0.55;
      if (x < -140 || x > W + 140) continue;
      const s = tr.s, ty = GY + 6;
      c.fillStyle = '#7f5539';
      G.gfx.rr(c, x - 9 * s, ty - 120 * s, 18 * s, 120 * s, 8 * s); c.fill();
      c.fillStyle = '#2d9d4f';
      c.beginPath();
      c.arc(x - 30 * s, ty - 120 * s, 34 * s, 0, TAU);
      c.arc(x + 30 * s, ty - 120 * s, 34 * s, 0, TAU);
      c.arc(x, ty - 150 * s, 40 * s, 0, TAU);
      c.fill();
    }

    // chão
    c.fillStyle = '#38b000'; c.fillRect(0, GY, W, H - GY);
    c.fillStyle = '#b07d4f';
    G.gfx.rr(c, -20, GY + 14, W + 40, 26, 13); c.fill();

    // flores
    for (const f of flowers) {
      const x = f.x - camX;
      if (x < -20 || x > W + 20) continue;
      c.strokeStyle = '#2d9d4f'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(x, GY + 12); c.lineTo(x, GY - 6); c.stroke();
      c.fillStyle = f.c;
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * TAU + t * 0.3;
        c.beginPath(); c.arc(x + Math.cos(a) * 6, GY - 10 + Math.sin(a) * 6, 4.5, 0, TAU); c.fill();
      }
      c.fillStyle = '#ffd166'; c.beginPath(); c.arc(x, GY - 10, 4, 0, TAU); c.fill();
    }

    // rampas de saltar (riscas amarelas e pretas, como as do jogo dos carros)
    for (const r of rampas) {
      const x = r.x - camX;
      if (x < -260 || x > W + 260) continue;
      c.save();
      c.beginPath();
      c.moveTo(x, GY + 10); c.lineTo(x + r.w, GY + 10 - r.alt);
      c.lineTo(x + r.w, GY + 14); c.lineTo(x, GY + 14);
      c.closePath();
      c.fillStyle = '#ffd166'; c.fill();
      c.save(); c.clip();
      c.fillStyle = '#22223b';
      for (let k = 0; k < r.w / 26 + 1; k++) c.fillRect(x + k * 26, GY - r.alt - 6, 13, r.alt + 26);
      c.restore();
      c.strokeStyle = '#fff'; c.lineWidth = 3;
      c.beginPath();
      c.moveTo(x, GY + 10); c.lineTo(x + r.w, GY + 10 - r.alt); c.stroke();
      // seta a dizer "salta!"
      const bob = Math.sin(t * 4 + r.x) * 5;
      c.fillStyle = 'rgba(255,209,102,.95)';
      c.beginPath();
      c.moveTo(x + r.w + 40, GY - r.alt - 60 + bob);
      c.lineTo(x + r.w + 16, GY - r.alt - 24 + bob);
      c.lineTo(x + r.w + 32, GY - r.alt - 24 + bob);
      c.lineTo(x + r.w + 32, GY - r.alt - 6 + bob);
      c.lineTo(x + r.w + 48, GY - r.alt - 6 + bob);
      c.lineTo(x + r.w + 48, GY - r.alt - 24 + bob);
      c.lineTo(x + r.w + 64, GY - r.alt - 24 + bob);
      c.closePath(); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke();
      c.restore();
    }

    // estrelinhas no ar, para apanhar durante o salto
    for (const e of estrelasAr) {
      if (e.apanhada) continue;
      const x = e.x - camX;
      if (x < -40 || x > W + 40) continue;
      G.gfx.star(c, x, GY - 20 - e.alt + Math.sin(t * 3 + e.x) * 5, 15, '#ffd166', t * 1.2);
    }

    // portão da pista de corrida
    const gx = PORTAO - camX;
    if (gx > -220 && gx < W + 220) {
      c.fillStyle = '#e63946';
      G.gfx.rr(c, gx - 96, GY - 150, 22, 160, 8); c.fill();
      G.gfx.rr(c, gx + 74, GY - 150, 22, 160, 8); c.fill();
      c.fillStyle = '#22223b';
      G.gfx.rr(c, gx - 100, GY - 176, 200, 34, 10); c.fill();
      for (let i = 0; i < 10; i++) for (let k = 0; k < 2; k++) {
        c.fillStyle = (i + k) % 2 ? '#fff' : '#22223b';
        c.fillRect(gx - 98 + i * 19.6, GY - 174 + k * 15, 19.6, 15);
      }
      c.save(); c.translate(gx, GY - 96); c.scale(0.7, 0.7);
      G.gfx.bikeCorrida ? G.gfx.bikeCorrida(c, t, {}) : G.gfx.bike(c, t, { kind: 'corrida' });
      c.restore();
      if (Math.sin(t * 1.6) > 0) G.gfx.bubble(c, gx, GY - 200, '🏁 Pista! De mota!');
    }

    // plataformas do universo multiplataformas do Isaac
    for (const p of platforms) {
      const x = p.x - camX;
      if (x < -160 || x > W + 160) continue;
      const py = GY - p.alt;
      c.fillStyle = '#b07d4f';
      G.gfx.rr(c, x - p.w / 2, py, p.w, 16, 8); c.fill();
      c.fillStyle = '#68b723';
      G.gfx.rr(c, x - p.w / 2 - 4, py - 7, p.w + 8, 13, 7); c.fill();
      c.fillStyle = '#8fd694';
      for (let k = -2; k <= 2; k++) {
        c.beginPath(); c.arc(x + k * p.w * 0.2, py - 7, 5, Math.PI, 0); c.fill();
      }
    }

    // motas estacionadas
    for (const b of bikes) {
      if (b.emUso) continue;
      const x = b.x - camX;
      if (x < -110 || x > W + 110) continue;
      c.save(); c.translate(x, GY + 8); G.gfx.bike(c, t, { kind: b.kind }); c.restore();
      if (Math.sin(t * 1.5) > 0.2) {
        G.gfx.bubble(c, x, GY - 70, b.kind === 'corrida' ? '🏁 Sobe!' : '🏍️ Sobe!');
      }
    }

    // presente
    if (gift && !G.state.suit) {
      const x = gift.x - camX;
      if (x > -80 && x < W + 80) { c.save(); c.translate(x, GY + 8); G.gfx.gift(c, t); c.restore(); }
    }

    // zombies / animais
    for (const z of zombies) {
      const x = z.x - camX;
      if (x < -100 || x > W + 100) continue;
      c.save(); c.translate(x, GY + 8);
      if (z.state === 'animal') G.gfx.animal(c, z.kind, t + z.t);
      else G.gfx.zombie(c, t + z.t, { melt: z.state === 'melt' ? z.meltT : 0 });
      c.restore();
      if (z.bub > 0) {
        if (z.state === 'animal') G.gfx.bubble(c, x, GY - 60, 'Obrigado! 🌟');
        else if (z.state === 'walk') G.gfx.bubble(c, x, GY - 90, 'Brrr…');
      }
    }

    // avião arranjado + tucano mecânico
    const px = PX - camX + (phase === 'takeoff' ? pt * pt * 260 : 0);
    const py = GY - 26 - (phase === 'takeoff' ? Math.max(0, pt - 0.8) * Math.max(0, pt - 0.8) * 220 : 0);
    if (px > -300) {
      c.save(); c.translate(px, py);
      c.rotate(phase === 'takeoff' ? -Math.min(0.35, Math.max(0, pt - 0.8) * 0.3) : 0);
      G.gfx.planeSide(c, t, { color: '#ff595e', prop: phase === 'takeoff' });
      c.restore();
      if (phase !== 'takeoff') {
        c.save(); c.translate(px - 150, GY + 8); G.gfx.toucan(c, t); c.restore();
        if (Math.sin(t * 1.2) > 0.3) G.gfx.bubble(c, px - 150, GY - 70, 'Está pronto! 🔧');
      }
    }

    // herói (a pé, na mota, congelado ou a dormir a sesta)
    if (phase !== 'takeoff') {
      const hx = hero.x - camX + (hero.frozen > 0 ? Math.sin(t * 40) * 2.5 : 0);
      const hy = GY + 8 - hero.alt;
      const blink = hero.inv > 0 && Math.floor(t * 10) % 2 === 0;
      c.save(); c.globalAlpha = blink ? 0.55 : 1;
      c.translate(hx, hy);
      if (phase === 'nap') {
        c.rotate(-Math.PI / 2);
        G.gfx.hero(c, t, { suit: G.state.suit });
      } else {
        if (hero.dir < 0) c.scale(-1, 1);
        if (hero.bike) {
          G.gfx.bike(c, t, { riding: true, kind: hero.bike });
          c.save(); c.translate(-16, hero.bike === 'corrida' ? -30 : -34);
          // na mota vai sempre de capacete e sem pistola (não se dispara a conduzir)
          G.gfx.hero(c, t, {
            suit: G.state.suit, sit: true, capacete: true,
            capaceteCor: hero.bike === 'corrida' ? '#e63946' : '#3a86ff'
          });
          c.restore();
        } else {
          G.gfx.hero(c, t, { suit: G.state.suit, gun: true, walk: hero.grounded ? hero.walk : 0 });
        }
      }
      c.restore();
      if (hero.frozen > 0) { // cubo de gelo à volta do herói
        c.save(); c.translate(hx, hy);
        G.gfx.rr(c, -34, -104, 68, 104, 14);
        c.fillStyle = 'rgba(140,200,255,.5)'; c.fill();
        c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 3; c.stroke();
        c.fillStyle = 'rgba(255,255,255,.5)';
        G.gfx.rr(c, -26, -96, 18, 12, 6); c.fill();
        c.restore();
        G.gfx.bubble(c, hx, hy - 112, 'Brrr! 🧊');
      }
      if (phase === 'nap') G.gfx.bubble(c, hx + 30, hy - 60, 'Zzz… 💤');
    }

    // raios quentes
    for (const b of bolts) {
      const x = b.x - camX;
      c.save(); c.lineCap = 'round';
      c.strokeStyle = 'rgba(255,150,60,.5)'; c.lineWidth = 14;
      c.beginPath(); c.moveTo(x - b.dir * 26, b.y); c.lineTo(x, b.y); c.stroke();
      c.strokeStyle = '#ffd166'; c.lineWidth = 7;
      c.beginPath(); c.moveTo(x - b.dir * 22, b.y); c.lineTo(x, b.y); c.stroke();
      c.restore();
    }

    // faíscas
    for (const s of sparks) {
      c.globalAlpha = Math.max(0, 1 - s.t / s.life);
      G.gfx.star(c, s.x - camX, s.y, 7, s.col, s.t * 6);
      c.globalAlpha = 1;
    }

    // seta a indicar o caminho
    if (phase === 'walk' && hero.x < PX - 400) {
      const bob = Math.sin(t * 4) * 6;
      c.save(); c.translate(W - 60 + bob, H * 0.3);
      c.fillStyle = 'rgba(255,209,102,.95)';
      c.beginPath(); c.moveTo(-26, -16); c.lineTo(6, -16); c.lineTo(6, -30); c.lineTo(30, 0);
      c.lineTo(6, 30); c.lineTo(6, 16); c.lineTo(-26, 16); c.closePath(); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 4; c.stroke();
      c.restore();
    }

    // HUD: corações (vidas), estrelas e fato
    for (let i = 0; i < 3; i++) {
      G.gfx.heart(c, 36 + i * 40, 46, 20, i < G.state.hearts ? '#ff5d8f' : 'rgba(255,255,255,.45)');
    }
    G.gfx.star(c, 36, 96, 16, '#ffd166', 0);
    G.gfx.label(c, '' + G.state.stars, 62, 97, 30, '#b56b00');
    if (G.state.suit) {
      G.gfx.rr(c, 24, 118, 26, 30, 10);
      c.fillStyle = '#ffb703'; c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke();
    }
  };

  S.debug = function () {
    return {
      x: Math.round(hero.x), alt: Math.round(hero.alt), grounded: hero.grounded,
      frozen: +hero.frozen.toFixed(2), inv: +hero.inv.toFixed(2), bike: hero.bike,
      hearts: G.state.hearts, phase: phase,
      zombies: zombies.filter(function (z) { return z.state === 'walk'; }).length
    };
  };

  G.scenes = G.scenes || {};
  G.scenes.jungle = S;
})();
