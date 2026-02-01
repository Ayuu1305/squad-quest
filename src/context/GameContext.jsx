import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext"; // ✅ IMPORT AUTH
import { loadFirebase } from "../backend/firebase.lazy";
import toast from "react-hot-toast";
// ❌ REMOVED: import { onSnapshot } ... (This was the double billing source)
// ❌ REMOVED: import { trackRead } ... (No longer needed since we don't read DB here)

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
  // ✅ OPTIMIZATION 1: Get 'user' from AuthContext.
  // AuthContext has already paid for the read, so we get the data for FREE here.
  const { user } = useAuth();

  const [city, setCity] = useState(localStorage.getItem("selectedCity") || "");
  const [joinedQuests, setJoinedQuests] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [equippedFrame, setEquippedFrame] = useState(null);
  const [gameLoading, setGameLoading] = useState(true);
  // ✅ DEFINE API URL: Uses your .env variable, or falls back to localhost for dev
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  console.log("🎮 GameProvider Rendering...");

  useEffect(() => {
    localStorage.setItem("selectedCity", city);
  }, [city]);

  // ✅ OPTIMIZATION 2: REPLACED THE HUGE 'onSnapshot' BLOCK
  // Instead of opening a NEW connection to Firebase, we just watch the 'user' object.
  // When AuthContext updates 'user', this runs automatically.
  useEffect(() => {
    if (!user) {
      setJoinedQuests([]);
      setInventory(null);
      setGameLoading(false);
      return;
    }

    // 1. Sync Basic Data directly from the Auth user object
    setJoinedQuests(user.joinedQuests || []);
    setCity(user.city || "");
    setEquippedFrame(user.equippedFrame || null);

    // 🛡️ BULLETPROOF MERGE LOGIC (PRESERVED) 🛡️
    // We run the exact same logic, but on the 'user' object instead of 'docSnap.data()'

    // A. Check Standard Nested Map
    const mapFrames = Array.isArray(user.inventory?.frames)
      ? user.inventory.frames
      : [];

    // B. Get frames from Root
    const rootFrames = Array.isArray(user.frames) ? user.frames : [];

    // C. Check "Dot Notation" String Key
    const dotFrames = Array.isArray(user["inventory.frames"])
      ? user["inventory.frames"]
      : [];

    // D. Merge ALL sources and remove duplicates
    const allFrames = [...new Set([...mapFrames, ...rootFrames, ...dotFrames])];

    console.log("✅ [GameContext] Merged Frames (from Auth):", allFrames);

    // E. Update State
    setInventory({
      ...user.inventory, // Keep other inventory items like badges
      frames: allFrames, // Overwrite frames with the complete list
    });

    setGameLoading(false);
  }, [user]); // 👈 This dependency ensures we stay in sync with Auth

  // ✅ FUNCTION 1: Select City (Memoized)
  const selectCity = useCallback(
    async (cityName) => {
      if (city === cityName) return;

      setCity(cityName);
      if (user?.uid) {
        try {
          const { db, doc, updateDoc } = await loadFirebase();
          const userRef = doc(db, "users", user.uid);
          // We still WRITE to Firestore, which is fine and correct.
          await updateDoc(userRef, { city: cityName });
        } catch (err) {
          console.warn("City sync failed:", err);
        }
      }
    },
    [city, user?.uid],
  );

  // ✅ FUNCTION 2: Is Joined Check (Memoized)
  const isJoined = useCallback(
    (questId) => {
      if (Array.isArray(joinedQuests)) {
        return joinedQuests.includes(questId);
      }
      return !!joinedQuests[questId];
    },
    [joinedQuests],
  );

  // ✅ FUNCTION 3: Equip Frame (Memoized)
  const equipFrame = useCallback(
    async (frameId) => {
      // 🔍 FORENSIC LOG: What are we actually writing?
      console.log("🔍 [GameContext] equipFrame called with frameId:", frameId);

      if (!user?.uid) return;
      try {
        const { db, doc, updateDoc } = await loadFirebase();
        const userRef = doc(db, "users", user.uid);

        console.log("   -> Writing to DB: { equippedFrame:", frameId, "}");
        await updateDoc(userRef, { equippedFrame: frameId });
        toast.success("Frame equipped! 🎨");
      } catch (err) {
        console.error("Failed to equip frame:", err);
        toast.error("Failed to equip frame");
      }
    },
    [user?.uid],
  );

  // ✅ FUNCTION 4: Join Quest (FULL LOGIC PRESERVED)
  const joinQuest = useCallback(
    async (questId, secretCode = "") => {
      if (!user) return;

      if (isJoined(questId)) {
        toast("You are already in this squad!", { icon: "🫡" });
        return;
      }

      const loadingToast = toast.loading("Joining Squad...");

      try {
        const { auth } = await loadFirebase();
        if (!auth.currentUser) throw new Error("User not authenticated");
        const token = await auth.currentUser.getIdToken();

        // Note: Ensure this URL is correct (use https://squad-quest.onrender.com for Live)
        const response = await fetch(`${API_BASE}/quest/join`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ questId, secretCode }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to join quest");
        }

        toast.success("Squad Joined! 🚀", { id: loadingToast });
      } catch (error) {
        console.error("Failed to join quest:", error);
        toast.error(error.message, { id: loadingToast });
      }
    },
    [user, isJoined],
  );

  // ✅ FUNCTION 5: Leave Quest (FULL LOGIC PRESERVED)
  const leaveQuest = useCallback(
    async (questId) => {
      if (!user) return;

      const loadingToast = toast.loading("Processing...");

      try {
        const { auth } = await loadFirebase();
        if (!auth.currentUser) throw new Error("User not authenticated");
        const token = await auth.currentUser.getIdToken();

        const response = await fetch(`${API_BASE}/quest/leave`, {
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

        if (data.xpPenalty > 0) {
          toast.error(
            `Left Quest. Penalty: -${data.xpPenalty} XP & Reputation Drop`,
            { id: loadingToast, icon: "📉", duration: 5000 },
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
