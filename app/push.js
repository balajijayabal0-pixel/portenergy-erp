/* © 2026 Port Energy Private Limited. All rights reserved.
   PORT ENERGY ERP - real push notifications (phone, laptop, installed app) via Firebase Cloud Messaging.
   The alert arrives even when the app is closed. Talks to Push.gs: pushRegister, pushUnregister. */
(function () {
  'use strict';
  var CFG = { apiKey: 'AIzaSyAJ2nndxZCSAhjZIYC0yBtc98sQlPr43jg', authDomain: 'port-energy-erp-push.firebaseapp.com', projectId: 'port-energy-erp-push', storageBucket: 'port-energy-erp-push.firebasestorage.app', messagingSenderId: '432997849945', appId: '1:432997849945:web:f1a7b3c4ea222dcaa78a48' };
  var VAPID = 'BOoXcG7HHeZlSAuM4IXR5s5qiWnloMl9HGNPF0KzESWulaLFu5ajU6vdKo23DtsWzss8Er8tc_3ke1f0zFp7cjo';
  var SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  var P = function () { return window.PE; };
  var tok = function () { var p = P(); return p && p.S && p.S.token; };
  var busy = false;

  function supported() { return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; }
  function load(src) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { no(new Error('Could not load ' + src)); }; document.head.appendChild(s); }); }
  function sdk() {
    if (window.firebase && window.firebase.messaging) return Promise.resolve();
    return load(SDK + 'firebase-app-compat.js').then(function () { return load(SDK + 'firebase-messaging-compat.js'); });
  }
  function device() {
    var u = navigator.userAgent, o = /android/i.test(u) ? 'Android' : /iphone|ipad|ipod/i.test(u) ? 'iPhone' : /windows/i.test(u) ? 'Windows' : /mac/i.test(u) ? 'Mac' : 'Other';
    var b = /edg/i.test(u) ? 'Edge' : /chrome/i.test(u) ? 'Chrome' : /safari/i.test(u) ? 'Safari' : /firefox/i.test(u) ? 'Firefox' : 'Browser';
    return o + ' ' + b + (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches ? ' (app)' : '');
  }
  /** get this device's push address from Google and give it to the ERP server */
  function register() {
    if (busy || !supported() || Notification.permission !== 'granted' || !tok()) return Promise.resolve(false);
    busy = true;
    return sdk().then(function () {
      if (!firebase.apps.length) firebase.initializeApp(CFG);
      return navigator.serviceWorker.register('sw.js', { scope: './' }).then(function () { return navigator.serviceWorker.ready; });
    }).then(function (reg) {
      return firebase.messaging().getToken({ vapidKey: VAPID, serviceWorkerRegistration: reg });
    }).then(function (t) {
      if (!t) throw new Error('No push address received.');
      return P().call('pushRegister', tok(), t, device()).then(function () { try { localStorage.setItem('pe_push_t', t); } catch (x) { } busy = false; return true; });
    }).catch(function (e) { busy = false; try { console.warn('[push]', e && e.message || e); } catch (x) { } return false; });
  }
  /** called from the alerts button: ask permission once, then register */
  function enable() {
    if (!supported()) { P().toast('This browser cannot receive push alerts. On iPhone: Share > Add to Home Screen, then open the app.', true); return Promise.resolve(false); }
    return Notification.requestPermission().then(function (p) {
      if (p !== 'granted') { P().toast('Alerts blocked. Allow notifications for this app in browser / phone settings.', true); return false; }
      return register().then(function (ok) {
        P().toast(ok ? 'Push alerts are on for this device. A test alert is coming.' : 'Alerts allowed, but push setup failed. Try again later.', !ok);
        if (ok) P().call('pushTest', tok()).catch(function () { });
        return ok;
      });
    });
  }
  /** on every login: if alerts are already allowed, refresh this device's address */
  var done = '';
  function sync() {
    var t = tok(); if (!t || done === t) return; done = t;
    if (!supported()) return;
    if (Notification.permission === 'granted') register(); else if (Notification.permission === 'default') setTimeout(ask, 2500);
  }
  /** permission dialog in the middle of the screen (like a normal phone app). Installed app: asks every time it opens until allowed
      (Later = ask again after 10 min). Browser tab: once a day. The browser only allows its own prompt after a tap, so the tap is on "Allow". */
  function ask() {
    var app = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    var last = 0; try { last = Number(localStorage.getItem('pe_push_ask') || 0); } catch (x) { }
    if (document.getElementById('pePushBar') || Date.now() - last < (app ? 600000 : 86400000)) return;
    var b = document.createElement('div'); b.id = 'pePushBar';
    b.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(10,16,48,.55);display:flex;align-items:center;justify-content:center;padding:18px;font:15px/1.45 system-ui,sans-serif';
    b.innerHTML = '<div style="background:#fff;color:#14205E;border-radius:18px;max-width:360px;width:100%;padding:22px 20px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.4)">' +
      '<div style="font-size:34px;line-height:1">\ud83d\udd14</div><div style="font-weight:700;font-size:18px;margin:8px 0 6px">Allow notifications</div>' +
      '<div style="color:#4a557f;margin-bottom:16px">Get approval requests, status changes and team chat alerts on this device, even when the app is closed.</div>' +
      '<button id="pePushYes" style="width:100%;background:#E8127C;color:#fff;border:0;border-radius:12px;padding:12px;font-weight:700;font-size:15px">Allow</button>' +
      '<button id="pePushNo" style="width:100%;background:transparent;color:#5D6894;border:0;padding:12px 0 0;font-size:14px">Not now</button></div>';
    document.body.appendChild(b);
    var close = function () { try { localStorage.setItem('pe_push_ask', String(Date.now())); } catch (x) { } if (b.parentNode) b.parentNode.removeChild(b); };
    document.getElementById('pePushYes').onclick = function () { close(); enable(); };
    document.getElementById('pePushNo').onclick = close;
  }
  window.PE_PUSH = { enable: enable, sync: sync, register: register, supported: supported };
})();
