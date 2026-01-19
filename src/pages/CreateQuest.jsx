import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  Zap,
  Coffee,
  Swords,
  Gamepad2,
  BookOpen,
  Send,
  Gem,
  Lock,
  Globe,
  Shield,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useGame } from "../context/GameContext";
import { createQuest } from "../backend/firebaseService";
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../backend/firebaseConfig";
import toast from "react-hot-toast";

const CreateQuest = () => {
  const { user } = useAuth();
  const { city } = useGame();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "Café",
    hubId: "",
    hubName: "",
    startTime: "",
    maxPlayers: 4,
    objective: "",
    duration: "60-90m",
    difficulty: 1,
    loot: "Bonus XP + Hub Token",
    vibeCheck: "Neutral",
    isPrivate: false,
    genderPreference: "everyone",
    verificationType: "3-step",
    secretCode: "",
  });

  const [hubs, setHubs] = useState([]);
  const [selectedHubId, setSelectedHubId] = useState("");
  const [loadingHubs, setLoadingHubs] = useState(false);
  const [hubError, setHubError] = useState("");

  // Fetch hubs based on user city
  useEffect(() => {
    const fetchHubs = async () => {
      try {
        setLoadingHubs(true);
        setHubError("");

        const hubsRef = collection(db, "hubs");
        let snap;

        // Use user.city from AuthContext (mapped from hero?.city)
        if (user?.city) {
          const q = query(hubsRef, where("city", "==", user.city));
          snap = await getDocs(q);
        } else {
          snap = await getDocs(hubsRef);
        }

        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setHubs(list);
      } catch (err) {
        setHubError(err?.message || "Failed to load hubs");
      } finally {
        setLoadingHubs(false);
      }
    };

    fetchHubs();
  }, [user?.city]);

  const categories = [
    { name: "Café", icon: Coffee, color: "text-orange-400" },
    { name: "Sports", icon: Swords, color: "text-red-400" },
    { name: "Gaming", icon: Gamepad2, color: "text-blue-400" },
    { name: "Education", icon: BookOpen, color: "text-green-400" },
  ];

  const vibes = ["Neutral", "Chill", "Competitive", "Intellectual"];

  const handleHubChange = (e) => {
    const selectedHub = hubs.find((h) => h.id === e.target.value);
    setFormData({
      ...formData,
      hubId: e.target.value,
      hubName: selectedHub ? selectedHub.name : "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Strict Validation
    if (!selectedHubId) {
      alert("CRITICAL: Tactical Hub selection required.");
      return;
    }
    const selectedHub = hubs.find((h) => h.id === selectedHubId);
    if (!selectedHub) {
      alert("CRITICAL: Selected Hub data is invalid. Please re-select.");
      return;
    }
    if (!user?.city) {
      alert(
        "CRITICAL: Your sector (city) is unknown. Update your profile first.",
      );
      return;
    }
    if (!formData.title || formData.title.length > 60) {
      alert("CRITICAL: Title required (max 60 chars).");
      return;
    }
    if (!formData.objective) {
      alert("CRITICAL: Mission objective required.");
      return;
    }
    const maxCapacityNum = parseInt(formData.maxPlayers);
    if (isNaN(maxCapacityNum) || maxCapacityNum < 2 || maxCapacityNum > 20) {
      alert("CRITICAL: Max players must be between 2 and 20.");
      return;
    }

    setLoading(true);
    try {
      // Map gender requirement to proper case for rules
      const genderRequirementMap = {
        everyone: "Everyone",
        female: "Female",
        male: "Male",
      };

      // ✅ NEW: Validate start time is in the future
      const startTimeDate = new Date(formData.startTime);
      const now = new Date();

      if (startTimeDate <= now) {
        toast.error("Start time must be in the future! Choose a later time.", {
          icon: "⏰",
          duration: 4000,
        });
        setLoading(false);
        return;
      }

      const questData = {
        title: formData.title,
        objective: formData.objective,
        category: formData.category,
        difficulty: parseInt(formData.difficulty) || 1,
        duration: formData.duration || "60-90m",
        loot: formData.loot || "Bonus XP",
        vibeCheck: formData.vibeCheck || "Neutral",
        isPrivate: !!formData.isPrivate,
        genderRequirement:
          genderRequirementMap[formData.genderPreference] || "Everyone",
        genderPreference: formData.genderPreference || "everyone",
        maxPlayers: maxCapacityNum,
        startTime: startTimeDate, // Firestore Timestamp via SDK
        hostId: user.uid,
        hostName: user.name || user.displayName || "Unknown Hero",
        hubId: selectedHub.id,
        hubName: selectedHub.name,
        hubAddress: selectedHub.address,
        hubCategory: selectedHub.category,
        hubCity: selectedHub.city,
        hubCoordinates: selectedHub.coordinates
          ? {
              latitude: selectedHub.coordinates.latitude || 0,
              longitude: selectedHub.coordinates.longitude || 0,
            }
          : null,
        city: user.city,
        status: "open",
        verificationType: formData.verificationType || "3-step",
        secretCode: formData.secretCode || "",
      };

      // Ensure no undefined values enter the payload
      Object.keys(questData).forEach((key) => {
        if (questData[key] === undefined) questData[key] = null;
      });

      const questId = await createQuest(questData);
      navigate(`/board`);
    } catch (error) {
      console.error("Failed to post mission:", error);
      alert(`Mission Transmission Failed: ${error.message || "Unknown Error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg p-6 pb-24 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/5 blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate("/board")}
          className="p-3 glassmorphism rounded-xl hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-['Orbitron'] font-black text-white italic tracking-tighter uppercase">
            Post Mission
          </h1>
          <p className="text-[10px] text-gray-500 font-mono tracking-[0.2em] uppercase">
            Initialize Squadron Recruitment
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection */}
        <section className="space-y-3">
          <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2">
            Mission Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setFormData({ ...formData, category: cat.name })}
                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${
                  formData.category === cat.name
                    ? "bg-neon-purple/20 border-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                    : "glassmorphism border-white/5 opacity-50 gray-grayscale"
                }`}
              >
                <cat.icon
                  className={`w-5 h-5 ${
                    formData.category === cat.name ? cat.color : "text-gray-500"
                  }`}
                />
                <span className="font-bold text-xs uppercase tracking-widest">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Security Protocol (Private/Public) */}
        <section className="space-y-3">
          <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2 flex items-center gap-2">
            <Shield className="w-3 h-3" /> Security Protocol
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isPrivate: false })}
              className={`flex-1 p-4 rounded-2xl border transition-all ${
                !formData.isPrivate
                  ? "bg-green-500/20 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                  : "bg-black/40 border-white/5 opacity-50"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Globe
                  className={`w-4 h-4 ${
                    !formData.isPrivate ? "text-green-400" : "text-gray-500"
                  }`}
                />
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${
                    !formData.isPrivate ? "text-white" : "text-gray-500"
                  }`}
                >
                  Public
                </span>
              </div>
              <p className="text-[9px] text-gray-400 text-left leading-tight">
                Visible on Mission Board to all Agents.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, isPrivate: true })}
              className={`flex-1 p-4 rounded-2xl border transition-all ${
                formData.isPrivate
                  ? "bg-red-500/20 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  : "bg-black/40 border-white/5 opacity-50"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Lock
                  className={`w-4 h-4 ${
                    formData.isPrivate ? "text-red-400" : "text-gray-500"
                  }`}
                />
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${
                    formData.isPrivate ? "text-white" : "text-gray-500"
                  }`}
                >
                  Private
                </span>
              </div>
              <p className="text-[9px] text-gray-400 text-left leading-tight">
                Hidden from feed. Invite only via Code.
              </p>
            </button>
          </div>
        </section>

        {/* Squad Requirements (Gender Preference) */}
        <section className="space-y-3">
          <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2 flex items-center gap-2">
            <Users className="w-3 h-3" /> Squad Requirements
          </label>
          <div className="flex p-1 bg-black/40 border border-white/5 rounded-2xl">
            {["everyone", "female", "male"].map((pref) => (
              <button
                key={pref}
                type="button"
                onClick={() =>
                  setFormData({ ...formData, genderPreference: pref })
                }
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  formData.genderPreference === pref
                    ? "bg-neon-purple text-white shadow-lg"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                {pref === "everyone"
                  ? "Everyone"
                  : pref === "female"
                    ? "Females Only"
                    : "Males Only"}
              </button>
            ))}
          </div>
        </section>

        {/* Hub / Location */}
        <section className="space-y-3">
          <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2 flex items-center gap-2">
            <MapPin className="w-3 h-3" /> Tactical Hub (Cafe/Turf)
          </label>
          <div className="relative">
            <select
              value={selectedHubId}
              onChange={(e) => setSelectedHubId(e.target.value)}
              required
              className="w-full bg-black/40 border border-white/5 py-4 pl-4 pr-10 rounded-2xl text-white font-medium focus:border-neon-purple focus:outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">Select a hub</option>
              {hubs.map((hub) => (
                <option key={hub.id} value={hub.id} className="bg-[#0b0c10]">
                  {hub.name} - {hub.category}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <Plus className="w-4 h-4 text-gray-500" />
            </div>
          </div>
          {loadingHubs && (
            <p className="text-[10px] text-neon-purple italic px-2">
              Loading hubs...
            </p>
          )}
          {hubError && (
            <p className="text-[10px] text-red-400 italic px-2">{hubError}</p>
          )}
          <p className="text-[9px] text-gray-600 italic px-2">
            *Only verified hubs in {user?.city || "your sector"} are visible.
          </p>
        </section>

        {/* Basic Details */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2">
              Mission Title
            </label>
            <input
              type="text"
              placeholder="e.g., Casual Coffee & Tech Talk"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full bg-black/40 border border-white/5 py-4 px-4 rounded-2xl text-white font-medium focus:border-neon-purple focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2 flex items-center gap-2">
                <Clock className="w-3 h-3" /> Start Time
              </label>
              <div className="flex items-center gap-4 bg-black/40 border border-white/5 p-3 rounded-2xl backdrop-blur-md focus-within:border-neon-purple focus-within:shadow-[0_0_15px_#a855f7] transition-all duration-300 group">
                {/* DATE INPUT */}
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={
                    formData.startTime
                      ? (() => {
                          const d = new Date(formData.startTime);
                          // Ensure we get YYYY-MM-DD in local time
                          // format: YYYY-MM-DD
                          const year = d.getFullYear();
                          const month = String(d.getMonth() + 1).padStart(
                            2,
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
                    const hours = currentStart.getHours();
                    const minutes = currentStart.getMinutes();

                    const newDate = new Date(dateVal);
                    newDate.setHours(hours, minutes);

                    setFormData({
                      ...formData,
                      startTime: newDate.toISOString(),
                    });
                  }}
                  className="bg-transparent text-white font-mono text-sm outline-none w-full uppercase cursor-pointer"
                  style={{ colorScheme: "dark" }}
                />

                <div className="h-8 w-[1px] bg-white/10 group-focus-within:bg-neon-purple/50 transition-colors"></div>

                {/* TIME INPUT (Any Minute) */}
                <input
                  type="time"
                  required
                  value={
                    formData.startTime
                      ? (() => {
                          const d = new Date(formData.startTime);
                          // format: HH:mm
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
                    currentStart.setHours(h, m);

                    setFormData({
                      ...formData,
                      startTime: currentStart.toISOString(),
                    });
                  }}
                  className="bg-transparent text-white font-mono text-sm outline-none w-24 cursor-pointer text-center"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2 flex items-center gap-2">
                <Users className="w-3 h-3" /> Max Players
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={formData.maxPlayers}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxPlayers: parseInt(e.target.value) || 2,
                  })
                }
                className="w-full bg-black/40 border border-white/5 py-3.5 px-4 rounded-2xl text-white font-medium focus:border-neon-purple focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Mission Objective */}
        <section className="space-y-3">
          <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2 flex items-center gap-2">
            <Zap className="w-3 h-3 text-neon-purple" /> Mission Objective
          </label>
          <textarea
            placeholder="Describe what the squad will do..."
            rows="3"
            required
            value={formData.objective}
            onChange={(e) =>
              setFormData({ ...formData, objective: e.target.value })
            }
            className="w-full bg-black/40 border border-white/5 py-4 px-4 rounded-2xl text-white font-medium focus:border-neon-purple focus:outline-none transition-all resize-none italic"
          ></textarea>
        </section>

        {/* Difficulty & Loot */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2">
              Threat Level (1-5)
            </label>
            <div className="flex gap-2 p-2 glassmorphism rounded-2xl border border-white/5 justify-center">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setFormData({ ...formData, difficulty: lvl })}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black transition-all ${
                    formData.difficulty >= lvl
                      ? "bg-neon-purple text-white shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                      : "bg-white/5 text-gray-600"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Vibe Selection */}
        <section className="space-y-3">
          <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2">
            Mission Vibe
          </label>
          <div className="flex flex-wrap gap-2">
            {vibes.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setFormData({ ...formData, vibeCheck: v })}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  formData.vibeCheck === v
                    ? "bg-white text-black shadow-lg"
                    : "bg-white/5 text-gray-500 hover:text-white"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </section>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-5 rounded-2xl font-black italic tracking-[0.2em] text-lg uppercase flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4"
        >
          {loading ? (
            "Broadcasting..."
          ) : (
            <>
              Deploy Mission <Send className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateQuest;
