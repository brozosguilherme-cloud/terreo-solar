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

/**
 * Tab bar flutuante centralizada (não colada no rodapé).
 * Ativo expande de 54 → 72 px com pílula elástica `active-nav-pill` (primary/10).
 */
export function BottomNav() {
  const { tab, setTab, openCheckin } = useApp();
  return (
    <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center pb-[max(env(safe-area-inset-bottom),24px)]" aria-label="Navegação principal">
      <div className="pointer-events-auto flex items-center gap-2 rounded-sheet bg-white/95 p-2 shadow-float backdrop-blur-xl">
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          if (id === 'checkin') {
            return (
              <motion.button
                key={id}
                layout
                onClick={() => openCheckin(null)}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className="flex h-[54px] w-[54px] items-center justify-center rounded-[24px] bg-primary text-white shadow-primary transition-transform active:scale-95"
              >
                <Icon className="size-6" strokeWidth={2.2} />
              </motion.button>
            );
          }
          return (
            <motion.button
              key={id}
              layout
              onClick={() => setTab(id)}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              transition={{ type: 'spring', stiffness: 500, damping: 32 }}
              className={cn('relative flex h-[54px] flex-col items-center justify-center gap-0.5 rounded-[24px] transition-colors active:scale-95', active ? 'w-[72px] text-primary' : 'w-[54px] text-muted')}
            >
              {active && <motion.div layoutId="active-nav-pill" className="absolute inset-0 rounded-[24px] bg-primary/10" transition={{ type: 'spring', stiffness: 500, damping: 30 }} />}
              <Icon className="relative size-5" strokeWidth={active ? 2.4 : 2} />
              {active && (
                <motion.span initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }} className="relative type-tag normal-case tracking-normal">
                  {label}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
