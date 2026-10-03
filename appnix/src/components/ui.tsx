import { Compass, Landmark, LoaderCircle, Mountain, Route, Sparkles, Star, Utensils, type LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { getUserLevelInfo } from '../lib/levels';
import type { MissionCategory } from '../services/types';

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/* ------------------------------------------------------------------ */
/* Categorias                                                           */
/* ------------------------------------------------------------------ */

export const CATEGORY_META: Record<MissionCategory, { label: string; icon: LucideIcon; color: string; soft: string; text: string; bg: string; gradient: string }> = {
  turismo: { label: 'Turismo', icon: Landmark, color: 'var(--color-turismo)', soft: 'var(--color-turismo-soft)', text: 'text-primary-strong', bg: 'bg-turismo-soft', gradient: 'linear-gradient(135deg,#F6C886 0%,#E9A34D 60%,#D08A35 100%)' },
  gastronomia: { label: 'Gastronomia', icon: Utensils, color: 'var(--color-gastronomia)', soft: 'var(--color-gastronomia-soft)', text: 'text-gastronomia', bg: 'bg-gastronomia-soft', gradient: 'linear-gradient(135deg,#F7B39B 0%,#E5735A 60%,#C95A42 100%)' },
  explorador: { label: 'Explorador', icon: Mountain, color: 'var(--color-explorador)', soft: 'var(--color-explorador-soft)', text: 'text-explorador', bg: 'bg-explorador-soft', gradient: 'linear-gradient(135deg,#8FD4BE 0%,#3FA58A 60%,#2E8A71 100%)' },
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

/** Placeholder com brilho para listas carregando. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden bg-surface-muted', className)} aria-hidden>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-8 py-10 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-surface-muted">
        <Icon className="size-6 text-muted" strokeWidth={1.5} />
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

/** Faixa de status inline (ex.: "Você está no local"). */
export function StatusBanner({ tone, icon: Icon, children, className }: { tone: Tone; icon?: LucideIcon; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start gap-2 rounded-control px-4 py-3 type-label', TONES[tone], className)} role="status">
      {Icon && <Icon className="mt-0.5 size-4 shrink-0" />}
      <span>{children}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ações                                                                */
/* ------------------------------------------------------------------ */

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
type BtnSize = 'lg' | 'md' | 'sm';

const BTN_VARIANTS: Record<BtnVariant, string> = {
  primary: 'bg-primary text-white shadow-primary active:bg-primary-strong',
  secondary: 'bg-surface text-ink border border-line active:bg-surface-muted',
  ghost: 'bg-transparent text-ink active:bg-surface-muted',
  danger: 'bg-danger text-white active:opacity-90',
  dark: 'bg-ink text-white active:bg-black',
};
const BTN_SIZES: Record<BtnSize, string> = {
  lg: 'h-13 px-6 type-body-strong gap-2 [&_svg]:size-5',
  md: 'h-11 px-5 type-label gap-2 [&_svg]:size-4',
  sm: 'h-9 px-3.5 type-caption font-semibold gap-1.5 [&_svg]:size-4',
};

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
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-control transition active:scale-[0.97] disabled:pointer-events-none disabled:border-transparent disabled:bg-surface-muted disabled:text-muted disabled:shadow-none',
        BTN_VARIANTS[variant],
        BTN_SIZES[size],
        size === 'sm' && 'rounded-full',
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}

/** Link com aparência de botão (ex.: abrir rota no Google Maps). */
export function LinkButton({ href, children, className, size = 'lg' }: { href: string; children: ReactNode; className?: string; size?: BtnSize }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={cn('inline-flex items-center justify-center rounded-control transition active:scale-[0.97]', BTN_VARIANTS.secondary, BTN_SIZES[size], className)}>
      {children}
    </a>
  );
}

/** Botão quadrado de 44 px só com ícone. `label` é obrigatório (acessibilidade). */
export function IconButton({ icon: Icon, label, onClick, badge, className, disabled }: { icon: LucideIcon; label: string; onClick?: () => void; badge?: number; className?: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} className={cn('relative -m-2 flex size-11 shrink-0 items-center justify-center rounded-full text-ink transition active:bg-surface-muted disabled:opacity-40', className)}>
      <Icon className="size-5" />
      {!!badge && (
        <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-primary ring-2 ring-bg" aria-hidden />
      )}
    </button>
  );
}

/** Pílula de filtro (altura 40). */
export function Chip({ active, onClick, icon: Icon, iconColor, children }: { active: boolean; onClick: () => void; icon?: LucideIcon; iconColor?: string; children: ReactNode }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn('flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 type-label transition', active ? 'bg-secondary text-ink' : 'text-muted')}
    >
      {Icon && <Icon className="size-4" style={{ color: active ? iconColor : undefined }} />}
      {children}
    </button>
  );
}

