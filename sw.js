// Service Worker for Lenox French Academy
const CACHE_NAME = 'lenox-french-v1';
const STATIC_CACHE = 'lenox-static-v1';
const DYNAMIC_CACHE = 'lenox-dynamic-v1';

// Files to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/signup.html',
  '/dashboard.html',
  '/certificate.html',
  '/profile.html',
  '/styles/main.css',
  '/js/auth.js',
  '/js/progress.js',
  '/js/gamification.js',
  '/js/flashcards.js',
  '/js/puzzles.js',
  '/js/sounds.js',
  '/manifest.json',
  '/offline.html'
];

// Level pages to cache
const LEVEL_PAGES = [
  '/levels/a1/index.html',
  '/levels/a2/index.html',
  '/levels/b1/index.html',
  '/levels/b2/index.html'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log('[SW] Caching static assets');
      return cache.addAll([...STATIC_ASSETS, ...LEVEL_PAGES]);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => caches.delete(key))
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Handle API-like requests differently
  if (url.pathname.includes('/api/')) {
    event.respondWith(networkFirst(event.request));
    return;
  }
  
  // Handle static assets
  if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset))) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  
  // Handle lesson pages
  if (url.pathname.includes('/levels/')) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  
  // Default strategy
  event.respondWith(networkFirst(event.request));
});

// Cache-first strategy
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    console.log('[SW] Returning cached:', request.url);
    return cached;
  }
  
  try {
    const response = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    console.log('[SW] Network failed for:', request.url);
    return caches.match('/offline.html');
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', request.url);
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match('/offline.html');
  }
}

// Background sync for offline quiz submissions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-quiz') {
    event.waitUntil(syncQuizData());
  }
});

async function syncQuizData() {
  const db = await openIndexedDB();
  const pendingQuizzes = await db.getAll('pendingQuizzes');
  
  for (const quiz of pendingQuizzes) {
    try {
      await fetch('/api/save-quiz', {
        method: 'POST',
        body: JSON.stringify(quiz),
        headers: { 'Content-Type': 'application/json' }
      });
      await db.delete('pendingQuizzes', quiz.id);
    } catch (error) {
      console.log('Failed to sync quiz:', error);
    }
  }
}

// Push notification handler
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data.url;
  event.waitUntil(
    clients.openWindow(url)
  );
});