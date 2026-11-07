/* © 2026 Port Energy Private Limited. All rights reserved. Proprietary and confidential. */
/**
 * PORT ENERGY ERP - Windows desktop app
 * Opens the ERP (same app as the phone) in its own window with the Port Energy icon.
 * Data, login and approvals stay on the Google Apps Script server, exactly like the web app.
 */
const { app, BrowserWindow, shell, session, Menu } = require('electron');
const path = require('path');

const ERP_URL = 'https://balajijayabal0-pixel.github.io/portenergy-erp/app/?source=desktop';
const ERP_ORIGIN = 'https://balajijayabal0-pixel.github.io';
// pages the ERP itself opens and should stay inside the app (Google sign-in for Drive files, printing helpers)
const INSIDE = [ERP_ORIGIN, 'https://script.google.com', 'https://script.googleusercontent.com'];

let win = null, splash = null;

if (!app.requestSingleInstanceLock()) { app.quit(); }
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

function inside(url) { return INSIDE.some((o) => url.startsWith(o)); }

function createWindow() {
  win = new BrowserWindow({
    width: 1366, height: 860, minWidth: 380, minHeight: 600,
    backgroundColor: '#F1F4FB',
    title: 'Port Energy ERP',
    icon: path.join(__dirname, 'build', 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: true }
  });
  // native splash first, the ERP window appears only when the app has finished loading (no browser-style loading)
  splash = new BrowserWindow({ width: 420, height: 300, frame: false, resizable: false, center: true, show: true, backgroundColor: '#001250', alwaysOnTop: true, skipTaskbar: true, icon: path.join(__dirname, 'build', 'icon.png') });
  splash.loadFile(path.join(__dirname, 'splash.html'));
  let shown = false;
  const reveal = () => { if (shown) return; shown = true; win.maximize(); win.show(); if (splash && !splash.isDestroyed()) { splash.destroy(); } splash = null; };
  win.webContents.on('did-finish-load', () => {
    // wait until the ERP has painted its first screen (boot screen gone)
    const t0 = Date.now();
    const poll = () => win.webContents.executeJavaScript("(function(){var b=document.getElementById('boot');return !b||b.style.display==='none'||getComputedStyle(b).display==='none'||getComputedStyle(b).opacity==='0';})()").then((ok) => { if (ok || Date.now() - t0 > 6000) setTimeout(reveal, 150); else setTimeout(poll, 120); }).catch(() => setTimeout(reveal, 300));
    poll();
  });
  setTimeout(reveal, 12000);

  // links to other sites (vendor websites, Drive files, maps) open in the normal browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('blob:') || url === 'about:blank') return { action: 'allow' };
    if (!inside(url)) { shell.openExternal(url); return { action: 'deny' }; }
    return { action: 'allow', overrideBrowserWindowOptions: { autoHideMenuBar: true, icon: path.join(__dirname, 'build', 'icon.png') } };
  });
  win.webContents.on('will-navigate', (e, url) => { if (!inside(url) && !url.startsWith('file:')) { e.preventDefault(); shell.openExternal(url); } });

  // no internet at start -> friendly page with a Try again button
  win.webContents.on('did-fail-load', (_e, code, _desc, url, isMain) => {
    if (isMain && code !== -3) { setTimeout(() => { if (!shown) { shown = true; win.maximize(); win.show(); if (splash && !splash.isDestroyed()) splash.destroy(); } }, 300); win.loadFile(path.join(__dirname, 'offline.html'), { query: { u: ERP_URL } }); }
  });

  win.loadURL(ERP_URL);
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  // camera (site photos), clipboard, notifications for the ERP only
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb, details) => {
    const ok = inside(details.requestingUrl || wc.getURL()) && ['media', 'clipboard-read', 'clipboard-sanitized-write', 'notifications', 'fullscreen', 'geolocation'].includes(perm);
    cb(ok);
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
