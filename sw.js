const CACHE_NAME = 'dtinh-home-modules-v3-__BUILD__';
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css?v=__BUILD__',
  './preview.css?v=__BUILD__',
  './js/app.js?v=__BUILD__',
  './js/content.js?v=__BUILD__',
  './js/utils.js?v=__BUILD__',
  './js/themes.js?v=__BUILD__',
  './js/updates.js?v=__BUILD__',
  './js/faq.js?v=__BUILD__',
  './js/donate.js?v=__BUILD__',
  './js/preview.js?v=__BUILD__',
  './js/notifications.js?v=__BUILD__',
  './content/site.js?v=__BUILD__',
  './content/themes.js?v=__BUILD__',
  './content/update.js?v=__BUILD__',
  './content/faq.js?v=__BUILD__',
  './content/donate.js?v=__BUILD__',
  './content/links.js?v=__BUILD__',
  './assets/dtinh.webp',
  './assets/snowviet.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith('dtinh-home-') && key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith('.webp')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
        }
        return response;
      }))
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy)));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
