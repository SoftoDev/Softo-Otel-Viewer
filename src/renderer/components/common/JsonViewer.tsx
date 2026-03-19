interface JsonViewerProps {
  data: any
  title?: string
}

export function JsonViewer({ data, title }: JsonViewerProps) {
  return (
    <div className="mb-4">
      {title && (
        <h4 className="text-sm font-semibold mb-2 text-[var(--color-text-secondary)]">{title}</h4>
      )}
      <pre className="bg-[var(--color-bg-tertiary)] rounded p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}
