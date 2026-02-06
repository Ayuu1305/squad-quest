/**
 * Ban Check Utility
 * Checks if a user is currently banned (temporary or permanent)
 */

/**
 * Check if user is banned and return ban status
 * @param {Object} user - User object from AuthContext
 * @returns {Object} Ban status: { banned: boolean, type: 'temporary'|'permanent'|null, expiresAt: Date|null, reason: string|null }
 */
export const isBanned = (user) => {
  if (!user) {
    return { banned: false, type: null, expiresAt: null, reason: null };
  }

  // Check for permanent ban
  if (user.banned === true) {
    return {
      banned: true,
      type: "permanent",
      expiresAt: null,
      reason: user.banReason || "Account permanently banned",
    };
  }

  // Check for temporary ban
  if (user.bannedUntil) {
    const now = new Date();
    let banExpiry;

    // Handle Firestore Timestamp objects
    if (user.bannedUntil.toDate) {
      banExpiry = user.bannedUntil.toDate();
    } else if (user.bannedUntil.seconds) {
      banExpiry = new Date(user.bannedUntil.seconds * 1000);
    } else {
      banExpiry = new Date(user.bannedUntil);
    }

    // Check if ban is still active
    if (now < banExpiry) {
      return {
        banned: true,
        type: "temporary",
        expiresAt: banExpiry,
        reason:
          user.banReason ||
          `Account suspended until ${banExpiry.toLocaleDateString()}`,
      };
    }
  }

  // Not banned
  return { banned: false, type: null, expiresAt: null, reason: null };
};

/**
 * Get human-readable time remaining for temporary ban
 * @param {Date} expiresAt - Ban expiry date
 * @returns {string} Formatted time remaining (e.g., "3 days 5 hours")
 */
export const getBanTimeRemaining = (expiresAt) => {
  if (!expiresAt) return "";

  const now = new Date();
  const diff = expiresAt - now;

  if (diff <= 0) return "Ban expired";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} ${hours} hour${hours !== 1 ? "s" : ""}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ${minutes} minute${minutes !== 1 ? "s" : ""}`;
  } else {
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  }
};
