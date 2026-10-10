/* Cena — MARVEL em Lego, ditado pelo Isaac (2026-09-19):
     "fazer todos os mauzões de Lego ficarem na prisão; as polícias levam-nos para a
      prisão, ou eles mesmos. Também está o Homem de Ferro, estão todos."

   Cidade de Lego com a PRISÃO no meio. Seis vilões andam à solta (Loki, Thanos, Venom,
   Duende Verde, Ultron e Caveira Vermelha). Os heróis (Homem de Ferro, Homem-Aranha,
   Capitão América, Thor e Hulk — troca-se no 🦸 ou a tocar nas caras lá em cima) dão-lhes
   com os poderes; quando a energia de um vilão acaba ele fica ALGEMADO, e então:
     - vem um CARRO DA POLÍCIA buscá-lo e leva-o para a prisão, OU
     - o herói pega nele (basta encostar) e leva-o ele mesmo até à porta da prisão.
   Com os seis presos há festa e começa outra ronda (fugiram pelo túnel!).

   Regras de paz do projeto: ninguém morre. Quando um tiro dos vilões nos acerta, o
   boneco DESMONTA-SE em peças de Lego e volta a montar-se sozinho (e larga uns pinos,
   que se podem apanhar outra vez). O Isaac é sempre o bom. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  const MUNDO = 6400, PRISAO_X = 3200;
  // pedidos do Isaac (2026-09-20): a Torre dos Vingadores dá para SUBIR, há um
  // RESTAURANTE onde se come, BALÕES para rebentar e CARROS na estrada
  const TORRE_X = 1150, TORRE_W = 300, TORRE_H = 900;
  const REST_X = 4500, REST_W = 430, REST_H = 200;
  const MAX_VIDAS = 5;                 // 5 corações; cada tiro tira MEIO coração
  const TETO = -(TORRE_H + 340);       // até onde o Homem de Ferro pode voar
  const GRAV = 1900;
  const FIG = 1.25;          // escala dos bonecos no mundo (boneco ≈ 90 px de altura)

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function sfx(n) { if (G.audio) G.audio.sfx(n); }
  function fala(txt, fila) { if (G.audio && G.audio.fala) G.audio.fala(txt, fila, 1.05); }
  function sombra(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (k > 0) { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
    else { r *= 1 + k; g *= 1 + k; b *= 1 + k; }
    return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
  }
  const rr = function (c, x, y, w, h, r) { G.gfx.rr(c, x, y, w, h, r); };
  const AMARELO_LEGO = '#ffd23f';

  /* =====================================================================
     BONECOS LEGO — desenhados na origem, com os pés em (0,0), virados para +x.
     Unidades do boneco: ~72 de altura. Cada peça pode ser deslocada (desmontar).
     ===================================================================== */

  function rosto(c, tipo, t) {
    c.fillStyle = '#22223b'; c.strokeStyle = '#22223b'; c.lineCap = 'round';
    if (tipo === 'tonto') {
      c.lineWidth = 0.9;
      for (const ex of [-2.2, 4.2]) {
        c.beginPath();
        for (let a = 0; a < 9; a += 0.4) c.lineTo(ex + Math.cos(a + t * 8) * a * 0.24, -61 + Math.sin(a + t * 8) * a * 0.24);
        c.stroke();
      }
      c.beginPath(); c.arc(1, -55.5, 1.6, 0, TAU); c.stroke();
      return;
    }
    c.beginPath(); c.ellipse(-2.2, -61, 1.25, 1.8, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(4.2, -61, 1.25, 1.8, 0, 0, TAU); c.fill();
    c.lineWidth = 1.1;
    if (tipo === 'mau') {
      c.beginPath(); c.moveTo(-4.3, -64.6); c.lineTo(-0.6, -63.3); c.stroke();
      c.beginPath(); c.moveTo(6.3, -64.6); c.lineTo(2.6, -63.3); c.stroke();
      c.beginPath(); c.moveTo(-2.5, -56); c.quadraticCurveTo(1, -58.4, 4.8, -55.4); c.stroke();
    } else if (tipo === 'bravo') {
      c.beginPath(); c.moveTo(-4.3, -64.8); c.lineTo(-0.4, -63); c.stroke();
      c.beginPath(); c.moveTo(6.3, -64.8); c.lineTo(2.4, -63); c.stroke();
      c.fillStyle = '#fff';
      rr(c, -2.8, -57.6, 7.6, 3, 1.2); c.fill(); c.stroke();
    } else {
      c.beginPath(); c.arc(1, -57.6, 3.2, 0.15, Math.PI - 0.15); c.stroke();
    }
  }

  // detalhes de cada personagem (cabeça, peito, coisas na mão)
  const DETALHE = {
    ferro: {
      cabeca: function (c) {
        c.fillStyle = '#b5121b'; rr(c, -8, -68, 16, 17, 5); c.fill();
        c.fillStyle = '#e8b923'; rr(c, -6, -65, 12, 12.5, 3); c.fill();
        c.fillStyle = '#8ff7ff';
        c.fillRect(-4.6, -61.4, 3.8, 1.7); c.fillRect(1.6, -61.4, 3.8, 1.7);
        c.strokeStyle = '#9c7a12'; c.lineWidth = 0.7;
        c.beginPath(); c.moveTo(-2.5, -55.3); c.lineTo(3.5, -55.3); c.stroke();
      },
      peito: function (c, o) {
        c.fillStyle = '#e8b923';
        c.beginPath(); c.moveTo(-6, -48); c.lineTo(6, -48); c.lineTo(3, -34); c.lineTo(-3, -34); c.closePath(); c.fill();
        c.fillStyle = 'rgba(143,247,255,' + (0.35 + 0.25 * Math.sin(o.t * 6)) + ')';
        c.beginPath(); c.arc(0, -42, 5.5, 0, TAU); c.fill();
        c.fillStyle = '#e8fdff'; c.beginPath(); c.arc(0, -42, 2.8, 0, TAU); c.fill();
      }
    },
    aranha: {
      cabeca: function (c) {
        c.fillStyle = '#d62828'; rr(c, -8, -68, 16, 17, 5); c.fill();
        c.strokeStyle = 'rgba(40,0,0,.55)'; c.lineWidth = 0.45;
        c.beginPath(); c.moveTo(1, -68); c.lineTo(1, -51); c.stroke();
        for (const yy of [-65, -61, -57]) {
          c.beginPath(); c.moveTo(-8, yy + 1); c.quadraticCurveTo(1, yy - 1.5, 8, yy + 1); c.stroke();
        }
        for (const ex of [-2.6, 4.4]) {
          c.save(); c.translate(ex, -61); c.rotate(ex < 0 ? 0.45 : -0.45);
          c.fillStyle = '#fff'; c.strokeStyle = '#111'; c.lineWidth = 0.9;
          c.beginPath(); c.ellipse(0, 0, 3, 2.1, 0, 0, TAU); c.fill(); c.stroke();
          c.restore();
        }
      },
      peito: function (c) {
        c.fillStyle = '#1d4e89';
        c.fillRect(-12, -30, 24, 3);
        c.strokeStyle = '#111'; c.lineWidth = 0.8; c.fillStyle = '#111';
        c.beginPath(); c.ellipse(0, -42, 1.6, 2.6, 0, 0, TAU); c.fill();
        for (const k of [-1, 1]) for (let i = 0; i < 4; i++) {
          c.beginPath(); c.moveTo(0, -42.5 + i * 1.2);
          c.lineTo(k * 4.4, -45.5 + i * 2.4); c.stroke();
        }
      }
    },
    capitao: {
      cabeca: function (c) {
        c.fillStyle = '#1d4e89';
        c.beginPath();
        c.moveTo(-8.4, -62.6); c.lineTo(-8.4, -64); c.quadraticCurveTo(-8.4, -69, 0, -69.2);
        c.quadraticCurveTo(8.4, -69, 8.4, -64); c.lineTo(8.4, -62.6); c.closePath(); c.fill();
        c.fillRect(-8.4, -63, 3.2, 10);              // abas do capacete
        c.fillRect(5.2, -63, 3.2, 10);
        c.fillStyle = '#fff';
        c.font = 'bold 6px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('A', 1, -65.4);
        c.beginPath(); c.moveTo(-8.4, -64); c.lineTo(-11.4, -67); c.lineTo(-8.4, -62.5); c.fill();
        c.beginPath(); c.moveTo(8.4, -64); c.lineTo(11.4, -67); c.lineTo(8.4, -62.5); c.fill();
      },
      peito: function (c) {
        c.fillStyle = '#fff'; G.gfx.star(c, 0, -41, 5, '#ffffff', 0);
        c.fillStyle = '#c1121f'; c.fillRect(-11.6, -32, 23.2, 1.7); c.fillRect(-11.8, -28.6, 23.6, 1.6);
        c.fillStyle = '#fff'; c.fillRect(-11.7, -30.3, 23.4, 1.7);
      },
      mao: function (c, o) {
        if (o.semEscudo) return;
        escudo(c, 0, 20, 10.5, 0);
      }
    },
    thor: {
      atras: function (c) {
        c.fillStyle = '#c98a1b'; rr(c, -10, -69, 20, 22, 6); c.fill();
      },
      cabeca: function (c) {
        c.fillStyle = '#c98a1b';
        c.beginPath(); c.moveTo(-9, -60); c.quadraticCurveTo(-9, -70.5, 0.5, -70.5);
        c.quadraticCurveTo(10, -70.5, 9.4, -62); c.quadraticCurveTo(4, -66, -2, -65); c.quadraticCurveTo(-6, -64, -9, -60); c.fill();
        c.strokeStyle = '#a86d0f'; c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(-2.5, -53.4); c.quadraticCurveTo(1, -51.8, 4.6, -53.4); c.stroke();
      },
      peito: function (c) {
        c.fillStyle = '#c9ced6';
        for (const [x, y] of [[-4.5, -45], [4.5, -45], [-4.5, -38], [4.5, -38]]) { c.beginPath(); c.arc(x, y, 2.4, 0, TAU); c.fill(); }
        c.fillStyle = '#6b4423'; c.fillRect(-11.6, -30, 23.2, 2.5);
      },
      mao: function (c) {
        c.fillStyle = '#7a5230'; c.fillRect(-1.3, 16, 2.6, 14);
        c.fillStyle = '#9aa3b0'; rr(c, -7, 27, 14, 9, 2); c.fill();
        c.fillStyle = '#c9ced6'; c.fillRect(-6, 28, 12, 2.2);
      }
    },
    hulk: {
      cabeca: function (c) {
        c.fillStyle = '#1b1b1b';
        c.beginPath();
        c.moveTo(-8.6, -63); c.lineTo(-8.8, -69); c.lineTo(-5, -71.5); c.lineTo(-2, -69.5); c.lineTo(1, -72);
        c.lineTo(4, -69.5); c.lineTo(7, -71.5); c.lineTo(8.8, -68); c.lineTo(8.6, -63); c.lineTo(4, -66); c.lineTo(-4, -66); c.closePath(); c.fill();
      },
      peito: function (c) {
        c.strokeStyle = 'rgba(20,60,10,.45)'; c.lineWidth = 0.9;
        c.beginPath(); c.moveTo(0, -48); c.lineTo(0, -32); c.stroke();
        c.beginPath(); c.arc(-4.2, -44, 4, 0.2, Math.PI - 0.2); c.stroke();
        c.beginPath(); c.arc(4.2, -44, 4, 0.2, Math.PI - 0.2); c.stroke();
        for (const y of [-37, -33.5]) { c.beginPath(); c.moveTo(-4, y); c.lineTo(4, y); c.stroke(); }
      }
    },
    loki: {
      atras: function (c) { c.fillStyle = '#111'; rr(c, -9.5, -66, 19, 16, 4); c.fill(); },
      cabeca: function (c) {
        c.strokeStyle = '#e0a526'; c.lineWidth = 2.6; c.lineCap = 'round';
        c.beginPath(); c.moveTo(-4.5, -67); c.quadraticCurveTo(-8, -76, -14, -86); c.stroke();
        c.beginPath(); c.moveTo(6.5, -67); c.quadraticCurveTo(10, -76, 16, -86); c.stroke();
        c.fillStyle = '#e0a526';
        c.beginPath(); c.moveTo(-8.6, -63.6); c.quadraticCurveTo(1, -73, 10.6, -63.6); c.lineTo(8.6, -62.4); c.lineTo(-6.6, -62.4); c.closePath(); c.fill();
      },
      peito: function (c) {
        c.fillStyle = '#e0a526'; c.fillRect(-1.4, -50, 2.8, 20);
        c.fillStyle = '#111'; c.fillRect(-11.6, -30, 23.2, 2.4);
      }
    },
    thanos: {
      cabeca: function (c) {
        c.strokeStyle = 'rgba(40,10,60,.5)'; c.lineWidth = 0.7;
        for (const x of [-1.5, 1, 3.5]) { c.beginPath(); c.moveTo(x, -54.4); c.lineTo(x, -51.6); c.stroke(); }
        c.fillStyle = '#e0a526';
        c.beginPath(); c.moveTo(-8.6, -62.5); c.lineTo(-8.6, -66); c.quadraticCurveTo(1, -73, 10.6, -66); c.lineTo(10.6, -62.5);
        c.lineTo(7, -65); c.lineTo(-5, -65); c.closePath(); c.fill();
      },
      peito: function (c) {
        c.fillStyle = '#e0a526';
        c.beginPath(); c.moveTo(-9, -50); c.lineTo(9, -50); c.lineTo(5, -42); c.lineTo(-5, -42); c.closePath(); c.fill();
        c.fillRect(-11.6, -30, 23.2, 2.4);
      },
      mao: function (c, o) {          // a manopla dourada com as pedras
        c.fillStyle = '#e0a526'; c.beginPath(); c.arc(0, 19, 6, 0, TAU); c.fill();
        const gemas = ['#e63946', '#4361ee', '#ffd166', '#2a9d8f', '#9d4edd', '#f77f00'];
        for (let i = 0; i < 6; i++) {
          const a = -Math.PI / 2 + (i / 6) * TAU;
          c.fillStyle = gemas[i];
          c.beginPath(); c.arc(Math.cos(a) * 3.4, 19 + Math.sin(a) * 3.4, 1.2, 0, TAU); c.fill();
        }
        if (o.brilho) {
          c.fillStyle = 'rgba(255,230,150,.35)'; c.beginPath(); c.arc(0, 19, 11, 0, TAU); c.fill();
        }
      }
    },
    venom: {
      cabeca: function (c, o) {
        c.fillStyle = '#111'; rr(c, -8, -68, 16, 17, 5); c.fill();
        c.fillStyle = '#fff';
        for (const k of [-1, 1]) {
          c.beginPath();
          const ex = 1 + k * 3.8;
          c.moveTo(ex - k * 1, -59.5); c.quadraticCurveTo(ex + k * 5.5, -63, ex + k * 3.4, -66.5);
          c.quadraticCurveTo(ex - k * 2.2, -64, ex - k * 1, -59.5); c.fill();
        }
        if (o.tonto) return;
        c.fillStyle = '#fff';
        c.beginPath(); c.moveTo(-6, -57); c.quadraticCurveTo(1, -50.2, 8, -57); c.quadraticCurveTo(1, -54.6, -6, -57); c.fill();
        c.strokeStyle = '#111'; c.lineWidth = 0.5;
        for (let x = -4; x <= 6; x += 2) { c.beginPath(); c.moveTo(x, -56.8); c.lineTo(x + 1, -53.6); c.stroke(); }
        c.fillStyle = '#e5383b'; c.beginPath(); c.ellipse(2, -52.8, 1.4, 2.4, 0.2, 0, TAU); c.fill();
      },
      peito: function (c) {
        c.fillStyle = '#fff';
        c.beginPath(); c.ellipse(0, -43, 2.4, 4, 0, 0, TAU); c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = 1.8; c.lineCap = 'round';
        for (const k of [-1, 1]) {
          c.beginPath(); c.moveTo(0, -45); c.quadraticCurveTo(k * 5, -49, k * 9, -48); c.stroke();
          c.beginPath(); c.moveTo(0, -41); c.quadraticCurveTo(k * 5, -38, k * 9, -33); c.stroke();
        }
      }
    },
    duende: {
      cabeca: function (c) {
        c.fillStyle = '#5b2a86';
        c.beginPath(); c.moveTo(-9, -63.5); c.quadraticCurveTo(-3, -71, 2, -70); c.quadraticCurveTo(10, -72, 15, -80);
        c.quadraticCurveTo(12, -69, 10, -63.5); c.closePath(); c.fill();
        c.fillStyle = '#6ab04c';
        c.beginPath(); c.moveTo(-8, -60); c.lineTo(-11.5, -63); c.lineTo(-8, -56); c.fill();
        c.fillStyle = '#ffd60a';
        c.beginPath(); c.ellipse(-2.2, -61, 1.7, 1.2, 0, 0, TAU); c.fill();
        c.beginPath(); c.ellipse(4.2, -61, 1.7, 1.2, 0, 0, TAU); c.fill();
      },
      peito: function (c) {
        c.fillStyle = '#5b2a86';
        c.beginPath(); c.moveTo(-9, -50); c.lineTo(-3, -50); c.lineTo(-5, -28); c.lineTo(-12, -28); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(9, -50); c.lineTo(3, -50); c.lineTo(5, -28); c.lineTo(12, -28); c.closePath(); c.fill();
      }
    },
    ultron: {
      cabeca: function (c, o) {
        c.fillStyle = '#b8c0cc'; rr(c, -8, -68, 16, 17, 5); c.fill();
        c.fillStyle = '#8d96a3'; c.fillRect(-8, -60, 3, 7); c.fillRect(5, -60, 3, 7);
        c.fillStyle = o.tonto ? '#ffb3b3' : '#ff2d2d';
        c.beginPath(); c.moveTo(-4.8, -62.5); c.lineTo(-0.6, -61.2); c.lineTo(-4.4, -60); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(6.8, -62.5); c.lineTo(2.6, -61.2); c.lineTo(6.4, -60); c.closePath(); c.fill();
        c.fillRect(-2.5, -55.6, 7, 1.4);
      },
      peito: function (c, o) {
        c.fillStyle = '#6c757d'; c.fillRect(-1, -50, 2, 22);
        c.fillStyle = 'rgba(255,45,45,' + (0.6 + 0.3 * Math.sin(o.t * 7)) + ')';
        c.beginPath(); c.arc(0, -42, 3.2, 0, TAU); c.fill();
      }
    },
    caveira: {
      cabeca: function (c, o) {
        c.fillStyle = '#c1121f'; rr(c, -8, -68, 16, 17, 5); c.fill();
        c.fillStyle = '#3a0306';
        if (!o.tonto) {
          c.beginPath(); c.ellipse(-2.4, -61.4, 2.6, 2.2, 0.2, 0, TAU); c.fill();
          c.beginPath(); c.ellipse(4.4, -61.4, 2.6, 2.2, -0.2, 0, TAU); c.fill();
        }
        c.beginPath(); c.moveTo(1, -59.4); c.lineTo(-0.3, -56.8); c.lineTo(2.3, -56.8); c.closePath(); c.fill();
        c.fillRect(-3, -54.8, 8, 1.2);
        for (let x = -2; x <= 4; x += 2) c.fillRect(x, -55.8, 0.6, 3);
      },
      peito: function (c) {
        c.fillStyle = '#111'; c.fillRect(-11.6, -31, 23.2, 3);
        c.fillStyle = '#c1121f'; c.beginPath(); c.arc(-5, -45, 2, 0, TAU); c.fill();
      }
    },
    ladrao: {
      cabeca: function (c) {
        c.fillStyle = '#212529';                       // gorro
        c.beginPath(); c.moveTo(-8.4, -64); c.lineTo(-8.4, -66);
        c.quadraticCurveTo(-8.4, -70.5, 0.5, -70.5); c.quadraticCurveTo(9.4, -70.5, 9.4, -66);
        c.lineTo(9.4, -64); c.closePath(); c.fill();
        c.fillRect(-8.4, -65.5, 17.8, 2.6);
        c.fillStyle = '#212529'; c.fillRect(-8.4, -63, 17.8, 4.4);   // máscara nos olhos
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(-2.2, -61, 1.1, 0, TAU); c.arc(4.2, -61, 1.1, 0, TAU); c.fill();
      },
      peito: function (c) {                            // camisola às riscas
        c.fillStyle = '#f1f3f5';
        for (let i = 0; i < 4; i++) c.fillRect(-11.5 + i * 0.4, -47 + i * 5, 23 - i * 0.8, 2.6);
      }
    },
    cozinheiro: {
      cabeca: function (c) {
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(-4.5, -71, 5.5, 0, TAU); c.arc(1.5, -73.5, 6.5, 0, TAU); c.arc(7, -70.5, 5, 0, TAU); c.fill();
        rr(c, -8.4, -70, 17.5, 6, 2); c.fill();
      },
      peito: function (c) {
        c.fillStyle = '#dee2e6'; rr(c, -6, -47, 12, 15, 2); c.fill();
        c.fillStyle = '#e63946'; c.fillRect(-11.6, -31, 23.2, 3);
      }
    },
    policia: {
      cabeca: function (c) {
        c.fillStyle = '#1d3557';
        rr(c, -8.6, -71, 17.2, 6.5, 2.5); c.fill();
        c.fillStyle = '#111'; c.fillRect(-8.6, -65.2, 19.5, 1.8);
        c.fillStyle = '#ffd166'; c.beginPath(); c.arc(0.5, -68, 1.7, 0, TAU); c.fill();
      },
      peito: function (c) {
        c.fillStyle = '#ffd166'; G.gfx.star(c, -4.5, -44, 2.6, '#ffd166', 0);
        c.fillStyle = '#111'; c.fillRect(-0.9, -50, 1.8, 11);
        c.fillRect(-11.6, -30.5, 23.2, 2.4);
      }
    }
  };

  function escudo(c, x, y, r, rot) {
    c.save(); c.translate(x, y); c.rotate(rot || 0);
    const an = ['#c1121f', '#f1f1f1', '#c1121f', '#1d4e89'];
    for (let i = 0; i < 4; i++) {
      c.fillStyle = an[i]; c.beginPath(); c.arc(0, 0, r * (1 - i * 0.22), 0, TAU); c.fill();
    }
    G.gfx.star(c, 0, 0, r * 0.34, '#ffffff', 0);
    c.restore();
  }

  /* o boneco inteiro. o = {t, dir, fase, anda, braco, tonto, algemas, cima, partes, ...} */
  function boneco(c, d, o) {
    const det = DETALHE[d.id] || {};
    const k = d.grande || 1;
    const pt = o.partes;
    c.save();
    c.scale((o.dir || 1) * k, k);

    function peca(nome, px, py, fn) {
      const p = pt && pt[nome];
      c.save();
      if (p) { c.translate(px + p.dx, py + p.dy); c.rotate(p.r); c.translate(-px, -py); }
      fn();
      c.restore();
    }

    const sw = o.anda ? Math.sin(o.fase) * 0.55 : 0;
    const noAr = o.noAr;
    let aF = -0.2 - sw * 0.8, aT = 0.2 + sw * 0.8;   // ângulos dos braços (frente / trás)
    if (o.braco > 0) aF = -0.2 + (-1.35) * o.braco;
    if (o.algemas) { aF = 0.42; aT = -0.52; }
    if (o.cima) { aF = -2.75; aT = 2.75; }
    if (noAr && !o.cima && !o.algemas && o.braco <= 0) { aF = -0.9; aT = 0.9; }

    // capa, por trás de tudo
    if (d.capa) {
      peca('tronco', 0, -38, function () {
        const ond = Math.sin(o.t * 7 + (o.fase || 0)) * 2.5 + (o.anda ? 4 : 0);
        c.fillStyle = d.capa;
        c.beginPath(); c.moveTo(-8, -49); c.lineTo(8, -49);
        c.lineTo(-4 - ond * 0.4, -12); c.quadraticCurveTo(-12 - ond, -11, -17 - ond, -14); c.closePath(); c.fill();
      });
    }
    // voo: prancha do Duende Verde ou os jatos
    if (o.prancha) {
      c.fillStyle = '#3d405b';
      c.beginPath(); c.moveTo(-20, 3); c.quadraticCurveTo(-10, -2, -4, 2); c.lineTo(0, -1); c.lineTo(4, 2);
      c.quadraticCurveTo(10, -2, 22, 3); c.quadraticCurveTo(10, 8, 0, 6); c.quadraticCurveTo(-10, 8, -20, 3); c.fill();
      c.fillStyle = '#ffd60a'; c.beginPath(); c.arc(-6, 3, 1.3, 0, TAU); c.arc(6, 3, 1.3, 0, TAU); c.fill();
    }
    if (o.jato) {
      for (const lx of [-5, 5]) {
        const fl = 8 + Math.random() * 8 * o.jato;
        c.fillStyle = d.id === 'ultron' ? '#ff5d5d' : '#ffb703';
        c.beginPath(); c.moveTo(lx - 3.5, 0); c.lineTo(lx, fl + 6); c.lineTo(lx + 3.5, 0); c.fill();
        c.fillStyle = '#fff3b0';
        c.beginPath(); c.moveTo(lx - 1.8, 0); c.lineTo(lx, fl * 0.6 + 3); c.lineTo(lx + 1.8, 0); c.fill();
      }
    }

    // pernas e ancas
    peca('pernas', 0, -14, function () {
      const aP = noAr ? 0.35 : sw;
      for (const [lx, a] of [[-5, -aP], [5, aP]]) {
        c.save(); c.translate(lx, -22); c.rotate(a);
        c.fillStyle = d.pernas; rr(c, -4.6, 0, 9.2, 22, 2); c.fill();
        c.fillStyle = d.pes || sombra(d.pernas, -0.25); c.fillRect(-4.6, 17, 9.2, 5);
        c.restore();
      }
      c.fillStyle = d.ancas || d.pernas; rr(c, -11.2, -27.5, 22.4, 6.5, 2); c.fill();
    });

    function braco(lado, ang) {
      c.save(); c.translate(lado * 9.2, -47); c.rotate(ang);
      c.fillStyle = d.bracos; rr(c, -3.6, -2.5, 7.2, 19, 3.5); c.fill();
      c.fillStyle = d.maos || AMARELO_LEGO;
      c.beginPath(); c.arc(0, 18.5, 4.3, 0, TAU); c.fill();
      c.fillStyle = sombra(d.maos || AMARELO_LEGO, -0.3);
      c.beginPath(); c.arc(0, 19.8, 1.6, 0, TAU); c.fill();
      if (lado > 0 && det.mao && !o.algemas) det.mao(c, o);
      if (o.algemas) {
        c.strokeStyle = '#adb5bd'; c.lineWidth = 1.5;
        c.beginPath(); c.arc(0, 18, 3.6, 0, TAU); c.stroke();
      }
      c.restore();
    }

    peca('bracoT', -9, -40, function () { braco(-1, aT); });
    peca('tronco', 0, -38, function () {
      c.fillStyle = d.tronco;
      c.beginPath(); c.moveTo(-12, -27); c.lineTo(12, -27); c.lineTo(9, -50.5); c.lineTo(-9, -50.5); c.closePath(); c.fill();
      c.strokeStyle = sombra(d.tronco, -0.3); c.lineWidth = 0.8; c.stroke();
      if (det.peito) det.peito(c, o);
    });
    if (o.algemas) {                  // correntinha entre as mãos
      c.strokeStyle = '#adb5bd'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(-1.5, -30); c.lineTo(3, -30.5); c.stroke();
    }
    peca('cabeca', 0, -60, function () {
      if (det.atras) det.atras(c, o);
      c.fillStyle = d.pele || AMARELO_LEGO;
      rr(c, -3.2, -52.5, 6.4, 3, 1); c.fill();
      rr(c, -8, -68, 16, 17, 5); c.fill();
      c.fillStyle = sombra(d.pele || AMARELO_LEGO, -0.08);
      rr(c, -4.6, -71.6, 9.2, 4.4, 1.6); c.fill();
      if (!d.semRosto) rosto(c, o.tonto ? 'tonto' : (d.expr || 'feliz'), o.t);
      if (det.cabeca) det.cabeca(c, o);
      if (o.tonto && d.semRosto) rosto(c, 'tonto', o.t);
    });
    peca('bracoF', 9, -40, function () { braco(1, aF); });
    c.restore();

    if (o.tonto) {                    // estrelinhas à volta da cabeça
      for (let i = 0; i < 3; i++) {
        const a = o.t * 4 + (i / 3) * TAU;
        G.gfx.star(c, Math.cos(a) * 14 * k, -80 * k + Math.sin(a) * 4, 3.2, '#ffd166', a);
      }
    }
  }

  // só a cabeça (para o HUD e as setas)
  function cabecinha(c, d, x, y, esc, t, o) {
    c.save(); c.translate(x, y); c.scale(esc, esc); c.translate(0, 60);
    const det = DETALHE[d.id] || {};
    o = o || {};
    o.t = t;
    if (det.atras) det.atras(c, o);
    c.fillStyle = d.pele || AMARELO_LEGO;
    rr(c, -8, -68, 16, 17, 5); c.fill();
    c.fillStyle = sombra(d.pele || AMARELO_LEGO, -0.08);
    rr(c, -4.6, -71.6, 9.2, 4.4, 1.6); c.fill();
    if (!d.semRosto) rosto(c, d.expr || 'feliz', t);
    if (det.cabeca) det.cabeca(c, o);
    c.restore();
  }

  /* ---------- as personagens ---------- */
  const HEROIS = [
    { id: 'ferro', nome: 'Homem de Ferro', poder: 'raio', vel: 340, salto: 760, cd: 0.3, voa: true, semRosto: true,
      tronco: '#b5121b', bracos: '#b5121b', maos: '#e8b923', pernas: '#b5121b', ancas: '#e8b923', pes: '#e8b923' },
    { id: 'aranha', nome: 'Homem-Aranha', poder: 'teia', vel: 365, salto: 900, cd: 0.38, semRosto: true,
      tronco: '#d62828', bracos: '#d62828', maos: '#d62828', pernas: '#1d4e89', ancas: '#1d4e89', pes: '#d62828' },
    { id: 'capitao', nome: 'Capitão América', poder: 'escudo', vel: 345, salto: 800, cd: 0.25,
      tronco: '#1d4e89', bracos: '#1d4e89', maos: '#c1121f', pernas: '#1d4e89', ancas: '#1d4e89', pes: '#c1121f' },
    { id: 'thor', nome: 'Thor', poder: 'trovao', vel: 330, salto: 800, cd: 0.6, capa: '#c1121f',
      tronco: '#3d405b', bracos: '#3d405b', pernas: '#2b2d42', ancas: '#2b2d42' },
    { id: 'hulk', nome: 'Hulk', poder: 'smash', vel: 320, salto: 960, cd: 0.8, grande: 1.35, expr: 'bravo',
      pele: '#5fb041', tronco: '#5fb041', bracos: '#5fb041', maos: '#5fb041', pernas: '#6a3d9a', ancas: '#6a3d9a', pes: '#5fb041' }
  ];
  const VILOES = [
    { id: 'loki', nome: 'Loki', tiro: 'magia', cor: '#52b788', expr: 'mau', capa: '#2e7d32',
      tronco: '#1b5e20', bracos: '#1b5e20', maos: '#111', pernas: '#111', ancas: '#111' },
    { id: 'thanos', nome: 'Thanos', tiro: 'roxo', cor: '#9d4edd', expr: 'mau', grande: 1.4, extra: 1,
      pele: '#8e6bb5', tronco: '#1d4e89', bracos: '#1d4e89', maos: '#8e6bb5', pernas: '#1d4e89', ancas: '#e0a526' },
    { id: 'venom', nome: 'Venom', tiro: 'gosma', cor: '#2b2d42', semRosto: true,
      pele: '#111111', tronco: '#111111', bracos: '#111111', maos: '#111111', pernas: '#111111', ancas: '#111111' },
    { id: 'duende', nome: 'Duende Verde', tiro: 'abobora', cor: '#f77f00', voa: true, semRosto: true, prancha: true,
      pele: '#6ab04c', tronco: '#6ab04c', bracos: '#6ab04c', maos: '#5b2a86', pernas: '#6ab04c', ancas: '#5b2a86', pes: '#5b2a86' },
    { id: 'ultron', nome: 'Ultron', tiro: 'laser', cor: '#ff2d2d', voa: true, semRosto: true, jato: true,
      pele: '#b8c0cc', tronco: '#9aa3b0', bracos: '#9aa3b0', maos: '#6c757d', pernas: '#9aa3b0', ancas: '#6c757d' },
    { id: 'caveira', nome: 'Caveira Vermelha', tiro: 'cubo', cor: '#4cc9f0', semRosto: true,
      pele: '#c1121f', tronco: '#2b2d42', bracos: '#2b2d42', maos: '#111', pernas: '#2b2d42', ancas: '#111' }
  ];
  const POLICIA = { id: 'policia', tronco: '#1d3557', bracos: '#1d3557', pernas: '#111', ancas: '#111' };
  const COZINHEIRO = { id: 'cozinheiro', tronco: '#eceff4', bracos: '#eceff4', pernas: '#495057', ancas: '#e63946' };
  // ladrões normais (não são da Marvel): partem o vidro, levam coisas brilhantes e,
  // quando são apanhados, põem o vidro outra vez e ficam boa gente
  const LADRAO = { id: 'ladrao', nome: 'ladrão', tronco: '#343a40', bracos: '#343a40',
    pernas: '#212529', ancas: '#212529', cor: '#868e96', expr: 'mau' };
  // gente normal da cidade (e crianças, mais pequeninas)
  const CIVIS = [
    { id: 'civil1', tronco: '#4361ee', bracos: '#4361ee', pernas: '#2b2d42', ancas: '#2b2d42' },
    { id: 'civil2', tronco: '#ff6fb1', bracos: '#ff6fb1', pernas: '#8e4585', ancas: '#8e4585' },
    { id: 'civil3', tronco: '#2a9d8f', bracos: '#2a9d8f', pernas: '#495057', ancas: '#495057' },
    { id: 'civil4', tronco: '#ffb703', bracos: '#ffb703', pernas: '#6a4c93', ancas: '#6a4c93' },
    { id: 'civil5', tronco: '#e76f51', bracos: '#e76f51', pernas: '#264653', ancas: '#264653' }
  ];
  const CRIANCA = { id: 'crianca', tronco: '#8ac926', bracos: '#8ac926', pernas: '#1982c4', ancas: '#1982c4', grande: 0.72 };

  /* ---------- as casas da cidade (abertas à frente, como um cenário de Lego) ---------- */
  const CASA_W = 320, CASA_ANDAR = 150;
  const CASAS = [
    { x: 520, cor: '#f4a3a8', telhado: '#c1121f' },
    { x: 2010, cor: '#ffe08a', telhado: '#e07a1f' },
    { x: 2700, cor: '#a8dadc', telhado: '#1d7874' },
    { x: 5140, cor: '#c9b6e4', telhado: '#6a4c93' },
    { x: 5980, cor: '#b5e6b5', telhado: '#2d6a4f' }
  ];
  const FONTES = [1760, 3830];
  const SPAWN = [700, 1500, 2350, 4050, 4900, 5750];

  // 4.ª ronda de pedidos do Isaac (2026-10-03): "para chegar à polícia temos de ir de
  // CARRO DE CORRIDA, super rápido, com disparadores no carro; e os mauzões ficam sem
  // veículo quando lhes damos — e eles também dão com pistoladas".
  const CORRIDA_V = 980, CORRIDA_W = 176;          // o carro dos Vingadores
  const PARQUE_X = TORRE_X + 330;                  // onde o carro fica quando se descansa
  // os vilões que andam a pé vêm de carro (o Venom de mota); os que voam já têm a prancha/jatos
  const VEICULOS = {
    loki: { tipo: 'carro', cor: '#2d6a4f', enfeite: '#e0a526' },
    thanos: { tipo: 'carro', cor: '#5a189a', enfeite: '#e0a526', grande: 1.22 },
    venom: { tipo: 'mota', cor: '#22223b', enfeite: '#f8f9fa' },
    caveira: { tipo: 'carro', cor: '#9d0208', enfeite: '#2b2d42' }
  };

  /* ---------- plataformas (sempre iguais: gerador com semente) ---------- */
  const PLAT = [];
  (function () {
    let seed = 20260919;
    function r() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    let x = 420;
    const CORES_T = ['#e3242b', '#1e6fd9', '#ffcf1a', '#1fae4b', '#ff8a1c'];
    while (x < MUNDO - 500) {
      const longeDasCasas = CASAS.every(function (h) { return Math.abs(x + 120 - h.x) > 420; });
      if (longeDasCasas && Math.abs(x + 120 - PRISAO_X) > 420 && Math.abs(x + 120 - TORRE_X) > 430 &&
          Math.abs(x + 120 - REST_X) > 450 && FONTES.every(function (f) { return Math.abs(x + 120 - f) > 260; })) {
        const nivel = r() < 0.45 ? 1 : (r() < 0.65 ? 2 : 3);
        const w = 200 + Math.floor(r() * 4) * 40;
        const cor = CORES_T[Math.floor(r() * CORES_T.length)];
        PLAT.push({ x: x, y: [0, -150, -275, -390][nivel], w: w, cor: cor });
        if (nivel >= 2) PLAT.push({ x: x + (r() < 0.5 ? -170 : w - 20), y: -140, w: 190, cor: CORES_T[Math.floor(r() * 5)] });
        if (nivel === 3) PLAT.push({ x: x + w * 0.5 - 90, y: -265, w: 180, cor: CORES_T[Math.floor(r() * 5)] });
      }
      x += 420 + r() * 280;
    }
    // varandas da Torre dos Vingadores: uma escadinha em ziguezague até ao telhado
    for (let i = 0; i < 8; i++) {
      PLAT.push({ x: TORRE_X + (i % 2 === 0 ? -150 : 30), y: -110 - i * 110, w: 120, cor: '#7fa8cc', torre: true });
    }
    PLAT.push({ x: TORRE_X - 165, y: -TORRE_H, w: 330, cor: '#5b8bb5', torre: true });   // telhado
    PLAT.push({ x: REST_X - REST_W / 2, y: -REST_H, w: REST_W, cor: '#e76f51', rest: true });
    // dentro das casas: o chão de cima é plataforma, e o telhado também
    for (const h of CASAS) {
      PLAT.push({ x: h.x - CASA_W / 2 + 12, y: -CASA_ANDAR, w: CASA_W - 24, cor: h.cor, casa: true });
      PLAT.push({ x: h.x - CASA_W / 2 - 18, y: -CASA_ANDAR * 2, w: CASA_W + 36, cor: h.telhado, casa: true });
    }
  })();

  /* ---------- estado ---------- */
  let heroi, hi, viloes, tiros, tirosMaus, carros, pinos, fx, raios, ondas, cam, ronda, presos, contaPinos;
  let vitoria, tempo, banners;
  let vidas, medalhas, capturas, ganhouTudo, descanso;
  let transito, baloes, comidas, coracoes;
  let casas, ladroes, civis, avisoLadrao;
  let corrida, portaVisivel;

  /* as medalhas ficam guardadas: ganhar com os cinco heróis é para sempre */
  function carregaMedalhas() {
    try {
      const j = JSON.parse(localStorage.getItem('isaacMarvel') || '{}');
      medalhas = j.m || {}; ganhouTudo = !!j.tudo;
    } catch (e) { medalhas = {}; ganhouTudo = false; }
  }
  function guardaMedalhas() {
    try { localStorage.setItem('isaacMarvel', JSON.stringify({ m: medalhas, tudo: ganhouTudo })); } catch (e) { /* nada */ }
  }

  function defHeroi() { return HEROIS[hi]; }
  function altura(d) { return 72 * FIG * (d.grande || 1); }

  function novoVilao(def, x) {
    const e = 3 + Math.floor((ronda - 1) / 2) + (def.extra || 0);
    return {
      def: def, x: x, y: def.voa ? -230 : 0, vx: 0, vy: 0, dir: Math.random() < 0.5 ? -1 : 1,
      energia: Math.min(7, e), max: Math.min(7, e), estado: 'livre', fase: 0, tiroCd: rnd(2, 4),
      mudaT: rnd(1.5, 3.5), saltoT: rnd(2, 5), hitT: 0, voaBase: rnd(-280, -190), teia: 0,
      noChao: !def.voa, arco: null, veiculo: novoVeiculo(def)
    };
  }

  function novoVeiculo(def) {
    const vd = VEICULOS[def.id];
    if (!vd) return null;
    const hp = Math.min(5, 3 + Math.floor((ronda - 1) / 2));
    return { def: vd, hp: hp, max: hp, hitT: 0 };
  }

  function criaPinos() {
    pinos = [];
    for (let x = 250; x < MUNDO - 200; x += 170) {
      if (Math.abs(x - PRISAO_X) < 240) continue;
      pinos.push({ x: x, y: -22, v: (x % 1190 < 170) ? 5 : 1, fixo: true });
    }
    for (const p of PLAT) {
      for (let i = 0; i < 3; i++) pinos.push({ x: p.x + p.w * (0.25 + i * 0.25), y: p.y - 24, v: p.y < -350 ? 5 : 1, fixo: true });
    }
  }

  function novaRonda() {
    viloes = [];
    const ordem = VILOES.slice().sort(function () { return Math.random() - 0.5; });
    ordem.forEach(function (d, i) { viloes.push(novoVilao(d, SPAWN[i])); });
    presos = [];
    capturas = {};
    criaPinos();
    criaBaloes();
    criaComidas();
    criaCasas();
    ladroes = []; civis = [];
    coracoes = [                        // dois corações à espera no telhado da Torre
      { x: TORRE_X - 60, y: -TORRE_H - 34, vy: 0, t: 0 },
      { x: TORRE_X + 60, y: -TORRE_H - 34, vy: 0, t: 0 }
    ];
  }

  S.enter = function () {
    hi = 0; ronda = 1; contaPinos = 0; tempo = 0;
    heroi = {
      x: PRISAO_X - 380, y: 0, vx: 0, vy: 0, dir: 1, noChao: true, saltos: 0, cd: 0, fase: 0, braco: 0,
      carrega: null, desmonta: null, invul: 1, jato: 0, trocaT: 0, conduz: false
    };
    // o carro de corrida está estacionado logo ali, ao pé de onde se começa
    corrida = { x: heroi.x - 240, y: 0, vx: 0, vy: 0, dir: 1, noChao: true, roda: 0, fogo: 0, bate: 0 };
    portaVisivel = false;
    tiros = []; tirosMaus = []; carros = []; fx = []; raios = []; ondas = []; banners = [];
    transito = []; baloes = []; comidas = []; coracoes = [];
    ladroes = []; civis = []; avisoLadrao = 0;
    vidas = MAX_VIDAS; descanso = null;
    carregaMedalhas();
    cam = { x: heroi.x - 400, y: 0 };
    vitoria = null;
    novaRonda();
    fala('Vingadores, reunir! Vamos pôr os vilões na prisão! O carro de corrida está aqui ao lado.');
    G.banner('🦸 Apanha os vilões! 🔒', 2600);
  };

  /* ---------- geometria do ecrã ---------- */
  // em ecrãs estreitos (telemóvel ao alto) afasta-se a câmara, senão via-se um palmo
  // de rua e um ecrã cheio de céu
  function escala() { return Math.min(1, G.H / 620, G.W / 520); }
  function chaoPx() { return Math.min(G.H * 0.84, G.H - 122); }
  function vistaW() { return G.W / escala(); }

  /* ---------- efeitos ---------- */
  function faisca(x, y, cor, n, vel) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, TAU), v = rnd(80, vel || 320);
      fx.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, t: 0, vida: rnd(0.4, 0.8), cor: cor, tam: rnd(3, 7), tijolo: Math.random() < 0.5 });
    }
  }
  function soltaPinos(x, y, n) {
    for (let i = 0; i < n; i++) {
      pinos.push({ x: x, y: y, vx: rnd(-260, 260), vy: rnd(-620, -300), v: 1, fixo: false, vida: 8 });
    }
  }

  /* ---------- herói ---------- */
  function trocaHeroi(novo) {
    if (novo === hi || heroi.desmonta) return;
    hi = novo;
    heroi.trocaT = 0.45;
    faisca(heroi.x, heroi.y - 50, '#ffd166', 16, 260);
    sfx('monta');
    fala(defHeroi().nome + '!');
  }

  // pode levar com um poder: vilões à solta e ladrões que ainda não foram apanhados
  function atacavel(o) {
    return o.ladrao ? (o.estado !== 'bom' && o.estado !== 'apanhado') : o.estado === 'livre';
  }
  function inimigos() { return viloes.concat(ladroes); }
  // onde se acerta: num vilão de carro conta o carro todo (é grande e é fácil)
  function centroY(v) { return v.veiculo ? v.y - 46 : v.y - altura(v.def) * 0.5; }
  function tocaAlvo(v, x, y, r) {
    if (v.veiculo) {
      const k = v.veiculo.def.grande || 1;
      return Math.abs(x - v.x) < 84 * k && Math.abs(y - centroY(v)) < 58 * k;
    }
    return Math.hypot(v.x - x, centroY(v) - y) < r * (v.def.grande || 1);
  }

  function alvoMaisPerto(x, y, dir, alcance, qualquerLado) {
    let melhor = null, md = 1e9;
    for (const v of inimigos()) {
      if (!atacavel(v)) continue;
      const vy = centroY(v);
      const dx = v.x - x, dy = vy - y;
      if (!qualquerLado && dx * dir < -30) continue;
      const d = Math.hypot(dx, dy * 0.8);
      if (d < alcance && d < md) { md = d; melhor = v; }
    }
    return melhor;
  }

  function ataca() {
    const h = heroi, d = defHeroi();
    if (h.cd > 0 || h.desmonta) return;
    if (h.conduz) { disparaCarro(); return; }
    const mx = h.x + h.dir * 26 * (d.grande || 1), my = h.y - altura(d) * 0.58;
    h.braco = 1;
    if (d.poder === 'raio' || d.poder === 'teia') {
      const alvo = alvoMaisPerto(mx, my, h.dir, 820);
      let vx = h.dir, vy = 0;
      if (alvo) {                      // mira assistida: aponta ao vilão mais perto
        const ax = alvo.x - mx, ay = centroY(alvo) - my, n = Math.hypot(ax, ay) || 1;
        vx = ax / n; vy = ay / n;
        if (vx * h.dir < 0.2) { vx = h.dir; vy = 0; }
      }
      const v = d.poder === 'raio' ? 980 : 780;
      tiros.push({ tipo: d.poder, x: mx, y: my, vx: vx * v, vy: vy * v, vida: 1.0, alvo: alvo });
      sfx(d.poder === 'raio' ? 'repulsor' : 'teia');
      h.cd = d.cd;
    } else if (d.poder === 'escudo') {
      if (tiros.some(function (t) { return t.tipo === 'escudo'; })) return;
      const alvo = alvoMaisPerto(mx, my, h.dir, 640);
      let vx = h.dir, vy = 0;
      if (alvo) {
        const ax = alvo.x - mx, ay = centroY(alvo) - my, n = Math.hypot(ax, ay) || 1;
        vx = ax / n; vy = ay / n;
      }
      tiros.push({ tipo: 'escudo', x: mx, y: my, vx: vx * 820, vy: vy * 820, vida: 3, ida: 0.62, t: 0, acertou: [] });
      sfx('escudo');
      h.cd = d.cd;
    } else if (d.poder === 'trovao') {
      const alvo = alvoMaisPerto(h.x, my, h.dir, 620, true);
      const tx = alvo ? alvo.x : h.x + h.dir * 300;
      const ty = alvo ? centroY(alvo) : 0;
      raios.push({ x1: mx, y1: my - 30, x2: tx, y2: ty, t: 0, seg: raioZig(mx, my - 30, tx, ty) });
      if (alvo) acerta(alvo, h.dir);
      else faisca(tx, -4, '#bde0fe', 10);
      sfx('trovao'); G.shake = Math.max(G.shake, 0.15);
      h.cd = d.cd;
    } else if (d.poder === 'smash') {
      if (!h.noChao) { h.vy = 1500; h.pisao = true; h.cd = 0.2; return; }
      smash();
      h.cd = d.cd;
    }
  }

  function smash() {
    const h = heroi;
    ondas.push({ x: h.x, y: h.y, t: 0 });
    sfx('smash'); G.shake = Math.max(G.shake, 0.4);
    faisca(h.x, h.y - 4, '#c9ada7', 18, 380);
    for (const v of inimigos()) {
      if (!atacavel(v)) continue;
      const dx = v.x - h.x, dy = (v.y - h.y);
      if (Math.abs(dx) < 300 && Math.abs(dy) < 200) {
        acerta(v, dx >= 0 ? 1 : -1);
        if (!v.def.voa) { v.vy = -520; v.noChao = false; }
      }
    }
  }

  function raioZig(x1, y1, x2, y2) {
    const pts = [], n = 7;
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      pts.push([x1 + (x2 - x1) * k + (i && i < n ? rnd(-22, 22) : 0), y1 + (y2 - y1) * k + (i && i < n ? rnd(-14, 14) : 0)]);
    }
    return pts;
  }

  function acerta(v, dir) {
    if (v.ladrao) { acertaLadrao(v, dir); return; }
    if (v.estado !== 'livre') return;
    if (v.veiculo) {                   // primeiro parte-se o carro dele, peça a peça
      const ve = v.veiculo;
      ve.hp--; ve.hitT = 0.3; v.hitT = 0.2;
      v.x += dir * 10;
      faisca(v.x + rnd(-50, 50), v.y - 40, ve.def.cor, 6, 260);
      if (ve.hp <= 0) semVeiculo(v);
      else sfx('quebra');
      return;
    }
    v.energia--;
    v.hitT = 0.35;
    v.x += dir * 18;
    faisca(v.x, v.y - altura(v.def) * 0.5, '#ffd166', 8);
    soltaPinos(v.x, v.y - 30, 2);
    if (v.energia <= 0) algema(v);
    else sfx('pop');
  }

  // o carro do vilão desfaz-se todo em peças de Lego e ele salta cá para fora, a pé
  function semVeiculo(v) {
    const ve = v.veiculo;
    v.veiculo = null;
    for (let i = 0; i < 26; i++) {
      const a = rnd(Math.PI * 1.05, Math.PI * 1.95), vel = rnd(160, 520);
      fx.push({ x: v.x + rnd(-60, 60), y: v.y - rnd(10, 50), vx: Math.cos(a) * vel, vy: Math.sin(a) * vel,
        t: 0, vida: rnd(0.7, 1.2), cor: i % 4 ? ve.def.cor : ve.def.enfeite, tam: rnd(5, 10), tijolo: true });
    }
    soltaPinos(v.x, v.y - 30, 3);
    v.vy = -680; v.noChao = false; v.saltoT = rnd(1.5, 3);
    sfx('desmonta'); sfx('poof');
    G.shake = Math.max(G.shake, 0.25);
    G.addStars(1);
    const qual = ve.def.tipo === 'mota' ? 'mota' : 'carro';
    fala('O ' + v.def.nome + ' ficou sem ' + qual + '!');
    G.banner('🧱 ' + v.def.nome + ' ficou sem ' + qual + '!', 1800);
  }

  function algema(v) {
    v.estado = 'algemado'; v.t = 0; v.carro = null;
    v.vx = 0;
    if (v.def.voa) { v.vy = 0; v.noChao = false; }
    sfx('algemas');
    capturas[defHeroi().id] = (capturas[defHeroi().id] || 0) + 1;   // conta para a medalha deste herói
    G.addStars(1);
    fala('Apanhei o ' + v.def.nome + '!');
    // a polícia vem buscá-lo daqui a nada (se o herói não o levar antes)
    setTimeoutJogo(1.2, function () { if (v.estado === 'algemado' && !v.carro) chamaPolicia(v); });
  }

  let agenda = [];
  function setTimeoutJogo(seg, fn) { agenda.push({ t: tempo + seg, fn: fn }); }

  function chamaPolicia(v) {
    const car = { x: PRISAO_X + (v.x > PRISAO_X ? 160 : -160), dir: v.x > PRISAO_X ? 1 : -1, estado: 'vai', alvo: v, t: 0, preso: null };
    v.carro = car;
    carros.push(car);
    sfx('sirene');
  }

  function prende(v, peloHeroi) {
    v.estado = 'preso';
    presos.push(v);
    sfx('prisao');
    G.addStars(peloHeroi ? 3 : 2);
    contaPinos += peloHeroi ? 20 : 10;
    fala('O ' + v.def.nome + ' está na prisão!', true);
    G.banner('🔒 ' + v.def.nome + (peloHeroi ? ' — foste tu! ⭐⭐⭐' : ''), 2200);
    if (presos.length >= viloes.length) {
      const antes = ganhouTudo;
      const m = daMedalha();           // a medalha é de quem apanhou mais vilões nesta ronda
      const final = ganhouTudo && !antes;
      vitoria = { t: 0, medalha: m, final: final };
      sfx('tada');
      G.addStars(5);
      if (m) {
        fala('Todos na prisão! Medalha do ' + m.nome + '!', true);
        G.banner('🏅 Medalha do ' + m.nome + '!', 3400);
      } else {
        fala('Todos os vilões estão na prisão! Vingadores, boa!', true);
        G.banner('🎉 TODOS NA PRISÃO! 🎉', 3500);
      }
      if (final) {
        setTimeoutJogo(3.6, function () {
          G.banner('🏆 GANHASTE COM TODOS OS VINGADORES! 🏆', 5000);
          fala('Ganhaste o jogo com todos os Vingadores! És o maior!');
          G.addStars(20);
          for (let k = 0; k < 6; k++) {
            setTimeoutJogo(k * 0.35, function () {
              faisca(PRISAO_X + rnd(-400, 400), rnd(-520, -160), ['#e63946', '#ffd166', '#4cc9f0', '#8ac926', '#ff6fb1'][k % 5], 26, 520);
            });
          }
        });
      }
    }
  }

  /* ---------- corações, comida, balões e trânsito ---------- */
  function ganhaVida(k) {
    if (vidas >= MAX_VIDAS) { G.addStars(1); sfx('star'); return; }
    vidas = Math.min(MAX_VIDAS, vidas + k);
    sfx('heart');
  }

  function largaVilao() {
    const h = heroi;
    if (!h.carrega) return;
    const v = h.carrega; h.carrega = null;
    v.estado = 'algemado'; v.x = h.x + h.dir * 30; v.y = h.y; v.vy = -200; v.noChao = false; v.carro = null;
    setTimeoutJogo(0.8, function () { if (v.estado === 'algemado' && !v.carro) chamaPolicia(v); });
  }

  // sem corações vai-se descansar à Torre dos Vingadores (nunca há fim de jogo)
  function descansar() {
    if (descanso) return;
    const h = heroi;
    if (h.conduz) {                    // o carro de corrida vai estacionar ao pé da Torre
      saiDoCarro(true);
      corrida.x = PARQUE_X; corrida.vx = 0; corrida.y = 0; corrida.vy = 0; corrida.noChao = true;
    }
    largaVilao();
    descanso = { t: 0 };
    h.desmonta = null; h.vx = 0; h.vy = 0; h.x = TORRE_X + 40; h.y = 0; h.noChao = true;
    h.carroApoio = null; h.invul = 3.6;
    sfx('poof');
    faisca(h.x, h.y - 40, '#bde0fe', 20, 280);
    fala('Sem corações! Vamos descansar à Torre dos Vingadores.');
    G.banner('💤 A descansar na Torre…', 2600);
  }

  /* ---------- o carro de corrida dos Vingadores ---------- */
  function pertoDoCarro() {
    const h = heroi;
    return !h.conduz && !h.desmonta && !descanso && h.y > -60 && Math.abs(h.x - corrida.x) < 110;
  }

  function entraNoCarro() {
    const h = heroi;
    h.conduz = true; h.carroApoio = null; h.jato = 0; h.pisao = false;
    h.vx = 0; h.vy = 0;
    corrida.dir = h.dir;
    sfx('door'); sfx('vroom');
    faisca(corrida.x, -50, '#ffd166', 12, 220);
    fala(h.carrega ? 'Ao carro! Vamos levá-lo à prisão, super rápido!' : 'Ao carro de corrida!');
  }

  function saiDoCarro(calado) {
    const h = heroi;
    if (!h.conduz) return;
    h.conduz = false;
    h.x = clamp(corrida.x - corrida.dir * 40, 40, MUNDO - 40); h.y = corrida.y;
    h.vx = 0; h.vy = 0; h.noChao = corrida.y >= 0; h.dir = corrida.dir;
    corrida.vx *= 0.3;
    if (!calado) { sfx('door'); h.invul = Math.max(h.invul, 0.5); }
  }

  // os disparadores: dois canhões nas ilhargas do carro, com mira assistida
  function disparaCarro() {
    const h = heroi, car = corrida;
    const mx = car.x + car.dir * 70, my = car.y - 40;
    const alvo = alvoMaisPerto(mx, my, car.dir, 900);
    let vx = car.dir, vy = 0;
    if (alvo) {
      const ax = alvo.x - mx, ay = centroY(alvo) - my, n = Math.hypot(ax, ay) || 1;
      vx = ax / n; vy = ay / n;
      if (vx * car.dir < 0.25) { vx = car.dir; vy = 0; }
    }
    const sp = 1300 + Math.abs(car.vx);
    // um tiro de cada vez, ora do disparador de cima ora do de baixo
    car.lado = car.lado ? 0 : 1;
    tiros.push({ tipo: 'blaster', x: mx + (car.lado ? 6 : 0), y: my + (car.lado ? 6 : -14), vx: vx * sp, vy: vy * sp, vida: 0.9, alvo: alvo });
    car.fogo = 0.12;
    sfx('pew');
    h.cd = 0.3;
  }

  // um tiro dos vilões no carro: abana, faz boing e tira meio coração (não se desmonta)
  function bateNoCarro(t) {
    const h = heroi;
    faisca(t.x, t.y, t.cor, 10);
    faisca(corrida.x, corrida.y - 40, '#ced4da', 6, 200);
    corrida.bate = 0.4;
    h.invul = 1.3;
    sfx('boing');
    G.shake = Math.max(G.shake, 0.2);
    vidas = Math.max(0, vidas - 0.5);
    if (vidas <= 0) setTimeoutJogo(1.0, descansar);
  }

  function conduz(dt) {
    const h = heroi, car = corrida, I = G.input;
    let mv = 0;
    if (I.isHeld('left')) mv -= 1;
    if (I.isHeld('right')) mv += 1;
    if (mv) car.dir = mv;
    // arranca depressa e chega MUITO depressa (é um carro de corrida!)
    const ac = mv ? (mv * car.vx < 0 ? 5 : 1.8) : 1.4;
    car.vx += (mv * CORRIDA_V - car.vx) * Math.min(1, dt * ac);
    if ((I.justPressed('up') || I.justPressed('jump')) && car.noChao) {
      car.vy = -760; car.noChao = false; sfx('hop');
    }
    if (I.justPressed('fire') || (I.isHeld('fire') && h.cd <= 0)) ataca();
    car.vy += GRAV * dt;
    car.x += car.vx * dt; car.y += car.vy * dt;
    if (car.x < 100 || car.x > MUNDO - 100) { car.x = clamp(car.x, 100, MUNDO - 100); car.vx = 0; }
    if (car.y >= 0) {
      if (!car.noChao && car.vy > 500) faisca(car.x, 0, '#adb5bd', 6, 160);
      car.y = 0; car.vy = 0; car.noChao = true;
    }
    car.roda += car.vx * dt / 17;
    car.fogo = Math.max(0, car.fogo - dt);
    car.bate = Math.max(0, car.bate - dt);
    if (Math.abs(car.vx) > 700 && Math.random() < dt * 30) {        // fumo da velocidade
      fx.push({ x: car.x - car.dir * 92, y: car.y - 22 + rnd(-6, 6), vx: -car.dir * rnd(40, 120), vy: rnd(-60, -10),
        t: 0, vida: rnd(0.25, 0.45), cor: Math.random() < 0.5 ? '#ffd166' : '#f77f00', tam: rnd(3, 6) });
    }
    // o herói vai lá dentro: tudo o que é dele (apanhar pinos, comida, prisão) segue o carro
    h.x = car.x; h.y = car.y; h.vx = car.vx; h.vy = car.vy; h.dir = car.dir; h.noChao = car.noChao;
    h.fase += Math.abs(car.vx) * dt * 0.02;
  }

  function criaComidas() {
    comidas = [
      { x: REST_X - 130, tipo: 'hamburguer', pronto: true, t: 0 },
      { x: REST_X, tipo: 'cachorro', pronto: true, t: 0 },
      { x: REST_X + 130, tipo: 'gelado', pronto: true, t: 0 }
    ];
  }
  function updateComidas(dt) {
    for (const cm of comidas) {
      if (cm.pronto) continue;
      cm.t += dt;
      if (cm.t > 15) { cm.pronto = true; cm.t = 0; }      // o cozinheiro faz outro
    }
  }

  const CORES_BALAO = { coracao: '#ff5d8f', estrela: '#ffd166', pinos: '#4cc9f0' };
  function novoBalao(x) {
    const r = Math.random();
    return {
      x: clamp(x, 220, MUNDO - 220), y: rnd(-320, -130),
      premio: r < 0.32 ? 'coracao' : (r < 0.66 ? 'estrela' : 'pinos'),
      ph: rnd(0, TAU), vx: rnd(-20, 20)
    };
  }
  function criaBaloes() {
    baloes = [];
    // metade à volta do restaurante (é lá a festa) e metade espalhados pela cidade
    for (let i = 0; i < 14; i++) baloes.push(novoBalao(i < 5 ? REST_X + rnd(-340, 340) : rnd(300, MUNDO - 300)));
  }
  function rebentaBalao(i) {
    const b = baloes[i];
    baloes.splice(i, 1);
    sfx('balao');
    faisca(b.x, b.y, CORES_BALAO[b.premio], 14, 260);
    if (b.premio === 'coracao') coracoes.push({ x: b.x, y: b.y, vy: -70, t: 0 });
    else if (b.premio === 'estrela') { G.addStars(2); faisca(b.x, b.y, '#ffd166', 8, 150); }
    else soltaPinos(b.x, b.y, 5);
    setTimeoutJogo(rnd(7, 14), function () {           // vão aparecendo outros
      if (baloes.length < 16) baloes.push(novoBalao(rnd(300, MUNDO - 300)));
    });
  }
  function updateBaloes(dt) {
    for (const b of baloes) {
      b.ph += dt * 1.3;
      b.x += b.vx * dt;
      if (b.x < 220 || b.x > MUNDO - 220) b.vx *= -1;
    }
    for (let i = baloes.length - 1; i >= 0; i--) {      // os tiros do herói também rebentam
      const b = baloes[i], by = b.y + Math.sin(b.ph) * 12;
      let bateu = false;
      for (const tr of tiros) if (Math.hypot(tr.x - b.x, tr.y - by) < 36) { bateu = true; break; }
      if (bateu) rebentaBalao(i);
    }
  }
  function updateCoracoes(dt) {
    for (const cr of coracoes) {
      cr.t += dt; cr.vy += 220 * dt; cr.y += cr.vy * dt;
      const p = plataformaSob(cr.x, cr.y - 6, cr.y + 40);
      if (p && cr.vy > 0) { cr.y = p.y - 34; cr.vy = 0; }
      if (cr.y > -34) { cr.y = -34; cr.vy = 0; }
    }
  }

  /* ---------- casas: vidros, coisas brilhantes e quem lá mora ---------- */
  function criaCasas() {
    casas = CASAS.map(function (h) {
      const x0 = h.x - CASA_W / 2;
      return {
        def: h, x: h.x, x0: x0,
        janelas: [
          { x: x0 + 62, y: -104, w: 64, h: 62, partido: 0, brilho: 0, andar: 0 },
          { x: x0 + CASA_W - 126, y: -254, w: 64, h: 62, partido: 0, brilho: 0, andar: 1 }
        ],
        brilhantes: [
          { x: x0 + CASA_W - 78, y: -40, cor: '#4cc9f0', levado: null, volta: 0 },
          { x: x0 + 92, y: -190, cor: '#ff6fb1', levado: null, volta: 0 }
        ],
        moradores: [
          { def: CIVIS[(h.x | 0) % CIVIS.length], x: x0 + 206, y: 0, fase: 0 },
          { def: CRIANCA, x: x0 + 62, y: -CASA_ANDAR, fase: 1.5 }
        ],
        festa: 0
      };
    });
  }

  function novoLadrao(x) {
    return {
      def: LADRAO, ladrao: true, x: x, y: 0, vx: 0, vy: 0, dir: 1, dirV: 1, noChao: true,
      energia: 2, max: 2, hitT: 0, estado: 'anda', t: 0, fase: 0, casa: null, janela: null,
      levados: [], mudaT: rnd(1, 3), teia: 0
    };
  }

  function casaParaRoubar(x) {
    let melhor = null, md = 1e9;
    for (const ca of casas) {
      if (!ca.brilhantes.some(function (b) { return !b.levado; })) continue;
      const d = Math.abs(ca.x - x);
      if (d < md) { md = d; melhor = ca; }
    }
    return melhor;
  }

  function acertaLadrao(l, dir) {
    if (l.estado === 'apanhado' || l.estado === 'bom') return;
    l.energia--;
    l.hitT = 0.3;
    l.x += dir * 14;
    faisca(l.x, l.y - 50, '#ffd166', 8);
    if (l.energia > 0) { sfx('pop'); l.estado = 'foge'; l.t = 0; return; }
    // apanhado: mãos no ar, devolve tudo e arranja o vidro que partiu
    l.estado = 'apanhado'; l.t = 0; l.vx = 0;
    sfx('algemas');
    G.addStars(2);
  }

  function devolveTudo(l) {
    for (const b of l.levados) {
      b.levado = null;
      b.volta = 1;                                  // brilha ao voltar para o sítio
      G.addStars(2);
      faisca(b.x, b.y, b.cor, 10, 160);
    }
    l.levados = [];
    if (l.janela && l.janela.partido) {             // põe o vidro outra vez (regra do Isaac)
      l.janela.partido = 0; l.janela.brilho = 1;
      sfx('monta');
      faisca(l.janela.x + l.janela.w / 2, l.janela.y + l.janela.h / 2, '#bde0fe', 12, 150);
    }
    if (l.casa) l.casa.festa = 2.4;                 // quem lá mora festeja
    contaPinos += 10;
    if (l.aviso !== false) {
      G.banner('🔧 Pôs o vidro outra vez! ⭐', 2200);
      fala('Boa! Devolveu tudo e arranjou o vidro.');
    }
  }

  function updateLadroes(dt) {
    const h = heroi, vw = vistaW();
    // vão aparecendo ladrões novos perto de nós (o Isaac quer MUITOS maus)
    if (ladroes.filter(function (l) { return l.estado !== 'bom'; }).length < 5 && Math.random() < dt * 0.5) {
      const lado = Math.random() < 0.5 ? -1 : 1;
      const x = clamp(h.x + lado * (vw / 2 + rnd(200, 700)), 120, MUNDO - 120);
      ladroes.push(novoLadrao(x));
    }
    for (let i = ladroes.length - 1; i >= 0; i--) {
      const l = ladroes[i];
      l.hitT = Math.max(0, l.hitT - dt);
      l.t += dt;
      l.fase += Math.abs(l.vx) * dt * 0.05;
      const longe = Math.abs(l.x - h.x) > vw + 1700;
      if (longe && (l.estado === 'bom' || l.estado === 'anda')) { ladroes.splice(i, 1); continue; }

      if (l.estado === 'apanhado') {
        l.vx = 0;
        if (l.t > 0.7 && !l.devolveu) { l.devolveu = true; devolveTudo(l); }
        if (l.t > 2.2) { l.estado = 'bom'; l.t = 0; l.def = CIVIS[Math.floor(Math.random() * CIVIS.length)]; }
      } else if (l.estado === 'bom') {
        // já é boa pessoa: acena e vai à vida dele
        l.vx = l.t < 1.6 ? 0 : (l.dirV || 1) * 80;
        l.x += l.vx * dt;
      } else if (l.estado === 'anda') {
        if (!l.casa || !l.casa.brilhantes.some(function (b) { return !b.levado; })) {
          l.casa = casaParaRoubar(l.x);
          l.janela = l.casa ? l.casa.janelas[0] : null;
        }
        if (!l.casa) { l.estado = 'foge'; l.t = 0; }
        else {
          const alvoX = l.janela.x + l.janela.w / 2;
          const dx = alvoX - l.x;
          l.vx = Math.abs(dx) > 20 ? (dx > 0 ? 1 : -1) * 190 : 0;
          l.x += l.vx * dt;
          if (Math.abs(dx) <= 20) { l.estado = 'parte'; l.t = 0; }
        }
      } else if (l.estado === 'parte') {
        l.vx = 0;
        if (l.janela.partido) { l.estado = 'rouba'; l.t = 0; }
        else if (l.t > 0.9) {
          l.janela.partido = 1;
          sfx('quebra'); G.shake = Math.max(G.shake, 0.12);
          for (let k = 0; k < 14; k++) {
            fx.push({ x: l.janela.x + rnd(0, l.janela.w), y: l.janela.y + rnd(0, l.janela.h),
              vx: rnd(-160, 160), vy: rnd(-260, -60), t: 0, vida: rnd(0.5, 0.9), cor: '#bde0fe', tam: rnd(3, 6), tijolo: true });
          }
          if (avisoLadrao <= 0 && Math.abs(l.x - h.x) < 1400) {
            avisoLadrao = 9;
            G.banner('🪟 Um ladrão partiu um vidro!', 2200);
            fala('Um ladrão! Apanha-o!');
          }
          l.estado = 'rouba'; l.t = 0;
        }
      } else if (l.estado === 'rouba') {
        const alvo = l.casa && l.casa.brilhantes.filter(function (b) { return !b.levado; })[0];
        if (!alvo) { l.estado = 'foge'; l.t = 0; }
        else {
          const dx = alvo.x - l.x;
          l.vx = Math.abs(dx) > 16 ? (dx > 0 ? 1 : -1) * 180 : 0;
          l.x += l.vx * dt;
          if (alvo.y < -100 && l.noChao && Math.abs(dx) < 140) { l.vy = -820; l.noChao = false; }  // salta para o andar de cima
          if (Math.abs(dx) <= 16 && Math.abs(l.y - (alvo.y + 36)) < 90) {
            alvo.levado = l; l.levados.push(alvo);
            sfx('star');
            l.estado = l.levados.length >= 2 ? 'foge' : 'rouba';
            l.t = 0;
          }
        }
      } else {                       // 'foge'
        // se leva coisas e desaparece do ecrã, é a POLÍCIA que o apanha lá longe:
        // assim as casas nunca ficam para sempre sem os seus brilhantes
        if (l.levados.length && Math.abs(l.x - h.x) > vw / 2 + 700) {
          l.longeT = (l.longeT || 0) + dt;
          if (l.longeT > 9) {
            l.aviso = false;
            devolveTudo(l);
            G.banner('👮 A polícia apanhou um ladrão lá longe!', 2200);
            ladroes.splice(i, 1);
            continue;
          }
        } else l.longeT = 0;
        const fugir = Math.abs(l.x - h.x) < 520;
        l.mudaT -= dt;
        if (l.mudaT <= 0) { l.dir = Math.random() < 0.5 ? -1 : 1; l.mudaT = rnd(1.5, 3); }
        const alvoVx = fugir ? (l.x > h.x ? 1 : -1) * 240 : l.dir * 140;
        l.vx += (alvoVx - l.vx) * Math.min(1, dt * 4);
        l.x += l.vx * dt;
        if (l.t > 9 && !fugir) { l.estado = 'anda'; l.t = 0; }   // vai roubar outra vez
      }

      l.x = clamp(l.x, 90, MUNDO - 90);
      if (Math.abs(l.vx) > 12) l.dirV = l.vx > 0 ? 1 : -1;
      // gravidade (podem estar no andar de cima das casas)
      const y0 = l.y;
      if (!l.noChao) {
        l.vy += GRAV * dt; l.y += l.vy * dt;
        if (l.y >= 0) { l.y = 0; l.vy = 0; l.noChao = true; }
        else if (l.vy >= 0) { const pl = plataformaSob(l.x, y0, l.y); if (pl) { l.y = pl.y; l.vy = 0; l.noChao = true; } }
      } else if (l.y < 0) {
        const emCima = PLAT.some(function (pl) { return Math.abs(pl.y - l.y) < 3 && l.x >= pl.x - 6 && l.x <= pl.x + pl.w + 6; });
        if (!emCima) l.noChao = false;
      }
      // encostar num ladrão já apanhado dá-lhe um empurrãozinho simpático (nada acontece)
      if (l.estado !== 'bom' && l.estado !== 'apanhado' && !h.desmonta &&
          Math.abs(l.x - h.x) < 34 && Math.abs(l.y - h.y) < 60) {
        acertaLadrao(l, l.x > h.x ? 1 : -1);
      }
    }
    avisoLadrao = Math.max(0, avisoLadrao - dt);
  }

  /* ---------- pessoas normais: passeiam, fogem dos ladrões e entram nos carros ---------- */
  function novoCivil(x) {
    const crianca = Math.random() < 0.25;
    return {
      def: crianca ? CRIANCA : CIVIS[Math.floor(Math.random() * CIVIS.length)],
      x: x, vx: 0, dir: Math.random() < 0.5 ? -1 : 1, dirV: 1, fase: 0,
      estado: 'anda', t: 0, mudaT: rnd(1.5, 4), acena: 0, carro: null, vel: rnd(52, 96)
    };
  }
  function updateCivis(dt) {
    const h = heroi, vw = vistaW();
    if (civis.length < 6 && Math.random() < dt * 0.9) {
      const lado = Math.random() < 0.5 ? -1 : 1;
      const x = clamp(h.x + lado * (vw / 2 + rnd(120, 900)), 120, MUNDO - 120);
      // não nascem uns em cima dos outros, senão andam todos em molho
      if (civis.every(function (o) { return Math.abs(o.x - x) > 130; })) civis.push(novoCivil(x));
    }
    for (let i = civis.length - 1; i >= 0; i--) {
      const p = civis[i];
      p.t += dt; p.mudaT -= dt; p.acena = Math.max(0, p.acena - dt);
      p.fase += Math.abs(p.vx) * dt * 0.06;
      if (p.estado === 'entra') {
        const car = p.carro;
        if (!car || transito.indexOf(car) < 0) { p.estado = 'anda'; p.carro = null; continue; }
        const dx = car.x - p.x;
        p.vx = Math.abs(dx) > 14 ? (dx > 0 ? 1 : -1) * 150 : 0;
        p.x += p.vx * dt;
        if (Math.abs(dx) <= 16) {                 // entrou no carro e lá vai ele
          car.passageiros = (car.passageiros || 0) + 1;
          car.passageiro = p.def;
          sfx('door');
          civis.splice(i, 1);
          continue;
        }
      } else {
        // fugir de um ladrão que esteja mesmo ao lado (a rir, sem drama)
        let fuga = 0;
        for (const l of ladroes) {
          if (l.estado === 'bom' || l.estado === 'apanhado') continue;
          if (Math.abs(l.x - p.x) < 170) { fuga = p.x > l.x ? 1 : -1; break; }
        }
        if (fuga) { p.vx += (fuga * 200 - p.vx) * Math.min(1, dt * 5); p.acena = 0.4; }
        else {
          if (p.mudaT <= 0) {
            p.mudaT = rnd(1.5, 4);
            p.dir = Math.random() < 0.3 ? 0 : (Math.random() < 0.5 ? -1 : 1);
            if (Math.random() < 0.3) p.acena = 1.4;
          }
          p.vx += (p.dir * p.vel - p.vx) * Math.min(1, dt * 3);
          // afastam-se de quem estiver mesmo ao lado (cada um no seu bocadinho de passeio)
          for (const o of civis) {
            if (o === p) continue;
            const d = o.x - p.x;
            if (Math.abs(d) < 60) { p.vx -= (d > 0 ? 1 : -1) * 40 * dt * 6; break; }
          }
          // se houver um carro parado ao pé, vai a correr entrar nele
          if (!p.carro && Math.random() < dt * 0.7) {
            for (const car of transito) {
              if (Math.abs(car.vx) < 30 && Math.abs(car.x - p.x) < 260) { p.carro = car; p.estado = 'entra'; break; }
            }
          }
        }
        p.x += p.vx * dt;
      }
      if (Math.abs(p.vx) > 8) p.dirV = p.vx > 0 ? 1 : -1;
      p.x = clamp(p.x, 80, MUNDO - 80);
      if (Math.abs(p.x - h.x) > vw + 1500) civis.splice(i, 1);
    }
  }

  function updateCasas(dt) {
    for (const ca of casas) {
      ca.festa = Math.max(0, ca.festa - dt);
      for (const j of ca.janelas) j.brilho = Math.max(0, j.brilho - dt);
      for (const b of ca.brilhantes) b.volta = Math.max(0, b.volta - dt);
      for (const m of ca.moradores) m.fase += dt;
    }
    // chapinhar nas fontes
    const h = heroi;
    for (const f of FONTES) {
      if (Math.abs(h.x - f) < 110 && h.y > -30) {
        if (!h.naFonte) { h.naFonte = true; sfx('splash'); G.addStars(1); }
        if (Math.random() < dt * 14) faisca(h.x + rnd(-20, 20), -10, '#8ecae6', 2, 130);
      } else if (Math.abs(h.x - f) > 130 && h.naFonte) h.naFonte = false;
    }
  }

  const TIPOS_CARRO = [
    { w: 130, h: 50, cor: '#e63946', tipo: 'carro' },
    { w: 152, h: 62, cor: '#4361ee', tipo: 'carrinha' },
    { w: 130, h: 50, cor: '#ffd166', tipo: 'taxi' },
    { w: 196, h: 78, cor: '#2a9d8f', tipo: 'autocarro' }
  ];
  function updateTransito(dt) {
    const h = heroi, vw = vistaW();
    // poucos carros de cada vez: mais do que isto e a rua fica um tapume
    if (transito.length < 4 && Math.random() < dt * 1.2) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      const x = dir > 0 ? cam.x - 280 : cam.x + vw + 280;
      if (x > 80 && x < MUNDO - 80) {
        transito.push({ x: x, dir: dir, def: TIPOS_CARRO[Math.floor(Math.random() * TIPOS_CARRO.length)],
          v: rnd(150, 250), vx: 0, buzina: 0 });
      }
    }
    for (let i = transito.length - 1; i >= 0; i--) {
      const car = transito[i];
      // regra de paz (a mesma dos CARROS): nunca atropela — pára quando o herói está
      // à frente, na estrada. Quem vai EM CIMA do carro segue viagem.
      const dx = h.x - car.x;
      const naEstrada = h.y > -40 && !h.desmonta && h.carroApoio !== car;
      const parar = naEstrada && dx * car.dir > 0 && Math.abs(dx) < 180;
      car.vx += ((parar ? 0 : car.v) * car.dir - car.vx) * Math.min(1, dt * 3);
      car.x += car.vx * dt;
      car.buzina -= dt;
      if (parar && car.buzina <= 0 && Math.abs(dx) < 150) { sfx('beep'); car.buzina = 2.6; }
      if ((car.x < -500 || car.x > MUNDO + 500 || Math.abs(car.x - h.x) > vw + 1600) && h.carroApoio !== car) {
        transito.splice(i, 1);
      }
    }
  }

  /* ---------- medalhas (uma por herói; as cinco ganham o jogo de vez) ---------- */
  function daMedalha() {
    const lista = HEROIS.map(function (d) { return { d: d, n: capturas[d.id] || 0 }; })
      .sort(function (a, b) { return b.n - a.n; });
    let esc = lista.find(function (o) { return o.n > 0 && !medalhas[o.d.id]; });
    if (!esc) esc = lista.find(function (o) { return !medalhas[o.d.id]; });
    if (!esc) return null;                       // já todos têm medalha
    medalhas[esc.d.id] = true;
    if (HEROIS.every(function (d) { return medalhas[d.id]; })) ganhouTudo = true;
    guardaMedalhas();
    return esc.d;
  }

  function desmonta() {
    const h = heroi;
    if (h.desmonta || h.invul > 0 || vitoria || h.conduz) return;
    const partes = {};
    for (const n of ['cabeca', 'tronco', 'pernas', 'bracoF', 'bracoT']) {
      partes[n] = { dx: 0, dy: 0, r: 0, vx: rnd(-90, 90), vy: rnd(-160, -60) - (n === 'cabeca' ? 60 : 0), vr: rnd(-7, 7) };
    }
    h.desmonta = { t: 0, partes: partes };
    h.vx = 0; h.carroApoio = null;
    sfx('desmonta');
    const perde = Math.min(contaPinos, 6);
    contaPinos -= perde;
    soltaPinos(h.x, h.y - 40, Math.max(2, perde));
    largaVilao();                     // larga o vilão, e a polícia vem buscá-lo
    vidas = Math.max(0, vidas - 0.5); // cada tiro tira MEIO coração (pedido do Isaac)
    if (vidas <= 0) setTimeoutJogo(1.5, descansar);
  }

  // apoio por baixo dos pés: plataformas e também o tejadilho dos carros da rua
  function apoioSob(x, yAntes, yDepois) {
    const p = plataformaSob(x, yAntes, yDepois);
    if (p) return { y: p.y, car: null };
    for (const car of transito) {
      const topo = -car.def.h;
      if (x >= car.x - car.def.w / 2 - 6 && x <= car.x + car.def.w / 2 + 6 && yAntes <= topo + 2 && yDepois >= topo) {
        return { y: topo, car: car };
      }
    }
    return null;
  }

  function plataformaSob(x, yAntes, yDepois) {
    for (const p of PLAT) {
      if (x >= p.x - 6 && x <= p.x + p.w + 6 && yAntes <= p.y + 2 && yDepois >= p.y) return p;
    }
    return null;
  }

  function andaAPe(dt) {
    const h = heroi, d = defHeroi(), I = G.input;
    let mv = 0;
    if (I.isHeld('left')) mv -= 1;
    if (I.isHeld('right')) mv += 1;
    const vel = d.vel * (h.carrega ? 0.88 : 1);
    h.vx += (mv * vel - h.vx) * Math.min(1, dt * (h.noChao ? 14 : 7));
    if (mv) h.dir = mv;
    if (I.justPressed('up') || I.justPressed('jump')) {
      if (h.noChao) { h.vy = -d.salto; h.noChao = false; h.saltos = 1; h.carroApoio = null; sfx('hop'); }
      else if (h.saltos < 2) { h.vy = -d.salto * 0.85; h.saltos = 2; sfx('hop'); faisca(h.x, h.y, '#fff', 5, 140); }
    }
    // o Homem de Ferro VOA: segurar o ⬆ no ar liga os jatos
    h.jato = 0;
    if (d.voa && !h.noChao && (I.isHeld('up') || I.isHeld('jump')) && h.vy > -380) {
      h.vy -= 2700 * dt; h.jato = 1;
      if (h.vy < -380) h.vy = -380;
    }
    if (I.justPressed('fire') || (I.isHeld('fire') && h.cd <= 0 && (d.poder === 'raio' || d.poder === 'teia'))) ataca();

    // à boleia em cima de um carro da rua: anda com ele
    if (h.carroApoio) {
      if (transito.indexOf(h.carroApoio) < 0 || !h.noChao) h.carroApoio = null;
      else h.x += h.carroApoio.vx * dt;
    }

    const y0 = h.y;
    h.vy += GRAV * dt * (h.jato ? 0.35 : 1);
    if (h.vy > 1500) h.vy = 1500;
    h.x += h.vx * dt; h.y += h.vy * dt;
    h.x = clamp(h.x, 40, MUNDO - 40);
    if (h.y < TETO) { h.y = TETO; h.vy = Math.max(0, h.vy); }
    h.noChao = false;
    if (h.y >= 0) { h.y = 0; h.vy = 0; h.noChao = true; h.carroApoio = null; }
    else if (h.vy >= 0) {
      const a = apoioSob(h.x, y0, h.y);
      if (a) { h.y = a.y; h.vy = 0; h.noChao = true; h.carroApoio = a.car; }
    }
    if (h.noChao) {
      h.saltos = 0;
      if (h.pisao) { h.pisao = false; smash(); }
    }
    h.fase += Math.abs(h.vx) * dt * 0.045;
  }

  function updateHeroi(dt) {
    const h = heroi, d = defHeroi(), I = G.input;
    if (descanso) {                    // a dormir na Torre até os corações voltarem
      descanso.t += dt;
      if (descanso.t > 2.4 && !descanso.cheio) {
        descanso.cheio = true; vidas = MAX_VIDAS; sfx('tada');
        G.banner('❤️ Corações cheios!', 2000);
        fala('Corações cheios! Vamos outra vez!');
      }
      if (descanso.t > 3.4) descanso = null;
      return;
    }
    h.cd = Math.max(0, h.cd - dt);
    h.invul = Math.max(0, h.invul - dt);
    h.braco = Math.max(0, h.braco - dt * 4);
    h.trocaT = Math.max(0, h.trocaT - dt);
    if (h.desmonta) {
      const dm = h.desmonta;
      dm.t += dt;
      for (const n in dm.partes) {
        const p = dm.partes[n];
        if (dm.t < 0.9) {
          p.vy += 520 * dt; p.dx += p.vx * dt; p.dy += p.vy * dt; p.r += p.vr * dt;
          if (p.dy > 18) { p.dy = 18; p.vy *= -0.4; p.vx *= 0.7; }
        } else {                                   // volta tudo ao sítio
          const k = Math.min(1, (dm.t - 0.9) / 0.45);
          p.dx *= 1 - k; p.dy *= 1 - k; p.r *= 1 - k;
        }
      }
      if (dm.t > 0.9 && !dm.som) { dm.som = true; sfx('monta'); }
      if (dm.t >= 1.4) { h.desmonta = null; h.invul = 1.8; }
      return;
    }
    // a porta do carro de corrida: o 🚪, a seta para baixo, ou tocar no próprio carro
    let porta = I.justPressed('door') || I.justPressed('down');
    if (!porta && I.tap && (h.conduz || pertoDoCarro())) {
      const sc = escala();
      const sx = (corrida.x - cam.x) * sc, sy = chaoPx() + (corrida.y - 40 - cam.y) * sc;
      porta = Math.abs(I.tap.x - sx) < 100 * sc && Math.abs(I.tap.y - sy) < 60 * sc;
    }
    if (porta) {
      if (h.conduz) { if (corrida.noChao) saiDoCarro(); }
      else if (pertoDoCarro()) entraNoCarro();
    }
    if (h.conduz) conduz(dt);
    else andaAPe(dt);

    // encostar num vilão algemado = pegar nele e levá-lo ao colo
    if (!h.carrega) {
      for (const v of viloes) {
        if (v.estado !== 'algemado' || v.arco) continue;
        // de carro apanha-se de mais longe: ele salta lá para dentro, para o banco de trás
        if (Math.abs(v.x - h.x) < (h.conduz ? 110 : 46) && Math.abs(v.y - h.y) < (h.conduz ? 120 : 70)) {
          h.carrega = v; v.estado = 'levado';
          if (v.carro) { v.carro.alvo = null; v.carro.estado = 'volta'; v.carro = null; }
          sfx('hop');
          G.banner(h.conduz ? '🏎️ Depressa, à prisão!' : '🔒 Leva-o à prisão!', 1800);
          break;
        }
      }
    }
    if (h.carrega && Math.abs(h.x - PRISAO_X) < 120 && h.y > -60) {
      const v = h.carrega; h.carrega = null;
      prende(v, true);
      faisca(PRISAO_X, -60, '#ffd166', 20);
    }

    // apanhar pinos
    for (let i = pinos.length - 1; i >= 0; i--) {
      const p = pinos[i];
      if (Math.abs(p.x - h.x) < 40 && p.y > h.y - altura(d) - 10 && p.y < h.y + 16) {
        contaPinos += p.v;
        pinos.splice(i, 1);
        sfx(p.v > 1 ? 'star' : 'pop');
      }
    }
    // apanhar corações
    for (let i = coracoes.length - 1; i >= 0; i--) {
      const cr = coracoes[i];
      if (Math.abs(cr.x - h.x) < 48 && cr.y > h.y - altura(d) - 20 && cr.y < h.y + 24) {
        ganhaVida(1);
        faisca(cr.x, cr.y, '#ff5d8f', 10, 180);
        coracoes.splice(i, 1);
      }
    }
    // rebentar balões só por lhes tocar
    for (let i = baloes.length - 1; i >= 0; i--) {
      const b = baloes[i];
      if (Math.hypot(b.x - h.x, (b.y + Math.sin(b.ph) * 12) - (h.y - altura(d) * 0.6)) < 46) rebentaBalao(i);
    }
    // comer no restaurante: cada coisa dá um coração
    for (const cm of comidas) {
      if (!cm.pronto || Math.abs(cm.x - h.x) > 54 || h.y < -150) continue;
      cm.pronto = false; cm.t = 0;
      ganhaVida(1);
      sfx('nham');
      fala('Que bom! Nham nham!');
      faisca(cm.x, -108, '#ffd166', 12, 180);
      G.banner('🍔 Nham nham! ❤️', 1600);
    }
  }

  /* ---------- vilões ---------- */
  function updateViloes(dt) {
    const h = heroi;
    const vel = 150 + 18 * Math.min(6, ronda - 1);
    for (const v of viloes) {
      v.hitT = Math.max(0, v.hitT - dt);
      if (v.estado === 'preso' || v.estado === 'carro' || v.estado === 'levado') continue;
      if (v.estado === 'algemado') {
        v.t += dt;
        if (v.arco) {                  // a saltar para dentro do carro da polícia
          v.arco.t += dt;
          const k = Math.min(1, v.arco.t / 0.5);
          v.x = v.arco.x0 + (v.arco.car.x - v.arco.x0) * k;
          v.y = v.arco.y0 * (1 - k) - 60 * k - Math.sin(k * Math.PI) * 90;
          if (k >= 1) { v.estado = 'carro'; v.arco = null; v.arcoCar.preso = v; v.arcoCar.estado = 'volta'; v.arcoCar.t = 0; }
          continue;
        }
        if (!v.noChao) {
          const y0 = v.y;
          v.vy += GRAV * dt; v.y += v.vy * dt;
          if (v.y >= 0) { v.y = 0; v.vy = 0; v.noChao = true; }
          else if (v.vy >= 0) { const p = plataformaSob(v.x, y0, v.y); if (p) { v.y = p.y; v.vy = 0; v.noChao = true; } }
        }
        continue;
      }
      // livre
      const dx = h.x - v.x, perto = Math.abs(dx) < 380 && !h.desmonta;
      const ve = v.veiculo;
      if (ve) ve.hitT = Math.max(0, ve.hitT - dt);
      const vv = ve ? vel * 1.7 : vel;                              // de carro vão mais depressa
      v.mudaT -= dt;
      if (v.mudaT <= 0) { v.dir = Math.random() < 0.5 ? -1 : 1; v.mudaT = rnd(1.5, 3.5); }
      let alvoVx = v.dir * vv * 0.7;
      if (perto) alvoVx = (dx > 0 ? -1 : 1) * vv * 1.2;             // foge do herói
      if (v.teia > 0) { v.teia -= dt; alvoVx *= 0.35; }
      if (v.x < 150) alvoVx = Math.abs(alvoVx);
      if (v.x > MUNDO - 150) alvoVx = -Math.abs(alvoVx);
      // ninguém se esconde dentro da prisão
      if (Math.abs(v.x - PRISAO_X) < 260 && !v.def.voa) alvoVx = (v.x < PRISAO_X ? -1 : 1) * vv;
      v.vx += (alvoVx - v.vx) * Math.min(1, dt * (ve ? 2.5 : 4));
      v.x += v.vx * dt;
      if (Math.abs(v.vx) > 10) v.dirV = v.vx > 0 ? 1 : -1;
      v.fase += Math.abs(v.vx) * dt * 0.05;
      if (v.def.voa) {
        v.y = v.voaBase + Math.sin(tempo * 1.7 + v.x * 0.003) * 50;
      } else {
        const y0 = v.y;
        v.saltoT -= dt;
        if (ve) v.saltoT = Math.max(v.saltoT, 0.5);                // de carro não se salta para as plataformas
        if (v.noChao && v.saltoT <= 0) { v.vy = -rnd(620, 820); v.noChao = false; v.saltoT = rnd(2, 4.5); }
        if (!v.noChao) {
          v.vy += GRAV * dt; v.y += v.vy * dt;
          if (v.y >= 0) { v.y = 0; v.vy = 0; v.noChao = true; }
          else if (v.vy >= 0 && !ve) { const p = plataformaSob(v.x, y0, v.y); if (p) { v.y = p.y; v.vy = 0; v.noChao = true; } }
        } else if (v.y < 0 && !PLAT.some(function (p) { return Math.abs(p.y - v.y) < 3 && v.x >= p.x - 6 && v.x <= p.x + p.w + 6; })) {
          v.noChao = false;          // saiu da ponta da plataforma
        }
      }
      // atirar ao herói (só quando se vê no ecrã, e devagar)
      v.tiroCd -= dt;
      const noEcra = Math.abs(v.x - (cam.x + vistaW() / 2)) < vistaW() / 2 + 20;
      if (v.tiroCd <= 0 && noEcra && Math.abs(dx) < 640 && !h.desmonta && !vitoria && ve) {
        // de carro dá PISTOLADAS: balinhas rápidas e direitinhas, de duas em duas
        const ox = v.x + (dx > 0 ? 1 : -1) * 30, oy = v.y - 70 * (ve.def.grande || 1);
        const tx = h.x, ty = h.y - (h.conduz ? 40 : altura(defHeroi()) * 0.5);
        const n = Math.hypot(tx - ox, ty - oy) || 1;
        const sp = 380 + 15 * Math.min(6, ronda - 1);
        for (let k = 0; k < 2; k++) {
          setTimeoutJogo(k * 0.22, function () {
            if (v.estado !== 'livre' || !v.veiculo) return;
            tirosMaus.push({ tipo: 'bala', cor: '#ffd166', x: v.x + (dx > 0 ? 1 : -1) * 30, y: oy, vx: (tx - ox) / n * sp, vy: (ty - oy) / n * sp, vida: 2.4, rot: 0 });
            sfx('pew');
          });
        }
        v.dirV = dx > 0 ? 1 : -1; v.atira = 0.6;
        v.tiroCd = rnd(3.0, 4.6) / (1 + 0.08 * Math.min(6, ronda - 1));
      } else if (v.tiroCd <= 0 && noEcra && Math.abs(dx) < 640 && !h.desmonta && !vitoria) {
        const ox = v.x, oy = v.y - altura(v.def) * 0.6;
        const tx = h.x, ty = h.y - altura(defHeroi()) * 0.5;
        const n = Math.hypot(tx - ox, ty - oy) || 1;
        const sp = (v.def.tiro === 'laser' ? 330 : 230) + 15 * Math.min(6, ronda - 1);
        tirosMaus.push({ tipo: v.def.tiro, cor: v.def.cor, x: ox, y: oy, vx: (tx - ox) / n * sp, vy: (ty - oy) / n * sp, vida: 3.2, rot: 0 });
        v.dirV = dx > 0 ? 1 : -1; v.atira = 0.4;
        v.tiroCd = rnd(2.6, 4.2) / (1 + 0.08 * Math.min(6, ronda - 1));
        sfx(v.def.tiro === 'laser' ? 'zap' : 'poof');
      }
      v.atira = Math.max(0, (v.atira || 0) - dt);
    }
  }

  /* ---------- tiros ---------- */
  function updateTiros(dt) {
    const h = heroi;
    for (let i = tiros.length - 1; i >= 0; i--) {
      const t = tiros[i];
      t.vida -= dt;
      if (t.tipo === 'escudo') {
        t.t += dt;
        if (t.t > t.ida) {             // volta para a mão do Capitão
          const ax = h.x - t.x, ay = (h.y - 50) - t.y, n = Math.hypot(ax, ay) || 1;
          t.vx = ax / n * 900; t.vy = ay / n * 900;
          if (n < 40 || t.vida <= 0 || defHeroi().poder !== 'escudo') { tiros.splice(i, 1); continue; }
        }
        t.x += t.vx * dt; t.y += t.vy * dt;
        for (const v of inimigos()) {
          if (!atacavel(v) || t.acertou.indexOf(v) >= 0) continue;
          if (tocaAlvo(v, t.x, t.y, 44)) {
            t.acertou.push(v); acerta(v, t.vx > 0 ? 1 : -1); sfx('escudo');
          }
        }
        continue;
      }
      // mira assistida: curva um bocadinho para o alvo
      if (t.alvo && t.alvo.estado === 'livre') {
        const ax = t.alvo.x - t.x, ay = centroY(t.alvo) - t.y, n = Math.hypot(ax, ay) || 1;
        const sp = Math.hypot(t.vx, t.vy);
        t.vx += (ax / n * sp - t.vx) * Math.min(1, dt * 6);
        t.vy += (ay / n * sp - t.vy) * Math.min(1, dt * 6);
      }
      t.x += t.vx * dt; t.y += t.vy * dt;
      let bateu = false;
      for (const v of inimigos()) {
        if (!atacavel(v)) continue;
        if (tocaAlvo(v, t.x, t.y, 40)) {
          acerta(v, t.vx > 0 ? 1 : -1);
          if (t.tipo === 'teia') v.teia = 2.2;
          bateu = true; break;
        }
      }
      if (bateu || t.vida <= 0 || t.y > 10) tiros.splice(i, 1);
    }
    for (let i = tirosMaus.length - 1; i >= 0; i--) {
      const t = tirosMaus[i];
      t.vida -= dt; t.rot += dt * 6;
      if (t.tipo === 'abobora') t.vy += 260 * dt;
      t.x += t.vx * dt; t.y += t.vy * dt;
      const hy = h.y - altura(defHeroi()) * 0.5;
      if (h.conduz) {                  // de carro, o alvo é o carro todo
        if (h.invul <= 0 && !vitoria && Math.abs(t.x - corrida.x) < CORRIDA_W / 2 && t.y > corrida.y - 78 && t.y < corrida.y + 4) {
          tirosMaus.splice(i, 1);
          bateNoCarro(t);
          continue;
        }
      } else if (!h.desmonta && h.invul <= 0 && Math.abs(t.x - h.x) < 22 * (defHeroi().grande || 1) + 10 &&
          Math.abs(t.y - hy) < altura(defHeroi()) * 0.5) {
        faisca(t.x, t.y, t.cor, 10);
        tirosMaus.splice(i, 1);
        desmonta();
        continue;
      }
      // só o ESCUDO do Capitão América defende: o que vai a voar e o que está no braço
      // (este último só pela frente). Os outros poderes não desfazem os tiros, senão
      // quem carrega sempre no ⚡ nunca era apanhado.
      let desfeito = false;
      for (const s of tiros) {
        if (s.tipo === 'escudo' && Math.hypot(s.x - t.x, s.y - t.y) < 34) { desfeito = true; break; }
      }
      if (!desfeito && defHeroi().poder === 'escudo' && !h.desmonta && !h.conduz && !tiros.some(function (s) { return s.tipo === 'escudo'; }) &&
          (t.x - h.x) * h.dir > 8 && Math.abs(t.x - h.x) < 46 && Math.abs(t.y - hy) < 40) {
        desfeito = true; sfx('escudo');
      }
      if (desfeito) { faisca(t.x, t.y, t.cor, 6); tirosMaus.splice(i, 1); continue; }
      if (t.vida <= 0 || t.y > 20) {
        if (t.y > 20) faisca(t.x, 0, t.cor, 5);
        tirosMaus.splice(i, 1);
      }
    }
  }

  /* ---------- polícia ---------- */
  function updateCarros(dt) {
    for (let i = carros.length - 1; i >= 0; i--) {
      const car = carros[i];
      car.t += dt;
      if (car.estado === 'vai') {
        const v = car.alvo;
        if (!v || v.estado !== 'algemado') { car.estado = 'volta'; car.alvo = null; continue; }
        const dx = v.x - car.x;
        car.dir = dx > 0 ? 1 : -1;
        car.x += car.dir * Math.min(Math.abs(dx), 560 * dt);
        // chegou ao pé dele (se estiver numa plataforma, ele salta cá para baixo)
        if (Math.abs(dx) < 70 && v.noChao) {
          car.estado = 'espera'; car.t = 0;
          v.arco = { t: 0, x0: v.x, y0: v.y, car: car }; v.arcoCar = car;
          sfx('hop');
        }
      } else if (car.estado === 'espera') {
        if (car.t > 2.5 && !car.preso) { car.estado = 'volta'; }
      } else if (car.estado === 'volta') {
        const dx = PRISAO_X - car.x;
        car.dir = dx > 0 ? 1 : -1;
        car.x += car.dir * Math.min(Math.abs(dx), 520 * dt);
        if (Math.abs(dx) < 4) {
          if (car.preso) { prende(car.preso, false); car.preso = null; faisca(PRISAO_X, -60, '#ffd166', 16); }
          carros.splice(i, 1);
        }
      }
    }
  }

  /* ---------- update ---------- */
  S.update = function (dt) {
    tempo += dt;
    for (let i = agenda.length - 1; i >= 0; i--) {
      if (agenda[i].t <= tempo) { const f = agenda[i].fn; agenda.splice(i, 1); f(); }
    }
    const I = G.input;
    if (I.justPressed('horn')) trocaHeroi((hi + 1) % HEROIS.length);
    if (I.tap) {
      const q = caraRect();
      for (let k = 0; k < HEROIS.length; k++) {
        if (Math.hypot(I.tap.x - q.x(k), I.tap.y - q.y) < q.r + 6) { trocaHeroi(k); break; }
      }
    }
    if (I.justPressed('debug9')) desmonta();

    updateHeroi(dt);
    if (!heroi.conduz && (Math.abs(corrida.vx) > 1 || !corrida.noChao)) {   // deixado a andar: trava sozinho
      corrida.vx *= Math.max(0, 1 - dt * 3);
      corrida.vy += GRAV * dt; corrida.y = Math.min(0, corrida.y + corrida.vy * dt);
      if (corrida.y >= 0) { corrida.vy = 0; corrida.noChao = true; }
      corrida.x = clamp(corrida.x + corrida.vx * dt, 100, MUNDO - 100);
      corrida.roda += corrida.vx * dt / 17;
    }
    if (!heroi.conduz) { corrida.fogo = 0; corrida.bate = Math.max(0, corrida.bate - dt); }
    if (!vitoria) updateViloes(dt);
    updateTiros(dt);
    updateCarros(dt);
    updateTransito(dt);
    updateBaloes(dt);
    updateComidas(dt);
    updateCoracoes(dt);
    updateLadroes(dt);
    updateCivis(dt);
    updateCasas(dt);

    // pinos soltos a saltar
    for (let i = pinos.length - 1; i >= 0; i--) {
      const p = pinos[i];
      if (p.fixo) continue;
      p.vida -= dt;
      const y0 = p.y;
      p.vy += GRAV * 0.8 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.99;
      if (p.y >= -10) { p.y = -10; p.vy *= -0.45; p.vx *= 0.8; }
      else if (p.vy > 0) { const pl = plataformaSob(p.x, y0 + 10, p.y + 10); if (pl) { p.y = pl.y - 10; p.vy *= -0.45; } }
      if (p.vida <= 0) pinos.splice(i, 1);
    }
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i];
      f.t += dt; f.vy += 900 * dt; f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.t > f.vida) fx.splice(i, 1);
    }
    for (let i = raios.length - 1; i >= 0; i--) { raios[i].t += dt; if (raios[i].t > 0.28) raios.splice(i, 1); }
    for (let i = ondas.length - 1; i >= 0; i--) { ondas[i].t += dt; if (ondas[i].t > 0.5) ondas.splice(i, 1); }

    if (vitoria) {
      vitoria.t += dt;
      if (vitoria.t > 1 && Math.random() < dt * 8) faisca(PRISAO_X + rnd(-300, 300), rnd(-420, -200), ['#e63946', '#ffd166', '#4cc9f0', '#8ac926'][Math.floor(rnd(0, 4))], 12, 360);
      if (vitoria.t > 6.5) {
        vitoria = null;
        ronda++;
        novaRonda();
        fala('Os vilões fugiram pelo túnel! Apanha-os outra vez!');
        G.banner('😱 Fugiram pelo túnel! Ronda ' + ronda, 2600);
      }
    }

    // câmara
    const sc = escala(), vw = vistaW();
    // de carro de corrida a câmara olha mais para a frente e segue mais depressa
    const frente = heroi.conduz ? 0.22 * clamp(Math.abs(corrida.vx) / 500, 0.5, 1) : 0.12;
    const alvoX = clamp(heroi.x - vw / 2 + heroi.dir * vw * frente, 0, MUNDO - vw);
    cam.x += (alvoX - cam.x) * Math.min(1, dt * (heroi.conduz ? 6 : 4));
    // o 🚪 só aparece quando dá para entrar ou sair do carro
    const porta = heroi.conduz || pertoDoCarro();
    if (porta !== portaVisivel) { portaVisivel = porta; document.body.classList.toggle('marvel-porta', porta); }
    // em cima, a câmara sobe para o herói ficar sempre à vista (nunca desce abaixo do chão)
    const querY = Math.min(0, heroi.y + (chaoPx() - G.H * 0.42) / sc);
    cam.y += (querY - cam.y) * Math.min(1, dt * 3);
  };

  /* =====================================================================
     DESENHO
     ===================================================================== */
  function fundo(c, t) {
    const W = G.W, H = G.H, sc = escala(), cp = chaoPx();
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#79c4ff'); g.addColorStop(0.75, '#d8f0ff'); g.addColorStop(1, '#f1f9ff');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const chaoEcra = cp - cam.y * sc;
    // nuvens
    for (let i = 0; i < 6; i++) {
      const x = ((i * 530 - cam.x * 0.1 + t * 8) % (W + 400) + W + 400) % (W + 400) - 200;
      G.gfx.cloud(c, x, 70 + (i % 3) * 50, 30 + (i % 2) * 14, 0.85);
    }
    // cidade ao longe (paralaxe 0.25), com a Torre dos Vingadores
    c.save();
    const px = cam.x * 0.25;
    for (let i = -1; i < 30; i++) {
      const bx = i * 150 - (px % 150);
      const idx = i + Math.floor(px / 150);
      const hh = (110 + ((idx * 73) % 7) * 34) * sc;
      c.fillStyle = '#a9cbe6';
      c.fillRect(bx, chaoEcra - hh, 132, hh);
      c.fillStyle = 'rgba(255,255,255,.35)';
      for (let wy = chaoEcra - hh + 14; wy < chaoEcra - 20; wy += 26) for (let wx = bx + 14; wx < bx + 120; wx += 30) c.fillRect(wx, wy, 12, 12);
      if (idx % 13 === 4) {           // Torre dos Vingadores
        const tx = bx + 40, th = 330 * sc;
        c.fillStyle = '#8fb3d1';
        c.beginPath(); c.moveTo(tx, chaoEcra); c.lineTo(tx + 14, chaoEcra - th); c.lineTo(tx + 70, chaoEcra - th - 30);
        c.lineTo(tx + 76, chaoEcra); c.closePath(); c.fill();
        c.fillStyle = '#fff';
        c.font = 'bold ' + Math.round(26 * sc + 8) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('A', tx + 44, chaoEcra - th + 16);
      }
    }
    c.restore();
    // prédios de Lego mais perto (paralaxe 0.55)
    const p2 = cam.x * 0.55;
    const CORES_P = ['#f4a3a8', '#ffe08a', '#a3c9f4', '#b5e6b5', '#ffc38a'];
    for (let i = -1; i < 20; i++) {
      const idx = i + Math.floor(p2 / 260);
      const bx = i * 260 - (p2 % 260);
      const hh = (90 + ((idx * 37) % 5) * 30) * sc, bw = 200;
      const cor = CORES_P[((idx % 5) + 5) % 5];
      c.fillStyle = cor; c.fillRect(bx, chaoEcra - hh, bw, hh);
      c.fillStyle = sombra(cor, -0.1);
      const pin = 20;
      for (let k = 0; k < bw / pin; k++) rr(c, bx + k * pin + 4, chaoEcra - hh - 6, pin - 8, 7, 2), c.fill();
      c.fillStyle = 'rgba(255,255,255,.55)';
      for (let wy = chaoEcra - hh + 16; wy < chaoEcra - 30; wy += 34) for (let wx = bx + 18; wx < bx + bw - 30; wx += 42) rr(c, wx, wy, 22, 20, 4), c.fill();
    }
    // chão: passeio e estrada de Lego
    c.fillStyle = '#b0b7c3'; c.fillRect(0, chaoEcra, W, 14 * sc + 4);
    c.fillStyle = '#6c757d'; c.fillRect(0, chaoEcra + 14 * sc + 4, W, H);
    c.fillStyle = '#c4cbd6';
    const pp = 24 * sc;
    for (let x = -((cam.x * sc) % pp); x < W; x += pp) rr(c, x + pp * 0.2, chaoEcra - 4, pp * 0.6, 5, 2), c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)';
    const dash = 120 * sc;
    for (let x = -((cam.x * sc) % dash); x < W; x += dash) c.fillRect(x, chaoEcra + 40 * sc + 10, dash * 0.5, 5);
  }

  function plataforma(c, p) {
    const pin = 20, h = 26;
    c.fillStyle = sombra(p.cor, -0.08);
    for (let k = 0; k < Math.floor(p.w / pin); k++) { rr(c, p.x + k * pin + 4, p.y - 6, pin - 8, 8, 2); c.fill(); }
    c.fillStyle = p.cor; rr(c, p.x, p.y, p.w, h, 5); c.fill();
    c.fillStyle = sombra(p.cor, -0.22); c.fillRect(p.x + 3, p.y + h * 0.72, p.w - 6, h * 0.28);
    c.fillStyle = sombra(p.cor, 0.3); c.fillRect(p.x + 6, p.y + 5, 5, h * 0.4);
  }

  /* ---------- a cidade: estrada, Torre dos Vingadores e restaurante ---------- */
  function rua(c, t) {
    const de = cam.x - 300, ate = cam.x + vistaW() + 300;
    // passadeiras
    for (let x = Math.floor(de / 940) * 940; x < ate; x += 940) {
      c.fillStyle = 'rgba(255,255,255,.8)';
      for (let k = 0; k < 5; k++) c.fillRect(x + k * 28, 10, 17, 36);
    }
    // candeeiros e semáforos ao longo do passeio
    for (let x = Math.floor(de / 470) * 470; x < ate; x += 470) {
      const semaforo = Math.abs(x % 940) < 1;
      c.fillStyle = '#6c757d';
      c.fillRect(x - 4, semaforo ? -150 : -190, 8, semaforo ? 150 : 190);
      if (semaforo) {
        c.fillStyle = '#343a40'; rr(c, x - 15, -204, 30, 60, 7); c.fill();
        const fase = Math.floor(t * 0.5 + x * 0.001) % 3;
        const cores = ['#e63946', '#ffd166', '#8ac926'];
        for (let k = 0; k < 3; k++) {
          c.fillStyle = fase === k ? cores[k] : 'rgba(255,255,255,.18)';
          c.beginPath(); c.arc(x, -192 - k * 17, 6.5, 0, TAU); c.fill();
        }
      } else {
        c.fillStyle = '#adb5bd';
        c.beginPath(); c.moveTo(x - 4, -190); c.quadraticCurveTo(x - 4, -206, x + 22, -206); c.lineTo(x + 22, -200);
        c.quadraticCurveTo(x + 2, -200, x + 2, -190); c.closePath(); c.fill();
        c.fillStyle = '#fff3b0'; c.beginPath(); c.ellipse(x + 22, -196, 9, 6, 0, 0, TAU); c.fill();
      }
    }
  }

  function torre(c, t) {
    const x0 = TORRE_X - TORRE_W / 2, y0 = -TORRE_H;
    c.fillStyle = '#3f5c8a'; rr(c, x0, y0, TORRE_W, TORRE_H, 10); c.fill();
    c.fillStyle = '#54749f'; c.fillRect(x0 + 18, y0 + 12, 28, TORRE_H - 12);
    c.fillStyle = '#c9d6e8'; c.fillRect(x0 + TORRE_W - 26, y0 + 10, 14, TORRE_H - 10);
    c.fillStyle = 'rgba(190,230,255,.75)';
    for (let yy = y0 + 50; yy < -130; yy += 58) {
      for (let xx = x0 + 58; xx < x0 + TORRE_W - 44; xx += 52) { rr(c, xx, yy, 36, 34, 5); c.fill(); }
    }
    c.fillStyle = '#2f486e';
    for (let k = 0; k < TORRE_W / 26; k++) { rr(c, x0 + k * 26 + 5, y0 - 9, 18, 11, 3); c.fill(); }
    // porta da Torre
    c.fillStyle = '#4a6fa5'; rr(c, TORRE_X - 44, -116, 88, 116, 8); c.fill();
    c.fillStyle = '#bde0fe'; rr(c, TORRE_X - 34, -102, 28, 66, 4); c.fill(); rr(c, TORRE_X + 6, -102, 28, 66, 4); c.fill();
    // o "A" dos Vingadores
    const sy = y0 + 150;
    c.fillStyle = '#ffd166'; c.strokeStyle = '#b56b00'; c.lineWidth = 5;
    c.beginPath(); c.arc(TORRE_X, sy, 48, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#22223b';
    c.font = 'bold 64px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('A', TORRE_X, sy + 4);
  }

  // o que fica ACIMA do telhado (desenhado depois das plataformas)
  function torreTopo(c, t) {
    const y0 = -TORRE_H;
    c.fillStyle = '#8d99ae'; c.fillRect(TORRE_X + 96, y0 - 96, 9, 96);
    c.fillStyle = '#c1121f';                       // bandeira dos Vingadores
    const on = Math.sin(t * 3) * 6;
    c.beginPath(); c.moveTo(TORRE_X + 105, y0 - 96);
    c.quadraticCurveTo(TORRE_X + 140, y0 - 88 + on, TORRE_X + 172, y0 - 80);
    c.lineTo(TORRE_X + 172, y0 - 52); c.quadraticCurveTo(TORRE_X + 140, y0 - 60 + on, TORRE_X + 105, y0 - 52);
    c.closePath(); c.fill();
    c.fillStyle = '#ffd166';
    c.font = 'bold 26px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('A', TORRE_X + 138, y0 - 70);
    // antena com luz a piscar
    c.fillStyle = '#8d99ae'; c.fillRect(TORRE_X - 104, y0 - 74, 8, 74);
    c.fillStyle = Math.floor(t * 2) % 2 ? '#ff5d5d' : '#ffd6d6';
    c.beginPath(); c.arc(TORRE_X - 100, y0 - 80, 9, 0, TAU); c.fill();
  }

  function desenhaComida(c, tipo, x, y, k) {
    c.save(); c.translate(x, y); c.scale(k, k);
    c.fillStyle = 'rgba(255,255,255,.9)';
    c.beginPath(); c.ellipse(0, 20, 30, 8, 0, 0, TAU); c.fill();
    if (tipo === 'hamburguer') {
      c.fillStyle = '#e0a526'; c.beginPath(); c.arc(0, -4, 25, Math.PI, 0); c.fill();
      c.fillStyle = '#fff3b0';
      for (const sx of [-11, 0, 11]) { c.beginPath(); c.arc(sx, -15, 2.4, 0, TAU); c.fill(); }
      c.fillStyle = '#6ab04c'; rr(c, -26, -5, 52, 7, 3); c.fill();
      c.fillStyle = '#8b5a2b'; rr(c, -24, 1, 48, 10, 3); c.fill();
      c.fillStyle = '#e0a526'; rr(c, -25, 11, 50, 9, 4); c.fill();
    } else if (tipo === 'cachorro') {
      c.fillStyle = '#e8b56b'; rr(c, -27, -4, 54, 20, 9); c.fill();
      c.fillStyle = '#d1495b'; rr(c, -30, -12, 60, 13, 6); c.fill();
      c.strokeStyle = '#ffd166'; c.lineWidth = 3.4; c.lineCap = 'round';
      c.beginPath();
      for (let i = 0; i <= 4; i++) c.lineTo(-22 + i * 11, i % 2 ? -10 : -2);
      c.stroke();
    } else {
      c.fillStyle = '#e8b56b';
      c.beginPath(); c.moveTo(-12, 2); c.lineTo(12, 2); c.lineTo(0, 26); c.closePath(); c.fill();
      c.fillStyle = '#ff9ec7'; c.beginPath(); c.arc(-6, -6, 12, 0, TAU); c.fill();
      c.fillStyle = '#fff6e5'; c.beginPath(); c.arc(7, -9, 11, 0, TAU); c.fill();
      c.fillStyle = '#ff4d6d'; c.beginPath(); c.arc(2, -22, 4.5, 0, TAU); c.fill();
    }
    c.restore();
  }

  function restaurante(c, t) {
    const x0 = REST_X - REST_W / 2, y0 = -REST_H;
    c.fillStyle = '#fff3e0'; rr(c, x0, y0, REST_W, REST_H, 8); c.fill();
    c.fillStyle = '#bde0fe';
    rr(c, x0 + 28, y0 + 74, 124, 80, 6); c.fill();
    rr(c, x0 + REST_W - 152, y0 + 74, 124, 80, 6); c.fill();
    for (let k = 0; k * 34 < REST_W; k++) {        // toldo às riscas
      c.fillStyle = k % 2 ? '#e63946' : '#f8f9fa';
      const a = x0 + k * 34, b = Math.min(x0 + (k + 1) * 34, x0 + REST_W);
      c.beginPath(); c.moveTo(a, y0 + 32); c.lineTo(b, y0 + 32); c.lineTo(b + 12, y0 + 66); c.lineTo(a + 12, y0 + 66); c.closePath(); c.fill();
    }
    // letreiro: um hambúrguer, porque ele ainda não lê
    c.fillStyle = '#22223b'; rr(c, REST_X - 86, y0 - 72, 172, 60, 14); c.fill();
    c.strokeStyle = '#ffd166'; c.lineWidth = 4; rr(c, REST_X - 86, y0 - 72, 172, 60, 14); c.stroke();
    desenhaComida(c, 'hamburguer', REST_X - 36, y0 - 46, 0.8);
    G.gfx.star(c, REST_X + 44, y0 - 42, 15, '#ffd166', t);
    // parede da cozinha, para o cozinheiro (de branco) não desaparecer na parede clara
    c.fillStyle = '#f0c793'; c.fillRect(x0 + REST_W - 210, -178, 176, 106);
    c.fillStyle = '#e0aa6e'; c.fillRect(x0 + REST_W - 210, -178, 176, 8);
    // o cozinheiro, a acenar (atrás do balcão)
    c.save(); c.translate(REST_X + 158, -46); c.scale(FIG * 0.95, FIG * 0.95);   // em cima de um degrau, para se ver por cima do balcão
    boneco(c, COZINHEIRO, { t: t, dir: -1, fase: 0, anda: false, braco: 0.5 + Math.sin(t * 5) * 0.4 });
    c.restore();
    // balcão e a comida em cima
    c.fillStyle = '#e76f51'; rr(c, x0 + 34, -72, REST_W - 68, 72, 6); c.fill();
    c.fillStyle = '#c85a3c'; c.fillRect(x0 + 40, -30, REST_W - 80, 9);
    for (const cm of comidas) {
      if (cm.pronto) desenhaComida(c, cm.tipo, cm.x, -98, 1);
      else {
        c.globalAlpha = 0.4; c.fillStyle = '#fff';
        c.beginPath(); c.ellipse(cm.x, -78, 30, 8, 0, 0, TAU); c.fill();
        c.globalAlpha = 1;
      }
    }
  }

  /* ---------- as casas (abertas à frente, como um cenário de Lego) ---------- */
  function brilhante(c, b, t) {
    if (b.levado) return;
    const k = 1 + b.volta * 0.4;
    c.save();
    c.translate(b.x, b.y - 14 + Math.sin(t * 2 + b.x * 0.01) * 2);
    c.scale(k, k);
    c.fillStyle = b.cor;
    c.beginPath(); c.moveTo(0, -15); c.lineTo(13, -3); c.lineTo(0, 17); c.lineTo(-13, -3); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.6)';
    c.beginPath(); c.moveTo(0, -15); c.lineTo(5, -3); c.lineTo(0, 3); c.lineTo(-5, -3); c.closePath(); c.fill();
    c.restore();
    G.gfx.star(c, b.x + 15, b.y - 28, 5 + Math.sin(t * 5 + b.x) * 1.6, '#fff8e1', t * 2);
  }

  function casa(c, ca, t) {
    const d = ca.def, x0 = ca.x0, W = CASA_W, H = CASA_ANDAR * 2;
    // parede de trás e o interior
    c.fillStyle = sombra(d.cor, -0.3); rr(c, x0 - 6, -H - 6, W + 12, H + 6, 8); c.fill();
    c.fillStyle = sombra(d.cor, 0.18); c.fillRect(x0 + 6, -H, W - 12, H);
    c.fillStyle = 'rgba(255,255,255,.3)';
    for (let k = 0; k * 34 < W - 30; k++) c.fillRect(x0 + 16 + k * 34, -H + 8, 13, CASA_ANDAR - 22);
    // chão de baixo, tapete e escada para cima
    c.fillStyle = '#b5835a'; c.fillRect(x0 + 6, -10, W - 12, 10);
    c.fillStyle = '#e07a5f'; rr(c, x0 + 46, -16, 130, 8, 3); c.fill();
    c.fillStyle = '#9c6644';
    for (let k = 0; k < 5; k++) c.fillRect(x0 + W - 82, -26 - k * 26, 62 - k * 8, 11);
    // sofá e candeeiro em baixo
    c.fillStyle = '#4361ee'; rr(c, x0 + 34, -66, 104, 52, 8); c.fill();
    c.fillStyle = '#5a78f0'; rr(c, x0 + 42, -74, 88, 22, 7); c.fill();
    c.fillStyle = '#ced4da'; c.fillRect(x0 + 152, -70, 5, 70);
    c.fillStyle = '#ffd166';
    c.beginPath(); c.moveTo(x0 + 136, -70); c.lineTo(x0 + 174, -70); c.lineTo(x0 + 166, -98); c.lineTo(x0 + 144, -98); c.closePath(); c.fill();
    // cama lá em cima
    c.fillStyle = '#f8f9fa'; rr(c, x0 + 150, -CASA_ANDAR - 44, 120, 44, 6); c.fill();
    c.fillStyle = '#ff6fb1'; rr(c, x0 + 150, -CASA_ANDAR - 30, 120, 30, 6); c.fill();
    c.fillStyle = '#f8f9fa'; rr(c, x0 + 156, -CASA_ANDAR - 40, 34, 20, 5); c.fill();
    // prateleiras das coisas brilhantes
    for (const b of ca.brilhantes) {
      c.fillStyle = '#9c6644';
      c.fillRect(b.x - 26, b.y, 52, 7);
      brilhante(c, b, t);
    }
    // quem lá mora
    for (const m of ca.moradores) {
      c.save(); c.translate(m.x, m.y); c.scale(FIG * 0.92, FIG * 0.92);
      const festa = ca.festa > 0;
      boneco(c, m.def, { t: t, dir: -1, fase: 0, anda: false,
        braco: festa ? 0 : 0.5 + Math.sin(t * 4 + m.fase) * 0.4, cima: festa });
      c.restore();
      if (festa) G.gfx.star(c, m.x + 18, m.y - 96, 7, '#ffd166', t * 3);
    }
    // porta
    c.fillStyle = '#9c6644'; rr(c, ca.x - 34, -118, 68, 118, 6); c.fill();
    c.fillStyle = '#7f5539'; rr(c, ca.x - 26, -108, 52, 98, 4); c.fill();
    c.fillStyle = '#ffd166'; c.beginPath(); c.arc(ca.x + 18, -58, 5, 0, TAU); c.fill();
    // janelas: vidro inteiro, partido, ou a brilhar quando o ladrão o põe outra vez
    for (const j of ca.janelas) {
      c.fillStyle = '#f8f9fa'; rr(c, j.x - 7, j.y - 7, j.w + 14, j.h + 14, 6); c.fill();
      if (!j.partido) {
        c.fillStyle = 'rgba(189,224,254,.8)'; rr(c, j.x, j.y, j.w, j.h, 3); c.fill();
        c.fillStyle = 'rgba(255,255,255,.6)';
        c.beginPath();
        c.moveTo(j.x + 8, j.y + j.h - 8); c.lineTo(j.x + j.w * 0.5, j.y + 8);
        c.lineTo(j.x + j.w * 0.72, j.y + 8); c.lineTo(j.x + 20, j.y + j.h - 8); c.fill();
      } else {
        c.fillStyle = 'rgba(189,224,254,.75)';
        c.beginPath(); c.moveTo(j.x, j.y); c.lineTo(j.x + 28, j.y); c.lineTo(j.x, j.y + 32); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(j.x + j.w, j.y + j.h); c.lineTo(j.x + j.w - 24, j.y + j.h); c.lineTo(j.x + j.w, j.y + j.h - 28); c.closePath(); c.fill();
      }
      c.strokeStyle = '#dee2e6'; c.lineWidth = 5; rr(c, j.x, j.y, j.w, j.h, 3); c.stroke();
      if (j.brilho > 0) {
        for (let k = 0; k < 4; k++) {
          const a = t * 4 + k * 1.6;
          G.gfx.star(c, j.x + j.w / 2 + Math.cos(a) * 36, j.y + j.h / 2 + Math.sin(a) * 28, 6 * j.brilho, '#fff', a);
        }
      }
    }
    // chaminé (o telhado é a plataforma, desenhada a seguir)
    c.fillStyle = sombra(d.telhado, -0.15);
    rr(c, x0 + W - 92, -H - 52, 46, 54, 4); c.fill();
    c.fillStyle = sombra(d.telhado, -0.35); rr(c, x0 + W - 98, -H - 60, 58, 14, 4); c.fill();
  }

  function fonte(c, x, t) {
    c.fillStyle = '#8d99ae'; rr(c, x - 116, -58, 232, 58, 12); c.fill();
    c.fillStyle = 'rgba(102,193,231,.9)'; rr(c, x - 102, -46, 204, 38, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.4)';
    for (let k = 0; k < 4; k++) {
      const ox = Math.sin(t * 1.6 + k) * 10;
      c.fillRect(x - 84 + k * 50 + ox, -40, 26, 4);
    }
    c.fillStyle = '#ced4da'; rr(c, x - 15, -116, 30, 64, 7); c.fill();
    c.fillStyle = '#adb5bd'; c.beginPath(); c.ellipse(x, -116, 38, 11, 0, 0, TAU); c.fill();
    // repuxos de água
    for (let k = 0; k < 14; k++) {
      const f = ((t * 1.4 + k * 0.17) % 1);
      const lado = k % 2 ? 1 : -1;
      const px = x + lado * f * 74, py = -128 - Math.sin(f * Math.PI) * 54 + f * 16;
      c.fillStyle = 'rgba(160,220,255,' + (0.85 - f * 0.7) + ')';
      c.beginPath(); c.arc(px, py, 5 - f * 2, 0, TAU); c.fill();
    }
    c.fillStyle = 'rgba(255,255,255,.55)';
    c.beginPath(); c.ellipse(x, -128, 12, 6, 0, 0, TAU); c.fill();
  }

  function saco(c, l) {
    const dx = -(l.dirV || 1) * 17;
    c.fillStyle = '#a9743c';
    c.beginPath(); c.ellipse(l.x + dx, l.y - 54, 17, 20, 0, 0, TAU); c.fill();
    c.fillStyle = '#8b5a2b'; rr(c, l.x + dx - 7, l.y - 76, 14, 10, 4); c.fill();
    for (let k = 0; k < l.levados.length; k++) {
      G.gfx.star(c, l.x + dx + (k ? 12 : -12), l.y - 72 - k * 8, 6, '#ffd166', k * 2);
    }
  }

  function desenhaLadrao(c, l, t) {
    const parte = l.estado === 'parte', apanhado = l.estado === 'apanhado';
    const bom = l.estado === 'bom';
    c.save(); c.translate(l.x, l.y); c.scale(FIG, FIG);
    if (l.hitT > 0 && Math.floor(t * 30) % 2) c.globalAlpha = 0.6;
    boneco(c, l.def, {
      t: t, dir: l.dirV || 1, fase: l.fase, anda: Math.abs(l.vx) > 25,
      braco: parte ? (0.55 + Math.sin(t * 26) * 0.45) : (bom && l.t < 1.6 ? 0 : 0),
      cima: apanhado || (bom && l.t < 1.6), tonto: apanhado, noAr: !l.noChao
    });
    c.restore();
    if (l.levados.length && !apanhado && !bom) saco(c, l);
    if (!apanhado && !bom) {                     // bolinhas: quantos toques faltam
      const y = l.y - 100 * FIG;
      for (let i = 0; i < l.max; i++) {
        c.fillStyle = i < l.energia ? '#868e96' : 'rgba(255,255,255,.6)';
        c.strokeStyle = 'rgba(30,30,50,.6)'; c.lineWidth = 2;
        c.beginPath(); c.arc(l.x + (i - (l.max - 1) / 2) * 15, y, 5.5, 0, TAU); c.fill(); c.stroke();
      }
    }
    if (bom && l.t < 1.6) G.gfx.star(c, l.x + 20, l.y - 108, 8, '#ffd166', t * 3);
  }

  function desenhaCivil(c, p, t) {
    c.save(); c.translate(p.x, 0); c.scale(FIG * 0.95, FIG * 0.95);
    boneco(c, p.def, {
      t: t, dir: p.dirV || 1, fase: p.fase, anda: Math.abs(p.vx) > 15,
      braco: p.acena > 0 ? 0.55 + Math.sin(t * 9) * 0.45 : 0
    });
    c.restore();
    if (p.acena > 0.8) {
      c.fillStyle = 'rgba(255,255,255,.9)';
      c.beginPath(); c.arc(p.x + 26, -104, 13, 0, TAU); c.fill();
      G.gfx.label(c, '!', p.x + 26, -103, 18, '#4361ee', 'center', 'none');
    }
  }

  function balao(c, b, t) {
    const y = b.y + Math.sin(b.ph) * 12, cor = CORES_BALAO[b.premio];
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(b.x, y + 30);
    c.quadraticCurveTo(b.x + Math.sin(b.ph * 1.4) * 12, y + 58, b.x, y + 84); c.stroke();
    c.fillStyle = cor;
    c.beginPath(); c.ellipse(b.x, y, 23, 28, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(b.x - 6, y + 26); c.lineTo(b.x + 6, y + 26); c.lineTo(b.x, y + 34); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.45)';
    c.beginPath(); c.ellipse(b.x - 8, y - 10, 6, 9, -0.4, 0, TAU); c.fill();
    if (b.premio === 'coracao') G.gfx.heart(c, b.x, y + 1, 15, 'rgba(255,255,255,.9)');
    else if (b.premio === 'estrela') G.gfx.star(c, b.x, y, 10, 'rgba(255,255,255,.92)', 0);
    else {
      c.fillStyle = 'rgba(255,255,255,.9)';
      rr(c, b.x - 9, y - 4, 18, 11, 3); c.fill();
      c.beginPath(); c.ellipse(b.x, y - 4, 9, 4, 0, 0, TAU); c.fill();
    }
  }

  function coracao(c, cr, t) {
    const bob = Math.sin(t * 3 + cr.x * 0.02) * 4;
    G.gfx.heart(c, cr.x, cr.y + bob, 22, '#ff4d6d');
    c.fillStyle = 'rgba(255,255,255,.6)';
    c.beginPath(); c.ellipse(cr.x - 5, cr.y + bob - 7, 3, 4.5, -0.4, 0, TAU); c.fill();
  }

  function carroRua(c, car, t) {
    const d = car.def, w = d.w, h = d.h, cor = d.cor;
    c.save(); c.translate(car.x, 0); c.scale(car.dir, 1);
    c.fillStyle = 'rgba(0,0,0,.12)';
    c.beginPath(); c.ellipse(0, -4, w * 0.48, 7, 0, 0, TAU); c.fill();
    c.fillStyle = cor; rr(c, -w / 2, -h, w, h - 14, 8); c.fill();
    c.fillStyle = sombra(cor, -0.16);
    for (let k = -w / 2 + 12; k < w / 2 - 20; k += 27) { rr(c, k, -h - 8, 19, 9, 3); c.fill(); }
    c.fillStyle = '#bde0fe';
    if (d.tipo === 'autocarro') {
      for (let k = -w / 2 + 18; k < w / 2 - 36; k += 48) { rr(c, k, -h + 14, 36, 32, 5); c.fill(); }
    } else {
      rr(c, -w / 2 + 16, -h + 11, w * 0.32, h * 0.42, 5); c.fill();
      rr(c, 8, -h + 11, w * 0.28, h * 0.42, 5); c.fill();
    }
    if (car.passageiro) {                     // alguém que entrou no carro, à janela
      c.save();
      c.beginPath(); rr(c, -w / 2 + 16, -h + 11, w * 0.32, h * 0.42, 5); c.clip();
      cabecinha(c, car.passageiro, -w / 2 + 16 + w * 0.16, -h + 11 + h * 0.3, 0.8, t, {});
      c.restore();
    }
    if (d.tipo === 'taxi') {
      c.fillStyle = '#22223b'; rr(c, -16, -h - 20, 32, 13, 3); c.fill();
      c.fillStyle = '#ffd166'; rr(c, -13, -h - 17, 26, 7, 2); c.fill();
    }
    c.fillStyle = '#fff3b0'; rr(c, w / 2 - 11, -h * 0.45, 9, 9, 2); c.fill();
    c.fillStyle = '#e63946'; rr(c, -w / 2 + 3, -h * 0.45, 8, 9, 2); c.fill();
    for (const wx of [-w * 0.3, w * 0.3]) {           // rodas
      const ang = car.x * 0.05;
      c.fillStyle = '#22223b'; c.beginPath(); c.arc(wx, -15, 15, 0, TAU); c.fill();
      c.fillStyle = '#ced4da'; c.beginPath(); c.arc(wx, -15, 7, 0, TAU); c.fill();
      c.strokeStyle = '#8d93ab'; c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(wx + Math.cos(ang) * 6, -15 + Math.sin(ang) * 6);
      c.lineTo(wx - Math.cos(ang) * 6, -15 - Math.sin(ang) * 6);
      c.stroke();
    }
    c.restore();
  }

  function prisao(c, t) {
    const x = PRISAO_X, w = 460, h = 320, x0 = x - w / 2, y0 = -h;
    // paredes de tijolo cinzento
    c.fillStyle = '#8d99ae'; rr(c, x0, y0, w, h, 6); c.fill();
    c.strokeStyle = 'rgba(40,50,70,.18)'; c.lineWidth = 2;
    for (let r = 0; r < h / 28; r++) {
      const yy = y0 + r * 28;
      c.beginPath(); c.moveTo(x0, yy); c.lineTo(x0 + w, yy); c.stroke();
      for (let k = (r % 2) * 30; k < w; k += 60) { c.beginPath(); c.moveTo(x0 + k, yy); c.lineTo(x0 + k, yy + 28); c.stroke(); }
    }
    c.fillStyle = '#5c677d';
    for (let k = 0; k < w / 24; k++) { rr(c, x0 + k * 24 + 4, y0 - 7, 16, 9, 2); c.fill(); }
    // placa com o cadeado
    c.fillStyle = '#22223b'; rr(c, x - 110, y0 - 64, 220, 50, 12); c.fill();
    c.strokeStyle = '#ffd166'; c.lineWidth = 3; rr(c, x - 110, y0 - 64, 220, 50, 12); c.stroke();
    cadeado(c, x - 78, y0 - 39, 15, '#ffd166');
    G.gfx.label(c, 'PRISÃO', x + 14, y0 - 38, 28, '#ffd166', 'center', 'none');
    // seis celas com grades (quatro em cima, duas ao lado da porta); os presos aparecem lá dentro
    const cw = 90, ch = 78, gap = (w - 4 * cw) / 5;
    const celas = [];
    for (let i = 0; i < 4; i++) celas.push([x0 + gap + i * (cw + gap), y0 + 22]);
    celas.push([x0 + gap, y0 + 22 + ch + 26]);
    celas.push([x0 + w - gap - cw, y0 + 22 + ch + 26]);
    celas.forEach(function (q, idx) {
      const cx = q[0], cy = q[1];
      c.fillStyle = '#2b2d42'; rr(c, cx, cy, cw, ch, 6); c.fill();
      const v = presos[idx];
      if (v) {
        c.save(); rr(c, cx, cy, cw, ch, 6); c.clip();
        const e = 1.15 / (v.def.grande || 1);
        c.translate(cx + cw / 2, cy + 86 * (v.def.grande || 1) * e);
        c.scale(e, e);
        boneco(c, v.def, { t: t, dir: 1, fase: 0, anda: false, braco: 0, tonto: false, algemas: false, cima: Math.sin(t * 2 + idx) > 0.6 });
        c.restore();
      }
      c.strokeStyle = '#ced4da'; c.lineWidth = 4;
      for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(cx + k * cw / 5, cy); c.lineTo(cx + k * cw / 5, cy + ch); c.stroke(); }
    });
    // porta
    const dw = 96, dh = 128;
    c.fillStyle = '#3d405b'; rr(c, x - dw / 2, -dh, dw, dh, 10); c.fill();
    c.strokeStyle = '#adb5bd'; c.lineWidth = 4;
    for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(x - dw / 2 + k * dw / 4, -dh + 8); c.lineTo(x - dw / 2 + k * dw / 4, 0); c.stroke(); }
    // o polícia de guarda à porta, a acenar
    c.save(); c.translate(x + dw / 2 + 36, 0); c.scale(FIG, FIG);
    boneco(c, POLICIA, { t: t, dir: -1, fase: 0, anda: false, braco: 0.6 + Math.sin(t * 6) * 0.4 });
    c.restore();
  }

  function cadeado(c, x, y, s, cor) {
    c.strokeStyle = cor; c.lineWidth = s * 0.28;
    c.beginPath(); c.arc(x, y - s * 0.3, s * 0.5, Math.PI, 0); c.stroke();
    c.fillStyle = cor; rr(c, x - s * 0.8, y - s * 0.3, s * 1.6, s * 1.2, s * 0.25); c.fill();
    c.fillStyle = '#22223b'; c.beginPath(); c.arc(x, y + s * 0.2, s * 0.18, 0, TAU); c.fill();
  }

  function carroPolicia(c, car, t) {
    c.save(); c.translate(car.x, 0); c.scale(car.dir, 1);
    c.fillStyle = '#f8f9fa'; rr(c, -70, -52, 140, 36, 8); c.fill();
    c.fillStyle = '#1d3557'; c.fillRect(-70, -34, 140, 10);
    c.fillStyle = '#f8f9fa'; rr(c, -34, -84, 70, 34, 8); c.fill();
    c.fillStyle = '#bde0fe'; rr(c, -26, -78, 26, 22, 4); c.fill(); rr(c, 4, -78, 26, 22, 4); c.fill();
    if (car.preso) {                   // o vilão lá dentro, atrás do vidro
      c.save(); c.beginPath(); rr(c, -26, -78, 26, 22, 4); c.clip();
      cabecinha(c, car.preso.def, -13, -68, 0.9, t, {});
      c.restore();
    }
    // polícia ao volante
    c.save(); c.beginPath(); rr(c, 4, -78, 26, 22, 4); c.clip();
    cabecinha(c, POLICIA, 17, -68, 0.85, t, {});
    c.restore();
    const pisca = Math.floor(t * 6) % 2;
    c.fillStyle = pisca ? '#e63946' : '#4361ee'; rr(c, -18, -93, 16, 9, 3); c.fill();
    c.fillStyle = pisca ? '#4361ee' : '#e63946'; rr(c, 4, -93, 16, 9, 3); c.fill();
    c.fillStyle = '#ffd166'; c.fillRect(62, -46, 8, 8);
    const ang = car.x * 0.05;
    for (const wx of [-42, 42]) {
      c.fillStyle = '#22223b'; c.beginPath(); c.arc(wx, -14, 15, 0, TAU); c.fill();
      c.fillStyle = '#ced4da'; c.beginPath(); c.arc(wx, -14, 7, 0, TAU); c.fill();
      c.strokeStyle = '#6c757d'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(wx + Math.cos(ang) * 6, -14 + Math.sin(ang) * 6); c.lineTo(wx - Math.cos(ang) * 6, -14 - Math.sin(ang) * 6); c.stroke();
    }
    c.restore();
  }

  function pino(c, p, t) {
    if (!p.fixo && p.vida < 2 && Math.floor(t * 10) % 2) return;
    const cor = p.v >= 20 ? '#4cc9f0' : (p.v >= 5 ? '#ffd166' : '#dee2e6');
    const bob = p.fixo ? Math.sin(t * 3 + p.x * 0.02) * 3 : 0;
    const esp = Math.abs(Math.cos(t * 3 + p.x * 0.01));
    c.save(); c.translate(p.x, p.y + bob); c.scale(0.35 + esp * 0.65, 1);
    c.fillStyle = sombra(cor, -0.25); rr(c, -9, -4, 18, 11, 3); c.fill();
    c.fillStyle = cor; c.beginPath(); c.ellipse(0, -4, 9, 4, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(-5, -2, 3, 6);
    c.restore();
  }

  function tiroMau(c, t) {
    c.save(); c.translate(t.x, t.y);
    if (t.tipo === 'abobora') {
      c.rotate(t.rot);
      c.fillStyle = '#f77f00'; c.beginPath(); c.arc(0, 0, 13, 0, TAU); c.fill();
      c.fillStyle = '#3d2b1f'; c.fillRect(-2, -17, 4, 6);
      c.fillStyle = '#ffd60a';
      c.beginPath(); c.moveTo(-6, -3); c.lineTo(-2, -3); c.lineTo(-4, -7); c.fill();
      c.beginPath(); c.moveTo(6, -3); c.lineTo(2, -3); c.lineTo(4, -7); c.fill();
      c.fillRect(-6, 3, 12, 3);
    } else if (t.tipo === 'laser') {
      c.rotate(Math.atan2(t.vy, t.vx));
      c.fillStyle = 'rgba(255,45,45,.35)'; rr(c, -24, -7, 48, 14, 7); c.fill();
      c.fillStyle = '#ff5d5d'; rr(c, -20, -3.5, 40, 7, 3.5); c.fill();
    } else if (t.tipo === 'cubo') {
      c.rotate(t.rot);
      c.fillStyle = 'rgba(76,201,240,.35)'; c.fillRect(-15, -15, 30, 30);
      c.fillStyle = '#4cc9f0'; c.fillRect(-9, -9, 18, 18);
      c.fillStyle = '#caf0f8'; c.fillRect(-4, -4, 8, 8);
    } else if (t.tipo === 'bala') {        // as pistoladas dos vilões de carro
      c.rotate(Math.atan2(t.vy, t.vx));
      c.fillStyle = 'rgba(255,209,102,.35)'; rr(c, -22, -4, 22, 8, 4); c.fill();
      c.fillStyle = '#adb5bd'; rr(c, -7, -4, 12, 8, 4); c.fill();
      c.fillStyle = '#e8b923'; c.beginPath(); c.arc(5, 0, 4, 0, TAU); c.fill();
    } else if (t.tipo === 'gosma') {
      c.fillStyle = '#111';
      c.beginPath(); c.ellipse(0, 0, 14 + Math.sin(t.rot) * 2, 12 - Math.sin(t.rot) * 2, t.rot * 0.2, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(-4, -4, 3, 0, TAU); c.fill();
    } else {
      const g = c.createRadialGradient(0, 0, 2, 0, 0, 18);
      g.addColorStop(0, '#fff'); g.addColorStop(0.4, t.cor); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, 18, 0, TAU); c.fill();
    }
    c.restore();
  }

  function tiroBom(c, t) {
    c.save(); c.translate(t.x, t.y);
    if (t.tipo === 'raio') {
      c.rotate(Math.atan2(t.vy, t.vx));
      c.fillStyle = 'rgba(143,247,255,.4)'; rr(c, -30, -9, 60, 18, 9); c.fill();
      c.fillStyle = '#e8fdff'; rr(c, -24, -4, 48, 8, 4); c.fill();
    } else if (t.tipo === 'blaster') {     // os disparadores do carro de corrida
      c.rotate(Math.atan2(t.vy, t.vx));
      c.fillStyle = 'rgba(255,120,60,.45)'; rr(c, -34, -8, 58, 16, 8); c.fill();
      c.fillStyle = '#ffd166'; rr(c, -26, -4, 46, 8, 4); c.fill();
      c.fillStyle = '#fff'; rr(c, 4, -2, 16, 4, 2); c.fill();
    } else if (t.tipo === 'teia') {
      c.strokeStyle = '#fff'; c.lineWidth = 2.2;
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI;
        c.beginPath(); c.moveTo(Math.cos(a) * 13, Math.sin(a) * 13); c.lineTo(-Math.cos(a) * 13, -Math.sin(a) * 13); c.stroke();
      }
      c.beginPath(); c.arc(0, 0, 8, 0, TAU); c.stroke();
    } else if (t.tipo === 'escudo') {
      escudo(c, 0, 0, 17, t.t * 14);
    }
    c.restore();
  }

  function rodaCarro(c, x, y, r, ang) {
    c.fillStyle = '#22223b'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.fillStyle = '#ced4da'; c.beginPath(); c.arc(x, y, r * 0.45, 0, TAU); c.fill();
    c.strokeStyle = '#6c757d'; c.lineWidth = 2.2;
    for (const a of [ang, ang + Math.PI / 2]) {
      c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.4, y + Math.sin(a) * r * 0.4);
      c.lineTo(x - Math.cos(a) * r * 0.4, y - Math.sin(a) * r * 0.4); c.stroke();
    }
  }

  /* o carro de corrida dos Vingadores: baixinho, vermelho e dourado, com dois disparadores */
  function carroCorrida(c, t) {
    const car = corrida, h = heroi;
    const treme = car.bate > 0 ? Math.sin(t * 90) * 3 : 0;
    c.save(); c.translate(car.x + treme, car.y); c.scale(car.dir, 1);
    c.fillStyle = 'rgba(0,0,0,.14)';
    c.beginPath(); c.ellipse(0, -car.y - 3, 92, 8, 0, 0, TAU); c.fill();
    // asa de trás
    c.fillStyle = '#3d405b'; rr(c, -84, -64, 8, 30, 2); c.fill();
    c.fillStyle = '#c1121f'; rr(c, -100, -72, 38, 11, 4); c.fill();
    c.fillStyle = '#e8b923'; rr(c, -100, -64, 38, 3, 1); c.fill();
    // disparador de cima (por cima do capô) e o da ilharga
    c.fillStyle = '#6c757d'; rr(c, 24, -62, 54, 9, 4); c.fill();
    c.fillStyle = '#495057'; rr(c, 70, -63, 10, 11, 3); c.fill();
    // a carroçaria em cunha
    c.fillStyle = '#c1121f';
    c.beginPath();
    c.moveTo(-88, -18); c.lineTo(-88, -48); c.lineTo(-34, -54); c.lineTo(22, -50); c.lineTo(92, -28); c.lineTo(92, -16);
    c.closePath(); c.fill();
    c.fillStyle = sombra('#c1121f', -0.2); c.fillRect(-88, -24, 180, 8);
    c.fillStyle = '#e8b923'; c.fillRect(-88, -30, 178, 5);
    c.fillStyle = '#6c757d'; rr(c, 34, -42, 48, 8, 3); c.fill();
    c.fillStyle = '#495057'; rr(c, 76, -43, 10, 10, 3); c.fill();
    // pinos de Lego na traseira
    c.fillStyle = sombra('#c1121f', -0.12);
    for (let k = 0; k < 3; k++) { rr(c, -80 + k * 18, -59, 12, 6, 2); c.fill(); }
    // o "A" dos Vingadores na porta
    c.fillStyle = '#f8f9fa'; c.beginPath(); c.arc(-46, -38, 11, 0, TAU); c.fill();
    c.strokeStyle = '#1d3557'; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-52, -32); c.lineTo(-46, -45); c.lineTo(-40, -32); c.moveTo(-49, -37); c.lineTo(-43, -37); c.stroke();
    c.lineCap = 'butt';
    // quem vai lá dentro: o herói ao volante e o vilão algemado atrás
    c.fillStyle = '#22223b'; c.beginPath(); c.ellipse(-6, -51, 38, 9, 0, 0, TAU); c.fill();
    if (h.conduz) {
      if (h.carrega) cabecinha(c, h.carrega.def, -38, -64 + Math.sin(t * 9) * 1.5, 1.3, t, {});
      cabecinha(c, defHeroi(), 0, -68, 1.5, t, {});
    }
    c.fillStyle = 'rgba(189,224,254,.55)';
    c.beginPath(); c.moveTo(18, -51); c.lineTo(30, -50); c.lineTo(22, -72); c.lineTo(14, -72); c.closePath(); c.fill();
    c.fillStyle = '#fff3b0'; rr(c, 84, -30, 8, 7, 2); c.fill();
    // fogo dos disparadores
    if (car.fogo > 0) {
      const k = car.fogo / 0.12;
      c.fillStyle = 'rgba(255,209,102,' + k + ')';
      c.beginPath();
      if (car.lado) c.arc(90, -38, 10 * k + 4, 0, TAU); else c.arc(84, -57, 11 * k + 4, 0, TAU);
      c.fill();
    }
    rodaCarro(c, -56, -18, 19, car.roda);
    rodaCarro(c, 62, -16, 16, car.roda * 1.2);
    c.restore();
    // parado e o herói ao pé: seta a saltar a dizer "entra!"
    if (pertoDoCarro()) {
      const y = car.y - 110 + Math.sin(t * 6) * 6;
      c.fillStyle = '#ffd166'; c.strokeStyle = '#22223b'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(car.x - 14, y); c.lineTo(car.x + 14, y); c.lineTo(car.x, y + 18); c.closePath(); c.fill(); c.stroke();
    }
  }

  /* o carro (ou a mota do Venom) de um vilão, com ele lá sentado de pistola na mão */
  function veiculoMau(c, v, t) {
    const ve = v.veiculo, vd = ve.def, k = vd.grande || 1, dir = v.dirV || v.dir;
    const treme = ve.hitT > 0 ? Math.sin(t * 80) * 3 : 0;
    const mota = vd.tipo === 'mota';
    c.save(); c.translate(v.x + treme, v.y);
    c.fillStyle = 'rgba(0,0,0,.14)';
    c.beginPath(); c.ellipse(0, -v.y - 3, 82 * k, 7, 0, 0, TAU); c.fill();
    // o vilão sentado (as pernas ficam escondidas pela carroçaria)
    c.save(); c.translate(-dir * (mota ? 4 : 14) * k, (mota ? -34 : -26) * k); c.scale(FIG, FIG);
    boneco(c, v.def, { t: t, dir: dir, fase: 0, anda: false, braco: v.atira ? 1 : 0.5, brilho: v.def.id === 'thanos' && v.atira > 0 });
    c.restore();
    c.scale(dir * k, k);
    // a pistola, sempre virada para a frente
    c.fillStyle = '#495057'; rr(c, 22, -82, 26, 7, 2); c.fill(); rr(c, 24, -78, 7, 12, 2); c.fill();
    if (v.atira > 0.35) { c.fillStyle = '#ffd166'; c.beginPath(); c.arc(52, -79, 7, 0, TAU); c.fill(); }
    const ang = v.x * 0.06;
    if (mota) {
      c.fillStyle = vd.cor; rr(c, -44, -48, 88, 20, 9); c.fill();
      c.fillStyle = vd.enfeite; rr(c, -30, -42, 34, 5, 2); c.fill();
      c.strokeStyle = '#6c757d'; c.lineWidth = 5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(30, -44); c.lineTo(40, -70); c.lineTo(30, -74); c.stroke();
      c.lineCap = 'butt';
      c.fillStyle = '#fff3b0'; rr(c, 40, -46, 8, 8, 2); c.fill();
      rodaCarro(c, -40, -17, 17, ang);
      rodaCarro(c, 42, -17, 17, ang);
    } else {
      c.fillStyle = vd.cor;
      c.beginPath();
      c.moveTo(-80, -18); c.lineTo(-80, -56); c.lineTo(-30, -56); c.lineTo(10, -50); c.lineTo(80, -42); c.lineTo(80, -18);
      c.closePath(); c.fill();
      c.fillStyle = sombra(vd.cor, -0.22); c.fillRect(-80, -26, 160, 8);
      // picos no capô (são vilões, os carros deles são maus... mas de Lego)
      c.fillStyle = vd.enfeite;
      for (let i = 0; i < 3; i++) {
        c.beginPath(); c.moveTo(24 + i * 18, -48 + i * 1.5); c.lineTo(31 + i * 18, -60 + i * 1.5); c.lineTo(38 + i * 18, -46 + i * 1.5); c.closePath(); c.fill();
      }
      c.fillStyle = sombra(vd.cor, -0.1);
      for (let i = 0; i < 3; i++) { rr(c, -74 + i * 17, -61, 11, 6, 2); c.fill(); }
      c.fillStyle = 'rgba(189,224,254,.5)';
      c.beginPath(); c.moveTo(8, -52); c.lineTo(18, -51); c.lineTo(10, -74); c.lineTo(2, -74); c.closePath(); c.fill();
      c.fillStyle = '#fff3b0'; rr(c, 72, -40, 8, 8, 2); c.fill();
      rodaCarro(c, -50, -17, 17, ang);
      rodaCarro(c, 52, -17, 17, ang);
    }
    c.restore();
    // quadradinhos por cima: quantas peças faltam para o carro se desfazer
    const y = v.y - 30 * k - altura(v.def) - 18;
    for (let i = 0; i < ve.max; i++) {
      const x = v.x + (i - (ve.max - 1) / 2) * 17;
      c.fillStyle = i < ve.hp ? vd.cor : 'rgba(255,255,255,.6)';
      c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2;
      rr(c, x - 6.5, y - 6.5, 13, 13, 3); c.fill(); c.stroke();
    }
  }

  function desenhaVilao(c, v, t) {
    if (v.veiculo && v.estado === 'livre') { veiculoMau(c, v, t); return; }
    if (v.estado === 'preso' || v.estado === 'carro' || v.estado === 'levado') return;
    const d = v.def;
    c.save(); c.translate(v.x, v.y); c.scale(FIG, FIG);
    if (v.hitT > 0 && Math.floor(t * 30) % 2) c.globalAlpha = 0.55;
    const livre = v.estado === 'livre';
    boneco(c, d, {
      t: t, dir: v.dirV || v.dir, fase: v.fase, anda: livre && Math.abs(v.vx) > 20 && !d.voa, braco: v.atira ? 1 : 0,
      tonto: !livre, algemas: !livre, noAr: livre && !v.noChao && !d.voa,
      prancha: d.prancha && livre, jato: d.jato && livre ? 0.8 : 0, brilho: d.id === 'thanos' && v.atira > 0
    });
    if (v.teia > 0 && livre) {              // teia do Homem-Aranha agarrada
      c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1;
      for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(-14, -20 - k * 9); c.lineTo(14, -24 - k * 8); c.stroke(); }
      c.beginPath(); c.moveTo(-12, -60); c.lineTo(10, -10); c.stroke();
      c.beginPath(); c.moveTo(12, -60); c.lineTo(-10, -12); c.stroke();
    }
    c.restore();
    // bolinhas de energia por cima (quantos toques faltam)
    if (livre) {
      const k = d.grande || 1, y = v.y - 98 * FIG * k;
      for (let i = 0; i < v.max; i++) {
        const x = v.x + (i - (v.max - 1) / 2) * 15;
        c.fillStyle = i < v.energia ? d.cor : 'rgba(255,255,255,.6)';
        c.strokeStyle = 'rgba(30,30,50,.6)'; c.lineWidth = 2;
        c.beginPath(); c.arc(x, y, 5.5, 0, TAU); c.fill(); c.stroke();
      }
    } else if (v.estado === 'algemado' && !v.arco) {
      // seta a saltar: "pega nele!"
      const y = v.y - 118 * FIG * (d.grande || 1) + Math.sin(t * 6) * 6;
      c.fillStyle = '#ffd166'; c.strokeStyle = '#22223b'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(v.x - 12, y); c.lineTo(v.x + 12, y); c.lineTo(v.x, y + 16); c.closePath(); c.fill(); c.stroke();
    }
  }

  function desenhaHeroi(c, t) {
    const h = heroi, d = defHeroi();
    if (h.conduz) return;              // vai dentro do carro de corrida (desenhado lá)
    c.save(); c.translate(h.x, h.y); c.scale(FIG, FIG);
    if (h.invul > 0 && !h.desmonta && Math.floor(t * 14) % 2) c.globalAlpha = 0.45;
    if (h.trocaT > 0) {
      const k = h.trocaT / 0.45;
      c.fillStyle = 'rgba(255,209,102,' + (k * 0.6) + ')';
      c.beginPath(); c.arc(0, -40, 50 * (1.4 - k), 0, TAU); c.fill();
    }
    const escudoFora = tiros.some(function (x) { return x.tipo === 'escudo'; });
    boneco(c, d, {
      t: t, dir: h.dir, fase: h.fase, anda: h.noChao && Math.abs(h.vx) > 30, braco: h.braco,
      noAr: !h.noChao, cima: !!h.carrega, partes: h.desmonta ? h.desmonta.partes : null,
      jato: h.jato, semEscudo: escudoFora
    });
    c.restore();
    if (descanso) {                    // a dormir: Zzz por cima da cabeça
      for (let k = 0; k < 3; k++) {
        const a = (t * 1.4 + k * 0.6) % 2;
        c.globalAlpha = Math.max(0, 1 - a / 2);
        G.gfx.label(c, 'z', h.x + 26 + a * 20, h.y - altura(d) - 10 - a * 34, 20 + k * 6, '#4361ee', 'center');
      }
      c.globalAlpha = 1;
    }
    if (h.carrega) {                   // o vilão algemado ao colo, por cima da cabeça
      const v = h.carrega;
      c.save();
      c.translate(h.x, h.y - altura(d) - 6 + Math.sin(t * 8) * 2);
      c.rotate(Math.PI / 2 * -h.dir * 0.9);
      c.scale(FIG * 0.85, FIG * 0.85);
      c.translate(0, 36);
      boneco(c, v.def, { t: t, dir: 1, fase: 0, anda: false, braco: 0, tonto: true, algemas: true });
      c.restore();
    }
  }

  /* as três linhas do HUD: vilões, corações e as caras dos heróis (tocáveis) */
  function hudLayout() {
    const W = G.W, pequeno = Math.min(W, G.H) < 480;
    const lado = pequeno ? 34 : 42, gap = 6, n = 6;
    const tot = n * lado + (n - 1) * gap;
    const cs = pequeno ? 13 : 16, corW = cs * 11;
    const r = pequeno ? 19 : 24, y0 = 12;
    // em ecrãs baixos (telemóvel deitado) os corações vão para o LADO dos vilões: com
    // três linhas o HUD comia um terço do ecrã e não sobrava jogo
    const lado_a_lado = G.H < 520 && W > tot + corW + 300;
    const total = lado_a_lado ? tot + 18 + corW : tot;
    const x0 = Math.max(10, Math.min(W / 2 - total / 2, W - 132 - total));
    const cy = lado_a_lado ? y0 + lado / 2 : y0 + lado + cs + (pequeno ? 6 : 8);
    const cx = lado_a_lado ? x0 + tot + 18 + corW / 2 : x0 + tot / 2;
    return {
      lado: lado, gap: gap, tot: tot, x0: x0, y0: y0, cs: cs, cy: cy, cx: cx, r: r,
      caraY: (lado_a_lado ? y0 + lado + 12 : cy + cs + (pequeno ? 12 : 16)) + r
    };
  }
  // caras dos heróis lá em cima (para trocar com um toque)
  function caraRect() {
    const L = hudLayout();
    return { r: L.r, y: L.caraY, x: function (k) { return 16 + L.r + k * (L.r * 2 + 10); } };
  }

  function medalha(c, x, y, r) {
    c.fillStyle = '#ffd166'; c.strokeStyle = '#b56b00'; c.lineWidth = 2;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.stroke();
    G.gfx.star(c, x, y, r * 0.62, '#fff8e1', 0);
  }
  function trofeu(c, x, y, k) {
    c.save(); c.translate(x, y); c.scale(k, k);
    c.fillStyle = '#ffd166'; c.strokeStyle = '#b56b00'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(-10, -12); c.lineTo(10, -12); c.quadraticCurveTo(9, 4, 0, 6);
    c.quadraticCurveTo(-9, 4, -10, -12); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.arc(-11, -8, 4.5, 0.6, 4.2); c.stroke();
    c.beginPath(); c.arc(11, -8, 4.5, -1.1, 2.5); c.stroke();
    c.fillRect(-2.5, 5, 5, 6); rr(c, -7, 10, 14, 4, 1.5); c.fill(); c.stroke();
    c.restore();
  }

  function hud(c, t) {
    const W = G.W, L = hudLayout();
    // os seis vilões: cara normal enquanto andam à solta, atrás das grades quando presos
    const lado = L.lado, gap = L.gap, tot = L.tot, x0 = L.x0, y0 = L.y0;
    c.fillStyle = 'rgba(34,34,59,.55)'; rr(c, x0 - 8, y0 - 6, tot + 16, lado + 12, 12); c.fill();
    viloes.forEach(function (v, i) {
      const x = x0 + i * (lado + gap);
      const preso = v.estado === 'preso';
      c.fillStyle = preso ? '#495057' : '#f1f3f5'; rr(c, x, y0, lado, lado, 8); c.fill();
      cabecinha(c, v.def, x + lado / 2, y0 + lado * 0.54, lado / 26 / (v.def.id === 'loki' ? 1.35 : 1), t, {});
      if (preso) {
        c.strokeStyle = '#ced4da'; c.lineWidth = 3;
        for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(x + k * lado / 4, y0 + 2); c.lineTo(x + k * lado / 4, y0 + lado - 2); c.stroke(); }
      } else if (v.estado !== 'livre') {
        cadeado(c, x + lado - 8, y0 + lado - 8, 7, '#ffd166');
      }
    });
    // corações: cinco, e cada tiro tira meio
    for (let i = 0; i < MAX_VIDAS; i++) {
      const hx = L.cx + (i - (MAX_VIDAS - 1) / 2) * (L.cs * 2.2), sobra = vidas - i;
      G.gfx.heart(c, hx, L.cy, L.cs, 'rgba(255,255,255,.55)');
      if (sobra >= 1) G.gfx.heart(c, hx, L.cy, L.cs, '#ff4d6d');
      else if (sobra >= 0.5) {
        c.save();
        c.beginPath(); c.rect(hx - L.cs - 2, L.cy - L.cs * 1.4, L.cs + 2, L.cs * 2.6); c.clip();
        G.gfx.heart(c, hx, L.cy, L.cs, '#ff4d6d');
        c.restore();
      }
    }
    // heróis (com a medalha de quem já ganhou uma ronda)
    const q = caraRect();
    HEROIS.forEach(function (d, k) {
      const x = q.x(k), sel = k === hi;
      c.fillStyle = sel ? '#ffd166' : 'rgba(255,255,255,.6)';
      c.beginPath(); c.arc(x, q.y, q.r + (sel ? 4 : 0), 0, TAU); c.fill();
      c.strokeStyle = sel ? '#b56b00' : 'rgba(34,34,59,.35)'; c.lineWidth = 2.5; c.stroke();
      cabecinha(c, d, x, q.y + 3, q.r / 15 / (d.grande || 1) * (d.id === 'hulk' ? 1.2 : 1), t, {});
      if (medalhas[d.id]) medalha(c, x + q.r * 0.72, q.y + q.r * 0.74, q.r * 0.42);
    });
    if (ganhouTudo) trofeu(c, q.x(HEROIS.length) + 6, q.y, q.r / 15);
    // pinos e estrelas, à direita, na mesma linha das caras
    const px = W - 18;
    G.gfx.label(c, '' + contaPinos, px, q.y - 6, 24, '#495057', 'right');
    c.save(); c.translate(px - 18 - String(contaPinos).length * 14, q.y - 6);
    c.fillStyle = '#adb5bd'; rr(c, -9, -3, 18, 10, 3); c.fill();
    c.fillStyle = '#dee2e6'; c.beginPath(); c.ellipse(0, -3, 9, 4, 0, 0, TAU); c.fill();
    c.restore();
    G.gfx.star(c, px - 60, q.y + 22, 10, '#ffd166', 0);
    G.gfx.label(c, '' + G.state.stars, px - 44, q.y + 23, 18, '#b56b00');
  }

  // setas nas bordas para os vilões que não se veem (e para a prisão, quando se leva alguém)
  function setas(c, t) {
    const W = G.W, sc = escala(), cp = chaoPx();
    const alvos = [];
    for (const v of viloes) if (v.estado === 'livre' || v.estado === 'algemado') alvos.push({ x: v.x, y: v.y - 50, v: v });
    if (heroi.carrega) alvos.unshift({ x: PRISAO_X, y: -100, prisao: true });
    const usados = { e: [], d: [] };        // setas do mesmo lado não se tapam umas às outras
    for (const a of alvos) {
      const sx = (a.x - cam.x) * sc;
      if (sx > -10 && sx < W + 10) continue;
      const esq = sx < 0;
      // nunca por cima dos botões (◀ ▶ 🦸 em baixo à esquerda, ⬆ ⚡ à direita): em ecrãs
      // baixinhos (telemóvel deitado) não há altura livre nas bordas, e a seta passa
      // para dentro da coluna dos botões
      const baixo = G.H < 520;
      const x = esq ? (baixo ? 142 : 34) : W - (baixo ? 142 : 34);
      const y0 = baixo ? clamp(cp + (a.y - cam.y) * sc, 150, cp - 34)
        : clamp(cp + (a.y - cam.y) * sc, 176, Math.max(176, Math.min(cp - 40, G.H - (portaVisivel && G.W <= 560 ? 340 : 244))));
      let y = y0;
      const lista = usados[esq ? 'e' : 'd'];
      for (let tent = 0; tent < 6 && lista.some(function (u) { return Math.abs(u - y) < 48; }); tent++) y -= 48;
      lista.push(y);
      const bob = Math.sin(t * 5) * 4 * (esq ? -1 : 1);
      c.fillStyle = a.prisao ? '#22223b' : 'rgba(255,255,255,.85)';
      c.beginPath(); c.arc(x + bob, y, 22, 0, TAU); c.fill();
      c.strokeStyle = a.prisao ? '#ffd166' : '#e63946'; c.lineWidth = 3; c.stroke();
      c.fillStyle = a.prisao ? '#ffd166' : '#e63946';
      c.beginPath();
      const ax = x + bob + (esq ? -26 : 26);
      c.moveTo(ax + (esq ? -10 : 10), y); c.lineTo(ax, y - 9); c.lineTo(ax, y + 9); c.closePath(); c.fill();
      if (a.prisao) cadeado(c, x + bob, y + 2, 11, '#ffd166');
      else cabecinha(c, a.v.def, x + bob, y + 2, 1.05 / (a.v.def.id === 'loki' ? 1.3 : 1), t, {});
    }
  }

  S.draw = function (c, t) {
    const sc = escala(), cp = chaoPx();
    fundo(c, t);
    c.save();
    c.translate(-cam.x * sc, cp - cam.y * sc);
    c.scale(sc, sc);
    const x0 = cam.x - 200, x1 = cam.x + vistaW() + 200;
    rua(c, t);
    if (TORRE_X + 420 > x0 && TORRE_X - 420 < x1) torre(c, t);
    if (REST_X + 420 > x0 && REST_X - 420 < x1) restaurante(c, t);
    for (const f of FONTES) if (f + 220 > x0 && f - 220 < x1) fonte(c, f, t);
    for (const ca of casas) if (ca.x + 260 > x0 && ca.x - 260 < x1) casa(c, ca, t);
    for (const p of PLAT) if (p.x + p.w > x0 && p.x < x1) plataforma(c, p);
    if (TORRE_X + 420 > x0 && TORRE_X - 420 < x1) torreTopo(c, t);
    if (PRISAO_X + 300 > x0 && PRISAO_X - 300 < x1) prisao(c, t);
    for (const p of pinos) if (p.x > x0 && p.x < x1) pino(c, p, t);
    for (const cr of coracoes) if (cr.x > x0 && cr.x < x1) coracao(c, cr, t);
    for (const b of baloes) if (b.x > x0 && b.x < x1) balao(c, b, t);
    for (const car of transito) if (car.x > x0 - 300 && car.x < x1 + 300) carroRua(c, car, t);
    for (const car of carros) carroPolicia(c, car, t);
    if (corrida.x > x0 - 200 && corrida.x < x1 + 200) carroCorrida(c, t);
    for (const p of civis) if (p.x > x0 - 100 && p.x < x1 + 100) desenhaCivil(c, p, t);
    for (const l of ladroes) if (l.x > x0 - 100 && l.x < x1 + 100) desenhaLadrao(c, l, t);
    for (const v of viloes) if (v.x > x0 - 100 && v.x < x1 + 100) desenhaVilao(c, v, t);
    desenhaHeroi(c, t);
    if (vitoria) {                     // os outros heróis vêm festejar à porta da prisão
      HEROIS.forEach(function (d, k) {
        if (k === hi) return;
        const j = k < hi ? k : k - 1;
        const x = PRISAO_X - 330 + j * 90 + (j >= 2 ? 480 : 0);
        c.save(); c.translate(x, -Math.abs(Math.sin(t * 5 + k)) * 40); c.scale(FIG, FIG);
        boneco(c, d, { t: t, dir: x < PRISAO_X ? 1 : -1, fase: 0, cima: true, noAr: true });
        c.restore();
      });
    }
    for (const tr of tiros) tiroBom(c, tr);
    for (const tr of tirosMaus) tiroMau(c, tr);
    for (const r of raios) {
      c.strokeStyle = 'rgba(189,224,254,' + (1 - r.t / 0.28) + ')'; c.lineWidth = 9; c.lineJoin = 'round';
      c.beginPath(); r.seg.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke();
    }
    for (const o of ondas) {
      c.strokeStyle = 'rgba(201,173,167,' + (1 - o.t / 0.5) + ')'; c.lineWidth = 10;
      c.beginPath(); c.ellipse(o.x, o.y, 40 + o.t * 560, 16 + o.t * 40, 0, Math.PI, TAU); c.stroke();
    }
    for (const f of fx) {
      c.globalAlpha = Math.max(0, 1 - f.t / f.vida);
      c.fillStyle = f.cor;
      if (f.tijolo) { rr(c, f.x - f.tam, f.y - f.tam * 0.6, f.tam * 2, f.tam * 1.2, 2); c.fill(); }
      else { c.beginPath(); c.arc(f.x, f.y, f.tam * 0.6, 0, TAU); c.fill(); }
    }
    c.globalAlpha = 1;
    c.restore();
    setas(c, t);
    hud(c, t);
  };

  S.debug = function () {
    return {
      heroi: defHeroi().id, x: Math.round(heroi.x), y: Math.round(heroi.y), chao: heroi.noChao,
      desmonta: !!heroi.desmonta, carrega: heroi.carrega ? heroi.carrega.def.id : null,
      viloes: viloes.map(function (v) { return v.def.id + ':' + v.estado + ':' + v.energia + '@' + Math.round(v.x) + ',' + Math.round(v.y); }),
      presos: presos.length, carros: carros.map(function (k) { return k.estado + '@' + Math.round(k.x) + (k.preso ? '+' + k.preso.def.id : ''); }), tiros: tiros.length, tirosMaus: tirosMaus.length,
      pinos: contaPinos, ronda: ronda, vitoria: !!vitoria, vidas: vidas,
      medalhas: Object.keys(medalhas).filter(function (k) { return medalhas[k]; }), ganhouTudo: ganhouTudo,
      descanso: !!descanso, baloes: baloes.length, transito: transito.length,
      ladroes: ladroes.map(function (l) { return l.estado + (l.levados.length ? '+' + l.levados.length : ''); }),
      civis: civis.length,
      vidros: casas.reduce(function (n, ca) { return n + ca.janelas.filter(function (j) { return j.partido; }).length; }, 0),
      roubados: casas.reduce(function (n, ca) { return n + ca.brilhantes.filter(function (b) { return b.levado; }).length; }, 0),
      coracoes: coracoes.length, emCima: !!heroi.carroApoio,
      conduz: heroi.conduz, corrida: Math.round(corrida.x) + ':' + Math.round(corrida.vx),
      veiculos: viloes.filter(function (v) { return v.veiculo; }).map(function (v) { return v.def.id + ':' + v.veiculo.hp; }),
      comida: comidas.filter(function (k) { return k.pronto; }).length, camX: Math.round(cam.x), camY: Math.round(cam.y)
    };
  };
  // para testes: pôr o herói num sítio e mexer nos vilões
  S.api = {
    heroi: function () { return heroi; }, viloes: function () { return viloes; },
    corrida: function () { return corrida; },
    troca: trocaHeroi, prisaoX: PRISAO_X,
    boneco: boneco, herois: HEROIS, viloesDef: VILOES, policia: POLICIA,
    mundo: function () { return { transito: transito, baloes: baloes, comidas: comidas, coracoes: coracoes,
      casas: casas, ladroes: ladroes, civis: civis }; },
    vidas: function (v) { if (v !== undefined) vidas = v; return vidas; },
    medalhas: function () { return medalhas; }
  };

  G.scenes = G.scenes || {};
  G.scenes.marvel = S;
  // os bonecos de Lego também servem ao jogo dos MAUZÕES (js/mauzoes.js)
  G.legoBoneco = boneco;
  G.legoCabecinha = cabecinha;
})();
