import { Check, Crown, Search, Trophy, UserCheck, UserMinus, UserPlus, Users, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PullToRefresh } from '../components/PullToRefresh';
import { Avatar, EmptyState, LevelBadge, Spinner, cn } from '../components/ui';
import { useApp } from '../hooks/useApp';
import { friendlyError } from '../lib/errors';
import { getUserLevelInfo } from '../lib/levels';
import { formatPoints } from '../lib/time';
import type { Friendship, RankingEntry } from '../services/types';

type SocialTab = 'ranking' | 'friends';

export function SocialScreen() {
  const [tab, setTab] = useState<SocialTab>('ranking');
  const [period, setPeriod] = useState<'weekly' | 'all'>('weekly');
  const [ranking, setRanking] = useState<RankingEntry[] | null>(null);
  const { backend, toast } = useApp();

  const loadRanking = useCallback(async () => {
    try {
      setRanking(await backend.getRanking(period));
    } catch (e) {
      setRanking([]);
      toast(friendlyError(e), 'error');
    }
  }, [backend, period, toast]);

  useEffect(() => {
    setRanking(null);
    loadRanking();
  }, [loadRanking]);

  return (
    <PullToRefresh onRefresh={loadRanking}>
      <header className="px-5 pt-safe pb-4">
        <h1 className="text-[28px] font-bold tracking-tight">Comunidade</h1>
        <p className="text-sm text-muted">Dispute o topo com outros exploradores</p>
      </header>

      <div className="relative mx-5 mb-5 grid grid-cols-2 rounded-2xl bg-[#F1ECE6] p-1" role="tablist">
        {(['ranking', 'friends'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn('relative flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold', tab === t ? 'text-ink' : 'text-muted')}>
            {tab === t && <motion.div layoutId="social-tab" className="absolute inset-0 rounded-xl bg-white shadow-card" />}
            <span className="relative flex items-center gap-1.5">
              {t === 'ranking' ? <Trophy className="size-4" /> : <Users className="size-4" />}
              {t === 'ranking' ? 'Ranking' : 'Amigos'}
            </span>
          </button>
        ))}
      </div>

      {tab === 'ranking' ? <Ranking ranking={ranking} period={period} setPeriod={setPeriod} /> : <Friends />}
    </PullToRefresh>
  );
}

const PODIUM = [
  { place: 2, color: '#C0C7D0', bg: 'linear-gradient(180deg,#EEF1F4,#D9DEE4)', h: 'h-24', label: 'Prata' },
  { place: 1, color: '#FFD166', bg: 'linear-gradient(180deg,#FFF1C7,#FFD166)', h: 'h-32', label: 'Ouro' },
  { place: 3, color: '#D79A6B', bg: 'linear-gradient(180deg,#F8E2D1,#E4B48E)', h: 'h-20', label: 'Bronze' },
];

