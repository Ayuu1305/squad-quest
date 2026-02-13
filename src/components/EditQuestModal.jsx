import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../backend/firebaseConfig";
import toast from "react-hot-toast";

const EditQuestModal = ({
  isOpen,
  onClose,
  onSave,
  quest,
  isSaving,
  userCity,
}) => {
  const [hubs, setHubs] = useState([]);

  // Helper to format Firestore timestamp to datetime-local input value
  const formatDateTimeLocal = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    title: quest?.title || "",
    category: quest?.category || "Cafe",
    hubId: quest?.hubId || "",
    hubName: quest?.hubName || "",
    objective: quest?.objective || "",
    difficulty: quest?.difficulty || 1,
    maxPlayers: quest?.maxPlayers || 4,
    duration: quest?.duration || "60-90m",
    // ❌ REMOVED: loot field (now fetched from hub)
    vibeCheck: quest?.vibeCheck || "Neutral",
    isPrivate: quest?.isPrivate || false,
    genderPreference: quest?.genderPreference || "everyone",
    secretCode: quest?.roomCode || quest?.secretCode || "", // ✅ Fix: Read roomCode
    startTime: formatDateTimeLocal(quest?.startTime),
  });

  // Fetch hubs
  useEffect(() => {
    const fetchHubs = async () => {
      try {
        const hubsRef = collection(db, "hubs");
        let snap;
        if (userCity) {
          const q = query(hubsRef, where("city", "==", userCity));
          snap = await getDocs(q);
        } else {
          snap = await getDocs(hubsRef);
        }
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setHubs(list);
      } catch (err) {
        console.error("Failed to load hubs:", err);
      }
    };
    if (isOpen) fetchHubs();
  }, [isOpen, userCity]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // ✅ Auto-generate secret code when isPrivate is checked
    if (name === "isPrivate") {
      if (checked && !formData.secretCode) {
        const randomCode = Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase();
        setFormData((prev) => ({
          ...prev,
          isPrivate: true,
          secretCode: randomCode,
        }));
        return;
      } else if (!checked) {
        setFormData((prev) => ({
          ...prev,
          isPrivate: false,
          secretCode: "",
        }));
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "difficulty" || name === "maxPlayers"
            ? parseInt(value) || 0
            : value,
    }));
  };

  const handleHubChange = (e) => {
    const selectedHub = hubs.find((h) => h.id === e.target.value);
    setFormData((prev) => ({
      ...prev,
      hubId: selectedHub?.id || "",
      hubName: selectedHub?.name || "",
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let startTimeDate;
    const timeStr = formData.startTime; // Could be "2026-02-01T12:30" OR ISO string

    // --- 1. Parse Date Safely (Fixes 12:30 -> 00:30 Bug) ---
    if (timeStr.endsWith("Z")) {
      // It is an ISO string (from DB)
      const d = new Date(timeStr);
      startTimeDate = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        d.getHours(),
        d.getMinutes(),
      );
    } else {
      // It is a Local string from input (YYYY-MM-DDTHH:mm)
      const [datePart, timePart] = timeStr.split("T");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hours, minutes] = timePart.split(":").map(Number);
      startTimeDate = new Date(year, month - 1, day, hours, minutes);
    }

    // --- 2. Validate Future Time ---
    const now = new Date();
    now.setSeconds(0);
    now.setMilliseconds(0);

    if (startTimeDate < now) {
      // Use alert since toast might not be imported in this modal
      toast.error(
        "⚠️ Invalid Time: You cannot reschedule a mission to the past!",
      );
      return; // 🛑 Stops save
    }

    // --- 3. Save ---
    const updates = {
      ...formData,
      roomCode: formData.secretCode,
      startTime: startTimeDate, // ✅ Send Date object, backend converts to Timestamp
    };

    onSave(updates);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative max-w-2xl w-full glassmorphism-dark rounded-3xl p-4 md:p-8 border-2 border-blue-500/50 my-8 max-h-[90vh] overflow-y-auto overflow-x-hidden"
          >
            {/* Scrollbar Theme */}
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
              background: rgba(59, 130, 246, 0.5); /* Blue thumb for blue border */
              border-radius: 4px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: rgba(59, 130, 246, 0.8);
            }
          `}</style>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-['Orbitron'] font-black text-white uppercase tracking-tight">
                Edit Quest
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                  Quest Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  maxLength={50}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Category & Difficulty */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none [&>option]:text-white [&>option]:bg-gray-800"
                  >
                    <option value="Café">Café</option>
                    <option value="Sports">Sports</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Education">Education</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                    Difficulty (1-5)
                  </label>
                  <input
                    type="number"
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleChange}
                    min="1"
                    max="5"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Hub Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                  Hub Location
                </label>
                <select
                  value={formData.hubId}
                  onChange={handleHubChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none [&>option]:text-white [&>option]:bg-gray-800"
                >
                  <option value="">Select Hub</option>
                  {hubs.map((hub) => (
                    <option key={hub.id} value={hub.id}>
                      {hub.name} - {hub.city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Objective */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                  Mission Objective
                </label>
                <input
                  type="text"
                  name="objective"
                  value={formData.objective}
                  onChange={handleChange}
                  maxLength={100}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Max Players & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                    Max Players
                  </label>
                  <input
                    type="number"
                    name="maxPlayers"
                    value={formData.maxPlayers}
                    onChange={handleChange}
                    min="2"
                    max="20"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                    Duration
                  </label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none [&>option]:text-white [&>option]:bg-gray-800"
                  >
                    <option value="30-60m">30-60 min</option>
                    <option value="60-90m">60-90 min</option>
                    <option value="90-120m">90-120 min</option>
                    <option value="2-3h">2-3 hours</option>
                    <option value="3h+">3+ hours</option>
                  </select>
                </div>
              </div>

              {/* Vibe Check - Full Width */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                  Vibe Check
                </label>
                <select
                  name="vibeCheck"
                  value={formData.vibeCheck}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none [&>option]:text-white [&>option]:bg-gray-800"
                >
                  <option value="Neutral">Neutral</option>
                  <option value="Chill">Chill</option>
                  <option value="Competitive">Competitive</option>
                  <option value="Intellectual">Intellectual</option>
                </select>
              </div>

              {/* Gender Preference */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                  Gender Preference
                </label>
                <select
                  name="genderPreference"
                  value={formData.genderPreference}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none [&>option]:text-white [&>option]:bg-gray-800"
                >
                  <option value="everyone">Everyone</option>
                  <option value="male">Males Only</option>
                  <option value="female">Females Only</option>
                </select>
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                  Start Time
                </label>
                <div className="flex items-center gap-2 sm:gap-4 bg-white/5 border border-white/10 p-3 rounded-xl focus-within:border-blue-500 focus-within:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300 group">
                  {/* DATE INPUT */}
                  <input
                    type="date"
                    required
                    value={
                      formData.startTime
                        ? (() => {
                            const d = new Date(formData.startTime);
                            // Handle invalid dates gracefully
                            if (isNaN(d.getTime())) return "";

                            const year = d.getFullYear();
                            const month = String(d.getMonth() + 1).padStart(
                              2,
                              "0",
                              "0",
                            );
                            const day = String(d.getDate()).padStart(2, "0");
                            return `${year}-${month}-${day}`;
                          })()
                        : ""
                    }
                    onChange={(e) => {
                      const dateVal = e.target.value; // YYYY-MM-DD
                      if (!dateVal) return;

                      const currentStart = formData.startTime
                        ? new Date(formData.startTime)
                        : new Date();

                      // Keep existing time or default to current time
                      const hours = isNaN(currentStart.getTime())
                        ? 12
                        : currentStart.getHours();
                      const minutes = isNaN(currentStart.getTime())
                        ? 0
                        : currentStart.getMinutes();

                      const newDate = new Date(dateVal);
                      newDate.setHours(hours, minutes);

                      setFormData({
                        ...formData,
                        startTime: newDate.toISOString(),
                      });
                    }}
                    className="bg-transparent text-white font-mono text-sm outline-none w-full uppercase cursor-pointer min-w-0"
                    style={{ colorScheme: "dark" }}
                  />

                  <div className="h-8 w-[1px] bg-white/10 group-focus-within:bg-blue-500/50 transition-colors"></div>

                  {/* TIME INPUT */}
                  <input
                    type="time"
                    required
                    value={
                      formData.startTime
                        ? (() => {
                            const d = new Date(formData.startTime);
                            if (isNaN(d.getTime())) return "";
                            const hours = String(d.getHours()).padStart(2, "0");
                            const minutes = String(d.getMinutes()).padStart(
                              2,
                              "0",
                            );
                            return `${hours}:${minutes}`;
                          })()
                        : ""
                    }
                    onChange={(e) => {
                      const timeVal = e.target.value; // HH:mm
                      if (!timeVal) return;

                      const [h, m] = timeVal.split(":").map(Number);

                      const currentStart = formData.startTime
                        ? new Date(formData.startTime)
                        : new Date();

                      // Set new time on existing date
                      if (!isNaN(currentStart.getTime())) {
                        currentStart.setHours(h, m);
                        setFormData({
                          ...formData,
                          startTime: currentStart.toISOString(),
                        });
                      } else {
                        // Fallback if date is missing (unlikely if required)
                        const now = new Date();
                        now.setHours(h, m);
                        setFormData({
                          ...formData,
                          startTime: now.toISOString(),
                        });
                      }
                    }}
                    className="bg-transparent text-white font-mono text-sm outline-none w-24 cursor-pointer text-center"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
              </div>

              {/* Privacy Toggle */}
              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                <input
                  type="checkbox"
                  id="isPrivate"
                  name="isPrivate"
                  checked={formData.isPrivate}
                  onChange={handleChange}
                  className="w-5 h-5"
                />
                <label
                  htmlFor="isPrivate"
                  className="text-white font-bold cursor-pointer"
                >
                  Private Quest (Requires Code)
                </label>
              </div>

              {/* Secret Code - Only show if Private */}
              {formData.isPrivate && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4">
                  <label className="block text-sm font-bold text-purple-300 mb-2 uppercase tracking-wider">
                    🔐 Secret Room Code
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      type="text"
                      value={formData.secretCode || ""}
                      readOnly
                      className="flex-1 px-4 py-3 bg-purple-500/20 border-2 border-purple-500 rounded-xl text-white font-black text-xl sm:text-2xl text-center uppercase tracking-[0.3em] focus:outline-none w-full"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(formData.secretCode);
                        toast.success("Code copied!");
                      }}
                      className="px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-bold uppercase text-sm transition-colors w-full sm:w-auto shadow-lg shadow-purple-600/20"
                    >
                      Copy Code
                    </button>
                  </div>
                  <p className="text-xs text-purple-300 mt-3 font-mono text-center sm:text-left">
                    Share this code with members to let them join
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditQuestModal;
