import L from 'leaflet';
import { Camera, CheckCircle2, LocateFixed, MapPin, Navigation, Users, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Circle, CircleMarker, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { Button, CATEGORY_META, MissionImage, PointsPill, cn } from '../components/ui';
import { useApp } from '../hooks/useApp';
import { CHECKIN_RADIUS_METERS, directionsUrl, formatDistance, type LatLng } from '../lib/geo';
import type { Mission, MissionCategory } from '../services/types';

const DEFAULT_CENTER: LatLng = { lat: -23.5505, lng: -46.6333 }; // São Paulo

const ICON_PATHS: Record<MissionCategory, string> = {
  turismo: '<path d="M10 18v-7"/><path d="M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M3 22h18"/><path d="M6 18v-7"/>',
  gastronomia: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  explorador: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
};

const iconCache = new Map<string, L.DivIcon>();
function markerIcon(category: MissionCategory, done: boolean, selected: boolean) {
  const key = `${category}-${done}-${selected}`;
  if (iconCache.has(key)) return iconCache.get(key)!;
  const color = done ? '#00D084' : CATEGORY_META[category].color;
  const s = selected ? 52 : 42;
  const html = `
    <div style="width:${s}px;height:${s + 10}px;display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 6px 10px rgba(0,0,0,.25));transition:all .2s">
      <div style="width:${s}px;height:${s}px;border-radius:${s * 0.38}px;background:${color};border:3px solid #fff;display:flex;align-items:center;justify-content:center">
        <svg xmlns="http://www.w3.org/2000/svg" width="${s * 0.46}" height="${s * 0.46}" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${
          done ? '<path d="M20 6 9 17l-5-5"/>' : ICON_PATHS[category]
        }</svg>
      </div>
      <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid #fff;margin-top:-2px"></div>
    </div>`;
  const icon = L.divIcon({ html, className: 'appnix-marker', iconSize: [s, s + 10], iconAnchor: [s / 2, s + 10] });
  iconCache.set(key, icon);
  return icon;
}

/** Tiles do Google Maps Platform (Map Tiles API) quando há chave; senão OpenStreetMap/CARTO. */
function useTileSource() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [google, setGoogle] = useState<string | null>(null);
  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    fetch(`https://tile.googleapis.com/v1/createSession?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mapType: 'roadmap', language: 'pt-BR', region: 'BR' }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j) => !cancelled && j.session && setGoogle(`https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=${j.session}&key=${key}`))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [key]);
  if (google) return { url: google, attribution: '© Google' };
  return {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © CARTO',
  };
}

function MapController({ target }: { target: { center: LatLng; zoom?: number; key: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.center.lat, target.center.lng], target.zoom ?? map.getZoom(), { duration: 0.8 });
  }, [target, map]);
  // corrige tamanho quando a aba fica visível
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export function MapScreen() {
  const { missions, position, distanceTo, profile, openCheckin, positionError } = useApp();
  const [selected, setSelected] = useState<Mission | null>(null);
  const [category, setCategory] = useState<MissionCategory | 'all'>('all');
  const [flyTarget, setFlyTarget] = useState<{ center: LatLng; zoom?: number; key: number } | null>(null);
  const [centeredOnUser, setCenteredOnUser] = useState(false);
  const tiles = useTileSource();
  const checkins = profile?.checkins ?? [];

  useEffect(() => {
    if (position && !centeredOnUser) {
      setFlyTarget({ center: position, zoom: 15, key: Date.now() });
      setCenteredOnUser(true);
    }
  }, [position, centeredOnUser]);

  const visible = useMemo(() => missions.filter((m) => category === 'all' || m.category === category), [missions, category]);
  const d = selected ? distanceTo(selected) : null;
  const done = selected ? checkins.includes(selected.id) : false;
  const inRange = d != null && d <= CHECKIN_RADIUS_METERS;

  return (
    <div className="relative h-full">
      <MapContainer center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]} zoom={13} zoomControl={false} className="absolute inset-0 z-0" attributionControl>
        <TileLayer url={tiles.url} attribution={tiles.attribution} maxZoom={20} />
        <MapController target={flyTarget} />
        {position && (
          <>
            <Circle center={[position.lat, position.lng]} radius={Math.min(position.accuracy, 300)} pathOptions={{ color: '#3B82F6', weight: 0, fillOpacity: 0.12 }} />
            <CircleMarker center={[position.lat, position.lng]} radius={8} pathOptions={{ color: '#fff', weight: 3, fillColor: '#3B82F6', fillOpacity: 1 }} />
          </>
        )}
        {selected && (
          <Circle
            center={[selected.lat, selected.lng]}
            radius={CHECKIN_RADIUS_METERS}
            pathOptions={{ color: CATEGORY_META[selected.category].color, weight: 2, dashArray: '6 6', fillOpacity: 0.12 }}
          />
        )}
        {visible.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={markerIcon(m.category, checkins.includes(m.id), selected?.id === m.id)}
            zIndexOffset={selected?.id === m.id ? 1000 : 0}
            eventHandlers={{
              click: () => {
                setSelected(m);
                setFlyTarget({ center: { lat: m.lat - 0.002, lng: m.lng }, zoom: Math.max(15, 15), key: Date.now() });
              },
            }}
          />
        ))}
      </MapContainer>

      {/* Filtros de categoria */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 pt-safe">
        <div className="no-scrollbar pointer-events-auto flex gap-2 overflow-x-auto px-4 pt-1 pb-2">
          {(['all', 'turismo', 'gastronomia', 'explorador'] as const).map((c) => {
            const meta = c === 'all' ? null : CATEGORY_META[c];
            const active = category === c;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn('flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold shadow-card backdrop-blur-xl', active ? 'bg-ink text-white' : 'bg-white/90 text-ink')}
              >
                {meta ? <meta.icon className="size-4" style={{ color: active ? undefined : meta.color }} /> : <MapPin className="size-4" />}
                {meta?.label ?? 'Todos'}
              </button>
            );
          })}
        </div>
        {positionError && !position && (
          <p className="pointer-events-auto mx-4 rounded-2xl bg-white/95 px-4 py-2.5 text-xs text-muted shadow-card">📍 Ative a localização para ver sua posição e as distâncias.</p>
        )}
      </div>

      <button
        onClick={() => position && setFlyTarget({ center: position, zoom: 16, key: Date.now() })}
        disabled={!position}
        className={cn('absolute right-4 z-10 flex size-12 items-center justify-center rounded-2xl bg-white shadow-float transition-all disabled:opacity-50', selected ? 'bottom-[300px]' : 'bottom-28')}
        aria-label="Centralizar na minha localização"
      >
        <LocateFixed className="size-5 text-primary" />
      </button>

      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="absolute inset-x-4 bottom-28 z-20 overflow-hidden rounded-[28px] bg-white shadow-float"
          >
            <div className="flex gap-3 p-3">
              <MissionImage src={selected.image} category={selected.category} className="size-24 shrink-0 rounded-[20px]" iconSize="size-9" />
              <div className="min-w-0 flex-1 py-0.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg leading-tight font-semibold">{selected.title}</h3>
                  <button onClick={() => setSelected(null)} className="-mt-1 -mr-1 rounded-full p-1.5 text-muted" aria-label="Fechar">
                    <X className="size-4" />
                  </button>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <PointsPill points={selected.points} double={selected.isDoublePoints} />
                  <span className="inline-flex items-center gap-1"><Navigation className="size-3.5" /> {formatDistance(d)}</span>
                  <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {selected.completions}</span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs text-muted">{selected.description}</p>
              </div>
            </div>
            <div className="flex gap-2 px-3 pb-3">
              <a href={directionsUrl(selected, position)} target="_blank" rel="noreferrer" className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl border border-line text-sm font-semibold">
                <Navigation className="size-4" /> Rota
              </a>
              <Button className="h-11 flex-[1.6] text-sm" disabled={done} onClick={() => openCheckin(selected.id)}>
                {done ? <><CheckCircle2 className="size-4" /> Concluída</> : <><Camera className="size-4" /> {inRange ? 'Fazer check-in' : 'Check-in'}</>}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
