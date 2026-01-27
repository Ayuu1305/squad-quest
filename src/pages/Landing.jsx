import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  MapPin,
  ChevronRight,
  Zap,
  Trophy,
  Users,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { useAuth } from "../context/AuthContext";
import { updateHeroProfile } from "../backend/firebaseService";

const Landing = () => {
  const navigate = useNavigate();
  const { city, selectCity } = useGame();
  const { user } = useAuth();
  const [isAnimating, setIsAnimating] = useState(false);

  const cities = [
    { name: "Ahmedabad", status: "Active Sector", heroes: "1.2k", emoji: "🏙️" },
    { name: "Mumbai", status: "Coming Soon", heroes: "0", emoji: "🌊" },
    { name: "Bangalore", status: "Coming Soon", heroes: "0", emoji: "💻" },
  ];

  const handleCitySelect = async (cityName) => {
    if (cityName === "Ahmedabad") {
      try {
        setIsAnimating(true);
        if (user) {
          await updateHeroProfile(user.uid, { city: cityName });
        }
        selectCity(cityName);
        navigate("/board");
      } catch (error) {
        console.error("Failed to update realm:", error);
        setIsAnimating(false);
      }
    }
  };

  return (
    <div className="app-container min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-neon-purple rounded-full"
            initial={{
              opacity: 0,
              x: Math.random() * window.innerWidth,
              y: -20,
            }}
            animate={{
              opacity: [0, 1, 0],
              y: window.innerHeight + 20,
              x: Math.random() * window.innerWidth,
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glassmorphism-dark rounded-2xl p-8 text-center">
          {/* Logo */}
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mb-6"
          >
            <Sparkles className="w-20 h-20 mx-auto text-neon-purple" />
          </motion.div>

          {/* Title */}
          <h1 className="text-5xl font-['Orbitron'] font-bold mb-2 neon-text">
            SQUAD QUEST
          </h1>
          <p className="text-gray-400 mb-8">Where Online Meets Offline</p>

          {/* City Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-neon-purple" />
              <h2 className="text-xl font-semibold">Select Your Realm</h2>
            </div>

            <div className="space-y-3">
              {cities.map((cityOption) => {
                const isLocked = cityOption.status === "Coming Soon";
                return (
                  <motion.button
                    key={cityOption.name}
                    onClick={() =>
                      !isLocked && handleCitySelect(cityOption.name)
                    }
                    disabled={isLocked || isAnimating}
                    className={`w-full p-4 rounded-lg transition-all duration-300 ${
                      isLocked
                        ? "bg-gray-800/50 border border-gray-700 opacity-50 cursor-not-allowed grayscale"
                        : city === cityOption.name
                          ? "bg-neon-purple text-white neon-glow"
                          : "glassmorphism hover:bg-white/20"
                    }`}
                    whileHover={isLocked ? {} : { scale: 1.05 }}
                    whileTap={isLocked ? {} : { scale: 0.95 }}
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{cityOption.emoji}</span>
                      <span className="text-lg font-semibold">
                        {cityOption.name}
                      </span>
                      {isLocked && (
                        <Lock className="w-4 h-4 ml-auto text-gray-500" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Tagline */}
          <p className="text-sm text-gray-500 mt-6">
            Real adventures. Real people. Real XP.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Landing;
