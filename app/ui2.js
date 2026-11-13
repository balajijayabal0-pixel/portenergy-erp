/* © 2026 Port Energy Private Limited. All rights reserved.
   PORT ENERGY ERP - UI extras: premium form header, assign a task to many people,
   MD's message ("Impossible can be possible") on the dashboard and welcome screen. Loads before app.js. */
(function () {
  'use strict';
  var P = function () { return window.PE; }, $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var MULTI = { tasks: { k: 'assignedTo', mode: 'clone' }, leaves: { k: 'approvers', mode: 'csv' }, expenses: { k: 'approvers', mode: 'csv' } };
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
    var mm = MULTI[key]; if (mm && (isNew || mm.mode === 'csv')) multiPick(F, mm.k, setField, mm.mode);
  };

  /* ---------- pick several people (one task is created for each) ---------- */
  function multiPick(F, k, setField, mode) {
    var inp = $('pane').querySelector('.fgrid [data-k="' + k + '"]'); if (!inp) return;
    var box = inp.closest('.fgrid > div'); if (!box) return;
    var users = ((P().S.opts && P().S.opts.users) || []).map(function (u) { return { n: u.v, d: u.des || u.dept || '' }; });
    var me = P().S.sess && P().S.sess.user ? P().S.sess.user.name : '';
    var sel = F.rec[k] ? String(F.rec[k]).split(/\s*,\s*/).filter(String) : [];
    if (mode === 'clone') F.multi = { k: k, names: sel };
    box.classList.add('mp-on');
    box.insertAdjacentHTML('beforeend', '<div class="mp" id="mp"><div class="mp-chips" id="mpC"></div><div class="mp-in"><input id="mpQ" placeholder="Type a name to add…" autocomplete="off"><button type="button" class="mp-team" id="mpTeam">+ My team</button></div><div class="mp-list" id="mpL"></div></div>');
    function draw() {
      $('mpC').innerHTML = sel.length ? sel.map(function (n) { return '<span class="mp-chip"><i style="background:' + col(n) + '">' + esc(P().initials(n)) + '</i>' + esc(n) + '<button type="button" data-rm="' + esc(n) + '" aria-label="Remove">×</button></span>'; }).join('') : '<span class="mp-none">No one selected yet</span>';
      $('mpC').querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { sel = sel.filter(function (x) { return x !== b.dataset.rm; }); sync(); }; });
      var q = $('mpQ').value.trim().toLowerCase();
      var list = users.filter(function (u) { return sel.indexOf(u.n) < 0 && (!q || u.n.toLowerCase().indexOf(q) > -1 || u.d.toLowerCase().indexOf(q) > -1); }).slice(0, q ? 12 : 8);
      $('mpL').innerHTML = list.map(function (u) { return '<button type="button" class="mp-o" data-n="' + esc(u.n) + '"><i style="background:' + col(u.n) + '">' + esc(P().initials(u.n)) + '</i><span><b>' + esc(u.n) + (u.n === me ? ' (me)' : '') + '</b><small>' + esc(u.d) + '</small></span><em>+</em></button>'; }).join('');
      $('mpL').querySelectorAll('[data-n]').forEach(function (b) { b.onclick = function () { sel.push(b.dataset.n); $('mpQ').value = ''; sync(); $('mpQ').focus(); }; });
      var hint = $('pane').querySelector('[data-hint="' + k + '"]'); if (hint) hint.textContent = mode === 'csv' ? (sel.length ? 'Approval goes to ' + sel.join(' → ') + ', then the Managing Director gives the final approval.' : 'Optional. Leave empty to follow your normal reporting channel. The Managing Director always gives the final approval.') : (sel.length > 1 ? 'A separate task will be created for each of the ' + sel.length + ' people.' : 'Pick one or more people.');
    }
    function sync() { if (mode === 'clone') { F.multi.names = sel.slice(); setField(k, sel[0] || ''); } else setField(k, sel.join(', ')); draw(); }
    $('mpQ').oninput = draw;
    $('mpTeam').onclick = function () { var t = (P().S.sess && P().S.sess.user && P().S.sess.user.myTeam) || []; t.forEach(function (n) { if (sel.indexOf(n) < 0) sel.push(n); }); if (!t.length) P().toast('No team members found for you.'); sync(); };
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

  /* ---------- saved My Team ---------- */
  function myTeamButton() {
    if ($('peMyTeam')) return;
    var ai = $('refreshBtn'); if (!ai) return;
    ai.insertAdjacentHTML('beforebegin', '<button class="pe-dn" id="peMyTeam" aria-label="Manage My Team" title="Manage My Team">👥</button>');
    $('peMyTeam').onclick = function () {
      var token = P().S.token, me = P().S.sess.user, host = document.createElement('div');
      host.className = 'modal'; host.innerHTML = '<div class="modal-in" style="max-width:620px"><div class="mh"><h3>My Team</h3><button class="x" aria-label="Close">×</button></div><div class="note">Choose active employees for quick access. This does not change reporting lines.</div><div class="note" id="mtLoading">Loading…</div></div>';
      document.body.appendChild(host);
      function close() { host.remove(); }
      host.querySelector('.x').onclick = close;
      host.onclick = function (e) { if (e.target === host) close(); };
      P().call('teamGet', token, me.id).then(function (data) {
        var selected = {}; (data.members || []).forEach(function (p) { selected[p.id] = 1; });
        var list = (data.users || []).map(function (p) {
          return '<label class="mp-o" style="display:flex;align-items:center;gap:10px"><input type="checkbox" value="' + esc(p.id) + '"' + (selected[p.id] ? ' checked' : '') + '><span><b>' + esc(p.name) + '</b><small>' + esc([p.empNo, p.designation, p.dept].filter(Boolean).join(' · ')) + '</small></span></label>';
        }).join('') || '<p class="note">No eligible employees found.</p>';
        host.querySelector('.modal-in').innerHTML = '<div class="mh"><h3>My Team</h3><button class="x" aria-label="Close">×</button></div><div class="note">Saved people appear in <b>+ My team</b>. Reporting hierarchy is unchanged.</div><input class="in" id="mtFind" placeholder="Search employees…" style="margin:10px 0"><div id="mtChoices" style="max-height:360px;overflow:auto">' + list + '</div><div class="mfoot"><button class="btn" id="mtCancel">Cancel</button><button class="btn primary" id="mtSave">Save My Team</button></div>';
        host.querySelector('.x').onclick = host.querySelector('#mtCancel').onclick = close;
        host.querySelector('#mtFind').oninput = function () { var q = this.value.toLowerCase(); host.querySelectorAll('#mtChoices label').forEach(function (el) { el.style.display = el.textContent.toLowerCase().indexOf(q) > -1 ? 'flex' : 'none'; }); };
        host.querySelector('#mtSave').onclick = function () {
          var b = this, ids = Array.prototype.map.call(host.querySelectorAll('#mtChoices input:checked'), function (el) { return el.value; });
          P().busy(b, true); P().call('teamSave', token, me.id, ids).then(function (out) {
            P().S.sess.user.myTeam = (out.members || []).map(function (p) { return p.name; });
            P().toast('My Team saved.'); close();
          }).catch(function (e) { P().busy(b, false); P().fail(e); });
        };
      }).catch(function (e) { host.querySelector('#mtLoading').textContent = e.message || 'Could not load My Team.'; });
    };
  }

  /* ---------- mail settings: send each mail type only to chosen people ---------- */
  window.PE_MAILTO = function (el) {
    el.innerHTML = '<h3 style="margin:0 0 4px">Who receives each mail</h3><p class="note">Leave a mail type on <b>Usual people</b>, or pick exact people - then only they get that mail.</p><div class="note">Loading…</div>';
    P().call('mailToGet', P().S.token).then(function (d) { drawTo(el, d); }).catch(function (e) { el.innerHTML = '<p class="note">Could not load recipients: ' + esc(e.message) + '</p>'; });
  };
  function drawTo(el, d) {
    var map = JSON.parse(JSON.stringify(d.map || {}));
    function row(k) {
      var list = map[k] || [];
      return '<div class="mt-row" data-k="' + k + '"><div class="mt-h"><b>' + esc(k === 'Digest' ? 'Daily report' : k) + '</b><small>' + esc(d.kinds[k]) + '</small></div>' +
        '<div class="mt-chips">' + (list.length ? list.map(function (n) { return '<span class="mp-chip"><i style="background:' + col(n) + '">' + esc(P().initials(n)) + '</i>' + esc(n) + '<button type="button" data-rm="' + esc(n) + '">×</button></span>'; }).join('') : '<span class="mt-any">Usual people</span>') +
        '<select class="in mt-add"><option value="">+ Add person</option>' + d.people.filter(function (p) { return list.indexOf(p.n) < 0; }).map(function (p) { return '<option value="' + esc(p.n) + '">' + esc(p.n) + ' - ' + esc(p.e) + '</option>'; }).join('') + '</select>' +
        (list.length ? '<button type="button" class="linkbtn mt-clr">Back to usual</button>' : '') + '</div></div>';
    }
    el.innerHTML = '<h3 style="margin:0 0 4px">Who receives each mail</h3><p class="note">Leave a mail type on <b>Usual people</b>, or pick exact people - then <b>only they</b> get that mail. Login OTP and PIN reset always go to the person signing in.</p>' +
      Object.keys(d.kinds).map(row).join('') + '<div class="mfoot" style="justify-content:flex-start"><button class="btn primary" id="mtSave">Save recipients</button></div>';
    el.querySelectorAll('.mt-row').forEach(function (r) {
      var k = r.dataset.k;
      r.querySelector('.mt-add').onchange = function () { if (!this.value) return; (map[k] = map[k] || []).push(this.value); drawTo(el, { map: map, kinds: d.kinds, people: d.people }); };
      r.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { map[k] = (map[k] || []).filter(function (x) { return x !== b.dataset.rm; }); drawTo(el, { map: map, kinds: d.kinds, people: d.people }); }; });
      var c = r.querySelector('.mt-clr'); if (c) c.onclick = function () { delete map[k]; drawTo(el, { map: map, kinds: d.kinds, people: d.people }); };
    });
    $('mtSave').onclick = function () { var b = this; P().busy(b, true); P().call('mailToSave', P().S.token, map).then(function (r) { drawTo(el, r); P().toast('Mail recipients saved.'); }).catch(function (e) { P().busy(b, false); P().fail(e); }); };
  }

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
  new MutationObserver(function () { addHero(); dnButton(); myTeamButton(); }).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addWelcome); else addWelcome();
  myTeamButton();
})();
