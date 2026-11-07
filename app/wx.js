/* © 2026 Port Energy Private Limited. All rights reserved.
   PORT ENERGY ERP - live site weather + rain forecast (dashboard) and the custom report builder.
   Weather: Open-Meteo (free, no key). Updates every 15 minutes. */
(function () {
  'use strict';
  var P = function () { return window.PE; }, $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var ls = { get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (x) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (x) { } } };

  /* ================= WEATHER ================= */
  var SITES0 = [{ n: 'Chennai (Head office)', q: 'Chennai' }];
  var CODES = { 0: ['Clear sky', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'], 45: ['Fog', '🌫️'], 48: ['Fog', '🌫️'], 51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌧️'],
    61: ['Light rain', '🌦️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'], 66: ['Freezing rain', '🌧️'], 67: ['Freezing rain', '🌧️'], 80: ['Rain showers', '🌦️'], 81: ['Heavy showers', '🌧️'], 82: ['Violent showers', '⛈️'], 95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm + hail', '⛈️'], 99: ['Thunderstorm + hail', '⛈️'] };
  function code(c) { return CODES[c] || ['Weather', '🌡️']; }
  function sites() {
    var out = SITES0.slice(), seen = { chennai: 1 };
    ((P().S.opts && P().S.opts.projects) || []).forEach(function (p) {
      var row = (P().S.cache.projects || []).filter(function (r) { return r.name === p.v; })[0] || {};
      var q = (row.location || p.loc || p.location || '').trim(); if (!q) return;
      var k = q.toLowerCase(); if (seen[k]) return; seen[k] = 1; out.push({ n: p.v, q: q });
    });
    return out;
  }
  function geo(q) {
    var c = ls.get('pe_geo') || {}; if (c[q]) return Promise.resolve(c[q]);
    return fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&country_code=IN&name=' + encodeURIComponent(q.split(',')[0])).then(function (r) { return r.json(); }).then(function (d) {
      var g = d && d.results && d.results[0]; if (!g) throw new Error('Place not found: ' + q);
      c[q] = { lat: g.latitude, lon: g.longitude, name: g.name + (g.admin1 ? ', ' + g.admin1 : '') }; ls.set('pe_geo', c); return c[q];
    });
  }
  function forecast(g) {
    var u = 'https://api.open-meteo.com/v1/forecast?latitude=' + g.lat + '&longitude=' + g.lon + '&timezone=Asia%2FKolkata&forecast_days=3' +
      '&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m' +
      '&hourly=temperature_2m,precipitation_probability,precipitation,weather_code' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum';
    return fetch(u).then(function (r) { if (!r.ok) throw new Error('Weather service busy'); return r.json(); });
  }
  function rainWhen(d) {
    var now = new Date(d.current.time).getTime(), h = d.hourly, first = -1;
    for (var i = 0; i < h.time.length; i++) { var t = new Date(h.time[i]).getTime(); if (t < now - 3600000) continue; if (t > now + 24 * 3600000) break; if (h.precipitation_probability[i] >= 50 || h.precipitation[i] >= .5) { first = i; break; } }
    if (d.current.precipitation > 0.1) return { now: true, txt: 'Raining now at site' };
    if (first < 0) return { none: true, txt: 'No rain expected in the next 24 hours' };
    var t = new Date(h.time[first]), mins = Math.round((t.getTime() - now) / 60000);
    var when = mins < 60 ? 'within the hour' : 'around ' + t.toLocaleTimeString('en-IN', { hour: 'numeric' }) + (t.getDate() !== new Date(now).getDate() ? ' tomorrow' : '');
    return { soon: mins < 180, txt: 'Rain likely ' + when + ' (' + h.precipitation_probability[first] + '% chance)' };
  }
  function draw(el, s, g, d) {
    var c = d.current, cd = code(c.weather_code), rw = rainWhen(d), h = d.hourly, now = new Date(c.time).getTime();
    var hrs = []; for (var i = 0; i < h.time.length && hrs.length < 12; i++) { if (new Date(h.time[i]).getTime() >= now - 1800000) hrs.push(i); }
    var mx = Math.max.apply(null, hrs.map(function (i) { return h.precipitation_probability[i] || 0; }).concat([20]));
    var list = sites(), work = c.wind_gusts_10m >= 45 ? 'Strong wind - stop crane lifts and work at height.' : rw.now ? 'Rain - protect cement, paint and electrical work.' : rw.soon ? 'Rain coming - cover materials, plan inside work.' : c.temperature_2m >= 38 ? 'Very hot - water and rest breaks for the crew.' : 'Good working weather.';
    el.innerHTML = '<h3><span class="dx-hi">' + cd[1] + '</span>Site weather <small class="wx-live"><i></i>Live</small>' +
      '<select class="wx-site" aria-label="Site">' + list.map(function (x, i) { return '<option value="' + i + '"' + (x.q === s.q ? ' selected' : '') + '>' + esc(x.n) + '</option>'; }).join('') + '</select></h3>' +
      '<div class="wx-now ' + (rw.now ? 'rain' : rw.soon ? 'soon' : '') + '"><span class="wx-ic">' + cd[1] + '</span><div class="wx-t"><b>' + Math.round(c.temperature_2m) + '°</b><span>' + esc(cd[0]) + '<small>Feels ' + Math.round(c.apparent_temperature) + '° · ' + esc(g.name) + '</small></span></div>' +
      '<div class="wx-m"><span>💧 ' + c.relative_humidity_2m + '%</span><span>🌬️ ' + Math.round(c.wind_speed_10m) + ' km/h</span><span>💨 gust ' + Math.round(c.wind_gusts_10m) + '</span></div></div>' +
      '<div class="wx-alert ' + (rw.now ? 'rain' : rw.soon ? 'soon' : 'dry') + '"><b>' + (rw.now ? '🌧️' : rw.soon ? '⚠️' : '✅') + ' ' + esc(rw.txt) + '</b><small>' + esc(work) + '</small></div>' +
      '<div class="wx-hr">' + hrs.map(function (i) { var p = h.precipitation_probability[i] || 0, t = new Date(h.time[i]); return '<div title="' + p + '% rain"><i style="height:' + Math.max(4, p / mx * 100) + '%" class="' + (p >= 60 ? 'hi' : p >= 30 ? 'md' : '') + '"></i><b>' + p + '%</b><small>' + (hrs[0] === i ? 'Now' : t.toLocaleTimeString('en-IN', { hour: 'numeric' }).replace(' ', '')) + '</small></div>'; }).join('') + '</div>' +
      '<div class="wx-days">' + d.daily.time.map(function (t, i) { var dc = code(d.daily.weather_code[i]); return '<div><small>' + (i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : new Date(t).toLocaleDateString('en-IN', { weekday: 'short' })) + '</small><span>' + dc[1] + '</span><b>' + Math.round(d.daily.temperature_2m_max[i]) + '° <em>' + Math.round(d.daily.temperature_2m_min[i]) + '°</em></b><small class="wx-p">☔ ' + (d.daily.precipitation_probability_max[i] || 0) + '% · ' + (d.daily.precipitation_sum[i] || 0).toFixed(1) + ' mm</small></div>'; }).join('') + '</div>' +
      '<p class="wx-src">Updated ' + new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) + ' · Open-Meteo forecast</p>';
    el.querySelector('.wx-site').onchange = function () { var x = list[+this.value]; ls.set('pe_wxsite', x); load(el, x); };
  }
  function load(el, s) {
    s = s || ls.get('pe_wxsite') || SITES0[0];
    if (!el.innerHTML) el.innerHTML = '<h3><span class="dx-hi">⛅</span>Site weather</h3><div class="dx-load"><i></i><i></i></div>';
    geo(s.q).then(function (g) { return forecast(g).then(function (d) { if (document.body.contains(el)) draw(el, s, g, d); }); })
      .catch(function (e) { el.innerHTML = '<h3><span class="dx-hi">⛅</span>Site weather</h3><p class="note">Weather not available now (' + esc(e.message) + '). Check internet.</p>'; });
  }
  var timer = null;
  function mount() {
    var host = document.querySelector('.dx-alerts'); if (!host || document.querySelector('.wx')) return;
    var el = document.createElement('section'); el.className = 'glass dx-p wx';
    host.parentNode.insertBefore(el, host);
    host.parentNode.classList.add('dx-wx-row');
    load(el); clearInterval(timer); timer = setInterval(function () { if (document.body.contains(el)) load(el); else clearInterval(timer); }, 15 * 60000);
  }
  new MutationObserver(mount).observe(document.documentElement, { childList: true, subtree: true });

  /* ================= CUSTOM REPORT BUILDER ================= */
  function builder(v, r) {
    P().setTitle('Custom report', 'Reports · build your own');
    var ents = P().S.sess.entities.filter(function (e) { return e.key !== 'photos'; }).sort(function (a, b) { return a.title.localeCompare(b.title); });
    var st = ls.get('pe_rb') || {}; if (!st.k || !P().ent(st.k)) st = { k: (ents.filter(function (e) { return e.key === 'po'; })[0] || ents[0]).key };
    v.innerHTML = '<div class="lhero"><span class="lh-ic">' + P().icon('ledger', 24) + '</span><div class="lh-tx"><h2>Custom report builder</h2><p>Pick data, filters, columns, grouping and chart - then print with letterhead or download Excel.</p></div><button class="btn soft sm" id="rbBack" style="background:rgba(255,255,255,.2)!important;color:#fff!important">‹ Reports</button></div>' +
      '<div class="rb"><aside class="glass rb-c" id="rbC"></aside><div class="rb-out"><div class="rb-bar"><span id="rbN" class="note"></span><div class="grow"></div><button class="btn soft" id="rbXls">' + P().icon('down', 15) + 'Excel</button><button class="btn primary" id="rbPr">' + P().icon('print', 15) + 'Print / PDF</button></div><div class="glass" id="rbBody"></div></div></div>';
    $('rbBack').onclick = function () { P().go({ v: 'reports' }); };
    var data = [];
    function E() { return P().ent(st.k); }
    function cols(e) { var sys = [{ k: 'id', l: 'No', t: 'text' }].concat(e.flow ? [{ k: 'status', l: 'Status', t: 'text' }] : []); return sys.concat(e.fields.filter(function (f) { return ['files', 'hidden'].indexOf(f.t) < 0 && f.k !== 'id' && f.k !== 'status'; })).concat([{ k: 'createdBy', l: 'Created by', t: 'text' }]); }
    function money(f) { return f.t === 'money' || /amount|total|value|net|taxable|gst|balance|paid/i.test(f.k) && f.t !== 'text' && f.t !== 'select'; }
    function controls() {
      var e = E(), cs = cols(e); if (!st.cols || !st.cols.length) st.cols = e.list.slice();
      var groupable = cs.filter(function (f) { return ['select', 'ref', 'text'].indexOf(f.t) > -1 && !/^(id|title|remarks|details|address|purpose|subject|desc)/i.test(f.k); });
      var dateF = e.fields.filter(function (f) { return f.t === 'date'; });
      var stats = e.flow ? e.flow.statuses : [];
      $('rbC').innerHTML =
        '<label class="f">Data</label><select class="in" id="rbK">' + ents.map(function (x) { return '<option value="' + x.key + '"' + (x.key === st.k ? ' selected' : '') + '>' + P().esc(x.title) + '</option>'; }).join('') + '</select>' +
        (dateF.length ? '<label class="f">Date range</label><div class="rb-2"><select class="in" id="rbDf">' + dateF.map(function (f) { return '<option value="' + f.k + '"' + (st.df === f.k ? ' selected' : '') + '>' + P().esc(f.l) + '</option>'; }).join('') + '</select><select class="in" id="rbPre"><option value="">Any time</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="m">This month</option><option value="pm">Last month</option><option value="fy">This financial year</option><option value="c">Custom…</option></select></div>' +
          '<div class="rb-2" id="rbCust"' + (st.pre === 'c' ? '' : ' hidden') + '><input type="date" class="in" id="rbF" value="' + (st.f || '') + '"><input type="date" class="in" id="rbT" value="' + (st.t || '') + '"></div>' : '') +
        (stats.length ? '<label class="f">Status</label><div class="rb-chips" id="rbS">' + stats.map(function (s) { return '<label><input type="checkbox" value="' + P().esc(s) + '"' + (!st.s || st.s.indexOf(s) > -1 ? ' checked' : '') + '><span>' + P().esc(s) + '</span></label>'; }).join('') + '</div>' : '') +
        '<label class="f">Search inside</label><input class="in" id="rbQ" placeholder="Vendor, project, item…" value="' + P().esc(st.q || '') + '">' +
        '<label class="f">Group by</label><select class="in" id="rbG"><option value="">No grouping</option>' + groupable.map(function (f) { return '<option value="' + f.k + '"' + (st.g === f.k ? ' selected' : '') + '>' + P().esc(f.l) + '</option>'; }).join('') + '</select>' +
        '<label class="f">Sort by</label><div class="rb-2"><select class="in" id="rbSo">' + cs.map(function (f) { return '<option value="' + f.k + '"' + (st.so === f.k ? ' selected' : '') + '>' + P().esc(f.l) + '</option>'; }).join('') + '</select><select class="in" id="rbSd"><option value="1">A → Z / low → high</option><option value="-1"' + (st.sd == -1 ? ' selected' : '') + '>Z → A / high → low</option></select></div>' +
        '<label class="f">Chart</label><select class="in" id="rbCh"><option value="">No chart</option><option value="bar"' + (st.ch === 'bar' ? ' selected' : '') + '>Bar chart of the groups</option><option value="pie"' + (st.ch === 'pie' ? ' selected' : '') + '>Share (donut) of the groups</option></select>' +
        '<label class="f">Columns <small class="note">(tick to show)</small></label><div class="rb-cols" id="rbCols">' + cs.map(function (f) { return '<label><input type="checkbox" value="' + f.k + '"' + (st.cols.indexOf(f.k) > -1 ? ' checked' : '') + '><span>' + P().esc(f.l) + '</span></label>'; }).join('') + '</div>' +
        '<label class="f">Report title</label><input class="in" id="rbTi" value="' + P().esc(st.ti || e.title + ' report') + '">' +
        '<label class="rb-ck"><input type="checkbox" id="rbTot"' + (st.tot !== false ? ' checked' : '') + '> Show totals for money columns</label>' +
        '<label class="rb-ck"><input type="checkbox" id="rbSig"' + (st.sig ? ' checked' : '') + '> Add signature boxes (Prepared / Checked / Approved)</label>' +
        '<button class="btn soft" id="rbReset" style="margin-top:10px">Reset</button>';
      if ($('rbPre')) $('rbPre').value = st.pre || '';
      var ch = function () { read(); render(); };
      $('rbK').onchange = function () { st = { k: this.value }; ls.set('pe_rb', st); start(); };
      ['rbDf', 'rbG', 'rbSo', 'rbSd', 'rbCh', 'rbF', 'rbT', 'rbTot', 'rbSig'].forEach(function (id) { if ($(id)) $(id).onchange = ch; });
      if ($('rbPre')) $('rbPre').onchange = function () { $('rbCust').hidden = this.value !== 'c'; ch(); };
      $('rbQ').oninput = P().debounce(ch, 200); $('rbTi').oninput = P().debounce(ch, 300);
      $('rbC').querySelectorAll('#rbS input, #rbCols input').forEach(function (c) { c.onchange = ch; });
      $('rbReset').onclick = function () { st = { k: st.k }; ls.set('pe_rb', st); controls(); render(); };
    }
    function read() {
      st.df = $('rbDf') ? $('rbDf').value : ''; st.pre = $('rbPre') ? $('rbPre').value : ''; st.f = $('rbF') ? $('rbF').value : ''; st.t = $('rbT') ? $('rbT').value : '';
      st.s = $('rbS') ? Array.prototype.filter.call($('rbS').querySelectorAll('input'), function (c) { return c.checked; }).map(function (c) { return c.value; }) : null;
      st.q = $('rbQ').value; st.g = $('rbG').value; st.so = $('rbSo').value; st.sd = +$('rbSd').value; st.ch = $('rbCh').value; st.ti = $('rbTi').value; st.tot = $('rbTot').checked; st.sig = $('rbSig').checked;
      st.cols = Array.prototype.filter.call($('rbCols').querySelectorAll('input'), function (c) { return c.checked; }).map(function (c) { return c.value; });
      ls.set('pe_rb', st);
    }
    function range() {
      var t = P().today(), d = new Date(t), iso = function (x) { return x.toISOString().slice(0, 10); };
      if (st.pre === '7' || st.pre === '30') { var a = new Date(d); a.setDate(a.getDate() - (+st.pre - 1)); return [iso(a), t]; }
      if (st.pre === 'm') return [t.slice(0, 8) + '01', t];
      if (st.pre === 'pm') { var a1 = new Date(d.getFullYear(), d.getMonth() - 1, 1), b1 = new Date(d.getFullYear(), d.getMonth(), 0); return [iso(new Date(a1 - a1.getTimezoneOffset() * 6e4)), iso(new Date(b1 - b1.getTimezoneOffset() * 6e4))]; }
      if (st.pre === 'fy') { var y = d.getMonth() < 3 ? d.getFullYear() - 1 : d.getFullYear(); return [y + '-04-01', t]; }
      if (st.pre === 'c') return [st.f || '', st.t || ''];
      return ['', ''];
    }
    function filtered() {
      var e = E(), rg = range(), q = (st.q || '').toLowerCase();
      var out = data.filter(function (r) {
        if (st.s && e.flow && st.s.indexOf(r.status) < 0) return false;
        if (st.df && rg[0] && String(r[st.df] || '') < rg[0]) return false;
        if (st.df && rg[1] && String(r[st.df] || '') > rg[1]) return false;
        if (q && JSON.stringify(r).toLowerCase().indexOf(q) < 0) return false;
        return true;
      });
      var f = cols(e).filter(function (x) { return x.k === st.so; })[0];
      if (f) out.sort(function (a, b) { var x = a[f.k], y = b[f.k]; if (money(f) || f.t === 'number') { x = P().num(x); y = P().num(y); } else { x = String(x || '').toLowerCase(); y = String(y || '').toLowerCase(); } return (x < y ? -1 : x > y ? 1 : 0) * (st.sd || 1); });
      return out;
    }
    var COL = ['#0084F0', '#F0006C', '#00B49C', '#6F42C1', '#E8590C', '#0CA678', '#C2255C', '#1C7ED6', '#D9480F', '#868E96'];
    function chart(groups, mf) {
      var keys = Object.keys(groups), val = function (k) { return mf ? groups[k].reduce(function (s, r) { return s + P().num(r[mf.k]); }, 0) : groups[k].length; };
      keys.sort(function (a, b) { return val(b) - val(a); }); var top = keys.slice(0, 10), tot = top.reduce(function (s, k) { return s + val(k); }, 0) || 1;
      var fmt = function (n) { return mf ? P().inrShort(n) : n; };
      if (st.ch === 'pie') {
        var a0 = 0; var segs = top.map(function (k, i) { var a1 = a0 + val(k) / tot * 360; var s = COL[i % 10] + ' ' + a0 + 'deg ' + a1 + 'deg'; a0 = a1; return s; }).join(',');
        return '<div class="rb-pie"><i style="background:conic-gradient(' + segs + ')"></i><ul>' + top.map(function (k, i) { return '<li><b style="background:' + COL[i % 10] + '"></b>' + P().esc(k) + '<span>' + fmt(val(k)) + ' · ' + Math.round(val(k) / tot * 100) + '%</span></li>'; }).join('') + '</ul></div>';
      }
      var mx = Math.max.apply(null, top.map(val).concat([1]));
      return '<div class="rb-bars">' + top.map(function (k, i) { return '<div><span>' + P().esc(k) + '</span><i><b style="width:' + Math.max(2, val(k) / mx * 100) + '%;background:' + COL[i % 10] + '"></b></i><em>' + fmt(val(k)) + '</em></div>'; }).join('') + '</div>';
    }
    var last = '';
    function render() {
      var e = E(), cs = cols(e).filter(function (f) { return st.cols.indexOf(f.k) > -1; }), rows = filtered(), rg = range();
      if (!cs.length) cs = cols(e).slice(0, 4);
      var mcols = cs.filter(money), mf = mcols[0];
      var cell = function (f, r) { var v = r[f.k]; if (f.k === 'status') return P().esc(v || ''); return P().fval(f, v, false); };
      var head = '<tr>' + cs.map(function (f) { return '<th' + (money(f) || f.t === 'number' ? ' class="r"' : '') + '>' + P().esc(f.l) + '</th>'; }).join('') + '</tr>';
      var line = function (r) { return '<tr>' + cs.map(function (f) { return '<td' + (money(f) || f.t === 'number' ? ' class="r"' : '') + '>' + cell(f, r) + '</td>'; }).join('') + '</tr>'; };
      var totRow = function (list, label) { if (!st.tot || !mcols.length) return ''; return '<tr class="rb-tot">' + cs.map(function (f, i) { return '<td' + (money(f) ? ' class="r"' : '') + '>' + (money(f) ? P().inr(list.reduce(function (s, r) { return s + P().num(r[f.k]); }, 0)) : i === 0 ? P().esc(label) : '') + '</td>'; }).join('') + '</tr>'; };
      var body = '', groups = null;
      if (st.g) {
        groups = {}; rows.forEach(function (r) { var g = r[st.g] || '(blank)'; (groups[g] = groups[g] || []).push(r); });
        body = Object.keys(groups).sort().map(function (g) { return '<tr class="rb-gh"><td colspan="' + cs.length + '">' + P().esc(g) + ' <small>' + groups[g].length + ' record(s)</small></td></tr>' + groups[g].map(line).join('') + totRow(groups[g], 'Sub-total'); }).join('');
      } else body = rows.map(line).join('');
      var u = P().S.sess.user;
      var sum = '<div class="rb-sum"><div><small>Records</small><b>' + rows.length + '</b></div>' + mcols.slice(0, 3).map(function (f) { return '<div><small>' + P().esc(f.l) + '</small><b>' + P().inr(rows.reduce(function (s, r) { return s + P().num(r[f.k]); }, 0)) + '</b></div>'; }).join('') + (groups ? '<div><small>Groups</small><b>' + Object.keys(groups).length + '</b></div>' : '') + '</div>';
      var html = '<div class="rb-doc"><div class="rb-h"><h2>' + P().esc(st.ti || e.title) + '</h2><p>' + P().esc(e.title) + (st.df && (rg[0] || rg[1]) ? ' · ' + P().esc((cols(e).filter(function (f) { return f.k === st.df; })[0] || {}).l || '') + ': ' + (rg[0] ? P().fdate(rg[0]) : '…') + ' to ' + (rg[1] ? P().fdate(rg[1]) : '…') : '') + (st.q ? ' · search "' + P().esc(st.q) + '"' : '') + ' · prepared by ' + P().esc(u.name) + ' on ' + P().fdate(P().today()) + '</p></div>' + sum +
        (groups && st.ch ? chart(groups, mf) : '') +
        (rows.length ? '<table class="rb-t"><thead>' + head + '</thead><tbody>' + body + '</tbody>' + (st.tot && mcols.length ? '<tfoot>' + totRow(rows, 'Grand total') + '</tfoot>' : '') + '</table>' : '<p class="note" style="padding:20px">No records match these filters.</p>') +
        (st.sig ? '<div class="rb-sig"><div>Prepared by</div><div>Checked by</div><div>Approved by</div></div>' : '') + '</div>';
      $('rbBody').innerHTML = html; last = html;
      $('rbN').textContent = rows.length + ' of ' + data.length + ' records';
    }
    $('rbPr').onclick = function () { P().printHtml('<style>.rb-doc h2{font:800 15pt Arial;margin:0;color:#00175F}.rb-doc .rb-h p{font-size:9pt;color:#555;margin:2px 0 8px}.rb-sum{display:flex;gap:6mm;margin:4mm 0}.rb-sum div{border:1px solid #ccd;border-radius:3mm;padding:2mm 4mm}.rb-sum small{display:block;font-size:7.5pt;color:#666}.rb-sum b{font-size:11pt}.rb-t{width:100%;border-collapse:collapse;font-size:8.5pt}.rb-t th{background:#00175F;color:#fff;padding:4px 5px;text-align:left}.rb-t td{border-bottom:1px solid #ddd;padding:4px 5px}.r{text-align:right}.rb-gh td{background:#EEF3FF;font-weight:bold}.rb-tot td{font-weight:bold;background:#F7F7F7}tfoot td{font-weight:bold;border-top:2px solid #000}.rb-bars div{display:grid;grid-template-columns:40mm 1fr 25mm;gap:3mm;align-items:center;font-size:8.5pt;margin:1.5mm 0}.rb-bars i{height:3.5mm;background:#eee;border-radius:2mm;overflow:hidden}.rb-bars b{display:block;height:100%}.rb-bars em{font-style:normal;text-align:right}.rb-pie{display:flex;gap:8mm;align-items:center;margin:3mm 0}.rb-pie i{width:38mm;height:38mm;border-radius:50%;display:block}.rb-pie ul{list-style:none;margin:0;padding:0;font-size:8.5pt}.rb-pie li{display:flex;gap:2mm;align-items:center;margin:1mm 0}.rb-pie li b{width:3mm;height:3mm;border-radius:1mm;display:inline-block}.rb-pie li span{margin-left:auto;padding-left:4mm;color:#555}.rb-sig{display:flex;gap:10mm;margin-top:18mm}.rb-sig div{flex:1;border-top:1px solid #000;text-align:center;padding-top:2mm;font-size:9pt;font-weight:bold}</style>' + last, { title: st.ti || 'Report', landscape: st.cols.length > 7 }); };
    $('rbXls').onclick = function () {
      if (window.PE_CANDL && !window.PE_CANDL()) return P().toast('You do not have download rights. Ask your Super Admin.', true);
      var doc = '<html><head><meta charset="utf-8"><style>body{font-family:Calibri,Arial}h2{color:#00249C}table{border-collapse:collapse}th{background:#00249C;color:#fff}td,th{border:1px solid #bbb;padding:4px 6px}.rb-gh td{background:#EEF3FF;font-weight:bold}.rb-tot td,tfoot td{font-weight:bold}</style></head><body><h2>Port Energy Private Limited</h2>' + last.replace(/<div class="rb-(bars|pie)[\s\S]*?<\/div><\/div>/, '') + '</body></html>';
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + doc], { type: 'application/vnd.ms-excel' })); a.download = (st.ti || 'report').replace(/[^\w]+/g, '-') + '-' + P().today() + '.xls'; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 2000);
    };
    function start() {
      controls(); P().skeleton($('rbBody'), 5);
      var S = P().S, k = st.k;
      (S.cache[k] ? Promise.resolve(S.cache[k]) : P().call('listRecords', S.token, k).then(function (r) { S.cache[k] = r.rows; return r.rows; })).then(function (rows) { if (st.k !== k) return; data = rows || []; read(); render(); })
        .catch(function (e) { $('rbBody').innerHTML = '<div class="empty"><b>Could not load</b>' + esc(e.message) + '</div>'; });
    }
    start();
  }
  window.PE_VIEWS = window.PE_VIEWS || {};
  window.PE_VIEWS.rbuild = builder;
  /* big "build your own" card on top of the Reports page */
  new MutationObserver(function () {
    var g = document.querySelector('.pe-rgrid'); if (!g || document.querySelector('.rb-cta')) return;
    g.insertAdjacentHTML('beforebegin', '<button class="rb-cta" id="rbCta"><span class="lh-ic">' + P().icon('ledger', 22) + '</span><span><b>Custom report builder</b><small>Any module · date range · status · search · columns · group · sort · totals · charts · Excel / PDF</small></span><em>Open ›</em></button>');
    $('rbCta').onclick = function () { P().go({ v: 'rbuild' }); };
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
