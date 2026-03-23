import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Maximize2, Sun, Banknote, Home, Building2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MOCK_SPACES, MOCK_OWNER } from '@/lib/mock-data'
import { spaceTypeLabel, spaceStatusLabel, spaceStatusColor, formatArea, formatCurrency, roofTypeLabel } from '@/lib/utils'

export async function generateStaticParams() {
  return MOCK_SPACES.map((s) => ({ id: s.id }))
}

export default function SpaceDetailPage({ params }: { params: { id: string } }) {
  const space = MOCK_SPACES.find((s) => s.id === params.id)
  if (!space) notFound()

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-terreo-800">
                <div className="absolute right-0 top-0 h-3.5 w-3.5 rounded-bl-lg bg-terreo-400 opacity-70" />
                <span className="relative text-[10px] font-black tracking-tighter text-white">TS</span>
              </div>
              <span className="text-lg font-bold text-stone-900">Térreo<span className="text-terreo-700">Solar</span></span>
            </Link>
            <Link href="/company/search"><Button variant="ghost" size="sm">← Busca</Button></Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <div className="flex h-72 sm:h-80 items-center justify-center rounded-2xl bg-gradient-to-br from-terreo-50 to-terreo-100 border border-terreo-100">
              <div className="text-center">
                <Sun className="h-20 w-20 text-terreo-300 mx-auto mb-3" />
                <p className="text-terreo-500 text-sm">Sem fotos cadastradas</p>
              </div>
            </div>

            <div className="flex flex-wrap items-start gap-3">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-stone-900">
                  {spaceTypeLabel(space.type)} disponível em {space.city}, {space.state}
                </h1>
                <p className="mt-1 text-stone-500">{space.address}</p>
              </div>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${spaceStatusColor(space.status)}`}>
                {spaceStatusLabel(space.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-xl border border-stone-200 bg-white p-5 sm:grid-cols-4">
              <div className="text-center">
                <p className="text-xs text-stone-400 uppercase tracking-wide">Área</p>
                <p className="mt-1 font-bold text-stone-900">{formatArea(space.area_m2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-stone-400 uppercase tracking-wide">Orientação</p>
                <p className="mt-1 font-bold text-stone-900">{space.solar_orientation?.join(', ') || '—'}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-stone-400 uppercase tracking-wide">Tipo telhado</p>
                <p className="mt-1 font-bold text-stone-900">{roofTypeLabel(space.roof_type)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-stone-400 uppercase tracking-wide">Locação/mês</p>
                <p className="mt-1 font-bold text-terreo-800">{formatCurrency(space.desired_rent)}</p>
              </div>
            </div>

            {space.description && (
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <h2 className="mb-3 font-semibold text-stone-900">Descrição</h2>
                <p className="whitespace-pre-line text-stone-600 text-sm leading-relaxed">{space.description}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm sticky top-24">
              <div className="mb-4 text-center">
                <p className="text-3xl font-bold text-terreo-800">
                  {formatCurrency(space.desired_rent)}
                  {space.desired_rent && <span className="text-sm font-normal text-stone-400">/mês</span>}
                </p>
                <p className="text-sm text-stone-500 mt-1">Valor desejado de locação</p>
              </div>

              <Link href="/login">
                <Button className="w-full gap-2 mb-2">
                  <Building2 className="h-4 w-4" />
                  Demonstrar interesse
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full">Já tenho conta — Entrar</Button>
              </Link>

              <div className="mt-4 pt-4 border-t border-stone-100">
                <div className="flex items-center gap-2 text-sm text-stone-500">
                  <Home className="h-4 w-4 text-stone-400" />
                  <span>Proprietário: {MOCK_OWNER.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
