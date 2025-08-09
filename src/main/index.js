const { app, shell, BrowserWindow, ipcMain } = require('electron');
const { join } = require('path');
const { electronApp, optimizer, is } = require('@electron-toolkit/utils');

function createWindow() {
  const iconPath = is.dev
    ? join(__dirname, '../../resources/logo.png')
    : join(process.resourcesPath, 'app.asar.unpacked/resources/logo.png');

  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    if (details.url.startsWith('about:blank') || details.url.startsWith('data:')) {
      return { action: 'allow' };
    }
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  ipcMain.on('ping', () => console.log('pong'));

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('print-invoice', (event, htmlContent) => {
  console.log('Opening print preview window...');

  const previewWin = new BrowserWindow({
    width: 900,
    height: 700,
    show: false, // Start hidden to prevent a flash of unstyled content
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false
    }
  });

  previewWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

  previewWin.webContents.on('did-finish-load', () => {
    // The window is shown after the content is loaded.
    // The automatic call to print() has been removed.
    // The user will now need to manually print from this window.
    previewWin.show();
  });
});