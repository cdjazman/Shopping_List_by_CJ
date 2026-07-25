const CACHE_NAME = "shopping-list-v6";
const ASSETS = [
  "./index.html",
  "./manifest.json",
  "./icon-48.png",
  "./icon-72.png",
  "./icon-96.png",
  "./icon-128.png",
  "./icon-144.png",
  "./icon-152.png",
  "./icon-192.png",
  "./icon-384.png",
  "./icon-512.png",
  "./icon-512-maskable.png"
];

// Install: Cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Activate: Clean up old caches & claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: Direct GitHub sync requests to network, Network-First for HTML (so updates hit mobile immediately)
self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("api.github.com")) {
    return; // Sync requests go straight to network
  }

  // Network-first strategy for navigation / HTML page requests
  if (event.request.mode === 'navigate' || event.request.url.endsWith('index.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first strategy for static assets (icons, etc.)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => cached);
    })
  );
});

// Listen for message from app to immediately activate new version
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
