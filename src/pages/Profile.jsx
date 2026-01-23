import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Bell,
  ArrowLeft,
  LogOut,
  Power,
  ShieldCheck,
  HeartPulse,
  PhoneCall,
} from "lucide-react";
import HeroProfile from "../components/HeroProfile";
import EditProfileModal from "../components/EditProfileModal";
import AvatarEditor from "../components/Profile/AvatarEditor";
import { useGame } from "../context/GameContext";
import { useAuth } from "../context/AuthContext";
import { signOutUser } from "../backend/firebaseService";

const Profile = () => {
  const navigate = useNavigate();
  const { selectCity } = useGame();
  const { user, setUser } = useAuth(); // Assuming setUser exists to update local state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);

  const handleSwitchRealm = () => {
    selectCity("");
    navigate("/");
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg pb-32">
      {/* Global Scrollbar Theme for Profile Page */}
      <style>{`
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.5);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.8);
        }
      `}</style>

      <AnimatePresence>
        {showEditModal && (
          <EditProfileModal
            user={user}
            onClose={() => setShowEditModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Shop Modal */}
      {/* Avatar Editor (Fitting Room) */}
      <AvatarEditor
        isOpen={showAvatarEditor}
        onClose={() => setShowAvatarEditor(false)}
      />

      <div className="container mx-auto max-w-7xl px-4 md:px-8">
        {/* Profile Header - Mobile Optimized */}
        <header className="py-6 flex items-center justify-between sticky top-0 bg-dark-bg/80 backdrop-blur-md z-30 sm:relative sm:bg-transparent px-2 sm:px-0">
          <button
            onClick={() => navigate("/board")}
            className="p-3 glassmorphism rounded-xl hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>

          <div className="flex gap-3">
            {/* Edit Avatar Button */}
            <button
              onClick={() => setShowAvatarEditor(true)}
              className="p-3 glassmorphism rounded-xl hover:text-pink-400 transition-colors flex items-center gap-2 group"
              title="Fitting Room"
            >
              <Settings className="w-5 h-5 text-gray-400 group-hover:text-pink-400" />
              <span className="hidden sm:inline text-[10px] font-black uppercase">
                Edit Look
              </span>
            </button>

            <button
              onClick={handleSwitchRealm}
              className="p-3 glassmorphism rounded-xl hover:text-neon-purple transition-colors flex items-center gap-2 group"
              title="Switch Realm"
            >
              <LogOut className="w-5 h-5 text-gray-400 group-hover:text-neon-purple" />
              <span className="hidden sm:inline text-[10px] font-black uppercase">
                Realm
              </span>
            </button>
            <button
              onClick={handleLogout}
              className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-colors flex items-center gap-2 group"
              title="Sign Out"
            >
              <Power className="w-5 h-5 text-red-400" />
              <span className="hidden sm:inline text-[10px] font-black uppercase text-red-400">
                Exit
              </span>
            </button>
          </div>
        </header>

        <HeroProfile
          user={user}
          onEdit={() => setShowEditModal(true)}
          onEditAvatar={() => setShowAvatarEditor(true)}
        />

        {/* Safety Section */}
        <footer className="py-12 space-y-8">
          <div className="p-6 glassmorphism-dark rounded-3xl border border-neon-purple/20 bg-gradient-to-br from-neon-purple/5 to-transparent">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-6 h-6 text-neon-purple" />
              <h2 className="text-lg font-black font-['Orbitron'] text-white uppercase italic tracking-tighter">
                Safety Guidelines
              </h2>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex gap-3">
                <div className="h-2 w-2 rounded-full bg-neon-purple mt-1.5 shrink-0" />
                <p className="text-xs text-gray-400 leading-relaxed font-mono uppercase tracking-tight">
                  Always meet in the designated Hub location. Never divert to
                  unknown sectors.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="h-2 w-2 rounded-full bg-neon-purple mt-1.5 shrink-0" />
                <p className="text-xs text-gray-400 leading-relaxed font-mono uppercase tracking-tight">
                  Squad Quest is a community of Heroes. Respect the Realm and
                  its inhabitants.
                </p>
              </div>
            </div>

            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">
                <HeartPulse className="w-3.5 h-3.5" />
                Ahmedabad Emergency Contacts
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">
                    {" "}
                    Police{" "}
                  </div>
                  <div className="text-white font-mono flex items-center gap-2">
                    <PhoneCall className="w-3 h-3 text-neon-purple" /> 100
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">
                    {" "}
                    Ambulance{" "}
                  </div>
                  <div className="text-white font-mono flex items-center gap-2">
                    <PhoneCall className="w-3 h-3 text-neon-purple" /> 108
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">
                    {" "}
                    Women Help{" "}
                  </div>
                  <div className="text-white font-mono flex items-center gap-2">
                    <PhoneCall className="w-3 h-3 text-neon-purple" /> 181
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">
                    {" "}
                    Fire{" "}
                  </div>
                  <div className="text-white font-mono flex items-center gap-2">
                    <PhoneCall className="w-3 h-3 text-neon-purple" /> 101
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em]">
              Squad Quest • Ahmedabad Launch v1.0
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Profile;
