/**
 * Loxy Progressive Web App (PWA) Service Worker
 * Secure offline caching for application shell and static assets.
 * 
 * CRITICAL SECURITY RULE:
 * Never cache API network requests (Supabase, HaveIBeenPwned, OAuth)
 * in service worker caches. Only immutable static assets and application shell.
 */

const CACHE_NAME = 'loxy-vault-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
];

// Install: precache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: purge stale caches and claim clients immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-while-revalidate for static assets, network-first for navigation, network-only for APIs
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never intercept or cache database or external API calls
  if (
    url.origin.includes('supabase.co') ||
    url.origin.includes('pwnedpasswords.com') ||
    url.origin.includes('google.com') ||
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/auth/')
  ) {
    return; // Pass through to network directly
  }

  // 2. Navigation requests: Network first with cached index.html fallback (Offline capability)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match('/index.html')) || (await cache.match('/'));
      })
    );
    return;
  }

  // 3. Static assets (JS, CSS, images, fonts): Cache-first with network background update
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') || STATIC_ASSETS.includes(url.pathname))
  ) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        const fetchPromise = fetch(request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default: network pass-through
  event.respondWith(fetch(request));
});
