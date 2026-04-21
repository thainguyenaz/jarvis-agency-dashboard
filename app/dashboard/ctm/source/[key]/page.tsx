'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'

type Detail = {
  key: string
  label: string
  is_paid: boolean
  window_days: number
  date_range: { start: string; end: string }
  generated_at: string
  spend_30d: number | null
  total_calls: number
  qualified: number
  qualified_cpl: number | null
  categories: {
    qualified: number
    medicaid: number
    inn_only: number
    dead_air: number
    existing_client: number
    wrong_number: number
    not_treatment: number
    spam: number
    unreviewed: number
  }
  raw_sources: { raw_source: string; count: number }[]
  recent_calls: {
    id: number | string
    called_at: string
    duration_seconds: number
    sale_name: string | null
    sale_score: number | null
    caller_masked: string
    reviewed: boolean
    quality_score: number
    raw_source: string
  }[]
}

const CATEGORY_LABELS: { key: keyof Detail['categories']; label: string }[] = [
  { key: 'qualified',       label: 'Qualified (score 4-5)' },
  { key: 'medicaid',        label: 'Medicaid/AHCCCS (can\'t accept)' },
  { key: 'inn_only',        label: 'INN Only (has in-network insurance)' },
  { key: 'dead_air',        label: 'Dead Air / Hang Up' },
  { key: 'existing_client', label: 'Existing Client/Family' },
  { key: 'wrong_number',    label: 'Wrong Number' },
  { key: 'not_treatment',   label: 'Not Treatment Related' },
  { key: 'spam',            label: 'Spam' },
  { key: 'unreviewed',      label: 'Unreviewed (sale=null)' },
]

