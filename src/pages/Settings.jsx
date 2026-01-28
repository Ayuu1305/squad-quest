import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  LogOut,
  MapPin,
  Key,
  User,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useGame } from "../context/GameContext";
import { signOutUser, resetHeroPassword } from "../backend/firebaseService";
import PersonalDetailsModal from "../components/Settings/PersonalDetailsModal";
import toast from "react-hot-toast";

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { city, selectCity } = useGame();
  const [showPersonalDetails, setShowPersonalDetails] = useState(false);

  const handleLogout = async () => {
    try {
      await signOutUser();
      navigate("/");
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("Logout failed");
    }
  };

  const handleSwitchRealm = () => {
    selectCity("");
    navigate("/");
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    try {
      await resetHeroPassword(user.email);
      toast.success(`Password reset email sent to ${user.email}`);
    } catch (error) {
      console.error("Reset password failed", error);
      toast.error("Failed to send reset email");
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white pb-20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-dark-bg/80 backdrop-blur-md border-b border-white/5 p-4 flex items-center gap-4">
        <button
          onClick={() => navigate("/profile")}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-['Orbitron'] font-bold">Settings</h1>
      </header>

      <div className="pt-24 px-4 max-w-2xl mx-auto space-y-8">
        {/* Section 1: Identity */}
        <section>
          <h2 className="text-sm font-mono text-gray-500 uppercase tracking-wider mb-4 px-2">
            Identity
          </h2>
          <div className="glassmorphism-dark rounded-2xl overflow-hidden border border-white/10">
            {/* Preview Card */}
            <div className="p-6 border-b border-white/5 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-neon-purple/20 border-2 border-neon-purple/50 p-1">
                <img
                  src={
                    user?.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`
                  }
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">
                  {user?.name || "Unknown Hero"}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded text-gray-300">
                    Age: {user?.age || "N/A"}
                  </span>
                  <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded text-gray-300">
                    Gender: {user?.gender || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPersonalDetails(true)}
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-neon-purple" />
                <span className="font-medium">Edit Details</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </section>

        {/* Section 2: Security & Realm */}
        <section>
          <h2 className="text-sm font-mono text-gray-500 uppercase tracking-wider mb-4 px-2">
            Security & Realm
          </h2>
          <div className="glassmorphism-dark rounded-2xl overflow-hidden border border-white/10 divide-y divide-white/5">
            <button
              onClick={handleResetPassword}
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-blue-400" />
                <div>
                  <span className="block font-medium">Reset Password</span>
                  <span className="text-xs text-gray-500">
                    Send password reset email
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>

            <button
              onClick={handleSwitchRealm}
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-green-400" />
                <div>
                  <span className="block font-medium">Switch Realm</span>
                  <span className="text-xs text-gray-500">Current: {city}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </section>

        {/* Section 3: Danger Zone */}
        <section>
          <h2 className="text-sm font-mono text-red-500/70 uppercase tracking-wider mb-4 px-2">
            Danger Zone
          </h2>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between hover:bg-red-500/20 transition-colors text-red-100"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-red-500" />
              <span className="font-bold text-red-400">Log Out</span>
            </div>
          </motion.button>
        </section>
      </div>

      {/* Footer Branding */}
      <div className="mt-12 text-center">
        <p className="text-xs text-gray-600 font-black uppercase tracking-[0.2em]">
          Squad Quest v1.0
        </p>
      </div>

      {/* Modals */}
      {showPersonalDetails && (
        <PersonalDetailsModal
          user={user}
          onClose={() => setShowPersonalDetails(false)}
        />
      )}
    </div>
  );
};

export default Settings;
