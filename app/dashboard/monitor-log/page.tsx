'use client'
import { useEffect, useState, useCallback } from 'react'
import { jarvisFetch } from '@/lib/api'

type Run = {
  id: number
  run_at: string
  check_date: string
  occupancy_pct: number | null
  occupied_beds: number | null
  total_beds: number | null
  bed_count: string
  zone: string | null
  action_taken: string | null
  proposal_count: number
  monthly_target: number | null
  notes: string | null
  details: string | null
}

type MonitorLogResponse = {
  runs: Run[]
  total_count: number
  hold_count_30d: number
  below_50_count_30d: number
  above_90_count_30d: number
  below_70_count_30d: number
}

type ZoneFilter = 'ALL' | 'HOLD' | 'BELOW_50' | 'ABOVE_90' | 'BELOW_70'

const ZONE_FILTERS: { key: ZoneFilter; label: string }[] = [
  { key: 'ALL', label: 'ALL' },
  { key: 'HOLD', label: 'HOLD' },
  { key: 'BELOW_50', label: 'BELOW_50' },
  { key: 'ABOVE_90', label: 'ABOVE_90' },
  { key: 'BELOW_70', label: 'BELOW_70 (legacy)' },
]

function fmtDate(d: string): string {
  try {
    const s = d.includes('T') || d.endsWith('Z') ? d : d.replace(' ', 'T') + 'Z'
    const dt = new Date(s)
    return dt.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Phoenix',
    })
  } catch {
    return d
  }
}

function zoneClasses(zone: string | null): string {
  switch (zone) {
    case 'HOLD':
      return 'bg-blue-500 bg-opacity-20 text-blue-400 border border-blue-500 border-opacity-40'
    case 'BELOW_50':
    case 'BELOW_70':
      return 'bg-jarvis-yellow bg-opacity-20 text-jarvis-yellow border border-jarvis-yellow border-opacity-40'
    case 'ABOVE_90':
      return 'bg-jarvis-red bg-opacity-20 text-jarvis-red border border-jarvis-red border-opacity-40'
    default:
      return 'bg-jarvis-dim bg-opacity-20 text-jarvis-dim'
  }
}

function actionClasses(action: string | null): string {
  const a = (action || '').toLowerCase()
  if (a === 'none' || a === '') return 'bg-jarvis-dim bg-opacity-20 text-jarvis-dim'
  if (a === 'alert_sent') return 'bg-jarvis-red bg-opacity-20 text-jarvis-red'
  if (a === 'proposal_queued' || a === 'approvals_queued')
    return 'bg-jarvis-yellow bg-opacity-20 text-jarvis-yellow'
  return 'bg-jarvis-cyan bg-opacity-20 text-jarvis-cyan'
}

