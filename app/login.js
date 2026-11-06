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

})();
