/* Mini-jogo 13 — AS COBRAS (a história ditada pelo Isaac, pela ordem que ele a contou).

   1. As cobras aparecem a FUGIR de cobras maiores — nós somos uma das pequeninas.
   2. A nossa cobra foge e cai por uma CASCATA abaixo.
   3. Cai numa FOLHA com água a chapinhar, e lá está um BRILHANTE: apanha-o e fica GIGANTE.
   4. Já gigante, apanha as cobras que a andavam a tentar com DINHEIRO.
   5. Chega a um MUNDO NOVO onde tem de apanhar a COBRA RAINHA e a COBRA REI.
   6. No fim as cobras ganham a volta a nós e temos de lhes MORDER AS CAUDAS a todas.

   Regras de paz: ninguém se magoa e ninguém desaparece. O "nhac" é de brincadeira —
   cada cobra apanhada sai a rir e fica na nossa FILA de amigas, atrás de nós. As coroas
   do rei e da rainha "rebentam" em confetes (é a única coisa que rebenta neste jogo).
   Sem corações não há game over: as flores do rio devolvem-nos os corações todos. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function ri(a, b) { return Math.floor(rnd(a, b + 1)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function angDif(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
  // barulhinho sempre igual para o mesmo sítio (relva, pedrinhas): não pisca entre frames
  function ruido(i, j) { const x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return x - Math.floor(x); }

  const CORES = [
    { cor: '#8ac926', cor2: '#5b8f14' },
    { cor: '#ff595e', cor2: '#c0353a' },
    { cor: '#1982c4', cor2: '#115787' },
    { cor: '#ffca3a', cor2: '#cf9a12' },
    { cor: '#9d4edd', cor2: '#68309b' },
    { cor: '#ff924c', cor2: '#c8642a' },
    { cor: '#4cc9f0', cor2: '#2489ad' },
    { cor: '#f96bb6', cor2: '#c23c85' }
  ];

  const HPASSO = 5;        // de quantos em quantos pixels se guarda o caminho da nossa cobra
  const AMIGO_PTS = 12;    // quantos pontos do caminho ocupa cada amiga da fila
  const AMIGO_GAP = 5;     // espacinho entre uma amiga e a seguinte

  /* ================= estado ================= */
  let fase, ft, ronda, vidas, invul, dash, festa, aviso;
  let cam, hero, hist, amigos, bichos, itens, parts, apanhadas;
  let mundo, alvo, brilho, portal;
  let quedaT, quedaX, quedaVX;
  let cresce, ringX, ringY, dica;
  let autoTeste = false;   // atalho de teste: a cobra conduz-se sozinha

  /* ================= o corpo das cobras ================= */
  // Uma cobra é uma cabeça que anda sempre para a frente e um rasto de pontinhos atrás.
  function novaCobra(x, y, op) {
    op = op || {};
    const cs = op.paleta || CORES[ri(0, CORES.length - 1)];
    const s = {
      x: x, y: y, ang: op.ang !== undefined ? op.ang : rnd(0, TAU),
      r: op.r || 11, vel: op.vel || 130, giro: op.giro || 3.0,
      cor: op.cor || cs.cor, cor2: op.cor2 || cs.cor2,
      segs: op.segs || 12, tipo: op.tipo || 'normal',
      rasto: [], t: rnd(0, 9),
      susto: 0, danca: 0, riso: 0, saco: !!op.saco, coroa: op.coroa || null,
      orbita: null, mordida: false
    };
    s.nPts = Math.max(7, Math.round(s.segs * 1.7));
    for (let i = 0; i < s.nPts; i++) {
      s.rasto.push({ x: x - Math.cos(s.ang) * i * s.r * 0.5, y: y - Math.sin(s.ang) * i * s.r * 0.5 });
    }
    return s;
  }

  // Empurra o rasto: guarda um ponto novo de cada vez que a cabeça anda um bocadinho.
  function avancaRasto(s) {
    const passo = s.r * 0.5;
    let guarda = 0;
    while (guarda++ < 20) {
      const p = s.rasto[0];
      const d = Math.hypot(s.x - p.x, s.y - p.y);
      if (d < passo) break;
      const k = passo / d;
      s.rasto.unshift({ x: p.x + (s.x - p.x) * k, y: p.y + (s.y - p.y) * k });
      if (s.rasto.length > s.nPts) s.rasto.length = s.nPts;
    }
  }

  // Conduz a cobra: vira devagarinho para onde quer ir e anda para a frente.
  function conduz(s, dt, alvoAng, k) {
    const d = angDif(s.ang, alvoAng);
    s.ang += clamp(d, -s.giro * dt, s.giro * dt);
    const v = s.vel * (k === undefined ? 1 : k) * (s.danca > 0 ? 0.12 : 1);
    s.x += Math.cos(s.ang) * v * dt;
    s.y += Math.sin(s.ang) * v * dt;
    limites(s);
    avancaRasto(s);
  }

  function limites(s) {
    if (!mundo) return;
    const m = 26 + s.r;
    s.x = clamp(s.x, m, mundo.w - m);
    s.y = fase === 'fuga' ? Math.max(m, s.y) : clamp(s.y, m, mundo.h - m);
    for (const p of mundo.pedras) {                 // as pedras empurram para o lado
      const dx = s.x - p.x, dy = s.y - p.y;
      const d = Math.hypot(dx, dy), lim = p.r + s.r * 0.7;
      if (d < lim && d > 0.01) { s.x = p.x + dx / d * lim; s.y = p.y + dy / d * lim; }
    }
  }

  function cauda(s) { return s.rasto[s.rasto.length - 1]; }

  /* ================= desenhar uma cobra ================= */
  function raioEm(r, k, semCauda) {
    return semCauda ? r * (1 - 0.18 * k) : r * (1 - 0.86 * Math.pow(k, 1.5));
  }

  // Desenha um corpo a partir de uma lista de pontos (o primeiro ponto é a cabeça).
  function corpo(c, pts, op) {
    const n = pts.length;
    if (n < 2) return;
    const r = op.r;
    c.fillStyle = op.cor2;
    for (let i = n - 1; i >= 0; i--) {
      const rr = raioEm(r, i / (n - 1), op.semCauda) + 2.6;
      c.beginPath(); c.arc(pts[i].x, pts[i].y, rr, 0, TAU); c.fill();
    }
    c.fillStyle = op.cor;
    for (let i = n - 1; i >= 0; i--) {
      const rr = raioEm(r, i / (n - 1), op.semCauda);
      c.beginPath(); c.arc(pts[i].x, pts[i].y, rr, 0, TAU); c.fill();
    }
    c.fillStyle = op.cor2;                          // manchinhas ao longo do corpo
    for (let i = 2; i < n - 1; i += 3) {
      const rr = raioEm(r, i / (n - 1), op.semCauda);
      const q = pts[i - 1];
      const a = Math.atan2(pts[i].y - q.y, pts[i].x - q.x) + Math.PI / 2;
      const o = rr * 0.42;
      c.beginPath(); c.arc(pts[i].x + Math.cos(a) * o, pts[i].y + Math.sin(a) * o, rr * 0.30, 0, TAU); c.fill();
      c.beginPath(); c.arc(pts[i].x - Math.cos(a) * o, pts[i].y - Math.sin(a) * o, rr * 0.30, 0, TAU); c.fill();
    }
    if (op.brilha) {                                // a cobra gigante brilha por cima
      c.save(); c.globalAlpha = 0.26; c.fillStyle = '#fff';
      for (let i = n - 1; i >= 0; i -= 2) {
        const rr = raioEm(r, i / (n - 1), op.semCauda);
        c.beginPath(); c.arc(pts[i].x - rr * 0.3, pts[i].y - rr * 0.35, rr * 0.34, 0, TAU); c.fill();
      }
      c.restore();
    }
  }

  function coroaDesenho(c, x, y, r, cor) {
    c.save(); c.translate(x, y);
    c.fillStyle = cor || '#ffd166';
    c.beginPath();
    c.moveTo(-r, r * 0.5); c.lineTo(-r, -r * 0.35); c.lineTo(-r * 0.45, r * 0.06);
    c.lineTo(0, -r * 0.8); c.lineTo(r * 0.45, r * 0.06); c.lineTo(r, -r * 0.35); c.lineTo(r, r * 0.5);
    c.closePath(); c.fill();
    c.strokeStyle = '#b8860b'; c.lineWidth = Math.max(1.5, r * 0.16); c.stroke();
    c.fillStyle = '#ef476f';
    c.beginPath(); c.arc(0, r * 0.12, r * 0.2, 0, TAU); c.fill();
    c.restore();
  }

  function cabeca(c, x, y, ang, r, op, t) {
    c.save(); c.translate(x, y); c.rotate(ang);
    if (op.lingua !== false) {                       // a linguinha bifurcada a espreitar
      if (Math.sin(t * 3.4 + (op.fase || 0)) > 0.72) {
        c.strokeStyle = '#ff4d6d'; c.lineWidth = Math.max(2, r * 0.16); c.lineCap = 'round';
        c.beginPath(); c.moveTo(r * 1.2, 0); c.lineTo(r * 1.95, 0); c.stroke();
        c.beginPath(); c.moveTo(r * 1.95, 0); c.lineTo(r * 2.5, -r * 0.34); c.stroke();
        c.beginPath(); c.moveTo(r * 1.95, 0); c.lineTo(r * 2.5, r * 0.34); c.stroke();
      }
    }
    c.fillStyle = op.cor2;
    c.beginPath(); c.ellipse(0, 0, r * 1.45 + 2.6, r * 1.15 + 2.6, 0, 0, TAU); c.fill();
    c.fillStyle = op.cor;
    c.beginPath(); c.ellipse(0, 0, r * 1.45, r * 1.15, 0, 0, TAU); c.fill();
    const ey = r * 0.6, ex = r * 0.42, er = Math.max(2.6, r * 0.34);
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(ex, -ey, er, 0, TAU); c.arc(ex, ey, er, 0, TAU); c.fill();
    c.fillStyle = '#22223b';
    const px = op.susto ? ex - er * 0.2 : ex + er * 0.26;
    c.beginPath(); c.arc(px, -ey, er * 0.5, 0, TAU); c.arc(px, ey, er * 0.5, 0, TAU); c.fill();
    if (op.pestanas) {                               // a cobra rainha tem pestanas
      c.strokeStyle = '#22223b'; c.lineWidth = Math.max(1.6, r * 0.13); c.lineCap = 'round';
      for (const sg of [-1, 1]) {
        for (let i = -1; i <= 1; i++) {
          c.beginPath();
          c.moveTo(ex + i * er * 0.5, sg * (ey + er * 0.8));
          c.lineTo(ex + i * er * 0.7, sg * (ey + er * 1.6));
          c.stroke();
        }
      }
    }
    c.restore();
    if (op.coroa) coroaDesenho(c, x, y - r * 2.0, r * 0.95, op.coroa);
    if (op.susto) G.gfx.label(c, '!', x + r * 1.3, y - r * 2.2, r * 1.7, '#ff595e', 'center');
  }

  function desenhaCobra(c, s, t) {
    corpo(c, s.rasto, { r: s.r, cor: s.cor, cor2: s.cor2, brilha: s.tipo === 'gigante' });
    const p0 = s.rasto[0], p1 = s.rasto[1] || p0;
    const ang = (p0.x === p1.x && p0.y === p1.y) ? s.ang : Math.atan2(p0.y - p1.y, p0.x - p1.x);
    if (s.saco) {                                    // o saquinho de moedas às costas
      const p = s.rasto[Math.min(3, s.rasto.length - 1)];
      c.save(); c.translate(p.x, p.y); c.rotate(Math.sin(t * 5 + s.t) * 0.15);
      c.fillStyle = '#b98b46';
      c.beginPath(); c.ellipse(0, 0, s.r * 0.95, s.r * 0.85, 0, 0, TAU); c.fill();
      c.fillStyle = '#8a6630'; c.fillRect(-s.r * 0.42, -s.r * 1.05, s.r * 0.84, s.r * 0.32);
      G.gfx.label(c, '€', 0, s.r * 0.08, s.r * 1.1, '#ffe08a', 'center', 'none');
      c.restore();
    }
    cabeca(c, s.x, s.y, ang, s.r, {
      cor: s.cor, cor2: s.cor2, coroa: s.coroa, susto: s.susto > 0,
      pestanas: s.tipo === 'rainha', fase: s.t
    }, t);
    if (s.riso > 0) G.gfx.label(c, '😄', s.x + s.r * 1.5, s.y - s.r * 2.6, s.r * 1.8, '#fff', 'center', 'none');
    if (s.danca > 0) G.gfx.label(c, '🎵', s.x - s.r * 1.5, s.y - s.r * 2.6, s.r * 1.6, '#fff', 'center', 'none');
  }

  // A ponta da cauda a brilhar: é ali que temos de dar o "nhac" na última fase.
  function marcaCauda(c, s, t) {
    const p = cauda(s);
    const k = 0.6 + 0.4 * Math.sin(t * 6 + s.t);
    c.save(); c.globalAlpha = 0.85;
    G.gfx.star(c, p.x, p.y, (s.r * 1.5) * k, '#fff3b0', t * 3);
    c.restore();
  }

  /* ================= partículas ================= */
  function pufo(x, y, n, cols, forca) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, TAU), v = rnd(40, forca || 200);
      parts.push({
        x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        t: 0, vida: rnd(0.4, 1.1), r: rnd(3, 8),
        cor: cols[ri(0, cols.length - 1)], rot: rnd(0, TAU), vr: rnd(-8, 8)
      });
    }
  }
  const CONFETES = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#9d4edd', '#ffffff'];
  const AGUA = ['#bfe7ff', '#8ecdf0', '#ffffff'];

  function atualizaParts(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.96; p.vy = p.vy * 0.96 + 40 * dt;
      p.rot += p.vr * dt;
      if (p.t > p.vida) parts.splice(i, 1);
    }
  }
  function desenhaParts(c) {
    for (const p of parts) {
      c.save();
      c.globalAlpha = Math.max(0, 1 - p.t / p.vida);
      c.translate(p.x, p.y); c.rotate(p.rot);
      c.fillStyle = p.cor;
      c.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.7);
      c.restore();
    }
  }

  /* ================= a fila de amigas ================= */
  // Guardamos o caminho por onde a nossa cobra passou; cada amiga vai num bocadinho dele.
  function guardaCaminho() {
    let guarda = 0;
    while (guarda++ < 30) {
      const p = hist[0];
      const d = Math.hypot(hero.x - p.x, hero.y - p.y);
      if (d < HPASSO) break;
      const k = HPASSO / d;
      hist.unshift({ x: p.x + (hero.x - p.x) * k, y: p.y + (hero.y - p.y) * k });
    }
    const max = heroPts() + AMIGO_GAP + amigos.length * (AMIGO_PTS + AMIGO_GAP) + 4;
    if (hist.length > max) hist.length = max;
  }
  // quantos pontos do caminho é que o corpo da NOSSA cobra ocupa (as amigas vêm a seguir)
  function heroPts() { return Math.max(8, Math.round((hero.segs * hero.r * 0.85 + 12) / HPASSO)); }

  function fatia(i0, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const p = hist[Math.min(hist.length - 1, i0 + i)];
      out.push(p);
    }
    return out;
  }

  function novaAmiga(op) {
    op = op || {};
    const cs = CORES[ri(0, CORES.length - 1)];
    amigos.push({
      cor: op.cor || cs.cor, cor2: op.cor2 || cs.cor2, r: op.r || 8,
      coroa: op.coroa || null, t: rnd(0, 9)
    });
  }

  function desenhaAmigos(c, t) {
    for (let i = amigos.length - 1; i >= 0; i--) {
      const a = amigos[i];
      const i0 = heroPts() + AMIGO_GAP + i * (AMIGO_PTS + AMIGO_GAP);
      if (i0 >= hist.length - 1) continue;
      const pts = fatia(i0, AMIGO_PTS);
      corpo(c, pts, { r: a.r, cor: a.cor, cor2: a.cor2 });
      const p0 = pts[0], p1 = pts[1] || p0;
      const ang = (p0.x === p1.x && p0.y === p1.y) ? 0 : Math.atan2(p0.y - p1.y, p0.x - p1.x);
      cabeca(c, p0.x, p0.y, ang, a.r, { cor: a.cor, cor2: a.cor2, coroa: a.coroa, fase: a.t }, t);
    }
  }

  /* ================= o mundo ================= */
  function gerarMundo(tipo) {
    const m = { tipo: tipo, pedras: [], deco: [], agua: [], w: 0, h: 0 };
    if (tipo === 'vale') {
      m.w = 1500; m.h = 2500 + ronda * 240;
      for (let y = -40; y < m.h + 120; y += 70) {   // o rio desce a serpentear pelo meio
        m.agua.push({ x: m.w / 2 + Math.sin(y * 0.0021) * m.w * 0.2, y: y, r: 128 + Math.sin(y * 0.005) * 30 });
      }
      for (let i = 0; i < 46; i++) {
        const x = rnd(60, m.w - 60), y = rnd(240, m.h - 220);
        if (Math.abs(x - (m.w / 2 + Math.sin(y * 0.0021) * m.w * 0.2)) < 150) continue;
        m.pedras.push({ x: x, y: y, r: rnd(26, 54), tom: ri(0, 2) });
      }
      for (let i = 0; i < 130; i++) {
        m.deco.push({ x: rnd(30, m.w - 30), y: rnd(60, m.h - 60), k: ri(0, 2), s: rnd(0.7, 1.4), f: rnd(0, TAU) });
      }
    } else if (tipo === 'lago') {
      m.w = 1700; m.h = 1500;
      for (let i = 0; i < 7; i++) {                 // charcos com folhas a boiar
        const x = rnd(220, m.w - 220), y = rnd(220, m.h - 220), r = rnd(120, 230);
        m.agua.push({ x: x, y: y, r: r });
        for (let k = 0; k < 4; k++) {
          m.deco.push({ x: x + rnd(-r * 0.7, r * 0.7), y: y + rnd(-r * 0.7, r * 0.7), k: 3, s: rnd(0.8, 1.5), f: rnd(0, TAU) });
        }
      }
      for (let i = 0; i < 22; i++) m.pedras.push({ x: rnd(80, m.w - 80), y: rnd(80, m.h - 80), r: rnd(26, 46), tom: ri(0, 2) });
      for (let i = 0; i < 120; i++) m.deco.push({ x: rnd(30, m.w - 30), y: rnd(30, m.h - 30), k: ri(0, 2), s: rnd(0.7, 1.4), f: rnd(0, TAU) });
    } else {                                        // o mundo do rei e da rainha
      m.w = 1700; m.h = 1500;
      for (let i = 0; i < 12; i++) {                // as colunas do palácio
        const cx = i % 2 === 0 ? 260 : m.w - 260;
        m.pedras.push({ x: cx, y: 220 + Math.floor(i / 2) * 210, r: 40, tom: 3 });
      }
      for (let i = 0; i < 4; i++) {                 // tanques de água dos dois lados
        m.agua.push({ x: i % 2 ? m.w * 0.78 : m.w * 0.22, y: 420 + Math.floor(i / 2) * 500, r: 96 });
      }
      m.tapete = { x: m.w / 2 - 110, y: 90, w: 220, h: m.h - 150 };   // o tapete vermelho
      m.trono = { x: m.w / 2, y: 130 };                                // e o trono lá em cima
      for (let i = 0; i < 46; i++) m.deco.push({ x: rnd(30, m.w - 30), y: rnd(30, m.h - 30), k: 4, s: rnd(0.8, 1.4), f: rnd(0, TAU) });
    }
    return m;
  }

  function desenhaChao(c, t) {
    const W = G.W, H = G.H;
    const base = mundo.tipo === 'reino' ? '#e6d3a3' : (mundo.tipo === 'lago' ? '#57ac74' : '#4aa96c');
    c.fillStyle = base; c.fillRect(0, 0, W, H);
    // tufos de relva / azulejos, sempre nos mesmos sítios
    const cel = mundo.tipo === 'reino' ? 96 : 64;
    const i0 = Math.floor(cam.x / cel), i1 = Math.ceil((cam.x + W) / cel);
    const j0 = Math.floor(cam.y / cel), j1 = Math.ceil((cam.y + H) / cel);
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        if (mundo.tipo === 'reino') {
          if ((i + j) % 2 === 0) {
            c.fillStyle = 'rgba(255,255,255,.22)';
            c.fillRect(i * cel - cam.x, j * cel - cam.y, cel, cel);
          }
        } else {
          const n = ruido(i, j);
          c.fillStyle = n > 0.5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)';
          const x = i * cel + n * cel - cam.x, y = j * cel + ruido(j, i) * cel - cam.y;
          c.beginPath(); c.ellipse(x, y, 11 + n * 9, 5 + n * 4, n * 3, 0, TAU); c.fill();
        }
      }
    }
    if (mundo.tapete) {                              // o tapete vermelho do palácio
      const p = mundo.tapete;
      c.fillStyle = '#b5192b';
      c.fillRect(p.x - cam.x, p.y - cam.y, p.w, p.h);
      c.fillStyle = '#e0b34a';
      c.fillRect(p.x - cam.x + 12, p.y - cam.y, 8, p.h);
      c.fillRect(p.x - cam.x + p.w - 20, p.y - cam.y, 8, p.h);
      c.fillStyle = 'rgba(255,255,255,.12)';
      for (let y = p.y; y < p.y + p.h; y += 150) c.fillRect(p.x - cam.x + 34, y - cam.y, p.w - 68, 70);
    }
    if (mundo.trono) {                               // o trono do rei e da rainha
      const x = mundo.trono.x - cam.x, y = mundo.trono.y - cam.y;
      if (y > -220 && y < H + 220) {
        c.fillStyle = '#d4a017';
        G.gfx.rr(c, x - 92, y - 78, 184, 156, 26); c.fill();
        c.fillStyle = '#ffe08a';
        G.gfx.rr(c, x - 76, y - 62, 152, 124, 20); c.fill();
        c.fillStyle = '#b5192b';
        G.gfx.rr(c, x - 58, y - 44, 116, 88, 16); c.fill();
        coroaDesenho(c, x - 44, y - 96, 22, '#ffd6e8');
        coroaDesenho(c, x + 44, y - 96, 22, '#ffd166');
      }
    }
    // água: primeiro o azul todo, só depois o clarinho por cima — senão os círculos
    // sobrepunham-se uns aos outros e o rio ficava com ar de escamas de peixe
    const perto = [];
    for (const a of mundo.agua) {
      const x = a.x - cam.x, y = a.y - cam.y;
      if (x < -a.r - 40 || x > W + a.r + 40 || y < -a.r - 40 || y > H + a.r + 40) continue;
      perto.push({ x: x, y: y, r: a.r, k: a.y });
    }
    c.fillStyle = mundo.tipo === 'reino' ? '#5fbfe0' : '#2f96c8';
    for (const a of perto) { c.beginPath(); c.arc(a.x, a.y, a.r, 0, TAU); c.fill(); }
    c.fillStyle = mundo.tipo === 'reino' ? '#8ed7f5' : '#48b0dd';
    for (const a of perto) { c.beginPath(); c.arc(a.x, a.y, a.r - 7, 0, TAU); c.fill(); }
    c.strokeStyle = 'rgba(255,255,255,.40)'; c.lineWidth = 4; c.lineCap = 'round';
    for (let i = 0; i < perto.length; i += 3) {      // ondinhas a brilhar de vez em quando
      const a = perto[i];
      c.beginPath();
      c.arc(a.x - a.r * 0.18, a.y, a.r * (0.42 + 0.05 * Math.sin(t * 2 + a.k * 0.01)), 0.7, 2.3);
      c.stroke();
    }
    // decoração (mata, flores, folhas de nenúfar, taças douradas)
    for (const d of mundo.deco) {
      const x = d.x - cam.x, y = d.y - cam.y;
      if (x < -60 || x > W + 60 || y < -60 || y > H + 60) continue;
      const s = d.s;
      if (d.k === 0) {                              // moita
        c.fillStyle = '#2f7d4f';
        for (let i = 0; i < 3; i++) {
          c.beginPath(); c.arc(x + (i - 1) * 9 * s, y + Math.abs(i - 1) * 4 * s, 11 * s, 0, TAU); c.fill();
        }
      } else if (d.k === 1) {                       // florzinha
        c.fillStyle = ['#ffd166', '#ff8fab', '#fff'][Math.floor(d.f) % 3];
        for (let i = 0; i < 5; i++) {
          const a = d.f + i / 5 * TAU;
          c.beginPath(); c.arc(x + Math.cos(a) * 5 * s, y + Math.sin(a) * 5 * s, 3.6 * s, 0, TAU); c.fill();
        }
        c.fillStyle = '#ffb703'; c.beginPath(); c.arc(x, y, 3 * s, 0, TAU); c.fill();
      } else if (d.k === 2) {                       // pedrinhas
        c.fillStyle = 'rgba(120,110,90,.5)';
        c.beginPath(); c.ellipse(x, y, 6 * s, 4.5 * s, d.f, 0, TAU); c.fill();
      } else if (d.k === 3) {                       // folha de nenúfar
        c.fillStyle = '#3f9142';
        c.beginPath(); c.arc(x, y, 26 * s, 0.35 + d.f * 0, TAU + 0.35); c.fill();
        c.fillStyle = base; c.beginPath();
        c.moveTo(x, y); c.arc(x, y, 27 * s, -0.28, 0.28); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2;
        c.beginPath(); c.arc(x, y, 18 * s, 0.6, 5.6); c.stroke();
      } else {                                      // taça dourada do palácio
        c.fillStyle = '#d4a017';
        c.beginPath(); c.ellipse(x, y, 10 * s, 6 * s, 0, 0, TAU); c.fill();
        c.fillStyle = '#ffe08a';
        c.beginPath(); c.ellipse(x, y - 2 * s, 7 * s, 4 * s, 0, 0, TAU); c.fill();
      }
    }
    // pedras e colunas
    for (const p of mundo.pedras) {
      const x = p.x - cam.x, y = p.y - cam.y;
      if (x < -p.r - 30 || x > W + p.r + 30 || y < -p.r - 30 || y > H + p.r + 30) continue;
      if (p.tom === 3) {                            // coluna do palácio
        c.fillStyle = 'rgba(0,0,0,.18)';
        c.beginPath(); c.ellipse(x + 6, y + 10, p.r, p.r * 0.6, 0, 0, TAU); c.fill();
        c.fillStyle = '#f3e6c8'; c.beginPath(); c.arc(x, y, p.r, 0, TAU); c.fill();
        c.fillStyle = '#dcc79a'; c.beginPath(); c.arc(x, y, p.r * 0.7, 0, TAU); c.fill();
        c.fillStyle = '#f3e6c8'; c.beginPath(); c.arc(x, y, p.r * 0.42, 0, TAU); c.fill();
      } else {
        c.fillStyle = 'rgba(0,0,0,.16)';
        c.beginPath(); c.ellipse(x + 5, y + 8, p.r, p.r * 0.7, 0, 0, TAU); c.fill();
        c.fillStyle = ['#9aa0a6', '#8b8f95', '#a8a39a'][p.tom];
        c.beginPath(); c.arc(x, y, p.r, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,.28)';
        c.beginPath(); c.arc(x - p.r * 0.3, y - p.r * 0.32, p.r * 0.45, 0, TAU); c.fill();
      }
    }
  }
  /* ================= as fases da história ================= */
  function ajustaCorpo(s) {
    s.nPts = Math.max(7, Math.round(s.segs * 1.7));
    if (!s.rasto.length) s.rasto.push({ x: s.x, y: s.y });
    while (s.rasto.length < s.nPts) {
      const u = s.rasto[s.rasto.length - 1];
      s.rasto.push({ x: u.x, y: u.y });
    }
    if (s.rasto.length > s.nPts) s.rasto.length = s.nPts;
  }

  // Põe a nossa cobra num sítio novo (mundo novo) já esticadinha e sem rasto antigo.
  function recolocaHeroi(x, y, ang) {
    hero.x = x; hero.y = y; hero.ang = ang;
    hero.nPts = Math.max(7, Math.round(hero.segs * 1.7));
    hero.rasto = [];
    for (let i = 0; i < hero.nPts; i++) {
      hero.rasto.push({ x: x - Math.cos(ang) * i * hero.r * 0.5, y: y - Math.sin(ang) * i * hero.r * 0.5 });
    }
    hist = [{ x: x, y: y }];
  }

  function novoHeroi(x, y, gigante) {
    const h = novaCobra(x, y, {
      r: gigante ? 25 : 11, vel: gigante ? 205 : 180, giro: gigante ? 3.0 : 3.7,
      segs: gigante ? 22 : 13, cor: '#39d353', cor2: '#1e7a34',
      tipo: gigante ? 'gigante' : 'heroi', ang: Math.PI / 2
    });
    return h;
  }

  // 1 — A FUGA: as cobras pequenas fogem das cobras grandes, rio abaixo.
  function entraFuga() {
    fase = 'fuga'; ft = 0;
    mundo = gerarMundo('vale');
    hero = novoHeroi(mundo.w / 2, 170, false);
    hist = [{ x: hero.x, y: hero.y }];
    amigos = []; bichos = []; itens = []; parts = []; apanhadas = [];
    cam = { x: hero.x - G.W / 2, y: hero.y - G.H / 2 };
    invul = 1.2; dash = 0; festa = 0;
    for (let i = 0; i < 3; i++) {                    // as cobras maiores, atrás de nós
      const s = novaCobra(mundo.w / 2 + rnd(-260, 260), rnd(-120, 40), {
        r: 21, vel: 146 + ronda * 6, giro: 2.1, segs: 20, tipo: 'grande',
        paleta: CORES[(i + 1) % CORES.length], ang: Math.PI / 2
      });
      bichos.push(s);
    }
    for (let i = 0; i < 2; i++) {                    // outras cobrinhas a fugir connosco
      bichos.push(novaCobra(mundo.w / 2 + rnd(-200, 200), rnd(120, 260), {
        r: 9, vel: 168, giro: 3.4, segs: 10, tipo: 'fujona', ang: Math.PI / 2
      }));
    }
    for (let i = 0; i < 26; i++) {
      itens.push({ x: rnd(80, mundo.w - 80), y: rnd(320, mundo.h - 220), k: 'estrela', t: rnd(0, 9) });
    }
    alvo = { x: mundo.w / 2, y: mundo.h - 30 };
    G.banner('Foge das cobras grandes! 🐍', 2600);
  }

  function mordidela(s) {
    vidas--; invul = 2.0;
    s.calma = 1.5; s.riso = 1.3;
    dash = Math.max(dash, 0.55);                     // o susto dá-nos um empurrão
    G.shake = 0.5;
    G.audio.sfx('nhac');
    pufo(hero.x, hero.y, 14, ['#ffffff', '#ffd166'], 230);
    if (vidas <= 0) {
      vidas = 3; invul = 3.0;
      for (const b of bichos) if (b.tipo === 'grande') b.calma = 3.0;
      pufo(hero.x, hero.y, 30, ['#ff8fab', '#ffffff', '#8ac926'], 280);
      G.audio.sfx('tada');
      G.banner('As flores do rio dão-te os corações! 🌸', 2800);
    } else {
      G.banner('Nhac! É só a brincar 😄', 1600);
    }
  }

  function upFuga(dt, t) {
    // na primeira ronda, um lembrete de como se conduz (a cobra anda sempre sozinha)
    if (ronda === 1 && !dica && ft > 4) {
      dica = true;
      G.banner('Arrasta o dedo para onde queres ir 👆', 3000);
    }
    for (const s of bichos) {
      s.calma = Math.max(0, (s.calma || 0) - dt);
      if (s.tipo === 'grande') {
        let ax = hero.x - s.x, ay = hero.y - s.y;
        for (const o of bichos) {                    // não se empilham umas em cima das outras
          if (o === s || o.tipo !== 'grande') continue;
          const dx = s.x - o.x, dy = s.y - o.y, d = Math.hypot(dx, dy);
          if (d < 150 && d > 0.01) { ax += dx / d * 130; ay += dy / d * 130; }
        }
        const a = Math.atan2(ay, ax) + Math.sin(t * 1.5 + s.t) * 0.3;
        conduz(s, dt, a, s.calma > 0 ? 0.32 : 1);
        s.susto = festa > 0 ? 0.1 : 0;
        if (festa > 0) s.danca = 0.4;
        const d = Math.hypot(s.x - hero.x, s.y - hero.y);
        if (d < s.r + hero.r + 6 && invul <= 0 && s.calma <= 0) mordidela(s);
      } else {                                       // as fujonas correm rio abaixo
        let a = Math.PI / 2 + Math.sin(t * 0.8 + s.t) * 0.5;
        for (const g of bichos) {
          if (g.tipo !== 'grande') continue;
          const d = Math.hypot(g.x - s.x, g.y - s.y);
          if (d < 260) { a = Math.atan2(s.y - g.y, s.x - g.x); s.susto = 0.4; }
        }
        conduz(s, dt, a, 1);
        if (s.y > mundo.h - 80) s.y = mundo.h - 80;
      }
    }
    if (hero.y > mundo.h - 130) entraQueda();
  }

  // 2 — A CASCATA: a cobra cai, e pelo caminho ainda apanha estrelas.
  function entraQueda() {
    fase = 'queda'; ft = 0; quedaT = 0; quedaX = 0; quedaVX = 0;
    itens = []; parts = [];
    for (let i = 0; i < 16; i++) {
      itens.push({ x: rnd(-0.38, 0.38), y: 1.15 + i * 0.30, k: 'estrela', t: rnd(0, 9) });
    }
    G.audio.sfx('whee');
    G.banner('IUPIIII! 💦 apanha as estrelas', 3800);
  }

  function upQueda(dt) {
    quedaT += dt;
    const ax = G.input.axis();
    quedaVX += ax.x * 3.4 * dt;
    quedaVX *= 0.90;
    quedaX = clamp(quedaX + quedaVX, -0.4, 0.4);
    for (let i = itens.length - 1; i >= 0; i--) {
      const it = itens[i];
      it.y -= dt * 1.0;
      if (Math.abs(it.y - 0.45) < 0.045 && Math.abs(it.x - quedaX) < 0.075) {
        itens.splice(i, 1);
        G.addStars(1); G.audio.sfx('star');
        pufo(G.W * (0.5 + quedaX), G.H * 0.45, 8, ['#ffd166', '#fff'], 160);
      } else if (it.y < -0.4) itens.splice(i, 1);
    }
    if (Math.random() < dt * 30) {
      parts.push({
        x: G.W * (0.5 + quedaX) + rnd(-40, 40), y: G.H * 0.5, vx: rnd(-40, 40), vy: rnd(-260, -120),
        t: 0, vida: rnd(0.4, 0.9), r: rnd(3, 7), cor: AGUA[ri(0, 2)], rot: 0, vr: rnd(-4, 4)
      });
    }
    if (quedaT > 4.0) entraFolha();
  }

  // 3 — A FOLHA com água a chapinhar e o BRILHANTE lá no meio.
  function entraFolha() {
    fase = 'folha'; ft = 0;
    mundo = { tipo: 'lago', w: 960, h: 840, pedras: [], deco: [], agua: [{ x: 480, y: 420, r: 620 }] };
    for (let i = 0; i < 9; i++) {                    // flores de nenúfar à volta do charco
      const a = i / 9 * TAU;
      mundo.deco.push({ x: 480 + Math.cos(a) * 330, y: 420 + Math.sin(a) * 300, k: 3, s: rnd(0.9, 1.5), f: rnd(0, TAU) });
    }
    brilho = { x: 480, y: 400, r: 24, t: 0 };
    hero = novoHeroi(480, 620, false);
    hero.ang = -Math.PI / 2;
    hist = [{ x: hero.x, y: hero.y }];
    bichos = []; itens = []; apanhadas = []; alvo = { x: brilho.x, y: brilho.y };
    cam = { x: hero.x - G.W / 2, y: hero.y - G.H / 2 };
    invul = 99; dash = 0; festa = 0;
    G.audio.sfx('splash');
    pufo(480, 620, 30, AGUA, 300);
    G.banner('Chuá! Olha o brilhante 💎', 2800);
  }

  function folhaRaio() { return 300; }

  function upFolha(dt, t) {
    brilho.t += dt;
    // a água chapinha à volta da folha o tempo todo
    if (Math.random() < dt * 14) {
      const a = rnd(0, TAU), r = folhaRaio() + rnd(6, 40);
      parts.push({
        x: 480 + Math.cos(a) * r, y: 420 + Math.sin(a) * r, vx: rnd(-30, 30), vy: rnd(-140, -60),
        t: 0, vida: rnd(0.4, 0.9), r: rnd(3, 7), cor: AGUA[ri(0, 2)], rot: 0, vr: rnd(-4, 4)
      });
    }
    // a cobra não sai da folha: a água empurra-a de volta para cima dela
    const dx = hero.x - 480, dy = hero.y - 420, d = Math.hypot(dx, dy);
    if (d > folhaRaio() - hero.r * 1.6) {
      const k = (folhaRaio() - hero.r * 1.6) / (d || 1);
      hero.x = 480 + dx * k; hero.y = 420 + dy * k;
      if (Math.random() < dt * 8) pufo(hero.x, hero.y, 3, AGUA, 120);
    }
    if (Math.hypot(hero.x - brilho.x, hero.y - brilho.y) < hero.r + brilho.r + 8) {
      fase = 'cresce'; cresce = 0; ft = 0;
      G.audio.sfx('suit'); G.addStars(10);
      pufo(brilho.x, brilho.y, 40, ['#fff', '#4cc9f0', '#ffd166', '#f96bb6'], 340);
      G.banner('FICASTE GIGANTE! 💎', 3000);
    }
  }

  function upCresce(dt) {
    cresce = Math.min(1, cresce + dt / 2.0);
    const k = cresce * cresce * (3 - 2 * cresce);
    hero.r = lerp(11, 25, k);
    hero.segs = Math.round(lerp(13, 22, k));
    hero.vel = lerp(180, 205, k);
    hero.giro = lerp(3.7, 3.0, k);
    ajustaCorpo(hero);
    if (Math.random() < dt * 26) pufo(hero.x, hero.y, 3, ['#fff', '#ffd166', '#4cc9f0'], 260);
    if (cresce >= 1) { hero.tipo = 'gigante'; entraGigante(); }
  }
  // O "nhac": a cobra apanhada sai a rir e passa a andar na nossa fila.
  function nhac(s, estrelas) {
    const i = bichos.indexOf(s);
    if (i >= 0) bichos.splice(i, 1);
    apanhadas.push({ x: s.x, y: s.y, cor: s.cor, cor2: s.cor2, r: s.r, t: 0 });
    novaAmiga({ cor: s.cor, cor2: s.cor2, r: Math.max(7, s.r * 0.75), coroa: s.coroa });
    G.audio.sfx('gulp');
    setTimeout(function () { G.audio.sfx('giggle'); }, 260);
    pufo(s.x, s.y, 18, [s.cor, '#ffffff', '#ffd166'], 240);
    if (estrelas) { G.addStars(estrelas); G.audio.sfx('star'); }
  }

  // 4 — GIGANTE: apanhar as cobras que andavam a tentar-nos com dinheiro.
  function entraGigante() {
    fase = 'gigante'; ft = 0;
    mundo = gerarMundo('lago');
    if (hero.tipo !== 'gigante') hero = novoHeroi(0, 0, true);   // (atalho de teste)
    recolocaHeroi(mundo.w / 2, mundo.h - 200, -Math.PI / 2);
    bichos = []; itens = []; parts = []; apanhadas = [];
    cam = { x: hero.x - G.W / 2, y: hero.y - G.H / 2 };
    invul = 99; dash = 0; festa = 0; portal = null; contagem = 0;
    for (let i = 0; i < 5; i++) {
      bichos.push(novaCobra(rnd(200, mundo.w - 200), rnd(160, mundo.h - 400), {
        r: 12, vel: 148, giro: 3.1, segs: 12, tipo: 'dinheiro', saco: true,
        paleta: CORES[(i + 2) % CORES.length]
      }));
    }
    alvo = null;
    G.banner('És GIGANTE! Apanha as cobras do dinheiro 💰', 3200);
  }

  function upGigante(dt, t) {
    for (const s of bichos) {
      const d = Math.hypot(s.x - hero.x, s.y - hero.y);
      let a = Math.atan2(s.y - hero.y, s.x - hero.x);       // fogem de nós
      if (d > 520) a = Math.atan2(mundo.h / 2 - s.y, mundo.w / 2 - s.x) + Math.sin(t + s.t) * 0.8;
      // se andarmos muito tempo coladinhos a ela, a cobra do dinheiro cansa-se e
      // abranda — assim uma criança apanha-a sempre, nunca fica a correr atrás para sempre
      s.cansa = d < 230 ? Math.min(4, (s.cansa || 0) + dt) : Math.max(0, (s.cansa || 0) - dt * 0.7);
      const forca = s.danca > 0 ? 0.2 : (s.cansa > 1.6 ? 0.55 : 1);
      conduz(s, dt, a + Math.sin(t * 2 + s.t) * 0.25, forca);
      if (s.cansa > 1.6 && Math.random() < dt * 3) {
        parts.push({
          x: s.x, y: s.y - s.r, vx: rnd(-20, 20), vy: rnd(-60, -20), t: 0, vida: 0.7,
          r: 5, cor: '#ffffff', rot: 0, vr: 2
        });
      }
      s.susto = d < 340 ? 0.2 : 0;
      if (Math.random() < dt * 1.4 && d < 460) {             // vão deixando cair moedas
        itens.push({ x: s.x, y: s.y, k: 'moeda', t: rnd(0, 9) });
      }
      if (d < hero.r + s.r + 4) {
        nhac(s, 3);
        contagem++;
        pufo(s.x, s.y, 14, ['#ffd166', '#ffe08a'], 200);
        if (contagem >= 5) {
          portal = { x: mundo.w / 2, y: 130, r: 74 };
          alvo = portal;
          G.audio.sfx('tada');
          G.banner('Abriu a porta do reino! 👑', 3200);
        } else {
          G.banner('Amiga nova! Faltam ' + (5 - contagem) + ' 💰', 1800);
        }
      }
    }
    if (portal && Math.hypot(hero.x - portal.x, hero.y - portal.y) < portal.r) entraReino();
  }

  // 5 — O REINO: apanhar a cobra rainha e a cobra rei.
  function entraReino() {
    fase = 'reino'; ft = 0;
    mundo = gerarMundo('reino');
    recolocaHeroi(mundo.w / 2, mundo.h - 160, -Math.PI / 2);
    bichos = []; itens = []; parts = []; apanhadas = [];
    cam = { x: hero.x - G.W / 2, y: hero.y - G.H / 2 };
    portal = null; contagem = 0;
    for (let i = 0; i < 6; i++) {                    // as cobras do reino, a passear
      bichos.push(novaCobra(rnd(360, mundo.w - 360), rnd(200, mundo.h - 300), {
        r: 11, vel: 120, giro: 2.6, segs: 11, tipo: 'reino', paleta: CORES[i % CORES.length]
      }));
    }
    bichos.push(novaCobra(mundo.w * 0.32, 260, {
      r: 14, vel: 196, giro: 3.4, segs: 15, tipo: 'rainha', coroa: '#ffd6e8',
      cor: '#f96bb6', cor2: '#c23c85'
    }));
    bichos.push(novaCobra(mundo.w * 0.68, 260, {
      r: 15, vel: 194, giro: 3.2, segs: 16, tipo: 'rei', coroa: '#ffd166',
      cor: '#8ac926', cor2: '#5b8f14'
    }));
    alvo = null;
    G.audio.sfx('whoosh');
    G.banner('O mundo do rei e da rainha! 👑', 3200);
  }

  function upReino(dt, t) {
    let rainha = null, rei = null;
    for (const s of bichos) {
      const d = Math.hypot(s.x - hero.x, s.y - hero.y);
      if (s.tipo === 'rainha' || s.tipo === 'rei') {
        if (s.tipo === 'rainha') rainha = s; else rei = s;
        // fogem aos ziguezagues e às vezes dão um esticão
        let a = Math.atan2(s.y - hero.y, s.x - hero.x) + Math.sin(t * 3 + s.t) * 0.6;
        if (d > 620) a = Math.atan2(mundo.h / 2 - s.y, mundo.w / 2 - s.x);
        conduz(s, dt, a, (s.danca > 0 ? 0.2 : 1) * (d < 200 ? 1.12 : 1));
        s.susto = d < 300 ? 0.2 : 0;
        if (d < hero.r + s.r + 4) {
          const era = s.tipo;
          s.coroa = null;
          pufo(s.x, s.y - s.r * 2, 34, CONFETES, 320);     // a coroa rebenta em confetes
          G.audio.sfx('tada');
          nhac(s, 8);
          amigos[amigos.length - 1].coroa = era === 'rainha' ? '#ffd6e8' : '#ffd166';
          contagem++;
          G.banner(era === 'rainha' ? 'A cobra rainha é tua amiga! 👑' : 'A cobra rei é teu amigo! 👑', 2600);
        }
      } else {
        conduz(s, dt, s.ang + Math.sin(t * 0.7 + s.t) * 0.9, s.danca > 0 ? 0.2 : 0.8);
      }
    }
    alvo = rainha || rei || null;
    if (contagem >= 2 && fase === 'reino') fazAnel();
  }

  // 6 — AS CAUDAS: as cobras ganham a volta a nós e temos de morder cada cauda.
  function fazAnel() {
    fase = 'caudas'; ft = 0;
    ringX = hero.x; ringY = hero.y;
    const n = bichos.length;
    // a roda tem de caber no ecrã (no telemóvel é bem mais pequena que no computador)
    const base = Math.max(130, Math.min(220, Math.min(G.W || 900, G.H || 700) * 0.32));
    bichos.forEach(function (s, i) {
      s.orbita = { raio: base + (i % 3) * 26, ang: i / n * TAU, vel: 0.42 + (i % 4) * 0.05 };
      s.vel = 150;
      s.giro = 3.4;
    });
    G.audio.sfx('multidao');
    G.banner('Ganharam a volta! Morde as CAUDAS ✨', 3400);
  }

  function upCaudas(dt, t) {
    ringX += (hero.x - ringX) * Math.min(1, dt * 0.75);
    ringY += (hero.y - ringY) * Math.min(1, dt * 0.75);
    for (const s of bichos) {
      s.orbita.ang += s.orbita.vel * dt;
      const tx = ringX + Math.cos(s.orbita.ang) * s.orbita.raio;
      const ty = ringY + Math.sin(s.orbita.ang) * s.orbita.raio;
      conduz(s, dt, Math.atan2(ty - s.y, tx - s.x), s.danca > 0 ? 0.25 : 1);
      const p = cauda(s);
      if (Math.hypot(p.x - hero.x, p.y - hero.y) < hero.r + s.r + 14) {
        nhac(s, 5);
        G.audio.sfx('nhac');
        if (bichos.length) G.banner('Nhac na cauda! Faltam ' + bichos.length + ' ✨', 1700);
        continue;
      }
      if (Math.hypot(s.x - hero.x, s.y - hero.y) < hero.r + s.r + 6 && aviso <= 0) {
        aviso = 2.2; s.riso = 1.2; s.susto = 0.3;
        G.audio.sfx('giggle');
        G.banner('Essa é a cabeça! A cauda é a pontinha ✨', 2000);
      }
    }
    if (!bichos.length) {
      fase = 'festa'; ft = 0;
      G.addStars(25); G.audio.sfx('golo');
      G.banner('GANHASTE! As cobras são todas amigas 🎉', 3600);
    }
  }

  function upFesta(dt) {
    if (Math.random() < dt * 60) {
      parts.push({
        x: rnd(0, G.W) + cam.x, y: cam.y - 20, vx: rnd(-40, 40), vy: rnd(60, 200),
        t: 0, vida: rnd(1.4, 2.4), r: rnd(5, 11), cor: CONFETES[ri(0, CONFETES.length - 1)],
        rot: rnd(0, TAU), vr: rnd(-7, 7)
      });
    }
    if (ft > 5) { ronda++; vidas = 3; entraFuga(); }
  }

  /* ================= o que acontece em todas as fases ================= */
  function segueCamara(dt) {
    const tx = mundo.w <= G.W ? (mundo.w - G.W) / 2 : clamp(hero.x - G.W / 2, 0, mundo.w - G.W);
    const ty = mundo.h <= G.H ? (mundo.h - G.H) / 2 : clamp(hero.y - G.H / 2, 0, mundo.h - G.H);
    const k = 1 - Math.pow(0.0015, dt);
    cam.x = lerp(cam.x, tx, k);
    cam.y = lerp(cam.y, ty, k);
  }

  function apanhaItens() {
    for (let i = itens.length - 1; i >= 0; i--) {
      const it = itens[i];
      if (Math.hypot(it.x - hero.x, it.y - hero.y) < hero.r + 20) {
        itens.splice(i, 1);
        G.addStars(1); G.audio.sfx(it.k === 'moeda' ? 'pop' : 'star');
        pufo(it.x, it.y, 7, ['#ffd166', '#fff'], 150);
      }
    }
  }

  S.enter = function () {
    ronda = 1; vidas = 3; ft = 0; aviso = 0; cresce = 0; contagem = 0; dica = false;
    parts = []; apanhadas = []; amigos = [];
    entraFuga();
  };

  S.update = function (dt, t) {
    ft += dt;
    invul = Math.max(0, invul - dt);
    dash = Math.max(0, dash - dt);
    festa = Math.max(0, festa - dt);
    aviso = Math.max(0, aviso - dt);
    atualizaParts(dt);
    for (const s of bichos) {
      s.t += dt;
      s.riso = Math.max(0, s.riso - dt);
      s.danca = Math.max(0, s.danca - dt);
      s.susto = Math.max(0, s.susto - dt);
    }
    for (let i = apanhadas.length - 1; i >= 0; i--) {
      apanhadas[i].t += dt;
      if (apanhadas[i].t > 0.5) apanhadas.splice(i, 1);
    }

    if (fase === 'queda') { upQueda(dt); return; }
    if (fase === 'cresce') { upCresce(dt); segueCamara(dt); return; }

    // os dois botões: 💨 dá um esticão, 🎉 põe as cobras à volta a dançar
    if (G.input.justPressed('fire') && dash <= 0) {
      dash = 0.5; G.audio.sfx('whoosh');
      pufo(hero.x, hero.y, 8, ['#ffffff', '#bfe7ff'], 160);
    }
    if (G.input.justPressed('horn') && festa <= 0) {
      festa = 1.8; G.audio.sfx('giggle');
      pufo(hero.x, hero.y, 22, CONFETES, 260);
      for (const s of bichos) {
        if (Math.hypot(s.x - hero.x, s.y - hero.y) < 420) s.danca = 1.6;
      }
    }

    const ax = G.input.axis();
    let ang = hero.ang;
    if (Math.hypot(ax.x, ax.y) > 0.2) ang = Math.atan2(ax.y, ax.x);
    if (autoTeste) {                                 // só para testes: vai sozinha ao objetivo
      const p = alvoDeTeste();
      if (p) ang = Math.atan2(p.y - hero.y, p.x - hero.x);
    }
    conduz(hero, dt, ang, dash > 0 ? 2.0 : 1);
    guardaCaminho();
    apanhaItens();
    segueCamara(dt);

    if (fase === 'fuga') upFuga(dt, t);
    else if (fase === 'folha') upFolha(dt, t);
    else if (fase === 'gigante') upGigante(dt, t);
    else if (fase === 'reino') upReino(dt, t);
    else if (fase === 'caudas') upCaudas(dt, t);
    else if (fase === 'festa') upFesta(dt);
  };
  /* ================= desenhar ================= */
  // a folha gigante onde a cobra cai, com as suas nervuras e o cortezinho
  function desenhaFolha(c, t) {
    const x = 480, y = 420, r = folhaRaio();
    c.save();
    c.fillStyle = 'rgba(0,0,0,.18)';
    c.beginPath(); c.ellipse(x + 10, y + 14, r, r * 0.95, 0, 0, TAU); c.fill();
    c.fillStyle = '#2f7d4f';
    c.beginPath(); c.arc(x, y, r + 8, 0, TAU); c.fill();
    c.fillStyle = '#57b45f';
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.fillStyle = '#3aa7d8';                         // o cortezinho da folha
    c.beginPath(); c.moveTo(x, y); c.arc(x, y, r + 10, -0.26, 0.26); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.30)'; c.lineWidth = 5; c.lineCap = 'round';
    for (let i = 0; i < 9; i++) {                    // nervuras
      const a = 0.35 + i / 9 * (TAU - 0.7);
      c.beginPath(); c.moveTo(x, y);
      c.lineTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9); c.stroke();
    }
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 4;
    c.beginPath(); c.arc(x, y, r * 0.62 + Math.sin(t * 1.6) * 4, 0, TAU); c.stroke();
    c.restore();
  }

  function desenhaBrilhante(c, t) {
    const x = brilho.x, y = brilho.y - 6 + Math.sin(t * 2) * 6, r = brilho.r;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(x, y, 2, x, y, r * 3.6);
    g.addColorStop(0, 'rgba(180,240,255,.85)'); g.addColorStop(1, 'rgba(120,220,255,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 3.6, 0, TAU); c.fill();
    c.restore();
    c.save(); c.translate(x, y); c.rotate(Math.sin(t) * 0.2);
    c.fillStyle = '#7fe3ff';
    c.beginPath();
    c.moveTo(0, -r * 1.25); c.lineTo(r, -r * 0.25); c.lineTo(0, r * 1.3); c.lineTo(-r, -r * 0.25);
    c.closePath(); c.fill();
    c.fillStyle = '#c9f4ff';
    c.beginPath(); c.moveTo(0, -r * 1.25); c.lineTo(0, r * 1.3); c.lineTo(-r, -r * 0.25); c.closePath(); c.fill();
    c.fillStyle = '#ffffff';
    c.beginPath(); c.moveTo(0, -r * 1.25); c.lineTo(r * 0.42, -r * 0.42); c.lineTo(-r * 0.42, -r * 0.42); c.closePath(); c.fill();
    c.strokeStyle = '#2f9fc4'; c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(0, -r * 1.25); c.lineTo(r, -r * 0.25); c.lineTo(0, r * 1.3); c.lineTo(-r, -r * 0.25);
    c.closePath(); c.stroke();
    c.restore();
    for (let i = 0; i < 3; i++) {                    // brilhozinhos a saltitar à volta
      const a = t * 1.6 + i / 3 * TAU;
      G.gfx.star(c, x + Math.cos(a) * r * 2.2, y + Math.sin(a) * r * 1.7, 6 + Math.sin(t * 5 + i) * 2, '#fff', t * 2);
    }
  }

  function desenhaPortal(c, t) {
    const x = portal.x, y = portal.y, r = portal.r;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(x, y, 4, x, y, r * 1.9);
    g.addColorStop(0, 'rgba(255,224,138,.75)'); g.addColorStop(1, 'rgba(255,200,80,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 1.9, 0, TAU); c.fill();
    c.restore();
    c.strokeStyle = '#d4a017'; c.lineWidth = 16; c.lineCap = 'round';
    c.beginPath(); c.arc(x, y + r * 0.2, r, Math.PI, TAU); c.stroke();
    c.beginPath(); c.moveTo(x - r, y + r * 0.2); c.lineTo(x - r, y + r * 0.8); c.stroke();
    c.beginPath(); c.moveTo(x + r, y + r * 0.2); c.lineTo(x + r, y + r * 0.8); c.stroke();
    c.strokeStyle = '#ffe08a'; c.lineWidth = 7;
    c.beginPath(); c.arc(x, y + r * 0.2, r, Math.PI, TAU); c.stroke();
    coroaDesenho(c, x, y - r * 1.1, 22, '#ffd166');
    c.save();
    c.globalAlpha = 0.35 + 0.15 * Math.sin(t * 3);
    c.fillStyle = '#fff3b0';
    c.beginPath(); c.ellipse(x, y + r * 0.45, r * 0.86, r * 0.66, 0, 0, TAU); c.fill();
    c.restore();
  }

  function desenhaItens(c, t) {
    for (const it of itens) {
      if (it.x - cam.x < -40 || it.x - cam.x > G.W + 40 || it.y - cam.y < -40 || it.y - cam.y > G.H + 40) continue;
      if (it.k === 'moeda') {
        c.fillStyle = '#d4a017';
        c.beginPath(); c.ellipse(it.x, it.y, 11, 11 * Math.abs(Math.cos(t * 2 + it.t)) + 3, 0, 0, TAU); c.fill();
        c.fillStyle = '#ffe08a';
        c.beginPath(); c.ellipse(it.x, it.y, 7, 7 * Math.abs(Math.cos(t * 2 + it.t)) + 2, 0, 0, TAU); c.fill();
      } else {
        G.gfx.star(c, it.x, it.y + Math.sin(t * 2 + it.t) * 4, 14, '#ffd166', t * 1.2);
      }
    }
  }

  // a beira da cascata, lá no fundo do vale
  function desenhaCascata(c, t) {
    const y = mundo.h - 40;
    c.fillStyle = '#3aa7d8'; c.fillRect(0, y - 60, mundo.w, 60);
    c.fillStyle = '#ffffff';
    for (let x = 0; x < mundo.w; x += 26) {
      const h = 14 + Math.sin(x * 0.05 + t * 4) * 8;
      c.beginPath(); c.ellipse(x, y - 10, 16, h, 0, 0, TAU); c.fill();
    }
    c.fillStyle = '#bfe7ff'; c.fillRect(0, y, mundo.w, 200);
    c.fillStyle = 'rgba(255,255,255,.7)';
    for (let x = 0; x < mundo.w; x += 34) {
      c.fillRect(x + Math.sin(t * 3 + x) * 4, y, 12, 200);
    }
    G.gfx.label(c, '⬇ CASCATA ⬇', mundo.w / 2, y - 92, 44, '#1982c4', 'center');
  }

  function desenhaQueda(c, t) {
    const W = G.W, H = G.H;
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2a7fb8'); g.addColorStop(0.5, '#6fc2e8'); g.addColorStop(1, '#bfe7ff');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const desc = quedaT * 900;
    c.fillStyle = '#6b5b45';                          // as paredes de pedra dos lados
    c.fillRect(0, 0, W * 0.13, H); c.fillRect(W * 0.87, 0, W * 0.13, H);
    c.fillStyle = 'rgba(0,0,0,.18)';
    for (let i = 0; i < 14; i++) {
      const y = ((i * 120 + desc * 0.6) % (H + 200)) - 100;
      c.beginPath(); c.ellipse(W * 0.06, y, W * 0.05, 26, 0, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(W * 0.94, y + 60, W * 0.05, 26, 0, 0, TAU); c.fill();
    }
    c.strokeStyle = 'rgba(255,255,255,.65)'; c.lineCap = 'round';
    for (let i = 0; i < 40; i++) {                    // os fios de água a subir
      const x = W * 0.14 + ((i * 97) % (W * 0.72));
      const y = ((i * 140 + desc) % (H + 260)) - 130;
      c.lineWidth = 3 + (i % 3) * 2;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 90 + (i % 5) * 30); c.stroke();
    }
    // arco-íris lá em baixo, por cima da espuma
    c.save(); c.globalAlpha = 0.38; c.lineWidth = 10;
    const cores = ['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#4cc9f0', '#9d4edd'];
    for (let i = 0; i < cores.length; i++) {
      c.strokeStyle = cores[i];
      c.beginPath(); c.arc(W / 2, H * 1.6, Math.max(4, W * 0.42 - i * 11), Math.PI * 1.2, Math.PI * 1.8); c.stroke();
    }
    c.restore();
    for (const it of itens) G.gfx.star(c, W * (0.5 + it.x), H * it.y, 16, '#ffd166', t * 2);
    // a nossa cobra a cair, toda torta com o vento
    const hx = W * (0.5 + quedaX), hy = H * 0.45;
    const pts = [];
    for (let i = 0; i < hero.nPts; i++) {
      pts.push({ x: hx + Math.sin(t * 9 - i * 0.5) * (3 + i * 0.55) + quedaVX * 90, y: hy - i * hero.r * 0.5 });
    }
    corpo(c, pts, { r: hero.r, cor: hero.cor, cor2: hero.cor2 });
    cabeca(c, pts[0].x, pts[0].y, Math.PI / 2 + quedaVX * 2, hero.r, { cor: hero.cor, cor2: hero.cor2 }, t);
    desenhaParts(c);
    if (quedaT > 3.4) {                               // já se vê a folha lá em baixo
      c.save(); c.globalAlpha = Math.min(1, (quedaT - 3.4) / 0.6);
      c.fillStyle = '#57b45f';
      c.beginPath(); c.ellipse(W / 2, H * 1.02, W * 0.5, H * 0.2, 0, 0, TAU); c.fill();
      c.restore();
    }
  }

  function setaParaAlvo(c, t) {
    if (!alvo) return;
    const x = alvo.x - cam.x, y = alvo.y - cam.y;
    if (x > 40 && x < G.W - 40 && y > 40 && y < G.H - 40) return;
    const cx = G.W / 2, cy = G.H / 2;
    const a = Math.atan2(y - cy, x - cx);
    const rx = Math.min(G.W, G.H) * 0.34;
    const px = cx + Math.cos(a) * rx, py = cy + Math.sin(a) * rx;
    c.save(); c.translate(px, py); c.rotate(a);
    c.fillStyle = '#ffd166'; c.strokeStyle = '#fff'; c.lineWidth = 3;
    const s = 20 + Math.sin(t * 5) * 3;
    c.beginPath(); c.moveTo(s, 0); c.lineTo(-s * 0.7, -s * 0.7); c.lineTo(-s * 0.3, 0); c.lineTo(-s * 0.7, s * 0.7);
    c.closePath(); c.fill(); c.stroke();
    c.restore();
  }

  function desenhaHUD(c, t) {
    // no telemóvel ao alto a faixa de mensagens desce para baixo dos botões 🏠/🔊,
    // por isso os corações têm de ficar ainda mais abaixo para não ficarem tapados
    const topo = 24 + (G.W < 560 ? 140 : 0);
    for (let i = 0; i < 3; i++) {                     // corações
      G.gfx.heart(c, 32 + i * 38, topo, 15, i < vidas ? '#ff4d6d' : 'rgba(255,255,255,.35)');
    }
    let txt = '';
    if (fase === 'fuga') {
      // barrinha do caminho até à cascata (números não se leem aos 5 anos)
      const k = clamp(hero.y / (mundo.h - 130), 0, 1);
      c.fillStyle = 'rgba(255,255,255,.45)';
      G.gfx.rr(c, 32, topo + 26, 140, 18, 9); c.fill();
      c.fillStyle = '#4cc9f0';
      G.gfx.rr(c, 35, topo + 29, Math.max(6, 134 * k), 12, 6); c.fill();
      G.gfx.label(c, '💦', 186, topo + 35, 24, '#fff', 'left', 'none');
    } else if (fase === 'gigante') txt = portal ? '👑 ➜' : '💰 ' + (5 - contagem);
    else if (fase === 'reino') txt = '👑 ' + (2 - contagem);
    else if (fase === 'caudas') txt = '✨ ' + bichos.length;
    else if (fase === 'folha' || fase === 'cresce') txt = '💎';
    if (txt) G.gfx.label(c, txt, 30, topo + 40, 28, '#ffffff', 'left', '#1982c4');
    if (amigos.length) {
      G.gfx.label(c, '🐍 ' + amigos.length, 30, topo + 76, 26, '#ffffff', 'left', '#1e7a34');
    }
    setaParaAlvo(c, t);
  }

  S.draw = function (c, t) {
    if (fase === 'queda') { desenhaQueda(c, t); return; }
    desenhaChao(c, t);
    c.save();
    c.translate(-cam.x, -cam.y);
    if (fase === 'folha' || fase === 'cresce') desenhaFolha(c, t);
    if (mundo.tipo === 'vale') desenhaCascata(c, t);
    desenhaItens(c, t);
    if (portal) desenhaPortal(c, t);
    if ((fase === 'folha') && brilho) desenhaBrilhante(c, t);
    for (const s of bichos) {
      desenhaCobra(c, s, t);
      if (fase === 'caudas') marcaCauda(c, s, t);
    }
    desenhaAmigos(c, t);
    if (!(fase === 'fuga' && invul > 0 && Math.floor(t * 10) % 2 === 0)) {
      // anel dourado por baixo da nossa cobra: no meio de tantas cobras iguais,
      // é assim que se sabe sempre qual é a nossa
      c.save();
      c.strokeStyle = 'rgba(255,209,102,.95)'; c.lineWidth = 4;
      c.beginPath(); c.arc(hero.x, hero.y, hero.r * 2.1 + Math.sin(t * 4) * 2, 0, TAU); c.stroke();
      c.restore();
      desenhaCobra(c, hero, t);
      G.gfx.star(c, hero.x, hero.y - hero.r * 3.1, 9, '#ffd166', t * 1.5);
    }
    if (fase === 'cresce') {                          // aros de arco-íris ao ficar gigante
      for (let i = 0; i < 3; i++) {
        const k = (cresce * 2 + i / 3) % 1;
        c.save(); c.globalAlpha = 1 - k; c.lineWidth = 8;
        c.strokeStyle = ['#ff595e', '#ffca3a', '#4cc9f0'][i];
        c.beginPath(); c.arc(hero.x, hero.y, 30 + k * 220, 0, TAU); c.stroke();
        c.restore();
      }
    }
    if (dash > 0) {                                   // risquinhos de velocidade
      c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 4; c.lineCap = 'round';
      for (let i = 1; i < 4; i++) {
        const p = hero.rasto[i * 2] || hero.rasto[hero.rasto.length - 1];
        c.beginPath();
        c.moveTo(p.x, p.y);
        c.lineTo(p.x - Math.cos(hero.ang) * 26, p.y - Math.sin(hero.ang) * 26);
        c.stroke();
      }
    }
    for (const a of apanhadas) {                      // a cobrinha a saltar para a fila
      const k = a.t / 0.5;
      const x = lerp(a.x, hero.x, k), y = lerp(a.y, hero.y, k) - Math.sin(k * Math.PI) * 40;
      c.save(); c.globalAlpha = 1 - k * 0.6;
      c.fillStyle = a.cor;
      c.beginPath(); c.arc(x, y, a.r * (1 - k * 0.6), 0, TAU); c.fill();
      c.restore();
      G.gfx.label(c, '😄', x, y - 30 - k * 20, 26, '#fff', 'center', 'none');
    }
    desenhaParts(c);
    c.restore();
    desenhaHUD(c, t);
  };

  /* para testes: ver o estado e saltar de fase */
  S.debug = function () {
    return {
      fase: fase, ronda: ronda, vidas: vidas, amigos: amigos.length,
      contagem: contagem, bichos: bichos.length,
      cam: { x: Math.round(cam.x), y: Math.round(cam.y) },
      mundo: { tipo: mundo.tipo, w: mundo.w, h: mundo.h },
      ecra: { w: G.W, h: G.H },
      hero: { x: Math.round(hero.x), y: Math.round(hero.y), r: +hero.r.toFixed(1) }
    };
  };
  // conduz a cobra sozinha até ao que interessa na fase (serve para testar a história toda)
  function alvoDeTeste() {
    if (fase === 'fuga') return { x: mundo.w / 2, y: mundo.h };
    if (fase === 'folha') return brilho;
    if (fase === 'gigante') return portal || maisPerto();
    if (fase === 'reino') {
      for (const s of bichos) if (s.tipo === 'rainha' || s.tipo === 'rei') return s;
      return null;
    }
    if (fase === 'caudas') { const s = maisPerto(); return s ? cauda(s) : null; }
    return null;
  }
  function maisPerto() {
    let melhor = null, dm = 1e9;
    for (const s of bichos) {
      const d = Math.hypot(s.x - hero.x, s.y - hero.y);
      if (d < dm) { dm = d; melhor = s; }
    }
    return melhor;
  }
  S.debugAuto = function (frames) {
    autoTeste = true;
    for (let i = 0; i < (frames || 300); i++) S.update(1 / 60, ft + 1 / 60);
    autoTeste = false;
    return S.debug();
  };
  S.debugFase = function (n) {
    if (n === 'fuga') entraFuga();
    else if (n === 'queda') entraQueda();
    else if (n === 'folha') entraFolha();
    else if (n === 'gigante') entraGigante();
    else if (n === 'reino') entraReino();
    else if (n === 'caudas') { entraReino(); contagem = 2; fazAnel(); }
    else return false;
    return true;
  };

  G.scenes = G.scenes || {};
  G.scenes.cobras = S;
})();

