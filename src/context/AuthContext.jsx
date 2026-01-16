import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../backend/firebaseConfig";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeFirestore = () => {};
    let unsubscribeStats = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        // 1. Subscribe to Public Profile (users/{uid})
        unsubscribeFirestore = onSnapshot(
          doc(db, "users", authUser.uid),
          (docSnap) => {
            const profileData = docSnap.exists() ? docSnap.data() : {};

            // 2. Subscribe to Secure Stats (userStats/{uid})
            unsubscribeStats = onSnapshot(
              doc(db, "userStats", authUser.uid),
              (statsSnap) => {
                const statsData = statsSnap.exists()
                  ? statsSnap.data()
                  : {
                      // Fallback to public profile if secure stats missing (Migration support)
                      xp: profileData.xp || 0,
                      level: profileData.level || 1,
                      reliabilityScore: profileData.reliabilityScore || 100,
                      badges: profileData.badges || [],
                    };

                setUser({
                  ...authUser,
                  ...profileData, // Public info (City, Name, etc.)
                  ...statsData, // Secure info (overrides public if exists)
                });
                setLoading(false);
              },
              (error) => {
                console.warn("Stats Helper (restricted):", error);
                setUser({
                  ...authUser,
                  ...profileData,
                });
                setLoading(false);
              }
            );
          },
          (error) => {
            console.error("User profile listener error:", error);
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        unsubscribeFirestore();
        unsubscribeStats();
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
