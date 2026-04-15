'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage('')

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters')
      setStatus('error')
      return
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match')
      setStatus('error')
      return
    }

    setStatus('submitting')
    try {
      const token = localStorage.getItem('jarvis_token') || ''
      const res = await fetch('/api/proxy/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to change password')
        setStatus('error')
        return
      }
      setStatus('success')
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch {
      setErrorMessage('Connection error')
      setStatus('error')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-jarvis-cyan font-mono font-bold text-lg">CHANGE PASSWORD</h1>
        <Link
          href="/dashboard"
          className="text-jarvis-dim hover:text-jarvis-cyan font-mono text-xs"
        >
          &larr; BACK
        </Link>
      </div>

      {status === 'success' ? (
        <div className="bg-jarvis-surface border border-jarvis-green rounded-lg p-6 text-center">
          <div className="text-jarvis-green font-mono text-sm mb-2">
            Password updated successfully
          </div>
          <div className="text-jarvis-dim font-mono text-xs">
            Redirecting to dashboard...
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-jarvis-surface border border-jarvis-border rounded-lg p-6 space-y-4">
          {status === 'error' && errorMessage && (
            <div className="bg-jarvis-red bg-opacity-10 border border-jarvis-red border-opacity-30 rounded px-3 py-2 text-jarvis-red font-mono text-xs">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-jarvis-dim font-mono text-xs mb-1">CURRENT PASSWORD</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
              className="w-full bg-jarvis-bg border border-jarvis-border rounded px-3 py-2 text-jarvis-text font-mono text-sm focus:outline-none focus:border-jarvis-cyan"
            />
          </div>

          <div>
            <label className="block text-jarvis-dim font-mono text-xs mb-1">NEW PASSWORD</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-jarvis-bg border border-jarvis-border rounded px-3 py-2 text-jarvis-text font-mono text-sm focus:outline-none focus:border-jarvis-cyan"
            />
          </div>

          <div>
            <label className="block text-jarvis-dim font-mono text-xs mb-1">CONFIRM NEW PASSWORD</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-jarvis-bg border border-jarvis-border rounded px-3 py-2 text-jarvis-text font-mono text-sm focus:outline-none focus:border-jarvis-cyan"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full bg-jarvis-cyan text-jarvis-bg font-mono text-sm font-bold py-2 rounded hover:bg-opacity-80 disabled:opacity-50 transition-all"
          >
            {status === 'submitting' ? 'UPDATING...' : 'UPDATE PASSWORD'}
          </button>
        </form>
      )}
    </div>
  )
}
