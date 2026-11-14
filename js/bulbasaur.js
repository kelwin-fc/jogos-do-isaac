/* Cena — BULBASAUR À PROCURA DE MOEDAS, inventada em palco (2026-11-14).

   "Um jogo de Pokémon em que vamos procurar moedas. Nós somos o Bulbasaur, usamos
   folhas e tentáculos de folhas. Tem de ser muito difícil até chegarmos aos Pokémon
   maiores que vão lutar contra nós."

   Como ficou:
   - Mundo visto de cima, a câmara segue o Bulbasaur. Arrastar o dedo (ou setas/WASD)
     para andar.
   - As moedas estão ESCONDIDAS nos arbustos (e duas em cada pedra grande). Os arbustos
     com moeda abanam de vez em quando quando estamos perto: é a pista.
   - 🍃 (espaço) é a FOLHA NAVALHA: atira folhas (com mira para o Pokémon mais perto à
     frente). Abre arbustos e deixa os Pokémon selvagens tontos.
   - 🌿 (tecla B) é o CHICOTE DE VINHA: dois tentáculos de folhas à volta do Bulbasaur;
     batem com força, abrem tudo o que está perto e puxam as moedas. Tem de recarregar.
   - Pokémon selvagens perseguem o Bulbasaur; se nos tocam perdemos um coração e caem
     moedas (dá para as apanhar outra vez). Sem corações vai descansar ao Centro Pokémon
     e a zona recomeça. Nunca há game over.
   - Juntando as moedas da zona acorda o Pokémon GRANDE da zona (Onix, Gyarados,
     Snorlax, Charizard e, no fim, Mewtwo): investe contra nós e atira bolas. Quando fica
     tonto de vez, fica nosso amigo e dá um tesouro. Ninguém se magoa: os vencidos ficam
     tontos e vão-se embora contentes com um coração. */
