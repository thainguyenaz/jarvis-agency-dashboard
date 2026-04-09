'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const PHASE_LABELS: Record<string, string> = {
  'active': '● ACTIVE',
  'processing': '◌ PROCESSING',
  'monitor-only': '◉ MONITOR',
  'active-monitor-only': '◉ MONITOR',
  'phase-locked': '✕ LOCKED',
  'idle': '○ IDLE',
}

const PHASE_COLORS: Record<string, string> = {
  'active': 'text-jarvis-green',
  'processing': 'text-jarvis-cyan',
  'monitor-only': 'text-jarvis-yellow',
  'active-monitor-only': 'text-jarvis-yellow',
  'phase-locked': 'text-jarvis-red',
  'idle': 'text-jarvis-dim',
}

export default function AgentsPage() {
  const [agentData, setAgentData] = useState<any>(null)
  const [apiHealth, setApiHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      api.getAgentStatus(),
      api.getApiHealth(),
    ]).then(([agentRes, healthRes]) => {
      if (agentRes.status === 'fulfilled') setAgentData(agentRes.value)
      if (healthRes.status === 'fulfilled') setApiHealth(healthRes.value)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-jarvis-cyan font-mono animate-pulse">LOADING AGENT DATA...</div>
  if (!agentData) return (
    <div className="bg-jarvis-surface border border-jarvis-red border-opacity-30 rounded-lg p-8 text-center">
      <div className="text-jarvis-red font-mono font-bold mb-2">DATA UNAVAILABLE</div>
      <div className="text-jarvis-dim text-xs font-mono">
        Check VPS connection ·
        <button onClick={() => window.location.reload()} className="text-jarvis-cyan ml-1 hover:underline">Retry</button>
      </div>
    </div>
  )

  const agents = agentData?.agents || []
  const apiAgents = apiHealth?.agents || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-mono text-jarvis-cyan tracking-widest">AGENT ROSTER</h1>
        <div className="text-jarvis-dim text-xs font-mono">
          PHASE 1 — MONITOR & ADVISE ONLY
        </div>
      </div>

      {/* API Health Status */}
      {apiHealth && (
        <div className={`bg-jarvis-surface border rounded-lg p-4 ${
          apiHealth.status === 'ONLINE' ? 'border-jarvis-green border-opacity-50' : 'border-jarvis-red border-opacity-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-sm ${apiHealth.status === 'ONLINE' ? 'text-jarvis-green' : 'text-jarvis-red'}`}>●</span>
              <span className="text-xs font-mono text-jarvis-text">{apiHealth.agent || 'Jarvis Marketing Agency'}</span>
            </div>
            <span className={`text-xs font-mono font-bold ${
              apiHealth.status === 'ONLINE' ? 'text-jarvis-green' : 'text-jarvis-red'
            }`}>{apiHealth.status}</span>
          </div>
          {apiAgents.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {apiAgents.map((name: string) => (
                <span key={name} className="text-xs font-mono px-2 py-1 bg-jarvis-bg border border-jarvis-border rounded text-jarvis-dim">
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {['active', 'monitor-only', 'phase-locked', 'idle'].map(status => {
          const count = agents.filter((a: any) =>
            a.status === status || a.status === `active-${status}`
          ).length
          return (
            <div key={status} className="bg-jarvis-surface border border-jarvis-border rounded-lg p-3 text-center">
              <div className={`text-2xl font-bold font-mono ${PHASE_COLORS[status]}`}>{count}</div>
              <div className="text-xs font-mono text-jarvis-dim mt-1 capitalize">{status.replace('-', ' ')}</div>
            </div>
          )
        })}
      </div>

      <div className="bg-jarvis-surface border border-jarvis-border rounded-lg overflow-hidden">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-jarvis-border bg-jarvis-bg">
              <th className="text-left py-3 px-4 text-jarvis-dim">ID</th>
              <th className="text-left py-3 px-4 text-jarvis-dim">AGENT NAME</th>
              <th className="text-left py-3 px-4 text-jarvis-dim">STATUS</th>
              <th className="text-left py-3 px-4 text-jarvis-dim">CURRENT TASK</th>
              <th className="text-left py-3 px-4 text-jarvis-dim">PHASE</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent: any) => (
              <tr key={agent.id} className="border-b border-jarvis-border border-opacity-30 hover:bg-jarvis-bg transition-colors">
                <td className="py-3 px-4 text-jarvis-dim">{agent.id}</td>
                <td className="py-3 px-4 text-jarvis-text">{agent.name}</td>
                <td className={`py-3 px-4 font-bold ${PHASE_COLORS[agent.status] || 'text-jarvis-dim'}`}>
                  {PHASE_LABELS[agent.status] || agent.status}
                </td>
                <td className="py-3 px-4 text-jarvis-dim max-w-xs truncate">{agent.task || '—'}</td>
                <td className="py-3 px-4 text-jarvis-dim">{agent.phase || '—'}</td>
              </tr>
            ))}
            {agents.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-jarvis-dim">
                  No agent data available — agency service may be starting up
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
