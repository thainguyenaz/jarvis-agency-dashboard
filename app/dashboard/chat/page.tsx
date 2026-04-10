'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const AGENTS = [
  { id: '01', name: 'Sr CMO Orchestrator', role: 'CMO' },
  { id: '03', name: 'Sr SEO Expert', role: 'SEO' },
  { id: '07', name: 'Google Paid Buyer', role: 'PAID_MEDIA' },
  { id: '11', name: 'Reputation Directory Agent', role: 'REPUTATION' },
  { id: '18', name: 'Rank Tracker', role: 'RANK_TRACKER' },
  { id: '20', name: 'AEO Intelligence Agent', role: 'AEO' },
]

interface Message {
  id: string
  role: string
  content: string
  created_at?: string
}

interface Conversation {
  id: string
  agent_id: string
  agent_name: string
  title: string
  created_at: string
  updated_at: string
  message_count: number
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return date.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: 'America/Phoenix'
  })
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    timeZone: 'America/Phoenix'
  })
}

function AgentChatContent() {
  const searchParams = useSearchParams()
  const initialAgentId = searchParams.get('agent') || '07'

  const [selectedAgent, setSelectedAgent] = useState(
    AGENTS.find(a => a.id === initialAgentId) || AGENTS[2]
  )
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [liveContext, setLiveContext] = useState<any>(null)
  const [contextLoading, setContextLoading] = useState(false)
  const [mobileView, setMobileView] = useState<'agents' | 'history' | 'chat'>('agents')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversations()
  }, [selectedAgent])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (selectedAgent.id === '01') {
      setContextLoading(true)
      const t = localStorage.getItem('jarvis_token') || ''
      Promise.all([
        fetch('/api/proxy/api/google-ads/performance', {
          headers: { Authorization: `Bearer ${t}` }
        }).then(r => r.json()).catch(() => null),
        fetch('/api/proxy/api/google-ads/campaigns', {
          headers: { Authorization: `Bearer ${t}` }
        }).then(r => r.json()).catch(() => null),
        fetch('/api/proxy/api/kipu/census', {
          headers: { Authorization: `Bearer ${t}` }
        }).then(r => r.json()).catch(() => null),
        fetch('/api/proxy/api/ctm/summary', {
          headers: { Authorization: `Bearer ${t}` }
        }).then(r => r.json()).catch(() => null),
        fetch('/api/proxy/api/hubspot/pipeline', {
          headers: { Authorization: `Bearer ${t}` }
        }).then(r => r.json()).catch(() => null),
      ]).then(([performance, campaigns, census, ctm, hubspot]) => {
        setLiveContext({ performance, campaigns, census, ctm, hubspot })
      }).finally(() => setContextLoading(false))
    } else if (selectedAgent.id === '07') {
      setContextLoading(true)
      const t = localStorage.getItem('jarvis_token') || ''
      Promise.all([
        fetch('/api/proxy/api/google-ads/performance', {
          headers: { Authorization: `Bearer ${t}` }
        }).then(r => r.json()).catch(() => null),
        fetch('/api/proxy/api/google-ads/campaigns', {
          headers: { Authorization: `Bearer ${t}` }
        }).then(r => r.json()).catch(() => null),
        fetch('/api/proxy/api/ctm/quality-report?days=30', {
          headers: { Authorization: `Bearer ${t}` }
        }).then(r => r.json()).catch(() => null),
        fetch('/api/proxy/api/ctm/campaign-quality?days=30', {
          headers: { Authorization: `Bearer ${t}` }
        }).then(r => r.json()).catch(() => null),
      ]).then(([performance, campaigns, ctmQuality, campaignQuality]) => {
        setLiveContext({ performance, campaigns, ctmQuality, campaignQuality })
      }).finally(() => setContextLoading(false))
    } else if (selectedAgent.id === '03' || selectedAgent.id === '18') {
      setContextLoading(true)
      const t = localStorage.getItem('jarvis_token') || ''
      fetch('/api/proxy/api/ga4/overview', {
        headers: { Authorization: `Bearer ${t}` }
      }).then(r => r.json()).then(ga4 => {
        setLiveContext({ ga4 })
      }).catch(() => null).finally(() => setContextLoading(false))
    } else {
      setLiveContext(null)
    }
  }, [selectedAgent])

  async function loadConversations() {
    try {
      const t = localStorage.getItem('jarvis_token') || ''
      const res = await fetch(
        `/api/proxy/api/conversations/sessions/${selectedAgent.id}`,
        { headers: { Authorization: `Bearer ${t}` } }
      )
      if (!res.ok) {
        setConversations([])
        return
      }
      const data = await res.json()
      const transformed: Conversation[] = (data.sessions || []).map((s: any) => ({
        id: s.conversation_id,
        agent_id: s.agent_id,
        agent_name: s.agent_name,
        title: s.title || 'Conversation',
        created_at: s.started_at,
        updated_at: (s.last_message_at || s.started_at) + 'Z',
        message_count: s.message_count || 0,
      }))
      setConversations(transformed)
    } catch {
      setConversations([])
    }
  }

  async function loadConversation(convId: string) {
    setLoadingHistory(true)
    setActiveConvId(convId)
    try {
      const t = localStorage.getItem('jarvis_token') || ''
      const res = await fetch(
        `/api/proxy/api/conversations/${convId}/messages`,
        { headers: { Authorization: `Bearer ${t}` } }
      )
      if (!res.ok) {
        setMessages([])
        return
      }
      const data = await res.json()
      const loaded: Message[] = (data.messages || []).flatMap((m: any, i: number) => [
        {
          id: `${m.id}-u`,
          role: 'user',
          content: m.user_message,
          created_at: m.created_at,
        },
        {
          id: `${m.id}-a`,
          role: 'agent',
          content: m.agent_response,
          created_at: m.created_at,
        },
      ])
      setMessages(loaded)
    } catch {
      setMessages([])
    } finally {
      setLoadingHistory(false)
    }
  }

  async function startNewConversation() {
    setActiveConvId(null)
    setMessages([])
    setInput('')
  }

  async function deleteConversation(convId: string, e: React.MouseEvent) {
    e.stopPropagation()
    const t = localStorage.getItem('jarvis_token') || ''
    await fetch(`/api/proxy/api/conversations/${convId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${t}` },
    })
    if (activeConvId === convId) {
      setActiveConvId(null)
      setMessages([])
    }
    loadConversations()
  }

  async function searchConversations(query: string) {
    if (query.length === 0) {
      loadConversations()
      return
    }
    if (query.length < 3) return
    try {
      const t = localStorage.getItem('jarvis_token') || ''
      const res = await fetch(
        `/api/proxy/api/conversations/search?q=${encodeURIComponent(query)}&agent_id=${selectedAgent.id}`,
        { headers: { Authorization: `Bearer ${t}` } }
      )
      if (!res.ok) return
      const data = await res.json()
      // Group search results by conversation_id
      const grouped: Record<string, Conversation> = {}
      ;(data.results || []).forEach((r: any) => {
        if (!grouped[r.conversation_id]) {
          grouped[r.conversation_id] = {
            id: r.conversation_id,
            agent_id: r.agent_id,
            agent_name: r.agent_name,
            title: r.title || r.user_message?.substring(0, 60) || 'Conversation',
            created_at: r.created_at,
            updated_at: r.created_at + 'Z',
            message_count: 1,
          }
        }
      })
      setConversations(Object.values(grouped))
    } catch {
      // ignore
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    console.log('[CHAT] Sending with context:', JSON.stringify(liveContext)?.substring(0, 200))
    const userMsg = input.trim()
    setInput('')

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMsg,
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setLoading(true)

    try {
      const t = localStorage.getItem('jarvis_token') || ''

      // Get agent response — chat-agent route also auto-saves to jarvis-api
      const res = await fetch('/api/chat-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t}`,
        },
        body: JSON.stringify({
          message: userMsg,
          agentId: selectedAgent.id,
          agentRole: selectedAgent.role,
          agentName: selectedAgent.name,
          context: liveContext,
          history: messages.slice(-10),
          conversation_id: activeConvId,
        })
      })
      const data = await res.json()
      const reply = data.reply || 'No response'

      // Track new conversation_id returned by the server
      if (data.conversation_id && !activeConvId) {
        setActiveConvId(data.conversation_id)
      }

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: reply,
        created_at: new Date().toISOString()
      }

      setMessages(prev => [...prev, agentMessage])

      loadConversations()
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'agent',
        content: 'Connection error. Check VPS status.',
        created_at: new Date().toISOString()
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-80px)] -m-6">

      {/* MOBILE — Agent selector view */}
      <div className={`md:hidden flex-col w-full bg-jarvis-surface
                      ${mobileView === 'agents' ? 'flex' : 'hidden'}`}>
        <div className="p-4 border-b border-jarvis-border">
          <div className="text-jarvis-dim text-xs font-mono mb-3 tracking-wider">
            SELECT AN AGENT
          </div>
          {AGENTS.map(agent => (
            <button
              key={agent.id}
              onClick={() => {
                setSelectedAgent(agent)
                startNewConversation()
                setMobileView('history')
              }}
              className="w-full text-left px-4 py-4 rounded-lg font-mono mb-2
                         border border-jarvis-border hover:border-jarvis-cyan
                         transition-all bg-jarvis-bg"
            >
              <div className="text-jarvis-cyan font-bold text-sm">
                AGENT {agent.id}
              </div>
              <div className="text-jarvis-text text-sm mt-1">{agent.name}</div>
              <div className="text-jarvis-dim text-xs mt-1 opacity-60">
                Phase 1 · Advise Only
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* MOBILE — Conversation history view */}
      <div className={`md:hidden flex-col w-full bg-jarvis-bg
                      ${mobileView === 'history' ? 'flex' : 'hidden'}`}>
        <div className="p-3 border-b border-jarvis-border bg-jarvis-surface
                        flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setMobileView('agents')}
            className="text-jarvis-cyan font-mono text-sm px-2 py-1"
          >
            ← AGENTS
          </button>
          <div className="font-mono font-bold text-jarvis-cyan text-sm truncate mx-2">
            AGENT {selectedAgent.id}
          </div>
          <button
            onClick={() => { startNewConversation(); setMobileView('chat') }}
            className="text-jarvis-cyan font-mono text-sm px-2 py-1"
          >
            + NEW
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="text-jarvis-dim text-xs font-mono p-6 text-center opacity-50 mt-8">
              No conversations yet.
              <br />Tap + NEW to start one.
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => { loadConversation(conv.id); setMobileView('chat') }}
                className="p-4 border-b border-jarvis-border border-opacity-30
                           cursor-pointer group transition-all active:bg-jarvis-surface"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-jarvis-text text-sm font-mono truncate">
                      {conv.title}
                    </div>
                    <div className="text-jarvis-dim text-xs font-mono opacity-50 mt-1">
                      {formatDate(conv.updated_at)} · {conv.message_count} msgs
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="text-jarvis-dim hover:text-jarvis-red text-sm px-2 py-1 opacity-40"
                  >✕</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MOBILE — Full screen chat view */}
      <div className={`md:hidden flex-col w-full
                      ${mobileView === 'chat' ? 'flex' : 'hidden'}`}>
        <div className="p-3 border-b border-jarvis-border bg-jarvis-surface
                        flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setMobileView('history')}
            className="text-jarvis-cyan font-mono text-sm px-2 py-1"
          >
            ← CHATS
          </button>
          <div className="flex-1">
            <div className="font-mono font-bold text-jarvis-cyan text-sm">
              AGENT {selectedAgent.id} — {selectedAgent.name.toUpperCase()}
            </div>
            <div className="text-xs font-mono mt-0.5">
              {liveContext
                ? <span className="text-jarvis-green">● Live data connected</span>
                : <span className="text-jarvis-dim">○ Loading data...</span>
              }
            </div>
          </div>
          <button
            onClick={() => window.open(
              `/dashboard/chat?agent=${selectedAgent.id}`,
              'agent-chat',
              'width=900,height=750'
            )}
            className="text-jarvis-dim text-xs font-mono"
          >
            ⤢
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-4xl mb-4">🤖</div>
              <div className="text-jarvis-dim font-mono text-sm">
                Ask {selectedAgent.name} anything
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={msg.id || i} className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}>
              <div className={`max-w-[85%] rounded-lg text-sm font-mono px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-jarvis-cyan bg-opacity-10 text-jarvis-cyan border border-jarvis-cyan border-opacity-20'
                  : 'bg-jarvis-surface border border-jarvis-border text-jarvis-text'
              }`}>
                <div className="text-xs opacity-50 mb-1">
                  {msg.role === 'user' ? 'THAI' : `🤖 AGENT ${selectedAgent.id}`}
                  {msg.created_at && (
                    <span className="ml-2">{formatDate(msg.created_at)}</span>
                  )}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-jarvis-surface border border-jarvis-border
                             px-4 py-3 rounded-lg text-sm font-mono
                             text-jarvis-dim animate-pulse">
                Agent {selectedAgent.id} thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t border-jarvis-border bg-jarvis-surface flex-shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder={contextLoading ? 'Loading live data...' : `Message ${selectedAgent.name}...`}
              rows={2}
              className="flex-1 bg-jarvis-bg border border-jarvis-border rounded-lg
                         px-3 py-2 text-jarvis-text font-mono text-sm
                         focus:outline-none focus:border-jarvis-cyan resize-none"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-jarvis-cyan text-jarvis-bg px-4 py-3 rounded-lg
                         font-mono text-sm font-bold disabled:opacity-50"
            >
              SEND
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP — Three panel layout */}
      <div className="hidden md:flex flex-1">
        {/* LEFT — Agent selector */}
        <div className="w-48 border-r border-jarvis-border bg-jarvis-surface flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-jarvis-border">
            <div className="text-jarvis-dim text-xs font-mono mb-2">SELECT AGENT</div>
            {AGENTS.map(agent => (
              <button
                key={agent.id}
                onClick={() => { setSelectedAgent(agent); startNewConversation() }}
                className={`w-full text-left px-2 py-2 rounded font-mono text-xs
                           transition-all mb-1 ${
                  selectedAgent.id === agent.id
                    ? 'bg-jarvis-cyan bg-opacity-10 text-jarvis-cyan border border-jarvis-cyan border-opacity-30'
                    : 'text-jarvis-dim hover:text-jarvis-text'
                }`}
              >
                <div className="font-bold">AGENT {agent.id}</div>
                <div className="opacity-70 truncate text-xs">{agent.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* MIDDLE — Conversation history */}
        <div className="w-56 border-r border-jarvis-border bg-jarvis-bg flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-jarvis-border">
            <div className="flex items-center justify-between mb-2">
              <div className="text-jarvis-dim text-xs font-mono">CONVERSATIONS</div>
              <button onClick={startNewConversation} className="text-jarvis-cyan text-xs font-mono">+ NEW</button>
            </div>
            <input
              type="text"
              placeholder="Search..."
              onChange={(e) => searchConversations(e.target.value)}
              className="w-full bg-jarvis-bg border border-jarvis-border text-jarvis-text font-mono text-xs px-2 py-1 rounded placeholder-jarvis-dim focus:border-jarvis-cyan focus:outline-none"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-jarvis-dim text-xs font-mono p-3 text-center opacity-50 mt-4">
                No conversations yet
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`p-3 border-b border-jarvis-border border-opacity-30
                             cursor-pointer group transition-all ${
                    activeConvId === conv.id
                      ? 'bg-jarvis-cyan bg-opacity-5 border-l-2 border-l-jarvis-cyan'
                      : 'hover:bg-jarvis-surface'
                  }`}
                >
                  <div className="text-jarvis-text text-xs font-mono truncate mb-1">
                    {conv.title}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-jarvis-dim text-xs font-mono opacity-50">
                      {formatDate(conv.updated_at)}
                    </div>
                    <button
                      onClick={(e) => deleteConversation(conv.id, e)}
                      className="text-jarvis-dim hover:text-jarvis-red text-xs opacity-0 group-hover:opacity-100"
                    >✕</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT — Main chat */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-4 border-b border-jarvis-border bg-jarvis-surface flex items-center gap-3 flex-shrink-0">
            <div className="text-2xl">🤖</div>
            <div className="flex-1">
              <div className="font-mono font-bold text-jarvis-cyan text-sm">
                AGENT {selectedAgent.id} — {selectedAgent.name.toUpperCase()}
              </div>
              <div className="text-xs font-mono text-jarvis-dim">Phase 1: Advise Only</div>
              <div className="text-xs font-mono mt-0.5">
                {liveContext
                  ? <span className="text-jarvis-green">● Live data connected</span>
                  : <span className="text-jarvis-dim">○ Loading data...</span>
                }
              </div>
            </div>
            <button
              onClick={() => window.open(`/dashboard/chat?agent=${selectedAgent.id}`, 'agent-chat', 'width=900,height=750,scrollbars=yes')}
              className="text-jarvis-dim hover:text-jarvis-cyan font-mono text-xs px-2 py-1 border border-jarvis-border rounded hover:border-jarvis-cyan transition-all"
            >⤢ POPOUT</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-4xl mb-4">🤖</div>
                <div className="text-jarvis-dim font-mono text-sm mb-2">Start a conversation with {selectedAgent.name}</div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={msg.id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-2xl rounded-lg text-sm font-mono ${
                  msg.role === 'user'
                    ? 'bg-jarvis-cyan bg-opacity-10 text-jarvis-cyan border border-jarvis-cyan border-opacity-20 px-4 py-3'
                    : 'bg-jarvis-surface border border-jarvis-border text-jarvis-text px-4 py-3'
                }`}>
                  <div className="flex items-center justify-between mb-2 gap-4">
                    <div className="text-xs opacity-50">{msg.role === 'user' ? 'THAI' : `🤖 AGENT ${selectedAgent.id}`}</div>
                    {msg.created_at && <div className="text-xs opacity-40">{formatDate(msg.created_at)}</div>}
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-jarvis-surface border border-jarvis-border px-4 py-3 rounded-lg text-sm font-mono text-jarvis-dim animate-pulse">
                  <span className="opacity-50">🤖 AGENT {selectedAgent.id}</span>
                  <div className="mt-1">Thinking...</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-jarvis-border bg-jarvis-surface flex-shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder={contextLoading ? 'Loading live data...' : `Message ${selectedAgent.name}... (Enter to send, Shift+Enter for new line)`}
                rows={3}
                className="flex-1 bg-jarvis-bg border border-jarvis-border rounded-lg px-4 py-3 text-jarvis-text font-mono text-sm focus:outline-none focus:border-jarvis-cyan resize-none leading-relaxed"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-jarvis-cyan text-jarvis-bg px-5 py-3 rounded-lg font-mono text-sm font-bold hover:bg-opacity-80 disabled:opacity-50 transition-all self-end"
              >SEND</button>
            </div>
            <div className="text-jarvis-dim text-xs font-mono mt-2 opacity-40">
              Enter to send · Shift+Enter for new line
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AgentChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-80px)] text-jarvis-cyan font-mono text-sm animate-pulse">
        Loading chat...
      </div>
    }>
      <AgentChatContent />
    </Suspense>
  )
}
