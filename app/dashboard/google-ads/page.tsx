'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function GoogleAdsPage() {
  const [token, setToken] = useState('')
  const [performance, setPerformance] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([])

  useEffect(() => {
    const t = localStorage.getItem('jarvis_token') || ''
    setToken(t)
    loadAdsData(t)
  }, [])

  async function loadAdsData(t: string) {
    try {
      const [perf, camps] = await Promise.allSettled([
        api.getGoogleAdsPerformance(t),
        api.getGoogleAdsCampaigns(t),
      ])
      if (perf.status === 'fulfilled') setPerformance(perf.value)
      if (camps.status === 'fulfilled') setCampaigns(camps.value?.campaigns || [])
    } finally {
      setLoading(false)
    }
  }

  async function runAnalysis() {
    setAnalyzing(true)
    try {
      const res = await fetch('/api/analyze-ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ performance, campaigns })
      })
      const data = await res.json()
      setChatHistory(prev => [...prev, {
        role: 'agent',
        content: data.analysis
      }])
    } finally {
      setAnalyzing(false)
    }
  }

  async function sendChat() {
    if (!chatInput.trim()) return
    const userMsg = chatInput
    setChatInput('')
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }])

    try {
      const res = await fetch('/api/chat-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMsg,
          context: { performance, campaigns },
          history: chatHistory
        })
      })
      const data = await res.json()
      setChatHistory(prev => [...prev, { role: 'agent', content: data.reply }])
    } catch {
      setChatHistory(prev => [...prev, {
        role: 'agent',
        content: 'Error connecting to agent. Check VPS status.'
      }])
    }
  }

  const cpl = performance ?
    Math.round(performance.cost_per_conversion || 0) : 0

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-jarvis-cyan font-mono animate-pulse">LOADING ADS DATA...</div>
    </div>
  )

  if (!performance && campaigns.length === 0) return (
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-mono text-jarvis-cyan tracking-widest">
          GOOGLE ADS ANALYSIS
        </h1>
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="bg-jarvis-cyan text-jarvis-bg px-4 py-2 rounded font-mono text-sm
                     font-bold tracking-wider hover:bg-opacity-80 disabled:opacity-50"
        >
          {analyzing ? 'ANALYZING...' : '🎯 RUN AI ANALYSIS'}
        </button>
      </div>

      {/* Performance KPIs */}
      {performance && (
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'TOTAL SPEND', value: `$${(performance.spend/1000).toFixed(1)}K`,
              status: 'neutral' },
            { label: 'CLICKS', value: performance.clicks?.toLocaleString() || '—',
              status: 'neutral' },
            { label: 'CPC', value: `$${performance.cpc?.toFixed(2) || '—'}`,
              status: 'neutral' },
            { label: 'CONVERSIONS', value: Math.round(performance.conversions || 0).toString(),
              status: 'neutral' },
            { label: 'COST PER LEAD', value: `$${cpl}`,
              status: cpl > 400 ? 'critical' : cpl > 200 ? 'warn' : 'good' },
          ].map((m, i) => (
            <div key={i} className={`bg-jarvis-surface border rounded-lg p-3 ${
              m.status === 'critical' ? 'border-jarvis-red' :
              m.status === 'warn' ? 'border-jarvis-yellow' :
              m.status === 'good' ? 'border-jarvis-green' :
              'border-jarvis-border'
            }`}>
              <div className="text-xs font-mono text-jarvis-dim mb-1">{m.label}</div>
              <div className={`text-xl font-bold font-mono ${
                m.status === 'critical' ? 'text-jarvis-red' :
                m.status === 'warn' ? 'text-jarvis-yellow' :
                m.status === 'good' ? 'text-jarvis-green' :
                'text-jarvis-cyan'
              }`}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Guardrails reminder */}
      <div className="bg-jarvis-surface border border-jarvis-yellow border-opacity-30
                      rounded-lg p-4">
        <div className="text-jarvis-yellow font-mono text-sm font-bold mb-2">
          ⚠️ GOOGLE ADS GUARDRAILS ACTIVE
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm font-mono text-jarvis-dim">
          <div>• Max 2 changes per campaign per week</div>
          <div>• Max bid adjustment: 20% (safe: 15%)</div>
          <div>• Budget changes require approval if &gt;30%</div>
          <div>• Never change during learning phase (7 days)</div>
          <div>• Bid strategy changes always need Thai approval</div>
          <div>• Phase 1: Analysis only — no execution</div>
        </div>
      </div>

      {/* Campaign table */}
      {campaigns.length > 0 && (
        <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-4">
          <h2 className="text-jarvis-cyan font-mono font-bold mb-4 tracking-wider">
            CAMPAIGN PERFORMANCE
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="text-jarvis-dim border-b border-jarvis-border">
                  <th className="text-left py-2 pr-4">CAMPAIGN</th>
                  <th className="text-right py-2 pr-4">STATUS</th>
                  <th className="text-right py-2 pr-4">SPEND</th>
                  <th className="text-right py-2 pr-4">CLICKS</th>
                  <th className="text-right py-2 pr-4">CONV</th>
                  <th className="text-right py-2">CPL</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c: any, i: number) => {
                  const campCpl = c.conversions ?
                    Math.round((c.spend || 0) / c.conversions) : 0
                  return (
                    <tr key={i} className="border-b border-jarvis-border border-opacity-30
                                          hover:bg-jarvis-bg transition-colors">
                      <td className="py-2 pr-4 text-jarvis-text max-w-xs truncate">
                        {c.campaignName || 'Unknown'}
                      </td>
                      <td className="py-2 pr-4 text-right">
                        <span className={`px-2 py-0.5 rounded text-sm ${
                          c.status === 2
                            ? 'bg-jarvis-green bg-opacity-20 text-jarvis-green'
                            : 'bg-jarvis-red bg-opacity-20 text-jarvis-red'
                        }`}>
                          {c.status === 2 ? 'ENABLED' : 'PAUSED'}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-right text-jarvis-text">
                        ${(c.spend || 0).toFixed(0)}
                      </td>
                      <td className="py-2 pr-4 text-right text-jarvis-text">
                        {c.clicks?.toLocaleString() || '—'}
                      </td>
                      <td className="py-2 pr-4 text-right text-jarvis-text">
                        {c.conversions ? Math.round(c.conversions) : '—'}
                      </td>
                      <td className={`py-2 text-right font-bold ${
                        campCpl > 400 ? 'text-jarvis-red' :
                        campCpl > 200 ? 'text-jarvis-yellow' :
                        'text-jarvis-green'
                      }`}>
                        ${campCpl || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Agent Chat */}
      <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-4">
        <h2 className="text-jarvis-cyan font-mono font-bold mb-4 tracking-wider">
          💬 AGENT 07 — GOOGLE ADS ADVISOR
        </h2>
        <div className="h-[500px] overflow-y-auto bg-jarvis-bg rounded p-3 mb-3 space-y-3">
          {chatHistory.length === 0 && (
            <div className="text-jarvis-dim text-sm font-mono text-center mt-8">
              Click &quot;RUN AI ANALYSIS&quot; or ask Agent 07 a question below
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} className={`text-sm font-mono ${
              msg.role === 'user' ? 'text-right' : 'text-left'
            }`}>
              <span className={`inline-block max-w-lg px-3 py-2 rounded ${
                msg.role === 'user'
                  ? 'bg-jarvis-cyan bg-opacity-20 text-jarvis-cyan'
                  : 'bg-jarvis-surface border border-jarvis-border text-jarvis-text'
              }`}>
                <span className="text-jarvis-dim block mb-1">
                  {msg.role === 'user' ? 'YOU' : '🤖 AGENT 07'}
                </span>
                {msg.content}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <textarea
            rows={3}
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
            placeholder="Ask Agent 07 about your Google Ads performance..."
            className="flex-1 bg-jarvis-bg border border-jarvis-border rounded px-3 py-2
                       text-jarvis-text font-mono text-sm focus:outline-none
                       focus:border-jarvis-cyan resize-none"
          />
          <button
            onClick={sendChat}
            className="bg-jarvis-cyan text-jarvis-bg px-4 py-2 rounded font-mono
                       text-sm font-bold hover:bg-opacity-80"
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  )
}
