import { useAppStore } from '../../stores/app-store'

export function Header() {
  const stats = useAppStore((s) => s.stats)
  const darkMode = useAppStore((s) => s.darkMode)
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode)
  const clearTraces = useAppStore((s) => s.clearTraces)
  const fileWatcher = useAppStore((s) => s.fileWatcher)
  const selectWatchDir = useAppStore((s) => s.selectWatchDir)
  const stopWatching = useAppStore((s) => s.stopWatching)

  const watchDirBasename = fileWatcher.dir
    ? fileWatcher.dir.split(/[\\/]/).filter(Boolean).pop()
    : null

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-bold tracking-tight">Softo OTEL Viewer</h1>
        <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
          <span>{stats.traceCount} traces</span>
          <span>{stats.spanCount} spans</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            HTTP :4318
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            gRPC :4317
          </span>
          {fileWatcher.watching && (
            <span className="flex items-center gap-1" title={fileWatcher.dir || ''}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {watchDirBasename}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {fileWatcher.watching ? (
          <button
            onClick={stopWatching}
            className="px-3 py-1 text-xs rounded border border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
            title={`Stop watching ${fileWatcher.dir}`}
          >
            Stop Watch
          </button>
        ) : (
          <button
            onClick={selectWatchDir}
            className="px-3 py-1 text-xs rounded border border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
            title="Watch a folder for trace JSON files"
          >
            Watch Folder
          </button>
        )}
        <button
          onClick={clearTraces}
          className="px-3 py-1 text-xs rounded border border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          title="Clear all traces (Ctrl+L)"
        >
          Clear
        </button>
        <button
          onClick={toggleDarkMode}
          className="px-3 py-1 text-xs rounded border border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          title="Toggle dark mode (Ctrl+D)"
        >
          {darkMode ? 'Light' : 'Dark'}
        </button>
      </div>
    </header>
  )
}
