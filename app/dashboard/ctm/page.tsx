'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function CTMPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('jarvis_token') || ''
    api.getCTMSummary(t).then(setData).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-jarvis-cyan font-mono animate-pulse">LOADING CTM DATA...</div>
  if (!data) return (
    <div className="bg-jarvis-surface border border-jarvis-red border-opacity-30 rounded-lg p-8 text-center">
      <div className="text-jarvis-red font-mono font-bold mb-2">DATA UNAVAILABLE</div>
      <div className="text-jarvis-dim text-xs font-mono">
        Check VPS connection ·
        <button onClick={() => window.location.reload()} className="text-jarvis-cyan ml-1 hover:underline">Retry</button>
      </div>
    </div>
  )

  const sources = data.top_sources ||
    Object.entries(data.calls_by_source || {}).map(([source, calls]) => ({ source, calls })) ||
    []

  return (
    <div className="space-y-6">
      <h1 className="text-lg md:text-2xl font-bold font-mono text-jarvis-cyan tracking-widest">CALL TRACKING — CTM</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'TOTAL CALLS (30D)', value: data.total_calls_30d || '—', status: 'neutral' },
          { label: 'ANSWERED', value: data.total_answered || data.answered || '—', status: 'good' },
          { label: 'MISSED', value: data.total_missed || data.missed_calls || '—', status: (data.total_missed || 0) > 150 ? 'critical' : 'warn' },
          { label: 'ANSWER RATE', value: `${data.answer_rate || '—'}%`, status: (data.answer_rate || 0) < 70 ? 'critical' : (data.answer_rate || 0) < 80 ? 'warn' : 'good' },
        ].map((m, i) => (
          <div key={i} className={`bg-jarvis-surface border rounded-lg p-4 ${
            m.status === 'critical' ? 'border-jarvis-red' :
            m.status === 'warn' ? 'border-jarvis-yellow' :
            m.status === 'good' ? 'border-jarvis-green' :
            'border-jarvis-border'
          }`}>
            <div className="text-xs font-mono text-jarvis-dim mb-1">{m.label}</div>
            <div className={`text-3xl font-bold font-mono ${
              m.status === 'critical' ? 'text-jarvis-red' :
              m.status === 'warn' ? 'text-jarvis-yellow' :
              m.status === 'good' ? 'text-jarvis-green' :
              'text-jarvis-cyan'
            }`}>{m.value}</div>
          </div>
        ))}
      </div>

      {sources.length > 0 && (
        <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-4">
          <h2 className="text-jarvis-cyan font-mono font-bold mb-4 tracking-wider">CALLS BY SOURCE</h2>
          <div className="space-y-3">
            {sources.map((s: any, i: number) => {
              const total = data.total_calls_30d || 1
              const count = s.calls || s.count || s.total || (typeof Object.values(s)[0] === 'number' ? Object.values(s)[0] : 0)
              const pct = Math.round(((count as number) / total) * 100)
              return (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-40 text-xs font-mono text-jarvis-text truncate">
                    {s.source || s.name || s.medium || Object.keys(s)[0] || 'Unknown'}
                  </div>
                  <div className="flex-1 bg-jarvis-bg rounded-full h-2">
                    <div
                      className="bg-jarvis-cyan h-2 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-xs font-mono text-jarvis-cyan w-16 text-right">
                    {count} ({pct}%)
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
