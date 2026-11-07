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

  /* real helicopter photo (rotor removed) + spinning rotor and tail fan drawn on top */
  var HELI = '<span class="lgh-ph"><img class="lgh-img" src="img/heli.webp" alt="" draggable="false">' +
    '<span class="lgh-rotor"><i class="lgh-disc"></i><i class="lgh-bl"></i><i class="lgh-bl b2"></i></span><span class="lgh-fan"></span>' +
    '<i class="lgh-bcn"></i><i class="lgh-bcn b2"></i></span>';
  var RATIO = 294 / 900, BELLY = .93;

  /* photo background with live layers. Positions are % of the photo (16:9). */
  var SCENES = {
    day: { img: 'img/bg-day.webp', fx: .06, items: [
      ['ph-sun', 14.1, 65.6, 16], ['ph-flare', 6.9, 7.2, 5.5], ['ph-water', 76, 78, 48, 8],
      ['ph-cloud c1', 30, 14, 26], ['ph-cloud c2', 70, 8, 30],
      ['ph-weld', 47, 96, 13], ['ph-walk', 0, 98.5, 4.2], ['ph-truck', 0, 99, 22]] },
    night: { img: 'img/bg-night.webp', fx: .12, items: [
      ['ph-flare', 16.1, 14.2, 6], ['ph-red', 28.6, 27.4, .9], ['ph-red r2', 47.9, 43.4, .9], ['ph-red r3', 21.4, 34.6, .8], ['ph-red r2', 16.1, 23.6, .7], ['ph-red', 16.1, 46.2, .7],
      ['ph-water', 81, 76, 38, 9], ['ph-load', 34.2, 51.2, 8.6], ['ph-weld', 42, 97, 13], ['ph-walk', 0, 98.5, 4.2], ['ph-truck', 0, 99, 22]] }
  };
  function item(c, x, y, w, h) {
    var inner = '';
    if (/ph-truck/.test(c)) inner = '<img src="img/truck.webp" alt="">';
    else if (/ph-walk/.test(c)) inner = '<img src="img/worker.webp" alt="">';
    else if (/ph-weld/.test(c)) inner = '<img src="img/welder.webp" alt=""><b class="ph-arc"></b><b class="ph-sp"><i></i><i></i><i></i><i></i><i></i><i></i></b>';
    else if (/ph-load/.test(c)) inner = '<span class="ph-rope"></span><img src="img/load.webp" alt="">';
    return '<div class="ph ' + c + '" style="left:' + x + '%;top:' + y + '%;width:' + w + '%' + (h ? ';height:' + h + '%' : '') + '">' + inner + '</div>';
  }
  var curScene = '';
  function scene(m) {
    if (!lg || curScene === m) return; curScene = m;
    var bg = lg.querySelector('.lg-bg'); if (!bg) return;
    var box = bg.querySelector('.lg-ph');
    if (!box) { box = document.createElement('div'); box.className = 'lg-ph'; bg.insertBefore(box, bg.firstChild); }
    var S = SCENES[m], img = new Image();
    img.onload = function () {
      if (curScene !== m) return;
      box.style.setProperty('--fx', S.fx);
      box.innerHTML = '<img class="lg-ph-img" src="' + S.img + '" alt="">' + S.items.map(function (a) { return item.apply(null, a); }).join('') + '<i class="lg-ph-scrim"></i>';
      lg.classList.add('lg-real'); box.classList.remove('in'); void box.offsetWidth; box.classList.add('in');
    };
    img.src = S.img;
  }
  var lg, card, H, C, hint, st = { x: 0, y: 0, s: 1 }, state = 'hidden', busy = false, ready = false;

  function mode() { var m = null; try { m = localStorage.getItem(KEY); } catch (x) { } if (m === 'day' || m === 'night') return m; var h = new Date().getHours(); return h >= 6 && h < 18 ? 'day' : 'night'; }
  function apply(m) {
    if (!lg) return;
    lg.classList.toggle('lg-day', m === 'day'); scene(m);
    var t = $('lgMode'); if (t) { t.setAttribute('aria-pressed', m === 'day' ? 'false' : 'true'); t.title = m === 'day' ? 'Switch to night' : 'Switch to day'; }
  }
  function phone() { return window.innerWidth <= 900; }
  function hw() { return phone() ? Math.min(200, window.innerWidth * .5) : 280; }
  function hh() { return hw() * RATIO; }
  function rel(el) { var L = lg.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - L.left + lg.scrollLeft, y: r.top - L.top + lg.scrollTop, w: r.width, h: r.height }; }
  function cardBox() { var t = card.style.transform; card.style.transform = 'none'; var r = rel(card); card.style.transform = t; return r; }

  /* where the helicopter waits */
  var custom = { hidden: null, shown: null };
  function parkHidden() {
    if (custom.hidden) return custom.hidden;
    var R = cardBox(), W = lg.clientWidth;
    if (phone()) return { x: W - hw() - 14, y: R.y + 6, s: 1 };
    return { x: Math.min(R.x + R.w / 2 - hw() / 2, W - hw() - 30), y: R.y + R.h * .28, s: 1 };
  }
  function parkShown() {
    if (custom.shown) return custom.shown;
    var R = cardBox(), s = phone() ? .5 : .46;
    return { x: R.x + R.w - hw() * s + (phone() ? 2 : 22), y: R.y - hh() * s - (phone() ? 2 : 10), s: s };
  }
  function overCard() { var R = cardBox(), g = gap(); return { x: R.x + R.w / 2 - hw() / 2, y: R.y - g - hh() * BELLY, s: 1 }; }
  function gap() { return phone() ? 46 : 64; }

  function clampP(p) { var W = lg.clientWidth, Hh = Math.max(lg.scrollHeight, lg.clientHeight), w = hw() * p.s, h = hh() * p.s; return { x: Math.max(-w * .25, Math.min(W - w * .75, p.x)), y: Math.max(4, Math.min(Hh - h - 4, p.y)), s: p.s }; }
  function place(p) { st = { x: p.x, y: p.y, s: p.s }; H.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px) scale(' + p.s + ')'; }
  function tf(p, r) { return 'translate(' + p.x + 'px,' + p.y + 'px) scale(' + p.s + ')' + (r ? ' rotate(' + r + 'deg)' : ''); }
  function fly(p, ms, ease, tilt) {
    var from = { x: st.x, y: st.y, s: st.s }, dir = p.x < from.x ? -1 : 1;
    var a = H.animate([{ transform: tf(from) }, { transform: tf({ x: (from.x + p.x) / 2, y: (from.y + p.y) / 2 - 10, s: (from.s + p.s) / 2 }, (tilt == null ? 7 : tilt) * dir * -1) }, { transform: tf(p) }],
      { duration: calm ? 1 : ms, easing: ease || 'cubic-bezier(.45,0,.25,1)' });
    return new Promise(function (res) { a.onfinish = function () { place(p); res(); }; });
  }
  function cables(show) {
    var R = cardBox(), o = overCard(), bx = o.x + hw() / 2, by = o.y + hh() * BELLY, ins = Math.min(30, R.w * .09);
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
    hint.textContent = state === 'hidden' ? 'Tap the helicopter to sign in · swipe to fly it' : '';
    hint.classList.toggle('on', state === 'hidden' && !busy);
    H.setAttribute('aria-label', state === 'hidden' ? 'Bring the sign-in card' : 'Send the sign-in card away');
    H.title = state === 'hidden' ? 'Tap to sign in' : 'Tap to send the card away';
    lg.classList.toggle('lg-card-away', state === 'hidden');
    if (state === 'hidden') { var p = parkHidden(); var hl = p.x + hw() * p.s / 2 - hint.offsetWidth / 2; hint.style.left = Math.max(10, Math.min(lg.clientWidth - hint.offsetWidth - 10, hl)) + 'px'; hint.style.top = (p.y + hh() * p.s + 10) + 'px'; }
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
    H.innerHTML = '<span class="lgh-body">' + HELI + '</span>'; lg.appendChild(H);
    hint = document.createElement('div'); hint.className = 'lgh-hint'; lg.appendChild(hint);
    hint.onclick = toggle; H.onclick = function (e) { if (dragged) { dragged = false; e.preventDefault(); return; } toggle(); };
    /* swipe / drag the helicopter anywhere; a flick glides it with momentum */
    var drag = null, dragged = false;
    H.addEventListener('pointerdown', function (e) {
      if (busy) return; drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x0: st.x, y0: st.y, lx: e.clientX, ly: e.clientY, lt: performance.now(), vx: 0, vy: 0, on: false };
    });
    H.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.on) { if (Math.abs(dx) + Math.abs(dy) < 9) return; drag.on = true; dragged = true; try { H.setPointerCapture(e.pointerId); } catch (x) { } H.classList.add('lgh-drag'); hint.classList.remove('on'); }
      var now = performance.now(), dt = Math.max(8, now - drag.lt);
      drag.vx = drag.vx * .6 + (e.clientX - drag.lx) / dt * .4; drag.vy = drag.vy * .6 + (e.clientY - drag.ly) / dt * .4;
      drag.lx = e.clientX; drag.ly = e.clientY; drag.lt = now;
      var p = clampP({ x: drag.x0 + dx, y: drag.y0 + dy, s: st.s });
      st = p; H.style.transform = tf(p, Math.max(-14, Math.min(14, drag.vx * 9)));
      e.preventDefault();
    });
    function endDrag(e) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      var d = drag; drag = null; H.classList.remove('lgh-drag');
      if (!d.on) return;
      var p = clampP({ x: st.x + d.vx * 260, y: st.y + d.vy * 260, s: st.s });
      busy = true;
      fly(p, 520, 'cubic-bezier(.15,.7,.25,1)', Math.max(-10, Math.min(10, d.vx * 6)) * -1).then(function () {
        busy = false; custom[state] = { x: st.x, y: st.y, s: st.s }; setHint();
      });
      setTimeout(function () { dragged = false; }, 50);
    }
    H.addEventListener('pointerup', endDrag); H.addEventListener('pointercancel', endDrag);
    $('lgMode').onclick = function () { var m = mode() === 'day' ? 'night' : 'day'; try { localStorage.setItem(KEY, m); } catch (x) { } lg.classList.add('lg-switching'); apply(m); setTimeout(function () { lg.classList.remove('lg-switching'); }, 900); };
    lg.addEventListener('scroll', function () { if (lg.scrollLeft) lg.scrollLeft = 0; }, { passive: true });
    window.addEventListener('resize', function () { custom.hidden = custom.shown = null; if (H) H.style.width = hw() + 'px'; relayout(); });
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
