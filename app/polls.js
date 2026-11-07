/* © 2026 Port Energy Private Limited. All rights reserved.
   PORT ENERGY ERP - Polls / voting. Server: Polls.gs (pollList, pollCreate, pollVote, pollClose, pollDelete). */
(function () {
  'use strict';
  var P = function () { return window.PE; }, $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var COL = ['#0084F0', '#F0006C', '#00B49C', '#6F42C1', '#E8590C', '#0CA678', '#C2255C', '#1C7ED6', '#D9480F', '#868E96'];
  var L = { list: null, tab: 'open', sel: {} };
  function ago(t) { var s = (Date.now() - t) / 1000; if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago'; if (s < 86400) return Math.floor(s / 3600) + ' h ago'; return new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); }
  function left(t) { var s = (t - Date.now()) / 1000; if (s <= 0) return 'ended'; if (s < 3600) return Math.ceil(s / 60) + ' min left'; if (s < 86400) return Math.floor(s / 3600) + ' h left'; return Math.floor(s / 86400) + ' days left'; }
  function tok() { return P().S.token; }

  function page(v) {
    P().setTitle('Polls & voting', 'Communication · everyone can vote');
    v.innerHTML = '<div class="lhero"><span class="lh-ic">' + ICON + '</span><div class="lh-tx"><h2>Polls & voting</h2><p>Ask the team, vote in one tap, see live results.</p></div><button class="btn soft sm" id="plNew" style="background:#fff!important;color:#F0006C!important;font-weight:800">+ New poll</button></div>' +
      '<div class="chips status-chips" id="plTabs"><button class="chip" data-t="open">Open</button><button class="chip" data-t="mine">Not voted</button><button class="chip" data-t="closed">Closed</button><button class="chip" data-t="all">All</button></div><div id="plList" class="pl-list"></div>';
    $('plNew').onclick = create;
    v.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { L.tab = b.dataset.t; draw(); }; });
    if (L.list) draw(); else P().skeleton($('plList'), 3);
    P().call('pollList', tok()).then(function (l) { L.list = l; draw(); }).catch(function (e) { $('plList').innerHTML = '<div class="empty"><b>Could not load polls</b>' + esc(e.message) + '</div>'; });
  }
  var ICON = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>';
  function draw() {
    var box = $('plList'); if (!box || !L.list) return;
    var c = { open: 0, mine: 0, closed: 0, all: L.list.length };
    L.list.forEach(function (p) { if (p.open) c.open++; else c.closed++; if (p.open && !p.mine.length) c.mine++; });
    document.querySelectorAll('#plTabs [data-t]').forEach(function (b) { b.classList.toggle('on', b.dataset.t === L.tab); b.innerHTML = b.textContent.replace(/\d+$/, '').trim() + '<b>' + c[b.dataset.t] + '</b>'; });
    var list = L.list.filter(function (p) { return L.tab === 'all' || (L.tab === 'open' ? p.open : L.tab === 'closed' ? !p.open : p.open && !p.mine.length); });
    box.innerHTML = list.length ? list.map(card).join('') : '<div class="glass empty"><b>' + (L.tab === 'mine' ? 'You have voted in every open poll 👍' : 'No polls here yet') + '</b>Tap <b>+ New poll</b> to ask the team.</div>';
    list.forEach(bind);
  }
  function card(p, i) {
    var voted = p.mine.length > 0, show = voted || !p.open, tot = p.counts.reduce(function (s, n) { return s + n; }, 0) || 1, mx = Math.max.apply(null, p.counts);
    var sel = L.sel[p.id] || p.mine.slice();
    var opts = p.opts.map(function (o, k) {
      var pc = Math.round(p.counts[k] / tot * 100), win = !p.open && p.counts[k] === mx && mx > 0, mine = p.mine.indexOf(k) > -1, on = sel.indexOf(k) > -1;
      var who = p.who && p.who[k] && p.who[k].length ? '<span class="pl-who">' + p.who[k].slice(0, 5).map(function (n) { return '<i title="' + esc(n) + '" style="background:' + COL[(n.length * 7) % 10] + '">' + esc(P().initials(n)) + '</i>'; }).join('') + (p.who[k].length > 5 ? '<i class="more">+' + (p.who[k].length - 5) + '</i>' : '') + '</span>' : '';
      return '<button class="pl-o' + (show ? ' res' : '') + (on ? ' on' : '') + (mine ? ' mine' : '') + (win ? ' win' : '') + '" data-o="' + k + '"' + (p.open ? '' : ' disabled') + '>' +
        (show ? '<i class="pl-bar" style="width:' + pc + '%;--c:' + COL[k % 10] + '"></i>' : '') +
        '<span class="pl-mk ' + (p.multi ? 'sq' : '') + '">' + (on || mine ? '✓' : '') + '</span><span class="pl-ot">' + esc(o) + (win ? ' 🏆' : '') + '</span>' + who + (show ? '<b>' + pc + '%<small>' + p.counts[k] + '</small></b>' : '') + '</button>';
    }).join('');
    var part = Math.min(100, Math.round(p.voters / Math.max(1, p.total) * 100));
    return '<article class="glass pl-c' + (p.open ? '' : ' closed') + '" data-id="' + esc(p.id) + '" style="--i:' + i + '">' +
      '<header><span class="pl-av" style="background:' + COL[(p.by.length * 7) % 10] + '">' + esc(P().initials(p.by)) + '</span><div><b>' + esc(p.by) + '</b><small>' + ago(p.at) + (p.multi ? ' · choose many' : ' · choose one') + (p.anon ? ' · 🔒 anonymous' : '') + '</small></div>' +
      '<span class="pl-st ' + (p.open ? 'op' : 'cl') + '">' + (p.open ? (p.ends ? '⏳ ' + left(p.ends) : '● Open') : 'Closed') + '</span></header>' +
      '<h3>' + esc(p.q) + '</h3>' + (p.note ? '<p class="note">' + esc(p.note) + '</p>' : '') +
      '<div class="pl-os">' + opts + '</div>' +
      '<footer><span class="pl-part"><i style="width:' + part + '%"></i></span><small>' + p.voters + ' of ' + p.total + ' voted</small>' +
      (p.open && p.multi ? '<button class="btn primary sm" data-a="vote">' + (voted ? 'Update vote' : 'Submit vote') + '</button>' : '') +
      (p.open && voted ? '<button class="btn ghost sm" data-a="unvote">Remove my vote</button>' : '') +
      (p.canManage ? '<button class="btn soft sm" data-a="' + (p.open ? 'close' : 'open') + '">' + (p.open ? 'Close poll' : 'Reopen') + '</button>' : '') +
      (p.admin ? '<button class="btn ghost sm pl-del" data-a="del">Delete</button>' : '') + '</footer></article>';
  }
  function upd(np) { L.list = L.list.map(function (x) { return x.id === np.id ? np : x; }); delete L.sel[np.id]; draw(); }
  function vote(p, choice, el) {
    el && el.classList.add('busy');
    P().call('pollVote', tok(), p.id, choice).then(function (np) { upd(np); if (choice.length) { P().toast('Vote saved ✓'); confetti(); } }).catch(function (e) { el && el.classList.remove('busy'); P().fail(e); });
  }
  function bind(p) {
    var el = document.querySelector('.pl-c[data-id="' + p.id + '"]'); if (!el) return;
    el.querySelectorAll('[data-o]').forEach(function (b) {
      b.onclick = function () {
        if (!p.open) return; var k = +b.dataset.o;
        if (!p.multi) return vote(p, [k], el);
        var s = L.sel[p.id] || p.mine.slice(); var i = s.indexOf(k); if (i > -1) s.splice(i, 1); else s.push(k); L.sel[p.id] = s;
        b.classList.toggle('on', i < 0); b.querySelector('.pl-mk').textContent = i < 0 ? '✓' : '';
      };
    });
    el.querySelectorAll('[data-a]').forEach(function (b) {
      b.onclick = function () {
        var a = b.dataset.a;
        if (a === 'vote') { var s = L.sel[p.id] || p.mine; if (!s.length) return P().toast('Pick at least one option.', true); return vote(p, s, el); }
        if (a === 'unvote') return vote(p, [], el);
        if (a === 'close' || a === 'open') { P().busy(b, true); return P().call('pollClose', tok(), p.id, a === 'close').then(function (np) { upd(np); P().toast(a === 'close' ? 'Poll closed. Everyone is notified of the result.' : 'Poll reopened.'); }).catch(function (e) { P().busy(b, false); P().fail(e); }); }
        if (a === 'del') {
          P().modal('<div class="mhead"><h3>Delete this poll?</h3></div><p class="note" style="margin:6px 0 16px">"' + esc(p.q) + '" and all its votes will be removed.</p><div class="mfoot"><button class="btn ghost" data-close>Cancel</button><button class="btn danger" id="plDy">Delete</button></div>');
          $('plDy').onclick = function () { P().closeModal(); P().call('pollDelete', tok(), p.id).then(function () { L.list = L.list.filter(function (x) { return x.id !== p.id; }); draw(); P().toast('Poll deleted.'); }).catch(P().fail); };
        }
      };
    });
  }
  function create() {
    var n = 2;
    P().modal('<div class="mhead"><h3>📊 New poll</h3></div>' +
      '<label class="f">Question</label><textarea class="in" id="pqQ" rows="2" maxlength="300" placeholder="e.g. Which date suits everyone for the safety training?"></textarea>' +
      '<label class="f" style="margin-top:10px">Options</label><div id="pqO"></div><button type="button" class="btn ghost sm" id="pqAdd">+ Add option</button>' +
      '<div class="pq-tg"><label><input type="checkbox" id="pqM"><span>Allow choosing more than one</span></label><label><input type="checkbox" id="pqA"><span>Anonymous - hide who voted for what</span></label></div>' +
      '<div class="pq-2"><div><label class="f">Closes at <small class="note">(optional)</small></label><input type="datetime-local" class="in" id="pqE"></div><div><label class="f">Note <small class="note">(optional)</small></label><input class="in" id="pqN" maxlength="300" placeholder="Any detail"></div></div>' +
      '<div class="mfoot"><button class="btn ghost" data-close>Cancel</button><button class="btn primary" id="pqGo">Post poll</button></div>');
    $('mbox').classList.add('pq');
    function opt(v) { var d = document.createElement('div'); d.className = 'pq-o'; d.innerHTML = '<span>' + ($('pqO').children.length + 1) + '</span><input class="in" maxlength="120" placeholder="Option ' + ($('pqO').children.length + 1) + '" value="' + esc(v || '') + '"><button type="button" aria-label="Remove">×</button>'; d.querySelector('button').onclick = function () { if ($('pqO').children.length > 2) { d.remove(); renum(); } }; $('pqO').appendChild(d); }
    function renum() { Array.prototype.forEach.call($('pqO').children, function (d, i) { d.querySelector('span').textContent = i + 1; }); }
    for (var i = 0; i < n; i++) opt();
    $('pqAdd').onclick = function () { if ($('pqO').children.length >= 10) return P().toast('Maximum 10 options.', true); opt(); $('pqO').lastChild.querySelector('input').focus(); };
    $('pqGo').onclick = function () {
      var b = this, d = { q: $('pqQ').value, opts: Array.prototype.map.call($('pqO').querySelectorAll('input'), function (x) { return x.value; }), multi: $('pqM').checked, anon: $('pqA').checked, ends: $('pqE').value ? new Date($('pqE').value).getTime() : 0, note: $('pqN').value };
      if (!d.q.trim()) return P().toast('Type the question.', true);
      if (d.opts.filter(function (x) { return x.trim(); }).length < 2) return P().toast('Give at least 2 options.', true);
      P().busy(b, true);
      P().call('pollCreate', tok(), d).then(function (l) { L.list = l; L.tab = 'open'; P().closeModal(); P().toast('Poll posted. Everyone gets a notification.'); if (P().S.route.v === 'polls') draw(); else P().go({ v: 'polls' }); }).catch(function (e) { P().busy(b, false); P().fail(e); });
    };
    setTimeout(function () { $('pqQ').focus(); }, 100);
  }
  function confetti() {
    var c = document.createElement('div'); c.className = 'pl-conf'; c.innerHTML = Array.apply(null, Array(18)).map(function (_, i) { return '<i style="--x:' + (Math.random() * 200 - 100) + 'px;--r:' + Math.random() * 720 + 'deg;background:' + COL[i % 6] + ';left:' + (40 + Math.random() * 20) + '%"></i>'; }).join('');
    document.body.appendChild(c); setTimeout(function () { c.remove(); }, 1400);
  }

  window.PE_VIEWS = window.PE_VIEWS || {}; window.PE_VIEWS.polls = page;
  window.PE_POLL_NEW = create;
  /* menu item + open from notification */
  var prev = window.PE_NAV;
  window.PE_NAV = function () {
    if (prev) try { prev(); } catch (x) { }
    var nav = $('nav'); if (!nav || nav.querySelector('[data-v="polls"]')) return;
    var g = nav.querySelector('.ng[data-g="Communication"] .items > div') || nav.querySelector('.ng .items > div'); if (!g) return;
    var b = document.createElement('button'); b.className = 'ni'; b.dataset.v = 'polls'; b.innerHTML = ICON.replace(/24/g, '18') + 'Polls & voting';
    var chat = g.querySelector('[data-v="chat"]'); if (chat && chat.nextSibling) g.insertBefore(b, chat.nextSibling); else g.insertBefore(b, g.firstChild);
    b.onclick = function () { P().closeSide(); P().go({ v: 'polls' }); };
  };
  /* poll button inside Team chat */
  new MutationObserver(function () {
    var f = $('peChF'); if (!f || f.querySelector('.ch-poll')) return;
    f.insertAdjacentHTML('afterbegin', '<button type="button" class="btn ghost ai-mic ch-poll" title="New poll" aria-label="New poll">' + ICON.replace(/24/g, '19') + '</button>');
    f.querySelector('.ch-poll').onclick = create;
  }).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('click', function (e) {
    var n = e.target.closest && e.target.closest('.pe-nfi[data-k="poll"]'); if (!n) return;
    e.stopImmediatePropagation(); e.preventDefault(); var p = document.getElementById('peNfPanel'); if (p) p.remove(); var s = document.getElementById('peNfScrim'); if (s) s.remove(); P().go({ v: 'polls' });
  }, true);
})();
