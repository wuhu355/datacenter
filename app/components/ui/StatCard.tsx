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
