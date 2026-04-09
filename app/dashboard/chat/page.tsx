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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversations()
  }, [selectedAgent])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadConversations() {
    try {
      const res = await fetch(`/api/conversations?agentId=${selectedAgent.id}`)
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch {
      setConversations([])
    }
  }

  async function loadConversation(convId: string) {
    setLoadingHistory(true)
    setActiveConvId(convId)
    try {
      const res = await fetch(`/api/conversations/${convId}`)
      const data = await res.json()
      setMessages(data.messages || [])
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
    await fetch(`/api/conversations/${convId}`, { method: 'DELETE' })
    if (activeConvId === convId) {
      setActiveConvId(null)
      setMessages([])
    }
    loadConversations()
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
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
      // Create conversation if this is first message
      let convId = activeConvId
      if (!convId) {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: selectedAgent.id,
            agentName: selectedAgent.name,
            firstMessage: userMsg
          })
        })
        const data = await res.json()
        convId = data.id
        setActiveConvId(convId)
      }

      // Save user message
      await fetch(`/api/conversations/${convId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: userMsg })
      })

      // Get agent response
      const res = await fetch('/api/chat-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          agentId: selectedAgent.id,
          agentRole: selectedAgent.role,
          agentName: selectedAgent.name,
          history: messages.slice(-10)
        })
      })
      const data = await res.json()
      const reply = data.reply || 'No response'

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: reply,
        created_at: new Date().toISOString()
      }

      setMessages(prev => [...prev, agentMessage])

      // Save agent response
      await fetch(`/api/conversations/${convId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'agent', content: reply })
      })

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
    <div className="flex h-[calc(100vh-80px)] gap-0 -m-6">

      {/* LEFT SIDEBAR — Agent selector */}
      <div className="w-48 border-r border-jarvis-border bg-jarvis-surface
                      flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-jarvis-border">
          <div className="text-jarvis-dim text-xs font-mono mb-2">SELECT AGENT</div>
          {AGENTS.map(agent => (
            <button
              key={agent.id}
              onClick={() => {
                setSelectedAgent(agent)
                startNewConversation()
              }}
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

      {/* MIDDLE SIDEBAR — Conversation history */}
      <div className="w-56 border-r border-jarvis-border bg-jarvis-bg
                      flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-jarvis-border flex items-center justify-between">
          <div className="text-jarvis-dim text-xs font-mono">CONVERSATIONS</div>
          <button
            onClick={startNewConversation}
            className="text-jarvis-cyan text-xs font-mono hover:text-white"
            title="New conversation"
          >
            + NEW
          </button>
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
                    className="text-jarvis-dim hover:text-jarvis-red text-xs
                               opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-jarvis-dim text-xs font-mono opacity-40">
                  {conv.message_count} messages
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Chat header */}
        <div className="p-4 border-b border-jarvis-border bg-jarvis-surface
                        flex items-center gap-3 flex-shrink-0">
          <div className="text-2xl">🤖</div>
          <div className="flex-1">
            <div className="font-mono font-bold text-jarvis-cyan text-sm">
              AGENT {selectedAgent.id} — {selectedAgent.name.toUpperCase()}
            </div>
            <div className="text-xs font-mono text-jarvis-dim">
              Phase 1: Advise Only ·
              {activeConvId ? ` ${messages.length} messages` : ' New conversation'}
            </div>
          </div>
          <button
            onClick={() => window.open(
              `/dashboard/chat?agent=${selectedAgent.id}`,
              'agent-chat',
              'width=900,height=750,scrollbars=yes'
            )}
            className="text-jarvis-dim hover:text-jarvis-cyan font-mono text-xs px-2 py-1
                       border border-jarvis-border rounded hover:border-jarvis-cyan transition-all"
          >
            ⤢ POPOUT
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {loadingHistory && (
            <div className="text-jarvis-cyan font-mono text-sm text-center animate-pulse">
              Loading conversation...
            </div>
          )}

          {!loadingHistory && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-4xl mb-4">🤖</div>
              <div className="text-jarvis-dim font-mono text-sm mb-2">
                Start a conversation with {selectedAgent.name}
              </div>
              <div className="text-jarvis-dim font-mono text-xs opacity-50">
                Phase 1 — Advisory mode only
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={msg.id || i} className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}>
              <div className={`max-w-2xl rounded-lg text-sm font-mono ${
                msg.role === 'user'
                  ? 'bg-jarvis-cyan bg-opacity-10 text-jarvis-cyan border border-jarvis-cyan border-opacity-20 px-4 py-3'
                  : 'bg-jarvis-surface border border-jarvis-border text-jarvis-text px-4 py-3'
              }`}>
                <div className="flex items-center justify-between mb-2 gap-4">
                  <div className="text-xs opacity-50">
                    {msg.role === 'user' ? 'THAI' : `🤖 AGENT ${selectedAgent.id}`}
                  </div>
                  {msg.created_at && (
                    <div className="text-xs opacity-40">
                      {formatDate(msg.created_at)}
                    </div>
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
              <div className="bg-jarvis-surface border border-jarvis-border px-4 py-3
                             rounded-lg text-sm font-mono text-jarvis-dim animate-pulse">
                <span className="opacity-50">🤖 AGENT {selectedAgent.id}</span>
                <div className="mt-1">Thinking...</div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-jarvis-border bg-jarvis-surface flex-shrink-0">
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
              placeholder={`Message ${selectedAgent.name}... (Enter to send, Shift+Enter for new line)`}
              rows={3}
              className="flex-1 bg-jarvis-bg border border-jarvis-border rounded-lg
                         px-4 py-3 text-jarvis-text font-mono text-sm
                         focus:outline-none focus:border-jarvis-cyan resize-none
                         leading-relaxed"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-jarvis-cyan text-jarvis-bg px-5 py-3 rounded-lg font-mono
                         text-sm font-bold hover:bg-opacity-80 disabled:opacity-50
                         transition-all self-end"
            >
              SEND
            </button>
          </div>
          <div className="text-jarvis-dim text-xs font-mono mt-2 opacity-40">
            Enter to send · Shift+Enter for new line · Conversations saved automatically
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
