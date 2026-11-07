/* © 2026 Port Energy Private Limited. All rights reserved.
   PORT ENERGY ERP - sign-in effects.
   The sign-in card stays parked away; the Port Energy helicopter waits at the side.
   Tap the helicopter -> it flies off, comes back carrying the sign-in card and sets it down.
   Tap it again -> it picks the card up and flies it away, leaving the live site animation.
   Day / night switch. Pure SVG + Web Animations, no images, so it never slows the login. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'pe_lgmode';
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* realistic H135-style helicopter, side view, nose to the left */
  var HELI = '<svg class="lgh-svg" viewBox="0 0 320 132" aria-hidden="true">' +
    '<defs>' +
    '<linearGradient id="hgB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".28" stop-color="#F4F7FB"/><stop offset=".62" stop-color="#D3DAE6"/><stop offset="1" stop-color="#9AA5B8"/></linearGradient>' +
    '<linearGradient id="hgN" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B54E0"/><stop offset=".45" stop-color="#00249C"/><stop offset="1" stop-color="#000F4A"/></linearGradient>' +
    '<linearGradient id="hgG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9FD8FF"/><stop offset=".35" stop-color="#2E6FB8"/><stop offset=".7" stop-color="#0B2350"/><stop offset="1" stop-color="#050E26"/></linearGradient>' +
    '<linearGradient id="hgE" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9EDF3"/><stop offset=".6" stop-color="#B4BDCB"/><stop offset="1" stop-color="#7E899C"/></linearGradient>' +
    '<linearGradient id="hgS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9DFE8"/><stop offset="1" stop-color="#6D788A"/></linearGradient>' +
    '<linearGradient id="hgT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#DCE2EC"/><stop offset="1" stop-color="#8E99AD"/></linearGradient>' +
    '<radialGradient id="hgR" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#0A1230" stop-opacity=".42"/><stop offset=".7" stop-color="#0A1230" stop-opacity=".16"/><stop offset="1" stop-color="#0A1230" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="hgF" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#2A3346"/><stop offset=".75" stop-color="#121826"/><stop offset="1" stop-color="#3A4458"/></radialGradient>' +
    '<filter id="hgBl" x="-5%" y="-200%" width="110%" height="500%"><feGaussianBlur stdDeviation="1.2"/></filter>' +
    '<clipPath id="hgC"><path d="M34 80 C 34 60 54 46 90 42 L 152 38 C 174 36 200 39 218 47 L 236 57 C 243 62 243 74 236 80 L 218 93 C 202 100 172 102 140 102 L 76 102 C 52 102 34 94 34 80 Z"/></clipPath>' +
    '</defs>' +
    /* tail */
    '<path d="M228 58 L 292 63 Q 296 64 296 68 L 296 70 Q 296 73 292 73 L 228 84 Z" fill="url(#hgT)" stroke="#7E899C" stroke-width=".8"/>' +
    '<path d="M230 60 L 292 65" stroke="#fff" stroke-width="1.4" opacity=".8"/>' +
    '<path d="M228 76 L 294 70 L 294 73 L 228 84 Z" fill="url(#hgN)"/>' +
    '<path d="M262 72 L 284 71 L 287 76 L 262 78 Z" fill="url(#hgS)"/><path d="M283 66 L 289 66 L 290 82 L 284 82 Z" fill="#00249C"/>' +
    '<path d="M284 34 Q 290 30 300 32 L 312 66 Q 314 76 304 80 L 288 82 Q 280 80 280 72 Z" fill="url(#hgT)" stroke="#7E899C" stroke-width=".8"/>' +
    '<path d="M300 33 L 312 66 L 306 67 L 294 35 Z" fill="#F0006C"/>' +
    '<circle cx="296" cy="64" r="11" fill="url(#hgF)"/><g class="lgh-tr"><rect x="294.6" y="54" width="2.8" height="20" rx="1.4" fill="#C9D0DC" opacity=".55"/><rect x="286" y="62.6" width="20" height="2.8" rx="1.4" fill="#C9D0DC" opacity=".4"/></g>' +
    '<text x="258" y="70.5" font-family="Arial, sans-serif" font-weight="700" font-size="6" fill="#00249C" letter-spacing=".4">VT-PEL</text>' +
    '<circle class="lgh-strobe" cx="311" cy="68" r="2" fill="#fff"/>' +
    /* fuselage */
    '<path d="M34 80 C 34 60 54 46 90 42 L 152 38 C 174 36 200 39 218 47 L 236 57 C 243 62 243 74 236 80 L 218 93 C 202 100 172 102 140 102 L 76 102 C 52 102 34 94 34 80 Z" fill="url(#hgB)" stroke="#6F7B90" stroke-width="1"/>' +
    '<g clip-path="url(#hgC)"><rect x="20" y="82" width="240" height="30" fill="url(#hgN)"/><path d="M20 78 L 260 74 L 260 77.6 L 20 81.6 Z" fill="#F0006C"/><path d="M20 74.4 L 260 70.4 L 260 73 L 20 77 Z" fill="#0084F0"/>' +
    '<path d="M40 64 C 70 50 160 44 230 56" stroke="#fff" stroke-width="3" fill="none" opacity=".75"/></g>' +
    /* engine cowling, exhaust, mast */
    '<path d="M104 42 C 110 27 170 23 196 33 L 208 44 L 102 46 Z" fill="url(#hgE)" stroke="#6F7B90" stroke-width=".8"/>' +
    '<path d="M112 36 C 130 29 170 28 192 33" stroke="#fff" stroke-width="1.6" fill="none" opacity=".9"/>' +
    '<path d="M196 33 L 214 36 L 214 44 L 206 44 Z" fill="#3B4252"/><path d="M206 36 L 214 37" stroke="#1A1F2B" stroke-width="2"/>' +
    '<g stroke="#8A95A8" stroke-width=".7" opacity=".7"><path d="M124 32 L 124 44 M146 28 L 146 44 M170 28 L 170 44"/></g>' +
    '<rect x="150" y="14" width="7" height="16" rx="1.5" fill="#4A5366"/><ellipse cx="153.5" cy="15" rx="9" ry="3.6" fill="#2F3747"/>' +
    /* glass */
    '<path d="M40 76 C 42 60 58 49 86 46 L 98 45.5 L 98 72 L 42 78 Z" fill="url(#hgG)" stroke="#20304F" stroke-width="1"/>' +
    '<path d="M50 66 C 56 56 68 51 84 49" stroke="#fff" stroke-width="2.4" fill="none" opacity=".55" stroke-linecap="round"/><path d="M48 72 L 60 58" stroke="#fff" stroke-width="1" opacity=".3"/>' +
    '<rect x="106" y="49" width="36" height="22" rx="4" fill="url(#hgG)" stroke="#20304F" stroke-width=".8"/><rect x="148" y="49" width="36" height="22" rx="4" fill="url(#hgG)" stroke="#20304F" stroke-width=".8"/>' +
    '<path d="M110 52 L 124 52 L 112 68 Z M152 52 L 166 52 L 154 68 Z" fill="#fff" opacity=".18"/>' +
    '<rect x="102" y="46" width="86" height="52" rx="5" fill="none" stroke="#5E6A80" stroke-width=".9" opacity=".7"/><path d="M144 46 L 144 98" stroke="#5E6A80" stroke-width=".7" opacity=".6"/>' +
    '<rect x="132" y="80" width="8" height="2" rx="1" fill="#C9D0DC"/>' +
    '<text x="190" y="93" text-anchor="middle" font-family="Poppins, Arial, sans-serif" font-weight="800" font-size="8.5" fill="#fff" letter-spacing=".8">PORT ENERGY</text>' +
    /* skids */
    '<g stroke="url(#hgS)" stroke-width="3.2" stroke-linecap="round" fill="none"><path d="M86 101 Q 82 110 78 117"/><path d="M178 101 Q 182 110 186 117"/><path d="M46 113 Q 46 119 54 119 L 206 119"/></g>' +
    '<path d="M54 117.6 L 204 117.6" stroke="#fff" stroke-width=".8" opacity=".6"/>' +
    /* lights */
    '<circle class="lgh-beacon" cx="130" cy="101.5" r="2.4" fill="#FF2D55"/><circle class="lgh-beacon b2" cx="174" cy="27" r="2.2" fill="#FF2D55"/><circle cx="238" cy="70" r="1.8" fill="#2BFF88"/>' +
    /* main rotor: blurred disc + sweeping blades */
    '<ellipse cx="153.5" cy="13" rx="152" ry="5.5" fill="url(#hgR)"/>' +
    '<g class="lgh-mr" filter="url(#hgBl)"><rect x="4" y="11.6" width="299" height="2.8" rx="1.4" fill="#1A2236" opacity=".75"/></g>' +
    '<g class="lgh-mr m2" filter="url(#hgBl)"><rect x="40" y="11.8" width="227" height="2.4" rx="1.2" fill="#1A2236" opacity=".45"/></g>' +
    '</svg>';

  var lg, card, H, C, hint, st = { x: 0, y: 0, s: 1 }, state = 'hidden', busy = false, ready = false;

  function mode() { var m = null; try { m = localStorage.getItem(KEY); } catch (x) { } if (m === 'day' || m === 'night') return m; var h = new Date().getHours(); return h >= 6 && h < 18 ? 'day' : 'night'; }
  function apply(m) {
    if (!lg) return;
    lg.classList.toggle('lg-day', m === 'day');
    var t = $('lgMode'); if (t) { t.setAttribute('aria-pressed', m === 'day' ? 'false' : 'true'); t.title = m === 'day' ? 'Switch to night' : 'Switch to day'; }
  }
  function phone() { return window.innerWidth <= 900; }
  function hw() { return phone() ? Math.min(170, window.innerWidth * .44) : 230; }
  function hh() { return hw() * 132 / 320; }
  function rel(el) { var L = lg.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - L.left + lg.scrollLeft, y: r.top - L.top + lg.scrollTop, w: r.width, h: r.height }; }
  function cardBox() { var t = card.style.transform; card.style.transform = 'none'; var r = rel(card); card.style.transform = t; return r; }

  /* where the helicopter waits */
  function parkHidden() {
    var R = cardBox(), W = lg.clientWidth;
    if (phone()) return { x: W - hw() - 14, y: R.y + 6, s: 1 };
    return { x: Math.min(R.x + R.w / 2 - hw() / 2, W - hw() - 30), y: R.y + R.h * .28, s: 1 };
  }
  function parkShown() {
    var R = cardBox(), s = phone() ? .5 : .46;
    return { x: R.x + R.w - hw() * s + (phone() ? 2 : 22), y: R.y - hh() * s - (phone() ? 2 : 10), s: s };
  }
  function overCard() { var R = cardBox(), g = gap(); return { x: R.x + R.w / 2 - hw() / 2, y: R.y - g - hh() * .86, s: 1 }; }
  function gap() { return phone() ? 46 : 64; }

  function place(p) { st = { x: p.x, y: p.y, s: p.s }; H.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px) scale(' + p.s + ')'; }
  function tf(p, r) { return 'translate(' + p.x + 'px,' + p.y + 'px) scale(' + p.s + ')' + (r ? ' rotate(' + r + 'deg)' : ''); }
  function fly(p, ms, ease, tilt) {
    var from = { x: st.x, y: st.y, s: st.s }, dir = p.x < from.x ? -1 : 1;
    var a = H.animate([{ transform: tf(from) }, { transform: tf({ x: (from.x + p.x) / 2, y: (from.y + p.y) / 2 - 10, s: (from.s + p.s) / 2 }, (tilt == null ? 7 : tilt) * dir * -1) }, { transform: tf(p) }],
      { duration: calm ? 1 : ms, easing: ease || 'cubic-bezier(.45,0,.25,1)' });
    return new Promise(function (res) { a.onfinish = function () { place(p); res(); }; });
  }
  function cables(show) {
    var R = cardBox(), o = overCard(), bx = o.x + hw() / 2, by = o.y + hh() * .86, ins = Math.min(30, R.w * .09);
    C.setAttribute('width', lg.scrollWidth); C.setAttribute('height', lg.scrollHeight);
    C.innerHTML = '<g class="lgc-in"><path d="M' + bx + ' ' + by + ' L' + (R.x + ins) + ' ' + (R.y + 2) + ' M' + bx + ' ' + by + ' L' + (R.x + R.w - ins) + ' ' + (R.y + 2) + '" stroke="#2A3346" stroke-width="1.6" fill="none"/><path d="M' + bx + ' ' + by + ' L' + (R.x + ins) + ' ' + (R.y + 2) + '" stroke="#E9EDF3" stroke-width=".6" fill="none" opacity=".7"/>' +
      '<circle cx="' + (R.x + ins) + '" cy="' + (R.y + 3) + '" r="4" fill="#FFC21A" stroke="#8A6400"/><circle cx="' + (R.x + R.w - ins) + '" cy="' + (R.y + 3) + '" r="4" fill="#FFC21A" stroke="#8A6400"/><rect x="' + (bx - 4) + '" y="' + (by - 1) + '" width="8" height="6" rx="1.5" fill="#3B4252"/></g>';
    C.style.opacity = show ? 1 : 0;
  }
  function moveTogether(dy0, dy1, ms, ease) {
    var o = overCard(), k = { duration: calm ? 1 : ms, easing: ease, fill: 'both' };
    var swing = [{ transform: 'translateY(' + dy0 + 'px) rotate(-2.2deg)' }, { transform: 'translateY(' + (dy0 + (dy1 - dy0) * .7) + 'px) rotate(1.4deg)', offset: .7 }, { transform: 'translateY(' + dy1 + 'px) rotate(0)' }];
    var a = card.animate(swing, k);
    C.animate(swing.map(function (f) { return { transform: f.transform.replace(/ rotate\([^)]+\)/, '') }; }), k);
    H.animate([{ transform: tf({ x: o.x, y: o.y + dy0, s: 1 }, -2) }, { transform: tf({ x: o.x, y: o.y + dy0 + (dy1 - dy0) * .7, s: 1 }, 1.5), offset: .7 }, { transform: tf({ x: o.x, y: o.y + dy1, s: 1 }) }], k);
    return new Promise(function (res) { a.onfinish = function () { place({ x: o.x, y: o.y + dy1, s: 1 }); res(); }; });
  }
  function clearAnims() { [card, C, H].forEach(function (e) { (e.getAnimations ? e.getAnimations() : []).forEach(function (a) { try { a.commitStyles && a.commitStyles(); } catch (x) { } a.cancel(); }); }); }

  function setHint() {
    hint.textContent = state === 'hidden' ? 'Tap the helicopter to sign in' : '';
    hint.classList.toggle('on', state === 'hidden' && !busy);
    H.setAttribute('aria-label', state === 'hidden' ? 'Bring the sign-in card' : 'Send the sign-in card away');
    H.title = state === 'hidden' ? 'Tap to sign in' : 'Tap to send the card away';
    lg.classList.toggle('lg-card-away', state === 'hidden');
    if (state === 'hidden') { var p = parkHidden(); hint.style.left = (phone() ? Math.max(12, p.x - 150) : p.x + hw() / 2 - hint.offsetWidth / 2) + 'px'; hint.style.top = (phone() ? p.y + hh() * .45 : p.y + hh() + 10) + 'px'; }
  }

  function summon() {
    if (busy || state !== 'hidden') return; busy = true; setHint(); H.classList.add('lgh-fly');
    var o = overCard(), top = -hh() - 140 - lg.scrollTop;
    fly({ x: o.x, y: top, s: 1 }, 650, 'cubic-bezier(.5,0,.8,.4)', 10).then(function () {
      card.classList.remove('lg-off'); cables(true);
      var dy0 = top - o.y;
      return moveTogether(dy0, 0, 1400, 'cubic-bezier(.2,.75,.25,1)');
    }).then(function () {
      card.classList.add('lg-landed'); setTimeout(function () { card.classList.remove('lg-landed'); }, 600);
      clearAnims(); card.style.transform = ''; C.style.transform = '';
      C.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: 'forwards' });
      return fly(parkShown(), 800, 'cubic-bezier(.4,0,.2,1)', 6);
    }).then(function () {
      C.style.opacity = 0; state = 'shown'; busy = false; H.classList.remove('lgh-fly'); setHint();
      var inp = $('lid') || lg.querySelector('#lpin, .lgx-in input'); if (inp && !('ontouchstart' in window)) try { inp.focus({ preventScroll: true }); } catch (x) { }
    });
  }
  function dismiss() {
    if (busy || state !== 'shown') return; busy = true; H.classList.add('lgh-fly');
    try { document.activeElement && document.activeElement.blur(); } catch (x) { }
    var o = overCard();
    fly(o, 650, 'cubic-bezier(.4,0,.2,1)', 6).then(function () {
      cables(true); C.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
      return new Promise(function (r) { setTimeout(r, 260); });
    }).then(function () {
      var up = -(o.y + lg.scrollTop) - hh() - cardBox().h - 200;
      return moveTogether(0, up, 1150, 'cubic-bezier(.55,0,.85,.35)');
    }).then(function () {
      clearAnims(); card.classList.add('lg-off'); card.style.transform = ''; C.style.transform = ''; C.style.opacity = 0;
      var p = parkHidden(); place({ x: p.x + (phone() ? 80 : 0), y: -hh() - 140 - lg.scrollTop, s: 1 });
      return fly(p, 1100, 'cubic-bezier(.2,.7,.3,1)', 8);
    }).then(function () { state = 'hidden'; busy = false; H.classList.remove('lgh-fly'); setHint(); });
  }
  function toggle() { if (state === 'hidden') summon(); else dismiss(); }

  function reset() {
    if (!ready) return; clearAnims(); busy = false; state = 'hidden';
    card.classList.add('lg-off'); card.style.transform = ''; C.style.opacity = 0; H.classList.remove('lgh-fly');
    place(parkHidden()); setHint();
  }
  function relayout() { if (!ready || busy) return; place(state === 'hidden' ? parkHidden() : parkShown()); setHint(); }
  var rlT = null;
  function follow() { /* the card moved (e.g. profile step): helicopter glides to its new spot */
    clearTimeout(rlT); rlT = setTimeout(function () {
      if (!ready || busy || state !== 'shown' || lg.style.display === 'none') return;
      var p = parkShown(); if (Math.abs(p.x - st.x) < 2 && Math.abs(p.y - st.y) < 2) return;
      busy = true; fly(p, 450, 'cubic-bezier(.3,0,.2,1)', 3).then(function () { busy = false; });
    }, 60);
  }

  function build() {
    lg = $('login'); if (!lg || ready) return;
    card = lg.querySelector('.lg-card'); if (!card) return;
    var top = lg.querySelector('.lg-top');
    if (top && !$('lgMode')) top.insertAdjacentHTML('beforeend', '<button type="button" class="lg-mode" id="lgMode" aria-label="Day or night mode"><span class="lg-mode-sky"><i></i><i></i><i></i></span><span class="lg-mode-knob"><b class="lg-crater"></b><b class="lg-crater c2"></b></span></button>');
    var bg = lg.querySelector('.lg-bg');
    if (bg) bg.insertAdjacentHTML('beforeend', '<i class="lg-cloud k1"></i><i class="lg-cloud k2"></i><i class="lg-cloud k3"></i>');
    C = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); C.setAttribute('class', 'lg-cab'); C.setAttribute('aria-hidden', 'true'); lg.appendChild(C);
    H = document.createElement('button'); H.type = 'button'; H.className = 'lgh'; H.style.width = hw() + 'px';
    H.innerHTML = '<span class="lgh-wash"></span><span class="lgh-body">' + HELI + '</span>'; lg.appendChild(H);
    hint = document.createElement('div'); hint.className = 'lgh-hint'; lg.appendChild(hint);
    hint.onclick = toggle; H.onclick = toggle;
    $('lgMode').onclick = function () { var m = mode() === 'day' ? 'night' : 'day'; try { localStorage.setItem(KEY, m); } catch (x) { } lg.classList.add('lg-switching'); apply(m); setTimeout(function () { lg.classList.remove('lg-switching'); }, 900); };
    lg.addEventListener('scroll', function () { if (lg.scrollLeft) lg.scrollLeft = 0; }, { passive: true });
    window.addEventListener('resize', function () { if (H) H.style.width = hw() + 'px'; relayout(); });
    document.addEventListener('keydown', function (e) {
      if (!lg || lg.style.display === 'none' || state !== 'hidden' || busy || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter' || e.key === ' ' || /^[0-9a-zA-Z@.]$/.test(e.key)) { if (document.activeElement === H && (e.key === 'Enter' || e.key === ' ')) return; e.preventDefault(); summon(); }
    });
    if (window.ResizeObserver) new ResizeObserver(follow).observe(card);
    new MutationObserver(follow).observe(lg, { attributes: true, attributeFilter: ['class'] });
    card.classList.add('lg-off'); ready = true; apply(mode());
  }

  function watch() {
    build(); if (!ready) return;
    var shown = false;
    var check = function () {
      var vis = lg.style.display !== 'none' && getComputedStyle(lg).display !== 'none';
      if (vis && !shown) { shown = true; apply(mode()); requestAnimationFrame(function () { requestAnimationFrame(reset); }); }
      if (!vis) shown = false;
    };
    new MutationObserver(check).observe(lg, { attributes: true, attributeFilter: ['style'] });
    check();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
})();
