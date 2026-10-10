/* Cena 7 — Os Morcegos (ditada pelo Isaac).
   Somos um morcego a voar na gruta com dois amigos. Os monstros andam atrás dos morcegos;
   se nos apanham, engolem-nos — mas dentro da BARRIGA tiramos-lhes os dentes (ficam lá
   guardados), fugimos pela garganta e o monstro fica banguela, a rir, nosso amigo.
   As BOLAS ELÉTRICAS dão super velocidade: com elas os monstros não conseguem comer-nos.
   Regras de paz: ninguém se magoa, ser engolido é só mais uma aventura e não há derrota. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  const SLOT = 560;                 // um pedaço de gruta
  const FLAP = 1250, GRAV = 780;    // subir com o ⬆ / cair devagarinho
  const VX = 330, VYMAX = 430;
  const RAIO_T = 6;                 // segundos de super velocidade
  const NDENTES = 4;

  let hero, amigos, monstros, bolas, sparks, apanhadas, camX, fase, ft, barriga, raio, guinchoCd, salvos, hint;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function h01(n) { const s = Math.sin(n * 127.1) * 43758.5; return s - Math.floor(s); }

  function vscale() { return Math.min(1, G.H / 620); }
  function vw() { return G.W / vscale(); }
  function vh() { return G.H / vscale(); }

  // teto e chão da gruta (ondulados, com estalactites)
  function teto(x) { return 60 + Math.sin(x * 0.0016) * 34 + Math.sin(x * 0.0041 + 1.2) * 20; }
  function chao(x) { return vh() - 70 - Math.sin(x * 0.0013 + 2.1) * 30 - Math.sin(x * 0.0037) * 16; }
  function picoAt(i) {              // estalactite/estalagmite de vez em quando
    if (h01(i * 5.1 + 0.3) < 0.42) return null;
    return { x: i * SLOT + 180 + h01(i * 3.3) * 220, cima: h01(i * 7.7) > 0.5, h: 90 + h01(i * 2.9) * 90 };
  }
  /* As estalactites e estalagmites são obstáculos a sério (pedido do Isaac): devolve o
     empurrão vertical para fora da rocha, ou 0 se estivermos livres. A ponta é fininha,
     por isso a "profundidade" diminui à medida que nos afastamos do meio do pico. */
  function empurraoPico(x, y) {
    const i = Math.floor(x / SLOT);
    for (let k = i - 1; k <= i + 1; k++) {
      const p = picoAt(k);
      if (!p) continue;
      const dx = x - p.x, adx = Math.abs(dx);
      if (adx > 46) continue;
      const y0 = p.cima ? teto(p.x) : chao(p.x);
      const prof = p.h * Math.max(0, 1 - Math.max(0, adx - 18) / 28);   // até onde a rocha desce aqui
      const dentro = p.cima ? (y0 + prof + 18) - y : y - (y0 - prof - 18);
      if (dentro <= 0) continue;
      // Sair pelo caminho mais curto: por baixo/por cima da ponta, ou pelo lado. Sem o
      // lado, quem viesse a bater as asas ficava agarrado à rocha e passava a raspar.
      const fundo = p.cima ? (y - y0) : (y0 - y);
      const precisa = 18 + 28 * (1 - Math.max(0, fundo - 18) / p.h);
      const lateral = (precisa - adx) * (dx >= 0 ? 1 : -1);
      if (Math.abs(lateral) < dentro) return { x: lateral, y: 0 };
      return { x: 0, y: p.cima ? dentro : -dentro };
    }
    return null;
  }

  // estrelinhas pela gruta: as de baixo valem o mesmo mas é onde os monstros saltam
  function estrelasAt(i) {
    const out = [];
    for (let k = 0; k < 3; k++) {
      const x = i * SLOT + 90 + k * 170 + h01(i * 6.1 + k) * 70;
      const alto = h01(i * 8.7 + k) > 0.45;
      const yT = teto(x) + 70, yC = chao(x) - 70;
      out.push({ x: x, y: alto ? yT + (yC - yT) * 0.18 : yC - (yC - yT) * 0.12 });
    }
    return out;
  }

  S.enter = function () {
    hero = { x: 160, y: 0, vy: 0, dir: 1, flap: 0, inv: 2.5 };   // 2,5 s para perceber os controlos
    hero.y = 240;
    amigos = [
      { x: 90, y: 280, t: 0, cor: '#8e7dbe' },
      { x: 40, y: 200, t: 1.6, cor: '#6b5ca5' }
    ];
    monstros = []; bolas = []; sparks = []; apanhadas = {};
    camX = 0; fase = 'voo'; ft = 0; barriga = null; raio = 0; guinchoCd = 0; salvos = 0; hint = 5;
    for (let i = 0; i < 2; i++) novoMonstro(1500 + i * 620);
    novaBola(900);
    G.banner('Voa com o ⬆ e apanha as bolas elétricas ⚡', 3400);
  };

  function novoMonstro(x) {
    monstros.push({
      x: x, y: chao(x) - 60, vy: 0, noChao: true, saltoCd: rnd(0.5, 1.6),
      kind: Math.floor(Math.random() * 3), state: 'caca',
      t: rnd(0, 6), cd: 0, zonzo: 0, banguela: false, boca: 0, aceno: 0
    });
  }
  function novaBola(x) {
    // as bolas ficam na zona do meio/baixo: é preciso descer para as ir buscar
    bolas.push({ x: x, y: chao(x) - rnd(140, 300), t: rnd(0, 6), apanhada: false });
  }
  function spark(x, y, n, col) {
    for (let i = 0; i < n; i++) sparks.push({ x: x, y: y, vx: rnd(-150, 150), vy: rnd(-190, 60), t: 0, life: rnd(0.4, 0.9), col: col });
  }

  function engolir(m) {
    fase = 'engolido'; ft = 0; m.boca = 1;
    barriga = { monstro: m, dentes: [], apanhados: 0, sair: false, tempo: 0, dica: false };
    for (let k = 0; k < NDENTES; k++) {
      barriga.dentes.push({ x: 0.22 + (k % 2) * 0.56, y: 0.34 + Math.floor(k / 2) * 0.26, t: rnd(0, 6), got: false });
    }
    G.audio.sfx('gulp'); G.shake = 0.5;
    G.banner('Ohhh! Fomos engolidos! 😮', 2200);
  }

  function sairDaBarriga(comAtchim) {
    fase = 'sair'; ft = 0; barriga.sair = true;
    const m = barriga.monstro;
    m.banguela = true; m.state = 'amigo'; m.aceno = 3; m.zonzo = 0;
    salvos++;
    G.addStars(5);
    G.audio.sfx(comAtchim ? 'atchim' : 'whee');
    G.audio.sfx('tada');
    G.shake = 0.4;
    G.banner(comAtchim ? 'ATCHIM! 🤧 O monstro ficou banguela 😁' : 'Fugiste da barriga! 😁', 2800);
  }

  S.update = function (dt, t) {
    const W = vw(), H = vh(), inp = G.input;
    raio = Math.max(0, raio - dt);
    hero.inv = Math.max(0, hero.inv - dt);
    guinchoCd = Math.max(0, guinchoCd - dt);
    hint = Math.max(0, hint - dt);

    if (fase === 'engolido') {                 // a ser engolido: pequena pausa e vamos lá dentro
      ft += dt;
      if (ft > 0.9) { fase = 'barriga'; ft = 0; hero.x = 0.5; hero.y = 0.8; hero.vy = 0; }
      return;
    }
    if (fase === 'sair') {                     // a sair pela boca
      ft += dt;
      if (ft > 1.2) {
        fase = 'voo'; ft = 0;
        const m = barriga.monstro;
        hero.x = m.x + 70; hero.y = Math.max(120, chao(m.x) - 190); hero.vy = -120;
        hero.inv = 1.6; barriga = null;
      }
      return;
    }

    // ---------- dentro da barriga ----------
    if (fase === 'barriga') {
      const sobe = inp.isHeld('jump') || inp.isHeld('up') || inp.axis().y < -0.25;
      let mv = 0;
      if (inp.isHeld('left')) mv -= 1;
      if (inp.isHeld('right')) mv += 1;
      if (mv === 0) { const a = inp.axis(); mv = Math.abs(a.x) > 0.25 ? Math.sign(a.x) : 0; }
      hero.vy += (sobe ? -1500 : 900) * dt;
      hero.vy = Math.max(-520, Math.min(520, hero.vy));
      hero.y += (hero.vy / H) * dt;
      hero.x = Math.max(0.1, Math.min(0.9, hero.x + mv * 0.42 * dt));
      if (mv !== 0) hero.dir = mv;
      if (hero.y > 0.86) { hero.y = 0.86; hero.vy = 0; }
      if (hero.y < 0.06) { hero.y = 0.06; hero.vy = 0; }
      hero.flap += dt * (sobe ? 22 : 11);

      barriga.tempo += dt;
      for (const d of barriga.dentes) {
        d.t += dt;
        if (d.got) continue;
        // íman: o dente vem ter connosco quando andamos perto (é uma criança de 5 anos)
        const dx = hero.x - d.x, dy = hero.y - d.y;
        if (Math.abs(dx) < 0.3 && Math.abs(dy) < 0.3) {
          d.x += dx * Math.min(1, dt * 2.2); d.y += dy * Math.min(1, dt * 2.2);
        }
        if (Math.abs(d.x - hero.x) < 0.11 && Math.abs(d.y - hero.y) < 0.11) {
          d.got = true; barriga.apanhados++;
          G.addStars(2); G.audio.sfx('pop'); G.audio.sfx('star');
          spark(d.x * W, d.y * H, 8, '#ffffff');
          if (barriga.apanhados >= NDENTES) sairDaBarriga(true);
        }
      }
      // A garganta lá em cima só deixa passar depois de tirarmos TODOS os dentes — é o
      // que o Isaac pediu: primeiro tiram-se os dentes, só depois se foge da barriga.
      if (fase === 'barriga' && hero.y < 0.17 && Math.abs(hero.x - 0.5) < 0.24) {
        if (barriga.apanhados >= NDENTES) sairDaBarriga(false);
        else if (!barriga.avisoSaida) {
          barriga.avisoSaida = true;
          G.banner('Primeiro os dentes todos! 🦷', 2200);
        }
      }
      // rede de segurança: ao fim de um bocado o monstro espirra e saímos na mesma
      if (fase === 'barriga' && barriga.tempo > 18) sairDaBarriga(true);
      if (fase === 'barriga' && barriga.tempo > 5 && !barriga.dica) {
        barriga.dica = true;
        G.banner('Apanha os dentes todos! 🦷', 2600);
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 260 * dt;
        if (s.t > s.life) sparks.splice(i, 1);
      }
      return;
    }

    // ---------- voo na gruta ----------
    const sobe = inp.isHeld('jump') || inp.isHeld('up') || inp.axis().y < -0.25;
    let mv = 0;
    if (inp.isHeld('left')) mv -= 1;
    if (inp.isHeld('right')) mv += 1;
    if (mv === 0) { const a = inp.axis(); mv = Math.abs(a.x) > 0.25 ? Math.sign(a.x) : 0; }
    const k = raio > 0 ? 1.8 : 1;
    hero.vy += (sobe ? -FLAP : GRAV) * dt;
    hero.vy = Math.max(-VYMAX * k, Math.min(VYMAX, hero.vy));
    hero.y += hero.vy * dt;
    hero.x = Math.max(60, hero.x + (mv !== 0 ? mv : 0.35) * VX * k * dt);   // vai sempre andando
    if (mv !== 0) hero.dir = mv;
    hero.flap += dt * (sobe ? 20 : 12);
    if (raio > 0 && Math.random() < dt * 30) spark(hero.x - hero.dir * 20, hero.y + rnd(-10, 10), 1, '#7df9ff');

    // teto e chão: bate e ressalta, não magoa
    const yT = teto(hero.x) + 26, yC = chao(hero.x) - 26;
    if (hero.y < yT) { hero.y = yT; hero.vy = Math.max(hero.vy, 90); }
    if (hero.y > yC) { hero.y = yC; hero.vy = Math.min(hero.vy, -90); }
    // e as pontas de pedra: empurram para fora com um "boing", sem magoar
    hero.picoCd = Math.max(0, (hero.picoCd || 0) - dt);
    const emp = empurraoPico(hero.x, hero.y);
    if (emp) {
      hero.x = Math.max(60, hero.x + emp.x);
      hero.y += emp.y;
      if (emp.y > 0) hero.vy = Math.max(hero.vy, 70);
      else if (emp.y < 0) hero.vy = Math.min(hero.vy, -70);
      if (hero.picoCd <= 0) {
        hero.picoCd = 0.5;
        G.audio.sfx('boing'); spark(hero.x, hero.y, 4, '#b8b8ff');
        if (hint <= 0) { G.banner('Cuidado com as pedras! Desvia-te 🪨', 1800); hint = 8; }
      }
    }

    camX = Math.max(0, hero.x - W * 0.34);

    // tecla 9 = atalho de teste, força ser engolido (como no jogo do avião)
    if (inp.justPressed('debug9') && monstros.length) { engolir(monstros[0]); return; }

    // guincho: os monstros tapam os ouvidos e abrandam
    if ((inp.justPressed('fire') || inp.isHeld('fire')) && guinchoCd <= 0) {
      guinchoCd = 0.9;
      G.audio.sfx('guincho');
      spark(hero.x, hero.y, 6, '#ffd166');
      for (const m of monstros) {
        if (m.state === 'caca' && Math.abs(m.x - hero.x) < 420) { m.zonzo = Math.max(m.zonzo, 1.4); m.aceno = 0.8; }
      }
    }

    // bolas elétricas
    for (const b of bolas) {
      b.t += dt;
      if (b.apanhada) continue;
      if (Math.abs(b.x - hero.x) < 48 && Math.abs(b.y - hero.y) < 48) {
        b.apanhada = true; raio = RAIO_T;
        G.addStars(3); G.audio.sfx('zap'); G.shake = 0.35;
        spark(b.x, b.y, 20, '#7df9ff');
        G.banner('Bola elétrica! ⚡ Ninguém te apanha!', 2400);
      }
    }

    // estrelinhas pela gruta
    const i0 = Math.floor((camX - 600) / SLOT), i1 = Math.floor((camX + W + 700) / SLOT);
    for (let i = Math.max(0, i0); i <= i1; i++) {
      const lista = estrelasAt(i);
      for (let k = 0; k < lista.length; k++) {
        const chave = i + ':' + k;
        if (apanhadas[chave]) continue;
        const s = lista[k];
        if (Math.abs(s.x - hero.x) < 44 && Math.abs(s.y - hero.y) < 44) {
          apanhadas[chave] = 1; G.addStars(1); G.audio.sfx('star'); spark(s.x, s.y, 5, '#ffd166');
        }
      }
    }
    for (const kk in apanhadas) if (parseInt(kk, 10) < i0 - 6) delete apanhadas[kk];

    // monstros
    for (const m of monstros) {
      m.t += dt; m.cd = Math.max(0, m.cd - dt);
      m.zonzo = Math.max(0, m.zonzo - dt); m.aceno = Math.max(0, m.aceno - dt);
      m.boca = Math.max(0, m.boca - dt * 0.6);
      const d = hero.x - m.x;
      if (m.state === 'amigo') {                    // banguela e feliz: fica a acenar
        m.y += ((chao(m.x) - 60) - m.y) * Math.min(1, dt * 4);
        continue;
      }
      const vel = (m.zonzo > 0 ? 60 : 250);
      m.x += Math.sign(d || 1) * vel * dt;
      // Andam no chão e SALTAM para tentar apanhar o morcego — nunca voam. É isto que dá
      // jogo: lá em cima estamos seguros, mas as bolas e as estrelas estão cá em baixo.
      m.saltoCd = Math.max(0, m.saltoCd - dt);
      const solo = chao(m.x) - 60;
      if (m.noChao) {
        m.y = solo;
        if (m.zonzo <= 0 && Math.abs(d) < 300 && hero.y > solo - 320 && m.saltoCd <= 0) {
          m.vy = -880; m.noChao = false; m.saltoCd = rnd(1.1, 2.2); m.boca = 0.6;
          G.audio.sfx('hop');
        }
      } else {
        m.vy += 1500 * dt; m.y += m.vy * dt;
        if (m.y >= solo) { m.y = solo; m.vy = 0; m.noChao = true; }
      }
      if (Math.abs(d) < 60 && Math.abs(m.y - hero.y) < 70 && m.cd <= 0 && hero.inv <= 0) {
        m.cd = 1.2;
        if (raio > 0) {                             // com eletricidade não conseguem comer-nos
          m.zonzo = 3.2; m.aceno = 1.2;
          G.addStars(2); G.audio.sfx('zap');
          spark(m.x, m.y - 20, 14, '#7df9ff');
          if (hint <= 0) { G.banner('Zzzap! Ficou zonzo ⚡', 1500); hint = 4; }
        } else {
          engolir(m);
          return;
        }
      }
      if (m.x < camX - 800) { m.x = hero.x + W * 0.75; m.zonzo = 0; }
    }

    // amigos morcegos: vão atrás sem estorvar
    for (let i = 0; i < amigos.length; i++) {
      const a = amigos[i];
      a.t += dt;
      const ax = hero.x - 90 - i * 70, ay = hero.y + Math.sin(t * 1.6 + i * 2) * 26 + 26;
      a.x += (ax - a.x) * Math.min(1, dt * 3.2);
      a.y += (ay - a.y) * Math.min(1, dt * 3.2);
    }

    // vai nascendo mais gruta à frente
    while (bolas.length < 3 || bolas[bolas.length - 1].x < camX + W + 600) {
      // bem espaçadas: se aparecerem muitas, a eletricidade nunca acaba e ninguém corre risco
      const bx = (bolas.length ? bolas[bolas.length - 1].x : hero.x) + rnd(2300, 3400);
      novaBola(bx);
    }
    while (bolas.length && bolas[0].x < camX - 700) bolas.shift();
    const caca = monstros.filter(function (m) { return m.state === 'caca'; }).length;
    if (caca < 2 + Math.floor(salvos / 2) && Math.random() < dt * 0.5) {
      novoMonstro(hero.x + W * 0.8 + rnd(0, 300));
    }
    for (let i = monstros.length - 1; i >= 0; i--) {
      if (monstros[i].state === 'amigo' && monstros[i].x < camX - 900) monstros.splice(i, 1);
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 260 * dt;
      if (s.t > s.life) sparks.splice(i, 1);
    }
  };

  /* ---------- desenho ---------- */
  function morcegoArt(c, t, o) {          // centrado na origem
    const cor = o.cor || '#4a3f6b';
    const bat = Math.sin(o.flap || t * 12);
    if (o.raio) {
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + Math.sin(t * 14) * 0.2;
      const rg = c.createRadialGradient(0, 0, 4, 0, 0, 52);
      rg.addColorStop(0, '#7df9ff'); rg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = rg; c.beginPath(); c.arc(0, 0, 52, 0, TAU); c.fill();
      c.restore();
    }
    // asas
    c.fillStyle = cor;
    for (const s of [-1, 1]) {
      c.save(); c.scale(s, 1);
      c.beginPath();
      c.moveTo(6, -2);
      c.quadraticCurveTo(30, -18 - bat * 14, 48, -4 - bat * 18);
      c.quadraticCurveTo(34, 2 - bat * 6, 30, 10);
      c.quadraticCurveTo(22, 2, 6, 8);
      c.closePath(); c.fill();
      c.restore();
    }
    // corpo
    c.fillStyle = cor;
    c.beginPath(); c.ellipse(0, 0, 14, 16, 0, 0, TAU); c.fill();
    // orelhas
    c.beginPath();
    c.moveTo(-9, -12); c.lineTo(-13, -28); c.lineTo(-2, -15); c.closePath();
    c.moveTo(9, -12); c.lineTo(13, -28); c.lineTo(2, -15); c.closePath();
    c.fill();
    c.fillStyle = '#ffb3c6';
    c.beginPath(); c.moveTo(-8, -13); c.lineTo(-10.5, -23); c.lineTo(-4, -15); c.closePath();
    c.moveTo(8, -13); c.lineTo(10.5, -23); c.lineTo(4, -15); c.closePath();
    c.fill();
    // cara
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(-5, -3, 4.6, 0, TAU); c.arc(5, -3, 4.6, 0, TAU); c.fill();
    c.fillStyle = '#22223b';
    c.beginPath(); c.arc(-4, -3, 2.3, 0, TAU); c.arc(6, -3, 2.3, 0, TAU); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.moveTo(-4, 6); c.lineTo(-1, 11); c.lineTo(2, 6); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,120,150,.5)';
    c.beginPath(); c.arc(-10, 2, 3, 0, TAU); c.arc(10, 2, 3, 0, TAU); c.fill();
  }

  function monstroArt(c, t, o) {          // base nos pés (y=0)
    const cores = ['#4cc9a4', '#7b6cf6', '#f4845f'];
    const cor = cores[o.kind % 3];
    const passo = Math.sin(t * 6) * 7;
    const boca = o.boca > 0 ? 1 : (o.state === 'amigo' ? 0.35 : 0.55 + Math.sin(t * 3) * 0.15);
    // pernas
    c.strokeStyle = cor; c.lineWidth = 13; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-14, -26); c.lineTo(-14 + passo, -3); c.stroke();
    c.beginPath(); c.moveTo(14, -26); c.lineTo(14 - passo, -3); c.stroke();
    // corpo redondo
    c.fillStyle = cor;
    c.beginPath(); c.ellipse(0, -56, 38, 36, 0, 0, TAU); c.fill();
    // braços
    c.strokeStyle = cor; c.lineWidth = 11;
    const braco = o.aceno > 0 ? -1.1 + Math.sin(t * 12) * 0.4 : Math.sin(t * 5) * 0.3;
    c.save(); c.translate(-34, -62); c.rotate(-braco);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(-20, 8); c.stroke(); c.restore();
    c.save(); c.translate(34, -62); c.rotate(braco);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(20, 8); c.stroke(); c.restore();
    // barriga
    c.fillStyle = 'rgba(255,255,255,.3)';
    c.beginPath(); c.ellipse(0, -44, 22, 18, 0, 0, TAU); c.fill();
    // olhos
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(-13, -76, 11, 0, TAU); c.arc(13, -76, 11, 0, TAU); c.fill();
    c.fillStyle = '#22223b';
    const olho = o.zonzo > 0 ? Math.sin(t * 14) * 4 : 2;
    c.beginPath(); c.arc(-13 + olho, -76, 5, 0, TAU); c.arc(13 + olho, -76, 5, 0, TAU); c.fill();
    // chifrinhos
    c.fillStyle = cor;
    c.beginPath(); c.moveTo(-20, -88); c.lineTo(-26, -104); c.lineTo(-12, -92); c.closePath();
    c.moveTo(20, -88); c.lineTo(26, -104); c.lineTo(12, -92); c.closePath();
    c.fill();
    // boca com (ou sem) dentes
    c.fillStyle = '#7a1f3d';
    c.beginPath(); c.ellipse(0, -50, 20, 8 + boca * 12, 0, 0, TAU); c.fill();
    if (!o.banguela) {
      c.fillStyle = '#fff';
      for (let k = -2; k <= 2; k++) {
        c.beginPath();
        c.moveTo(k * 8 - 3.5, -50 - boca * 12 + 2);
        c.lineTo(k * 8 + 3.5, -50 - boca * 12 + 2);
        c.lineTo(k * 8, -50 - boca * 12 + 11);
        c.closePath(); c.fill();
      }
    } else {
      c.fillStyle = '#ff8fa3';                       // gengivas a rir
      c.beginPath(); c.ellipse(0, -50 - boca * 6, 15, 5, 0, 0, TAU); c.fill();
    }
    if (o.zonzo > 0) {
      for (let k = 0; k < 3; k++) {
        const a = t * 7 + (k / 3) * TAU;
        G.gfx.star(c, Math.cos(a) * 26, -112 + Math.sin(a) * 7, 7, '#ffd166', a);
      }
    }
  }

  function bolaArt(c, t) {
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55 + Math.sin(t * 8) * 0.2;
    const rg = c.createRadialGradient(0, 0, 3, 0, 0, 46);
    rg.addColorStop(0, '#7df9ff'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = rg; c.beginPath(); c.arc(0, 0, 46, 0, TAU); c.fill();
    c.restore();
    c.fillStyle = '#fff8b0';
    c.beginPath(); c.arc(0, 0, 15, 0, TAU); c.fill();
    c.strokeStyle = '#7df9ff'; c.lineWidth = 3.5; c.lineCap = 'round';
    for (let k = 0; k < 5; k++) {
      const a = t * 3 + (k / 5) * TAU;
      c.beginPath();
      c.moveTo(Math.cos(a) * 15, Math.sin(a) * 15);
      c.lineTo(Math.cos(a + 0.3) * 27, Math.sin(a + 0.3) * 27);
      c.lineTo(Math.cos(a + 0.1) * 36, Math.sin(a + 0.1) * 36);
      c.stroke();
    }
  }

  function desenhaGruta(c, t) {
    const W = vw(), H = vh();
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1b1033'); g.addColorStop(0.5, '#2d1b4e'); g.addColorStop(1, '#160d29');
    c.fillStyle = g; c.fillRect(0, 0, W, H);

    // camadas de rocha ao fundo
    for (let L = 0; L < 2; L++) {
      const p = 0.25 + L * 0.2, a = L === 0 ? '#241645' : '#2f1d57';
      c.fillStyle = a;
      c.beginPath(); c.moveTo(0, H);
      for (let x = 0; x <= W + 40; x += 40) {
        const wx = x + camX * p;
        c.lineTo(x, H * 0.72 - Math.sin(wx * 0.004 + L) * 40 - Math.sin(wx * 0.011) * 18 + L * 30);
      }
      c.lineTo(W, H); c.closePath(); c.fill();
    }

    // cogumelos a brilhar
    for (let i = Math.floor((camX - 400) / 240); i < (camX + W + 400) / 240; i++) {
      if (h01(i * 4.7) < 0.5) continue;
      const x = i * 240 + h01(i) * 120 - camX, y = chao(i * 240 + h01(i) * 120) - 6;
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35;
      const rg = c.createRadialGradient(x, y, 2, x, y, 44);
      rg.addColorStop(0, '#5ce1e6'); rg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = rg; c.beginPath(); c.arc(x, y, 44, 0, TAU); c.fill();
      c.restore();
      c.fillStyle = '#b8b8ff'; c.fillRect(x - 3, y - 14, 6, 14);
      c.fillStyle = '#5ce1e6';
      c.beginPath(); c.ellipse(x, y - 15, 13, 9, 0, Math.PI, 0); c.fill();
    }

    // teto e chão
    c.fillStyle = '#3a2560';
    c.beginPath(); c.moveTo(0, 0);
    for (let x = 0; x <= W + 20; x += 20) c.lineTo(x, teto(x + camX));
    c.lineTo(W, 0); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W + 20; x += 20) c.lineTo(x, chao(x + camX));
    c.lineTo(W, H); c.closePath(); c.fill();

    // estalactites e estalagmites
    for (let i = Math.floor((camX - 600) / SLOT); i < (camX + W + 600) / SLOT; i++) {
      const p = picoAt(i);
      if (!p) continue;
      const x = p.x - camX;
      c.fillStyle = '#4a2f78';
      c.beginPath();
      if (p.cima) {
        const y0 = teto(p.x);
        c.moveTo(x - 26, y0); c.lineTo(x + 26, y0); c.lineTo(x, y0 + p.h);
      } else {
        const y0 = chao(p.x);
        c.moveTo(x - 26, y0); c.lineTo(x + 26, y0); c.lineTo(x, y0 - p.h);
      }
      c.closePath(); c.fill();
    }
  }

  function desenhaBarriga(c, t) {
    const W = vw(), H = vh();
    const g = c.createRadialGradient(W / 2, H * 0.6, 40, W / 2, H * 0.6, Math.max(W, H) * 0.75);
    g.addColorStop(0, '#ff9ebb'); g.addColorStop(1, '#8c2f4a');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // costelas
    c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 14; c.lineCap = 'round';
    for (let k = 0; k < 5; k++) {
      c.beginPath();
      c.arc(W / 2, H * 0.62, W * (0.22 + k * 0.11), Math.PI * 1.15, Math.PI * 1.85);
      c.stroke();
    }
    // bolhinhas
    for (let k = 0; k < 14; k++) {
      const bx = ((k * 137) % 100) / 100 * W;
      const by = H - (((t * 40 + k * 90) % (H + 100)));
      c.fillStyle = 'rgba(255,255,255,.18)';
      c.beginPath(); c.arc(bx, by, 6 + (k % 3) * 4, 0, TAU); c.fill();
    }
    // garganta lá em cima (a saída)
    c.fillStyle = '#5c1d33';
    c.beginPath(); c.ellipse(W / 2, H * 0.075, W * 0.16, H * 0.075, 0, 0, TAU); c.fill();
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + Math.sin(t * 3) * 0.15;
    const lg = c.createRadialGradient(W / 2, H * 0.05, 6, W / 2, H * 0.05, W * 0.2);
    lg.addColorStop(0, '#fff3bf'); lg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = lg; c.beginPath(); c.arc(W / 2, H * 0.05, W * 0.2, 0, TAU); c.fill();
    c.restore();
    const faltam = NDENTES - barriga.apanhados;
    G.gfx.label(c, faltam ? 'faltam ' + faltam + ' 🦷' : 'SAÍDA ⬆', W / 2, H * 0.14, 26, '#ffd166', 'center');

    // dentes guardados na barriga
    for (const d of barriga.dentes) {
      if (d.got) continue;
      const x = d.x * W, y = d.y * H + Math.sin(t * 2 + d.t) * 8;
      c.save(); c.translate(x, y); c.rotate(Math.sin(t + d.t) * 0.2); c.scale(1.6, 1.6);
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.moveTo(-14, -16); c.quadraticCurveTo(14, -20, 14, -12);
      c.quadraticCurveTo(12, 6, 4, 16); c.quadraticCurveTo(0, 4, -4, 16);
      c.quadraticCurveTo(-14, 4, -14, -16);
      c.closePath(); c.fill();
      c.fillStyle = 'rgba(0,0,0,.12)';
      c.beginPath(); c.ellipse(-6, -8, 4, 6, 0, 0, TAU); c.fill();
      c.restore();
    }
  }

  S.draw = function (c, t) {
    const vs = vscale(), W = vw(), H = vh();
    c.save(); c.scale(vs, vs);

    if (fase === 'barriga' || fase === 'sair' || fase === 'engolido') {
      if (fase === 'engolido') {
        desenhaGruta(c, t);
        const m = barriga.monstro, x = m.x - camX;
        c.save(); c.translate(x, m.y); monstroArt(c, t, m); c.restore();
        c.save(); c.globalAlpha = Math.max(0, 1 - ft / 0.9);
        c.translate(hero.x - camX + (x - (hero.x - camX)) * (ft / 0.9),
                    hero.y + (m.y - 50 - hero.y) * (ft / 0.9));
        c.scale(1 - ft * 0.6, 1 - ft * 0.6);
        morcegoArt(c, t, { flap: hero.flap });
        c.restore();
      } else {
        desenhaBarriga(c, t);
        const hx = hero.x * W, hy = hero.y * H;
        c.save(); c.translate(hx, hy);
        if (fase === 'sair') { c.translate(0, -ft * H * 0.6); c.scale(1 - ft * 0.4, 1 - ft * 0.4); }
        c.scale(1.5, 1.5);
        if (hero.dir < 0) c.scale(-1, 1);
        morcegoArt(c, t, { flap: hero.flap });
        c.restore();
        for (const s of sparks) {
          c.globalAlpha = Math.max(0, 1 - s.t / s.life);
          G.gfx.star(c, s.x, s.y, 7, s.col, s.t * 6);
          c.globalAlpha = 1;
        }
      }
      c.restore();
      // HUD da barriga
      G.gfx.star(c, 36, 46, 18, '#ffd166', 0);
      G.gfx.label(c, '' + G.state.stars, 64, 47, 32, '#b56b00');
      if (barriga) G.gfx.label(c, '🦷 ' + barriga.apanhados + '/' + NDENTES, 24, 92, 26, '#7a1f3d', 'left');
      return;
    }

    desenhaGruta(c, t);

    const j0 = Math.floor((camX - 600) / SLOT), j1 = Math.floor((camX + W + 600) / SLOT);
    for (let i = Math.max(0, j0); i <= j1; i++) {
      const lista = estrelasAt(i);
      for (let k = 0; k < lista.length; k++) {
        if (apanhadas[i + ':' + k]) continue;
        const s = lista[k];
        G.gfx.star(c, s.x - camX, s.y + Math.sin(t * 3 + i + k) * 5, 14, '#ffd166', t * 1.2);
      }
    }

    for (const b of bolas) {
      if (b.apanhada) continue;
      const x = b.x - camX;
      if (x < -80 || x > W + 80) continue;
      c.save(); c.translate(x, b.y + Math.sin(t * 1.6 + b.t) * 12); bolaArt(c, t + b.t); c.restore();
    }

    for (const m of monstros) {
      const x = m.x - camX;
      if (x < -160 || x > W + 160) continue;
      c.save(); c.translate(x, m.y + 60);
      if (hero.x < m.x) c.scale(-1, 1);
      monstroArt(c, t + m.t, m);
      c.restore();
      if (m.state === 'amigo' && m.aceno > 0) {
        G.gfx.bubble(c, Math.max(96, Math.min(W - 96, x)), m.y - 70, 'Obrigado! 😁');
      }
    }

    for (const a of amigos) {
      c.save(); c.translate(a.x - camX, a.y); c.scale(0.75, 0.75);
      morcegoArt(c, t + a.t, { cor: a.cor, flap: t * 11 + a.t });
      c.restore();
    }

    c.save();
    c.translate(hero.x - camX, hero.y);
    c.globalAlpha = hero.inv > 0 && Math.floor(t * 10) % 2 === 0 ? 0.55 : 1;
    if (hero.dir < 0) c.scale(-1, 1);
    c.rotate(Math.max(-0.35, Math.min(0.35, hero.vy / 900)));
    c.scale(1.25, 1.25);
    morcegoArt(c, t, { flap: hero.flap, raio: raio > 0 });
    c.restore();

    for (const s of sparks) {
      c.globalAlpha = Math.max(0, 1 - s.t / s.life);
      G.gfx.star(c, s.x - camX, s.y, 7, s.col, s.t * 6);
      c.globalAlpha = 1;
    }

    c.restore();

    // HUD
    G.gfx.star(c, 36, 46, 18, '#ffd166', 0);
    G.gfx.label(c, '' + G.state.stars, 64, 47, 32, '#b56b00');
    G.gfx.label(c, '😁 ' + salvos, 24, 92, 26, '#4a2f78', 'left');
    if (raio > 0) {
      G.gfx.rr(c, 24, 112, 150 * (raio / RAIO_T), 14, 7);
      c.fillStyle = '#7df9ff'; c.fill();
      G.gfx.label(c, '⚡ SUPER RÁPIDO', 24, 148, 22, '#0b5f80', 'left');
    }
  };

  S.debug = function () {
    return {
      x: Math.round(fase === 'barriga' ? hero.x * 100 : hero.x),
      y: Math.round(fase === 'barriga' ? hero.y * 100 : hero.y),
      fase: fase, raio: +raio.toFixed(1), salvos: salvos,
      monstros: monstros.filter(function (m) { return m.state === 'caca'; }).length,
      amigosMonstro: monstros.filter(function (m) { return m.state === 'amigo'; }).length,
      dentes: barriga ? barriga.apanhados : -1, stars: G.state.stars, bolas: bolas.filter(function (b) { return !b.apanhada; }).length
    };
  };

  G.scenes = G.scenes || {};
  G.scenes.morcegos = S;
})();
