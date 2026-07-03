import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronRight,
  Compass,
  Mail,
  MapPin,
  Rocket,
  Sparkles,
  Star,
  Store,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'

const MAILTO = 'mailto:comercial@nix.app'

/* ---------- Presets de animação ---------- */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

function Reveal({ children, className, ...props }) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/* ---------- Navbar ---------- */

function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed inset-x-0 top-0 z-50 border-b border-ink/5 bg-cream/80 backdrop-blur-lg"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:h-20 sm:px-8">
        <a href="#" className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-ink text-gold-300">
            <Compass className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <span className="text-xl font-bold tracking-tight text-ink">Nix</span>
        </a>

        <nav className="hidden items-center gap-8 text-sm font-medium text-ink-soft md:flex">
          <a href="#beneficios" className="transition-colors hover:text-ink">
            Benefícios
          </a>
          <a href="#como-funciona" className="transition-colors hover:text-ink">
            Como Funciona
          </a>
        </nav>

        <a
          href={MAILTO}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-card transition-all hover:bg-ink/85 hover:shadow-float"
        >
          <Mail className="h-4 w-4" />
          <span className="hidden sm:inline">Falar com Comercial</span>
          <span className="sm:hidden">Comercial</span>
        </a>
      </div>
    </motion.header>
  )
}

/* ---------- Mockup do app (como o parceiro aparece para o cliente) ---------- */

function AppMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 48, rotate: 2 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.8, delay: 0.35, ease: 'easeOut' }}
      className="relative mx-auto w-full max-w-sm"
    >
      {/* brilhos decorativos */}
      <div className="absolute -left-10 -top-10 h-44 w-44 rounded-full bg-gold-300/40 blur-3xl" />
      <div className="absolute -bottom-8 -right-8 h-44 w-44 rounded-full bg-gold-200/50 blur-3xl" />

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative rounded-[2.25rem] border border-ink/5 bg-white p-6 shadow-float"
      >
        {/* header da tela */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
              Explorador Global
            </p>
            <p className="mt-1 text-xl font-bold text-ink">Olá, Cliente</p>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-full border border-ink/10 text-ink-soft">
            <Bell className="h-4 w-4" />
          </span>
        </div>

        {/* saldo de pontos */}
        <div className="mt-5 rounded-3xl bg-cream p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold-100 text-gold-600">
              <Star className="h-5 w-5 fill-current" />
            </span>
            <div>
              <p className="text-lg font-bold leading-tight text-ink">1.570 Pontos</p>
              <p className="text-xs text-ink-faint">Acumulados na sua jornada</p>
            </div>
            <Trophy className="ml-auto h-5 w-5 text-ink-faint/60" />
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '62%' }}
              transition={{ duration: 1.2, delay: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gold-400"
            />
          </div>
        </div>

        {/* missão em destaque = o parceiro */}
        <div className="mt-5">
          <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
            <MapPin className="h-4 w-4 text-gold-500" />
            Missões em Destaque
          </p>
          <div className="mt-3 rounded-3xl border-2 border-gold-300 bg-gold-50 p-4">
            <div className="flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-gold-300">
                <Store className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-600">
                +250 pts
              </span>
            </div>
            <p className="mt-3 font-bold text-ink">Nome da Sua Loja</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              Visite nossa loja parceira e ganhe pontos extras no check-in!
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-gold-600">
              Iniciar missão <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* selo flutuante */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1.1 }}
        className="absolute -bottom-5 -left-6 hidden items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-white shadow-float sm:flex"
      >
        <CheckCircle2 className="h-5 w-5 text-gold-300" />
        <div className="text-left">
          <p className="text-xs font-bold leading-none">Check-in feito!</p>
          <p className="mt-1 text-[10px] text-white/60">Cliente no seu balcão</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ---------- Hero ---------- */

function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-32 sm:px-8 sm:pt-40 lg:pb-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-gradient-to-b from-gold-100/60 via-cream to-cream" />

      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2 lg:gap-10">
        <motion.div variants={stagger} initial="hidden" animate="visible">
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-gold-300 bg-gold-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold-700"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Nix para Parceiros Oficiais
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl"
          >
            Gamifique a{' '}
            <span className="relative inline-block text-gold-500">
              experiência.
              <svg
                viewBox="0 0 220 12"
                fill="none"
                className="absolute -bottom-2 left-0 w-full"
                aria-hidden="true"
              >
                <path
                  d="M3 9C60 3 160 3 217 9"
                  stroke="#E3A94E"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-7 max-w-xl text-lg leading-relaxed text-ink-soft"
          >
            Transforme seu estabelecimento em uma missão no mapa. Aumente seu fluxo de
            clientes, engajamento e fidelidade recompensando exploradores com Pontos e
            conquistas exclusivas.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href={MAILTO}
              className="group inline-flex items-center gap-2 rounded-full bg-gold-400 px-7 py-4 text-base font-bold text-ink shadow-card transition-all hover:bg-gold-500 hover:shadow-float"
            >
              Quero ser Parceiro
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#beneficios"
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-7 py-4 text-base font-semibold text-ink transition-all hover:border-ink/30 hover:shadow-card"
            >
              Ver Benefícios
            </a>
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="mt-8 flex items-center gap-2 text-sm text-ink-faint"
          >
            <Zap className="h-4 w-4 text-gold-500" />
            Sem taxa de adesão · Ativação em até 48h
          </motion.p>
        </motion.div>

        <AppMockup />
      </div>
    </section>
  )
}

/* ---------- Benefícios ---------- */

