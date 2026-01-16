import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

const TacticalErrorModal = ({
  isOpen,
  onClose,
  message,
  title = "Tactical Error",
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-sm glassmorphism-dark border border-red-500/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.2)]"
          >
            {/* Header */}
            <div className="bg-red-500/10 px-6 py-4 flex items-center gap-3 border-b border-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
              <h2 className="text-sm font-['Orbitron'] font-black text-red-500 uppercase italic tracking-widest">
                {title}
              </h2>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-sm text-gray-300 font-medium leading-relaxed">
                {message || "Access Denied. Integrity Protocol Mismatch."}
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <button
                onClick={onClose}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 text-xs"
              >
                Acknowledge
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TacticalErrorModal;
