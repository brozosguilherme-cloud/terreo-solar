import { SEED_ACHIEVEMENTS, SEED_MISSIONS } from '../data/seed';
import { getUserLevelInfo } from '../lib/levels';
import { startOfWeek } from '../lib/time';
import { computeCheckinReward } from './rules';
import {
  friendshipId,
  type AppNotification,
  type AuthUser,
  type Backend,
  type Checkin,
  type FeedComment,
  type FeedEvent,
  type Friendship,
  type Mission,
  type RankingEntry,
  type UserProfile,
} from './types';

/**
 * Backend local (localStorage) para pré-visualização sem Firebase configurado.
 * Mesma interface do backend Firebase — nenhuma tela sabe qual está em uso.
 */

interface DemoAccount {
  uid: string;
  email: string;
  password: string;
}

interface DemoDB {
  accounts: DemoAccount[];
  session: string | null;
  users: Record<string, UserProfile>;
  missions: Mission[];
  checkins: Checkin[];
  feed: FeedEvent[];
  comments: Record<string, FeedComment[]>;
  notifications: AppNotification[];
  friendships: Friendship[];
}

const KEY = 'appnix-demo-db-v1';
const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${encodeURIComponent(seed)}&backgroundColor=fff6ee`;
const uid = () => Math.random().toString(36).slice(2, 12);
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000);

function makeUser(id: string, name: string, points: number, checkins: string[]): UserProfile {
  return {
    id,
    name,
    email: `${id}@demo.appnix`,
    avatarUrl: avatar(name),
    points,
    level: getUserLevelInfo(points).levelNum,
    missionsCompleted: checkins.length,
    checkins,
    acceptedTermsAt: hoursAgo(500),
    createdAt: hoursAgo(500),
    updatedAt: hoursAgo(2),
  };
}

function seedDB(): DemoDB {
  const bots = [
    makeUser('ana', 'Ana Ribeiro', 14250, ['masp', 'mercadao', 'pinacoteca', 'liberdade']),
    makeUser('lucas', 'Lucas Martins', 9800, ['ibirapuera', 'beco-batman', 'masp']),
    makeUser('marina', 'Marina Costa', 6100, ['catedral-se', 'patio-colegio']),
    makeUser('pedro', 'Pedro Alves', 3200, ['bixiga']),
    makeUser('julia', 'Júlia Souza', 1750, ['minhocao']),
    makeUser('rafa', 'Rafael Lima', 620, ['liberdade']),
  ];
  const feed: FeedEvent[] = [
    { id: 'f1', userId: 'ana', userName: 'Ana Ribeiro', userAvatar: bots[0].avatarUrl, userLevel: 7, type: 'checkin', content: 'O sanduíche de mortadela é tudo isso mesmo! Cheguem cedo pra fugir da fila. 🥪', missionTitle: 'Mercado Municipal', rating: 5, kudosCount: 12, kudosUsers: ['lucas', 'marina'], commentsCount: 2, createdAt: hoursAgo(1.5) },
    { id: 'f2', userId: 'lucas', userName: 'Lucas Martins', userAvatar: bots[1].avatarUrl, userLevel: 6, type: 'checkin', content: 'Grafites novos no beco essa semana. Vale a caminhada pela Vila Madalena.', missionTitle: 'Beco do Batman', rating: 4, kudosCount: 7, kudosUsers: ['ana'], commentsCount: 0, createdAt: hoursAgo(5) },
    { id: 'f3', userId: 'marina', userName: 'Marina Costa', userAvatar: bots[2].avatarUrl, userLevel: 5, type: 'mission', content: 'Completou a trilha "Circuito Histórico" e ganhou +500 pts de bônus!', missionTitle: 'Circuito Histórico', kudosCount: 21, kudosUsers: [], commentsCount: 1, createdAt: hoursAgo(26) },
    { id: 'f4', userId: 'pedro', userName: 'Pedro Alves', userAvatar: bots[3].avatarUrl, userLevel: 4, type: 'checkin', content: 'Cantina de domingo com a família. Nhoque da sorte imperdível.', missionTitle: 'Cantinas do Bixiga', rating: 5, kudosCount: 4, kudosUsers: [], commentsCount: 0, createdAt: hoursAgo(50) },
  ];
  const checkins: Checkin[] = bots.flatMap((b, i) =>
    b.checkins.map((m, j) => {
      const mission = SEED_MISSIONS.find((x) => x.id === m)!;
      return { id: `${b.id}-${m}`, userId: b.id, userName: b.name, userAvatar: b.avatarUrl, missionId: m, missionTitle: mission.title, lat: mission.lat, lng: mission.lng, rating: 5, comment: '', pointsEarned: mission.points, createdAt: hoursAgo(i * 10 + j * 30) };
    }),
  );
  return {
    accounts: [],
    session: null,
    users: Object.fromEntries(bots.map((b) => [b.id, b])),
    missions: SEED_MISSIONS.map((m) => ({ ...m, completions: Math.floor(Math.random() * 120) + 8 })),
    checkins,
    feed,
    comments: {
      f1: [
        { id: 'c1', userId: 'lucas', userName: 'Lucas Martins', userAvatar: bots[1].avatarUrl, text: 'Melhor pastel de bacalhau também!', createdAt: hoursAgo(1) },
        { id: 'c2', userId: 'marina', userName: 'Marina Costa', userAvatar: bots[2].avatarUrl, text: 'Vou sábado 😍', createdAt: hoursAgo(0.5) },
      ],
      f3: [{ id: 'c3', userId: 'ana', userName: 'Ana Ribeiro', userAvatar: bots[0].avatarUrl, text: 'Parabéns!! 👏', createdAt: hoursAgo(20) }],
    },
    notifications: [],
    friendships: [
      { id: friendshipId('ana', 'lucas'), users: ['ana', 'lucas'], requesterId: 'ana', requesterName: 'Ana Ribeiro', requesterAvatar: bots[0].avatarUrl, targetId: 'lucas', targetName: 'Lucas Martins', targetAvatar: bots[1].avatarUrl, status: 'accepted', createdAt: hoursAgo(100) },
    ],
  };
}

const DATE_KEYS = new Set(['createdAt', 'updatedAt', 'acceptedTermsAt']);

function load(): DemoDB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw, (k, v) => (DATE_KEYS.has(k) && typeof v === 'string' ? new Date(v) : v));
  } catch {
    /* storage indisponível */
  }
  return seedDB();
}

export function createDemoBackend(): Backend {
  let db = load();
  const listeners = new Set<() => void>();
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l());
  };
  const watch = (fn: () => void) => {
    listeners.add(fn);
    queueMicrotask(fn);
    return () => void listeners.delete(fn);
  };
  const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));

  const authListeners = new Set<(u: AuthUser | null) => void>();
  const currentAuth = (): AuthUser | null => {
    const acc = db.accounts.find((a) => a.uid === db.session);
    if (!acc) return null;
    const p = db.users[acc.uid];
    return { uid: acc.uid, email: acc.email, displayName: p?.name ?? null, photoURL: p?.avatarUrl ?? null, emailVerified: true, providers: ['password'] };
  };
  const emitAuth = () => authListeners.forEach((cb) => cb(currentAuth()));

  const notify = (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
    db.notifications.unshift({ ...n, id: uid(), read: false, createdAt: new Date() });
  };

  const toEntry = (p: UserProfile): RankingEntry => ({ userId: p.id, name: p.name, avatarUrl: p.avatarUrl, points: p.points, level: p.level });

  const backend: Backend = {
    mode: 'demo',

    onAuthChange(cb) {
      authListeners.add(cb);
      setTimeout(() => cb(currentAuth()), 600);
      return () => void authListeners.delete(cb);
    },

    async signIn(email, password) {
      await wait();
      const acc = db.accounts.find((a) => a.email === email.trim().toLowerCase());
      if (!acc || acc.password !== password) throw Object.assign(new Error('Credenciais inválidas'), { code: 'auth/invalid-credential' });
      db.session = acc.uid;
      save();
      emitAuth();
    },

    async signUp(name, email, password) {
      await wait();
      const e = email.trim().toLowerCase();
      if (db.accounts.some((a) => a.email === e)) throw Object.assign(new Error('Email em uso'), { code: 'auth/email-already-in-use' });
      const id = uid();
      db.accounts.push({ uid: id, email: e, password });
      db.users[id] = { ...makeUser(id, name.trim(), 0, []), email: e, acceptedTermsAt: new Date(), createdAt: new Date(), updatedAt: new Date() };
      db.session = id;
      // convite de amizade para popular a aba Amigos
      db.friendships.push({ id: friendshipId('marina', id), users: ['marina', id], requesterId: 'marina', requesterName: 'Marina Costa', requesterAvatar: db.users.marina.avatarUrl, targetId: id, targetName: name, status: 'pending', createdAt: new Date() });
      notify({ targetUserId: id, type: 'friend_request', sourceUserName: 'Marina Costa', sourceUserAvatar: db.users.marina.avatarUrl });
      save();
      emitAuth();
    },

    async signInWithGoogle() {
      await backend.signUp('Explorador Google', `google-${uid()}@demo.appnix`, uid());
    },

    async resendVerification() {},
    async reloadUser() {
      return currentAuth();
    },
    async resetPassword() {
      await wait();
    },

    async signOut() {
      db.session = null;
      save();
      emitAuth();
    },

    async deleteAccount(password) {
      const id = db.session;
      if (!id) return;
      const acc = db.accounts.find((a) => a.uid === id);
      if (acc && password !== acc.password) throw Object.assign(new Error('Senha incorreta'), { code: 'auth/wrong-password' });
      const myPosts = new Set(db.feed.filter((f) => f.userId === id).map((f) => f.id));
      db.feed = db.feed.filter((f) => f.userId !== id);
      myPosts.forEach((p) => delete db.comments[p]);
      for (const k of Object.keys(db.comments)) db.comments[k] = db.comments[k].filter((c) => c.userId !== id);
      db.checkins = db.checkins.filter((c) => c.userId !== id);
      db.friendships = db.friendships.filter((f) => !f.users.includes(id));
      db.notifications = db.notifications.filter((n) => n.targetUserId !== id);
      delete db.users[id];
      db.accounts = db.accounts.filter((a) => a.uid !== id);
      db.session = null;
      save();
      emitAuth();
    },

    subscribeProfile(id, cb) {
      return watch(() => cb(db.users[id] ? { ...db.users[id] } : null));
    },
    async ensureProfile() {},
    async savePushToken(id, token) {
      if (db.users[id]) db.users[id].pushToken = token;
      save();
    },

    async getMissions() {
      return db.missions;
    },
    async getAchievements() {
      return SEED_ACHIEVEMENTS;
    },

    async performCheckin(profile, input) {
      await wait(700);
      const me = db.users[profile.id];
      if (me.checkins.includes(input.mission.id)) throw new Error('Você já fez check-in neste local.');
      const reward = computeCheckinReward(input.mission, SEED_ACHIEVEMENTS, me.points, me.checkins);
      Object.assign(me, {
        points: reward.newTotal,
        level: reward.newLevel,
        missionsCompleted: me.missionsCompleted + 1,
        checkins: [...me.checkins, input.mission.id],
        updatedAt: new Date(),
      });
      db.missions = db.missions.map((m) => (m.id === input.mission.id ? { ...m, completions: m.completions + 1 } : m));
      db.checkins.push({ id: uid(), userId: me.id, userName: me.name, userAvatar: me.avatarUrl, missionId: input.mission.id, missionTitle: input.mission.title, lat: input.lat, lng: input.lng, photoUrl: input.photoDataUrl ?? undefined, rating: input.rating, comment: input.comment, pointsEarned: reward.pointsEarned, createdAt: new Date() });
      const base = { userId: me.id, userName: me.name, userAvatar: me.avatarUrl, userLevel: reward.newLevel, kudosCount: 0, kudosUsers: [], commentsCount: 0 };
      for (const a of reward.completedAchievements) {
        db.feed.unshift({ ...base, id: uid(), type: 'mission', content: `Completou a trilha "${a.title}" e ganhou +${a.rewardPoints} pts de bônus!`, missionTitle: a.title, createdAt: new Date() });
      }
      db.feed.unshift({ ...base, id: uid(), type: 'checkin', content: input.comment.trim(), imageUrl: input.photoDataUrl ?? input.mission.image, missionTitle: input.mission.title, rating: input.rating, createdAt: new Date() });
      save();
      return { pointsEarned: reward.pointsEarned, bonusPoints: reward.bonusPoints, completedAchievements: reward.completedAchievements, newTotal: reward.newTotal, leveledUp: reward.leveledUp };
    },

    subscribeFeed(cb, opts) {
      return watch(() => {
        const list = opts?.userId ? db.feed.filter((f) => f.userId === opts.userId) : db.feed;
        cb(list.slice(0, opts?.max ?? 50).map((f) => ({ ...f })));
      });
    },

    async toggleKudos(event, profile) {
      const ev = db.feed.find((f) => f.id === event.id);
      if (!ev) return;
      const liked = ev.kudosUsers.includes(profile.id);
      ev.kudosUsers = liked ? ev.kudosUsers.filter((u) => u !== profile.id) : [...ev.kudosUsers, profile.id];
      ev.kudosCount += liked ? -1 : 1;
      if (!liked && ev.userId !== profile.id) notify({ targetUserId: ev.userId, type: 'like', sourceUserName: profile.name, sourceUserAvatar: profile.avatarUrl, postId: ev.id });
      save();
    },

    subscribeComments(eventId, cb) {
      return watch(() => cb([...(db.comments[eventId] ?? [])]));
    },

    async addComment(event, profile, text) {
      const body = text.trim().slice(0, 500);
      if (!body) return;
      (db.comments[event.id] ??= []).push({ id: uid(), userId: profile.id, userName: profile.name, userAvatar: profile.avatarUrl, text: body, createdAt: new Date() });
      const ev = db.feed.find((f) => f.id === event.id);
      if (ev) ev.commentsCount += 1;
      if (event.userId !== profile.id) notify({ targetUserId: event.userId, type: 'comment', sourceUserName: profile.name, sourceUserAvatar: profile.avatarUrl, postId: event.id });
      save();
    },

    async deleteFeedEvent(event) {
      db.feed = db.feed.filter((f) => f.id !== event.id);
      delete db.comments[event.id];
      save();
    },

    subscribeNotifications(id, cb) {
      return watch(() => cb(db.notifications.filter((n) => n.targetUserId === id).map((n) => ({ ...n }))));
    },
    async markNotificationsRead(ids) {
      db.notifications.forEach((n) => ids.includes(n.id) && (n.read = true));
      save();
    },

    async getRanking(period) {
      await wait(200);
      if (period === 'all') return Object.values(db.users).map(toEntry).sort((a, b) => b.points - a.points);
      const since = startOfWeek().getTime();
      const totals = new Map<string, number>();
      db.checkins.filter((c) => (c.createdAt?.getTime() ?? 0) >= since).forEach((c) => totals.set(c.userId, (totals.get(c.userId) ?? 0) + c.pointsEarned));
      return [...totals.entries()]
        .filter(([id]) => db.users[id])
        .map(([id, pts]) => ({ ...toEntry(db.users[id]), points: pts }))
        .sort((a, b) => b.points - a.points);
    },

    subscribeFriendships(id, cb) {
      return watch(() => cb(db.friendships.filter((f) => f.users.includes(id)).map((f) => ({ ...f }))));
    },

    async searchUsers(term, exclude) {
      const t = term.trim().toLowerCase();
      if (t.length < 2) return [];
      return Object.values(db.users).filter((u) => u.id !== exclude && u.name.toLowerCase().includes(t)).map(toEntry);
    },

    async sendFriendRequest(from, to) {
      const id = friendshipId(from.id, to.userId);
      if (db.friendships.some((f) => f.id === id)) return;
      db.friendships.push({ id, users: [from.id, to.userId], requesterId: from.id, requesterName: from.name, requesterAvatar: from.avatarUrl, targetId: to.userId, targetName: to.name, targetAvatar: to.avatarUrl, status: 'pending', createdAt: new Date() });
      save();
      // simula o outro usuário aceitando
      setTimeout(() => {
        const f = db.friendships.find((x) => x.id === id);
        if (f) {
          f.status = 'accepted';
          save();
        }
      }, 4000);
    },

    async respondFriendRequest(f, accept) {
      const x = db.friendships.find((y) => y.id === f.id);
      if (!x) return;
      if (accept) x.status = 'accepted';
      else db.friendships = db.friendships.filter((y) => y.id !== f.id);
      save();
    },

    async removeFriend(f) {
      db.friendships = db.friendships.filter((y) => y.id !== f.id);
      save();
    },
  };

  return backend;
}
