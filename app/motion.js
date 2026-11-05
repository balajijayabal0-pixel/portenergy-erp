/* © 2026 Port Energy Private Limited. All rights reserved. Proprietary and confidential. */
/**
 * PORT ENERGY ERP - MOTION v1 (works with polish.css)
 *  - page change animation
 *  - phone: list rows shown as cards, sliding pill in the bottom bar
 *  - phone: swipe a record to the right to close it, swipe a pop-up sheet down to close it
 *    (follows the finger 1:1, uses the flick speed to decide, never jumps)
 * It never changes data and never calls the server. Safe to remove.
 */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var phone = function () { return window.matchMedia('(max-width: 760px)').matches; };
  var calm = function () { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; };

  // iOS needs a touch listener for :active press feedback
  document.addEventListener('touchstart', function () { }, { passive: true });

  /* ---------- where a flick will land (same maths as phone scrolling) ---------- */
  function project(v, d) { d = d || 0.998; return (v / 1000) * d / (1 - d); }
  function rubber(x, dim) { var c = 0.55; return (x * dim * c) / (dim + c * Math.abs(x)); }
  function tracker() {
    var h = [];
    return {
      add: function (x) { var t = performance.now(); h.push({ x: x, t: t }); while (h.length > 2 && t - h[0].t > 100) h.shift(); },
      v: function () { if (h.length < 2) return 0; var a = h[0], b = h[h.length - 1], dt = b.t - a.t; return dt > 0 ? (b.x - a.x) / dt * 1000 : 0; },
      reset: function () { h = []; }
    };
  }

  /* ---------- 1. page change animation ---------- */
  var content = $('content');
  if (content) {
    var tEnter;
    new MutationObserver(function (list) {
      if (!list.some(function (m) { return m.target === content && m.addedNodes.length; })) return;
      content.classList.remove('pe-enter'); void content.offsetWidth; content.classList.add('pe-enter');
      clearTimeout(tEnter); tEnter = setTimeout(function () { content.classList.remove('pe-enter'); }, 450);
    }).observe(content, { childList: true });
  }

  /* ---------- 2. list rows -> cards on phones ---------- */
  function cardify() {
    var tbl = $('tbl');
    if (!tbl) return;
    var t = tbl.querySelector('table.tb');
    if (!t || !t.tHead) { tbl.classList.remove('pe-cards'); return; }
    if (t.dataset.peDone) return;
    t.dataset.peDone = '1';
    var heads = Array.prototype.map.call(t.tHead.rows[0].cells, function (th) { return th.textContent.replace(/[▲▼]/g, '').trim(); });
    Array.prototype.forEach.call(t.querySelectorAll('tbody tr, tfoot tr'), function (tr) {
      Array.prototype.forEach.call(tr.cells, function (td, i) {
        td.setAttribute('data-label', heads[i] || '');
        if (i === 0) td.classList.add('pe-first');
        else if (td.querySelector('.badge') && !tr.querySelector('.pe-st')) td.classList.add('pe-st');
        if (!td.textContent.trim() && i > 0 && !td.querySelector('img')) td.style.display = phone() ? 'none' : '';
      });
    });
    tbl.classList.add('pe-cards');
  }
  var queued = false;
  function soon() { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; cardify(); pill(); }); }
  if (content) new MutationObserver(soon).observe(content, { childList: true, subtree: true });

  /* ---------- 3. sliding pill under the active bottom-bar button ---------- */
  var bnav = $('bnav'), pillEl = null;
  function pill() {
    if (!bnav) return;
    if (!pillEl) { pillEl = document.createElement('span'); pillEl.className = 'pe-pill'; bnav.insertBefore(pillEl, bnav.firstChild); }
    var on = bnav.querySelector('button.on');
    if (!on) { pillEl.style.opacity = '0'; return; }
    pillEl.style.opacity = '1';
    pillEl.style.width = on.offsetWidth + 'px';
    pillEl.style.transform = 'translateX(' + on.offsetLeft + 'px)';
  }
  if (bnav) {
    new MutationObserver(soon).observe(bnav, { attributes: true, subtree: true, attributeFilter: ['class'] });
    window.addEventListener('resize', soon);
  }

  /* ---------- 4. swipe right to close a record (phone) ---------- */
  var drawer = $('drawer'), pane = $('pane'), bg = $('drawerBg');
  if (drawer && pane && bg) {
    var d = null, tr = tracker();
    pane.addEventListener('pointerdown', function (e) {
      if (!phone() || calm() || e.pointerType === 'mouse' || !drawer.classList.contains('open')) return;
      if (e.target.closest('input, textarea, select, [contenteditable], .lines, canvas')) return;
      // let horizontally scrolling tables scroll
      var sc = e.target.closest('[style*="overflow"], .tablewrap');
      if (sc && sc.scrollWidth > sc.clientWidth + 2 && sc.scrollLeft > 0) return;
      d = { x0: e.clientX, y0: e.clientY, id: e.pointerId, live: false, w: pane.offsetWidth };
      tr.reset(); tr.add(0);
    });
    pane.addEventListener('pointermove', function (e) {
      if (!d || e.pointerId !== d.id) return;
      var dx = e.clientX - d.x0, dy = e.clientY - d.y0;
      if (!d.live) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        if (Math.abs(dy) > Math.abs(dx) || dx < 0) { d = null; return; }   // vertical scroll wins
        d.live = true; d.x0 = e.clientX; dx = 0;
        try { pane.setPointerCapture(e.pointerId); } catch (x) { }
        pane.style.transition = 'none';
      }
      tr.add(dx);
      var x = dx < 0 ? rubber(dx, d.w) : dx;
      pane.style.transform = 'translateX(' + x + 'px)';
      bg.style.opacity = String(Math.max(0, 1 - x / d.w));
    });
    function endDrawer(e) {
      if (!d || e.pointerId !== d.id) return;
      var live = d.live, w = d.w; d = null;
      if (!live) return;
      var m = /translateX\(([-\d.]+)px\)/.exec(pane.style.transform), x = m ? Number(m[1]) : 0, v = tr.v();
      var land = x + project(v);
      if (land > w * 0.45 && v > -200) {
        // close: carry the finger's speed into the slide-out
        var rest = Math.max(0, w - x), dur = Math.min(0.32, Math.max(0.16, v > 0 ? rest / v : 0.3));
        pane.style.transition = 'transform ' + dur + 's cubic-bezier(.2,.9,.24,1)';
        bg.style.transition = 'opacity ' + dur + 's ease'; bg.style.opacity = '0';
        pane.style.transform = 'translateX(105%)';
        setTimeout(function () {
          bg.click();
          requestAnimationFrame(function () { pane.style.transition = ''; pane.style.transform = ''; bg.style.transition = ''; bg.style.opacity = ''; });
        }, dur * 1000);
      } else {
        pane.style.transition = 'transform .38s cubic-bezier(.2,.9,.24,1)';
        pane.style.transform = 'translateX(0)'; bg.style.opacity = '';
        setTimeout(function () { pane.style.transition = ''; pane.style.transform = ''; }, 400);
      }
    }
    pane.addEventListener('pointerup', endDrawer);
    pane.addEventListener('pointercancel', endDrawer);
  }

  /* ---------- 5. swipe down to close a pop-up sheet (phone) ---------- */
  var modal = $('modal'), box = $('mbox');
  if (modal && box) {
    var s = null, ts = tracker();
    // only sheets that do not scroll can be dragged (a scrolling sheet keeps normal scrolling)
    new MutationObserver(function () {
      requestAnimationFrame(function () { box.classList.toggle('pe-swipe', phone() && !calm() && modal.classList.contains('open') && box.scrollHeight <= box.clientHeight + 1); });
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    box.addEventListener('pointerdown', function (e) {
      if (!phone() || calm() || e.pointerType === 'mouse' || !modal.classList.contains('open')) return;
      if (e.target.closest('input, textarea, select, button, a, [contenteditable]')) return;
      if (!box.classList.contains('pe-swipe')) return;
      s = { y0: e.clientY, x0: e.clientX, id: e.pointerId, live: false, h: box.offsetHeight };
      ts.reset(); ts.add(0);
    });
    box.addEventListener('pointermove', function (e) {
      if (!s || e.pointerId !== s.id) return;
      var dy = e.clientY - s.y0, dx = e.clientX - s.x0;
      if (!s.live) {
        if (Math.abs(dy) < 10 && Math.abs(dx) < 10) return;
        if (Math.abs(dx) > Math.abs(dy) || dy < 0) { s = null; return; }
        s.live = true; s.y0 = e.clientY; dy = 0;
        try { box.setPointerCapture(e.pointerId); } catch (x) { }
        box.style.transition = 'none';
      }
      ts.add(dy);
      var y = dy < 0 ? rubber(dy, s.h) : dy;
      box.style.transform = 'translateY(' + y + 'px)';
    });
    function endSheet(e) {
      if (!s || e.pointerId !== s.id) return;
      var live = s.live, h = s.h; s = null;
      if (!live) return;
      var m = /translateY\(([-\d.]+)px\)/.exec(box.style.transform), y = m ? Number(m[1]) : 0, v = ts.v();
      if (y + project(v) > h * 0.35 && v > -200) {
        var dur = Math.min(0.3, Math.max(0.14, v > 0 ? (h - y) / v : 0.28));
        box.style.transition = 'transform ' + dur + 's cubic-bezier(.2,.9,.24,1)';
        box.style.transform = 'translateY(100%)';
        setTimeout(function () {
          modal.dispatchEvent(new MouseEvent('click', { bubbles: true }));   // same close path as tapping outside
          requestAnimationFrame(function () { box.style.transition = ''; box.style.transform = ''; });
        }, dur * 1000);
      } else {
        box.style.transition = 'transform .36s cubic-bezier(.2,.9,.24,1)';
        box.style.transform = 'translateY(0)';
        setTimeout(function () { box.style.transition = ''; box.style.transform = ''; }, 380);
      }
    }
    box.addEventListener('pointerup', endSheet);
    box.addEventListener('pointercancel', endSheet);
  }

  /* ---------- 6. pull down to refresh (phone, at the top of a page) ---------- */
  var ptr = document.createElement('div');
  ptr.className = 'pe-ptr'; ptr.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>';
  document.body.appendChild(ptr);
  var pr = null, LIMIT = 70;
  function layerOpen() { return ['modal', 'pal', 'aip', 'drawer', 'side', 'login'].some(function (id) { var el = $(id); return el && (el.classList.contains('open') || (id === 'login' && getComputedStyle(el).display !== 'none')); }); }
  document.addEventListener('touchstart', function (e) {
    if (!phone() || calm() || window.scrollY > 0 || layerOpen() || e.touches.length !== 1) return;
    if (e.target.closest('input, textarea, select, .tablewrap, .status-chips, .bnav')) return;
    pr = { y0: e.touches[0].clientY, x0: e.touches[0].clientX, d: 0, live: false };
  }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (!pr) return;
    var dy = e.touches[0].clientY - pr.y0, dx = e.touches[0].clientX - pr.x0;
    if (!pr.live) { if (Math.abs(dy) < 10) return; if (dy < 0 || Math.abs(dx) > Math.abs(dy) || window.scrollY > 0) { pr = null; return; } pr.live = true; pr.y0 = e.touches[0].clientY; dy = 0; }
    pr.d = Math.max(0, rubber(dy, 300));
    ptr.style.transition = 'none';
    ptr.style.opacity = String(Math.min(1, pr.d / LIMIT));
    ptr.style.transform = 'translate(-50%,' + (pr.d - 10) + 'px) rotate(' + (pr.d * 4) + 'deg)';
    ptr.classList.toggle('ready', pr.d >= LIMIT);
  }, { passive: true });
  function endPull() {
    if (!pr) return;
    var go = pr.live && pr.d >= LIMIT; pr = null;
    ptr.style.transition = '';
    if (go) {
      ptr.classList.add('spin'); ptr.style.transform = 'translate(-50%,' + (LIMIT - 20) + 'px)';
      var b = $('refreshBtn'); if (b) b.click();
      if (navigator.vibrate) try { navigator.vibrate(8); } catch (x) { }
      setTimeout(function () { ptr.classList.remove('spin', 'ready'); ptr.style.opacity = '0'; ptr.style.transform = 'translate(-50%,-40px)'; }, 900);
    } else { ptr.style.opacity = '0'; ptr.style.transform = 'translate(-50%,-40px)'; ptr.classList.remove('ready'); }
  }
  document.addEventListener('touchend', endPull, { passive: true });
  document.addEventListener('touchcancel', endPull, { passive: true });

  /* ---------- 7. offline banner ---------- */
  var off = document.createElement('div');
  off.className = 'pe-off'; off.setAttribute('role', 'status');
  off.textContent = 'You are offline - changes will not save';
  document.body.appendChild(off);
  function net() { off.classList.toggle('show', !navigator.onLine); if (navigator.onLine && off.dataset.was === '1') { off.textContent = 'Back online'; off.classList.add('show', 'ok'); setTimeout(function () { off.classList.remove('show', 'ok'); off.textContent = 'You are offline - changes will not save'; }, 1800); } off.dataset.was = navigator.onLine ? '0' : '1'; }
  window.addEventListener('online', net); window.addEventListener('offline', net); net();

  window.addEventListener('resize', function () { var t = $('tbl') && $('tbl').querySelector('table.tb'); if (t) { delete t.dataset.peDone; cardify(); } });
})();
