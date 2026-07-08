# Monitoring Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dark-themed ops monitoring dashboard showing CPU, memory, load, disk, network, and process metrics from 20 hosts over 7 days.

**Architecture:** Next.js 14 App Router full-stack — Server Components for SSR, API Routes with mysql2 pool for data, client components with ECharts 5 for interactive charts, React Context for host/time-range selection, Tailwind responsive grid for PC/mobile layouts.

**Tech Stack:** Next.js 14, TypeScript 5, ECharts 5.5, Tailwind CSS 3.4, mysql2 3.x

## Global Constraints

- DB password via `DB_PASSWORD` env var, never hardcoded
- MySQL 8.0 at `localhost:3306`, user `root`, database `monitor`
- Connection pool limit: 10
- Server memory cache TTL: 10s
- PC refresh: 30s, Mobile refresh: 60s
- Dark theme bg: `#0a0e27`, accent: `#00d4ff`
- All API routes GET, return JSON, accept `?hostid=&hours=24`
- Each chart component fetches own data independently with loading/error states

---

## File Structure

```
datacenter/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── .env.local                 # DB_PASSWORD=123456 (gitignored)
├── lib/
│   ├── db.ts                  # mysql2 pool singleton
│   ├── cache.ts               # Map-based TTL cache
│   └── types.ts               # TypeScript interfaces
├── app/
│   ├── layout.tsx             # Root layout + metadata
│   ├── page.tsx               # Dashboard page (5-zone grid)
│   ├── globals.css            # Tailwind directives + dark theme
│   ├── providers.tsx          # SelectedHost + TimeRange contexts
│   ├── api/
│   │   ├── overview/route.ts
│   │   ├── hosts/route.ts
│   │   └── metrics/
│   │       ├── cpu/route.ts
│   │       ├── memory/route.ts
│   │       ├── load/route.ts
│   │       ├── disk/route.ts
│   │       └── network/route.ts
│   └── components/
│       ├── dashboard/
│       │   ├── HeaderBar.tsx
│       │   ├── HostList.tsx
│       │   ├── CpuChart.tsx
│       │   ├── MemoryChart.tsx
│       │   ├── LoadChart.tsx
│       │   ├── DiskPanel.tsx
│       │   ├── NetworkChart.tsx
│       │   └── ProcessChart.tsx
│       └── ui/
│           ├── StatCard.tsx
│           └── ChartContainer.tsx
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.js`, `.env.local`
- Run: `npm install`

**Interfaces:**
- Produces: Runnable Next.js 14 dev server on port 3000

- [ ] **Step 1: Create package.json**

```json
{
  "name": "datacenter",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "mysql2": "^3.11.0",
    "echarts": "^5.5.1",
    "echarts-for-react": "^3.0.2"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.5.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dashboard: {
          bg: '#0a0e27',
          card: 'rgba(16, 20, 50, 0.8)',
          border: 'rgba(0, 212, 255, 0.15)',
          accent: '#00d4ff',
          purple: '#7c3aed',
        },
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 4: Create next.config.js**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {}
module.exports = nextConfig
```

- [ ] **Step 5: Create postcss.config.js**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: Create .env.local**

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=monitor
```

- [ ] **Step 7: Install dependencies**

```bash
npm install
```

- [ ] **Step 8: Verify**

```bash
npm run dev
```

Expected: Next.js starts on http://localhost:3000, shows 404 page (no routes yet).

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.json tailwind.config.ts postcss.config.js next.config.js
git commit -m "feat: scaffold Next.js 14 project with Tailwind and dependencies

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Database Layer — Types, Connection Pool, Cache

**Files:**
- Create: `lib/types.ts`, `lib/db.ts`, `lib/cache.ts`

**Interfaces:**
- Consumes: `DB_*` env vars from `.env.local`
- Produces:
  - `HostDetail`, `ModDetail`, `TsarRecord`, `OverviewData`, `HostInfo`, `MetricPoint` types
  - `getPool(): Pool` — mysql2 connection pool singleton
  - `getCached(key, fetcher): Promise<T>` — TTL cache

- [ ] **Step 1: Create lib/types.ts**

```typescript
// Host detail table row
export interface HostDetail {
  hostid: string
  hostname: string
  owner: string
  model: string
  location1: string
  location2: string
}

