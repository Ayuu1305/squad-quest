import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Zap, ChevronRight, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SpaceParticles from "../components/SpaceParticles";
import MilestoneNode from "../components/MilestoneNode";
import HowToPlayGuide from "../components/HowToPlayGuide";
import { getLevelProgress } from "../utils/leveling";

const HeroJourney = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const milestones = [
    { level: 5, reward: "First Strike Pack" },
    { level: 10, reward: "The Bronze Aura" },
    { level: 25, reward: "Specialist Tags" },
    { level: 50, reward: "Partner Perks (Cafe Discounts)" },
    { level: 100, reward: "Legendary Title" },
  ];

  // Match Profile page logic: Calculate level from lifetimeXP
  const xp = user?.xp || 0; // Spendable currency
  const lifetime = user?.lifetimeXP || xp; // Total earned (fallback to xp if not set yet)

  // Calculate level using the same utility function as Profile page
  const {
    xpIntoLevel: xpInLevel,
    xpForNextLevel: nextTargetXP,
    progressPercent,
    level: calcLevel,
  } = getLevelProgress(lifetime, xp); // 🏆 Use lifetimeXP for level calculation

  // FORCE SYNC: Use calculated level as the source of truth for UI (same as Profile)
  const currentLevel = calcLevel;

  const nextMilestone =
    milestones.find((m) => m.level > currentLevel) ||
    milestones[milestones.length - 1];
  const prevMilestoneLevel =
    [...milestones].reverse().find((m) => m.level <= currentLevel)?.level || 0;

  // Calculate progress to next milestone (for UI display)
  const progressToNextMilestone =
    ((currentLevel - prevMilestoneLevel) /
      (nextMilestone.level - prevMilestoneLevel)) *
    100;

  if (loading)
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-dark-bg text-white relative overflow-x-hidden pb-32">
      <SpaceParticles />

      {/* Header Overlay */}
      <div className="sticky top-0 z-[100] p-6 bg-gradient-to-b from-dark-bg via-dark-bg/80 to-transparent">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-3 glassmorphism rounded-xl text-white hover:bg-white/10 transition-all border border-white/5 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-end">
            <div className="text-[10px] font-black font-mono text-neon-purple uppercase tracking-[0.3em] mb-1">
              Mission Phase
            </div>
            <div className="text-xl font-black font-['Orbitron'] italic uppercase italic tracking-tighter">
              Hero Journey
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="glassmorphism-dark p-6 rounded-[2rem] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
            <Trophy className="w-16 h-16" />
          </div>

          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                Current Status
              </div>
              <div className="text-3xl font-black font-['Orbitron'] italic tracking-tighter">
                LVL{" "}
                <span className="text-neon-purple text-4xl">
                  {currentLevel}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                Next Objective
              </div>
              <div className="text-sm font-black text-white italic">
                LVL {nextMilestone.level}{" "}
                <span className="text-gray-500 ml-2">•</span>{" "}
                <span className="text-neon-purple">{nextMilestone.reward}</span>
              </div>
            </div>
          </div>

          <div className="relative h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressToNextMilestone}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-neon-purple via-blue-500 to-neon-purple bg-[length:200%_auto] animate-gradient shadow-[0_0_15px_#a855f7]"
            />
          </div>

          <div className="flex justify-between mt-3">
            <span className="text-[9px] font-mono text-gray-600 uppercase tracking-[0.2em]">
              Synchronization: {Math.round(progressToNextMilestone)}%
            </span>
            <div className="flex items-center gap-1.5 text-[9px] font-black text-neon-purple uppercase tracking-widest">
              <Target className="w-3 h-3 animate-pulse" />
              Sector Clear: {currentLevel}/{nextMilestone.level}
            </div>
          </div>
        </div>
      </div>

      {/* How to Play Guide */}
      <div className="px-6 mb-8">
        <HowToPlayGuide />
      </div>

      {/* The Roadmap */}
      <div className="relative px-4 md:px-8 pt-12 pb-24 max-w-lg mx-auto">
        {/* SVG Journey Path */}
        <svg className="absolute left-1/2 -translate-x-1/2 top-0 w-full h-full pointer-events-none z-0 overflow-visible opacity-20">
          <motion.path
            d={`M 0 50 ${milestones
              .map(
                (_, i) =>
                  `Q ${i % 2 === 0 ? 100 : -100} ${150 + i * 200}, 0 ${
                    250 + i * 200
                  }`,
              )
              .join(" ")}`}
            fill="none"
            stroke="url(#pathGradient)"
            strokeWidth="4"
            strokeDasharray="12 12"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3, ease: "easeInOut" }}
          />
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>

        <div className="relative z-10 flex flex-col items-center">
          {milestones.map((milestone, index) => (
            <MilestoneNode
              key={milestone.level}
              index={index}
              level={milestone.level}
              reward={milestone.reward}
              isUnlocked={currentLevel >= milestone.level}
              isCurrent={nextMilestone.level === milestone.level}
            />
          ))}

          {/* Epic Final Node */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="mt-12 p-8 glassmorphism-dark rounded-[1.5rem] border border-gold/30 text-center relative overflow-hidden group shadow-[0_0_50px_rgba(255,215,0,0.1)]"
          >
            <div className="absolute inset-0 bg-gold/5 blur-3xl" />
            <Trophy className="w-12 h-12 text-gold mx-auto mb-4 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
            <h2 className="text-2xl font-black font-['Orbitron'] italic tracking-tighter text-white mb-2 uppercase">
              The Sovereign Peak
            </h2>
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest max-w-[200px] mx-auto">
              Your legend will be inscribed in the Ahmedabad Archives.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HeroJourney;
