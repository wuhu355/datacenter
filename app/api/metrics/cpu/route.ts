import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getCached } from '@/lib/cache'
import type { MetricPoint } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const hostid = request.nextUrl.searchParams.get('hostid') || ''
    const hours = Number(request.nextUrl.searchParams.get('hours')) || 24
    const cacheKey = `cpu_${hostid}_${hours}`

    const data = await getCached<MetricPoint[]>(cacheKey, async () => {
      const pool = getPool()

      // Use actual max timestamp from DB instead of Date.now()
      const [maxRows] = await pool.execute(
        `SELECT MAX(ts) AS maxTs FROM pref_tsar WHERE tag = ?`,
        ['cpu_percent']
      ) as any
      const maxTs: number | null = maxRows[0]?.maxTs ?? null
      if (maxTs == null) return []

      const since = maxTs - hours * 3600_000
      const hostFilter = hostid ? 'AND p.hostid = ?' : ''
      const params: (string | number)[] = [since]
      if (hostid) params.push(hostid)

      const [rows] = await pool.execute(
        `SELECT p.ts, p.mod, p.value
         FROM pref_tsar p
         WHERE p.tag = 'cpu_percent' AND p.ts >= ? ${hostFilter}
         ORDER BY p.ts ASC, p.mod`,
        params
      ) as any

      // Pivot: rows -> {ts, cpu_usage, cpu_idle, cpu_sys, cpu_user, cpu_wait}
      const map = new Map<number, any>()
      for (const r of rows) {
        if (!map.has(r.ts)) map.set(r.ts, { ts: r.ts })
        map.get(r.ts)[r.mod] = Number(r.value)
      }
      return Array.from(map.values()).sort((a, b) => a.ts - b.ts)
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error('cpu API error:', error)
    return NextResponse.json([], { status: 500 })
  }
}
