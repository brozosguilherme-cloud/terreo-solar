import { getUserLevelInfo } from '../lib/levels';
import type { Achievement, Mission } from './types';

/** Pontos de uma missão considerando o bônus de pontos em dobro. */
export function missionPoints(m: Pick<Mission, 'points' | 'isDoublePoints'>): number {
  return m.isDoublePoints ? m.points * 2 : m.points;
}

/** Trilhas que passam a estar 100% concluídas com a nova missão. */
export function newlyCompletedAchievements(
  achievements: Achievement[],
  previousCheckins: string[],
  newMissionId: string,
): Achievement[] {
  const before = new Set(previousCheckins);
  const after = new Set([...previousCheckins, newMissionId]);
  return achievements.filter(
    (a) =>
      a.requiredMissions.length > 0 &&
      a.requiredMissions.includes(newMissionId) &&
      !a.requiredMissions.every((id) => before.has(id)) &&
      a.requiredMissions.every((id) => after.has(id)),
  );
}

export function computeCheckinReward(
  mission: Mission,
  achievements: Achievement[],
  currentPoints: number,
  previousCheckins: string[],
) {
  const pointsEarned = missionPoints(mission);
  const completedAchievements = newlyCompletedAchievements(achievements, previousCheckins, mission.id);
  const bonusPoints = completedAchievements.reduce((s, a) => s + a.rewardPoints, 0);
  const newTotal = currentPoints + pointsEarned + bonusPoints;
  const oldLevel = getUserLevelInfo(currentPoints).levelNum;
  const newLevel = getUserLevelInfo(newTotal).levelNum;
  return { pointsEarned, bonusPoints, completedAchievements, newTotal, newLevel, leveledUp: newLevel > oldLevel };
}

export function achievementProgress(a: Achievement, checkins: string[]) {
  const done = a.requiredMissions.filter((id) => checkins.includes(id)).length;
  const total = a.requiredMissions.length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}
