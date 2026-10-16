/* Input unificado: touch (arrastar + botões grandes) e teclado. */
(function () {
  window.G = window.G || {};
  const I = {
    held: {}, just: {},
    drag: { on: false, id: null, sx: 0, sy: 0, dx: 0, dy: 0, touch: false }
  };

  function press(name) { if (!I.held[name]) I.just[name] = true; I.held[name] = true; }
  function release(name) { I.held[name] = false; }

  const KEYS = {
    ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right',
    ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down',
    ' ': 'fire', b: 'horn', B: 'horn', '9': 'debug9',
    v: 'chama', V: 'chama', f: 'campo', F: 'campo'
  };

  window.addEventListener('keydown', function (e) {
    const n = KEYS[e.key];
    if (n) { press(n); e.preventDefault(); }
  });
  window.addEventListener('keyup', function (e) {
    const n = KEYS[e.key];
    if (n) release(n);
  });

  // Botões táteis (pointer events funcionam para rato e dedo).
  function bindBtn(id, name) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('pointerdown', function (e) { e.preventDefault(); press(name); });
    el.addEventListener('pointerup', function (e) { e.preventDefault(); release(name); });
    el.addEventListener('pointercancel', function () { release(name); });
    el.addEventListener('pointerleave', function () { release(name); });
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  I.bind = function () {
    bindBtn('btnFire', 'fire');
    bindBtn('btnHorn', 'horn');
    bindBtn('btnLeft', 'left');
    bindBtn('btnRight', 'right');
    bindBtn('btnJump', 'jump');
    bindBtn('btnGas', 'gas');
    bindBtn('btnBrake', 'brake');
    bindBtn('btnDoor', 'door');
    bindBtn('btnRoad', 'road');
    bindBtn('btnChama', 'chama');
    bindBtn('btnCampo', 'campo');

    const cv = document.getElementById('game');
    cv.addEventListener('pointerdown', function (e) {
      I.tap = { x: e.clientX, y: e.clientY };
      if (I.drag.on) return;
      I.drag.on = true; I.drag.id = e.pointerId;
      I.drag.sx = e.clientX; I.drag.sy = e.clientY;
      I.drag.dx = 0; I.drag.dy = 0;
      I.drag.touch = e.pointerType !== 'mouse';
    });
    window.addEventListener('pointermove', function (e) {
      if (I.drag.on && e.pointerId === I.drag.id) {
        I.drag.dx = e.clientX - I.drag.sx;
        I.drag.dy = e.clientY - I.drag.sy;
      }
    });
    function endDrag(e) {
      if (I.drag.on && e.pointerId === I.drag.id) {
        I.drag.on = false; I.drag.dx = 0; I.drag.dy = 0;
      }
    }
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    window.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    // se o jogo for para segundo plano (notificação, trocar de app) a meio de um
    // toque, o "largar" nunca chega: larga-se tudo para nada ficar preso a andar
    function largaTudo() {
      I.held = {};
      I.drag.on = false; I.drag.dx = 0; I.drag.dy = 0;
    }
    window.addEventListener('blur', largaTudo);
    window.addEventListener('pagehide', largaTudo);
    document.addEventListener('visibilitychange', function () { if (document.hidden) largaTudo(); });
  };

  // Nos jogos com setas ◀ ▶ no ecrã, um dedo pousado no jogo NÃO serve de joystick:
  // no telemóvel a mão da criança pousava no ecrã, escorregava um bocadinho e o boneco
  // não parava de andar (Egito). Com o rato (computador) continua a dar para arrastar.
  const setas = document.getElementById('btnLeft');
  function arrastoConta() {
    if (!I.drag.on) return false;
    if (!I.drag.touch) return true;
    return !(setas && setas.getClientRects().length);
  }

  // Eixo -1..1 combinando teclado e arrasto (joystick virtual generoso).
  I.axis = function () {
    let x = 0, y = 0;
    if (I.held.left) x -= 1;
    if (I.held.right) x += 1;
    if (I.held.up) y -= 1;
    if (I.held.down) y += 1;
    if (arrastoConta()) {
      x += Math.max(-1, Math.min(1, I.drag.dx / 70));
      y += Math.max(-1, Math.min(1, I.drag.dy / 70));
    }
    return { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
  };

  I.justPressed = function (n) { return !!I.just[n]; };
  I.isHeld = function (n) { return !!I.held[n]; };
  I.endFrame = function () { I.just = {}; I.tap = null; };

  G.input = I;
})();
