import { db, FieldValue } from "../server.js";
import { Timestamp } from "firebase-admin/firestore";

/**
 * Shop Item Catalog - Indian Marketplace
 * Categories: Real World (₹), Power-Ups, Cosmetics, Badges
 */
const SHOP_ITEMS = {
  // --- 🎟️ REAL WORLD (India) ---
  amazon_in_100: {
    id: "amazon_in_100",
    name: "Amazon ₹100",
    type: "voucher",
    cost: 10000,
    value: "₹100",
    icon: "📦",
    description: "Shopping voucher for Amazon India.",
    category: "real-world",
  },
  starbucks_in_250: {
    id: "starbucks_in_250",
    name: "Starbucks ₹250",
    type: "voucher",
    cost: 25000,
    value: "₹250",
    icon: "☕",
    description: "Coffee voucher valid at Starbucks India.",
    category: "real-world",
  },
  zomato_pro: {
    id: "zomato_pro",
    name: "Zomato Gold (1 Mo)",
    type: "voucher",
    cost: 15000,
    value: "1 Month",
    icon: "🍕",
    description: "Free delivery & discounts.",
    category: "real-world",
  },
  bookmyshow_200: {
    id: "bookmyshow_200",
    name: "Movie Ticket ₹200",
    type: "voucher",
    cost: 20000,
    value: "₹200",
    icon: "🎬",
    description: "Catch the latest Bollywood/Hollywood hit.",
    category: "real-world",
  },

  // --- ⚡ POWER-UPS ---
  streak_freeze: {
    id: "streak_freeze",
    name: "Streak Freeze",
    type: "consumable",
    cost: 500,
    icon: "❄️",
    description: "Missed a day? Keep your streak alive.",
    category: "powerup",
    inventoryKey: "streak_freeze",
  },
  xp_boost_2x: {
    id: "xp_boost_2x",
    name: "Neuro-Boost (2x)",
    type: "boost",
    cost: 1500,
    icon: "🚀",
    description: "Double XP on your NEXT completed quest.",
    category: "powerup",
  },

  // --- 🎨 COSMETICS ---
  neon_frame_01: {
    id: "neon_frame_01",
    name: "Cyberpunk Neon",
    type: "cosmetic",
    cost: 2500,
    icon: "👾",
    description: "A glowing neon border.",
    category: "cosmetic",
    inventoryKey: "frames",
  },
  gold_aura: {
    id: "gold_aura",
    name: "Midas Touch",
    type: "cosmetic",
    cost: 5000,
    icon: "👑",
    description: "Legendary gold shimmer.",
    category: "cosmetic",
    inventoryKey: "frames",
  },
  fire_aura: {
    id: "fire_aura",
    name: "Inferno",
    type: "cosmetic",
    cost: 4000,
    icon: "🔥",
    description: "Animated fire effect.",
    category: "cosmetic",
    inventoryKey: "frames",
  },

  // --- 🎖️ BADGES ---
  badge_whale: {
    id: "badge_whale",
    name: "The Whale",
    type: "badge",
    cost: 50000,
    icon: "💎",
    description: "Flex your wealth.",
    category: "badge",
  },
  badge_coffee: {
    id: "badge_coffee",
    name: "Caffeine Club",
    type: "badge",
    cost: 2000,
    icon: "☕",
    description: "Certified coffee addict.",
    category: "badge",
  },
  badge_dev: {
    id: "badge_dev",
    name: "Code Ninja",
    type: "badge",
    cost: 3000,
    icon: "💻",
    description: "Master of the keyboard.",
    category: "badge",
  },
};

/**
 * Buy Item Endpoint
 * Secure server-side purchase logic with transaction
 */
