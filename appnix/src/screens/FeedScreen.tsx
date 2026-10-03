import { Heart, MessageCircle, MoreHorizontal, Newspaper, Send, Trash2, Trophy } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { PullToRefresh } from '../components/PullToRefresh';
import { Avatar, Button, EmptyState, LevelBadge, Spinner, Stars, cn } from '../components/ui';
import { useApp } from '../hooks/useApp';
import { friendlyError } from '../lib/errors';
import { timeAgo } from '../lib/time';
import type { FeedComment, FeedEvent } from '../services/types';

export function FeedScreen() {
  const { backend, setTab, profile } = useApp();
  const [events, setEvents] = useState<FeedEvent[] | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => backend.subscribeFeed(setEvents, { max: 60 }), [backend, nonce]);

  const refresh = useCallback(async () => {
    setNonce((n) => n + 1);
    await new Promise((r) => setTimeout(r, 600));
  }, []);

  return (
    <PullToRefresh onRefresh={refresh}>
      <header className="flex items-center justify-between px-5 pt-safe pb-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Feed</h1>
          <p className="text-sm text-muted">O que a comunidade está explorando</p>
        </div>
        <button onClick={() => setTab('profile')} aria-label="Abrir perfil">
          <Avatar src={profile?.avatarUrl} name={profile?.name} points={profile?.points ?? 0} size={44} />
        </button>
      </header>
      <FeedList events={events} emptyAction={<Button onClick={() => setTab('checkin')}>Fazer meu primeiro check-in</Button>} />
    </PullToRefresh>
  );
}

/** Lista reutilizada no Feed e no Perfil. */
export function FeedList({ events, emptyAction, compact }: { events: FeedEvent[] | null; emptyAction?: React.ReactNode; compact?: boolean }) {
  const [commentsFor, setCommentsFor] = useState<FeedEvent | null>(null);

  if (!events)
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-7 text-primary" />
      </div>
    );
  if (!events.length) return <EmptyState icon={Newspaper} title="Nenhuma publicação ainda" text="Os check-ins aparecem aqui com foto, avaliação e dicas." action={emptyAction} />;

  return (
    <div className={cn('space-y-4', compact ? 'pb-6' : 'px-4 pb-32')}>
      <AnimatePresence initial={false}>
        {events.map((e) => (
          <FeedPost key={e.id} event={e} onComments={() => setCommentsFor(e)} />
        ))}
      </AnimatePresence>
      <CommentsSheet event={commentsFor ? events.find((x) => x.id === commentsFor.id) ?? commentsFor : null} onClose={() => setCommentsFor(null)} />
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
    <motion.article layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} className="overflow-hidden rounded-[28px] bg-white shadow-card">
      <div className="flex items-center gap-3 p-4 pb-3">
        <Avatar src={event.userAvatar} name={event.userName} size={42} ring={false} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-semibold">{event.userName}</span>
            {event.userLevel && <LevelBadge level={event.userLevel} />}
          </div>
          <p className="truncate text-xs text-muted">
            {event.type === 'mission' ? 'completou uma trilha' : `em ${event.missionTitle}`} · {timeAgo(event.createdAt)}
          </p>
        </div>
        {mine && (
          <div className="relative">
            <button onClick={() => setMenu((m) => !m)} className="rounded-full p-2 text-muted" aria-label="Opções da publicação">
              <MoreHorizontal className="size-5" />
            </button>
            <AnimatePresence>
              {menu && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute top-10 right-0 z-10 w-44 overflow-hidden rounded-2xl bg-white shadow-float">
                  <button
                    onClick={() => {
                      setMenu(false);
                      setConfirmDelete(true);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-danger"
                  >
                    <Trash2 className="size-4" /> Excluir publicação
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {event.type === 'mission' ? (
        <div className="mx-4 flex items-center gap-4 rounded-[22px] bg-ink p-5 text-white">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent">
            <Trophy className="size-7 text-ink" />
          </div>
          <div>
            <p className="text-xs tracking-wide text-white/60 uppercase">Trilha concluída</p>
            <p className="font-display text-lg font-semibold">{event.missionTitle}</p>
          </div>
        </div>
      ) : (
        event.imageUrl && <img src={event.imageUrl} alt={`Foto em ${event.missionTitle}`} className="aspect-[4/3] w-full object-cover" loading="lazy" onDoubleClick={() => !liked && kudos()} />
      )}

      <div className="px-4 pt-3 pb-4">
        {event.type === 'checkin' && (
          <div className="mb-2 flex items-center justify-between">
            <span className="font-display font-semibold">{event.missionTitle}</span>
            {event.rating ? <Stars value={event.rating} size={14} /> : null}
          </div>
        )}
        {event.content && <p className={cn('text-[15px] leading-relaxed', event.type === 'mission' ? 'mt-3 text-muted' : '')}>{event.content}</p>}

        <div className="mt-3 flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={kudos}
            className={cn('flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors', liked ? 'bg-[#FDE8E2] text-[#E5484D]' : 'bg-bg text-ink')}
            aria-pressed={liked}
            aria-label="Kudos"
          >
            <motion.span key={String(liked)} initial={{ scale: liked ? 0.4 : 1 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 12 }}>
              <Heart className={cn('size-5', liked && 'fill-current')} />
            </motion.span>
            {count}
          </motion.button>
          <button onClick={onComments} className="flex h-10 items-center gap-2 rounded-full bg-bg px-4 text-sm font-semibold" aria-label="Comentários">
            <MessageCircle className="size-5" /> {event.commentsCount}
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
        <p className="px-6 pb-4 text-muted">A publicação e seus comentários serão removidos do feed. Seus pontos continuam na conta.</p>
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
      title={`Comentários${event ? ` (${event.commentsCount})` : ''}`}
      maxHeight="80%"
      footer={
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2"
        >
          <Avatar src={profile?.avatarUrl} name={profile?.name} size={36} ring={false} />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            placeholder="Escreva um comentário…"
            className="h-11 min-w-0 flex-1 rounded-full border border-line bg-bg px-4 text-sm outline-none focus:border-primary"
          />
          <button type="submit" disabled={!text.trim() || sending} className="flex size-11 items-center justify-center rounded-full bg-primary text-white disabled:opacity-40" aria-label="Enviar comentário">
            {sending ? <Spinner className="size-4" /> : <Send className="size-4" />}
          </button>
        </form>
      }
    >
      <div className="min-h-40 px-5 pb-4">
        {!comments ? (
          <div className="flex justify-center py-10">
            <Spinner className="text-primary" />
          </div>
        ) : comments.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Seja o primeiro a comentar.</p>
        ) : (
          <ul className="space-y-4">
            {comments.map((c) => (
              <motion.li key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                <Avatar src={c.userAvatar} name={c.userName} size={36} ring={false} />
                <div className="min-w-0 flex-1">
                  <div className="rounded-2xl rounded-tl-md bg-bg px-3.5 py-2.5">
                    <p className="text-sm font-semibold">{c.userName}</p>
                    <p className="text-sm break-words">{c.text}</p>
                  </div>
                  <p className="mt-1 pl-2 text-[11px] text-muted">{timeAgo(c.createdAt)}</p>
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
