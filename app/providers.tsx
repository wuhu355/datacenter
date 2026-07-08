'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface DashboardState {
  selectedHost: string | null
  setSelectedHost: (hostid: string | null) => void
  timeRange: number // hours
  setTimeRange: (hours: number) => void
}

const DashboardContext = createContext<DashboardState>({
  selectedHost: null,
  setSelectedHost: () => {},
  timeRange: 24,
  setTimeRange: () => {},
})

export function useDashboard() {
  return useContext(DashboardContext)
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [selectedHost, setSelectedHost] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState(24)

  return (
    <DashboardContext.Provider value={{ selectedHost, setSelectedHost, timeRange, setTimeRange }}>
      {children}
    </DashboardContext.Provider>
  )
}
