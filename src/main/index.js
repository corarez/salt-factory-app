// src/main/main.js

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { app, shell, BrowserWindow, ipcMain, session } = require('electron');
const { join } = require('path');
const { electronApp, optimizer, is } = require('@electron-toolkit/utils');
const fs = require('fs');

/* --------------------------- Backend resolver --------------------------- */
function resolveBackendEntry() {
  // Try common dev locations
  const candidatesDev = [
    path.join(__dirname, '../backend/server.js'),   // src/main -> src/backend/server.js
    path.join(__dirname, '../../backend/server.js') // src/main -> projectRoot/backend/server.js
  ];
  const devEntry = candidatesDev.find(p => fs.existsSync(p)) || candidatesDev[0];

  // Prod: copied to resources/backend/server.js via electron-builder extraResources
  const prodEntry = path.join(process.resourcesPath, 'backend', 'server.js');

  return app.isPackaged ? prodEntry : devEntry;
}

/* ------------------------------ Start backend --------------------------- */
function startBackend() {
  const backendEntry = resolveBackendEntry();
  try {
    require(backendEntry);
    console.log('[main] Backend started from:', backendEntry);
  } catch (e) {
    console.error('[main] Failed to start backend:', e);
  }
}

/* --------------------------- CSP (header injection) --------------------- */
function installCSP() {
  const serverHost = process.env.HOST || '127.0.0.1';
  const serverPort = String(process.env.PORT || 5000);

  const connectSrc = app.isPackaged
    ? `'self' http://${serverHost}:${serverPort} ws://${serverHost}:${serverPort}`
    : `'self' http://localhost:* ws://localhost:* http://${serverHost}:${serverPort} ws://${serverHost}:${serverPort}`;

  const csp = [
    "default-src 'self' 'unsafe-inline' data: https:",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com",
    `connect-src ${connectSrc}`,
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com",
    "font-src 'self' data: https://fonts.gstatic.com",
  ].join('; ');

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = details.responseHeaders || {};
    headers['Content-Security-Policy'] = [csp];
    callback({ responseHeaders: headers });
  });

  console.log('[main] CSP installed:', csp);
}

/* ----------------------------- Splash window ---------------------------- */
function createSplashScreen() {
  const splashWin = new BrowserWindow({
    width: 450,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    show: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const html = `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta http-equiv="Content-Security-Policy" content="default-src 'self' data:; style-src 'self' 'unsafe-inline'; img-src 'self' data:;">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>کارگەی خوێی سه‌رده‌م</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        body { margin:0; background:transparent; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; overflow:hidden; }
        .animate-fadeIn { animation: fadeIn .8s ease-out forwards; }
        .animate-spin-fast { animation: spin .8s linear infinite; }
      </style>
    </head>
    <body class="bg-transparent flex items-center justify-center h-screen animate-fadeIn">
      <div class="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center justify-center space-y-4">
        <svg class="w-16 h-16 text-blue-500 animate-spin-fast" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 2h10c.552 0 1 .448 1 1v1h-12V3c0-.552.448-1 1-1zm10 2H7v16c0 1.104.896 2 2 2h6c1.104 0 2-.896 2-2V4zM9 12h6v2H9v-2zm0-4h6v2H9V8z"/>
        </svg>
        <div class="text-xl font-semibold text-gray-800">کارگەی خوێی سه‌رده‌م...</div>
        <p class="text-sm text-gray-600">تکایە چاوەڕوان بە</p>
      </div>
    </body>
    </html>
  `;

  splashWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  splashWin.once('ready-to-show', () => splashWin.show());
  return splashWin;
}

/* ------------------------------ Main window ----------------------------- */
function createWindow() {
  const iconPath = is.dev
    ? join(__dirname, '../../resources/logo.png')
    : join(process.resourcesPath, 'app.asar.unpacked/resources/logo.png');

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    frame: false, // Frameless: we'll draw our own toolbar
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: true
    }
  });

  mainWindow.on('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler((details) => {
    if (details.url.startsWith('about:blank') || details.url.startsWith('data:')) {
      return { action: 'allow' };
    }
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return mainWindow;
}

/* ------------------------------- App ready ------------------------------ */
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  installCSP();
  startBackend();

  const splash = createSplashScreen();
  const mainWindow = createWindow();

  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (!splash.isDestroyed()) splash.destroy();
      mainWindow.show();
    }, 800);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

/* --------------------------- App lifecycle end -------------------------- */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


/* ------------------------------- IPC: window controls ------------------- */
ipcMain.on('window:minimize', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
});

ipcMain.on('window:toggleMaximize', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;
  if (win.isMaximized()) win.unmaximize();
  else win.maximize();
  // Notify renderer so it can swap the icon
  win.webContents.send('window:maximized-changed', win.isMaximized());
});

ipcMain.on('window:close', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
});

/* ------------------------------- IPC: misc ------------------------------ */
ipcMain.on('ping', () => console.log('pong'));

ipcMain.on('print-invoice', (_event, htmlContent) => {
  const preview = new BrowserWindow({
    width: 900,
    height: 700,
    show: false,
    autoHideMenuBar: false,
    webPreferences: { nodeIntegration: true, contextIsolation: false, sandbox: false }
  });

  preview.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
  preview.webContents.on('did-finish-load', () => preview.show());
});
