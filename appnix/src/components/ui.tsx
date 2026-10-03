import { Compass, Landmark, LoaderCircle, Mountain, Route, Sparkles, Star, Utensils, type LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useId, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { getUserLevelInfo } from '../lib/levels';
import type { MissionCategory } from '../services/types';

/**
 * Componentes base do AppNix — guia "Warm Nomad & Playful Travel" (ver DESIGN.md).
 * Telas usam estes componentes e os tokens de index.css; nada de px/hex avulsos.
 */

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/* ------------------------------------------------------------------ */
/* Categorias                                                           */
/* ------------------------------------------------------------------ */

export const CATEGORY_META: Record<MissionCategory, { label: string; icon: LucideIcon; color: string; soft: string }> = {
  turismo: { label: 'Turismo', icon: Landmark, color: 'var(--color-turismo)', soft: 'var(--color-turismo-soft)' },
  gastronomia: { label: 'Gastronomia', icon: Utensils, color: 'var(--color-gastronomia)', soft: 'var(--color-gastronomia-soft)' },
  explorador: { label: 'Explorador', icon: Mountain, color: 'var(--color-explorador)', soft: 'var(--color-explorador-soft)' },
};

export const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  landmark: Landmark,
  utensils: Utensils,
  sparkles: Sparkles,
  mountain: Mountain,
  compass: Compass,
  route: Route,
};

