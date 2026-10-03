export interface LevelTier {
  level: number;
  minPontos: number;
  title: string;
}

export const LEVEL_TIERS: readonly LevelTier[] = [
  { level: 1, minPontos: 0, title: 'Passaporte em Branco' },
  { level: 2, minPontos: 500, title: 'Explorador de Rotas' },
  { level: 3, minPontos: 1500, title: 'Mestre das Coordenadas' },
  { level: 4, minPontos: 3000, title: 'Colecionador de Momentos' },
  { level: 5, minPontos: 5500, title: 'Titã do Itinerário' },
  { level: 6, minPontos: 9000, title: 'Desbravador de Horizontes' },
  { level: 7, minPontos: 13000, title: 'Cidadão VIP do Mundo' },
  { level: 8, minPontos: 17500, title: 'Arquiteto de Memórias' },
  { level: 9, minPontos: 21000, title: 'Alquimista das Estradas' },
  { level: 10, minPontos: 24000, title: 'Lenda do Mapa' },
];

export interface UserLevelInfo {
  levelNum: number;
  title: string;
  currentPontos: number;
  /** Pontos acumulados dentro do nível atual. */
  xpInCurrentLevel: number;
  /** Pontos totais necessários para o próximo nível (null no nível máximo). */
  nextTierRequiredPontos: number | null;
  /** 0–100. No nível máximo é sempre 100. */
  progressPercent: number;
  nextTierTitle: string | null;
}

export function getUserLevelInfo(xp: number): UserLevelInfo {
  const pontos = Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
  let idx = 0;
  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (pontos >= LEVEL_TIERS[i].minPontos) {
      idx = i;
      break;
    }
  }
  const current = LEVEL_TIERS[idx];
  const next = LEVEL_TIERS[idx + 1] ?? null;
  const xpInCurrentLevel = pontos - current.minPontos;
  const span = next ? next.minPontos - current.minPontos : 0;
  const progressPercent = next ? Math.min(100, Math.round((xpInCurrentLevel / span) * 100)) : 100;

  return {
    levelNum: current.level,
    title: current.title,
    currentPontos: pontos,
    xpInCurrentLevel,
    nextTierRequiredPontos: next ? next.minPontos : null,
    progressPercent,
    nextTierTitle: next ? next.title : null,
  };
}
