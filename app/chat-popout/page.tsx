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

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: 'America/Phoenix'
  })
}

function PopoutContent() {
  const searchParams = useSearchParams()
  const agentId = searchParams.get('agent') || '07'
  const agent = AGENTS.find(a => a.id === agentId) || AGENTS[2]

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [emailSentTo, setEmailSentTo] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = `Jarvis — ${agent.name}`
  }, [agent])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
      const t = localStorage.getItem('jarvis_token') || ''
      const res = await fetch('/api/chat-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify({
          message: userMsg,
          agentId: agent.id,
          agentRole: agent.role,
          agentName: agent.name,
          history: messages.slice(-10),
          conversation_id: activeConvId,
        })
      })
      const data = await res.json()
      if (data.conversation_id && !activeConvId) {
        setActiveConvId(data.conversation_id)
      }
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: data.reply || 'No response',
        created_at: new Date().toISOString()
      }])
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

  async function sendEmailReport() {
    if (messages.length === 0 || emailStatus === 'sending') return
    setEmailStatus('sending')
    try {
      const t = localStorage.getItem('jarvis_token') || ''
      const user = JSON.parse(localStorage.getItem('jarvis_user') || '{}')
      const res = await fetch('/api/proxy/api/email-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify({
          conversation: messages.map(m => ({ role: m.role, content: m.content })),
          agent_name: agent.name,
          username: user.username || '',
        }),
      })
      if (!res.ok) throw new Error('Send failed')
      const data = await res.json()
      setEmailSentTo(data.sent_to || '')
      setEmailStatus('sent')
      setTimeout(() => setEmailStatus('idle'), 3000)
    } catch {
      setEmailStatus('error')
      setTimeout(() => setEmailStatus('idle'), 3000)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-jarvis-bg">
      {/* Header */}
      <div className="p-3 border-b border-jarvis-border bg-jarvis-surface flex items-center gap-3 flex-shrink-0">
        <div className="text-xl">🤖</div>
        <div className="flex-1">
          <div className="font-mono font-bold text-jarvis-cyan text-sm">
            AGENT {agent.id} — {agent.name.toUpperCase()}
          </div>
          <div className="text-xs font-mono text-jarvis-dim">Phase 1: Advise Only</div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={sendEmailReport}
            disabled={emailStatus === 'sending'}
            className={`font-mono text-xs px-2 py-1 border rounded transition-all ${
              emailStatus === 'sent'
                ? 'text-jarvis-green border-jarvis-green'
                : emailStatus === 'error'
                ? 'text-jarvis-red border-jarvis-red'
                : 'text-jarvis-dim hover:text-jarvis-cyan border-jarvis-border hover:border-jarvis-cyan'
            }`}
          >
            {emailStatus === 'sending' ? 'Sending...'
              : emailStatus === 'sent' ? `Sent to ${emailSentTo}`
              : emailStatus === 'error' ? 'Send failed'
              : '✉ EMAIL'}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-4">🤖</div>
            <div className="text-jarvis-dim font-mono text-sm">
              Ask {agent.name} anything
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2xl rounded-lg text-sm font-mono px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-jarvis-cyan bg-opacity-10 text-jarvis-cyan border border-jarvis-cyan border-opacity-20'
                : 'bg-jarvis-surface border border-jarvis-border text-jarvis-text'
            }`}>
              <div className="flex items-center justify-between mb-2 gap-4">
                <div className="text-xs opacity-50">
                  {msg.role === 'user' ? 'YOU' : `🤖 AGENT ${agent.id}`}
                </div>
                {msg.created_at && (
                  <div className="text-xs opacity-40">{formatTime(msg.created_at)}</div>
                )}
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-jarvis-surface border border-jarvis-border px-4 py-3 rounded-lg text-sm font-mono text-jarvis-dim animate-pulse">
              <span className="opacity-50">🤖 AGENT {agent.id}</span>
              <div className="mt-1">Thinking...</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
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
            placeholder={`Message ${agent.name}... (Enter to send)`}
            rows={3}
            className="flex-1 bg-jarvis-bg border border-jarvis-border rounded-lg px-4 py-3 text-jarvis-text font-mono text-sm focus:outline-none focus:border-jarvis-cyan resize-none leading-relaxed"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-jarvis-cyan text-jarvis-bg px-5 py-3 rounded-lg font-mono text-sm font-bold hover:bg-opacity-80 disabled:opacity-50 transition-all self-end"
          >SEND</button>
        </div>
      </div>
    </div>
  )
}

export default function PopoutPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-jarvis-bg text-jarvis-cyan font-mono text-sm animate-pulse">
        Loading chat...
      </div>
    }>
      <PopoutContent />
    </Suspense>
  )
}
