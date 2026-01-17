import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../backend/firebaseConfig";
import { Zap, UserPlus, Target, Award, Gift } from "lucide-react";

const FloatingLiveFeed = () => {
  const [notifications, setNotifications] = useState([]);
  const [lastTimestamp, setLastTimestamp] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, "global_activity"),
      orderBy("timestamp", "desc"),
      limit(1),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          const timestamp = data.timestamp?.toMillis?.() || Date.now();

          // Only show truly new notifications (within last 30 seconds)
          if (!lastTimestamp || timestamp > lastTimestamp) {
            const notification = {
              id: change.doc.id,
              ...data,
              timestamp,
            };

            // Add to notifications
            setNotifications((prev) => {
              // Prevent duplicates
              if (prev.some((n) => n.id === notification.id)) return prev;
              return [notification, ...prev].slice(0, 5);
            });

            setLastTimestamp(timestamp);

            // Auto-remove after 4 seconds
            setTimeout(() => {
              setNotifications((prev) =>
                prev.filter((n) => n.id !== notification.id),
              );
            }, 4000);
          }
        }
      });
    });

    return () => unsubscribe();
  }, [lastTimestamp]);

  const getIcon = (type) => {
    switch (type) {
      case "quest":
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case "quest_created":
        return <Target className="w-4 h-4 text-blue-400" />;
      case "hero_joined":
        return <UserPlus className="w-4 h-4 text-green-400" />;
      case "badge":
        return <Award className="w-4 h-4 text-purple-400" />;
      case "bounty":
        return <Gift className="w-4 h-4 text-orange-400" />;
      default:
        return <Zap className="w-4 h-4 text-neon-purple" />;
    }
  };

  const getGradient = (type) => {
    switch (type) {
      case "quest":
        return "from-yellow-500/20 to-orange-500/10 border-yellow-500/40";
      case "quest_created":
        return "from-blue-500/20 to-cyan-500/10 border-blue-500/40";
      case "hero_joined":
        return "from-green-500/20 to-emerald-500/10 border-green-500/40";
      case "badge":
        return "from-purple-500/20 to-pink-500/10 border-purple-500/40";
      case "bounty":
        return "from-orange-500/20 to-amber-500/10 border-orange-500/40";
      default:
        return "from-neon-purple/20 to-blue-500/10 border-neon-purple/40";
    }
  };

  return (
    <div className="fixed right-4 top-1/3 z-50 flex flex-col gap-3 pointer-events-none max-w-xs sm:max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={`
              bg-gradient-to-r ${getGradient(notification.type)}
              backdrop-blur-md border rounded-xl p-3 px-4
              shadow-lg shadow-black/30
              pointer-events-auto
            `}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 p-1.5 rounded-full bg-black/40">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">
                  <span className="font-bold text-neon-purple">
                    {notification.user}
                  </span>{" "}
                  {notification.action}
                </p>
                {notification.earnedXP && (
                  <p className="text-xs text-yellow-400 font-bold">
                    +{notification.earnedXP} XP
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FloatingLiveFeed;
