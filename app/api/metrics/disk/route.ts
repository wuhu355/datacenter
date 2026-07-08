import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getCached } from '@/lib/cache'
import type { MetricPoint } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const hostid = request.nextUrl.searchParams.get('hostid') || ''
    const hours = Number(request.nextUrl.searchParams.get('hours')) || 24
    const cacheKey = `disk_${hostid}_${hours}`

    const data = await getCached<MetricPoint[]>(cacheKey, async () => {
      const pool = getPool()

      // Use actual max timestamp from DB instead of Date.now()
      const [maxRows] = await pool.execute(
        `SELECT MAX(ts) AS maxTs FROM disk_tsar`
      ) as any
      const maxTs: number | null = maxRows[0]?.maxTs ?? null
      if (maxTs == null) return []

      const since = maxTs - hours * 3600_000
      const hostFilter = hostid ? 'AND hostid = ?' : ''
      const params: (string | number)[] = [since]
      if (hostid) params.push(hostid)

      const [rows] = await pool.execute(
        `SELECT ts, \`mod\`, value, tag
         FROM disk_tsar
         WHERE ts >= ? ${hostFilter}
         ORDER BY ts ASC`,
        params
      ) as any

      return rows.map((r: any) => ({
        ts: r.ts,
        mod: r.mod,
        value: Number(r.value),
        tag: r.tag,
      }))
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error('disk API error:', error)
    return NextResponse.json([], { status: 500 })
  }
}
