/**
 * Centralized Border Configuration System
 * Defines visuals for Weekly Rewards, Shop Skins, and Tier Fallbacks.
 */

export const BORDER_DEFINITIONS = {
  // --- 1. WEEKLY REWARDS (The Glitchy Stuff) ---
  champion_aura: {
    name: "Champion Aura",
    style: "border-yellow-400 border-dashed border-2",
    // Static Glow (Red/Blue/Gold mix)
    shadow: "0 0 15px rgba(255, 215, 0, 0.6), 0 0 30px rgba(0, 0, 255, 0.4)",
    // Gentle Pulse instead of Spin
    animate: {
      opacity: [0.8, 1, 0.8],
      boxShadow: [
        "0 0 15px rgba(255, 215, 0, 0.6), 0 0 30px rgba(0, 0, 255, 0.4)",
        "0 0 25px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 0, 0, 0.4)",
        "0 0 15px rgba(255, 215, 0, 0.6), 0 0 30px rgba(0, 0, 255, 0.4)",
      ],
    },
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },

  // --- 2. SHOP ITEMS ---
  neon_frame_01: {
    name: "Cyberpunk Neon",
    style: "border-cyan-400 border-2 shadow-[0_0_15px_rgba(34,211,238,0.6)]",
    animate: {
      opacity: [0.8, 1, 0.8],
      filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"],
    },
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },

  // --- RESTORED PREMIUM ITEMS ---
  fire_aura: {
    name: "Inferno",
    // 🔥 Fire Style: Red/Orange pulse
    style: "border-red-600 border-4",
    shadow: "0 0 20px rgba(220, 38, 38, 0.8), 0 0 40px rgba(234, 88, 12, 0.6)",
    animate: {
      boxShadow: [
        "0 0 20px rgba(220, 38, 38, 0.8), 0 0 40px rgba(234, 88, 12, 0.6)",
        "0 0 30px rgba(220, 38, 38, 1), 0 0 60px rgba(234, 88, 12, 0.9)",
        "0 0 20px rgba(220, 38, 38, 0.8), 0 0 40px rgba(234, 88, 12, 0.6)",
      ],
    },
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
  },

  gold_aura: {
    name: "Midas Touch",
    // 👑 King Style: Intense Gold Shine (Brighter than Rank Gold)
    style: "border-yellow-300 border-[3px]",
    shadow:
      "0 0 25px rgba(253, 224, 71, 0.8), inset 0 0 10px rgba(253, 224, 71, 0.5)",
    filter: "brightness(1.2) contrast(1.1)",
    animate: {
      filter: ["brightness(1.2)", "brightness(1.5)", "brightness(1.2)"],
    },
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },

  // --- 3. TIERS (The Solid Stuff) ---
  Gold: {
    name: "Gold Tier",
    // ✅ SOLID Border
    style: "border-yellow-500 border-[3px]",
    // ✅ PULSE Glow only (NO ROTATE property here!)
    shadow:
      "0 0 20px rgba(234, 179, 8, 0.7), inset 0 0 5px rgba(252, 211, 77, 1)",
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
    style: "border-slate-200 border-[3px]",
    shadow: "0 0 15px rgba(226, 232, 240, 0.6)",
    animate: { scale: [1, 1.01, 1] },
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },

  Bronze: {
    name: "Bronze Tier",
    style: "border-orange-700 border-2",
    shadow: "none",
    animate: {},
    transition: {},
  },

  Recruit: {
    name: "Recruit Tier",
    style: "border-gray-700 border",
    shadow: "none",
    animate: {},
    transition: {},
  },
};

export const getBorderConfig = (borderId, tierName) => {
  // 1. Check for Equipped Border
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
