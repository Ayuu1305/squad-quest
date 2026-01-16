import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Crown,
  Coffee,
  Tag,
  ShieldCheck,
  Star,
  Sparkles,
  Flame,
} from "lucide-react";

const WinnerCircleModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const rewards = [
    {
      rank: 1,
      title: "The Ahmedabad Legend",
      aura: "Burning Gold",
      auraColor: "from-yellow-400 via-orange-500 to-red-600",
      icon: Crown,
      digitalReward: "Legend Title + Burning Gold Aura",
      realReward: "Free Coffee / Meal @ Partner Café",
      note: "Valid for 7 Days",
    },
    {
      rank: 2,
      title: "Elite Hero",
      aura: "Electric Blue",
      auraColor: "from-cyan-400 via-blue-500 to-indigo-600",
      icon: Star,
      digitalReward: "Electric Blue Aura",
      realReward: "50% OFF QR Code",
      note: "One-time use",
    },
    {
      rank: 3,
      title: "Rising Star",
      aura: "Silver Shimmer",
      auraColor: "from-gray-300 via-slate-400 to-gray-500",
      icon: Sparkles,
      digitalReward: "Silver Shimmer Aura",
      realReward: "20% OFF QR Code",
      note: "One-time use",
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.2)]"
        >
          {/* Header */}
          <div className="relative p-6 pt-8 text-center border-b border-white/5 bg-gradient-to-b from-neon-purple/10 to-transparent">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-block p-3 rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border border-yellow-500/50 mb-4 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
            >
              <Crown className="w-8 h-8 text-yellow-400" />
            </motion.div>

            <h2 className="text-3xl font-['Orbitron'] font-black text-white italic tracking-tighter uppercase mb-1">
              Winner's Circle
            </h2>
            <p className="text-neon-purple font-mono text-[10px] uppercase tracking-[0.2em] font-bold">
              Weekly Prize Pool
            </p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
            {rewards.map((tier, index) => (
              <motion.div
                key={tier.rank}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/5 p-4 group hover:bg-white/10 transition-colors"
              >
                {/* Aura Glow Effect */}
                <div
                  className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${tier.auraColor} opacity-10 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:opacity-20 transition-opacity`}
                />

                <div className="relative z-10 flex items-start gap-4">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${tier.auraColor} shadow-lg text-white font-black text-xl font-['Orbitron'] italic`}
                  >
                    #{tier.rank}
                  </div>

                  <div className="flex-1">
                    <h3
                      className={`font-['Orbitron'] font-black uppercase text-lg italic bg-clip-text text-transparent bg-gradient-to-r ${tier.auraColor} mb-1`}
                    >
                      {tier.title}
                    </h3>

                    {/* Rewards List */}
                    <div className="space-y-2 mt-2">
                      {/* Digital Reward */}
                      <div className="flex items-center gap-2 text-gray-300 text-xs">
                        <Sparkles className="w-3 h-3 text-neon-purple" />
                        <span>{tier.digitalReward}</span>
                      </div>

                      {/* Real Reward */}
                      <div className="flex items-center gap-2 text-white font-bold text-xs bg-white/5 p-2 rounded-lg border border-white/10">
                        {tier.rank === 1 ? (
                          <Coffee className="w-3 h-3 text-yellow-400" />
                        ) : (
                          <Tag className="w-3 h-3 text-blue-400" />
                        )}
                        <span>{tier.realReward}</span>
                      </div>
                    </div>

                    <div className="mt-2 text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                      {tier.note}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Defense Bonus Teaser */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 p-4 rounded-2xl border border-purple-500/30 bg-purple-500/5 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-purple-600/10 blur-xl animate-pulse" />
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-2 text-purple-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">
                  <ShieldCheck className="w-3 h-3" />
                  Defense Protocol Active
                </div>
                <p className="text-gray-300 text-xs">
                  Hold <span className="text-white font-bold">Rank #1</span> for
                  2 weeks to unlock the{" "}
                  <span className="text-purple-400 font-bold">
                    Mythic Purple Aura
                  </span>{" "}
                  & Title.
                </p>
              </div>
            </motion.div>
          </div>

          <div className="p-4 border-t border-white/5 bg-black/40 text-center">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest">
              Resets every Sunday 11:59 PM
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WinnerCircleModal;
