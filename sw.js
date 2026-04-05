/* ── LOLance Service Worker — Offline Support ─────────────────── */
'use strict';

const CACHE_VERSION = 'lolance-v1';
const STATIC_CACHE = CACHE_VERSION + '-static';
const API_CACHE = CACHE_VERSION + '-api';

// Static assets to pre-cache for offline shell
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/js/main.js',
  '/js/i18n.js',
  '/js/constants.js',
  '/js/state.js',
  '/js/api.js',
  '/js/utils.js',
  '/js/router.js',
  '/js/shell.js',
  '/js/event-delegation.js',
  '/js/virtual-scroll.js',
  '/js/lazy-images.js',
  '/js/pages/auth.js',
  '/js/pages/verify.js',
  '/js/pages/dashboard.js',
  '/js/pages/tasks.js',
  '/js/pages/create-task.js',
  '/js/pages/feed.js',
  '/js/pages/wallet.js',
  '/js/pages/chat.js',
  '/js/pages/support.js',
  '/js/pages/profile.js',
  '/js/pages/leaderboard.js',
  '/js/pages/landing.js',
  '/js/pages/dm.js',
  '/js/pages/mini-games.js',
  '/assets/favicon.svg',
  '/assets/lolance-logo.svg',
  '/assets/icon-192.svg',
  '/assets/icon-512.svg',
  '/manifest.json',
  '/js/focus-trap.js',
];

// Install: pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('lolance-') && key !== STATIC_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // API requests: Network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCache(request));
    return;
  }

  // Static assets: Cache-first with network fallback
  event.respondWith(cacheFirstWithNetwork(request));
});

// Cache-first strategy for static assets
async function cacheFirstWithNetwork(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Offline fallback — return the cached index.html for navigation
    if (request.mode === 'navigate') {
      const fallback = await caches.match('/index.html');
      if (fallback) return fallback;
    }
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Network-first strategy for API calls
async function networkFirstWithCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Offline: serve from API cache if available
    const cached = await caches.match(request);
    if (cached) return cached;

    return new Response(
      JSON.stringify({ success: false, message: 'Offline — дані з кешу недоступні' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
