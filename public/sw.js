const APP_CACHE = 'echevia-v13'
const MEDIA_CACHE = 'echevia-media-v1'
const BASE = self.location.pathname.replace(/sw\.js$/, '')
const PRECACHE = [BASE, `${BASE}index.html`, `${BASE}manifest.webmanifest`, `${BASE}favicon.png`]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(APP_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('echevia-v') && key !== APP_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

function isMediaRequest(request) {
  if (request.method !== 'GET') return false
  const dest = request.destination
  if (dest === 'image' || dest === 'video' || dest === 'audio') return true
  const url = request.url
  if (url.includes('/api/')) return false
  return (
    /r2\.dev|r2\.cloudflarestorage|\/plants\/(photo|video)\//i.test(url) ||
    /\.(jpe?g|png|webp|gif|avif|svg|mp4|webm|mov|m4v)(\?|$)/i.test(url)
  )
}

function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cached) => {
      const networked = fetch(request)
        .then((response) => {
          if (response && (response.ok || response.type === 'opaque')) {
            void cache.put(request, response.clone())
          }
          return response
        })
        .catch(() => cached)
      return cached || networked
    }),
  )
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (isMediaRequest(event.request)) {
    event.respondWith(cacheFirst(event.request, MEDIA_CACHE))
    return
  }
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          void caches.open(APP_CACHE).then((cache) => cache.put(event.request, copy))
        }
        return response
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match(BASE))),
  )
})
