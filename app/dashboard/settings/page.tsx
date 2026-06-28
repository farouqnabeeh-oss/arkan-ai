'use client'

import { useState, useEffect } from 'react'

interface Integration {
  whatsappPhoneId: string
  whatsappToken: string
  whatsappVerifyToken: string
  instagramPageId: string
  instagramToken: string
  instagramVerifyToken: string
}

export default function SettingsPage() {
  const [configs, setConfigs] = useState<Integration>({
    whatsappPhoneId: '',
    whatsappToken: '',
    whatsappVerifyToken: '',
    instagramPageId: '',
    instagramToken: '',
    instagramVerifyToken: ''
  })
  
  // Simulator States
  const [platform, setPlatform] = useState<'WHATSAPP' | 'INSTAGRAM'>('WHATSAPP')
  const [senderId, setSenderId] = useState('+15550199')
  const [message, setMessage] = useState('Hello, what are your services and pricing?')
  const [simulationResult, setSimulationResult] = useState<any>(null)
  
  // UI States
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [messageStatus, setMessageStatus] = useState({ text: '', type: '' })

  useEffect(() => {
    async function loadConfigs() {
      try {
        const res = await fetch('/api/dashboard/settings')
        if (res.ok) {
          const data = await res.json()
          setConfigs({
            whatsappPhoneId: data.whatsapp.whatsappPhoneId,
            whatsappToken: data.whatsapp.whatsappToken,
            whatsappVerifyToken: data.whatsapp.whatsappVerifyToken,
            instagramPageId: data.instagram.instagramPageId,
            instagramToken: data.instagram.instagramToken,
            instagramVerifyToken: data.instagram.instagramVerifyToken
          })
        }
      } catch (err) {
        console.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    loadConfigs()
  }, [])

  const handleSaveConfigs = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessageStatus({ text: '', type: '' })

    try {
      const res = await fetch('/api/dashboard/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp: {
            whatsappPhoneId: configs.whatsappPhoneId,
            whatsappToken: configs.whatsappToken,
            whatsappVerifyToken: configs.whatsappVerifyToken
          },
          instagram: {
            instagramPageId: configs.instagramPageId,
            instagramToken: configs.instagramToken,
            instagramVerifyToken: configs.instagramVerifyToken
          }
        })
      })

      if (res.ok) {
        setMessageStatus({ text: 'Integration credentials saved successfully.', type: 'success' })
      } else {
        setMessageStatus({ text: 'Failed to update credentials.', type: 'error' })
      }
    } catch (err) {
      setMessageStatus({ text: 'An unexpected connection error occurred.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const triggerSimulation = async () => {
    setSimulating(true)
    setSimulationResult(null)
    try {
      const res = await fetch('/api/dashboard/simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, senderId, message })
      })

      if (res.ok) {
        const data = await res.json()
        setSimulationResult(data)
      } else {
        const data = await res.json()
        setSimulationResult({ error: data.error || 'Failed to simulate message.' })
      }
    } catch (err) {
      setSimulationResult({ error: 'Connection failed.' })
    } finally {
      setSimulating(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-teal-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-neutral-500 text-xs font-medium">Opening configuration deck...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-100">Settings & Simulator</h1>
        <p className="text-sm text-neutral-500 mt-1">Configure Meta tokens or test the AI automation end-to-end.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Configurations Form */}
        <form onSubmit={handleSaveConfigs} className="space-y-6 lg:col-span-7">
          <div className="bg-neutral-900/20 border border-neutral-900 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-neutral-300 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>WhatsApp Cloud API</span>
            </h3>

            {messageStatus.text && (
              <div
                className={`p-3 border rounded-xl text-xs flex items-center gap-2 ${
                  messageStatus.type === 'success'
                    ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400'
                    : 'bg-red-950/40 border-red-900/50 text-red-400'
                }`}
              >
                <span>{messageStatus.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Access Token</label>
                <input
                  type="password"
                  value={configs.whatsappToken}
                  onChange={e => setConfigs({ ...configs, whatsappToken: e.target.value })}
                  placeholder="EAABw..."
                  className="w-full bg-neutral-950/80 border border-neutral-900 rounded-xl px-4 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-teal-500/80"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Phone Number ID</label>
                <input
                  type="text"
                  value={configs.whatsappPhoneId}
                  onChange={e => setConfigs({ ...configs, whatsappPhoneId: e.target.value })}
                  placeholder="10865..."
                  className="w-full bg-neutral-950/80 border border-neutral-900 rounded-xl px-4 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-teal-500/80"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Webhook Verify Token</label>
                <input
                  type="text"
                  value={configs.whatsappVerifyToken}
                  onChange={e => setConfigs({ ...configs, whatsappVerifyToken: e.target.value })}
                  placeholder="verify_token"
                  className="w-full bg-neutral-950/80 border border-neutral-900 rounded-xl px-4 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-teal-500/80"
                />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/20 border border-neutral-900 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-neutral-300 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
              </svg>
              <span>Instagram Graph API</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Page Access Token</label>
                <input
                  type="password"
                  value={configs.instagramToken}
                  onChange={e => setConfigs({ ...configs, instagramToken: e.target.value })}
                  placeholder="IGQVJ..."
                  className="w-full bg-neutral-950/80 border border-neutral-900 rounded-xl px-4 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-teal-500/80"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Page ID</label>
                <input
                  type="text"
                  value={configs.instagramPageId}
                  onChange={e => setConfigs({ ...configs, instagramPageId: e.target.value })}
                  placeholder="17841..."
                  className="w-full bg-neutral-950/80 border border-neutral-900 rounded-xl px-4 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-teal-500/80"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Verify Token</label>
                <input
                  type="text"
                  value={configs.instagramVerifyToken}
                  onChange={e => setConfigs({ ...configs, instagramVerifyToken: e.target.value })}
                  placeholder="verify_token"
                  className="w-full bg-neutral-950/80 border border-neutral-900 rounded-xl px-4 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-teal-500/80"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700/50 text-neutral-950 font-medium text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Credentials'}
            </button>
          </div>
        </form>

        {/* Developer Sandbox Simulator */}
        <div className="bg-neutral-900/30 border border-neutral-900 rounded-2xl p-6 lg:col-span-5 space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-neutral-300 flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
              </svg>
              <span>Sandbox Simulator</span>
            </h3>
            <p className="text-[11px] text-neutral-500">Simulate incoming messages without linking live webhooks.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Simulated Channel</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setPlatform('WHATSAPP'); setSenderId('+15550199') }}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    platform === 'WHATSAPP'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-neutral-950 border-neutral-900 text-neutral-400 hover:text-neutral-300'
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => { setPlatform('INSTAGRAM'); setSenderId('@client_handle') }}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    platform === 'INSTAGRAM'
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                      : 'bg-neutral-950 border-neutral-900 text-neutral-400 hover:text-neutral-300'
                  }`}
                >
                  Instagram DM
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Sender ID / Handle</label>
              <input
                type="text"
                value={senderId}
                onChange={e => setSenderId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-900 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Message Body</label>
              <textarea
                rows={3}
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-900 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={triggerSimulation}
              disabled={simulating}
              className="w-full bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700/50 text-neutral-950 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {simulating ? 'Processing Response...' : 'Send Simulated Message'}
            </button>
          </div>

          {/* Simulation Output Result */}
          {simulationResult && (
            <div className="p-4 bg-neutral-950 border border-neutral-900 rounded-xl space-y-3">
              <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Simulation Output</h4>
              
              {simulationResult.error ? (
                <p className="text-xs text-red-400">{simulationResult.error}</p>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-neutral-500">Customer message stored:</p>
                    <p className="text-xs text-neutral-300 italic bg-neutral-900/60 p-2 rounded border border-neutral-900">
                      "{simulationResult.userMessage.content}"
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-teal-400">AI Response generated:</p>
                    <p className="text-xs text-teal-300 font-medium bg-teal-500/5 p-2 rounded border border-teal-500/10">
                      {simulationResult.aiResponse ? simulationResult.aiResponse.content : 'No response generated (System disabled/empty)'}
                    </p>
                  </div>
                  <p className="text-[9px] text-teal-500 text-center font-semibold pt-1">
                    ✓ Thread updated in database. Review under Conversations tab!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
