interface StatusBadgeProps {
  code: number
}

const STATUS_LABELS: Record<number, string> = {
  0: 'UNSET',
  1: 'OK',
  2: 'ERROR'
}

export function StatusBadge({ code }: StatusBadgeProps) {
  const label = STATUS_LABELS[code] || 'UNKNOWN'

  const colors =
    code === 2
      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      : code === 1
        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors}`}>
      {label}
    </span>
  )
}
