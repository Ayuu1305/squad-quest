import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { X, Award } from "lucide-react";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../backend/firebaseConfig";
import HeroCardGenerator from "./HeroCardGenerator";
import { useAuth } from "../context/AuthContext"; // ✅ Need to check if viewing self

const HeroQuickInspect = ({ hero, onClose }) => {
  const { user: currentUser } = useAuth(); // ✅ Get current logged-in user
  const [enrichedHero, setEnrichedHero] = useState(hero);
  const [loading, setLoading] = useState(true);

  // Fetch userStats ONLY for yourself (private data) OR use public data for others
  useEffect(() => {
    const fetchStats = async () => {
      if (!hero?.id) {
        setLoading(false);
        return;
      }

      // ✅ PERMISSION FIX: Only fetch private userStats if viewing YOURSELF
      const isViewingSelf = currentUser?.uid === hero.id;

      if (!isViewingSelf) {
        // ✅ Viewing someone else - Use PUBLIC data from hero prop
        // This includes badges that have been synced to users collection via AuthContext
        console.log(
          `📖 [HeroQuickInspect] Viewing ${hero.name} - Using public data (no fetch)`,
        );

        // ✅ CRITICAL FIX: Transform flat feedbackCounts keys into nested object
        // The users collection stores "feedbackCounts.funny: 6" but HeroCardGenerator expects nested
        const feedbackCounts = {};
        const transformedHero = { ...hero };

        Object.keys(transformedHero).forEach((key) => {
          if (key.startsWith("feedbackCounts.")) {
            const tagName = key.replace("feedbackCounts.", "");
            feedbackCounts[tagName] = transformedHero[key];
            delete transformedHero[key]; // Remove flat key
          }
        });

        // Add nested feedbackCounts object if we found any
        if (Object.keys(feedbackCounts).length > 0) {
          transformedHero.feedbackCounts = feedbackCounts;
        }

        console.log(`📊 [HeroQuickInspect] Transformed public data:`, {
          badges: transformedHero.badges?.length || 0,
          feedbackCounts: Object.keys(transformedHero.feedbackCounts || {})
            .length,
        });

        setEnrichedHero(transformedHero);
        setLoading(false);
        return;
      }

      // ✅ Viewing yourself - Fetch PRIVATE stats from userStats
      try {
        console.log(
          `🔒 [HeroQuickInspect] Viewing yourself - Fetching private stats`,
        );
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

          // ✅ DEBUG: Log badges being fetched (only for self)
          console.log(`📊 [HeroQuickInspect] Fetched private stats:`, {
            badges: statsData.badges?.length || 0,
            feedbackCounts: Object.keys(statsData.feedbackCounts || {}).length,
          });

          // ✅ Merge private stats into hero data - stats OVERRIDE hero data
          setEnrichedHero({
            ...hero,
            ...statsData, // Private stats take priority (includes real badges)
            // Explicit overrides to ensure key fields are from stats
            badges: statsData.badges || hero.badges || [],
            feedbackCounts:
              statsData.feedbackCounts || hero.feedbackCounts || {},
          });
        } else {
          console.log(`⚠️ [HeroQuickInspect] No userStats found for yourself`);
          setEnrichedHero(hero);
        }
      } catch (err) {
        console.warn("Failed to fetch your private stats:", err);
        setEnrichedHero(hero); // Fallback to public data
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [hero?.id, currentUser?.uid]); // ✅ ZERO-LOOP: Watch primitives only

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
