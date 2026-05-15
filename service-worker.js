const CACHE = 'cortaja-v1';
const ASSETS = [
  '/cortaja/',
  '/cortaja/index.html',
  '/cortaja/dashboard.html',
  '/cortaja/booking.html',
  '/cortaja/style.css',
  '/cortaja/config.js',
  '/cortaja/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
