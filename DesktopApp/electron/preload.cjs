const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Fullscreen
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  isFullscreen: () => ipcRenderer.invoke('is-fullscreen'),
  exitFullscreen: () => ipcRenderer.invoke('exit-fullscreen'),

  // Fullscreen state listener
  onFullscreenChanged: (callback) => {
    ipcRenderer.on('fullscreen-changed', (_event, state) => callback(state))
  },

  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Platform
  platform: process.platform,
})
