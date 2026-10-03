/**
 * Popula `missions` e `achievements` no Firestore com o conteúdo inicial.
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json npm run seed
 *
 * Idempotente: usa os IDs fixos de src/data/seed.ts e faz merge (não zera `completions`).
 */
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { SEED_ACHIEVEMENTS, SEED_MISSIONS } from '../src/data/seed.ts';

initializeApp({ credential: applicationDefault(), projectId: process.env.VITE_FIREBASE_PROJECT_ID });
const db = getFirestore();

const batch = db.batch();
for (const { id, completions: _c, ...m } of SEED_MISSIONS) {
  batch.set(db.collection('missions').doc(id), m, { merge: true });
}
for (const { id, ...a } of SEED_ACHIEVEMENTS) {
  batch.set(db.collection('achievements').doc(id), a, { merge: true });
}
await batch.commit();

// garante o campo completions sem sobrescrever contagens existentes
for (const m of SEED_MISSIONS) {
  const ref = db.collection('missions').doc(m.id);
  const snap = await ref.get();
  if (snap.get('completions') == null) await ref.update({ completions: 0 });
}
console.log(`✔ ${SEED_MISSIONS.length} missões e ${SEED_ACHIEVEMENTS.length} trilhas gravadas.`);
