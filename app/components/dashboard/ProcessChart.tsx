'use client'

import { useEffect, useState, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import ChartContainer from '@/app/components/ui/ChartContainer'
import { useDashboard } from '@/app/providers'

export default function ProcessChart() {
  const { selectedHost, timeRange } = useDashboard()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ hours: String(timeRange) })
    if (selectedHost) params.set('hostid', selectedHost)
    fetch('/api/metrics/load?' + params)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError('加载失败'); setLoading(false) })
  }, [selectedHost, timeRange])

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 60_000)
    return () => clearInterval(t)
  }, [fetchData])

  const option = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 10, right: 10, bottom: 20, left: 45 },
    xAxis: {
      type: 'time' as const,
      axisLabel: { color: '#666', fontSize: 10, formatter: '{HH}:{mm}' },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { color: '#666', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
    },
    series: [{
      name: '进程数', type: 'line',
      data: data.map(d => [d.ts, d.proc_total || 0]),
      smooth: true,
      lineStyle: { color: '#a78bfa', width: 2 },
      symbol: 'none',
      areaStyle: { color: 'rgba(167,139,250,0.1)' },
    }],
  }

  return (
    <ChartContainer title="进程总数" loading={loading} error={error} empty={!data.length} onRetry={fetchData}>
      <ReactECharts option={option} style={{ height: '100%' }} theme="dark" />
    </ChartContainer>
  )
}
