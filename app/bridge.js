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
    return send(fn, args).then(function (r) { net(-1); return r; }, function (e) { net(-1); throw e; });
  }

  function send(fn, args) {
    if (!/^https:\/\/script\.google\.com\/.+\/exec$/.test(URL_)) return Promise.reject(new Error('Setup needed: ERP_URL in config.js'));
    if (!navigator.onLine) return Promise.reject(new Error('No internet connection. Please connect and try again.'));
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
      throw e && e.message && !/Failed to fetch|NetworkError|Load failed/i.test(e.message) ? e : new Error('Could not reach the ERP server. Check internet and try again.');
    }).finally(function () { if (timer) clearTimeout(timer); });
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
