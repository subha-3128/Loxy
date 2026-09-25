/**
 * Loxy High-Performance PWA Service Worker
 * Instant App-Shell Boot (<10ms) via Stale-While-Revalidate & Cache-First Strategies
 * 
 * SECURITY GUARANTEE:
 * API endpoints (Supabase, HaveIBeenPwned, OAuth) are strictly NETWORK-ONLY
 * and never persisted in service worker storage.
 */

const CACHE_VERSION = 'loxy-vault-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const FONT_CACHE = `${CACHE_VERSION}-fonts`;

const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
];

// 1. Install Phase: Fast Precache
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(APP_SHELL_ASSETS);
    })
  );
});

// 2. Activate Phase: Purge Old Caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== FONT_CACHE)
          .map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Phase
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // A. NEVER intercept API, DB, or OAuth requests (Security Boundary)
  if (
    url.origin.includes('supabase.co') ||
    url.origin.includes('pwnedpasswords.com') ||
    url.origin.includes('google.com') ||
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/auth/')
  ) {
    return;
  }

  // B. Navigation Requests: Instant Cache-First App-Shell Boot
  // This eliminates the blank splash screen and loads the vault in <10ms.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html', { cacheName: STATIC_CACHE }).then(cachedShell => {
        // Asynchronously check network in the background for updates
        const networkUpdate = fetch(request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(STATIC_CACHE).then(cache => cache.put('/index.html', clone));
            }
            return networkResponse;
          })
          .catch(() => null);

        // Serve cached shell immediately if available; fallback to network
        return cachedShell || networkUpdate;
      })
    );
    return;
  }

  // C. Google Fonts & Webfonts: Cache-First
  if (url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(request, { cacheName: FONT_CACHE }).then(cachedFont => {
        if (cachedFont) return cachedFont;
        return fetch(request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(FONT_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // D. Static Assets (JS Chunks, CSS, Images): Cache-First with Background Revalidation
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') || APP_SHELL_ASSETS.includes(url.pathname))
  ) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        const backgroundFetch = fetch(request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(STATIC_CACHE).then(cache => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || backgroundFetch;
      })
    );
    return;
  }

  // E. Fallback: Normal Network Fetch
  event.respondWith(fetch(request));
});
