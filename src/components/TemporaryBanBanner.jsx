import { motion } from "framer-motion";
import { Clock, XCircle } from "lucide-react";
import { getBanTimeRemaining } from "../utils/banCheck";

const TemporaryBanBanner = ({ banInfo }) => {
  const timeRemaining = getBanTimeRemaining(banInfo.expiresAt);

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="w-full bg-gradient-to-r from-orange-600/20 via-orange-500/20 to-orange-600/20 border-b-2 border-orange-500/50 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Icon + Message */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <XCircle className="text-orange-400" size={24} />
            </div>
            <div>
              <p className="font-bold text-orange-400 text-lg uppercase tracking-wide">
                Account Temporarily Suspended
              </p>
              <p className="text-sm text-gray-300">{banInfo.reason}</p>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-3 bg-orange-500/10 px-4 py-2 rounded-xl border border-orange-500/30">
            <Clock className="text-orange-400" size={20} />
            <div>
              <p className="text-xs text-gray-400 uppercase">Ban Expires In:</p>
              <p className="font-black text-orange-400 text-lg">
                {timeRemaining}
              </p>
            </div>
          </div>
        </div>

        {/* Restrictions Notice */}
        <div className="mt-3 pt-3 border-t border-orange-500/20">
          <p className="text-center text-sm text-gray-400">
            <span className="text-orange-400 font-semibold">Restricted:</span>{" "}
            You cannot join/create quests, access lobby, claim bounties, or
            participate in challenges
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default TemporaryBanBanner;
