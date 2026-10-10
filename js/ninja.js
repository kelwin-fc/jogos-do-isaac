/* Cena 6 — Os Ninjas (ditada pelo Isaac).
   Os ninjas atacam os ladrões quando os ladrões atacam. O ladrão desaparece numa nuvem
   de fumo, transforma-se em BOM e volta como ninja que fica connosco — o primeiro é o Kai.

   2.ª ronda (pedido do Isaac: "os inimigos são muito fáceis e fica muita desordem"):
   a equipa amiga passou a ter só 3 ninjas (dispara devagar, o ecrã percebe-se), e os
   inimigos passaram a dar luta — ninja de ESCUDO (só se acerta com a guarda em baixo),
   ninja SALTADOR (salta por cima das estrelas) e o CHEFE das sombras (4 toques, atira
   bolas de fumo). Regras de paz na mesma: ninguém se magoa, só há fumo e cambalhotas. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  const RUN = 300, JUMPV = 720, GRAV = 1500;
  const SLOT = 520;              // um "pedaço" de caminho
  const SHURI = 660;             // velocidade da estrela ninja
  const MAXTRAIL = 3;            // equipa pequena de propósito: com 8 não se percebia nada
  const SPIN_NEED = 5;           // ladrões apanhados por NÓS para carregar o tornado
  const MAXSHURI = 10;
  const TEAM = [
    { n: 'Kai', c: '#e63946' }, { n: 'Jay', c: '#3aa8ff' }, { n: 'Cole', c: '#4a4e69' },
    { n: 'Zane', c: '#cfefff' }, { n: 'Nya', c: '#ff5d8f', ela: true }, { n: 'Lloyd', c: '#7ae582' },
    { n: 'Rita', c: '#b388ff', ela: true }, { n: 'Tomo', c: '#ff924c' }
  ];

  let hero, maus, friends, mestre, shuris, bolas, puffs, sparks, coins, trail;
  let camX, camY, fireCd, spin, meter, salvos, spawnT, petals, hint, avisado, proxChefe;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function h01(n) { const s = Math.sin(n * 127.1) * 43758.5; return s - Math.floor(s); }

  // ecrãs baixinhos desenham o mundo mais pequeno (igual ao jogo da Barbie)
  function vscale() { return Math.min(1, G.H / 620); }
  function vw() { return G.W / vscale(); }
  function vh() { return G.H / vscale(); }

  function nivel() { return Math.min(5, 1 + Math.floor(salvos / 6)); }

  /* ---------- caminho infinito: chão + plataformas de caixotes ---------- */
  function platAt(i) {
    if (i < 1 || h01(i * 3.7 + 0.9) < 0.3) return null;
    return {
      x: i * SLOT + 120 + h01(i * 5.3) * 160,
      w: 150 + Math.floor(h01(i * 2.1) * 3) * 50,
      alt: 120 + Math.floor(h01(i * 7.7) * 3) * 42
    };
  }
  function starsAt(i) {         // estrelinhas para apanhar pelo caminho (3 por pedaço)
    const p = platAt(i);
    const out = [];
    for (let k = 0; k < 3; k++) {
      const x = i * SLOT + 110 + k * 150 + h01(i * 9.1 + k) * 60;
      const emCima = p && x > p.x - 20 && x < p.x + p.w + 20;
      out.push({ x: x, alt: (emCima ? p.alt : 0) + 62 + h01(i * 4.3 + k) * 46 });
    }
    return out;
  }
  function solidAlt(x, alt, prevAlt) {
    const i = Math.floor(x / SLOT);
    for (let k = i - 1; k <= i + 1; k++) {
      const p = platAt(k);
      if (p && x >= p.x - 10 && x <= p.x + p.w + 10 && prevAlt >= p.alt - 4 && alt <= p.alt) return p.alt;
    }
    return alt <= 0 ? 0 : null;
  }

  /* ---------- ciclo da cena ---------- */
  S.enter = function () {
    hero = { x: 140, alt: 0, vy: 0, dir: 1, walk: 0, grounded: true, inv: 0, strike: 0, tonto: 0 };
    maus = []; friends = []; mestre = null; shuris = []; bolas = [];
    puffs = []; sparks = []; coins = {}; trail = [];
    camX = 0; camY = 0; fireCd = 0; spin = 0; meter = 0; salvos = 0;
    spawnT = 1.2; hint = 5; avisado = false; proxChefe = 8;
    petals = [];
    for (let i = 0; i < 26; i++) petals.push({ x: Math.random(), y: Math.random(), s: 3 + Math.random() * 4, v: 0.1 + Math.random() * 0.2 });
    for (let i = 0; i < 2; i++) novoMau(760 + i * 420, 'simples');
    G.banner('Atira estrelas ninja aos ladrões! ⚡', 3200);
  };

  function novoMau(x, kind) {
    const m = {
      x: x, alt: 0, vy: 0, dir: -1, kind: kind, state: 'walk', t: rnd(0, 6),
      cd: 0, bag: 0, flee: 0, lunge: 0, guard: false, gT: rnd(0.6, 1.8),
      pulaCd: 0, tiroCd: 2.2, pisca: 0, dashCd: 2.5
    };
    m.hp = kind === 'chefe' ? 4 : (kind === 'escudo' ? 2 : 1);
    maus.push(m);
  }

  function escolherKind() {
    const n = nivel(), r = Math.random();
    if (n <= 1) return 'simples';
    if (n === 2) return r < 0.6 ? 'simples' : 'escudo';
    if (n === 3) return r < 0.42 ? 'simples' : (r < 0.76 ? 'escudo' : 'saltador');
    return r < 0.3 ? 'simples' : (r < 0.66 ? 'escudo' : 'saltador');
  }

  function spark(x, alt, n, col) {
    for (let i = 0; i < n; i++) sparks.push({ x: x, alt: alt, vx: rnd(-140, 140), vy: rnd(40, 230), t: 0, life: rnd(0.4, 0.9), col: col });
  }
  function puff(x, alt, n) {
    for (let i = 0; i < (n || 9); i++) puffs.push({ x: x + rnd(-16, 16), alt: alt + rnd(0, 40), r: rnd(14, 30), t: 0, life: rnd(0.5, 0.9) });
    G.audio.sfx('poof');
  }
  function tonto(quantas) {                      // levar um toque: cambalhota, sem magoar
    if (hero.inv > 0 || spin > 0) return;
    hero.inv = 1.2; hero.tonto = 1.2;
    const levou = Math.min(quantas, G.state.stars);
    if (levou > 0) G.state.stars -= levou;
    G.audio.sfx('ouch'); G.shake = 0.3;
    spark(hero.x, hero.alt + 60, 8, '#ffd166');
    return levou;
  }

  function atirar(x, alt, dir, dono) {
    if (shuris.length >= MAXSHURI) return;
    // x0 limita o alcance: sem isso uma só estrela varria o ecrã todo
    shuris.push({ x: x + dir * 30, x0: x, alt: alt + 46, dir: dir, rot: 0, dono: dono });
    G.audio.sfx('ninja');
  }

  // porMim = fui EU que acertei (só isso carrega o tornado)
  function virarBom(m, porMim) {
    m.state = 'smoke'; m.t = 0; m.devolve = m.bag; m.bag = 0; m.meu = !!porMim;
    puff(m.x, m.alt + 30, m.kind === 'chefe' ? 18 : 9);
    G.shake = Math.max(G.shake, m.kind === 'chefe' ? 0.5 : 0.22);
  }

  function nascerNinja(m) {
    salvos++;
    if (m.meu) meter = Math.min(SPIN_NEED, meter + 1);
    G.audio.sfx('tada');
    if (m.kind === 'chefe') {                    // o chefe vira Mestre e anda connosco
      mestre = { x: m.x, alt: m.alt, dir: -1, t: 0, bow: 2.2, walk: 0 };
      G.addStars(10 + (m.devolve || 0));
      spark(m.x, m.alt + 60, 30, '#ffd166');
      G.banner('O Mestre das Sombras ficou bom! 🥷✨', 3000);
      return;
    }
    const cheia = friends.length >= MAXTRAIL;
    const info = TEAM[friends.length % TEAM.length];
    G.addStars((cheia ? 2 : 1) + (m.devolve || 0));
    if (cheia) {
      spark(m.x, m.alt + 50, 18, '#ffd166');
      // só de 25 em 25, senão a faixa piscava sem parar
      if (salvos % 25 === 0) G.banner('Já salvámos ' + salvos + ' ladrões! 🏯', 2000);
    } else {
      friends.push({ nome: info.n, cor: info.c, x: m.x, alt: m.alt, dir: -1, t: 0, cd: rnd(0.6, 1.6), bow: 1.4, walk: 0 });
      spark(m.x, m.alt + 50, 16, info.c);
      G.banner('Sou ' + (info.ela ? 'a ' : 'o ') + info.n + '! Agora sou bom 🥷', 2200);
    }
    if (meter >= SPIN_NEED && spin <= 0 && !avisado) {
      avisado = true;
      G.banner('🌪️ TORNADO pronto! Carrega no ⚡', 2600);
    }
  }

  // uma estrela ninja acertou no mau: escudo em cima faz "clang", senão tira um toque
  function acertar(m, porMim, x, alt) {
    if (m.guard) {
      m.pisca = 0.25;
      spark(x, alt, 7, '#dbe4ff');
      G.audio.sfx('boing');
      return;
    }
    m.hp--; m.pisca = 0.3;
    if (m.hp <= 0) virarBom(m, porMim);
    else { spark(x, alt, 6, '#ffd166'); G.audio.sfx('pop'); m.x -= m.dir * 22; }
  }

  S.update = function (dt, t) {
    const W = vw(), inp = G.input;
    hero.inv = Math.max(0, hero.inv - dt);
    hero.tonto = Math.max(0, hero.tonto - dt);
    hero.strike = Math.max(0, hero.strike - dt);
    hint = Math.max(0, hint - dt);
    spin = Math.max(0, spin - dt);

    // andar (a cambalhotar anda-se devagarinho)
    const ax = inp.axis();
    let mv = 0;
    if (inp.isHeld('left')) mv -= 1;
    if (inp.isHeld('right')) mv += 1;
    if (mv === 0) mv = Math.abs(ax.x) > 0.25 ? Math.sign(ax.x) : 0;
    const vel = RUN * (spin > 0 ? 1.8 : (hero.tonto > 0 ? 0.45 : 1));
    if (mv !== 0) {
      hero.x = Math.max(60, hero.x + mv * vel * dt);
      hero.dir = mv; hero.walk += dt * 11;
    }
    camX = Math.max(-30, hero.x - W * 0.42);

    if ((inp.justPressed('jump') || inp.justPressed('up')) && hero.grounded) {
      hero.vy = JUMPV; hero.grounded = false; G.audio.sfx('hop');
    }
    const prevAlt = hero.alt;
    hero.vy -= GRAV * dt; hero.alt += hero.vy * dt;
    const chao = solidAlt(hero.x, hero.alt, prevAlt);
    hero.grounded = false;
    if (hero.vy <= 0 && chao !== null) { hero.alt = chao; hero.vy = 0; hero.grounded = true; }

    // rasto medido por DISTÂNCIA (por tempo, ao parar os amigos empilhavam-se)
    if (!trail.length || Math.abs(trail[0].x - hero.x) > 12 || Math.abs(trail[0].alt - hero.alt) > 26) {
      trail.unshift({ x: hero.x, alt: hero.alt, dir: hero.dir });
      if (trail.length > (MAXTRAIL + 2) * 5 + 12) trail.pop();
    }

    // atacar: estrela ninja, ou TORNADO se estiver carregado
    fireCd -= dt;
    if ((inp.justPressed('fire') || inp.isHeld('fire')) && fireCd <= 0 && hero.tonto <= 0) {
      if (meter >= SPIN_NEED && spin <= 0) {
        spin = 2.6; meter = 0; fireCd = 0.6; avisado = false;
        G.audio.sfx('tornado'); G.shake = 0.5;
        G.banner('🌪️ SPINJITZU! Todos a rodar!', 2400);
        for (const f of friends) f.spinT = 2.6;
      } else {
        fireCd = 0.34; hero.strike = 0.18;
        atirar(hero.x, hero.alt, hero.dir, 'eu');
      }
    }

    // estrelas ninja a voar (com mira assistida em altura)
    for (let i = shuris.length - 1; i >= 0; i--) {
      const s = shuris[i];
      s.x += s.dir * SHURI * dt; s.rot += dt * 22;
      if (Math.abs(s.x - s.x0) > 620) { shuris.splice(i, 1); continue; }
      let alvo = null, md = 700;
      for (const m of maus) {
        if (m.state === 'smoke' || m.state === 'ido') continue;
        const dx = (m.x - s.x) * s.dir;
        if (dx > -20 && dx < md) { md = dx; alvo = m; }
      }
      if (alvo) {
        const quer = alvo.alt + 44;
        s.alt += Math.max(-460 * dt, Math.min(460 * dt, quer - s.alt));
      }
      let bateu = false;
      for (const m of maus) {
        if (m.state === 'smoke' || m.state === 'ido') continue;
        if (Math.abs(s.x - m.x) < 38 && Math.abs(s.alt - (m.alt + 44)) < 56) {
          acertar(m, s.dono === 'eu', s.x, s.alt); bateu = true; break;
        }
      }
      if (bateu) shuris.splice(i, 1);
    }

    // bolas de fumo do chefe (lentas, se acertarem fazem cambalhota)
    for (let i = bolas.length - 1; i >= 0; i--) {
      const b = bolas[i];
      b.x += b.dir * 230 * dt; b.vy -= 620 * dt; b.alt += b.vy * dt; b.rot += dt * 5;
      if (b.alt <= 0 || Math.abs(b.x - hero.x) > W) { puff(b.x, Math.max(6, b.alt), 5); bolas.splice(i, 1); continue; }
      if (Math.abs(b.x - hero.x) < 40 && Math.abs(b.alt - (hero.alt + 46)) < 58) {
        puff(b.x, b.alt, 7); bolas.splice(i, 1);
        if (tonto(1) !== undefined) G.banner('Bola de fumo! Salta por cima 💨', 1800);
      }
    }

    // tornado: quem estiver perto fica bom (o chefe leva 2 toques em vez de tudo)
    if (spin > 0) {
      for (const m of maus) {
        if (m.state === 'smoke' || m.state === 'ido') continue;
        let perto = Math.abs(m.x - hero.x) < 230;
        if (!perto) for (const f of friends) if (Math.abs(m.x - f.x) < 190) { perto = true; break; }
        if (!perto) continue;
        if (m.kind === 'chefe') { m.hp -= 2; m.pisca = 0.3; if (m.hp <= 0) virarBom(m, true); }
        else virarBom(m, false);
      }
    }

    // ---- inimigos ----
    for (let i = maus.length - 1; i >= 0; i--) {
      const m = maus[i];
      m.t += dt; m.cd = Math.max(0, m.cd - dt); m.lunge = Math.max(0, m.lunge - dt);
      m.pisca = Math.max(0, m.pisca - dt); m.pulaCd = Math.max(0, m.pulaCd - dt);
      if (m.state === 'smoke') { if (m.t > 0.55) { nascerNinja(m); m.state = 'ido'; } continue; }
      if (m.state === 'ido') { maus.splice(i, 1); continue; }

      // guarda do escudo (e do chefe): sobe e desce, é a janela para acertar
      if (m.kind === 'escudo' || m.kind === 'chefe') {
        m.gT -= dt;
        if (m.gT <= 0) { m.guard = !m.guard; m.gT = m.guard ? rnd(1.5, 2.4) : rnd(0.9, 1.4); }
      }

      const pa = m.alt;
      m.vy -= GRAV * dt; m.alt += m.vy * dt;
      const c2 = solidAlt(m.x, m.alt, pa);
      const noChao = m.vy <= 0 && c2 !== null;
      if (noChao) { m.alt = c2; m.vy = 0; }

      const d = hero.x - m.x;

      // O chefe é mais lento do que nós: sem isto ficava para trás para sempre e
      // nunca chegava a ser apanhado. Dá um salto de fumo e reaparece à nossa frente.
      m.dashCd = Math.max(0, m.dashCd - dt);
      if (m.kind === 'chefe' && d > 520 && m.dashCd <= 0) {
        puff(m.x, m.alt + 40, 10);
        m.x = hero.x + 430; m.alt = 0; m.vy = 0; m.dashCd = 3.5; m.dir = -1;
        puff(m.x, m.alt + 40, 10);
        G.audio.sfx('whoosh');
      }
      // Os outros são mais lentos do que nós: quando ficam para trás desistem e vão-se
      // embora. Tem de ser depressa, senão enchem a conta de inimigos vivos, deixam de
      // aparecer ladrões à nossa frente e o jogo encrava (medido: ficava parado nos 4).
      if (m.kind !== 'chefe' && m.x < camX - 700) { m.state = 'ido'; continue; }

      // o saltador salta por cima das estrelas que vêm a caminho
      if (m.kind === 'saltador' && noChao && m.pulaCd <= 0) {
        for (const s of shuris) {
          if ((m.x - s.x) * s.dir > 0 && Math.abs(s.x - m.x) < 210) {
            m.vy = 640; m.pulaCd = 1.1; break;
          }
        }
      }

      if (m.state === 'flee') {
        m.flee -= dt; m.x += m.dir * 250 * dt;
        if (m.flee <= 0) { m.state = 'walk'; m.dir = Math.sign(d) || -1; }
      } else {
        m.dir = Math.sign(d) || -1;
        const vBase = m.kind === 'chefe' ? 155 : (m.kind === 'saltador' ? 215 : 190);
        m.x += m.dir * (Math.abs(d) < 700 ? vBase : vBase * 0.7) * dt;

        // o chefe atira bolas de fumo de longe
        if (m.kind === 'chefe') {
          m.tiroCd -= dt;
          if (m.tiroCd <= 0 && Math.abs(d) < 640 && Math.abs(d) > 90) {
            m.tiroCd = rnd(1.9, 2.8);
            bolas.push({ x: m.x + m.dir * 26, alt: m.alt + 60, vy: 190, dir: m.dir, rot: 0 });
            G.audio.sfx('whoosh');
          }
        }

        // ataca-nos: cambalhota e leva estrelas (é aqui que os ninjas têm de atacar)
        if (Math.abs(d) < 54 && Math.abs(m.alt - hero.alt) < 70 && m.cd <= 0) {
          m.cd = 1.6; m.lunge = 0.35;
          if (spin > 0) { virarBom(m, false); }
          else if (hero.inv <= 0) {
            const levou = tonto(m.kind === 'chefe' ? 3 : 2);
            if (levou > 0) { m.bag += levou; G.banner('Levaram ' + levou + ' ⭐! Apanha-os ⚡', 1800); }
            else { G.audio.sfx('giggle'); }
            if (m.kind !== 'chefe') { m.state = 'flee'; m.flee = 2.2; m.dir = -Math.sign(d) || -1; }
          }
        }
      }
      if (m.x < camX - 950) m.x = camX - 950;
    }

    // ---- amigos: poucos e devagar, para se perceber o que se passa ----
    for (let k = 0; k < friends.length; k++) {
      const f = friends[k];
      f.t += dt; f.bow = Math.max(0, f.bow - dt); f.cd -= dt;
      f.spinT = Math.max(0, (f.spinT || 0) - dt);
      const alvo = trail[Math.min(trail.length - 1, (k + 1) * 5)];
      if (alvo && f.bow <= 0) {
        const dx = alvo.x - 6 - f.x;
        f.x += dx * Math.min(1, dt * 6.5);
        f.alt += (alvo.alt - f.alt) * Math.min(1, dt * 8);
        if (Math.abs(dx) > 6) { f.dir = Math.sign(dx); f.walk += dt * 11; }
      }
      if (f.cd <= 0) {
        let melhor = null, md = 260;                 // só ajudam de perto
        for (const m of maus) {
          if (m.state === 'smoke' || m.state === 'ido') continue;
          const dd = Math.abs(m.x - f.x);
          if (dd < md) { md = dd; melhor = m; }
        }
        if (melhor) { f.cd = 3.2; f.dir = Math.sign(melhor.x - f.x) || 1; atirar(f.x, f.alt, f.dir, f.nome); }
        else f.cd = 0.5;
      }
    }
    if (mestre) {                                    // o Mestre acompanha mas não dispara
      mestre.t += dt; mestre.bow = Math.max(0, mestre.bow - dt);
      const alvo = trail[Math.min(trail.length - 1, (MAXTRAIL + 1) * 5)];
      if (alvo && mestre.bow <= 0) {
        const dx = alvo.x - 6 - mestre.x;
        mestre.x += dx * Math.min(1, dt * 6);
        mestre.alt += (alvo.alt - mestre.alt) * Math.min(1, dt * 8);
        if (Math.abs(dx) > 6) { mestre.dir = Math.sign(dx); mestre.walk += dt * 9; }
      }
    }

    // estrelas a apanhar
    const i0 = Math.floor((camX - 600) / SLOT), i1 = Math.floor((camX + W + 900) / SLOT);
    for (let i = Math.max(0, i0); i <= i1; i++) {
      const lista = starsAt(i);
      for (let k = 0; k < lista.length; k++) {
        const chave = i + ':' + k;
        if (coins[chave]) continue;
        const s = lista[k];
        if (Math.abs(s.x - hero.x) < 46 && Math.abs(s.alt - (hero.alt + 48)) < 72) {
          coins[chave] = 1; G.addStars(1); G.audio.sfx('star'); spark(s.x, s.alt, 5, '#ffd166');
        }
      }
    }
    for (const k in coins) if (parseInt(k, 10) < i0 - 6) delete coins[k];

    // ---- quem aparece: poucos ao mesmo tempo, mas duros ----
    const vivos = maus.filter(function (x) { return x.state === 'walk' || x.state === 'flee'; }).length;
    const temChefe = maus.some(function (x) { return x.kind === 'chefe' && x.state !== 'ido'; });
    if (!temChefe && salvos >= proxChefe) {
      proxChefe = salvos + 12;
      novoMau(hero.x + W * 0.62, 'chefe');
      G.audio.sfx('roar');
      G.banner('Cuidado! O Mestre das Sombras! 🥷🔥', 2800);
    }
    spawnT -= dt;
    const maxMaus = Math.min(6, 3 + Math.floor(nivel() / 2));
    if (spawnT <= 0 && vivos < maxMaus) {
      spawnT = Math.max(0.9, rnd(1.8, 2.8) - nivel() * 0.15);
      novoMau(hero.x + (Math.random() < 0.8 ? W * 0.6 : -W * 0.55) + rnd(-40, 40), escolherKind());
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.t += dt; s.x += s.vx * dt; s.alt += s.vy * dt; s.vy -= 420 * dt;
      if (s.t > s.life) sparks.splice(i, 1);
    }
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      p.t += dt; p.alt += 34 * dt; p.r += 26 * dt;
      if (p.t > p.life) puffs.splice(i, 1);
    }
    for (const p of petals) {
      p.y += p.v * dt; p.x += Math.sin(t * 0.8 + p.s) * 0.02 * dt;
      if (p.y > 1.1) { p.y = -0.1; p.x = Math.random(); }
    }

    const want = Math.max(0, hero.alt + 150 - vh() * 0.62);
    camY += (want - camY) * Math.min(1, dt * 4);
  };

  /* ---------- desenho ---------- */
  function sy(alt) { return vh() * 0.84 - alt + camY; }
  function bub(c, x, y, txt) {
    G.gfx.bubble(c, Math.max(96, Math.min(vw() - 96, x)), Math.max(52, y), txt);
  }

  function ninjaArt(c, t, o) {   // base nos pés (y=0), virado para a direita
    const cor = o.cor || '#2f9e44';
    const walk = o.walk || 0;
    const l1 = Math.sin(walk) * 11, l2 = -Math.sin(walk) * 11;
    if (o.spin) {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 5; k++) {
        c.globalAlpha = 0.3; c.fillStyle = cor;
        c.beginPath(); c.ellipse(Math.sin(t * 24 + k) * 6, -20 - k * 16, 34 - k * 3, 12, 0, 0, TAU); c.fill();
      }
      c.restore();
    }
    c.strokeStyle = '#22223b'; c.lineWidth = 9; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-4, -34); c.lineTo(-4 + l1 * 0.6, -4); c.stroke();
    c.beginPath(); c.moveTo(6, -34); c.lineTo(6 + l2 * 0.6, -4); c.stroke();
    c.fillStyle = '#111'; c.beginPath();
    c.arc(-4 + l1 * 0.6, -3, 6, 0, TAU); c.arc(6 + l2 * 0.6, -3, 6, 0, TAU); c.fill();
    G.gfx.rr(c, -14, -64, 30, 34, 11); c.fillStyle = cor; c.fill();
    c.fillStyle = 'rgba(0,0,0,.25)'; G.gfx.rr(c, -14, -46, 30, 7, 3); c.fill();
    c.strokeStyle = cor; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-12, -60);
    c.quadraticCurveTo(-34, -56 + Math.sin(t * 6) * 8, -46, -40 + Math.cos(t * 5) * 8); c.stroke();
    c.strokeStyle = '#22223b'; c.lineWidth = 8;
    c.beginPath(); c.moveTo(8, -56);
    if (o.strike) c.lineTo(34, -58); else c.lineTo(22, -44 + Math.sin(t * 3) * 3);
    c.stroke();
    c.beginPath(); c.arc(1, -80, 15, 0, TAU); c.fillStyle = cor; c.fill();
    c.fillStyle = '#ffd9b3'; G.gfx.rr(c, -8, -86, 22, 11, 5); c.fill();
    c.fillStyle = '#22223b';
    c.beginPath(); c.arc(-1, -81, 2.3, 0, TAU); c.arc(8, -81, 2.3, 0, TAU); c.fill();
  }

  function mestreArt(c, t) {
    c.save(); c.scale(1.4, 1.4);
    ninjaArt(c, t, { cor: '#7b2cbf', walk: 0 });
    c.fillStyle = '#e9c46a';                       // chapéu de palha
    c.beginPath(); c.moveTo(-30, -88); c.quadraticCurveTo(1, -122, 32, -88); c.closePath(); c.fill();
    c.strokeStyle = '#b08968'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-30, -88); c.lineTo(32, -88); c.stroke();
    c.restore();
  }

  function mauArt(c, t, o) {
    const chefe = o.kind === 'chefe';
    const hop = o.state === 'flee' ? Math.abs(Math.sin(t * 12)) * 7 : Math.abs(Math.sin(t * 5)) * 3;
    c.save();
    if (chefe) c.scale(1.35, 1.35);
    c.translate(o.lunge > 0 ? 8 : 0, -hop);
    if (o.pisca > 0) c.globalAlpha = 0.55;
    const fato = chefe ? '#4c1d95' : (o.kind === 'saltador' ? '#7f5539' : '#4c5c8a');
    // pernas
    c.strokeStyle = '#3a3a5c'; c.lineWidth = 8; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-5, -30); c.lineTo(-5 + Math.sin(t * 9) * 8, -2); c.stroke();
    c.beginPath(); c.moveTo(5, -30); c.lineTo(5 - Math.sin(t * 9) * 8, -2); c.stroke();
    // corpo
    G.gfx.rr(c, -15, -62, 30, 34, 10); c.fillStyle = fato; c.fill();
    if (!chefe && o.kind !== 'saltador') {
      c.fillStyle = 'rgba(255,255,255,.6)';
      for (let k = 0; k < 3; k++) { G.gfx.rr(c, -15, -58 + k * 11, 30, 5, 3); c.fill(); }
    }
    if (o.bag > 0) {
      c.save(); c.translate(-22, -44); c.rotate(Math.sin(t * 8) * 0.2);
      c.fillStyle = '#e8e2d0'; c.beginPath(); c.arc(0, 0, 13, 0, TAU); c.fill();
      G.gfx.star(c, 0, 0, 7, '#ffd166', t); c.restore();
    }
    c.strokeStyle = fato; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(10, -54); c.lineTo(o.lunge > 0 ? 30 : 22, -46); c.stroke();
    // cabeça e máscara
    c.beginPath(); c.arc(0, -74, 14, 0, TAU); c.fillStyle = '#ffd9b3'; c.fill();
    c.fillStyle = '#2b2d42'; c.beginPath(); c.arc(0, -78, 14.5, Math.PI, 0); c.fill();
    G.gfx.rr(c, -14, -78, 28, 9, 4); c.fillStyle = '#2b2d42'; c.fill();
    c.fillStyle = chefe ? '#ff4d6d' : '#2b2d42';
    c.beginPath(); c.arc(5, -74, 2.4, 0, TAU); c.arc(-5, -74, 2.4, 0, TAU); c.fill();
    if (o.kind === 'saltador') {                   // fita da testa a esvoaçar
      c.strokeStyle = '#e63946'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(-12, -82);
      c.quadraticCurveTo(-28, -80 + Math.sin(t * 9) * 8, -40, -70 + Math.cos(t * 8) * 8); c.stroke();
    }
    if (chefe) {                                   // chapéu cónico + cachecol
      c.fillStyle = '#3a0ca3';
      c.beginPath(); c.moveTo(-26, -84); c.quadraticCurveTo(0, -118, 26, -84); c.closePath(); c.fill();
      c.strokeStyle = '#ff4d6d'; c.lineWidth = 5;
      c.beginPath(); c.moveTo(-10, -62);
      c.quadraticCurveTo(-30, -58 + Math.sin(t * 5) * 8, -44, -46); c.stroke();
    }
    // escudo: em cima tapa, em baixo é a nossa janela para acertar
    if (o.kind === 'escudo' || chefe) {
      c.save();
      if (o.guard) c.translate(20, -50); else { c.translate(14, -18); c.rotate(0.9); }
      c.fillStyle = '#8a5a2b'; c.beginPath(); c.ellipse(0, 0, 13, 24, 0, 0, TAU); c.fill();
      c.strokeStyle = '#d9a066'; c.lineWidth = 3; c.stroke();
      c.fillStyle = '#d9a066'; c.beginPath(); c.arc(0, 0, 5, 0, TAU); c.fill();
      c.restore();
    }
    c.restore();
    // corações de toques que faltam (só chefe e escudo)
    if ((chefe || o.kind === 'escudo') && o.hp > 0) {
      c.fillStyle = '#ff4d6d';
      for (let k = 0; k < o.hp; k++) c.fillRect(-14 + k * 11, chefe ? -160 : -104, 8, 8);
    }
  }

  function shuriArt(c, rot) {
    c.save(); c.rotate(rot);
    c.fillStyle = '#dbe4ff';
    c.beginPath();
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * TAU;
      c.lineTo(Math.cos(a) * 15, Math.sin(a) * 15);
      c.lineTo(Math.cos(a + 0.39) * 5, Math.sin(a + 0.39) * 5);
    }
    c.closePath(); c.fill();
    c.strokeStyle = '#7f8bb8'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#22223b'; c.beginPath(); c.arc(0, 0, 3, 0, TAU); c.fill();
    c.restore();
  }

  function lantern(c, x, y, t) {
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x, y - 60); c.lineTo(x, y - 22); c.stroke();
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5;
    const g = c.createRadialGradient(x, y, 4, x, y, 66);
    g.addColorStop(0, '#ffb703'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, 66, 0, TAU); c.fill();
    c.restore();
    c.fillStyle = '#ef476f';
    c.beginPath(); c.ellipse(x, y, 15, 20, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,220,150,.85)';
    c.beginPath(); c.ellipse(x, y, 9, 14, 0, 0, TAU); c.fill();
    c.fillStyle = '#22223b';
    c.fillRect(x - 8, y - 22, 16, 5); c.fillRect(x - 8, y + 17, 16, 5);
  }

  S.draw = function (c, t) {
    const vs = vscale(), W = vw(), H = vh();
    c.save(); c.scale(vs, vs);

    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#141a3d'); g.addColorStop(0.55, '#3b2a63'); g.addColorStop(1, '#7b3f6e');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (let k = 0; k < 40; k++) {
      const x = ((k * 173 - camX * 0.05) % (W + 200) + W + 200) % (W + 200) - 100;
      const y = 20 + h01(k) * H * 0.55;
      c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.4 + k));
      c.fillStyle = '#fff'; c.fillRect(x, y, 2.5, 2.5);
    }
    c.globalAlpha = 1;
    c.fillStyle = '#fff3bf';
    c.beginPath(); c.arc(W * 0.82, H * 0.16, Math.min(W, H) * 0.075, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)';
    c.beginPath(); c.arc(W * 0.79, H * 0.14, 9, 0, TAU); c.arc(W * 0.85, H * 0.19, 6, 0, TAU); c.fill();

    for (let k = -1; k < W / 320 + 2; k++) {
      const bx = k * 320 - ((camX * 0.3) % 320);
      const bh = 150 + h01(Math.round((camX * 0.3 + k * 320) / 320)) * 120;
      c.fillStyle = 'rgba(20,20,50,.55)';
      c.fillRect(bx + 40, sy(0) - bh, 150, bh);
      for (let r = 0; r < 3; r++) {
        const ry = sy(0) - bh + r * (bh / 3);
        c.beginPath();
        c.moveTo(bx + 10, ry + 16); c.quadraticCurveTo(bx + 115, ry - 22, bx + 220, ry + 16);
        c.lineTo(bx + 200, ry + 22); c.quadraticCurveTo(bx + 115, ry - 4, bx + 30, ry + 22);
        c.closePath(); c.fill();
      }
    }
    for (let k = -1; k < W / 130 + 2; k++) {
      const bx = k * 130 - ((camX * 0.6) % 130);
      const hgt = 220 + h01(Math.round((camX * 0.6 + k * 130) / 130)) * 160;
      c.strokeStyle = 'rgba(60,120,80,.55)'; c.lineWidth = 12; c.lineCap = 'round';
      c.beginPath(); c.moveTo(bx, sy(0)); c.lineTo(bx + Math.sin(t * 0.6 + k) * 6, sy(hgt)); c.stroke();
    }

    c.fillStyle = '#2b2140'; c.fillRect(0, sy(0), W, H);
    c.fillStyle = '#3d2f57'; c.fillRect(0, sy(0), W, 16);
    c.strokeStyle = 'rgba(255,255,255,.09)'; c.lineWidth = 3;
    for (let k = 0; k < W / 90 + 2; k++) {
      const x = k * 90 - (camX % 90);
      c.beginPath(); c.moveTo(x, sy(0)); c.lineTo(x - 14, sy(0) + 70); c.stroke();
    }

    const i0 = Math.floor((camX - 600) / SLOT), i1 = Math.floor((camX + W + 600) / SLOT);
    for (let i = Math.max(0, i0); i <= i1; i++) {
      const p = platAt(i);
      if (p) {
        const x = p.x - camX, py = sy(p.alt);
        c.fillStyle = '#8a5a2b'; G.gfx.rr(c, x, py, p.w, 20, 6); c.fill();
        c.fillStyle = '#6b4423';
        for (let k = 0; k < p.w / 50; k++) c.fillRect(x + 8 + k * 50, py + 22, 12, 26);
        c.fillStyle = '#c1440e';
        G.gfx.rr(c, x - 8, py - 9, p.w + 16, 11, 5); c.fill();
      }
      if (h01(i * 8.3) > 0.45) lantern(c, i * SLOT + 400 - camX, sy(240) + Math.sin(t + i) * 6, t);
      const lista = starsAt(i);
      for (let k = 0; k < lista.length; k++) {
        if (coins[i + ':' + k]) continue;
        const s = lista[k];
        G.gfx.star(c, s.x - camX, sy(s.alt) + Math.sin(t * 3 + i + k) * 5, 15, '#ffd166', t * 1.2);
      }
    }

    c.fillStyle = 'rgba(255,190,220,.75)';
    for (const p of petals) {
      c.beginPath();
      c.ellipse(((p.x * W - camX * 0.2) % W + W) % W, p.y * H, p.s, p.s * 0.6, t + p.s, 0, TAU);
      c.fill();
    }

    for (const m of maus) {
      if (m.state === 'smoke' || m.state === 'ido') continue;
      const x = m.x - camX;
      if (x < -160 || x > W + 160) continue;
      c.save(); c.translate(x, sy(m.alt));
      if (m.dir < 0) c.scale(-1, 1);
      mauArt(c, t + m.t, m);
      c.restore();
      if (m.kind === 'chefe' && Math.sin(t * 1.6) > 0.3) bub(c, x, sy(m.alt) - 168, 'Hehe! 😼');
      else if (m.state === 'flee') bub(c, x, sy(m.alt) - 104, 'Fujo! 😆');
    }

    for (const f of friends) {
      const x = f.x - camX;
      if (x < -140 || x > W + 140) continue;
      c.save(); c.translate(x, sy(f.alt));
      if (f.dir < 0) c.scale(-1, 1);
      ninjaArt(c, t + f.t, { cor: f.cor, walk: f.walk, spin: f.spinT > 0 });
      c.restore();
      if (f.bow > 0) bub(c, x, sy(f.alt) - 108, 'Sou o ' + f.nome + '! 🥷');
    }
    if (mestre) {
      const x = mestre.x - camX;
      c.save(); c.translate(x, sy(mestre.alt));
      if (mestre.dir < 0) c.scale(-1, 1);
      mestreArt(c, t + mestre.t);
      c.restore();
      if (mestre.bow > 0) bub(c, x, sy(mestre.alt) - 150, 'Obrigado, ninja! 🙏');
    }

    // o nosso ninja
    const hx = hero.x - camX, hy = sy(hero.alt);
    c.save(); c.translate(hx, hy);
    if (hero.tonto > 0) c.rotate(Math.sin(t * 18) * 0.18);
    if (hero.dir < 0) c.scale(-1, 1);
    c.globalAlpha = hero.inv > 0 && Math.floor(t * 10) % 2 === 0 ? 0.55 : 1;
    ninjaArt(c, t, { cor: '#2f9e44', walk: hero.grounded ? hero.walk : 0, strike: hero.strike > 0, spin: spin > 0 });
    c.restore();
    if (hero.tonto > 0) {                       // estrelinhas a rodar na cabeça
      for (let k = 0; k < 3; k++) {
        const a = t * 7 + (k / 3) * TAU;
        G.gfx.star(c, hx + Math.cos(a) * 24, hy - 104 + Math.sin(a) * 7, 7, '#ffd166', a);
      }
    }

    for (const s of shuris) { c.save(); c.translate(s.x - camX, sy(s.alt)); shuriArt(c, s.rot); c.restore(); }
    for (const b of bolas) {                    // bola de fumo do chefe (roxo escuro)
      c.save(); c.translate(b.x - camX, sy(b.alt)); c.rotate(b.rot);
      c.fillStyle = '#3a0ca3'; c.beginPath(); c.arc(0, 0, 15, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(200,180,255,.9)'; c.lineWidth = 3;
      c.beginPath(); c.arc(0, 0, 8, 0.4, 4.2); c.stroke();
      c.restore();
    }
    for (const p of puffs) {
      c.globalAlpha = Math.max(0, 0.75 * (1 - p.t / p.life));
      c.fillStyle = '#dfe3ee';
      c.beginPath(); c.arc(p.x - camX, sy(p.alt), p.r, 0, TAU); c.fill();
      c.globalAlpha = 1;
    }
    for (const s of sparks) {
      c.globalAlpha = Math.max(0, 1 - s.t / s.life);
      G.gfx.star(c, s.x - camX, sy(s.alt), 7, s.col, s.t * 6);
      c.globalAlpha = 1;
    }

    c.restore();

    // HUD
    G.gfx.star(c, 36, 46, 18, '#ffd166', 0);
    G.gfx.label(c, '' + G.state.stars, 64, 47, 32, '#b56b00');
    G.gfx.label(c, '🥷 ' + salvos + '   nível ' + nivel(), 24, 90, 26, '#22223b', 'left');
    for (let k = 0; k < SPIN_NEED; k++) {
      G.gfx.rr(c, 24 + k * 30, 110, 24, 14, 6);
      c.fillStyle = k < meter ? '#4cc9f0' : 'rgba(255,255,255,.35)'; c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.stroke();
    }
    // sem emoji: o 🌪️ desenhado no canvas fica com um glifo estranho
    if (meter >= SPIN_NEED && spin <= 0) G.gfx.label(c, '⚡ TORNADO!', 24, 146, 24, '#0b5f80', 'left');
  };

  S.debug = function () {
    const conta = {};
    for (const m of maus) if (m.state === 'walk' || m.state === 'flee') conta[m.kind] = (conta[m.kind] || 0) + 1;
    return {
      x: Math.round(hero.x), alt: Math.round(hero.alt), grounded: hero.grounded,
      maus: maus.filter(function (x) { return x.state === 'walk' || x.state === 'flee'; }).length,
      tipos: conta, amigos: friends.length, mestre: !!mestre, salvos: salvos, nivel: nivel(),
      meter: meter, spin: +spin.toFixed(1), tonto: +hero.tonto.toFixed(1),
      stars: G.state.stars, shuris: shuris.length, bolas: bolas.length
    };
  };

  G.scenes = G.scenes || {};
  G.scenes.ninja = S;
})();
