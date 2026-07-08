import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getCached } from '@/lib/cache'
import type { OverviewData } from '@/lib/types'

export async function GET() {
  try {
    const data = await getCached<OverviewData>('overview', async () => {
      const pool = getPool()

      // Use the latest data timestamp as reference instead of NOW()
      // because the data is historic (July 1-7, 2026)
      const [[{ maxTs }]] = await pool.execute(
        'SELECT MAX(ts) AS maxTs FROM pref_tsar WHERE tag = ?',
        ['cpu_percent']
      ) as any

      const oneHourAgo = (maxTs as number) - 3600000

      const [[{ hostCount }]] = await pool.execute(
        'SELECT COUNT(*) AS hostCount FROM host_detail'
      ) as any
      const [[{ cpuAvg }]] = await pool.execute(
        `SELECT ROUND(AVG(value), 1) AS cpuAvg
         FROM pref_tsar WHERE tag = 'cpu_percent' AND mod = 'cpu_usage'
         AND ts >= ?`,
        [oneHourAgo]
      ) as any
      const [[{ memAvg }]] = await pool.execute(
        `SELECT ROUND(AVG(value), 1) AS memAvg
         FROM pref_tsar WHERE tag = 'mem_metric' AND mod = 'mem_used'
         AND ts >= ?`,
        [oneHourAgo]
      ) as any
      const [[{ loadAvg }]] = await pool.execute(
        `SELECT ROUND(AVG(value), 2) AS loadAvg
         FROM pref_tsar WHERE tag = 'load_average' AND mod = 'load1'
         AND ts >= ?`,
        [oneHourAgo]
      ) as any
      return {
        hostCount: hostCount as number,
        cpuAvg: (cpuAvg as number) || 0,
        memUsedAvg: (memAvg as number) || 0,
        load1Avg: (loadAvg as number) || 0,
      }
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error('overview API error:', error)
    return NextResponse.json(
      { hostCount: 0, cpuAvg: 0, memUsedAvg: 0, load1Avg: 0 },
      { status: 500 }
    )
  }
}
