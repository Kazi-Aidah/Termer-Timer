const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSettings: (settings) => ipcRenderer.send('set-settings', settings),
  showNotification: (options) => ipcRenderer.invoke('show-notification', options)
});