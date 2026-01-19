import React, { useRef } from "react";
import { motion } from "framer-motion";
import {
  QrCode,
  Fingerprint,
  Shield,
  Zap,
  Flame,
  Crosshair,
  Star,
  Instagram,
  MessageCircle,
  Award,
  Target,
  Hash,
} from "lucide-react";
import { toPng } from "html-to-image";
import toast from "react-hot-toast"; // Added toast for feedback
import { useAuth } from "../context/AuthContext";
import HeroAvatar from "./HeroAvatar";
import {
  levelProgress,
  getTier,
  getXPNeededForLevel,
  getFeedbackBadges,
} from "../utils/xp";

const HeroCardGenerator = ({ user: propUser, showActions = true }) => {
  const { user: authUser } = useAuth();
  const user = propUser || authUser;

  const cardRef = useRef(null);

  const level = user?.level || 1;
  const xp = user?.xp || 0;
  // Calculate progress percent
  const progressPercent = levelProgress(xp, level);
  const currentTier = getTier(level);
  const xpNeeded = getXPNeededForLevel(level);
  const avatarSeed = user?.avatarSeed || user?.uid || "default";

  // Stats Grid - Using lucid icons that match the "Futuristic/Cyberpunk" vibe
  const stats = [
    {
      icon: Target,
      label: "QUESTS",
      value: user?.totalQuests || 0,
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

  // Get Badges
  const feedbackBadges = getFeedbackBadges(user?.feedbackCounts || {});
  const unlockedBadges = feedbackBadges.filter((b) => b.isUnlocked).slice(0, 3); // Top 3 medals

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `${user?.name || "operative"}-identity-card.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Identity Card Downloaded!"); // Added success toast
    } catch (error) {
      console.error("Failed to generate card:", error);
      toast.error("Failed to generate card.");
    }
  };

  const shareToWhatsApp = () => {
    const text = `🕵️‍♂️ SQUAD QUEST IDENTITY VERIFIED\n\n👤 Operative: ${user?.name || "Unknown"}\n🎖 Tier: ${currentTier.name}\n⚡ Level: ${level}\n🔥 Streak: ${user?.daily_streak || 0}\n\nJoin the resistance: https://squad-quest-ca9f2.web.app`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareToInstagram = () => {
    // Redirect to Instagram Stories (camera) on mobile if possible, else main site
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = "instagram://story-camera";
      // Fallback or just let it try open app
      setTimeout(() => {
        window.open("https://www.instagram.com", "_blank");
      }, 1000);
    } else {
      window.open("https://www.instagram.com", "_blank");
    }
    toast("Opening Instagram...", { icon: "📸" });
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-md">
        {/* Main Card Container */}
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-[#0f0720]/90 backdrop-blur-xl rounded-3xl border border-purple-500/30 overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.3)]"
        >
          {/* Top Gold/Purple Glow */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-80" />

          {/* Header Section */}
          <div className="relative bg-gradient-to-r from-purple-900/50 to-transparent py-3 border-b border-purple-500/20">
            <h2 className="text-center text-white/90 font-black tracking-[0.3em] text-sm uppercase font-['Orbitron'] drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]">
              IDENTITY MODULE
            </h2>
          </div>

          <div className="p-8 space-y-6">
            {/* --- HOLOGRAPHIC AVATAR RING --- */}
            <div className="relative flex justify-center py-4">
              {/* Rotating Runes Ring - Purple/Gold */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute w-56 h-56 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <div className="w-full h-full rounded-full border border-purple-500/20" />
                <svg
                  className="absolute inset-0 w-full h-full animate-spin-slow"
                  viewBox="0 0 100 100"
                >
                  <path
                    id="curve"
                    d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                    fill="transparent"
                  />
                  <text fontSize="5" fill="#a855f7" letterSpacing="3">
                    <textPath href="#curve">
                      SYSTEM • SECURE • ACCESS • GRANTED • SYSTEM • SECURE
                    </textPath>
                  </text>
                </svg>
              </motion.div>

              {/* Inner Glow Ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute w-44 h-44 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-yellow-400/30"
              />

              {/* Avatar Container */}
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#1a1a2e] shadow-[0_0_30px_rgba(168,85,247,0.5)] z-10 bg-black">
                <HeroAvatar
                  seed={avatarSeed}
                  tierName={currentTier.name}
                  size={128}
                />
              </div>
            </div>

            {/* --- USER IDENTITY --- */}
            <div className="text-center space-y-2 relative z-10">
              <h1 className="text-3xl font-black text-white tracking-widest uppercase font-['Orbitron'] drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                {user?.name || "OPERATIVE"}
              </h1>

              {/* Tier Shield Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-900/0 via-purple-900/60 to-purple-900/0 px-8 py-1">
                <Award
                  className={`w-4 h-4 ${currentTier.name === "Gold" ? "text-yellow-400" : "text-purple-400"}`}
                />
                <span
                  className={`text-xs font-bold tracking-[0.2em] uppercase ${currentTier.name === "Gold" ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" : "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"}`}
                >
                  {currentTier.name} TIER
                </span>
              </div>
            </div>

            {/* --- XP PROGRESS --- */}
            <div className="space-y-1 relative z-10">
              <div className="flex justify-between text-[10px] font-bold text-purple-300/80 uppercase tracking-widest">
                <span>Experience</span>
                <span className="text-white drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]">
                  {Math.floor(xp)} / {Math.floor(xp + xpNeeded)} XP
                </span>
              </div>
              <div className="h-3 bg-black/60 rounded-sm border border-white/10 relative overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 relative"
                >
                  {/* Glow Flare */}
                  <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_white]" />
                </motion.div>
              </div>
            </div>

            {/* --- STATS GRID (Transparent Panels) --- */}
            <div className="grid grid-cols-3 gap-3 relative z-10">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-3 flex flex-col items-center justify-center gap-1 backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.2)]"
                >
                  <stat.icon
                    className={`w-4 h-4 ${stat.color} mb-1 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]`}
                  />
                  <span className="text-[9px] text-white/50 font-bold uppercase tracking-widest">
                    {stat.label}
                  </span>
                  <span className="text-sm font-black text-yellow-400 font-['Orbitron'] drop-shadow-[0_0_5px_rgba(250,204,21,0.3)]">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>

            {/* --- ACHIEVEMENTS (Medals) --- */}
            <div className="relative z-10 space-y-3">
              <h3 className="text-center text-[10px] font-bold text-purple-300/50 uppercase tracking-[0.3em] flex items-center gap-4">
                <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-purple-500/30" />
                Top Achievements
                <span className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-purple-500/30" />
              </h3>

              <div className="flex justify-center gap-6">
                {unlockedBadges.length > 0 ? (
                  unlockedBadges.map((badge, i) => (
                    <div key={i} className="relative group">
                      <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2a1b3d] to-[#1a0f2e] border border-yellow-400/30 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                        <span className="text-2xl drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                          {badge.icon}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex gap-4 opacity-30">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-12 h-12 rounded-full border border-dashed border-white/20 flex items-center justify-center"
                      >
                        <Shield className="w-5 h-5 text-white/20" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* --- FOOTER: BIOMETRIC SYNC --- */}
            <div className="mt-6 pt-4 border-t border-purple-500/20 flex items-center justify-between relative z-10">
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
                    OPERATIVE SINCE:{" "}
                    {user?.metadata?.creationTime
                      ? new Date(user.metadata.creationTime).getFullYear()
                      : "2025"}
                  </p>
                </div>
              </div>
              <div className="relative">
                <Fingerprint className="w-10 h-10 text-purple-500/20" />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-transparent via-purple-500/10 to-transparent animate-scan"
                  style={{ height: "2px" }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* --- ACTION BUTTONS --- */}
        {showActions && (
          <div className="mt-8 space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownload}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroCardGenerator;
