import { StoredSpan, SpanEvent, SpanLink, SpanStatus, AttributeValue, StatusCode, SpanKind } from '../store/types'

function bufferToHex(buf: Buffer | Uint8Array | string): string {
  if (typeof buf === 'string') return buf
  return Buffer.from(buf).toString('hex')
}

function nanoToMs(nano: number | Long | string): number {
  const n = typeof nano === 'string' ? parseInt(nano, 10) : Number(nano)
  return n / 1_000_000
}

interface Long {
  low: number
  high: number
  unsigned: boolean
}

function anyValueToJs(av: any): AttributeValue | undefined {
  if (!av) return undefined
  if (av.stringValue !== undefined && av.stringValue !== null) return av.stringValue
  if (av.intValue !== undefined && av.intValue !== null) return Number(av.intValue)
  if (av.doubleValue !== undefined && av.doubleValue !== null) return av.doubleValue
  if (av.boolValue !== undefined && av.boolValue !== null) return av.boolValue
  if (av.arrayValue?.values) {
    return av.arrayValue.values.map((v: any) => anyValueToJs(v)).filter((v: any) => v !== undefined) as AttributeValue
  }
  if (av.bytesValue) return bufferToHex(av.bytesValue)
  return undefined
}

function kvListToRecord(kvList: any[]): Record<string, AttributeValue> {
  const result: Record<string, AttributeValue> = {}
  if (!kvList) return result
  for (const kv of kvList) {
    const val = anyValueToJs(kv.value)
    if (val !== undefined) {
      result[kv.key] = val
    }
  }
  return result
}

function getServiceName(resourceAttrs: Record<string, AttributeValue>): string {
  return (resourceAttrs['service.name'] as string) || 'unknown'
}

export function decodeResourceSpans(resourceSpans: any[]): StoredSpan[] {
  const result: StoredSpan[] = []

  if (!resourceSpans) return result

  for (const rs of resourceSpans) {
    const resourceAttributes = kvListToRecord(rs.resource?.attributes)
    const serviceName = getServiceName(resourceAttributes)

    const scopeSpans = rs.scopeSpans || rs.scope_spans || []
    for (const ss of scopeSpans) {
      const scopeName = ss.scope?.name || ''
      const scopeVersion = ss.scope?.version || ''

      const spans = ss.spans || []
      for (const span of spans) {
        const startTimeMs = nanoToMs(span.startTimeUnixNano || span.start_time_unix_nano || 0)
        const endTimeMs = nanoToMs(span.endTimeUnixNano || span.end_time_unix_nano || 0)

        const events: SpanEvent[] = (span.events || []).map((e: any) => ({
          timeMs: nanoToMs(e.timeUnixNano || e.time_unix_nano || 0),
          name: e.name || '',
          attributes: kvListToRecord(e.attributes)
        }))

        const links: SpanLink[] = (span.links || []).map((l: any) => ({
          traceId: bufferToHex(l.traceId || l.trace_id || ''),
          spanId: bufferToHex(l.spanId || l.span_id || ''),
          attributes: kvListToRecord(l.attributes)
        }))

        const status: SpanStatus = {
          code: (span.status?.code ?? StatusCode.UNSET) as StatusCode,
          message: span.status?.message || ''
        }

        result.push({
          traceId: bufferToHex(span.traceId || span.trace_id || ''),
          spanId: bufferToHex(span.spanId || span.span_id || ''),
          parentSpanId: bufferToHex(span.parentSpanId || span.parent_span_id || ''),
          name: span.name || '',
          kind: (span.kind ?? SpanKind.UNSPECIFIED) as SpanKind,
          startTimeMs,
          endTimeMs,
          durationMs: endTimeMs - startTimeMs,
          status,
          attributes: kvListToRecord(span.attributes),
          events,
          links,
          serviceName,
          scopeName,
          scopeVersion,
          resourceAttributes
        })
      }
    }
  }

  return result
}
