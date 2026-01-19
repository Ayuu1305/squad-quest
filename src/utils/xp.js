export const BADGE_TIERS = {
  RECRUIT: {
    name: "Recruit",
    minLevel: 0,
    color: "text-gray-400",
    hex: "#9ca3af",
  },
  BRONZE: {
    name: "Bronze",
    minLevel: 5,
    color: "text-orange-400",
    hex: "#fb923c",
  },
  SILVER: {
    name: "Silver",
    minLevel: 15,
    color: "text-slate-300",
    hex: "#cbd5e1",
  },
  GOLD: {
    name: "Gold",
    minLevel: 30,
    color: "text-yellow-400",
    hex: "#facc15",
  },
};

const ATTR_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 500,
  GOLD: 1500,
  LEGENDARY: 5000,
};

// --- NEW: Badge Definitions with Rarity ---
export const BADGE_DEFINITIONS = {
  funny: {
    id: "funny",
    firebaseKey: "funny", // feedbackCounts.funny
    label: "The Icebreaker",
    description: "Breaks the silence with good vibes.",
    icon: "❄️",
    rarity: "COMMON",
    color: "text-cyan-400",
    threshold: 5,
  },
  teamplayer: {
    id: "teamplayer",
    firebaseKey: "team_player", // Common mismatch: teamplayer vs team_player
    label: "Social Catalyst",
    description: "The spark that ignites the squad.",
    icon: "🤝",
    rarity: "COMMON",
    color: "text-green-400",
    threshold: 5,
  },
  intellectual: {
    id: "intellectual",
    firebaseKey: "intellectual",
    label: "The Philosopher",
    description: "Deep thinker with profound insights.",
    icon: "🦉",
    rarity: "RARE",
    color: "text-purple-400",
    threshold: 10,
  },
  listener: {
    id: "listener",
    firebaseKey: "helpful", // Mapping 'helpful' feedback to Listener badge
    label: "Vibe Architect",
    description: "Builds the foundation of trust.",
    icon: "🏗️",
    rarity: "EPIC",
    color: "text-pink-400",
    threshold: 20,
  },
  storyteller: {
    id: "storyteller",
    firebaseKey: "storyteller",
    label: "Vibe Alchemist",
    description: "Transforms moments into legends.",
    icon: "⚗️",
    rarity: "EPIC",
    color: "text-orange-400",
    threshold: 10,
  },
  leader: {
    id: "leader",
    firebaseKey: "leader",
    label: "Master Tactician",
    description: "Born to lead the charge.",
    icon: "♟️",
    rarity: "RARE",
    color: "text-yellow-400",
    threshold: 10,
  },
};

export const getAttrTier = (xp) => {
  if (xp >= ATTR_THRESHOLDS.LEGENDARY)
    return { ...BADGE_TIERS.LEGENDARY, minXP: ATTR_THRESHOLDS.LEGENDARY };
  if (xp >= ATTR_THRESHOLDS.GOLD)
    return { ...BADGE_TIERS.GOLD, minXP: ATTR_THRESHOLDS.GOLD };
  if (xp >= ATTR_THRESHOLDS.SILVER)
    return { ...BADGE_TIERS.SILVER, minXP: ATTR_THRESHOLDS.SILVER };
  return { ...BADGE_TIERS.BRONZE, minXP: ATTR_THRESHOLDS.BRONZE };
};

/**
 * Returns rarity string based on XP.
 */
export const getRarity = (xp = 0) => {
  const value = Number(xp) || 0;

  if (value >= 5000) return "Legendary";
  if (value >= 2500) return "Epic";
  if (value >= 1000) return "Rare";
  if (value >= 300) return "Uncommon";
  return "Common";
};

// --- NEW: Tier Upgrade Logic ---
export const updateHeroTier = (level) => {
  return getTier(level).name;
};

export const getTier = (level = 1) => {
  if (level >= BADGE_TIERS.GOLD.minLevel) return BADGE_TIERS.GOLD;
  if (level >= BADGE_TIERS.SILVER.minLevel) return BADGE_TIERS.SILVER;
  if (level >= BADGE_TIERS.BRONZE.minLevel) return BADGE_TIERS.BRONZE;
  return BADGE_TIERS.RECRUIT;
};

export const getXPToNextTier = (xp) => {
  if (xp >= ATTR_THRESHOLDS.LEGENDARY) return 0;
  if (xp < ATTR_THRESHOLDS.SILVER) return ATTR_THRESHOLDS.SILVER - xp;
  if (xp < ATTR_THRESHOLDS.GOLD) return ATTR_THRESHOLDS.GOLD - xp;
  return ATTR_THRESHOLDS.LEGENDARY - xp;
};

export const getTierProgress = (xp) => {
  if (xp >= ATTR_THRESHOLDS.LEGENDARY) return 100;

  let current, next;
  if (xp < ATTR_THRESHOLDS.SILVER) {
    current = ATTR_THRESHOLDS.BRONZE;
    next = ATTR_THRESHOLDS.SILVER;
  } else if (xp < ATTR_THRESHOLDS.GOLD) {
    current = ATTR_THRESHOLDS.SILVER;
    next = ATTR_THRESHOLDS.GOLD;
  } else {
    current = ATTR_THRESHOLDS.GOLD;
    next = ATTR_THRESHOLDS.LEGENDARY;
  }

  const range = next - current;
  const progress = ((xp - current) / range) * 100;
  return Math.min(Math.max(progress, 0), 100);
};

