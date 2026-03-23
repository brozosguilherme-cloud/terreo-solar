'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sun, ArrowRight, Home, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  function handleDemo(role: 'owner' | 'company') {
    setLoading(role)
    if (typeof window !== 'undefined') {
      localStorage.setItem('ts_demo_role', role)
    }
    setTimeout(() => {
      router.push(role === 'owner' ? '/owner/dashboard' : '/company/dashboard')
    }, 600)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-terreo-800">
          <div className="absolute right-0 top-0 h-4 w-4 rounded-bl-lg bg-terreo-400 opacity-70" />
          <span className="relative text-[11px] font-black tracking-tighter text-white">TS</span>
        </div>
        <span className="text-[18px] font-bold tracking-tight text-stone-900">
          Térreo<span className="text-terreo-700">Solar</span>
        </span>
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-terreo-50 px-3 py-1 text-xs font-semibold text-terreo-700">
          MODO DEMONSTRAÇÃO
        </div>
        <h1 className="mt-3 text-2xl font-bold text-stone-900">Escolha seu perfil</h1>
        <p className="mt-1 mb-8 text-stone-500 text-sm">
          Esta é uma demo com dados simulados. Escolha como deseja explorar a plataforma.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => handleDemo('owner')}
            disabled={!!loading}
            className="w-full rounded-xl border-2 border-terreo-100 bg-terreo-50 p-5 text-left transition-all hover:border-terreo-300 hover:bg-terreo-100 disabled:opacity-60"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-terreo-800">
                <Home className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-stone-900">Sou Proprietário</p>
                <p className="text-sm text-stone-500">Tenho terreno ou telhado disponível</p>
              </div>
              <ArrowRight className="h-5 w-5 text-terreo-600" />
            </div>
          </button>

          <button
            onClick={() => handleDemo('company')}
            disabled={!!loading}
            className="w-full rounded-xl border-2 border-stone-100 bg-stone-50 p-5 text-left transition-all hover:border-stone-300 hover:bg-stone-100 disabled:opacity-60"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-700">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-stone-900">Sou Empresa Instaladora</p>
                <p className="text-sm text-stone-500">Busco espaços para instalar painéis solares</p>
              </div>
              <ArrowRight className="h-5 w-5 text-stone-500" />
            </div>
          </button>
        </div>

        {loading && (
          <p className="mt-6 text-center text-sm text-terreo-600 animate-pulse">
            Entrando como {loading === 'owner' ? 'Proprietário' : 'Empresa'}...
          </p>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-stone-400">
        Não tem conta?{' '}
        <Link href="/register" className="text-terreo-600 hover:underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  )
}