function Ranking({ ranking, period, setPeriod }: { ranking: RankingEntry[] | null; period: 'weekly' | 'all'; setPeriod: (p: 'weekly' | 'all') => void }) {
  const { profile } = useApp();
  const myPos = useMemo(() => (ranking && profile ? ranking.findIndex((r) => r.userId === profile.id) : -1), [ranking, profile]);

  return (
    <div className="pb-32">
      <div className="mb-4 flex justify-center gap-2">
        {(['weekly', 'all'] as const).map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={cn('rounded-full px-4 py-2 text-sm font-semibold', period === p ? 'bg-ink text-white' : 'bg-white text-muted shadow-card')}>
            {p === 'weekly' ? 'Esta semana' : 'Geral'}
          </button>
        ))}
      </div>

      {!ranking ? (
        <div className="flex justify-center py-16">
          <Spinner className="size-7 text-primary" />
        </div>
      ) : ranking.length === 0 ? (
        <EmptyState icon={Trophy} title="Ranking vazio" text={period === 'weekly' ? 'Ninguém fez check-in esta semana. Seja o primeiro!' : 'Faça check-ins para aparecer aqui.'} />
      ) : (
        <>
          {/* Pódio */}
          <div className="mx-5 mb-5 flex items-end justify-center gap-3 rounded-[32px] bg-secondary px-3 pt-8">
            {PODIUM.map(({ place, color, bg, h, label }) => {
              const r = ranking[place - 1];
              if (!r) return <div key={place} className="flex-1" />;
              return (
                <motion.div key={place} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: place * 0.08 }} className="flex flex-1 flex-col items-center">
                  {place === 1 && <Crown className="mb-1 size-7 fill-accent text-[#E9A34D]" />}
                  <div className="rounded-full p-1" style={{ background: color }}>
                    <Avatar src={r.avatarUrl} name={r.name} size={place === 1 ? 72 : 58} ring={false} />
                  </div>
                  <p className="mt-2 w-full truncate text-center text-sm font-semibold">{r.name.split(' ')[0]}</p>
                  <p className="text-xs font-bold text-primary-dark">{formatPoints(r.points)} pts</p>
                  <div className={cn('mt-2 flex w-full flex-col items-center justify-start rounded-t-[20px] pt-3', h)} style={{ background: bg }}>
                    <span className="font-display text-3xl font-bold text-ink/80">{place}</span>
                    <span className="text-[10px] font-semibold tracking-wide text-ink/60 uppercase">{label}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* posição própria fixada quando fica fora do top 10 visível */}
          {myPos >= 10 && (
            <div className="mx-5 mb-4 flex items-center gap-3 rounded-[24px] bg-ink p-3 text-white">
              <span className="w-8 text-center font-display text-lg font-bold text-accent">{myPos + 1}º</span>
              <Avatar src={profile?.avatarUrl} name={profile?.name} size={40} ring={false} />
              <div className="flex-1">
                <p className="font-semibold">Você</p>
                <p className="text-xs text-white/60">{getUserLevelInfo(profile?.points ?? 0).title}</p>
              </div>
              <span className="font-bold text-accent">{formatPoints(ranking[myPos].points)}</span>
            </div>
          )}

          <ul className="space-y-2 px-5">
            {ranking.slice(3).map((r, i) => (
              <motion.li key={r.userId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }} className={cn('flex items-center gap-3 rounded-[22px] bg-white p-3 shadow-card', r.userId === profile?.id && 'ring-2 ring-primary')}>
                <span className="w-7 text-center font-display font-bold text-muted">{i + 4}</span>
                <Avatar src={r.avatarUrl} name={r.name} size={42} ring={false} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{r.name}</p>
                  <LevelBadge level={r.level} />
                </div>
                <span className="font-semibold">{formatPoints(r.points)}</span>
              </motion.li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Friends() {
  const { backend, profile, toast } = useApp();
  const [friendships, setFriendships] = useState<Friendship[] | null>(null);
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<RankingEntry[]>([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const uid = profile?.id;

  useEffect(() => (uid ? backend.subscribeFriendships(uid, setFriendships) : undefined), [uid, backend]);

  useEffect(() => {
    if (!uid || term.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      backend
        .searchUsers(term, uid)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(t);
  }, [term, uid, backend]);

  if (!profile) return null;
  const incoming = (friendships ?? []).filter((f) => f.status === 'pending' && f.targetId === profile.id);
  const outgoing = (friendships ?? []).filter((f) => f.status === 'pending' && f.requesterId === profile.id);
  const friends = (friendships ?? []).filter((f) => f.status === 'accepted');
  const other = (f: Friendship) =>
    f.requesterId === profile.id ? { id: f.targetId, name: f.targetName, avatar: f.targetAvatar } : { id: f.requesterId, name: f.requesterName, avatar: f.requesterAvatar };
  const relation = (userId: string) => friendships?.find((f) => f.users.includes(userId));

  const act = async (key: string, fn: () => Promise<void>, ok?: string) => {
    setBusy(key);
    try {
      await fn();
      if (ok) toast(ok, 'success');
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6 px-5 pb-32">
      <label className="flex h-12 items-center gap-3 rounded-2xl border border-line bg-white px-4 focus-within:border-primary">
        <Search className="size-5 text-muted" />
        <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Buscar exploradores pelo nome" className="h-full flex-1 bg-transparent text-sm outline-none" />
        {searching && <Spinner className="size-4 text-primary" />}
      </label>

      {term.trim().length >= 2 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted">Resultados</h2>
          {results.length === 0 && !searching ? (
            <p className="py-4 text-center text-sm text-muted">Ninguém encontrado com “{term}”.</p>
          ) : (
            <ul className="space-y-2">
              {results.map((r) => {
                const rel = relation(r.userId);
                return (
                  <li key={r.userId} className="flex items-center gap-3 rounded-[22px] bg-white p-3 shadow-card">
                    <Avatar src={r.avatarUrl} name={r.name} points={r.points} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{r.name}</p>
                      <p className="text-xs text-muted">{getUserLevelInfo(r.points).title}</p>
                    </div>
                    {rel ? (
                      <span className="flex items-center gap-1 rounded-full bg-bg px-3 py-2 text-xs font-semibold text-muted">
                        <UserCheck className="size-4" /> {rel.status === 'accepted' ? 'Amigos' : 'Pendente'}
                      </span>
                    ) : (
                      <button
                        disabled={busy === r.userId}
                        onClick={() => act(r.userId, () => backend.sendFriendRequest(profile, r), 'Solicitação enviada!')}
                        className="flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        <UserPlus className="size-4" /> Adicionar
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {incoming.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted">
            Solicitações <span className="rounded-full bg-primary px-2 text-xs text-white">{incoming.length}</span>
          </h2>
          <ul className="space-y-2">
            {incoming.map((f) => (
              <motion.li layout key={f.id} className="flex items-center gap-3 rounded-[22px] bg-secondary p-3">
                <Avatar src={f.requesterAvatar} name={f.requesterName} size={44} ring={false} />
                <p className="min-w-0 flex-1 truncate font-semibold">{f.requesterName}</p>
                <button disabled={!!busy} onClick={() => act(f.id, () => backend.respondFriendRequest(f, false))} className="flex size-10 items-center justify-center rounded-full bg-white text-muted" aria-label="Recusar">
                  <X className="size-5" />
                </button>
                <button disabled={!!busy} onClick={() => act(f.id, () => backend.respondFriendRequest(f, true), 'Agora vocês são amigos!')} className="flex size-10 items-center justify-center rounded-full bg-success text-white" aria-label="Aceitar">
                  <Check className="size-5" />
                </button>
              </motion.li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted">Amigos ({friends.length})</h2>
        {!friendships ? (
          <div className="flex justify-center py-8">
            <Spinner className="text-primary" />
          </div>
        ) : friends.length === 0 ? (
          <EmptyState icon={Users} title="Explore em grupo" text="Busque outros exploradores pelo nome e envie solicitações de amizade." />
        ) : (
          <ul className="space-y-2">
            {friends.map((f) => {
              const o = other(f);
              return (
                <motion.li layout key={f.id} className="flex items-center gap-3 rounded-[22px] bg-white p-3 shadow-card">
                  <Avatar src={o.avatar} name={o.name} size={44} ring={false} />
                  <p className="min-w-0 flex-1 truncate font-semibold">{o.name}</p>
                  <button disabled={!!busy} onClick={() => act(f.id, () => backend.removeFriend(f))} className="rounded-full p-2 text-muted" aria-label={`Remover ${o.name}`}>
                    <UserMinus className="size-5" />
                  </button>
                </motion.li>
              );
            })}
          </ul>
        )}
      </section>

      {outgoing.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted">Enviadas</h2>
          <ul className="space-y-2">
            {outgoing.map((f) => (
              <li key={f.id} className="flex items-center gap-3 rounded-[22px] bg-white/60 p-3">
                <Avatar src={f.targetAvatar} name={f.targetName} size={40} ring={false} />
                <p className="min-w-0 flex-1 truncate text-sm font-medium">{f.targetName}</p>
                <button onClick={() => act(f.id, () => backend.removeFriend(f))} className="text-xs font-semibold text-muted underline">
                  Cancelar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
