/* =======================================================
   Mioshie Zenshu — Service Worker (PRODUÇÃO)
   Strategy: stale-while-revalidate para assets,
             network-first para dados JSON
   Para ativar: copiar este arquivo para sw.js
   ======================================================= */

const CACHE_NAME = 'mioshie-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/browse.html',
  '/reader.html',
  '/poems.html',
  '/kannon.html',
  '/johrei.html',
  '/timeline.html',
  '/library.html',
  '/search.html',
  '/css/styles.css',
  '/css/reader.css',
  '/css/library.css',
  '/css/browse.css',
  '/css/poems.css',
  '/js/app.js',
  '/js/reader.js',
  '/js/library.js',
  '/js/browse.js',
  '/js/poems.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith('/data/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }
  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(request).then(cached => {
        const fetched = fetch(request).then(response => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        }).catch(() => cached);
        return cached || fetched;
      })
    )
  );
});
