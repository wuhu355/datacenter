'use client'

import { useEffect, useState, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import ChartContainer from '@/app/components/ui/ChartContainer'
import { useDashboard } from '@/app/providers'

export default function NetworkChart() {
  const { selectedHost, timeRange } = useDashboard()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ hours: String(timeRange) })
    if (selectedHost) params.set('hostid', selectedHost)
    fetch('/api/metrics/network?' + params)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError('加载失败'); setLoading(false) })
  }, [selectedHost, timeRange])

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 30_000)
    return () => clearInterval(t)
  }, [fetchData])

  const mods = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'ts') : []
  const colors = ['#60a5fa', '#c084fc', '#34d399', '#fbbf24']

  const option = {
    tooltip: { trigger: 'axis' as const },
    legend: {
      data: mods,
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
      axisLabel: { color: '#666', fontSize: 10, formatter: '{value} MB/s' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
    },
    series: mods.map((mod, i) => ({
      name: mod,
      type: 'line',
      data: data.map(d => [d.ts, d[mod]]),
      smooth: true,
      lineStyle: { color: colors[i % colors.length], width: 1.5 },
      symbol: 'none',
    })),
  }

  return (
    <ChartContainer title="网络流量 (MB/s)" loading={loading} error={error} empty={!data.length} onRetry={fetchData}>
      <ReactECharts option={option} style={{ height: '100%' }} theme="dark" />
    </ChartContainer>
  )
}
