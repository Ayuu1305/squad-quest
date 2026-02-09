import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Star,
  MapPin,
  Building2,
  X,
  Save,
  User,
  Phone,
  ImageIcon,
} from "lucide-react";
import {
  getAllHubs,
  updateHub,
  deleteHub,
} from "../../backend/services/vendor.service";
import toast from "react-hot-toast";

const ManageHubs = () => {
  const navigate = useNavigate();
  const [hubs, setHubs] = useState([]);
  const [filteredHubs, setFilteredHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [editingHub, setEditingHub] = useState(null);
  const [deletingHub, setDeletingHub] = useState(null);

  // Fetch all hubs on mount
  useEffect(() => {
    fetchHubs();
  }, []);

  const fetchHubs = async () => {
    try {
      setLoading(true);
      const allHubs = await getAllHubs();
      setHubs(allHubs);
      setFilteredHubs(allHubs);
    } catch (error) {
      console.error("Failed to fetch hubs:", error);
      toast.error("Failed to load hubs");
    } finally {
      setLoading(false);
    }
  };

  // Filter hubs based on search and category
  useEffect(() => {
    let filtered = hubs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (hub) =>
          hub.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          hub.city?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Category filter
    if (categoryFilter !== "All") {
      filtered = filtered.filter((hub) => hub.category === categoryFilter);
    }

    setFilteredHubs(filtered);
  }, [searchTerm, categoryFilter, hubs]);

  const handleEdit = (hub) => {
    setEditingHub(hub);
  };

  const handleSaveEdit = async (updatedData) => {
    try {
      await updateHub(editingHub.id, updatedData);
      toast.success("Hub updated successfully!");
      setEditingHub(null);
      fetchHubs(); // Refresh list
    } catch (error) {
      console.error("Failed to update hub:", error);
      toast.error("Failed to update hub");
    }
  };

  const handleDelete = async (hubId) => {
    try {
      await deleteHub(hubId);
      toast.success("Hub deleted successfully!");
      setDeletingHub(null);
      fetchHubs(); // Refresh list
    } catch (error) {
      console.error("Failed to delete hub:", error);
      toast.error("Failed to delete hub");
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl font-['Orbitron'] font-black text-white uppercase mb-2">
          🏢 Hub Management
        </h1>
        <p className="text-gray-400">
          Manage all hubs in the system ({filteredHubs.length} total)
        </p>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search hubs by name or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:border-neon-purple focus:outline-none"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-purple focus:outline-none cursor-pointer"
        >
          <option value="All">All Categories</option>
          <option value="Café">Café</option>
          <option value="Sports">Sports</option>
          <option value="Gaming">Gaming</option>
          <option value="Education">Education</option>
        </select>

        {/* Add New Hub */}
        <button
          onClick={() => navigate("/hub/signup")}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-neon-purple hover:bg-purple-600 rounded-xl text-white font-bold transition"
        >
          <Plus className="w-4 h-4" />
          Add Hub
        </button>
      </div>

      {/* Hubs List */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-mono">Loading hubs...</p>
          </div>
        ) : filteredHubs.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">No hubs found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredHubs.map((hub) => (
              <HubCard
                key={hub.id}
                hub={hub}
                onEdit={() => handleEdit(hub)}
                onDelete={() => setDeletingHub(hub)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingHub && (
        <EditHubModal
          hub={editingHub}
          onSave={handleSaveEdit}
          onClose={() => setEditingHub(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deletingHub && (
        <DeleteConfirmModal
          hub={deletingHub}
          onConfirm={() => handleDelete(deletingHub.id)}
          onCancel={() => setDeletingHub(null)}
        />
      )}
    </div>
  );
};

// ===== SUB-COMPONENTS =====

const HubCard = ({ hub, onEdit, onDelete }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.01 }}
    className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center gap-6"
  >
    {/* Hub Image */}
    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-neon-purple/20 to-blue-600/20 flex-shrink-0">
      {hub.image ? (
        <img
          src={hub.image}
          alt={hub.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Building2 className="w-8 h-8 text-gray-600" />
        </div>
      )}
    </div>

    {/* Hub Details */}
    <div className="flex-1 min-w-0">
      <h3 className="text-xl font-bold text-white mb-1 truncate">{hub.name}</h3>
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-2">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{hub.city}</span>
        </span>
        <span className="px-2 py-0.5 bg-neon-purple/20 rounded-full text-neon-purple text-xs font-medium">
          {hub.category}
        </span>
        {hub.rating > 0 && (
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            {hub.rating.toFixed(1)}
          </span>
        )}
      </div>
      {hub.vendor && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {hub.vendor.ownerName}
          </span>
          {hub.vendor.phoneNumber && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {hub.vendor.phoneNumber}
            </span>
          )}
        </div>
      )}
    </div>

    {/* Actions */}
    <div className="flex gap-2 flex-shrink-0">
      <button
        onClick={onEdit}
        className="p-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl text-blue-400 transition group"
        title="Edit hub"
      >
        <Edit className="w-4 h-4 group-hover:scale-110 transition-transform" />
      </button>
      <button
        onClick={onDelete}
        className="p-3 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-400 transition group"
        title="Delete hub"
      >
        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  </motion.div>
);

const EditHubModal = ({ hub, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: hub.name || "",
    category: hub.category || "Café",
    address: hub.address || "",
    city: hub.city || "",
    rating: hub.rating || 0,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

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
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-lg bg-gradient-to-br from-[#0f0f23] to-[#1a1a2e] border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-['Orbitron'] font-black text-white uppercase">
              Edit Hub
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hub Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                Hub Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-purple focus:outline-none"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-purple focus:outline-none cursor-pointer"
                required
              >
                <option value="Café">Café</option>
                <option value="Sports">Sports</option>
                <option value="Gaming">Gaming</option>
                <option value="Education">Education</option>
              </select>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                Address *
              </label>
              <textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                rows="2"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-purple focus:outline-none resize-none"
                required
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-purple focus:outline-none"
                required
              />
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center gap-2">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                Rating *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rating: parseFloat(e.target.value),
                  })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-purple focus:outline-none"
                required
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-neon-purple hover:bg-purple-600 rounded-xl text-white font-bold transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const DeleteConfirmModal = ({ hub, onConfirm, onCancel }) => (
  <AnimatePresence>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-md bg-gradient-to-br from-red-900/20 to-black border border-red-500/30 rounded-3xl p-8 shadow-2xl"
      >
        {/* Warning Icon */}
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-8 h-8 text-red-500" />
        </div>

        {/* Header */}
        <h2 className="text-2xl font-['Orbitron'] font-black text-white uppercase text-center mb-2">
          Delete Hub?
        </h2>

        {/* Warning */}
        <p className="text-gray-400 text-center mb-6">
          Are you sure you want to delete{" "}
          <span className="text-white font-bold">"{hub.name}"</span>? This
          action cannot be undone.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-white font-bold transition"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  </AnimatePresence>
);

export default ManageHubs;
