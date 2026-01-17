import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import QuestCard from "../components/QuestCard";
import DailyBounty from "../components/DailyBounty";
import LiveFeed from "../components/LiveFeed";
import TacticalErrorModal from "../components/TacticalErrorModal";
import SecretCodeModal from "../components/SecretCodeModal";
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

  // ✅ NEW: Secret Code Modal state
  const [secretCodeModal, setSecretCodeModal] = useState({
    isOpen: false,
    quest: null,
  });
  const [isJoining, setIsJoining] = useState(false);

  const containerRef = useRef(null);

  // Subscriptions & Live Ticker
  useEffect(() => {
    if (!user?.uid) return; // ✅ Stop if logged out

    // Force re-render every 10 seconds to update expired status
    const timer = setInterval(() => {
      setTimeTick(Date.now());
    }, 10000);

    const unsubQuests = subscribeToAllQuests((data) => {
      setQuests(data);
    });

    return () => {
      clearInterval(timer);
      unsubQuests();
    };
  }, [user?.uid]);

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

      // ✅ Show private quests ONLY if user is the host, otherwise show public quests
      const isVisibleToUser = !quest.isPrivate || quest.hostId === user?.uid;

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

      // ✅ NEW: Hide quests with no members or deleted quests
      const hasMembers =
        (quest.membersCount || 0) > 0 ||
        (quest.members && quest.members.length > 0);

      return (
        matchesCategory &&
        matchesSearch &&
        matchesCity &&
        isOpen &&
        !isCompleted &&
        isVisibleToUser && // ✅ Changed from isPublic
        matchesGender &&
        !isExpired &&
        hasMembers // ✅ Hide empty quests
      );
    })
    .map((quest) => {
      // Add mock distance if coordinates exist, otherwise random
      const hub = hubs.find(
        (h) => h.id === quest.hubId || h.name === quest.hubName,
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
      className="min-h-screen relative transition-colors duration-1000 bg-dark-bg"
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
                <h2 className="showdown-header text-[10px] font-black uppercase tracking-[0.2em] text-red-500 italic">
                  SUNDAY SHOWDOWN: <span className="text-white">2X XP</span>
                </h2>
              </div>
              <Zap className="w-4 h-4 text-yellow-400 fill-current" />
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
                <span className="text-[9px] font-mono text-blue-400 uppercase tracking-widest">
                  Weekly Reset:
                </span>
                <span className="text-[10px] font-black font-mono text-white tracking-widest">
                  {nextReset}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-10 p-4 pt-8 container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-8">
            {/* Header */}
            <div className="mb-8">
              <header className="flex justify-between items-start">
                <div>
                  <h1 className="text-4xl font-['Orbitron'] font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-blue-400 italic tracking-tighter shadow-neon-purple mb-2">
                    QUEST BOARD
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                    <MapPin className="w-3 h-3 text-neon-purple" />
                    <span className="uppercase tracking-[0.2em]">
                      Sector: {city}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black font-mono text-gray-500 uppercase tracking-widest mb-1.5">
                    Operative Status
                  </span>
                  <div className="bg-black/40 backdrop-blur-md border border-neon-purple/50 rounded-xl px-4 py-2 text-sm font-black text-neon-purple italic shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                    LV. {user?.level || 1}
                  </div>
                </div>
              </header>
            </div>

            {/* Daily Bounty Section */}
            <div className="mb-6">
              <DailyBounty />
            </div>

            {/* Search & Filter Component */}
            <div className="mb-8">
              <div className="bg-dark-bg/80 backdrop-blur-xl p-3 rounded-2xl border border-white/5 shadow-2xl">
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search missions..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-600 focus:border-neon-purple outline-none transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {categories.map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => setFilter(cat.name)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-300 font-black text-[9px] uppercase tracking-widest border ${
                          filter === cat.name
                            ? "bg-neon-purple text-white border-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                            : "bg-black/20 text-gray-500 border-white/5 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <cat.icon className="w-3 h-3" />
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quest Grid - Restored for Desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <AnimatePresence mode="popLayout">
                {filteredQuests.length > 0 ? (
                  filteredQuests.map((quest) => (
                    <motion.div
                      key={quest.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{
                        opacity: 0,
                        scale: 0.95,
                        transition: { duration: 0.2 },
                      }}
                    >
                      <Link to={`/quest/${quest.id}`} className="block">
                        <QuestCard quest={quest} hub={null} />
                      </Link>
                    </motion.div>
                  ))
                ) : (
                  <div className="md:col-span-2 py-16 glassmorphism-dark rounded-3xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-neon-purple/5 rounded-full flex items-center justify-center mb-4">
                      <Zap className="w-8 h-8 text-gray-700 animate-pulse" />
                    </div>
                    <h3 className="text-sm font-black text-gray-600 uppercase tracking-widest mb-2">
                      No Signal Found
                    </h3>
                    <p className="text-gray-600 font-mono text-[9px] uppercase tracking-tight">
                      Try broadening search parameters.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            <div className="pt-8 pb-32 border-t border-white/5 lg:hidden">
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">
                  The Tavern • Live Feed
                </h3>
              </div>
              <LiveFeed />
            </div>
          </div>

          {/* Sidebar Column (Desktop Only) */}
          <div className="hidden lg:block lg:col-span-4 sticky top-8 h-fit space-y-6">
            {/* Private Channel Access */}
            <div className="p-6 glassmorphism-dark rounded-3xl border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Lock className="w-12 h-12 text-neon-purple" />
              </div>
              <h3 className="text-[10px] font-black uppercase text-neon-purple tracking-[0.3em] mb-4 flex items-center gap-2">
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
                className="relative"
              >
                <input
                  name="code"
                  type="text"
                  maxLength={6}
                  placeholder="ACCESS CODE"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-4 text-center text-lg font-mono tracking-[0.4em] uppercase text-white placeholder-gray-800 focus:border-neon-purple outline-none transition-all"
                />
              </form>
            </div>

            {/* Live Feed Sidebar */}
            <div className="glassmorphism-dark rounded-3xl p-6 border border-white/5">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">
                  The Tavern • Live Feed
                </h3>
              </div>
              <LiveFeed />
            </div>
          </div>
        </div>

        {/* Floating Action Button - Position adjusted for app feel */}
        <Link
          to="/create-quest"
          className="fixed bottom-28 right-6 z-50 group sm:bottom-8 sm:right-8"
        >
          <div className="absolute inset-0 bg-neon-purple blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
          <div className="relative bg-black border border-neon-purple shadow-[0_0_30px_rgba(168,85,247,0.4)] px-4 py-3 rounded-2xl flex items-center gap-2 transition-transform duration-300 hover:scale-105 active:scale-95">
            <Plus className="w-5 h-5 text-white" />
            <span className="font-black italic text-xs text-white tracking-widest">
              POST MISSION
            </span>
          </div>
        </Link>

        <TacticalErrorModal
          isOpen={errorModal.isOpen}
          onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
          message={errorModal.message}
        />

        {/* ✅ NEW: Secret Code Modal for Private Quests */}
        <SecretCodeModal
          isOpen={secretCodeModal.isOpen}
          onClose={() => setSecretCodeModal({ isOpen: false, quest: null })}
          onSubmit={async (secretCode) => {
            if (!secretCodeModal.quest || !user?.uid) return;

            setIsJoining(true);
            try {
              const { joinQuest } = await import("../backend/firebaseService");
              await joinQuest(secretCodeModal.quest.id, user.uid, secretCode);

              // Success - navigate to lobby
              navigate(`/lobby/${secretCodeModal.quest.id}`);
            } catch (error) {
              console.error("Join quest error:", error);
              setErrorModal({
                isOpen: true,
                message: error.message || "Failed to join quest",
              });
            } finally {
              setIsJoining(false);
              setSecretCodeModal({ isOpen: false, quest: null });
            }
          }}
          questTitle={secretCodeModal.quest?.title || ""}
          isJoining={isJoining}
        />
      </div>
    </div>
  );
};

export default QuestBoard;
