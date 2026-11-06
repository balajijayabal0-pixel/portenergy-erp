/* © 2026 Port Energy Private Limited. All rights reserved. Proprietary and confidential. */
/**
 * PORT ENERGY ERP - PROFESSIONAL PRINT TEMPLATES
 * Every document prints on the company letterhead in its own format:
 *   title band + document number box, information panels, item table with totals,
 *   amount in words, approval trail and signature boxes.
 * PO, quotation comparison, approval note, circular and decision keep their approved company formats
 * (they only get the refined table style). Everything else uses a dedicated template below.
 */
(function () {
  'use strict';
  var P = function () { return window.PE; };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function n(v) { return P().num(v); }
  function amt(v) { return n(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function dd(d) { return P().ddot(d) || ''; }
  function nl(s) { return esc(s).replace(/\n/g, '<br>'); }
  function words(v) { return P().words(v); }

  /* ---------- styles for the print window (added to the letterhead sheet) ---------- */
  window.PE_PRINT_CSS =
    'table.t th{background:#0B1546!important;color:#fff!important;border-color:#0B1546!important;font-size:9pt;letter-spacing:.2px}table.t td{border-color:#B9C2E0!important}table.t tbody tr:nth-child(even) td{background:rgba(240,243,251,.85)}' +
    '.dh{display:flex;justify-content:space-between;align-items:flex-end;gap:8mm;margin:2mm 0 5mm;padding-bottom:3mm;border-bottom:2.2pt solid #0B1546;position:relative}.dh:after{content:"";position:absolute;left:0;bottom:-2.2pt;width:38mm;height:2.2pt;background:#E8127C}' +
    '.dh h1{margin:0;font:800 16pt Arial;color:#0B1546;letter-spacing:.6px;text-transform:uppercase}.dh .sub{margin:1.5mm 0 0;font-size:9pt;color:#4A5582}' +
    '.no{border:1pt solid #0B1546;border-radius:2mm;min-width:58mm;font-size:9pt;overflow:hidden}.no div{display:flex;justify-content:space-between;gap:4mm;padding:1.3mm 3mm}.no div+div{border-top:.6pt solid #C9D0EA}.no span{color:#4A5582}.no b{color:#0B1546}' +
    '.st{display:inline-block;padding:.6mm 2.5mm;border-radius:6mm;font-size:8.5pt;font-weight:bold;background:#E8ECF8;color:#0B1546}.st.ok{background:#DDF5EC;color:#0B6B44}.st.bad{background:#FCE3E8;color:#A3133A}.st.warn{background:#FFF1D6;color:#8A5300}' +
    '.ig{display:grid;grid-template-columns:repeat(var(--c,2),1fr);gap:0;border:1pt solid #B9C2E0;border-radius:2mm;overflow:hidden;margin:0 0 4mm}.ig div{padding:2mm 3mm;border-right:.6pt solid #D5DBEE;border-bottom:.6pt solid #D5DBEE;min-height:9mm}' +
    '.ig small{display:block;font-size:7.5pt;color:#5B6690;text-transform:uppercase;letter-spacing:.5px;margin-bottom:.6mm}.ig b{font-size:10pt;color:#000;font-weight:600}.ig .w{grid-column:1/-1}' +
    '.bx{border:1pt solid #B9C2E0;border-radius:2mm;margin:0 0 4mm;page-break-inside:avoid}.bx h5{margin:0;padding:1.6mm 3mm;background:#EEF1FA;border-bottom:.6pt solid #D5DBEE;font:bold 8.5pt Arial;color:#0B1546;text-transform:uppercase;letter-spacing:.5px}.bx .in{padding:2.5mm 3mm;line-height:1.5}' +
    '.two{display:grid;grid-template-columns:1fr 1fr;gap:4mm}' +
    '.tot{margin:-2mm 0 4mm auto;width:78mm;border:1pt solid #B9C2E0;border-top:0;font-size:9.5pt}.tot div{display:flex;justify-content:space-between;padding:1.4mm 3mm;border-top:.6pt solid #D5DBEE}.tot .g{background:#0B1546;color:#fff;font-weight:bold;font-size:10.5pt}' +
    '.wd{border-left:3pt solid #E8127C;background:#FDF0F6;padding:2mm 3mm;margin:0 0 4mm;font-size:9.5pt}.wd b{color:#0B1546}' +
    '.big{font:800 20pt Arial;color:#0B1546}.ctr{text-align:center}' +
    '.trail{display:flex;flex-wrap:wrap;gap:2mm;margin:1mm 0}.trail span{border:.8pt solid #B9C2E0;border-radius:5mm;padding:1mm 3mm;font-size:8.5pt}.trail .d{border-color:#12A37F;color:#0B6B44}.trail .r{border-color:#D11A42;color:#A3133A}.trail .p{border-color:#E59A00;color:#8A5300}' +
    '.sg{display:flex;gap:6mm;margin-top:16mm;page-break-inside:avoid}.sg div{flex:1;text-align:center;font-size:9pt}.sg i{display:block;border-top:.8pt solid #000;margin-bottom:1.5mm}.sg em{display:block;font-style:normal;color:#0E6B5C;font-size:8pt;margin-bottom:1mm;min-height:3mm}' +
    '.prog{height:4mm;border-radius:2mm;background:#E3E8F5;overflow:hidden}.prog i{display:block;height:100%;background:linear-gradient(90deg,#1E5BFF,#E8127C)}' +
    '.ph{display:flex;flex-wrap:wrap;gap:2mm}.ph img{width:40mm;height:30mm;object-fit:cover;border-radius:1.5mm;border:.6pt solid #C9D0EA}' +
    '.pass{border:1.5pt dashed #0B1546;border-radius:3mm;padding:4mm;margin-top:4mm}.note2{font-size:8.5pt;color:#4A5582;margin-top:3mm}' +
    /* reports */
    '.rpx .rp-logo{display:none}.rpx .rp-head{display:flex;justify-content:space-between;gap:8mm;border-bottom:2.2pt solid #0B1546;padding-bottom:3mm;margin-bottom:4mm}.rpx .rp-head small{color:#E8127C;font-weight:bold;letter-spacing:1px;font-size:8pt}.rpx .rp-head h1{margin:1mm 0;font:800 17pt Arial;color:#0B1546}.rpx .rp-head p{margin:0;color:#4A5582;font-size:9pt}' +
    '.rpx dl{display:grid;grid-template-columns:auto auto;gap:.6mm 4mm;margin:0;font-size:8.5pt}.rpx dt{color:#5B6690}.rpx dd{margin:0;font-weight:bold;text-align:right}' +
    '.rpx .rp-boxes{display:grid;grid-template-columns:repeat(auto-fit,minmax(32mm,1fr));gap:2.5mm;margin:0 0 5mm}.rpx .rp-box{border:1pt solid #B9C2E0;border-top:2.5pt solid #1E5BFF;border-radius:2mm;padding:2mm 3mm;page-break-inside:avoid}.rpx .rp-box.bad{border-top-color:#D11A42}.rpx .rp-box.warn{border-top-color:#E59A00}.rpx .rp-box.good{border-top-color:#12A37F}' +
    '.rpx .rp-box small{display:block;font-size:7.5pt;color:#5B6690;text-transform:uppercase}.rpx .rp-box b{font:800 13pt Arial;color:#0B1546}.rpx .rp-box em{display:block;font-style:normal;font-size:7.5pt;color:#5B6690}' +
    '.rpx .rp-sec{margin:0 0 5mm;page-break-inside:auto}.rpx .rp-sec h3{margin:0 0 2mm;font:bold 11pt Arial;color:#0B1546;border-left:3pt solid #E8127C;padding-left:2.5mm}.rpx .rp-sec h3 small{font-weight:normal;color:#5B6690;margin-left:3mm;font-size:8.5pt}' +
    '.rpx .rp-t{width:100%;border-collapse:collapse;font-size:8.5pt}.rpx .rp-t th{background:#0B1546;color:#fff;text-align:left;padding:1.6mm 2.2mm}.rpx .rp-t td{border-bottom:.6pt solid #D5DBEE;padding:1.5mm 2.2mm;vertical-align:top}.rpx .rp-t tr:nth-child(even) td{background:#F4F6FC}.rpx .r{text-align:right}' +
    '.rpx .rp-bars div{display:grid;grid-template-columns:48mm 1fr 26mm;gap:3mm;align-items:center;font-size:8.5pt;margin:1mm 0}.rpx .rp-bars i{height:3.2mm;background:#E3E8F5;border-radius:2mm;overflow:hidden}.rpx .rp-bars i b{display:block;height:100%;background:linear-gradient(90deg,#1E5BFF,#E8127C)}.rpx .rp-bars em{font-style:normal;text-align:right;font-weight:bold}' +
    '.rpx .rp-chips{margin:0 0 2mm}.rpx .rp-chip{display:inline-block;border:.6pt solid #B9C2E0;border-radius:4mm;padding:.6mm 2.5mm;margin:0 1.5mm 1.5mm 0;font-size:8pt}.rpx .rp-list{margin:0;padding-left:5mm;font-size:9pt}.rpx .rp-dot{display:inline-block;width:2mm;height:2mm;border-radius:50%;background:#1E5BFF;margin-right:2mm}.rpx .rp-dot.bad{background:#D11A42}' +
    '.rpx .rp-none{color:#5B6690;font-size:9pt}.rpx .rp-foot{margin-top:6mm;padding-top:2mm;border-top:.6pt solid #B9C2E0;font-size:7.5pt;color:#5B6690;text-align:center}';

  /* ---------- building blocks ---------- */
  function stCls(s) { s = String(s || ''); return /Approved|Paid|Verified|Received|Posted|Reviewed|Completed|Done|Working|Reimbursed|Dispatched/.test(s) ? 'ok' : /Reject|Cancel|Missing|Breakdown|Scrap/.test(s) ? 'bad' : /Pending|Submitted|Requested|Hold|Draft|Open|Repair/.test(s) ? 'warn' : ''; }
  function head(title, sub, r, extra) {
    var rows = [['No', r.id], ['Date', dd(r.date || r.billDate || r.from || (r.createdAt || '').slice(0, 10)) || '-']].concat(extra || []);
    if (r.status) rows.push(['Status', '<span class="st ' + stCls(r.status) + '">' + esc(r.status) + '</span>']);
    return '<div class="dh"><div><h1>' + esc(title) + '</h1>' + (sub ? '<p class="sub">' + sub + '</p>' : '') + '</div><div class="no">' + rows.map(function (x) { return '<div><span>' + esc(x[0]) + '</span><b>' + (x[0] === 'Status' ? x[1] : esc(x[1])) + '</b></div>'; }).join('') + '</div></div>';
  }
  function grid(pairs, cols) {
    pairs = pairs.filter(function (p) { return p && p[1] !== '' && p[1] != null; });
    if (!pairs.length) return '';
    return '<div class="ig" style="--c:' + (cols || 2) + '">' + pairs.map(function (p) { return '<div' + (p[2] ? ' class="w"' : '') + '><small>' + esc(p[0]) + '</small><b>' + (p[3] ? p[1] : nl(p[1])) + '</b></div>'; }).join('') + '</div>';
  }
  function box(title, html) { return html ? '<div class="bx"><h5>' + esc(title) + '</h5><div class="in">' + html + '</div></div>' : ''; }
  function txt(title, v) { return String(v || '').trim() ? box(title, nl(v)) : ''; }
  function items(cols, lines, opt) {
    opt = opt || {};
    if (!lines || !lines.length) return '';
    return '<table class="t" style="font-size:9pt"><thead><tr><th style="width:8mm">#</th>' + cols.map(function (c) { return '<th' + (c.w ? ' style="width:' + c.w + '"' : '') + '>' + esc(c.l) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      lines.map(function (l, i) { return '<tr><td class="ct">' + (i + 1) + '</td>' + cols.map(function (c) { var v = c.f ? c.f(l) : l[c.k]; return '<td class="' + (c.r ? 'r' : c.c ? 'ct' : '') + '">' + (c.html ? v : esc(v == null ? '' : v)) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }
  function totals(list) { return '<div class="tot">' + list.filter(Boolean).map(function (x) { return '<div class="' + (x[2] ? 'g' : '') + '"><span>' + esc(x[0]) + '</span><b>' + amt(x[1]) + '</b></div>'; }).join('') + '</div>'; }
  function inWords(v) { return n(v) ? '<div class="wd"><b>Amount in words:</b> Rupees ' + esc(words(v)) + '</div>' : ''; }
  function trail(r) {
    if (r.route && r.route.length) return box('Approval channel', '<div class="trail">' + r.route.map(function (x) { var c = x.st === 'done' ? 'd' : x.st === 'rejected' ? 'r' : x.st === 'pending' ? 'p' : ''; return '<span class="' + c + '"><b>' + esc(x.role) + '</b> · ' + esc(x.name || '-') + (x.at ? ' · ' + esc(x.at) : '') + (x.st === 'done' ? ' ✓' : x.st === 'rejected' ? ' ✗' : x.st === 'pending' ? ' …' : '') + '</span>'; }).join('') + '</div>');
    if (!r.log) return '';
    var L = String(r.log).split('\n').filter(String);
    return box('History', '<table style="width:100%;font-size:8.5pt;border-collapse:collapse">' + L.map(function (l) { var p = l.split(' | '); return '<tr><td style="width:30mm;padding:.8mm 0;color:#4A5582">' + esc(p[0]) + '</td><td style="padding:.8mm 2mm"><b>' + esc(p[1] || '') + '</b></td><td style="padding:.8mm 2mm">' + esc(p[2] || '') + '</td><td style="padding:.8mm 0">' + esc(p.slice(3).join(' | ')) + '</td></tr>'; }).join('') + '</table>');
  }
  function signs(list, r) {
    var who = {}; String(r && r.log || '').split('\n').forEach(function (l) { var p = l.split(' | '); if (p[1]) who[p[1].toLowerCase()] = { n: p[2], at: p[0] }; });
    return '<div class="sg">' + list.map(function (s) { var hit = s[1] && (who[s[1]] || null); return '<div><em>' + (s[2] ? esc(s[2]) : hit ? 'Digitally ' + esc(s[1]) + ' · ' + esc(hit.at) : '') + '</em><i></i><b>' + esc(s[0]) + '</b>' + (hit && hit.n ? '<br>' + esc(hit.n) : '') + '</div>'; }).join('') + '</div>';
  }
  function photos(f) { f = (f || []).filter(function (u) { return /drive\.google\.com|^https?:/.test(u); }).slice(0, 6); if (!f.length) return ''; return box('Photos', '<div class="ph">' + f.map(function (u) { var id = (String(u).match(/\/d\/([^/]+)/) || [])[1]; return id ? '<img src="https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w400">' : ''; }).join('') + '</div>'); }
  function vend(name) { var o = P().findOpt('vendors', name) || {}; return o; }
  function go(title, body, land) { P().printHtml(body, { title: title, landscape: !!land }); return true; }

  /* ---------- templates ---------- */
  var T = {
    pr: function (e, r) {
      return go(r.id, head('Purchase Requisition', 'Material / service required for project work', r, [['Need by', dd(r.requiredBy)]]) +
        grid([['Requested by', r.requestedBy], ['Department', r.department], ['Project / Site', r.project], ['Priority', r.priority], ['PO reference', r.poRef]], 3) +
        txt('Purpose / justification', r.purpose) +
        items([{ l: 'Item', k: 'item' }, { l: 'Description / specification', k: 'desc' }, { l: 'Qty', k: 'qty', r: 1, w: '18mm' }, { l: 'Unit', k: 'uom', c: 1, w: '16mm' }], r.lines) +
        trail(r) + signs([['Requested by', '', r.requestedBy], ['Department Head', 'approved'], ['Store / Procurement', '']], r));
    },
    grn: function (e, r) {
      var lines = r.lines || [], acc = lines.reduce(function (t, l) { return t + n(l.accepted); }, 0), rej = lines.reduce(function (t, l) { return t + n(l.rejected); }, 0);
      return go(r.id, head('Goods Receipt Note', 'Material received against purchase order', r, [['PO No', r.poRef]]) +
        grid([['Vendor', r.vendor], ['Project / Site', r.project], ['Delivery challan', r.challanNo], ['Vendor invoice', r.invoiceNo], ['Vehicle', r.vehicleNo], ['Received by', r.receivedBy]], 3) +
        items([{ l: 'Item', k: 'item' }, { l: 'Unit', k: 'uom', c: 1, w: '14mm' }, { l: 'Ordered', k: 'ordered', r: 1, w: '18mm' }, { l: 'Earlier', k: 'prev', r: 1, w: '16mm' }, { l: 'Received', k: 'received', r: 1, w: '18mm' }, { l: 'Accepted', k: 'accepted', r: 1, w: '18mm' }, { l: 'Rejected', k: 'rejected', r: 1, w: '18mm' }, { l: 'Remarks', k: 'lremarks' }], lines) +
        '<p style="font-size:9pt"><b>Total accepted:</b> ' + acc + (rej ? ' &nbsp; · &nbsp; <b style="color:#A3133A">Rejected:</b> ' + rej : '') + '</p>' +
        txt('Remarks', r.remarks) + photos(r.photos) + trail(r) + signs([['Received by (Store)', '', r.receivedBy], ['Quality check', ''], ['Project In-charge', 'posted']], r));
    },
    bills: function (e, r) {
      var v = vend(r.vendor);
      return go(r.id, head('Vendor Bill Verification', 'Bill checked against PO and goods receipt', r, [['Bill No', r.billNo], ['Due date', dd(r.dueDate)]]) +
        '<div class="two">' + box('Vendor', '<b>' + esc(r.vendor) + '</b>' + (v.gstin ? '<br>GSTIN: ' + esc(v.gstin) : '') + (v.terms ? '<br>Terms: ' + esc(v.terms) : '')) + box('Reference', 'Bill date: <b>' + dd(r.billDate) + '</b><br>PO: <b>' + esc(r.poRef || '-') + '</b><br>Project: ' + esc(r.project || '-') + '<br>Department: ' + esc(r.department || '-')) + '</div>' +
        totals([['Taxable value', r.taxable], n(r.cgst) && ['CGST', r.cgst], n(r.sgst) && ['SGST', r.sgst], n(r.igst) && ['IGST', r.igst], ['Bill total', r.total], n(r.tds) && ['Less TDS @ ' + (r.tdsPct || 0) + '%', r.tds], ['Net payable', r.net, 1], n(r.paid) && ['Paid so far', r.paid], ['Balance', r.balance]]) +
        inWords(r.net) + (r.match ? box('3-way match (PO · GRN · Bill)', nl(r.match)) : '') + txt('Remarks', r.remarks) + trail(r) +
        signs([['Prepared by', '', r.createdBy], ['Verified by (Accounts)', 'verified'], ['Approved for payment', '']], r));
    },
    payments: function (e, r) {
      var v = vend(r.vendor);
      return go(r.id, head('Payment Voucher', 'Payment to vendor', r, [['Mode', r.mode]]) +
        '<div class="bx"><div class="in" style="display:flex;justify-content:space-between;align-items:center;gap:6mm"><div><small style="color:#5B6690">PAID TO</small><div style="font:bold 13pt Arial;color:#0B1546">' + esc(r.vendor) + '</div>' + (v.gstin ? '<div style="font-size:9pt">GSTIN: ' + esc(v.gstin) + '</div>' : '') + '</div><div style="text-align:right"><small style="color:#5B6690">AMOUNT</small><div class="big">₹ ' + amt(r.amount) + '</div></div></div></div>' +
        inWords(r.amount) +
        grid([['Against bill', r.billRef], ['Payment mode', r.mode], ['Bank', r.bank], ['UTR / Cheque No', r.refNo], ['Payment date', dd(r.date)], ['Status', r.status]], 3) +
        txt('Narration', r.remarks) + trail(r) +
        signs([['Prepared by (Accounts)', '', r.createdBy], ['Approved by', 'approved'], ["Receiver's signature", '']], r));
    },
    expenses: function (e, r) {
      return go(r.id, head('Expense Reimbursement Claim', 'Claim by employee', r) +
        grid([['Employee', r.employee], ['Department', r.department], ['Project / Site', r.project], ['Category', r.category], ['Paid via', r.paidVia], ['Expense date', dd(r.date)]], 3) +
        '<div class="bx"><div class="in" style="display:flex;justify-content:space-between;align-items:center"><span>Amount claimed</span><span class="big">₹ ' + amt(r.amount) + '</span></div></div>' + inWords(r.amount) +
        txt('Description', r.description) + box('Bills attached', (r.files || []).length ? (r.files || []).length + ' file(s) in ERP' : 'No bill attached') + trail(r) +
        signs([['Claimed by', '', r.employee], ['Approved by', 'approved'], ['Paid by (Accounts)', 'reimbursed']], r));
    },
    pettycash: function (e, r) {
      var inn = r.type === 'Cash In';
      return go(r.id, head(inn ? 'Cash Receipt Voucher' : 'Petty Cash Voucher', inn ? 'Cash received into petty cash' : 'Cash paid from petty cash', r, [['Voucher', r.voucherNo]]) +
        '<div class="bx"><div class="in" style="display:flex;justify-content:space-between;align-items:center"><div><small style="color:#5B6690">' + (inn ? 'RECEIVED FROM' : 'PAID TO') + '</small><div style="font:bold 12pt Arial">' + esc(r.party || '-') + '</div></div><span class="big">₹ ' + amt(r.amount) + '</span></div></div>' + inWords(r.amount) +
        grid([['Category', r.category], ['Project / Site', r.project], ['Date', dd(r.date)]], 3) + txt('Being', r.description) +
        signs([['Prepared by', '', r.createdBy], ['Approved by', ''], [inn ? 'Paid by' : "Receiver's signature", '']], r));
    },
    clientbills: function (e, r) {
      return go(r.id, head('Client Invoice Statement', 'Invoice raised and amount received', r, [['Invoice No', r.invoiceNo], ['Due date', dd(r.dueDate)]]) +
        grid([['Client', r.client], ['Project', r.project], ['Invoice date', dd(r.date)]], 3) + txt('Description of work', r.description) +
        totals([['Taxable value', r.taxable], ['GST', r.gst], ['Invoice total', r.total, 1], ['Received', r.received], ['Balance receivable', r.balance]]) + inWords(r.total) +
        (r.receipts ? box('Receipts', nl(r.receipts)) : '') + trail(r) + signs([['Prepared by', '', r.createdBy], ['Accounts', ''], ['Authorised signatory', '']], r));
    },
    dsr: function (e, r) {
      return go(r.id, head('Daily Site Report', esc(r.project || ''), r) +
        grid([['Project / Site', r.project], ['Reported by', r.reportedBy], ['Department', r.department], ['Manpower on site', r.manpower], ['Safety', r.safety], ['Support needed from', r.support]], 3) +
        box('Overall progress', '<div style="display:flex;align-items:center;gap:4mm"><div class="prog" style="flex:1"><i style="width:' + Math.min(100, n(r.progress)) + '%"></i></div><b style="font-size:13pt">' + n(r.progress) + '%</b></div>') +
        txt('Work done today', r.workDone) + '<div class="two">' + txt('Materials received / used', r.materials) + txt('Issues / hold-ups', r.issues) + '</div>' + txt("Tomorrow's plan", r.tomorrow) +
        photos(r.photos) + signs([['Site Engineer', '', r.reportedBy], ['Project In-charge', 'reviewed'], ['Project Manager', '']], r));
    },
    transfers: function (e, r) {
      return go(r.id, head('Material Transfer Note', 'Gate pass · store / site to site', r, [['Need by', dd(r.requiredBy)]]) +
        '<div class="two">' + box('From', '<b>' + esc(r.fromSite || '-') + '</b>') + box('To', '<b>' + esc(r.toSite || '-') + '</b>') + '</div>' +
        grid([['Requested by', r.requestedBy], ['Department', r.department], ['Priority', r.priority], ['Dispatch (vehicle / DC)', r.dispatchRef]], 4) + txt('Purpose', r.purpose) +
        items([{ l: 'Material', k: 'item' }, { l: 'Qty', k: 'qty', r: 1, w: '20mm' }, { l: 'Unit', k: 'uom', c: 1, w: '16mm' }, { l: 'Remarks', k: 'lremarks' }], r.lines) + trail(r) +
        signs([['Issued by (Store)', 'dispatched'], ['Driver / carrier', ''], ['Received by (Site)', 'received']], r));
    },
    leaves: function (e, r) {
      var perm = r.kind === 'Permission';
      return go(r.id, head(perm ? 'Permission Slip' : 'Leave Application', '', r) +
        grid([['Employee', r.employee], ['Department', r.department], ['Type', perm ? 'Permission' : r.leaveType], perm ? ['Date / time', dd(r.from) + ' · ' + (r.permFrom || '') + ' - ' + (r.permTo || '') + (r.hours ? ' (' + r.hours + ' h)' : '')] : ['From - To', dd(r.from) + ' to ' + dd(r.to) + (r.days ? '  (' + r.days + ' day' + (n(r.days) > 1 ? 's' : '') + ')' : '')], ['Work handed over to', r.handover], ['Contact during leave', r.contact]], 3) +
        txt('Reason', r.reason) + trail(r) + signs([['Applicant', '', r.employee], ['Reporting Manager', 'approved'], ['HR / Admin', '']], r));
    },
    tasks: function (e, r) {
      return go(r.id, head('Task Assignment', esc(r.title), r, [['Due', dd(r.due)]]) +
        grid([['Assigned to', r.assignedTo], ['Assigned by', r.assignedBy], ['Project', r.project], ['Priority', r.priority]], 4) + txt('Details', r.details) + txt('Completion note', r.completion) + trail(r) +
        signs([['Assigned by', '', r.assignedBy], ['Done by', '', r.assignedTo], ['Verified by', 'verified']], r));
    },
    meetings: function (e, r) {
      return go(r.id, head('Minutes of Meeting', esc(r.title), r, [['Next meeting', dd(r.nextMeeting)]]) +
        grid([['Meeting type', r.type], ['Venue', r.venue], ['Chaired by', r.chairedBy], ['Project', r.project], ['Recorded by', r.recordedBy]], 3) +
        txt('Attendees', r.attendees) + txt('Agenda', r.agenda) + txt('Discussion', r.notes) + txt('Action points (who · what · by when)', r.actions) +
        signs([['Recorded by', '', r.recordedBy], ['Chaired by', '', r.chairedBy]], r));
    },
    machinery: function (e, r) {
      return go(r.id, head('Machine History Card', esc(r.name), r, [['Asset tag', r.code]]) +
        grid([['Machine', r.name], ['Category', r.category], ['Make / model', r.make], ['Serial No', r.serialNo], ['Owned / hired', r.ownership + (r.hireVendor ? ' · ' + r.hireVendor : '')], ['Hire rate / day', n(r.hireRate) ? '₹ ' + amt(r.hireRate) : ''], ['Current site', r.project], ['Exact location', r.location], ['Custodian', r.custodian], ['Purchase / hire date', dd(r.purchaseDate)], ['Last service', dd(r.lastService)], ['Next service due', dd(r.nextService)]], 3) +
        txt('Remarks', r.remarks) + photos(r.photos) + trail(r) + signs([['Custodian', '', r.custodian], ['Site In-charge', ''], ['Admin', '']], r));
    },
    matmoves: function (e, r) {
      var t = String(r.type || ''), title = /^Receipt/.test(t) ? 'Material Receipt Note' : /^Issue/.test(t) ? 'Material Issue Slip' : /^Return to/.test(t) ? 'Material Return Note' : /^Transfer|^Loan|^Sent/.test(t) ? 'Material Gate Pass' : /^Physical/.test(t) ? 'Physical Stock Count' : /^Damaged|^Lost/.test(t) ? 'Material Loss / Scrap Report' : 'Material Movement Slip';
      var it = P().findOpt('matitems', r.item) || {};
      return go(r.id, head(title, esc(t), r, r.dueBack ? [['Due back', dd(r.dueBack)]] : []) +
        '<div class="two">' + box('From', '<b>' + esc(r.fromLoc || '-') + '</b>') + box('To', '<b>' + esc(r.toLoc || '-') + '</b>') + '</div>' +
        items([{ l: 'Material', f: function () { return r.item + (it.code ? ' (' + it.code + ')' : ''); } }, { l: /^Physical/.test(t) ? 'Counted qty' : 'Qty', k: 'qty', r: 1, w: '24mm' }, { l: 'Unit', f: function () { return it.uom || ''; }, c: 1, w: '16mm' }, { l: 'Condition', k: 'condition', w: '28mm' }], [r]) +
        grid([['Project', r.project], ['Document ref', r.docRef], ['Vendor / contractor / person', r.party], ['Handled by', r.handledBy], ['Vehicle', r.vehicle]], 3) +
        txt('Remarks', r.remarks) + photos(r.photos) + trail(r) + signs([['Issued / handed by', '', r.handledBy], ['Received by', ''], ['Material In-charge', 'verify']], r));
    },
    matitems: function (e, r) {
      var mv = (P().S.cache.matmoves || []).filter(function (m) { return m.item === r.name; });
      var st = window.PE_MAT ? window.PE_MAT([r], P().S.cache.matmoves || [])[0] : null;
      return go(r.id, head('Material Stock Card', esc(r.name), r, [['Code', r.code]]) +
        grid([['Material', r.name], ['Category', r.category], ['Unit', r.uom], ['Specification', r.spec], ['Main store', r.home], ['Opening qty', r.opening], ['Reorder level', r.reorder], ['Standard rate', n(r.rate) ? '₹ ' + amt(r.rate) : '']], 4) +
        (st ? box('Stock now: ' + st.total + ' ' + (r.uom || '') + ' · ' + st.state, Object.keys(st.loc).filter(function (l) { return Math.abs(st.loc[l]) > 0.0001; }).map(function (l) { return esc(l) + ': <b>' + P().r2(st.loc[l]) + '</b>'; }).join(' &nbsp;·&nbsp; ')) : '') +
        items([{ l: 'Date', f: function (m) { return dd(m.date); }, w: '22mm' }, { l: 'Movement', k: 'type' }, { l: 'Qty', k: 'qty', r: 1, w: '16mm' }, { l: 'From', k: 'fromLoc' }, { l: 'To', k: 'toLoc' }, { l: 'By', k: 'handledBy' }], mv) + txt('Remarks', r.remarks));
    },
    vendors: function (e, r) {
      return go(r.id, head('Vendor Profile', esc(r.name), r, [['Code', r.code]]) +
        grid([['Vendor', r.name], ['Category', r.category], ['Contact person', r.contact], ['Mobile', r.mobile], ['Email', r.email], ['State', r.state], ['GSTIN', r.gstin], ['PAN', r.pan], ['Payment terms', r.paymentTerms], ['Rating', r.rating], ['Active', r.active], ['Address', r.address, 1]], 3) +
        box('Bank details', 'Bank: <b>' + esc(r.bankName || '-') + '</b> &nbsp; A/c No: <b>' + esc(r.accountNo || '-') + '</b> &nbsp; IFSC: <b>' + esc(r.ifsc || '-') + '</b>') +
        signs([['Prepared by (Procurement)', '', r.createdBy], ['Verified by (Accounts)', ''], ['Approved by', '']], r));
    },
    assets: function (e, r) {
      return go(r.id, head('Asset Register Card', esc(r.name), r) +
        grid([['Asset', r.name], ['Category', r.category], ['Serial No', r.serialNo], ['Assigned to', r.assignedTo], ['Location', r.location], ['Condition', r.condition], ['Purchase date', dd(r.purchaseDate)], ['Cost', n(r.cost) ? '₹ ' + amt(r.cost) : ''], ['Vendor', r.vendor], ['Warranty till', dd(r.warranty)]], 3) +
        txt('Remarks', r.remarks) + photos(r.photos) + signs([['Issued by (Admin)', ''], ['Received by', '', r.assignedTo]], r));
    },
    maintenance: function (e, r) {
      return go(r.id, head('Maintenance Work Request', esc(r.category || ''), r) +
        grid([['Raised by', r.raisedBy], ['Location', r.location], ['Category', r.category], ['Priority', r.priority], ['Assigned to', r.assignedTo]], 3) +
        txt('Problem', r.issue) + txt('Work done / closing note', r.closing) + photos(r.photos) + trail(r) + signs([['Raised by', '', r.raisedBy], ['Attended by', '', r.assignedTo], ['Admin', '']], r));
    },
    vehicles: function (e, r) {
      return go(r.id, head('Vehicle Trip Sheet', esc(r.vehicleNo), r) +
        grid([['Vehicle No', r.vehicleNo], ['Driver', r.driver], ['Purpose', r.purpose], ['From', r.from], ['To', r.to], ['Date', dd(r.date)], ['Start km', r.startKm], ['End km', r.endKm], ['Distance', r.distance ? r.distance + ' km' : ''], ['Fuel (litres)', r.fuelLtr], ['Fuel cost', n(r.fuelCost) ? '₹ ' + amt(r.fuelCost) : '']], 4) +
        signs([['Driver', '', r.driver], ['Admin', '']], r));
    },
    visitors: function (e, r) {
      return go(r.id, head('Visitor Pass', '', r) + '<div class="pass">' +
        grid([['Visitor', r.name], ['Company', r.company], ['Mobile', r.mobile], ['Purpose', r.purpose], ['To meet', r.toMeet], ['Date', dd(r.date)], ['In time', r.inTime], ['Out time', r.outTime]], 4) +
        '<p class="note2">Please wear this pass inside the premises and return it at the gate. Safety rules of Port Energy apply to all visitors.</p></div>' + signs([['Visitor', ''], ['Security', ''], ['Host', '', r.toMeet]], r));
    }
  };

  /** generic: information panels (not a spreadsheet) for any other record */
  function generic(e, r) {
    var fs = e.fields.filter(function (f) { return f.t !== 'files' && f.t !== 'hidden' && r[f.k] !== '' && r[f.k] != null; });
    var shortF = fs.filter(function (f) { return f.t !== 'textarea'; }), longF = fs.filter(function (f) { return f.t === 'textarea'; });
    var body = head(e.single, e.title, r) + grid(shortF.map(function (f) { return [f.l, P().fval(f, r[f.k], true)]; }), 3) + longF.map(function (f) { return txt(f.l, r[f.k]); }).join('');
    if (e.lines && (r.lines || []).length) { var cols = e.lines.cols.filter(function (c) { return c.t !== 'hidden'; }); body += items(cols.map(function (c) { return { l: c.l, k: c.k, r: c.t === 'number' || c.t === 'money' }; }), r.lines); }
    body += trail(r) + signs([['Prepared by', '', r.createdBy], ['Checked by', ''], ['Approved by', '']], r);
    return go(r.id, body);
  }

  window.PE_PRINT = function (e, r, x) {
    if (['po', 'quotes', 'approvals', 'notices', 'decisions'].indexOf(e.key) > -1) return false;   // approved company formats
    if (window.PE_BOOKS && window.PE_BOOKS[e.key]) return window.PE_BOOKS[e.key](r);          // exact book formats
    try { return T[e.key] ? T[e.key](e, r, x) : generic(e, r); } catch (err) { console.error(err); return false; }
  };
})();
