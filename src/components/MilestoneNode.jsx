import { motion } from "framer-motion";
import { Lock, CheckCircle2, Star, Zap, Gem, Trophy } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";

const MilestoneNode = ({ level, reward, isUnlocked, isCurrent, index }) => {
  const nodeRef = useRef(null);
  const pulseRingRef = useRef(null);

  useEffect(() => {
    if (isCurrent && nodeRef.current) {
      gsap.to(nodeRef.current, {
        boxShadow: "0 0 30px rgba(168, 85, 247, 0.6)",
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // 🍎 iOS SAFETY: Use ref instead of class selector + null check
      if (pulseRingRef.current) {
        gsap.to(pulseRingRef.current, {
          scale: 1.5,
          opacity: 0,
          duration: 2,
          repeat: -1,
          ease: "power2.out",
        });
      }
    }
  }, [isCurrent]);

  const icons = {
    10: <Zap className="w-5 h-5 text-yellow-500" />,
    25: <Star className="w-5 h-5 text-blue-400" />,
    50: <Gem className="w-5 h-5 text-emerald-400" />,
    100: <Trophy className="w-5 h-5 text-gold animate-bounce" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      viewport={{ once: true }}
      className={`relative flex items-center gap-3 md:gap-6 mb-24 ${
        index % 2 === 0 ? "flex-row" : "flex-row-reverse text-right"
      }`}
    >
      {/* The 3D Holographic Chip */}
      <div className="relative group">
        {isCurrent && (
          <div
            ref={pulseRingRef}
            className="pulse-ring absolute inset-0 rounded-2xl border-2 border-neon-purple opacity-50 z-0"
          />
        )}

        <div
          ref={nodeRef}
          className={`relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 backdrop-blur-xl overflow-hidden
            ${
              isUnlocked
                ? "bg-neon-purple/20 border-neon-purple shadow-[0_0_20px_#a855f7]"
                : isCurrent
                  ? "bg-white/10 border-white/50 border-dashed"
                  : "bg-white/5 border-white/10 grayscale opacity-60"
            }`}
        >
          {(isUnlocked || isCurrent) && <div className="scanline" />}
          {isUnlocked ? (
            <div className="absolute -top-3 -right-3 bg-green-500 rounded-full p-1 shadow-lg ring-2 ring-dark-bg z-20">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          ) : !isUnlocked && !isCurrent ? (
            <Lock className="w-6 h-6 text-gray-500" />
          ) : null}

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black font-mono text-gray-400 uppercase tracking-tighter mb-1">
              LVL
            </span>
            <span
              className={`text-2xl font-black font-['Orbitron'] ${
                isUnlocked ? "text-white" : "text-gray-500"
              }`}
            >
              {level}
            </span>
          </div>
        </div>

        {/* 3D Reflection Effect */}
        <div className="absolute inset-x-2 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent blur-[1px] group-hover:via-white/60 transition-all" />
      </div>

      {/* Reward Content */}
      <div
        className={`flex-1 max-w-[180px] p-4 glassmorphism-dark rounded-2xl border transition-all ${
          isUnlocked
            ? "border-neon-purple/30 bg-neon-purple/5"
            : "border-white/5 opacity-50 grayscale"
        }`}
      >
        <div
          className={`flex items-center gap-3 mb-2 ${
            index % 2 !== 0 ? "flex-row-reverse" : ""
          }`}
        >
          <div className="p-2 bg-white/5 rounded-lg border border-white/10">
            {icons[level] || <Zap className="w-5 h-5" />}
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
        </div>
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">
          UNLOCK_REWARD
        </h3>
        <p className="text-sm font-black text-white leading-tight italic">
          {reward}
        </p>
      </div>

      {/* Floating Level Label (Desktop/Tablet) */}
      <div
        className={`absolute top-0 ${
          index % 2 === 0 ? "-left-16" : "-right-16"
        } hidden sm:block`}
      >
        <span className="text-4xl font-black font-['Orbitron'] opacity-10 italic">
          #{index + 1}
        </span>
      </div>
    </motion.div>
  );
};

export default MilestoneNode;
