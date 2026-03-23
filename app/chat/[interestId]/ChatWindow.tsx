'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { sendMessage } from '@/app/actions/messages'
import { createClient } from '@/lib/supabase/client'
import { timeAgo } from '@/lib/utils'

interface Message {
  id: string
  interest_id: string
  sender_id: string
  content: string
  read_at: string | null
  created_at: string
  profiles: { id: string; name: string } | null
}

interface ChatWindowProps {
  interestId: string
  initialMessages: Message[]
  currentUserId: string
}

export default function ChatWindow({
  interestId,
  initialMessages,
  currentUserId,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Poll for new messages every 5 seconds
  useEffect(() => {
    const poll = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, profiles(id, name)')
        .eq('interest_id', interestId)
        .order('created_at', { ascending: true })

      if (data) {
        setMessages(data as Message[])
      }
    }

    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [interestId, supabase])

  async function handleSend() {
    if (!content.trim()) return
    setSending(true)
    const text = content.trim()
    setContent('')

    // Optimistic update
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      interest_id: interestId,
      sender_id: currentUserId,
      content: text,
      read_at: null,
      created_at: new Date().toISOString(),
      profiles: null,
    }
    setMessages((prev) => [...prev, optimistic])

    const result = await sendMessage(interestId, text)
    if (result?.error) {
      toast.error(result.error)
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      setContent(text)
    }

    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-stone-400 text-sm">
                Nenhuma mensagem ainda. Comece a conversa!
              </p>
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    isMe
                      ? 'bg-terreo-800 text-white rounded-br-sm'
                      : 'bg-white border border-stone-200 text-stone-800 rounded-bl-sm shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
                <p className="mt-1 text-xs text-stone-400 px-1">
                  {!isMe && msg.profiles?.name && (
                    <span className="mr-1 font-medium">{msg.profiles.name}</span>
                  )}
                  {timeAgo(msg.created_at)}
                  {isMe && msg.read_at && (
                    <span className="ml-1 text-terreo-400">✓ lido</span>
                  )}
                </p>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-stone-200 bg-white p-4">
        <div className="mx-auto max-w-3xl flex gap-3 items-end">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
            rows={1}
            className="min-h-[44px] max-h-32 resize-none flex-1"
            style={{ height: 'auto' }}
          />
          <Button
            onClick={handleSend}
            disabled={sending || !content.trim()}
            size="icon"
            className="h-11 w-11 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mx-auto max-w-3xl text-xs text-stone-400 mt-2">
          Mensagens são atualizadas automaticamente a cada 5 segundos
        </p>
      </div>
    </>
  )
}
