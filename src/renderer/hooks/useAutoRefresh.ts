import { useEffect } from 'react'
import { api } from '../api/ipc-client'
import { useAppStore } from '../stores/app-store'

export function useAutoRefresh(): void {
  const fetchSummaries = useAppStore((s) => s.fetchSummaries)
  const selectedTraceId = useAppStore((s) => s.selectedTraceId)
  const selectTrace = useAppStore((s) => s.selectTrace)

  useEffect(() => {
    fetchSummaries()

    const unsubscribe = api.onDataUpdated(() => {
      fetchSummaries()
      if (selectedTraceId) {
        selectTrace(selectedTraceId)
      }
    })

    return unsubscribe
  }, [fetchSummaries, selectedTraceId, selectTrace])
}
