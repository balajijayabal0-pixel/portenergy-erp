/* © 2026 Port Energy Private Limited. All rights reserved. Proprietary and confidential. */
/**
 * PORT ENERGY ERP - Smart tools (client-side, free, no API key)
 *  1. Item Finder      - meaning/fuzzy search over the item master ("4 inch cutting wheel" finds "AG4 Cutting Disc 100mm")
 *  2. Voice Indent     - speak or type "50 bag cement, 20 litre diesel urgent" -> review -> opens the Indent (PR) form filled
 *  3. Temporary ID     - photo + name ID card (front and back), printed on A4
 * Nothing is sent anywhere. Item data comes from the lists the ERP already loaded for the signed-in user.
 */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function P() { return window.PE; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- matching ---------- */
  var SYN = { disc: 'wheel', discs: 'wheel', wheels: 'wheel', ltr: 'litre', liter: 'litre', litres: 'litre', liters: 'litre', lit: 'litre',
    mtr: 'meter', metre: 'meter', meters: 'meter', metres: 'meter', mtrs: 'meter', kgs: 'kg', nos: 'no', pcs: 'no', pc: 'no', piece: 'no', pieces: 'no',
    sandpaper: 'sand paper', bags: 'bag', rolls: 'roll', boxes: 'box', sheets: 'sheet', cans: 'can', drums: 'drum', electrodes: 'electrode', rods: 'rod',
    grinder: 'grinding', ag: 'grinder', 'in': 'inch', inches: 'inch', '"': 'inch' };
  var INCH_MM = { 1: 25, 2: 50, 3: 75, 4: 100, 5: 125, 6: 150, 8: 200, 10: 250, 12: 300 };
  function tokens(s) {
    s = String(s || '').toLowerCase().replace(/["”″]/g, ' inch ').replace(/(\d)([a-z])/g, '$1 $2').replace(/([a-z])(\d)/g, '$1 $2').replace(/[^a-z0-9. ]+/g, ' ');
    var raw = s.split(/\s+/).filter(Boolean), out = [];
    raw.forEach(function (t, i) {
      if (SYN[t]) t = SYN[t];
      t.split(' ').forEach(function (u) { if (u.length > 3 && u.slice(-1) === 's' && !/^\d/.test(u)) u = u.slice(0, -1); out.push(u); });
      if (t === 'inch' && i > 0 && INCH_MM[raw[i - 1]]) out.push(String(INCH_MM[raw[i - 1]]), 'mm');
    });
    return out;
  }
  function tri(s) { s = ' ' + String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' '; var m = {}, n = 0; for (var i = 0; i < s.length - 2; i++) { var g = s.substr(i, 3); m[g] = (m[g] || 0) + 1; n++; } return { m: m, n: n }; }
  function dice(a, b) { if (!a.n || !b.n) return 0; var hit = 0; Object.keys(a.m).forEach(function (g) { if (b.m[g]) hit += Math.min(a.m[g], b.m[g]); }); return 2 * hit / (a.n + b.n); }
  function lev(a, b) { if (Math.abs(a.length - b.length) > 2) return 9; var p = [], i, j; for (j = 0; j <= b.length; j++) p[j] = j; for (i = 1; i <= a.length; i++) { var c = [i]; for (j = 1; j <= b.length; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[b.length]; }
  var idx = null, idxKey = '';
  function items() {
    var list = (P() && P().S && P().S.opts && P().S.opts.items) || [], key = list.length + ':' + (list[0] && list[0].v) + ':' + (list[list.length - 1] && list[list.length - 1].v);
    if (idx && idxKey === key) return idx;
    idx = list.map(function (o) { var name = String(o.v || ''); return { o: o, name: name, tk: tokens(name + ' ' + (o.l || '') + ' ' + (o.d || '')), tr: tri(name) }; });
    idxKey = key; return idx;
  }
  function search(q, max) {
    var qt = tokens(q); if (!qt.length) return [];
    var qtr = tri(q), res = [];
    items().forEach(function (it) {
      var hit = 0, partial = 0;
      qt.forEach(function (t) {
        if (it.tk.indexOf(t) >= 0) hit += /^\d/.test(t) ? 1.3 : 1;
        else if (t.length > 2 && it.tk.some(function (x) { return x.indexOf(t) === 0 || t.indexOf(x) === 0 && x.length > 2; })) partial += .6;
        else if (t.length > 3 && it.tk.some(function (x) { return x.length > 3 && lev(t, x) <= (t.length > 6 ? 2 : 1); })) partial += .7;
      });
      var cover = (hit + partial) / qt.length, sc = cover * .7 + dice(qtr, it.tr) * .3;
      if (sc > .28) res.push({ it: it, sc: sc });
    });
    res.sort(function (a, b) { return b.sc - a.sc; });
    return res.slice(0, max || 6);
  }

  /* ---------- voice / text -> indent lines ---------- */
  var NUMW = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, fifty: 50, hundred: 100 };
  var QU = 'bags?|litres?|liters?|ltrs?|ltr|kgs?|nos|no|pcs|pc|pieces?|mtrs?|meters?|metres?|boxe?s?|rolls?|sets?|packets?|bundles?|tonnes?|tons?|sheets?|cans?|drums?|pairs?|cartons?|buckets?';
  var UOM = { bag: 'Bag', litre: 'Ltr', liter: 'Ltr', ltr: 'Ltr', kg: 'Kg', no: 'Nos', nos: 'Nos', pc: 'Nos', pcs: 'Nos', piece: 'Nos', mtr: 'Mtr', meter: 'Mtr', metre: 'Mtr', box: 'Box', roll: 'Roll', set: 'Set', packet: 'Packet', bundle: 'Bundle', tonne: 'Ton', ton: 'Ton', sheet: 'Sheet', can: 'Can', drum: 'Drum', pair: 'Pair', carton: 'Carton', bucket: 'Bucket' };
  function uomOf(u) { u = String(u || '').toLowerCase(); return UOM[u] || UOM[u.replace(/es$/, '')] || UOM[u.replace(/s$/, '')] || ''; }
  function parse(text) {
    var t = String(text || '').toLowerCase().replace(/\b(please|need|want|we need|i need|required|requirement)\b/g, ' ');
    var urgent = /\burgent(ly)?\b|\bimmediate(ly)?\b|\basap\b/.test(t);
    t = t.replace(/\b(urgent(ly)?|immediate(ly)?|asap)\b/g, ' ');
    Object.keys(NUMW).forEach(function (w) { t = t.replace(new RegExp('\\b' + w + '\\b', 'g'), String(NUMW[w])); });
    var parts = t.split(/[,;\n]+|\.\s+|\band\b|\bthen\b|\balso\b/).map(function (x) { return x.trim(); }).filter(function (x) { return /[a-z]/.test(x); });
    var lines = parts.map(function (p) {
      var qty = '', uom = '', m = p.match(new RegExp('(\\d+(?:\\.\\d+)?)\\s*(' + QU + ')\\b'));
      if (m) { qty = m[1]; uom = uomOf(m[2]); p = p.replace(m[0], ' '); }
      else { var m2 = p.match(/^(\d+(?:\.\d+)?)\s+(?!inch|mm|in\b|")/); if (m2) { qty = m2[1]; p = p.replace(m2[0], ' '); } }
      p = p.replace(/\b(of|for|the|a|an)\b/g, ' ').replace(/\s+/g, ' ').trim();
      return { text: p, qty: qty || '1', uom: uom, qtyGuess: !qty };
    }).filter(function (l) { return l.text; });
    return { urgent: urgent, lines: lines };
  }

  /* ---------- UI ---------- */
  function style() {
    if ($('#peSmartStyle')) return;
    document.head.insertAdjacentHTML('beforeend', '<style id="peSmartStyle">' +
      '.pesm{width:min(820px,95vw);max-height:92vh;overflow:auto}.pesm .mh{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.pesm .x{border:0;background:#eef2f8;border-radius:10px;width:34px;height:34px;font-size:18px;cursor:pointer}' +
      '.pesm-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px}.pesm-tabs button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 14px;font-weight:700;cursor:pointer}.pesm-tabs button.on{background:var(--navy);color:#fff;border-color:var(--navy)}' +
      '.pesm .hit{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px 12px;border:1px solid var(--line);border-radius:12px;margin:6px 0;background:#fff}.pesm .hit b{display:block}.pesm .hit small{color:var(--muted)}' +
      '.pesm .row2{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}.pesm .in{width:100%}.pesm textarea.in{min-height:84px}' +
      '.pesm .rec{background:var(--magenta)!important;color:#fff!important}.pesm .tb input.in,.pesm .tb select.in{padding:6px 8px}.pesm .warn{color:var(--warn);font-size:12px}' +
      '.pesm .pv{display:flex;gap:12px;flex-wrap:wrap;margin-top:12px}.idc{width:324px;height:204px;border-radius:12px;overflow:hidden;position:relative;background:#fff;border:1px solid var(--line);font-size:11px}' +
      '[data-theme=dark] .pesm .hit,body.dark .pesm .hit{background:rgba(255,255,255,.06)}</style>');
  }
  function add() {
    if ($('#peSmart')) return; var a = $('#peCalc') || $('#refreshBtn'); if (!a) return;
    a.insertAdjacentHTML('beforebegin', '<button class="btn soft sm" id="peSmart" type="button" aria-label="Smart tools" title="Item Finder · Voice Indent · Temporary ID" style="display:inline-flex;align-items:center;justify-content:center"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><path d="M11 8v6M8 11h6"/></svg></button>');
    $('#peSmart').onclick = function () { open('find'); };
  }

  function open(tab) {
    style();
    var host = document.createElement('div'); host.className = 'modal open'; document.body.appendChild(host);
    var rec = null;
    function close() { try { if (rec) rec.stop(); } catch (x) { } host.remove(); }
    function shell(inner) {
      var T = [['find', 'Item Finder'], ['voice', 'Voice Indent'], ['id', 'Temporary ID']];
      host.innerHTML = '<div class="glass box pesm"><div class="mh"><h3>Smart tools</h3><button class="x" aria-label="Close">×</button></div><div class="pesm-tabs">' +
        T.map(function (t) { return '<button data-t="' + t[0] + '" class="' + (t[0] === tab ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div><div id="pesmBody">' + inner + '</div></div>';
      host.querySelector('.x').onclick = close; host.onclick = function (e) { if (e.target === host) close(); };
      host.querySelectorAll('.pesm-tabs [data-t]').forEach(function (b) { b.onclick = function () { try { if (rec) rec.stop(); } catch (x) { } tab = this.getAttribute('data-t'); draw(); }; });
    }
    function indent(lines, urgent) {
      close();
      P().openForm('pr', null, { purpose: (urgent ? 'URGENT - ' : '') + 'Site requirement', lines: lines });
    }

    /* 1. Item Finder */
    function drawFind() {
      var n = items().length;
      shell('<p class="note" style="margin:0 0 8px">Type in your own words. It matches by meaning and size ("4 inch" = 100 mm), not exact spelling.' + (n ? ' ' + n + ' items in master.' : '') + '</p>' +
        '<input class="in" id="smQ" placeholder="e.g. 4 inch cutting wheel" autocomplete="off"><div id="smR" style="margin-top:8px"></div>');
      if (!n) { $('#smR', host).innerHTML = '<div class="empty"><b>Item master not available</b>Your login has no item list loaded yet. Refresh the app and try again.</div>'; return; }
      var q = $('#smQ', host); q.focus();
      function run() {
        var v = q.value.trim(), box = $('#smR', host); if (!v) { box.innerHTML = ''; return; }
        var r = search(v, 8);
        box.innerHTML = r.length ? r.map(function (x, i) {
          var o = x.it.o; return '<div class="hit"><div><b>' + esc(x.it.name) + '</b><small>' + [o.uom && 'UOM ' + o.uom, o.hsn && 'HSN ' + o.hsn, o.last && 'Last rate ' + o.last + (o.lv ? ' (' + o.lv + ')' : '')].filter(Boolean).map(esc).join(' · ') + '</small></div><button class="btn sm" data-i="' + i + '">Add to Indent</button></div>';
        }).join('') : '<div class="empty"><b>No close match</b>This looks like a new item. Check spelling or ask Admin to add it to the item master before raising an order, so a duplicate is not created.</div>';
        box.querySelectorAll('[data-i]').forEach(function (b) { b.onclick = function () { var o = r[+this.getAttribute('data-i')].it; indent([{ item: o.name, qty: 1, uom: o.o.uom || '' }]); }; });
      }
      q.oninput = P().debounce ? P().debounce(run, 120) : run;
    }

    /* 2. Voice Indent */
    function drawVoice(prefill) {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      shell('<p class="note" style="margin:0 0 8px">Tap the mic and speak, or type. Example: <i>50 bag cement, 20 litre diesel, 4 inch cutting wheel 10 nos urgent</i>. You review everything before the Indent opens.</p>' +
        '<textarea class="in" id="smT" placeholder="Speak or type the requirement">' + esc(prefill || '') + '</textarea>' +
        '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">' + (SR ? '<button class="btn soft" id="smMic" type="button">🎤 Speak</button>' : '') + '<button class="btn" id="smGo" type="button">Read lines</button></div>' +
        (SR ? '' : '<p class="warn">This browser has no voice typing. Type the lines, or use Chrome / Edge on the phone.</p>') + '<div id="smR" style="margin-top:12px"></div>');
      var t = $('#smT', host), mic = $('#smMic', host);
      if (mic) mic.onclick = function () {
        if (rec) { try { rec.stop(); } catch (x) { } return; }
        rec = new SR(); rec.lang = 'en-IN'; rec.interimResults = true; rec.continuous = true; var base = t.value ? t.value.trim() + ', ' : '';
        rec.onresult = function (e) { var s = ''; for (var i = 0; i < e.results.length; i++) s += e.results[i][0].transcript + ' '; t.value = base + s.trim(); };
        rec.onend = function () { rec = null; mic.classList.remove('rec'); mic.textContent = '🎤 Speak'; };
        rec.onerror = function () { try { rec.stop(); } catch (x) { } };
        try { rec.start(); mic.classList.add('rec'); mic.textContent = '■ Stop'; } catch (x) { rec = null; }
      };
      $('#smGo', host).onclick = function () {
        try { if (rec) rec.stop(); } catch (x) { }
        var p = parse(t.value), box = $('#smR', host);
        if (!p.lines.length) { box.innerHTML = '<div class="empty"><b>Nothing to read</b>Say or type at least one item with quantity.</div>'; return; }
        var rows = p.lines.map(function (l) { return { l: l, m: search(l.text, 3) }; });
        box.innerHTML = '<div style="overflow:auto"><table class="tb"><thead><tr><th>#</th><th>Heard</th><th>Item from master</th><th>Qty</th><th>UOM</th></tr></thead><tbody>' + rows.map(function (r, i) {
          return '<tr data-i="' + i + '"><td>' + (i + 1) + '</td><td>' + esc(r.l.text) + '</td><td><select class="in sel">' + r.m.map(function (x, j) { return '<option value="' + esc(x.it.name) + '"' + (j ? '' : ' selected') + '>' + esc(x.it.name) + '</option>'; }).join('') + '<option value="">Use as typed (new item)</option></select></td>' +
            '<td><input class="in qty" type="number" min="0" step="any" style="width:80px" value="' + esc(r.l.qty) + '">' + (r.l.qtyGuess ? '<div class="warn">qty not heard</div>' : '') + '</td><td><input class="in uom" style="width:80px" value="' + esc(r.l.uom || (r.m[0] && r.m[0].it.o.uom) || '') + '"></td></tr>';
        }).join('') + '</tbody></table></div><label style="display:flex;gap:8px;align-items:center;margin:10px 0"><input type="checkbox" id="smU"' + (p.urgent ? ' checked' : '') + '> Mark as urgent</label>' +
          '<div class="mfoot"><button class="btn" id="smMake">Open Indent (PR) with these lines</button></div>';
        $('#smMake', host).onclick = function () {
          var out = [];
          box.querySelectorAll('tbody tr').forEach(function (tr) {
            var r = rows[+tr.getAttribute('data-i')], sel = tr.querySelector('select').value, q = Number(tr.querySelector('.qty').value);
            if (!(q > 0)) return;
            var hit = sel && r.m.filter(function (x) { return x.it.name === sel; })[0], ln = { item: sel || r.l.text, qty: q, uom: tr.querySelector('.uom').value.trim() };
            if (hit && hit.it.o.hsn) ln.hsn = hit.it.o.hsn;
            out.push(ln);
          });
          if (!out.length) { P().toast('Enter a quantity for at least one line.'); return; }
          indent(out, $('#smU', host).checked);
        };
      };
      if (prefill) $('#smGo', host).click();
    }

    /* 3. Temporary ID */
    var photo = '';
    function drawId() {
      var co = (P().S.sess && P().S.sess.config && P().S.sess.config.companies && P().S.sess.config.companies[0]) || {};
      var seq = 1, yy = new Date().toISOString().slice(2, 7).replace('-', ''); try { seq = (Number(localStorage.getItem('pe_tid_' + yy)) || 0) + 1; } catch (x) { }
      var today = (P().S.sess && P().S.sess.today) || new Date().toISOString().slice(0, 10);
      shell('<div class="row2"><div><label class="f">Name</label><input class="in" id="idN"></div><div><label class="f">Designation / Trade</label><input class="in" id="idD" placeholder="e.g. Welder, Painter, Helper"></div>' +
        '<div><label class="f">Company</label><input class="in" id="idC" value="' + esc(co.name || 'Port Energy Private Limited') + '"></div><div><label class="f">Site / Project</label><input class="in" id="idS"></div>' +
        '<div><label class="f">ID No.</label><input class="in" id="idI" value="TMP-' + yy + '-' + String(seq).padStart(3, '0') + '"></div><div><label class="f">Blood group (optional)</label><input class="in" id="idB" maxlength="4"></div>' +
        '<div><label class="f">Valid from</label><input class="in" type="date" id="idF" value="' + esc(today) + '"></div><div><label class="f">Valid till</label><input class="in" type="date" id="idT"></div>' +
        '<div><label class="f">Emergency contact (optional)</label><input class="in" id="idE" inputmode="tel"></div><div><label class="f">Photo</label><input class="in" type="file" id="idP" accept="image/*" capture="user"></div></div>' +
        '<div class="mfoot"><button class="btn" id="idGo">Print ID card (A4)</button></div><p class="note">Cut along the border. Front and back print side by side so it can be folded and laminated.</p><div class="pv" id="idPv"></div>');
      var pv = $('#idPv', host);
      function V(id) { return ($('#' + id, host).value || '').trim(); }
      function card() {
        var lg = window.LOGO_MARK || '', until = V('idT'), fd = function (d) { return d ? d.split('-').reverse().join('-') : '—'; };
        var front = '<div class="idc"><div style="background:linear-gradient(120deg,#F0006C,#00249C);height:46px;color:#fff;display:flex;align-items:center;gap:8px;padding:0 10px">' + (lg ? '<img src="' + lg + '" alt="" style="height:30px;background:#fff;border-radius:6px;padding:2px">' : '') + '<div style="font-weight:800;font-size:11px;line-height:1.2">' + esc(V('idC')) + '<div style="font-weight:600;font-size:8.5px;opacity:.9">TEMPORARY IDENTITY CARD</div></div></div>' +
          '<div style="display:flex;gap:10px;padding:10px"><div style="width:76px;height:96px;border:1px solid #cfd6ea;border-radius:6px;background:#f1f4fb center/cover no-repeat' + (photo ? ';background-image:url(' + photo + ')' : '') + '"></div><div style="flex:1;min-width:0;line-height:1.35"><div style="font-size:14px;font-weight:800;color:#121B54;word-break:break-word">' + esc(V('idN') || 'Name') + '</div><div style="font-weight:700;color:#00249C">' + esc(V('idD')) + '</div>' +
          '<div style="margin-top:4px">Site: <b>' + esc(V('idS') || '—') + '</b></div><div>ID: <b>' + esc(V('idI')) + '</b>' + (V('idB') ? ' · Blood: <b>' + esc(V('idB')) + '</b>' : '') + '</div><div>Valid: <b>' + fd(V('idF')) + '</b> to <b>' + fd(until) + '</b></div></div></div>' +
          '<div style="position:absolute;left:0;right:0;bottom:0;height:7px;background:linear-gradient(90deg,#00B49C,#0084F0,#00249C,#F0006C)"></div></div>';
        var back = '<div class="idc" style="padding:12px 14px;line-height:1.45"><b style="color:#00249C">Terms</b><ol style="margin:4px 0 0 16px;padding:0;font-size:9.5px"><li>This card is temporary and valid only for the period shown.</li><li>Wear it visibly at all times inside the site.</li><li>It is not transferable. Report loss to the site office at once.</li><li>Return it to the company on completion of work.</li></ol>' +
          (V('idE') ? '<div style="margin-top:6px">Emergency: <b>' + esc(V('idE')) + '</b></div>' : '') + '<div style="position:absolute;left:14px;right:14px;bottom:16px;display:flex;justify-content:space-between;font-size:9px"><span style="border-top:1px solid #444;padding-top:2px">Holder signature</span><span style="border-top:1px solid #444;padding-top:2px">Authorised signatory</span></div>' +
          '<div style="position:absolute;left:0;right:0;bottom:0;height:7px;background:linear-gradient(90deg,#00B49C,#0084F0,#00249C,#F0006C)"></div></div>';
        return front + back;
      }
      function pvDraw() { pv.innerHTML = card(); }
      host.querySelectorAll('#pesmBody input').forEach(function (i) { if (i.type !== 'file') i.oninput = pvDraw; });
      $('#idP', host).onchange = function () {
        var f = this.files && this.files[0]; if (!f) return; var r = new FileReader();
        r.onload = function () { var im = new Image(); im.onload = function () { var c = document.createElement('canvas'), w = 300, h = 380, s = Math.max(w / im.width, h / im.height); c.width = w; c.height = h; var g = c.getContext('2d'); g.drawImage(im, (w - im.width * s) / 2, (h - im.height * s) / 2, im.width * s, im.height * s); photo = c.toDataURL('image/jpeg', .85); pvDraw(); }; im.src = r.result; };
        r.readAsDataURL(f);
      };
      pvDraw();
      $('#idGo', host).onclick = function () {
        if (!V('idN')) { P().toast('Enter the name.'); return; }
        var h = '<!doctype html><html><head><meta charset="utf-8"><title>Temporary ID - ' + esc(V('idN')) + '</title><style>@page{size:A4;margin:12mm}body{margin:0;font-family:Manrope,Arial,sans-serif;color:#121B54}.w{display:flex;gap:6mm;flex-wrap:wrap}.idc{width:85.6mm;height:54mm;border:.3mm dashed #888;border-radius:3mm;overflow:hidden;position:relative;background:#fff;font-size:8.2pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}.idc img{max-width:none}</style></head><body><div class="w">' + card().replace(/width:76px;height:96px/g, 'width:20mm;height:26mm').replace(/font-size:14px/g, 'font-size:11pt').replace(/font-size:11px/g, 'font-size:8.5pt') + '</div></body></html>';
        var old = document.querySelector('iframe.pf'); if (old) old.remove();
        var f = document.createElement('iframe'); f.className = 'pf'; document.body.appendChild(f);
        var d = f.contentWindow.document; d.open(); d.write(h); d.close();
        try { localStorage.setItem('pe_tid_' + yy, String(seq)); } catch (x) { }
        setTimeout(function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (x) { P().toast('Print is not available here.'); } }, 400);
      };
    }
    function draw() { if (tab === 'voice') drawVoice(); else if (tab === 'id') drawId(); else drawFind(); }
    draw();
  }
  window.PE_SMART = { search: search, parse: parse, open: open };
  new MutationObserver(add).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add); else add();
})();
