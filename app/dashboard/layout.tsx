'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [systemEnabled, setSystemEnabled] = useState(true)
  const [loading, setLoading] = useState(false)

  // Fetch initial stats including system status
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/dashboard/stats')
        if (res.ok) {
          const data = await res.json()
          setSystemEnabled(data.stats.systemEnabled)
        }
      } catch (err) {
        console.error('Failed to load system settings')
      }
    }
    fetchStatus()
  }, [])

  const toggleSystem = async () => {
    setLoading(true)
    const newStatus = !systemEnabled
    try {
      const res = await fetch('/api/dashboard/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemEnabled: newStatus }),
      })
      if (res.ok) {
        setSystemEnabled(newStatus)
      }
    } catch (err) {
      console.error('Failed to toggle system')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (res.ok) {
        router.push('/login')
        router.refresh()
      }
    } catch (err) {
      console.error('Logout failed')
    }
  }

  const navItems = [
    {
      name: 'Analytics',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      name: 'Conversations',
      href: '/dashboard/conversations',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      name: 'Knowledge Base',
      href: '/dashboard/knowledge',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      name: 'Settings & Simulator',
      href: '/dashboard/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex selection:bg-teal-500/20 selection:text-teal-300">
      {/* Sidebar */}
      <aside className="w-64 border-r border-neutral-900 bg-neutral-900/30 backdrop-blur-xl flex flex-col shrink-0">
        {/* Brand */}
        <div className="p-6 border-b border-neutral-900 flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 rounded-xl border border-teal-500/20">
            <svg className="w-6 h-6 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-wide text-neutral-100">ARKAN</h2>
            <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest">Digital Bot</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-500/10 border border-teal-500/25 text-teal-400 shadow-md shadow-teal-500/5'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50 border border-transparent'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* System Autonomy Status */}
        <div className="p-4 border-t border-neutral-900 bg-neutral-900/20">
          <div className="flex items-center justify-between p-3 bg-neutral-950/60 border border-neutral-800/80 rounded-xl">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-neutral-300">AI Autonomy</p>
              <p className={`text-[10px] ${systemEnabled ? 'text-teal-400' : 'text-neutral-500'}`}>
                {systemEnabled ? 'Online & Active' : 'System Paused'}
              </p>
            </div>
            <button
              onClick={toggleSystem}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none ${
                systemEnabled ? 'bg-teal-500' : 'bg-neutral-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-neutral-950 shadow ring-0 transition duration-250 ease-in-out ${
                  systemEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Logout Section */}
        <div className="p-4 border-t border-neutral-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/15 border border-transparent transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-neutral-950 relative overflow-y-auto">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-[50%] h-[40%] rounded-full bg-teal-900/5 blur-[120px] pointer-events-none" />
        
        <div className="flex-1 p-8 z-10 relative">
          {children}
        </div>
      </main>
    </div>
  )
}
