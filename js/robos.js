/* Cena — OS ROBÔS: o Spidey contra o Venom, ditada pelo Isaac.

   "Nós somos o Spidey e estamos num robô e temos de atirar teias ao Venom, e o Venom
   está num robô, e não há forma de destruir os robôs, e temos de lutar com as nossas
   armas no robô."

   Como ficou:
   - Luta um contra um numa rua da cidade, à noite. Os dois robôs são INDESTRUTÍVEIS:
     quando levam um toque fazem "clang", saltam faíscas e mais nada.
   - As armas do robô do Spidey: o canhão de TEIAS (🕸️), o SOCO do braço grande (👊)
     e a REDE GIGANTE (💥), que carrega com as teias que acertam.
   - Cada teia que acerta fica colada no robô do Venom (vê-se no próprio robô e na
     barra). Com o robô cheio de teias o Venom fica EMBRULHADO e ganha-se a ronda; na
     ronda seguinte ele rasga as teias e volta mais rápido. O Venom vai rasgando as
     teias aos poucos, por isso é preciso não parar.
   - O Venom atira bolas de GOSMA e chicoteia com os tentáculos; também salta por cima
     das teias e defende-se com os braços. A gosma suja o nosso robô: com gosma a mais
     ficamos COLADOS uns segundos (abana-se com qualquer botão para sair mais depressa).
     As nossas teias também apanham as bolas de gosma no ar.
   - Não há derrota: ficar colado só dá tempo ao Venom para rasgar teias. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  const ARENA = 1900;
  const GRAV = 2100, JUMPV = 980;
  const VEL = 300;
  const TEIA_V = 820, REDE_V = 620;
  const SEPARA = 190;           // os robôs não se atravessam
  const ALTO = 240;             // altura do robô

  let p, v, tiros, gotas, sparks, puffs, textos, camX, fase, faseT, ronda, carga, superAvisado, venc;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function h01(n) { const s = Math.sin(n * 127.1) * 43758.5; return s - Math.floor(s); }
  function vscale() { return Math.min(1, G.H / 640, G.W / 720); }
  function vw() { return G.W / vscale(); }
  function vh() { return G.H / vscale(); }
  // ao alto há duas filas de botões em baixo: o chão fica por cima das duas
  function chaoY() {
    const reserva = G.W < 560 && G.H > G.W ? 236 : 122;
    return Math.min(vh() * 0.86, Math.max(vh() * 0.5, (G.H - reserva) / vscale()));
  }
  function sy(alt) { return chaoY() - alt; }
  function fala(t) { if (G.audio.fala) G.audio.fala(t); }

  S.enter = function () {
    p = { x: 620, alt: 0, vy: 0, vx: 0, dir: 1, walk: 0, cdTeia: 0, cdSoco: 0, soco: 0, gosma: 0, colado: 0, pisca: 0, tiro: 0 };
    v = { x: 1200, alt: 0, vy: 0, vx: 0, dir: -1, walk: 0, teias: 0, cd: 1.6, tent: 0, lat: 0, reage: 0, bloq: 0, pisca: 0,
      modo: 'longe', modoT: 3, ri: 0 };
    tiros = []; gotas = []; sparks = []; puffs = []; textos = [];
    camX = 0; fase = 'intro'; faseT = 0; ronda = 1; carga = 0; superAvisado = false; venc = 0;
    superBotao(false);
    G.banner('Spidey, ao robô! 🕷️🤖', 2200);
    fala('Spidey, ao robô! Atira teias ao Venom!');
  };

  // o botão 💥 da rede gigante só aparece quando está carregada
  let superVisivel = false;
  function superBotao(on) {
    if (on === superVisivel) return;
    superVisivel = on;
    document.body.classList.toggle('robos-super', on);
  }

  function spark(x, alt, n, col) {
    for (let i = 0; i < n; i++) sparks.push({ x: x, alt: alt, vx: rnd(-220, 220), vy: rnd(60, 340), t: 0, life: rnd(0.3, 0.7), col: col || '#ffd166' });
  }
  function puff(x, alt, n, col) {
    for (let i = 0; i < (n || 8); i++) puffs.push({ x: x + rnd(-24, 24), alt: alt + rnd(-10, 30), r: rnd(12, 28), t: 0, life: rnd(0.4, 0.8), col: col || '#ffffff' });
  }
  function texto(txt, x, alt, cor) { textos.push({ txt: txt, x: x, alt: alt, t: 0, cor: cor || '#ffd60a' }); }

  // nível da ronda: o Venom fica mais rápido, ataca mais e rasga teias mais depressa
  function nivel() { return Math.min(6, ronda - 1); }

  function poeTeias(n, x, alt) {
    v.teias = Math.min(100, v.teias + n);
    venc += n;
    while (venc >= 25) { venc -= 25; G.addStars(1); }
    v.pisca = 0.25;
    spark(x, alt, 6, '#ffffff');
    if (v.teias >= 100 && fase === 'luta') embrulha();
  }

  function embrulha() {
    fase = 'embrulhado'; faseT = 0;
    tiros = []; gotas = [];
    G.addStars(8 + ronda * 2);
    G.audio.sfx('tada'); G.shake = 0.4;
    spark(v.x, 140, 30, '#ffffff');
    G.banner('O Venom ficou embrulhado! 🕸️', 3000);
    fala('Boa! O Venom ficou todo embrulhado nas teias!');
  }

  function sujaRobo(n) {
    if (p.colado > 0 || fase !== 'luta') return;
    p.gosma = Math.min(100, p.gosma + n);
    p.pisca = 0.3;
    G.audio.sfx('gulp'); G.shake = Math.max(G.shake, 0.18);
    puff(p.x, 150, 6, '#2b2440');
    if (p.gosma >= 100) {
      p.colado = 2.6; p.gosma = 0;
      v.teias = Math.max(0, v.teias - 25);      // enquanto estamos colados ele rasga teias
      G.banner('Ficaste colado! Abana-te! ◀ ▶', 2200);
      G.audio.sfx('brrr');
    }
  }

  function atiraTeia(rede) {
    const boca = p.x + p.dir * 92, a = p.alt + 150;
    tiros.push({ x: boca, x0: boca, alt: a, dir: p.dir, rede: !!rede, t: 0 });
    p.tiro = 0.18;
    G.audio.sfx(rede ? 'whoosh' : 'teia');
  }

  function soco() {
    p.soco = 0.3; p.cdSoco = 0.55;
    G.audio.sfx('whoosh');
    const dx = (v.x - p.x) * p.dir;
    if (dx > 0 && dx < 260 && Math.abs(v.alt - p.alt) < 160) {
      const def = v.bloq > 0;
      poeTeias(def ? 2 : 7, v.x - p.dir * 60, v.alt + 140);
      v.vx = p.dir * (def ? 260 : 620);
      if (!def && v.alt <= 0) v.vy = 320;
      G.audio.sfx(def ? 'escudo' : 'smash'); G.shake = Math.max(G.shake, def ? 0.15 : 0.35);
      texto(def ? 'CLANG!' : 'POW!', v.x - p.dir * 40, v.alt + 230, def ? '#dbe4ff' : '#ffd60a');
      spark(v.x - p.dir * 60, v.alt + 140, 12, '#ffd166');
    }
  }

  /* ---------- atualização ---------- */
  S.update = function (dt, t) {
    const inp = G.input;
    faseT += dt;
    p.pisca = Math.max(0, p.pisca - dt); v.pisca = Math.max(0, v.pisca - dt);
    p.soco = Math.max(0, p.soco - dt); p.tiro = Math.max(0, p.tiro - dt);
    p.cdTeia = Math.max(0, p.cdTeia - dt); p.cdSoco = Math.max(0, p.cdSoco - dt);

    if (fase === 'intro' && faseT > 1.6) { fase = 'luta'; faseT = 0; }

    if (fase === 'embrulhado') {
      v.vx *= Math.pow(0.02, dt);
      if (faseT > 3.6) {
        // o Venom rasga as teias todas e a luta recomeça, mais difícil
        ronda++;
        fase = 'luta'; faseT = 0;
        v.teias = 0; venc = 0; v.cd = 1.4; v.tent = 0; v.lat = 0;
        G.audio.sfx('quebra'); G.audio.sfx('roar'); G.shake = 0.35;
        for (let k = 0; k < 18; k++) sparks.push({ x: v.x, alt: rnd(40, 220), vx: rnd(-420, 420), vy: rnd(100, 420), t: 0, life: rnd(0.5, 1), col: '#ffffff' });
        G.banner('O Venom soltou-se! Ronda ' + ronda + ' 🤖', 2400);
      }
    }

    // ---- o nosso robô ----
    const podeMexer = fase === 'luta' && p.colado <= 0;
    if (p.colado > 0) {
      p.colado -= dt;
      // abanar (qualquer botão) solta mais depressa
      if (inp.justPressed('fire') || inp.justPressed('horn') || inp.justPressed('left') || inp.justPressed('right') || inp.justPressed('jump') || inp.justPressed('up')) {
        p.colado -= 0.32; G.audio.sfx('boing'); puff(p.x, 120, 3, '#2b2440');
      }
      if (p.colado <= 0) { G.audio.sfx('pop'); puff(p.x, 120, 10, '#2b2440'); }
    }
    let mv = 0;
    if (podeMexer) {
      if (inp.isHeld('left')) mv -= 1;
      if (inp.isHeld('right')) mv += 1;
      if (mv === 0) { const ax = inp.axis(); mv = Math.abs(ax.x) > 0.25 ? Math.sign(ax.x) : 0; }
      if ((inp.justPressed('jump') || inp.justPressed('up')) && p.alt <= 0) { p.vy = JUMPV; G.audio.sfx('hop'); puff(p.x, 0, 6, '#ffb703'); }
      if ((inp.justPressed('fire') || inp.isHeld('fire')) && p.cdTeia <= 0) { p.cdTeia = 0.3; atiraTeia(false); }
      if (inp.justPressed('horn') && p.cdSoco <= 0) soco();
      if ((inp.justPressed('door') || inp.justPressed('down')) && carga >= 1) {
        carga = 0; superAvisado = false; superBotao(false);
        atiraTeia(true);
        G.banner('REDE GIGANTE! 💥', 1500);
      }
    }
    const lento = 1 - p.gosma / 100 * 0.45;      // a gosma pesa
    p.x += mv * VEL * lento * dt;
    if (mv !== 0) p.walk += dt * 8;

    // ---- física dos dois ----
    for (const r of [p, v]) {
      r.x += r.vx * dt; r.vx *= Math.pow(0.04, dt);
      r.vy -= GRAV * dt; r.alt += r.vy * dt;
      if (r.alt <= 0) {
        if (r.vy < -700) { G.shake = Math.max(G.shake, 0.15); puff(r.x, 0, 5, '#9aa0b5'); }
        r.alt = 0; r.vy = 0;
      }
      r.x = Math.max(110, Math.min(ARENA - 110, r.x));
    }
    // não se atravessam (se um salta por cima, passa)
    const dd = v.x - p.x;
    if (Math.abs(dd) < SEPARA && Math.abs(v.alt - p.alt) < 170) {
      const s = Math.sign(dd) || 1, falta = (SEPARA - Math.abs(dd)) / 2;
      p.x -= s * falta; v.x += s * falta;
      if (p.x < 110) { v.x += 110 - p.x; p.x = 110; }
      if (v.x > ARENA - 110) { p.x -= v.x - (ARENA - 110); v.x = ARENA - 110; }
      if (v.x < 110) { p.x += 110 - v.x; v.x = 110; }
      if (p.x > ARENA - 110) { v.x -= p.x - (ARENA - 110); p.x = ARENA - 110; }
    }
    p.dir = v.x >= p.x ? 1 : -1;
    v.dir = -p.dir;

    // ---- teias a voar ----
    for (let i = tiros.length - 1; i >= 0; i--) {
      const s = tiros[i];
      s.t += dt;
      s.x += s.dir * (s.rede ? REDE_V : TEIA_V) * dt;
      if (Math.abs(s.x - s.x0) > 980 || s.x < -50 || s.x > ARENA + 50) { tiros.splice(i, 1); continue; }
      // as teias apanham as bolas de gosma no ar
      let apanhou = false;
      for (let j = gotas.length - 1; j >= 0; j--) {
        const g = gotas[j];
        if (Math.abs(g.x - s.x) < (s.rede ? 70 : 34) && Math.abs(g.alt - s.alt) < (s.rede ? 80 : 36)) {
          puff(g.x, g.alt, 6, '#ffffff'); gotas.splice(j, 1); G.audio.sfx('pop');
          texto('PLOFT!', g.x, g.alt + 40, '#ffffff');
          if (!s.rede) { apanhou = true; break; }
        }
      }
      if (apanhou) { tiros.splice(i, 1); continue; }
      if (fase !== 'luta') continue;
      const larg = s.rede ? 115 : 72;
      if (Math.abs(s.x - v.x) < larg && s.alt > v.alt - (s.rede ? 40 : 0) && s.alt < v.alt + ALTO + (s.rede ? 40 : 0)) {
        const frente = (v.x - s.x) * s.dir > -20;
        if (v.bloq > 0 && frente && !s.rede) {
          poeTeias(1.5, s.x, s.alt);
          G.audio.sfx('escudo'); texto('CLANG!', v.x, v.alt + 240, '#dbe4ff');
        } else {
          poeTeias(s.rede ? 26 : 5.5, s.x, s.alt);
          carga = Math.min(1, carga + (s.rede ? 0 : 0.11));
          G.audio.sfx(s.rede ? 'trovao' : 'pop');
          if (s.rede) { G.shake = 0.4; texto('ZAP!', v.x, v.alt + 250, '#ffffff'); v.vx = s.dir * 300; }
        }
        tiros.splice(i, 1);
        if (fase !== 'luta') break;     // ficou embrulhado: a lista de teias foi limpa
      }
    }
    if (carga >= 1 && !superAvisado && fase === 'luta') {
      superAvisado = true;
      G.banner('Rede gigante pronta! 💥', 1800);
      G.audio.sfx('suit');
    }
    superBotao(carga >= 1 && fase !== 'intro');

    // ---- o Venom ----
    v.reage = Math.max(0, v.reage - dt);
    v.bloq = Math.max(0, v.bloq - dt);
    v.ri = Math.max(0, v.ri - dt);
    if (fase === 'luta') {
      const n = nivel();
      const preso = v.teias / 100;                  // as teias pesam-lhe
      const rapido = (1 + n * 0.08) * (1 - preso * 0.55);
      // rasga as teias aos poucos
      v.teias = Math.max(0, v.teias - (3.8 + n * 0.5) * dt);

      v.modoT -= dt;
      if (v.modoT <= 0) { v.modo = v.modo === 'perto' ? 'longe' : 'perto'; v.modoT = rnd(2.4, 4.2); }
      const dist = Math.abs(v.x - p.x);
      const quer = v.modo === 'perto' ? 220 : 520;
      let anda = 0;
      if (v.tent <= 0 && v.lat <= 0) {
        if (dist > quer + 40) anda = 1;     // aproxima-se
        else if (dist < quer - 60 && v.modo === 'longe') anda = -1;   // afasta-se
      }
      // "anda" em coordenadas do Venom: +1 = para a frente (para o Spidey)
      v.x += anda * v.dir * 230 * rapido * dt;
      if (anda !== 0) v.walk += dt * 7;

      // ESQUIVAR e DEFENDER as teias que vêm a caminho
      if (v.reage <= 0) {
        for (const s of tiros) {
          const vem = (v.x - s.x) * s.dir;
          if (vem < 60 || vem > 330) continue;
          const pSalta = Math.min(0.6, 0.28 + n * 0.06), pBloq = Math.min(0.35, 0.18 + n * 0.04);
          const r = Math.random();
          if (r < pSalta && v.alt <= 0) { v.vy = JUMPV * (0.95 + Math.random() * 0.12); G.audio.sfx('hop'); puff(v.x, 0, 6, '#7b2cbf'); }
          else if (r < pSalta + pBloq && !s.rede) { v.bloq = 0.85; }
          v.reage = rnd(0.9, 1.4) - n * 0.06;
          break;
        }
      }
      // às vezes salta para cima de nós por gosto
      if (v.alt <= 0 && v.tent <= 0 && Math.random() < dt * (0.12 + n * 0.03)) { v.vy = JUMPV * 0.9; v.vx = v.dir * 300; }

      // ataques
      v.cd -= dt;
      if (v.tent > 0) {                       // a preparar o chicote de tentáculos
        v.tent -= dt;
        if (v.tent <= 0) {
          v.lat = 0.32;
          G.audio.sfx('whoosh');
          if (Math.abs(v.x - p.x) < 330 && p.alt < 170) {
            sujaRobo(16 + n * 2);
            p.vx = v.dir * 520;
            texto('SPLAT!', p.x, p.alt + 230, '#c77dff');
          }
        }
      }
      v.lat = Math.max(0, v.lat - dt);
      if (v.cd <= 0 && v.tent <= 0 && v.lat <= 0 && v.bloq <= 0) {
        v.cd = Math.max(0.7, rnd(1.3, 1.9) - n * 0.12) / (1 - preso * 0.4);
        if (dist < 300) { v.tent = 0.45; v.ri = 0.6; }
        else {
          // bola de gosma em arco, apontada a onde estamos
          const T = rnd(0.75, 1.0);
          const x0 = v.x + v.dir * 80, a0 = v.alt + 170;
          const alvoX = p.x + rnd(-40, 40), alvoA = p.alt + 120;
          gotas.push({ x: x0, alt: a0, vx: (alvoX - x0) / T, vy: (alvoA - a0) / T + 0.5 * 1400 * T, t: 0 });
          G.audio.sfx('gulp');
          if (n >= 2 && Math.random() < 0.35) {   // às vezes duas seguidas
            const T2 = T + 0.25;
            gotas.push({ x: x0, alt: a0, vx: (alvoX + 120 * -v.dir - x0) / T2, vy: (alvoA - a0) / T2 + 0.5 * 1400 * T2, t: 0 });
          }
        }
      }
    } else {
      v.vx *= Math.pow(0.2, dt);
    }

    // ---- bolas de gosma ----
    for (let i = gotas.length - 1; i >= 0; i--) {
      const g = gotas[i];
      g.t += dt; g.x += g.vx * dt; g.vy -= 1400 * dt; g.alt += g.vy * dt;
      if (g.alt <= 0) { puff(g.x, 4, 5, '#2b2440'); gotas.splice(i, 1); continue; }
      if (Math.abs(g.x - p.x) < 80 && g.alt > p.alt && g.alt < p.alt + ALTO) {
        puff(g.x, g.alt, 7, '#2b2440');
        gotas.splice(i, 1);
        sujaRobo(14 + nivel() * 2);
        texto('SPLAT!', p.x, p.alt + 230, '#c77dff');
      }
    }

    // a gosma sai aos poucos (o robô tem limpa-vidros)
    if (p.colado <= 0) p.gosma = Math.max(0, p.gosma - 5 * dt);

    // ---- câmara: o meio dos dois ----
    const W = vw(), meio = (p.x + v.x) / 2;
    if (W >= ARENA) camX = (ARENA - W) / 2;
    else camX += (Math.max(0, Math.min(ARENA - W, meio - W / 2)) - camX) * Math.min(1, dt * 5);

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.t += dt; s.x += s.vx * dt; s.alt += s.vy * dt; s.vy -= 700 * dt;
      if (s.t > s.life) sparks.splice(i, 1);
    }
    for (let i = puffs.length - 1; i >= 0; i--) {
      const q = puffs[i];
      q.t += dt; q.alt += 26 * dt; q.r += 22 * dt;
      if (q.t > q.life) puffs.splice(i, 1);
    }
    for (let i = textos.length - 1; i >= 0; i--) {
      const q = textos[i];
      q.t += dt; q.alt += 50 * dt;
      if (q.t > 0.8) textos.splice(i, 1);
    }
  };

  /* ---------- desenhos ---------- */
  function teiaRiscos(c, r, n, cor) {          // teia redonda (raios + anéis)
    c.strokeStyle = cor || '#ffffff'; c.lineWidth = Math.max(1.2, r * 0.09);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); c.stroke();
    }
    for (const q of [0.45, 0.85]) {
      c.beginPath();
      for (let k = 0; k <= n; k++) {
        const a = (k / n) * TAU;
        c.lineTo(Math.cos(a) * r * q, Math.sin(a) * r * q);
      }
      c.stroke();
    }
  }

  function caraSpidey(c, r) {
    c.fillStyle = '#e63946'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip();
    c.globalAlpha = 0.55; teiaRiscos(c, r * 1.1, 8, '#22223b'); c.restore();
    c.fillStyle = '#ffffff'; c.strokeStyle = '#22223b'; c.lineWidth = r * 0.1;
    for (const s of [-1, 1]) {
      c.beginPath();
      c.ellipse(s * r * 0.38, -r * 0.08, r * 0.3, r * 0.4, s * 0.5, 0, TAU);
      c.fill(); c.stroke();
    }
  }

  function caraVenom(c, r, t, ri) {
    c.fillStyle = '#14121f'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.fillStyle = 'rgba(140,110,200,.45)'; c.beginPath(); c.arc(-r * 0.35, -r * 0.45, r * 0.3, 0, TAU); c.fill();
    c.fillStyle = '#ffffff';
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(s * r * 0.12, -r * 0.2);
      c.quadraticCurveTo(s * r * 0.7, -r * 0.75, s * r * 0.85, -r * 0.05);
      c.quadraticCurveTo(s * r * 0.5, -r * 0.05, s * r * 0.12, -r * 0.2);
      c.fill();
    }
    // sorriso grande com dentes (faz caretas, mas é um boneco)
    const boca = ri > 0 ? 0.42 : 0.3;
    c.fillStyle = '#ffffff';
    c.beginPath(); c.ellipse(0, r * 0.38, r * 0.62, r * boca, 0, 0, Math.PI); c.fill();
    c.strokeStyle = '#14121f'; c.lineWidth = r * 0.06;
    for (let k = -3; k <= 3; k++) {
      c.beginPath(); c.moveTo(k * r * 0.17, r * 0.38); c.lineTo(k * r * 0.17, r * (0.38 + boca * 0.8)); c.stroke();
    }
    if (ri > 0) {
      c.fillStyle = '#ff5d8f';
      c.beginPath(); c.ellipse(r * 0.1, r * 0.72 + Math.sin(t * 14) * r * 0.06, r * 0.16, r * 0.3, 0.3, 0, TAU); c.fill();
    }
  }

  // um robô (base nos pés, virado para a direita). o = { spidey, walk, soco, tiro, tent, lat, bloq, gosma, colado, teias, t }
  function robo(c, t, o) {
    const sp = o.spidey;
    const corpo = sp ? '#e63946' : '#1b1930', lado = sp ? '#1d4ed8' : '#2e2650', metal = sp ? '#8d99ae' : '#4a4466';
    const w = o.walk || 0;
    const l1 = Math.sin(w) * 16, l2 = -Math.sin(w) * 16;
    c.lineCap = 'round'; c.lineJoin = 'round';
    // pernas
    for (const [lx, pass] of [[-30, l1], [30, l2]]) {
      c.strokeStyle = metal; c.lineWidth = 26;
      c.beginPath(); c.moveTo(lx, -84); c.lineTo(lx + pass * 0.4, -44); c.lineTo(lx + pass, -12); c.stroke();
      c.fillStyle = lado; G.gfx.rr(c, lx + pass - 26, -18, 52, 18, 7); c.fill();
      if (!sp) { c.strokeStyle = '#9d8ad6'; c.lineWidth = 3; c.stroke(); }
      c.fillStyle = '#22223b'; c.beginPath(); c.arc(lx + pass * 0.4, -44, 11, 0, TAU); c.fill();
    }
    // braço de trás (o soco no Spidey, tentáculos no Venom)
    if (sp) braco(c, t, o, false); else tentaculos(c, t, o, false);
    // corpo
    G.gfx.rr(c, -64, -178, 128, 100, 22); c.fillStyle = corpo; c.fill();
    // o robô preto do Venom leva rebordo claro, senão desaparecia nos prédios à noite
    c.strokeStyle = sp ? 'rgba(0,0,0,.35)' : '#9d8ad6'; c.lineWidth = sp ? 4 : 5; c.stroke();
    c.fillStyle = lado; G.gfx.rr(c, -64, -126, 128, 20, 8); c.fill();
    // símbolo de aranha no peito
    c.save(); c.translate(0, -146);
    c.fillStyle = sp ? '#22223b' : '#ffffff'; c.strokeStyle = c.fillStyle; c.lineWidth = 4;
    c.beginPath(); c.ellipse(0, 0, 9, 13, 0, 0, TAU); c.fill();
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
      const a = -0.9 + k * 0.6;
      c.beginPath(); c.moveTo(0, -4 + k * 3);
      c.quadraticCurveTo(s * 18, -10 + k * 6, s * 26, -4 + k * 9 + (k > 1 ? 6 : -6) * Math.sign(a)); c.stroke();
    }
    c.restore();
    // cabine de vidro com o piloto lá dentro
    c.fillStyle = 'rgba(160,220,255,.35)';
    c.beginPath(); c.arc(0, -196, 46, Math.PI, 0); c.lineTo(46, -178); c.lineTo(-46, -178); c.closePath(); c.fill();
    c.save(); c.translate(6, -206);
    if (sp) caraSpidey(c, 26); else caraVenom(c, 28, t, o.ri);
    c.restore();
    c.strokeStyle = metal; c.lineWidth = 6;
    c.beginPath(); c.arc(0, -196, 46, Math.PI, 0); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.55)';
    c.beginPath(); c.ellipse(-20, -218, 10, 6, -0.6, 0, TAU); c.fill();
    // antena com luz
    c.strokeStyle = metal; c.lineWidth = 4;
    c.beginPath(); c.moveTo(-30, -232); c.lineTo(-38, -258); c.stroke();
    c.fillStyle = Math.sin(t * 6) > 0 ? (sp ? '#4cc9f0' : '#c77dff') : '#ffffff';
    c.beginPath(); c.arc(-38, -260, 6, 0, TAU); c.fill();
    // braço da frente
    if (sp) canhao(c, t, o); else tentaculos(c, t, o, true);
    // o Venom a defender-se: braços cruzados à frente da cabine
    if (!sp && o.bloq > 0) {
      c.strokeStyle = '#2e2650'; c.lineWidth = 22;
      c.beginPath(); c.moveTo(40, -170); c.lineTo(84, -120); c.stroke();
      c.beginPath(); c.moveTo(40, -120); c.lineTo(84, -170); c.stroke();
      c.strokeStyle = 'rgba(199,125,255,.8)'; c.lineWidth = 4;
      c.beginPath(); c.arc(62, -146, 46, -1.2, 1.2); c.stroke();
    }
  }

  function braco(c, t, o, frente) {
    void frente;
    const vai = o.soco > 0 ? Math.sin((1 - o.soco / 0.3) * Math.PI) : 0;
    const ox = -46 + vai * 150, oy = -150 + vai * 6;
    c.strokeStyle = '#8d99ae'; c.lineWidth = 20;
    c.beginPath(); c.moveTo(-40, -160); c.lineTo(ox - 10, oy); c.stroke();
    // punho grande vermelho
    c.fillStyle = '#c1121f'; G.gfx.rr(c, ox - 26, oy - 24, 52, 48, 14); c.fill();
    c.strokeStyle = '#22223b'; c.lineWidth = 3;
    for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(ox + 14, oy - 16 + k * 14); c.lineTo(ox + 24, oy - 16 + k * 14); c.stroke(); }
    if (vai > 0.6) {
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3;
      for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(ox - 60 - k * 10, oy - 18 + k * 18); c.lineTo(ox - 34, oy - 18 + k * 18); c.stroke(); }
    }
  }

  function canhao(c, t, o) {
    const recuo = o.tiro > 0 ? -8 : 0;
    c.strokeStyle = '#8d99ae'; c.lineWidth = 20;
    c.beginPath(); c.moveTo(40, -160); c.lineTo(62 + recuo, -152); c.stroke();
    c.fillStyle = '#1d4ed8'; G.gfx.rr(c, 50 + recuo, -170, 50, 34, 10); c.fill();
    c.fillStyle = '#d9d9d9'; G.gfx.rr(c, 92 + recuo, -163, 18, 20, 5); c.fill();
    c.save(); c.translate(70 + recuo, -153); c.scale(0.5, 0.5); teiaRiscos(c, 22, 6, '#ffffff'); c.restore();
    if (o.tiro > 0) {
      c.fillStyle = 'rgba(255,255,255,.85)';
      c.beginPath(); c.arc(116, -153, 12, 0, TAU); c.fill();
    }
  }

  // tentáculos do Venom: a preparar recolhem-se, a chicotear esticam-se
  function tentaculos(c, t, o, frente) {
    const estica = o.lat > 0 ? 1 : 0;
    const prepara = o.tent > 0 ? 1 : 0;
    const n = frente ? 3 : 2;
    for (let k = 0; k < n; k++) {
      const y0 = -160 + k * 18;
      const comp = estica ? 250 : (prepara ? 34 : 70);
      const onda = Math.sin(t * 7 + k * 1.7) * (estica ? 14 : 22);
      c.strokeStyle = frente ? '#14121f' : '#2a2440'; c.lineWidth = 16 - k * 3;
      c.beginPath(); c.moveTo(frente ? 44 : -40, y0);
      c.quadraticCurveTo((frente ? 44 : -40) + comp * 0.5, y0 - 40 + onda, (frente ? 44 : -40) + comp * (frente ? 1 : -0.6), y0 + onda * 0.6);
      c.stroke();
      if (frente) {
        c.strokeStyle = 'rgba(199,125,255,.5)'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(44, y0 - 3);
        c.quadraticCurveTo(44 + comp * 0.5, y0 - 43 + onda, 44 + comp, y0 - 3 + onda * 0.6); c.stroke();
      }
    }
    if (prepara && frente) {
      G.gfx.label(c, '!', 30, -290, 44, '#ff4d6d', 'center', '#14121f');
    }
  }

  // teias coladas no robô do Venom: quanto mais, mais embrulhado
  function teiasNoRobo(c, quanto, t) {
    const n = Math.floor(quanto / 7);
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 3;
    for (let k = 0; k < n; k++) {
      const y = -20 - h01(k * 3.1) * 220, x = -60 + h01(k * 7.7) * 120;
      c.save(); c.translate(x, y); c.rotate(h01(k * 5.3) * TAU);
      teiaRiscos(c, 18 + h01(k) * 14, 6, 'rgba(255,255,255,.9)');
      c.restore();
    }
    if (quanto >= 100) {
      c.lineWidth = 6; c.strokeStyle = '#ffffff';
      for (let k = 0; k < 9; k++) {
        const y = -16 - k * 26;
        c.beginPath(); c.moveTo(-78, y + Math.sin(t * 3 + k) * 3); c.quadraticCurveTo(0, y - 18, 78, y + 8); c.stroke();
      }
    }
  }

  function gosmaNoRobo(c, quanto, colado, t) {
    const n = colado ? 18 : Math.floor(quanto / 8);
    c.fillStyle = '#2b2440';
    for (let k = 0; k < n; k++) {
      const y = -30 - h01(k * 2.9) * 200, x = -56 + h01(k * 6.1) * 112;
      const r = 10 + h01(k * 4.4) * 14 + (colado ? 8 : 0);
      c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(x, y + r, r * 0.3, r * 0.6 + Math.sin(t * 3 + k) * 2, 0, 0, TAU); c.fill();
    }
    if (colado) {
      c.fillStyle = 'rgba(199,125,255,.5)';
      for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(-40 + k * 16, -120 - h01(k) * 60, 4, 0, TAU); c.fill(); }
    }
  }

  function cidade(c, W, H, t) {
    const base = sy(0);
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b1338'); g.addColorStop(0.6, '#283c86'); g.addColorStop(1, '#45a0c9');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (let k = 0; k < 45; k++) {
      c.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.2 + k));
      c.fillStyle = '#fff'; c.fillRect((k * 173) % W, h01(k) * base * 0.5, 2.5, 2.5);
    }
    c.globalAlpha = 1;
    c.fillStyle = '#fff3bf'; c.beginPath(); c.arc(W * 0.82, base * 0.18, 34, 0, TAU); c.fill();
    // prédios ao longe e ao perto
    for (const [par, cor, alt0, larg] of [[0.25, '#1b2a5c', 160, 150], [0.55, '#14204a', 230, 190]]) {
      for (let k = -1; k < W / larg + 2; k++) {
        const n = Math.round((camX * par + k * larg) / larg);
        const x = k * larg - ((camX * par) % larg);
        const h = alt0 + h01(n * 1.3 + par) * 200;
        c.fillStyle = cor; c.fillRect(x + 6, base - h, larg - 12, h);
        c.fillStyle = 'rgba(255,214,102,.75)';
        for (let jy = 0; jy < h / 34 - 1; jy++) for (let jx = 0; jx < (larg - 30) / 26; jx++) {
          if (h01(n * 9.1 + jy * 3.3 + jx * 1.7 + par) < 0.55) continue;
          c.fillRect(x + 18 + jx * 26, base - h + 16 + jy * 34, 12, 16);
        }
      }
    }
    // rua
    c.fillStyle = '#3a3f58'; c.fillRect(0, base, W, H - base);
    c.fillStyle = '#596080'; c.fillRect(0, base, W, 10);
    c.strokeStyle = 'rgba(255,214,102,.8)'; c.lineWidth = 6; c.setLineDash([40, 34]);
    c.beginPath(); c.moveTo(-((camX) % 74), base + 46); c.lineTo(W, base + 46); c.stroke();
    c.setLineDash([]);
    // os limites da arena: barreiras às riscas
    for (const ax of [60, ARENA - 60]) {
      const x = ax - camX;
      if (x < -60 || x > W + 60) continue;
      for (let k = 0; k < 4; k++) {
        c.fillStyle = k % 2 ? '#ffd60a' : '#22223b';
        c.fillRect(x - 18, base - 120 + k * 30, 36, 30);
      }
    }
  }

  function bolaGosma(c, x, y, t) {
    c.fillStyle = '#2b2440';
    c.beginPath(); c.arc(x, y, 18, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(x - 6, y + 16, 6, 10 + Math.sin(t * 12) * 3, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(199,125,255,.75)';
    c.beginPath(); c.arc(x - 6, y - 6, 5, 0, TAU); c.fill();
  }

  S.draw = function (c, t) {
    const vs = vscale(), W = vw(), H = vh();
    c.save(); c.scale(vs, vs);
    cidade(c, W, H, t);
    const base = sy(0);

    // sombras
    for (const r of [p, v]) {
      c.fillStyle = 'rgba(0,0,0,' + (0.3 * Math.max(0.3, 1 - r.alt / 400)) + ')';
      c.beginPath(); c.ellipse(r.x - camX, base + 6, 80, 14, 0, 0, TAU); c.fill();
    }

    // o Venom
    c.save(); c.translate(v.x - camX, sy(v.alt));
    if (fase === 'embrulhado') c.rotate(Math.sin(t * 9) * 0.05);
    if (v.pisca > 0 && Math.floor(t * 24) % 2 === 0) c.globalAlpha = 0.75;
    c.save(); if (v.dir < 0) c.scale(-1, 1);
    robo(c, t, { spidey: false, walk: v.walk, tent: v.tent, lat: v.lat, bloq: v.bloq, ri: v.ri || (fase === 'embrulhado' ? 0 : 0), t: t });
    c.restore();
    teiasNoRobo(c, fase === 'embrulhado' ? 100 : v.teias, t);
    c.restore();

    // o Spidey
    c.save(); c.translate(p.x - camX, sy(p.alt));
    if (p.colado > 0) c.rotate(Math.sin(t * 20) * 0.03);
    if (p.pisca > 0 && Math.floor(t * 24) % 2 === 0) c.globalAlpha = 0.75;
    c.save(); if (p.dir < 0) c.scale(-1, 1);
    robo(c, t, { spidey: true, walk: p.walk, soco: p.soco, tiro: p.tiro, t: t });
    c.restore();
    gosmaNoRobo(c, p.gosma, p.colado > 0, t);
    c.restore();
    // chamas dos jatos quando estão no ar
    for (const r of [p, v]) {
      if (r.alt <= 4) continue;
      const x = r.x - camX, y = sy(r.alt);
      for (const lx of [-30, 30]) {
        c.fillStyle = r === p ? '#ffb703' : '#c77dff';
        c.beginPath(); c.moveTo(x + lx - 12, y); c.lineTo(x + lx + 12, y); c.lineTo(x + lx, y + 30 + Math.random() * 16); c.closePath(); c.fill();
      }
    }

    if (fase === 'embrulhado') {
      G.gfx.bubble(c, Math.max(110, Math.min(W - 110, v.x - camX)), sy(v.alt) - 280, 'Grrr! Estou preso! 😠');
    } else if (p.colado > 0) {
      G.gfx.bubble(c, Math.max(110, Math.min(W - 110, p.x - camX)), sy(p.alt) - 280, 'Que nojo! Abana! 😝');
    }

    // teias e gosma a voar
    for (const s of tiros) {
      const x = s.x - camX, y = sy(s.alt);
      c.save(); c.translate(x, y); c.rotate(s.t * 8);
      if (s.rede) {
        c.globalAlpha = 0.9; teiaRiscos(c, 70, 10, '#ffffff');
      } else {
        c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.fill();
        teiaRiscos(c, 18, 6, '#ffffff');
      }
      c.restore();
      c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x - s.dir * 18, y); c.lineTo(x - s.dir * 60, y); c.stroke();
    }
    for (const g of gotas) bolaGosma(c, g.x - camX, sy(g.alt), t);

    for (const q of puffs) {
      c.globalAlpha = Math.max(0, 0.75 * (1 - q.t / q.life));
      c.fillStyle = q.col; c.beginPath(); c.arc(q.x - camX, sy(q.alt), q.r, 0, TAU); c.fill();
    }
    c.globalAlpha = 1;
    for (const s of sparks) {
      c.globalAlpha = Math.max(0, 1 - s.t / s.life);
      G.gfx.star(c, s.x - camX, sy(s.alt), 6, s.col, s.t * 8);
    }
    c.globalAlpha = 1;
    for (const q of textos) {
      c.save(); c.globalAlpha = Math.max(0, 1 - q.t / 0.8);
      c.translate(q.x - camX, sy(q.alt)); c.rotate(-0.12); c.scale(1 + q.t * 0.4, 1 + q.t * 0.4);
      G.gfx.label(c, q.txt, 0, 0, 34, q.cor, 'center', '#22223b');
      c.restore();
    }
    c.restore();

    hud(c, t);
  };

  /* ---------- HUD: só desenhos (o Isaac ainda não lê) ---------- */
  function hud(c, t) {
    const k = Math.min(1, G.H / 520);
    c.save(); c.scale(k, k);
    G.gfx.star(c, 34, 36, 17, '#ffd166', 0);
    G.gfx.label(c, '' + G.state.stars, 60, 37, 28, '#b56b00');
    // o Venom e as teias que já tem (quando a barra enche fica embrulhado)
    c.save(); c.translate(34, 86); caraVenom(c, 20, t, 0); c.restore();
    barra(c, 64, 74, 170, 24, fase === 'embrulhado' ? 1 : v.teias / 100, '#ffffff', '#5a4b8a', true, t);
    // o nosso robô e a gosma que tem em cima
    c.save(); c.translate(34, 134); caraSpidey(c, 20); c.restore();
    barra(c, 64, 122, 170, 24, p.colado > 0 ? 1 : p.gosma / 100, '#2b2440', '#c77dff', false, t);
    // rede gigante a carregar
    c.save(); c.translate(34, 182);
    c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.fill();
    c.strokeStyle = carga >= 1 ? '#ffd60a' : '#ffffff'; c.lineWidth = 5;
    c.beginPath(); c.arc(0, 0, 20, -Math.PI / 2, -Math.PI / 2 + TAU * carga); c.stroke();
    teiaRiscos(c, carga >= 1 ? 14 + Math.sin(t * 8) * 2 : 12, 6, '#ffffff');
    c.restore();
    // rondas ganhas: uma teiazinha por cada
    for (let i = 0; i < Math.min(ronda - 1, 8); i++) {
      c.save(); c.translate(72 + i * 26, 182); teiaRiscos(c, 10, 6, '#ffd60a'); c.restore();
    }
    c.restore();
  }

  function barra(c, x, y, w, h, f, cor, borda, teia, t) {
    G.gfx.rr(c, x, y, w, h, h / 2); c.fillStyle = 'rgba(0,0,0,.4)'; c.fill();
    if (f > 0) {
      G.gfx.rr(c, x, y, Math.max(h, w * f), h, h / 2); c.fillStyle = cor; c.fill();
      if (teia) {
        c.save(); G.gfx.rr(c, x, y, Math.max(h, w * f), h, h / 2); c.clip();
        c.strokeStyle = 'rgba(90,75,138,.5)'; c.lineWidth = 1.5;
        for (let k = 0; k < w / 12; k++) { c.beginPath(); c.moveTo(x + k * 12, y); c.lineTo(x + k * 12 + 8, y + h); c.stroke(); }
        c.restore();
      }
    }
    G.gfx.rr(c, x, y, w, h, h / 2); c.strokeStyle = f >= 1 && Math.sin(t * 10) > 0 ? '#ffd60a' : borda; c.lineWidth = 3; c.stroke();
  }

  S.debug = function () {
    return {
      fase: fase, ronda: ronda, px: Math.round(p.x), vx: Math.round(v.x), palt: Math.round(p.alt), valt: Math.round(v.alt),
      teias: Math.round(v.teias), gosma: Math.round(p.gosma), colado: +p.colado.toFixed(1), carga: +carga.toFixed(2),
      tiros: tiros.length, gotas: gotas.length, bloq: v.bloq > 0, stars: G.state.stars,
      gotaPerto: gotas.reduce(function (mn, g) { const d = Math.abs(g.x - p.x); return d < mn ? d : mn; }, 9999)
    };
  };

  G.scenes = G.scenes || {};
  G.scenes.robos = S;
})();
