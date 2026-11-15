/* Cena — BOWLING A TRÊS, pedido do Isaac (2026-11-15).

   "Somos três pessoas, vamos fazer um jogo do bowling: uma bola e atiramos os
   pauzinhos. Tem de ser 1 a 1, mas são três pessoas. E tem de ser difícil."

   Como ficou:
   - Três jogadores (🐯 vermelho, 🐸 verde, 🐧 azul), um de cada vez. 5 rondas, cada
     jogador tem 2 bolas por ronda para deitar os 10 pinos.
   - Lançar tem 3 toques (🎳 ou tocar no ecrã), e tudo mexe sozinho — é aí que é difícil:
       1) ONDE: a bola anda de um lado para o outro; toca para a parar.
       2) PARA ONDE: a seta abana; toca para escolher a direção.
       3) FORÇA: a barra sobe e desce; toca para atirar. Com pouca força a bola foge
          para o lado (efeito), e se cair na valeta não deita nenhum.
   - Pontos: cada pino 1; STRIKE (os 10 à primeira) +10; SPARE (os 10 com as 2 bolas) +5.
     A cada ronda tudo mexe mais depressa. No fim há pódio e taça para quem ganhou. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  const DIF = {
    RONDAS: 5,
    MIRA_V: 1.5, ANG_V: 2.4, FORCA_V: 1.7, ACELERA: 0.12,   // velocidades (sobem a cada ronda)
    ANG_MAX: 0.06,
    V_MIN: 520, V_MAX: 1150, EFEITO: 62,
    STRIKE: 10, SPARE: 5
  };
  const LANE = 50, VALETA = 64, FIM = 1010, BR = 10, PR = 5;
  const JOG = [
    { ic: '🐯', cor: '#e63946', nome: 'Isaac' },
    { ic: '🐸', cor: '#2a9d8f', nome: 'Pai' },
    { ic: '🐧', cor: '#4361ee', nome: 'Amigo' }
  ];
  // os nomes escrevem-se no início e ficam guardados para a próxima vez
  try {
    const guardados = JSON.parse(localStorage.getItem('isaacBowlingNomes') || 'null');
    if (guardados) guardados.forEach(function (n, i) { if (JOG[i] && n) JOG[i].nome = String(n).slice(0, 12); });
  } catch (e) { /* sem armazenamento */ }

  let pinos, bola, fase, faseT, quem, ronda, lanc, placar, mira, ang, forca, osc, camY, msg, parts, vencedor, primeira, tempo;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function sfx(n) { if (G.audio && G.audio.sfx) G.audio.sfx(n); }
  function fala(t) { if (G.audio && G.audio.fala) G.audio.fala(t); }
  function banner(t, ms) { if (G.banner) G.banner(t, ms); }
  function vel() { return 1 + (ronda - 1) * DIF.ACELERA; }

  function poePinos() {
    pinos = [];
    const y0 = 880, dy = 23, dx = 13.5;
    for (let row = 0; row < 4; row++) for (let i = 0; i <= row; i++)
      pinos.push({ x: (i - row / 2) * dx * 2, y: y0 + row * dy, vx: 0, vy: 0, caido: false, fora: false, ang: 0, rot: 0 });
  }

  function novaBola() {
    bola = { x: 0, y: 30, vx: 0, vy: 0, efeito: 0, valeta: false, rola: false };
    fase = 'mira'; faseT = 0; osc = rnd(0, TAU); camY = 0; msg = null;
    mira = 0; ang = 0; forca = 0;
  }

  function comeca(calado) {
    quem = 0; ronda = 1; lanc = 1; vencedor = null; primeira = true;
    placar = JOG.map(function () { return { rondas: [], total: 0 }; });
    parts = [];
    poePinos(); novaBola();
    if (!calado) anuncia();
  }

  function anuncia() {
    banner('Vez: ' + JOG[quem].ic + ' ' + JOG[quem].nome + '! Ronda ' + ronda + '/' + DIF.RONDAS, 2000);
    fala('Agora joga ' + JOG[quem].nome + '!');
  }

  /* ---------- ecrã dos nomes ---------- */
  let caixa = null;
  function tiraNomes() { if (caixa) { caixa.remove(); caixa = null; } }
  function pedeNomes() {
    tiraNomes();
    fase = 'nomes';
    caixa = document.createElement('div');
    caixa.id = 'bowlNomes';
    caixa.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:40;background:rgba(10,8,30,0.72);font-family:system-ui,sans-serif';
    let html = '<div style="background:#1d1b3a;border:3px solid #ffd60a;border-radius:22px;padding:18px 20px;width:min(90vw,380px);box-shadow:0 10px 40px #000a;text-align:center">' +
      '<div style="font-size:30px;margin-bottom:10px;color:#fff;font-weight:bold">🎳 Quem joga?</div>';
    JOG.forEach(function (j, i) {
      html += '<label style="display:flex;align-items:center;gap:10px;margin:8px 0;background:' + j.cor + ';border-radius:14px;padding:6px 10px">' +
        '<span style="font-size:34px">' + j.ic + '</span>' +
        '<input data-i="' + i + '" maxlength="12" value="' + j.nome.replace(/"/g, '') + '" style="flex:1;min-width:0;font-size:22px;font-weight:bold;padding:8px 10px;border:none;border-radius:10px;background:#fff;color:#222">' +
        '</label>';
    });
    html += '<button id="bowlJogar" style="margin-top:12px;font-size:26px;font-weight:bold;padding:12px 30px;border:none;border-radius:16px;background:#ffd60a;color:#222;cursor:pointer">▶ JOGAR</button></div>';
    caixa.innerHTML = html;
    document.body.appendChild(caixa);
    // as letras vão para a caixa, não para o jogo (o B e o espaço são botões do jogo)
    caixa.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Enter') joga();
    });
    caixa.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    caixa.querySelector('#bowlJogar').addEventListener('click', joga);
    function joga() {
      const nomes = [];
      caixa.querySelectorAll('input').forEach(function (inp) {
        const i = +inp.dataset.i;
        const n = inp.value.trim().slice(0, 12);
        if (n) JOG[i].nome = n;
        nomes[i] = JOG[i].nome;
      });
      try { localStorage.setItem('isaacBowlingNomes', JSON.stringify(nomes)); } catch (e) { /* sem armazenamento */ }
      tiraNomes();
      if (G.input && G.input.tap) G.input.tap = null;
      comeca();
    }
  }

  S.enter = function () {
    tempo = 0;
    if (!S._gm && G.goMenu) {          // ao voltar ao menu tira-se a caixa dos nomes
      const gm = G.goMenu;
      G.goMenu = function () { tiraNomes(); return gm.apply(this, arguments); };
      S._gm = true;
    }
    comeca(true);      // por trás da caixa já se vê a pista
    pedeNomes();
  };
  S.api_nomes = function (l) { l.forEach(function (n, i) { JOG[i].nome = n; }); tiraNomes(); comeca(); };

  /* ---------- update ---------- */
  S.update = function (dt, t) {
    tempo += dt;
    const In = G.input;
    const toque = In.justPressed('fire') || !!In.tap;
    const v = vel();

    if (fase === 'nomes') {
      // à espera dos nomes
    } else if (fase === 'mira') {
      osc += dt * DIF.MIRA_V * v * Math.PI;
      mira = Math.sin(osc) * (LANE - BR - 2);
      bola.x = mira;
      if (toque) { fase = 'angulo'; osc = rnd(0, TAU); sfx('pop'); }
    } else if (fase === 'angulo') {
      osc += dt * DIF.ANG_V * v * Math.PI;
      ang = Math.sin(osc) * DIF.ANG_MAX;
      if (toque) { fase = 'forca'; osc = -Math.PI / 2; sfx('pop'); }
    } else if (fase === 'forca') {
      osc += dt * DIF.FORCA_V * v * Math.PI;
      forca = (Math.sin(osc) + 1) / 2;
      if (toque) lanca();
    } else if (fase === 'rola') {
      simula(dt);
      faseT += dt;
      camY += (clamp(bola.y - 260, 0, 620) - camY) * Math.min(1, dt * 3);
      const parado = pinos.every(function (p) { return Math.hypot(p.vx, p.vy) < 8; });
      if ((bola.y > FIM + 40 || (Math.hypot(bola.vx, bola.vy) < 5)) && parado) {
        faseT2 += dt;
        if (faseT2 > 0.9) resultado();
      } else faseT2 = 0;
      if (faseT > 9) resultado();
    } else if (fase === 'resultado') {
      faseT -= dt;
      if (faseT <= 0 || (toque && faseT < 1.6)) proxima();
    } else if (fase === 'fim') {
      faseT -= dt;
      if (toque && faseT <= 0) comeca();
    }

    for (const p of parts) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; }
    parts = parts.filter(function (p) { return p.age < p.vida; });
  };
  let faseT2 = 0;

  function lanca() {
    const vv = DIF.V_MIN + (DIF.V_MAX - DIF.V_MIN) * forca;
    bola.vx = Math.sin(ang) * vv; bola.vy = Math.cos(ang) * vv;
    // com pouca força a bola ganha efeito para um lado (e não se sabe para qual!)
    bola.efeito = (Math.random() < 0.5 ? -1 : 1) * DIF.EFEITO * (0.25 + (1 - forca) * 1.2) * vel();
    bola.rola = true;
    fase = 'rola'; faseT = 0; faseT2 = 0;
    sfx('vroom');
  }

  function simula(dt) {
    const n = 6, h = dt / n;
    for (let s = 0; s < n; s++) {
      // bola
      if (bola.y < FIM + 60) {
        if (!bola.valeta) {
          // o efeito só "pega" depois de meio caminho, como no bowling a sério
          if (bola.y > 350) bola.vx += bola.efeito * h;
          bola.x += bola.vx * h; bola.y += bola.vy * h;
          if (Math.abs(bola.x) > LANE - 2) {
            bola.valeta = true; bola.x = Math.sign(bola.x) * (LANE + (VALETA - LANE) / 2); bola.vx = 0;
            msg = { t: '😬 Valeta!', cor: '#ffb703' }; sfx('boing');
          }
        } else bola.y += bola.vy * h;
        bola.vy *= Math.pow(0.97, h);
      }
      // pinos
      for (const p of pinos) {
        if (p.fora) continue;
        p.x += p.vx * h; p.y += p.vy * h;
        const f = Math.pow(0.06, h); p.vx *= f; p.vy *= f;
        p.rot += Math.hypot(p.vx, p.vy) * h * 0.05;
        if (Math.abs(p.x) > LANE + 4 || p.y > FIM + 30) { p.fora = true; p.caido = true; }
      }
      // bola contra pinos
      if (!bola.valeta) for (const p of pinos) {
        if (p.fora) continue;
        bate(bola, p, BR + PR, 7, 1.5, true, 0.7, 45);
      }
      // pinos contra pinos (só se um deles já vai a mexer)
      for (let i = 0; i < pinos.length; i++) for (let j = i + 1; j < pinos.length; j++) {
        const a = pinos[i], b = pinos[j];
        if (a.fora || b.fora) continue;
        if (Math.hypot(a.vx, a.vy) + Math.hypot(b.vx, b.vy) < 20) continue;
        bate(a, b, PR * 2 + 2, 1.5, 1.5, false, 0.45, 110);
      }
    }
  }

  function bate(a, b, R, ma, mb, ehBola, e, cai) {
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    if (d === 0 || d >= R) return;
    const nx = dx / d, ny = dy / d;
    const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
    // separa
    const sep = (R - d);
    a.x -= nx * sep * mb / (ma + mb); a.y -= ny * sep * mb / (ma + mb);
    b.x += nx * sep * ma / (ma + mb); b.y += ny * sep * ma / (ma + mb);
    if (rel <= 0) return;
    const j = ((1 + e) * rel) / (1 / ma + 1 / mb);
    a.vx -= j / ma * nx; a.vy -= j / ma * ny;
    b.vx += j / mb * nx; b.vy += j / mb * ny;
    if (rel > cai) {
      if (!b.caido) { b.caido = true; b.ang = Math.atan2(b.vy, b.vx); sfx('kick'); }
      if (!ehBola && !a.caido) { a.caido = true; a.ang = Math.atan2(a.vy, a.vx); }
    }
  }

  function resultado() {
    const caidos = pinos.filter(function (p) { return p.caido; }).length;
    const ja = lanc === 2 ? (placar[quem].rondas[ronda - 1] || [0])[0] : 0;
    const agora = caidos;   // na 2.ª bola só ficaram os pinos de pé
    const r = placar[quem].rondas;
    if (lanc === 1) r[ronda - 1] = [caidos];
    else r[ronda - 1].push(agora);
    let bonus = 0, fimVez = false;
    if (lanc === 1 && caidos === 10) {
      bonus = DIF.STRIKE; fimVez = true;
      msg = { t: '💥 STRIKE! +' + DIF.STRIKE, cor: '#ffd60a', grande: true };
      sfx('tada'); fala('Strike!'); G.shake = 0.5; festa();
      if (G.addStars) G.addStars(3);
    } else if (lanc === 2 && ja + caidos === 10) {
      bonus = DIF.SPARE; fimVez = true;
      msg = { t: '✨ SPARE! +' + DIF.SPARE, cor: '#7df9ff', grande: true };
      sfx('suit'); fala('Spare!'); festa();
      if (G.addStars) G.addStars(1);
    } else {
      if (!msg || msg.t.indexOf('Valeta') < 0) msg = { t: agora === 0 ? '😅 Nenhum!' : '🎳 ' + agora + (agora === 1 ? ' pino' : ' pinos'), cor: '#fff' };
      sfx(agora ? 'star' : 'ouch');
      if (lanc === 2) fimVez = true;
    }
    if (bonus) r[ronda - 1].bonus = bonus;
    placar[quem].total += agora + bonus;
    fase = 'resultado'; faseT = 2.4;
    S._fimVez = fimVez;
  }

  function festa() {
    for (let i = 0; i < 40; i++) parts.push({ x: G.W / 2 + rnd(-60, 60), y: G.H * 0.45, vx: rnd(-380, 380), vy: rnd(-600, -150), vida: rnd(1, 1.8), age: 0, cor: ['#ffd60a', '#e63946', '#4cc9f0', '#2a9d8f'][i % 4] });
  }

  function proxima() {
    if (!S._fimVez) {
      // segunda bola: tiram-se os pinos caídos
      pinos = pinos.filter(function (p) { return !p.caido; });
      pinos.forEach(function (p) { p.vx = 0; p.vy = 0; });
      lanc = 2; novaBola();
      return;
    }
    lanc = 1;
    quem++;
    if (quem >= JOG.length) { quem = 0; ronda++; }
    if (ronda > DIF.RONDAS) { acaba(); return; }
    poePinos(); novaBola(); anuncia();
  }

  function acaba() {
    fase = 'fim'; faseT = 2;
    const ord = [0, 1, 2].sort(function (a, b) { return placar[b].total - placar[a].total; });
    vencedor = ord;
    const top = placar[ord[0]].total;
    const empate = ord.filter(function (i) { return placar[i].total === top; });
    sfx('tada'); festa();
    if (empate.length > 1) { banner('🏆 Empate! ' + empate.map(function (i) { return JOG[i].ic + ' ' + JOG[i].nome; }).join(' e '), 3500); fala('Empate! Que jogo!'); }
    else { banner('🏆 Ganhou ' + JOG[ord[0]].ic + ' ' + JOG[ord[0]].nome + '!', 3500); fala('Ganhou ' + JOG[ord[0]].nome + '!'); }
    if (G.addStars) G.addStars(5);
    if (G.ze && G.ze.diz) G.ze.diz('Que jogo!');
  }

  /* ---------- desenho em perspetiva ---------- */
  let PW, PH, HY, NY, K, D = 520;
  function proj(x, y) {
    const z = y - camY;
    const s = D / (z + D);
    return { x: PW / 2 + x * K * s, y: HY + (NY - HY) * s, s: s };
  }

  S.draw = function (c, t) {
    PW = G.W; PH = G.H;
    HY = PH * 0.12; NY = PH * 0.98;
    K = Math.min(PW * 0.8 / (VALETA * 2), PH * 0.55 / (VALETA * 2));
    // sala
    const g = c.createLinearGradient(0, 0, 0, PH);
    g.addColorStop(0, '#1b1035'); g.addColorStop(1, '#3a2266');
    c.fillStyle = g; c.fillRect(0, 0, PW, PH);
    // luzes no teto
    for (let i = 0; i < 7; i++) {
      c.fillStyle = 'hsla(' + ((i * 50 + t * 40) % 360) + ',90%,65%,0.6)';
      c.beginPath(); c.arc(PW * (i + 0.5) / 7, HY * 0.45, 6, 0, TAU); c.fill();
    }
    // pista (madeira) e valetas, da frente até ao fundo
    const ys = [0, FIM + 60];
    function quad(x0, x1, cor) {
      const a = proj(x0, Math.max(camY - 200, 0) + 0), b = proj(x1, Math.max(camY - 200, 0)), cc = proj(x1, ys[1]), d = proj(x0, ys[1]);
      c.fillStyle = cor; c.beginPath(); c.moveTo(a.x, Math.min(PH, a.y)); c.lineTo(b.x, Math.min(PH, b.y)); c.lineTo(cc.x, cc.y); c.lineTo(d.x, d.y); c.closePath(); c.fill();
    }
    quad(-VALETA - 6, VALETA + 6, '#2b2b3a');
    quad(-VALETA, -LANE, '#555a6e'); quad(LANE, VALETA, '#555a6e');
    quad(-LANE, LANE, '#d9a066');
    // tábuas
    c.strokeStyle = 'rgba(120,70,30,0.35)'; c.lineWidth = 1;
    for (let i = -4; i <= 4; i++) {
      const a = proj(i * LANE / 5, camY), b = proj(i * LANE / 5, FIM);
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    }
    // setinhas da pista (ajudam a apontar)
    c.fillStyle = '#7b3f00';
    for (let i = -2; i <= 2; i++) {
      const p = proj(i * 16, 330 + Math.abs(i) * 18);
      if (p.y < PH) { c.beginPath(); c.moveTo(p.x, p.y - 8 * p.s * 2); c.lineTo(p.x - 5 * p.s * 2, p.y); c.lineTo(p.x + 5 * p.s * 2, p.y); c.fill(); }
    }
    // fundo da pista
    const fa = proj(-VALETA - 6, FIM + 60), fb = proj(VALETA + 6, FIM + 60);
    c.fillStyle = '#111'; c.fillRect(fa.x, fa.y - 90 * fa.s * K / 4, fb.x - fa.x, 90 * fa.s * K / 4);

    // pinos e bola, de trás para a frente
    const coisas = pinos.filter(function (p) { return !p.fora; }).map(function (p) { return { p: p, y: p.y }; });
    if (fase !== 'resultado' || bola.y < FIM) coisas.push({ bola: true, y: bola.y });
    coisas.sort(function (a, b) { return b.y - a.y; });
    for (const o of coisas) {
      if (o.bola) desenhaBola(c, t);
      else desenhaPino(c, o.p);
    }

    // a seta / mira
    if (fase === 'mira' || fase === 'angulo' || fase === 'forca') {
      const a = proj(bola.x, bola.y);
      const comp = 420;
      const b = proj(bola.x + Math.sin(ang) * comp, bola.y + Math.cos(ang) * comp);
      c.strokeStyle = fase === 'mira' ? 'rgba(255,255,255,0.35)' : 'rgba(255,214,10,0.9)';
      c.lineWidth = 5; c.setLineDash([12, 10]);
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); c.setLineDash([]);
      c.fillStyle = c.strokeStyle; c.beginPath(); c.arc(b.x, b.y, 7, 0, TAU); c.fill();
    }
    if (fase === 'forca' || fase === 'angulo' || fase === 'mira') barra(c, t);

    // mensagem
    if (msg && (fase === 'resultado' || fase === 'rola')) {
      c.font = 'bold ' + (msg.grande ? 54 : 38) + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = 7; c.strokeStyle = 'rgba(0,0,0,0.6)';
      const y = PH * 0.42 + (msg.grande ? Math.sin(t * 8) * 6 : 0);
      c.strokeText(msg.t, PW / 2, y); c.fillStyle = msg.cor; c.fillText(msg.t, PW / 2, y);
    }
    for (const p of parts) { c.globalAlpha = 1 - p.age / p.vida; c.fillStyle = p.cor; c.fillRect(p.x, p.y, 7, 7); }
    c.globalAlpha = 1;
    placarDesenha(c, t);
    if (fase === 'fim') podio(c, t);
  };

  function desenhaBola(c, t) {
    if (bola.y > FIM + 50) return;
    const p = proj(bola.x, bola.y);
    if (p.y > PH + 40) return;
    const r = BR * K * p.s;
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(p.x, p.y, r, r * 0.3, 0, 0, TAU); c.fill();
    const g = c.createRadialGradient(p.x - r * 0.4, p.y - r * 1.4, r * 0.1, p.x, p.y - r, r);
    g.addColorStop(0, '#fff'); g.addColorStop(0.25, JOG[quem].cor); g.addColorStop(1, '#111');
    c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y - r, r, 0, TAU); c.fill();
    // furinhos que rodam
    const rot = bola.y * 0.05;
    c.fillStyle = 'rgba(0,0,0,0.6)';
    for (let i = 0; i < 3; i++) {
      const a = rot + i * 0.5;
      const yy = Math.sin(a) * r * 0.5;
      if (Math.cos(a) > 0) { c.beginPath(); c.arc(p.x + (i - 1) * r * 0.25, p.y - r + yy - r * 0.2, r * 0.1, 0, TAU); c.fill(); }
    }
  }

  function desenhaPino(c, q) {
    const p = proj(q.x, q.y);
    if (p.y > PH + 60) return;
    const s = K * p.s;
    c.save(); c.translate(p.x, p.y);
    if (q.caido) {
      c.rotate(Math.cos(q.ang) >= 0 ? 1.4 : -1.4);
      c.translate(0, -PR * s * 0.4);
    }
    const h = 38 * s, w = PR * s;
    c.fillStyle = 'rgba(0,0,0,0.25)'; if (!q.caido) { c.beginPath(); c.ellipse(0, 0, w, w * 0.3, 0, 0, TAU); c.fill(); }
    c.fillStyle = '#fafafa'; c.strokeStyle = '#999'; c.lineWidth = Math.max(1, s * 0.6);
    c.beginPath();
    c.moveTo(-w * 0.6, 0);
    c.bezierCurveTo(-w * 1.3, -h * 0.35, -w * 0.3, -h * 0.55, -w * 0.4, -h * 0.75);
    c.bezierCurveTo(-w * 0.7, -h * 0.95, w * 0.7, -h * 0.95, w * 0.4, -h * 0.75);
    c.bezierCurveTo(w * 0.3, -h * 0.55, w * 1.3, -h * 0.35, w * 0.6, 0);
    c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#e63946'; c.fillRect(-w * 0.45, -h * 0.68, w * 0.9, h * 0.05); c.fillRect(-w * 0.42, -h * 0.6, w * 0.84, h * 0.04);
    c.restore();
  }

  function barra(c, t) {
    // os 3 passos: 1 onde, 2 direção, 3 força
    const W = PW, H = PH;
    const bx = W - 70, by = H * 0.3, bh = H * 0.4;
    const passos = ['↔️', '↗️', '💪'];
    const i = fase === 'mira' ? 0 : fase === 'angulo' ? 1 : 2;
    c.font = '26px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let k = 0; k < 3; k++) {
      c.globalAlpha = k === i ? 1 : 0.35;
      c.fillStyle = k === i ? 'rgba(255,214,10,0.35)' : 'rgba(0,0,0,0.3)';
      c.beginPath(); c.arc(W / 2 + (k - 1) * 56, H - 150, 24, 0, TAU); c.fill();
      c.fillText(passos[k], W / 2 + (k - 1) * 56, H - 150);
    }
    c.globalAlpha = 1;
    if (fase === 'forca') {
      c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(bx - 4, by - 4, 32, bh + 8);
      const g = c.createLinearGradient(0, by + bh, 0, by);
      g.addColorStop(0, '#2a9d8f'); g.addColorStop(0.6, '#ffd60a'); g.addColorStop(1, '#e63946');
      c.fillStyle = g; c.fillRect(bx, by + bh * (1 - forca), 24, bh * forca);
      c.fillText('💪', bx + 12, by - 22);
    }
  }

  function placarDesenha(c, t) {
    const W = PW;
    const cw = 30, NW = 70, larg = 60 + NW + DIF.RONDAS * cw + 62;
    // em ecrãs estreitos o placar desce para baixo dos botões 🏠 e 🔊
    const estreito = W < larg + 200;
    const x0 = estreito ? Math.max(10, (W - larg) / 2 + 6) : Math.max(64, (W - larg) / 2 + 6), y0 = estreito ? 76 : 8, rh = 30;
    c.save();
    c.fillStyle = 'rgba(0,0,0,0.5)';
    c.fillRect(x0 - 6, y0 - 4, 60 + NW + DIF.RONDAS * cw + 62, rh * 3 + 8);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let j = 0; j < 3; j++) {
      const y = y0 + j * rh + rh / 2;
      if (j === quem && fase !== 'fim') { c.fillStyle = 'rgba(255,214,10,0.3)'; c.fillRect(x0 - 4, y - rh / 2 + 1, 60 + NW + DIF.RONDAS * cw + 58, rh - 2); }
      c.fillStyle = JOG[j].cor; c.fillRect(x0, y - 10, 6, 20);
      c.font = '20px system-ui'; c.fillText(JOG[j].ic, x0 + 26, y);
      c.textAlign = 'left'; c.fillStyle = '#fff'; c.font = 'bold 13px system-ui';
      let nm = JOG[j].nome; while (nm.length > 1 && c.measureText(nm).width > NW - 6) nm = nm.slice(0, -1);
      c.fillText(nm, x0 + 42, y); c.textAlign = 'center';
      for (let r = 0; r < DIF.RONDAS; r++) {
        const x = x0 + 52 + NW + r * cw;
        c.strokeStyle = 'rgba(255,255,255,0.3)'; c.strokeRect(x, y - 12, cw - 4, 24);
        const ro = placar[j].rondas[r];
        if (ro) {
          let txt = ro[0] === 10 ? 'X' : (ro.length > 1 && ro[0] + ro[1] === 10 ? ro[0] + '/' : ro.join(''));
          c.fillStyle = ro.bonus ? '#ffd60a' : '#fff'; c.font = 'bold 12px system-ui';
          c.fillText(txt, x + (cw - 4) / 2, y);
        }
      }
      c.fillStyle = '#fff'; c.font = 'bold 18px system-ui';
      c.fillText('' + placar[j].total, x0 + 52 + NW + DIF.RONDAS * cw + 24, y);
    }
    c.restore();
  }

  function podio(c, t) {
    const W = PW, H = PH;
    c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(0, 0, W, H);
    const alt = [150, 110, 80], pos = [0, -1, 1];
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let k = 0; k < 3; k++) {
      const j = vencedor[k];
      const x = W / 2 + pos[k] * 120, base = H * 0.78;
      c.fillStyle = JOG[j].cor; c.fillRect(x - 50, base - alt[k], 100, alt[k]);
      c.fillStyle = '#fff'; c.font = 'bold 34px system-ui'; c.fillText('' + (k + 1), x, base - alt[k] / 2);
      c.font = '56px system-ui'; c.fillText(JOG[j].ic, x, base - alt[k] - 40 + (k === 0 ? Math.sin(t * 5) * 8 : 0));
      c.font = 'bold 20px system-ui'; c.fillText(JOG[j].nome, x, base + 20);
      c.font = 'bold 18px system-ui'; c.fillText(placar[j].total + ' pts', x, base + 44);
      if (k === 0) { c.font = '44px system-ui'; c.fillText('🏆', x, base - alt[k] - 100); }
    }
    if (faseT <= 0) { c.fillStyle = '#fff'; c.font = 'bold 22px system-ui'; c.fillText('🎳 Toca para jogar outra vez', W / 2, H * 0.9); }
  }

  /* ---------- para testar ---------- */
  S.api = {
    estado: function () { return { fase: fase, quem: quem, ronda: ronda, lanc: lanc, totais: placar.map(function (p) { return p.total; }), caidos: pinos.filter(function (p) { return p.caido; }).length, bola: [Math.round(bola.x), Math.round(bola.y)] }; },
    // atira já com estes valores (para testar a física)
    atira: function (x, a, f) { bola.x = x; mira = x; ang = a; forca = f; lanca(); bola.efeito = 0; },
    // conta quantos pinos caem num lançamento, sem mexer no jogo
    ensaio: function (x, a, f, ef) {
      const guarda = [pinos, bola, fase, msg];
      poePinos(); bola = { x: x, y: 30, vx: 0, vy: 0 }; ang = a; forca = f; lanca(); bola.efeito = ef || 0;
      for (let i = 0; i < 600; i++) simula(1 / 60);
      const n = pinos.filter(function (p) { return p.caido; }).length;
      pinos = guarda[0]; bola = guarda[1]; fase = guarda[2]; msg = guarda[3];
      return n;
    }
  };

  G.scenes = G.scenes || {};
  G.scenes.bowling = S;
})();
