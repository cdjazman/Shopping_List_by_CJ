const CACHE_NAME = "shopping-list-v8";

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",

  "/css/style.css",

  "/js/app.js",
  "/js/catalog.js",
  "/js/defaults.js",
  "/js/lists.js",
  "/js/settings.js",
  "/js/shopping.js",
  "/js/storage.js",
  "/js/ui.js",

  "/assets/images/LOGO.png",

  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png",
  "/assets/icons/icon-512-maskable.png"
];

// Install
self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
  );
});

// Activate
self.addEventListener("activate", event => {

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );

});

// Network first
self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") return;

  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(

    fetch(event.request)

      .then(response => {

        const clone = response.clone();

        caches.open(CACHE_NAME)
          .then(cache => cache.put(event.request, clone));

        return response;

      })

      .catch(() => caches.match(event.request))

  );

});

// Allow page to activate updates immediately
self.addEventListener("message", event => {

  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }

});