'use client'
import { useEffect, useState, useCallback } from 'react'

type Approval = {
  id: string
  status?: string
  campaign?: string
  action_type?: string
  changeType?: string
  recommendation?: string
  rationale?: string
  value_at_stake?: string
  created_at?: string
  resolved_at?: string
  resolved_by?: string
  denial_reason?: string
  data?: {
    campaign_resource_name?: string
    current_budget?: number
    new_budget?: number
    change_pct?: number
  }
}

async function approvalsFetch(
  path: string,
  token: string,
  method: 'GET' | 'POST' = 'GET'
) {
  const res = await fetch(`/api/proxy${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`${res.status} ${body.slice(0, 160)}`)
  }
  return res.json()
}

export default function ApprovalsPage() {
  const [token, setToken] = useState<string>('')
  const [pending, setPending] = useState<Approval[]>([])
  const [resolved, setResolved] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    setToken(localStorage.getItem('jarvis_token') || '')
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const pendingRes = await approvalsFetch('/api/approvals/pending', token).catch(
        (e: any) => ({ __err: e?.message || 'Failed' })
      )
      const allRes = await approvalsFetch('/api/approvals', token).catch(
        (e: any) => ({ __err: e?.message || 'Failed' })
      )

      const pendingOk = pendingRes && !pendingRes.__err
      const allOk = allRes && !allRes.__err

      const pendList: Approval[] = pendingOk
        ? (pendingRes.approvals || pendingRes.pending || []).filter(
            (x: Approval) => String(x.status || 'PENDING').toUpperCase() === 'PENDING'
          )
        : []

      const fallbackPending: Approval[] =
        !pendingOk && allOk
          ? (allRes.approvals || []).filter(
              (x: Approval) => String(x.status || '').toUpperCase() === 'PENDING'
            )
          : []

      setPending(pendList.length ? pendList : fallbackPending)
      setResolved(
        allOk
          ? (allRes.approvals || []).filter(
              (x: Approval) => String(x.status || '').toUpperCase() !== 'PENDING'
            )
          : []
      )

      if (!pendingOk && !allOk) {
        setErr(
          `Approvals endpoint unavailable — ${pendingRes?.__err || allRes?.__err || 'unknown error'}`
        )
      }
    } catch (e: any) {
      setErr(e?.message || 'Failed to load approvals')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token !== '') load()
  }, [token, load])

  async function act(id: string, kind: 'approve' | 'deny') {
    setBusyId(id)
    setNotice(null)
    try {
      await approvalsFetch(`/api/approvals/${id}/${kind}`, token, 'POST')
      setNotice(`Approval ${id} ${kind === 'approve' ? 'approved' : 'denied'}.`)
      await load()
    } catch (e: any) {
      setNotice(`Failed to ${kind}: ${e?.message || 'unknown error'}`)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg md:text-2xl font-bold font-mono text-jarvis-cyan tracking-widest">
          PENDING APPROVALS
        </h1>
        <button
          onClick={load}
          disabled={loading}
          className="bg-jarvis-surface border border-jarvis-cyan border-opacity-40 text-jarvis-cyan px-3 py-1.5 rounded font-mono text-xs tracking-widest hover:bg-opacity-80 disabled:opacity-50"
        >
          {loading ? 'LOADING…' : 'REFRESH'}
        </button>
      </div>

      {notice && (
        <div className="bg-jarvis-surface border border-jarvis-cyan border-opacity-30 rounded-lg p-3 text-sm font-mono text-jarvis-cyan">
          {notice}
        </div>
      )}

      {err && (
        <div className="bg-jarvis-surface border border-jarvis-red border-opacity-40 rounded-lg p-4 text-sm font-mono text-jarvis-red flex items-start justify-between gap-4">
          <div>
            <div className="font-bold mb-1">FAILED TO LOAD APPROVALS</div>
            <div className="opacity-80">{err}</div>
          </div>
          <button
            onClick={load}
            className="bg-jarvis-red bg-opacity-20 border border-jarvis-red text-jarvis-red px-3 py-1.5 rounded font-mono text-xs font-bold tracking-widest hover:bg-opacity-30 whitespace-nowrap"
          >
            RETRY
          </button>
        </div>
      )}

      <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-4">
        <h2 className="text-jarvis-cyan font-mono font-bold mb-4 tracking-wider text-sm">
          ⏳ PENDING {loading ? '· LOADING…' : `· ${pending.length}`}
        </h2>

        {loading ? (
          <div className="text-jarvis-dim font-mono text-sm py-10 text-center animate-pulse">
            Loading approvals...
          </div>
        ) : !err && pending.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-jarvis-green font-mono font-bold text-sm">
              No pending approvals.
            </div>
            <div className="text-jarvis-dim text-xs font-mono mt-2">
              Agent 07 will send approval requests here when recommending Google Ads
              changes that need your sign-off.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((a) => (
              <ApprovalCard
                key={a.id}
                approval={a}
                kind="pending"
                onAct={act}
                busy={busyId === a.id}
              />
            ))}
          </div>
        )}
      </div>

      <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-4">
        <h2 className="text-jarvis-cyan font-mono font-bold mb-4 tracking-wider text-sm">
          📜 APPROVAL HISTORY · {resolved.length}
        </h2>

        {!loading && resolved.length === 0 ? (
          <div className="text-jarvis-dim font-mono text-sm py-10 text-center">
            No resolved approvals yet.
          </div>
        ) : (
          <div className="space-y-3">
            {resolved.map((a) => (
              <ApprovalCard key={a.id} approval={a} kind="history" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ApprovalCard({
  approval,
  kind,
  onAct,
  busy,
}: {
  approval: Approval
  kind: 'pending' | 'history'
  onAct?: (id: string, kind: 'approve' | 'deny') => void
  busy?: boolean
}) {
  const a = approval
  const d = a.data || {}
  const pct = d.change_pct ?? null
  const status = String(a.status || 'PENDING').toUpperCase()

  const statusClass =
    status === 'APPROVED'
      ? 'bg-jarvis-green bg-opacity-20 text-jarvis-green'
      : status === 'DENIED' || status === 'REJECTED'
      ? 'bg-jarvis-red bg-opacity-20 text-jarvis-red'
      : 'bg-jarvis-yellow bg-opacity-20 text-jarvis-yellow'

  const borderClass =
    kind === 'pending' ? 'border-jarvis-yellow border-opacity-30' : 'border-jarvis-border'

  const headerCampaign =
    a.campaign ||
    (d.campaign_resource_name
      ? d.campaign_resource_name.match(/campaigns\/(\d+)/)?.[1]
        ? `Campaign ${d.campaign_resource_name.match(/campaigns\/(\d+)/)?.[1]}`
        : d.campaign_resource_name
      : a.changeType || '—')

  const actionLabel = String(a.action_type || a.changeType || 'ACTION').replace(/_/g, ' ')
  const body = a.rationale || a.recommendation

  return (
    <div className={`bg-jarvis-bg border rounded-lg p-4 ${borderClass}`}>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-3">
        <div>
          <div className="text-jarvis-cyan font-mono font-bold tracking-wider">
            {headerCampaign}
          </div>
          <div className="text-xs font-mono text-jarvis-dim tracking-wider uppercase mt-1">
            {actionLabel}
          </div>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-xs font-mono tracking-wider font-bold ${statusClass}`}
        >
          {status}
        </span>
      </div>

      {body && (
        <div className="border-l-2 border-jarvis-cyan border-opacity-50 pl-3 py-1 mb-3 text-sm font-mono text-jarvis-text whitespace-pre-wrap">
          {body}
        </div>
      )}

      {(d.current_budget != null || d.new_budget != null) && (
        <div className="flex flex-wrap items-center gap-4 mb-3 text-sm font-mono">
          <div>
            <div className="text-xs text-jarvis-dim tracking-wider">CURRENT</div>
            <div className="text-jarvis-text font-bold">${d.current_budget ?? '—'}</div>
          </div>
          <div className="text-jarvis-dim">→</div>
          <div>
            <div className="text-xs text-jarvis-dim tracking-wider">PROPOSED</div>
            <div className="text-jarvis-green font-bold">${d.new_budget ?? '—'}</div>
          </div>
          {pct != null && (
            <div>
              <div className="text-xs text-jarvis-dim tracking-wider">CHANGE</div>
              <div
                className={`font-bold ${pct >= 0 ? 'text-jarvis-green' : 'text-jarvis-red'}`}
              >
                {pct >= 0 ? '+' : ''}
                {pct}%
              </div>
            </div>
          )}
        </div>
      )}

      {a.value_at_stake && (
        <div className="text-xs font-mono text-jarvis-dim mb-3">
          <span className="text-jarvis-cyan tracking-wider mr-2">VALUE:</span>
          {a.value_at_stake}
        </div>
      )}

      {a.denial_reason && kind === 'history' && (
        <div className="text-xs font-mono text-jarvis-red mb-3">
          <span className="tracking-wider mr-2">REASON:</span>
          {a.denial_reason}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:justify-between gap-1 text-xs font-mono text-jarvis-dim tracking-wider">
        {a.created_at && (
          <span>
            CREATED{' '}
            {new Date(a.created_at).toLocaleString('en-US', {
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
        {a.resolved_at && (
          <span>
            RESOLVED{' '}
            {new Date(a.resolved_at).toLocaleString('en-US', {
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
        {a.resolved_by && <span>BY {String(a.resolved_by).toUpperCase()}</span>}
      </div>

      {kind === 'pending' && onAct && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onAct(a.id, 'approve')}
            disabled={busy}
            className="flex-1 bg-jarvis-green bg-opacity-20 border border-jarvis-green border-opacity-40 text-jarvis-green font-mono text-sm font-bold tracking-widest py-2 rounded hover:bg-opacity-30 disabled:opacity-50"
          >
            {busy ? '...' : '✅ APPROVE'}
          </button>
          <button
            onClick={() => onAct(a.id, 'deny')}
            disabled={busy}
            className="flex-1 bg-jarvis-red bg-opacity-20 border border-jarvis-red border-opacity-40 text-jarvis-red font-mono text-sm font-bold tracking-widest py-2 rounded hover:bg-opacity-30 disabled:opacity-50"
          >
            {busy ? '...' : '❌ DENY'}
          </button>
        </div>
      )}
    </div>
  )
}
