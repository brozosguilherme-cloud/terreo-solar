import { CheckCircle2, Clock, MapPin, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDistance } from '../lib/geo';
import type { Mission } from '../services/types';
import { CATEGORY_META, MissionImage, PointsPill } from './ui';

export function MissionCard({ mission, distance, done, onClick }: { mission: Mission; distance: number | null; done: boolean; onClick: () => void }) {
  const meta = CATEGORY_META[mission.category];
  return (
    <motion.button
      layout
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-[24px] bg-white p-3 text-left shadow-card"
    >
      <div className="relative">
        <MissionImage src={mission.image} category={mission.category} className="size-20 rounded-[18px]" iconSize="size-8" />
        {done && (
          <div className="absolute inset-0 flex items-center justify-center rounded-[18px] bg-success/80">
            <CheckCircle2 className="size-8 text-white" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase" style={{ color: meta.color }}>
          <meta.icon className="size-3.5" />
          {meta.label}
          {mission.timeLimit && (
            <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-[#FDE8E2] px-1.5 py-0.5 text-[10px] text-[#B9503B] normal-case">
              <Clock className="size-3" /> {mission.timeLimit}
            </span>
          )}
        </div>
        <h3 className="truncate font-display text-[17px] font-semibold">{mission.title}</h3>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" /> {formatDistance(distance)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" /> {mission.completions}
          </span>
        </div>
      </div>
      <PointsPill points={mission.points} double={mission.isDoublePoints} className="self-start" />
    </motion.button>
  );
}
