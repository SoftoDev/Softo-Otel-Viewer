import type { ElectronAPI } from '../../preload/index'

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export const api = {
  getTraceSummaries: () => window.electronAPI.getTraceSummaries(),
  getTraceSpans: (traceId: string) => window.electronAPI.getTraceSpans(traceId),
  getSpan: (spanId: string) => window.electronAPI.getSpan(spanId),
  clearTraces: () => window.electronAPI.clearTraces(),
  getStats: () => window.electronAPI.getStats(),
  onDataUpdated: (cb: () => void) => window.electronAPI.onDataUpdated(cb),
  fileWatcherSelectDir: () => window.electronAPI.fileWatcherSelectDir(),
  fileWatcherStop: () => window.electronAPI.fileWatcherStop(),
  fileWatcherGetStatus: () => window.electronAPI.fileWatcherGetStatus()
}
