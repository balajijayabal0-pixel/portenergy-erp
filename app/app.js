/* © 2026 Port Energy Private Limited. All rights reserved. Proprietary and confidential. */
(function () {
'use strict';
/* =====================================================================
   PORT ENERGY ERP - client  (Procurement + Accounts + Admin)
   ===================================================================== */
var S = { token: null, sess: null, opts: {}, route: { v: 'home' }, cache: {}, total: {}, vi: {}, ii: {}, lh: null, sort: {} };
var $ = function (id) { return document.getElementById(id); };
var store = {
  get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { } },
  del: function (k) { try { localStorage.removeItem(k); } catch (e) { } }
};
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function initials(n) { return String(n || '?').replace(/[^A-Za-z ]/g, ' ').trim().split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase() || 'PE'; }
var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fdate(d) { if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '')) return d || ''; var p = d.split('-'); return p[2] + '-' + MON[+p[1] - 1] + '-' + p[0]; }
function ddot(d) { if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '')) return d || ''; var p = d.split('-'); return p[2] + '.' + p[1] + '.' + p[0]; }
function num(v) { var n = Number(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(n) ? n : 0; }
function r2(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }
function inr(n, noSym) { var s = num(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); return noSym ? s : '₹ ' + s; }
function inrShort(n) { n = num(n); if (Math.abs(n) >= 1e7) return '₹ ' + r2(n / 1e7) + ' Cr'; if (Math.abs(n) >= 1e5) return '₹ ' + r2(n / 1e5) + ' L'; return inr(n); }
function today() { return S.sess ? S.sess.today : new Date().toISOString().slice(0, 10); }
function debounce(fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; }
var MONEY_AUTO = ['subtotal', 'gstAmount', 'total', 'net', 'paid', 'balance', 'received', 'amount', 'gstAmt', 'lastRate', 'tot1', 'tot2', 'tot3', 'tot4', 'l1Total', 'saving'];
var PCT_AUTO = ['receivedPct'];
var TCODE = { po: 'ME23N', pr: 'ME53N', quotes: 'ME49', grn: 'MB51', bills: 'MIR4', payments: 'F-53', vendors: 'XK03', items: 'MM03', clientbills: 'FB70', ledger: 'FBL1N', ageing: 'S_ALR', org: 'ORG' };

/* ---------------- icons ---------------- */
var IC = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>', list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>', check: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.5A6.5 6.5 0 0 1 21.5 20"/>',
  org: '<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/>',
  truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>', box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/>',
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h12l2-8H6"/>', po: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 14l2 2 4-4"/>',
  scale: '<path d="M12 3v18M5 21h14M6 7h12M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7z"/>', bill: '<path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
  rupee: '<path d="M6 4h12M6 9h12M6 4h3a5 5 0 0 1 0 10H6l9 7"/>', receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>', invoice: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h8"/>',
  site: '<path d="M2 20h20M4 20V9l6-4v15M10 20V5l10 5v10"/><path d="M14 13h2M14 16h2"/>', laptop: '<rect x="4" y="4" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
  stack: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>', swap: '<path d="M7 4L3 8l4 4M3 8h14M17 12l4 4-4 4M21 16H7"/>',
  visitor: '<circle cx="12" cy="7" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', car: '<path d="M5 16h14l-1.5-6.5A2 2 0 0 0 15.6 8H8.4a2 2 0 0 0-1.9 1.5z"/><circle cx="7.5" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/>',
  tool: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-3-3 8-8-1.3-1.3a4 4 0 0 0-5-5z"/><path d="M3 21l6-6"/>', camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  ledger: '<path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M8 9h8M8 13h8M8 17h5"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  chev: '<path d="M6 9l6 6 6-6"/>', plus: '<path d="M12 5v14M5 12h14"/>', down: '<path d="M12 4v12M6 11l6 6 6-6M4 20h16"/>', print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>', lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  stamp: '<path d="M9 3h6l-1 7h4l1 5H5l1-5h4z"/><path d="M4 21h16"/>', target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>', calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M17 8a5 5 0 0 1 0 8M20 5a9 9 0 0 1 0 14"/>', gavel: '<path d="M14 5l5 5M11 8l5 5M12.5 6.5l-6 6 3 3 6-6M4 20h9"/><path d="M8.5 14.5L3 20"/>',
  pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>', server: '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>', key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/>', warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17h.01"/>'
};
function icon(n, s) { return '<svg width="' + (s || 18) + '" height="' + (s || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[n] || IC.box) + '</svg>'; }

/* ---------------- server bridge ---------------- */
function call(fn) {
  var args = Array.prototype.slice.call(arguments, 1);
  return new Promise(function (res, rej) {
    var r = google.script.run.withSuccessHandler(res).withFailureHandler(function (e) {
      var msg = (e && e.message ? e.message : String(e)).replace(/^(Exception|Error):\s*/, '');
      if (/SESSION_EXPIRED/.test(msg)) { toast('Session expired. Please sign in again.', true); signOut(true); }
      rej(new Error(msg));
    });
    r[fn].apply(r, args);
  });
}
var tt;
function toast(m, bad) { var t = $('toast'); t.textContent = m; t.className = (bad ? 'err' : 'ok') + ' show'; clearTimeout(tt); tt = setTimeout(function () { t.className = t.className.replace(' show', ''); }, bad ? 4600 : 2600); }
function busy(b, on, label) { if (!b) return; if (on) { b.dataset.l = b.innerHTML; b.disabled = true; b.innerHTML = '<span class="spin"></span>' + (label || ''); } else { b.disabled = false; if (b.dataset.l) b.innerHTML = b.dataset.l; } }
function fail(e) { toast(e.message || String(e), true); }
var LOADQ = ['Great things load step by step - just like great projects.', 'Tip: tap \u2728 AI to draft a vendor email in seconds.', 'Quality takes a moment. Your data is on the way.', 'Tip: set a PIN once and sign in with one tap.', 'Every approval you clear moves a project forward.', 'Tip: press Back to return to the previous screen.', 'Impossible can be possible - loading your workspace.', 'Tip: use Search to find any PO, vendor or bill instantly.', 'Safety first, quality always - fetching the latest data.', 'Small steps, big results. Almost there...', 'Tip: tap Copy on an AI answer and paste it straight into Outlook.', 'Good work is never in a hurry - and neither are good numbers.'];
var LQI = Math.floor(Math.random() * 12);
function loadLine() { LQI = (LQI + 1) % LOADQ.length; return LOADQ[LQI]; }
function skeleton(el, rows) {
  var n = Math.max(3, Math.min(6, rows || 6)), h = '';
  for (var i = 0; i < n; i++) h += '<div class="pl-card" style="--i:' + i + '"><div class="pl-row"><i class="pl-av"></i><span><i class="pl-l" style="width:' + (55 + (i * 17) % 35) + '%"></i><i class="pl-l s" style="width:' + (30 + (i * 23) % 30) + '%"></i></span><i class="pl-pill"></i></div><i class="pl-l" style="width:' + (70 + (i * 11) % 25) + '%"></i></div>';
  el.innerHTML = '<div class="pl-wrap"><div class="pl-head"><span class="pl-orb"><i></i><i></i><i></i><b></b></span><span class="pl-tx"><b class="ldq-t">' + esc(loadLine()) + '</b><span class="pl-flow"><i></i></span></span></div><div class="pl-grid">' + h + '</div></div>';
  var t = setInterval(function () { var s = el.querySelector('.ldq-t'); if (!s || !document.body.contains(s)) { clearInterval(t); return; } s.classList.remove('in'); void s.offsetWidth; s.textContent = loadLine(); s.classList.add('in'); }, 2300);
}
document.addEventListener('pointerdown', function (e) {
  var b = e.target.closest('.btn'); if (!b || b.disabled) return;
  var r = b.getBoundingClientRect(), s = document.createElement('span'), d = Math.max(r.width, r.height);
  s.className = 'rip'; s.style.width = s.style.height = d + 'px'; s.style.left = (e.clientX - r.left - d / 2) + 'px'; s.style.top = (e.clientY - r.top - d / 2) + 'px';
  b.appendChild(s); setTimeout(function () { s.remove(); }, 650);
});
function countUp(el) {
  var to = num(el.dataset.n), fmt = el.dataset.f, t0 = performance.now(), dur = 750;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = fmt === 'inr' ? inrShort(to) : Math.round(to); return; }
  (function step(t) { var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3), v = to * e; el.textContent = fmt === 'inr' ? inrShort(v) : Math.round(v); if (k < 1) requestAnimationFrame(step); })(t0);
}

function ent(k) { return S.sess && (S.sess.entities || []).filter(function (e) { return e.key === k; })[0] || null; }
function fld(e, k) { return e.fields.filter(function (f) { return f.k === k; })[0]; }
function statusCls(s) {
  s = String(s || '');
  if (/^(Approved|Paid|Received|Posted|Completed|Reimbursed|Verified|PO Created|Published|Reviewed)$/.test(s)) return 'b-ok';
  if (/Rejected|Cancelled|Overdue/.test(s)) return 'b-bad';
  if (/Partially|On Hold|In Progress|^Open$|Pending/.test(s)) return 'b-warn';
  if (/Sent to Vendor|Closed|Dispatched|Done - Verify/.test(s)) return 'b-pink';
  if (/Draft|Withdrawn|Dropped/.test(s)) return 'b-mute';
  return 'b-info';
}
function statusExtra(e, r) {
  var h = '';
  if (e.dueField && e.flow && e.flow.open && e.flow.open.indexOf(r.status) > -1 && r[e.dueField] && r[e.dueField] < today()) h += ' ' + badge('Overdue');
  if (e.chain && r.status === 'Pending Approval' && r.route) { var c = r.route.filter(function (x) { return x.st === 'pending'; })[0]; if (c) h += '<div class="note" style="font-size:11.5px">with ' + esc(c.name) + '</div>'; }
  return h;
}
function badge(s) { return s ? '<span class="badge ' + statusCls(s) + '">' + esc(s) + '</span>' : ''; }
function isMoney(f) { return f.t === 'money' || (f.t === 'auto' && MONEY_AUTO.indexOf(f.k) > -1); }
function fval(f, v, plain) {
  if (v === '' || v == null || (Array.isArray(v) && !v.length)) return plain ? '' : '<span style="color:#A3ABCB">-</span>';
  if (f.k === 'status') return plain ? v : badge(v);
  if (isMoney(f)) return inr(v);
  if (f.t === 'auto' && PCT_AUTO.indexOf(f.k) > -1) return v + '%';
  if (f.t === 'date' || f.k === 'lastDate') return fdate(v);
  if (f.t === 'files') return v.length + ' file(s)';
  return plain ? String(v) : esc(v);
}
var SYS = { id: { k: 'id', l: 'No', t: 'text' }, status: { k: 'status', l: 'Status', t: 'text' }, createdBy: { k: 'createdBy', l: 'Created by', t: 'text' }, createdAt: { k: 'createdAt', l: 'Created at', t: 'text' } };
function colDef(e, k) { return SYS[k] || fld(e, k) || { k: k, l: k, t: 'text' }; }
function fileId(u) { return (String(u).match(/\/d\/([^/]+)/) || [])[1] || ''; }
function thumb(u, w) { return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(fileId(u)) + '&sz=w' + (w || 300); }
function findOpt(list, v) { return (S.opts[list] || []).filter(function (o) { return o.v === v; })[0]; }

/* ---------------- HSN suggestions (when item is not in master or history) ---------------- */
var HSN = [
  [/hdpe|pvc|upvc|cpvc|ppr\b|polyethylene|electrofusion|plastic pipe/i, '3917', '18', 'Plastic pipes & fittings'],
  [/seamless/i, '7304', '18', 'Seamless steel pipes'],
  [/ms pipe|gi pipe|erw|steel pipe|ms tube|gi tube|steel tube/i, '7306', '18', 'Welded steel pipes / tubes'],
  [/elbow|\btee\b|reducer|flange|coupling|pipe fitting|nipple|union/i, '7307', '18', 'Steel pipe fittings'],
  [/valve/i, '8481', '18', 'Valves'],
  [/distribution board|panel board|\bdb\b|control panel|feeder pillar/i, '8537', '18', 'Panels / distribution boards'],
  [/\bmcb\b|rccb|elcb|isolator|switch|socket|plug|\blug|connector|fuse|terminal/i, '8536', '18', 'Switching / connecting apparatus (≤1000 V)'],
  [/cable|wire/i, '8544', '18', 'Insulated cables / wires'],
  [/thinner|solvent/i, '3814', '18', 'Thinners / solvents'],
  [/primer|enamel|epoxy|polyurethane|\bpu\b|paint|coating|varnish/i, '3208', '18', 'Paints / coatings (solvent based; water based = 3209)'],
  [/bolt|\bnut\b|washer|screw|\bstud\b|fastener/i, '7318', '18', 'Bolts, nuts, screws, washers'],
  [/electrode|welding rod|filler wire/i, '8311', '18', 'Welding electrodes'],
  [/tmt|rebar|steel bar|reinforcement/i, '7214', '18', 'Steel bars / TMT'],
  [/\bangle\b|channel|\bbeam\b|joist|ismb|ismc/i, '7216', '18', 'Steel angles / channels / sections'],
  [/ms plate|chequered|steel plate|ms sheet|hr plate/i, '7208', '18', 'Hot-rolled steel plates / sheets'],
  [/cement/i, '2523', '18', 'Cement'],
  [/\bsand\b/i, '2505', '5', 'Natural sand'],
  [/aggregate|jelly|blue metal|crushed stone/i, '2517', '5', 'Aggregates / crushed stone'],
  [/gasket/i, '8484', '18', 'Gaskets'],
  [/bearing/i, '8482', '18', 'Ball / roller bearings'],
  [/grinding wheel|cutting wheel|cut-off wheel|cutting disc/i, '6804', '', 'Grinding / cutting wheels'],
  [/helmet/i, '6506', '', 'Safety helmets'],
  [/transport|freight|lorry|trailer/i, '9965', '', 'Goods transport service (SAC)'],
  [/crane hire|hire charge|rental|on hire/i, '9973', '18', 'Rental of machinery (SAC)'],
  [/manpower|labour supply/i, '9985', '18', 'Manpower supply (SAC)'],
  [/repair|servicing|maintenance|\bamc\b/i, '9987', '18', 'Repair / maintenance (SAC)'],
  [/civil work|construction|erection|installation work|fabrication work/i, '9954', '18', 'Works contract / construction (SAC)'],
  [/consult|design|survey|inspection|testing/i, '9983', '18', 'Technical / professional services (SAC)']
];
function hsnGuess(text) { var t = String(text || ''); for (var i = 0; i < HSN.length; i++) if (HSN[i][0].test(t)) return { hsn: HSN[i][1], gst: HSN[i][2], label: HSN[i][3] }; return null; }

/* =====================================================================
   BOOT (instant from cache) + LOGIN
   ===================================================================== */
$('bootLogo').src = LOGO_FULL; $('orbLogo').src = LOGO_MARK;
['pitchLogo', 'sideLogo'].forEach(function (i) { $(i).src = LOGO_FULL; });
$('welLogo').src = LOGO_MARK;
/* ---------------- motivation: login quotes + welcome ---------------- */
var LQ = ['Impossible can be possible - start today.', 'Every big project starts with one small step.', 'Quality is never an accident - it is the result of effort.', 'Plan the work, then work the plan.', 'Safety first, quality always, delivery on time.', 'Small daily improvements build great results.', 'Discipline today is success tomorrow.', 'Do it right the first time.', 'Teamwork turns hard jobs into finished jobs.', 'Focus on solutions, not problems.', 'Your effort today builds the company of tomorrow.', 'Great work is done by people who do not give up.', 'Be the reason the job gets done well.', 'Progress, not perfection - keep moving forward.', 'Hard work beats excuses every single time.', 'Strong foundations make strong projects.', 'One clear plan saves ten problems later.', 'Commit, deliver, repeat.', 'Your best work is still ahead of you.', 'Challenges are just projects waiting to be finished.'];
var WQ = ['Success is the sum of small efforts, repeated every day.', 'Finish what you start - that is how trust is built.', 'Today is a good day to close pending work.', 'Clear the approvals, clear the path for the team.', 'A well-planned day is a successful day.', 'Excellence is a habit, not a single act.', 'Do your best work, then make it better.', 'Every completed task moves the whole project forward.', 'Act on time - delays cost more than effort.', 'Consistency wins over speed.', 'Believe in the work, and the work will deliver.', 'Make today count - your team is counting on you.', 'Great companies are built by people who care about details.', 'Solve one problem at a time, and nothing is impossible.', 'Quality work today means happy clients tomorrow.', 'Stay positive, work hard, make it happen.', 'Your attitude decides your altitude.', 'Win the morning, win the day.', 'Success comes to those who keep showing up.', 'Impossible can be possible - let us prove it today.'];
function pickQ(list, key) { var i = Math.floor(Math.random() * list.length), last = Number(store.get(key)); if (list.length > 1 && i === last) i = (i + 1) % list.length; store.set(key, String(i)); return list[i]; }
var HQ = ["Small steps every day build big projects.","Finish what you start - then start something better.","A clear plan today saves a costly fix tomorrow.","Measure twice, cut once, deliver on time.","Good records today, no confusion tomorrow.","Safety is not a rule, it is a habit.","Follow up today; tomorrow it becomes a delay.","Quality is doing it right when no one is checking.","One closed task is worth ten open ideas.","Every rupee saved on site is a rupee earned.","Respond fast, decide clearly, deliver strongly.","Strong teams share problems early.","Clean site, clear mind, quick work.","A promise to a client is a deadline for us.","Check the drawing before you check the clock.","Today's discipline is tomorrow's reputation.","Fix the root cause, not just the symptom.","Great work speaks; great documentation proves it.","Be the reason the project moves forward today.","Pipelines connect places; teamwork connects people.","Plan the material, then plan the manpower.","Every approval on time keeps the site running.","Do the hard task first; the day gets lighter.","Progress, not perfection - but always progress.","Ask early, act fast, report honestly.","A good engineer solves; a great one prevents.","Small savings, repeated daily, become big profits.","Your signature on work is your name on quality.","Clear communication is half the job done.","Stay calm, stay safe, stay on schedule.","Hard work beats excuses every single time.","Count the stock before the stock counts you.","Think like an owner, work like a team.","Today's follow-up is tomorrow's payment.","Every site report tells the story of our effort.","Commitment is doing it even when it is difficult.","Focus on today's target; the month will follow.","When we deliver on time, trust grows on its own.","Better questions bring better quotations.","Organised files save hours of searching.","Respect time - yours, the team's and the client's.","Learn something new from every project.","A safe worker is a productive worker.","Good vendors are partners; treat them that way.","Turn every delay into a lesson.","Excellence is a habit, not an event.","Start strong, stay steady, finish proud.","Every task done right builds Port Energy's name.","Be precise with numbers, kind with people.","Impossible can be possible - one step at a time.","Today is a good day to close pending work.","Energy flows where focus goes.","Big results come from small, consistent efforts.","Plan, execute, verify - then celebrate.","The best time to update the report is now.","A tidy store means a faster site.","Teamwork makes heavy work light.","Keep the promise, keep the client.","Your effort today is tomorrow's success story.","Stay curious, stay careful, stay committed."];
var hqLast = -1, hqT = null;
function pickHQ() { var n; do { n = Math.floor(Math.random() * HQ.length); } while (n === hqLast && HQ.length > 1); hqLast = n; return HQ[n]; }
function startHQ() { clearInterval(hqT); var nx = function () { var t = $('hQt'); if (!t) { clearInterval(hqT); return; } t.classList.remove('qin'); void t.offsetWidth; t.textContent = pickHQ(); t.classList.add('qin'); }; hqT = setInterval(nx, 15000); }
/* Text boxes: start small (2 lines) and grow with what is typed */
function fitTA(t) { if (!t || t.id === 'aiIn' || t.id === 'peChIn') return; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight + 2, Math.round(window.innerHeight * 0.5)) + 'px'; }
document.addEventListener('input', function (e) { if (e.target && e.target.tagName === 'TEXTAREA') fitTA(e.target); }, true);
(function () { var go = function () { new MutationObserver(function () { document.querySelectorAll('textarea:not([data-fit])').forEach(function (t) { t.setAttribute('data-fit', '1'); if (t.id === 'aiIn') return; t.setAttribute('rows', '2'); requestAnimationFrame(function () { fitTA(t); }); }); }).observe(document.body, { childList: true, subtree: true }); }; if (document.body) go(); else document.addEventListener('DOMContentLoaded', go); })();
function dayQ() { var d = new Date(), n = d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate(); return WQ[n % WQ.length]; }
function greet() { var h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
function dayKey() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
var welT;
function welcome(name, pending) {
  var w = $('welcome'); if (!w) return;
  var nm = String(name || '').trim().split(' ').slice(-1)[0];
  $('welHi').textContent = greet() + (nm ? ', ' + nm : '') + '!';
  if (!w.classList.contains('show')) { $('welQ').textContent = pickQ(WQ, 'pe_wq'); $('welDay').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }); }
  w.classList.toggle('pend', !!pending); w.classList.add('show'); clearTimeout(welT);
  if (!pending) { store.set('pe_wday', dayKey()); welT = setTimeout(hideWelcome, 500); }
}
function hideWelcome() { clearTimeout(welT); var w = $('welcome'); if (w && !w.classList.contains('pend')) w.classList.remove('show'); }
function cancelWelcome() { clearTimeout(welT); var w = $('welcome'); if (w) { w.classList.remove('pend'); w.classList.remove('show'); } }
$('welcome').onclick = hideWelcome;

function hideBoot() { try { window.top.postMessage('pe-ready', '*'); } catch (e) { } var b = $('boot'); if (!b || b.style.display === 'none') return; b.style.opacity = 0; setTimeout(function () { b.style.display = 'none'; }, 450); }

function start() {
  var tok = store.get('pe_token'), cached = null;
  try { cached = JSON.parse(store.get('pe_boot') || 'null'); } catch (e) { }
  if (tok && cached && cached.session) {
    S.token = tok; S.bootAt = Date.now(); applyBoot(cached, true); if (store.get('pe_wday') !== dayKey()) welcome(cached.session.user.name); hideBoot();
    call('bootstrap', tok).then(function (b) { applyBoot(b, false); }).catch(function () { });
  } else if (tok) {
    S.bootAt = Date.now(); call('bootstrap', tok).then(function (b) { S.token = tok; applyBoot(b, true); hideBoot(); }).catch(function () { store.del('pe_token'); showLogin(); hideBoot(); });
  } else { showLogin(); hideBoot(); }
}

(function tilt() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var el = $('orb'), host = el.parentElement;
  host.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; el.style.transform = 'rotateY(' + (x * 22) + 'deg) rotateX(' + (-y * 22) + 'deg)'; });
  host.addEventListener('pointerleave', function () { el.style.transform = ''; });
})();

