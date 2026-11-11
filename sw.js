// Fonctionnement hors ligne : toute l'app est mise en cache à l'installation.
const VERSION = 'mesaicosa-v1.5.0';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/app.js', 'js/editor.js', 'js/crypto.js', 'js/store.js', 'js/schedule.js', 'js/content.js', 'js/content-typing.js', 'js/content-reading.js',
  'js/modules/typing.js', 'js/modules/mental.js', 'js/modules/geo.js', 'js/modules/reading.js',
  'vendor/geo.js', 'data/world.json', 'data/countries.json',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
    const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return res;
  })));
});
