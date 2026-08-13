/**
 * service-worker.js
 * ------------------------------------------------------------------------
 * Two caches are used:
 *   SHELL_CACHE   - the app shell: HTML, CSS, JS, icons. Precached on
 *                    install, kept fresh via network-first for navigation
 *                    requests and background revalidation for everything else.
 *   RUNTIME_CACHE - anything same-origin that isn't part of the known shell
 *                    (a safety net, not the primary strategy).
 *
 * Bump CACHE_VERSION on every deploy that changes any precached file.
 * Old caches are removed automatically on activate.
 * ------------------------------------------------------------------------
 */

const CACHE_VERSION = "v17";
const SHELL_CACHE = `shopping-list-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `shopping-list-runtime-${CACHE_VERSION}`;
const CURRENT_CACHES = [SHELL_CACHE, RUNTIME_CACHE];

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/privacy.html",
  "/manifest.json",

  "/css/style.css",
  "/css/tokens.css",

  "/js/defaults.js",
  "/js/storage.js",
  "/js/catalog.js",
  "/js/shopping.js",
  "/js/ui.js",
  "/js/settings.js",
  "/js/lists.js",
  "/js/app.js",
  "/js/pwa.js",

  "/assets/images/LOGO%20pill%20dark.png",

  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png",
  "/assets/icons/icon-512-maskable.png",
  "/assets/icons/favicon-16.png",
  "/assets/icons/favicon-32.png",
  "/assets/icons/apple-touch-icon.png",

  "/assets/fonts/montserrat-latin-400-normal.woff2",
  "/assets/fonts/montserrat-latin-500-normal.woff2",
  "/assets/fonts/montserrat-latin-600-normal.woff2",
  "/assets/fonts/montserrat-latin-700-normal.woff2",
  "/assets/fonts/montserrat-latin-800-normal.woff2"
];

// ------------------------------------------------------------------
// Install: precache the app shell.
// ------------------------------------------------------------------
// Individual files are added with cache.add() rather than a single
// cache.addAll() call. addAll() is atomic - if even one URL 404s, the
// whole precache (and therefore the whole install) fails and rolls back,
// silently, unless the caller checks for it. Precaching each file
// independently means one missing/renamed asset can't take down the
// entire offline shell; it's just logged and the rest still succeed.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((error) => {
            console.warn(`[service-worker] Failed to precache ${url}:`, error);
          })
        )
      )
    )
  );
  // Note: no self.skipWaiting() here. The new worker deliberately stays
  // in the "waiting" state until the person clicks "Update Now" in the
  // app, which sends the SKIP_WAITING message handled below. This is
  // what makes the update banner meaningful rather than cosmetic.
});

// ------------------------------------------------------------------
// Activate: drop any cache that isn't one of this version's caches,
// then take control of any already-open clients.
// ------------------------------------------------------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !CURRENT_CACHES.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ------------------------------------------------------------------
// Fetch
// ------------------------------------------------------------------
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;
  if (!request.url.startsWith(self.location.origin)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstForNavigation(request));
    return;
  }

  event.respondWith(cacheFirstWithRevalidate(request));
});

/**
 * For HTML navigations: prefer a fresh network response so a deploy is
 * visible as soon as possible, but fall back to the cached shell when
 * offline. The cache is kept warm with whatever the network returns.
 */
async function networkFirstForNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(SHELL_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || caches.match("/index.html");
  }
}

/**
 * For static assets (CSS, JS, icons): serve from cache immediately for
 * speed, then quietly fetch a fresh copy in the background to update the
 * cache for next time. Falls back to the network if nothing is cached yet.
 */
async function cacheFirstWithRevalidate(request) {
  const cached = await caches.match(request);

  const revalidate = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse && networkResponse.ok) {
        const cache = await caches.open(SHELL_CACHE);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);

  if (cached) {
    // Update the cache in the background; the caller doesn't wait on this.
    revalidate;
    return cached;
  }

  const fresh = await revalidate;
  if (fresh) return fresh;

  // Nothing cached and the network failed too - fall back to whatever's
  // in the runtime cache on the off chance it was captured there.
  const runtimeCache = await caches.open(RUNTIME_CACHE);
  const runtimeMatch = await runtimeCache.match(request);
  if (runtimeMatch) return runtimeMatch;

  return new Response("Offline and this file was never cached.", {
    status: 503,
    statusText: "Offline"
  });
}

// ------------------------------------------------------------------
// Message: only skip waiting when explicitly told to by the app,
// via the SKIP_WAITING contract in js/pwa.js.
// ------------------------------------------------------------------
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
