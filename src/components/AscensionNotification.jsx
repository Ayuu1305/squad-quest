import { motion, AnimatePresence } from "framer-motion";
import { Award, Zap, Star } from "lucide-react";
import { BADGE_TIERS } from "../utils/xp";

const AscensionNotification = ({ badgeName, tier, onComplete }) => {
  const tierInfo = BADGE_TIERS[tier.toUpperCase()] || BADGE_TIERS.BRONZE;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl px-6"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-neon-purple/20 blur-[120px] rounded-full"
        />
      </div>

      <div className="relative text-center max-w-sm w-full">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12, stiffness: 100 }}
          className="relative inline-block mb-12"
        >
          {/* Badge Aura */}
          <motion.div
            animate={{
              rotate: 360,
              boxShadow: [
                `0 0 20px ${tierInfo.hex}44`,
                `0 0 60px ${tierInfo.hex}88`,
                `0 0 20px ${tierInfo.hex}44`,
              ],
            }}
            transition={{
              rotate: { duration: 10, repeat: Infinity, ease: "linear" },
              boxShadow: { duration: 2, repeat: Infinity },
            }}
            className="absolute inset-[-20px] rounded-full border border-dashed border-white/20"
          />

          <div
            className={`w-48 h-48 rounded-full bg-gradient-to-b from-white/10 to-transparent flex items-center justify-center border-4 border-${tierInfo.color.replace(
              "text-",
              ""
            )} shadow-2xl relative z-10 p-10`}
          >
            <Award className={`w-full h-full ${tierInfo.color}`} />

            {/* Particle Sparkles (Gold/Legendary) */}
            {(tier === "GOLD" || tier === "LEGENDARY") && (
              <div className="absolute inset-0">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [-20, -100],
                      x: [0, i % 2 === 0 ? 30 : -30],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                    className="absolute top-1/2 left-1/2"
                  >
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.h2
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[10px] font-black font-mono tracking-[0.5em] text-neon-purple uppercase mb-4"
          >
            Ascension Detected
          </motion.h2>
          <h1 className="text-5xl font-['Orbitron'] font-black text-white italic tracking-tighter mb-2">
            {badgeName}
          </h1>
          <p
            className={`${tierInfo.color} font-black font-mono text-sm uppercase tracking-widest mb-12`}
          >
            {tierInfo.name} Rank Achieved
          </p>

          <button
            onClick={onComplete}
            className="w-full btn-primary py-5 rounded-2xl font-black italic tracking-widest text-lg uppercase flex items-center justify-center gap-3 shadow-[0_0_50px_rgba(168,85,247,0.4)] group"
          >
            Claim the Power
            <Zap className="w-6 h-6 group-hover:fill-current transition-all" />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AscensionNotification;
