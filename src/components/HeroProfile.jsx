import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng, toBlob } from "html-to-image";
import toast from "react-hot-toast";
import {
  Award,
  MapPin,
  Shield,
  Zap,
  Globe,
  Brain,
  MessageCircle,
  Lock,
  Crown,
  Medal,
  Target,
  Users,
  HelpCircle,
  BookOpen,
  Info,
  Loader,
  Flame,
  Frame,
} from "lucide-react";
import {
  levelProgress,
  xpToNextLevel,
  getTier,
  getFeedbackBadges,
  getNearUnlockBadge,
  getHonorRank,
} from "../utils/xp";
import { getBorderConfig } from "../utils/borderStyles";
import HeroCardGenerator from "./HeroCardGenerator";
import HeroAvatar from "./HeroAvatar";
import BorderSelectorModal from "./BorderSelectorModal";
import AscensionNotification from "./AscensionNotification";
import { getLevelProgress } from "../utils/leveling";

import OnboardingGuide from "./OnboardingGuide";
import ProfileOverview from "./ProfileOverview";
import { useGame } from "../context/GameContext";
import AvatarFrame from "./AvatarFrame";

const HeroicStatItem = ({
  label,
  value,
  sublabel,
  icon: Icon,
  color,
  delay,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col justify-between relative overflow-hidden group hover:bg-white/10 transition-colors"
  >
    <div className="flex justify-between items-start mb-2">
      <div
        className={`p-2 rounded-xl bg-${color}-500/10 text-${color}-400 group-hover:scale-110 transition-transform`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className={`text-[9px] font-black uppercase text-${color}-400/80`}>
        {sublabel}
      </div>
    </div>

    <div>
      <div className="text-2xl font-['Orbitron'] font-black text-white leading-none tracking-tight mb-1">
        {value}
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">
        {label}
      </div>
    </div>

    {/* Hover Glow */}
    <div
      className={`absolute -right-8 -bottom-8 w-24 h-24 bg-${color}-500/10 rounded-full blur-2xl group-hover:bg-${color}-500/20 transition-colors pointer-events-none`}
    />
  </motion.div>
);

const HeroCardExport = ({
  user,
  tier,
  stats,
  level,
  progressPercent,
  lifetime,
  xpNeeded,
}) => {
  const avatarSeed =
    user?.avatarSeed || user?.uid || user?.email || "hero-default";
  const tierName = tier?.name || "Recruit";

  return (
    <div
      style={{
        width: "350px",
        height: "600px",
        background: "#0f0f23",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "32px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Card Container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          background: "rgba(15, 7, 32, 0.9)",
          borderRadius: "24px",
          border: "1px solid rgba(168, 85, 247, 0.3)",
          overflow: "hidden",
          boxShadow: "0 0 50px rgba(168, 85, 247, 0.3)",
          display: "flex",
          flexDirection: "column",
          padding: "24px",
        }}
      >
        {/* Top Glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "4px",
            background:
              "linear-gradient(90deg, transparent, #a855f7, transparent)",
            opacity: 0.8,
          }}
        />

        {/* Header */}
        <div
          style={{
            position: "relative",
            background:
              "linear-gradient(90deg, rgba(88, 28, 135, 0.5), transparent)",
            padding: "12px 0",
            borderBottom: "1px solid rgba(168, 85, 247, 0.2)",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              color: "rgba(255, 255, 255, 0.9)",
              fontWeight: 900,
              letterSpacing: "0.3em",
              fontSize: "14px",
              textTransform: "uppercase",
              fontFamily: "Orbitron, sans-serif",
              textShadow: "0 0 5px rgba(168, 85, 247, 0.8)",
            }}
          >
            IDENTITY MODULE
          </h2>
        </div>

        {/* Avatar */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "128px",
              height: "128px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "4px solid #1a1a2e",
              boxShadow: "0 0 30px rgba(168, 85, 247, 0.5)",
              background: "#000",
            }}
          >
            <HeroAvatar
              seed={avatarSeed}
              tierName={tierName}
              size={128}
              equippedFrame={user?.equippedFrame}
              imgProps={{ crossOrigin: "anonymous" }}
            />
          </div>
        </div>

        {/* Name & Tier */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontFamily: "Orbitron, sans-serif",
              textShadow: "0 0 10px rgba(255, 255, 255, 0.8)",
              marginBottom: "8px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user?.name || "OPERATIVE"}
          </h1>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background:
                "linear-gradient(90deg, rgba(88,28,135,0) 0%, rgba(88,28,135,0.6) 50%, rgba(88,28,135,0) 100%)",
              padding: "4px 32px",
            }}
          >
            <Award
              style={{
                width: "16px",
                height: "16px",
                color: tierName === "Gold" ? "#fbbf24" : "#a855f7",
              }}
            />
            <span
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: tierName === "Gold" ? "#fbbf24" : "#a855f7",
              }}
            >
              {tierName} TIER
            </span>
          </div>
        </div>

        {/* XP Bar */}
        <div
          style={{
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "10px",
              fontWeight: "bold",
              color: "rgba(196, 181, 253, 0.8)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "4px",
            }}
          >
            <span>Level {level}</span>
            <span style={{ color: "#fff" }}>
              {Math.floor(lifetime)} / {Math.floor(lifetime + xpNeeded)} XP
            </span>
          </div>
          <div
            style={{
              height: "12px",
              background: "rgba(0, 0, 0, 0.6)",
              borderRadius: "4px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #7c3aed, #d946ef, #ec4899)",
                width: `${progressPercent}%`,
              }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          {stats.map((stat, i) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={i}
                style={{
                  background: "rgba(88, 28, 135, 0.1)",
                  border: "1px solid rgba(168, 85, 247, 0.2)",
                  borderRadius: "12px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                <IconComponent
                  style={{
                    width: "16px",
                    height: "16px",
                    color: "#a855f7",
                  }}
                />
                <span
                  style={{
                    fontSize: "9px",
                    color: "rgba(255, 255, 255, 0.5)",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                  }}
                >
                  {stat.label}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 900,
                    color: "#fbbf24",
                    fontFamily: "Orbitron, sans-serif",
                  }}
                >
                  {stat.value}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: "16px",
            borderTop: "1px solid rgba(168, 85, 247, 0.2)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "10px",
              color: "rgba(255, 255, 255, 0.4)",
              fontFamily: "monospace",
            }}
          >
            ID: {user?.uid?.substring(0, 8) || "UNKNOWN"}
          </p>
        </div>
      </div>
    </div>
  );
};

