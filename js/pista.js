/* Cena 10 — A Corrida (mota de corrida contra carrinhos de brincar).

   2.ª versão, a pedido do pai:
   - a PISTA é gerada de novo em cada corrida (curvas, retas e chicanes diferentes);
   - ganha UM — há classificação a sério e dá para perder. Perder faz parte: no fim há
     pódio, o vencedor sobe ao lugar mais alto e quem perdeu bate palmas e tenta outra vez;
   - há OBSTÁCULOS na pista (uns cones e umas pilhas de pneus, poucos mas a sério):
     bater neles custa velocidade, e é aí que se perde ou se ganha a corrida.

   O que se mantém do que o Isaac ditou: é a MESMA mota de corrida da selva, os
   adversários são carrinhos de BRINCAR (com a chave de dar corda a rodar), a mota anda
   sozinha e muito depressa, ◀ ▶ escolhem a linha, ⬆ salta, ⚡ é turbo, e as rampas
   lançam sozinhas. Ninguém se magoa: os toques são "boing" e os cones voltam a pôr-se
   de pé sozinhos. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  const TW = 190;                // largura da pista
  const HW = TW / 2 - 26;        // até onde u pode ir (u = -1 .. 1)
  const VOLTAS = 3;
  const TOP = 560;               // velocidade máxima da nossa mota
  const GRIP = 435;              // quanto se pode correr numa curva: v = sqrt(GRIP/curvatura)
  const TURBO_MULT = 1.35, TURBO_NEED = 3;
  // skill = velocidade máxima; mira = quanto acertam na linha de corrida (cortar por dentro)
  const CARROS = [
    { c: '#ff595e', n: 3, skill: 0.98, mira: 0.90 }, { c: '#4cc9f0', n: 5, skill: 0.95, mira: 0.78 },
    { c: '#8ac926', n: 8, skill: 0.92, mira: 0.65 }, { c: '#ffca3a', n: 2, skill: 0.89, mira: 0.52 }
  ];

  let pts, acc, curv, P, bbox, N, cruzamentos;    // pista gerada (N = nº de amostras)
  let mota, carros, estrelas, obstaculos, rampas, confetes, marcas;
  let camX, camY, meter, turbo, fase, fimT, conta, lugar, avisado, batidas;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function mod(s) { return ((s % P) + P) % P; }
  function zoom() { return Math.min(0.72, Math.max(0.42, Math.min(G.W / 1250, G.H / 900))); }

  /* ---------- pista nova em cada corrida ----------
     A 1.ª versão era um raio que variava com o ângulo: dava sempre curvas para o MESMO
     lado (parecia uma roda amassada). Agora é um circuito a sério, como os de verdade:
       1. pontos ao acaso → fecho convexo (garante um circuito que fecha);
       2. o ponto médio de cada reta é empurrado para um lado OU para o outro, ao acaso —
          é isto que dá curvas nos dois sentidos, chicanes e gancho;
       3. curva suave Catmull-Rom por cima desses pontos;
       4. valida-se: raio mínimo, comprimento, uma reta a sério e pelo menos 4 mudanças
          de sentido (senão volta a gerar).
     E há uma variante em OITO (~1 em cada 3), em que a pista se cruza a si própria e
     passa por cima numa PONTE — como Suzuka. */

  function fechoConvexo(p) {
    const q = p.slice().sort(function (a, b) { return a.x - b.x || a.y - b.y; });
    const cross = function (o, a, b) { return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x); };
    const baixo = [], cima = [];
    for (const v of q) {
      while (baixo.length >= 2 && cross(baixo[baixo.length - 2], baixo[baixo.length - 1], v) <= 0) baixo.pop();
      baixo.push(v);
    }
    for (let i = q.length - 1; i >= 0; i--) {
      const v = q[i];
      while (cima.length >= 2 && cross(cima[cima.length - 2], cima[cima.length - 1], v) <= 0) cima.pop();
      cima.push(v);
    }
    baixo.pop(); cima.pop();
    return baixo.concat(cima);
  }

  function afastar(p, dmin) {                    // separa pontos demasiado juntos
    for (let volta = 0; volta < 12; volta++) {
      let mexeu = false;
      for (let i = 0; i < p.length; i++) {
        for (let j = i + 1; j < p.length; j++) {
          const dx = p[j].x - p[i].x, dy = p[j].y - p[i].y;
          const d = Math.hypot(dx, dy);
          if (d > 0.1 && d < dmin) {
            const f = (dmin - d) / 2 / d;
            p[i].x -= dx * f; p[i].y -= dy * f;
            p[j].x += dx * f; p[j].y += dy * f;
            mexeu = true;
          }
        }
      }
      if (!mexeu) break;
    }
    return p;
  }

  // Abre os cotovelos: sem isto a curva suave fazia sempre um bico apertado de mais
  // para a mota passar (medido: 600 tentativas seguidas chumbadas por "curva apertada").
  function abrirAngulos(p, minAng) {
    const m = p.length;
    for (let volta = 0; volta < 8; volta++) {
      for (let i = 0; i < m; i++) {
        const a = p[(i - 1 + m) % m], b = p[i], d = p[(i + 1) % m];
        let v1x = a.x - b.x, v1y = a.y - b.y, v2x = d.x - b.x, v2y = d.y - b.y;
        const l1 = Math.hypot(v1x, v1y) || 1, l2 = Math.hypot(v2x, v2y) || 1;
        v1x /= l1; v1y /= l1; v2x /= l2; v2y /= l2;
        const ang = Math.acos(Math.max(-1, Math.min(1, v1x * v2x + v1y * v2y)));
        if (ang >= minAng) continue;
        const falta = (minAng - ang) * ((v1x * v2y - v1y * v2x) > 0 ? 1 : -1);
        const co = Math.cos(falta), si = Math.sin(falta);
        p[(i + 1) % m] = { x: b.x + (v2x * co - v2y * si) * l2, y: b.y + (v2x * si + v2y * co) * l2 };
      }
    }
    return p;
  }

  function pontosCircuito() {
    const bruto = [];
    for (let i = 0; i < 15; i++) bruto.push({ x: rnd(-1180, 1180), y: rnd(-820, 820) });
    let h = fechoConvexo(bruto);
    if (h.length < 6) return null;
    h = afastar(h, 460);
    // ponto médio de cada aresta empurrado para um lado ou para o outro: é aqui que
    // nascem as curvas à direita E à esquerda
    const out = [];
    for (let i = 0; i < h.length; i++) {
      const a = h[i], b = h[(i + 1) % h.length];
      out.push({ x: a.x, y: a.y });
      const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const nx = -(b.y - a.y) / L, ny = (b.x - a.x) / L;
      // ~1 em cada 3 arestas fica quase direita (é daí que vêm as RETAS a sério);
      // as outras são empurradas com força para um lado ou para o outro (curvas)
      const reto = Math.random() < 0.34;
      const desl = reto ? rnd(-50, 50)
        : (Math.random() < 0.5 ? -1 : 1) * Math.min(360, L * rnd(0.16, 0.42));
      out.push({ x: (a.x + b.x) / 2 + nx * desl, y: (a.y + b.y) / 2 + ny * desl });
    }
    return abrirAngulos(afastar(out, 260), 2.0);       // ~115°
  }

  // Circuito que se cruza a si próprio (o "oito"): x = A·cos(θ), y = B·sin(2θ).
  // Medido: acima destes tamanhos a volta fica comprida de mais e o ruído fecha demasiado
  // a curva a ~140° (raio abaixo de 140 px, que a mota já não passa).
  function pontosOito() {
    const A = rnd(890, 1060), B = rnd(560, 690);
    const h1 = { n: 3, a: rnd(0.02, 0.06), f: rnd(0, TAU) };
    const h2 = { n: 5, a: rnd(0.02, 0.05), f: rnd(0, TAU) };
    const out = [];
    const M = 26, assim = rnd(0, 0.2);           // um laço maior do que o outro
    for (let i = 0; i < M; i++) {
      const th = (i / M) * TAU;
      const r = 1 + h1.a * Math.sin(h1.n * th + h1.f) + h2.a * Math.sin(h2.n * th + h2.f);
      const g = 1 + assim * Math.cos(th);
      out.push({ x: Math.cos(th) * A * r * g, y: Math.sin(2 * th) * B * r * g });
    }
    return out;
  }

  function rodar(p, ang) {                       // vira o circuito todo, para variar mais
    const co = Math.cos(ang), si = Math.sin(ang);
    return p.map(function (q) { return { x: q.x * co - q.y * si, y: q.x * si + q.y * co }; });
  }

  /* Curva suave fechada (Catmull-Rom CENTRÍPETA). A versão uniforme fazia bicos e
     laçadas quando os pontos ficavam a distâncias muito diferentes — era por isso que
     saíam sempre curvas apertadas de mais e a pista acabava sempre na de salvaguarda. */
  function catmull(p, k) {
    const out = [], m = p.length;
    for (let i = 0; i < m; i++) {
      const p0 = p[(i - 1 + m) % m], p1 = p[i], p2 = p[(i + 1) % m], p3 = p[(i + 2) % m];
      const t0 = 0;
      const t1 = t0 + Math.sqrt(Math.hypot(p1.x - p0.x, p1.y - p0.y)) || t0 + 0.001;
      const t2 = t1 + Math.sqrt(Math.hypot(p2.x - p1.x, p2.y - p1.y)) || t1 + 0.001;
      const t3 = t2 + Math.sqrt(Math.hypot(p3.x - p2.x, p3.y - p2.y)) || t2 + 0.001;
      for (let j = 0; j < k; j++) {
        const t = t1 + (t2 - t1) * (j / k);
        const mix = function (A, B, ta, tb) {
          const w = (tb - t) / (tb - ta || 1), v = (t - ta) / (tb - ta || 1);
          return { x: A.x * w + B.x * v, y: A.y * w + B.y * v };
        };
        const A1 = mix(p0, p1, t0, t1), A2 = mix(p1, p2, t1, t2), A3 = mix(p2, p3, t2, t3);
        const B1 = mix(A1, A2, t0, t2), B2 = mix(A2, A3, t1, t3);
        out.push(mix(B1, B2, t1, t2));
      }
    }
    return out;
  }

  function gerar() {
    for (let tentativa = 0; tentativa < 60; tentativa++) {
      const oito = Math.random() < 0.34;
      tipoAtual = oito ? 'oito: ' : '';
      const base = oito ? pontosOito() : pontosCircuito();
      if (!base) continue;
      const amostras = catmull(rodar(base, rnd(0, TAU)), oito ? 12 : 14);
      if (medir(amostras, oito)) return;
    }
    // salvaguarda: um circuito fixo simples, que nunca falha
    const base = [
      { x: -1100, y: -600 }, { x: 0, y: -820 }, { x: 1100, y: -600 }, { x: 1250, y: 0 },
      { x: 700, y: 520 }, { x: 0, y: 300 }, { x: -700, y: 620 }, { x: -1250, y: 100 }
    ];
    medir(catmull(base, 16), false, true);
  }

  function medir(p, deixaCruzar, forcar) {
    const n = p.length;
    const a = [0], k = [];
    for (let i = 0; i < n; i++) {
      const q = p[(i + 1) % n];
      a.push(a[i] + Math.hypot(q.x - p[i].x, q.y - p[i].y));
    }
    const total = a[n];
    // Curvatura medida numa base LARGA (±55 px). Entre amostras vizinhas o valor é só
    // ruído do desenho; o que interessa é a curva que a mota sente, não o pixel.
    const BASE = 55;
    const andar = function (i, d) {              // índice a `d` píxeis de distância
      let j = i, resta = Math.abs(d);
      const passo = d > 0 ? 1 : -1;
      for (let guarda = 0; guarda < n && resta > 0; guarda++) {
        const jj = (j + passo + n) % n;
        const comp = Math.hypot(p[jj].x - p[j].x, p[jj].y - p[j].y);
        resta -= comp; j = jj;
        if (comp <= 0.0001) break;
      }
      return j;
    };
    for (let i = 0; i < n; i++) {
      const A = p[andar(i, -BASE)], B = p[i], C = p[andar(i, BASE)];
      const a1 = Math.atan2(B.y - A.y, B.x - A.x), a2 = Math.atan2(C.y - B.y, C.x - B.x);
      let d = a2 - a1;
      while (d > Math.PI) d -= TAU;
      while (d < -Math.PI) d += TAU;
      const len = (Math.hypot(B.x - A.x, B.y - A.y) + Math.hypot(C.x - B.x, C.y - B.y)) / 2;
      k.push(d / Math.max(1, len));
    }
    if (!forcar) {
      const maxK = k.reduce(function (m, v) { return Math.max(m, Math.abs(v)); }, 0);
      if (1 / maxK < 130) return reprova('curva apertada');   // 130 px é um gancho a sério, mas passa
      if (total < 4600) return reprova('curta');
      if (total > 7200) return reprova('comprida');    // 3 voltas têm de dar ~30 s
      // curvas para os DOIS lados: conta as mudanças de sentido (com folga, para o
      // ruído das amostras não contar como curva)
      let trocas = 0, sinal = 0, reta = 0, maiorReta = 0;
      for (let i = 0; i < n; i++) {
        const kk = k[i], comp = a[i + 1] - a[i];
        if (Math.abs(kk) > 1 / 900) {
          const s2 = Math.sign(kk);
          if (sinal !== 0 && s2 !== sinal) trocas++;
          sinal = s2;
          reta = 0;
        } else {
          reta += comp;
          maiorReta = Math.max(maiorReta, reta);
        }
      }
      // no "oito" a variedade vem do cruzamento: aí bastam 2 mudanças de sentido
      if (trocas < (deixaCruzar ? 2 : 4)) return reprova('poucas trocas de sentido');
      if (maiorReta < 420) return reprova('sem reta');
    }
    pts = p; acc = a; curv = k; P = total; N = n;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const q of p) { x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y); }
    bbox = { x0: x0, y0: y0, x1: x1, y1: y1, w: x1 - x0, h: y1 - y0 };
    cruzamentos = acharCruzamentos();
    if (!forcar && !deixaCruzar && cruzamentos.length) return reprova('cruza-se');
    if (!forcar && deixaCruzar && cruzamentos.length !== 1) return reprova('oito sem cruzamento');
    return true;
  }

  let motivos = {}, tipoAtual = '';
  function reprova(m) { const k = tipoAtual + m; motivos[k] = (motivos[k] || 0) + 1; return false; }

  // onde é que a pista passa por cima de si própria (para desenhar a ponte)
  function acharCruzamentos() {
    const out = [];
    for (let i = 0; i < N; i++) {
      const a1 = pts[i], a2 = pts[(i + 1) % N];
      const ax0 = Math.min(a1.x, a2.x), ax1 = Math.max(a1.x, a2.x);
      const ay0 = Math.min(a1.y, a2.y), ay1 = Math.max(a1.y, a2.y);
      for (let j = i + 4; j < N; j++) {
        if (i === 0 && j === N - 1) continue;
        const b1 = pts[j], b2 = pts[(j + 1) % N];
        // caixas que não se tocam: nem vale a pena fazer as contas (é o grosso do tempo)
        if (Math.min(b1.x, b2.x) > ax1 || Math.max(b1.x, b2.x) < ax0 ||
            Math.min(b1.y, b2.y) > ay1 || Math.max(b1.y, b2.y) < ay0) continue;
        const d = (a2.x - a1.x) * (b2.y - b1.y) - (a2.y - a1.y) * (b2.x - b1.x);
        if (Math.abs(d) < 1e-6) continue;
        const t = ((b1.x - a1.x) * (b2.y - b1.y) - (b1.y - a1.y) * (b2.x - b1.x)) / d;
        const u2 = ((b1.x - a1.x) * (a2.y - a1.y) - (b1.y - a1.y) * (a2.x - a1.x)) / d;
        if (t > 0 && t < 1 && u2 > 0 && u2 < 1) {
          out.push({
            s1: acc[i] + (acc[i + 1] - acc[i]) * t,
            s2: acc[j] + (acc[j + 1] - acc[j]) * u2,
            x: a1.x + (a2.x - a1.x) * t, y: a1.y + (a2.y - a1.y) * t
          });
        }
      }
    }
    return out;
  }

  function idxDe(s) {                     // índice da amostra antes de s (procura binária)
    s = mod(s);
    let lo = 0, hi = N;
    while (lo < hi - 1) {
      const m = (lo + hi) >> 1;
      if (acc[m] <= s) lo = m; else hi = m;
    }
    return lo;
  }
  function pos(s) {
    s = mod(s);
    const i = idxDe(s), j = (i + 1) % N;
    const f = (s - acc[i]) / Math.max(1, acc[i + 1] - acc[i]);
    return { x: pts[i].x + (pts[j].x - pts[i].x) * f, y: pts[i].y + (pts[j].y - pts[i].y) * f };
  }
  function dir(s) {
    const i = idxDe(s), j = (i + 1) % N;
    const dx = pts[j].x - pts[i].x, dy = pts[j].y - pts[i].y;
    const m = Math.hypot(dx, dy) || 1;
    return { x: dx / m, y: dy / m };
  }
  function curvaturaEm(s) { return curv[idxDe(s)]; }
  function ponto(s, u) {
    const p = pos(s), d = dir(s);
    return { x: p.x - d.y * u * HW, y: p.y + d.x * u * HW, ang: Math.atan2(d.y, d.x) };
  }
  // quanto se "estica" o caminho na faixa u: por dentro da curva anda-se MENOS
  function fator(s, u) {
    const a = ponto(s - 26, u), b = ponto(s + 26, u);
    return Math.max(0.4, Math.hypot(b.x - a.x, b.y - a.y) / 52);
  }
  function vCurva(s, u) {                 // velocidade que a curva deixa fazer
    const k = Math.abs(curvaturaEm(s + 90));      // olha um bocadinho à frente
    if (k < 1 / 2600) return 9999;
    return Math.sqrt(GRIP / k);
  }

  /* ---------- ciclo ---------- */
  S.enter = function () {
    gerar();
    mota = { s: 0, u: 0, spd: 0, alt: 0, vy: 0, voo: 0, boing: 0, lean: 0, voltas: 0, prog: 0, fim: 0 };
    carros = CARROS.map(function (o, i) {
      return {
        cor: o.c, num: o.n, skill: o.skill, mira: o.mira,
        s: -70 - i * 110, u: (i % 2 ? 0.45 : -0.45), spd: 300,
        linha: rnd(-0.45, 0.45), alvoU: 0, t: rnd(0, 6), boing: 0,
        voltas: 0, prog: 0, festa: 0, fim: 0
      };
    });
    mota.s = -70 - CARROS.length * 110;           // largamos em último: há que ultrapassar
    mota.u = 0.15;

    // rampas nas partes mais direitas da pista (duas, bem separadas)
    rampas = [];
    for (let volta = 0; volta < 2; volta++) {
      let melhor = -1, melhorK = 1e9;
      const ini = Math.floor(N * (volta ? 0.5 : 0.08)), fim = Math.floor(N * (volta ? 0.9 : 0.42));
      for (let i = ini; i < fim; i++) {
        const k = Math.abs(curv[i]) + Math.abs(curv[(i + 4) % N]);
        if (k < melhorK) { melhorK = k; melhor = i; }
      }
      if (melhor >= 0) rampas.push(acc[melhor]);
    }

    // obstáculos: poucos, mas a sério (cones e pilhas de pneus)
    obstaculos = [];
    const quantos = 7 + Math.floor(Math.random() * 3);
    for (let i = 0; i < quantos; i++) {
      const s = (P / quantos) * i + rnd(120, P / quantos - 120);
      if (mod(s) < 420) continue;                       // nunca na zona da partida
      let perto = false;
      for (const r of rampas) if (Math.abs(mod(s - r + P / 2) - P / 2) < 320) perto = true;
      if (perto) continue;
      obstaculos.push({
        s: s, u: rnd(-0.62, 0.62),
        tipo: Math.random() < 0.55 ? 'cone' : 'pneu',
        caido: 0, rot: rnd(0, TAU), dx: 0, dy: 0
      });
    }

    estrelas = [];
    for (let k = 0; k < 12; k++) estrelas.push({ s: (P / 12) * k + 140, u: rnd(-0.6, 0.6), apanhada: false });

    confetes = []; marcas = [];
    camX = 0; camY = 0; meter = 0; turbo = 0;
    fase = 'partida'; fimT = 0; conta = 3.2; lugar = 5; avisado = false; batidas = 0;
    G.banner('3 voltas! Ultrapassa e ganha! 🏁', 2600);
  };

  function confete(x, y, n) {
    for (let i = 0; i < n; i++) {
      confetes.push({
        x: x, y: y, vx: rnd(-220, 220), vy: rnd(-320, -60), t: 0, life: rnd(0.9, 1.8),
        cor: ['#ff595e', '#4cc9f0', '#8ac926', '#ffca3a', '#ff8fab'][Math.floor(Math.random() * 5)],
        rot: rnd(0, TAU)
      });
    }
  }

  function bater(o, quem) {                          // toque num cone / pilha de pneus
    const p = ponto(o.s, o.u);
    if (o.tipo === 'cone') {
      o.caido = 5;
      const d = dir(o.s);
      o.dx = d.x * 60 + rnd(-30, 30); o.dy = d.y * 60 + rnd(-30, 30);
      G.audio.sfx('pop');
      quem.spd *= 0.72;
    } else {
      G.audio.sfx('boing');
      quem.spd *= 0.5;
      quem.u = Math.max(-1, Math.min(1, quem.u + (quem.u > o.u ? 0.3 : -0.3)));
    }
    confete(p.x, p.y, 4);
    if (quem === mota) {
      batidas++; G.shake = o.tipo === 'pneu' ? 0.4 : 0.2;
      mota.boing = 0.5;
    }
  }

  function progresso(o) { return o.voltas * P + mod(o.s); }

  S.update = function (dt, t) {
    const inp = G.input;

    if (fase === 'partida') {                        // 3, 2, 1… JÁ!
      conta -= dt;
      const antes = Math.ceil(conta + dt), agora = Math.ceil(conta);
      if (agora !== antes && agora >= 0) G.audio.sfx(agora === 0 ? 'whistle' : 'beep');
      camera(dt * 3);
      if (conta <= 0) { fase = 'corrida'; G.audio.sfx('vroom'); }
      return;
    }

    if (fase === 'fim') {
      fimT += dt;
      for (const car of carros) {
        car.spd = Math.max(0, car.spd - 220 * dt);
        car.s += car.spd * dt / fator(car.s, car.u); car.festa += dt;
      }
      mota.spd = Math.max(0, mota.spd - 260 * dt);
      mota.s += mota.spd * dt / fator(mota.s, mota.u);
      if (Math.random() < dt * 12) {
        const p = ponto(mota.s + rnd(-200, 200), rnd(-1, 1));
        confete(p.x, p.y, 3);
      }
      passoConfetes(dt);
      camera(dt);
      if (fimT > 5.5) {
        if (G.pistaVolta === 'jungle') G.setScene('jungle');
        else G.goMenu();
      }
      return;
    }

    /* ---- a nossa mota: anda sozinha, nós escolhemos a linha ---- */
    turbo = Math.max(0, turbo - dt);
    const limite = Math.min(TOP * (turbo > 0 ? TURBO_MULT : 1), vCurva(mota.s, mota.u) * (turbo > 0 ? 1.12 : 1));
    mota.spd += (limite - mota.spd) * Math.min(1, dt * (mota.spd < limite ? 1.5 : 3.4));

    const ax = inp.axis();
    let mv = 0;
    if (inp.isHeld('left')) mv -= 1;
    if (inp.isHeld('right')) mv += 1;
    if (mv === 0) mv = Math.abs(ax.x) > 0.25 ? Math.sign(ax.x) : 0;
    mota.u = Math.max(-1, Math.min(1, mota.u + mv * 1.5 * dt));
    mota.lean += (mv * 0.35 - mota.lean) * Math.min(1, dt * 7);

    if (inp.justPressed('jump') || inp.justPressed('up')) saltar(mota, 320);
    if (inp.justPressed('fire') && meter >= TURBO_NEED && turbo <= 0) {
      turbo = 3.2; meter = 0; avisado = false;
      G.audio.sfx('vroom'); G.shake = 0.3;
      G.banner('⚡ TURBO!', 1600);
    }

    const antes = mota.s;
    mota.s += mota.spd * dt / fator(mota.s, mota.u);
    mota.boing = Math.max(0, mota.boing - dt);

    if (Math.random() < dt * (turbo > 0 ? 40 : 14)) {
      const p = ponto(mota.s, mota.u);
      marcas.push({ x: p.x, y: p.y, t: 0 });
      if (marcas.length > 90) marcas.shift();
    }

    // rampas
    for (const rs of rampas) {
      if (passouPor(antes, mota.s, rs) && mota.voo <= 0) {
        saltar(mota, 560 + (turbo > 0 ? 110 : 0));
        G.addStars(1);
        break;
      }
    }
    voar(mota, dt, true);

    // voltas
    if (passouPor(antes, mota.s, 0)) {
      mota.voltas++;
      if (mota.voltas >= VOLTAS) return terminar();
      G.audio.sfx('whistle');
      G.banner('Volta ' + (mota.voltas + 1) + ' de ' + VOLTAS + '! 🏁', 1600);
    }

    /* ---- carrinhos de brincar: correm a sério ---- */
    for (const car of carros) {
      car.t += dt; car.boing = Math.max(0, car.boing - dt);
      const lim = Math.min(TOP * car.skill, vCurva(car.s, car.u));
      car.spd += (lim - car.spd) * Math.min(1, dt * (car.spd < lim ? 1.3 : 3));

      // Linha de corrida: os carrinhos melhores cortam por dentro das curvas (é a mesma
      // vantagem que nós temos). Sem isto, com pistas às curvas, ganhava-se sempre.
      const fa = fator(car.s + 130, 0.75), fb = fator(car.s + 130, -0.75);
      const ideal = fa < fb ? 0.75 : -0.75;
      let quer = ideal * car.mira + car.linha * (1 - car.mira);
      for (const o of obstaculos) {
        if (o.caido > 0 && o.tipo === 'cone') continue;
        const ds = mod(o.s - car.s);
        if (ds < 340 && Math.abs(o.u - car.u) < 0.45) quer = o.u > 0 ? o.u - 0.62 : o.u + 0.62;
      }
      quer = Math.max(-0.9, Math.min(0.9, quer));
      car.u += Math.max(-0.9 * dt, Math.min(0.9 * dt, quer - car.u));
      const antesC = car.s;
      car.s += car.spd * dt / fator(car.s, car.u);
      if (passouPor(antesC, car.s, 0)) car.voltas++;
      for (const rs of rampas) if (passouPor(antesC, car.s, rs) && car.voo <= 0) saltar(car, 480);
      voar(car, dt, false);

      // toque connosco: "boing", ninguém se estraga
      const ds = mod(mota.s - car.s + P / 2) - P / 2;
      if (mota.voo <= 0 && car.voo <= 0 && Math.abs(ds) < 56 && Math.abs(mota.u - car.u) < 0.55 && car.boing <= 0) {
        car.boing = 0.6; mota.boing = 0.5;
        const lado = Math.sign(mota.u - car.u) || 1;
        mota.u = Math.max(-1, Math.min(1, mota.u + lado * 0.2));
        car.u = Math.max(-1, Math.min(1, car.u - lado * 0.2));
        mota.spd *= 0.85; car.spd *= 0.85;
        G.audio.sfx('boing');
        const p = ponto(car.s, car.u);
        confete(p.x, p.y, 4);
      }
    }

    /* ---- obstáculos ---- */
    for (const o of obstaculos) {
      if (o.caido > 0) {
        o.caido -= dt; o.rot += dt * 2;
        o.dx *= 0.94; o.dy *= 0.94;
        if (o.caido <= 0) { o.dx = 0; o.dy = 0; }       // o cone volta a pôr-se de pé
        continue;
      }
      const raio = o.tipo === 'pneu' ? 0.34 : 0.24;
      const dsM = mod(mota.s - o.s + P / 2) - P / 2;
      if (mota.voo <= 0 && Math.abs(dsM) < (o.tipo === 'pneu' ? 46 : 38) && Math.abs(mota.u - o.u) < raio) {
        bater(o, mota);
        continue;
      }
      for (const car of carros) {
        const ds = mod(car.s - o.s + P / 2) - P / 2;
        if (car.voo <= 0 && Math.abs(ds) < 40 && Math.abs(car.u - o.u) < raio) { bater(o, car); break; }
      }
    }

    /* ---- estrelas: enchem o turbo ---- */
    for (const e of estrelas) {
      if (e.apanhada) {
        const d = mod(e.s - mota.s + P / 2) - P / 2;
        if (d > 700) e.apanhada = false;
        continue;
      }
      const ds = mod(mota.s - e.s + P / 2) - P / 2;
      if (Math.abs(ds) < 44 && Math.abs(mota.u - e.u) < 0.5 && mota.alt < 60) {
        e.apanhada = true;
        G.addStars(1); G.audio.sfx('star');
        meter = Math.min(TURBO_NEED, meter + 1);
        if (meter >= TURBO_NEED && turbo <= 0 && !avisado) {
          avisado = true;
          G.banner('⚡ TURBO pronto! Carrega no ⚡', 2000);
        }
      }
    }

    // classificação ao vivo
    mota.prog = progresso(mota);
    lugar = 1;
    for (const car of carros) { car.prog = progresso(car); if (car.prog > mota.prog) lugar++; }

    passoConfetes(dt);
    for (const m of marcas) m.t += dt;
    camera(dt);
  };

  function passouPor(a, b, alvo) {          // passámos pelo ponto `alvo` entre a e b?
    const da = mod(a - alvo), db = mod(b - alvo);
    return db < da && db < 400;
  }

  function saltar(o, forca) {
    if (o.voo > 0) return;
    o.vy = forca; o.voo = 0.01; o.alt = o.alt || 0;
    if (o === mota) G.audio.sfx(forca > 460 ? 'whee' : 'hop');
  }
  function voar(o, dt, ehMota) {
    if (!(o.voo > 0)) return;
    o.voo += dt;
    o.vy -= 900 * dt; o.alt += o.vy * dt;
    if (o.alt <= 0) {
      o.alt = 0; o.vy = 0; o.voo = 0;
      if (ehMota) {
        G.audio.sfx('boing');
        const p = ponto(o.s, o.u);
        confete(p.x, p.y, 5);
      }
    }
  }

  function terminar() {
    fase = 'fim'; fimT = 0;
    mota.prog = progresso(mota);
    lugar = 1;
    for (const car of carros) { car.prog = progresso(car); if (car.prog > mota.prog) lugar++; }
    const premio = [15, 10, 8, 6, 5][Math.min(4, lugar - 1)];
    G.addStars(premio);
    for (const car of carros) car.festa = 0.01;
    const p = ponto(mota.s, mota.u);
    confete(p.x, p.y, lugar === 1 ? 50 : 18);
    if (lugar === 1) {
      G.audio.sfx('tada'); G.audio.sfx('whee');
      G.banner('🏆 GANHASTE! 1.º lugar!', 3200);
    } else {
      G.audio.sfx('whistle'); G.audio.sfx('giggle');
      G.banner(lugar + '.º lugar! Para a próxima ganhas 🏁', 3200);
    }
  }

  function passoConfetes(dt) {
    for (let i = confetes.length - 1; i >= 0; i--) {
      const f = confetes[i];
      f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 420 * dt; f.rot += dt * 6;
      if (f.t > f.life) confetes.splice(i, 1);
    }
  }

  function camera(dt) {
    const p = ponto(mota.s, mota.u), d = dir(mota.s);
    const qx = p.x + d.x * 150, qy = p.y + d.y * 150;
    camX += (qx - camX) * Math.min(1, dt * 4.5);
    camY += (qy - camY) * Math.min(1, dt * 4.5);
  }

  /* ---------- desenho ---------- */
  function motaTopo(c, t, o) {
    c.save();
    c.scale(1.35, 1.35);
    c.rotate(o.lean || 0);
    c.strokeStyle = 'rgba(255,255,255,.9)';
    c.lineWidth = 7; c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(30, 0); c.lineTo(14, -13); c.lineTo(-30, -12);
    c.lineTo(-34, 0); c.lineTo(-30, 12); c.lineTo(14, 13);
    c.closePath(); c.stroke();
    c.fillStyle = '#22223b';
    G.gfx.rr(c, -30, -7, 20, 14, 6); c.fill();
    G.gfx.rr(c, 12, -6, 18, 12, 5); c.fill();
    c.fillStyle = '#e63946';
    c.beginPath();
    c.moveTo(30, 0); c.lineTo(14, -13); c.lineTo(-22, -12);
    c.lineTo(-28, 0); c.lineTo(-22, 12); c.lineTo(14, 13);
    c.closePath(); c.fill();
    c.fillStyle = '#fff';
    G.gfx.rr(c, -14, -9, 16, 18, 5); c.fill();
    G.gfx.label(c, '7', -6, 0, 15, '#e63946', 'center', 'none');
    c.fillStyle = '#3a86ff';
    G.gfx.rr(c, 6, -16, 5, 32, 2.5); c.fill();
    c.fillStyle = '#e63946';
    c.beginPath(); c.arc(-4, 0, 11, 0, TAU); c.fill();
    c.fillStyle = '#22223b';
    c.beginPath(); c.arc(1, 0, 11, -0.9, 0.9); c.fill();
    c.fillStyle = '#ffd9b3';
    c.beginPath(); c.ellipse(-12, 0, 6, 10, 0, 0, TAU); c.fill();
    c.restore();
  }

  function carrinhoTopo(c, t, o) {
    c.save();
    if (o.boing > 0) c.rotate(Math.sin(t * 40) * 0.09);
    c.fillStyle = '#22223b';
    G.gfx.rr(c, -22, -20, 14, 8, 3); c.fill();
    G.gfx.rr(c, -22, 12, 14, 8, 3); c.fill();
    G.gfx.rr(c, 10, -20, 14, 8, 3); c.fill();
    G.gfx.rr(c, 10, 12, 14, 8, 3); c.fill();
    c.fillStyle = o.cor;
    G.gfx.rr(c, -30, -17, 62, 34, 13); c.fill();
    c.fillStyle = 'rgba(255,255,255,.75)';
    G.gfx.rr(c, 2, -12, 14, 24, 6); c.fill();
    c.fillStyle = 'rgba(0,0,0,.18)';
    G.gfx.rr(c, -18, -12, 14, 24, 6); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(-9, 0, 9, 0, TAU); c.fill();
    G.gfx.label(c, '' + o.num, -9, 0, 14, '#22223b', 'center', 'none');
    c.save();
    c.translate(-34, 0); c.rotate(t * 7);
    c.strokeStyle = '#c9ced8'; c.lineWidth = 3.5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-8, 0); c.lineTo(8, 0); c.moveTo(0, -8); c.lineTo(0, 8); c.stroke();
    c.restore();
    c.restore();
  }

  function coneArt(c, o) {
    c.save();
    if (o.caido > 0) { c.translate(o.dx, o.dy); c.rotate(o.rot); }
    c.fillStyle = '#22223b';
    c.beginPath(); c.ellipse(0, 0, 15, 15, 0, 0, TAU); c.fill();
    c.fillStyle = '#f77f00';
    c.beginPath(); c.arc(0, 0, 12, 0, TAU); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(0, 0, 7.5, 0, TAU); c.fill();
    c.fillStyle = '#f77f00';
    c.beginPath(); c.arc(0, 0, 4, 0, TAU); c.fill();
    c.restore();
  }
  function pneuArt(c, o) {
    c.save(); c.rotate(o.rot);
    for (let k = 0; k < 3; k++) {
      c.fillStyle = k % 2 ? '#3c3f46' : '#2b2e34';
      c.beginPath(); c.arc(k * 2 - 2, k * 2 - 2, 22 - k * 3, 0, TAU); c.fill();
    }
    c.fillStyle = '#e63946';
    c.beginPath(); c.arc(0, 0, 8, 0, TAU); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(0, 0, 4, 0, TAU); c.fill();
    c.restore();
  }

  function pistaPath(c) {
    c.beginPath();
    c.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < N; i++) c.lineTo(pts[i].x, pts[i].y);
    c.closePath();
  }

  // caminho só de um troço (usado na ponte)
  function trocoPath(c, sA, sB) {
    c.beginPath();
    const passo = 16;
    for (let d = 0; d <= sB - sA; d += passo) {
      const p = pos(sA + d);
      if (d === 0) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y);
    }
    const p = pos(sB);
    c.lineTo(p.x, p.y);
  }

  const PONTE = 230;                     // meio comprimento do tabuleiro da ponte
  function porBaixo(s) {
    for (const cr of cruzamentos) if (Math.abs(mod(s - cr.s1 + P / 2) - P / 2) < PONTE * 0.8) return true;
    return false;
  }

  function desenhaPonte(c, cr) {
    const a = cr.s2 - PONTE, b = cr.s2 + PONTE;
    c.lineCap = 'butt'; c.lineJoin = 'round';
    // pilares nas pontas
    for (const s of [a + 40, b - 40]) {
      const p1 = ponto(s, -1.05), p2 = ponto(s, 1.05);
      c.strokeStyle = '#6b7280'; c.lineWidth = 26; c.lineCap = 'round';
      c.beginPath(); c.moveTo(p1.x, p1.y + 34); c.lineTo(p1.x, p1.y); c.stroke();
      c.beginPath(); c.moveTo(p2.x, p2.y + 34); c.lineTo(p2.x, p2.y); c.stroke();
      c.lineCap = 'butt';
    }
    // sombra no chão
    c.save();
    c.translate(0, 30);
    c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = TW + 30;
    trocoPath(c, a, b); c.stroke();
    c.restore();
    // tabuleiro
    c.strokeStyle = '#e63946'; c.lineWidth = TW + 26; trocoPath(c, a, b); c.stroke();
    c.setLineDash([46, 46]);
    c.strokeStyle = '#f8f9fa'; c.lineWidth = TW + 26; trocoPath(c, a, b); c.stroke();
    c.setLineDash([]);
    c.strokeStyle = '#4a4f5a'; c.lineWidth = TW; trocoPath(c, a, b); c.stroke();
    c.setLineDash([40, 46]);
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 5; trocoPath(c, a, b); c.stroke();
    c.setLineDash([]);
    // guardas laterais, para se perceber que vamos por cima
    for (const lado of [-1, 1]) {
      c.strokeStyle = '#f8f9fa'; c.lineWidth = 9;
      c.beginPath();
      for (let d = 0; d <= b - a; d += 18) {
        const p = ponto(a + d, lado * 1.12);
        if (d === 0) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y);
      }
      c.stroke();
    }
  }

  S.draw = function (c, t) {
    const W = G.W, H = G.H, z = zoom();
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#7ec96f'); g.addColorStop(1, '#4aa96c');
    c.fillStyle = g; c.fillRect(0, 0, W, H);

    c.save();
    c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-camX, -camY);

    // pneus decorativos por DENTRO e bandeirinhas por FORA. Numa pista às curvas o lado
    // de dentro muda, por isso escolhe-se o que estiver mais perto do meio do circuito.
    const meioX = bbox.x0 + bbox.w / 2, meioY = bbox.y0 + bbox.h / 2;
    function ladoDentro(s, d) {
      const a = ponto(s, -d), b = ponto(s, d);
      const da = Math.hypot(a.x - meioX, a.y - meioY), db = Math.hypot(b.x - meioX, b.y - meioY);
      return da < db ? a : b;
    }
    function ladoFora(s, d) {
      const a = ponto(s, -d), b = ponto(s, d);
      const da = Math.hypot(a.x - meioX, a.y - meioY), db = Math.hypot(b.x - meioX, b.y - meioY);
      return da < db ? b : a;
    }
    for (let k = 0; k < 20; k++) {
      const p = ladoDentro((P / 20) * k + 130, 1.9);
      c.fillStyle = '#3c3f46';
      c.beginPath(); c.arc(p.x, p.y, 16, 0, TAU); c.fill();
      c.fillStyle = '#5a5f68';
      c.beginPath(); c.arc(p.x, p.y, 7, 0, TAU); c.fill();
    }
    for (let k = 0; k < 24; k++) {
      const p = ladoFora((P / 24) * k + 60, 1.95);
      const cores = ['#ff595e', '#4cc9f0', '#8ac926', '#ffca3a'];
      c.save(); c.translate(p.x, p.y); c.rotate(p.ang);
      c.strokeStyle = '#e9ecef'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -52); c.stroke();
      c.fillStyle = cores[k % 4];
      c.beginPath();
      c.moveTo(0, -52); c.lineTo(26 + Math.sin(t * 3 + k) * 5, -44); c.lineTo(0, -34);
      c.closePath(); c.fill();
      c.restore();
    }

    c.lineJoin = 'round';
    c.strokeStyle = '#e63946'; c.lineWidth = TW + 26; pistaPath(c); c.stroke();
    c.setLineDash([46, 46]);
    c.strokeStyle = '#f8f9fa'; c.lineWidth = TW + 26; pistaPath(c); c.stroke();
    c.setLineDash([]);
    c.strokeStyle = '#4a4f5a'; c.lineWidth = TW; pistaPath(c); c.stroke();
    c.setLineDash([40, 46]);
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 5; pistaPath(c); c.stroke();
    c.setLineDash([]);

    for (const m of marcas) {
      c.globalAlpha = Math.max(0, 0.28 * (1 - m.t / 3));
      c.fillStyle = '#22223b';
      c.beginPath(); c.arc(m.x, m.y, 5, 0, TAU); c.fill();
    }
    c.globalAlpha = 1;

    // meta
    const meta = ponto(0, 0), dm = dir(0);
    c.save();
    c.translate(meta.x, meta.y); c.rotate(Math.atan2(dm.y, dm.x));
    for (let i = 0; i < 10; i++) for (let k = 0; k < 2; k++) {
      c.fillStyle = (i + k) % 2 ? '#fff' : '#22223b';
      c.fillRect(-16 + k * 16, -TW / 2 + i * (TW / 10), 16, TW / 10);
    }
    c.restore();

    // rampas
    for (const rs of rampas) {
      const p = ponto(rs, 0), d = dir(rs);
      c.save();
      c.translate(p.x, p.y); c.rotate(Math.atan2(d.y, d.x));
      c.fillStyle = '#ffd166';
      G.gfx.rr(c, -60, -TW / 2 + 14, 120, TW - 28, 14); c.fill();
      c.fillStyle = '#22223b';
      for (let k = 0; k < 5; k++) c.fillRect(-60 + k * 24, -TW / 2 + 14, 12, TW - 28);
      c.fillStyle = 'rgba(255,255,255,.85)';
      c.beginPath();
      c.moveTo(44, 0); c.lineTo(4, -30); c.lineTo(4, -12); c.lineTo(-40, -12);
      c.lineTo(-40, 12); c.lineTo(4, 12); c.lineTo(4, 30);
      c.closePath(); c.fill();
      c.restore();
    }

    // obstáculos
    for (const o of obstaculos) {
      const p = ponto(o.s, o.u);
      c.save(); c.translate(p.x, p.y); c.rotate(p.ang);
      if (o.tipo === 'cone') coneArt(c, o); else pneuArt(c, o);
      c.restore();
    }

    for (const e of estrelas) {
      if (e.apanhada) continue;
      const p = ponto(e.s, e.u);
      G.gfx.star(c, p.x, p.y, 21, '#ffd166', t * 1.4);
    }

    // Quem vai a passar POR BAIXO da ponte desenha-se antes dela; os outros depois.
    function desenhaCarro(car) {
      const p = ponto(car.s, car.u);
      if (car.alt > 4) {
        c.fillStyle = 'rgba(0,0,0,.25)';
        c.beginPath(); c.ellipse(p.x, p.y, 30, 14, p.ang, 0, TAU); c.fill();
      }
      c.save();
      c.translate(p.x, p.y - (car.alt || 0) * 0.5); c.rotate(p.ang);
      if (car.festa > 0) c.translate(0, Math.sin(t * 9) * 6);
      const kk = 1 + (car.alt || 0) / 420;
      c.scale(kk, kk);
      carrinhoTopo(c, t + car.t, car);
      c.restore();
    }
    const pm = ponto(mota.s, mota.u);
    function desenhaMota() {
      if (mota.alt > 4) {
        c.fillStyle = 'rgba(0,0,0,.25)';
        c.beginPath(); c.ellipse(pm.x, pm.y, 26, 12, pm.ang, 0, TAU); c.fill();
      }
      c.save();
      c.translate(pm.x, pm.y - mota.alt * 0.5); c.rotate(pm.ang);
      const k = 1 + mota.alt / 420;
      c.scale(k, k);
      motaTopo(c, t, { lean: mota.lean });
      c.restore();
      if (turbo > 0) {
        for (let i = 1; i < 7; i++) {
          const p = ponto(mota.s - i * 26, mota.u);
          c.globalAlpha = 0.5 - i * 0.06;
          G.gfx.star(c, p.x, p.y, 12 - i, '#ffd166', t * 6 + i);
        }
        c.globalAlpha = 1;
      }
    }

    for (const car of carros) if (porBaixo(car.s)) desenhaCarro(car);
    if (porBaixo(mota.s)) desenhaMota();
    for (const cr of cruzamentos) desenhaPonte(c, cr);
    for (const car of carros) if (!porBaixo(car.s)) desenhaCarro(car);
    if (!porBaixo(mota.s)) desenhaMota();

    for (const f of confetes) {
      c.save(); c.translate(f.x, f.y); c.rotate(f.rot);
      c.globalAlpha = Math.max(0, 1 - f.t / f.life);
      c.fillStyle = f.cor; c.fillRect(-6, -4, 12, 8);
      c.restore();
    }
    c.globalAlpha = 1;
    c.restore();

    /* ---------- HUD ---------- */
    G.gfx.star(c, 36, 46, 18, '#ffd166', 0);
    G.gfx.label(c, '' + G.state.stars, 64, 47, 32, '#b56b00');

    // lugar na corrida (medalha grande: é o que interessa saber)
    const cores = ['#ffd166', '#c9ced8', '#e08b4a', '#9fb1c7', '#9fb1c7'];
    c.save(); c.translate(36, 104);
    c.fillStyle = cores[Math.min(4, lugar - 1)];
    c.beginPath(); c.arc(0, 0, 26, 0, TAU); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 4; c.stroke();
    G.gfx.label(c, '' + lugar, 0, 2, 30, '#4a3200', 'center', 'rgba(255,255,255,.85)');
    c.restore();
    G.gfx.label(c, '/ ' + (carros.length + 1), 70, 106, 22, '#2b4a2b', 'left');

    // voltas
    for (let i = 0; i < VOLTAS; i++) {
      const x = 22 + i * 36, y = 140;
      c.save(); c.translate(x, y);
      c.fillStyle = i < mota.voltas ? '#ffd166' : 'rgba(255,255,255,.3)';
      G.gfx.rr(c, 0, 0, 28, 20, 5); c.fill();
      if (i < mota.voltas) {
        c.fillStyle = '#22223b';
        for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) {
          if ((a + b) % 2 === 0) c.fillRect(a * 9.3, b * 10, 9.3, 10);
        }
      }
      c.strokeStyle = '#fff'; c.lineWidth = 2.5;
      G.gfx.rr(c, 0, 0, 28, 20, 5); c.stroke();
      c.restore();
    }

    // turbo
    for (let i = 0; i < TURBO_NEED; i++) {
      G.gfx.star(c, 34 + i * 30, 186, 12, i < meter ? '#ffd166' : 'rgba(255,255,255,.28)', 0);
    }
    if (meter >= TURBO_NEED && turbo <= 0) {
      const pulso = 1 + Math.sin(t * 8) * 0.14;
      c.save(); c.translate(34 + TURBO_NEED * 30 + 4, 186); c.scale(pulso, pulso);
      c.fillStyle = '#ffd166';
      c.beginPath();
      c.moveTo(2, -15); c.lineTo(-8, 2); c.lineTo(-1, 2); c.lineTo(-3, 15);
      c.lineTo(9, -3); c.lineTo(1, -3); c.closePath(); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
      c.restore();
    }

    // mini-mapa da pista GERADA (escala pela caixa que a pista ocupa)
    const larg = Math.min(150, W * 0.32), e = larg / (bbox.w + TW);
    const alt = (bbox.h + TW) * e;
    const cx = W - larg / 2 - 16, cy = 116;
    c.fillStyle = 'rgba(20,30,25,.42)';
    G.gfx.rr(c, cx - larg / 2 - 10, cy - alt / 2 - 10, larg + 20, alt + 20, 12); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2.5;
    G.gfx.rr(c, cx - larg / 2 - 10, cy - alt / 2 - 10, larg + 20, alt + 20, 12); c.stroke();
    c.save();
    c.translate(cx, cy); c.scale(e, e);
    c.translate(-(bbox.x0 + bbox.w / 2), -(bbox.y0 + bbox.h / 2));
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = TW * 1.0;
    pistaPath(c); c.stroke();
    for (const car of carros) {
      const p = ponto(car.s, car.u);
      c.fillStyle = car.cor;
      c.beginPath(); c.arc(p.x, p.y, 90, 0, TAU); c.fill();
    }
    c.fillStyle = '#e63946';
    c.beginPath(); c.arc(pm.x, pm.y, 120, 0, TAU); c.fill();
    c.strokeStyle = '#22223b'; c.lineWidth = 36; c.stroke();
    c.restore();

    if (fase === 'partida') semaforo(c, t);
    if (fase === 'fim') podio(c, t);
  };

  // 3, 2, 1… JÁ! (números grandes, que ele já conhece)
  function semaforo(c, t) {
    const W = G.W, H = G.H;
    const n = Math.ceil(conta);
    const f = 1 - (conta - Math.floor(conta));
    // fica em cima, longe da mota — no meio do ecrã tapava-a toda
    c.save();
    c.translate(W / 2, Math.min(H * 0.24, 150));
    c.globalAlpha = 0.9;
    c.fillStyle = n > 0 ? 'rgba(20,30,25,.5)' : 'rgba(30,120,60,.55)';
    c.beginPath(); c.arc(0, 0, 52, 0, TAU); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 4; c.stroke();
    c.globalAlpha = 1;
    if (n > 0) {
      const k = 1 + f * 0.3;
      c.scale(k, k);
      G.gfx.label(c, '' + n, 0, 3, 58, '#fff', 'center', 'rgba(0,0,0,.55)');
    } else {
      c.fillStyle = '#8ac926';
      for (let i = 0; i < 3; i++) {
        c.beginPath(); c.arc(-28 + i * 28, 0, 11, 0, TAU); c.fill();
      }
    }
    c.restore();
  }

  // pódio: ganha um, os outros não — mas festejam todos na mesma
  function podio(c, t) {
    if (fimT < 1.2) return;
    const W = G.W, H = G.H;
    const todos = carros.map(function (o) { return { cor: o.cor, num: o.num, prog: o.prog, eu: false }; });
    todos.push({ cor: '#e63946', num: 7, prog: mota.prog, eu: true, mota: true });
    todos.sort(function (a, b) { return b.prog - a.prog; });
    const bw = Math.min(96, W * 0.2), bx = W / 2, by = H * 0.78;
    const alturas = [130, 96, 70];
    c.save();
    c.globalAlpha = Math.min(1, (fimT - 1.2) * 1.6);
    c.fillStyle = 'rgba(20,30,25,.55)';
    G.gfx.rr(c, bx - bw * 1.9, by - 200, bw * 3.8, 240, 18); c.fill();
    const ordem = [1, 0, 2];                       // 2.º à esquerda, 1.º ao meio, 3.º à direita
    for (const k of ordem) {
      const o = todos[k];
      if (!o) continue;
      const x = bx + (k === 0 ? 0 : (k === 1 ? -bw * 1.15 : bw * 1.15));
      const h = alturas[k];
      c.fillStyle = ['#ffd166', '#c9ced8', '#e08b4a'][k];
      G.gfx.rr(c, x - bw / 2, by - h, bw, h, 8); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 3;
      G.gfx.rr(c, x - bw / 2, by - h, bw, h, 8); c.stroke();
      G.gfx.label(c, '' + (k + 1), x, by - h / 2, 34, '#4a3200', 'center', 'rgba(255,255,255,.9)');
      c.save();
      c.translate(x, by - h - 30 - Math.abs(Math.sin(t * 5 + k)) * 6);
      c.rotate(-Math.PI / 2);
      c.scale(0.62, 0.62);
      if (o.mota) motaTopo(c, t, { lean: 0 });
      else carrinhoTopo(c, t, { cor: o.cor, num: o.num, boing: 0 });
      c.restore();
      if (o.eu) {
        G.gfx.star(c, x, by - h - 78, 15, '#ffd166', t * 2);
      }
    }
    c.restore();
  }

  S.debug = function () {
    return {
      s: Math.round(mota.s), u: +mota.u.toFixed(2), spd: Math.round(mota.spd),
      alt: Math.round(mota.alt), voltas: mota.voltas, lugar: lugar, fase: fase,
      meter: meter, turbo: +turbo.toFixed(1), batidas: batidas,
      perimetro: Math.round(P), obst: obstaculos.length, rampas: rampas.length,
      stars: G.state.stars,
      dist: carros.map(function (o) { return Math.round(progresso(o) - progresso(mota)); })
    };
  };

  // só para testes: gerar pistas à parte e medir a linha ideal em cada ponto
  S.api = {
    gerar: gerar,
    motivos: function () { const m = motivos; motivos = {}; return m; },
    medidas: function () {
      let trocas = 0, sinal = 0, reta = 0, maiorReta = 0, esq = 0, dir2 = 0;
      for (let i = 0; i < N; i++) {
        const kk = curv[i], comp = acc[i + 1] - acc[i];
        if (Math.abs(kk) > 1 / 900) {
          const s2 = Math.sign(kk);
          if (s2 > 0) dir2 += comp; else esq += comp;
          if (sinal !== 0 && s2 !== sinal) trocas++;
          sinal = s2; reta = 0;
        } else { reta += comp; maiorReta = Math.max(maiorReta, reta); }
      }
      return {
        P: P, bbox: bbox, N: N, cruzamentos: cruzamentos.length,
        curvMax: curv.reduce(function (m, v) { return Math.max(m, Math.abs(v)); }, 0),
        trocas: trocas, maiorReta: Math.round(maiorReta),
        curvaEsq: Math.round(esq), curvaDir: Math.round(dir2)
      };
    },
    sonda: function (s, u) { return { fator: fator(s, u), v: vCurva(s, u), k: curvaturaEm(s) }; },
    pontos: function () { return { pts: pts, bbox: bbox, cruz: cruzamentos, TW: TW }; },
    estado: function () { return { mota: mota, carros: carros, obst: obstaculos, P: P }; }
  };

  G.scenes = G.scenes || {};
  G.scenes.pista = S;
})();
