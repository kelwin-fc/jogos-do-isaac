/* O Zé: o amigo do Isaac que estava lá em casa (pedido do Isaac, 2026-11-12:
   "nos jogos meus todos põe também o meu amigo Zé, e ele diz no jogo 'vou já', 'que boa'").
   Aparece em todos os jogos (menos nos Legos da Nicole, que são da irmã): está a espreitar
   na borda esquerda do ecrã e, quando se ganha estrelas, entra a acenar e diz uma coisa com
   balão e com voz. Não mexe em nada do jogo: só desenha por cima e fala de vez em quando. */
(function () {
  window.G = window.G || {};

  const FORA = { legos: true };            // jogos onde o Zé não aparece
  const OLA = ['Olá! Sou o Zé, vou contigo!', 'Vou já, Isaac! Espera por mim!', 'O Zé também quer jogar!'];
  const BOAS = ['Boa, Isaac e Zé!', 'Que boa!', 'Vou já!', 'Que boa, Zé!', 'Boa, Isaac!', 'Uau! Que boa!', 'Vou já, vou já!', 'Isso! Boa!', 'Somos os maiores!'];
  const ESPERA = 14;                        // segundos, no mínimo, entre duas falas do Zé

  const Z = { cena: null, x: 0, fala: '', falaT: 0, ultima: -99, tempo: 0, i: 0, estrelas: 0 };

  function diz(txt) {
    Z.fala = txt; Z.falaT = 3.2; Z.ultima = Z.tempo;
    // voz de menino (mais aguda) e em fila, para não cortar o que o jogo está a dizer
    if (G.audio && G.audio.fala) G.audio.fala(txt, true, 1.55);
  }

  // quando se ganha estrelas, o Zé festeja (sem falar demasiadas vezes)
  Z.estrelas = function (n) {
    if (!Z.cena || FORA[Z.cena] || n <= 0) return;
    if (Z.tempo - Z.ultima < ESPERA) return;
    diz(BOAS[Z.i++ % BOAS.length]);
  };

  // um jogo pode pedir ao Zé que diga uma coisa (ex.: golo no futebol Pokémon)
  Z.diz = function (txt) {
    if (!Z.cena || FORA[Z.cena]) return;
    if (Z.tempo - Z.ultima < 4) return;
    diz(txt);
  };

  Z.entra = function (nome) {
    Z.cena = nome; Z.x = 0; Z.fala = ''; Z.falaT = 0;
    if (!nome || FORA[nome]) return;
    Z.ultima = Z.tempo;
    setTimeout(function () { if (Z.cena === nome) diz(OLA[Math.floor(Math.random() * OLA.length)]); }, 1800);
  };

  Z.desenha = function (c, dt, t) {
    Z.tempo += dt;
    if (!Z.cena || FORA[Z.cena]) return;
    Z.falaT = Math.max(0, Z.falaT - dt);
    const fora = Z.falaT > 0 ? 1 : 0.5;          // a falar entra todo; senão só espreita a cabeça
    Z.x += (fora - Z.x) * Math.min(1, dt * 6);
    const k = Math.max(0.95, Math.min(1.5, Math.min(G.W, G.H) / 420));
    const bx = -38 * k + Z.x * 64 * k, by = G.H * 0.44;
    c.save();
    c.translate(bx, by); c.scale(k, k);
    const acena = Z.falaT > 0 ? Math.sin(t * 9) * 0.5 : 0;
    // corpo: t-shirt verde e calções azuis
    c.fillStyle = '#2a9d8f'; c.strokeStyle = '#1d6f65'; c.lineWidth = 2;
    c.beginPath(); c.roundRect ? c.roundRect(-16, 4, 32, 30, 8) : c.rect(-16, 4, 32, 30); c.fill(); c.stroke();
    c.fillStyle = '#fff'; c.font = 'bold 13px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('Z', 0, 19);
    c.fillStyle = '#3a5a9c'; c.fillRect(-14, 32, 12, 12); c.fillRect(2, 32, 12, 12);
    c.fillStyle = '#f2c6a0'; c.fillRect(-12, 44, 8, 8); c.fillRect(4, 44, 8, 8);
    c.fillStyle = '#e63946'; c.fillRect(-14, 51, 12, 5); c.fillRect(2, 51, 12, 5);
    // braço a acenar
    c.save(); c.translate(14, 8); c.rotate(-1.9 + acena);
    c.fillStyle = '#2a9d8f'; c.fillRect(0, -5, 12, 10);
    c.fillStyle = '#f2c6a0'; c.fillRect(11, -4, 12, 8); c.beginPath(); c.arc(25, 0, 6, 0, Math.PI * 2); c.fill();
    c.restore();
    // cabeça
    c.fillStyle = '#f2c6a0'; c.strokeStyle = '#c99872';
    c.beginPath(); c.arc(0, -12, 17, 0, Math.PI * 2); c.fill(); c.stroke();
    // cabelo castanho
    c.fillStyle = '#6b3f1d';
    c.beginPath(); c.arc(0, -16, 17, Math.PI * 1.05, Math.PI * 1.95); c.fill();
    c.beginPath(); c.ellipse(-4, -27, 11, 5, -0.2, 0, Math.PI * 2); c.fill();
    // olhos e sorriso
    const pisca = (t % 4) < 0.12;
    c.fillStyle = '#222';
    if (pisca) { c.fillRect(-8, -13, 6, 2); c.fillRect(3, -13, 6, 2); }
    else { c.beginPath(); c.arc(-5, -12, 2.6, 0, Math.PI * 2); c.arc(6, -12, 2.6, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = '#7a2e1d'; c.lineWidth = 2;
    c.beginPath();
    if (Z.falaT > 0 && Math.sin(t * 16) > 0) c.ellipse(1, -3, 5, 4, 0, 0, Math.PI * 2);
    else c.arc(1, -6, 6, 0.2, Math.PI - 0.2);
    c.stroke();
    c.fillStyle = 'rgba(255,120,120,.45)'; c.beginPath(); c.arc(-10, -6, 3, 0, Math.PI * 2); c.arc(12, -6, 3, 0, Math.PI * 2); c.fill();
    c.restore();
    // o nome por baixo e o balão quando fala
    if (Z.x > 0.6) {
      c.save();
      c.font = 'bold ' + Math.round(14 * k) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#fff';
      c.strokeText('Zé', bx, by + 68 * k); c.fillText('Zé', bx, by + 68 * k);
      if (Z.fala && Z.falaT > 0) {
        c.font = 'bold ' + Math.round(17 * k) + 'px sans-serif';
        const w = c.measureText(Z.fala).width + 22 * k, h = 34 * k;
        const x = bx + 34 * k, y = by - 64 * k;
        c.globalAlpha = Math.min(1, Z.falaT * 3);
        c.fillStyle = '#fff'; c.strokeStyle = '#2a9d8f'; c.lineWidth = 3;
        c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, 12 * k) : c.rect(x, y, w, h); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(x + 10 * k, y + h - 1); c.lineTo(x - 2 * k, y + h + 14 * k); c.lineTo(x + 24 * k, y + h - 1); c.closePath(); c.fill();
        c.fillStyle = '#1d3557'; c.textAlign = 'left';
        c.fillText(Z.fala, x + 11 * k, y + h / 2 + 1);
      }
      c.restore();
    }
  };

  G.ze = Z;
})();
