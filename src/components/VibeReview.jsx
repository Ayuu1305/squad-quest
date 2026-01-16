import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { users } from "../data/users";
import {
  Star,
  Heart,
  MessageSquare,
  Award,
  Zap,
  ChevronRight,
  Crown,
} from "lucide-react";

const VibeReview = ({ squad, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviews, setReviews] = useState({});
  const [animations, setAnimations] = useState([]); // Array for floating XP particles
  const currentHero = squad && squad.length > 0 ? squad[currentIndex] : null;

  if (!currentHero) return null;

  const vibetags = [
    { id: "storyteller", label: "Great Storyteller", icon: "🎭" },
    { id: "listener", label: "Good Listener", icon: "👂" },
    { id: "funny", label: "Funny", icon: "😄" },
    { id: "leader", label: "Leader", icon: "👑" },
    { id: "teamplayer", label: "Team Player", icon: "🤝" },
    { id: "intellectual", label: "Intellectual", icon: "🧠" },
  ];

  const currentHeroTags = reviews[currentHero.id] || [];
  const tagCount = currentHeroTags.length;

  const toggleTag = (heroId, tagId, event) => {
    const heroReviews = reviews[heroId] || [];
    const isAdding = !heroReviews.includes(tagId);

    if (isAdding) {
      // Trigger floating XP animation
      const rect = event.currentTarget.getBoundingClientRect();
      const newAnim = {
        id: Date.now(),
        x: rect.left + rect.width / 2,
        y: rect.top,
      };
      setAnimations((prev) => [...prev, newAnim]);
      setTimeout(() => {
        setAnimations((prev) => prev.filter((a) => a.id !== newAnim.id));
      }, 1000);

      setReviews({ ...reviews, [heroId]: [...heroReviews, tagId] });
    } else {
      setReviews({
        ...reviews,
        [heroId]: heroReviews.filter((t) => t !== tagId),
      });
    }
  };

  const nextHero = () => {
    if (currentIndex < squad.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete(reviews);
    }
  };

  return (
    <div className="w-full max-w-sm relative">
      {/* Floating XP Animations */}
      <AnimatePresence>
        {animations.map((anim) => (
          <motion.div
            key={anim.id}
            initial={{ opacity: 0, y: anim.y, x: anim.x }}
            animate={{
              opacity: 1,
              y: anim.y - 100,
              x: anim.x + (Math.random() * 40 - 20),
            }}
            exit={{ opacity: 0 }}
            className="fixed z-[100] pointer-events-none text-neon-purple font-black text-xl italic"
          >
            +5 XP
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentHero.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="glassmorphism-dark rounded-3xl p-6 border border-white/10"
        >
          {/* Hero Profile to Rate */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              <img
                src={currentHero.avatar}
                className="w-24 h-24 rounded-full border-4 border-neon-purple mx-auto shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                alt=""
              />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-neon-purple px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                Level {currentHero.level}
              </div>
            </div>
            <h2 className="text-2xl font-black font-['Orbitron'] italic tracking-tighter">
              {currentHero.name}
            </h2>
            <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest font-bold">
              Rate Hero's Tactical Vibe
            </p>
          </div>

          {/* Vibe Tags Grid */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {vibetags.map((tag) => (
              <button
                key={tag.id}
                onClick={(e) => toggleTag(currentHero.id, tag.id, e)}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
                  currentHeroTags.includes(tag.id)
                    ? "bg-neon-purple/20 border-neon-purple text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                    : "glassmorphism border-white/5 text-gray-400 hover:border-white/20"
                }`}
              >
                <span className="text-lg group-hover:scale-125 transition-transform">
                  {tag.icon}
                </span>
                <span className="text-[9px] font-black uppercase tracking-tight">
                  {tag.label}
                </span>
              </button>
            ))}
          </div>

          {/* Progress & Next */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex gap-1.5">
              {squad.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === currentIndex
                      ? "w-6 bg-neon-purple shadow-[0_0_10px_#a855f7]"
                      : i < currentIndex
                      ? "w-2 bg-green-500"
                      : "w-2 bg-white/10"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={nextHero}
              style={{
                boxShadow:
                  tagCount > 0
                    ? `0 0 ${tagCount * 10}px rgba(168, 85, 247, ${
                        0.2 + tagCount * 0.1
                      })`
                    : "none",
              }}
              className={`flex items-center gap-2 px-6 py-4 bg-neon-purple rounded-xl font-black italic tracking-widest text-xs uppercase transition-all duration-500 group ${
                tagCount > 0 ? "scale-105" : "opacity-70"
              }`}
            >
              {currentIndex === squad.length - 1
                ? "Finalize Loot"
                : "Next Hero"}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">
        <Award className="w-3 h-3 text-neon-purple animate-pulse" />
        Vibe check grants +5 XP per tag to current hero
      </div>
    </div>
  );
};

export default VibeReview;
