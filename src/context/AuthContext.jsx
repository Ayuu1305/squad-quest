import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "../backend/firebaseConfig";
import { trackRead, trackWrite } from "../utils/firestoreMonitor"; // ✅ ADD TRACKING

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOverloaded, setIsOverloaded] = useState(false); // ✅ Quota exhaustion flag

  // ✅ COMBINER: Merge profile + stats into unified user object
  const user = useMemo(() => {
    if (!profile) return null;
    const merged = {
      ...profile,
      ...stats,
      // 🔥 deep merge inventory to keep both badges (public) and consumables (private)
      inventory: {
        ...(profile?.inventory || {}),
        ...(stats?.inventory || {}),
      },
      // 🔥 CRITICAL: Prioritize private stats for claim logic to prevent flicker
      // If stats has it, use it. Otherwise fall back to profile.
      last_claimed_at: stats?.last_claimed_at || profile?.last_claimed_at,
      daily_streak: stats?.daily_streak ?? profile?.daily_streak,
    };

    // 🔍 DEBUG: Log merged user inventory (expanded)
    console.log(
      "👤 [AuthContext] Merged user inventory:",
      JSON.stringify(
        {
          badges: merged.inventory?.badges,
          frames: merged.inventory?.frames,
          equippedFrame: merged.equippedFrame,
        },
        null,
        2,
      ),
    );

    return merged;
  }, [profile, stats]);

  // ✅ EFFECT 1: Listen to Firebase Auth + Public Profile (users/{uid})
  useEffect(() => {
    let unsubscribeFirestore = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      // Cleanup previous profile listener
      unsubscribeFirestore();
      unsubscribeFirestore = () => {};

      if (authUser) {
        // Subscribe to Public Profile
        unsubscribeFirestore = onSnapshot(
          doc(db, "users", authUser.uid),
          (docSnap) => {
            trackRead("AuthContext.profile"); // ✅ TRACK READ
            const profileData = docSnap.exists() ? docSnap.data() : {};
            setProfile({
              ...authUser,
              ...profileData,
            });
            setLoading(false);
          },
          (error) => {
            if (error?.code === "permission-denied") return;

            // ✅ QUOTA EXHAUSTION DETECTION
            if (error?.code === "resource-exhausted") {
              console.warn(
                "⚠️ [AuthContext] Quota Exceeded. Enabling Maintenance Mode.",
              );
              setIsOverloaded(true);
            }

            console.error("User profile listener error:", error);
            setLoading(false);
          },
        );
      } else {
        setProfile(null);
        setStats(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeFirestore();
    };
  }, []);

  // ✅ EFFECT 2: Listen to Private Stats (userStats/{uid}) - PARALLEL
  useEffect(() => {
    if (!profile?.uid) {
      setStats(null);
      return;
    }

    const unsubscribeStats = onSnapshot(
      doc(db, "userStats", profile.uid),
      (statsSnap) => {
        trackRead("AuthContext.stats"); // ✅ TRACK READ
        const rawStatsData = statsSnap.exists()
          ? statsSnap.data()
          : {
              xp: profile.xp || 0,
              level: profile.level || 1,
              reliabilityScore: profile.reliabilityScore || 100,
              badges: profile.badges || [],
            };

        // 🔍 DEBUG: Log raw inventory data (expanded)
        console.log(
          "📦 [AuthContext] userStats inventory:",
          JSON.stringify(rawStatsData.inventory || {}, null, 2), // 🔥 Log FULL inventory to see neuro_boost
        );

        // ✅ Transform flat "feedbackCounts.X" keys
        const feedbackCounts = {};
        const statsData = { ...rawStatsData };

        Object.keys(statsData).forEach((key) => {
          if (key.startsWith("feedbackCounts.")) {
            const tagName = key.replace("feedbackCounts.", "");
            feedbackCounts[tagName] = statsData[key];
            delete statsData[key];
          }
        });

        if (Object.keys(feedbackCounts).length > 0) {
          statsData.feedbackCounts = feedbackCounts;
        }

        setStats(statsData);
      },
      (error) => {
        if (error?.code === "permission-denied") return;

        // ✅ QUOTA EXHAUSTION DETECTION
        if (error?.code === "resource-exhausted") {
          console.warn(
            "⚠️ [AuthContext] Quota Exceeded. Enabling Maintenance Mode.",
          );
          setIsOverloaded(true);
        }

        console.warn("Stats listener error:", error);
        // Fallback to profile data
        setStats({
          xp: profile.xp || 0,
          level: profile.level || 1,
          reliabilityScore: profile.reliabilityScore || 100,
          badges: profile.badges || [],
        });
      },
    );

    return () => unsubscribeStats();
  }, [profile?.uid]); // Only resubscribe if UID changes

  // ✅ EFFECT 3: Safe Self-Healing Sync (ONLY when stats > profile)
  const lastSyncedXP = useRef(null);

  useEffect(() => {
    if (!profile?.uid || !stats?.xp) return;

    const privateXP = Number(stats.xp) || 0;
    const publicXP = Number(profile.xp) || 0;

    // ✅ BADGES/FRAMES SYNC CHECK: Compare array lengths (primitives) not arrays (objects)
    const badgesMismatch =
      (stats.inventory?.badges?.length || 0) !==
      (profile.inventory?.badges?.length || 0);
    const framesMismatch =
      (stats.inventory?.frames?.length || 0) !==
      (profile.inventory?.frames?.length || 0);
    const equippedFrameMismatch = stats.equippedFrame !== profile.equippedFrame;

    // ✅ CRITICAL FIX: Only sync if truly ahead OR inventory changed AND not already synced
    if (
      (privateXP > publicXP ||
        badgesMismatch ||
        framesMismatch ||
        equippedFrameMismatch) &&
      lastSyncedXP.current !== privateXP
    ) {
      console.log(
        "🔄 [AuthContext] Self-Healing Sync: Updating Public Profile",
        {
          private: privateXP,
          public: publicXP,
          badgesMismatch,
          framesMismatch,
          equippedFrameMismatch,
          statsBadges: stats.inventory?.badges?.length || 0,
          profileBadges: profile.inventory?.badges?.length || 0,
          statsFrames: stats.inventory?.frames?.length || 0,
          profileFrames: profile.inventory?.frames?.length || 0,
        },
      );

      lastSyncedXP.current = privateXP; // ✅ Mark as synced BEFORE writing

      trackWrite("AuthContext.syncProfile"); // ✅ TRACK WRITE
      setDoc(
        doc(db, "users", profile.uid),
        {
          xp: stats.xp,
          level: stats.level,
          reliabilityScore: stats.reliabilityScore,
          questsCompleted: stats.questsCompleted || profile.questsCompleted,
          badges: stats.badges || [], // Legacy field (for old code compatibility)
          "inventory.badges": stats.inventory?.badges || [], // ✅ Shop purchases
          "inventory.frames": stats.inventory?.frames || [], // ✅ Cosmetic purchases
          equippedFrame: stats.equippedFrame || null, // ✅ Active cosmetic
          updatedAt: new Date(),
        },
        { merge: true },
      ).catch((err) => console.error("Sync Failed:", err));
    } else {
      // ✅ CRUCIAL: Log when sync is blocked (proves loop is dead)
      console.log(
        "✅ [AuthContext] SYNC BLOCKED - Values equal or public ahead",
        {
          private: privateXP,
          public: publicXP,
          badgesMismatch,
          framesMismatch,
          equippedFrameMismatch,
          lastSynced: lastSyncedXP.current,
        },
      );
    }
  }, [
    stats?.xp,
    stats?.level,
    stats?.inventory?.badges?.length,
    stats?.inventory?.frames?.length,
    stats?.equippedFrame,
    profile?.xp,
    profile?.uid,
    profile?.inventory?.badges?.length,
    profile?.inventory?.frames?.length,
    profile?.equippedFrame,
  ]); // ✅ ZERO-LOOP PROTOCOL: Use .length primitives, NOT array objects

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser: setProfile,
        loading,
        isOverloaded,
        setIsOverloaded,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
