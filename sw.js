const CACHE_NAME = 'dtinh-home-v__BUILD__';
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css?v=__BUILD__',
  './preview.css?v=__BUILD__',
  './content/site.js?v=__BUILD__',
  './content/themes.js?v=__BUILD__',
  './content/update.js?v=__BUILD__',
  './content/faq.js?v=__BUILD__',
  './content/donate.js?v=__BUILD__',
  './content/links.js?v=__BUILD__',
  './content.js?v=__BUILD__',
  './github-download-filter.js?v=__BUILD__',
  './script.js?v=__BUILD__',
  './preview.js?v=__BUILD__',
  './assets/dtinh.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Network-first: always try to get the latest file first.
  // Cache is only used as a fallback when there's no network (offline).
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