var L = { id: '', who: null, how: store.get('pe_loginhow') || '' };
function showLogin() { $('app').style.display = 'none'; $('login').style.display = 'grid'; $('loginQuote').textContent = pickQ(LQ, 'pe_lq'); L.who = null; renderLoginStep(); }
function idOk(v) { return /^[6-9]\d{9}$/.test(v) || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v); }
function lkCache(id, w) { var k = 'pe_lk_' + String(id).toLowerCase(); if (w) { try { store.set(k, JSON.stringify(w)); } catch (e) { } return w; } try { return JSON.parse(store.get(k) || 'null'); } catch (e) { return null; } }
function avHtml(w, cls) { return '<span class="' + (cls || 'lgx-av') + '">' + (w && w.photo ? '<img src="' + w.photo + '" alt="">' : '<b>' + esc(initials(w ? w.name : '')) + '</b>') + '</span>'; }
/* Step 1 - who are you? (mobile or email). As soon as a full number is typed the person's photo and name appear. */
function renderLoginStep() {
  var box = $('stepPhone'); $('login').classList.remove('lg-who');
  var saved = store.get('pe_lastid') || store.get('pe_lastid_m') || '';
  box.innerHTML = '<div class="lgx-step">' +
    '<label class="f" for="lid">Mobile number or email</label>' +
    '<div class="lgx-in"><span class="lgx-ic">' + icon('users', 17) + '</span><input id="lid" autocomplete="username" inputmode="email" placeholder="98765 43210 or name@portenergy.in" value="' + esc(saved) + '"></div>' +
    '<div class="lgx-peek" id="lgPeek"></div>' +
    '<button class="btn primary block" id="goBtn">Continue</button>' +
    '<p class="lgx-hint">We will show your profile, then you choose PIN or OTP.</p></div>';
  $('stepPhone').style.display = 'block'; $('stepOtp').style.display = 'none';
  var lid = $('lid'), seq = 0;
  var peek = debounce(function () {
    var v = lid.value.trim().replace(/\s/g, ''); if (/^\d+$/.test(v)) v = v.slice(-10);
    var pk = $('lgPeek'); if (!pk) return;
    if (!idOk(v)) { pk.innerHTML = ''; pk.className = 'lgx-peek'; return; }
    var c = lkCache(v); if (c) showPeek(c);
    var my = ++seq;
    call('loginLookup', v).then(function (w) { if (my !== seq) return; lkCache(v, w); showPeek(w); })
      .catch(function (e) { if (my !== seq) return; if (/not registered|inactive|valid/i.test(e.message || '')) { pk.className = 'lgx-peek bad show'; pk.innerHTML = '<span>' + icon('warn', 16) + '</span><div><b>Not registered</b><small>' + esc(e.message) + '</small></div>'; } else if (!c) { pk.innerHTML = ''; pk.className = 'lgx-peek'; } });
  }, 260);
  function showPeek(w) { var pk = $('lgPeek'); if (!pk) return; pk.className = 'lgx-peek show'; pk.innerHTML = avHtml(w, 'lgx-av sm') + '<div><b>' + esc(w.name) + '</b><small>' + esc([w.designation, w.dept].filter(String).join(' · ')) + '</small></div><i>' + icon('check', 16) + '</i>'; }
  lid.addEventListener('input', peek);
  lid.addEventListener('keydown', function (e) { if (e.key === 'Enter') next(); });
  $('goBtn').onclick = next;
  if (saved) peek();
  setTimeout(function () { if (window.innerWidth > 760 || !saved) lid.focus(); }, 200);
  function next() {
    var v = lid.value.trim().replace(/\s/g, ''); if (/^\+?91\d{10}$/.test(v)) v = v.slice(-10);
    if (!idOk(v)) { toast('Enter your registered 10-digit mobile number or email.', true); lid.focus(); return; }
    store.set('pe_lastid', v); if (/^\d+$/.test(v)) store.set('pe_lastid_m', v); L.id = v;
    var c = lkCache(v);
    if (c && c.name) { L.who = c; renderVerify(); call('loginLookup', v).then(function (w) { lkCache(v, w); }).catch(function () { }); return; }
    busy($('goBtn'), true, 'Checking');
    call('loginLookup', v).then(function (w) { lkCache(v, w); L.who = w; renderVerify(); })
      .catch(function (e) {
        busy($('goBtn'), false);
        if (/Unknown request/i.test(e.message || '')) { L.who = c || { name: store.get('pe_name_' + v) || '', hasPin: true, hasEmail: true }; renderVerify(); return; }
        fail(e); lid.focus();
      });
  }
}
/* Step 2 - photo + name, then choose PIN or OTP */
function renderVerify() {
  var w = L.who || {}, box = $('stepPhone'); $('login').classList.add('lg-who');
  var how = L.how && (L.how === 'pin' ? w.hasPin !== false : w.hasEmail !== false) ? L.how : (w.hasPin !== false ? 'pin' : 'otp');
  box.innerHTML = '<div class="lgx-step">' +
    '<div class="lgx-hero"><span class="lgx-aura"></span><span class="lgx-burst">' + '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>' + '</span>' +
    '<div class="lgx-ring">' + avHtml(w, 'lgx-big') + '<em class="lgx-ok">' + icon('check', 14) + '</em></div>' +
    '<small class="lgx-greet">' + greet() + '</small><b class="lgx-name">' + esc(w.name || L.id) + '</b><span class="lgx-role">' + esc([w.designation, w.dept].filter(String).join(' · ')) + '</span>' +
    '<button class="linkbtn lgx-chg" id="lgChg" type="button">Not you?</button></div>' +
    '<div class="lgx-seg" role="tablist"><button data-h="pin" role="tab"' + (how === 'pin' ? ' class="on"' : '') + '>' + icon('lock', 15) + 'Use my PIN</button><button data-h="otp" role="tab"' + (how === 'otp' ? ' class="on"' : '') + '>' + icon('mail', 15) + 'Send OTP</button></div>' +
    '<div id="lgHow"></div></div>';
  $('stepPhone').style.display = 'block'; $('stepOtp').style.display = 'none';
  $('lgChg').onclick = function () { L.who = null; renderLoginStep(); };
  box.querySelectorAll('[data-h]').forEach(function (b) { b.onclick = function () { L.how = b.dataset.h; store.set('pe_loginhow', L.how); box.querySelectorAll('[data-h]').forEach(function (x) { x.classList.toggle('on', x === b); }); drawHow(b.dataset.h); }; });
  drawHow(how);
  function drawHow(h) {
    var el = $('lgHow');
    if (h === 'pin') {
      el.innerHTML = (w.hasPin === false ? '<p class="lgx-warn">No PIN is set for this account yet. Use OTP once, then set a PIN from your profile menu.</p>' : '') +
        '<label class="f" for="lpin">PIN</label><input class="in lgx-pin" id="lpin" type="password" inputmode="numeric" maxlength="6" autocomplete="current-password" placeholder="• • • •">' +
        '<button class="btn primary block" id="goBtn">Sign in</button>' +
        '<div class="lgx-row"><button type="button" class="lg-forgot" id="lgForgot">' + icon('lock', 14) + 'Forgot PIN?</button></div><div id="lgFp"></div>';
      var pin = $('lpin');
      pin.addEventListener('input', function () { pin.value = pin.value.replace(/\D/g, '').slice(0, 6); });
      pin.addEventListener('keydown', function (e) { if (e.key === 'Enter') doPin(); });
      $('goBtn').onclick = doPin; $('lgForgot').onclick = forgot;
      setTimeout(function () { pin.focus(); }, 120);
    } else {
      el.innerHTML = (w.hasEmail === false ? '<p class="lgx-warn">No email is registered for this account. Please use your PIN, or ask the Super Admin to add your email.</p>' :
        '<p class="lgx-note">A 6-digit OTP will be sent to <b>' + esc(w.email || 'your registered email') + '</b>. It is valid for 5 minutes.</p>') +
        '<button class="btn primary block" id="goBtn"' + (w.hasEmail === false ? ' disabled' : '') + '>Send OTP</button>';
      $('goBtn').onclick = function () { sendOtp($('goBtn')); };
    }
  }
  function doPin() {
    var pin = $('lpin').value;
    if (!/^\d{4,6}$/.test(pin)) { toast('Enter your 4 to 6 digit PIN.', true); $('lpin').focus(); return; }
    busy($('goBtn'), true, 'Signing in'); welcome(w.name || store.get('pe_name_' + L.id) || '', true);
    call('loginPin', L.id, pin).then(loggedIn).catch(function (e) { cancelWelcome(); busy($('goBtn'), false); fail(e); var b = $('lpin'); b.value = ''; b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); b.focus(); });
  }
  function forgot() {
    var fp = $('lgFp');
    if (!/^[6-9]\d{9}$/.test(L.id)) { fp.innerHTML = '<div class="lg-fp bad"><b>Use your mobile number</b>PIN reset works with the registered mobile number. Tap "Not you?" and enter your mobile number.</div>'; return; }
    fp.innerHTML = '<div class="lg-fp"><b>Ask the Super Admin to reset your PIN?</b>They get an email and reset it from Users &amp; Access. Your PIN is never sent by email.<div class="lg-fpa"><button type="button" class="go">Send request</button><button type="button" class="no">Cancel</button></div></div>';
    fp.querySelector('.no').onclick = function () { fp.innerHTML = ''; };
    fp.querySelector('.go').onclick = function () {
      var b = this; b.disabled = true; b.textContent = 'Sending...';
      call('forgotPin', L.id).then(function (r) { fp.innerHTML = '<div class="lg-fp ok"><b>Request sent</b>' + esc((r && r.msg) || 'Your admin will reset your PIN soon.') + '</div>'; })
        .catch(function (e) { fp.innerHTML = '<div class="lg-fp bad"><b>Could not send</b>' + esc(e.message) + '</div>'; });
    };
  }
}
var otpTimer;
function sendOtp(btn) {
  busy(btn, true, 'Sending');
  call('requestOtp', L.id).then(function (r) {
    busy(btn, false);
    $('otpInfo').innerHTML = 'Sent to <b>' + esc(r.sentTo) + '</b>. Valid for 5 minutes.';
    $('stepPhone').style.display = 'none'; $('stepOtp').style.display = 'block';
    buildOtp(); countdown(60); toast('OTP sent to your email.');
  }).catch(function (e) { busy(btn, false); fail(e); });
}
$('resendBtn').onclick = function () { sendOtp($('resendBtn')); };
$('changeNo').onclick = function () { clearInterval(otpTimer); if (L.who) renderVerify(); else renderLoginStep(); };
$('verifyBtn').onclick = verify;
function countdown(s) {
  var b = $('resendBtn'); clearInterval(otpTimer); b.disabled = true; b.textContent = 'Resend in ' + s + 's';
  otpTimer = setInterval(function () { s--; if (s <= 0) { clearInterval(otpTimer); b.disabled = false; b.textContent = 'Resend OTP'; } else b.textContent = 'Resend in ' + s + 's'; }, 1000);
}
function buildOtp() {
  var box = $('otpBox'); box.innerHTML = '';
  for (var i = 0; i < 6; i++) { var inp = document.createElement('input'); inp.inputMode = 'numeric'; inp.maxLength = 1; inp.autocomplete = i === 0 ? 'one-time-code' : 'off'; inp.setAttribute('aria-label', 'OTP digit ' + (i + 1)); box.appendChild(inp); }
  var ins = box.querySelectorAll('input');
  ins.forEach(function (inp, i) {
    inp.addEventListener('input', function () {
      var v = inp.value.replace(/\D/g, '');
      if (v.length > 1) { v.split('').slice(0, 6 - i).forEach(function (c, k) { ins[i + k].value = c; }); ins[Math.min(i + v.length, 5)].focus(); }
      else { inp.value = v; if (v && i < 5) ins[i + 1].focus(); }
      if (otpVal().length === 6) verify();
    });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Backspace' && !inp.value && i > 0) { ins[i - 1].focus(); ins[i - 1].value = ''; } if (e.key === 'Enter') verify(); });
    inp.addEventListener('paste', function (e) { var t = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6); if (t) { e.preventDefault(); t.split('').forEach(function (c, k) { if (ins[k]) ins[k].value = c; }); ins[Math.min(t.length, 6) - 1].focus(); if (t.length === 6) verify(); } });
  });
  setTimeout(function () { ins[0].focus(); }, 60);
}
function otpVal() { return Array.prototype.map.call($('otpBox').querySelectorAll('input'), function (i) { return i.value; }).join(''); }
var verifying = false;
function verify() {
  if (verifying) return; var o = otpVal(); if (o.length !== 6) { toast('Enter the 6-digit OTP.', true); return; }
  verifying = true; busy($('verifyBtn'), true, 'Verifying');
  call('verifyOtp', L.id, o).then(function (r) { verifying = false; busy($('verifyBtn'), false); clearInterval(otpTimer); loggedIn(r); })
    .catch(function (e) {
      verifying = false; busy($('verifyBtn'), false); fail(e);
      var b = $('otpBox'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
      b.querySelectorAll('input').forEach(function (i) { i.value = ''; }); b.querySelector('input').focus();
    });
}
function loggedIn(r) { S.token = r.token; store.set('pe_token', r.token); try { store.set('pe_name_' + L.id, r.session.user.name); } catch (e) { } $('login').classList.remove('lg-who'); applyBoot(r, true); var w = $('welcome'); if (w) w.classList.remove('pend'); welcome(r.session && r.session.user ? r.session.user.name : ''); }
function signOut(silent) {
  if (!silent && S.token) call('logout', S.token).catch(function () { });
  store.del('pe_token'); store.del('pe_boot'); S.token = null; S.sess = null; S.cache = {};
  $('menu').classList.remove('open'); closeDrawer(); closeModal(); closePal();
  showLogin();
}

/* =====================================================================
   SHELL
   ===================================================================== */
var GROUPS = ['Workspace', 'Communication', 'Procurement', 'Accounts', 'Materials', 'Office Admin', 'Administration', 'System'];
function applyBoot(b, first) {
  try { store.set('pe_uid', String(b.session.user.name || '').replace(/\W+/g, '_')); } catch (x) { }
  S.sess = b.session; S.opts = b.options || {}; S.home = b.home;
  try { store.set('pe_boot', JSON.stringify({ session: b.session, options: b.options, home: b.home })); } catch (e) { }
  $('login').style.display = 'none'; $('app').style.display = 'block';
  var u = S.sess.user;
  $('uName').textContent = u.name; $('uRole').textContent = (u.designation || u.role) + (u.dept ? ' · ' + u.dept : ''); $('av').textContent = initials(u.name);
  buildNav();
  if (b.home) setInboxCount(b.home.inbox.length);
  if (first) { go({ v: 'home' }); prefetchAll(); }
  else if (S.route.v === 'home') renderHome(document.querySelector('#content .view'), b.home, true);
}
/* FAST MODE: one background call fills this device with every list the person can open,
   so tapping any module shows data at once (it still refreshes itself from the server) */
var pfT = null;
function prefetchAll() {
  clearTimeout(pfT);
  pfT = setTimeout(function () {
    if (!S.sess || !navigator.onLine) return;
    var keys = S.sess.entities.map(function (e) { return e.key; });
    call('prefetch', S.token, keys).then(function (d) {
      if (!d || !d.lists) return;
      Object.keys(d.lists).forEach(function (k) { var r = d.lists[k]; if (!r || !r.rows) return; if (window.PE_CACHE_PUT) PE_CACHE_PUT('listRecords', [S.token, k], r); if (!S.cache[k]) { S.cache[k] = r.rows; S.total[k] = r.total; } });
      if (d.inbox && window.PE_CACHE_PUT) PE_CACHE_PUT('getInbox', [S.token], d.inbox);
    }).catch(function () { });
  }, 1200);
}
window.addEventListener('pe-fresh', function (ev) {
  var d = ev.detail || {}, a = d.args || [];
  if (!S.sess) return;
  try {
    if (d.fn === 'listRecords') { var k = a[1]; S.cache[k] = d.res.rows; S.total[k] = d.res.total; if (S.route.v === 'list' && S.route.k === k && S.redrawList) S.redrawList(); }
    else if (d.fn === 'getHome') { S.home = d.res; if (S.route.v === 'home') renderHome(document.querySelector('#content .view'), d.res, true); }
    else if (d.fn === 'getInbox') { setInboxCount(d.res.length); if (S.route.v === 'inbox' && !$('drawer').classList.contains('open')) go({ v: 'inbox' }); }
    else if (d.fn === 'getRecord') { if (S.openRec && S.openRec.key === a[1] && S.openRec.id === a[2] && $('drawer').classList.contains('open') && !F) renderDetail(ent(a[1]), d.res); }
    else if (d.fn === 'getOptions') { S.opts = d.res; }
  } catch (x) { }
});
function refreshBoot() { S.bootAt = Date.now(); return call('bootstrap', S.token).then(function (b) { applyBoot(b, false); }).catch(function () { }); }
var refreshOpts = debounce(function () { call('getOptions', S.token).then(function (o) { S.opts = o; try { var c = JSON.parse(store.get('pe_boot') || '{}'); c.options = o; store.set('pe_boot', JSON.stringify(c)); } catch (e) { } }).catch(function () { }); }, 800);

function buildNav() {
  var h = '<div class="ng"><div class="items"><div>' +
    '<button class="ni" data-v="home">' + icon('home') + 'Home</button>' +
    '<button class="ni" data-v="inbox">' + icon('check') + 'Approvals<span class="ct" id="inboxCt" style="display:none"></span></button></div></div></div>';
  GROUPS.forEach(function (g) {
    var items = S.sess.entities.filter(function (e) { return e.group === g; });
    var extra = '';
    if (g === 'Accounts' && ent('bills') && ent('bills').all) extra = '<button class="ni" data-v="ledger">' + icon('ledger') + 'Vendor ledger<span class="tc">FBL1N</span></button><button class="ni" data-v="ageing">' + icon('clock') + 'Ageing report<span class="tc">S_ALR</span></button>';
    if (g === 'Administration') extra = '<button class="ni" data-v="org">' + icon('org') + 'Organisation chart</button>';
    if (g === 'System' && S.sess.user.admin) extra = '<button class="ni" data-v="health">' + icon('pulse') + 'ERP Health<span class="tc" id="hsBadge"></span></button><button class="ni" data-v="sys">' + icon('server') + 'System admin</button><button class="ni" data-v="dsheets">' + icon('ledger') + 'Department sheets</button><button class="ni" data-v="mailcfg">' + icon('clock') + 'Daily report mail</button>';
    if (!items.length && !extra) return;
    var ngSaved = store.get('pe_ng_' + g), closed = ngSaved ? ngSaved === '1' : (window.innerWidth <= 1024 && g !== 'Workspace');
    h += '<div class="ng' + (closed ? ' closed' : '') + '" data-g="' + esc(g) + '"><button class="ngh">' + esc(g.toUpperCase()) + icon('chev', 14) + '</button><div class="items"><div>' +
      items.map(function (e) { return '<button class="ni" data-k="' + e.key + '">' + icon(e.icon) + esc(e.title) + (TCODE[e.key] ? '<span class="tc">' + TCODE[e.key] + '</span>' : '') + '</button>'; }).join('') + extra + '</div></div></div>';
  });
  $('nav').innerHTML = h;
  $('nav').querySelectorAll('.ngh').forEach(function (b) { b.onclick = function () { var g = b.parentElement; g.classList.toggle('closed'); store.set('pe_ng_' + g.dataset.g, g.classList.contains('closed') ? '1' : '0'); }; });
  $('nav').querySelectorAll('.ni').forEach(function (b) { b.onclick = function () { closeSide(); if (b.dataset.k) go({ v: 'list', k: b.dataset.k }); else go({ v: b.dataset.v }); }; });
  if (!S.sess.user.admin) call('myDeptSheets', S.token).then(function (l) {
    S.mySheets = l || [];
    if (!S.mySheets.length || $('navMySheets')) return;
    var g = document.createElement('div'); g.className = 'ng';
    g.innerHTML = '<div class="ngh" style="cursor:default">REPORTS</div><div class="items"><div><button class="ni" data-v="mysheets" id="navMySheets">' + icon('ledger') + 'Department sheets</button></div></div>';
    $('nav').appendChild(g);
    $('navMySheets').onclick = function () { closeSide(); go({ v: 'mysheets' }); };
    markNav();
  }).catch(function () { });
  markNav();
  if (window.PE_NAV) try { PE_NAV(); } catch (x) { }
}
/* Super Admin: control the automatic daily report mail */
function mailCfgPage(v) {
  setTitle('Daily report mail', 'System - automatic report settings');
  if (!S.sess.user.admin) { v.innerHTML = '<div class="empty"><b>Super Admin only</b></div>'; return; }
  skeleton(v, 6);
  call('mailCfgGet', S.token).then(function (d) { if (S.route.v === 'mailcfg') drawMailCfg(v, d); }).catch(function (e) { v.innerHTML = '<div class="empty"><b>Could not load</b>' + esc(e.message) + '</div>'; });
}
function drawMailCfg(v, d) {
  var c = d.cfg, DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var hrs = ''; for (var i = 0; i < 24; i++) hrs += '<option value="' + i + '"' + (+c.hour === i ? ' selected' : '') + '>' + ((i % 12) || 12) + ':00 ' + (i < 12 ? 'AM' : 'PM') + '</option>';
  var chk = function (id, on, label) { return '<label style="display:flex;gap:8px;align-items:center;margin:6px 0;cursor:pointer"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '> ' + label + '</label>'; };
  var h = '<div class="grid2">' +
    '<div class="glass panel"><h3>Automatic sending</h3>' +
      chk('mcOn', c.on, '<b>Send the daily report automatically</b>') +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:8px 0"><span class="note">Send at</span><select class="in" id="mcHour" style="max-width:140px">' + hrs + '</select></div>' +
      '<div class="note" style="margin-top:6px">Send on these days</div><div class="chips" id="mcDays">' + DAYS.map(function (n, i) { return '<label class="chip" style="cursor:pointer"><input type="checkbox" value="' + i + '"' + ((c.days || []).map(Number).indexOf(i) > -1 ? ' checked' : '') + '> ' + n + '</label>'; }).join('') + '</div>' +
      '<p class="note" style="margin-top:10px">Status: <b>' + (d.auto ? 'Automatic sending is ON' : 'Automatic sending is OFF') + '</b></p></div>' +
    '<div class="glass panel"><h3>What to include</h3><div id="mcSec">' + Object.keys(d.sections).map(function (k) { return chk('sec_' + k, (c.sections || []).indexOf(k) > -1, esc(d.sections[k])).replace('id="sec_' + k + '"', 'id="sec_' + k + '" data-sec="' + k + '"'); }).join('') + '</div></div></div>' +
    '<div class="glass panel"><h3>Who gets it <span class="badge b-pink">' + d.to.length + ' now</span></h3>' +
      chk('mcAdmins', c.admins, 'All Super Admins') +
      (d.mailbox ? chk('mcBox', c.mailbox, 'Copy to Management mailbox (' + esc(d.mailbox) + ')') : '') +
      '<div class="note" style="margin:10px 0 6px">Select staff (name-wise)</div><div class="chips" id="mcUsers">' + d.users.map(function (u) { return '<label class="chip" style="cursor:pointer' + (u.e ? '' : ';opacity:.5') + '" title="' + esc(u.e || 'No email in user master') + '"><input type="checkbox" value="' + esc(u.n) + '"' + ((c.users || []).indexOf(u.n) > -1 ? ' checked' : '') + (u.e ? '' : ' disabled') + '> ' + esc(u.n) + '</label>'; }).join('') + '</div>' +
      '<div class="note" style="margin:12px 0 6px">Other email IDs (comma separated)</div><textarea class="in" id="mcExtra" rows="2" placeholder="md@portenergy.in, accounts@portenergy.in">' + esc(c.extra || '') + '</textarea>' +
      '<p class="note">Current recipients: ' + (d.to.length ? d.to.map(esc).join(', ') : '<b style="color:var(--bad)">none</b>') + '</p>' +
      '<div class="mfoot" style="justify-content:space-between;flex-wrap:wrap;gap:8px"><button class="btn soft" id="mcSend">' + icon('swap', 16) + ' Send report now</button><button class="btn primary" id="mcSave">Save settings</button></div></div>';
  v.innerHTML = h;
  var read = function () {
    return { on: $('mcOn').checked, hour: $('mcHour').value, admins: $('mcAdmins').checked, mailbox: $('mcBox') ? $('mcBox').checked : false, extra: $('mcExtra').value,
      days: Array.prototype.map.call(v.querySelectorAll('#mcDays input:checked'), function (x) { return +x.value; }),
      users: Array.prototype.map.call(v.querySelectorAll('#mcUsers input:checked'), function (x) { return x.value; }),
      sections: Array.prototype.map.call(v.querySelectorAll('#mcSec input:checked'), function (x) { return x.getAttribute('data-sec'); }) };
  };
  $('mcSave').onclick = function () { var b = this; busy(b, true, 'Saving'); call('mailCfgSave', S.token, read()).then(function (x) { drawMailCfg(v, x); toast('Daily report settings saved.'); }).catch(function (e) { busy(b, false); fail(e); }); };
  $('mcSend').onclick = function () { var b = this; busy(b, true, 'Sending'); call('mailCfgSave', S.token, read()).then(function () { return call('mailSendNow', S.token); }).then(function (msg) { busy(b, false); toast(msg); }).catch(function (e) { busy(b, false); fail(e); }); };
}
/* In-app read-only view of one department table */
function viewDeptTab(dept, tab) {
  var box = $('dsView'); if (!box) return;
  box.innerHTML = '<div class="glass panel"><h3>' + esc(tab) + ' <small class="note">' + esc(dept) + '</small></h3><div class="sk skl"></div><div class="sk skl"></div></div>';
  box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  call('myDeptView', S.token, dept, tab).then(function (x) {
    var q = '';
    var draw = function () {
      var rows = q ? x.rows.filter(function (r) { return r.join(' ').toLowerCase().indexOf(q) > -1; }) : x.rows;
      box.querySelector('.dvt').innerHTML = rows.length ? '<table class="tb"><thead><tr>' + x.head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>' : '<div class="empty"><b>No rows</b></div>';
    };
    box.innerHTML = '<div class="glass panel"><div class="lhead"><h3 style="margin:0">' + esc(tab) + ' <small class="note">' + esc(dept) + ' &middot; ' + x.total + ' row(s), newest first, view only</small></h3><input class="in" id="dvQ" placeholder="Search in this sheet" style="max-width:260px"></div><div class="tablewrap dvt" style="margin-top:10px"></div></div>';
    draw();
    $('dvQ').oninput = debounce(function () { q = $('dvQ').value.trim().toLowerCase(); draw(); }, 200);
  }).catch(function (e) { box.innerHTML = '<div class="empty"><b>Could not load</b>' + esc(e.message) + '</div>'; });
}
/* Department sheets for staff who were given access */
function mySheetsPage(v) {
  setTitle('Department sheets', 'view-only Google Sheets shared with you');
  skeleton(v, 4);
  call('myDeptSheets', S.token).then(function (l) {
    if (S.route.v !== 'mysheets') return;
    v.innerHTML = '<div class="dsgrid">' + (l.length ? l.map(function (d) {
      return '<div class="glass panel dsc"><h3>' + icon('ledger', 18) + esc(d.name) + '</h3><p class="note" style="margin:0 0 6px">Tap a sheet to view it here:</p><div class="chips">' + d.tabs.map(function (t) { return '<button class="chip" data-dv="' + esc(d.name) + '" data-tab="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') + '</div>' +
        (d.last ? '<div class="dsv">Last refreshed: ' + esc(d.last) + '</div>' : '') +
        '<div class="acts">' + (d.url ? '<a class="btn soft sm" href="' + esc(d.url) + '" target="_blank" rel="noopener">Open in Google Sheets</a>' : '') + '</div></div>';
    }).join('') : '<div class="empty"><b>No sheets shared with you</b>Ask Super Admin to give you access.</div>') + '</div><div id="dsView"></div>';
    v.querySelectorAll('[data-dv]').forEach(function (b) { b.onclick = function () { viewDeptTab(b.dataset.dv, b.dataset.tab); }; });
  }).catch(function (e) { v.innerHTML = '<div class="empty"><b>Could not load</b>' + esc(e.message) + '</div>'; });
}
function markNav() {
  document.querySelectorAll('#nav .ni,#bnav button').forEach(function (b) {
    var on = S.route.v === 'list' ? b.dataset.k === S.route.k : (b.dataset.v === S.route.v);
    b.classList.toggle('on', !!on);
    if (on) { var ng = b.closest('.ng.closed'); if (ng) ng.classList.remove('closed'); }
  });
}
function setInboxCount(n) { var c = $('inboxCt'); if (!c) return; c.style.display = n ? '' : 'none'; c.textContent = n; }
function go(r) {
  var run = function () {
    S.route = r; markNav(); closeDrawer();
    var c = $('content'); c.innerHTML = ''; var v = document.createElement('div'); v.className = 'view'; c.appendChild(v);
    window.scrollTo(0, 0);
    if (r.v === 'home') return home(v);
    if (r.v === 'inbox') return inbox(v);
    if (r.v === 'ledger') return ledger(v, r.vendor);
    if (r.v === 'ageing') return ageing(v);
    if (r.v === 'org') return orgChart(v);
    if (r.v === 'health') return healthPage(v);
    if (r.v === 'sys') return sysPage(v);
 if (r.v === 'dsheets') return deptPage(v);
    if (r.v === 'mysheets') return mySheetsPage(v);
    if (r.v === 'mailcfg') return mailCfgPage(v);
    if (window.PE_VIEWS && PE_VIEWS[r.v]) return PE_VIEWS[r.v](v, r);
    if (r.v === 'list' && !ent(r.k) && window.PE_LOCKED) return PE_LOCKED(v, r.k);
    if (r.v === 'list') return list(v, r.k, r.s);
  };
  if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) { var vt = document.startViewTransition(run); [vt.ready, vt.finished, vt.updateCallbackDone].forEach(function (p) { if (p && p.catch) p.catch(function () { }); }); } else run();
}
function setTitle(t, crumb) { $('ttl').textContent = t; $('crumb').textContent = crumb || ''; document.title = t + ' · Port Energy ERP'; }
$('refreshBtn').onclick = function () { var b = this; busy(b, true); refreshBoot().then(function () { busy(b, false); if (S.route.v !== 'home') go(S.route); }); };
$('burger').onclick = openSide;
$('scrim').onclick = closeSide;
function openSide() { $('side').classList.add('open'); $('scrim').classList.add('open'); }
function closeSide() { $('side').classList.remove('open'); $('scrim').classList.remove('open'); }
$('meBtn').onclick = function (e) { e.stopPropagation(); $('menu').classList.toggle('open'); };
document.addEventListener('click', function (e) { if (!$('menu').contains(e.target) && !$('meBtn').contains(e.target) && !e.target.closest('[data-v="menu"]')) $('menu').classList.remove('open'); });
$('mLogout').onclick = function () { signOut(false); };
$('mRefresh').onclick = function () { $('menu').classList.remove('open'); refreshBoot().then(function () { go(S.route); toast('Refreshed.'); }); };
$('mPin').onclick = function () { $('menu').classList.remove('open'); pinModal(); };
$('mKeys').onclick = function () { $('menu').classList.remove('open'); keysModal(); };
$('bnav').querySelectorAll('button').forEach(function (b) {
  b.onclick = function () { var v = b.dataset.v; if (v === 'find') return openPal(); if (v === 'menu') return openSide(); go({ v: v }); };
});
$('sideFind').onclick = function () { closeSide(); openPal(); };
$('topFind').onclick = openPal;

function pinModal() {
  modal('<h3>Set your login PIN</h3><p class="note">Use 4 to 6 digits. Avoid 1234, 0000 or your mobile number.</p>' +
    '<label class="f" style="margin-top:12px">New PIN</label><input class="in" id="p1" type="password" inputmode="numeric" maxlength="6" autocomplete="new-password">' +
    '<label class="f" style="margin-top:12px">Confirm PIN</label><input class="in" id="p2" type="password" inputmode="numeric" maxlength="6" autocomplete="new-password">' +
    '<div class="mfoot"><button class="btn soft" data-close>Cancel</button><button class="btn primary" id="pSave">Save PIN</button></div>');
  $('p1').focus();
  $('pSave').onclick = function () {
    var b = this; busy(b, true, 'Saving');
    call('setPin', S.token, $('p1').value, $('p2').value).then(function () { busy(b, false); closeModal(); S.sess.hasPin = true; toast('PIN saved. You can now sign in with PIN.'); if (S.route.v === 'home') go(S.route); })
      .catch(function (e) { busy(b, false); fail(e); });
  };
}
var SHORTCUTS = [['Ctrl + K  or  /', 'Search anything / run a T-code'], ['Alt + N', 'New record in the current list'], ['Ctrl + S', 'Save the open form'], ['Ctrl + Enter', 'Save & submit (PO / PR) or post (GRN)'], ['Alt + P', 'Print the open record'], ['Alt + H', 'Go to Home'], ['Alt + A', 'Go to Approvals'], ['Alt + R', 'Open Reports'], ['Alt + G', 'Open Help & user guide'], ['Alt + I', 'Open the AI assistant'], ['Esc', 'Close panel / dialog'], ['?', 'Show this list']];
function keysModal() {
  var k = SHORTCUTS;
  modal('<h3>Keyboard shortcuts</h3><table class="tb" style="margin-top:10px">' + k.map(function (x) { return '<tr><td style="width:46%"><kbd>' + esc(x[0]) + '</kbd></td><td>' + esc(x[1]) + '</td></tr>'; }).join('') + '</table>' +
    '<h3 style="margin-top:18px">T-codes</h3><table class="tb" style="margin-top:8px">' + CMDS().map(function (c) { return '<tr><td style="width:30%"><kbd>' + c.code + '</kbd></td><td>' + esc(c.label) + '</td></tr>'; }).join('') + '</table><div class="mfoot"><button class="btn primary" data-close>Close</button></div>');
}

/* ---------------- modal ---------------- */
function modal(html) { $('mbox').innerHTML = html; $('modal').classList.add('open'); $('mbox').querySelectorAll('[data-close]').forEach(function (b) { b.onclick = closeModal; }); }
function closeModal() { $('modal').classList.remove('open'); }
$('modal').addEventListener('click', function (e) { if (e.target === this) closeModal(); });

/* =====================================================================
   COMMAND PALETTE (Ctrl+K) + T-CODES + KEYBOARD
   ===================================================================== */
function CMDS() {
  var c = [];
  function add(code, label, fn, need) { if (!need || need()) c.push({ code: code, label: label, fn: fn }); }
  var can = function (k) { return function () { var e = ent(k); return e && e.canCreate; }; }, see = function (k) { return function () { return !!ent(k); }; };
  add('ME21N', 'Create purchase order', function () { openForm('po'); }, can('po'));
  add('ME23N', 'Purchase orders', function () { go({ v: 'list', k: 'po' }); }, see('po'));
  add('ME51N', 'Create purchase request', function () { openForm('pr'); }, can('pr'));
  add('ME53N', 'Purchase requests', function () { go({ v: 'list', k: 'pr' }); }, see('pr'));
  add('ME47', 'Create quotation comparison', function () { openForm('quotes'); }, can('quotes'));
  add('ME49', 'Quotation comparisons', function () { go({ v: 'list', k: 'quotes' }); }, see('quotes'));
  add('MIGO', 'Goods receipt against PO', function () { openForm('grn'); }, can('grn'));
  add('MB51', 'Goods receipts list', function () { go({ v: 'list', k: 'grn' }); }, see('grn'));
  add('MIRO', 'Enter vendor bill', function () { openForm('bills'); }, can('bills'));
  add('MIR4', 'Vendor bills', function () { go({ v: 'list', k: 'bills' }); }, see('bills'));
  add('F-53', 'Payment request', function () { openForm('payments'); }, can('payments'));
  add('FBL1N', 'Vendor ledger', function () { go({ v: 'ledger' }); }, function () { return ent('bills') && ent('bills').all; });
  add('S_ALR', 'Payables / receivables ageing', function () { go({ v: 'ageing' }); }, function () { return ent('bills') && ent('bills').all; });
  add('FB70', 'Client invoice', function () { openForm('clientbills'); }, can('clientbills'));
  add('XK01', 'Create vendor', function () { openForm('vendors'); }, can('vendors'));
  add('XK03', 'Vendors', function () { go({ v: 'list', k: 'vendors' }); }, see('vendors'));
  add('MM01', 'Create item', function () { openForm('items'); }, can('items'));
  add('MM03', 'Item master', function () { go({ v: 'list', k: 'items' }); }, see('items'));
  add('EXP', 'Expense claim', function () { openForm('expenses'); }, can('expenses'));
  add('IOA', 'New internal approval note', function () { openForm('approvals'); }, can('approvals'));
  add('TASK', 'Assign a task', function () { openForm('tasks'); }, can('tasks'));
  add('DSR', 'Daily site report', function () { openForm('dsr'); }, can('dsr'));
  add('MTR', 'Material transfer request', function () { openForm('transfers'); }, can('transfers'));
  add('LEAVE', 'Leave / permission request', function () { openForm('leaves'); }, can('leaves'));
  add('NOTICE', 'Publish a notice / circular', function () { openForm('notices'); }, can('notices'));
  add('MDR', 'Record a management decision', function () { openForm('decisions'); }, can('decisions'));
  add('HEALTH', 'ERP Health - data quality monitor', function () { go({ v: 'health' }); }, function () { return S.sess.user.admin; });
  add('SYS', 'System administration & diagnostics', function () { go({ v: 'sys' }); }, function () { return S.sess.user.admin; });
  add('ORG', 'Organisation chart', function () { go({ v: 'org' }); });
  add('INBOX', 'My approvals', function () { go({ v: 'inbox' }); });
  add('HOME', 'Home dashboard', function () { go({ v: 'home' }); });
  return c;
}
var P = { items: [], i: 0, req: 0 };
function openPal() { $('pal').classList.add('open'); $('palIn').value = ''; renderPal(''); setTimeout(function () { $('palIn').focus(); }, 30); }
function closePal() { $('pal').classList.remove('open'); }
$('pal').addEventListener('click', function (e) { if (e.target === this) closePal(); });
function renderPal(q, results) {
  q = q.trim();
  var ql = q.toLowerCase(), cmds = CMDS().filter(function (c) { return !ql || c.code.toLowerCase().indexOf(ql) === 0 || c.label.toLowerCase().indexOf(ql) > -1; });
  P.items = cmds.map(function (c) { return { kind: 'cmd', c: c }; });
  if (results) P.items = P.items.concat(results.map(function (r) { return { kind: 'rec', r: r }; }));
  P.i = 0;
  var h = '';
  if (cmds.length) h += '<div class="grp">ACTIONS</div>' + cmds.slice(0, q ? 6 : 10).map(function (c, i) { return '<div class="o" data-i="' + i + '"><span class="ic">' + icon('bolt', 16) + '</span><div class="t"><b>' + esc(c.label) + '</b><small>T-code ' + c.code + '</small></div><kbd>' + c.code + '</kbd></div>'; }).join('');
  if (results && results.length) h += '<div class="grp">RECORDS</div>' + results.map(function (r, j) { var e = ent(r.key); return '<div class="o" data-i="' + (cmds.length + j) + '"><span class="ic">' + icon(e ? e.icon : 'box', 16) + '</span><div class="t"><b>' + esc(r.id) + '</b> <span class="note">' + esc(r.title) + '</span><small>' + esc(r.text || '') + (r.date ? ' · ' + fdate(r.date) : '') + (r.amt ? ' · ' + inr(r.amt) : '') + '</small></div>' + badge(r.status) + '</div>'; }).join('');
  if (q.length >= 2 && !results) h += '<div class="grp">RECORDS</div><div class="o"><span class="spin" style="border-color:rgba(27,47,158,.2);border-top-color:var(--navy)"></span><div class="t"><small>Searching…</small></div></div>';
  if (results && !results.length && q.length >= 2) h += '<div class="grp">RECORDS</div><div class="nx" style="padding:10px 14px;color:var(--muted)">No records match "' + esc(q) + '"</div>';
  $('palRes').innerHTML = h;
  hlPal();
  $('palRes').querySelectorAll('.o[data-i]').forEach(function (o) { o.onclick = function () { P.i = +o.dataset.i; runPal(); }; o.onmousemove = function () { P.i = +o.dataset.i; hlPal(); }; });
}
function hlPal() { $('palRes').querySelectorAll('.o[data-i]').forEach(function (o) { o.classList.toggle('on', +o.dataset.i === P.i); if (+o.dataset.i === P.i) o.scrollIntoView({ block: 'nearest' }); }); }
function runPal() {
  var it = P.items[P.i]; if (!it) return;
  closePal();
  if (it.kind === 'cmd') it.c.fn(); else openDetail(it.r.key, it.r.id);
}
var palSearch = debounce(function (q) {
  if (q.trim().length < 2) return;
  var id = ++P.req;
  call('search', S.token, q).then(function (res) { if (id === P.req && $('palIn').value === q) renderPal(q, res); }).catch(function () { if (id === P.req) renderPal(q, []); });
}, 260);
$('palIn').addEventListener('input', function () { var q = this.value; var exact = CMDS().filter(function (c) { return c.code.toLowerCase() === q.trim().toLowerCase(); })[0]; renderPal(q); if (!exact) palSearch(q); });
$('palIn').addEventListener('keydown', function (e) {
  if (e.key === 'ArrowDown') { e.preventDefault(); P.i = Math.min(P.items.length - 1, P.i + 1); hlPal(); }
  if (e.key === 'ArrowUp') { e.preventDefault(); P.i = Math.max(0, P.i - 1); hlPal(); }
  if (e.key === 'Enter') { e.preventDefault(); runPal(); }
});
document.addEventListener('keydown', function (e) {
  if (!S.sess) return;
  var typing = /INPUT|TEXTAREA|SELECT/.test((e.target.tagName || '')) || e.target.isContentEditable;
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); openPal(); return; }
  if (e.key === 'Escape') { if (DD.el) closeDD(); else if (layerOpen()) closeTop(); return; }
  if (F && $('drawer').classList.contains('open') && (e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) { e.preventDefault(); if ($('fSave')) $('fSave').click(); return; }
  if (F && $('drawer').classList.contains('open') && (e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); ($('fSubmit') || $('fSave')).click(); return; }
  if (typing) return;
  if (e.key === '/') { e.preventDefault(); openPal(); }
  if (e.key === '?') keysModal();
  if (e.altKey && !e.ctrlKey && !e.metaKey) {
    var kc = e.code || '';
    if (kc === 'KeyH') { e.preventDefault(); go({ v: 'home' }); return; }
    if (kc === 'KeyA') { e.preventDefault(); go({ v: 'inbox' }); return; }
    if (kc === 'KeyR') { e.preventDefault(); go({ v: 'reports' }); return; }
    if (kc === 'KeyG') { e.preventDefault(); go({ v: 'help' }); return; }
    if (kc === 'KeyI') { e.preventDefault(); openAI(); return; }
    if (kc === 'KeyP' && $('drawer').classList.contains('open')) { var pb = $('pane').querySelector('[data-print]'); if (pb) { e.preventDefault(); pb.click(); } return; }
  }
  if (e.altKey && (e.code === 'KeyN' || e.key === 'n' || e.key === 'N')) { e.preventDefault(); if (S.route.v === 'list' && ent(S.route.k) && ent(S.route.k).canCreate) openForm(S.route.k); else if (ent('po') && ent('po').canCreate) openForm('po'); }
});

/* =====================================================================
   HOME (cockpit)
   ===================================================================== */
function home(v) {
  setTitle('Home', fdate(today()));
  if (S.home) { renderHome(v, S.home); if (Date.now() - (S.bootAt || 0) > 15000) refreshBoot(); return; }
  skeleton(v, 10);
  call('getHome', S.token).then(function (h) { S.home = h; renderHome(v, h); }).catch(function (e) { v.innerHTML = '<div class="empty"><b>Could not load</b>' + esc(e.message) + '</div>'; });
}
var QUICK = [['po', 'New PO', '#00249C', 'ME21N'], ['pr', 'Purchase request', '#F0006C', 'ME51N'], ['quotes', 'Compare quotations', '#B5309F', 'ME47'], ['grn', 'Goods receipt', '#00B49C', 'MIGO'],
  ['bills', 'Vendor bill', '#0084F0', 'MIRO'], ['payments', 'Payment request', '#F0006C', 'F-53'], ['expenses', 'Expense claim', '#0E9F6E', ''], ['clientbills', 'Client invoice', '#1667C4', 'FB70'],
  ['pettycash', 'Petty cash', '#5D6894', ''], ['photos', 'Upload photos', '#F0569C', ''], ['maintenance', 'Maintenance', '#C26A00', ''], ['vendors', 'New vendor', '#00B49C', 'XK01']];
function renderHome(v, h, silent) {
  if (!v || S.route.v !== 'home') return;
  S.home = h; setInboxCount(h.inbox.length);
  var u = S.sess.user, hr = new Date().getHours();
  var html = '<div class="hero2"><div class="h2l"><span class="h2d">' + fdate(h.today) + '</span><h2>' + greet() + ', ' + esc(u.name.split(' ').slice(-1)[0]) + '</h2><p>' + (u.reportsTo ? 'Reports to ' + esc(u.reportsTo) : '') + (u.team && u.team.length ? ' &middot; team of ' + u.team.length : '') + '</p></div>' +
    '<div class="h2q" id="hQ"><i>&ldquo;</i><span id="hQt">' + esc(pickHQ()) + '</span></div>' +
    '<button class="btn soft h2s" id="hFind">' + icon('search', 16) + ' Search <kbd>Ctrl K</kbd></button></div>';
  if (!S.sess.hasPin) html += '<div class="glass panel" style="margin-bottom:18px;display:flex;gap:14px;align-items:center;flex-wrap:wrap"><span style="color:var(--magenta)">' + icon('lock', 22) + '</span><div style="flex:1;min-width:200px"><b>Set a PIN for faster sign-in</b><div class="note">Sign in with mobile number + PIN next time. No OTP needed.</div></div><button class="btn primary sm" id="setPin">Set PIN</button></div>';
  html += '<div class="kpis" id="kpis"></div>';
  html += wsHtml(h.ws);
  html += '<div class="grid2"><div class="glass panel"><h3>Waiting for your action <span class="badge b-pink">' + h.inbox.length + '</span></h3><div class="list" id="hInbox"></div></div><div class="glass panel"><h3>My requests</h3><div class="list" id="hMine"></div></div></div>';
  html += '<div class="grid2"><div class="glass panel"><h3>Quick actions</h3><div class="qgrid" id="qgrid"></div></div><div class="glass panel"><h3>Smart suggestions</h3><div class="list" id="tips"></div></div></div>';
  var k = h.kpi;
  if (k.poChart || k.ageing) html += '<div class="grid2">' + (k.poChart ? '<div class="glass panel"><h3>Approved PO value, last 6 months</h3><div class="chart" id="poChart"></div></div>' : '') + (k.ageing ? '<div class="glass panel"><h3>Payables ageing <button class="btn ghost sm" id="toAge">Open</button></h3><div id="ageBars"></div></div>' : (k.topVendors ? '<div class="glass panel"><h3>Top vendors this year</h3><div id="topV"></div></div>' : '')) + '</div>';
  if (k.topVendors && k.ageing) html += '<div class="grid2"><div class="glass panel"><h3>Top vendors this year</h3><div id="topV"></div></div>' + (k.lowStock ? '<div class="glass panel"><h3>Low office stock</h3><div class="list" id="lowStock"></div></div>' : '<div></div>') + '</div>';
  v.innerHTML = html;
  startHQ();
  if ($('setPin')) $('setPin').onclick = pinModal;
  $('hFind').onclick = openPal;
  bindWs(v, h.ws);
  // quick
  var q = QUICK.filter(function (x) { var e = ent(x[0]); return e && e.canCreate; }).slice(0, 8);
  $('qgrid').innerHTML = q.map(function (x, i) { var e = ent(x[0]); return '<button class="qa" data-k="' + x[0] + '" style="animation-delay:' + i * 40 + 'ms"><i style="background:' + x[2] + '">' + icon(e.icon, 17) + '</i><span>' + x[1] + (x[3] ? '<small>' + x[3] + '</small>' : '') + '</span></button>'; }).join('') || '<div class="note">No quick actions for your role.</div>';
  $('qgrid').querySelectorAll('[data-k]').forEach(function (b) { b.onclick = function () { openForm(b.dataset.k); }; });
  // tips
  $('tips').innerHTML = (h.tips || []).length ? h.tips.map(function (t, i) { return '<div class="tip' + (t.warn ? ' warn' : '') + '" data-k="' + t.go.k + '" data-s="' + esc(t.go.s || '') + '" style="animation-delay:' + i * 50 + 'ms"><i>' + icon(t.warn ? 'warn' : 'bolt', 15) + '</i><span>' + esc(t.t) + '</span></div>'; }).join('') : '<div class="empty"><b>All on track</b>Nothing needs attention right now.</div>';
  $('tips').querySelectorAll('[data-k]').forEach(function (x) { x.onclick = function () { if (ent(x.dataset.k)) go({ v: 'list', k: x.dataset.k, s: x.dataset.s }); }; });
  kpis(k);
  $('hInbox').innerHTML = h.inbox.length ? h.inbox.slice(0, 6).map(inboxRow).join('') + (h.inbox.length > 6 ? '<button class="btn ghost sm" id="allInbox">See all ' + h.inbox.length + '</button>' : '') : '<div class="empty"><b>All clear</b>Nothing is waiting for you.</div>';
  bindInbox($('hInbox'), function () { refreshBoot(); });
  if ($('allInbox')) $('allInbox').onclick = function () { go({ v: 'inbox' }); };
  $('hMine').innerHTML = h.mine.length ? h.mine.map(function (m) { return '<div class="li click" data-k="' + m.key + '" data-id="' + esc(m.id) + '" style="flex-wrap:wrap"><div class="t"><b>' + esc(m.title) + '</b> <small class="note">' + esc(m.id) + '</small><p>' + esc(fdate(m.date)) + (m.text ? ' · ' + esc(m.text) : '') + (m.amount ? ' · ' + inr(m.amount) : '') + '</p></div>' + (m.waiting ? withPill(m.waiting, m.date) : '') + badge(m.status) + (m.path && m.path.length ? '<div style="flex-basis:100%">' + pathHtml(m.path, true) + '</div>' : '') + '</div>'; }).join('') : '<div class="empty"><b>No requests yet</b>Purchase requests and expense claims you raise appear here.</div>';
  $('hMine').querySelectorAll('[data-id]').forEach(function (r) { r.onclick = function () { openDetail(r.dataset.k, r.dataset.id); }; });
  if ($('poChart')) { var d = k.poChart, mx = Math.max.apply(null, d.map(function (x) { return x.v; }).concat([1])); $('poChart').innerHTML = d.map(function (x, i) { return '<div class="col"><div class="b" style="height:' + Math.max(2, x.v / mx * 100) + '%;animation-delay:' + i * 70 + 'ms"><em>' + (x.v ? inrShort(x.v).replace('₹ ', '') : '0') + '</em></div><small>' + x.label + '</small></div>'; }).join(''); }
  if ($('ageBars')) { var a = k.ageing, tot = a.b30 + a.b60 + a.b90 + a.b90p || 1; $('ageBars').innerHTML = [['0-30 days', a.b30], ['31-60 days', a.b60], ['61-90 days', a.b90], ['Over 90 days', a.b90p]].map(function (x, i) { return '<div class="hbar"><span>' + x[0] + '</span><div><i style="width:' + (x[1] / tot * 100) + '%;animation-delay:' + i * 80 + 'ms"></i></div><b>' + inrShort(x[1]) + '</b></div>'; }).join(''); $('toAge').onclick = function () { go({ v: 'ageing' }); }; }
  if ($('topV')) { var tv = k.topVendors || [], mx2 = tv.length ? tv[0].amt : 1; $('topV').innerHTML = tv.length ? tv.map(function (x, i) { return '<div class="hbar"><span>' + esc(x.v) + '</span><div><i style="width:' + (x.amt / mx2 * 100) + '%;animation-delay:' + i * 80 + 'ms"></i></div><b>' + inrShort(x.amt) + '</b></div>'; }).join('') : '<div class="empty"><b>No approved POs yet</b>This fills in as POs are approved.</div>'; }
  if ($('lowStock')) $('lowStock').innerHTML = k.lowStock.length ? k.lowStock.map(function (s) { return '<div class="li"><div class="t"><b>' + esc(s) + '</b></div><span class="badge b-warn">Reorder</span></div>'; }).join('') : '<div class="empty"><b>Stock is fine</b>No item is below its reorder level.</div>';
}

/* =====================================================================
   MY WORKSPACE (employee self-service on the home page)
   ===================================================================== */
var WS_TILES = [['approvals', 'Approval note', 'Inter-office approval', 'stamp', 'linear-gradient(135deg,#00249C,#0084F0)'],
  ['expenses', 'Expense claim', 'Bills & reimbursement', 'receipt', 'linear-gradient(135deg,#0E9F6E,#00B49C)'],
  ['transfers', 'Material transfer', 'Store to site', 'swap', 'linear-gradient(135deg,#B5309F,#F0006C)'],
  ['dsr', 'Daily site report', 'Work, manpower, photos', 'clipboard', 'linear-gradient(135deg,#C26A00,#F5A524)'],
  ['leaves', 'Leave / permission', 'Apply & track', 'calendar', 'linear-gradient(135deg,#1667C4,#5AB0FF)'],
  ['photos', 'Site photos', 'Upload from phone', 'camera', 'linear-gradient(135deg,#F0006C,#FF7AB8)'],
  ['tasks', 'Assign a task', 'To you or your team', 'target', 'linear-gradient(135deg,#121B54,#0060D0)'],
  ['pr', 'Purchase request', 'Need material?', 'cart', 'linear-gradient(135deg,#0B7A8F,#00B49C)']];
function wsHtml(w) {
  if (!w) return '';
  var h = '';
  (w.notices || []).filter(function (n) { return n.priority === 'Urgent' && n.need; }).slice(0, 2).forEach(function (n) {
    h += '<div class="urgent">' + icon('megaphone', 26) + '<div class="t"><b>URGENT · ' + esc(n.title) + '</b><p>' + esc(n.body.slice(0, 180)) + ' — ' + esc(n.by) + '</p></div><button class="btn sm" data-ack="' + esc(n.id) + '">I have read this</button><button class="btn ghost sm" style="color:#fff" data-nt="' + esc(n.id) + '">Open</button></div>';
  });
  if (w.dsrRequired && !w.dsrToday && ent('dsr')) h += '<div class="nudge">' + icon('clipboard', 22) + '<div class="grow"><b>Today\'s site report is pending.</b> A reminder email goes out at 6 PM if it is not submitted.</div><button class="btn primary sm" data-new="dsr">Submit now</button></div>';
  var tiles = WS_TILES.filter(function (t) { var e = ent(t[0]); return e && e.canCreate; });
  if (tiles.length) h += '<div class="glass panel" style="margin-bottom:18px"><h3>My workspace <span class="note" style="font-weight:600">raise a request — the approval channel is shown before you submit</span></h3><div class="wsgrid">' +
    tiles.map(function (t, i) { return '<button class="wst" data-new="' + t[0] + '" style="background:' + t[4] + ';animation-delay:' + i * 40 + 'ms"><span class="ic">' + icon(t[3], 18) + '</span><span><b>' + t[1] + '</b><br><small>' + t[2] + '</small></span></button>'; }).join('') + '</div></div>';
  var tasks = (w.tasks || []).map(function (t) { return '<div class="li click" data-k="tasks" data-id="' + esc(t.id) + '"><span style="color:' + (t.late ? 'var(--bad)' : 'var(--navy)') + '">' + icon('target', 18) + '</span><div class="t"><b>' + esc(t.title) + '</b><p>from ' + esc(t.by) + ' · <span class="' + (t.late ? 'late' : '') + '">' + (t.late ? 'overdue since ' : 'due ') + fdate(t.due) + '</span>' + (t.priority !== 'Normal' ? ' · ' + esc(t.priority) : '') + '</p></div>' + badge(t.status) + '</div>'; })
    .concat((w.decisions || []).map(function (d) { return '<div class="li click" data-k="decisions" data-id="' + esc(d.id) + '"><span style="color:var(--magenta)">' + icon('gavel', 18) + '</span><div class="t"><b>MD decision · ' + esc(d.id) + '</b><p>' + esc(d.text) + ' · <span class="' + (d.late ? 'late' : '') + '">' + (d.late ? 'OVERDUE ' : 'deadline ') + fdate(d.due) + '</span></p></div>' + badge(d.late ? 'Overdue' : d.status) + '</div>'; }));
  var nts = (w.notices || []).map(function (n) { return '<div class="ntc' + (n.priority === 'Urgent' ? ' u' : '') + '" data-nt="' + esc(n.id) + '"><div class="h"><b>' + esc(n.title) + '</b>' + (n.need ? '<button class="btn primary sm" data-ack="' + esc(n.id) + '">Acknowledge</button>' : (n.acked ? '<span class="badge b-ok">Read ✓</span>' : '')) + '</div><small class="note">' + esc(n.type) + ' · ' + fdate(n.date) + ' · ' + esc(n.by) + '</small><p>' + esc(n.body) + '</p></div>'; });
  if (tasks.length || nts.length || ent('notices')) h += '<div class="grid2"><div class="glass panel"><h3>My tasks & decisions <span class="badge b-pink">' + tasks.length + '</span>' + (w.teamTasksOpen ? ' <small class="note">· ' + w.teamTasksOpen + ' open task(s) you assigned</small>' : '') + '</h3><div class="list">' + (tasks.join('') || '<div class="empty"><b>Nothing assigned</b>Tasks and MD decisions given to you appear here.</div>') + '</div></div>' +
    '<div class="glass panel"><h3>Notice board ' + (ent('notices') ? '<button class="btn ghost sm" data-go="notices">All notices</button>' : '') + '</h3>' + (nts.join('') || '<div class="empty"><b>No active notices</b>Circulars and announcements for you appear here.</div>') + '</div></div>';
  return h;
}
function bindWs(v, w) {
  v.querySelectorAll('[data-new]').forEach(function (b) { b.onclick = function () { openForm(b.dataset.new); }; });
  v.querySelectorAll('[data-nt]').forEach(function (b) { b.onclick = function (e) { if (e.target.closest('[data-ack]')) return; openDetail('notices', b.dataset.nt); }; });
  v.querySelectorAll('[data-go]').forEach(function (b) { b.onclick = function () { go({ v: 'list', k: b.dataset.go }); }; });
  v.querySelectorAll('.wsgrid ~ x, .list .li[data-k="tasks"], .list .li[data-k="decisions"]').forEach(function (r) { r.onclick = function () { openDetail(r.dataset.k, r.dataset.id); }; });
  v.querySelectorAll('[data-ack]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); ackNow(b.dataset.ack, b); }; });
}
function ackNow(id, b) {
  busy(b, true, '');
  call('ackNotice', S.token, id).then(function () { toast('Acknowledged. Thank you.'); var u = b.closest('.urgent'); if (u) { u.style.transition = 'all .4s'; u.style.opacity = 0; setTimeout(function () { u.remove(); }, 400); } else b.outerHTML = '<span class="badge b-ok">Read ✓</span>'; refreshBoot(); }).catch(function (x) { busy(b, false); fail(x); });
}
function kpis(k) {
  var t = [];
  function add(l, n, f, s, c, link) { t.push('<div class="glass kpi' + (link ? ' link' : '') + '"' + (link ? ' data-k="' + link + '"' : '') + ' style="animation-delay:' + t.length * 45 + 'ms"><div class="l">' + l + '</div><div class="v" data-n="' + num(n) + '" data-f="' + f + '">0</div><small>' + (s || '') + '</small><span class="bar" style="background:' + c + '"></span></div>'); }
  var g = 'var(--grad)', tl = 'linear-gradient(90deg,var(--teal),var(--sky))', rd = 'linear-gradient(90deg,var(--bad),var(--magenta))', bl = 'linear-gradient(90deg,var(--sky),var(--navy))', or = 'linear-gradient(90deg,#F5A524,var(--magenta))';
  if (k.poPending != null) {
    add('POs awaiting approval', k.poPending, '', inrShort(k.poPendingVal), rd, 'po');
    add('Open PO value', k.poOpenVal, 'inr', k.poOpen + ' PO(s) to receive' + (k.poLate ? ' · ' + k.poLate + ' late' : ''), bl, 'po');
    add('PO value this FY', k.poFyVal, 'inr', 'approved POs', g, 'po');
    add('PRs waiting for PO', k.prApproved, '', k.qcOpen + ' comparison(s) open', tl, 'pr');
  }
  if (k.payables != null) {
    add('Payables', k.payables, 'inr', 'vendor bills outstanding', g, 'bills');
    add('Overdue', k.overdue, 'inr', inrShort(k.dueWeek) + ' due in 7 days', rd, 'bills');
    add('Received, not billed', k.unbilled, 'inr', k.unbilledN + ' PO(s)', or, 'po');
    add('Receivables', k.receivables, 'inr', 'client invoices', tl, 'clientbills');
    add('Petty cash', k.pettyCash, 'inr', 'balance', bl, 'pettycash');
    add('Payments awaiting MD', k.payPending, '', k.billsToVerify + ' bill(s) to verify', or, 'payments');
  }
  if (k.maintOpen != null) add('Open maintenance', k.maintOpen, '', 'requests', or, 'maintenance');
  $('kpis').innerHTML = t.join(''); $('kpis').style.display = t.length ? '' : 'none';
  $('kpis').querySelectorAll('.v[data-n]').forEach(countUp);
  $('kpis').querySelectorAll('[data-k]').forEach(function (x) { x.onclick = function () { if (ent(x.dataset.k)) go({ v: 'list', k: x.dataset.k }); }; });
}


/* =====================================================================
   APPROVAL CHANNEL STEPPER (names of every approver, live status)
   ===================================================================== */
/* "With R Karthick · 3d" - who holds the request now and for how long (age counted from the request date) */
function withPill(who, d) {
  var nm = String(who || ''), role = '', m = nm.match(/^(.*?)\s*\((.*)\)\s*$/); if (m) { nm = m[1]; role = m[2]; }
  var age = '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(d || '')) { var n = Math.floor((Date.now() - new Date(d + 'T00:00:00').getTime()) / 864e5); if (n >= 0) age = n === 0 ? 'raised today' : 'raised ' + n + 'd ago'; }
  return '<span class="pe-with" title="' + esc(who) + '"><i></i>With <b>' + esc(nm) + '</b>' + (role ? '<small>' + esc(role) + '</small>' : '') + (age ? '<em>' + age + '</em>' : '') + '</span>';
}
function pathHtml(path, compact) {
  if (!path || !path.length) return '';
  var seenCur = false;
  var steps = path.map(function (p) {
    var st = p.st || p.s, cls = st;
    if (st === 'pending') { cls = seenCur ? 'next' : 'cur'; seenCur = true; }
    var ic = cls === 'done' ? '✓' : cls === 'rejected' ? '✕' : cls === 'skip' ? '–' : '';
    var nm = p.name || p.n || '', rl = p.role || p.r || '';
    var lab = { done: 'Approved', rejected: 'Rejected', cur: 'Waiting', next: 'Next', skip: 'Skipped' }[cls] || '';
    return '<div class="ap s-' + cls + '" title="' + esc(rl + (nm ? ': ' + nm : '') + (p.rm ? ' · ' + p.rm : '')) + '"><i>' + ic + '</i><div><b>' + esc(nm || '—') + '</b><small>' + esc(rl) + '</small>' + (compact ? '' : '<em>' + lab + (p.at ? ' · ' + esc(p.at) : '') + (p.rm && cls !== 'done' ? ' · ' + esc(p.rm) : '') + '</em>') + '</div></div>';
  });
  return '<div class="apath' + (compact ? ' mini' : '') + '">' + steps.join('') + '</div>';
}
/* =====================================================================
   APPROVALS INBOX
   ===================================================================== */
function inboxRow(i) {
  return '<div class="li click" data-k="' + i.key + '" data-id="' + esc(i.id) + '"><span class="avatar" style="width:34px;height:34px;font-size:11px">' + initials(i.who) + '</span><div class="t"><b>' + esc(i.title) + '</b> <small class="note">' + esc(i.id) + '</small><p>' + esc(i.who) + (i.dept ? ' · ' + esc(i.dept) : '') + (i.step ? ' · <b class="pe-as">as ' + esc(i.step) + '</b>' : '') + (i.text ? ' · ' + esc(i.text) : '') + (i.amount ? ' · <b>' + inr(i.amount) + '</b>' : '') + '</p></div>' +
    badge(i.status) + (!i.needRemark && !i.hasInput ? ' <button class="btn primary sm" data-act="' + i.action + '">' + esc(i.actionLabel) + '</button>' : ' <button class="btn soft sm">Review</button>') + '</div>';
}
function bindInbox(el, after) {
  el.querySelectorAll('.li[data-id]').forEach(function (r) {
    r.onclick = function (e) {
      var b = e.target.closest('button[data-act]');
      if (b) { e.stopPropagation(); busy(b, true, ''); call('doAction', S.token, r.dataset.k, r.dataset.id, b.dataset.act, {}).then(function () { toast('Done.'); r.style.transition = 'all .4s'; r.style.opacity = 0; r.style.transform = 'translateX(30px)'; setTimeout(after, 380); }).catch(function (x) { busy(b, false); fail(x); }); return; }
      openDetail(r.dataset.k, r.dataset.id);
    };
  });
}
function inbox(v) {
  setTitle('Approvals', 'Items waiting for your action');
  skeleton(v, 6);
  call('getInbox', S.token).then(function (list) {
    setInboxCount(list.length);
    var types = {}; list.forEach(function (i) { types[i.title] = (types[i.title] || 0) + 1; });
    var f = S.inboxFilter || '';
    v.innerHTML = '<div class="chips status-chips"><button class="chip' + (!f ? ' on' : '') + '" data-f="">All<b>' + list.length + '</b></button>' + Object.keys(types).map(function (t) { return '<button class="chip' + (f === t ? ' on' : '') + '" data-f="' + esc(t) + '">' + esc(t) + '<b>' + types[t] + '</b></button>'; }).join('') + '</div><div class="glass panel"><div class="list" id="ibx"></div></div>';
    var rows = list.filter(function (i) { return !f || i.title === f; });
    $('ibx').innerHTML = rows.length ? rows.map(inboxRow).join('') : '<div class="empty"><b>All clear</b>Nothing is waiting for your approval.</div>';
    bindInbox($('ibx'), function () { go({ v: 'inbox' }); });
    v.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { S.inboxFilter = b.dataset.f; go({ v: 'inbox' }); }; });
  }).catch(function (e) { v.innerHTML = '<div class="empty"><b>Could not load</b>' + esc(e.message) + '</div>'; });
}

