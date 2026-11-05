/* © 2026 Port Energy Private Limited. All rights reserved. Proprietary and confidential. */
/**
 * PORT ENERGY ERP - WhatsApp share + direct record links
 *  - Every open record gets a "WhatsApp" button: sends the number, status and amount
 *    with a link that opens the same record in the ERP (after sign-in).
 *  - Opening a link like .../app/?open=PEPL/PO/26-27/A040 opens that record automatically.
 * Never calls the server itself and never changes data; the record is opened through the normal search.
 */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var BASE = location.origin + location.pathname.replace(/index\.html$/, '');
  var WA = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3z"/></svg>';

  function text(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }

  /* ---------- 1. WhatsApp button on every open record ---------- */
  function addButton() {
    var pane = $('pane');
    if (!pane) return;
    var acts = pane.querySelector('.db > .acts');
    var head = pane.querySelector('.dh');
    if (!acts || !head || acts.querySelector('[data-pe-wa]')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'btn soft pe-wa'; b.setAttribute('data-pe-wa', '1');
    b.innerHTML = WA + 'WhatsApp';
    b.onclick = function () { share(pane); };
    acts.appendChild(b);
  }

  function share(pane) {
    var head = pane.querySelector('.dh');
    var badge = head.querySelector('.badge');
    var status = text(badge);
    var h2 = head.querySelector('h2');
    var title = text(h2).replace(status, '').trim();
    var id = text(head.querySelector('.sub')).split(' · ')[0];
    var total = pane.querySelector('.totals > div:last-child b');
    var amount = total ? text(total) : '';
    if (!amount) {
      // money fields shown as label / value pairs (bills, payments, expenses, approval notes)
      var kv = Array.prototype.slice.call(pane.querySelectorAll('.kv > div, .kvs > div, .grid2 > div'));
      kv.some(function (d) { var l = text(d.firstElementChild); if (/^(Net Payable|Amount|Invoice Total|Grand Total)$/i.test(l)) { amount = text(d.lastElementChild); return true; } return false; });
    }
    var pending = /pending|submitted|requested|verification/i.test(status);
    var lines = [
      '*Port Energy ERP*',
      title + ': *' + id + '*',
      'Status: ' + status
    ];
    if (amount) lines.push('Amount: ' + amount);
    lines.push('');
    lines.push(pending ? 'Please check and approve:' : 'Open in ERP:');
    lines.push(BASE + '?open=' + encodeURIComponent(id));
    window.open('https://wa.me/?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
  }

  var q = false;
  new MutationObserver(function () { if (q) return; q = true; requestAnimationFrame(function () { q = false; addButton(); }); })
    .observe(document.getElementById('drawer') || document.body, { childList: true, subtree: true });

  /* ---------- 2. ?open=<record no> -> open that record after sign-in ---------- */
  var want = new URLSearchParams(location.search).get('open');
  if (!want) return;
  var tries = 0;
  function signedIn() { var app = $('app'), login = $('login'); return app && login && getComputedStyle(login).display === 'none' && getComputedStyle(app).display !== 'none' && !document.querySelector('#welcome.show'); }
  function clearParam() { try { var u = new URL(location.href); u.searchParams.delete('open'); history.replaceState(history.state, '', u.pathname + (u.search || '') + u.hash); } catch (x) { } }
  var timer = setInterval(function () {
    if (++tries > 600) { clearInterval(timer); return; }          // give up after 10 minutes (user never signed in)
    if (!signedIn()) return;
    clearInterval(timer);
    var opener = $('sideFind') || $('topFind');
    if (!opener) return;
    opener.click();
    var inp = $('palIn');
    if (!inp) return;
    inp.value = want;
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    var waits = 0;
    var pick = setInterval(function () {
      var hit = Array.prototype.slice.call(document.querySelectorAll('#palRes .o')).filter(function (o) { return o.textContent.indexOf(want) > -1; })[0];
      if (hit) { clearInterval(pick); hit.click(); clearParam(); }
      else if (++waits > 40) { clearInterval(pick); clearParam(); }   // 20 s: leave the search open with the number typed
    }, 500);
  }, 1000);
})();