// Module definition row
export interface ModDetail {
  mod: string
  type: 'pref' | 'disk'
  desc: string
  unit: string
  tag: string
}

// Time-series record (pref_tsar / disk_tsar)
export interface TsarRecord {
  ts: number
  hostid: string
  type: string
  mod: string
  value: number
  tag: string
}

// /api/overview response
export interface OverviewData {
  hostCount: number
  cpuAvg: number
  memUsedAvg: number
  load1Avg: number
}

// /api/hosts response item
export interface HostInfo {
  hostid: string
  hostname: string
  model: string
  location1: string
  location2: string
}

// Single metric data point
export interface MetricPoint {
  ts: number
  [key: string]: number
}
```

- [ ] **Step 2: Create lib/db.ts**

```typescript
import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

export function getPool(): mysql.Pool {
  if (pool) return pool
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'monitor',
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
  })
  return pool
}
```

- [ ] **Step 3: Create lib/cache.ts**

```typescript
const store = new Map<string, { data: unknown; expiry: number }>()
const DEFAULT_TTL = 10_000 // 10 seconds

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  const cached = store.get(key)
  if (cached && cached.expiry > Date.now()) {
    return cached.data as T
  }
  const data = await fetcher()
  store.set(key, { data, expiry: Date.now() + ttl })
  return data
}

export function clearCache(): void {
  store.clear()
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add lib/
git commit -m "feat: add database types, mysql2 pool, and TTL cache

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: API Routes — Overview + Hosts

**Files:**
- Create: `app/api/overview/route.ts`, `app/api/hosts/route.ts`

**Interfaces:**
- Consumes: `getPool()` from `lib/db.ts`, `getCached()` from `lib/cache.ts`
- Produces: `GET /api/overview -> OverviewData JSON`, `GET /api/hosts?search= -> HostInfo[] JSON`

- [ ] **Step 1: Create app/api/overview/route.ts**

```typescript
import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getCached } from '@/lib/cache'
import type { OverviewData } from '@/lib/types'

export async function GET() {
  try {
    const data = await getCached<OverviewData>('overview', async () => {
      const pool = getPool()
      const [[{ hostCount }]] = await pool.execute(
        'SELECT COUNT(*) AS hostCount FROM host_detail'
      ) as any
      const [[{ cpuAvg }]] = await pool.execute(
        `SELECT ROUND(AVG(value), 1) AS cpuAvg
         FROM pref_tsar WHERE tag = 'cpu_percent' AND mod = 'cpu_usage'
         AND ts >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 1 HOUR)) * 1000`
      ) as any
      const [[{ memAvg }]] = await pool.execute(
        `SELECT ROUND(AVG(value), 1) AS memAvg
         FROM pref_tsar WHERE tag = 'mem_metric' AND mod = 'mem_used'
         AND ts >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 1 HOUR)) * 1000`
      ) as any
      const [[{ loadAvg }]] = await pool.execute(
        `SELECT ROUND(AVG(value), 2) AS loadAvg
         FROM pref_tsar WHERE tag = 'load_average' AND mod = 'load1'
         AND ts >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 1 HOUR)) * 1000`
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
```

- [ ] **Step 2: Create app/api/hosts/route.ts**

```typescript
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
```

- [ ] **Step 3: Verify overview API**

```bash
Start dev server, then:
curl http://localhost:3000/api/overview
```

Expected: `{"hostCount":20,"cpuAvg":<number>,"memUsedAvg":<number>,"load1Avg":<number>}`

- [ ] **Step 4: Verify hosts API**

```bash
curl http://localhost:3000/api/hosts
curl "http://localhost:3000/api/hosts?search=server-001"
```

Expected: Array of 20 hosts, filtered by search term.

- [ ] **Step 5: Commit**

