import { ipcMain, dialog, BrowserWindow } from 'electron'
import { IPC } from './channels'
import { traceStore } from '../store/trace-store'
import { startFileWatcher, stopFileWatcher, getWatchDir, isWatching } from '../otlp/file-watcher'

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.TRACES_GET_SUMMARIES, () => {
    return traceStore.getTraceSummaries()
  })

  ipcMain.handle(IPC.TRACES_GET_SPANS, (_event, traceId: string) => {
    return traceStore.getTraceSpans(traceId)
  })

  ipcMain.handle(IPC.TRACES_GET_SPAN, (_event, spanId: string) => {
    return traceStore.getSpan(spanId)
  })

  ipcMain.handle(IPC.TRACES_CLEAR, () => {
    traceStore.clear()
  })

  ipcMain.handle(IPC.APP_GET_STATS, () => {
    return traceStore.getStats()
  })

  ipcMain.handle(IPC.FILE_WATCHER_SELECT_DIR, async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
      title: 'Select trace files folder'
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const dir = result.filePaths[0]
    startFileWatcher(dir)
    return dir
  })

  ipcMain.handle(IPC.FILE_WATCHER_SET_DIR, (_event, dir: string) => {
    startFileWatcher(dir)
  })

  ipcMain.handle(IPC.FILE_WATCHER_STOP, () => {
    stopFileWatcher()
  })

  ipcMain.handle(IPC.FILE_WATCHER_GET_STATUS, () => {
    return { watching: isWatching(), dir: getWatchDir() }
  })
}
