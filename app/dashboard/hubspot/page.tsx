'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function HubSpotPage() {
  const [pipeline, setPipeline] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('jarvis_token') || ''
    api.getHubSpotPipeline(t).then(setPipeline).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-jarvis-cyan font-mono animate-pulse">LOADING HUBSPOT DATA...</div>
  if (!pipeline) return <div className="text-jarvis-red font-mono">HubSpot data unavailable</div>

  const stages = pipeline.deals_by_stage || {}

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-mono text-jarvis-cyan tracking-widest">HUBSPOT PIPELINE</h1>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'TOTAL DEALS', value: pipeline.total_deals || 0, status: 'neutral' },
          { label: 'CLOSED WON', value: stages.closedwon?.count || 0, status: 'good' },
          { label: 'PIPELINE VALUE', value: `$${(pipeline.total_pipeline_value || 0).toLocaleString()}`, status: 'neutral' },
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

      <div className="bg-jarvis-surface border border-jarvis-yellow border-opacity-30 rounded-lg p-4">
        <div className="text-jarvis-yellow font-mono text-xs font-bold mb-2">⚠️ DATA QUALITY ALERT</div>
        <div className="text-jarvis-dim text-xs font-mono">
          All deals have $0 pipeline value. Your team needs to add dollar amounts to HubSpot deals for accurate pipeline reporting.
        </div>
      </div>
    </div>
  )
}
