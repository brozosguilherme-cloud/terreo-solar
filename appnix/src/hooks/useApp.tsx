import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { haversineDistance, type LatLng } from '../lib/geo';
import { registerPush, watchPosition, type Position } from '../lib/native';
import { getBackend } from '../services';
import type { Achievement, AppNotification, AuthUser, Backend, Mission, UserProfile } from '../services/types';

export type Tab = 'home' | 'map' | 'checkin' | 'feed' | 'social' | 'profile';

export interface Toast {
  id: number;
  message: string;
  tone: 'default' | 'success' | 'error';
}

interface AppState {
  backend: Backend;
  authReady: boolean;
  authUser: AuthUser | null;
  profile: UserProfile | null;
  setAuthUser: (u: AuthUser | null) => void;

  missions: Mission[];
  achievements: Achievement[];
  contentLoading: boolean;
  refreshContent: () => Promise<void>;

  position: Position | null;
  positionError: string | null;
  distanceTo: (p: LatLng) => number | null;

  notifications: AppNotification[];
  unreadCount: number;

  tab: Tab;
  setTab: (t: Tab) => void;
  /** Abre o check-in já com a missão escolhida. */
  checkinMissionId: string | null;
  openCheckin: (missionId?: string | null) => void;

  toast: (message: string, tone?: Toast['tone']) => void;
  toasts: Toast[];
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const backend = useMemo(() => getBackend(), []);
  const [authReady, setAuthReady] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [position, setPosition] = useState<Position | null>(null);
  const [positionError, setPositionError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [tab, setTab] = useState<Tab>('home');
  const [checkinMissionId, setCheckinMissionId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const toast = useCallback((message: string, tone: Toast['tone'] = 'default') => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  useEffect(
    () =>
      backend.onAuthChange((u) => {
        setAuthUser(u);
        setAuthReady(true);
      }),
    [backend],
  );

  const verified = authUser && (authUser.emailVerified || !authUser.providers.includes('password'));
  const uid = verified ? authUser.uid : null;

  useEffect(() => {
    if (!uid) {
      setProfile(null);
      setNotifications([]);
      return;
    }
    const offProfile = backend.subscribeProfile(uid, (p) => {
      if (!p && authUser) backend.ensureProfile(authUser).catch(() => undefined);
      setProfile(p);
    });
    const offNotif = backend.subscribeNotifications(uid, setNotifications);
    registerPush((token) => backend.savePushToken(uid, token).catch(() => undefined)).catch(() => undefined);
    return () => {
      offProfile();
      offNotif();
    };
  }, [uid, backend]);

  const refreshContent = useCallback(async () => {
    setContentLoading(true);
    try {
      const [m, a] = await Promise.all([backend.getMissions(), backend.getAchievements()]);
      setMissions([...m]);
      setAchievements([...a]);
    } catch (e) {
      console.warn('[content]', e);
      toast('Não foi possível carregar as missões.', 'error');
    } finally {
      setContentLoading(false);
    }
  }, [backend, toast]);

  useEffect(() => {
    if (uid) refreshContent();
  }, [uid, refreshContent]);

  // mantém completions locais atualizadas após um check-in
  useEffect(() => {
    if (profile) backend.getMissions().then((m) => setMissions([...m])).catch(() => undefined);
  }, [profile?.missionsCompleted, backend]);

  useEffect(() => {
    if (!uid) return;
    return watchPosition(
      (p) => {
        setPosition(p);
        setPositionError(null);
      },
      (e) => setPositionError(e.message || 'Localização indisponível'),
    );
  }, [uid]);

  const distanceTo = useCallback((p: LatLng) => (position ? haversineDistance(position, p) : null), [position]);

  const openCheckin = useCallback((missionId?: string | null) => {
    setCheckinMissionId(missionId ?? null);
    setTab('checkin');
  }, []);

  const value: AppState = {
    backend,
    authReady,
    authUser,
    profile,
    setAuthUser,
    missions,
    achievements,
    contentLoading,
    refreshContent,
    position,
    positionError,
    distanceTo,
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    tab,
    setTab,
    checkinMissionId,
    openCheckin,
    toast,
    toasts,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp fora do AppProvider');
  return v;
}