(function () {
  window.G = window.G || {};
  const TAU = Math.PI * 2;
  const S = {};

  /* ---------- dificuldade: está tudo aqui para afinar ---------- */
  const DIF = {
    V_BULBA: 250, CORACOES: 5, INVENC: 1.3,
    FOLHA_CD: 0.24, FOLHA_V: 680, FOLHA_VIDA: 0.75, FOLHA_CONE: 0.6,
    CHICOTE_CD: 2.2, CHICOTE_R: 175, CHICOTE_DANO: 3,
    APANHA_R: 46, ATRAI_R: 190,
    INIMIGOS: [6, 8, 9, 10, 12],           // quantos selvagens ao mesmo tempo por zona
    NASCE_T: 2.2, NASCE_T_ZONA: 0.25,        // de quanto em quanto tempo aparece mais um
    V_INIMIGO: 150, V_INIMIGO_ZONA: 18, VISTA: 430,
    PERDE_MOEDAS: 2,
    BOSS_HP: [40, 55, 70, 85, 120], BOSS_V: 95, CARGA_V: 560, BOSS_BOLAS: [8, 10, 10, 12, 16]
  };

  const ARTE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/';
  const MW = 2400, MH = 2400;     // tamanho do mundo

  const ZONAS = [
    { nome: 'Bosque Verde', chao: ['#7cc96b', '#72bf61'], arbusto: '#2d8a3e', moedas: 10,
      selv: [{ n: 'Rattata', pid: 19, hp: 2 }, { n: 'Pidgey', pid: 16, hp: 2 }, { n: 'Caterpie', pid: 10, hp: 2 }],
      boss: { n: 'Onix', pid: 95, cor: '#8d8d8d' } },
    { nome: 'Praia das Ondas', chao: ['#f2d99a', '#ead08c'], arbusto: '#3a9d5d', moedas: 12,
      selv: [{ n: 'Krabby', pid: 98, hp: 3 }, { n: 'Tentacool', pid: 72, hp: 3, atira: true }, { n: 'Psyduck', pid: 54, hp: 3 }],
      boss: { n: 'Gyarados', pid: 130, cor: '#3a86ff' } },
    { nome: 'Gruta Escura', chao: ['#8b7d6b', '#807261'], arbusto: '#4f6d3a', moedas: 14,
      selv: [{ n: 'Zubat', pid: 41, hp: 3, atira: true }, { n: 'Geodude', pid: 74, hp: 4 }, { n: 'Diglett', pid: 50, hp: 3 }],
      boss: { n: 'Snorlax', pid: 143, cor: '#2b6777' } },
    { nome: 'Vulcão', chao: ['#c98a6b', '#bf7f60'], arbusto: '#6b8e23', moedas: 16,
      selv: [{ n: 'Ponyta', pid: 77, hp: 4 }, { n: 'Growlithe', pid: 58, hp: 4 }, { n: 'Magmar', pid: 126, hp: 4, atira: true }],
      boss: { n: 'Charizard', pid: 6, cor: '#f3722c' } },
    { nome: 'Montanha dos Lendários', chao: ['#b8c4d6', '#adb9cc'], arbusto: '#2f7a5a', moedas: 18,
      selv: [{ n: 'Machop', pid: 66, hp: 5 }, { n: 'Haunter', pid: 93, hp: 4, atira: true }, { n: 'Jynx', pid: 124, hp: 5, atira: true }],
      boss: { n: 'Mewtwo', pid: 150, cor: '#b388eb' } }
  ];

  let zona = 0, volta = 1, b = null, arbustos = [], pedras = [], moedas = [], inimigos = [], folhas = [], bolas = [],
    parts = [], textos = [], boss = null, chicote = null, apanhadas = 0, nasceT = 0, estado = 'jogo', estadoT = 0,
    cam = { x: 0, y: 0 }, zoom = 1, tempo = 0;

  function rnd(a, c) { return a + Math.random() * (c - a); }
  function clamp(v, a, c) { return v < a ? a : (v > c ? c : v); }
  function dist(p, q) { return Math.hypot(p.x - q.x, p.y - q.y); }
  function difAng(a, c) { return ((c - a + Math.PI) % TAU + TAU) % TAU - Math.PI; }
  function fala(t) { if (G.audio && G.audio.fala) G.audio.fala(t); }
  function sfx(n) { if (G.audio && G.audio.sfx) G.audio.sfx(n); }
  function banner(t, ms) { if (G.banner) G.banner(t, ms); }
  function texto(t, x, y, cor) { textos.push({ t: t, x: x, y: y, cor: cor || '#ffffff', age: 0 }); }
  function Z() { return ZONAS[zona]; }
  function forca() { return 1 + (volta - 1) * 0.25; }

  /* ---------- imagens (PokeAPI, com plano B) ---------- */
  const imagens = {};
  function imagem(id) {
    if (imagens[id]) return imagens[id];
    const r = { img: typeof Image !== 'undefined' ? new Image() : {}, ok: false, tent: 0 };
    const fontes = [ARTE + 'official-artwork/' + id + '.png', ARTE + 'home/' + id + '.png'];
    r.img.crossOrigin = 'anonymous';
    r.img.onload = function () { r.ok = true; };
    r.img.onerror = function () { r.tent++; if (r.tent < fontes.length) r.img.src = fontes[r.tent]; };
    r.img.src = fontes[0];
    imagens[id] = r;
    return r;
  }

  /* ---------- montar a zona ---------- */
  function livre(x, y, r) {
    if (Math.hypot(x - MW / 2, y - MH / 2) < 160) return false;
    for (const a of arbustos) if (Math.hypot(a.x - x, a.y - y) < a.r + r + 20) return false;
    for (const p of pedras) if (Math.hypot(p.x - x, p.y - y) < p.r + r + 20) return false;
    return true;
  }
  function montaZona() {
    arbustos = []; pedras = []; moedas = []; inimigos = []; folhas = []; bolas = []; parts = []; textos = [];
    boss = null; chicote = null; apanhadas = 0; nasceT = 1.5; estado = 'jogo'; estadoT = 0;
    b = { x: MW / 2, y: MH / 2, vx: 0, vy: 0, ang: 0, vira: 1, hp: DIF.CORACOES, inv: 1.5, folhaT: 0, chicoteT: 0, tonto: 0 };
    let t = 0;
    while (pedras.length < 10 && t++ < 2000) {
      const x = rnd(120, MW - 120), y = rnd(120, MH - 120);
      if (livre(x, y, 60)) pedras.push({ x: x, y: y, r: 56, hp: 3, moedas: 2, aberta: false, abana: 0 });
    }
    t = 0;
    while (arbustos.length < 90 && t++ < 6000) {
      const x = rnd(80, MW - 80), y = rnd(80, MH - 80);
      if (livre(x, y, 40)) arbustos.push({ x: x, y: y, r: rnd(34, 46), tem: null, aberto: false, abana: 0, pista: rnd(0, 4) });
    }
    // moedas escondidas: as que faltam (tirando as das pedras) mais umas de folga, e umas bagas
    const precisa = Math.max(4, Z().moedas - 6) + 6;
    const ord = arbustos.slice().sort(function () { return Math.random() - 0.5; });
    for (let i = 0; i < ord.length; i++) {
      if (i < precisa) ord[i].tem = 'moeda';
      else if (i < precisa + 4) ord[i].tem = 'baga';
    }
    Z().selv.forEach(function (s) { imagem(s.pid); });
    imagem(Z().boss.pid);
  }

  S.enter = function () {
    zona = 0; volta = 1; tempo = 0;
    imagem(1);
    montaZona();
    banner('🍃 ' + Z().nome + ' — procura ' + Z().moedas + ' moedas!', 2600);
    fala('Bulbasaur, vamos procurar moedas!');
  };

  /* ---------- coisas que acontecem ---------- */
  function poeMoeda(x, y, vx, vy, espera) {
    moedas.push({ x: x, y: y, vx: vx || rnd(-120, 120), vy: vy || rnd(-120, 120), z: 0, vz: 260, espera: espera || 0, t: 0, baga: false });
  }
  function poeBaga(x, y) { moedas.push({ x: x, y: y, vx: rnd(-80, 80), vy: rnd(-80, 80), z: 0, vz: 240, espera: 0, t: 0, baga: true }); }

  function folhinhas(x, y, n, cor) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, TAU), v = rnd(60, 240);
      parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: rnd(0.4, 0.9), age: 0, cor: cor || '#3fbf4f', r: rnd(3, 6), rot: rnd(0, TAU) });
    }
  }

  function abreArbusto(a) {
    if (a.aberto) return;
    a.aberto = true; a.abana = 0.4;
    folhinhas(a.x, a.y, 10, Z().arbusto);
    if (a.tem === 'moeda') { poeMoeda(a.x, a.y); sfx('pop'); }
    else if (a.tem === 'baga') { poeBaga(a.x, a.y); sfx('pop'); }
    else sfx('poof');
  }
  function batePedra(p, dano) {
    if (p.aberta) return;
    p.hp -= dano; p.abana = 0.3;
    folhinhas(p.x, p.y, 5, '#9a9a9a');
    sfx('quebra');
    if (p.hp <= 0) {
      p.aberta = true;
      for (let i = 0; i < p.moedas; i++) poeMoeda(p.x, p.y);
      texto('💰', p.x, p.y - 40, '#ffd60a');
    }
  }

  function bateInimigo(e, dano) {
    if (e.tonto > 0 || e.foi) return;
    e.hp -= dano; e.pisca = 0.15;
    sfx('pew');
    if (e.hp <= 0) {
      e.tonto = 1.4;
      texto('💫', e.x, e.y - 40);
      if (Math.random() < 0.35) poeMoeda(e.x, e.y);
      if (G.addStars) G.addStars(1);
    } else {
      const a = Math.atan2(e.y - b.y, e.x - b.x);
      e.x += Math.cos(a) * 18; e.y += Math.sin(a) * 18;
    }
  }

  function bateBoss(dano) {
    if (!boss || boss.vencido || boss.acorda > 0) return;
    boss.hp -= dano; boss.pisca = 0.12;
    sfx('pew');
    if (boss.hp <= 0) {
      boss.vencido = true; boss.tontoT = 0;
      bolas = [];
      sfx('tada');
      banner('💫 ' + boss.d.n + ' ficou teu amigo! 💚', 3000);
      fala(boss.d.n + ' é teu amigo! Boa, Bulbasaur!');
      for (let i = 0; i < 12; i++) poeMoeda(boss.x, boss.y, rnd(-260, 260), rnd(-260, 260));
      if (G.addStars) G.addStars(zona === ZONAS.length - 1 ? 25 : 10);
      if (G.ze && G.ze.diz) G.ze.diz('Boa, Isaac e Zé!');
      estado = 'vitoria'; estadoT = 4.5;
    }
  }

  function magoaBulba(de) {
    if (b.inv > 0 || estado !== 'jogo' && estado !== 'boss') return;
    b.hp--; b.inv = DIF.INVENC; b.tonto = 0.35;
    G.shake = Math.max(G.shake, 0.35);
    sfx('ouch');
    const a = Math.atan2(b.y - de.y, b.x - de.x);
    b.vx = Math.cos(a) * 420; b.vy = Math.sin(a) * 420;
    const perde = Math.min(apanhadas, DIF.PERDE_MOEDAS);
    for (let i = 0; i < perde; i++) {
      const aa = a + rnd(-1.2, 1.2);
      poeMoeda(b.x, b.y, Math.cos(aa) * 260, Math.sin(aa) * 260, 0.8);
    }
    apanhadas -= perde;
    if (perde) texto('-' + perde + ' 🪙', b.x, b.y - 50, '#ff6b6b');
    if (b.hp <= 0) {
      estado = 'descansa'; estadoT = 3;
      banner('😴 O Bulbasaur vai descansar ao Centro Pokémon… outra vez!', 3000);
      fala('Ui! Vamos outra vez!');
    }
  }

  function acordaBoss() {
    const d = Z().boss;
    const a = rnd(0, TAU);
    const hp = Math.round(DIF.BOSS_HP[zona] * forca());
    boss = { d: d, x: clamp(b.x + Math.cos(a) * 420, 150, MW - 150), y: clamp(b.y + Math.sin(a) * 420, 150, MH - 150),
      r: 85 + zona * 6, hp: hp, max: hp, acorda: 1.6, fase: 'anda', faseT: 2.5, bolaT: 3.5, pisca: 0, vencido: false,
      cx: 0, cy: 0, tontoT: 0 };
    estado = 'boss';
    inimigos.forEach(function (e) { if (!e.tonto) e.tonto = 0.01; });
    sfx('roar');
    G.shake = 0.6;
    banner('⚠️ O ' + d.n + ' acordou! Luta com folhas e vinhas!', 3000);
    fala('Cuidado! O ' + d.n + ' acordou!');
  }

  function nasceInimigo() {
    const s = Z().selv[Math.floor(Math.random() * Z().selv.length)];
    // nasce fora do ecrã, perto do Bulbasaur
    const a = rnd(0, TAU), r = rnd(520, 760);
    const x = clamp(b.x + Math.cos(a) * r, 40, MW - 40), y = clamp(b.y + Math.sin(a) * r, 40, MH - 40);
    const hp = Math.round(s.hp * forca());
    inimigos.push({ d: s, x: x, y: y, vx: 0, vy: 0, hp: hp, tonto: 0, foi: false, fade: 1, pisca: 0,
      vagueia: rnd(0, TAU), pensaT: rnd(0.5, 2), atiraT: rnd(1.5, 3.5), r: 30 });
  }

  /* ---------- update ---------- */
  S.update = function (dt, t) {
    tempo += dt;
    const I = G.input;
    zoom = Math.min(G.W, G.H) / 700;
    if (zoom < 0.55) zoom = 0.55;

    if (estado === 'descansa') {
      estadoT -= dt;
      if (estadoT <= 0) { montaZona(); banner('🍃 ' + Z().nome + ' — procura ' + Z().moedas + ' moedas!', 2400); }
    } else if (estado === 'vitoria') {
      estadoT -= dt;
      if (estadoT <= 0) {
        zona++;
        if (zona >= ZONAS.length) {
          zona = 0; volta++;
          banner('🏆 És o MESTRE DAS MOEDAS! Agora ainda mais difícil!', 3500);
          fala('És o mestre das moedas!');
        }
        montaZona();
        setTimeout(function () { banner('🍃 ' + Z().nome + ' — procura ' + Z().moedas + ' moedas!', 2600); }, zona === 0 ? 3600 : 0);
      }
    }

    // ---- o Bulbasaur ----
    const ax = I.axis();
    if (b.tonto > 0) b.tonto -= dt;
    const vel = DIF.V_BULBA;
    const tx = b.tonto > 0 ? 0 : ax.x * vel, ty = b.tonto > 0 ? 0 : ax.y * vel;
    b.vx += (tx - b.vx) * Math.min(1, dt * 9);
    b.vy += (ty - b.vy) * Math.min(1, dt * 9);
    b.x = clamp(b.x + b.vx * dt, 40, MW - 40);
    b.y = clamp(b.y + b.vy * dt, 40, MH - 40);
    if (Math.abs(ax.x) + Math.abs(ax.y) > 0.2) { b.ang = Math.atan2(ax.y, ax.x); if (Math.abs(ax.x) > 0.15) b.vira = ax.x > 0 ? 1 : -1; }
    // não se atravessam pedras nem arbustos fechados
    for (const p of pedras) empurra(b, p.x, p.y, p.r + 28);
    for (const a of arbustos) if (!a.aberto) empurra(b, a.x, a.y, a.r + 18);
    if (b.inv > 0) b.inv -= dt;
    b.folhaT -= dt; b.chicoteT -= dt;
    document.body.classList.toggle('bulba-chicote-espera', b.chicoteT > 0);

    const joga = estado === 'jogo' || estado === 'boss' || estado === 'vitoria';
    // 🍃 folha navalha (segura-se para atirar sem parar)
    if (joga && b.tonto <= 0 && (I.isHeld('fire') || I.justPressed('fire')) && b.folhaT <= 0) {
      b.folhaT = DIF.FOLHA_CD;
      let ang = b.ang, melhor = null, md = 520;
      const alvos = inimigos.filter(function (e) { return !e.tonto && !e.foi; });
      if (boss && !boss.vencido) alvos.push(boss);
      for (const e of alvos) {
        const d = dist(b, e);
        const da = Math.abs(difAng(b.ang, Math.atan2(e.y - b.y, e.x - b.x)));
        if (d < md && da < DIF.FOLHA_CONE) { md = d; melhor = e; }
      }
      if (melhor) ang = Math.atan2(melhor.y - b.y, melhor.x - b.x);
      for (let k = -1; k <= 1; k += 2) {
        const aa = ang + k * 0.08;
        folhas.push({ x: b.x + Math.cos(aa) * 30, y: b.y + Math.sin(aa) * 30, vx: Math.cos(aa) * DIF.FOLHA_V, vy: Math.sin(aa) * DIF.FOLHA_V, vida: DIF.FOLHA_VIDA, rot: 0 });
      }
      sfx('ninja');
    }
    // 🌿 chicote de vinha
    if (joga && b.tonto <= 0 && I.justPressed('horn') && b.chicoteT <= 0) {
      b.chicoteT = DIF.CHICOTE_CD;
      chicote = { t: 0, dur: 0.45, bateu: false };
      sfx('rede');
    }
    if (chicote) {
      chicote.t += dt;
      if (!chicote.bateu && chicote.t > chicote.dur * 0.45) {
        chicote.bateu = true;
        const R = DIF.CHICOTE_R;
        for (const a of arbustos) if (!a.aberto && dist(a, b) < R + a.r) abreArbusto(a);
        for (const p of pedras) if (!p.aberta && dist(p, b) < R + p.r) batePedra(p, 2);
        for (const e of inimigos) if (dist(e, b) < R + e.r) bateInimigo(e, DIF.CHICOTE_DANO);
        if (boss && dist(boss, b) < R + boss.r) bateBoss(DIF.CHICOTE_DANO + 1);
        for (const m of moedas) if (dist(m, b) < R * 1.8) m.puxa = true;
        G.shake = Math.max(G.shake, 0.15);
      }
      if (chicote.t > chicote.dur) chicote = null;
    }

    // ---- folhas ----
    for (const f of folhas) {
      f.x += f.vx * dt; f.y += f.vy * dt; f.vida -= dt; f.rot += dt * 18;
      for (const a of arbustos) if (!a.aberto && Math.hypot(a.x - f.x, a.y - f.y) < a.r) { abreArbusto(a); f.vida = 0; break; }
      if (f.vida <= 0) continue;
      for (const p of pedras) if (!p.aberta && Math.hypot(p.x - f.x, p.y - f.y) < p.r) { batePedra(p, 1); f.vida = 0; break; }
      if (f.vida <= 0) continue;
      for (const e of inimigos) if (!e.tonto && !e.foi && Math.hypot(e.x - f.x, e.y - f.y) < e.r + 8) { bateInimigo(e, 1); f.vida = 0; break; }
      if (f.vida > 0 && boss && !boss.vencido && Math.hypot(boss.x - f.x, boss.y - f.y) < boss.r) { bateBoss(1); f.vida = 0; }
    }
    folhas = folhas.filter(function (f) { return f.vida > 0; });

    // ---- moedas ----
    for (const m of moedas) {
      m.t += dt;
      if (m.espera > 0) m.espera -= dt;
      m.vz -= 900 * dt; m.z = Math.max(0, m.z + m.vz * dt);
      if (m.z === 0 && m.vz < 0) m.vz = -m.vz * 0.35;
      m.vx *= Math.pow(0.08, dt); m.vy *= Math.pow(0.08, dt);
      const d = dist(m, b);
      if (m.espera <= 0 && (m.puxa || d < DIF.ATRAI_R * 0.5)) {
        const a = Math.atan2(b.y - m.y, b.x - m.x), v = m.puxa ? 700 : 300;
        m.vx = Math.cos(a) * v; m.vy = Math.sin(a) * v;
      }
      m.x = clamp(m.x + m.vx * dt, 20, MW - 20); m.y = clamp(m.y + m.vy * dt, 20, MH - 20);
      if (m.espera <= 0 && d < DIF.APANHA_R && estado !== 'descansa') {
        m.apanhada = true;
        if (m.baga) {
          if (b.hp < DIF.CORACOES) b.hp++;
          texto('❤️', m.x, m.y - 30); sfx('heart');
        } else {
          apanhadas++;
          texto('+1 🪙', m.x, m.y - 30, '#ffd60a'); sfx('star');
          if (estado === 'jogo' && apanhadas >= Z().moedas) acordaBoss();
        }
      }
    }
    moedas = moedas.filter(function (m) { return !m.apanhada; });

    // ---- arbustos e pedras ----
    for (const a of arbustos) {
      if (a.abana > 0) a.abana -= dt;
      if (!a.aberto && a.tem) {
        a.pista -= dt;
        if (a.pista <= 0) { a.pista = rnd(3, 5); if (dist(a, b) < 450) { a.abana = 0.5; if (a.tem === 'moeda') parts.push({ x: a.x + rnd(-15, 15), y: a.y - 20, vx: 0, vy: -40, vida: 0.8, age: 0, cor: '#ffd60a', r: 4, brilho: true }); } }
      }
    }
    for (const p of pedras) if (p.abana > 0) p.abana -= dt;

    // ---- selvagens ----
    if (estado === 'jogo') {
      nasceT -= dt;
      const max = Math.round(DIF.INIMIGOS[zona] * (1 + (volta - 1) * 0.3));
      if (nasceT <= 0 && inimigos.filter(function (e) { return !e.foi; }).length < max) {
        nasceInimigo();
        nasceT = Math.max(0.8, DIF.NASCE_T - zona * DIF.NASCE_T_ZONA);
      }
    }
    const vIn = (DIF.V_INIMIGO + zona * DIF.V_INIMIGO_ZONA) * (1 + (volta - 1) * 0.12);
    for (const e of inimigos) {
      if (e.pisca > 0) e.pisca -= dt;
      if (e.foi) { e.fade -= dt * 0.7; e.x += e.vx * dt; e.y += e.vy * dt; continue; }
      if (e.tonto > 0) {
        e.tonto -= dt;
        if (e.tonto <= 0) {
          // fica contente e vai-se embora
          e.foi = true; const a = Math.atan2(e.y - b.y, e.x - b.x);
          e.vx = Math.cos(a) * 140; e.vy = Math.sin(a) * 140;
          texto('💚', e.x, e.y - 40);
        }
        continue;
      }
      const d = dist(e, b);
      let ax2 = 0, ay2 = 0;
      if (d < DIF.VISTA && estado !== 'descansa') {
        const a = Math.atan2(b.y - e.y, b.x - e.x);
        // os que atiram ficam a meia distância
        const fica = e.d.atira && d < 240 ? -0.6 : 1;
        ax2 = Math.cos(a) * vIn * fica; ay2 = Math.sin(a) * vIn * fica;
        if (e.d.atira) {
          e.atiraT -= dt;
          if (e.atiraT <= 0) {
            e.atiraT = rnd(1.8, 3) / forca();
            bolas.push({ x: e.x, y: e.y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, vida: 2.2, r: 10, cor: '#c77dff' });
            sfx('zap');
          }
        }
      } else {
        e.pensaT -= dt;
        if (e.pensaT <= 0) { e.pensaT = rnd(1, 2.5); e.vagueia = rnd(0, TAU); }
        ax2 = Math.cos(e.vagueia) * vIn * 0.35; ay2 = Math.sin(e.vagueia) * vIn * 0.35;
      }
      e.vx += (ax2 - e.vx) * Math.min(1, dt * 4);
      e.vy += (ay2 - e.vy) * Math.min(1, dt * 4);
      e.x = clamp(e.x + e.vx * dt, 30, MW - 30); e.y = clamp(e.y + e.vy * dt, 30, MH - 30);
      for (const p of pedras) empurra(e, p.x, p.y, p.r + 26);
      if (d < e.r + 30) magoaBulba(e);
    }
    inimigos = inimigos.filter(function (e) { return e.fade > 0; });
    // não ficam todos uns em cima dos outros
    for (let i = 0; i < inimigos.length; i++) for (let j = i + 1; j < inimigos.length; j++) {
      const p = inimigos[i], q = inimigos[j];
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d > 0 && d < 56) { const k = (56 - d) / 2 / d; p.x += (p.x - q.x) * k; p.y += (p.y - q.y) * k; q.x -= (p.x - q.x) * k; q.y -= (p.y - q.y) * k; }
    }

    // ---- o Pokémon grande ----
    if (boss) atualizaBoss(dt);

    // ---- bolas (ataques deles) ----
    for (const o of bolas) {
      o.x += o.vx * dt; o.y += o.vy * dt; o.vida -= dt;
      if (Math.hypot(o.x - b.x, o.y - b.y) < o.r + 24) { o.vida = 0; magoaBulba(o); }
      for (const f of folhas) if (Math.hypot(o.x - f.x, o.y - f.y) < o.r + 6 && !o.grande) { o.vida = 0; f.vida = 0; folhinhas(o.x, o.y, 3, o.cor); }
    }
    bolas = bolas.filter(function (o) { return o.vida > 0; });

    for (const p of parts) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (!p.brilho) { p.vx *= 0.94; p.vy *= 0.94; } }
    parts = parts.filter(function (p) { return p.age < p.vida; });
    for (const x of textos) { x.age += dt; x.y -= 40 * dt; }
    textos = textos.filter(function (x) { return x.age < 1.3; });

    // câmara
    const vw = G.W / zoom, vh = G.H / zoom;
    cam.x = clamp(b.x - vw / 2, -60, MW - vw + 60);
    cam.y = clamp(b.y - vh / 2, -60, MH - vh + 60);
    if (vw > MW) cam.x = (MW - vw) / 2;
    if (vh > MH) cam.y = (MH - vh) / 2;
  };

  function empurra(o, x, y, r) {
    const dx = o.x - x, dy = o.y - y, d = Math.hypot(dx, dy);
    if (d > 0 && d < r) { o.x = x + dx / d * r; o.y = y + dy / d * r; }
  }

  function atualizaBoss(dt) {
    const k = boss;
    if (k.pisca > 0) k.pisca -= dt;
    if (k.vencido) { k.tontoT += dt; return; }
    if (k.acorda > 0) { k.acorda -= dt; return; }
    const f = forca() * (1 + zona * 0.08);
    const a = Math.atan2(b.y - k.y, b.x - k.x);
    k.faseT -= dt;
    if (k.fase === 'anda') {
      k.x += Math.cos(a) * DIF.BOSS_V * f * dt; k.y += Math.sin(a) * DIF.BOSS_V * f * dt;
      if (k.faseT <= 0) { k.fase = 'aviso'; k.faseT = 0.7; k.cx = Math.cos(a); k.cy = Math.sin(a); sfx('roar'); }
    } else if (k.fase === 'aviso') {
      if (k.faseT <= 0) { k.fase = 'carga'; k.faseT = 0.75; }
    } else if (k.fase === 'carga') {
      k.x += k.cx * DIF.CARGA_V * f * dt; k.y += k.cy * DIF.CARGA_V * f * dt;
      if (k.faseT <= 0) { k.fase = 'anda'; k.faseT = rnd(1.8, 3) / f; }
    }
    k.x = clamp(k.x, k.r, MW - k.r); k.y = clamp(k.y, k.r, MH - k.r);
    k.bolaT -= dt;
    if (k.bolaT <= 0 && k.fase === 'anda') {
      k.bolaT = rnd(3.2, 4.5) / f;
      const n = DIF.BOSS_BOLAS[zona], a0 = rnd(0, TAU);
      for (let i = 0; i < n; i++) {
        const aa = a0 + i / n * TAU;
        bolas.push({ x: k.x, y: k.y, vx: Math.cos(aa) * 260 * Math.sqrt(f), vy: Math.sin(aa) * 260 * Math.sqrt(f), vida: 3, r: 14, cor: k.d.cor, grande: true });
      }
      sfx('canhao');
    }
    if (dist(k, b) < k.r + 22) magoaBulba(k);
  }

  /* ---------- desenho ---------- */
  function poke(c, pid, x, y, tam, vira, cor, nome) {
    const im = imagem(pid);
    c.save();
    c.translate(x, y);
    if (vira < 0) c.scale(-1, 1);
    if (im.ok) c.drawImage(im.img, -tam / 2, -tam / 2, tam, tam);
    else {
      c.fillStyle = cor || '#888'; c.beginPath(); c.arc(0, 0, tam * 0.35, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.font = 'bold ' + Math.round(tam * 0.3) + 'px system-ui, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText((nome || '?')[0], 0, 0);
    }
    c.restore();
  }
  function sombra(c, x, y, r) {
    c.fillStyle = 'rgba(0,0,0,0.18)';
    c.beginPath(); c.ellipse(x, y, r, r * 0.38, 0, 0, TAU); c.fill();
  }
  function moeda(c, x, y, r, t) {
    const w = Math.abs(Math.cos(t * 4)) * 0.8 + 0.2;
    c.fillStyle = '#e0a800'; c.beginPath(); c.ellipse(x, y, r * w, r, 0, 0, TAU); c.fill();
    c.fillStyle = '#ffd60a'; c.beginPath(); c.ellipse(x, y, r * w * 0.78, r * 0.78, 0, 0, TAU); c.fill();
    if (w > 0.5) { c.fillStyle = '#e0a800'; c.font = 'bold ' + Math.round(r) + 'px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('P', x, y + 1); }
  }
  function folha(c, x, y, rot, s) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.fillStyle = '#43aa3b';
    c.beginPath(); c.moveTo(-s, 0); c.quadraticCurveTo(0, -s * 0.7, s, 0); c.quadraticCurveTo(0, s * 0.7, -s, 0); c.fill();
    c.strokeStyle = '#1f6f1a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-s, 0); c.lineTo(s, 0); c.stroke();
    c.restore();
  }

  S.draw = function (c, t) {
    const W = G.W, H = G.H, z = Z();
    c.fillStyle = z.chao[0]; c.fillRect(0, 0, W, H);
    c.save();
    c.scale(zoom, zoom);
    c.translate(-cam.x, -cam.y);
    const vw = W / zoom, vh = H / zoom;
    function ve(x, y, r) { return x + r > cam.x && x - r < cam.x + vw && y + r > cam.y && y - r < cam.y + vh; }

    // chão aos quadrados e o limite do mundo
    const q = 200;
    c.fillStyle = z.chao[1];
    for (let x = Math.floor(cam.x / q) * q; x < cam.x + vw; x += q)
      for (let y = Math.floor(cam.y / q) * q; y < cam.y + vh; y += q)
        if (((x / q) + (y / q)) % 2 === 0 && x >= 0 && y >= 0 && x < MW && y < MH) c.fillRect(x, y, q, q);
    c.strokeStyle = 'rgba(60,40,20,0.5)'; c.lineWidth = 14; c.strokeRect(-7, -7, MW + 14, MH + 14);

    // pedras
    for (const p of pedras) {
      if (!ve(p.x, p.y, p.r)) continue;
      const sx = p.abana > 0 ? Math.sin(t * 60) * 4 : 0;
      sombra(c, p.x, p.y + p.r * 0.6, p.r);
      if (p.aberta) {
        c.fillStyle = '#9e9e9e';
        for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(p.x + Math.cos(i * 1.7) * 26, p.y + Math.sin(i * 1.7) * 18, 14, 0, TAU); c.fill(); }
      } else {
        c.fillStyle = '#8a8a8a'; c.beginPath(); c.ellipse(p.x + sx, p.y, p.r, p.r * 0.8, 0, 0, TAU); c.fill();
        c.fillStyle = '#a7a7a7'; c.beginPath(); c.ellipse(p.x + sx - 12, p.y - 12, p.r * 0.5, p.r * 0.35, 0, 0, TAU); c.fill();
        c.strokeStyle = '#555'; c.lineWidth = 3;
        for (let i = 0; i < 3 - p.hp; i++) { c.beginPath(); c.moveTo(p.x - 20 + i * 18, p.y - 25); c.lineTo(p.x - 8 + i * 18, p.y + 5); c.stroke(); }
      }
    }
    // arbustos
    for (const a of arbustos) {
      if (!ve(a.x, a.y, a.r)) continue;
      const sx = a.abana > 0 ? Math.sin(t * 50) * 5 * (a.abana / 0.5) : 0;
      if (a.aberto) {
        c.fillStyle = 'rgba(40,110,40,0.35)'; c.beginPath(); c.ellipse(a.x, a.y + 6, a.r * 0.8, a.r * 0.4, 0, 0, TAU); c.fill();
        continue;
      }
      sombra(c, a.x, a.y + a.r * 0.55, a.r);
      c.fillStyle = a.cor || z.arbusto;
      for (let i = 0; i < 5; i++) {
        const aa = i / 5 * TAU;
        c.beginPath(); c.arc(a.x + sx + Math.cos(aa) * a.r * 0.45, a.y + Math.sin(aa) * a.r * 0.35, a.r * 0.6, 0, TAU); c.fill();
      }
      c.fillStyle = 'rgba(255,255,255,0.13)';
      c.beginPath(); c.arc(a.x + sx - a.r * 0.25, a.y - a.r * 0.3, a.r * 0.35, 0, TAU); c.fill();
    }
    // moedas e bagas
    for (const m of moedas) {
      if (!ve(m.x, m.y, 30)) continue;
      sombra(c, m.x, m.y + 10, 10);
      if (m.baga) {
        c.fillStyle = '#e63946'; c.beginPath(); c.arc(m.x, m.y - m.z, 11, 0, TAU); c.fill();
        c.fillStyle = '#2d8a3e'; c.fillRect(m.x - 2, m.y - m.z - 16, 4, 7);
      } else moeda(c, m.x, m.y - m.z, 13, t + m.x);
    }

    // selvagens (ordenados por y)
    const gente = inimigos.map(function (e) { return { e: e, y: e.y }; });
    gente.push({ bulba: true, y: b.y });
    if (boss) gente.push({ boss: true, y: boss.y });
    gente.sort(function (p, q2) { return p.y - q2.y; });
    for (const g of gente) {
      if (g.bulba) desenhaBulba(c, t);
      else if (g.boss) desenhaBoss(c, t);
      else {
        const e = g.e;
        if (!ve(e.x, e.y, 60)) continue;
        c.globalAlpha = Math.max(0, Math.min(1, e.fade));
        sombra(c, e.x, e.y + 26, 24);
        const bob = e.tonto > 0 ? 0 : Math.sin(t * 10 + e.x) * 3;
        poke(c, e.d.pid, e.x, e.y - bob, 72, e.vx > 0 ? -1 : 1, '#c44', e.d.n);
        if (e.pisca > 0) { c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(e.x, e.y, 30, 0, TAU); c.fill(); }
        if (e.tonto > 0 && !e.foi) estrelinhas(c, e.x, e.y - 38, t);
        if (e.foi) { c.font = '22px system-ui'; c.textAlign = 'center'; c.fillText('💚', e.x, e.y - 44); }
        c.globalAlpha = 1;
      }
    }

    // folhas e bolas
    for (const f of folhas) folha(c, f.x, f.y, f.rot, 12);
    for (const o of bolas) {
      c.fillStyle = o.cor; c.beginPath(); c.arc(o.x, o.y, o.r, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.arc(o.x - o.r * 0.3, o.y - o.r * 0.3, o.r * 0.35, 0, TAU); c.fill();
    }
    for (const p of parts) {
      c.globalAlpha = 1 - p.age / p.vida;
      if (p.brilho) { c.fillStyle = p.cor; c.font = '16px system-ui'; c.textAlign = 'center'; c.fillText('✨', p.x, p.y); }
      else folha(c, p.x, p.y, p.rot + p.age * 8, p.r);
    }
    c.globalAlpha = 1;
    for (const x of textos) {
      c.globalAlpha = 1 - x.age / 1.3;
      c.font = 'bold 26px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,0.5)'; c.strokeText(x.t, x.x, x.y);
      c.fillStyle = x.cor; c.fillText(x.t, x.x, x.y);
    }
    c.globalAlpha = 1;
    c.restore();

    desenhaSeta(c, t);
    hud(c, t);
  };

  function estrelinhas(c, x, y, t) {
    c.font = '16px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let i = 0; i < 3; i++) { const a = t * 5 + i * TAU / 3; c.fillText('⭐', x + Math.cos(a) * 22, y + Math.sin(a) * 7); }
  }

  function desenhaBulba(c, t) {
    // vinhas do chicote
    if (chicote) {
      const p = chicote.t / chicote.dur, alc = Math.sin(Math.min(1, p) * Math.PI) * DIF.CHICOTE_R;
      c.strokeStyle = '#2e7d32'; c.lineCap = 'round';
      for (let k = 0; k < 2; k++) {
        const a0 = (k ? Math.PI : 0) + p * TAU * 1.1 + b.ang;
        const ex = b.x + Math.cos(a0) * alc, ey = b.y + Math.sin(a0) * alc;
        const mx = b.x + Math.cos(a0 - 0.6) * alc * 0.55, my = b.y + Math.sin(a0 - 0.6) * alc * 0.55;
        c.lineWidth = 9; c.beginPath(); c.moveTo(b.x, b.y - 18); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
        c.strokeStyle = '#66bb6a'; c.lineWidth = 4; c.beginPath(); c.moveTo(b.x, b.y - 18); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
        c.strokeStyle = '#2e7d32';
        folha(c, ex, ey, a0, 16);
      }
      c.strokeStyle = 'rgba(102,187,106,0.35)'; c.lineWidth = 3;
      c.beginPath(); c.arc(b.x, b.y, alc, 0, TAU); c.stroke();
    }
    if (b.inv > 0 && Math.floor(t * 14) % 2 === 0 && estado !== 'descansa') c.globalAlpha = 0.45;
    sombra(c, b.x, b.y + 28, 30);
    const bob = Math.hypot(b.vx, b.vy) > 30 ? Math.abs(Math.sin(t * 12)) * 5 : 0;
    poke(c, 1, b.x, b.y - bob, 92, -b.vira, '#4caf50', 'Bulbasaur');
    c.globalAlpha = 1;
    if (b.tonto > 0 || estado === 'descansa') estrelinhas(c, b.x, b.y - 46, t);
    // anel a dizer que somos nós
    c.strokeStyle = 'rgba(255,214,10,0.8)'; c.lineWidth = 3;
    c.beginPath(); c.ellipse(b.x, b.y + 30, 34, 12, 0, 0, TAU); c.stroke();
  }

  function desenhaBoss(c, t) {
    const k = boss;
    const tam = k.r * 2.4;
    let x = k.x, y = k.y;
    if (k.fase === 'aviso') { x += Math.sin(t * 70) * 6; }
    sombra(c, k.x, k.y + k.r * 0.8, k.r);
    if (k.acorda > 0) c.globalAlpha = 1 - k.acorda / 1.6 * 0.7;
    poke(c, k.d.pid, x, y - (k.acorda > 0 ? k.acorda * 30 : 0), tam, b.x > k.x ? -1 : 1, k.d.cor, k.d.n);
    c.globalAlpha = 1;
    if (k.fase === 'aviso') {
      c.strokeStyle = 'rgba(255,60,60,0.7)'; c.lineWidth = 6;
      c.beginPath(); c.moveTo(k.x, k.y); c.lineTo(k.x + k.cx * 420, k.y + k.cy * 420); c.stroke();
      c.font = 'bold 40px system-ui'; c.textAlign = 'center'; c.fillText('❗', k.x, k.y - k.r - 30);
    }
    if (k.pisca > 0) { c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.arc(k.x, k.y, k.r, 0, TAU); c.fill(); }
    if (k.vencido) {
      estrelinhas(c, k.x, k.y - k.r - 10, t);
      c.font = '40px system-ui'; c.textAlign = 'center'; c.fillText('💚', k.x, k.y - k.r - 50 - Math.sin(t * 3) * 6);
    }
  }

  // seta na borda do ecrã a apontar para o Pokémon grande
  function desenhaSeta(c, t) {
    if (!boss || boss.vencido) return;
    const sx = (boss.x - cam.x) * zoom, sy = (boss.y - cam.y) * zoom;
    if (sx > 0 && sx < G.W && sy > 0 && sy < G.H) return;
    const a = Math.atan2(sy - G.H / 2, sx - G.W / 2);
    const x = clamp(sx, 40, G.W - 40), y = clamp(sy, 90, G.H - 40);
    c.save(); c.translate(x, y); c.rotate(a);
    c.fillStyle = '#ff3b3b'; c.beginPath(); c.moveTo(22, 0); c.lineTo(-12, -16); c.lineTo(-12, 16); c.closePath(); c.fill();
    c.restore();
  }

  function hud(c, t) {
    const W = G.W;
    c.save();
    c.textBaseline = 'middle'; c.textAlign = 'left';
    // moedas
    const caixa = function (x, y, w, h) { c.fillStyle = 'rgba(0,0,0,0.38)'; c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, 14) : c.rect(x, y, w, h); c.fill(); };
    caixa(70, 10, 190, 44);
    moeda(c, 96, 32, 14, t);
    c.fillStyle = '#fff'; c.font = 'bold 24px system-ui, sans-serif';
    c.fillText(apanhadas + ' / ' + Z().moedas, 118, 33);
    // corações
    caixa(270, 10, 34 * DIF.CORACOES + 16, 44);
    c.font = '24px system-ui';
    for (let i = 0; i < DIF.CORACOES; i++) { c.globalAlpha = i < b.hp ? 1 : 0.25; c.fillText('❤️', 280 + i * 34, 33); }
    c.globalAlpha = 1;
    // zona
    c.textAlign = 'right'; c.font = 'bold 16px system-ui, sans-serif';
    c.fillStyle = 'rgba(0,0,0,0.45)';
    const nome = (zona + 1) + '/' + ZONAS.length + ' ' + Z().nome + (volta > 1 ? ' ★' + volta : '');
    c.fillText(nome, W - 13, 71); c.fillStyle = '#fff'; c.fillText(nome, W - 14, 70);
    // vida do Pokémon grande
    if (boss && !boss.vencido) {
      const bw = Math.min(360, W - 40), bx = (W - bw) / 2, by = 64;
      c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(bx - 4, by - 4, bw + 8, 26);
      c.fillStyle = '#ff4d4d'; c.fillRect(bx, by, bw * Math.max(0, boss.hp / boss.max), 18);
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 14px system-ui, sans-serif';
      c.fillText(boss.d.n, W / 2, by + 9);
    }
    c.restore();
  }

  /* ---------- para testar ---------- */
  S.api = {
    estado: function () { return { zona: zona, volta: volta, moedas: apanhadas, precisa: Z().moedas, hp: b.hp, estado: estado, inimigos: inimigos.length, boss: boss ? boss.hp : null, moedasNoChao: moedas.length, escondidas: arbustos.filter(function (a) { return a.tem === 'moeda' && !a.aberto; }).length + pedras.filter(function (p) { return !p.aberta; }).length * 2 }; },
    daMoedas: function (n) { apanhadas += n; if (estado === 'jogo' && apanhadas >= Z().moedas) acordaBoss(); },
    venceBoss: function () { if (boss) bateBoss(9999); },
    zona: function (n) { zona = n; montaZona(); }
  };

  G.scenes = G.scenes || {};
  G.scenes.bulbasaur = S;
})();