const CardPreviewModal = ({
  user,
  tier,
  stats,
  level,
  progressPercent,
  lifetime,
  xpNeeded,
  onClose,
}) => {
  const handleDownload = async () => {
    try {
      const element = document.getElementById("clean-export-target");
      if (!element) return;

      const dataUrl = await toPng(element, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `${user?.name || "operative"}-squad-id.png`;
      link.href = dataUrl;
      link.click();
      onClose();
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  const handleNativeShare = async () => {
    try {
      const element = document.getElementById("clean-export-target");
      if (!element) return;

      const blob = await toBlob(element, { cacheBust: true, pixelRatio: 2 });
      if (blob) {
        const file = new File([blob], "squad-id.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "My Squad Quest ID",
            text: "Check out my stats on Squad Quest!",
          });
        }
      }
    } catch (error) {
      console.error("Error sharing:", error);
      // Fallback: If share fails, just download it
      handleDownload();
    }
  };

  const showShareButton = navigator.canShare;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
      <h2 className="text-white font-['Orbitron'] text-xl mb-6 tracking-widest uppercase">
        Preview Card
      </h2>

      <div className="relative shadow-2xl scale-[0.85] sm:scale-100 transition-transform">
        <div id="clean-export-target">
          <HeroCardExport
            user={user}
            tier={tier}
            stats={stats}
            level={level}
            progressPercent={progressPercent}
            lifetime={lifetime}
            xpNeeded={xpNeeded}
          />
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          onClick={onClose}
          className="px-6 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors"
        >
          Cancel
        </button>

        {showShareButton && (
          <button
            onClick={handleNativeShare}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-black uppercase tracking-wider shadow-lg hover:scale-105 transition-transform"
          >
            Share
          </button>
        )}

        <button
          onClick={handleDownload}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-pink-600 text-white font-black uppercase tracking-wider shadow-lg hover:scale-105 transition-transform"
        >
          Save to Device
        </button>
      </div>
    </div>
  );
};

