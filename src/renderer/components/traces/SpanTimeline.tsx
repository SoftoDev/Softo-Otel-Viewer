import { useMemo } from 'react'
import { useAppStore } from '../../stores/app-store'
import { formatDuration } from './TraceList'

const SERVICE_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#e11d48'
]

interface TreeSpan {
  spanId: string
  parentSpanId: string
  name: string
  serviceName: string
  startTimeMs: number
  endTimeMs: number
  durationMs: number
  depth: number
  status: { code: number }
  children: TreeSpan[]
}

function buildTree(spans: any[]): TreeSpan[] {
  const map = new Map<string, TreeSpan>()
  const roots: TreeSpan[] = []

  for (const s of spans) {
    map.set(s.spanId, { ...s, depth: 0, children: [] })
  }

  for (const s of map.values()) {
    const parent = map.get(s.parentSpanId)
    if (parent) {
      parent.children.push(s)
    } else {
      roots.push(s)
    }
  }

  function setDepth(node: TreeSpan, depth: number): void {
    node.depth = depth
    node.children.sort((a, b) => a.startTimeMs - b.startTimeMs)
    for (const child of node.children) setDepth(child, depth + 1)
  }
  roots.sort((a, b) => a.startTimeMs - b.startTimeMs)
  for (const r of roots) setDepth(r, 0)

  function flatten(node: TreeSpan): TreeSpan[] {
    return [node, ...node.children.flatMap(flatten)]
  }
  return roots.flatMap(flatten)
}

export function SpanTimeline() {
  const traceSpans = useAppStore((s) => s.traceSpans)
  const selectedSpanId = useAppStore((s) => s.selectedSpanId)
  const selectSpan = useAppStore((s) => s.selectSpan)

  const { flatSpans, traceStart, traceDuration, serviceColorMap } = useMemo(() => {
    if (traceSpans.length === 0) return { flatSpans: [], traceStart: 0, traceDuration: 0, serviceColorMap: new Map() }

    const flatSpans = buildTree(traceSpans)
    const traceStart = Math.min(...traceSpans.map((s) => s.startTimeMs))
    const traceEnd = Math.max(...traceSpans.map((s) => s.endTimeMs))
    const traceDuration = traceEnd - traceStart

    const services = [...new Set(traceSpans.map((s) => s.serviceName))]
    const serviceColorMap = new Map(services.map((s, i) => [s, SERVICE_COLORS[i % SERVICE_COLORS.length]]))

    return { flatSpans, traceStart, traceDuration, serviceColorMap }
  }, [traceSpans])

  if (flatSpans.length === 0) return null

  const ROW_HEIGHT = 28
  const LABEL_WIDTH = 280

  return (
    <div className="overflow-auto border-b border-[var(--color-border)]">
      {/* Time axis */}
      <div className="flex text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border)]" style={{ paddingLeft: LABEL_WIDTH }}>
        <div className="flex-1 flex justify-between px-2 py-1">
          <span>0ms</span>
          <span>{formatDuration(traceDuration / 4)}</span>
          <span>{formatDuration(traceDuration / 2)}</span>
          <span>{formatDuration((traceDuration * 3) / 4)}</span>
          <span>{formatDuration(traceDuration)}</span>
        </div>
      </div>

      {/* Spans */}
      {flatSpans.map((span) => {
        const left = traceDuration > 0 ? ((span.startTimeMs - traceStart) / traceDuration) * 100 : 0
        const width = traceDuration > 0 ? Math.max((span.durationMs / traceDuration) * 100, 0.5) : 100
        const color = serviceColorMap.get(span.serviceName) || SERVICE_COLORS[0]
        const isSelected = selectedSpanId === span.spanId
        const isError = span.status.code === 2

        return (
          <div
            key={span.spanId}
            onClick={() => selectSpan(span.spanId)}
            className={`flex items-center cursor-pointer hover:bg-[var(--color-bg-tertiary)] transition-colors ${
              isSelected ? 'bg-[var(--color-bg-tertiary)]' : ''
            }`}
            style={{ height: ROW_HEIGHT }}
          >
            {/* Label */}
            <div
              className="shrink-0 flex items-center text-xs truncate pr-2"
              style={{ width: LABEL_WIDTH, paddingLeft: 8 + span.depth * 16 }}
            >
              <span className="truncate" title={span.name}>
                {span.name}
              </span>
            </div>

            {/* Bar */}
            <div className="flex-1 relative h-full">
              <div
                className="absolute top-1 rounded-sm"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  height: ROW_HEIGHT - 8,
                  backgroundColor: isError ? 'var(--color-error)' : color,
                  opacity: isSelected ? 1 : 0.8,
                  minWidth: 2
                }}
              />
              <span
                className="absolute text-xs text-[var(--color-text-secondary)] whitespace-nowrap"
                style={{
                  left: `${left + width}%`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  marginLeft: 4
                }}
              >
                {formatDuration(span.durationMs)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
