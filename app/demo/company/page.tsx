/**
 * Página de DEMO — Dashboard da Empresa (sem auth)
 */
import Link from 'next/link'
import { Sun, Search, MessageSquare, CheckCircle, Clock, TrendingUp, MapPin, Maximize2, Banknote, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const mockAccepted = [
  { id: 'a1', type: 'terreno', city: 'Belo Horizonte', state: 'MG', area: 1200, rent: 2000, unread: 3, img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' },
]

const mockPending = [
  { id: 'p1', type: 'terreno', city: 'Campinas', state: 'SP', area: 2500, ago: '2h atrás' },
  { id: 'p2', type: 'telhado', city: 'Rio de Janeiro', state: 'RJ', area: 800, ago: '1 dia atrás' },
]

const mockSearchResults = [
  { id: 's1', type: 'terreno', city: 'São Paulo', state: 'SP', area: 3000, rent: 4500, orientation: ['Norte', 'Leste'], status: 'available', img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&q=80' },
  { id: 's2', type: 'telhado', city: 'Curitiba', state: 'PR', area: 600, rent: 900, orientation: ['Norte'], status: 'available', img: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=400&q=80' },
  { id: 's3', type: 'terreno', city: 'Goiânia', state: 'GO', area: 1800, rent: null, orientation: ['Norte', 'Oeste'], status: 'available', img: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400&q=80' },
]

export default function DemoCompanyPage() {
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
              <Button variant="ghost" size="sm" className="gap-2"><Search className="h-4 w-4" /><span className="hidden sm:inline">Buscar Espaços</span></Button>
              <div className="ml-2 flex items-center gap-2 border-l border-gray-200 pl-2">
                <span className="hidden text-sm text-gray-500 sm:block">SolarTech</span>
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">S</div>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
        {/* Demo badge */}
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-700 flex items-center gap-2">
          👁️ <strong>Modo demo</strong> — visualização sem login. Dados fictícios para ilustração.
          <Link href="/demo/owner" className="ml-auto text-amber-800 underline font-medium">Ver visão do Proprietário →</Link>
        </div>

        {/* ── SEÇÃO 1: DASHBOARD ── */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">1 · Dashboard da Empresa</h2>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Olá, SolarTech 👋</h1>
              <p className="text-gray-500">Gerencie seus interesses e negociações</p>
            </div>
            <Button className="gap-2"><Search className="h-4 w-4" />Buscar espaços</Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
            {[
              { label: 'Interesses enviados', value: 3, color: 'solar' },
              { label: 'Aguardando resposta', value: 2, color: 'amber' },
              { label: 'Negociações ativas', value: 1, color: 'green' },
              { label: 'Msgs não lidas', value: 3, color: 'blue' },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Negociação ativa */}
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-solar-500" />
              <h3 className="font-semibold text-gray-900">Negociações ativas</h3>
            </div>
            {mockAccepted.map((i) => (
              <Card key={i.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <img src={i.img} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{i.type === 'terreno' ? 'Terreno' : 'Telhado'} — {i.city}, {i.state}</p>
                      <p className="text-sm text-gray-500">{i.area.toLocaleString('pt-BR')} m² · R$ {i.rent?.toLocaleString('pt-BR')}/mês</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-solar-600 text-xs font-bold text-white">{i.unread}</span>
                      <MessageSquare className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pendentes */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold text-gray-900">Aguardando resposta</h3>
            </div>
            <div className="space-y-2">
              {mockPending.map((i) => (
                <Card key={i.id} className="border-amber-200 bg-amber-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{i.type === 'terreno' ? 'Terreno' : 'Telhado'} em {i.city}, {i.state}</p>
                        <p className="text-sm text-gray-500">{i.area.toLocaleString('pt-BR')} m²</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Pendente</span>
                        <p className="mt-1 text-xs text-gray-400">{i.ago}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* ── SEÇÃO 2: BUSCA ── */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">2 · Busca de Espaços (com filtros)</h2>

          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            {/* Filters */}
            <aside>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-2 font-semibold text-gray-700">
                  <SlidersHorizontal className="h-4 w-4" />Filtros
                </div>
                <div className="space-y-4 text-sm">
                  {[
                    { label: 'STATUS', value: 'Disponível' },
                    { label: 'TIPO', value: 'Todos' },
                    { label: 'CIDADE', value: 'São Paulo' },
                    { label: 'ESTADO', value: 'SP' },
                    { label: 'ÁREA MÍN. (m²)', value: '500' },
                    { label: 'VALOR MÁX./MÊS', value: 'R$ 5.000' },
                    { label: 'ORIENTAÇÃO', value: 'Norte' },
                  ].map((f) => (
                    <div key={f.label}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{f.label}</p>
                      <div className="h-9 rounded-lg border border-gray-300 bg-white px-3 flex items-center justify-between text-gray-700">
                        {f.value}
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  ))}
                  <button className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-2">Limpar filtros</button>
                </div>
              </div>
            </aside>

            {/* Results */}
            <div>
              <p className="text-sm text-gray-500 mb-4">3 espaços encontrados</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {mockSearchResults.map((space) => (
                  <div key={space.id} className="group rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      <img src={space.img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-gray-700 shadow-sm">
                          {space.type === 'terreno' ? 'Terreno' : 'Telhado'}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                          Disponível
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-1 text-sm mb-3">
                        <MapPin className="h-4 w-4 text-solar-500 shrink-0" />
                        <span className="font-medium text-gray-800">{space.city}, {space.state}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Maximize2 className="h-3.5 w-3.5 text-gray-400" />
                          {space.area.toLocaleString('pt-BR')} m²
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Sun className="h-3.5 w-3.5 text-amber-400" />
                          {space.orientation.join(', ')}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Banknote className="h-4 w-4 text-solar-500" />
                          <span className="font-semibold text-solar-700">
                            {space.rent ? `R$ ${space.rent.toLocaleString('pt-BR')}` : 'A negociar'}
                            {space.rent && <span className="text-xs font-normal text-gray-500">/mês</span>}
                          </span>
                        </div>
                        <span className="text-xs text-solar-600 font-medium group-hover:underline">Ver detalhes →</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── SEÇÃO 3: CHAT ── */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">3 · Chat entre as partes (após match aceito)</h2>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden max-w-2xl">
            {/* Chat header */}
            <div className="border-b border-gray-200 px-4 py-3 flex items-center gap-3 bg-white">
              <div className="h-9 w-9 rounded-full bg-solar-100 flex items-center justify-center text-solar-700 font-bold text-sm shrink-0">J</div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">João Silva (Proprietário)</p>
                <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="h-3 w-3" />Terreno em Belo Horizonte, MG — 1.200 m²</p>
              </div>
            </div>

            {/* Messages */}
            <div className="px-4 py-5 space-y-4 bg-gray-50 min-h-[220px]">
              <div className="flex flex-col items-start">
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-white border border-gray-200 px-4 py-2.5 text-sm text-gray-800 shadow-sm">
                  Olá! Tenho muito interesse no seu terreno em BH. Poderia me contar mais sobre a infraestrutura elétrica disponível?
                </div>
                <p className="mt-1 text-xs text-gray-400 px-1"><span className="mr-1 font-medium">SolarTech Energia</span>2 dias atrás</p>
              </div>

              <div className="flex flex-col items-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-solar-600 px-4 py-2.5 text-sm text-white">
                  Boa tarde! Sim, temos medidor trifásico e a subestação fica a 500m. Posso enviar fotos da entrada de energia se precisar.
                </div>
                <p className="mt-1 text-xs text-gray-400 px-1">há 1 dia <span className="text-solar-400">✓ lido</span></p>
              </div>

              <div className="flex flex-col items-start">
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-white border border-gray-200 px-4 py-2.5 text-sm text-gray-800 shadow-sm">
                  Perfeito! Por favor, envie as fotos. Também precisamos avaliar a resistência do solo — podemos agendar uma visita técnica essa semana?
                </div>
                <p className="mt-1 text-xs text-gray-400 px-1"><span className="mr-1 font-medium">SolarTech Energia</span>há 15h</p>
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-3 flex gap-2 items-end bg-white">
              <div className="flex-1 min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-400">
                Digite sua mensagem... (Enter para enviar)
              </div>
              <button className="h-11 w-11 rounded-lg bg-solar-600 flex items-center justify-center text-white hover:bg-solar-700 shrink-0">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── SEÇÃO 4: DETALHE DO ESPAÇO ── */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">4 · Página de detalhe do espaço (com botão de interesse)</h2>

          <div className="max-w-2xl rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <img src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80" alt="" className="w-full h-56 object-cover" />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Terreno disponível em Campinas, SP</h3>
                  <p className="text-sm text-gray-500">Estrada Municipal km 12, Zona Rural</p>
                </div>
                <span className="inline-flex shrink-0 items-center rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">Disponível</span>
              </div>
              <div className="grid grid-cols-4 gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 text-center text-sm mb-4">
                <div><p className="text-xs text-gray-400">Área</p><p className="font-bold">2.500 m²</p></div>
                <div><p className="text-xs text-gray-400">Orientação</p><p className="font-bold">Norte, Leste</p></div>
                <div><p className="text-xs text-gray-400">Tipo</p><p className="font-bold">—</p></div>
                <div><p className="text-xs text-gray-400">Locação/mês</p><p className="font-bold text-solar-700">R$ 3.500</p></div>
              </div>
              <button className="w-full rounded-lg bg-amber-500 py-3 text-sm font-semibold text-white hover:bg-amber-600 flex items-center justify-center gap-2">
                ⚡ Demonstrar Interesse
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
