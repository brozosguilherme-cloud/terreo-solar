import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Preferences } from '@capacitor/preferences';
import { PushNotifications } from '@capacitor/push-notifications';
import { AndroidSettings, NativeSettings } from 'capacitor-native-settings';
import type { LatLng } from './geo';

export const isNative = () => Capacitor.isNativePlatform();

export interface Position extends LatLng {
  accuracy: number;
}

/**
 * Estado da permissão de localização:
 * - prompt: ainda não perguntamos (ou o Android permite perguntar de novo)
 * - granted: liberada
 * - denied: negada (no Android, após 2 negativas só pelas configurações)
 * - disabled: GPS/serviços de localização desligados no aparelho
 * - unsupported: navegador sem geolocalização
 */
export type LocationStatus = 'prompt' | 'granted' | 'denied' | 'disabled' | 'unsupported';

const isDisabledError = (e: unknown) => /not enabled|disabled|GLOC-00(07|09)/i.test(String((e as Error)?.message ?? e) + String((e as { code?: string })?.code ?? ''));

function mapState(state: string): LocationStatus {
  if (state === 'granted') return 'granted';
  if (state === 'denied') return 'denied';
  return 'prompt'; // 'prompt' | 'prompt-with-rationale'
}

/** Consulta a permissão SEM abrir o diálogo do sistema. */
export async function checkLocationStatus(): Promise<LocationStatus> {
  if (isNative()) {
    try {
      return mapState((await Geolocation.checkPermissions()).location);
    } catch (e) {
      return isDisabledError(e) ? 'disabled' : 'prompt';
    }
  }
  if (!('geolocation' in navigator)) return 'unsupported';
  try {
    const res = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return mapState(res.state);
  } catch {
    return 'prompt';
  }
}

/** Abre o diálogo do sistema pedindo a localização. */
export async function requestLocationPermission(): Promise<LocationStatus> {
  if (isNative()) {
    try {
      return mapState((await Geolocation.requestPermissions({ permissions: ['location'] })).location);
    } catch (e) {
      return isDisabledError(e) ? 'disabled' : 'denied';
    }
  }
  if (!('geolocation' in navigator)) return 'unsupported';
  // na web o pedido acontece ao tentar ler a posição
  return new Promise((resolve) =>
    navigator.geolocation.getCurrentPosition(
      () => resolve('granted'),
      (err) => resolve(err.code === err.PERMISSION_DENIED ? 'denied' : 'disabled'),
      { enableHighAccuracy: true, timeout: 15000 },
    ),
  );
}

/** Abre as configurações do Android: do app (permissões) ou de localização (GPS). */
export async function openLocationSettings(target: 'app' | 'location'): Promise<boolean> {
  if (!isNative()) return false;
  try {
    await NativeSettings.openAndroid({ option: target === 'app' ? AndroidSettings.ApplicationDetails : AndroidSettings.Location });
    return true;
  } catch {
    return false;
  }
}

export class LocationError extends Error {
  constructor(public status: LocationStatus, message: string) {
    super(message);
  }
}

export async function getCurrentPosition(): Promise<Position> {
  try {
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
  } catch (e) {
    if (isDisabledError(e)) throw new LocationError('disabled', 'O GPS do aparelho está desligado.');
    if (/denied|permission/i.test(String((e as Error)?.message))) throw new LocationError('denied', 'Permissão de localização negada.');
    throw new LocationError('granted', 'Não foi possível obter sua localização agora.');
  }
}

/** Observa a posição em alta precisão. Retorna função para cancelar. */
export function watchPosition(onPos: (p: Position) => void, onError?: (e: LocationError) => void): () => void {
  let id: string | null = null;
  let cancelled = false;
  Geolocation.watchPosition({ enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }, (pos, err) => {
    if (err) {
      const status: LocationStatus = isDisabledError(err) ? 'disabled' : /denied|permission/i.test(String(err?.message)) ? 'denied' : 'granted';
      return onError?.(new LocationError(status, String(err?.message ?? err)));
    }
    if (pos) onPos({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
  })
    .then((watchId) => {
      if (cancelled) Geolocation.clearWatch({ id: watchId });
      else id = watchId;
    })
    .catch((e) => onError?.(new LocationError(isDisabledError(e) ? 'disabled' : 'denied', String((e as Error)?.message ?? e))));
  return () => {
    cancelled = true;
    if (id) Geolocation.clearWatch({ id });
  };
}

export interface CapturedPhoto {
  dataUrl: string;
  format: string;
}

/** Abre câmera nativa (ou galeria). Na web cai no input de arquivo do navegador. */
export async function takePhoto(source: 'camera' | 'gallery' | 'prompt' = 'prompt'): Promise<CapturedPhoto | null> {
  try {
    const photo = await Camera.getPhoto({
      quality: 75,
      width: 1440,
      allowEditing: false,
      correctOrientation: true,
      resultType: CameraResultType.DataUrl,
      source: source === 'camera' ? CameraSource.Camera : source === 'gallery' ? CameraSource.Photos : CameraSource.Prompt,
      promptLabelHeader: 'Foto do check-in',
      promptLabelPhoto: 'Escolher da galeria',
      promptLabelPicture: 'Tirar foto',
      promptLabelCancel: 'Cancelar',
    });
    if (!photo.dataUrl) return null;
    return { dataUrl: photo.dataUrl, format: photo.format };
  } catch (e) {
    const msg = String((e as Error)?.message ?? e).toLowerCase();
    if (msg.includes('cancel')) return null;
    throw e;
  }
}

export const prefs = {
  async get(key: string): Promise<string | null> {
    return (await Preferences.get({ key })).value;
  },
  async set(key: string, value: string) {
    await Preferences.set({ key, value });
  },
  async remove(key: string) {
    await Preferences.remove({ key });
  },
};

/** Registra push (FCM) no Android e devolve o token via callback. No-op na web. */
export async function registerPush(onToken: (token: string) => void): Promise<void> {
  // Sem google-services.json o register() derruba o app nativo: só ativa com a flag explícita.
  if (!isNative() || import.meta.env.VITE_ENABLE_PUSH !== 'true') return;
  let perm = await PushNotifications.checkPermissions();
  if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
    perm = await PushNotifications.requestPermissions();
  }
  if (perm.receive !== 'granted') return;
  await PushNotifications.removeAllListeners();
  await PushNotifications.addListener('registration', (t) => onToken(t.value));
  await PushNotifications.addListener('registrationError', (err) => console.warn('[push] erro', err));
  await PushNotifications.register();
}
