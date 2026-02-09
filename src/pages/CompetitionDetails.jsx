import { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // Don't forget this!
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti"; // Install this: npm install react-confetti
import {
  Trophy,
  Crown,
  Medal,
  ChevronDown,
  ChevronUp,
  Users,
  Zap,
  Star,
  Award,
  Shield,
  Swords,
  Clock,
} from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../backend/firebaseConfig";
import HeroAvatar from "../components/HeroAvatar";
import { getTier } from "../utils/xp";

const CompetitionDetails = () => {
  const { id } = useParams(); // Get ID from URL
  const [competitionData, setCompetitionData] = useState(null);
  const [collegeScores, setCollegeScores] = useState([]);
  const [expandedCollege, setExpandedCollege] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topHeroes, setTopHeroes] = useState({});
  const [topMVPs, setTopMVPs] = useState([]);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [isEnded, setIsEnded] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Update window size for confetti
  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchCompetitionData();
  }, [id]); // Re-fetch if ID changes

  useEffect(() => {
    if (!competitionData?.endDate) return;

    const timer = setInterval(() => {
      const now = new Date();
      const end = competitionData.endDate.toDate();
      const diff = end - now;

      if (diff <= 0) {
        setIsEnded(true);
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        clearInterval(timer);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ d: days, h: hours, m: minutes, s: seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [competitionData]);

const fetchCompetitionData = async () => {
    try {
      const competitionDoc = await getDoc(doc(db, "competitions", id));

      if (competitionDoc.exists()) {
        const data = competitionDoc.data();
        setCompetitionData(data);

        // 🛑 NEW LOGIC: Check if we should show Frozen Data or Live Data
        if (data.status === "ended" && data.finalStandings) {
            // 🧊 CASE 1: WAR IS OVER (Use Saved Snapshot)
            // We do NOT call fetchCollegeScores() here. We use the saved array.
            console.log("Loading Archived Season Data...");
            
            setIsEnded(true);
            setCollegeScores(data.finalStandings);

            // Populate the Podium with the saved Top Heroes from the winner
            if (data.finalStandings.length > 0 && data.finalStandings[0].topHeroes) {
                setTopMVPs(data.finalStandings[0].topHeroes);
            }
            
            setLoading(false); // Stop loading immediately
            
        } else {
            // 🔥 CASE 2: WAR IS LIVE (Calculate Fresh Scores)
            // We calculate scores from scratch using the Users collection
            console.log("Calculating Live War Data...");
            
            fetchCollegeScores(data.colleges); // This function handles setLoading(false) internally
            
            // Visual check: Has the time run out?
            if (data.endDate.toDate() < new Date()) {
                setIsEnded(true);
            }
        }

      } else {
        console.error("Competition not found");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching competition:", error);
      setLoading(false);
    }
  };

  const fetchCollegeScores = async (colleges) => {
    setLoading(true);

    try {
      const scores = await Promise.all(
        colleges.map(async (college) => {
          const q = query(
            collection(db, "users"),
            where("college", "==", college),
          );

          const snapshot = await getDocs(q);
          
          // ONLY Count thisWeekXP
          const totalXP = snapshot.docs.reduce(
            (sum, doc) => sum + (doc.data().thisWeekXP || 0),
            0,
          );

          return {
            college,
            totalXP,
            studentCount: snapshot.size,
            rawDocs: snapshot.docs,
          };
        }),
      );

      scores.sort((a, b) => b.totalXP - a.totalXP);
      setCollegeScores(scores);

      if (scores.length > 0) {
        const winningCollege = scores[0].college;
        fetchTopMVPs(winningCollege);
      }
    } catch (error) {
      console.error("Failed to fetch college scores:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopMVPs = async (college) => {
    try {
      const q = query(collection(db, "users"), where("college", "==", college));

      const snapshot = await getDocs(q);
      const users = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort(
          (a, b) => (b.thisWeekXP || 0) - (a.thisWeekXP || 0),
        )
        .slice(0, 3);

      setTopMVPs(users);
    } catch (error) {
      console.error("Failed to fetch top MVPs:", error);
    }
  };

  const fetchTopHeroes = async (college) => {
    if (topHeroes[college]) return;

    try {
      const q = query(collection(db, "users"), where("college", "==", college));

      const snapshot = await getDocs(q);
      const users = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort(
          (a, b) => (b.thisWeekXP || 0) - (a.thisWeekXP || 0),
        )
        .slice(0, 10);

      setTopHeroes((prev) => ({
        ...prev,
        [college]: users,
      }));
    } catch (error) {
      console.error("Failed to fetch top heroes:", error);
    }
  };

  const handleToggleExpand = (college) => {
    if (expandedCollege === college) {
      setExpandedCollege(null);
    } else {
      setExpandedCollege(college);
      fetchTopHeroes(college);
    }
  };

  const getRankColor = (index) => {
    if (index === 0) return "text-yellow-500";
    if (index === 1) return "text-gray-400";
    if (index === 2) return "text-orange-500";
    return "text-slate-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-32 pt-safe-top overflow-hidden">
      {/* 🎉 CONFETTI (Only if Ended) */}
      {isEnded && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} />}

      {/* 🟢 Live Indicator Header */}
      <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isEnded ? (
              <>
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </div>
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                  Live Battle
                </span>
              </>
            ) : (
              <div className="flex items-center gap-2 px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <Trophy className="w-3 h-3 text-yellow-500" />
                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">
                  Final Results
                </span>
              </div>
            )}
          </div>

          {/* Countdown Timer */}
          {!isEnded && competitionData?.endDate && (
            <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1">
              <Clock className="w-3 h-3 text-red-500" />
              <span className="text-[10px] font-mono font-black text-red-500">
                {timeLeft.d}d : {String(timeLeft.h).padStart(2, "0")}h :{" "}
                {String(timeLeft.m).padStart(2, "0")}m
              </span>
            </div>
          )}
        </div>
        <h1 className="mt-1 text-lg font-black text-white uppercase italic tracking-wider font-['Orbitron']">
          {competitionData?.title || "Loading..."}
        </h1>
      </div>

      {/* 🏆 The MVP Stage (Winning College) */}
      {!loading && topMVPs.length > 0 && collegeScores.length > 0 && (
        <div className="relative mt-4 mb-6 mx-2 p-4 bg-gradient-to-b from-yellow-900/10 to-transparent rounded-3xl border border-yellow-500/10 overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-yellow-500/20 blur-[60px]" />

          <div className="relative z-10 text-center mb-6">
            <div className="inline-flex items-center gap-1.5 mb-1">
              <Crown className="w-3 h-3 text-yellow-500" />
              <span className="text-xs font-bold text-yellow-500 uppercase tracking-wide">
                {isEnded ? "👑 OFFICIAL CHAMPIONS" : "Current Leaders"}
              </span>
            </div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              {collegeScores[0].college}
            </h2>
          </div>

          {/* The Podium */}
          <div className="flex items-end justify-center gap-2 mb-2">
            {/* 2nd Place (Left) */}
            {topMVPs[1] && (
              <div className="flex flex-col items-center -mr-2 z-0 scale-90 opacity-80">
                <HeroAvatar
                  seed={topMVPs[1].avatarSeed}
                  tierName={getTier(topMVPs[1].level).name}
                  size={48}
                />
                <div className="mt-2 text-center">
                  <div className="text-[10px] font-bold text-gray-300 w-16 truncate">
                    {topMVPs[1].name}
                  </div>
                  <div className="h-16 w-16 bg-gradient-to-b from-gray-700/50 to-transparent rounded-t-lg border-t border-gray-600 mt-1 flex justify-center pt-1">
                    <span className="text-[10px] font-mono text-gray-400 font-bold">
                      2
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place (Center) */}
            {topMVPs[0] && (
              <div className="flex flex-col items-center z-10 -mb-1">
                <div className="relative">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                    <Crown className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] animate-bounce" />
                  </div>
                  <HeroAvatar
                    seed={topMVPs[0].avatarSeed}
                    tierName={getTier(topMVPs[0].level).name}
                    size={64}
                    className="ring-2 ring-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                  />
                </div>
                <div className="mt-2 text-center w-full">
                  <div className="text-xs font-black text-yellow-400 w-20 truncate mx-auto">
                    {topMVPs[0].name}
                  </div>
                  <div className="text-[9px] font-mono text-yellow-500/70 mb-1">
                    {(topMVPs[0].thisWeekXP || 0).toLocaleString()} XP
                  </div>
                  <div className="h-20 w-24 bg-gradient-to-b from-yellow-500/20 to-transparent rounded-t-xl border-t border-yellow-500 backdrop-blur-sm flex justify-center pt-2 shadow-[0_-5px_20px_rgba(234,179,8,0.1)]">
                    <span className="text-lg font-black text-yellow-500">
                      1
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place (Right) */}
            {topMVPs[2] && (
              <div className="flex flex-col items-center -ml-2 z-0 scale-90 opacity-80">
                <HeroAvatar
                  seed={topMVPs[2].avatarSeed}
                  tierName={getTier(topMVPs[2].level).name}
                  size={48}
                />
                <div className="mt-2 text-center">
                  <div className="text-[10px] font-bold text-orange-300 w-16 truncate">
                    {topMVPs[2].name}
                  </div>
                  <div className="h-12 w-16 bg-gradient-to-b from-orange-900/50 to-transparent rounded-t-lg border-t border-orange-800 mt-1 flex justify-center pt-1">
                    <span className="text-[10px] font-mono text-orange-500 font-bold">
                      3
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📊 High-Density Leaderboard List */}
      <div className="px-3 space-y-2">
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 pl-2">
          {isEnded ? "Final Standings" : "College Standings"}
        </h3>

        {collegeScores.map((college, index) => {
          const isExpanded = expandedCollege === college.college;
          const rankColor = getRankColor(index);

          return (
            <motion.div
              key={college.college}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`relative overflow-hidden rounded-xl bg-slate-900 border ${
                index === 0 ? "border-yellow-500/30" : "border-white/5"
              }`}
            >
              {/* Winner Gradient Background */}
              {index === 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent pointer-events-none" />
              )}

              {/* Main Bar (Click to Expand) */}
              <div
                onClick={() => handleToggleExpand(college.college)}
                className="flex items-center justify-between p-3 active:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank Number */}
                  <div
                    className={`text-xl font-black italic font-['Orbitron'] w-8 text-center ${rankColor}`}
                  >
                    #{index + 1}
                  </div>

                  {/* Identity */}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3
                        className={`text-sm font-bold truncate ${index === 0 ? "text-white" : "text-gray-300"}`}
                      >
                        {college.college}
                      </h3>
                      {index === 0 && (
                        <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    {/* Winner Badge (Only if ended) */}
                    {isEnded && index === 0 && (
                        <span className="text-[9px] bg-yellow-500 text-black font-black px-1.5 py-0.5 rounded w-fit">
                            WINNER
                        </span>
                    )}
                    {/* Student Count */}
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium mt-0.5">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {college.studentCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side Stats */}
                <div className="flex items-center gap-3 pl-2">
                  <div className="text-right">
                    <div className="text-sm font-black text-white font-mono tracking-tight">
                      {college.totalXP.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-gray-600 font-bold uppercase">
                      Total XP
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                  />
                </div>
              </div>

              {/* Expanded Data (Zebra Striped List) */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-black/20 border-t border-white/5"
                  >
                    <div className="px-2 py-2 space-y-0.5">
                      <div className="flex justify-between px-3 py-1 text-[9px] font-bold text-gray-600 uppercase tracking-wider">
                        <span>Hero</span>
                        <span>Contribution</span>
                      </div>

                      {topHeroes[college.college] ? (
                        topHeroes[college.college].map((hero, i) => (
                          <div
                            key={hero.id}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`text-[10px] font-mono w-4 text-center ${i < 3 ? "text-neon-purple font-bold" : "text-gray-600"}`}
                              >
                                {i + 1}
                              </span>
                              <HeroAvatar seed={hero.avatarSeed} size={24} />
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-200 w-24 truncate">
                                  {hero.name}
                                </span>
                                <span className="text-[9px] text-gray-500">
                                  Lvl {hero.level}
                                </span>
                              </div>
                            </div>
                            <div className="text-xs font-mono font-bold text-purple-400">
                              +{(hero.thisWeekXP || 0).toLocaleString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-4 text-center text-[10px] text-gray-500 animate-pulse">
                          Accessing Database...
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default CompetitionDetails;