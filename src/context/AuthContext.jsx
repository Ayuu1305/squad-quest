import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "../backend/firebaseConfig";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeFirestore = () => {};
    let unsubscribeStats = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      // ✅ IMMEDIATE CLEANUP
      unsubscribeFirestore();
      unsubscribeStats();
      unsubscribeFirestore = () => {};
      unsubscribeStats = () => {};

      if (authUser) {
        // 1. Subscribe to Public Profile (users/{uid})
        unsubscribeFirestore = onSnapshot(
          doc(db, "users", authUser.uid),
          (docSnap) => {
            const profileData = docSnap.exists() ? docSnap.data() : {};

            // 2. Subscribe to Secure Stats (userStats/{uid})
            unsubscribeStats();
            unsubscribeStats = onSnapshot(
              doc(db, "userStats", authUser.uid),
              (statsSnap) => {
                const rawStatsData = statsSnap.exists()
                  ? statsSnap.data()
                  : {
                      xp: profileData.xp || 0,
                      level: profileData.level || 1,
                      reliabilityScore: profileData.reliabilityScore || 100,
                      badges: profileData.badges || [],
                    };

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

                // 🔄 SELF-HEALING SYNC: If private stats are ahead, update public profile
                // This fixes Leaderboard vs Profile mismatches caused by legacy data
                const privateXP = statsData.xp || 0;
                const publicXP = profileData.xp || 0;

                if (privateXP > publicXP) {
                  console.log(
                    "🔄 [AuthContext] Syncing Public Profile with Private Stats...",
                    {
                      private: privateXP,
                      public: publicXP,
                    },
                  );
                  setDoc(
                    doc(db, "users", authUser.uid),
                    {
                      xp: statsData.xp,
                      level: statsData.level,
                      reliabilityScore: statsData.reliabilityScore,
                      questsCompleted:
                        statsData.questsCompleted ||
                        profileData.questsCompleted,
                      updatedAt: statsData.updatedAt || new Date(),
                    },
                    { merge: true },
                  ).catch((err) => console.error("Sync Failed:", err));
                }

                setUser({
                  ...authUser,
                  ...profileData,
                  ...statsData,
                });
                setLoading(false);
              },
              (error) => {
                // ✅ Ignore permission-denied during logout
                if (error?.code === "permission-denied") return;
                console.warn("Stats Helper (restricted):", error);
                setUser({
                  ...authUser,
                  ...profileData,
                });
                setLoading(false);
              },
            );
          },
          (error) => {
            // ✅ Ignore permission-denied during logout
            if (error?.code === "permission-denied") return;
            console.error("User profile listener error:", error);
            setLoading(false);
          },
        );
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeFirestore();
      unsubscribeStats();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
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
