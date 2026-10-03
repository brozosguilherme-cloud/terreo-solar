import confetti from 'canvas-confetti';
import { ArrowLeft, Camera, CheckCircle2, ChevronDown, ImagePlus, Lock, MapPin, Navigation, RefreshCw, Sparkles, Trophy, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { BottomSheet, PORTAL_ID } from '../components/BottomSheet';
import { Button, IconButton, MissionImage, ScreenHeader, Spinner, Stars, StatusBanner, cn } from '../components/ui';
import { LocationBanner } from '../components/LocationPermission';
import { useApp } from '../hooks/useApp';
import { friendlyError } from '../lib/errors';
import { CHECKIN_RADIUS_METERS, formatDistance, haversineDistance } from '../lib/geo';
import { reverseGeocode } from '../lib/geocode';
import { downscaleDataUrl } from '../lib/image';
import { getUserLevelInfo } from '../lib/levels';
import { getCurrentPosition, LocationError, takePhoto, type Position } from '../lib/native';
import { formatPoints } from '../lib/time';
import { missionPoints } from '../services/rules';
import type { CheckinResult, Mission } from '../services/types';

const RATING_LABELS = ['Sem nota', 'Não curti', 'Poderia ser melhor', 'Legal', 'Muito bom', 'Incrível!'];

/** Etapa numerada do fluxo (1 Local · 2 Foto · 3 Avaliação). */
function Step({ n, title, optional, done, children }: { n: number; title: string; optional?: boolean; done: boolean; children: ReactNode }) {
  return (
    <section className="rounded-card bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-center gap-2.5">
        <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-full type-caption font-bold transition-colors', done ? 'bg-success text-white' : 'bg-secondary text-primary-strong')}>
          {done ? <CheckCircle2 className="size-4" /> : n}
        </span>
        <h2 className="type-title3">{title}</h2>
        {optional && <span className="type-caption text-muted">opcional</span>}
      </div>
      {children}
    </section>
  );
}

export function CheckinScreen() {
  const { missions, profile, position: watchedPos, checkinMissionId, backend, toast, setTab, locationStatus, setLocationSheetOpen, refreshLocationStatus } = useApp();
  const [pos, setPos] = useState<Position | null>(watchedPos);
  const [locating, setLocating] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [missionId, setMissionId] = useState<string | null>(checkinMissionId);
  const [picker, setPicker] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ r: CheckinResult; mission: Mission } | null>(null);
  const [simulate, setSimulate] = useState(false);

  useEffect(() => {
    if (watchedPos) setPos(watchedPos);
  }, [watchedPos]);

  useEffect(() => {
    if (checkinMissionId) setMissionId(checkinMissionId);
  }, [checkinMissionId]);

  const locate = async () => {
    if (locationStatus !== 'granted') {
      setLocationSheetOpen(true);
      return;
    }
    setLocating(true);
    try {
      setPos(await getCurrentPosition());
    } catch (e) {
      if (e instanceof LocationError && e.status !== 'granted') {
        await refreshLocationStatus();
        setLocationSheetOpen(true);
      } else toast(friendlyError(e) || 'Não foi possível obter sua localização.', 'error');
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    if (!pos && locationStatus === 'granted') locate();
  }, [locationStatus]);

  // endereço atual (geocoding reverso), com throttle por ~100 m
  const posKey = pos ? `${pos.lat.toFixed(3)},${pos.lng.toFixed(3)}` : null;
  useEffect(() => {
    if (!pos) return;
    let alive = true;
    reverseGeocode(pos).then((a) => alive && setAddress(a));
    return () => {
      alive = false;
    };
  }, [posKey]);

  const ranked = useMemo(() => {
    const done = new Set(profile?.checkins ?? []);
    return missions
      .filter((m) => !done.has(m.id))
      .map((m) => ({ m, d: pos ? haversineDistance(pos, m) : null }))
      .sort((a, b) => (a.d ?? Infinity) - (b.d ?? Infinity));
  }, [missions, pos, profile?.checkins]);

  // detecção automática do local mais próximo dentro do raio
  useEffect(() => {
    if (missionId || !ranked.length) return;
    const near = ranked.find((x) => x.d != null && x.d <= CHECKIN_RADIUS_METERS);
    if (near) setMissionId(near.m.id);
  }, [ranked, missionId]);

  const mission = missions.find((m) => m.id === missionId) ?? null;
  const alreadyDone = !!mission && !!profile?.checkins.includes(mission.id);
  const distance = mission && pos ? haversineDistance(pos, mission) : null;
  const demoSimulated = backend.mode === 'demo' && simulate;
  const inRange = demoSimulated || (distance != null && distance <= CHECKIN_RADIUS_METERS);
  const locationOk = !!mission && !alreadyDone && inRange && (!!pos || demoSimulated);

  // o que ainda falta — mostrado acima do botão para o usuário nunca ficar sem saber
  const blocker = !mission
    ? 'Escolha o local da visita'
    : alreadyDone
      ? 'Você já fez check-in aqui'
      : !locationOk
        ? distance != null
          ? `Aproxime-se: faltam ${formatDistance(Math.max(0, distance - CHECKIN_RADIUS_METERS))}`
          : 'Aguardando o GPS'
        : rating === 0
          ? 'Dê uma nota de 1 a 5 estrelas'
          : null;
  const canSubmit = !blocker && !submitting && !!profile;

  const capture = async (source: 'camera' | 'gallery') => {
    try {
      const p = await takePhoto(source);
      if (p) setPhoto(await downscaleDataUrl(p.dataUrl));
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  };

  const submit = async () => {
    if (!canSubmit || !mission || !profile) return;
    setSubmitting(true);
    try {
      const coords = demoSimulated ? { lat: mission.lat, lng: mission.lng } : { lat: pos!.lat, lng: pos!.lng };
      const r = await backend.performCheckin(profile, { mission, ...coords, photoDataUrl: photo, rating, comment });
      setResult({ r, mission });
      fireConfetti(r.leveledUp || r.completedAchievements.length > 0);
      setPhoto(null);
      setRating(0);
      setComment('');
      setMissionId(null);
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative h-full">
      <div className="h-full overflow-y-auto no-scrollbar">
        <ScreenHeader title="Check-in" subtitle="Registre sua visita e ganhe pontos" leading={<IconButton icon={ArrowLeft} label="Voltar" onClick={() => setTab('home')} />} />

        <div className="space-y-3 px-gutter pb-[230px]">
          {/* 1 · Local */}
          <Step n={1} title="Local" done={locationOk}>
            {locationStatus && locationStatus !== 'granted' ? (
              <LocationBanner className="mb-4 shadow-none" />
            ) : (
            <div className="mb-4 flex items-center gap-3 rounded-control bg-bg px-3 py-2.5">
              {locating ? <Spinner className="size-4 text-primary" /> : <Navigation className={cn('size-4 shrink-0', pos ? 'text-success' : 'text-muted')} />}
              <div className="min-w-0 flex-1">
                <p className="truncate type-label">{pos ? address ?? `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}` : locating ? 'Obtendo sua localização…' : 'GPS indisponível'}</p>
                {pos && <p className="type-caption text-muted">Precisão de ±{Math.round(pos.accuracy)} m</p>}
              </div>
              <button onClick={locate} disabled={locating} className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition active:bg-surface-muted" aria-label="Atualizar localização">
                <RefreshCw className={cn('size-4', locating && 'animate-spin')} />
              </button>
            </div>
            )}

            <button onClick={() => setPicker(true)} className="flex w-full items-center gap-4 rounded-control border border-line/50 p-3 text-left transition-all active:scale-[0.98]">
              {mission ? (
                <>
                  <MissionImage src={mission.image} category={mission.category} className="size-14 shrink-0 rounded-control" iconSize="size-6" decor={false} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate type-title3">{mission.title}</p>
                    <p className="type-caption text-muted">+{missionPoints(mission)} pts</p>
                  </div>
                </>
              ) : (
                <>
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-control bg-secondary">
                    <MapPin className="size-6 text-primary" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="type-body-strong">Selecionar local</p>
                    <p className="type-caption text-muted">{ranked.length ? 'Nenhum local detectado no raio' : 'Você visitou todos os locais! 🎉'}</p>
                  </div>
                </>
              )}
              <span className="flex items-center gap-0.5 type-label text-primary-strong">
                {mission ? 'Trocar' : 'Escolher'} <ChevronDown className="size-4" />
              </span>
            </button>

            {mission &&
              (alreadyDone ? (
                <StatusBanner tone="neutral" icon={CheckCircle2} className="mt-3">Você já fez check-in aqui.</StatusBanner>
              ) : inRange ? (
                <StatusBanner tone="success" icon={CheckCircle2} className="mt-3">
                  Você está no local{distance != null && !demoSimulated ? ` (${formatDistance(distance)})` : ''}.
                </StatusBanner>
              ) : (
                <StatusBanner tone="danger" icon={Lock} className="mt-3">
                  {distance != null ? `Você está a ${formatDistance(distance)}. O check-in libera a até ${CHECKIN_RADIUS_METERS} m.` : 'Aguardando o GPS para validar a distância.'}
                </StatusBanner>
              ))}
            {backend.mode === 'demo' && mission && !alreadyDone && (
              <label className="mt-3 flex items-center gap-2 type-caption text-muted">
                <input type="checkbox" checked={simulate} onChange={(e) => setSimulate(e.target.checked)} className="size-4 accent-[var(--color-primary)]" />
                Modo demo: simular que estou no local
              </label>
            )}
          </Step>

          {/* 2 · Foto */}
          <Step n={2} title="Foto do momento" optional done={!!photo}>
            {photo ? (
              <div className="relative overflow-hidden rounded-control">
                <img src={photo} alt="Prévia da foto" className="aspect-[4/3] w-full object-cover" />
                <button onClick={() => setPhoto(null)} className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur" aria-label="Remover foto">
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => capture('camera')} className="flex h-28 flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-primary/40 bg-secondary type-label text-primary-strong transition-all active:scale-95">
                  <Camera className="size-6" /> Câmera
                </button>
                <button onClick={() => capture('gallery')} className="flex h-28 flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-line bg-bg type-label text-muted transition-all active:scale-95">
                  <ImagePlus className="size-6" /> Galeria
                </button>
              </div>
            )}
          </Step>

          {/* 3 · Avaliação */}
          <Step n={3} title="Como foi?" done={rating > 0}>
            <div className="flex items-center justify-between gap-2">
              <Stars value={rating} onChange={setRating} size={28} />
              <span className={cn('whitespace-nowrap type-label', rating ? 'text-ink' : 'text-muted')}>{RATING_LABELS[rating]}</span>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={280}
              rows={3}
              placeholder="Deixe uma dica para outros exploradores (opcional)"
              className="mt-4 w-full resize-none rounded-control border border-line/80 bg-bg p-4 type-callout outline-none focus:border-primary"
            />
            <p className="text-right type-caption text-muted">{comment.length}/280</p>
          </Step>
        </div>
      </div>

      {/* CTA fixo acima da navegação */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[100px] z-30">
        <div className="h-6 bg-gradient-to-t from-bg to-transparent" />
        <div className="pointer-events-auto bg-bg px-gutter pb-3">
          <p className={cn('mb-2 text-center type-caption', blocker ? 'text-muted' : 'text-success-ink')}>{blocker ?? 'Tudo pronto!'}</p>
          <Button className="w-full" disabled={!canSubmit} loading={submitting} onClick={submit}>
            <Sparkles />
            {mission && !alreadyDone ? `Confirmar check-in · +${missionPoints(mission)} pts` : 'Confirmar check-in'}
          </Button>
        </div>
      </div>

      <BottomSheet open={picker} onClose={() => setPicker(false)} title="Escolha o local">
        <ul className="space-y-2 px-gutter pb-6">
          {ranked.map(({ m, d }) => {
            const ok = d != null && d <= CHECKIN_RADIUS_METERS;
            return (
              <li key={m.id}>
                <button
                  onClick={() => {
                    setMissionId(m.id);
                    setPicker(false);
                  }}
                  className={cn('flex w-full items-center gap-3 rounded-card border p-2.5 text-left transition', m.id === missionId ? 'border-primary bg-secondary' : 'border-line-soft active:bg-bg')}
                >
                  <MissionImage src={m.image} category={m.category} className="size-12 rounded-control" iconSize="size-5" decor={false} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate type-body-strong">{m.title}</p>
                    <p className="type-caption text-muted">
                      {formatDistance(d)} · {missionPoints(m)} pts
                    </p>
                  </div>
                  {ok && <span className="rounded-full bg-success-soft px-2 py-1 type-caption font-semibold text-success-ink">No raio</span>}
                </button>
              </li>
            );
          })}
          {!ranked.length && <p className="py-8 text-center type-callout text-muted">Nenhum local pendente.</p>}
        </ul>
      </BottomSheet>

      <AnimatePresence>
        {result && profile && (
          <SuccessOverlay
            result={result.r}
            mission={result.mission}
            onClose={(to) => {
              setResult(null);
              setTab(to);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function fireConfetti(big: boolean) {
  const colors = ['#E9A34D', '#FFD166', '#00D084', '#FFF6EE', '#222222'];
  confetti({ particleCount: big ? 160 : 100, spread: 80, origin: { y: 0.65 }, colors, disableForReducedMotion: true });
  if (big) {
    setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors, disableForReducedMotion: true }), 250);
    setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors, disableForReducedMotion: true }), 400);
  }
}

function SuccessOverlay({ result, mission, onClose }: { result: CheckinResult; mission: Mission; onClose: (to: 'feed' | 'home') => void }) {
  const level = getUserLevelInfo(result.newTotal);
  const overlay = (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-auto absolute inset-0 z-50 flex flex-col items-center justify-center bg-secondary/95 px-8 text-center backdrop-blur">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="flex size-24 items-center justify-center rounded-sheet bg-success shadow-[0_20px_40px_-12px_rgb(0_208_132/0.7)]">
        <CheckCircle2 className="size-12 text-white" />
      </motion.div>
      <h2 className="mt-6 type-display">Check-in feito!</h2>
      <p className="mt-1 type-body text-muted">{mission.title}</p>
      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="mt-6 flex items-center gap-2 rounded-full bg-accent px-6 py-3 type-title2 type-number">
        <Sparkles className="size-6" /> +{result.pointsEarned + result.bonusPoints} pts
      </motion.div>
      {result.completedAchievements.map((a) => (
        <motion.div key={a.id} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }} className="mt-4 flex items-center gap-3 rounded-card bg-ink px-4 py-3 text-left text-white">
          <Trophy className="size-6 shrink-0 text-accent" />
          <div>
            <p className="type-caption text-white/60">Trilha concluída · +{a.rewardPoints} bônus</p>
            <p className="type-body-strong">{a.title}</p>
          </div>
        </motion.div>
      ))}
      {result.leveledUp && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-4 type-label text-primary-strong">
          🎉 Novo nível {level.levelNum}: {level.title}
        </motion.p>
      )}
      <p className="mt-4 type-callout text-muted">Total: {formatPoints(result.newTotal)} pts · publicado no Feed</p>
      <div className="mt-8 flex w-full gap-3">
        <Button variant="secondary" className="flex-1" onClick={() => onClose('home')}>
          Início
        </Button>
        <Button className="flex-1" onClick={() => onClose('feed')}>
          Ver no Feed
        </Button>
      </div>
    </motion.div>
  );
  const host = document.getElementById(PORTAL_ID);
  return host ? createPortal(overlay, host) : overlay;
}
