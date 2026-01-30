import React from "react";
import { getHeroAvatarUrl } from "../utils/avatars";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { getBorderConfig } from "../utils/borderStyles";

const HeroAvatar = ({
  user, // [NEW] Accept user prop for Leaderboard/Profile data
  seed,
  tierName = "Bronze",
  size = 150,
  className = "",
  aura = null, // 'gold', 'blue', 'silver', 'mythic'
  equippedFrame = null, // Direct prop override
  imgProps = {}, // [NEW] Allow passing props to the img tag (e.g. crossOrigin)
  hideBorder = false, // [NEW] Strip internal borders for layered rendering
}) => {
  const { user: currentAuth } = useAuth();

  // Logic: Determine Active Frame
  // 1. Direct prop (lowest priority if undefined, but explicit) - User instructions imply priority on USER prop.
  // Let's follow the precise requested logic:

  let activeFrame = null;

  // Priority 1: Check props.user.equippedFrame (Leaderboard case)
  if (user?.equippedFrame) {
    activeFrame = user.equippedFrame;
  }
  // Fallback: Check direct prop if user prop didn't have it
  else if (equippedFrame) {
    activeFrame = equippedFrame;
  }

  // Priority 2: If no frame found yet, and we are viewing ourselves (or no user prop passed), check AuthContext
  if (!activeFrame) {
    const isMe = !user || (currentAuth?.uid && user.uid === currentAuth.uid);
    if (isMe && currentAuth?.equippedFrame) {
      activeFrame = currentAuth.equippedFrame;
    }
  }

  // --- AVATAR URL LOGIC ---
  let avatarUrl;

  // Priority:
  // 1. If user prop has avatarConfig (e.g., from AvatarEditor preview or Leaderboard), use it
  // 2. If viewing myself and no user avatarConfig, use AuthContext config
  const isMe =
    !user?.uid || (currentAuth?.uid && user?.uid === currentAuth?.uid);

  // FIXED: Check user?.avatarConfig FIRST (for preview), then fall back to context
  const activeConfig =
    user?.avatarConfig || (isMe ? currentAuth?.avatarConfig : null);

  if (activeConfig) {
    // Build URL from Config (Multi-Style Support)
    const styleType = activeConfig.style || "adventurer";
    const baseUrl = `https://api.dicebear.com/9.x/${styleType}/svg`;

    // Define valid traits per style to prevent cross-contamination
    const VALID_TRAITS = {
      adventurer: ["skinColor", "hair", "eyes", "mouth"],
      notionists: ["hair", "eyes", "brows", "glasses", "body"],
      micah: ["hair", "eyes", "eyebrows", "mouth"],
      "open-peeps": ["face", "facialHair", "accessories"],
      initials: ["backgroundColor", "fontFamily"],
      lorelei: ["hair", "eyes", "eyebrows", "glasses"],
      "fun-emoji": ["eyes", "mouth"],
    };

    // Filter config to only include valid traits for this style
    const validTraits = VALID_TRAITS[styleType] || [];
    const filteredParams = {};
    validTraits.forEach((trait) => {
      if (activeConfig[trait]) {
        filteredParams[trait] = activeConfig[trait];
      }
    });

    const params = new URLSearchParams({
      seed: user?.uid || seed,
      ...filteredParams,
    });
    avatarUrl = `${baseUrl}?${params.toString()}`;
  } else {
    // Default / Legacy Logic
    avatarUrl = getHeroAvatarUrl(seed, tierName, size);
  }

  const getTierColors = (tier) => {
    switch (tier) {
      case "Legendary":
        return { ring: "#a855f7", glow: "rgba(168, 85, 247, 0.4)" };
      case "Gold":
        return { ring: "#eab308", glow: "rgba(234, 179, 8, 0.4)" };
      case "Silver":
        return { ring: "#94a3b8", glow: "rgba(148, 163, 184, 0.4)" };
      default:
        return { ring: "#8b5cf6", glow: "rgba(139, 92, 246, 0.4)" };
    }
  };

  const colors = getTierColors(tierName);

  // Dynamic Aura Logic
  const getAuraClass = () => {
    if (!aura) return "";
    switch (aura) {
      case "gold":
        return "aura-gold";
      case "blue":
        return "aura-blue";
      case "silver":
        return "aura-silver";
      case "mythic":
        return "aura-mythic";
      default:
        return "";
    }
  };

  const auraClass = getAuraClass();

  // --- RENDER LOGIC ---

  // 1. Naked Mode (For when parent handles the border, e.g., Profile/Leaderboard)
  if (hideBorder) {
    return (
      <div
        className={`relative inline-flex items-center justify-center overflow-hidden rounded-full ${className}`}
        style={{ width: size, height: size, backgroundColor: "#15171E" }} // Force dark bg
      >
        <img
          src={avatarUrl}
          alt="Hero Avatar"
          className="w-full h-full object-cover"
          {...imgProps}
        />
      </div>
    );
  }

  // 2. Dynamic Border Rendering (Replaces Legacy Hardcoded & Neon Warlord Logic)
  // This unifies logic: Gold (Solid) vs Golden Glitch (Animated)
  const borderConfig = getBorderConfig(activeFrame, tierName);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className} ${auraClass}`}
      style={{ width: size, height: size, borderRadius: "50%" }}
    >
      {/* Dynamic Border from Config */}
      {!aura && (
        <motion.div
          className={`absolute inset-[-4px] rounded-full ${borderConfig.style}`}
          style={{
            boxShadow: borderConfig.shadow,
            filter: borderConfig.filter,
          }}
          animate={borderConfig.animate}
          transition={borderConfig.transition}
        />
      )}

      {/* Main Avatar Container */}
      <div className="relative w-full h-full rounded-full overflow-hidden bg-dark-bg/80 z-10">
        <img
          src={avatarUrl}
          alt="Hero Avatar"
          className="w-full h-full object-cover"
          {...imgProps}
        />
      </div>
    </div>
  );
};

export default HeroAvatar;
