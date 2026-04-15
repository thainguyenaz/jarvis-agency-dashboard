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
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ full_name: '', username: '', email: '', role: 'user', password: 'DRC2026!' })
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem('jarvis_role')
    if (role !== 'admin') {
      router.push('/dashboard')
      return
    }
    loadUsers()
  }, [router])

  function getToken() {
    return localStorage.getItem('jarvis_token') || ''
  }

  function loadUsers() {
    setLoading(true)
    fetch('/api/proxy/api/admin/users', {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.users) setUsers(data.users)
        else setError('Failed to load users')
      })
      .catch(() => setError('Connection failed'))
      .finally(() => setLoading(false))
  }

  async function handleAddUser() {
    setAddError('')
    if (!addForm.full_name || !addForm.username || !addForm.email) {
      setAddError('All fields are required')
      return
    }
    setAdding(true)
    try {
      const res = await fetch('/api/proxy/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(addForm),
      })
      const data = await res.json()
      if (!res.ok) {
        setAddError(data.error || 'Failed to create user')
        return
      }
      setShowAddModal(false)
      setAddForm({ full_name: '', username: '', email: '', role: 'user', password: 'DRC2026!' })
      loadUsers()
    } catch {
      setAddError('Connection failed')
    } finally {
      setAdding(false)
    }
  }

  async function handleDeleteUser(user: User) {
    if (!confirm(`Remove ${user.full_name}? This will delete all their conversations.`)) return
    try {
      await fetch(`/api/proxy/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      loadUsers()
    } catch {
      alert('Failed to delete user')
    }
  }

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-jarvis-cyan font-mono tracking-widest">
            USER MANAGEMENT
          </h1>
          <p className="text-jarvis-dim text-sm font-mono mt-1">
            Admin access only — manage team accounts
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-jarvis-cyan bg-opacity-15 text-jarvis-cyan border border-jarvis-cyan
                     border-opacity-30 px-4 py-2 rounded font-mono text-xs tracking-wider
                     hover:bg-opacity-25 cursor-pointer"
        >
          + ADD USER
        </button>
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
          <table className="w-full text-sm font-mono min-w-[700px]">
            <thead>
              <tr className="bg-jarvis-surface border-b border-jarvis-border">
                <th className="text-left px-4 py-3 text-jarvis-dim text-xs tracking-wider">NAME</th>
                <th className="text-left px-4 py-3 text-jarvis-dim text-xs tracking-wider">USERNAME</th>
                <th className="text-left px-4 py-3 text-jarvis-dim text-xs tracking-wider">EMAIL</th>
                <th className="text-left px-4 py-3 text-jarvis-dim text-xs tracking-wider">ROLE</th>
                <th className="text-left px-4 py-3 text-jarvis-dim text-xs tracking-wider">LAST LOGIN</th>
                <th className="text-right px-4 py-3 text-jarvis-dim text-xs tracking-wider">CONVOS</th>
                <th className="text-right px-4 py-3 text-jarvis-dim text-xs tracking-wider">ACTIONS</th>
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
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      {user.conversation_count > 0 && (
                        <button
                          onClick={() => router.push(`/dashboard/admin/conversations?user_id=${user.id}&name=${encodeURIComponent(user.full_name)}`)}
                          className="text-jarvis-cyan text-xs hover:underline cursor-pointer"
                        >
                          View
                        </button>
                      )}
                      {user.id !== 1 && (
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-jarvis-red text-xs opacity-50 hover:opacity-100 cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 text-jarvis-dim text-xs font-mono">
        {users.length} users registered
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-jarvis-surface border border-jarvis-border rounded-lg p-6 w-full max-w-md">
            <h2 className="text-jarvis-cyan font-mono font-bold mb-4 tracking-wider">ADD NEW USER</h2>

            <div className="space-y-4">
              <div>
                <label className="text-jarvis-dim text-xs font-mono block mb-1">FULL NAME</label>
                <input
                  type="text"
                  value={addForm.full_name}
                  onChange={e => setAddForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full bg-jarvis-bg border border-jarvis-border rounded px-3 py-2
                             text-jarvis-text font-mono text-sm focus:outline-none focus:border-jarvis-cyan"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="text-jarvis-dim text-xs font-mono block mb-1">USERNAME</label>
                <input
                  type="text"
                  value={addForm.username}
                  onChange={e => setAddForm(f => ({ ...f, username: e.target.value.toLowerCase() }))}
                  className="w-full bg-jarvis-bg border border-jarvis-border rounded px-3 py-2
                             text-jarvis-text font-mono text-sm focus:outline-none focus:border-jarvis-cyan"
                  placeholder="john"
                />
              </div>
              <div>
                <label className="text-jarvis-dim text-xs font-mono block mb-1">EMAIL</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-jarvis-bg border border-jarvis-border rounded px-3 py-2
                             text-jarvis-text font-mono text-sm focus:outline-none focus:border-jarvis-cyan"
                  placeholder="john@desertrecoverycenters.com"
                />
              </div>
              <div>
                <label className="text-jarvis-dim text-xs font-mono block mb-1">ROLE</label>
                <select
                  value={addForm.role}
                  onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full bg-jarvis-bg border border-jarvis-border rounded px-3 py-2
                             text-jarvis-text font-mono text-sm focus:outline-none focus:border-jarvis-cyan"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-jarvis-dim text-xs font-mono block mb-1">PASSWORD</label>
                <input
                  type="text"
                  value={addForm.password}
                  onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full bg-jarvis-bg border border-jarvis-border rounded px-3 py-2
                             text-jarvis-yellow font-mono text-sm focus:outline-none focus:border-jarvis-cyan"
                />
                <div className="text-jarvis-dim text-xs font-mono mt-1">
                  Default: DRC2026! — will be emailed to user
                </div>
              </div>

              {addError && (
                <div className="text-jarvis-red text-xs font-mono">{addError}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddUser}
                  disabled={adding}
                  className="flex-1 bg-jarvis-cyan bg-opacity-15 text-jarvis-cyan border border-jarvis-cyan
                             border-opacity-30 py-2 rounded font-mono text-sm tracking-wider
                             hover:bg-opacity-25 disabled:opacity-40 cursor-pointer"
                >
                  {adding ? 'Creating...' : 'Create User'}
                </button>
                <button
                  onClick={() => { setShowAddModal(false); setAddError('') }}
                  className="px-4 py-2 text-jarvis-dim border border-jarvis-border rounded
                             font-mono text-sm hover:text-jarvis-text cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
