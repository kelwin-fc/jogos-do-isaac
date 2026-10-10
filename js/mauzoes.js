/* Cena — MAUZÕES de Lego, ditado pelo Isaac (2026-09-22):
     "um jogo do Lego em que temos que desfazer os mauzinhos, e os bonzões são da
      nossa equipa. Este é fácil."

   O Isaac é um construtor de Lego (capacete amarelo). Atira tijolos (🧱) aos mauzões
   de capacete de cornos. Ao fim de uns tijolos o mauzão DESFAZ-SE em peças de Lego,
   as peças ficam um bocadinho no chão e voltam a montar-se... já de boné azul e
   sorriso: passou a BONZÃO e fica da nossa equipa. A equipa segue o Isaac e também
   atira tijolos aos mauzões que faltam; o 🤝 manda a equipa toda atirar ao mesmo tempo.
   Com todos os mauzões feitos bonzões há festa e vêm mais (a partir da 2.ª ronda
   com um CHEFE grande de coroa).

   Regras de paz do projeto: ninguém morre e não há derrota. Se um tijolo dos mauzões
   acerta no Isaac, o boneco desmonta-se e volta a montar-se sozinho (larga uns pinos
   que se voltam a apanhar). Os bonecos vêm do js/marvel.js (G.legoBoneco). */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  const MUNDO = 4400;
  const GRAV = 1900;
  const FIG = 1.45;
  const MAX_EQUIPA = 12;               // os que vierem depois vão para a casa da equipa
  const CASA_X = 170, FORTE_X = MUNDO - 230;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function sfx(n) { if (G.audio) G.audio.sfx(n); }
  function fala(txt) { if (G.audio && G.audio.fala) G.audio.fala(txt, false, 1.1); }
  const rr = function (c, x, y, w, h, r) { G.gfx.rr(c, x, y, w, h, r); };
  function boneco(c, d, o) { G.legoBoneco(c, d, o); }

  /* ---------- personagens ---------- */
  const ISAAC = { id: 'isaac', tronco: '#e63946', bracos: '#e63946', pernas: '#1d4ed8', ancas: '#1d4ed8', chapeu: 'capacete' };
  const MAUS = [
    { tronco: '#2b2d42', pernas: '#111111', ancas: '#c1121f' },
    { tronco: '#5a189a', pernas: '#240046', ancas: '#111111' },
    { tronco: '#1b4332', pernas: '#111111', ancas: '#6a040f' }
  ];
  const CORES_BONS = ['#4361ee', '#2a9d8f', '#ff9f1c', '#8ac926', '#ff6fb1', '#4cc9f0', '#f4a261'];
  function defMau(chefe) {
    const m = MAUS[Math.floor(Math.random() * MAUS.length)];
    const d = { id: 'mauzao', tronco: m.tronco, bracos: m.tronco, pernas: m.pernas, ancas: m.ancas,
      expr: 'mau', chapeu: 'cornos' };
    if (chefe) { d.grande = 1.6; d.chapeu = 'coroa'; d.capa = '#6a040f'; d.tronco = d.bracos = '#111111'; }
    return d;
  }
  function defBom(chefe) {
    const cor = CORES_BONS[Math.floor(Math.random() * CORES_BONS.length)];
    const d = { id: 'bonzao', tronco: cor, bracos: cor, pernas: '#1d3557', ancas: '#1d3557', chapeu: 'bone' };
    if (chefe) { d.grande = 1.6; d.chapeu = 'coroaBoa'; d.capa = '#4361ee'; }
    return d;
  }

  // plataformas de tijolos para saltar por cima dos tijolos dos mauzões
  const PLAT = [
    { x: 620, y: -150, w: 230 }, { x: 1180, y: -250, w: 200 }, { x: 1650, y: -150, w: 260 },
    { x: 2250, y: -210, w: 230 }, { x: 2850, y: -150, w: 250 }, { x: 3400, y: -240, w: 210 },
    { x: 3850, y: -150, w: 230 }
  ];
  // torres de tijolos ao fundo (enfeite), sempre iguais
  const TORRES = [];
  (function () {
    let seed = 7;
    function r() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    const cores = ['#e63946', '#ffd166', '#4361ee', '#2a9d8f', '#ff9f1c', '#8ac926', '#ff6fb1'];
    for (let x = 420; x < MUNDO - 400; x += 260 + r() * 220) {
      const n = 3 + Math.floor(r() * 6), bl = [];
      for (let i = 0; i < n; i++) bl.push({ cor: cores[Math.floor(r() * cores.length)], w: 70 + Math.floor(r() * 3) * 20, dx: (r() - 0.5) * 16 });
      TORRES.push({ x: x, bl: bl });
    }
  })();

  let saiuCasa = 0;
  let heroi, maus, equipa, tijolos, pinos, fx, cam, ronda, vitoria, tempo, agenda, chamaCd;

  function altura(d) { return 72 * FIG * (d.grande || 1); }
  // (nunca 0: com o separador escondido o ecrã mede 0 e a câmara ficava NaN para sempre)
  function escala() { return Math.max(0.2, Math.min(1, G.H / 560, G.W / 560)); }
  // telemóvel ao alto: o chão sobe para cima das duas filas de botões, senão tapavam os bonecos
  function chaoPx() { return G.H > G.W * 1.2 ? G.H - 240 : Math.min(G.H * 0.84, G.H - 122); }
  function vistaW() { return G.W / escala(); }
  function depois(seg, fn) { agenda.push({ t: tempo + seg, fn: fn }); }

  /* ---------- rondas ---------- */
  function novaRonda() {
    maus = [];
    const n = Math.min(3 + ronda * 2, 11);
    const livres = [];
    for (let x = 500; x < MUNDO - 200; x += 120) if (Math.abs(x - heroi.x) > 520) livres.push(x);
    livres.sort(function () { return Math.random() - 0.5; });
    for (let i = 0; i < n; i++) maus.push(novoMau(livres[i % livres.length] + rnd(-30, 30), false));
    if (ronda >= 2) {                                   // o chefe fica no forte
      maus.push(novoMau(FORTE_X - 120, true));
    }
    vitoria = null;
  }

  function novoMau(x, chefe) {
    return {
      d: defMau(chefe), chefe: chefe, x: x, y: 0, vx: 0, vy: 0, casa: x, dir: -1, fase: rnd(0, 6),
      hp: chefe ? 9 : 3, hpMax: chefe ? 9 : 3, cd: rnd(2, 4), estado: 'mau', pisca: 0, tonto: 0,
      alvo: x + rnd(-150, 150), partes: null, t: 0
    };
  }

  S.enter = function () {
    tempo = 0; agenda = []; ronda = 1; chamaCd = 0; saiuCasa = 0;
    heroi = { x: 380, y: 0, vx: 0, vy: 0, dir: 1, noChao: true, saltos: 0, cd: 0, fase: 0, braco: 0,
      partes: null, dmT: 0, invul: 1 };
    equipa = []; tijolos = []; pinos = []; fx = [];
    cam = { x: 0 };
    novaRonda();
    fala('Vamos desfazer os mauzões! Depois ficam da nossa equipa!');
    G.banner('🧱 Desfaz os mauzões! 💙', 2600);
  };

  /* ---------- efeitos ---------- */
  function faisca(x, y, cor, n, vel) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, TAU), v = rnd(80, vel || 320);
      fx.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, t: 0, vida: rnd(0.4, 0.9),
        cor: cor || CORES_BONS[i % CORES_BONS.length], tam: rnd(4, 8) });
    }
  }
  function soltaPinos(x, y, n) {
    for (let i = 0; i < n; i++) pinos.push({ x: x, y: y, vx: rnd(-240, 240), vy: rnd(-600, -300), t: 0 });
  }
  function novasPartes(forca) {
    const p = {};
    for (const n of ['cabeca', 'tronco', 'pernas', 'bracoF', 'bracoT']) {
      p[n] = { dx: 0, dy: 0, r: 0, vx: rnd(-1, 1) * 90 * forca, vy: (rnd(-170, -70) - (n === 'cabeca' ? 60 : 0)) * forca, vr: rnd(-8, 8) };
    }
    return p;
  }
  // até onde cada peça pode cair (unidades do boneco): assim ficam todas no chão
  const CHAO_PECA = { cabeca: 52, tronco: 26, bracoF: 22, bracoT: 22, pernas: 0 };
  function mexePartes(pt, dt, t, tVolta, dur) {
    for (const n in pt) {
      const p = pt[n];
      if (t < tVolta) {
        p.vy += 700 * dt; p.dx += p.vx * dt; p.dy += p.vy * dt; p.r += p.vr * dt;
        if (p.dy > CHAO_PECA[n]) { p.dy = CHAO_PECA[n]; p.vy *= -0.35; p.vx *= 0.6; p.vr *= 0.6; }
      } else {
        const k = Math.min(1, (t - tVolta) / dur);
        p.dx *= 1 - k; p.dy *= 1 - k; p.r *= 1 - k;
      }
    }
  }

  /* ---------- tijolos (os tiros) ---------- */
  // lança um tijolo em arco que chega a (tx,ty); vel = velocidade na horizontal
  function lanca(x, y, tx, ty, vel, dono, cor) {
    const dx = tx - x;
    const tt = clamp(Math.abs(dx) / vel, 0.25, 1.6);
    const g = 900;
    tijolos.push({ x: x, y: y, vx: dx / tt, vy: (ty - y - 0.5 * g * tt * tt) / tt, g: g, rot: 0,
      dono: dono, cor: cor, vida: 3 });
  }

  function mauMaisPerto(x, alcance) {
    let m = null, best = alcance;
    for (const v of maus) {
      if (v.estado !== 'mau') continue;
      const dd = Math.abs(v.x - x);
      if (dd < best) { best = dd; m = v; }
    }
    return m;
  }

  function atira() {
    const h = heroi;
    if (h.cd > 0 || h.partes) return;
    h.cd = 0.28; h.braco = 1;
    sfx('pop');
    // mira sozinho no mauzão mais perto à frente (é o jogo fácil do Isaac)
    let alvo = null, best = 760;
    for (const v of maus) {
      if (v.estado !== 'mau') continue;
      const dx = (v.x - h.x) * h.dir;
      if (dx > -20 && dx < best) { best = dx; alvo = v; }
    }
    const sx = h.x + h.dir * 22, sy = h.y - 58;
    if (alvo) lanca(sx, sy, alvo.x, alvo.y - altura(alvo.d) * 0.55, 900, 'bom', '#4361ee');
    else tijolos.push({ x: sx, y: sy, vx: h.dir * 900, vy: -260, g: 900, rot: 0, dono: 'bom', cor: '#4361ee', vida: 1.4 });
  }

  function acertaMau(v, dir) {
    v.hp -= 1; v.pisca = 0.15; v.tonto = 0.6; v.vx = dir * (v.chefe ? 90 : 190);
    sfx('boing');
    faisca(v.x, v.y - altura(v.d) * 0.6, '#ffd166', 5, 200);
    if (v.hp <= 0) desfaz(v);
  }

  function desfaz(v) {
    v.estado = 'desfeito'; v.t = 0; v.vx = 0;
    v.partes = novasPartes(v.chefe ? 1.3 : 1.6);
    sfx('desmonta'); G.shake = Math.max(G.shake, 0.25);
    faisca(v.x, v.y - 40, null, 16, 380);
    soltaPinos(v.x, v.y - 40, v.chefe ? 8 : 3);
    G.addStars(v.chefe ? 5 : 1);
  }

  const FRASES = ['Obrigado! Agora sou bonzinho!', 'Sou da tua equipa!', 'Viva a equipa!',
    'Já não sou mau!', 'Vamos juntos!', 'Eu ajudo!'];
  function ficaBom(v) {
    v.estado = 'bom';
    const lugar = equipa.length;
    if (lugar < MAX_EQUIPA) {
      equipa.push({ d: v.d, chefe: v.chefe, x: v.x, y: v.y, vy: 0, dir: 1, fase: 0, cd: rnd(1, 2.5), braco: 0,
        salta: -1, festa: 0 });
    } else {
      // vai a correr para a casa da equipa
      equipa.push({ d: v.d, chefe: v.chefe, x: v.x, y: v.y, vy: 0, dir: -1, fase: 0, cd: 99, braco: 0,
        salta: -1, festa: 0, vaiParaCasa: true });
    }
    fala(v.chefe ? 'O chefe também é da nossa equipa!' : FRASES[Math.floor(Math.random() * FRASES.length)]);
    G.banner(v.chefe ? '👑 O chefe é bonzão! 💙' : '💙 Mais um na equipa!', 1800);
    sfx('tada');
  }

  function magoaHeroi() {
    const h = heroi;
    if (h.partes || h.invul > 0 || vitoria) return;
    h.partes = novasPartes(1); h.dmT = 0; h.vx = 0;
    sfx('desmonta');
    soltaPinos(h.x, h.y - 40, 2);
  }

  function chamaEquipa() {
    if (chamaCd > 0) return;
    const ativos = equipa.filter(function (m) { return !m.vaiParaCasa; });
    if (!ativos.length) { G.banner('💙 Desfaz um mauzão para ter equipa!', 1600); return; }
    chamaCd = 4;
    sfx('horn');
    G.banner('🤝 Equipa, agora!', 1200);
    ativos.forEach(function (m, i) {
      depois(i * 0.12, function () {
        const alvo = mauMaisPerto(m.x, 1100);
        if (!alvo) { m.salta = 0; return; }
        m.braco = 1; m.dir = alvo.x > m.x ? 1 : -1;
        lanca(m.x + m.dir * 20, m.y - 58 * (m.chefe ? 1.6 : 1), alvo.x, alvo.y - altura(alvo.d) * 0.55, 800, 'bom', m.d.tronco);
      });
    });
  }

  /* ---------- update ---------- */
  function apoio(x, yAntes, yDepois) {
    for (const p of PLAT) {
      if (x >= p.x - 8 && x <= p.x + p.w + 8 && yAntes <= p.y + 1 && yDepois >= p.y) return p.y;
    }
    return yDepois >= 0 ? 0 : null;
  }

  function updateHeroi(dt) {
    const h = heroi, I = G.input;
    h.cd = Math.max(0, h.cd - dt);
    h.invul = Math.max(0, h.invul - dt);
    h.braco = Math.max(0, h.braco - dt * 4);
    if (h.partes) {
      h.dmT += dt;
      mexePartes(h.partes, dt, h.dmT, 0.9, 0.45);
      if (h.dmT > 0.9 && !h.som) { h.som = true; sfx('monta'); }
      if (h.dmT >= 1.4) { h.partes = null; h.som = false; h.invul = 1.8; }
      return;
    }
    const mv = I.axis().x;
    h.vx += (mv * 330 - h.vx) * Math.min(1, dt * (h.noChao ? 14 : 7));
    if (Math.abs(mv) > 0.2) h.dir = mv > 0 ? 1 : -1;
    if (I.justPressed('up') || I.justPressed('jump')) {
      if (h.noChao) { h.vy = -820; h.noChao = false; h.saltos = 1; sfx('hop'); equipaSalta(); }
      else if (h.saltos < 2) { h.vy = -700; h.saltos = 2; sfx('hop'); faisca(h.x, h.y, '#fff', 5, 140); }
    }
    if (I.justPressed('fire')) atira();
    if (I.isHeld('fire') && h.cd <= 0) atira();
    if (I.justPressed('horn')) chamaEquipa();

    h.x = clamp(h.x + h.vx * dt, 30, MUNDO - 30);
    const yAntes = h.y;
    h.vy += GRAV * dt;
    let ny = h.y + h.vy * dt;
    if (h.vy >= 0) {
      const a = apoio(h.x, yAntes, ny);
      if (a !== null) { ny = a; h.vy = 0; h.noChao = true; h.saltos = 0; }
      else h.noChao = false;
    } else h.noChao = false;
    h.y = ny;
    if (h.noChao && Math.abs(h.vx) > 20) h.fase += dt * 12;
  }

  function equipaSalta() {
    equipa.forEach(function (m, i) { if (!m.vaiParaCasa) depois(0.08 + i * 0.07, function () { if (m.y >= 0) m.vy = -640; }); });
  }

  function updateMaus(dt) {
    const h = heroi;
    let noAr = tijolos.filter(function (t) { return t.dono === 'mau'; }).length;
    for (const v of maus) {
      v.t += dt; v.pisca = Math.max(0, v.pisca - dt); v.tonto = Math.max(0, v.tonto - dt);
      if (v.estado === 'desfeito') {
        mexePartes(v.partes, dt, v.t, 1.35, 0.55);
        if (v.t > 1.35 && !v.virou) {                 // volta a montar-se... já bonzão
          v.virou = true; v.d = defBom(v.chefe); sfx('monta');
          faisca(v.x, v.y - 50, '#4cc9f0', 12, 260);
        }
        if (v.t > 1.95) { v.partes = null; ficaBom(v); }
        continue;
      }
      if (v.estado !== 'mau') continue;
      const dx = h.x - v.x, adx = Math.abs(dx);
      let quer = 0;
      if (v.tonto > 0) quer = 0;
      else if (adx < 900 && adx > 330) quer = Math.sign(dx);
      else if (adx < 200) quer = -Math.sign(dx) * 0.6;
      else if (adx >= 900) {                           // passeia perto de casa
        if (Math.abs(v.alvo - v.x) < 10) v.alvo = v.casa + rnd(-160, 160);
        quer = Math.sign(v.alvo - v.x) * 0.5;
      }
      const vel = v.chefe ? 55 : 80;
      v.vx += (quer * vel - v.vx) * Math.min(1, dt * 4);
      v.x = clamp(v.x + v.vx * dt, 40, MUNDO - 40);
      if (Math.abs(v.vx) > 10) v.fase += dt * 9;
      if (adx < 900) v.dir = dx > 0 ? 1 : -1; else if (Math.abs(v.vx) > 10) v.dir = Math.sign(v.vx);
      v.braco = Math.max(0, (v.braco || 0) - dt * 3);
      // atira tijolos vermelhos, devagarinho, para dar tempo de fugir
      v.cd -= dt;
      if (v.cd <= 0 && adx < 680 && !h.partes && !vitoria && noAr < 3 && v.tonto <= 0) {
        v.cd = v.chefe ? rnd(1.8, 2.6) : rnd(2.8, 4.2);
        v.braco = 1; noAr++;
        lanca(v.x + v.dir * 20, v.y - altura(v.d) * 0.6, h.x, h.y - 40, 360, 'mau', '#d62828');
        if (v.chefe) lanca(v.x + v.dir * 20, v.y - altura(v.d) * 0.6, h.x + v.dir * 120, h.y - 40, 360, 'mau', '#d62828');
      } else if (v.cd <= 0) v.cd = 0.5;
    }
  }

  function updateEquipa(dt) {
    const h = heroi;
    let slot = 0;
    for (const m of equipa) {
      m.braco = Math.max(0, m.braco - dt * 3);
      m.festa = Math.max(0, m.festa - dt);
      let alvoX;
      if (m.vaiParaCasa) alvoX = CASA_X;
      else { alvoX = h.x - h.dir * (75 + slot * 48); slot++; }
      const dx = alvoX - m.x;
      const vel = Math.abs(dx) > 400 ? 420 : 300;
      const vx = Math.abs(dx) > 12 ? Math.sign(dx) * Math.min(vel, Math.abs(dx) * 4) : 0;
      m.x += vx * dt;
      if (Math.abs(vx) > 15) { m.fase += dt * 12; m.dir = Math.sign(vx); } else m.dir = h.x > m.x ? 1 : -1;
      if (m.vaiParaCasa && Math.abs(dx) < 30) { m.chegou = true; m.dir = 1; }
      m.vy += GRAV * dt; m.y += m.vy * dt;
      if (m.y >= 0) { m.y = 0; m.vy = 0; }
      if (vitoria && m.y >= 0 && Math.random() < dt * 2) m.vy = -rnd(400, 650);
      if (m.vaiParaCasa) continue;
      // também atiram tijolos aos mauzões que estão perto
      m.cd -= dt;
      if (m.cd <= 0) {
        m.cd = rnd(2.4, 3.4);
        const alvo = mauMaisPerto(m.x, 560);
        if (alvo && !vitoria) {
          m.braco = 1; m.dir = alvo.x > m.x ? 1 : -1;
          lanca(m.x + m.dir * 20, m.y - 58 * (m.chefe ? 1.6 : 1), alvo.x, alvo.y - altura(alvo.d) * 0.55, 700, 'bom', m.d.tronco);
        }
      }
    }
  }

  // à porta da casa da equipa só cabem uns quantos; os mais antigos entram lá para dentro
  function arrumaCasa() {
    const emCasa = equipa.filter(function (m) { return m.chegou; });
    if (emCasa.length > 8) { equipa.splice(equipa.indexOf(emCasa[0]), 1); saiuCasa++; }
  }

  function updateTijolos(dt) {
    const h = heroi;
    for (let i = tijolos.length - 1; i >= 0; i--) {
      const t = tijolos[i];
      t.vy += t.g * dt; t.x += t.vx * dt; t.y += t.vy * dt; t.rot += dt * 9 * Math.sign(t.vx || 1);
      t.vida -= dt;
      let fim = t.vida <= 0 || t.y > 0 || t.x < -50 || t.x > MUNDO + 50;
      if (!fim && t.dono === 'bom') {
        for (const v of maus) {
          if (v.estado !== 'mau') continue;
          const k = v.d.grande || 1;
          if (Math.abs(t.x - v.x) < 22 * k + 8 && t.y > v.y - altura(v.d) - 6 && t.y < v.y + 6) {
            acertaMau(v, Math.sign(t.vx) || 1); fim = true; break;
          }
        }
      } else if (!fim && t.dono === 'mau') {
        if (!h.partes && h.invul <= 0 && Math.abs(t.x - h.x) < 24 && t.y > h.y - altura(ISAAC) - 4 && t.y < h.y + 4) {
          magoaHeroi(); fim = true;
        }
      }
      if (fim) {
        if (t.y > 0 || t.vida > 0) faisca(t.x, Math.min(t.y, -4), t.cor, 4, 160);
        tijolos.splice(i, 1);
      }
    }
  }

  function updatePinos(dt) {
    const h = heroi;
    for (let i = pinos.length - 1; i >= 0; i--) {
      const p = pinos[i];
      p.t += dt;
      p.vy += GRAV * 0.8 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.y > -6) { p.y = -6; p.vy *= -0.4; p.vx *= 0.8; }
      if (p.t > 0.35 && !h.partes && Math.abs(p.x - h.x) < 34 && p.y > h.y - 95 && p.y < h.y + 10) {
        pinos.splice(i, 1); G.addStars(1); sfx('star');
      } else if (p.t > 14) pinos.splice(i, 1);
    }
  }

  S.update = function (dt) {
    tempo += dt;
    chamaCd = Math.max(0, chamaCd - dt);
    for (let i = agenda.length - 1; i >= 0; i--) {
      if (agenda[i].t <= tempo) { const a = agenda[i]; agenda.splice(i, 1); a.fn(); }
    }
    updateHeroi(dt);
    updateMaus(dt);
    updateEquipa(dt);
    arrumaCasa();
    updateTijolos(dt);
    updatePinos(dt);
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i];
      f.t += dt; f.vy += 700 * dt; f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.t > f.vida) fx.splice(i, 1);
    }
    // ronda ganha: todos os mauzões são bonzões
    if (!vitoria && maus.every(function (v) { return v.estado === 'bom'; })) {
      vitoria = { t: 0 };
      sfx('tada');
      fala('Boa! Todos os mauzões agora são bonzões!');
      G.banner('🎉 Todos na equipa! 🎉', 3000);
      G.addStars(3);
      depois(4.5, function () {
        ronda++;
        novaRonda();
        fala(ronda === 2 ? 'Cuidado! Vem aí o chefe dos mauzões!' : 'Vêm aí mais mauzões!');
        G.banner(ronda === 2 ? '👑 Vem aí o chefe! 🧱' : '🧱 Mais mauzões! 🧱', 2400);
      });
    }
    if (vitoria) {
      vitoria.t += dt;
      if (Math.random() < dt * 8) faisca(cam.x + rnd(0, vistaW()), -rnd(250, 450), null, 3, 200);
    }
    // câmara
    const alvo = clamp(heroi.x - vistaW() * 0.42, 0, Math.max(0, MUNDO - vistaW()));
    cam.x += (alvo - cam.x) * Math.min(1, dt * 5);
    if (!isFinite(cam.x)) cam.x = alvo;
  };

  /* ---------- desenho ---------- */
  function tijoloLego(c, x, y, w, h, cor) {
    c.fillStyle = cor; rr(c, x, y, w, h, 3); c.fill();
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x + 2, y + 2, w - 4, 3);
    c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(x + 2, y + h - 4, w - 4, 3);
    const n = Math.max(1, Math.round(w / 20));
    for (let i = 0; i < n; i++) {
      const sx = x + (i + 0.5) * (w / n);
      c.fillStyle = cor; rr(c, sx - 6, y - 5, 12, 6, 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(sx - 4, y - 4, 4, 2);
    }
  }

  // chapéus desenhados por cima da cabeça (e acompanham a cabeça quando se desfaz)
  function chapeu(c, d, dir, partes) {
    if (!d.chapeu) return;
    const k = d.grande || 1;
    c.save();
    c.scale(dir * k, k);
    const p = partes && partes.cabeca;
    if (p) { c.translate(p.dx, -60 + p.dy); c.rotate(p.r); c.translate(0, 60); }
    switch (d.chapeu) {
      case 'capacete':
        c.fillStyle = '#ffd60a'; c.beginPath(); c.arc(0, -66, 9.6, Math.PI, 0); c.fill();
        c.fillStyle = '#f4b400'; rr(c, -11, -67.5, 22, 3, 1.4); c.fill();
        c.fillRect(-1.2, -75.5, 2.4, 8);
        break;
      case 'cornos':
        c.fillStyle = '#d62828';
        c.beginPath(); c.moveTo(-8, -69); c.lineTo(-13, -82); c.lineTo(-3, -72); c.fill();
        c.beginPath(); c.moveTo(8, -69); c.lineTo(13, -82); c.lineTo(3, -72); c.fill();
        c.fillStyle = '#111'; c.beginPath(); c.arc(0, -65.5, 9.4, Math.PI, 0); c.fill();
        c.fillRect(-9.4, -66, 18.8, 3);
        break;
      case 'bone':
        c.fillStyle = '#1d4ed8'; c.beginPath(); c.arc(0, -66, 9, Math.PI, 0); c.fill();
        rr(c, 1, -67.5, 14, 3, 1.4); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(0, -70, 2, 0, TAU); c.fill();
        break;
      case 'coroa':
      case 'coroaBoa': {
        c.fillStyle = '#ffd166';
        c.beginPath(); c.moveTo(-9, -66); c.lineTo(-9, -79); c.lineTo(-4.5, -72); c.lineTo(0, -81);
        c.lineTo(4.5, -72); c.lineTo(9, -79); c.lineTo(9, -66); c.closePath(); c.fill();
        c.fillStyle = d.chapeu === 'coroa' ? '#d62828' : '#4cc9f0';
        c.beginPath(); c.arc(0, -70, 1.8, 0, TAU); c.fill();
        break;
      }
    }
    c.restore();
  }

  function figura(c, d, x, y, o) {
    c.save(); c.translate(x, y); c.scale(FIG, FIG);
    boneco(c, d, o);
    chapeu(c, d, o.dir || 1, o.partes);
    c.restore();
  }

  function fundo(c, t) {
    const W = G.W, H = G.H;
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#6cc4ff'); g.addColorStop(0.75, '#d5f0ff'); g.addColorStop(1, '#fff3d6');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    G.gfx.sun(c, W * 0.12, H * 0.14, Math.min(W, H) * 0.06, t);
    for (let i = 0; i < 6; i++) {
      const x = ((i * 380 - cam.x * 0.2) % (W + 400) + W + 400) % (W + 400) - 200;
      G.gfx.cloud(c, x, H * (0.12 + (i % 3) * 0.09), 34 + (i % 2) * 14, 0.85);
    }
  }

  function casaEquipa(c) {
    const x = CASA_X;
    for (let i = 0; i < 5; i++) tijoloLego(c, x - 110, -34 - i * 34, 220, 34, i % 2 ? '#4361ee' : '#4895ef');
    c.fillStyle = '#1d3557'; rr(c, x - 26, -84, 52, 84, 6); c.fill();
    c.fillStyle = '#ffd166'; c.beginPath(); c.arc(x + 14, -42, 4, 0, TAU); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(x, -175); c.lineTo(x, -250); c.stroke();
    c.fillStyle = '#4cc9f0';
    c.beginPath(); c.moveTo(x, -250); c.lineTo(x + 50, -236); c.lineTo(x, -222); c.fill();
    c.font = 'bold 28px sans-serif'; c.textAlign = 'center'; c.fillText('💙', x, -110);
  }

  function forte(c, t) {
    const x = FORTE_X, bom = !!vitoria;
    const cor1 = bom ? '#4361ee' : '#2b2d42', cor2 = bom ? '#4895ef' : '#3d405b';
    for (let i = 0; i < 7; i++) tijoloLego(c, x - 120, -34 - i * 34, 240, 34, i % 2 ? cor1 : cor2);
    for (let k = 0; k < 4; k++) tijoloLego(c, x - 120 + k * 66, -272, 42, 34, cor1);
    c.fillStyle = '#111'; rr(c, x - 34, -100, 68, 100, 30); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(x, -278); c.lineTo(x, -360); c.stroke();
    c.fillStyle = bom ? '#4cc9f0' : '#d62828';
    const o = Math.sin(t * 4) * 5;
    c.beginPath(); c.moveTo(x, -360); c.lineTo(x + 56, -346 + o); c.lineTo(x, -330); c.fill();
  }

  function cena(c, t) {
    const x0 = cam.x - 200, x1 = cam.x + vistaW() + 200;
    // torres de tijolos ao fundo: mais pequenas, desmaiadas e a andar mais devagar
    c.globalAlpha = 0.3;
    for (const tr of TORRES) {
      const tx = tr.x + cam.x * 0.45;
      if (tx + 100 < x0 || tx - 100 > x1) continue;
      let y = 0;
      for (const b of tr.bl) { y -= 22; tijoloLego(c, tx - b.w * 0.36 + b.dx, y, b.w * 0.72, 22, b.cor); }
    }
    c.globalAlpha = 1;
    // o chão é uma placa verde de Lego, com pinos
    c.fillStyle = '#4caf50'; c.fillRect(x0, 0, x1 - x0, 900);
    c.fillStyle = '#3e9142'; c.fillRect(x0, 0, x1 - x0, 6);
    for (let x = Math.floor(x0 / 30) * 30; x < x1; x += 30) {
      for (let r = 0; r < 4; r++) {
        c.fillStyle = r % 2 ? '#43a047' : '#5cbf60';
        c.beginPath(); c.ellipse(x + (r % 2) * 15, 22 + r * 26, 8, 4, 0, 0, TAU); c.fill();
      }
    }
    if (CASA_X + 300 > x0 && CASA_X - 300 < x1) casaEquipa(c);
    if (FORTE_X + 300 > x0 && FORTE_X - 300 < x1) forte(c, t);
    for (const p of PLAT) {
      if (p.x + p.w < x0 || p.x > x1) continue;
      tijoloLego(c, p.x, p.y, p.w, 26, '#ff9f1c');
    }
  }

  function desenhaMau(c, v, t) {
    if (v.estado === 'bom') return;
    const partes = v.partes;
    const tremer = v.estado === 'desfeito' && v.t > 1.05 && v.t < 1.35 ? Math.sin(t * 60) * 2 : 0;
    c.save();
    if (v.pisca > 0) c.globalAlpha = 0.55;
    figura(c, v.d, v.x + tremer, v.y, {
      t: t, dir: v.dir, fase: v.fase, anda: Math.abs(v.vx) > 10 && !partes, braco: v.braco || 0,
      tonto: v.tonto > 0 && !partes, partes: partes
    });
    c.restore();
    // barrinha de energia por cima (só enquanto é mau)
    if (v.estado === 'mau' && v.hp < v.hpMax) {
      const k = v.d.grande || 1, w = 44 * k, y = v.y - altura(v.d) - 34 * k;
      c.fillStyle = 'rgba(0,0,0,.35)'; rr(c, v.x - w / 2, y, w, 8, 4); c.fill();
      c.fillStyle = '#ff5d5d'; rr(c, v.x - w / 2, y, w * v.hp / v.hpMax, 8, 4); c.fill();
    }
  }

  function desenhaEquipa(c, t) {
    for (const m of equipa) {
      if (m.x < cam.x - 150 || m.x > cam.x + vistaW() + 150) continue;
      if (m.chegou) {                      // em casa: ficam à porta a acenar
        figura(c, m.d, m.x + ((equipa.indexOf(m) % 5) - 2) * 26, 0, { t: t, dir: 1, fase: 0, cima: Math.sin(t * 4 + m.x) > 0 });
        continue;
      }
      figura(c, m.d, m.x, m.y, {
        t: t, dir: m.dir, fase: m.fase, anda: m.y >= 0 && Math.abs(m.x - (heroi.x)) > 70, braco: m.braco,
        noAr: m.y < -2, cima: !!vitoria
      });
    }
  }

  function desenhaHeroi(c, t) {
    const h = heroi;
    if (h.invul > 0 && !h.partes && Math.floor(t * 12) % 2) return;
    figura(c, ISAAC, h.x, h.y, {
      t: t, dir: h.dir, fase: h.fase, anda: h.noChao && Math.abs(h.vx) > 20, braco: h.braco,
      noAr: !h.noChao, partes: h.partes, cima: !!vitoria && h.noChao
    });
  }

  function desenhaTijolo(c, tr) {
    c.save(); c.translate(tr.x, tr.y); c.rotate(tr.rot);
    c.fillStyle = tr.cor; rr(c, -11, -7, 22, 14, 2.5); c.fill();
    c.fillRect(-8, -11, 6, 5); c.fillRect(2, -11, 6, 5);
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(-9, -5, 18, 3);
    c.restore();
  }

  function hud(c, t) {
    const W = G.W;
    // fila dos mauzões desta ronda: cara de mau (cornos) ou cara de bonzão (boné)
    const n = maus.length, tam = clamp((W - 150) / Math.max(1, n), 14, 40);
    let x = 16 + tam / 2;
    const y = 16 + tam * 0.1;
    c.fillStyle = 'rgba(255,255,255,.55)'; rr(c, 8, 8, n * tam + 16, tam * 1.2 + 4, 12); c.fill();
    for (const v of maus) {
      const bom = v.estado === 'bom';
      c.save(); c.globalAlpha = bom ? 1 : 0.9;
      G.legoCabecinha(c, v.d, x, y + tam * 0.1, tam / 26, t);
      c.restore();
      c.save(); c.translate(x, y + tam * 0.1); c.scale(tam / 26, tam / 26); c.translate(0, 60);
      chapeu(c, v.d, 1, null);
      c.restore();
      x += tam;
    }
    // equipa e estrelas por baixo
    const nEq = equipa.length + saiuCasa;
    c.font = 'bold 26px "Comic Sans MS", sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle';
    const ly = 8 + tam * 1.2 + 26;
    c.fillStyle = 'rgba(255,255,255,.55)'; rr(c, 8, ly - 18, 210, 36, 12); c.fill();
    c.fillStyle = '#1d3557';
    c.fillText('💙 ' + nEq + '   ⭐ ' + G.state.stars, 18, ly + 1);
    // o botão 🤝 da equipa a encher outra vez
    if (chamaCd > 0) {
      c.fillStyle = 'rgba(29,53,87,.35)';
      rr(c, 146, ly + 22, 64 * (1 - chamaCd / 4), 6, 3); c.fill();
    }
  }

  // setas nas bordas a apontar para o mauzão mais perto que está fora do ecrã
  function setas(c, t) {
    const sc = escala();
    let esq = null, dir = null;
    for (const v of maus) {
      if (v.estado !== 'mau') continue;
      if (v.x < cam.x + 10) { if (!esq || v.x > esq.x) esq = v; }
      else if (v.x > cam.x + vistaW() - 10) { if (!dir || v.x < dir.x) dir = v; }
    }
    const y = chaoPx() - 150 * sc;
    for (const [v, lado] of [[esq, -1], [dir, 1]]) {
      if (!v) continue;
      const x = lado < 0 ? 34 : G.W - 34;
      const b = Math.sin(t * 6) * 5 * lado;
      c.save(); c.translate(x + b, y);
      c.fillStyle = 'rgba(214,40,40,.85)';
      c.beginPath(); c.moveTo(lado * 22, 0); c.lineTo(-lado * 10, -20); c.lineTo(-lado * 10, 20); c.fill();
      c.restore();
      G.legoCabecinha(c, v.d, x - lado * 4, y - 58, 1.9, t);
      c.save(); c.translate(x - lado * 4, y - 58); c.scale(1.9, 1.9); c.translate(0, 60); chapeu(c, v.d, 1, null); c.restore();
    }
  }

  S.draw = function (c, t) {
    const sc = escala(), cp = chaoPx();
    fundo(c, t);
    c.save();
    c.translate(-cam.x * sc, cp);
    c.scale(sc, sc);
    cena(c, t);
    for (const p of pinos) {
      c.fillStyle = '#ffd166'; c.beginPath(); c.ellipse(p.x, p.y, 9, 6, 0, 0, TAU); c.fill();
      c.fillStyle = '#f4a100'; c.fillRect(p.x - 6, p.y - 1, 12, 5);
      c.fillStyle = '#fff3b0'; c.beginPath(); c.ellipse(p.x - 2, p.y - 2, 3, 2, 0, 0, TAU); c.fill();
    }
    for (const v of maus) if (v.x > cam.x - 150 && v.x < cam.x + vistaW() + 150) desenhaMau(c, v, t);
    desenhaEquipa(c, t);
    desenhaHeroi(c, t);
    for (const tr of tijolos) desenhaTijolo(c, tr);
    for (const f of fx) {
      c.globalAlpha = Math.max(0, 1 - f.t / f.vida);
      c.fillStyle = f.cor; rr(c, f.x - f.tam / 2, f.y - f.tam / 3, f.tam, f.tam * 0.66, 1.5); c.fill();
    }
    c.globalAlpha = 1;
    c.restore();
    setas(c, t);
    hud(c, t);
  };

  G.scenes = G.scenes || {};
  G.scenes.mauzoes = S;
  // para testar com piloto automático no browser
  S.estado = function () { return { heroi: heroi, maus: maus, equipa: equipa, ronda: ronda, vitoria: vitoria }; };
})();
