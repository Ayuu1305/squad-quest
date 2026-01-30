import React from "react";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";
// ✅ IMPORT THE BRAIN (Adjust path if needed)
import { getBorderConfig } from "../utils/borderStyles";

/**
 * AvatarFrame - Now powered by the Centralized Border System
 * @param {string} frameId - The SKU of the frame (e.g., "champion_aura", "Gold")
 * @param {ReactNode} children - The user avatar/image to wrap
 * @param {string} size - Size variant: "sm", "md", "lg" (default: "md")
 * @param {string} type - Optional: "rank" or "cosmetic" (used for fallback logic if needed)
 */
const AvatarFrame = ({ frameId, children, size = "md", type }) => {
  // 1. Size mappings (Keep these local as they are layout-specific)
  const sizeClasses = {
    sm: "p-0.5",
    md: "p-1",
    lg: "p-1.5",
  };

  // 2. ASK THE BRAIN: "What does this frame look like?"
  // We pass 'frameId' as the first arg.
  // We can pass 'frameId' again as the second arg (tierName) to act as a fallback
  // if the ID happens to be a Rank Name like "Gold".
  const frameConfig = getBorderConfig(frameId, frameId);

  // 3. Fallback: If for some reason we get nothing (should be impossible due to Recruit fallback), render kids.
  if (!frameConfig) {
    return <>{children}</>;
  }

  // 4. Construct Dynamic Styles based on the Config
  // We use the config's 'style' (Tailwind classes) and 'shadow' (CSS box-shadow)
  const containerClass = `${sizeClasses[size]} rounded-full overflow-visible flex items-center justify-center relative ${frameConfig.style}`;

  return (
    <motion.div
      className={containerClass}
      style={{
        boxShadow: frameConfig.shadow,
        filter: frameConfig.filter || "none", // Apply brightness/contrast if defined
      }}
      animate={frameConfig.animate || {}}
      transition={frameConfig.transition || {}}
    >
      {children}

      {/* Special Case: Crown Accessory for the specific "gold_aura" or "Gold" if desired */}
      {/* You can add a flag in your config like 'hasCrown: true' later to make this dynamic too! */}
      {(frameId === "gold_aura" || frameId === "Gold") && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-30 text-yellow-400 filter drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">
          <Crown
            size={size === "sm" ? 12 : 24}
            fill="#facc15"
            strokeWidth={1.5}
          />
        </div>
      )}
    </motion.div>
  );
};

export default AvatarFrame;
