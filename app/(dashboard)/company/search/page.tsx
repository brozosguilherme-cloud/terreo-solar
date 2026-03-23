import { redirect } from 'next/navigation'
import { Search, SlidersHorizontal } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import SpaceCard from '@/components/SpaceCard'
import SearchFilters from './SearchFilters'
import type { SpaceWithPhotos } from '@/types/database'

interface SearchParams {
  type?: string
  city?: string
  state?: string
  min_area?: string
  max_rent?: string
  orientation?: string
  status?: string
}

export default async function CompanySearchPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_completed')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'company') redirect('/owner/dashboard')
  if (!profile?.onboarding_completed) redirect('/company/onboarding')

  // Build query
  let query = supabase
    .from('spaces')
    .select('*, space_photos(id, url, order), profiles!spaces_owner_id_fkey(id, name)')
    .order('created_at', { ascending: false })

  // Apply filters
  const status = searchParams.status ?? 'available'
  if (status !== 'all') {
    query = query.eq('status', status)
  }

  if (searchParams.type) {
    query = query.eq('type', searchParams.type)
  }

  if (searchParams.city) {
    query = query.ilike('city', `%${searchParams.city}%`)
  }

  if (searchParams.state) {
    query = query.ilike('state', searchParams.state)
  }

  if (searchParams.min_area) {
    query = query.gte('area_m2', parseFloat(searchParams.min_area))
  }

  if (searchParams.max_rent) {
    query = query.or(
      `desired_rent.is.null,desired_rent.lte.${parseFloat(searchParams.max_rent)}`
    )
  }

  if (searchParams.orientation) {
    query = query.contains('solar_orientation', [searchParams.orientation])
  }

  const { data: spaces } = await query.limit(50)

  const hasFilters = Object.keys(searchParams).some(
    (k) => searchParams[k as keyof SearchParams] && k !== 'status'
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Buscar Espaços</h1>
        <p className="text-stone-500">
          {spaces?.length ?? 0} espaços encontrados
          {hasFilters && ' com os filtros aplicados'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Filters sidebar */}
        <aside>
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sticky top-24">
            <div className="mb-4 flex items-center gap-2 font-semibold text-stone-700">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
            </div>
            <SearchFilters currentFilters={searchParams} />
          </div>
        </aside>

        {/* Results */}
        <div>
          {!spaces?.length ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 py-20 text-center">
              <Search className="h-12 w-12 text-stone-300 mb-4" />
              <h3 className="text-lg font-semibold text-stone-600 mb-2">
                Nenhum espaço encontrado
              </h3>
              <p className="text-stone-400 text-sm max-w-xs">
                Tente ajustar os filtros ou ampliar a área de busca.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {spaces.map((space) => (
                <SpaceCard
                  key={space.id}
                  space={space as SpaceWithPhotos}
                  showStatus={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
