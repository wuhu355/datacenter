'use client'

import { useEffect, useState, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import ChartContainer from '@/app/components/ui/ChartContainer'
import { useDashboard } from '@/app/providers'

const LOAD_COLORS: Record<string, string> = { load1: '#c084fc', load5: '#818cf8', load15: '#6366f1' }

export default function LoadChart() {
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
    const t = setInterval(fetchData, 30_000)
    return () => clearInterval(t)
  }, [fetchData])

  const option = {
    tooltip: { trigger: 'axis' as const },
    legend: {
      data: ['load1', 'load5', 'load15'],
      bottom: 0,
      textStyle: { color: '#999', fontSize: 10 },
    },
    grid: { top: 10, right: 10, bottom: 30, left: 40 },
    xAxis: {
      type: 'time' as const,
      axisLabel: { color: '#666', fontSize: 10, formatter: '{HH}:{mm}' },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { color: '#666', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
    },
    series: ['load1', 'load5', 'load15'].map(name => ({
      name,
      type: 'line',
      data: data.map(d => [d.ts, d[name]]),
      smooth: true,
      lineStyle: { color: LOAD_COLORS[name], width: 2 },
      symbol: 'none',
    })),
  }

  return (
    <ChartContainer title="系统负载" loading={loading} error={error} empty={!data.length} onRetry={fetchData}>
      <ReactECharts option={option} style={{ height: '100%' }} theme="dark" />
    </ChartContainer>
  )
}
