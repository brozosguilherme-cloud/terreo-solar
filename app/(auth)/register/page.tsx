'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, UserPlus, Home, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/database'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const initialRole = (searchParams.get('role') as UserRole) || 'owner'
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: initialRole,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name, role: form.role },
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Insert profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: form.email,
        name: form.name,
        role: form.role,
        onboarding_completed: false,
      })

      if (profileError) {
        toast.error('Erro ao criar perfil. Tente novamente.')
        setLoading(false)
        return
      }

      toast.success('Conta criada! Vamos completar seu perfil.')
      router.push(`/${form.role}/onboarding`)
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Criar conta</CardTitle>
        <CardDescription>Junte-se ao SolarMatch gratuitamente</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Role selection */}
        <div className="mb-6">
          <Label className="mb-2 block">Você é:</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'owner' })}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all text-sm font-medium',
                form.role === 'owner'
                  ? 'border-terreo-700 bg-terreo-50 text-terreo-800'
                  : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50'
              )}
            >
              <Home className="h-6 w-6" />
              Proprietário
              <span className="text-xs font-normal text-stone-400">Tenho terreno/telhado</span>
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'company' })}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all text-sm font-medium',
                form.role === 'company'
                  ? 'border-terreo-700 bg-terreo-50 text-terreo-800'
                  : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50'
              )}
            >
              <Building2 className="h-6 w-6" />
              Empresa
              <span className="text-xs font-normal text-stone-400">Instalo painéis solares</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              {form.role === 'company' ? 'Seu nome completo' : 'Nome completo'}
            </Label>
            <Input
              id="name"
              placeholder="João da Silva"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full gap-2" disabled={loading}>
            <UserPlus className="h-4 w-4" />
            {loading ? 'Criando conta...' : 'Criar conta'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-stone-500">
          Já tem uma conta?{' '}
          <Link href="/login" className="font-medium text-terreo-700 hover:underline">
            Entrar
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
