'use client'

import { useEffect, useState, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import ChartContainer from '@/app/components/ui/ChartContainer'
import { useDashboard } from '@/app/providers'

export default function CpuChart() {
  const { selectedHost, timeRange } = useDashboard()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ hours: String(timeRange) })
    if (selectedHost) params.set('hostid', selectedHost)
    fetch('/api/metrics/cpu?' + params)
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
      data: ['cpu_usage', 'cpu_idle', 'cpu_sys', 'cpu_user', 'cpu_wait'],
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
      axisLabel: { color: '#666', fontSize: 10, formatter: '{value}%' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
    },
    series: [
      { name: 'cpu_usage', type: 'line', data: data.map(d => [d.ts, d.cpu_usage]), smooth: true, lineStyle: { color: '#00d4ff', width: 2 }, symbol: 'none' },
      { name: 'cpu_idle', type: 'line', data: data.map(d => [d.ts, d.cpu_idle]), smooth: true, lineStyle: { color: '#34d399', width: 1 }, symbol: 'none' },
      { name: 'cpu_sys', type: 'line', data: data.map(d => [d.ts, d.cpu_sys]), smooth: true, lineStyle: { color: '#fbbf24', width: 1 }, symbol: 'none' },
      { name: 'cpu_user', type: 'line', data: data.map(d => [d.ts, d.cpu_user]), smooth: true, lineStyle: { color: '#38bdf8', width: 1 }, symbol: 'none' },
      { name: 'cpu_wait', type: 'line', data: data.map(d => [d.ts, d.cpu_wait]), smooth: true, lineStyle: { color: '#f87171', width: 1 }, symbol: 'none' },
    ],
  }

  return (
    <ChartContainer title="CPU 使用率 (%)" loading={loading} error={error} empty={!data.length} onRetry={fetchData}>
      <ReactECharts option={option} style={{ height: '100%' }} theme="dark" />
    </ChartContainer>
  )
}
