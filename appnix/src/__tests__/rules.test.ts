import { describe, expect, it } from 'vitest';
import { SEED_ACHIEVEMENTS, SEED_MISSIONS } from '../data/seed';
import { achievementProgress, computeCheckinReward, missionPoints, newlyCompletedAchievements } from '../services/rules';

const mission = (id: string) => SEED_MISSIONS.find((m) => m.id === id)!;

describe('pontuação de check-in', () => {
  it('aplica pontos em dobro', () => {
    expect(missionPoints({ points: 200, isDoublePoints: true })).toBe(400);
    expect(missionPoints({ points: 200 })).toBe(200);
  });

  it('concede bônus ao completar a trilha (uma única vez)', () => {
    const prev = ['patio-colegio', 'catedral-se', 'theatro-municipal'];
    const done = newlyCompletedAchievements(SEED_ACHIEVEMENTS, prev, 'pinacoteca');
    expect(done.map((a) => a.id)).toEqual(['circuito-historico']);
    // já completa antes → não repete
    expect(newlyCompletedAchievements(SEED_ACHIEVEMENTS, [...prev, 'pinacoteca'], 'pinacoteca')).toEqual([]);
  });

  it('soma pontos, bônus e detecta subida de nível', () => {
    const r = computeCheckinReward(mission('pinacoteca'), SEED_ACHIEVEMENTS, 0, ['patio-colegio', 'catedral-se', 'theatro-municipal']);
    expect(r.pointsEarned).toBe(250);
    expect(r.bonusPoints).toBe(500);
    expect(r.newTotal).toBe(750);
    expect(r.newLevel).toBe(2);
    expect(r.leveledUp).toBe(true);
  });

  it('calcula progresso da trilha', () => {
    const a = SEED_ACHIEVEMENTS.find((x) => x.id === 'rota-gastronomica')!;
    expect(achievementProgress(a, ['mercadao'])).toEqual({ done: 1, total: 3, percent: 33 });
  });
});
