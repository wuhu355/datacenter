'use client'

import { useEffect, useState, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import ChartContainer from '@/app/components/ui/ChartContainer'
import { useDashboard } from '@/app/providers'

export default function DiskPanel() {
  const { selectedHost, timeRange } = useDashboard()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ hours: String(timeRange) })
    if (selectedHost) params.set('hostid', selectedHost)
    fetch('/api/metrics/disk?' + params)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError('加载失败'); setLoading(false) })
  }, [selectedHost, timeRange])

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 30_000)
    return () => clearInterval(t)
  }, [fetchData])

  // Group by tag
  const byTag: Record<string, any[]> = {}
  for (const d of data) {
    if (!byTag[d.tag]) byTag[d.tag] = []
    byTag[d.tag].push([d.ts, d.value])
  }

  const latencyOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 5, right: 5, bottom: 20, left: 45 },
    xAxis: { type: 'time' as const, axisLabel: { color: '#666', fontSize: 9, formatter: '{HH}:{mm}' } },
    yAxis: { type: 'value' as const, axisLabel: { color: '#666', fontSize: 9, formatter: '{value}ms' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
    series: [{
      name: '延迟', type: 'line',
      data: (byTag['disk_latency_ms'] || []).slice(-200),
      smooth: true, lineStyle: { color: '#fb923c', width: 1.5 }, symbol: 'none',
      areaStyle: { color: 'rgba(251,146,60,0.08)' },
    }],
  }

  const utilOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 5, right: 5, bottom: 20, left: 45 },
    xAxis: { type: 'time' as const, axisLabel: { color: '#666', fontSize: 9, formatter: '{HH}:{mm}' } },
    yAxis: { type: 'value' as const, axisLabel: { color: '#666', fontSize: 9, formatter: '{value}%' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
    series: [{
      name: '利用率', type: 'line',
      data: (byTag['disk_util_percent'] || []).slice(-200),
      smooth: true, lineStyle: { color: '#fbbf24', width: 1.5 }, symbol: 'none',
    }],
  }

  const rwOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 5, right: 5, bottom: 20, left: 50 },
    xAxis: { type: 'time' as const, axisLabel: { color: '#666', fontSize: 9, formatter: '{HH}:{mm}' } },
    yAxis: { type: 'value' as const, axisLabel: { color: '#666', fontSize: 9 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
    series: [{
      name: '读写', type: 'line',
      data: (byTag['disk_rw_sectors'] || []).slice(-200),
      smooth: true, lineStyle: { color: '#f87171', width: 1.5 }, symbol: 'none',
    }],
  }

  return (
    <ChartContainer title="磁盘监控" loading={loading} error={error} empty={!data.length} onRetry={fetchData} className="flex flex-col gap-2">
      <div style={{ height: '30%' }}>
        <ReactECharts option={latencyOption} style={{ height: '100%' }} theme="dark" />
      </div>
      <div style={{ height: '30%' }}>
        <ReactECharts option={utilOption} style={{ height: '100%' }} theme="dark" />
      </div>
      <div style={{ height: '30%' }}>
        <ReactECharts option={rwOption} style={{ height: '100%' }} theme="dark" />
      </div>
    </ChartContainer>
  )
}
