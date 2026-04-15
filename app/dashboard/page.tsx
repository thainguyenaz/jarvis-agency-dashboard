'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface MetricCard {
  label: string
  value: string
  sub?: string
  status: 'good' | 'warn' | 'critical' | 'neutral'
}

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<MetricCard[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('jarvis_token') || ''
    loadData(t)
  }, [])

  async function loadData(t: string) {
    try {
      const [census, ads, ctm, hubspot, agentStatus] = await Promise.allSettled([
        api.getCensus(t),
        api.getGoogleAdsPerformance(t),
        api.getCTMSummary(t),
        api.getHubSpotPipeline(t),
        api.getAgentStatus(),
      ])

      const censusData = census.status === 'fulfilled' ? census.value : null
      const adsData = ads.status === 'fulfilled' ? ads.value : null
      const ctmData = ctm.status === 'fulfilled' ? ctm.value : null
      const hubspotData = hubspot.status === 'fulfilled' ? hubspot.value : null
      const agentsData = agentStatus.status === 'fulfilled' ? agentStatus.value : null

      const rtcOccupied = (censusData?.church || 0) + (censusData?.frier || 0)
      const rtcPct = censusData?.occupancyPct || Math.round((rtcOccupied / 20) * 100)

      const cards: MetricCard[] = [
        {
          label: 'OVERALL OCCUPANCY',
          value: censusData ? `${rtcPct}%` : '—',
          sub: censusData ? `${rtcOccupied}/20 beds` : 'No data',
          status: !censusData ? 'neutral' :
            rtcPct < 50 ? 'critical' :
            rtcPct < 70 ? 'warn' : 'good'
        },
        {
          label: 'AD SPEND (30D)',
          value: adsData ? `$${((adsData.summary?.total_spend || 0) / 1000).toFixed(1)}K` : '—',
          sub: adsData ? `$${Math.round((adsData.summary?.total_spend || 0) / 30)}/day avg` : 'No data',
          status: 'neutral'
        },
        {
          label: 'COST PER LEAD',
          value: adsData ? `$${Math.round(adsData.summary?.cost_per_conversion || 0)}` : '—',
          sub: 'Target: <$150',
          status: !adsData ? 'neutral' :
            (adsData.summary?.cost_per_conversion || 0) > 400 ? 'critical' :
            (adsData.summary?.cost_per_conversion || 0) > 200 ? 'warn' : 'good'
        },
        {
          label: 'CALL ANSWER RATE',
          value: ctmData ? `${ctmData.answer_rate}%` : '—',
          sub: ctmData ? `${ctmData.total_calls_30d} total calls` : 'No data',
          status: !ctmData ? 'neutral' :
            ctmData.answer_rate < 60 ? 'critical' :
            ctmData.answer_rate < 75 ? 'warn' : 'good'
        },
        {
          label: 'OPEN DEALS',
          value: hubspotData ? `${hubspotData.deals_count || 0}` : '—',
          sub: hubspotData
            ? `${(hubspotData.recent_deals || []).filter((d: any) => d.stage === 'closedwon').length} closed won`
            : 'No data',
          status: 'neutral'
        },
        {
          label: 'ACTIVE AGENTS',
          value: agentsData?.agents ?
            `${agentsData.agents.filter((a: any) => a.status === 'active').length}/20` : '—',
          sub: 'Phase 1: Monitor only',
          status: 'good'
        },
      ]

      setMetrics(cards)
      if (agentsData?.agents) setAgents(agentsData.agents)
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const statusColors = {
    good: 'border-jarvis-green text-jarvis-green',
    warn: 'border-jarvis-yellow text-jarvis-yellow',
    critical: 'border-jarvis-red text-jarvis-red',
    neutral: 'border-jarvis-border text-jarvis-cyan',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-jarvis-cyan font-mono animate-pulse">
          LOADING JARVIS DATA...
        </div>
      </div>
    )
  }

  if (metrics.length === 0) return (
    <div className="bg-jarvis-surface border border-jarvis-red border-opacity-30 rounded-lg p-8 text-center">
      <div className="text-jarvis-red font-mono font-bold mb-2">DATA UNAVAILABLE</div>
      <div className="text-jarvis-dim text-xs font-mono">
        Check VPS connection ·
        <button onClick={() => window.location.reload()} className="text-jarvis-cyan ml-1 hover:underline">Retry</button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg md:text-2xl font-bold font-mono text-jarvis-cyan tracking-widest">
          COMMAND OVERVIEW
        </h1>
        <div className="text-jarvis-dim text-xs font-mono flex-shrink-0 hidden sm:block">
          {new Date().toLocaleString('en-US', { timeZone: 'America/Phoenix' })} MST
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {metrics.map((m, i) => (
          <div
            key={i}
            className={`bg-jarvis-surface border rounded-lg p-3 md:p-4 ${statusColors[m.status]}`}
          >
            <div className="text-xs font-mono opacity-60 mb-1 truncate">{m.label}</div>
            <div className="text-xl md:text-3xl font-bold font-mono">{m.value}</div>
            {m.sub && <div className="text-xs font-mono opacity-50 mt-1 truncate">{m.sub}</div>}
          </div>
        ))}
      </div>

      {/* Agent Roster */}
      <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-4">
        <h2 className="text-jarvis-cyan font-mono font-bold mb-4 tracking-wider">
          AGENT ROSTER — PHASE 1 (MONITOR ONLY)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {agents.map((agent: any) => (
            <div
              key={agent.id}
              className="bg-jarvis-bg border border-jarvis-border rounded p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-jarvis-dim text-xs font-mono">
                  AGENT {agent.id}
                </span>
                <span className={`text-xs font-mono ${
                  agent.status === 'active' ? 'text-jarvis-green' :
                  agent.status === 'monitor-only' ? 'text-jarvis-yellow' :
                  agent.status === 'phase-locked' ? 'text-jarvis-red' :
                  'text-jarvis-dim'
                }`}>
                  ● {agent.status}
                </span>
              </div>
              <div className="text-jarvis-text text-xs font-mono truncate">
                {agent.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
