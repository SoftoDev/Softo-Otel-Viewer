import { useState } from 'react'
import { useAppStore } from '../../stores/app-store'
import { SpanTimeline } from './SpanTimeline'
import { SpanDetail } from './SpanDetail'

export function TraceDetail() {
  const selectedTraceId = useAppStore((s) => s.selectedTraceId)
  const traceSpans = useAppStore((s) => s.traceSpans)
  const traceSummaries = useAppStore((s) => s.traceSummaries)
  const [copied, setCopied] = useState(false)

  if (!selectedTraceId) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--color-text-secondary)] text-sm">
        Select a trace to view details
      </div>
    )
  }

  const summary = traceSummaries.find((s) => s.traceId === selectedTraceId)
  const sourceFilePath = summary?.sourceFilePath

  const copyFilePath = async () => {
    if (!sourceFilePath) return
    await navigator.clipboard.writeText(sourceFilePath)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-[var(--color-text-secondary)]">
            Trace {selectedTraceId.substring(0, 16)}... ({traceSpans.length} spans)
          </span>
          {sourceFilePath && (
            <button
              onClick={copyFilePath}
              title={sourceFilePath}
              className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors px-2 py-0.5 rounded hover:bg-[var(--color-bg-tertiary)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              </svg>
              {copied ? 'Copied!' : 'Copy file path'}
            </button>
          )}
        </div>
      </div>
      <div className="shrink-0 max-h-[50%] overflow-auto">
        <SpanTimeline />
      </div>
      <div className="flex-1 overflow-hidden">
        <SpanDetail />
      </div>
    </div>
  )
}
