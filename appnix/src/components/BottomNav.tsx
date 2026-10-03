import { Camera, Compass, Map, Newspaper, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp, type Tab } from '../hooks/useApp';
import { cn } from './ui';

const ITEMS: { id: Tab; label: string; icon: typeof Compass }[] = [
  { id: 'home', label: 'Início', icon: Compass },
  { id: 'map', label: 'Mapa', icon: Map },
  { id: 'checkin', label: 'Check-in', icon: Camera },
  { id: 'feed', label: 'Feed', icon: Newspaper },
  { id: 'social', label: 'Social', icon: Users },
];

export function BottomNav() {
  const { tab, setTab, openCheckin } = useApp();
  return (
    <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-4 pb-safe" aria-label="Navegação principal">
      <div className="pointer-events-auto mx-auto flex max-w-md items-center justify-between rounded-full bg-white/90 p-1.5 shadow-float backdrop-blur-xl">
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          if (id === 'checkin') {
            return (
              <button
                key={id}
                onClick={() => openCheckin(null)}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className="relative mx-1 flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-primary transition active:scale-95"
              >
                <Icon className="size-5" strokeWidth={2} />
              </button>
            );
          }
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-current={active ? 'page' : undefined}
              className={cn('relative flex h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full type-overline font-medium normal-case tracking-normal transition-colors', active ? 'text-ink' : 'text-muted')}
            >
              {active && (
                <motion.div layoutId="active-nav-pill" className="absolute inset-0 rounded-full bg-surface-muted" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
              )}
              <Icon className="relative size-5" strokeWidth={active ? 2 : 1.5} />
              <span className="relative max-w-full truncate px-1">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
