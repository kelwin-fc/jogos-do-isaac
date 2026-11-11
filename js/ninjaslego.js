/* Cena — NINJAS DE LEGO, ditada pelo Isaac (2026-11-11).

   "Um jogo novo que é da Marvel, mas não é o mesmo. Nós somos ninjas do Lego e
   disparamos os nossos poderes até eles perderem, mas nos tornar. Que seja difícil."

   Como ficou:
   - Somos um ninja de Lego cor de laranja com o poder do FOGO (bonecos do jogo da Marvel,
     com capuz, máscara, fita branca na cabeça e cinto). Cores e elementos inventados por nós. ◀ ▶ corre, ⬆ salta (no ar dá para saltar outra vez),
     🔥 dispara bolas de fogo (segurar dispara sempre, vão ao mau mais perto à frente) e
     🌀 é o PODER GIGANTE: uma onda que acerta em todos os maus e a equipa dispara junta.
   - Os ninjas das sombras (pretos, de olhos vermelhos) também disparam poderes, saltam
     para fugir às nossas bolas e vêm dos dois lados. Quando ficam sem energia NÃO morrem:
     o fumo preto sai, ficam de uma cor de elemento (raio, gelo, terra, vento, água...)
     e TORNAM-SE NINJAS DA NOSSA EQUIPA. Vêm atrás de nós e disparam o poder deles.
   - Cinco terras, cada uma com ondas de ninjas e um mestre no fim. Na última está o
     Mestre das Sombras; quando fica nosso amigo, ganhámos. Depois outra volta, mais difícil.
   - Nunca há derrota: sem corações o ninja senta-se a descansar um bocadinho e volta. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  const GRAV = 2300, SALTO = 900, VEL = 340, ARENA = 2200;
  const BOLA_V = 820, MAXC = 5, MAX_EQUIPA = 6, SUPER_CD = 12;
  const AMARELO = '#ffd23f';
  // os elementos (o fogo é o nosso; os outros são os que os amigos ganham)
  const EL = {
    fogo: { cor: '#f77f00', escuro: '#b85c00', bola: '#ff7b00', luz: '#ffd166', fala: 'fogo' },
    raio: { cor: '#ffb703', escuro: '#b07d00', bola: '#ffd60a', luz: '#fff3b0', fala: 'raio' },
    gelo: { cor: '#90e0ef', escuro: '#0096c7', bola: '#caf0f8', luz: '#ffffff', fala: 'gelo' },
    terra: { cor: '#8d6e3a', escuro: '#5c4033', bola: '#a47148', luz: '#d4a373', fala: 'terra' },
    vento: { cor: '#ff70a6', escuro: '#c9184a', bola: '#ffc8dd', luz: '#ffffff', fala: 'vento' },
    agua: { cor: '#2a9d8f', escuro: '#1d6f65', bola: '#48cae4', luz: '#caf0f8', fala: 'água' },
    sombra: { cor: '#2b2d42', escuro: '#14141f', bola: '#7b2cbf', luz: '#c77dff', fala: 'sombra' }
  };
  const AMIGOS = ['raio', 'gelo', 'terra', 'vento', 'agua'];
  const TERRAS = [
    { id: 'bambu', nome: 'O bosque de bambu', fala: 'O bosque de bambu! Cuidado, os ninjas das sombras!', ceu: ['#a8dadc', '#f1faee'], monte: '#95d5b2', chao: '#6a994e', caminho: '#c9a36b', ondas: [3, 3, 4], mestre: 1 },
    { id: 'gelo', nome: 'A montanha do gelo', fala: 'A montanha do gelo! Escorrega, mas não desistas!', ceu: ['#bde0fe', '#f8f9fa'], monte: '#ced4da', chao: '#e9ecef', caminho: '#adb5bd', ondas: [3, 4, 4], mestre: 1 },
    { id: 'vulcao', nome: 'O vulcão', fala: 'O vulcão! Os ninjas são mais fortes aqui!', ceu: ['#ffb4a2', '#ffe5d9'], monte: '#6d6875', chao: '#5e503f', caminho: '#9c6644', ondas: [4, 4, 5], mestre: 1 },
    { id: 'nuvens', nome: 'O templo das nuvens', fala: 'O templo das nuvens! Está quase!', ceu: ['#cdb4db', '#fff0f3'], monte: '#ffffff', chao: '#dee2e6', caminho: '#f4a261', ondas: [4, 4, 5, 5], mestre: 2 },
    { id: 'sombras', nome: 'A fortaleza das sombras', fala: 'A fortaleza das sombras! Vamos tornar o Mestre das Sombras nosso amigo!', ceu: ['#3c096c', '#9d4edd'], monte: '#240046', chao: '#3c3c4e', caminho: '#5a5a72', ondas: [5, 5, 6], mestre: 0, chefe: true }
  ];

  let nj, ents, bolas, parts, textos, ondas, coracoesChao, camX, terra, ronda, tempo;
  let fase, faseT, superCd, onda, ondaT, conquistados, aneis, proximoAmigo;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function h01(n) { const v = Math.sin(n * 127.1 + 3.3) * 43758.5; return v - Math.floor(v); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function vscale() { return Math.min(1, G.H / 620, G.W / 700); }
  function vw() { return G.W / vscale(); }
  function vh() { return G.H / vscale(); }
  function chaoY() {
    const reserva = G.W < 560 && G.H > G.W ? 236 : 122;
    return Math.min(vh() * 0.86, Math.max(vh() * 0.55, (G.H - reserva) / vscale()));
  }
  function fala(t) { if (G.audio.fala) G.audio.fala(t); }
  function sfx(n) { G.audio.sfx(n); }
  function T() { return TERRAS[terra]; }
  function texto(t, x, y) { textos.push({ t: t, x: x, y: y, life: 1.3, age: 0 }); }

  S.enter = function () {
    ronda = 1; tempo = 0; conquistados = 0; proximoAmigo = 0;
    comecaTerra(0, []);
  };

  /* ---------- uma terra nova ---------- */
  function comecaTerra(i, levaEquipa) {
    terra = i;
    camX = 0;
    bolas = []; parts = []; textos = []; aneis = []; coracoesChao = [];
    nj = { x: 260, y: 0, vx: 0, vy: 0, dir: 1, noChao: true, saltos: 0, passo: 0, cd: 0, braco: 0, inv: 2, coracoes: MAXC, descansa: 0, anda: false };
    ents = [];
    (levaEquipa || []).slice(0, MAX_EQUIPA).forEach(function (el, k) {
      const e = ninjaNovo('ninja', nj.x - 90 - k * 60, 'nosso');
      e.el = el;
      ents.push(e);
    });
    const extra = ronda - 1;
    ondas = T().ondas.map(function (n) { return n + extra; });
    onda = -1; ondaT = 1.6;
    fase = 'joga'; faseT = 0; superCd = 4;
    G.banner('🥷 ' + T().nome, 2400);
    fala(T().fala);
  }

  function ninjaNovo(tipo, x, equipa) {
    const base = tipo === 'chefe' ? 45 : (tipo === 'mestre' ? 16 + terra * 2 : 6);
    const hp = base + Math.floor((ronda - 1) / 2) * (tipo === 'ninja' ? 1 : 4) + (tipo === 'ninja' ? terra : 0);
    return { tipo: tipo, x: x, y: 0, vy: 0, vx: 0, dir: -1, equipa: equipa, hp: hp, max: hp, el: 'sombra',
      cd: rnd(1.4, 2.6), pisca: 0, passo: rnd(0, 6), braco: 0, festa: 0, noChao: true, quer: rnd(230, 430),
      lado: Math.random() < 0.5 ? -1 : 1, mudaT: rnd(1, 3), fumo: 0 };
  }
  function maus() { return ents.filter(function (e) { return e.equipa === 'mau'; }); }
  function equipa() { return ents.filter(function (e) { return e.equipa === 'nosso' && !e.vaiTreinar; }); }
  function tam(e) { return e.tipo === 'chefe' ? 1.9 : (e.tipo === 'mestre' ? 1.55 : 1.3); }
  function caixa(e) { const k = tam(e); return { x: e.x, y: e.y - 38 * k, rx: 16 * k, ry: 38 * k }; }
  function caixaNj() { return { x: nj.x, y: nj.y - 50, rx: 18, ry: 46 }; }
  function dentro(b, x, y, r) { return Math.abs(x - b.x) < b.rx + r && Math.abs(y - b.y) < b.ry + r; }

  /* ---------- as ondas de ninjas das sombras ---------- */
  function lancaOnda() {
    onda++;
    const ultima = onda === ondas.length - 1;
    const n = ondas[onda];
    for (let k = 0; k < n; k++) {
      const lado = k % 2 === 0 ? 1 : -1;
      const x = lado > 0 ? camX + vw() + 80 + k * 50 : camX - 80 - k * 50;
      ents.push(ninjaNovo('ninja', clamp(x, -200, ARENA + 200), 'mau'));
    }
    if (ultima) {
      if (T().chefe) {
        const c = ninjaNovo('chefe', clamp(camX + vw() + 160, 0, ARENA + 200), 'mau');
        c.quer = 380; ents.push(c);
        G.banner('😈 O Mestre das Sombras!', 2400);
        fala('Olha! O Mestre das Sombras! Dispara os teus poderes!');
      } else {
        for (let k = 0; k < T().mestre; k++) {
          const m = ninjaNovo('mestre', clamp(k ? camX - 140 : camX + vw() + 140, -200, ARENA + 200), 'mau');
          ents.push(m);
        }
        G.banner('⚠️ Vem aí um mestre ninja!', 2000);
        fala('Cuidado! Vem aí um mestre ninja!');
      }
    } else if (onda > 0) {
      G.banner('🥷 Mais ninjas das sombras!', 1400);
    }
    sfx('ninja');
  }

  /* ---------- os poderes ---------- */
  function disparaBola(x, y, alvo, v, el, nossa, espalha, tamanho) {
    let ang;
    if (alvo) ang = Math.atan2(alvo.y - y, alvo.x - x);
    else ang = nj.dir < 0 ? Math.PI : 0;
    ang += rnd(-espalha, espalha);
    // as bolas dos maus tiram meio coração no bosque e um coração inteiro daí para a frente
    const dano = nossa ? 0 : (terra === 0 && (tamanho || 11) <= 10 ? 0.5 : 1);
    bolas.push({ x: x, y: y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, el: el, nossa: nossa, t: 0, r: tamanho || 11, dano: dano });
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
  function njDispara() {
    const x = nj.x + nj.dir * 30, y = nj.y - 58;
    disparaBola(x, y, alvoMaisPerto(x, y, maus(), 950, nj.dir), BOLA_V, 'fogo', true, 0.02, 12);
    nj.braco = 0.2;
    sfx('pew');
  }
  function poderGigante() {
    superCd = SUPER_CD;
    sfx('tornado'); G.shake = 0.4;
    aneis.push({ x: nj.x, y: nj.y - 50, r: 20, t: 0 });
    for (const e of maus()) {
      if (Math.abs(e.x - nj.x) < 820) { acerta(e); if (e.equipa === 'mau') acerta(e); }
    }
    for (const e of equipa()) {
      const b = caixa(e), alvo = alvoMaisPerto(b.x, b.y, maus(), 950, 0);
      if (alvo) { disparaBola(b.x, b.y - 10, alvo, BOLA_V, e.el, true, 0.03, 13); e.braco = 0.25; e.cd = rnd(1.4, 2.2); }
    }
    G.banner('🌀 Poder gigante!', 1200);
    fala(['Poder gigante!', 'Todos juntos!', 'Poderes ninja!'][Math.floor(rnd(0, 3))]);
  }

  /* ---------- acertar: ficam da nossa equipa ---------- */
  function acerta(e) {
    if (e.equipa !== 'mau') return;
    e.hp--; e.pisca = 0.25;
    const b = caixa(e);
    faiscas(b.x, b.y - 10, 4, '#ffd166');
    if (e.hp > 0) { sfx('pop'); return; }
    e.equipa = 'nosso'; e.festa = 1.4; e.cd = rnd(1, 2); e.fumo = 1;
    e.el = e.tipo === 'chefe' ? 'sombraBoa' : AMIGOS[proximoAmigo++ % AMIGOS.length];
    G.addStars(e.tipo === 'chefe' ? 10 : (e.tipo === 'mestre' ? 3 : 1));
    for (let i = 0; i < 16; i++) parts.push({ x: b.x + rnd(-20, 20), y: b.y + rnd(-30, 30), vx: rnd(-80, 80), vy: rnd(-160, -40), t: 0, life: rnd(0.6, 1.1), cor: 'rgba(43,45,66,.7)', r: rnd(8, 16), g: -100 });
    faiscas(b.x, b.y - 20, 12, corEl(e.el).bola);
    texto('💛', b.x, b.y - b.ry - 26);
    sfx('poof'); setTimeout(function () { sfx('tada'); }, 180);
    if (e.tipo === 'chefe') {
      G.banner('😃 O Mestre das Sombras é da nossa equipa!', 2600);
      fala('O Mestre das Sombras agora é nosso amigo!');
    } else if (e.tipo === 'mestre') {
      fala('O mestre ninja agora é nosso amigo!');
    } else if (Math.random() < 0.5) {
      fala(['Agora és da nossa equipa!', 'Mais um ninja para a equipa!', 'Ganhou o poder do ' + corEl(e.el).fala + '!'][Math.floor(rnd(0, 3))]);
    }
    if (Math.random() < (e.tipo === 'ninja' ? 0.2 : 1)) coracoesChao.push({ x: b.x, y: b.y - 20, vy: -300, t: 0 });
    if (e.tipo === 'ninja' && equipa().length > MAX_EQUIPA) e.vaiTreinar = true;   // vai treinar para o dojo, a acenar
  }
  function corEl(el) { return el === 'sombraBoa' ? EL.sombra : EL[el]; }
  function magoaNj(dano) {
    if (nj.inv > 0 || nj.descansa > 0 || fase !== 'joga') return;
    nj.coracoes = Math.max(0, nj.coracoes - (dano || 0.5));
    nj.inv = 0.8; G.shake = 0.3;
    sfx('ouch');
    faiscas(nj.x, nj.y - 60, 6, '#ff6b6b');
    if (nj.coracoes <= 0) {
      nj.descansa = 2.8;
      G.banner('O ninja vai descansar um bocadinho 💤', 2400);
      fala('O ninja está cansado. Vai descansar um bocadinho!');
      for (const s of bolas) if (!s.nossa) s.morta = true;
    }
  }
  function faiscas(x, y, n, cor) {
    for (let i = 0; i < n; i++) parts.push({ x: x, y: y, vx: rnd(-220, 220), vy: rnd(-320, -60), t: 0, life: rnd(0.4, 0.8), cor: cor, r: rnd(3, 7), g: 700 });
  }

  /* ---------- update ---------- */
  S.update = function (dt) {
    dt = Math.min(dt, 1 / 30);
    tempo += dt;
    const I = G.input, ax = I.axis().x;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.t += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.t > p.life) parts.splice(i, 1);
    }
    for (let i = textos.length - 1; i >= 0; i--) { textos[i].age += dt; textos[i].y -= 40 * dt; if (textos[i].age > textos[i].life) textos.splice(i, 1); }
    for (let i = aneis.length - 1; i >= 0; i--) { aneis[i].t += dt; aneis[i].r += 1400 * dt; if (aneis[i].t > 0.6) aneis.splice(i, 1); }

    if (fase === 'passa') {
      faseT += dt;
      nj.x += VEL * dt; nj.passo += dt * 12; nj.dir = 1; nj.anda = true;
      for (const e of equipa()) { e.x += 320 * dt; e.dir = 1; e.passo += dt * 12; }
      camX += (nj.x - vw() * 0.35 - camX) * Math.min(1, dt * 3);
      if (faseT > 2.2) comecaTerra((terra + 1) % TERRAS.length, equipa().map(function (e) { return e.el; }));
      return;
    }
    if (fase === 'festa') {
      faseT += dt;
      if (Math.random() < dt * 6) fogoArtificio(camX + rnd(100, vw() - 100), rnd(-vh() * 0.6, -vh() * 0.3));
      for (const e of ents) e.festa = 1;
      if (faseT > 10) {
        ronda++;
        G.banner('🥷 Outra volta! Agora é mais difícil', 2600);
        comecaTerra(0, []);
      }
      return;
    }

    // o nosso ninja
    nj.inv = Math.max(0, nj.inv - dt); nj.braco = Math.max(0, nj.braco - dt); nj.cd -= dt;
    superCd = Math.max(0, superCd - dt);
    nj.anda = false;
    if (nj.descansa > 0) {
      nj.descansa -= dt; nj.vx = 0;
      if (nj.descansa <= 0) { nj.coracoes = MAXC; nj.inv = 2; sfx('suit'); G.banner('O ninja está pronto! 🥷', 1600); }
    } else {
      const v = ax * VEL;
      nj.vx = v;
      if (Math.abs(ax) > 0.1) nj.dir = ax > 0 ? 1 : -1;
      nj.x += v * dt;
      if (Math.abs(v) > 10) { nj.passo += dt * Math.abs(v) / 26; nj.anda = nj.noChao; }
      if ((I.justPressed('jump') || I.justPressed('up')) && nj.saltos < 2) {
        nj.vy = nj.saltos ? -SALTO * 0.85 : -SALTO; nj.noChao = false; nj.saltos++; sfx('hop');
        if (nj.saltos === 2) faiscas(nj.x, nj.y - 10, 6, '#ffffff');
      }
      if (I.isHeld('fire') && nj.cd <= 0) { njDispara(); nj.cd = 0.34; }
      if (I.justPressed('horn') && superCd <= 0) poderGigante();
    }
    nj.vy += GRAV * dt; nj.y += nj.vy * dt;
    if (nj.y >= 0) { nj.y = 0; nj.vy = 0; nj.noChao = true; nj.saltos = 0; }
    nj.x = clamp(nj.x, 60, ARENA - 60);
    camX += (clamp(nj.x - vw() * 0.42, 0, Math.max(0, ARENA - vw())) - camX) * Math.min(1, dt * 4);

    // as ondas
    const vs = maus();
    if (!vs.length) {
      if (onda >= ondas.length - 1) {
        if (onda >= 0) { terraConquistada(); return; }
      }
      ondaT -= dt;
      if (ondaT <= 0) { lancaOnda(); ondaT = 1.8; }
    }

    // os ninjas
    let slot = 0;
    const forte = 1 + (ronda - 1) * 0.15 + terra * 0.06;
    for (const e of ents) {
      e.pisca = Math.max(0, e.pisca - dt); e.braco = Math.max(0, e.braco - dt); e.festa = Math.max(0, e.festa - dt); e.fumo = Math.max(0, e.fumo - dt);
      const b = caixa(e);
      if (e.equipa === 'mau') {
        const dx = nj.x - e.x, longe = Math.abs(dx);
        e.dir = dx > 0 ? 1 : -1;
        // mantém-se a uma distância de tiro e de vez em quando muda de lado
        e.mudaT -= dt;
        if (e.mudaT <= 0) { e.mudaT = rnd(2, 4); e.quer = rnd(220, 440); if (Math.random() < 0.25 && e.tipo === 'ninja') e.lado = -e.lado; }
        const alvoX = nj.x - e.lado * e.quer;
        let quer = clamp((alvoX - e.x) * 2.2, -260, 260);
        if (longe < 150) quer = -e.dir * 260;
        e.vx += (quer - e.vx) * Math.min(1, dt * 3);
        e.x += e.vx * dt; e.passo += Math.abs(e.vx) * dt / 24;
        if (e.x > -40 && e.x < ARENA + 40) e.x = clamp(e.x, 30, ARENA - 30);
        // saltam para fugir às nossas bolas (é isto que os torna difíceis)
        if (e.noChao) {
          let perigo = false;
          for (const s of bolas) {
            if (!s.nossa) continue;
            const ddx = e.x - s.x;
            if (Math.abs(ddx) < 190 && ddx * s.vx > 0 && Math.abs(s.y - b.y) < 70) { perigo = true; break; }
          }
          const foge = (e.tipo === 'chefe' ? 2 : (e.tipo === 'mestre' ? 1.7 : 1.4)) + terra * 0.15 + (ronda - 1) * 0.2;
          if ((perigo && Math.random() < dt * foge * 3) || Math.random() < dt * 0.25) {
            e.vy = -(e.tipo === 'chefe' ? 760 : 820); e.noChao = false;
          }
        }
        // disparam quando o ninja está perto (e a descansar ninguém lhe dispara)
        if (longe < 900 && nj.descansa <= 0 && Math.abs(e.x - camX - vw() / 2) < vw() * 0.6) {
          e.cd -= dt;
          if (e.cd <= 0) {
            const v = 520 + terra * 30 + (ronda - 1) * 35;
            // apontam para onde o ninja vai estar (os maus são espertos)
            const tv = Math.abs(nj.x - b.x) / v, alvo = { x: nj.x + nj.vx * tv * rnd(0.4, 1), y: nj.y - 50 };
            const x0 = b.x + e.dir * 18 * tam(e), y0 = b.y - 12 * tam(e);
            if (e.tipo === 'chefe') {
              for (let k = -2; k <= 2; k++) disparaBola(x0, y0, alvo, v, 'sombra', false, 0, 14), bolas[bolas.length - 1].vy += k * 120;
              e.cd = rnd(1.6, 2.2) / forte;
            } else if (e.tipo === 'mestre') {
              for (let k = -1; k <= 1; k++) disparaBola(x0, y0, alvo, v, 'sombra', false, 0, 13), bolas[bolas.length - 1].vy += k * 140;
              e.cd = rnd(1.5, 2.1) / forte;
            } else {
              disparaBola(x0, y0, alvo, v, 'sombra', false, 0.04, 10);
              e.cd = rnd(1.5, 2.5) / forte;
            }
            e.braco = 0.25;
            sfx('zap');
          }
        }
      } else {
        // da nossa equipa: vem atrás do ninja e dispara aos maus
        if (e.vaiTreinar) { e.dir = -1; e.x -= 220 * dt; e.passo += dt * 9; continue; }
        const alvoX = nj.x - nj.dir * (90 + slot * 56);
        slot++;
        const d = alvoX - e.x, vel = 330;
        const q = Math.abs(d) > 20 ? clamp(d * 3, -vel, vel) : 0;
        e.vx += (q - e.vx) * Math.min(1, dt * 5);
        e.x += e.vx * dt; e.passo += Math.abs(e.vx) * dt / 24;
        if (Math.abs(e.vx) > 20) e.dir = e.vx > 0 ? 1 : -1; else e.dir = nj.dir;
        if (e.noChao && nj.vy < -600 && Math.random() < dt * 8) { e.vy = -760; e.noChao = false; }
        e.cd -= dt;
        if (e.cd <= 0) {
          const alvo = alvoMaisPerto(b.x, b.y, vs, 800, 0);
          if (alvo && Math.abs(b.x - camX - vw() / 2) < vw() * 0.7) {
            e.dir = alvo.x > b.x ? 1 : -1;
            disparaBola(b.x + e.dir * 20, b.y - 10, alvo, 820, e.el, true, 0.05, 10);
            e.braco = 0.25;
            e.cd = rnd(2.8, 4);
          } else e.cd = 0.4;
        }
      }
      // gravidade para todos
      if (!e.noChao || e.y < 0) {
        e.vy += GRAV * dt; e.y += e.vy * dt;
        if (e.y >= 0) { e.y = 0; e.vy = 0; e.noChao = true; }
      }
    }
    ents = ents.filter(function (e) { return !(e.vaiTreinar && e.x < camX - 200); });

    // as bolas de poder
    for (let i = bolas.length - 1; i >= 0; i--) {
      const s = bolas[i];
      s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt;
      if (Math.random() < dt * 30) parts.push({ x: s.x, y: s.y, vx: -s.vx * 0.1 + rnd(-30, 30), vy: rnd(-30, 30), t: 0, life: 0.3, cor: corEl(s.el).luz, r: s.r * 0.5, g: 0 });
      let fora = false;
      if (s.nossa) {
        for (const e of ents) {
          if (e.equipa !== 'mau') continue;
          if (dentro(caixa(e), s.x, s.y, s.r * 0.6)) { acerta(e); fora = true; break; }
        }
      } else if (s.morta) fora = true;
      else if (dentro(caixaNj(), s.x, s.y, s.r * 0.5)) { magoaNj(s.dano); fora = true; }
      if (!fora && s.y >= 4) { faiscas(s.x, -2, 3, corEl(s.el).bola); fora = true; }
      if (fora || s.t > 2.6 || s.y < -1400) bolas.splice(i, 1);
    }

    // corações que os amigos novos deixam cair
    for (let i = coracoesChao.length - 1; i >= 0; i--) {
      const h = coracoesChao[i];
      h.t += dt; h.vy += 1200 * dt; h.y += h.vy * dt;
      if (h.y > -18) { h.y = -18; h.vy = 0; }
      if (Math.abs(h.x - nj.x) < 50 && Math.abs(h.y - (nj.y - 40)) < 70 && nj.descansa <= 0) {
        nj.coracoes = Math.min(MAXC, nj.coracoes + 1); sfx('heart'); texto('❤️', h.x, h.y - 30);
        coracoesChao.splice(i, 1);
      } else if (h.t > 12) coracoesChao.splice(i, 1);
    }
  };

  function terraConquistada() {
    conquistados++;
    sfx('tada'); G.addStars(5);
    if (T().chefe) {
      fase = 'festa'; faseT = 0;
      G.banner('🏆 GANHASTE! Os ninjas são todos amigos! 🥷', 6000);
      fala('Ganhámos! Os ninjas das sombras agora são todos nossos amigos!');
      G.addStars(20);
      return;
    }
    fase = 'passa'; faseT = 0;
    G.banner('⭐ ' + T().nome + ': conseguimos! ▶', 2200);
    fala('Conseguimos! Vamos para a terra seguinte!');
    sfx('whoosh');
  }

  function fogoArtificio(x, y) {
    const cor = ['#ffd166', '#4cc9f0', '#ff6fb1', '#8ac926', '#ffffff', '#e63946'][Math.floor(rnd(0, 6))];
    for (let i = 0; i < 18; i++) {
      const a = i / 18 * TAU;
      parts.push({ x: x, y: y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, t: 0, life: 1, cor: cor, r: 5, g: 300 });
    }
    sfx('pop');
  }

  /* ---------- desenhar ---------- */
  S.draw = function (c, t) {
    const vs = vscale(), W = vw(), H = vh(), chao = chaoY();
    c.save(); c.scale(vs, vs);
    fundo(c, W, H, chao, t);
    c.save(); c.translate(-camX, chao);
    for (const h of coracoesChao) { if (h.t < 9 || Math.floor(t * 8) % 2) G.gfx.heart(c, h.x, h.y + Math.sin(t * 5) * 3, 30, '#ff3b6b'); }
    for (const e of ents) if (e.equipa === 'mau') desenhaNinjaEnt(c, e, t);
    for (const e of ents) if (e.equipa === 'nosso') desenhaNinjaEnt(c, e, t);
    desenhaNj(c, t);
    for (const s of bolas) desenhaBola(c, s, t);
    for (const a of aneis) {
      c.globalAlpha = Math.max(0, 1 - a.t / 0.6);
      c.strokeStyle = '#ff7b00'; c.lineWidth = 18; c.beginPath(); c.arc(a.x, a.y, a.r, 0, TAU); c.stroke();
      c.strokeStyle = '#ffd166'; c.lineWidth = 7; c.beginPath(); c.arc(a.x, a.y, a.r * 0.9, 0, TAU); c.stroke();
    }
    c.globalAlpha = 1;
    for (const p of parts) { c.globalAlpha = Math.max(0, 1 - p.t / p.life); c.fillStyle = p.cor; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); }
    c.globalAlpha = 1;
    for (const tx of textos) {
      c.globalAlpha = Math.max(0, 1 - tx.age / tx.life);
      c.font = '34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000';
      c.fillText(tx.t, tx.x, tx.y);
    }
    c.globalAlpha = 1;
    c.restore();
    // setinhas nos lados quando há maus fora do ecrã
    for (const e of maus()) {
      const sx = e.x - camX;
      if (sx < -10 || sx > W + 10) {
        const esq = sx < 0, x = esq ? 26 : W - 26, y = chao - 70 + Math.sin(t * 6) * 4;
        c.fillStyle = '#7b2cbf'; c.beginPath();
        if (esq) { c.moveTo(x - 14, y); c.lineTo(x + 8, y - 14); c.lineTo(x + 8, y + 14); }
        else { c.moveTo(x + 14, y); c.lineTo(x - 8, y - 14); c.lineTo(x - 8, y + 14); }
        c.closePath(); c.fill();
      }
    }
    if (fase === 'festa') desenhaFesta(c, W, H, t);
    c.restore();
    hud(c, t);
  };

  function fundo(c, W, H, chao, t) {
    const d = T();
    const g = c.createLinearGradient(0, 0, 0, chao);
    g.addColorStop(0, d.ceu[0]); g.addColorStop(1, d.ceu[1]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (d.id === 'sombras') {
      c.fillStyle = '#f8f9fa'; c.beginPath(); c.arc(W * 0.78, H * 0.17, 40, 0, TAU); c.fill();
      c.fillStyle = d.ceu[0]; c.beginPath(); c.arc(W * 0.78 + 16, H * 0.17 - 8, 34, 0, TAU); c.fill();
      for (let i = 0; i < 30; i++) { c.fillStyle = 'rgba(255,255,255,' + (0.4 + 0.4 * Math.sin(t * 2 + i)) + ')'; c.fillRect(h01(i) * W, h01(i + 40) * chao * 0.6, 2, 2); }
    } else {
      c.fillStyle = d.id === 'vulcao' ? 'rgba(255,120,60,.9)' : 'rgba(255,214,10,.9)';
      c.beginPath(); c.arc(W * 0.8, H * 0.16, 38, 0, TAU); c.fill();
      for (let i = 0; i < 5; i++) {
        const x = ((i * 380 - camX * 0.1 + t * 12) % (W + 400) + W + 400) % (W + 400) - 200;
        G.gfx.cloud(c, x, H * (0.12 + h01(i) * 0.15), 0.9 + h01(i + 5) * 0.5, d.id === 'nuvens' ? 1 : 0.8);
      }
    }
    // montes / vulcão / fortaleza ao longe
    rep(W, 0.2, 520, function (x, i) {
      const alt = 160 + h01(i) * 130;
      c.fillStyle = d.monte;
      if (d.id === 'vulcao') {
        c.beginPath(); c.moveTo(x - 300, chao); c.lineTo(x - 50, chao - alt); c.lineTo(x + 50, chao - alt); c.lineTo(x + 300, chao); c.fill();
        c.fillStyle = '#ff7b00'; c.beginPath(); c.ellipse(x, chao - alt, 50, 10, 0, 0, TAU); c.fill();
        c.fillStyle = 'rgba(80,80,80,.18)'; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(x + Math.sin(t + i + k) * 10 + k * 14, chao - alt - 26 - k * 26 - (t * 20 + i * 30) % 26, 16 + k * 6, 0, TAU); c.fill(); }
      } else if (d.id === 'nuvens') {
        G.gfx.cloud(c, x, chao - alt * 0.5, 1.6, 0.9);
      } else if (d.id === 'sombras') {
        c.fillRect(x - 120, chao - alt, 240, alt);
        for (let k = 0; k < 6; k++) c.fillRect(x - 120 + k * 44, chao - alt - 20, 26, 22);
        c.fillStyle = '#ffd60a'; c.fillRect(x - 10, chao - alt + 40, 14, 20); c.fillRect(x + 40, chao - alt + 70, 14, 20);
      } else {
        c.beginPath(); c.moveTo(x - 300, chao); c.lineTo(x, chao - alt); c.lineTo(x + 300, chao); c.fill();
        if (d.id === 'gelo' || d.id === 'bambu') {
          c.fillStyle = '#f8f9fa';
          c.beginPath(); c.moveTo(x - 70, chao - alt + 54); c.lineTo(x, chao - alt); c.lineTo(x + 70, chao - alt + 54); c.lineTo(x + 25, chao - alt + 40); c.lineTo(x, chao - alt + 58); c.lineTo(x - 25, chao - alt + 40); c.fill();
        }
      }
    });
    // pagodes ao fundo
    rep(W, 0.35, 760, function (x, i) { pagode(c, x, chao - 22, 0.7 + h01(i) * 0.3, d.id === 'sombras' ? '#5a189a' : '#bc4749'); });
    // coisas mais perto
    rep(W, 0.6, 140, function (x, i) {
      const k = h01(i + 11);
      if (d.id === 'bambu') bambu(c, x, chao - 18, 200 + k * 160, t + i);
      else if (d.id === 'gelo') { if (k < 0.5) pinheiro(c, x, chao - 14); }
      else if (d.id === 'vulcao') { if (k < 0.4) rocha(c, x, chao - 12, '#4a4e69'); }
      else if (d.id === 'nuvens') { if (k < 0.3) lanterna(c, x, chao - 18, t + i); }
      else if (k < 0.35) lanterna(c, x, chao - 18, t + i);
    });
    c.fillStyle = d.chao; c.fillRect(0, chao - 22, W, H - chao + 22);
    if (d.id === 'vulcao') {
      c.fillStyle = 'rgba(255,123,0,' + (0.5 + 0.2 * Math.sin(t * 3)) + ')';
      for (let x = -(camX % 400); x < W; x += 400) { c.beginPath(); c.ellipse(x + 200, chao + 50, 90, 10, 0, 0, TAU); c.fill(); }
    }
    c.fillStyle = d.caminho; c.fillRect(0, chao - 6, W, 30);
    c.fillStyle = 'rgba(0,0,0,.08)';
    for (let x = -(camX % 60); x < W; x += 60) c.fillRect(x, chao + 6, 22, 5);
    // as pontas da arena: portões de madeira
    for (const px of [0, ARENA]) {
      const x = px - camX;
      if (x < -100 || x > W + 100) continue;
      c.fillStyle = '#9d0208'; c.fillRect(x - 46, chao - 170, 12, 170); c.fillRect(x + 34, chao - 170, 12, 170);
      c.fillRect(x - 64, chao - 182, 128, 14); c.fillRect(x - 52, chao - 150, 104, 9);
    }
    if (d.id === 'gelo') {
      c.fillStyle = 'rgba(255,255,255,.85)';
      for (let i = 0; i < 40; i++) c.fillRect((h01(i) * W + t * 20 * (1 + h01(i + 3))) % W, (h01(i + 9) * chao + t * 60 * (0.5 + h01(i + 7))) % chao, 3, 3);
    }
  }
  function rep(W, par, passo, fn) {
    const off = camX * par, i0 = Math.floor((off - 400) / passo), i1 = Math.ceil((off + W + 400) / passo);
    for (let i = i0; i <= i1; i++) fn(i * passo - off + h01(i * 7) * passo * 0.4, i);
  }
  function pagode(c, x, y, k, telhado) {
    c.save(); c.translate(x, y); c.scale(k, k);
    c.globalAlpha = 0.55;
    for (let n = 0; n < 3; n++) {
      const w = 110 - n * 26, yy = -n * 62;
      c.fillStyle = '#ffe8d6'; c.fillRect(-w / 2 + 10, yy - 50, w - 20, 50);
      c.fillStyle = telhado; c.beginPath(); c.moveTo(-w / 2 - 18, yy - 44); c.quadraticCurveTo(0, yy - 76, w / 2 + 18, yy - 44); c.lineTo(w / 2 - 6, yy - 56); c.lineTo(-w / 2 + 6, yy - 56); c.closePath(); c.fill();
    }
    c.restore();
  }
  function bambu(c, x, y, alt, t) {
    const o = Math.sin(t * 1.2) * 6;
    c.strokeStyle = '#74c69d'; c.lineWidth = 12; c.lineCap = 'butt';
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x, y - alt / 2, x + o, y - alt); c.stroke();
    c.strokeStyle = '#40916c'; c.lineWidth = 3;
    for (let k = 1; k < alt / 44; k++) { const yy = y - k * 44, xx = x + o * (k * 44 / alt) * (k * 44 / alt); c.beginPath(); c.moveTo(xx - 7, yy); c.lineTo(xx + 7, yy); c.stroke(); }
    c.fillStyle = '#52b788';
    c.beginPath(); c.ellipse(x + o + 16, y - alt + 8, 18, 5, -0.5, 0, TAU); c.ellipse(x + o - 14, y - alt + 20, 16, 5, 0.6, 0, TAU); c.fill();
  }
  function pinheiro(c, x, y) {
    c.fillStyle = '#7f5539'; c.fillRect(x - 6, y - 26, 12, 26);
    c.fillStyle = '#2d6a4f';
    for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(x - 46 + k * 9, y - 22 - k * 34); c.lineTo(x, y - 82 - k * 34); c.lineTo(x + 46 - k * 9, y - 22 - k * 34); c.fill(); }
    c.fillStyle = '#f8f9fa'; c.beginPath(); c.moveTo(x - 14, y - 136); c.lineTo(x, y - 160); c.lineTo(x + 14, y - 136); c.fill();
  }
  function rocha(c, x, y, cor) {
    c.fillStyle = cor; c.beginPath(); c.ellipse(x, y, 50, 30, 0, Math.PI, 0); c.fill();
    c.fillStyle = 'rgba(255,255,255,.15)'; c.beginPath(); c.ellipse(x - 12, y - 10, 20, 10, 0, Math.PI, 0); c.fill();
  }
  function lanterna(c, x, y, t) {
    c.fillStyle = '#495057'; c.fillRect(x - 3, y - 90, 6, 90);
    c.fillStyle = '#e63946'; c.beginPath(); c.ellipse(x, y - 96, 14, 18, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,214,10,' + (0.5 + 0.3 * Math.sin(t * 3)) + ')'; c.beginPath(); c.ellipse(x, y - 96, 7, 11, 0, 0, TAU); c.fill();
  }

  /* ---------- os bonecos: o boneco de Lego do jogo da Marvel com fato de ninja ---------- */
  const defs = {};
  function defDe(el, mau) {
    const e = corEl(el), chave = el + (mau ? 'm' : '');
    if (!defs[chave]) defs[chave] = { id: 'nl-' + chave, tronco: e.cor, bracos: e.cor, maos: e.escuro, pele: AMARELO,
      pernas: e.cor, ancas: e.escuro, pes: e.escuro, expr: mau ? 'mau' : 'feliz' };
    return defs[chave];
  }
  // opts: { el, mau, t, passo, anda, braco, festa, noAr, sentado, tonto }
  function ninja(c, opts) {
    const B = G.scenes.marvel && G.scenes.marvel.api && G.scenes.marvel.api.boneco;
    const e = corEl(opts.el);
    const mau = !!opts.mau;
    const braco = opts.festa ? 0 : (opts.braco > 0 ? 1 : 0);
    // as pontas do nó da máscara, por trás da cabeça
    const ond = Math.sin(opts.t * 9 + (opts.passo || 0)) * 3 + (opts.anda ? 3 : 0);
    c.fillStyle = mau ? '#7b2cbf' : '#f8f9fa';
    c.beginPath(); c.moveTo(-7, -64); c.quadraticCurveTo(-14, -66 + ond * 0.4, -22 - ond, -60 + ond); c.lineTo(-20 - ond, -56 + ond); c.quadraticCurveTo(-13, -60, -7, -60); c.fill();
    c.beginPath(); c.moveTo(-7, -62); c.quadraticCurveTo(-13, -58, -19 - ond * 0.6, -50 + ond * 0.5); c.lineTo(-16 - ond * 0.6, -48 + ond * 0.5); c.quadraticCurveTo(-11, -56, -7, -59); c.fill();
    if (B) {
      B(c, defDe(opts.el, mau), { t: opts.t, dir: 1, fase: opts.passo || 0, anda: !!opts.anda, braco: braco, cima: !!opts.festa, noAr: !!opts.noAr, tonto: !!opts.tonto,
        partes: opts.sentado ? { pernas: { dx: 2, dy: -2, r: -1.25 } } : null });
    } else {
      c.fillStyle = e.cor; G.gfx.rr(c, -10, -50, 20, 26, 4); c.fill();
      c.fillStyle = e.cor; G.gfx.rr(c, -8, -24, 16, 24, 3); c.fill();
    }
    // capuz e máscara por cima da cabeça (só os olhos à mostra)
    c.fillStyle = e.cor;
    G.gfx.rr(c, -8.8, -73, 17.6, 22.5, 6); c.fill();
    // a fita na testa (branca nos nossos, roxa nos das sombras)
    c.fillStyle = mau ? '#7b2cbf' : '#f8f9fa'; G.gfx.rr(c, -9.2, -68.4, 18.4, 3.6, 1.4); c.fill();
    c.fillStyle = mau ? '#ffd23f' : AMARELO;
    G.gfx.rr(c, -6.8, -64.2, 13.6, 6.2, 2.4); c.fill();
    c.fillStyle = mau ? '#d00000' : '#22223b';
    c.beginPath(); c.ellipse(-2.2, -61, 1.25, 1.8, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(4.2, -61, 1.25, 1.8, 0, 0, TAU); c.fill();
    c.strokeStyle = '#22223b'; c.lineWidth = 1.1; c.lineCap = 'round';
    if (mau) {
      c.beginPath(); c.moveTo(-4.5, -64); c.lineTo(-0.6, -62.6); c.stroke();
      c.beginPath(); c.moveTo(6.5, -64); c.lineTo(2.6, -62.6); c.stroke();
    }
    // o cinto e o símbolo do elemento no peito
    c.fillStyle = mau ? '#7b2cbf' : '#ffd166';
    c.fillRect(-11.4, -31, 22.8, 3.2);
    c.fillStyle = mau ? '#c77dff' : e.bola;
    c.beginPath(); c.arc(0, -42, 3.6, 0, TAU); c.fill();
    c.fillStyle = mau ? '#14141f' : '#ffffff';
    c.beginPath(); c.arc(0, -42, 1.5, 0, TAU); c.fill();
    // a mão a brilhar com o poder quando dispara
    if (braco > 0) {
      const ang = -0.2 - 1.35, hx = 9.2 - Math.sin(ang) * 18.5, hy = -47 + Math.cos(ang) * 18.5;
      c.fillStyle = mau ? 'rgba(199,125,255,.75)' : e.luz;
      c.globalAlpha *= 0.8; c.beginPath(); c.arc(hx, hy, 7, 0, TAU); c.fill(); c.globalAlpha /= 0.8;
    }
  }

  function desenhaNj(c, t) {
    c.save(); c.translate(nj.x, nj.y);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(0, 2 - nj.y, 26, 6, 0, 0, TAU); c.fill();
    if (nj.inv > 0 && Math.floor(t * 12) % 2 === 0 && nj.descansa <= 0) c.globalAlpha = 0.5;
    if (nj.dir < 0) c.scale(-1, 1);
    c.scale(1.4, 1.4);
    if (nj.descansa > 0) {
      ninja(c, { el: 'fogo', t: t, sentado: true, tonto: false, braco: 0 });
      c.font = '20px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#000';
      c.fillText('💤', 14, -84 - (t * 20) % 20);
    } else {
      if (nj.saltos === 2 && !nj.noChao) c.rotate((nj.vy + SALTO) / SALTO * 3);
      ninja(c, { el: 'fogo', t: t, passo: nj.passo, anda: nj.anda, braco: nj.braco, noAr: !nj.noChao });
    }
    c.restore();
    const y = nj.y - 140 + Math.sin(t * 6) * 4;
    c.fillStyle = '#ffd60a'; c.strokeStyle = '#7a5a00'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(nj.x - 10, y - 10); c.lineTo(nj.x + 10, y - 10); c.lineTo(nj.x, y + 2); c.closePath(); c.fill(); c.stroke();
  }

  function desenhaNinjaEnt(c, e, t) {
    const k = tam(e);
    c.save(); c.translate(e.x, e.y);
    c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(0, 2 - e.y, 18 * k, 5, 0, 0, TAU); c.fill();
    const salta = e.festa > 0 && e.noChao ? -Math.abs(Math.sin(t * 10)) * 14 : 0;
    c.translate(0, salta);
    if (e.pisca > 0 && Math.floor(t * 24) % 2 === 0) c.globalAlpha = 0.5;
    if (e.dir < 0) c.scale(-1, 1);
    c.scale(k, k);
    ninja(c, { el: e.el, mau: e.equipa === 'mau', t: t, passo: e.passo, anda: Math.abs(e.vx) > 30 && e.noChao, braco: e.braco,
      festa: e.festa > 0 || e.vaiTreinar, noAr: !e.noChao });
    if (e.tipo !== 'ninja') {      // os mestres têm um chapéu de palha / o chefe uns cornos
      if (e.tipo === 'chefe') {
        c.fillStyle = e.equipa === 'mau' ? '#c77dff' : '#ffd166';
        c.beginPath(); c.moveTo(-7, -72); c.lineTo(-12, -84); c.lineTo(-3, -73); c.fill();
        c.beginPath(); c.moveTo(7, -72); c.lineTo(12, -84); c.lineTo(3, -73); c.fill();
      } else {
        c.fillStyle = '#d4a373'; c.beginPath(); c.moveTo(-17, -70); c.lineTo(0, -82); c.lineTo(17, -70); c.closePath(); c.fill();
        c.strokeStyle = '#a47148'; c.lineWidth = 1; c.stroke();
      }
    }
    c.restore();
    // a energia que falta (só nos maus)
    if (e.equipa === 'mau' && e.hp < e.max) {
      const b = caixa(e), w = 26 + k * 12;
      c.fillStyle = 'rgba(0,0,0,.3)'; G.gfx.rr(c, b.x - w / 2, b.y - b.ry - 26, w, 7, 3); c.fill();
      c.fillStyle = '#c77dff'; G.gfx.rr(c, b.x - w / 2, b.y - b.ry - 26, Math.max(4, w * (e.hp / e.max)), 7, 3); c.fill();
    }
  }

  function desenhaBola(c, s, t) {
    const e = corEl(s.el), r = s.r;
    c.save(); c.translate(s.x, s.y);
    c.fillStyle = e.bola; c.globalAlpha = 0.35; c.beginPath(); c.arc(0, 0, r * 1.7, 0, TAU); c.fill();
    c.globalAlpha = 1;
    if (s.el === 'raio') {
      c.rotate(Math.atan2(s.vy, s.vx));
      c.fillStyle = e.bola; c.beginPath();
      c.moveTo(-r * 1.4, -r * 0.4); c.lineTo(0, -r * 0.8); c.lineTo(-r * 0.2, -r * 0.1); c.lineTo(r * 1.4, r * 0.3); c.lineTo(0, r * 0.8); c.lineTo(r * 0.2, r * 0.1); c.closePath(); c.fill();
    } else if (s.el === 'gelo') {
      c.rotate(t * 6);
      c.strokeStyle = '#ffffff'; c.lineWidth = 3;
      for (let k = 0; k < 3; k++) { c.rotate(TAU / 6); c.beginPath(); c.moveTo(-r, 0); c.lineTo(r, 0); c.stroke(); }
      c.fillStyle = e.bola; c.beginPath(); c.arc(0, 0, r * 0.45, 0, TAU); c.fill();
    } else if (s.el === 'terra') {
      c.rotate(t * 5);
      c.fillStyle = e.bola; c.beginPath();
      for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, rr = r * (0.8 + h01(k) * 0.3); c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      c.closePath(); c.fill();
      c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.arc(-r * 0.3, -r * 0.2, r * 0.25, 0, TAU); c.fill();
    } else if (s.el === 'vento') {
      c.rotate(-t * 10);
      c.strokeStyle = e.bola; c.lineWidth = 3;
      c.beginPath(); for (let a = 0; a < 10; a += 0.3) c.lineTo(Math.cos(a) * a * r * 0.11, Math.sin(a) * a * r * 0.11); c.stroke();
    } else {
      c.fillStyle = e.bola; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
      c.fillStyle = s.el === 'sombra' ? '#14141f' : e.luz; c.beginPath(); c.arc(0, 0, r * 0.5, 0, TAU); c.fill();
    }
    c.restore();
  }

  function desenhaFesta(c, W, H, t) {
    c.save(); c.translate(W / 2, H * 0.28 + Math.sin(t * 3) * 8); c.scale(2.6, 2.6);
    c.translate(0, 40);
    ninja(c, { el: 'fogo', t: t, festa: true, braco: 0 });
    c.restore();
    G.gfx.label(c, 'GANHASTE!', W / 2, H * 0.28 + 80, 44, '#e63946', 'center');
  }

  function hud(c, t) {
    const k = Math.min(1, G.H / 520);
    c.save(); c.scale(k, k);
    for (let i = 0; i < MAXC; i++) {
      const x = 28 + i * 36, y = 34, f = clamp(nj.coracoes - i, 0, 1);
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
    // as cinco terras: as conseguidas com um visto
    const ic = ['🎋', '❄️', '🌋', '☁️', '🏯'];
    for (let i = 0; i < TERRAS.length; i++) {
      const x = 34 + i * 46, y = 124, atual = i === terra;
      c.fillStyle = atual ? 'rgba(255,214,10,.9)' : 'rgba(255,255,255,.6)';
      c.beginPath(); c.arc(x, y, atual ? 22 : 18, 0, TAU); c.fill();
      c.font = (atual ? 24 : 19) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000';
      c.globalAlpha = i < terra || fase === 'festa' || atual ? 1 : 0.45;
      c.fillText(ic[i], x, y + 1);
      c.globalAlpha = 1;
      if (i < terra || fase === 'festa') G.gfx.star(c, x + 14, y - 14, 7, '#ffd166', 0);
    }
    // a equipa: uma cabecinha de ninja por cada amigo
    const eq = equipa();
    for (let i = 0; i < MAX_EQUIPA; i++) {
      c.save(); c.translate(34 + i * 30, 182); c.scale(1.05, 1.05); c.translate(0, 62);
      if (i < eq.length) cabecaNinja(c, eq[i].el);
      else { c.globalAlpha = 0.25; cabecaNinja(c, 'sombra'); c.globalAlpha = 1; }
      c.restore();
    }
    // o poder gigante (a encher)
    c.save(); c.translate(32, 226);
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.fill();
    const pronto = superCd <= 0;
    c.strokeStyle = pronto ? '#ff7b00' : '#ffffff'; c.lineWidth = 5;
    c.beginPath(); c.arc(0, 0, 20, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - superCd / SUPER_CD)); c.stroke();
    c.font = (pronto ? 22 + Math.sin(t * 6) * 2 : 20) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000';
    c.fillText('🌀', 0, 1);
    c.restore();
    // as ondas desta terra
    for (let i = 0; i < ondas.length; i++) {
      const feita = i < onda || (i === onda && !maus().length);
      c.fillStyle = feita ? '#ffd166' : (i === onda ? '#c77dff' : 'rgba(255,255,255,.5)');
      c.beginPath(); c.arc(70 + i * 22, 226, i === ondas.length - 1 ? 9 : 7, 0, TAU); c.fill();
    }
    c.restore();
    document.body.classList.toggle('nl-super-espera', superCd > 0);
  }
  function cabecaNinja(c, el) {
    const e = corEl(el);
    c.fillStyle = e.cor; G.gfx.rr(c, -8.8, -73, 17.6, 22.5, 6); c.fill();
    c.fillStyle = '#f8f9fa'; G.gfx.rr(c, -9.2, -68.4, 18.4, 3.6, 1.4); c.fill();
    c.fillStyle = AMARELO; G.gfx.rr(c, -6.8, -64.2, 13.6, 6.2, 2.4); c.fill();
    c.fillStyle = '#22223b';
    c.beginPath(); c.ellipse(-2.2, -61, 1.25, 1.8, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(4.2, -61, 1.25, 1.8, 0, 0, TAU); c.fill();
  }

  S.debug = function () {
    return { terra: T().id, fase: fase, ronda: ronda, onda: onda, ondas: ondas.length, x: Math.round(nj.x), coracoes: nj.coracoes, descansa: nj.descansa > 0,
      maus: maus().length, equipa: equipa().length, bolas: bolas.length, conquistados: conquistados, super: +superCd.toFixed(1) };
  };
  S.api = {
    vaiPara: function (i) { comecaTerra(i, equipa().map(function (e) { return e.el; })); },
    nj: function () { return nj; }, ents: function () { return ents; }, bolas: function () { return bolas; }
  };

  G.scenes = G.scenes || {};
  G.scenes.ninjaslego = S;
})();
