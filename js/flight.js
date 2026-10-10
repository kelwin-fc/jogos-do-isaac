/* Cena 1 — Voo em primeira pessoa dentro do cockpit. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};
  let W, H, cx, hy, FOV;
  let cam, bank, planes, bullets, lasers, pickups, chutes, parts, clouds, caixas, fantasmas;
  let spawnT, fireCd, hornCd, hurtFlash, eject, celebrate, speedMult;
  let cor, gelo, caixaT, fantasmaT, dicaT;

  /* Cores do jogo (pedido do Isaac): o laser só apanha o ladrão da MESMA cor que nós.
     Para trocar de cor, dispara nas caixas-presente que andam no céu. */
  const CORES = { amarelo: '#ffd166', azul: '#3aa8ff' };
  function outraCor(k) { return k === 'amarelo' ? 'azul' : 'amarelo'; }

  function rnd(a, b) { return a + Math.random() * (b - a); }

  S.enter = function () {
    cam = { x: 0, y: 0 }; bank = 0;
    planes = []; bullets = []; lasers = []; pickups = []; chutes = []; parts = [];
    caixas = []; fantasmas = [];
    clouds = [];
    for (let i = 0; i < 10; i++) clouds.push({ x: rnd(-900, 900), y: rnd(-420, -60), z: rnd(500, 2200), s: rnd(30, 70) });
    spawnT = 0.5; fireCd = 0; hornCd = 0; hurtFlash = 0; eject = -1; celebrate = -1;
    cor = 'amarelo'; gelo = 0; caixaT = 1.5; fantasmaT = rnd(9, 15); dicaT = 0;
    G.state.hearts = 3;
    G.state.caught = 0;
    if (G.state.aces == null) G.state.aces = 0;
    speedMult = Math.min(1 + (G.state.round - 1) * 0.12, 1.8);
    G.banner('Apanha os aviões ladrões! ⭐', 2600);
  };

  function need() { return 2 + G.state.round; }

  /* Esperteza dos ladrões: cresce a cada ladrão apanhado, até ao máximo. */
  function skill() { return Math.min(1, (G.state.aces || 0) / 12); }

  function spawn() {
    const thieves = planes.filter(p => p.type === 'thief').length;
    const friends = planes.filter(p => p.type === 'friend').length;
    let type;
    if (thieves < 2 && (friends >= 2 || Math.random() < 0.62)) type = 'thief';
    else if (friends < 2) type = 'friend';
    else return;
    const k = type === 'thief' ? skill() : 0;
    const corLadrao = Math.random() < 0.5 ? 'amarelo' : 'azul';
    planes.push({
      cor: type === 'thief' ? corLadrao : null,
      type: type, x: rnd(-380, 380), y: rnd(-200, 120), z: rnd(1700, 2100),
      // quanto mais espertos, mais longe param e mais depressa voltam a disparar
      // pedido do Isaac: com dois tiros caíam depressa demais — agora são 3 (4 no fim)
      hp: type === 'thief' ? 3 + Math.round(k) : 2,
      holdZ: rnd(380, 480) + k * 620, drift: rnd(0, TAU), shootT: rnd(2.5, 4) - k * 1.1,
      color: type === 'thief' ? CORES[corLadrao] : G.gfx.FRIEND_COLORS[(Math.random() * 5) | 0],
      hitT: 0, respondT: 0, hornCd: 0, escudoT: 0,
      dodgeCd: rnd(0.6, 1.4), dodgeT: 0, dvx: 0, dvy: 0
    });
  }

  function proj(x, y, z) {
    const sc = FOV / (z + 300);
    return { x: cx + (x - cam.x) * sc, y: hy + (y - cam.y) * sc, sc: sc };
  }

  function starHudPos() { return { x: 56, y: 96 }; }
  function heartHudPos() { return { x: 56, y: 46 }; }

  function burst(x, y, n, cols) {
    for (let i = 0; i < n; i++) {
      parts.push({
        x: x, y: y, vx: rnd(-160, 160), vy: rnd(-220, 60), rot: rnd(0, TAU),
        vr: rnd(-6, 6), life: rnd(0.6, 1.3), t: 0, col: cols[(Math.random() * cols.length) | 0]
      });
    }
  }

  S.update = function (dt, t) {
    W = G.W; H = G.H; cx = W / 2; hy = H * 0.42; FOV = Math.min(W, H) * 1.05;
    const inp = G.input;

    if (eject >= 0) { // sequência de ejeção
      eject += dt;
      G.shake = 0.3;
      if (eject > 0.8) G.setScene('parachute');
      return;
    }

    // pilotar (congelado pelo fantasma não se mexe nem se dispara)
    gelo = Math.max(0, gelo - dt);
    dicaT = Math.max(0, dicaT - dt);
    const ax = gelo > 0 ? { x: 0, y: 0 } : inp.axis();
    cam.x = Math.max(-360, Math.min(360, cam.x + ax.x * 340 * dt));
    cam.y = Math.max(-240, Math.min(160, cam.y + ax.y * 280 * dt));
    bank += ((-ax.x * 0.2) - bank) * Math.min(1, dt * 6);

    // spawns
    spawnT -= dt;
    if (spawnT <= 0 && planes.length < 4 && celebrate < 0) { spawn(); spawnT = rnd(1.6, 2.8); }

    // aviões
    for (let i = planes.length - 1; i >= 0; i--) {
      const p = planes[i];
      p.hitT = Math.max(0, p.hitT - dt);
      p.respondT = Math.max(0, p.respondT - dt);
      p.hornCd = Math.max(0, p.hornCd - dt);
      p.escudoT = Math.max(0, (p.escudoT || 0) - dt);
      if (p.type === 'thief') {
        if (p.z > p.holdZ) p.z -= 190 * speedMult * dt;
        else { // fica a pairar, a balançar devagar
          const k = skill();
          p.x += Math.sin(t * 0.7 + p.drift) * 40 * dt;
          p.y += Math.cos(t * 0.5 + p.drift) * 24 * dt;
          // evasão: os ladrões experientes fogem da mira a rir
          if (k > 0.05) {
            p.dodgeCd -= dt;
            if (p.dodgeT > 0) {
              p.dodgeT -= dt;
              p.x = Math.max(-520, Math.min(520, p.x + p.dvx * dt));
              p.y = Math.max(-260, Math.min(190, p.y + p.dvy * dt));
            } else if (S.target === p && p.dodgeCd <= 0) {
              p.dodgeCd = rnd(1.5, 2.5) - k * 0.9;
              p.dodgeT = 0.55;
              p.dvx = (p.x >= cam.x ? 1 : -1) * (140 + k * 250);
              p.dvy = rnd(-70, 70) * (0.5 + k);
              if (Math.random() < 0.5) G.audio.sfx('giggle');
            }
          }
          p.shootT -= dt;
          if (p.shootT <= 0 && celebrate < 0) {
            p.shootT = rnd(3.2, 5) - k * 1.8;
            const sp = 70 - k * 34; // e apontam um bocadinho melhor
            bullets.push({ bx: p.x, by: p.y, z: p.z, z0: p.z, tx: cam.x + rnd(-sp, sp), ty: cam.y + rnd(-50, 50) });
          }
        }
      } else {
        p.z -= 150 * dt;
        p.x += Math.sin(t * 0.6 + p.drift) * 30 * dt;
        if (p.z < 120) planes.splice(i, 1); // passa por nós a cumprimentar
      }
    }

    // caixas-presente: dispara nelas para trocares de cor
    caixaT -= dt;
    if (caixaT <= 0 && caixas.length < 2 && celebrate < 0) {
      caixaT = rnd(3.5, 5.5);
      // se houver um ladrão de outra cor, a caixa que aparece é da cor dele (nunca ficamos presos)
      const precisa = planes.find(function (p) { return p.type === 'thief' && p.cor !== cor; });
      const cx2 = precisa ? precisa.cor : (Math.random() < 0.5 ? 'amarelo' : 'azul');
      caixas.push({ type: 'caixa', cor: cx2, x: rnd(-420, 420), y: rnd(-220, 90), z: rnd(1500, 1900), t: rnd(0, 6) });
    }
    for (let i = caixas.length - 1; i >= 0; i--) {
      const k = caixas[i];
      k.t += dt;
      k.z -= 150 * speedMult * dt;
      k.y += Math.sin(t * 0.9 + k.t) * 16 * dt;
      if (k.z < 130) caixas.splice(i, 1);
    }

    // fantasmas: se chegam ao pé de nós, congelam-nos (o laser e a buzina afugentam-nos)
    fantasmaT -= dt;
    if (fantasmaT <= 0 && fantasmas.length < 1 && celebrate < 0 && G.state.caught > 0) {
      fantasmaT = rnd(11, 17);
      fantasmas.push({ type: 'fantasma', x: rnd(-380, 380), y: rnd(-200, 60), z: 1900, t: rnd(0, 6), fugir: 0 });
      G.audio.sfx('brrr');
    }
    for (let i = fantasmas.length - 1; i >= 0; i--) {
      const f = fantasmas[i];
      f.t += dt;
      if (f.fugir > 0) {                       // a rir e a ir-se embora
        f.fugir -= dt; f.z += 700 * dt; f.y -= 120 * dt;
        if (f.fugir <= 0) fantasmas.splice(i, 1);
        continue;
      }
      f.z -= 210 * speedMult * dt;
      f.x += (cam.x - f.x) * Math.min(1, dt * 0.5);
      f.y += (cam.y - f.y) * Math.min(1, dt * 0.5);
      if (f.z < 150) {
        fantasmas.splice(i, 1);
        if (gelo <= 0) {
          gelo = 1.6; G.shake = 0.45; G.audio.sfx('brrr');
          G.banner('Buuu! 👻 Ficaste congelado! 🧊', 2200);
        }
      }
    }

    // bolhas dos ladrões
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.z -= 460 * dt;
      if (b.z <= 80) {
        bullets.splice(i, 1);
        if (Math.abs(b.tx - cam.x) < 115 && Math.abs(b.ty - cam.y) < 85) {
          G.state.hearts--; hurtFlash = 0.5; G.shake = 0.5; G.audio.sfx('ouch');
          if (G.state.hearts <= 0) {
            eject = 0; G.audio.sfx('whee'); G.banner('Uiii! Paraquedas! 🪂', 2000);
            G.state.aces = Math.max(0, (G.state.aces || 0) - 3); // ficam um bocadinho mais fáceis
          }
        }
      }
    }

    // mira assistida: alvo mais próximo do retículo (aviões, caixas e fantasmas)
    S.target = null;
    let best = 170;
    for (const p of planes.concat(caixas, fantasmas)) {
      if (p.fugir > 0) continue;
      const s = proj(p.x, p.y, p.z);
      const d = Math.hypot(s.x - cx, s.y - (hy + 10));
      if (d < best) { best = d; S.target = p; }
    }

    // disparar laser (congelado não dá)
    fireCd -= dt;
    if ((inp.justPressed('fire') || inp.isHeld('fire')) && fireCd <= 0 && gelo <= 0) {
      fireCd = 0.45; G.audio.sfx('pew');
      const tgt = S.target;
      const s = tgt ? proj(tgt.x, tgt.y, tgt.z) : { x: cx, y: hy + 10 };
      lasers.push({ tx: s.x, ty: s.y, t: 0, target: tgt });
    }
    for (let i = lasers.length - 1; i >= 0; i--) {
      const L = lasers[i];
      L.t += dt;
      if (L.t > 0.14 && !L.done) {
        L.done = true;
        const p = L.target;
        if (p && p.type === 'caixa' && caixas.indexOf(p) >= 0) {
          // caixa-presente: abre-se e ficamos da cor dela
          const s = proj(p.x, p.y, p.z);
          caixas.splice(caixas.indexOf(p), 1);
          cor = p.cor;
          G.addStars(2); G.audio.sfx('suit'); G.audio.sfx('star');
          burst(s.x, s.y, 20, [CORES[p.cor], '#fff']);
          G.banner(p.cor === 'amarelo' ? 'Agora és AMARELO! 💛' : 'Agora és AZUL! 💙', 2000);
        } else if (p && p.type === 'fantasma' && fantasmas.indexOf(p) >= 0) {
          const s = proj(p.x, p.y, p.z);
          p.fugir = 0.9; G.audio.sfx('giggle');
          G.addStars(1);
          burst(s.x, s.y, 10, ['#dfe3ee', '#fff']);
        } else if (p && planes.indexOf(p) >= 0) {
          const s = proj(p.x, p.y, p.z);
          if (p.type === 'thief' && p.cor !== cor) {
            // cor errada: o laser faz "boing" no escudo. Tens de trocar de cor primeiro.
            p.escudoT = 0.35; G.audio.sfx('boing');
            burst(s.x, s.y, 6, [CORES[p.cor], '#fff']);
            if (dicaT <= 0) {
              dicaT = 4;
              G.banner('Cor errada! Dispara na caixa ' + p.cor + ' 🎁', 2400);
            }
          } else if (p.type === 'thief') {
            p.hp--; p.hitT = 0.4; G.audio.sfx('pop');
            burst(s.x, s.y, 8, ['#ffd166', '#fff']);
            if (p.hp <= 0) { // libertado! larga as estrelas e desce de paraquedas
              planes.splice(planes.indexOf(p), 1);
              chutes.push({ x: s.x, y: s.y, sc: Math.max(0.7, s.sc), t: 0, thief: true });
              for (let k = 0; k < 4; k++) pickups.push({ x: s.x + rnd(-30, 30), y: s.y + rnd(-30, 30), t: 0, kind: 'star', delay: k * 0.12 });
              burst(s.x, s.y, 16, ['#ffd166', '#ffca3a', '#fff']);
              G.state.caught++; G.audio.sfx('star');
              // cada ladrão apanhado deixa os próximos mais espertos
              G.state.aces = (G.state.aces || 0) + 1;
              if (G.state.aces % 3 === 0 && skill() < 1) G.banner('Cuidado! Estão mais espertos! 💨', 2400);
              if (G.state.caught >= need() && celebrate < 0) {
                celebrate = 0; G.audio.sfx('tada');
                G.banner('Missão Cumprida! 🎉', 2600);
                burst(cx, H * 0.3, 70, G.gfx.FRIEND_COLORS);
              }
            }
          } else { // amigo: faz um looping a rir, sem mal nenhum
            p.respondT = 1.2; G.audio.sfx('giggle');
          }
        }
      }
      if (L.t > 0.32) lasers.splice(i, 1);
    }

    // buzina
    hornCd -= dt;
    if ((inp.justPressed('horn')) && hornCd <= 0) {
      hornCd = 1.0; G.audio.sfx('horn');
      for (const p of planes) {
        if (p.type === 'friend' && p.z < 2100 && p.hornCd <= 0) {
          p.hornCd = 6; p.respondT = 1.4;
          const s = proj(p.x, p.y, p.z);
          pickups.push({ x: s.x, y: s.y, t: 0, kind: 'heart', delay: 0.35 });
          pickups.push({ x: s.x + 20, y: s.y - 10, t: 0, kind: 'star', delay: 0.55 });
        }
      }
      for (const f of fantasmas) {          // a buzina também afugenta os fantasmas
        if (f.fugir <= 0) { f.fugir = 0.9; G.addStars(1); G.audio.sfx('giggle'); }
      }
    }

    // recolhas a voar para o painel
    for (let i = pickups.length - 1; i >= 0; i--) {
      const k = pickups[i];
      if (k.delay > 0) { k.delay -= dt; continue; }
      k.t += dt * 1.6;
      if (k.t >= 1) {
        pickups.splice(i, 1);
        if (k.kind === 'star') { G.addStars(1); G.audio.sfx('star'); }
        else { if (G.state.hearts < 3) { G.state.hearts++; G.audio.sfx('heart'); } else { G.addStars(2); G.audio.sfx('star'); } }
      }
    }

    // paraquedistas e partículas
    for (let i = chutes.length - 1; i >= 0; i--) {
      const ch = chutes[i];
      ch.t += dt; ch.y += 46 * dt; ch.x += Math.sin(ch.t * 1.5) * 20 * dt;
      if (ch.y > H + 160) chutes.splice(i, 1);
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 320 * dt; p.rot += p.vr * dt;
      if (p.t > p.life) parts.splice(i, 1);
    }

    hurtFlash = Math.max(0, hurtFlash - dt);
    if (celebrate >= 0) {
      celebrate += dt;
      if (celebrate > 2.6) { celebrate = -1; G.state.round++; G.state.caught = 0; speedMult = Math.min(1 + (G.state.round - 1) * 0.12, 1.8); }
    }
    if (G.input.justPressed('debug9')) { eject = 0; G.audio.sfx('whee'); }
  };

  S.draw = function (c, t) {
    W = G.W; H = G.H; cx = W / 2; hy = H * 0.42; FOV = Math.min(W, H) * 1.05;
    // céu e chão distante
    let g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#5bb8ff'); g.addColorStop(0.42, '#bfe7ff'); g.addColorStop(0.55, '#cdeec6'); g.addColorStop(1, '#8fd694');
    c.fillStyle = g; c.fillRect(0, 0, W, H);

    c.save();
    c.translate(cx, hy); c.rotate(bank); c.translate(-cx, -hy);

    G.gfx.sun(c, W * 0.85, H * 0.13, Math.min(W, H) * 0.07, t);
    if (celebrate >= 0) { // arco-íris de festa
      const cols = ['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#1982c4'];
      for (let i = 0; i < 5; i++) {
        c.strokeStyle = cols[i]; c.globalAlpha = 0.55; c.lineWidth = 12;
        c.beginPath(); c.arc(cx, hy + 60, H * 0.42 - i * 12, Math.PI, 0); c.stroke();
      }
      c.globalAlpha = 1;
    }

    // nuvens (parallax por profundidade)
    for (const cl of clouds) {
      cl.x += 8 * (1000 / (cl.z + 300)) * 0.016;
      if (cl.x > 1000) cl.x = -1000;
      const s = proj(cl.x, cl.y, cl.z);
      G.gfx.cloud(c, s.x, s.y, cl.s * s.sc * 1.4, 0.85);
    }

    // aviões (longe primeiro)
    const sorted = planes.slice().sort((a, b) => b.z - a.z);
    for (const p of sorted) {
      const s = proj(p.x, p.y, p.z);
      // auréola da cor do ladrão: é por ela que se sabe se o nosso laser lhe pega
      if (p.type === 'thief') {
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = (p.cor === cor ? 0.55 : 0.32) + Math.sin(t * 4 + p.drift) * 0.08;
        const r = 90 * s.sc * 1.6;
        const g = c.createRadialGradient(s.x, s.y, r * 0.15, s.x, s.y, r);
        g.addColorStop(0, CORES[p.cor]); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g; c.beginPath(); c.arc(s.x, s.y, r, 0, TAU); c.fill();
        c.restore();
        if (p.escudoT > 0) {          // "boing" no escudo quando a cor está errada
          c.save(); c.globalAlpha = p.escudoT / 0.35;
          c.strokeStyle = CORES[p.cor]; c.lineWidth = 7;
          c.beginPath(); c.arc(s.x, s.y, 60 * s.sc + 20, 0, TAU); c.stroke();
          c.restore();
        }
      }
      c.save(); c.translate(s.x, s.y);
      let rot = Math.sin(t * 2 + p.drift) * 0.06;
      if (p.respondT > 0) rot += Math.sin(t * 18) * 0.5; // abanar asas / looping
      if (p.hitT > 0) rot += Math.sin(t * 30) * 0.3;
      if (p.dodgeT > 0) rot += Math.max(-0.45, Math.min(0.45, p.dvx / 700)); // inclina no desvio
      c.rotate(rot);
      c.scale(s.sc * 1.6, s.sc * 1.6);
      G.gfx.planeFront(c, t + p.drift, { thief: p.type === 'thief', color: p.color });
      c.restore();
      if (p.dodgeT > 0) { // risquinhas de vento atrás de quem se desvia
        const dir = p.dvx >= 0 ? -1 : 1;
        c.save(); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 3; c.lineCap = 'round';
        for (let k = 0; k < 3; k++) {
          const yy = s.y - 16 * s.sc * 1.6 + k * 16 * s.sc * 1.6;
          const x0 = s.x + dir * (54 * s.sc * 1.6 + 8);
          c.beginPath(); c.moveTo(x0, yy); c.lineTo(x0 + dir * (16 + k * 6), yy); c.stroke();
        }
        c.restore();
      }
      if (p.respondT > 0 && p.type === 'friend') G.gfx.heart(c, s.x, s.y - 70 * s.sc, 14, '#ff5d8f');
      // quantos tiros ainda faltam a este ladrão (bolinhas por cima)
      if (p.type === 'thief' && p.hp > 0 && s.sc > 0.12) {
        for (let k2 = 0; k2 < p.hp; k2++) {
          c.fillStyle = CORES[p.cor];
          c.beginPath();
          c.arc(s.x - (p.hp - 1) * 7 + k2 * 14, s.y - 56 * s.sc * 1.6 - 10, 5, 0, TAU);
          c.fill();
          c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2; c.stroke();
        }
      }
    }

    // bolhas cor-de-rosa
    for (const b of bullets) {
      const f = 1 - (b.z - 80) / (b.z0 - 80);
      const wx = b.bx + (b.tx - b.bx) * f, wy = b.by + (b.ty - b.by) * f;
      const s = proj(wx, wy, b.z);
      c.fillStyle = 'rgba(255,120,190,.75)';
      c.beginPath(); c.arc(s.x, s.y, 26 * s.sc, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,.6)';
      c.beginPath(); c.arc(s.x - 8 * s.sc, s.y - 8 * s.sc, 8 * s.sc, 0, TAU); c.fill();
    }
    c.restore();

    // lasers do jogador (dois feixes verdes a convergir)
    for (const L of lasers) {
      const a = Math.min(1, L.t / 0.14);
      c.save(); c.globalAlpha = 1 - Math.max(0, (L.t - 0.14) / 0.18);
      c.strokeStyle = '#3dff8f'; c.lineWidth = 7; c.lineCap = 'round';
      const y0 = H - 10;
      [[W * 0.16, y0], [W * 0.84, y0]].forEach(o => {
        c.beginPath(); c.moveTo(o[0], o[1]);
        c.lineTo(o[0] + (L.tx - o[0]) * a, o[1] + (L.ty - o[1]) * a);
        c.stroke();
      });
      if (L.t > 0.1) G.gfx.star(c, L.tx, L.ty, 12 * (1 - a * 0.3), '#b9ffd9', t * 3);
      c.restore();
    }

    // caixas-presente e fantasmas (dos mais longe para os mais perto)
    for (const k of caixas.slice().sort(function (a, b) { return b.z - a.z; })) {
      const s = proj(k.x, k.y, k.z);
      const sc = Math.min(s.sc * 2.2, 1.5);   // sem o teto, ao passar por nós tapava o céu
      c.save(); c.translate(s.x, s.y); c.scale(sc, sc);
      c.rotate(Math.sin(t * 1.6 + k.t) * 0.12);
      caixaArt(c, k.cor, t + k.t);
      c.restore();
    }
    for (const f of fantasmas) {
      const s = proj(f.x, f.y, f.z);
      c.save(); c.translate(s.x, s.y); c.scale(s.sc * 2.4, s.sc * 2.4);
      c.globalAlpha = f.fugir > 0 ? Math.max(0, f.fugir) : 0.9;
      fantasmaArt(c, t + f.t);
      c.restore();
    }

    // retículo com dica: cor do ladrão (laser), rosa = amigo (buzina), caixa = trocar de cor
    const tg = S.target;
    if (tg) {
      const s = proj(tg.x, tg.y, tg.z);
      c.save(); c.lineWidth = 5;
      if (tg.type === 'caixa') c.strokeStyle = CORES[tg.cor];
      else if (tg.type === 'fantasma') c.strokeStyle = 'rgba(223,227,238,.95)';
      else c.strokeStyle = tg.type === 'thief' ? CORES[tg.cor] : 'rgba(255,93,143,.9)';
      c.beginPath(); c.arc(s.x, s.y, 60 * s.sc + 26 + Math.sin(t * 6) * 4, 0, TAU); c.stroke();
      if (tg.type === 'friend') G.gfx.heart(c, s.x, s.y - 60 * s.sc - 44, 12, '#ff5d8f');
      else if (tg.type === 'caixa') G.gfx.star(c, s.x, s.y - 60 * s.sc - 44, 10, CORES[tg.cor], t);
      else if (tg.type === 'thief' && tg.cor !== cor) {
        // aviso grande: este é de outra cor, primeiro tens de trocar
        G.gfx.label(c, 'TROCA DE COR!', s.x, s.y - 60 * s.sc - 46, 22, CORES[tg.cor], 'center');
      } else G.gfx.star(c, s.x, s.y - 60 * s.sc - 44, 10, '#ffd166', t);
      c.restore();
    } else {
      c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 4;
      c.beginPath(); c.arc(cx, hy + 10, 26 + Math.sin(t * 4) * 3, 0, TAU); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.75)';
      c.beginPath(); c.arc(cx, hy + 10, 4, 0, TAU); c.fill();
    }

    // paraquedistas felizes
    for (const ch of chutes) {
      c.save(); c.translate(ch.x, ch.y); c.scale(ch.sc, ch.sc);
      G.gfx.parachute(c, ch.t, { thief: ch.thief });
      c.restore();
    }

    // cockpit
    drawCockpit(c, t);

    // recolhas a voar para o painel
    for (const k of pickups) {
      if (k.delay > 0) continue;
      const dest = k.kind === 'star' ? starHudPos() : heartHudPos();
      const e = 1 - Math.pow(1 - Math.min(1, k.t), 2);
      const x = k.x + (dest.x - k.x) * e, y = k.y + (dest.y - k.y) * e;
      if (k.kind === 'star') G.gfx.star(c, x, y, 14, '#ffd166', k.t * 6);
      else G.gfx.heart(c, x, y, 16, '#ff5d8f');
    }

    // confetes
    for (const p of parts) {
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
      c.globalAlpha = Math.max(0, 1 - p.t / p.life);
      c.fillStyle = p.col; c.fillRect(-5, -3, 10, 6);
      c.restore();
    }

    drawHud(c, t);

    if (gelo > 0) {                 // congelados pelo fantasma: gelo por cima do vidro
      c.save();
      c.fillStyle = 'rgba(140,200,255,.32)'; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 6; c.lineCap = 'round';
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * TAU, r0 = Math.min(W, H) * 0.5;
        c.beginPath();
        c.moveTo(cx + Math.cos(a) * r0, hy + Math.sin(a) * r0);
        c.lineTo(cx + Math.cos(a) * (r0 * 0.62), hy + Math.sin(a) * (r0 * 0.62));
        c.stroke();
      }
      G.gfx.label(c, 'Brrr!', cx, H * 0.22, 40, '#2b6cb0', 'center');
      c.restore();
    }
    if (hurtFlash > 0) {
      c.fillStyle = 'rgba(255,90,90,' + (hurtFlash * 0.35) + ')';
      c.fillRect(0, 0, W, H);
    }
    if (eject >= 0) {
      c.fillStyle = 'rgba(255,255,255,' + Math.min(1, eject * 1.6) + ')';
      c.fillRect(0, 0, W, H);
    }
  };

  /* caixa-presente da cor (centrada na origem, ~40 de lado) */
  function caixaArt(c, k, t) {
    const cor = CORES[k];
    c.save();
    c.fillStyle = cor;
    G.gfx.rr(c, -22, -20, 44, 40, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.85)';
    G.gfx.rr(c, -5, -20, 10, 40, 3); c.fill();
    G.gfx.rr(c, -22, -6, 44, 10, 3); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.arc(-7, -26, 7, 0.3, Math.PI * 1.3); c.stroke();
    c.beginPath(); c.arc(7, -26, 7, Math.PI * 1.7, Math.PI * 0.8); c.stroke();
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 + Math.sin(t * 5) * 0.15;
    const g = c.createRadialGradient(0, 0, 4, 0, 0, 52);
    g.addColorStop(0, cor); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, 52, 0, TAU); c.fill();
    c.restore();
    c.restore();
  }

  /* fantasma branco (centrado na origem) */
  function fantasmaArt(c, t) {
    c.save();
    c.fillStyle = 'rgba(240,244,255,.92)';
    c.beginPath();
    c.arc(0, -6, 22, Math.PI, 0);
    c.lineTo(22, 16);
    for (let k = 0; k < 4; k++) {
      const x0 = 22 - k * 11, x1 = 22 - (k + 1) * 11;
      c.quadraticCurveTo((x0 + x1) / 2, 16 + (k % 2 ? 12 : -8) + Math.sin(t * 5 + k) * 3, x1, 16);
    }
    c.lineTo(-22, -6);
    c.closePath(); c.fill();
    c.fillStyle = '#3a2560';
    c.beginPath(); c.ellipse(-8, -8, 4.5, 6, 0, 0, TAU); c.ellipse(8, -8, 4.5, 6, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(0, 5, 6, 7, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(140,200,255,.6)';
    c.beginPath(); c.arc(-16, 2, 4, 0, TAU); c.arc(16, 2, 4, 0, TAU); c.fill();
    c.restore();
  }

  function drawCockpit(c, t) {
    const ph = Math.max(90, H * 0.16);
    // painel
    G.gfx.rr(c, -30, H - ph, W + 60, ph + 40, 34);
    c.fillStyle = '#5e60ce'; c.fill();
    G.gfx.rr(c, -30, H - ph, W + 60, 18, 12);
    c.fillStyle = '#7b7ff2'; c.fill();
    // pilares laterais do para-brisas
    c.fillStyle = '#5e60ce';
    c.beginPath(); c.moveTo(0, 0); c.lineTo(44, 0); c.lineTo(10, H - ph + 10); c.lineTo(0, H - ph + 10); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(W, 0); c.lineTo(W - 44, 0); c.lineTo(W - 10, H - ph + 10); c.lineTo(W, H - ph + 10); c.closePath(); c.fill();
    // radar redondo
    const rx = cx, ry = H - ph / 2 + 8, R = Math.min(ph * 0.62, 74);
    c.beginPath(); c.arc(rx, ry, R, 0, TAU); c.fillStyle = '#b8f2e6'; c.fill();
    c.lineWidth = 6; c.strokeStyle = '#48bfe3'; c.stroke();
    c.save(); c.beginPath(); c.arc(rx, ry, R, 0, TAU); c.clip();
    c.strokeStyle = 'rgba(72,191,227,.5)'; c.lineWidth = 2;
    c.beginPath(); c.arc(rx, ry, R * 0.55, 0, TAU); c.stroke();
    const sweep = t * 1.5;
    c.strokeStyle = 'rgba(72,191,227,.8)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + Math.cos(sweep) * R, ry + Math.sin(sweep) * R); c.stroke();
    for (const p of planes) {
      const bx = rx + Math.max(-1, Math.min(1, (p.x - cam.x) / 600)) * R * 0.75;
      const by = ry - Math.max(0, Math.min(1, p.z / 2300)) * R * 0.8 + R * 0.35;
      c.fillStyle = p.type === 'thief' ? '#2b2d42' : '#38b000';
      c.beginPath(); c.arc(bx, by, 6, 0, TAU); c.fill();
    }
    c.restore();
    // manípulo que roda com a inclinação
    const wy = H - ph / 2 + 8;
    [[cx - R - 70], [cx + R + 70]].forEach(o => {
      c.save(); c.translate(o[0], wy); c.rotate(bank * 2);
      c.strokeStyle = '#ffd166'; c.lineWidth = 10; c.lineCap = 'round';
      c.beginPath(); c.arc(0, 0, 26, 0, TAU); c.stroke();
      c.beginPath(); c.moveTo(-26, 0); c.lineTo(26, 0); c.stroke();
      c.restore();
    });
  }

  function drawHud(c, t) {
    // corações
    for (let i = 0; i < 3; i++) {
      G.gfx.heart(c, 36 + i * 40, 46, 20, i < G.state.hearts ? '#ff5d8f' : 'rgba(255,255,255,.45)');
    }
    // estrelas
    G.gfx.star(c, 36, 96, 16, '#ffd166', 0);
    G.gfx.label(c, '' + G.state.stars, 62, 97, 30, '#b56b00');
    // progresso da ronda: estrelinhas dos ladrões apanhados
    for (let i = 0; i < need(); i++) {
      const done = i < G.state.caught;
      G.gfx.star(c, 30 + i * 30, 140, 11, done ? '#8ac926' : 'rgba(255,255,255,.5)', 0);
    }
    // esperteza dos ladrões: aviãozinho bandido + número do nível
    const lvl = Math.min(5, 1 + Math.floor((G.state.aces || 0) / 3)); // 5 = já estão no máximo
    c.save(); c.translate(36, 182); c.scale(0.32, 0.32);
    G.gfx.planeFront(c, t, { thief: true, prop: false });
    c.restore();
    G.gfx.label(c, '' + lvl, 62, 183, 26, '#4a4e69');
    // a NOSSA cor: só se apanham os ladrões desta cor
    const px = W - 84, py = 52;
    G.gfx.rr(c, px - 34, py - 30, 108, 60, 16);
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke();
    c.save(); c.translate(px + 2, py + 2); c.scale(0.34, 0.34);
    G.gfx.planeFront(c, t, { color: CORES[cor], prop: false });
    c.restore();
    G.gfx.label(c, cor === 'amarelo' ? '💛' : '💙', px + 48, py + 2, 24, '#fff', 'center');
  }

  S.debug = function () {
    const th = planes.filter(function (p) { return p.type === 'thief'; });
    return {
      aces: G.state.aces || 0, skill: +skill().toFixed(2), caught: G.state.caught,
      round: G.state.round, hearts: G.state.hearts, eject: eject >= 0,
      cam: { x: Math.round(cam.x), y: Math.round(cam.y) },
      thieves: th.map(function (p) {
        return {
          x: Math.round(p.x), y: Math.round(p.y), z: Math.round(p.z), holdZ: Math.round(p.holdZ),
          shootT: +p.shootT.toFixed(2), dodging: p.dodgeT > 0
        };
      }),
      bullets: bullets.length,
      target: S.target ? { type: S.target.type, z: Math.round(S.target.z) } : null
    };
  };

  G.scenes = G.scenes || {};
  G.scenes.flight = S;
})();
