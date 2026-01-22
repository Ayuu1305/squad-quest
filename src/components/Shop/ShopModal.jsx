import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../backend/firebaseConfig";
// import { getAuth } from "firebase/auth";
import toast from "react-hot-toast";
import { ShoppingBag, Gift } from "lucide-react";

// Shop Items Catalog (matches backend)
const SHOP_ITEMS = {
  amazon_in_100: {
    id: "amazon_in_100",
    name: "Amazon ₹100",
    type: "voucher",
    cost: 10000,
    value: "₹100",
    icon: "📦",
    category: "real-world",
  },
  starbucks_in_250: {
    id: "starbucks_in_250",
    name: "Starbucks ₹250",
    type: "voucher",
    cost: 25000,
    value: "₹250",
    icon: "☕",
    category: "real-world",
  },
  zomato_pro: {
    id: "zomato_pro",
    name: "Zomato Gold",
    type: "voucher",
    cost: 15000,
    value: "1 Month",
    icon: "🍕",
    category: "real-world",
  },
  bookmyshow_200: {
    id: "bookmyshow_200",
    name: "Movie Ticket ₹200",
    type: "voucher",
    cost: 20000,
    value: "₹200",
    icon: "🎬",
    category: "real-world",
  },
  streak_freeze: {
    id: "streak_freeze",
    name: "Streak Freeze",
    type: "consumable",
    cost: 500,
    icon: "❄️",
    category: "powerup",
  },
  xp_boost_2x: {
    id: "xp_boost_2x",
    name: "Neuro-Boost (2x)",
    type: "boost",
    cost: 1500,
    icon: "🚀",
    category: "powerup",
  },
  neon_frame_01: {
    id: "neon_frame_01",
    name: "Cyberpunk Neon",
    type: "cosmetic",
    cost: 2500,
    icon: "👾",
    category: "cosmetic",
  },
  gold_aura: {
    id: "gold_aura",
    name: "Midas Touch",
    type: "cosmetic",
    cost: 5000,
    icon: "👑",
    category: "cosmetic",
  },
  fire_aura: {
    id: "fire_aura",
    name: "Inferno",
    type: "cosmetic",
    cost: 4000,
    icon: "🔥",
    category: "cosmetic",
  },
  badge_whale: {
    id: "badge_whale",
    name: "The Whale",
    type: "badge",
    cost: 50000,
    icon: "💎",
    category: "badge",
  },
  badge_coffee: {
    id: "badge_coffee",
    name: "Caffeine Club",
    type: "badge",
    cost: 2000,
    icon: "☕",
    category: "badge",
  },
  badge_dev: {
    id: "badge_dev",
    name: "Code Ninja",
    type: "badge",
    cost: 3000,
    icon: "💻",
    category: "badge",
  },
};

/**
 * ShopModal Component - Shop with Voucher Support
 * Tabs: Buy Items | My Rewards
 */
const ShopModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [processingItem, setProcessingItem] = useState(null);
  const [activeTab, setActiveTab] = useState("buy"); // 'buy' | 'rewards'
  const [activeCategory, setActiveCategory] = useState("all"); // 'all' | 'real-world' | 'powerup' | 'cosmetic' | 'badge'
  const [redemptions, setRedemptions] = useState([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);

  // Extract user stats safely
  const userXP = user?.xp || 0;

  // Filter items by category
  const filteredItems = Object.values(SHOP_ITEMS).filter((item) =>
    activeCategory === "all" ? true : item.category === activeCategory,
  );

  // Fetch redemptions when switching to My Rewards tab
  useEffect(() => {
    if (activeTab === "rewards" && isOpen) {
      fetchRedemptions();
    }
  }, [activeTab, isOpen]);

  // Date formatting helper
  const formatExpiryDate = (timestamp) => {
    if (!timestamp) return "Lifetime";

    try {
      let date;

      // Handle Firestore Timestamp object
      if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      }
      // Handle _seconds (alternative format)
      else if (timestamp._seconds) {
        date = new Date(timestamp._seconds * 1000);
      }
      // Handle Date object or string
      else if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === "string") {
        date = new Date(timestamp);
      } else {
        return "Lifetime";
      }

      // Format as "DD MMM YYYY" (e.g., "22 Feb 2026")
      const day = date.getDate().toString().padStart(2, "0");
      const month = date.toLocaleString("en-US", { month: "short" });
      const year = date.getFullYear();

      return `${day} ${month} ${year}`;
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Lifetime";
    }
  };

  // Check if expiring soon (less than 3 days)
  const isExpiringSoon = (timestamp) => {
    if (!timestamp) return false;

    try {
      let expiryDate;

      if (timestamp.seconds) {
        expiryDate = new Date(timestamp.seconds * 1000);
      } else if (timestamp._seconds) {
        expiryDate = new Date(timestamp._seconds * 1000);
      } else {
        expiryDate = new Date(timestamp);
      }

      const now = new Date();
      const threeDaysFromNow = new Date(
        now.getTime() + 3 * 24 * 60 * 60 * 1000,
      );

      return expiryDate <= threeDaysFromNow;
    } catch (error) {
      return false;
    }
  };

  const fetchRedemptions = async () => {
    setLoadingRedemptions(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      const response = await fetch(`${API_URL}/shop/redemptions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch redemptions");

      const data = await response.json();
      setRedemptions(data.redemptions || []);
    } catch (error) {
      console.error("Fetch redemptions error:", error);
      toast.error("Failed to load rewards");
    } finally {
      setLoadingRedemptions(false);
    }
  };

  const handleBuy = async (itemId) => {
    if (!user?.uid) {
      toast.error("You must be logged in to purchase items");
      return;
    }

    if (processingItem) return; // Prevent double-click

    setProcessingItem(itemId);
    const loadingToast = toast.loading("Processing purchase...");

    try {
      // 🔒 SECURE: Call backend API instead of client-side transaction
      if (!auth.currentUser) {
        throw new Error("Authentication failed. Please log in again.");
      }

      const token = await auth.currentUser.getIdToken();
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      const response = await fetch(`${API_URL}/shop/buy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemId: itemId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle out-of-stock error
        if (response.status === 503) {
          throw new Error("Out of Stock - Check back later!");
        }
        throw new Error(data.error || "Failed to purchase item");
      }

      // ✅ SUCCESS FEEDBACK
      toast.success(
        data.code
          ? `${data.itemName || "Item"} Acquired! Code: ${data.code} 🎁`
          : `${data.itemName || "Item"} Acquired! 🛡️`,
        {
          id: loadingToast,
          icon: "✨",
          duration: 5000,
        },
      );

      // If voucher, switch to rewards tab
      if (data.code) {
        setTimeout(() => {
          setActiveTab("rewards");
        }, 2000);
      } else {
        // Close modal after successful purchase (non-voucher)
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (error) {
      console.error("Purchase failed:", error);
      toast.error(error.message || "Failed to purchase item", {
        id: loadingToast,
      });
    } finally {
      setProcessingItem(null);
    }
  };

  if (!isOpen) return null;

  //   const auth = getAuth();
  // if (auth.currentUser) {
  //   auth.currentUser.getIdToken().then(token => {
  //     console.log("🔑 YOUR TOKEN:", token);
  //   });
  // }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900/95 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full border-2 border-fuchsia-500/30 shadow-2xl shadow-fuchsia-500/20 relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Neon Glow Effect */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-fuchsia-500/0 via-fuchsia-500/20 to-purple-500/0 rounded-2xl blur-sm" />

        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.03)_10px,rgba(255,255,255,0.03)_11px)]" />
        </div>

        <div className="relative z-10 flex flex-col h-full min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black font-['Orbitron'] text-white uppercase tracking-tighter italic flex items-center gap-2">
              <span className="text-fuchsia-400">⚡</span>
              Squad Shop
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-fuchsia-400 transition-colors text-3xl font-bold leading-none"
            >
              ×
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("buy")}
              className={`flex-1 py-3 px-4 rounded-xl font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === "buy"
                  ? "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Buy Items
            </button>
            <button
              onClick={() => setActiveTab("rewards")}
              className={`flex-1 py-3 px-4 rounded-xl font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === "rewards"
                  ? "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              <Gift className="w-4 h-4" />
              My Rewards
            </button>
          </div>

          {/* User XP Display (Buy Tab Only) */}
          {activeTab === "buy" && (
            <div className="glassmorphism-dark rounded-xl p-4 mb-6 border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/5 to-transparent">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-mono text-sm uppercase tracking-wider">
                  Your Balance
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 font-mono">
                    {userXP}
                  </span>
                  <span className="text-yellow-400 font-bold text-sm">XP</span>
                </div>
              </div>
            </div>
          )}

          {/* Custom Scrollbar Styles */}
          <style>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
              height: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.05);
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(168, 85, 247, 0.5);
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(168, 85, 247, 0.8);
            }
          `}</style>

          {/* Category Pills (Buy Tab Only) */}
          {activeTab === "buy" && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-4 pt-2 px-1 custom-scrollbar shrink-0">
              {[
                { id: "all", label: "All", icon: "🛍️" },
                { id: "real-world", label: "Vouchers", icon: "🎟️" },
                { id: "powerup", label: "Boosts", icon: "⚡" },
                { id: "cosmetic", label: "Style", icon: "🎨" },
                { id: "badge", label: "Badges", icon: "🎖️" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all border ${
                    activeCategory === cat.id
                      ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg border-transparent translate-y-[-1px]"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 border-transparent hover:border-white/10"
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* Content Area */}
          {activeTab === "buy" ? (
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1 min-h-0">
              {filteredItems.map((item) => (
                <ShopItemCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  icon={item.icon}
                  description={SHOP_ITEMS[item.id]?.description || ""}
                  cost={item.cost}
                  value={item.value}
                  userXP={userXP}
                  type={item.type}
                  category={item.category}
                  isOwned={
                    item.type === "cosmetic"
                      ? user?.inventory?.frames?.includes(item.id)
                      : item.type === "badge"
                        ? user?.inventory?.badges?.includes(item.id)
                        : false
                  }
                  inventoryCount={
                    item.type === "consumable"
                      ? user?.inventory?.streak_freeze || 0
                      : undefined
                  }
                  onBuy={handleBuy}
                  isPurchasing={processingItem === item.id}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 min-h-0">
              {loadingRedemptions ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-400 font-mono">Loading...</div>
                </div>
              ) : redemptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Gift className="w-16 h-16 text-gray-600 mb-4" />
                  <p className="text-gray-400 font-mono text-sm">
                    No rewards yet. Purchase vouchers to get started!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {redemptions.map((redemption) => (
                    <div
                      key={redemption.id}
                      className="glassmorphism rounded-xl p-4 border border-green-500/30 bg-gradient-to-br from-green-500/10 to-transparent"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-white text-sm mb-1">
                            {redemption.itemId === "starbucks_05"
                              ? "☕ Starbucks $5"
                              : redemption.itemId}
                          </h3>
                          <span className="text-xs text-green-400 font-mono uppercase border border-green-500/30 px-2 py-0.5 rounded bg-green-500/10">
                            {redemption.status}
                          </span>
                        </div>
                        <span className="text-2xl">✅</span>
                      </div>
                      <div className="bg-black/40 rounded-lg p-3 border border-green-500/20 mb-2">
                        <p className="text-xs text-gray-400 font-mono mb-1">
                          Coupon Code:
                        </p>
                        <p className="text-lg font-black text-green-400 font-mono tracking-wider">
                          {redemption.code}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-green-500/20">
                        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
                          Valid Until
                        </p>
                        <p
                          className={`text-xs font-bold font-mono ${
                            isExpiringSoon(redemption.expiresAt)
                              ? "text-red-400"
                              : "text-green-400"
                          }`}
                        >
                          {formatExpiryDate(redemption.expiresAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Unlocked Collectibles Section */}
              {!loadingRedemptions &&
                (user?.inventory?.badges?.length > 0 ||
                  user?.inventory?.frames?.length > 0) && (
                  <div className="mt-6">
                    <h3 className="text-sm font-black text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span>🏆</span> Unlocked Collectibles
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Badges */}
                      {user?.inventory?.badges?.map((badgeId) => {
                        const badge = SHOP_ITEMS[badgeId];
                        if (!badge) return null;
                        return (
                          <div
                            key={badgeId}
                            className="glassmorphism rounded-lg p-3 border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent"
                          >
                            <div className="text-3xl mb-1 text-center">
                              {badge.icon}
                            </div>
                            <p className="text-xs font-bold text-white text-center mb-1">
                              {badge.name}
                            </p>
                            <p className="text-[10px] text-purple-400 uppercase tracking-wider text-center">
                              Badge
                            </p>
                          </div>
                        );
                      })}

                      {/* Cosmetics */}
                      {user?.inventory?.frames
                        ?.filter((frameId) => SHOP_ITEMS[frameId])
                        .map((frameId) => {
                          const cosmetic = SHOP_ITEMS[frameId];
                          if (!cosmetic) return null;
                          return (
                            <div
                              key={frameId}
                              className="glassmorphism rounded-lg p-3 border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/10 to-transparent"
                            >
                              <div className="text-3xl mb-1 text-center">
                                {cosmetic.icon}
                              </div>
                              <p className="text-xs font-bold text-white text-center mb-1">
                                {cosmetic.name}
                              </p>
                              <p className="text-[10px] text-fuchsia-400 uppercase tracking-wider text-center">
                                Cosmetic
                              </p>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ShopItemCard = ({
  id,
  name,
  icon,
  description,
  cost,
  value, // For vouchers (₹100, ₹250, etc.)
  userXP,
  inventoryCount = 0,
  isOwned = false,
  isEquipped = false,
  type = "consumable", // 'consumable' | 'cosmetic' | 'voucher' | 'boost' | 'badge'
  category,
  onBuy,
  isPurchasing,
}) => {
  const canAfford = userXP >= cost;
  const showOwned = (type === "cosmetic" || type === "badge") && isOwned;

  return (
    <div className="glassmorphism rounded-2xl p-6 relative overflow-hidden border-2 border-purple-500/30 bg-gradient-to-br from-purple-900/20 via-fuchsia-900/10 to-transparent">
      {/* Animated Glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-fuchsia-500/10 rounded-full blur-3xl animate-pulse" />

      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-4">
          {/* Glowing Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full animate-pulse" />
            <div className="relative text-4xl sm:text-5xl drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]">
              {icon}
            </div>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black font-['Orbitron'] text-white uppercase tracking-tighter italic">
              {name}
              {value && (
                <span className="ml-2 text-green-400 font-mono">{value}</span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-purple-300 font-mono uppercase tracking-wide">
                {type}
              </span>
              {type === "consumable" && inventoryCount > 0 && (
                <span className="text-xs bg-purple-500/20 text-purple-200 px-2 py-0.5 rounded border border-purple-500/30">
                  Owned: {inventoryCount}
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-gray-300 text-sm mb-4 leading-relaxed font-mono">
          {description}
        </p>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 glassmorphism-dark rounded-lg px-4 py-2 border border-yellow-500/20">
            <span className="text-yellow-400 text-2xl font-black font-mono">
              {cost}
            </span>
            <span className="text-yellow-300 font-bold text-xs uppercase">
              XP
            </span>
          </div>

          <button
            onClick={() => onBuy(id)}
            disabled={!canAfford || isPurchasing || showOwned}
            className={`px-5 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs transition-all transform relative overflow-hidden ${
              showOwned
                ? "bg-gray-700 text-gray-400 border border-gray-600 cursor-not-allowed" // Owned State
                : canAfford && !isPurchasing
                  ? "bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white shadow-lg shadow-fuchsia-500/50 hover:scale-105"
                  : "bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700"
            }`}
          >
            <span className="relative z-10">
              {isPurchasing && !showOwned
                ? "Processing..."
                : showOwned
                  ? "Equipped"
                  : canAfford
                    ? "Buy Now"
                    : "Insufficient XP"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopModal;
