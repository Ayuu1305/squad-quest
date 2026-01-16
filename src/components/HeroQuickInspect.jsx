import { motion } from "framer-motion";
import { X, Award, Zap, Star } from "lucide-react";
import HeroCardGenerator from "./HeroCardGenerator";

const HeroQuickInspect = ({ hero, onClose }) => {
  if (!hero) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
      onClick={onClose} // ADDED: Close on backdrop click
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative w-fit max-w-[340px]" // Changed to fit card width
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-4 z-50 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white/80 hover:text-white transition-all border border-white/10 group active:scale-95 backdrop-blur-md"
        >
          <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
        </button>

        {/* Hero Card Container */}
        <div className="flex flex-col items-center">
          <HeroCardGenerator user={hero} showActions={false} />
        </div>

        {/* Top Commendations */}
        <div className="mt-6 flex justify-center gap-2">
          {["Funny", "Great Storyteller", "Leader"].map((badge) => (
            <div
              key={badge}
              className="px-3 py-1 bg-neon-purple/20 border border-neon-purple/30 rounded-lg flex items-center gap-1.5"
            >
              <Award className="w-3 h-3 text-neon-purple" />
              <span className="text-[10px] font-black text-white uppercase tracking-tighter">
                {badge}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HeroQuickInspect;
