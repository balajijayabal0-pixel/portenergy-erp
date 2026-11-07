/* © 2026 Port Energy Private Limited. All rights reserved.
   PORT ENERGY ERP - sign-in effects: helicopter delivers the sign-in card, day / night switch.
   Pure SVG + Web Animations, no images, so it never slows the login. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'pe_lgmode', done = false;
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var HELI = '<svg class="lg-heli-svg" viewBox="0 0 240 110" aria-hidden="true">' +
    '<defs><linearGradient id="hBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#E9F0FA"/><stop offset="1" stop-color="#B9C8DE"/></linearGradient>' +
    '<linearGradient id="hGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6CC3FF"/><stop offset="1" stop-color="#00249C"/></linearGradient></defs>' +
    '<rect x="116" y="16" width="8" height="18" rx="2" fill="#5A6496"/>' +
    '<path d="M160 50 L226 42 L228 50 L162 62 Z" fill="url(#hBody)" stroke="#9AAACB" stroke-width="1"/>' +
    '<path d="M218 26 L232 26 L230 50 L220 50 Z" fill="#00249C"/><path d="M219 30 L230 30 L229 36 L219.6 36 Z" fill="#F0006C"/>' +
    '<g class="lg-trot"><ellipse cx="226" cy="46" rx="2.5" ry="12" fill="#2A3270" opacity=".75"/></g>' +
    '<path d="M62 38 Q 38 42 32 62 Q 32 80 58 82 L148 82 Q 168 80 172 64 L172 48 Q 166 36 144 34 L 84 34 Q 70 34 62 38 Z" fill="url(#hBody)" stroke="#9AAACB" stroke-width="1.2"/>' +
    '<path d="M40 60 Q 44 44 66 41 L 90 40 L 90 62 Z" fill="url(#hGlass)"/><path d="M48 52 Q 54 45 64 44" stroke="#fff" stroke-width="2" fill="none" opacity=".7" stroke-linecap="round"/>' +
    '<rect x="98" y="42" width="20" height="16" rx="3" fill="url(#hGlass)"/><rect x="124" y="42" width="20" height="16" rx="3" fill="url(#hGlass)"/>' +
    '<path d="M36 68 L170 66 L170 71 L38 73 Z" fill="#0084F0"/><path d="M40 74 L168 72 L166 76 L44 78 Z" fill="#F0006C"/>' +
    '<text x="132" y="64" text-anchor="middle" font-family="Poppins, sans-serif" font-weight="800" font-size="7.5" fill="#00249C" letter-spacing=".6">PORT ENERGY</text>' +
    '<g stroke="#5A6496" stroke-width="3" stroke-linecap="round" fill="none"><path d="M70 82 L64 94 M140 82 L146 94"/><path d="M44 95 Q 46 98 52 98 L168 98"/></g>' +
    '<circle class="lg-hblink" cx="172" cy="56" r="2.6" fill="#FF3B6B"/>' +
    '<g class="lg-mrot"><rect x="12" y="14" width="216" height="4" rx="2" fill="#2A3270" opacity=".8"/></g><ellipse cx="120" cy="16" rx="6" ry="3.5" fill="#2A3270"/>' +
    '</svg>';

  function mode() { var m = null; try { m = localStorage.getItem(KEY); } catch (x) { } if (m === 'day' || m === 'night') return m; var h = new Date().getHours(); return h >= 6 && h < 18 ? 'day' : 'night'; }
  function apply(m) {
    var lg = $('login'); if (!lg) return;
    lg.classList.toggle('lg-day', m === 'day');
    var t = $('lgMode'); if (t) { t.setAttribute('aria-pressed', m === 'day' ? 'false' : 'true'); t.title = m === 'day' ? 'Switch to night' : 'Switch to day'; }
    var mc = document.querySelector('meta[name="theme-color"]'); if (mc && lg.style.display !== 'none') mc.setAttribute('content', m === 'day' ? '#0A6BD6' : '#001250');
  }
  function build() {
    var lg = $('login'); if (!lg || $('lgMode')) return;
    var top = lg.querySelector('.lg-top');
    if (top) top.insertAdjacentHTML('beforeend', '<button type="button" class="lg-mode" id="lgMode" aria-label="Day or night mode"><span class="lg-mode-sky"><i></i><i></i><i></i></span><span class="lg-mode-knob"><b class="lg-crater"></b><b class="lg-crater c2"></b></span></button>');
    var bg = lg.querySelector('.lg-bg');
    if (bg) bg.insertAdjacentHTML('beforeend', '<div class="lg-fly" aria-hidden="true">' + HELI + '</div><i class="lg-cloud k1"></i><i class="lg-cloud k2"></i><i class="lg-cloud k3"></i>');
    $('lgMode').onclick = function () { var m = mode() === 'day' ? 'night' : 'day'; try { localStorage.setItem(KEY, m); } catch (x) { } lg.classList.add('lg-switching'); apply(m); setTimeout(function () { lg.classList.remove('lg-switching'); }, 900); };
    apply(mode());
  }

  /* the helicopter brings the sign-in card down, unhooks it and flies away */
  function deliver() {
    if (done || calm) return; done = true;
    var lg = $('login'), card = lg && lg.querySelector('.lg-card'); if (!card || !card.animate) return;
    var r = card.getBoundingClientRect(); if (!r.width) return;
    var hw = Math.min(210, Math.max(150, r.width * .48)), hh = hw * 110 / 240, gap = Math.min(78, r.height * .2), rigH = hh + gap;
    var rig = document.createElement('div'); rig.className = 'lg-rig';
    rig.style.cssText = 'left:' + r.left + 'px;top:' + (r.top - rigH + 6) + 'px;width:' + r.width + 'px;height:' + rigH + 'px';
    var bx = r.width / 2, by = hh * 82 / 110, inset = Math.min(34, r.width * .1);
    rig.innerHTML = '<svg class="lg-cables" width="' + r.width + '" height="' + rigH + '"><path d="M' + bx + ' ' + by + ' L' + inset + ' ' + rigH + ' M' + bx + ' ' + by + ' L' + (r.width - inset) + ' ' + rigH + '" stroke="#C9D3FF" stroke-width="1.6" fill="none"/><circle cx="' + inset + '" cy="' + (rigH - 2) + '" r="3.5" fill="#FFC21A"/><circle cx="' + (r.width - inset) + '" cy="' + (rigH - 2) + '" r="3.5" fill="#FFC21A"/></svg>' +
      '<div class="lg-heli" style="width:' + hw + 'px;left:' + (bx - hw / 2) + 'px">' + HELI + '</div>';
    document.body.appendChild(rig);
    var drop = -(r.bottom + 40), ease = 'cubic-bezier(.22,.75,.25,1)';
    card.style.animation = 'none';
    var kf = [{ transform: 'translate(18vw,' + drop + 'px) rotate(-3deg)' }, { transform: 'translate(0,-14px) rotate(1deg)', offset: .78 }, { transform: 'translate(0,0) rotate(0)' }];
    var a1 = card.animate(kf, { duration: 1500, easing: ease, fill: 'backwards' });
    rig.animate(kf, { duration: 1500, easing: ease, fill: 'backwards' });
    a1.onfinish = function () {
      card.classList.add('lg-landed');
      rig.querySelector('.lg-cables').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: 'forwards' });
      var fly = rig.querySelector('.lg-heli').animate([
        { transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(0,-34px) rotate(-4deg)', offset: .25 },
        { transform: 'translate(-' + (r.left + r.width) + 'px,-' + (r.top + 260) + 'px) rotate(-12deg) scale(.7)' }], { duration: 1500, delay: 120, easing: 'cubic-bezier(.5,0,.75,.4)', fill: 'forwards' });
      fly.onfinish = function () { rig.remove(); };
    };
    var inp = $('lid'); if (inp && !('ontouchstart' in window)) setTimeout(function () { try { inp.focus({ preventScroll: true }); } catch (x) { } }, 1550);
  }

  function watch() {
    var lg = $('login'); if (!lg) return;
    build();
    lg.addEventListener('scroll', function () { if (lg.scrollLeft) lg.scrollLeft = 0; }, { passive: true });
    var check = function () { if (lg.style.display !== 'none' && getComputedStyle(lg).display !== 'none') { apply(mode()); requestAnimationFrame(function () { requestAnimationFrame(deliver); }); } };
    new MutationObserver(check).observe(lg, { attributes: true, attributeFilter: ['style'] });
    check();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
})();
