import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import QuestCard from "../components/QuestCard";
import DailyBounty from "../components/DailyBounty";
import LiveFeed from "../components/LiveFeed";
import TacticalErrorModal from "../components/TacticalErrorModal";
import CyberGridBackground from "../components/CyberGridBackground";
import HallOfFameIntro from "../components/HallOfFameIntro"; // IMPORTED
import { useGame } from "../context/GameContext";
import { useAuth } from "../context/AuthContext";
import { db } from "../backend/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import {
  subscribeToAllQuests,
  joinQuestByCode,
} from "../backend/firebaseService";
import useShowdown from "../hooks/useShowdown";
import {
  Shield,
  Lock,
  Search,
  MapPin,
  Zap,
  Swords,
  Coffee,
  Gamepad2,
  BookOpen,
  Plus,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const QuestBoard = () => {
  const { city } = useGame();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isActive: activeShowdown, nextReset } = useShowdown();

  const [quests, setQuests] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: "" });
  const [timeTick, setTimeTick] = useState(Date.now());
  const [showHallOfFame, setShowHallOfFame] = useState(true); // State for Intro
  const containerRef = useRef(null);

  // Subscriptions & Live Ticker
  useEffect(() => {
    // Force re-render every 10 seconds to update expired status
    const timer = setInterval(() => {
      setTimeTick(Date.now());
    }, 10000);

    const unsubQuests = subscribeToAllQuests((data) => {
      setQuests(data);
    });

    const hubsRef = collection(db, "hubs");
    const unsubHubs = onSnapshot(
      hubsRef,
      (snapshot) => {
        const hubsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setHubs(hubsData);
      },
      (error) => {
        console.error("Hubs listener error:", error);
      }
    );

    return () => {
      clearInterval(timer);
      unsubQuests();
      unsubHubs();
    };
  }, []);

  const categories = [
    { name: "All", icon: Zap },
    { name: "Sports", icon: Swords },
    { name: "Café", icon: Coffee },
    { name: "Gaming", icon: Gamepad2 },
    { name: "Education", icon: BookOpen },
  ];

  const filteredQuests = quests
    .filter((quest) => {
      const matchesCategory = filter === "All" || quest.category === filter;
      const matchesSearch =
        (quest.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quest.description || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesCity = quest.city === city;
      const isOpen = quest.status === "open";
      const isPublic = !quest.isPrivate; // Filter out private quests

      // Gender Requirement Logic (Security & Visibility)
      let matchesGender = true;
      const requirement = quest.genderRequirement || "Everyone";

      if (requirement === "Females Only" && user?.gender !== "female") {
        matchesGender = false;
      } else if (requirement === "Males Only" && user?.gender !== "male") {
        matchesGender = false;
      }

      // Hide quests that have ended (assuming 2h duration buffer)
      let isExpired = false;
      if (quest.startTime) {
        const startTimeObj = quest.startTime?.toDate
          ? quest.startTime.toDate()
          : new Date(quest.startTime);

        if (!isNaN(startTimeObj.getTime())) {
          const expiryTime = new Date(startTimeObj.getTime()); // Vanish at Start Time
          const now = new Date(timeTick); // Forces re-filter on tick
          isExpired = now > expiryTime;
        }
      }

      const isCompleted = quest.status === "completed";

      return (
        matchesCategory &&
        matchesSearch &&
        matchesCity &&
        isOpen &&
        !isCompleted &&
        isPublic &&
        matchesGender &&
        !isExpired
      );
    })
    .map((quest) => {
      // Add mock distance if coordinates exist, otherwise random
      const hub = hubs.find(
        (h) => h.id === quest.hubId || h.name === quest.hubName
      );
      const distance = hub
        ? (Math.random() * 3 + 0.5).toFixed(1)
        : (Math.random() * 5 + 1).toFixed(1);
      return { ...quest, distance };
    });

  // GSAP Background Effects (Showdown Pulse)
  useGSAP(() => {
    if (activeShowdown) {
      gsap.to(containerRef.current, {
        backgroundColor: "#1a0000",
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        overwrite: "auto", // Ensure clean overwrites
      });

      gsap.to(".showdown-header", {
        textShadow: "0 0 20px #ff0000, 0 0 40px #ff0000",
        duration: 1,
        repeat: -1,
        yoyo: true,
      });
    } else {
      gsap.to(containerRef.current, {
        backgroundColor: "#0F0F13", // dark-bg
        duration: 1,
        overwrite: "auto",
      });
    }
  }, [activeShowdown]);

  return (
    <div
      className={`min-h-screen relative transition-colors duration-1000 bg-dark-bg`}
      ref={containerRef}
    >
      {/* Hall Of Fame Ceremony Overlay */}
      {showHallOfFame && (
        <HallOfFameIntro onComplete={() => setShowHallOfFame(false)} />
      )}

      {activeShowdown && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,0,0,0.1)_0%,_transparent_70%)] pointer-events-none z-0" />
      )}
      <CyberGridBackground />

      {/* Showdown Event Bar / Reset Timer */}
      <div
        className={`border-b transition-colors duration-500 relative z-50 overflow-hidden ${
          activeShowdown
            ? "bg-red-600/20 border-red-500/40"
            : "bg-blue-500/10 border-blue-500/20"
        }`}
      >
        <AnimatePresence mode="wait">
          {activeShowdown ? (
            <motion.div
              key="showdown-active"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-center gap-4 py-2 px-6"
            >
              <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
              <div className="flex flex-col items-center">
                <h2 className="showdown-header text-[12px] font-black uppercase tracking-[0.4em] text-red-500 italic">
                  SUNDAY NIGHT SHOWDOWN:{" "}
                  <span className="text-white">2X XP ACTIVE</span>
                </h2>
              </div>
              <Zap className="w-4 h-4 text-yellow-400 fill-current animate-bounce" />

              {/* Animating scanning red line for Showdown */}
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-0 left-0 w-1/2 h-[1px] bg-red-500 shadow-[0_0_10px_#ff0000]"
              />
            </motion.div>
          ) : (
            <motion.div
              key="next-reset"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-center gap-4 py-2 px-6"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">
                  Next Weekly Reset:
                </span>
                <span className="text-xs font-black font-mono text-white tracking-widest">
                  {nextReset}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-10 p-4 pt-8 container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-['Orbitron'] font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-blue-400 italic tracking-tighter drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                QUEST BOARD
              </h1>
              <div className="flex items-center gap-2 text-xs text-gray-400 font-mono mt-1">
                <MapPin className="w-3 h-3 text-neon-purple" />
                <span className="uppercase tracking-widest">
                  Sector: {city}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-[10px] uppercase font-black text-gray-500 mb-1 tracking-widest">
                Operative Status
              </div>
              <div className="bg-black/40 backdrop-blur-md border border-neon-purple/50 rounded-lg px-4 py-2 text-sm font-black text-neon-purple italic shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                LV. {user?.level || 1}
              </div>
            </div>
          </header>
        </div>

        {/* Top Controls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Daily Bounty Panel */}
          <div className="lg:col-span-3">
            <DailyBounty />
          </div>

          {/* Private Channel Access */}
          <div className="lg:col-span-1 p-5 glassmorphism-dark rounded-2xl border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Shield className="w-24 h-24 text-neon-purple" />
            </div>

            <h3 className="text-xs font-black uppercase text-neon-purple tracking-widest mb-3 flex items-center gap-2">
              <Lock className="w-3 h-3" /> Private Channel
            </h3>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const code = e.target.code.value;
                if (!code || code.length < 6 || !user?.uid) return;
                try {
                  const qId = await joinQuestByCode(code, user.uid);
                  navigate(`/lobby/${qId}`);
                } catch (err) {
                  console.error(err);
                }
              }}
              className="flex flex-col gap-2"
            >
              <input
                name="code"
                type="text"
                maxLength={6}
                placeholder="ACCESS CODE"
                onChange={async (e) => {
                  const code = e.target.value;
                  if (code.length === 6 && user?.uid) {
                    try {
                      const qId = await joinQuestByCode(code, user.uid);
                      navigate(`/lobby/${qId}`);
                      e.target.value = "";
                    } catch (err) {
                      console.error(err);
                    }
                  }
                }}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-[0.4em] uppercase text-white placeholder-gray-700 focus:border-neon-purple outline-none focus:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
              />
            </form>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column: Filters & Quest Grid */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search & Filters */}
            <div className="sticky top-20 z-30 bg-dark-bg/80 backdrop-blur-xl p-4 rounded-2xl border border-white/5 shadow-2xl">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search active missions..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:border-neon-purple outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar md:pb-0">
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => setFilter(cat.name)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl whitespace-nowrap transition-all duration-300 font-black text-[10px] uppercase tracking-widest border ${
                        filter === cat.name
                          ? "bg-neon-purple text-white border-neon-purple shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                          : "bg-black/20 text-gray-500 border-white/5 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <cat.icon className="w-3.5 h-3.5" />
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3-Column Quest Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredQuests.length > 0 ? (
                  filteredQuests.map((quest) => (
                    <motion.div
                      key={quest.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{
                        opacity: 0,
                        scale: 0.9,
                        transition: { duration: 0.2 },
                      }}
                      className="quest-card-item"
                    >
                      <Link to={`/quest/${quest.id}`} className="block group">
                        <QuestCard
                          quest={quest}
                          hub={hubs.find(
                            (h) =>
                              h.id === quest.hubId || h.name === quest.hubName
                          )}
                        />
                      </Link>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full py-24 glassmorphism-dark rounded-3xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-neon-purple/5 rounded-full flex items-center justify-center mb-6">
                      <Zap className="w-10 h-10 text-gray-700 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-black text-gray-600 uppercase tracking-widest mb-2">
                      No Signal Found
                    </h3>
                    <p className="text-gray-600 font-mono text-xs uppercase tracking-tight">
                      Adjust frequences or broaden search parameters.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column: Live Feed */}
          <div className="hidden lg:block lg:col-span-1 border-l border-neon-purple/10 pl-6">
            <div className="sticky top-24">
              <LiveFeed />
            </div>
          </div>
        </div>

        {/* Mobile Live Feed Stack */}
        <div className="lg:hidden mt-12 pb-32">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-8" />
          <LiveFeed />
        </div>

        {/* Floating Action Button */}
        <Link to="/create-quest" className="fixed bottom-8 right-8 z-50 group">
          <div className="absolute inset-0 bg-neon-purple blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
          <div className="relative bg-black border border-neon-purple shadow-[0_0_30px_rgba(168,85,247,0.4)] p-4 rounded-2xl flex items-center gap-3 transition-transform duration-300 hover:scale-105 hover:-rotate-1 active:scale-95">
            <Plus className="w-6 h-6 text-white" />
            <span className="font-black italic text-white tracking-wider pr-1">
              POST MISSION
            </span>
          </div>
        </Link>

        <TacticalErrorModal
          isOpen={errorModal.isOpen}
          onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
          message={errorModal.message}
        />
      </div>
    </div>
  );
};

export default QuestBoard;
