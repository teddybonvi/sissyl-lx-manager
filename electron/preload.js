const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (filename, content) => ipcRenderer.invoke('save-file', filename, content),
  openFile: () => ipcRenderer.invoke('open-file'),
  updateMonitorData: (data) => ipcRenderer.invoke('update-monitor-data', data),
  sendOSCToQlab: (address, args) => ipcRenderer.invoke('send-osc-to-qlab', address, args),
  onQlabStatus: (callback) => ipcRenderer.on('qlab-status', (event, data) => callback(data)),
  readConfigFile: (path) => ipcRenderer.invoke('read-config-file', path),
  writeConfigFile: (path, data) => ipcRenderer.invoke('write-config-file', path, data),
  sendOSCToHeadlamps: (address, args) => ipcRenderer.invoke('send-osc-to-headlamps', address, args),
  onHeadlampUpdate: (callback) => ipcRenderer.on('headlamp-update', (event, data) => callback(data)),
  removeHeadlampUnit: (unitNumber) => ipcRenderer.invoke('remove-headlamp-unit', unitNumber),
  runOTAUpdate: () => ipcRenderer.invoke('run-ota-update'),
  runSingleOTAUpdate: (unitNumber) => ipcRenderer.invoke('run-single-ota-update', unitNumber),
})