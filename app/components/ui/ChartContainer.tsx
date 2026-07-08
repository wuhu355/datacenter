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
    <div className={`flex flex-col rounded-xl border border-dashboard-border bg-dashboard-card p-4 backdrop-blur-sm ${className}`}>
      <h3 className="text-sm font-medium text-gray-300 mb-3 shrink-0">{title}</h3>
      <div className="relative flex-1 min-h-0">
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
