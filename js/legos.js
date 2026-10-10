/* Cena — LEGOS, para a Nicole (irmã do Isaac), de 2 anos e meio.

   Tudo se faz com UM TOQUE (nada de arrastar: aos dois anos ainda não se arrasta com
   jeito) e nada corre mal: um toque "errado" só faz o tijolo abanar e dizer a sua cor.
   Há uma voz (a do próprio telemóvel, em português) que diz as cores e conta — é aí
   que está a parte educativa, porque ela ainda não lê.

   Duas brincadeiras, escolhidas em dois cartões grandes:
     CONSTRUIR — aparece a sombra de uma coisa (torre, carro, pato, casa, foguetão,
       comboio, robô, flor) e o sítio do próximo tijolo a piscar na sua cor. Em baixo
       há 2 a 4 tijolos para escolher: tocar no da MESMA COR põe-no no sítio com um
       "clic" e a voz conta. No fim a coisa ganha vida (anda, voa, salta, dança).
       CORES + CONTAR + VOCABULÁRIO. O número de tijolos para escolher adapta-se:
       sobe quando acerta tudo, desce quando se engana muito.
     TORRE — cada toque deixa cair um tijolo; a voz conta 1, 2, 3… até 10 e ao 10 a
       torre cai toda (PUMBA!) e recomeça. CONTAR + causa e efeito. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  /* ---------- cores (os nomes são o que a voz diz) ---------- */
  const CORES = {
    vermelho: { hex: '#e3242b', nome: 'vermelho' },
    azul: { hex: '#1e6fd9', nome: 'azul' },
    amarelo: { hex: '#ffcf1a', nome: 'amarelo' },
    verde: { hex: '#1fae4b', nome: 'verde' },
    laranja: { hex: '#ff8a1c', nome: 'laranja' },
    rosa: { hex: '#ff6fb1', nome: 'cor-de-rosa' }
  };
  const TODAS = Object.keys(CORES);
  const PARECIDAS = {
    vermelho: ['laranja', 'rosa'], laranja: ['vermelho', 'amarelo'], rosa: ['vermelho'], amarelo: ['laranja']
  };
  const NUMEROS = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez'];

  /* ---------- as construções ----------
     x = coluna (em pinos), y = linha a contar de baixo, w = largura em pinos.
     A ordem dos tijolos é a ordem em que se põem (sempre de baixo para cima).
     olhos: [coluna, linha] do meio dos olhos (aparecem quando esse tijolo é posto).
     rodas: colunas das rodas; base: quantas linhas a coisa fica levantada do chão. */
  const DESENHOS = [
    { id: 'torre', frase: 'Uma torre!', vamos: 'uma torre', anim: 'danca', som: 'giggle',
      cols: 2, olhos: [1, 3],
      t: [[0, 0, 2, 'vermelho'], [0, 1, 2, 'azul'], [0, 2, 2, 'amarelo'], [0, 3, 2, 'verde']] },
    { id: 'carro', frase: 'Um carro! Pi pi!', vamos: 'um carro', anim: 'anda', som: 'beep',
      cols: 6, base: 0.5, rodas: [1.2, 4.8], olhos: [4.5, 1],
      t: [[0, 0, 3, 'vermelho'], [3, 0, 3, 'vermelho'], [1, 1, 2, 'azul'], [3, 1, 2, 'azul'], [5, 1, 1, 'amarelo']] },
    { id: 'pato', frase: 'Um pato! Quá quá!', vamos: 'um pato', anim: 'salta', som: 'quack',
      cols: 5, olhos: [3, 2], agua: true,
      t: [[0, 0, 4, 'amarelo'], [0, 1, 4, 'amarelo'], [2, 2, 2, 'amarelo'], [4, 2, 1, 'laranja']] },
    { id: 'casa', frase: 'Uma casa!', vamos: 'uma casa', anim: 'danca', som: 'giggle',
      cols: 6, olhos: [3, 1], fumo: true,
      t: [[0, 0, 2, 'vermelho'], [2, 0, 2, 'amarelo'], [4, 0, 2, 'vermelho'],
          [0, 1, 2, 'vermelho'], [2, 1, 2, 'amarelo'], [4, 1, 2, 'vermelho'],
          [0, 2, 6, 'azul'], [1, 3, 4, 'azul'], [2, 4, 2, 'azul']] },
    { id: 'foguetao', frase: 'Um foguetão! Lá vai ele!', vamos: 'um foguetão', anim: 'voa', som: 'whoosh',
      cols: 4, olhos: [2, 2],
      t: [[0, 0, 1, 'vermelho'], [1, 0, 2, 'azul'], [3, 0, 1, 'vermelho'],
          [1, 1, 2, 'azul'], [1, 2, 2, 'amarelo'], [1, 3, 2, 'azul'], [1, 4, 2, 'vermelho']] },
    { id: 'comboio', frase: 'Um comboio! Pouca terra!', vamos: 'um comboio', anim: 'anda', som: 'piui',
      cols: 6, base: 0.5, rodas: [0.9, 3, 5.1], olhos: [1, 1], fumo: true,
      t: [[0, 0, 3, 'azul'], [3, 0, 3, 'azul'], [0, 1, 2, 'vermelho'], [4, 1, 1, 'amarelo'], [0, 2, 2, 'vermelho']] },
    { id: 'robo', frase: 'Um robô! Bip bip!', vamos: 'um robô', anim: 'danca', som: 'zap',
      cols: 5, olhos: [2.5, 4],
      t: [[1, 0, 1, 'azul'], [3, 0, 1, 'azul'], [1, 1, 3, 'verde'], [0, 2, 5, 'verde'],
          [2, 3, 1, 'amarelo'], [1, 4, 3, 'azul']] },
    { id: 'flor', frase: 'Uma flor!', vamos: 'uma flor', anim: 'danca', som: 'giggle',
      cols: 5, olhos: [2.5, 4],
      t: [[1, 0, 3, 'laranja'], [2, 1, 1, 'verde'], [1, 2, 3, 'verde'], [2, 3, 1, 'verde'],
          [1, 4, 1, 'rosa'], [2, 4, 1, 'amarelo'], [3, 4, 1, 'rosa'], [1, 5, 3, 'rosa']] }
  ];
  for (const d of DESENHOS) {
    d.tij = d.t.map(function (a) { return { x: a[0], y: a[1], w: a[2], c: a[3] }; });
    d.linhas = 0;
    for (const b of d.tij) d.linhas = Math.max(d.linhas, b.y + 1);
  }

  /* ---------- voz (G.audio.fala, em audio.js) ---------- */
  function fala(txt, fila) {
    S.ultimaFala = txt;
    if (G.audio && G.audio.fala) G.audio.fala(txt, fila, 1.25);
  }

  /* ---------- estado ---------- */
  let modo, tempo, agenda, confetes, popups;
  let cons, torre;
  let ordem, prateleira;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function baralha(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  }
  function depois(seg, fn) { agenda.push({ t: tempo + seg, fn: fn }); }
  function sfx(n) { if (G.audio) G.audio.sfx(n); }

  function sombra(hex, k) {       // k > 0 clareia, k < 0 escurece
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (k > 0) { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
    else { r *= 1 + k; g *= 1 + k; b *= 1 + k; }
    return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
  }

  /* ---------- desenho do tijolo ----------
     (x, y) = canto de cima à esquerda do CORPO; os pinos ficam por cima. */
  function tijolo(c, x, y, w, s, hex) {
    const bw = w * s, bh = 1.2 * s, r = s * 0.14;
    const ph = s * 0.2, pr = s * 0.3;
    const borda = sombra(hex, -0.38);
    c.lineWidth = Math.max(1.4, s * 0.05);
    c.strokeStyle = borda;
    for (let i = 0; i < w; i++) {          // pinos
      const px = x + (i + 0.5) * s;
      c.fillStyle = sombra(hex, -0.06);
      G.gfx.rr(c, px - pr, y - ph, pr * 2, ph + r, r * 0.7); c.fill(); c.stroke();
      c.fillStyle = sombra(hex, 0.35);
      c.fillRect(px - pr * 0.62, y - ph * 0.72, pr * 0.34, ph * 0.55);
    }
    c.fillStyle = hex;
    G.gfx.rr(c, x, y, bw, bh, r); c.fill();
    c.save();
    G.gfx.rr(c, x, y, bw, bh, r); c.clip();
    c.fillStyle = sombra(hex, -0.2);
    c.fillRect(x, y + bh * 0.8, bw, bh * 0.2);
    c.fillStyle = sombra(hex, 0.28);
    c.fillRect(x + s * 0.12, y + s * 0.12, Math.max(2, s * 0.08), bh * 0.5);
    c.restore();
    G.gfx.rr(c, x, y, bw, bh, r); c.stroke();
  }

  // contorno às riscas de um tijolo que ainda falta pôr
  function fantasma(c, x, y, w, s, hex, forca) {
    const bw = w * s, bh = 1.2 * s, r = s * 0.14;
    c.save();
    c.globalAlpha = forca;
    c.fillStyle = hex;
    G.gfx.rr(c, x, y, bw, bh, r); c.fill();
    c.globalAlpha = Math.min(1, forca * 2.2);
    c.setLineDash([s * 0.22, s * 0.16]);
    c.lineWidth = Math.max(2, s * 0.07);
    c.strokeStyle = hex === '#ffffff' ? 'rgba(90,90,120,.5)' : sombra(hex, -0.3);
    G.gfx.rr(c, x, y, bw, bh, r); c.stroke();
    c.restore();
  }

  function olhos(c, x, y, s, t, fase) {
    const piscar = ((t + fase) % 3.4) < 0.13;
    const d = s * 0.42, er = s * 0.26;
    for (const k of [-1, 1]) {
      const ex = x + k * d;
      c.fillStyle = '#fff';
      c.beginPath(); c.ellipse(ex, y, er, piscar ? er * 0.12 : er * 1.15, 0, 0, TAU); c.fill();
      c.strokeStyle = '#22223b'; c.lineWidth = Math.max(1.2, s * 0.05); c.stroke();
      if (!piscar) {
        c.fillStyle = '#22223b';
        c.beginPath(); c.arc(ex + s * 0.04, y + s * 0.06, er * 0.55, 0, TAU); c.fill();
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(ex - s * 0.03, y - s * 0.05, er * 0.2, 0, TAU); c.fill();
      }
    }
  }

  function roda(c, x, y, r, ang) {
    c.fillStyle = '#2b2d42';
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.fillStyle = '#d9dce8';
    c.beginPath(); c.arc(x, y, r * 0.5, 0, TAU); c.fill();
    c.strokeStyle = '#8d93ab'; c.lineWidth = Math.max(1.5, r * 0.14);
    c.beginPath();
    c.moveTo(x + Math.cos(ang) * r * 0.45, y + Math.sin(ang) * r * 0.45);
    c.lineTo(x - Math.cos(ang) * r * 0.45, y - Math.sin(ang) * r * 0.45);
    c.stroke();
  }

  // placa verde com pinos (o chão dos Legos)
  function placa(c, x, y, w, s) {
    const h = s * 0.42;
    c.fillStyle = '#3aa655';
    G.gfx.rr(c, x, y, w, h, s * 0.12); c.fill();
    c.fillStyle = '#2d8a45';
    c.fillRect(x + 4, y + h * 0.7, w - 8, h * 0.3);
    const n = Math.max(1, Math.floor(w / s));
    const pad = (w - n * s) / 2;
    for (let i = 0; i < n; i++) {
      const px = x + pad + (i + 0.5) * s;
      c.fillStyle = '#4cc36a';
      G.gfx.rr(c, px - s * 0.28, y - s * 0.14, s * 0.56, s * 0.22, s * 0.08); c.fill();
    }
  }

  /* ---------- desenhar uma construção inteira ----------
     postos = quantos tijolos já lá estão; o resto aparece em fantasma (se fantasmas). */
  function geoDesenho(d, s, cx, chao) {
    const base = d.base || 0;
    return {
      s: s, x0: cx - (d.cols * s) / 2, chao: chao,
      topo: function (b) { return chao - (b.y + 1 + base) * 1.2 * s; }
    };
  }

  function desenhaConstrucao(c, d, g, postos, t, op) {
    op = op || {};
    const s = g.s;
    // fantasmas primeiro (por trás)
    if (op.fantasmas) {
      for (let i = postos; i < d.tij.length; i++) {
        const b = d.tij[i];
        const atual = i === postos && !op.semAtual;
        const f = atual ? 0.42 + 0.22 * Math.sin(t * 6) : 0.1;
        fantasma(c, g.x0 + b.x * s, g.topo(b), b.w, s, atual ? CORES[b.c].hex : '#8a8fb0', f);
      }
    }
    // tijolos postos, de baixo para cima (os pinos de cima ficam por cima)
    for (let i = 0; i < postos; i++) {
      const b = d.tij[i];
      const sq = op.squash && op.squash[i] ? op.squash[i] : 0;
      const x = g.x0 + b.x * s, y = g.topo(b);
      if (sq > 0) {
        const k = Math.sin(sq * Math.PI * 3) * sq * 0.14;
        c.save();
        c.translate(x + b.w * s / 2, y + 1.2 * s);
        c.scale(1 + k, 1 - k);
        c.translate(-(x + b.w * s / 2), -(y + 1.2 * s));
        tijolo(c, x, y, b.w, s, CORES[b.c].hex);
        c.restore();
      } else tijolo(c, x, y, b.w, s, CORES[b.c].hex);
    }
    if (d.rodas) {
      const ang = op.rodaAng || 0;
      for (const rx of d.rodas) roda(c, g.x0 + rx * s, g.chao - s * 0.5, s * 0.5, ang);
    }
    // os olhos aparecem quando o tijolo onde ficam já foi posto
    if (d.olhos) {
      let tem = false;
      for (let i = 0; i < postos; i++) {
        const b = d.tij[i];
        if (b.y === d.olhos[1] && d.olhos[0] >= b.x && d.olhos[0] <= b.x + b.w) tem = true;
      }
      if (tem) {
        const oy = g.chao - (d.olhos[1] + 0.5 + (d.base || 0)) * 1.2 * s;
        olhos(c, g.x0 + d.olhos[0] * s, oy, s * (d.id === 'torre' ? 0.9 : 0.75), t, d.cols);
      }
    }
  }

  /* ---------- layout ---------- */
  const TOPO = 70;             // faixa de cima (botões e prateleira)
  function alturaTabuleiro() { return G.H > G.W ? Math.max(130, G.H * 0.24) : Math.max(110, G.H * 0.28); }

  function layoutConstruir(d) {
    const W = G.W, H = G.H;
    const th = alturaTabuleiro();
    const zonaFundo = H - th - 8;
    const chao = zonaFundo - 22;
    const altZona = chao - TOPO - 10;
    const linhas = d.linhas + (d.base || 0) + 0.4;
    const s = Math.max(14, Math.min(92, (W * 0.8) / d.cols, altZona / (linhas * 1.2)));
    return { g: geoDesenho(d, s, W / 2, chao), trayY: H - th, trayH: th, chao: chao };
  }

  function celulas(n) {
    const W = G.W, th = alturaTabuleiro(), y0 = G.H - th;
    const cw = Math.min(W * 0.92 / n, th * 1.6);
    const x0 = W / 2 - (cw * n) / 2;
    const s = Math.min(cw * 0.78 / 2, (th * 0.66) / 1.4);
    const res = [];
    for (let i = 0; i < n; i++) {
      const cx = x0 + cw * (i + 0.5);
      res.push({ cx: cx, x: x0 + cw * i, w: cw, s: s, bx: cx - s, by: y0 + th * 0.5 - 0.6 * s + s * 0.1 });
    }
    return res;
  }

  // cartões do ecrã de escolha
  function cartoes() {
    const W = G.W, H = G.H;
    const alto = H > W * 1.05;
    if (alto) {
      const w = Math.min(W * 0.84, 460), h = Math.min((H - TOPO - 60) / 2, w * 0.95);
      const x = W / 2 - w / 2, gap = 24, y0 = TOPO + ((H - TOPO) - (h * 2 + gap)) / 2;
      return [{ x: x, y: y0, w: w, h: h, modo: 'construir' }, { x: x, y: y0 + h + gap, w: w, h: h, modo: 'torre' }];
    }
    const h = Math.min(H - TOPO - 40, 460), w = Math.min((W - 80) / 2, h * 1.15);
    const gap = 30, x0 = W / 2 - (w * 2 + gap) / 2, y = TOPO + ((H - TOPO) - h) / 2;
    return [{ x: x0, y: y, w: w, h: h, modo: 'construir' }, { x: x0 + w + gap, y: y, w: w, h: h, modo: 'torre' }];
  }

  // botão pequeno (para os pais) que volta aos cartões: canto de cima à esquerda
  const BV = { x: 38, y: 38, r: 25 };

  /* ---------- CONSTRUIR ---------- */
  function proximoDesenho() {
    if (!ordem.length) {
      // primeiro vão por ordem (do mais fácil ao mais comprido), depois ao calhas
      ordem = baralha(DESENHOS.map(function (_, i) { return i; }).slice(1));
      if (cons && ordem[0] === cons.di) ordem.push(ordem.shift());
    }
    return ordem.shift();
  }

  function comecaDesenho(di) {
    const n = cons ? cons.n : 2;
    cons = {
      di: di, d: DESENHOS[di], feito: 0, n: n, erros: 0,
      opcoes: [], voo: null, fimT: null, idleT: 0, dicaT: 0, dica: false,
      squash: {}, anim: { dx: 0, dy: 0, rot: 0, sy: 1 }, entra: 0, saltos: 0
    };
    fala('Vamos fazer ' + cons.d.vamos + '!');
    depois(1.5, novoPasso);
  }

  function novoPasso() {
    if (modo !== 'construir') return;
    const d = cons.d;
    if (cons.feito >= d.tij.length) { acabou(); return; }
    const alvo = d.tij[cons.feito].c;
    // com poucas escolhas, as cores parecidas ficam de fora (vermelho/laranja/rosa,
    // laranja/amarelo): primeiro aprende-se o que é bem diferente
    const parecidas = cons.n < 4 ? (PARECIDAS[alvo] || []) : [];
    const outras = baralha(TODAS.filter(function (k) { return k !== alvo && parecidas.indexOf(k) < 0; })).slice(0, cons.n - 1);
    const cores = baralha([alvo].concat(outras));
    cons.opcoes = cores.map(function (k, i) { return { cor: k, ap: -i * 0.08, wig: 0 }; });
    cons.idleT = 0; cons.dica = false; cons.dicaT = 0;
    // a mesma cor duas vezes seguidas: basta dizer a cor, ela já percebeu o jogo
    fala(CORES[alvo].nome + '!', true);
  }

  function tocaConstruir(x, y) {
    if (cons.fimT !== null) {                          // já acabou: tocar faz saltar outra vez
      if (cons.fimT > 0.8 && cons.saltos < 6) { cons.saltos++; cons.anim.extra = 0; sfx(cons.d.som); }
      return;
    }
    if (cons.voo || !cons.opcoes.length) return;
    const cel = celulas(cons.opcoes.length);
    if (y < G.H - alturaTabuleiro() - 16) return;     // só conta o tabuleiro de baixo
    let i = 0;
    for (let k = 0; k < cel.length; k++) if (x >= cel[k].x) i = k;
    const op = cons.opcoes[i];
    if (!op || op.usada) return;
    cons.idleT = 0;
    const alvo = cons.d.tij[cons.feito];
    if (op.cor === alvo.c) {
      const L = layoutConstruir(cons.d);
      op.usada = true;
      cons.voo = {
        cor: op.cor, t: 0, dur: 0.5,
        x0: cel[i].bx, y0: cel[i].by, s0: cel[i].s, w0: 2,
        x1: L.g.x0 + alvo.x * L.g.s, y1: L.g.topo(alvo), s1: L.g.s, w1: alvo.w
      };
      sfx('pop');
    } else {
      op.wig = 0.7;
      cons.erros++;
      cons.dica = true;
      sfx('boing');
      fala('Este é o ' + CORES[op.cor].nome + '.');
      fala('Onde está o ' + CORES[alvo.c].nome + '?', true);
    }
  }

  function pousou() {
    const b = cons.d.tij[cons.feito];
    cons.squash[cons.feito] = 1;
    cons.feito++;
    cons.voo = null;
    sfx('clic');
    const L = layoutConstruir(cons.d);
    popups.push({ x: L.g.x0 + (b.x + b.w / 2) * L.g.s, y: L.g.topo(b) - L.g.s * 0.5, txt: '' + cons.feito,
      cor: CORES[b.c].hex, t: 0 });
    fala(NUMEROS[cons.feito] || ('' + cons.feito));
    cons.opcoes = [];
    depois(0.75, novoPasso);
  }

  function acabou() {
    cons.fimT = 0; cons.saltos = 0; cons.anim.extra = null;
    sfx('tada');
    depois(0.5, function () { sfx(cons.d.som); });
    fala(cons.d.frase + ' Muito bem, Nicole!');
    G.addStars(1);
    prateleira.push(cons.di);
    if (prateleira.length > 12) prateleira.shift();
    const L = layoutConstruir(cons.d);
    chuvaConfetes(G.W / 2, L.chao - L.g.s * 3, 70);
    // a dificuldade acompanha a menina: sem enganos sobe, com muitos desce
    if (cons.erros === 0) cons.n = Math.min(4, cons.n + 1);
    else if (cons.erros >= 3) cons.n = Math.max(2, cons.n - 1);
    depois(4.4, function () {
      if (modo !== 'construir') return;
      comecaDesenho(proximoDesenho());
    });
  }

  function updateConstruir(dt) {
    for (const k in cons.squash) {
      cons.squash[k] = Math.max(0, cons.squash[k] - dt * 2.2);
      if (!cons.squash[k]) delete cons.squash[k];
    }
    for (const o of cons.opcoes) { o.ap += dt; o.wig = Math.max(0, o.wig - dt); }
    if (cons.voo) {
      cons.voo.t += dt;
      if (cons.voo.t >= cons.voo.dur) pousou();
    }
    if (cons.fimT === null && !cons.voo && cons.opcoes.length) {
      cons.idleT += dt;
      // ajuda: ao fim de 5 s parada, o tijolo certo salta e aparece a mãozinha
      if (cons.idleT > 5 && !cons.dica) {
        cons.dica = true; cons.dicaT = 0;
        fala('Onde está o ' + CORES[cons.d.tij[cons.feito].c].nome + '?');
      }
      if (cons.dica) {
        cons.dicaT += dt;
        if (cons.dicaT > 11) { cons.dicaT = 0; fala(CORES[cons.d.tij[cons.feito].c].nome + '!'); }
      }
    }
    // animação do fim (a coisa ganha vida)
    const a = cons.anim;
    a.dx = 0; a.dy = 0; a.rot = 0; a.sy = 1; a.chama = 0; a.rodaAng = 0;
    if (cons.fimT !== null) {
      cons.fimT += dt;
      const f = cons.fimT, tipo = cons.d.anim, W = G.W;
      if (tipo === 'anda') {
        // vai-se embora pela direita e volta pela esquerda
        if (f > 0.5 && f < 1.9) a.dx = Math.pow((f - 0.5) / 1.4, 1.6) * (W * 0.75);
        else if (f >= 1.9 && f < 3.3) a.dx = -(1 - Math.pow((f - 1.9) / 1.4, 0.7)) * (W * 0.75);
        a.rodaAng = f * 14;
        a.dy = -Math.abs(Math.sin(f * 18)) * 2;
      } else if (tipo === 'voa') {
        if (f > 0.4 && f < 2.1) { a.dy = -Math.pow((f - 0.4) / 1.7, 2) * G.H * 1.1; a.chama = 1; }
        else if (f >= 2.1 && f < 3.6) { a.dy = -(1 - Math.sin(((f - 2.1) / 1.5) * Math.PI / 2)) * G.H * 1.1; a.chama = 0.6; }
        a.dx = Math.sin(f * 30) * (a.chama ? 1.5 : 0);
      } else if (tipo === 'salta') {
        const ph = (f * 2.2) % 1;
        if (f < 3.2) { a.dy = -Math.sin(ph * Math.PI) * 60; a.sy = ph < 0.12 || ph > 0.9 ? 0.9 : 1.04; }
      } else {
        if (f < 3.4) a.rot = Math.sin(f * 7) * 0.13 * Math.min(1, (3.4 - f));
      }
      if (a.extra !== null && a.extra !== undefined) {          // salto extra pedido com um toque
        a.extra += dt;
        if (a.extra < 0.5) a.dy += -Math.sin((a.extra / 0.5) * Math.PI) * 50;
        else a.extra = null;
      }
    }
  }

  function drawConstruir(c, t) {
    const W = G.W, H = G.H, d = cons.d;
    const L = layoutConstruir(d), g = L.g, s = g.s;
    // chão verde de pinos, de ponta a ponta
    placa(c, 12, L.chao, W - 24, Math.max(22, Math.min(40, s * 0.7)));
    if (d.agua) {                      // o pato está num laguinho
      c.fillStyle = 'rgba(76,201,240,.55)';
      c.beginPath(); c.ellipse(W / 2, L.chao - 2, d.cols * s * 0.75, s * 0.32, 0, 0, TAU); c.fill();
    }
    const a = cons.anim;
    c.save();
    c.translate(a.dx, a.dy);
    c.translate(W / 2, L.chao); c.rotate(a.rot); c.scale(1, a.sy); c.translate(-W / 2, -L.chao);
    if (a.chama) {                     // chama do foguetão
      const fl = s * (1.1 + Math.random() * 0.6) * a.chama;
      c.fillStyle = '#ff9f1c';
      c.beginPath(); c.moveTo(W / 2 - s * 0.7, L.chao); c.lineTo(W / 2, L.chao + fl * 1.6); c.lineTo(W / 2 + s * 0.7, L.chao); c.fill();
      c.fillStyle = '#ffe066';
      c.beginPath(); c.moveTo(W / 2 - s * 0.35, L.chao); c.lineTo(W / 2, L.chao + fl); c.lineTo(W / 2 + s * 0.35, L.chao); c.fill();
    }
    desenhaConstrucao(c, d, g, cons.feito, t, {
      fantasmas: cons.fimT === null, squash: cons.squash, rodaAng: a.rodaAng, semAtual: !!cons.voo
    });
    // fumo da chaminé (casa) ou da locomotiva, quando está pronta
    if (d.fumo && cons.fimT !== null) {
      const top = d.tij[d.tij.length - 1];
      const fx = g.x0 + (d.id === 'casa' ? (top.x + top.w) : 4.5) * s;
      const fy = g.topo(d.id === 'casa' ? top : d.tij[3]);
      for (let k = 0; k < 4; k++) {
        const p = ((t * 0.7 + k * 0.25) % 1);
        c.fillStyle = 'rgba(255,255,255,' + (0.75 * (1 - p)) + ')';
        c.beginPath(); c.arc(fx + Math.sin(p * 5 + k) * s * 0.3 - p * s * 0.6, fy - s * 0.3 - p * s * 2.4, s * (0.22 + p * 0.4), 0, TAU); c.fill();
      }
    }
    c.restore();

    // o tijolo a voar do tabuleiro para o sítio
    if (cons.voo) {
      const v = cons.voo, k = Math.min(1, v.t / v.dur);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const sv = v.s0 + (v.s1 - v.s0) * e;
      const wv = k < 0.6 ? v.w0 : v.w1;
      const x = v.x0 + (v.x1 - v.x0) * e;
      const y = v.y0 + (v.y1 - v.y0) * e - Math.sin(k * Math.PI) * Math.min(160, H * 0.18);
      tijolo(c, x, y, wv, sv, CORES[v.cor].hex);
    }

    // tabuleiro de baixo com os tijolos para escolher
    const th = alturaTabuleiro(), ty = H - th;
    c.fillStyle = 'rgba(255,255,255,.55)';
    G.gfx.rr(c, 8, ty, W - 16, th - 8, 26); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 4;
    G.gfx.rr(c, 8, ty, W - 16, th - 8, 26); c.stroke();
    if (cons.opcoes.length) {
      const cel = celulas(cons.opcoes.length);
      const alvo = cons.fimT === null && cons.feito < d.tij.length ? d.tij[cons.feito].c : null;
      cons.opcoes.forEach(function (o, i) {
        if (o.usada) return;
        const ce = cel[i];
        const ap = Math.max(0, Math.min(1, o.ap / 0.3));
        if (ap <= 0) return;
        const sal = cons.dica && o.cor === alvo ? Math.abs(Math.sin(t * 7)) * ce.s * 0.45 : 0;
        const wig = o.wig > 0 ? Math.sin(o.wig * 40) * 0.2 * o.wig : 0;
        c.save();
        c.translate(ce.cx, ce.by + 0.6 * ce.s - sal);
        c.rotate(wig);
        const esc = ap < 1 ? 0.4 + 0.6 * Math.sin(ap * Math.PI / 2) * 1.08 : 1;
        c.scale(esc, esc);
        tijolo(c, -ce.s, -0.6 * ce.s, 2, ce.s, CORES[o.cor].hex);
        c.restore();
        if (sal) {                   // mãozinha a apontar
          c.save();
          c.font = Math.round(ce.s * 0.9) + 'px sans-serif';
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText('👆', ce.cx + ce.s * 0.9, ce.by + ce.s * 1.25 + Math.sin(t * 7) * 6);
          c.restore();
        }
      });
    }

    // prateleira: as coisas que ela já construiu, em miniatura, lá em cima
    const miniH = 40, espaco = 58;
    const x0 = BV.x + BV.r + 22, xMax = W - 140;
    const cabem = Math.max(0, Math.floor((xMax - x0) / espaco));
    const lista = prateleira.slice(-cabem);
    lista.forEach(function (di, i) {
      const dd = DESENHOS[di];
      const ms = Math.min(miniH / ((dd.linhas + (dd.base || 0)) * 1.2 + 0.3), 48 / dd.cols);
      const gg = geoDesenho(dd, ms, x0 + i * espaco + espaco / 2, 18 + miniH);
      desenhaConstrucao(c, dd, gg, dd.tij.length, t, {});
    });
  }

  /* ---------- TORRE ---------- */
  const MAX_TORRE = 10;
  function layoutTorre() {
    const W = G.W, H = G.H;
    const chao = H - 46;
    const s = Math.max(16, Math.min(78, (chao - TOPO - 20) / (MAX_TORRE * 1.2 + 1.2), W * 0.16));
    return { chao: chao, s: s, cx: W / 2 - s * 0.9 };
  }

  function comecaTorre() {
    torre = { pecas: [], cai: null, pend: 0, tomba: null, ultima: null };
    fala('Toca para pôr um tijolo!');
  }

  function lancaTijolo() {
    if (torre.pecas.length >= MAX_TORRE || torre.tomba) return;
    let cor;
    do { cor = TODAS[Math.floor(Math.random() * TODAS.length)]; } while (cor === torre.ultima);
    torre.ultima = cor;
    const L = layoutTorre();
    torre.cai = { cor: cor, off: rnd(-0.18, 0.18), y: TOPO - L.s * 1.2, vy: 0 };
    sfx('whoosh');
  }

  function tocaTorre() {
    if (torre.tomba) return;
    if (torre.cai) { torre.pend = Math.min(1, torre.pend + 1); return; }
    lancaTijolo();
  }

  function updateTorre(dt) {
    const L = layoutTorre(), s = L.s;
    for (const p of torre.pecas) p.sq = Math.max(0, (p.sq || 0) - dt * 2.4);
    if (torre.cai) {
      const k = torre.cai;
      k.vy += 2600 * dt;
      k.y += k.vy * dt;
      const alvoY = L.chao - (torre.pecas.length + 1) * 1.2 * s;
      if (k.y >= alvoY) {
        torre.pecas.push({ cor: k.cor, off: k.off, sq: 1 });
        torre.cai = null;
        sfx('clic');
        const n = torre.pecas.length;
        fala(NUMEROS[n]);
        if (n >= MAX_TORRE) {
          torre.pend = 0;
          depois(1.0, tombar);
        } else if (torre.pend) { torre.pend--; lancaTijolo(); }
      }
    }
    if (torre.tomba) {
      const tb = torre.tomba;
      tb.t += dt;
      for (const p of tb.partes) {
        p.vy += 1900 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        const fundo = L.chao - s * 0.6;
        if (p.y > fundo) {
          p.y = fundo; p.vy *= -0.42; p.vx *= 0.75; p.vr *= 0.6;
          if (Math.abs(p.vy) < 60) p.vy = 0;
        }
        if (p.x < s) { p.x = s; p.vx = Math.abs(p.vx) * 0.6; }
        if (p.x > G.W - s) { p.x = G.W - s; p.vx = -Math.abs(p.vx) * 0.6; }
      }
      if (tb.t > 3.4) {
        torre.tomba = null;
        fala('Outra vez!');
      }
    }
  }

  function tombar() {
    if (modo !== 'torre') return;
    const L = layoutTorre(), s = L.s;
    const lado = Math.random() < 0.5 ? -1 : 1;
    torre.tomba = { t: 0, partes: torre.pecas.map(function (p, i) {
      return {
        cor: p.cor, x: L.cx + p.off * s, y: L.chao - (i + 0.5) * 1.2 * s,
        vx: lado * (60 + i * 38) + rnd(-80, 80), vy: -rnd(100, 380) - i * 12,
        rot: 0, vr: lado * rnd(1.5, 5)
      };
    }) };
    torre.pecas = [];
    sfx('boing'); sfx('giggle');
    G.shake = 0.35;
    fala('Pumba!');
    G.addStars(1);
    chuvaConfetes(L.cx, L.chao - 8 * s, 60);
  }

  function drawTorre(c, t) {
    const W = G.W, L = layoutTorre(), s = L.s;
    placa(c, 12, L.chao, W - 24, Math.max(22, Math.min(40, s * 0.7)));
    // tijolos da torre
    torre.pecas.forEach(function (p, i) {
      const x = L.cx - s + p.off * s, y = L.chao - (i + 1) * 1.2 * s;
      if (p.sq > 0) {
        const k = Math.sin(p.sq * Math.PI * 3) * p.sq * 0.12;
        c.save();
        c.translate(L.cx, y + 1.2 * s); c.scale(1 + k, 1 - k); c.translate(-L.cx, -(y + 1.2 * s));
        tijolo(c, x, y, 2, s, CORES[p.cor].hex);
        c.restore();
      } else tijolo(c, x, y, 2, s, CORES[p.cor].hex);
    });
    // olhos no tijolo de cima (a torre olha para ela)
    if (torre.pecas.length) {
      const n = torre.pecas.length, p = torre.pecas[n - 1];
      olhos(c, L.cx + p.off * s, L.chao - (n - 0.5) * 1.2 * s, s * 0.8, t, 0);
    }
    if (torre.cai) tijolo(c, L.cx - s + torre.cai.off * s, torre.cai.y, 2, s, CORES[torre.cai.cor].hex);
    if (torre.tomba) {
      const al = Math.max(0, Math.min(1, (3.4 - torre.tomba.t) / 0.6));
      c.save(); c.globalAlpha = al;
      for (const p of torre.tomba.partes) {
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
        tijolo(c, -s, -0.6 * s, 2, s, CORES[p.cor].hex);
        c.restore();
      }
      c.restore();
    }
    // a escada dos números ao lado: acende-se um a um, na cor do tijolo
    const nx = L.cx + s * 2.1;
    for (let i = 0; i < MAX_TORRE; i++) {
      const y = L.chao - (i + 0.5) * 1.2 * s;
      const tem = i < torre.pecas.length;
      const tam = Math.max(14, Math.min(44, s * 0.8));
      if (tem) {
        const p = torre.pecas[i];
        const pulo = p.sq > 0 ? 1 + p.sq * 0.5 : 1;
        G.gfx.label(c, '' + (i + 1), nx, y, Math.round(tam * pulo), CORES[p.cor].hex, 'left', 'rgba(40,40,70,.75)');
      } else {
        G.gfx.label(c, '' + (i + 1), nx, y, Math.round(tam * 0.7), 'rgba(90,90,130,.28)', 'left', 'none');
      }
    }
    // no início, uma mãozinha a mostrar que é para tocar
    if (!torre.pecas.length && !torre.cai && !torre.tomba) {
      c.save();
      c.font = Math.round(s * 1.3) + 'px sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      const b = Math.abs(Math.sin(t * 4)) * 14;
      c.fillText('👆', L.cx, L.chao - s * 3 - b);
      c.restore();
    }
  }

  /* ---------- confetes e números ---------- */
  function chuvaConfetes(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = rnd(-Math.PI * 0.95, -Math.PI * 0.05), v = rnd(260, 720);
      confetes.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, rot: rnd(0, TAU), vr: rnd(-9, 9),
        cor: CORES[TODAS[i % TODAS.length]].hex, t: 0, w: rnd(7, 13) });
    }
  }

  /* ---------- ecrã de escolha ---------- */
  function drawEscolha(c, t) {
    const cs = cartoes();
    cs.forEach(function (k, i) {
      const pulso = 1 + Math.sin(t * 2.6 + i * 1.6) * 0.02;
      c.save();
      c.translate(k.x + k.w / 2, k.y + k.h / 2); c.scale(pulso, pulso); c.translate(-(k.x + k.w / 2), -(k.y + k.h / 2));
      c.fillStyle = 'rgba(0,0,0,.12)';
      G.gfx.rr(c, k.x + 4, k.y + 8, k.w, k.h, 34); c.fill();
      c.fillStyle = i === 0 ? '#fff4c2' : '#d7f0ff';
      G.gfx.rr(c, k.x, k.y, k.w, k.h, 34); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 7;
      G.gfx.rr(c, k.x, k.y, k.w, k.h, 34); c.stroke();
      const chao = k.y + k.h * 0.84;
      if (i === 0) {
        // um carro já feito, com os olhos
        const d = DESENHOS[1];
        const s = Math.min(k.w * 0.7 / d.cols, k.h * 0.6 / ((d.linhas + d.base) * 1.2));
        placa(c, k.x + k.w * 0.1, chao, k.w * 0.8, Math.max(16, s * 0.6));
        desenhaConstrucao(c, d, geoDesenho(d, s, k.x + k.w / 2, chao), d.tij.length, t, { rodaAng: t * 2 });
      } else {
        // uma torre de 5 com os números ao lado
        const s = Math.min(k.w * 0.2, k.h * 0.62 / (5 * 1.2));
        const cx = k.x + k.w * 0.42;
        placa(c, k.x + k.w * 0.1, chao, k.w * 0.8, Math.max(16, s * 0.6));
        const cores = ['vermelho', 'azul', 'amarelo', 'verde', 'rosa'];
        for (let j = 0; j < 5; j++) {
          const y = chao - (j + 1) * 1.2 * s + (j === 4 ? -Math.abs(Math.sin(t * 3)) * s * 0.6 : 0);
          tijolo(c, cx - s, y, 2, s, CORES[cores[j]].hex);
          G.gfx.label(c, '' + (j + 1), cx + s * 1.6, chao - (j + 0.5) * 1.2 * s, Math.round(s * 0.75),
            CORES[cores[j]].hex, 'left', 'rgba(40,40,70,.75)');
        }
      }
      c.restore();
    });
  }

  function botaoVoltar(c) {
    c.fillStyle = 'rgba(255,255,255,.55)';
    c.beginPath(); c.arc(BV.x, BV.y, BV.r, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 3; c.stroke();
    const q = 9, cores = ['vermelho', 'azul', 'amarelo', 'verde'];
    for (let i = 0; i < 4; i++) {
      c.fillStyle = CORES[cores[i]].hex;
      G.gfx.rr(c, BV.x - q - 1 + (i % 2) * (q + 2), BV.y - q - 1 + Math.floor(i / 2) * (q + 2), q, q, 2.5); c.fill();
    }
  }

  function vaiPara(m) {
    modo = m;
    agenda = [];
    popups = [];
    if (m === 'construir') {
      cons = null;
      ordem = DESENHOS.map(function (_, i) { return i; });
      comecaDesenho(proximoDesenho());
    } else if (m === 'torre') comecaTorre();
    else fala('Olá, Nicole! Vamos brincar com os Legos!');
  }

  /* ---------- cena ---------- */
  S.enter = function () {
    tempo = 0; confetes = []; popups = []; agenda = [];
    prateleira = prateleira || [];
    vaiPara('escolha');
  };

  S.update = function (dt) {
    tempo += dt;
    for (let i = agenda.length - 1; i >= 0; i--) {
      if (agenda[i].t <= tempo) { const f = agenda[i].fn; agenda.splice(i, 1); f(); }
    }
    const tp = G.input.tap;
    if (tp) {
      if (modo !== 'escolha' && Math.hypot(tp.x - BV.x, tp.y - BV.y) < BV.r + 10) {
        vaiPara('escolha');
      } else if (modo === 'escolha') {
        for (const k of cartoes()) {
          if (tp.x >= k.x && tp.x <= k.x + k.w && tp.y >= k.y && tp.y <= k.y + k.h) {
            sfx('pop'); vaiPara(k.modo); break;
          }
        }
      } else if (modo === 'construir') tocaConstruir(tp.x, tp.y);
      else if (modo === 'torre') tocaTorre();
    }
    // teclado (para os pais testarem): espaço também põe tijolos na torre
    if (modo === 'torre' && G.input.justPressed('fire')) tocaTorre();

    if (modo === 'construir') updateConstruir(dt);
    else if (modo === 'torre') updateTorre(dt);

    for (let i = confetes.length - 1; i >= 0; i--) {
      const p = confetes[i];
      p.t += dt; p.vy += 900 * dt; p.vx *= 0.99;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.t > 3 || p.y > G.H + 30) confetes.splice(i, 1);
    }
    for (let i = popups.length - 1; i >= 0; i--) {
      popups[i].t += dt;
      if (popups[i].t > 1.1) popups.splice(i, 1);
    }
  };

  function fundo(c, t) {
    const W = G.W, H = G.H;
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#fff7e0'); g.addColorStop(1, '#ffe1ec');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // bolinhas grandes e clarinhas na parede, como pinos gigantes
    const passo = 120;
    c.fillStyle = 'rgba(255,255,255,.5)';
    for (let y = 40; y < H; y += passo) {
      for (let x = ((y / passo) % 2) * passo / 2 + 30; x < W; x += passo) {
        c.beginPath(); c.arc(x, y + Math.sin(t * 0.8 + x * 0.01) * 3, 18, 0, TAU); c.fill();
      }
    }
  }

  S.draw = function (c, t) {
    fundo(c, t);
    if (modo === 'escolha') drawEscolha(c, t);
    else if (modo === 'construir') drawConstruir(c, t);
    else if (modo === 'torre') drawTorre(c, t);
    if (modo !== 'escolha') botaoVoltar(c);

    for (const p of popups) {
      const k = p.t / 1.1;
      const tam = 34 + Math.sin(Math.min(1, k * 3) * Math.PI / 2) * 30;
      c.save(); c.globalAlpha = 1 - Math.max(0, k - 0.6) / 0.4;
      G.gfx.label(c, p.txt, p.x, p.y - k * 50, Math.round(tam), p.cor, 'center', 'rgba(40,40,70,.8)');
      c.restore();
    }
    for (const p of confetes) {
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
      c.fillStyle = p.cor; c.fillRect(-p.w / 2, -p.w * 0.35, p.w, p.w * 0.7);
      c.restore();
    }
  };

  // para testes: estado resumido e onde tocar
  S.debug = function () {
    const r = { modo: modo };
    if (modo === 'construir' && cons) {
      r.desenho = cons.d.id; r.feito = cons.feito; r.total = cons.d.tij.length; r.n = cons.n;
      r.erros = cons.erros; r.fim = cons.fimT !== null; r.voo = !!cons.voo;
      r.alvo = cons.feito < cons.d.tij.length ? cons.d.tij[cons.feito].c : null;
      r.opcoes = cons.opcoes.map(function (o) { return o.usada ? null : o.cor; });
      r.celulas = celulas(cons.opcoes.length || 1).map(function (k) { return { x: k.cx, y: k.by + k.s * 0.6 }; });
    }
    if (modo === 'torre' && torre) { r.pecas = torre.pecas.length; r.cai = !!torre.cai; r.tomba = !!torre.tomba; }
    if (modo === 'escolha') r.cartoes = cartoes();
    r.fala = S.ultimaFala;
    return r;
  };

  G.scenes = G.scenes || {};
  G.scenes.legos = S;
})();
