import { app, BrowserWindow, Menu } from 'electron'
import { join } from 'node:path'
import { registerIpcHandlers } from './ipc/handlers'
import { traceStore } from './store/trace-store'
import { startHttpReceiver, stopHttpReceiver } from './otlp/http-receiver'
import { startGrpcReceiver, stopGrpcReceiver } from './otlp/grpc-receiver'
import { stopFileWatcher } from './otlp/file-watcher'

let mainWindow: BrowserWindow | null = null

function getProtoRoot(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'proto')
  }
  return join(__dirname, '../../proto')
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'Softo OTEL Viewer',
    icon: join(__dirname, '../../resources/icon.png')
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function notifyRenderer(): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    mainWindow?.webContents.send('traces:dataUpdated')
  }, 200)
}

app.whenReady().then(async () => {
  const defaultMenu = Menu.getApplicationMenu()
  const filtered = (defaultMenu?.items ?? []).filter(
    (item) => !['Edit', 'View', 'Window', 'Help'].includes(item.label)
  )
  Menu.setApplicationMenu(Menu.buildFromTemplate(filtered.map((i) => i)))

  registerIpcHandlers()
  createWindow()

  traceStore.setOnChange(notifyRenderer)

  const protoRoot = getProtoRoot()

  try {
    await startHttpReceiver(4318, protoRoot)
  } catch (err) {
    console.error('Failed to start HTTP receiver:', err)
  }

  try {
    await startGrpcReceiver(4317, protoRoot)
  } catch (err) {
    console.error('Failed to start gRPC receiver:', err)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', async () => {
  stopFileWatcher()
  await Promise.all([stopHttpReceiver(), stopGrpcReceiver()])
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
