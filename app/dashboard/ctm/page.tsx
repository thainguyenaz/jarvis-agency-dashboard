'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

type SourceRow = {
  key: string
  label: string
  is_paid: boolean
  spend_30d: number | null
  total_calls: number
  answered: number
  qualified: number
  medicaid: number
  dead_air: number
  existing_client: number
  wrong_number: number
  not_treatment: number
  spam: number
  inn_only: number
  unreviewed: number
  qualified_cpl: number | null
}

type Breakdown = {
  window_days: number
  generated_at: string
  total_calls_pulled: number
  sources: SourceRow[]
  totals: {
    total_calls: number
    answered: number
    qualified: number
    unreviewed: number
  }
  backlog_pct: number
  unreviewed_48h: number
  total_48h: number
  staleness_banner: boolean
  unmapped_raw_sources: Record<string, number>
}

function fmtInt(n: number | null | undefined) {
  if (n === null || n === undefined) return '—'
  return n.toLocaleString()
}

function fmtCPL(n: number | null | undefined, isPaid: boolean) {
  if (!isPaid) return '—'
  if (n === null || n === undefined) return '—'
  return '$' + n.toLocaleString()
}

export default function CTMPage() {
  const [summary, setSummary] = useState<any>(null)
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = localStorage.getItem('jarvis_token') || ''
    Promise.all([
      api.getCTMSummary(t),
      api.getCTMSourceBreakdown(t),
    ])
      .then(([s, b]) => { setSummary(s); setBreakdown(b) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-jarvis-cyan font-mono animate-pulse">
        LOADING CTM DATA...
      </div>
    )
  }
  if (error || !summary || !breakdown) {
    return (
      <div className="bg-jarvis-surface border border-jarvis-red border-opacity-30 rounded-lg p-8 text-center">
        <div className="text-jarvis-red font-mono font-bold mb-2">DATA UNAVAILABLE</div>
        <div className="text-jarvis-dim text-xs font-mono">
          {error || 'No data'} ·{' '}
          <button onClick={() => window.location.reload()} className="text-jarvis-cyan ml-1 hover:underline">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const kpis = [
    { label: 'TOTAL CALLS (30D)', value: summary.total_calls_30d ?? '—', status: 'neutral' },
    { label: 'ANSWERED',          value: summary.total_answered ?? summary.answered ?? '—', status: 'good' },
    {
      label: 'MISSED',
      value: summary.total_missed ?? summary.missed_calls ?? '—',
      status: (summary.total_missed || 0) > 150 ? 'critical' : 'warn',
    },
    {
      label: 'ANSWER RATE',
      value: `${summary.answer_rate ?? '—'}%`,
      status:
        (summary.answer_rate || 0) < 70 ? 'critical' :
        (summary.answer_rate || 0) < 80 ? 'warn' : 'good',
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-lg md:text-2xl font-bold font-mono text-jarvis-cyan tracking-widest">
        CALL TRACKING — CTM
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((m, i) => (
          <div
            key={i}
            className={`bg-jarvis-surface border rounded-lg p-4 ${
              m.status === 'critical' ? 'border-jarvis-red' :
              m.status === 'warn'     ? 'border-jarvis-yellow' :
              m.status === 'good'     ? 'border-jarvis-green' :
              'border-jarvis-border'
            }`}
          >
            <div className="text-xs font-mono text-jarvis-dim mb-1">{m.label}</div>
            <div
              className={`text-2xl md:text-3xl font-bold font-mono ${
                m.status === 'critical' ? 'text-jarvis-red' :
                m.status === 'warn'     ? 'text-jarvis-yellow' :
                m.status === 'good'     ? 'text-jarvis-green' :
                'text-jarvis-cyan'
              }`}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {breakdown.staleness_banner && (
        <div className="bg-jarvis-surface border-2 border-jarvis-red rounded-lg p-3 md:p-4">
          <div className="text-xs md:text-sm font-mono text-jarvis-red font-bold">
            ⚠ {breakdown.backlog_pct}% of calls in last 48h not yet reviewed by admissions
          </div>
          <div className="text-[10px] md:text-xs font-mono text-jarvis-dim mt-1">
            {breakdown.unreviewed_48h} of {breakdown.total_48h} 48h calls unreviewed · qualification rows below undercount the most recent calls until disposition is set
          </div>
        </div>
      )}

      <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-3 md:p-4">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-jarvis-cyan font-mono font-bold tracking-wider text-sm md:text-base">
            CALLS BY SOURCE
          </h2>
          <div className="text-[10px] md:text-xs font-mono text-jarvis-dim">
            {breakdown.window_days}d window
          </div>
        </div>

        <div className="overflow-x-auto -mx-3 md:mx-0">
          <table className="w-full font-mono text-xs md:text-sm">
            <thead>
              <tr className="border-b border-jarvis-border text-jarvis-dim">
                <th className="text-left py-2 px-3 font-normal">SOURCE</th>
                <th className="text-right py-2 px-2 font-normal">TOTAL</th>
                <th className="text-right py-2 px-2 font-normal">QUALIFIED</th>
                <th className="text-right py-2 px-3 font-normal">CPL</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.sources.map((s) => (
                <tr
                  key={s.key}
                  className="border-b border-jarvis-border/40 hover:bg-jarvis-bg/40"
                >
                  <td className="py-2 px-3">
                    <Link
                      href={`/dashboard/ctm/source/${s.key}`}
                      className="text-jarvis-text hover:text-jarvis-cyan block"
                    >
                      <div className="truncate max-w-[180px] md:max-w-none">{s.label}</div>
                      {s.is_paid && (
                        <div className="text-[9px] md:text-[10px] text-jarvis-dim uppercase tracking-widest">paid</div>
                      )}
                    </Link>
                  </td>
                  <td className="py-2 px-2 text-right text-jarvis-text">
                    {fmtInt(s.total_calls)}
                  </td>
                  <td className={`py-2 px-2 text-right font-bold ${
                    s.qualified > 0 ? 'text-jarvis-green' : 'text-jarvis-dim'
                  }`}>
                    {fmtInt(s.qualified)}
                  </td>
                  <td className={`py-2 px-3 text-right ${
                    s.is_paid && s.qualified_cpl === null ? 'text-jarvis-yellow' :
                    s.is_paid ? 'text-jarvis-cyan' : 'text-jarvis-dim'
                  }`}>
                    {fmtCPL(s.qualified_cpl, s.is_paid)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-jarvis-border">
                <td className="py-2 px-3 text-jarvis-dim uppercase tracking-widest text-[10px]">TOTAL</td>
                <td className="py-2 px-2 text-right text-jarvis-cyan">{fmtInt(breakdown.totals.total_calls)}</td>
                <td className="py-2 px-2 text-right text-jarvis-green font-bold">{fmtInt(breakdown.totals.qualified)}</td>
                <td className="py-2 px-3 text-right text-jarvis-dim">—</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="text-[10px] md:text-xs font-mono text-jarvis-dim mt-3">
          Qualified = admissions-reviewed sale.score 4-5 · CPL = spend_30d / qualified · Paid-source CPL shows &ldquo;—&rdquo; when qualified=0 until a disposition is set
        </div>

        {Object.keys(breakdown.unmapped_raw_sources).length > 0 && (
          <div className="mt-3 text-[10px] md:text-xs font-mono text-jarvis-yellow">
            ⚠ Unmapped raw sources (not in SOURCE_MAP):{' '}
            {Object.entries(breakdown.unmapped_raw_sources)
              .map(([src, n]) => `${src} (${n})`).join(', ')}
          </div>
        )}
      </div>

      <div className="text-[10px] md:text-xs font-mono text-jarvis-dim text-right">
        Generated {new Date(breakdown.generated_at).toLocaleString()} · {breakdown.total_calls_pulled} calls scored
      </div>
    </div>
  )
}
