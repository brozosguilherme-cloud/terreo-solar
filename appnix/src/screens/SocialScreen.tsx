import { Check, Crown, Search, Trophy, UserCheck, UserMinus, UserPlus, Users, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { PullToRefresh } from '../components/PullToRefresh';
import { Avatar, Button, Card, Chip, EmptyState, ScreenHeader, Segmented, Skeleton, Spinner, cn } from '../components/ui';
import { useApp } from '../hooks/useApp';
import { friendlyError } from '../lib/errors';
import { getUserLevelInfo } from '../lib/levels';
import { formatPoints } from '../lib/time';
import type { Friendship, RankingEntry } from '../services/types';

type SocialTab = 'ranking' | 'friends';
type Period = 'weekly' | 'all';

export function SocialScreen() {
  const [tab, setTab] = useState<SocialTab>('ranking');
  const [period, setPeriod] = useState<Period>('weekly');
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
      <ScreenHeader title="Comunidade" subtitle="Dispute o topo com outros exploradores" />
      <div className="px-gutter">
        <Segmented
          id="social"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'ranking', label: 'Ranking', icon: Trophy },
            { value: 'friends', label: 'Amigos', icon: Users },
          ]}
        />
      </div>
      <div className="mt-6 pb-nav">{tab === 'ranking' ? <Ranking ranking={ranking} period={period} setPeriod={setPeriod} /> : <Friends />}</div>
    </PullToRefresh>
  );
}

/* ------------------------------------------------------------------ */
/* Ranking                                                              */
/* ------------------------------------------------------------------ */

const PODIUM = [
  { place: 2, ring: 'bg-silver', label: 'Prata' },
  { place: 1, ring: 'bg-gold', label: 'Ouro' },
  { place: 3, ring: 'bg-bronze', label: 'Bronze' },
];

function RankRow({ pos, entry, highlight, trailing }: { pos: number; entry: RankingEntry; highlight?: boolean; trailing?: ReactNode }) {
  return (
    <div className={cn('flex items-center gap-4 py-3.5', highlight && '-mx-3 rounded-control bg-secondary px-3')}>
      <span className="w-5 text-center type-caption type-number text-muted">{pos}</span>
      <Avatar src={entry.avatarUrl} name={entry.name} size={40} ring={false} />
      <div className="min-w-0 flex-1">
        <p className="truncate type-body-strong">{highlight ? `${entry.name} (você)` : entry.name}</p>
        <p className="type-caption text-muted">Nível {entry.level}</p>
      </div>
      {trailing ?? (
        <span className="type-callout type-number text-muted">{formatPoints(entry.points)}</span>
      )}
    </div>
  );
}

