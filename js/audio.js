/* Sons sintetizados com WebAudio — sem ficheiros de áudio. */
(function () {
  window.G = window.G || {};
  const A = { ctx: null, on: true, musicStep: 0, musicTimer: null };

  A.init = function () {
    if (A.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    A.ctx = new AC();
    A.master = A.ctx.createGain();
    A.master.gain.value = 0.5;
    A.master.connect(A.ctx.destination);
    A.on = localStorage.getItem('isaacSound') !== '0';
    A.startMusic();
  };

  A.resume = function () { if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume(); };

  function beep(freq, dur, type, vol, slide, delay) {
    if (!A.ctx || !A.on) return;
    const t0 = A.ctx.currentTime + (delay || 0);
    const o = A.ctx.createOscillator();
    const g = A.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.25, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(A.master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  function puff(dur, vol, delay) { // vapor / ar
    if (!A.ctx || !A.on) return;
    const t0 = A.ctx.currentTime + (delay || 0);
    const n = Math.floor(A.ctx.sampleRate * dur);
    const buf = A.ctx.createBuffer(1, n, A.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = A.ctx.createBufferSource();
    src.buffer = buf;
    const f = A.ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 1400;
    const g = A.ctx.createGain();
    g.gain.value = vol || 0.12;
    src.connect(f); f.connect(g); g.connect(A.master);
    src.start(t0);
  }

  A.sfx = function (n) {
    switch (n) {
      case 'pew':   beep(900, 0.16, 'square', 0.10, -520); break;
      case 'horn':  beep(392, 0.16, 'sawtooth', 0.22); beep(392, 0.2, 'sawtooth', 0.22, 0, 0.22); break;
      case 'star':  beep(1100, 0.1, 'sine', 0.18, 250); beep(1500, 0.14, 'sine', 0.14, 250, 0.07); break;
      case 'heart': beep(660, 0.12, 'sine', 0.2); beep(880, 0.2, 'sine', 0.2, 0, 0.12); break;
      case 'ouch':  beep(320, 0.28, 'triangle', 0.24, -140); break;
      case 'whee':  beep(480, 0.8, 'sine', 0.18, 720); break;
      case 'boing': beep(180, 0.35, 'sine', 0.28, 260); break;
      case 'melt':  puff(0.5, 0.14); beep(950, 0.45, 'sine', 0.1, -650); break;
      case 'brrr':  beep(170, 0.07, 'square', 0.12); beep(160, 0.07, 'square', 0.12, 0, 0.09); beep(150, 0.07, 'square', 0.12, 0, 0.18); break;
      case 'pop':   beep(520, 0.08, 'sine', 0.2, 260); break;
      case 'tada':  [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.22, 'triangle', 0.2, 0, i * 0.12)); break;
      case 'suit':  [784, 988, 1175, 1568].forEach((f, i) => beep(f, 0.2, 'triangle', 0.18, 0, i * 0.1)); break;
      case 'giggle': beep(700, 0.08, 'sine', 0.14, 200); beep(900, 0.08, 'sine', 0.14, 200, 0.1); break;
      case 'whoosh': puff(0.35, 0.16); beep(300, 0.5, 'sawtooth', 0.07, 420); break;
      case 'vroom': beep(120, 0.3, 'sawtooth', 0.2, 60); beep(160, 0.28, 'sawtooth', 0.18, 90, 0.2); puff(0.3, 0.1, 0.05); break;
      case 'hop': beep(420, 0.16, 'sine', 0.18, 260); break;
      case 'kick': puff(0.12, 0.22); beep(150, 0.12, 'triangle', 0.3, -50); break;
      case 'whistle': beep(2300, 0.11, 'square', 0.1); beep(2300, 0.26, 'square', 0.1, 250, 0.16); break;
      case 'beep': beep(680, 0.09, 'square', 0.13); beep(680, 0.1, 'square', 0.13, 0, 0.13); break;
      case 'door': puff(0.09, 0.12); beep(230, 0.09, 'triangle', 0.25, -80); break;
      case 'sirene': [0, 1, 2, 3].forEach(function (i) { beep(i % 2 ? 660 : 880, 0.22, 'square', 0.11, 0, i * 0.24); }); break;
      case 're': beep(1150, 0.11, 'square', 0.07); break;   // "bip" da marcha atrás
      case 'splash': puff(0.4, 0.2); beep(300, 0.3, 'sine', 0.16, 620); beep(170, 0.24, 'triangle', 0.12, 240, 0.06); break;
      case 'roar': beep(150, 0.5, 'sawtooth', 0.16, -60); beep(230, 0.45, 'triangle', 0.1, -90); puff(0.5, 0.1); break;
      case 'guincho': beep(2600, 0.1, 'sine', 0.09, -1400); beep(3100, 0.09, 'sine', 0.07, -1700, 0.1); break;
      case 'gulp': beep(300, 0.16, 'sine', 0.22, -170); beep(180, 0.22, 'sine', 0.2, -90, 0.14); puff(0.2, 0.12, 0.1); break;
      case 'zap': beep(1500, 0.1, 'square', 0.1, -1100); beep(900, 0.12, 'sawtooth', 0.1, 700, 0.06); break;
      case 'atchim': puff(0.3, 0.22); beep(700, 0.14, 'triangle', 0.16, -300); beep(420, 0.35, 'sawtooth', 0.18, -220, 0.14); break;
      case 'ninja': puff(0.12, 0.1); beep(1400, 0.09, 'square', 0.08, -900); break;
      case 'poof': puff(0.45, 0.2); beep(260, 0.22, 'sine', 0.08, -140); break;
      case 'tornado': puff(0.9, 0.18); beep(220, 0.9, 'sawtooth', 0.12, 700); beep(330, 0.8, 'triangle', 0.08, 520, 0.1); break;
      // viúvas negras: cuspir teia, o escorpião a partir os fios, o "nhac" e o canhão de redes
      case 'teia': puff(0.12, 0.08); beep(1250, 0.15, 'sine', 0.09, -820); break;
      case 'quebra': beep(760, 0.07, 'square', 0.09, -300); beep(620, 0.07, 'square', 0.08, -260, 0.07); beep(520, 0.08, 'square', 0.07, -220, 0.14); break;
      case 'nhac': beep(430, 0.1, 'triangle', 0.22, -170); beep(300, 0.15, 'sine', 0.18, -120, 0.09); beep(700, 0.14, 'sine', 0.12, 220, 0.2); break;
      case 'rede': puff(0.22, 0.16); beep(240, 0.18, 'triangle', 0.18, -90); break;
      case 'canhao': puff(0.16, 0.18); beep(130, 0.22, 'triangle', 0.24, -40); break;
      // Egito: o arco de brincar, o camelo e a tampa do sarcófago a fechar
      case 'bicho': beep(230, 0.26, 'sawtooth', 0.07, 90); beep(310, 0.2, 'square', 0.045, -70, 0.08); break;
      case 'arco': beep(760, 0.09, 'square', 0.09, -420); puff(0.12, 0.07, 0.02); break;
      case 'camelo': beep(300, 0.22, 'sawtooth', 0.14, -110); beep(240, 0.26, 'triangle', 0.12, -80, 0.16); break;
      // futebol no Dragão: apito de falta, o rugido da bancada e o golo
      case 'apito': beep(2500, 0.09, 'square', 0.12); beep(2500, 0.09, 'square', 0.12, 0, 0.12); beep(2500, 0.22, 'square', 0.12, 0, 0.24); break;
      case 'multidao': puff(1.6, 0.12); puff(1.2, 0.07, 0.3); break;
      case 'golo': [523, 659, 784, 1047, 1319].forEach(function (f, i) { beep(f, 0.3, 'triangle', 0.2, 0, i * 0.1); }); puff(1.8, 0.16); break;
      // Legos da Nicole: o clique do tijolo, o pato e o apito do comboio
      case 'clic': beep(2100, 0.035, 'square', 0.1); beep(1050, 0.06, 'triangle', 0.2, -300, 0.03); break;
      case 'quack': beep(520, 0.14, 'sawtooth', 0.12, -160); beep(500, 0.16, 'sawtooth', 0.12, -180, 0.2); break;
      case 'piui': beep(880, 0.35, 'triangle', 0.16, 60); beep(1175, 0.5, 'triangle', 0.14, 40, 0.3); puff(0.5, 0.1, 0.1); break;
      // Marvel: poderes dos heróis, o Lego a desmontar e a montar, e a porta da prisão
      case 'repulsor': beep(1300, 0.18, 'sine', 0.12, -700); beep(2200, 0.1, 'square', 0.05, -1200); break;
      case 'escudo': beep(900, 0.12, 'triangle', 0.14, 300); puff(0.15, 0.08); break;
      case 'trovao': puff(0.6, 0.24); beep(120, 0.5, 'sawtooth', 0.16, -60); beep(2400, 0.08, 'square', 0.08, -1800); break;
      case 'smash': puff(0.5, 0.28); beep(90, 0.45, 'triangle', 0.3, -40); break;
      case 'desmonta': [0, 1, 2, 3].forEach(function (i) { beep(1500 - i * 220, 0.05, 'square', 0.08, 0, i * 0.05); }); break;
      case 'monta': [0, 1, 2, 3].forEach(function (i) { beep(900 + i * 220, 0.05, 'square', 0.08, 0, i * 0.06); }); break;
      case 'algemas': beep(1800, 0.04, 'square', 0.1); beep(1400, 0.05, 'square', 0.1, 0, 0.07); break;
      case 'prisao': beep(200, 0.25, 'square', 0.12, -60); beep(150, 0.3, 'square', 0.12, -40, 0.2); break;
      // Marvel, 2.ª ronda de pedidos: comer no restaurante e rebentar balões
      case 'nham': beep(380, 0.1, 'triangle', 0.16, -90); beep(300, 0.12, 'triangle', 0.16, -70, 0.12); beep(520, 0.16, 'sine', 0.12, 180, 0.26); break;
      case 'balao': beep(1600, 0.05, 'square', 0.14, -1200); puff(0.14, 0.14); break;
      case 'tampa': beep(140, 0.3, 'triangle', 0.22, -50); beep(90, 0.5, 'sine', 0.16, -20, 0.16); puff(0.3, 0.12); break;
    }
  };

  // ronronar do motor do carro: chama-se todos os frames com k = velocidade 0..1
  A.engineSet = function (k) {
    if (!A.ctx) return;
    const t0 = A.ctx.currentTime;
    if (k <= 0.005 || !A.on) {
      if (A.engGain) A.engGain.gain.setTargetAtTime(0.0001, t0, 0.1);
      return;
    }
    if (!A.eng) {
      A.eng = A.ctx.createOscillator();
      A.eng.type = 'sawtooth';
      A.engFilt = A.ctx.createBiquadFilter();
      A.engFilt.type = 'lowpass'; A.engFilt.frequency.value = 480;
      A.engGain = A.ctx.createGain();
      A.engGain.gain.value = 0.0001;
      A.eng.connect(A.engFilt); A.engFilt.connect(A.engGain); A.engGain.connect(A.master);
      A.eng.start();
    }
    A.eng.frequency.setTargetAtTime(48 + 135 * k, t0, 0.07);
    A.engGain.gain.setTargetAtTime(0.03 + 0.05 * k, t0, 0.09);
  };

  // tique da barra de força (frequência sobe com a força 0..1)
  A.tick = function (k) { beep(300 + 650 * k, 0.045, 'square', 0.06); };

  // Dings em sequência (contar 1, 2, 3… balões de foguetões)
  A.dings = function (n) {
    for (let i = 0; i < Math.min(n, 5); i++) beep(900 + i * 150, 0.12, 'sine', 0.2, 200, i * 0.16);
  };

  // Musiquinha suave: arpejo pentatónico em loop, volume baixo.
  const NOTES = [523, 587, 659, 784, 880, 784, 659, 587];
  A.startMusic = function () {
    if (A.musicTimer) return;
    A.musicTimer = setInterval(function () {
      if (!A.on || !A.ctx || (window.G && G.paused)) return;
      const f = NOTES[A.musicStep % NOTES.length];
      beep(f, 0.28, 'triangle', 0.045);
      if (A.musicStep % 4 === 0) beep(f / 2, 0.5, 'sine', 0.03);
      A.musicStep++;
    }, 300);
  };

  // Voz do próprio telemóvel/computador, em português (sem ficheiros de som).
  // fila=true espera pela frase anterior; sem fila, corta o que estava a dizer.
  let vozes = null;
  function escolheVoz() {
    if (!window.speechSynthesis) return null;
    if (!vozes || !vozes.length) vozes = speechSynthesis.getVoices();
    for (const x of vozes) if (/^pt[-_]PT/i.test(x.lang)) return x;
    for (const x of vozes) if (/^pt/i.test(x.lang)) return x;
    return null;
  }
  if (window.speechSynthesis && speechSynthesis.addEventListener) {
    speechSynthesis.addEventListener('voiceschanged', function () { vozes = speechSynthesis.getVoices(); });
  }
  A.fala = function (txt, fila, tom) {
    A.ultimaFala = txt;
    if (!A.on || !window.speechSynthesis) return;
    try {
      if (!fila) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(txt);
      u.lang = 'pt-PT';
      const v = escolheVoz();
      if (v) u.voice = v;
      u.rate = 0.9; u.pitch = tom || 1.1;
      speechSynthesis.speak(u);
    } catch (e) { /* sem voz, o jogo continua com sons e desenhos */ }
  };
  A.cala = function () {
    try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { /* nada */ }
  };

  A.toggle = function () {
    A.on = !A.on;
    if (!A.on) A.cala();
    localStorage.setItem('isaacSound', A.on ? '1' : '0');
    return A.on;
  };

  G.audio = A;
})();
