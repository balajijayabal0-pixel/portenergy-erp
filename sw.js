/* Port Energy ERP launcher - caches only this small launcher (logo, splash). ERP data always comes live from Google. */
const CACHE = 'pe-launcher-v3';
const FILES = ['./', './index.html', './config.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/logo-full.png'];
// Cache each file separately, so one missing file does not stop the whole install
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => null)))));
  self.skipWaiting();
});
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin) return;               // never touch Google / ERP traffic
  // cache first = instant start; refresh the copy in the background for next time
  const net = fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; });
  e.respondWith(caches.match(e.request).then(hit => hit || net.catch(() => caches.match('./index.html'))));
  e.waitUntil(net.catch(() => null));
});
