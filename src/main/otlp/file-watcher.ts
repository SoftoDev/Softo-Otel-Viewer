import fs from 'node:fs'
import path from 'node:path'
import { decodeResourceSpans } from './decoder'
import { traceStore } from '../store/trace-store'

let watcher: fs.FSWatcher | null = null
let watchDir: string | null = null
const processedFiles = new Set<string>()

function processTraceFile(filePath: string): void {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const json = JSON.parse(content)

    const resourceSpans = json.resourceSpans || json.resource_spans || []
    if (resourceSpans.length === 0) return

    const spans = decodeResourceSpans(resourceSpans)
    for (const span of spans) {
      span.sourceFilePath = filePath
    }
    if (spans.length > 0) {
      traceStore.addSpans(spans)
      console.log(`File watcher: loaded ${spans.length} spans from ${path.basename(filePath)}`)
    }
  } catch (err) {
    console.error(`File watcher: failed to process ${filePath}:`, err)
  }
}

function scanDirectory(dir: string): void {
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    if (!entry.isFile()) continue
    if (!/\.json$/i.test(entry.name)) continue

    const filePath = path.join(dir, entry.name)
    if (processedFiles.has(filePath)) continue

    processedFiles.add(filePath)
    processTraceFile(filePath)
  }
}

export function startFileWatcher(dir: string): void {
  stopFileWatcher()

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  watchDir = dir
  processedFiles.clear()

  // Process existing files
  scanDirectory(dir)

  // Watch for new/changed files
  watcher = fs.watch(dir, (_eventType, filename) => {
    if (!filename || !/\.json$/i.test(filename)) return

    const filePath = path.join(dir, filename)
    if (!fs.existsSync(filePath)) return

    // Small delay so the file is fully written
    setTimeout(() => {
      if (!fs.existsSync(filePath)) return
      processedFiles.add(filePath)
      processTraceFile(filePath)
    }, 100)
  })

  watcher.on('error', (err) => {
    console.error('File watcher error:', err)
  })

  console.log(`File watcher: monitoring ${dir}`)
}

export function stopFileWatcher(): void {
  if (watcher) {
    watcher.close()
    watcher = null
  }
  watchDir = null
  processedFiles.clear()
}

export function getWatchDir(): string | null {
  return watchDir
}

export function isWatching(): boolean {
  return watcher !== null
}
