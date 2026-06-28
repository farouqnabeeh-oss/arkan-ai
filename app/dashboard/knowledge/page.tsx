'use client'

import { useState, useEffect } from 'react'

interface KnowledgeBase {
  companyName: string
  description: string
  services: string
  pricing: string
  faqs: string
  offers: string
  policies: string
  toneOfVoice: string
}

export default function KnowledgeBasePage() {
  const [kb, setKb] = useState<KnowledgeBase>({
    companyName: 'ARKAN DIGITAL',
    description: '',
    services: '',
    pricing: '',
    faqs: '',
    offers: '',
    policies: '',
    toneOfVoice: 'professional and friendly'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  useEffect(() => {
    async function loadKb() {
      try {
        const res = await fetch('/api/dashboard/knowledge')
        if (res.ok) {
          const data = await res.json()
          setKb(data.knowledgeBase)
        }
      } catch (err) {
        console.error('Failed to load knowledge base')
      } finally {
        setLoading(false)
      }
    }
    loadKb()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ text: '', type: '' })

    try {
      const res = await fetch('/api/dashboard/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kb)
      })

      if (res.ok) {
        setMessage({ text: 'Knowledge base successfully updated! The AI agent has refreshed its data.', type: 'success' })
      } else {
        setMessage({ text: 'Failed to update knowledge base. Please try again.', type: 'error' })
      }
    } catch (err) {
      setMessage({ text: 'An unexpected connection error occurred.', type: 'error' })
    } finally {
      setSaving(false)
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
          <span className="text-neutral-500 text-xs font-medium">Loading knowledge assets...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-100">Knowledge Base</h1>
        <p className="text-sm text-neutral-500 mt-1">
          This data acts as the single source of truth for the AI. The bot will never guess or answer outside these parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {message.text && (
          <div
            className={`p-4 border rounded-xl text-xs flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400'
                : 'bg-red-950/40 border-red-900/50 text-red-400'
            }`}
          >
            {message.type === 'success' ? (
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Company Name</label>
            <input
              type="text"
              required
              value={kb.companyName}
              onChange={e => setKb({ ...kb, companyName: e.target.value })}
              className="w-full bg-neutral-900/40 border border-neutral-900 rounded-xl px-4 py-3 text-sm text-neutral-200 focus:outline-none focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Tone of Voice</label>
            <input
              type="text"
              required
              value={kb.toneOfVoice}
              onChange={e => setKb({ ...kb, toneOfVoice: e.target.value })}
              placeholder="e.g. professional, friendly, sales-driven"
              className="w-full bg-neutral-900/40 border border-neutral-900 rounded-xl px-4 py-3 text-sm text-neutral-200 focus:outline-none focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/20 transition-all"
            />
          </div>
        </div>

        {/* Text Areas */}
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Business Description</label>
            <textarea
              required
              rows={3}
              value={kb.description}
              onChange={e => setKb({ ...kb, description: e.target.value })}
              placeholder="Explain what the company does, its core philosophy, target market, and credentials..."
              className="w-full bg-neutral-900/40 border border-neutral-900 rounded-xl px-4 py-3 text-sm text-neutral-200 focus:outline-none focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/20 transition-all font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Services & Core Offerings</label>
            <textarea
              required
              rows={4}
              value={kb.services}
              onChange={e => setKb({ ...kb, services: e.target.value })}
              placeholder="List out each service in detail. Be explicit so the bot can describe what we do accurately..."
              className="w-full bg-neutral-900/40 border border-neutral-900 rounded-xl px-4 py-3 text-sm text-neutral-200 focus:outline-none focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Pricing Information</label>
            <textarea
              required
              rows={3}
              value={kb.pricing}
              onChange={e => setKb({ ...kb, pricing: e.target.value })}
              placeholder="List prices, hourly rates, setup fees, or state that pricing is custom-scoped..."
              className="w-full bg-neutral-900/40 border border-neutral-900 rounded-xl px-4 py-3 text-sm text-neutral-200 focus:outline-none focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Frequently Asked Questions (FAQs)</label>
            <textarea
              required
              rows={5}
              value={kb.faqs}
              onChange={e => setKb({ ...kb, faqs: e.target.value })}
              placeholder="Q: What are the hours? A: We operate 24/7.&#10;Q: Where are you located? A: Remote..."
              className="w-full bg-neutral-900/40 border border-neutral-900 rounded-xl px-4 py-3 text-sm text-neutral-200 focus:outline-none focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/20 transition-all font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Offers & Discounts</label>
              <textarea
                required
                rows={3}
                value={kb.offers}
                onChange={e => setKb({ ...kb, offers: e.target.value })}
                placeholder="List ongoing promotions or sales pitches the bot should use to convert users..."
                className="w-full bg-neutral-900/40 border border-neutral-900 rounded-xl px-4 py-3 text-sm text-neutral-200 focus:outline-none focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Business Policies & Guarantees</label>
              <textarea
                required
                rows={3}
                value={kb.policies}
                onChange={e => setKb({ ...kb, policies: e.target.value })}
                placeholder="Money-back guarantees, cancelation policies, response times, NDAs..."
                className="w-full bg-neutral-900/40 border border-neutral-900 rounded-xl px-4 py-3 text-sm text-neutral-200 focus:outline-none focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-neutral-900 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700/50 text-neutral-950 font-medium text-sm px-8 py-3 rounded-xl transition-all shadow-lg shadow-teal-500/10 cursor-pointer"
          >
            {saving ? 'Saving System Assets...' : 'Save Knowledge Base'}
          </button>
        </div>
      </form>
    </div>
  )
}
