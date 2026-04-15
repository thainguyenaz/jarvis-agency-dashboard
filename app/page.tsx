'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin() {
    setLoading(true)
    setError('')
    try {
      const data = await api.login(username, password)
      if (data.token) {
        localStorage.setItem('jarvis_token', data.token)
        localStorage.setItem('jarvis_user', JSON.stringify(data.user || { username }))
        localStorage.setItem('jarvis_role', data.role || data.user?.role || 'user')
        localStorage.setItem('jarvis_username', data.user?.username || username)
        localStorage.setItem('jarvis_fullname', data.user?.full_name || username)
        router.push('/dashboard')
      } else {
        setError('Invalid credentials')
      }
    } catch {
      setError('Connection failed — check VPS status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-jarvis-bg">
      <div className="w-full max-w-md p-8 border border-jarvis-border bg-jarvis-surface rounded-lg">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🤖</div>
          <h1 className="text-2xl font-bold text-jarvis-cyan font-mono tracking-widest">
            JARVIS
          </h1>
          <p className="text-jarvis-dim text-sm mt-1">
            Marketing Agency 2.0 — DRC Intelligence Platform
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full bg-jarvis-bg border border-jarvis-border rounded px-4 py-3
                       text-jarvis-text font-mono focus:outline-none focus:border-jarvis-cyan"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full bg-jarvis-bg border border-jarvis-border rounded px-4 py-3
                       text-jarvis-text font-mono focus:outline-none focus:border-jarvis-cyan"
          />
          {error && (
            <p className="text-jarvis-red text-sm font-mono">{error}</p>
          )}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-jarvis-cyan text-jarvis-bg font-bold py-3 rounded
                       font-mono tracking-widest hover:bg-opacity-80 transition-all
                       disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING...' : 'ACCESS JARVIS'}
          </button>
        </div>

        <p className="text-jarvis-dim text-xs text-center mt-6 font-mono">
          DESERT RECOVERY CENTERS — CONFIDENTIAL
        </p>
      </div>
    </div>
  )
}
