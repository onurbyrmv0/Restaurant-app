const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('path')

// ── Single Instance Lock ──
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
}

let mainWindow = null
let splashWindow = null

// ── Splash Screen ──
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 380,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: false,
    alwaysOnTop: true,
    center: true,
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  splashWindow.loadFile(path.join(__dirname, 'splash.html'))
  splashWindow.setMenu(null)
}

// ── Main Window ──
function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  mainWindow = new BrowserWindow({
    width: Math.min(1400, width),
    height: Math.min(900, height),
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Cafevania Gourmet — Kassa',
    show: false, // Don't show until ready
    backgroundColor: '#f8fafc',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../public/favicon.ico'),
  })

  // ── Load Content ──
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // ── When main window is ready → close splash, show main ──
  mainWindow.webContents.on('did-finish-load', () => {
    // Small delay to let Vue mount and render
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close()
        splashWindow = null
      }
      mainWindow.show()
      mainWindow.focus()
    }, 800)
  })

  // ── Track fullscreen state changes ──
  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('fullscreen-changed', true)
  })
  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('fullscreen-changed', false)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ── IPC Handlers ──
ipcMain.handle('toggle-fullscreen', () => {
  if (mainWindow) {
    const newState = !mainWindow.isFullScreen()
    mainWindow.setFullScreen(newState)
    return newState
  }
  return false
})

ipcMain.handle('is-fullscreen', () => {
  return mainWindow ? mainWindow.isFullScreen() : false
})

ipcMain.handle('exit-fullscreen', () => {
  if (mainWindow && mainWindow.isFullScreen()) {
    mainWindow.setFullScreen(false)
  }
  return false
})

ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

// ── App Lifecycle ──
app.whenReady().then(() => {
  createSplash()
  createWindow()
})

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
