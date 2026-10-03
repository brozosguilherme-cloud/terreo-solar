export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Distância em metros entre dois pontos (fórmula de Haversine). */
export function haversineDistance(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistance(meters: number | null | undefined): string {
  if (meters == null || !Number.isFinite(meters)) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  return `${km < 10 ? km.toFixed(1).replace('.', ',') : Math.round(km)} km`;
}

export const CHECKIN_RADIUS_METERS = Number(import.meta.env.VITE_CHECKIN_RADIUS_METERS) || 150;

export function isWithinCheckinRadius(user: LatLng, target: LatLng, radius = CHECKIN_RADIUS_METERS): boolean {
  return haversineDistance(user, target) <= radius;
}

/** Link universal para traçar rota (abre o app do Google Maps no Android). */
export function directionsUrl(target: LatLng, origin?: LatLng | null): string {
  const params = new URLSearchParams({ api: '1', destination: `${target.lat},${target.lng}`, travelmode: 'walking' });
  if (origin) params.set('origin', `${origin.lat},${origin.lng}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
