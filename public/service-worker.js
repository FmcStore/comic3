const CACHE_NAME = 'fmc-comic-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // Cache-first strategy for images
  if (event.request.url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
        .then(response => {
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, response.clone()));
          return response;
        })
    );
  }
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