```bash
git add app/api/overview/ app/api/hosts/
git commit -m "feat: add overview and hosts API routes

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: API Routes — CPU, Memory, Load Metrics

**Files:**
- Create: `app/api/metrics/cpu/route.ts`, `app/api/metrics/memory/route.ts`, `app/api/metrics/load/route.ts`

**Interfaces:**
- Consumes: `getPool()`, `getCached()`, `MetricPoint` type
- Produces: Three GET endpoints returning `MetricPoint[]`

- [ ] **Step 1: Create app/api/metrics/cpu/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getCached } from '@/lib/cache'
import type { MetricPoint } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const hostid = request.nextUrl.searchParams.get('hostid') || ''
    const hours = Number(request.nextUrl.searchParams.get('hours')) || 24
    const since = Date.now() - hours * 3600_000
    const cacheKey = `cpu_${hostid}_${hours}`

    const data = await getCached<MetricPoint[]>(cacheKey, async () => {
      const pool = getPool()
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
```

- [ ] **Step 2: Create app/api/metrics/memory/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getCached } from '@/lib/cache'
import type { MetricPoint } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const hostid = request.nextUrl.searchParams.get('hostid') || ''
    const hours = Number(request.nextUrl.searchParams.get('hours')) || 24
    const since = Date.now() - hours * 3600_000
    const cacheKey = `mem_${hostid}_${hours}`

    const data = await getCached<MetricPoint[]>(cacheKey, async () => {
      const pool = getPool()
      const hostFilter = hostid ? 'AND p.hostid = ?' : ''
      const params: (string | number)[] = [since]
      if (hostid) params.push(hostid)

      const [rows] = await pool.execute(
        `SELECT p.ts, p.mod, p.value
         FROM pref_tsar p
         WHERE p.tag = 'mem_metric' AND p.ts >= ? ${hostFilter}
         ORDER BY p.ts ASC`,
        params
      ) as any

      const map = new Map<number, any>()
      for (const r of rows) {
        if (!map.has(r.ts)) map.set(r.ts, { ts: r.ts })
        map.get(r.ts)[r.mod] = Number(r.value)
      }
      return Array.from(map.values()).sort((a, b) => a.ts - b.ts)
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error('memory API error:', error)
    return NextResponse.json([], { status: 500 })
  }
}
```

- [ ] **Step 3: Create app/api/metrics/load/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getCached } from '@/lib/cache'
import type { MetricPoint } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const hostid = request.nextUrl.searchParams.get('hostid') || ''
    const hours = Number(request.nextUrl.searchParams.get('hours')) || 24
    const since = Date.now() - hours * 3600_000
    const cacheKey = `load_${hostid}_${hours}`

    const data = await getCached<MetricPoint[]>(cacheKey, async () => {
      const pool = getPool()
      const hostFilter = hostid ? 'AND p.hostid = ?' : ''
      const params: (string | number)[] = [since]
      if (hostid) params.push(hostid)

      const [rows] = await pool.execute(
        `SELECT p.ts, p.mod, p.value
         FROM pref_tsar p
         WHERE p.tag = 'load_average' AND p.ts >= ? ${hostFilter}
         ORDER BY p.ts ASC`,
        params
      ) as any

      const map = new Map<number, any>()
      for (const r of rows) {
        if (!map.has(r.ts)) map.set(r.ts, { ts: r.ts })
        map.get(r.ts)[r.mod] = Number(r.value)
      }
      return Array.from(map.values()).sort((a, b) => a.ts - b.ts)
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error('load API error:', error)
    return NextResponse.json([], { status: 500 })
  }
}
```

- [ ] **Step 4: Verify each endpoint**

```bash
curl "http://localhost:3000/api/metrics/cpu?hours=1"
curl "http://localhost:3000/api/metrics/cpu?hostid=host001&hours=6"
curl "http://localhost:3000/api/metrics/memory?hours=1"
curl "http://localhost:3000/api/metrics/load?hours=1"
```

Expected: Arrays of `{ts, cpu_usage, cpu_idle, ...}` / `{ts, mem_used, mem_total, ...}` / `{ts, load1, load5, load15}`

- [ ] **Step 5: Commit**

