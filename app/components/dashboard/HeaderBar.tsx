'use client'

import { useEffect, useState } from 'react'
import StatCard from '@/app/components/ui/StatCard'
import type { OverviewData } from '@/lib/types'

export default function HeaderBar() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [clock, setClock] = useState('')

  useEffect(() => {
    const fetchOverview = () => {
      fetch('/api/overview')
        .then(r => r.json())
        .then(setData)
        .catch(() => {})
    }
    fetchOverview()
    const t = setInterval(fetchOverview, 30_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(now.toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }))
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  const loading = data === null

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      {/* Title + Clock */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-white whitespace-nowrap">
          🖥 数据中心监控大屏
        </h1>
        <span className="text-sm text-gray-400 tabular-nums">{clock}</span>
      </div>

      {/* KPI Cards */}
      <div className="flex gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
        <StatCard label="主机数" value={data?.hostCount ?? '-'} unit="台" color="#00d4ff" loading={loading} />
        <StatCard label="CPU 均值" value={data?.cpuAvg ?? '-'} unit="%" color="#38bdf8" loading={loading} />
        <StatCard label="内存已用" value={data?.memUsedAvg ?? '-'} unit="MB" color="#34d399" loading={loading} />
        <StatCard label="负载 1min" value={data?.load1Avg ?? '-'} color="#c084fc" loading={loading} />
      </div>
    </header>
  )
}
