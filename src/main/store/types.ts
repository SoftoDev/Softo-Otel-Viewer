export interface StoredSpan {
  traceId: string
  spanId: string
  parentSpanId: string
  name: string
  kind: SpanKind
  startTimeMs: number
  endTimeMs: number
  durationMs: number
  status: SpanStatus
  attributes: Record<string, AttributeValue>
  events: SpanEvent[]
  links: SpanLink[]
  serviceName: string
  scopeName: string
  scopeVersion: string
  resourceAttributes: Record<string, AttributeValue>
  sourceFilePath?: string
}

export type AttributeValue = string | number | boolean | string[] | number[] | boolean[]

export interface SpanEvent {
  timeMs: number
  name: string
  attributes: Record<string, AttributeValue>
}

export interface SpanLink {
  traceId: string
  spanId: string
  attributes: Record<string, AttributeValue>
}

export interface SpanStatus {
  code: StatusCode
  message: string
}

export enum StatusCode {
  UNSET = 0,
  OK = 1,
  ERROR = 2
}

export enum SpanKind {
  UNSPECIFIED = 0,
  INTERNAL = 1,
  SERVER = 2,
  CLIENT = 3,
  PRODUCER = 4,
  CONSUMER = 5
}

export interface TraceSummary {
  traceId: string
  rootSpanName: string
  serviceName: string
  startTimeMs: number
  durationMs: number
  spanCount: number
  hasError: boolean
  sourceFilePath?: string
}

export interface StoreStats {
  traceCount: number
  spanCount: number
}
