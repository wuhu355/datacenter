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
            {/* Row 1: CPU + Disk side by side */}
            <div className="grid grid-cols-[1fr_280px] gap-3 min-h-[380px]">
              <CpuChart />
              <DiskPanel />
            </div>

            {/* Row 2: Memory */}
            <div className="min-h-[350px]">
              <MemoryChart />
            </div>

            {/* Row 3: Load */}
            <div className="min-h-[300px]">
              <LoadChart />
            </div>

            {/* Row 4: Network + Process */}
            <div className="grid grid-cols-2 gap-3 min-h-[280px]">
              <NetworkChart />
              <ProcessChart />
            </div>
          </div>

          {/* Mobile: all charts stacked */}
          <div className="lg:hidden flex flex-col gap-3 w-full">
            <div className="min-h-[300px]"><CpuChart /></div>
            <div className="min-h-[300px]"><MemoryChart /></div>
            <div className="min-h-[300px]"><LoadChart /></div>
            <div className="min-h-[380px]"><DiskPanel /></div>
            <div className="grid grid-cols-1 gap-3 min-h-[250px]">
              <NetworkChart />
              <ProcessChart />
            </div>
          </div>
        </main>
      </div>
    </DashboardProvider>
  )
}
