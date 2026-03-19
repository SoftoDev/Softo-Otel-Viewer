import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import { join } from 'node:path'
import { decodeResourceSpans } from './decoder'
import { traceStore } from '../store/trace-store'

let server: grpc.Server | null = null

function handleTraceExport(
  call: grpc.ServerUnaryCall<any, any>,
  callback: grpc.sendUnaryData<any>
): void {
  try {
    const resourceSpans = call.request.resource_spans || call.request.resourceSpans || []
    const spans = decodeResourceSpans(resourceSpans)
    if (spans.length > 0) {
      traceStore.addSpans(spans)
    }
    callback(null, {})
  } catch (err) {
    console.error('gRPC trace export error:', err)
    callback(null, {})
  }
}

function handleNoOp(
  _call: grpc.ServerUnaryCall<any, any>,
  callback: grpc.sendUnaryData<any>
): void {
  callback(null, {})
}

export async function startGrpcReceiver(port: number, protoRoot: string): Promise<void> {
  const traceProto = join(
    protoRoot,
    'opentelemetry/proto/collector/trace/v1/trace_service.proto'
  )
  const metricsProto = join(
    protoRoot,
    'opentelemetry/proto/collector/metrics/v1/metrics_service.proto'
  )
  const logsProto = join(
    protoRoot,
    'opentelemetry/proto/collector/logs/v1/logs_service.proto'
  )

  const loadOptions: protoLoader.Options = {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
    includeDirs: [protoRoot]
  }

  const [tracePkgDef, metricsPkgDef, logsPkgDef] = await Promise.all([
    protoLoader.load(traceProto, loadOptions),
    protoLoader.load(metricsProto, loadOptions),
    protoLoader.load(logsProto, loadOptions)
  ])

  const traceGrpc = grpc.loadPackageDefinition(tracePkgDef)
  const metricsGrpc = grpc.loadPackageDefinition(metricsPkgDef)
  const logsGrpc = grpc.loadPackageDefinition(logsPkgDef)

  const traceService = (traceGrpc as any).opentelemetry.proto.collector.trace.v1.TraceService
    .service
  const metricsService = (metricsGrpc as any).opentelemetry.proto.collector.metrics.v1
    .MetricsService.service
  const logsService = (logsGrpc as any).opentelemetry.proto.collector.logs.v1.LogsService.service

  server = new grpc.Server()
  server.addService(traceService, { Export: handleTraceExport })
  server.addService(metricsService, { Export: handleNoOp })
  server.addService(logsService, { Export: handleNoOp })

  return new Promise((resolve, reject) => {
    server!.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (err, boundPort) => {
        if (err) {
          if (err.message.includes('address already in use')) {
            console.error(`Port ${port} is already in use`)
          }
          reject(err)
          return
        }
        console.log(`OTLP gRPC receiver listening on port ${boundPort}`)
        resolve()
      }
    )
  })
}

export function stopGrpcReceiver(): Promise<void> {
  return new Promise((resolve) => {
    if (server) {
      server.tryShutdown(() => resolve())
    } else {
      resolve()
    }
  })
}
