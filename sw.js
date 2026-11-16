// Fonctionnement hors ligne : toute l'app est mise en cache à l'installation.
const VERSION = 'mesaicosa-v2.2.1';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css', 'css/actus.css',
  'js/app.js', 'js/editor.js', 'js/crypto.js', 'js/store.js', 'js/schedule.js', 'js/content.js', 'js/content-typing.js', 'js/content-reading.js',
  'js/modules/typing.js', 'js/modules/mental.js', 'js/modules/geo.js', 'js/modules/reading.js', 'js/modules/srs-ui.js', 'js/modules/memo.js', 'js/modules/cards.js', 'js/modules/actus.js', 'js/geodata.js', 'data/outremer.json', 'js/modules/finance.js', 'js/modules/bible.js', 'js/srs.js', 'js/cards-finance.js', 'js/cards-bible.js',
  'vendor/geo.js', 'data/world.json', 'data/countries.json', 'data/flags.json',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== 'mesaicosa-news').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // actus : toujours la version la plus récente si le réseau répond, sinon la dernière enregistrée
  if (new URL(e.request.url).pathname.includes('/news/')) {
    e.respondWith(fetch(e.request, { cache: 'no-store' }).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open('mesaicosa-news').then(c => c.put(e.request.url.split('?')[0], copy)); }
      return res;
    }).catch(() => caches.open('mesaicosa-news').then(c => c.match(e.request.url.split('?')[0])).then(r => r || new Response('{}', { status: 503 }))));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
    const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return res;
  })));
});
