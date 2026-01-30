import { motion } from "framer-motion";
import { Award, Star, Zap, Crown, User } from "lucide-react";
import { getTier } from "../utils/xp";
import { getBorderConfig } from "../utils/borderStyles";
import HeroAvatar from "./HeroAvatar";
import AvatarFrame from "./AvatarFrame";

const PodiumSpot = ({
  hero,
  rank,
  delay,
  isCurrentUser,
  category = "xp",
  isGhost = false,
  isShowdown = false,
  onUserClick,
}) => {
  const tier = hero ? getTier(hero.level || 1) : null;

  const isFirst = rank === 1;
  const isSecond = rank === 2;
  const isThird = rank === 3;

  const getTierColors = () => {
    if (isShowdown) {
      return {
        glow: "rgba(220, 38, 38, 0.8)", // intense red
        border: "border-red-500",
        bg: "bg-red-600",
        text: "text-red-500",
        rankBorder: "border-red-500",
      };
    }
    if (isFirst)
      return {
        glow: "rgba(250, 204, 21, 0.4)",
        border: "border-yellow-400",
        bg: "bg-yellow-400",
        text: "text-yellow-400",
        rankBorder: "border-yellow-400",
      };
    if (isSecond)
      return {
        glow: "rgba(148, 163, 184, 0.4)",
        border: "border-slate-300",
        bg: "bg-slate-300",
        text: "text-slate-300",
        rankBorder: "border-gray-300",
      };
    if (isThird)
      return {
        glow: "rgba(251, 146, 60, 0.4)",
        border: "border-orange-400",
        bg: "bg-orange-400",
        text: "text-orange-400",
        rankBorder: "border-orange-400",
      };
    return {
      glow: "rgba(168, 85, 247, 0.4)",
      border: "border-neon-purple",
      bg: "bg-neon-purple",
      text: "text-neon-purple",
      rankBorder: "border-neon-purple",
    };
  };

  const colors = getTierColors();

  const getMetricDisplay = () => {
    if (isGhost) return { value: "---", label: "" };
    switch (category) {
      case "weekly":
        return { value: `${hero?.thisWeekXP || 0} XP`, label: "Weekly" };
      case "reliability":
        return {
          value: `${hero?.reliabilityScore || 100}%`,
          label: "Reliability",
        };
      default:
        return { value: `${hero?.lifetimeXP || 0} XP`, label: "Total" };
    }
  };

  const metric = getMetricDisplay();

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.6, type: "spring" }}
      className={`flex flex-col items-center relative z-10 ${
        isFirst
          ? "order-1 mb-6 md:mb-10 scale-110" // Winner: Vertical lift
          : isSecond
            ? "order-0 mb-0" // Runner Up: Aligned to bottom
            : "order-2 mb-0" // Runner Up: Aligned to bottom
      }`}
      onClick={() => !isGhost && onUserClick && onUserClick(hero)}
    >
      <div className="relative group cursor-pointer">
        {/* Crown for Rank 1 */}
        {isFirst && !isGhost && (
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-8 md:-top-10 left-1/2 -translate-x-1/2 z-30"
          >
            <Crown className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 filter drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
          </motion.div>
        )}

        {/* Animated Tier Aura */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: isGhost ? 0.1 : [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute inset-[-5px] md:inset-[-10px] blur-xl md:blur-2xl rounded-full pointer-events-none"
          style={{
            backgroundColor: isGhost ? "rgba(255,255,255,0.05)" : colors.glow,
            boxShadow: isGhost ? "none" : `0 0 20px md:0 0 40px ${colors.glow}`,
          }}
        />

        {/* 3D Perspective Base/Aura Layer */}
        <div
          className={`absolute inset-0 rounded-full border-2 md:border-4 border-dashed opacity-20 transition-opacity ${
            !isGhost && "animate-spin-slow group-hover:opacity-40"
          }`}
          style={{ borderColor: isGhost ? "white" : colors.glow }}
        />

        {/* Avatar Container: Spaced & Balanced Sizing with "Coin" Border */}
        <div
          className={`relative z-20 flex items-center justify-center rounded-full 
             ${
               isFirst
                 ? "w-24 h-24 md:w-32 md:h-32"
                 : "w-16 h-16 md:w-24 md:h-24"
             }`}
        >
          {isGhost ? (
            <div
              className={`w-full h-full rounded-full bg-white/5 border-[3px] border-dashed border-white/20 flex items-center justify-center relative z-20`}
            >
              <User className="w-8 h-8 md:w-10 md:h-10 text-white/10" />
            </div>
          ) : (
            (() => {
              const hasCosmetic = hero.equippedFrame;
              // If cosmetic frame is active, we might want to hide the hard "coin" border or wrap it inside?
              // Request says: "Winner (#1): Add border-[3px] border-yellow-400".
              // Usually cosmetic frames REPLACE borders. But user asked for "Coin Look".
              // Let's apply the border to the wrapper mostly.

              const borderVisuals = getBorderConfig(
                hero.activeBorder,
                tier?.name || "Recruit",
              );
              return (
                <div className="w-full h-full relative z-20 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                  {/* LAYER 1: Animated Border (Background Layer) - Hidden if cosmetic frame exists */}
                  {!hasCosmetic && (
                    <motion.div
                      className={`absolute inset-0 rounded-full z-20 ${borderVisuals.style}`}
                      style={{
                        boxShadow: borderVisuals.shadow,
                        filter: borderVisuals.filter,
                      }}
                      animate={borderVisuals.animate}
                      transition={borderVisuals.transition}
                    />
                  )}

                  {/* LAYER 2: Avatar with explicit Rank Border ("Coin Look") */}
                  <div
                    className={`relative z-10 w-full h-full rounded-full bg-dark-bg
                      
                    `}
                    // If cosmetic frame exists, we usually don't add another border, but user wants "Coin Look".
                    // Let's assume cosmetic frames handle their own borders or we add it anyway?
                    // Safest bet: Apply if !hasCosmetic to avoid clashing with complex frames.
                    // Re-reading: "Winner (#1): Add border-[3px]...".
                    // I will apply it when there is no cosmetic frame, as the cosmetic frame IS the border usually.
                  >
                    <AvatarFrame
                      frameId={hero.equippedFrame}
                      size={isFirst ? "lg" : "md"}
                    >
                      <HeroAvatar
                        user={hero}
                        seed={hero?.avatarSeed || hero?.name}
                        tierName={tier?.name}
                        size={128} // Use high res
                        className="!w-full !h-full rounded-full overflow-hidden"
                        hideBorder={true}
                      />
                    </AvatarFrame>
                  </div>
                </div>
              );
            })()
          )}
        </div>

        {/* Rank Badge: Circular & Pinned */}
        <div
          className={`absolute -bottom-2 -right-2 md:-bottom-2 md:-right-2 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 border-dark-bg z-30 shadow-xl ${
            isGhost ? "bg-gray-800" : colors.bg
          }`}
        >
          {isFirst && !isGhost ? (
            <Star className="w-4 h-4 md:w-5 md:h-5 text-black fill-current" />
          ) : (
            <span
              className={`font-black font-['Orbitron'] text-xs md:text-sm ${
                isGhost ? "text-gray-500" : "text-black"
              }`}
            >
              #{rank}
            </span>
          )}
        </div>

        {/* Floating XP Indicator tag on hover */}
        {!isGhost && (
          <motion.div className="hidden md:block absolute -top-12 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-40">
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              {metric.value} This Week
            </span>
          </motion.div>
        )}
      </div>

      {/* Identity Info */}
      <div className="text-center mt-3 w-full flex flex-col items-center">
        <div
          className={`font-['Orbitron'] font-bold text-xs md:text-base tracking-tight truncate max-w-[70px] md:max-w-[120px] drop-shadow-md ${
            isGhost ? "text-gray-700" : "text-white"
          }`}
        >
          {isGhost ? "???" : hero?.name}
        </div>
        {!isGhost && (
          <div className="mt-0.5 bg-white/5 backdrop-blur-sm border border-white/5 rounded px-1.5 py-0.5 inline-block">
            <span className="text-[9px] md:text-[10px] font-black text-neon-purple font-mono leading-none">
              {metric.value}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const LeaderboardPodium = ({
  topThree = [],
  currentUserId,
  category = "xp",
  loading = false,
  isShowdown = false,
  onUserClick,
}) => {
  const isGhostMode = loading || topThree.length === 0;

  return (
    <div className="py-2 md:py-20 px-4 flex justify-center relative w-full">
      {" "}
      {/* Outer Wrapper: Reduced vertical padding */}
      {/* Holographic Liquid Glass Container */}
      <div
        className="relative w-full max-w-sm bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-[2rem] p-3 pt-6 md:p-6 backdrop-blur-md shadow-[0_0_15px_rgba(139,92,246,0.15)] flex items-end justify-center overflow-visible"
        style={{
          // Optional: HUD-like inner glow
          boxShadow:
            "inset 0 0 20px rgba(255,255,255,0.05), 0 0 15px rgba(139,92,246,0.15)",
        }}
      >
        {/* Ambient Glows (Subtler) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-neon-purple/20 blur-[50px] rounded-full pointer-events-none opacity-40" />

        {/* Podium Layout: Tight & Intimate */}
        <div className="flex items-end justify-center gap-2 md:gap-5 w-full relative z-10 pb-2">
          <PodiumSpot
            hero={topThree[1]}
            rank={2}
            delay={0.2}
            isCurrentUser={topThree[1]?.id === currentUserId}
            category={category}
            isGhost={isGhostMode}
            isShowdown={isShowdown}
            onUserClick={onUserClick}
          />
          <PodiumSpot
            hero={topThree[0]}
            rank={1}
            delay={0}
            isCurrentUser={topThree[0]?.id === currentUserId}
            category={category}
            isGhost={isGhostMode}
            // Add negative top margin to pop the winner out if needed,
            // but sticking to standard flow for "Tight" look initially.
            // Using slightly reduced mb for winner to keep it snug in the box?
            // Actually, PodiumSpot handles its own mb-6.
            // Let's adjust PodiumSpot margins if we need to via props or leaving as is (mb-6 is fine for lift).
            isShowdown={isShowdown}
            onUserClick={onUserClick}
          />
          <PodiumSpot
            hero={topThree[2]}
            rank={3}
            delay={0.4}
            isCurrentUser={topThree[2]?.id === currentUserId}
            category={category}
            isGhost={isGhostMode}
            isShowdown={isShowdown}
            onUserClick={onUserClick}
          />
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPodium;
