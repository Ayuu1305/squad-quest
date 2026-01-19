import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { X, Award } from "lucide-react";
import HeroCardGenerator from "./HeroCardGenerator";

const HeroQuickInspect = ({ hero, onClose }) => {
  if (!hero) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative w-full max-w-[420px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white/80 hover:text-white transition-all border border-white/10 group active:scale-95 backdrop-blur-md"
        >
          <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
        </button>

        {/* Hero Card Container */}
        <div className="flex flex-col items-center">
          <HeroCardGenerator user={hero} showActions={false} />
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
};

export default HeroQuickInspect;
