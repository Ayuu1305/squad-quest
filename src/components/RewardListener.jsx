import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useVendorAuth } from "../context/VendorAuthContext"; // ✅ VENDOR CHECK
import { useReward } from "../context/RewardContext";
import { getTier } from "../utils/xp";
import { getLevelProgress } from "../utils/leveling";

// Badge lookup mapping IDs to display data
const BADGE_LOOKUP = {
  badge_whale: { icon: "💎", label: "The Whale" },
  badge_coffee: { icon: "☕", label: "Caffeine Club" },
  badge_dev: { icon: "💻", label: "Code Ninja" },
};

const RewardListener = () => {
  const { user } = useAuth();
  const { isVendor } = useVendorAuth(); // ✅ GET VENDOR STATUS
  const { triggerReward } = useReward();
  const prevUserRef = useRef(null);

  useEffect(() => {
    // Skip if no user or first render
    if (!user) {
      prevUserRef.current = null;
      return;
    }

    // ✅ FIX: Skip reward listener for vendor accounts
    // Vendors have different dashboard and don't need XP/level/badge rewards
    if (isVendor) {
      console.log("🛑 [RewardListener] Skipping - User is a vendor");
      prevUserRef.current = user;
      return;
    }

    // Initialize on first user load
    if (!prevUserRef.current) {
      prevUserRef.current = user;
      return;
    }

    const prev = prevUserRef.current;
    const curr = user;

    // 🔥 CRITICAL FIX: Calculate levels dynamically from lifetimeXP
    // This ensures level changes are detected even when user.level field isn't updated manually
    const prevLifetimeXP = prev.lifetimeXP || prev.xp || 0;
    const currLifetimeXP = curr.lifetimeXP || curr.xp || 0;

    const effectivePrevLevel = getLevelProgress(prevLifetimeXP).level;
    const effectiveCurrLevel = getLevelProgress(currLifetimeXP).level;

    console.log("🔍 [RewardListener] Checking for changes...", {
      prevLifetimeXP,
      currLifetimeXP,
      effectivePrevLevel,
      effectiveCurrLevel,
      prevBadges: prev.inventory?.badges?.length || 0,
      currBadges: curr.inventory?.badges?.length || 0,
    });

    // CHECK 1: Badge Unlock Detection
    const prevBadges = prev.inventory?.badges || [];
    const currBadges = curr.inventory?.badges || [];

    if (currBadges.length > prevBadges.length) {
      // Find the new badge(s)
      const newBadges = currBadges.filter((id) => !prevBadges.includes(id));
      const claimedBadges = curr.claimedRewards?.claimedBadges || [];

      newBadges.forEach((badgeId) => {
        // ✅ Only show if not already claimed
        if (!claimedBadges.includes(badgeId)) {
          const badgeData = BADGE_LOOKUP[badgeId];
          if (badgeData) {
            console.log("🏅 [RewardListener] Badge unlocked:", badgeId);
            triggerReward({
              type: "BADGE",
              title: "BADGE UNLOCKED",
              image: badgeData.icon,
              subtext: badgeData.label,
              data: { badgeId },
            });
          } else {
            console.warn(`⚠️ [RewardListener] Unknown badge ID: ${badgeId}`);
          }
        }
      });
    }

    // CHECK 2: Level Up Detection (using calculated levels)
    if (effectiveCurrLevel > effectivePrevLevel) {
      const lastClaimedLevel = curr.claimedRewards?.lastClaimedLevel || 0;

      // ✅ Only show if this level hasn't been claimed before
      if (effectiveCurrLevel > lastClaimedLevel) {
        console.log(
          "⬆️ [RewardListener] Level up detected:",
          effectiveCurrLevel,
        );
        triggerReward({
          type: "LEVEL",
          title: "LEVEL UP!",
          image: null,
          subtext: `You reached Level ${effectiveCurrLevel}`,
          data: { level: effectiveCurrLevel },
        });
      }
    }

    // CHECK 3: Rank Change Detection (using calculated levels)
    const prevRank = getTier(effectivePrevLevel).name;
    const currRank = getTier(effectiveCurrLevel).name;

    if (currRank !== prevRank) {
      const lastClaimedRank = curr.claimedRewards?.lastClaimedRank || "";

      // ✅ Only show if this rank hasn't been claimed before
      if (currRank !== lastClaimedRank) {
        console.log("👑 [RewardListener] Rank change detected:", currRank);
        triggerReward({
          type: "RANK",
          title: "NEW RANK",
          image: null,
          subtext: `You are now ${currRank}`,
          data: { rankName: currRank },
        });
      }
    }

    // Update reference for next comparison
    prevUserRef.current = curr;
  }, [user, isVendor, triggerReward]); // ✅ Added isVendor dependency

  // This component doesn't render anything
  return null;
};

export default RewardListener;
