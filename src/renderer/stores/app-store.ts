import { create } from 'zustand'
import { api } from '../api/ipc-client'

interface TraceSummary {
  traceId: string
  rootSpanName: string
  serviceName: string
  startTimeMs: number
  durationMs: number
  spanCount: number
  hasError: boolean
  sourceFilePath?: string
}

interface StoredSpan {
  traceId: string
  spanId: string
  parentSpanId: string
  name: string
  kind: number
  startTimeMs: number
  endTimeMs: number
  durationMs: number
  status: { code: number; message: string }
  attributes: Record<string, any>
  events: { timeMs: number; name: string; attributes: Record<string, any> }[]
  links: { traceId: string; spanId: string; attributes: Record<string, any> }[]
  serviceName: string
  scopeName: string
  scopeVersion: string
  resourceAttributes: Record<string, any>
  sourceFilePath?: string
}

interface StoreStats {
  traceCount: number
  spanCount: number
}

interface FileWatcherStatus {
  watching: boolean
  dir: string | null
}

interface AppState {
  traceSummaries: TraceSummary[]
  selectedTraceId: string | null
  selectedSpanId: string | null
  traceSpans: StoredSpan[]
  stats: StoreStats
  darkMode: boolean
  receiverStatus: { http: boolean; grpc: boolean }
  fileWatcher: FileWatcherStatus

  fetchSummaries: () => Promise<void>
  selectTrace: (traceId: string | null) => Promise<void>
  selectSpan: (spanId: string | null) => void
  clearTraces: () => Promise<void>
  fetchStats: () => Promise<void>
  toggleDarkMode: () => void
  selectWatchDir: () => Promise<void>
  stopWatching: () => Promise<void>
  fetchFileWatcherStatus: () => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  traceSummaries: [],
  selectedTraceId: null,
  selectedSpanId: null,
  traceSpans: [],
  stats: { traceCount: 0, spanCount: 0 },
  darkMode: localStorage.getItem('darkMode') === 'true',
  receiverStatus: { http: true, grpc: true },
  fileWatcher: { watching: false, dir: null },

  fetchSummaries: async () => {
    const summaries = await api.getTraceSummaries()
    const stats = await api.getStats()
    set({ traceSummaries: summaries, stats })
  },

  selectTrace: async (traceId) => {
    if (!traceId) {
      set({ selectedTraceId: null, traceSpans: [], selectedSpanId: null })
      return
    }
    const spans = await api.getTraceSpans(traceId)
    set({ selectedTraceId: traceId, traceSpans: spans, selectedSpanId: null })
  },

  selectSpan: (spanId) => {
    set({ selectedSpanId: spanId })
  },

  clearTraces: async () => {
    await api.clearTraces()
    set({
      traceSummaries: [],
      selectedTraceId: null,
      selectedSpanId: null,
      traceSpans: [],
      stats: { traceCount: 0, spanCount: 0 }
    })
  },

  fetchStats: async () => {
    const stats = await api.getStats()
    set({ stats })
  },

  toggleDarkMode: () => {
    const newMode = !get().darkMode
    localStorage.setItem('darkMode', String(newMode))
    set({ darkMode: newMode })
  },

  selectWatchDir: async () => {
    const dir = await api.fileWatcherSelectDir()
    if (dir) {
      set({ fileWatcher: { watching: true, dir } })
    }
  },

  stopWatching: async () => {
    await api.fileWatcherStop()
    set({ fileWatcher: { watching: false, dir: null } })
  },

  fetchFileWatcherStatus: async () => {
    const status = await api.fileWatcherGetStatus()
    set({ fileWatcher: status })
  }
}))
