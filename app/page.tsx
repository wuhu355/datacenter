'use client'

import { DashboardProvider } from './providers'
import HeaderBar from './components/dashboard/HeaderBar'
import HostList from './components/dashboard/HostList'
import CpuChart from './components/dashboard/CpuChart'
import MemoryChart from './components/dashboard/MemoryChart'
import LoadChart from './components/dashboard/LoadChart'
import DiskPanel from './components/dashboard/DiskPanel'
import NetworkChart from './components/dashboard/NetworkChart'
import ProcessChart from './components/dashboard/ProcessChart'

export default function Home() {
  return (
    <DashboardProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <HeaderBar />

        {/* Main layout: Left sidebar + scrollable right content */}
        <main className="flex-1 flex flex-col lg:flex-row gap-3 p-3 min-h-0 lg:overflow-hidden overflow-y-auto">

          {/* Left: Host list — own scroll, hidden on mobile */}
          <aside className="hidden lg:flex lg:w-[220px] shrink-0">
            <HostList />
          </aside>

          {/* Mobile host selector */}
          <div className="lg:hidden w-full">
            <HostList />
          </div>

          {/* Right: scrollable chart area */}
          <div className="hidden lg:flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
            {/* Upper: Center charts + Right disk panel */}
            <div className="grid gap-3"
              style={{
                gridTemplateColumns: '1fr 280px',
                gridTemplateRows: 'minmax(380px,auto) minmax(350px,auto) minmax(300px,auto)',
              }}>
              {/* Center Col 1, Row 1: CPU */}
              <div className="flex flex-col" style={{ gridColumn: '1', gridRow: '1' }}><CpuChart /></div>
              {/* Center Col 1, Row 2: Memory */}
              <div className="flex flex-col" style={{ gridColumn: '1', gridRow: '2' }}><MemoryChart /></div>
              {/* Center Col 1, Row 3: Load */}
              <div className="flex flex-col" style={{ gridColumn: '1', gridRow: '3' }}><LoadChart /></div>
              {/* Right Col 2, Row 1-3: Disk panel */}
              <div className="flex flex-col" style={{ gridColumn: '2', gridRow: '1 / 4' }}><DiskPanel /></div>
            </div>

            {/* Bottom: Network + Process */}
            <div className="grid grid-cols-2 gap-3 min-h-[280px]">
              <div className="flex flex-col"><NetworkChart /></div>
              <div className="flex flex-col"><ProcessChart /></div>
            </div>
          </div>

          {/* Mobile: all charts stacked */}
          <div className="lg:hidden flex flex-col gap-3 w-full">
            <div className="flex flex-col min-h-[300px]"><CpuChart /></div>
            <div className="flex flex-col min-h-[300px]"><MemoryChart /></div>
            <div className="flex flex-col min-h-[300px]"><LoadChart /></div>
            <div className="flex flex-col min-h-[380px]"><DiskPanel /></div>
            <div className="grid grid-cols-1 gap-3 min-h-[250px]">
              <div className="flex flex-col"><NetworkChart /></div>
              <div className="flex flex-col"><ProcessChart /></div>
            </div>
          </div>
        </main>
      </div>
    </DashboardProvider>
  )
}
