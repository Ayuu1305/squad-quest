import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
  joinQuest as firebaseJoin,
  leaveQuest as firebaseLeave,
  subscribeToQuest,
} from "../backend/firebaseService";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../backend/firebaseConfig";

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
    if (!user) {
      setJoinedQuests([]);
      return;
    }

    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          setJoinedQuests(docSnap.data().joinedQuests || []);
        }
      },
      (error) => {
        console.error("GameContext: User listener error:", error);
      }
    );

    return () => unsub();
  }, [user]);

  const selectCity = async (cityName) => {
    setCity(cityName);
    if (user?.uid) {
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { city: cityName });
        console.log("City synced to profile.");
      } catch (err) {
        console.warn("City sync failed:", err);
      }
    }
  };

  const joinQuest = async (questId) => {
    if (!user) return;
    try {
      await firebaseJoin(questId, user.uid);
      // Local state will be updated by the onSnapshot listener above
    } catch (error) {
      console.error("Failed to join quest:", error);
    }
  };

  const leaveQuest = async (questId) => {
    if (!user) return;
    try {
      await firebaseLeave(questId, user.uid);
      // Local state will be updated by the onSnapshot listener above
    } catch (error) {
      console.error("Failed to leave quest:", error);
    }
  };

  const isJoined = (questId) => joinedQuests.includes(questId);

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
