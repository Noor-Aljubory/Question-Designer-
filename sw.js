const CACHE_NAME = 'exam-designer-pwa-v3';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  const store = (response) => {
    if (response && (response.status === 200 || response.type === 'opaque')) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
    }
    return response;
  };

  // صفحة التطبيق: الشبكة أولاً (لتصل التحديثات فوراً) ثم النسخة المخزنة دون اتصال
  if (req.mode === 'navigate' || (url.origin === self.location.origin && /\.(html|json)$/.test(url.pathname))) {
    event.respondWith(
      fetch(req).then(store).catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
    );
    return;
  }

  // الخطوط والصور: من المخزن فوراً مع تحديثها في الخلفية
  event.respondWith(
    caches.match(req).then((cached) => {
      const fresh = fetch(req).then(store).catch(() => cached);
      return cached || fresh;
    })
  );
});
