const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronPOS', {
  isElectron: true,
  printReceipt: (options) => ipcRenderer.send('print-receipt', options),
});
