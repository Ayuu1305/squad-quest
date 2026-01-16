/**
 * progressive leveling curve:
 * neededXP(level) = 100 + (level - 1) * 50
 *
 * Level 1 -> 2: 100 XP
 * Level 2 -> 3: 150 XP
 * Level 3 -> 4: 200 XP
 * ...
 */

export function xpNeededForLevel(level) {
  if (level < 1) return 100;
  return 100 + (level - 1) * 50;
}

export function calculateLevelFromXP(totalXP) {
  let level = 1;
  let xpRemaining = totalXP;
  let needed = xpNeededForLevel(level);

  while (xpRemaining >= needed) {
    xpRemaining -= needed;
    level++;
    needed = xpNeededForLevel(level);
  }

  return {
    level,
    xpIntoLevel: xpRemaining,
    xpForNextLevel: needed,
  };
}