function Ranking({ ranking, period, setPeriod }: { ranking: RankingEntry[] | null; period: Period; setPeriod: (p: Period) => void }) {
  const { profile } = useApp();
  const myPos = useMemo(() => (ranking && profile ? ranking.findIndex((r) => r.userId === profile.id) : -1), [ranking, profile]);
  const VISIBLE = 20;

  return (
    <div className="px-gutter">
      <div className="flex justify-center gap-1" role="tablist" aria-label="Período">
        <Chip active={period === 'weekly'} onClick={() => setPeriod('weekly')}>
          Esta semana
        </Chip>
        <Chip active={period === 'all'} onClick={() => setPeriod('all')}>
          Geral
        </Chip>
      </div>

      {!ranking ? (
        <div className="mt-5 space-y-3">
          <Skeleton className="h-48 w-full rounded-card" />
          <Skeleton className="h-16 w-full rounded-card" />
          <Skeleton className="h-16 w-full rounded-card" />
        </div>
      ) : ranking.length === 0 ? (
        <EmptyState icon={Trophy} title="Ranking vazio" text={period === 'weekly' ? 'Ninguém fez check-in esta semana. Seja o primeiro!' : 'Faça check-ins para aparecer aqui.'} />
      ) : (
        <>
          {/* Pódio — leve: avatares com anel fino da medalha, sem blocos coloridos */}
          <div className="mt-8 grid grid-cols-3 items-end gap-2">
            {PODIUM.map(({ place, ring, label }) => {
              const r = ranking[place - 1];
              if (!r) return <div key={place} />;
              const isMe = r.userId === profile?.id;
              return (
                <motion.div key={place} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: place * 0.06 }} className={cn('flex min-w-0 flex-col items-center', place === 1 ? 'pb-6' : '')}>
                  {place === 1 && <Crown className="mb-1 size-5 text-primary" strokeWidth={1.5} />}
                  <div className={cn('rounded-full p-[3px]', ring)}>
                    <div className="rounded-full bg-bg p-[2px]">
                      <Avatar src={r.avatarUrl} name={r.name} size={place === 1 ? 64 : 48} ring={false} />
                    </div>
                  </div>
                  <p className="mt-3 w-full truncate text-center type-label">{isMe ? 'Você' : r.name.split(' ')[0]}</p>
                  <p className="type-caption type-number text-muted">{formatPoints(r.points)} pts</p>
                  <p className="mt-1 type-caption text-muted">{place}º · {label}</p>
                </motion.div>
              );
            })}
          </div>

          <ul className="mt-8 divide-y divide-line-soft">
            {ranking.slice(3, VISIBLE).map((r, i) => (
              <motion.li key={r.userId} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}>
                <RankRow pos={i + 4} entry={r} highlight={r.userId === profile?.id} />
              </motion.li>
            ))}
          </ul>

          {/* posição própria fixada quando fica fora da lista visível */}
          {myPos >= VISIBLE && (
            <div className="mt-4">
              <p className="mb-2 type-caption text-muted">Sua posição</p>
              <RankRow pos={myPos + 1} entry={ranking[myPos]} highlight />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Amigos                                                               */
/* ------------------------------------------------------------------ */

function GroupTitle({ children, count }: { children: ReactNode; count?: number }) {
  return (
    <h2 className="mb-2 flex items-center gap-2 type-title3">
      {children}
      {count != null && count > 0 && <span className="rounded-full bg-primary px-2 type-caption font-semibold text-white">{count}</span>}
    </h2>
  );
}

function PersonRow({ avatar, name, subtitle, children, tone = 'default' }: { avatar?: string; name: string; subtitle?: string; children?: ReactNode; tone?: 'default' | 'brand' }) {
  return (
    <div className={cn('flex items-center gap-4', tone === 'brand' ? 'rounded-card bg-secondary p-3' : 'py-3')}>
      <Avatar src={avatar} name={name} size={40} ring={false} />
      <div className="min-w-0 flex-1">
        <p className="truncate type-body-strong">{name}</p>
        {subtitle && <p className="truncate type-caption text-muted">{subtitle}</p>}
      </div>
      {children}
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
    f.requesterId === profile.id ? { name: f.targetName, avatar: f.targetAvatar } : { name: f.requesterName, avatar: f.requesterAvatar };
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
    <div className="space-y-section px-gutter">
      <div>
        <label className="flex h-13 items-center gap-3 rounded-control border border-line bg-surface px-4 transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15">
          <Search className="size-5 text-muted" />
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Buscar exploradores pelo nome" className="h-full min-w-0 flex-1 bg-transparent type-body outline-none" />
          {searching && <Spinner className="size-4 text-primary" />}
        </label>

        {term.trim().length >= 2 && (
          <div className="mt-3 divide-y divide-line-soft">
            {results.length === 0 && !searching ? (
              <p className="py-4 text-center type-callout text-muted">Ninguém encontrado com “{term}”.</p>
            ) : (
              results.map((r) => {
                const rel = relation(r.userId);
                return (
                  <PersonRow key={r.userId} avatar={r.avatarUrl} name={r.name} subtitle={getUserLevelInfo(r.points).title}>
                    {rel ? (
                      <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-surface-muted px-3.5 type-caption font-semibold text-muted">
                        <UserCheck className="size-4" /> {rel.status === 'accepted' ? 'Amigos' : 'Pendente'}
                      </span>
                    ) : (
                      <Button size="sm" loading={busy === r.userId} onClick={() => act(r.userId, () => backend.sendFriendRequest(profile, r), 'Solicitação enviada!')}>
                        <UserPlus /> Adicionar
                      </Button>
                    )}
                  </PersonRow>
                );
              })
            )}
          </div>
        )}
      </div>

      {incoming.length > 0 && (
        <section>
          <GroupTitle count={incoming.length}>Solicitações</GroupTitle>
          <div className="space-y-2">
            {incoming.map((f) => (
              <motion.div layout key={f.id}>
                <PersonRow avatar={f.requesterAvatar} name={f.requesterName} subtitle="quer ser seu amigo" tone="brand">
                  <button disabled={!!busy} onClick={() => act(f.id, () => backend.respondFriendRequest(f, false))} className="flex size-10 items-center justify-center rounded-full bg-surface text-muted transition active:scale-95" aria-label={`Recusar ${f.requesterName}`}>
                    <X className="size-5" />
                  </button>
                  <button disabled={!!busy} onClick={() => act(f.id, () => backend.respondFriendRequest(f, true), 'Agora vocês são amigos!')} className="flex size-10 items-center justify-center rounded-full bg-success text-white transition active:scale-95" aria-label={`Aceitar ${f.requesterName}`}>
                    <Check className="size-5" />
                  </button>
                </PersonRow>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section>
        <GroupTitle>Amigos{friendships ? ` · ${friends.length}` : ''}</GroupTitle>
        {!friendships ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-card" />
            <Skeleton className="h-16 w-full rounded-card" />
          </div>
        ) : friends.length === 0 ? (
          <Card>
            <EmptyState icon={Users} title="Explore em grupo" text="Busque exploradores pelo nome e envie solicitações de amizade." />
          </Card>
        ) : (
          <div className="divide-y divide-line-soft">
            {friends.map((f) => {
              const o = other(f);
              return (
                <motion.div layout key={f.id}>
                  <PersonRow avatar={o.avatar} name={o.name}>
                    <button disabled={!!busy} onClick={() => act(f.id, () => backend.removeFriend(f))} className="flex size-10 items-center justify-center rounded-full text-muted transition active:bg-bg" aria-label={`Remover ${o.name}`}>
                      <UserMinus className="size-5" />
                    </button>
                  </PersonRow>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {outgoing.length > 0 && (
        <section>
          <GroupTitle>Enviadas</GroupTitle>
          <div className="space-y-2">
            {outgoing.map((f) => (
              <PersonRow key={f.id} avatar={f.targetAvatar} name={f.targetName} subtitle="aguardando resposta">
                <Button size="sm" variant="ghost" onClick={() => act(f.id, () => backend.removeFriend(f))}>
                  Cancelar
                </Button>
              </PersonRow>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