const BENEFITS = [
  {
    icon: MapPin,
    title: 'Visibilidade no Mapa',
    description:
      'Seu negócio em destaque para exploradores locais que estão a poucos metros de você, prontos para a próxima missão.',
    featured: true,
  },
  {
    icon: Trophy,
    title: 'Fidelização Gamificada',
    description:
      'Clientes ganham Pontos ao visitar. Quanto mais vão, mais sobem de nível — e mais motivos têm para voltar.',
    featured: false,
  },
  {
    icon: Users,
    title: 'Prova Social',
    description:
      'Cada check-in gera atividade no feed social do app: seus clientes divulgam seu negócio para a comunidade.',
    featured: false,
  },
  {
    icon: BarChart3,
    title: 'Painel de Controle Inteligente',
    description:
      'Métricas reais de visitas, horários de pico e campanhas de reativação para trazer clientes de volta.',
    featured: true,
  },
]

function Benefits() {
  return (
    <section id="beneficios" className="scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-600">
            Benefícios
          </span>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Por que o Nix funciona para o seu negócio.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            Traga clientes através de recompensas gamificadas, não descontos que corroem
            sua margem.
          </p>
        </Reveal>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {BENEFITS.map(({ icon: Icon, title, description, featured }) => (
            <motion.article
              key={title}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25 }}
              className={`rounded-[2rem] border p-8 shadow-card ${
                featured
                  ? 'border-transparent bg-ink text-white lg:col-span-2'
                  : 'border-ink/5 bg-white'
              }`}
            >
              <span
                className={`grid h-14 w-14 place-items-center rounded-2xl ${
                  featured ? 'bg-gold-400 text-ink' : 'bg-gold-100 text-gold-600'
                }`}
              >
                <Icon className="h-7 w-7" strokeWidth={2} />
              </span>
              <h3
                className={`mt-6 text-xl font-bold ${featured ? 'text-white' : 'text-ink'}`}
              >
                {title}
              </h3>
              <p
                className={`mt-3 leading-relaxed ${
                  featured ? 'text-white/70' : 'text-ink-soft'
                }`}
              >
                {description}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ---------- Como Funciona ---------- */

const STEPS = [
  {
    number: '01',
    icon: Store,
    title: 'Cadastre seu estabelecimento',
    description:
      'Fale com nosso time comercial e crie seu perfil de Parceiro Oficial com fotos, descrição e categoria.',
  },
  {
    number: '02',
    icon: MapPin,
    title: 'Vire uma missão no mapa',
    description:
      'Seu negócio aparece como missão para exploradores próximos, com Pontos e recompensas definidos por você.',
  },
  {
    number: '03',
    icon: Trophy,
    title: 'Receba exploradores',
    description:
      'Clientes fazem check-in, acumulam Pontos, sobem de nível e voltam sempre — e você acompanha tudo no painel.',
  },
]

function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-600">
            Como Funciona
          </span>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Do cadastro ao check-in em três passos.
          </h2>
        </Reveal>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-14 grid gap-5 md:grid-cols-3"
        >
          {STEPS.map(({ number, icon: Icon, title, description }) => (
            <motion.article
              key={number}
              variants={fadeUp}
              className="relative rounded-[2rem] border border-ink/5 bg-white p-8 shadow-card"
            >
              <span className="absolute right-7 top-6 text-5xl font-extrabold text-gold-100">
                {number}
              </span>
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gold-100 text-gold-600">
                <Icon className="h-7 w-7" strokeWidth={2} />
              </span>
              <h3 className="mt-6 text-xl font-bold text-ink">{title}</h3>
              <p className="mt-3 leading-relaxed text-ink-soft">{description}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ---------- CTA Final ---------- */

function FinalCta() {
  return (
    <section className="px-5 py-20 sm:px-8 lg:py-28">
      <Reveal className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-ink px-6 py-16 text-center sm:px-12 lg:py-20">
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-gold-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-gold-400/15 blur-3xl" />

          <div className="relative mx-auto max-w-2xl">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-gold-400 text-ink">
              <Compass className="h-8 w-8" strokeWidth={2.2} />
            </span>

            <h2 className="mt-8 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Pronto para fazer parte do Nix?
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white/70">
              Torne-se um parceiro oficial e crie missões interativas no seu
              estabelecimento. Oferecemos suporte completo na configuração do seu perfil
              comercial.
            </p>

            <div className="mx-auto mt-9 flex max-w-md items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 text-left">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold-400/15 text-gold-300">
                <Rocket className="h-6 w-6" />
              </span>
              <div>
                <p className="font-bold text-white">Onboarding Ágil</p>
                <p className="mt-0.5 text-sm text-white/60">
                  Sua conta de parceiro é criada e ativada no mapa em menos de 48h.
                </p>
              </div>
            </div>

            <a
              href={MAILTO}
              className="group mt-10 inline-flex items-center gap-2 rounded-full bg-gold-400 px-8 py-4 text-base font-bold text-ink shadow-float transition-all hover:bg-gold-300"
            >
              Falar com a Equipe
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* ---------- Footer ---------- */

function Footer() {
  return (
    <footer className="border-t border-ink/5 px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <a href="#" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-ink text-gold-300">
            <Compass className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <span className="font-bold text-ink">Nix</span>
        </a>
        <p className="text-sm text-ink-faint">
          © {new Date().getFullYear()} Nix. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}

/* ---------- Página ---------- */

export default function NixLandingPage() {
  return (
    <div className="min-h-screen bg-cream font-sans text-ink antialiased">
      <Navbar />
      <main>
        <Hero />
        <Benefits />
        <HowItWorks />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