const HeroProfile = ({ user, onEdit, onEditAvatar }) => {
  const { inventory, equippedFrame, equipFrame } = useGame();
  // Default to "overview" for new users (Level 1, 0 XP)
  const isNewUser =
    (user?.level === 1 || !user?.level) && (user?.xp === 0 || !user?.xp);
  const [activeTab, setActiveTab] = useState(
    isNewUser ? "overview" : "dashboard",
  );
  const [showGuide, setShowGuide] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showBorderModal, setShowBorderModal] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem("squad_quest_guide_seen");
    if (!hasSeen) {
      setShowGuide(true);
      localStorage.setItem("squad_quest_guide_seen", "true");
    }
  }, []);

  // Loading State
  if (!user) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center text-white">
        <Loader className="w-8 h-8 animate-spin text-neon-purple mb-4" />
        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">
          Synchronizing Identity...
        </p>
      </div>
    );
  }

  const xp = user.xp || 0; // Spendable currency
  const lifetime = user.lifetimeXP || xp; // Total earned (fallback to xp if not set yet)

  // --- SQUAD POWER CALCULATION ---
  const squadPower =
    Math.floor((user.xp || 0) / 10) +
    (user.questsCompleted || 0) * 50 +
    (user.daily_streak || 0) * 100;

  // --- PROGRESSIVE LEVELING DISPLAY (New Utility) ---
  const {
    xpIntoLevel: xpInLevel,
    xpForNextLevel: nextTargetXP,
    progressPercent,
    level: calcLevel,
  } = getLevelProgress(lifetime, xp); // \ud83c\udf96\ufe0f Use lifetimeXP for level

  // FORCE SYNC: Use calculated level as the source of truth for UI
  const level = calcLevel;

  const reliability = user.reliabilityScore || 100;
  const honorRank = getHonorRank(reliability);
  const feedbackCounts = user.feedbackCounts || user.vibeTags || {};

  // Shop Items for Badge Display
  const SHOP_ITEMS = {
    badge_whale: { icon: "💎", label: "The Whale", rarity: "SHOP" },
    badge_coffee: { icon: "☕", label: "Caffeine Club", rarity: "SHOP" },
    badge_dev: { icon: "💻", label: "Code Ninja", rarity: "SHOP" },
  };

  const currentTier = getTier(level);
  // 🏆 WEEKLY WINNER OVERRIDE
  const specialBorder = user.activeBorder || null;

  // Quest badges from feedback
  const questBadges = getFeedbackBadges(feedbackCounts);

  // Shop badges from inventory
  const shopBadges = (user?.inventory?.badges || [])
    .map((badgeId) => {
      const shopBadge = SHOP_ITEMS[badgeId];
      return shopBadge ? { ...shopBadge, id: badgeId, isUnlocked: true } : null;
    })
    .filter(Boolean);

  // Merge all badges
  const badgeList = [...questBadges, ...shopBadges];
  const unlockedBadges = badgeList.filter((b) => b.isUnlocked);

  // Consistent Seed for Avatar
  const avatarSeed =
    user.avatarSeed || user.uid || user.email || "hero-default";

  // Stats for card export (matching HeroCardGenerator)
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

  // Get top 3 badges for display (matching HeroCardGenerator logic)
  const displayBadges = badgeList.filter((b) => b.isUnlocked).slice(0, 3);

  // Calculate XP needed for next level
  const xpNeeded = nextTargetXP - xpInLevel;

  // Capture card function for export

  /* Enhanced Tier Badge Component - Optimized for Overlay */
  const TierBadge = ({ tier, small = false }) => {
    const isRecruit = tier === "Recruit";
    const isBronze = tier === "Bronze";
    const isSilver = tier === "Silver";
    const isGold = tier === "Gold";

    const containerSize = small
      ? "w-12 h-12 sm:w-16 sm:h-16"
      : "w-24 h-24 sm:w-32 sm:h-32";
    const iconSize = small
      ? "w-8 h-8 sm:w-10 sm:h-10"
      : "w-20 h-20 sm:w-24 sm:h-24";
    const subIconSize = small
      ? "w-4 h-4 sm:w-5 sm:h-5"
      : "w-6 h-6 sm:w-8 sm:h-8";

    return (
      <div
        className={`relative ${containerSize} flex items-center justify-center`}
      >
        {/* Glow Backend - Reduced for small variant */}
        <div
          className={`absolute inset-0 bg-${
            currentTier.color.split("-")[1]
          }-500/20 blur-[20px] rounded-full animate-pulse ${small ? "opacity-50" : ""}`}
        />

        {/* Main Icon Layer */}
        <div className="relative z-10 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)] transform scale-90 sm:scale-100">
          {isGold && (
            <div className="relative">
              <Crown
                className={`${iconSize} text-yellow-400 fill-yellow-400/20`}
                strokeWidth={1.5}
              />
              <Globe
                className={`${subIconSize} text-yellow-200 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 animate-spin-slow opacity-50`}
              />
            </div>
          )}
          {isSilver && (
            <div className="relative">
              <Shield
                className={`${iconSize} text-slate-300 fill-slate-300/20`}
                strokeWidth={1.5}
              />
              <Award
                className={`${subIconSize} text-cyan-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}
              />
            </div>
          )}
          {isBronze && (
            <div className="relative">
              <Medal
                className={`${iconSize} text-orange-400 fill-orange-400/20`}
                strokeWidth={1.5}
              />
              <Zap
                className={`${subIconSize} text-yellow-200 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-3/4`}
              />
            </div>
          )}
          {isRecruit && (
            <div className="relative">
              <Shield
                className={`${iconSize} text-gray-600 fill-gray-800`}
                strokeWidth={1}
              />
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-black text-[8px] sm:text-[10px] uppercase tracking-widest pt-1 sm:pt-1.5">
                RKT
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ✅ Internal Profile Swipe Handler
  const tabs = ["dashboard", "card", "overview"];

  // Touch tracking for internal swipe navigation
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const deltaX = touchEndX.current - touchStartX.current;
    const threshold = 50;
    const currIndex = tabs.indexOf(activeTab);

    if (deltaX > threshold && currIndex > 0) {
      setActiveTab(tabs[currIndex - 1]);
    } else if (deltaX < -threshold && currIndex < tabs.length - 1) {
      setActiveTab(tabs[currIndex + 1]);
    }
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  // Social Share Handler (Whatsapp/Instagram)
  const handleDirectShare = async () => {
    const toastId = toast.loading("Generating Neural Link...");
    try {
      // 1. Target the Stealth Container
      const element = document.getElementById("stealth-export-card");
      if (!element) throw new Error("Stealth element missing");

      // 2. FORCE BROWSER TO PAINT:
      // Trigger reflow without breaking flex layout
      void element.offsetHeight;

      // 3. WAIT for images/fonts (Critical Step)
      // This 500ms delay gives the browser time to render the off-screen pixels
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 4. Capture
      const dataUrl = await toPng(element, {
        cacheBust: true,
        pixelRatio: 3, // Higher quality
        backgroundColor: "#0f0f23", // Force dark background
        skipAutoScale: true,
        style: { opacity: "1", visibility: "visible" }, // Force visible for capture
      });

      // 5. Convert to File
      const byteString = atob(dataUrl.split(",")[1]);
      const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const file = new File([blob], "squad-id.png", { type: "image/png" });

      // 6. Share
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Join my Squad!",
          text: `Level ${level} ${currentTier?.name} Hero on Squad Quest!`,
        });
        toast.success("Link Established!", { id: toastId });
      } else {
        toast.error("Device doesn't support image sharing", { id: toastId });
      }
    } catch (err) {
      console.error("Share error:", err);
      toast.error("Neural Link Failed", { id: toastId });
    }
  };

  return (
    <div
      className="w-full text-white font-sans px-4 sm:px-8 pb-8 relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence>
        {showGuide && <OnboardingGuide onClose={() => setShowGuide(false)} />}
      </AnimatePresence>

      {/* STEALTH EXPORT CONTAINER - ON SCREEN BUT INVISIBLE */}
      <div
        id="stealth-export-card"
        style={{
          position: "fixed",
          top: 0,
          left: 0, // 🔥 MUST be on screen for images to load
          width: "350px",
          height: "600px",
          zIndex: -9999, // Send to the very back
          opacity: 0, // Invisible to the user
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="scale-100">
          <HeroCardExport
            user={user}
            tier={currentTier}
            stats={stats}
            level={level}
            progressPercent={progressPercent}
            lifetime={lifetime}
            xpNeeded={xpNeeded}
          />
        </div>
      </div>

      {/* Rest of the component... */}

      {/* Header / Tabs - Mobile Optimized */}
      <div className="w-full flex items-center justify-between mb-6 sticky top-0 bg-dark-bg/80 backdrop-blur-xl py-4 z-40 border-b border-white/5">
        <h1 className="text-2xl sm:text-3xl font-['Orbitron'] font-black uppercase text-white tracking-tighter whitespace-nowrap flex items-center gap-2">
          <div className="w-1 h-6 bg-neon-purple rounded-full" />
          Profile
        </h1>
        <div data-swipeable="profile-tabs" className="flex gap-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`p-2 sm:px-4 sm:py-2 rounded-xl transition-all ${
              activeTab === "dashboard"
                ? "bg-neon-purple text-white shadow-lg"
                : "bg-white/5 text-gray-400"
            }`}
          >
            <Target className="w-5 h-5 sm:hidden" />
            <span className="hidden sm:block text-xs font-black uppercase tracking-widest">
              Dashboard
            </span>
          </button>
          <button
            onClick={() => setActiveTab("card")}
            className={`p-2 sm:px-4 sm:py-2 rounded-xl transition-all ${
              activeTab === "card"
                ? "bg-neon-purple text-white shadow-lg"
                : "bg-white/5 text-gray-400"
            }`}
          >
            <Users className="w-5 h-5 sm:hidden" />
            <span className="hidden sm:block text-xs font-black uppercase tracking-widest">
              ID Card
            </span>
          </button>
          <button
            onClick={() => setActiveTab("overview")}
            className={`p-2 sm:px-4 sm:py-2 rounded-xl transition-all ${
              activeTab === "overview"
                ? "bg-neon-purple text-white shadow-lg"
                : "bg-white/5 text-gray-400"
            }`}
          >
            <BookOpen className="w-5 h-5 sm:hidden" />
            <span className="hidden sm:block text-xs font-black uppercase tracking-widest">
              Overview
            </span>
          </button>
        </div>
      </div>

      <div className="w-full">
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* 1. Immersive Hero Identity Card */}
              <div
                className={`
                  relative rounded-[2rem] p-6 sm:p-8 overflow-hidden 
                  border shadow-2xl transition-all duration-500
                  ${
                    currentTier.name === "Legendary"
                      ? "bg-gradient-to-br from-fuchsia-950 via-purple-900 to-black border-purple-500/50"
                      : currentTier.name === "Gold"
                        ? "bg-gradient-to-br from-yellow-950 via-yellow-900/50 to-black border-yellow-500/30"
                        : currentTier.name === "Silver"
                          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-black border-slate-500/30"
                          : currentTier.name === "Bronze"
                            ? "bg-gradient-to-br from-[#431407] via-[#270a02] to-black border-orange-500/20"
                            : "bg-[#15171E] border-white/10"
                  }
                `}
              >
                {/* Optional Noise Overlay */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
                {/* Decorative background splashes */}
                <div
                  className={`absolute -top-20 -right-20 w-64 h-64 bg-${currentTier.color.split("-")[1]}-500/10 blur-[60px] rounded-full pointer-events-none`}
                />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center lg:flex-row lg:items-center lg:justify-between lg:gap-10">
                  {/* LEFT (Desktop) / TOP (Mobile): Avatar + Name + Level */}
                  <div className="flex flex-col items-center lg:flex-row lg:items-center lg:gap-8 w-full lg:w-auto">
                    {/* Avatar - With God Aura based on Tier */}
                    <div className="relative group mb-4 lg:mb-0">
                      {/* Aura Glow - Priority: Special Border > Tier */}
                      <div
                        className={`absolute inset-0 blur-2xl rounded-full transition-all duration-500 ${
                          specialBorder === "golden_glitch"
                            ? "bg-yellow-500/60 opacity-100"
                            : specialBorder === "silver_shimmer"
                              ? "bg-slate-100/40 opacity-90"
                              : specialBorder === "bronze_plate"
                                ? "bg-orange-800/50 opacity-100"
                                : currentTier.name === "Legendary"
                                  ? "bg-fuchsia-500/40 opacity-100"
                                  : currentTier.name === "Gold"
                                    ? "bg-yellow-500/40 opacity-100"
                                    : currentTier.name === "Silver"
                                      ? "bg-cyan-500/30 opacity-80"
                                      : currentTier.name === "Bronze"
                                        ? "bg-orange-500/20 opacity-60"
                                        : "bg-purple-500/10 opacity-30"
                        }`}
                      />
                      {/* UNIFIED BORDER VISUALS (Fixed Spinning Face) */}
                      {(() => {
                        const hasCosmetic = equippedFrame;
                        const specialBorder = user.activeBorder || null;
                        const borderVisuals = specialBorder
                          ? getBorderConfig(specialBorder, currentTier.name)
                          : getBorderConfig(null, currentTier.name);

                        return (
                          <div className="relative w-[110px] h-[110px] sm:w-32 sm:h-32 flex items-center justify-center">
                            {/* LAYER 1: Animated Border (Background) - Hidden if cosmetic frame exists */}
                            {!hasCosmetic && (
                              <motion.div
                                className={`absolute inset-[-8px] rounded-full ${borderVisuals.style}`}
                                style={{
                                  boxShadow: borderVisuals.shadow,
                                  filter: borderVisuals.filter,
                                }}
                                animate={borderVisuals.animate}
                                transition={borderVisuals.transition}
                              />
                            )}

                            {/* LAYER 2: Avatar with optional cosmetic frame */}
                            <div
                              className={`relative z-10 ${hasCosmetic ? "w-full h-full" : "w-full h-full"} rounded-full ${!hasCosmetic && "border-4 border-[#15171E] bg-[#15171E]"} overflow-hidden`}
                            >
                              <AvatarFrame frameId={equippedFrame} size="lg">
                                <HeroAvatar
                                  user={user}
                                  tierName={currentTier.name}
                                  size={128}
                                  hideBorder={true}
                                  className="w-full h-full"
                                />
                              </AvatarFrame>
                            </div>

                            {/* BUTTONS (Inside Relative Container) */}
                            {/* Pencil Edit Button */}
                            {onEditAvatar && (
                              <button
                                onClick={onEditAvatar}
                                className="absolute bottom-0 right-0 z-20 p-2.5 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-full shadow-lg border-2 border-white/20 transition-all duration-300 hover:scale-110 active:scale-95"
                                title="Edit Avatar"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="text-white"
                                >
                                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                  <path d="m15 5 4 4" />
                                </svg>
                              </button>
                            )}

                            {/* Border Selector Button */}
                            {user.uid && (
                              <button
                                onClick={() => setShowBorderModal(true)}
                                className="absolute bottom-0 left-0 z-20 p-2.5 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full shadow-lg border-2 border-white/20 transition-all duration-300 hover:scale-110 active:scale-95 group/btn"
                                title="Equip Border"
                              >
                                <Frame className="w-4 h-4 text-white" />
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Identity Details */}
                    <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
                      <h2 className="text-2xl sm:text-4xl font-['Orbitron'] font-black text-white italic tracking-tighter uppercase mb-1 drop-shadow-md">
                        {user.name || "Unknown Hero"}
                      </h2>

                      {/* Level & Progress (Subtle below name) */}
                      <div className="w-full max-w-[200px] mb-6 lg:mb-0">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">
                          <span>Level {level}</span>
                          <span className="text-neon-purple">
                            {Math.round(progressPercent)}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-neon-purple to-pink-500 shadow-[0_0_10px_#a855f7]"
                          />
                        </div>
                        <div className="text-[9px] text-gray-600 font-mono mt-1 text-center lg:text-left">
                          {nextTargetXP - xpInLevel} XP to Next Level
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CENTER (Mobile) / RIGHT (Desktop): The HERO Tier Badge */}
                  <div className="w-full lg:w-auto mt-4 lg:mt-0 flex justify-center lg:justify-end">
                    <div
                      className={`
                            relative w-full max-w-[280px] lg:w-[220px] 
                            bg-gradient-to-br from-[#1A1D26] to-black 
                            border border-${currentTier.color.split("-")[1]}-500/30 
                            rounded-xl p-1 shadow-[0_0_20px_rgba(0,0,0,0.5)]
                            group hover:scale-105 transition-transform duration-300
                        `}
                    >
                      {/* Inner Badge Container */}
                      <div
                        className={`
                                bg-[#15171E] rounded-lg p-3 flex items-center justify-center gap-3 relative overflow-hidden
                            `}
                      >
                        {/* Background Glow */}
                        <div
                          className={`absolute inset-0 bg-${currentTier.color.split("-")[1]}-500/10 opacity-50 blur-md`}
                        />

                        {/* Badge Icon */}
                        <div className="relative z-10 w-10 h-10 flex-shrink-0">
                          <TierBadge tier={currentTier.name} small={true} />
                        </div>

                        {/* Badge Text */}
                        <div className="relative z-10 text-left">
                          <div
                            className={`text-[10px] font-bold text-${currentTier.color.split("-")[1]}-500 uppercase tracking-widest leading-none mb-0.5`}
                          >
                            Current Rank
                          </div>
                          <div
                            className={`
                                        text-xl font-['Orbitron'] font-black uppercase italic tracking-widest
                                        ${
                                          currentTier.name === "Legendary"
                                            ? "bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(232,121,249,0.5)]"
                                            : currentTier.name === "Bronze"
                                              ? "bg-gradient-to-r from-orange-300 to-red-400 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                              : "bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                        }
                                    `}
                          >
                            {currentTier.name}
                          </div>
                        </div>

                        {/* Shine Effect */}
                        <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover:animate-shine" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Stats Grid - Mobile Optimized */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <HeroicStatItem
                  label="Quests Done"
                  value={user.questsCompleted || user.totalQuests || 0}
                  sublabel="Completed"
                  icon={Target}
                  color="cyan"
                  delay={0.1}
                />
                <HeroicStatItem
                  label="Reliability"
                  value={`${reliability}%`}
                  sublabel={honorRank.level}
                  icon={Shield}
                  color={honorRank.level === "LEGENDARY" ? "purple" : "green"}
                  delay={0.2}
                />
                <div className="col-span-2 lg:col-span-1">
                  <HeroicStatItem
                    label="Total XP"
                    value={(user.lifetimeXP || user.xp || 0).toLocaleString()}
                    sublabel="Lifetime"
                    icon={Zap}
                    color="yellow"
                    delay={0.3}
                  />
                </div>
              </div>

              {/* 3. Badge Gallery */}
              <div className="bg-[#15171E]/50 backdrop-blur-md rounded-3xl p-6 border border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-['Orbitron'] font-black uppercase text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-neon-purple" />
                    Badges
                  </h3>
                  <span className="text-[9px] font-black bg-white/5 px-2 py-1 rounded text-gray-400">
                    {unlockedBadges.length} / {badgeList.length}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {badgeList.map((badge) => {
                    const progress = Math.min(
                      ((badge.current || 0) / (badge.needed || 1)) * 100,
                      100,
                    );
                    return (
                      <div
                        key={badge.id}
                        className={`aspect-square min-h-[100px] rounded-2xl flex flex-col items-center justify-center p-3 transition-all relative overflow-hidden group/badge ${
                          badge.isUnlocked
                            ? "bg-white/5 backdrop-blur-md border border-white/10 shadow-lg hover:bg-white/10 hover:border-white/20 hover:scale-105"
                            : "bg-black/60 border border-white/5"
                        }`}
                      >
                        {/* Shine Effect for Unlocked */}
                        {badge.isUnlocked && (
                          <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover/badge:animate-[shine_1s_ease-in-out_infinite]" />
                        )}

                        <div
                          className={`flex flex-col items-center justify-center flex-1 z-10 ${
                            !badge.isUnlocked
                              ? "grayscale opacity-30 blur-[1px]"
                              : ""
                          }`}
                        >
                          <div className="text-2xl sm:text-3xl mb-1 drop-shadow-md">
                            {badge.icon}
                          </div>
                          <div className="text-[8px] sm:text-[9px] text-center font-black uppercase text-gray-300 leading-tight px-1 tracking-wide">
                            {badge.label}
                          </div>
                        </div>

                        {!badge.isUnlocked && (
                          <>
                            {/* Lock Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-20">
                              <Lock className="w-5 h-5 text-white/20" />
                            </div>

                            <div className="w-full mt-auto pt-2 z-10 relative">
                              <div className="flex justify-between items-center text-[6px] text-gray-500 font-mono mb-0.5 px-1">
                                <span>
                                  {badge.current || 0}/{badge.needed}
                                </span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  className="h-full bg-gray-600"
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ) : activeTab === "overview" ? (
            <ProfileOverview />
          ) : (
            <motion.div
              key="card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 flex flex-col items-center justify-center min-h-[50vh]"
            >
              <HeroCardGenerator
                user={user}
                onShare={() => setShowShareModal(true)}
                onDirectShare={handleDirectShare}
              />
              <button
                className="mt-8 bg-white text-black font-black uppercase text-xs px-8 py-3 rounded-full hover:scale-105 transition-transform shadow-xl"
                onClick={() => setActiveTab("dashboard")}
              >
                Close Card
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showShareModal && (
        <CardPreviewModal
          user={user}
          tier={currentTier}
          stats={stats}
          level={level}
          progressPercent={progressPercent}
          lifetime={lifetime}
          xpNeeded={xpNeeded}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Border Selector Modal */}
      <BorderSelectorModal
        isOpen={showBorderModal}
        onClose={() => setShowBorderModal(false)}
        user={user}
        equipFrame={equipFrame}
        equippedFrame={equippedFrame}
        inventory={inventory}
      />
    </div>
  );
};

export default HeroProfile;
