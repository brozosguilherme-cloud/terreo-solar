import { RefreshCw } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { cn } from './ui';

const THRESHOLD = 70;

/** Container rolável com pull-to-refresh por toque. */
export function PullToRefresh({ onRefresh, children, className }: { onRefresh: () => Promise<unknown>; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = (e: React.TouchEvent) => {
    if ((ref.current?.scrollTop ?? 0) <= 0 && !refreshing) startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current == null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0 && (ref.current?.scrollTop ?? 0) <= 0) setPull(Math.min(110, dy * 0.5));
    else setPull(0);
  };
  const onTouchEnd = async () => {
    startY.current = null;
    if (pull >= THRESHOLD) {
      setRefreshing(true);
      setPull(THRESHOLD - 14);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else setPull(0);
  };

  return (
    <div
      ref={ref}
      className={cn('relative h-full overflow-y-auto overscroll-contain no-scrollbar', className)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center" style={{ transform: `translateY(${pull - 40}px)`, opacity: Math.min(1, pull / THRESHOLD) }}>
        <div className="flex size-9 items-center justify-center rounded-full bg-white shadow-card">
          <RefreshCw className={cn('size-4 text-primary', refreshing && 'animate-spin')} style={{ transform: refreshing ? undefined : `rotate(${pull * 3}deg)` }} />
        </div>
      </div>
      <div style={{ transform: `translateY(${pull}px)`, transition: startY.current == null ? 'transform 250ms ease' : undefined }}>{children}</div>
    </div>
  );
}
