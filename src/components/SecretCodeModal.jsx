import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X, Lock } from "lucide-react";

const SecretCodeModal = ({
  isOpen,
  onClose,
  onSubmit,
  questTitle,
  isJoining,
}) => {
  const [code, setCode] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.trim()) {
      onSubmit(code.trim());
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative max-w-md w-full glassmorphism-dark rounded-3xl p-8 border-2 border-purple-500/50"
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-purple-500/20 border-2 border-purple-500/50">
                <Lock className="w-12 h-12 text-purple-500" />
              </div>
            </div>

            <h2 className="text-2xl font-['Orbitron'] font-black text-white text-center mb-4 uppercase tracking-tight">
              Private Quest
            </h2>

            <p className="text-gray-300 text-center mb-2">
              Enter secret code to join:
            </p>
            <p className="text-purple-400 font-bold text-center mb-6 px-4 truncate">
              "{questTitle}"
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-purple-300 mb-2 uppercase tracking-wider text-center">
                  🔐 Secret Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="X7K92M"
                  maxLength={6}
                  required
                  autoFocus
                  className="w-full px-4 py-4 bg-purple-500/20 border-2 border-purple-500 rounded-xl text-white font-black text-2xl text-center uppercase tracking-[0.3em] focus:outline-none focus:border-purple-400"
                />
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Ask the host for the code
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isJoining}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isJoining || !code.trim()}
                  className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isJoining ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Join Quest
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SecretCodeModal;
