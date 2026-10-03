import { Check, ChevronRight } from 'lucide-react';
import { formatDistance } from '../lib/geo';
import type { Mission } from '../services/types';
import { MissionImage, Skeleton } from './ui';

/** Linha de missão (direção calma): só título + uma linha de detalhe. O resto fica no detalhe. */
export function MissionCard({ mission, distance, done, onClick }: { mission: Mission; distance: number | null; done: boolean; onClick: () => void }) {
  const pts = mission.isDoublePoints ? mission.points * 2 : mission.points;
  return (
    <button onClick={onClick} className="flex w-full items-center gap-4 py-4 text-left transition active:opacity-60">
      <MissionImage src={mission.image} category={mission.category} className="size-14 shrink-0 rounded-control" iconSize="size-6" decor={false} />
      <div className="min-w-0 flex-1">
        <h3 className={done ? 'truncate type-body-strong text-muted' : 'truncate type-body-strong'}>{mission.title}</h3>
        <p className="mt-0.5 truncate type-caption text-muted">
          {done ? 'Visitado' : `${formatDistance(distance)} · ${pts} pts${mission.isDoublePoints ? ' (2x)' : ''}`}
        </p>
      </div>
      {done ? (
        <span className="flex size-6 items-center justify-center rounded-full bg-success-soft">
          <Check className="size-3.5 text-success-ink" />
        </span>
      ) : (
        <ChevronRight className="size-4 text-line" />
      )}
    </button>
  );
}

export function MissionCardSkeleton() {
  return (
    <div className="flex items-center gap-4 py-4">
      <Skeleton className="size-14 rounded-control" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-40 rounded-full" />
        <Skeleton className="h-3 w-24 rounded-full" />
      </div>
    </div>
  );
}
