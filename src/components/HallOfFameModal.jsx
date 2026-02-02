import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Crown, Medal } from "lucide-react";
import { db } from "../backend/firebaseConfig";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import HeroAvatar from "./HeroAvatar";

const HallOfFameModal = ({ onClose }) => {
  const [weeklyWinners, setWeeklyWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHallOfFame = async () => {
      try {
        setLoading(true);
        setError(null);

        const hofRef = collection(db, "hall_of_fame");
        const q = query(hofRef, orderBy("processedAt", "desc"), limit(10));
        const snapshot = await getDocs(q);

        const history = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setWeeklyWinners(history);
      } catch (err) {
        console.error("Failed to fetch Hall of Fame:", err);
        setError("Failed to load history");
      } finally {
        setLoading(false);
      }
    };

    fetchHallOfFame();
  }, []);

  const formatWeekDate = (timestamp) => {
    if (!timestamp) return "Unknown Week";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRankBorderColor = (rank) => {
    switch (rank) {
      case 1:
        return "border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)]";
      case 2:
        return "border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.3)]";
      case 3:
        return "border-gray-400 shadow-[0_0_15px_rgba(156,163,175,0.3)]";
      default:
        return "border-white/10";
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-blue-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-dark-bg border-2 border-neon-purple/50 rounded-3xl w-full max-w-3xl max-h-[85vh] relative overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.2)]"
      >
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-neon-purple to-transparent" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-neon-purple blur-[80px] opacity-20" />

        {/* Header */}
        <div className="sticky top-0 bg-dark-bg/95 backdrop-blur-xl border-b border-white/10 p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-neon-purple/20 rounded-full flex items-center justify-center border border-neon-purple/50">
                <Trophy className="w-6 h-6 text-neon-purple" />
              </div>
              <div>
                <h2 className="text-2xl font-['Orbitron'] font-black text-white italic tracking-wider uppercase">
                  Hall of Fame
                </h2>
                <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">
                  Past Weekly Champions
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center justify-center group"
            >
              <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-120px)] p-6 space-y-6">
          {loading ? (
            // Loading Skeletons
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white/5 rounded-2xl p-6 border border-white/5 animate-pulse"
                >
                  <div className="h-6 w-32 bg-white/10 rounded mb-4" />
                  <div className="flex gap-4">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="flex-1">
                        <div className="w-20 h-20 bg-white/10 rounded-full mx-auto mb-2" />
                        <div className="h-4 w-16 bg-white/10 rounded mx-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            // Error State
            <div className="text-center py-12 px-6 bg-red-500/10 rounded-3xl border border-red-500/20">
              <Trophy className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-red-500 font-black uppercase tracking-widest text-sm mb-2">
                Error Loading History
              </h3>
              <p className="text-white/70 text-xs uppercase">{error}</p>
            </div>
          ) : weeklyWinners.length === 0 ? (
            // Empty State
            <div className="text-center py-12 px-6 bg-white/5 rounded-3xl border border-white/10">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-gray-400 font-black uppercase tracking-widest text-sm mb-2">
                No History Yet
              </h3>
              <p className="text-gray-500 text-xs uppercase">
                Weekly winners will appear here
              </p>
            </div>
          ) : (
            // Winners List
            <AnimatePresence mode="popLayout">
              {weeklyWinners.map((week, weekIndex) => (
                <motion.div
                  key={week.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: weekIndex * 0.1 }}
                  className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-neon-purple/30 transition-all"
                >
                  {/* Week Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-neon-purple" />
                      <h3 className="font-['Orbitron'] font-black text-white uppercase tracking-wide text-sm">
                        Week of {formatWeekDate(week.processedAt)}
                      </h3>
                    </div>
                    <span className="text-gray-500 text-xs font-mono">
                      #{weeklyWinners.length - weekIndex}
                    </span>
                  </div>

                  {/* Top 3 Winners */}
                  {week.winners && week.winners.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {week.winners.slice(0, 3).map((winner, index) => {
                        const rank = index + 1;
                        return (
                          <motion.div
                            key={winner.uid || index}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                              delay: weekIndex * 0.1 + index * 0.1,
                            }}
                            className={`relative bg-white/5 rounded-xl p-4 border-2 ${getRankBorderColor(rank)} ${
                              rank === 1 ? "sm:col-span-3 sm:p-6" : ""
                            }`}
                          >
                            {/* Rank Badge */}
                            <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-dark-bg border-2 border-inherit flex items-center justify-center">
                              <span
                                className={`text-xs font-black ${
                                  rank === 1
                                    ? "text-yellow-500"
                                    : rank === 2
                                      ? "text-blue-400"
                                      : "text-gray-400"
                                }`}
                              >
                                #{rank}
                              </span>
                            </div>

                            <div
                              className={`flex ${
                                rank === 1
                                  ? "sm:flex-row items-center gap-6"
                                  : "flex-col items-center"
                              }`}
                            >
                              {/* Avatar */}
                              <div className="relative">
                                <HeroAvatar
                                  seed={winner.avatar || winner.avatarSeed}
                                  tierName={
                                    rank === 1
                                      ? "Legendary"
                                      : rank === 2
                                        ? "Gold"
                                        : "Silver"
                                  }
                                  size={rank === 1 ? 120 : 80}
                                  aura={
                                    rank === 1
                                      ? "mythic"
                                      : rank === 2
                                        ? "gold"
                                        : "silver"
                                  }
                                />
                                {rank === 1 && (
                                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <Crown className="w-8 h-8 text-yellow-500 animate-bounce" />
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div
                                className={`text-center ${
                                  rank === 1 ? "sm:text-left sm:flex-1" : "mt-3"
                                }`}
                              >
                                <h4
                                  className={`font-black uppercase tracking-wider ${
                                    rank === 1
                                      ? "text-xl text-yellow-400 font-['Orbitron'] italic"
                                      : "text-sm text-white"
                                  }`}
                                >
                                  {winner.name || "Unknown Hero"}
                                </h4>
                                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                                  <span
                                    className={`font-mono font-black ${
                                      rank === 1
                                        ? "text-yellow-500 text-lg"
                                        : "text-gray-400 text-xs"
                                    }`}
                                  >
                                    {winner.xp || winner.thisWeekXP || 0} XP
                                  </span>
                                </div>
                                {rank === 1 && (
                                  <div className="mt-2 inline-block px-3 py-1 bg-yellow-500/20 rounded-full border border-yellow-500/30">
                                    <span className="text-yellow-500 text-[10px] font-black uppercase tracking-widest">
                                      Champion
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 text-sm">
                      No winners recorded
                    </p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default HallOfFameModal;