```bash
git add app/api/metrics/cpu/ app/api/metrics/memory/ app/api/metrics/load/
git commit -m "feat: add CPU, memory, and load metrics API routes

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: API Routes — Disk + Network Metrics

**Files:**
- Create: `app/api/metrics/disk/route.ts`, `app/api/metrics/network/route.ts`

**Interfaces:**
- Consumes: `getPool()`, `getCached()`
- Produces: `GET /api/metrics/disk -> MetricPoint[]`, `GET /api/metrics/network -> MetricPoint[]`

- [ ] **Step 1: Create app/api/metrics/disk/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getCached } from '@/lib/cache'
import type { MetricPoint } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const hostid = request.nextUrl.searchParams.get('hostid') || ''
    const hours = Number(request.nextUrl.searchParams.get('hours')) || 24
    const since = Date.now() - hours * 3600_000
    const cacheKey = `disk_${hostid}_${hours}`

    const data = await getCached<MetricPoint[]>(cacheKey, async () => {
      const pool = getPool()
      const hostFilter = hostid ? 'AND hostid = ?' : ''
      const params: (string | number)[] = [since]
      if (hostid) params.push(hostid)

      const [rows] = await pool.execute(
        `SELECT ts, mod, value, tag
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
```

- [ ] **Step 2: Create app/api/metrics/network/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getCached } from '@/lib/cache'
import type { MetricPoint } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const hostid = request.nextUrl.searchParams.get('hostid') || ''
    const hours = Number(request.nextUrl.searchParams.get('hours')) || 24
    const since = Date.now() - hours * 3600_000
    const cacheKey = `net_${hostid}_${hours}`

    const data = await getCached<MetricPoint[]>(cacheKey, async () => {
      const pool = getPool()
      const hostFilter = hostid ? 'AND hostid = ?' : ''
      const params: (string | number)[] = [since]
      if (hostid) params.push(hostid)

      const [rows] = await pool.execute(
        `SELECT ts, mod, value
         FROM pref_tsar
         WHERE tag = 'net_speed_mb' AND ts >= ? ${hostFilter}
         ORDER BY ts ASC`,
        params
      ) as any

      const map = new Map<number, any>()
      for (const r of rows) {
        if (!map.has(r.ts)) map.set(r.ts, { ts: r.ts })
        map.get(r.ts)[r.mod] = Number(r.value)
      }
      return Array.from(map.values()).sort((a, b) => a.ts - b.ts)
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error('network API error:', error)
    return NextResponse.json([], { status: 500 })
  }
}
```

- [ ] **Step 3: Verify endpoints**

```bash
curl "http://localhost:3000/api/metrics/disk?hours=1"
curl "http://localhost:3000/api/metrics/disk?hostid=host001&hours=6"
curl "http://localhost:3000/api/metrics/network?hours=1"
```

Expected: disk returns `[{ts, mod, value, tag}, ...]`, network returns `[{ts, net_recv, net_send, ...}, ...]`

- [ ] **Step 4: Commit**

```bash
git add app/api/metrics/disk/ app/api/metrics/network/
git commit -m "feat: add disk and network metrics API routes

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: Base UI Components + React Context

**Files:**
- Create: `app/components/ui/StatCard.tsx`, `app/components/ui/ChartContainer.tsx`, `app/providers.tsx`

**Interfaces:**
- Consumes: None (standalone UI)
- Produces:
  - `<StatCard label value unit color>` — KPI display card
  - `<ChartContainer loading error empty children>` — state wrapper
  - `<DashboardProvider>` — context for selectedHost + timeRange

- [ ] **Step 1: Create app/components/ui/StatCard.tsx**

```typescript
'use client'

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  color?: string
  loading?: boolean
}

export default function StatCard({ label, value, unit, color = '#00d4ff', loading }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-dashboard-border bg-dashboard-card p-4 backdrop-blur-sm">
      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 w-16 rounded bg-white/10" />
          <div className="h-8 w-24 rounded bg-white/10" />
        </div>
      ) : (
        <>
          <div className="text-xs text-gray-400 mb-1">{label}</div>
          <div className="flex items-baseline gap-1">
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color }}
            >
              {value}
            </span>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create app/components/ui/ChartContainer.tsx**

