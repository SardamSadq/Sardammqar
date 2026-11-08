const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronPOS', {
  isElectron: true,
  printReceipt: (options) => ipcRenderer.send('print-receipt', options),
  getLanServerInfo: () => ipcRenderer.invoke('get-lan-server-info'),
  broadcastSync: (msg) => ipcRenderer.send('broadcast-sync', msg),
  onSyncEvent: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('lan-sync-event', handler);
    return () => ipcRenderer.removeListener('lan-sync-event', handler);
  },
});
