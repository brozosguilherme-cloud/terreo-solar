import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { updateSpace, deleteSpace } from '@/app/actions/spaces'
import SpaceForm from '@/components/SpaceForm'
import { Button } from '@/components/ui/button'
import type { Space, SpacePhoto } from '@/types/database'

export default async function EditSpacePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: space } = await supabase
    .from('spaces')
    .select('*, space_photos(id, url, order)')
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .single()

  if (!space) notFound()

  const existingPhotos = (space.space_photos as SpacePhoto[])
    ?.sort((a, b) => a.order - b.order) ?? []

  async function handleUpdate(formData: FormData) {
    'use server'
    await updateSpace(params.id, formData)
  }

  async function handleDelete() {
    'use server'
    await deleteSpace(params.id)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/owner/spaces"
          className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Meus espaços
        </Link>
      </div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Editar espaço</h1>
          <p className="text-stone-500">
            {space.type === 'terreno' ? 'Terreno' : 'Telhado'} em {space.city}, {space.state}
          </p>
        </div>
        <form action={handleDelete}>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="border-red-200 text-red-600 hover:bg-red-50 gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        </form>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <SpaceForm
          action={handleUpdate}
          space={space as Space}
          existingPhotos={existingPhotos}
          submitLabel="Salvar alterações"
        />
      </div>
    </div>
  )
}