/* =====================================================================
   LIST VIEW (stale-while-revalidate, sortable)
   ===================================================================== */
function list(v, key, presetStatus) {
  var e = ent(key); if (!e) return go({ v: 'home' });
  setTitle(e.title, e.group + (TCODE[key] ? ' · ' + TCODE[key] : ''));
  var st = S.listState = S.listState && S.listState.key === key && presetStatus == null ? S.listState : { key: key, q: '', status: presetStatus || '', from: '', to: '' };
  var extra = '';
  if (key === 'vendors' && ent('bills') && ent('bills').all) extra += '<button class="btn soft" id="ledBtn">' + icon('ledger', 16) + 'Ledger</button>';
  if (key === 'decisions') extra += '<button class="btn soft" id="regBtn">' + icon('print', 16) + 'Print register</button>';
  v.innerHTML = '<div class="lhero"><span class="lh-ic">' + icon(e.icon || 'box', 24) + '</span><div class="lh-tx"><h2>' + esc(e.title) + '</h2><p><b id="lhN">' + ((S.cache[key] || []).length || '') + '</b> ' + esc(e.all ? 'records · everyone' : (e.self ? 'records · you and your team' : 'records · your department')) + '</p></div>' +
    '<div class="pe-vt" id="vt" role="tablist"><button data-vm="cards" title="Card view">' + icon('grid', 16) + '</button><button data-vm="table" title="Table view">' + icon('list', 16) + '</button></div></div>' +
    '<div class="lhead"><div class="tools"><div class="search">' + icon('search', 16) + '<input id="q" placeholder="Search ' + esc(e.title.toLowerCase()) + '…" value="' + esc(st.q) + '"></div>' +
    (e.dateField ? '<label class="pe-dt"><span>From</span><input type="date" class="in" id="from" value="' + st.from + '"></label><label class="pe-dt"><span>To</span><input type="date" class="in" id="to" value="' + st.to + '"></label>' : '') +
    extra + ((!window.PE_CANDL || window.PE_CANDL()) ? '<button class="btn soft" id="csvBtn">' + icon('down', 16) + 'Export</button>' : '') +
    (e.canCreate ? '<button class="btn primary" id="newBtn" title="Alt+N">' + icon('plus', 16) + 'New</button>' : '') + '</div></div>' +
    '<div class="chips status-chips" id="chips"></div><div class="glass" id="tbl"></div>';
  if (S.cache[key]) draw(); else skeleton($('tbl'), 8);
  var load = function () { return call('listRecords', S.token, key).then(function (r) { S.cache[key] = r.rows; S.total[key] = r.total; if (S.route.v === 'list' && S.route.k === key) draw(); }).catch(function (x) { if (!S.cache[key]) $('tbl').innerHTML = '<div class="empty"><b>Could not load</b>' + esc(x.message) + '</div>'; }); };
  function filtered() {
    var q = st.q.toLowerCase(), so = S.sort[key];
    var rows = (S.cache[key] || []).filter(function (r) {
      if (st.status && r.status !== st.status) return false;
      if (e.dateField && st.from && String(r[e.dateField]) < st.from) return false;
      if (e.dateField && st.to && String(r[e.dateField]) > st.to) return false;
      if (q) { var hay = e.list.map(function (k) { return r[k]; }).concat([r.id]).concat((r.lines || []).map(function (l) { return l.item || ''; })).join(' ').toLowerCase(); if (hay.indexOf(q) === -1) return false; }
      return true;
    });
    if (so) { var f = colDef(e, so.k), n = f.t === 'money' || f.t === 'number' || f.t === 'auto'; rows = rows.slice().sort(function (a, b) { var x = a[so.k], y = b[so.k]; if (n) { x = num(x); y = num(y); } else { x = String(x || '').toLowerCase(); y = String(y || '').toLowerCase(); } return (x < y ? -1 : x > y ? 1 : 0) * so.d; }); }
    return rows;
  }
  function draw() {
    var all = S.cache[key] || [];
    if (e.flow) {
      var cnt = {}; all.forEach(function (r) { cnt[r.status] = (cnt[r.status] || 0) + 1; });
      $('chips').innerHTML = '<button class="chip' + (!st.status ? ' on' : '') + '" data-s="">All<b>' + all.length + '</b></button>' + e.flow.statuses.filter(function (s) { return cnt[s]; }).map(function (s) { return '<button class="chip' + (st.status === s ? ' on' : '') + '" data-s="' + esc(s) + '">' + esc(s) + '<b>' + cnt[s] + '</b></button>'; }).join('');
      $('chips').querySelectorAll('[data-s]').forEach(function (b) { b.onclick = function () { st.status = b.dataset.s; draw(); }; });
    }
    var rows = filtered();
    if (!rows.length) { $('tbl').innerHTML = '<div class="empty"><b>' + (all.length ? 'No matching records' : 'No ' + esc(e.title.toLowerCase()) + ' yet') + '</b>' + (e.canCreate && !all.length ? 'Press New (Alt+N) to add the first one.' : 'Try a different search or filter.') + '</div>'; return; }
    if (key === 'photos') return gallery(rows);
    if ($('lhN')) $('lhN').textContent = all.length;
    if (viewMode(e) === 'cards') return cards(rows);
    var cols = e.list.map(function (k) { return colDef(e, k); }), so = S.sort[key];
    var sums = {}; cols.forEach(function (c) { if (isMoney(c)) sums[c.k] = 0; });
    var body = rows.slice(0, 400).map(function (r, i) {
      Object.keys(sums).forEach(function (k) { sums[k] += num(r[k]); });
      return '<tr class="click" data-id="' + esc(r.id) + '" style="animation-delay:' + Math.min(i, 20) * 18 + 'ms">' + cols.map(function (c) { var n = c.t === 'money' || c.t === 'number' || c.t === 'auto'; return '<td class="' + (n ? 'num' : '') + '">' + fval(c, r[c.k]) + (c.k === 'status' ? statusExtra(e, r) : '') + '</td>'; }).join('') + '</tr>';
    }).join('');
    var foot = Object.keys(sums).length ? '<tfoot><tr>' + cols.map(function (c, i) { return '<td class="num">' + (sums[c.k] != null ? inr(sums[c.k]) : (i === 0 ? rows.length + ' rows' : '')) + '</td>'; }).join('') + '</tr></tfoot>' : '';
    $('tbl').innerHTML = '<div class="tablewrap"><table class="tb"><thead><tr>' + cols.map(function (c) { var n = c.t === 'money' || c.t === 'number' || c.t === 'auto'; return '<th class="' + (n ? 'num' : '') + '" data-sort="' + c.k + '">' + esc(c.l) + (so && so.k === c.k ? (so.d > 0 ? ' ▲' : ' ▼') : '') + '</th>'; }).join('') + '</tr></thead><tbody>' + body + '</tbody>' + foot + '</table></div>' +
      (rows.length > 400 || (S.total[key] || 0) > all.length ? '<p class="note" style="padding:8px 16px">Showing ' + Math.min(400, rows.length) + ' of ' + (S.total[key] || rows.length) + '. Use the filter or dates to narrow.</p>' : '');
    $('tbl').querySelectorAll('tr[data-id]').forEach(function (tr) { tr.onclick = function () { openDetail(key, tr.dataset.id); }; });
    $('tbl').querySelectorAll('th[data-sort]').forEach(function (th) { th.onclick = function () { var c = S.sort[key]; S.sort[key] = { k: th.dataset.sort, d: c && c.k === th.dataset.sort ? -c.d : 1 }; draw(); }; });
  }
  function cards(rows) {
    var cols = e.list.map(function (k) { return colDef(e, k); });
    $('tbl').innerHTML = '<div class="rcg">' + rows.slice(0, 300).map(function (r, i) { return recCard(e, r, i, cols); }).join('') + '</div>' +
      (rows.length > 300 ? '<p class="note" style="padding:8px 16px">Showing 300 of ' + rows.length + '. Use search or dates to narrow.</p>' : '');
    $('tbl').querySelectorAll('.rc[data-id]').forEach(function (c) { c.onclick = function () { openDetail(key, c.dataset.id); }; });
  }
    function gallery(rows) {
    $('tbl').innerHTML = '<div style="padding:18px;display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px">' + rows.slice(0, 200).map(function (r, i) {
      var f = (r.files || [])[0];
      return '<div class="sec" style="padding:0;overflow:hidden;cursor:pointer;margin:0;animation-delay:' + Math.min(i, 16) * 30 + 'ms" data-id="' + esc(r.id) + '"><div style="aspect-ratio:4/3;background:#E9EEF8">' + (f ? '<img loading="lazy" src="' + thumb(f, 500) + '" style="width:100%;height:100%;object-fit:cover" alt="">' : '') + '</div>' +
        '<div style="padding:11px 13px"><b style="font-size:13.5px">' + esc(r.project) + '</b><div class="note">' + fdate(r.date) + ' · ' + esc(r.category) + ' · ' + (r.files || []).length + ' photo(s)</div><div style="font-size:13px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(r.caption) + '</div></div></div>';
    }).join('') + '</div>';
    $('tbl').querySelectorAll('[data-id]').forEach(function (c) { c.onclick = function () { openDetail(key, c.dataset.id); }; });
  }
  var vtSet = function () { var m = viewMode(e); v.querySelectorAll('#vt [data-vm]').forEach(function (b) { b.classList.toggle('on', b.dataset.vm === m); }); $('tbl').classList.toggle('rc-on', m === 'cards'); };
  v.querySelectorAll('#vt [data-vm]').forEach(function (b) { b.onclick = function () { store.set('pe_vm_' + key, b.dataset.vm); vtSet(); draw(); }; });
  vtSet();
  $('q').oninput = debounce(function () { st.q = $('q').value; draw(); }, 120);
  if ($('from')) { $('from').onchange = function () { st.from = this.value; draw(); }; $('to').onchange = function () { st.to = this.value; draw(); }; }
  if ($('newBtn')) $('newBtn').onclick = function () { openForm(key); };
  if ($('ledBtn')) $('ledBtn').onclick = function () { go({ v: 'ledger' }); };
  if ($('regBtn')) $('regBtn').onclick = function () { printRegister(filtered()); };
  if ($('csvBtn')) $('csvBtn').onclick = function () { exportCsv(e, filtered()); };
  S.reloadList = load; S.redrawList = function () { if ($('tbl')) draw(); };
  load();
}

