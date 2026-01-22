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
import ProfileOverview from "./ProfileOverview";

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

const HeroProfile = ({ user, onEdit, onEditAvatar }) => {
  // Default to "overview" for new users (Level 1, 0 XP)
  const isNewUser =
    (user?.level === 1 || !user?.level) && (user?.xp === 0 || !user?.xp);
  const [activeTab, setActiveTab] = useState(
    isNewUser ? "overview" : "dashboard",
  );
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

  const xp = user.xp || 0; // Spendable currency
  const lifetime = user.lifetimeXP || xp; // Total earned (fallback to xp if not set yet)

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

  return (
    <div className="w-full text-white font-sans px-4 sm:px-8 pb-8 relative">
      <AnimatePresence>
        {showGuide && <OnboardingGuide onClose={() => setShowGuide(false)} />}
      </AnimatePresence>

      {/* Header / Tabs - Mobile Optimized */}
      <div className="w-full flex items-center justify-between mb-6 sticky top-0 bg-dark-bg/80 backdrop-blur-xl py-4 z-40 border-b border-white/5">
        <h1 className="text-2xl sm:text-3xl font-['Orbitron'] font-black uppercase text-white tracking-tighter whitespace-nowrap flex items-center gap-2">
          <div className="w-1 h-6 bg-neon-purple rounded-full" />
          Profile
        </h1>
        <div className="flex gap-2">
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
              <div className="relative bg-[#15171E] rounded-[2rem] p-6 sm:p-8 overflow-hidden border border-white/10 shadow-2xl">
                {/* Decorative background splashes */}
                <div
                  className={`absolute -top-20 -right-20 w-64 h-64 bg-${currentTier.color.split("-")[1]}-500/10 blur-[60px] rounded-full pointer-events-none`}
                />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center lg:flex-row lg:items-center lg:justify-between lg:gap-10">
                  {/* LEFT (Desktop) / TOP (Mobile): Avatar + Name + Level */}
                  <div className="flex flex-col items-center lg:flex-row lg:items-center lg:gap-8 w-full lg:w-auto">
                    {/* Avatar - With Edit Button */}
                    <div className="relative group mb-4 lg:mb-0">
                      <div
                        className={`absolute inset-0 bg-${currentTier.color.split("-")[1]}-500/20 blur-xl rounded-full scale-110 group-hover:scale-125 transition-transform duration-500`}
                      />
                      <div className="w-[110px] h-[110px] sm:w-32 sm:h-32 rounded-full border-[3px] border-[#15171E] relative z-10 overflow-hidden shadow-2xl ring-2 ring-white/10 ring-offset-2 ring-offset-[#15171E]">
                        <HeroAvatar
                          seed={avatarSeed}
                          tierName={currentTier.name}
                          size={128}
                          equippedFrame={user.equippedFrame}
                        />
                      </div>

                      {/* Pencil Edit Button - Shows on Hover */}
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
                    </div>

                    {/* Identity Details */}
                    <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
                      <h2 className="text-2xl sm:text-4xl font-['Orbitron'] font-black text-white italic tracking-tighter uppercase mb-2 drop-shadow-md">
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
                                        bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent
                                        drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]
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
                        className={`aspect-square min-h-[100px] rounded-2xl flex flex-col items-center justify-center p-3 border transition-all relative overflow-hidden group $\{
                          badge.isUnlocked
                            ? "bg-white/5 border-white/10 shadow-lg"
                            : "bg-black/20 border-white/5"
                        }`}
                      >
                        <div
                          className={`flex flex-col items-center justify-center flex-1 ${!badge.isUnlocked ? "grayscale opacity-60" : ""}`}
                        >
                          <div className="text-2xl sm:text-3xl mb-1">
                            {badge.icon}
                          </div>
                          <div className="text-[8px] sm:text-[9px] text-center font-black uppercase text-gray-400 leading-tight px-1">
                            {badge.label}
                          </div>
                        </div>

                        {!badge.isUnlocked && (
                          <div className="w-full mt-auto pt-2">
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
                                className="h-full bg-gradient-to-r from-purple-600 to-purple-400"
                              />
                            </div>
                          </div>
                        )}

                        {/* Lock Icon Overlay if 0 progress */}
                        {!badge.isUnlocked && progress === 0 && (
                          <div className="absolute top-2 right-2 opacity-20">
                            <Lock className="w-3 h-3 text-gray-500" />
                          </div>
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
              <HeroCardGenerator user={user} />
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
    </div>
  );
};

export default HeroProfile;
