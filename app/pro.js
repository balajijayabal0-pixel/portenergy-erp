/* © 2026 Port Energy Private Limited. All rights reserved. Proprietary and confidential. */
/**
 * PORT ENERGY ERP - PRO FEATURES
 *  - every module shows in the menu; modules without access show a lock and a polite "not authorised" page
 *  - user photos (Super Admin page) and the photo in the top bar
 *  - mail settings (Super Admin): every automatic email on / off
 *  - Materials department: live stock status, short / excess, service due back, movement trail
 *  - Reports centre: formatted reports (MD overview, procurement, accounts, materials, machinery, site, my work)
 *  - Report access (Super Admin): who can see / download which report
 *  - Help & user guide with shortcuts, quick tools and how-to steps
 *  - AI voice call (speak and listen, English or Tamil)
 * Loaded BEFORE app.js; uses window.PE (set by app.js) only when called.
 */
(function () {
  'use strict';
  var P = function () { return window.PE; };
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ic(n, s) { return P().icon(n, s); }
  function sess() { return P().S.sess; }
  function admin() { var s = sess(); return !!(s && s.user.admin); }
  function tok() { return P().S.token; }

  /* ================================================================
     1. MODULE CATALOGUE + LOCKS
     ================================================================ */
  var CATALOG = [
    ['approvals', 'Internal Approvals', 'Workspace', 'stamp'], ['tasks', 'Tasks', 'Workspace', 'target'], ['transfers', 'Material Transfers', 'Workspace', 'swap'],
    ['dsr', 'Daily Site Reports', 'Workspace', 'clipboard'], ['tbt', 'Safety / Tool Box Meetings', 'Workspace', 'shield'], ['leaves', 'Leave & Permission', 'Workspace', 'calendar'],
    ['notices', 'Notice Board', 'Communication', 'megaphone'], ['decisions', 'Decision Register', 'Communication', 'gavel'], ['meetings', 'Meeting Notes', 'Communication', 'clipboard'],
    ['vendors', 'Vendors', 'Procurement', 'truck'], ['items', 'Item Master', 'Procurement', 'box'], ['pr', 'Purchase Requests', 'Procurement', 'cart'],
    ['quotes', 'Quotation Comparison', 'Procurement', 'scale'], ['po', 'Purchase Orders', 'Procurement', 'po'], ['grn', 'Goods Receipts (GRN)', 'Procurement', 'box'],
    ['bills', 'Vendor Bills', 'Accounts', 'bill'], ['payments', 'Vendor Payments', 'Accounts', 'rupee'], ['expenses', 'Expense Claims', 'Accounts', 'receipt'],
    ['pettycash', 'Petty Cash', 'Accounts', 'cash'], ['clientbills', 'Client Invoices', 'Accounts', 'invoice'], ['vouchers', 'Cash / Advance Vouchers', 'Accounts', 'cash'],
    ['matitems', 'Material Register', 'Materials', 'box'], ['matmoves', 'Material Movements', 'Materials', 'swap'], ['dc', 'Delivery Challans', 'Materials', 'truck'],
    ['machinery', 'Machinery & Equipment', 'Office Admin', 'bolt'], ['assets', 'Assets', 'Office Admin', 'laptop'], ['stock', 'Office Stock', 'Office Admin', 'stack'],
    ['stockmoves', 'Stock In / Out', 'Office Admin', 'swap'], ['visitors', 'Visitor Log', 'Office Admin', 'visitor'], ['vehicles', 'Vehicle Log', 'Office Admin', 'car'],
    ['maintenance', 'Maintenance Requests', 'Office Admin', 'tool'], ['photos', 'Site Photos', 'Office Admin', 'camera'],
    ['users', 'Users & Access', 'Administration', 'users'], ['departments', 'Departments', 'Administration', 'org'], ['projects', 'Projects / Sites', 'Administration', 'site']
  ];
  function catTitle(k) { var c = CATALOG.filter(function (x) { return x[0] === k; })[0]; return c ? c[1] : k; }
  function superAdmins() { return ((P().S.opts || {}).users || []).filter(function (u) { return u.role === 'Super Admin'; }).map(function (u) { return u.v; }); }

  function navBtn(attr, iconName, label, extra) { return '<button class="ni"' + attr + '>' + ic(iconName) + esc(label) + (extra || '') + '</button>'; }
  function groupEl(g) {
    var nav = $('nav'), el = nav.querySelector('.ng[data-g="' + g + '"]');
    if (el) return el.querySelector('.items > div');
    el = document.createElement('div'); el.className = 'ng' + (window.innerWidth <= 1024 ? ' closed' : ''); el.dataset.g = g;
    el.innerHTML = '<button class="ngh">' + esc(g.toUpperCase()) + ic('chev', 14) + '</button><div class="items"><div></div></div>';
    var order = ['Workspace', 'Communication', 'Procurement', 'Accounts', 'Materials', 'Office Admin', 'Administration', 'Reports & Help', 'System'];
    var after = Array.prototype.slice.call(nav.querySelectorAll('.ng[data-g]')).filter(function (x) { return order.indexOf(x.dataset.g) > order.indexOf(g); })[0];
    nav.insertBefore(el, after || null);
    el.querySelector('.ngh').onclick = function () { el.classList.toggle('closed'); P().store.set('pe_ng_' + g, el.classList.contains('closed') ? '1' : '0'); };
    return el.querySelector('.items > div');
  }
  window.PE_NAV = function () {
    var s = sess(); if (!s) return;
    var have = {}; s.entities.forEach(function (e) { have[e.key] = 1; });
    CATALOG.forEach(function (c) {
      if (have[c[0]]) return;
      var box = groupEl(c[2]);
      box.insertAdjacentHTML('beforeend', navBtn(' data-lock="' + c[0] + '" data-k="' + c[0] + '"', c[3], c[1], '<span class="pe-lock">' + ic('lock', 12) + '</span>'));
    });
    var rh = groupEl('Reports & Help');
    rh.insertAdjacentHTML('beforeend', navBtn(' data-v="reports"', 'ledger', 'Reports', '<span class="tc">Alt R</span>') +
      (have.matitems || have.matmoves ? navBtn(' data-v="matstatus"', 'pulse', 'Material status board') : '') +
      navBtn(' data-v="help"', 'shield', 'Help & user guide', '<span class="tc">Alt G</span>'));
    if (admin()) {
      var sys = groupEl('System');
      sys.insertAdjacentHTML('beforeend', navBtn(' data-v="uphotos"', 'camera', 'User photos') + navBtn(' data-v="mailsw"', 'mail', 'Mail settings') + navBtn(' data-v="repacl"', 'key', 'Report access') + navBtn(' data-v="bookser"', 'ledger', 'Book serial numbers'));
    }
    $('nav').querySelectorAll('.ni[data-lock], .ni[data-v="reports"], .ni[data-v="matstatus"], .ni[data-v="help"], .ni[data-v="uphotos"], .ni[data-v="mailsw"], .ni[data-v="repacl"], .ni[data-v="bookser"]').forEach(function (b) {
      b.onclick = function () { P().closeSide(); if (b.dataset.lock) P().go({ v: 'list', k: b.dataset.lock }); else P().go({ v: b.dataset.v }); };
    });
    P().markNav();
    loadPhoto(); loadReports();
  };
  window.PE_LOCKED = function (v, key) {
    P().setTitle(catTitle(key), 'Access needed');
    var sa = superAdmins();
    v.innerHTML = '<div class="pe-deny pe-deny2"><div class="pe-guard"><span class="pe-guard-ring"></span><img src="img/guard.webp" alt=""><span class="pe-guard-lock">' + ic('lock', 18) + '</span></div>' +
      '<h2>You are not authorised to view ' + esc(catTitle(key)) + '</h2>' +
      '<p>This section is open only to people the Super Admin has given access. Your data is safe and nothing here was loaded.</p>' +
      '<div class="pe-deny-box"><b>How to get access</b><span>Ask your Super Admin' + (sa.length ? ' (' + esc(sa.join(', ')) + ')' : '') + ' to tick <em>' + esc(catTitle(key)) + '</em> for you in Users &amp; Access.</span></div>' +
      '<div class="pe-deny-a"><button class="btn primary" id="dnHome">' + ic('home', 16) + 'Back to Home</button><button class="btn soft" id="dnHelp">' + ic('shield', 16) + 'Help</button></div></div>';
    $('dnHome').onclick = function () { P().go({ v: 'home' }); };
    $('dnHelp').onclick = function () { P().go({ v: 'help' }); };
  };

  /* ================================================================
     2. PHOTOS
     ================================================================ */
  var myPh = null;
  function loadPhoto() {
    var s = sess(); if (!s) return;
    var k = 'pe_myph_' + s.user.name, c = P().store.get(k);
    if (c) setAv(c);
    P().call('myPhoto', tok()).then(function (ph) { P().store.set(k, ph || ''); setAv(ph); }).catch(function () { });
  }
  function setAv(ph) {
    myPh = ph; var av = $('av'); if (!av) return;
    if (ph) { av.innerHTML = '<img src="' + ph + '" alt="">'; av.classList.add('pe-ph'); }
    else { av.textContent = P().initials(sess().user.name); av.classList.remove('pe-ph'); }
  }
  /** square crop + resize to 192 px JPEG, small enough for one sheet cell */
  function squash(file) {
    return new Promise(function (ok, bad) {
      if (!/^image\//.test(file.type)) return bad(new Error('Please choose a photo (JPG or PNG).'));
      if (file.size > 15 * 1024 * 1024) return bad(new Error('Photo is larger than 15 MB.'));
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var s = Math.min(img.width, img.height), sx = (img.width - s) / 2, sy = Math.max(0, (img.height - s) / 2 - s * 0.08);
        var c = document.createElement('canvas'); c.width = c.height = 192;
        var x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, sx, sy, s, s, 0, 0, 192, 192);
        URL.revokeObjectURL(url);
        var q = 0.86, d = c.toDataURL('image/jpeg', q);
        while (d.length > 46000 && q > 0.4) { q -= 0.08; d = c.toDataURL('image/jpeg', q); }
        ok(d);
      };
      img.onerror = function () { bad(new Error('Could not read this photo.')); };
      img.src = url;
    });
  }
  function pickPhoto(cb) {
    var f = document.createElement('input'); f.type = 'file'; f.accept = 'image/*';
    f.onchange = function () { if (f.files[0]) squash(f.files[0]).then(cb).catch(function (e) { P().toast(e.message, true); }); };
    f.click();
  }
  function photosPage(v) {
    P().setTitle('User photos', 'System · shown on sign-in and profile');
    if (!admin()) return window.PE_LOCKED(v, 'users');
    P().skeleton(v, 6);
    P().call('userPhotos', tok()).then(function (d) { drawPhotos(v, d); }).catch(function (e) { v.innerHTML = '<div class="empty"><b>Could not load</b>' + esc(e.message) + '</div>'; });
  }
  function drawPhotos(v, d) {
    var q = (v.dataset.q || '').toLowerCase();
    var us = (d.users || []).filter(function (u) { return !q || (u.n + ' ' + u.dept + ' ' + u.d).toLowerCase().indexOf(q) > -1; });
    var done = (d.users || []).filter(function (u) { return d.photos[u.n]; }).length;
    v.innerHTML = '<div class="pe-tb"><div class="search">' + ic('search', 16) + '<input id="phQ" placeholder="Find a person" value="' + esc(v.dataset.q || '') + '"></div>' +
      '<span class="pe-stat"><b>' + done + '</b> of ' + (d.users || []).length + ' have a photo</span>' +
      '<label class="pe-sw"><input type="checkbox" id="phSelf"' + (d.self ? ' checked' : '') + '><i></i>Staff may change their own photo</label></div>' +
      '<div class="pe-ph-grid">' + us.map(function (u) {
        var ph = d.photos[u.n];
        return '<div class="glass pe-ph-card"><span class="pe-ph-av">' + (ph ? '<img src="' + ph + '" alt="">' : '<b>' + esc(P().initials(u.n)) + '</b>') + '</span>' +
          '<b>' + esc(u.n) + '</b><small>' + esc([u.d, u.dept].filter(String).join(' · ')) + '</small><small class="pe-mute">' + esc(u.m) + '</small>' +
          '<div class="pe-ph-a"><button class="btn soft sm" data-up="' + esc(u.n) + '">' + ic('camera', 14) + (ph ? 'Change' : 'Upload') + '</button>' + (ph ? '<button class="btn ghost sm" data-rm="' + esc(u.n) + '">Remove</button>' : '') + '</div></div>';
      }).join('') + '</div><p class="note" style="margin-top:14px">Photos are cropped square and made small automatically. They appear on the sign-in screen as soon as the person types their number, and in the top bar.</p>';
    $('phQ').oninput = P().debounce(function () { v.dataset.q = this.value; var pos = this.selectionStart; drawPhotos(v, d); var i = $('phQ'); i.focus(); try { i.setSelectionRange(pos, pos); } catch (x) { } }, 200);
    $('phSelf').onchange = function () { P().call('setPhotoSelf', tok(), this.checked).then(function (r) { d.self = r.self; P().toast('Saved.'); }).catch(P().fail); };
    v.querySelectorAll('[data-up]').forEach(function (b) {
      b.onclick = function () { pickPhoto(function (data) { P().busy(b, true); P().call('setUserPhoto', tok(), b.dataset.up, data).then(function (r) { r.users = r.users || d.users; drawPhotos(v, r); P().toast('Photo saved for ' + b.dataset.up + '.'); if (b.dataset.up === sess().user.name) { P().store.set('pe_myph_' + b.dataset.up, data); setAv(data); } }).catch(function (e) { P().busy(b, false); P().fail(e); }); }); };
    });
    v.querySelectorAll('[data-rm]').forEach(function (b) {
      b.onclick = function () { P().busy(b, true); P().call('setUserPhoto', tok(), b.dataset.rm, '').then(function (r) { r.users = r.users || d.users; drawPhotos(v, r); P().toast('Photo removed.'); }).catch(function (e) { P().busy(b, false); P().fail(e); }); };
    });
  }

  /* ================================================================
     3. MAIL SETTINGS
     ================================================================ */
  function mailPage(v) {
    P().setTitle('Mail settings', 'System · automatic emails');
    if (!admin()) return window.PE_LOCKED(v, 'users');
    P().skeleton(v, 6);
    P().call('mailSwGet', tok()).then(function (d) { drawMail(v, d); }).catch(function (e) { v.innerHTML = '<div class="empty"><b>Could not load</b>' + esc(e.message) + '</div>'; });
  }
  function drawMail(v, d) {
    var sw = d.sw;
    v.innerHTML = '<div class="glass panel pe-mail">' +
      '<div class="pe-mail-top"><div><h3 style="margin:0">All automatic emails</h3><p class="note">Master switch. When OFF, the ERP sends no automatic email at all.</p></div>' +
      '<label class="pe-sw big"><input type="checkbox" id="msAll"' + (sw.all ? ' checked' : '') + '><i></i><span id="msAllT">' + (sw.all ? 'ON' : 'OFF') + '</span></label></div>' +
      '<div class="pe-mail-list' + (sw.all ? '' : ' off') + '" id="msList">' + Object.keys(d.kinds).map(function (k) {
        return '<label class="pe-mail-row"><span><b>' + esc(k === 'Digest' ? 'Daily report' : k) + '</b><small>' + esc(d.kinds[k]) + '</small></span><span class="pe-sw"><input type="checkbox" data-k="' + k + '"' + (sw[k] ? ' checked' : '') + '><i></i></span></label>';
      }).join('') + '</div>' +
      '<div class="pe-mail-safe">' + ic('shield', 16) + '<span><b>Always sent:</b> login OTP and Forgot PIN requests. These are needed to sign in, so they are never blocked.</span></div>' +
      '<div class="mfoot" style="justify-content:flex-start"><button class="btn primary" id="msSave">Save settings</button><button class="btn soft" id="msOff">Stop all mails now</button></div></div>';
    v.insertAdjacentHTML('beforeend', '<div class="glass panel pe-mail" id="msTo" style="margin-top:14px"></div>');
    if (window.PE_MAILTO) window.PE_MAILTO($('msTo'));
    $('msAll').onchange = function () { $('msList').classList.toggle('off', !this.checked); $('msAllT').textContent = this.checked ? 'ON' : 'OFF'; };
    function save(btn, all) {
      var o = { all: all == null ? $('msAll').checked : all };
      v.querySelectorAll('[data-k]').forEach(function (c) { o[c.dataset.k] = all === false ? false : c.checked; });
      P().busy(btn, true);
      P().call('mailSwSave', tok(), o).then(function (r) { drawMail(v, r); P().toast(r.sw.all ? 'Mail settings saved.' : 'All automatic emails are now OFF.'); }).catch(function (e) { P().busy(btn, false); P().fail(e); });
    }
    $('msSave').onclick = function () { save(this); };
    $('msOff').onclick = function () { save(this, false); };
  }

  /* ================================================================
     4. REPORT ACCESS (who sees which report, who may download)
     ================================================================ */
  var REP = { view: [], dl: false, reports: {} };
  function loadReports() { P().call('myReports', tok()).then(function (r) { REP = r; }).catch(function () { REP = { view: ['my'], dl: admin(), reports: {} }; }); }
  window.PE_CANDL = function () { return admin() || !!REP.dl; };
  function repAclPage(v) {
    P().setTitle('Report access', 'System · who sees and downloads reports');
    if (!admin()) return window.PE_LOCKED(v, 'users');
    P().skeleton(v, 8);
    P().call('reportAclGet', tok()).then(function (d) { drawAcl(v, d); }).catch(function (e) { v.innerHTML = '<div class="empty"><b>Could not load</b>' + esc(e.message) + '</div>'; });
  }
  function drawAcl(v, d) {
    var keys = Object.keys(d.reports);
    v.innerHTML = '<p class="note" style="margin:0 0 12px">Tick the reports each person may open. "Download" lets them export lists and save reports as files. Super Admins always have everything.</p>' +
      '<div class="glass pe-acl"><table class="tb"><thead><tr><th>Person</th>' + keys.map(function (k) { return '<th title="' + esc(d.reports[k].t) + '">' + esc(d.reports[k].t.replace(/ report| \(MD\)|Management /g, '').replace('overview', 'MD overview')) + '</th>'; }).join('') + '<th>Download</th></tr></thead><tbody>' +
      d.users.map(function (u) {
        return '<tr data-u="' + esc(u.n) + '"><td><b>' + esc(u.n) + '</b><br><small class="note">' + esc(u.dept) + '</small></td>' + keys.map(function (k) { return '<td class="ct"><input type="checkbox" data-r="' + k + '"' + (u.view.indexOf(k) > -1 ? ' checked' : '') + (k === 'my' ? ' disabled' : '') + '></td>'; }).join('') +
          '<td class="ct"><input type="checkbox" data-dl' + (u.dl ? ' checked' : '') + '></td></tr>';
      }).join('') + '</tbody></table></div><div class="mfoot" style="justify-content:flex-start"><button class="btn primary" id="aclSave">Save access</button></div>';
    $('aclSave').onclick = function () {
      var acl = {}, b = this;
      v.querySelectorAll('tr[data-u]').forEach(function (tr) { acl[tr.dataset.u] = { view: Array.prototype.map.call(tr.querySelectorAll('[data-r]:checked'), function (c) { return c.dataset.r; }), dl: tr.querySelector('[data-dl]').checked }; });
      P().busy(b, true);
      P().call('reportAclSave', tok(), acl).then(function (r) { drawAcl(v, r); P().toast('Report access saved.'); }).catch(function (e) { P().busy(b, false); P().fail(e); });
    };
  }


  /* ================================================================
     5. PREMIUM HOME: hero glance chips + KPI tiles (first 6 on phone)
     ================================================================ */
  function enhanceHome() {
    var S = P() && P().S; if (!S || !S.sess || S.route.v !== 'home') return;
    var h = S.home || {}, k = h.kpi || {};
    var hero = document.querySelector('#content .dx-hero');
    if (hero && !hero.querySelector('.pe-glance')) {
      var g = [];
      g.push(['Approvals', (h.inbox || []).length, (h.inbox || []).length ? 'hot' : '', function () { P().go({ v: 'inbox' }); }]);
      if (k.payables != null) g.push(['Payables', P().inrShort(k.payables), '', function () { if (P().ent('bills')) P().go({ v: 'list', k: 'bills' }); }]);
      if (k.receivables != null) g.push(['Receivables', P().inrShort(k.receivables), '', function () { if (P().ent('clientbills')) P().go({ v: 'list', k: 'clientbills' }); }]);
      if (g.length < 3 && (h.mine || []).length != null) g.push(['My requests', (h.mine || []).length, '', function () { var m = $('hMine'); if (m) m.scrollIntoView({ behavior: 'smooth', block: 'center' }); }]);
      var box = document.createElement('div'); box.className = 'pe-glance';
      box.innerHTML = g.map(function (x, i) { return '<button type="button" class="' + x[2] + '" data-g="' + i + '"><small>' + esc(x[0]) + '</small><b>' + esc(x[1]) + '</b></button>'; }).join('');
      var host = hero.querySelector('.dx-hl') || hero; host.appendChild(box);
      box.querySelectorAll('[data-g]').forEach(function (b) { b.onclick = g[+b.dataset.g][3]; });
    }
    var kp = $('kpis');
    if (kp && !kp.dataset.pe) {
      var cards = kp.querySelectorAll('.kpi'); if (!cards.length) return;
      kp.dataset.pe = '1';
      if (cards.length > 6) {
        Array.prototype.forEach.call(cards, function (c, i) { if (i >= 6) c.classList.add('pe-more-k'); });
        var m = document.createElement('div'); m.className = 'pe-kmore';
        m.innerHTML = '<button type="button">Show all ' + cards.length + ' figures ' + ic('down', 15) + '</button>';
        kp.parentNode.insertBefore(m, kp.nextSibling);
        m.querySelector('button').onclick = function () { var o = kp.classList.toggle('pe-open'); m.classList.toggle('open', o); this.innerHTML = (o ? 'Show fewer ' : 'Show all ' + cards.length + ' figures ') + ic('down', 15); };
      }
    }
  }
  var hT = null;
  function watchHome() {
    var c = $('content'); if (!c) return setTimeout(watchHome, 300);
    new MutationObserver(function () { clearTimeout(hT); hT = setTimeout(enhanceHome, 60); }).observe(c, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchHome); else watchHome();

  /* ================================================================
     6. START SCREEN MESSAGES under the running worker
     ================================================================ */
  (function bootMsg() {
    var M = ['Preparing your workspace…', 'Checking approvals…', 'Loading projects and sites…', 'Fetching purchase orders…', 'Counting materials…', 'Almost ready…'], i = 0;
    var t = setInterval(function () { var b = document.getElementById('boot'), m = document.getElementById('bootMsg'); if (!b || b.style.display === 'none' || !m) { clearInterval(t); return; } i = (i + 1) % M.length; m.style.opacity = 0; setTimeout(function () { m.textContent = M[i]; m.style.opacity = 1; }, 250); }, 1300);
  })();

  /* ================================================================
     7. BOOK SERIAL NUMBERS (voucher book, DC book, tool box book)
     ================================================================ */
  var BOOKF = { vouchers: 'vchNo', dc: 'dcNo', tbt: 'tbtNo' };
  window.PE_FORM_OPEN = function (key, F, isNew, setField) {
    if (!isNew || !BOOKF[key] || F.rec[BOOKF[key]]) return;
    P().call('bookSerials', tok()).then(function (b) { if (b && b[key] && P().S && $('drawer').classList.contains('open')) setField(BOOKF[key], String(b[key].next)); }).catch(function () { });
  };
  function bookPage(v) {
    P().setTitle('Book serial numbers', 'System · voucher, delivery challan and tool box books');
    if (!admin()) return window.PE_LOCKED(v, 'users');
    P().skeleton(v, 4);
    P().call('bookSerials', tok()).then(function (d) { drawBook(v, d); }).catch(function (e) { v.innerHTML = '<div class="empty"><b>Could not load</b>' + esc(e.message) + '</div>'; });
  }
  function drawBook(v, d) {
    v.innerHTML = '<div class="glass panel pe-mail"><h3 style="margin-top:0">Continue from your printed books</h3><p class="note">Enter the next serial number in each handwritten book. New entries continue from here and never repeat a number already used.</p>' +
      Object.keys(d).map(function (k) { return '<label class="pe-mail-row" style="cursor:default"><span><b>' + esc(d[k].t) + '</b><small>Next number now: ' + esc(d[k].pre) + '<b>' + d[k].next + '</b></small></span><input class="in" type="number" min="1" data-b="' + k + '" value="' + d[k].start + '" style="max-width:140px"></label>'; }).join('') +
      '<div class="mfoot" style="justify-content:flex-start"><button class="btn primary" id="bkSave">Save</button></div></div>';
    $('bkSave').onclick = function () { var o = {}, b = this; v.querySelectorAll('[data-b]').forEach(function (i) { o[i.dataset.b] = i.value; }); P().busy(b, true); P().call('bookSerialSave', tok(), o).then(function (r) { drawBook(v, r); P().toast('Serial numbers saved.'); }).catch(function (e) { P().busy(b, false); P().fail(e); }); };
  }
  /* expose for reports.js */
  window.PE_PRO = { esc: esc, ic: ic, admin: admin, tok: tok, rep: function () { return REP; }, catTitle: catTitle, squash: squash, pickPhoto: pickPhoto, photo: function () { return myPh; } };

  window.PE_VIEWS = window.PE_VIEWS || {};
  window.PE_VIEWS.uphotos = photosPage;
  window.PE_VIEWS.mailsw = mailPage;
  window.PE_VIEWS.mailcfg = mailPage;      // old "Daily report mail" item opens the new settings too
  window.PE_VIEWS.repacl = repAclPage;
  window.PE_VIEWS.bookser = bookPage;
})();
