/* Cena — O JIPE CONTRA OS ROBÔS, ditada pelo Isaac (2026-11-11).

   "Um jogo novo de robôs em que o Isaac e o pai têm de conduzir um carro e disparar,
   o meu pai com uma pistola comprida. E que seja difícil."

   Como ficou:
   - O Isaac e o pai vão num jipe aberto pela estrada fora, sempre para a direita.
     O Isaac vai ao volante: ◀ ▶ trava/acelera (e faz um bocadinho de marcha atrás)
     e ⬆ salta por cima das pedras e das ondas de choque no chão.
   - O pai vai de pé lá atrás com uma espingarda comprida de laser: 🔫 dispara (segurar
     dispara sempre) e o laser vai sozinho ao robô mau mais perto, mesmo aos que voam.
     💥 é o tiro especial: enche devagarinho e, quando está cheio, faz uma onda de
     choque enorme que acerta em todos os robôs maus que se vêem.
   - Os robôs maus: os rolantes que vêm pela estrada e disparam, os drones que largam
     bombas lá de cima, os saltadores grandes que pulam, e os carros-robô que nos
     perseguem por trás e depois passam para a frente. Disparam muito e dos dois lados!
   - Ninguém morre (regra da coleção): quando um robô fica sem energia dá faíscas, os
     olhos vermelhos ficam verdes ou azuis e passa a ser um robô BOM. Vem atrás do jipe
     e dispara aos maus. Cabem 6 amigos; os que sobram dizem adeus e vão para casa.
   - Cinco terras (deserto, floresta, neve, fábrica dos robôs e a terra do robô gigante),
     cada uma com um robô chefe ao fundo. Quando o Robô Gigante fica nosso amigo há festa
     com fogo de artifício e depois começa outra volta, mais difícil.
   - É difícil, mas nunca há derrota: cada tiro tira meio coração; sem corações o jipe
     para, o pai e o Isaac sentam-se a descansar um bocadinho 💤 e voltam com 5 corações. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  /* ---------- dificuldade: está tudo aqui para afinar ---------- */
  const DIF = {
    MAXC: 5, DANO: 0.5, INV: 0.8,              // corações, quanto tira cada tiro, invencível depois (s)
    BALA_V: 430, BALA_V_TERRA: 28, BALA_V_RONDA: 40,
    CD_MAU: [1.3, 2.4],                        // de quanto em quanto tempo dispara cada robô mau (s)
    FORCA_TERRA: 0.16, FORCA_RONDA: 0.22,      // em cada terra / volta disparam mais depressa
    DRONE_INT: 5.0, DRONE_MIN: 2.0,            // drones novos a chegar pelo ar (s)
    CARRO_INT: 12, CARRO_MIN: 5,               // carros-robô que vêm por trás (s)
    GRUPOS: 7, GRUPOS_TERRA: 2, PEDRAS: 6, PEDRAS_TERRA: 2,
    HP: { rolante: 3, drone: 2, saltador: 6, carromau: 5 },
    CHEFE_HP: [26, 32, 40, 48, 70], CHEFE_RONDA: 12,
    LASER_V: 1500, LASER_CD: 0.2, ALCANCE: 1000,
    ESPECIAL_T: 12, ESPECIAL_DANO: 4, MAX_AMIGOS: 6
  };
  const GRAV = 1800, SALTO = 900, VCRUZ = 150, VMAX = 380, VRE = -150;
  const PAI_X = -50, PAI_Y = -46, PAI_K = 1.3, ISAAC_X = 14, ISAAC_Y = -37, ISAAC_K = 1.0;

  const TERRAS = [
    { id: 'deserto', nome: 'O deserto dos robôs', fala: 'O deserto! Os robôs maus vêm aí!', ceu: ['#ffb703', '#ffe8a3'], longe: '#e9c46a', perto: '#2d6a4f', chao: '#f4d58d', estrada: '#b08968',
      chefe: { nome: 'o Escorpião de Lata', cor: '#c9a227', det: 'cauda', k: 1 } },
    { id: 'floresta', nome: 'A floresta escura', fala: 'A floresta! Há drones por cima das árvores!', ceu: ['#90e0ef', '#e9f5db'], longe: '#6a994e', perto: '#386641', chao: '#57a773', estrada: '#8d6e63',
      chefe: { nome: 'a Aranha de Ferro', cor: '#588157', det: 'pernas', k: 1 } },
    { id: 'neve', nome: 'As montanhas de neve', fala: 'A neve! Cuidado que o jipe escorrega!', ceu: ['#bde0fe', '#f1faee'], longe: '#adb5bd', perto: '#2d6a4f', chao: '#f8f9fa', estrada: '#ced4da',
      chefe: { nome: 'o Urso de Gelo', cor: '#90e0ef', det: 'gelo', k: 1.1 } },
    { id: 'fabrica', nome: 'A fábrica dos robôs', fala: 'A fábrica dos robôs! Aqui são muitos!', ceu: ['#6d597a', '#b56576'], longe: '#495057', perto: '#343a40', chao: '#6c757d', estrada: '#495057',
      chefe: { nome: 'a Grua Gigante', cor: '#f77f00', det: 'grua', k: 1.2 } },
    { id: 'gigante', nome: 'A terra do Robô Gigante', fala: 'O Robô Gigante! Vamos fazê-lo nosso amigo!', ceu: ['#3c096c', '#c77dff'], longe: '#5a189a', perto: '#240046', chao: '#7b2cbf', estrada: '#3c096c',
      chefe: { nome: 'o Robô Gigante', cor: '#9d4edd', det: 'coroa', k: 1.6 }, ultima: true }
  ];
  const PELE = '#f2c6a0';
  const ISAAC = { id: 'rc-isaac', tronco: '#e63946', bracos: '#e63946', maos: PELE, pele: PELE, pernas: '#1d3557', ancas: '#1d3557', pes: '#f1faee' };
  const PAI = { id: 'rc-pai', tronco: '#2a9d8f', bracos: '#2a9d8f', maos: PELE, pele: PELE, pernas: '#3a5a80', ancas: '#264653', pes: '#3d2c1e' };

  let carro, pai, ents, chefe, tiros, pedras, parts, textos, ondas, camX, terra, ronda, tempo, LEN;
  let fase, faseT, especial, droneT, carroT, nid = 0, piloto = false, ultimoPop = 0, conquistadas;

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
  function forca() { return 1 + terra * DIF.FORCA_TERRA + (ronda - 1) * DIF.FORCA_RONDA; }
  function balaV() { return DIF.BALA_V + terra * DIF.BALA_V_TERRA + (ronda - 1) * DIF.BALA_V_RONDA; }
  function noEcra(x, m) { return Math.abs(x - camX - vw() / 2) < vw() * (m || 0.55); }

  S.enter = function () {
    ronda = 1; tempo = 0; conquistadas = 0;
    comecaTerra(0, []);
  };

  /* ---------- uma terra nova: robôs e pedras pelo caminho e o chefe ao fundo ---------- */
  function comecaTerra(i, amigos) {
    terra = i;
    LEN = 6400 + i * 500;
    camX = 0;
    tiros = []; parts = []; textos = []; ondas = []; ents = []; pedras = [];
    carro = { x: 220, y: 0, vy: 0, v: 0, noChao: true, roda: 0, cd: 0, coracoes: DIF.MAXC, inv: 2, descansa: 0, tiro: 0 };
    pai = { ang: -0.05, dir: 1 };
    especial = 0.5;
    const n = DIF.GRUPOS + i * DIF.GRUPOS_TERRA + (ronda - 1);
    const de = 1000, ate = LEN - 1400, passo = (ate - de) / n;
    for (let g = 0; g < n; g++) {
      const gx = de + g * passo + rnd(0, passo * 0.4);
      const quantos = 1 + Math.floor(rnd(0, 1.5 + i * 0.4));
      for (let k = 0; k < quantos; k++) ents.push(robo('rolante', gx + k * 90, 0));
      if (Math.random() < 0.25 + i * 0.12) ents.push(robo('saltador', gx + 260, 0));
    }
    const np = DIF.PEDRAS + i * DIF.PEDRAS_TERRA;
    for (let k = 0; k < np; k++) pedras.push({ x: 800 + (k + rnd(0.1, 0.8)) * ((LEN - 1600) / np), w: rnd(50, 80), h: rnd(34, 50), partida: false });
    const cd = T().chefe;
    chefe = robo('chefe', LEN - 200, 0);
    chefe.chefe = true; chefe.k = cd.k; chefe.cor = cd.cor; chefe.det = cd.det; chefe.nome = cd.nome; chefe.ativo = false;
    chefe.hp = chefe.max = DIF.CHEFE_HP[i] + (ronda - 1) * DIF.CHEFE_RONDA;
    ents.push(chefe);
    // os amigos vêm connosco de terra em terra
    for (let k = 0; k < Math.min(amigos.length, DIF.MAX_AMIGOS); k++) {
      const a = robo(amigos[k], carro.x - 160 - k * 80, amigos[k] === 'drone' ? -250 : 0);
      a.equipa = 'bom'; ents.push(a);
    }
    droneT = 4; carroT = 9;
    fase = 'joga'; faseT = 0;
    G.banner('🚙 ' + T().nome, 2400);
    fala(T().fala);
  }

  function robo(tipo, x, y) {
    const hp = (DIF.HP[tipo] || 10) + (ronda - 1) + (terra >= 3 ? 1 : 0);
    return { id: ++nid, tipo: tipo, x: x, y: y, vx: 0, vy: 0, dir: -1, equipa: 'mau', hp: hp, max: hp, k: 1,
      cd: rnd(1, 2.5), cd2: rnd(1, 3), pisca: 0, faisca: 0, noChao: true, fase: rnd(0, 6), ofs: rnd(140, 460), t: 0, lado: -1 };
  }
  function maus() { return ents.filter(function (e) { return e.equipa === 'mau' && (!e.chefe || e.ativo); }); }
  function amigos() { return ents.filter(function (e) { return e.equipa === 'bom' && !e.chefe && !e.vaiCasa; }); }

  // o corpo de cada um (para os tiros acertarem)
  function caixa(e) {
    if (e.tipo === 'drone') return { x: e.x, y: e.y, rx: 36, ry: 22 };
    if (e.tipo === 'saltador') return { x: e.x, y: e.y - 62, rx: 40, ry: 62 };
    if (e.tipo === 'carromau') return { x: e.x, y: e.y - 44, rx: 70, ry: 44 };
    if (e.tipo === 'chefe') return { x: e.x, y: e.y - 125 * e.k, rx: 85 * e.k, ry: 125 * e.k };
    return { x: e.x, y: e.y - 40, rx: 28, ry: 40 };
  }
  function caixaCarro() { return { x: carro.x, y: carro.y - 72, rx: 86, ry: 64 }; }
  function dentro(b, x, y) { return Math.abs(x - b.x) < b.rx && Math.abs(y - b.y) < b.ry; }

  /* ---------- a espingarda comprida do pai ---------- */
  function ombro() { return { x: carro.x + PAI_X + pai.dir * PAI_K * 9.2, y: carro.y + PAI_Y - PAI_K * 47 }; }
  // ângulo do braço no desenho (o boneco está virado para pai.dir)
  function angLocal() { let a = pai.dir > 0 ? pai.ang : Math.PI - pai.ang; while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return clamp(a, -1.35, 0.4); }
  function boca() {
    const o = ombro(), a = angLocal(), L = (18.5 + 64) * PAI_K;
    return { x: o.x + pai.dir * Math.cos(a) * L, y: o.y + Math.sin(a) * L };
  }
  function alvoDoPai() {
    const o = ombro();
    let melhor = null, md = 1e9, atras = null, mda = 1e9;
    for (const e of maus()) {
      const b = caixa(e), dx = b.x - o.x, d = Math.hypot(dx, b.y - o.y);
      if (dx > 20 && d < DIF.ALCANCE && d < md) { md = d; melhor = b; }
      if (dx <= 20 && d < 700 && d < mda) { mda = d; atras = b; }
    }
    return melhor || atras;
  }
  function paiDispara() {
    const alvo = alvoDoPai(), b = boca();
    let ang = alvo ? Math.atan2(alvo.y - b.y, alvo.x - b.x) : (pai.dir > 0 ? pai.ang : Math.PI - pai.ang);
    ang += rnd(-0.02, 0.02);
    tiros.push({ x: b.x, y: b.y, vx: Math.cos(ang) * DIF.LASER_V, vy: Math.sin(ang) * DIF.LASER_V, nossa: true, tipo: 'laser', t: 0 });
    carro.tiro = 0.1;
    sfx('pew');
  }
  function usaEspecial() {
    especial = 0;
    sfx('trovao'); G.shake = 0.5;
    ondas.push({ x: carro.x, y: carro.y - 70, r: 20, t: 0 });
    tiros = tiros.filter(function (s) { return s.nossa; });
    for (const e of maus()) if (noEcra(e.x, 0.6)) acerta(e, DIF.ESPECIAL_DANO);
    G.banner('💥 Tiro especial!', 1100);
    fala('Tiro especial!');
  }

  /* ---------- acertar: os robôs maus ficam bons ---------- */
  function acerta(e, dano) {
    if (e.equipa !== 'mau') return;
    e.hp -= dano; e.pisca = 0.2;
    const b = caixa(e);
    faiscas(b.x, b.y, 4, '#ffd166');
    if (e.hp > 0) { if (tempo - ultimoPop > 0.12) { sfx('pop'); ultimoPop = tempo; } return; }
    converte(e);
  }
  function converte(e) {
    e.equipa = 'bom'; e.faisca = 1.4; e.cd = rnd(1, 2); e.hp = 0;
    const b = caixa(e);
    faiscas(b.x, b.y, 16, '#80ff72');
    texto('💚', b.x, b.y - b.ry - 30);
    sfx('beep');
    if (e.chefe) {
      G.addStars(10); sfx('tada');
      G.banner('🤖 ' + e.nome.charAt(0).toUpperCase() + e.nome.slice(1) + ' é nosso amigo!', 2600);
      fala('O robô chefe agora é nosso amigo!');
      for (const m of maus()) converte(m);
      tiros = tiros.filter(function (s) { return s.nossa; });
      fase = 'ganhou'; faseT = 0;
      return;
    }
    G.addStars(1);
    if (fase === 'joga' && Math.random() < 0.4) fala(['Agora és um robô bom!', 'Mais um amigo robô!', 'Boa, pai!', 'Os olhos ficaram verdes!'][Math.floor(rnd(0, 4))]);
    if (amigos().length > DIF.MAX_AMIGOS) { e.vaiCasa = true; texto('👋', b.x, b.y - b.ry - 70); }
  }
  function magoa() {
    if (carro.inv > 0 || carro.descansa > 0 || fase !== 'joga') return;
    carro.coracoes = Math.max(0, carro.coracoes - DIF.DANO);
    carro.inv = DIF.INV; G.shake = 0.3;
    sfx('ouch');
    faiscas(carro.x, carro.y - 90, 6, '#ff6b6b');
    if (carro.coracoes <= 0) {
      carro.descansa = 2.5;
      G.banner('O pai e o Isaac vão descansar um bocadinho 💤', 2300);
      fala('Estamos cansados. Vamos descansar um bocadinho!');
      tiros = tiros.filter(function (s) { return s.nossa; });
    }
  }
  function faiscas(x, y, n, cor) {
    for (let i = 0; i < n; i++) parts.push({ x: x, y: y, vx: rnd(-240, 240), vy: rnd(-340, -60), t: 0, life: rnd(0.4, 0.8), cor: cor, r: rnd(3, 7) });
  }
  function tiroMau(x, y, tx, ty, espalha) {
    const v = balaV(), a = Math.atan2(ty - y, tx - x) + rnd(-espalha, espalha);
    tiros.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, nossa: false, tipo: 'bola', t: 0 });
  }

  /* ---------- o piloto automático (para testar) ---------- */
  function autopiloto() {
    let salta = false;
    for (const p of pedras) { const d = p.x - p.w / 2 - 50 - carro.x; if (!p.partida && d > 0 && d < carro.v * 0.06 + 30) salta = true; }
    for (const s of tiros) {
      if (s.nossa) continue;
      if (s.tipo === 'onda' && Math.abs(s.x - carro.x) < 200) salta = true;
      if (s.tipo === 'bola' && s.y > -110 && Math.abs(s.x - carro.x) < 160 && Math.abs(s.vy) < 150) salta = true;
    }
    const perto = chefe.equipa === 'mau' && chefe.ativo && carro.x > limite() - 60;
    return { ax: perto ? 0 : 1, salta: salta && carro.noChao, fogo: true,
      especial: especial >= 1 && (maus().filter(function (e) { return noEcra(e.x); }).length >= 3 || chefe.ativo) };
  }
  function leInput() {
    if (piloto) return autopiloto();
    const I = G.input;
    return { ax: I.axis().x, salta: I.justPressed('jump'), fogo: I.isHeld('fire'), especial: I.justPressed('horn') };
  }
  function limite() { return chefe.equipa === 'mau' ? chefe.x - 300 * chefe.k : LEN + 900; }

  /* ---------- update ---------- */
  S.update = function (dt) {
    dt = Math.min(dt, 1 / 30);
    tempo += dt;
    const inp = leInput();
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.t += dt; p.vy += 700 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.t > p.life) parts.splice(i, 1);
    }
    for (let i = textos.length - 1; i >= 0; i--) { textos[i].age += dt; textos[i].y -= 40 * dt; if (textos[i].age > textos[i].life) textos.splice(i, 1); }
    for (let i = ondas.length - 1; i >= 0; i--) { const o = ondas[i]; o.t += dt; o.r += 1400 * dt; if (o.t > 0.7) ondas.splice(i, 1); }

    if (fase === 'passa') {            // a ir para a terra seguinte, com os amigos atrás
      faseT += dt;
      carro.v = 360; carro.x += carro.v * dt; carro.roda += carro.v * dt / 24;
      seguem(dt);
      camX += (carro.x - vw() * 0.3 - camX) * Math.min(1, dt * 3);
      if (faseT > 2.2) comecaTerra((terra + 1) % TERRAS.length, amigos().map(function (e) { return e.tipo; }));
      return;
    }
    if (fase === 'festa') {
      faseT += dt;
      if (Math.random() < dt * 6) fogo(camX + rnd(100, vw() - 100), rnd(-vh() * 0.6, -vh() * 0.3));
      for (const e of ents) if (e.equipa === 'bom' && e.noChao && e.tipo !== 'drone' && Math.random() < dt * 2) { e.vy = -500; e.noChao = false; }
      fisicaSaltos(dt);
      if (faseT > 10) {
        ronda++; conquistadas = 0;
        G.banner('🤖 Outra volta! Agora é mais difícil', 2600);
        comecaTerra(0, amigos().map(function (e) { return e.tipo; }));
      }
      return;
    }
    if (fase === 'ganhou') {
      faseT += dt;
      if (faseT > 2.8) {
        if (T().ultima) {
          fase = 'festa'; faseT = 0; conquistadas = TERRAS.length;
          G.banner('🏆 GANHÁMOS! OS ROBÔS SÃO TODOS AMIGOS! 🎆', 6000);
          fala('Ganhámos! Os robôs são todos nossos amigos! Boa, Isaac! Boa, pai!');
          G.addStars(20); sfx('tada');
          return;
        }
        conquistadas = Math.max(conquistadas, terra + 1);
        G.addStars(5);
        fase = 'passa'; faseT = 0; sfx('vroom');
        G.banner('▶ Para a terra seguinte!', 1800);
        return;
      }
    }

    atualizaCarro(dt, inp);
    if (fase === 'joga') chegam(dt);
    atualizaRobos(dt);
    atualizaTiros(dt);
    // ver o chefe ao fundo
    if (!chefe.ativo && carro.x > chefe.x - 1100) {
      chefe.ativo = true; sfx('sirene');
      G.banner('⚠️ Cuidado! ' + chefe.nome.charAt(0).toUpperCase() + chefe.nome.slice(1) + '!', 2400);
      fala('Cuidado! Vem aí ' + chefe.nome + '!');
    }
    ents = ents.filter(function (e) {
      if (e.vaiCasa) return e.x > camX - 250 && e.y > -vh() - 100;
      if (e.equipa === 'mau' && (e.tipo === 'rolante' || e.tipo === 'saltador')) return e.x > camX - 700;   // ficam lá atrás na estrada
      return true;
    });
    if (document.body) document.body.classList.toggle('robocarro-especial-espera', especial < 1);
  };

  function atualizaCarro(dt, inp) {
    carro.inv = Math.max(0, carro.inv - dt); carro.tiro = Math.max(0, carro.tiro - dt); carro.cd -= dt;
    especial = Math.min(1, especial + dt / DIF.ESPECIAL_T);
    if (carro.descansa > 0) {
      carro.descansa -= dt;
      carro.v *= 1 - Math.min(1, dt * 5);
      if (carro.descansa <= 0) {
        carro.coracoes = DIF.MAXC; carro.inv = 2; sfx('suit');
        G.banner('Prontos outra vez! 🚙', 1500); fala('Já descansámos! Vamos!');
      }
    } else {
      const ax = inp.ax;
      let alvoV = VCRUZ;
      if (ax > 0.1) alvoV = VCRUZ + (VMAX - VCRUZ) * ax;
      else if (ax < -0.1) alvoV = VRE * -ax;
      const agarra = T().id === 'neve' ? 0.6 : 1;
      carro.v += (alvoV - carro.v) * Math.min(1, dt * (ax < -0.1 ? 3 : 1.6) * agarra);
      if (inp.salta && carro.noChao) { carro.vy = -SALTO; carro.noChao = false; sfx('hop'); }
      if (inp.fogo && carro.cd <= 0) { paiDispara(); carro.cd = DIF.LASER_CD; }
      if (inp.especial && especial >= 1) usaEspecial();
    }
    carro.x += carro.v * dt;
    carro.vy += GRAV * dt; carro.y += carro.vy * dt;
    if (carro.y >= 0) { if (!carro.noChao && carro.vy > 600) G.shake = Math.max(G.shake, 0.12); carro.y = 0; carro.vy = 0; carro.noChao = true; }
    carro.x = clamp(carro.x, 110, limite());
    carro.roda += carro.v * dt / 24;
    camX += (Math.max(0, carro.x - vw() * 0.3) - camX) * Math.min(1, dt * 4);
    // o pai aponta a espingarda
    const alvo = alvoDoPai(), o = ombro();
    if (alvo) {
      pai.dir = alvo.x > o.x - 20 ? 1 : -1;
      const quer = Math.atan2(alvo.y - o.y, alvo.x - o.x);
      let d = quer - pai.ang; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
      pai.ang += d * Math.min(1, dt * 12);
    } else { pai.dir = 1; pai.ang += (-0.05 - pai.ang) * Math.min(1, dt * 4); }
    // as pedras: saltar por cima! (se bater, a pedra parte-se e o jipe recua)
    for (const p of pedras) {
      if (p.partida || carro.y < -p.h + 6) continue;
      if (Math.abs(p.x - carro.x) < p.w / 2 + 50) {      // só as rodas batem
        p.partida = true; sfx('quebra'); magoa();
        if (carro.v > 0) carro.v = -110;
        for (let k = 0; k < 8; k++) parts.push({ x: p.x, y: -p.h / 2, vx: rnd(-200, 200), vy: rnd(-380, -120), t: 0, life: 0.8, cor: '#868e96', r: rnd(4, 8) });
      }
    }
  }

  // robôs novos: drones pelo ar e carros-robô por trás
  function chegam(dt) {
    if (carro.descansa > 0) return;
    droneT -= dt; carroT -= dt;
    const ms = maus();
    if (droneT <= 0) {
      droneT = Math.max(DIF.DRONE_MIN, DIF.DRONE_INT - terra * 0.6 - (ronda - 1) * 0.5) * rnd(0.8, 1.2);
      if (ms.filter(function (e) { return e.tipo === 'drone'; }).length < 2 + terra) ents.push(robo('drone', camX + vw() + 80, -rnd(240, 330)));
    }
    if (carroT <= 0) {
      carroT = Math.max(DIF.CARRO_MIN, DIF.CARRO_INT - terra * 1.4 - (ronda - 1)) * rnd(0.8, 1.2);
      if (ms.filter(function (e) { return e.tipo === 'carromau'; }).length < 1 + (terra >= 2 ? 1 : 0)) {
        const e = robo('carromau', camX - 180, 0); e.vx = carro.v + 200; ents.push(e);
        sfx('vroom');
      }
    }
  }

  function fisicaSaltos(dt) {
    for (const e of ents) {
      if (e.tipo === 'drone' || e.noChao) continue;
      e.vy += GRAV * 0.8 * dt; e.y += e.vy * dt; e.x += e.vx * dt;
      if (e.y >= 0) { e.y = 0; e.vy = 0; e.noChao = true; if (e.equipa === 'mau') e.vx = 0; }
    }
  }

  function atualizaRobos(dt) {
    const pode = fase === 'joga' && carro.descansa <= 0, fz = forca();
    const alvoC = { x: carro.x, y: carro.y - 70 };
    for (const e of ents) {
      e.t += dt; e.pisca = Math.max(0, e.pisca - dt); e.faisca = Math.max(0, e.faisca - dt);
      if (e.equipa === 'bom') continue;
      const dx = carro.x - e.x, longe = Math.abs(dx), b = caixa(e);
      e.dir = dx > 0 ? 1 : -1;
      if (e.tipo === 'rolante') {
        if (longe < vw()) { const q = longe > 320 ? e.dir * 70 : 0; e.vx += (q - e.vx) * Math.min(1, dt * 3); e.x += e.vx * dt; }
      } else if (e.tipo === 'saltador') {
        if (longe < vw() && e.noChao) {
          e.cd2 -= dt;
          if (e.cd2 <= 0) { e.vy = -rnd(800, 1000); e.vx = e.dir * Math.min(280, longe * 0.7); e.noChao = false; e.cd2 = rnd(1.4, 2.4) / fz; }
        }
      } else if (e.tipo === 'drone') {
        const tx = carro.x + e.ofs + Math.sin(e.t * 0.9 + e.fase) * 160, ty = -260 - Math.sin(e.t * 1.7 + e.fase) * 50;
        e.x += clamp(tx - e.x, -420 * dt, 420 * dt); e.y += (ty - e.y) * Math.min(1, dt * 2);
        e.cd2 -= dt;
        if (pode && e.cd2 <= 0 && Math.abs(e.x - (carro.x + carro.v * 0.45)) < 70) {
          tiros.push({ x: e.x, y: e.y + 18, vx: carro.v * 0.3, vy: 0, nossa: false, tipo: 'bomba', t: 0 });
          e.cd2 = rnd(1.6, 2.6) / fz; sfx('canhao');
        }
      } else if (e.tipo === 'carromau') {
        // começa atrás de nós e depois passa para a frente
        if (e.t > 7) e.lado = 1;
        const tx = carro.x + e.lado * (e.lado > 0 ? 400 : 300) + Math.sin(e.t + e.fase) * 60;
        const q = clamp((tx - e.x) * 2.5, -560, 560);
        e.vx += (q - e.vx) * Math.min(1, dt * 2.5); e.x += e.vx * dt;
        e.x = Math.min(e.x, limite() + 200);
      } else if (e.tipo === 'chefe' && e.ativo) {
        e.cd2 -= dt;
        if (pode && e.cd2 <= 0) {
          // chama um drone ou faz uma onda de choque no chão (é preciso saltar!)
          if (Math.random() < 0.5 && maus().filter(function (m) { return m.tipo === 'drone'; }).length < 4) {
            const d = robo('drone', e.x, e.y - 250 * e.k); d.ofs = rnd(150, 350); ents.push(d); sfx('beep');
          } else {
            tiros.push({ x: e.x - 80 * e.k, y: 0, vx: -380 - terra * 20, vy: 0, nossa: false, tipo: 'onda', t: 0 }); sfx('smash'); G.shake = 0.25;
          }
          e.cd2 = rnd(4, 6) / fz;
        }
      }
      fisicaSaltosUm(e, dt);
      // tocar no jipe também magoa
      if (e.tipo !== 'drone' && e.tipo !== 'chefe' && Math.abs(e.x - carro.x) < b.rx + 70 && b.y + b.ry > carro.y - 120 && b.y - b.ry < carro.y) magoa();
      // disparar (só quem se vê no ecrã)
      if (pode && noEcra(e.x) && (e.tipo !== 'chefe' || e.ativo)) {
        e.cd -= dt;
        if (e.cd <= 0) {
          const sx = b.x + e.dir * b.rx * 0.6, sy = b.y - b.ry * 0.3;
          if (e.tipo === 'chefe') {
            const n = T().ultima ? 5 : 3;
            for (let k = 0; k < n; k++) tiroMau(sx, sy, alvoC.x + (k - (n - 1) / 2) * 110, alvoC.y, 0.04);
            e.cd = rnd(1.0, 1.5) / fz;
          } else {
            tiroMau(sx, sy, alvoC.x + carro.v * 0.3, alvoC.y, 0.06);
            e.cd = rnd(DIF.CD_MAU[0], DIF.CD_MAU[1]) / fz * (e.tipo === 'saltador' ? 1.4 : 1);
          }
        }
      }
    }
    seguem(dt);
  }
  function fisicaSaltosUm(e, dt) {
    if (e.tipo === 'drone' || e.noChao) return;
    e.vy += GRAV * 0.8 * dt; e.y += e.vy * dt; e.x += e.vx * dt;
    if (e.y >= 0) {
      e.y = 0; e.vy = 0; e.noChao = true;
      if (e.equipa === 'mau') { e.vx = 0; if (noEcra(e.x)) { G.shake = Math.max(G.shake, 0.15); sfx('smash'); } }
    }
  }

  // os robôs bons vêm atrás do jipe e disparam aos maus
  function seguem(dt) {
    const ms = maus();
    let k = 0;
    for (const e of ents) {
      if (e.equipa !== 'bom') continue;
      if (e.vaiCasa) { if (e.tipo === 'drone') e.y -= 220 * dt; else { e.x -= 260 * dt; e.dir = -1; } continue; }
      if (!e.chefe) {
        if (e.tipo === 'drone') {
          const tx = carro.x - 60 + k * 55, ty = -240 - (k % 2) * 46 + Math.sin(tempo * 2 + k) * 10;
          e.x += clamp(tx - e.x, -620 * dt, 620 * dt); e.y += (ty - e.y) * Math.min(1, dt * 3);
        } else {
          const tx = carro.x - 180 - k * 85, q = clamp((tx - e.x) * 3, -600, 600);
          e.vx += (q - e.vx) * Math.min(1, dt * 4);
          if (e.noChao) e.x += e.vx * dt;
          fisicaSaltosUm(e, dt);
        }
        e.dir = 1; k++;
      }
      if (fase !== 'joga') continue;
      e.cd -= dt;
      if (e.cd <= 0) {
        let alvo = null, md = 800;
        const b = caixa(e);
        for (const m of ms) { const mb = caixa(m), d = Math.hypot(mb.x - b.x, mb.y - b.y); if (d < md) { md = d; alvo = mb; } }
        if (alvo && noEcra(b.x, 0.6)) {
          const a = Math.atan2(alvo.y - b.y, alvo.x - b.x);
          tiros.push({ x: b.x, y: b.y - b.ry * 0.3, vx: Math.cos(a) * 1200, vy: Math.sin(a) * 1200, nossa: true, tipo: 'laser', amigo: true, t: 0 });
          e.cd = e.chefe ? rnd(0.9, 1.4) : rnd(1.6, 2.6);
        } else e.cd = 0.4;
      }
    }
  }

  function atualizaTiros(dt) {
    const cc = caixaCarro(), lista = tiros;     // (magoa() pode trocar a lista: acabamos esta volta na antiga)
    for (let i = lista.length - 1; i >= 0; i--) {
      const s = lista[i];
      s.t += dt;
      if (s.tipo === 'bomba') s.vy += 900 * dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      let fora = s.t > (s.nossa ? 1.2 : 4);
      if (s.nossa) {
        for (const e of ents) {
          if (e.equipa !== 'mau' || (e.chefe && !e.ativo)) continue;
          if (dentro(caixa(e), s.x, s.y)) { acerta(e, 1); fora = true; break; }
        }
      } else if (s.tipo === 'onda') {
        if (Math.abs(s.x - carro.x) < 80 && carro.y > -36) { magoa(); fora = true; }
        if (s.x < camX - 100) fora = true;
      } else if (dentro(cc, s.x, s.y)) { magoa(); fora = true; }
      else if (s.tipo === 'bomba' && s.y >= 0) {
        fora = true; sfx('smash');
        faiscas(s.x, -10, 8, '#ff9f1c');
        if (Math.abs(s.x - carro.x) < 110 && carro.y > -60) magoa();
      }
      if (s.y > 30 || s.y < -vh() - 200) fora = true;
      if (fora) lista.splice(i, 1);
    }
  }

  function fogo(x, y) {
    const cor = ['#ffd166', '#4cc9f0', '#ff6fb1', '#80ff72', '#ffffff'][Math.floor(rnd(0, 5))];
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
    for (const p of pedras) desenhaPedra(c, p);
    for (const s of tiros) if (s.tipo === 'onda') desenhaTiro(c, s, t);
    for (const e of ents) if (e.chefe) desenhaRobo(c, e, t);
    for (const e of ents) if (!e.chefe && e.tipo !== 'drone' && e.equipa === 'mau') desenhaRobo(c, e, t);
    for (const e of ents) if (!e.chefe && e.tipo !== 'drone' && e.equipa === 'bom') desenhaRobo(c, e, t);
    desenhaCarro(c, t);
    for (const e of ents) if (e.tipo === 'drone') desenhaRobo(c, e, t);
    for (const s of tiros) if (s.tipo !== 'onda') desenhaTiro(c, s, t);
    for (const o of ondas) {
      c.globalAlpha = Math.max(0, 1 - o.t / 0.7);
      c.strokeStyle = '#4cc9f0'; c.lineWidth = 18; c.beginPath(); c.arc(o.x, o.y, o.r, 0, TAU); c.stroke();
      c.strokeStyle = '#ffffff'; c.lineWidth = 6; c.beginPath(); c.arc(o.x, o.y, o.r * 0.92, 0, TAU); c.stroke();
    }
    for (const p of parts) { c.globalAlpha = Math.max(0, 1 - p.t / p.life); c.fillStyle = p.cor; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); }
    c.globalAlpha = 1;
    c.font = '34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000';
    for (const tx of textos) { c.globalAlpha = Math.max(0, 1 - tx.age / tx.life); c.fillText(tx.t, tx.x, tx.y); }
    c.globalAlpha = 1;
    c.restore();
    if (fase === 'festa') desenhaFesta(c, W, H, t);
    c.restore();
    hud(c, t);
  };

  function rep(W, par, passo, fn) {
    const off = camX * par, i0 = Math.floor((off - 400) / passo), i1 = Math.ceil((off + W + 400) / passo);
    for (let i = i0; i <= i1; i++) fn(i * passo - off + h01(i * 7) * passo * 0.4, i);
  }
  function fundo(c, W, H, chao, t) {
    const d = T();
    const g = c.createLinearGradient(0, 0, 0, chao);
    g.addColorStop(0, d.ceu[0]); g.addColorStop(1, d.ceu[1]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (d.id === 'fabrica' || d.id === 'gigante') {
      c.fillStyle = 'rgba(255,255,255,.7)';
      for (let i = 0; i < 30; i++) c.fillRect(h01(i) * W, h01(i + 40) * chao * 0.5, 2, 2);
    } else {
      c.fillStyle = 'rgba(255,214,10,.9)'; c.beginPath(); c.arc(W * 0.8, H * 0.16, 38, 0, TAU); c.fill();
      for (let i = 0; i < 4; i++) {
        const x = ((i * 420 - camX * 0.1 + t * 12) % (W + 400) + W + 400) % (W + 400) - 200;
        G.gfx.cloud(c, x, H * (0.12 + h01(i) * 0.15), 0.9 + h01(i + 5) * 0.5, 0.85);
      }
    }
    // ao longe
    rep(W, 0.15, 480, function (x, i) {
      const alt = 130 + h01(i) * 130;
      c.fillStyle = d.longe;
      if (d.id === 'deserto') { c.beginPath(); c.ellipse(x, chao, 280, alt * 0.7, 0, Math.PI, 0); c.fill(); }
      else if (d.id === 'fabrica') {
        c.fillRect(x - 120, chao - alt, 240, alt); c.fillRect(x + 50, chao - alt - 90, 30, 90);
        c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(x + 65 + Math.sin(t + i) * 8, chao - alt - 110 - (t * 20 + i * 30) % 40, 18, 0, TAU); c.fill();
        c.fillStyle = '#ffd166'; for (let k = 0; k < 4; k++) c.fillRect(x - 100 + k * 55, chao - alt + 30, 20, 16);
      } else if (d.id === 'gigante') {
        c.fillRect(x - 40, chao - alt - 80, 80, alt + 80);
        c.fillStyle = Math.sin(t * 3 + i) > 0 ? '#ff6fb1' : '#4cc9f0'; c.beginPath(); c.arc(x, chao - alt - 92, 8, 0, TAU); c.fill();
      } else {
        c.beginPath(); c.moveTo(x - 300, chao); c.lineTo(x, chao - alt - 40); c.lineTo(x + 300, chao); c.fill();
        if (d.id === 'neve') { c.fillStyle = '#f8f9fa'; c.beginPath(); c.moveTo(x - 60, chao - alt + 20); c.lineTo(x, chao - alt - 40); c.lineTo(x + 60, chao - alt + 20); c.fill(); }
      }
    });
    // mais perto
    rep(W, 0.5, 320, function (x, i) {
      const k = h01(i + 11), y = chao - 20;
      if (d.id === 'deserto') { if (k < 0.6) cato(c, x, y); }
      else if (d.id === 'floresta') { arvore(c, x, y, d.perto); if (k < 0.5) arvore(c, x + 110, y + 6, d.longe); }
      else if (d.id === 'neve') { if (k < 0.7) pinheiro(c, x, y); }
      else if (d.id === 'fabrica') { roda(c, x, y - 70, 40, t * (k < 0.5 ? 1 : -1)); c.fillStyle = '#212529'; c.fillRect(x - 6, y - 70, 12, 70); }
      else { c.fillStyle = d.perto; c.fillRect(x - 10, y - 140, 20, 140); c.fillStyle = Math.sin(t * 4 + i) > 0 ? '#80ff72' : '#ffd166'; c.beginPath(); c.arc(x, y - 146, 9, 0, TAU); c.fill(); }
    });
    c.fillStyle = d.chao; c.fillRect(0, chao - 22, W, H - chao + 22);
    c.fillStyle = d.estrada; c.fillRect(0, chao - 6, W, 32);
    c.fillStyle = 'rgba(255,255,255,.5)';
    for (let x = -(camX % 90); x < W; x += 90) c.fillRect(x, chao + 8, 40, 4);
    if (d.id === 'neve') {
      c.fillStyle = '#ffffff';
      for (let i = 0; i < 40; i++) c.fillRect((h01(i) * W + Math.sin(t + i) * 20 - camX * 0.3 % W + W) % W, (h01(i + 9) * H + t * 60) % H, 4, 4);
    }
  }
  function cato(c, x, y) {
    c.fillStyle = '#2d6a4f'; G.gfx.rr(c, x - 10, y - 80, 20, 80, 9); c.fill();
    G.gfx.rr(c, x - 34, y - 60, 12, 30, 6); c.fill(); c.fillRect(x - 30, y - 38, 22, 10);
    G.gfx.rr(c, x + 22, y - 70, 12, 30, 6); c.fill(); c.fillRect(x + 8, y - 48, 22, 10);
  }
  function arvore(c, x, y, cor) {
    c.fillStyle = '#7f5539'; c.fillRect(x - 7, y - 60, 14, 60);
    c.fillStyle = cor; c.beginPath(); c.arc(x, y - 80, 40, 0, TAU); c.arc(x - 28, y - 58, 28, 0, TAU); c.arc(x + 28, y - 58, 28, 0, TAU); c.fill();
  }
  function pinheiro(c, x, y) {
    c.fillStyle = '#7f5539'; c.fillRect(x - 6, y - 26, 12, 26);
    c.fillStyle = '#2d6a4f';
    for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(x - 46 + k * 9, y - 22 - k * 34); c.lineTo(x, y - 82 - k * 34); c.lineTo(x + 46 - k * 9, y - 22 - k * 34); c.fill(); }
    c.fillStyle = '#f8f9fa'; c.beginPath(); c.moveTo(x - 14, y - 136); c.lineTo(x, y - 160); c.lineTo(x + 14, y - 136); c.fill();
  }
  function roda(c, x, y, r, a) {
    c.save(); c.translate(x, y); c.rotate(a);
    c.fillStyle = '#868e96';
    for (let k = 0; k < 8; k++) { c.rotate(TAU / 8); c.fillRect(-6, -r - 8, 12, 14); }
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.fillStyle = '#495057'; c.beginPath(); c.arc(0, 0, r * 0.4, 0, TAU); c.fill();
    c.restore();
  }
  function desenhaPedra(c, p) {
    if (p.partida) { c.fillStyle = '#868e96'; for (let k = -1; k <= 1; k++) { c.beginPath(); c.arc(p.x + k * 18, -6, 8, 0, TAU); c.fill(); } return; }
    c.fillStyle = '#6c757d'; c.beginPath(); c.ellipse(p.x, 4, p.w / 2, p.h, 0, Math.PI, 0); c.fill();
    c.fillStyle = '#adb5bd'; c.beginPath(); c.ellipse(p.x - p.w * 0.15, -p.h * 0.45, p.w * 0.18, p.h * 0.2, 0, 0, TAU); c.fill();
  }

  /* ---------- as pessoas: o boneco do jogo da Marvel com pele de gente ---------- */
  function pessoa(c, def, o) {
    const B = G.scenes && G.scenes.marvel && G.scenes.marvel.api && G.scenes.marvel.api.boneco;
    c.save(); c.scale(o.K * (o.dir || 1), o.K);
    if (B) {
      B(c, def, { t: o.t, dir: 1, fase: 0, anda: false, braco: o.braco || 0, cima: !!o.cima,
        partes: o.sentado ? { pernas: { dx: 2, dy: -2, r: -1.25 } } : null });
    } else pessoaSimples(c, def, o);
    // o cabelo por cima da cabeça
    c.fillStyle = o.cabelo; G.gfx.rr(c, -8.5, -70, 17, 6, 3); c.fill(); c.fillRect(-8.5, -68, 4, 9);
    if (o.arma !== undefined) espingarda(c, o.arma, o.flash);
    c.restore();
  }
  function pessoaSimples(c, def, o) {
    c.strokeStyle = def.pernas; c.lineWidth = 8; c.lineCap = 'round';
    c.beginPath();
    if (o.sentado) { c.moveTo(0, -24); c.lineTo(16, -20); } else { c.moveTo(-4, -26); c.lineTo(-4, 0); c.moveTo(4, -26); c.lineTo(4, 0); }
    c.stroke();
    c.fillStyle = def.tronco; G.gfx.rr(c, -9, -50, 18, 26, 5); c.fill();
    c.fillStyle = def.pele; c.beginPath(); c.arc(0, -60, 9, 0, TAU); c.fill();
    c.fillStyle = '#22223b'; c.beginPath(); c.arc(4, -61, 1.4, 0, TAU); c.fill();
    const a = -0.2 - 1.35 * (o.braco || 0);
    c.strokeStyle = def.bracos; c.lineWidth = 6;
    c.beginPath(); c.moveTo(9.2, -47); c.lineTo(9.2 - Math.sin(a) * 18.5, -47 + Math.cos(a) * 18.5); c.stroke();
  }
  // a espingarda comprida de laser, na mão do pai (ângulo a, no desenho do boneco)
  function espingarda(c, a, flash) {
    const hx = 9.2 + Math.cos(a) * 18.5, hy = -47 + Math.sin(a) * 18.5;
    c.save(); c.translate(hx, hy); c.rotate(a);
    c.fillStyle = '#6b4226'; G.gfx.rr(c, -24, -4, 16, 9, 3); c.fill();
    c.fillStyle = '#343a40'; G.gfx.rr(c, -10, -3.5, 76, 7, 2); c.fill();
    c.fillStyle = '#212529'; G.gfx.rr(c, 8, -8, 18, 5, 2); c.fill();
    c.fillStyle = '#4cc9f0'; c.fillRect(20, -1, 40, 2);
    if (flash) { c.fillStyle = 'rgba(76,201,240,.8)'; c.beginPath(); c.arc(68, 0, 8, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(68, 0, 4, 0, TAU); c.fill(); }
    c.restore();
  }

  function desenhaCarro(c, t) {
    const parado = carro.descansa > 0;
    const sobe = carro.noChao && Math.abs(carro.v) > 20 ? Math.abs(Math.sin(carro.roda * 0.8)) * -2.5 : 0;
    c.save(); c.translate(carro.x, carro.y);
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0, 4 - carro.y, 100, 10, 0, 0, TAU); c.fill();
    if (carro.inv > 0 && !parado && Math.floor(t * 12) % 2 === 0) c.globalAlpha = 0.55;
    c.translate(0, sobe);
    // a barra de proteção atrás
    c.strokeStyle = '#495057'; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-92, -70); c.lineTo(-86, -122); c.lineTo(-12, -122); c.lineTo(-6, -70); c.stroke();
    // o pai (de pé com a espingarda, ou sentado a descansar) e o Isaac ao volante
    const aL = angLocal();
    c.save(); c.translate(PAI_X, parado ? -40 : PAI_Y);
    if (parado) pessoa(c, PAI, { K: PAI_K, t: t, sentado: true, braco: 0, cabelo: '#3d2c1e' });
    else pessoa(c, PAI, { K: PAI_K, dir: pai.dir, t: t, braco: (Math.PI / 2 - aL - 0.2) / 1.35, cabelo: '#3d2c1e', arma: aL, flash: carro.tiro > 0 });
    c.restore();
    c.save(); c.translate(ISAAC_X, ISAAC_Y);
    pessoa(c, ISAAC, { K: ISAAC_K, t: t, sentado: true, braco: parado ? 0 : 0.55, cabelo: '#8d5524', cima: fase === 'festa' && Math.sin(t * 6) > 0 });
    c.restore();
    // a carroçaria
    c.fillStyle = '#f4a261'; G.gfx.rr(c, -100, -74, 200, 42, 10); c.fill();
    c.beginPath(); c.moveTo(50, -74); c.lineTo(104, -64); c.lineTo(104, -36); c.lineTo(50, -36); c.fill();
    c.fillStyle = '#e76f51'; c.fillRect(-100, -54, 204, 7);
    c.fillStyle = '#264653'; G.gfx.rr(c, 96, -44, 12, 14, 3); c.fill();       // para-choques
    c.fillStyle = '#ffd166'; c.beginPath(); c.arc(100, -62, 6, 0, TAU); c.fill(); // farol
    c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(-20, -72, 3, 38);                // porta
    // o volante e o vidro da frente
    c.strokeStyle = '#212529'; c.lineWidth = 3;
    c.beginPath(); c.ellipse(42, -78, 4, 11, 0.35, 0, TAU); c.stroke();
    c.beginPath(); c.moveTo(40, -74); c.lineTo(54, -66); c.stroke();
    c.strokeStyle = '#495057'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(58, -74); c.lineTo(48, -112); c.stroke();
    c.fillStyle = 'rgba(189,224,254,.45)'; c.beginPath(); c.moveTo(58, -74); c.lineTo(48, -112); c.lineTo(54, -112); c.lineTo(64, -74); c.fill();
    // as rodas grandes do jipe
    for (const rx of [-62, 62]) {
      c.save(); c.translate(rx, -24);
      c.fillStyle = '#212529'; c.beginPath(); c.arc(0, 0, 25, 0, TAU); c.fill();
      c.fillStyle = '#adb5bd'; c.beginPath(); c.arc(0, 0, 11, 0, TAU); c.fill();
      c.rotate(carro.roda); c.strokeStyle = '#495057'; c.lineWidth = 3;
      for (let k = 0; k < 3; k++) { c.rotate(TAU / 3); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 10); c.stroke(); }
      c.restore();
    }
    c.globalAlpha = 1;
    if (parado) {
      c.font = '30px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#000';
      c.fillText('💤', -20, -150 - (t * 30) % 30);
    }
    c.restore();
    // a setinha amarela por cima do jipe
    const y = carro.y - 196 + Math.sin(t * 6) * 4;
    c.fillStyle = '#ffd60a'; c.strokeStyle = '#7a5a00'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(carro.x - 10, y - 10); c.lineTo(carro.x + 10, y - 10); c.lineTo(carro.x, y + 2); c.closePath(); c.fill(); c.stroke();
  }

  /* ---------- os robôs ---------- */
  function corOlho(e) { return e.equipa === 'mau' ? '#ff2d2d' : (e.id % 2 ? '#4cc9f0' : '#80ff72'); }
  function olhos(c, e, x, y, r, sep) {
    const cor = corOlho(e);
    c.fillStyle = '#111'; G.gfx.rr(c, x - sep - r * 1.6, y - r * 1.3, sep * 2 + r * 3.2, r * 2.6, r); c.fill();
    c.fillStyle = cor; c.shadowColor = cor; c.shadowBlur = 10;
    for (const s of [-sep, sep]) { c.beginPath(); c.arc(x + s, y, r, 0, TAU); c.fill(); }
    c.shadowBlur = 0;
  }
  function antena(c, e, x, y, h, t) {
    c.strokeStyle = '#495057'; c.lineWidth = 3;
    const bal = e.vaiCasa ? Math.sin(t * 10) * 10 : 0;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + bal, y - h); c.stroke();
    c.fillStyle = e.equipa === 'mau' ? '#ff2d2d' : corOlho(e);
    c.beginPath(); c.arc(x + bal, y - h, 5, 0, TAU); c.fill();
  }
  function desenhaRobo(c, e, t) {
    const mau = e.equipa === 'mau', cor = mau ? '#6c757d' : '#adb5bd', faixa = mau ? '#d62828' : (e.id % 2 ? '#4361ee' : '#2a9d8f');
    c.save(); c.translate(e.x, e.y);
    if (e.tipo !== 'drone') { c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(0, 2 - e.y, (e.tipo === 'chefe' ? 90 * e.k : 34), 7, 0, 0, TAU); c.fill(); }
    if (e.pisca > 0 && Math.floor(t * 24) % 2 === 0) c.globalAlpha = 0.55;
    if (e.tipo === 'rolante') {
      c.fillStyle = '#343a40'; c.beginPath(); c.arc(0, -15, 15, 0, TAU); c.fill();
      c.strokeStyle = '#868e96'; c.lineWidth = 3; c.beginPath(); c.arc(0, -15, 9, e.x / 15, e.x / 15 + 4); c.stroke();
      c.fillStyle = cor; G.gfx.rr(c, -24, -62, 48, 36, 8); c.fill();
      c.fillStyle = faixa; c.fillRect(-24, -46, 48, 6);
      c.fillStyle = cor; G.gfx.rr(c, -18, -86, 36, 24, 6); c.fill();
      olhos(c, e, e.dir * 3, -74, 4, 7);
      antena(c, e, 0, -86, 14, t);
      c.fillStyle = '#495057'; c.fillRect(e.dir > 0 ? 18 : -38, -52, 20, 8);
    } else if (e.tipo === 'drone') {
      c.fillStyle = cor; c.beginPath(); c.ellipse(0, 0, 32, 15, 0, 0, TAU); c.fill();
      c.fillStyle = faixa; c.fillRect(-32, -2, 64, 4);
      for (const s of [-30, 30]) {
        c.fillStyle = '#495057'; c.fillRect(s - 2, -22, 4, 10);
        c.fillStyle = 'rgba(33,37,41,.6)'; c.beginPath(); c.ellipse(s, -22, Math.abs(Math.sin(t * 40 + s)) * 22 + 3, 3, 0, 0, TAU); c.fill();
      }
      olhos(c, e, 0, 2, 5, 0);
      c.fillStyle = '#343a40'; c.fillRect(-4, 12, 8, 8);
      if (e.vaiCasa) { c.font = '22px sans-serif'; c.textAlign = 'center'; c.fillText('👋', 0, -34); }
    } else if (e.tipo === 'saltador') {
      const aperta = e.noChao ? 0.75 + Math.sin(e.t * 8) * 0.05 : 1.15;
      c.strokeStyle = '#495057'; c.lineWidth = 4;
      for (const s of [-18, 18]) {
        c.beginPath(); c.moveTo(s, -36 * aperta);
        for (let k = 1; k <= 6; k++) c.lineTo(s + (k % 2 ? 8 : -8), -36 * aperta + k * 6 * aperta);
        c.stroke();
        c.fillStyle = '#343a40'; c.fillRect(s - 12, -6, 24, 6);
      }
      c.translate(0, -36 * aperta + 36);
      c.fillStyle = cor; G.gfx.rr(c, -38, -112, 76, 76, 14); c.fill();
      c.fillStyle = faixa; c.fillRect(-38, -66, 76, 8);
      olhos(c, e, e.dir * 6, -90, 7, 13);
      antena(c, e, -20, -112, 18, t); antena(c, e, 20, -112, 18, t);
      c.fillStyle = '#495057'; c.fillRect(e.dir > 0 ? 34 : -58, -76, 24, 12);
    } else if (e.tipo === 'carromau') {
      c.scale(e.dir, 1);
      c.fillStyle = mau ? '#495057' : '#4361ee'; G.gfx.rr(c, -72, -60, 144, 36, 10); c.fill();
      c.fillStyle = faixa; c.fillRect(-72, -44, 144, 6);
      c.fillStyle = cor; G.gfx.rr(c, -22, -92, 44, 32, 7); c.fill();
      olhos(c, e, 5, -78, 5, 9);
      c.fillStyle = '#343a40'; c.fillRect(20, -84, 30, 8);
      antena(c, e, -14, -92, 14, t);
      for (const rx of [-46, 46]) {
        c.fillStyle = '#212529'; c.beginPath(); c.arc(rx, -20, 19, 0, TAU); c.fill();
        c.fillStyle = '#868e96'; c.beginPath(); c.arc(rx, -20, 7, 0, TAU); c.fill();
      }
    } else if (e.tipo === 'chefe') {
      chefeDesenho(c, e, t, mau, faixa);
    }
    // faíscas a mudar de mau para bom
    if (e.faisca > 0) {
      const b = caixa(e);
      c.strokeStyle = Math.floor(t * 20) % 2 ? '#ffd166' : '#ffffff'; c.lineWidth = 3;
      for (let k = 0; k < 5; k++) {
        const a = h01(k + Math.floor(t * 15)) * TAU, r = b.rx;
        c.beginPath(); c.moveTo(Math.cos(a) * r * 0.5, b.y - e.y + Math.sin(a) * b.ry * 0.5);
        c.lineTo(Math.cos(a) * r * 0.8 + 6, b.y - e.y + Math.sin(a) * b.ry * 0.8 - 6); c.lineTo(Math.cos(a) * r * 1.1, b.y - e.y + Math.sin(a) * b.ry * 1.1); c.stroke();
      }
    }
    c.restore();
    if (e.vaiCasa && e.tipo !== 'drone') { c.font = '22px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText('👋', e.x, e.y - 120); }
    // a energia que falta (só nos maus; o do chefe aparece lá em cima)
    if (mau && !e.chefe && e.hp < e.max) {
      const b = caixa(e), w = 44;
      c.fillStyle = 'rgba(0,0,0,.25)'; G.gfx.rr(c, b.x - w / 2, b.y - b.ry - 22, w, 7, 3); c.fill();
      c.fillStyle = '#80ff72'; G.gfx.rr(c, b.x - w / 2, b.y - b.ry - 22, w * (1 - e.hp / e.max), 7, 3); c.fill();
    }
  }
  function chefeDesenho(c, e, t, mau, faixa) {
    const k = e.k, base = mau ? e.cor : '#adb5bd';
    c.scale(k * -1, k);       // o chefe olha para a esquerda (para nós)
    const bob = Math.sin(t * 2) * 4;
    // pernas / lagartas
    if (e.det === 'pernas') {
      c.strokeStyle = '#343a40'; c.lineWidth = 8;
      for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
        const px = s * (30 + i * 24), mexe = Math.sin(t * 6 + i) * 6;
        c.beginPath(); c.moveTo(px * 0.6, -90); c.lineTo(px * 1.4, -60 + mexe); c.lineTo(px * 1.6, 0); c.stroke();
      }
    } else {
      c.fillStyle = '#343a40'; G.gfx.rr(c, -86, -46, 172, 46, 22); c.fill();
      c.fillStyle = '#6c757d'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-62 + i * 25, -23, 10, 0, TAU); c.fill(); }
    }
    c.translate(0, bob);
    if (e.det === 'cauda') {
      c.strokeStyle = base; c.lineWidth = 16; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-60, -110); c.quadraticCurveTo(-140, -220, -40, -270); c.stroke();
      c.fillStyle = mau ? '#d62828' : '#80ff72'; c.beginPath(); c.moveTo(-40, -290); c.lineTo(-20, -262); c.lineTo(-52, -258); c.fill();
    }
    if (e.det === 'grua') {
      c.strokeStyle = '#495057'; c.lineWidth = 10;
      c.beginPath(); c.moveTo(-40, -190); c.lineTo(-110, -290); c.lineTo(60, -300); c.stroke();
      c.lineWidth = 3; c.beginPath(); c.moveTo(60, -300); c.lineTo(60, -250 + Math.sin(t * 2) * 10); c.stroke();
      c.fillStyle = '#ffd166'; c.fillRect(48, -252 + Math.sin(t * 2) * 10, 24, 14);
    }
    c.fillStyle = base; G.gfx.rr(c, -78, -200, 156, 130, 18); c.fill();
    c.fillStyle = faixa; c.fillRect(-78, -120, 156, 10);
    c.fillStyle = 'rgba(0,0,0,.2)'; G.gfx.rr(c, -40, -180, 80, 44, 8); c.fill();
    c.fillStyle = base; G.gfx.rr(c, -54, -256, 108, 58, 12); c.fill();
    olhos(c, e, 8, -228, 10, 20);
    if (e.det === 'gelo') { c.fillStyle = '#e0fbfc'; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-48 + i * 24, -256); c.lineTo(-36 + i * 24, -284); c.lineTo(-24 + i * 24, -256); c.fill(); } }
    else if (e.det === 'coroa') { c.fillStyle = '#ffd166'; c.beginPath(); c.moveTo(-50, -256); c.lineTo(-50, -290); c.lineTo(-25, -270); c.lineTo(0, -300); c.lineTo(25, -270); c.lineTo(50, -290); c.lineTo(50, -256); c.fill(); }
    else antena(c, e, 0, -256, 26, t);
    // os braços-canhão
    c.fillStyle = '#495057';
    c.fillRect(60, -170, 70, 22); c.fillRect(-130, -170, 70, 22);
    c.fillStyle = mau ? '#ff2d2d' : corOlho(e);
    c.beginPath(); c.arc(130, -159, 7, 0, TAU); c.fill();
  }

  function desenhaTiro(c, s, t) {
    if (s.tipo === 'laser') {
      const a = Math.atan2(s.vy, s.vx), cor = s.amigo ? '#80ff72' : '#4cc9f0';
      c.save(); c.translate(s.x, s.y); c.rotate(a);
      c.strokeStyle = cor; c.lineWidth = 7; c.globalAlpha = 0.5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-60, 0); c.lineTo(0, 0); c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 3; c.globalAlpha = 1;
      c.beginPath(); c.moveTo(-50, 0); c.lineTo(0, 0); c.stroke();
      c.restore();
    } else if (s.tipo === 'bomba') {
      c.fillStyle = '#212529'; c.beginPath(); c.arc(s.x, s.y, 11, 0, TAU); c.fill();
      c.fillStyle = Math.floor(t * 12) % 2 ? '#ff2d2d' : '#ffd166'; c.beginPath(); c.arc(s.x, s.y - 12, 4, 0, TAU); c.fill();
    } else if (s.tipo === 'onda') {
      c.fillStyle = 'rgba(255,45,45,.35)'; c.beginPath(); c.ellipse(s.x, -14, 34, 30, 0, Math.PI, 0); c.fill();
      c.strokeStyle = '#ff2d2d'; c.lineWidth = 4; c.beginPath(); c.ellipse(s.x, -4, 28, 22 + Math.sin(t * 20) * 4, 0, Math.PI, 0); c.stroke();
    } else {
      c.fillStyle = 'rgba(255,45,45,.4)'; c.beginPath(); c.arc(s.x, s.y, 12, 0, TAU); c.fill();
      c.fillStyle = '#ff2d2d'; c.beginPath(); c.arc(s.x, s.y, 7, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(s.x, s.y, 3, 0, TAU); c.fill();
    }
  }

  function desenhaFesta(c, W, H, t) {
    c.save(); c.translate(W / 2, H * 0.28 + Math.sin(t * 3) * 8); c.scale(1.6, 1.6);
    c.fillStyle = '#adb5bd'; G.gfx.rr(c, -50, -34, 100, 64, 14); c.fill();
    olhos(c, { equipa: 'bom', id: Math.floor(t * 2) }, 0, -8, 9, 20);
    c.strokeStyle = '#212529'; c.lineWidth = 4; c.beginPath(); c.arc(0, 8, 14, 0.2, Math.PI - 0.2); c.stroke();
    c.restore();
    G.gfx.label(c, 'GANHÁMOS! SÃO TODOS AMIGOS!', W / 2, H * 0.28 + 90, 36, '#2a9d8f', 'center');
  }

  /* ---------- o painel: corações, estrelas, terras, amigos e o tiro especial ---------- */
  function hud(c, t) {
    const k = Math.min(1, G.H / 520);
    c.save(); c.scale(k, k);
    for (let i = 0; i < DIF.MAXC; i++) {
      const x = 28 + i * 36, y = 34, f = clamp(carro.coracoes - i, 0, 1);
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
    // as cinco terras: uma cabeça de robô em cada (olhos verdes quando já é nossa)
    for (let i = 0; i < TERRAS.length; i++) {
      const x = 34 + i * 46, y = 128, atual = i === terra;
      c.save(); c.translate(x, y); c.scale(atual ? 1.15 : 0.95, atual ? 1.15 : 0.95);
      c.fillStyle = atual ? 'rgba(255,214,10,.9)' : 'rgba(255,255,255,.6)';
      c.beginPath(); c.arc(0, 0, 21, 0, TAU); c.fill();
      c.fillStyle = TERRAS[i].chefe.cor; G.gfx.rr(c, -13, -11, 26, 22, 5); c.fill();
      const nossa = i < conquistadas || (i === terra && (fase === 'ganhou' || fase === 'passa' || fase === 'festa'));
      c.fillStyle = nossa ? '#80ff72' : '#ff2d2d';
      c.beginPath(); c.arc(-5, -2, 3.5, 0, TAU); c.arc(5, -2, 3.5, 0, TAU); c.fill();
      c.restore();
    }
    // os amigos robôs: quantos vêm connosco
    c.save(); c.translate(270, 128);
    c.fillStyle = '#adb5bd'; G.gfx.rr(c, -15, -13, 30, 26, 6); c.fill();
    c.fillStyle = '#4cc9f0'; c.beginPath(); c.arc(-6, -2, 4, 0, TAU); c.fill(); c.fillStyle = '#80ff72'; c.beginPath(); c.arc(6, -2, 4, 0, TAU); c.fill();
    c.restore();
    G.gfx.label(c, '' + amigos().length, 292, 130, 26, '#2a9d8f');
    // o tiro especial (a encher)
    c.save(); c.translate(32, 182);
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.fill();
    const pronto = especial >= 1;
    c.strokeStyle = pronto ? '#9ef01a' : '#ffffff'; c.lineWidth = 5;
    c.beginPath(); c.arc(0, 0, 20, -Math.PI / 2, -Math.PI / 2 + TAU * especial); c.stroke();
    c.font = (pronto ? 22 + Math.sin(t * 6) * 2 : 20) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000';
    c.fillText('💥', 0, 1);
    c.restore();
    // quanto falta até ao chefe
    const f = clamp(carro.x / chefe.x, 0, 1);
    G.gfx.rr(c, 64, 177, 240, 10, 5); c.fillStyle = 'rgba(255,255,255,.55)'; c.fill();
    G.gfx.rr(c, 64, 177, Math.max(10, 240 * f), 10, 5); c.fillStyle = '#f4a261'; c.fill();
    // a energia do chefe, lá em cima ao meio
    if (chefe.ativo && chefe.equipa === 'mau') {
      const W = G.W / k, w = Math.min(320, W - 380), x = Math.max(240, W / 2 - w / 2);
      if (w > 80) {
        c.fillStyle = 'rgba(0,0,0,.3)'; G.gfx.rr(c, x, 22, w, 16, 8); c.fill();
        c.fillStyle = '#80ff72'; G.gfx.rr(c, x, 22, Math.max(8, w * (1 - chefe.hp / chefe.max)), 16, 8); c.fill();
        c.fillStyle = chefe.cor; G.gfx.rr(c, x - 30, 16, 24, 26, 5); c.fill();
        c.fillStyle = '#ff2d2d'; c.beginPath(); c.arc(x - 23, 27, 3, 0, TAU); c.arc(x - 13, 27, 3, 0, TAU); c.fill();
      }
    }
    c.restore();
  }

  S.debug = function () {
    return { terra: T().id, fase: fase, ronda: ronda, x: Math.round(carro.x), v: Math.round(carro.v), coracoes: carro.coracoes,
      descansa: carro.descansa > 0, maus: maus().length, amigos: amigos().length, especial: +especial.toFixed(2),
      chefe: { ativo: chefe.ativo, hp: chefe.hp, max: chefe.max, bom: chefe.equipa === 'bom' }, tiros: tiros.length,
      pedras: pedras.filter(function (p) { return !p.partida; }).length, conquistadas: conquistadas, piloto: piloto, len: LEN, camX: Math.round(camX) };
  };
  S.api = {
    vaiPara: function (i) { comecaTerra(clamp(i | 0, 0, TERRAS.length - 1), amigos().map(function (e) { return e.tipo; })); },
    autopiloto: function (on) { piloto = on === undefined ? !piloto : !!on; return piloto; },
    carro: function () { return carro; }, ents: function () { return ents; }, chefe: function () { return chefe; },
    tiros: function () { return tiros; }, dif: DIF,
    enche: function () { especial = 1; }, chefeQuase: function () { chefe.hp = 1; }
  };

  G.scenes = G.scenes || {};
  G.scenes.robocarro = S;
})();
