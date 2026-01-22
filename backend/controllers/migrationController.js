import { db, FieldValue } from "../server.js";

// Shop Items costs for calculating spent XP
const SHOP_ITEMS_COSTS = {
  streak_freeze: 500,
  neon_frame_01: 2500,
  gold_aura: 5000,
  fire_aura: 4000,
  badge_whale: 50000,
  badge_coffee: 2000,
  badge_dev: 3000,
  amazon_in_100: 10000,
  starbucks_in_250: 25000,
  zomato_pro: 15000,
  bookmyshow_200: 20000,
  xp_boost_2x: 1500,
};

/**
 * Migration endpoint to restore user levels by calculating lifetimeXP
 * This fixes the issue where levels drop when users spend XP in the shop
 */
export const fixLifetimeXP = async (req, res) => {
  try {
    console.log("🔧 [Migration] Starting lifetimeXP fix for all users...");

    const usersSnapshot = await db.collection("users").get();
    const batchSize = 500; // Firestore batch limit
    let processedCount = 0;
    let updatedCount = 0;
    let errors = [];

    // Process in batches
    for (let i = 0; i < usersSnapshot.docs.length; i += batchSize) {
      const batch = db.batch();
      const batchDocs = usersSnapshot.docs.slice(i, i + batchSize);

      for (const userDoc of batchDocs) {
        try {
          const userData = userDoc.data();
          const userId = userDoc.id;
          const currentXP = userData.xp || 0;

          // Skip if lifetimeXP already exists
          if (userData.lifetimeXP !== undefined) {
            console.log(
              `⏭️  [Migration] User ${userId} already has lifetimeXP, skipping...`,
            );
            processedCount++;
            continue;
          }

          let spentXP = 0;

          // Calculate spent XP from inventory
          const inventory = userData.inventory || {};

          // Consumables (streak_freeze)
          if (inventory.streak_freeze) {
            spentXP += inventory.streak_freeze * SHOP_ITEMS_COSTS.streak_freeze;
          }

          // Frames/Cosmetics
          if (inventory.frames && Array.isArray(inventory.frames)) {
            inventory.frames.forEach((frameId) => {
              const cost = SHOP_ITEMS_COSTS[frameId];
              if (cost) spentXP += cost;
            });
          }

          // Badges
          if (inventory.badges && Array.isArray(inventory.badges)) {
            inventory.badges.forEach((badgeId) => {
              const cost = SHOP_ITEMS_COSTS[badgeId];
              if (cost) spentXP += cost;
            });
          }

          // Calculate spent XP from redemptions (vouchers)
          const redemptionsSnapshot = await db
            .collection("redemptions")
            .where("userId", "==", userId)
            .get();

          redemptionsSnapshot.docs.forEach((redemptionDoc) => {
            const redemptionData = redemptionDoc.data();
            const itemId = redemptionData.itemId;
            const cost = SHOP_ITEMS_COSTS[itemId];
            if (cost) spentXP += cost;
          });

          // Calculate lifetimeXP = currentXP + spentXP
          const lifetimeXP = currentXP + spentXP;

          // Update user document
          batch.update(userDoc.ref, {
            lifetimeXP: lifetimeXP,
            updatedAt: FieldValue.serverTimestamp(),
          });

          // Also update userStats if it exists
          const userStatsRef = db.collection("userStats").doc(userId);
          const userStatsDoc = await userStatsRef.get();
          if (userStatsDoc.exists) {
            batch.update(userStatsRef, {
              lifetimeXP: lifetimeXP,
              updatedAt: FieldValue.serverTimestamp(),
            });
          }

          console.log(
            `✅ [Migration] User ${userId}: currentXP=${currentXP}, spentXP=${spentXP}, lifetimeXP=${lifetimeXP}`,
          );
          updatedCount++;
        } catch (error) {
          console.error(
            `❌ [Migration] Error processing user ${userDoc.id}:`,
            error,
          );
          errors.push({ userId: userDoc.id, error: error.message });
        }
        processedCount++;
      }

      // Commit batch
      await batch.commit();
      console.log(
        `📦 [Migration] Batch committed: ${i + batchDocs.length}/${usersSnapshot.docs.length}`,
      );
    }

    console.log("🎉 [Migration] lifetimeXP fix complete!");
    res.json({
      success: true,
      message: "lifetimeXP migration completed",
      totalUsers: usersSnapshot.docs.length,
      processedCount,
      updatedCount,
      skippedCount: processedCount - updatedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("❌ [Migration] Fatal error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Migration endpoint to sync inventory.badges from userStats to users collection
 * This fixes the issue where shop badges are not visible on leaderboard/ID cards
 */
export const syncInventoryBadges = async (req, res) => {
  try {
    console.log("🔧 [Migration] Starting inventory.badges sync...");

    const userStatsSnapshot = await db.collection("userStats").get();
    const batchSize = 500;
    let processedCount = 0;
    let updatedCount = 0;
    let errors = [];

    // Process in batches
    for (let i = 0; i < userStatsSnapshot.docs.length; i += batchSize) {
      const batch = db.batch();
      const batchDocs = userStatsSnapshot.docs.slice(i, i + batchSize);

      for (const statsDoc of batchDocs) {
        try {
          const statsData = statsDoc.data();
          const userId = statsDoc.id;
          const inventoryBadges = statsData.inventory?.badges || [];

          // Skip if no badges to sync
          if (inventoryBadges.length === 0) {
            console.log(
              `⏭️  [Migration] User ${userId} has no badges, skipping...`,
            );
            processedCount++;
            continue;
          }

          // Update public users collection
          const userRef = db.collection("users").doc(userId);
          const userDoc = await userRef.get();

          if (!userDoc.exists) {
            console.log(
              `⚠️  [Migration] User ${userId} not found in users collection, skipping...`,
            );
            processedCount++;
            continue;
          }

          // Sync inventory.badges to public profile
          batch.update(userRef, {
            "inventory.badges": inventoryBadges,
            updatedAt: FieldValue.serverTimestamp(),
          });

          console.log(
            `✅ [Migration] User ${userId}: Synced ${inventoryBadges.length} badges to public profile`,
          );
          updatedCount++;
        } catch (error) {
          console.error(
            `❌ [Migration] Error processing user ${statsDoc.id}:`,
            error,
          );
          errors.push({ userId: statsDoc.id, error: error.message });
        }
        processedCount++;
      }

      // Commit batch
      await batch.commit();
      console.log(
        `📦 [Migration] Batch committed: ${i + batchDocs.length}/${userStatsSnapshot.docs.length}`,
      );
    }

    console.log("🎉 [Migration] inventory.badges sync complete!");
    res.json({
      success: true,
      message: "inventory.badges sync completed",
      totalUsers: userStatsSnapshot.docs.length,
      processedCount,
      updatedCount,
      skippedCount: processedCount - updatedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("❌ [Migration] Fatal error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Migration endpoint to sync avatarConfig and equippedFrame from userStats to users collection
 * This fixes the issue where avatars are not visible/outdated on leaderboard
 */
export const syncPublicAvatars = async (req, res) => {
  try {
    console.log("🔧 [Migration] Starting avatar sync...");

    const userStatsSnapshot = await db.collection("userStats").get();
    const batchSize = 500;
    let processedCount = 0;
    let updatedCount = 0;
    let errors = [];

    // Process in batches
    for (let i = 0; i < userStatsSnapshot.docs.length; i += batchSize) {
      const batch = db.batch();
      const batchDocs = userStatsSnapshot.docs.slice(i, i + batchSize);

      for (const statsDoc of batchDocs) {
        try {
          const statsData = statsDoc.data();
          const userId = statsDoc.id;
          const avatarConfig = statsData.avatarConfig;
          const equippedFrame = statsData.equippedFrame;

          // Skip if no avatar data to sync
          if (!avatarConfig && !equippedFrame) {
            processedCount++;
            continue;
          }

          // Update public users collection
          const userRef = db.collection("users").doc(userId);
          const userDoc = await userRef.get();

          if (!userDoc.exists) {
            console.log(
              `⚠️  [Migration] User ${userId} not found in users collection, skipping...`,
            );
            processedCount++;
            continue;
          }

          // Prepare update payload
          const updatePayload = {
            updatedAt: FieldValue.serverTimestamp(),
          };

          if (avatarConfig) {
            updatePayload.avatarConfig = avatarConfig;
          }

          if (equippedFrame) {
            updatePayload.equippedFrame = equippedFrame;
          }

          // Sync avatar data to public profile
          batch.update(userRef, updatePayload);

          console.log(
            `✅ [Migration] User ${userId}: Synced avatar data to public profile`,
          );
          updatedCount++;
        } catch (error) {
          console.error(
            `❌ [Migration] Error processing user ${statsDoc.id}:`,
            error,
          );
          errors.push({ userId: statsDoc.id, error: error.message });
        }
        processedCount++;
      }

      // Commit batch
      await batch.commit();
      console.log(
        `📦 [Migration] Batch committed: ${i + batchDocs.length}/${userStatsSnapshot.docs.length}`,
      );
    }

    console.log("🎉 [Migration] Avatar sync complete!");
    res.json({
      success: true,
      message: "Avatar sync completed",
      totalUsers: userStatsSnapshot.docs.length,
      processedCount,
      updatedCount,
      skippedCount: processedCount - updatedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("❌ [Migration] Fatal error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
