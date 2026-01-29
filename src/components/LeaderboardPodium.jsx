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
      };
    }
    if (isFirst)
      return {
        glow: "rgba(250, 204, 21, 0.4)",
        border: "border-yellow-400",
        bg: "bg-yellow-400",
        text: "text-yellow-400",
      };
    if (isSecond)
      return {
        glow: "rgba(148, 163, 184, 0.4)",
        border: "border-slate-300",
        bg: "bg-slate-300",
        text: "text-slate-300",
      };
    if (isThird)
      return {
        glow: "rgba(251, 146, 60, 0.4)",
        border: "border-orange-400",
        bg: "bg-orange-400",
        text: "text-orange-400",
      };
    return {
      glow: "rgba(168, 85, 247, 0.4)",
      border: "border-neon-purple",
      bg: "bg-neon-purple",
      text: "text-neon-purple",
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
      className={`flex flex-col items-center gap-3 relative z-10 ${
        isFirst ? "order-1 -mt-16 scale-110" : isSecond ? "order-0" : "order-2"
      }`}
      onClick={() => !isGhost && onUserClick && onUserClick(hero)}
    >
      <div className="relative group cursor-pointer">
        {/* Crown for Rank 1 */}
        {isFirst && !isGhost && (
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 z-30"
          >
            <Crown className="w-8 h-8 text-yellow-400 filter drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
          </motion.div>
        )}

        {/* Animated Tier Aura */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: isGhost ? 0.1 : [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute inset-[-10px] blur-2xl rounded-full pointer-events-none"
          style={{
            backgroundColor: isGhost ? "rgba(255,255,255,0.05)" : colors.glow,
            boxShadow: isGhost ? "none" : `0 0 40px ${colors.glow}`,
          }}
        />

        {/* 3D Perspective Base/Aura Layer */}
        <div
          className={`absolute inset-0 rounded-full border-4 border-dashed opacity-20 transition-opacity ${
            !isGhost && "animate-spin-slow group-hover:opacity-40"
          }`}
          style={{ borderColor: isGhost ? "white" : colors.glow }}
        />

        {/* Avatar Container */}
        {isGhost ? (
          <div className="w-[100px] h-[100px] rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center relative z-20">
            <User className="w-10 h-10 text-white/10" />
          </div>
        ) : (
          (() => {
            const hasCosmetic = hero.equippedFrame;
            const borderVisuals = getBorderConfig(
              hero.activeBorder,
              tier?.name || "Recruit",
            );
            return (
              <div className="relative z-20 flex items-center justify-center p-1 transition-transform duration-500 group-hover:scale-105">
                {/* LAYER 1: Animated Border (Background Layer) - Hidden if cosmetic frame exists */}
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
                  className={`relative z-10 rounded-full ${!hasCosmetic && "border-2 border-dark-bg bg-dark-bg"}`}
                >
                  <AvatarFrame
                    frameId={hero.equippedFrame}
                    size={isFirst ? "lg" : "md"}
                  >
                    <HeroAvatar
                      user={hero}
                      seed={hero?.avatarSeed || hero?.name}
                      tierName={tier?.name}
                      size={isFirst ? 132 : 92}
                      className="rounded-full overflow-hidden"
                      hideBorder={true}
                    />
                  </AvatarFrame>
                </div>
              </div>
            );
          })()
        )}

        {/* Rank Badge */}
        <div
          className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center border-2 border-dark-bg z-30 shadow-xl ${
            isGhost ? "bg-gray-800" : colors.bg
          }`}
        >
          {isFirst && !isGhost ? (
            <Star className="w-6 h-6 text-black fill-current" />
          ) : (
            <span
              className={`font-black font-['Orbitron'] text-sm ${
                isGhost ? "text-gray-500" : "text-black"
              }`}
            >
              #{rank}
            </span>
          )}
        </div>

        {/* Floating XP Indicator tag on hover */}
        {!isGhost && (
          <motion.div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-40">
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              {metric.value} This Week
            </span>
          </motion.div>
        )}
      </div>

      {/* Identity Info */}
      <div className="text-center mt-2">
        <div
          className={`font-['Orbitron'] font-black text-base tracking-tighter truncate w-32 drop-shadow-lg ${
            isGhost ? "text-gray-700" : "text-white"
          }`}
        >
          {isGhost ? "???" : hero?.name}
        </div>
        <div
          className={`text-[9px] font-black uppercase tracking-[0.2em] font-mono mb-1 ${
            isGhost
              ? "text-gray-800"
              : isFirst
                ? "text-yellow-400"
                : "text-gray-500"
          }`}
        >
          {isGhost ? "LOCKED" : "Elite Hero"}
        </div>
        {!isGhost && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-lg px-2 py-0.5 inline-block">
            <span className="text-[10px] font-black text-neon-purple font-mono">
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
  onUserClick, // ADDED Prop
}) => {
  const isGhostMode = loading || topThree.length === 0;

  return (
    <div className="flex items-end justify-center gap-4 py-26 px-4 bg-gradient-to-b from-neon-purple/10 to-transparent rounded-t-[3rem] relative overflow-hidden">
      {/* Background RPG Aura */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(168,85,247,0.1)_0%,_transparent_70%)] pointer-events-none" />

      <PodiumSpot
        hero={topThree[1]}
        rank={2}
        delay={0.2}
        isCurrentUser={topThree[1]?.id === currentUserId}
        category={category}
        isGhost={isGhostMode}
        isShowdown={isShowdown}
        onUserClick={onUserClick} // Pass handler
      />
      <PodiumSpot
        hero={topThree[0]}
        rank={1}
        delay={0}
        isCurrentUser={topThree[0]?.id === currentUserId}
        category={category}
        isGhost={isGhostMode}
        isShowdown={isShowdown}
        onUserClick={onUserClick} // Pass handler
      />
      <PodiumSpot
        hero={topThree[2]}
        rank={3}
        delay={0.4}
        isCurrentUser={topThree[2]?.id === currentUserId}
        category={category}
        isGhost={isGhostMode}
        isShowdown={isShowdown}
        onUserClick={onUserClick} // Pass handler
      />
    </div>
  );
};

export default LeaderboardPodium;
