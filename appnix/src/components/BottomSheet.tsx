import { AnimatePresence, motion, useDragControls, type PanInfo } from 'motion/react';
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './ui';

export const PORTAL_ID = 'appnix-portal';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  /** altura máxima (ex: '90%') */
  maxHeight?: string;
  className?: string;
  footer?: ReactNode;
}

/** Modal estilo bottom sheet com drag-handle (arraste para baixo para fechar). */
export function BottomSheet({ open, onClose, title, children, maxHeight = '85%', className, footer }: Props) {
  const drag = useDragControls();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  const sheet = (
    <AnimatePresence>
      {open && (
        <div className="pointer-events-auto absolute inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn('absolute inset-x-0 bottom-0 flex flex-col rounded-t-modal bg-surface shadow-sheet', className)}
            style={{ maxHeight }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            drag="y"
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            <div className="flex shrink-0 cursor-grab touch-none justify-center pt-3 pb-4 active:cursor-grabbing" onPointerDown={(e) => drag.start(e)}>
              <div className="h-1.5 w-12 rounded-full bg-handle" />
            </div>
            {title && (
              <div className="shrink-0 touch-none px-gutter pb-4" onPointerDown={(e) => drag.start(e)}>
                {typeof title === 'string' ? <h2 className="type-title2">{title}</h2> : title}
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
            {footer && <div className="shrink-0 border-t border-line-soft px-gutter pt-4 pb-safe">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
  // Portal para a raiz da tela do app: evita containers com transform/overflow.
  const host = typeof document !== 'undefined' ? document.getElementById(PORTAL_ID) : null;
  return host ? createPortal(sheet, host) : sheet;
}
