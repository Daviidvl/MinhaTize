// Service Worker — Minha Tize
// Estratégia: network-first para HTML; cache-first para assets com hash; skip API

const CACHE_VERSION = 'v3'
const CACHE_NAME = `minha-tize-${CACHE_VERSION}`

// Recursos pré-cacheados no install (shell do app)
const SHELL = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL))
  )
  self.skipWaiting()
})

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  )
  self.clients.claim()
})

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Nunca interceptar rotas da API ou requests não-GET
  if (request.method !== 'GET') return
  if (url.pathname.startsWith('/serveless/')) return

  // Requests cross-origin (Google Fonts, CDNs): deixar passar sem cache
  if (url.origin !== self.location.origin) return

  // Assets com hash no nome (JS/CSS do Vite): cache-first (não mudam após gerados)
  const isHashedAsset = url.pathname.startsWith('/assets/')
  if (isHashedAsset) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone()
              caches.open(CACHE_NAME).then((c) => c.put(request, clone))
            }
            return response
          })
      )
    )
    return
  }

  // HTML / navegação: network-first, fallback ao shell cacheado
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((c) => c.put(request, clone))
        }
        return response
      })
      .catch(() =>
        caches.match(request).then(
          (cached) =>
            cached ||
            caches.match('/').then(
              (shell) =>
                shell ||
                new Response('<h1>Offline</h1>', {
                  status: 503,
                  headers: { 'Content-Type': 'text/html' },
                })
            )
        )
      )
  )
})
