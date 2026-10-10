/* Cena 5 — A Barbie das Estrelas (ditada pelo Isaac, jogo para a mãe).
   Saltar de telhado em telhado (há casas juntas e casas separadas), apanhar estrelas,
   fugir dos ladrões que roubam estrelas, "acolher" os 4 carrinhos diferentes para ganhar
   o PUNHO DE FOGO (muito rápido!) e, quando um leão nos ataca, ficamos SUPER PODEROSAS.
   Nunca acaba e ninguém se magoa: cair na rua dá um salto no toldo, os ladrões devolvem
   tudo a rir e os leões viram amigos. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  const SLOT = 470;                       // distância de casa para casa
  const RUN = 320, JUMPV = 780, GRAV = 1550;
  const FOGO_T = 14, SUPER_T = 9, TURBO_T = 4;
  const CARCOL = ['#ff4fa3', '#3aa8ff', '#ffd166', '#7ae582'];
  const CARNAME = ['rosa', 'azul', 'amarelo', 'verde'];
  const HOUSECOL = ['#ffd6e8', '#d8e2ff', '#ffe9c7', '#d9f5e3', '#f3dcff', '#ffe0d1'];
  const ROOFCOL = ['#e05780', '#4b6bbd', '#e08c2b', '#3f9e6b', '#8a5cc4', '#c9603f'];

  let hero, chunks, sparks, hearts, camX, camY, fireCd, punchT, hint;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function h01(n) { const s = Math.sin(n * 127.1) * 43758.5; return s - Math.floor(s); }

  /* Em ecrãs baixinhos (telemóvel deitado) o mundo é desenhado mais pequeno, senão
     um salto tira os telhados do ecrã. A física fica igual — só muda o zoom. */
  function vscale() { return Math.min(1, G.H / 620); }
  function vw() { return G.W / vscale(); }
  function vh() { return G.H / vscale(); }

  /* ---------- cidade infinita, gerada por fórmula (não guarda nada) ---------- */
  function rawGlued(i) { return h01(i * 7.3 + 1.7) < 0.34; }
  // "juntas" nunca em cadeia: no máximo duas casas coladas seguidas
  function glued(i) { return i > 0 && rawGlued(i) && !rawGlued(i - 1); }
  function baseAlt(i) {
    if (i <= 0) return 170;
    return Math.round(150 + 58 * (0.5 + 0.5 * Math.sin(i * 0.7)) + 52 * (0.5 + 0.5 * Math.sin(i * 1.9 + 1.3)));
  }
  function roofAlt(i) { return glued(i - 1) ? baseAlt(i - 1) : baseAlt(i); }
  function houseW(i) { return glued(i) ? SLOT : 250 + Math.floor(h01(i * 3.1) * 4) * 40; }
  function houseX(i) { return i * SLOT; }

  // altura do "chão" para quem anda nos telhados (nos vãos faz um arco, como um saltinho)
  function groundAlt(x) {
    const i = Math.floor(x / SLOT);
    const w = houseW(i);
    if (x - houseX(i) <= w) return roofAlt(i);
    const k = (x - houseX(i) - w) / (SLOT - w);
    return roofAlt(i) + (roofAlt(i + 1) - roofAlt(i)) * k - Math.sin(k * Math.PI) * 26;
  }

  function build(i) {
    const x0 = houseX(i), w = houseW(i), alt = roofAlt(i);
    const ch = { i: i, stars: [], car: null, thief: null, lion: null };
    for (let k = 0; k < 3; k++) {
      ch.stars.push({ x: x0 + w * (0.2 + k * 0.3), alt: alt + 56 + h01(i * 9 + k) * 44, got: false });
    }
    if (!glued(i)) { // uma estrela no meio do vão, para convidar ao salto
      ch.stars.push({ x: x0 + w + (SLOT - w) * 0.5, alt: alt + 112, got: false });
    }
    if (i >= 2 && (i - 2) % 4 === 0) {
      ch.car = { x: x0 + w * 0.6, col: Math.floor((i - 2) / 4) % 4, got: false, t: 0 };
    } else if (i > 2 && h01(i * 5.7 + 2.3) < 0.36) {
      ch.thief = { x: x0 + w * 0.5, dir: -1, state: 'walk', t: h01(i) * 6, cd: 0, bag: 0, flee: 0, home: i };
    } else if (i > 3 && h01(i * 11.3 + 5.1) < 0.34) {
      ch.lion = { x: x0 + w * 0.5, dir: -1, state: 'wild', t: h01(i + 2) * 6, cd: 0, roar: 0, home: i };
    }
    return ch;
  }

  function chunk(i) {
    let ch = chunks.get(i);
    if (!ch) { ch = build(i); chunks.set(i, ch); }
    return ch;
  }

  /* ---------- ciclo da cena ---------- */
  S.enter = function () {
    hero = {
      x: 120, alt: roofAlt(0), vy: 0, dir: 1, walk: 0, grounded: true,
      fogo: 0, superT: 0, turbo: 0, carros: [false, false, false, false],
      street: false, twirl: 0
    };
    chunks = new Map(); sparks = []; hearts = [];
    camX = 0; camY = 0; fireCd = 0; punchT = 0; hint = 4;
    G.banner('Salta de telhado em telhado! ⭐👑', 3200);
  };

  function spark(x, alt, n, col) {
    for (let i = 0; i < n; i++) {
      sparks.push({ x: x, alt: alt, vx: rnd(-130, 130), vy: rnd(40, 220), t: 0, life: rnd(0.4, 0.9), col: col });
    }
  }
  function heartPop(x, alt, n) {
    for (let i = 0; i < n; i++) hearts.push({ x: x + rnd(-22, 22), alt: alt, t: 0, life: rnd(0.8, 1.4) });
  }

  // d = hero.x - alvo.x  →  o alvo está à frente do lado para onde ela olha?
  function ahead(d) { return hero.dir > 0 ? d < 0 : d > 0; }

  function speed() {
    let k = 1;
    if (hero.fogo > 0) k *= 1.9;
    else if (hero.turbo > 0) k *= 1.35;
    if (hero.superT > 0) k *= 1.25;
    return RUN * Math.min(k, 2.2);
  }

  // ladrão ou leão que fica nosso amigo (nunca se magoam — devolvem tudo e festejam)
  function amigar(o, tipo, bonus) {
    o.state = 'friend'; o.t = 0;
    const alt = groundAlt(o.x);
    const devolve = tipo === 'thief' ? o.bag : 0;
    o.bag = 0;
    G.addStars(bonus + devolve);
    spark(o.x, alt + 50, 16, '#ffd166');
    heartPop(o.x, alt + 70, 4);
    G.audio.sfx('tada'); G.audio.sfx('giggle');
    if (tipo === 'thief') {
      G.banner(devolve ? 'O ladrão devolveu tudo! 🌟 Agora é amigo 😄' : 'Ladrão apanhado! Agora é amigo 😄', 2200);
    } else {
      G.banner('O leão ficou teu amigo! 🦁💛', 2200);
    }
  }

  S.update = function (dt, t) {
    const W = vw(), inp = G.input;

    hero.fogo = Math.max(0, hero.fogo - dt);
    hero.superT = Math.max(0, hero.superT - dt);
    hero.turbo = Math.max(0, hero.turbo - dt);
    hero.twirl = Math.max(0, hero.twirl - dt);
    punchT = Math.max(0, punchT - dt);
    hint = Math.max(0, hint - dt);
    if (hero.fogo <= 0 && hero.carros[0] && hero.carros[1] && hero.carros[2] && hero.carros[3]) {
      hero.carros = [false, false, false, false];
      G.banner('Apanha outra vez os 4 carrinhos! 🚗🚙', 2600);
    }

    // andar
    const ax = inp.axis();
    let mv = 0;
    if (inp.isHeld('left')) mv -= 1;
    if (inp.isHeld('right')) mv += 1;
    if (mv === 0) mv = Math.abs(ax.x) > 0.25 ? Math.sign(ax.x) : 0;
    if (mv !== 0) {
      hero.x = Math.max(60, hero.x + mv * speed() * dt);
      hero.dir = mv; hero.walk += dt * (8 + speed() / 60);
      if (hero.fogo > 0 && Math.random() < dt * 26) spark(hero.x - hero.dir * 26, hero.alt + 30, 1, '#ff8c1a');
    }
    camX = Math.max(-30, hero.x - W * 0.38);

    // saltar
    const jumpK = hero.superT > 0 ? 1.2 : (hero.fogo > 0 ? 1.08 : 1);
    if ((inp.justPressed('jump') || inp.justPressed('up')) && hero.grounded) {
      hero.vy = JUMPV * jumpK; hero.grounded = false; G.audio.sfx('hop');
    }

    // física: telhados são plataformas (só se apanham a cair) e a rua tem toldos que atiram para cima
    const prevAlt = hero.alt;
    hero.vy -= GRAV * dt;
    hero.alt += hero.vy * dt;
    hero.grounded = false; hero.street = false;
    if (hero.vy <= 0) {
      const i = Math.floor(hero.x / SLOT);
      for (let k = i - 1; k <= i + 1; k++) {
        const x0 = houseX(k), w = houseW(k), alt = roofAlt(k);
        if (hero.x >= x0 - 12 && hero.x <= x0 + w + 12 && prevAlt >= alt - 4 && hero.alt <= alt) {
          hero.alt = alt; hero.vy = 0; hero.grounded = true; break;
        }
      }
      if (!hero.grounded && hero.alt <= 0) { // toldo da loja: boing de volta aos telhados
        hero.alt = 0; hero.vy = 1010; hero.street = true;
        G.audio.sfx('boing'); spark(hero.x, 20, 10, '#ff4fa3');
        if (hint <= 0) { G.banner('Boing! O toldo atira-te para cima 🎪', 1600); hint = 6; }
      }
    }

    // pirueta / punho de fogo
    fireCd -= dt;
    if ((inp.justPressed('fire') || inp.isHeld('fire')) && fireCd <= 0) {
      if (hero.fogo > 0) {
        fireCd = 0.45; punchT = 0.3;
        G.audio.sfx('pew'); G.audio.sfx('whoosh');
        spark(hero.x + hero.dir * 70, hero.alt + 50, 12, '#ff8c1a');
      } else {
        fireCd = 0.6; hero.twirl = 0.5;
        G.audio.sfx('star'); spark(hero.x, hero.alt + 50, 8, '#ff9ecb');
      }
    }

    // manter só os quarteirões perto (o jogo nunca acaba, senão crescia sem fim)
    const i0 = Math.floor((camX - 1200) / SLOT), i1 = Math.floor((camX + W + 2400) / SLOT);
    for (const k of chunks.keys()) if (k < i0 - 2 || k > i1 + 2) chunks.delete(k);

    const hAlt = hero.alt + 48;   // meio do corpo
    for (let i = Math.max(0, i0); i <= i1; i++) {
      const ch = chunk(i);

      for (const s of ch.stars) {
        if (s.got) continue;
        if (Math.abs(s.x - hero.x) < 46 && Math.abs(s.alt - hAlt) < 70) {
          s.got = true; G.addStars(1); G.audio.sfx('star');
          spark(s.x, s.alt, 5, '#ffd166');
        }
      }

      // "acolher" os carrinhos diferentes
      const car = ch.car;
      if (car && !car.got) {
        car.t += dt;
        // janela generosa: a criança salta muito, o carrinho apanha-se também de passagem no ar
        const dAlt = hAlt - (roofAlt(i) + 26);
        if (Math.abs(car.x - hero.x) < 58 && dAlt > -80 && dAlt < 210) {
          car.got = true; G.addStars(2);
          G.audio.sfx('vroom'); G.audio.sfx('star');
          spark(car.x, roofAlt(i) + 40, 14, CARCOL[car.col]);
          if (!hero.carros[car.col]) {
            hero.carros[car.col] = true;
            hero.turbo = TURBO_T;
            const faltam = hero.carros.filter(function (v) { return !v; }).length;
            if (faltam === 0) {
              hero.fogo = FOGO_T;
              G.audio.sfx('suit'); G.shake = 0.5;
              spark(hero.x, hero.alt + 60, 26, '#ff8c1a');
              G.banner('PUNHO DE FOGO! 🔥👊 Muito rápido!', 3000);
            } else {
              G.banner('Carrinho ' + CARNAME[car.col] + '! Faltam ' + faltam + ' 🚗', 2000);
            }
          } else {
            hero.turbo = Math.max(hero.turbo, TURBO_T * 0.6);
          }
        }
      }

      // ladrões
      const th = ch.thief;
      if (th) {
        th.t += dt; th.cd = Math.max(0, th.cd - dt);
        const d = hero.x - th.x;
        if (th.state === 'walk') {
          if (Math.abs(d) < 560 && Math.abs(groundAlt(th.x) - hero.alt) < 200) {
            th.dir = Math.sign(d) || 1; th.x += th.dir * 250 * dt;      // persegue (mais devagar do que nós)
          } else {
            th.x += th.dir * 70 * dt;
            if (th.x < houseX(th.home) + 40) th.dir = 1;
            if (th.x > houseX(th.home) + houseW(th.home) - 40) th.dir = -1;
          }
        } else if (th.state === 'flee') {
          th.flee -= dt;
          th.x += th.dir * 295 * dt;   // um bocadinho mais devagar do que nós: dá para o apanhar
          if (th.flee <= 0) { th.state = 'walk'; th.dir = -Math.sign(d) || -1; }
        }
        if (th.state !== 'friend' && Math.abs(d) < 52 && Math.abs(groundAlt(th.x) - hero.alt) < 90 && th.cd <= 0) {
          th.cd = 1.4;
          if (hero.fogo > 0 || hero.superT > 0) {
            amigar(th, 'thief', 3);
          } else if (G.state.stars > 0) {
            const levou = Math.min(2, G.state.stars);
            G.state.stars -= levou; th.bag += levou;
            th.state = 'flee'; th.flee = 6; th.dir = -Math.sign(d) || -1;
            G.audio.sfx('ouch'); G.shake = 0.3;
            G.banner('O ladrão levou ' + levou + ' ⭐! Apanha-o!', 2200);
          } else {
            th.state = 'flee'; th.flee = 3; th.dir = -Math.sign(d) || -1;
            G.audio.sfx('giggle');
          }
        }
        // apanhá-lo à mão: chegar-lhe enquanto foge (ou com o punho de fogo)
        if (th.state === 'flee' && th.cd <= 0 && Math.abs(d) < 44 && Math.abs(groundAlt(th.x) - hero.alt) < 90) {
          amigar(th, 'thief', 2);
        }
        if (th.state !== 'friend' && punchT > 0 && ahead(d) &&
            Math.abs(d) < 170 && Math.abs(groundAlt(th.x) - hero.alt) < 110) {
          amigar(th, 'thief', 3);
        }
      }

      // leões: quando nos atacam ficamos SUPER PODEROSAS (regra do Isaac)
      const li = ch.lion;
      if (li) {
        li.t += dt; li.cd = Math.max(0, li.cd - dt); li.roar = Math.max(0, li.roar - dt);
        const d = hero.x - li.x;
        if (li.state === 'wild') {
          if (Math.abs(d) < 400 && Math.abs(groundAlt(li.x) - hero.alt) < 200) {
            li.dir = Math.sign(d) || 1; li.x += li.dir * 165 * dt;
            if (li.roar <= 0 && Math.random() < dt * 0.7) { li.roar = 1.2; G.audio.sfx('roar'); }
          } else {
            li.x += li.dir * 55 * dt;
            if (li.x < houseX(li.home) + 46) li.dir = 1;
            if (li.x > houseX(li.home) + houseW(li.home) - 46) li.dir = -1;
          }
          if (Math.abs(d) < 56 && Math.abs(groundAlt(li.x) - hero.alt) < 90 && li.cd <= 0) {
            li.cd = 3;
            if (hero.fogo > 0) { amigar(li, 'lion', 3); }
            else {
              hero.superT = SUPER_T;
              G.addStars(2);
              li.state = 'friend'; li.t = 0;
              G.audio.sfx('roar'); G.audio.sfx('suit'); G.shake = 0.45;
              heartPop(hero.x, hero.alt + 70, 6);
              spark(hero.x, hero.alt + 50, 18, '#c77dff');
              G.banner('O leão deu-te um abraço! És SUPER! 💪✨', 2600);
            }
          }
        }
        if (li.state !== 'friend' && punchT > 0 && ahead(d) &&
            Math.abs(d) < 170 && Math.abs(groundAlt(li.x) - hero.alt) < 110) {
          amigar(li, 'lion', 3);
        }
      }
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.t += dt; s.x += s.vx * dt; s.alt += s.vy * dt; s.vy -= 420 * dt;
      if (s.t > s.life) sparks.splice(i, 1);
    }
    for (let i = hearts.length - 1; i >= 0; i--) {
      const p = hearts[i];
      p.t += dt; p.alt += 60 * dt;
      if (p.t > p.life) hearts.splice(i, 1);
    }

    // a câmara sobe quando ela sobe muito (telemóveis baixinhos)
    const want = Math.max(0, hero.alt + 150 - vh() * 0.62);
    camY += (want - camY) * Math.min(1, dt * 4);
  };

  /* ---------- desenho ---------- */
  function sy(alt) { return vh() * 0.86 - alt + camY; }

  // balão de fala que nunca sai do ecrã (em telemóvel ao alto cortava)
  function bub(c, x, y, txt) {
    G.gfx.bubble(c, Math.max(96, Math.min(vw() - 96, x)), Math.max(52, y), txt);
  }

  function house(c, i, t) {
    const x = houseX(i) - camX, w = houseW(i), alt = roofAlt(i);
    const top = sy(alt), base = sy(0);
    const col = HOUSECOL[Math.floor(h01(i * 2.7) * HOUSECOL.length)];
    const rcol = ROOFCOL[Math.floor(h01(i * 4.9) * ROOFCOL.length)];
    // fachada
    c.fillStyle = col; c.fillRect(x, top, w, base - top + 40);
    c.fillStyle = 'rgba(0,0,0,.06)'; c.fillRect(x + w - 16, top, 16, base - top + 40);
    // janelas
    const cols = Math.max(2, Math.round(w / 110));
    for (let r = 0; r < Math.max(1, Math.floor((base - top) / 96)); r++) {
      for (let k = 0; k < cols; k++) {
        const wx = x + (w / cols) * (k + 0.5) - 22, wy = top + 46 + r * 96;
        if (wy + 46 > base) continue;
        G.gfx.rr(c, wx, wy, 44, 46, 8);
        c.fillStyle = h01(i * 13 + r * 3 + k) > 0.55 ? '#ffe9a8' : '#bfe4ff'; c.fill();
        c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(wx + 22, wy); c.lineTo(wx + 22, wy + 46);
        c.moveTo(wx, wy + 23); c.lineTo(wx + 44, wy + 23); c.stroke();
      }
    }
    // toldo às riscas e porta, ao nível da rua
    c.fillStyle = rcol;
    c.beginPath(); c.moveTo(x - 10, base - 46); c.lineTo(x + w + 10, base - 46);
    c.lineTo(x + w + 2, base - 14); c.lineTo(x - 2, base - 14); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.6)';
    for (let k = 0; k < w / 46; k++) {
      c.beginPath(); c.moveTo(x - 10 + k * 46, base - 46); c.lineTo(x - 10 + k * 46 + 22, base - 46);
      c.lineTo(x - 4 + k * 46 + 22, base - 14); c.lineTo(x - 4 + k * 46, base - 14); c.closePath(); c.fill();
    }
    // telhado (é aqui que se anda)
    c.fillStyle = rcol;
    G.gfx.rr(c, x - 12, top - 16, w + 24, 22, 8); c.fill();
    c.fillStyle = 'rgba(255,255,255,.45)';
    G.gfx.rr(c, x - 8, top - 14, w + 16, 7, 4); c.fill();
    // chaminé fofa com fumo em corações
    if (h01(i * 6.1) > 0.5) {
      const cx = x + w * 0.82;
      c.fillStyle = '#c98b6b'; c.fillRect(cx - 15, top - 58, 30, 46);
      c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(cx - 15, top - 44, 30, 8);
      c.fillStyle = rcol; G.gfx.rr(c, cx - 20, top - 66, 40, 12, 5); c.fill();
      c.fillStyle = '#ffffff';
      for (let k = 0; k < 3; k++) {
        const ph = (t * 0.4 + k * 0.34 + h01(i)) % 1;
        c.globalAlpha = 0.7 * (1 - ph);
        c.beginPath(); c.arc(cx + Math.sin(ph * 5) * 14, top - 76 - ph * 80, 9 + ph * 14, 0, TAU); c.fill();
      }
      c.globalAlpha = 1;
    }
  }

  function barbie(c, t, o) {
    const walk = o.walk || 0;
    const l1 = Math.sin(walk) * 11, l2 = -Math.sin(walk) * 11;
    const glow = o.fogo ? '#ff8c1a' : (o.sup ? '#c77dff' : null);
    if (glow) {   // halo aditivo: brilha em vez de sujar as cores por baixo
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.55 + Math.sin(t * 9) * 0.15;
      const rg = c.createRadialGradient(0, -58, 8, 0, -58, 74);
      rg.addColorStop(0, glow); rg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = rg;
      c.beginPath(); c.arc(0, -58, 74, 0, TAU); c.fill();
      c.restore();
    }
    // pernas + sapatinhos
    c.strokeStyle = '#ffd9b3'; c.lineWidth = 8; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-4, -36); c.lineTo(-4 + l1 * 0.6, -5); c.stroke();
    c.beginPath(); c.moveTo(5, -36); c.lineTo(5 + l2 * 0.6, -5); c.stroke();
    c.fillStyle = '#ff2e88';
    c.beginPath(); c.arc(-4 + l1 * 0.6, -3, 6, 0, TAU); c.arc(5 + l2 * 0.6, -3, 6, 0, TAU); c.fill();
    // vestido de estrelas
    c.fillStyle = '#ff4fa3';
    c.beginPath();
    c.moveTo(-13, -62); c.lineTo(13, -62);
    c.quadraticCurveTo(26, -40, 24, -26); c.lineTo(-24, -26);
    c.quadraticCurveTo(-26, -40, -13, -62); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.85)';
    G.gfx.star(c, -10, -36, 5, '#fff0f6', t * 0.6);
    G.gfx.star(c, 9, -32, 4, '#fff0f6', -t * 0.6);
    // tronco
    G.gfx.rr(c, -12, -78, 25, 20, 8); c.fillStyle = '#ff7fbf'; c.fill();
    // braço da frente: varinha de estrela, ou punho de fogo
    c.save(); c.translate(9, -72);
    c.rotate(o.punch ? -0.5 : Math.sin(t * 3) * 0.15 - 0.15);
    c.strokeStyle = '#ffd9b3'; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 0); c.lineTo(o.punch ? 30 : 20, o.punch ? -2 : 6); c.stroke();
    if (o.fogo) {
      const fx = o.punch ? 34 : 24, fy = o.punch ? -2 : 8;
      c.fillStyle = '#ffb703'; c.beginPath(); c.arc(fx, fy, 10, 0, TAU); c.fill();
      c.fillStyle = '#ff6d00';
      for (let k = 0; k < 5; k++) {
        const a = -0.9 + k * 0.45 + Math.sin(t * 12 + k) * 0.12;
        c.beginPath();
        c.moveTo(fx, fy);
        c.lineTo(fx + Math.cos(a) * (20 + Math.sin(t * 15 + k) * 6), fy + Math.sin(a) * 16);
        c.lineTo(fx + Math.cos(a + 0.3) * 12, fy + Math.sin(a + 0.3) * 10);
        c.closePath(); c.fill();
      }
    } else {
      c.strokeStyle = '#ffd166'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(18, 6); c.lineTo(32, -6); c.stroke();
      G.gfx.star(c, 35, -9, 9, '#ffd166', t * 2);
    }
    c.restore();
    // cabelo comprido atrás
    c.fillStyle = '#ffd75e';
    c.beginPath();
    c.moveTo(-6, -92); c.quadraticCurveTo(-30, -80, -24, -40);
    c.quadraticCurveTo(-14, -46, -8, -66); c.closePath(); c.fill();
    // cabeça
    c.beginPath(); c.arc(0, -92, 15, 0, TAU); c.fillStyle = '#ffd9b3'; c.fill();
    c.fillStyle = '#ffd75e';                                  // franja
    c.beginPath(); c.arc(0, -95, 15.5, Math.PI, 0); c.fill();
    c.beginPath(); c.arc(-11, -92, 6, 0, TAU); c.arc(11, -92, 6, 0, TAU); c.fill();
    // coroa
    c.fillStyle = '#ffd166';
    c.beginPath();
    c.moveTo(-11, -106); c.lineTo(-6, -116); c.lineTo(0, -108); c.lineTo(6, -116); c.lineTo(11, -106);
    c.closePath(); c.fill();
    G.gfx.star(c, 0, -119, 4.5, '#fff', t * 3);
    // cara
    c.fillStyle = '#2b2d42';
    c.beginPath(); c.arc(4, -93, 2.2, 0, TAU); c.arc(-6, -93, 2.2, 0, TAU); c.fill();
    c.strokeStyle = '#2b2d42'; c.lineWidth = 1.8; c.lineCap = 'round';
    c.beginPath(); c.arc(-1, -89, 5, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke();
    c.fillStyle = 'rgba(255,120,150,.55)';
    c.beginPath(); c.arc(9, -88, 3, 0, TAU); c.arc(-11, -88, 3, 0, TAU); c.fill();
  }

  function thiefArt(c, t, o) {
    const friend = o.state === 'friend';
    const hop = o.state === 'flee' ? Math.abs(Math.sin(t * 12)) * 7 : Math.abs(Math.sin(t * 5)) * 3;
    c.save(); c.translate(0, -hop);
    // pernas
    c.strokeStyle = '#3a3a5c'; c.lineWidth = 8; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-5, -30); c.lineTo(-5 + Math.sin(t * 9) * 8, -2); c.stroke();
    c.beginPath(); c.moveTo(5, -30); c.lineTo(5 - Math.sin(t * 9) * 8, -2); c.stroke();
    // corpo às riscas
    G.gfx.rr(c, -15, -62, 30, 34, 10); c.fillStyle = friend ? '#59c9a5' : '#4c5c8a'; c.fill();
    c.fillStyle = 'rgba(255,255,255,.65)';
    for (let k = 0; k < 3; k++) { G.gfx.rr(c, -15, -58 + k * 11, 30, 5, 3); c.fill(); }
    // saco das estrelas
    if (o.bag > 0) {
      c.save(); c.translate(-22, -44); c.rotate(Math.sin(t * 8) * 0.2);
      c.fillStyle = '#e8e2d0'; c.beginPath(); c.arc(0, 0, 13, 0, TAU); c.fill();
      G.gfx.star(c, 0, 0, 7, '#ffd166', t);
      c.restore();
    }
    // braço a acenar quando é amigo
    c.strokeStyle = friend ? '#59c9a5' : '#4c5c8a'; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(10, -54);
    if (friend) c.lineTo(24, -70 + Math.sin(t * 10) * 6); else c.lineTo(22, -44);
    c.stroke();
    // cabeça + máscara (cai quando fica amigo)
    c.beginPath(); c.arc(0, -74, 14, 0, TAU); c.fillStyle = '#ffd9b3'; c.fill();
    c.fillStyle = '#2b2d42';
    c.beginPath(); c.arc(0, -78, 14.5, Math.PI, 0); c.fill();
    if (!friend) { G.gfx.rr(c, -14, -78, 28, 9, 4); c.fillStyle = '#2b2d42'; c.fill(); }
    c.fillStyle = '#2b2d42';
    c.beginPath(); c.arc(5, -74, 2, 0, TAU); c.arc(-5, -74, 2, 0, TAU); c.fill();
    c.strokeStyle = '#2b2d42'; c.lineWidth = 1.8; c.lineCap = 'round';
    c.beginPath();
    if (friend) c.arc(0, -70, 5, 0.1 * Math.PI, 0.9 * Math.PI);
    else c.arc(0, -64, 5, 1.1 * Math.PI, 1.9 * Math.PI);
    c.stroke();
    c.restore();
  }

  function lionArt(c, t, o) {
    const friend = o.state === 'friend';
    const step = Math.sin(t * 6) * 6;
    c.save();
    // patas
    c.strokeStyle = '#e09f3e'; c.lineWidth = 9; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-16, -24); c.lineTo(-16 + step, -2); c.stroke();
    c.beginPath(); c.moveTo(16, -24); c.lineTo(16 - step, -2); c.stroke();
    // corpo
    c.fillStyle = '#f4a259';
    G.gfx.rr(c, -26, -50, 52, 30, 14); c.fill();
    // rabo com borla
    c.strokeStyle = '#e09f3e'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(24, -44); c.quadraticCurveTo(44, -50, 40, -64 + Math.sin(t * 5) * 5); c.stroke();
    c.fillStyle = '#8a5a2b'; c.beginPath(); c.arc(40, -66 + Math.sin(t * 5) * 5, 6, 0, TAU); c.fill();
    // juba
    c.fillStyle = '#e07a5f';
    const jub = friend ? 22 : 24 + (o.roar > 0 ? 4 : 0);
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * TAU + Math.sin(t * 3) * 0.1;
      c.beginPath(); c.arc(-22 + Math.cos(a) * jub, -62 + Math.sin(a) * jub, 11, 0, TAU); c.fill();
    }
    // cara
    c.fillStyle = '#ffd7a0'; c.beginPath(); c.arc(-22, -62, 19, 0, TAU); c.fill();
    c.fillStyle = '#e09f3e';
    c.beginPath(); c.arc(-33, -78, 6, 0, TAU); c.arc(-11, -78, 6, 0, TAU); c.fill();
    c.fillStyle = '#2b2d42';
    c.beginPath(); c.arc(-29, -64, 2.4, 0, TAU); c.arc(-15, -64, 2.4, 0, TAU); c.fill();
    c.fillStyle = '#a4553a';
    c.beginPath(); c.moveTo(-25, -56); c.lineTo(-19, -56); c.lineTo(-22, -52); c.closePath(); c.fill();
    c.strokeStyle = '#2b2d42'; c.lineWidth = 2; c.lineCap = 'round';
    if (o.roar > 0 && !friend) {           // rugido fofo
      c.fillStyle = '#c9184a';
      c.beginPath(); c.ellipse(-22, -46, 8, 7, 0, 0, TAU); c.fill();
    } else {
      c.beginPath(); c.arc(-26, -50, 4, 0, Math.PI); c.stroke();
      c.beginPath(); c.arc(-18, -50, 4, 0, Math.PI); c.stroke();
    }
    c.restore();
  }

  function carArt(c, t, col) {
    const bob = Math.sin(t * 2.4) * 3;
    c.save(); c.translate(0, -bob);
    c.fillStyle = col;
    G.gfx.rr(c, -34, -34, 68, 22, 10); c.fill();
    G.gfx.rr(c, -20, -50, 40, 22, 10); c.fill();
    c.fillStyle = '#bfe4ff';
    G.gfx.rr(c, -15, -46, 14, 13, 5); c.fill();
    G.gfx.rr(c, 2, -46, 14, 13, 5); c.fill();
    c.fillStyle = '#2b2d42';
    c.beginPath(); c.arc(-19, -10, 10, 0, TAU); c.arc(19, -10, 10, 0, TAU); c.fill();
    c.fillStyle = '#e9ecef';
    c.beginPath(); c.arc(-19, -10, 4, 0, TAU); c.arc(19, -10, 4, 0, TAU); c.fill();
    c.fillStyle = '#ffd166'; c.beginPath(); c.arc(32, -26, 4.5, 0, TAU); c.fill();
    c.restore();
    G.gfx.star(c, 0, -70 + Math.sin(t * 3) * 5, 9, '#fff3bf', t * 1.5);
  }

  S.draw = function (c, t) {
    const vs = vscale(), W = vw(), H = vh();
    c.save(); c.scale(vs, vs);

    // céu do fim de tarde cor-de-rosa
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#6ec6ff'); g.addColorStop(0.55, '#ffc2e2'); g.addColorStop(1, '#ffe7c2');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    G.gfx.sun(c, W * 0.82, H * 0.16, Math.min(W, H) * 0.07, t);
    for (let k = 0; k < 7; k++) {
      const cx = ((k * 360 - camX * 0.18) % (W + 700) + W + 700) % (W + 700) - 250;
      G.gfx.cloud(c, cx, H * (0.1 + (k % 3) * 0.08), 30 + (k % 4) * 12, 0.75);
    }
    // torres ao longe
    c.fillStyle = 'rgba(255,255,255,.45)';
    for (let k = -1; k < W / 150 + 2; k++) {
      const bx = k * 150 - ((camX * 0.35) % 150);
      const bh = 120 + h01(Math.round((camX * 0.35 + k * 150) / 150)) * 200;
      c.fillRect(bx, sy(0) - bh, 110, bh);
    }

    const i0 = Math.floor((camX - 600) / SLOT), i1 = Math.floor((camX + W + 600) / SLOT);

    // rua lá em baixo
    c.fillStyle = '#9aa5b1'; c.fillRect(0, sy(0) + 40, W, H);
    c.fillStyle = '#c9d1d9'; c.fillRect(0, sy(0) + 40, W, 14);
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 5; c.setLineDash([26, 22]);
    c.beginPath(); c.moveTo(-camX % 48, sy(0) + 96); c.lineTo(W, sy(0) + 96); c.stroke();
    c.setLineDash([]);

    for (let i = Math.max(0, i0); i <= i1; i++) house(c, i, t);

    // estrelas, carrinhos, ladrões e leões
    for (let i = Math.max(0, i0); i <= i1; i++) {
      const ch = chunks.get(i);
      if (!ch) continue;
      for (const s of ch.stars) {
        if (s.got) continue;
        G.gfx.star(c, s.x - camX, sy(s.alt) + Math.sin(t * 3 + s.x) * 5, 15, '#ffd166', t * 1.2);
      }
      if (ch.car && !ch.car.got) {
        c.save(); c.translate(ch.car.x - camX, sy(roofAlt(i))); carArt(c, t, CARCOL[ch.car.col]); c.restore();
      }
      if (ch.thief) {
        const th = ch.thief, x = th.x - camX;
        c.save(); c.translate(x, sy(groundAlt(th.x)));
        if (th.dir < 0) c.scale(-1, 1);
        thiefArt(c, t + th.t, th);
        c.restore();
        if (th.state === 'flee') bub(c, x, sy(groundAlt(th.x)) - 108, 'Foge! 😆');
        else if (th.state === 'friend') bub(c, x, sy(groundAlt(th.x)) - 108, 'Desculpa! 💖');
      }
      if (ch.lion) {
        const li = ch.lion, x = li.x - camX;
        c.save(); c.translate(x, sy(groundAlt(li.x)));
        if (li.dir > 0) c.scale(-1, 1);
        lionArt(c, t + li.t, li);
        c.restore();
        if (li.roar > 0 && li.state !== 'friend') bub(c, x, sy(groundAlt(li.x)) - 106, 'ROAAAR! 🦁');
        else if (li.state === 'friend') bub(c, x, sy(groundAlt(li.x)) - 106, 'Amigos! 💛');
      }
    }

    // Barbie
    const hx = hero.x - camX, hy = sy(hero.alt);
    c.save(); c.translate(hx, hy);
    if (hero.dir < 0) c.scale(-1, 1);
    if (hero.twirl > 0) c.rotate((0.5 - hero.twirl) * TAU * 1.4);
    barbie(c, t, {
      walk: hero.grounded ? hero.walk : 0,
      fogo: hero.fogo > 0, sup: hero.superT > 0, punch: punchT > 0
    });
    c.restore();
    if (punchT > 0) {   // língua de fogo do punho
      const k = punchT / 0.3;
      c.save();
      c.globalAlpha = k;
      c.translate(hx, hy - 50); c.scale(hero.dir, 1);
      const gr = c.createLinearGradient(20, 0, 190, 0);
      gr.addColorStop(0, '#fff3bf'); gr.addColorStop(0.35, '#ffd166');
      gr.addColorStop(0.7, '#ff8c1a'); gr.addColorStop(1, 'rgba(255,77,0,0)');
      c.fillStyle = gr;
      c.beginPath();
      c.moveTo(20, -26);
      c.quadraticCurveTo(110, -40 + Math.sin(t * 30) * 6, 196, -4);
      c.quadraticCurveTo(110, 40 + Math.cos(t * 30) * 6, 20, 26);
      c.quadraticCurveTo(4, 0, 20, -26);
      c.closePath(); c.fill();
      c.fillStyle = '#fff3bf';
      for (let j = 0; j < 3; j++) {
        c.beginPath();
        c.arc(60 + j * 44, Math.sin(t * 20 + j * 2) * 14, 9 - j * 2, 0, TAU); c.fill();
      }
      c.restore();
    }

    for (const s of sparks) {
      c.globalAlpha = Math.max(0, 1 - s.t / s.life);
      G.gfx.star(c, s.x - camX, sy(s.alt), 7, s.col, s.t * 6);
      c.globalAlpha = 1;
    }
    for (const p of hearts) {
      c.globalAlpha = Math.max(0, 1 - p.t / p.life);
      G.gfx.heart(c, p.x - camX, sy(p.alt), 22, '#ff5d8f');
      c.globalAlpha = 1;
    }

    c.restore();

    // HUD: estrelas, carrinhos por acolher e os poderes (sempre em píxeis do ecrã)
    G.gfx.star(c, 36, 46, 18, '#ffd166', 0);
    G.gfx.label(c, '' + G.state.stars, 64, 47, 32, '#b56b00');
    for (let k = 0; k < 4; k++) {
      const x = 24 + k * 42, y = 78;
      G.gfx.rr(c, x, y, 34, 24, 8);
      c.fillStyle = hero.carros[k] ? CARCOL[k] : 'rgba(255,255,255,.4)'; c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke();
      c.fillStyle = hero.carros[k] ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.6)';
      c.beginPath(); c.arc(x + 10, y + 24, 5, 0, TAU); c.arc(x + 24, y + 24, 5, 0, TAU); c.fill();
    }
    if (hero.fogo > 0) {
      G.gfx.rr(c, 24, 116, 148 * (hero.fogo / FOGO_T), 14, 7);
      c.fillStyle = '#ff8c1a'; c.fill();
      G.gfx.label(c, '🔥 PUNHO DE FOGO', 24, 148, 22, '#c1440e', 'left');
    } else if (hero.superT > 0) {
      G.gfx.rr(c, 24, 116, 148 * (hero.superT / SUPER_T), 14, 7);
      c.fillStyle = '#c77dff'; c.fill();
      G.gfx.label(c, '✨ SUPER PODEROSA', 24, 148, 22, '#7b2cbf', 'left');
    }
  };

  S.debug = function () {
    return {
      x: Math.round(hero.x), alt: Math.round(hero.alt), grounded: hero.grounded,
      fogo: +hero.fogo.toFixed(1), superT: +hero.superT.toFixed(1), turbo: +hero.turbo.toFixed(1),
      carros: hero.carros.slice(), stars: G.state.stars, chunks: chunks.size
    };
  };

  G.scenes = G.scenes || {};
  G.scenes.barbie = S;
})();
