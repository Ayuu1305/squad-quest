import { Users, MapPin, Clock, Gift, Flame, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";
import HeroAvatar from "./HeroAvatar";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useAuth } from "../context/AuthContext";

const QuestCard = ({ quest, hub, isMyMission = false }) => {
  const { user } = useAuth();
  
  // ❌ REMOVED: const [members, setMembers] = useState([]); 
  // ❌ REMOVED: The useEffect that fetched members (The Battery Drainer)

  // ✅ NEW: Read directly from the prop (Instant & Free)
  // If the 'members' array exists on the quest object, use it. Otherwise empty array.
  const displayMembers = quest.members || [];
  
  // ✅ NEW: Calculate count safely (uses 'membersCount' number if available, else array length)
 const displayCount = displayMembers.length > 0 ? displayMembers.length : (quest.membersCount || 0);
  
  const maxPlayers = quest.maxPlayers || 5;
  const cardRef = useRef(null);
  const titleRef = useRef(null);
  const glowRef = useRef(null);

  // Rarity styling logic - Cyberpunk Dark Theme
  const getRarity = (difficulty = 1) => {
    switch (difficulty) {
      case 5:
        return {
          msg: "LEGENDARY",
          color: "#a855f7", // purple-500
          shadow: "shadow-[0_0_30px_rgba(168,85,247,0.4)]",
          border: "border-neon-purple/50",
          bg: "bg-neon-purple/5",
        };
      case 4:
        return {
          msg: "EPIC",
          color: "#ec4899", // pink-500
          shadow: "shadow-[0_0_30px_rgba(236,72,153,0.3)]",
          border: "border-pink-500/50",
          bg: "bg-pink-500/5",
        };
      case 3:
        return {
          msg: "RARE",
          color: "#3b82f6", // blue-500
          shadow: "shadow-[0_0_30px_rgba(59,130,246,0.3)]",
          border: "border-blue-500/50",
          bg: "bg-blue-500/5",
        };
      case 2:
        return {
          msg: "UNCOMMON",
          color: "#10b981", // emerald-500
          shadow: "shadow-[0_0_30px_rgba(16,185,129,0.3)]",
          border: "border-emerald-500/50",
          bg: "bg-emerald-500/5",
        };
      default:
        return {
          msg: "COMMON",
          color: "#9ca3af", // gray-400
          shadow: "shadow-none",
          border: "border-white/10",
          bg: "bg-white/5",
        };
    }
  };

  const rarity = getRarity(quest.difficulty || 1);

  // ✅ Completed Quest Overrides
  const isCompleted = quest.status === "completed";
  const completedStyle = isCompleted
    ? {
        msg: "COMPLETED",
        color: "#10b981", // emerald-500 (green)
        shadow: "shadow-[0_0_30px_rgba(16,185,129,0.3)]",
        border: "border-emerald-500/50",
        bg: "bg-emerald-500/10",
      }
    : null;
  const displayRarity = completedStyle || rarity;

  // Level Gating
  const THREAT_LEVEL_REQUIREMENTS = { 1: 0, 2: 10, 3: 25, 4: 40, 5: 50 };
  const requiredLevel = THREAT_LEVEL_REQUIREMENTS[quest.difficulty || 1] || 0;
  const userLevel = user?.level || 1;
  const isLocked = userLevel < requiredLevel;

  // GSAP Animations
  useGSAP(() => {
    const card = cardRef.current;
    if (!card) return;

    // Glitch Effect on Title Hover
    const hoverCtx = gsap.context(() => {
      card.addEventListener("mouseenter", () => {
        gsap.to(titleRef.current, {
          skewX: -10,
          duration: 0.1,
          yoyo: true,
          repeat: 3,
          onComplete: () => gsap.set(titleRef.current, { skewX: 0 }),
        });

        // Intensify glow
        gsap.to(glowRef.current, { opacity: 0.6, duration: 0.3 });
      });

      card.addEventListener("mouseleave", () => {
        gsap.to(glowRef.current, { opacity: 0, duration: 0.3 });
      });
    });

    return () => hoverCtx.revert();
  }, [quest.difficulty]);

  // Hot Zone Logic (High Demand / Urgency)
  const isHotZone = () => {
    // 1. High Capacity (>75%) using displayCount
    const capacityRatio = displayCount / maxPlayers;
    if (capacityRatio >= 0.75 && capacityRatio < 1) return true;

    // 2. Starts Soon (<30 mins)
    if (quest.startTime) {
      const now = new Date();
      const startTime = quest.startTime.toDate
        ? quest.startTime.toDate()
        : new Date(quest.startTime);
      const diffMins = (startTime - now) / 1000 / 60;
      if (diffMins <= 30 && diffMins > -120) return true; // Active or starting soon
    }

    return false;
  };

  const hotZoneActive = isHotZone();

  return (
    <motion.div
      ref={cardRef}
      whileHover={{
        scale: isCompleted ? 1.01 : 1.02, // Less hover lift for completed
        y: isCompleted ? -2 : -5,
        boxShadow: hotZoneActive
          ? `0 0 40px rgba(249, 115, 22, 0.4)` // Orange glow for Hot Zone
          : `0 0 30px ${displayRarity.color}40`,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isCompleted ? 0.7 : 1, y: 0 }} // ✅ Dim completed quests
      layout
      className={`glassmorphism-dark rounded-[24px] p-1 relative group overflow-hidden transition-all duration-300 ${
        hotZoneActive
          ? "border-orange-500/50 animate-[pulse_3s_infinite]"
          : displayRarity.border
      }`}
    >
      {/* Mobile Swipe Hint */}
      <div className="absolute top-1/2 right-2 transform -translate-y-1/2 opacity-0 md:hidden animate-pulse pointer-events-none z-20">
        <div className="w-1 h-8 bg-white/20 rounded-full" />
      </div>

      {/* Dynamic Background Glow */}
      <div
        ref={glowRef}
        className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-300 pointer-events-none"
        style={{
          background: hotZoneActive
            ? `radial-gradient(circle at center, rgba(249, 115, 22, 0.2) 0%, transparent 80%)` // Hot Zone Glow
            : `radial-gradient(circle at center, ${displayRarity.color}20 0%, transparent 70%)`,
        }}
      />

      {/* Hot Zone Badge */}
      {hotZoneActive && (
        <div className="absolute top-0 right-0 z-30 bg-orange-500/20 border-b border-l border-orange-500/50 rounded-bl-2xl px-3 py-1.5 flex items-center gap-1.5 backdrop-blur-md">
          <Flame
            className="w-3 h-3 text-orange-500 animate-[bounce_1s_infinite]"
            fill="currentColor"
          />
          <span className="text-[9px] font-black uppercase tracking-widest text-orange-400">
            Filling Fast
          </span>
        </div>
      )}

      {/* Level Lock Badge */}
      {isLocked && (
        <div className="absolute top-0 left-0 z-30 bg-red-500/20 border-b border-r border-red-500/50 rounded-br-2xl px-3 py-1.5 flex items-center gap-1.5 backdrop-blur-md">
          <Lock className="w-3 h-3 text-red-500" />
          <span className="text-[9px] font-black uppercase tracking-widest text-red-400">
            LVL {requiredLevel}
          </span>
        </div>
      )}

      <div
        className={`backdrop-blur-xl rounded-[20px] p-5 h-full relative z-10 flex flex-col justify-between ${
          hotZoneActive
            ? "bg-gradient-to-br from-orange-900/20 to-black/90"
            : "bg-black/80"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3
              ref={titleRef}
              className="text-xl font-black font-['Orbitron'] text-white italic tracking-tighter mb-2 transition-colors group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400"
            >
              {quest.title}
            </h3>
            {/* Tags Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Rarity + Level Badge (or COMPLETED Badge) */}
              <div
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${displayRarity.border} ${displayRarity.bg}`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${isCompleted ? "" : "animate-pulse"}`}
                  style={{ backgroundColor: displayRarity.color }}
                />
                <span
                  className="text-[9px] font-black uppercase tracking-widest"
                  style={{ color: displayRarity.color }}
                >
                  {displayRarity.msg}
                </span>
                {!isCompleted && (
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest ml-1 pl-1 border-l border-white/10">
                    LVL {quest.difficulty || 1}
                  </span>
                )}
              </div>

              {/* Gender Tag */}
              {quest.genderPreference === "male" && (
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider border bg-cyan-500/10 border-cyan-500/30 text-cyan-400 uppercase">
                  MALE ONLY
                </span>
              )}
              {quest.genderPreference === "female" && (
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider border bg-pink-500/10 border-pink-500/30 text-pink-400 uppercase">
                  FEMALE ONLY
                </span>
              )}
              {(quest.genderPreference === "everyone" ||
                !quest.genderPreference) && (
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 uppercase">
                  OPEN FOR ALL
                </span>
              )}
            </div>
          </div>

          {user?.uid === quest.hostId && (
            <div className="bg-neon-purple/20 border border-neon-purple/40 px-2 py-1 rounded-lg">
              <span className="text-[9px] font-black text-neon-purple uppercase tracking-widest">
                HOST
              </span>
            </div>
          )}
        </div>

        {/* Squad Capacity Bar - Animated */}
        <div className="mb-6">
          <div className="flex justify-between items-end mb-1.5">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
              Squad Capacity
            </span>
            <span className="text-[10px] font-mono text-white font-bold">
              {displayCount}/{maxPlayers}
            </span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(displayCount / maxPlayers) * 100}%` }}
              transition={{ duration: 1, ease: "circOut" }}
              className="h-full relative overflow-hidden"
              style={{ backgroundColor: displayRarity.color }}
            >
              <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
            </motion.div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5 group-hover:border-white/10 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                Timing
              </span>
            </div>
            <div className="text-xs font-mono font-bold text-white">
              {quest.startTime
                ? new Date(
                    quest.startTime.toDate
                      ? quest.startTime.toDate()
                      : quest.startTime,
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "TBD"}
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/5 group-hover:border-white/10 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <Gift
                className={`w-3 h-3 ${isMyMission || displayMembers.includes(quest.hostId) ? "text-yellow-400 animate-pulse" : "text-gray-400"}`}
              />
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                Loot
              </span>
            </div>
            <div
              className={`text-xs font-mono font-bold ${isMyMission ? "text-yellow-400" : "text-white"}`}
            >
              {quest.loot || "Active"}
            </div>
          </div>
        </div>

        {/* Footer: Joined Members and Count */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
          <div className="flex -space-x-2">
            {/* Safely map over displayMembers */}
            {displayMembers.slice(0, 3).map((uid) => (
              <div
                key={uid}
                className="w-8 h-8 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center overflow-hidden"
              >
                <HeroAvatar seed={uid} size={32} />
              </div>
            ))}
            {displayMembers.length > 3 && (
              <div className="w-8 h-8 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center z-0">
                <span className="text-[9px] font-bold text-gray-400">
                  +{displayMembers.length - 3}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Users className="w-3 h-3 text-gray-500" />
            <AnimatePresence mode="popLayout">
              <motion.span
                key={displayCount}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                className="text-xs font-bold text-white"
              >
                {displayCount} Joined
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default QuestCard;