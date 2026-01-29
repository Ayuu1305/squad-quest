import { motion } from "framer-motion";
import { Crown } from "lucide-react";

/**
 * AvatarFrame - Reusable component for rendering cosmetic frame effects
 * @param {string} frameId - The SKU of the frame (e.g., "gold_aura", "fire_aura")
 * @param {ReactNode} children - The user avatar/image to wrap
 * @param {string} size - Size variant: "sm", "md", "lg" (default: "md")
 */
const AvatarFrame = ({ frameId, children, size = "md" }) => {
  // Size mappings
  const sizeClasses = {
    sm: "p-0.5",
    md: "p-1",
    lg: "p-1.5",
  };

  const glowSize = {
    sm: "shadow-[0_0_10px_var(--glow-color)]",
    md: "shadow-[0_0_20px_var(--glow-color)]",
    lg: "shadow-[0_0_30px_var(--glow-color)]",
  };

  // Frame configurations
  const frameStyles = {
    gold_aura: {
      containerClass: `${sizeClasses[size]} ${glowSize[size]} border-2 border-yellow-400 rounded-full`,
      glowColor: "#ffd700",
      animation: "pulse",
    },
    fire_aura: {
      containerClass: `${sizeClasses[size]} ${glowSize[size]} border-2 border-transparent rounded-full bg-gradient-to-br from-orange-500 via-red-500 to-orange-600`,
      glowColor: "#ff4500",
      animation: "pulse",
    },
    neon_frame_01: {
      containerClass: `${sizeClasses[size]} ${glowSize[size]} border-2 border-neon-purple rounded-full`,
      glowColor: "#a855f7",
      animation: "pulse",
    },
  };

  // If no frame or invalid frame, render plain children
  if (!frameId || !frameStyles[frameId]) {
    return <>{children}</>;
  }

  const frame = frameStyles[frameId];

  return (
    <motion.div
      className={`relative inline-flex items-center justify-center rounded-full overflow-visible ${frame.containerClass}`}
      style={{
        "--glow-color": frame.glowColor,
      }}
      animate={
        frame.animation === "pulse"
          ? {
              boxShadow: [
                `0 0 20px ${frame.glowColor}`,
                `0 0 30px ${frame.glowColor}`,
                `0 0 20px ${frame.glowColor}`,
              ],
            }
          : {}
      }
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}

      {/* Golden Crown Accessory for Midas Touch */}
      {frameId === "gold_aura" && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-30 text-yellow-400 filter drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">
          <Crown size={24} fill="#facc15" strokeWidth={1.5} />
        </div>
      )}
    </motion.div>
  );
};

export default AvatarFrame;
