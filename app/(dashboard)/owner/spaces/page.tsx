'use client'

import Link from 'next/link'
import { Plus, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MOCK_OWNER, MOCK_SPACES } from '@/lib/mock-data'
import { spaceStatusLabel, spaceStatusColor, formatArea, formatCurrency } from '@/lib/utils'

export default function OwnerSpacesPage() {
  const spaces = MOCK_SPACES.filter((s) => s.owner_id === MOCK_OWNER.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Meus Espaços</h1>
          <p className="text-stone-500">{spaces.length} espaços cadastrados</p>
        </div>
        <Link href="/owner/spaces/new">
          <Button className="gap-2"><Plus className="h-4 w-4" />Novo Espaço</Button>
        </Link>
      </div>

      {spaces.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Home className="h-12 w-12 text-stone-300 mb-4" />
            <p className="text-stone-500 mb-4">Você ainda não cadastrou nenhum espaço</p>
            <Link href="/owner/spaces/new">
              <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" />Cadastrar primeiro espaço</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {spaces.map((space) => (
            <Card key={space.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-semibold text-stone-900">{space.type === 'terreno' ? 'Terreno' : 'Telhado'}</h3>
                    <p className="text-sm text-stone-500">{space.city}, {space.state}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${spaceStatusColor(space.status)}`}>
                    {spaceStatusLabel(space.status)}
                  </span>
                </div>
                <div className="space-y-1.5 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Área</span>
                    <span className="font-medium text-stone-800">{formatArea(space.area_m2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Orientação</span>
                    <span className="font-medium text-stone-800">{space.solar_orientation?.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Aluguel desejado</span>
                    <span className="font-medium text-terreo-700">{formatCurrency(space.desired_rent)}/mês</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/spaces/${space.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">Ver</Button>
                  </Link>
                  <Link href={`/owner/spaces/${space.id}/edit`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">Editar</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
