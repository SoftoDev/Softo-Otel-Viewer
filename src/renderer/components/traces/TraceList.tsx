import { useAppStore } from '../../stores/app-store'

const SPAN_KIND_LABELS: Record<number, string> = {
  0: 'UNSPECIFIED',
  1: 'INTERNAL',
  2: 'SERVER',
  3: 'CLIENT',
  4: 'PRODUCER',
  5: 'CONSUMER'
}

function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}us`
  if (ms < 1000) return `${ms.toFixed(1)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString()
}

export function TraceList() {
  const summaries = useAppStore((s) => s.traceSummaries)
  const selectedTraceId = useAppStore((s) => s.selectedTraceId)
  const selectTrace = useAppStore((s) => s.selectTrace)

  if (summaries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--color-text-secondary)] text-sm">
        <div className="text-center">
          <p className="mb-2">No traces yet</p>
          <p className="text-xs">Send OTLP data to localhost:4318 (HTTP) or localhost:4317 (gRPC)</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto h-full">
      {summaries.map((trace) => (
        <button
          key={trace.traceId}
          onClick={() => selectTrace(trace.traceId)}
          className={`w-full text-left px-3 py-2.5 border-b border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] transition-colors ${
            selectedTraceId === trace.traceId ? 'bg-[var(--color-bg-tertiary)]' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm truncate mr-2">{trace.rootSpanName}</span>
            <span className="text-xs text-[var(--color-text-secondary)] whitespace-nowrap">
              {formatDuration(trace.durationMs)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <span className="px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)]">
              {trace.serviceName}
            </span>
            <span>{trace.spanCount} spans</span>
            <span>{formatTime(trace.startTimeMs)}</span>
            {trace.hasError && (
              <span className="text-[var(--color-error)] font-medium">ERROR</span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

export { formatDuration, formatTime, SPAN_KIND_LABELS }
