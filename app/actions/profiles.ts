'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function completeOwnerProfile(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const full_name = formData.get('full_name') as string
  const cpf_cnpj = (formData.get('cpf_cnpj') as string) || null
  const phone = (formData.get('phone') as string) || null

  // Upsert owner profile
  await supabase.from('owner_profiles').upsert({
    user_id: user.id,
    full_name,
    cpf_cnpj,
    phone,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  // Mark onboarding complete
  await supabase
    .from('profiles')
    .update({ onboarding_completed: true, name: full_name })
    .eq('id', user.id)

  revalidatePath('/owner/dashboard')
  redirect('/owner/dashboard')
}

export async function completeCompanyProfile(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const company_name = formData.get('company_name') as string
  const cnpj = (formData.get('cnpj') as string) || null
  const website = (formData.get('website') as string) || null
  const description = (formData.get('description') as string) || null

  await supabase.from('company_profiles').upsert({
    user_id: user.id,
    company_name,
    cnpj,
    website,
    description,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  await supabase
    .from('profiles')
    .update({ onboarding_completed: true, name: company_name })
    .eq('id', user.id)

  revalidatePath('/company/dashboard')
  redirect('/company/dashboard')
}
