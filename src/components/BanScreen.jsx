import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Ban, XCircle, Clock, LogOut } from "lucide-react";
import { getBanTimeRemaining } from "../utils/banCheck";

const BanScreen = ({ banInfo, onLogout }) => {
  const [timeRemaining, setTimeRemaining] = useState("");

  // Update countdown every minute for temporary bans
  useEffect(() => {
    if (banInfo.type === "temporary" && banInfo.expiresAt) {
      const updateTimer = () => {
        setTimeRemaining(getBanTimeRemaining(banInfo.expiresAt));
      };

      updateTimer(); // Initial update
      const interval = setInterval(updateTimer, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [banInfo]);

  const isPermanent = banInfo.type === "permanent";

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 p-3 sm:p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-md p-4 sm:p-6 glassmorphism rounded-2xl border-2 border-red-500/30 bg-gradient-to-br from-red-900/20 to-gray-900/40"
      >
        {/* Icon */}
        <motion.div
          className="flex justify-center mb-3 sm:mb-4"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          <div
            className={`p-3 sm:p-4 rounded-full ${
              isPermanent ? "bg-red-500/20" : "bg-orange-500/20"
            }`}
          >
            {isPermanent ? (
              <Ban size={40} className="text-red-500 stroke-[3]" />
            ) : (
              <XCircle size={40} className="text-orange-500 stroke-[3]" />
            )}
          </div>
        </motion.div>

        {/* Title */}
        <h1
          className={`text-xl sm:text-2xl font-black text-center mb-3 sm:mb-4 uppercase tracking-wider ${
            isPermanent ? "text-red-500" : "text-orange-500"
          }`}
        >
          {isPermanent ? "🔴 ACCOUNT BANNED" : "🚫 ACCOUNT SUSPENDED"}
        </h1>

        {/* Ban Reason */}
        <div className="bg-black/60 border border-white/10 rounded-xl p-3 sm:p-4 mb-3">
          <p className="text-center text-sm sm:text-base text-white font-semibold mb-1">
            Reason:
          </p>
          <p className="text-center text-gray-300 text-xs sm:text-sm">
            {banInfo.reason}
          </p>
        </div>

        {/* Temporary Ban: Show Countdown */}
        {!isPermanent && banInfo.expiresAt && (
          <motion.div
            className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 sm:p-4 mb-3"
            animate={{
              borderColor: [
                "rgba(249,115,22,0.3)",
                "rgba(249,115,22,0.6)",
                "rgba(249,115,22,0.3)",
              ],
            }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="text-orange-400" size={18} />
              <p className="text-center font-bold uppercase tracking-wide text-white text-xs sm:text-sm">
                Ban Expires In:
              </p>
            </div>
            <p className="text-center text-xl sm:text-2xl font-black text-orange-400">
              {timeRemaining}
            </p>
            <p className="text-center text-[10px] sm:text-xs text-gray-400 mt-1">
              {banInfo.expiresAt.toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              })}
            </p>
          </motion.div>
        )}

        {/* Permanent Ban: No countdown, just message */}
        {isPermanent && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 sm:p-4 mb-3">
            <p className="text-center text-gray-300 text-xs sm:text-sm">
              Your account has been{" "}
              <span className="font-black text-red-500">
                permanently banned
              </span>
              .
              <br />
              You can no longer access Squad Quest.
            </p>
          </div>
        )}

        {/* What User Can't Do - Simplified */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-3 sm:p-4 mb-4">
          <p className="text-center font-bold uppercase tracking-wide text-white mb-2 text-xs sm:text-sm">
            Restricted Actions:
          </p>
          <ul className="text-gray-400 text-[10px] sm:text-xs space-y-1">
            <li className="flex items-center gap-2">
              <span className="text-red-500">✖</span> Join or create quests
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-500">✖</span> Access quest lobby
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-500">✖</span> Submit vibe checks
            </li>
          </ul>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <LogOut size={18} />
          Logout
        </button>

        {/* Appeal Info (if permanent) */}
        {isPermanent && (
          <p className="text-center text-[10px] sm:text-xs text-gray-500 mt-3">
            If you believe this ban was issued in error, contact support.
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default BanScreen;