export const buyItem = async (req, res) => {
  const userId = req.user?.uid;
  const { itemId } = req.body;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (!itemId) {
    return res.status(400).json({ error: "Item ID is required" });
  }

  // Validate item exists
  const item = SHOP_ITEMS[itemId];
  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }

  const userStatsRef = db.collection("userStats").doc(userId);

  try {
    const result = await db.runTransaction(async (t) => {
      // 1. Read current user stats
      const statsSnap = await t.get(userStatsRef);

      if (!statsSnap.exists) {
        throw new Error("User stats not found");
      }

      const stats = statsSnap.data();
      const currentXP = stats.xp || 0;
      const currentInventory = stats.inventory || {};

      // 2. Validate sufficient funds
      if (currentXP < item.cost) {
        throw new Error(
          `Insufficient XP. You need ${item.cost} XP to purchase ${item.name}.`,
        );
      }

      // 3. Handle purchase based on item type
      let updatePayload;
      let resultData;

      // Calculate XP deduction (wallet only - does NOT affect weekly rankings or lifetime XP)
      const newXP = Math.max(0, currentXP - item.cost);

      if (item.type === "cosmetic") {
        // Check if already owned (for cosmetics like frames)
        const currentFrames = currentInventory.frames || [];
        if (currentFrames.includes(itemId)) {
          throw new Error("Item already owned");
        }

        // Add to frames array and auto-equip
        updatePayload = {
          xp: newXP,
          [`inventory.frames`]: FieldValue.arrayUnion(itemId),
          equippedFrame: itemId, // Auto-equip on purchase
          updatedAt: FieldValue.serverTimestamp(),
        };

        resultData = {
          newBalance: newXP,
          itemName: item.name,
          equipped: true,
        };
      } else if (item.type === "voucher") {
        // VOUCHER: Atomic coupon code grab
        // Query for ONE unused code for this itemId
        const couponQuery = await db
          .collection("coupon_codes")
          .where("itemId", "==", itemId)
          .where("isUsed", "==", false)
          .limit(1)
          .get();

        if (couponQuery.empty) {
          throw new Error("Out of Stock");
        }

        const couponDoc = couponQuery.docs[0];
        const couponData = couponDoc.data();

        // Mark coupon as USED atomically
        t.update(couponDoc.ref, {
          isUsed: true,
          usedBy: userId,
          usedAt: FieldValue.serverTimestamp(),
        });

        // Create redemption record with 30-day expiration
        const redemptionRef = db.collection("redemptions").doc();
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30); // 30 days from now

        t.set(redemptionRef, {
          userId,
          itemId,
          code: couponData.code,
          status: "approved",
          purchasedAt: FieldValue.serverTimestamp(),
          expiresAt: Timestamp.fromDate(expirationDate),
        });

        // Deduct XP only
        updatePayload = {
          xp: newXP,
          updatedAt: FieldValue.serverTimestamp(),
        };

        resultData = {
          newBalance: newXP,
          itemName: item.name,
          code: couponData.code,
          redemptionId: redemptionRef.id,
        };
      } else if (item.type === "boost") {
        // BOOST: Activate XP multiplier for next quest
        updatePayload = {
          xp: newXP,
          activeBoosts: {
            xpMultiplier: 2, // Double XP
            activatedAt: FieldValue.serverTimestamp(),
          },
          updatedAt: FieldValue.serverTimestamp(),
        };

        resultData = {
          newBalance: newXP,
          itemName: item.name,
          boost: "2x XP on next quest",
        };
      } else if (item.type === "badge") {
        // BADGE: Permanent achievement
        const currentBadges = currentInventory.badges || [];
        if (currentBadges.includes(itemId)) {
          throw new Error("Badge already owned");
        }

        updatePayload = {
          xp: newXP,
          ["inventory.badges"]: FieldValue.arrayUnion(itemId),
          updatedAt: FieldValue.serverTimestamp(),
        };

        resultData = {
          newBalance: newXP,
          itemName: item.name,
          badgeUnlocked: true,
        };
      } else {
        // Consumable items (existing logic)
        const currentItemCount = currentInventory[item.inventoryKey] || 0;
        const newItemCount = currentItemCount + 1;

        updatePayload = {
          xp: newXP,
          [`inventory.${item.inventoryKey}`]: newItemCount,
          updatedAt: FieldValue.serverTimestamp(),
        };

        resultData = {
          newBalance: newXP,
          itemCount: newItemCount,
          itemName: item.name,
        };
      }

      // 4. Atomic update to userStats (private)
      t.update(userStatsRef, updatePayload);

      // 5. Sync Public Profile (Leaderboard)
      // Leaderboard reads from 'users' collection, sync BOTH xp fields!
      const publicUserRef = db.collection("users").doc(userId);
      t.update(publicUserRef, {
        xp: newXP,
        thisWeekXP: newThisWeekXP,
      });

      return resultData;
    });

    console.log(
      `✅ [Shop] User ${userId} purchased ${result.itemName}. New balance: ${result.newBalance} XP`,
    );

    res.json({
      success: true,
      newBalance: result.newBalance,
      itemCount: result.itemCount,
      code: result.code, // For vouchers
      redemptionId: result.redemptionId, // For vouchers
      message: `${result.itemName} purchased successfully!`,
    });
  } catch (error) {
    console.error("Shop purchase error:", error);

    if (error.message.includes("Insufficient XP")) {
      return res.status(403).json({ error: error.message });
    }

    if (error.message.includes("Out of Stock")) {
      return res.status(503).json({ error: error.message });
    }

    res.status(500).json({
      error: error.message || "Failed to complete purchase",
    });
  }
};

/**
 * Seed Coupons (Admin Only)
 * Bulk insert coupon codes for a specific item
 */
export const seedCoupons = async (req, res) => {
  const { itemId, codes } = req.body;

  if (!itemId || !Array.isArray(codes) || codes.length === 0) {
    return res.status(400).json({ error: "itemId and codes array required" });
  }

  try {
    const batch = db.batch();

    codes.forEach((code) => {
      const docRef = db.collection("coupon_codes").doc();
      batch.set(docRef, {
        code,
        itemId,
        isUsed: false,
        usedBy: null,
        usedAt: null,
      });
    });

    await batch.commit();

    console.log(`✅ [Admin] Seeded ${codes.length} coupons for ${itemId}`);

    res.json({
      success: true,
      message: `${codes.length} coupons added for ${itemId}`,
    });
  } catch (error) {
    console.error("Seed coupons error:", error);
    res.status(500).json({ error: "Failed to seed coupons" });
  }
};

/**
 * Get User Redemptions
 * Fetch user's voucher purchases with codes
 */
export const getUserRedemptions = async (req, res) => {
  const userId = req.user?.uid;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    // Only fetch non-expired redemptions
    const redemptionsSnap = await db
      .collection("redemptions")
      .where("userId", "==", userId)
      .where("expiresAt", ">", Timestamp.now())
      .orderBy("expiresAt", "asc") // Soonest to expire first
      .get();

    const redemptions = redemptionsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ redemptions });
  } catch (error) {
    console.error("Get redemptions error:", error);

    // If index error, provide helpful message
    if (error.code === 9 || error.message.includes("index")) {
      console.error("❗ FIRESTORE INDEX REQUIRED:");
      console.error("   Collection: redemptions");
      console.error("   Fields: userId (=), expiresAt (>), expiresAt (asc)");
      console.error("   Check backend logs for index creation link");
    }

    res.status(500).json({ error: "Failed to fetch redemptions" });
  }
};
