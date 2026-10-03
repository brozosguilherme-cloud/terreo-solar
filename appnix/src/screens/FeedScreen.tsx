import { Heart, MessageCircle, MoreHorizontal, Newspaper, Send, Trash2, Trophy } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { PullToRefresh } from '../components/PullToRefresh';
import { Avatar, Button, EmptyState, LevelBadge, ScreenHeader, Skeleton, Spinner, Stars, cn } from '../components/ui';
import { useApp } from '../hooks/useApp';
import { friendlyError } from '../lib/errors';
import { timeAgo } from '../lib/time';
import type { FeedComment, FeedEvent } from '../services/types';

export function FeedScreen() {
  const { backend, setTab, profile, openCheckin } = useApp();
  const [events, setEvents] = useState<FeedEvent[] | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => backend.subscribeFeed(setEvents, { max: 60 }), [backend, nonce]);

  const refresh = useCallback(async () => {
    setNonce((n) => n + 1);
    await new Promise((r) => setTimeout(r, 600));
  }, []);

  return (
    <PullToRefresh onRefresh={refresh}>
      <ScreenHeader
        title="Feed"
        subtitle="O que a comunidade está explorando"
        trailing={
          <button onClick={() => setTab('profile')} aria-label="Abrir perfil" className="rounded-full">
            <Avatar src={profile?.avatarUrl} name={profile?.name} points={profile?.points ?? 0} size={40} />
          </button>
        }
      />
      <div className="px-gutter pb-nav">
        <FeedList events={events} emptyAction={<Button size="md" onClick={() => openCheckin(null)}>Fazer meu primeiro check-in</Button>} />
      </div>
    </PullToRefresh>
  );
}

function PostSkeleton() {
  return (
    <div className="overflow-hidden rounded-card bg-surface shadow-card">
      <div className="flex items-center gap-3 p-card">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-32 rounded-full" />
          <Skeleton className="h-3 w-24 rounded-full" />
        </div>
      </div>
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="space-y-2 p-card">
        <Skeleton className="h-3.5 w-3/4 rounded-full" />
        <Skeleton className="h-3.5 w-1/2 rounded-full" />
      </div>
    </div>
  );
}

/** Lista reutilizada no Feed e no Perfil (sem padding lateral próprio). */
export function FeedList({ events, emptyAction }: { events: FeedEvent[] | null; emptyAction?: ReactNode }) {
  const [commentsFor, setCommentsFor] = useState<string | null>(null);

  if (!events)
    return (
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  if (!events.length) return <EmptyState icon={Newspaper} title="Nenhuma publicação ainda" text="Os check-ins aparecem aqui com foto, avaliação e dicas." action={emptyAction} />;

  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {events.map((e) => (
          <FeedPost key={e.id} event={e} onComments={() => setCommentsFor(e.id)} />
        ))}
      </AnimatePresence>
      <CommentsSheet event={events.find((x) => x.id === commentsFor) ?? null} onClose={() => setCommentsFor(null)} />
    </div>
  );
}

