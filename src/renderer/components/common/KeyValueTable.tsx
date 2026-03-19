interface KeyValueTableProps {
  data: Record<string, any>
  title?: string
}

export function KeyValueTable({ data, title }: KeyValueTableProps) {
  const entries = Object.entries(data)
  if (entries.length === 0) return null

  return (
    <div className="mb-4">
      {title && (
        <h4 className="text-sm font-semibold mb-2 text-[var(--color-text-secondary)]">{title}</h4>
      )}
      <table className="w-full text-sm">
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key} className="border-b border-[var(--color-border)]">
              <td className="py-1.5 pr-4 text-[var(--color-text-secondary)] font-mono whitespace-nowrap align-top">
                {key}
              </td>
              <td className="py-1.5 font-mono break-all">{formatValue(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatValue(value: any): string {
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
