/* © 2026 Port Energy Private Limited. All rights reserved. Proprietary and confidential. */
/**
 * PORT ENERGY ERP - app service worker
 * Keeps the app SCREENS on the phone / laptop so the app opens instantly.
 * ERP DATA is never cached here: every server call goes live to Google (POST, other site).
 * Screens: open from the saved copy, then quietly fetch the newest copy for next time.
 * Change VERSION on each upload to clear old copies.
 */
const VERSION = 'pe-app-v45';
const SHELL = ['./', './index.html', './app.js', './bridge.js', './logo.js', './polish.css', './apple.css', './dash.css', './motion.js', './install.js', './wa.js', './dash.js', './login.css', './login.js', './loading.css', './fx.css', './refine.css', './pro.css', './brand.css', './dark.css', './login-lux.css', './img/heli.webp', './img/bg-day.webp', './img/bg-night.webp', './pro.js', './reports.js', './print.js', './books.js', './chat.js', './push.js', './ui2.js', './procure.js', './spell.js', './wx.js', './polls.js', './fx.js',
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
      // new version stamp not cached yet: take it from the internet; offline -> any saved copy of the same file
      return net.catch(function () { return c.match(req, { ignoreSearch: true }).then(function (h) { return h || Response.error(); }); });
    });
  }));
});

/* real push from the ERP server (Firebase Cloud Messaging) - works when the app is closed.
   If the app is open and in front, the app already shows its own alert, so we stay quiet. */
self.addEventListener('push', function (e) {
  var j = {}; try { j = e.data ? e.data.json() : {}; } catch (x) { try { j = { data: { title: 'Port Energy ERP', body: e.data.text() } }; } catch (y) { } }
  var d = j.data || j.notification || j || {};
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) { if (list[i].visibilityState === 'visible' && list[i].focused) return null; }
    var route = d.k ? { k: d.k, id: d.id } : (d.v ? { v: d.v } : null);
    return self.registration.showNotification(d.title || 'Port Energy ERP', { body: d.body || '', tag: d.tag || 'pe-push', renotify: true, icon: '../icons/icon-192.png', badge: '../icons/icon-192.png', data: { route: route } });
  }));
});

/* tap on a chat / approval alert: open the app at the right screen */
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var r = (e.notification.data && e.notification.data.route) || null;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) { if ('focus' in list[i]) { list[i].postMessage({ peRoute: r }); return list[i].focus(); } }
    return self.clients.openWindow('./' + (r && r.v === 'chat' ? '#chat' : ''));
  }));
});
