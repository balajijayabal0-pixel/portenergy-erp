/* © 2026 Port Energy Private Limited. All rights reserved. Proprietary and confidential. */
/**
 * PORT ENERGY ERP - install as an app (phone + laptop)
 *  Android / Windows / Mac (Chrome, Edge): "Install app" button -> real app icon, own window
 *  iPhone / iPad (Safari): shows the 2 steps (Share -> Add to Home Screen)
 * Button appears in the login card and in the profile menu. Hidden once installed.
 */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var installed = function () { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; };
  var deferred = null;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js', { scope: './' }).catch(function () { }); });
  }

  var ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5"/><rect x="4" y="17" width="16" height="4" rx="1.5"/></svg>';

  function buttons() {
    var show = !installed() && (deferred || ios);
    // profile menu (phone + desktop)
    var menu = $('menu'), mb = $('peInstallM');
    if (menu && !mb) { mb = document.createElement('button'); mb.id = 'peInstallM'; mb.type = 'button'; mb.innerHTML = 'Install app on this device'; mb.onclick = install; menu.insertBefore(mb, menu.firstChild); }
    if (mb) mb.style.display = show ? '' : 'none';
    // login card
    var card = document.querySelector('#login .auth'), lb = $('peInstallL');
    if (card && !lb) { lb = document.createElement('button'); lb.id = 'peInstallL'; lb.type = 'button'; lb.className = 'pe-inst'; lb.innerHTML = ICON + '<span>Install Port Energy app</span>'; lb.onclick = install; card.appendChild(lb); }
    if (lb) lb.style.display = show ? '' : 'none';
  }

  function install() {
    var m = $('menu'); if (m) m.classList.remove('open');
    if (deferred) {
      var d = deferred; deferred = null;
      d.prompt();
      d.userChoice.then(function () { buttons(); }).catch(function () { buttons(); });
      return;
    }
    if (ios) guide();
  }

  function guide() {
    var modal = $('modal'), box = $('mbox');
    if (!modal || !box) return;
    box.innerHTML = '<h3 style="margin-bottom:6px">Install on iPhone / iPad</h3><p class="note" style="margin:0 0 16px">Open this page in <b>Safari</b>, then:</p>' +
      '<ol class="pe-steps"><li><span class="n">1</span><div>Tap the <b>Share</b> button <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg> at the bottom</div></li>' +
      '<li><span class="n">2</span><div>Choose <b>Add to Home Screen</b>, then <b>Add</b></div></li></ol>' +
      '<button class="btn primary block" type="button" id="peGuideOk" style="margin-top:18px">OK</button>';
    modal.classList.add('open');
    $('peGuideOk').onclick = function () { modal.classList.remove('open'); };
  }

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; buttons(); });
  window.addEventListener('appinstalled', function () { deferred = null; buttons(); });
  document.addEventListener('DOMContentLoaded', buttons);
  if (document.readyState !== 'loading') buttons();
})();
