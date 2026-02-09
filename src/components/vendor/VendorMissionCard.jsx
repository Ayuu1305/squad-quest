import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  User,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";

const VendorMissionCard = ({ mission }) => {
  const startTime = new Date(
    mission.startTime?.seconds * 1000 || mission.startTime,
  );
  const now = new Date();
  const isUpcoming = startTime > now;
  const isPast = mission.status === "completed";
  const isActive = mission.status === "active";

  // Calculate time until mission
  const getTimeUntil = () => {
    const diff = startTime - now;
    if (diff < 0) return "Started";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `in ${days} day${days > 1 ? "s" : ""}`;
    }
    if (hours > 0) {
      return `in ${hours}h ${minutes}m`;
    }
    return `in ${minutes}m`;
  };

  // Status badge component
  const StatusBadge = () => {
    if (isPast) {
      return (
        <div className="flex items-center gap-1 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
          <CheckCircle2 className="w-3 h-3 text-green-400" />
          <span className="text-xs font-bold text-green-400 uppercase">
            Completed
          </span>
        </div>
      );
    }

    if (isActive) {
      return (
        <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full animate-pulse">
          <AlertCircle className="w-3 h-3 text-yellow-400" />
          <span className="text-xs font-bold text-yellow-400 uppercase">
            In Progress
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
        <Circle className="w-3 h-3 text-blue-400" />
        <span className="text-xs font-bold text-blue-400 uppercase">
          Upcoming
        </span>
      </div>
    );
  };

  return (
    <motion.div
      id={`mission-${mission.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className={`relative overflow-hidden rounded-2xl border transition-all ${
        isActive
          ? "border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-orange-500/10"
          : isPast
            ? "border-white/5 bg-black/20 opacity-60"
            : "border-white/10 bg-black/40"
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-bold text-white text-base mb-1 line-clamp-1">
              {mission.title}
            </h3>
            <p className="text-xs text-gray-400 italic line-clamp-2">
              {mission.objective}
            </p>
          </div>
          <StatusBadge />
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        {/* Time & Date */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="p-2 bg-neon-purple/10 rounded-lg">
              <Calendar className="w-4 h-4 text-neon-purple" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-mono uppercase">Date</p>
              <p className="text-sm font-bold text-white">
                {startTime.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-mono uppercase">Time</p>
              <p className="text-sm font-bold text-white">
                {startTime.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Countdown Timer (Only for upcoming) */}
        {isUpcoming && !isPast && (
          <div className="bg-neon-purple/10 border border-neon-purple/20 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-mono uppercase">
                Starts
              </span>
              <span className="text-sm font-black text-neon-purple">
                {getTimeUntil()}
              </span>
            </div>
          </div>
        )}

        {/* Expected Guests & Host */}
        <div className="flex items-center gap-4 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 flex-1">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Users className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-mono uppercase">
                Expected Guests
              </p>
              <p className="text-sm font-bold text-white">
                {mission.currentPlayers || 1} / {mission.maxPlayers} people
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <User className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-mono uppercase">Host</p>
              <p className="text-sm font-bold text-white line-clamp-1">
                {mission.hostName || "Unknown"}
              </p>
            </div>
          </div>
        </div>

        {/* Mission Category */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <span className="text-xs font-bold text-gray-400 uppercase">
                {mission.category}
              </span>
            </div>
            {mission.vibeCheck && (
              <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                <span className="text-xs font-bold text-gray-400">
                  {mission.vibeCheck}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Mission Pulse Effect */}
      {isActive && (
        <div className="absolute top-0 right-0 w-3 h-3 m-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default VendorMissionCard;
