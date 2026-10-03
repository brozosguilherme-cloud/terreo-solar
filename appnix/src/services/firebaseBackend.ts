import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  arrayRemove,
  arrayUnion,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, listAll, ref, uploadString } from 'firebase/storage';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { getFirebase } from '../lib/firebase';
import { isNative } from '../lib/native';
import { startOfWeek } from '../lib/time';
import { computeCheckinReward } from './rules';
import {
  friendshipId,
  type Achievement,
  type AppNotification,
  type AuthUser,
  type Backend,
  type CheckinInput,
  type CheckinResult,
  type FeedComment,
  type FeedEvent,
  type Friendship,
  type Mission,
  type RankingEntry,
  type UserProfile,
} from './types';

const toDate = (v: unknown): Date | null => (v instanceof Timestamp ? v.toDate() : v instanceof Date ? v : null);

const defaultAvatar = (seed: string) =>
  `https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${encodeURIComponent(seed)}&backgroundColor=fff6ee`;

function mapAuthUser(u: User): AuthUser {
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL,
    emailVerified: u.emailVerified,
    providers: u.providerData.map((p) => p.providerId),
  };
}

function mapProfile(id: string, d: DocumentData): UserProfile {
  return {
    id,
    name: d.name ?? 'Explorador',
    email: d.email ?? '',
    avatarUrl: d.avatarUrl || defaultAvatar(id),
    points: d.points ?? 0,
    level: d.level ?? 1,
    missionsCompleted: d.missionsCompleted ?? 0,
    checkins: d.checkins ?? [],
    pushToken: d.pushToken,
    acceptedTermsAt: toDate(d.acceptedTermsAt),
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
}

const mapFeed = (id: string, d: DocumentData): FeedEvent => ({
  id,
  userId: d.userId,
  userName: d.userName,
  userAvatar: d.userAvatar,
  userLevel: d.userLevel,
  type: d.type,
  content: d.content ?? '',
  imageUrl: d.imageUrl,
  missionTitle: d.missionTitle ?? '',
  rating: d.rating,
  kudosCount: d.kudosCount ?? 0,
  kudosUsers: d.kudosUsers ?? [],
  commentsCount: d.commentsCount ?? 0,
  createdAt: toDate(d.createdAt),
});

/** Remove chaves undefined (o Firestore rejeita undefined). */
function clean<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

async function deleteInChunks(db: Firestore, refs: DocumentReference[]) {
  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(db);
    refs.slice(i, i + 400).forEach((r) => batch.delete(r));
    await batch.commit();
  }
}

