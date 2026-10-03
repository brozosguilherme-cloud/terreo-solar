import { ArrowLeft, ChevronRight, Cookie, FileText, Lock, LogOut, MapPin, Settings, Shield, Sparkles, Stamp, Trash2, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { Avatar, Button, ProgressBar, cn } from '../components/ui';
import { useApp } from '../hooks/useApp';
import { friendlyError } from '../lib/errors';
import { LEVEL_TIERS, getUserLevelInfo } from '../lib/levels';
import { formatPoints } from '../lib/time';
import type { FeedEvent } from '../services/types';
import { FeedList } from './FeedScreen';
import { LegalScreen, type LegalDoc } from './LegalScreen';

export function ProfileScreen() {
  const { profile, backend, setTab, authUser, toast } = useApp();
  const [events, setEvents] = useState<FeedEvent[] | null>(null);
  const [legal, setLegal] = useState<LegalDoc | null>(null);
  const [settings, setSettings] = useState(false);
  const [levels, setLevels] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [password, setPassword] = useState('');
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const uid = profile?.id;

  useEffect(() => (uid ? backend.subscribeFeed(setEvents, { userId: uid, max: 30 }) : undefined), [uid, backend]);

  if (!profile) return null;
  const level = getUserLevelInfo(profile.points);
  const needsPassword = backend.mode === 'demo' || !!authUser?.providers.includes('password');

  const logout = async () => {
    setBusy(true);
    try {
      await backend.signOut();
    } catch (e) {
      toast(friendlyError(e), 'error');
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    setBusy(true);
    try {
      await backend.deleteAccount(needsPassword ? password : undefined);
      toast('Sua conta e seus dados foram excluídos.', 'success');
    } catch (e) {
      toast(friendlyError(e), 'error');
      setBusy(false);
    }
  };

  const settingsItems: { icon: typeof Shield; label: string; onClick: () => void; danger?: boolean }[] = [
    { icon: FileText, label: 'Termos de Uso', onClick: () => setLegal('terms') },
    { icon: Shield, label: 'Política de Privacidade', onClick: () => setLegal('privacy') },
    { icon: Cookie, label: 'Política de Cookies', onClick: () => setLegal('cookies') },
    { icon: LogOut, label: 'Sair da conta', onClick: () => setConfirmLogout(true) },
    { icon: Trash2, label: 'Excluir conta definitivamente', onClick: () => setConfirmDelete(true), danger: true },
  ];

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="relative rounded-b-[40px] bg-secondary px-5 pt-safe pb-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setTab('home')} className="flex size-11 items-center justify-center rounded-2xl bg-white shadow-card" aria-label="Voltar">
            <ArrowLeft className="size-5" />
          </button>
          <button onClick={() => setSettings(true)} className="flex size-11 items-center justify-center rounded-2xl bg-white shadow-card" aria-label="Configurações">
            <Settings className="size-5" />
          </button>
        </div>
        <div className="mt-2 flex flex-col items-center text-center">
          <Avatar src={profile.avatarUrl} name={profile.name} points={profile.points} size={104} />
          <h1 className="mt-3 text-2xl font-bold">{profile.name}</h1>
          <p className="text-sm text-muted">{profile.email}</p>
          <button onClick={() => setLevels(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">
            <Trophy className="size-4 text-accent" /> Nível {level.levelNum} · {level.title}
          </button>
        </div>
        <div className="mt-5 rounded-[24px] bg-white p-4 shadow-card">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold">{level.nextTierTitle ? `Rumo a ${level.nextTierTitle}` : 'Nível máximo!'}</span>
            <span className="text-muted">{level.progressPercent}%</span>
          </div>
          <ProgressBar percent={level.progressPercent} />
          <p className="mt-2 text-xs text-muted">
            {level.nextTierRequiredPontos != null
              ? `${formatPoints(level.currentPontos)} / ${formatPoints(level.nextTierRequiredPontos)} pts`
              : `${formatPoints(level.currentPontos)} pts acumulados`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-5 py-5">
        {[
          { icon: Sparkles, label: 'Pontos', value: formatPoints(profile.points), color: '#FFD166' },
          { icon: Trophy, label: 'Missões', value: String(profile.missionsCompleted), color: '#E9A34D' },
          { icon: Stamp, label: 'Passaporte', value: String(profile.checkins.length), color: '#00D084' },
        ].map((s) => (
          <div key={s.label} className="rounded-[24px] bg-white p-4 text-center shadow-card">
            <div className="mx-auto mb-2 flex size-9 items-center justify-center rounded-xl" style={{ background: `${s.color}33` }}>
              <s.icon className="size-4.5" style={{ color: s.color === '#FFD166' ? '#C9842F' : s.color }} />
            </div>
            <p className="font-display text-xl font-bold">{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="px-4 pb-32">
        <h2 className="mb-3 px-1 text-xl font-semibold">Minhas atividades</h2>
        <FeedList
          events={events}
          compact
          emptyAction={
            <Button onClick={() => setTab('checkin')}>
              <MapPin className="size-4" /> Fazer check-in
            </Button>
          }
        />
      </section>

      {/* Configurações */}
      <BottomSheet open={settings} onClose={() => setSettings(false)} title="Configurações">
        <ul className="px-3 pb-6">
          {settingsItems.map((it) => (
            <li key={it.label}>
              <button
                onClick={() => {
                  setSettings(false);
                  it.onClick();
                }}
                className={cn('flex w-full items-center gap-3 rounded-2xl p-3.5 text-left active:bg-bg', it.danger ? 'text-danger' : 'text-ink')}
              >
                <span className={cn('flex size-10 items-center justify-center rounded-xl', it.danger ? 'bg-[#FDE8E2]' : 'bg-bg')}>
                  <it.icon className="size-5" />
                </span>
                <span className="flex-1 font-medium">{it.label}</span>
                <ChevronRight className="size-4 text-muted" />
              </button>
            </li>
          ))}
        </ul>
        <p className="px-6 pb-6 text-center text-xs text-muted">AppNix v1.0.0 · Seus dados são tratados conforme a LGPD (Lei 13.709/2018).</p>
      </BottomSheet>

      {/* Tabela de níveis */}
      <BottomSheet open={levels} onClose={() => setLevels(false)} title="Níveis de explorador">
        <ol className="space-y-2 px-5 pb-6">
          {LEVEL_TIERS.map((t) => {
            const reached = profile.points >= t.minPontos;
            const current = t.level === level.levelNum;
            return (
              <li key={t.level} className={cn('flex items-center gap-3 rounded-[20px] p-3', current ? 'bg-ink text-white' : reached ? 'bg-secondary' : 'bg-bg')}>
                <span className={cn('flex size-10 items-center justify-center rounded-xl font-display font-bold', current ? 'bg-accent text-ink' : reached ? 'bg-primary text-white' : 'bg-white text-muted')}>
                  {reached ? t.level : <Lock className="size-4" />}
                </span>
                <div className="flex-1">
                  <p className="font-semibold">{t.title}</p>
                  <p className={cn('text-xs', current ? 'text-white/60' : 'text-muted')}>{formatPoints(t.minPontos)} pts</p>
                </div>
                {current && <span className="text-xs font-semibold text-accent">Atual</span>}
              </li>
            );
          })}
        </ol>
      </BottomSheet>

      {/* Logout */}
      <BottomSheet
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Sair da conta?"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmLogout(false)}>
              Cancelar
            </Button>
            <Button variant="dark" className="flex-1" loading={busy} onClick={logout}>
              Sair
            </Button>
          </div>
        }
      >
        <p className="px-6 pb-4 text-muted">Seu progresso fica salvo na nuvem. Entre novamente quando quiser.</p>
      </BottomSheet>

      {/* Exclusão de conta — LGPD Art. 18 */}
      <BottomSheet
        open={confirmDelete}
        onClose={() => {
          setConfirmDelete(false);
          setPassword('');
          setAck(false);
        }}
        title={
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-[#FDE8E2]">
              <Trash2 className="size-5 text-danger" />
            </span>
            <h2 className="text-xl font-semibold">Excluir conta</h2>
          </div>
        }
        footer={
          <Button variant="danger" className="w-full" disabled={!ack || (needsPassword && password.length < 6)} loading={busy} onClick={deleteAccount}>
            Excluir definitivamente
          </Button>
        }
      >
        <div className="px-6 pb-4">
          <p className="text-muted">
            Conforme o <strong className="text-ink">Art. 18 da LGPD</strong>, você pode solicitar a eliminação dos seus dados. Esta ação é <strong className="text-ink">irreversível</strong> e removerá:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
            <li>Perfil, pontos, nível e passaporte de check-ins</li>
            <li>Fotos enviadas e publicações do feed</li>
            <li>Comentários, curtidas recebidas, amizades e notificações</li>
            <li>Sua conta de acesso (email/Google)</li>
          </ul>
          {needsPassword && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Confirme sua senha"
              autoComplete="current-password"
              className="mt-4 h-12 w-full rounded-2xl border border-line bg-bg px-4 text-sm outline-none focus:border-danger"
            />
          )}
          {!needsPassword && <p className="mt-4 text-xs text-muted">Você precisará confirmar sua conta Google.</p>}
          <label className="mt-4 flex items-start gap-3 text-sm">
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[#E5484D]" />
            Entendo que meus dados serão apagados permanentemente.
          </label>
        </div>
      </BottomSheet>

      <LegalScreen doc={legal} onClose={() => setLegal(null)} />
    </div>
  );
}
