import { useMemo } from 'react'
import { useAppStore } from '../../stores/app-store'
import { StatusBadge } from '../common/StatusBadge'
import { KeyValueTable } from '../common/KeyValueTable'
import { formatDuration, SPAN_KIND_LABELS } from './TraceList'

export function SpanDetail() {
  const selectedSpanId = useAppStore((s) => s.selectedSpanId)
  const traceSpans = useAppStore((s) => s.traceSpans)

  const span = useMemo(() => {
    if (!selectedSpanId) return null
    return traceSpans.find((s) => s.spanId === selectedSpanId) || null
  }, [selectedSpanId, traceSpans])

  if (!span) {
    return (
      <div className="p-4 text-sm text-[var(--color-text-secondary)]">
        Select a span to view details
      </div>
    )
  }

  return (
    <div className="p-4 overflow-y-auto h-full">
      <div className="mb-4">
        <h3 className="text-base font-semibold mb-2">{span.name}</h3>
        <div className="flex items-center gap-3 text-xs">
          <StatusBadge code={span.status.code} />
          <span className="px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)]">
            {SPAN_KIND_LABELS[span.kind] || 'UNKNOWN'}
          </span>
          <span className="text-[var(--color-text-secondary)]">
            {formatDuration(span.durationMs)}
          </span>
        </div>
      </div>

      {span.status.message && (
        <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-400">
          {span.status.message}
        </div>
      )}

      <KeyValueTable
        title="Span Info"
        data={{
          'Trace ID': span.traceId,
          'Span ID': span.spanId,
          'Parent Span ID': span.parentSpanId || '(root)',
          Service: span.serviceName,
          'Start Time': new Date(span.startTimeMs).toISOString(),
          Duration: formatDuration(span.durationMs),
          Scope: span.scopeName ? `${span.scopeName}@${span.scopeVersion}` : '(none)'
        }}
      />

      {Object.keys(span.attributes).length > 0 && (
        <KeyValueTable title="Attributes" data={span.attributes} />
      )}

      {Object.keys(span.resourceAttributes).length > 0 && (
        <KeyValueTable title="Resource Attributes" data={span.resourceAttributes} />
      )}

      {span.events.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2 text-[var(--color-text-secondary)]">
            Events ({span.events.length})
          </h4>
          {span.events.map((event, i) => (
            <div
              key={i}
              className="mb-2 p-2 rounded bg-[var(--color-bg-tertiary)] text-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{event.name}</span>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {new Date(event.timeMs).toISOString()}
                </span>
              </div>
              {Object.keys(event.attributes).length > 0 && (
                <KeyValueTable data={event.attributes} />
              )}
            </div>
          ))}
        </div>
      )}

      {span.links.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2 text-[var(--color-text-secondary)]">
            Links ({span.links.length})
          </h4>
          {span.links.map((link, i) => (
            <div
              key={i}
              className="mb-2 p-2 rounded bg-[var(--color-bg-tertiary)] text-sm font-mono"
            >
              <div className="text-xs">Trace: {link.traceId}</div>
              <div className="text-xs">Span: {link.spanId}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
