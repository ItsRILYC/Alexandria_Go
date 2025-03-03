const CACHE_NAME = 'training-app-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  // jsPDF komt via CDN, die wordt apart gecached door de browser
];

// Installatie
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then(cache => {
      console.log('Caching assets...');
      return cache.addAll(urlsToCache);
    })
  );
});

// Ophalen van verzoeken
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
    .then(response => {
      // Return cached asset of haal op van netwerk
      return response || fetch(event.request);
    })
  );
});

// Activatie en oude caches opruimen
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys()
    .then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
