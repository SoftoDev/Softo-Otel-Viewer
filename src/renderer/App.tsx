import { useEffect } from 'react'
import { AppShell } from './components/layout/AppShell'
import { useAutoRefresh } from './hooks/useAutoRefresh'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useAppStore } from './stores/app-store'

export default function App() {
  const darkMode = useAppStore((s) => s.darkMode)
  const fetchFileWatcherStatus = useAppStore((s) => s.fetchFileWatcherStatus)

  useAutoRefresh()
  useKeyboardShortcuts()

  useEffect(() => {
    fetchFileWatcherStatus()
  }, [fetchFileWatcherStatus])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return <AppShell />
}
