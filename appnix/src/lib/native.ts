import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Preferences } from '@capacitor/preferences';
import { PushNotifications } from '@capacitor/push-notifications';
import type { LatLng } from './geo';

export const isNative = () => Capacitor.isNativePlatform();

export interface Position extends LatLng {
  accuracy: number;
}

export async function getCurrentPosition(): Promise<Position> {
  if (isNative()) {
    const perm = await Geolocation.checkPermissions();
    if (perm.location !== 'granted') {
      const req = await Geolocation.requestPermissions({ permissions: ['location'] });
      if (req.location !== 'granted') throw new Error('Permissão de localização negada.');
    }
  }
  const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
}

/** Observa a posição em alta precisão. Retorna função para cancelar. */
export function watchPosition(onPos: (p: Position) => void, onError?: (e: Error) => void): () => void {
  let id: string | null = null;
  let cancelled = false;
  Geolocation.watchPosition({ enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }, (pos, err) => {
    if (err) return onError?.(err instanceof Error ? err : new Error(String(err?.message ?? err)));
    if (pos) onPos({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
  })
    .then((watchId) => {
      if (cancelled) Geolocation.clearWatch({ id: watchId });
      else id = watchId;
    })
    .catch((e) => onError?.(e instanceof Error ? e : new Error(String(e))));
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
