'use client'

import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { MOCK_OWNER, MOCK_COMPANY } from '@/lib/mock-data'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
}

export default function ChatWindow({
  initialMessages,
  interestId,
}: {
  initialMessages: Message[]
  interestId: string
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const currentUserId = typeof window !== 'undefined'
    ? (localStorage.getItem('ts_demo_role') === 'owner' ? MOCK_OWNER.id : MOCK_COMPANY.id)
    : MOCK_OWNER.id

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    const text = input.trim()
    if (!text) return
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender_id: currentUserId,
        content: text,
        created_at: new Date().toISOString(),
      },
    ])
    setInput('')
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-stone-50">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-terreo-800 text-white rounded-br-sm' : 'bg-white border border-stone-200 text-stone-800 rounded-bl-sm shadow-sm'}`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className={`mt-1 text-right text-[10px] ${isMe ? 'text-terreo-300' : 'text-stone-400'}`}>{formatTime(msg.created_at)}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-stone-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Digite uma mensagem..."
            className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terreo-500"
          />
          <button onClick={handleSend} className="flex h-10 w-10 items-center justify-center rounded-xl bg-terreo-800 text-white hover:bg-terreo-900 transition-colors">
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-stone-400">Demo — mensagens não são salvas</p>
      </div>
    </div>
  )
}
