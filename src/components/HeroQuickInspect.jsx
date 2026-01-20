import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { X, Award } from "lucide-react";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../backend/firebaseConfig";
import HeroCardGenerator from "./HeroCardGenerator";

const HeroQuickInspect = ({ hero, onClose }) => {
  const [enrichedHero, setEnrichedHero] = useState(hero);
  const [loading, setLoading] = useState(true);

  // Fetch userStats to get feedbackCounts and questsCompleted
  useEffect(() => {
    const fetchStats = async () => {
      if (!hero?.id) {
        setLoading(false);
        return;
      }

      try {
        const statsRef = doc(db, "userStats", hero.id);
        const statsSnap = await getDoc(statsRef);

        if (statsSnap.exists()) {
          const rawStatsData = statsSnap.data();

          // ✅ Transform flat "feedbackCounts.X" keys into nested object (like AuthContext)
          const feedbackCounts = {};
          const statsData = { ...rawStatsData };

          Object.keys(statsData).forEach((key) => {
            if (key.startsWith("feedbackCounts.")) {
              const tagName = key.replace("feedbackCounts.", "");
              feedbackCounts[tagName] = statsData[key];
              delete statsData[key];
            }
          });

          // Add nested feedbackCounts object if we found any
          if (Object.keys(feedbackCounts).length > 0) {
            statsData.feedbackCounts = feedbackCounts;
          }

          // Merge stats into hero data (stats take priority)
          setEnrichedHero({
            ...hero,
            ...statsData,
          });
        } else {
          setEnrichedHero(hero);
        }
      } catch (err) {
        console.warn("Failed to fetch user stats for popup:", err);
        setEnrichedHero(hero);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [hero]);

  if (!hero) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative w-full max-w-[420px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white/80 hover:text-white transition-all border border-white/10 group active:scale-95 backdrop-blur-md"
        >
          <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
        </button>

        {/* Hero Card Container */}
        <div className="flex flex-col items-center">
          {loading ? (
            <div className="w-full h-96 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <HeroCardGenerator user={enrichedHero} showActions={false} />
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
};

export default HeroQuickInspect;
