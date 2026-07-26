const CACHE_NAME = 'shopping-list-v2';
const PRECACHE_URLS = [
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './js/defaults.js',
  './assets/icons/icon-192.png',
  './assets/images/LOGO.png'
];

// Install event - cache core assets once
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate event - clean up old caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Always try the network first for HTML/app files, fall back to cache if offline
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests like API calls
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If we got a successful response from the network, clone it and update the cache
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // If the network fails (offline), fall back to the cached version
        return caches.match(event.request);
      })
  );
});

// Listen for message from app to skip waiting when a new version is found
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});