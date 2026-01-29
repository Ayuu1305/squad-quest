import { motion } from "framer-motion";
import { getTier, getRarity } from "../utils/xp";
import { getLevelProgress } from "../utils/leveling"; // ✅ Import for level calculation
import { getBorderConfig } from "../utils/borderStyles";
import HeroAvatar from "./HeroAvatar";
import AvatarFrame from "./AvatarFrame";
import { MapPin } from "lucide-react";

const LeaderboardItem = ({
  hero,
  rank,
  isCurrentUser,
  onClick,
  category = "xp",
  isGlitch = false,
}) => {
  // ✅ Calculate level from lifetimeXP (not cached hero.level)
  const { level } = getLevelProgress(hero.lifetimeXP || hero.xp || 0);
  const tier = getTier(level);
  const rarity = getRarity(hero.xp || 0);

  const getMetricDisplay = () => {
    switch (category) {
      case "weekly":
        return {
          value: (hero.thisWeekXP || 0).toLocaleString(),
          label: "Weekly XP",
          color: "text-neon-purple",
        };
      case "reliability":
        return {
          value: `${hero.reliabilityScore || 100}%`,
          label: "Reliability",
          color: "text-green-400",
        };
      default:
        // 🎖️ Use lifetimeXP for ranking (fallback to xp for old users)
        const totalXP = hero.lifetimeXP || hero.xp || 0;

        return {
          value: totalXP.toLocaleString(),
          label: "Total XP",
          color: tier.color,
        };
    }
  };

  const metric = getMetricDisplay();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(hero)}
      className={`relative mb-3 rounded-2xl sm:rounded-[2rem] border overflow-hidden transition-all backdrop-blur-xl cursor-pointer group ${
        isCurrentUser
          ? "bg-gradient-to-r from-neon-purple/20 via-neon-purple/10 to-transparent border-neon-purple/50 shadow-[0_0_20px_rgba(168,85,247,0.3)] z-10"
          : "bg-gradient-to-r from-white/10 to-transparent border-white/10 hover:border-white/20 hover:bg-white/10"
      } ${
        isGlitch
          ? "animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.4)] border-red-500 bg-red-500/10"
          : ""
      }`}
    >
      <div className="flex items-center p-3 sm:p-5 gap-3 sm:gap-5 relative z-10">
        {/* Rank Badge - Stylized */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center w-10 sm:w-14">
          <div
            className={`font-['Orbitron'] font-black italic text-xl sm:text-2xl leading-none drop-shadow-md ${
              rank <= 3
                ? "text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                : "text-white"
            }`}
          >
            #{rank}
          </div>
          {rank <= 3 && (
            <div className="h-0.5 w-6 bg-yellow-400/50 rounded-full mt-1" />
          )}
        </div>

        {/* Avatar Section */}
        <div className="relative flex-shrink-0 w-14 h-14 flex items-center justify-center">
          {(() => {
            const hasCosmetic = hero.equippedFrame;
            const borderVisuals = getBorderConfig(hero.activeBorder, tier.name);

            return (
              <>
                {/* LAYER 1: Animated Border (Background) - Hidden if cosmetic frame exists */}
                {!hasCosmetic && (
                  <motion.div
                    className={`absolute inset-0 rounded-full ${borderVisuals.style}`}
                    style={{
                      boxShadow: borderVisuals.shadow,
                      filter: borderVisuals.filter,
                    }}
                    animate={borderVisuals.animate}
                    transition={borderVisuals.transition}
                  />
                )}

                {/* LAYER 2: Avatar with optional cosmetic frame */}
                <div
                  className={`relative z-10 ${hasCosmetic ? "w-full h-full" : "w-[85%] h-[85%]"} rounded-full ${!hasCosmetic && "border-2 border-dark-bg bg-dark-bg"} flex items-center justify-center`}
                >
                  <AvatarFrame frameId={hero.equippedFrame} size="sm">
                    <HeroAvatar
                      user={hero}
                      seed={hero.avatarSeed || hero.name}
                      tierName={tier.name}
                      size={42}
                      className="rounded-full overflow-hidden"
                      hideBorder={true}
                    />
                  </AvatarFrame>
                </div>
              </>
            );
          })()}

          {/* Level Badge Overlap */}
          <div className="absolute -bottom-1 -right-1 bg-dark-bg rounded-md px-1 py-0.5 border border-white/10 shadow-lg flex items-center gap-0.5 z-20">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[8px] font-black text-white px-0.5">
              L{level}
            </span>
          </div>
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span className="text-white font-['Orbitron'] font-bold text-sm sm:text-lg tracking-wide truncate drop-shadow-sm">
              {hero.name}
            </span>
            {isCurrentUser && (
              <span className="text-[8px] bg-neon-purple text-white px-1.5 py-0.5 rounded-sm font-black uppercase tracking-wider">
                YOU
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-gray-400 font-mono uppercase tracking-widest">
              <MapPin className="w-3 h-3 text-neon-purple/70" />
              <span className="truncate max-w-[80px] sm:max-w-none">
                {hero.city || "Roaming"}
              </span>
            </div>
            {hero.thisWeekXP > 0 && (
              <>
                <span className="w-0.5 h-2 bg-white/20" />
                <span className="text-[9px] text-green-400 font-mono">
                  +{hero.thisWeekXP}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right Side Stats */}
        <div className="text-right flex-shrink-0 flex flex-col items-end pl-2 border-l border-white/5">
          <div
            className={`font-['Orbitron'] font-black text-lg sm:text-2xl leading-none tracking-tighter ${metric.color} drop-shadow-[0_0_15px_rgba(168,85,247,0.2)]`}
          >
            {metric.value}
          </div>
          <div className="text-[8px] sm:text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1">
            {metric.label.split(" ")[0]} {/* "Total"/"Weekly" only */}
          </div>
        </div>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-white/5 to-transparent skew-x-12 opacity-50" />
        {isCurrentUser && (
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-neon-purple to-transparent opacity-70" />
        )}
      </div>
    </motion.div>
  );
};

export default LeaderboardItem;
