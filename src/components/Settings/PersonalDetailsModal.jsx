import { useState } from "react";
import { motion } from "framer-motion";
import { X, User, Calendar, AlertTriangle, Save } from "lucide-react";
import { updateHeroProfile } from "../../backend/services/auth.service";
import toast from "react-hot-toast";

const PersonalDetailsModal = ({ user, onClose }) => {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    age: user?.age || "",
    // gender removed - now immutable for safety
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    setLoading(true);

    try {
      await updateHeroProfile(user.uid, {
        name: formData.name,
        age: formData.age,
        // gender is immutable, not included in updates
      });
      toast.success("Profile Updated!");
      onClose();
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-dark-bg border border-neon-purple/30 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-2xl font-['Orbitron'] font-bold text-white mb-6 flex items-center gap-2">
            <User className="w-6 h-6 text-neon-purple" />
            Edit Identity
          </h2>

          <div className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase mb-1">
                Display Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-neon-purple focus:outline-none transition-colors"
                placeholder="Enter your hero name"
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase mb-1">
                Age
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 pl-10 text-white focus:border-neon-purple focus:outline-none transition-colors"
                  placeholder="Enter your age"
                />
              </div>
            </div>

            {/* Gender - LOCKED FOR SAFETY */}
            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase mb-1">
                Gender
              </label>
              <div className="w-full bg-black/30 border border-white/5 rounded-lg p-3 flex items-center justify-between">
                <span className="text-white font-semibold">
                  {user?.gender || "Not set"}
                </span>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>🔒 Locked for safety</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Gender cannot be changed after signup to prevent abuse in
                women-only quests.
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full py-4 mt-4 bg-neon-purple text-white font-bold rounded-xl hover:bg-neon-purple/80 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                "Updating..."
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PersonalDetailsModal;
