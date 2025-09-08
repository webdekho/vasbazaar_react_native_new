// vasbazaar PWA Service Worker
const CACHE_NAME = 'vasbazaar-pwa-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// Install service worker and cache resources
self.addEventListener('install', (event) => {
  console.log('🔧 [SW] Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 [SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ [SW] Service Worker installed');
        return self.skipWaiting();
      })
  );
});

// Activate service worker and clean up old caches
self.addEventListener('activate', (event) => {
  console.log('⚡ [SW] Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ [SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ [SW] Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch handler with network-first strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response for caching
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request);
      })
  );
});

// Handle beforeinstallprompt event
self.addEventListener('beforeinstallprompt', (event) => {
  console.log('📱 [SW] beforeinstallprompt event fired');
  // Let the PWA component handle the prompt
  event.preventDefault();
});

// Handle app installation
self.addEventListener('appinstalled', (event) => {
  console.log('✅ [SW] PWA was installed');
});