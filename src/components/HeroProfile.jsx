import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import {
  levelProgress,
  xpToNextLevel,
  getTier,
  getFeedbackBadges,
  getNearUnlockBadge,
  getHonorRank,
} from "../utils/xp";
import HeroCardGenerator from "./HeroCardGenerator";
import HeroAvatar from "./HeroAvatar";
import AscensionNotification from "./AscensionNotification";
import { getLevelProgress } from "../utils/leveling";

import OnboardingGuide from "./OnboardingGuide";

const HeroicStatItem = ({
  label,
  value,
  sublabel,
  icon: Icon,
  color,
  delay,
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className="bg-[#15171E] p-4 rounded-2xl border border-white/5 flex items-center gap-4 relative overflow-hidden group"
  >
    <div
      className={`p-3 rounded-full bg-${color}-500/10 text-${color}-400 group-hover:scale-110 transition-transform relative z-10`}
    >
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1 relative z-10">
      <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-0.5">
        {label}
      </div>
      <div className="text-xl font-['Orbitron'] font-black text-white leading-none">
        {value}
      </div>
      {sublabel && (
        <div
          className={`text-[9px] font-bold uppercase tracking-wider text-${color}-400 mt-1`}
        >
          {sublabel}
        </div>
      )}
    </div>

    {/* Hover Glow */}
    <div
      className={`absolute -right-4 -bottom-4 w-20 h-20 bg-${color}-500/5 rounded-full blur-xl group-hover:bg-${color}-500/10 transition-colors pointer-events-none`}
    />
  </motion.div>
);

const HeroProfile = ({ user, onEdit }) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showGuide, setShowGuide] = useState(false);
  const [showBadgeHelp, setShowBadgeHelp] = useState(false);

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

  const xp = user.xp || 0;

  // --- PROGRESSIVE LEVELING DISPLAY (New Utility) ---
  const {
    xpIntoLevel: xpInLevel,
    xpForNextLevel: nextTargetXP,
    progressPercent,
    level: calcLevel,
  } = getLevelProgress(xp || 0);

  // FORCE SYNC: Use calculated level as the source of truth for UI
  const level = calcLevel;

  const reliability = user.reliabilityScore || 100;
  const honorRank = getHonorRank(reliability);
  const feedbackCounts = user.feedbackCounts || user.vibeTags || {};

  const currentTier = getTier(level);
  const badgeList = getFeedbackBadges(feedbackCounts);
  const unlockedBadges = badgeList.filter((b) => b.isUnlocked);

  // Consistent Seed for Avatar
  const avatarSeed =
    user.avatarSeed || user.uid || user.email || "hero-default";

  // Determine next tier name for hover tooltip
  let nextTierName = "Bronze";
  if (currentTier.name === "Bronze") nextTierName = "Silver";
  if (currentTier.name === "Silver") nextTierName = "Gold";
  if (currentTier.name === "Gold") nextTierName = "Max Level";

  /* Enhanced Tier Badge Component */
  const TierBadge = ({ tier }) => {
    const isRecruit = tier === "Recruit";
    const isBronze = tier === "Bronze";
    const isSilver = tier === "Silver";
    const isGold = tier === "Gold";

    return (
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Glow Backend */}
        <div
          className={`absolute inset-0 bg-${
            currentTier.color.split("-")[1]
          }-500/20 blur-2xl rounded-full animate-pulse`}
        />

        {/* Main Icon Layer */}
        <div className="relative xz-10 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          {isGold && (
            <div className="relative">
              <Crown
                className="w-24 h-24 text-yellow-400 fill-yellow-400/20"
                strokeWidth={1.5}
              />
              <Globe className="w-10 h-10 text-yellow-200 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 animate-spin-slow opacity-50" />
            </div>
          )}
          {isSilver && (
            <div className="relative">
              <Shield
                className="w-24 h-24 text-slate-300 fill-slate-300/20"
                strokeWidth={1.5}
              />
              <Award className="w-10 h-10 text-cyan-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          )}
          {isBronze && (
            <div className="relative">
              <Medal
                className="w-24 h-24 text-orange-400 fill-orange-400/20"
                strokeWidth={1.5}
              />
              <Zap className="w-8 h-8 text-yellow-200 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-3/4" />
            </div>
          )}
          {isRecruit && (
            <div className="relative">
              <Shield
                className="w-24 h-24 text-gray-600 fill-gray-800"
                strokeWidth={1}
              />
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-black text-xs uppercase tracking-widest pt-2">
                RKT
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full text-white font-sans p-4 md:p-8 relative">
      <AnimatePresence>
        {showGuide && <OnboardingGuide onClose={() => setShowGuide(false)} />}
      </AnimatePresence>

      {/* Header / Tabs */}
      <div className="w-full flex items-center gap-6 mb-8 border-b border-white/5 pb-4 px-4 overflow-x-auto">
        <h1 className="text-3xl font-['Orbitron'] font-black uppercase text-white tracking-tighter whitespace-nowrap">
          Profile Command
        </h1>
        <div className="flex gap-4 ml-auto items-center">
          <button
            onClick={() => setShowGuide(true)}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Open Guide"
          >
            <BookOpen className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full transition-all whitespace-nowrap ${
              activeTab === "dashboard"
                ? "bg-neon-purple text-white shadow-[0_0_15px_#a855f7]/50"
                : "text-gray-500 hover:text-white"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("card")}
            className={`text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full transition-all whitespace-nowrap ${
              activeTab === "card"
                ? "bg-neon-purple text-white shadow-[0_0_15px_#a855f7]/50"
                : "text-gray-500 hover:text-white"
            }`}
          >
            Download ID
          </button>
        </div>
      </div>

      <div className="w-full">
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* LEFT COLUMN: Identity & Heroic Stats */}
              <div className="space-y-6">
                {/* 1. Hero Identity Shield */}
                <div className="bg-[#15171E] rounded-3xl p-8 relative overflow-hidden shadow-2xl border border-white/5 flex flex-col items-center justify-center min-h-[350px]">
                  {/* Background glow */}
                  <div
                    className={`absolute top-0 right-0 w-64 h-64 bg-${
                      currentTier.color.split("-")[1]
                    }-500/10 blur-3xl rounded-full pointer-events-none`}
                  />

                  <div className="relative z-10 flex flex-col items-center text-center">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="mb-4 relative"
                    >
                      <TierBadge tier={currentTier.name} />
                    </motion.div>

                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                      Current Level
                    </div>

                    {/* Hover Popup for Level */}
                    <div className="relative group cursor-help">
                      <h2
                        className={`text-6xl font-['Orbitron'] font-black italic tracking-tighter uppercase mb-2 text-white shadow-lg`}
                      >
                        {level}
                      </h2>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-black/90 border border-white/10 p-3 rounded-lg text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">
                          {nextTargetXP - xpInLevel} XP until Level{" "}
                          {calcLevel + 1}!
                        </p>
                      </div>
                    </div>

                    <div
                      className={`px-4 py-1.5 rounded-full bg-${
                        currentTier.color.split("-")[1]
                      }-500/10 border border-${
                        currentTier.color.split("-")[1]
                      }-500/30 backdrop-blur-md`}
                    >
                      <span
                        className={`${currentTier.color} text-xs font-black uppercase tracking-[0.2em]`}
                      >
                        {currentTier.name} Agent
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Heroic Stats Grid (Replacing Bars) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2 px-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-black 'Orbitron' uppercase tracking-widest text-gray-400">
                      Heroic Stats
                    </span>
                  </div>

                  {/* Total Quests */}
                  <HeroicStatItem
                    label="Total Quests"
                    value={user.totalQuests || 0}
                    sublabel="Successful Meetups"
                    icon={Target}
                    color="cyan"
                    delay={0.1}
                  />

                  {/* Reliability Rank */}
                  <HeroicStatItem
                    label="Reliability Rank"
                    value={`${reliability}%`}
                    sublabel={honorRank.level}
                    icon={Shield}
                    color={honorRank.level === "LEGENDARY" ? "purple" : "green"}
                    delay={0.2}
                  />

                  {/* Guild Level */}
                  <HeroicStatItem
                    label="Guild Level"
                    value={`LV. ${level}`}
                    sublabel="Overall Rank"
                    icon={Crown}
                    color="orange"
                    delay={0.3}
                  />
                </div>
              </div>

              {/* RIGHT COLUMN: Progress & Badges */}
              <div className="lg:col-span-2 space-y-8">
                {/* 1. Main Level Dashboard */}
                <div className="bg-[#15171E] rounded-3xl p-8 relative overflow-hidden border border-white/5 flex flex-col gap-6">
                  {/* User Details Header - ADDED HERE */}
                  <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                    <div className="w-14 h-14 rounded-full border-2 border-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.3)] overflow-hidden">
                      <HeroAvatar
                        seed={avatarSeed}
                        tierName={currentTier.name}
                        size={64}
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-['Orbitron'] font-black text-white italic tracking-tighter uppercase">
                        {user.name || "Unknown Hero"}
                      </h2>
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                        Squad Commander
                      </div>
                    </div>
                  </div>

                  {/* Level Header Row */}
                  <div className="flex justify-between items-center relative z-10 px-2">
                    {/* Current Level */}
                    <div className="text-center">
                      <div className="text-5xl font-['Orbitron'] font-black text-white italic tracking-tighter">
                        {level}
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">
                        Current
                      </div>
                    </div>

                    {/* Center Label */}
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-neon-purple/80 mb-4 hidden md:block">
                      Level Progress
                    </div>

                    {/* Next Level */}
                    <div className="text-center">
                      <div className="text-5xl font-['Orbitron'] font-black text-gray-700 italic tracking-tighter">
                        {level + 1}
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-700 mt-1">
                        Target
                      </div>
                    </div>
                  </div>

                  {/* Main Progress Bar */}
                  <div className="relative z-10">
                    <div className="h-6 w-full bg-black/50 rounded-full overflow-hidden border border-white/5 relative">
                      {/* Background Track Pattern */}
                      <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#fff_10px,#fff_12px)]" />

                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1 }}
                        className="h-full bg-gradient-to-r from-neon-purple to-pink-500 shadow-[0_0_20px_#a855f7] relative"
                      >
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 blur-[1px]" />
                      </motion.div>
                    </div>
                    <div className="text-center mt-2">
                      <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">
                        {xpInLevel} / {nextTargetXP} XP
                      </span>
                    </div>
                  </div>

                  {/* Decorative bg */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-neon-purple/5 blur-[100px] rounded-full pointer-events-none" />
                </div>

                {/* 2. Hall of Honor (Badge Gallery) */}
                <div className="bg-[#15171E] rounded-3xl p-8 border border-white/5 relative">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2 relative">
                      <h3 className="text-sm font-['Orbitron'] font-black uppercase text-white flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-400" />
                        Hall of Honor
                      </h3>
                      {/* Badge Tutorial Icon */}
                      <button
                        onClick={() => setShowBadgeHelp(!showBadgeHelp)}
                        className="text-gray-500 hover:text-white transition-colors"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </button>

                      {/* Badge Tutorial Tooltip */}
                      <AnimatePresence>
                        {showBadgeHelp && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-8 left-0 w-64 bg-black/90 p-3 rounded-xl border border-white/10 z-50 shadow-xl"
                          >
                            <p className="text-[10px] text-gray-300 leading-relaxed">
                              <span className="text-white font-bold block mb-1">
                                Badge Protocol:
                              </span>
                              Complete Quests and leave a positive impression on
                              your Squad to receive Medals.
                              <br />
                              <br />
                              <span className="text-neon-purple">
                                5 Tags = 1 Permanent Badge Unlock.
                              </span>
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <span className="text-[10px] font-mono font-bold text-gray-600 bg-black/20 px-3 py-1 rounded-full border border-white/5">
                      {unlockedBadges.length} / {badgeList.length} UNLOCKED
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {badgeList.map((badge) => (
                      <motion.div
                        key={badge.id}
                        whileHover={{ y: -5 }}
                        className={`relative p-3 rounded-2xl flex flex-col items-center gap-3 transition-all border ${
                          badge.isUnlocked
                            ? `bg-gradient-to-b from-white/10 to-transparent ${badge.color.replace(
                                "text-",
                                "border-"
                              )}/40 shadow-[0_0_15px_rgba(255,255,255,0.05)]`
                            : "bg-black/40 border-white/5 opacity-70"
                        }`}
                      >
                        {/* Icon Container */}
                        <div
                          className={`w-12 h-12 flex items-center justify-center text-3xl transition-all duration-300 ${
                            badge.isUnlocked
                              ? "drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] scale-110"
                              : "grayscale brightness-50 contrast-125"
                          }`}
                        >
                          {badge.icon}
                        </div>

                        <div className="text-center w-full z-10">
                          <div
                            className={`text-[9px] font-black uppercase tracking-wider truncate px-1 mb-2 ${
                              badge.isUnlocked
                                ? "text-white text-shadow-sm"
                                : "text-gray-600"
                            }`}
                          >
                            {badge.label}
                          </div>

                          {/* Universal Progress Bar */}
                          <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.min(
                                  100,
                                  (badge.current / badge.threshold) * 100
                                )}%`,
                              }}
                              transition={{ duration: 1, delay: 0.2 }}
                              className={`h-full ${
                                badge.isUnlocked
                                  ? `bg-gradient-to-r ${badge.color.replace(
                                      "text-",
                                      "from-"
                                    )} to-white shadow-[0_0_8px_currentColor]`
                                  : "bg-gray-700"
                              }`}
                            />
                          </div>
                          <div className="flex justify-between items-center mt-1 px-0.5">
                            <span className="text-[8px] font-mono text-gray-500">
                              {badge.current}/{badge.threshold}
                            </span>
                            {badge.isUnlocked && (
                              <span className="text-[8px] font-bold text-green-400">
                                GET
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Shine Effect for Unlocked */}
                        {badge.isUnlocked && (
                          <>
                            <div
                              className={`absolute inset-0 rounded-2xl bg-gradient-to-tr ${badge.color.replace(
                                "text-",
                                "from-"
                              )}/5 to-transparent pointer-events-none`}
                            />
                            <div
                              className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent`}
                            />
                            <div
                              className={`absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-${
                                badge.color.split("-")[1]
                              }-500/20 to-transparent`}
                            />
                          </>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pb-12 flex flex-col items-center pt-16 perspective-1000"
            >
              <div
                className={`relative w-full max-w-sm transition-all duration-700 transform-style-3d cursor-pointer ${
                  activeTab === "card-back" ? "rotate-y-180" : ""
                }`}
                onClick={() =>
                  setActiveTab((prev) =>
                    prev === "card" ? "card-back" : "card"
                  )
                }
              >
                {/* Front Face */}
                <div className="backface-hidden relative z-10">
                  <HeroCardGenerator user={user} />
                </div>

                {/* Back Face */}
                <div className="absolute inset-0 h-full w-full bg-[#15171E] rounded-3xl border border-white/10 p-6 rotate-y-180 backface-hidden flex flex-col items-center justify-center shadow-2xl">
                  {/* Decorative Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/20 blur-3xl rounded-full pointer-events-none" />

                  <h3 className="text-xl font-['Orbitron'] font-black text-white uppercase italic tracking-tighter mb-6 relative z-10">
                    Badge Protocols
                  </h3>

                  <div className="grid grid-cols-3 gap-4 w-full relative z-10">
                    {unlockedBadges.slice(0, 9).map((badge) => (
                      <div
                        key={badge.id}
                        className="flex flex-col items-center gap-2 p-2 bg-white/5 rounded-xl border border-white/5"
                      >
                        <div className="text-2xl drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                          {badge.icon}
                        </div>
                        <span className="text-[8px] font-black uppercase text-gray-400 text-center leading-tight">
                          {badge.label}
                        </span>
                      </div>
                    ))}
                    {unlockedBadges.length === 0 && (
                      <div className="col-span-3 text-center text-gray-500 text-xs font-mono py-8">
                        No Badges Encoded
                      </div>
                    )}
                  </div>

                  <div className="mt-8 text-[10px] text-neon-purple font-black uppercase tracking-[0.2em] animate-pulse">
                    Tap to Flip
                  </div>
                </div>
              </div>

              <div className="mt-12 text-center relative z-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Download logic would go here
                  }}
                  className="bg-neon-purple hover:bg-fuchsia-600 text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
                >
                  <Users className="w-4 h-4" />
                  Download Official Card
                </button>
                <p className="mt-4 text-[9px] text-gray-600 font-mono uppercase tracking-widest">
                  Verified on Blockchain • Squad Quest Protocol
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HeroProfile;
