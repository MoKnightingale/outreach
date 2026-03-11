import { contextBridge, ipcRenderer } from 'electron'

// For the main operator window
contextBridge.exposeInMainWorld('outreach', {
  projectSlide: (slideData: object) => {
    ipcRenderer.send('project-slide', slideData)
  },
  blankScreen: () => {
    ipcRenderer.send('blank-screen')
  },
  toggleOutput: () => {
    ipcRenderer.send('toggle-output')
  },
})

// For the output window — listen for slide updates
contextBridge.exposeInMainWorld('outreachOutput', {
  onSlide: (callback: (data: any) => void) => {
    ipcRenderer.on('slide-update', (_event, data) => {
      callback(data)
    })
  }
})