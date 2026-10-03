import { Compass, Landmark, LoaderCircle, Mountain, Route, Sparkles, Star, Utensils, type LucideIcon } from 'lucide-react';
import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { getUserLevelInfo } from '../lib/levels';
import type { MissionCategory } from '../services/types';

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export const CATEGORY_META: Record<MissionCategory, { label: string; icon: LucideIcon; color: string; bg: string; gradient: string }> = {
  turismo: { label: 'Turismo', icon: Landmark, color: '#E9A34D', bg: '#FFF1DE', gradient: 'linear-gradient(135deg,#F6C886 0%,#E9A34D 55%,#C9842F 100%)' },
  gastronomia: { label: 'Gastronomia', icon: Utensils, color: '#E5735A', bg: '#FDE8E2', gradient: 'linear-gradient(135deg,#F7B39B 0%,#E5735A 55%,#B9503B 100%)' },
  explorador: { label: 'Explorador', icon: Mountain, color: '#3FA58A', bg: '#DFF3EC', gradient: 'linear-gradient(135deg,#8FD4BE 0%,#3FA58A 55%,#2A7A65 100%)' },
};

export const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  landmark: Landmark,
  utensils: Utensils,
  sparkles: Sparkles,
  mountain: Mountain,
  compass: Compass,
  route: Route,
};

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cn('animate-spin', className ?? 'size-5')} aria-hidden />;
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';

export function Button({
  variant = 'primary',
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; loading?: boolean }) {
  const styles: Record<BtnVariant, string> = {
    primary: 'bg-primary text-white shadow-[0_8px_24px_-8px_rgb(233_163_77/0.8)] active:bg-primary-dark',
    secondary: 'bg-secondary text-ink border border-[#F3E2CF] active:bg-[#FBEBDB]',
    ghost: 'bg-transparent text-ink active:bg-black/5',
    danger: 'bg-danger text-white active:opacity-90',
    dark: 'bg-ink text-white active:bg-black',
  };
  return (
    <button
      className={cn(
        'inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100',
        styles[variant],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}

const RING_COLORS = ['#E9A34D', '#E9A34D', '#E9A34D', '#E9A34D', '#E58F3A', '#E07B2E', '#FFD166', '#F4B942', '#E9A34D', '#FFD166'];

/** Avatar com anel de progresso do nível. */
export function Avatar({ src, name, points, size = 44, ring = true }: { src?: string; name?: string; points?: number; size?: number; ring?: boolean }) {
  const info = getUserLevelInfo(points ?? 0);
  const stroke = 3;
  const r = size / 2 - stroke / 2;
  const c = 2 * Math.PI * r;
  const color = RING_COLORS[info.levelNum - 1];
  const [failed, setFailed] = useState<string | null>(null);
  const showImg = !!src && failed !== src;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {ring && points != null && (
        <svg className="absolute inset-0 -rotate-90" width={size} height={size} aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EFE7DE" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - info.progressPercent / 100)}
          />
        </svg>
      )}
      <div className="absolute overflow-hidden rounded-full bg-secondary" style={{ inset: ring && points != null ? stroke + 2 : 0 }}>
        {showImg ? (
          <img src={src} alt={name ?? ''} className="size-full object-cover" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(src)} />
        ) : (
          <div className="flex size-full items-center justify-center font-display font-bold text-primary" style={{ fontSize: size * 0.38 }}>
            {name?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
      </div>
    </div>
  );
}

export function LevelBadge({ level, className }: { level: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-primary-dark', className)}>
      Nv {level}
    </span>
  );
}

export function PointsPill({ points, double, className }: { points: number; double?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-ink', className)}>
      <Sparkles className="size-3.5" />
      {double ? points * 2 : points} pts
      {double && <span className="rounded-full bg-ink px-1.5 text-[10px] text-accent">2x</span>}
    </span>
  );
}

export function Stars({ value, onChange, size = 16 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div className="flex items-center gap-1" role={onChange ? 'radiogroup' : undefined} aria-label={`${value} de 5 estrelas`}>
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

export function ProgressBar({ percent, className, color = 'var(--color-primary)' }: { percent: number; className?: string; color?: string }) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-[#F0E8DF]', className)}>
      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.max(0, Math.min(100, percent))}%`, background: color }} />
    </div>
  );
}

/** Imagem da missão com fallback de gradiente + ícone da categoria. */
export function MissionImage({ src, category, className, iconSize = 'size-10' }: { src?: string; category: MissionCategory; className?: string; iconSize?: string }) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  if (src) return <img src={src} alt="" loading="lazy" className={cn('object-cover', className)} />;
  return (
    <div className={cn('relative flex items-center justify-center overflow-hidden', className)} style={{ background: meta.gradient }}>
      <div className="absolute -right-6 -bottom-6 size-28 rounded-full bg-white/15" />
      <div className="absolute -top-8 -left-4 size-20 rounded-full bg-white/10" />
      <Icon className={cn('relative text-white/90', iconSize)} strokeWidth={1.6} />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-8 py-12 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-[24px] bg-secondary">
        <Icon className="size-7 text-primary" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {text && <p className="mt-1 text-sm text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between px-5">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {action}
    </div>
  );
}
