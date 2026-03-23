import Link from 'next/link'
import {
  ArrowRight,
  MapPin,
  Zap,
  MessageSquare,
  CheckCircle,
  BarChart3,
  Shield,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ─────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-stone-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Logo />
            <nav className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">Entrar</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Comece agora</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────── */}
      <section className="relative bg-terreo-800 overflow-hidden">
        {/* subtle texture */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-terreo-600 to-transparent" />

        <div className="relative mx-auto max-w-6xl px-4 py-28 sm:py-36 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-terreo-600 bg-terreo-700/40 px-4 py-1.5 text-sm text-terreo-200">
              <span className="h-1.5 w-1.5 rounded-full bg-terreo-300" />
              Marketplace de energia solar fotovoltaica
            </div>

            <h1 className="mb-6 text-4xl font-bold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
              Seu terreno ou telhado{' '}
              <span className="text-terreo-300">gerando valor</span>{' '}
              para o Brasil.
            </h1>

            <p className="mb-10 max-w-xl text-lg text-terreo-200 leading-relaxed">
              A TérreoSolar conecta proprietários de espaços com empresas instaladoras
              de painéis solares — de forma simples, transparente e sem intermediários.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/register?role=owner">
                <Button size="lg" variant="brand-muted" className="w-full sm:w-auto gap-2 bg-white text-terreo-800 hover:bg-terreo-50">
                  Tenho um espaço disponível
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/register?role=company">
                <Button size="lg" variant="brand" className="w-full sm:w-auto gap-2 border-terreo-400 text-terreo-100 hover:bg-terreo-700 hover:text-white">
                  Sou empresa instaladora
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Numbers ────────────────────────────────── */}
      <section className="border-b border-stone-100 bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 divide-x divide-stone-200">
            {[
              { value: '300+', label: 'Espaços cadastrados' },
              { value: '80+',  label: 'Empresas parceiras'  },
              { value: '120+', label: 'Negociações ativas'  },
            ].map((s) => (
              <div key={s.label} className="py-10 text-center">
                <div className="text-3xl font-bold text-terreo-800">{s.value}</div>
                <div className="mt-1 text-sm text-stone-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Para Proprietários ─────────────────────── */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-terreo-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-terreo-700">
                Para Proprietários
              </span>
              <h2 className="mb-5 text-3xl font-bold text-stone-900 leading-tight">
                Transforme espaço ocioso em renda mensal recorrente.
              </h2>
              <p className="mb-8 text-stone-500 leading-relaxed">
                Terreno parado ou telhado sem uso? Cadastre e receba propostas de empresas
                qualificadas prontas para instalar e operar painéis fotovoltaicos.
              </p>
              <ul className="mb-8 space-y-3">
                {[
                  'Cadastro em menos de 5 minutos',
                  'Você escolhe com quem negociar',
                  'Sem taxas ou comissões ocultas',
                  'Suporte durante toda a negociação',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-stone-700 text-sm">
                    <CheckCircle className="h-4 w-4 text-terreo-600 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register?role=owner">
                <Button className="gap-2">
                  Cadastrar meu espaço <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Mock card */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-sm font-semibold text-stone-500 uppercase tracking-wide">
                  Seu espaço
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  Disponível
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Tipo',               value: 'Telhado residencial' },
                  { label: 'Área',               value: '320 m²'              },
                  { label: 'Orientação solar',    value: 'Norte + Leste'      },
                  { label: 'Valor desejado',      value: 'R$ 1.200/mês'       },
                  { label: 'Interesses recebidos', value: '3 empresas'        },
                ].map((row) => (
                  <div key={row.label}
                    className="flex items-center justify-between rounded-lg bg-stone-50 px-4 py-3 text-sm">
                    <span className="text-stone-400">{row.label}</span>
                    <span className="font-semibold text-stone-800">{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg bg-terreo-800 py-3 text-center text-sm font-semibold text-white">
                3 empresas demonstraram interesse →
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Para Empresas ──────────────────────────── */}
      <section className="bg-stone-50 py-24 px-4">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Mock search */}
            <div className="order-2 lg:order-1 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-stone-400">
                Filtros de busca
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Tipo',          value: 'Terreno'         },
                  { label: 'Localização',   value: 'São Paulo, SP'   },
                  { label: 'Área mínima',   value: '500 m²'          },
                  { label: 'Orientação',    value: 'Norte'           },
                  { label: 'Valor máximo',  value: 'R$ 2.000/mês'   },
                ].map((row) => (
                  <div key={row.label}
                    className="flex items-center justify-between rounded-lg border border-stone-100 bg-stone-50 px-4 py-2.5 text-sm">
                    <span className="text-stone-400">{row.label}</span>
                    <span className="font-medium text-stone-700">{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg bg-terreo-800 py-2.5 text-center text-sm font-semibold text-white">
                12 espaços encontrados →
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-terreo-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-terreo-700">
                Para Empresas
              </span>
              <h2 className="mb-5 text-3xl font-bold text-stone-900 leading-tight">
                Encontre os espaços certos para seus projetos solares.
              </h2>
              <p className="mb-8 text-stone-500 leading-relaxed">
                Busque terrenos e telhados disponíveis com filtros precisos de área,
                orientação solar e localização. Demonstre interesse e negocie diretamente.
              </p>
              <ul className="mb-8 space-y-3">
                {[
                  'Centenas de espaços qualificados',
                  'Filtros por orientação solar e área',
                  'Chat direto após aceite do proprietário',
                  'Dashboard de negociações centralizado',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-stone-700 text-sm">
                    <CheckCircle className="h-4 w-4 text-terreo-600 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register?role=company">
                <Button className="gap-2">
                  Buscar espaços agora <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Como funciona ──────────────────────────── */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-stone-900">Como funciona</h2>
            <p className="mt-3 text-stone-400">Simples, rápido e sem burocracia</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                num:   '01',
                icon:  MapPin,
                title: 'Cadastre ou Busque',
                desc:  'Proprietários cadastram seus espaços. Empresas buscam com filtros inteligentes de localização, área e orientação solar.',
              },
              {
                num:   '02',
                icon:  Zap,
                title: 'Faça o Match',
                desc:  'Empresa demonstra interesse. Proprietário analisa o perfil da empresa e aceita ou recusa o contato.',
              },
              {
                num:   '03',
                icon:  MessageSquare,
                title: 'Negocie e Feche',
                desc:  'Canal de chat direto entre as partes para negociar condições e formalizar a locação do espaço.',
              },
            ].map((step) => (
              <div key={step.num} className="relative rounded-2xl border border-stone-200 bg-white p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-terreo-50">
                    <step.icon className="h-6 w-6 text-terreo-700" />
                  </div>
                  <span className="text-4xl font-bold text-stone-100">{step.num}</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-stone-900">{step.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Diferenciais ───────────────────────────── */}
      <section className="border-y border-stone-100 bg-stone-50 py-20 px-4">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { icon: Shield,   title: 'Seguro e transparente',   desc: 'Dados protegidos, perfis verificados e negociações registradas na plataforma.' },
              { icon: BarChart3, title: 'Inteligência de mercado', desc: 'Filtros precisos e dados de orientação solar para decisões mais rápidas.' },
              { icon: Users,    title: 'Comunidade qualificada',   desc: 'Proprietários e empresas selecionados. Menos ruído, mais resultado.' },
            ].map((d) => (
              <div key={d.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-terreo-800">
                  <d.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900">{d.title}</h3>
                  <p className="mt-1 text-sm text-stone-500 leading-relaxed">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ──────────────────────────────── */}
      <section className="bg-terreo-800 py-20 px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Pronto para fazer parte do futuro da energia solar?
          </h2>
          <p className="mb-8 text-terreo-300">
            Crie sua conta em menos de 2 minutos e comece a conectar.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-terreo-800 hover:bg-terreo-50 gap-2">
              Criar conta gratuita <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────── */}
      <footer className="border-t border-stone-100 bg-white py-10 px-4">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo />
          <p className="text-xs text-stone-400">
            © 2025 TérreoSolar. Conectando o Brasil à energia solar.
          </p>
        </div>
      </footer>
    </div>
  )
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      {/* Logomark: quadrado de dois tons */}
      <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-terreo-800">
        {/* top-right solar accent */}
        <div className="absolute right-0 top-0 h-3.5 w-3.5 rounded-bl-lg bg-terreo-400 opacity-70" />
        <span className="relative text-[10px] font-black tracking-tighter text-white">TS</span>
      </div>
      <span className="text-[17px] font-bold tracking-tight text-stone-900 group-hover:text-terreo-800 transition-colors">
        Térreo<span className="text-terreo-700">Solar</span>
      </span>
    </Link>
  )
}