/** Controle segmentado com indicador animado. */
export function Segmented<T extends string>({ id, value, onChange, options, className }: { id: string; value: T; onChange: (v: T) => void; options: { value: T; label: string; icon?: LucideIcon }[]; className?: string }) {
  return (
    <div className={cn('grid rounded-full bg-surface-muted p-1', className)} style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }} role="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} role="tab" aria-selected={active} onClick={() => onChange(o.value)} className={cn('relative flex h-9 items-center justify-center gap-1.5 rounded-full type-label transition-colors', active ? 'text-ink' : 'text-muted')}>
            {active && <motion.div layoutId={`seg-${id}`} className="absolute inset-0 rounded-full bg-surface shadow-[0_1px_3px_rgb(34_34_34/0.08)]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            {o.icon && <o.icon className="relative size-4" />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Estrutura de tela                                                    */
/* ------------------------------------------------------------------ */

/** Cabeçalho padrão: título 28 px, subtítulo opcional e ações à direita. */
export function ScreenHeader({ title, subtitle, leading, trailing }: { title: string; subtitle?: string; leading?: ReactNode; trailing?: ReactNode }) {
  return (
    <header className="flex items-center gap-4 px-gutter pt-safe pb-6">
      {leading}
      <div className="min-w-0 flex-1">
        <h1 className="truncate type-title1">{title}</h1>
        {subtitle && <p className="mt-1 truncate type-callout text-muted">{subtitle}</p>}
      </div>
      {trailing}
    </header>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between px-gutter">
      <h2 className="type-title2">{title}</h2>
      {action && <div className="type-callout text-muted">{action}</div>}
    </div>
  );
}

export function Card({ children, className, as: Tag = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'section' | 'article' }) {
  return <Tag className={cn('rounded-card bg-surface shadow-card', className)}>{children}</Tag>;
}

/* ------------------------------------------------------------------ */
/* Dados                                                                */
/* ------------------------------------------------------------------ */

/** Avatar com anel de progresso do nível. Tamanhos do spec: 32, 40, 48, 64, 96. */
export function Avatar({ src, name, points, size = 40, ring = true }: { src?: string; name?: string; points?: number; size?: 32 | 40 | 48 | 64 | 96; ring?: boolean }) {
  const info = getUserLevelInfo(points ?? 0);
  const [failed, setFailed] = useState<string | null>(null);
  const showRing = ring && points != null;
  const stroke = size >= 64 ? 4 : 3;
  const r = size / 2 - stroke / 2;
  const c = 2 * Math.PI * r;
  const showImg = !!src && failed !== src;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {showRing && (
        <svg className="absolute inset-0 -rotate-90" width={size} height={size} aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line-soft)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={info.levelNum >= 7 ? 'var(--color-accent)' : 'var(--color-primary)'} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(4, info.progressPercent) / 100)} />
        </svg>
      )}
      <div className="absolute overflow-hidden rounded-full bg-secondary" style={{ inset: showRing ? stroke + 2 : 0 }}>
        {showImg ? (
          <img src={src} alt="" className="size-full object-cover" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(src)} />
        ) : (
          <div className="flex size-full items-center justify-center font-display font-semibold text-primary-strong" style={{ fontSize: Math.round(size * 0.36) }}>
            {name?.trim()[0]?.toUpperCase() ?? '?'}
          </div>
        )}
      </div>
    </div>
  );
}

export function LevelBadge({ level, className }: { level: number; className?: string }) {
  return <span className={cn('inline-flex items-center type-caption text-muted', className)}>· Nv {level}</span>;
}

export function PointsPill({ points, double, className }: { points: number; double?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-secondary px-2.5 type-caption text-primary-strong', className)}>
      <Sparkles className="size-3" />
      <span className="type-number">{double ? points * 2 : points}</span> pts
      {double && <span className="ml-0.5 font-semibold">· 2x</span>}
    </span>
  );
}

export function Stars({ value, onChange, size = 16 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div className={cn('flex items-center', onChange ? 'gap-1' : 'gap-0.5')} role={onChange ? 'radiogroup' : 'img'} aria-label={`${value} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = <Star style={{ width: size, height: size }} className={n <= value ? 'fill-accent text-accent' : 'text-line'} />;
        return onChange ? (
          <button key={n} type="button" role="radio" aria-checked={n === value} aria-label={`${n} estrela${n > 1 ? 's' : ''}`} onClick={() => onChange(n)} className="p-1 transition active:scale-90">
            {icon}
          </button>
        ) : (
          <span key={n}>{icon}</span>
        );
      })}
    </div>
  );
}

export function ProgressBar({ percent, className, tone = 'primary' }: { percent: number; className?: string; tone?: 'primary' | 'success' | 'accent' }) {
  const color = { primary: 'bg-primary', success: 'bg-success', accent: 'bg-accent' }[tone];
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-muted', className)} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full transition-[width] duration-700', color)} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
    </div>
  );
}

/** Imagem da missão com fallback de gradiente + ícone da categoria. */
export function MissionImage({ src, category, className, iconSize = 'size-10', decor = true }: { src?: string; category: MissionCategory; className?: string; iconSize?: string; decor?: boolean }) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  if (src) return <img src={src} alt="" loading="lazy" className={cn('object-cover', className)} />;
  // direção calma: fundo suave da categoria + ícone fino colorido (sem gradiente saturado)
  return (
    <div className={cn('relative flex items-center justify-center overflow-hidden', className)} style={{ background: meta.soft }}>
      {decor && <div className="absolute -right-8 -bottom-8 size-28 rounded-full bg-white/40" />}
      <Icon className={cn('relative', iconSize)} style={{ color: meta.color }} strokeWidth={1.5} />
    </div>
  );
}

/** Rótulo de categoria (overline colorido com ícone). */
export function CategoryLabel({ category }: { category: MissionCategory }) {
  const meta = CATEGORY_META[category];
  return (
    <span className={cn('inline-flex items-center gap-1 type-overline', meta.text)}>
      <meta.icon className="size-3.5" />
      {meta.label}
    </span>
  );
}

/** Metadado pequeno com ícone (distância, visitas…). */
export function Meta({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 type-caption text-muted">
      <Icon className="size-3.5" />
      {children}
    </span>
  );
}
