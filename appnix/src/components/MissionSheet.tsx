import { Camera, CheckCircle2, Navigation, Percent, Users } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { CHECKIN_RADIUS_METERS, directionsUrl, formatDistance } from '../lib/geo';
import type { Mission } from '../services/types';
import { BottomSheet } from './BottomSheet';
import { Button, CATEGORY_META, MissionImage, PointsPill } from './ui';

export function MissionSheet({ mission, onClose }: { mission: Mission | null; onClose: () => void }) {
  const { distanceTo, profile, openCheckin, position } = useApp();
  const d = mission ? distanceTo(mission) : null;
  const done = !!mission && !!profile?.checkins.includes(mission.id);
  const inRange = d != null && d <= CHECKIN_RADIUS_METERS;
  const meta = mission ? CATEGORY_META[mission.category] : null;

  return (
    <BottomSheet
      open={!!mission}
      onClose={onClose}
      footer={
        mission && (
          <div className="flex gap-3">
            <a href={directionsUrl(mission, position)} target="_blank" rel="noreferrer" className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-line font-semibold">
              <Navigation className="size-4" /> Rota
            </a>
            <Button
              className="flex-[1.6]"
              disabled={done}
              onClick={() => {
                onClose();
                openCheckin(mission.id);
              }}
            >
              {done ? <><CheckCircle2 className="size-5" /> Concluída</> : <><Camera className="size-5" /> {inRange ? 'Fazer check-in' : 'Ir ao check-in'}</>}
            </Button>
          </div>
        )
      }
    >
      {mission && meta && (
        <div className="px-5 pb-4">
          <MissionImage src={mission.image} category={mission.category} className="h-48 w-full rounded-[24px]" iconSize="size-16" />
          <div className="mt-4 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: meta.bg, color: meta.color }}>
              <meta.icon className="size-3.5" /> {meta.label}
            </span>
            <PointsPill points={mission.points} double={mission.isDoublePoints} />
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight">{mission.title}</h2>
          <p className="mt-2 leading-relaxed text-muted">{mission.description}</p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { icon: Navigation, label: 'Distância', value: formatDistance(d) },
              { icon: Users, label: 'Visitas', value: String(mission.completions) },
              { icon: Percent, label: 'Match', value: mission.matchPercentage ? `${mission.matchPercentage}%` : '—' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-bg p-3 text-center">
                <s.icon className="mx-auto size-4 text-primary" />
                <div className="mt-1 font-display text-lg font-semibold">{s.value}</div>
                <div className="text-[11px] text-muted">{s.label}</div>
              </div>
            ))}
          </div>
          {!done && !inRange && d != null && (
            <p className="mt-4 rounded-2xl bg-secondary px-4 py-3 text-sm text-ink/80">
              Chegue a até {CHECKIN_RADIUS_METERS} m do local para liberar o check-in.
            </p>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
