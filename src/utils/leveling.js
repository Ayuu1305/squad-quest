/**
 * Progressive Leveling Utility (Frontend)
 * Matches backend logic: neededXP(level) = 100 + (level - 1) * 50
 *
 * UPDATED: Now uses lifetimeXP instead of xp for level calculation
 */

export function xpNeededForLevel(level) {
  if (level < 1) return 100;
  return 100 + (level - 1) * 50;
}

export function getLevelProgress(lifetimeXP, totalXP) {
  // Use lifetimeXP if available, otherwise fall back to totalXP (old behavior)
  const xpForCalculation = lifetimeXP !== undefined ? lifetimeXP : totalXP;

  let level = 1;
  let xpRemaining = xpForCalculation || 0;
  let needed = xpNeededForLevel(level);

  while (xpRemaining >= needed) {
    xpRemaining -= needed;
    level++;
    needed = xpNeededForLevel(level);
  }

  const progressPercent = Math.min(
    100,
    Math.max(0, (xpRemaining / needed) * 100),
  );

  return {
    level,
    xpIntoLevel: xpRemaining,
    xpForNextLevel: needed,
    progressPercent,
  };
}
