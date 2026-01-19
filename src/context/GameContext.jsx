import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { // We will deal with this later
  subscribeToQuest,
} from "../backend/firebaseService"; // ❌ Removed firebaseJoin import
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../backend/firebaseConfig";
import toast from "react-hot-toast";

const GameContext = createContext({
  city: "",
  selectCity: () => console.warn("GameProvider not found"),
  joinedQuests: [],
  joinQuest: () => {},
  leaveQuest: () => {},
  isJoined: () => false,
});

export const GameProvider = ({ children }) => {
  const { user } = useAuth();
  const [city, setCity] = useState(localStorage.getItem("selectedCity") || "");
  const [joinedQuests, setJoinedQuests] = useState([]);

  console.log("🎮 GameProvider Rendering...");

  useEffect(() => {
    localStorage.setItem("selectedCity", city);
  }, [city]);

  // Sync joined quests from user profile
  useEffect(() => {
    if (!user?.uid) {
      setJoinedQuests([]);
      return;
    }

    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          setJoinedQuests(docSnap.data().joinedQuests || []); // ✅ Reads from subcollection or map
        }
      },
      (error) => {
        if (error?.code === "permission-denied") return;
        if (
          error?.message?.includes("ERR_BLOCKED") ||
          error?.code === "unavailable"
        ) {
          console.warn(
            "⚠️ GameContext: Connection blocked. If using an ad-blocker, try disabling it.",
          );
        } else {
          console.error("GameContext: User listener error:", error);
        }
      },
    );

    return () => unsub();
  }, [user?.uid]);

  const selectCity = async (cityName) => {
    setCity(cityName);
    if (user?.uid) {
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { city: cityName });
      } catch (err) {
        console.warn("City sync failed:", err);
      }
    }
  };

  // ✅ SECURITY UPGRADE: Call the Node.js API instead of Firebase directly
  const joinQuest = async (questId, secretCode = "") => {
    if (!user) return;
    
    // Optimistic UI check (optional)
    if (isJoined(questId)) {
        toast("You are already in this squad!", { icon: "🫡" });
        return;
    }

    const loadingToast = toast.loading("Joining Squad...");

    try {
      // 1. Get the Security Token (The ID Card)
      const token = await user.getIdToken();

      // 2. Call the Police (Your Backend API)
      // Replace with your actual backend URL if not using a proxy
      const response = await fetch("http://localhost:5000/api/quest/join", { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // 🔒 CRITICAL
        },
        body: JSON.stringify({ 
            questId,
            secretCode 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join quest");
      }

      toast.success("Squad Joined! 🚀", { id: loadingToast });
      
      // Note: No need to update state manually. 
      // The backend updates Firestore -> The onSnapshot above sees the change -> React re-renders.
      
    } catch (error) {
      console.error("Failed to join quest:", error);
      toast.error(error.message, { id: loadingToast });
    }
  };

  // ⚠️ WARNING: If you applied strict rules, 'leaveQuest' might also break 
  // if it uses updateDoc in firebaseService. 
  // For now, we assume you haven't locked down 'leave' yet.
 const leaveQuest = async (questId) => {
    if (!user) return;
    
    // Optimistic UI: Don't wait for server to remove from list visually? 
    // Better to wait for confirmation to show the penalty toast correctly.
    
    const loadingToast = toast.loading("Processing...");

    try {
      const token = await user.getIdToken();

      const response = await fetch("http://localhost:5000/api/quest/leave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ questId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to leave quest");
      }

      // Handle Success & Penalties
      if (data.xpPenalty > 0) {
        toast.error(`Left Quest. Penalty: -${data.xpPenalty} XP & Reputation Drop`, {
            id: loadingToast,
            icon: "📉",
            duration: 5000
        });
      } else {
        toast.success("Left Quest Successfully", { 
            id: loadingToast,
            icon: "👋" 
        });
      }

    } catch (error) {
      console.error("Failed to leave quest:", error);
      toast.error(error.message || "Failed to leave", { id: loadingToast });
    }
  };

  const isJoined = (questId) => {
      // Handle both array format and map/subcollection format
      if (Array.isArray(joinedQuests)) {
          return joinedQuests.includes(questId);
      }
      // If joinedQuests is an object (map), check for key existence
      return !!joinedQuests[questId];
  };

  return (
    <GameContext.Provider
      value={{
        city,
        selectCity,
        joinedQuests,
        joinQuest,
        leaveQuest,
        isJoined,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};