// src/preload/index.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.send('window:minimize'),
  toggleMaximize: () => ipcRenderer.send('window:toggleMaximize'),
  close: () => ipcRenderer.send('window:close'),
  onMaximizedChanged: (cb) => {
    const handler = (_e, isMax) => cb(Boolean(isMax));
    ipcRenderer.on('window:maximized-changed', handler);
    return () => ipcRenderer.removeListener('window:maximized-changed', handler);
  }
});
