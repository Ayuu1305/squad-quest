import { motion } from "framer-motion";
import { TrendingUp, Users, Calendar, Clock } from "lucide-react";

const VendorStats = ({ stats, loading, manuallyCompletedCount = 0 }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-black/40 border border-white/10 rounded-2xl p-4 animate-pulse"
          >
            <div className="h-8 bg-white/10 rounded mb-2" />
            <div className="h-4 bg-white/10 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Missions",
      value: stats.totalMissions || 0,
      icon: Calendar,
      color: "text-neon-purple",
      bgColor: "bg-neon-purple/10",
      borderColor: "border-neon-purple/20",
    },
    {
      label: "Open Missions",
      // 🎯 Subtract manually completed quests from database count
      value: Math.max(0, (stats.openMissions || 0) - manuallyCompletedCount),
      icon: Clock,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      label: "Total Guests",
      value: stats.totalExpectedGuests || 0,
      icon: Users,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
    {
      label: "Avg Group Size",
      value: stats.averageGroupSize || 0,
      icon: TrendingUp,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`relative overflow-hidden rounded-2xl border ${stat.borderColor} ${stat.bgColor} p-4`}
        >
          {/* Icon */}
          <div className={`inline-flex p-2 rounded-lg ${stat.bgColor} mb-3`}>
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
          </div>

          {/* Value */}
          <div className="mb-1">
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>

          {/* Label */}
          <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
            {stat.label}
          </p>

          {/* Background Glow */}
          <div
            className={`absolute -top-4 -right-4 w-20 h-20 ${stat.bgColor} blur-2xl opacity-20 pointer-events-none`}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default VendorStats;