function fmtDuration(s: number) {
  if (!s || s < 0) return '0s'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

function fmtDate(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export default function SourceDetailPage() {
  const params = useParams<{ key: string }>()
  const key = params.key
  const [data, setData] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = localStorage.getItem('jarvis_token') || ''
    api.getCTMSourceDetail(key, t)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [key])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-jarvis-cyan font-mono animate-pulse">
        LOADING SOURCE DETAIL...
      </div>
    )
  }
  if (error || !data) {
    return (
      <div className="bg-jarvis-surface border border-jarvis-red border-opacity-30 rounded-lg p-8 text-center">
        <div className="text-jarvis-red font-mono font-bold mb-2">DATA UNAVAILABLE</div>
        <div className="text-jarvis-dim text-xs font-mono">
          {error || 'No data'} ·{' '}
          <Link href="/dashboard/ctm" className="text-jarvis-cyan ml-1 hover:underline">
            Back to CTM
          </Link>
        </div>
      </div>
    )
  }

  const total = data.total_calls
  const mergeNote = data.raw_sources.length > 1
    ? data.raw_sources.map(r => `${r.raw_source} (${r.count})`).join(' · ')
    : null
  const legacyLabel = data.raw_sources.find(r => r.raw_source === 'GMB PHP/IOP')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-mono">
        <Link href="/dashboard/ctm" className="text-jarvis-dim hover:text-jarvis-cyan">
          ← CALL TRACKING
        </Link>
        <span className="text-jarvis-dim">/</span>
        <span className="text-jarvis-cyan tracking-widest uppercase">{data.key}</span>
      </div>

      <div>
        <h1 className="text-lg md:text-2xl font-bold font-mono text-jarvis-cyan tracking-widest">
          {data.label}
        </h1>
        <div className="text-[10px] md:text-xs font-mono text-jarvis-dim mt-1">
          {data.window_days}d window · {data.date_range.start} → {data.date_range.end}
          {data.is_paid && (
            <span className="ml-2 px-2 py-0.5 border border-jarvis-cyan/40 text-jarvis-cyan rounded uppercase tracking-widest">paid</span>
          )}
        </div>
        {key === 'phoenix_php_iop_gbp' && legacyLabel && (
          <div className="text-[10px] md:text-xs font-mono text-jarvis-yellow mt-1">
            Includes legacy label &apos;GMB PHP/IOP&apos; ({legacyLabel.count} calls) — verify this is the same listing
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-4">
          <div className="text-xs font-mono text-jarvis-dim mb-1">TOTAL CALLS</div>
          <div className="text-2xl md:text-3xl font-bold font-mono text-jarvis-cyan">{total}</div>
        </div>
        <div className="bg-jarvis-surface border border-jarvis-green rounded-lg p-4">
          <div className="text-xs font-mono text-jarvis-dim mb-1">QUALIFIED</div>
          <div className="text-2xl md:text-3xl font-bold font-mono text-jarvis-green">{data.qualified}</div>
        </div>
        {data.is_paid && (
          <>
            <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-4">
              <div className="text-xs font-mono text-jarvis-dim mb-1">SPEND (30D)</div>
              <div className="text-2xl md:text-3xl font-bold font-mono text-jarvis-text">
                {data.spend_30d !== null ? `$${data.spend_30d.toLocaleString()}` : '—'}
              </div>
            </div>
            <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-4">
              <div className="text-xs font-mono text-jarvis-dim mb-1">QUALIFIED CPL</div>
              <div className={`text-2xl md:text-3xl font-bold font-mono ${
                data.qualified_cpl === null ? 'text-jarvis-yellow' : 'text-jarvis-cyan'
              }`}>
                {data.qualified_cpl !== null ? `$${data.qualified_cpl.toLocaleString()}` : '—'}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-3 md:p-4">
        <h2 className="text-jarvis-cyan font-mono font-bold tracking-wider text-sm md:text-base mb-3">
          DISPOSITION BREAKDOWN
        </h2>
        <table className="w-full font-mono text-xs md:text-sm">
          <thead>
            <tr className="border-b border-jarvis-border text-jarvis-dim">
              <th className="text-left py-2 px-2 font-normal">CATEGORY</th>
              <th className="text-right py-2 px-2 font-normal">COUNT</th>
              <th className="text-right py-2 px-2 font-normal">% OF TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORY_LABELS.map(({ key: catKey, label }) => {
              const count = data.categories[catKey] ?? 0
              const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
              const isQual = catKey === 'qualified'
              const isUnrev = catKey === 'unreviewed'
              return (
                <tr key={catKey} className="border-b border-jarvis-border/40">
                  <td className={`py-2 px-2 ${isQual ? 'text-jarvis-green' : 'text-jarvis-text'}`}>{label}</td>
                  <td className={`py-2 px-2 text-right ${
                    isQual ? 'text-jarvis-green font-bold' :
                    isUnrev ? 'text-jarvis-yellow' :
                    'text-jarvis-text'
                  }`}>{count}</td>
                  <td className="py-2 px-2 text-right text-jarvis-dim">{pct}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {mergeNote && (
          <div className="text-[10px] md:text-xs font-mono text-jarvis-dim mt-3">
            Raw CTM sources in this bucket: {mergeNote}
          </div>
        )}
      </div>

      <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-3 md:p-4">
        <h2 className="text-jarvis-cyan font-mono font-bold tracking-wider text-sm md:text-base mb-3">
          LAST {data.recent_calls.length} CALLS
        </h2>
        {data.recent_calls.length === 0 ? (
          <div className="text-jarvis-dim font-mono text-xs md:text-sm">No calls in window.</div>
        ) : (
          <ul className="divide-y divide-jarvis-border/40">
            {data.recent_calls.map((c) => (
              <li key={c.id} className="py-2 font-mono text-[11px] md:text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-jarvis-text whitespace-nowrap">{fmtDate(c.called_at)}</span>
                  <span className="text-jarvis-text whitespace-nowrap">{fmtDuration(c.duration_seconds)}</span>
                </div>
                <div className="flex justify-between gap-2 mt-0.5">
                  <span className="truncate">
                    {c.sale_name
                      ? <span className={c.sale_score !== null && c.sale_score >= 4 ? 'text-jarvis-green font-bold' : 'text-jarvis-text'}>{c.sale_name}</span>
                      : <span className="text-jarvis-yellow">unreviewed</span>
                    }
                    {c.sale_score !== null && (
                      <span className={`ml-1 ${
                        c.sale_score >= 4 ? 'text-jarvis-green' : 'text-jarvis-dim'
                      }`}>
                        ({c.sale_score}★)
                      </span>
                    )}
                  </span>
                  <span className="text-jarvis-dim whitespace-nowrap">{c.caller_masked}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="text-[10px] md:text-xs font-mono text-jarvis-dim text-right">
        Generated {new Date(data.generated_at).toLocaleString()}
      </div>
    </div>
  )
}
