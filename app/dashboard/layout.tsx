'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: 'O' },
  { href: '/dashboard/google-ads', label: 'Google Ads', icon: 'A' },
  { href: '/dashboard/ctm', label: 'Call Tracking', icon: 'C' },
  { href: '/dashboard/hubspot', label: 'HubSpot', icon: 'H' },
  { href: '/dashboard/kipu', label: 'Census', icon: 'K' },
  { href: '/dashboard/qualified-leads', label: 'Qualified Leads', icon: 'Q' },
  { href: '/dashboard/agents', label: 'Agents', icon: 'G' },
  { href: '/dashboard/approvals', label: 'Approvals', icon: 'P' },
  { href: '/dashboard/chat', label: 'Agent Chat', icon: 'J' },
]

const ADMIN_NAV = { href: '/dashboard/admin', label: 'Admin', icon: 'S' }

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
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-jarvis-border bg-jarvis-surface">
        <div className="flex items-center gap-2">
          <div className="text-jarvis-yellow font-light text-sm tracking-[0.2em]">
            JARVIS
          </div>
          {displayName && (
            <div className="text-jarvis-dim text-xs truncate max-w-[80px]">
              {displayName.split(' ')[0]}
            </div>
          )}
        </div>
        <div className="flex gap-1 overflow-x-auto items-center flex-1 min-w-0 justify-end scrollbar-none ml-3">
          {[...NAV_ITEMS, ...(isAdmin ? [ADMIN_NAV] : [])].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-xs font-medium ${
                pathname === item.href
                  ? 'bg-jarvis-cyan bg-opacity-15 text-jarvis-cyan'
                  : 'text-jarvis-dim hover:text-jarvis-text'
              }`}
              title={item.label}
            >
              {item.icon}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="text-jarvis-dim hover:text-jarvis-red text-xs flex-shrink-0 ml-2 w-7 h-7 rounded-md flex items-center justify-center"
          >
            &#x23FB;
          </button>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-49px)] md:min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 border-r border-jarvis-border bg-jarvis-surface flex-col flex-shrink-0">
          <div className="px-5 py-6 border-b border-jarvis-border">
            <div className="text-jarvis-yellow font-light text-lg tracking-[0.25em]">
              JARVIS
            </div>
            <div className="text-jarvis-dim text-xs mt-1 tracking-wider">
              Marketing Intelligence
            </div>
            {user && (
              <div className="flex items-center gap-2 mt-3">
                <div className="w-1.5 h-1.5 rounded-full bg-jarvis-green" />
                <span className="text-jarvis-text text-xs truncate">
                  {displayName}
                </span>
                {isAdmin && <span className="text-jarvis-dim text-xs">admin</span>}
              </div>
            )}
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer ${
                  pathname === item.href
                    ? 'bg-jarvis-cyan bg-opacity-10 text-jarvis-cyan'
                    : 'text-jarvis-dim hover:text-jarvis-text hover:bg-jarvis-bg'
                }`}
              >
                <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-medium ${
                  pathname === item.href
                    ? 'bg-jarvis-cyan bg-opacity-20 text-jarvis-cyan'
                    : 'bg-jarvis-bg text-jarvis-dim'
                }`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            ))}
            {isAdmin && (
              <>
                <div className="border-t border-jarvis-border my-2" />
                <Link
                  href={ADMIN_NAV.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer ${
                    pathname === ADMIN_NAV.href
                      ? 'bg-jarvis-cyan bg-opacity-10 text-jarvis-cyan'
                      : 'text-jarvis-dim hover:text-jarvis-text hover:bg-jarvis-bg'
                  }`}
                >
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-medium ${
                    pathname === ADMIN_NAV.href
                      ? 'bg-jarvis-cyan bg-opacity-20 text-jarvis-cyan'
                      : 'bg-jarvis-bg text-jarvis-dim'
                  }`}>
                    {ADMIN_NAV.icon}
                  </span>
                  <span>{ADMIN_NAV.label}</span>
                </Link>
              </>
            )}
          </nav>

          <div className="px-5 py-4 border-t border-jarvis-border">
            <button
              onClick={handleLogout}
              className="text-jarvis-dim hover:text-jarvis-red text-xs cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto w-full min-w-0">
          <div className="p-4 md:p-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
