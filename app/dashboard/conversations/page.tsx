'use client'

import { useState, useEffect } from 'react'

interface Message {
  id: string
  sender: 'USER' | 'AI' | 'SYSTEM'
  content: string
  timestamp: string
  status: string
  messageId: string | null
}

interface Conversation {
  id: string
  externalId: string
  platform: 'WHATSAPP' | 'INSTAGRAM'
  status: 'ACTIVE' | 'PAUSED'
  createdAt: string
  updatedAt: string
  messages: Message[]
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const fetchConversations = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/dashboard/conversations')
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations)
        
        // Auto-select first conversation if none selected
        if (data.conversations.length > 0 && !selectedConvoId && !silent) {
          setSelectedConvoId(data.conversations[0].id)
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversations')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
    // Poll conversations silently every 5 seconds to keep chat logs real-time
    const interval = setInterval(() => fetchConversations(true), 5000)
    return () => clearInterval(interval)
  }, [selectedConvoId])

  const toggleConvoStatus = async (convoId: string, currentStatus: 'ACTIVE' | 'PAUSED') => {
    setUpdating(true)
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    try {
      const res = await fetch('/api/dashboard/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convoId, status: newStatus }),
      })
      if (res.ok) {
        // Update local state
        setConversations(prev =>
          prev.map(c => (c.id === convoId ? { ...c, status: newStatus } : c))
        )
      }
    } catch (err) {
      console.error('Failed to toggle status')
    } finally {
      setUpdating(false)
    }
  }

  const selectedConvo = conversations.find(c => c.id === selectedConvoId)

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-teal-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-neutral-500 text-xs font-medium">Loading threads...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-10rem)] flex border border-neutral-900 rounded-2xl overflow-hidden bg-neutral-950/20 backdrop-blur-xl">
      {/* Thread list sidebar */}
      <div className="w-80 border-r border-neutral-900 flex flex-col bg-neutral-900/10">
        <div className="p-4 border-b border-neutral-900">
          <h3 className="text-sm font-semibold text-neutral-300">Customer Threads</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-900/50">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-600">
              No conversations logged yet. Use the Simulator in Settings to generate mock chats!
            </div>
          ) : (
            conversations.map(convo => {
              const lastMsg = convo.messages[convo.messages.length - 1]
              const isSelected = convo.id === selectedConvoId
              return (
                <button
                  key={convo.id}
                  onClick={() => setSelectedConvoId(convo.id)}
                  className={`w-full text-left p-4 flex flex-col gap-1.5 transition-all outline-none ${
                    isSelected
                      ? 'bg-neutral-900/50 border-l-2 border-teal-500'
                      : 'hover:bg-neutral-900/20 border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-neutral-200 truncate pr-2">
                      {convo.externalId}
                    </span>
                    <span
                      className={`text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded ${
                        convo.platform === 'WHATSAPP'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10'
                      }`}
                    >
                      {convo.platform}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-500 truncate w-full">
                    {lastMsg ? lastMsg.content : 'No messages'}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-neutral-600 mt-1">
                    <span>{new Date(convo.updatedAt).toLocaleTimeString()}</span>
                    <span className={convo.status === 'PAUSED' ? 'text-amber-500 font-semibold' : 'text-neutral-500'}>
                      {convo.status === 'PAUSED' ? 'Bot Paused' : 'Bot Active'}
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Message Pane */}
      <div className="flex-1 flex flex-col bg-neutral-950/40">
        {selectedConvo ? (
          <>
            {/* Header info */}
            <div className="p-4 border-b border-neutral-900 flex items-center justify-between bg-neutral-900/10">
              <div>
                <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
                  <span>{selectedConvo.externalId}</span>
                  <span className="text-[10px] text-neutral-500 font-normal">on {selectedConvo.platform.toLowerCase()}</span>
                </h3>
                <p className="text-[10px] text-neutral-500 mt-0.5 font-mono">ID: {selectedConvo.id}</p>
              </div>

              {/* Bot Control */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-400">Autopilot:</span>
                <button
                  onClick={() => toggleConvoStatus(selectedConvo.id, selectedConvo.status)}
                  disabled={updating}
                  className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer ${
                    selectedConvo.status === 'ACTIVE'
                      ? 'bg-teal-500/10 border border-teal-500/25 text-teal-400 hover:bg-teal-500/20'
                      : 'bg-amber-500/10 border border-amber-500/25 text-amber-500 hover:bg-amber-500/20'
                  }`}
                >
                  {selectedConvo.status === 'ACTIVE' ? 'Active (Click to Pause)' : 'Paused (Click to Resume)'}
                </button>
              </div>
            </div>

            {/* Bubble Logs */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {selectedConvo.messages.map(msg => {
                const isUser = msg.sender === 'USER'
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[70%] ${isUser ? 'mr-auto items-start' : 'ml-auto items-end'}`}
                  >
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm ${
                        isUser
                          ? 'bg-neutral-900 text-neutral-100 border border-neutral-800 rounded-bl-none'
                          : 'bg-teal-500 text-neutral-950 font-medium rounded-br-none shadow-md shadow-teal-500/5'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-1 px-1 font-mono">
                      <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      {!isUser && (
                        <>
                          <span>•</span>
                          <span className={msg.status === 'FAILED' ? 'text-red-400' : 'text-neutral-500'}>
                            {msg.status.toLowerCase()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-600 text-sm">
            <svg className="w-12 h-12 text-neutral-800 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Select a customer thread to view logs.</span>
          </div>
        )}
      </div>
    </div>
  )
}
