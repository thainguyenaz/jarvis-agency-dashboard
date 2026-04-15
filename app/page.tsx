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
    <div className="min-h-screen flex items-center justify-center bg-jarvis-bg px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-jarvis-yellow text-3xl font-light tracking-[0.3em] mb-2">
            JARVIS
          </div>
          <div className="w-12 h-px bg-jarvis-border mx-auto mb-3" />
          <p className="text-jarvis-dim text-xs tracking-widest">
            DESERT RECOVERY CENTERS
          </p>
        </div>

        <div className="bg-jarvis-surface border border-jarvis-border rounded-card p-8 shadow-card">
          <div className="space-y-5">
            <div>
              <label className="text-jarvis-dim text-xs tracking-wider mb-2 block">USERNAME</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-jarvis-bg border border-jarvis-border rounded-lg px-4 py-3
                           text-jarvis-text text-sm focus:outline-none focus:border-jarvis-cyan
                           placeholder-jarvis-dim placeholder-opacity-40"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="text-jarvis-dim text-xs tracking-wider mb-2 block">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full bg-jarvis-bg border border-jarvis-border rounded-lg px-4 py-3
                           text-jarvis-text text-sm focus:outline-none focus:border-jarvis-cyan
                           placeholder-jarvis-dim placeholder-opacity-40"
                placeholder="Enter password"
              />
            </div>
            {error && (
              <p className="text-jarvis-red text-sm">{error}</p>
            )}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-jarvis-cyan bg-opacity-15 text-jarvis-cyan font-medium py-3
                         rounded-lg text-sm tracking-wider border border-jarvis-cyan border-opacity-30
                         hover:bg-opacity-25 hover:border-opacity-50
                         disabled:opacity-40 cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </div>

        <p className="text-jarvis-dim text-xs text-center mt-8 tracking-wider opacity-40">
          CONFIDENTIAL
        </p>
      </div>
    </div>
  )
}
