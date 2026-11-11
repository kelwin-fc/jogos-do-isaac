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
      case 'susto': puff(0.5, 0.3); beep(180, 0.6, 'sawtooth', 0.22, 600); beep(260, 0.55, 'square', 0.12, 800, 0.02); break;
      case 'uuu': beep(330, 0.7, 'sine', 0.12, -120); beep(340, 0.6, 'sine', 0.06, -100, 0.1); break;
      case 'uivo': beep(400, 0.25, 'sine', 0.14, 300); beep(700, 0.9, 'sine', 0.14, -250, 0.25); break;
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
  // Temas de aventura (melodias nossas, feitas para os jogos da nave): A.tema = 'espaco' ou
  // 'halloween'; null = a musiquinha suave de sempre. Cada passo é uma colcheia (150 ms).
  const NF = { A2: 110, E2: 82.4, G2: 98, C3: 130.8, D3: 146.8, E3: 164.8, F3: 174.6, G3: 196, A3: 220, B3: 246.9,
    C4: 261.6, D4: 293.7, 'D#4': 311.1, E4: 329.6, F4: 349.2, G4: 392, 'G#4': 415.3, A4: 440, B4: 493.9, C5: 523.3, D5: 587.3, E5: 659.3 };
  function pauta(txt) { return txt.trim().split(/\s+/).map(function (n) { return n === '.' ? null : NF[n]; }); }
  const TEMAS = {
    espaco: { som: 'sawtooth', vol: 0.05, baixo: [NF.C3, NF.F3, NF.C3, NF.G2], mel: pauta(
      'C4 . E4 . G4 . C5 . . . G4 . E4 . G4 . ' +
      'A4 . . . F4 . A4 . C5 . . . B4 . . . ' +
      'G4 . C5 . E5 . . . D5 . C5 . B4 . A4 . ' +
      'G4 . . . E4 . F4 . G4 . . . . . . .') },
    halloween: { som: 'triangle', vol: 0.07, baixo: [NF.A2, NF.D3, NF.A2, NF.E2], mel: pauta(
      'A3 . C4 . E4 . A4 . . . G#4 . . . E4 . ' +
      'F4 . . . E4 . D4 . C4 . . . B3 . . . ' +
      'A3 . C4 . E4 . F4 . E4 . . . D#4 . E4 . ' +
      'A3 . . . . . . . E3 . . . A3 . . .') }
  };
  // Cada jogo tem a SUA música (pedido de 2026-11-11: "em todos os jogos a música não pode
  // ser igual; a da capa fica a de sempre"). Para os jogos sem tema escrito à mão, a música
  // é composta a partir do nome do jogo: o nome escolhe a escala, a tónica, o instrumento,
  // o ritmo e o baixo, e uma melodia que repete o motivo (como as canções a sério). O mesmo
  // jogo toca sempre a mesma música; jogos diferentes tocam músicas diferentes.
  const MODOS = [
    { n: 'maior', esc: [0, 2, 4, 5, 7, 9, 11], baixo: [0, 5, 0, 7] },
    { n: 'menor', esc: [0, 2, 3, 5, 7, 8, 10], baixo: [0, 8, 5, 7] },
    { n: 'penta', esc: [0, 2, 4, 7, 9], baixo: [0, 7, 9, 7] },
    { n: 'dorico', esc: [0, 2, 3, 5, 7, 9, 10], baixo: [0, 5, 3, 7] },
    { n: 'mixo', esc: [0, 2, 4, 5, 7, 9, 10], baixo: [0, 10, 5, 0] },
    { n: 'pentamenor', esc: [0, 3, 5, 7, 10], baixo: [0, 5, 3, 7] }
  ];
  const RITMOS = [   // 16 colcheias por compasso: 1 = nota nova
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    [1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 0],
    [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0],
    [1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0],
    [1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0]
  ];
  const SONS = [['triangle', 0.075], ['square', 0.035], ['sine', 0.09], ['sawtooth', 0.035], ['triangle', 0.07]];
  function compoe(nome) {
    let h = 2166136261;
    for (let i = 0; i < nome.length; i++) { h ^= nome.charCodeAt(i); h = Math.imul(h, 16777619); }
    let seed = (h >>> 0) || 1;
    function r() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
    function esc(a) { return a[Math.floor(r() * a.length)]; }
    const modo = esc(MODOS), raiz = 57 + Math.floor(r() * 10);          // tónica entre A3 e F#4 (MIDI)
    const som = esc(SONS), rA = esc(RITMOS), rB = esc(RITMOS);
    const midi = function (grau) {
      const n = modo.esc.length, o = Math.floor(grau / n), g = ((grau % n) + n) % n;
      return raiz + 12 * o + modo.esc[g];
    };
    const hz = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
    // o motivo (compasso A) e a resposta (compasso B); a canção é A B A' fim
    function frase(ritmo, inicio, fim) {
      const out = []; let grau = inicio;
      for (let i = 0; i < 16; i++) {
        if (!ritmo[i]) { out.push(null); continue; }
        if (i >= 12 && fim !== undefined) grau = fim;
        else grau = Math.max(-2, Math.min(9, grau + esc([-2, -1, -1, 1, 1, 2, 0, 3, -3])));
        out.push(hz(midi(grau)));
      }
      return out;
    }
    const A1 = frase(rA, Math.floor(r() * 3) + 2), B = frase(rB, 4), A2 = A1.slice(0, 12).concat(frase(rA, 3, 0).slice(12));
    const fimF = frase(rB, 2, 0);
    return { som: som[0], vol: som[1], mel: A1.concat(B, A2, fimF),
      baixo: modo.baixo.map(function (st) { return hz(raiz - 24 + st); }),
      bateria: r() < 0.6, oitava: r() < 0.5 };
  }
  A.compoe = compoe;   // (para testar)
  A.tema = null;
  A.startMusic = function () {
    if (A.musicTimer) return;
    A.musicTimer = setInterval(function () {
      if (!A.on || !A.ctx || (window.G && G.paused)) return;
      const step = A.musicStep++;
      let tm = TEMAS[A.tema];
      if (!tm && A.tema) tm = TEMAS[A.tema] = compoe(A.tema);
      if (tm) {
        const n = tm.mel.length, i = step % n, f = tm.mel[i];
        if (f) {
          let d = 1; while (d < 8 && !tm.mel[(i + d) % n]) d++;
          beep(f, d * 0.15 * 0.95, tm.som, tm.vol);
          if (tm.oitava !== false) beep(f * 2, d * 0.15 * 0.6, 'sine', tm.vol * 0.35);
        }
        if (i % 8 === 0) beep(tm.baixo[Math.floor(i / 16) % 4] , 1.1, 'sine', 0.09);
        if (i % 4 === 0 && tm.bateria !== false) puff(0.07, A.tema === 'espaco' ? 0.07 : 0.05);
        return;
      }
      if (step % 2) return;
      const k = step / 2;
      const f = NOTES[k % NOTES.length];
      beep(f, 0.28, 'triangle', 0.045);
      if (k % 4 === 0) beep(f / 2, 0.5, 'sine', 0.03);
    }, 150);
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
