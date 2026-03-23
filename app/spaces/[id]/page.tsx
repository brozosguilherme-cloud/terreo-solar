import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  MapPin,
  Maximize2,
  Sun,
  Banknote,
  Home,
  Building2,
  ArrowLeft,
  Pencil,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import {
  spaceTypeLabel,
  spaceStatusLabel,
  spaceStatusColor,
  formatArea,
  formatCurrency,
  roofTypeLabel,
} from '@/lib/utils'
import InterestButton from './InterestButton'

export default async function SpaceDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: space } = await supabase
    .from('spaces')
    .select(`
      *,
      space_photos(id, url, order),
      profiles!spaces_owner_id_fkey(id, name, email)
    `)
    .eq('id', params.id)
    .single()

  if (!space) notFound()

  const photos = (space.space_photos as { id: string; url: string; order: number }[])
    ?.sort((a, b) => a.order - b.order) ?? []

  const ownerProfile = space.profiles as { id: string; name: string; email: string } | null

  // Check if current user has already expressed interest
  let existingInterest: { id: string; status: string } | null = null
  let userRole: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    userRole = profile?.role ?? null

    if (userRole === 'company') {
      const { data: interest } = await supabase
        .from('interests')
        .select('id, status')
        .eq('space_id', params.id)
        .eq('company_id', user.id)
        .single()
      existingInterest = interest
    }
  }

  const isOwner = user?.id === ownerProfile?.id

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href={user ? `/${userRole}/dashboard` : '/'} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-terreo-800">
                <Sun className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-stone-900">
                Térreo<span className="text-terreo-700">Solar</span>
              </span>
            </Link>
            {!user && (
              <nav className="flex gap-2">
                <Link href="/login"><Button variant="outline" size="sm">Entrar</Button></Link>
                <Link href="/register"><Button size="sm">Cadastrar</Button></Link>
              </nav>
            )}
            {user && userRole === 'company' && (
              <Link href="/company/search">
                <Button variant="ghost" size="sm">← Busca</Button>
              </Link>
            )}
            {isOwner && (
              <Link href={`/owner/spaces/${params.id}/edit`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Left: Photos + Info */}
          <div className="space-y-6">
            {/* Photos */}
            <div className="space-y-2">
              {photos.length > 0 ? (
                <>
                  <div className="relative h-72 sm:h-96 w-full overflow-hidden rounded-2xl">
                    <Image
                      src={photos[0].url}
                      alt="Foto principal"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  {photos.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {photos.slice(1, 5).map((photo, i) => (
                        <div
                          key={photo.id}
                          className="relative aspect-square overflow-hidden rounded-lg"
                        >
                          <Image
                            src={photo.url}
                            alt={`Foto ${i + 2}`}
                            fill
                            className="object-cover"
                          />
                          {i === 3 && photos.length > 5 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white font-bold text-lg">
                              +{photos.length - 5}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-72 items-center justify-center rounded-2xl bg-stone-100">
                  <Sun className="h-16 w-16 text-stone-300" />
                </div>
              )}
            </div>

            {/* Title & Status */}
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-stone-900">
                  {spaceTypeLabel(space.type)} disponível em {space.city}, {space.state}
                </h1>
                <p className="mt-1 text-stone-500">{space.address}</p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${spaceStatusColor(
                  space.status
                )}`}
              >
                {spaceStatusLabel(space.status)}
              </span>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-stone-200 bg-white p-5 sm:grid-cols-4">
              <div className="text-center">
                <p className="text-xs text-stone-400 uppercase tracking-wide">Área</p>
                <p className="mt-1 font-bold text-stone-900">{formatArea(space.area_m2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-stone-400 uppercase tracking-wide">Orientação</p>
                <p className="mt-1 font-bold text-stone-900">
                  {space.solar_orientation?.join(', ') || '—'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-stone-400 uppercase tracking-wide">Tipo telhado</p>
                <p className="mt-1 font-bold text-stone-900">{roofTypeLabel(space.roof_type)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-stone-400 uppercase tracking-wide">Locação/mês</p>
                <p className="mt-1 font-bold text-terreo-800">
                  {formatCurrency(space.desired_rent)}
                </p>
              </div>
            </div>

            {/* Description */}
            {space.description && (
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <h2 className="mb-3 font-semibold text-stone-900">Descrição</h2>
                <p className="whitespace-pre-line text-stone-600 text-sm leading-relaxed">
                  {space.description}
                </p>
              </div>
            )}

            {/* Location */}
            {(space.lat && space.lng) && (
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <h2 className="mb-3 font-semibold text-stone-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-terreo-600" />
                  Localização
                </h2>
                <p className="text-stone-600 text-sm">{space.address}</p>
                <p className="text-stone-400 text-xs mt-1">
                  {space.lat}°, {space.lng}°
                </p>
              </div>
            )}
          </div>

          {/* Right: Action card */}
          <div className="space-y-4">
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm sticky top-24">
              <div className="mb-4 text-center">
                <p className="text-3xl font-bold text-terreo-800">
                  {formatCurrency(space.desired_rent)}
                  {space.desired_rent && (
                    <span className="text-sm font-normal text-stone-400">/mês</span>
                  )}
                </p>
                <p className="text-sm text-stone-500 mt-1">Valor desejado de locação</p>
              </div>

              {/* Action for company */}
              {user && userRole === 'company' && !isOwner && (
                <div className="space-y-3">
                  {!existingInterest ? (
                    <InterestButton spaceId={params.id} spaceStatus={space.status} />
                  ) : existingInterest.status === 'pending' ? (
                    <div className="flex items-center justify-center gap-2 rounded-lg bg-amber-50 border border-amber-200 py-3 text-sm font-medium text-amber-700">
                      <Clock className="h-4 w-4" />
                      Aguardando resposta do proprietário
                    </div>
                  ) : existingInterest.status === 'accepted' ? (
                    <Link href={`/chat/${existingInterest.id}`}>
                      <Button className="w-full gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Abrir chat com proprietário
                      </Button>
                    </Link>
                  ) : (
                    <div className="flex items-center justify-center gap-2 rounded-lg bg-red-50 border border-red-200 py-3 text-sm font-medium text-red-600">
                      <XCircle className="h-4 w-4" />
                      Interesse não aceito
                    </div>
                  )}
                </div>
              )}

              {/* Not logged in */}
              {!user && (
                <div className="space-y-2">
                  <Link href="/register?role=company">
                    <Button className="w-full gap-2">
                      <Building2 className="h-4 w-4" />
                      Cadastre-se para demonstrar interesse
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" className="w-full">
                      Já tenho conta — Entrar
                    </Button>
                  </Link>
                </div>
              )}

              {/* Owner view */}
              {isOwner && (
                <Link href={`/owner/spaces/${params.id}/edit`}>
                  <Button variant="outline" className="w-full gap-2">
                    <Pencil className="h-4 w-4" />
                    Editar espaço
                  </Button>
                </Link>
              )}

              {/* Separator */}
              <div className="mt-4 pt-4 border-t border-stone-100">
                <div className="flex items-center gap-2 text-sm text-stone-500">
                  <Home className="h-4 w-4 text-stone-400" />
                  <span>Proprietário: {ownerProfile?.name ?? 'Não informado'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
