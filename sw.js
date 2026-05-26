const CACHE_NAME = 'vetindent-cache-v1';

// ഓഫ്‌ലൈനായി പ്രവർത്തിക്കാൻ ക്യാഷ് (Cache) ചെയ്യേണ്ട ഫയലുകൾ
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './vet.xlsx',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js',
  'https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap'
];

// 1. Install Event - ഫയലുകൾ ക്യാഷ് ചെയ്യുന്നു
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching all assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Activate Event - പഴയ ക്യാഷുകൾ കളയുന്നു
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Event - Stale-while-revalidate Strategy
// ആദ്യം ക്യാഷിൽ ഉണ്ടോ എന്ന് നോക്കും, ഉണ്ടെങ്കിൽ അത് കാണിക്കും, ഒപ്പം ബാക്ക്ഗ്രൗണ്ടിൽ പുതിയ ഡാറ്റ ഡൗൺലോഡ് ചെയ്ത് അപ്ഡേറ്റ് ചെയ്യും.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          // ഡാറ്റ അപ്ഡേറ്റ് ചെയ്യുന്നു
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(() => {
        // ഇന്റർനെറ്റ് ഇല്ലെങ്കിൽ എറർ വരാതിരിക്കാൻ
      });
      return cachedResponse || fetchPromise;
    })
  );
});