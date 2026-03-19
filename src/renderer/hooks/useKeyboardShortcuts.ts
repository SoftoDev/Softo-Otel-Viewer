import { useEffect } from 'react'
import { useAppStore } from '../stores/app-store'

export function useKeyboardShortcuts(): void {
  const clearTraces = useAppStore((s) => s.clearTraces)
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'l') {
          e.preventDefault()
          clearTraces()
        } else if (e.key === 'd') {
          e.preventDefault()
          toggleDarkMode()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [clearTraces, toggleDarkMode])
}
