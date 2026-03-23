import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MOCK_SPACES } from '@/lib/mock-data'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  return MOCK_SPACES.map((s) => ({ id: s.id }))
}

export default function EditSpacePage({ params }: { params: { id: string } }) {
  const space = MOCK_SPACES.find((s) => s.id === params.id)
  if (!space) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/owner/spaces" className="text-stone-400 hover:text-stone-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-stone-900">Editar Espaço</h1>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-3">
        <div className="flex justify-between text-sm"><span className="text-stone-400">Tipo</span><span className="font-medium">{space.type === 'terreno' ? 'Terreno' : 'Telhado'}</span></div>
        <div className="flex justify-between text-sm"><span className="text-stone-400">Cidade</span><span className="font-medium">{space.city}, {space.state}</span></div>
        <div className="flex justify-between text-sm"><span className="text-stone-400">Área</span><span className="font-medium">{space.area_m2} m²</span></div>
        <div className="flex justify-between text-sm"><span className="text-stone-400">Aluguel</span><span className="font-medium">R$ {space.desired_rent?.toLocaleString('pt-BR')}/mês</span></div>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-amber-700 font-medium mb-2">🎭 Modo Demo</p>
        <p className="text-amber-600 text-sm">A edição de espaços está disponível na versão completa com banco de dados conectado.</p>
      </div>
    </div>
  )
}
