/* =======================================================
   Mioshie Zenshu — Service Worker (DEV MODE — sem cache)
   Para reativar: restaurar sw.full.js
   ======================================================= */

// Ao instalar: limpar todos os caches e se desregistrar
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.registration.unregister())
  );
});

// Sem interceptação — todas as requests vão direto à rede