export const getHonorRank = (reliability) => {
  if (reliability >= 95)
    return {
      title: "Legendary Sentinel",
      color: "text-neon-purple",
      level: "LEGENDARY",
    };
  if (reliability >= 80)
    return { title: "Vanguard Hero", color: "text-green-400", level: "GOLD" };
  return { title: "Unstable Rogue", color: "text-red-400", level: "BRONZE" };
};

// Calculate XP for a completed quest
export const calculateXP = (options = {}) => {
  const {
    isPartyLeader = false,
    uploadedPhoto = true,
    squadSize = 1,
    vibeTagsReceived = 0,
    unlockedBadge = false,
  } = options;

  let baseXP = 100;

  // Party Leader bonus: 2x XP
  if (isPartyLeader) {
    baseXP *= 2;
  }

  // Photo bonus/penalty
  if (uploadedPhoto) {
    baseXP *= 1.5;
  } else {
    baseXP *= 0.5;
  }

  // Power of 5: Full squad bonus
  if (squadSize === 5) {
    baseXP *= 1.2;
  }

  // Vibe tag rewards
  const vibeTagBonus = vibeTagsReceived * 5;
  baseXP += vibeTagBonus;

  // Badge unlock bonus
  if (unlockedBadge) {
    baseXP += 100;
  }

  return Math.floor(baseXP);
};

// Calculate XP needed for a specific level (Progressive Curve)
// needed = 100 + (level-1)*50
export const getXPNeededForLevel = (level) => {
  if (level < 1) return 100;
  return 100 + (level - 1) * 50;
};

// Update hero class based on level
export const updateClass = (level) => {
  if (level >= 50) return "Grandmaster";
  if (level >= 40) return "Legend";
  if (level >= 30) return "Commander";
  if (level >= 20) return "Veteran";
  if (level >= 10) return "Scout";
  return "Novice";
};

// Helper to get total XP required to REACH a level (sum of previous levels)
// Sum = 100*(L-1) + 25*(L-1)*(L-2)
const getXPStartOfLevel = (level) => {
  if (level <= 1) return 0;
  const n = level - 1;
  return 100 * n + 25 * n * (n - 1);
};

// Calculate progress percentage to next level (Progressive system)
export const levelProgress = (currentXP, level) => {
  const startXP = getXPStartOfLevel(level);
  const xpInLevel = Math.max(0, currentXP - startXP);
  const needed = getXPNeededForLevel(level);
  return Math.min((xpInLevel / needed) * 100, 100);
};

// XP needed for next level (remaining) (Progressive system)
export const xpToNextLevel = (currentXP, level) => {
  const startXP = getXPStartOfLevel(level);
  const xpInLevel = Math.max(0, currentXP - startXP);
  const needed = getXPNeededForLevel(level);
  return Math.max(0, needed - xpInLevel);
};

// Update reliability score
export const updateReliabilityScore = (currentScore, action) => {
  let newScore = currentScore;

  switch (action) {
    case "party_leader_no_show":
      newScore -= 5;
      break;
    case "leave_within_hour":
      newScore -= 2;
      break;
    case "complete_quest":
      newScore = Math.min(newScore + 1, 100);
      break;
    case "negative_feedback":
      newScore -= 1;
      break;
    default:
      break;
  }

  return Math.max(Math.min(newScore, 100), 0);
};

// Get reliability color
export const getReliabilityColor = (score) => {
  if (score >= 95) return "text-neon-purple";
  if (score > 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
};

// --- NEW: Check Badge Unlock based on feedbackCounts ---
export const checkBadgeUnlock = (feedbackCounts = {}) => {
  const unlockedBadges = [];

  Object.values(BADGE_DEFINITIONS).forEach((badgeDef) => {
    const count =
      feedbackCounts[badgeDef.firebaseKey] || feedbackCounts[badgeDef.id] || 0;
    if (count >= badgeDef.threshold) {
      unlockedBadges.push(badgeDef.label);
    }
  });

  return unlockedBadges;
};

// Helper: Get all badge info with locked/unlocked status
export const getFeedbackBadges = (feedbackCounts = {}) => {
  return Object.values(BADGE_DEFINITIONS).map((badge) => {
    // Use mapped firebaseKey, fallback to ID
    const count =
      feedbackCounts[badge.firebaseKey] || feedbackCounts[badge.id] || 0;
    const isUnlocked = count >= badge.threshold;
    return {
      ...badge,
      isUnlocked,
      current: count,
      needed: badge.threshold,
    };
  });
};

// Helper: Check for near misses (1 away)
export const getNearUnlockBadge = (feedbackCounts = {}) => {
  const nearMisses = Object.values(BADGE_DEFINITIONS).filter((badge) => {
    const count =
      feedbackCounts[badge.firebaseKey] || feedbackCounts[badge.id] || 0;
    return count === badge.threshold - 1;
  });

  if (nearMisses.length > 0) {
    return nearMisses[0]; // Return the first one found
  }
  return null;
};
