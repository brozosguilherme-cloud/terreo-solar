import { App as CapApp } from '@capacitor/app';
import { AnimatePresence, motion } from 'motion/react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useApp, type Tab } from '../hooks/useApp';
import { isNative } from '../lib/native';
import { CheckinScreen } from '../screens/CheckinScreen';
import { FeedScreen } from '../screens/FeedScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen, VerifyEmailScreen } from '../screens/LoginScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SocialScreen } from '../screens/SocialScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { BottomNav } from './BottomNav';
import { LocationSheet } from './LocationPermission';
import { Spinner } from './ui';

// Leaflet só é carregado quando o mapa é aberto.
const MapScreen = lazy(() => import('../screens/MapScreen').then((m) => ({ default: m.MapScreen })));

const SCREENS: Record<Tab, React.ComponentType> = {
  home: HomeScreen,
  map: MapScreen,
  checkin: CheckinScreen,
  feed: FeedScreen,
  social: SocialScreen,
  profile: ProfileScreen,
};

const MIN_SPLASH_MS = 1200;

export function AppShell() {
  const { authReady, authUser, profile, tab, setTab, backend, locationStatus, setLocationSheetOpen } = useApp();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  // Botão "voltar" do Android: volta para o início antes de minimizar.
  useEffect(() => {
    if (!isNative()) return;
    const sub = CapApp.addListener('backButton', () => {
      if (tab !== 'home') setTab('home');
      else CapApp.minimizeApp();
    });
    return () => {
      sub.then((s) => s.remove());
    };
  }, [tab, setTab]);

  const needsVerification = backend.mode === 'firebase' && !!authUser && authUser.providers.includes('password') && !authUser.emailVerified;

  let stage: 'splash' | 'login' | 'verify' | 'app';
  if (!authReady || !splashDone) stage = 'splash';
  else if (!authUser) stage = 'login';
  else if (needsVerification) stage = 'verify';
  else if (!profile) stage = 'splash';
  else stage = 'app';

  const Screen = SCREENS[tab];

  // Pré-permissão: explica o uso da localização antes do diálogo do sistema (uma vez por sessão).
  const askedLocation = useRef(false);
  useEffect(() => {
    if (stage !== 'app' || askedLocation.current || locationStatus !== 'prompt') return;
    askedLocation.current = true;
    const t = setTimeout(() => setLocationSheetOpen(true), 700);
    return () => clearTimeout(t);
  }, [stage, locationStatus, setLocationSheetOpen]);

  return (
    <AnimatePresence mode="wait">
      <motion.div key={stage} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
        {stage === 'splash' && <SplashScreen />}
        {stage === 'login' && <LoginScreen />}
        {stage === 'verify' && <VerifyEmailScreen />}
        {stage === 'app' && (
          <>
            <AnimatePresence mode="wait" initial={false}>
              <motion.main
                key={tab}
                className="absolute inset-0"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <Suspense
                  fallback={
                    <div className="flex h-full items-center justify-center">
                      <Spinner className="size-7 text-primary" />
                    </div>
                  }
                >
                  <Screen />
                </Suspense>
              </motion.main>
            </AnimatePresence>
            <BottomNav />
            <LocationSheet />
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
