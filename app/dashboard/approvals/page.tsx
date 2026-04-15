'use client'
import { useEffect, useState } from 'react'

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('jarvis_token') || ''
    fetch('/api/proxy/api/agents/pending-approvals', {
      headers: { Authorization: `Bearer ${t}` }
    })
      .then(r => {
        if (!r.ok) return []
        return r.json().then(d => d.approvals || d || [])
      })
      .then(setApprovals)
      .catch(() => setApprovals([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-jarvis-cyan font-mono animate-pulse">LOADING APPROVALS...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-lg md:text-2xl font-bold font-mono text-jarvis-cyan tracking-widest">PENDING APPROVALS</h1>

      {approvals.length === 0 ? (
        <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-12 text-center">
          <div className="text-4xl mb-4">✅</div>
          <div className="text-jarvis-green font-mono font-bold">NO PENDING APPROVALS</div>
          <div className="text-jarvis-dim text-xs font-mono mt-2">
            Agent 07 will send approval requests here when recommending Google Ads changes requiring your sign-off.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((a: any) => (
            <div key={a.id} className="bg-jarvis-surface border border-jarvis-yellow border-opacity-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-jarvis-yellow font-mono font-bold text-sm">
                  🔐 {a.changeType}
                </div>
                <div className="text-jarvis-dim text-xs font-mono">
                  {new Date(a.created_at).toLocaleString()}
                </div>
              </div>
              <div className="text-jarvis-text text-xs font-mono mb-4">{a.recommendation}</div>
              <div className="flex gap-3">
                <button className="bg-jarvis-green bg-opacity-20 border border-jarvis-green text-jarvis-green px-4 py-2 rounded font-mono text-xs font-bold hover:bg-opacity-30">
                  ✅ APPROVE
                </button>
                <button className="bg-jarvis-red bg-opacity-20 border border-jarvis-red text-jarvis-red px-4 py-2 rounded font-mono text-xs font-bold hover:bg-opacity-30">
                  ❌ DENY
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
