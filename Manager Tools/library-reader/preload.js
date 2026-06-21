const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronReader', {
  signalBootComplete: () => ipcRenderer.invoke('boot-complete'),
  minimizeWindow: () => ipcRenderer.invoke('window-action', 'minimize'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('window-action', 'toggle-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-action', 'close'),
  getWindowState: () => ipcRenderer.invoke('get-window-state'),
  onWindowStateChanged: (callback) => {
    ipcRenderer.on('window-state-changed', (_e, state) => callback(state));
  },
  onViewerStateChanged: (callback) => {
    ipcRenderer.on('viewer-state', (_e, state) => callback(state));
  },
  onContentReady: (callback) => {
    ipcRenderer.on('content-ready', () => callback());
  },
  navigateHome: () => ipcRenderer.invoke('navigate-home'),
  reloadContent: () => ipcRenderer.invoke('reload-content'),
});