export default function MonitorLogPage() {
  const [data, setData] = useState<MonitorLogResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<ZoneFilter>('ALL')

  const load = useCallback((zone: ZoneFilter) => {
    setLoading(true)
    setError('')
    const qs = new URLSearchParams({ limit: '30' })
    if (zone !== 'ALL') qs.set('zone', zone)
    jarvisFetch(`/api/monitor-log?${qs.toString()}`)
      .then((d: MonitorLogResponse) => setData(d))
      .catch(e => setError(e.message || String(e)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(filter) }, [load, filter])

  const runs = data?.runs || []
  const latest = runs[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-jarvis-cyan font-mono font-bold text-xl md:text-2xl tracking-widest">
          OCCUPANCY BUDGET MONITOR LOG
        </h1>
        <div className="text-jarvis-dim text-xs font-mono mt-1">
          Daily runs at 8:10am AZ via occupancy-budget-monitor.js → targets actual projected spend.
          No auto-execute; proposals go to Thai via Telegram.
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-3">
          <div className="text-xs font-mono text-jarvis-dim mb-1">LAST RUN</div>
          {latest ? (
            <>
              <div className="text-sm font-bold font-mono text-jarvis-cyan">
                {fmtDate(latest.run_at)}
              </div>
              <div className="text-xs font-mono text-jarvis-text mt-1">
                {latest.occupancy_pct != null ? `${latest.occupancy_pct}%` : '—'}
                <span className="text-jarvis-dim"> · {latest.bed_count}</span>
              </div>
              <div className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono ${zoneClasses(latest.zone)}`}>
                {latest.zone || '—'}
              </div>
            </>
          ) : (
            <div className="text-sm font-mono text-jarvis-dim">—</div>
          )}
        </div>
        <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-3">
          <div className="text-xs font-mono text-jarvis-dim mb-1">HOLD (30D)</div>
          <div className="text-xl font-bold font-mono text-blue-400">
            {data?.hold_count_30d ?? (loading ? '…' : 0)}
          </div>
        </div>
        <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-3">
          <div className="text-xs font-mono text-jarvis-dim mb-1">BELOW_50 (30D)</div>
          <div className="text-xl font-bold font-mono text-jarvis-yellow">
            {data?.below_50_count_30d ?? (loading ? '…' : 0)}
          </div>
        </div>
        <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-3">
          <div className="text-xs font-mono text-jarvis-dim mb-1">ABOVE_90 (30D)</div>
          <div className="text-xl font-bold font-mono text-jarvis-red">
            {data?.above_90_count_30d ?? (loading ? '…' : 0)}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {ZONE_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded font-mono text-xs font-bold tracking-wider transition-colors ${
              filter === f.key
                ? 'bg-jarvis-cyan text-jarvis-bg'
                : 'bg-jarvis-surface border border-jarvis-border text-jarvis-dim hover:text-jarvis-cyan hover:border-jarvis-cyan'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="text-jarvis-dim font-mono text-xs ml-2">
          {runs.length} run{runs.length !== 1 ? 's' : ''}
          {data ? ` · ${data.total_count} total` : ''}
        </span>
        <button
          onClick={() => load(filter)}
          disabled={loading}
          className="ml-auto px-3 py-1.5 rounded font-mono text-xs font-bold tracking-wider
                     bg-jarvis-surface border border-jarvis-border text-jarvis-dim
                     hover:text-jarvis-cyan hover:border-jarvis-cyan disabled:opacity-50"
        >
          {loading ? 'LOADING…' : 'REFRESH'}
        </button>
      </div>

      <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-4">
        {error ? (
          <div className="text-center py-8">
            <div className="text-jarvis-red font-mono font-bold mb-2">FAILED TO LOAD</div>
            <div className="text-jarvis-dim text-xs font-mono mb-4 break-all">{error}</div>
            <button
              onClick={() => load(filter)}
              className="px-4 py-1.5 rounded font-mono text-xs font-bold tracking-wider
                         bg-jarvis-cyan text-jarvis-bg"
            >
              RETRY
            </button>
          </div>
        ) : loading && !data ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-jarvis-cyan font-mono animate-pulse">LOADING MONITOR LOG...</div>
          </div>
        ) : runs.length === 0 ? (
          <div className="text-center py-10 font-mono text-sm text-jarvis-dim">
            No monitor runs yet. Next run at 8:10am AZ.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="text-jarvis-dim border-b border-jarvis-border">
                  <th className="text-left py-2 pr-4">RUN AT</th>
                  <th className="text-left py-2 pr-4">OCCUPANCY</th>
                  <th className="text-left py-2 pr-4">BEDS</th>
                  <th className="text-left py-2 pr-4">ZONE</th>
                  <th className="text-left py-2 pr-4">ACTION</th>
                  <th className="text-left py-2 pr-4">PROPOSALS</th>
                  <th className="text-left py-2">NOTES</th>
                </tr>
              </thead>
              <tbody>
                {runs.map(r => (
                  <tr
                    key={r.id}
                    className="border-b border-jarvis-border border-opacity-30 hover:bg-jarvis-bg transition-colors align-top"
                  >
                    <td className="py-2.5 pr-4 text-jarvis-text whitespace-nowrap">
                      {fmtDate(r.run_at)}
                    </td>
                    <td className="py-2.5 pr-4 text-jarvis-cyan font-bold">
                      {r.occupancy_pct != null ? `${r.occupancy_pct}%` : '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-jarvis-text">{r.bed_count}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${zoneClasses(r.zone)}`}>
                        {r.zone || '—'}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${actionClasses(r.action_taken)}`}>
                        {(r.action_taken || 'none').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-jarvis-text">{r.proposal_count}</td>
                    <td className="py-2.5 text-jarvis-dim text-xs max-w-[420px]">
                      {r.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-[11px] font-mono text-jarvis-dim">
        Source: <span className="text-jarvis-text">occupancy_budget_log</span> (SQLite · jarvis-cache.db).
        Legacy BELOW_70 rows are shown for history only — current rule uses HOLD / BELOW_50 / ABOVE_90.
      </div>
    </div>
  )
}
