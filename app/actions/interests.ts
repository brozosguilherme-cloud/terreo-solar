'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createInterest(spaceId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check if already interested
  const { data: existing } = await supabase
    .from('interests')
    .select('id')
    .eq('space_id', spaceId)
    .eq('company_id', user.id)
    .single()

  if (existing) return { error: 'Você já demonstrou interesse neste espaço' }

  const { error } = await supabase.from('interests').insert({
    space_id: spaceId,
    company_id: user.id,
    status: 'pending',
  })

  if (error) return { error: error.message }

  revalidatePath(`/spaces/${spaceId}`)
  revalidatePath('/company/dashboard')
  return { success: true }
}

export async function updateInterestStatus(
  interestId: string,
  status: 'accepted' | 'rejected'
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get interest with space to verify ownership
  const { data: interest } = await supabase
    .from('interests')
    .select('id, space_id, spaces(owner_id)')
    .eq('id', interestId)
    .single()

  if (!interest) return { error: 'Interesse não encontrado' }

  const space = interest.spaces as { owner_id: string } | null
  if (space?.owner_id !== user.id) return { error: 'Não autorizado' }

  const { error } = await supabase
    .from('interests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', interestId)

  if (error) return { error: error.message }

  // If accepted, update space status to negotiating
  if (status === 'accepted') {
    await supabase
      .from('spaces')
      .update({ status: 'negotiating', updated_at: new Date().toISOString() })
      .eq('id', interest.space_id)
  }

  revalidatePath('/owner/dashboard')
  revalidatePath(`/spaces/${interest.space_id}`)
  return { success: true }
}
