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
          label: 'Overall Occupancy',
          value: censusData ? `${rtcPct}%` : '—',
          sub: censusData ? `${rtcOccupied}/20 beds` : 'No data',
          status: !censusData ? 'neutral' :
            rtcPct < 50 ? 'critical' :
            rtcPct < 70 ? 'warn' : 'good'
        },
        {
          label: 'Ad Spend (30d)',
          value: adsData ? `$${((adsData.summary?.total_spend || 0) / 1000).toFixed(1)}K` : '—',
          sub: adsData ? `$${Math.round((adsData.summary?.total_spend || 0) / 30)}/day avg` : 'No data',
          status: 'neutral'
        },
        {
          label: 'Cost per Lead',
          value: adsData ? `$${Math.round(adsData.summary?.cost_per_conversion || 0)}` : '—',
          sub: 'Target: <$150',
          status: !adsData ? 'neutral' :
            (adsData.summary?.cost_per_conversion || 0) > 400 ? 'critical' :
            (adsData.summary?.cost_per_conversion || 0) > 200 ? 'warn' : 'good'
        },
        {
          label: 'Call Answer Rate',
          value: ctmData ? `${ctmData.answer_rate}%` : '—',
          sub: ctmData ? `${ctmData.total_calls_30d} total calls` : 'No data',
          status: !ctmData ? 'neutral' :
            ctmData.answer_rate < 60 ? 'critical' :
            ctmData.answer_rate < 75 ? 'warn' : 'good'
        },
        {
          label: 'Open Deals',
          value: hubspotData ? `${hubspotData.deals_count || 0}` : '—',
          sub: hubspotData
            ? `${(hubspotData.recent_deals || []).filter((d: any) => d.stage === 'closedwon').length} closed won`
            : 'No data',
          status: 'neutral'
        },
        {
          label: 'Active Agents',
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
    good: 'border-jarvis-green/40 text-jarvis-green',
    warn: 'border-jarvis-yellow/40 text-jarvis-yellow',
    critical: 'border-jarvis-red/40 text-jarvis-red',
    neutral: 'border-jarvis-border text-jarvis-cyan',
  }

  const statusDot = {
    good: 'bg-jarvis-green',
    warn: 'bg-jarvis-yellow',
    critical: 'bg-jarvis-red',
    neutral: 'bg-jarvis-dim',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-jarvis-dim text-sm animate-pulse">
          Loading data...
        </div>
      </div>
    )
  }

  if (metrics.length === 0) return (
    <div className="bg-jarvis-surface border border-jarvis-red/20 rounded-card p-8 text-center">
      <div className="text-jarvis-red font-medium mb-2">Data Unavailable</div>
      <div className="text-jarvis-dim text-xs">
        Check VPS connection
        <span className="mx-2">·</span>
        <button onClick={() => window.location.reload()} className="text-jarvis-cyan hover:underline cursor-pointer">Retry</button>
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg md:text-xl font-medium text-jarvis-text tracking-wide">
            Command Overview
          </h1>
          <div className="text-jarvis-dim text-xs mt-1 hidden sm:block">
            {new Date().toLocaleString('en-US', { timeZone: 'America/Phoenix' })} MST
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {metrics.map((m, i) => (
          <div
            key={i}
            className={`bg-jarvis-surface border rounded-card p-4 md:p-5 shadow-card ${statusColors[m.status]}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-1.5 h-1.5 rounded-full ${statusDot[m.status]}`} />
              <div className="text-xs text-jarvis-dim truncate">{m.label}</div>
            </div>
            <div className="text-2xl md:text-3xl font-semibold font-mono tracking-tight">{m.value}</div>
            {m.sub && <div className="text-xs text-jarvis-dim mt-2 truncate">{m.sub}</div>}
          </div>
        ))}
      </div>

      {/* Agent Roster */}
      <div>
        <h2 className="text-sm font-medium text-jarvis-text mb-4 tracking-wide">
          Agent Roster
          <span className="text-jarvis-dim font-normal ml-2">Phase 1 — Monitor Only</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {agents.map((agent: any) => (
            <div
              key={agent.id}
              className="bg-jarvis-surface border border-jarvis-border rounded-card p-3 shadow-card"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-jarvis-dim text-xs">
                  Agent {agent.id}
                </span>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  agent.status === 'active' ? 'bg-jarvis-green' :
                  agent.status === 'monitor-only' ? 'bg-jarvis-yellow' :
                  agent.status === 'phase-locked' ? 'bg-jarvis-red' :
                  'bg-jarvis-dim'
                }`} />
              </div>
              <div className="text-jarvis-text text-xs truncate">
                {agent.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
