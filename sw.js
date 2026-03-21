/* =======================================================
   Mioshie Zenshu — Service Worker
   Strategy: stale-while-revalidate for assets,
             network-first for JSON data
   ======================================================= */

const CACHE_NAME = 'mioshie-v3';
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

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Partial failures are OK — just cache what we can
      });
    })
  );
  self.skipWaiting();
});

// Activate: purge old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: stale-while-revalidate for static assets, network-first for JSON data
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // Network-first for JSON data (large files, always want fresh)
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

  // Stale-while-revalidate for everything else
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