export function createFirebaseBackend(): Backend {
  const { auth, db, storage } = getFirebase();
  let missionsCache: Mission[] | null = null;
  let achievementsCache: Achievement[] | null = null;

  const notify = async (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
    try {
      const r = doc(collection(db, 'notifications'));
      await setDoc(r, clean({ ...n, read: false, createdAt: serverTimestamp() }));
    } catch (e) {
      console.warn('[notify]', e);
    }
  };

  const backend: Backend = {
    mode: 'firebase',

    onAuthChange(cb) {
      return onAuthStateChanged(auth, (u) => cb(u ? mapAuthUser(u) : null));
    },

    async signIn(email, password) {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    },

    async signUp(name, email, password) {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name.trim() });
      await backend.ensureProfile(mapAuthUser(cred.user), name.trim());
      await sendEmailVerification(cred.user);
    },

    async signInWithGoogle() {
      if (isNative()) {
        // Popups não funcionam no WebView: login nativo + credencial no JS SDK.
        const res = await FirebaseAuthentication.signInWithGoogle();
        const idToken = res.credential?.idToken;
        if (!idToken) throw new Error('Login com Google cancelado.');
        const cred = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
        await backend.ensureProfile(mapAuthUser(cred.user));
        return;
      }
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      await backend.ensureProfile(mapAuthUser(cred.user));
    },

    async resendVerification() {
      if (auth.currentUser) await sendEmailVerification(auth.currentUser);
    },

    async reloadUser() {
      if (!auth.currentUser) return null;
      await auth.currentUser.reload();
      // força refresh do token para que as regras vejam email_verified
      await auth.currentUser.getIdToken(true);
      return mapAuthUser(auth.currentUser);
    },

    async resetPassword(email) {
      await sendPasswordResetEmail(auth, email.trim());
    },

    async signOut() {
      if (isNative()) await FirebaseAuthentication.signOut().catch(() => undefined);
      await fbSignOut(auth);
    },

    async deleteAccount(password) {
      const user = auth.currentUser;
      if (!user) throw new Error('Nenhum usuário autenticado.');
      const uid = user.uid;

      // 1) Reautentica ANTES de apagar dados, para garantir que o deleteUser final não falhe.
      const providers = user.providerData.map((p) => p.providerId);
      if (providers.includes('password')) {
        if (!password) throw new Error('Informe sua senha para confirmar a exclusão.');
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email ?? '', password));
      } else if (providers.includes('google.com')) {
        if (isNative()) {
          const res = await FirebaseAuthentication.signInWithGoogle();
          const idToken = res.credential?.idToken;
          if (!idToken) throw new Error('Reautenticação cancelada.');
          await reauthenticateWithCredential(user, GoogleAuthProvider.credential(idToken));
        } else {
          await reauthenticateWithPopup(user, new GoogleAuthProvider());
        }
      }

      // 2) Apaga dados pessoais (Firestore).
      const refs: DocumentReference[] = [];
      const [checkins, feed, friendships, notifs, myComments] = await Promise.all([
        getDocs(query(collection(db, 'checkins'), where('userId', '==', uid))),
        getDocs(query(collection(db, 'feedEvents'), where('userId', '==', uid))),
        getDocs(query(collection(db, 'friendships'), where('users', 'array-contains', uid))),
        getDocs(query(collection(db, 'notifications'), where('targetUserId', '==', uid))),
        getDocs(query(collectionGroup(db, 'comments'), where('userId', '==', uid))),
      ]);
      for (const ev of feed.docs) {
        const comments = await getDocs(collection(ev.ref, 'comments'));
        comments.forEach((c) => refs.push(c.ref));
        refs.push(ev.ref);
      }
      [checkins, friendships, notifs, myComments].forEach((s) => s.forEach((d) => refs.push(d.ref)));
      await deleteInChunks(db, [...new Map(refs.map((r) => [r.path, r])).values()]);

      // 3) Apaga fotos (Storage).
      try {
        const folder = await listAll(ref(storage, `checkins/${uid}`));
        await Promise.all(folder.items.map((item) => deleteObject(item)));
      } catch (e) {
        console.warn('[deleteAccount] storage', e);
      }

      // 4) Perfil e conta.
      await deleteDoc(doc(db, 'users', uid));
      await deleteUser(user);
      if (isNative()) await FirebaseAuthentication.signOut().catch(() => undefined);
    },

    subscribeProfile(uid, cb) {
      return onSnapshot(
        doc(db, 'users', uid),
        (snap) => cb(snap.exists() ? mapProfile(snap.id, snap.data()) : null),
        (err) => {
          console.warn('[profile]', err);
          cb(null);
        },
      );
    },

    async ensureProfile(user, name) {
      const r = doc(db, 'users', user.uid);
      const snap = await getDoc(r);
      if (snap.exists()) return;
      const displayName = name || user.displayName || user.email?.split('@')[0] || 'Explorador';
      await setDoc(r, {
        name: displayName,
        nameLower: displayName.toLowerCase(),
        email: user.email ?? '',
        avatarUrl: user.photoURL || defaultAvatar(user.uid),
        points: 0,
        level: 1,
        missionsCompleted: 0,
        checkins: [],
        acceptedTermsAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },

    async savePushToken(uid, token) {
      await updateDoc(doc(db, 'users', uid), { pushToken: token, updatedAt: serverTimestamp() });
    },

    async getMissions() {
      if (missionsCache) return missionsCache;
      const snap = await getDocs(collection(db, 'missions'));
      missionsCache = snap.docs.map((d) => {
        const x = d.data();
        return {
          id: d.id,
          title: x.title,
          description: x.description ?? '',
          points: x.points ?? 0,
          category: x.category ?? 'explorador',
          lat: x.lat,
          lng: x.lng,
          image: x.image,
          completions: x.completions ?? 0,
          isDoublePoints: x.isDoublePoints,
          matchPercentage: x.matchPercentage,
          timeLimit: x.timeLimit,
        } satisfies Mission;
      });
      return missionsCache;
    },

    async getAchievements() {
      if (achievementsCache) return achievementsCache;
      const snap = await getDocs(collection(db, 'achievements'));
      achievementsCache = snap.docs.map((d) => {
        const x = d.data();
        return {
          id: d.id,
          title: x.title,
          description: x.description ?? '',
          requiredMissions: x.requiredMissions ?? [],
          rewardPoints: x.rewardPoints ?? 0,
          icon: x.icon ?? 'route',
          bannerUrl: x.bannerUrl,
        } satisfies Achievement;
      });
      return achievementsCache;
    },

    async performCheckin(profile: UserProfile, input: CheckinInput): Promise<CheckinResult> {
      const { mission } = input;
      if (profile.checkins.includes(mission.id)) throw new Error('Você já fez check-in neste local.');
      const achievements = await backend.getAchievements();

      let photoUrl: string | undefined;
      if (input.photoDataUrl) {
        const photoRef = ref(storage, `checkins/${profile.id}/${Date.now()}_${mission.id}.jpg`);
        await uploadString(photoRef, input.photoDataUrl, 'data_url');
        photoUrl = await getDownloadURL(photoRef);
      }

      const userRef = doc(db, 'users', profile.id);
      const result = await runTransaction(db, async (tx) => {
        const snap = await tx.get(userRef);
        if (!snap.exists()) throw new Error('Perfil não encontrado.');
        const fresh = mapProfile(snap.id, snap.data());
        if (fresh.checkins.includes(mission.id)) throw new Error('Você já fez check-in neste local.');

        const reward = computeCheckinReward(mission, achievements, fresh.points, fresh.checkins);

        tx.update(userRef, {
          points: reward.newTotal,
          level: reward.newLevel,
          missionsCompleted: increment(1),
          checkins: arrayUnion(mission.id),
          updatedAt: serverTimestamp(),
        });
        tx.update(doc(db, 'missions', mission.id), { completions: increment(1) });

        const checkinRef = doc(collection(db, 'checkins'));
        tx.set(
          checkinRef,
          clean({
            userId: fresh.id,
            userName: fresh.name,
            userAvatar: fresh.avatarUrl,
            missionId: mission.id,
            missionTitle: mission.title,
            lat: input.lat,
            lng: input.lng,
            photoUrl,
            rating: input.rating,
            comment: input.comment.trim(),
            pointsEarned: reward.pointsEarned,
            createdAt: serverTimestamp(),
          }),
        );

        const base = { userId: fresh.id, userName: fresh.name, userAvatar: fresh.avatarUrl, userLevel: reward.newLevel };
        tx.set(
          doc(collection(db, 'feedEvents')),
          clean({
            ...base,
            type: 'checkin',
            content: input.comment.trim(),
            imageUrl: photoUrl ?? mission.image,
            missionTitle: mission.title,
            rating: input.rating,
            kudosCount: 0,
            kudosUsers: [],
            commentsCount: 0,
            createdAt: serverTimestamp(),
          }),
        );
        for (const a of reward.completedAchievements) {
          tx.set(
            doc(collection(db, 'feedEvents')),
            clean({
              ...base,
              type: 'mission',
              content: `Completou a trilha "${a.title}" e ganhou +${a.rewardPoints} pts de bônus!`,
              imageUrl: a.bannerUrl,
              missionTitle: a.title,
              kudosCount: 0,
              kudosUsers: [],
              commentsCount: 0,
              createdAt: serverTimestamp(),
            }),
          );
        }
        return reward;
      });

      if (missionsCache) {
        missionsCache = missionsCache.map((m) => (m.id === mission.id ? { ...m, completions: m.completions + 1 } : m));
      }
      return {
        pointsEarned: result.pointsEarned,
        bonusPoints: result.bonusPoints,
        completedAchievements: result.completedAchievements,
        newTotal: result.newTotal,
        leveledUp: result.leveledUp,
      };
    },

    subscribeFeed(cb, opts) {
      const max = opts?.max ?? 50;
      const q = opts?.userId
        ? query(collection(db, 'feedEvents'), where('userId', '==', opts.userId), orderBy('createdAt', 'desc'), limit(max))
        : query(collection(db, 'feedEvents'), orderBy('createdAt', 'desc'), limit(max));
      return onSnapshot(
        q,
        (snap) => cb(snap.docs.map((d) => mapFeed(d.id, d.data({ serverTimestamps: 'estimate' })))),
        (err) => console.warn('[feed]', err),
      );
    },

    async toggleKudos(event, profile) {
      const r = doc(db, 'feedEvents', event.id);
      const liked = event.kudosUsers.includes(profile.id);
      await updateDoc(r, {
        kudosUsers: liked ? arrayRemove(profile.id) : arrayUnion(profile.id),
        kudosCount: increment(liked ? -1 : 1),
      });
      if (!liked && event.userId !== profile.id) {
        await notify({
          targetUserId: event.userId,
          type: 'like',
          sourceUserName: profile.name,
          sourceUserAvatar: profile.avatarUrl,
          postId: event.id,
        });
      }
    },

    subscribeComments(eventId, cb) {
      const q = query(collection(db, 'feedEvents', eventId, 'comments'), orderBy('createdAt', 'asc'), limit(200));
      return onSnapshot(
        q,
        (snap) =>
          cb(
            snap.docs.map((d) => {
              const x = d.data({ serverTimestamps: 'estimate' });
              return {
                id: d.id,
                userId: x.userId,
                userName: x.userName,
                userAvatar: x.userAvatar,
                text: x.text,
                createdAt: toDate(x.createdAt),
              } satisfies FeedComment;
            }),
          ),
        (err) => console.warn('[comments]', err),
      );
    },

    async addComment(event, profile, text) {
      const body = text.trim().slice(0, 500);
      if (!body) return;
      const batch = writeBatch(db);
      batch.set(doc(collection(db, 'feedEvents', event.id, 'comments')), {
        userId: profile.id,
        userName: profile.name,
        userAvatar: profile.avatarUrl,
        text: body,
        createdAt: serverTimestamp(),
      });
      batch.update(doc(db, 'feedEvents', event.id), { commentsCount: increment(1) });
      await batch.commit();
      if (event.userId !== profile.id) {
        await notify({
          targetUserId: event.userId,
          type: 'comment',
          sourceUserName: profile.name,
          sourceUserAvatar: profile.avatarUrl,
          postId: event.id,
        });
      }
    },

    async deleteFeedEvent(event) {
      const comments = await getDocs(collection(db, 'feedEvents', event.id, 'comments'));
      await deleteInChunks(db, [...comments.docs.map((d) => d.ref), doc(db, 'feedEvents', event.id)]);
    },

    subscribeNotifications(uid, cb) {
      const q = query(
        collection(db, 'notifications'),
        where('targetUserId', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(40),
      );
      return onSnapshot(
        q,
        (snap) =>
          cb(
            snap.docs.map((d) => {
              const x = d.data({ serverTimestamps: 'estimate' });
              return {
                id: d.id,
                targetUserId: x.targetUserId,
                type: x.type,
                sourceUserName: x.sourceUserName,
                sourceUserAvatar: x.sourceUserAvatar,
                postId: x.postId,
                read: !!x.read,
                createdAt: toDate(x.createdAt),
              } satisfies AppNotification;
            }),
          ),
        (err) => console.warn('[notifications]', err),
      );
    },

    async markNotificationsRead(ids) {
      if (!ids.length) return;
      const batch = writeBatch(db);
      ids.forEach((id) => batch.update(doc(db, 'notifications', id), { read: true }));
      await batch.commit();
    },

    async getRanking(period) {
      if (period === 'all') {
        const snap = await getDocs(query(collection(db, 'users'), orderBy('points', 'desc'), limit(50)));
        return snap.docs.map((d) => {
          const p = mapProfile(d.id, d.data());
          return { userId: p.id, name: p.name, avatarUrl: p.avatarUrl, points: p.points, level: p.level };
        });
      }
      const snap = await getDocs(
        query(collection(db, 'checkins'), where('createdAt', '>=', Timestamp.fromDate(startOfWeek())), limit(1000)),
      );
      const totals = new Map<string, RankingEntry>();
      snap.forEach((d) => {
        const x = d.data();
        const cur = totals.get(x.userId) ?? { userId: x.userId, name: x.userName, avatarUrl: x.userAvatar ?? defaultAvatar(x.userId), points: 0, level: 1 };
        cur.points += x.pointsEarned ?? 0;
        totals.set(x.userId, cur);
      });
      const top = [...totals.values()].sort((a, b) => b.points - a.points).slice(0, 50);
      // completa nome/avatar/nível atuais a partir dos perfis
      for (let i = 0; i < top.length; i += 30) {
        const chunk = top.slice(i, i + 30);
        const users = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', chunk.map((c) => c.userId))));
        users.forEach((u) => {
          const p = mapProfile(u.id, u.data());
          const e = chunk.find((c) => c.userId === u.id);
          if (e) Object.assign(e, { name: p.name, avatarUrl: p.avatarUrl, level: p.level });
        });
      }
      return top;
    },

    subscribeFriendships(uid, cb) {
      const q = query(collection(db, 'friendships'), where('users', 'array-contains', uid));
      return onSnapshot(
        q,
        (snap) =>
          cb(
            snap.docs.map((d) => {
              const x = d.data({ serverTimestamps: 'estimate' });
              return { id: d.id, ...x, createdAt: toDate(x.createdAt) } as Friendship;
            }),
          ),
        (err) => console.warn('[friendships]', err),
      );
    },

    async searchUsers(term, excludeUid) {
      const t = term.trim().toLowerCase();
      if (t.length < 2) return [];
      const snap = await getDocs(
        query(collection(db, 'users'), where('nameLower', '>=', t), where('nameLower', '<=', `${t}`), limit(20)),
      );
      return snap.docs
        .filter((d) => d.id !== excludeUid)
        .map((d) => {
          const p = mapProfile(d.id, d.data());
          return { userId: p.id, name: p.name, avatarUrl: p.avatarUrl, points: p.points, level: p.level };
        });
    },

    async sendFriendRequest(from, to) {
      const id = friendshipId(from.id, to.userId);
      await setDoc(doc(db, 'friendships', id), {
        users: [from.id, to.userId],
        requesterId: from.id,
        requesterName: from.name,
        requesterAvatar: from.avatarUrl,
        targetId: to.userId,
        targetName: to.name,
        targetAvatar: to.avatarUrl,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      await notify({
        targetUserId: to.userId,
        type: 'friend_request',
        sourceUserName: from.name,
        sourceUserAvatar: from.avatarUrl,
      });
    },

    async respondFriendRequest(f, accept) {
      const r = doc(db, 'friendships', f.id);
      if (accept) await updateDoc(r, { status: 'accepted' });
      else await deleteDoc(r);
    },

    async removeFriend(f) {
      await deleteDoc(doc(db, 'friendships', f.id));
    },
  };

  return backend;
}
