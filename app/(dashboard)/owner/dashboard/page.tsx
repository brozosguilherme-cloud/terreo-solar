import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, Home, Bell, MessageSquare, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { spaceStatusLabel, spaceStatusColor, formatArea, timeAgo } from '@/lib/utils'
import InterestActions from './InterestActions'

export default async function OwnerDashboardPage() {
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

  if (profile?.role !== 'owner') redirect('/company/dashboard')
  if (!profile?.onboarding_completed) redirect('/owner/onboarding')

  // Fetch spaces
  const { data: spaces } = await supabase
    .from('spaces')
    .select('*, space_photos(url, order)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch pending interests on owner's spaces
  const { data: pendingInterests } = await supabase
    .from('interests')
    .select(`
      id, status, created_at,
      spaces(id, type, city, state, area_m2),
      profiles!interests_company_id_fkey(name, email),
      company_profiles(company_name)
    `)
    .in('space_id', spaces?.map((s) => s.id) ?? [])
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Fetch accepted chats with unread count
  const { data: acceptedInterests } = await supabase
    .from('interests')
    .select(`
      id, created_at,
      spaces(id, type, city),
      profiles!interests_company_id_fkey(name),
      company_profiles(company_name),
      messages(id, read_at, sender_id)
    `)
    .in('space_id', spaces?.map((s) => s.id) ?? [])
    .eq('status', 'accepted')
    .order('created_at', { ascending: false })

  const totalSpaces = spaces?.length ?? 0
  const availableSpaces = spaces?.filter((s) => s.status === 'available').length ?? 0
  const pendingCount = pendingInterests?.length ?? 0

  // Count unread messages per interest
  const unreadTotal =
    acceptedInterests?.reduce((acc, interest) => {
      const unread = (interest.messages as { sender_id: string; read_at: string | null }[])?.filter(
        (m) => m.sender_id !== user.id && !m.read_at
      ).length ?? 0
      return acc + unread
    }, 0) ?? 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            Olá, {profile?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-stone-500">Gerencie seus espaços e negociações</p>
        </div>
        <Link href="/owner/spaces/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Espaço
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total de espaços', value: totalSpaces, icon: Home, color: 'solar' },
          { label: 'Disponíveis', value: availableSpaces, icon: TrendingUp, color: 'green' },
          { label: 'Interesses pendentes', value: pendingCount, icon: Bell, color: 'amber' },
          { label: 'Mensagens não lidas', value: unreadTotal, icon: MessageSquare, color: 'blue' },
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

      {/* Pending Interests */}
      {pendingCount > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-stone-900">
              Interesses pendentes ({pendingCount})
            </h2>
          </div>
          <div className="space-y-3">
            {pendingInterests?.map((interest) => {
              const company = interest.company_profiles as { company_name: string } | null
              const companyProfile = interest.profiles as { name: string; email: string } | null
              const space = interest.spaces as {
                id: string
                type: string
                city: string
                state: string
                area_m2: number
              } | null

              return (
                <Card key={interest.id} className="border-amber-200 bg-amber-50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-stone-900">
                          {company?.company_name ?? companyProfile?.name ?? 'Empresa'}
                        </p>
                        <p className="text-sm text-stone-600">
                          Demonstrou interesse em:{' '}
                          <span className="font-medium">
                            {space?.type === 'terreno' ? 'Terreno' : 'Telhado'} em {space?.city},{' '}
                            {space?.state} — {formatArea(space?.area_m2 ?? 0)}
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-stone-400">{timeAgo(interest.created_at)}</p>
                      </div>
                      <InterestActions interestId={interest.id} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* Active Chats */}
      {(acceptedInterests?.length ?? 0) > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-terreo-600" />
            <h2 className="text-lg font-semibold text-stone-900">Negociações ativas</h2>
          </div>
          <div className="space-y-3">
            {acceptedInterests?.map((interest) => {
              const company = interest.company_profiles as { company_name: string } | null
              const companyProfile = interest.profiles as { name: string } | null
              const space = interest.spaces as { id: string; type: string; city: string } | null
              const unread = (interest.messages as { sender_id: string; read_at: string | null }[])?.filter(
                (m) => m.sender_id !== user.id && !m.read_at
              ).length ?? 0

              return (
                <Link key={interest.id} href={`/chat/${interest.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-stone-900">
                            {company?.company_name ?? companyProfile?.name ?? 'Empresa'}
                          </p>
                          <p className="text-sm text-stone-500">
                            {space?.type === 'terreno' ? 'Terreno' : 'Telhado'} em {space?.city}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
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

      {/* Spaces list */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">Meus espaços</h2>
          <Link href="/owner/spaces" className="text-sm text-terreo-700 hover:underline">
            Ver todos →
          </Link>
        </div>
        {!spaces?.length ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Home className="h-12 w-12 text-stone-300 mb-4" />
              <p className="text-stone-500 mb-4">Você ainda não cadastrou nenhum espaço</p>
              <Link href="/owner/spaces/new">
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Cadastrar primeiro espaço
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {spaces.slice(0, 5).map((space) => (
              <Card key={space.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-stone-900">
                          {space.type === 'terreno' ? 'Terreno' : 'Telhado'} — {space.city}, {space.state}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${spaceStatusColor(space.status)}`}>
                          {spaceStatusLabel(space.status)}
                        </span>
                      </div>
                      <p className="text-sm text-stone-500">{formatArea(space.area_m2)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/spaces/${space.id}`}>
                        <Button variant="outline" size="sm">Ver</Button>
                      </Link>
                      <Link href={`/owner/spaces/${space.id}/edit`}>
                        <Button variant="secondary" size="sm">Editar</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
