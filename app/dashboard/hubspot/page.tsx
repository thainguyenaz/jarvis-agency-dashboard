'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function HubSpotPage() {
  const [pipeline, setPipeline] = useState<any>(null)
  const [contacts, setContacts] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('jarvis_token') || ''
    Promise.allSettled([
      api.getHubSpotPipeline(t),
      api.getHubSpotContacts(t),
    ]).then(([pipeRes, contactRes]) => {
      if (pipeRes.status === 'fulfilled') setPipeline(pipeRes.value)
      if (contactRes.status === 'fulfilled') setContacts(contactRes.value)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-jarvis-cyan font-mono animate-pulse">LOADING HUBSPOT DATA...</div>
  if (!pipeline) return (
    <div className="bg-jarvis-surface border border-jarvis-red border-opacity-30 rounded-lg p-8 text-center">
      <div className="text-jarvis-red font-mono font-bold mb-2">DATA UNAVAILABLE</div>
      <div className="text-jarvis-dim text-xs font-mono">
        Check VPS connection ·
        <button onClick={() => window.location.reload()} className="text-jarvis-cyan ml-1 hover:underline">Retry</button>
      </div>
    </div>
  )

  const stages = pipeline.deals_by_stage || {}
  const newContacts = contacts?.new_contacts_30d || pipeline.new_contacts_30d || 0
  const leadSources = Object.entries(contacts?.lead_sources || pipeline.lead_sources || {})
    .map(([source, count]) => ({ source, count: count as number }))
    .sort((a, b) => b.count - a.count)
  const totalLeadSources = leadSources.reduce((s, l) => s + l.count, 0) || 1

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-mono text-jarvis-cyan tracking-widest">HUBSPOT PIPELINE</h1>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'TOTAL DEALS', value: pipeline.total_deals || 0, status: 'neutral' },
          { label: 'CLOSED WON', value: stages.closedwon?.count || 0, status: 'good' },
          { label: 'NEW CONTACTS (30D)', value: newContacts, status: 'neutral' },
        ].map((m, i) => (
          <div key={i} className={`bg-jarvis-surface border rounded-lg p-4 ${
            m.status === 'good' ? 'border-jarvis-green' : 'border-jarvis-border'
          }`}>
            <div className="text-xs font-mono text-jarvis-dim mb-1">{m.label}</div>
            <div className={`text-3xl font-bold font-mono ${
              m.status === 'good' ? 'text-jarvis-green' : 'text-jarvis-cyan'
            }`}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-4">
        <h2 className="text-jarvis-cyan font-mono font-bold mb-4 tracking-wider">DEALS BY STAGE</h2>
        <div className="space-y-2">
          {Object.entries(stages).map(([stage, data]: [string, any]) => (
            <div key={stage} className="flex items-center justify-between py-2 border-b border-jarvis-border border-opacity-30">
              <div className="text-xs font-mono text-jarvis-text capitalize">{stage.replace(/([A-Z])/g, ' $1').trim()}</div>
              <div className="text-xs font-mono text-jarvis-cyan">{data?.count || 0} deals</div>
            </div>
          ))}
        </div>
      </div>

      {leadSources.length > 0 && (
        <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-4">
          <h2 className="text-jarvis-cyan font-mono font-bold mb-4 tracking-wider">LEAD SOURCES (30D)</h2>
          <div className="space-y-3">
            {leadSources.map((s, i) => {
              const pct = Math.round((s.count / totalLeadSources) * 100)
              return (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-40 text-xs font-mono text-jarvis-text truncate">
                    {s.source.replace(/_/g, ' ')}
                  </div>
                  <div className="flex-1 bg-jarvis-bg rounded-full h-2">
                    <div
                      className="bg-jarvis-green h-2 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-xs font-mono text-jarvis-green w-16 text-right">
                    {s.count} ({pct}%)
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {(pipeline.total_pipeline_value || 0) === 0 && (
        <div className="bg-jarvis-surface border border-jarvis-yellow border-opacity-30 rounded-lg p-4">
          <div className="text-jarvis-yellow font-mono text-xs font-bold mb-2">⚠️ DATA QUALITY ALERT</div>
          <div className="text-jarvis-dim text-xs font-mono">
            All deals have $0 pipeline value. Your team needs to add dollar amounts to HubSpot deals for accurate pipeline reporting.
          </div>
        </div>
      )}

      {pipeline.warning && (
        <div className="bg-jarvis-surface border border-jarvis-yellow border-opacity-30 rounded-lg p-4">
          <div className="text-jarvis-yellow font-mono text-xs font-bold mb-2">⚠️ STALE DATA</div>
          <div className="text-jarvis-dim text-xs font-mono">{pipeline.warning}</div>
        </div>
      )}
    </div>
  )
}
