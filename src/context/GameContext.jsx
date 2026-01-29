import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import {
  // We will deal with this later
  subscribeToQuest,
} from "../backend/firebaseService"; // ❌ Removed firebaseJoin import
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db, auth } from "../backend/firebaseConfig";
import toast from "react-hot-toast";
import { trackRead } from "../utils/firestoreMonitor"; // ✅ ADD TRACKING

const GameContext = createContext({
  city: "",
  selectCity: () => console.warn("GameProvider not found"),
  joinedQuests: [],
  joinQuest: () => {},
  leaveQuest: () => {},
  isJoined: () => false,
  gameLoading: true,
});

export const GameProvider = ({ children }) => {
  const { user } = useAuth();
  const [city, setCity] = useState(localStorage.getItem("selectedCity") || "");
  const [joinedQuests, setJoinedQuests] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [equippedFrame, setEquippedFrame] = useState(null);
  const [gameLoading, setGameLoading] = useState(true);

  console.log("🎮 GameProvider Rendering...");

  useEffect(() => {
    localStorage.setItem("selectedCity", city);
  }, [city]);

  // Sync joined quests from user profile
  useEffect(() => {
    if (!user?.uid) {
      setJoinedQuests([]);
      setGameLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      (docSnap) => {
        trackRead("GameContext.joinedQuests"); // ✅ TRACK READ
        if (docSnap.exists()) {
          const data = docSnap.data();

          // Debug: See exactly what fields exist
          console.log("🔥 [GameContext] Raw Firestore Data:", data);

          setJoinedQuests(data.joinedQuests || []); // ✅ Reads from subcollection or map
          setCity(data.city || ""); // ✅ Sync City
          
          // 🛡️ BULLETPROOF MERGE LOGIC 🛡️

          // 1. Check Standard Nested Map: inventory { frames: [...] }
          const mapFrames = Array.isArray(data.inventory?.frames) ? data.inventory.frames : [];

          // 2. Get frames from Root (e.g., data.frames)
          const rootFrames = Array.isArray(data.frames) ? data.frames : [];

         // 3. Check "Dot Notation" String Key: "inventory.frames" [...]
          // (Sometimes Firestore saves fields with dots as literal keys)
          const dotFrames = Array.isArray(data["inventory.frames"]) ? data["inventory.frames"] : [];

          // 4. Merge ALL sources and remove duplicates
          const allFrames = [...new Set([
            ...mapFrames, 
            ...rootFrames, 
            ...dotFrames
          ])];

          console.log("✅ [GameContext] Merged Frames:", allFrames);

         // 5. Update State with the merged list
          setInventory({
            ...data.inventory,  // Keep other inventory items like badges
            frames: allFrames   // Overwrite frames with the complete list
          }); // ✅ Extract inventory
          setEquippedFrame(data.equippedFrame || null); // ✅ Extract equippedFrame
        }
        setGameLoading(false);
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

  // ✅ MEMOIZED: Prevents function recreation on every render
  const selectCity = useCallback(
    async (cityName) => {
      // ✅ FIX: Only update if city actually changed
      if (city === cityName) return;

      setCity(cityName);
      if (user?.uid) {
        try {
          const userRef = doc(db, "users", user.uid);
          // Only write to Firestore if value changed
          await updateDoc(userRef, { city: cityName });
        } catch (err) {
          console.warn("City sync failed:", err);
        }
      }
    },
    [city, user?.uid],
  );

  // ✅ MEMOIZED: Quest membership check - MUST be defined BEFORE joinQuest
  const isJoined = useCallback(
    (questId) => {
      // Handle both array format and map/subcollection format
      if (Array.isArray(joinedQuests)) {
        return joinedQuests.includes(questId);
      }
      // If joinedQuests is an object (map), check for key existence
      return !!joinedQuests[questId];
    },
    [joinedQuests],
  );

  // ✅ MEMOIZED: Equip a cosmetic frame
  const equipFrame = useCallback(
    async (frameId) => {
      if (!user?.uid) return;

      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { equippedFrame: frameId });
        toast.success("Frame equipped! 🎨");
      } catch (err) {
        console.error("Failed to equip frame:", err);
        toast.error("Failed to equip frame");
      }
    },
    [user?.uid],
  );

  // ✅ SECURITY UPGRADE: Call the Node.js API instead of Firebase directly
  // ✅ MEMOIZED: Prevents function recreation on every render
  const joinQuest = useCallback(
    async (questId, secretCode = "") => {
      if (!user) return;

      // Optimistic UI check (optional)
      if (isJoined(questId)) {
        toast("You are already in this squad!", { icon: "🫡" });
        return;
      }

      const loadingToast = toast.loading("Joining Squad...");

      try {
        // 1. Get the Security Token (The ID Card)
        if (!auth.currentUser) throw new Error("User not authenticated");
        const token = await auth.currentUser.getIdToken();

        // 2. Call the Police (Your Backend API)
        // Replace with your actual backend URL if not using a proxy
        const response = await fetch("http://localhost:5000/api/quest/join", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // 🔒 CRITICAL
          },
          body: JSON.stringify({
            questId,
            secretCode,
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
    },
    [user, isJoined],
  );

  // ⚠️ WARNING: If you applied strict rules, 'leaveQuest' might also break
  // if it uses updateDoc in firebaseService.
  // For now, we assume you haven't locked down 'leave' yet.
  // ✅ MEMOIZED: Prevents function recreation on every render
  const leaveQuest = useCallback(
    async (questId) => {
      if (!user) return;

      // Optimistic UI: Don't wait for server to remove from list visually?
      // Better to wait for confirmation to show the penalty toast correctly.

      const loadingToast = toast.loading("Processing...");

      try {
        if (!auth.currentUser) throw new Error("User not authenticated");
        const token = await auth.currentUser.getIdToken();

        const response = await fetch("http://localhost:5000/api/quest/leave", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ questId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to leave quest");
        }

        // Handle Success & Penalties
        if (data.xpPenalty > 0) {
          toast.error(
            `Left Quest. Penalty: -${data.xpPenalty} XP & Reputation Drop`,
            {
              id: loadingToast,
              icon: "📉",
              duration: 5000,
            },
          );
        } else {
          toast.success("Left Quest Successfully", {
            id: loadingToast,
            icon: "👋",
          });
        }
      } catch (error) {
        console.error("Failed to leave quest:", error);
        toast.error(error.message || "Failed to leave", { id: loadingToast });
      }
    },
    [user],
  );

  // ✅ MEMOIZED: Wrap provider value to prevent object recreation on every render
  const contextValue = useMemo(
    () => ({
      city,
      selectCity,
      joinedQuests,
      joinQuest,
      leaveQuest,
      isJoined,
      gameLoading,
      inventory,
      equippedFrame,
      equipFrame,
    }),
    [
      city,
      selectCity,
      joinedQuests,
      joinQuest,
      leaveQuest,
      isJoined,
      gameLoading,
      inventory,
      equippedFrame,
      equipFrame,
    ],
  );

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
