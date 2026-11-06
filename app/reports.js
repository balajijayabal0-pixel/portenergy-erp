/* © 2026 Port Energy Private Limited. All rights reserved. Proprietary and confidential. */
/**
 * PORT ENERGY ERP - REPORTS CENTRE, MATERIAL STATUS BOARD, HELP GUIDE, AI VOICE CALL
 * Reports are formatted documents (letterhead, summary boxes, clean sections) - not spreadsheets.
 * Everything is calculated from the ERP's own records; a section the person cannot open is simply left out.
 */
(function () {
  'use strict';
  var P = function () { return window.PE; };
  var X = function () { return window.PE_PRO; };
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ic(n, s) { return P().icon(n, s); }
  function n(v) { return P().num(v); }
  function money(v) { return P().inr(v); }
  function short(v) { return P().inrShort(v); }
  function fd(d) { return P().fdate(d); }
  function today() { return P().today(); }
  function rows(key) {
    if (!P().ent(key)) return Promise.resolve(null);
    var S = P().S; if (S.cache[key]) return Promise.resolve(S.cache[key]);
    return P().call('listRecords', S.token, key).then(function (r) { S.cache[key] = r.rows; return r.rows; }).catch(function () { return null; });
  }
  function addDays(d, k) { var t = new Date(d + 'T00:00:00'); t.setDate(t.getDate() + k); return t.toISOString().slice(0, 10); }

  /* ================================================================
     MATERIAL STOCK ENGINE (shared by the status board and the report)
     ================================================================ */
  var SVC = 'At service / repair', LOAN = 'On loan / hire';
  function matStock(items, moves) {
    var map = {};
    (items || []).forEach(function (i) { var home = i.home || 'Main store'; var o = { item: i, loc: {}, scrap: 0, lost: 0, short: 0, excess: 0, inQ: 0, outQ: 0, last: '', neg: false, due: [] }; o.loc[home] = n(i.opening); map[i.name] = o; });
    var mv = (moves || []).filter(function (m) { return m.status !== 'Cancelled'; }).slice().sort(function (a, b) { return String(a.date + a.id) < String(b.date + b.id) ? -1 : 1; });
    mv.forEach(function (m) {
      var o = map[m.item]; if (!o) return;
      var q = n(m.qty), t = String(m.type || ''), home = o.item.home || 'Main store', from = m.fromLoc || home, to = m.toLoc || home;
      var add = function (l, v) { o.loc[l] = n(o.loc[l]) + v; };
      o.last = m.date;
      if (/^Receipt/.test(t)) { add(to, q); o.inQ += q; }
      else if (/^Issue|^Return to|^Transfer/.test(t)) { add(from, -q); add(to, q); if (/^Issue/.test(t)) o.outQ += q; }
      else if (/^Sent for service/.test(t)) { add(from, -q); add(SVC, q); o.due.push(m); }
      else if (/^Back from service/.test(t)) { add(SVC, -q); add(to, q); }
      else if (/^Loaned/.test(t)) { add(from, -q); add(LOAN, q); o.due.push(m); }
      else if (/^Returned from loan/.test(t)) { add(LOAN, -q); add(to, q); }
      else if (/^Damaged/.test(t)) { add(from, -q); o.scrap += q; }
      else if (/^Lost/.test(t)) { add(from, -q); o.lost += q; }
      else if (/^Physical count/.test(t)) { var l = m.toLoc || m.fromLoc || home, d = q - n(o.loc[l]); o.loc[l] = q; if (d < 0) o.short += -d; else o.excess += d; }
    });
    return Object.keys(map).map(function (k) {
      var o = map[k], tot = 0; Object.keys(o.loc).forEach(function (l) { if (o.loc[l] < -0.0001) o.neg = true; tot += o.loc[l]; });
      o.total = P().r2(tot);
      var away = n(o.loc[SVC]) + n(o.loc[LOAN]);
      o.overdue = n(o.loc[SVC]) + n(o.loc[LOAN]) > 0 ? o.due.filter(function (m) { return m.dueBack && m.dueBack < today(); }) : [];
      o.state = o.neg ? 'Check entries' : o.total - away <= 0 ? 'Out of stock' : o.total - away <= n(o.item.reorder) ? 'Low stock' : 'OK';
      return o;
    }).sort(function (a, b) { var r = { 'Check entries': 0, 'Out of stock': 1, 'Low stock': 2, OK: 3 }; return r[a.state] - r[b.state] || a.item.name.localeCompare(b.item.name); });
  }
  function stBadge(s) { var c = { OK: 'b-ok', 'Low stock': 'b-warn', 'Out of stock': 'b-bad', 'Check entries': 'b-bad' }[s] || ''; return '<span class="badge ' + c + '">' + esc(s) + '</span>'; }
  function locChips(o) {
    return Object.keys(o.loc).filter(function (l) { return Math.abs(o.loc[l]) > 0.0001; }).map(function (l) {
      var v = P().r2(o.loc[l]); return '<span class="pe-loc' + (v < 0 ? ' neg' : l === SVC || l === LOAN ? ' away' : '') + '">' + esc(l) + ' <b>' + v + '</b></span>';
    }).join('') || '<span class="note">nothing anywhere</span>';
  }

  function matBoard(v) {
    P().setTitle('Material status board', 'Materials · live stock, short / excess, service');
    if (!P().ent('matitems')) return window.PE_LOCKED(v, 'matitems');
    P().skeleton(v, 8);
    Promise.all([rows('matitems'), rows('matmoves')]).then(function (r) {
      var st = matStock(r[0], r[1] || []), mv = (r[1] || []).slice().sort(function (a, b) { return String(b.date + b.id) < String(a.date + a.id) ? -1 : 1; });
      var cnt = function (s) { return st.filter(function (o) { return o.state === s; }).length; };
      var svc = st.reduce(function (t, o) { return t + n(o.loc[SVC]) + n(o.loc[LOAN]); }, 0), od = st.reduce(function (t, o) { return t + o.overdue.length; }, 0);
      var sh = st.filter(function (o) { return o.short || o.excess || o.lost || o.scrap; });
      v.dataset.q = v.dataset.q || '';
      var tiles = [['Materials', st.length, 'in the register', 'box', ''], ['Low / out of stock', cnt('Low stock') + cnt('Out of stock'), 'reorder now', 'warn', cnt('Low stock') + cnt('Out of stock') ? 'amber' : ''],
        ['At service / on loan', P().r2(svc), od ? od + ' overdue to come back' : 'none overdue', 'tool', od ? 'red' : ''], ['Short / lost / scrap', sh.length, 'items with a loss', 'pulse', sh.length ? 'red' : ''], ['Check entries', cnt('Check entries'), 'issued more than in stock', 'shield', cnt('Check entries') ? 'red' : 'green']];
      v.innerHTML = '<div class="pe-tiles">' + tiles.map(function (t) { return '<div class="glass pe-tile ' + t[4] + '"><span>' + ic(t[3], 18) + '</span><small>' + esc(t[0]) + '</small><b>' + t[1] + '</b><em>' + esc(t[2]) + '</em></div>'; }).join('') + '</div>' +
        '<div class="pe-tb"><div class="search">' + ic('search', 16) + '<input id="mbQ" placeholder="Find material, category, site"></div><div class="chips" id="mbF">' + ['All', 'Low stock', 'Out of stock', 'Check entries', 'Away'].map(function (f, i) { return '<button class="chip' + (i ? '' : ' on') + '" data-f="' + f + '">' + f + '</button>'; }).join('') + '</div>' +
        (P().ent('matmoves') && P().ent('matmoves').canCreate ? '<button class="btn primary" id="mbNew">' + ic('plus', 16) + 'New movement</button>' : '') + (P().ent('matitems').canCreate ? '<button class="btn soft" id="mbItem">' + ic('box', 16) + 'Add material</button>' : '') + '</div>' +
        '<div class="glass pe-mat" id="mbT"></div>' +
        '<div class="grid2" style="margin-top:14px"><div class="glass panel"><h3>Needs attention</h3><div class="list" id="mbA"></div></div><div class="glass panel"><h3>Latest movements <button class="btn ghost sm" id="mbAll">Open all</button></h3><div class="list" id="mbM"></div></div></div>';
      var f = 'All';
      function draw() {
        var q = ($('mbQ').value || '').toLowerCase();
        var list = st.filter(function (o) { var hay = (o.item.name + ' ' + o.item.code + ' ' + o.item.category + ' ' + Object.keys(o.loc).join(' ')).toLowerCase(); return (!q || hay.indexOf(q) > -1) && (f === 'All' || (f === 'Away' ? n(o.loc[SVC]) + n(o.loc[LOAN]) > 0 : o.state === f)); });
        $('mbT').innerHTML = list.length ? '<table class="tb"><thead><tr><th>Material</th><th class="r">In hand</th><th>Where it is</th><th class="r">Issued</th><th class="r">Short / excess</th><th>Status</th></tr></thead><tbody>' + list.map(function (o) {
          return '<tr data-id="' + esc(o.item.id) + '"><td><b>' + esc(o.item.name) + '</b><br><small class="note">' + esc([o.item.code, o.item.category].filter(String).join(' · ')) + '</small></td><td class="r"><b>' + o.total + '</b> <small>' + esc(o.item.uom || '') + '</small><br><small class="note">reorder ' + n(o.item.reorder) + '</small></td><td>' + locChips(o) + '</td><td class="r">' + P().r2(o.outQ) + '</td><td class="r">' + (o.short ? '<span class="pe-neg">-' + P().r2(o.short) + '</span> ' : '') + (o.excess ? '<span class="pe-pos">+' + P().r2(o.excess) + '</span>' : '') + (o.short || o.excess ? '' : '-') + '</td><td>' + stBadge(o.state) + '</td></tr>';
        }).join('') + '</tbody></table>' : '<div class="empty"><b>' + (st.length ? 'No match' : 'No materials yet') + '</b>' + (st.length ? 'Try another word or filter.' : 'Add materials to the register, then record every receipt, issue and return.') + '</div>';
        $('mbT').querySelectorAll('tr[data-id]').forEach(function (tr) { tr.onclick = function () { P().openDetail('matitems', tr.dataset.id); }; });
      }
      $('mbQ').oninput = P().debounce(draw, 150);
      $('mbF').querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { f = b.dataset.f; $('mbF').querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('on', c === b); }); draw(); }; });
      if ($('mbNew')) $('mbNew').onclick = function () { P().openForm('matmoves'); };
      if ($('mbItem')) $('mbItem').onclick = function () { P().openForm('matitems'); };
      $('mbAll').onclick = function () { P().go({ v: 'list', k: 'matmoves' }); };
      var al = [];
      st.forEach(function (o) {
        if (o.neg) al.push(['bad', o.item.name, 'More issued than available at a location - check the entries']);
        o.overdue.forEach(function (m) { al.push(['bad', o.item.name, m.qty + ' ' + (o.item.uom || '') + ' ' + (/^Loan/.test(m.type) ? 'on loan' : 'at service') + ' with ' + (m.toLoc || m.party || '-') + ' - was due back ' + fd(m.dueBack)]); });
        if (o.state === 'Out of stock' || o.state === 'Low stock') al.push(['warn', o.item.name, o.state + ': ' + o.total + ' ' + (o.item.uom || '') + ' (reorder at ' + n(o.item.reorder) + ')']);
        if (o.short) al.push(['warn', o.item.name, 'Physical count short by ' + P().r2(o.short) + ' ' + (o.item.uom || '')]);
        if (o.lost) al.push(['bad', o.item.name, P().r2(o.lost) + ' ' + (o.item.uom || '') + ' reported lost / missing']);
      });
      $('mbA').innerHTML = al.length ? al.slice(0, 12).map(function (a) { return '<div class="li"><div class="t"><b>' + esc(a[1]) + '</b><p>' + esc(a[2]) + '</p></div><span class="badge ' + (a[0] === 'bad' ? 'b-bad' : 'b-warn') + '">' + (a[0] === 'bad' ? 'Act now' : 'Check') + '</span></div>'; }).join('') : '<div class="empty"><b>All in order</b>No shortage, loss or overdue service.</div>';
      $('mbM').innerHTML = mv.length ? mv.slice(0, 8).map(function (m) { return '<div class="li click" data-id="' + esc(m.id) + '"><div class="t"><b>' + esc(m.item) + '</b> <small class="note">' + esc(m.id) + '</small><p>' + esc(fd(m.date)) + ' · ' + esc(m.type) + ' · ' + esc(m.qty) + (m.fromLoc || m.toLoc ? ' · ' + esc((m.fromLoc || '-') + ' → ' + (m.toLoc || '-')) : '') + ' · ' + esc(m.handledBy || '') + '</p></div>' + P().badge(m.status) + '</div>'; }).join('') : '<div class="empty"><b>No movements yet</b>Every receipt, issue, return and transfer shows here.</div>';
      $('mbM').querySelectorAll('[data-id]').forEach(function (r) { r.onclick = function () { P().openDetail('matmoves', r.dataset.id); }; });
      draw();
    });
  }

  /* ================================================================
     REPORTS CENTRE
     ================================================================ */
  var RDEF = {
    md: { t: 'Management overview', d: 'One page for the MD: money, approvals, procurement, sites, materials and machines.', i: 'pulse', c: '#1B2F9E' },
    proc: { t: 'Procurement report', d: 'PRs, quotations, purchase orders, deliveries and top vendors.', i: 'cart', c: '#E8127C' },
    acc: { t: 'Accounts & payables', d: 'Vendor bills, what is due, overdue, payments and receivables.', i: 'rupee', c: '#0E9F6E' },
    mat: { t: 'Materials report', d: 'Stock at store and sites, issues, short / excess, service and loss.', i: 'box', c: '#B5309F' },
    mch: { t: 'Machinery & equipment', d: 'Where every machine is, breakdowns, repairs, missing, service due.', i: 'bolt', c: '#C26A00' },
    site: { t: 'Site progress report', d: 'Daily site reports: progress, manpower and safety by project.', i: 'clipboard', c: '#1667C4' },
    my: { t: 'My work report', d: 'Your requests, approvals waiting for you and your tasks.', i: 'target', c: '#121B54' }
  };
  function reportsPage(v) {
    P().setTitle('Reports', 'Formatted reports · print or save as PDF');
    var R = X().rep(), allowed = X().admin() ? Object.keys(RDEF) : (R.view && R.view.length ? R.view : ['my']);
    v.innerHTML = '<p class="note" style="margin:0 0 14px">Each report opens as a clean, printable document with the company letterhead. ' + (window.PE_CANDL() ? 'You can print, save as PDF or download the data.' : 'You can view and print. Downloads are enabled by the Super Admin.') + '</p>' +
      '<div class="pe-rgrid">' + Object.keys(RDEF).map(function (k) {
        var d = RDEF[k], ok = allowed.indexOf(k) > -1;
        return '<button class="glass pe-rcard' + (ok ? '' : ' locked') + '" data-r="' + k + '"><span style="--c:' + d.c + '">' + ic(ok ? d.i : 'lock', 20) + '</span><b>' + esc(d.t) + '</b><small>' + esc(ok ? d.d : 'No access. Ask your Super Admin.') + '</small></button>';
      }).join('') + '</div>' + (X().admin() ? '<p class="note" style="margin-top:14px">' + ic('key', 13) + ' Super Admin: set who can open and download each report in <a href="#" id="toAcl">System › Report access</a>.</p>' : '');
    v.querySelectorAll('[data-r]').forEach(function (b) {
      b.onclick = function () { if (b.classList.contains('locked')) { P().toast('You do not have access to this report. Please ask your Super Admin.', true); return; } P().go({ v: 'report', r: b.dataset.r }); };
    });
    if ($('toAcl')) $('toAcl').onclick = function (e) { e.preventDefault(); P().go({ v: 'repacl' }); };
  }

  /* a report = list of blocks; each block renders to screen AND print with the same HTML */
  function box(items) { return '<div class="rp-boxes">' + items.filter(Boolean).map(function (b) { return '<div class="rp-box' + (b[2] ? ' ' + b[2] : '') + '"><small>' + esc(b[0]) + '</small><b>' + b[1] + '</b>' + (b[3] ? '<em>' + esc(b[3]) + '</em>' : '') + '</div>'; }).join('') + '</div>'; }
  function sec(title, body, note) { return '<section class="rp-sec"><h3>' + esc(title) + (note ? '<small>' + esc(note) + '</small>' : '') + '</h3>' + body + '</section>'; }
  function tbl(head, data, right) {
    if (!data.length) return '<p class="rp-none">Nothing to show.</p>';
    right = right || [];
    return '<table class="rp-t"><thead><tr>' + head.map(function (h, i) { return '<th' + (right.indexOf(i) > -1 ? ' class="r"' : '') + '>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      data.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td' + (right.indexOf(i) > -1 ? ' class="r"' : '') + '>' + (c == null ? '' : c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }
  function bars(list) { var mx = Math.max.apply(null, list.map(function (x) { return x[1]; }).concat([1])); return '<div class="rp-bars">' + list.map(function (x) { return '<div><span>' + esc(x[0]) + '</span><i><b style="width:' + Math.max(1, x[1] / mx * 100) + '%"></b></i><em>' + (x[2] || x[1]) + '</em></div>'; }).join('') + '</div>'; }
  function countBy(list, k) { var o = {}; list.forEach(function (r) { var v = r[k] || '-'; o[v] = (o[v] || 0) + 1; }); return o; }
  function statusRow(list, k) { var c = countBy(list, k || 'status'); return Object.keys(c).sort(function (a, b) { return c[b] - c[a]; }).map(function (s) { return '<span class="rp-chip">' + esc(s) + ' <b>' + c[s] + '</b></span>'; }).join(''); }

  var BUILD = {
    md: function () {
      var h = P().S.home || {}, k = h.kpi || {};
      return Promise.all([rows('projects'), rows('dsr'), rows('machinery'), rows('matitems'), rows('matmoves')]).then(function (r) {
        var out = [];
        out.push(box([k.payables != null && ['Payables outstanding', short(k.payables), '', 'vendor bills'], k.overdue != null && ['Overdue', short(k.overdue), k.overdue ? 'bad' : '', short(k.dueWeek) + ' due in 7 days'],
          k.receivables != null && ['Receivables', short(k.receivables), 'good', 'client invoices'], k.poFyVal != null && ['PO value this FY', short(k.poFyVal), '', 'approved POs'],
          ['Waiting for approval', (h.inbox || []).length, (h.inbox || []).length ? 'warn' : '', 'items with you'], k.pettyCash != null && ['Petty cash', short(k.pettyCash), '', 'balance']]));
        var alerts = (h.tips || []).map(function (t) { return [(t.warn ? '<span class="rp-dot bad"></span>' : '<span class="rp-dot"></span>') + esc(t.t)]; });
        out.push(sec('What needs attention', alerts.length ? '<ul class="rp-list">' + alerts.map(function (a) { return '<li>' + a[0] + '</li>'; }).join('') + '</ul>' : '<p class="rp-none">Nothing urgent. All on track.</p>'));
        if ((h.inbox || []).length) out.push(sec('Approvals pending', tbl(['Document', 'Raised by', 'Amount', 'Since'], h.inbox.slice(0, 12).map(function (i) { return ['<b>' + esc(i.title) + '</b><br><small>' + esc(i.id) + '</small>', esc(i.who) + '<br><small>' + esc(i.dept || '') + '</small>', i.amount ? money(i.amount) : '-', esc(i.since || fd(i.date))]; }), [2]), h.inbox.length + ' item(s)'));
        if (k.poChart) out.push(sec('Approved PO value - last 6 months', bars(k.poChart.map(function (x) { return [x.label, x.v, short(x.v)]; }))));
        if (k.topVendors && k.topVendors.length) out.push(sec('Top vendors this year', bars(k.topVendors.map(function (x) { return [x.v, x.amt, short(x.amt)]; }))));
        if (k.ageing) out.push(sec('Payables ageing', box([['0-30 days', short(k.ageing.b30)], ['31-60 days', short(k.ageing.b60)], ['61-90 days', short(k.ageing.b90), k.ageing.b90 ? 'warn' : ''], ['Over 90 days', short(k.ageing.b90p), k.ageing.b90p ? 'bad' : '']])));
        if (r[0]) out.push(sec('Projects', '<div class="rp-chips">' + statusRow(r[0], 'pstatus') + '</div>' + tbl(['Project', 'Client', 'Location', 'Status'], r[0].slice(0, 15).map(function (p) { return ['<b>' + esc(p.name) + '</b>', esc(p.client), esc(p.location), esc(p.pstatus)]; }))));
        if (r[1]) { var last = {}; r[1].forEach(function (d) { if (!last[d.project] || d.date > last[d.project].date) last[d.project] = d; }); out.push(sec('Latest site reports', tbl(['Project', 'Date', 'Progress', 'Manpower', 'Safety'], Object.keys(last).map(function (p) { var d = last[p]; return ['<b>' + esc(p) + '</b>', esc(fd(d.date)), n(d.progress) + '%', n(d.manpower), esc(d.safety || '-')]; }), [2, 3]))); }
        if (r[3]) { var st = matStock(r[3], r[4] || []); out.push(sec('Materials', box([['Materials', st.length], ['Low / out of stock', st.filter(function (o) { return /Low|Out/.test(o.state); }).length, 'warn'], ['Short / lost', st.filter(function (o) { return o.short || o.lost; }).length, 'bad']]))); }
        if (r[2]) out.push(sec('Machinery', '<div class="rp-chips">' + statusRow(r[2]) + '</div>' + tbl(['Machine', 'Site', 'Status'], r[2].filter(function (m) { return /Breakdown|Repair|Missing/.test(m.status); }).map(function (m) { return ['<b>' + esc(m.code || '') + '</b> ' + esc(m.name), esc(m.project), esc(m.status)]; }))));
        return out;
      });
    },
    proc: function () {
      return Promise.all([rows('pr'), rows('quotes'), rows('po'), rows('grn')]).then(function (r) {
        var pr = r[0] || [], qc = r[1] || [], po = r[2] || [], out = [];
        var open = po.filter(function (p) { return ['Approved', 'Sent to Vendor', 'Partially Received'].indexOf(p.status) > -1; });
        var pend = po.filter(function (p) { return /Pending/.test(p.status); });
        out.push(box([['Purchase requests', pr.length, '', pr.filter(function (x) { return x.status === 'Approved'; }).length + ' waiting for PO'], ['Comparisons open', qc.filter(function (x) { return x.status === 'Open'; }).length], ['POs pending approval', pend.length, pend.length ? 'warn' : '', short(pend.reduce(function (t, p) { return t + n(p.total); }, 0))], ['Open POs', open.length, '', short(open.reduce(function (t, p) { return t + n(p.total); }, 0))]]));
        if (po.length) out.push(sec('Purchase orders by status', '<div class="rp-chips">' + statusRow(po) + '</div>'));
        out.push(sec('Open purchase orders (to receive)', tbl(['PO', 'Date', 'Vendor', 'Project', 'Value', 'Received'], open.map(function (p) { return ['<b>' + esc(p.id) + '</b>', esc(fd(p.date)), esc(p.vendor), esc(p.project), money(p.total), n(p.receivedPct) + '%']; }), [4, 5])));
        if (pend.length) out.push(sec('Waiting for approval', tbl(['PO', 'Vendor', 'Value', 'Status'], pend.map(function (p) { return ['<b>' + esc(p.id) + '</b>', esc(p.vendor), money(p.total), esc(p.status)]; }), [2])));
        var pa = pr.filter(function (x) { return ['Submitted', 'Approved'].indexOf(x.status) > -1; });
        if (pa.length) out.push(sec('Purchase requests in progress', tbl(['PR', 'Requested by', 'Project', 'Needed by', 'Priority', 'Status'], pa.map(function (x) { return ['<b>' + esc(x.id) + '</b>', esc(x.requestedBy), esc(x.project), esc(fd(x.requiredBy)), esc(x.priority), esc(x.status)]; }))));
        var vt = {}; po.filter(function (p) { return !/Draft|Rejected|Cancelled|Pending/.test(p.status); }).forEach(function (p) { vt[p.vendor] = (vt[p.vendor] || 0) + n(p.total); });
        var tv = Object.keys(vt).map(function (k) { return [k, vt[k], short(vt[k])]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 8);
        if (tv.length) out.push(sec('Top vendors by approved PO value', bars(tv)));
        return out;
      });
    },
    acc: function () {
      return Promise.all([rows('bills'), rows('payments'), rows('clientbills'), rows('expenses')]).then(function (r) {
        var b = r[0] || [], pay = r[1] || [], cb = r[2] || [], ex = r[3] || [], t = today(), out = [];
        var due = b.filter(function (x) { return n(x.balance) > 0 && !/Rejected|Paid$/.test(x.status); });
        var od = due.filter(function (x) { return x.dueDate && x.dueDate < t; });
        out.push(box([['Payables outstanding', short(due.reduce(function (s, x) { return s + n(x.balance); }, 0)), '', due.length + ' bill(s)'], ['Overdue', short(od.reduce(function (s, x) { return s + n(x.balance); }, 0)), od.length ? 'bad' : '', od.length + ' bill(s)'],
          ['Payments to approve', pay.filter(function (x) { return x.status === 'Requested'; }).length, 'warn'], ['Receivables', short(cb.reduce(function (s, x) { return s + n(x.balance); }, 0)), 'good', cb.filter(function (x) { return n(x.balance) > 0; }).length + ' invoice(s)']]));
        var vb = {}; due.forEach(function (x) { vb[x.vendor] = (vb[x.vendor] || 0) + n(x.balance); });
        out.push(sec('Outstanding by vendor', tbl(['Vendor', 'Bills', 'Balance'], Object.keys(vb).sort(function (a, c) { return vb[c] - vb[a]; }).map(function (k) { return ['<b>' + esc(k) + '</b>', due.filter(function (x) { return x.vendor === k; }).length, money(vb[k])]; }), [1, 2])));
        if (od.length) out.push(sec('Overdue bills', tbl(['Bill', 'Vendor', 'Due date', 'Days late', 'Balance'], od.sort(function (a, c) { return a.dueDate < c.dueDate ? -1 : 1; }).map(function (x) { return ['<b>' + esc(x.billNo || x.id) + '</b><br><small>' + esc(x.id) + '</small>', esc(x.vendor), esc(fd(x.dueDate)), Math.round((new Date(t) - new Date(x.dueDate)) / 864e5), money(x.balance)]; }), [3, 4])));
        var rp = pay.filter(function (x) { return x.status !== 'Rejected'; }).slice(-15).reverse();
        if (rp.length) out.push(sec('Recent payments', tbl(['Payment', 'Date', 'Vendor', 'Mode', 'Amount', 'Status'], rp.map(function (x) { return ['<b>' + esc(x.id) + '</b>', esc(fd(x.date)), esc(x.vendor), esc(x.mode), money(x.amount), esc(x.status)]; }), [4])));
        var ep = ex.filter(function (x) { return /Submitted|Approved/.test(x.status); });
        if (ep.length) out.push(sec('Expense claims to settle', tbl(['Claim', 'Employee', 'Category', 'Amount', 'Status'], ep.map(function (x) { return ['<b>' + esc(x.id) + '</b>', esc(x.employee), esc(x.category), money(x.amount), esc(x.status)]; }), [3])));
        return out;
      });
    },
    mat: function () {
      return Promise.all([rows('matitems'), rows('matmoves')]).then(function (r) {
        var st = matStock(r[0] || [], r[1] || []), mv = (r[1] || []).filter(function (m) { return m.status !== 'Cancelled'; }), out = [], from = addDays(today(), -30);
        out.push(box([['Materials', st.length], ['Low / out of stock', st.filter(function (o) { return /Low|Out/.test(o.state); }).length, 'warn'], ['At service / loan', P().r2(st.reduce(function (t, o) { return t + n(o.loc[SVC]) + n(o.loc[LOAN]); }, 0))], ['Short / lost / scrap', st.filter(function (o) { return o.short || o.lost || o.scrap; }).length, 'bad'], ['Movements (30 days)', mv.filter(function (m) { return m.date >= from; }).length]]));
        out.push(sec('Stock position', tbl(['Material', 'Unit', 'In hand', 'Where it is', 'Status'], st.map(function (o) { return ['<b>' + esc(o.item.name) + '</b><br><small>' + esc(o.item.code || '') + '</small>', esc(o.item.uom), o.total, Object.keys(o.loc).filter(function (l) { return Math.abs(o.loc[l]) > 0.0001; }).map(function (l) { return esc(l) + ': ' + P().r2(o.loc[l]); }).join('<br>'), esc(o.state)]; }), [2])));
        var loss = st.filter(function (o) { return o.short || o.excess || o.lost || o.scrap; });
        if (loss.length) out.push(sec('Short, excess, lost and scrap', tbl(['Material', 'Short', 'Excess', 'Lost', 'Scrap'], loss.map(function (o) { return ['<b>' + esc(o.item.name) + '</b>', o.short || '-', o.excess || '-', o.lost || '-', o.scrap || '-']; }), [1, 2, 3, 4])));
        var due = []; st.forEach(function (o) { o.overdue.forEach(function (m) { due.push(['<b>' + esc(o.item.name) + '</b>', esc(m.type), m.qty, esc(m.toLoc || m.party || '-'), esc(fd(m.dueBack))]); }); });
        if (due.length) out.push(sec('Overdue from service / loan', tbl(['Material', 'Movement', 'Qty', 'With', 'Due back'], due, [2])));
        var site = {}; mv.filter(function (m) { return /^Issue/.test(m.type); }).forEach(function (m) { var s = m.toLoc || m.project || '-'; site[s] = (site[s] || 0) + 1; });
        if (Object.keys(site).length) out.push(sec('Issues by site (number of issue slips)', bars(Object.keys(site).map(function (s) { return [s, site[s]]; }).sort(function (a, b) { return b[1] - a[1]; }))));
        out.push(sec('Movement trail (latest 25)', tbl(['Date', 'Material', 'Movement', 'Qty', 'From → To', 'By'], mv.slice().sort(function (a, b) { return String(b.date + b.id) < String(a.date + a.id) ? -1 : 1; }).slice(0, 25).map(function (m) { return [esc(fd(m.date)), esc(m.item), esc(m.type), m.qty, esc((m.fromLoc || '-') + ' → ' + (m.toLoc || '-')), esc(m.handledBy)]; }), [3])));
        return out;
      });
    },
    mch: function () {
      return rows('machinery').then(function (m) {
        m = m || []; var t = today(), out = [];
        out.push(box([['Machines', m.length], ['Working', m.filter(function (x) { return x.status === 'Working'; }).length, 'good'], ['Breakdown / repair', m.filter(function (x) { return /Breakdown|Repair/.test(x.status); }).length, 'warn'], ['Missing', m.filter(function (x) { return x.status === 'Missing'; }).length, 'bad'], ['Service overdue', m.filter(function (x) { return x.nextService && x.nextService < t && x.status !== 'Scrapped'; }).length, 'warn']]));
        var bySite = {}; m.forEach(function (x) { bySite[x.project || '-'] = (bySite[x.project || '-'] || 0) + 1; });
        out.push(sec('Machines by site', bars(Object.keys(bySite).map(function (s) { return [s, bySite[s]]; }).sort(function (a, b) { return b[1] - a[1]; }))));
        var bad = m.filter(function (x) { return /Breakdown|Repair|Missing/.test(x.status); });
        if (bad.length) out.push(sec('Needs action', tbl(['Tag', 'Machine', 'Site', 'Custodian', 'Status'], bad.map(function (x) { return ['<b>' + esc(x.code) + '</b>', esc(x.name), esc(x.project), esc(x.custodian), esc(x.status)]; }))));
        out.push(sec('Full machine register', tbl(['Tag', 'Machine', 'Category', 'Site', 'Custodian', 'Next service', 'Status'], m.map(function (x) { return ['<b>' + esc(x.code) + '</b>', esc(x.name), esc(x.category), esc(x.project), esc(x.custodian), esc(fd(x.nextService)) + (x.nextService && x.nextService < t ? ' ⚠' : ''), esc(x.status)]; }))));
        return out;
      });
    },
    site: function () {
      return rows('dsr').then(function (d) {
        d = d || []; var from = addDays(today(), -30), r30 = d.filter(function (x) { return x.date >= from; }), out = [];
        out.push(box([['Reports (30 days)', r30.length], ['Projects reporting', Object.keys(countBy(r30, 'project')).length], ['Avg manpower / day', r30.length ? Math.round(r30.reduce(function (t, x) { return t + n(x.manpower); }, 0) / Math.max(1, Object.keys(countBy(r30, 'date')).length)) : 0], ['Safety events', r30.filter(function (x) { return x.safety && x.safety !== 'No incident'; }).length, r30.some(function (x) { return x.safety === 'Incident'; }) ? 'bad' : '']]));
        var last = {}; d.forEach(function (x) { if (!last[x.project] || x.date > last[x.project].date) last[x.project] = x; });
        out.push(sec('Progress by project', bars(Object.keys(last).map(function (p) { return [p, n(last[p].progress), n(last[p].progress) + '%']; }))));
        out.push(sec('Latest report per project', tbl(['Project', 'Date', 'Progress', 'Manpower', 'Safety', 'By'], Object.keys(last).map(function (p) { var x = last[p]; return ['<b>' + esc(p) + '</b>', esc(fd(x.date)), n(x.progress) + '%', n(x.manpower), esc(x.safety), esc(x.reportedBy)]; }), [2, 3])));
        var ev = r30.filter(function (x) { return x.safety && x.safety !== 'No incident'; });
        if (ev.length) out.push(sec('Safety events (30 days)', tbl(['Date', 'Project', 'Type', 'Issues'], ev.map(function (x) { return [esc(fd(x.date)), esc(x.project), esc(x.safety), esc(x.issues || '')]; }))));
        return out;
      });
    },
    my: function () {
      var h = P().S.home || {}, ws = h.ws || {}, out = [];
      out.push(box([['Waiting for you', (h.inbox || []).length, (h.inbox || []).length ? 'warn' : ''], ['My open requests', (h.mine || []).length], ['My tasks', (ws.tasks || []).length, (ws.tasks || []).some(function (t) { return t.late; }) ? 'bad' : ''], ['Notices to read', (ws.notices || []).filter(function (x) { return x.need && !x.acked; }).length]]));
      out.push(sec('My requests', tbl(['Request', 'Date', 'Amount', 'Status', 'With'], (h.mine || []).map(function (m) { return ['<b>' + esc(m.title) + '</b><br><small>' + esc(m.id) + '</small>', esc(fd(m.date)), m.amount ? money(m.amount) : '-', esc(m.status), esc(m.waiting || '-')]; }), [2])));
      out.push(sec('Waiting for my action', tbl(['Document', 'From', 'Amount', 'Since'], (h.inbox || []).map(function (i) { return ['<b>' + esc(i.title) + '</b><br><small>' + esc(i.id) + '</small>', esc(i.who), i.amount ? money(i.amount) : '-', esc(i.since || '')]; }), [2])));
      out.push(sec('My tasks', tbl(['Task', 'From', 'Due', 'Status'], (ws.tasks || []).map(function (t) { return ['<b>' + esc(t.title) + '</b>', esc(t.by), esc(fd(t.due)) + (t.late ? ' <span class="rp-dot bad"></span>' : ''), esc(t.status)]; }))));
      return Promise.resolve(out);
    }
  };

  var CUR = null;
  function reportView(v, r) {
    var key = r.r, d = RDEF[key];
    if (!d) return P().go({ v: 'reports' });
    var R = X().rep(), allowed = X().admin() || (R.view || ['my']).indexOf(key) > -1;
    P().setTitle(d.t, 'Reports');
    if (!allowed) { v.innerHTML = '<div class="pe-deny"><div class="pe-deny-ic">' + ic('lock', 34) + '</div><h2>You are not authorised to view this report</h2><p>Please ask your Super Admin to give you access in Report access.</p><div class="pe-deny-a"><button class="btn primary" onclick="PE.go({v:\'reports\'})">Back to Reports</button></div></div>'; return; }
    v.innerHTML = '<div class="pe-tb rp-tools"><button class="btn ghost" id="rpBack">‹ Reports</button><div class="grow"></div>' +
      '<button class="btn soft" id="rpRef">' + ic('pulse', 15) + 'Refresh</button><button class="btn primary" id="rpPrint">' + ic('print', 16) + 'Print / Save PDF</button>' + (window.PE_CANDL() ? '<button class="btn soft" id="rpXls">' + ic('down', 15) + 'Download Excel</button>' : '') + '</div><div class="rp-paper" id="rpBody"></div>';
    $('rpBack').onclick = function () { P().go({ v: 'reports' }); };
    $('rpRef').onclick = function () { P().S.cache = {}; P().go(r); };
    P().skeleton($('rpBody'), 10);
    BUILD[key]().then(function (blocks) {
      var u = P().S.sess.user, now = new Date();
      var head = '<header class="rp-head"><div>' + (window.LOGO_FULL ? '<img class="rp-logo" src="' + window.LOGO_FULL + '" alt="Port Energy Private Limited">' : '') + '<small>PORT ENERGY PRIVATE LIMITED</small><h1>' + esc(d.t) + '</h1><p>' + esc(d.d) + '</p></div><dl><dt>Report date</dt><dd>' + esc(fd(today())) + '</dd><dt>Prepared for</dt><dd>' + esc(u.name) + '</dd><dt>Generated</dt><dd>' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + '</dd></dl></header>';
      var html = head + blocks.join('') + '<footer class="rp-foot">Generated from Port Energy ERP · figures as on ' + esc(fd(today())) + ' · Confidential - for internal use only</footer>';
      CUR = { key: key, title: d.t, html: html };
      $('rpBody').innerHTML = html;
      $('rpPrint').onclick = function () { P().printHtml('<div class="rpx">' + html + '</div>', { title: d.t + ' ' + today(), report: true }); };
      if ($('rpXls')) $('rpXls').onclick = function () { downloadXls(d.t, html); };
    }).catch(function (e) { $('rpBody').innerHTML = '<div class="empty"><b>Could not build the report</b>' + esc(e.message) + '</div>'; });
  }
  /** Excel-readable file (HTML table workbook) with every table of the report, formatted */
  function downloadXls(title, html) {
    var tmp = document.createElement('div'); tmp.innerHTML = html;
    var parts = [];
    tmp.querySelectorAll('.rp-sec').forEach(function (s) { var h = s.querySelector('h3'), t = s.querySelector('table'); if (t) parts.push('<h3>' + esc(h ? h.textContent : '') + '</h3>' + t.outerHTML); });
    var boxes = Array.prototype.map.call(tmp.querySelectorAll('.rp-box'), function (b) { return '<tr><td>' + esc(b.querySelector('small').textContent) + '</td><td><b>' + esc(b.querySelector('b').textContent) + '</b></td></tr>'; }).join('');
    var doc = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"><style>body{font-family:Calibri,Arial}h2{color:#1B2F9E}h3{color:#E8127C;margin-top:14px}table{border-collapse:collapse}th{background:#0B1546;color:#fff;padding:6px 10px;border:1px solid #9AA6D6}td{padding:5px 10px;border:1px solid #C9D0EA;vertical-align:top}</style></head><body>' +
      '<h2>Port Energy Private Limited - ' + esc(title) + '</h2><p>As on ' + esc(fd(today())) + '</p>' + (boxes ? '<table>' + boxes + '</table>' : '') + parts.join('') + '</body></html>';
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + doc], { type: 'application/vnd.ms-excel' })); a.download = title.replace(/[^\w]+/g, '-') + '-' + today() + '.xls'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  /* ================================================================
     HELP & USER GUIDE
     ================================================================ */
  var GUIDES = [
    ['Sign in', 'Type your mobile number or email. Your photo and name appear - check it is you. Choose "Use my PIN" (fastest) or "Send OTP" (code comes to your email). Forgot your PIN? Tap Forgot PIN - the Super Admin gets a request and resets it.'],
    ['Raise a purchase request (PR)', 'Menu › Procurement › Purchase Requests › New (or Alt + N). Pick the project, add each item with qty and unit, give the purpose and the date you need it. Submit - it goes to your reporting manager, then the department head.'],
    ['Make a purchase order (PO)', 'Open an approved PR › Create PO. Or Purchase Orders › New. Pick the vendor - GST and last rates fill in by themselves. Check the terms, then Save & submit (Ctrl + Enter). POs above the limit go to the MD.'],
    ['Compare quotations', 'Procurement › Quotation Comparison › New. Enter up to 4 vendors and their rates per item. The ERP marks L1 automatically. From L1 tap "Create PO from L1".'],
    ['Receive goods (GRN)', 'Open the PO › Receive goods (MIGO). Enter accepted and rejected qty, challan and invoice numbers, add photos. Post - the PO shows how much is received.'],
    ['Enter a vendor bill and request payment', 'Open the PO › Enter bill (MIRO). Check it matches the PO and GRN. Once verified, open the bill › Request payment. Accounts and the MD approve, then mark it paid with the UTR.'],
    ['Approve or reject', 'Tap Approvals (Alt + A). Every item shows who raised it, the amount and the approval chain. Tap Approve, or Reject with a reason. The person is told immediately.'],
    ['Claim an expense', 'Home › My workspace › Expense claim. Enter the amount, category and attach the bill photo. It goes to your reporting manager.'],
    ['Daily site report', 'Home › Daily site report. Enter progress %, manpower, work done, issues and photos - takes two minutes from the phone.'],
    ['Record a material movement', 'Materials › Material Movements › New. Choose the movement (receipt, issue to site, return, transfer, service, loan, scrap, lost or physical count), the material and qty, from and to. The status board updates instantly.'],
    ['Find anything', 'Press Ctrl + K (or tap Search). Type a PO number, vendor, item, bill number - or a T-code like ME21N, MIGO, MIRO, FBL1N.'],
    ['Print a document', 'Open the record › Print (Alt + P). Every document prints on the company letterhead in its own professional format. Choose "Save as PDF" in the print window to make a PDF.'],
    ['Open a report', 'Menu › Reports & Help › Reports (Alt + R). Pick a report, then Print / Save PDF. Downloads appear only if the Super Admin allowed them.'],
    ['Ask the AI', 'Tap AI (Alt + I). Type or tap the microphone for a voice call - speak in English or Tamil, it answers aloud. It can draft emails, check GST / HSN and explain rules. It cannot see ERP records.'],
    ['Set or change your PIN', 'Tap your name at the bottom of the menu › Set / change PIN. Use 4 to 6 digits that only you know.'],
    ['Install the app', 'On a phone: open the ERP in Chrome › menu › Add to Home screen. On a computer: use the Windows app. It works offline for the screens you opened, and saves your work when the network returns.']
  ];
  var QUICK = [['pr', 'Purchase request', 'cart'], ['expenses', 'Expense claim', 'receipt'], ['dsr', 'Site report', 'clipboard'], ['leaves', 'Leave', 'calendar'], ['matmoves', 'Material movement', 'swap'], ['approvals', 'Approval note', 'stamp']];
  function helpPage(v) {
    P().setTitle('Help & user guide', 'Quick tools, how-to and shortcuts');
    var u = P().S.sess.user, sa = ((P().S.opts || {}).users || []).filter(function (x) { return x.role === 'Super Admin'; }).map(function (x) { return x.v; });
    var qt = QUICK.filter(function (q) { var e = P().ent(q[0]); return e && e.canCreate; });
    v.innerHTML = '<div class="hp-hero glass"><div><small>Hi ' + esc(String(u.name).split(' ').slice(-1)[0]) + ',</small><h2>How can we help?</h2><div class="search hp-q">' + ic('search', 17) + '<input id="hpQ" placeholder="Type what you want to do - e.g. PO, payment, PIN, material"></div></div></div>' +
      '<h3 class="hp-h">Quick tools</h3><div class="hp-tools">' +
      qt.map(function (q) { return '<button class="glass hp-tool" data-new="' + q[0] + '">' + ic(q[2], 20) + '<span>New ' + esc(q[1].toLowerCase()) + '</span></button>'; }).join('') +
      '<button class="glass hp-tool" data-do="find">' + ic('search', 20) + '<span>Search anything</span></button><button class="glass hp-tool" data-do="ai">' + ic('bolt', 20) + '<span>Ask AI</span></button><button class="glass hp-tool" data-do="voice">' + ic('megaphone', 20) + '<span>AI voice call</span></button><button class="glass hp-tool" data-do="reports">' + ic('ledger', 20) + '<span>Reports</span></button></div>' +
      '<div class="grid2"><div class="glass panel"><h3>How do I…</h3><div id="hpG"></div></div>' +
      '<div><div class="glass panel"><h3>Keyboard shortcuts <small class="note">press one to test it</small></h3><div id="hpTest" class="hp-test">Press any shortcut below - it lights up here.</div><table class="tb hp-keys">' + P().SHORTCUTS.map(function (k, i) { return '<tr data-i="' + i + '"><td><kbd>' + esc(k[0]) + '</kbd></td><td>' + esc(k[1]) + '</td></tr>'; }).join('') + '</table><p class="note" style="margin-top:8px">On a phone use the buttons at the bottom; shortcuts are for computers.</p></div>' +
      '<div class="glass panel" style="margin-top:14px"><h3>Quick support</h3><p class="note">For access, a new login, a PIN reset or a wrong entry, contact the Super Admin' + (sa.length ? ': <b>' + esc(sa.join(', ')) + '</b>' : '') + '.</p><div class="hp-sup"><button class="btn soft sm" id="hpCopy">' + ic('copy', 14) + 'Copy my details for support</button><button class="btn soft sm" id="hpRefresh">' + ic('pulse', 14) + 'Refresh the app</button></div></div></div></div>';
    function drawG(q) {
      q = (q || '').toLowerCase();
      var g = GUIDES.filter(function (x) { return !q || (x[0] + ' ' + x[1]).toLowerCase().indexOf(q) > -1; });
      $('hpG').innerHTML = g.length ? g.map(function (x, i) { return '<details class="hp-d"' + (q && i < 2 ? ' open' : '') + '><summary>' + esc(x[0]) + '</summary><p>' + esc(x[1]) + '</p></details>'; }).join('') : '<div class="empty"><b>No guide found</b>Try another word, or ask the AI.</div>';
    }
    drawG(''); $('hpQ').oninput = function () { drawG(this.value); };
    v.querySelectorAll('[data-new]').forEach(function (b) { b.onclick = function () { P().openForm(b.dataset.new); }; });
    v.querySelectorAll('[data-do]').forEach(function (b) { b.onclick = function () { var d = b.dataset.do; if (d === 'find') document.getElementById('topFind').click(); else if (d === 'ai') P().openAI(); else if (d === 'voice') voiceCall(); else P().go({ v: 'reports' }); }; });
    $('hpCopy').onclick = function () { var t = 'Port Energy ERP support\nName: ' + u.name + '\nRole: ' + u.role + '\nDept: ' + (u.dept || '') + '\nScreen: ' + innerWidth + 'x' + innerHeight + '\nApp: ' + (navigator.userAgent.match(/(Chrome|Firefox|Safari|Edg)\/[\d.]+/) || [''])[0] + '\nOnline: ' + navigator.onLine + '\nTime: ' + new Date().toLocaleString('en-IN'); try { navigator.clipboard.writeText(t).then(function () { P().toast('Copied. Paste it in WhatsApp or email to the Super Admin.'); }); } catch (e) { P().toast(t); } };
    $('hpRefresh').onclick = function () { location.reload(); };
  }
  /* shortcut tester: light up the row of the shortcut just pressed (the shortcut itself still runs) */
  document.addEventListener('keydown', function (e) {
    var t = $('hpTest'); if (!t) return;
    var map = { KeyK: e.ctrlKey || e.metaKey ? 0 : -1, KeyN: e.altKey ? 1 : -1, KeyS: e.ctrlKey || e.metaKey ? 2 : -1, Enter: e.ctrlKey || e.metaKey ? 3 : -1, KeyP: e.altKey ? 4 : -1, KeyH: e.altKey ? 5 : -1, KeyA: e.altKey ? 6 : -1, KeyR: e.altKey ? 7 : -1, KeyG: e.altKey ? 8 : -1, KeyI: e.altKey ? 9 : -1, Escape: 10, Slash: e.shiftKey ? 11 : 0 };
    var i = map[e.code]; if (i == null || i < 0) return;
    var k = P().SHORTCUTS[i]; t.innerHTML = '<b>' + ic('check', 15) + ' Works:</b> <kbd>' + esc(k[0]) + '</kbd> ' + esc(k[1]); t.classList.remove('hit'); void t.offsetWidth; t.classList.add('hit');
    document.querySelectorAll('.hp-keys tr').forEach(function (r) { r.classList.toggle('on', +r.dataset.i === i); });
  }, true);

  /* ================================================================
     AI VOICE CALL - speak, Gemini answers, the phone reads it aloud
     Uses the same server AI (key stays on the server), the browser's speech recognition and voice.
     ================================================================ */
  var VC = null;
  function voiceCall() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || !window.speechSynthesis) { P().toast('Voice call needs Chrome or Edge (Android / Windows). Please type instead.', true); P().openAI(); return; }
    if (VC) return;
    var lang = P().store.get('pe_vlang') || 'en-IN';
    var el = document.createElement('div'); el.className = 'vc'; el.innerHTML =
      '<div class="vc-in"><div class="vc-top"><b>Port Energy AI</b><small>Voice call · Gemini</small></div>' +
      '<div class="vc-orb" id="vcOrb"><i></i><i></i><i></i><span>' + ic('megaphone', 34) + '</span></div>' +
      '<div class="vc-st" id="vcSt">Connecting…</div><div class="vc-tx" id="vcTx"></div>' +
      '<div class="vc-lang"><button data-l="en-IN"' + (lang === 'en-IN' ? ' class="on"' : '') + '>English</button><button data-l="ta-IN"' + (lang === 'ta-IN' ? ' class="on"' : '') + '>தமிழ்</button></div>' +
      '<div class="vc-a"><button class="vc-mute" id="vcMute" aria-label="Pause">' + ic('clock', 22) + '</button><button class="vc-end" id="vcEnd" aria-label="End call">' + ic('plus', 26) + '</button></div></div>';
    document.body.appendChild(el); requestAnimationFrame(function () { el.classList.add('open'); });
    var hist = [], rec = null, paused = false, ended = false;
    VC = { el: el };
    function st(t, mode) { $('vcSt').textContent = t; $('vcOrb').className = 'vc-orb ' + (mode || ''); }
    function line(who, t) { var x = $('vcTx'); x.insertAdjacentHTML('beforeend', '<p class="' + who + '">' + esc(t) + '</p>'); x.scrollTop = x.scrollHeight; }
    function speak(t, done) {
      var clean = String(t).replace(/[*#_`>|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 900);
      var u = new SpeechSynthesisUtterance(clean); u.lang = lang; u.rate = 1.02;
      var vs = speechSynthesis.getVoices().filter(function (v) { return v.lang === lang || v.lang.replace('_', '-') === lang; }); if (vs.length) u.voice = vs[0];
      u.onend = u.onerror = function () { if (!ended) done(); };
      st('Speaking…', 'talk'); speechSynthesis.cancel(); speechSynthesis.speak(u);
    }
    function listen() {
      if (ended || paused) return;
      rec = new SR(); rec.lang = lang; rec.interimResults = true; rec.maxAlternatives = 1; rec.continuous = false;
      var finalT = '';
      rec.onresult = function (e) { var t = ''; for (var i = 0; i < e.results.length; i++) { t += e.results[i][0].transcript; if (e.results[i].isFinal) finalT = t; } st('“' + t + '”', 'hear'); };
      rec.onerror = function (e) { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { st('Microphone is blocked. Allow the microphone and try again.', ''); ended = true; } };
      rec.onend = function () { if (ended || paused) return; if (finalT.trim()) ask(finalT.trim()); else setTimeout(listen, 250); };
      try { rec.start(); st('Listening… speak now', 'hear'); } catch (x) { setTimeout(listen, 400); }
    }
    function ask(q) {
      line('me', q); st('Thinking…', 'think');
      var sys = lang === 'ta-IN' ? ' (Reply in simple spoken Tamil, short, 2 to 4 sentences, no lists.)' : ' (Reply in short spoken English, 2 to 4 sentences, no lists or tables.)';
      P().call('aiChat', P().S.token, hist.slice(-10), q + sys, { web: false }).then(function (r) {
        hist.push({ r: 'me', t: q }, { r: 'ai', t: r.text }); line('ai', r.text); speak(r.text, listen);
      }).catch(function (e) { line('ai', e.message); speak(lang === 'ta-IN' ? 'மன்னிக்கவும், மீண்டும் சொல்லுங்கள்.' : 'Sorry, please say that again.', listen); });
    }
    function end() { ended = true; try { rec && rec.abort(); } catch (x) { } speechSynthesis.cancel(); el.classList.remove('open'); setTimeout(function () { el.remove(); }, 300); VC = null; }
    $('vcEnd').onclick = end;
    $('vcMute').onclick = function () { paused = !paused; this.classList.toggle('on', paused); if (paused) { try { rec && rec.abort(); } catch (x) { } speechSynthesis.cancel(); st('Paused - tap again to talk', ''); } else listen(); };
    el.querySelectorAll('[data-l]').forEach(function (b) { b.onclick = function () { lang = b.dataset.l; P().store.set('pe_vlang', lang); el.querySelectorAll('[data-l]').forEach(function (x) { x.classList.toggle('on', x === b); }); try { rec && rec.abort(); } catch (x) { } }; });
    var hi = String(P().S.sess.user.name).split(' ').slice(-1)[0];
    speak(lang === 'ta-IN' ? 'வணக்கம் ' + hi + '. சொல்லுங்கள், நான் எப்படி உதவலாம்?' : P().greet() + ' ' + hi + '. How can I help you?', listen);
  }
  window.PE_VOICE = voiceCall;
  /* microphone button in the AI panel */
  function addMic() {
    var h = document.querySelector('#aip .aih'); if (!h || h.querySelector('.vc-btn')) return;
    var b = document.createElement('button'); b.className = 'btn soft sm vc-btn'; b.type = 'button'; b.innerHTML = '&#127908; Voice call'; b.onclick = voiceCall;
    h.insertBefore(b, $('aiNew'));
  }
  document.addEventListener('DOMContentLoaded', addMic); setTimeout(addMic, 800);

  window.PE_VIEWS = window.PE_VIEWS || {};
  window.PE_VIEWS.reports = reportsPage;
  window.PE_VIEWS.report = reportView;
  window.PE_VIEWS.matstatus = matBoard;
  window.PE_VIEWS.help = helpPage;
  window.PE_MAT = matStock;
})();
