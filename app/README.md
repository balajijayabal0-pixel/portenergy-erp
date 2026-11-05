# Port Energy ERP - GitHub app (Step 1)

© 2026 Port Energy Private Limited. All rights reserved.

The same ERP screens, hosted on GitHub Pages instead of inside Google Apps Script.
Data, login, PINs, permissions and approvals stay on the Apps Script server (Google Sheet).

Link: `https://balajijayabal0-pixel.github.io/portenergy-erp/app/`

| File | What it is |
|---|---|
| `index.html` | Apps Script `Index.html` + `Styles.html` (unchanged screens) |
| `app.js` | Apps Script `App.html` (unchanged) |
| `logo.js` | Apps Script `Logo.html` |
| `bridge.js` | New: sends server calls to the Apps Script `doPost` (file `Bridge.gs`) |
| `polish.css` | New: logo colours, type fixes, phone card lists, matching open/close motion |
| `motion.js` | New: page animation, swipe to close record / sheet, pull to refresh, offline banner |
| `install.js`, `sw.js`, `manifest.webmanifest` | New: install as an app on phone and laptop, opens instantly |
| `../config.js` | The Apps Script `/exec` link (shared with the old launcher) |

The old launcher at the repo root keeps working as before.
Server code (`Code.gs`, `Schema.gs`, `Bridge.gs`) is not stored in this public repo.

When `App.html`, `Styles.html` or `Index.html` changes in Apps Script, rebuild these files so both copies match.

To go back to the original look, delete `polish.css` and `motion.js` and their two lines in `index.html`.
