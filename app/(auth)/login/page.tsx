'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      toast.error('E-mail ou senha incorretos')
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, onboarding_completed')
        .eq('id', data.user.id)
        .single()

      if (profile) {
        if (!profile.onboarding_completed) {
          router.push(`/${profile.role}/onboarding`)
        } else {
          router.push(`/${profile.role}/dashboard`)
        }
        router.refresh()
      }
    }

    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Bem-vindo de volta</CardTitle>
        <CardDescription>Entre na sua conta SolarMatch</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Sua senha"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
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
            <LogIn className="h-4 w-4" />
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-stone-500">
          Não tem uma conta?{' '}
          <Link href="/register" className="font-medium text-terreo-700 hover:underline">
            Cadastre-se grátis
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
