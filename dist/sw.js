// vasbazaar Development Service Worker
const CACHE_NAME = 'vasbazaar-dev-v1.0.0';

// Basic service worker for development
self.addEventListener('install', (event) => {
  console.log('🔧 [SW-Dev] Service Worker installing...');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('⚡ [SW-Dev] Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Simple fetch handler for development
self.addEventListener('fetch', (event) => {
  // Just pass through all requests in development
  event.respondWith(fetch(event.request));
});