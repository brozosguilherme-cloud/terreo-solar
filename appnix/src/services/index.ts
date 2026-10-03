import { isFirebaseConfigured } from '../lib/firebase';
import { createDemoBackend } from './demoBackend';
import { createFirebaseBackend } from './firebaseBackend';
import type { Backend } from './types';

let instance: Backend | null = null;

/** Firebase quando configurado; caso contrário (ou VITE_DEMO_MODE=true) usa o modo demo local. */
export function getBackend(): Backend {
  if (!instance) {
    const forceDemo = import.meta.env.VITE_DEMO_MODE === 'true';
    instance = isFirebaseConfigured && !forceDemo ? createFirebaseBackend() : createDemoBackend();
  }
  return instance;
}

export * from './types';
