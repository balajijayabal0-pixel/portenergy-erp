/* © 2026 Port Energy Private Limited. All rights reserved. Proprietary and confidential. */
/**
 * PORT ENERGY ERP - app service worker
 * Keeps the app SCREENS on the phone / laptop so the app opens instantly.
 * ERP DATA is never cached here: every server call goes live to Google (POST, other site).
 * Screens: open from the saved copy, then quietly fetch the newest copy for next time.
 * Change VERSION on each upload to clear old copies.
 */
const VERSION = 'pe-app-v5';
const SHELL = ['./', './index.html', './app.js', './bridge.js', './logo.js', './polish.css', './apple.css', './motion.js', './install.js', './wa.js',
  './manifest.webmanifest', '../config.js', '../icons/icon-192.png', '../icons/icon-512.png', '../icons/favicon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return Promise.all(SHELL.map(function (f) { return c.add(f).catch(function () { return null; }); })); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('pe-app-') === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;                       // server calls are POST - never touched
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // Google, fonts - never touched

  // the page itself: newest from the internet, saved copy if offline / slow (4 s)
  if (req.mode === 'navigate') {
    e.respondWith(new Promise(function (resolve) {
      let done = false;
      const fallback = function () { if (done) return; done = true; caches.match('./index.html').then(function (r) { resolve(r || Response.error()); }); };
      const t = setTimeout(fallback, 4000);
      fetch(req).then(function (r) {
        clearTimeout(t);
        if (r && r.ok) { const c = r.clone(); caches.open(VERSION).then(function (x) { x.put('./index.html', c); }); }
        if (!done) { done = true; resolve(r); }
      }).catch(function () { clearTimeout(t); fallback(); });
    }));
    return;
  }

  // scripts, styles, icons: saved copy first (instant), refresh it in the background
  e.respondWith(caches.open(VERSION).then(function (c) {
    return c.match(req).then(function (hit) {
      const net = fetch(req).then(function (r) { if (r && r.ok) c.put(req, r.clone()); return r; });
      if (hit) { e.waitUntil(net.catch(function () { return null; })); return hit; }
      return net;
    });
  }));
});
