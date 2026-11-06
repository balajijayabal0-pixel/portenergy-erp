/* © 2026 Port Energy Private Limited. All rights reserved. Proprietary and confidential. */
/**
 * PORT ENERGY ERP - motion helpers (pairs with fx.css)
 *  - cascade: new cards / panels / rows that land on screen rise in one after another
 *  - ripple: brand-colour ripple from the finger / cursor on buttons and menu items
 *  - tilt: KPI cards lean towards the mouse (desktop only)
 *  - phone menu: numbers the menu items so they slide in one by one
 * Pure decoration: if anything here fails, the app works exactly the same.
 */
(function () {
  'use strict';
  if (!window.MutationObserver) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  /* ---------- cascade ---------- */
  var CARD = '.dx-hero, .dx-p, .kpi, .wst, .glass, .panel, .qa, .dx-step, .dx-al, .sec, .card, .dh';
  var ROW = '.tb tbody tr, .list > .it, .list > button, .list > a, #tbl.pe-cards .tb tr';
  var queued = [], timer = 0, lastRows = new WeakMap();

  function inView(el) {
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.top < (window.innerHeight || 800) + 40 && r.bottom > -40;
  }
  function flush() {
    timer = 0;
    var cards = 0, rows = 0;
    queued.forEach(function (el) {
      if (!el.isConnected || el.dataset.fx) return;
      el.dataset.fx = '1';
      var p = el.parentElement && el.parentElement.closest('.fx-in');
      if (p && !p.classList.contains('fx-done')) return;          // parent already rising: let it carry the child
      if (!inView(el)) return;                                     // off screen: show it as is
      var isRow = el.matches(ROW);
      if (isRow) {                                                 // a list redrawn while typing a filter should not keep sliding
        var box = el.closest('#tbl, .list, table') || document.body, now = Date.now(), last = lastRows.get(box) || 0;
        if (rows > 16 || (now - last < 1500 && !rows)) return;
        lastRows.set(box, now);
      }
      el.style.setProperty('--fx-d', isRow ? rows++ : Math.min(cards++, 12));
      el.classList.add('fx-in'); if (isRow) el.classList.add('fx-row');
      el.addEventListener('animationend', function done(e) {
        if (e.target !== el) return;
        el.removeEventListener('animationend', done);
        el.classList.remove('fx-in', 'fx-row'); el.classList.add('fx-done'); el.style.removeProperty('--fx-d');
      });
    });
    queued = [];
  }
  function scan(root) {
    if (!root || root.nodeType !== 1) return;
    if (root.matches && (root.matches(CARD) || root.matches(ROW))) queued.push(root);
    var list = root.querySelectorAll ? root.querySelectorAll(CARD + ',' + ROW) : [];
    for (var i = 0; i < list.length; i++) queued.push(list[i]);
    if (!timer) timer = requestAnimationFrame(flush);
  }
  var mo = new MutationObserver(function (muts) {
    muts.forEach(function (m) { for (var i = 0; i < m.addedNodes.length; i++) scan(m.addedNodes[i]); });
  });
  ['content', 'drawer'].forEach(function (id) { var el = document.getElementById(id); if (el) mo.observe(el, { childList: true, subtree: true }); });

  /* ---------- ripple ---------- */
  var RIP = '.btn, .ni, .kpi.link, .dx-step, .dx-al, .qa, .bnav button, .chip, .lg-forgot, .dx-find';
  document.addEventListener('pointerdown', function (e) {
    var el = e.target.closest && e.target.closest(RIP);
    if (!el || el.disabled) return;
    var cs = getComputedStyle(el);
    if (cs.position === 'static') el.style.position = 'relative';
    var w = el.querySelector(':scope > .fx-rw');
    if (!w) { w = document.createElement('span'); w.className = 'fx-rw'; el.appendChild(w); }
    var r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    var reach = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y));
    var s = document.createElement('i'); s.className = 'fx-rip';
    s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.setProperty('--fx-s', Math.ceil(reach / 8) + 1);
    w.appendChild(s);
    setTimeout(function () { s.remove(); }, 700);
  }, { passive: true });

  /* ---------- tilt (mouse only) ---------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var TILT = '.kpi, .dx-step';
    document.addEventListener('pointermove', function (e) {
      var el = e.target.closest && e.target.closest(TILT);
      if (!el) return;
      if (!el.classList.contains('fx-tilt')) { el.classList.add('fx-tilt'); if (getComputedStyle(el).position === 'static') el.style.position = 'relative'; }
      var r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.classList.add('fx-hot');
      el.style.setProperty('--fx-ry', ((px - .5) * 9).toFixed(2) + 'deg');
      el.style.setProperty('--fx-rx', ((.5 - py) * 9).toFixed(2) + 'deg');
      el.style.setProperty('--fx-mx', (px * 100).toFixed(1) + '%');
      el.style.setProperty('--fx-my', (py * 100).toFixed(1) + '%');
    }, { passive: true });
    document.addEventListener('pointerout', function (e) {
      var el = e.target.closest && e.target.closest('.fx-tilt');
      if (!el || (e.relatedTarget && el.contains(e.relatedTarget))) return;
      el.classList.remove('fx-hot'); el.style.setProperty('--fx-rx', '0deg'); el.style.setProperty('--fx-ry', '0deg');
    }, { passive: true });
  }

  /* ---------- phone menu order ---------- */
  function numberMenu() {
    var nav = document.querySelector('.side nav'); if (!nav) return;
    var kids = nav.children; for (var i = 0; i < kids.length; i++) kids[i].style.setProperty('--fx-i', Math.min(i, 24));
  }
  var side = document.getElementById('side');
  if (side) {
    numberMenu();
    new MutationObserver(numberMenu).observe(side.querySelector('nav') || side, { childList: true });
  }
})();
