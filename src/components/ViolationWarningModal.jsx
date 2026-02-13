import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, XCircle, Ban } from "lucide-react";

const ViolationWarningModal = ({ violations, onAcknowledge }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  // Violations are already filtered to unacknowledged in App.jsx
  if (!violations || violations.length === 0) return null;

  const currentViolation = violations[currentIndex];
  const strike = currentViolation.strike;

  // Get strike-specific styling and messaging
  const getStrikeConfig = () => {
    if (strike === 1) {
      return {
        icon: ShieldAlert,
        iconColor: "text-yellow-500",
        bgGradient: "from-yellow-500/20 to-orange-500/20",
        borderColor: "border-yellow-500/30",
        title: "⚠️ First Warning",
        message: "You've been reported for gender misrepresentation",
        penalty: "-500 XP Penalty Applied",
        consequence: "Two more strikes will result in a permanent ban.",
        theme: "yellow",
      };
    } else if (strike === 2) {
      return {
        icon: XCircle,
        iconColor: "text-orange-500",
        bgGradient: "from-orange-500/20 to-red-500/20",
        borderColor: "border-orange-500/30",
        title: "🚫 Second Strike",
        message: "Another gender mismatch report has been filed against you",
        penalty: "-500 XP + 7-Day Suspension",
        consequence: "One more strike will result in a PERMANENT BAN.",
        theme: "orange",
      };
    } else {
      return {
        icon: Ban,
        iconColor: "text-red-500",
        bgGradient: "from-red-500/20 to-red-900/20",
        borderColor: "border-red-500/30",
        title: "🔴 PERMANENT BAN",
        message: "Third strike: Your account has been permanently banned",
        penalty: "All access revoked",
        consequence: "You can no longer use Squad Quest.",
        theme: "red",
      };
    }
  };

  const config = getStrikeConfig();
  const Icon = config.icon;

  // Helper to format timestamp (handles Firestore Timestamp and Date objects)
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Unknown date";

    // Firestore Timestamp object (has toDate method)
    if (timestamp?.toDate) {
      return timestamp
        .toDate()
        .toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
    }

    // Firestore Timestamp with seconds property
    if (timestamp?.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
      });
    }

    // Regular Date object or ISO string
    try {
      return new Date(timestamp).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
      });
    } catch (e) {
      return "Unknown date";
    }
  };

  const handleAcknowledge = async () => {
    setIsAcknowledging(true);
    try {
      await onAcknowledge(currentViolation, currentIndex);

      // Move to next violation or close
      if (currentIndex < violations.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    } catch (error) {
      console.error("Failed to acknowledge violation:", error);
    } finally {
      setIsAcknowledging(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`relative w-full max-w-md glassmorphism p-8 rounded-2xl border-2 bg-gradient-to-br ${config.bgGradient} ${config.borderColor}`}
        >
          {/* Pulsing Warning Icon */}
          <motion.div
            className="flex justify-center mb-6"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <div className={`p-4 rounded-full bg-black/40 ${config.iconColor}`}>
              <Icon size={48} className="stroke-[3]" />
            </div>
          </motion.div>

          {/* Title */}
          <h2 className="text-2xl font-black text-center mb-4 uppercase tracking-wider text-white">
            {config.title}
          </h2>

          {/* Message */}
          <p className="text-center text-gray-300 mb-4 text-sm">
            {config.message}
          </p>

          {/* Penalty Box */}
          <div
            className={`bg-black/60 border ${config.borderColor} rounded-xl p-4 mb-4`}
          >
            <p className="text-center font-bold uppercase tracking-wide text-white mb-2">
              Penalty:
            </p>
            <p className={`text-center text-lg font-black ${config.iconColor}`}>
              {config.penalty}
            </p>
          </div>

          {/* Consequence Warning */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-4 mb-6">
            <p className="text-center text-xs text-gray-400 uppercase font-mono">
              {config.consequence}
            </p>
          </div>

          {/* Reported Details */}
          <div className="text-center mb-6 text-xs text-gray-500">
            <p>Reported on: {formatTimestamp(currentViolation.timestamp)}</p>
          </div>

          {/* Acknowledge Button */}
          <button
            onClick={handleAcknowledge}
            disabled={isAcknowledging}
            className={`w-full py-4 px-6 rounded-xl font-black uppercase tracking-wider transition-all ${
              isAcknowledging
                ? "bg-gray-600 cursor-not-allowed"
                : `bg-${config.theme}-600 hover:bg-${config.theme}-700 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]`
            }`}
          >
            {isAcknowledging ? "Processing..." : "I Understand"}
          </button>

          {/* Progress Indicator */}
          {violations.length > 1 && (
            <p className="text-center text-xs text-gray-500 mt-4">
              {currentIndex + 1} of {violations.length} warnings
            </p>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ViolationWarningModal;
