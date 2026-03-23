'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { MOCK_OWNER, MOCK_COMPANY } from '@/lib/mock-data'
import type { Profile } from '@/types/database'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const role = localStorage.getItem('ts_demo_role') as 'owner' | 'company' | null
    if (!role) {
      router.replace('/login')
      return
    }
    const mock = role === 'owner' ? MOCK_OWNER : MOCK_COMPANY
    setProfile(mock as unknown as Profile)
    setReady(true)
  }, [router])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-terreo-800 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar profile={profile as Profile} />
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-xs text-amber-700 font-medium">
          🎭 Modo demo — dados simulados para visualização
        </div>
      </div>
      <main className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