function FeedPost({ event, onComments }: { event: FeedEvent; onComments: () => void }) {
  const { profile, backend, toast } = useApp();
  const [optimistic, setOptimistic] = useState<{ liked: boolean; count: number } | null>(null);
  const [menu, setMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const serverLiked = !!profile && event.kudosUsers.includes(profile.id);
  const liked = optimistic?.liked ?? serverLiked;
  const count = optimistic?.count ?? event.kudosCount;
  const mine = profile?.id === event.userId;

  // descarta o estado otimista quando o servidor confirma
  useEffect(() => setOptimistic(null), [event.kudosCount, serverLiked]);

  const kudos = async () => {
    if (!profile) return;
    navigator.vibrate?.(12);
    setOptimistic({ liked: !liked, count: count + (liked ? -1 : 1) });
    try {
      await backend.toggleKudos(event, profile);
    } catch (e) {
      setOptimistic(null);
      toast(friendlyError(e), 'error');
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await backend.deleteFeedEvent(event);
      toast('Publicação excluída.');
    } catch (e) {
      toast(friendlyError(e), 'error');
      setDeleting(false);
    }
  };

  return (
    <motion.article layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="overflow-hidden rounded-card bg-surface shadow-card">
      {/* autor */}
      <div className="flex items-center gap-3 px-card pt-card pb-3">
        <Avatar src={event.userAvatar} name={event.userName} size={40} ring={false} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate type-body-strong">{event.userName}</span>
            {event.userLevel && <LevelBadge level={event.userLevel} />}
          </div>
          <p className="truncate type-caption text-muted">
            {event.type === 'mission' ? 'completou uma trilha' : `em ${event.missionTitle}`} · {timeAgo(event.createdAt)}
          </p>
        </div>
        {mine && (
          <div className="relative">
            <button onClick={() => setMenu((m) => !m)} className="flex size-9 items-center justify-center rounded-full text-muted transition active:bg-bg" aria-label="Opções da publicação" aria-expanded={menu}>
              <MoreHorizontal className="size-5" />
            </button>
            <AnimatePresence>
              {menu && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute top-10 right-0 z-10 w-48 overflow-hidden rounded-control bg-surface shadow-float">
                  <button
                    onClick={() => {
                      setMenu(false);
                      setConfirmDelete(true);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 type-label text-danger-ink"
                  >
                    <Trash2 className="size-4" /> Excluir publicação
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* mídia */}
      {event.type === 'mission' ? (
        <div className="mx-card flex items-center gap-4 rounded-control bg-ink p-4 text-white">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-control bg-accent">
            <Trophy className="size-6 text-ink" />
          </div>
          <div className="min-w-0">
            <p className="type-overline text-white/60">Trilha concluída</p>
            <p className="truncate type-title3">{event.missionTitle}</p>
          </div>
        </div>
      ) : (
        event.imageUrl && <img src={event.imageUrl} alt={`Foto em ${event.missionTitle}`} className="aspect-[4/3] w-full object-cover" loading="lazy" onDoubleClick={() => !liked && kudos()} />
      )}

      {/* conteúdo */}
      <div className="px-card pt-3 pb-card">
        {event.type === 'checkin' && (
          <div className="flex items-center justify-between gap-3">
            <span className="truncate type-title3">{event.missionTitle}</span>
            {event.rating ? <Stars value={event.rating} size={14} /> : null}
          </div>
        )}
        {event.content && <p className={cn('type-body', event.type === 'checkin' ? 'mt-1' : 'text-muted')}>{event.content}</p>}

        <div className="mt-3 flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={kudos}
            className={cn('flex h-9 items-center gap-1.5 rounded-full px-3.5 type-label transition-colors', liked ? 'bg-danger-soft text-danger' : 'bg-bg text-ink')}
            aria-pressed={liked}
            aria-label={`Kudos, ${count}`}
          >
            <motion.span key={String(liked)} initial={{ scale: liked ? 0.4 : 1 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 12 }}>
              <Heart className={cn('size-4.5', liked && 'fill-current')} />
            </motion.span>
            <span className="type-number">{count}</span>
          </motion.button>
          <button onClick={onComments} className="flex h-9 items-center gap-1.5 rounded-full bg-bg px-3.5 type-label" aria-label={`Comentários, ${event.commentsCount}`}>
            <MessageCircle className="size-4.5" /> <span className="type-number">{event.commentsCount}</span>
          </button>
        </div>
      </div>

      <BottomSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Excluir publicação?"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button variant="danger" className="flex-1" loading={deleting} onClick={remove}>
              Excluir
            </Button>
          </div>
        }
      >
        <p className="px-gutter pb-6 type-body text-muted">A publicação e os comentários serão removidos do feed. Seus pontos continuam na conta.</p>
      </BottomSheet>
    </motion.article>
  );
}

function CommentsSheet({ event, onClose }: { event: FeedEvent | null; onClose: () => void }) {
  const { backend, profile, toast } = useApp();
  const [comments, setComments] = useState<FeedComment[] | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const eventId = event?.id;

  useEffect(() => {
    if (!eventId) return;
    setComments(null);
    return backend.subscribeComments(eventId, setComments);
  }, [eventId, backend]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [comments?.length]);

  const send = async () => {
    if (!event || !profile || !text.trim()) return;
    setSending(true);
    const body = text;
    setText('');
    try {
      await backend.addComment(event, profile, body);
    } catch (e) {
      setText(body);
      toast(friendlyError(e), 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <BottomSheet
      open={!!event}
      onClose={onClose}
      title={`Comentários${event ? ` · ${event.commentsCount}` : ''}`}
      maxHeight="80%"
      footer={
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            placeholder="Escreva um comentário…"
            aria-label="Comentário"
            className="h-11 min-w-0 flex-1 rounded-full border border-line bg-bg px-4 type-callout outline-none focus:border-primary"
          />
          <button type="submit" disabled={!text.trim() || sending} className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition active:scale-95 disabled:opacity-40" aria-label="Enviar comentário">
            {sending ? <Spinner className="size-4" /> : <Send className="size-4" />}
          </button>
        </form>
      }
    >
      <div className="min-h-40 px-gutter pb-4">
        {!comments ? (
          <div className="flex justify-center py-10">
            <Spinner className="text-primary" />
          </div>
        ) : comments.length === 0 ? (
          <p className="py-10 text-center type-callout text-muted">Seja o primeiro a comentar.</p>
        ) : (
          <ul className="space-y-4">
            {comments.map((c) => (
              <motion.li key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                <Avatar src={c.userAvatar} name={c.userName} size={32} ring={false} />
                <div className="min-w-0 flex-1">
                  <div className="rounded-control rounded-tl-md bg-bg px-3.5 py-2.5">
                    <p className="type-label">{c.userName}</p>
                    <p className="type-callout break-words">{c.text}</p>
                  </div>
                  <p className="mt-1 pl-2 type-caption text-muted">{timeAgo(c.createdAt)}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
        <div ref={endRef} />
      </div>
    </BottomSheet>
  );
}
