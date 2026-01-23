import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../backend/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { ShoppingBag, Plus, Lock } from "lucide-react";

const ADMIN_UIDS = ["dh5BwkAg58VIu1zI1qtD3PJW1a62"];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    cost: "",
    type: "voucher",
    sku: "",
    imageUrl: "",
    stock: "",
  });

  // Helper to determine category from type
  const getCategoryFromType = (type) => {
    if (type === "voucher") return "real-world";
    if (type === "powerup") return "powerup";
    if (type === "cosmetic") return "cosmetic";
    return "other";
  };

  // Security Check
  if (!user || !ADMIN_UIDS.includes(user.uid)) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="glassmorphism-dark p-8 rounded-2xl border border-red-500/30 text-center max-w-md">
          <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-red-500 uppercase mb-2">
            Access Denied
          </h1>
          <p className="text-gray-400 text-sm font-mono">
            You do not have permission to access this dashboard.
          </p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addItemToShop = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !formData.title ||
      !formData.cost ||
      !formData.type ||
      !formData.sku ||
      !formData.stock
    ) {
      toast.error("All fields are required (except Image URL)");
      return;
    }

    const cost = parseInt(formData.cost);
    const stock = parseInt(formData.stock);

    if (isNaN(cost) || cost <= 0) {
      toast.error("Cost must be a positive number");
      return;
    }

    if (isNaN(stock) || stock < 0) {
      toast.error("Stock must be a non-negative number");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Adding item to shop...");

    try {
      // Add to Firestore shop_items collection
      const shopItemsRef = collection(db, "shop_items");
      await addDoc(shopItemsRef, {
        title: formData.title.trim(),
        cost: cost,
        type: formData.type,
        sku: formData.sku.trim(),
        category: getCategoryFromType(formData.type),
        imageUrl: formData.imageUrl.trim(),
        stock: stock,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });

      toast.success("Item added successfully!", { id: loadingToast });

      // Reset form
      setFormData({
        title: "",
        cost: "",
        type: "voucher",
        sku: "",
        imageUrl: "",
        stock: "",
      });
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error(error.message || "Failed to add item", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-['Orbitron'] font-black uppercase tracking-tighter">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-gray-400 text-sm font-mono">
            Manage shop inventory and items
          </p>
        </div>

        {/* Add Item Form */}
        <div className="glassmorphism-dark p-6 rounded-2xl border border-purple-500/30">
          <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-purple-500" />
            Add New Item
          </h2>

          <form onSubmit={addItemToShop} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Amazon ₹100 Gift Card"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
                disabled={isSubmitting}
              />
            </div>

            {/* Cost */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                Cost (XP)
              </label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleInputChange}
                placeholder="10000"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
                disabled={isSubmitting}
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                disabled={isSubmitting}
              >
                <option value="voucher">Voucher</option>
                <option value="cosmetic">Cosmetic</option>
                <option value="powerup">Power-up</option>
              </select>
            </div>

            {/* SKU */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                SKU (Item ID)
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                placeholder="amazon_in_100"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1 font-mono">
                Links to coupon_codes collection
              </p>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                Image URL
              </label>
              <input
                type="text"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/image.png"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
                disabled={isSubmitting}
              />
            </div>

            {/* Stock */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                Stock
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                placeholder="5"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-xl font-black uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2 ${
                isSubmitting
                  ? "bg-gray-800 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/50"
              }`}
            >
              <Plus className="w-5 h-5" />
              {isSubmitting ? "Adding..." : "Add Item to Shop"}
            </button>
          </form>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <p className="text-xs text-yellow-400 font-mono">
            <strong>⚠️ Note:</strong> Replace "YOUR_ACTUAL_UID_HERE" in the
            source code with your actual Firebase UID to grant yourself admin
            access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
