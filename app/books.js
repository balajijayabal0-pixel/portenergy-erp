/* © 2026 Port Energy Private Limited. All rights reserved. Proprietary and confidential. */
/**
 * PORT ENERGY ERP - BOOK FORMATS (exact company books, in brand colour)
 *   Cash / Advance Voucher  (A5 landscape)
 *   Delivery Challan        (A4)
 *   Safety / Tool Box Meeting (A4)
 * Layout follows the printed books line by line; filled values print in dark ink.
 */
(function () {
  'use strict';
  var P = function () { return window.PE; };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function nl(s) { return esc(s).replace(/\n/g, '<br>'); }
  function dd(d) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : (d || ''); }
  function amt(v) { return P().num(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function mark() { return window.LOGO_MARK ? '<img class="mk" src="' + window.LOGO_MARK + '" alt="">' : ''; }

  var CO = { name: 'PORT ENERGY PVT LTD', iso: 'An ISO 9001 : 2015 Certified Company',
    addr: 'Old No. 261, New No. 140, 1st Floor, MMS Centre, Thambu Chetty Street, Mannady, Chennai-600 001.',
    addrShort: ['No. 261/140, Thambu Chetty Street, MMS Centre,', '1st Floor, Chennai-600 001. Contact : 95000 56234'],
    contact: 'Contact : 95000 56234 &nbsp; Email : contact@portenergy.in &nbsp; Website : www.portenergy.in',
    cin: 'CIN : U42203TN2025PTC186701 &nbsp;&nbsp;&nbsp; GSTIN : 33AAQCP4155J1Z3' };

  var BASE = '*{box-sizing:border-box}html,body{margin:0}body{font:10pt Arial,Helvetica,sans-serif;color:#0B1546;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    '.v{color:#111;font-weight:bold;font-family:Arial}.pk{color:#E8127C}.mk{display:block}' +
    'table.g{width:100%;border-collapse:collapse}table.g td,table.g th{border:.9pt solid #0B1546;padding:1.6mm 2.2mm;vertical-align:middle;font-size:9.5pt}' +
    '.lb{color:#0B1546;font-weight:bold}.th{background:#E9EDFA;font-weight:bold;text-align:center}.ct{text-align:center}.r{text-align:right}' +
    '.hd{display:grid;grid-template-columns:30mm 1fr 30mm;align-items:center;padding:2mm 3mm;background:linear-gradient(90deg,#F4F6FD,#FFF 40%,#FFF 60%,#FDF1F7)}.hd .mk{height:24mm;width:auto}' +
    '.hd .c{text-align:center}.hd h1{margin:0;font:800 21pt Arial;letter-spacing:.5px;color:#0B1546}.hd .iso{font:600 10.5pt Arial;color:#E8127C;margin-top:.5mm}.hd .ad{font-size:9.3pt;color:#1B2A6B;line-height:1.45;margin-top:.8mm}' +
    '.tt{background:#0B1546;color:#fff;text-align:center;font:800 13pt Arial;letter-spacing:1.2px;padding:1.8mm;border-bottom:2.4pt solid #E8127C}';

  function doc(title, page, css, body) {
    return '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>@page{size:' + page + ';margin:0}' + BASE + css + '</style></head><body>' + body + '</body></html>';
  }
  function send(title, html) {
    P().toast('Preparing print…');
    var old = document.querySelector('iframe.pf'); if (old) old.remove();
    var f = document.createElement('iframe'); f.className = 'pf'; document.body.appendChild(f);
    var d = f.contentWindow.document; d.open(); d.write(html); d.close();
    var go = function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { P().toast('Printing is blocked here. Allow pop-ups and try again.', true); } };
    var imgs = d.images, left = imgs.length; if (!left) return setTimeout(go, 200);
    var once = function () { if (--left <= 0) setTimeout(go, 200); };
    Array.prototype.forEach.call(imgs, function (i) { if (i.complete) once(); else { i.onload = once; i.onerror = once; } });
    setTimeout(function () { if (left > 0) { left = 0; go(); } }, 4000);
    return true;
  }
  function userName(n) { return n || ''; }

  /* ---------------- CASH / ADVANCE VOUCHER ---------------- */
  function voucher(r) {
    var modes = ['Cash', 'Cheque', 'Net Banking', 'UPI'];
    var css = '.pg{width:210mm;height:148mm;padding:7mm 8mm}.box{position:relative;height:100%;border:1.6pt solid #0B1546;border-radius:7mm;padding:4mm 6mm 5mm;overflow:hidden;background:radial-gradient(160mm 60mm at 0 0,rgba(30,91,255,.06),transparent 70%),radial-gradient(120mm 60mm at 100% 100%,rgba(243,2,110,.06),transparent 70%)}' +
      '.top{display:grid;grid-template-columns:30mm 1fr 40mm;align-items:start}.top .mk{height:26mm;width:auto;margin-top:3mm}.mid{text-align:center}' +
      '.ttl{display:inline-block;border:1.4pt solid #E8127C;color:#0B1546;font:800 15pt Arial;padding:1mm 4mm;letter-spacing:.4px;background:#fff}' +
      '.mid h1{margin:2.5mm 0 1mm;font:800 22pt Arial;color:#0B1546;letter-spacing:.6px}.mid p{margin:0;font-size:10.5pt;line-height:1.4;color:#1B2A6B}' +
      '.md div{display:flex;align-items:center;gap:2.5mm;margin:0 0 2.6mm;font:bold 10.5pt Arial;color:#0B1546}.md i{width:8mm;height:6.2mm;border:1.1pt solid #0B1546;border-radius:1mm;display:grid;place-items:center;font-style:normal;color:#E8127C;font-size:13pt;line-height:1}' +
      '.rw{display:flex;align-items:flex-end;gap:2mm;margin-top:4.2mm;font:600 10.5pt Arial;color:#0B1546;text-transform:uppercase;white-space:nowrap}.rw .f{flex:1;border-bottom:1.1pt dotted #0B1546;min-height:5.5mm;padding:0 1.5mm .3mm;font:bold 10.5pt Arial;color:#111;text-transform:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.rw .f.fit{white-space:normal;font-size:9pt;line-height:1.25}.rs{display:flex;align-items:center;margin-top:5mm;width:96mm;height:16mm;border:1.2pt solid #0B1546}.rs b{width:22mm;height:100%;display:grid;place-items:center;border-right:1.2pt solid #0B1546;font:800 22pt Arial;color:#fff;background:#0B1546}.rs span{flex:1;padding:0 4mm;font:800 15pt Arial;color:#111}' +
      '.sg{position:absolute;left:6mm;right:6mm;bottom:5mm;display:grid;grid-template-columns:repeat(4,1fr);text-align:center;font-size:10.5pt;color:#0B1546}.sg em{display:block;font:bold 9pt Arial;color:#111;font-style:normal;min-height:4mm;margin-bottom:1mm}.sg span{border-top:.8pt solid #9AA6D6;padding-top:1mm;margin:0 3mm;display:block}';
    var body = '<div class="pg"><div class="box"><div class="top">' + mark() +
      '<div class="mid"><span class="ttl">CASH / ADVANCE VOUCHER</span><h1>' + CO.name + '</h1><p>' + CO.addrShort.join('<br>') + '</p></div>' +
      '<div class="md">' + modes.map(function (m) { return '<div><i>' + (r.mode === m ? '&#10004;' : '') + '</i>' + m.toUpperCase() + '</div>'; }).join('') + '</div></div>' +
      '<div class="rw" style="margin-top:5mm">VCH No. <span class="f" style="flex:0 0 52mm;border:0;color:#E8127C;font-size:13pt">' + esc(r.vchNo || '') + '</span><span style="flex:1"></span>DATE <span class="f" style="flex:0 0 48mm">' + esc(dd(r.date)) + '</span></div>' +
      '<div class="rw">RECEIVER NAME <span class="f">' + esc(r.receiver) + '</span> ADDRESS OF RECEIVER <span class="f">' + esc(String(r.address || '').split('\n')[0]) + '</span></div>' +
      '<div class="rw"><span class="f" style="flex:0 0 52mm">' + esc(String(r.address || '').split('\n').slice(1).join(', ')) + '</span> AND PURPOSE OF <span class="f fit">' + esc(r.purpose) + '</span></div>' +
      '<div class="rw">RECEIVER AMOUNT INR <span class="f" style="flex:0 0 30mm">' + amt(r.amount) + '</span> IN WORDS <span class="f fit">' + esc(P().words(r.amount)) + '</span></div>' +
      '<div class="rw"><span class="f" style="flex:0 0 66mm">' + esc(r.project ? 'Project: ' + r.project : '') + '</span> IF CHEQUE ISSUE DETAILS <span class="f">' + esc(r.chequeDetails || '') + '</span></div>' +
      '<div class="rs"><b>&#8377;</b><span>' + amt(r.amount) + '</span></div>' +
      '<div class="sg"><div><em>' + esc(userName(r.requestedBy)) + '</em><span>Requested by</span></div><div><em>' + esc(userName(r.verifiedBy)) + '</em><span>Verified by</span></div><div><em>' + esc(userName(r.approvedBy)) + '</em><span>Approved by</span></div><div><em></em><span>Receiver\'s Sign. &amp; Date</span></div></div>' +
      '</div></div>';
    return send('Voucher ' + (r.vchNo || r.id), doc('Voucher', 'A5 landscape', css, body));
  }

  /* ---------------- DELIVERY CHALLAN ---------------- */
  function headBlock(withAddr) {
    return '<div class="hd">' + mark() + '<div class="c"><h1>' + CO.name + '</h1><div class="iso">' + CO.iso + '</div>' +
      (withAddr ? '<div class="ad">' + CO.addr + '<br>' + CO.contact + '<br><b>' + CO.cin + '</b></div>' : '') + '</div><div></div></div>';
  }
  function dc(r) {
    var lines = (r.lines || []).slice(), rows = Math.max(14, lines.length);
    var from = String(r.fromAddr || '').split('\n'), to = String(r.toAddr || '').split('\n');
    var css = '.pg{width:210mm;min-height:297mm;padding:9mm 9mm}.frm{border:1.4pt solid #0B1546}table.g td{height:8.2mm}.it td{height:8.6mm}.ft{text-align:center;font-size:9pt;padding:1.6mm;background:#F4F6FD;border-top:.9pt solid #0B1546}';
    var body = '<div class="pg"><div class="frm">' + headBlock(true) + '<div class="tt">DELIVERY CHALLAN</div>' +
      '<table class="g" style="border-top:0"><colgroup><col style="width:11%"><col style="width:39%"><col style="width:12%"><col style="width:38%"></colgroup>' +
      '<tr><td colspan="2"><span class="lb">Date :</span> <span class="v">' + esc(dd(r.date)) + '</span></td><td colspan="2"><span class="lb">E-Way Bill No.</span> <span class="v">' + esc(r.ewayBill || '') + '</span></td></tr>' +
      '<tr><td colspan="2"><span class="lb">Delivery No. : PEPL / DC / A</span> <span class="v pk">' + esc(r.dcNo || '') + '</span></td><td colspan="2"><span class="lb">Date (EWB) :</span> <span class="v">' + esc(dd(r.ewbDate)) + '</span></td></tr>' +
      '<tr><td colspan="2"><span class="lb">Transporter Name :</span> <span class="v">' + esc(r.transporter || '') + '</span></td><td colspan="2"><span class="lb">Truck No. :</span> <span class="v">' + esc(r.truckNo || '') + '</span></td></tr>' +
      '<tr><td colspan="2" class="th">SHIPPING FROM (Address / GST No.)</td><td colspan="2" class="th">SHIPPING TO (Address / GST No.)</td></tr>' +
      [0, 1, 2, 3].map(function (i) { return '<tr><td colspan="2"><span class="v">' + esc(from[i] || '') + '</span></td><td colspan="2"><span class="v">' + esc(to[i] || '') + '</span></td></tr>'; }).join('') +
      '<tr><td class="lb">GST No.</td><td><span class="v">' + esc(r.fromGst || '') + '</span></td><td class="lb">GST No.</td><td><span class="v">' + esc(r.toGst || '') + '</span></td></tr>' +
      '<tr><td colspan="4" style="height:auto;padding:2.5mm 3mm;font-size:9pt">(i) From which goods are consigned.<br>(ii) To which goods are consigned.</td></tr></table>' +
      '<table class="g it" style="border-top:0"><tr><th class="th" style="width:7%">S.No.</th><th class="th" style="width:45%">Description of Goods</th><th class="th" style="width:11%">UoM</th><th class="th" style="width:12%">Quantity</th><th class="th">Remarks</th></tr>' +
      Array.apply(null, Array(rows)).map(function (_, i) { var l = lines[i] || {}; return '<tr><td class="ct">' + (i + 1) + '</td><td class="v">' + esc(l.item || '') + '</td><td class="ct v">' + esc(l.uom || '') + '</td><td class="ct v">' + esc(l.qty == null ? '' : l.qty) + '</td><td class="v">' + esc(l.lremarks || '') + '</td></tr>'; }).join('') + '</table>' +
      '<table class="g" style="border-top:0"><tr><td><span class="lb">Purpose of transport :</span> <span class="v">' + esc(r.purpose || '') + '</span></td></tr><tr><td><span class="lb">Remarks, if any :</span> <span class="v">' + esc(r.remarks || '') + '</span></td></tr>' +
      '<tr><td class="ct" style="background:#F4F6FD">I / We certify to the best of my / our knowledge the particulars are true, correct and complete</td></tr></table>' +
      '<table class="g" style="border-top:0"><tr><td style="width:50%;height:24mm;vertical-align:top"><u class="lb" style="font-size:9pt">SIGN BY RECEIVER OR STORE INCHARGE WITH DATE AND SEAL</u></td><td style="vertical-align:top;text-align:center;font-size:12pt">For <b>' + CO.name + '</b><div class="v" style="margin-top:7mm;font-size:10pt">' + esc(r.preparedBy || '') + '</div></td></tr>' +
      '<tr><td class="ct" style="font-size:8.5pt">Name and signature of the persons transporting with status of person signing</td><td class="ct" style="font-size:8.5pt">Name and signature of the persons transporting with status of person signing</td></tr></table>' +
      '<div class="ft">Goods once sold cannot be taken back or exchanged / Not responsible for any breakage during transit / Subject to Chennai Jurisdiction</div></div></div>';
    return send('DC ' + (r.dcNo || r.id), doc('Delivery Challan', 'A4 portrait', css, body));
  }

  /* ---------------- SAFETY / TOOL BOX MEETING ---------------- */
  function tbt(r) {
    var lines = (r.lines || []).slice(), rows = Math.max(20, lines.length);
    var css = '.pg{width:210mm;min-height:297mm;padding:9mm 9mm}.frm{border:1.4pt solid #0B1546}table.g td{height:7.6mm}.wk td{height:7.4mm}.note{padding:2.5mm 3mm;font-size:9pt;border-top:.9pt solid #0B1546;background:#FDF1F7}';
    var body = '<div class="pg"><div class="frm">' + headBlock(false) + '<div class="tt">SAFETY / TOOL BOX MEETING</div>' +
      '<table class="g" style="border-top:0"><colgroup><col style="width:31%"><col style="width:27%"><col style="width:17%"><col style="width:25%"></colgroup>' +
      '<tr><td class="lb">REPORT NUMBER :</td><td><span class="lb">PEPL / TBT / D</span> <span class="v pk">' + esc(r.tbtNo || '') + '</span></td><td class="lb">DATE &amp; TIME :</td><td class="v">' + esc(dd(r.date)) + (r.time ? ' &nbsp;' + esc(r.time) : '') + '</td></tr>' +
      '<tr><td class="lb">CLIENT :</td><td class="v">' + esc(r.client || '') + '</td><td class="lb r">LOCATION :</td><td class="v">' + esc(r.location || '') + '</td></tr>' +
      '<tr><td colspan="4"><span class="lb">NAME OF THE PROJECT :</span> <span class="v">' + esc(r.project || '') + '</span></td></tr>' +
      '<tr><td colspan="4"><span class="lb">NAME OF THE WORK :</span> <span class="v">' + esc(r.work || '') + '</span></td></tr>' +
      '<tr><td colspan="2" class="lb" style="width:47%">NAME OF THE SITE INCHARGE :</td><td colspan="2" class="v">' + esc(r.siteIncharge || '') + '</td></tr>' +
      '<tr><td colspan="2" class="lb" style="height:17mm">Topic of Safety Discussion :</td><td colspan="2" class="v" style="font-weight:normal;color:#111">' + nl(r.topic || '') + '</td></tr></table>' +
      '<table class="g wk" style="border-top:0"><tr><th class="th" style="width:7%">S.No.</th><th class="th" style="width:35%">NAME OF THE WORKER</th><th class="th" style="width:18%">DESIGNATION</th><th class="th" style="width:11%">IN TIME</th><th class="th" style="width:12%">OUT TIME</th><th class="th">SIGNATURE</th></tr>' +
      Array.apply(null, Array(rows)).map(function (_, i) { var l = lines[i] || {}; return '<tr><td class="ct">' + (i + 1) + '</td><td class="v">' + esc(l.worker || '') + '</td><td class="v">' + esc(l.designation || '') + '</td><td class="ct v">' + esc(l.inTime || '') + '</td><td class="ct v">' + esc(l.outTime || '') + '</td><td></td></tr>'; }).join('') + '</table>' +
      '<div class="note"><b>Note :</b> Every Tool Box Meeting conducted is for avoiding any Accidents, Near-Miss incidents and to get the knowledge about work procedure / method to avoid unwanted incidents.</div>' +
      '<table class="g" style="border-top:0"><tr><td class="th" style="width:33.3%">TBT Conducted by</td><td class="th" style="width:33.3%">Client Accepted by</td><td class="th">Verified by</td></tr>' +
      '<tr><td class="ct v" style="height:26mm;vertical-align:bottom">' + esc(r.conductedBy || '') + '</td><td class="ct v" style="vertical-align:bottom">' + esc(r.clientRep || '') + '</td><td class="ct v" style="vertical-align:bottom">' + esc(r.verifiedBy || '') + '</td></tr>' +
      '<tr><td class="ct">Sign with date</td><td class="ct" style="font-size:8.5pt">Sign with date (If client\'s representative may be participating)</td><td class="ct">Sign with date</td></tr></table></div></div>';
    return send('TBT ' + (r.tbtNo || r.id), doc('Tool Box Meeting', 'A4 portrait', css, body));
  }

  window.PE_BOOKS = { vouchers: voucher, dc: dc, tbt: tbt };
})();