```typescript
'use client'

import { ReactNode } from 'react'

interface ChartContainerProps {
  title: string
  loading?: boolean
  error?: string | null
  empty?: boolean
  children: ReactNode
  onRetry?: () => void
  className?: string
}

export default function ChartContainer({
  title,
  loading,
  error,
  empty,
  children,
  onRetry,
  className = '',
}: ChartContainerProps) {
  return (
    <div className={`rounded-xl border border-dashboard-border bg-dashboard-card p-4 backdrop-blur-sm ${className}`}>
      <h3 className="text-sm font-medium text-gray-300 mb-3">{title}</h3>
      <div className="relative" style={{ height: 'calc(100% - 2rem)' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-dashboard-bg/50 z-10 rounded-lg">
            <div className="w-8 h-8 border-2 border-dashboard-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-dashboard-bg/50 z-10 rounded-lg">
            <span className="text-red-400 text-sm">{error}</span>
            {onRetry && (
              <button onClick={onRetry} className="px-3 py-1 text-xs rounded bg-dashboard-accent/20 text-dashboard-accent hover:bg-dashboard-accent/30">
                重试
              </button>
            )}
          </div>
        )}
        {empty && !loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
            暂无数据
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create app/providers.tsx**

```typescript
'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface DashboardState {
  selectedHost: string | null
  setSelectedHost: (hostid: string | null) => void
  timeRange: number // hours
  setTimeRange: (hours: number) => void
}

const DashboardContext = createContext<DashboardState>({
  selectedHost: null,
  setSelectedHost: () => {},
  timeRange: 24,
  setTimeRange: () => {},
})

