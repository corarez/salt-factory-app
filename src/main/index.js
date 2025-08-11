const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

const { app, shell, BrowserWindow, ipcMain, session } = require('electron')
const { join } = require('path')
const { electronApp, optimizer, is } = require('@electron-toolkit/utils')
const fs = require('fs')
const { fork } = require('child_process')

function resolveBackendEntry() {
  const candidatesDev = [
    path.join(__dirname, '../backend/server.js'),
    path.join(__dirname, '../../backend/server.js')
  ]
  const devEntry = candidatesDev.find(p => fs.existsSync(p)) || candidatesDev[0]
  const prodEntry = path.join(process.resourcesPath, 'backend', 'server.js')
  return app.isPackaged ? prodEntry : devEntry
}

function startBackend() {
  const backendEntry = resolveBackendEntry()
  const PORT = process.env.PORT || '5000'
  const HOST = process.env.HOST || '127.0.0.1'
  const dbDir = path.join(app.getPath('userData'), 'data')
  const dbPath = path.join(dbDir, 'app.db')

  try {
    fs.mkdirSync(dbDir, { recursive: true })
  } catch {}

  const env = { ...process.env, PORT, HOST, DB_PATH: dbPath }

  try {
    if (app.isPackaged) {
      const cp = fork(backendEntry, [], { env, stdio: 'ignore' })
      cp.unref()
      console.log('[main] Backend forked:', backendEntry, 'DB:', dbPath)
    } else {
      process.env.DB_PATH = dbPath
      process.env.PORT = PORT
      process.env.HOST = HOST
      require(backendEntry)
      console.log('[main] Backend required:', backendEntry, 'DB:', dbPath)
    }
  } catch (e) {
    console.error('[main] Failed to start backend:', e)
  }
}

function installCSP() {
  const port = String(process.env.PORT || 5000)
  const connectSrc = [
    "'self'",
    `http://127.0.0.1:${port}`,
    `ws://127.0.0.1:${port}`,
    `http://localhost:${port}`,
    `ws://localhost:${port}`
  ].join(' ')
  const csp = [
    "default-src 'self' 'unsafe-inline' data: https:",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com",
    `connect-src ${connectSrc}`,
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com",
    "font-src 'self' data: https://fonts.gstatic.com"
  ].join('; ')
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const h = details.responseHeaders || {}
    h['Content-Security-Policy'] = [csp]
    callback({ responseHeaders: h })
  })
}

function createWindow() {
  const iconPath = is.dev
    ? join(__dirname, '../../resources/logo.png')
    : join(process.resourcesPath, 'app.asar.unpacked/resources/logo.png')

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    frame: true,
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: true
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    if (details.url.startsWith('about:blank') || details.url.startsWith('data:')) {
      return { action: 'allow' }
    }
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file:') && !/\.[a-zA-Z0-9]+$/.test(new URL(url).pathname)) {
      event.preventDefault()
      mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
  })

  return mainWindow
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  installCSP()
  startBackend()
  const mainWindow = createWindow()
  mainWindow.once('ready-to-show', () => mainWindow.show())
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('window:minimize', () => {
  const win = BrowserWindow.getFocusedWindow()
  if (win) win.minimize()
})

ipcMain.on('window:toggleMaximize', () => {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return
  if (win.isMaximized()) win.unmaximize()
  else win.maximize()
  win.webContents.send('window:maximized-changed', win.isMaximized())
})

ipcMain.on('window:close', () => {
  const win = BrowserWindow.getFocusedWindow()
  if (win) win.close()
})

ipcMain.on('ping', () => console.log('pong'))

ipcMain.on('print-invoice', (_event, htmlContent) => {
  const preview = new BrowserWindow({
    width: 900,
    height: 700,
    show: false,
    autoHideMenuBar: false,
    webPreferences: { nodeIntegration: true, contextIsolation: false, sandbox: false }
  })
  preview.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)
  preview.webContents.on('did-finish-load', () => preview.show())
})
