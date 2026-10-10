/* Cena 8 — Damas (jogador vs. computador), com as REGRAS PORTUGUESAS a sério:
     - tabuleiro 8x8, 12 peças de cada lado, nas casas escuras
     - as pedras andam e COMEM só para a frente (regra escolhida pelo Isaac: para trás
       só depois de chegarem ao outro lado e ficarem com coroa)
     - toda a gente anda UMA casa de cada vez, mesmo com coroa (também pedido dele):
       a dama não voa — o que ganha é andar e comer para os quatro lados
     - comer é OBRIGATÓRIO e, havendo escolha, tem de se comer o MAIOR número de peças
     - as peças comidas só saem do tabuleiro no fim do lance e não podem ser comidas
       duas vezes (bloqueiam o caminho enquanto lá estão)
     - promove-se a dama só quando o lance ACABA na última linha

   As peças são caras de avião: vermelhos de cachecol (nós) contra azuis de óculos (o
   computador). Regras de paz: ninguém é o ladrão e quem é comido desce de paraquedas
   para o banco, a acenar — e no fim há confetes para os dois lados. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  // tabuleiro: array de 64 inteiros. 0 vazio, 1 pedra vermelha, 2 dama vermelha,
  // -1 pedra azul, -2 dama azul. Vermelho (nós) sobe (linha 7 -> 0).
  const VAZIO = 0;
  const DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  // o mesmo botão dá a volta aos três níveis do computador e ao modo de dois jogadores
  const NIVEIS = [
    { nome: 'fácil', prof: 1, erro: 0.35 },
    { nome: 'médio', prof: 4, erro: 0.06 },
    { nome: 'difícil', prof: 6, erro: 0 },
    { nome: '2 jogadores', dois: true }
  ];
  function doisJogadores() { return !!NIVEIS[nivel].dois; }

  let tab, vez, sel, legais, anim, banco, confetes, fim, nivel, historico, pensaT, aviso, dica;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function dentro(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
  function idx(r, c) { return r * 8 + c; }
  function cor(v) { return v > 0 ? 1 : (v < 0 ? -1 : 0); }
  function ehDama(v) { return v === 2 || v === -2; }

  /* ---------- regras ---------- */

  // todas as sequências de captura possíveis a partir de uma peça (já maximais)
  function capturasDe(t, r0, c0) {
    const peca = t[idx(r0, c0)];
    if (!peca) return [];
    const meu = cor(peca);
    const res = [];
    const comidas = [];    // [r,c] das peças saltadas neste lance
    const caminho = [];

    function comida(r, c) {
      for (const m of comidas) if (m[0] === r && m[1] === c) return true;
      return false;
    }
    // livre para pousar: vazia, ou a casa de onde partimos (já lá não estamos)
    function livre(r, c) {
      return t[idx(r, c)] === VAZIO || (r === r0 && c === c0);
    }

    // A pedra só come para a FRENTE (pedido do Isaac). Para trás, só depois de chegar ao
    // outro lado e ficar com coroa — aí é dama e anda e come para todo o lado.
    const dirsPedra = meu > 0 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];

    // Toda a gente salta só a casa do lado (pedido do Isaac: "as peças só avançam um
    // passo, mesmo com coroa"). A coroa não voa — o que ela ganha é poder ir para os
    // QUATRO lados, enquanto a pedra só vai para a frente.
    function anda(r, c, dama) {
      let seguiu = false;
      for (const [dr, dc] of (dama ? DIRS : dirsPedra)) {
        const mr = r + dr, mc = c + dc, tr = r + dr * 2, tc = c + dc * 2;
        if (!dentro(tr, tc)) continue;
        const alvo = t[idx(mr, mc)];
        if (!alvo || cor(alvo) === meu || comida(mr, mc)) continue;
        if (!livre(tr, tc)) continue;
        comidas.push([mr, mc]); caminho.push([tr, tc]);
        seguiu = true; anda(tr, tc, dama);
        comidas.pop(); caminho.pop();
      }
      if (!seguiu && comidas.length) {
        res.push({
          de: [r0, c0], para: caminho[caminho.length - 1],
          caminho: caminho.slice(), comidas: comidas.slice()
        });
      }
    }

    anda(r0, c0, ehDama(peca));
    return res;
  }

  function jogadasSimples(t, r, c) {
    const peca = t[idx(r, c)];
    const res = [];
    if (ehDama(peca)) {
      // uma casa de cada vez, mas para qualquer um dos quatro lados
      for (const [dr, dc] of DIRS) {
        const tr = r + dr, tc = c + dc;
        if (dentro(tr, tc) && t[idx(tr, tc)] === VAZIO) {
          res.push({ de: [r, c], para: [tr, tc], caminho: [[tr, tc]], comidas: [] });
        }
      }
    } else {
      const dr = peca > 0 ? -1 : 1;    // vermelho sobe, azul desce
      for (const dc of [-1, 1]) {
        const tr = r + dr, tc = c + dc;
        if (dentro(tr, tc) && t[idx(tr, tc)] === VAZIO) {
          res.push({ de: [r, c], para: [tr, tc], caminho: [[tr, tc]], comidas: [] });
        }
      }
    }
    return res;
  }

  // lei da maioria: se houver capturas, só valem as que comem mais peças
  function jogadas(t, lado) {
    const caps = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (cor(t[idx(r, c)]) === lado) caps.push.apply(caps, capturasDe(t, r, c));
      }
    }
    if (caps.length) {
      let max = 0;
      for (const m of caps) if (m.comidas.length > max) max = m.comidas.length;
      return caps.filter(function (m) { return m.comidas.length === max; });
    }
    const simples = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (cor(t[idx(r, c)]) === lado) simples.push.apply(simples, jogadasSimples(t, r, c));
      }
    }
    return simples;
  }

  function aplica(t, m) {
    const nt = t.slice();
    const peca = nt[idx(m.de[0], m.de[1])];
    nt[idx(m.de[0], m.de[1])] = VAZIO;
    for (const [r, c] of m.comidas) nt[idx(r, c)] = VAZIO;   // só saem no fim do lance
    let nova = peca;
    const fr = m.para[0];
    // promove só se o lance ACABA na última linha
    if (peca === 1 && fr === 0) nova = 2;
    if (peca === -1 && fr === 7) nova = -2;
    nt[idx(fr, m.para[1])] = nova;
    return nt;
  }

  /* ---------- o computador a pensar ---------- */

  function avalia(t) {
    let s = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const v = t[idx(r, c)];
        if (!v) continue;
        const lado = cor(v);
        let p = ehDama(v) ? 210 : 100;   // a dama já não voa, por isso vale menos
        if (!ehDama(v)) p += (lado > 0 ? (7 - r) : r) * 8;      // avançar vale
        if (c === 0 || c === 7) p += 4;                          // encostado à parede não se come
        if (r === (lado > 0 ? 7 : 0)) p += 6;                    // guardar a linha de trás
        s += lado * p;
      }
    }
    return s;   // positivo = bom para o vermelho (nós)
  }

  function minimax(t, lado, prof, alfa, beta, deadline) {
    const ms = jogadas(t, lado);
    if (!ms.length) return lado > 0 ? -100000 : 100000;          // quem não tem jogada perde
    if (prof <= 0 || Date.now() > deadline) return avalia(t);
    if (lado > 0) {
      let melhor = -Infinity;
      for (const m of ms) {
        const v = minimax(aplica(t, m), -1, prof - 1, alfa, beta, deadline);
        if (v > melhor) melhor = v;
        if (melhor > alfa) alfa = melhor;
        if (alfa >= beta) break;
      }
      return melhor;
    }
    let melhor = Infinity;
    for (const m of ms) {
      const v = minimax(aplica(t, m), 1, prof - 1, alfa, beta, deadline);
      if (v < melhor) melhor = v;
      if (melhor < beta) beta = melhor;
      if (alfa >= beta) break;
    }
    return melhor;
  }

  function jogadaDoPc() {
    const ms = jogadas(tab, -1);
    if (!ms.length) return null;
    const N = NIVEIS[nivel];
    if (ms.length === 1) return ms[0];
    if (Math.random() < N.erro) return ms[(Math.random() * ms.length) | 0];   // engana-se de propósito
    const deadline = Date.now() + 260;                                        // nunca trava o jogo
    let melhor = null, melhorV = Infinity;
    for (const m of ms) {
      const v = minimax(aplica(tab, m), 1, N.prof - 1, -Infinity, Infinity, deadline);
      if (v < melhorV || (v === melhorV && Math.random() < 0.35)) { melhorV = v; melhor = m; }
    }
    return melhor || ms[0];
  }

  /* ---------- cena ---------- */

  S.enter = function () {
    tab = new Array(64).fill(VAZIO);
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 0) continue;          // só casas escuras
        if (r < 3) tab[idx(r, c)] = -1;
        if (r > 4) tab[idx(r, c)] = 1;
      }
    }
    vez = 1; sel = null; anim = null; banco = { v: [], a: [] }; confetes = [];
    fim = null; historico = []; pensaT = 0; aviso = 0; dica = 4;
    if (nivel == null) nivel = 0;
    legais = jogadas(tab, 1);
    G.banner('Toca numa peça e depois na casa! 🔴', 3200);
  };

  function tamanho() {
    const W = G.W, H = G.H;
    // W - 96 deixa sempre margem para os bancos dos dois lados (em telemóvel ao alto
    // o tabuleiro a toda a largura escondia quem tinha sido comido)
    const lado = Math.min(W - 96, W * 0.92, H * 0.74);
    return { cel: lado / 8, x0: (W - lado) / 2, y0: H * 0.15, lado: lado };
  }
  function casaEm(px, py) {
    const g = tamanho();
    const c = Math.floor((px - g.x0) / g.cel), r = Math.floor((py - g.y0) / g.cel);
    return dentro(r, c) ? [r, c] : null;
  }

  function confete(x, y, n) {
    for (let i = 0; i < n; i++) {
      confetes.push({
        x: x, y: y, vx: rnd(-220, 220), vy: rnd(-320, -60), rot: rnd(0, TAU),
        vr: rnd(-8, 8), t: 0, life: rnd(0.9, 1.8),
        col: G.gfx.FRIEND_COLORS[(Math.random() * 5) | 0]
      });
    }
  }

  function fazJogada(m) {
    historico.push({ tab: tab.slice(), banco: { v: banco.v.slice(), a: banco.a.slice() }, vez: vez });
    const g = tamanho();
    // quem é comido desce de paraquedas para o banco, a acenar
    for (const [r, c] of m.comidas) {
      const v = tab[idx(r, c)];
      const lista = v > 0 ? banco.v : banco.a;
      lista.push({ dama: ehDama(v), t: 0 });
      confete(g.x0 + (c + 0.5) * g.cel, g.y0 + (r + 0.5) * g.cel, 10);
    }
    const antes = tab[idx(m.de[0], m.de[1])];
    tab = aplica(tab, m);
    const depois = tab[idx(m.para[0], m.para[1])];
    anim = { m: m, t: 0, passo: 0 };
    if (m.comidas.length) { G.audio.sfx('pop'); G.shake = 0.2; }
    else G.audio.sfx('hop');
    if (!ehDama(antes) && ehDama(depois)) {
      G.audio.sfx('tada');
      G.banner(cor(depois) > 0 ? 'DAMA! 👑 Agora voa!' : 'O computador fez dama 👑', 2400);
      confete(g.x0 + (m.para[1] + 0.5) * g.cel, g.y0 + (m.para[0] + 0.5) * g.cel, 18);
    }
    // a dois jogadores as estrelas são de quem come, seja de que cor for
    if (m.comidas.length && (cor(antes) > 0 || doisJogadores())) G.addStars(m.comidas.length);
    vez = -vez;
    legais = jogadas(tab, vez);
    if (!legais.length) acabou(vez > 0 ? -1 : 1);
    else if (vez < 0 && !doisJogadores()) pensaT = 0.55;
  }

  function acabou(vencedor) {
    fim = { vencedor: vencedor, t: 0 };
    const g = tamanho();
    confete(g.x0 + g.lado / 2, g.y0 + g.lado * 0.4, 90);
    G.audio.sfx('tada'); G.audio.sfx('whee');
    if (vencedor > 0) { G.addStars(10); G.banner('GANHASTE! 🎉👑', 3200); }
    else G.banner('O computador ganhou desta vez. Outra? 🙂', 3200);
  }

  function voltarAtras() {
    if (!historico.length) return;
    // Corta o que estiver a acontecer (peça a saltar, computador a pensar) — se o botão
    // esperasse pelo fim da animação, parecia que não fazia nada.
    anim = null; pensaT = 0; sel = null; fim = null;
    // contra o computador desfaz o nosso lance E a resposta dele; a dois jogadores
    // desfaz só o último lance (senão tirava a jogada ao outro jogador)
    let e = historico.pop();
    if (!doisJogadores()) while (historico.length && e.vez !== 1) e = historico.pop();
    tab = e.tab; banco = e.banco; vez = e.vez;
    legais = jogadas(tab, vez);
    if (vez < 0 && !doisJogadores()) pensaT = 0.55;
    G.audio.sfx('boing');
  }

  S.update = function (dt, t) {
    const inp = G.input;
    aviso = Math.max(0, aviso - dt);
    dica = Math.max(0, dica - dt);

    for (let i = confetes.length - 1; i >= 0; i--) {
      const p = confetes[i];
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 620 * dt; p.rot += p.vr * dt;
      if (p.t > p.life) confetes.splice(i, 1);
    }
    for (const l of [banco.v, banco.a]) for (const b of l) b.t += dt;

    if (anim) {
      anim.t += dt;
      // com comidas em cadeia cada salto demora mais, para se ver bem o percurso
      const total = 0.16 + anim.m.caminho.length * 0.22;
      if (anim.t >= total) anim = null;
    }

    if (fim) { fim.t += dt; if (inp.tap && fim.t > 1.2) S.enter(); return; }

    if (vez < 0 && !anim && !doisJogadores()) {   // vez do computador
      pensaT -= dt;
      if (pensaT <= 0) {
        const m = jogadaDoPc();
        if (m) fazJogada(m); else acabou(1);
      }
      return;
    }

    if (!inp.tap) return;
    const g = tamanho();
    // botões desenhados no ecrã (funcionam mesmo a meio de uma animação)
    if (inp.tap.y > g.y0 + g.lado + 8) {
      if (Math.abs(inp.tap.x - (G.W / 2 - 92)) < 74) { voltarAtras(); return; }
      if (Math.abs(inp.tap.x - (G.W / 2 + 92)) < 74) {
        nivel = (nivel + 1) % NIVEIS.length;
        G.audio.sfx('pop');
        G.banner(doisJogadores() ? 'Dois jogadores! 🔴 vs 🔵' : 'Computador ' + NIVEIS[nivel].nome + ' 🎯', 2000);
        if (!doisJogadores() && vez < 0 && !fim) pensaT = 0.55;
        return;
      }
    }
    if (anim) return;                 // no tabuleiro espera-se que a peça acabe de andar
    const casa = casaEm(inp.tap.x, inp.tap.y);
    if (!casa) return;
    const [r, c] = casa;

    if (sel) {                                  // já temos peça escolhida: tentar mover
      const m = legais.find(function (j) {
        return j.de[0] === sel[0] && j.de[1] === sel[1] && j.para[0] === r && j.para[1] === c;
      });
      if (m) { sel = null; fazJogada(m); return; }
    }
    if (cor(tab[idx(r, c)]) === vez) {
      const podeEsta = legais.some(function (j) { return j.de[0] === r && j.de[1] === c; });
      if (podeEsta) { sel = [r, c]; G.audio.sfx('pop'); }
      else {
        sel = null; aviso = 1.4; G.audio.sfx('boing');
        // se há capturas, é obrigatório comer — mostra quais as peças que têm de o fazer
        G.banner(legais[0] && legais[0].comidas.length
          ? 'Tens de comer! As que brilham 😋' : 'Essa peça não pode ir 🙂', 2000);
      }
    } else sel = null;
  };

  /* ---------- desenho ---------- */

  function caraAviao(c, t, o) {   // "cara de avião", centrada na origem, raio ~1
    const vermelho = o.lado > 0;
    const base = vermelho ? '#ff595e' : '#1982c4';
    const claro = vermelho ? '#ffa5a8' : '#8ecae6';
    c.save();
    c.scale(o.r, o.r);
    // asinhas
    c.fillStyle = claro;
    G.gfx.rr(c, -1.35, -0.12, 0.55, 0.3, 0.14); c.fill();
    G.gfx.rr(c, 0.8, -0.12, 0.55, 0.3, 0.14); c.fill();
    // hélice a rodar devagarinho
    c.strokeStyle = '#4a4e69'; c.lineWidth = 0.08; c.lineCap = 'round';
    const a = t * (o.dama ? 5 : 2) + (o.fase || 0);
    c.beginPath();
    c.moveTo(Math.cos(a) * 0.75, -0.95 + Math.sin(a) * 0.18);
    c.lineTo(-Math.cos(a) * 0.75, -0.95 - Math.sin(a) * 0.18);
    c.stroke();
    c.fillStyle = '#4a4e69'; c.beginPath(); c.arc(0, -0.95, 0.1, 0, TAU); c.fill();
    // corpo
    c.beginPath(); c.arc(0, 0, 0.86, 0, TAU); c.fillStyle = base; c.fill();
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 0.1; c.stroke();
    c.beginPath(); c.arc(0, 0.16, 0.62, 0, TAU); c.fillStyle = claro; c.fill();
    // olhos
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(-0.26, -0.16, 0.24, 0, TAU); c.arc(0.26, -0.16, 0.24, 0, TAU); c.fill();
    c.fillStyle = '#2b2d42';
    const olh = Math.sin(t * 0.8 + (o.fase || 0)) * 0.05;
    c.beginPath(); c.arc(-0.26 + olh, -0.14, 0.11, 0, TAU); c.arc(0.26 + olh, -0.14, 0.11, 0, TAU); c.fill();
    // sorriso e bochechas
    c.strokeStyle = '#2b2d42'; c.lineWidth = 0.07; c.lineCap = 'round';
    c.beginPath(); c.arc(0, 0.18, 0.26, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    c.fillStyle = 'rgba(255,120,120,.45)';
    c.beginPath(); c.arc(-0.5, 0.16, 0.12, 0, TAU); c.arc(0.5, 0.16, 0.12, 0, TAU); c.fill();
    if (vermelho) {                       // cachecol
      c.fillStyle = '#ffd166';
      G.gfx.rr(c, -0.62, 0.5, 1.24, 0.22, 0.11); c.fill();
      c.beginPath(); c.moveTo(0.4, 0.62); c.lineTo(0.86, 0.86); c.lineTo(0.5, 0.9); c.closePath(); c.fill();
    } else {                              // óculos de aviador
      c.strokeStyle = '#22223b'; c.lineWidth = 0.09;
      c.beginPath(); c.arc(-0.26, -0.16, 0.3, 0, TAU); c.arc(0.26, -0.16, 0.3, 0, TAU); c.stroke();
      c.beginPath(); c.moveTo(-0.56, -0.2); c.lineTo(-0.84, -0.28);
      c.moveTo(0.56, -0.2); c.lineTo(0.84, -0.28); c.stroke();
    }
    if (o.dama) {                         // coroa de dama
      c.fillStyle = '#ffd166';
      c.beginPath();
      c.moveTo(-0.55, -0.62); c.lineTo(-0.3, -1.0); c.lineTo(0, -0.68);
      c.lineTo(0.3, -1.0); c.lineTo(0.55, -0.62);
      c.closePath(); c.fill();
      c.strokeStyle = '#e0a800'; c.lineWidth = 0.05; c.stroke();
    }
    c.restore();
  }

  /* ---------- ícones (o Isaac ainda não lê: tudo tem de dar para perceber sem letras) ---------- */

  // seta gorda a apontar para baixo, a saltitar: "é a tua vez, joga aqui"
  function setaBaixo(c, x, y, s, corr) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = corr;
    c.beginPath();
    c.moveTo(-0.42, -0.5); c.lineTo(0.42, -0.5); c.lineTo(0.42, 0.05);
    c.lineTo(0.8, 0.05); c.lineTo(0, 0.75); c.lineTo(-0.8, 0.05); c.lineTo(-0.42, 0.05);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 0.09; c.lineJoin = 'round'; c.stroke();
    c.restore();
  }

  // três pontinhos a saltar: "o computador está a pensar"
  function pontinhos(c, x, y, s, t) {
    for (let k = 0; k < 3; k++) {
      const dy = Math.sin(t * 6 - k * 0.7) * s * 0.32;
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(x + (k - 1) * s * 0.9, y + dy, s * 0.26, 0, TAU); c.fill();
    }
  }

  // seta de voltar atrás (meia-volta), desenhada e não escrita
  function setaVoltar(c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.strokeStyle = '#fff'; c.lineWidth = 0.26; c.lineCap = 'round';
    c.beginPath(); c.arc(0, 0.05, 0.62, Math.PI * 0.15, Math.PI * 1.5); c.stroke();
    c.fillStyle = '#fff';
    c.beginPath();
    c.moveTo(-0.62, -0.42); c.lineTo(-0.16, -0.3); c.lineTo(-0.5, 0.06);
    c.closePath(); c.fill();
    c.restore();
  }

  /* Percurso proposto de uma comida em cadeia: linha aos tracinhos com o salto 1, 2, 3…
     numerado. É o "vais por aqui" antes de tocar, e fica desenhado enquanto a peça anda. */
  function desenhaCaminho(c, m, g, t, forte) {
    const pts = [m.de].concat(m.caminho);
    c.save();
    c.strokeStyle = forte ? 'rgba(255,183,3,.95)' : 'rgba(255,183,3,.5)';
    c.lineWidth = forte ? 7 : 4; c.lineCap = 'round'; c.lineJoin = 'round';
    c.setLineDash([9, 9]); c.lineDashOffset = -t * 26;
    c.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const x = g.x0 + (pts[i][1] + 0.5) * g.cel, y = g.y0 + (pts[i][0] + 0.5) * g.cel;
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();
    c.setLineDash([]);
    for (let i = 1; i < pts.length; i++) {
      const x = g.x0 + (pts[i][1] + 0.5) * g.cel, y = g.y0 + (pts[i][0] + 0.5) * g.cel;
      c.fillStyle = i === pts.length - 1 ? '#ffd166' : '#fff3bf';
      c.beginPath(); c.arc(x, y, g.cel * 0.2, 0, TAU); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke();
      G.gfx.label(c, '' + i, x, y + 1, g.cel * 0.26, '#8a5a00', 'center', 'none');
    }
    c.restore();
  }

  S.draw = function (c, t) {
    const W = G.W, H = G.H, g = tamanho();

    const sky = c.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#5bb8ff'); sky.addColorStop(0.6, '#bfe7ff'); sky.addColorStop(1, '#ffe3c2');
    c.fillStyle = sky; c.fillRect(0, 0, W, H);
    G.gfx.sun(c, W * 0.88, H * 0.08, Math.min(W, H) * 0.05, t);

    // tabuleiro
    G.gfx.rr(c, g.x0 - 10, g.y0 - 10, g.lado + 20, g.lado + 20, 16);
    c.fillStyle = '#7f5539'; c.fill();
    for (let r = 0; r < 8; r++) {
      for (let cc = 0; cc < 8; cc++) {
        c.fillStyle = (r + cc) % 2 === 0 ? '#ffe8d6' : '#a5714b';
        c.fillRect(g.x0 + cc * g.cel, g.y0 + r * g.cel, g.cel, g.cel);
      }
    }

    // casas para onde a peça escolhida pode ir
    if (sel) {
      const minhas = legais.filter(function (j) { return j.de[0] === sel[0] && j.de[1] === sel[1]; });
      for (const m of minhas) {
        if (m.comidas.length > 1) desenhaCaminho(c, m, g, t, minhas.length === 1);
        const x = g.x0 + (m.para[1] + 0.5) * g.cel, y = g.y0 + (m.para[0] + 0.5) * g.cel;
        if (m.comidas.length <= 1) {
          c.fillStyle = m.comidas.length ? 'rgba(255,209,102,.85)' : 'rgba(120,220,140,.8)';
          c.beginPath(); c.arc(x, y, g.cel * (0.2 + Math.sin(t * 5) * 0.02), 0, TAU); c.fill();
          c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke();
        }
        for (const [rr, ccx] of m.comidas) {     // marca quem vai ser apanhado
          c.strokeStyle = 'rgba(255,120,120,.9)'; c.lineWidth = 4;
          c.beginPath();
          c.arc(g.x0 + (ccx + 0.5) * g.cel, g.y0 + (rr + 0.5) * g.cel, g.cel * 0.42, 0, TAU);
          c.stroke();
        }
      }
      c.strokeStyle = '#ffd166'; c.lineWidth = 5;
      c.strokeRect(g.x0 + sel[1] * g.cel + 3, g.y0 + sel[0] * g.cel + 3, g.cel - 6, g.cel - 6);
    }

    // peças (a que está a andar vai por cima, na posição da animação)
    const aAndar = anim ? idx(anim.m.para[0], anim.m.para[1]) : -1;
    for (let r = 0; r < 8; r++) {
      for (let cc = 0; cc < 8; cc++) {
        const v = tab[idx(r, cc)];
        if (!v || idx(r, cc) === aAndar) continue;
        const x = g.x0 + (cc + 0.5) * g.cel, y = g.y0 + (r + 0.5) * g.cel;
        // se comer é obrigatório, as peças que podem comer piscam
        const temDeComer = vez > 0 && v > 0 && legais.length && legais[0].comidas.length &&
          legais.some(function (j) { return j.de[0] === r && j.de[1] === cc; });
        if (temDeComer && (aviso > 0 || dica > 0 || Math.sin(t * 4) > 0.4)) {
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5;
          const rg = c.createRadialGradient(x, y, 2, x, y, g.cel * 0.6);
          rg.addColorStop(0, '#ffd166'); rg.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = rg; c.beginPath(); c.arc(x, y, g.cel * 0.6, 0, TAU); c.fill();
          c.restore();
        }
        c.save(); c.translate(x, y);
        caraAviao(c, t, { lado: cor(v), dama: ehDama(v), r: g.cel * 0.36, fase: r * 1.7 + cc });
        c.restore();
      }
    }
    if (anim) {                                  // a peça a saltar de casa em casa
      const m = anim.m;
      if (m.comidas.length > 1) desenhaCaminho(c, m, g, t, true);   // o percurso fica à vista
      const passos = [m.de].concat(m.caminho);
      const total = 0.16 + m.caminho.length * 0.22;
      const k = Math.min(0.999, anim.t / total) * (passos.length - 1);
      const i = Math.floor(k), f = k - i;
      const p0 = passos[i], p1 = passos[Math.min(passos.length - 1, i + 1)];
      const x = g.x0 + (p0[1] + (p1[1] - p0[1]) * f + 0.5) * g.cel;
      const y = g.y0 + (p0[0] + (p1[0] - p0[0]) * f + 0.5) * g.cel - Math.sin(f * Math.PI) * g.cel * 0.45;
      const v = tab[idx(m.para[0], m.para[1])];
      c.save(); c.translate(x, y);
      caraAviao(c, t, { lado: cor(v), dama: ehDama(v), r: g.cel * 0.4, fase: 0 });
      c.restore();
    }

    // bancos: quem foi comido desce de paraquedas e fica a acenar
    for (const lado of [1, -1]) {
      const lista = lado > 0 ? banco.v : banco.a;
      for (let i = 0; i < lista.length; i++) {
        const b = lista[i];
        const rb = Math.min(13, g.cel * 0.28);
        const bx = lado > 0 ? g.x0 - rb * 2.6 : g.x0 + g.lado + rb * 2.6;
        const by = g.y0 + 26 + (i % 6) * (rb * 2.6) + Math.floor(i / 6) * 6;
        const cair = Math.min(1, b.t / 0.9);
        c.save();
        c.translate(bx, by - (1 - cair) * 120);
        c.globalAlpha = 0.55 + cair * 0.45;
        if (cair < 1) { c.save(); c.scale(0.5, 0.5); G.gfx.parachute(c, b.t, {}); c.restore(); }
        caraAviao(c, t, { lado: lado, dama: b.dama, r: rb, fase: i });
        c.restore();
      }
    }

    for (const p of confetes) {
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
      c.globalAlpha = Math.max(0, 1 - p.t / p.life);
      c.fillStyle = p.col; c.fillRect(-5, -3, 10, 6);
      c.restore();
    }

    // de quem é a vez: cara + seta a saltar (humano) ou pontinhos a pensar (computador)
    const humano = !fim && (vez > 0 || doisJogadores());
    G.gfx.rr(c, W / 2 - 132, g.y0 - 68, 264, 50, 25);
    c.fillStyle = vez > 0 ? '#e63946' : '#1c6fa8'; c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 4; c.stroke();
    c.save(); c.translate(W / 2 - 96, g.y0 - 43);
    caraAviao(c, t, { lado: vez, dama: false, r: 19, fase: 0 });
    c.restore();
    if (humano) {
      setaBaixo(c, W / 2 - 12, g.y0 - 43 + Math.sin(t * 4) * 4, 26, '#ffd166');
      G.gfx.label(c, 'joga tu', W / 2 + 52, g.y0 - 42, 22, '#fff', 'center', 'rgba(0,0,0,.45)');
    } else {
      pontinhos(c, W / 2 - 10, g.y0 - 43, 16, t);
      G.gfx.label(c, 'a pensar', W / 2 + 56, g.y0 - 42, 20, '#fff', 'center', 'rgba(0,0,0,.45)');
    }

    // botões: o desenho manda, a palavra é só para os crescidos
    const by2 = g.y0 + g.lado + 44;
    G.gfx.rr(c, W / 2 - 166, by2 - 30, 148, 60, 26);
    c.fillStyle = '#6aa806'; c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 4; c.stroke();
    setaVoltar(c, W / 2 - 122, by2 - 2, 22);
    G.gfx.label(c, 'voltar', W / 2 - 68, by2 - 1, 21, '#fff', 'center', 'rgba(0,0,0,.45)');

    G.gfx.rr(c, W / 2 + 18, by2 - 30, 148, 60, 26);
    c.fillStyle = '#4b4dbe'; c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 4; c.stroke();
    // quantas caras azuis = quão forte está o computador (1, 2 ou 3);
    // uma vermelha + uma azul = dois jogadores
    if (doisJogadores()) {
      c.save(); c.translate(W / 2 + 76, by2 - 8); caraAviao(c, t, { lado: 1, dama: false, r: 14, fase: 0 }); c.restore();
      c.save(); c.translate(W / 2 + 108, by2 - 8); caraAviao(c, t, { lado: -1, dama: false, r: 14, fase: 2 }); c.restore();
    } else {
      for (let k = 0; k <= nivel; k++) {
        c.save(); c.translate(W / 2 + 66 + (k - nivel / 2) * 27, by2 - 8);
        caraAviao(c, t, { lado: -1, dama: false, r: 13, fase: k * 2 });
        c.restore();
      }
    }
    G.gfx.label(c, NIVEIS[nivel].nome, W / 2 + 92, by2 + 20, 17, '#fff', 'center', 'rgba(0,0,0,.45)');

    // as estrelas ficam na linha dos botões, à esquerda: em cima chocavam com a faixa da vez
    G.gfx.star(c, 36, by2, 18, '#ffd166', 0);
    G.gfx.label(c, '' + G.state.stars, 64, by2 + 1, 30, '#b56b00');

    if (fim) {
      c.fillStyle = 'rgba(255,255,255,' + Math.min(0.6, fim.t * 0.5) + ')';
      c.fillRect(0, 0, W, H);
      // quem ganhou aparece GRANDE com coroa; o outro fica ao lado, a sorrir na mesma
      const R = Math.min(W, H) * 0.13;
      c.save(); c.translate(W / 2 - R * 0.9, H * 0.4);
      caraAviao(c, t, { lado: fim.vencedor, dama: true, r: R, fase: 0 });
      c.restore();
      c.save(); c.translate(W / 2 + R * 1.15, H * 0.44);
      caraAviao(c, t, { lado: -fim.vencedor, dama: false, r: R * 0.6, fase: 3 });
      c.restore();
      for (let k = 0; k < 5; k++) {          // estrelinhas à volta do vencedor
        const a = t * 1.5 + (k / 5) * TAU;
        G.gfx.star(c, W / 2 - R * 0.9 + Math.cos(a) * R * 1.5, H * 0.4 + Math.sin(a) * R * 1.5,
          R * 0.2, '#ffd166', a);
      }
      if (fim.t > 1.2) {                      // "toca para jogar outra vez" = seta em círculo
        const y2 = H * 0.63 + Math.sin(t * 3) * 5;
        c.save(); c.translate(W / 2, y2); c.rotate(Math.sin(t * 2) * 0.15);
        c.strokeStyle = '#8ac926'; c.lineWidth = 9; c.lineCap = 'round';
        c.beginPath(); c.arc(0, 0, 26, Math.PI * 0.2, Math.PI * 1.7); c.stroke();
        c.fillStyle = '#8ac926';
        c.beginPath(); c.moveTo(24, -20); c.lineTo(34, 4); c.lineTo(10, 2); c.closePath(); c.fill();
        c.restore();
        G.gfx.label(c, 'toca para jogar outra vez', W / 2, y2 + 52, 22, '#4a4e69', 'center');
      }
    }
  };

  S.debug = function () {
    let v = 0, a = 0, dv = 0, da = 0;
    for (const x of tab) {
      if (x === 1) v++; else if (x === 2) { v++; dv++; }
      else if (x === -1) a++; else if (x === -2) { a++; da++; }
    }
    return {
      vez: vez, pecas: { v: v, a: a, damasV: dv, damasA: da },
      legais: legais.length, comeObrigado: legais.length ? legais[0].comidas.length : 0,
      sel: sel, fim: fim ? fim.vencedor : null, nivel: NIVEIS[nivel].nome,
      dois: doisJogadores(), anim: !!anim
    };
  };
  S.api = { jogadas: jogadas, aplica: aplica, tabuleiro: function () { return tab.slice(); } };

  G.scenes = G.scenes || {};
  G.scenes.damas = S;
})();
