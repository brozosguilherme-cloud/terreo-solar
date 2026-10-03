import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, indexedDBLocalPersistence, initializeAuth, type Auth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { Capacitor } from '@capacitor/core';

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

export function getFirebase() {
  if (!isFirebaseConfigured) throw new Error('Firebase não configurado (defina as variáveis VITE_FIREBASE_*).');
  if (!app) {
    app = initializeApp(firebaseConfig);
    // No WebView do Capacitor o getAuth() padrão tenta popups/iframes; usamos IndexedDB direto.
    auth = Capacitor.isNativePlatform()
      ? initializeAuth(app, { persistence: indexedDBLocalPersistence })
      : getAuth(app);
    auth.languageCode = 'pt';
    db = initializeFirestore(app, { localCache: persistentLocalCache() });
    storage = getStorage(app);
  }
  return { app, auth: auth!, db: db!, storage: storage! };
}
