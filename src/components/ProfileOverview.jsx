import { motion } from "framer-motion";
import {
  Sword,
  Camera,
  Trophy,
  Zap,
  MapPin,
  Users,
  Clock,
  Flame,
  ShieldAlert,
  Gift,
  Sparkles,
  Star,
  Award,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

const ProfileOverview = () => {
  const howToPlaySteps = [
    {
      icon: Sword,
      title: "Step 1: Join a Squad",
      subtitle: "Find People Near You",
      description:
        "Browse meetups at local spots (cafes, gaming zones, sports clubs). Join a group of 2-5 members.",
      color: "purple",
      steps: [
        { icon: MapPin, text: "Pick a venue near you" },
        { icon: Users, text: "Join a group of 2-5 people" },
        { icon: Zap, text: "Meet them in person" },
      ],
    },
    {
      icon: Camera,
      title: "Step 2: Verify Mission",
      subtitle: "Prove You Met Up",
      description:
        "Quick check-in process at the venue to confirm your squad meetup.",
      color: "cyan",
      steps: [
        { icon: MapPin, text: "GPS: Confirm you are at the spot" },
        { icon: Sword, text: "Secret Code: Enter group code" },
        { icon: Camera, text: "Photo: Upload a picture proof" },
      ],
    },
    {
      icon: Trophy,
      title: "Step 3: Earn XP & Badges",
      subtitle: "Level Up Your Profile",
      description:
        "Collect XP, level up your hero rank, and unlock exclusive cosmetic frames and badges.",
      color: "yellow",
      steps: [
        { icon: Zap, text: "Gain XP for completed missions" },
        { icon: Trophy, text: "Unlock badges from squad ratings" },
        { icon: Star, text: "Climb city leaderboards" },
      ],
    },
  ];

  const xpSources = [
    {
      title: "Base Mission Reward",
      xp: "100 XP",
      tag: "STANDARD",
      description: "Earn 100 XP automatically whenever you complete any mission verification.",
      icon: Zap,
      color: "from-purple-500/20 to-purple-900/10",
      border: "border-purple-500/30",
      textColor: "text-purple-400",
    },
    {
      title: "Punctuality Bonus",
      xp: "+25 XP",
      tag: "ON-TIME",
      description: "Complete verification right when the timer hits zero (within 5 mins). Unlocks Early Bird badge!",
      icon: Clock,
      color: "from-emerald-500/20 to-emerald-900/10",
      border: "border-emerald-500/30",
      textColor: "text-emerald-400",
    },
    {
      title: "Photo Proof Bonus",
      xp: "+20 XP",
      tag: "EVIDENCE",
      description: "Upload a real photo proof of your squad at the venue during check-in.",
      icon: Camera,
      color: "from-blue-500/20 to-blue-900/10",
      border: "border-blue-500/30",
      textColor: "text-blue-400",
    },
    {
      title: "Host Bonus",
      xp: "+20 XP",
      tag: "LEADERSHIP",
      description: "Create and lead your own mission for others to join.",
      icon: Award,
      color: "from-amber-500/20 to-amber-900/10",
      border: "border-amber-500/30",
      textColor: "text-amber-400",
    },
    {
      title: "Showdown Sunday",
      xp: "2x XP",
      tag: "SUNDAY 9 PM - 12 AM",
      description: "All XP earned from missions completed during Sunday Showdown (Sunday 9:00 PM to 12:00 Midnight) is doubled automatically!",
      icon: Flame,
      color: "from-pink-500/20 to-pink-900/10",
      border: "border-pink-500/30",
      textColor: "text-pink-400",
    },
    {
      title: "Daily Bounty Streak",
      xp: "Up to 150 XP",
      tag: "DAILY LOG-IN",
      description: "Claim daily bounty. Streak grows +5% every day (up to 150 XP max). Use Neuro-Boost in shop for 2x XP!",
      icon: Gift,
      color: "from-cyan-500/20 to-cyan-900/10",
      border: "border-cyan-500/30",
      textColor: "text-cyan-400",
    },
    {
      title: "Squad Vibe Check",
      xp: "+50 XP / +5 XP",
      tag: "FEEDBACK",
      description: "Earn +50 XP for rating squadmates after a mission. Earn +5 XP for every positive compliment tag you receive!",
      icon: Sparkles,
      color: "from-violet-500/20 to-violet-900/10",
      border: "border-violet-500/30",
      textColor: "text-violet-400",
    },
  ];

  const levelUnlocks = [
    { threat: "Threat Level 1", level: "Level 1+", title: "Common", desc: "Open to anyone" },
    { threat: "Threat Level 2", level: "Level 10+", title: "Uncommon", desc: "Requires Level 10+" },
    { threat: "Threat Level 3", level: "Level 25+", title: "Rare", desc: "Requires Level 25+" },
    { threat: "Threat Level 4", level: "Level 40+", title: "Epic", desc: "Requires Level 40+" },
    { threat: "Threat Level 5", level: "Level 50+", title: "Legendary", desc: "Requires Level 50+" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full space-y-10 px-4 sm:px-0 pb-10"
    >
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-['Orbitron'] font-black text-white uppercase tracking-tighter mb-2">
          How to Play & Earn XP
        </h2>
        <p className="text-sm text-gray-400 font-mono uppercase tracking-wide">
          Your Complete Guide to Squad Quest Rules & Rewards
        </p>
      </div>

      {/* SECTION 1: How to Play (3 Steps) */}
      <div className="space-y-4">
        <h3 className="text-lg font-['Orbitron'] font-bold text-white uppercase tracking-wide flex items-center gap-2">
          <Sword className="w-5 h-5 text-neon-purple" />
          1. Mission Guide
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {howToPlaySteps.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glassmorphism-dark rounded-3xl p-6 border border-white/10 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                    <section.icon className="w-5 h-5 text-neon-purple" />
                  </div>
                  <div>
                    <h4 className="text-base font-black font-['Orbitron'] text-white uppercase tracking-tighter">
                      {section.title}
                    </h4>
                    <p className="text-[9px] text-gray-400 font-mono uppercase">
                      {section.subtitle}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-400 mb-4 font-mono leading-relaxed">
                  {section.description}
                </p>

                <div className="space-y-2">
                  {section.steps.map((step, stepIdx) => (
                    <div
                      key={stepIdx}
                      className="flex items-center gap-2.5 text-xs text-gray-300"
                    >
                      <div className="w-4 h-4 rounded-full bg-neon-purple/20 flex items-center justify-center shrink-0">
                        <step.icon className="w-2.5 h-2.5 text-neon-purple" />
                      </div>
                      <span className="font-mono text-[11px] text-gray-300">
                        {step.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* SECTION 2: XP Guide (How to earn more XP) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-['Orbitron'] font-bold text-white uppercase tracking-wide flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            2. How to Earn XP & Multipliers
          </h3>
          <span className="text-[10px] font-mono bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 px-2.5 py-1 rounded-full uppercase">
            XP Breakdown
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {xpSources.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-gradient-to-br ${item.color} rounded-2xl p-5 border ${item.border} backdrop-blur-md relative overflow-hidden flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                    <item.icon className={`w-5 h-5 ${item.textColor}`} />
                  </div>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 text-gray-300 border border-white/10">
                    {item.tag}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mb-1 font-['Orbitron']">
                  {item.title}
                </h4>

                <div className={`text-xl font-black font-mono mb-2 ${item.textColor}`}>
                  {item.xp}
                </div>

                <p className="text-xs text-gray-300 font-mono leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* SECTION 3: Mission Threat Level & Unlock Requirements */}
      <div className="space-y-4">
        <h3 className="text-lg font-['Orbitron'] font-bold text-white uppercase tracking-wide flex items-center gap-2">
          <Trophy className="w-5 h-5 text-purple-400" />
          3. Mission Threat Levels & Level Requirements
        </h3>

        <div className="glassmorphism-dark rounded-2xl p-5 border border-white/10">
          <p className="text-xs text-gray-300 font-mono mb-4 leading-relaxed">
            When creating or joining a mission, host selects a <strong className="text-neon-purple">Threat Level (1 to 5)</strong>. Threat Level sets the minimum player level required to join that quest:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {levelUnlocks.map((lvl, idx) => (
              <div
                key={idx}
                className="bg-black/40 p-3.5 rounded-xl border border-white/10 text-center flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold text-gray-400 block mb-1 uppercase tracking-wider">
                    {lvl.threat}
                  </span>
                  <span className="text-sm font-black font-['Orbitron'] text-neon-purple block mb-1">
                    {lvl.title}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-white/5">
                  <span className="text-xs font-mono font-bold text-white block">
                    {lvl.level}
                  </span>
                  <span className="text-[9px] text-gray-400 font-mono block mt-0.5">
                    {lvl.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 4: Fair Play & Rules */}
      <div className="space-y-4">
        <h3 className="text-lg font-['Orbitron'] font-bold text-white uppercase tracking-wide flex items-center gap-2 text-red-400">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          4. Rules & Fair Play Penalties
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <h4 className="text-sm font-bold text-white font-['Orbitron'] uppercase">
                Leaving Last Minute (-50 XP)
              </h4>
            </div>
            <p className="text-xs text-gray-300 font-mono leading-relaxed">
              Leaving a joined mission less than 1 hour before start time result in a penalty of <strong className="text-red-400">-50 XP</strong> and <strong className="text-red-400">-5 Reliability Score</strong> to prevent flaking.
            </p>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h4 className="text-sm font-bold text-white font-['Orbitron'] uppercase">
                Misrepresentation (-500 XP & Ban)
              </h4>
            </div>
            <p className="text-xs text-gray-300 font-mono leading-relaxed">
              Creating fake profiles or misrepresenting your identity leads to safety reports. 1st strike: -500 XP. 2nd strike: -500 XP & 7-day ban. 3rd strike: Permanent Ban.
            </p>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="p-6 bg-neon-purple/10 border border-neon-purple/30 rounded-2xl text-center">
        <p className="text-sm font-bold text-white mb-1 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" /> Ready to complete your next mission?
        </p>
        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
          Head over to the Quests tab to find meetups near you!
        </p>
      </div>
    </motion.div>
  );
};

export default ProfileOverview;

