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

        {/* Main grid: PC 5 zones, Mobile single column */}
        <main className="flex-1 grid gap-3 p-3 overflow-hidden
          grid-cols-1
          lg:grid-cols-[220px_1fr_280px]
          lg:grid-rows-[1fr_180px]">

          {/* Left: Host list - PC sidebar, Mobile hidden by default */}
          <div className="hidden lg:block lg:row-span-2 overflow-hidden">
            <HostList />
          </div>

          {/* Mobile host selector */}
          <div className="lg:hidden">
            <HostList />
          </div>

          {/* Center: CPU + Memory + Load */}
          <div className="grid grid-rows-3 gap-3 overflow-hidden">
            <CpuChart />
            <MemoryChart />
            <LoadChart />
          </div>

          {/* Right: Disk panel */}
          <div className="lg:row-span-2 overflow-hidden">
            <DiskPanel />
          </div>

          {/* Bottom: Network + Process */}
          <div className="grid grid-cols-2 gap-3 overflow-hidden">
            <NetworkChart />
            <ProcessChart />
          </div>
        </main>
      </div>
    </DashboardProvider>
  )
}
