import { redirect } from 'next/navigation'
import { User, Phone, CreditCard } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { completeOwnerProfile } from '@/app/actions/profiles'

export default async function OwnerOnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_completed, name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') redirect('/login')
  if (profile?.onboarding_completed) redirect('/owner/dashboard')

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-terreo-100">
            <User className="h-6 w-6 text-terreo-700" />
          </div>
          <CardTitle className="text-2xl">Complete seu perfil</CardTitle>
          <CardDescription>
            Adicione suas informações para que as empresas possam entrar em contato.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={completeOwnerProfile} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome completo *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <Input
                  id="full_name"
                  name="full_name"
                  placeholder="João da Silva"
                  defaultValue={profile?.name ?? ''}
                  required
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <Input
                  id="phone"
                  name="phone"
                  placeholder="(11) 99999-9999"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf_cnpj">CPF ou CNPJ (opcional)</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <Input
                  id="cpf_cnpj"
                  name="cpf_cnpj"
                  placeholder="000.000.000-00"
                  className="pl-9"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg">
              Salvar e continuar →
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
