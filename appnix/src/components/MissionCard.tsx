import { CheckCircle2, Clock, MapPin, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDistance } from '../lib/geo';
import type { Mission } from '../services/types';
import { CategoryLabel, Meta, MissionImage, PointsPill, Skeleton, cn } from './ui';

export function MissionCard({ mission, distance, done, onClick }: { mission: Mission; distance: number | null; done: boolean; onClick: () => void }) {
  return (
    <motion.button
      layout
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn('flex w-full items-center gap-3 rounded-card bg-surface p-3 text-left shadow-card', done && 'opacity-70')}
    >
      <div className="relative shrink-0">
        <MissionImage src={mission.image} category={mission.category} className="size-18 rounded-control" iconSize="size-7" decor={false} />
        {done && (
          <div className="absolute inset-0 flex items-center justify-center rounded-control bg-success/85">
            <CheckCircle2 className="size-7 text-white" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-center justify-between gap-2">
          <CategoryLabel category={mission.category} />
          <PointsPill points={mission.points} double={mission.isDoublePoints} />
        </div>
        <h3 className="mt-1 truncate type-title3">{mission.title}</h3>
        <div className="mt-1 flex items-center gap-3">
          <Meta icon={MapPin}>{formatDistance(distance)}</Meta>
          <Meta icon={Users}>{mission.completions} visitas</Meta>
          {mission.timeLimit && <Meta icon={Clock}>{mission.timeLimit}</Meta>}
        </div>
      </div>
    </motion.button>
  );
}

export function MissionCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-card bg-surface p-3 shadow-card">
      <Skeleton className="size-18 rounded-control" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="h-4 w-40 rounded-full" />
        <Skeleton className="h-3 w-28 rounded-full" />
      </div>
    </div>
  );
}
