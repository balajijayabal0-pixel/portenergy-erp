/* © 2026 Port Energy Private Limited. All rights reserved.
   PORT ENERGY ERP - Team chat + in-app notifications (bell) + phone alerts.
   Loads before app.js. Talks to Chat.gs: pulse, chatSend, chatDelete, chatRestore, notifRead. */
(function () {
  'use strict';
  var P = function () { return window.PE; };
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var ls = { get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (x) { return d; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (x) { } } };
  var C = { me: '', admin: false, msgs: [], cv: 0, nf: [], nv: 0, read: 0, seen: 0, inbox: null, timer: null, busy: false, reply: null, on: false, last: 0 };
  var COLORS = ['#1E5BFF', '#F3026E', '#7A3CF0', '#00A3C4', '#E8590C', '#2B8A3E', '#C2255C', '#5C7CFA', '#0CA678', '#D9480F'];
  function col(n) { var h = 7; String(n).split('').forEach(function (c) { h = (h * 37 + c.charCodeAt(0)) >>> 0; }); return COLORS[h % COLORS.length]; }
  function ini(n) { return String(n || '?').replace(/[^A-Za-z ]/g, ' ').trim().split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase() || 'PE'; }
  function tok() { var p = P(); return p && p.S && p.S.token; }
  function key(k) { return 'pe_c_' + String(C.me).toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + k; }
  function tm(t) { var d = new Date(t); return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }); }
  function day(t) {
    var d = new Date(t), n = new Date(), y = new Date(); y.setDate(n.getDate() - 1);
    if (d.toDateString() === n.toDateString()) return 'Today'; if (d.toDateString() === y.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: d.getFullYear() === n.getFullYear() ? undefined : 'numeric' });
  }
  function ago(t) { var s = (Date.now() - t) / 1000; if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago'; if (s < 86400) return Math.floor(s / 3600) + ' h ago'; return day(t) + ', ' + tm(t); }
  function link(t) { return esc(t).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g, '<br>'); }
  var IC = {
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/>',
    bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
    reply: '<path d="M9 14L4 9l5-5"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>',
    del: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>', check: '<path d="M20 6L9 17l-5-5"/>'
  };
  function ic(n, s) { return '<svg width="' + (s || 18) + '" height="' + (s || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + IC[n] + '</svg>'; }

  /* ---------------- state ---------------- */
  function load(me) {
    if (C.me === me) return; C.me = me;
    C.msgs = ls.get(key('m'), []); C.cv = ls.get(key('cv'), 0); C.nf = ls.get(key('n'), []); C.nv = ls.get(key('nv'), 0);
    C.read = ls.get(key('r'), 0); C.seen = ls.get(key('s'), 0); C.inbox = ls.get(key('i'), null);
  }
  function save() { ls.set(key('m'), C.msgs.slice(-250)); ls.set(key('cv'), C.cv); ls.set(key('n'), C.nf.slice(-80)); ls.set(key('nv'), C.nv); ls.set(key('r'), C.read); ls.set(key('s'), C.seen); ls.set(key('i'), C.inbox); }
  function merge(list) {
    var by = {}; C.msgs.forEach(function (m) { by[m.id] = m; });
    list.forEach(function (m) { by[m.id] = m; });
    C.msgs = Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return a.at - b.at; }).slice(-250);
  }
  function unreadChat() { return C.msgs.filter(function (m) { return m.at > C.seen && m.by !== C.me && !m.del; }).length; }
  function unreadNf() { return C.nf.filter(function (n) { return n.at > C.read && n.by !== C.me; }).length; }
  function onChat() { var p = P(); return p && p.S.route && p.S.route.v === 'chat' && !document.hidden; }

  /* ---------------- phone / desktop alerts ---------------- */
  function canAlert() { return 'Notification' in window && Notification.permission === 'granted'; }
  function alertUser(title, body, tag, route) {
    if (!canAlert()) return;
    var opt = { body: body, tag: tag, icon: '../icons/icon-192.png', badge: '../icons/icon-192.png', renotify: true, data: { route: route || null } };
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
      navigator.serviceWorker.getRegistration().then(function (r) { if (r) r.showNotification(title, opt); else new Notification(title, opt); }).catch(function () { try { new Notification(title, opt); } catch (x) { } });
    } else { try { new Notification(title, opt); } catch (x) { } }
  }
  function askAlerts(btn) {
    if (!('Notification' in window)) { P().toast('This browser cannot show alerts.', true); return; }
    Notification.requestPermission().then(function (p) {
      if (p === 'granted') { P().toast('Phone alerts are on.'); alertUser('Port Energy ERP', 'Alerts are on. You will see chat, approvals and status changes here.', 'pe-test'); }
      else P().toast('Alerts blocked. Allow notifications for this app in phone settings.', true);
      if (btn) drawAlertBtn(btn);
    });
  }
  function drawAlertBtn(b) {
    if (!b) return; var on = canAlert();
    b.className = 'pe-alertbtn' + (on ? ' on' : ''); b.innerHTML = ic(on ? 'check' : 'bell', 15) + (on ? 'Phone alerts on' : 'Turn on phone alerts');
    b.onclick = on ? null : function () { askAlerts(b); };
  }

  /* ---------------- polling ---------------- */
  function pulse() {
    var t = tok(); if (!t || C.busy || !navigator.onLine) return sched();
    C.busy = true;
    P().call('pulse', t, C.cv, C.nv).then(function (r) {
      C.busy = false; if (!r) return;
      if (!C.live) { C.live = true; ui(); }
      var first = !C.cv; load(r.me); C.admin = !!r.admin;
      if (r.chat && r.chat.length) {
        merge(r.chat);
        var fresh = r.chat.filter(function (m) { return m.at > Math.max(C.seen, C.last) && m.by !== C.me && !m.del; });
        if (!first && fresh.length && !onChat()) { var m = fresh[fresh.length - 1]; alertUser(m.by + ' · Team chat', m.text.slice(0, 140) + (fresh.length > 1 ? '  (+' + (fresh.length - 1) + ' more)' : ''), 'pe-chat', { v: 'chat' }); }
        if (!first && fresh.length && !onChat()) chime();
      }
      if (first && !C.seen) C.seen = lastAt();
      C.cv = Math.max(C.cv, r.cv || 0);
      if (r.nf && r.nf.length) {
        var known = {}; C.nf.forEach(function (n) { known[n.id] = 1; });
        var add = r.nf.filter(function (n) { return !known[n.id]; });
        C.nf = C.nf.concat(add).sort(function (a, b) { return a.at - b.at; }).slice(-80);
        if (C.nv) add.filter(function (n) { return n.by !== C.me; }).slice(-3).forEach(function (n) { alertUser(n.title, n.body, 'pe-nf-' + n.id, n.key ? { k: n.key, id: n.rid } : null); });
      }
      C.nv = Math.max(C.nv, r.nv || 0); C.read = Math.max(C.read, r.read || 0);
      C.last = Date.now(); if (onChat()) C.seen = Math.max(C.seen, lastAt());
      save(); badges(); if (onChat()) drawMsgs(); if ($('peNfPanel')) drawPanel();
      sched();
    }).catch(function (e) { C.busy = false; if (/Unknown request/i.test(e && e.message || '')) { clearTimeout(C.timer); C.timer = setTimeout(pulse, 600000); return; } sched(); });
  }
  function lastAt() { return C.msgs.length ? C.msgs[C.msgs.length - 1].at : 0; }
  function sched() {
    clearTimeout(C.timer); if (!tok()) return;
    var ms = document.hidden ? 60000 : onChat() ? 4000 : 20000;
    C.timer = setTimeout(pulse, ms);
  }
  var inbT = null;
  function watchInbox() {
    clearTimeout(inbT); var t = tok(); if (!t) return;
    inbT = setTimeout(watchInbox, document.hidden ? 180000 : 90000);
    if (!navigator.onLine) return;
    P().call('getInbox', t).then(seeInbox).catch(function () { });
  }
  function seeInbox(list) {
    if (!list || !list.map || !C.me) return;
    var ids = list.map(function (i) { return i.key + '|' + i.id + '|' + i.status; });
    if (C.inbox) {
      var add = list.filter(function (i) { return C.inbox.indexOf(i.key + '|' + i.id + '|' + i.status) < 0; });
      add.forEach(function (i, n) {
        var o = { id: 'A' + i.key + i.id + i.status, at: Date.now() + n, title: 'Waiting for your approval: ' + (i.title || '') + ' ' + i.id, body: [i.who, i.text, i.amount ? 'Rs. ' + Number(i.amount).toLocaleString('en-IN') : ''].filter(String).join(' · '), key: i.key, rid: i.id, by: '' };
        if (!C.nf.some(function (x) { return x.id === o.id; })) { C.nf.push(o); if (n < 3) alertUser(o.title, o.body, 'pe-ap-' + i.id, { k: i.key, id: i.id }); }
      });
    }
    C.inbox = ids; save(); badges(); if ($('peNfPanel')) drawPanel();
  }
  window.addEventListener('pe-fresh', function (ev) { var d = ev.detail || {}; if (d.fn === 'getInbox') seeInbox(d.res); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && tok()) { clearTimeout(C.timer); pulse(); } });
  window.addEventListener('online', function () { if (tok()) pulse(); });
  if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', function (e) { var r = e.data && e.data.peRoute; if (r) openRoute(r); });
  function openRoute(r) { if (!r || !P()) return; if (r.v) P().go(r); else if (r.k) { if (P().S.route.v === 'chat') P().go({ v: 'home' }); P().openDetail(r.k, r.id); } }
  var ctx = null;
  function chime() { try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); var o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(880, ctx.currentTime); o.frequency.setValueAtTime(1320, ctx.currentTime + .09); g.gain.setValueAtTime(.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(.12, ctx.currentTime + .02); g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .3); o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + .32); } catch (x) { } }

  /* ---------------- top bar: chat + bell ---------------- */
  function topButtons() {
    if ($('peBell')) return;
    var ai = $('aiBtn'); if (!ai) return;
    ai.insertAdjacentHTML('beforebegin', '<button class="btn soft sm pe-tb" id="peChatB" title="Team chat">' + ic('chat', 17) + '<i class="pe-dot" id="peChatN"></i></button><button class="btn soft sm pe-tb" id="peBell" title="Notifications">' + ic('bell', 17) + '<i class="pe-dot" id="peBellN"></i></button>');
    $('peChatB').onclick = function () { P().go({ v: 'chat' }); };
    $('peBell').onclick = function (e) { e.stopPropagation(); togglePanel(); };
  }
  function badges() {
    var a = unreadChat(), b = unreadNf();
    [['peChatN', a], ['peBellN', b], ['peNavChat', a]].forEach(function (x) { var el = $(x[0]); if (!el) return; el.textContent = x[1] > 99 ? '99+' : x[1]; el.style.display = x[1] ? '' : 'none'; });
    var t = a + b; try { if (navigator.setAppBadge) { if (t) navigator.setAppBadge(t); else navigator.clearAppBadge(); } } catch (x) { }
  }
  function togglePanel() {
    var p = $('peNfPanel'); if (p) { closePanel(); return; }
    document.body.insertAdjacentHTML('beforeend', '<div class="pe-nfp" id="peNfPanel" role="dialog" aria-label="Notifications"><div class="pe-nfh"><b>Notifications</b><button class="linkbtn" id="peNfAll">Mark all read</button><button class="pe-x" id="peNfX" aria-label="Close">' + ic('x', 18) + '</button></div><button id="peAlertB"></button><div class="pe-nfl" id="peNfList"></div></div><div class="pe-nfs" id="peNfScrim"></div>');
    $('peNfX').onclick = closePanel; $('peNfScrim').onclick = closePanel;
    $('peNfAll').onclick = function () { markRead(); drawPanel(); };
    drawAlertBtn($('peAlertB')); drawPanel();
    requestAnimationFrame(function () { $('peNfPanel').classList.add('open'); });
  }
  function closePanel() { var p = $('peNfPanel'), s = $('peNfScrim'); if (p) p.remove(); if (s) s.remove(); }
  function markRead() { var t = C.nf.reduce(function (m, n) { return Math.max(m, n.at); }, Date.now()); C.read = t; save(); badges(); var k = tok(); if (k) P().call('notifRead', k, t).catch(function () { }); }
  function drawPanel() {
    var el = $('peNfList'); if (!el) return;
    var list = C.nf.filter(function (n) { return n.by !== C.me; }).slice().reverse().slice(0, 60);
    var uc = unreadChat();
    el.innerHTML = (uc ? '<button class="pe-nfi chat" data-chat="1"><span class="pe-nfic" style="background:#7A3CF0">' + ic('chat', 16) + '</span><span><b>' + uc + ' new message' + (uc > 1 ? 's' : '') + ' in Team chat</b><small>Tap to open</small></span></button>' : '') +
      (list.length ? list.map(function (n) {
        var ap = n.id.charAt(0) === 'A', c = ap ? '#F3026E' : n.key === 'notices' ? '#E8590C' : '#1E5BFF';
        return '<button class="pe-nfi' + (n.at > C.read ? ' new' : '') + '" data-k="' + esc(n.key) + '" data-id="' + esc(n.rid) + '"><span class="pe-nfic" style="background:' + c + '">' + ic(ap ? 'check' : 'bell', 15) + '</span><span><b>' + esc(n.title) + '</b><small>' + esc(n.body) + '</small><em>' + ago(n.at) + '</em></span></button>';
      }).join('') : (uc ? '' : '<div class="empty"><b>No notifications yet</b>Approvals, status changes, tasks and notices will show here.</div>'));
    el.querySelectorAll('.pe-nfi').forEach(function (b) {
      b.onclick = function () { closePanel(); markRead(); if (b.dataset.chat) P().go({ v: 'chat' }); else if (b.dataset.k) openRoute({ k: b.dataset.k, id: b.dataset.id }); };
    });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('peNfPanel')) closePanel(); });

  /* ---------------- chat page ---------------- */
  function chatPage(v) {
    P().setTitle('Team chat', 'Port Energy · everyone in the company');
    v.classList.add('pe-chatv');
    v.innerHTML = '<div class="pe-ch glass"><div class="pe-chh"><span class="pe-chlogo">PE</span><span><b>Port Energy Team</b><small id="peChSub">All staff · messages are seen by everyone</small></span><button id="peAlertC"></button></div>' +
      '<div class="pe-chm" id="peChM"></div><div class="pe-chr" id="peChR" style="display:none"></div>' +
      '<form class="pe-chf" id="peChF" autocomplete="off"><textarea id="peChIn" rows="1" maxlength="2000" placeholder="Type a message"></textarea><button class="pe-send" type="submit" aria-label="Send">' + ic('send', 19) + '</button></form></div>';
    drawAlertBtn($('peAlertC'));
    var inp = $('peChIn'), f = $('peChF');
    var grow = function () { inp.style.height = 'auto'; inp.style.height = Math.min(inp.scrollHeight + 3, 130) + 'px'; };
    inp.oninput = grow;
    inp.onkeydown = function (e) { if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) { e.preventDefault(); send(); } };
    f.onsubmit = function (e) { e.preventDefault(); send(); };
    C.seen = Math.max(C.seen, lastAt()); save(); badges();
    drawMsgs(true);
    clearTimeout(C.timer); pulse();
  }
  function send() {
    var inp = $('peChIn'); if (!inp) return; var t = inp.value.trim(); if (!t) return;
    var tmp = { id: 'tmp' + Date.now(), at: Date.now(), by: C.me, text: t, reply: C.reply ? C.reply.id : '', del: 0, v: 0, pending: 1 };
    C.msgs.push(tmp); inp.value = ''; inp.style.height = 'auto'; setReply(null); drawMsgs(true);
    P().call('chatSend', tok(), t, tmp.reply).then(function (m) {
      C.msgs = C.msgs.filter(function (x) { return x.id !== tmp.id; }); merge([m]); C.seen = Math.max(C.seen, m.at); save(); drawMsgs(true);
    }).catch(function (e) {
      tmp.pending = 0; tmp.failed = 1; drawMsgs(); P().toast(e.message || 'Message not sent', true);
    });
  }
  function setReply(m) {
    C.reply = m; var r = $('peChR'); if (!r) return;
    if (!m) { r.style.display = 'none'; r.innerHTML = ''; return; }
    r.style.display = ''; r.innerHTML = '<span><b style="color:' + col(m.by) + '">' + esc(m.by) + '</b>' + esc(m.text.slice(0, 90)) + '</span><button type="button" class="pe-x" aria-label="Cancel reply">' + ic('x', 16) + '</button>';
    r.querySelector('button').onclick = function () { setReply(null); };
    $('peChIn').focus();
  }
  function drawMsgs(toEnd) {
    var box = $('peChM'); if (!box) return;
    var near = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
    var byId = {}; C.msgs.forEach(function (m) { byId[m.id] = m; });
    var html = '', lastDay = '', prev = null;
    if (!C.msgs.length) html = '<div class="pe-chempty"><b>Say vanakkam to the team 👋</b>Messages here are seen by every Port Energy staff member.</div>';
    C.msgs.forEach(function (m) {
      var d = day(m.at); if (d !== lastDay) { html += '<div class="pe-day"><span>' + d + '</span></div>'; lastDay = d; prev = null; }
      var mine = m.by === C.me, grp = prev && prev.by === m.by && m.at - prev.at < 300000;
      var body;
      if (m.del && !C.admin) body = '<span class="pe-gone">' + ic('del', 13) + (mine ? 'You deleted this message' : 'This message was deleted') + '</span>';
      else {
        var rp = m.reply && byId[m.reply] ? byId[m.reply] : null;
        body = (rp ? '<div class="pe-q"><b style="color:' + col(rp.by) + '">' + esc(rp.by) + '</b>' + (rp.del && !C.admin ? 'Deleted message' : esc(rp.text.slice(0, 120))) + '</div>' : '') + '<div class="pe-tx">' + link(m.text) + '</div>' +
          (m.del ? '<div class="pe-delnote">' + ic('del', 12) + 'Deleted' + (m.delBy ? ' by ' + esc(m.delBy) : '') + ' · hidden from staff</div>' : '');
      }
      var st = m.pending ? '<i class="pe-st">sending…</i>' : m.failed ? '<i class="pe-st bad">not sent</i>' : '';
      var acts = '';
      if (!m.pending && !m.failed) {
        if (!m.del) acts += '<button data-a="reply" title="Reply">' + ic('reply', 15) + '</button><button data-a="copy" title="Copy">' + ic('copy', 15) + '</button>';
        if (!m.del && (mine || C.admin)) acts += '<button data-a="del" title="Delete">' + ic('del', 15) + '</button>';
        if (m.del && C.admin) acts += '<button data-a="undo" title="Restore" class="rs">' + ic('undo', 15) + 'Restore</button>';
      }
      html += '<div class="pe-msg' + (mine ? ' mine' : '') + (grp ? ' grp' : '') + (m.del ? ' del' : '') + '" data-id="' + esc(m.id) + '">' +
        (mine ? '' : '<span class="pe-av" style="background:' + col(m.by) + '">' + (grp ? '' : ini(m.by)) + '</span>') +
        '<div class="pe-bub">' + (mine || grp ? '' : '<b class="pe-by" style="color:' + col(m.by) + '">' + esc(m.by) + '</b>') + body +
        '<span class="pe-tm">' + tm(m.at) + st + '</span>' + (acts ? '<span class="pe-acts">' + acts + '</span>' : '') + '</div></div>';
      prev = m;
    });
    box.innerHTML = html;
    if (toEnd || near) box.scrollTop = box.scrollHeight;
    box.querySelectorAll('.pe-msg').forEach(function (el) {
      el.onclick = function (e) {
        var b = e.target.closest('[data-a]');
        if (!b) { if (e.target.closest('a')) return; box.querySelectorAll('.pe-msg.sel').forEach(function (x) { if (x !== el) x.classList.remove('sel'); }); el.classList.toggle('sel'); return; }
        var m = byId[el.dataset.id]; if (!m) return; el.classList.remove('sel');
        if (b.dataset.a === 'reply') setReply(m);
        else if (b.dataset.a === 'copy') { try { navigator.clipboard.writeText(m.text); P().toast('Copied.'); } catch (x) { } }
        else if (b.dataset.a === 'del') {
          if (!confirmBox('Delete this message?', C.admin && m.by !== C.me ? 'It will be hidden from everyone. You can restore it later.' : 'It will be hidden from everyone.', function () {
            m.del = 1; m.delBy = C.me; drawMsgs();
            P().call('chatDelete', tok(), m.id).then(function (r) { merge([r]); save(); drawMsgs(); }).catch(function (x) { m.del = 0; drawMsgs(); P().fail(x); });
          })) return;
        } else if (b.dataset.a === 'undo') {
          m.del = 0; drawMsgs();
          P().call('chatRestore', tok(), m.id).then(function (r) { merge([r]); save(); drawMsgs(); P().toast('Message restored.'); }).catch(function (x) { m.del = 1; drawMsgs(); P().fail(x); });
        }
      };
    });
  }
  function confirmBox(t, s, yes) {
    P().modal('<div class="mhead"><h3>' + esc(t) + '</h3></div><p class="note" style="margin:6px 0 16px">' + esc(s) + '</p><div class="mfoot"><button class="btn ghost" data-close>Cancel</button><button class="btn danger" id="peCfY">Delete</button></div>');
    $('peCfY').onclick = function () { P().closeModal(); yes(); };
    return true;
  }

  function ui() {
    var p = P(); if (!p || !p.S.sess) return;
    var nav = $('nav'); if (nav && !nav.querySelector('[data-v="chat"]')) {
      var b = document.createElement('button'); b.className = 'ni'; b.dataset.v = 'chat';
      b.innerHTML = ic('chat', 18) + 'Team chat<span class="ct" id="peNavChat" style="display:none"></span>';
      var grp = nav.querySelector('.ng[data-g="Communication"] .items > div') || nav.querySelector('.ng[data-g="Workspace"] .items > div');
      if (grp) grp.insertBefore(b, grp.firstChild); else nav.insertBefore(b, nav.firstChild);
      b.onclick = function () { p.closeSide(); p.go({ v: 'chat' }); };
    }
    topButtons(); badges();
  }
  /* ---------------- hooks into the app ---------------- */
  window.PE_VIEWS = window.PE_VIEWS || {};
  window.PE_VIEWS.chat = chatPage;
  var prevNav = window.PE_NAV;
  window.PE_NAV = function () {
    if (prevNav) try { prevNav(); } catch (x) { }
    var p = P(); if (!p || !p.S.sess) return;
    var u = p.S.sess.user || {}; load(u.name); C.admin = !!u.admin;
    if (C.live) ui();
    if (location.hash === '#chat') { try { history.replaceState(null, '', location.pathname + location.search); } catch (x) { } setTimeout(function () { p.go({ v: 'chat' }); }, 400); }
    if (!C.on) { C.on = true; setTimeout(function () { pulse(); watchInbox(); }, 1500); }
  };
  /* stop polling on sign out */
  setInterval(function () { if (C.on && !tok()) { C.on = false; clearTimeout(C.timer); clearTimeout(inbT); C.me = ''; } }, 5000);
  window.PE_CHAT = { pulse: pulse, state: C, alert: alertUser };
})();
