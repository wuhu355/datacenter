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
