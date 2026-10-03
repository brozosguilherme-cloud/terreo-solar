export type MissionCategory = 'turismo' | 'gastronomia' | 'explorador';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  points: number;
  level: number;
  missionsCompleted: number;
  checkins: string[];
  pushToken?: string;
  acceptedTermsAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  points: number;
  category: MissionCategory;
  lat: number;
  lng: number;
  image?: string;
  completions: number;
  isDoublePoints?: boolean;
  matchPercentage?: number;
  timeLimit?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  requiredMissions: string[];
  rewardPoints: number;
  icon: string;
  bannerUrl?: string;
}

export interface Checkin {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  missionId: string;
  missionTitle: string;
  lat: number;
  lng: number;
  photoUrl?: string;
  rating: number;
  comment: string;
  pointsEarned: number;
  createdAt: Date | null;
}

export interface FeedEvent {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  /** Nível do autor no momento da publicação (badge no card). */
  userLevel?: number;
  type: 'checkin' | 'mission';
  content: string;
  imageUrl?: string;
  missionTitle: string;
  rating?: number;
  kudosCount: number;
  kudosUsers: string[];
  commentsCount: number;
  createdAt: Date | null;
}

export interface FeedComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: Date | null;
}

export interface AppNotification {
  id: string;
  targetUserId: string;
  type: 'like' | 'comment' | 'friend_request';
  sourceUserName: string;
  sourceUserAvatar?: string;
  postId?: string;
  read: boolean;
  createdAt: Date | null;
}

/** Coleção auxiliar `friendships/{id}` (id = uids ordenados unidos por "_"). */
export interface Friendship {
  id: string;
  users: [string, string];
  requesterId: string;
  requesterName: string;
  requesterAvatar?: string;
  targetId: string;
  targetName: string;
  targetAvatar?: string;
  status: 'pending' | 'accepted';
  createdAt: Date | null;
}

export interface RankingEntry {
  userId: string;
  name: string;
  avatarUrl: string;
  points: number;
  level: number;
}

export interface CheckinInput {
  mission: Mission;
  lat: number;
  lng: number;
  /** Data URL da foto (opcional). */
  photoDataUrl?: string | null;
  rating: number;
  comment: string;
}

export interface CheckinResult {
  pointsEarned: number;
  bonusPoints: number;
  completedAchievements: Achievement[];
  newTotal: number;
  leveledUp: boolean;
}

export type Unsubscribe = () => void;

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providers: string[];
}

export interface Backend {
  readonly mode: 'firebase' | 'demo';

  // Auth
  onAuthChange(cb: (user: AuthUser | null) => void): Unsubscribe;
  signIn(email: string, password: string): Promise<void>;
  signUp(name: string, email: string, password: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
  resendVerification(): Promise<void>;
  reloadUser(): Promise<AuthUser | null>;
  resetPassword(email: string): Promise<void>;
  signOut(): Promise<void>;
  /** LGPD Art. 18 — apaga dados e a conta. `password` para reautenticar contas email/senha. */
  deleteAccount(password?: string): Promise<void>;

  // Perfil
  subscribeProfile(uid: string, cb: (p: UserProfile | null) => void): Unsubscribe;
  ensureProfile(user: AuthUser, name?: string): Promise<void>;
  savePushToken(uid: string, token: string): Promise<void>;

  // Conteúdo
  getMissions(): Promise<Mission[]>;
  getAchievements(): Promise<Achievement[]>;

  // Check-in
  performCheckin(profile: UserProfile, input: CheckinInput): Promise<CheckinResult>;

  // Feed
  subscribeFeed(cb: (events: FeedEvent[]) => void, opts?: { userId?: string; max?: number }): Unsubscribe;
  toggleKudos(event: FeedEvent, profile: UserProfile): Promise<void>;
  subscribeComments(eventId: string, cb: (c: FeedComment[]) => void): Unsubscribe;
  addComment(event: FeedEvent, profile: UserProfile, text: string): Promise<void>;
  deleteFeedEvent(event: FeedEvent): Promise<void>;

  // Notificações
  subscribeNotifications(uid: string, cb: (n: AppNotification[]) => void): Unsubscribe;
  markNotificationsRead(ids: string[]): Promise<void>;

  // Social
  getRanking(period: 'weekly' | 'all'): Promise<RankingEntry[]>;
  subscribeFriendships(uid: string, cb: (f: Friendship[]) => void): Unsubscribe;
  searchUsers(term: string, excludeUid: string): Promise<RankingEntry[]>;
  sendFriendRequest(from: UserProfile, to: RankingEntry): Promise<void>;
  respondFriendRequest(f: Friendship, accept: boolean): Promise<void>;
  removeFriend(f: Friendship): Promise<void>;
}

export const friendshipId = (a: string, b: string) => [a, b].sort().join('_');
