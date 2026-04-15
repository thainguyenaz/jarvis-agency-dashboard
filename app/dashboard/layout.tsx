'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'OVERVIEW', icon: '📊' },
  { href: '/dashboard/google-ads', label: 'GOOGLE ADS', icon: '🎯' },
  { href: '/dashboard/ctm', label: 'CALL TRACKING', icon: '📞' },
  { href: '/dashboard/hubspot', label: 'HUBSPOT', icon: '🔗' },
  { href: '/dashboard/kipu', label: 'CENSUS', icon: '🏥' },
  { href: '/dashboard/qualified-leads', label: 'QUALIFIED LEADS', icon: '⭐' },
  { href: '/dashboard/agents', label: 'AGENTS', icon: '🤖' },
  { href: '/dashboard/approvals', label: 'APPROVALS', icon: '✅' },
  { href: '/dashboard/chat', label: 'AGENT CHAT', icon: '💬' },
]

const ADMIN_NAV = { href: '/dashboard/admin', label: 'ADMIN', icon: '🔒' }

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('jarvis_token')
    const userData = localStorage.getItem('jarvis_user')
    if (!token) {
      router.push('/')
      return
    }
    if (userData) setUser(JSON.parse(userData))
  }, [router])

  function handleLogout() {
    localStorage.removeItem('jarvis_token')
    localStorage.removeItem('jarvis_user')
    localStorage.removeItem('jarvis_role')
    localStorage.removeItem('jarvis_username')
    localStorage.removeItem('jarvis_fullname')
    router.push('/')
  }

  const isAdmin = user?.role === 'admin'
  const displayName = user?.full_name || user?.username || ''

  return (
    <div className="min-h-screen bg-jarvis-bg">
      {/* Mobile top nav */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-jarvis-border bg-jarvis-surface">
        <div className="flex items-center gap-2">
          <div className="text-jarvis-cyan font-mono font-bold text-sm">
            🤖 JARVIS
          </div>
          {displayName && (
            <div className="text-jarvis-green font-mono text-xs">● {displayName.split(' ')[0]}</div>
          )}
        </div>
        <div className="flex gap-3 overflow-x-auto items-center">
          {[
            { href: '/dashboard', label: '📊' },
            { href: '/dashboard/google-ads', label: '🎯' },
            { href: '/dashboard/ctm', label: '📞' },
            { href: '/dashboard/hubspot', label: '🔗' },
            { href: '/dashboard/kipu', label: '🏥' },
            { href: '/dashboard/qualified-leads', label: '⭐' },
            { href: '/dashboard/agents', label: '🤖' },
            { href: '/dashboard/approvals', label: '✅' },
            { href: '/dashboard/chat', label: '💬' },
            ...(isAdmin ? [{ href: '/dashboard/admin', label: '🔒' }] : []),
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="text-jarvis-dim hover:text-jarvis-cyan text-xl px-1"
            >
              {item.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="text-jarvis-dim hover:text-jarvis-red text-sm ml-1">⏻</button>
        </div>
      </div>

      <div className="flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-jarvis-border bg-jarvis-surface flex-col">
        <div className="p-6 border-b border-jarvis-border">
          <div className="text-jarvis-cyan font-mono font-bold text-lg tracking-widest">
            🤖 JARVIS 2.0
          </div>
          <div className="text-jarvis-dim text-xs mt-1 font-mono">
            MARKETING AGENCY
          </div>
          {user && (
            <div className="text-jarvis-green text-xs mt-2 font-mono">
              ● {displayName}
              {isAdmin && <span className="text-jarvis-dim ml-1">(admin)</span>}
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded font-mono text-sm
                         transition-all ${
                           pathname === item.href
                             ? 'bg-jarvis-cyan bg-opacity-10 text-jarvis-cyan border border-jarvis-cyan border-opacity-30'
                             : 'text-jarvis-dim hover:text-jarvis-text hover:bg-jarvis-border'
                         }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
          {isAdmin && (
            <Link
              href={ADMIN_NAV.href}
              className={`flex items-center gap-3 px-3 py-2 rounded font-mono text-sm
                         transition-all mt-2 border-t border-jarvis-border pt-3 ${
                           pathname === ADMIN_NAV.href
                             ? 'bg-jarvis-cyan bg-opacity-10 text-jarvis-cyan border border-jarvis-cyan border-opacity-30'
                             : 'text-jarvis-dim hover:text-jarvis-text hover:bg-jarvis-border'
                         }`}
            >
              <span>{ADMIN_NAV.icon}</span>
              <span>{ADMIN_NAV.label}</span>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-jarvis-border">
          <button
            onClick={handleLogout}
            className="w-full text-jarvis-dim hover:text-jarvis-red font-mono text-xs
                       py-2 transition-all text-left"
          >
            ⏻ LOGOUT
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto w-full">
        <div className="p-6">
          {children}
        </div>
      </main>
      </div>
    </div>
  )
}
