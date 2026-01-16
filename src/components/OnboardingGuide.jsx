import { motion } from "framer-motion";
import { Shield, Star, Crown, Zap, Gift, CheckCircle } from "lucide-react";

const OnboardingGuide = ({ onClose }) => {
  const steps = [
    {
      level: 5,
      label: "Bronze Voyager",
      desc: "Unlock distinctive Bronze frames & neon accents.",
      icon: Shield,
      color: "orange",
    },
    {
      level: 15,
      label: "Silver Guardian",
      desc: "Gain Silver-tier status & holographic ID card effects.",
      icon: Star,
      color: "cyan",
    },
    {
      level: 30,
      label: "Golden Legend",
      desc: "Achieve divine Gold status with particle auras.",
      icon: Crown,
      color: "yellow",
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#0B0C10] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-neon-purple/20 to-blue-500/20 p-6 border-b border-white/5 text-center">
          <h2 className="text-2xl font-['Orbitron'] font-black text-white uppercase italic tracking-tighter mb-2">
            Quest Protocol
          </h2>
          <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
            Ascend from Recruit to Legend
          </p>
        </div>

        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* 1. The Quest Path */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h3 className="text-sm font-black uppercase tracking-widest text-white">
                The Quest Path
              </h3>
            </div>
            <div className="relative border-l-2 border-white/10 ml-2 space-y-6 pl-6 py-2">
              {steps.map((step, idx) => (
                <div key={idx} className="relative group">
                  <div
                    className={`absolute -left-[29px] w-3 h-3 rounded-full bg-${step.color}-500 border-2 border-[#0B0C10] group-hover:scale-150 transition-transform`}
                  />
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className={`text-${step.color}-400 text-xs font-black uppercase tracking-wider`}
                      >
                        Level {step.level}
                      </span>
                      <h4 className="text-white font-bold text-sm">
                        {step.label}
                      </h4>
                      <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                    <step.icon
                      className={`w-5 h-5 text-${step.color}-500 opacity-50`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 italic mt-2 opacity-70 text-center">
              "Every level-up transforms your Identity."
            </p>
          </section>

          {/* 2. Rewards Display */}
          <section className="bg-white/5 rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="w-4 h-4 text-neon-purple" />
              <h3 className="text-sm font-black uppercase tracking-widest text-white">
                Rewards Protocol
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex gap-3 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shadow-[0_0_5px_rgba(74,222,128,0.8)]" />
                <div>
                  <span className="text-green-400 font-bold uppercase block text-[10px] tracking-wider mb-0.5">
                    How to Earn
                  </span>
                  <p className="text-gray-400">
                    Complete quests & earn tags to unlock tiers.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-neon-purple mt-1.5 shadow-[0_0_5px_rgba(168,85,247,0.8)]" />
                <div>
                  <span className="text-neon-purple font-bold uppercase block text-[10px] tracking-wider mb-0.5">
                    Visual Upgrades
                  </span>
                  <p className="text-gray-400">
                    Frame upgrades & Avatar accessories.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shadow-[0_0_5px_rgba(96,165,250,0.8)]" />
                <div>
                  <span className="text-blue-400 font-bold uppercase block text-[10px] tracking-wider mb-0.5">
                    Elite Perks
                  </span>
                  <p className="text-gray-400">
                    Higher Hall of Fame status & Private Squad Hosting.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-[#0B0C10]">
          <button
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-neon-purple to-pink-600 rounded-xl font-black uppercase tracking-widest text-white text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Got it, Let's Spawn!
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingGuide;
