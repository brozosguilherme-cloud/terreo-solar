import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../hooks/useApp';
import { cn } from './ui';

export function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-5 pt-safe" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            className={cn(
              'rounded-2xl px-4 py-3 text-sm font-medium shadow-float',
              t.tone === 'error' ? 'bg-danger text-white' : t.tone === 'success' ? 'bg-ink text-white' : 'bg-white text-ink',
            )}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
