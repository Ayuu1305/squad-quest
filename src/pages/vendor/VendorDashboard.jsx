import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useVendorAuth } from "../../context/VendorAuthContext";
import { motion } from "framer-motion";
import {
  Store,
  LogOut,
  Bell,
  TrendingUp,
  Filter,
  Calendar,
  Clock as ClockIcon,
  CheckCircle2,
} from "lucide-react";
import {
  subscribeToVendorMissions,
  getVendorMissionStats,
  getVendorNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../backend/services/vendor.service";
import { auth } from "../../backend/firebaseConfig";
import VendorMissionCard from "../../components/vendor/VendorMissionCard";
import VendorStats from "../../components/vendor/VendorStats";
import toast from "react-hot-toast";

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { vendorProfile, isVendor, loading: vendorLoading } = useVendorAuth();

  const [missions, setMissions] = useState([]);
  const [filteredMissions, setFilteredMissions] = useState([]);
  const [stats, setStats] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [statsLoading, setStatsLoading] = useState(true);
  const [missionsLoading, setMissionsLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  // Redirect if not vendor
  useEffect(() => {
    if (!vendorLoading && !isVendor) {
      toast.error("Access denied. Vendor account required.");
      navigate("/vendor/login");
    }
  }, [isVendor, vendorLoading, navigate]);

  // Subscribe to missions for vendor's hub
  useEffect(() => {
    if (!vendorProfile?.hubId) return;

    setMissionsLoading(true);
    const unsubscribe = subscribeToVendorMissions(
      vendorProfile.id,
      vendorProfile.hubId,
      (missionsData) => {
        setMissions(missionsData);
        setMissionsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [vendorProfile]);

  // Fetch stats
  useEffect(() => {
    if (!vendorProfile?.hubId) return;

    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const statsData = await getVendorMissionStats(
          vendorProfile.hubId,
          "week",
        );
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [vendorProfile]);

  // Fetch notifications
  useEffect(() => {
    if (!vendorProfile?.id) return;

    const fetchNotifications = async () => {
      try {
        const notifs = await getVendorNotifications(vendorProfile.id);
        setNotifications(notifs.filter((n) => !n.read));
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
  }, [vendorProfile]);

  // Filter missions based on selected filter
  useEffect(() => {
    const now = new Date();

    switch (selectedFilter) {
      case "today":
        const todayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        const todayEnd = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
        );
        setFilteredMissions(
          missions.filter((m) => {
            const startTime = new Date(
              m.startTime?.seconds * 1000 || m.startTime,
            );
            return startTime >= todayStart && startTime <= todayEnd;
          }),
        );
        break;

      case "upcoming":
        setFilteredMissions(
          missions.filter((m) => {
            const startTime = new Date(
              m.startTime?.seconds * 1000 || m.startTime,
            );
            return startTime > now && m.status === "open";
          }),
        );
        break;

      case "active":
        setFilteredMissions(
          missions.filter((m) => {
            const startTime = new Date(
              m.startTime?.seconds * 1000 || m.startTime,
            );
            // Active if status is active AND time has started AND not past with no players
            const isPast =
              m.status === "completed" ||
              (startTime < now && (!m.membersCount || m.membersCount === 0));
            return m.status === "active" && startTime <= now && !isPast;
          }),
        );
        break;

      case "completed":
        setFilteredMissions(
          missions.filter((m) => {
            const startTime = new Date(
              m.startTime?.seconds * 1000 || m.startTime,
            );
            // Completed if status is completed OR if start time has passed with no participants
            return (
              m.status === "completed" ||
              (startTime < now && (!m.membersCount || m.membersCount === 0))
            );
          }),
        );
        break;

      default:
        setFilteredMissions(missions);
    }
  }, [selectedFilter, missions]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.success("Logged out successfully");
      navigate("/vendor/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    }
  };

  if (vendorLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#0f0f23] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-mono text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!vendorProfile) {
    return null;
  }

  const filters = [
    { id: "all", label: "All Missions", icon: Calendar },
    { id: "today", label: "Today", icon: ClockIcon },
    { id: "upcoming", label: "Upcoming", icon: TrendingUp },
    { id: "active", label: "Active", icon: Bell },
    { id: "completed", label: "Completed", icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#0f0f23] pb-24">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-neon-purple/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="relative border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-neon-purple to-blue-600 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-['Orbitron'] font-black text-white uppercase tracking-tight">
                  {vendorProfile.hubName}
                </h1>
                <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mt-1">
                  {vendorProfile.category} • {vendorProfile.city}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                >
                  <Bell className="w-5 h-5 text-gray-400" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-black text-white animate-pulse">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown - IMPROVED DESIGN */}
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[min(420px,calc(100vw-2rem))] bg-gradient-to-br from-black via-[#0a0a0f] to-black backdrop-blur-2xl border border-neon-purple/20 rounded-2xl shadow-[0_20px_70px_rgba(168,85,247,0.3)] z-50 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="p-5 border-b border-white/10 bg-gradient-to-r from-neon-purple/10 to-blue-600/10">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-['Orbitron'] font-black text-white uppercase tracking-wider">
                          🔔 Notifications
                        </h3>
                        {notifications.length > 0 && (
                          <span className="text-xs font-mono text-neon-purple bg-neon-purple/10 px-2 py-1 rounded-full">
                            {notifications.length} new
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-neon-purple/20 scrollbar-track-transparent">
                      {notifications.length === 0 ? (
                        <div className="p-12 text-center">
                          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-gray-600" />
                          </div>
                          <p className="text-gray-500 text-sm font-mono">
                            All caught up! No new notifications
                          </p>
                        </div>
                      ) : (
                        <div>
                          {notifications.map((notif, index) => (
                            <motion.div
                              key={notif.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={async () => {
                                // Mark notification as read
                                try {
                                  await markNotificationAsRead(notif.id);
                                  // Refresh notifications
                                  const updatedNotifs =
                                    await getVendorNotifications(
                                      vendorProfile.id,
                                    );
                                  setNotifications(
                                    updatedNotifs.filter((n) => !n.read),
                                  );
                                } catch (error) {
                                  console.error(
                                    "Error marking notification as read:",
                                    error,
                                  );
                                }

                                // Navigate to mission feed and highlight the mission
                                setShowNotifications(false);
                                // Scroll to mission in feed
                                const missionElement = document.getElementById(
                                  `mission-${notif.questId}`,
                                );
                                if (missionElement) {
                                  missionElement.scrollIntoView({
                                    behavior: "smooth",
                                    block: "center",
                                  });
                                  // Add highlight animation
                                  missionElement.classList.add(
                                    "ring-2",
                                    "ring-neon-purple",
                                    "ring-offset-2",
                                    "ring-offset-black",
                                  );
                                  setTimeout(() => {
                                    missionElement.classList.remove(
                                      "ring-2",
                                      "ring-neon-purple",
                                      "ring-offset-2",
                                      "ring-offset-black",
                                    );
                                  }, 2000);
                                }
                              }}
                              className="p-4 border-b border-white/5 hover:bg-gradient-to-r hover:from-neon-purple/10 hover:to-blue-600/10 transition-all cursor-pointer group"
                            >
                              <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-neon-purple to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                                  <Bell className="w-5 h-5 text-white" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-bold text-white mb-1 group-hover:text-neon-purple transition-colors">
                                    {notif.title}
                                  </h4>
                                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                                    {notif.body}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] text-gray-600 font-mono">
                                      {new Date(
                                        notif.createdAt?.seconds * 1000,
                                      ).toLocaleTimeString()}{" "}
                                      •{" "}
                                      {new Date(
                                        notif.createdAt?.seconds * 1000,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>

                                {/* Unread Indicator */}
                                <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer - Clear All */}
                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-white/10 bg-white/5">
                        <button
                          onClick={async () => {
                            try {
                              await markAllNotificationsAsRead(
                                vendorProfile.id,
                              );
                              // Clear notifications
                              setNotifications([]);
                              setShowNotifications(false);
                              toast.success("All notifications marked as read");
                            } catch (error) {
                              console.error(
                                "Error marking all notifications as read:",
                                error,
                              );
                              toast.error(
                                "Failed to mark notifications as read",
                              );
                            }
                          }}
                          className="w-full text-xs font-bold text-neon-purple hover:text-white transition-colors uppercase tracking-wider"
                        >
                          Mark all as read
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
              >
                <LogOut className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-bold text-gray-400 hidden sm:block">
                  Logout
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-neon-purple" />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              This Week's Overview
            </h2>
          </div>
          <VendorStats stats={stats} loading={statsLoading} />
        </section>

        {/* Missions Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-neon-purple" />
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                Mission Feed
              </h2>
            </div>
            <p className="text-sm text-gray-500 font-mono">
              {filteredMissions.length} mission
              {filteredMissions.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  selectedFilter === filter.id
                    ? "bg-neon-purple text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    : "bg-white/5 text-gray-500 border border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                <filter.icon className="w-3 h-3" />
                {filter.label}
              </button>
            ))}
          </div>

          {/* Missions Grid */}
          {missionsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-black/40 border border-white/10 rounded-2xl h-64 animate-pulse"
                />
              ))}
            </div>
          ) : filteredMissions.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            >
              {filteredMissions.map((mission) => (
                <VendorMissionCard key={mission.id} mission={mission} />
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 rounded-full mb-4">
                <Calendar className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-500 font-mono text-sm">
                No missions found for this filter
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default VendorDashboard;
