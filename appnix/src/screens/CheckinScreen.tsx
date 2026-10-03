import confetti from 'canvas-confetti';
import { ArrowLeft, Camera, CheckCircle2, ChevronDown, ImagePlus, Lock, MapPin, Navigation, RefreshCw, Sparkles, Trophy, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { BottomSheet, PORTAL_ID } from '../components/BottomSheet';
import { Button, CATEGORY_META, MissionImage, PointsPill, Spinner, Stars, cn } from '../components/ui';
import { useApp } from '../hooks/useApp';
import { friendlyError } from '../lib/errors';
import { CHECKIN_RADIUS_METERS, formatDistance, haversineDistance } from '../lib/geo';
import { reverseGeocode } from '../lib/geocode';
import { downscaleDataUrl } from '../lib/image';
import { getUserLevelInfo } from '../lib/levels';
import { getCurrentPosition, takePhoto, type Position } from '../lib/native';
import { missionPoints } from '../services/rules';
import type { CheckinResult, Mission } from '../services/types';

const RATING_LABELS = ['', 'Não curti', 'Poderia ser melhor', 'Legal', 'Muito bom', 'Incrível!'];

export function CheckinScreen() {
  const { missions, profile, position: watchedPos, checkinMissionId, backend, toast, setTab } = useApp();
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
    setLocating(true);
    try {
      setPos(await getCurrentPosition());
    } catch (e) {
      toast(friendlyError(e) || 'Não foi possível obter sua localização.', 'error');
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    if (!pos) locate();
  }, []);

  // endereço atual (geocoding reverso), com throttle por ~50 m
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
  const canSubmit = !!mission && !alreadyDone && inRange && rating > 0 && !submitting && !!profile && (!!pos || demoSimulated);

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
    <div className="h-full overflow-y-auto no-scrollbar">
      <header className="flex items-center gap-3 px-5 pt-safe pb-4">
        <button onClick={() => setTab('home')} className="flex size-11 items-center justify-center rounded-2xl bg-white shadow-card" aria-label="Voltar">
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Check-in</h1>
          <p className="text-sm text-muted">Registre sua visita e ganhe pontos</p>
        </div>
      </header>

      <div className="space-y-4 px-5 pb-36">
        {/* Localização */}
        <section className="flex items-center gap-3 rounded-[24px] bg-white p-4 shadow-card">
          <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-2xl', pos ? 'bg-[#E6F9F1]' : 'bg-secondary')}>
            {locating ? <Spinner className="size-5 text-primary" /> : <Navigation className={cn('size-5', pos ? 'text-success' : 'text-primary')} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted">{pos ? `Sua localização · ±${Math.round(pos.accuracy)} m` : 'Localização'}</p>
            <p className="truncate text-sm font-semibold">{pos ? address ?? `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}` : locating ? 'Obtendo GPS…' : 'GPS indisponível'}</p>
          </div>
          <button onClick={locate} disabled={locating} className="rounded-full p-2 text-muted" aria-label="Atualizar localização">
            <RefreshCw className={cn('size-5', locating && 'animate-spin')} />
          </button>
        </section>

        {/* Local */}
        <section>
          <button onClick={() => setPicker(true)} className="w-full overflow-hidden rounded-[28px] bg-white text-left shadow-card">
            {mission ? (
              <>
                <div className="relative">
                  <MissionImage src={mission.image} category={mission.category} className="h-36 w-full" iconSize="size-12" />
                  <PointsPill points={mission.points} double={mission.isDoublePoints} className="absolute top-3 right-3" />
                </div>
                <div className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: CATEGORY_META[mission.category].color }}>
                      {CATEGORY_META[mission.category].label}
                    </p>
                    <h2 className="truncate font-display text-xl font-semibold">{mission.title}</h2>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-medium text-primary-dark">
                    Trocar <ChevronDown className="size-4" />
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4 p-5">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary">
                  <MapPin className="size-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Selecione o local</p>
                  <p className="text-sm text-muted">{ranked.length ? 'Nenhum local detectado no raio. Toque para escolher.' : 'Você já visitou todos os locais! 🎉'}</p>
                </div>
                <ChevronDown className="size-5 text-muted" />
              </div>
            )}
          </button>

          {mission && (
            <div
              className={cn(
                'mt-2 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium',
                alreadyDone ? 'bg-bg text-muted' : inRange ? 'bg-[#E6F9F1] text-[#00875A]' : 'bg-[#FDE8E2] text-[#B9503B]',
              )}
            >
              {alreadyDone ? (
                <><CheckCircle2 className="size-4" /> Você já fez check-in aqui.</>
              ) : inRange ? (
                <><CheckCircle2 className="size-4" /> Você está no local {distance != null && !demoSimulated ? `(${formatDistance(distance)})` : ''}</>
              ) : (
                <><Lock className="size-4" /> {distance != null ? `Você está a ${formatDistance(distance)}. Aproxime-se até ${CHECKIN_RADIUS_METERS} m.` : 'Aguardando GPS para validar a distância.'}</>
              )}
            </div>
          )}
          {backend.mode === 'demo' && mission && !alreadyDone && (
            <label className="mt-2 flex items-center gap-2 px-1 text-xs text-muted">
              <input type="checkbox" checked={simulate} onChange={(e) => setSimulate(e.target.checked)} className="accent-[#E9A34D]" />
              Modo demo: simular que estou no local
            </label>
          )}
        </section>

        {/* Foto */}
        <section className="rounded-[28px] bg-white p-4 shadow-card">
          <h3 className="mb-3 font-semibold">Foto do momento</h3>
          {photo ? (
            <div className="relative overflow-hidden rounded-[20px]">
              <img src={photo} alt="Prévia da foto" className="aspect-[4/3] w-full object-cover" />
              <button onClick={() => setPhoto(null)} className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur" aria-label="Remover foto">
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => capture('camera')} className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-[#F0D9BD] bg-secondary text-sm font-semibold text-primary-dark">
                <Camera className="size-7" /> Câmera
              </button>
              <button onClick={() => capture('gallery')} className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-line bg-bg text-sm font-semibold text-muted">
                <ImagePlus className="size-7" /> Galeria
              </button>
            </div>
          )}
        </section>

        {/* Avaliação */}
        <section className="rounded-[28px] bg-white p-4 shadow-card">
          <h3 className="font-semibold">Como foi a experiência?</h3>
          <div className="mt-2 flex items-center justify-between">
            <Stars value={rating} onChange={setRating} size={30} />
            <span className="text-sm font-medium text-muted">{RATING_LABELS[rating]}</span>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={280}
            rows={3}
            placeholder="Deixe uma dica para outros exploradores…"
            className="mt-3 w-full resize-none rounded-2xl border border-line bg-bg p-3.5 text-sm outline-none focus:border-primary"
          />
          <p className="text-right text-xs text-muted">{comment.length}/280</p>
        </section>

        <Button className="h-14 w-full text-base" disabled={!canSubmit} loading={submitting} onClick={submit}>
          <Sparkles className="size-5" />
          {mission ? `Confirmar check-in · +${missionPoints(mission)} pts` : 'Confirmar check-in'}
        </Button>
        {mission && !rating && inRange && !alreadyDone && <p className="-mt-2 text-center text-xs text-muted">Dê uma nota de 1 a 5 estrelas para continuar.</p>}
      </div>

      <BottomSheet open={picker} onClose={() => setPicker(false)} title="Escolha o local">
        <ul className="space-y-2 px-5 pb-6">
          {ranked.map(({ m, d }) => {
            const ok = d != null && d <= CHECKIN_RADIUS_METERS;
            return (
              <li key={m.id}>
                <button
                  onClick={() => {
                    setMissionId(m.id);
                    setPicker(false);
                  }}
                  className={cn('flex w-full items-center gap-3 rounded-[20px] border p-2.5 text-left', m.id === missionId ? 'border-primary bg-secondary' : 'border-line/70')}
                >
                  <MissionImage src={m.image} category={m.category} className="size-12 rounded-xl" iconSize="size-5" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{m.title}</p>
                    <p className="text-xs text-muted">{formatDistance(d)} · {missionPoints(m)} pts</p>
                  </div>
                  {ok && <span className="rounded-full bg-[#E6F9F1] px-2 py-1 text-[11px] font-semibold text-[#00875A]">No raio</span>}
                </button>
              </li>
            );
          })}
          {!ranked.length && <p className="py-8 text-center text-sm text-muted">Nenhum local pendente.</p>}
        </ul>
      </BottomSheet>

      <AnimatePresence>{result && profile && <SuccessOverlay result={result.r} mission={result.mission} onClose={(to) => { setResult(null); setTab(to); }} />}</AnimatePresence>
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
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="flex size-24 items-center justify-center rounded-[32px] bg-success shadow-[0_20px_40px_-12px_rgb(0_208_132/0.7)]">
        <CheckCircle2 className="size-12 text-white" />
      </motion.div>
      <h2 className="mt-6 text-3xl font-bold tracking-tight">Check-in feito!</h2>
      <p className="mt-1 text-muted">{mission.title}</p>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="mt-6 flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-display text-2xl font-bold">
        <Sparkles className="size-6" /> +{result.pointsEarned + result.bonusPoints} pts
      </motion.div>
      {result.completedAchievements.map((a) => (
        <motion.div key={a.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }} className="mt-4 flex items-center gap-3 rounded-[20px] bg-ink px-4 py-3 text-left text-white">
          <Trophy className="size-6 text-accent" />
          <div>
            <p className="text-xs text-white/60">Trilha concluída · +{a.rewardPoints} bônus</p>
            <p className="font-semibold">{a.title}</p>
          </div>
        </motion.div>
      ))}
      {result.leveledUp && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-4 text-sm font-semibold text-primary-dark">
          🎉 Novo nível {level.levelNum}: {level.title}
        </motion.p>
      )}
      <p className="mt-4 text-sm text-muted">Total: {result.newTotal.toLocaleString('pt-BR')} pts · publicado no Feed</p>
      <div className="mt-8 flex w-full gap-3">
        <Button variant="secondary" className="flex-1 bg-white" onClick={() => onClose('home')}>
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
