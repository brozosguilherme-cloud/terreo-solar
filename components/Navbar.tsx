'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, LayoutDashboard, Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

interface NavbarProps {
  profile: Profile | null
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-terreo-800">
        <div className="absolute right-0 top-0 h-3.5 w-3.5 rounded-bl-lg bg-terreo-400 opacity-70" />
        <span className="relative text-[10px] font-black tracking-tighter text-white">TS</span>
      </div>
      <span className="text-[17px] font-bold tracking-tight text-stone-900">
        Térreo<span className="text-terreo-700">Solar</span>
      </span>
    </div>
  )
}

export default function Navbar({ profile }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href={profile ? `/${profile.role}/dashboard` : '/'}>
            <Logo />
          </Link>

          {profile ? (
            <nav className="flex items-center gap-1">
              {profile.role === 'owner' && (
                <>
                  <Link href="/owner/dashboard">
                    <Button variant="ghost" size="sm" className="gap-2 text-stone-600">
                      <LayoutDashboard className="h-4 w-4" />
                      <span className="hidden sm:inline">Dashboard</span>
                    </Button>
                  </Link>
                  <Link href="/owner/spaces/new">
                    <Button variant="ghost" size="sm" className="gap-2 text-stone-600">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Novo Espaço</span>
                    </Button>
                  </Link>
                </>
              )}
              {profile.role === 'company' && (
                <>
                  <Link href="/company/dashboard">
                    <Button variant="ghost" size="sm" className="gap-2 text-stone-600">
                      <LayoutDashboard className="h-4 w-4" />
                      <span className="hidden sm:inline">Dashboard</span>
                    </Button>
                  </Link>
                  <Link href="/company/search">
                    <Button variant="ghost" size="sm" className="gap-2 text-stone-600">
                      <Search className="h-4 w-4" />
                      <span className="hidden sm:inline">Buscar Espaços</span>
                    </Button>
                  </Link>
                </>
              )}

              <div className="ml-2 flex items-center gap-2 border-l border-stone-200 pl-3">
                <span className="hidden text-sm text-stone-400 sm:block truncate max-w-[120px]">
                  {profile.name?.split(' ')[0]}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  title="Sair"
                  className="text-stone-400 hover:text-stone-700"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </nav>
          ) : (
            <nav className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Entrar</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Cadastrar</Button>
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}
