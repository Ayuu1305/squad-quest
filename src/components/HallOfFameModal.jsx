import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Trophy, Crown } from "lucide-react";
import { db } from "../backend/firebaseConfig";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import HeroAvatar from "./HeroAvatar";

const HallOfFameModal = ({ onClose }) => {
  const [weeklyWinners, setWeeklyWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHallOfFame = async () => {
      try {
        const hofRef = collection(db, "hall_of_fame");
        const q = query(hofRef, orderBy("processedAt", "desc"), limit(5));
        const snapshot = await getDocs(q);

        const history = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setWeeklyWinners(history);
      } catch (err) {
        console.error("Failed to fetch Hall of Fame:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHallOfFame();
  }, []);

  const formatWeekDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-dark-bg border-2 border-neon-purple/50 rounded-3xl w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.2)] flex flex-col"
      >
        {/* Header */}
        <div className="bg-dark-bg/95 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neon-purple/20 rounded-full flex items-center justify-center border border-neon-purple/50">
              <Trophy className="w-5 h-5 text-neon-purple" />
            </div>
            <div>
              <h2 className="text-xl font-['Orbitron'] font-black text-white italic tracking-wider">
                HALL OF FAME
              </h2>
              <p className="text-gray-400 text-[10px] font-mono uppercase tracking-widest">
                Recent Champions
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white/5 rounded-xl p-3 animate-pulse"
                >
                  <div className="h-4 w-24 bg-white/10 rounded mb-2" />
                  <div className="h-16 bg-white/10 rounded" />
                </div>
              ))}
            </div>
          ) : weeklyWinners.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
              <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-black uppercase text-sm">
                No History Yet
              </p>
            </div>
          ) : (
            weeklyWinners.map((week) => (
              <motion.div
                key={week.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:border-neon-purple/30 transition-all"
              >
                {/* Week header */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-purple" />
                  <span className="font-['Orbitron'] font-black text-white uppercase text-xs tracking-wide">
                    {formatWeekDate(week.processedAt)}
                  </span>
                </div>

                {/* Winners - RESPONSIVE: vertical on mobile, horizontal on small+ screens */}
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  {week.winners &&
                    week.winners.slice(0, 3).map((winner, index) => {
                      const rank = index + 1;
                      const borderColor =
                        rank === 1
                          ? "border-yellow-500/50"
                          : rank === 2
                            ? "border-blue-400/50"
                            : "border-gray-400/50";

                      return (
                        <div
                          key={winner.uid || index}
                          className={`flex items-center gap-2 flex-1 bg-white/5 rounded-lg p-2 border ${borderColor} relative`}
                        >
                          {/* Rank badge */}
                          <div
                            className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border-2 ${
                              rank === 1
                                ? "bg-yellow-500 text-black border-yellow-400"
                                : rank === 2
                                  ? "bg-blue-500 text-white border-blue-400"
                                  : "bg-gray-500 text-white border-gray-400"
                            }`}
                          >
                            #{rank}
                          </div>

                          {/* Crown for #1 */}
                          {rank === 1 && (
                            <Crown className="absolute -top-2 -left-2 w-4 h-4 text-yellow-400" />
                          )}

                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            <HeroAvatar
                              seed={winner.avatar || winner.avatarSeed}
                              tierName={
                                rank === 1
                                  ? "Legendary"
                                  : rank === 2
                                    ? "Gold"
                                    : "Silver"
                              }
                              size={36}
                              aura={
                                rank === 1
                                  ? "mythic"
                                  : rank === 2
                                    ? "gold"
                                    : "silver"
                              }
                            />
                          </div>

                          {/* Name + XP */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-black uppercase truncate text-[10px] ${
                                rank === 1 ? "text-yellow-400" : "text-white"
                              }`}
                            >
                              {winner.name || "Unknown"}
                            </p>
                            <p className="text-gray-400 font-mono text-[9px] truncate">
                              {(
                                winner.xp ||
                                winner.thisWeekXP ||
                                0
                              ).toLocaleString("en-IN")}{" "}
                              XP
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default HallOfFameModal;
