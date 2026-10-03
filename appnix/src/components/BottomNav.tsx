import { Camera, Compass, Map, Newspaper, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp, type Tab } from '../hooks/useApp';
import { cn } from './ui';

const ITEMS: { id: Tab; label: string; icon: typeof Compass }[] = [
  { id: 'home', label: 'Início', icon: Compass },
  { id: 'map', label: 'Mapa', icon: Map },
  { id: 'checkin', label: 'Check-in', icon: Camera },
  { id: 'feed', label: 'Feed', icon: Newspaper },
  { id: 'social', label: 'Comunidade', icon: Users },
];

export function BottomNav() {
  const { tab, setTab, openCheckin } = useApp();
  return (
    <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-4 pb-safe" aria-label="Navegação principal">
      <div className="pointer-events-auto mx-auto flex max-w-md items-center justify-between rounded-[28px] border border-white/60 bg-white/75 p-1.5 shadow-float backdrop-blur-xl">
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          if (id === 'checkin') {
            return (
              <button
                key={id}
                onClick={() => openCheckin(null)}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className="relative -my-4 flex size-14 items-center justify-center rounded-[22px] bg-primary text-white shadow-[0_10px_24px_-6px_rgb(233_163_77/0.9)] transition active:scale-95"
              >
                <Icon className="size-6" strokeWidth={2.2} />
              </button>
            );
          }
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-current={active ? 'page' : undefined}
              className={cn('relative flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-[22px] text-[10px] font-semibold transition-colors', active ? 'text-ink' : 'text-muted')}
            >
              {active && (
                <motion.div layoutId="active-nav-pill" className="absolute inset-0 rounded-[22px] bg-secondary" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
              )}
              <Icon className={cn('relative size-5', active && 'text-primary')} strokeWidth={active ? 2.4 : 2} />
              <span className="relative">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
