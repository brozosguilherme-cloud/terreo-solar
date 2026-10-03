import { LocateFixed, MapPin, MapPinOff, Navigation, Settings, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { isNative, type LocationStatus } from '../lib/native';
import { BottomSheet } from './BottomSheet';
import { Button, cn } from './ui';

type Copy = { icon: typeof MapPin; title: string; text: string; cta: string };

const COPY: Record<Exclude<LocationStatus, 'granted'>, Copy> = {
  prompt: {
    icon: MapPin,
    title: 'Ative sua localização',
    text: 'O AppNix usa sua localização para mostrar a distância até cada missão e validar o check-in quando você chega ao local.',
    cta: 'Permitir localização',
  },
  denied: {
    icon: MapPinOff,
    title: 'Localização bloqueada',
    text: isNative()
      ? 'Você negou o acesso à localização. Para fazer check-ins, abra as configurações do app e, em Permissões › Localização, escolha "Permitir durante o uso do app".'
      : 'Seu navegador bloqueou a localização. Toque no cadeado ao lado do endereço do site e permita o acesso à localização.',
    cta: isNative() ? 'Abrir configurações' : 'Tentar novamente',
  },
  disabled: {
    icon: MapPinOff,
    title: 'GPS desligado',
    text: 'A localização do aparelho está desativada. Ligue o GPS para ver distâncias e fazer check-ins.',
    cta: isNative() ? 'Ativar GPS' : 'Tentar novamente',
  },
  unsupported: {
    icon: MapPinOff,
    title: 'Localização indisponível',
    text: 'Este navegador não oferece geolocalização. Instale o app Android para fazer check-ins.',
    cta: 'Entendi',
  },
};

/** Ação principal conforme o estado: pedir, abrir configurações ou ligar o GPS. */
export function useLocationAction() {
  const { locationStatus, requestLocation, openLocationSettings, setLocationSheetOpen, toast } = useApp();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      if (locationStatus === 'denied' && isNative()) {
        await openLocationSettings('app');
        return; // o status é reavaliado quando o app volta ao primeiro plano
      }
      if (locationStatus === 'disabled' && isNative()) {
        await openLocationSettings('location');
        return;
      }
      if (locationStatus === 'unsupported') {
        setLocationSheetOpen(false);
        return;
      }
      const next = await requestLocation();
      if (next === 'granted') {
        setLocationSheetOpen(false);
        toast('Localização ativada!', 'success');
      }
    } finally {
      setBusy(false);
    }
  };

  return { run, busy };
}

/** Bottom sheet explicativo (pré-permissão), aberto pelo AppShell ou pelos banners. */
export function LocationSheet() {
  const { locationStatus, locationSheetOpen, setLocationSheetOpen } = useApp();
  const { run, busy } = useLocationAction();
  if (!locationStatus || locationStatus === 'granted') return null;
  const c = COPY[locationStatus];

  return (
    <BottomSheet
      open={locationSheetOpen}
      onClose={() => setLocationSheetOpen(false)}
      footer={
        <div className="space-y-2">
          <Button className="w-full" onClick={run} loading={busy}>
            {locationStatus === 'prompt' ? <LocateFixed /> : <Settings />} {c.cta}
          </Button>
          {locationStatus !== 'unsupported' && (
            <Button variant="ghost" className="w-full" onClick={() => setLocationSheetOpen(false)}>
              Agora não
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col items-center px-gutter pb-4 text-center">
        <div className={cn('flex size-20 items-center justify-center rounded-full', locationStatus === 'prompt' ? 'bg-secondary' : 'bg-danger-soft')}>
          <c.icon className={cn('size-9', locationStatus === 'prompt' ? 'text-primary' : 'text-danger-ink')} />
        </div>
        <h2 className="mt-5 type-title2">{c.title}</h2>
        <p className="mt-2 type-body text-muted">{c.text}</p>
        {locationStatus === 'prompt' && (
          <ul className="mt-5 w-full space-y-2 text-left">
            {[
              { icon: Navigation, text: 'Distância real até cada missão e trilha' },
              { icon: MapPin, text: 'Check-in liberado quando você chega ao local' },
              { icon: ShieldCheck, text: 'Usada só com o app aberto, nunca em segundo plano' },
            ].map((i) => (
              <li key={i.text} className="flex items-center gap-3 rounded-control bg-bg px-4 py-3">
                <i.icon className="size-4 shrink-0 text-primary" />
                <span className="type-callout">{i.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </BottomSheet>
  );
}

/** Faixa compacta exibida enquanto a localização não estiver liberada. */
export function LocationBanner({ className }: { className?: string }) {
  const { locationStatus, setLocationSheetOpen } = useApp();
  if (!locationStatus || locationStatus === 'granted') return null;
  const blocked = locationStatus !== 'prompt';
  return (
    <button
      onClick={() => setLocationSheetOpen(true)}
      className={cn('flex w-full items-center gap-3 rounded-card p-4 text-left shadow-card transition-all active:scale-[0.98]', blocked ? 'bg-danger-soft' : 'bg-secondary', className)}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface">
        {blocked ? <MapPinOff className="size-5 text-danger-ink" /> : <MapPin className="size-5 text-primary" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block type-body-strong">{blocked ? COPY[locationStatus].title : 'Ative sua localização'}</span>
        <span className="block type-caption text-muted">Distâncias e check-in dependem dela</span>
      </span>
      <span className={cn('type-label', blocked ? 'text-danger-ink' : 'text-primary-strong')}>Ativar</span>
    </button>
  );
}
