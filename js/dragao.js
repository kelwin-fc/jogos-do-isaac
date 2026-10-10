/* Mini-jogo 12 — O DRAGÃO: PORTO x BENFICA (ditado pelo Isaac).
   Era o "Mini Plix" do martelo; o Isaac mudou as regras: nada de fazer desaparecer
   ninguém — agora é futebol a sério, visto de cima, no estádio do Dragão.

   O campo está DEITADO (as balizas ficam à esquerda e à direita, como na televisão) e
   é o maior que couber no ecrã: as bancadas são só uma moldura fina, porque o que
   interessa é o jogo. O Porto ataca para a direita.

   Tem guarda-redes nas duas balizas (senão nunca se marcava golo) — e eles enganam-se
   de vez em quando, atirando-se para o lado errado —, golos, faltas com apito do
   árbitro, pontapés livres, GRANDES PENALIDADES (a bater e a defender), marcador com
   o tempo, a ola nas bancadas, holofotes e o dragão pintado.

   Regras de paz: ninguém se magoa. Numa falta o jogador cai sentado e levanta-se a
   rir, o árbitro apita e a bola muda de dono — não há cartões nem discussões. No fim
   do jogo as duas equipas festejam e recomeça outro.

   Mini-jogo 14 — O CLÁSSICO: BARÇA x REAL MADRID (pedido do Isaac a 2026-09-19:
   "eu sou de Barcelona e o Real Madrid é contra mim, futebol como é de verdade").
   É o mesmo motor, com outras equipas e outro estádio (o Camp Nou, blaugrana), e
   com o que o futebol a sério tem a mais: duas partes e INTERVALO aos 45'.

   Cada estádio é um `cfg` passado a criaJogo(); o Dragão ficou exatamente igual. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;

  function criaJogo(cfg) {
    const S = {};

    // dir = +1 ataca para a direita, -1 ataca para a esquerda
    const EQ = cfg.eq;
    const NOSSA = cfg.nossa, DELES = cfg.deles;
    // quem ataca para a direita marca na baliza da direita
    const DIREITA = EQ[NOSSA].dir > 0 ? NOSSA : DELES, ESQUERDA = DIREITA === NOSSA ? DELES : NOSSA;

    // guarda-redes + 5 de campo.
    // fa = avanço: 0 na própria baliza, 1 na baliza adversária; fl = largura (0 a 1)
    const FORMACAO = [
      { fl: 0.50, fa: 0.045, gk: true, num: 1 },
      { fl: 0.26, fa: 0.24, num: 2 },
      { fl: 0.74, fa: 0.24, num: 3 },
      { fl: 0.50, fa: 0.44, num: 8 },
      { fl: 0.32, fa: 0.68, num: 11 },
      { fl: 0.68, fa: 0.68, num: 7 }
    ];

    let jogadores, bola, meu, arbitro, parts, bancada, holofotes;
    let fase, ft, golos, relogio, penalti, ola, ultimoDono, trocaT, avisoT, segundaParte;
    let ultimoGolo = DELES, livreDe = NOSSA, dica = false, ultimoCampo = null;

    // fases em que a bola não está a rolar (ninguém a disputa)
    function jogoParado() {
      return fase === 'golo' || fase === 'fim' || fase === 'falta' ||
        fase === 'penalti' || fase === 'defesa' || fase === 'intervalo';
    }

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function lerp(a, b, k) { return a + (b - a) * k; }
    function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

    /* ================= geometria (campo deitado) ================= */
    // o maior relvado que couber: mede-se as duas hipóteses e fica a maior.
    // (A) descer até ao fundo do ecrã, com a largura a passar ENTRE os botões 👟/🤝;
    // (B) usar a largura toda e parar acima deles.
    function medida(maxW, maxH) {
      let w = maxW, h = w / 1.5;                       // proporção de um campo a sério
      if (h > maxH) { h = maxH; w = Math.min(maxW, h * 1.75); }
      else h = Math.min(maxH, w / 1.2);                // sobra altura: engorda o relvado
      if (w / h < 1.2) h = w / 1.2;                    // nunca quase quadrado
      return { w: w, h: h, disp: maxH };
    }
    function campo() {
      const topo = Math.max(G.H * 0.10, 52);           // marcador + moldura de cima
      const margem = Math.max(8, Math.min(G.W, G.H) * 0.03);
      const dispW = Math.max(120, G.W - margem * 2);   // nunca negativo (ecrã ainda a nascer)
      const livre = Math.max(120, (G.W / 2 - 118) * 2);
      const a = medida(Math.min(dispW, livre), Math.max(120, G.H - topo - margem));
      const b = medida(dispW, Math.max(120, G.H - topo - 118));
      const o = a.w * a.h >= b.w * b.h ? a : b;
      const x = (G.W - o.w) / 2, y = topo + (o.disp - o.h) / 2;
      return { x: x, y: y, w: o.w, h: o.h, cx: x + o.w / 2, cy: y + o.h / 2 };
    }
    function raioJ() { const c = campo(); return Math.max(9, c.h * 0.05); }
    function raioB() { return Math.max(5, raioJ() * 0.5); }
    function veloc() { return campo().w * 0.34; }
    function balizaW() { return campo().h * 0.33; }    // boca da baliza (generosa, é para marcar golos)
    function areaW() { return campo().h * 0.62; }      // largura da área
    function areaH() { return campo().w * 0.155; }     // profundidade da área
    function marcaPen() { return campo().w * 0.105; }

    // x da linha de baliza que a equipa DEFENDE / que ATACA
    function linhaDefende(eq) { const c = campo(); return EQ[eq].dir > 0 ? c.x : c.x + c.w; }
    function linhaAtaca(eq) { const c = campo(); return EQ[eq].dir > 0 ? c.x + c.w : c.x; }
    function alvo(eq) { return { x: linhaAtaca(eq), y: campo().cy }; }
    // 0 na própria baliza, 1 na baliza adversária
    function avanco(eq, x) {
      const c = campo();
      return EQ[eq].dir > 0 ? (x - c.x) / c.w : (c.x + c.w - x) / c.w;
    }
    function posForm(eq, fl, fa) {
      const c = campo();
      return {
        x: EQ[eq].dir > 0 ? c.x + c.w * fa : c.x + c.w * (1 - fa),
        y: c.y + c.h * fl
      };
    }
    function naArea(eq, p, folga) {          // dentro da área que a equipa eq defende
      const c = campo();
      const k = folga || 1;
      if (Math.abs(p.y - c.cy) > areaW() * k / 2) return false;
      return EQ[eq].dir > 0 ? p.x < c.x + areaH() * k : p.x > c.x + c.w - areaH() * k;
    }

    /* ================= arranque ================= */
    function novoJogador(eq, f) {
      const p = posForm(eq, f.fl, f.fa);
      return {
        eq: eq, gk: !!f.gk, num: f.num, fl: f.fl, fa: f.fa,
        x: p.x, y: p.y, vx: 0, vy: 0, olha: EQ[eq].dir > 0 ? 0 : Math.PI, passo: rnd(0, TAU),
        cai: 0, festeja: 0, mergulho: 0, pressao: 0
      };
    }

    function sorteia(paleta) {           // [[cor, peso], ...]
      let r = Math.random();
      for (const p of paleta) { r -= p[1]; if (r <= 0) return p[0]; }
      return paleta[paleta.length - 1][0];
    }

    function criarBancada() {
      // paleta de adeptos da casa (a claque visitante fica num cantinho da bancada de
      // cima). Os lugares são colocados em grelha na altura de desenhar, para caber
      // em qualquer feitio de ecrã.
      bancada = [];
      for (let i = 0; i < 240; i++) {
        bancada.push({ col: sorteia(cfg.adeptos), vis: sorteia(cfg.visitantes), ph: rnd(0, TAU) });
      }
      holofotes = [{ x: 0.05, y: 0.06 }, { x: 0.95, y: 0.06 }, { x: 0.05, y: 0.96 }, { x: 0.95, y: 0.96 }];
    }

    function formar() {
      for (const p of jogadores) {
        const q = posForm(p.eq, p.fl, p.fa);
        p.x = q.x; p.y = q.y; p.vx = 0; p.vy = 0;
        p.cai = 0; p.festeja = 0; p.mergulho = 0; p.pressao = 0;
      }
    }

    function pontapeSaida(eq) {              // bola ao centro para a equipa eq
      const c = campo();
      formar();
      bola.x = c.cx; bola.y = c.cy; bola.vx = 0; bola.vy = 0;
      bola.dono = null; bola.livre = 0; bola.voo = 0;
      const dele = jogadores.filter(function (p) { return p.eq === eq && !p.gk; });
      const p = dele[3] || dele[0];
      p.x = c.cx - EQ[eq].dir * raioJ() * 1.6; p.y = c.cy + raioJ() * 1.2;
      daBola(p);                             // quem sai começa com a bola nos pés
      fase = 'saida'; ft = 0;
      G.audio.sfx('whistle');
    }

    S.enter = function () {
      const c = campo();
      golos = {}; golos[NOSSA] = 0; golos[DELES] = 0;
      relogio = 0; parts = []; ola = 0; penalti = null; segundaParte = false;
      ultimoDono = null; trocaT = 0; avisoT = 0; dica = false; ultimoCampo = null;
      criarBancada();
      jogadores = [];
      for (const eq of [NOSSA, DELES]) for (const f of FORMACAO) jogadores.push(novoJogador(eq, f));
      arbitro = { x: c.cx, y: c.cy + c.h * 0.2, passo: 0 };
      bola = { x: c.cx, y: c.cy, vx: 0, vy: 0, rot: 0, dono: null, livre: 0, voo: 0 };
      meu = jogadores.find(function (p) { return p.eq === NOSSA && p.num === 8; });
      pontapeSaida(NOSSA);
      G.audio.sfx('multidao');
      G.banner(cfg.txt.entrada, 3200);
    };

    /* ================= partículas ================= */
    function confetes(x, y, n, cols) {
      for (let i = 0; i < n; i++) {
        const a = rnd(0, TAU), v = rnd(60, 320);
        parts.push({
          x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80,
          rot: rnd(0, TAU), vr: rnd(-9, 9), t: 0, vida: rnd(0.6, 1.4),
          col: cols[(Math.random() * cols.length) | 0], s: rnd(0.7, 1.5)
        });
      }
    }

    /* ================= bola ================= */
    function chuta(p, forca, mira) {
      const a = mira !== undefined ? mira : Math.atan2(alvo(p.eq).y - bola.y, alvo(p.eq).x - bola.x);
      bola.dono = null; bola.livre = 0.28; bola.voo = 0;
      ultimoDono = p;
      bola.vx = Math.cos(a) * forca; bola.vy = Math.sin(a) * forca;
      p.chuto = 0.2;
      G.audio.sfx('kick');
    }

    function daBola(p) {
      bola.dono = p; ultimoDono = p; bola.vx = 0; bola.vy = 0; bola.voo = 0;
      p.pressao = 0;
      if (p.gk) p.segura = 0.9;        // o guarda-redes segura a bola um instante
    }

    // passe para o companheiro mais bem colocado à frente
    function passa(p) {
      const colegas = jogadores.filter(function (q) { return q.eq === p.eq && q !== p && !q.gk && q.cai <= 0; });
      let melhor = null, melhorNota = -1e9;
      for (const q of colegas) {
        const d = dist(p, q);
        if (d < raioJ() * 2) continue;
        const frente = avanco(p.eq, q.x) - avanco(p.eq, p.x);
        let nota = frente * 3 - d / campo().w;
        for (const r of jogadores) {                    // não passar para cima de um adversário
          if (r.eq === p.eq) continue;
          if (dist(r, q) < raioJ() * 2.6) nota -= 1.2;
        }
        if (nota > melhorNota) { melhorNota = nota; melhor = q; }
      }
      if (!melhor) { chuta(p, campo().w * 0.75); return; }
      const a = Math.atan2(melhor.y - bola.y, melhor.x - bola.x);
      const d = dist(bola, melhor);
      bola.dono = null; bola.livre = 0.22; bola.voo = 0; ultimoDono = p;
      bola.vx = Math.cos(a) * (d * 2.4 + 60);
      bola.vy = Math.sin(a) * (d * 2.4 + 60);
      p.chuto = 0.2;
      G.audio.sfx('pop');
    }

    /* ================= faltas ================= */
    function falta(faltoso, vitima) {
      vitima.cai = 1.5;
      bola.dono = null; bola.vx = 0; bola.vy = 0; bola.livre = 0.4; bola.voo = 0;
      bola.x = vitima.x; bola.y = vitima.y;
      G.audio.sfx('apito');
      G.audio.sfx('giggle');
      arbitro.x = lerp(arbitro.x, vitima.x, 0.6); arbitro.y = lerp(arbitro.y, vitima.y, 0.6);
      // à volta da área conta como penálti: as grandes penalidades são a melhor parte
      if (naArea(faltoso.eq, vitima, 1.35)) { marcaPenalti(vitima.eq); return; }
      fase = 'falta'; ft = 0;
      penalti = null;
      livreDe = vitima.eq;
      G.banner(faltoso.eq === NOSSA ? 'Falta nossa! 🤭' : 'Falta! Livre para o ' + cfg.txt.nosso + ' ⚽', 2200);
    }

    function marcaPenalti(eq) {               // eq = quem vai bater
      const c = campo();
      bola.x = linhaAtaca(eq) - EQ[eq].dir * marcaPen(); bola.y = c.cy;
      bola.dono = null; bola.vx = 0; bola.vy = 0; bola.livre = 0; bola.voo = 0;
      penalti = { eq: eq, t: 0, mira: 0, batido: false, pos: 0 };
      fase = eq === NOSSA ? 'penalti' : 'defesa';
      G.audio.sfx('apito');
      G.audio.sfx('multidao');
      G.banner(eq === NOSSA ? 'PENÁLTI! Aponta e chuta 👟' : 'Penálti deles — defende! 🧤', 3000);
      // toda a gente fora da área, menos quem bate e o guarda-redes
      for (const p of jogadores) {
        if (p.gk) continue;
        const fora = posForm(p.eq, p.fl, clamp(p.fa, 0.3, 0.62));
        p.x = fora.x; p.y = fora.y; p.vx = 0; p.vy = 0;
      }
      const bate = jogadores.filter(function (p) { return p.eq === eq && !p.gk; })
        .sort(function (a, b) { return avanco(eq, b.x) - avanco(eq, a.x); })[0];
      penalti.bate = bate;
      bate.x = bola.x - EQ[eq].dir * raioJ() * 2.6; bate.y = bola.y;
      const gr = jogadores.find(function (p) { return p.gk && p.eq !== eq; });
      penalti.gr = gr;
      gr.x = linhaDefende(gr.eq) + EQ[gr.eq].dir * raioJ() * 0.5; gr.y = c.cy;
      gr.erro = undefined;
      if (eq !== NOSSA) meu = gr;
    }

    /* ================= golo ================= */
    function golo(eq) {
      golos[eq]++;
      fase = 'golo'; ft = 0; ultimoGolo = eq;
      penalti = null;
      bola.dono = null; bola.vx = 0; bola.vy = 0;
      G.audio.sfx('golo');
      G.audio.sfx('multidao');
      G.shake = 0.9;
      const cols = EQ[eq].confetes;
      for (let i = 0; i < 5; i++) confetes(rnd(0, G.W), rnd(0, G.H * 0.5), 18, cols);
      for (const p of jogadores) if (p.eq === eq) p.festeja = 3;
      if (eq === NOSSA) { G.addStars(3); G.banner(cfg.txt.goloNosso, 2800); }
      else G.banner(cfg.txt.goloDeles, 2400);
    }

    // aos 45' o árbitro apita para o intervalo; na 2.ª parte sai a outra equipa,
    // como no futebol a sério (as equipas não trocam de campo: para uma criança de
    // 5 anos a nossa baliza fica sempre do mesmo lado)
    function intervalo() {
      fase = 'intervalo'; ft = 0; segundaParte = true;
      penalti = null;
      bola.dono = null; bola.vx = 0; bola.vy = 0;
      G.audio.sfx('apito'); G.audio.sfx('multidao');
      const r = golos[NOSSA] + ' - ' + golos[DELES];
      G.banner('Intervalo! ' + r + ' 🥤', 3000);
    }

    /* ================= ciclo ================= */
    S.update = function (dt, t) {
      ft += dt;
      ola += dt * 0.35;
      avisoT = Math.max(0, avisoT - dt);
      const c = campo(), R = raioJ(), V = veloc();

      // se o ecrã mudar de tamanho (rodar o telemóvel), toda a gente se muda com o campo
      if (ultimoCampo && (Math.abs(ultimoCampo.w - c.w) > 1 || Math.abs(ultimoCampo.h - c.h) > 1)) {
        const kx = c.w / ultimoCampo.w, ky = c.h / ultimoCampo.h;
        if (kx < 0.6 || kx > 1.7 || ky < 0.6 || ky > 1.7) {
          formar();                          // mudança enorme: toda a gente ao seu lugar
          bola.x = c.cx; bola.y = c.cy;
          arbitro.x = c.cx; arbitro.y = c.cy + c.h * 0.2;
        } else {
          const mudar = function (o) {
            o.x = c.x + (o.x - ultimoCampo.x) * kx;
            o.y = c.y + (o.y - ultimoCampo.y) * ky;
          };
          for (const p of jogadores) mudar(p);
          mudar(bola); mudar(arbitro);
        }
      }
      ultimoCampo = c;

      if (fase === 'jogo' || fase === 'falta' || fase === 'saida') relogio += dt * 0.55;   // 90' em ~2:45
      if (!dica && relogio > 2.5) { dica = true; G.banner('👟 remata · 🤝 passa', 2800); }
      // o intervalo só entra com a bola a rolar (não interrompe um penálti a meio)
      if (cfg.intervalo && !segundaParte && relogio >= 45 && (fase === 'jogo' || fase === 'saida')) intervalo();
      if (relogio >= 90 && fase !== 'fim' && fase !== 'golo') {
        fase = 'fim'; ft = 0;
        G.audio.sfx('apito'); G.audio.sfx('multidao');
        const r = golos[NOSSA] + ' - ' + golos[DELES];
        const a = EQ[NOSSA].nome, b = EQ[DELES].nome;
        G.banner(golos[NOSSA] >= golos[DELES] ? 'Fim! ' + a + ' ' + r + ' ' + b + ' 🏆' : 'Fim! ' + a + ' ' + r + ' ' + b + ' 👏', 4000);
        confetes(c.cx, c.cy, 60, EQ[NOSSA].confetes.concat(EQ[DELES].confetes, ['#ffd166']));
        for (const p of jogadores) p.festeja = 5;
      }

      /* ---- quem é o nosso jogador ---- */
      trocaT -= dt;
      if (fase === 'jogo' || fase === 'saida') {
        if (bola.dono && bola.dono.eq === NOSSA && !bola.dono.gk) meu = bola.dono;
        else if (trocaT <= 0) {
          trocaT = 0.3;
          let melhor = meu, melhorD = 1e9;
          for (const p of jogadores) {
            if (p.eq !== NOSSA || p.gk || p.cai > 0) continue;
            const d = dist(p, bola);
            if (d < melhorD) { melhorD = d; melhor = p; }
          }
          if (melhor) meu = melhor;
        }
      }

      /* ---- comandos ---- */
      const ax = G.input.axis();
      if (fase === 'jogo' || fase === 'saida') {
        if (fase === 'saida' && ft > 1) { fase = 'jogo'; ft = 0; }
        if (meu && meu.cai <= 0) {
          const m = Math.hypot(ax.x, ax.y);
          if (m > 0.12) {
            const k = Math.min(1, m);
            meu.vx = lerp(meu.vx, (ax.x / m) * V * k, 0.25);
            meu.vy = lerp(meu.vy, (ax.y / m) * V * k, 0.25);
            meu.olha = Math.atan2(meu.vy, meu.vx);
            meu.passo += dt * 12;
          } else { meu.vx *= 0.8; meu.vy *= 0.8; }
          if (G.input.justPressed('fire')) {
            if (bola.dono === meu) {
              // remate: para onde o jogador está virado, mas puxado para a baliza
              const aBaliza = Math.atan2(alvo(meu.eq).y - bola.y, alvo(meu.eq).x - bola.x);
              const a = Math.hypot(ax.x, ax.y) > 0.35 ? angLerp(meu.olha, aBaliza, 0.45) : aBaliza;
              chuta(meu, c.w * 0.84, a);
            } else if (dist(meu, bola) < R * 2.6) {
              // ao guarda-redes com a bola agarrada não se rouba nada
              if (bola.dono && bola.dono.eq !== NOSSA && !bola.dono.gk) tentaRoubar(meu, bola.dono);
              else if (!bola.dono) { daBola(meu); G.audio.sfx('pop'); }
            } else {
              meu.vx *= 1.6; meu.vy *= 1.6;                  // arranque
              G.audio.sfx('hop');
            }
          }
          if (G.input.justPressed('horn')) {
            if (bola.dono === meu) passa(meu);
            else if (avisoT <= 0) { avisoT = 2; G.audio.sfx('beep'); G.banner('O passe 🤝 é com a bola nos pés', 1800); }
          }
        }
      } else if (fase === 'penalti') {
        penalti.t += dt;
        penalti.mira = clamp(penalti.mira + ax.y * dt * 2.2, -1, 1);
        const bate = penalti.bate;
        bate.y = lerp(bate.y, bola.y, 0.1);
        if (!penalti.batido && (G.input.justPressed('fire') || penalti.t > 8)) {
          penalti.batido = true;
          const destino = { x: linhaAtaca(penalti.eq), y: c.cy + penalti.mira * balizaW() * 0.42 };
          chuta(bate, c.w * 0.72, Math.atan2(destino.y - bola.y, destino.x - bola.x));
        }
        if (penalti.batido) {
          penalti.pos += dt;
          if (penalti.pos > 2.4) { fase = 'jogo'; ft = 0; penalti = null; }
        }
      } else if (fase === 'defesa') {
        penalti.t += dt;
        const gr = penalti.gr;                       // o guarda-redes somos nós
        meu = gr;
        const lim = balizaW() * 0.52;
        gr.y = clamp(gr.y + ax.y * V * 0.9 * dt, c.cy - lim, c.cy + lim);
        gr.x = linhaDefende(gr.eq) + EQ[gr.eq].dir * R * 0.5;
        if (!penalti.batido && penalti.t > 2.6) {
          penalti.batido = true;
          const destino = { x: linhaAtaca(penalti.eq), y: c.cy + rnd(-0.42, 0.42) * balizaW() };
          chuta(penalti.bate, c.w * 0.6, Math.atan2(destino.y - bola.y, destino.x - bola.x));
        }
        if (penalti.batido) {
          penalti.pos += dt;
          if (penalti.pos > 2.4) { fase = 'jogo'; ft = 0; penalti = null; }
        }
      } else if (fase === 'falta') {
        if (ft > 1.1) {
          fase = 'jogo'; ft = 0;
          bola.livre = 0.1;
          const colegas = jogadores.filter(function (p) { return p.eq === livreDe && !p.gk && p.cai <= 0; });
          let melhor = null, md = 1e9;
          for (const p of colegas) { const d = dist(p, bola); if (d < md) { md = d; melhor = p; } }
          if (melhor) { melhor.x = bola.x - EQ[melhor.eq].dir * R * 1.2; melhor.y = bola.y + R * 0.6; daBola(melhor); }
          G.audio.sfx('whistle');
        }
      } else if (fase === 'golo') {
        if (ft > 3.2) pontapeSaida(ultimoGolo === NOSSA ? DELES : NOSSA);
      } else if (fase === 'intervalo') {
        // toda a gente volta ao seu lugar a passo; a 2.ª parte começa com a bola deles
        if (ft > 3.4) { pontapeSaida(DELES); G.banner('2.ª parte! ⚽', 1800); }
      } else if (fase === 'fim') {
        if (ft > 6) S.enter();
      }

      /* ---- jogadores ---- */
      for (const p of jogadores) {
        p.chuto = Math.max(0, (p.chuto || 0) - dt);
        p.festeja = Math.max(0, p.festeja - dt);
        p.mergulho = Math.max(0, p.mergulho - dt);
        if (p.cai > 0) {
          p.cai -= dt;
          p.vx *= 0.8; p.vy *= 0.8;
          p.x += p.vx * dt; p.y += p.vy * dt;
          continue;
        }
        if (p.gk || p !== meu || jogoParado()) cerebro(p, dt);
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (Math.hypot(p.vx, p.vy) > 8) p.passo += dt * 11;
        // ninguém sai do relvado nem entra dentro da baliza
        p.x = clamp(p.x, c.x + R * 0.3, c.x + c.w - R * 0.3);
        p.y = clamp(p.y, c.y + R * 0.4, c.y + c.h - R * 0.4);
        for (const q of jogadores) {                 // não se atropelam
          if (q === p) continue;
          const d = dist(p, q);
          if (d < R * 1.9 && d > 0.01) {
            const k = (R * 1.9 - d) / d * 0.5;
            p.x += (p.x - q.x) * k * 0.5; p.y += (p.y - q.y) * k * 0.5;
          }
        }
      }

      /* ---- bola ---- */
      bola.livre = Math.max(0, bola.livre - dt);
      bola.voo = Math.max(0, bola.voo - dt);
      if (bola.dono) {
        const p = bola.dono;
        const a = Math.hypot(p.vx, p.vy) > 12 ? Math.atan2(p.vy, p.vx) : p.olha;
        p.olha = a;
        const rb = raioB();
        bola.x = clamp(lerp(bola.x, p.x + Math.cos(a) * R * 1.15, 0.45), c.x + rb, c.x + c.w - rb);
        bola.y = clamp(lerp(bola.y, p.y + Math.sin(a) * R * 1.15, 0.45), c.y + rb, c.y + c.h - rb);
        bola.rot += Math.hypot(p.vx, p.vy) * dt * 0.05;
      } else {
        bola.x += bola.vx * dt; bola.y += bola.vy * dt;
        bola.rot += Math.hypot(bola.vx, bola.vy) * dt * 0.03;
        bola.vx *= Math.pow(0.42, dt); bola.vy *= Math.pow(0.42, dt);
        const rb = raioB();
        // PRIMEIRO vê-se quem apanha a bola: senão um remate encostado à linha passava
        // através do guarda-redes e era golo na mesma
        if (fase !== 'golo' && fase !== 'fim' && fase !== 'falta' && fase !== 'intervalo') {
          let dono = null, md = 1e9;
          for (const p of jogadores) {
            if (p.cai > 0) continue;
            if (p === ultimoDono && bola.livre > 0) continue;   // quem chutou não se cola à bola
            if (bola.voo > 0 && ultimoDono && p.eq !== ultimoDono.eq) continue;  // pontapé de baliza no ar
            const alcance = p.gk
              ? R * (p.eq === NOSSA ? (p.mergulho > 0 ? 2.3 : 1.8) : (p.mergulho > 0 ? 2.0 : 1.6))
              : R * 1.5;
            const d = dist(p, bola);
            if (d < alcance && d < md) { md = d; dono = p; }
          }
          if (dono) {
            daBola(dono);
            if (dono.gk) G.audio.sfx('boing');
          }
        }
        if (!bola.dono) {
          // linhas de cima e de baixo: a bola bate na tabela e volta (sem laterais)
          if (bola.y < c.y + rb) { bola.y = c.y + rb; bola.vy = Math.abs(bola.vy) * 0.75; G.audio.sfx('hop'); }
          if (bola.y > c.y + c.h - rb) { bola.y = c.y + c.h - rb; bola.vy = -Math.abs(bola.vy) * 0.75; G.audio.sfx('hop'); }
          // linhas de baliza: golo ou ressalto
          for (const lado of [-1, 1]) {
            const lx = lado < 0 ? c.x : c.x + c.w;
            const passou = lado < 0 ? bola.x < lx + rb * 0.2 : bola.x > lx - rb * 0.2;
            if (!passou) continue;
            if (Math.abs(bola.y - c.cy) < balizaW() / 2 && fase !== 'golo' && fase !== 'fim' && fase !== 'intervalo') {
              golo(lado < 0 ? ESQUERDA : DIREITA);
            } else {
              bola.x = lado < 0 ? lx + rb : lx - rb;
              bola.vx = -bola.vx * 0.7;
              G.audio.sfx('hop');
            }
          }
        }
      }

      /* ---- pressão sobre quem tem a bola (roubos e faltas) ---- */
      if (bola.dono && fase === 'jogo') {
        const d0 = bola.dono;
        let perto = null, md = 1e9;
        for (const p of jogadores) {
          if (p.eq === d0.eq || p.cai > 0 || p === meu) continue;
          const d = dist(p, d0);
          if (d < md) { md = d; perto = p; }
        }
        if (perto && md < R * 2 && !d0.gk) {
          d0.pressao += dt;
          // sem isto o jogo era só faltas: primeiro tenta-se sempre roubar a bola
          if (d0.pressao > (d0 === meu ? 0.9 : 0.7)) {
            d0.pressao = 0;
            if (Math.random() < (d0 === meu ? 0.55 : 0.8)) { daBola(perto); G.audio.sfx('pop'); }
            else falta(perto, d0);
          }
        } else d0.pressao = Math.max(0, d0.pressao - dt);
      }

      /* ---- árbitro: anda sempre perto da jogada ---- */
      const aa = Math.atan2(bola.y - arbitro.y, bola.x - arbitro.x);
      if (dist(arbitro, bola) > c.h * 0.35) {
        arbitro.x += Math.cos(aa) * V * 0.5 * dt;
        arbitro.y += Math.sin(aa) * V * 0.5 * dt;
        arbitro.passo += dt * 9;
      }
      arbitro.x = clamp(arbitro.x, c.x + 6, c.x + c.w - 6);
      arbitro.y = clamp(arbitro.y, c.y + 6, c.y + c.h - 6);

      /* ---- partículas ---- */
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.t += dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vy += 420 * dt; p.vx *= 0.99; p.rot += p.vr * dt;
        if (p.t > p.vida) parts.splice(i, 1);
      }
    };

    function angLerp(a, b, k) {               // interpolar ângulos pelo caminho curto
      const d = ((b - a + Math.PI * 3) % TAU) - Math.PI;
      return a + d * k;
    }

    function tentaRoubar(p, dono) {
      if (Math.random() < 0.7) { daBola(p); G.audio.sfx('pop'); G.banner('Roubaste a bola! 👏', 1200); }
      else falta(p, dono);
    }

    /* ================= cérebro dos outros ================= */
    function cerebro(p, dt) {
      const c = campo(), R = raioJ(), V = veloc();
      const parado = jogoParado();
      // o guarda-redes com a bola na mão devolve-a ao jogo mesmo com o jogo parado
      if (p.gk && bola.dono === p && fase !== 'penalti' && fase !== 'defesa' && fase !== 'intervalo') { cerebroGR(p, dt); return; }
      if (fase === 'intervalo') {                  // intervalo: cada um volta ao seu lugar a passo
        const q = posForm(p.eq, p.fl, p.fa);
        const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1;
        if (d < R * 0.5) { p.vx *= 0.8; p.vy *= 0.8; return; }
        p.vx = lerp(p.vx, dx / d * V * 0.35, 0.1); p.vy = lerp(p.vy, dy / d * V * 0.35, 0.1);
        p.olha = Math.atan2(p.vy, p.vx);
        return;
      }
      if (parado) {
        if (p.festeja > 0) {                       // festejar é correr aos pulos
          p.vx = lerp(p.vx, Math.cos(p.passo) * V * 0.5, 0.1);
          p.vy = lerp(p.vy, Math.sin(p.passo * 0.7) * V * 0.4, 0.1);
          p.passo += dt * 6;
        } else { p.vx *= 0.85; p.vy *= 0.85; }
        return;
      }

      if (p.gk) { cerebroGR(p, dt); return; }

      let tx, ty, vel = V * 0.78;
      const nossa = bola.dono && bola.dono.eq === p.eq;
      if (bola.dono === p) {
        // conduzir para a baliza, a fugir do adversário mais perto
        const al = alvo(p.eq);
        let ang = Math.atan2(al.y - p.y, al.x - p.x);
        let advPerto = null, md = 1e9;
        for (const q of jogadores) {
          if (q.eq === p.eq) continue;
          const d = dist(q, p);
          if (d < md) { md = d; advPerto = q; }
        }
        if (advPerto && md < R * 5) ang += (p.y < advPerto.y ? -0.7 : 0.7) * (1 - md / (R * 5));
        tx = p.x + Math.cos(ang) * 100; ty = p.y + Math.sin(ang) * 100;
        vel = V * 0.82;
        const nosso = p.eq === NOSSA;
        const dBaliza = Math.abs(p.x - al.x);
        if (dBaliza < c.w * 0.34 && (p.chuto || 0) <= 0 && Math.random() < (nosso ? 0.04 : 0.03)) {
          // eles rematam com menos pontaria: muitas vezes vai ao lado
          const abre = balizaW() * (nosso ? 0.34 : 0.42);
          chuta(p, c.w * 0.72, Math.atan2((al.y + rnd(-1, 1) * abre) - bola.y, al.x - bola.x));
        } else if (Math.random() < 0.012) passa(p);
      } else if (nossa) {                          // temos a bola: subir e abrir
        const q = posForm(p.eq, clamp(p.fl + (bola.y - c.cy) / c.h * 0.3, 0.08, 0.92), clamp(p.fa + 0.18, 0, 0.92));
        tx = q.x; ty = q.y; vel = V * 0.66;
      } else {
        // não temos a bola: o mais perto vai buscá-la, os outros marcam a formação
        let maisPerto = null, md = 1e9;
        for (const q of jogadores) {
          if (q.eq !== p.eq || q.gk || q.cai > 0) continue;
          const d = dist(q, bola);
          if (d < md) { md = d; maisPerto = q; }
        }
        if (bola.dono && bola.dono.gk) {
          // a bola está agarrada pelo guarda-redes adversário: ninguém lha vai tirar,
          // afastam-se todos e esperam pelo pontapé (senão ficavam colados a ele)
          const gr = bola.dono;
          const dGr = dist(p, gr) || 1;
          if (dGr < R * 5.5) {
            tx = p.x + (p.x - gr.x) / dGr * R * 6;
            ty = p.y + (p.y - gr.y) / dGr * R * 6;
            vel = V * 0.7;
          } else {
            const q = posForm(p.eq, clamp(p.fl + (bola.y - c.cy) / c.h * 0.2, 0.08, 0.92), clamp(p.fa, 0.15, 0.9));
            tx = q.x; ty = q.y; vel = V * 0.55;
          }
        } else if (maisPerto === p) {
          tx = bola.x; ty = bola.y; vel = V * 0.8;
        } else {
          const q = posForm(p.eq, clamp(p.fl + (bola.y - c.cy) / c.h * 0.28, 0.08, 0.92), clamp(p.fa - 0.12, 0.08, 0.9));
          tx = q.x; ty = q.y; vel = V * 0.6;
        }
      }
      let dx = tx - p.x, dy = ty - p.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < R * 0.5) { p.vx *= 0.8; p.vy *= 0.8; return; }
      p.vx = lerp(p.vx, (dx / d) * vel, 0.12);
      p.vy = lerp(p.vy, (dy / d) * vel, 0.12);
      p.olha = Math.atan2(p.vy, p.vx);
    }

    function cerebroGR(p, dt) {
      const c = campo(), R = raioJ(), V = veloc();
      const linha = linhaDefende(p.eq);
      const dentro = EQ[p.eq].dir;                  // para onde fica o relvado
      p.olha = Math.atan2(bola.y - p.y, bola.x - p.x);
      if (bola.dono === p) {                        // agarrou: devolve ao jogo
        p.segura = (p.segura === undefined ? 0.9 : p.segura) - dt;
        if (p.segura <= 0) {
          let melhor = null, melhorNota = -1e9;
          for (const q of jogadores) {
            if (q.eq !== p.eq || q.gk || q.cai > 0) continue;
            let nota = dist(q, p) / c.w;            // quanto mais longe da baliza, melhor
            for (const r of jogadores) {
              if (r.eq === p.eq) continue;
              if (dist(r, q) < R * 3) nota -= 1.5;  // desmarcado
            }
            if (nota > melhorNota) { melhorNota = nota; melhor = q; }
          }
          const al = alvo(p.eq);
          const a = melhor && melhorNota > -1
            ? Math.atan2(melhor.y - p.y, melhor.x - p.x)
            : Math.atan2(al.y - p.y, al.x - p.x);   // ninguém livre: manda para longe
          chuta(p, c.w * 0.62, a);
          bola.voo = 0.5;                           // a bola vai pelo ar até ao colega
        }
        p.vx *= 0.8; p.vy *= 0.8;
        return;
      }
      // fica na linha a seguir a bola e, se vier um remate, adivinha para que lado ela
      // vai — e às vezes ENGANA-SE, que é o que faz um guarda-redes ser divertido
      const lim = balizaW() * 0.55;
      let ty = clamp(c.cy + (bola.y - c.cy) * 0.75, c.cy - lim, c.cy + lim);
      let rapido = 1;
      const vindo = !bola.dono && (dentro > 0 ? bola.vx < 0 : bola.vx > 0);
      if (!vindo) p.erro = undefined;               // erro novo a cada remate
      if (vindo && Math.abs(bola.vx) > c.w * 0.18) {
        const tempo = Math.abs((linha - bola.x) / bola.vx);
        const cruza = bola.y + bola.vy * tempo;
        if (Math.abs(cruza - c.cy) < balizaW()) {
          if (p.erro === undefined) {
            // de vez em quando atira-se para o lado errado (o nosso engana-se menos)
            p.errado = Math.random() < (p.eq === NOSSA ? 0.25 : 0.45);
            p.erro = rnd(-1, 1) * balizaW() * (p.eq === NOSSA ? 0.3 : 0.5);
          }
          const destino = p.errado ? c.cy - (cruza - c.cy) * 0.9 : cruza + p.erro;
          ty = clamp(destino, c.cy - lim, c.cy + lim);
          rapido = p.eq === NOSSA ? 2.1 : 1.35;     // mergulho
          p.mergulho = 0.4;
        }
      }
      const perto = Math.abs(bola.x - linha) < c.w * 0.2;
      let tx = linha + dentro * (perto ? R * 0.5 : R * 1.1);
      // com a bola dentro da área e nos pés do adversário, sai da baliza a fechar o ângulo
      const ameaca = (!bola.dono || bola.dono.eq !== p.eq) && naArea(p.eq, bola);
      if (ameaca && !vindo) {
        tx = lerp(linha, bola.x, 0.4);
        ty = lerp(c.cy, bola.y, 0.4);
        rapido = 1.3;
      }
      p.vx = lerp(p.vx, (tx - p.x) * 3.2, 0.2);
      p.vy = lerp(p.vy, (ty - p.y) * 4, 0.3);
      const vmax = V * 0.6 * rapido;
      const v = Math.hypot(p.vx, p.vy);
      if (v > vmax) { p.vx = p.vx / v * vmax; p.vy = p.vy / v * vmax; }
    }

    /* ================= desenho ================= */
    function fundo(c, t) {
      const cp = campo();
      c.fillStyle = '#0f1424'; c.fillRect(0, 0, G.W, G.H);
      const bandas = {
        topo: { x: 0, y: 0, w: G.W, h: cp.y },
        baixo: { x: 0, y: cp.y + cp.h, w: G.W, h: G.H - (cp.y + cp.h) },
        esq: { x: 0, y: cp.y, w: cp.x, h: cp.h },
        dir: { x: cp.x + cp.w, y: cp.y, w: G.W - (cp.x + cp.w), h: cp.h }
      };
      for (const k in bandas) {
        const b = bandas[k];
        if (b.w <= 2 || b.h <= 2) continue;
        const g = c.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
        g.addColorStop(0, '#1b2440'); g.addColorStop(1, '#101728');
        c.fillStyle = g; c.fillRect(b.x, b.y, b.w, b.h);
      }
      // adeptos em grelha larga (a moldura é fina de propósito: o que interessa é o jogo)
      const r = Math.max(1.4, Math.min(G.W, G.H) * 0.0055);
      const passo = Math.max(11, Math.min(G.W, G.H) * 0.042);
      let n = 0;
      for (const k in bandas) {
        const b = bandas[k];
        if (b.w <= passo || b.h <= passo) continue;
        const horiz = k === 'topo' || k === 'baixo';
        const cols = Math.max(1, Math.floor(b.w / passo));
        const filas = Math.max(1, Math.floor(b.h / passo));
        for (let f = 0; f < filas; f++) {
          for (let i = 0; i < cols; i++) {
            const s = bancada[(n++) % bancada.length];
            const x = b.x + (i + 0.5 + (f % 2) * 0.35) * (b.w / cols);
            const y = b.y + (f + 0.5) * (b.h / filas);
            const u = horiz ? (i + 0.5) / cols : (f + 0.5) / filas;
            const visitante = k === 'topo' && u > 0.82;
            const sobe = Math.max(0, Math.sin((u * 3 - ola) * TAU)) * r * 2.4;
            c.globalAlpha = 0.5 + 0.4 * Math.abs(Math.sin(t * 2 + s.ph));
            c.fillStyle = visitante ? s.vis : s.col;
            c.beginPath(); c.arc(x, y - sobe, r, 0, TAU); c.fill();
          }
        }
      }
      c.globalAlpha = 1;
      for (let i = 0; i < 2; i++) {                 // flashes das máquinas fotográficas
        if (Math.sin(t * 7 + i * 2.3) > 0.985) {
          c.fillStyle = '#fff'; c.globalAlpha = 0.8;
          c.beginPath(); c.arc(rnd(0, G.W), rnd(0, Math.max(4, cp.y)), r * 1.8, 0, TAU); c.fill();
          c.globalAlpha = 1;
        }
      }
      for (const h of holofotes) {                  // holofotes
        const x = h.x * G.W, y = h.y * G.H;
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.2;
        const g = c.createRadialGradient(x, y, 2, x, y, Math.min(G.W, G.H) * 0.35);
        g.addColorStop(0, '#fff9d6'); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g; c.beginPath(); c.arc(x, y, Math.min(G.W, G.H) * 0.35, 0, TAU); c.fill();
        c.restore();
        c.fillStyle = '#e9edf7';
        G.gfx.rr(c, x - r * 3, y - r * 1.6, r * 6, r * 3.2, r); c.fill();
      }
    }

    function relva(c, tDes) {
      const cp = campo();
      c.fillStyle = '#2f8f4e';
      G.gfx.rr(c, cp.x, cp.y, cp.w, cp.h, 4); c.fill();
      const faixas = 12;
      for (let i = 0; i < faixas; i += 2) {
        c.fillStyle = 'rgba(255,255,255,.05)';
        c.fillRect(cp.x + (cp.w / faixas) * i, cp.y, cp.w / faixas, cp.h);
      }
      cfg.pintura(c, tDes, cp);
      const lw = Math.max(1.5, cp.h * 0.008);
      c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = lw;
      c.strokeRect(cp.x + lw, cp.y + lw, cp.w - lw * 2, cp.h - lw * 2);
      c.beginPath(); c.moveTo(cp.cx, cp.y); c.lineTo(cp.cx, cp.y + cp.h); c.stroke();
      c.beginPath(); c.arc(cp.cx, cp.cy, cp.h * 0.15, 0, TAU); c.stroke();
      c.beginPath(); c.arc(cp.cx, cp.cy, lw * 1.2, 0, TAU); c.fillStyle = '#fff'; c.fill();
      for (const lado of [-1, 1]) {
        const lx = lado < 0 ? cp.x : cp.x + cp.w;
        const dentro = -lado;                       // a área cresce para dentro do campo
        c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = lw;
        c.strokeRect(lx, cp.cy - areaW() / 2, areaH() * dentro, areaW());
        c.strokeRect(lx, cp.cy - areaW() * 0.21, areaH() * 0.42 * dentro, areaW() * 0.42);
        c.beginPath();
        c.arc(lx + marcaPen() * dentro, cp.cy, lw * 1.1, 0, TAU);
        c.fillStyle = '#fff'; c.fill();
        for (const s of [-1, 1]) {                  // bandeirolas de canto
          const y = cp.cy + s * cp.h / 2;
          c.strokeStyle = '#fff'; c.lineWidth = lw * 0.8;
          c.beginPath(); c.moveTo(lx, y); c.lineTo(lx + dentro * cp.w * 0.018, y); c.stroke();
          c.fillStyle = '#ffd166';
          c.beginPath();
          c.moveTo(lx + dentro * cp.w * 0.018, y);
          c.lineTo(lx + dentro * cp.w * 0.012, y - s * cp.h * 0.05);
          c.lineTo(lx + dentro * cp.w * 0.006, y);
          c.closePath(); c.fill();
        }
        // baliza com rede, desenhada para fora da linha
        const bw = balizaW(), prof = cp.w * 0.028;
        c.fillStyle = 'rgba(255,255,255,.16)';
        c.fillRect(lado < 0 ? lx - prof : lx, cp.cy - bw / 2, prof, bw);
        c.strokeStyle = '#fff'; c.lineWidth = lw * 1.4;
        c.strokeRect(lado < 0 ? lx - prof : lx, cp.cy - bw / 2, prof, bw);
        c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1;
        for (let i = 1; i < 8; i++) {
          const y = cp.cy - bw / 2 + (bw / 8) * i;
          c.beginPath();
          c.moveTo(lado < 0 ? lx - prof : lx, y); c.lineTo(lado < 0 ? lx : lx + prof, y);
          c.stroke();
        }
      }
    }

    function sombra(c, x, y, r) {
      c.fillStyle = 'rgba(0,0,0,.25)';
      c.beginPath(); c.ellipse(x, y + r * 0.7, r * 0.95, r * 0.4, 0, 0, TAU); c.fill();
    }

    function desenhaJogador(c, p, t) {
      const R = raioJ();
      const e = EQ[p.eq];
      sombra(c, p.x, p.y, R);
      c.save();
      c.translate(p.x, p.y);
      if (p.cai > 0) c.rotate(Math.sin(t * 12) * 0.35 + 0.6);
      else if (p.mergulho > 0) c.rotate((p.y < campo().cy ? -1 : 1) * 0.9);
      c.strokeStyle = '#f0c9a0'; c.lineWidth = R * 0.26; c.lineCap = 'round';
      const sw = Math.sin(p.passo) * R * 0.35;
      c.beginPath(); c.moveTo(-R * 0.3, R * 0.35); c.lineTo(-R * 0.3 + sw, R * 0.85); c.stroke();
      c.beginPath(); c.moveTo(R * 0.3, R * 0.35); c.lineTo(R * 0.3 - sw, R * 0.85); c.stroke();
      c.fillStyle = p.gk ? '#1b2440' : e.calcao;
      G.gfx.rr(c, -R * 0.62, R * 0.1, R * 1.24, R * 0.5, R * 0.2); c.fill();
      c.fillStyle = p.gk ? e.gk : e.cor;
      c.beginPath(); c.arc(0, -R * 0.15, R * 0.86, 0, TAU); c.fill();
      if (e.riscas && !p.gk) {                          // riscas (Porto, Barça)
        c.save();
        c.beginPath(); c.arc(0, -R * 0.15, R * 0.86, 0, TAU); c.clip();
        c.fillStyle = e.riscas;
        const n = e.nRiscas || 3, lr = e.largRisca || 0.18, esp = e.espRisca || 0.64;
        for (let i = 0; i < n; i++) {
          const x = (i - (n - 1) / 2) * R * esp;
          c.fillRect(x - R * lr / 2, -R * 1.1, R * lr, R * 2);
        }
        c.restore();
      }
      if (e.debrum && !p.gk) {                          // debrum dourado (Real Madrid)
        c.strokeStyle = e.debrum; c.lineWidth = R * 0.14;
        c.beginPath(); c.arc(0, -R * 0.15, R * 0.8, 0, TAU); c.stroke();
      }
      c.strokeStyle = p.gk ? e.gk : (e.manga || e.cor); c.lineWidth = R * 0.3;
      const ba = p.festeja > 0 ? -1.1 : 0.2;
      c.beginPath(); c.moveTo(-R * 0.7, -R * 0.2); c.lineTo(-R * 1.15, -R * 0.2 + ba * R + sw * 0.4); c.stroke();
      c.beginPath(); c.moveTo(R * 0.7, -R * 0.2); c.lineTo(R * 1.15, -R * 0.2 + ba * R - sw * 0.4); c.stroke();
      c.fillStyle = '#f0c9a0';
      c.beginPath(); c.arc(0, -R * 0.35, R * 0.5, 0, TAU); c.fill();
      c.fillStyle = '#3a2b1d';
      c.beginPath(); c.arc(0, -R * 0.42, R * 0.42, 0, TAU); c.fill();
      c.restore();
      if (p.cai > 0) G.gfx.star(c, p.x + R * 0.9, p.y - R * 1.1, R * 0.3, '#ffd166', t * 4);
    }

    function desenhaArbitro(c) {
      const R = raioJ() * 0.9;
      sombra(c, arbitro.x, arbitro.y, R);
      c.save();
      c.translate(arbitro.x, arbitro.y);
      c.strokeStyle = '#222'; c.lineWidth = R * 0.24; c.lineCap = 'round';
      const sw = Math.sin(arbitro.passo) * R * 0.3;
      c.beginPath(); c.moveTo(-R * 0.28, R * 0.3); c.lineTo(-R * 0.28 + sw, R * 0.8); c.stroke();
      c.beginPath(); c.moveTo(R * 0.28, R * 0.3); c.lineTo(R * 0.28 - sw, R * 0.8); c.stroke();
      c.fillStyle = '#ffe066';
      c.beginPath(); c.arc(0, -R * 0.15, R * 0.78, 0, TAU); c.fill();
      c.fillStyle = '#f0c9a0';
      c.beginPath(); c.arc(0, -R * 0.35, R * 0.45, 0, TAU); c.fill();
      c.fillStyle = '#2b2b2b';
      c.beginPath(); c.arc(0, -R * 0.42, R * 0.38, 0, TAU); c.fill();
      c.restore();
    }

    function desenhaBola(c) {
      const r = raioB();
      sombra(c, bola.x, bola.y, r * 1.2);
      c.save();
      c.translate(bola.x, bola.y); c.rotate(bola.rot);
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
      c.fillStyle = '#22223b';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU;
        c.beginPath(); c.arc(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6, r * 0.19, 0, TAU); c.fill();
      }
      c.beginPath(); c.arc(0, 0, r * 0.26, 0, TAU); c.fill();
      c.restore();
    }

    function marcaMeu(c, t) {
      if (!meu) return;
      const R = raioJ();
      c.strokeStyle = '#ffd166'; c.lineWidth = R * 0.16;
      c.beginPath(); c.arc(meu.x, meu.y, R * 1.25, 0, TAU); c.stroke();
      G.gfx.star(c, meu.x, meu.y - R * 2.1 - Math.abs(Math.sin(t * 3)) * R * 0.2, R * 0.36, '#ffd166', t);
    }

    function marcador(c) {
      const cp = campo();
      const h = clamp(cp.y * 0.62, 26, 44), w = Math.min(G.W * 0.5, h * 5.4);
      const x = 10, y = Math.min(Math.max(4, (cp.y - h) / 2), 10);   // sempre lá em cima
      c.save();
      G.gfx.rr(c, x, y, w, h, h * 0.26);
      c.fillStyle = 'rgba(8,12,24,.9)'; c.fill();
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.stroke();
      const e = h * 0.56, ey = y + h * 0.22;
      // um quadradinho com as cores de cada equipa (a nossa à esquerda)
      const emblema = function (eq, ex) {
        const d = EQ[eq];
        c.fillStyle = d.cor;
        G.gfx.rr(c, ex, ey, e, e, e * 0.25); c.fill();
        c.save();
        G.gfx.rr(c, ex, ey, e, e, e * 0.25); c.clip();
        if (d.riscas) {
          c.fillStyle = d.riscas;
          const n = d.nRiscas || 3;
          for (let i = 0; i < n; i++) c.fillRect(ex + e * ((i + 0.5) / n) - e * 0.3 / n, ey, e * 0.6 / n, e);
        }
        if (d.debrum) { c.strokeStyle = d.debrum; c.lineWidth = e * 0.22; G.gfx.rr(c, ex, ey, e, e, e * 0.25); c.stroke(); }
        c.restore();
      };
      emblema(NOSSA, x + h * 0.24);
      emblema(DELES, x + w - h * 0.24 - e);
      const fs = h * 0.62;
      G.gfx.label(c, golos[NOSSA] + ' - ' + golos[DELES], x + w * 0.5, y + h * 0.4, fs, '#fff', 'center', 'none');
      G.gfx.label(c, Math.min(90, Math.floor(relogio)) + "'", x + w * 0.5, y + h * 0.78, fs * 0.44, '#ffd166', 'center', 'none');
      c.restore();
    }

    function ajuda(c) {
      if (fase === 'penalti' && penalti && !penalti.batido) {
        const cp = campo(), lx = linhaAtaca(penalti.eq);
        const destino = cp.cy + penalti.mira * balizaW() * 0.42;
        c.save();
        c.strokeStyle = 'rgba(255,209,102,.9)'; c.lineWidth = 3; c.setLineDash([8, 6]);
        c.beginPath(); c.moveTo(bola.x, bola.y); c.lineTo(lx, destino); c.stroke();
        c.setLineDash([]);
        G.gfx.star(c, lx - EQ[penalti.eq].dir * 10, destino, raioJ() * 0.4, '#ffd166', 0);
        c.restore();
      }
    }

    S.draw = function (c, t) {
      fundo(c, t);
      relva(c, t);
      for (const p of parts) {
        c.globalAlpha = clamp(1 - p.t / p.vida, 0, 1);
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
        c.fillStyle = p.col;
        const s = raioJ() * 0.3 * p.s;
        c.fillRect(-s / 2, -s / 4, s, s / 2);
        c.restore();
      }
      c.globalAlpha = 1;
      ajuda(c);
      desenhaArbitro(c);
      marcaMeu(c, t);
      const ordem = jogadores.slice().sort(function (a, b) { return a.y - b.y; });
      for (const p of ordem) desenhaJogador(c, p, t);
      desenhaBola(c);
      marcador(c);
    };

    S.debug = function () {
      return {
        fase: fase, golos: golos[NOSSA] + '-' + golos[DELES], minuto: Math.floor(relogio),
        dono: bola.dono ? bola.dono.eq + '#' + bola.dono.num : 'livre',
        meu: meu ? meu.num : null
      };
    };

    // espreitadela ao estado, para testar o jogo sem ter de o jogar à mão
    S.api = function () {
      return { jogadores: jogadores, bola: bola, meu: meu, campo: campo(), fase: fase, golos: golos };
    };

    return S;
  }   // fim de criaJogo

  /* ================= os estádios ================= */

  // o dragão do emblema, pintado no relvado como um brasão gigante
  function dragaoPintado(c, t, cp) {
    const s = cp.h * 0.42;
    c.save();
    c.translate(cp.cx, cp.cy);
    c.scale(s / 40, s / 40);
    c.globalAlpha = 0.09;
    c.fillStyle = '#2f6fe0';
    c.beginPath();
    c.moveTo(-22, 12); c.quadraticCurveTo(-6, 10, 2, -4);
    c.quadraticCurveTo(8, -16, 20, -18);
    c.quadraticCurveTo(30, -18, 30, -8);
    c.quadraticCurveTo(30, 0, 18, 2);
    c.quadraticCurveTo(8, 4, 4, 14);
    c.closePath(); c.fill();
    c.beginPath();
    c.moveTo(-6, 2); c.lineTo(-20, -14 + Math.sin(t * 2) * 3); c.lineTo(-2, -6);
    c.closePath(); c.fill();
    c.fillStyle = '#ffd166';
    c.beginPath(); c.arc(22, -12, 2.6, 0, TAU); c.fill();
    c.fillStyle = '#ff8f3f';
    c.beginPath();
    c.moveTo(30, -10); c.lineTo(44 + Math.sin(t * 6) * 4, -13); c.lineTo(30, -6);
    c.closePath(); c.fill();
    c.restore();
    c.globalAlpha = 1;
  }

  // o emblema do Barça pintado no relvado, bem clarinho: escudo com a cruz, as
  // barras amarelas e vermelhas em cima e as riscas blaugrana em baixo, com a bola
  function barcaPintado(c, t, cp) {
    const s = cp.h * 0.44;
    c.save();
    c.translate(cp.cx, cp.cy);
    c.scale(s / 40, s / 40);
    c.globalAlpha = 0.11;
    const escudo = function () {
      c.beginPath();
      c.moveTo(-18, -20); c.lineTo(18, -20);
      c.quadraticCurveTo(18, 6, 0, 22);
      c.quadraticCurveTo(-18, 6, -18, -20);
      c.closePath();
    };
    c.save(); escudo(); c.clip();
    c.fillStyle = '#ffffff'; c.fillRect(-18, -20, 18, 12);            // a cruz
    c.fillStyle = '#e12730';
    c.fillRect(-10.5, -20, 3, 12); c.fillRect(-18, -15.5, 18, 3);
    for (let i = 0; i < 4; i++) {                                     // as barras
      c.fillStyle = i % 2 ? '#e12730' : '#ffd166';
      c.fillRect(i * 4.5, -20, 4.5, 12);
    }
    for (let i = 0; i < 6; i++) {                                     // blaugrana
      c.fillStyle = i % 2 ? '#a50044' : '#1f5fbf';
      c.fillRect(-18 + i * 6, -8, 6, 32);
    }
    c.restore();
    c.strokeStyle = '#ffd166'; c.lineWidth = 2.2; escudo(); c.stroke();
    c.fillStyle = '#ffd166';                                          // a bola
    c.beginPath(); c.arc(0, 8 + Math.sin(t * 2) * 0.8, 4.5, 0, TAU); c.fill();
    c.restore();
    c.globalAlpha = 1;
  }

  G.scenes = G.scenes || {};

  G.scenes.dragao = criaJogo({
    nossa: 'porto', deles: 'benfica',
    eq: {
      porto: { nome: 'PORTO', cor: '#0b3ea8', riscas: '#ffffff', calcao: '#0b2f7a', gk: '#39d353', dir: 1,
        confetes: ['#0b3ea8', '#ffffff', '#8bb8ff'] },
      benfica: { nome: 'BENFICA', cor: '#e12730', calcao: '#ffffff', gk: '#ffd166', dir: -1,
        confetes: ['#e12730', '#ffffff', '#ffb3b3'] }
    },
    // o Dragão é quase todo azul e branco; a claque visitante é encarnada
    adeptos: [['#2f6fe0', 0.62], ['#ffffff', 0.20], ['#8bb8ff', 0.18]],
    visitantes: [['#e12730', 0.78], ['#ffffff', 0.22]],
    pintura: dragaoPintado,
    intervalo: false,
    txt: {
      entrada: 'PORTO x BENFICA no Dragão! ⚽🔵', nosso: 'Porto',
      goloNosso: 'GOLO DO PORTO! ⚽🔵', goloDeles: 'Golo do Benfica 🔴'
    }
  });

  // o Isaac é do Barça (ataca para a direita) e o Real Madrid é a equipa de contra
  G.scenes.classico = criaJogo({
    nossa: 'barca', deles: 'real',
    eq: {
      barca: { nome: 'BARÇA', cor: '#1f4fa8', riscas: '#a50044', nRiscas: 3, espRisca: 0.58, largRisca: 0.3,
        calcao: '#0a2f6b', gk: '#39d353', dir: 1, confetes: ['#1f4fa8', '#a50044', '#ffd166'] },
      real: { nome: 'REAL MADRID', cor: '#f7f7f7', debrum: '#d4af37', calcao: '#ffffff', gk: '#ff8c42', dir: -1,
        confetes: ['#ffffff', '#d4af37', '#7b5fd0'] }
    },
    // o Camp Nou é blaugrana, com um bocadinho de amarelo (a senyera);
    // a claque do Real Madrid, de branco e roxo, fica no cantinho
    adeptos: [['#1f5fbf', 0.42], ['#a50044', 0.36], ['#ffd166', 0.1], ['#ffffff', 0.12]],
    visitantes: [['#ffffff', 0.7], ['#7b5fd0', 0.3]],
    pintura: barcaPintado,
    intervalo: true,
    txt: {
      entrada: 'BARÇA x REAL MADRID! ⚽🔵🔴', nosso: 'Barça',
      goloNosso: 'GOLO DO BARÇA! ⚽🔵🔴', goloDeles: 'Golo do Real Madrid ⚪'
    }
  });
})();
