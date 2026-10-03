import { Compass } from 'lucide-react';
import { motion } from 'motion/react';

export function SplashScreen() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-secondary">
      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotate: -60 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 160, damping: 14 }}
        className="flex size-24 items-center justify-center rounded-sheet bg-primary shadow-primary"
      >
        <motion.div animate={{ rotate: [0, 18, -12, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
          <Compass className="size-12 text-white" strokeWidth={1.8} />
        </motion.div>
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-6 type-display"
      >
        App<span className="text-primary">Nix</span>
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-2 type-callout text-muted">
        Explore. Faça check-in. Suba de nível.
      </motion.p>
      <motion.div className="mt-10 flex gap-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-2 rounded-full bg-primary"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </motion.div>
    </div>
  );
}
