'use client'
import { useState } from 'react'

const AGENTS = [
  { id: '01', name: 'Sr CMO Orchestrator', role: 'CMO' },
  { id: '03', name: 'Sr SEO Expert', role: 'SEO' },
  { id: '07', name: 'Google Paid Buyer', role: 'PAID_MEDIA' },
  { id: '11', name: 'Reputation Directory Agent', role: 'REPUTATION' },
  { id: '20', name: 'AEO Intelligence Agent', role: 'AEO' },
]

export default function AgentChatPage() {
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0])
  const [messages, setMessages] = useState<{role: string, content: string}[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          agentId: selectedAgent.id,
          agentRole: selectedAgent.role,
          agentName: selectedAgent.name,
          history: messages
        })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'agent', content: data.reply || 'No response' }])
    } catch {
      setMessages(prev => [...prev, { role: 'agent', content: 'Connection error. Try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-80px)] gap-4">
      <div className="w-48 space-y-2">
        <div className="text-jarvis-dim text-sm font-mono mb-3">SELECT AGENT</div>
        {AGENTS.map(agent => (
          <button
            key={agent.id}
            onClick={() => { setSelectedAgent(agent); setMessages([]) }}
            className={`w-full text-left px-3 py-2 rounded font-mono text-sm transition-all ${
              selectedAgent.id === agent.id
                ? 'bg-jarvis-cyan bg-opacity-10 text-jarvis-cyan border border-jarvis-cyan border-opacity-30'
                : 'text-jarvis-dim hover:text-jarvis-text border border-transparent'
            }`}
          >
            <div className="font-bold">AGENT {agent.id}</div>
            <div className="opacity-70 truncate">{agent.name}</div>
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col bg-jarvis-surface border border-jarvis-border rounded-lg">
        <div className="p-4 border-b border-jarvis-border flex items-center gap-3">
          <div className="text-2xl">🤖</div>
          <div>
            <div className="font-mono font-bold text-jarvis-cyan">AGENT {selectedAgent.id}</div>
            <div className="text-xs font-mono text-jarvis-dim">{selectedAgent.name} — Phase 1: Advise Only</div>
          </div>
          <button
            onClick={() => window.open(
              `/dashboard/chat?agent=${selectedAgent.id}`,
              'agent-chat',
              'width=800,height=700,scrollbars=yes'
            )}
            className="text-jarvis-dim hover:text-jarvis-cyan font-mono text-xs ml-auto"
            title="Pop out chat"
          >
            ⤢ POPOUT
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-jarvis-dim text-sm font-mono text-center mt-16">
              Start a conversation with {selectedAgent.name}
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl px-4 py-3 rounded text-sm font-mono ${
                msg.role === 'user'
                  ? 'bg-jarvis-cyan bg-opacity-10 text-jarvis-cyan border border-jarvis-cyan border-opacity-20'
                  : 'bg-jarvis-bg border border-jarvis-border text-jarvis-text'
              }`}>
                <div className="text-jarvis-dim text-xs mb-1">
                  {msg.role === 'user' ? 'THAI' : `🤖 AGENT ${selectedAgent.id}`}
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-jarvis-bg border border-jarvis-border px-4 py-3 rounded text-sm font-mono text-jarvis-dim animate-pulse">
                Agent {selectedAgent.id} is thinking...
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-jarvis-border flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
            placeholder={`Message ${selectedAgent.name}... (Enter to send, Shift+Enter for new line)`}
            rows={3}
            className="flex-1 bg-jarvis-bg border border-jarvis-border rounded px-3 py-2
                       text-jarvis-text font-mono text-sm focus:outline-none
                       focus:border-jarvis-cyan resize-none"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-jarvis-cyan text-jarvis-bg px-4 py-2 rounded font-mono text-sm
                       font-bold hover:bg-opacity-80 disabled:opacity-50"
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  )
}
