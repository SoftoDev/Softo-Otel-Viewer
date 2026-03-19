import { StoredSpan, TraceSummary, StoreStats } from './types'

const MAX_TRACES = 1000

export class TraceStore {
  private spans = new Map<string, StoredSpan>()
  private traceSpans = new Map<string, Set<string>>()
  private traceOrder: string[] = []
  private onChange: (() => void) | null = null

  setOnChange(cb: () => void): void {
    this.onChange = cb
  }

  addSpans(newSpans: StoredSpan[]): void {
    for (const span of newSpans) {
      this.spans.set(span.spanId, span)

      let spanSet = this.traceSpans.get(span.traceId)
      if (!spanSet) {
        spanSet = new Set()
        this.traceSpans.set(span.traceId, spanSet)
        this.traceOrder.push(span.traceId)
      }
      spanSet.add(span.spanId)
    }

    this.evictOldTraces()
    this.onChange?.()
  }

  getTraceSummaries(): TraceSummary[] {
    const summaries: TraceSummary[] = []

    for (const traceId of this.traceOrder) {
      const spanIds = this.traceSpans.get(traceId)
      if (!spanIds) continue

      const spans = [...spanIds].map((id) => this.spans.get(id)!).filter(Boolean)
      if (spans.length === 0) continue

      const rootSpan = spans.find((s) => !s.parentSpanId) || spans[0]
      const minStart = Math.min(...spans.map((s) => s.startTimeMs))
      const maxEnd = Math.max(...spans.map((s) => s.endTimeMs))
      const hasError = spans.some((s) => s.status.code === 2)

      summaries.push({
        traceId,
        rootSpanName: rootSpan.name,
        serviceName: rootSpan.serviceName,
        startTimeMs: minStart,
        durationMs: maxEnd - minStart,
        spanCount: spans.length,
        hasError,
        sourceFilePath: rootSpan.sourceFilePath
      })
    }

    return summaries.reverse()
  }

  getTraceSpans(traceId: string): StoredSpan[] {
    const spanIds = this.traceSpans.get(traceId)
    if (!spanIds) return []
    return [...spanIds].map((id) => this.spans.get(id)!).filter(Boolean)
  }

  getSpan(spanId: string): StoredSpan | undefined {
    return this.spans.get(spanId)
  }

  clear(): void {
    this.spans.clear()
    this.traceSpans.clear()
    this.traceOrder = []
    this.onChange?.()
  }

  getStats(): StoreStats {
    return {
      traceCount: this.traceSpans.size,
      spanCount: this.spans.size
    }
  }

  private evictOldTraces(): void {
    while (this.traceOrder.length > MAX_TRACES) {
      const oldTraceId = this.traceOrder.shift()!
      const spanIds = this.traceSpans.get(oldTraceId)
      if (spanIds) {
        for (const spanId of spanIds) {
          this.spans.delete(spanId)
        }
        this.traceSpans.delete(oldTraceId)
      }
    }
  }
}

export const traceStore = new TraceStore()
