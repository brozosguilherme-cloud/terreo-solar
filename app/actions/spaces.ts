'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createSpace(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const type = formData.get('type') as string
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const state = formData.get('state') as string
  const lat = formData.get('lat') ? parseFloat(formData.get('lat') as string) : null
  const lng = formData.get('lng') ? parseFloat(formData.get('lng') as string) : null
  const area_m2 = parseFloat(formData.get('area_m2') as string)
  const solar_orientation = formData.getAll('solar_orientation') as string[]
  const roof_type = (formData.get('roof_type') as string) || null
  const desired_rent = formData.get('desired_rent')
    ? parseFloat(formData.get('desired_rent') as string)
    : null
  const description = (formData.get('description') as string) || null

  const { data: space, error } = await supabase
    .from('spaces')
    .insert({
      owner_id: user.id,
      type,
      address,
      city,
      state,
      lat,
      lng,
      area_m2,
      solar_orientation,
      roof_type,
      desired_rent,
      description,
      status: 'available',
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Handle photo uploads
  const photos = formData.getAll('photos') as File[]
  const validPhotos = photos.filter((f) => f.size > 0)

  for (let i = 0; i < validPhotos.length; i++) {
    const file = validPhotos[i]
    const ext = file.name.split('.').pop()
    const fileName = `${space.id}/${Date.now()}-${i}.${ext}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('space-photos')
      .upload(fileName, file, { upsert: false })

    if (uploadError) continue

    const {
      data: { publicUrl },
    } = supabase.storage.from('space-photos').getPublicUrl(fileName)

    await supabase.from('space_photos').insert({
      space_id: space.id,
      url: publicUrl,
      order: i,
    })
  }

  revalidatePath('/owner/spaces')
  redirect(`/spaces/${space.id}`)
}

export async function updateSpace(spaceId: string, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const type = formData.get('type') as string
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const state = formData.get('state') as string
  const lat = formData.get('lat') ? parseFloat(formData.get('lat') as string) : null
  const lng = formData.get('lng') ? parseFloat(formData.get('lng') as string) : null
  const area_m2 = parseFloat(formData.get('area_m2') as string)
  const solar_orientation = formData.getAll('solar_orientation') as string[]
  const roof_type = (formData.get('roof_type') as string) || null
  const desired_rent = formData.get('desired_rent')
    ? parseFloat(formData.get('desired_rent') as string)
    : null
  const description = (formData.get('description') as string) || null
  const status = formData.get('status') as string

  const { error } = await supabase
    .from('spaces')
    .update({
      type,
      address,
      city,
      state,
      lat,
      lng,
      area_m2,
      solar_orientation,
      roof_type,
      desired_rent,
      description,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', spaceId)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }

  // Handle new photos
  const photos = formData.getAll('photos') as File[]
  const validPhotos = photos.filter((f) => f.size > 0)

  if (validPhotos.length > 0) {
    // Get current photo count for ordering
    const { data: existingPhotos } = await supabase
      .from('space_photos')
      .select('order')
      .eq('space_id', spaceId)
      .order('order', { ascending: false })
      .limit(1)

    const startOrder = existingPhotos?.[0]?.order != null ? existingPhotos[0].order + 1 : 0

    for (let i = 0; i < validPhotos.length; i++) {
      const file = validPhotos[i]
      const ext = file.name.split('.').pop()
      const fileName = `${spaceId}/${Date.now()}-${i}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('space-photos')
        .upload(fileName, file, { upsert: false })

      if (uploadError) continue

      const {
        data: { publicUrl },
      } = supabase.storage.from('space-photos').getPublicUrl(fileName)

      await supabase.from('space_photos').insert({
        space_id: spaceId,
        url: publicUrl,
        order: startOrder + i,
      })
    }
  }

  revalidatePath('/owner/spaces')
  revalidatePath(`/spaces/${spaceId}`)
  redirect(`/spaces/${spaceId}`)
}

export async function deleteSpace(spaceId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('spaces').delete().eq('id', spaceId).eq('owner_id', user.id)

  revalidatePath('/owner/spaces')
  redirect('/owner/spaces')
}

export async function deleteSpacePhoto(photoId: string, spaceId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify ownership
  const { data: space } = await supabase
    .from('spaces')
    .select('id')
    .eq('id', spaceId)
    .eq('owner_id', user.id)
    .single()

  if (!space) return { error: 'Não autorizado' }

  await supabase.from('space_photos').delete().eq('id', photoId)
  revalidatePath(`/owner/spaces/${spaceId}/edit`)
  return { success: true }
}
