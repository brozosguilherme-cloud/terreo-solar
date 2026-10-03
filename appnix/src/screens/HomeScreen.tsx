import { Bell, Camera, CheckCircle2, ChevronRight, Heart, MapPin, MessageCircle, Navigation, Search, Sparkles, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { MissionCard } from '../components/MissionCard';
import { MissionSheet } from '../components/MissionSheet';
import { PullToRefresh } from '../components/PullToRefresh';
import { ACHIEVEMENT_ICONS, Avatar, Button, CATEGORY_META, EmptyState, MissionImage, ProgressBar, SectionTitle, Spinner, cn } from '../components/ui';
import { useApp } from '../hooks/useApp';
import { formatDistance, type LatLng } from '../lib/geo';
import { getUserLevelInfo } from '../lib/levels';
import { timeAgo } from '../lib/time';
import { achievementProgress } from '../services/rules';
import type { Achievement, Mission, MissionCategory } from '../services/types';

type Filter = 'all' | 'near' | MissionCategory;
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'near', label: 'Próximas' },
  { id: 'turismo', label: 'Turismo' },
  { id: 'gastronomia', label: 'Gastronomia' },
  { id: 'explorador', label: 'Explorador' },
];
const NEAR_RADIUS_M = 5000;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

function routeUrl(stops: LatLng[], origin: LatLng | null) {
  if (!stops.length) return '#';
  const dest = stops[stops.length - 1];
  const p = new URLSearchParams({ api: '1', destination: `${dest.lat},${dest.lng}`, travelmode: 'walking' });
  if (origin) p.set('origin', `${origin.lat},${origin.lng}`);
  if (stops.length > 1) p.set('waypoints', stops.slice(0, -1).map((s) => `${s.lat},${s.lng}`).join('|'));
  return `https://www.google.com/maps/dir/?${p}`;
}

