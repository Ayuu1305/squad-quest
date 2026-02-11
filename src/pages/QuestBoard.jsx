import { useState, useEffect, useRef, Suspense, lazy, useMemo } from "react"; // ✅ Added useMemo
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger"; // ✅ Import ScrollTrigger for cleanup
import TacticalErrorModal from "../components/TacticalErrorModal";
import SecretCodeModal from "../components/SecretCodeModal";
import TemporaryBanBanner from "../components/TemporaryBanBanner"; // ✅ Ban banner
import { isBanned } from "../utils/banCheck"; // ✅ Ban check utility
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { useAuth } from "../context/AuthContext";
import {
  subscribeToAllQuests,
  joinQuestByCode,
  fetchMoreQuests, // ✅ Imported
  joinQuest, // ✅ Added for SecretCodeModalw
} from "../backend/services/quest.service";
import useShowdown from "../hooks/useShowdown";
import {
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
  ArrowDown, // ✅ Added
} from "lucide-react";
import InstallPWA from "../components/InstallPWA";

const QuestCard = lazy(() => import("../components/QuestCard"));
const DailyBounty = lazy(() => import("../components/DailyBounty"));
const FloatingLiveFeed = lazy(() => import("../components/FloatingLiveFeed"));
const CyberGridBackground = lazy(
  () => import("../components/CyberGridBackground"),
);
import QuestBoardSkeleton from "../components/skeletons/QuestBoardSkeleton";
import QuestCardSkeleton from "../components/skeletons/QuestCardSkeleton";

