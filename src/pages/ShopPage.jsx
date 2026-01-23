import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../backend/firebaseConfig";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import toast from "react-hot-toast";
import { ShoppingBag, Gift, Loader } from "lucide-react";
import SEO from "../components/SEO"; // Added SEO Import

/**
 * ShopPage Component - Full Page Shop with Voucher Support
 * Tabs: Buy Items | My Rewards
 * Data Source: Firestore shop_items collection
 */
const ShopPage = () => {
  const { user } = useAuth();
  const [processingItem, setProcessingItem] = useState(null);
  const [activeTab, setActiveTab] = useState("buy"); // 'buy' | 'rewards'
  const [activeCategory, setActiveCategory] = useState("all"); // 'all' | 'real-world' | 'powerup' | 'cosmetic' | 'badge'
  const [redemptions, setRedemptions] = useState([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);

  // Firestore data
  const [shopItems, setShopItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // Extract user stats safely
  const userXP = user?.xp || 0;

  // Fetch shop items from Firestore
  useEffect(() => {
    const q = query(collection(db, "shop_items"), orderBy("cost", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setShopItems(items);
        setLoadingItems(false);
      },
      (error) => {
        console.error("Error fetching shop items:", error);
        setLoadingItems(false);
        toast.error("Failed to load shop items");
      },
    );

    return () => unsubscribe();
  }, []);

  // Filter items by category
  const filteredItems = shopItems.filter((item) =>
    activeCategory === "all" ? true : item.category === activeCategory,
  );

  // Fetch redemptions when switching to My Rewards tab
  useEffect(() => {
    if (activeTab === "rewards") {
      fetchRedemptions();
    }
  }, [activeTab]);

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
          sku: shopItems.find((item) => item.id === itemId)?.sku, // Include SKU for backend
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
      console.log("✅ [Shop] Purchase successful", data);
      console.log("🛒 [Shop] Server Response Item Count:", data.itemCount);
      console.log(
        "👤 [Shop] Current User Inventory BEFORE update:",
        user?.inventory,
      );

      if (data.newBalance !== undefined) {
        // Optimistically update XP provided by AuthContext or local state if available
        // Note: AuthContext usually handles this via listener, but this provides immediate feedback if connected
        console.log(`💰 [Shop] Updating XP locally to ${data.newBalance}`);
      }

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

  return (
    <div
      className="min-h-screen bg-dark-bg text-white relative overflow-x-hidden"
      style={{
        paddingBottom: "140px",
        paddingTop: "env(safe-area-inset-top, 60px)",
      }}
    >
      <SEO title="Shop" description="Spend your XP on rewards and cosmetics." />

      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.03)_10px,rgba(255,255,255,0.03)_11px)]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-block px-4 py-1 bg-fuchsia-500/20 rounded-full border border-fuchsia-500/40 mb-4">
            <span className="text-[10px] font-black text-fuchsia-400 uppercase tracking-[0.3em]">
              Reward Center
            </span>
          </div>
          <h1 className="text-5xl font-['Orbitron'] font-black text-white italic tracking-tighter uppercase mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            SQUAD SHOP
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 max-w-md mx-auto">
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
          <div className="glassmorphism-dark rounded-xl p-4 mb-6 border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/5 to-transparent max-w-md mx-auto">
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
          <div className="flex gap-2 mb-6 overflow-x-auto pb-4 pt-2 px-1 custom-scrollbar">
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
          <div className="space-y-4">
            {loadingItems ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 text-purple-500 animate-spin" />
                <p className="ml-3 text-gray-400 font-mono text-sm">
                  Loading shop items...
                </p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 font-mono text-sm">
                  No items available in this category
                </p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <ShopItemCard
                  key={item.id}
                  id={item.id}
                  name={item.title}
                  imageUrl={item.imageUrl}
                  icon={item.icon || "🎁"}
                  description={item.description || ""}
                  cost={item.cost}
                  value={item.value}
                  userXP={userXP}
                  type={item.type}
                  category={item.category}
                  isOwned={
                    item.type === "cosmetic"
                      ? user?.inventory?.frames?.includes(item.sku || item.id)
                      : item.type === "badge"
                        ? user?.inventory?.badges?.includes(item.sku || item.id)
                        : false
                  }
                  inventoryCount={
                    item.type === "consumable" ||
                    item.type === "powerup" ||
                    item.type === "boost" ||
                    item.category === "powerup"
                      ? (() => {
                          // 🔥 CRITICAL: Match backend logic for inventory key
                          const title = (item.title || "").toLowerCase();
                          if (
                            title.includes("streak freeze") ||
                            title.includes("streak_freeze") ||
                            item.sku === "streak_freeze"
                          ) {
                            return user?.inventory?.streak_freeze || 0;
                          }
                          // Neuro-Boost: Check SKU first, then type/category
                          if (
                            item.sku === "xp_boost_2x" ||
                            item.type === "boost" ||
                            item.type === "powerup" ||
                            item.category === "powerup"
                          ) {
                            // Check BOTH keys to handle legacy/mismatched data
                            // Check inventory keys AND active status
                            const invCount =
                              (user?.inventory?.neuro_boost || 0) +
                              (user?.inventory?.["xp_boost_2x"] || 0);
                            return invCount;
                          }
                          return user?.inventory?.[item.sku] || 0;
                        })()
                      : undefined
                  }
                  onBuy={handleBuy}
                  isPurchasing={processingItem === item.id}
                />
              ))
            )}
          </div>
        ) : (
          <div>
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
                {redemptions
                  .sort((a, b) => {
                    // Safety helper
                    const getDate = (dateField) => {
                      if (!dateField) return new Date(0); // Expired if missing
                      if (dateField.toDate) return dateField.toDate();
                      return new Date(dateField);
                    };

                    const now = new Date();
                    const aDate = getDate(a.expiresAt);
                    const bDate = getDate(b.expiresAt);

                    const aExpired = aDate < now;
                    const bExpired = bDate < now;
                    return aExpired === bExpired ? 0 : aExpired ? 1 : -1;
                  })
                  .map((redemption) => {
                    // Same safety helper here
                    const getDate = (dateField) => {
                      if (!dateField) return new Date(0);
                      if (dateField.toDate) return dateField.toDate();
                      return new Date(dateField);
                    };

                    const expiresAtDate = getDate(redemption.expiresAt);
                    const isExpired = expiresAtDate < new Date();

                    return (
                      <div
                        key={redemption.id}
                        className={`glassmorphism rounded-xl p-4 border ${
                          isExpired
                            ? "border-gray-600/30 bg-gray-800/10 opacity-60"
                            : "border-green-500/30 bg-gradient-to-br from-green-500/10 to-transparent"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3
                              className={`font-bold text-sm mb-1 ${
                                isExpired ? "text-gray-400" : "text-white"
                              }`}
                            >
                              {(() => {
                                const item = shopItems.find(
                                  (i) =>
                                    i.id === redemption.itemId ||
                                    i.sku === redemption.itemId,
                                );
                                return item?.title || redemption.itemId;
                              })()}
                            </h3>
                            <span
                              className={`text-xs font-mono uppercase border px-2 py-0.5 rounded ${
                                isExpired
                                  ? "text-red-400 border-red-500/30 bg-red-500/10"
                                  : "text-green-400 border-green-500/30 bg-green-500/10"
                              }`}
                            >
                              {isExpired ? "EXPIRED" : redemption.status}
                            </span>
                          </div>
                          <span className="text-2xl">
                            {isExpired ? "🚫" : "✅"}
                          </span>
                        </div>
                        <div
                          className={`rounded-lg p-3 border mb-2 ${
                            isExpired
                              ? "bg-gray-900/40 border-gray-600/20"
                              : "bg-black/40 border-green-500/20"
                          }`}
                        >
                          <p className="text-xs text-gray-500 font-mono mb-1">
                            Coupon Code:
                          </p>
                          <p
                            className={`text-lg font-black font-mono tracking-wider ${
                              isExpired
                                ? "text-gray-500 line-through"
                                : "text-green-400"
                            }`}
                          >
                            {redemption.code}
                          </p>
                        </div>
                        <div
                          className={`flex items-center justify-between mt-2 pt-2 border-t ${
                            isExpired
                              ? "border-gray-600/20"
                              : "border-green-500/20"
                          }`}
                        >
                          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                            {isExpired ? "Expired On" : "Valid Until"}
                          </p>
                          <p
                            className={`text-xs font-bold font-mono ${
                              isExpired ? "text-red-400" : "text-green-400"
                            }`}
                          >
                            {formatExpiryDate(redemption.expiresAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
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
                      const badge = shopItems.find(
                        (item) => item.id === badgeId || item.sku === badgeId,
                      );
                      if (!badge) return null;
                      return (
                        <div
                          key={badgeId}
                          className="glassmorphism rounded-lg p-3 border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent"
                        >
                          <div className="text-3xl mb-1 text-center">
                            {badge.icon || "🎁"}
                          </div>
                          <p className="text-xs font-bold text-white text-center mb-1">
                            {badge.title || badge.name}
                          </p>
                          <p className="text-[10px] text-purple-400 uppercase tracking-wider text-center">
                            Badge
                          </p>
                        </div>
                      );
                    })}

                    {/* Cosmetics */}
                    {user?.inventory?.frames?.map((frameId) => {
                      const cosmetic = shopItems.find(
                        (item) => item.id === frameId || item.sku === frameId,
                      );
                      if (!cosmetic) return null;
                      return (
                        <div
                          key={frameId}
                          className="glassmorphism rounded-lg p-3 border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/10 to-transparent"
                        >
                          <div className="text-3xl mb-1 text-center">
                            {cosmetic.icon || "🎁"}
                          </div>
                          <p className="text-xs font-bold text-white text-center mb-1">
                            {cosmetic.title || cosmetic.name}
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
  );
};

const ShopItemCard = ({
  id,
  name,
  imageUrl,
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
          {/* Glowing Icon or Image */}
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full animate-pulse" />
            <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={name}
                  className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                />
              ) : (
                <div className="text-4xl sm:text-5xl drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]">
                  {icon}
                </div>
              )}
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
              {(type === "consumable" ||
                type === "boost" ||
                type === "powerup") &&
                inventoryCount > 0 && (
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

export default ShopPage;
