import type { LatLng } from './geo';

const cache = new Map<string, string>();

/** Geocoding reverso: Google Maps (se houver chave) com fallback para Nominatim (OSM). */
export async function reverseGeocode({ lat, lng }: LatLng): Promise<string | null> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (cache.has(key)) return cache.get(key)!;

  const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  let label: string | null = null;
  try {
    if (googleKey) {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=pt-BR&key=${googleKey}`,
      );
      const json = await res.json();
      label = json?.results?.[0]?.formatted_address ?? null;
    }
    if (!label) {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=pt-BR&zoom=17`,
        { headers: { Accept: 'application/json' } },
      );
      const json = await res.json();
      const a = json?.address ?? {};
      label =
        [a.road, a.suburb ?? a.neighbourhood, a.city ?? a.town ?? a.village].filter(Boolean).join(', ') ||
        json?.display_name ||
        null;
    }
  } catch {
    label = null;
  }
  if (label) cache.set(key, label);
  return label;
}
