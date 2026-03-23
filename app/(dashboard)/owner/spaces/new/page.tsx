'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewSpacePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/owner/spaces" className="text-stone-400 hover:text-stone-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-stone-900">Novo Espaço</h1>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-amber-700 font-medium mb-2">🎭 Modo Demo</p>
        <p className="text-amber-600 text-sm">O cadastro de novos espaços está disponível na versão completa com banco de dados conectado.</p>
      </div>
    </div>
  )
}
