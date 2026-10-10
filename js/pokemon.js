/* Cena — MEMÓRIA POKÉMON, ditada pelo Isaac.

   Jogo da memória com cartas de Pokémon, para DUAS pessoas da família no mesmo
   telemóvel (o Isaac, o pai, a mãe, a avó...), uma ao lado da outra. Cada um escolhe
   a sua cara no início. Viram-se duas cartas: se forem iguais, ganha-se uma MOEDA
   (voa para o círculo de moedas de quem as encontrou) e joga outra vez; se não forem,
   voltam a virar-se e passa a vez. Quando já não há cartas, ganha quem tem mais moedas.

   Seis níveis, como o Isaac os explicou: o 1 é o mais fácil, o 2 "um pouco fácil",
   o 3 é que é difícil... e o 6 é "o mais difícil do mundo". A dificuldade não é só o
   número de cartas, é também QUÃO PARECIDOS são os Pokémon entre eles:
     1 — 6 pares de Pokémon famosos e muito diferentes (Pikachu, Snorlax, Psyduck...)
     2 — 8 pares, quaisquer, sem dois da mesma família
     3 — 10 pares, e já aparecem duas famílias (ex.: Charmander e Charmeleon)
     4 — 12 pares, todos aos pares de família
     5 — 15 pares, famílias inteiras de três evoluções
     6 — 18 pares: famílias inteiras E cada Pokémon também na versão BRILHANTE
         (shiny), que é igual mas de outra cor

   "Tem todos os Pokémon": as imagens vêm da internet (PokeAPI, os 1025 Pokémon). É a
   única exceção do repositório à regra de zero ficheiros externos — não há maneira de
   desenhar mil Pokémon à mão. Sem internet as cartas mostram o número do Pokédex numa
   bola colorida e o jogo continua a dar para jogar. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  const ARTE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/';
  const MAXID = 1025;

  /* ---------- quem joga ---------- */
  const CARAS = [
    { e: '👦', nome: 'Isaac' }, { e: '👨', nome: 'Pai' }, { e: '👩', nome: 'Mãe' },
    { e: '👵', nome: 'Avó' }, { e: '👴', nome: 'Avô' }, { e: '👧', nome: 'Nicole' }
  ];
  const COR = ['#1e74d8', '#e0333c'];          // jogador 1 azul, jogador 2 vermelho
  const COR_CLARA = ['#cfe3ff', '#ffd6d8'];

  /* ---------- os Pokémon ---------- */
  // famosos e bem diferentes uns dos outros (nível 1) — um só de cada família
  const FAMOSOS = [25, 1, 4, 7, 39, 52, 54, 94, 129, 133, 143, 175, 132, 113, 131, 150, 151, 79, 104, 37];
  const NOMES = {
    25: 'Pikachu', 1: 'Bulbasaur', 4: 'Charmander', 7: 'Squirtle', 39: 'Jigglypuff', 52: 'Meowth',
    54: 'Psyduck', 94: 'Gengar', 129: 'Magikarp', 133: 'Eevee', 143: 'Snorlax', 175: 'Togepi',
    132: 'Ditto', 113: 'Chansey', 131: 'Lapras', 150: 'Mewtwo', 151: 'Mew', 79: 'Slowpoke',
    104: 'Cubone', 37: 'Vulpix'
  };
  // famílias de três evoluções (parecidas entre elas: é isso que torna os níveis 3-6 difíceis)
  const FAMILIAS = [
    [1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12], [13, 14, 15], [16, 17, 18], [29, 30, 31],
    [32, 33, 34], [43, 44, 45], [60, 61, 62], [63, 64, 65], [66, 67, 68], [69, 70, 71],
    [74, 75, 76], [92, 93, 94], [147, 148, 149], [172, 25, 26],
    [152, 153, 154], [155, 156, 157], [158, 159, 160], [179, 180, 181], [246, 247, 248],
    [252, 253, 254], [255, 256, 257], [258, 259, 260], [270, 271, 272], [273, 274, 275],
    [280, 281, 282], [293, 294, 295], [304, 305, 306], [328, 329, 330], [363, 364, 365],
    [371, 372, 373], [374, 375, 376],
    [387, 388, 389], [390, 391, 392], [393, 394, 395], [396, 397, 398], [403, 404, 405], [443, 444, 445],
    [495, 496, 497], [498, 499, 500], [501, 502, 503], [519, 520, 521], [524, 525, 526],
    [532, 533, 534], [540, 541, 542], [543, 544, 545], [551, 552, 553], [574, 575, 576],
    [577, 578, 579], [599, 600, 601], [607, 608, 609], [610, 611, 612], [633, 634, 635],
    [650, 651, 652], [653, 654, 655], [656, 657, 658], [661, 662, 663], [664, 665, 666],
    [669, 670, 671], [704, 705, 706],
    [722, 723, 724], [725, 726, 727], [728, 729, 730], [731, 732, 733], [736, 737, 738],
    [761, 762, 763], [782, 783, 784],
    [810, 811, 812], [813, 814, 815], [816, 817, 818], [821, 822, 823], [824, 825, 826],
    [837, 838, 839], [885, 886, 887],
    [906, 907, 908], [909, 910, 911], [912, 913, 914], [932, 933, 934], [935, 936, 937], [996, 997, 998]
  ];
  const NIVEIS = [
    { pares: 6 }, { pares: 8 }, { pares: 10 }, { pares: 12 }, { pares: 15 }, { pares: 18 }
  ];

  /* ---------- utilidades ---------- */
  function baralha(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function sfx(n) { if (G.audio) G.audio.sfx(n); }
  function fala(txt, fila) {
    S.ultimaFala = txt;
    if (G.audio && G.audio.fala) G.audio.fala(txt, fila);
  }
  function guarda(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sem memória, paciência */ } }
  function le(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  // escolhe os Pokémon do baralho conforme o nível: lista de { id, brilhante }
  function escolhePokemon(nivel) {
    const n = NIVEIS[nivel - 1].pares;
    const ids = [];
    function longe(qtd) {           // ao acaso, mas nunca dois da mesma família (nºs próximos)
      let tent = 0;
      while (qtd > 0 && tent++ < 5000) {
        const id = 1 + Math.floor(Math.random() * MAXID);
        if (ids.some(function (x) { return Math.abs(x - id) < 12; })) continue;
        ids.push(id); qtd--;
      }
    }
    function familias(qtd, quantos) {
      const fs = baralha(FAMILIAS.slice()).slice(0, qtd);
      for (const f of fs) {
        const ini = quantos >= f.length ? 0 : Math.floor(Math.random() * (f.length - quantos + 1));
        for (let k = 0; k < quantos; k++) ids.push(f[ini + k]);
      }
    }
    if (nivel === 1) return baralha(FAMOSOS.slice()).slice(0, n).map(function (id) { return { id: id, brilhante: false }; });
    if (nivel === 2) longe(n);
    else if (nivel === 3) { familias(2, 2); longe(n - 4); }
    else if (nivel === 4) familias(n / 2, 2);
    else if (nivel === 5) familias(n / 3, 3);
    else {
      familias(3, 3);
      return ids.map(function (id) { return { id: id, brilhante: false }; })
        .concat(ids.map(function (id) { return { id: id, brilhante: true }; }));
    }
    return ids.map(function (id) { return { id: id, brilhante: false }; });
  }

  /* ---------- imagens e nomes (da internet, com plano B) ---------- */
  const imagens = {};   // chave -> { img, ok, falhou }
  function chave(p) { return p.id + (p.brilhante ? 's' : ''); }
  function carregaImagem(p) {
    const k = chave(p);
    if (imagens[k]) return imagens[k];
    const r = { img: new Image(), ok: false, falhou: false, tent: 0 };
    const fontes = [
      ARTE + 'official-artwork/' + (p.brilhante ? 'shiny/' : '') + p.id + '.png',
      ARTE + 'home/' + (p.brilhante ? 'shiny/' : '') + p.id + '.png'
    ];
    r.img.crossOrigin = 'anonymous';
    r.img.onload = function () { r.ok = true; };
    r.img.onerror = function () {
      r.tent++;
      if (r.tent < fontes.length) r.img.src = fontes[r.tent];
      else r.falhou = true;
    };
    r.img.src = fontes[0];
    imagens[k] = r;
    return r;
  }
  const nomes = {};
  function nomeDe(id, depois) {
    if (nomes[id]) { depois(nomes[id]); return; }
    if (NOMES[id]) { nomes[id] = NOMES[id]; depois(NOMES[id]); return; }
    if (!window.fetch) return;
    fetch('https://pokeapi.co/api/v2/pokemon-species/' + id).then(function (r) { return r.json(); }).then(function (j) {
      const n = (j.name || '').split('-').map(function (s) { return s.charAt(0).toUpperCase() + s.slice(1); }).join(' ');
      if (n) { nomes[id] = n; depois(n); }
    }).catch(function () { /* sem nome, fica só a festa */ });
  }

  /* ---------- estado ---------- */
  let fase, tempo, nivel, quem, cartas, abertas, vez, moedas, moedasVistas, espera, voos, confetes;
  let carregaT, primeiro = 1, fimT;
  quem = [0, 1];
  const q0 = +le('isaacPokeQuem0'), q1 = +le('isaacPokeQuem1');
  if (q0 >= 0 && q0 < CARAS.length && q1 >= 0 && q1 < CARAS.length && q0 !== q1 && le('isaacPokeQuem0') !== null) quem = [q0, q1];

  S.enter = function () {
    fase = 'escolha';
    tempo = 0; voos = []; confetes = []; cartas = []; abertas = [];
    moedas = [0, 0]; moedasVistas = [0, 0]; espera = null;
    fala('Memória Pokémon! Escolham quem joga e o número.');
  };

  function comeca(n) {
    nivel = n;
    guarda('isaacPokeQuem0', '' + quem[0]); guarda('isaacPokeQuem1', '' + quem[1]);
    const lista = escolhePokemon(n);
    cartas = [];
    for (const p of lista) {
      carregaImagem(p);
      cartas.push({ p: p, k: chave(p), flip: 0, alvo: 0, dono: -1, pulo: 0, abana: 0 });
      cartas.push({ p: p, k: chave(p), flip: 0, alvo: 0, dono: -1, pulo: 0, abana: 0 });
    }
    baralha(cartas);
    abertas = []; moedas = [0, 0]; moedasVistas = [0, 0]; voos = []; confetes = [];
    espera = null; fimT = null;
    vez = primeiro; primeiro = 1 - primeiro;   // em cada jogo começa um diferente
    fase = 'carregar'; carregaT = 0;
    sfx('pop');
  }

  function prontas() {
    let n = 0;
    for (const c of cartas) { const r = imagens[c.k]; if (r && (r.ok || r.falhou)) n++; }
    return n / Math.max(1, cartas.length);
  }

  // "a vez do Pai", "a vez da Mãe": artigos certos para a voz
  function artigo(i) {
    const n = CARAS[quem[i]].nome;
    return (n === 'Mãe' || n === 'Avó' || n === 'Nicole') ? 'da ' : 'do ';
  }

  /* ---------- tocar numa carta ---------- */
  function tocaCarta(i) {
    const c = cartas[i];
    if (espera || c.dono >= 0 || c.alvo === 1 || abertas.length >= 2) return;
    c.alvo = 1;
    abertas.push(i);
    sfx('door');
    if (abertas.length === 2) espera = { t: tempo + 0.45, tipo: 'ver' };
  }

  function verPar() {
    const a = cartas[abertas[0]], b = cartas[abertas[1]];
    if (a.k === b.k) {
      a.dono = b.dono = vez; a.pulo = b.pulo = 1;
      moedas[vez]++;
      sfx('star');
      const L = layoutJogo();
      for (const i of abertas) {
        const r = L.cartas[i];
        voos.push({ x0: r.x + r.w / 2, y0: r.y + r.h / 2, j: vez, t: -0.15 * voos.length, dur: 0.75 });
      }
      for (let k = 0; k < 18; k++) {
        const r = L.cartas[abertas[k % 2]];
        confetes.push({ x: r.x + r.w / 2, y: r.y + r.h / 2, vx: (Math.random() - 0.5) * 420, vy: -150 - Math.random() * 320,
          t: 0, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12, cor: k % 3 ? '#ffd23f' : COR[vez], w: 7 + Math.random() * 6 });
      }
      const p = a.p;
      nomeDe(p.id, function (n) { fala(n + (p.brilhante ? ' brilhante' : '') + '!', true); });
      abertas = [];
      const falta = cartas.some(function (c) { return c.dono < 0; });
      if (!falta) espera = { t: tempo + 1.6, tipo: 'fim' };
      else espera = { t: tempo + 0.5, tipo: 'denovo' };
    } else {
      a.abana = b.abana = 1;
      sfx('boing');
      espera = { t: tempo + 1.4, tipo: 'virar' };
    }
  }

  function trataEspera() {
    if (!espera || tempo < espera.t) return;
    const e = espera; espera = null;
    if (e.tipo === 'ver') verPar();
    else if (e.tipo === 'denovo') fala('Outra vez, ' + CARAS[quem[vez]].nome + '!', true);
    else if (e.tipo === 'virar') {
      for (const i of abertas) cartas[i].alvo = 0;
      abertas = [];
      vez = 1 - vez;
      sfx('pop');
      fala('Agora é a vez ' + artigo(vez) + CARAS[quem[vez]].nome + '!');
    } else if (e.tipo === 'fim') acaba();
  }

  function acaba() {
    fase = 'fim'; fimT = tempo;
    sfx('tada');
    for (let k = 0; k < 80; k++) {
      confetes.push({ x: Math.random() * G.W, y: -20 - Math.random() * G.H * 0.5, vx: (Math.random() - 0.5) * 120, vy: Math.random() * 120,
        t: 0, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 10,
        cor: ['#ffd23f', COR[0], COR[1], '#3bb273', '#ff6fb1'][k % 5], w: 8 + Math.random() * 7 });
    }
    if (moedas[0] === moedas[1]) fala('Empate! Ganharam os dois, com ' + moedas[0] + ' moedas cada um!', true);
    else {
      const g = moedas[0] > moedas[1] ? 0 : 1;
      fala('Ganhou ' + (artigo(g) === 'da ' ? 'a ' : 'o ') + CARAS[quem[g]].nome + ', com ' + moedas[g] + ' moedas! Parabéns!', true);
    }
  }

  /* ---------- layouts (os mesmos para desenhar e para tocar) ---------- */
  function layoutEscolha() {
    const W = G.W, H = G.H;
    const u = Math.min(W / 640, H / 560);
    // ao alto o título desce para não ficar debaixo dos botões 🏠 e 🔊
    const s = clamp(Math.min(W / 11, H / 14), 22, 44);
    const titulo = { x: W / 2, y: (W < 600 ? 78 : 14) + s * 0.8, s: s };
    // duas filas de caras, uma por jogador
    const filas = [];
    const r = clamp(Math.min(W / 17, H / 14), 18, 40);
    const topo = titulo.y + s * 1.1 + r;
    for (let j = 0; j < 2; j++) {
      const y = topo + j * (r * 2.6);
      const larg = CARAS.length * r * 2.3;
      const x0 = W / 2 - larg / 2 + r * 1.15 + r * 0.9;
      const caras = CARAS.map(function (_, i) { return { x: x0 + i * r * 2.3, y: y, r: r }; });
      filas.push({ y: y, r: r, tag: { x: x0 - r * 2.1, y: y, r: r * 0.72 }, caras: caras });
    }
    // seis números
    const baixo = filas[1].y + r * 1.6;
    const livre = H - baixo - 12;
    const cols = W > H * 1.1 ? 6 : 3, rows = 6 / cols;
    const gap = 12;
    const bw = Math.min((W - 32 - gap * (cols - 1)) / cols, 130);
    const bh = Math.min((livre - gap * (rows - 1)) / rows, bw * 1.05);
    const tot = cols * bw + (cols - 1) * gap;
    const nums = [];
    for (let i = 0; i < 6; i++) {
      const cx = i % cols, cy = Math.floor(i / cols);
      nums.push({ n: i + 1, x: W / 2 - tot / 2 + cx * (bw + gap), y: baixo + cy * (bh + gap) + Math.max(0, (livre - rows * bh - (rows - 1) * gap) / 2), w: bw, h: bh });
    }
    return { titulo: titulo, filas: filas, nums: nums, u: u };
  }

  function layoutJogo() {
    const W = G.W, H = G.H;
    const deitado = W >= H * 1.05;
    const pan = [];
    let board;
    if (deitado) {
      const pw = clamp(W * 0.16, 100, 180);
      pan[0] = { x: 6, y: 70, w: pw - 6, h: H - 80 };
      pan[1] = { x: W - pw, y: 70, w: pw - 6, h: H - 80 };
      board = { x: pw + 6, y: 10, w: W - 2 * pw - 12, h: H - 20 };
    } else {
      const ph = clamp(H * 0.12, 80, 124);
      pan[0] = { x: 70, y: 6, w: W - 70 - 128, h: ph - 6 };
      pan[1] = { x: 6, y: H - ph, w: W - 12, h: ph - 6 };
      board = { x: 8, y: ph + 6, w: W - 16, h: H - 2 * ph - 12 };
    }
    // a grelha que dá as cartas maiores
    const n = cartas.length, gap = clamp(Math.min(board.w, board.h) * 0.015, 4, 10), asp = 0.78;
    let best = null;
    for (let cols = 1; cols <= n; cols++) {
      const rows = Math.ceil(n / cols);
      const cw = (board.w - gap * (cols - 1)) / cols, ch = (board.h - gap * (rows - 1)) / rows;
      const w = Math.min(cw, ch * asp);
      if (!best || w > best.w) best = { cols: cols, rows: rows, w: w };
    }
    const cw = best.w, ch = cw / asp;
    const tw = best.cols * cw + (best.cols - 1) * gap, th = best.rows * ch + (best.rows - 1) * gap;
    const ox = board.x + (board.w - tw) / 2, oy = board.y + (board.h - th) / 2;
    const rc = [];
    for (let i = 0; i < n; i++) {
      const cx = i % best.cols, cy = Math.floor(i / best.cols);
      // a última fila, se estiver incompleta, fica centrada
      const naFila = cy === best.rows - 1 ? n - cy * best.cols : best.cols;
      const desv = (best.cols - naFila) * (cw + gap) / 2;
      rc.push({ x: ox + desv + cx * (cw + gap), y: oy + cy * (ch + gap), w: cw, h: ch });
    }
    // dentro de cada painel: a cara e o círculo das moedas
    const pecas = pan.map(function (p) {
      const horiz = p.w > p.h * 1.3;
      if (horiz) {
        const r = Math.min(p.h * 0.36, p.w * 0.17);
        return { p: p, cara: { x: p.x + p.w * 0.3, y: p.y + p.h / 2, r: r }, moeda: { x: p.x + p.w * 0.7, y: p.y + p.h / 2, r: r } };
      }
      const r = Math.min(p.w * 0.36, p.h * 0.16);
      return { p: p, cara: { x: p.x + p.w / 2, y: p.y + p.h * 0.3, r: r }, moeda: { x: p.x + p.w / 2, y: p.y + p.h * 0.66, r: r } };
    });
    return { cartas: rc, pan: pecas, board: board, voltar: { x: 34, y: 36, r: 24 } };
  }

  function layoutFim() {
    const W = G.W, H = G.H, r = clamp(Math.min(W, H) * 0.08, 30, 56);
    return { de_novo: { x: W / 2 - r * 1.5, y: H * 0.82, r: r }, numeros: { x: W / 2 + r * 1.5, y: H * 0.82, r: r } };
  }

  function dentro(tp, k) {
    if (k.r !== undefined && k.w === undefined) return Math.hypot(tp.x - k.x, tp.y - k.y) <= k.r + 6;
    return tp.x >= k.x && tp.x <= k.x + k.w && tp.y >= k.y && tp.y <= k.y + k.h;
  }

  /* ---------- update ---------- */
  S.update = function (dt) {
    tempo += dt;
    const tp = G.input.tap;
    if (fase === 'escolha') {
      if (tp) {
        const L = layoutEscolha();
        L.filas.forEach(function (f, j) {
          f.caras.forEach(function (k, i) {
            if (!dentro(tp, k)) return;
            if (quem[1 - j] === i) quem[1 - j] = quem[j];   // a mesma cara não joga dos dois lados: trocam
            quem[j] = i;
            sfx('pop');
            fala(CARAS[i].nome);
          });
        });
        for (const b of L.nums) if (dentro(tp, b)) comeca(b.n);
      }
    } else if (fase === 'carregar') {
      carregaT += dt;
      if ((prontas() >= 1 && carregaT > 0.6) || carregaT > 9) {
        fase = 'jogo';
        sfx('whoosh');
        fala('Começa ' + (artigo(vez) === 'da ' ? 'a ' : 'o ') + CARAS[quem[vez]].nome + '!');
      }
      if (tp && dentro(tp, layoutJogo().voltar)) S.enter();
    } else if (fase === 'jogo') {
      trataEspera();
      if (tp) {
        const L = layoutJogo();
        if (dentro(tp, L.voltar)) S.enter();
        else for (let i = 0; i < L.cartas.length; i++) if (dentro(tp, L.cartas[i])) { tocaCarta(i); break; }
      }
    } else if (fase === 'fim') {
      if (tp && tempo - fimT > 1) {
        const F = layoutFim();
        if (dentro(tp, F.de_novo)) comeca(nivel);
        else if (dentro(tp, F.numeros)) S.enter();
      }
    }

    for (const c of cartas) {
      c.flip += clamp(c.alvo - c.flip, -dt * 4, dt * 4);
      c.pulo = Math.max(0, c.pulo - dt * 1.6);
      c.abana = Math.max(0, c.abana - dt * 1.4);
    }
    for (let i = voos.length - 1; i >= 0; i--) {
      const v = voos[i];
      v.t += dt;
      if (v.t >= v.dur) {
        voos.splice(i, 1);
        moedasVistas[v.j] = Math.min(moedas[v.j], moedasVistas[v.j] + 0.5);
        sfx('heart');
      }
    }
    if (!voos.length) moedasVistas = moedas.slice();
    for (let i = confetes.length - 1; i >= 0; i--) {
      const p = confetes[i];
      p.t += dt; p.vy += 700 * dt; p.vx *= 0.99;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.t > 4 || p.y > G.H + 30) confetes.splice(i, 1);
    }
  };

  /* ---------- desenho ---------- */
  function bola(c, x, y, r, rot) {           // pokébola
    c.save(); c.translate(x, y); c.rotate(rot || 0);
    c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.fillStyle = '#ee1c25'; c.beginPath(); c.arc(0, 0, r, Math.PI, 0); c.closePath(); c.fill();
    c.fillStyle = '#222'; c.fillRect(-r, -r * 0.09, r * 2, r * 0.18);
    c.lineWidth = r * 0.1; c.strokeStyle = '#222';
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, r * 0.3, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#eee'; c.beginPath(); c.arc(0, 0, r * 0.15, 0, TAU); c.fill();
    c.restore();
  }

  function moeda(c, x, y, r) {
    c.fillStyle = '#c98a00'; c.beginPath(); c.arc(x, y + r * 0.1, r, 0, TAU); c.fill();
    c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.strokeStyle = '#e0a800'; c.lineWidth = Math.max(1, r * 0.14);
    c.beginPath(); c.arc(x, y, r * 0.72, 0, TAU); c.stroke();
    G.gfx.star(c, x, y, r * 0.45, '#fff2a8', 0);
  }

  function fundo(c, t) {
    const W = G.W, H = G.H;
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#8fd3ff'); g.addColorStop(1, '#d8f5c9');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.globalAlpha = 0.12;
    for (let i = 0; i < 9; i++) {
      const x = ((i * 173 + t * 12) % (W + 120)) - 60, y = (i * 97) % H;
      bola(c, x, y, 26 + (i % 3) * 10, t * 0.3 + i);
    }
    c.globalAlpha = 1;
  }

  function cara(c, x, y, r, i, j, ativa, t) {
    c.save();
    if (ativa) { c.shadowColor = COR[j]; c.shadowBlur = r * 0.8; }
    c.fillStyle = ativa ? COR_CLARA[j] : 'rgba(255,255,255,.7)';
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.restore();
    c.lineWidth = Math.max(2, r * 0.13); c.strokeStyle = COR[j];
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
    c.save();
    c.font = Math.round(r * 1.2) + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(CARAS[i].e, x, y + r * 0.08);
    c.restore();
  }

  function drawEscolha(c, t) {
    const L = layoutEscolha();
    bola(c, L.titulo.x - L.titulo.s * 4.6, L.titulo.y, L.titulo.s * 0.55, Math.sin(t * 2) * 0.3);
    bola(c, L.titulo.x + L.titulo.s * 4.6, L.titulo.y, L.titulo.s * 0.55, -Math.sin(t * 2) * 0.3);
    G.gfx.label(c, 'POKÉMON', L.titulo.x, L.titulo.y, Math.round(L.titulo.s * 1.15), '#ffcb05', 'center', '#2a5cad');
    L.filas.forEach(function (f, j) {
      // etiqueta do jogador: bolinha 1 / 2 na cor dele
      c.fillStyle = COR[j]; c.beginPath(); c.arc(f.tag.x, f.tag.y, f.tag.r, 0, TAU); c.fill();
      G.gfx.label(c, '' + (j + 1), f.tag.x, f.tag.y + 1, Math.round(f.tag.r * 1.3), '#fff', 'center', 'rgba(0,0,0,.35)');
      f.caras.forEach(function (k, i) {
        const sel = quem[j] === i;
        const rr = k.r * (sel ? 1 + Math.sin(t * 5) * 0.05 : 0.82);
        c.globalAlpha = sel ? 1 : 0.6;
        cara(c, k.x, k.y, rr, i, j, sel, t);
        c.globalAlpha = 1;
      });
    });
    const cores = ['#3bb273', '#8ac926', '#ffca3a', '#ff924c', '#ff595e', '#9b1d64'];
    for (const b of L.nums) {
      const pulo = Math.sin(t * 3 + b.n) * 2;
      c.fillStyle = 'rgba(0,0,0,.18)';
      G.gfx.rr(c, b.x + 3, b.y + 5, b.w, b.h, 18); c.fill();
      c.fillStyle = cores[b.n - 1];
      G.gfx.rr(c, b.x, b.y + pulo, b.w, b.h, 18); c.fill();
      c.lineWidth = 4; c.strokeStyle = '#fff';
      G.gfx.rr(c, b.x, b.y + pulo, b.w, b.h, 18); c.stroke();
      G.gfx.label(c, '' + b.n, b.x + b.w / 2, b.y + pulo + b.h * 0.42, Math.round(Math.min(b.h * 0.55, b.w * 0.6)), '#fff', 'center', 'rgba(0,0,0,.45)');
      // cartinhas por baixo do número: quantas mais, mais difícil
      const np = Math.min(b.n, 6), cw = Math.min(b.w / 9, b.h * 0.1);
      for (let k = 0; k < np; k++) {
        const x = b.x + b.w / 2 + (k - (np - 1) / 2) * cw * 1.3;
        bolinha(c, x, b.y + pulo + b.h * 0.82, cw * 0.55);
      }
    }
  }
  function bolinha(c, x, y, r) {
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.fillStyle = '#ee1c25'; c.beginPath(); c.arc(x, y, r, Math.PI, 0); c.fill();
    c.strokeStyle = '#222'; c.lineWidth = Math.max(1, r * 0.2);
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
  }

  function costas(c, w, h) {
    const r = Math.min(w, h) * 0.12;
    const g = c.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, '#3c6fd1'); g.addColorStop(1, '#22409a');
    c.fillStyle = g; G.gfx.rr(c, -w / 2, -h / 2, w, h, r); c.fill();
    c.lineWidth = Math.max(2, w * 0.05); c.strokeStyle = '#ffcb05';
    G.gfx.rr(c, -w / 2 + w * 0.06, -h / 2 + w * 0.06, w * 0.88, h - w * 0.12, r * 0.7); c.stroke();
    bola(c, 0, 0, w * 0.3, 0);
  }

  function frente(c, w, h, carta) {
    const r = Math.min(w, h) * 0.12;
    const g = c.createRadialGradient(0, -h * 0.05, w * 0.05, 0, 0, h * 0.6);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#e3f1ff');
    c.fillStyle = g; G.gfx.rr(c, -w / 2, -h / 2, w, h, r); c.fill();
    const im = imagens[carta.k];
    const lado = Math.min(w, h) * 0.92;
    if (im && im.ok) {
      c.drawImage(im.img, -lado / 2, -lado / 2, lado, lado);
    } else {
      // plano B sem internet: o número do Pokédex numa bola com cor só dela
      const hue = (carta.p.id * 47 + (carta.p.brilhante ? 160 : 0)) % 360;
      c.fillStyle = 'hsl(' + hue + ',70%,58%)';
      c.beginPath(); c.arc(0, 0, lado * 0.38, 0, TAU); c.fill();
      G.gfx.label(c, '' + carta.p.id, 0, 0, Math.round(lado * 0.26), '#fff', 'center', 'rgba(0,0,0,.4)');
      if (carta.p.brilhante) G.gfx.star(c, lado * 0.3, -lado * 0.3, lado * 0.1, '#ffd23f', 0);
    }
    c.lineWidth = carta.dono >= 0 ? Math.max(3, w * 0.07) : Math.max(2, w * 0.03);
    c.strokeStyle = carta.dono >= 0 ? COR[carta.dono] : '#9db7d6';
    G.gfx.rr(c, -w / 2, -h / 2, w, h, r); c.stroke();
    if (carta.dono >= 0) moeda(c, w / 2 - w * 0.13, -h / 2 + w * 0.13, w * 0.1);
  }

  function drawCartas(c, t, L) {
    for (let i = 0; i < cartas.length; i++) {
      const k = cartas[i], r = L.cartas[i];
      const sx = Math.abs(Math.cos(k.flip * Math.PI));
      const pulo = Math.sin(k.pulo * Math.PI) * 0.18;
      c.save();
      c.translate(r.x + r.w / 2 + Math.sin(k.abana * 30) * k.abana * r.w * 0.06, r.y + r.h / 2);
      c.scale(Math.max(0.02, sx) * (1 + pulo), 1 + pulo);
      c.fillStyle = 'rgba(0,0,0,.15)';
      G.gfx.rr(c, -r.w / 2 + 2, -r.h / 2 + 4, r.w, r.h, Math.min(r.w, r.h) * 0.12); c.fill();
      if (k.flip > 0.5) frente(c, r.w, r.h, k); else costas(c, r.w, r.h);
      c.restore();
    }
  }

  function drawPaineis(c, t, L) {
    L.pan.forEach(function (pc, j) {
      const p = pc.p, ativa = fase === 'jogo' && vez === j;
      c.save();
      c.globalAlpha = ativa ? 0.55 + Math.sin(t * 5) * 0.15 : 0.35;
      c.fillStyle = ativa ? COR[j] : '#fff';
      G.gfx.rr(c, p.x, p.y, p.w, p.h, 22); c.fill();
      c.restore();
      if (ativa) { c.lineWidth = 4; c.strokeStyle = '#fff'; G.gfx.rr(c, p.x, p.y, p.w, p.h, 22); c.stroke(); }
      const bob = ativa ? Math.sin(t * 6) * pc.cara.r * 0.1 : 0;
      cara(c, pc.cara.x, pc.cara.y + bob, pc.cara.r, quem[j], j, ativa, t);
      // o círculo das moedas, com o número dentro
      const m = pc.moeda;
      c.fillStyle = '#fff4c2'; c.beginPath(); c.arc(m.x, m.y, m.r, 0, TAU); c.fill();
      c.lineWidth = Math.max(3, m.r * 0.16); c.strokeStyle = '#e0a800';
      c.beginPath(); c.arc(m.x, m.y, m.r, 0, TAU); c.stroke();
      moeda(c, m.x - m.r * 0.62, m.y - m.r * 0.62, m.r * 0.32);
      G.gfx.label(c, '' + Math.floor(moedasVistas[j]), m.x, m.y + 2, Math.round(m.r * 1.05), '#b07300', 'center');
    });
  }

  function botaoVoltar(c, L) {
    const b = L.voltar;
    c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(b.x, b.y, b.r, 0, TAU); c.fill();
    c.lineWidth = 3; c.strokeStyle = '#2a5cad'; c.stroke();
    G.gfx.label(c, '↩', b.x, b.y + 1, Math.round(b.r * 1.15), '#2a5cad', 'center', 'none');
  }

  function drawVoos(c, L) {
    for (const v of voos) {
      if (v.t < 0) continue;
      const k = v.t / v.dur, e = k * k * (3 - 2 * k);
      const m = L.pan[v.j].moeda;
      const x = v.x0 + (m.x - v.x0) * e, y = v.y0 + (m.y - v.y0) * e - Math.sin(k * Math.PI) * 120;
      moeda(c, x, y, m.r * 0.42 * (1 + Math.sin(k * Math.PI) * 0.6));
    }
  }

  function drawFim(c, t) {
    const W = G.W, H = G.H, F = layoutFim();
    c.fillStyle = 'rgba(20,30,70,.55)'; c.fillRect(0, 0, W, H);
    const empate = moedas[0] === moedas[1];
    const g = moedas[0] > moedas[1] ? 0 : 1;
    const r = clamp(Math.min(W, H) * 0.14, 50, 110);
    const lista = empate ? [0, 1] : [g];
    lista.forEach(function (j, n) {
      const x = W / 2 + (empate ? (n ? 1 : -1) * r * 1.4 : 0), y = H * 0.42 + Math.sin(t * 4 + n) * 8;
      cara(c, x, y, r, quem[j], j, true, t);
      // coroa
      c.fillStyle = '#ffd23f'; c.strokeStyle = '#c98a00'; c.lineWidth = 3;
      c.beginPath();
      c.moveTo(x - r * 0.6, y - r * 0.95); c.lineTo(x - r * 0.65, y - r * 1.45); c.lineTo(x - r * 0.3, y - r * 1.15);
      c.lineTo(x, y - r * 1.55); c.lineTo(x + r * 0.3, y - r * 1.15); c.lineTo(x + r * 0.65, y - r * 1.45); c.lineTo(x + r * 0.6, y - r * 0.95);
      c.closePath(); c.fill(); c.stroke();
      // moedas que ganhou
      moeda(c, x - r * 0.35, y + r * 1.35, r * 0.28);
      G.gfx.label(c, '' + moedas[j], x + r * 0.2, y + r * 1.35, Math.round(r * 0.5), '#ffd23f', 'left', '#7a5200');
    });
    const sai = tempo - fimT > 1 ? 1 : 0.4;
    c.globalAlpha = sai;
    [[F.de_novo, '🔄'], [F.numeros, '🔢']].forEach(function (b) {
      const k = b[0];
      c.fillStyle = '#fff'; c.beginPath(); c.arc(k.x, k.y, k.r, 0, TAU); c.fill();
      c.lineWidth = 5; c.strokeStyle = '#ffcb05'; c.stroke();
      c.save();
      c.font = Math.round(k.r * 1.05) + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(b[1], k.x, k.y + k.r * 0.06);
      c.restore();
    });
    c.globalAlpha = 1;
  }

  S.draw = function (c, t) {
    fundo(c, t);
    if (fase === 'escolha') drawEscolha(c, t);
    else {
      const L = layoutJogo();
      // a moldura do tabuleiro fica da cor de quem está a jogar
      if (fase === 'jogo') {
        c.save(); c.globalAlpha = 0.35; c.lineWidth = 6; c.strokeStyle = COR[vez];
        G.gfx.rr(c, L.board.x - 3, L.board.y - 3, L.board.w + 6, L.board.h + 6, 18); c.stroke();
        c.restore();
      }
      if (fase === 'carregar') {
        bola(c, G.W / 2, G.H / 2, Math.min(G.W, G.H) * 0.1, tempo * 6);
        const k = prontas();
        c.fillStyle = 'rgba(255,255,255,.7)'; G.gfx.rr(c, G.W / 2 - 90, G.H / 2 + Math.min(G.W, G.H) * 0.14, 180, 16, 8); c.fill();
        c.fillStyle = '#ffcb05'; G.gfx.rr(c, G.W / 2 - 90, G.H / 2 + Math.min(G.W, G.H) * 0.14, 180 * k, 16, 8); c.fill();
      } else drawCartas(c, t, L);
      drawPaineis(c, t, L);
      drawVoos(c, L);
      if (fase !== 'fim') botaoVoltar(c, L);
      if (fase === 'fim') drawFim(c, t);
    }
    for (const p of confetes) {
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
      c.fillStyle = p.cor; c.fillRect(-p.w / 2, -p.w * 0.35, p.w, p.w * 0.7);
      c.restore();
    }
  };

  // para testes: estado resumido e onde tocar
  S.debug = function () {
    const r = { fase: fase, nivel: nivel, vez: vez, quem: quem.slice(), moedas: moedas ? moedas.slice() : null, fala: S.ultimaFala };
    if (fase === 'escolha') { const L = layoutEscolha(); r.nums = L.nums; r.filas = L.filas; }
    if (cartas.length) {
      const L = layoutJogo();
      r.cartas = cartas.map(function (k, i) {
        const q = L.cartas[i], im = imagens[k.k];
        return { k: k.k, x: q.x + q.w / 2, y: q.y + q.h / 2, dono: k.dono, aberta: k.alvo === 1, img: im ? (im.ok ? 'ok' : im.falhou ? 'falhou' : '...') : null };
      });
      r.voltar = L.voltar;
    }
    if (fase === 'fim') r.botoes = layoutFim();
    return r;
  };

  G.scenes = G.scenes || {};
  G.scenes.pokemon = S;
})();
