import { CheckCircle2, Clock, MapPin } from 'lucide-react';
import { formatDistance } from '../lib/geo';
import type { Mission } from '../services/types';
import { CategoryTag, Meta, MissionImage, PointsPill, Skeleton, cardInteractive, cn } from './ui';

/** card-nomad de missão: tag suave, título forte, uma linha de metadados. */
export function MissionCard({ mission, distance, done, onClick }: { mission: Mission; distance: number | null; done: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn('flex w-full items-center gap-4 p-4 text-left', cardInteractive)}>
      <div className="relative shrink-0">
        <MissionImage src={mission.image} category={mission.category} className="size-16 rounded-control" iconSize="size-7" decor={false} />
        {done && (
          <div className="absolute inset-0 flex items-center justify-center rounded-control bg-success/85">
            <CheckCircle2 className="size-7 text-white" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <CategoryTag category={mission.category} />
          {!done && <PointsPill points={mission.points} double={mission.isDoublePoints} />}
        </div>
        <h3 className="mt-2 truncate type-title3 leading-snug">{mission.title}</h3>
        <div className="mt-1 flex items-center gap-3">
          {done ? (
            <span className="type-caption text-success-ink">Concluída</span>
          ) : (
            <>
              <Meta icon={MapPin}>{formatDistance(distance)}</Meta>
              {mission.timeLimit && <Meta icon={Clock}>{mission.timeLimit}</Meta>}
            </>
          )}
        </div>
      </div>
    </button>
  );
}

export function MissionCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-card bg-surface p-4 shadow-card">
      <Skeleton className="size-16 rounded-control" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-4 w-40 rounded-full" />
        <Skeleton className="h-3 w-24 rounded-full" />
      </div>
    </div>
  );
}
