import { motion } from "framer-motion";
import { Sword, Camera, Trophy, Zap, MapPin, Users } from "lucide-react";

const ProfileOverview = () => {
  const sections = [
    {
      icon: Sword,
      title: "The Mission",
      subtitle: "Join a Squad",
      description:
        "Browse quests, join a squad, and meet real people in Ahmedabad.",
      color: "neon-purple",
      steps: [
        { icon: MapPin, text: "Pick a quest at a local hub" },
        { icon: Users, text: "Squad up with 2-5 heroes" },
        { icon: Zap, text: "Meet in real life" },
      ],
    },
    {
      icon: Camera,
      title: "Verification",
      subtitle: "Prove Your Arrival",
      description: "Complete 3-layer verification to clear the mission.",
      color: "cyan",
      steps: [
        { icon: MapPin, text: "GPS: Verify you're at the hub" },
        { icon: Sword, text: "Secret Code: Unlock the protocol" },
        { icon: Camera, text: "Photo: Upload loot proof" },
      ],
    },
    {
      icon: Trophy,
      title: "Rewards",
      subtitle: "Rank Up",
      description: "Earn XP, level up, and unlock exclusive badges.",
      color: "yellow",
      steps: [
        { icon: Zap, text: "Gain XP for completed quests" },
        { icon: Trophy, text: "Unlock badges via feedback" },
        { icon: Sword, text: "Rise through the ranks" },
      ],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full space-y-6 px-4 sm:px-0"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-['Orbitron'] font-black text-white uppercase tracking-tighter mb-2">
          How to Play
        </h2>
        <p className="text-sm text-gray-400 font-mono uppercase tracking-wide">
          Your Guide to Squad Quest
        </p>
      </div>

      {/* Mission Steps */}
      <div className="space-y-6">
        {sections.map((section, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glassmorphism-dark rounded-3xl p-6 border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all"
          >
            {/* Background Glow */}
            <div
              className={`absolute -top-10 -right-10 w-40 h-40 bg-${section.color}-500/10 blur-[60px] rounded-full pointer-events-none`}
            />

            <div className="relative z-10">
              {/* Icon + Title */}
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-${section.color}-500/20 border border-${section.color}-500/30 flex items-center justify-center`}
                >
                  <section.icon
                    className={`w-6 h-6 text-${section.color}-400`}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-black font-['Orbitron'] text-white uppercase tracking-tighter">
                    {section.title}
                  </h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                    {section.subtitle}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-400 mb-4 font-mono">
                {section.description}
              </p>

              {/* Steps */}
              <div className="space-y-2">
                {section.steps.map((step, stepIdx) => (
                  <div
                    key={stepIdx}
                    className="flex items-center gap-3 text-sm text-gray-300"
                  >
                    <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                      <step.icon className="w-3 h-3 text-neon-purple" />
                    </div>
                    <span className="font-mono text-xs">{step.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="p-6 bg-neon-purple/10 border border-neon-purple/30 rounded-2xl text-center">
        <p className="text-sm font-bold text-white mb-1">Ready to start?</p>
        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
          Head to the Quest Board and join your first squad!
        </p>
      </div>
    </motion.div>
  );
};

export default ProfileOverview;
