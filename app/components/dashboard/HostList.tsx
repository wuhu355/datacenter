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
