import { redirect } from 'next/navigation'
import { Building2, Globe, CreditCard } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { completeCompanyProfile } from '@/app/actions/profiles'

export default async function CompanyOnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_completed, name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'company') redirect('/login')
  if (profile?.onboarding_completed) redirect('/company/dashboard')

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <Building2 className="h-6 w-6 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">Configure sua empresa</CardTitle>
          <CardDescription>
            Essas informações serão visíveis para os proprietários ao receber sua proposta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={completeCompanyProfile} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nome da empresa *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <Input
                  id="company_name"
                  name="company_name"
                  placeholder="Solar Energia Ltda."
                  required
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ (opcional)</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <Input
                  id="cnpj"
                  name="cnpj"
                  placeholder="00.000.000/0001-00"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website (opcional)</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <Input
                  id="website"
                  name="website"
                  type="url"
                  placeholder="https://suaempresa.com.br"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição da empresa (opcional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Fale sobre sua empresa, experiência, capacidade de instalação..."
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" size="lg">
              Salvar e buscar espaços →
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
