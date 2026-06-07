// StudentHub Service Worker
const CACHE_NAME = 'student-hub-v1'

// Static assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// Install event – precache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// Activate event – clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

// Fetch event – network-first for API/auth, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return

  // Skip Next.js internals and API routes (always network)
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/')
  ) {
    return
  }

  // Network-first for page navigations to avoid serving stale HTML
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.open(CACHE_NAME).then((cache) => cache.match(request))
      )
    )
    return
  }

  // For page navigations and static assets: stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            // Cache only valid responses
            if (
              response &&
              response.status === 200 &&
              response.type === 'basic'
            ) {
              cache.put(request, response.clone())
            }
            return response
          })
          .catch(() => cached) // Fall back to cache on network error

        // Return cached immediately if available, fetch in background
        return cached || networkFetch
      })
    )
  )
})
