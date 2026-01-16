import React from "react";
import { getHeroAvatarUrl } from "../utils/avatars";

const HeroAvatar = ({
  seed,
  tierName = "Bronze",
  size = 150,
  className = "",
  aura = null, // 'gold', 'blue', 'silver', 'mythic'
}) => {
  const avatarUrl = getHeroAvatarUrl(seed, tierName, size);

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

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className} ${auraClass}`}
      style={{ width: size, height: size, borderRadius: "50%" }}
    >
      {/* Standard Glow Ring (Only if no custom aura) */}
      {!aura && (
        <div
          className="absolute inset-0 rounded-full animate-pulse-slow"
          style={{
            boxShadow: `0 0 30px ${colors.glow}`,
            border: `2px solid ${colors.ring}30`,
          }}
        />
      )}

      {/* Inner Rotating Ring (Standard) */}
      {!aura && (
        <div
          className="absolute inset-[-4px] rounded-full border-2 border-dashed transition-transform duration-[10s] animate-spin-slow opacity-50"
          style={{ borderColor: colors.ring }}
        />
      )}

      {/* Main Avatar Container */}
      <div
        className="relative w-full h-full rounded-full overflow-hidden border-2 bg-dark-bg/80"
        style={{ borderColor: aura ? "transparent" : colors.ring }}
      >
        <img
          src={avatarUrl}
          alt="Hero Avatar"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default HeroAvatar;
