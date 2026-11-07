/* © 2026 Port Energy Private Limited. All rights reserved.
   PORT ENERGY ERP - UI extras: premium form header, assign a task to many people,
   MD's message ("Impossible can be possible") on the dashboard and welcome screen. Loads before app.js. */
(function () {
  'use strict';
  var P = function () { return window.PE; }, $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var MULTI = { tasks: 'assignedTo' };
  var COL = ['#0084F0', '#F0006C', '#00B49C', '#6F42C1', '#E8590C', '#0CA678', '#C2255C', '#1C7ED6'];
  function col(n) { var h = 7; String(n).split('').forEach(function (c) { h = (h * 37 + c.charCodeAt(0)) >>> 0; }); return COL[h % COL.length]; }

  /* ---------- form opened ---------- */
  var prevOpen = window.PE_FORM_OPEN;
  window.PE_FORM_OPEN = function (key, F, isNew, setField) {
    if (prevOpen) try { prevOpen(key, F, isNew, setField); } catch (x) { }
    var pane = $('pane'); if (!pane) return;
    pane.classList.add('pe-form');
    var dh = pane.querySelector('.dh'), e = F.e;
    if (dh && !dh.querySelector('.dh-ic')) dh.insertAdjacentHTML('afterbegin', '<span class="dh-ic">' + P().icon(e.icon || 'box', 22) + '</span>');
    if (MULTI[key] && isNew) multiPick(F, MULTI[key], setField);
  };

  /* ---------- pick several people (one task is created for each) ---------- */
  function multiPick(F, k, setField) {
    var inp = $('pane').querySelector('.fgrid [data-k="' + k + '"]'); if (!inp) return;
    var box = inp.closest('.fgrid > div'); if (!box) return;
    var users = ((P().S.opts && P().S.opts.users) || []).map(function (u) { return { n: u.v, d: u.des || u.dept || '' }; });
    var me = P().S.sess && P().S.sess.user ? P().S.sess.user.name : '';
    var sel = F.rec[k] ? [F.rec[k]] : [];
    F.multi = { k: k, names: sel };
    box.classList.add('mp-on');
    box.insertAdjacentHTML('beforeend', '<div class="mp" id="mp"><div class="mp-chips" id="mpC"></div><div class="mp-in"><input id="mpQ" placeholder="Type a name to add…" autocomplete="off"><button type="button" class="mp-team" id="mpTeam">+ My team</button></div><div class="mp-list" id="mpL"></div></div>');
    function draw() {
      $('mpC').innerHTML = sel.length ? sel.map(function (n) { return '<span class="mp-chip"><i style="background:' + col(n) + '">' + esc(P().initials(n)) + '</i>' + esc(n) + '<button type="button" data-rm="' + esc(n) + '" aria-label="Remove">×</button></span>'; }).join('') : '<span class="mp-none">No one selected yet</span>';
      $('mpC').querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { sel = sel.filter(function (x) { return x !== b.dataset.rm; }); sync(); }; });
      var q = $('mpQ').value.trim().toLowerCase();
      var list = users.filter(function (u) { return sel.indexOf(u.n) < 0 && (!q || u.n.toLowerCase().indexOf(q) > -1 || u.d.toLowerCase().indexOf(q) > -1); }).slice(0, q ? 12 : 8);
      $('mpL').innerHTML = list.map(function (u) { return '<button type="button" class="mp-o" data-n="' + esc(u.n) + '"><i style="background:' + col(u.n) + '">' + esc(P().initials(u.n)) + '</i><span><b>' + esc(u.n) + (u.n === me ? ' (me)' : '') + '</b><small>' + esc(u.d) + '</small></span><em>+</em></button>'; }).join('');
      $('mpL').querySelectorAll('[data-n]').forEach(function (b) { b.onclick = function () { sel.push(b.dataset.n); $('mpQ').value = ''; sync(); $('mpQ').focus(); }; });
      var hint = $('pane').querySelector('[data-hint="' + k + '"]'); if (hint) hint.textContent = sel.length > 1 ? 'A separate task will be created for each of the ' + sel.length + ' people.' : 'Pick one or more people.';
    }
    function sync() { F.multi.names = sel.slice(); setField(k, sel[0] || ''); draw(); }
    $('mpQ').oninput = draw;
    $('mpTeam').onclick = function () { var t = (P().S.sess && P().S.sess.user && P().S.sess.user.team) || []; t.forEach(function (n) { if (sel.indexOf(n) < 0) sel.push(n); }); if (!t.length) P().toast('No team members found for you.'); sync(); };
    draw();
  }

  /* ---------- day / night inside the app (same switch as the sign-in page) ---------- */
  function mode() { var m = null; try { m = localStorage.getItem('pe_lgmode'); } catch (x) { } if (m === 'day' || m === 'night') return m; var h = new Date().getHours(); return h >= 6 && h < 18 ? 'day' : 'night'; }
  function applyTheme() {
    var dark = mode() === 'night'; document.documentElement.classList.toggle('pe-dark', dark);
    var mc = document.querySelector('meta[name="theme-color"]'); if (mc) mc.setAttribute('content', dark ? '#060B24' : '#0084F0');
    var b = $('peDN'); if (b) { b.title = dark ? 'Switch to day mode' : 'Switch to night mode'; b.setAttribute('aria-pressed', dark ? 'true' : 'false'); }
  }
  function dnButton() {
    if ($('peDN')) return; var ai = $('refreshBtn'); if (!ai) return;
    ai.insertAdjacentHTML('beforebegin', '<button class="pe-dn" id="peDN" aria-label="Day or night mode"><b></b><b></b><i></i></button>');
    $('peDN').onclick = function () {
      var m = mode() === 'night' ? 'day' : 'night'; try { localStorage.setItem('pe_lgmode', m); } catch (x) { }
      var r = document.documentElement; r.classList.add('pe-theming'); applyTheme(); setTimeout(function () { r.classList.remove('pe-theming'); }, 700);
      var lgm = $('lgMode'); if (lgm && $('login')) $('login').classList.toggle('lg-day', m === 'day');
    };
    applyTheme();
  }
  applyTheme();
  window.addEventListener('storage', function (e) { if (e.key === 'pe_lgmode') applyTheme(); });
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('#lgMode')) setTimeout(applyTheme, 30); }, true);

  /* ---------- MD's message ---------- */
  var MD = { name: 'R. Karthick', role: 'Managing Director', quote: 'Impossible can be possible.', sub: 'Every pipeline we lay, every challenge we face - we deliver.' };
  function mdCard(cls) {
    return '<div class="md ' + cls + '"><span class="md-glow"></span><img class="md-ph" src="img/md.webp" alt="' + esc(MD.name) + '"><div class="md-q"><i class="md-mark">&ldquo;</i><b>' + esc(MD.quote) + '</b><small>' + esc(MD.sub) + '</small><span class="md-by"><em></em>' + esc(MD.name) + ' · ' + esc(MD.role) + '</span></div></div>';
  }
  function addHero() {
    var h = document.querySelector('.dx-hero'); if (!h || h.querySelector('.md')) return;
    h.insertAdjacentHTML('beforeend', mdCard('md-hero'));
  }
  function addWelcome() {
    var w = document.querySelector('#welcome .wel-in'); if (!w || w.querySelector('.md')) return;
    w.insertAdjacentHTML('afterbegin', mdCard('md-wel'));
  }
  new MutationObserver(function () { addHero(); dnButton(); }).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addWelcome); else addWelcome();
})();
