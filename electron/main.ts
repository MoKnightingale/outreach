import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let mainWindow: BrowserWindow | null = null
let outputWindow: BrowserWindow | null = null

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#080a0f',
    webPreferences: {
      preload: join(app.getAppPath(), 'dist-electron/preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const devUrl = 'http://localhost:5173'
  // Always try dev server first, fall back to built files
  mainWindow.loadURL(devUrl).catch(() => {
    mainWindow!.loadFile(join(app.getAppPath(), 'dist/index.html'))
  })
 mainWindow.webContents.openDevTools()
}

function createOutputWindow() {
  const displays = screen.getAllDisplays()
  const targetDisplay = displays.length > 1 ? displays[1] : displays[0]
  const { x, y, width, height } = targetDisplay.bounds

  outputWindow = new BrowserWindow({
    x,
    y,
    width: displays.length > 1 ? width : 960,
    height: displays.length > 1 ? height : 540,
    fullscreen: displays.length > 1,
    frame: false,
    backgroundColor: '#000000',
    alwaysOnTop: displays.length > 1,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  })

  if (displays.length === 1) {
    outputWindow.setPosition(
      Math.round(x + (width - 960) / 2),
      Math.round(y + (height - 540) / 2)
    )
  }

  outputWindow.loadFile(join(app.getAppPath(), 'public/output.html'))

  outputWindow.webContents.openDevTools({ mode: 'detach' })

  outputWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Output window loaded')
    outputWindow?.webContents.send('slide-update', {
      line1: 'Output Window',
      line2: 'Connected!',
      label: 'TEST',
      bright: true,
      blank: false,
    })
  })

  outputWindow.on('closed', () => {
    outputWindow = null
  })
}

ipcMain.on('project-slide', (_event, slideData) => {
  if (outputWindow && !outputWindow.isDestroyed()) {
    outputWindow.webContents.send('slide-update', slideData)
    console.log('📽 Projecting:', slideData.line1)
  }
})

ipcMain.on('blank-screen', () => {
  if (outputWindow && !outputWindow.isDestroyed()) {
    outputWindow.webContents.send('slide-update', { blank: true })
  }
})

ipcMain.on('toggle-output', () => {
  if (outputWindow && !outputWindow.isDestroyed()) {
    outputWindow.close()
  } else {
    createOutputWindow()
  }
})

app.whenReady().then(() => {
  createMainWindow()
  createOutputWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})