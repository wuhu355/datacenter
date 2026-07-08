import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getCached } from '@/lib/cache'
import type { HostInfo } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search') || ''
    const cacheKey = `hosts_${search}`

    const hosts = await getCached<HostInfo[]>(cacheKey, async () => {
      const pool = getPool()
      let sql = 'SELECT hostid, hostname, model, location1, location2 FROM host_detail'
      const params: string[] = []
      if (search) {
        sql += ' WHERE hostname LIKE ? OR hostid LIKE ?'
        params.push(`%${search}%`, `%${search}%`)
      }
      sql += ' ORDER BY hostid LIMIT 50'
      const [rows] = await pool.execute(sql, params)
      return rows as HostInfo[]
    })
    return NextResponse.json(hosts)
  } catch (error) {
    console.error('hosts API error:', error)
    return NextResponse.json([], { status: 500 })
  }
}
