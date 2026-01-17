import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2 } from "lucide-react";

const DeleteQuestModal = ({
  isOpen,
  onClose,
  onConfirm,
  questTitle,
  isDeleting,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative max-w-md w-full glassmorphism-dark rounded-3xl p-8 border-2 border-red-500/50"
          >
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-red-500/20 border-2 border-red-500/50">
                <AlertTriangle className="w-12 h-12 text-red-500" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-['Orbitron'] font-black text-white text-center mb-4 uppercase tracking-tight">
              Delete Quest?
            </h2>

            {/* Message */}
            <p className="text-gray-300 text-center mb-2">
              You are about to permanently delete:
            </p>
            <p className="text-neon-purple font-bold text-center mb-6 px-4 truncate">
              "{questTitle}"
            </p>

            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <p className="text-xs text-red-400 text-center font-mono">
                ⚠️ This will remove:
                <br />
                • All members
                <br />
                • All chat messages
                <br />
                • All verifications
                <br />
                <strong>THIS CANNOT BE UNDONE</strong>
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeleteQuestModal;
