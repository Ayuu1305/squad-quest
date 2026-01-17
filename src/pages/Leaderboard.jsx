import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Zap, Shield, Star, Gift } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useGame } from "../context/GameContext";
import { getTopHeroes, getUserRank } from "../backend/leaderboardService";
import { db } from "../backend/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import useShowdown from "../hooks/useShowdown";
import LeaderboardPodium from "../components/LeaderboardPodium";
import LeaderboardItem from "../components/LeaderboardItem";
import WinnerCircleModal from "../components/WinnerCircleModal";
import HeroQuickInspect from "../components/HeroQuickInspect";
import { Clock } from "lucide-react";

const Leaderboard = () => {
  const { user } = useAuth(); // Firebase Auth user
  const { city: currentCity } = useGame();
  const { isActive: activeShowdown, timeLeft, nextReset } = useShowdown();

  const [heroes, setHeroes] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [nextRankHero, setNextRankHero] = useState(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState(currentCity || "Ahmedabad");
  const [category, setCategory] = useState("weekly");
  const [selectedHero, setSelectedHero] = useState(null);
  const [showWinnerCircle, setShowWinnerCircle] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const [myStats, setMyStats] = useState(null);

  // ✅ Auto-refresh every 60s during showdown
  useEffect(() => {
    if (!activeShowdown) return;
    const interval = setInterval(() => setRefreshTick((p) => p + 1), 60000);
    return () => clearInterval(interval);
  }, [activeShowdown]);

  const categories = [
    { id: "weekly", label: "Weekly", icon: Star },
    { id: "xp", label: "All-Time", icon: Zap },
    { id: "reliability", label: "Reliability", icon: Shield },
  ];

  // ✅ Fetch Firestore Stats for current user
  useEffect(() => {
    const fetchMyStats = async () => {
      if (!user?.uid) return;

      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          setMyStats({ id: snap.id, ...snap.data() });
        } else {
          setMyStats(null);
        }
      } catch (err) {
        console.error("Failed to fetch myStats:", err);
        setMyStats(null);
      }
    };

    fetchMyStats();
  }, [user?.uid, refreshTick]);

  // ✅ Fetch leaderboard correctly using Firestore stats
  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!user?.uid) return;

      if (refreshTick === 0) setLoading(true);
      setError(null);

      try {
        const topHeroes = await getTopHeroes(city, category);
        setHeroes(topHeroes);

        // ✅ Field mapping (must match your DB schema)
        const fieldMap = {
          weekly: "thisWeekXP",
          xp: "xp",
          reliability: "reliabilityScore",
        };

        const field = fieldMap[category] || "xp";

        // ✅ get user value from Firestore stats NOT auth user
        const myValue = myStats?.[field] ?? 0;

        const rank = await getUserRank(user.uid, city, category, myValue);
        setUserRank(rank);

        if (rank > 1) {
          const aboveHero = topHeroes.find((h) => h.id !== user.uid);
          setNextRankHero(aboveHero || null);
        } else {
          setNextRankHero(null);
        }
      } catch (err) {
        console.error("Leaderboard component error:", err);
        setError(
          err.message?.includes("index") ? "INDEX_REQUIRED" : "FETCH_ERROR",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [city, category, user?.uid, refreshTick, myStats]);

  const handleReorder = (newOrder) => setHeroes(newOrder);

  // Animations
  const listContainerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="app-container min-h-screen bg-dark-bg pb-48 relative overflow-x-hidden">
      {/* Header */}
      <div className="relative pt-12 pb-8 px-6 text-center">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="inline-block px-4 py-1 bg-neon-purple/20 rounded-full border border-neon-purple/40 mb-4"
        >
          <span className="text-[10px] font-black text-neon-purple uppercase tracking-[0.3em]">
            Ahmedabad Legends
          </span>
        </motion.div>

        <h1 className="text-5xl font-['Orbitron'] font-black text-white italic tracking-tighter uppercase mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
          LEADERBOARD
        </h1>

        <div className="flex items-center justify-center gap-2 text-gray-500 font-mono text-[10px] uppercase tracking-widest font-black">
          <MapPin className="w-3 h-3 text-neon-purple" />
          {city} Sector
        </div>

        {/* Winner’s Circle */}
        <motion.button
          onClick={() => setShowWinnerCircle(true)}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.4)] flex items-center gap-2 mx-auto group"
        >
          <Gift className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
          <span className="text-white font-black uppercase text-[10px] tracking-widest">
            Weekly Prize Pool
          </span>
        </motion.button>

        {/* Countdown */}
        {activeShowdown ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-8 relative inline-block group"
          >
            <div className="absolute inset-0 bg-red-600 blur-2xl opacity-20 animate-pulse" />
            <div className="relative bg-black/60 backdrop-blur-xl border-2 border-red-500/50 rounded-2xl p-6 shadow-[0_0_30px_rgba(255,0,0,0.2)]">
              <div className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] mb-3 flex items-center justify-center gap-2">
                <Clock className="w-3 h-3 animate-spin-slow" />
                Showdown Ends In
              </div>

              <div className="flex items-center justify-center gap-4 font-['Orbitron'] text-4xl font-black text-white italic tracking-tighter">
                <div className="flex flex-col items-center">
                  <span>{String(timeLeft.h).padStart(2, "0")}</span>
                  <span className="text-[8px] tracking-widest text-gray-600 uppercase not-italic">
                    HRS
                  </span>
                </div>
                <span className="text-red-500 animate-pulse">:</span>
                <div className="flex flex-col items-center">
                  <span>{String(timeLeft.m).padStart(2, "0")}</span>
                  <span className="text-[8px] tracking-widest text-gray-600 uppercase not-italic">
                    MIN
                  </span>
                </div>
                <span className="text-red-500 animate-pulse">:</span>
                <div className="flex flex-col items-center">
                  <motion.span
                    key={timeLeft.s}
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={timeLeft.total < 300000 ? "text-red-500" : ""}
                  >
                    {String(timeLeft.s).padStart(2, "0")}
                  </motion.span>
                  <span className="text-[8px] tracking-widest text-gray-600 uppercase not-italic">
                    SEC
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-8 relative inline-block group"
          >
            <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 px-8">
              <div className="text-[9px] font-black text-neon-purple uppercase tracking-[0.3em] mb-1">
                Weekly Reset In
              </div>
              <div className="font-['Orbitron'] text-2xl font-black text-white italic tracking-wider">
                <span className="text-gray-300">
                  {nextReset || "Calculating..."}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Category Toggle */}
      <div
        className={`flex bg-white/5 backdrop-blur-md rounded-2xl mx-6 p-1 mb-8 border border-white/5 sticky z-40 top-4 ${
          activeShowdown ? "border-red-500/30" : ""
        }`}
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 ${
              category === cat.id
                ? "bg-neon-purple text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-white/20"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <cat.icon
              className={`w-4 h-4 ${category === cat.id ? "text-white" : ""}`}
            />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      {/* Podium */}
      <LeaderboardPodium
        topThree={heroes.slice(0, 3)}
        currentUserId={user?.uid}
        category={category}
        loading={loading}
        isShowdown={activeShowdown}
        onUserClick={setSelectedHero}
      />

      {/* Ranked List */}
      <div className="px-6 mb-20">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-20 w-full bg-white/5 animate-pulse rounded-2xl border border-white/5"
              />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 px-6 bg-red-500/10 rounded-3xl border border-red-500/20">
            <Zap className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-red-500 font-black uppercase tracking-widest text-sm mb-2">
              Sync Error
            </h3>
            <p className="text-white/70 text-[10px] uppercase">
              Failed to fetch hero rankings.
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-6 md:px-8 z-10 relative">
            <div className="bg-dark-bg/50 backdrop-blur-md rounded-3xl border border-white/5 p-2 shadow-2xl space-y-3">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-20"
                  >
                    <div className="w-12 h-12 border-4 border-neon-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
                      Syncing Global Database...
                    </p>
                  </motion.div>
                ) : (
                  heroes
                    .slice(3)
                    .map((hero, index) => (
                      <LeaderboardItem
                        key={hero.id}
                        hero={hero}
                        rank={index + 4}
                        isCurrentUser={hero.id === user?.uid}
                        category={category}
                        onClick={() => setSelectedHero(hero)}
                      />
                    ))
                )}
              </AnimatePresence>
            </div>

            {/* ✅ Pinned "Your Position" */}
            {myStats && !heroes.some((h) => h.id === user?.uid) && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mt-12 p-1 rounded-[2.5rem] bg-gradient-to-r from-neon-purple/20 via-neon-purple/5 to-transparent border border-neon-purple/30 backdrop-blur-xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
                <div className="px-6 pt-4 pb-1 text-[10px] font-black text-neon-purple uppercase tracking-[0.3em] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-purple animate-ping" />
                  Your Current Standing
                </div>
                <LeaderboardItem
                  hero={myStats}
                  rank={userRank || "??"}
                  isCurrentUser={true}
                  onClick={setSelectedHero}
                  category={category}
                />
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Hero Inspect */}
      <AnimatePresence>
        {selectedHero && (
          <HeroQuickInspect
            hero={selectedHero}
            onClose={() => setSelectedHero(null)}
          />
        )}
      </AnimatePresence>

      <WinnerCircleModal
        isOpen={showWinnerCircle}
        onClose={() => setShowWinnerCircle(false)}
      />
    </div>
  );
};

export default Leaderboard;
