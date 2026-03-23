'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Home, Bell, MessageSquare, TrendingUp, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MOCK_OWNER, MOCK_SPACES, MOCK_INTERESTS } from '@/lib/mock-data'
import { spaceStatusLabel, spaceStatusColor, formatArea, timeAgo } from '@/lib/utils'

export default function OwnerDashboardPage() {
  const [interestStates, setInterestStates] = useState<Record<string, string>>({})

  const ownerSpaces = MOCK_SPACES.filter((s) => s.owner_id === MOCK_OWNER.id)
  const pendingInterests = MOCK_INTERESTS.filter(
    (i) => ownerSpaces.some((s) => s.id === i.space_id) && (interestStates[i.id] ?? i.status) === 'pending'
  )
  const acceptedInterests = MOCK_INTERESTS.filter(
    (i) => ownerSpaces.some((s) => s.id === i.space_id) && (interestStates[i.id] ?? i.status) === 'accepted'
  )

  function handleInterest(id: string, action: 'accepted' | 'rejected') {
    setInterestStates((prev) => ({ ...prev, [id]: action }))
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Olá, {MOCK_OWNER.name.split(' ')[0]} 👋</h1>
          <p className="text-stone-500">Gerencie seus espaços e negociações</p>
        </div>
        <Link href="/owner/spaces/new">
          <Button className="gap-2"><Plus className="h-4 w-4" />Novo Espaço</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total de espaços', value: ownerSpaces.length, icon: Home, color: 'solar' },
          { label: 'Disponíveis', value: ownerSpaces.filter((s) => s.status === 'available').length, icon: TrendingUp, color: 'green' },
          { label: 'Interesses pendentes', value: pendingInterests.length, icon: Bell, color: 'amber' },
          { label: 'Negociações ativas', value: acceptedInterests.length, icon: MessageSquare, color: 'blue' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-stone-900">{stat.value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.color === 'solar' ? 'bg-terreo-100' : stat.color === 'green' ? 'bg-green-100' : stat.color === 'amber' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color === 'solar' ? 'text-terreo-700' : stat.color === 'green' ? 'text-green-600' : stat.color === 'amber' ? 'text-amber-600' : 'text-blue-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pendingInterests.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-stone-900">Interesses pendentes ({pendingInterests.length})</h2>
          </div>
          <div className="space-y-3">
            {pendingInterests.map((interest) => {
              const space = MOCK_SPACES.find((s) => s.id === interest.space_id)
              return (
                <Card key={interest.id} className="border-amber-200 bg-amber-50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-stone-900">{interest.company_name}</p>
                        <p className="text-sm text-stone-600">
                          Demonstrou interesse em:{' '}
                          <span className="font-medium">
                            {space?.type === 'terreno' ? 'Terreno' : 'Telhado'} em {space?.city}, {space?.state} — {formatArea(space?.area_m2 ?? 0)}
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-stone-400">{timeAgo(interest.created_at)}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" onClick={() => handleInterest(interest.id, 'accepted')} className="bg-terreo-800 hover:bg-terreo-900 gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> Aceitar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleInterest(interest.id, 'rejected')} className="gap-1 text-red-600 border-red-200 hover:bg-red-50">
                          <XCircle className="h-3.5 w-3.5" /> Recusar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {acceptedInterests.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-terreo-600" />
            <h2 className="text-lg font-semibold text-stone-900">Negociações ativas</h2>
          </div>
          <div className="space-y-3">
            {acceptedInterests.map((interest) => {
              const space = MOCK_SPACES.find((s) => s.id === interest.space_id)
              return (
                <Link key={interest.id} href={`/chat/${interest.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-stone-900">{interest.company_name}</p>
                          <p className="text-sm text-stone-500">{space?.type === 'terreno' ? 'Terreno' : 'Telhado'} em {space?.city}</p>
                        </div>
                        <MessageSquare className="h-4 w-4 text-stone-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">Meus espaços</h2>
          <Link href="/owner/spaces" className="text-sm text-terreo-700 hover:underline">Ver todos →</Link>
        </div>
        <div className="space-y-3">
          {ownerSpaces.map((space) => (
            <Card key={space.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-900">{space.type === 'terreno' ? 'Terreno' : 'Telhado'} — {space.city}, {space.state}</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${spaceStatusColor(space.status)}`}>{spaceStatusLabel(space.status)}</span>
                    </div>
                    <p className="text-sm text-stone-500">{formatArea(space.area_m2)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/spaces/${space.id}`}><Button variant="outline" size="sm">Ver</Button></Link>
                    <Link href={`/owner/spaces/${space.id}/edit`}><Button variant="secondary" size="sm">Editar</Button></Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
