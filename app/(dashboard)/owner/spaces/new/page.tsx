import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createSpace } from '@/app/actions/spaces'
import SpaceForm from '@/components/SpaceForm'

export default async function NewSpacePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') redirect('/company/dashboard')

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
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Cadastrar novo espaço</h1>
        <p className="text-stone-500">
          Preencha as informações do seu terreno ou telhado disponível.
        </p>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <SpaceForm action={createSpace} submitLabel="Publicar espaço" />
      </div>
    </div>
  )
}