export function useDashboard() {
  return useContext(DashboardContext)
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [selectedHost, setSelectedHost] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState(24)

  return (
    <DashboardContext.Provider value={{ selectedHost, setSelectedHost, timeRange, setTimeRange }}>
      {children}
    </DashboardContext.Provider>
  )
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add app/components/ui/ app/providers.tsx
git commit -m "feat: add StatCard, ChartContainer, and DashboardContext

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: HeaderBar + HostList Components

**Files:**
- Create: `app/components/dashboard/HeaderBar.tsx`, `app/components/dashboard/HostList.tsx`

**Interfaces:**
- Consumes: `StatCard` from Task 6, `/api/overview`, `/api/hosts`, `useDashboard()` context
- Produces: `<HeaderBar />`, `<HostList />`

- [ ] **Step 1: Create app/components/dashboard/HeaderBar.tsx**

```typescript
'use client'

import { useEffect, useState } from 'react'
import StatCard from '@/app/components/ui/StatCard'
import type { OverviewData } from '@/lib/types'

export default function HeaderBar() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [clock, setClock] = useState('')

  useEffect(() => {
    const fetchOverview = () => {
      fetch('/api/overview')
        .then(r => r.json())
        .then(setData)
        .catch(() => {})
    }
    fetchOverview()
    const t = setInterval(fetchOverview, 30_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(now.toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }))
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  const loading = data === null

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      {/* Title + Clock */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-white whitespace-nowrap">
          🖥 数据中心监控大屏
        </h1>
        <span className="text-sm text-gray-400 tabular-nums">{clock}</span>
      </div>

      {/* KPI Cards */}
      <div className="flex gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
        <StatCard label="主机数" value={data?.hostCount ?? '-'} unit="台" color="#00d4ff" loading={loading} />
        <StatCard label="CPU 均值" value={data?.cpuAvg ?? '-'} unit="%" color="#38bdf8" loading={loading} />
        <StatCard label="内存已用" value={data?.memUsedAvg ?? '-'} unit="MB" color="#34d399" loading={loading} />
        <StatCard label="负载 1min" value={data?.load1Avg ?? '-'} color="#c084fc" loading={loading} />
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Create app/components/dashboard/HostList.tsx**

```typescript
'use client'

import { useEffect, useState, useMemo } from 'react'
import { useDashboard } from '@/app/providers'
import type { HostInfo } from '@/lib/types'

export default function HostList() {
  const { selectedHost, setSelectedHost } = useDashboard()
  const [hosts, setHosts] = useState<HostInfo[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    fetch(`/api/hosts?${params}`)
      .then(r => r.json())
      .then(data => { setHosts(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [search])

  const filteredHosts = useMemo(() => hosts, [hosts])

  return (
    <div className="flex flex-col h-full rounded-xl border border-dashboard-border bg-dashboard-card backdrop-blur-sm">
      <div className="p-3 border-b border-dashboard-border">
        <h3 className="text-sm font-medium text-gray-300 mb-2">主机列表</h3>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索主机..."
          className="w-full px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-dashboard-border text-gray-200 placeholder-gray-600 focus:outline-none focus:border-dashboard-accent/50"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 rounded bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* "All hosts" option */}
            <button
              onClick={() => setSelectedHost(null)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                selectedHost === null
                  ? 'bg-dashboard-accent/10 text-dashboard-accent border-l-2 border-dashboard-accent'
                  : 'text-gray-400 hover:bg-white/5 border-l-2 border-transparent'
              }`}
            >
              🌐 全部主机 ({hosts.length})
            </button>
            {filteredHosts.map(host => (
              <button
                key={host.hostid}
                onClick={() => setSelectedHost(host.hostid)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  selectedHost === host.hostid
                    ? 'bg-dashboard-accent/10 text-dashboard-accent border-l-2 border-dashboard-accent'
                    : 'text-gray-400 hover:bg-white/5 border-l-2 border-transparent'
                }`}
              >
                <div className="truncate">{host.hostname}</div>
                <div className="text-xs text-gray-600">{host.location1} / {host.location2}</div>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/components/dashboard/HeaderBar.tsx app/components/dashboard/HostList.tsx
git commit -m "feat: add HeaderBar with live clock and KPI cards, HostList with search

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---


### Task 8: Chart Components — CPU, Memory, Load

**Files:**
- Create: `app/components/dashboard/CpuChart.tsx`, `MemoryChart.tsx`, `LoadChart.tsx`

**Interfaces:**
- Consumes: `ChartContainer`, `useDashboard()`, `/api/metrics/cpu|memory|load`
- Produces: Three ECharts line/area chart components

- [ ] **Step 1: Create app/components/dashboard/CpuChart.tsx**

```typescript
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
```

- [ ] **Step 2: Create app/components/dashboard/MemoryChart.tsx**

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import ChartContainer from '@/app/components/ui/ChartContainer'
import { useDashboard } from '@/app/providers'

const MEM_MODS = ['mem_used', 'mem_total', 'mem_free', 'mem_buff', 'mem_cache']
const COLORS: Record<string, string> = {
  mem_used: '#34d399', mem_total: '#64748b', mem_free: '#60a5fa',
  mem_buff: '#fbbf24', mem_cache: '#a78bfa',
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

  const availableMods = MEM_MODS.filter(m => data.length > 0 && data[0][m] !== undefined)

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
```

- [ ] **Step 3: Create app/components/dashboard/LoadChart.tsx**

```typescript
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
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add app/components/dashboard/CpuChart.tsx app/components/dashboard/MemoryChart.tsx app/components/dashboard/LoadChart.tsx
git commit -m "feat: add CPU, memory, load ECharts components with auto-refresh

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 9: Chart Components — DiskPanel, Network, Process

**Files:**
- Create: `app/components/dashboard/DiskPanel.tsx`, `NetworkChart.tsx`, `ProcessChart.tsx`

**Interfaces:**
- Consumes: `ChartContainer`, `useDashboard()`, `/api/metrics/disk|network`, `/api/metrics/load` (for proc_count)
- Produces: Three chart components

- [ ] **Step 1: Create app/components/dashboard/DiskPanel.tsx**

```typescript
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
```

- [ ] **Step 2: Create app/components/dashboard/NetworkChart.tsx**

```typescript
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
```

- [ ] **Step 3: Create app/components/dashboard/ProcessChart.tsx**

```typescript
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
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add app/components/dashboard/DiskPanel.tsx app/components/dashboard/NetworkChart.tsx app/components/dashboard/ProcessChart.tsx
git commit -m "feat: add disk, network, and process chart components

Co-Authored-By: Claude <noreply@anthropic.com>"
```


### Task 10: Main Page Layout + Global Styles + Mobile Adaptation

**Files:**
- Create: `app/globals.css`, `app/layout.tsx`, `app/page.tsx`

**Interfaces:**
- Consumes: All dashboard components from Tasks 7-9, `DashboardProvider` from Task 6
- Produces: Complete dashboard at `http://localhost:3000`

- [ ] **Step 1: Create app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  background: #0a0e27;
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  overflow-x: hidden;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(0, 212, 255, 0.2);
  border-radius: 2px;
}

/* Tabular numbers for metrics */
.tabular-nums {
  font-variant-numeric: tabular-nums;
}

/* Mobile: prevent zoom */
@media (max-width: 767px) {
  html {
    touch-action: manipulation;
  }
}

/* Pulse animation for skeleton loading */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

- [ ] **Step 2: Create app/layout.tsx**

```typescript
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '数据中心监控大屏',
  description: '服务器性能监控可视化大屏',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-dashboard-bg">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Create app/page.tsx**

```typescript
'use client'

import { DashboardProvider } from './providers'
import HeaderBar from './components/dashboard/HeaderBar'
import HostList from './components/dashboard/HostList'
import CpuChart from './components/dashboard/CpuChart'
import MemoryChart from './components/dashboard/MemoryChart'
import LoadChart from './components/dashboard/LoadChart'
import DiskPanel from './components/dashboard/DiskPanel'
import NetworkChart from './components/dashboard/NetworkChart'
import ProcessChart from './components/dashboard/ProcessChart'

export default function Home() {
  return (
    <DashboardProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <HeaderBar />

        {/* Main grid: PC 5 zones, Mobile single column */}
        <main className="flex-1 grid gap-3 p-3 overflow-hidden
          grid-cols-1
          lg:grid-cols-[220px_1fr_280px]
          lg:grid-rows-[1fr_180px]">

          {/* Left: Host list - PC sidebar, Mobile hidden by default */}
          <div className="hidden lg:block lg:row-span-2 overflow-hidden">
            <HostList />
          </div>

          {/* Mobile host selector */}
          <div className="lg:hidden">
            <HostList />
          </div>

          {/* Center: CPU + Memory + Load */}
          <div className="grid grid-rows-3 gap-3 overflow-hidden">
            <CpuChart />
            <MemoryChart />
            <LoadChart />
          </div>

          {/* Right: Disk panel */}
          <div className="lg:row-span-2 overflow-hidden">
            <DiskPanel />
          </div>

          {/* Bottom: Network + Process */}
          <div className="grid grid-cols-2 gap-3 overflow-hidden">
            <NetworkChart />
            <ProcessChart />
          </div>
        </main>
      </div>
    </DashboardProvider>
  )
}
```

- [ ] **Step 4: Start dev server and verify**

```bash
npm run dev
```

Open http://localhost:3000 in browser.
Expected:
- Dark theme dashboard with 5-zone layout on PC (>=1280px)
- Header bar with clock ticking, KPI cards showing data
- Left sidebar with host list (click to filter)
- Center: CPU, Memory, Load line charts
- Right: Disk latency/util/RW charts
- Bottom: Network traffic + Process count
- All charts loading and displaying data from MySQL

- [ ] **Step 5: Test with curl to verify all APIs**

```bash
curl http://localhost:3000/api/overview | head -c 200
curl http://localhost:3000/api/hosts | head -c 200
curl "http://localhost:3000/api/metrics/cpu?hours=1" | head -c 200
```

Expected: JSON responses with real data.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css app/layout.tsx app/page.tsx
git add docs/superpowers/plans/
git commit -m "feat: assemble main dashboard page with responsive grid layout

Co-Authored-By: Claude <noreply@anthropic.com>"
```

- [ ] **Step 7: Push all commits**

```bash
git push origin main
```

Expected: All code pushed to github.com:wuhu355/datacenter.git
