import { describe, expect, it } from 'vitest';
import { getUserLevelInfo, LEVEL_TIERS } from '../lib/levels';

describe('getUserLevelInfo', () => {
  it('começa no nível 1 com 0 pontos', () => {
    expect(getUserLevelInfo(0)).toEqual({
      levelNum: 1,
      title: 'Passaporte em Branco',
      currentPontos: 0,
      xpInCurrentLevel: 0,
      nextTierRequiredPontos: 500,
      progressPercent: 0,
      nextTierTitle: 'Explorador de Rotas',
    });
  });

  it('respeita exatamente os limites de cada nível', () => {
    for (const tier of LEVEL_TIERS) {
      expect(getUserLevelInfo(tier.minPontos).levelNum).toBe(tier.level);
      if (tier.minPontos > 0) expect(getUserLevelInfo(tier.minPontos - 1).levelNum).toBe(tier.level - 1);
    }
  });

  it('calcula progresso dentro do nível', () => {
    const info = getUserLevelInfo(2250); // nível 3: 1500 → 3000
    expect(info.levelNum).toBe(3);
    expect(info.title).toBe('Mestre das Coordenadas');
    expect(info.xpInCurrentLevel).toBe(750);
    expect(info.progressPercent).toBe(50);
    expect(info.nextTierRequiredPontos).toBe(3000);
    expect(info.nextTierTitle).toBe('Colecionador de Momentos');
  });

  it('nível máximo tem 100% e sem próximo título', () => {
    const info = getUserLevelInfo(99_999);
    expect(info.levelNum).toBe(10);
    expect(info.title).toBe('Lenda do Mapa');
    expect(info.progressPercent).toBe(100);
    expect(info.nextTierRequiredPontos).toBeNull();
    expect(info.nextTierTitle).toBeNull();
  });

  it('trata valores inválidos como 0', () => {
    expect(getUserLevelInfo(-50).levelNum).toBe(1);
    expect(getUserLevelInfo(Number.NaN).currentPontos).toBe(0);
  });
});
