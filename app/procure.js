/* © 2026 Port Energy Private Limited. All rights reserved. Proprietary and confidential. */
/**
 * PORT ENERGY ERP - PROCUREMENT v7 screens (MD review, Nov 2026)
 *  - Order form: Purchase Order shows supply terms, Work / Service Order shows work terms
 *  - "Tick to open" boxes for Scope of Work (prints only when ticked + filled)
 *  - Vendor picked -> order type set (Supplier = PO, Service = Work Order, Both = choose)
 *  - Vendor form: PAN 4th letter -> PAN holder type, 32-character name counter
 *  - Bill: TDS section -> TDS % from the TDS master and the vendor's PAN type
 */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var PAN = { P: 'Individual / Proprietor', H: 'HUF', C: 'Company', F: 'Firm / LLP', A: 'Trust / AOP / BOI', B: 'Trust / AOP / BOI', T: 'Trust / AOP / BOI', J: 'Trust / AOP / BOI', G: 'Government', L: 'Government' };
  function opts(list) { try { return (window.PE && PE.S.opts && PE.S.opts[list]) || []; } catch (x) { return []; } }
  function find(list, v) { return opts(list).filter(function (o) { return o.v === v; })[0] || null; }
  function wrapOf(k) { var el = $('pane') && $('pane').querySelector('.fgrid [data-k="' + k + '"]'); return el ? { el: el, box: el.parentElement } : null; }
  function isWo(t) { return t === 'Work Order' || t === 'Service Order'; }

  /* show / hide fields of the order form */
  function applyPo(F) {
    var wo = isWo(F.rec.orderType);
    F.e.fields.forEach(function (f) {
      var w = wrapOf(f.k); if (!w) return;
      var show = true;
      if (f.only === 'wo') show = wo;
      if (f.only === 'supply') show = !wo;
      if (f.showIf) { var p = f.showIf.split('='); show = show && F.rec[p[0]] === p[1]; }
      w.box.style.display = show ? '' : 'none';
    });
  }
  /* "tick to open" boxes */
  function tickify(F) {
    F.e.fields.forEach(function (f) {
      if (!f.tick) return;
      var w = wrapOf(f.k); if (!w || w.box.querySelector('.pe-tick')) return;
      var on = String(F.rec[f.k] || '').trim() !== '';
      var lab = document.createElement('label');
      lab.className = 'pe-tick';
      lab.style.cssText = 'display:flex;align-items:center;gap:8px;font-weight:600;cursor:pointer;margin-bottom:6px';
      lab.innerHTML = '<input type="checkbox"' + (on ? ' checked' : '') + ' style="width:18px;height:18px"> <span>Include ' + f.l.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span>';
      w.box.insertBefore(lab, w.box.firstChild);
      var label = w.box.querySelector('label.f');
      var set = function (vis) { w.el.style.display = vis ? '' : 'none'; if (label) label.style.display = vis ? '' : 'none'; };
      set(on);
      if (f.max) w.el.setAttribute('maxlength', f.max);
      w.el.rows = 6;
      lab.querySelector('input').onchange = function () {
        set(this.checked);
        if (!this.checked) { F.rec[f.k] = ''; w.el.value = ''; } else w.el.focus();
      };
    });
  }
  /* vendor name counter (32 characters) */
  function counter(F, k, max) {
    var w = wrapOf(k); if (!w) return;
    w.el.setAttribute('maxlength', max);
    var h = w.box.querySelector('[data-hint="' + k + '"]');
    var up = function () { if (h) h.textContent = (w.el.value || '').length + ' / ' + max + ' characters' + (k === 'name' ? ' - use line 2 for the rest' : ''); };
    w.el.addEventListener('input', up); up();
  }

  var prevOpen = window.PE_FORM_OPEN;
  window.PE_FORM_OPEN = function (key, F, isNew, setField) {
    if (prevOpen) try { prevOpen.apply(this, arguments); } catch (x) { }
    try {
      if (key === 'po') {
        tickify(F); applyPo(F);
        ['orderType', 'paymentTerms', 'deliveryTerm'].forEach(function (k) {
          var w = wrapOf(k); if (w) w.el.addEventListener('change', function () { F.rec[k] = w.el.value; applyPo(F); });
        });
        F.e.fields.forEach(function (f) { if (f.lock) { var w = wrapOf(f.k); if (w) { var h = w.box.querySelector('[data-hint="' + f.k + '"]'); if (h) h.textContent = 'Standard legal clause - always printed, cannot be changed.'; } } });
        if (F.rec.vendor && isNew) window.PE_FIELD_CHANGE(F, 'vendor', setField);
      }
      if (key === 'vendors') { counter(F, 'name', 32); counter(F, 'name2', 32); }
    } catch (x) { console.error(x); }
  };

  window.PE_FIELD_CHANGE = function (F, k, setField, setHint) {
    var r = F.rec, hint = setHint || function () { };
    if (F.key === 'po' && k === 'vendor') {
      var v = find('vendors', r.vendor); if (!v) return;
      if (v.st && v.st !== 'Approved') hint('vendor', 'This vendor is "' + v.st + '". Only approved vendors can get orders.', 'bad');
      else hint('vendor', v.vt ? v.vt + ' vendor' + (v.vt === 'Both' ? ' - choose Purchase / Work / Service Order' : '') : '', 'ok');
      if (v.vt === 'Supplier') setField('orderType', 'Purchase Order');
      else if (v.vt === 'Service' && !isWo(r.orderType)) setField('orderType', 'Work Order');
      applyPo(F);
    }
    if (F.key === 'po' && k === 'orderType') applyPo(F);
    if (F.key === 'vendors' && k === 'pan') {
      var t = PAN[String(r.pan || '').toUpperCase().charAt(3)];
      if (t && /^[A-Z]{5}\d{4}[A-Z]$/i.test(r.pan || '')) { setField('entityType', t); hint('pan', 'PAN holder type: ' + t + '. Now check the name and address on the Income Tax / GST portal.', 'ok'); }
    }
    if (F.key === 'bills' && (k === 'tdsSection' || k === 'vendor')) {
      var tc = find('tdsCodes', r.tdsSection), vv = find('vendors', r.vendor);
      if (tc && vv) {
        var ind = vv.et === 'Individual / Proprietor' || vv.et === 'HUF';
        var rate = String(ind ? tc.ind : tc.oth);
        setField('tdsPct', rate);
        if (Number(rate) > 0) setField('tds', Math.round(Number(r.taxable || 0) * Number(rate)) / 100);
        hint('tdsSection', tc.nature + ' · ' + rate + '% (' + (vv.et || 'PAN type not set') + ')', 'ok');
      }
      if (vv && vv.rcm === 'Yes') hint('vendor', 'RCM vendor: GST is payable by PEPL under reverse charge.', 'warn');
    }
  };
})();

