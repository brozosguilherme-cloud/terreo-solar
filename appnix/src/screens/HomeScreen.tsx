import { Bell, Camera, CheckCircle2, ChevronRight, Heart, MapPin, MessageCircle, Navigation, Search, Sparkles, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { MissionCard, MissionCardSkeleton } from '../components/MissionCard';
import { MissionSheet } from '../components/MissionSheet';
import { PullToRefresh } from '../components/PullToRefresh';
import {
  ACHIEVEMENT_ICONS,
  Avatar,
  Button,
  CATEGORY_META,
  Chip,
  EmptyState,
  IconButton,
  LinkButton,
  Meta,
  MissionImage,
  PointsPill,
  ProgressBar,
  SectionHeader,
  Skeleton,
  cn,
} from '../components/ui';
import { useApp } from '../hooks/useApp';
import { formatDistance, type LatLng } from '../lib/geo';
import { getUserLevelInfo } from '../lib/levels';
import { formatPoints, timeAgo } from '../lib/time';
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

/** Categoria predominante da trilha (define a cor do banner). */
function dominantCategory(stops: Mission[]): MissionCategory {
  const count: Record<string, number> = {};
  stops.forEach((s) => (count[s.category] = (count[s.category] ?? 0) + 1));
  return (Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] as MissionCategory) ?? 'turismo';
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
      const doneDiff = Number(checkins.includes(a.m.id)) - Number(checkins.includes(b.m.id));
      return doneDiff || (a.d ?? Infinity) - (b.d ?? Infinity);
    });
  }, [missions, filter, distanceTo, checkins]);

  const trails = useMemo(
    () =>
      achievements
        .map((a) => {
          const stops = a.requiredMissions.map((id) => missions.find((m) => m.id === id)).filter(Boolean) as Mission[];
          const pending = stops.filter((s) => !checkins.includes(s.id));
          const nearest = pending.map((s) => distanceTo(s)).filter((x): x is number => x != null).sort((x, y) => x - y)[0] ?? null;
          return { a, stops, category: dominantCategory(stops), progress: achievementProgress(a, checkins), nearest };
        })
        .filter((t) => filter === 'all' || filter === 'near' || t.stops.some((s) => s.category === filter)),
    [achievements, missions, checkins, distanceTo, filter],
  );

  const loading = contentLoading && !missions.length;
  const firstName = profile?.name.split(' ')[0] ?? 'Explorador';

  return (
    <PullToRefresh onRefresh={refreshContent}>
      {/* Cabeçalho */}
      <header className="flex items-center gap-3 px-gutter pt-safe pb-5">
        <button onClick={() => setTab('profile')} aria-label="Abrir perfil" className="rounded-full">
          <Avatar src={profile?.avatarUrl} name={profile?.name} points={profile?.points ?? 0} size={48} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="type-caption text-muted">{greeting()},</p>
          <h1 className="truncate type-title2">{firstName}</h1>
        </div>
        <IconButton icon={Bell} label={`Notificações${unreadCount ? ` (${unreadCount} novas)` : ''}`} badge={unreadCount} onClick={() => setNotifOpen(true)} />
      </header>

      {/* Progresso de nível */}
      <section className="mx-gutter rounded-card bg-ink p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="type-overline text-white/60">Nível {level.levelNum}</p>
            <h2 className="mt-1 truncate type-title2">{level.title}</h2>
          </div>
          <PointsPill points={level.currentPontos} />
        </div>
        <ProgressBar percent={level.progressPercent} tone="accent" className="mt-4 bg-white/15" />
        <p className="mt-2 type-caption text-white/70">
          {level.nextTierRequiredPontos != null
            ? `Faltam ${formatPoints(level.nextTierRequiredPontos - level.currentPontos)} pts para ${level.nextTierTitle}`
            : 'Nível máximo alcançado. Você é uma lenda!'}
        </p>
      </section>

      {/* Filtros */}
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto px-gutter" role="tablist" aria-label="Filtrar missões">
        {FILTERS.map((f) => {
          const meta = f.id in CATEGORY_META ? CATEGORY_META[f.id as MissionCategory] : null;
          return (
            <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)} icon={f.id === 'near' ? Navigation : meta?.icon} iconColor={meta?.color}>
              {f.label}
            </Chip>
          );
        })}
      </div>

      {/* Trilhas */}
      <section className="mt-section">
        <SectionHeader title="Trilhas" action={!loading && `${trails.length} roteiros`} />
        <div className="no-scrollbar flex snap-x snap-mandatory scroll-px-gutter gap-3 overflow-x-auto px-gutter pb-2">
          {loading
            ? [0, 1].map((i) => <Skeleton key={i} className="h-[196px] w-[272px] shrink-0 rounded-card" />)
            : trails.map(({ a, category, progress, nearest }) => {
                const Icon = ACHIEVEMENT_ICONS[a.icon] ?? Sparkles;
                const complete = progress.percent === 100;
                return (
                  <motion.button key={a.id} whileTap={{ scale: 0.98 }} onClick={() => setTrail(a)} className="w-[272px] shrink-0 snap-start overflow-hidden rounded-card bg-surface text-left shadow-card">
                    <div className="relative h-24" style={{ background: a.bannerUrl ? undefined : CATEGORY_META[category].gradient }}>
                      {a.bannerUrl ? (
                        <img src={a.bannerUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <>
                          <div className="absolute -right-4 -bottom-10 size-32 rounded-full bg-white/15" />
                          <Icon className="absolute right-5 bottom-4 size-12 text-white/90" strokeWidth={1.5} />
                        </>
                      )}
                      <span className="absolute top-3 left-3 rounded-full bg-ink/75 px-2.5 py-1 type-caption font-semibold text-accent backdrop-blur">+{a.rewardPoints} bônus</span>
                    </div>
                    <div className="p-card">
                      <h3 className="truncate type-title3">{a.title}</h3>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="type-caption text-muted">
                          <span className="type-number">{progress.done}/{progress.total}</span> locais
                        </span>
                        {complete ? (
                          <span className="inline-flex items-center gap-1 type-caption text-success-ink">
                            <CheckCircle2 className="size-3.5" /> Concluída
                          </span>
                        ) : (
                          <Meta icon={MapPin}>{formatDistance(nearest)}</Meta>
                        )}
                      </div>
                      <ProgressBar percent={progress.percent} tone={complete ? 'success' : 'primary'} className="mt-3" />
                    </div>
                  </motion.button>
                );
              })}
        </div>
      </section>

      {/* Missões */}
      <section className="mt-section pb-nav">
        <SectionHeader title="Missões" action={!loading && `${list.length} locais`} />
        <div className="space-y-3 px-gutter">
          {loading
            ? [0, 1, 2].map((i) => <MissionCardSkeleton key={i} />)
            : list.map(({ m, d }) => <MissionCard key={m.id} mission={m} distance={d} done={checkins.includes(m.id)} onClick={() => setMission(m)} />)}
          {!loading && !list.length && (
            <EmptyState icon={Search} title="Nada por aqui" text={filter === 'near' ? 'Nenhum local em até 5 km de você.' : 'Nenhuma missão nesta categoria ainda.'} />
          )}
        </div>
      </section>

      <TrailSheet
        trail={trail}
        onClose={() => setTrail(null)}
        onSelect={(m) => {
          setTrail(null);
          setMission(m);
        }}
        origin={position}
      />
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
            <div className="flex size-12 shrink-0 items-center justify-center rounded-control bg-secondary">
              <Icon className="size-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate type-title2">{trail.title}</h2>
              <p className="type-caption text-muted">
                {progress?.done} de {progress?.total} concluídos · +{trail.rewardPoints} pts ao completar
              </p>
            </div>
          </div>
        )
      }
      footer={
        pending.length > 0 && (
          <div className="flex gap-3">
            <LinkButton href={routeUrl(pending, origin)} className="flex-1">
              <Navigation /> Traçar rota
            </LinkButton>
            <Button
              className="flex-[1.4]"
              onClick={() => {
                onClose();
                openCheckin(pending[0].id);
              }}
            >
              <Camera /> Ir ao check-in
            </Button>
          </div>
        )
      }
    >
      {trail && progress && (
        <div className="px-gutter pb-6">
          <p className="type-body text-muted">{trail.description}</p>
          <ProgressBar percent={progress.percent} tone={progress.percent === 100 ? 'success' : 'primary'} className="mt-4" />
          <ol className="mt-5 space-y-2">
            {stops.map((s, i) => {
              const done = checkins.includes(s.id);
              return (
                <li key={s.id}>
                  <button onClick={() => onSelect(s)} className="flex w-full items-center gap-3 rounded-card border border-line-soft bg-surface p-2.5 text-left transition active:bg-bg">
                    <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-full type-caption font-semibold', done ? 'bg-success text-white' : 'bg-secondary text-primary-strong')}>
                      {done ? <CheckCircle2 className="size-4" /> : i + 1}
                    </span>
                    <MissionImage src={s.image} category={s.category} className="size-12 rounded-control" iconSize="size-5" decor={false} />
                    <div className="min-w-0 flex-1">
                      <p className={cn('truncate type-body-strong', done && 'text-muted line-through')}>{s.title}</p>
                      <p className="type-caption text-muted">
                        {formatDistance(distanceTo(s))} · {s.points} pts
                      </p>
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

  const label = { like: 'curtiu sua publicação', comment: 'comentou na sua publicação', friend_request: 'quer ser seu amigo' } as const;
  const icon = { like: Heart, comment: MessageCircle, friend_request: UserPlus } as const;

  return (
    <BottomSheet open={open} onClose={onClose} title="Notificações">
      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="Tudo em dia" text="Curtidas, comentários e convites aparecem aqui." />
      ) : (
        <ul className="space-y-1 px-3 pb-6">
          {notifications.map((n) => {
            const I = icon[n.type];
            return (
              <li key={n.id}>
                <button
                  className={cn('flex w-full items-center gap-3 rounded-control p-3 text-left transition active:bg-bg', !n.read && 'bg-secondary')}
                  onClick={() => {
                    onClose();
                    setTab(n.type === 'friend_request' ? 'social' : 'feed');
                  }}
                >
                  <div className="relative shrink-0">
                    <Avatar src={n.sourceUserAvatar} name={n.sourceUserName} size={40} ring={false} />
                    <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-primary ring-2 ring-surface">
                      <I className="size-3 text-white" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="type-callout">
                      <span className="font-semibold">{n.sourceUserName}</span> {label[n.type]}
                    </p>
                    <p className="type-caption text-muted">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="não lida" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </BottomSheet>
  );
}
