'use client'

import { useState, useEffect } from 'react'

interface Stats {
  totalConvos: number
  totalMessages: number
  whatsappConvos: number
  instagramConvos: number
  userMessages: number
  aiMessages: number
  systemEnabled: boolean
}

interface Log {
  id: string
  timestamp: string
  type: string
  message: string
  details: string | null
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setLogs(data.recentLogs)
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    // Poll stats every 10 seconds for real-time dashboard updates
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-teal-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-neutral-500 text-xs font-medium tracking-wide">Syncing data...</span>
        </div>
      </div>
    )
  }

  const successRate = stats ? Math.round((stats.aiMessages / (stats.userMessages || 1)) * 100) : 0
  const whatsappPercentage = stats ? Math.round((stats.whatsappConvos / (stats.totalConvos || 1)) * 100) : 0
  const instagramPercentage = stats ? Math.round((stats.instagramConvos / (stats.totalConvos || 1)) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-100">Overview</h1>
        <p className="text-sm text-neutral-500 mt-1">Real-time status of your autonomous AI communications.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-neutral-900/40 border border-neutral-900 rounded-2xl p-6 flex flex-col justify-between">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Conversations</span>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-neutral-100">{stats?.totalConvos || 0}</span>
            <span className="text-xs font-medium text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/10">Active Threads</span>
          </div>
        </div>

        <div className="bg-neutral-900/40 border border-neutral-900 rounded-2xl p-6 flex flex-col justify-between">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Messages</span>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-neutral-100">{stats?.totalMessages || 0}</span>
            <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10">In/Out Logs</span>
          </div>
        </div>

        <div className="bg-neutral-900/40 border border-neutral-900 rounded-2xl p-6 flex flex-col justify-between">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">AI Automation Rate</span>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-neutral-100">{Math.min(successRate, 100)}%</span>
            <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10">Autonomous</span>
          </div>
        </div>

        <div className="bg-neutral-900/40 border border-neutral-900 rounded-2xl p-6 flex flex-col justify-between">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">System Operational</span>
          <div className="mt-4 flex items-baseline justify-between">
            <span className={`text-xl font-bold ${stats?.systemEnabled ? 'text-teal-400' : 'text-amber-500'}`}>
              {stats?.systemEnabled ? '24/7 Autopilot' : 'Offline'}
            </span>
            <div className={`h-2.5 w-2.5 rounded-full ${stats?.systemEnabled ? 'bg-teal-500 animate-pulse' : 'bg-amber-500'}`} />
          </div>
        </div>
      </div>

      {/* Charts & Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Splits */}
        <div className="bg-neutral-900/30 border border-neutral-900 rounded-2xl p-6 lg:col-span-1 space-y-6">
          <h3 className="text-sm font-semibold tracking-wide text-neutral-300">Channel Distribution</h3>
          
          <div className="space-y-4">
            {/* WhatsApp */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-400 font-medium">WhatsApp DMs</span>
                <span className="text-neutral-200 font-bold">{stats?.whatsappConvos || 0} ({whatsappPercentage}%)</span>
              </div>
              <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${whatsappPercentage}%` }} />
              </div>
            </div>

            {/* Instagram */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-400 font-medium">Instagram DMs</span>
                <span className="text-neutral-200 font-bold">{stats?.instagramConvos || 0} ({instagramPercentage}%)</span>
              </div>
              <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${instagramPercentage}%` }} />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-900/60 grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-[10px] uppercase font-semibold text-neutral-500 tracking-wider">User Messages</p>
              <p className="text-lg font-bold text-neutral-300 mt-1">{stats?.userMessages || 0}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-neutral-500 tracking-wider">AI Replies</p>
              <p className="text-lg font-bold text-teal-400 mt-1">{stats?.aiMessages || 0}</p>
            </div>
          </div>
        </div>

        {/* Live System Logs */}
        <div className="bg-neutral-900/30 border border-neutral-900 rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold tracking-wide text-neutral-300">Live System Events</h3>
            <p className="text-xs text-neutral-500">Real-time status updates and execution logs from your bot server.</p>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto max-h-[160px] space-y-2.5 pr-2">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center py-8 text-neutral-600 text-xs">
                No system logs recorded yet.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-3 bg-neutral-950/50 border border-neutral-900 rounded-xl flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs text-neutral-300 truncate font-medium">{log.message}</p>
                    <p className="text-[10px] text-neutral-600 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shrink-0 ${
                      log.type === 'ERROR'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/10'
                        : log.type === 'AI_LATENCY'
                        ? 'bg-teal-500/10 text-teal-400 border border-teal-500/10'
                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700/30'
                    }`}
                  >
                    {log.type === 'AI_LATENCY' ? 'Latency' : log.type.toLowerCase()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
