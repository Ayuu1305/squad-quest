import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, MapPin, Star, Tag } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../backend/firebaseConfig";
import { useGame } from "../context/GameContext";

const HubSelectionModal = ({ isOpen, onClose, onSelect }) => {
  const { city } = useGame();
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHub, setSelectedHub] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    if (!isOpen) return;

    const fetchHubs = async () => {
      try {
        setLoading(true);
        const hubsRef = collection(db, "hubs");

        // Filter by city if available
        let q;
        if (city) {
          q = query(hubsRef, where("city", "==", city));
        } else {
          q = hubsRef;
        }

        const snapshot = await getDocs(q);
        const hubsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setHubs(hubsList);
      } catch (error) {
        console.error("Failed to fetch hubs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHubs();
  }, [isOpen, city]);

  // Available categories
  const categories = ["All", "Café", "Sports", "Gaming", "Education"];

  // Filter hubs based on search term AND category
  const filteredHubs = hubs.filter((hub) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      hub.name?.toLowerCase().includes(searchLower) ||
      hub.address?.toLowerCase().includes(searchLower) ||
      hub.category?.toLowerCase().includes(searchLower);

    const matchesCategory =
      selectedCategory === "All" || hub.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleConfirm = () => {
    if (selectedHub) {
      onSelect(selectedHub);
      setSelectedHub(null);
      setSearchTerm("");
      setSelectedCategory("All");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-[#0f0f23] to-[#1a1a2e] border border-neon-purple/30 rounded-3xl shadow-2xl shadow-neon-purple/20 overflow-hidden"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-[#0f0f23] to-[#1a1a2e] border-b border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-['Orbitron'] font-black text-white uppercase tracking-tight">
                  Select Mission Hub
                </h2>
                <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mt-1">
                  {city || "All Cities"} • {filteredHubs.length} Available
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name, address, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-white/10 py-3 pl-12 pr-4 rounded-2xl text-white placeholder-gray-600 focus:border-neon-purple focus:outline-none transition-all"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? "bg-neon-purple text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                      : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-250px)] p-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin" />
                  <p className="text-gray-500 font-mono text-sm">
                    Loading Hubs...
                  </p>
                </div>
              </div>
            ) : filteredHubs.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 font-mono text-sm">
                    No hubs found in {city || "your area"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredHubs.map((hub) => (
                  <motion.button
                    key={hub.id}
                    onClick={() => setSelectedHub(hub)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`group relative overflow-hidden rounded-2xl border-2 transition-all text-left ${
                      selectedHub?.id === hub.id
                        ? "border-neon-purple bg-neon-purple/10 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                        : "border-white/10 bg-black/40 hover:border-neon-purple/50"
                    }`}
                  >
                    {/* Hub Image */}
                    <div className="relative h-32 bg-gradient-to-br from-neon-purple/20 to-blue-600/20 overflow-hidden">
                      {hub.image ? (
                        <img
                          src={hub.image}
                          alt={hub.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <MapPin className="w-12 h-12 text-neon-purple/30" />
                        </div>
                      )}

                      {/* Category Tag */}
                      <div className="absolute top-2 left-2 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full border border-white/20">
                        <span className="text-[9px] font-black uppercase text-white tracking-wider flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {hub.category}
                        </span>
                      </div>

                      {/* Rating (if available) */}
                      {hub.rating && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-500/90 backdrop-blur-sm rounded-full">
                          <span className="text-[10px] font-black text-black flex items-center gap-1">
                            <Star className="w-3 h-3 fill-black" />
                            {hub.rating}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Hub Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-white text-sm mb-1 line-clamp-1">
                        {hub.name}
                      </h3>
                      <p className="text-xs text-gray-400 flex items-start gap-1 line-clamp-2">
                        <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {hub.address}
                      </p>
                    </div>

                    {/* Selection Indicator */}
                    {selectedHub?.id === hub.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-6 h-6 bg-neon-purple rounded-full flex items-center justify-center"
                      >
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gradient-to-t from-[#0f0f23] via-[#0f0f23] to-transparent border-t border-white/10 p-6">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-6 bg-white/5 border border-white/10 rounded-xl text-white font-bold uppercase text-sm tracking-wider hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedHub}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-neon-purple to-blue-600 rounded-xl text-white font-black uppercase text-sm tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Confirm Selection
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default HubSelectionModal;
