import http from 'node:http'
import { join } from 'node:path'
import protobuf from 'protobufjs'
import { decodeResourceSpans } from './decoder'
import { traceStore } from '../store/trace-store'

let server: http.Server | null = null
let traceRequestType: protobuf.Type | null = null

async function loadProto(protoRoot: string): Promise<void> {
  const root = new protobuf.Root()
  root.resolvePath = (_origin, target) => {
    if (target.startsWith('opentelemetry')) {
      return join(protoRoot, target)
    }
    return target
  }
  await root.load(
    join(protoRoot, 'opentelemetry/proto/collector/trace/v1/trace_service.proto'),
    { keepCase: false }
  )
  traceRequestType = root.lookupType(
    'opentelemetry.proto.collector.trace.v1.ExportTraceServiceRequest'
  )
}

function readBody(req: http.IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function handleTraces(body: Buffer, contentType: string): void {
  let resourceSpans: any[]

  if (contentType.includes('application/x-protobuf') || contentType.includes('application/protobuf')) {
    if (!traceRequestType) {
      console.error('Proto not loaded, cannot decode protobuf')
      return
    }
    const decoded = traceRequestType.decode(body)
    const obj = traceRequestType.toObject(decoded, {
      longs: String,
      bytes: Buffer,
      defaults: true
    })
    resourceSpans = obj.resourceSpans || []
  } else {
    const json = JSON.parse(body.toString('utf-8'))
    resourceSpans = json.resourceSpans || json.resource_spans || []
  }

  const spans = decodeResourceSpans(resourceSpans)
  if (spans.length > 0) {
    traceStore.addSpans(spans)
  }
}

export async function startHttpReceiver(port: number, protoRoot: string): Promise<void> {
  await loadProto(protoRoot)

  server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    if (req.method !== 'POST') {
      res.writeHead(405)
      res.end()
      return
    }

    const contentType = req.headers['content-type'] || 'application/json'

    try {
      const body = await readBody(req)
      const url = req.url || ''

      if (url.includes('/v1/traces')) {
        handleTraces(body, contentType)
      }
      // /v1/metrics and /v1/logs accepted but not processed

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end('{}')
    } catch (err) {
      console.error('HTTP receiver error:', err)
      res.writeHead(400)
      res.end(JSON.stringify({ error: String(err) }))
    }
  })

  return new Promise((resolve, reject) => {
    server!.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`)
      }
      reject(err)
    })
    server!.listen(port, () => {
      console.log(`OTLP HTTP receiver listening on port ${port}`)
      resolve()
    })
  })
}

export function stopHttpReceiver(): Promise<void> {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve())
    } else {
      resolve()
    }
  })
}
