import { describe, expect, it } from 'vitest';
import { formatDistance, haversineDistance, isWithinCheckinRadius } from '../lib/geo';

const MASP = { lat: -23.561414, lng: -46.655881 };
const SE = { lat: -23.551038, lng: -46.634206 };

describe('haversineDistance', () => {
  it('é zero para o mesmo ponto', () => {
    expect(haversineDistance(MASP, MASP)).toBe(0);
  });
  it('MASP → Catedral da Sé ≈ 2,5 km', () => {
    const d = haversineDistance(MASP, SE);
    expect(d).toBeGreaterThan(2400);
    expect(d).toBeLessThan(2600);
  });
  it('é simétrica', () => {
    expect(haversineDistance(MASP, SE)).toBeCloseTo(haversineDistance(SE, MASP), 6);
  });
});

describe('raio de check-in', () => {
  it('aceita dentro e recusa fora do raio', () => {
    expect(isWithinCheckinRadius({ lat: MASP.lat + 0.0005, lng: MASP.lng }, MASP, 150)).toBe(true); // ~55 m
    expect(isWithinCheckinRadius({ lat: MASP.lat + 0.003, lng: MASP.lng }, MASP, 150)).toBe(false); // ~330 m
  });
});

describe('formatDistance', () => {
  it('formata metros e quilômetros em pt-BR', () => {
    expect(formatDistance(42.4)).toBe('42 m');
    expect(formatDistance(2500)).toBe('2,5 km');
    expect(formatDistance(12_600)).toBe('13 km');
    expect(formatDistance(null)).toBe('—');
  });
});
