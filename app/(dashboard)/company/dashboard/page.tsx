'use client'

import Link from 'next/link'
import { Search, MessageSquare, Sun, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MOCK_COMPANY, MOCK_INTERESTS, MOCK_SPACES } from '@/lib/mock-data'
import { spaceTypeLabel, formatArea, formatCurrency } from '@/lib/utils'

export default function CompanyDashboardPage() {
  const myInterests = MOCK_INTERESTS.filter((i) => i.company_id === MOCK_COMPANY.id)
  const pending = myInterests.filter((i) => i.status === 'pending')
  const accepted = myInterests.filter((i) => i.status === 'accepted')

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Olá, {MOCK_COMPANY.name.split(' ')[0]} 👋</h1>
          <p className="text-stone-500">Gerencie seus interesses e negociações</p>
        </div>
        <Link href="/company/search">
          <Button className="gap-2"><Search className="h-4 w-4" />Buscar espaços</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Interesses enviados', value: myInterests.length, icon: Sun, color: 'solar' },
          { label: 'Aguardando resposta', value: pending.length, icon: Clock, color: 'amber' },
          { label: 'Negociações ativas', value: accepted.length, icon: CheckCircle, color: 'green' },
          { label: 'Msgs não lidas', value: 1, icon: MessageSquare, color: 'blue' },
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

      {accepted.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-terreo-600" />
            <h2 className="text-lg font-semibold text-stone-900">Negociações ativas</h2>
          </div>
          <div className="space-y-3">
            {accepted.map((interest) => {
              const space = MOCK_SPACES.find((s) => s.id === interest.space_id)
              return (
                <Link key={interest.id} href={`/chat/${interest.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-terreo-50">
                          <Sun className="h-7 w-7 text-terreo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-stone-900">{spaceTypeLabel(space?.type ?? '')} — {space?.city}, {space?.state}</p>
                          <p className="text-sm text-stone-500">{formatArea(space?.area_m2 ?? 0)} · {formatCurrency(space?.desired_rent ?? null)}/mês</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-terreo-800 text-xs font-bold text-white">1</span>
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

      {pending.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-stone-900">Aguardando resposta</h2>
          </div>
          <div className="space-y-3">
            {pending.map((interest) => {
              const space = MOCK_SPACES.find((s) => s.id === interest.space_id)
              return (
                <Link key={interest.id} href={`/spaces/${space?.id}`}>
                  <Card className="border-amber-200 bg-amber-50 hover:shadow-sm cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-stone-900">{spaceTypeLabel(space?.type ?? '')} em {space?.city}, {space?.state}</p>
                          <p className="text-sm text-stone-500">{formatArea(space?.area_m2 ?? 0)}</p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Pendente</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
