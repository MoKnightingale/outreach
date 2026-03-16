import { ipcRenderer } from 'electron'
import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('outreachOutput', {
  onSlide: (callback: (data: any) => void) => {
    ipcRenderer.on('slide-update', (_event, data) => {
      callback(data)
    })
  }
})