import { Camera, CheckCircle2, Lock, Navigation, Percent, Users } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { CHECKIN_RADIUS_METERS, directionsUrl, formatDistance } from '../lib/geo';
import type { Mission } from '../services/types';
import { BottomSheet } from './BottomSheet';
import { Button, CategoryLabel, LinkButton, MissionImage, PointsPill, StatusBanner } from './ui';

export function MissionSheet({ mission, onClose }: { mission: Mission | null; onClose: () => void }) {
  const { distanceTo, profile, openCheckin, position } = useApp();
  const d = mission ? distanceTo(mission) : null;
  const done = !!mission && !!profile?.checkins.includes(mission.id);
  const inRange = d != null && d <= CHECKIN_RADIUS_METERS;

  return (
    <BottomSheet
      open={!!mission}
      onClose={onClose}
      footer={
        mission && (
          <div className="flex gap-3">
            <LinkButton href={directionsUrl(mission, position)} className="flex-1">
              <Navigation /> Rota
            </LinkButton>
            <Button
              className="flex-[1.6]"
              disabled={done}
              onClick={() => {
                onClose();
                openCheckin(mission.id);
              }}
            >
              {done ? <><CheckCircle2 /> Concluída</> : <><Camera /> {inRange ? 'Fazer check-in' : 'Ir ao check-in'}</>}
            </Button>
          </div>
        )
      }
    >
      {mission && (
        <div className="px-gutter pb-6">
          <MissionImage src={mission.image} category={mission.category} className="h-44 w-full rounded-card" iconSize="size-14" />
          <div className="mt-5 flex items-center justify-between">
            <CategoryLabel category={mission.category} />
            <PointsPill points={mission.points} double={mission.isDoublePoints} />
          </div>
          <h2 className="mt-2 type-title1">{mission.title}</h2>
          <p className="mt-2 type-body text-muted">{mission.description}</p>

          <div className="mt-5 grid grid-cols-3 divide-x divide-line-soft rounded-card bg-bg py-3">
            {[
              { icon: Navigation, label: 'Distância', value: formatDistance(d) },
              { icon: Users, label: 'Visitas', value: String(mission.completions) },
              { icon: Percent, label: 'Match', value: mission.matchPercentage ? `${mission.matchPercentage}%` : '—' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-0.5">
                <s.icon className="size-4 text-primary" />
                <span className="mt-1 type-body-strong type-number">{s.value}</span>
                <span className="type-caption text-muted">{s.label}</span>
              </div>
            ))}
          </div>

          {done ? (
            <StatusBanner tone="success" icon={CheckCircle2} className="mt-4">Você já carimbou este local no passaporte.</StatusBanner>
          ) : inRange ? (
            <StatusBanner tone="success" icon={CheckCircle2} className="mt-4">Você está no local. Check-in liberado!</StatusBanner>
          ) : d != null ? (
            <StatusBanner tone="brand" icon={Lock} className="mt-4">Chegue a até {CHECKIN_RADIUS_METERS} m do local para liberar o check-in.</StatusBanner>
          ) : null}
        </div>
      )}
    </BottomSheet>
  );
}
