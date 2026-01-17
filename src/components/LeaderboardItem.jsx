import { motion } from "framer-motion";
import { getTier, getRarity } from "../utils/xp";
import HeroAvatar from "./HeroAvatar";
import { MapPin } from "lucide-react";

const LeaderboardItem = ({
  hero,
  rank,
  isCurrentUser,
  onClick,
  category = "xp",
  isGlitch = false,
}) => {
  const tier = getTier(hero.level || 1);
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
        return {
          value: (hero.xp || 0).toLocaleString(),
          label: "Total XP",
          color: tier.color,
        };
    }
  };

  const metric = getMetricDisplay();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
      onClick={() => onClick(hero)}
      className={`relative p-5 rounded-[2rem] border transition-all backdrop-blur-xl flex items-center gap-5 cursor-pointer ${
        isCurrentUser
          ? "bg-neon-purple/20 border-neon-purple shadow-[0_0_35px_rgba(168,85,247,0.5)] z-10 scale-[1.02]"
          : "bg-white/5 border-white/10 hover:border-white/20"
      } ${
        isGlitch
          ? "animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.4)] border-red-500 bg-red-500/10"
          : ""
      }`}
    >
      {isCurrentUser && (
        <div className="absolute -top-2 -right-2 px-3 py-1 bg-neon-purple text-white text-[10px] font-black uppercase rounded-full shadow-lg z-20 animate-bounce-slow">
          YOU
        </div>
      )}

      {/* RPG Rank Indicator */}
      <div
        className={`flex flex-col items-center justify-center w-10 h-10 rounded-xl border border-white/5 font-['Orbitron'] font-black italic shadow-inner ${
          rank <= 5 ? "text-white" : "text-gray-600"
        }`}
      >
        <span className="text-[10px] opacity-40 leading-none mb-0.5">RANK</span>
        <span className="text-sm leading-none">#{rank}</span>
      </div>

      <div className="relative">
        <HeroAvatar
          seed={hero.avatarSeed || hero.name}
          tierName={tier.name}
          size={56}
          className={`rounded-2xl border-2 ${
            isCurrentUser ? "border-neon-purple" : "border-white/10"
          }`}
        />
        {isCurrentUser && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-neon-purple rounded-full border-2 border-dark-bg flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-black italic text-base uppercase tracking-tight truncate">
            {hero.name}
          </span>
          {hero.xp === 0 && (
            <span className="text-[8px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded-full font-black tracking-widest uppercase border border-white/10">
              New Recruit
            </span>
          )}
          {hero.thisWeekXP > 500 && (
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-black tracking-widest uppercase border border-red-500/30"
            >
              TRENDING
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[9px] text-gray-500 font-black uppercase tracking-widest mt-1.5 font-mono">
          <span className="text-neon-purple bg-neon-purple/10 px-1.5 py-0.5 rounded border border-neon-purple/20">
            LVL {hero.level || 1}
          </span>
          <span className="opacity-20">•</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-2 h-2" />
            City Hero
          </span>
        </div>
      </div>

      <div className="text-right flex flex-col items-end gap-1">
        <div
          className={`text-xl font-black font-mono leading-none tracking-tighter ${metric.color}`}
        >
          {metric.value}
        </div>
        <div className="text-[8px] text-gray-600 font-black uppercase tracking-[0.2em]">
          {metric.label}
        </div>
      </div>

      {/* Decorative RPG corner */}
      <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-white/5 rounded-br" />
    </motion.div>
  );
};

export default LeaderboardItem;
