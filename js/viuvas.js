/* Cena 9 — As Viúvas Negras (ditada pelo Isaac em 2026-08-16).

   Regras que ele ditou, tal e qual:
   - Somos uma VIÚVA NEGRA e chamamo-nos Isaac.
   - Os ESCORPIÕES atacam-nos, mas a viúva negra é mais forte: quando os apanha, ganha sempre.
   - Apanham-se com TEIAS. Eles não conseguem escapar… mas conseguem PARTIR a teia —
     só que ao partirem fica-lhes a CAUDA presa na teia, e a cada vez fica "mais mais
     apanhada": à terceira já não parte nada e fica um pacotinho de teia.
   - Há CANHÕES que "podem apanhar-me": disparam redes; quem for apanhado mexe-se para sair
     (e sai sempre sozinho ao fim de pouco tempo). Com teia, o canhão fica amigo e passa a
     atirar estrelas.

   Regras de paz do projeto: ninguém se magoa nem desaparece. O "ganhar e comer" do Isaac é
   um "NHAC!" de brincadeira — o escorpião sai do embrulho a rir, com um laço, e passa a
   andar connosco a ajudar. Não há derrota nem game over. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  const RUN = 290, JUMPV = 700, GRAV = 1500;
  const SLOT = 520;                 // um "pedaço" de jardim
  const TEIA_V = 640, MAXTEIAS = 12;
  const MAXAMIGOS = 4;              // equipa visível pequena, como nos ninjas
  const GIGA_NEED = 5;              // escorpiões apanhados por NÓS para a teia gigante
  const PRESO_MAX = 2.4;            // preso na rede nunca dura mais do que isto
  const CAUDA_MAX = 2;              // 2 quebras e a cauda fica presa de vez

  const AMIGOS = [
    { n: 'Pinguinho', c: '#f4a261' }, { n: 'Tenaz', c: '#e9c46a' },
    { n: 'Rabito', c: '#e76f51' }, { n: 'Pipoca', c: '#ffb4a2' },
    { n: 'Coquinho', c: '#dda15e' }, { n: 'Zé', c: '#f6bd60' },
    { n: 'Farrusco', c: '#cb997e' }, { n: 'Bolinha', c: '#ffd6a5' }
  ];

  let hero, maus, amigos, teias, redes, tiros, puffs, sparks, coins, trail, canhoes;
  let camX, camY, fireCd, meter, giga, gigaR, salvos, apanhados, spawnT;
  let vagalumes, avisado, dicaQuebra, dicaPreso, dicaRede;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function h01(n) { const s = Math.sin(n * 127.1) * 43758.5; return s - Math.floor(s); }

  // ecrãs baixinhos desenham o mundo mais pequeno (igual à Barbie e aos ninjas)
  function vscale() { return Math.min(1, G.H / 620); }
  function vw() { return G.W / vscale(); }
  function vh() { return G.H / vscale(); }

  function nivel() { return Math.min(5, 1 + Math.floor(salvos / 5)); }

  /* ---------- jardim infinito: chão + ramos ---------- */
  function ramoAt(i) {
    if (i < 1 || h01(i * 3.7 + 0.9) < 0.32) return null;
    return {
      x: i * SLOT + 120 + h01(i * 5.3) * 170,
      w: 160 + Math.floor(h01(i * 2.1) * 3) * 50,
      alt: 125 + Math.floor(h01(i * 7.7) * 3) * 44
    };
  }
  function starsAt(i) {
    const p = ramoAt(i);
    const out = [];
    for (let k = 0; k < 3; k++) {
      const x = i * SLOT + 110 + k * 150 + h01(i * 9.1 + k) * 60;
      const emCima = p && x > p.x - 20 && x < p.x + p.w + 20;
      out.push({ x: x, alt: (emCima ? p.alt : 0) + 60 + h01(i * 4.3 + k) * 48 });
    }
    return out;
  }
  function canhaoAt(i) {                 // canhões espalhados pelo chão, um de vez em quando
    if (i < 2 || h01(i * 11.3 + 2.4) < 0.5) return null;
    return { x: i * SLOT + 250 + h01(i * 3.1) * 150, alt: 0 };
  }
  function solidAlt(x, alt, prevAlt) {
    const i = Math.floor(x / SLOT);
    for (let k = i - 1; k <= i + 1; k++) {
      const p = ramoAt(k);
      if (p && x >= p.x - 10 && x <= p.x + p.w + 10 && prevAlt >= p.alt - 4 && alt <= p.alt) return p.alt;
    }
    return alt <= 0 ? 0 : null;
  }
  function canhaoEstado(i) {             // estado vivo de cada canhão (criado à medida)
    let o = canhoes[i];
    if (!o) { o = canhoes[i] = { teia: 0, cd: rnd(1.4, 3.2), festa: false, ang: 0.25, sorriso: 0 }; }
    return o;
  }

  /* ---------- ciclo da cena ---------- */
  S.enter = function () {
    hero = {
      x: 150, alt: 0, vy: 0, dir: 1, walk: 0, grounded: true,
      inv: 1.4, tonto: 0, strike: 0, preso: 0, luta: 0
    };
    maus = []; amigos = []; teias = []; redes = []; tiros = [];
    puffs = []; sparks = []; coins = {}; trail = []; canhoes = {};
    camX = 0; camY = 0; fireCd = 0; meter = 0; giga = 0; gigaR = 0;
    salvos = 0; apanhados = 0; spawnT = 1.4;
    avisado = false; dicaQuebra = false; dicaPreso = false; dicaRede = false;
    vagalumes = [];
    for (let i = 0; i < 22; i++) {
      vagalumes.push({ x: Math.random(), y: Math.random() * 0.9, r: 2 + Math.random() * 3, f: Math.random() * 6 });
    }
    for (let i = 0; i < 2; i++) novoMau(820 + i * 460);
    G.banner('Atira teias aos escorpiões! ⚡', 3200);
  };

  function novoMau(x) {
    maus.push({
      x: x, alt: 0, vy: 0, dir: -1, state: 'walk', t: rnd(0, 6),
      cauda: 0, teia: 0, quebrar: 0, cd: 0, bag: 0, flee: 0,
      lunge: 0, pisca: 0, walk: 0, wig: rnd(0, 6)
    });
  }

  function spark(x, alt, n, col) {
    for (let i = 0; i < n; i++) {
      sparks.push({ x: x, alt: alt, vx: rnd(-150, 150), vy: rnd(40, 240), t: 0, life: rnd(0.4, 0.9), col: col });
    }
  }
  function puff(x, alt, n, cor) {
    for (let i = 0; i < (n || 8); i++) {
      puffs.push({ x: x + rnd(-16, 16), alt: alt + rnd(0, 36), r: rnd(12, 26), t: 0, life: rnd(0.45, 0.85), cor: cor || '#e8ecf5' });
    }
  }

  function tonto(quantas) {                     // levar uma ferroadinha: cócegas, não magoa
    if (hero.inv > 0) return 0;
    hero.inv = 1.3; hero.tonto = 1.1;
    const levou = Math.min(quantas, G.state.stars);
    if (levou > 0) G.state.stars -= levou;
    G.audio.sfx(levou > 0 ? 'ouch' : 'giggle'); G.shake = 0.28;
    spark(hero.x, hero.alt + 50, 8, '#ffd166');
    return levou;
  }

  function atirarTeia(x, alt, dir, dono) {
    if (teias.length >= MAXTEIAS) return;
    teias.push({ x: x + dir * 26, x0: x, alt: alt + 34, dir: dir, rot: 0, dono: dono });
    G.audio.sfx('teia');
  }

  /* ---- a teia acerta num escorpião ---- */
  function acertarMau(m, x, alt, porMim) {
    if (m.state !== 'walk' && m.state !== 'flee') return;
    m.pisca = 0.25;
    spark(x, alt, 6, '#ffffff');
    if (m.teia > 0) {                          // já está a lutar: mais teia = parte mais depressa
      m.quebrar = Math.max(0.08, m.quebrar - 0.45);
      return;
    }
    if (m.cauda >= CAUDA_MAX) {                // cauda toda presa: já não parte nada
      empacotar(m, porMim);
      return;
    }
    m.teia = 1; m.quebrar = 1.15; m.state = 'walk'; m.flee = 0;
    G.audio.sfx('pop');
  }

  function empacotar(m, porMim) {              // vira pacotinho de teia à espera do NHAC
    m.state = 'preso'; m.teia = 1; m.t = 0; m.meu = !!porMim;
    puff(m.x, m.alt + 24, 10, '#ffffff');
    G.audio.sfx('whoosh'); G.shake = Math.max(G.shake, 0.22);
    if (!dicaPreso) {
      dicaPreso = true;
      G.banner('Embrulhado! Vai dar-lhe um NHAC 🕷️', 2800);
    }
  }

  function quebrouTeia(m) {                    // ele parte a teia… e fica com a cauda presa
    m.teia = 0; m.cauda++;
    m.cd = 0.5;
    G.audio.sfx('quebra');
    spark(m.x, m.alt + 34, 9, '#ffffff');
    if (m.cauda >= CAUDA_MAX) {
      if (!dicaQuebra) {
        dicaQuebra = true;
        G.banner('A cauda ficou presa! Mais teia 🕸️', 2800);
      }
    } else if (!dicaQuebra) {
      G.banner('Partiu a teia… a cauda ficou presa! 🕸️', 2600);
      dicaQuebra = true;
    }
  }

  /* ---- NHAC: a viúva negra ganha sempre ---- */
  function nhac(m) {
    m.state = 'ido';
    salvos++;
    if (m.meu) { apanhados++; meter = Math.min(GIGA_NEED, meter + 1); }
    G.audio.sfx('nhac'); G.audio.sfx('tada');
    puff(m.x, m.alt + 30, 12, '#ffe9f2');
    spark(m.x, m.alt + 40, 14, '#ff8fab');
    G.addStars(2 + (m.bag || 0));

    const cheia = amigos.length >= MAXAMIGOS;
    const info = AMIGOS[salvos % AMIGOS.length];
    if (cheia) {
      // só de 15 em 15, senão a faixa piscava sem parar (armadilha já medida nos ninjas)
      if (salvos % 15 === 0) G.banner('Já fizemos ' + salvos + ' amigos! 🕷️🦂', 2200);
    } else {
      amigos.push({
        nome: info.n, cor: info.c, x: m.x, alt: m.alt, dir: 1,
        t: 0, cd: rnd(0.8, 1.8), bow: 1.8, walk: 0
      });
      G.banner('NHAC! O ' + info.n + ' é nosso amigo 🦂💖', 2400);
    }
    if (meter >= GIGA_NEED && giga <= 0 && !avisado) {
      avisado = true;
      G.banner('🕸️ TEIA GIGANTE! Carrega no ⚡', 2800);
    }
  }

  /* ---- ficar preso na rede de um canhão ---- */
  function apanhadoPorRede(x, alt) {
    if (hero.preso > 0 || hero.inv > 0) return;
    hero.preso = PRESO_MAX; hero.luta = 0;
    G.audio.sfx('rede'); G.shake = 0.3;
    puff(x, alt, 8, '#ffffff');
    if (!dicaRede) {
      dicaRede = true;
      G.banner('Apanhado! Mexe-te muito 👆', 2600);
    }
  }

  S.update = function (dt, t) {
    const W = vw(), inp = G.input;
    hero.inv = Math.max(0, hero.inv - dt);
    hero.tonto = Math.max(0, hero.tonto - dt);
    hero.strike = Math.max(0, hero.strike - dt);
    giga = Math.max(0, giga - dt);
    if (giga > 0) gigaR += dt * 900; else gigaR = 0;

    if (inp.justPressed('debug9')) apanhadoPorRede(hero.x, hero.alt + 40);   // teste

    /* ---- preso na rede: mexer-se para sair (e sai sempre sozinho) ---- */
    if (hero.preso > 0) {
      hero.preso -= dt;
      const mexeu = inp.tap || inp.justPressed('left') || inp.justPressed('right') ||
                    inp.justPressed('jump') || inp.justPressed('up') || inp.justPressed('fire');
      if (mexeu) {
        hero.luta++; hero.preso -= 0.42;
        G.audio.sfx('pop'); spark(hero.x, hero.alt + 40, 4, '#ffffff');
      }
      for (const f of amigos) {                  // os amigos ajudam a cortar a rede
        if (Math.abs(f.x - hero.x) < 130) { hero.preso -= dt * 1.3; break; }
      }
      if (hero.preso <= 0) {
        hero.preso = 0; hero.inv = 1.0;
        puff(hero.x, hero.alt + 40, 9, '#ffffff');
        G.audio.sfx('tada'); G.addStars(1);
        G.banner('Escapaste! 🕷️✨', 1600);
      }
    } else {
      const ax = inp.axis();
      let mv = 0;
      if (inp.isHeld('left')) mv -= 1;
      if (inp.isHeld('right')) mv += 1;
      if (mv === 0) mv = Math.abs(ax.x) > 0.25 ? Math.sign(ax.x) : 0;
      const vel = RUN * (hero.tonto > 0 ? 0.5 : 1);
      if (mv !== 0) { hero.x = Math.max(60, hero.x + mv * vel * dt); hero.dir = mv; hero.walk += dt * 12; }

      if ((inp.justPressed('jump') || inp.justPressed('up')) && hero.grounded) {
        hero.vy = JUMPV; hero.grounded = false; G.audio.sfx('hop');
      }

      fireCd -= dt;
      if ((inp.justPressed('fire') || inp.isHeld('fire')) && fireCd <= 0 && hero.tonto <= 0) {
        if (meter >= GIGA_NEED && giga <= 0) {
          giga = 0.85; gigaR = 0; meter = 0; fireCd = 0.7; avisado = false;
          G.audio.sfx('tornado'); G.shake = 0.45;
          G.banner('🕸️ TEIA GIGANTE!', 2200);
        } else {
          fireCd = 0.3; hero.strike = 0.16;
          atirarTeia(hero.x, hero.alt, hero.dir, 'eu');
        }
      }
    }

    const prevAlt = hero.alt;
    hero.vy -= GRAV * dt; hero.alt += hero.vy * dt;
    const chao = solidAlt(hero.x, hero.alt, prevAlt);
    hero.grounded = false;
    if (hero.vy <= 0 && chao !== null) { hero.alt = chao; hero.vy = 0; hero.grounded = true; }
    camX = Math.max(-30, hero.x - W * 0.42);

    // rasto por DISTÂNCIA (por tempo, parar empilhava os amigos no mesmo sítio)
    if (!trail.length || Math.abs(trail[0].x - hero.x) > 12 || Math.abs(trail[0].alt - hero.alt) > 26) {
      trail.unshift({ x: hero.x, alt: hero.alt, dir: hero.dir });
      if (trail.length > (MAXAMIGOS + 2) * 5 + 12) trail.pop();
    }

    // teia gigante: tudo o que apanha fica logo empacotado
    if (giga > 0) {
      for (const m of maus) {
        if (m.state !== 'walk' && m.state !== 'flee') continue;
        if (Math.abs(m.x - hero.x) < gigaR && Math.abs(m.alt - hero.alt) < 420) { m.cauda = CAUDA_MAX; empacotar(m, true); }
      }
      const i0 = Math.floor((camX - 400) / SLOT), i1 = Math.floor((camX + W + 400) / SLOT);
      for (let i = Math.max(0, i0); i <= i1; i++) {
        const cn = canhaoAt(i);
        if (!cn) continue;
        const o = canhaoEstado(i);
        if (!o.festa && Math.abs(cn.x - hero.x) < gigaR) amigarCanhao(cn, o, true);
      }
    }

    /* ---- teias a voar (com mira assistida em altura, como as estrelas ninja) ---- */
    for (let i = teias.length - 1; i >= 0; i--) {
      const s = teias[i];
      s.x += s.dir * TEIA_V * dt; s.rot += dt * 9;
      if (Math.abs(s.x - s.x0) > 640) { puff(s.x, s.alt, 3, '#ffffff'); teias.splice(i, 1); continue; }
      let alvo = null, md = 700;
      for (const m of maus) {
        if (m.state !== 'walk' && m.state !== 'flee') continue;
        const dx = (m.x - s.x) * s.dir;
        if (dx > -20 && dx < md) { md = dx; alvo = m; }
      }
      if (alvo) {
        const quer = alvo.alt + 30;
        s.alt += Math.max(-440 * dt, Math.min(440 * dt, quer - s.alt));
      }
      let bateu = false;
      for (const m of maus) {
        if (m.state !== 'walk' && m.state !== 'flee') continue;
        if (Math.abs(s.x - m.x) < 42 && Math.abs(s.alt - (m.alt + 30)) < 54) {
          acertarMau(m, s.x, s.alt, s.dono === 'eu'); bateu = true; break;
        }
      }
      if (!bateu) {                                  // e também se cola aos canhões
        const i0 = Math.floor((s.x - 600) / SLOT), i1 = Math.floor((s.x + 600) / SLOT);
        for (let k = Math.max(0, i0); k <= i1 && !bateu; k++) {
          const cn = canhaoAt(k);
          if (!cn) continue;
          const o = canhaoEstado(k);
          if (o.festa) continue;
          if (Math.abs(s.x - cn.x) < 46 && Math.abs(s.alt - (cn.alt + 34)) < 60) {
            o.teia++; o.cd = Math.max(o.cd, 1.1); bateu = true;
            spark(s.x, s.alt, 6, '#ffffff'); G.audio.sfx('pop');
            if (o.teia >= 2) amigarCanhao(cn, o);
          }
        }
      }
      if (bateu) teias.splice(i, 1);
    }

    /* ---- redes disparadas pelos canhões ---- */
    for (let i = redes.length - 1; i >= 0; i--) {
      const r = redes[i];
      r.x += r.vx * dt; r.vy -= 380 * dt; r.alt += r.vy * dt; r.rot += dt * 3;
      if (r.alt <= 0 || Math.abs(r.x - hero.x) > W) { puff(r.x, Math.max(8, r.alt), 5, '#ffffff'); redes.splice(i, 1); continue; }
      if (hero.preso <= 0 && Math.abs(r.x - hero.x) < 48 && Math.abs(r.alt - (hero.alt + 34)) < 62) {
        redes.splice(i, 1); apanhadoPorRede(r.x, r.alt);
      }
    }

    /* ---- estrelas atiradas pelos canhões amigos ---- */
    for (let i = tiros.length - 1; i >= 0; i--) {
      const s = tiros[i];
      s.x += s.vx * dt; s.vy -= 330 * dt; s.alt += s.vy * dt; s.t += dt;
      if (s.alt <= 0 || s.t > 6) { tiros.splice(i, 1); continue; }
      if (Math.abs(s.x - hero.x) < 52 && Math.abs(s.alt - (hero.alt + 34)) < 70) {
        tiros.splice(i, 1); G.addStars(1); G.audio.sfx('star'); spark(s.x, s.alt, 5, '#ffd166');
      }
    }

    /* ---- escorpiões ---- */
    for (let i = maus.length - 1; i >= 0; i--) {
      const m = maus[i];
      m.t += dt; m.cd = Math.max(0, m.cd - dt); m.lunge = Math.max(0, m.lunge - dt);
      m.pisca = Math.max(0, m.pisca - dt);

      if (m.state === 'ido') { maus.splice(i, 1); continue; }

      const pa = m.alt;
      m.vy -= GRAV * dt; m.alt += m.vy * dt;
      const c2 = solidAlt(m.x, m.alt, pa);
      if (m.vy <= 0 && c2 !== null) { m.alt = c2; m.vy = 0; }

      if (m.state === 'preso') {                   // pacotinho: só se mexe e espera o NHAC
        if (Math.abs(m.x - hero.x) < 54 && Math.abs(m.alt - hero.alt) < 76 && hero.preso <= 0) nhac(m);
        if (m.x < camX - 1100) m.state = 'ido';
        continue;
      }

      if (m.teia > 0) {                            // preso na teia: luta para a partir
        m.quebrar -= dt;
        if (m.t % 0.5 < dt) spark(m.x, m.alt + 34, 2, '#ffffff');
        if (m.quebrar <= 0) quebrouTeia(m);
        continue;                                  // enquanto luta, não anda nem pica
      }

      const d = hero.x - m.x;
      // ficam para trás e vão-se embora (senão enchem a conta de vivos e param de aparecer)
      if (m.x < camX - 700) { m.state = 'ido'; continue; }

      const lento = 1 - 0.26 * m.cauda;            // cauda presa = mais devagar
      if (m.state === 'flee') {
        m.flee -= dt; m.x += m.dir * 230 * lento * dt; m.walk += dt * 14;
        if (m.flee <= 0) { m.state = 'walk'; m.dir = Math.sign(d) || -1; }
      } else {
        m.dir = Math.sign(d) || -1;
        m.x += m.dir * (Math.abs(d) < 700 ? 205 : 150) * lento * dt;
        m.walk += dt * 11;
        if (Math.abs(d) < 52 && Math.abs(m.alt - hero.alt) < 70 && m.cd <= 0) {
          m.cd = 1.7; m.lunge = 0.35;
          if (m.cauda >= CAUDA_MAX) {              // sem cauda livre já não pica: só faz cócegas
            G.audio.sfx('giggle'); spark(m.x, m.alt + 40, 4, '#ffd166');
          } else if (hero.preso > 0) {
            G.audio.sfx('giggle');
          } else {
            const levou = tonto(m.cauda > 0 ? 1 : 2);
            if (levou > 0) { m.bag += levou; G.banner('Levou ' + levou + ' ⭐! Teia nele ⚡', 1800); }
            m.state = 'flee'; m.flee = 2.0; m.dir = -Math.sign(d) || -1;
          }
        }
      }
      if (m.x < camX - 950) m.x = camX - 950;
    }

    /* ---- amigos: seguem-nos em fila e atiram bolinhas de teia ---- */
    for (let k = 0; k < amigos.length; k++) {
      const f = amigos[k];
      f.t += dt; f.bow = Math.max(0, f.bow - dt); f.cd -= dt;
      const alvo = trail[Math.min(trail.length - 1, (k + 1) * 5)];
      if (alvo && f.bow <= 0) {
        const dx = alvo.x - 6 - f.x;
        f.x += dx * Math.min(1, dt * 6.5);
        f.alt += (alvo.alt - f.alt) * Math.min(1, dt * 8);
        if (Math.abs(dx) > 6) { f.dir = Math.sign(dx); f.walk += dt * 12; }
      }
      if (f.cd <= 0) {
        let melhor = null, md = 300;                // só ajudam de perto
        for (const m of maus) {
          if (m.state !== 'walk' && m.state !== 'flee') continue;
          const dd = Math.abs(m.x - f.x);
          if (dd < md) { md = dd; melhor = m; }
        }
        if (melhor) { f.cd = 3.0; f.dir = Math.sign(melhor.x - f.x) || 1; atirarTeia(f.x, f.alt, f.dir, f.nome); }
        else f.cd = 0.5;
      }
    }

    /* ---- canhões: apontam e disparam redes (ou estrelas, se já forem amigos) ---- */
    const j0 = Math.floor((camX - 500) / SLOT), j1 = Math.floor((camX + W + 700) / SLOT);
    for (let i = Math.max(0, j0); i <= j1; i++) {
      const cn = canhaoAt(i);
      if (!cn) continue;
      const o = canhaoEstado(i);
      o.cd -= dt; o.sorriso = Math.max(0, o.sorriso - dt);
      // dx/dy em coordenadas do MUNDO (alt cresce para cima), por isso o ângulo é
      // atan2(dy, dx) e é o desenho que o inverte (o canvas tem o y ao contrário)
      const dx = hero.x - cn.x, dy = (hero.alt + 40) - (cn.alt + 34);
      const dist = Math.hypot(dx, dy);
      const quer = Math.atan2(dy, dx);
      o.ang += Math.max(-2.4 * dt, Math.min(2.4 * dt, quer - o.ang));
      // só dispara se estiver À VISTA: uma rede a chegar de fora do ecrã era injusta
      const sx = cn.x - camX;
      const visivel = sx > -50 && sx < W + 50;
      if (o.cd <= 0 && visivel && dist < 640 && dist > 70) {
        if (o.festa) {
          o.cd = rnd(1.8, 2.6);
          tiros.push({ x: cn.x, alt: cn.alt + 44, vx: Math.sign(dx) * rnd(90, 170), vy: rnd(330, 430), t: 0 });
          G.audio.sfx('pop');
        } else {
          o.cd = Math.max(1.5, rnd(2.4, 3.6) - nivel() * 0.15);
          const k = 300 / Math.max(1, dist);
          redes.push({ x: cn.x + Math.cos(o.ang) * 30, alt: cn.alt + 34 + Math.sin(o.ang) * 30,
                       vx: dx * k, vy: dy * k + 150 + dist * 0.28, rot: 0 });
          G.audio.sfx('canhao');
        }
      }
    }
    for (const k in canhoes) if (parseInt(k, 10) < j0 - 8) delete canhoes[k];

    /* ---- estrelas do caminho ---- */
    const i0 = Math.floor((camX - 600) / SLOT), i1 = Math.floor((camX + W + 900) / SLOT);
    for (let i = Math.max(0, i0); i <= i1; i++) {
      const lista = starsAt(i);
      for (let k = 0; k < lista.length; k++) {
        const chave = i + ':' + k;
        if (coins[chave]) continue;
        const s = lista[k];
        if (Math.abs(s.x - hero.x) < 46 && Math.abs(s.alt - (hero.alt + 40)) < 74) {
          coins[chave] = 1; G.addStars(1); G.audio.sfx('star'); spark(s.x, s.alt, 5, '#ffd166');
        }
      }
    }
    for (const k in coins) if (parseInt(k, 10) < i0 - 6) delete coins[k];

    /* ---- quem aparece ---- */
    const vivos = maus.filter(function (x) { return x.state !== 'ido'; }).length;
    spawnT -= dt;
    const maxMaus = Math.min(6, 2 + Math.floor(nivel() / 1.5));
    if (spawnT <= 0 && vivos < maxMaus) {
      spawnT = Math.max(1.0, rnd(2.0, 3.0) - nivel() * 0.16);
      novoMau(hero.x + (Math.random() < 0.82 ? W * 0.62 : -W * 0.55) + rnd(-40, 40));
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.t += dt; s.x += s.vx * dt; s.alt += s.vy * dt; s.vy -= 420 * dt;
      if (s.t > s.life) sparks.splice(i, 1);
    }
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      p.t += dt; p.alt += 30 * dt; p.r += 24 * dt;
      if (p.t > p.life) puffs.splice(i, 1);
    }
    for (const v of vagalumes) {
      v.f += dt * 1.6;
      v.x += Math.sin(v.f * 0.7) * 0.02 * dt + dt * 0.008;
      v.y += Math.cos(v.f * 0.5) * 0.03 * dt;
      if (v.x > 1.1) v.x = -0.1;
      if (v.y < 0) v.y = 0.9; if (v.y > 1) v.y = 0.05;
    }

    const want = Math.max(0, hero.alt + 150 - vh() * 0.62);
    camY += (want - camY) * Math.min(1, dt * 4);
  };

  // calado = apanhado pela teia gigante (senão a faixa piscava uma vez por canhão)
  function amigarCanhao(cn, o, calado) {
    o.festa = true; o.sorriso = 2.4; o.cd = 0.6;
    puff(cn.x, cn.alt + 40, 12, '#ffffff');
    spark(cn.x, cn.alt + 50, 14, '#ffd166');
    G.audio.sfx('tada'); G.addStars(3);
    if (!calado) G.banner('O canhão ficou amigo! Atira ⭐', 2400);
  }

  /* ---------- desenho ---------- */
  /* Onde fica a linha do chão. Em ecrãs baixos (telemóvel DEITADO) os botões táteis
     ocupam a faixa de baixo do ecrã: com o 0.84 fixo de sempre, o chão caía por trás
     deles e as personagens ficavam escondidas (medido: 52 px de jogo tapados, e a
     própria viúva ficava atrás do ◀ no arranque). Por isso o chão sobe o necessário
     para ficar sempre acima dos controlos. */
  function chaoY() {
    const livre = (G.H - 122) / vscale();     // espaço acima dos botões, em unidades do mundo
    return Math.min(vh() * 0.84, Math.max(vh() * 0.55, livre));
  }
  function sy(alt) { return chaoY() - alt + camY; }
  // Só fala quem está mesmo à vista (com o clamp de sempre, quem estava fora do ecrã
  // deixava um balão encostado à berma sem ninguém por baixo) e no máximo dois de cada
  // vez — com cinco bichos ao mesmo tempo o ecrã ficava só balões.
  let baloes = 0;
  function bub(c, x, y, txt) {
    if (baloes >= 2 || x < 40 || x > vw() - 40) return;
    baloes++;
    G.gfx.bubble(c, Math.max(96, Math.min(vw() - 96, x)), Math.max(52, y), txt);
  }

  // malha de teia (redonda), usada na rede, nos embrulhos e na teia gigante
  function malha(c, r, fios, cor, alpha) {
    c.save();
    c.strokeStyle = cor || 'rgba(255,255,255,.9)';
    c.globalAlpha = alpha == null ? 1 : alpha;
    c.lineWidth = Math.max(1.2, r * 0.06);
    for (let k = 0; k < (fios || 6); k++) {
      const a = (k / (fios || 6)) * TAU;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); c.stroke();
    }
    for (let ring = 1; ring <= 3; ring++) {
      const rr = (r * ring) / 3;
      c.beginPath();
      for (let k = 0; k <= (fios || 6); k++) {
        const a = (k / (fios || 6)) * TAU;
        const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
        if (k === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.stroke();
    }
    c.restore();
  }

  /* a nossa viúva negra — base nas patas (y=0), virada para a direita.
     Ela é PRETA num jardim à noite: sem um rebordo claro à volta do corpo não se via
     nada (medido no primeiro teste, parecia só dois olhos a flutuar). */
  function viuvaArt(c, t, o) {
    const walk = o.walk || 0;
    const corpo = '#1b1626', brilho = '#4a3f63', rebordo = '#6f6390';
    c.save();
    c.scale(1.15, 1.15);
    // Patas: 4 de cada lado, joelho em cima e pé no chão, bem ABERTAS para fora do corpo.
    // (na 1.ª versão nasciam debaixo do abdómen e ficavam escondidas por ele)
    c.lineCap = 'round';
    for (let passe = 0; passe < 2; passe++) {
      c.strokeStyle = passe === 0 ? rebordo : corpo;
      c.lineWidth = passe === 0 ? 7.5 : 5;
      for (let lado = -1; lado <= 1; lado += 2) {
        for (let k = 0; k < 4; k++) {
          const fase = walk + k * 1.05 + (lado < 0 ? 0.6 : 0);
          const espalha = 24 + k * 11;
          const anc = lado * 3 + (k - 1.5) * 3;
          const joelho = -46 - Math.sin(fase) * 6;
          const pe = -Math.abs(Math.sin(fase)) * 8;
          c.beginPath();
          c.moveTo(anc, -32);
          c.lineTo(lado * espalha * 0.62, joelho);
          c.lineTo(lado * espalha, pe);
          c.stroke();
        }
      }
    }
    c.lineJoin = 'round';
    // abdómen com a ampulheta vermelha
    c.fillStyle = corpo; c.strokeStyle = rebordo; c.lineWidth = 3;
    c.beginPath(); c.ellipse(-17, -32, 23, 20, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = brilho;
    c.beginPath(); c.ellipse(-23, -40, 8, 5, -0.5, 0, TAU); c.fill();
    c.fillStyle = '#e63946';
    c.beginPath();
    c.moveTo(-13, -32); c.lineTo(-21, -45); c.lineTo(-5, -45); c.closePath(); c.fill();
    c.beginPath();
    c.moveTo(-13, -32); c.lineTo(-21, -20); c.lineTo(-5, -20); c.closePath(); c.fill();
    // cabeça
    c.fillStyle = corpo; c.strokeStyle = rebordo; c.lineWidth = 3;
    c.beginPath(); c.ellipse(10, -30, 15, 14, 0, 0, TAU); c.fill(); c.stroke();
    // olhos grandes e simpáticos + dois pequeninos, todos DENTRO da cabeça
    c.fillStyle = '#fff';
    c.beginPath(); c.ellipse(15, -34, 6.4, 7, 0, 0, TAU); c.ellipse(5, -35, 5, 5.4, 0, 0, TAU); c.fill();
    c.fillStyle = '#22223b';
    c.beginPath(); c.arc(16.4, -34, 3, 0, TAU); c.arc(6.2, -35, 2.4, 0, TAU); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(17.4, -36, 1.3, 0, TAU); c.arc(7, -36.6, 1, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)';
    c.beginPath(); c.arc(19, -26, 1.7, 0, TAU); c.arc(12, -24, 1.5, 0, TAU); c.fill();
    // sorriso
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.8;
    c.beginPath(); c.arc(14, -26, 5, 0.3, 2.4); c.stroke();
    if (o.strike) {                       // bolinha de teia acabada de cuspir
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(28, -29, 6, 0, TAU); c.fill();
    }
    c.restore();
  }

  function escorpiaoArt(c, t, o) {
    const cor = o.cor || '#b5651d';
    const escuro = '#7f4415';
    const walk = o.walk || 0;
    c.save();
    if (o.pisca > 0) c.globalAlpha = 0.6;
    c.translate(o.lunge > 0 ? 7 : 0, 0);
    // patas
    c.strokeStyle = escuro; c.lineWidth = 4; c.lineCap = 'round';
    for (let lado = -1; lado <= 1; lado += 2) {
      for (let k = 0; k < 3; k++) {
        const fase = walk + k * 1.3 + (lado < 0 ? 0.7 : 0);
        const px = -14 + k * 12;
        c.beginPath();
        c.moveTo(px, -20);
        c.lineTo(px + lado * 9, -12 - Math.sin(fase) * 3);
        c.lineTo(px + lado * 14 + Math.sin(fase) * 4, -1);
        c.stroke();
      }
    }
    // corpo em segmentos
    c.fillStyle = cor;
    for (let k = 0; k < 4; k++) {
      c.beginPath(); c.ellipse(-18 + k * 11, -21, 9 - k * 0.6, 8, 0, 0, TAU); c.fill();
    }
    c.beginPath(); c.ellipse(20, -22, 12, 10, 0, 0, TAU); c.fill();
    // pinças
    c.strokeStyle = cor; c.lineWidth = 6; c.lineCap = 'round';
    for (let lado = -1; lado <= 1; lado += 2) {
      const abre = o.lunge > 0 ? 0.5 : 0.2 + Math.sin(t * 4 + lado) * 0.12;
      c.save(); c.translate(28, -24 + lado * 5);
      c.beginPath(); c.moveTo(0, 0); c.lineTo(13, lado * 3); c.stroke();
      c.save(); c.translate(13, lado * 3);
      c.fillStyle = cor;
      c.beginPath(); c.ellipse(6, 0, 8, 5, lado * abre, 0, TAU); c.fill();
      c.fillStyle = escuro;
      c.beginPath(); c.ellipse(9, lado * 3, 6, 3, lado * (abre + 0.5), 0, TAU); c.fill();
      c.restore();
      c.restore();
    }
    // cauda: livre em arco, ou cada vez mais presa pela teia
    const preso = Math.min(CAUDA_MAX, o.cauda || 0);
    const abanar = o.teia > 0 ? Math.sin(t * 22) * 0.25 : Math.sin(t * 3) * 0.08;
    const base = { x: -24, y: -24 };
    const alto = preso === 0 ? 46 : (preso === 1 ? 22 : -4);
    const frente = preso === 0 ? 10 : (preso === 1 ? -6 : -22);
    c.strokeStyle = cor; c.lineWidth = 8; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(base.x, base.y);
    c.quadraticCurveTo(base.x - 22, base.y - alto, frente, base.y - alto + 4 + abanar * 10);
    c.stroke();
    c.fillStyle = escuro;                                   // ferrão
    c.beginPath();
    c.arc(frente, base.y - alto + 4 + abanar * 10, 6, 0, TAU); c.fill();
    if (preso > 0) {                                        // fios de teia agarrados à cauda
      c.strokeStyle = 'rgba(255,255,255,.92)'; c.lineWidth = 2.4;
      for (let k = 0; k < 3 + preso * 2; k++) {
        const p = k / (3 + preso * 2);
        const x = base.x + (frente - base.x) * p - 12 * Math.sin(p * Math.PI);
        const y = base.y - alto * Math.sin(p * Math.PI) - 2;
        c.beginPath(); c.moveTo(x - 7, y - 5); c.lineTo(x + 7, y + 5); c.stroke();
      }
      if (preso >= CAUDA_MAX) {                             // cauda colada ao chão
        c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(frente, base.y - alto + 8); c.lineTo(frente - 6, -2); c.stroke();
        c.beginPath(); c.moveTo(frente + 8, base.y - alto + 8); c.lineTo(frente + 14, -2); c.stroke();
      }
    }
    // enrolado na teia AGORA (a lutar para a partir): fios brancos por cima do corpo
    if (o.teia > 0) {
      c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 3; c.lineCap = 'round';
      for (let k = 0; k < 5; k++) {
        const x = -20 + k * 11;
        c.beginPath(); c.moveTo(x - 6, -34); c.lineTo(x + 6, -8); c.stroke();
      }
      c.beginPath(); c.moveTo(-26, -22); c.lineTo(30, -24); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.35)';
      c.beginPath(); c.ellipse(2, -21, 30, 15, 0, 0, TAU); c.fill();
    }
    // olhos
    c.fillStyle = '#fff';
    c.beginPath(); c.ellipse(24, -27, 4.6, 5, 0, 0, TAU); c.ellipse(16, -28, 4, 4.4, 0, 0, TAU); c.fill();
    c.fillStyle = '#22223b';
    c.beginPath(); c.arc(25.4, -27, 2.2, 0, TAU); c.arc(17, -28, 2, 0, TAU); c.fill();
    if (o.amigo) {
      c.strokeStyle = '#5a3210'; c.lineWidth = 2;
      c.beginPath(); c.arc(21, -20, 5, 0.15, 2.9); c.stroke();
      c.fillStyle = '#ff8fab';                              // laço de amigo
      c.beginPath(); c.ellipse(-30, -30, 6, 4, -0.5, 0, TAU); c.ellipse(-38, -33, 6, 4, 0.5, 0, TAU); c.fill();
    }
    if (o.bag > 0) {
      c.save(); c.translate(-8, -40); c.rotate(Math.sin(t * 8) * 0.2);
      c.fillStyle = '#e8e2d0'; c.beginPath(); c.arc(0, 0, 11, 0, TAU); c.fill();
      G.gfx.star(c, 0, 0, 6, '#ffd166', t); c.restore();
    }
    c.restore();
  }

  function pacoteArt(c, t, o) {           // escorpião embrulhado em teia, a mexer-se
    c.save();
    c.rotate(Math.sin(t * 14 + (o.wig || 0)) * 0.13);
    c.fillStyle = '#f2f4fa';
    c.beginPath(); c.ellipse(0, -28, 30, 24, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(160,170,200,.75)'; c.lineWidth = 2;
    for (let k = -2; k <= 2; k++) {
      c.beginPath();
      c.ellipse(0, -28, 30 - Math.abs(k) * 4, 24, 0, 0, TAU);
      c.stroke();
      c.beginPath(); c.moveTo(k * 11, -50); c.lineTo(k * 11 + 4, -6); c.stroke();
    }
    c.fillStyle = '#b5651d';               // patinhas e ferrão de fora
    c.beginPath(); c.ellipse(-32, -14, 7, 4, -0.6, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(30, -16, 7, 4, 0.5, 0, TAU); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.ellipse(12, -32, 5, 5.4, 0, 0, TAU); c.ellipse(3, -33, 4.4, 4.8, 0, 0, TAU); c.fill();
    c.fillStyle = '#22223b';
    c.beginPath(); c.arc(13, -32, 2.3, 0, TAU); c.arc(4, -33, 2.1, 0, TAU); c.fill();
    c.restore();
  }

  function canhaoArt(c, t, o) {           // canhão de redes; com teia fica amigo e ri-se
    c.save();
    c.strokeStyle = o.festa ? '#f2f4fa' : '#5b6472';
    c.fillStyle = o.festa ? '#e9edf7' : '#6b7280';
    c.save();
    c.translate(0, -34); c.rotate(-o.ang);
    G.gfx.rr(c, -6, -11, 44, 22, 9); c.fill();
    c.fillStyle = o.festa ? '#cbd5e8' : '#495057';
    G.gfx.rr(c, 30, -13, 12, 26, 6); c.fill();
    c.restore();
    c.fillStyle = o.festa ? '#e9edf7' : '#6b7280';
    G.gfx.rr(c, -20, -34, 40, 26, 10); c.fill();
    c.fillStyle = '#3f4652';
    c.beginPath(); c.arc(-12, -8, 9, 0, TAU); c.arc(12, -8, 9, 0, TAU); c.fill();
    c.fillStyle = '#98a2b3';
    c.beginPath(); c.arc(-12, -8, 3.5, 0, TAU); c.arc(12, -8, 3.5, 0, TAU); c.fill();
    // corda de dar corda, a rodar
    c.strokeStyle = '#98a2b3'; c.lineWidth = 3;
    c.save(); c.translate(-22, -22); c.rotate(t * 3);
    c.beginPath(); c.moveTo(-7, 0); c.lineTo(7, 0); c.moveTo(0, -7); c.lineTo(0, 7); c.stroke();
    c.restore();
    if (o.teia > 0 && !o.festa) {          // já leva teia colada
      c.strokeStyle = 'rgba(255,255,255,.92)'; c.lineWidth = 2.5;
      for (let k = 0; k < 4; k++) {
        c.beginPath(); c.moveTo(-20 + k * 12, -36); c.lineTo(-12 + k * 12, -8); c.stroke();
      }
    }
    if (o.festa) {                         // olhos e sorriso de canhão amigo
      c.save(); c.translate(0, -22);
      c.fillStyle = '#fff';
      c.beginPath(); c.ellipse(-7, 0, 5, 5.5, 0, 0, TAU); c.ellipse(7, 0, 5, 5.5, 0, 0, TAU); c.fill();
      c.fillStyle = '#22223b';
      c.beginPath(); c.arc(-6, 1, 2.3, 0, TAU); c.arc(8, 1, 2.3, 0, TAU); c.fill();
      c.strokeStyle = '#22223b'; c.lineWidth = 2;
      c.beginPath(); c.arc(0, 6, 6, 0.2, 2.9); c.stroke();
      c.restore();
      c.save(); c.globalAlpha = 0.9;
      malha(c, 26, 7, 'rgba(255,255,255,.55)', 0.5);
      c.restore();
    }
    c.restore();
  }

  S.draw = function (c, t) {
    const vs = vscale(), W = vw(), H = vh();
    baloes = 0;
    c.save(); c.scale(vs, vs);

    // céu de noite no jardim
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b1030'); g.addColorStop(0.5, '#22194a'); g.addColorStop(1, '#3b2a4d');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (let k = 0; k < 44; k++) {
      const x = ((k * 173 - camX * 0.05) % (W + 200) + W + 200) % (W + 200) - 100;
      const y = 16 + h01(k) * H * 0.5;
      c.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.2 + k));
      c.fillStyle = '#fff'; c.fillRect(x, y, 2.4, 2.4);
    }
    c.globalAlpha = 1;
    c.fillStyle = '#fff3bf';
    c.beginPath(); c.arc(W * 0.8, H * 0.15, Math.min(W, H) * 0.07, 0, TAU); c.fill();
    c.fillStyle = 'rgba(230,220,180,.5)';
    c.beginPath(); c.arc(W * 0.77, H * 0.13, 8, 0, TAU); c.arc(W * 0.83, H * 0.18, 5.5, 0, TAU); c.fill();

    // teias grandes penduradas ao fundo (bem apagadas: são cenário, não jogo)
    for (let k = -1; k < W / 380 + 2; k++) {
      const bx = k * 380 - ((camX * 0.25) % 380);
      const by = 60 + h01(Math.round((camX * 0.25 + k * 380) / 380)) * 120;
      c.save(); c.translate(bx, by);
      malha(c, 90, 8, '#dfe6ff', 0.14);
      c.restore();
    }
    // silhuetas de folhas e ervas (parallax)
    for (let k = -1; k < W / 150 + 2; k++) {
      const bx = k * 150 - ((camX * 0.45) % 150);
      const hgt = 150 + h01(Math.round((camX * 0.45 + k * 150) / 150)) * 130;
      c.strokeStyle = 'rgba(40,80,60,.55)'; c.lineWidth = 14; c.lineCap = 'round';
      c.beginPath();
      c.moveTo(bx, sy(0));
      c.quadraticCurveTo(bx + 16, sy(hgt * 0.6), bx + Math.sin(t * 0.6 + k) * 10, sy(hgt));
      c.stroke();
    }

    // chão de terra
    c.fillStyle = '#2a2030'; c.fillRect(0, sy(0), W, H);
    c.fillStyle = '#3b2f42'; c.fillRect(0, sy(0), W, 16);
    c.fillStyle = 'rgba(120,180,140,.5)';
    for (let k = 0; k < W / 46 + 2; k++) {
      const x = k * 46 - (camX % 46);
      c.beginPath();
      c.moveTo(x, sy(0) + 4); c.lineTo(x + 4, sy(0) - 14); c.lineTo(x + 8, sy(0) + 4);
      c.closePath(); c.fill();
    }

    // ramos, canhões e estrelas
    const i0 = Math.floor((camX - 600) / SLOT), i1 = Math.floor((camX + W + 600) / SLOT);
    for (let i = Math.max(0, i0); i <= i1; i++) {
      const p = ramoAt(i);
      if (p) {
        const x = p.x - camX, py = sy(p.alt);
        c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 2;      // fio a segurar o ramo
        c.beginPath(); c.moveTo(x + p.w / 2, py); c.lineTo(x + p.w / 2, -20); c.stroke();
        c.fillStyle = '#6b4423'; G.gfx.rr(c, x, py, p.w, 20, 8); c.fill();
        c.fillStyle = '#3f7d43';
        for (let k = 0; k < p.w / 60; k++) {
          c.beginPath();
          c.ellipse(x + 26 + k * 60, py - 4, 20, 9, -0.25 + Math.sin(t + k) * 0.05, 0, TAU);
          c.fill();
        }
      }
      const cn = canhaoAt(i);
      if (cn) {
        const o = canhaoEstado(i);
        c.save(); c.translate(cn.x - camX, sy(cn.alt));
        canhaoArt(c, t, o);
        c.restore();
      }
      const lista = starsAt(i);
      for (let k = 0; k < lista.length; k++) {
        if (coins[i + ':' + k]) continue;
        const s = lista[k];
        G.gfx.star(c, s.x - camX, sy(s.alt) + Math.sin(t * 3 + i + k) * 5, 15, '#ffd166', t * 1.2);
      }
    }

    // vagalumes
    for (const v of vagalumes) {
      const x = ((v.x * W - camX * 0.15) % W + W) % W, y = v.y * H;
      const b = 0.35 + 0.65 * Math.abs(Math.sin(v.f));
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = b * 0.75;
      const gg = c.createRadialGradient(x, y, 1, x, y, v.r * 6);
      gg.addColorStop(0, '#ffe680'); gg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gg; c.beginPath(); c.arc(x, y, v.r * 6, 0, TAU); c.fill();
      c.restore();
    }

    // escorpiões
    for (const m of maus) {
      if (m.state === 'ido') continue;
      const x = m.x - camX;
      if (x < -160 || x > W + 160) continue;
      c.save(); c.translate(x, sy(m.alt));
      if (m.dir < 0) c.scale(-1, 1);
      if (m.state === 'preso') pacoteArt(c, t, m);
      else escorpiaoArt(c, t + m.t, m);
      c.restore();
      if (m.state === 'preso') bub(c, x, sy(m.alt) - 92, 'Estou preso! 😅');
      else if (m.teia > 0) bub(c, x, sy(m.alt) - 92, 'Vou partir a teia! 💪');
      else if (m.cauda >= CAUDA_MAX) bub(c, x, sy(m.alt) - 92, 'A minha cauda! 😯');
    }

    // amigos
    for (const f of amigos) {
      const x = f.x - camX;
      if (x < -140 || x > W + 140) continue;
      c.save(); c.translate(x, sy(f.alt));
      if (f.dir < 0) c.scale(-1, 1);
      escorpiaoArt(c, t + f.t, { cor: f.cor, walk: f.walk, amigo: true, cauda: 0, teia: 0 });
      c.restore();
      if (f.bow > 0) bub(c, x, sy(f.alt) - 84, 'Sou o ' + f.nome + '! 🦂');
    }

    // a nossa viúva negra
    const hx = hero.x - camX, hy = sy(hero.alt);
    c.save(); c.translate(hx, hy);
    if (hero.tonto > 0) c.rotate(Math.sin(t * 18) * 0.16);
    if (hero.preso > 0) c.rotate(Math.sin(t * 20) * 0.1);
    if (hero.dir < 0) c.scale(-1, 1);
    c.globalAlpha = hero.inv > 0 && Math.floor(t * 10) % 2 === 0 ? 0.6 : 1;
    viuvaArt(c, t, { walk: hero.grounded ? hero.walk : 0, strike: hero.strike > 0 });
    c.restore();
    if (hero.preso > 0) {                      // rede por cima + "mexe-te" desenhado
      c.save(); c.translate(hx, hy - 30);
      malha(c, 42, 8, 'rgba(255,255,255,.95)', 0.95);
      c.restore();
      const p = 1 - hero.preso / PRESO_MAX;
      for (let k = 0; k < 3; k++) {
        const rr = 26 + ((t * 90 + k * 30) % 60);
        c.strokeStyle = 'rgba(255,255,255,' + (0.5 - rr / 200).toFixed(2) + ')';
        c.lineWidth = 3;
        c.beginPath(); c.arc(hx, hy - 90, rr, 0, TAU); c.stroke();
      }
      c.fillStyle = '#ffd166';
      G.gfx.rr(c, hx - 40, hy - 118, 80 * Math.max(0, p), 8, 4); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 2;
      G.gfx.rr(c, hx - 40, hy - 118, 80, 8, 4); c.stroke();
    }
    if (hero.tonto > 0) {
      for (let k = 0; k < 3; k++) {
        const a = t * 7 + (k / 3) * TAU;
        G.gfx.star(c, hx + Math.cos(a) * 24, hy - 66 + Math.sin(a) * 7, 7, '#ffd166', a);
      }
    }

    // teias, redes e estrelas a voar
    for (const s of teias) {
      c.save(); c.translate(s.x - camX, sy(s.alt)); c.rotate(s.rot);
      c.fillStyle = '#f4f7ff';
      c.beginPath(); c.arc(0, 0, 9, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-13, 0); c.lineTo(13, 0); c.moveTo(0, -13); c.lineTo(0, 13); c.stroke();
      c.restore();
    }
    // redes: grandes e com halo, para se verem a chegar no escuro e dar para fugir
    for (const r of redes) {
      const x = r.x - camX, y = sy(r.alt);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4;
      const gg = c.createRadialGradient(x, y, 2, x, y, 48);
      gg.addColorStop(0, '#bcd4ff'); gg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gg; c.beginPath(); c.arc(x, y, 48, 0, TAU); c.fill();
      c.restore();
      c.save(); c.translate(x, y); c.rotate(r.rot);
      c.fillStyle = 'rgba(180,200,255,.22)';
      c.beginPath(); c.arc(0, 0, 27, 0, TAU); c.fill();
      malha(c, 27, 7, 'rgba(255,255,255,.98)', 1);
      c.fillStyle = '#dfe7fb';
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * TAU;
        c.beginPath(); c.arc(Math.cos(a) * 27, Math.sin(a) * 27, 4.5, 0, TAU); c.fill();
      }
      c.restore();
    }
    for (const s of tiros) G.gfx.star(c, s.x - camX, sy(s.alt), 13, '#ffd166', s.t * 4);

    // teia gigante a abrir (a malha põe o seu próprio alpha, por isso vai por parâmetro)
    if (giga > 0) {
      c.save(); c.translate(hx, hy - 40);
      malha(c, gigaR, 12, 'rgba(255,255,255,.95)', Math.min(1, giga * 1.3));
      malha(c, gigaR * 0.62, 10, 'rgba(220,235,255,.9)', Math.min(1, giga * 1.1));
      c.restore();
    }

    for (const p of puffs) {
      c.globalAlpha = Math.max(0, 0.75 * (1 - p.t / p.life));
      c.fillStyle = p.cor;
      c.beginPath(); c.arc(p.x - camX, sy(p.alt), p.r, 0, TAU); c.fill();
      c.globalAlpha = 1;
    }
    for (const s of sparks) {
      c.globalAlpha = Math.max(0, 1 - s.t / s.life);
      G.gfx.star(c, s.x - camX, sy(s.alt), 7, s.col, s.t * 6);
      c.globalAlpha = 1;
    }

    c.restore();

    /* ---------- HUD: tudo por desenhos (ele ainda não lê) ---------- */
    G.gfx.star(c, 36, 46, 18, '#ffd166', 0);
    G.gfx.label(c, '' + G.state.stars, 64, 47, 32, '#b56b00');

    // escorpiãozinho amigo + quantos já são
    c.save(); c.translate(30, 106); c.scale(0.46, 0.46);
    escorpiaoArt(c, t, { cor: '#f4a261', walk: t * 4, amigo: true, cauda: 0, teia: 0 });
    c.restore();
    G.gfx.label(c, '' + salvos, 66, 94, 28, '#e07a3a');

    // barra da teia gigante: bolinhas de teia que se enchem
    for (let k = 0; k < GIGA_NEED; k++) {
      const x = 26 + k * 30, y = 138;
      c.save(); c.translate(x + 10, y + 8);
      c.fillStyle = k < meter ? '#ffffff' : 'rgba(255,255,255,.22)';
      c.beginPath(); c.arc(0, 0, 11, 0, TAU); c.fill();
      malha(c, 11, 6, k < meter ? 'rgba(120,140,200,.9)' : 'rgba(255,255,255,.45)', 1);
      c.restore();
    }
    if (meter >= GIGA_NEED && giga <= 0) {          // raio desenhado (emoji no canvas fica feio)
      const pulso = 1 + Math.sin(t * 8) * 0.12;
      c.save(); c.translate(26 + GIGA_NEED * 30 + 18, 146); c.scale(pulso, pulso);
      c.fillStyle = '#ffd166';
      c.beginPath();
      c.moveTo(2, -16); c.lineTo(-8, 2); c.lineTo(-1, 2); c.lineTo(-3, 16);
      c.lineTo(9, -3); c.lineTo(1, -3); c.closePath();
      c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
      c.restore();
    }
  };

  S.debug = function () {
    const vivos = maus.filter(function (x) { return x.state === 'walk' || x.state === 'flee'; });
    return {
      x: Math.round(hero.x), alt: Math.round(hero.alt), grounded: hero.grounded,
      preso: +hero.preso.toFixed(2), tonto: +hero.tonto.toFixed(2),
      maus: vivos.length, caudas: vivos.map(function (m) { return m.cauda; }),
      pacotes: maus.filter(function (m) { return m.state === 'preso'; }).length,
      amigos: amigos.length, salvos: salvos, apanhados: apanhados, nivel: nivel(),
      meter: meter, giga: +giga.toFixed(2), teias: teias.length, redes: redes.length,
      tiros: tiros.length, stars: G.state.stars,
      redesX: redes.map(function (r) { return Math.round(r.x - camX); }),
      canhoes: Object.keys(canhoes).length,
      festas: Object.keys(canhoes).filter(function (k) { return canhoes[k].festa; }).length
    };
  };

  // só para testes: força uma rede em cima de nós e expõe os desenhos
  S.api = {
    rede: function () { apanhadoPorRede(hero.x, hero.alt + 40); },
    art: { viuva: viuvaArt, escorpiao: escorpiaoArt, pacote: pacoteArt, canhao: canhaoArt, malha: malha }
  };

  G.scenes = G.scenes || {};
  G.scenes.viuvas = S;
})();
