/**
 * Página de DEMO — Dashboard do Proprietário (sem auth)
 * Acesse em /demo/owner para visualizar sem login
 */
import Link from 'next/link'
import { Sun, Plus, Home, Bell, MessageSquare, TrendingUp, Check, X, Pencil, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const mockSpaces = [
  { id: '1', type: 'terreno', city: 'Campinas', state: 'SP', area_m2: 2500, status: 'available', desired_rent: 3500 },
  { id: '2', type: 'telhado', city: 'Rio de Janeiro', state: 'RJ', area_m2: 800, status: 'negotiating', desired_rent: 1200 },
  { id: '3', type: 'terreno', city: 'Belo Horizonte', state: 'MG', area_m2: 1200, status: 'negotiating', desired_rent: 2000 },
]

const mockPendingInterests = [
  { id: 'i1', company: 'SolarTech Energia Ltda.', space: 'Terreno em Campinas, SP — 2.500 m²', ago: '2h atrás' },
  { id: 'i2', company: 'EnerSol Brasil', space: 'Telhado em Rio de Janeiro, RJ — 800 m²', ago: '5h atrás' },
]

const mockChats = [
  { id: 'c1', company: 'SolarTech Energia Ltda.', space: 'Terreno em Belo Horizonte, MG', unread: 3 },
]

const statusColor: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  negotiating: 'bg-yellow-100 text-yellow-800',
  rented: 'bg-gray-100 text-gray-600',
}
const statusLabel: Record<string, string> = {
  available: 'Disponível',
  negotiating: 'Em negociação',
  rented: 'Locado',
}

export default function DemoOwnerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-solar-600">
                <Sun className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">Solar<span className="text-solar-600">Match</span></span>
            </div>
            <nav className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="h-4 w-4" /><span className="hidden sm:inline">Dashboard</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Plus className="h-4 w-4" /><span className="hidden sm:inline">Novo Espaço</span>
              </Button>
              <div className="ml-2 flex items-center gap-2 border-l border-gray-200 pl-2">
                <span className="hidden text-sm text-gray-500 sm:block">João</span>
                <div className="h-8 w-8 rounded-full bg-solar-100 flex items-center justify-center text-solar-700 font-bold text-sm">J</div>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Demo badge */}
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-700 flex items-center gap-2">
          👁️ <strong>Modo demo</strong> — visualização sem login. Dados fictícios para ilustração.
          <Link href="/demo/company" className="ml-auto text-amber-800 underline font-medium">Ver visão da Empresa →</Link>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Olá, João 👋</h1>
            <p className="text-gray-500">Gerencie seus espaços e negociações</p>
          </div>
          <Button className="gap-2"><Plus className="h-4 w-4" />Novo Espaço</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total de espaços', value: 3, icon: Home, color: 'solar' },
            { label: 'Disponíveis', value: 1, icon: TrendingUp, color: 'green' },
            { label: 'Interesses pendentes', value: 2, icon: Bell, color: 'amber' },
            { label: 'Mensagens não lidas', value: 3, icon: MessageSquare, color: 'blue' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.color === 'solar' ? 'bg-solar-100' : stat.color === 'green' ? 'bg-green-100' : stat.color === 'amber' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color === 'solar' ? 'text-solar-600' : stat.color === 'green' ? 'text-green-600' : stat.color === 'amber' ? 'text-amber-600' : 'text-blue-600'}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pending Interests */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">Interesses pendentes (2)</h2>
          </div>
          <div className="space-y-3">
            {mockPendingInterests.map((interest) => (
              <Card key={interest.id} className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">{interest.company}</p>
                      <p className="text-sm text-gray-600">Demonstrou interesse em: <span className="font-medium">{interest.space}</span></p>
                      <p className="mt-1 text-xs text-gray-400">{interest.ago}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" className="gap-1.5"><Check className="h-3.5 w-3.5" />Aceitar</Button>
                      <Button size="sm" variant="outline" className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"><X className="h-3.5 w-3.5" />Recusar</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Active Chats */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-solar-500" />
            <h2 className="text-lg font-semibold text-gray-900">Negociações ativas</h2>
          </div>
          <div className="space-y-3">
            {mockChats.map((chat) => (
              <Card key={chat.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{chat.company}</p>
                      <p className="text-sm text-gray-500">{chat.space}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-solar-600 text-xs font-bold text-white">{chat.unread}</span>
                      <MessageSquare className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Spaces */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Meus espaços</h2>
            <span className="text-sm text-solar-600 hover:underline cursor-pointer">Ver todos →</span>
          </div>
          <div className="space-y-3">
            {mockSpaces.map((space) => (
              <Card key={space.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {space.type === 'terreno' ? 'Terreno' : 'Telhado'} — {space.city}, {space.state}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[space.status]}`}>
                          {statusLabel[space.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{space.area_m2.toLocaleString('pt-BR')} m² · R$ {space.desired_rent?.toLocaleString('pt-BR')}/mês</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1.5"><Eye className="h-3.5 w-3.5" />Ver</Button>
                      <Button variant="secondary" size="sm" className="gap-1.5"><Pencil className="h-3.5 w-3.5" />Editar</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
