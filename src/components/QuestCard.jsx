import { Users, MapPin, Clock, Gift, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../backend/firebaseConfig";
import HeroAvatar from "./HeroAvatar";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const QuestCard = ({ quest, hub, isMyMission = false }) => {
  const [members, setMembers] = useState([]);
  const maxPlayers = quest.maxPlayers || 5;
  const cardRef = useRef(null);
  const titleRef = useRef(null);
  const glowRef = useRef(null);

  // Subscribe to Members Subcollection
  useEffect(() => {
    if (!quest.id) return;
    const membersRef = collection(db, "quests", quest.id, "members");
    const unsubscribe = onSnapshot(
      membersRef,
      (snapshot) => {
        const memberIds = snapshot.docs.map((doc) => doc.id);
        setMembers(memberIds);
      },
      (error) => {
        if (error?.code !== "permission-denied") {
          console.warn("Members listener error:", error);
        }
      },
    );
    return unsubscribe;
  }, [quest.id]);

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

  return (
    <motion.div
      ref={cardRef}
      whileHover={{
        scale: 1.02,
        y: -5,
        boxShadow: `0 0 30px ${rarity.color}40`,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      className={`glassmorphism-dark rounded-[24px] p-1 relative group overflow-hidden transition-all duration-300 ${rarity.border}`}
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
          background: `radial-gradient(circle at center, ${rarity.color}20 0%, transparent 70%)`,
        }}
      />

      <div className="bg-black/80 backdrop-blur-xl rounded-[20px] p-5 h-full relative z-10 flex flex-col justify-between">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3
              ref={titleRef}
              className="text-xl font-black font-['Orbitron'] text-white italic tracking-tighter mb-1 transition-colors group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400"
            >
              {quest.title}
            </h3>
            <div
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${rarity.border} ${rarity.bg}`}
            >
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: rarity.color }}
              />
              <span
                className="text-[9px] font-black uppercase tracking-widest"
                style={{ color: rarity.color }}
              >
                {rarity.msg}
              </span>
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest ml-1 pl-1 border-l border-white/10">
                LVL {quest.difficulty || 1}
              </span>
            </div>
          </div>

          {isMyMission && (
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
              {members.length}/{maxPlayers}
            </span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(members.length / maxPlayers) * 100}%` }}
              transition={{ duration: 1, ease: "circOut" }}
              className="h-full relative overflow-hidden"
              style={{ backgroundColor: rarity.color }}
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
                className={`w-3 h-3 ${isMyMission || members.includes(quest.hostId) ? "text-yellow-400 animate-pulse" : "text-gray-400"}`}
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
            {members.slice(0, 3).map((uid) => (
              <div
                key={uid}
                className="w-8 h-8 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center overflow-hidden"
              >
                <HeroAvatar uid={uid} size="sm" />
              </div>
            ))}
            {members.length > 3 && (
              <div className="w-8 h-8 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center z-0">
                <span className="text-[9px] font-bold text-gray-400">
                  +{members.length - 3}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Users className="w-3 h-3 text-gray-500" />
            <AnimatePresence mode="popLayout">
              <motion.span
                key={members.length}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                className="text-xs font-bold text-white"
              >
                {members.length} Joined
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default QuestCard;
