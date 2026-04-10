'use client'
import { useEffect, useState } from 'react'
import { jarvisFetch } from '@/lib/api'

interface QualifiedSource {
  source: string
  is_paid: boolean
  total_qualified: number
  five_star: number
  four_star: number
  avg_duration: number
  monthly_trend: Record<string, number>
  sample_tags: Record<string, number>
}

interface MonthlyTrend {
  month: string
  total: number
  five_star: number
  four_star: number
}

interface QualifiedHistory {
  summary: {
    total_calls_pulled: number
    total_qualified: number
    five_star_count: number
    four_star_count: number
    overall_qualification_rate: string
  }
  by_source: QualifiedSource[]
  monthly_trend: MonthlyTrend[]
  five_star_calls: any[]
  date_range: { start: string; end: string }
}

export default function QualifiedLeadsPage() {
  const [data, setData] = useState<QualifiedHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'sources'|'trend'|'calls'>('sources')

  useEffect(() => {
    jarvisFetch('/api/ctm/qualified-history?months=12')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-jarvis-cyan font-mono animate-pulse">
        LOADING 12-MONTH QUALIFIED LEAD HISTORY...
      </div>
    </div>
  )

  if (!data) return (
    <div className="bg-jarvis-surface border border-jarvis-red
                    border-opacity-30 rounded-lg p-8 text-center">
      <div className="text-jarvis-red font-mono font-bold mb-2">DATA UNAVAILABLE</div>
      <button onClick={() => window.location.reload()}
              className="text-jarvis-cyan text-xs font-mono hover:underline">
        Retry
      </button>
    </div>
  )

  const s = data.summary
  const maxQualified = Math.max(...data.by_source.map(s => s.total_qualified), 1)
  const maxMonthly = Math.max(...data.monthly_trend.map(m => m.total), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-mono font-bold text-jarvis-cyan tracking-widest">
            QUALIFIED LEAD INTELLIGENCE
          </h1>
          <div className="text-xs font-mono text-jarvis-dim mt-1">
            12-month analysis · {data.date_range?.start} to {data.date_range?.end} ·
            CTM star rating system
          </div>
        </div>
        <button
          onClick={() => {
            setLoading(true)
            jarvisFetch('/api/ctm/qualified-history?months=12&refresh=true')
              .then(setData).finally(() => setLoading(false))
          }}
          className="px-4 py-2 bg-jarvis-surface border border-jarvis-cyan
                     text-jarvis-cyan font-mono text-xs hover:bg-jarvis-cyan
                     hover:text-black transition-colors"
        >
          ↻ REFRESH
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'TOTAL CALLS (12M)', value: s.total_calls_pulled?.toLocaleString(), color: 'text-jarvis-cyan' },
          { label: '5-STAR QUALIFIED', value: s.five_star_count, color: 'text-jarvis-green',
            sub: 'Verified OON/Private Pay' },
          { label: '4-STAR POTENTIAL', value: s.four_star_count, color: 'text-jarvis-yellow',
            sub: 'Unverified commercial' },
          { label: 'QUAL RATE', value: s.overall_qualification_rate + '%',
            color: parseFloat(s.overall_qualification_rate) > 15
              ? 'text-jarvis-green' : 'text-jarvis-yellow',
            sub: '4-5 star of all calls' },
        ].map((kpi, i) => (
          <div key={i} className="bg-jarvis-surface border border-jarvis-border rounded-lg p-4">
            <div className="text-jarvis-dim font-mono text-xs mb-2">{kpi.label}</div>
            <div className={`font-mono font-bold text-2xl ${kpi.color}`}>{kpi.value}</div>
            {kpi.sub && <div className="text-jarvis-dim font-mono text-xs mt-1">{kpi.sub}</div>}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-jarvis-border">
        {(['sources', 'trend', 'calls'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-mono text-xs uppercase tracking-widest
              ${activeTab === tab
                ? 'text-jarvis-cyan border-b-2 border-jarvis-cyan'
                : 'text-jarvis-dim hover:text-jarvis-cyan'}`}
          >
            {tab === 'sources' ? 'By Source' :
             tab === 'trend' ? 'Monthly Trend' : '5-Star Calls'}
          </button>
        ))}
      </div>

      {/* Sources Tab */}
      {activeTab === 'sources' && (
        <div className="space-y-3">
          <div className="text-xs font-mono text-jarvis-dim mb-4">
            Ranked by total qualified leads (4-5 star) ·
            GREEN = free channel · CYAN = paid campaign
          </div>
          {data.by_source.map((src, i) => {
            const pct = (src.total_qualified / maxQualified) * 100
            return (
              <div key={i} className={`bg-jarvis-surface border rounded-lg p-4
                ${src.is_paid ? 'border-jarvis-cyan border-opacity-40'
                              : 'border-jarvis-green border-opacity-40'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-mono px-2 py-0.5 rounded
                      ${src.is_paid
                        ? 'bg-jarvis-cyan bg-opacity-20 text-jarvis-cyan'
                        : 'bg-jarvis-green bg-opacity-20 text-jarvis-green'}`}>
                      {src.is_paid ? 'PAID' : 'FREE'}
                    </span>
                    <span className="font-mono text-sm text-white font-bold">
                      {src.source}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-jarvis-green font-mono font-bold text-lg">
                        {src.five_star}
                      </div>
                      <div className="text-jarvis-dim font-mono text-xs">5-star</div>
                    </div>
                    <div>
                      <div className="text-jarvis-yellow font-mono font-bold text-lg">
                        {src.four_star}
                      </div>
                      <div className="text-jarvis-dim font-mono text-xs">4-star</div>
                    </div>
                    <div>
                      <div className="text-white font-mono font-bold text-lg">
                        {src.total_qualified}
                      </div>
                      <div className="text-jarvis-dim font-mono text-xs">total</div>
                    </div>
                    <div>
                      <div className="text-jarvis-dim font-mono text-sm">
                        {Math.round(src.avg_duration / 60)}m {src.avg_duration % 60}s
                      </div>
                      <div className="text-jarvis-dim font-mono text-xs">avg duration</div>
                    </div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-jarvis-bg rounded-full mt-2">
                  <div className="h-full rounded-full flex">
                    <div
                      className="h-full bg-jarvis-green rounded-l-full"
                      style={{ width: `${(src.five_star/src.total_qualified)*pct}%` }}
                    />
                    <div
                      className="h-full bg-jarvis-yellow rounded-r-full"
                      style={{ width: `${(src.four_star/src.total_qualified)*pct}%` }}
                    />
                  </div>
                </div>
                {/* Top tags */}
                {Object.keys(src.sample_tags).length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {Object.entries(src.sample_tags)
                      .sort((a,b) => b[1]-a[1])
                      .slice(0,4)
                      .map(([tag, count]) => (
                        <span key={tag}
                              className="text-xs font-mono text-jarvis-dim
                                         bg-jarvis-bg px-2 py-0.5 rounded">
                          {tag} ({count})
                        </span>
                      ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Monthly Trend Tab */}
      {activeTab === 'trend' && (
        <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-6">
          <div className="text-xs font-mono text-jarvis-dim mb-6">
            Monthly qualified leads (4-5 star) over 12 months
          </div>
          <div className="space-y-3">
            {data.monthly_trend.map((m, i) => {
              const barWidth = (m.total / maxMonthly) * 100
              const fiveWidth = m.total > 0 ? (m.five_star / m.total) * barWidth : 0
              const fourWidth = barWidth - fiveWidth
              return (
                <div key={i} className="flex items-center gap-4">
                  <div className="text-jarvis-dim font-mono text-xs w-20 text-right">
                    {m.month}
                  </div>
                  <div className="flex-1 h-6 bg-jarvis-bg rounded relative">
                    <div className="h-full flex rounded">
                      <div className="h-full bg-jarvis-green rounded-l"
                           style={{ width: `${fiveWidth}%` }} />
                      <div className="h-full bg-jarvis-yellow"
                           style={{ width: `${fourWidth}%` }} />
                    </div>
                  </div>
                  <div className="text-white font-mono text-sm w-8">{m.total}</div>
                  <div className="text-jarvis-green font-mono text-xs w-16">
                    ★{m.five_star} ☆{m.four_star}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex gap-6 mt-6 text-xs font-mono text-jarvis-dim">
            <span><span className="text-jarvis-green">█</span> 5-star (Verified OON)</span>
            <span><span className="text-jarvis-yellow">█</span> 4-star (Unverified commercial)</span>
          </div>
        </div>
      )}

      {/* 5-Star Calls Tab */}
      {activeTab === 'calls' && (
        <div className="bg-jarvis-surface border border-jarvis-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-jarvis-border">
            <div className="text-jarvis-green font-mono font-bold">
              ALL 5-STAR CALLS — Last 12 Months
            </div>
            <div className="text-jarvis-dim font-mono text-xs mt-1">
              Verified commercial OON insurance or private pay
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-jarvis-border">
                  {['DATE','SOURCE/CAMPAIGN','DURATION','TAGS','NEW CALLER'].map(h => (
                    <th key={h} className="text-left p-3 text-jarvis-dim
                                          font-mono text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.five_star_calls.map((call, i) => (
                  <tr key={i}
                      className="border-b border-jarvis-border border-opacity-30
                                 hover:bg-jarvis-bg transition-colors">
                    <td className="p-3 font-mono text-xs text-jarvis-dim">
                      {call.date ? new Date(call.date).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3 font-mono text-xs text-white">
                      {call.source}
                    </td>
                    <td className="p-3 font-mono text-xs text-jarvis-cyan">
                      {Math.floor(call.duration/60)}m {call.duration%60}s
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 flex-wrap">
                        {(call.tags || []).slice(0,3).map((tag: string) => (
                          <span key={tag}
                                className="text-xs font-mono text-jarvis-green
                                           bg-jarvis-green bg-opacity-10
                                           px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-xs">
                      <span className={call.isNewCaller
                        ? 'text-jarvis-green' : 'text-jarvis-dim'}>
                        {call.isNewCaller ? 'NEW' : 'REPEAT'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
