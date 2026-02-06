/**
 * Trust Scoring System for Squad Quest
 * Calculates user trustworthiness based on multiple factors
 * Used for gating women-only quests and showing trust badges
 */

/**
 * Calculate trust score for a user (0-100 scale)
 * @param {Object} user - User object from Firestore
 * @returns {number} Trust score (0-100)
 */
export const calculateTrustScore = (user) => {
  if (!user) return 0;

  let trust = 0;

  // ✅ FACTOR 1: OAuth Provider (+30 instant trust)
  // Google accounts are harder to fake than email/password
  if (
    user.authProvider === "google.com" ||
    user.authProvider === "facebook.com"
  ) {
    trust += 30;
  }

  // ✅ FACTOR 2: Account Age (max +30)
  if (user.createdAt) {
    const createdAtMs = user.createdAt.toMillis
      ? user.createdAt.toMillis()
      : user.createdAt;
    const daysSinceCreated = (Date.now() - createdAtMs) / (1000 * 60 * 60 * 24);

    if (daysSinceCreated > 30) {
      trust += 30;
    } else if (daysSinceCreated > 7) {
      trust += 20;
    } else if (daysSinceCreated > 3) {
      trust += 10;
    }
    // < 3 days = 0 points
  }

  // ✅ FACTOR 3: Quest Completion (max +20)
  const questsCompleted = user.questsCompleted || 0;
  if (questsCompleted >= 5) {
    trust += 20;
  } else if (questsCompleted >= 1) {
    trust += 10;
  }

  // ✅ FACTOR 4: Reliability Score (max +10)
  const reliability = user.reliabilityScore || 0;
  if (reliability >= 90) {
    trust += 10;
  } else if (reliability >= 70) {
    trust += 5;
  }

  // ❌ FACTOR 5: Reports (negative impact)
  const reportCount = user.reportCount || 0;
  trust -= reportCount * 15;

  // ❌ FACTOR 6: Kick History (negative impact)
  const kickCount = user.kickCount || 0;
  trust -= kickCount * 10;

  // Keep in 0-100 range
  return Math.max(0, Math.min(100, trust));
};

/**
 * Get trust level label for a user
 * @param {number} trustScore - Trust score (0-100)
 * @returns {Object} Trust level with label and color
 */
export const getTrustLevel = (trustScore) => {
  if (trustScore >= 80) {
    return {
      level: "highly_trusted",
      label: "Highly Trusted",
      color: "green",
      badgeClass: "bg-green-600",
    };
  } else if (trustScore >= 60) {
    return {
      level: "trusted",
      label: "Trusted Member",
      color: "blue",
      badgeClass: "bg-blue-600",
    };
  } else if (trustScore >= 30) {
    return {
      level: "regular",
      label: "Regular",
      color: "gray",
      badgeClass: "bg-gray-600",
    };
  } else {
    return {
      level: "new",
      label: "New Member",
      color: "yellow",
      badgeClass: "bg-yellow-600",
    };
  }
};

/**
 * Check if user can join women-only quest without approval
 * @param {Object} user - User object from Firestore
 * @returns {Object} { allowed: boolean, reason: string }
 */
export const canJoinWomenOnlyQuest = (user) => {
  if (!user) {
    return { allowed: false, reason: "User not found" };
  }

  if (user.gender !== "Female") {
    return { allowed: false, reason: "Not a female user" };
  }

  // 🏆 BYPASS 1: Verified badge holders can join directly
  if (user.verifiedGender === "Female") {
    return {
      allowed: true,
      reason: "Verified female user (auto-join enabled)",
    };
  }

  // BYPASS 2: Quest count shows experience (5+ quests = established user)
  if ((user.questsCompleted || 0) >= 3) {
    return { allowed: true, reason: "Established user (3+ quests completed)" };
  }

  // Gate 1: Brand new accounts (<72 hours)
  if (user.createdAt) {
    const createdAtMs = user.createdAt.toMillis
      ? user.createdAt.toMillis()
      : user.createdAt;
    const hoursSinceCreated = (Date.now() - createdAtMs) / (1000 * 60 * 60);

    if (hoursSinceCreated < 72) {
      return {
        allowed: false,
        reason: "New accounts require host approval (account < 72 hours old)",
        requireApproval: true,
      };
    }
  }

  // Gate 2: Zero quest completion
  if ((user.questsCompleted || 0) === 0) {
    return {
      allowed: false,
      reason: "First-time users require host approval",
      requireApproval: true,
    };
  }

  // Gate 3: Reported users
  if ((user.reportCount || 0) >= 1) {
    return {
      allowed: false,
      reason: "Users with reports require host approval",
      requireApproval: true,
    };
  }

  // All gates passed
  return { allowed: true, reason: "Trusted user" };
};

/**
 * Get trust badges to display for a user
 * @param {Object} user - User object from Firestore
 * @returns {Array} Array of badge objects
 */
export const getTrustBadges = (user) => {
  if (!user) return [];

  const badges = [];

  // 🏆 PRIORITY 1: VERIFIED GENDER BADGE (Most Important)
  if (user.verifiedGender) {
    const color =
      user.verifiedGender === "Female" ? "bg-pink-600" : "bg-blue-600";

    badges.push({
      icon: "✓",
      text: `Verified ${user.verifiedGender}`,
      color,
      tooltip: `Gender verified through photos (${user.questsCompleted || 0} quests completed)`,
    });
  }

  // OAuth verified badge
  if (user.authProvider === "google.com") {
    badges.push({
      icon: "✓",
      text: "Google Account",
      color: "bg-blue-500",
      tooltip: "Google verified",
    });
  }

  // Quest completion badges
  const questsCompleted = user.questsCompleted || 0;
  if (questsCompleted >= 10) {
    badges.push({
      icon: "🏆",
      text: `${questsCompleted} Quests`,
      color: "bg-purple-600",
      tooltip: "Experienced member",
    });
  } else if (questsCompleted >= 1) {
    badges.push({
      icon: "📍",
      text: `${questsCompleted} Quest${questsCompleted > 1 ? "s" : ""}`,
      color: "bg-gray-600",
      tooltip: "Active member",
    });
  }

  // Trust level badge (only if not verified)
  if (!user.verifiedGender) {
    const trustScore = calculateTrustScore(user);
    const trustLevel = getTrustLevel(trustScore);

    if (trustScore >= 60) {
      badges.push({
        icon: "⭐",
        text: trustLevel.label,
        color: trustLevel.badgeClass,
        tooltip: `Trust score: ${trustScore}`,
      });
    }
  }

  return badges;
};

/**
 * Check if user has exceeded women-only quest join limit
 * @param {string} userId - User ID
 * @param {Array} recentJoins - Array of recent join timestamps (last 24h)
 * @returns {Object} { allowed: boolean, reason: string }
 */
export const checkJoinFrequency = (recentJoins = []) => {
  const MAX_JOINS_PER_24H = 2;

  if (recentJoins.length >= MAX_JOINS_PER_24H) {
    return {
      allowed: false,
      reason:
        "Please wait before joining another women-only quest (max 2 per 24 hours)",
      cooldownHours: 24,
    };
  }

  return { allowed: true };
};
