import React, { useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  QrCode,
  Fingerprint,
  Shield,
  Flame,
  Target,
  Award,
  MessageCircle,
  Instagram,
  RotateCcw,
} from "lucide-react";
import { toPng } from "html-to-image";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import HeroAvatar from "./HeroAvatar";
import {
  levelProgress,
  getTier,
  getXPNeededForLevel,
  getFeedbackBadges,
  BADGE_DEFINITIONS,
} from "../utils/xp";
import { getLevelProgress } from "../utils/leveling"; // 🎖️ For calculating level from lifetimeXP
import { useShareCard } from "../hooks/useShareCard"; // ✅ Visual share hook

const BACKEND_TO_DEF_ID = {
  SQUAD_LEADER: "leader",
  MASTER_STORYTELLER: "storyteller",
  ICEBREAKER: "funny",
  EMPATHETIC_SOUL: "listener",
  TEAM_PLAYER: "teamplayer",
  PHILOSOPHER: "intellectual",
};

const HeroCardGenerator = ({ user: propUser, showActions = true, onShare }) => {
  const { user: authUser } = useAuth();
  const user = propUser || authUser;
  const cardRef = useRef(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const { shareCard } = useShareCard(); // ✅ Visual share functionality

  // --- STATS CALC ---
  const xp = user?.xp || 0; // Wallet balance
  const lifetimeXP = user?.lifetimeXP || xp; // Total earned (fallback for old users)

  // 🎖️ Calculate level from lifetimeXP, not cached user.level
  const { level: calculatedLevel } = getLevelProgress(lifetimeXP, xp);
  const level = calculatedLevel;

  const progressPercent = levelProgress(lifetimeXP, level); // 🎖️ Use lifetimeXP for progress
  const currentTier = getTier(level);
  const xpNeeded = getXPNeededForLevel(level);
  const avatarSeed = user?.avatarSeed || user?.uid || "default";

  // Shop Items for Badge Display
  const SHOP_ITEMS = {
    badge_whale: { icon: "💎", label: "The Whale", rarity: "LEGENDARY" },
    badge_coffee: { icon: "☕", label: "Caffeine Club", rarity: "COMMON" },
    badge_dev: { icon: "💻", label: "Code Ninja", rarity: "RARE" },
  };

  // --- BADGE LOGIC ---
  const { displayBadges, allBadges } = useMemo(() => {
    // 🔍 DEBUG: Log input data
    console.log("🎖️ [HeroCardGenerator] Badge computation:", {
      inventoryBadges: user?.inventory?.badges,
      inventoryFrames: user?.inventory?.frames,
      feedbackCounts: user?.feedbackCounts,
      legacyBadges: user?.badges,
    });

    // 1. Get all unlocked badges from counts (Reliable Single Source of Truth for now)
    const unlockedFromCounts = getFeedbackBadges(
      user?.feedbackCounts || {},
    ).filter((b) => b.isUnlocked);

    // 2. Shop badges from inventory
    const shopBadges = (user?.inventory?.badges || [])
      .map((badgeId) => {
        const shopBadge = SHOP_ITEMS[badgeId];
        console.log(`🔍 Looking up badge "${badgeId}":`, shopBadge);
        return shopBadge ? { ...shopBadge, isUnlocked: true } : null;
      })
      .filter(Boolean);

    console.log("🛍️ [HeroCardGenerator] Shop badges found:", shopBadges);

    // 3. If 'user.badges' array exists (chronological), try to respect it for sorting
    const rawBadges = user?.badges || [];
    let orderedBadges = [];

    if (rawBadges.length > 0) {
      // Map backend IDs to definitions
      const fromArray = rawBadges
        .map((bid) => {
          const defKey = BACKEND_TO_DEF_ID[bid] || bid;
          const def = BADGE_DEFINITIONS[defKey];
          return def ? { ...def, isUnlocked: true } : null;
        })
        .filter(Boolean);

      // Use array order if valid
      if (fromArray.length > 0) {
        orderedBadges = [...fromArray, ...shopBadges];
      } else {
        orderedBadges = [...unlockedFromCounts, ...shopBadges];
      }
    } else {
      orderedBadges = [...unlockedFromCounts, ...shopBadges];
    }

    // Front: Top 3 (Newest or First 3)
    // If from array (old->new), take last 3. If from counts (random), take first 3.
    const frontSlice =
      rawBadges.length > 0
        ? orderedBadges.slice(-3)
        : orderedBadges.slice(0, 3);

    console.log("🎖️ [HeroCardGenerator] Final badges:", {
      displayBadges: frontSlice,
      totalBadges: orderedBadges.length,
    });

    return { displayBadges: frontSlice, allBadges: orderedBadges };
  }, [user]);

  const stats = [
    {
      icon: Target,
      label: "QUESTS",
      value: user?.questsCompleted || 0,
      color: "text-purple-400",
    },
    {
      icon: Shield,
      label: "RELIABILITY",
      value: `${user?.reliabilityScore || 100}%`,
      color: "text-purple-400",
    },
    {
      icon: Flame,
      label: "STREAK",
      value: `${user?.daily_streak || 0}`,
      color: "text-purple-400",
    },
  ];

  const handleDownload = async () => {
    const ghostCard = document.getElementById("share-export-view");
    if (!ghostCard) return;

    const toastId = toast.loading("Resin printing identity card...");
    try {
      // ✅ Capture the GHOST card, best quality, no flipping
      const dataUrl = await toPng(ghostCard, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#000000", // Force black bg
      });
      const link = document.createElement("a");
      link.download = `${user?.name || "operative"}-identity-card.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Identity Module Downloaded!", { id: toastId });
    } catch (error) {
      console.error("Failed to generate card:", error);
      toast.error("Hologram printer jammed.", { id: toastId });
    }
  };

  // ✅ Pass the GHOST element to the share hook
  // We create a mock ref object because the hook expects a ref
  const getGhostRef = () => ({
    current: document.getElementById("share-export-view"),
  });

  const shareToWhatsApp = () => shareCard(getGhostRef(), user?.name);

  const shareToInstagram = () => shareCard(getGhostRef(), user?.name);

  const flipCard = () => setIsFlipped(!isFlipped);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      {/* 3D Container - REMOVED FIXED HEIGHT to restore original styling flow */}
      <div
        className="relative z-10 w-full max-w-md perspective-1000 group cursor-pointer"
        onClick={flipCard}
      >
        <motion.div
          ref={cardRef}
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{
            duration: 0.6,
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative w-full"
        >
          {/* ================= FRONT SIDE (Relative to drive height) ================= */}
          <div
            className="relative backface-hidden w-full bg-[#0f0720]/90 backdrop-blur-xl rounded-3xl border border-purple-500/30 overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.3)]"
            style={{ backfaceVisibility: "hidden" }}
          >
            {/* Top Gold/Purple Glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-80" />

            {/* Header */}
            <div className="relative bg-gradient-to-r from-purple-900/50 to-transparent py-3 border-b border-purple-500/20">
              <h2 className="text-center text-white/90 font-black tracking-[0.3em] text-sm uppercase font-['Orbitron'] drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]">
                IDENTITY MODULE
              </h2>
              {/* Flip Hint */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 animate-pulse">
                <RotateCcw className="w-4 h-4" />
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Avatar Ring */}
              <div className="relative flex justify-center py-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute w-56 h-56 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60"
                >
                  <div className="w-full h-full rounded-full border border-purple-500/20" />
                  <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 100 100"
                  >
                    <path
                      id="curve"
                      d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                      fill="transparent"
                    />
                    <text fontSize="5" fill="#a855f7" letterSpacing="3">
                      <textPath href="#curve">
                        SYSTEM • SECURE • ACCESS • GRANTED •
                      </textPath>
                    </text>
                  </svg>
                </motion.div>

                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#1a1a2e] shadow-[0_0_30px_rgba(168,85,247,0.5)] z-10 bg-black">
                  <HeroAvatar
                    user={user} // ✅ Pass user prop so avatarConfig is accessible
                    seed={avatarSeed}
                    tierName={currentTier.name}
                    size={128}
                  />
                </div>
              </div>

              {/* Name & Tier */}
              <div className="text-center space-y-2 relative z-10">
                <h1 className="text-3xl font-black text-white tracking-widest uppercase font-['Orbitron'] drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] truncate">
                  {user?.name || "OPERATIVE"}
                </h1>
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-900/0 via-purple-900/60 to-purple-900/0 px-8 py-1">
                  <Award
                    className={`w-4 h-4 ${currentTier.name === "Gold" ? "text-yellow-400" : "text-purple-400"}`}
                  />
                  <span
                    className={`text-xs font-bold tracking-[0.2em] uppercase ${currentTier.name === "Gold" ? "text-yellow-400" : "text-purple-400"}`}
                  >
                    {currentTier.name} TIER
                  </span>
                </div>
              </div>

              {/* XP Bar */}
              <div className="space-y-1 relative z-10">
                <div className="flex justify-between text-[10px] font-bold text-purple-300/80 uppercase tracking-widest">
                  <span>Level {level}</span>
                  <span className="text-white">
                    {Math.floor(lifetimeXP)} /{" "}
                    {Math.floor(lifetimeXP + xpNeeded)} XP
                  </span>
                </div>
                <div className="h-3 bg-black/60 rounded-sm border border-white/10 relative overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className="h-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 relative"
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 relative z-10">
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-3 flex flex-col items-center justify-center gap-1 backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.2)]"
                  >
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    <span className="text-[9px] text-white/50 font-bold uppercase">
                      {stat.label}
                    </span>
                    <span className="text-sm font-black text-yellow-400 font-['Orbitron']">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Badges (Front Display) */}
              <div className="relative z-10 space-y-2">
                <h3 className="text-center text-[10px] font-bold text-purple-300/50 uppercase tracking-[0.3em]">
                  Recent Acquisitions
                </h3>
                <div className="flex justify-center gap-4">
                  {displayBadges.length > 0 ? (
                    displayBadges.map((badge, i) => (
                      <div key={i} className="relative group">
                        <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div
                          className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2a1b3d] to-[#1a0f2e] border border-yellow-400/30 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                          title={badge.label}
                        >
                          <span className="text-2xl">{badge.icon}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-white/20 text-xs italic">
                      No badges earned yet.
                    </div>
                  )}
                </div>
                {/* Flip Hint Text */}
                <div className="text-center pt-2">
                  <span className="text-[8px] text-purple-300/50 uppercase tracking-[0.2em] animate-pulse flex items-center justify-center gap-1 cursor-pointer">
                    <RotateCcw className="w-3 h-3" /> Tap to Flip
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-purple-500/20 flex items-center justify-between relative z-10 bg-[#0f0720]/50">
              <div className="flex items-center gap-3">
                <div className="bg-white p-1 rounded shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                  <QrCode className="w-8 h-8 text-indigo-900" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[9px] text-purple-300 font-bold uppercase tracking-wider">
                      Biometric Sync
                    </span>
                  </div>
                  <p className="text-[10px] text-white/90 font-mono">
                    ID: {user?.uid?.substring(0, 8) || "UNKNOWN"}
                  </p>
                </div>
              </div>
              <Fingerprint className="w-10 h-10 text-purple-500/20" />
            </div>
          </div>

          {/* ================= BACK SIDE (Absolute Overlay) ================= */}
          <div
            className="absolute inset-0 backface-hidden w-full h-full bg-[#1a0f2e] rounded-3xl border border-purple-500/50 overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.3)] flex flex-col"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-l from-purple-900/50 to-transparent py-3 border-b border-purple-500/20 shrink-0 flex items-center justify-between px-4">
              <div className="text-white/30 animate-pulse">
                <RotateCcw className="w-4 h-4 scale-x-[-1]" />
              </div>
              <h2 className="text-center text-white/90 font-black tracking-[0.3em] text-sm uppercase font-['Orbitron'] drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]">
                TROPHY ROOM
              </h2>
              <div className="w-4" /> {/* Spacer */}
            </div>

            {/* Scrollable Badge Grid */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-purple-500/20">
              <div className="grid grid-cols-3 gap-4">
                {allBadges.length > 0 ? (
                  allBadges.map((badge, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center gap-2 mb-2 p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2a1b3d] to-[#1a0f2e] border border-yellow-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                        <span className="text-3xl">{badge.icon}</span>
                      </div>
                      <span className="text-[10px] text-center font-bold text-white/80 uppercase leading-tight">
                        {badge.label}
                      </span>
                      <span className="text-[8px] text-purple-300/60 uppercase tracking-widest">
                        {badge.rarity || "COMMON"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-10 text-white/30">
                    <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Start missions to fill your trophy room.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Decoration */}
            <div className="p-4 border-t border-purple-500/20 bg-black/40 text-center shrink-0">
              <p className="text-[9px] text-purple-400 font-mono tracking-widest">
                {allBadges.length} MEDALS ACQUIRED
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* --- ACTION BUTTONS (Outside Flip Container) --- */}
      {showActions && (
        <div className="mt-8 space-y-3 w-full max-w-md">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onShare || handleDownload}
            className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs shadow-[0_0_30px_rgba(147,51,234,0.3)] border border-purple-400/30 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <span className="relative z-10">Generate Operational Card</span>
          </motion.button>

          <div className="flex gap-3">
            <button
              onClick={shareToWhatsApp}
              className="flex-1 bg-[#150a25] border border-purple-500/20 text-white/70 font-bold py-3 rounded-xl uppercase text-[10px] tracking-wider flex items-center justify-center gap-2 hover:bg-purple-900/20 transition-all hover:text-white"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </button>
            <button
              onClick={shareToInstagram}
              className="flex-1 bg-[#150a25] border border-purple-500/20 text-white/70 font-bold py-3 rounded-xl uppercase text-[10px] tracking-wider flex items-center justify-center gap-2 hover:bg-purple-900/20 transition-all hover:text-white"
            >
              <Instagram className="w-3.5 h-3.5" /> Instagram
            </button>
          </div>
          <p className="text-center text-[10px] text-purple-400/40 mt-2">
            Tip: Tap the identity card to view full collection.
          </p>
        </div>
      )}
      {/* --- GHOST CARD FOR EXPORT (Hidden) --- */}
      <div
        id="share-export-view"
        className="fixed top-0 left-[-9999px] w-[350px] bg-[#0f0f23] z-[-10] p-4 rounded-3xl"
        style={{ width: "350px", height: "auto", minHeight: "550px" }} // Fixed width for consistent export
      >
        <div className="relative w-full bg-[#0f0720]/90 backdrop-blur-xl rounded-3xl border border-purple-500/30 overflow-hidden shadow-2xl">
          {/* Top Gold/Purple Glow */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-80" />

          {/* Header */}
          <div className="relative bg-gradient-to-r from-purple-900/50 to-transparent py-3 border-b border-purple-500/20">
            <h2 className="text-center text-white/90 font-black tracking-[0.3em] text-sm uppercase font-['Orbitron']">
              IDENTITY MODULE
            </h2>
          </div>

          <div className="p-8 space-y-6">
            {/* Avatar Ring */}
            <div className="relative flex justify-center py-4">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#1a1a2e] shadow-[0_0_30px_rgba(168,85,247,0.5)] z-10 bg-black">
                <HeroAvatar
                  user={user}
                  seed={avatarSeed}
                  tierName={currentTier.name}
                  size={128}
                />
              </div>
            </div>

            {/* Name & Tier */}
            <div className="text-center space-y-2 relative z-10">
              <h1 className="text-3xl font-black text-white tracking-widest uppercase font-['Orbitron'] truncate">
                {user?.name || "OPERATIVE"}
              </h1>
              <div
                className="inline-flex items-center gap-2 px-8 py-1 mx-auto"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(88,28,135,0) 0%, rgba(88,28,135,0.6) 50%, rgba(88,28,135,0) 100%)",
                }}
              >
                <Award
                  className={`w-4 h-4 ${
                    currentTier.name === "Gold"
                      ? "text-yellow-400"
                      : "text-purple-400"
                  }`}
                />
                <span
                  className={`text-xs font-bold tracking-[0.2em] uppercase ${
                    currentTier.name === "Gold"
                      ? "text-yellow-400"
                      : "text-purple-400"
                  }`}
                >
                  {currentTier.name} TIER
                </span>
              </div>
            </div>

            {/* XP Bar */}
            <div className="space-y-1 relative z-10">
              <div className="flex justify-between text-[10px] font-bold text-purple-300/80 uppercase tracking-widest">
                <span>Level {level}</span>
                <span className="text-white">
                  {Math.floor(lifetimeXP)} / {Math.floor(lifetimeXP + xpNeeded)}{" "}
                  XP
                </span>
              </div>
              <div className="h-3 bg-black/60 rounded-sm border border-white/10 relative overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 relative"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 relative z-10">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-3 flex flex-col items-center justify-center gap-1"
                >
                  {/* Render icon as component since it's a ref in the main loop */}
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-[9px] text-white/50 font-bold uppercase">
                    {stat.label}
                  </span>
                  <span className="text-sm font-black text-yellow-400 font-['Orbitron']">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Badges */}
            <div className="relative z-10 space-y-2">
              <h3 className="text-center text-[10px] font-bold text-purple-300/50 uppercase tracking-[0.3em]">
                Recent Acquisitions
              </h3>
              <div className="flex justify-center gap-4">
                {displayBadges.length > 0 ? (
                  displayBadges.map((badge, i) => (
                    <div key={i} className="relative">
                      <div className="w-12 h-12 rounded-full bg-[#1a0f2e] border border-yellow-400/30 flex items-center justify-center shadow-lg">
                        <span className="text-2xl">{badge.icon}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-white/20 text-xs italic">
                    No badges earned yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-purple-500/20 flex items-center justify-between relative z-10 bg-[#0f0720]/50">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1 rounded">
                <QrCode className="w-8 h-8 text-indigo-900" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-[9px] text-purple-300 font-bold uppercase tracking-wider">
                    Biometric Sync
                  </span>
                </div>
                <p className="text-[10px] text-white/90 font-mono">
                  ID: {user?.uid?.substring(0, 8) || "UNKNOWN"}
                </p>
              </div>
            </div>
            <Fingerprint className="w-10 h-10 text-purple-500/20" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroCardGenerator;
