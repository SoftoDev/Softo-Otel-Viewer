import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  getTraceSummaries: () => ipcRenderer.invoke('traces:getSummaries'),
  getTraceSpans: (traceId: string) => ipcRenderer.invoke('traces:getSpans', traceId),
  getSpan: (spanId: string) => ipcRenderer.invoke('traces:getSpan', spanId),
  clearTraces: () => ipcRenderer.invoke('traces:clear'),
  getStats: () => ipcRenderer.invoke('app:getStats'),
  onDataUpdated: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('traces:dataUpdated', listener)
    return () => ipcRenderer.removeListener('traces:dataUpdated', listener)
  },
  fileWatcherSelectDir: () => ipcRenderer.invoke('fileWatcher:selectDir') as Promise<string | null>,
  fileWatcherSetDir: (dir: string) => ipcRenderer.invoke('fileWatcher:setDir', dir),
  fileWatcherStop: () => ipcRenderer.invoke('fileWatcher:stop'),
  fileWatcherGetStatus: () => ipcRenderer.invoke('fileWatcher:getStatus') as Promise<{ watching: boolean; dir: string | null }>
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI
