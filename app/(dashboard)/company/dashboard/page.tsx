import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { Search, MessageSquare, Sun, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { spaceTypeLabel, formatArea, formatCurrency, timeAgo } from '@/lib/utils'

export default async function CompanyDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name, onboarding_completed')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'company') redirect('/owner/dashboard')
  if (!profile?.onboarding_completed) redirect('/company/onboarding')

  const { data: interests } = await supabase
    .from('interests')
    .select(`
      id, status, created_at,
      spaces(
        id, type, city, state, area_m2, desired_rent, status,
        space_photos(url, order)
      ),
      messages(id, read_at, sender_id)
    `)
    .eq('company_id', user.id)
    .order('created_at', { ascending: false })

  const pending = interests?.filter((i) => i.status === 'pending') ?? []
  const accepted = interests?.filter((i) => i.status === 'accepted') ?? []
  const rejected = interests?.filter((i) => i.status === 'rejected') ?? []

  const totalUnread = accepted.reduce((acc, interest) => {
    const unread = (interest.messages as { sender_id: string; read_at: string | null }[])?.filter(
      (m) => m.sender_id !== user.id && !m.read_at
    ).length ?? 0
    return acc + unread
  }, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            Olá, {profile?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-stone-500">Gerencie seus interesses e negociações</p>
        </div>
        <Link href="/company/search">
          <Button className="gap-2">
            <Search className="h-4 w-4" />
            Buscar espaços
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Interesses enviados', value: interests?.length ?? 0, icon: Sun, color: 'solar' },
          { label: 'Aguardando resposta', value: pending.length, icon: Clock, color: 'amber' },
          { label: 'Negociações ativas', value: accepted.length, icon: CheckCircle, color: 'green' },
          { label: 'Msgs não lidas', value: totalUnread, icon: MessageSquare, color: 'blue' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-stone-900">{stat.value}</p>
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    stat.color === 'solar'
                      ? 'bg-terreo-100'
                      : stat.color === 'green'
                      ? 'bg-green-100'
                      : stat.color === 'amber'
                      ? 'bg-amber-100'
                      : 'bg-blue-100'
                  }`}
                >
                  <stat.icon
                    className={`h-5 w-5 ${
                      stat.color === 'solar'
                        ? 'text-terreo-700'
                        : stat.color === 'green'
                        ? 'text-green-600'
                        : stat.color === 'amber'
                        ? 'text-amber-600'
                        : 'text-blue-600'
                    }`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active negotiations */}
      {accepted.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-terreo-600" />
            <h2 className="text-lg font-semibold text-stone-900">Negociações ativas</h2>
          </div>
          <div className="space-y-3">
            {accepted.map((interest) => {
              const space = interest.spaces as {
                id: string
                type: string
                city: string
                state: string
                area_m2: number
                desired_rent: number | null
                space_photos: { url: string; order: number }[]
              } | null
              const mainPhoto = space?.space_photos?.sort((a, b) => a.order - b.order)[0]
              const unread = (interest.messages as { sender_id: string; read_at: string | null }[])?.filter(
                (m) => m.sender_id !== user.id && !m.read_at
              ).length ?? 0

              return (
                <Link key={interest.id} href={`/chat/${interest.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                          {mainPhoto ? (
                            <Image src={mainPhoto.url} alt="" fill className="object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Sun className="h-6 w-6 text-stone-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-stone-900">
                            {spaceTypeLabel(space?.type ?? '')} — {space?.city}, {space?.state}
                          </p>
                          <p className="text-sm text-stone-500">
                            {formatArea(space?.area_m2 ?? 0)} ·{' '}
                            {formatCurrency(space?.desired_rent ?? null)}
                            {space?.desired_rent && '/mês'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {unread > 0 && (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-terreo-800 text-xs font-bold text-white">
                              {unread}
                            </span>
                          )}
                          <MessageSquare className="h-4 w-4 text-stone-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-stone-900">Aguardando resposta</h2>
          </div>
          <div className="space-y-3">
            {pending.map((interest) => {
              const space = interest.spaces as {
                id: string
                type: string
                city: string
                state: string
                area_m2: number
                space_photos: { url: string; order: number }[]
              } | null

              return (
                <Link key={interest.id} href={`/spaces/${space?.id}`}>
                  <Card className="border-amber-200 bg-amber-50 hover:shadow-sm cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-stone-900">
                            {spaceTypeLabel(space?.type ?? '')} em {space?.city}, {space?.state}
                          </p>
                          <p className="text-sm text-stone-500">
                            {formatArea(space?.area_m2 ?? 0)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                            Pendente
                          </span>
                          <p className="mt-1 text-xs text-stone-400">{timeAgo(interest.created_at)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* No interests yet */}
      {!interests?.length && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-16 w-16 text-stone-200 mb-4" />
            <h3 className="text-lg font-semibold text-stone-700 mb-2">
              Nenhum interesse ainda
            </h3>
            <p className="text-stone-400 mb-6 max-w-sm">
              Busque espaços disponíveis e demonstre interesse para iniciar negociações.
            </p>
            <Link href="/company/search">
              <Button className="gap-2">
                <Search className="h-4 w-4" />
                Buscar espaços agora
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
