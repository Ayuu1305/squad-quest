/**
 * Centralized Border Configuration System
 * Defines visuals for Weekly Rewards, Shop Skins, and Tier Fallbacks.
 */

export const BORDER_DEFINITIONS = {
  // --- WEEKLY REWARDS ---
  golden_glitch: {
    name: "Golden Glitch",
    style: "border-yellow-400 border-dashed border-2",
    shadow: "2px 0 blue, -2px 0 red",
    animate: { rotate: [0, 90, -90, 180, 0, 360] },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "linear",
      times: [0, 0.2, 0.4, 0.6, 0.8, 1],
    },
  },
  silver_shimmer: {
    name: "Silver Shimmer",
    style: "border-slate-300 border", // Clean Silver
    shadow: "0 0 15px rgba(255, 255, 255, 0.6)",
    filter: "brightness(1.5)",
    animate: { scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] },
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
  bronze_plate: {
    name: "Bronze Plate",
    style: "border-orange-700 border-4", // Thick Solid Bronze
    shadow: "inset 0 0 10px rgba(0,0,0,0.5)",
    animate: {}, // Static
    transition: {},
  },

  // --- SHOP ITEMS (Examples) ---
  neon_blue: {
    name: "Neon Blue",
    style: "border-cyan-400 border-2",
    shadow: "0 0 15px cyan",
    animate: {
      scale: [1, 1.05, 1],
      borderColor: ["#22d3ee", "#0891b2", "#22d3ee"],
    },
    transition: { duration: 1.5, repeat: Infinity },
  },
  magma_core: {
    name: "Magma Core",
    style: "border-red-600 border-2 border-double",
    shadow: "0 0 15px red",
    animate: { rotate: [0, 10, -10, 0] },
    transition: { duration: 3, repeat: Infinity },
    filter: "contrast(1.2)",
  },
  void_walker: {
    name: "Void Walker",
    style: "border-purple-900 border-2",
    shadow: "0 0 20px purple",
    animate: { opacity: [0.5, 1, 0.5] },
    transition: { duration: 4, repeat: Infinity },
  },
  neon_frame_01: {
    name: "Cyberpunk Neon",
    style: "border-cyan-400 border-2 shadow-[0_0_15px_rgba(34,211,238,0.6)]",
    animate: {
      opacity: [0.8, 1, 0.8],
      filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"],
    },
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },

  // --- TIER FALLBACKS (UPDATED VISUALS) ---
  Legendary: {
    name: "Legendary Tier",
    style: "border-fuchsia-600 border-[4px]", // Thick, solid purple
    shadow:
      "0 0 25px rgba(192, 38, 211, 0.8), 0 0 50px rgba(147, 51, 234, 0.5)", // Intense double glow
    animate: {
      boxShadow: [
        "0 0 25px rgba(192, 38, 211, 0.8), 0 0 50px rgba(147, 51, 234, 0.5)",
        "0 0 35px rgba(192, 38, 211, 1), 0 0 60px rgba(147, 51, 234, 0.7)",
        "0 0 25px rgba(192, 38, 211, 0.8), 0 0 50px rgba(147, 51, 234, 0.5)",
      ],
      filter: ["hue-rotate(0deg)", "hue-rotate(30deg)", "hue-rotate(0deg)"],
    },
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
  },
  Gold: {
    name: "Gold Tier",
    style: "border-yellow-500 border-[3px]", // Solid, thick gold
    shadow:
      "0 0 20px rgba(234, 179, 8, 0.7), inset 0 0 5px rgba(252, 211, 77, 1)", // Rich outer and inner glow
    animate: {
      boxShadow: [
        "0 0 20px rgba(234, 179, 8, 0.7), inset 0 0 5px rgba(252, 211, 77, 1)",
        "0 0 30px rgba(234, 179, 8, 0.9), inset 0 0 10px rgba(252, 211, 77, 1)",
        "0 0 20px rgba(234, 179, 8, 0.7), inset 0 0 5px rgba(252, 211, 77, 1)",
      ],
    },
    transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
  },
  Silver: {
    name: "Silver Tier",
    style: "border-slate-200 border-[3px]", // Solid, thick silver
    shadow:
      "0 0 15px rgba(226, 232, 240, 0.6), inset 0 0 5px rgba(255,255,255,0.8)", // Bright metallic glow
    animate: {
      boxShadow: [
        "0 0 15px rgba(226, 232, 240, 0.6), inset 0 0 5px rgba(255,255,255,0.8)",
        "0 0 20px rgba(226, 232, 240, 0.8), inset 0 0 10px rgba(255,255,255,1)",
        "0 0 15px rgba(226, 232, 240, 0.6), inset 0 0 5px rgba(255,255,255,0.8)",
      ],
    },
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
  Bronze: {
    name: "Bronze Tier",
    style: "border-orange-600 border-2",
    shadow: "0 0 5px rgba(234, 88, 12, 0.3)",
    animate: { scale: [1, 1.01, 1] }, // Very subtle breathing
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
  },
  Recruit: {
    name: "Recruit Tier",
    style: "border-gray-700 border",
    shadow: "none",
    animate: {},
    transition: {},
  },
};

/**
 * Get the visual configuration for a user's border.
 * Priority: 1. activeBorder (if exists in definitions) -> 2. tierName -> 3. Recruit
 *
 * @param {string|null} borderId - The ID of the equipped border (e.g., "golden_glitch")
 * @param {string} tierName - The user's tier (e.g., "Gold")
 * @returns {object} The border configuration object
 */
export const getBorderConfig = (borderId, tierName) => {
  // 1. Check for Equipped Border (Special / Shop)
  if (borderId && BORDER_DEFINITIONS[borderId]) {
    return BORDER_DEFINITIONS[borderId];
  }

  // 2. Check for Tier
  if (tierName && BORDER_DEFINITIONS[tierName]) {
    return BORDER_DEFINITIONS[tierName];
  }

  // 3. Fallback
  return BORDER_DEFINITIONS["Recruit"];
};
