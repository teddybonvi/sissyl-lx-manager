import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { spawn } from 'child_process'
import { writeFileSync, readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let mainWindow
let serverProcess

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js')  // Add preload script
    },
    title: 'Sister Sylvester LX Manager'
  })

  // In development, load from Vite dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // In production, load the built files
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

function startProxyServer() {
  // Start the proxy server
  const serverPath = join(__dirname, '../server.js')
  serverProcess = spawn('node', [serverPath], {
    stdio: 'inherit',
    env: { ...process.env }
  })
  
  serverProcess.on('error', (err) => {
    console.error('Failed to start proxy server:', err)
  })
}
ipcMain.handle('save-file', async (event, filename, content) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: filename,
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  
  if (filePath) {
    writeFileSync(filePath, content, 'utf-8')
    return { success: true, path: filePath }
  }
  
  return { success: false }
})

ipcMain.handle('open-file', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  
  if (filePaths && filePaths.length > 0) {
    const content = readFileSync(filePaths[0], 'utf-8')
    return { success: true, content }
  }
  
  return { success: false }
})

app.whenReady().then(() => {
  startProxyServer()
  
  // Wait a bit for server to start, then create window
  setTimeout(createWindow, 2000)
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill()
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill()
  }
})