export function HomeScreen() {
  const { profile, missions, achievements, contentLoading, refreshContent, distanceTo, unreadCount, setTab, position } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const [trail, setTrail] = useState<Achievement | null>(null);
  const [mission, setMission] = useState<Mission | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const level = getUserLevelInfo(profile?.points ?? 0);
  const checkins = profile?.checkins ?? [];

  const list = useMemo(() => {
    const withDist = missions.map((m) => ({ m, d: distanceTo(m) }));
    let res = withDist;
    if (filter === 'near') res = withDist.filter((x) => x.d == null || x.d <= NEAR_RADIUS_M);
    else if (filter !== 'all') res = withDist.filter((x) => x.m.category === filter);
    return res.sort((a, b) => {
      const doneA = checkins.includes(a.m.id) ? 1 : 0;
      const doneB = checkins.includes(b.m.id) ? 1 : 0;
      if (doneA !== doneB) return doneA - doneB;
      return (a.d ?? Infinity) - (b.d ?? Infinity);
    });
  }, [missions, filter, distanceTo, checkins]);

  const trails = useMemo(
    () =>
      achievements
        .filter((a) => filter === 'all' || filter === 'near' || a.requiredMissions.some((id) => missions.find((m) => m.id === id)?.category === filter))
        .map((a) => {
          const stops = a.requiredMissions.map((id) => missions.find((m) => m.id === id)).filter(Boolean) as Mission[];
          const pending = stops.filter((s) => !checkins.includes(s.id));
          const nearest = pending.map((s) => distanceTo(s)).filter((x): x is number => x != null).sort((x, y) => x - y)[0] ?? null;
          return { a, stops, progress: achievementProgress(a, checkins), nearest };
        }),
    [achievements, missions, checkins, distanceTo, filter],
  );

  return (
    <PullToRefresh onRefresh={refreshContent}>
      <header className="flex items-center gap-3 px-5 pt-safe pb-4">
        <button onClick={() => setTab('profile')} aria-label="Abrir perfil">
          <Avatar src={profile?.avatarUrl} name={profile?.name} points={profile?.points ?? 0} size={52} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">{greeting()},</p>
          <h1 className="truncate text-xl font-bold">{profile?.name.split(' ')[0] ?? 'Explorador'} 👋</h1>
        </div>
        <button onClick={() => setNotifOpen(true)} className="relative flex size-11 items-center justify-center rounded-2xl bg-white shadow-card" aria-label={`Notificações${unreadCount ? ` (${unreadCount} novas)` : ''}`}>
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white ring-2 ring-bg">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </header>

      {/* Card de nível */}
      <section className="mx-5 mb-5 overflow-hidden rounded-[28px] bg-ink p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs tracking-wide text-white/60 uppercase">Nível {level.levelNum}</p>
            <h2 className="mt-0.5 text-xl font-semibold">{level.title}</h2>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-sm font-bold text-ink">
            <Sparkles className="size-4" /> {level.currentPontos.toLocaleString('pt-BR')}
          </div>
        </div>
        <ProgressBar percent={level.progressPercent} className="mt-4 bg-white/15" color="var(--color-accent)" />
        <p className="mt-2 text-xs text-white/60">
          {level.nextTierRequiredPontos != null
            ? `Faltam ${(level.nextTierRequiredPontos - level.currentPontos).toLocaleString('pt-BR')} pts para ${level.nextTierTitle}`
            : 'Nível máximo alcançado. Você é uma lenda!'}
        </p>
      </section>

      {/* Filtros */}
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto px-5" role="tablist">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          const meta = f.id in CATEGORY_META ? CATEGORY_META[f.id as MissionCategory] : null;
          return (
            <button
              key={f.id}
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.id)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold transition',
                active ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink',
              )}
            >
              {f.id === 'near' && <Navigation className="size-3.5" />}
              {meta && <meta.icon className="size-3.5" style={{ color: active ? undefined : meta.color }} />}
              {f.label}
            </button>
          );
        })}
      </div>

      {contentLoading && !missions.length ? (
        <div className="flex justify-center py-16">
          <Spinner className="size-7 text-primary" />
        </div>
      ) : (
        <>
          {trails.length > 0 && (
            <section className="mb-7">
              <SectionTitle title="Trilhas" />
              <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2">
                {trails.map(({ a, stops, progress, nearest }) => {
                  const Icon = ACHIEVEMENT_ICONS[a.icon] ?? Sparkles;
                  const complete = progress.percent === 100;
                  return (
                    <motion.button key={a.id} whileTap={{ scale: 0.98 }} onClick={() => setTrail(a)} className="w-[78%] max-w-[300px] shrink-0 snap-start overflow-hidden rounded-[28px] bg-white text-left shadow-card">
                      <div className="relative h-28">
                        {a.bannerUrl ? (
                          <img src={a.bannerUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <div className="flex size-full">
                            {stops.slice(0, 4).map((s) => (
                              <MissionImage key={s.id} src={s.image} category={s.category} className="h-full flex-1" iconSize="size-6" />
                            ))}
                          </div>
                        )}
                        <div className="absolute top-3 left-3 flex size-10 items-center justify-center rounded-2xl bg-white/95 shadow-card">
                          <Icon className="size-5 text-primary" />
                        </div>
                        <span className="absolute top-3 right-3 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-bold text-accent backdrop-blur">+{a.rewardPoints} bônus</span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-display text-lg font-semibold">{a.title}</h3>
                        <div className="mt-1 flex items-center justify-between text-xs text-muted">
                          <span>{progress.done}/{progress.total} locais</span>
                          <span className="inline-flex items-center gap-1">
                            {complete ? <><CheckCircle2 className="size-3.5 text-success" /> Concluída</> : <><MapPin className="size-3.5" /> {formatDistance(nearest)}</>}
                          </span>
                        </div>
                        <ProgressBar percent={progress.percent} className="mt-2.5" color={complete ? 'var(--color-success)' : undefined} />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </section>
          )}

          <section className="pb-32">
            <SectionTitle title="Missões" action={<span className="text-sm text-muted">{list.length} locais</span>} />
            <div className="space-y-3 px-5">
              {list.map(({ m, d }) => (
                <MissionCard key={m.id} mission={m} distance={d} done={checkins.includes(m.id)} onClick={() => setMission(m)} />
              ))}
              {!list.length && <EmptyState icon={Search} title="Nada por aqui" text={filter === 'near' ? 'Nenhum local em até 5 km de você.' : 'Nenhuma missão nesta categoria ainda.'} />}
            </div>
          </section>
        </>
      )}

      <TrailSheet trail={trail} onClose={() => setTrail(null)} onSelect={(m) => { setTrail(null); setMission(m); }} origin={position} />
      <MissionSheet mission={mission} onClose={() => setMission(null)} />
      <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} />
    </PullToRefresh>
  );
}

function TrailSheet({ trail, onClose, onSelect, origin }: { trail: Achievement | null; onClose: () => void; onSelect: (m: Mission) => void; origin: LatLng | null }) {
  const { missions, profile, distanceTo, openCheckin } = useApp();
  const checkins = profile?.checkins ?? [];
  const stops = trail ? (trail.requiredMissions.map((id) => missions.find((m) => m.id === id)).filter(Boolean) as Mission[]) : [];
  const pending = stops.filter((s) => !checkins.includes(s.id)).sort((a, b) => (distanceTo(a) ?? Infinity) - (distanceTo(b) ?? Infinity));
  const progress = trail ? achievementProgress(trail, checkins) : null;
  const Icon = trail ? ACHIEVEMENT_ICONS[trail.icon] ?? Sparkles : Sparkles;

  return (
    <BottomSheet
      open={!!trail}
      onClose={onClose}
      title={
        trail && (
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
              <Icon className="size-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{trail.title}</h2>
              <p className="text-sm text-muted">
                {progress?.done}/{progress?.total} concluídos · +{trail.rewardPoints} pts ao completar
              </p>
            </div>
          </div>
        )
      }
      footer={
        pending.length > 0 && (
          <div className="flex gap-3">
            <a href={routeUrl(pending, origin)} target="_blank" rel="noreferrer" className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-line font-semibold">
              <Navigation className="size-4" /> Traçar rota
            </a>
            <Button
              className="flex-[1.4]"
              onClick={() => {
                onClose();
                openCheckin(pending[0].id);
              }}
            >
              <Camera className="size-5" /> Ir ao check-in
            </Button>
          </div>
        )
      }
    >
      {trail && (
        <div className="px-5 pb-4">
          <p className="mb-4 text-muted">{trail.description}</p>
          {progress && <ProgressBar percent={progress.percent} className="mb-5" color={progress.percent === 100 ? 'var(--color-success)' : undefined} />}
          <ol className="relative space-y-3">
            {stops.map((s, i) => {
              const done = checkins.includes(s.id);
              return (
                <li key={s.id}>
                  <button onClick={() => onSelect(s)} className="flex w-full items-center gap-3 rounded-[20px] border border-line/70 bg-white p-2.5 text-left">
                    <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold', done ? 'bg-success text-white' : 'bg-secondary text-primary-dark')}>
                      {done ? <CheckCircle2 className="size-5" /> : i + 1}
                    </div>
                    <MissionImage src={s.image} category={s.category} className="size-12 rounded-xl" iconSize="size-5" />
                    <div className="min-w-0 flex-1">
                      <p className={cn('truncate font-semibold', done && 'text-muted line-through')}>{s.title}</p>
                      <p className="text-xs text-muted">{formatDistance(distanceTo(s))} · {s.points} pts</p>
                    </div>
                    <ChevronRight className="size-4 text-muted" />
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </BottomSheet>
  );
}

function NotificationsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { notifications, backend, setTab } = useApp();

  useEffect(() => {
    if (!open) return;
    const unread = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unread.length) {
      const t = setTimeout(() => backend.markNotificationsRead(unread).catch(() => undefined), 1200);
      return () => clearTimeout(t);
    }
  }, [open, notifications, backend]);

  const label = { like: 'curtiu sua publicação', comment: 'comentou na sua publicação', friend_request: 'enviou uma solicitação de amizade' } as const;
  const icon = { like: Heart, comment: MessageCircle, friend_request: UserPlus } as const;

  return (
    <BottomSheet open={open} onClose={onClose} title="Notificações">
      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="Tudo em dia" text="Curtidas, comentários e convites aparecem aqui." />
      ) : (
        <ul className="px-3 pb-6">
          {notifications.map((n) => {
            const I = icon[n.type];
            return (
              <li key={n.id}>
                <button
                  className={cn('flex w-full items-center gap-3 rounded-2xl p-3 text-left', !n.read && 'bg-secondary')}
                  onClick={() => {
                    onClose();
                    setTab(n.type === 'friend_request' ? 'social' : 'feed');
                  }}
                >
                  <div className="relative">
                    <Avatar src={n.sourceUserAvatar} name={n.sourceUserName} size={44} ring={false} />
                    <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-primary ring-2 ring-white">
                      <I className="size-3 text-white" />
                    </span>
                  </div>
                  <p className="flex-1 text-sm">
                    <strong>{n.sourceUserName}</strong> {label[n.type]}
                    <span className="block text-xs text-muted">{timeAgo(n.createdAt)}</span>
                  </p>
                  {!n.read && <span className="size-2 rounded-full bg-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </BottomSheet>
  );
}
