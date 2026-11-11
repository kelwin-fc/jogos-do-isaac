/* Cena — O REI A CAVALO, ditada pelo Isaac (2026-11-11).

   "Nós somos um rei e estamos em cima de um cavalo e disparamos setas. E aos que
   disparamos setas ficam da nossa equipa, e também disparam setas, até conseguirmos
   o reino todo e conseguirmos vencer. E quando vencermos, ganhamos."

   Como ficou:
   - Somos o rei de coroa e capa azul, montado num cavalo branco. ◀ ▶ galopa, ⬆ salta,
     🏹 dispara setas (segurar dispara sempre; a seta vai ao soldado vermelho mais perto
     que está à frente) e 📯 toca a corneta: toda a nossa equipa dispara ao mesmo tempo.
   - Os soldados do Rei Vermelho (arqueiros a pé e cavaleiros) disparam setas ao rei.
     Quando uma seta nossa lhes acerta as vezes que for preciso, ninguém se magoa: eles
     largam a bandeira vermelha, ficam AZUIS e passam a ser da nossa equipa. Vêm atrás
     de nós e disparam setas aos vermelhos que ainda faltam.
   - O reino tem cinco terras, cada uma com um castelo ao fundo. Os arqueiros vermelhos
     estão em cima das muralhas; quando ficam todos azuis o portão abre-se, a bandeira
     passa a ser a nossa e passamos o portão para a terra seguinte (a equipa vem connosco).
   - No último castelo está o Rei Vermelho, lá no alto da torre. Quando fica da nossa
     equipa, conquistámos o REINO TODO e ganhámos: festa com fogo de artifício e a coroa
     grande. Depois começa outra volta ao reino, mais difícil.
   - Nunca há derrota: sem corações o rei senta-se a descansar um bocadinho e volta. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  const GRAV = 2200, SALTO = 920, VEL_REI = 330;
  const SETA_V = 980, MAXC = 5, MAX_EQUIPA = 8;
  const TERRAS = [
    { id: 'aldeia', nome: 'A aldeia dos moinhos', fala: 'A aldeia dos moinhos! Ao ataque!', ceu: ['#8ecae6', '#dff3ff'], monte: '#95d5b2', perto: '#52b788', chao: '#74c69d', caminho: '#d4a373', grupos: 8, muralha: 4 },
    { id: 'floresta', nome: 'A floresta verde', fala: 'A floresta verde! Cuidado com os arqueiros!', ceu: ['#90e0ef', '#e9f5db'], monte: '#6a994e', perto: '#386641', chao: '#57a773', caminho: '#bc8a5f', grupos: 9, muralha: 4 },
    { id: 'rio', nome: 'O rio da ponte', fala: 'O rio da ponte! Os cavaleiros vêm aí!', ceu: ['#a2d2ff', '#e0fbfc'], monte: '#a3b18a', perto: '#588157', chao: '#80b918', caminho: '#c9a36b', grupos: 10, muralha: 5 },
    { id: 'montanha', nome: 'As montanhas de neve', fala: 'As montanhas de neve! Está quase!', ceu: ['#bde0fe', '#f1faee'], monte: '#adb5bd', perto: '#6c757d', chao: '#8fbc8f', caminho: '#b08968', grupos: 11, muralha: 5 },
    { id: 'capital', nome: 'O castelo do Rei Vermelho', fala: 'O castelo do Rei Vermelho! Vamos ganhar o reino!', ceu: ['#ffb4a2', '#ffe5d9'], monte: '#b5838d', perto: '#6d6875', chao: '#7cb518', caminho: '#c08552', grupos: 12, muralha: 6, rei: true }
  ];
  const AZUL = { tunica: '#1e6fd9', escuro: '#164e9c', capa: '#1e6fd9' };
  const VERM = { tunica: '#d62828', escuro: '#9d0208', capa: '#d62828' };

  let rei, ents, setas, setasChao, parts, textos, camX, terra, ronda, tempo, castelo, LEN;
  let fase, faseT, cornetaCd, conquistados, festa;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function h01(n) { const v = Math.sin(n * 127.1 + 3.3) * 43758.5; return v - Math.floor(v); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function vscale() { return Math.min(1, G.H / 620, G.W / 700); }
  function vw() { return G.W / vscale(); }
  function vh() { return G.H / vscale(); }
  // a linha do chão fica acima dos botões (ao alto há duas filas deles)
  function chaoY() {
    const reserva = G.W < 560 && G.H > G.W ? 236 : 122;
    return Math.min(vh() * 0.86, Math.max(vh() * 0.55, (G.H - reserva) / vscale()));
  }
  function fala(t) { if (G.audio.fala) G.audio.fala(t); }
  function sfx(n) { G.audio.sfx(n); }
  function T() { return TERRAS[terra]; }
  function texto(t, x, y) { textos.push({ t: t, x: x, y: y, life: 1.3, age: 0 }); }

  S.enter = function () {
    ronda = 1; tempo = 0; conquistados = 0; festa = null;
    comecaTerra(0, 0);
  };

  /* ---------- uma terra nova: soldados pelo caminho e o castelo ao fundo ---------- */
  function comecaTerra(i, levaEquipa) {
    terra = i;
    LEN = 4200 + i * 300;
    camX = 0;
    setas = []; setasChao = []; parts = []; textos = [];
    rei = { x: 220, y: 0, vy: 0, dir: 1, noChao: true, galope: 0, cd: 0, arco: 0, inv: 2, coracoes: MAXC, descansa: 0 };
    ents = [];
    castelo = { x: LEN - 420, aberto: 0, conquistado: false, bandeira: 0 };
    const n = T().grupos + (ronda - 1);
    const de = 1000, ate = castelo.x - 820, passo = (ate - de) / n;
    for (let g = 0; g < n; g++) {
      const gx = de + g * passo + rnd(0, passo * 0.4);
      const quantos = 2 + Math.floor(rnd(0, 1.6 + i * 0.4));
      for (let k = 0; k < quantos; k++) ents.push(soldado('arqueiro', gx + k * 70, 'mau'));
      if (Math.random() < 0.35 + i * 0.13) ents.push(soldado('cavaleiro', gx + 220, 'mau'));
    }
    // os arqueiros em cima das muralhas do castelo
    const m = T().muralha, larg = 440;
    for (let k = 0; k < m; k++) {
      const e = soldado('arqueiro', castelo.x - larg / 2 + (k + 0.5) * (larg / m), 'mau');
      e.muralha = true; e.y = -230; e.hp = e.max = e.max + 1;
      ents.push(e);
    }
    if (T().rei) {
      const r = soldado('reimau', castelo.x, 'mau');
      r.muralha = true; r.y = -350; r.hp = r.max = 20 + (ronda - 1) * 5;
      ents.push(r);
    }
    // a nossa equipa vem connosco de terra em terra
    for (let k = 0; k < Math.min(levaEquipa || 0, MAX_EQUIPA); k++) {
      const tipo = k % 4 === 3 ? 'cavaleiro' : 'arqueiro';
      ents.push(soldado(tipo, rei.x - 120 - k * 60, 'nosso'));
    }
    fase = 'joga'; faseT = 0; cornetaCd = 0;
    G.banner('👑 ' + T().nome, 2400);
    fala(T().fala);
  }

  function soldado(tipo, x, equipa) {
    const hp = tipo === 'cavaleiro' ? 5 : 3;
    return { tipo: tipo, x: x, y: 0, vx: 0, dir: -1, equipa: equipa, hp: hp + Math.floor((ronda - 1) / 2), max: hp + Math.floor((ronda - 1) / 2),
      cd: rnd(1.2, 3), pisca: 0, passo: rnd(0, 6), arco: 0, viraT: 0, festa: 0 };
  }
  function vermelhos() { return ents.filter(function (e) { return e.equipa === 'mau'; }); }
  function equipa() { return ents.filter(function (e) { return e.equipa === 'nosso'; }); }

  // o corpo de cada um (para as setas acertarem)
  function caixa(e) {
    if (e.tipo === 'cavaleiro') return { x: e.x, y: e.y - 80, rx: 50, ry: 70 };
    if (e.tipo === 'reimau') return { x: e.x, y: e.y - 58, rx: 34, ry: 58 };
    return { x: e.x, y: e.y - 44, rx: 22, ry: 44 };
  }
  function caixaRei() { return { x: rei.x, y: rei.y - 82, rx: 54, ry: 76 }; }
  function dentro(b, x, y) { return Math.abs(x - b.x) < b.rx && Math.abs(y - b.y) < b.ry; }

  /* ---------- as setas: sobem em arco e caem com a gravidade ---------- */
  const G_SETA = 520;
  function disparaSeta(x, y, alvo, v, nossa, espalha) {
    let ang;
    if (alvo) {
      const dx = alvo.x - x, d = Math.abs(dx), tvoo = d / v;
      const sobe = 0.5 * G_SETA * tvoo * tvoo;          // aponta mais acima para a queda
      ang = Math.atan2(alvo.y - sobe - y, dx);
    } else ang = nossa && rei.dir < 0 ? Math.PI + 0.08 : -0.08;
    ang += rnd(-espalha, espalha);
    setas.push({ x: x, y: y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, nossa: nossa, t: 0 });
  }
  function alvoMaisPerto(x, y, lista, alcance, frente) {
    let melhor = null, md = 1e9;
    for (const e of lista) {
      const b = caixa(e), dx = b.x - x;
      if (frente && dx * frente < -20) continue;
      const d = Math.abs(dx) + Math.abs(b.y - y) * 0.6;
      if (Math.abs(dx) > alcance || d > md) continue;
      md = d; melhor = b;
    }
    return melhor;
  }
  function reiDispara() {
    const x = rei.x + rei.dir * 46, y = rei.y - 120;
    const alvo = alvoMaisPerto(x, y, vermelhos(), 900, rei.dir);
    disparaSeta(x, y, alvo, SETA_V, true, 0.02);
    rei.arco = 0.18;
    sfx('arco');
  }
  function corneta() {
    cornetaCd = 10;
    sfx('horn');
    const eq = equipa();
    const vs = vermelhos();
    if (!eq.length) {        // ainda sozinho: o rei dispara três setas de uma vez
      for (let k = -1; k <= 1; k++) {
        const x = rei.x + rei.dir * 46, y = rei.y - 120;
        disparaSeta(x, y, alvoMaisPerto(x, y, vs, 900, rei.dir), SETA_V, true, 0.05 + Math.abs(k) * 0.06);
      }
      fala('Três setas!');
      return;
    }
    for (const e of eq) {
      const b = caixa(e);
      const alvo = alvoMaisPerto(b.x, b.y - 20, vs, 900, 0);
      if (alvo) { disparaSeta(b.x, b.y - 20, alvo, 860, true, 0.04); e.arco = 0.2; e.cd = rnd(1.4, 2.4); }
    }
    G.banner('📯 Ao ataque!', 1200);
    fala('Ao ataque!');
  }

  /* ---------- acertar: ficam da nossa equipa ---------- */
  function acerta(e) {
    if (e.equipa !== 'mau') return;
    e.hp--; e.pisca = 0.25;
    const b = caixa(e);
    estrelinhas(b.x, b.y - 20, 4, '#ffd166');
    if (e.hp > 0) { sfx('pop'); return; }
    e.equipa = 'nosso'; e.festa = 1.2; e.cd = rnd(1, 2);
    G.addStars(e.tipo === 'reimau' ? 10 : 1);
    estrelinhas(b.x, b.y - 30, 14, '#4cc9f0');
    texto('💙', b.x, b.y - b.ry - 30);
    sfx('tada');
    if (e.tipo === 'reimau') {
      G.banner('👑 O Rei Vermelho é da nossa equipa!', 2600);
      fala('O Rei Vermelho agora é nosso amigo!');
    } else if (Math.random() < 0.5) fala(['Agora és da nossa equipa!', 'Mais um para a equipa!', 'Viva o rei!'][Math.floor(rnd(0, 3))]);
    if (!e.muralha && equipa().length > MAX_EQUIPA) {
      // a equipa já é grande: este vai para casa a acenar (ninguém fica de fora triste)
      e.vaiCasa = true;
    }
  }
  function magoaRei() {
    if (rei.inv > 0 || rei.descansa > 0 || fase !== 'joga') return;
    rei.coracoes = Math.max(0, rei.coracoes - 0.5);
    rei.inv = 1.2; G.shake = 0.3;
    sfx('ouch');
    estrelinhas(rei.x, rei.y - 110, 6, '#ff6b6b');
    if (rei.coracoes <= 0) {
      rei.descansa = 2.6;
      G.banner('O rei vai descansar um bocadinho 💤', 2400);
      fala('O rei está cansado. Vai descansar um bocadinho!');
      setas = setas.filter(function (s) { return s.nossa; });
    }
  }
  function estrelinhas(x, y, n, cor) {
    for (let i = 0; i < n; i++) parts.push({ x: x, y: y, vx: rnd(-220, 220), vy: rnd(-320, -60), t: 0, life: rnd(0.5, 0.9), cor: cor, r: rnd(4, 8) });
  }

  /* ---------- update ---------- */
  S.update = function (dt) {
    dt = Math.min(dt, 1 / 30);
    tempo += dt;
    const I = G.input, ax = I.axis().x;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.t += dt; p.vy += 700 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.t > p.life) parts.splice(i, 1);
    }
    for (let i = textos.length - 1; i >= 0; i--) { textos[i].age += dt; textos[i].y -= 40 * dt; if (textos[i].age > textos[i].life) textos.splice(i, 1); }

    if (fase === 'passa') {           // a passar o portão para a terra seguinte
      faseT += dt;
      rei.x += VEL_REI * dt; rei.galope += dt * 14; rei.dir = 1;
      for (const e of equipa()) { e.x += 300 * dt; e.dir = 1; e.passo += dt * 10; }
      camX += (rei.x - vw() * 0.35 - camX) * Math.min(1, dt * 3);
      if (faseT > 2.2) comecaTerra((terra + 1) % TERRAS.length, equipa().filter(function (e) { return !e.vaiCasa; }).length);
      return;
    }
    if (fase === 'festa') {
      faseT += dt;
      if (Math.random() < dt * 6) fogo(camX + rnd(100, vw() - 100), rnd(-vh() * 0.6, -vh() * 0.3));
      for (const e of ents) e.festa = 1;
      if (faseT > 10) {
        ronda++;
        G.banner('👑 Outra volta ao reino! Agora é mais difícil', 2600);
        comecaTerra(0, 0);
      }
      return;
    }

    // o rei
    rei.inv = Math.max(0, rei.inv - dt); rei.arco = Math.max(0, rei.arco - dt); rei.cd -= dt;
    cornetaCd = Math.max(0, cornetaCd - dt);
    if (rei.descansa > 0) {
      rei.descansa -= dt;
      if (rei.descansa <= 0) { rei.coracoes = MAXC; rei.inv = 2; sfx('suit'); G.banner('O rei está pronto! 👑', 1600); }
    } else {
      const v = ax * VEL_REI;
      if (Math.abs(ax) > 0.1) rei.dir = ax > 0 ? 1 : -1;
      rei.x += v * dt;
      if (rei.noChao && Math.abs(v) > 10) rei.galope += dt * Math.abs(v) / 24;
      if (I.justPressed('jump') && rei.noChao) { rei.vy = -SALTO; rei.noChao = false; sfx('hop'); }
      if (I.isHeld('fire') && rei.cd <= 0) { reiDispara(); rei.cd = 0.36; }
      if (I.justPressed('horn') && cornetaCd <= 0) corneta();
    }
    rei.vy += GRAV * dt; rei.y += rei.vy * dt;
    if (rei.y >= 0) { rei.y = 0; rei.vy = 0; rei.noChao = true; }
    const muro = castelo.aberto < 1 ? castelo.x - 290 : LEN + 400;
    rei.x = clamp(rei.x, 80, muro);
    camX += (clamp(rei.x - vw() * 0.38, 0, LEN + 400 - vw()) - camX) * Math.min(1, dt * 4);

    // os soldados
    const eq = equipa(), vs = vermelhos();
    let slot = 0;
    for (const e of ents) {
      e.pisca = Math.max(0, e.pisca - dt); e.arco = Math.max(0, e.arco - dt); e.festa = Math.max(0, e.festa - dt);
      const b = caixa(e);
      if (e.equipa === 'mau') {
        const dx = rei.x - e.x, longe = Math.abs(dx);
        e.dir = dx > 0 ? 1 : -1;
        if (e.tipo === 'cavaleiro' && longe < 1100) {
          // o cavaleiro aproxima-se até ficar a uma distância de tiro, e anda para lá e para cá
          const quer = longe > 420 ? e.dir * 210 : (longe < 280 ? -e.dir * 160 : Math.sin(tempo * 1.3 + e.passo) * 80);
          e.vx += (quer - e.vx) * Math.min(1, dt * 3);
          e.x += e.vx * dt; e.passo += Math.abs(e.vx) * dt / 22;
          e.x = Math.min(e.x, castelo.x - 300);
        }
        // dispara quando o rei está perto (e a descansar ninguém lhe dispara)
        const alcance = e.muralha ? 980 : 860;
        if (longe < alcance && rei.descansa <= 0 && Math.abs(e.x - camX - vw() / 2) < vw() * 0.75) {
          e.cd -= dt;
          if (e.cd <= 0) {
            const forte = 1 + (ronda - 1) * 0.15;
            const v = (640 + terra * 30 + (ronda - 1) * 40);
            disparaSeta(b.x, b.y - 20, { x: rei.x + rei.dir * rnd(0, 60), y: rei.y - 90 }, v, false, 0.05);
            if (e.tipo === 'reimau') {
              disparaSeta(b.x, b.y - 20, { x: rei.x - 90, y: rei.y - 90 }, v, false, 0.07);
              disparaSeta(b.x, b.y - 20, { x: rei.x + 90, y: rei.y - 90 }, v, false, 0.07);
            }
            e.arco = 0.2;
            e.cd = (e.tipo === 'reimau' ? rnd(1.1, 1.6) : rnd(1.5, 2.6)) / forte;
          }
        }
      } else {
        // da nossa equipa: vem atrás do rei e dispara aos vermelhos
        if (e.vaiCasa) {
          e.dir = -1; e.x -= 200 * dt; e.passo += dt * 8;
          continue;
        }
        if (!e.muralha) {
          const alvoX = rei.x - rei.dir * (110 + slot * 58);
          slot++;
          const d = alvoX - e.x, vel = e.tipo === 'cavaleiro' ? 380 : 300;
          const q = Math.abs(d) > 20 ? clamp(d * 3, -vel, vel) : 0;
          e.vx += (q - e.vx) * Math.min(1, dt * 5);
          e.x += e.vx * dt; e.passo += Math.abs(e.vx) * dt / 22;
          e.x = Math.min(e.x, muro - 20);
          if (Math.abs(e.vx) > 20) e.dir = e.vx > 0 ? 1 : -1; else e.dir = rei.dir;
        }
        e.cd -= dt;
        if (e.cd <= 0) {
          const alvo = alvoMaisPerto(b.x, b.y - 20, vs, 760, 0);
          if (alvo && Math.abs(b.x - camX - vw() / 2) < vw() * 0.7) {
            e.dir = alvo.x > b.x ? 1 : -1;
            disparaSeta(b.x, b.y - 20, alvo, 860, true, 0.06);
            e.arco = 0.2;
            e.cd = rnd(2.4, 3.6);
          } else e.cd = 0.4;
        }
      }
    }
    // os que já foram para casa saem do jogo quando deixam de se ver
    ents = ents.filter(function (e) { return !(e.vaiCasa && e.x < camX - 200); });

    // as setas
    for (let i = setas.length - 1; i >= 0; i--) {
      const s = setas[i];
      s.t += dt; s.vy += G_SETA * dt; s.x += s.vx * dt; s.y += s.vy * dt;
      let fora = false;
      if (s.nossa) {
        for (const e of ents) {
          if (e.equipa !== 'mau') continue;
          if (dentro(caixa(e), s.x, s.y)) { acerta(e); fora = true; break; }
        }
      } else if (dentro(caixaRei(), s.x, s.y)) { magoaRei(); fora = true; }
      if (!fora && s.y >= 0) {           // espetou-se no chão
        setasChao.push({ x: s.x, a: Math.atan2(s.vy, s.vx), t: 0, nossa: s.nossa });
        if (setasChao.length > 40) setasChao.shift();
        fora = true;
      }
      if (fora || s.t > 4) setas.splice(i, 1);
    }
    for (const s of setasChao) s.t += dt;

    // o castelo: com os da muralha todos azuis o portão abre
    if (!castelo.conquistado && !ents.some(function (e) { return e.muralha && e.equipa === 'mau'; })) {
      castelo.conquistado = true;
      conquistados++;
      sfx('tada'); G.addStars(5);
      for (let k = 0; k < 10; k++) estrelinhas(castelo.x + rnd(-200, 200), -260 + rnd(-60, 60), 3, ['#4cc9f0', '#ffd166', '#ffffff'][k % 3]);
      if (T().rei) {
        fase = 'festa'; faseT = 0;
        G.banner('🏆 GANHASTE O REINO TODO! 👑', 6000);
        fala('Conquistámos o reino todo! Ganhámos! Viva o rei!');
        G.addStars(20);
        return;
      }
      G.banner('🏰 Conquistámos o castelo! Passa o portão ▶', 2600);
      fala('Conquistámos o castelo! Vamos para a terra seguinte!');
    }
    if (castelo.conquistado) {
      castelo.aberto = Math.min(1, castelo.aberto + dt * 0.8);
      castelo.bandeira = Math.min(1, castelo.bandeira + dt * 0.7);
      if (castelo.aberto >= 1 && rei.x > castelo.x - 40) { fase = 'passa'; faseT = 0; sfx('whoosh'); }
    }
  };

  function fogo(x, y) {
    const cor = ['#ffd166', '#4cc9f0', '#ff6fb1', '#8ac926', '#ffffff'][Math.floor(rnd(0, 5))];
    for (let i = 0; i < 18; i++) {
      const a = i / 18 * TAU;
      parts.push({ x: x, y: y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, t: 0, life: 1, cor: cor, r: 5 });
    }
    sfx('pop');
  }

  /* ---------- desenhar ---------- */
  S.draw = function (c, t) {
    const vs = vscale(), W = vw(), H = vh(), chao = chaoY();
    c.save(); c.scale(vs, vs);
    fundo(c, W, H, chao, t);
    c.save(); c.translate(-camX, chao);
    for (const s of setasChao) setaNoChao(c, s);
    desenhaCastelo(c, t);
    // primeiro os da muralha (estão atrás das ameias? não: em cima delas), depois o chão
    for (const e of ents) if (e.muralha) desenhaSoldado(c, e, t);
    for (const e of ents) if (!e.muralha && e.equipa === 'mau') desenhaSoldado(c, e, t);
    for (const e of ents) if (!e.muralha && e.equipa === 'nosso') desenhaSoldado(c, e, t);
    desenhaRei(c, t);
    for (const s of setas) desenhaSeta(c, s.x, s.y, Math.atan2(s.vy, s.vx), s.nossa);
    for (const p of parts) { c.globalAlpha = Math.max(0, 1 - p.t / p.life); c.fillStyle = p.cor; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); }
    c.globalAlpha = 1;
    for (const tx of textos) {
      c.globalAlpha = Math.max(0, 1 - tx.age / tx.life);
      c.font = '34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000';
      c.fillText(tx.t, tx.x, tx.y);
    }
    c.globalAlpha = 1;
    // a seta a apontar para o castelo quando ele ainda não se vê
    c.restore();
    if (fase === 'festa') desenhaFesta(c, W, H, t);
    c.restore();
    hud(c, t);
  };

  function fundo(c, W, H, chao, t) {
    const d = T();
    const g = c.createLinearGradient(0, 0, 0, chao);
    g.addColorStop(0, d.ceu[0]); g.addColorStop(1, d.ceu[1]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // sol
    c.fillStyle = 'rgba(255,214,10,.9)'; c.beginPath(); c.arc(W * 0.8, H * 0.16, 38, 0, TAU); c.fill();
    // nuvens
    for (let i = 0; i < 5; i++) {
      const x = ((i * 380 - camX * 0.1 + t * 12) % (W + 400) + W + 400) % (W + 400) - 200;
      G.gfx.cloud(c, x, H * (0.12 + h01(i) * 0.15), 0.9 + h01(i + 5) * 0.5, 0.85);
    }
    // montes ao longe (com neve nas montanhas)
    rep(W, 0.2, 520, function (x, i) {
      const alt = 160 + h01(i) * 120;
      c.fillStyle = d.monte;
      c.beginPath(); c.moveTo(x - 300, chao); c.lineTo(x, chao - alt); c.lineTo(x + 300, chao); c.fill();
      if (d.id === 'montanha') {
        c.fillStyle = '#f8f9fa';
        c.beginPath(); c.moveTo(x - 70, chao - alt + 54); c.lineTo(x, chao - alt); c.lineTo(x + 70, chao - alt + 54); c.lineTo(x + 25, chao - alt + 40); c.lineTo(x, chao - alt + 58); c.lineTo(x - 25, chao - alt + 40); c.fill();
      }
    });
    // castelinhos lá ao fundo: o reino todo
    rep(W, 0.3, 900, function (x, i) { castelinho(c, x, chao - 90 - h01(i + 3) * 60, 0.5 + h01(i) * 0.3, i % 5 < conquistados); });
    // coisas mais perto: moinhos, árvores, rio, rochas
    rep(W, 0.55, 300, function (x, i) {
      const k = h01(i + 11);
      if (d.id === 'aldeia') { if (k < 0.35) moinho(c, x, chao - 20, t + i); else if (k < 0.75) casinha(c, x, chao - 18, i); else arvore(c, x, chao - 16, d.perto); }
      else if (d.id === 'floresta') { arvore(c, x, chao - 16, d.perto); if (k < 0.5) arvore(c, x + 120, chao - 10, d.monte); }
      else if (d.id === 'rio') { if (k < 0.5) arvore(c, x, chao - 16, d.perto); else casinha(c, x, chao - 18, i); }
      else if (d.id === 'montanha') { if (k < 0.6) pinheiro(c, x, chao - 14); else rocha(c, x, chao - 10); }
      else { if (k < 0.5) casinha(c, x, chao - 18, i); else arvore(c, x, chao - 16, d.perto); }
    });
    // o chão e o caminho
    c.fillStyle = d.chao; c.fillRect(0, chao - 22, W, H - chao + 22);
    if (d.id === 'rio') {
      c.fillStyle = '#4cc9f0'; c.fillRect(0, chao - 30, W, 10);
      c.fillStyle = 'rgba(255,255,255,.6)';
      for (let x = -((camX * 0.9 + t * 40) % 80); x < W; x += 80) c.fillRect(x, chao - 27, 30, 3);
    }
    c.fillStyle = d.caminho; c.fillRect(0, chao - 6, W, 30);
    c.fillStyle = 'rgba(0,0,0,.08)';
    for (let x = -(camX % 60); x < W; x += 60) c.fillRect(x, chao + 6, 22, 5);
  }
  // repete um desenho ao longo do fundo com paralaxe
  function rep(W, par, passo, fn) {
    const off = camX * par, i0 = Math.floor((off - 400) / passo), i1 = Math.ceil((off + W + 400) / passo);
    for (let i = i0; i <= i1; i++) fn(i * passo - off + h01(i * 7) * passo * 0.4, i);
  }
  function arvore(c, x, y, cor) {
    c.fillStyle = '#7f5539'; c.fillRect(x - 7, y - 60, 14, 60);
    c.fillStyle = cor;
    c.beginPath(); c.arc(x, y - 80, 40, 0, TAU); c.arc(x - 28, y - 58, 28, 0, TAU); c.arc(x + 28, y - 58, 28, 0, TAU); c.fill();
  }
  function pinheiro(c, x, y) {
    c.fillStyle = '#7f5539'; c.fillRect(x - 6, y - 26, 12, 26);
    c.fillStyle = '#2d6a4f';
    for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(x - 46 + k * 9, y - 22 - k * 34); c.lineTo(x, y - 82 - k * 34); c.lineTo(x + 46 - k * 9, y - 22 - k * 34); c.fill(); }
    c.fillStyle = '#f8f9fa'; c.beginPath(); c.moveTo(x - 14, y - 136); c.lineTo(x, y - 160); c.lineTo(x + 14, y - 136); c.fill();
  }
  function rocha(c, x, y) {
    c.fillStyle = '#868e96'; c.beginPath(); c.ellipse(x, y, 50, 30, 0, Math.PI, 0); c.fill();
    c.fillStyle = '#adb5bd'; c.beginPath(); c.ellipse(x - 12, y - 10, 20, 10, 0, Math.PI, 0); c.fill();
  }
  function casinha(c, x, y, i) {
    const cores = ['#ffe8d6', '#fefae0', '#f1dca7', '#e9edc9'];
    c.fillStyle = cores[Math.abs(i) % 4]; c.fillRect(x - 40, y - 60, 80, 60);
    c.fillStyle = '#bc4749'; c.beginPath(); c.moveTo(x - 50, y - 58); c.lineTo(x, y - 100); c.lineTo(x + 50, y - 58); c.fill();
    c.fillStyle = '#7f5539'; c.fillRect(x - 10, y - 32, 20, 32);
    c.fillStyle = '#a2d2ff'; c.fillRect(x + 16, y - 48, 16, 14); c.fillRect(x - 32, y - 48, 16, 14);
  }
  function moinho(c, x, y, t) {
    c.fillStyle = '#f8f9fa'; c.beginPath(); c.moveTo(x - 28, y); c.lineTo(x - 18, y - 110); c.lineTo(x + 18, y - 110); c.lineTo(x + 28, y); c.fill();
    c.fillStyle = '#bc4749'; c.beginPath(); c.moveTo(x - 24, y - 108); c.lineTo(x, y - 134); c.lineTo(x + 24, y - 108); c.fill();
    c.save(); c.translate(x, y - 112); c.rotate(t * 1.2);
    c.fillStyle = '#e9d8a6';
    for (let k = 0; k < 4; k++) { c.rotate(TAU / 4); c.fillRect(-6, 4, 12, 56); }
    c.restore();
    c.fillStyle = '#495057'; c.beginPath(); c.arc(x, y - 112, 5, 0, TAU); c.fill();
  }
  function castelinho(c, x, y, k, nosso) {
    c.save(); c.translate(x, y); c.scale(k, k);
    c.fillStyle = 'rgba(108,117,125,.55)';
    c.fillRect(-60, -60, 120, 60); c.fillRect(-80, -100, 34, 100); c.fillRect(46, -100, 34, 100); c.fillRect(-20, -130, 40, 70);
    c.fillStyle = nosso ? '#1e6fd9' : '#d62828';
    c.beginPath(); c.moveTo(0, -130); c.lineTo(0, -170); c.lineTo(30, -160); c.lineTo(0, -150); c.fill();
    c.restore();
  }

  function desenhaCastelo(c, t) {
    const x = castelo.x, w = 520, h = 230, x0 = x - w / 2;
    const pedra = '#adb5bd', escura = '#868e96';
    // torres dos lados
    for (const tx of [x0 - 30, x0 + w - 50]) {
      c.fillStyle = escura; c.fillRect(tx, -330, 80, 330);
      for (let k = 0; k < 4; k++) c.fillRect(tx - 6 + k * 24, -352, 16, 24);
      c.fillStyle = '#495057'; c.fillRect(tx + 30, -260, 20, 36);
      bandeira(c, tx + 40, -352, t);
    }
    // muralha
    c.fillStyle = pedra; c.fillRect(x0, -h, w, h);
    c.strokeStyle = 'rgba(0,0,0,.1)'; c.lineWidth = 2;
    for (let r = 0; r < h / 30; r++) {
      const yy = -h + r * 30;
      c.beginPath(); c.moveTo(x0, yy); c.lineTo(x0 + w, yy); c.stroke();
      for (let k = (r % 2) * 30; k < w; k += 60) { c.beginPath(); c.moveTo(x0 + k, yy); c.lineTo(x0 + k, yy + 30); c.stroke(); }
    }
    c.fillStyle = pedra;
    for (let k = 0; k < w / 40; k++) c.fillRect(x0 + k * 40, -h - 22, 26, 24);
    // a torre do meio, mais alta (no último castelo é lá que está o Rei Vermelho)
    if (T().rei) {
      c.fillStyle = escura; c.fillRect(x - 60, -h - 110, 120, 110);
      for (let k = 0; k < 5; k++) c.fillRect(x - 64 + k * 27, -h - 130, 18, 22);
    }
    // o portão: as grades sobem quando o castelo é nosso
    const pw = 120, ph = 150;
    c.fillStyle = '#3d2c1e'; c.beginPath(); c.moveTo(x - pw / 2, 0); c.lineTo(x - pw / 2, -ph + 40); c.arc(x, -ph + 40, pw / 2, Math.PI, 0); c.lineTo(x + pw / 2, 0); c.fill();
    c.save();
    c.beginPath(); c.moveTo(x - pw / 2, 0); c.lineTo(x - pw / 2, -ph + 40); c.arc(x, -ph + 40, pw / 2, Math.PI, 0); c.lineTo(x + pw / 2, 0); c.clip();
    const sobe = castelo.aberto * ph;
    c.strokeStyle = '#495057'; c.lineWidth = 7;
    for (let k = 1; k < 6; k++) { c.beginPath(); c.moveTo(x - pw / 2 + k * pw / 6, -ph - sobe); c.lineTo(x - pw / 2 + k * pw / 6, -sobe); c.stroke(); }
    for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(x - pw / 2, -k * ph / 5 - sobe); c.lineTo(x + pw / 2, -k * ph / 5 - sobe); c.stroke(); }
    c.restore();
  }
  function bandeira(c, x, y, t) {
    c.strokeStyle = '#495057'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 70); c.stroke();
    const b = castelo.bandeira, o = Math.sin(t * 6) * 5;
    // a vermelha desce, a nossa (azul, com coroa) sobe
    if (b < 1) {
      c.fillStyle = '#d62828';
      const yy = y - 70 + b * 60;
      c.beginPath(); c.moveTo(x, yy); c.quadraticCurveTo(x + 30, yy + 4 + o, x + 56, yy + 10); c.lineTo(x, yy + 28); c.fill();
    }
    if (b > 0) {
      c.fillStyle = '#1e6fd9';
      const yy = y - 10 - b * 60;
      c.beginPath(); c.moveTo(x, yy); c.quadraticCurveTo(x + 30, yy + 4 + o, x + 56, yy + 10); c.lineTo(x, yy + 28); c.fill();
      coroa(c, x + 22, yy + 14, 8);
    }
  }
  function coroa(c, x, y, r) {
    c.fillStyle = '#ffd166';
    c.beginPath(); c.moveTo(x - r, y + r * 0.5); c.lineTo(x - r, y - r * 0.5); c.lineTo(x - r * 0.5, y); c.lineTo(x, y - r * 0.8); c.lineTo(x + r * 0.5, y); c.lineTo(x + r, y - r * 0.5); c.lineTo(x + r, y + r * 0.5); c.closePath(); c.fill();
  }

  // um cavalo visto de lado, virado para a direita (o cavaleiro desenha-se por cima)
  function cavalo(c, galope, pelo, manta) {
    const p = Math.sin(galope) * 16, q = Math.cos(galope) * 16;
    c.strokeStyle = pelo; c.lineWidth = 11; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-34, -48); c.lineTo(-40 - p * 0.6, -4); c.moveTo(30, -48); c.lineTo(36 + q * 0.6, -4); c.stroke();
    c.globalAlpha *= 0.85;
    c.beginPath(); c.moveTo(-24, -48); c.lineTo(-18 + p * 0.6, -4); c.moveTo(40, -48); c.lineTo(46 - q * 0.6, -4); c.stroke();
    c.globalAlpha /= 0.85;
    c.fillStyle = '#343a40';
    for (const hx of [-40 - p * 0.6, 36 + q * 0.6]) c.fillRect(hx - 7, -8, 14, 8);
    c.fillStyle = pelo; c.beginPath(); c.ellipse(0, -60, 54, 24, 0, 0, TAU); c.fill();
    // pescoço e cabeça
    c.beginPath(); c.moveTo(30, -74); c.lineTo(54, -118); c.lineTo(74, -110); c.lineTo(56, -60); c.closePath(); c.fill();
    c.beginPath(); c.ellipse(76, -112, 26, 13, 0.45, 0, TAU); c.fill();
    c.fillStyle = '#1b1b1b'; c.beginPath(); c.arc(72, -118, 3.5, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(56, -128); c.lineTo(60, -146); c.lineTo(66, -126); c.fill();
    // crina e cauda
    c.fillStyle = '#6c4a2e';
    c.beginPath(); c.moveTo(32, -80); c.quadraticCurveTo(40, -110, 56, -128); c.lineTo(50, -112); c.quadraticCurveTo(42, -94, 40, -76); c.fill();
    c.strokeStyle = '#6c4a2e'; c.lineWidth = 9;
    c.beginPath(); c.moveTo(-52, -66); c.quadraticCurveTo(-74, -60 + Math.sin(galope * 0.5) * 6, -78, -30); c.stroke();
    // a manta com a cor da equipa
    if (manta) {
      c.fillStyle = manta;
      c.beginPath(); c.moveTo(-26, -82); c.lineTo(24, -82); c.lineTo(28, -42); c.lineTo(-30, -42); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(-30, -48, 58, 4);
    }
  }
  // 2.ª ronda (2026-11-11): "que fossem mais como os dos Vingadores, mais como os humanos":
  // as pessoas usam o mesmo boneco do jogo da Marvel, com pele, mãos e cara de gente
  const PELE = '#f2c6a0', defs = {};
  function defDe(cores, capa) {
    const chave = cores.tunica + (capa ? 'c' : '');
    if (!defs[chave]) defs[chave] = { id: 'rei-' + chave, tronco: cores.tunica, bracos: cores.tunica, maos: PELE, pele: PELE,
      pernas: '#5c4033', ancas: cores.escuro, pes: '#3d2c1e', capa: capa ? cores.escuro : undefined };
    return defs[chave];
  }
  function pessoa(c, cores, opts) {
    const B = G.scenes.marvel && G.scenes.marvel.api && G.scenes.marvel.api.boneco;
    if (B) return pessoaMarvel(c, cores, opts, B);
    pessoaSimples(c, cores, opts);
  }
  function pessoaMarvel(c, cores, opts, B) {
    const K = 1.32;
    c.save(); c.scale(K, K);
    const braco = opts.festa ? 0 : (opts.arco > 0 ? 1 : 0.88);
    B(c, defDe(cores, opts.capa), { t: opts.t, dir: 1, fase: opts.passo || 0, anda: !!opts.anda, braco: braco, cima: !!opts.festa,
      partes: opts.sentado ? { pernas: { dx: 2, dy: -2, r: -1.25 } } : null });
    // cabelo / capacete / coroa por cima da cabeça
    if (opts.coroa) {
      c.fillStyle = '#6b4226'; G.gfx.rr(c, -8.5, -70, 17, 6, 3); c.fill();
      coroa(c, 0, -74, 9);
      c.fillStyle = '#e63946'; c.beginPath(); c.arc(0, -75, 1.8, 0, TAU); c.fill();
    } else if (opts.capacete) {
      c.fillStyle = '#adb5bd'; c.beginPath(); c.arc(0, -63, 10, Math.PI, 0); c.fill();
      c.fillRect(-10, -64, 20, 3); c.fillStyle = '#868e96'; c.fillRect(-1.2, -73, 2.4, 10);
      c.fillStyle = cores.tunica; c.beginPath(); c.moveTo(0, -73); c.quadraticCurveTo(-8, -80, -12, -74); c.quadraticCurveTo(-6, -76, 0, -71); c.fill();
    }
    // o arco na mão da frente (a mão fica à frente, à altura do peito)
    if (!opts.festa) {
      const ang = -0.2 - 1.35 * braco, hx = 9.2 - Math.sin(ang) * 18.5, hy = -47 + Math.cos(ang) * 18.5;
      const puxa = opts.arco > 0 ? 7 : 0;
      c.strokeStyle = '#8d5524'; c.lineWidth = 2.6;
      c.beginPath(); c.arc(hx - 4, hy, 17, -1.2, 1.2); c.stroke();
      c.strokeStyle = '#f1f3f5'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(hx - 4 + Math.cos(-1.2) * 17, hy + Math.sin(-1.2) * 17); c.lineTo(hx - 2 - puxa, hy); c.lineTo(hx - 4 + Math.cos(1.2) * 17, hy + Math.sin(1.2) * 17); c.stroke();
      // a aljava com setas às costas
      c.fillStyle = '#8d5524'; G.gfx.rr(c, -14, -52, 6, 20, 2); c.fill();
      c.fillStyle = cores.tunica === AZUL.tunica ? '#4cc9f0' : '#e63946';
      c.fillRect(-14, -56, 2, 5); c.fillRect(-10, -57, 2, 6);
    }
    c.restore();
  }
  // uma pessoa (de pé ou sentada no cavalo), com arco na mão; cores da equipa
  function pessoaSimples(c, cores, opts) {
    const sentado = opts.sentado, p = sentado ? 0 : Math.sin(opts.passo || 0) * 8;
    if (!sentado) {
      c.strokeStyle = '#495057'; c.lineWidth = 8; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-6, -30); c.lineTo(-6 - p, 0); c.moveTo(6, -30); c.lineTo(6 + p, 0); c.stroke();
    } else {
      c.strokeStyle = '#495057'; c.lineWidth = 8; c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, -34); c.lineTo(8, -10); c.stroke();
    }
    // capa
    if (opts.capa) { c.fillStyle = cores.escuro; c.beginPath(); c.moveTo(-8, -66); c.quadraticCurveTo(-30, -40 + Math.sin(opts.t * 8) * 4, -26, -22); c.lineTo(-6, -30); c.fill(); }
    c.fillStyle = cores.tunica; G.gfx.rr(c, -13, -68, 26, 40, 7); c.fill();
    c.fillStyle = cores.escuro; c.fillRect(-13, -38, 26, 5);
    // cabeça
    c.fillStyle = '#ffd7b5'; c.beginPath(); c.arc(0, -80, 13, 0, TAU); c.fill();
    c.fillStyle = '#1b1b1b'; c.beginPath(); c.arc(5, -82, 2, 0, TAU); c.fill();
    c.strokeStyle = '#1b1b1b'; c.lineWidth = 1.6; c.beginPath(); c.arc(4, -76, 4, 0.2, Math.PI - 0.6); c.stroke();
    if (opts.coroa) coroa(c, 0, -96, 13);
    else if (opts.capacete) { c.fillStyle = '#adb5bd'; c.beginPath(); c.arc(0, -84, 14, Math.PI, 0); c.fill(); c.fillRect(-2, -84, 4, 12); }
    // o arco à frente, com o braço; a corda puxa quando dispara
    const puxa = opts.arco > 0 ? 8 : 0;
    c.strokeStyle = '#8d5524'; c.lineWidth = 4;
    c.beginPath(); c.arc(16, -58, 24, -1.2, 1.2); c.stroke();
    c.strokeStyle = '#f1f3f5'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(16 + Math.cos(-1.2) * 24, -58 + Math.sin(-1.2) * 24); c.lineTo(22 - puxa, -58); c.lineTo(16 + Math.cos(1.2) * 24, -58 + Math.sin(1.2) * 24); c.stroke();
    c.strokeStyle = cores.tunica; c.lineWidth = 7;
    c.beginPath(); c.moveTo(4, -60); c.lineTo(36, -58); c.stroke();
    if (opts.festa) { c.beginPath(); c.moveTo(-6, -62); c.lineTo(-18, -94); c.stroke(); }
  }

  function desenhaRei(c, t) {
    c.save(); c.translate(rei.x, rei.y);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(0, 2 - rei.y, 64, 9, 0, 0, TAU); c.fill();
    if (rei.inv > 0 && Math.floor(t * 12) % 2 === 0 && rei.descansa <= 0) c.globalAlpha = 0.5;
    if (rei.dir < 0) c.scale(-1, 1);
    if (rei.descansa > 0) {
      // a descansar: o cavalo deitado e o rei sentado ao lado a dormir
      c.save(); c.translate(0, 26); cavalo(c, 0, '#f1f3f5', '#1e6fd9'); c.restore();
      c.save(); c.translate(-80, 0); pessoa(c, AZUL, { sentado: true, coroa: true, capa: true, t: t, arco: 0 }); c.restore();
      c.font = '30px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#000';
      c.fillText('💤', -60, -130 - (t * 30) % 30);
    } else {
      cavalo(c, rei.galope, '#f1f3f5', '#1e6fd9');
      c.save(); c.translate(-4, -70); pessoa(c, AZUL, { sentado: true, coroa: true, capa: true, t: t, arco: rei.arco }); c.restore();
    }
    c.restore();
    // a setinha amarela por cima do rei
    const y = rei.y - 200 + Math.sin(t * 6) * 4;
    c.fillStyle = '#ffd60a'; c.strokeStyle = '#7a5a00'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(rei.x - 10, y - 10); c.lineTo(rei.x + 10, y - 10); c.lineTo(rei.x, y + 2); c.closePath(); c.fill(); c.stroke();
  }

  function desenhaSoldado(c, e, t) {
    const cores = e.equipa === 'nosso' ? AZUL : VERM;
    c.save(); c.translate(e.x, e.y);
    if (!e.muralha) { c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(0, 2, e.tipo === 'cavaleiro' ? 56 : 22, 6, 0, 0, TAU); c.fill(); }
    const salta = e.festa > 0 ? -Math.abs(Math.sin(t * 10)) * 16 : 0;
    c.translate(0, salta);
    if (e.pisca > 0 && Math.floor(t * 24) % 2 === 0) c.globalAlpha = 0.5;
    if (e.dir < 0) c.scale(-1, 1);
    if (e.tipo === 'cavaleiro') {
      cavalo(c, e.passo, '#8d5524', cores.tunica);
      c.save(); c.translate(-4, -70); pessoa(c, cores, { sentado: true, capacete: true, t: t, arco: e.arco, festa: e.festa > 0 }); c.restore();
    } else if (e.tipo === 'reimau') {
      c.scale(1.3, 1.3);
      pessoa(c, e.equipa === 'nosso' ? AZUL : VERM, { coroa: true, capa: true, t: t, arco: e.arco, passo: 0, festa: e.festa > 0 || e.equipa === 'nosso' });
    } else {
      pessoa(c, cores, { capacete: true, t: t, arco: e.arco, passo: e.passo, anda: Math.abs(e.vx) > 20, festa: e.festa > 0 });
    }
    c.restore();
    // a energia que falta (só nos vermelhos)
    if (e.equipa === 'mau' && e.hp < e.max) {
      const b = caixa(e), w = 40;
      c.fillStyle = 'rgba(0,0,0,.25)'; G.gfx.rr(c, b.x - w / 2, b.y - b.ry - 20, w, 7, 3); c.fill();
      c.fillStyle = '#4cc9f0'; G.gfx.rr(c, b.x - w / 2, b.y - b.ry - 20, w * (1 - e.hp / e.max), 7, 3); c.fill();
    }
  }

  function desenhaSeta(c, x, y, a, nossa) {
    c.save(); c.translate(x, y); c.rotate(a);
    c.strokeStyle = '#8d5524'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(-30, 0); c.lineTo(10, 0); c.stroke();
    c.fillStyle = '#adb5bd'; c.beginPath(); c.moveTo(16, 0); c.lineTo(6, -6); c.lineTo(6, 6); c.closePath(); c.fill();
    c.fillStyle = nossa ? '#4cc9f0' : '#e63946';
    c.beginPath(); c.moveTo(-30, 0); c.lineTo(-40, -7); c.lineTo(-24, 0); c.lineTo(-40, 7); c.closePath(); c.fill();
    c.restore();
  }
  function setaNoChao(c, s) {
    c.globalAlpha = Math.max(0, 1 - s.t / 6);
    desenhaSeta(c, s.x, -2, s.a, s.nossa);
    c.globalAlpha = 1;
  }

  function desenhaFesta(c, W, H, t) {
    c.save(); c.translate(W / 2, H * 0.3 + Math.sin(t * 3) * 8);
    const k = 3.6 + Math.sin(t * 4) * 0.2;
    coroa(c, 0, 0, 14 * k);
    c.fillStyle = '#e63946'; c.beginPath(); c.arc(-5 * k, -2 * k, 2 * k, 0, TAU); c.fill();
    c.fillStyle = '#4cc9f0'; c.beginPath(); c.arc(5 * k, -2 * k, 2 * k, 0, TAU); c.fill();
    c.restore();
    G.gfx.label(c, 'GANHASTE O REINO TODO!', W / 2, H * 0.3 + 90, 40, '#1e6fd9', 'center');
  }

  function hud(c, t) {
    const k = Math.min(1, G.H / 520);
    c.save(); c.scale(k, k);
    // corações
    for (let i = 0; i < MAXC; i++) {
      const x = 28 + i * 36, y = 34, f = clamp(rei.coracoes - i, 0, 1);
      G.gfx.heart(c, x, y, 30, 'rgba(0,0,0,.18)');
      if (f > 0) {
        c.save();
        if (f < 1) { c.beginPath(); c.rect(x - 20, y - 20, 20, 40); c.clip(); }
        G.gfx.heart(c, x, y, 30, '#ff3b6b');
        c.restore();
      }
    }
    G.gfx.star(c, 30, 76, 16, '#ffd166', 0);
    G.gfx.label(c, '' + G.state.stars, 54, 77, 26, '#b56b00');
    // os cinco castelos do reino: os nossos com bandeira azul
    for (let i = 0; i < TERRAS.length; i++) {
      const x = 34 + i * 46, y = 132, atual = i === terra;
      c.save(); c.translate(x, y); c.scale(atual ? 1.15 : 0.95, atual ? 1.15 : 0.95);
      c.fillStyle = atual ? 'rgba(255,214,10,.9)' : 'rgba(255,255,255,.6)';
      c.beginPath(); c.arc(0, -8, 21, 0, TAU); c.fill();
      c.fillStyle = '#868e96';
      c.fillRect(-12, -14, 24, 16); c.fillRect(-15, -22, 8, 24); c.fillRect(7, -22, 8, 24);
      const nossa = i < terra || (i === terra && castelo.conquistado) || (fase === 'festa');
      c.fillStyle = nossa ? '#1e6fd9' : '#d62828';
      c.fillRect(-1, -32, 2, 14); c.beginPath(); c.moveTo(1, -32); c.lineTo(13, -28); c.lineTo(1, -24); c.fill();
      c.restore();
    }
    // a nossa equipa: um soldadinho azul e quantos são
    c.save(); c.translate(274, 140); c.scale(0.55, 0.55);
    pessoa(c, AZUL, { capacete: true, t: t, arco: 0, passo: 0 });
    c.restore();
    G.gfx.label(c, '' + equipa().filter(function (e) { return !e.vaiCasa; }).length, 292, 116, 26, '#1e6fd9');
    // a corneta (a encher)
    c.save(); c.translate(32, 186);
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.fill();
    const pronta = cornetaCd <= 0;
    c.strokeStyle = pronta ? '#9ef01a' : '#ffffff'; c.lineWidth = 5;
    c.beginPath(); c.arc(0, 0, 20, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - cornetaCd / 10)); c.stroke();
    c.font = (pronta ? 22 + Math.sin(t * 6) * 2 : 20) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000';
    c.fillText('📯', 0, 1);
    c.restore();
    // quanto falta até ao castelo
    const f = clamp(rei.x / castelo.x, 0, 1);
    G.gfx.rr(c, 64, 180, 240, 10, 5); c.fillStyle = 'rgba(255,255,255,.55)'; c.fill();
    G.gfx.rr(c, 64, 180, Math.max(10, 240 * f), 10, 5); c.fillStyle = '#1e6fd9'; c.fill();
    c.restore();
    document.body.classList.toggle('rei-corneta-espera', cornetaCd > 0);
  }

  S.debug = function () {
    return { terra: T().id, fase: fase, ronda: ronda, x: Math.round(rei.x), coracoes: rei.coracoes, descansa: rei.descansa > 0,
      vermelhos: vermelhos().length, equipa: equipa().length, muralha: ents.filter(function (e) { return e.muralha && e.equipa === 'mau'; }).length,
      castelo: castelo.conquistado, aberto: +castelo.aberto.toFixed(2), setas: setas.length, conquistados: conquistados, camX: Math.round(camX) };
  };
  S.api = {
    vaiPara: function (i) { comecaTerra(i, equipa().length); },
    rei: function () { return rei; }, ents: function () { return ents; }, castelo: function () { return castelo; }
  };

  G.scenes = G.scenes || {};
  G.scenes.rei = S;
})();
