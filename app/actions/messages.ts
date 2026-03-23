'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function sendMessage(interestId: string, content: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!content.trim()) return { error: 'Mensagem não pode ser vazia' }

  // Verify user is part of this interest
  const { data: interest } = await supabase
    .from('interests')
    .select('id, company_id, status, spaces(owner_id)')
    .eq('id', interestId)
    .single()

  if (!interest) return { error: 'Conversa não encontrada' }
  if (interest.status !== 'accepted') return { error: 'Conversa não está ativa' }

  const space = (interest.spaces as unknown) as { owner_id: string } | null
  const isParticipant =
    interest.company_id === user.id || space?.owner_id === user.id

  if (!isParticipant) return { error: 'Não autorizado' }

  const { error } = await supabase.from('messages').insert({
    interest_id: interestId,
    sender_id: user.id,
    content: content.trim(),
  })

  if (error) return { error: error.message }

  revalidatePath(`/chat/${interestId}`)
  return { success: true }
}

export async function markMessagesAsRead(interestId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('interest_id', interestId)
    .neq('sender_id', user.id)
    .is('read_at', null)
}
