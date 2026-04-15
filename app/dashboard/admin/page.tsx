'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  username: string
  full_name: string
  email: string
  role: string
  created_at: string
  last_login: string | null
  conversation_count: number
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem('jarvis_role')
    if (role !== 'admin') {
      router.push('/dashboard')
      return
    }

    const t = localStorage.getItem('jarvis_token') || ''
    fetch('/api/proxy/api/admin/users', {
      headers: { Authorization: `Bearer ${t}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.users) setUsers(data.users)
        else setError('Failed to load users')
      })
      .catch(() => setError('Connection failed'))
      .finally(() => setLoading(false))
  }, [router])

  function formatDate(d: string | null) {
    if (!d) return 'Never'
    const date = new Date(d + 'Z')
    return date.toLocaleString('en-US', {
      timeZone: 'America/Phoenix',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-jarvis-cyan font-mono tracking-widest">
          USER MANAGEMENT
        </h1>
        <p className="text-jarvis-dim text-sm font-mono mt-1">
          Admin access only — manage team accounts
        </p>
      </div>

      {loading && (
        <div className="text-jarvis-dim font-mono text-sm animate-pulse">
          Loading users...
        </div>
      )}

      {error && (
        <div className="text-jarvis-red font-mono text-sm">{error}</div>
      )}

      {!loading && !error && (
        <div className="border border-jarvis-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm font-mono min-w-[600px]">
            <thead>
              <tr className="bg-jarvis-surface border-b border-jarvis-border">
                <th className="text-left px-4 py-3 text-jarvis-dim text-xs tracking-wider">NAME</th>
                <th className="text-left px-4 py-3 text-jarvis-dim text-xs tracking-wider">USERNAME</th>
                <th className="text-left px-4 py-3 text-jarvis-dim text-xs tracking-wider">EMAIL</th>
                <th className="text-left px-4 py-3 text-jarvis-dim text-xs tracking-wider">ROLE</th>
                <th className="text-left px-4 py-3 text-jarvis-dim text-xs tracking-wider">LAST LOGIN</th>
                <th className="text-right px-4 py-3 text-jarvis-dim text-xs tracking-wider">CONVOS</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr
                  key={user.id}
                  className="border-b border-jarvis-border border-opacity-30 hover:bg-jarvis-surface transition-colors"
                >
                  <td className="px-4 py-3 text-jarvis-text">{user.full_name}</td>
                  <td className="px-4 py-3 text-jarvis-cyan">{user.username}</td>
                  <td className="px-4 py-3 text-jarvis-dim">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      user.role === 'admin'
                        ? 'bg-jarvis-cyan bg-opacity-20 text-jarvis-cyan'
                        : 'bg-jarvis-border text-jarvis-dim'
                    }`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-jarvis-dim">{formatDate(user.last_login)}</td>
                  <td className="px-4 py-3 text-right text-jarvis-text">{user.conversation_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 text-jarvis-dim text-xs font-mono">
        {users.length} users registered
      </div>
    </div>
  )
}
