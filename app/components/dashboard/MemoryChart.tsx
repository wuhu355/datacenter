'use client'

import { useEffect, useState, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import ChartContainer from '@/app/components/ui/ChartContainer'
import { useDashboard } from '@/app/providers'

const COLORS: Record<string, string> = {
  mem_used: '#34d399', mem_total: '#64748b', mem_free: '#60a5fa',
  mem_buff: '#fbbf24', mem_cache: '#a78bfa', mem_swap: '#f472b6',
}

export default function MemoryChart() {
  const { selectedHost, timeRange } = useDashboard()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ hours: String(timeRange) })
    if (selectedHost) params.set('hostid', selectedHost)
    fetch('/api/metrics/memory?' + params)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError('加载失败'); setLoading(false) })
  }, [selectedHost, timeRange])

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 30_000)
    return () => clearInterval(t)
  }, [fetchData])

  // Dynamically discover memory module names from API response, like NetworkChart
  const availableMods: string[] = data.length > 0
    ? Object.keys(data[0]).filter(k => k !== 'ts')
    : []

  const option = {
    tooltip: { trigger: 'axis' as const },
    legend: {
      data: availableMods,
      bottom: 0,
      textStyle: { color: '#999', fontSize: 10 },
    },
    grid: { top: 10, right: 10, bottom: 30, left: 45 },
    xAxis: {
      type: 'time' as const,
      axisLabel: { color: '#666', fontSize: 10, formatter: '{HH}:{mm}' },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { color: '#666', fontSize: 10, formatter: '{value} MB' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
    },
    series: availableMods.map(mod => ({
      name: mod,
      type: 'line',
      data: data.map(d => [d.ts, d[mod]]),
      smooth: true,
      lineStyle: { color: COLORS[mod] || '#999', width: 1.5 },
      symbol: 'none',
      areaStyle: mod === 'mem_used' ? { color: 'rgba(52,211,153,0.1)' } : undefined,
    })),
  }

  return (
    <ChartContainer title="内存使用 (MB)" loading={loading} error={error} empty={!data.length} onRetry={fetchData}>
      <ReactECharts option={option} style={{ height: '100%' }} theme="dark" />
    </ChartContainer>
  )
}