/* ------------------------------------------------------------------ */
/* Feedback                                                             */
/* ------------------------------------------------------------------ */

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cn('animate-spin', className ?? 'size-5')} aria-hidden />;
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden bg-surface-muted', className)} aria-hidden>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-8 py-10 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-card bg-secondary">
        <Icon className="size-7 text-primary" />
      </div>
      <h3 className="type-title3">{title}</h3>
      {text && <p className="mt-1 type-callout text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

type Tone = 'success' | 'danger' | 'neutral' | 'brand';
const TONES: Record<Tone, string> = {
  success: 'bg-success-soft text-success-ink',
  danger: 'bg-danger-soft text-danger-ink',
  neutral: 'bg-surface-muted text-muted',
  brand: 'bg-secondary text-ink',
};

export function StatusBanner({ tone, icon: Icon, children, className }: { tone: Tone; icon?: LucideIcon; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start gap-2 rounded-control px-4 py-3 type-callout font-semibold', TONES[tone], className)} role="status">
      {Icon && <Icon className="mt-0.5 size-4 shrink-0" />}
      <span>{children}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Botões                                                               */
/* ------------------------------------------------------------------ */

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
type BtnSize = 'lg' | 'md' | 'sm';

const BTN_VARIANTS: Record<BtnVariant, string> = {
  // btn-modern-primary
  primary: 'bg-primary text-white shadow-primary hover:brightness-105',
  // secundário / cancelar
  secondary: 'bg-surface text-ink border border-line/80 hover:bg-surface-muted',
  ghost: 'bg-transparent text-ink hover:bg-surface-muted',
  danger: 'bg-danger text-white shadow-[0_10px_15px_-3px_rgb(239_68_68/0.2)]',
  dark: 'bg-ink text-white',
};
const BTN_SIZES: Record<BtnSize, string> = {
  lg: 'h-13 px-6 rounded-control gap-2 [&_svg]:size-5',
  md: 'h-11 px-5 rounded-control gap-2 [&_svg]:size-4',
  sm: 'h-9 px-4 rounded-full gap-1.5 [&_svg]:size-4',
};
// desabilitado (ex.: fora do raio de check-in)
const BTN_DISABLED = 'disabled:cursor-not-allowed disabled:border disabled:border-disabled-line disabled:bg-disabled-bg disabled:text-disabled-ink disabled:shadow-none disabled:active:scale-100';

export function Button({
  variant = 'primary',
  size = 'lg',
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize; loading?: boolean }) {
  return (
    <button
      className={cn('inline-flex shrink-0 items-center justify-center type-label transition-all active:scale-95', BTN_VARIANTS[variant], BTN_SIZES[size], BTN_DISABLED, className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}

export function LinkButton({ href, children, className, size = 'lg' }: { href: string; children: ReactNode; className?: string; size?: BtnSize }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={cn('inline-flex items-center justify-center type-label transition-all active:scale-95', BTN_VARIANTS.secondary, BTN_SIZES[size], className)}>
      {children}
    </a>
  );
}

/** Botão redondo só com ícone (44 px). `dot` mostra o ponto vermelho de não lido. */
export function IconButton({ icon: Icon, label, onClick, dot, className, disabled }: { icon: LucideIcon; label: string; onClick?: () => void; dot?: boolean; className?: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} className={cn('relative flex size-11 shrink-0 items-center justify-center rounded-full bg-surface shadow-card transition-all active:scale-95 disabled:opacity-40', className)}>
      <Icon className="size-5" />
      {dot && <span className="absolute top-2.5 right-3 size-2 rounded-full bg-danger ring-2 ring-surface" aria-hidden />}
    </button>
  );
}

/** Pílula de filtro. Selecionada: carbon sólido. */
export function Chip({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon?: LucideIcon; children: ReactNode }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs transition-all active:scale-95',
        active ? 'border-ink bg-ink font-semibold text-white' : 'border-line bg-surface font-medium text-muted hover:border-ink',
      )}
    >
      {Icon && <Icon className="size-3.5" />}
      {children}
    </button>
  );
}

/** Controle segmentado com pílula elástica. */
export function Segmented<T extends string>({ id, value, onChange, options, className }: { id: string; value: T; onChange: (v: T) => void; options: { value: T; label: string; icon?: LucideIcon }[]; className?: string }) {
  return (
    <div className={cn('grid rounded-control bg-surface-muted p-1', className)} style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }} role="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} role="tab" aria-selected={active} onClick={() => onChange(o.value)} className={cn('relative flex h-10 items-center justify-center gap-1.5 rounded-[12px] text-sm transition-colors', active ? 'font-bold text-ink' : 'font-medium text-muted')}>
            {active && <motion.div layoutId={`seg-${id}`} className="absolute inset-0 rounded-[12px] bg-surface shadow-card" transition={{ type: 'spring', stiffness: 420, damping: 30 }} />}
            {o.icon && <o.icon className="relative size-4" />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Estrutura                                                            */
/* ------------------------------------------------------------------ */

export function ScreenHeader({ title, subtitle, leading, trailing }: { title: string; subtitle?: string; leading?: ReactNode; trailing?: ReactNode }) {
  return (
    <header className="flex items-center gap-3 px-gutter pt-safe pb-5">
      {leading}
      <div className="min-w-0 flex-1">
        <h1 className="truncate type-title1">{title}</h1>
        {subtitle && <p className="mt-0.5 truncate type-caption text-muted">{subtitle}</p>}
      </div>
      {trailing}
    </header>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between px-gutter">
      <h2 className="type-title2">{title}</h2>
      {action && <div className="type-caption text-muted">{action}</div>}
    </div>
  );
}

/** card-nomad: branco, cantos 24, borda fininha + sombra difusa. */
export function Card({ children, className, as: Tag = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'section' | 'article' }) {
  return <Tag className={cn('rounded-card bg-surface shadow-card', className)}>{children}</Tag>;
}

/** Classes do card-nomad clicável (hover mais profundo + toque que encolhe). */
export const cardInteractive = 'rounded-card bg-surface shadow-card transition-all hover:shadow-card-hover active:scale-[0.98]';

/* ------------------------------------------------------------------ */
/* Dados                                                                */
/* ------------------------------------------------------------------ */

/** Avatar com borda branca e anel de nível em gradiente primary → accent. */
export function Avatar({ src, name, points, size = 40, ring = true }: { src?: string; name?: string; points?: number; size?: 32 | 40 | 48 | 64 | 96; ring?: boolean }) {
  const info = getUserLevelInfo(points ?? 0);
  const [failed, setFailed] = useState<string | null>(null);
  const gid = useId();
  const showRing = ring && points != null;
  const stroke = size >= 64 ? 4 : 3;
  const r = size / 2 - stroke / 2;
  const c = 2 * Math.PI * r;
  const showImg = !!src && failed !== src;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {showRing && (
        <svg className="absolute inset-0 -rotate-90" width={size} height={size} aria-hidden>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" />
              <stop offset="100%" stopColor="var(--color-accent)" />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line-soft)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gid})`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(4, info.progressPercent) / 100)} />
        </svg>
      )}
      <div className="absolute overflow-hidden rounded-full border-2 border-surface bg-secondary shadow-sm" style={{ inset: showRing ? stroke : 0 }}>
        {showImg ? (
          <img src={src} alt="" className="size-full object-cover" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(src)} />
        ) : (
          <div className="flex size-full items-center justify-center font-display font-bold text-primary-strong" style={{ fontSize: Math.round(size * 0.36) }}>
            {name?.trim()[0]?.toUpperCase() ?? '?'}
          </div>
        )}
      </div>
    </div>
  );
}

export function LevelBadge({ level, className }: { level: number; className?: string }) {
  return <span className={cn('inline-flex h-5 items-center rounded-full bg-secondary px-2 type-tag text-primary-strong', className)}>Nv {level}</span>;
}

/** Badge de pontos/XP (accent). */
export function PointsPill({ points, double, className }: { points: number; double?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-accent px-2.5 type-points text-ink', className)}>
      <Sparkles className="size-3.5" />
      {double ? points * 2 : points}
      {double && <span className="ml-0.5 rounded-full bg-ink px-1.5 type-tag leading-4 text-accent">2x</span>}
    </span>
  );
}

/** Tag de categoria com fundo suave (estilo do card-nomad). */
export function CategoryTag({ category }: { category: MissionCategory }) {
  return <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 type-tag text-primary-strong">{CATEGORY_META[category].label}</span>;
}

/** Overline de categoria (texto primário em caixa alta). */
export function CategoryLabel({ category }: { category: MissionCategory }) {
  const meta = CATEGORY_META[category];
  return (
    <span className="inline-flex items-center gap-1 type-overline text-primary-strong">
      <meta.icon className="size-3.5" />
      {meta.label}
    </span>
  );
}

export function Stars({ value, onChange, size = 16 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div className={cn('flex items-center', onChange ? 'gap-1' : 'gap-0.5')} role={onChange ? 'radiogroup' : 'img'} aria-label={`${value} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = <Star style={{ width: size, height: size }} className={n <= value ? 'fill-accent text-accent' : 'text-line'} />;
        return onChange ? (
          <motion.button key={n} type="button" whileTap={{ scale: 1.25 }} role="radio" aria-checked={n === value} aria-label={`${n} estrela${n > 1 ? 's' : ''}`} onClick={() => onChange(n)} className="p-1">
            {icon}
          </motion.button>
        ) : (
          <span key={n}>{icon}</span>
        );
      })}
    </div>
  );
}

/** Barra de progresso com gradiente quente. */
export function ProgressBar({ percent, className, tone = 'warm' }: { percent: number; className?: string; tone?: 'warm' | 'success' }) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-muted', className)} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full transition-[width] duration-700', tone === 'success' ? 'bg-success' : 'bg-gradient-to-r from-primary to-accent')} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
    </div>
  );
}

/** Imagem da missão; sem foto: tom suave da categoria + ícone. */
export function MissionImage({ src, category, className, iconSize = 'size-10', decor = true }: { src?: string; category: MissionCategory; className?: string; iconSize?: string; decor?: boolean }) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  if (src) return <img src={src} alt="" loading="lazy" className={cn('object-cover', className)} />;
  return (
    <div className={cn('relative flex items-center justify-center overflow-hidden', className)} style={{ background: meta.soft }}>
      {decor && <div className="absolute -right-8 -bottom-8 size-28 rounded-full bg-white/50" />}
      <Icon className={cn('relative', iconSize)} style={{ color: meta.color }} strokeWidth={1.75} />
    </div>
  );
}

export function Meta({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 type-caption text-muted">
      <Icon className="size-3.5" />
      {children}
    </span>
  );
}
