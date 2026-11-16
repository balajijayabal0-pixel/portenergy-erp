/* © 2026 Port Energy Private Limited. All rights reserved. Proprietary and confidential. */
/**
 * PORT ENERGY ERP - GREETINGS
 *  1. Sign-in page: staff birthday (first name + photo) and festival wishes (Pongal, Diwali, New Year...) with animation
 *  2. Date-of-birth gate: after sign-in a staff member without a DOB must enter it before using the app
 *  3. Admin page (System > Greetings): add / edit festivals, set staff birthdays, festival photo, preview
 * Server calls (Greetings.gs): greetToday, dobGet, dobSave, greetAdminGet, greetFestSave, dobAdminSave
 * Loaded BEFORE app.js; uses window.PE only when called.
 */
(function () {
  'use strict';
  var P = function () { return window.PE; };
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function validIso(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !isNaN(new Date(s + 'T00:00:00').getTime()); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ================================================================
     1. ANIMATION ENGINE (canvas, no library)
        types: fireworks, crackers, confetti, emoji  (any mix)
     ================================================================ */
  var PAL = {
    multi: ['#FF5FA8', '#F0006C', '#7FC4FF', '#2BE0C0', '#FFD76A', '#B58CFF', '#FF9F43'],
    tricolor: ['#FF9933', '#FFFFFF', '#138808', '#3D7BFF'],
    gold: ['#FFE08A', '#FFC13B', '#FF9A1F', '#FFF3C4', '#FF6B3D'],
    pink: ['#FF5FA8', '#F0006C', '#FFB3D5', '#FFFFFF']
  };
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  function Engine(cv) {
    var ctx = cv.getContext('2d'), raf = 0, W = 0, H = 0, dpr = 1, last = 0, run = false;
    var spec = null, pal = PAL.multi, parts = [], rockets = [], sparks = [], pots = [], tR = 0, tP = 0;
    var small = false;

    function size() {
      var r = cv.parentNode.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      small = W < 700;
    }
    function has(t) { return spec && spec.types.indexOf(t) > -1; }

    function launch(big) {
      rockets.push({ x: rnd(W * .12, W * .88), y: H + 10, vy: -rnd(H * .011, H * .015) - 3, ty: rnd(H * .12, H * .5), c: pick(pal), big: !!big, tr: [] });
    }
    function burst(x, y, c, big) {
      var n = (big ? 120 : 80) * (small ? .7 : 1), two = Math.random() < .4 ? pick(pal) : c;
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.2832, s = rnd(.6, big ? 6.2 : 4.6) * (small ? .8 : 1);
        sparks.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, dec: rnd(.008, .016), c: i % 3 ? c : two, r: rnd(1.5, 2.8) });
      }
    }
    function pot() {
      pots.push({ x: rnd(W * .08, W * .92), t: 0, max: rnd(70, 120), c: pick(PAL.gold) });
    }
    function seed() {
      parts = []; rockets = []; sparks = []; pots = [];
      var count = small ? 45 : 90, i;
      if (has('confetti')) for (i = 0; i < count; i++) parts.push({ k: 'c', x: rnd(0, W), y: rnd(-H, H), vx: rnd(-.5, .5), vy: rnd(.9, 2.4), w: rnd(6, 11), h: rnd(3, 6), a: rnd(0, 6.28), va: rnd(-.12, .12), c: pick(pal), ph: rnd(0, 6.28) });
      if (has('emoji') && spec.emojis.length) for (i = 0; i < (small ? 14 : 26); i++) parts.push(newEmoji(true));
      if (spec.balloons) for (i = 0; i < (small ? 7 : 12); i++) parts.push({ k: 'b', ch: pick(['🎈', '🎈', '🎂', '🎉']), x: rnd(0, W), y: rnd(H, H * 1.8), vy: -rnd(.7, 1.6), s: rnd(26, 40), ph: rnd(0, 6.28) });
    }
    function newEmoji(init) {
      return { k: 'e', ch: pick(spec.emojis), x: rnd(0, W), y: init ? rnd(-H, H) : -30, vy: rnd(.8, 2), s: rnd(20, 36), ph: rnd(0, 6.28), va: rnd(-.03, .03), a: rnd(-.4, .4) };
    }

    function frame(t) {
      if (!run) return;
      raf = requestAnimationFrame(frame);
      if (document.hidden) { last = t; return; }
      var dt = Math.min(2.2, (t - (last || t)) / 16.67); last = t;
      ctx.clearRect(0, 0, W, H);
      var i, p;
      /* confetti / emoji / balloons */
      for (i = 0; i < parts.length; i++) {
        p = parts[i];
        if (p.k === 'c') {
          p.ph += .04 * dt; p.x += (p.vx + Math.sin(p.ph) * .8) * dt; p.y += p.vy * dt; p.a += p.va * dt;
          if (p.y > H + 12) { p.y = -12; p.x = rnd(0, W); }
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.globalAlpha = .92; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
        } else if (p.k === 'e') {
          p.ph += .03 * dt; p.x += Math.sin(p.ph) * .7 * dt; p.y += p.vy * dt; p.a += p.va * dt;
          if (p.y > H + 40) parts[i] = newEmoji(false);
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.font = p.s + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.ch, 0, 0); ctx.restore();
        } else {
          p.ph += .03 * dt; p.x += Math.sin(p.ph) * .6 * dt; p.y += p.vy * dt;
          if (p.y < -60) { p.y = H + 40; p.x = rnd(0, W); }
          ctx.save(); ctx.translate(p.x, p.y); ctx.font = p.s + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.ch, 0, 0); ctx.restore();
        }
      }
      /* launch rockets */
      if (has('fireworks') || has('crackers')) {
        tR -= dt; if (tR <= 0) { launch(has('crackers') && Math.random() < .4); tR = has('crackers') ? rnd(18, 42) : rnd(30, 62); }
      }
      if (has('crackers')) { tP -= dt; if (tP <= 0) { pot(); tP = rnd(40, 90); } }
      /* rockets */
      ctx.globalCompositeOperation = 'lighter';
      for (i = rockets.length - 1; i >= 0; i--) {
        p = rockets[i]; p.y += p.vy * dt; p.vy *= .991; p.tr.push([p.x, p.y]); if (p.tr.length > 9) p.tr.shift();
        ctx.strokeStyle = p.c; ctx.lineWidth = 2; ctx.globalAlpha = .8; ctx.beginPath();
        for (var k = 0; k < p.tr.length; k++) { if (k) ctx.lineTo(p.tr[k][0], p.tr[k][1]); else ctx.moveTo(p.tr[k][0], p.tr[k][1]); }
        ctx.stroke();
        if (p.y <= p.ty || p.vy > -1.2) { burst(p.x, p.y, p.c, p.big); rockets.splice(i, 1); }
      }
      /* ground flower pots (crackers) */
      for (i = pots.length - 1; i >= 0; i--) {
        p = pots[i]; p.t += dt;
        for (var j = 0; j < 3; j++) { var a = -1.5708 + rnd(-.45, .45), s = rnd(3, 7.5); sparks.push({ x: p.x, y: H - 4, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, dec: rnd(.022, .04), c: p.c, r: rnd(1, 2) }); }
        if (p.t > p.max) pots.splice(i, 1);
      }
      /* sparks */
      for (i = sparks.length - 1; i >= 0; i--) {
        p = sparks[i]; p.vx *= .985; p.vy = p.vy * .985 + .05 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= p.dec * dt;
        if (p.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = p.c; ctx.lineWidth = p.r * .7; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2); ctx.stroke();
      }
      if (sparks.length > 1800) sparks.splice(0, sparks.length - 1800);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }

    return {
      start: function (s) {
        spec = s; pal = PAL[s.pal] || PAL.multi;
        if (REDUCED) return;
        var r0 = cv.parentNode.getBoundingClientRect(); if (r0.width < 10 || r0.height < 10) return;   /* hidden: start later */
        size(); seed(); run = true; last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
      },
      stop: function () { run = false; cancelAnimationFrame(raf); if (W) ctx.clearRect(0, 0, W, H); },
      resize: function () { if (spec && run) { size(); seed(); } },
      running: function () { return run; }
    };
  }

  /* ---------- turn server data into an animation spec ---------- */
  function specFrom(data) {
    var types = [], emojis = [], pal = 'multi', balloons = false;
    var f = data && data.festival;
    if (f) {
      String(f.anim || 'fireworks').split('+').forEach(function (t) { t = t.trim(); if (/^(fireworks|crackers|confetti|emoji)$/.test(t) && types.indexOf(t) < 0) types.push(t); });
      emojis = String(f.emojis || '').split(/\s+/).filter(Boolean);
      if (PAL[f.pal]) pal = f.pal;
      if (types.indexOf('emoji') > -1 && !emojis.length) types.splice(types.indexOf('emoji'), 1);
    }
    if (data && data.birthdays && data.birthdays.length) { if (types.indexOf('confetti') < 0) types.push('confetti'); balloons = true; }
    return types.length || balloons ? { types: types, emojis: emojis, pal: pal, balloons: balloons } : null;
  }

  /* ---------- the greeting cards ---------- */
  function avatar(b) {
    var ini = P() && P().initials ? P().initials(b.first) : String(b.first || '?').slice(0, 1).toUpperCase();
    return '<span class="pg-av">' + (b.photo ? '<img src="' + esc(b.photo) + '" alt="">' : '<b>' + esc(ini) + '</b>') + '</span>';
  }
  function joinNames(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' & ' + a[a.length - 1]; }
  function cardsHtml(data) {
    var h = '', f = data && data.festival, b = (data && data.birthdays) || [];
    if (f) {
      var title = f.title || ('Happy ' + (f.name || 'Festival') + '!');
      h += '<div class="pg-card pg-fest">' + (f.img ? '<img class="pg-img" src="' + esc(f.img) + '" alt="">' : '') +
        '<div class="pg-t"><h2>' + esc(title) + '</h2>' + (f.msg ? '<p>' + esc(f.msg) + '</p>' : '') + '</div></div>';
    }
    if (b.length) {
      var names = b.map(function (x) { return x.first; });
      h += '<div class="pg-card pg-bday"><div class="pg-avs">' + b.slice(0, 4).map(avatar).join('') + '</div>' +
        '<div class="pg-t"><small>Happy Birthday 🎂</small><h2>' + esc(joinNames(names)) + '</h2><p>Wishing you a wonderful year ahead - from everyone at Port Energy.</p></div></div>';
    }
    return h;
  }

  /* mount cards + canvas into a host element; returns {stop} */
  function mount(host, data, opts) {
    opts = opts || {};
    host.innerHTML = '<canvas class="pg-cv"></canvas><div class="pg-cards">' + cardsHtml(data) + (opts.close ? '<button type="button" class="pg-x" aria-label="Close">\u00d7</button>' : '') + '</div>';
    var eng = Engine(host.querySelector('.pg-cv')), spec = specFrom(data);
    if (spec) eng.start(spec);
    var onR = function () { eng.resize(); };
    window.addEventListener('resize', onR);
    var x = host.querySelector('.pg-x');
    if (x) x.onclick = function () { if (opts.onClose) opts.onClose(); };
    return { eng: eng, spec: spec, stop: function () { eng.stop(); window.removeEventListener('resize', onR); } };
  }

  /* ================================================================
     2. SIGN-IN PAGE
     ================================================================ */
  var login = { host: null, h: null, data: null, closed: false };
  function loginVisible() { var l = $('login'); if (!l) return false; var r = l.getBoundingClientRect(); return getComputedStyle(l).display !== 'none' && r.width > 10 && r.height > 10; }
  function hasContent(d) { return !!(d && (d.festival || (d.birthdays && d.birthdays.length))); }

  function renderLogin() {
    var l = $('login'); if (!l) return;
    if (login.h) { login.h.stop(); login.h = null; }
    if (!login.host) { login.host = document.createElement('div'); login.host.id = 'peGreet'; l.appendChild(login.host); }
    if (!hasContent(login.data) || login.closed) { login.host.innerHTML = ''; login.host.style.display = 'none'; return; }
    login.host.style.display = '';
    login.h = mount(login.host, login.data, { close: true, onClose: function () { login.closed = true; renderLogin(); } });
  }
  function fetchGreet() {
    var P_ = P(); if (!P_ || !P_.call) return;
    P_.call('greetToday').then(function (d) {
      if (!d || typeof d !== 'object') return;
      lsSet('pe_greet', JSON.stringify({ d: iso(new Date()), data: d }));
      var same = JSON.stringify(d) === JSON.stringify(login.data);
      login.data = d; if (!same) { login.closed = false; renderLogin(); }
    }).catch(function () { /* server not updated yet or offline - keep what we have */ });
  }
  function initLogin() {
    var c = null; try { c = JSON.parse(lsGet('pe_greet') || 'null'); } catch (e) { }
    if (c && c.d === iso(new Date()) && c.data) login.data = c.data;
    renderLogin();
    fetchGreet();
    setInterval(fetchGreet, 30 * 60 * 1000);
    /* pause the animation while the sign-in page is hidden, resume when it comes back */
    setInterval(function () {
      if (!login.h || !login.h.spec) return;
      var vis = loginVisible();
      if (vis && !login.h.eng.running()) renderLogin();
      else if (!vis && login.h.eng.running()) login.h.eng.stop();
    }, 1000);
    var l = $('login');
    if (l && window.MutationObserver) new MutationObserver(function () { if (loginVisible()) { login.closed = false; if (!login.h || !login.h.eng.running()) renderLogin(); } }).observe(l, { attributes: true, attributeFilter: ['style'] });
  }

  /* ================================================================
     3. DATE-OF-BIRTH GATE (after sign-in)
     ================================================================ */
  var gateDone = {};
  function userId() { var s = P() && P().S && P().S.sess; return s && s.user ? (s.user.id || s.user.name) : ''; }
  function showGate() {
    if ($('peDob')) return;
    var today = iso(new Date());
    var ov = document.createElement('div'); ov.id = 'peDob';
    ov.innerHTML = '<div class="pd-box" role="dialog" aria-modal="true" aria-labelledby="pdT"><div class="pd-ic">🎂</div><h2 id="pdT">One last step</h2>' +
      '<p>Please enter your <b>date of birth</b> to continue. We will wish you on your special day. This is asked only once.</p>' +
      '<input class="in" type="date" id="pdIn" min="1940-01-01" max="' + today + '" aria-label="Date of birth">' +
      '<div class="pd-err" id="pdErr"></div>' +
      '<button class="btn primary" id="pdGo" type="button">Save and continue</button>' +
      '<button class="linkbtn" id="pdOut" type="button">Sign out</button></div>';
    document.body.appendChild(ov);
    var inp = $('pdIn'); setTimeout(function () { inp.focus(); }, 80);
    $('pdOut').onclick = function () { var st = P().store; try { st.del('pe_token'); st.del('pe_boot'); } catch (e) { } location.reload(); };
    $('pdGo').onclick = function () {
      var v = inp.value, err = $('pdErr'); err.textContent = '';
      if (!validIso(v)) { err.textContent = 'Please choose your date of birth.'; return; }
      var d = new Date(v + 'T00:00:00'), now = new Date(), age = now.getFullYear() - d.getFullYear() - ((now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) ? 1 : 0);
      if (age < 15 || age > 90) { err.textContent = 'Please check the date - this does not look right.'; return; }
      var b = this; P().busy(b, true);
      P().call('dobSave', P().S.token, v).then(function () {
        lsSet('pe_dob_' + userId(), '1'); ov.remove(); P().toast('Thank you! We will wish you on your birthday.');
      }).catch(function (e) { P().busy(b, false); err.textContent = e.message || 'Could not save. Please try again.'; });
    };
  }
  function checkGate() {
    var P_ = P(); if (!P_ || !P_.S || !P_.S.token || !P_.S.sess) return;
    var id = userId(); if (!id || Date.now() < (gateDone[id] || 0)) return;
    gateDone[id] = Infinity;
    if (lsGet('pe_dob_' + id) === '1') return;
    P_.call('dobGet', P_.S.token).then(function (r) {
      if (r && r.dob) lsSet('pe_dob_' + id, '1'); else if (r && r.ask !== false) showGate();
    }).catch(function () { gateDone[id] = Date.now() + 10 * 60 * 1000; /* offline or server not updated: try again in 10 minutes */ });
  }

  /* ================================================================
     4. ADMIN PAGE  (System > Greetings)
     ================================================================ */
  var ANIMS = [['fireworks', 'Fireworks'], ['crackers', 'Crackers (Diwali)'], ['confetti', 'Confetti'], ['emoji', 'Emoji rain']];
  var PALS = [['multi', 'Colourful'], ['gold', 'Gold & orange'], ['tricolor', 'Tricolour'], ['pink', 'Pink & blue']];
  function admin() { var s = P().S.sess; return !!(s && s.user && s.user.admin); }

  /* resize a picture to fit one sheet cell (about 40 KB) */
  function fitImg(file) {
    return new Promise(function (ok, bad) {
      if (!/^image\//.test(file.type)) return bad(new Error('Please choose a picture (JPG or PNG).'));
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var m = 360, sc = Math.min(1, m / Math.max(img.width, img.height)), w = Math.round(img.width * sc), h = Math.round(img.height * sc);
        var c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url);
        var q = .85, d = c.toDataURL('image/jpeg', q);
        while (d.length > 40000 && q > .35) { q -= .08; d = c.toDataURL('image/jpeg', q); }
        if (d.length > 46000) return bad(new Error('Picture is too detailed. Try a simpler or smaller one.'));
        ok(d);
      };
      img.onerror = function () { bad(new Error('Could not read this picture.')); };
      img.src = url;
    });
  }
  function newFest() { return { id: 'f' + Date.now().toString(36), name: '', title: '', msg: '', from: iso(new Date()), to: '', yearly: false, anim: 'fireworks', emojis: '', pal: 'multi', img: '', on: true }; }
  function daysTo(dob) {
    if (!validIso(dob)) return null;
    var n = new Date(), t = new Date(n.getFullYear(), n.getMonth(), n.getDate()), d = new Date(dob + 'T00:00:00'), nx = new Date(n.getFullYear(), d.getMonth(), d.getDate());
    if (nx < t) nx = new Date(n.getFullYear() + 1, d.getMonth(), d.getDate());
    return Math.round((nx - t) / 86400000);
  }
  function festPassed(f) { if (f.yearly) return false; var e = f.to || f.from; return validIso(e) && e < iso(new Date()); }

  function page(v) {
    P().setTitle('Greetings', 'Festival and birthday wishes on the sign-in page');
    if (!admin()) { if (window.PE_LOCKED) return window.PE_LOCKED(v, 'users'); v.innerHTML = '<div class="empty"><b>Not authorised</b>Only an administrator can manage greetings.</div>'; return; }
    P().skeleton(v, 6);
    P().call('greetAdminGet', P().S.token).then(function (d) { draw(v, d); }).catch(function (e) {
      var m = e.message || '';
      v.innerHTML = '<div class="empty"><b>Could not load</b>' + esc(/Unknown request/i.test(m) ? 'The server has not been updated for Greetings yet. Add Greetings.gs in Apps Script and deploy a new version.' : m) + '</div>';
    });
  }

  function draw(v, d) {
    var F = (d.festivals || []).map(function (f) { return Object.assign(newFest(), f); });
    var STAFF = (d.staff || []).map(function (s) { return { id: s.id, name: s.name, dept: s.dept || '', dob: s.dob || '', old: s.dob || '' }; });
    var q = '';

    function festCard(f, i) {
      var an = String(f.anim || '').split('+');
      return '<div class="pg-fe' + (f.on ? '' : ' off') + '" data-i="' + i + '">' +
        '<div class="pg-fe-h"><label class="pg-sw"><input type="checkbox" data-f="on"' + (f.on ? ' checked' : '') + '> <span>On</span></label>' +
        '<b class="pg-fe-n">' + esc(f.name || 'New festival') + '</b>' + (festPassed(f) ? '<span class="pg-badge">Date passed - update for next year</span>' : '') +
        '<span class="pg-sp"></span><button type="button" class="btn ghost sm" data-act="prev">▶ Preview</button><button type="button" class="btn ghost sm" data-act="del">Delete</button></div>' +
        '<div class="pg-grid">' +
        '<label>Name (for you)<input class="in" data-f="name" value="' + esc(f.name) + '" placeholder="Diwali"></label>' +
        '<label>Heading on sign-in page<input class="in" data-f="title" value="' + esc(f.title) + '" placeholder="e.g. Happy Diwali!"></label>' +
        '<label class="pg-wide">Message<input class="in" data-f="msg" value="' + esc(f.msg) + '" placeholder="Short wish shown under the heading"></label>' +
        '<label>From date<input class="in" type="date" data-f="from" value="' + esc(f.from) + '"></label>' +
        '<label>To date (blank = one day)<input class="in" type="date" data-f="to" value="' + esc(f.to) + '"></label>' +
        '<label class="pg-chk pg-wide"><input type="checkbox" data-f="yearly"' + (f.yearly ? ' checked' : '') + '> Repeat every year on the same date (for fixed dates like New Year, Republic Day)</label>' +
        '<div class="pg-wide pg-an"><span>Animation</span>' + ANIMS.map(function (a) { return '<label class="pg-chk"><input type="checkbox" data-a="' + a[0] + '"' + (an.indexOf(a[0]) > -1 ? ' checked' : '') + '> ' + a[1] + '</label>'; }).join('') + '</div>' +
        '<label>Emojis for rain<input class="in" data-f="emojis" value="' + esc(f.emojis) + '" placeholder="🌾 🍯 🎉"></label>' +
        '<label>Colours<select class="in" data-f="pal">' + PALS.map(function (p) { return '<option value="' + p[0] + '"' + (f.pal === p[0] ? ' selected' : '') + '>' + p[1] + '</option>'; }).join('') + '</select></label>' +
        '<div class="pg-wide pg-ph"><span>Festival picture (optional)</span>' + (f.img ? '<img src="' + esc(f.img) + '" alt=""><button type="button" class="btn ghost sm" data-act="rmimg">Remove</button>' : '') +
        '<button type="button" class="btn ghost sm" data-act="img">' + (f.img ? 'Change picture' : 'Add picture') + '</button></div>' +
        '</div></div>';
    }
    function staffRows() {
      var ql = q.trim().toLowerCase();
      return STAFF.filter(function (s) { return !ql || (s.name + ' ' + s.dept).toLowerCase().indexOf(ql) > -1; }).map(function (s) {
        var n = daysTo(s.dob), tag = n === null ? '<span class="pg-badge">DOB missing</span>' : (n === 0 ? '<span class="pg-today">Today 🎂</span>' : '<small>in ' + n + ' day' + (n === 1 ? '' : 's') + '</small>');
        return '<tr data-id="' + esc(s.id) + '"><td><b>' + esc(s.name) + '</b><small>' + esc(s.dept) + '</small></td><td><input class="in" type="date" data-dob value="' + esc(s.dob) + '" max="' + iso(new Date()) + '"></td><td>' + tag + '</td></tr>';
      }).join('') || '<tr><td colspan="3"><span class="note">No staff found.</span></td></tr>';
    }
    function html() {
      var missing = STAFF.filter(function (s) { return !validIso(s.dob); }).length;
      return '<div class="glass panel pg-adm"><h3 style="margin:0 0 2px">Festival wishes</h3>' +
        '<p class="note" style="margin:0 0 12px">On the dates you set, the sign-in page shows the heading, message, picture and animation. Fixed dates can repeat every year. Dates that move (Diwali, Pongal, Ramzan) need a new date each year.</p>' +
        '<div id="pgFests">' + (F.length ? F.map(festCard).join('') : '<p class="note">No festivals yet.</p>') + '</div>' +
        '<div class="mfoot" style="justify-content:flex-start"><button type="button" class="btn" id="pgAdd">+ Add festival</button><button type="button" class="btn primary" id="pgSaveF">Save festivals</button></div></div>' +
        '<div class="glass panel pg-adm" style="margin-top:14px"><h3 style="margin:0 0 2px">Staff birthdays</h3>' +
        '<p class="note" style="margin:0 0 10px">Staff enter their own date of birth the first time they sign in. You can correct any date here. ' + (missing ? '<b>' + missing + ' still missing.</b> ' : '') + 'Photos come from <b>System &gt; User photos</b>.</p>' +
        '<div class="pg-bar"><input class="in" id="pgQ" placeholder="Search staff…" autocomplete="off"><button type="button" class="btn ghost sm" id="pgPrevB">▶ Preview birthday wish</button></div>' +
        '<div class="pg-tw"><table class="pg-tb"><thead><tr><th>Staff</th><th>Date of birth</th><th>Next birthday</th></tr></thead><tbody id="pgRows">' + staffRows() + '</tbody></table></div>' +
        '<div class="mfoot" style="justify-content:flex-start"><button type="button" class="btn primary" id="pgSaveS">Save birthdays</button></div></div>';
    }
    v.innerHTML = html();

    function preview(data) {
      var host = document.createElement('div'); host.className = 'pg-prev';
      document.body.appendChild(host);
      var h = mount(host, data, { close: true, onClose: function () { h.stop(); host.remove(); } });
      if (!h.spec && REDUCED) P().toast('Your device is set to reduce motion, so the animation is off.');
    }
    function rerenderFests() { $('pgFests').innerHTML = F.length ? F.map(festCard).join('') : '<p class="note">No festivals yet.</p>'; }

    /* festivals: one set of handlers for every card */
    var box = $('pgFests');
    function cardOf(el) { var c = el.closest('.pg-fe'); return c ? { c: c, i: +c.dataset.i } : null; }
    box.addEventListener('input', function (e) {
      var o = cardOf(e.target); if (!o) return; var f = F[o.i], k = e.target.dataset.f; if (!k) return;
      f[k] = e.target.value; if (k === 'name') o.c.querySelector('.pg-fe-n').textContent = f.name || 'New festival';
    });
    box.addEventListener('change', function (e) {
      var o = cardOf(e.target); if (!o) return; var f = F[o.i], t = e.target;
      if (t.dataset.f === 'on') { f.on = t.checked; o.c.classList.toggle('off', !f.on); }
      else if (t.dataset.f === 'yearly') f.yearly = t.checked;
      else if (t.dataset.f === 'pal') f.pal = t.value;
      else if (t.dataset.a) { var set = String(f.anim || '').split('+').filter(Boolean); var ix = set.indexOf(t.dataset.a); if (t.checked && ix < 0) set.push(t.dataset.a); if (!t.checked && ix > -1) set.splice(ix, 1); f.anim = set.join('+'); }
    });
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return; var o = cardOf(b); if (!o) return; var f = F[o.i], a = b.dataset.act;
      if (a === 'del') { if (confirm('Delete "' + (f.name || 'this festival') + '"?')) { F.splice(o.i, 1); rerenderFests(); } }
      else if (a === 'prev') preview({ festival: f, birthdays: [] });
      else if (a === 'rmimg') { f.img = ''; rerenderFests(); }
      else if (a === 'img') {
        var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
        inp.onchange = function () { if (inp.files[0]) fitImg(inp.files[0]).then(function (d2) { f.img = d2; rerenderFests(); }).catch(function (er) { P().toast(er.message, true); }); };
        inp.click();
      }
    });
    $('pgAdd').onclick = function () { F.unshift(newFest()); rerenderFests(); var n = box.querySelector('[data-f="name"]'); if (n) n.focus(); };
    $('pgSaveF').onclick = function () {
      var b = this, i, f;
      for (i = 0; i < F.length; i++) {
        f = F[i];
        if (!String(f.name || f.title).trim()) return P().toast('Give every festival a name or heading.', true);
        if (!validIso(f.from)) return P().toast('Choose the date for "' + (f.name || f.title) + '".', true);
        if (f.to && (!validIso(f.to) || f.to < f.from)) return P().toast('"To date" of "' + (f.name || f.title) + '" must be on or after the From date.', true);
        if (!String(f.anim || '').trim() && !f.img) return P().toast('Choose an animation for "' + (f.name || f.title) + '".', true);
      }
      P().busy(b, true);
      P().call('greetFestSave', P().S.token, F).then(function (r) {
        F = (r.festivals || F).map(function (x) { return Object.assign(newFest(), x); }); rerenderFests(); P().busy(b, false); P().toast('Festivals saved.');
        try { localStorage.removeItem('pe_greet'); } catch (x) { }
      }).catch(function (e) { P().busy(b, false); P().fail(e); });
    };

    /* birthdays */
    $('pgQ').oninput = function () { q = this.value; $('pgRows').innerHTML = staffRows(); };
    $('pgRows').addEventListener('change', function (e) {
      var t = e.target; if (!t.hasAttribute('data-dob')) return; var tr = t.closest('tr'), id = tr.dataset.id;
      STAFF.forEach(function (s) { if (String(s.id) === id) s.dob = t.value; });
    });
    $('pgPrevB').onclick = function () {
      var me = P().S.sess.user, ph = null;
      preview({ festival: null, birthdays: [{ first: String(me.name || 'Friend').split(/\s+/)[0], photo: ph }] });
    };
    $('pgSaveS').onclick = function () {
      var b = this, map = {}, n = 0;
      STAFF.forEach(function (s) { if (s.dob !== s.old) { if (s.dob && !validIso(s.dob)) return; map[s.id] = s.dob; n++; } });
      if (!n) return P().toast('No changes to save.');
      P().busy(b, true);
      P().call('dobAdminSave', P().S.token, map).then(function (r) {
        STAFF.forEach(function (s) { s.old = s.dob; }); (r && r.staff || []).forEach(function (x) { STAFF.forEach(function (s) { if (String(s.id) === String(x.id)) { s.dob = s.old = x.dob || ''; } }); });
        $('pgRows').innerHTML = staffRows(); P().busy(b, false); P().toast('Birthdays saved.');
        try { localStorage.removeItem('pe_greet'); } catch (x) { }
      }).catch(function (e) { P().busy(b, false); P().fail(e); });
    };
  }

  /* menu item (administrators only) */
  var prevNav = window.PE_NAV;
  window.PE_NAV = function () {
    if (prevNav) try { prevNav(); } catch (x) { }
    try {
      var nav = $('nav'); if (!nav || !P() || !P().S.sess || !admin() || nav.querySelector('[data-v="greet"]')) return;
      var ref = nav.querySelector('[data-v="uphotos"]'); var host = ref ? ref.parentNode : null; if (!host) return;
      var b = document.createElement('button'); b.className = 'ni'; b.dataset.v = 'greet'; b.innerHTML = P().icon('megaphone') + 'Greetings';
      host.insertBefore(b, ref.nextSibling);
      b.onclick = function () { P().closeSide(); P().go({ v: 'greet' }); };
      if (P().markNav) P().markNav();
    } catch (e) { }
  };
  window.PE_VIEWS = window.PE_VIEWS || {}; window.PE_VIEWS.greet = page;
  window.PE_GREET = { mount: mount, specFrom: specFrom, cardsHtml: cardsHtml };

  /* start: wait for the app to be ready */
  function boot() {
    if (!window.PE) return setTimeout(boot, 150);
    initLogin();
    setInterval(function () { if (!document.hidden) checkGate(); }, 2500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
