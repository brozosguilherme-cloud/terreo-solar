import { AppProvider } from '../hooks/useApp';
import { AppShell } from './AppShell';
import { PORTAL_ID } from './BottomSheet';
import { Toasts } from './Toasts';
import { cn } from './ui';

/**
 * Raiz do aplicativo.
 * - isEmbedded=true: renderiza dentro de uma moldura de smartphone (landing page web).
 * - isEmbedded=false: tela cheia (APK Android / PWA).
 */
export function DeviceFrame({ isEmbedded }: { isEmbedded: boolean }) {
  const screen = (
    <div className={cn('relative isolate overflow-hidden bg-bg', isEmbedded ? 'size-full rounded-[44px]' : 'h-dvh w-full')}>
      <AppProvider>
        <AppShell />
        <div id={PORTAL_ID} className="pointer-events-none absolute inset-0 z-50" />
        <Toasts />
      </AppProvider>
    </div>
  );

  if (!isEmbedded) return screen;

  return (
    <div className="relative h-[844px] w-[400px] shrink-0 rounded-[56px] bg-[#1d1d1f] p-[10px] shadow-[0_40px_80px_-20px_rgb(0_0_0/0.45),inset_0_0_0_2px_#3a3a3c]">
      <div className="pointer-events-none absolute top-[22px] left-1/2 z-[70] h-[30px] w-[110px] -translate-x-1/2 rounded-full bg-black" />
      <div className="size-full [&_.pt-safe]:pt-[52px]">{screen}</div>
    </div>
  );
}