/* ---------- System page: one-click "Clear demo data" (Super Admin) ---------- */
(function () {
  'use strict';
  var P = function () { return window.PE; };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  window.PE_SYS_EXTRA = function (v) {
    var S = P().S; if (!S.sess || !S.sess.user.admin || v.querySelector('#peDemo')) return;
    var box = document.createElement('div');
    box.className = 'glass panel'; box.id = 'peDemo';
    box.style.cssText = 'margin:0 0 16px;border:1px solid #F3C2D6';
    box.innerHTML = '<h3 style="margin:0 0 6px">Clear demo data</h3><p class="note" style="margin:0 0 12px">Deletes every test entry created <b>before</b> the date below. Users and Departments stay. A full backup copy is made in Drive first.</p>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><label class="note">Keep entries from</label><input class="in" type="date" id="peDemoD" style="max-width:180px" value="' + esc(S.sess.today) + '"><button class="btn danger" id="peDemoGo">Check &amp; clear</button></div>';
    v.insertBefore(box, v.firstChild);
    document.getElementById('peDemoGo').onclick = function () {
      var b = this, d = document.getElementById('peDemoD').value;
      P().busy(b, true, 'Checking');
      P().call('clearDemoPreview', S.token, d).then(function (p) {
        P().busy(b, false);
        var n = p.plan.reduce(function (s, x) { return s + x.del; }, 0);
        P().modal('<h3>Clear demo data before ' + esc(P().fdate(p.cutoff)) + '</h3>' +
          (n ? '<div style="max-height:46vh;overflow:auto"><table class="tb"><thead><tr><th>Module</th><th class="num">Delete</th><th class="num">Keep</th></tr></thead><tbody>' +
            p.plan.filter(function (x) { return x.del; }).map(function (x) { return '<tr><td>' + esc(x.title) + '</td><td class="num"><b>' + x.del + '</b></td><td class="num">' + x.keep + '</td></tr>'; }).join('') +
            '</tbody></table></div><p class="note">Kept: ' + esc(p.keep.join(', ')) + '. A backup copy is saved in Drive before deleting.</p><label class="f">Type DELETE to confirm</label><input class="in" id="peDemoC" autocomplete="off">'
            : '<div class="empty"><b>Nothing to delete</b>No entries before this date.</div>') +
          '<div class="mfoot"><button class="btn soft" data-close>Cancel</button>' + (n ? '<button class="btn danger" id="peDemoYes">Delete ' + n + ' entries</button>' : '') + '</div>');
        var y = document.getElementById('peDemoYes');
        if (y) y.onclick = function () {
          var x = this; P().busy(x, true, 'Deleting');
          P().call('clearDemoData', S.token, p.cutoff, document.getElementById('peDemoC').value).then(function (r) {
            P().closeModal(); P().toast(r.deleted + ' demo entries deleted. Backup: ' + r.backup);
            P().S.cache = {}; P().refreshBoot();
          }).catch(function (z) { P().busy(x, false); P().fail(z); });
        };
      }).catch(function (z) { P().busy(b, false); P().fail(z); });
    };
  };
})();
