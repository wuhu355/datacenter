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
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <HeaderBar />

        {/* Main grid: PC 5 zones, Mobile single column */}
        <main className="flex-1 grid gap-3 p-3
          grid-cols-1
          lg:grid-cols-[220px_1fr_280px]
          lg:grid-rows-[1fr_1fr_1fr_250px]">

          {/* Left: Host list - PC sidebar, Mobile top */}
          <div className="hidden lg:block lg:row-span-4 min-h-0">
            <HostList />
          </div>

          {/* Mobile host selector */}
          <div className="lg:hidden">
            <HostList />
          </div>

          {/* Center: CPU */}
          <div className="min-h-[300px] lg:min-h-0">
            <CpuChart />
          </div>

          {/* Center: Memory */}
          <div className="min-h-[300px] lg:min-h-0">
            <MemoryChart />
          </div>

          {/* Center: Load */}
          <div className="min-h-[300px] lg:min-h-0">
            <LoadChart />
          </div>

          {/* Right: Disk panel */}
          <div className="lg:row-span-3 min-h-[400px] lg:min-h-0">
            <DiskPanel />
          </div>

          {/* Bottom: Network + Process */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[250px]">
            <NetworkChart />
            <ProcessChart />
          </div>
        </main>
      </div>
    </DashboardProvider>
  )
}
