/* © 2026 Port Energy Private Limited. All rights reserved. Proprietary and confidential. */
/**
 * PORT ENERGY ERP - sign-in page helpers
 *  - shows the full Port Energy logo inside the sign-in card
 *  - "Forgot PIN?" on the PIN tab: emails the Super Admin(s) to reset the PIN (server: forgotPin in PinReset.gs)
 * The PIN itself is never sent or shown; the admin resets it from Users & Access.
 */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  var logo = $('lgCardLogo');
  if (logo && window.LOGO_FULL) logo.src = window.LOGO_FULL;

  function addForgot() {
    var box = $('stepPhone'); if (!box) return;
    var pin = $('lpin');
    if (!pin || box.querySelector('.lg-forgot')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'lg-forgot';
    b.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M14 9l2 2"/></svg>Forgot PIN?';
    var after = $('goBtn'); (after && after.parentNode === box ? after : pin).insertAdjacentElement('afterend', b);
    b.onclick = function () { ask(box, b); };
  }

  function ask(box, link) {
    var old = box.querySelector('.lg-fp'); if (old) old.remove();
    var id = ($('lid') && $('lid').value || '').replace(/\D/g, '');
    var p = document.createElement('div'); p.className = 'lg-fp';
    if (!/^[6-9]\d{9}$/.test(id)) {
      p.classList.add('bad');
      p.innerHTML = '<b>Enter your mobile number first</b>Type your registered 10-digit mobile number above, then tap Forgot PIN again.';
      link.insertAdjacentElement('afterend', p);
      if ($('lid')) $('lid').focus();
      return;
    }
    p.innerHTML = '<b>Reset PIN for +91 ' + esc(id.slice(0, 2)) + 'XXXXXX' + esc(id.slice(-2)) + '?</b>Your Super Admin gets an email to reset your PIN. After that, sign in with OTP or the new PIN they give you.' +
      '<div class="lg-fpa"><button type="button" class="go">Send request</button><button type="button" class="no">Cancel</button></div>';
    link.insertAdjacentElement('afterend', p);
    p.querySelector('.no').onclick = function () { p.remove(); };
    p.querySelector('.go').onclick = function () {
      var go = this; go.disabled = true; go.textContent = 'Sending...';
      window.google.script.run
        .withSuccessHandler(function (r) { p.className = 'lg-fp ok'; p.innerHTML = '<b>Request sent</b>' + esc((r && r.msg) || 'Your admin will reset your PIN soon.'); })
        .withFailureHandler(function (e) { p.className = 'lg-fp bad'; p.innerHTML = '<b>Could not send</b>' + esc((e && e.message) || 'Please try again.'); })
        .forgotPin(id);
    };
  }

  var box = $('stepPhone');
  if (box) new MutationObserver(addForgot).observe(box, { childList: true, subtree: true });
  addForgot();
})();
