'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Session {
  conversation_id: string
  agent_id: string
  agent_name: string
  title: string
  message_count: number
  started_at: string
  last_message_at: string
}

interface Message {
  id: number
  agent_name: string
  user_message: string
  agent_response: string
  created_at: string
}

function ConversationsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const userId = searchParams.get('user_id')
  const userName = searchParams.get('name') || 'User'

  const [sessions, setSessions] = useState<Session[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)

  function getToken() {
    return localStorage.getItem('jarvis_token') || ''
  }

  useEffect(() => {
    const role = localStorage.getItem('jarvis_role')
    if (role !== 'admin' || !userId) {
      router.push('/dashboard/admin')
      return
    }
    fetch(`/api/proxy/api/admin/users/${userId}/conversations`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
      .then(r => r.json())
      .then(data => setSessions(data.sessions || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router, userId])

  async function loadMessages(sessionId: string) {
    setActiveSession(sessionId)
    setLoadingMsgs(true)
    try {
      const res = await fetch(
        `/api/proxy/api/admin/users/${userId}/conversations/${sessionId}/messages`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      )
      const data = await res.json()
      setMessages(data.messages || [])
    } catch {
      setMessages([])
    } finally {
      setLoadingMsgs(false)
    }
  }

  function formatDate(d: string | null) {
    if (!d) return '—'
    const date = new Date(d.endsWith('Z') ? d : d + 'Z')
    return date.toLocaleString('en-US', {
      timeZone: 'America/Phoenix',
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    })
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/admin')}
          className="text-jarvis-cyan font-mono text-sm mb-3 cursor-pointer hover:underline"
        >
          &larr; Back to Users
        </button>
        <h1 className="text-lg md:text-2xl font-bold text-jarvis-cyan font-mono tracking-widest">
          {decodeURIComponent(userName).toUpperCase()}&apos;S CONVERSATIONS
        </h1>
      </div>

      {loading && (
        <div className="text-jarvis-dim font-mono text-sm animate-pulse">Loading...</div>
      )}

      {!loading && sessions.length === 0 && (
        <div className="text-jarvis-dim font-mono text-sm">No conversations found.</div>
      )}

      <div className="flex gap-4 flex-col md:flex-row">
        {/* Session list */}
        {!loading && sessions.length > 0 && (
          <div className="w-full md:w-80 flex-shrink-0 border border-jarvis-border rounded-lg overflow-hidden">
            {sessions.map(s => (
              <div
                key={s.conversation_id}
                onClick={() => loadMessages(s.conversation_id)}
                className={`p-3 border-b border-jarvis-border border-opacity-30 cursor-pointer
                           transition-colors ${
                  activeSession === s.conversation_id
                    ? 'bg-jarvis-cyan bg-opacity-5 border-l-2 border-l-jarvis-cyan'
                    : 'hover:bg-jarvis-surface'
                }`}
              >
                <div className="text-jarvis-text text-xs font-mono truncate mb-1">
                  {s.title}
                </div>
                <div className="flex items-center justify-between text-jarvis-dim text-xs font-mono">
                  <span>Agent {s.agent_id} · {s.message_count} msgs</span>
                  <span>{formatDate(s.last_message_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Message viewer */}
        {activeSession && (
          <div className="flex-1 border border-jarvis-border rounded-lg overflow-hidden min-w-0">
            <div className="p-3 bg-jarvis-surface border-b border-jarvis-border">
              <div className="text-jarvis-cyan font-mono text-sm font-bold">
                {sessions.find(s => s.conversation_id === activeSession)?.title || 'Conversation'}
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
              {loadingMsgs ? (
                <div className="text-jarvis-dim font-mono text-sm animate-pulse">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-jarvis-dim font-mono text-sm">No messages.</div>
              ) : (
                messages.map(m => (
                  <div key={m.id} className="space-y-2">
                    <div className="flex justify-end">
                      <div className="max-w-[80%] bg-jarvis-cyan bg-opacity-10 border border-jarvis-cyan
                                     border-opacity-20 rounded-lg px-3 py-2">
                        <div className="text-xs text-jarvis-dim font-mono mb-1">
                          USER · {formatDate(m.created_at)}
                        </div>
                        <div className="text-sm font-mono text-jarvis-cyan whitespace-pre-wrap break-words">
                          {m.user_message}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="max-w-[80%] bg-jarvis-surface border border-jarvis-border
                                     rounded-lg px-3 py-2">
                        <div className="text-xs text-jarvis-dim font-mono mb-1">
                          Agent {m.agent_name || '??'} · {formatDate(m.created_at)}
                        </div>
                        <div className="text-sm font-mono text-jarvis-text whitespace-pre-wrap break-words">
                          {m.agent_response}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ConversationsPage() {
  return (
    <Suspense fallback={
      <div className="text-jarvis-dim font-mono text-sm animate-pulse">Loading...</div>
    }>
      <ConversationsContent />
    </Suspense>
  )
}
