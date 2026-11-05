/* © 2026 Port Energy Private Limited. All rights reserved. Proprietary and confidential. */
/**
 * PORT ENERGY ERP - EXECUTIVE DASHBOARD (home screen)
 * Builds the executive layout on top of the normal home screen:
 *   hero banner with port + pipeline artwork, icon KPI cards, project portfolio, project status,
 *   management alerts, procurement workflow, PO value trend, top vendors, site manpower.
 * Every number comes from the ERP itself (home data + Projects + Daily Site Reports).
 * Nothing is invented: a panel without data stays hidden. Existing buttons keep working
 * because the original home panels are moved, not copied.
 */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function inrShort(n) {
    n = Number(n) || 0; var a = Math.abs(n);
    if (a >= 1e7) return '₹ ' + (n / 1e7).toFixed(2).replace(/\.?0+$/, '') + ' Cr';
    if (a >= 1e5) return '₹ ' + (n / 1e5).toFixed(2).replace(/\.?0+$/, '') + ' L';
    return '₹ ' + Math.round(n).toLocaleString('en-IN');
  }
  function ymd(v) { v = String(v || ''); if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10); var m = /^(\d{2})-([A-Za-z]{3})-(\d{4})/.exec(v); if (m) { var i = MON.indexOf(m[2]); if (i > -1) return m[3] + '-' + ('0' + (i + 1)).slice(-2) + '-' + m[1]; } return ''; }
  function pretty(d) { d = ymd(d); if (!d) return '-'; return d.slice(8, 10) + ' ' + MON[+d.slice(5, 7) - 1] + ' ' + d.slice(0, 4); }
  function daysAgo(d) { d = ymd(d); if (!d) return null; return Math.round((new Date(new Date().toDateString()) - new Date(d + 'T00:00:00')) / 864e5); }
  function nav(title) {
    var a = Array.prototype.slice.call(document.querySelectorAll('#nav .ni')).filter(function (x) { return x.textContent.replace(/\s+/g, ' ').trim().indexOf(title) === 0; })[0];
    if (a) a.click();
  }
  function call(fn, args) {
    return new Promise(function (ok, bad) { window.google.script.run.withSuccessHandler(ok).withFailureHandler(bad)[fn].apply(null, args); });
  }
  function token() { try { return localStorage.getItem('pe_token'); } catch (x) { return null; } }

  var ICO = {
    rupee: '<path d="M7 5h10M7 9h10M7 5c5 0 7 1.6 7 4s-2 4-7 4l7 6"/>',
    cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.6 12.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    wallet: '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M16 13h2M3 10h18M7 6V4h10v2"/>',
    bill: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    alert: '<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17v.5"/>',
    inbox: '<path d="M3 13h5l2 3h4l2-3h5"/><path d="M5 5h14l2 8v6H3v-6z"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>',
    tool: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z"/>',
    doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
    scale: '<path d="M12 3v18M5 21h14M6 7h12M6 7l-3 6a3 3 0 0 0 6 0zM18 7l-3 6a3 3 0 0 0 6 0z"/>',
    people: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.6"/><path d="M15 20a5 5 0 0 1 6-4.8"/>',
    helmet: '<path d="M4 16a8 8 0 0 1 16 0"/><path d="M2 16h20v3H2zM12 8V5M9 9V6M15 9V6"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    flag: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'
  };
  function ico(n, s) { return '<svg width="' + (s || 20) + '" height="' + (s || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICO[n] || '') + '</svg>'; }

  /* port + pipeline artwork for the banner (vector, brand colours, no photos) */
  var ART = '<svg class="dx-art" viewBox="0 0 640 200" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">' +
    '<defs><linearGradient id="dxSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14206B" stop-opacity="0"/><stop offset=".55" stop-color="#7A1E8E" stop-opacity=".55"/><stop offset="1" stop-color="#F3026E" stop-opacity=".85"/></linearGradient>' +
    '<linearGradient id="dxSun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD39A"/><stop offset="1" stop-color="#FF7A59"/></linearGradient>' +
    '<linearGradient id="dxSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E2A7A"/><stop offset="1" stop-color="#081446"/></linearGradient>' +
    '<linearGradient id="dxPipe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5DD6FF"/><stop offset=".45" stop-color="#0089F5"/><stop offset="1" stop-color="#0B2A88"/></linearGradient></defs>' +
    '<rect width="640" height="200" fill="url(#dxSky)"/>' +
    '<circle cx="470" cy="128" r="34" fill="url(#dxSun)" opacity=".9"/>' +
    '<rect y="132" width="640" height="68" fill="url(#dxSea)"/>' +
    '<g fill="#091446" opacity=".92">' +
      // container cranes
      '<path d="M250 132V58h6v74zM230 70h80v6h-80zM296 76l-4 20h-4l4-20zM250 58l-14 12h6l10-8z"/><path d="M262 76v38h-4V76z"/>' +
      '<path d="M340 132V40h7v92zM318 54h96v7h-96zM404 61l-5 24h-5l5-24zM340 40l-18 14h7l13-10z"/><path d="M354 61v46h-5V61z"/>' +
      '<path d="M560 132V64h5v68zM544 74h66v5h-66zM600 79l-3 16h-4l3-16z"/>' +
      // ship with containers
      '<path d="M86 124h140l-14 14H98z"/><rect x="100" y="106" width="22" height="18"/><rect x="124" y="110" width="20" height="14"/><rect x="146" y="102" width="22" height="22"/><rect x="170" y="108" width="20" height="16"/><rect x="192" y="96" width="14" height="28"/>' +
    '</g>' +
    '<g opacity=".55"><rect x="102" y="108" width="18" height="5" fill="#F3026E"/><rect x="148" y="104" width="18" height="5" fill="#01B7A0"/><rect x="172" y="110" width="16" height="4" fill="#0089F5"/></g>' +
    '<g stroke="#5DD6FF" stroke-opacity=".25" stroke-width="1"><path d="M0 146h640M0 158h640"/></g>' +
    // foreground pipeline with flanges
    '<path d="M-10 186 C160 168 300 176 650 160" stroke="url(#dxPipe)" stroke-width="20" fill="none" stroke-linecap="round"/>' +
    '<path d="M-10 186 C160 168 300 176 650 160" stroke="#BFF0FF" stroke-opacity=".5" stroke-width="3" fill="none" transform="translate(0,-6)"/>' +
    '<g fill="#0B2A88"><rect x="120" y="164" width="8" height="28" rx="2"/><rect x="300" y="160" width="8" height="28" rx="2"/><rect x="480" y="152" width="8" height="28" rx="2"/></g>' +
    '</svg>';

  /* ---------------- KPI cards: icon + colour per card ---------------- */
  var KPI_STYLE = [
    [/awaiting approval/i, 'clock', 'pink'], [/Open PO value/i, 'cart', 'blue'], [/PO value this FY/i, 'chart', 'violet'],
    [/PRs waiting/i, 'doc', 'teal'], [/^Payables/i, 'bill', 'navy'], [/^Overdue/i, 'alert', 'red'], [/not billed/i, 'box', 'amber'],
    [/Receivables/i, 'rupee', 'teal'], [/Petty cash/i, 'wallet', 'green'], [/Payments awaiting/i, 'scale', 'violet'], [/maintenance/i, 'tool', 'amber']
  ];
  function styleKpis() {
    Array.prototype.forEach.call(document.querySelectorAll('#kpis .kpi:not([data-dx])'), function (k) {
      var l = (k.querySelector('.l') || {}).textContent || '';
      var s = KPI_STYLE.filter(function (x) { return x[0].test(l); })[0] || [null, 'chart', 'blue'];
      k.setAttribute('data-dx', s[2]);
      var i = document.createElement('span'); i.className = 'dx-ki'; i.innerHTML = ico(s[1], 22);
      k.insertBefore(i, k.firstChild);
    });
  }

  /* ---------------- build ---------------- */
  var built = null, proj = null;
  function hero(h) {
    var s = window.PE_SESSION || {}, u = s.user || {};
    var t = new Date();
    var exec = u.admin || (u.role && u.role !== 'Staff');
    var nm = String(u.name || '').split(' ').slice(-1)[0];
    var hr = t.getHours(), g = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
    return '<section class="dx-hero">' + ART +
      '<div class="dx-hl"><div class="dx-eye">' + (exec ? 'Executive dashboard' : 'My dashboard') + '</div>' +
      '<h2>' + (exec ? 'Company Operations Overview' : g + (nm ? ', ' + esc(nm) : '')) + '</h2>' +
      '<p>' + ico('clock', 15) + ' ' + DAY[t.getDay()] + ', ' + ('0' + t.getDate()).slice(-2) + ' ' + MON[t.getMonth()] + ' ' + t.getFullYear() + ' <i></i> Chennai, TN' + (exec && nm ? ' <i></i> ' + g + ', ' + esc(nm) : '') + '</p>' +
      '<button class="dx-find" type="button" data-dx-find>' + ico('search', 16) + ' Search PO, vendor, item, bill <kbd>Ctrl K</kbd></button></div>' +
      '<div class="dx-motto">Impossible can be <b>possible.</b></div></section>';
  }
  function panel(cls, icon, title, body, extra) {
    return '<section class="glass dx-p ' + cls + '"><h3><span class="dx-hi">' + ico(icon, 17) + '</span>' + title + (extra || '') + '</h3>' + body + '</section>';
  }
  function alerts(h) {
    var a = [];
    var ib = (h.inbox || []).length;
    if (ib) a.push(['red', ib, 'Waiting for your approval', 'PO, payments, requests', function () { nav('Approvals'); }]);
    var late = ((h.ws || {}).tasks || []).filter(function (t) { return t.late; }).length;
    if (late) a.push(['amber', late, 'Overdue tasks', 'Assigned to you', function () { nav('Tasks'); }]);
    var nt = ((h.ws || {}).notices || []).filter(function (n) { return n.need && !n.acked; }).length;
    if (nt) a.push(['blue', nt, 'Notices to acknowledge', 'Notice Board', function () { nav('Notice Board'); }]);
    (h.tips || []).filter(function (t) { return t.warn; }).slice(0, 2).forEach(function (t) {
      var m = /^(\d+)\s*(.*)$/.exec(t.t); a.push(['amber', m ? m[1] : '!', m ? m[2] : t.t, '', function () { var e = document.querySelector('#tips [data-k="' + t.go.k + '"]'); if (e) e.click(); }]);
    });
    if ((h.ws || {}).dsrRequired && !(h.ws || {}).dsrToday) a.push(['red', '!', "Today's site report pending", 'Reminder mail at 6 PM', function () { var e = document.querySelector('[data-new="dsr"]'); if (e) e.click(); }]);
    if (!a.length) return { html: '<div class="dx-empty">' + ico('flag', 26) + '<b>All clear</b><span>Nothing needs your attention.</span></div>', fns: [] };
    return {
      html: a.slice(0, 5).map(function (x, i) { return '<button class="dx-al dx-' + x[0] + '" type="button" data-al="' + i + '"><b>' + esc(x[1]) + '</b><span><strong>' + esc(x[2]) + '</strong>' + (x[3] ? '<small>' + esc(x[3]) + '</small>' : '') + '</span>' + ico('arrow', 16) + '</button>'; }).join(''),
      fns: a.map(function (x) { return x[4]; })
    };
  }
  function flow(k) {
    if (k.poPending == null) return '';
    var steps = [['PR', 'waiting for PO', k.prApproved, 'doc', 'Purchase Requests'], ['Quotes', 'comparisons open', k.qcOpen, 'scale', 'Quotation Comparison'],
      ['PO', 'awaiting approval', k.poPending, 'clock', 'Purchase Orders'], ['GRN', 'POs to receive', k.poOpen, 'truck', 'Goods Receipts'], ['Bills', 'to verify', k.billsToVerify, 'bill', 'Vendor Bills']];
    return panel('dx-flow', 'cart', 'Procurement workflow <small>right now</small>',
      '<div class="dx-steps">' + steps.map(function (s, i) {
        return (i ? '<span class="dx-arrow">' + ico('arrow', 18) + '</span>' : '') + '<button type="button" class="dx-step" data-nav="' + esc(s[4]) + '"><span class="dx-hex">' + ico(s[3], 22) + '</span><b>' + esc(s[0]) + '</b><strong>' + (s[2] == null ? '-' : s[2]) + '</strong><small>' + esc(s[1]) + '</small></button>';
      }).join('') + '</div>');
  }
  function trend(k) {
    var d = k.poChart; if (!d || !d.length) return '';
    var W = 420, H = 230, pl = 46, pr = 14, pt = 16, pb = 28, mx = Math.max.apply(null, d.map(function (x) { return x.v; }).concat([1]));
    var step = (W - pl - pr) / Math.max(1, d.length - 1);
    var pts = d.map(function (x, i) { return [pl + i * step, pt + (H - pt - pb) * (1 - x.v / mx)]; });
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var area = line + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (H - pb) + ' L' + pl + ' ' + (H - pb) + ' Z';
    var grid = [0, .5, 1].map(function (f) { var y = pt + (H - pt - pb) * (1 - f); return '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '"/><text x="' + (pl - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + inrShort(mx * f).replace('₹ ', '') + '</text>'; }).join('');
    return panel('dx-trend', 'chart', 'Approved PO value <small>last 6 months</small>',
      '<svg class="dx-chart" viewBox="0 0 ' + W + ' ' + H + '"><defs><linearGradient id="dxArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0089F5" stop-opacity=".35"/><stop offset="1" stop-color="#F3026E" stop-opacity="0"/></linearGradient><linearGradient id="dxLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#01B7A0"/><stop offset=".5" stop-color="#0089F5"/><stop offset="1" stop-color="#F3026E"/></linearGradient></defs>' +
      '<g class="dx-grid">' + grid + '</g><path d="' + area + '" fill="url(#dxArea)"/><path class="dx-line" d="' + line + '" fill="none" stroke="url(#dxLine)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
      pts.map(function (p, i) { return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="4.5"><title>' + d[i].label + ': ' + inrShort(d[i].v) + '</title></circle><text class="dx-x" x="' + p[0].toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(d[i].label) + '</text>'; }).join('') + '</svg>');
  }
  function vendors(k) {
    var v = k.topVendors; if (!v || !v.length) return '';
    var mx = v[0].amt || 1, col = ['#F3026E', '#0089F5', '#01B7A0', '#7A3FF2', '#F59E0B'];
    return panel('dx-vend', 'people', 'Top vendors <small>this financial year</small>',
      '<div class="dx-vl">' + v.slice(0, 5).map(function (x, i) {
        return '<button type="button" class="dx-vr" data-vendor="' + esc(x.v) + '"><span class="dx-rank" style="background:' + col[i % 5] + '">' + (i + 1) + '</span><span class="dx-vn">' + esc(x.v) + '<i><em style="width:' + Math.max(4, x.amt / mx * 100) + '%;background:' + col[i % 5] + '"></em></i></span><b>' + inrShort(x.amt) + '</b></button>';
      }).join('') + '</div>');
  }

  function build() {
    var c = $('content'), h2 = c && c.querySelector('.hero2'), h = window.PE_HOME;
    if (!h2 || !h || h2.getAttribute('data-dx') === '1') return;
    h2.setAttribute('data-dx', '1');
    var k = h.kpi || {};
    var wrap = document.createElement('div'); wrap.className = 'dx'; wrap.id = 'dx';
    var al = alerts(h);
    wrap.innerHTML = hero(h) +
      '<div class="dx-slot-kpi"></div>' +
      '<div class="dx-row dx-r1">' +
        panel('dx-port', 'layers', 'Project portfolio', '<div id="dxPort" class="dx-load"><i></i><i></i><i></i></div>', '<button type="button" class="dx-link" data-nav="Projects / Sites">View all ' + ico('arrow', 14) + '</button>') +
        panel('dx-donut', 'helmet', 'Projects by status', '<div id="dxDonut" class="dx-load"><i></i></div>') +
        panel('dx-alerts', 'bell', 'Management alerts', '<div class="dx-als">' + al.html + '</div>') +
      '</div>' +
      '<div class="dx-row dx-r2">' + flow(k) + trend(k) + vendors(k) + '</div>' +
      '<div class="dx-row dx-r3">' + panel('dx-site', 'helmet', 'Manpower & site status <small>latest daily report</small>', '<div id="dxSite" class="dx-load"><i></i><i></i></div>') + '<div class="dx-slot-inbox"></div></div>';
    h2.parentNode.insertBefore(wrap, h2);
    // move the live home panels into the new layout (their buttons keep working)
    var kp = $('kpis'); if (kp) wrap.querySelector('.dx-slot-kpi').appendChild(kp);
    var ib = $('hInbox'); if (ib) wrap.querySelector('.dx-slot-inbox').appendChild(ib.closest('.glass'));
    ['poChart', 'topV', 'tips'].forEach(function (id) { var el = $(id); if (el && el.closest('.glass')) el.closest('.glass').classList.add('dx-hide'); });
    Array.prototype.forEach.call(c.querySelectorAll('.grid2'), function (g) { if (!g.querySelector('.glass:not(.dx-hide)')) g.classList.add('dx-hide'); });
    // actions
    wrap.querySelectorAll('[data-al]').forEach(function (b) { b.onclick = function () { var f = al.fns[+b.dataset.al]; if (f) f(); }; });
    wrap.querySelectorAll('[data-nav]').forEach(function (b) { b.onclick = function () { nav(b.dataset.nav); }; });
    var hf = wrap.querySelector('[data-dx-find]'); if (hf) hf.onclick = function () { var o = $('hFind') || $('sideFind'); if (o) o.click(); };
    wrap.querySelectorAll('[data-vendor]').forEach(function (b) { b.onclick = function () { var o = $('sideFind'); if (!o) return; o.click(); var i = $('palIn'); if (i) { i.value = b.dataset.vendor; i.dispatchEvent(new Event('input', { bubbles: true })); } }; });
    styleKpis();
    built = wrap;
    loadProjects();
  }

  /* projects + latest daily site report per project */
  function loadProjects() {
    var tok = token(); if (!tok) return;
    var p1 = call('listRecords', [tok, 'projects']), p2 = call('listRecords', [tok, 'dsr']).catch(function () { return { rows: [] }; });
    Promise.all([p1, p2]).then(function (r) { proj = { projects: (r[0] && r[0].rows) || [], dsr: (r[1] && r[1].rows) || [] }; drawProjects(); })
      .catch(function () { ['dx-port', 'dx-donut', 'dx-site'].forEach(function (c) { var e = built && built.querySelector('.' + c); if (e) e.classList.add('dx-hide'); }); });
  }
  function drawProjects() {
    if (!built || !proj || !document.body.contains(built)) return;
    var latest = {};
    proj.dsr.forEach(function (r) { var p = r.project, d = ymd(r.date); if (!p || !d) return; if (!latest[p] || d > latest[p].d) latest[p] = { d: d, progress: r.progress, manpower: r.manpower, safety: r.safety, by: r.reportedBy }; });
    var list = proj.projects.slice().sort(function (a, b) { var o = { 'Active': 0, 'On Hold': 1, 'Completed': 2 }; return (o[a.pstatus] || 0) - (o[b.pstatus] || 0); });
    // portfolio table
    var port = $('dxPort');
    if (port) {
      port.classList.remove('dx-load');
      port.innerHTML = list.length ? '<div class="dx-tbl"><div class="dx-th"><span>Project / site</span><span>Progress</span><span>Status</span><span>Last report</span></div>' +
        list.slice(0, 6).map(function (p, i) {
          var L = latest[p.name] || {}, pg = Math.max(0, Math.min(100, Number(L.progress) || 0)), ago = daysAgo(L.d);
          var st = p.pstatus || 'Active', cls = st === 'Completed' ? 'ok' : st === 'On Hold' ? 'warn' : (ago != null && ago > 3 ? 'bad' : 'ok');
          var label = st === 'Active' && ago != null && ago > 3 ? 'No report ' + ago + 'd' : st === 'Active' ? 'On track' : st;
          if (st === 'Active' && L.d == null) { label = 'No reports'; cls = 'mute'; }
          return '<button type="button" class="dx-tr" data-proj="' + esc(p.id) + '" style="--d:' + i * 60 + 'ms"><span class="dx-pn"><span class="dx-pav dx-c' + (i % 5) + '">' + esc(String(p.name).slice(0, 2).toUpperCase()) + '</span><span><b>' + esc(p.name) + '</b><small>' + esc([p.client, p.location].filter(Boolean).join(' · ') || p.manager || '') + '</small></span></span>' +
            '<span class="dx-pg"><b>' + (L.d ? pg + '%' : '-') + '</b><i><em style="width:' + pg + '%"></em></i></span><span><span class="dx-st dx-' + cls + '">' + esc(label) + '</span></span><span class="dx-dt">' + (L.d ? pretty(L.d) : '-') + '</span></button>';
        }).join('') + '</div>' : '<div class="dx-empty">' + ico('layers', 26) + '<b>No projects yet</b><span>Add sites under Projects / Sites.</span></div>';
      port.querySelectorAll('[data-proj]').forEach(function (b) { b.onclick = function () { nav('Projects / Sites'); }; });
    }
    // donut by status
    var dn = $('dxDonut');
    if (dn) {
      dn.classList.remove('dx-load');
      var cnt = { 'Active': 0, 'On Hold': 0, 'Completed': 0 }; list.forEach(function (p) { cnt[p.pstatus || 'Active'] = (cnt[p.pstatus || 'Active'] || 0) + 1; });
      var tot = list.length, segs = [['Active', '#01B7A0'], ['On Hold', '#F59E0B'], ['Completed', '#0089F5']], R = 52, C = 2 * Math.PI * R, off = 0;
      dn.innerHTML = '<div class="dx-dn"><svg viewBox="0 0 140 140"><circle cx="70" cy="70" r="' + R + '" fill="none" stroke="#EEF1F7" stroke-width="16"/>' +
        segs.map(function (s) { var f = tot ? cnt[s[0]] / tot : 0, len = f * C, el = '<circle class="dx-seg" cx="70" cy="70" r="' + R + '" fill="none" stroke="' + s[1] + '" stroke-width="16" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 70 70)"/>'; off += len; return f ? el : ''; }).join('') +
        '</svg><div class="dx-dc"><b>' + tot + '</b><span>Projects</span></div></div><div class="dx-lg">' +
        segs.map(function (s) { return '<span><i style="background:' + s[1] + '"></i>' + s[0] + '<b>' + cnt[s[0]] + (tot ? ' <small>(' + Math.round(cnt[s[0]] / tot * 100) + '%)</small>' : '') + '</b></span>'; }).join('') + '</div>';
    }
    // site manpower from the latest report of each active project
    var site = $('dxSite');
    if (site) {
      site.classList.remove('dx-load');
      var act = list.filter(function (p) { return (p.pstatus || 'Active') === 'Active' && latest[p.name]; });
      var total = act.reduce(function (s, p) { return s + (Number(latest[p.name].manpower) || 0); }, 0);
      site.innerHTML = act.length ? '<div class="dx-mt"><span>Total manpower on site</span><b>' + total + '</b>' + ico('people', 20) + '</div>' +
        act.slice(0, 6).map(function (p) { var L = latest[p.name]; return '<div class="dx-ms"><span>' + ico('helmet', 16) + esc(p.name) + '<small>' + pretty(L.d) + (L.safety && L.safety !== 'No incident' ? ' · <em>' + esc(L.safety) + '</em>' : '') + '</small></span><b>' + (Number(L.manpower) || 0) + '</b></div>'; }).join('')
        : '<div class="dx-empty">' + ico('helmet', 26) + '<b>No site reports yet</b><span>Manpower shows here from Daily Site Reports.</span></div>';
    }
  }

  /* login screen: same port + pipeline artwork as the dashboard banner */
  (function () {
    var bg = document.querySelector('#login .lx-bg');
    if (!bg || bg.querySelector('.dx-art')) return;
    var d = document.createElement('div'); d.className = 'dx-lart'; d.innerHTML = ART.replace(/dxSky|dxSun|dxSea|dxPipe/g, function (m) { return m + 'L'; });
    bg.appendChild(d);
  })();

  var q = false;
  function soon() { if (q) return; q = true; requestAnimationFrame(function () { q = false; build(); styleKpis(); if (built && proj && $('dxPort') && $('dxPort').classList.contains('dx-load')) drawProjects(); }); }
  var content = $('content');
  if (content) new MutationObserver(soon).observe(content, { childList: true, subtree: true });
  window.addEventListener('pe-home', function () { built = null; soon(); });
})();