const QuestBoard = () => {
  const { city } = useGame();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isActive: activeShowdown, nextReset } = useShowdown();

  // ✅ Check if user is temporarily banned
  const banStatus = user ? isBanned(user) : { banned: false };
  const isTemporarilyBanned =
    banStatus.banned && banStatus.type === "temporary";

  // ✅ Hybrid Pagination State
  const [realtimeQuests, setRealtimeQuests] = useState([]);
  const [olderQuests, setOlderQuests] = useState([]);
  // Derived state for rendering
  const quests = [...realtimeQuests, ...olderQuests];

  const [hubs, setHubs] = useState([]);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: "" });

  // ✅ NEW: Secret Code Modal state
  const [secretCodeModal, setSecretCodeModal] = useState({
    isOpen: false,
    quest: null,
  });
  const [isJoining, setIsJoining] = useState(false);

  // ✅ Private Room Code State
  const [privateCode, setPrivateCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  // ✅ Pagination State
  const [lastDoc, setLastDoc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [enableRealtime, setEnableRealtime] = useState(false);
  const [hasInitialData, setHasInitialData] = useState(false);
  const isReady = enableRealtime && hasInitialData;
  const [showNonCritical, setShowNonCritical] = useState(false);

  // 🚀 PERFORMANCE: LCP Optimization - Delay video rendering

  const containerRef = useRef(null);
  // 🚀 PERFORMANCE: ensure first paint completes before Firebase
  const startedRef = useRef(false);

  const [pagePainted, setPagePainted] = useState(false);

  // ⏱️ Delay realtime Firestore until UI paints
  useEffect(() => {
    const id = setTimeout(() => {
      setEnableRealtime(true);
    }, 300);

    return () => clearTimeout(id);
  }, []);

  // 🚀 PERFORMANCE: mark page as painted (after first visual frame)
  useEffect(() => {
    requestAnimationFrame(() => {
      setPagePainted(true);
    });
  }, []);

  useEffect(() => {
    if (!hasInitialData) return;

    const id = setTimeout(() => {
      setShowNonCritical(true);
    }, 2000); // wait 2s AFTER quests render

    return () => clearTimeout(id);
  }, [hasInitialData]);

  // ✅ OPTIMIZED: Realtime Listener for Top Quests (Deferred to Idle)
  useEffect(() => {
    if (!user?.uid || !enableRealtime || !pagePainted) return;

    let isSubscribed = true; // ✅ Prevent state updates after unmount
    let unsubQuests = null;

    // 🚀 CRITICAL PERFORMANCE FIX: Use requestIdleCallback to defer Firebase listener
    const idleCallbackId = requestIdleCallback(
      () => {
        if (!isSubscribed || startedRef.current) return; // Guard against race condition
        startedRef.current = true;
        console.log(
          "⚡ [Performance] Starting quest listener (deferred to idle)",
        );

        unsubQuests = subscribeToAllQuests((newTopQuests, newLastDoc) => {
          if (!isSubscribed) return; // ✅ Guard against stale updates

          setRealtimeQuests(newTopQuests);
          setHasInitialData(true);

          // ✅ CRITICAL FIX: Use callback form to avoid dependency on olderQuests
          setLastDoc((prevLastDoc) => prevLastDoc || newLastDoc);
        }, city);
      },
      { timeout: 4000 }, // Wait up to 3 seconds for idle time
    );

    return () => {
      isSubscribed = false; // ✅ Mark as unsubscribed
      if (idleCallbackId) cancelIdleCallback(idleCallbackId);
      if (typeof unsubQuests === "function") {
        unsubQuests();
      }
    };
  }, [user?.uid, city, enableRealtime]); // ✅ REMOVED olderQuests.length - prevents re-subscription!

  // ✅ Load More Function
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !lastDoc) return;

    setLoadingMore(true);
    try {
      // Fetch next batch using lastDoc
      const { quests: newQuests, lastVisible } = await fetchMoreQuests(
        lastDoc,
        city,
      );

      if (newQuests.length < 10) {
        setHasMore(false); // No more to load
      }

      if (newQuests.length > 0) {
        setOlderQuests((prev) => [...prev, ...newQuests]);
        setLastDoc(lastVisible);
      }
    } catch (err) {
      console.error("Pagination error:", err);
      // toast.error("Could not load more quests");
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePrivateJoin = async () => {
    if (privateCode.length !== 6 || !user?.uid || joinLoading) return;

    setJoinLoading(true);
    try {
      const qId = await joinQuestByCode(privateCode);
      navigate(`/lobby/${qId}`);
    } catch (err) {
      console.error(err);
      setErrorModal({
        isOpen: true,
        message: err.message || "Invalid Code",
      });
    } finally {
      setJoinLoading(false);
    }
  };

  const categories = [
    { name: "All", icon: Zap },
    { name: "Sports", icon: Swords },
    { name: "Café", icon: Coffee },
    { name: "Gaming", icon: Gamepad2 },
    { name: "Education", icon: BookOpen },
  ];

  // ⚡ PERFORMANCE: Memoize expensive filtering and mapping
  const filteredQuests = useMemo(() => {
    return quests
      .filter((quest) => {
        const matchesCategory = filter === "All" || quest.category === filter;
        const matchesSearch =
          (quest.title || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
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
            const now = Date.now();
            isExpired = now > expiryTime.getTime();
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
  }, [quests, filter, searchTerm, city, user?.uid, user?.gender, hubs]);

  // ⚡ PERFORMANCE: GSAP Background Effects (Showdown Pulse) - Gated & Safe
  useGSAP(
    () => {
      // 🛑 SAFETY CHECK: Don't run animations if data isn't ready or on mobile
      if (window.innerWidth < 1024 || !containerRef.current) return;
      if (!hasInitialData || !enableRealtime) return;

      // 🧹 PRE-CLEANUP: Kill any old ScrollTriggers to prevent "Ghost" errors
      ScrollTrigger.getAll().forEach((t) => t.kill());

      if (activeShowdown) {
        gsap.to(containerRef.current, {
          backgroundColor: "#1a0000",
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          overwrite: "auto",
        });
        const header = containerRef.current?.querySelector(".showdown-header");

        if (header) {
          gsap.to(".showdown-header", {
            textShadow: "0 0 20px #ff0000, 0 0 40px #ff0000",
            duration: 1,
            repeat: -1,
            yoyo: true,
          });
        }
      } else {
        gsap.to(containerRef.current, {
          backgroundColor: "#0F0F13", // dark-bg
          duration: 1,
          overwrite: "auto",
        });
      }
    },
    {
      scope: containerRef, // 👈 CRITICAL: Scopes selectors to this component only
      dependencies: [hasInitialData, enableRealtime, activeShowdown], // 👈 Re-runs when data arrives
    },
  );

  // ✅ Initial Loading State - Show skeleton before realtime data loads
  if (!enableRealtime || !hasInitialData) {
    return <QuestBoardSkeleton />;
  }

  return (
    <div
      className="min-h-screen relative transition-colors duration-1000 bg-dark-bg"
      ref={containerRef}
    >
      {activeShowdown && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,0,0,0.1)_0%,_transparent_70%)] pointer-events-none z-0" />
      )}
      {showNonCritical && (
        <Suspense fallback={null}>
          <CyberGridBackground />
        </Suspense>
      )}

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
                  Weekly Quests:
                </span>
                <span className="text-[10px] font-black font-mono text-white tracking-widest">
                  {nextReset}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ✅ TEMPORARY BAN BANNER - Shows for 7-day banned users */}
      {isTemporarilyBanned && <TemporaryBanBanner banInfo={banStatus} />}

      <div className="relative z-10 p-4 pt-8 container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8">
          {/* Main Content Column - FULL WIDTH */}
          <div className="w-full">
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
                {/* ⭐ INSERT THE BUTTON HERE ⭐ */}
                <InstallPWA />
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black font-mono text-gray-500 uppercase tracking-widest mb-1.5">
                    Operative Status
                  </span>
                  <div className="bg-black/40 backdrop-blur-md border border-neon-purple/50 rounded-xl px-4 py-2 text-sm font-black text-neon-purple italic shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                    {(user?.lifetimeXP || 0).toLocaleString()} XP
                  </div>
                </div>
              </header>
            </div>

            {/* Daily Bounty + Private Channel Row */}
            <div className="mb-8 flex flex-col lg:flex-row gap-6 md:gap-8">
              {/* ✅ PERFORMANCE: No gating, render immediately for faster LCP */}
              <div className="flex-1">
                <Suspense fallback={<div className="h-[180px] w-full" />}>
                  <DailyBounty />
                </Suspense>
              </div>

              {/* Private Channel Access - Secure Terminal */}
              {/* ✅ PERFORMANCE: Match DailyBounty height (180px), remove nested structure */}
              <div className="w-full lg:w-80">
                <div className="p-[1px] rounded-2xl bg-gradient-to-br from-red-500/20 to-transparent shadow-2xl h-full relative overflow-hidden">
                  {/* Scanning Line Animation */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent animate-scan text-shadow-neon" />

                  <div className="min-h-[178px] bg-black rounded-xl p-4 relative font-mono flex flex-col">
                    {/* ✅ LCP FIX: img tag for early discovery + preload */}
                    <img
                      src="/assets/cyber-grid.webp"
                      alt=""
                      loading="eager"
                      fetchPriority="high"
                      width="320"
                      height="240"
                      className="absolute inset-0 w-full h-full object-cover opacity-[0.03] pointer-events-none mix-blend-screen rounded-xl"
                    />

                    {/* HEADER - Fixed text, no swapping */}
                    <div className="flex items-center justify-between mb-3 relative z-10">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-red-500 animate-pulse" />
                        <span
                          className={`text-[10px] font-black uppercase tracking-[0.2em] text-red-500 transition-opacity duration-300 ${
                            isReady ? "opacity-100" : "opacity-60"
                          }`}
                        >
                          PRIVATE ROOM CODE
                        </span>
                      </div>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    </div>

                    {/* INPUT SECTION - Compact layout to fit 178px */}
                    <div className="flex flex-col gap-2 relative z-10 flex-1">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-green font-black text-xs">
                          {">"}
                        </span>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="CODE"
                          value={privateCode}
                          onChange={(e) =>
                            setPrivateCode(
                              e.target.value.slice(0, 6).toUpperCase(),
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && privateCode.length === 6) {
                              handlePrivateJoin();
                            }
                          }}
                          className="w-full bg-[#050505] border border-red-900/20 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono tracking-[0.3em] uppercase text-neon-green placeholder-red-900/30 focus:border-red-500/50 focus:shadow-[0_0_15px_rgba(239,68,68,0.1)] outline-none transition-all duration-100"
                        />
                      </div>

                      {/* BUTTON - Compact for 178px height */}
                      <button
                        onClick={handlePrivateJoin}
                        disabled={
                          privateCode.length !== 6 || joinLoading || !user?.uid
                        }
                        className={`w-full py-2.5 rounded-xl font-black uppercase tracking-wider text-xs transition-all ${
                          privateCode.length === 6 && !joinLoading
                            ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:scale-[1.02]"
                            : "bg-red-900/10 text-red-900/40 border border-red-900/20 cursor-not-allowed"
                        }`}
                      >
                        {joinLoading ? "Decrypting..." : "Join Restricted"}
                      </button>
                    </div>

                    {/* FOOTER - Fixed text */}
                    <div className="mt-2 flex justify-between text-[8px] uppercase tracking-widest text-red-900/60 relative z-10">
                      <span>Secure: AES-256</span>
                      <span>v9.0.1</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Filter Component - Neon Glass Pill */}
            <div className="mb-8 sticky top-20 z-40">
              {/* Make sticky for better UX on scroll */}
              <div className="bg-dark-bg/90 backdrop-blur-xl p-3 sm:p-4 rounded-full border border-white/5 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                {/* Search Pill */}
                <div className="relative group w-full sm:w-auto sm:flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-neon-purple group-focus-within:drop-shadow-[0_0_5px_#a855f7] transition-all duration-300" />
                  <input
                    type="text"
                    placeholder="SCAN FREQUENCIES..."
                    className="w-full bg-black/40 border border-white/10 rounded-full pl-12 pr-4 py-2.5 text-xs font-bold tracking-wider text-white placeholder-gray-600 focus:border-neon-purple focus:bg-black/80 focus:shadow-[0_0_20px_rgba(168,85,247,0.2)] outline-none transition-all duration-300 uppercase"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Filter Tags - Scrollable */}
                <div className="w-full sm:w-auto overflow-x-auto no-scrollbar">
                  <div className="flex gap-2 p-1">
                    {categories.map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => setFilter(cat.name)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 font-black text-[9px] uppercase tracking-widest border backdrop-blur-md ${
                          filter === cat.name
                            ? "bg-neon-purple text-white border-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-105"
                            : "bg-black/40 text-gray-500 border-white/5 hover:bg-white/10 hover:text-white hover:border-white/20"
                        }`}
                      >
                        <cat.icon
                          className={`w-3 h-3 ${filter === cat.name ? "animate-pulse" : ""}`}
                        />
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quest Grid - Restored for Desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-40">
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
                      {isTemporarilyBanned ? (
                        <div className="block cursor-not-allowed">
                          <Suspense fallback={<QuestCardSkeleton />}>
                            <QuestCard
                              quest={quest}
                              hub={null}
                              isBanned={true}
                            />
                          </Suspense>
                        </div>
                      ) : (
                        <Link to={`/quest/${quest.id}`} className="block">
                          <Suspense fallback={<QuestCardSkeleton />}>
                            <QuestCard quest={quest} hub={null} />
                          </Suspense>
                        </Link>
                      )}
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

            {/* ✅ Pagination Load More Button */}
            {hasMore && filteredQuests.length > 0 && (
              <div className="flex justify-center pb-20">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="group relative px-8 py-3 bg-neon-purple/10 border border-neon-purple/30 rounded-full overflow-hidden transition-all hover:bg-neon-purple/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-neon-purple/20 blur-lg group-hover:opacity-75 transition-opacity opacity-0" />
                  <span className="relative z-10 text-xs font-bold uppercase tracking-widest text-neon-purple group-hover:text-white transition-colors flex items-center gap-2">
                    {loadingMore ? (
                      <>
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Scanning Sector...
                      </>
                    ) : (
                      <>
                        Load More Missions
                        <ArrowDown className="w-4 h-4" />
                      </>
                    )}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ✅ NEW: Floating Live Feed - YouTube style notifications */}
        {showNonCritical && (
          <Suspense fallback={null}>
            <FloatingLiveFeed />
          </Suspense>
        )}

        {/* Floating Action Button - Nuclear Launch Style */}
        <div className="fixed bottom-28 right-6 z-50 sm:bottom-10 sm:right-10 flex flex-col items-center gap-2">
          <div className="absolute inset-0 bg-black/50 blur-xl rounded-full scale-110 pointer-events-none" />{" "}
          {/* Shadow Backdrop */}
          {isTemporarilyBanned ? (
            /* Banned: Show disabled button with tooltip */
            <div className="relative group">
              <div className="relative flex items-center gap-3 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full px-6 py-3 shadow-[0_0_30px_rgba(100,100,100,0.3)] border-2 border-white/10 cursor-not-allowed opacity-50">
                <Plus
                  className="w-6 h-6 text-gray-400 relative z-10"
                  strokeWidth={3}
                />
                <span className="text-xs font-black uppercase tracking-widest text-gray-400 relative z-10 whitespace-nowrap">
                  Post Mission
                </span>
              </div>
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                🚫 Banned users cannot create quests
              </div>
            </div>
          ) : (
            <Link
              to="/create-quest"
              className="relative flex items-center gap-3 bg-gradient-to-br from-fuchsia-600 to-purple-800 rounded-full px-6 py-3 shadow-[0_0_30px_rgba(192,38,211,0.5)] transform transition-transform hover:scale-105 active:scale-95 border-2 border-white/20 group"
            >
              {/* Ripple Effect */}
              <div className="absolute inset-0 rounded-full border border-fuchsia-500/50 animate-ping opacity-75" />
              <div className="absolute -inset-3 rounded-full bg-fuchsia-500/20 blur-xl animate-pulse" />

              <Plus
                className="w-6 h-6 text-white relative z-10 drop-shadow-md"
                strokeWidth={3}
              />
              <span className="text-xs font-black uppercase tracking-widest text-white relative z-10 drop-shadow-md whitespace-nowrap">
                Post Mission
              </span>
            </Link>
          )}
        </div>

        <TacticalErrorModal
          isOpen={errorModal.isOpen}
          onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
          message={errorModal.message}
        />

        {/* ✅ NEW: Secret Code Modal for Private Quests */}
        {/* ✅ FIXED: Secret Code Modal uses Context API */}
        <SecretCodeModal
          isOpen={secretCodeModal.isOpen}
          onClose={() => setSecretCodeModal({ isOpen: false, quest: null })}
          onSubmit={async (secretCode) => {
            // 🚫 BLOCK BANNED USERS from joining private quests
            if (isTemporarilyBanned || banStatus.banned) {
              setErrorModal({
                isOpen: true,
                message: "🚫 Banned users cannot join quests",
              });
              setSecretCodeModal({ isOpen: false, quest: null });
              return;
            }

            if (!secretCodeModal.quest || !user?.uid) return;

            setIsJoining(true);
            try {
              // Error 3 Fix: Don't import from firebaseService.
              // Use the 'joinQuest' we already got from useGame() on line 48!

              // Note: Ensure your GameContext joinQuest supports secretCode as 2nd arg
              await joinQuest(secretCodeModal.quest.id, secretCode);

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
