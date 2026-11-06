/* © 2026 Port Energy Private Limited. All rights reserved. Proprietary and confidential. */
/**
 * PORT ENERGY ERP - GitHub bridge
 * Lets the same ERP screens (app.js) run outside Google Apps Script.
 * It gives app.js the two Google objects it expects:
 *   google.script.run     -> sends each server call to the Apps Script doPost() (Bridge.gs)
 *   google.script.history -> uses the normal browser back button
 * Nothing else in app.js changes. Data, login and approvals stay on the server.
 */
(function () {
  'use strict';
  var URL_ = window.ERP_URL || '';
  var TIMEOUT_MS = 120000;   // 2 minutes (AI chat, file uploads and downloads can be slow)

  // top progress bar: on while any server call is running
  var busy = 0;
  function net(d) {
    busy = Math.max(0, busy + d);
    var el = document.getElementById('peNet');
    if (el) el.classList.toggle('on', busy > 0);
  }

  function post(fn, args) {
    net(1);
    return smart(fn, args).then(function (r) { net(-1); return r; }, function (e) { net(-1); throw e; });
  }

  function send(fn, args) {
    if (!/^https:\/\/script\.google\.com\/.+\/exec$/.test(URL_)) return Promise.reject(new Error('Setup needed: ERP_URL in config.js'));
    if (!navigator.onLine) return Promise.reject(offErr());
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, TIMEOUT_MS) : null;
    // text/plain = "simple" request: no CORS preflight, which Apps Script cannot answer
    return fetch(URL_, {
      method: 'POST', redirect: 'follow', cache: 'no-store',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn: fn, args: args }),
      signal: ctl ? ctl.signal : undefined
    }).then(function (r) {
      if (!r.ok) throw new Error('Server error (' + r.status + '). Please try again.');
      return r.text();
    }).then(function (t) {
      var j;
      try { j = JSON.parse(t); } catch (e) { throw new Error('Server did not answer correctly. Check that the Apps Script web app is deployed with access "Anyone".'); }
      if (!j || j.ok !== true) throw new Error((j && j.error) || 'Server error');
      return j.result;
    }, function (e) {
      if (e && e.name === 'AbortError') throw new Error('The server took too long. Please try again.');
      throw e && e.message && !/Failed to fetch|NetworkError|Load failed/i.test(e.message) ? e : offErr();
    }).finally(function () { if (timer) clearTimeout(timer); });
  }


  /* ================================================================
     OFFLINE MODE
     - every screen you opened is saved on this device (IndexedDB)
     - with no internet the saved copy is shown, with an "Offline" pill
     - new entries, edits and approvals made offline are queued and
       uploaded automatically, in order, when the internet returns
     ================================================================ */
  function offErr() { var e = new Error('No internet connection. Showing saved data where available.'); e.offline = true; return e; }
  var READS = { bootstrap: 1, getHome: 1, getInbox: 1, getOptions: 1, listRecords: 1, getRecord: 1, getLetterhead: 1, myPhoto: 1, myReports: 1, myDeptSheets: 1, getAgeing: 1, vendorLedger: 1 };
  var WRITES = { saveRecord: 1, doAction: 1, ackNotice: 1 };
  var dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise(function (ok, bad) {
      if (!window.indexedDB) return bad(new Error('no idb'));
      var r = indexedDB.open('pe-offline', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('kv'); r.result.createObjectStore('out', { keyPath: 'qid', autoIncrement: true }); };
      r.onsuccess = function () { ok(r.result); }; r.onerror = function () { bad(r.error); };
    });
    return dbp;
  }
  function tx(store, mode, fn) { return db().then(function (d) { return new Promise(function (ok, bad) { var t = d.transaction(store, mode), s = t.objectStore(store), res = fn(s); t.oncomplete = function () { ok(res && res.result !== undefined ? res.result : res); }; t.onerror = function () { bad(t.error); }; }); }); }
  function isTok(a) { return typeof a === 'string' && /^[0-9a-f-]{30,40}$/i.test(a); }
  function ckey(fn, args) { return fn + '|' + JSON.stringify(isTok(args[0]) ? args.slice(1) : args); }
  function cachePut(fn, args, res) { if (!READS[fn]) return; try { tx('kv', 'readwrite', function (s) { return s.put({ at: Date.now(), v: res }, ckey(fn, args)); }).catch(function () { }); } catch (x) { } }
  function cacheGet(fn, args) { return tx('kv', 'readonly', function (s) { return s.get(ckey(fn, args)); }).then(function () { return null; }).catch(function () { return null; }); }
  function cacheGet2(fn, args) { return db().then(function (d) { return new Promise(function (ok) { var q = d.transaction('kv').objectStore('kv').get(ckey(fn, args)); q.onsuccess = function () { ok(q.result || null); }; q.onerror = function () { ok(null); }; }); }).catch(function () { return null; }); }
  function queue(fn, args) { return db().then(function (d) { return new Promise(function (ok, bad) { var q = d.transaction('out', 'readwrite').objectStore('out').add({ fn: fn, args: args, at: Date.now() }); q.onsuccess = function () { ok(q.result); }; q.onerror = function () { bad(q.error); }; }); }); }
  function outAll() { return db().then(function (d) { return new Promise(function (ok) { var q = d.transaction('out').objectStore('out').getAll(); q.onsuccess = function () { ok(q.result || []); }; q.onerror = function () { ok([]); }; }); }).catch(function () { return []; }); }
  function outDel(id) { return db().then(function (d) { return new Promise(function (ok) { var q = d.transaction('out', 'readwrite').objectStore('out').delete(id); q.onsuccess = q.onerror = function () { ok(); }; }); }); }
  function outPatch(item) { return db().then(function (d) { return new Promise(function (ok) { var q = d.transaction('out', 'readwrite').objectStore('out').put(item); q.onsuccess = q.onerror = function () { ok(); }; }); }); }
  window.PE_QUEUE_THEN = function (qid, then) { outAll().then(function (l) { var it = l.filter(function (x) { return x.qid === qid; })[0]; if (it) { it.then = then; outPatch(it); } }); };

  function pill() {
    var el = document.getElementById('peOff');
    if (!el) { el = document.createElement('div'); el.id = 'peOff'; el.setAttribute('role', 'status'); document.body.appendChild(el);
      var st = document.createElement('style'); st.textContent = '#peOff{position:fixed;left:50%;top:calc(8px + env(safe-area-inset-top));transform:translate(-50%,-160%);z-index:99999;display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:99px;background:#0B1546;color:#fff;font:600 12.5px Poppins,system-ui,sans-serif;box-shadow:0 12px 30px -12px rgba(0,0,0,.6);transition:transform .35s cubic-bezier(.2,1.2,.4,1)}#peOff.show{transform:translate(-50%,0)}#peOff i{width:8px;height:8px;border-radius:50%;background:#FFB020}#peOff.sync i{background:#00C2FF;animation:peOffP 1s infinite alternate}#peOff.ok i{background:#3DDC97}@keyframes peOffP{to{opacity:.3}}'; document.head.appendChild(st); }
    return el;
  }
  var pillT = null;
  function showPill(text, cls, hideAfter) { var el = pill(); el.className = 'show ' + (cls || ''); el.innerHTML = '<i></i>' + text; clearTimeout(pillT); if (hideAfter) pillT = setTimeout(function () { el.className = ''; }, hideAfter); }
  function offState() { outAll().then(function (l) { if (!navigator.onLine) showPill('Offline' + (l.length ? ' · ' + l.length + ' waiting to upload' : ' · showing saved data'), ''); }); }

  var syncing = false;
  function sync() {
    if (syncing || !navigator.onLine) return;
    outAll().then(function (list) {
      if (!list.length) return;
      syncing = true; var ok = 0, bad = [];
      showPill('Uploading ' + list.length + ' saved entr' + (list.length > 1 ? 'ies' : 'y') + '…', 'sync');
      var tokNow = null; try { tokNow = localStorage.getItem('pe_token'); } catch (x) { }
      var run = list.reduce(function (p, it) {
        return p.then(function () {
          var args = it.args.slice(); if (tokNow && isTok(args[0])) args[0] = tokNow;
          return send(it.fn, args).then(function (res) {
            ok++;
            if (it.fn === 'saveRecord' && it.then && res && res.id) return send('doAction', [args[0], args[1], res.id, it.then, {}]).catch(function (e) { bad.push(res.id + ': saved, but ' + e.message); });
          }, function (e) { if (e && e.offline) throw e; bad.push((it.fn === 'saveRecord' ? 'Entry' : 'Action') + ': ' + e.message); })
            .then(function () { return outDel(it.qid); });
        });
      }, Promise.resolve());
      run.catch(function () { }).then(function () {
        syncing = false;
        if (bad.length) { showPill(ok + ' uploaded · ' + bad.length + ' could not be saved (tap)', '', 0); pill().onclick = function () { alert(bad.join('\n')); pill().className = ''; }; }
        else showPill('All ' + ok + ' offline entr' + (ok > 1 ? 'ies' : 'y') + ' uploaded', 'ok', 4000);
        try { window.dispatchEvent(new CustomEvent('pe-synced', { detail: { ok: ok, bad: bad } })); } catch (x) { }
      });
    });
  }
  window.addEventListener('online', function () { showPill('Back online', 'ok', 2500); setTimeout(sync, 800); });
  window.addEventListener('offline', offState);
  setTimeout(function () { if (!navigator.onLine) offState(); else sync(); }, 2500);

  /* wraps send(): cache reads, serve them offline, queue writes offline */
  function smart(fn, args) {
    return send(fn, args).then(function (res) { cachePut(fn, args, res); return res; }, function (e) {
      if (!e || !e.offline) throw e;
      if (READS[fn]) return cacheGet2(fn, args).then(function (c) { offState(); if (c) return c.v; throw new Error('You are offline and this screen was not opened before on this device.'); });
      if (WRITES[fn]) return queue(fn, args).then(function (qid) { offState(); return fn === 'saveRecord' ? { id: '', offline: true, qid: qid } : { offline: true, qid: qid }; });
      throw new Error('This needs internet. Please connect and try again.');
    });
  }

  // google.script.run.withSuccessHandler(ok).withFailureHandler(err).anyServerFunction(args...)
  function runner(ok, err) {
    return new Proxy({}, {
      get: function (_, name) {
        if (name === 'withSuccessHandler') return function (f) { return runner(f, err); };
        if (name === 'withFailureHandler') return function (f) { return runner(ok, f); };
        if (name === 'withUserObject') return function () { return runner(ok, err); };
        if (typeof name !== 'string' || name === 'then') return undefined;
        return function () {
          var args = Array.prototype.slice.call(arguments);
          post(name, args).then(function (res) {
            // the dashboard (dash.js) reuses the home data the app already loaded - no extra server calls
            try {
              var home = res && (name === 'getHome' ? res : res.home);
              if (home && home.kpi) { window.PE_HOME = home; window.dispatchEvent(new CustomEvent('pe-home', { detail: home })); }
              if (res && res.session) window.PE_SESSION = res.session;
            } catch (x) { }
            if (ok) ok(res);
          }, function (e) { if (err) err(e); });
        };
      }
    });
  }

  var history_ = {
    push: function (state) { try { window.history.pushState(state == null ? null : state, ''); } catch (e) { } },
    replace: function (state) { try { window.history.replaceState(state == null ? null : state, ''); } catch (e) { } },
    setChangeHandler: function (fn) { window.addEventListener('popstate', function (ev) { fn({ state: ev.state }); }); }
  };

  window.google = window.google || {};
  window.google.script = { run: runner(null, null), history: history_, host: { close: function () { }, origin: location.origin } };
  window.PE_STANDALONE = true;   // app.js can check this later (offline mode, install button)
})();
