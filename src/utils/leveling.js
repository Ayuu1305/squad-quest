/**
 * Progressive Leveling Utility (Frontend)
 * Matches backend logic: neededXP(level) = 100 + (level - 1) * 50
 */

export function xpNeededForLevel(level) {
  if (level < 1) return 100;
  return 100 + (level - 1) * 50;
}

export function getLevelProgress(totalXP) {
  let level = 1;
  let xpRemaining = totalXP;
  let needed = xpNeededForLevel(level);

  while (xpRemaining >= needed) {
    xpRemaining -= needed;
    level++;
    needed = xpNeededForLevel(level);
  }

  const progressPercent = Math.min(
    100,
    Math.max(0, (xpRemaining / needed) * 100)
  );

  return {
    level,
    xpIntoLevel: xpRemaining,
    xpForNextLevel: needed,
    progressPercent,
  };
}