/* ---------- premium record cards (list pages) ---------- */
var RC_COL = ['#0084F0', '#F0006C', '#00B49C', '#6F42C1', '#E8590C', '#0CA678', '#C2255C', '#1C7ED6', '#D9480F', '#2B8A3E'];
function nameCol(n) { var h = 7; String(n || '').split('').forEach(function (c) { h = (h * 37 + c.charCodeAt(0)) >>> 0; }); return RC_COL[h % RC_COL.length]; }
function viewMode(e) {
  var m = store.get('pe_vm_' + e.key); if (m === 'cards' || m === 'table') return m;
  if (e.key === 'photos') return 'table';
  if (window.innerWidth <= 900) return 'cards';
  var money = e.list.filter(function (k) { return isMoney(colDef(e, k)); }).length;
  return money && e.list.length > 5 ? 'table' : 'cards';
}
function recCard(e, r, i, cols) {
  var used = { id: 1, status: 1 }, title = null, people = [], dates = [], money = [], tags = [];
  cols.forEach(function (c) {
    if (used[c.k]) return; var v = r[c.k]; if (v === '' || v == null || (Array.isArray(v) && !v.length)) return;
    if (c.t === 'ref' && c.ref === 'users') people.push({ c: c, v: v });
    else if (c.t === 'date' || c.k === 'lastDate') dates.push({ c: c, v: v });
    else if (isMoney(c)) money.push({ c: c, v: v });
    else if (!title && c.t !== 'number' && c.t !== 'auto') title = { c: c, v: v };
    else tags.push({ c: c, v: v });
  });
  var st = r.status || '', cls = st ? statusCls(st) : '', over = statusExtra(e, r);
  var tt = title ? (Array.isArray(title.v) ? title.v.join(', ') : String(title.v)) : r.id;
  var ppl = people.slice(0, 3).map(function (p) {
    var names = Array.isArray(p.v) ? p.v : String(p.v).split(/\s*,\s*/);
    return '<span class="rc-p" title="' + esc(p.c.l) + '"><span class="rc-avs">' + names.slice(0, 4).map(function (n) { return '<i style="background:' + nameCol(n) + '">' + esc(initials(n)) + '</i>'; }).join('') + '</span><span><small>' + esc(p.c.l) + '</small><b>' + esc(names.join(', ')) + '</b></span></span>';
  }).join('');
  var dts = dates.slice(0, 2).map(function (d) { var late = e.dueField === d.c.k && /Overdue/.test(over); return '<span class="rc-d' + (late ? ' late' : '') + '">' + icon('calendar', 13) + '<small>' + esc(d.c.l) + '</small> ' + fdate(d.v) + '</span>'; }).join('');
  var tg = tags.slice(0, 3).map(function (t) { return '<span class="rc-tag"><small>' + esc(t.c.l) + '</small>' + fval(t.c, t.v) + '</span>'; }).join('');
  var amt = money.length ? '<span class="rc-amt"><small>' + esc(money[0].c.l) + '</small>' + inr(money[0].v) + '</span>' : '';
  return '<div class="rc click ' + cls + '" data-id="' + esc(r.id) + '" style="--i:' + Math.min(i, 18) + ';--rc:' + nameCol(e.key) + '">' +
    '<div class="rc-top"><span class="rc-ic">' + icon(e.icon || 'box', 18) + '</span><div class="rc-t"><b>' + esc(tt) + '</b><small>' + esc(r.id) + '</small></div><div class="rc-st">' + (st ? badge(st) : '') + over.replace(/<div[^>]*>.*<\/div>/, '') + '</div></div>' +
    (tg ? '<div class="rc-tags">' + tg + '</div>' : '') +
    ((ppl || dts || amt) ? '<div class="rc-bot">' + (ppl ? '<div class="rc-ppl">' + ppl + '</div>' : '') + '<div class="rc-meta">' + dts + amt + '</div></div>' : '') +
    '</div>';
}
function exportCsv(e, rows) {
  if (!rows.length) return toast('Nothing to export.', true);
  var fs = [SYS.id].concat(e.fields.filter(function (f) { return f.t !== 'hidden'; }));
  if (e.flow) fs.push(SYS.status);
  fs.push(SYS.createdBy, SYS.createdAt);
  var head = fs.map(function (f) { return f.l; }); if (e.lines) head.push(e.lines.l);
  var out = [[S.sess.config.watermark ? 'Exported from Port Energy ERP - ' + S.sess.config.watermark : 'Exported from Port Energy ERP'], head].concat(rows.map(function (r) {
    var row = fs.map(function (f) { var v = r[f.k]; return Array.isArray(v) ? v.join(' ') : (v == null ? '' : v); });
    if (e.lines) row.push((r.lines || []).map(function (l, i) { return (i + 1) + '. ' + e.lines.cols.filter(function (c) { return c.t !== 'hidden'; }).map(function (c) { return l[c.k]; }).filter(function (x) { return x !== '' && x != null; }).join(' | '); }).join('\n'));
    return row;
  }));
  var csv = out.map(function (r) { return r.map(function (v) { v = String(v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
  download(e.title.replace(/[^\w]+/g, '_') + '_' + today() + '.csv', 'text/csv;charset=utf-8', '﻿' + csv);
}
function download(name, type, data) {
  var url = URL.createObjectURL(new Blob([data], { type: type })), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
}

/* =====================================================================
   SMART COMBOBOX (searchable dropdown with rich info)
   ===================================================================== */
var DD = { el: null, input: null, items: [], i: 0, pick: null };
function optSource(ref) {
  var list = S.opts[ref] || [];
  return list.map(function (o) {
    var sub = '', right = '';
    if (ref === 'vendors') { sub = [o.code, o.gstin, o.terms].filter(Boolean).join(' · '); right = o.gstin ? (String(o.gstin).slice(0, 2) === S.sess.config.stateCode ? 'TN' : 'Other state') : ''; }
    else if (ref === 'items') { sub = [o.code, o.hsn ? 'HSN ' + o.hsn : '', o.uom, o.gst ? 'GST ' + o.gst + '%' : ''].filter(Boolean).join(' · '); right = o.last ? 'Last ' + inr(o.last) : (o.rate ? 'Std ' + inr(o.rate) : ''); }
    else if (ref === 'users') { sub = [o.des, o.dept].filter(Boolean).join(' · '); }
    else if (ref === 'openPos' || ref === 'billablePos') { sub = o.vendor + (o.project ? ' · ' + o.project : ''); }
    else if (ref === 'payableBills') { sub = o.vendor; right = 'Bal ' + inr(o.balance); }
    else if (ref === 'stock') { sub = 'Balance ' + o.balance + ' ' + (o.unit || ''); }
    return { v: o.v, label: ref === 'openPos' || ref === 'billablePos' || ref === 'payableBills' ? o.v : (o.label || o.v), sub: sub, right: right };
  });
}
function hl(text, q) { if (!q) return esc(text); var i = String(text).toLowerCase().indexOf(q.toLowerCase()); if (i < 0) return esc(text); return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length)); }
function comboHtml(f, val, locked, attr) {
  return '<div class="combo"><input class="in" autocomplete="off" ' + (attr || '') + (locked ? ' disabled' : '') + ' value="' + esc(val == null ? '' : val) + '" data-ref="' + f.ref + '"' + (f.free ? ' data-free="1"' : '') + ' placeholder="' + (f.free ? 'Type or pick' : 'Search') + '"></div>';
}
function bindCombo(input, onPick) {
  var last = input.value;
  var open = function () {
    var q = input.value.trim(), all = optSource(input.dataset.ref);
    var words = q.toLowerCase().split(/\s+/).filter(String);
    var items = (q === last && q && !input.dataset.typed) ? all : all.filter(function (o) { var h = (o.label + ' ' + o.sub).toLowerCase(); return words.every(function (w) { return h.indexOf(w) > -1; }); });
    showDD(input, items.slice(0, 60), q && input.dataset.typed ? q : '', function (o) { input.value = o.v; last = o.v; input.dataset.typed = ''; if (onPick) onPick(o.v, o); });
  };
  input.addEventListener('focus', function () { input.dataset.typed = ''; input.select && input.select(); open(); });
  input.addEventListener('input', function () { input.dataset.typed = '1'; open(); if (input.dataset.free && onPick) onPick(input.value, null, true); });
  input.addEventListener('keydown', function (e) {
    if (!DD.el || DD.input !== input) { if (e.key === 'ArrowDown') { open(); e.preventDefault(); } return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); DD.i = Math.min(DD.items.length - 1, DD.i + 1); hlDD(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); DD.i = Math.max(0, DD.i - 1); hlDD(); }
    else if (e.key === 'Enter') { if (DD.items[DD.i]) { e.preventDefault(); DD.pick(DD.items[DD.i]); closeDD(); } }
    else if (e.key === 'Tab') { if (DD.items[DD.i] && input.dataset.typed && !input.dataset.free) DD.pick(DD.items[DD.i]); closeDD(); }
  });
  input.addEventListener('blur', function () {
    setTimeout(function () {
      if (DD.input === input) closeDD();
      if (!input.dataset.free && input.value !== last) {
        var exact = optSource(input.dataset.ref).filter(function (o) { return o.v.toLowerCase() === input.value.trim().toLowerCase(); })[0];
        if (exact) { input.value = exact.v; last = exact.v; if (onPick) onPick(exact.v, exact); }
        else if (!input.value.trim()) { last = ''; if (onPick) onPick('', null); }
        else { input.value = last; }
      }
      input.dataset.typed = '';
    }, 160);
  });
}
function showDD(input, items, q, pick) {
  closeDD();
  var r = input.getBoundingClientRect(), dd = document.createElement('div');
  dd.className = 'dd'; dd.style.left = r.left + 'px'; dd.style.minWidth = Math.max(r.width, 300) + 'px';
  var below = window.innerHeight - r.bottom;
  if (below < 240 && r.top > below) { dd.style.bottom = (window.innerHeight - r.top + 4) + 'px'; } else dd.style.top = (r.bottom + 4) + 'px';
  dd.style.maxWidth = Math.min(520, window.innerWidth - r.left - 8) + 'px';
  dd.innerHTML = items.length ? items.map(function (o, i) { return '<div class="o" data-i="' + i + '"><div><b>' + hl(o.label, q) + '</b>' + (o.sub ? '<small>' + hl(o.sub, q) + '</small>' : '') + '</div>' + (o.right ? '<div class="r">' + esc(o.right) + '</div>' : '') + '</div>'; }).join('') : '<div class="nx">' + (input.dataset.free ? 'New entry - it will be added to the master when the PO is approved.' : 'No match. Add it in the master list first.') + '</div>';
  document.body.appendChild(dd);
  DD = { el: dd, input: input, items: items, i: 0, pick: pick };
  dd.addEventListener('mousedown', function (e) { e.preventDefault(); });
  dd.querySelectorAll('.o').forEach(function (o) { o.onclick = function () { pick(items[+o.dataset.i]); closeDD(); }; o.onmousemove = function () { DD.i = +o.dataset.i; hlDD(); }; });
  hlDD();
}
function hlDD() { if (!DD.el) return; DD.el.querySelectorAll('.o').forEach(function (o) { o.classList.toggle('on', +o.dataset.i === DD.i); if (+o.dataset.i === DD.i) o.scrollIntoView({ block: 'nearest' }); }); }
function closeDD() { if (DD.el) DD.el.remove(); DD = { el: null, input: null, items: [], i: 0, pick: null }; }
window.addEventListener('scroll', function () { if (DD.el) closeDD(); }, true);
window.addEventListener('resize', function () { if (DD.el) closeDD(); });

/* =====================================================================
   DETAIL DRAWER
   ===================================================================== */
function openDrawer(html, wide) { closeDD(); $('pane').innerHTML = html; $('drawer').classList.toggle('wide', !!wide); $('drawer').classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeDrawer() { closeDD(); $('drawer').classList.remove('open'); document.body.style.overflow = ''; F = null; }
$('drawerBg').onclick = closeDrawer;

function openDetail(key, id) {
  var e = ent(key); if (!e) return toast('No access to this module.', true);
  openDrawer('<div class="dh"><div><h2>' + esc(e.single) + '</h2><div class="sub">' + esc(id) + '</div></div><button class="x" data-x>×</button></div><div class="dbody"><div class="db" id="dbody"></div></div>', key === 'quotes');
  $('pane').querySelector('[data-x]').onclick = closeDrawer;
  S.openRec = { key: key, id: id };
  var row = (S.cache[key] || []).filter(function (x) { return x.id === id; })[0];
  if (row) { renderDetail(e, { rec: row, actions: [], canEdit: false, canDelete: false, extra: {} }); $('pane').classList.add('pe-pv'); } else skeleton($('dbody'), 9);
  call('getRecord', S.token, key, id).then(function (res) { if (!S.openRec || S.openRec.id !== id) return; $('pane').classList.remove('pe-pv'); renderDetail(e, res); }).catch(function (x) { $('dbody').innerHTML = '<div class="empty"><b>Could not open</b>' + esc(x.message) + '</div>'; });
}
function renderDetail(e, res) {
  var r = res.rec, x = res.extra || {};
  var head = '<div class="dh"><div><h2>' + esc(e.single) + ' ' + badge(r.status) + '</h2><div class="sub">' + esc(r.id) + ' · created by ' + esc(r.createdBy || '-') + ' on ' + esc(r.createdAt || '-') + (r.updatedAt ? ' · updated ' + esc(r.updatedAt) : '') + '</div></div><button class="x" data-x>×</button></div>';
  var acts = res.actions.map(function (a) { return '<button class="btn ' + (a.style === 'primary' ? 'primary' : a.style === 'danger' ? 'danger' : 'soft') + '" data-a="' + a.k + '">' + esc(a.l) + '</button>'; });
  var can = function (k) { return ent(k) && ent(k).canCreate; };
  if (res.canEdit) acts.push('<button class="btn soft" data-edit>Edit</button>');
  if (e.key === 'pr' && r.status === 'Approved') { if (can('po')) acts.push('<button class="btn primary" data-mk="po">Create PO</button>'); if (can('quotes')) acts.push('<button class="btn soft" data-mk="quotes">Compare quotations</button>'); }
  if (e.key === 'quotes' && r.status === 'Open' && can('po') && r.l1Vendor) acts.push('<button class="btn primary" data-mk="poL1">Create PO from L1 · ' + esc(r.l1Vendor) + '</button>');
  if (e.key === 'po' && can('po')) acts.push('<button class="btn soft" data-mk="copy">' + icon('copy', 15) + 'Copy as new PO</button>');
  if (e.key === 'po' && ['Approved', 'Sent to Vendor', 'Partially Received'].indexOf(r.status) > -1 && can('grn')) acts.push('<button class="btn soft" data-mk="grn">Receive goods (MIGO)</button>');
  if (e.key === 'po' && ['Partially Received', 'Received', 'Closed'].indexOf(r.status) > -1 && can('bills')) acts.push('<button class="btn soft" data-mk="bills">Enter bill (MIRO)</button>');
  if (e.key === 'bills' && ['Verified', 'Partially Paid'].indexOf(r.status) > -1 && num(r.balance) > 0 && can('payments')) acts.push('<button class="btn soft" data-mk="payments">Request payment</button>');
  if (e.key === 'vendors') { if (can('po')) acts.push('<button class="btn primary" data-mk="poV">New PO for vendor</button>'); if (ent('bills') && ent('bills').all) acts.push('<button class="btn soft" data-led>' + icon('ledger', 15) + 'Ledger</button>'); }
  if (e.key === 'users' && S.sess.user.admin) acts.push('<button class="btn soft" data-upin>' + icon('key', 15) + 'Set PIN</button><button class="btn soft" data-pinreset>Reset PIN</button>');
  acts.push('<button class="btn soft" data-print>' + icon('print', 16) + (e.key === 'po' ? 'Print PO' : e.key === 'quotes' ? 'Print comparison' : e.key === 'approvals' ? 'Print approval note' : e.key === 'notices' ? 'Print circular' : 'Print') + '</button>');
  if (res.canDelete) acts.push('<button class="btn danger" data-del>Delete</button>');

  var body = '<div class="acts">' + acts.join('') + '</div>';
  if (x.overdue) body += '<div class="nudge" style="background:#FDE8EA;border-color:#F5B3BE;color:#8A1023">' + icon('warn', 20) + '<div class="grow"><b>Overdue</b> — the deadline was ' + fdate(x.overdue) + '.</div></div>';
  if (x.path && x.path.length) body += '<div class="sec"><h4>Approval channel</h4>' + pathHtml(x.path) + '</div>';
  if (x.ack) { var ak = x.ack; body += '<div class="sec"><h4>Acknowledgements ' + (ak.required ? '<span class="badge b-info">' + ak.count + ' of ' + ak.total + '</span>' : '<span class="badge b-mute">not required</span>') + '</h4>' + (ak.required ? '<div class="ackbar"><i style="width:' + (ak.total ? ak.count / ak.total * 100 : 0) + '%"></i></div>' : '') +
    (ak.canAck ? '<button class="btn primary" data-ackme>' + icon('check', 16) + 'I have read and understood</button>' : (ak.mine ? '<span class="badge b-ok">You acknowledged ✓</span>' : '')) +
    (ak.pending ? '<p class="note" style="margin-top:10px">Pending (' + ak.pending.length + '):</p><div>' + (ak.pending.map(function (n) { return '<span class="pchip">' + esc(n) + '</span>'; }).join('') || '<span class="note">Everyone has acknowledged.</span>') + '</div>' : '') +
    (ak.acks && ak.acks.length ? '<p class="note" style="margin-top:10px">Acknowledged:</p><div>' + ak.acks.map(function (a) { return '<span class="pchip" style="background:#E3F7EF">' + esc(a.name) + ' · ' + esc(a.at) + '</span>'; }).join('') + '</div>' : '') + '</div>'; }
  if (e.key === 'quotes') body += cmpTable(r);
  var plain = e.fields.filter(function (f) { return !f.sec && f.t !== 'files' && f.t !== 'hidden' && f.k !== 'acks' && r[f.k] !== '' && r[f.k] != null && !(e.key === 'quotes' && /^(tot\d|vendor\d)$/.test(f.k)); });
  var secF = e.fields.filter(function (f) { return f.sec && r[f.k] !== '' && r[f.k] != null; });
  body += '<div class="sec"><div class="kv">' + plain.map(function (f) { return '<div class="' + (f.t === 'textarea' ? 'wide' : '') + '"><span>' + esc(f.l) + '</span><b>' + fval(f, r[f.k]) + '</b></div>'; }).join('') + '</div></div>';
  if (e.lines && (r.lines || []).length && e.key !== 'quotes') {
    var cols = e.lines.cols.filter(function (c) { return c.t !== 'hidden'; });
    body += '<div class="sec"><h4>' + esc(e.lines.l) + '</h4><div style="overflow:auto"><table class="tb"><thead><tr><th>#</th>' + cols.map(function (c) { return '<th class="' + (c.t === 'text' || c.t === 'ref' || c.t === 'select' ? '' : 'num') + '">' + esc(c.l) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      r.lines.map(function (l, i) { return '<tr><td>' + (i + 1) + '</td>' + cols.map(function (c) { var n = !(c.t === 'text' || c.t === 'ref' || c.t === 'select'); return '<td class="' + (n ? 'num' : '') + '" style="max-width:none;white-space:normal">' + fval(c, l[c.k]) + (c.k === 'item' && l.desc && !cols.some(function (z) { return z.k === 'desc'; }) ? '<div class="note">' + esc(l.desc) + '</div>' : '') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' +
      (e.key === 'po' ? '<div class="totals" style="margin-top:12px"><div><span>Subtotal</span><b>' + inr(r.subtotal) + '</b></div><div><span>GST</span><b>' + inr(r.gstAmount) + '</b></div>' + (num(r.freight) ? '<div><span>Freight</span><b>' + inr(r.freight) + '</b></div>' : '') + (num(r.otherCharges) ? '<div><span>Other charges</span><b>' + inr(r.otherCharges) + '</b></div>' : '') + '<div><span>Grand total</span><span>' + inr(r.total) + '</span></div></div>' : '') + '</div>';
  }
  if (secF.length) body += '<div class="sec"><h4>' + esc(secF[0].sec) + '</h4><div class="kv">' + secF.map(function (f) { return '<div class="wide"><span>' + esc(f.l) + '</span><b style="font-weight:500">' + fval(f, r[f.k]) + '</b></div>'; }).join('') + '</div></div>';
  e.fields.filter(function (f) { return f.t === 'files' && (r[f.k] || []).length; }).forEach(function (f) {
    body += '<div class="sec"><h4>' + esc(f.l) + '</h4><div class="files">' + r[f.k].map(function (u) { return '<a class="fth" href="' + esc(u) + '" target="_blank" rel="noopener"><span>PDF</span><img loading="lazy" src="' + thumb(u, 240) + '" alt="" onerror="this.remove()"></a>'; }).join('') + '</div></div>';
  });
  if (x.grns && x.grns.length) body += related('Goods receipts', x.grns, 'grn', function (g) { return fdate(g.date) + ' · DC ' + esc(g.challanNo); });
  if (x.bills && x.bills.length) body += related('Vendor bills', x.bills, 'bills', function (b) { return 'Inv ' + esc(b.billNo) + ' · ' + inr(b.net) + ' · balance ' + inr(b.balance); });
  if (x.payments && x.payments.length) body += related('Payments', x.payments, 'payments', function (p) { return fdate(p.date) + ' · ' + inr(p.amount) + (p.refNo ? ' · ' + esc(p.refNo) : ''); });
  if (e.key === 'vendors' || e.key === 'items') body += '<div id="x360"></div>';
  if (r.log) body += '<div class="sec"><h4>Approval history</h4><div class="timeline">' + String(r.log).split('\n').reverse().map(function (l) { var p = l.split(' | '); return '<div class="tl"><b>' + esc(p[1] || '') + '</b> by ' + esc(p[2] || '') + '<small>' + esc(p[0] || '') + (p[3] ? ' · ' + esc(p.slice(3).join(' | ')) : '') + '</small></div>'; }).join('') + '</div></div>';

  $('pane').innerHTML = head + '<div class="dbody"><div class="db">' + body + '</div></div>';
  var P2 = $('pane');
  P2.querySelector('[data-x]').onclick = closeDrawer;
  P2.querySelectorAll('[data-a]').forEach(function (b) { b.onclick = function () { runAction(e, r, res.actions.filter(function (z) { return z.k === b.dataset.a; })[0], b); }; });
  if (P2.querySelector('[data-edit]')) P2.querySelector('[data-edit]').onclick = function () { openForm(e.key, r); };
  P2.querySelectorAll('[data-mk]').forEach(function (b) { b.onclick = function () { makeFrom(b.dataset.mk, e.key, r); }; });
  P2.querySelectorAll('[data-rel]').forEach(function (b) { b.onclick = function () { openDetail(b.dataset.rel, b.dataset.id); }; });
  if (S.openRec && S.openRec.id === r.id) { S.openRec.r = r; S.openRec.x = x; }
  P2.querySelector('[data-print]').onclick = function () { printRecord(e, r, x); };
  if (P2.querySelector('[data-ackme]')) P2.querySelector('[data-ackme]').onclick = function () { var b = this; busy(b, true, ''); call('ackNotice', S.token, r.id).then(function () { toast('Acknowledged. Thank you.'); openDetail(e.key, r.id); refreshBoot(); }).catch(function (z) { busy(b, false); fail(z); }); };
  if (P2.querySelector('[data-led]')) P2.querySelector('[data-led]').onclick = function () { go({ v: 'ledger', vendor: r.name }); };
  if (P2.querySelector('[data-upin]')) P2.querySelector('[data-upin]').onclick = function () {
    modal('<h3>Set PIN for ' + esc(r.name) + '</h3><p class="note">Share it with the user privately. They can change it later from their profile menu.</p><label class="f" style="margin-top:12px">PIN (4 to 6 digits)</label><input class="in" id="uPin" type="password" inputmode="numeric" maxlength="6"><div class="mfoot"><button class="btn soft" data-close>Cancel</button><button class="btn primary" id="uPinGo">Set PIN</button></div>');
    $('uPin').focus();
    $('uPinGo').onclick = function () { var b = this; busy(b, true, ''); call('setUserPin', S.token, r.name, $('uPin').value).then(function () { closeModal(); toast('PIN set for ' + r.name + '.'); }).catch(function (z) { busy(b, false); fail(z); }); };
  };
  if (P2.querySelector('[data-pinreset]')) P2.querySelector('[data-pinreset]').onclick = function () { var b = this; busy(b, true, ''); call('resetPin', S.token, r.name).then(function () { busy(b, false); toast('PIN cleared for ' + r.name + '.'); }).catch(function (z) { busy(b, false); fail(z); }); };
  if (P2.querySelector('[data-del]')) P2.querySelector('[data-del]').onclick = function () {
    modal('<h3>Delete ' + esc(e.single.toLowerCase()) + '?</h3><p>' + esc(r.id) + ' will be removed permanently. The audit log keeps a copy.</p><div class="mfoot"><button class="btn soft" data-close>Keep it</button><button class="btn danger" id="delGo">Delete</button></div>');
    $('delGo').onclick = function () { var b = this; busy(b, true, 'Deleting'); call('deleteRecord', S.token, e.key, r.id).then(function () { closeModal(); closeDrawer(); toast('Deleted.'); if (S.reloadList) S.reloadList(); }).catch(function (z) { busy(b, false); fail(z); }); };
  };
  if (e.key === 'vendors' && $('x360')) call('vendorInsight', S.token, r.name).then(function (vi) { if (!vi || !$('x360')) return; $('x360').innerHTML = '<div class="sec"><h4>Vendor 360</h4><div class="kv"><div><span>PO value (all time)</span><b>' + inr(vi.poValue) + '</b></div><div><span>Open POs</span><b>' + vi.openPos + '</b></div><div><span>Outstanding</span><b>' + inr(vi.outstanding) + '</b></div><div><span>Tax type</span><b>' + (vi.vendor.intra ? 'CGST + SGST (Tamil Nadu)' : 'IGST (other state)') + '</b></div></div></div>' + (vi.pos.length ? related('Recent POs', vi.pos, 'po', function (p) { return fdate(p.date) + ' · ' + esc(p.subject || '') + ' · ' + inr(p.total); }) : ''); bindRel(); }).catch(function () { });
  if (e.key === 'items' && $('x360')) call('itemInsight', S.token, r.name).then(function (ii) { if (!ii || !$('x360') || !ii.history.length) return; $('x360').innerHTML = '<div class="sec"><h4>Purchase history</h4><div class="kv" style="margin-bottom:12px"><div><span>Last rate</span><b>' + inr(ii.last.rate) + '</b></div><div><span>Lowest</span><b>' + inr(ii.min) + '</b></div><div><span>Average</span><b>' + inr(ii.avg) + '</b></div></div><table class="tb"><thead><tr><th>Date</th><th>PO</th><th>Vendor</th><th class="num">Qty</th><th class="num">Rate</th></tr></thead><tbody>' + ii.history.map(function (hh) { return '<tr class="click" data-rel="po" data-id="' + esc(hh.po) + '"><td>' + fdate(hh.date) + '</td><td>' + esc(hh.po) + '</td><td>' + esc(hh.vendor) + '</td><td class="num">' + esc(hh.qty) + ' ' + esc(hh.uom || '') + '</td><td class="num">' + inr(hh.rate) + '</td></tr>'; }).join('') + '</tbody></table></div>'; bindRel(); }).catch(function () { });
  function bindRel() { $('pane').querySelectorAll('[data-rel]').forEach(function (b) { b.onclick = function () { openDetail(b.dataset.rel, b.dataset.id); }; }); }
}
function cmpTable(r) {
  var vs = [1, 2, 3, 4].filter(function (n) { return r['vendor' + n]; });
  var win = function (n) { return r['vendor' + n] === r.l1Vendor; };
  return '<div class="sec"><h4>Quotation comparison ' + (r.l1Vendor ? '<span class="badge b-ok">L1: ' + esc(r.l1Vendor) + ' · ' + inr(r.l1Total) + '</span>' : '') + (num(r.saving) ? '<span class="badge b-info">Saves ' + inr(r.saving) + ' vs L2</span>' : '') + '</h4><div style="overflow:auto"><table class="tb cmp"><thead><tr><th>#</th><th>Item</th><th class="num">Qty</th><th>UOM</th><th class="num">GST</th>' +
    vs.map(function (n) { return '<th class="num' + (win(n) ? ' l1' : '') + '">' + esc(r['vendor' + n]) + '</th>'; }).join('') + '</tr></thead><tbody>' +
    (r.lines || []).map(function (l, i) { return '<tr><td>' + (i + 1) + '</td><td style="max-width:none;white-space:normal">' + esc(l.item) + '</td><td class="num">' + esc(l.qty) + '</td><td>' + esc(l.uom) + '</td><td class="num">' + esc(l.gst) + '%</td>' + vs.map(function (n) { return '<td class="v' + (l.best === 'V' + n ? ' win' : '') + '">' + (l['r' + n] !== '' && l['r' + n] != null ? inr(l['r' + n], true) : '<span class="note">no quote</span>') + '</td>'; }).join('') + '</tr>'; }).join('') +
    '</tbody><tfoot><tr><td colspan="5">Total incl. GST</td>' + vs.map(function (n) { return '<td class="num' + (win(n) ? ' win' : '') + '">' + inr(r['tot' + n]) + '</td>'; }).join('') + '</tr></tfoot></table></div><p class="note" style="margin-top:8px">Green = lowest rate per item. L1 counts only vendors who quoted every item.</p></div>';
}
function related(title, rows, key, txt) { return '<div class="sec"><h4>' + title + '</h4><div class="list">' + rows.map(function (x) { return '<div class="li click" data-rel="' + key + '" data-id="' + esc(x.id) + '"><div class="t"><b>' + esc(x.id) + '</b><p>' + txt(x) + '</p></div>' + badge(x.status) + '</div>'; }).join('') + '</div></div>'; }
function runAction(e, r, a, btn) {
  var needs = a.remark || a.input || a.confirm || a.proof;
  var proof = [];
  var exec = function (input, b) {
    busy(b, true, '');
    return call('doAction', S.token, e.key, r.id, a.k, input).then(function () {
      closeModal(); toast(a.l + ' — done.'); openDetail(e.key, r.id); if (S.reloadList) S.reloadList(); refreshOpts();
      call('getInbox', S.token).then(function (l) { setInboxCount(l.length); }).catch(function () { });
    }).catch(function (x) { busy(b, false); fail(x); });
  };
  if (!needs) return exec({}, btn);
  var inp = a.input;
  modal('<h3>' + esc(a.l) + '</h3><p class="note">' + esc(e.single) + ' ' + esc(r.id) + '</p>' + (a.confirm ? '<p>' + esc(a.confirm) + '</p>' : '') +
    (inp ? '<label class="f" style="margin-top:12px">' + esc(inp.l) + (inp.req ? ' <span class="req">*</span>' : '') + '</label><input class="in" id="aInp" ' + (inp.t === 'money' ? 'type="number" step="0.01" min="0"' : '') + (inp.k === 'amount' && r.balance ? ' value="' + r.balance + '"' : '') + '>' : '') +
    (a.remark ? '<label class="f" style="margin-top:12px">' + (a.proof ? 'Completion note' : 'Remark') + (a.remark === 'required' ? ' <span class="req">*</span>' : ' (optional)') + '</label><textarea class="in" id="aRem" rows="3"></textarea>' : '') +
    (a.proof ? '<label class="f" style="margin-top:12px">Completion proof — photo or PDF' + (a.proof === 'required' ? ' <span class="req">*</span>' : ' (optional)') + '</label><div class="files" id="aPf"></div><input type="file" id="aPfIn" hidden accept="image/*,application/pdf" multiple><label class="btn soft sm" for="aPfIn" style="margin-top:6px">' + icon('camera', 15) + 'Add proof</label>' : '') +
    '<div class="mfoot"><button class="btn soft" data-close>Cancel</button><button class="btn ' + (a.style === 'danger' ? 'danger' : 'primary') + '" id="aGo">' + esc(a.l) + '</button></div>');
  var first = $('aInp') || $('aRem'); if (first) first.focus();
  if ($('aPfIn')) { var drawPf = function () { $('aPf').innerHTML = proof.map(function (p, i) { return '<div class="fth"><span>PDF</span>' + (p.indexOf('application/pdf') > -1 ? '' : '<img src="' + p + '" alt="">') + '<button class="x" data-rp="' + i + '">×</button></div>'; }).join(''); $('aPf').querySelectorAll('[data-rp]').forEach(function (b) { b.onclick = function () { proof.splice(+b.dataset.rp, 1); drawPf(); }; }); };
    $('aPfIn').onchange = function () { Array.prototype.slice.call(this.files, 0, 5 - proof.length).forEach(function (file) { prepFile(file, { pdf: 1 }).then(function (d) { proof.push(d); drawPf(); }).catch(fail); }); this.value = ''; }; }
  $('aGo').onclick = function () {
    var input = { remark: $('aRem') ? $('aRem').value.trim() : '', value: $('aInp') ? $('aInp').value.trim() : '' };
    if (a.proof) { input.files = proof.map(function (d) { return { data: d }; }); if (a.proof === 'required' && !proof.length) return toast('Attach completion proof.', true); }
    if (a.remark === 'required' && !input.remark) return toast('Please enter a remark.', true);
    if (inp && inp.req && !input.value) return toast(inp.l + ' is required.', true);
    exec(input, this);
  };
}
function poLinesFrom(lines, rateKey) {
  return (lines || []).map(function (l) { var it = findOpt('items', l.item) || {}; return { item: l.item, desc: l.desc || '', hsn: l.hsn || it.hsn || '', qty: l.qty, uom: l.uom || it.uom || '', rate: rateKey ? l[rateKey] : (l.rate || it.last || it.rate || ''), disc: l.disc || 0, gst: String(l.gst || it.gst || '18') }; });
}
function makeFrom(target, srcKey, r) {
  if (target === 'po') return openForm('po', null, { prRef: r.id, department: r.department, project: r.project, subject: 'Order for supply of ' + (r.purpose || ''), lines: poLinesFrom(r.lines) });
  if (target === 'quotes') return openForm('quotes', null, { prRef: r.id, department: r.department, project: r.project, subject: r.purpose || '', lines: (r.lines || []).map(function (l) { var it = findOpt('items', l.item) || {}; return { item: l.item, hsn: it.hsn || '', qty: l.qty, uom: l.uom || it.uom || '', gst: String(it.gst || '18') }; }) });
  if (target === 'poL1') { var n = [1, 2, 3, 4].filter(function (k) { return r['vendor' + k] === r.l1Vendor; })[0]; return openForm('po', null, { qcRef: r.id, prRef: r.prRef || '', vendor: r.l1Vendor, department: r.department, project: r.project, subject: 'Order for supply of ' + (r.subject || ''), lines: poLinesFrom(r.lines, 'r' + n) }); }
  if (target === 'copy') return openForm('po', null, copyPoPreset(r));
  if (target === 'poV') return openForm('po', null, { vendor: r.name, paymentTerms: r.paymentTerms || '30 Days' });
  if (target === 'grn') return openForm('grn', null, { poRef: r.id });
  if (target === 'bills') return openForm('bills', null, { poRef: r.id, vendor: r.vendor, department: r.department, project: r.project });
  if (target === 'payments') return openForm('payments', null, { billRef: r.id, vendor: r.vendor, amount: r.balance });
}
function copyPoPreset(r) {
  var p = { vendor: r.vendor, department: r.department, project: r.project, subject: r.subject, quoteRef: r.quoteRef, paymentTerms: r.paymentTerms, freight: r.freight, otherCharges: r.otherCharges, receiver: r.receiver, lines: poLinesFrom(r.lines) };
  ['tDelivery', 'tTransport', 'tPayment', 'tWarranty', 'tInspection', 'tTestCert', 'tTaxes', 'deliveryAddress'].forEach(function (k) { if (r[k]) p[k] = r[k]; });
  p._copied = r.id; return p;
}

/* =====================================================================
   FORM DRAWER with ASSIST PANEL
   ===================================================================== */
var F = null;
var ASSIST = { po: 1, pr: 1, quotes: 1, bills: 1, payments: 1, grn: 1 };
function defVal(f) {
  var d = f.def, u = S.sess.user;
  if (d == null) return '';
  if (d === 'today') return today();
  if (d === 'now') { var n = new Date(); return ('0' + n.getHours()).slice(-2) + ':' + ('0' + n.getMinutes()).slice(-2); }
  if (d === 'me') return u.name;
  if (d === 'myDept') return u.dept || '';
  if (String(d).indexOf('T:') === 0) return (S.sess.config.poTerms || {})[d.slice(2)] || '';
  return d;
}
function lockedField(e, f) { if (f.ro) return true; if (e.self && !e.perm && (f.k === e.ownerField || f.k === 'department')) return true; return false; }
function openForm(key, rec, preset) {
  var e = ent(key); if (!e) return toast('No access.', true);
  var isNew = !rec, r = {};
  e.fields.forEach(function (f) { if (f.t === 'auto' || f.t === 'hidden') return; r[f.k] = isNew ? (f.t === 'files' ? [] : defVal(f)) : (rec[f.k] == null ? '' : rec[f.k]); });
  if (preset) Object.keys(preset).forEach(function (k) { if (k !== 'lines' && k !== '_copied' && k in r) r[k] = preset[k]; });
  F = { key: key, e: e, isNew: isNew, id: rec ? rec.id : null, rec: r, lines: e.lines ? JSON.parse(JSON.stringify((preset && preset.lines) || (rec && rec.lines) || [])) : null, active: 0 };
  if (e.lines && !F.lines.length && !e.lines.fixed) F.lines.push(blankLine(e));
  var canSubmit = isNew && (key === 'po' || key === 'pr'), canPost = isNew && key === 'grn', hasAssist = !!ASSIST[key];
  var secName = (e.fields.filter(function (f) { return f.sec; })[0] || {}).sec;
  openDrawer('<div class="dh"><div><h2>' + (isNew ? 'New ' : 'Edit ') + esc(e.single.toLowerCase()) + (TCODE[key] && isNew ? ' <span class="badge b-mute">' + ({ po: 'ME21N', pr: 'ME51N', quotes: 'ME47', grn: 'MIGO', bills: 'MIRO', payments: 'F-53' }[key] || '') + '</span>' : '') + '</h2><div class="sub">' + (isNew ? esc(e.title) : esc(F.id)) + (preset && preset._copied ? ' · copied from ' + esc(preset._copied) : '') + '</div></div>' +
    (key === 'po' && isNew ? '<button class="btn soft sm" id="copyOld" style="margin-left:auto">' + icon('copy', 15) + 'Copy old PO</button>' : '') + '<button class="x" data-x' + (key === 'po' && isNew ? ' style="margin-left:8px"' : '') + '>×</button></div>' +
    '<div class="dbody"><div class="db"><div class="sec"><div class="fgrid" id="fg"></div></div>' +
    (e.lines ? '<div class="sec"><h4>' + esc(e.lines.l) + (e.lines.fixed ? ' <small class="note">(from PO)</small>' : '') + '</h4><div style="overflow:auto"><table class="lines" id="ln"></table></div>' + (e.lines.fixed ? '' : '<button class="btn soft sm" id="addLn" style="margin-top:10px">' + icon('plus', 14) + 'Add line</button>') + '</div>' : '') +
    '<div class="sec" id="routeSec" style="display:none"><div class="routebox"><h5>Approval channel — who approves this</h5><div id="routeBox"></div></div></div>' +
    '<div class="sec" id="calcBox" style="display:none"></div>' + (secName ? '<div class="sec"><h4>' + esc(secName) + '</h4><div class="fgrid" id="fg2"></div></div>' : '') + '</div>' +
    (hasAssist ? '<aside class="assist" id="assist"><h4>ASSIST</h4><div id="asv"></div><div id="asi"></div></aside>' : '') + '</div>' +
    '<div class="df"><span class="keys"><kbd>Ctrl S</kbd> save' + (canSubmit || canPost ? ' · <kbd>Ctrl Enter</kbd> ' + (canPost ? 'post' : 'submit') : '') + ' · <kbd>Esc</kbd> close</span><button class="btn soft" data-x>Cancel</button><button class="btn ' + (canSubmit || canPost ? 'soft' : 'primary') + '" id="fSave">' + (canSubmit || canPost ? 'Save draft' : 'Save') + '</button>' +
    (canSubmit ? '<button class="btn primary" id="fSubmit">Save & submit</button>' : '') + (canPost ? '<button class="btn primary" id="fSubmit">Save & post GRN</button>' : '') + '</div>', hasAssist);
  $('pane').querySelectorAll('[data-x]').forEach(function (b) { b.onclick = closeDrawer; });
  if (key === 'approvals') { F.rec.fromDesg = S.sess.user.designation || ''; }
  renderFields(); renderLines(); calcPreview(); refreshRoute();
  if (hasAssist) assistIdle();
  if (key === 'grn' && r.poRef) loadPoForGrn(r.poRef);
  if (r.vendor && hasAssist) assistVendor(r.vendor, !!(preset && preset.vendor && !isNew));
  $('fSave').onclick = function () { saveForm(this, null); };
  if ($('fSubmit')) $('fSubmit').onclick = function () { saveForm(this, key === 'grn' ? 'post' : 'submit'); };
  if ($('addLn')) $('addLn').onclick = function () { F.lines.push(blankLine(e)); renderLines(); var t = $('ln').querySelectorAll('tbody tr'); var last = t[t.length - 1]; if (last) { var i = last.querySelector('input,select'); if (i) i.focus(); } };
  if ($('copyOld')) $('copyOld').onclick = copyOldModal;
  setTimeout(function () { var first = $('fg').querySelector('input:not([disabled]),select:not([disabled])'); if (first && window.innerWidth > 960) first.focus(); }, 350);
  if (window.PE_FORM_OPEN) try { PE_FORM_OPEN(key, F, isNew, setField); } catch (x) { }
}
function blankLine(e) { var o = {}; e.lines.cols.forEach(function (c) { o[c.k] = c.def != null ? c.def : ''; }); return o; }
function inputHtml(f, val, locked, attr) {
  var a = (attr || '') + (locked ? ' disabled' : ''), v = val == null ? '' : val;
  if (f.t === 'ref') return comboHtml(f, v, locked, attr);
  switch (f.t) {
    case 'textarea': return '<textarea class="in" ' + a + ' rows="3">' + esc(v) + '</textarea>';
    case 'number': return '<input class="in" type="number" step="any" min="0" inputmode="decimal" ' + a + ' value="' + esc(v) + '">';
    case 'money': return '<input class="in" type="number" step="0.01" min="0" inputmode="decimal" ' + a + ' value="' + esc(v) + '">';
    case 'date': return '<input class="in" type="date" ' + a + ' value="' + esc(v) + '">';
    case 'time': return '<input class="in" type="time" ' + a + ' value="' + esc(v) + '">';
    case 'email': return '<input class="in" type="email" ' + a + ' value="' + esc(v) + '">';
    case 'phone': return '<input class="in" inputmode="numeric" maxlength="10" ' + a + ' value="' + esc(v) + '">';
    case 'gstin': case 'pan': case 'ifsc': return '<input class="in" style="text-transform:uppercase" ' + a + ' value="' + esc(v) + '">';
    case 'select': return '<select class="in" ' + a + '><option value="">' + (f.req ? 'Select' : '-') + '</option>' + f.opts.map(function (o) { return '<option' + (String(o) === String(v) ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
    default: return '<input class="in" ' + a + ' value="' + esc(v) + '">';
  }
}
function renderFields() {
  var e = F.e, html = '', html2 = '';
  e.fields.forEach(function (f) {
    if (f.t === 'auto' || f.t === 'hidden' || f.noForm) return;
    if (f.ro && F.isNew && !F.rec[f.k] && f.def == null) return;
    var locked = lockedField(e, f), wide = f.t === 'textarea' || f.t === 'files' || f.t === 'multi' ? ' wide' : '';
    var h = '<div class="' + wide + '"><label class="f">' + esc(f.l) + (f.req && !locked ? ' <span class="req">*</span>' : '') + '</label>';
    if (f.t === 'multi') { var cur = String(F.rec[f.k] || '').split(',').map(function (s) { return s.trim(); }); h += '<div class="multi" data-k="' + f.k + '">' + f.opts.map(function (o) { return '<label><input type="checkbox" value="' + esc(o) + '"' + (cur.indexOf(o) > -1 ? ' checked' : '') + '>' + esc(o) + '</label>'; }).join('') + '</div>'; }
    else if (f.t === 'files') h += '<div class="files" data-files="' + f.k + '"></div><input type="file" hidden data-fin="' + f.k + '" accept="image/*' + (f.pdf ? ',application/pdf' : '') + '" multiple>';
    else h += inputHtml(f, F.rec[f.k], locked, 'data-k="' + f.k + '"');
    h += '<div class="hint" data-hint="' + f.k + '">' + (f.hint ? esc(f.hint) : '') + '</div></div>';
    if (f.sec) html2 += h; else html += h;
  });
  $('fg').innerHTML = html; if ($('fg2')) $('fg2').innerHTML = html2;
  $('pane').querySelectorAll('.fgrid [data-k]').forEach(function (el) {
    var k = el.dataset.k;
    if (el.classList.contains('multi')) { el.onchange = function (ev) { var ins = el.querySelectorAll('input'); if (ev && ev.target && ev.target.value === 'All' && ev.target.checked) ins.forEach(function (i) { if (i.value !== 'All') i.checked = false; }); else if (ev && ev.target && ev.target.checked) ins.forEach(function (i) { if (i.value === 'All') i.checked = false; }); F.rec[k] = Array.prototype.filter.call(ins, function (i) { return i.checked; }).map(function (i) { return i.value; }); onFieldChange(k); }; return; }
    if (el.dataset.ref) { bindCombo(el, function (v, o, typing) { F.rec[k] = v; if (!typing) onFieldChange(k); calcPreview(); }); return; }
    var h = function () { F.rec[k] = el.value; onFieldChange(k); calcPreview(); };
    el.addEventListener('input', h); el.addEventListener('change', h);
  });
  e.fields.filter(function (f) { return f.t === 'files'; }).forEach(function (f) { renderFiles(f); });
}
function setField(k, v) { F.rec[k] = v; var el = $('pane').querySelector('.fgrid [data-k="' + k + '"]'); if (el) { el.value = v; el.classList.remove('flash'); void el.offsetWidth; el.animate && el.animate([{ background: '#FFF0F7' }, { background: '#fff' }], { duration: 900 }); } }
function setHint(k, html, cls) { var h = $('pane').querySelector('[data-hint="' + k + '"]'); if (h) { h.innerHTML = html; h.className = 'hint ' + (cls || ''); } }
function onFieldChange(k) {
  var key = F.key, r = F.rec;
  if (k === 'vendor' && ASSIST[key]) assistVendor(r.vendor);
  if (key === 'po' && k === 'vendor') { var vo = findOpt('vendors', r.vendor); if (vo && vo.terms) setField('paymentTerms', vo.terms); }
  if (key === 'grn' && k === 'poRef') loadPoForGrn(r.poRef);
  if (key === 'bills' && k === 'poRef') { var p = findOpt('billablePos', r.poRef); if (p) { if (r.vendor !== p.vendor) { setField('vendor', p.vendor); assistVendor(p.vendor); } if (!r.department) setField('department', p.department); if (!r.project) setField('project', p.project); } }
  if (key === 'bills' && (k === 'taxable' || k === 'gstRate' || k === 'vendor')) gstSplit();
  if (key === 'bills' && (k === 'tdsPct' || k === 'taxable')) { if (num(r.tdsPct) > 0) setField('tds', r2(num(r.taxable) * num(r.tdsPct) / 100)); }
  if (key === 'payments' && k === 'billRef') { var b = findOpt('payableBills', r.billRef); if (b) { setField('vendor', b.vendor); setField('amount', r2(b.balance)); assistVendor(b.vendor); } }
  if (key === 'quotes' && /^vendor\d$/.test(k)) renderLines();
  if (key === 'approvals' && k === 'toName') { var uo = findOpt('users', r.toName); if (uo) { r.toDept = uo.dept || ''; r.toDesg = uo.des || ''; setHint('toName', esc((uo.des || '') + (uo.dept ? ' · ' + uo.dept : '')), 'ok'); } }
  refreshRoute();
}
var ROUTE_KEYS = { pr: 1, expenses: 1, po: 1, payments: 1 };
var refreshRoute = debounce(function () {
  if (!F || !$('routeSec')) return;
  var e = F.e; if (!e.chain && !ROUTE_KEYS[F.key]) return;
  var data = {}; Object.keys(F.rec).forEach(function (k) { if (!Array.isArray(F.rec[k]) || typeof F.rec[k][0] !== 'object') data[k] = F.rec[k]; });
  if (F.key === 'po' && F.lines) { var t = 0; F.lines.forEach(function (l) { var a = num(l.qty) * num(l.rate) * (1 - num(l.disc) / 100); t += a * (1 + num(l.gst) / 100); }); data.total = t + num(F.rec.freight) + num(F.rec.otherCharges); }
  if (F.key === 'approvals' && !data.toName) { $('routeSec').style.display = ''; $('routeBox').innerHTML = '<span class="note">Choose the final approver in "To" to see the full channel.</span>'; return; }
  var mine = F; call('previewRoute', S.token, F.key, data).then(function (path) { if (F !== mine) return; $('routeSec').style.display = path.length ? '' : 'none'; $('routeBox').innerHTML = pathHtml(path) + (path.some(function (p) { return p.st === 'skip' && /Nobody/.test(p.rm || ''); }) ? '<p class="note" style="color:#A35A00">A role has no person — ask admin to set the department head.</p>' : ''); }).catch(function () { });
}, 450);
function intra(vendor) { var vi = S.vi[vendor]; if (vi) return vi.vendor.intra; var o = findOpt('vendors', vendor); return !o || !o.gstin || String(o.gstin).slice(0, 2) === S.sess.config.stateCode; }
function gstSplit() {
  var r = F.rec, t = num(r.taxable), g = num(r.gstRate);
  if (!t || r.gstRate === '') return;
  if (intra(r.vendor)) { setField('cgst', r2(t * g / 200)); setField('sgst', r2(t * g / 200)); setField('igst', 0); setHint('cgst', 'Auto: Tamil Nadu vendor → CGST + SGST ' + (g / 2) + '% each', 'sug'); }
  else { setField('igst', r2(t * g / 100)); setField('cgst', 0); setField('sgst', 0); setHint('cgst', 'Auto: other-state vendor → IGST ' + g + '%', 'sug'); }
}
function loadPoForGrn(poId) {
  if (!poId) { F.lines = []; renderLines(); return; }
  var o = findOpt('openPos', poId); if (o) { setField('vendor', o.vendor); setField('project', o.project); }
  call('getRecord', S.token, 'po', poId).then(function (res) {
    var po = res.rec; setField('vendor', po.vendor); setField('project', po.project);
    var keep = {}; (F.lines || []).forEach(function (l) { keep[l.pl] = l; });
    F.lines = po.lines.map(function (l, i) { var pend = r2(num(l.qty) - num(l.recd)), k = keep[i]; return { pl: i, item: l.item + (l.desc ? ' - ' + l.desc : ''), uom: l.uom, ordered: num(l.qty), prev: num(l.recd), received: k ? k.received : pend, accepted: k ? k.accepted : pend, rejected: 0, lremarks: k ? k.lremarks : '' }; })
      .filter(function (l) { return l.ordered - l.prev > 0 || keep[l.pl]; });
    renderLines(); assistVendor(po.vendor);
  }).catch(fail);
}
function rateHint(l) {
  var ii = S.ii[String(l.item || '').toLowerCase()];
  if (!ii || !ii.last) { var it = findOpt('items', l.item); if (it && it.last) ii = { last: { rate: it.last, vendor: it.lv } }; else return ''; }
  var last = num(ii.last.rate), cur = num(l.rate);
  if (!last) return '';
  var d = cur ? Math.round((cur - last) / last * 100) : 0;
  return '<div class="lh ' + (d > 5 ? 'up' : d < -5 ? 'down' : 'note') + '" title="Last purchase: ' + esc(ii.last.vendor || '') + '">Last ' + inr(last, true) + (cur && d ? ' · ' + (d > 0 ? '+' : '') + d + '%' : '') + '</div>';
}
function renderLines() {
  if (!F.lines || !$('ln')) return;
  var e = F.e, fixed = e.lines.fixed, key = F.key;
  var cols = e.lines.cols.filter(function (c) { return c.t !== 'hidden'; });
  if (key === 'quotes') cols = cols.filter(function (c) { var m = /^r(\d)$/.exec(c.k); return !m || F.rec['vendor' + m[1]]; });
  if (!F.lines.length) { $('ln').innerHTML = '<tr><td class="note" style="padding:14px">' + (key === 'grn' ? 'Select a PO to load its pending items.' : 'No lines.') + '</td></tr>'; return; }
  var label = function (c) { var m = /^r(\d)$/.exec(c.k); return m && key === 'quotes' ? esc(String(F.rec['vendor' + m[1]]).slice(0, 18)) : esc(c.l); };
  $('ln').innerHTML = '<thead><tr><th>#</th>' + cols.map(function (c) { return '<th>' + label(c) + (c.req ? ' <span class="req">*</span>' : '') + '</th>'; }).join('') + (fixed ? '' : '<th></th>') + '</tr></thead><tbody>' +
    F.lines.map(function (l, i) {
      return '<tr data-i="' + i + '"><td class="n">' + (i + 1) + '</td>' + cols.map(function (c) {
        if (c.t === 'auto') return '<td class="auto" data-auto="' + c.k + '">' + lineAuto(c.k, l) + '</td>';
        var extra = c.k === 'rate' && key === 'po' ? '<div data-rh>' + rateHint(l) + '</div>' : (c.k === 'hsn' ? '<div class="lh note" data-hh></div>' : '');
        var best = key === 'quotes' && /^r\d$/.test(c.k) && l.best === 'V' + c.k.slice(1) ? ' best' : '';
        return '<td class="' + (c.w === 'wide' ? 'wide' : '') + best + '">' + inputHtml(c, l[c.k], !!c.ro, 'data-c="' + c.k + '"') + extra + '</td>';
      }).join('') + (fixed ? '' : '<td><button class="x" data-rm title="Remove line">×</button></td>') + '</tr>';
    }).join('') + '</tbody>';
  $('ln').querySelectorAll('[data-c]').forEach(function (el) {
    var tr = el.closest('tr'), i = +tr.dataset.i, c = el.dataset.c;
    var after = function () { var l = F.lines[i]; tr.querySelectorAll('[data-auto]').forEach(function (td) { td.textContent = lineAuto(td.dataset.auto, l); }); var rh = tr.querySelector('[data-rh]'); if (rh) rh.innerHTML = rateHint(l); calcPreview(); };
    if (el.dataset.ref) {
      bindCombo(el, function (v, o, typing) { F.lines[i][c] = v; if (c === 'item' && !typing) itemPicked(i, tr, v); after(); });
      el.addEventListener('focus', function () { F.active = i; if (c === 'item' && el.value) assistItem(el.value, i); });
      return;
    }
    var h = function () {
      var l = F.lines[i]; l[c] = el.value;
      if (c === 'tstatus' && el.value === 'Completed') l.pct = 100;
      if (c === 'received' && key === 'grn') { l.accepted = el.value; var ac = tr.querySelector('[data-c="accepted"]'); if (ac) ac.value = el.value; }
      after();
    };
    el.addEventListener('input', h); el.addEventListener('change', h);
    el.addEventListener('focus', function () { F.active = i; });
  });
  $('ln').querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { var tr = b.closest('tr'); tr.style.transition = 'all .25s'; tr.style.opacity = 0; setTimeout(function () { F.lines.splice(+tr.dataset.i, 1); if (!F.lines.length) F.lines.push(blankLine(e)); renderLines(); calcPreview(); }, 220); }; });
  F.lines.forEach(function (l, i) { if (l.item && !l.hsn) hsnHint(i); });
}
function setCell(tr, k, v) { var x = tr.querySelector('[data-c="' + k + '"]'); if (x) { x.value = v; x.animate && x.animate([{ background: '#E6F1FE' }, { background: '#fff' }], { duration: 800 }); } }
function itemPicked(i, tr, name) {
  var l = F.lines[i], it = findOpt('items', name);
  if (it) {
    ['uom', 'hsn', 'gst'].forEach(function (k) { if (k in l && it[k] !== '' && it[k] != null) { l[k] = String(it[k]); setCell(tr, k, l[k]); } });
    if ('rate' in l && !num(l.rate) && (it.last || it.rate)) { l.rate = it.last || it.rate; setCell(tr, 'rate', l.rate); }
  }
  if (!it || !it.hsn) hsnHint(i);
  if (name) assistItem(name, i);
}
function hsnHint(i) {
  var l = F.lines[i], tr = $('ln') && $('ln').querySelector('tr[data-i="' + i + '"]'); if (!tr || !('hsn' in l)) return;
  var cell = tr.querySelector('[data-hh]'); if (!cell) return;
  if (l.hsn) { cell.innerHTML = ''; return; }
  var g = hsnGuess(l.item + ' ' + (l.desc || ''));
  if (!g) { cell.innerHTML = ''; return; }
  cell.innerHTML = '<a href="#" style="color:var(--info);font-weight:700">Use ' + g.hsn + '?</a>';
  cell.title = 'Suggested: ' + g.label + ' - verify with vendor invoice';
  cell.querySelector('a').onclick = function (ev) { ev.preventDefault(); l.hsn = g.hsn; setCell(tr, 'hsn', g.hsn); if (g.gst && 'gst' in l) { l.gst = g.gst; setCell(tr, 'gst', g.gst); } cell.innerHTML = '<span class="note">' + esc(g.label) + ' · verify</span>'; calcPreview(); };
}
function lineAuto(k, l) {
  if (k === 'amount') return inr(r2(num(l.qty) * num(l.rate) * (1 - num(l.disc) / 100)), true);
  if (k === 'rejected') return r2(num(l.received) - num(l.accepted));
  if (k === 'recd' || k === 'ordered' || k === 'prev') return num(l[k]);
  if (k === 'best') { var b = -1, br = Infinity; [1, 2, 3, 4].forEach(function (n) { var v = l['r' + n]; if (F.rec['vendor' + n] && v !== '' && v != null && num(v) > 0 && num(v) < br) { br = num(v); b = n; } }); return b > 0 ? String(F.rec['vendor' + b]).slice(0, 14) : ''; }
  return l[k] == null ? '' : l[k];
}
function calcPreview() {
  var box = $('calcBox'); if (!box || !F) return;
  var r = F.rec, k = F.key, rows = [];
  if (k === 'po') {
    var sub = 0, gst = 0; F.lines.forEach(function (l) { var a = r2(num(l.qty) * num(l.rate) * (1 - num(l.disc) / 100)); sub += a; gst += r2(a * num(l.gst) / 100); });
    var tot = r2(sub + gst + num(r.freight) + num(r.otherCharges));
    rows = [['Subtotal', inr(sub)], ['GST', inr(gst)], ['Freight + other', inr(num(r.freight) + num(r.otherCharges))], ['Grand total', inr(tot)]];
    if (tot > S.sess.config.poLimit) rows.splice(3, 0, ['Approval', 'Dept Head + MD (above ' + inrShort(S.sess.config.poLimit) + ')']);
  }
  if (k === 'quotes') {
    var tots = [1, 2, 3, 4].map(function (n) { if (!r['vendor' + n]) return null; var t = 0, full = true; F.lines.forEach(function (l) { var v = l['r' + n]; if (v === '' || v == null || !(num(v) > 0)) full = false; else t += num(l.qty) * num(v) * (1 + num(l.gst) / 100); }); return { v: r['vendor' + n], t: r2(t), full: full }; }).filter(Boolean);
    var ok = tots.filter(function (x) { return x.full && x.t > 0; }).sort(function (a, b) { return a.t - b.t; });
    rows = tots.map(function (x) { return [x.v + (ok[0] && ok[0].v === x.v ? '  ★ L1' : '') + (x.full ? '' : '  (incomplete)'), inr(x.t)]; });
    if (ok.length > 1) rows.push(['Saving vs L2', inr(ok[1].t - ok[0].t)]);
  }
  if (k === 'bills') { var t2 = r2(num(r.taxable) + num(r.cgst) + num(r.sgst) + num(r.igst)); var tds = num(r.tdsPct) > 0 ? r2(num(r.taxable) * num(r.tdsPct) / 100) : num(r.tds); rows = [['Invoice total', inr(t2)], ['TDS', inr(tds)], ['Net payable', inr(t2 - tds)]]; }
  if (k === 'clientbills') rows = [['Invoice total', inr(num(r.taxable) + num(r.gst))]];
  if (k === 'vehicles' && r.endKm !== '' && r.startKm !== '') rows = [['Distance', r2(num(r.endKm) - num(r.startKm)) + ' km']];
  box.style.display = rows.length ? '' : 'none';
  box.innerHTML = '<div class="totals" style="max-width:none">' + rows.map(function (x) { return '<div><span>' + esc(x[0]) + '</span><b>' + esc(x[1]) + '</b></div>'; }).join('') + '</div>';
  if (k === 'quotes' && $('ln')) $('ln').querySelectorAll('tbody tr').forEach(function (tr) { var l = F.lines[+tr.dataset.i]; var b = -1, br = Infinity; [1, 2, 3, 4].forEach(function (n) { var v = l['r' + n]; if (r['vendor' + n] && v !== '' && v != null && num(v) > 0 && num(v) < br) { br = num(v); b = n; } }); tr.querySelectorAll('[data-c]').forEach(function (el) { var m = /^r(\d)$/.exec(el.dataset.c); if (m) el.parentElement.classList.toggle('best', +m[1] === b); }); });
}

/* ---------------- assist panel ---------------- */
function assistIdle() {
  var k = F.key, msg = { po: 'Pick a vendor to see its recent POs, items bought before and outstanding. Pick an item to see its last rate.', pr: 'Pick an item to see its HSN and unit from the master.', quotes: 'Add 2 to 4 vendors and their rates. The lowest is highlighted live and the L1 vendor is shown below the items.', bills: 'Pick a vendor: POs received but not yet billed appear here. Click one to fill the bill.', payments: 'Pick a vendor: its verified bills appear here. Click one to fill the payment.', grn: 'Pick the PO. Pending quantities load automatically.' }[k];
  if ($('asv')) $('asv').innerHTML = '<div class="acard"><span class="note">' + esc(msg || '') + '</span></div>';
}
function assistVendor(name, quiet) {
  if (!$('asv') || !name) return;
  var render = function (vi) {
    if (!F || F.rec.vendor !== name && F.key !== 'payments' && F.key !== 'bills' && F.key !== 'grn') return;
    if (!vi) { $('asv').innerHTML = ''; return; }
    S.vi[name] = vi;
    var v = vi.vendor, h = '<div class="acard"><b>' + esc(v.name) + '</b><div class="note">' + esc([v.code, v.gstin].filter(Boolean).join(' · ')) + '</div>' +
      '<div class="row"><span>Tax</span><b>' + (v.intra ? 'CGST + SGST' : 'IGST') + '</b></div><div class="row"><span>Terms</span><b>' + esc(v.terms || '-') + '</b></div><div class="row"><span>Outstanding</span><b>' + inr(vi.outstanding) + '</b></div><div class="row"><span>Open POs</span><b>' + vi.openPos + '</b></div>' + (v.contact || v.mobile ? '<div class="row"><span>Contact</span><b>' + esc([v.contact, v.mobile].filter(Boolean).join(' ')) + '</b></div>' : '') + '</div>';
    if (F.key === 'po') {
      if (vi.items.length) h += '<h4>BOUGHT BEFORE · CLICK TO ADD</h4>' + vi.items.slice(0, 8).map(function (it, i) { return '<button class="pick" data-add="' + i + '"><b>' + esc(it.item) + '</b><small>Last ' + inr(it.rate) + ' / ' + esc(it.uom || '') + ' · ' + fdate(it.date) + '</small></button>'; }).join('');
      if (vi.pos.length) h += '<h4>RECENT POs · CLICK TO COPY</h4>' + vi.pos.slice(0, 5).map(function (p) { return '<button class="pick" data-copy="' + esc(p.id) + '"><b>' + esc(p.id) + '</b><small>' + fdate(p.date) + ' · ' + inr(p.total) + ' · ' + esc(p.status) + '</small></button>'; }).join('');
    }
    if (F.key === 'bills') {
      h += '<h4>RECEIVED, NOT BILLED · CLICK TO FILL</h4>' + (vi.unbilled.length ? vi.unbilled.map(function (u, i) { return '<button class="pick" data-ub="' + i + '"><b>' + esc(u.id) + '</b><small>Unbilled ' + inr(u.unbilled) + ' + GST ' + inr(u.gst) + (u.billed ? ' · billed ' + inr(u.billed) : '') + '</small></button>'; }).join('') : '<div class="note">No received-but-unbilled POs for this vendor.</div>');
    }
    if (F.key === 'payments' || F.key === 'bills') {
      if (vi.payable.length) h += '<h4>' + (F.key === 'payments' ? 'PAYABLE BILLS · CLICK TO FILL' : 'OUTSTANDING BILLS') + '</h4>' + vi.payable.map(function (b, i) { return '<button class="pick" data-pb="' + i + '"' + (F.key !== 'payments' ? ' disabled' : '') + '><b>' + esc(b.id) + ' · ' + esc(b.billNo) + '</b><small>Balance ' + inr(b.balance) + (b.dueDate ? ' · due ' + fdate(b.dueDate) : '') + '</small></button>'; }).join('');
      else if (F.key === 'payments') h += '<div class="note">No verified bills with balance for this vendor.</div>';
    }
    $('asv').innerHTML = h;
    $('asv').querySelectorAll('[data-add]').forEach(function (b) { b.onclick = function () { var it = vi.items[+b.dataset.add], o = findOpt('items', it.item) || {}; var empty = F.lines.filter(function (l) { return !l.item; })[0]; var l = empty || blankLine(F.e); if (!empty) F.lines.push(l); l.item = it.item; l.uom = it.uom || o.uom || l.uom; l.rate = it.rate; l.hsn = o.hsn || l.hsn; l.gst = String(o.gst || l.gst || '18'); renderLines(); calcPreview(); toast(it.item + ' added at last rate.'); }; });
    $('asv').querySelectorAll('[data-copy]').forEach(function (b) { b.onclick = function () { copyPoInto(b.dataset.copy); }; });
    $('asv').querySelectorAll('[data-ub]').forEach(function (b) { b.onclick = function () { var u = vi.unbilled[+b.dataset.ub]; setField('poRef', u.id); setField('department', u.department || F.rec.department); setField('project', u.project || F.rec.project); setField('taxable', u.unbilled); if (u.rates.length === 1) setField('gstRate', u.rates[0]); gstSplit(); if (u.rates.length > 1) { if (intra(F.rec.vendor)) { setField('cgst', r2(u.gst / 2)); setField('sgst', r2(u.gst / 2)); setField('igst', 0); } else { setField('igst', u.gst); setField('cgst', 0); setField('sgst', 0); } setHint('cgst', 'Mixed GST rates on this PO - GST filled from PO lines', 'sug'); } calcPreview(); toast('Filled from ' + u.id + '. Check against the vendor invoice.'); }; });
    $('asv').querySelectorAll('[data-pb]').forEach(function (b) { b.onclick = function () { var p = vi.payable[+b.dataset.pb]; setField('billRef', p.id); setField('amount', p.balance); calcPreview(); toast('Filled from ' + p.id + '.'); }; });
  };
  if (S.vi[name]) render(S.vi[name]);
  else if (!quiet) $('asv').innerHTML = '<div class="acard"><div class="sk skl"></div><div class="sk skl" style="width:70%"></div><div class="sk skl" style="width:50%"></div></div>';
  call('vendorInsight', S.token, name).then(render).catch(function () { if ($('asv')) $('asv').innerHTML = ''; });
}
function assistItem(name, i) {
  if (!$('asi') || !name) return;
  var key = String(name).toLowerCase();
  var render = function (ii) {
    S.ii[key] = ii;
    if (!$('asi') || !F) return;
    var g = !ii || !ii.hsn ? hsnGuess(name) : null;
    var h = '<h4>ITEM</h4><div class="acard"><b>' + esc(name) + '</b>' +
      (ii && ii.master ? '<div class="note">' + esc([ii.master.code, ii.master.uom, ii.master.hsn ? 'HSN ' + ii.master.hsn : '', ii.master.gst ? 'GST ' + ii.master.gst + '%' : ''].filter(Boolean).join(' · ')) + '</div>' : '<div class="note">Not in item master yet' + (F.key === 'po' ? ' - it is added automatically when this PO is approved' : '') + '.</div>') +
      (ii && ii.last ? '<div class="row"><span>Last rate</span><b>' + inr(ii.last.rate) + '</b></div><div class="row"><span>Last vendor</span><b>' + esc(ii.last.vendor) + '</b></div><div class="row"><span>Lowest / avg</span><b>' + inr(ii.min) + ' / ' + inr(ii.avg) + '</b></div>' : '') +
      (g ? '<div class="row"><span>HSN suggestion</span><b>' + g.hsn + (g.gst ? ' · ' + g.gst + '%' : '') + '</b></div><div class="note">' + esc(g.label) + '. Verify with the vendor invoice.</div>' : '') +
      (ii && ii.last && F.key === 'po' ? '<button class="btn soft sm" id="useLast" style="margin-top:10px">Use last rate ' + inr(ii.last.rate) + '</button>' : '') + '</div>' +
      (ii && ii.history && ii.history.length > 1 ? '<div class="acard">' + ii.history.map(function (x) { return '<div class="row"><span>' + fdate(x.date) + ' · ' + esc(String(x.vendor).slice(0, 16)) + '</span><b>' + inr(x.rate) + '</b></div>'; }).join('') + '</div>' : '');
    $('asi').innerHTML = h;
    if ($('useLast')) $('useLast').onclick = function () { var l = F.lines[i]; if (!l) return; l.rate = ii.last.rate; var tr = $('ln').querySelector('tr[data-i="' + i + '"]'); if (tr) { setCell(tr, 'rate', l.rate); var rh = tr.querySelector('[data-rh]'); if (rh) rh.innerHTML = rateHint(l); tr.querySelectorAll('[data-auto]').forEach(function (td) { td.textContent = lineAuto(td.dataset.auto, l); }); } calcPreview(); };
    var tr = $('ln') && $('ln').querySelector('tr[data-i="' + i + '"]'); if (tr) { var rh = tr.querySelector('[data-rh]'); if (rh) rh.innerHTML = rateHint(F.lines[i] || {}); }
    if (ii && ii.hsn && F.lines[i] && 'hsn' in F.lines[i] && !F.lines[i].hsn) { F.lines[i].hsn = ii.hsn; if (tr) setCell(tr, 'hsn', ii.hsn); if (ii.gst && 'gst' in F.lines[i]) { F.lines[i].gst = String(ii.gst); if (tr) setCell(tr, 'gst', ii.gst); } if (ii.uom && 'uom' in F.lines[i] && !F.lines[i].uom) { F.lines[i].uom = ii.uom; if (tr) setCell(tr, 'uom', ii.uom); } }
  };
  if (S.ii[key]) render(S.ii[key]);
  call('itemInsight', S.token, name).then(render).catch(function () { });
}
function copyOldModal() {
  modal('<h3>Copy from an old PO</h3><p class="note">Search by PO number, vendor, subject or item. Lines, rates and terms are copied; you can change anything before saving.</p><div class="search" style="margin-top:12px">' + icon('search', 16) + '<input id="cq" placeholder="e.g. A017, ARC, HDPE pipe" autocomplete="off"></div><div class="list" id="cres" style="margin-top:12px;max-height:50vh;overflow:auto"></div><div class="mfoot"><button class="btn soft" data-close>Close</button></div>');
  var drawList = function () {
    var q = $('cq').value.trim().toLowerCase(), rows = (S.cache.po || []).filter(function (p) { if (!q) return true; return [p.id, p.vendor, p.subject, p.project].concat((p.lines || []).map(function (l) { return l.item; })).join(' ').toLowerCase().indexOf(q) > -1; }).slice(0, 40);
    $('cres').innerHTML = rows.length ? rows.map(function (p) { return '<div class="li click" data-id="' + esc(p.id) + '"><div class="t"><b>' + esc(p.id) + '</b><p>' + esc(p.vendor) + ' · ' + esc(p.subject || '') + ' · ' + inr(p.total) + ' · ' + fdate(p.date) + '</p></div>' + badge(p.status) + '</div>'; }).join('') : '<div class="empty"><b>No PO found</b>Try another word.</div>';
    $('cres').querySelectorAll('[data-id]').forEach(function (x) { x.onclick = function () { closeModal(); copyPoInto(x.dataset.id); }; });
  };
  $('cq').oninput = debounce(drawList, 120); $('cq').focus();
  if (S.cache.po) drawList(); else { $('cres').innerHTML = '<div class="sk skl"></div><div class="sk skl"></div>'; call('listRecords', S.token, 'po').then(function (r) { S.cache.po = r.rows; drawList(); }).catch(fail); }
}
function copyPoInto(id) {
  call('getRecord', S.token, 'po', id).then(function (res) {
    var p = copyPoPreset(res.rec);
    Object.keys(p).forEach(function (k) { if (k !== 'lines' && k !== '_copied' && k in F.rec) F.rec[k] = p[k]; });
    F.lines = p.lines; renderFields(); renderLines(); calcPreview(); assistVendor(F.rec.vendor);
    toast('Copied from ' + id + '. Update quantities, rates and delivery date.');
  }).catch(fail);
}

/* files */
function renderFiles(f) {
  var box = $('pane').querySelector('[data-files="' + f.k + '"]'); if (!box) return;
  var arr = F.rec[f.k] || [], max = f.max || 5;
  box.innerHTML = arr.map(function (x, i) { var src = typeof x === 'string' ? thumb(x, 240) : (x.data.indexOf('application/pdf') > -1 ? '' : x.data); return '<div class="fth"><span>PDF</span>' + (src ? '<img src="' + src + '" alt="" onerror="this.remove()">' : '') + '<button class="x" data-rmf="' + i + '" aria-label="Remove">×</button></div>'; }).join('') +
    (arr.length < max ? '<label class="fadd pe-up" for="fi_' + f.k + '" title="Upload photo or file"><span class="pe-up-l"><i></i><i></i></span><span class="pe-up-b"><i></i><i></i><i></i></span><span class="pe-up-c"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4"/><path d="M6 10l6-6 6 6"/><path d="M4 20h16"/></svg><b>Upload</b></span></label>' : '') + '<div class="note" style="align-self:center">' + arr.length + ' / ' + max + '</div>';
  var input = $('pane').querySelector('[data-fin="' + f.k + '"]'); input.id = 'fi_' + f.k;
  box.querySelectorAll('[data-rmf]').forEach(function (b) { b.onclick = function () { arr.splice(+b.dataset.rmf, 1); renderFiles(f); }; });
  input.onchange = function () {
    var files = Array.prototype.slice.call(this.files), room = max - arr.length;
    if (files.length > room) toast('Only ' + room + ' more file(s) allowed.', true);
    var up = box.querySelector('.pe-up'); if (up && files.length) up.classList.add('busy');
    files.slice(0, room).forEach(function (file) { prepFile(file, f).then(function (d) { arr.push({ data: d, name: file.name }); F.rec[f.k] = arr; renderFiles(f); }).catch(fail); });
    this.value = '';
  };
}
function prepFile(file, f) {
  var cfg = S.sess.config.photo || { px: 1600, q: .78, mb: 8 };
  return new Promise(function (res, rej) {
    var rd = new FileReader(); rd.onerror = function () { rej(new Error('Could not read ' + file.name)); };
    if (file.type === 'application/pdf') { if (!f.pdf) return rej(new Error('Only photos allowed here.')); if (file.size > cfg.mb * 1048576) return rej(new Error(file.name + ' is larger than ' + cfg.mb + ' MB.')); rd.onload = function () { res(rd.result); }; return rd.readAsDataURL(file); }
    if (!/^image\//.test(file.type)) return rej(new Error(file.name + ' is not an image or PDF.'));
    rd.onload = function () {
      var img = new Image(); img.onerror = function () { rej(new Error('Could not open ' + file.name)); };
      img.onload = function () { var k = Math.min(1, cfg.px / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', cfg.q)); };
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  });
}
function saveForm(btn, then) {
  if (!F) return;
  var e = F.e, r = F.rec;
  for (var i = 0; i < e.fields.length; i++) {
    var f = e.fields[i];
    if (!f.req || f.t === 'auto' || lockedField(e, f)) continue;
    var v = r[f.k];
    if (v === '' || v == null || (Array.isArray(v) && !v.length)) { toast(f.l + ' is required.', true); var el = $('pane').querySelector('.fgrid [data-k="' + f.k + '"]'); if (el) { el.focus(); el.animate && el.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], { duration: 300 }); } return; }
  }
  var data = {}; Object.keys(r).forEach(function (k) { data[k] = r[k]; });
  if (!F.isNew) data.id = F.id;
  if (e.lines) data.lines = F.lines;
  busy(btn, true, 'Saving');
  var other = $('fSubmit') && btn !== $('fSubmit') ? $('fSubmit') : $('fSave'); if (other) other.disabled = true;
  var key = F.key;
  var multi = F.multi && F.multi.k && F.multi.names.length > 1 ? F.multi : null;
  call('saveRecord', S.token, key, data).then(function (res) {
    if (res && !res.offline && multi) {
      return Promise.all(multi.names.slice(1).map(function (n) { var d = {}; Object.keys(data).forEach(function (k) { if (k !== 'id') d[k] = data[k]; }); d[multi.k] = n; return call('saveRecord', S.token, key, d); })).then(function (more) {
        closeDrawer(); toast('Assigned to ' + multi.names.length + ' people: ' + [res.id].concat(more.map(function (m) { return m && m.id; })).filter(String).join(', '));
        S.cache[key] = null; if (S.reloadList && S.route.k === key) S.reloadList(); if (S.route.v === 'home') refreshBoot();
      });
    }
    if (res && res.offline) { if (then && window.PE_QUEUE_THEN) window.PE_QUEUE_THEN(res.qid, then); closeDrawer(); toast('No internet - saved on this device. It uploads automatically when you are online.'); return; }
    var done = function (msg) { closeDrawer(); toast(msg); S.cache[key] = null; if (S.reloadList && S.route.k === key) S.reloadList(); refreshOpts(); openDetail(key, res.id); if (S.route.v === 'home') refreshBoot(); };
    if (then) return call('doAction', S.token, key, res.id, then, {}).then(function () { done(res.id + (then === 'post' ? ' posted.' : ' submitted.')); }).catch(function (x) { done(res.id + ' saved as draft. ' + x.message); });
    done(res.id + ' saved.');
  }).catch(function (x) { busy(btn, false); if (other) other.disabled = false; fail(x); });
}

/* =====================================================================
   ACCOUNTS: VENDOR LEDGER + AGEING
   ===================================================================== */
function ledger(v, vendor) {
  setTitle('Vendor ledger', 'Accounts · FBL1N');
  v.innerHTML = '<div class="lhead"><p>Bills (credit) and paid payments (debit) with running balance.</p><div class="tools"><div style="min-width:300px">' + comboHtml({ ref: 'vendors' }, vendor || '', false, 'id="lv"') + '</div><button class="btn soft" id="lprint">' + icon('print', 16) + 'Print statement</button></div></div><div class="glass" id="lt"><div class="empty"><b>Choose a vendor</b>The statement appears here.</div></div>';
  var data = null;
  var load = function (name) {
    if (!name) return; skeleton($('lt'), 6);
    call('vendorLedger', S.token, name).then(function (d) {
      data = d;
      $('lt').innerHTML = '<div style="padding:18px 20px 4px" class="kv"><div><span>Billed</span><b>' + inr(d.billed) + '</b></div><div><span>Paid</span><b>' + inr(d.paid) + '</b></div><div><span>Balance payable</span><b style="font-family:Sora;font-size:18px">' + inr(d.balance) + '</b></div></div>' +
        (d.rows.length ? '<div class="tablewrap"><table class="tb"><thead><tr><th>Date</th><th>Type</th><th>Ref</th><th>Doc / UTR</th><th>Note</th><th class="num">Bill (Cr)</th><th class="num">Paid (Dr)</th><th class="num">Balance</th></tr></thead><tbody>' +
          d.rows.map(function (x, i) { return '<tr class="click" data-k="' + (x.type === 'Bill' ? 'bills' : 'payments') + '" data-id="' + esc(x.ref) + '" style="animation-delay:' + Math.min(i, 20) * 18 + 'ms"><td>' + fdate(x.date) + '</td><td>' + badge(x.type === 'Bill' ? 'Bill' : 'Payment') + '</td><td>' + esc(x.ref) + '</td><td>' + esc(x.doc || '') + '</td><td>' + esc(x.note) + '</td><td class="num">' + (x.cr ? inr(x.cr, true) : '') + '</td><td class="num">' + (x.dr ? inr(x.dr, true) : '') + '</td><td class="num"><b>' + inr(x.bal, true) + '</b></td></tr>'; }).join('') +
          '</tbody><tfoot><tr><td colspan="5">Total</td><td class="num">' + inr(d.billed, true) + '</td><td class="num">' + inr(d.paid, true) + '</td><td class="num">' + inr(d.balance, true) + '</td></tr></tfoot></table></div>' : '<div class="empty"><b>No transactions</b>No bills or payments for this vendor yet.</div>');
      $('lt').querySelectorAll('tr[data-id]').forEach(function (tr) { tr.onclick = function () { openDetail(tr.dataset.k, tr.dataset.id); }; });
    }).catch(function (x) { $('lt').innerHTML = '<div class="empty"><b>Could not load</b>' + esc(x.message) + '</div>'; });
  };
  bindCombo($('lv'), function (name) { load(name); });
  $('lprint').onclick = function () { if (data) printLedger(data); else toast('Choose a vendor first.', true); };
  if (vendor) load(vendor);
}
function ageing(v) {
  setTitle('Ageing report', 'Accounts · S_ALR');
  var type = S.ageType || 'payables';
  v.innerHTML = '<div class="lhead"><div class="chips"><button class="chip' + (type === 'payables' ? ' on' : '') + '" data-t="payables">Payables (vendors)</button><button class="chip' + (type === 'receivables' ? ' on' : '') + '" data-t="receivables">Receivables (clients)</button></div><div class="tools"><button class="btn soft" id="aprint">' + icon('print', 16) + 'Print</button></div></div><div class="grid2"><div class="glass panel" id="ab"></div><div class="glass panel" id="as"></div></div><div class="glass" id="at"></div>';
  v.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { S.ageType = b.dataset.t; go({ v: 'ageing' }); }; });
  skeleton($('at'), 6);
  call('getAgeing', S.token, type).then(function (d) {
    var b = d.buckets, tot = b.b30 + b.b60 + b.b90 + b.b90p;
    $('ab').innerHTML = '<h3>Age of outstanding (from ' + (type === 'payables' ? 'bill' : 'invoice') + ' date)</h3>' + [['0-30 days', b.b30], ['31-60 days', b.b60], ['61-90 days', b.b90], ['Over 90 days', b.b90p]].map(function (x, i) { return '<div class="hbar"><span>' + x[0] + '</span><div><i style="width:' + (tot ? x[1] / tot * 100 : 0) + '%;animation-delay:' + i * 80 + 'ms"></i></div><b>' + inrShort(x[1]) + '</b></div>'; }).join('');
    var od = d.rows.reduce(function (s, r) { return s + r.overdue; }, 0);
    $('as').innerHTML = '<h3>Summary</h3><div class="kv"><div><span>Total outstanding</span><b style="font-family:Sora;font-size:20px">' + inr(tot) + '</b></div><div><span>Past due date</span><b style="color:var(--bad)">' + inr(od) + '</b></div><div><span>' + (type === 'payables' ? 'Vendors' : 'Clients') + '</span><b>' + d.rows.length + '</b></div></div>';
    $('at').innerHTML = d.rows.length ? '<div class="tablewrap"><table class="tb"><thead><tr><th>' + (type === 'payables' ? 'Vendor' : 'Client') + '</th><th class="num">0-30</th><th class="num">31-60</th><th class="num">61-90</th><th class="num">90+</th><th class="num">Overdue</th><th class="num">Total</th></tr></thead><tbody>' +
      d.rows.map(function (r, i) { return '<tr' + (type === 'payables' ? ' class="click" data-v="' + esc(r.party) + '"' : '') + ' style="animation-delay:' + Math.min(i, 20) * 18 + 'ms"><td><b>' + esc(r.party) + '</b></td><td class="num">' + inr(r.b30, true) + '</td><td class="num">' + inr(r.b60, true) + '</td><td class="num">' + inr(r.b90, true) + '</td><td class="num">' + inr(r.b90p, true) + '</td><td class="num" style="color:var(--bad)">' + inr(r.overdue, true) + '</td><td class="num"><b>' + inr(r.total, true) + '</b></td></tr>'; }).join('') +
      '</tbody><tfoot><tr><td>Total</td><td class="num">' + inr(b.b30, true) + '</td><td class="num">' + inr(b.b60, true) + '</td><td class="num">' + inr(b.b90, true) + '</td><td class="num">' + inr(b.b90p, true) + '</td><td class="num">' + inr(od, true) + '</td><td class="num">' + inr(tot, true) + '</td></tr></tfoot></table></div>' : '<div class="empty"><b>Nothing outstanding</b>All ' + (type === 'payables' ? 'vendor bills are paid' : 'client invoices are received') + '.</div>';
    $('at').querySelectorAll('tr[data-v]').forEach(function (tr) { tr.onclick = function () { go({ v: 'ledger', vendor: tr.dataset.v }); }; });
    $('aprint').onclick = function () { printAgeing(d, type); };
  }).catch(function (x) { $('at').innerHTML = '<div class="empty"><b>Could not load</b>' + esc(x.message) + '</div>'; });
}

/* =====================================================================
   ORGANISATION CHART (reporting channel)
   ===================================================================== */
function orgChart(v) {
  setTitle('Organisation chart', 'Administration · reporting channel');
  var users = S.opts.users || [], byName = {}, kids = {};
  users.forEach(function (u) { byName[u.v] = u; });
  users.forEach(function (u) { var p = u.rt && byName[u.rt] ? u.rt : ''; (kids[p] = kids[p] || []).push(u); });
  var rank = function (u) { var n = String(u.v).toLowerCase(); return /karthi/.test(n) ? 0 : /devi/.test(n) ? 1 : 2; };
  var top = users.filter(function (u) { return rank(u) < 2 || !(u.rt && byName[u.rt]); }).sort(function (a, b) { return rank(a) - rank(b) || String(a.v).localeCompare(String(b.v)); });
  var onTop = {}; top.forEach(function (u) { onTop[u.v] = 1; });
  var count = function (n) { var c = 0; (kids[n] || []).forEach(function (k) { c += 1 + count(k.v); }); return c; };
  var card = function (u, big) {
    var n = (kids[u.v] || []).filter(function (k) { return !onTop[k.v]; }).length;
    return '<div class="oc' + (big ? ' big' : '') + '" data-n="' + esc(u.v) + '"><span class="oc-av" style="background:' + nameCol(u.v) + '">' + esc(initials(u.v)) + '</span><div class="oc-tx"><b>' + esc(u.v) + '</b><small>' + esc(u.des || u.role || '') + '</small>' + (u.dept ? '<em>' + esc(u.dept) + '</em>' : '') + '</div>' +
      (n ? '<button class="oc-n" data-open="' + esc(u.v) + '" title="Show team">' + n + ' ' + icon('users', 13) + '</button>' : '') + '</div>';
  };
  var team = function (mgr, depth) {
    var list = (kids[mgr] || []).filter(function (k) { return !onTop[k.v]; }).sort(function (a, b) { return count(b.v) - count(a.v) || String(a.v).localeCompare(String(b.v)); });
    if (!list.length) return '';
    return '<section class="og-team" data-mgr="' + esc(mgr) + '" style="--d:' + depth + '"><h4><span>Reports to</span> ' + esc(mgr) + ' <i>' + list.length + '</i></h4><div class="og-grid">' + list.map(function (u) { return card(u); }).join('') + '</div>' +
      list.map(function (u) { return team(u.v, depth + 1); }).join('') + '</section>';
  };
  v.innerHTML = '<div class="lhero"><span class="lh-ic">' + icon('org', 24) + '</span><div class="lh-tx"><h2>Organisation</h2><p><b>' + users.length + '</b> people · approvals follow this reporting line</p></div>' + (S.sess.user.admin ? '<button class="btn soft sm" id="toUsers" style="background:rgba(255,255,255,.2)!important;color:#fff!important">' + icon('users', 15) + 'Edit</button>' : '') + '</div>' +
    (users.length ? '<div class="og"><div class="og-top">' + top.map(function (u) { return card(u, true); }).join('') + '</div><div class="og-line"></div>' + top.map(function (u) { return team(u.v, 0); }).join('') + '</div>' : '<div class="glass empty"><b>No users yet</b>Add users and set Reports To.</div>');
  v.querySelectorAll('.og-team').forEach(function (t) { if (+t.style.getPropertyValue('--d') > 0) t.classList.add('shut'); });
  v.querySelectorAll('.oc-n').forEach(function (b) { b.onclick = function (ev) { ev.stopPropagation(); var t = v.querySelector('.og-team[data-mgr="' + b.dataset.open.replace(/"/g, '\\"') + '"]'); if (t) { t.classList.toggle('shut'); if (!t.classList.contains('shut')) t.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } }; });
  v.querySelectorAll('.oc').forEach(function (n) { n.onclick = function () { if (!ent('users')) return; var u = (S.cache.users || []).filter(function (x) { return x.name === n.dataset.n; })[0]; if (u) openDetail('users', u.id); else call('listRecords', S.token, 'users').then(function (r) { S.cache.users = r.rows; var x = r.rows.filter(function (z) { return z.name === n.dataset.n; })[0]; if (x) openDetail('users', x.id); }).catch(fail); }; });
  if ($('toUsers')) $('toUsers').onclick = function () { go({ v: 'list', k: 'users' }); };
}


/* =====================================================================
   ERP HEALTH - Data Quality & Integrity Monitor (Super Admin)
   ===================================================================== */
function scoreColor(n) { return n >= 90 ? 'var(--teal)' : n >= 70 ? '#F5A524' : 'var(--bad)'; }
function healthPage(v, fresh) {
  setTitle('ERP Health', 'System · Data Quality & Integrity Monitor');
  if (!S.sess.user.admin) { v.innerHTML = '<div class="empty"><b>Super Admin only</b></div>'; return; }
  skeleton(v, 8);
  call('getHealth', S.token, !!fresh).then(function (h) { drawHealth(v, h); }).catch(function (x) { v.innerHTML = '<div class="empty"><b>Could not run checks</b>' + esc(x.message) + '</div>'; });
}
function drawHealth(v, h) {
  if (S.route.v !== 'health') return;
  var b = $('hsBadge'); if (b) b.textContent = h.score;
  var bad = h.checks.filter(function (c) { return c.count; }), good = h.checks.filter(function (c) { return !c.count; });
  var order = { Critical: 0, High: 1, Medium: 2, Low: 3 }; bad.sort(function (a, b) { return order[a.sev] - order[b.sev] || b.count - a.count; });
  var tr = h.trend || [], mx = 100;
  v.innerHTML = '<div class="grid2"><div class="glass panel" style="display:flex;gap:24px;align-items:center;flex-wrap:wrap"><div class="gauge" id="gauge" style="--gc:' + scoreColor(h.score) + '"><div><b data-n="' + h.score + '">0</b><small>/ 100</small></div></div>' +
    '<div style="flex:1;min-width:230px"><div class="hsum">' + esc(h.summary || '') + '</div><div class="chips" style="margin-top:12px">' + ['Critical', 'High', 'Medium', 'Low'].map(function (k) { return '<span class="chip" style="cursor:default"><span class="sv ' + k + '" style="padding:2px 8px">' + k + '</span><b>' + h.counts[k] + '</b></span>'; }).join('') + '</div>' +
    '<p class="note" style="margin-top:10px">Checked ' + esc(h.at) + (h.by ? ' by ' + esc(h.by) : '') + ' · ' + h.checks.length + ' validations · ' + h.ms + ' ms · ' + h.links.checked + '/' + h.links.total + ' document links verified on Drive this run</p>' +
    '<div class="acts" style="margin-top:10px"><button class="btn primary" id="hRun">' + icon('pulse', 16) + 'Run checks now</button></div></div></div>' +
    '<div class="glass panel"><h3>How the score is calculated</h3><p class="note">' + esc(h.formula) + ' The score uses only the real findings below — nothing is estimated.</p>' +
    (tr.length > 1 ? '<h3 style="margin-top:14px">Last ' + tr.length + ' runs</h3><div class="spark">' + tr.map(function (t, i) { return '<i title="' + esc(t.at + ' · ' + t.score) + '" style="height:' + Math.max(4, t.score / mx * 100) + '%;animation-delay:' + i * 40 + 'ms;background:' + scoreColor(t.score) + '"></i>'; }).join('') + '</div>' : '<p class="note" style="margin-top:12px">Runs automatically every day at 7 AM. Super Admins get an email if a critical issue appears or the score drops.</p>') + '</div></div>' +
    '<div class="glass panel"><h3>Issues found <span class="badge ' + (bad.length ? 'b-bad' : 'b-ok') + '">' + bad.length + '</span></h3>' + (bad.length ? bad.map(hcRow).join('') : '<div class="empty"><b>Excellent — every check passed</b>Your ERP data is consistent.</div>') + '</div>' +
    '<div class="glass panel"><h3>Passed checks <span class="badge b-ok">' + good.length + '</span></h3>' + good.map(function (c) { return '<div class="hc"><span class="sv ok">PASS</span><div class="t"><b>' + esc(c.title) + '</b><p>' + esc(c.hint) + '</p></div></div>'; }).join('') + '</div>';
  countUp(v.querySelector('.gauge b'));
  var g = $('gauge'), t0 = null; (function anim(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / 900); g.style.setProperty('--v', Math.round(h.score * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(anim); })(performance.now());
  $('hRun').onclick = function () { busy(this, true, 'Checking'); healthPage(v, true); };
  v.querySelectorAll('[data-hk]').forEach(function (li) { li.onclick = function () { if (ent(li.dataset.hk) && li.dataset.id) openDetail(li.dataset.hk, li.dataset.id); }; });
  v.querySelectorAll('[data-fix]').forEach(function (b) {
    b.onclick = function () {
      var id = b.dataset.fix;
      modal('<h3>Apply safe fix?</h3><p>' + esc(b.dataset.t) + '</p><p class="note">This only recalculates figures from the source records (or signs out stale sessions). Nothing is deleted and the change is written to the Audit Log.</p><div class="mfoot"><button class="btn soft" data-close>Cancel</button><button class="btn primary" id="fixGo">Fix now</button></div>');
      $('fixGo').onclick = function () { var x = this; busy(x, true, 'Fixing'); call('fixHealth', S.token, id).then(function (h2) { closeModal(); toast('Fixed ' + h2.fixed.n + ' record(s). Score ' + h2.score + '/100'); drawHealth(v, h2); }).catch(function (z) { busy(x, false); fail(z); }); };
    };
  });
}
function hcRow(c) {
  return '<div class="hc"><span class="sv ' + c.sev + '">' + c.sev.toUpperCase() + '</span><div class="t"><b>' + esc(c.title) + '</b><p>' + esc(c.hint) + ' <span class="note">(−' + c.penalty + ' points)</span></p><ul>' +
    c.items.map(function (i) { return '<li data-hk="' + esc(i.key) + '" data-id="' + esc(i.id) + '">' + esc(i.text) + '</li>'; }).join('') + (c.count > c.items.length ? '<li>… and ' + (c.count - c.items.length) + ' more</li>' : '') + '</ul>' +
    (c.fix ? '<button class="btn soft sm" style="margin-top:8px" data-fix="' + c.fix + '" data-t="' + esc(c.title) + '">' + icon('bolt', 14) + 'Fix safely</button>' : '') + '</div><span class="n" style="color:' + (c.sev === 'Critical' ? 'var(--bad)' : c.sev === 'High' ? '#A35A00' : 'var(--navy)') + '">' + c.count + '</span></div>';
}

/* =====================================================================
   SYSTEM ADMINISTRATION & DIAGNOSTICS (Super Admin)
   Shows status only - never passwords, OTPs, PIN hashes or secret keys.
   ===================================================================== */
function sysPage(v) {
  setTitle('System admin', 'System · health & diagnostics');
  if (!S.sess.user.admin) { v.innerHTML = '<div class="empty"><b>Super Admin only</b></div>'; return; }
  skeleton(v, 10);
  call('getSystemStatus', S.token).then(function (d) { drawSys(v, d); }).catch(function (x) { v.innerHTML = '<div class="empty"><b>Could not load</b>' + esc(x.message) + '</div>'; });
}
function drawSys(v, d) {
  if (S.route.v !== 'sys') return;
  var dot = function (ok) { return '<span class="dot ' + (ok === true ? 'g' : ok === false ? 'r' : 'a') + '"></span>'; };
  var J = d.jobs, jobName = { dailyDigest: 'Daily digest', dailyReminders: 'Reminder emails', dailyHealth: 'Data quality check', nightlyBackup: 'Nightly backup' };
  var bk = d.backup.last, bv = d.backup.verify;
  var sheetBad = d.sheets.filter(function (x) { return !x.ok; }), cached = d.cache.filter(function (x) { return x.cached; }).length;
  var tile = function (title, ic, body) { return '<div class="glass stile"><h4>' + icon(ic, 16) + esc(title) + '</h4>' + body + '</div>'; };
  var html = '<div class="lhead"><p>' + dot(true) + 'Version ' + esc(d.app.version) + ' · ' + esc(d.app.now) + ' · ' + esc(d.app.tz) + (d.health ? ' · ERP Health <b style="color:' + scoreColor(d.health.score) + '">' + d.health.score + '/100</b>' : '') + '</p><div class="tools"><button class="btn soft" id="sysRe">' + icon('pulse', 16) + 'Refresh</button></div></div>';
  html += '<div class="sysgrid">' +
    tile('Backup', 'shield', '<div class="big">' + dot(bv ? bv.ok : null) + (bk ? esc(bk.at) : 'No backup yet') + '</div><p class="note">' + (bk ? esc(bk.name) : 'Runs every night at ' + J.nightlyBackup_hour + ':00') + '</p><p class="note"><b>Verification:</b> ' + (bv ? esc(bv.at) + ' — ' + esc(bv.msg) : 'not done yet') + '</p><p class="note">Keeps the latest ' + d.backup.keep + ' copies' + (d.backup.folderUrl ? ' · <a href="' + esc(d.backup.folderUrl) + '" target="_blank" rel="noopener">open backup folder</a>' : '') + '</p><div class="acts"><button class="btn primary sm" data-sa="backup">Back up now</button></div>') +
    tile('Scheduled jobs', 'clock', '<table class="mt">' + Object.keys(jobName).map(function (k) { var j = J[k]; return '<tr><td>' + dot(j ? j.ok : null) + esc(jobName[k]) + '<div class="note">daily ' + J[k + '_hour'] + ':00</div></td><td>' + (j ? esc(j.at) + '<div class="note">' + esc(j.msg) + ' · ' + j.ms + ' ms</div>' : '<span class="note">not run yet</span>') + '</td></tr>'; }).join('') + '</table><div class="acts"><button class="btn soft sm" data-sa="digest">Send digest now</button><button class="btn soft sm" data-sa="health">Run health now</button></div>') +
    tile('Email notifications', 'mail', '<div class="big">' + dot(d.mail.failed7 ? false : true) + d.mail.failed7 + ' failed · ' + d.mail.sent7 + ' sent <small class="note">(7 days)</small></div><p class="note">Quota left today: <b>' + d.mail.quota + '</b></p>' + (d.mail.failed.length ? '<table class="mt"><tr><th>Time</th><th>To / subject</th><th>Error</th></tr>' + d.mail.failed.slice(0, 8).map(function (f) { return '<tr><td>' + esc(f.at) + '</td><td>' + esc(f.to) + '<div class="note">' + esc(f.subject) + '</div></td><td>' + esc(f.error) + '</td></tr>'; }).join('') + '</table>' : '<p class="note">No failed emails.</p>') + '<div class="acts"><button class="btn soft sm" id="remPv">Preview tonight\'s reminders</button></div>') +
    tile('Triggers', 'bolt', '<div class="big">' + dot(!d.triggers.missing.length) + (d.triggers.missing.length ? d.triggers.missing.length + ' missing' : 'All installed') + '</div>' + (d.triggers.missing.length ? '<p class="note">Missing: ' + d.triggers.missing.map(esc).join(', ') + '</p>' : '') + '<p class="note">' + d.triggers.list.map(function (t) { return esc(t.fn); }).join(' · ') + '</p><div class="acts"><button class="btn soft sm" data-sa="triggers">Reinstall triggers</button></div>') +
    tile('Execution errors', 'warn', '<div class="big">' + dot(!d.errors.count7) + d.errors.count7 + ' in 7 days</div>' + (d.errors.rows.length ? '<table class="mt">' + d.errors.rows.slice(0, 8).map(function (r) { return '<tr><td>' + esc(r.at) + '<div class="note">' + esc(r.where) + (r.user ? ' · ' + esc(r.user) : '') + '</div></td><td>' + esc(r.error) + '</td></tr>'; }).join('') + '</table>' : '<p class="note">No system errors. (Normal validation messages are not counted.)</p>') + '<p class="note"><a href="' + esc(d.app.executions) + '" target="_blank" rel="noopener">Open Apps Script executions</a></p>') +
    tile('Sheet structure', 'stack', '<div class="big">' + dot(!sheetBad.length) + (d.sheets.length - sheetBad.length) + ' / ' + d.sheets.length + ' sheets valid</div>' + (sheetBad.length ? '<table class="mt">' + sheetBad.map(function (x) { return '<tr><td><b>' + esc(x.sheet) + '</b></td><td>' + (x.missing.length ? 'Missing: ' + x.missing.map(esc).join(', ') : '') + (x.dup.length ? ' Duplicate: ' + x.dup.map(esc).join(', ') : '') + '</td></tr>'; }).join('') + '</table>' : '') + (d.sheets.some(function (x) { return x.extra.length; }) ? '<p class="note">Extra columns (kept, ignored): ' + d.sheets.filter(function (x) { return x.extra.length; }).map(function (x) { return esc(x.sheet) + ' (' + x.extra.map(esc).join(', ') + ')'; }).join('; ') + '</p>' : '') + '<div class="acts"><button class="btn soft sm" data-sa="repair">Repair structure</button></div>') +
    tile('Cache', 'server', '<div class="big">' + dot(true) + cached + ' / ' + d.cache.length + ' sheets cached</div><p class="note">Data is cached for speed and refreshed automatically on every change.</p><div class="acts"><button class="btn soft sm" data-sa="cache">Clear cache</button></div>') +
    tile('Setup verification', 'check', (d.setup ? '<div class="big">' + dot(!d.setup.failed.length) + d.setup.passed + ' / ' + d.setup.total + ' passed</div><p class="note">Last verified ' + esc(d.setup.at) + '</p>' + (d.setup.failed.length ? '<ul class="note" style="padding-left:18px">' + d.setup.failed.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' : '') : '<p class="note">Not verified yet.</p>') + '<div class="acts"><button class="btn soft sm" data-sa="verify">Verify setup now</button></div>') +
    tile('Security', 'lock', '<p class="note">PINs set: <b>' + d.security.pinsSet + '</b> · PIN sheet hidden: <b>' + (d.security.pinSheetHidden ? 'Yes' : 'No') + '</b> · OTP valid ' + d.security.otpMinutes + ' min · session ' + d.security.sessionHours + ' h</p><p class="note">Signed in now: ' + (d.security.sessions.length ? d.security.sessions.map(function (x) { return '<span class="pchip">' + esc(x.name) + (x.count > 1 ? ' ×' + x.count : '') + '</span>'; }).join('') : 'none') + '</p><p class="note" style="color:#0E8F7B"><b>' + icon('shield', 13) + ' This page never shows passwords, OTPs, PIN hashes or secret keys.</b></p>') +
    '</div>';
  html += '<div class="glass panel"><h3>Configuration warnings <span class="badge ' + (d.config.length ? 'b-warn' : 'b-ok') + '">' + d.config.length + '</span></h3>' + (d.config.length ? d.config.map(function (w) { return '<div class="hc"><span class="sv ' + w.sev + '">' + w.sev.toUpperCase() + '</span><div class="t"><b style="font-weight:600">' + esc(w.t) + '</b></div>' + (w.go && ent(w.go) ? '<button class="btn soft sm" data-gol="' + w.go + '">Open</button>' : '') + '</div>'; }).join('') : '<div class="empty"><b>No configuration problems</b></div>') + '</div>';
  v.innerHTML = html;
  $('sysRe').onclick = function () { sysPage(v); };
  v.querySelectorAll('[data-gol]').forEach(function (b) { b.onclick = function () { go({ v: 'list', k: b.dataset.gol }); }; });
  v.querySelectorAll('[data-sa]').forEach(function (b) { b.onclick = function () { busy(b, true, ''); call('systemAction', S.token, b.dataset.sa).then(function (m) { toast(m, /FAILED/.test(m)); sysPage(v); }).catch(function (x) { busy(b, false); fail(x); }); }; });
  $('remPv').onclick = function () {
    var b = this; busy(b, true, '');
    call('reminderPreview', S.token).then(function (plan) {
      busy(b, false);
      modal('<h3>Reminder emails (' + plan.length + ' people)</h3><p class="note">These go out automatically at 6 PM on working days. Nothing is sent from this preview.</p><div style="max-height:52vh;overflow:auto">' + (plan.length ? plan.map(function (p) { return '<div class="hc"><div class="t"><b>' + esc(p.name) + '</b> <small class="note">' + esc(p.email || 'no email - cannot send') + '</small><ul>' + p.items.map(function (i) { return '<li><b>' + esc(i.s) + ':</b> ' + esc(i.t) + '</li>'; }).join('') + '</ul></div></div>'; }).join('') : '<div class="empty"><b>No reminders needed</b>Everyone is up to date.</div>') + '</div><div class="mfoot"><button class="btn soft" data-close>Close</button>' + (plan.length ? '<button class="btn primary" id="remGo">Send these now</button>' : '') + '</div>');
      if ($('remGo')) $('remGo').onclick = function () { var x = this; busy(x, true, 'Sending'); call('sendRemindersNow', S.token).then(function (m) { closeModal(); toast(m); }).catch(function (z) { busy(x, false); fail(z); }); };
    }).catch(function (x) { busy(b, false); fail(x); });
  };
}

/* =====================================================================
   PRINTING (letterhead loaded on demand + watermark)
   ===================================================================== */
function words(n) {
  n = Math.round(num(n) * 100) / 100;
  var a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  var b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function two(x) { return x < 20 ? a[x] : b[Math.floor(x / 10)] + (x % 10 ? ' ' + a[x % 10] : ''); }
  function three(x) { var h = Math.floor(x / 100), r = x % 100; return (h ? a[h] + ' Hundred' + (r ? ' and ' : '') : '') + (r ? two(r) : ''); }
  var rupees = Math.floor(n), paise = Math.round((n - rupees) * 100);
  if (!rupees && !paise) return 'Zero Only';
  var parts = [], cr = Math.floor(rupees / 1e7), lk = Math.floor(rupees / 1e5) % 100, th = Math.floor(rupees / 1e3) % 100, rest = rupees % 1000;
  if (cr) parts.push(three(cr) + ' Crore'); if (lk) parts.push(two(lk) + ' Lakh'); if (th) parts.push(two(th) + ' Thousand'); if (rest) parts.push(three(rest));
  return (parts.join(' ') || 'Zero') + (paise ? ' and ' + two(paise) + ' Paise' : '') + ' Only';
}
function nl(s) { return esc(s).replace(/\n/g, '<br>'); }
function letterhead() {
  if (S.lh) return Promise.resolve(S.lh);
  try { var c = JSON.parse(store.get('pe_lh') || 'null'); if (c && c.head) { S.lh = c; return Promise.resolve(c); } } catch (e) { }
  return call('getLetterhead', S.token).then(function (lh) { S.lh = lh; store.set('pe_lh', JSON.stringify(lh)); return lh; });
}
function sheet(lh, body, opt) {
  opt = opt || {};
  var co = S.sess.config.companies[0], land = !!opt.landscape, wm = S.sess.config.watermark;
  var logo = window.LOGO_FULL ? '<img src="' + window.LOGO_FULL + '" style="height:17mm;width:auto;display:block">' : '';
  var head = lh.head ? '<img src="' + lh.head + '" style="display:block;margin:0 auto;' + (land ? 'height:30mm' : 'width:100%') + '">' :
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:8mm;padding:7mm ' + (land ? 12 : 18) + 'mm 3mm;border-bottom:2.2pt solid #00175F;position:relative">' + logo +
    '<div style="text-align:right;font:8.5pt Arial;color:#333;line-height:1.45"><div style="font:800 13pt Arial;color:#00175F;letter-spacing:.4px">' + esc(co.name.toUpperCase()) + '</div>' + esc(co.address || '') + (co.gstin ? '<br>GSTIN: ' + esc(co.gstin) : '') + (co.phone || co.email ? '<br>' + esc([co.phone ? 'Ph: ' + co.phone : '', co.email || '', co.web || ''].filter(String).join(' · ')) : '') + '</div>' +
    '<i style="position:absolute;left:' + (land ? 12 : 18) + 'mm;bottom:-2.2pt;width:38mm;height:2.2pt;background:#F0006C"></i></div>';
  var foot = lh.foot ? '<img src="' + lh.foot + '" style="display:block;margin:0 auto;' + (land ? 'height:15mm' : 'width:100%') + '">' : '<div style="text-align:center;font:8.5pt Arial;padding:4mm 0;border-top:1px solid #00249C">' + esc(co.address) + '</div>';
  var hh = land ? 34 : 38, fh = land ? 18 : 21;
  return '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(opt.title || 'Print') + '</title><style>' +
    '@page{size:A4 ' + (land ? 'landscape' : 'portrait') + ';margin:0}*{box-sizing:border-box}body{margin:0;font:10.5pt Arial,Helvetica,sans-serif;color:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    '.hd{position:fixed;top:0;left:0;right:0;z-index:2}.ft{position:fixed;bottom:0;left:0;right:0;z-index:2}' +
    '.wm{position:fixed;left:0;right:0;top:50%;text-align:center;transform:translateY(-50%) rotate(-32deg);font:800 96pt Arial,sans-serif;color:rgba(27,47,158,.075);letter-spacing:6px;z-index:0;pointer-events:none;white-space:nowrap}' +
    '.wm2{position:fixed;right:10mm;bottom:' + (fh + 2) + 'mm;font:700 7pt Arial;color:rgba(27,47,158,.45);z-index:2}' +
    'table.pg{width:100%;border-collapse:collapse;position:relative;z-index:1}table.pg>thead td{height:' + hh + 'mm}table.pg>tfoot td{height:' + fh + 'mm}.c{padding:0 ' + (land ? 12 : 18) + 'mm}' +
    'table.t{width:100%;border-collapse:collapse;margin:6px 0}table.t th,table.t td{border:1px solid #000;padding:5px 6px;vertical-align:top}table.t th{font-weight:bold;text-align:center;background:rgba(242,244,250,.9)}' +
    '.r{text-align:right}.ct{text-align:center}.b{font-weight:bold}.u{text-decoration:underline}h4{margin:12px 0 4px;font-size:10.5pt}p{margin:4px 0}.pb{page-break-before:always}.win{background:#E3F7EF;font-weight:bold}' +
    'tr{page-break-inside:avoid}' + (window.PE_PRINT_CSS || '') + '</style></head><body><div class="hd">' + head + '</div><div class="ft">' + foot + '</div>' + (wm ? '<div class="wm">' + esc(wm) + '</div><div class="wm2">' + esc(wm) + ' · printed ' + fdate(today()) + ' by ' + esc(S.sess.user.name) + ' · © 2026 Port Energy Private Limited</div>' : '') +
    '<table class="pg"><thead><tr><td></td></tr></thead><tfoot><tr><td></td></tr></tfoot><tbody><tr><td><div class="c">' + body + '</div></td></tr></tbody></table></body></html>';
}
/* keep a document on ONE A4 page when it only just overflows; real long documents still flow to page 2 with the letterhead repeated */
function fitOnePage(f, opt) {
  try {
    var land = !!(opt && opt.landscape), d = f.contentWindow.document, c = d.querySelector('.c'); if (!c) return;
    f.style.width = land ? '297mm' : '210mm';
    var mm = 96 / 25.4, avail = ((land ? 210 : 297) - (land ? 34 : 38) - (land ? 18 : 21) - 14) * mm;
    var pbs = Array.prototype.slice.call(d.querySelectorAll('.pb'));
    pbs.forEach(function (x) { x.classList.remove('pb'); x.classList.add('pb-off'); });
    c.style.zoom = ''; var h = c.scrollHeight;
    if (h <= avail) return;
    if (h < avail * 1.45) { c.style.zoom = Math.max(.7, (avail / h) * .985).toFixed(3); return; }
    pbs.forEach(function (x) { x.classList.add('pb'); x.classList.remove('pb-off'); });
  } catch (x) { }
}
function printHtml(body, opt) {
  toast('Preparing print…');
  letterhead().catch(function () { return { head: '', foot: '' }; }).then(function (lh) {
    var html = sheet(lh, body, opt);
    var old = document.querySelector('iframe.pf'); if (old) old.remove();
    var f = document.createElement('iframe'); f.className = 'pf'; document.body.appendChild(f);
    var d = f.contentWindow.document; d.open(); d.write(html); d.close();
    var go2 = function () { fitOnePage(f, opt); if (window.__peCapture) { var cb = window.__peCapture; window.__peCapture = null; return cb(f); } try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { toast('Printing is blocked here. Allow pop-ups or use Export.', true); } };
    var imgs = d.images, left = imgs.length; if (!left) return setTimeout(go2, 150);
    var once = function () { if (--left <= 0) setTimeout(go2, 150); };
    Array.prototype.forEach.call(imgs, function (i) { if (i.complete) once(); else { i.onload = once; i.onerror = once; } });
    setTimeout(function () { if (left > 0) { left = 0; go2(); } }, 4000);
  });
}
function printRecord(e, r, x) { if (window.PE_PRINT && window.PE_PRINT(e, r, x || {})) return; if (e.key === 'po') return printPO(r, x || {}); if (e.key === 'quotes') return printQuotes(r); if (e.key === 'approvals') return printIOA(r); if (e.key === 'notices') return printCircular(r); if (e.key === 'decisions') return printDecision(r); printGeneric(e, r); }
function printPO(r, x) {
  var v = x.vendor || {}, co = S.sess.config.companies[0];
  var rows = (r.lines || []).map(function (l, i) { var rate = r2(num(l.rate) * (1 - num(l.disc) / 100)); return '<tr><td class="ct">' + (i + 1) + '.</td><td>' + nl(l.item + (l.desc ? ' - ' + l.desc : '')) + '</td><td class="ct">' + esc(l.uom) + '</td><td class="ct">' + esc(l.qty) + '</td><td class="r">' + rate.toFixed(2) + '</td><td class="r">' + num(l.amount).toFixed(2) + '</td></tr>'; }).join('');
  var g = {}; (r.lines || []).forEach(function (l) { var k = String(num(l.gst)); g[k] = (g[k] || 0) + num(l.gstAmt != null ? l.gstAmt : r2(num(l.amount) * num(l.gst) / 100)); });
  var tail = '<tr><td colspan="5" class="r b">Sub-Total in INR</td><td class="r b">' + num(r.subtotal).toFixed(2) + '</td></tr>' +
    Object.keys(g).filter(function (k) { return num(k) > 0; }).map(function (k) { return '<tr><td colspan="5" class="r b">GST@' + k + '%</td><td class="r b">' + r2(g[k]).toFixed(2) + '</td></tr>'; }).join('') +
    (num(r.freight) ? '<tr><td colspan="5" class="r b">Freight</td><td class="r b">' + num(r.freight).toFixed(2) + '</td></tr>' : '') + (num(r.otherCharges) ? '<tr><td colspan="5" class="r b">Other Charges</td><td class="r b">' + num(r.otherCharges).toFixed(2) + '</td></tr>' : '') +
    '<tr><td colspan="5" class="r b">Grand Total in INR</td><td class="r b">' + num(r.total).toFixed(2) + '</td></tr>';
  var addr = String(v.address || '').split(/\n/).map(function (s) { return s.trim().replace(/,$/, ''); }).filter(String);
  var T = [['DELIVERY PERIOD', r.tDelivery], ['TRANSPORTATION & LOGISTIC', r.tTransport], ['PAYMENT TERMS', r.tPayment], ['WARRANTY / GUARANTEE', r.tWarranty], ['INSPECTION / QUALITY ASSURANCE', r.tInspection], ['TEST CERTIFICATE', r.tTestCert], ['TAXES & DUTIES', r.tTaxes]].filter(function (t) { return String(t[1] || '').trim(); });
  T.push(['INVOICING DETAILS', co.billing || co.name]);
  T.push(['CORRESPONDENCE / BILLING ADDRESS', 'Please quote our complete order number in all post order correspondences, invoice and shall be forwarded to ' + String(co.billing || co.name).replace(/\n/g, ' ') + ' to the attention of the undersigned.\nThis order is issued to you in duplicate. You are requested to return one copy duly signed and stamped by you as a token of your acceptance of the same.']);
  T.push(['DELIVERY ADDRESS', (r.deliveryAddress || '') + (r.receiver ? '\nNote: Receiver Contact details: ' + r.receiver : '')]);
  var body = '<p class="ct b u" style="font-size:12pt;margin-top:2mm">PURCHASE ORDER</p><table style="width:100%;margin-top:6mm"><tr><td class="b">Order no: ' + esc(r.id) + '</td><td class="b r">Date: ' + ddot(r.date) + '</td></tr></table>' +
    '<p class="b" style="margin-top:5mm">To,</p><div class="b" style="margin:3mm 0 0 6mm;line-height:1.45">M/s. ' + esc(r.vendor) + '.,<br>' + addr.map(esc).join(',<br>') + (v.gstin ? '<br>GSTIN:' + esc(v.gstin) : '') + '</div>' +
    '<p class="b" style="margin-top:5mm">Dear Sir,</p><p style="margin-top:4mm"><b>Sub</b>: ' + esc(r.subject) + '</p>' + (r.quoteRef ? '<p><b>Ref</b>: ' + esc(r.quoteRef) + '</p>' : '') +
    '<table class="t" style="margin-top:5mm"><thead><tr><th style="width:9%">S.No</th><th>Description</th><th style="width:9%">UoM</th><th style="width:9%">Qty</th><th style="width:13%">Unit Rate in INR</th><th style="width:15%">Total Amount</th></tr></thead><tbody>' + rows + tail + '</tbody></table>' +
    '<table class="t"><tr><td class="b">Rupees: ' + words(r.total) + '.</td></tr></table><p class="b" style="margin-top:6mm">TERMS AND CONDITIONS:</p>' +
    T.map(function (t, i) { return '<h4>' + (i + 1) + '. <span class="u">' + esc(t[0]) + ':</span></h4><p style="margin-left:6mm' + (t[0] === 'INVOICING DETAILS' || t[0] === 'DELIVERY ADDRESS' ? ';font-weight:bold' : '') + '">' + nl(t[1]) + '</p>'; }).join('') +
    '<div style="page-break-inside:avoid"><p class="b" style="margin-top:7mm">Thanking you,</p><p class="b" style="margin-top:4mm">For M/s. ' + esc(co.name.toUpperCase()) + '</p><p class="b" style="margin-top:16mm">Authorized Signatory</p><p class="b" style="margin-top:6mm">For M/s. ' + esc(r.vendor) + '., (All terms and conditions agreed as mutually).</p><p class="b" style="margin-top:14mm">Authorized Signatory with Seal and date.</p></div>';
  printHtml(body, { title: r.id });
}
function printQuotes(r) {
  var vs = [1, 2, 3, 4].filter(function (n) { return r['vendor' + n]; });
  var body = '<p class="ct b u" style="font-size:12pt">QUOTATION COMPARISON STATEMENT</p><table style="width:100%;margin:4mm 0"><tr><td class="b">No: ' + esc(r.id) + '</td><td class="b">Subject: ' + esc(r.subject) + '</td><td class="b r">Date: ' + ddot(r.date) + '</td></tr><tr><td colspan="3">Project: ' + esc(r.project || '-') + (r.prRef ? ' · PR: ' + esc(r.prRef) : '') + '</td></tr></table>' +
    '<table class="t" style="font-size:9pt"><thead><tr><th>S.No</th><th>Description</th><th>Qty</th><th>UoM</th><th>GST</th>' + vs.map(function (n) { return '<th>' + esc(r['vendor' + n]) + '<br><span style="font-weight:normal">Rate</span></th>'; }).join('') + '</tr></thead><tbody>' +
    (r.lines || []).map(function (l, i) { return '<tr><td class="ct">' + (i + 1) + '</td><td>' + esc(l.item) + '</td><td class="ct">' + esc(l.qty) + '</td><td class="ct">' + esc(l.uom) + '</td><td class="ct">' + esc(l.gst) + '%</td>' + vs.map(function (n) { return '<td class="r' + (l.best === 'V' + n ? ' win' : '') + '">' + (l['r' + n] !== '' && l['r' + n] != null ? num(l['r' + n]).toFixed(2) : 'NQ') + '</td>'; }).join('') + '</tr>'; }).join('') +
    '<tr class="b"><td colspan="5" class="r">Total incl. GST</td>' + vs.map(function (n) { return '<td class="r' + (r['vendor' + n] === r.l1Vendor ? ' win' : '') + '">' + num(r['tot' + n]).toFixed(2) + '</td>'; }).join('') + '</tr>' +
    '<tr class="b"><td colspan="5" class="r">Ranking</td>' + (function () { var arr = vs.map(function (n) { return { n: n, t: num(r['tot' + n]) }; }).filter(function (x) { return x.t > 0; }).sort(function (a, b) { return a.t - b.t; }); return vs.map(function (n) { var k = arr.map(function (x) { return x.n; }).indexOf(n); return '<td class="ct">' + (k > -1 ? 'L' + (k + 1) : '-') + '</td>'; }).join(''); })() + '</tr></tbody></table>' +
    '<p class="b" style="margin-top:4mm">Recommended vendor (L1): ' + esc(r.l1Vendor || '-') + (r.l1Total ? ' · ₹ ' + inr(r.l1Total, true) + ' (' + words(r.l1Total) + ')' : '') + '</p>' + (num(r.saving) ? '<p>Saving against L2: ₹ ' + inr(r.saving, true) + '</p>' : '') + (r.remarks ? '<p>Remarks: ' + nl(r.remarks) + '</p>' : '') +
    '<p style="font-size:8.5pt;color:#444">NQ = not quoted. L1 is decided only among vendors who quoted every item. Highlighted = lowest rate per item.</p>' +
    '<table style="width:100%;margin-top:18mm"><tr><td class="b">Prepared by</td><td class="b ct">Checked by</td><td class="b r">Approved by</td></tr></table>';
  printHtml(body, { title: r.id, landscape: vs.length > 2 });
}
function printLedger(d) {
  var body = '<p class="ct b u" style="font-size:12pt">VENDOR LEDGER STATEMENT</p><p class="b">Vendor: ' + esc(d.vendor) + '</p><p>As on ' + ddot(today()) + '</p>' +
    '<table class="t" style="font-size:9pt"><thead><tr><th>Date</th><th>Type</th><th>Ref</th><th>Doc / UTR</th><th>Note</th><th>Bill (Cr)</th><th>Paid (Dr)</th><th>Balance</th></tr></thead><tbody>' +
    d.rows.map(function (x) { return '<tr><td>' + ddot(x.date) + '</td><td>' + x.type + '</td><td>' + esc(x.ref) + '</td><td>' + esc(x.doc || '') + '</td><td>' + esc(x.note) + '</td><td class="r">' + (x.cr ? inr(x.cr, true) : '') + '</td><td class="r">' + (x.dr ? inr(x.dr, true) : '') + '</td><td class="r b">' + inr(x.bal, true) + '</td></tr>'; }).join('') +
    '<tr class="b"><td colspan="5" class="r">Total</td><td class="r">' + inr(d.billed, true) + '</td><td class="r">' + inr(d.paid, true) + '</td><td class="r">' + inr(d.balance, true) + '</td></tr></tbody></table>' +
    '<p class="b">Balance payable: ₹ ' + inr(d.balance, true) + ' (' + words(d.balance) + ')</p><table style="width:100%;margin-top:18mm"><tr><td class="b">Prepared by</td><td class="b r">Accounts</td></tr></table>';
  printHtml(body, { title: 'Ledger ' + d.vendor });
}
function printAgeing(d, type) {
  var b = d.buckets;
  var body = '<p class="ct b u" style="font-size:12pt">' + (type === 'payables' ? 'PAYABLES' : 'RECEIVABLES') + ' AGEING REPORT</p><p>As on ' + ddot(today()) + '</p><table class="t" style="font-size:9pt"><thead><tr><th>' + (type === 'payables' ? 'Vendor' : 'Client') + '</th><th>0-30</th><th>31-60</th><th>61-90</th><th>90+</th><th>Overdue</th><th>Total</th></tr></thead><tbody>' +
    d.rows.map(function (r) { return '<tr><td>' + esc(r.party) + '</td><td class="r">' + inr(r.b30, true) + '</td><td class="r">' + inr(r.b60, true) + '</td><td class="r">' + inr(r.b90, true) + '</td><td class="r">' + inr(r.b90p, true) + '</td><td class="r">' + inr(r.overdue, true) + '</td><td class="r b">' + inr(r.total, true) + '</td></tr>'; }).join('') +
    '<tr class="b"><td>Total</td><td class="r">' + inr(b.b30, true) + '</td><td class="r">' + inr(b.b60, true) + '</td><td class="r">' + inr(b.b90, true) + '</td><td class="r">' + inr(b.b90p, true) + '</td><td class="r">' + inr(d.rows.reduce(function (s, r) { return s + r.overdue; }, 0), true) + '</td><td class="r">' + inr(b.b30 + b.b60 + b.b90 + b.b90p, true) + '</td></tr></tbody></table>';
  printHtml(body, { title: 'Ageing' });
}

function userDes(n) { var u = findOpt('users', n); return u ? (u.des || '') : ''; }
function printIOA(r) {
  var route = r.route || [], fin = route.filter(function (x) { return x.role === 'Final Approver'; })[0] || {};
  var appr = r.status === 'Approved';
  var col = function (lbl, t, n, d, g) { return '<td style="width:50%;vertical-align:top;padding-right:8mm"><p class="b" style="margin-bottom:3mm">' + lbl + '</p><p>' + esc(t || 'Mr.') + ' ' + esc(n) + '</p><p>Dept: ' + esc(d || '-') + '</p><p>Desgn: ' + esc(g || '-') + '</p></td>'; };
  var body = '<p class="ct b u" style="font-size:13pt;margin-top:3mm;letter-spacing:.3px">INTER-OFFICE COMMUNICATION APPROVAL NOTE</p>' +
    '<table style="width:100%;margin-top:5mm"><tr><td class="b">DATE: ' + ddot(r.date) + '</td><td class="b r">Ref: ' + esc(r.id) + '</td></tr></table>' +
    '<table style="width:100%;margin-top:7mm"><tr>' + col('FROM', r.fromTitle, r.fromName, r.department, r.fromDesg) + col('TO', r.toTitle, r.toName, r.toDept, r.toDesg) + '</tr></table>' +
    '<p style="margin-top:9mm">' + esc(r.salutation || 'Dear Sir,') + '</p>' +
    '<p style="margin-top:4mm"><b>Subject of Approval:</b> ' + esc(r.subject) + '</p>' +
    '<div style="margin-top:4mm;line-height:1.6;min-height:60mm;text-align:justify">' + nl(r.body) + '</div>' +
    (num(r.amount) ? '<p style="margin-top:4mm"><b>Amount:</b> ₹ ' + inr(r.amount, true) + ' (Rupees ' + words(r.amount) + ')</p>' : '') +
    (r.project ? '<p><b>Project / Site:</b> ' + esc(r.project) + '</p>' : '') + ((r.files || []).length ? '<p><b>Enclosures:</b> ' + r.files.length + ' attachment(s)</p>' : '') +
    '<table style="width:100%;margin-top:22mm;page-break-inside:avoid"><tr><td style="width:50%;vertical-align:bottom"><p style="font-size:9pt;color:#0E6B5C">Submitted digitally ' + esc(r.createdAt || '') + '</p><p class="b" style="border-top:1px solid #000;display:inline-block;padding-top:2mm;min-width:60mm">' + esc(r.fromName) + '</p><p class="b">Prepared by (as Requester)</p></td>' +
    '<td class="r" style="vertical-align:bottom">' + (appr ? '<p style="font-size:9pt;color:#0E6B5C">Approved digitally ' + esc(fin.at || '') + '</p>' : '<p style="font-size:9pt;color:#B3122E">' + esc(r.status) + '</p>') + '<p class="b" style="border-top:1px solid #000;display:inline-block;padding-top:2mm;min-width:60mm">' + esc(r.toName) + '</p><p class="b">Approved by (' + esc(r.toDesg || 'General Manager') + ')</p></td></tr></table>' +
    (route.length ? '<h4 style="margin-top:8mm">Approval channel</h4><table class="t" style="font-size:8.5pt"><thead><tr><th>#</th><th>Role</th><th>Name</th><th>Status</th><th>Date &amp; time</th><th>Remark</th></tr></thead><tbody>' + route.map(function (x, i) { return '<tr><td class="ct">' + (i + 1) + '</td><td>' + esc(x.role) + '</td><td>' + esc(x.name || '-') + '</td><td>' + ({ done: 'Approved', rejected: 'Rejected', pending: 'Pending', skip: 'Skipped' }[x.st] || '') + '</td><td>' + esc(x.at || '') + '</td><td>' + esc(x.rm || '') + '</td></tr>'; }).join('') + '</tbody></table>' : '');
  printHtml(body, { title: r.id });
}
function printCircular(r) {
  var aud = String(r.audience || 'All') === 'All' ? 'All Employees' : 'Employees of ' + String(r.audience).split(',').map(function (x) { return x.trim(); }).join(', ') + ' department(s)';
  var body = '<p class="ct b u" style="font-size:14pt;margin-top:3mm;letter-spacing:1px">' + esc(String(r.type || 'Circular').toUpperCase()) + '</p>' + (r.priority === 'Urgent' ? '<p class="ct b" style="color:#B3122E">URGENT</p>' : '') +
    '<table style="width:100%;margin-top:5mm"><tr><td class="b">Ref: ' + esc(r.id) + '</td><td class="b r">Date: ' + ddot(r.date) + '</td></tr></table>' +
    '<p style="margin-top:6mm"><b>To:</b> ' + esc(aud) + '</p><p style="margin-top:5mm"><b>Subject: <span class="u">' + esc(r.title) + '</span></b></p>' +
    '<div style="margin-top:5mm;line-height:1.65;text-align:justify;min-height:70mm">' + nl(r.body) + '</div>' +
    (r.validTill ? '<p>This notice is in force until ' + ddot(r.validTill) + '.</p>' : '') + (r.ackRequired !== 'No' ? '<p style="font-size:9pt">All concerned are requested to acknowledge this notice in the Port Energy ERP.</p>' : '') +
    '<div style="margin-top:20mm;page-break-inside:avoid"><p class="b">For PORT ENERGY PRIVATE LIMITED</p><p class="b" style="margin-top:16mm">' + esc(r.issuedBy) + '</p><p>' + esc(userDes(r.issuedBy)) + '</p></div>';
  printHtml(body, { title: r.id });
}
function printDecision(r) {
  var body = '<p class="ct b u" style="font-size:13pt;margin-top:3mm">MANAGEMENT DECISION</p><table style="width:100%;margin-top:5mm"><tr><td class="b">Ref: ' + esc(r.id) + '</td><td class="b r">Meeting date: ' + ddot(r.meetingDate) + '</td></tr></table>' +
    '<table class="t" style="margin-top:5mm">' + [['Meeting / forum', r.meeting], ['Category', r.category], ['Decision', r.decision], ['Responsible person', r.responsible + (userDes(r.responsible) ? ' (' + userDes(r.responsible) + ')' : '')], ['Support / coordination', r.support], ['Project / site', r.project], ['Priority', r.priority], ['Deadline', ddot(r.deadline) + (r.deadline < today() && ['Open', 'In Progress'].indexOf(r.status) > -1 ? '  — OVERDUE' : '')], ['Status', r.status], ['Completion note', r.completion], ['Completion proof', (r.proof || []).length ? r.proof.length + ' file(s) attached in ERP' : '']].filter(function (x) { return x[1]; }).map(function (x) { return '<tr><td style="width:30%" class="b">' + esc(x[0]) + '</td><td>' + nl(x[1]) + '</td></tr>'; }).join('') + '</table>' +
    (r.log ? '<h4>Progress log</h4><table class="t" style="font-size:9pt">' + String(r.log).split('\n').map(function (l) { var p = l.split(' | '); return '<tr><td style="width:24%">' + esc(p[0]) + '</td><td>' + esc(p[1] || '') + '</td><td>' + esc(p[2] || '') + '</td><td>' + esc(p.slice(3).join(' | ')) + '</td></tr>'; }).join('') + '</table>' : '') +
    '<table style="width:100%;margin-top:20mm"><tr><td class="b">Responsible: ' + esc(r.responsible) + '</td><td class="b r">Managing Director</td></tr></table>';
  printHtml(body, { title: r.id });
}
function printRegister(rows) {
  if (!rows.length) return toast('Nothing to print.', true);
  var body = '<p class="ct b u" style="font-size:13pt">MANAGEMENT DECISION REGISTER</p><p class="ct">As on ' + ddot(today()) + ' · ' + rows.length + ' decision(s)</p>' +
    '<table class="t" style="font-size:8.5pt;margin-top:4mm"><thead><tr><th>S.No</th><th>Ref</th><th>Meeting</th><th>Decision</th><th>Responsible</th><th>Deadline</th><th>Status</th><th>Completion</th></tr></thead><tbody>' +
    rows.map(function (r, i) { var od = r.deadline < today() && ['Open', 'In Progress'].indexOf(r.status) > -1; return '<tr><td class="ct">' + (i + 1) + '</td><td>' + esc(r.id) + '</td><td>' + ddot(r.meetingDate) + '<br>' + esc(r.meeting) + '</td><td>' + nl(r.decision) + '</td><td>' + esc(r.responsible) + '</td><td' + (od ? ' style="color:#B3122E;font-weight:bold"' : '') + '>' + ddot(r.deadline) + (od ? '<br>OVERDUE' : '') + '</td><td>' + esc(r.status) + '</td><td>' + esc(r.completion || '') + '</td></tr>'; }).join('') + '</tbody></table>' +
    '<table style="width:100%;margin-top:18mm"><tr><td class="b">Prepared by</td><td class="b r">Managing Director</td></tr></table>';
  printHtml(body, { title: 'Decision Register', landscape: true });
}
function printGeneric(e, r) {
  var title = e.key === 'payments' ? 'PAYMENT VOUCHER' : e.single.toUpperCase();
  var fs = e.fields.filter(function (f) { return f.t !== 'files' && f.t !== 'hidden' && r[f.k] !== '' && r[f.k] != null; });
  var body = '<p class="ct b u" style="font-size:12pt">' + esc(title) + '</p><table style="width:100%;margin:4mm 0"><tr><td class="b">No: ' + esc(r.id) + '</td><td class="b r">' + (r.status ? 'Status: ' + esc(r.status) : '') + '</td></tr></table>' +
    '<table class="t">' + fs.map(function (f) { return '<tr><td style="width:32%">' + esc(f.l) + '</td><td>' + (f.t === 'textarea' ? nl(r[f.k]) : esc(fval(f, r[f.k], true))) + '</td></tr>'; }).join('') + '</table>';
  if (e.lines && (r.lines || []).length) { var cols = e.lines.cols.filter(function (c) { return c.t !== 'hidden'; }); body += '<h4>' + esc(e.lines.l) + '</h4><table class="t"><thead><tr><th>#</th>' + cols.map(function (c) { return '<th>' + esc(c.l) + '</th>'; }).join('') + '</tr></thead><tbody>' + r.lines.map(function (l, i) { return '<tr><td class="ct">' + (i + 1) + '</td>' + cols.map(function (c) { return '<td>' + esc(l[c.k] == null ? '' : l[c.k]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>'; }
  if (e.key === 'payments' && r.amount) body += '<p class="b">Rupees: ' + words(r.amount) + '.</p>';
  if (r.log) body += '<h4>Approval history</h4><table class="t" style="font-size:9pt">' + String(r.log).split('\n').map(function (l) { var p = l.split(' | '); return '<tr><td style="width:24%">' + esc(p[0]) + '</td><td>' + esc(p[1] || '') + '</td><td>' + esc(p[2] || '') + '</td><td>' + esc(p.slice(3).join(' | ')) + '</td></tr>'; }).join('') + '</table>';
  body += '<table style="width:100%;margin-top:20mm"><tr><td class="b">Prepared by</td><td class="b ct">Checked by</td><td class="b r">' + (e.key === 'payments' ? 'Receiver\'s signature' : 'Approved by') + '</td></tr></table>';
  printHtml(body, { title: r.id });
}
/* ---------------- Department sheets (Super Admin) ---------------- */
var DS = null;
function deptPage(v) {
  setTitle('Department sheets', 'System · view-only Google Sheets');
  if (!S.sess.user.admin) { v.innerHTML = '<div class="empty"><b>Super Admin only</b></div>'; return; }
  skeleton(v, 8);
  call('deptInfo', S.token).then(function (d) { DS = d; drawDept(v); }).catch(function (x) { v.innerHTML = '<div class="empty"><b>Could not load</b>' + esc(x.message) + '</div>'; });
}
function drawDept(v) {
  if (S.route.v !== 'dsheets' || !DS) return;
  var d = DS, names = d.depts.map(function (x) { return x.name; });
  var h = '<div class="lhead"><p>' + (d.last ? 'Last sync: <b>' + esc(d.last) + '</b>' : 'Not synced yet') + ' · ' + (d.auto ? 'Auto refresh every hour' : '<span style="color:var(--bad)">Auto refresh off - tap Sync now</span>') + '</p><div class="tools"><button class="btn primary" id="dsSync">' + icon('swap', 16) + 'Sync now</button></div></div>';
  h += '<p class="note" style="margin:-4px 0 14px">Staff can only <b>view</b> their department sheet. Download, print and copy are blocked for them. Only Super Admin can download here.</p>';
  h += '<div class="dsgrid">' + d.depts.map(function (x) {
    return '<div class="glass panel dsc"><h3>' + icon('ledger', 18) + esc(x.name) + '</h3><div class="note">' + x.tabs.map(esc).join(' · ') + '</div>' +
      '<div class="dsv"><b>' + x.viewers.length + '</b> viewer(s)' + (x.viewers.length ? ': ' + x.viewers.map(function (e) { return '<span class="pchip">' + esc(e) + '</span>'; }).join('') : '') + '</div>' +
      '<div class="acts">' + (x.url ? '<a class="btn soft sm" href="' + esc(x.url) + '" target="_blank" rel="noopener">' + icon('search', 14) + 'Open</a><button class="btn soft sm" data-dl="' + esc(x.name) + '" data-f="xlsx">' + icon('down', 14) + 'Excel</button><button class="btn soft sm" data-dl="' + esc(x.name) + '" data-f="pdf">' + icon('down', 14) + 'PDF</button>' : '<span class="note">Tap Sync now to create</span>') + '</div></div>';
  }).join('') + '</div>';
  h += '<div class="glass panel"><h3>Who can view which sheet</h3><p class="note">Pick the staff name - they will see <b>Department sheets</b> inside the ERP straight away (no Google permission needed). Add one or more Gmail IDs (comma separated) only if they should also open the Google Sheet. Turn Active off to remove access. Tap Save.</p>' +
    '<div class="tablewrap"><table class="tb" id="dsT"><thead><tr><th>Department</th><th>Staff name</th><th>Email(s) - optional</th><th>Active</th><th></th></tr></thead><tbody>' +
    d.rows.map(function (r, i) { return '<tr data-i="' + i + '"><td><select class="in" data-k="d">' + names.map(function (n) { return '<option' + (n === r.d ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') + '</select></td>' +
      '<td><select class="in" data-k="n"><option value="">- select staff -</option>' + d.users.map(function (u) { return '<option value="' + esc(u.n) + '" data-e="' + esc(u.e) + '"' + (u.n === r.n ? ' selected' : '') + '>' + esc(u.n) + (u.d ? ' - ' + esc(u.d) : '') + '</option>'; }).join('') + '</select></td>' +
      '<td><input class="in" data-k="e" type="text" value="' + esc(r.e) + '" placeholder="name@gmail.com, other@gmail.com"></td><td><input type="checkbox" data-k="a"' + (r.a ? ' checked' : '') + '></td><td><button class="btn ghost sm" data-rm="' + i + '" title="Remove">&#10005;</button></td></tr>'; }).join('') +
    '</tbody></table></div>' +
    '<div class="mfoot" style="justify-content:space-between"><button class="btn soft" id="dsAdd">' + icon('plus', 16) + ' Add person</button><button class="btn primary" id="dsSave">Save &amp; update access</button></div></div>';
  v.innerHTML = h;
  function readRows() { return Array.prototype.map.call(v.querySelectorAll('#dsT tbody tr'), function (tr) { return { d: tr.querySelector('[data-k="d"]').value, n: tr.querySelector('[data-k="n"]').value, e: tr.querySelector('[data-k="e"]').value.trim().toLowerCase(), a: tr.querySelector('[data-k="a"]').checked }; }); }
  v.querySelectorAll('#dsT [data-k="n"]').forEach(function (s) { s.onchange = function () { var o = s.options[s.selectedIndex], e = o && o.getAttribute('data-e'), inp = s.closest('tr').querySelector('[data-k="e"]'); if (e && !inp.value.trim()) inp.value = e; }; });
  $('dsAdd').onclick = function () { DS.rows = readRows(); DS.rows.push({ d: names[0], n: '', e: '', a: true }); drawDept(v); var ins = v.querySelectorAll('[data-k="n"]'); if (ins.length) ins[ins.length - 1].focus(); };
  v.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { DS.rows = readRows(); DS.rows.splice(+b.dataset.rm, 1); drawDept(v); }; });
  $('dsSave').onclick = function () {
    var EM = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    var rows = readRows(), bad = rows.filter(function (r) { var es = r.e.split(/[,;\s]+/).filter(String); return (!r.n && !es.length) || es.some(function (x) { return !EM.test(x); }); });
    if (bad.length) { toast('Select a staff name, and check every email address.', true); return; }
    var b = this; busy(b, true, 'Saving'); call('deptSaveAccess', S.token, rows).then(function (x) { DS = x; drawDept(v); toast('Access updated.'); }).catch(function (e) { busy(b, false); fail(e); });
  };
  $('dsSync').onclick = function () { var b = this; busy(b, true, 'Syncing'); toast('Syncing all department sheets… this can take a minute.'); call('deptSyncNow', S.token).then(function (x) { DS = x; drawDept(v); toast('Department sheets updated.'); }).catch(function (e) { busy(b, false); fail(e); }); };
  v.querySelectorAll('[data-dl]').forEach(function (b) { b.onclick = function () {
    busy(b, true, ''); call('deptDownload', S.token, b.dataset.dl, b.dataset.f).then(function (f) {
      busy(b, false); var bin = atob(f.b64), u8 = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      download(f.name, f.mime, u8); toast('Downloaded ' + f.name);
    }).catch(function (e) { busy(b, false); fail(e); });
  }; });
}
/* ---------------- Port Energy AI chat (Gemini) ---------------- */
var AI = { h: [], busy: false, step: 0, tm: null, file: null, web: store.get('pe_aiweb') === '1' };
var AI_STEPS = ['Reading your question...', 'Thinking like a Port Energy engineer...', 'Checking the details...', 'Doing the maths twice...', 'Choosing the right words...', 'Polishing your answer...', 'Almost ready...'];
try { AI.h = JSON.parse(store.get('pe_ai') || '[]') || []; } catch (e) { AI.h = []; }
var AI_SUG = ['Draft a payment follow-up email to a vendor', 'HSN code and GST rate for HDPE pipes', 'Format for a site daily progress report', 'TDS on contractor payment - basic rules', 'Checklist before releasing a PO', 'Polite reminder to a client for pending invoice'];
function aiFmt(t) {
  var lines = esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').split('\n'), h = '', inL = false;
  lines.forEach(function (l) {
    var m = l.match(/^\s*(?:[-*\u2022]|\d+[.)])\s+(.*)/);
    if (m) { if (!inL) { h += '<ul>'; inL = true; } h += '<li>' + m[1] + '</li>'; }
    else { if (inL) { h += '</ul>'; inL = false; } h += l.trim() ? '<p>' + l.replace(/^#+\s*/, '') + '</p>' : ''; }
  });
  return h + (inL ? '</ul>' : '');
}
function aiRender() {
  var b = $('aim'), u = S.sess ? S.sess.user : { name: '' };
  if (!AI.h.length) {
    b.innerHTML = '<div class="aiwel"><div class="ai-orb big"><i></i><i></i><i></i></div><h3>' + esc(greet()) + ', ' + esc(String(u.name || '').split(' ').slice(-1)[0]) + '</h3><p><b>PEPL Intelligence</b> knows procurement, GST / HSN, letters, reports and site work. Type, or tap the mic and speak.</p><div class="aisug">' + AI_SUG.map(function (s) { return '<button class="chip" data-s="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div><small>AI can make mistakes. Check important figures. It cannot see ERP records.</small></div>';
    b.querySelectorAll('[data-s]').forEach(function (x) { x.onclick = function () { aiSend(x.dataset.s); }; });
  } else {
    b.innerHTML = AI.h.map(function (m, i) { return m.r === 'ai' ? '<div class="aib ai">' + aiFmt(m.t) + (m.src && m.src.length ? '<div class="aisrc"><b>Sources:</b> ' + m.src.map(function (s) { return '<a href="' + esc(s.u) + '" target="_blank" rel="noopener">' + esc(s.t) + '</a>'; }).join('') + '</div>' : '') + '<button class="aicp" data-c="' + i + '">Copy</button></div>' : '<div class="aib me">' + (m.f ? '<span class="aifc">&#128206; ' + esc(m.f) + '</span>' : '') + esc(m.t).replace(/\n/g, '<br>') + '</div>'; }).join('') + (AI.busy ? '<div class="aib ai typing"><i></i><i></i><i></i><span class="aity" id="aiTy">' + esc(AI_STEPS[AI.step % AI_STEPS.length]) + '</span></div>' : '');
    b.querySelectorAll('[data-c]').forEach(function (x) { x.onclick = function () { var t = AI.h[+x.dataset.c].t; try { navigator.clipboard.writeText(t).then(function () { toast('Copied.'); }, function () { toast('Long-press the text to copy.', true); }); } catch (e) { toast('Long-press the text to copy.', true); } }; });
  }
  b.scrollTop = b.scrollHeight;
}
function aiSave() { try { store.set('pe_ai', JSON.stringify(AI.h.slice(-30))); } catch (e) { } }
function aiSend(q) {
  q = String(q || $('aiIn').value).trim(); if ((!q && !AI.file) || AI.busy) return;
  var fl = AI.file, opt = { web: AI.web, file: fl ? { name: fl.name, mime: fl.mime, b64: fl.b64 } : null };
  var hist = AI.h.slice(-12);
  AI.h.push({ r: 'me', t: q || 'Read this file', f: fl ? fl.name : '' }); AI.file = null; aiFileChip(); AI.busy = true; AI.step = 0; clearInterval(AI.tm); AI.tm = setInterval(function () { if (!AI.busy) { clearInterval(AI.tm); return; } AI.step++; var s = $('aiTy'); if (s) { s.classList.remove('in'); void s.offsetWidth; s.textContent = AI_STEPS[AI.step % AI_STEPS.length]; s.classList.add('in'); } }, 1400); $('aiIn').value = ''; aiGrow(); aiRender();
  call('aiChat', S.token, hist, q, opt).then(function (r) { AI.busy = false; AI.h.push({ r: 'ai', t: r.text, src: r.src || [] }); aiSave(); aiRender(); })
    .catch(function (e) { AI.busy = false; AI.h.pop(); $('aiIn').value = q; AI.file = fl; aiFileChip(); aiRender(); fail(e); });
}
function aiGrow() { var t = $('aiIn'); t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 140) + 'px'; }
function openAI() { closeSide(); $('menu').classList.remove('open'); $('aip').classList.add('open'); aiRender(); setTimeout(function () { if (window.innerWidth > 760) $('aiIn').focus(); }, 200); }
function closeAI() { $('aip').classList.remove('open'); }
$('aiX').onclick = closeAI; $('aiGo').onclick = function () { aiSend(); }; $('aiBtn').onclick = function () { openAI(); };
$('aiNew').onclick = function () { AI.h = []; AI.file = null; aiFileChip(); aiSave(); aiRender(); };
function aiWebUi() { $('aiWeb').classList.toggle('on', AI.web); }
$('aiWeb').onclick = function () { AI.web = !AI.web; store.set('pe_aiweb', AI.web ? '1' : '0'); aiWebUi(); toast(AI.web ? 'Web search ON - answers use Google Search.' : 'Web search OFF.'); }; aiWebUi();
function aiFileChip() { var c = $('aiFileChip'); if (!c) return; c.innerHTML = AI.file ? '<span class="chip on aifile">' + (AI.file.thumb ? '<img src="' + AI.file.thumb + '" alt="">' : '&#128196; ') + esc(AI.file.name) + ' <b data-x="1">&#10005;</b></span>' : ''; var x = c.querySelector('[data-x]'); if (x) x.onclick = function () { AI.file = null; aiFileChip(); }; }
function aiPrep(f) {
  return new Promise(function (res, rej) {
    if (f.size > 15 * 1024 * 1024) return rej(new Error('File is too big (max 15 MB photo / 8 MB PDF).'));
    var rd = new FileReader(); rd.onerror = function () { rej(new Error('Could not read the file.')); };
    if (/^image\//.test(f.type)) {
      rd.onload = function () { var im = new Image(); im.onload = function () { var s = Math.min(1, 1600 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); var d = c.toDataURL('image/jpeg', 0.82), t = document.createElement('canvas'), k = 64 / Math.max(c.width, c.height); t.width = Math.round(c.width * k); t.height = Math.round(c.height * k); t.getContext('2d').drawImage(c, 0, 0, t.width, t.height); res({ name: f.name || 'photo.jpg', mime: 'image/jpeg', b64: d.split(',')[1], thumb: t.toDataURL('image/jpeg', 0.7) }); }; im.onerror = function () { rej(new Error('This photo format is not supported. Use JPG or PNG.')); }; im.src = rd.result; };
      rd.readAsDataURL(f);
    } else {
      var n = f.name || '', mime = /\.pdf$/i.test(n) ? 'application/pdf' : /\.csv$/i.test(n) ? 'text/csv' : /\.txt$/i.test(n) ? 'text/plain' : f.type;
      if (['application/pdf', 'text/csv', 'text/plain'].indexOf(mime) === -1) return rej(new Error('Use a photo, PDF, TXT or CSV file.'));
      if (f.size > 8 * 1024 * 1024) return rej(new Error('PDF is too big (max 8 MB).'));
      rd.onload = function () { res({ name: n, mime: mime, b64: String(rd.result).split(',')[1] }); }; rd.readAsDataURL(f);
    }
  });
}
$('aiAt').onclick = function () { $('aiFile').click(); };
$('aiFile').onchange = function () { var f = this.files && this.files[0]; this.value = ''; if (!f) return; aiPrep(f).then(function (x) { AI.file = x; aiFileChip(); $('aiIn').focus(); toast('File attached. Type your question or just tap Send.'); }).catch(fail); };
$('aiIn').addEventListener('input', aiGrow);
$('aiIn').addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 760) { e.preventDefault(); aiSend(); } });
$('bnav').querySelector('[data-v="ai"]').onclick = function () { openAI(); };
/* ---------------- top clock with time quotes ---------------- */
var TQ = ['Time is gold.', 'Don\'t waste time - focus on the goal.', 'Every minute counts.', 'Do it now, not later.', 'Lost time never comes back.', 'Use time wisely, win the day.', 'On time, every time.', 'Deadlines are promises - keep them.', 'Plan your hour, own your day.', 'Focus. Finish. Follow up.', 'Time well spent is profit earned.', 'Start now, improve as you go.', 'Time waits for no one.', 'Today\'s work, today.', 'Busy is not the same as productive.', 'One task at a time, done well.'];
var CK = { m: -1, q: -1 };
function tickClock() {
  var d = new Date(), t = $('clkT'); if (!t) return;
  t.textContent = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
  if (d.getMinutes() !== CK.m) { CK.m = d.getMinutes(); var i = Math.floor(Math.random() * TQ.length); if (i === CK.q) i = (i + 1) % TQ.length; CK.q = i; var q = $('clkQ'); q.style.opacity = 0; setTimeout(function () { q.textContent = TQ[i]; q.style.opacity = 1; }, 250); }
}
tickClock(); setInterval(tickClock, 1000);
/* ---------------- Android / browser BACK button: go to previous screen, never close the app ---------------- */
var HB = { on: false, skip: false, started: false };
try { HB.on = !!(google && google.script && google.script.history); } catch (e) { }
function hpush(st) { if (!HB.on) return; try { google.script.history.push(JSON.parse(JSON.stringify(st))); } catch (e) { } }
function layerOpen() { return ['modal', 'pal', 'aip', 'drawer', 'side', 'menu'].some(function (id) { return $(id).classList.contains('open'); }); }
function closeTop() { if ($('modal').classList.contains('open')) closeModal(); else if ($('pal').classList.contains('open')) closePal(); else if ($('aip').classList.contains('open')) closeAI(); else if ($('drawer').classList.contains('open')) closeDrawer(); else if ($('side').classList.contains('open')) closeSide(); else $('menu').classList.remove('open'); }
var _go = go;
go = function (r) {
  if (!HB.started) HB.started = true;
  else if (!HB.skip && JSON.stringify(r) !== JSON.stringify(S.route)) hpush({ r: r });
  _go(r);
};
var _openDrawer = openDrawer; openDrawer = function (h, w) { var was = $('drawer').classList.contains('open'); _openDrawer(h, w); if (!was) hpush({ layer: 1, r: S.route }); };
var _modal = modal; modal = function (h) { var was = $('modal').classList.contains('open'); _modal(h); if (!was) hpush({ layer: 1, r: S.route }); };
var _openPal = openPal; openPal = function () { var was = $('pal').classList.contains('open'); _openPal(); if (!was) hpush({ layer: 1, r: S.route }); };
var _openSide = openSide; openSide = function () { var was = $('side').classList.contains('open'); _openSide(); if (!was) hpush({ layer: 1, r: S.route }); };
var _openAI = openAI; openAI = function () { var was = $('aip').classList.contains('open'); _openAI(); if (!was) hpush({ layer: 1, r: S.route }); };
$('burger').onclick = openSide; $('topFind').onclick = openPal;
if (HB.on) google.script.history.setChangeHandler(function (e) {
  if ($('welcome') && $('welcome').classList.contains('show')) { cancelWelcome(); return; }
  if (!S.sess) return;
  if (layerOpen()) { closeTop(); return; }
  var st = (e && e.state) || {}, r = st.r && st.r.v ? st.r : { v: 'home' };
  if (JSON.stringify(r) === JSON.stringify(S.route)) return;
  HB.skip = true; try { go(r); } finally { HB.skip = false; }
});
window.PE = { S: S, $: $, esc: esc, icon: icon, call: call, toast: toast, busy: busy, fail: fail, store: store, go: function (r) { go(r); }, setTitle: setTitle, skeleton: skeleton,
  modal: function (h) { modal(h); }, closeModal: closeModal, closeSide: closeSide, ent: ent, inr: inr, inrShort: inrShort, num: num, r2: r2, fdate: fdate, ddot: ddot, today: today, initials: initials,
  markNav: markNav, openForm: openForm, openDetail: openDetail, printHtml: printHtml, words: words, nl: nl, openAI: function () { openAI(); }, closeAI: closeAI, keysModal: keysModal, SHORTCUTS: SHORTCUTS,
  CMDS: CMDS, badge: badge, debounce: debounce, refreshBoot: refreshBoot, fval: fval, colDef: colDef, greet: greet, aiSendText: function (q) { return aiSend(q); }, AI: AI, buildNav: buildNav, findOpt: findOpt, userDes: userDes,
  printPO: printPO, printQuotes: printQuotes, printIOA: printIOA, printCircular: printCircular, printDecision: printDecision, printGeneric: printGeneric, printRecord: printRecord, sheet: sheet, letterhead: letterhead };
start();
})();
