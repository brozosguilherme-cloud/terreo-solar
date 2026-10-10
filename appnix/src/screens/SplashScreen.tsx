import { motion } from 'motion/react';
import { LogoMark } from '../components/Logo';

export function SplashScreen() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-secondary">
      <motion.div
        initial={{ scale: 0.6, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 14 }}
      >
        {/* o pin "quica" de leve, como um marcador caindo no mapa */}
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} className="drop-shadow-[0_12px_20px_rgb(233_163_77/0.35)]">
          <LogoMark size={104} />
        </motion.div>
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-6 flex flex-col items-center gap-1"
      >
        <span className="font-display text-[56px] leading-[0.8] font-extrabold tracking-[-0.05em] text-ink">nix</span>
        <span className="font-display text-base font-medium text-[#7A4710]">experiências</span>
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
