import { createContext, useContext, useState, useCallback } from "react";
import { markRewardAsClaimed } from "../backend/firebaseService";
import { useAuth } from "./AuthContext";

const RewardContext = createContext();

export const RewardProvider = ({ children }) => {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [isShowing, setIsShowing] = useState(false);

  const triggerReward = useCallback((reward) => {
    console.log("🎉 [RewardContext] Triggering reward:", reward);
    setQueue((prevQueue) => [...prevQueue, reward]);
  }, []);

  const dismissReward = useCallback(async () => {
    console.log("✅ [RewardContext] Dismissing current reward");

    // ✅ Persist claim to Firestore before dismissing
    const currentReward = queue[0];
    if (currentReward && user?.uid) {
      if (currentReward.type === "LEVEL") {
        await markRewardAsClaimed(user.uid, "LEVEL", currentReward.data.level);
      } else if (currentReward.type === "BADGE") {
        await markRewardAsClaimed(
          user.uid,
          "BADGE",
          currentReward.data.badgeId,
        );
      } else if (currentReward.type === "RANK") {
        await markRewardAsClaimed(
          user.uid,
          "RANK",
          currentReward.data.rankName,
        );
      }
    }

    setQueue((prevQueue) => prevQueue.slice(1));
    setIsShowing(false);
  }, [queue, user?.uid]);

  const currentReward = queue[0] || null;

  return (
    <RewardContext.Provider
      value={{
        currentReward,
        triggerReward,
        dismissReward,
        isShowing,
        setIsShowing,
      }}
    >
      {children}
    </RewardContext.Provider>
  );
};

export const useReward = () => {
  const context = useContext(RewardContext);
  if (!context) {
    throw new Error("useReward must be used within a RewardProvider");
  }
  return context;
};
