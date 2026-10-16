/* Service worker: o jogo instala-se no telemóvel e abre sem internet.

   - Ficheiros do jogo: primeiro a rede (assim um jogo novo ou uma correção aparece
     logo à primeira), e a cópia guardada só quando não há internet ou a rede demora
     mais de 4 s.
   - Imagens dos Pokémon (PokeAPI): guardam-se à medida que aparecem, para os
     Pokémon que já saíram também se verem sem internet.
   Ao acrescentar um ficheiro .js novo ao jogo, juntá-lo à lista JOGO. */
const CACHE = 'jogos-isaac-v3';
const IMAGENS = 'jogos-isaac-pokemon-v1';
const JOGO = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png',
  'js/ash.js',
  'js/audio.js',
  'js/barbie.js',
  'js/carros.js',
  'js/castle.js',
  'js/cobras.js',
  'js/damas.js',
  'js/dragao.js',
  'js/egito.js',
  'js/escape.js',
  'js/flight.js',
  'js/futebol.js',
  'js/gfx.js',
  'js/input.js',
  'js/jungle.js',
  'js/legos.js',
  'js/main.js',
  'js/marvel.js',
  'js/mauzoes.js',
  'js/morcegos.js',
  'js/ninja.js',
  'js/parachute.js',
  'js/pista.js',
  'js/pokemon.js',
  'js/viuvas.js',
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(JOGO); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE && k !== IMAGENS; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    e.respondWith(caches.open(CACHE).then(function (c) {
      const guardado = function () {
        return c.match(req, { ignoreSearch: true }).then(function (r) { return r || c.match('index.html'); });
      };
      const rede = fetch(req).then(function (r) {
        if (r && r.ok) c.put(req, r.clone());
        return r;
      });
      const lenta = new Promise(function (ok) { setTimeout(ok, 4000); }).then(guardado);
      return Promise.race([rede, lenta]).catch(guardado).then(function (r) { return r || rede; });
    }));
    return;
  }

  if (url.hostname === 'raw.githubusercontent.com' || url.hostname === 'pokeapi.co') {
    e.respondWith(caches.open(IMAGENS).then(function (c) {
      return c.match(req).then(function (guardado) {
        return guardado || fetch(req).then(function (r) {
          if (r && r.ok) c.put(req, r.clone());
          return r;
        });
      });
    }));
  }
});
