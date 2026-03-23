import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { Plus, Sun, Pencil, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import {
  formatArea,
  formatCurrency,
  spaceTypeLabel,
  spaceStatusLabel,
  spaceStatusColor,
} from '@/lib/utils'

export default async function OwnerSpacesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: spaces } = await supabase
    .from('spaces')
    .select('*, space_photos(id, url, order)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Meus Espaços</h1>
          <p className="text-stone-500">{spaces?.length ?? 0} espaços cadastrados</p>
        </div>
        <Link href="/owner/spaces/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Espaço
          </Button>
        </Link>
      </div>

      {!spaces?.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Sun className="h-16 w-16 text-stone-200 mb-4" />
            <h3 className="text-lg font-semibold text-stone-700 mb-2">
              Nenhum espaço cadastrado
            </h3>
            <p className="text-stone-400 mb-6 max-w-sm">
              Cadastre seu primeiro terreno ou telhado e comece a receber propostas de
              empresas instaladoras.
            </p>
            <Link href="/owner/spaces/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Cadastrar espaço
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => {
            const mainPhoto = space.space_photos
              ?.sort((a: { order: number }, b: { order: number }) => a.order - b.order)
              ?.[0]

            return (
              <Card key={space.id} className="overflow-hidden">
                <div className="relative h-40 bg-stone-100">
                  {mainPhoto ? (
                    <Image
                      src={mainPhoto.url}
                      alt={`${spaceTypeLabel(space.type)} em ${space.city}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Sun className="h-10 w-10 text-stone-300" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${spaceStatusColor(
                        space.status
                      )}`}
                    >
                      {spaceStatusLabel(space.status)}
                    </span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="font-semibold text-stone-900">
                    {spaceTypeLabel(space.type)} — {space.city}, {space.state}
                  </p>
                  <p className="text-sm text-stone-500 mt-0.5">
                    {formatArea(space.area_m2)} · {formatCurrency(space.desired_rent)}
                    {space.desired_rent && '/mês'}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Link href={`/spaces/${space.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        Ver
                      </Button>
                    </Link>
                    <Link href={`/owner/spaces/${space.id}/edit`} className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full gap-1.5">
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
