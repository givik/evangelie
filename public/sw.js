const CACHE_NAME = 'bible-cache-v5';

const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icon.png',
  '/icon.svg',
  '/book.svg',
  '/candle-2-svgrepo-com.svg',
  '/candle-2-off-svgrepo-com.svg',
  '/cross-orthodox.svg',
  '/cross-orthodox-2.svg',
];

// Install: precache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }),
  );
  // Activate new SW immediately
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)),
      );
    }),
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch: network-first for navigations, stale-while-revalidate for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // For navigation requests (HTML pages): network-first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the fresh response
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          // Offline: serve from cache
          return caches.match(request).then((cached) => {
            return cached || caches.match('/');
          });
        }),
    );
    return;
  }

  // For Next.js RSC requests: do NOT intercept.
  // Let them pass through naturally so Next.js handles errors gracefully.
  // Returning fake responses causes infinite re-render loops.
  if (request.headers.get('RSC') === '1' || request.url.includes('_next/data')) {
    return;
  }

  // For static assets (JS, CSS, fonts, images): cache-first
  if (
    request.url.includes('/_next/static/') ||
    request.url.includes('/fonts/') ||
    request.url.match(/\.(js|css|woff|woff2|ttf|otf|png|jpg|svg|ico)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
            return response;
          })
          .catch(() => {
            return new Response('', { status: 408 });
          });
      }),
    );
    return;
  }

  // For everything else: network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, clone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(request);
      }),
  );
});
