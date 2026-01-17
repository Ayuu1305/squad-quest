import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Star, Zap, Users, Shield } from "lucide-react";
import { db } from "../backend/firebaseConfig";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";

import { useAuth } from "../context/AuthContext";

const LiveFeed = () => {
  const [activities, setActivities] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) return; // ✅ Stop if logged out

    const q = query(
      collection(db, "global_activity"),
      orderBy("timestamp", "desc"),
      limit(25),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          const time = data.timestamp?.toDate
            ? formatDistanceToNow(data.timestamp.toDate(), { addSuffix: true })
            : "just now";

          return {
            id: d.id,
            ...data,
            time,
          };
        });

        setActivities(list);
      },
      (err) => {
        // ✅ Ignore permission-denied during logout
        if (err?.code === "permission-denied") return;
        console.error("LiveFeed subscription error:", err);
        setActivities([]);
      },
    );

    return () => unsub();
  }, [user?.uid]);

  const getIcon = (type) => {
    switch (type) {
      case "quest":
        return <Zap className="w-3 h-3 text-yellow-400" />;
      case "badge":
        return <Star className="w-3 h-3 text-purple-400" />;
      case "join":
        return <Users className="w-3 h-3 text-blue-400" />;
      case "levelup":
        return <Shield className="w-3 h-3 text-green-400" />;
      default:
        return <Activity className="w-3 h-3 text-gray-400" />;
    }
  };

  return (
    <div className="cursor-default select-none">
      <div className="space-y-2 relative h-64 overflow-hidden mask-gradient-b">
        <AnimatePresence initial={false}>
          {activities.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className={`glassmorphism-dark p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                item.userAura === "gold"
                  ? "border-yellow-500/50 bg-yellow-500/5"
                  : item.userAura === "blue"
                    ? "border-blue-500/50 bg-blue-500/5"
                    : item.userAura === "mythic"
                      ? "border-purple-500/50 bg-purple-500/5"
                      : "border-white/5 hover:bg-white/5"
              }`}
            >
              <div className="p-1.5 rounded-lg bg-white/5 shadow-inner relative">
                {getIcon(item.type)}
                {item.userAura === "gold" && (
                  <div className="absolute -top-1 -right-1 text-[8px]">👑</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-gray-300">
                  <span
                    className={`font-bold ${
                      item.userAura === "gold"
                        ? "text-yellow-400"
                        : item.userAura === "mythic"
                          ? "text-purple-400"
                          : "text-white"
                    }`}
                  >
                    {item.user || item.userName || "Unknown"}
                  </span>{" "}
                  {item.action || "did something"}{" "}
                  <span className="text-neon-purple font-bold">
                    {item.target || ""}
                  </span>
                </div>

                {item.userAura === "gold" && item.type === "quest" && (
                  <div className="text-[9px] text-yellow-500/80 italic mt-0.5 animate-pulse">
                    "Can anyone catch them before Sunday?"
                  </div>
                )}

                <div className="text-[9px] text-gray-500 font-mono flex items-center gap-1">
                  {item.time || "just now"}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-dark-bg to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

export default LiveFeed;
