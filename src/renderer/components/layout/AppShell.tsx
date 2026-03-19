import { Header } from './Header'
import { TraceList } from '../traces/TraceList'
import { TraceDetail } from '../traces/TraceDetail'

export function AppShell() {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 shrink-0 border-r border-[var(--color-border)] overflow-hidden">
          <TraceList />
        </div>
        <div className="flex-1 overflow-hidden">
          <TraceDetail />
        </div>
      </div>
    </div>
  )
}
