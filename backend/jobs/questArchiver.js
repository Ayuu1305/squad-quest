import cron from "node-cron";

// ----------------------------------------------------
// 🧹 QUEST ARCHIVER - SCHEDULED JANITOR JOB
// ----------------------------------------------------
// Purpose: Archive old completed quests to keep the active database clean
// Schedule: Runs daily at 03:00 AM server time
// Safety: DRY_RUN mode prevents accidental data deletion
// ----------------------------------------------------

/**
 * SAFETY SWITCH: Set to true for dry-run mode (no actual data changes)
 * When true: Only logs what WOULD be archived
 * When false: Executes actual batch operations
 */
const DRY_RUN = true;

/**
 * Archive threshold in days
 * Quests completed more than X days ago will be archived
 */
const ARCHIVE_THRESHOLD_DAYS = 7;

/**
 * Maximum documents to archive in a single batch operation
 * Firestore batch limit is 500, we use 450 for safety margin
 */
const BATCH_SIZE = 450;

/**
 * Initializes the Quest Archiver cron job
 * @param {FirebaseFirestore.Firestore} db - Firestore database instance
 */
export function initArchiver(db) {
  console.log("🗂️  Quest Archiver Job Initialized");
  console.log(`   Mode: ${DRY_RUN ? "DRY RUN (Safe)" : "LIVE (Active)"}`);
  console.log(`   Schedule: Every day at 03:00 AM`);
  console.log(`   Archive Threshold: ${ARCHIVE_THRESHOLD_DAYS} days\n`);

  // Schedule the job to run at 03:00 AM daily
  // Cron format: '0 3 * * *' = minute hour day month weekday
  cron.schedule("0 3 * * *", async () => {
    console.log("\n" + "=".repeat(60));
    console.log("🧹 QUEST ARCHIVER JOB STARTED");
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log(`   Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
    console.log("=".repeat(60) + "\n");

    try {
      await archiveOldQuests(db);
    } catch (error) {
      console.error("❌ CRITICAL ERROR in Quest Archiver:");
      console.error("   Error:", error.message);
      console.error("   Stack:", error.stack);
    }

    console.log("\n" + "=".repeat(60));
    console.log("🧹 QUEST ARCHIVER JOB COMPLETED");
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log("=".repeat(60) + "\n");
  });

  console.log("✅ Quest Archiver cron job is now running in the background\n");
}

/**
 * Main archival logic
 * Finds and archives completed quests older than the threshold
 * @param {FirebaseFirestore.Firestore} db - Firestore database instance
 */
async function archiveOldQuests(db) {
  try {
    // Calculate the cutoff date (current time - threshold days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ARCHIVE_THRESHOLD_DAYS);

    console.log("📋 Query Parameters:");
    console.log(`   Status: completed`);
    console.log(`   Updated Before: ${cutoffDate.toISOString()}`);
    console.log(`   (${ARCHIVE_THRESHOLD_DAYS} days ago)\n`);

    // Query for completed quests older than the threshold
    const questsRef = db.collection("quests");
    const snapshot = await questsRef
      .where("status", "==", "completed")
      .where("updatedAt", "<", cutoffDate)
      .get();

    if (snapshot.empty) {
      console.log("✨ No quests found to archive. Database is clean!");
      return;
    }

    const totalQuests = snapshot.size;
    console.log(`🔍 Found ${totalQuests} quest(s) eligible for archiving\n`);

    if (DRY_RUN) {
      console.log("🛡️  DRY RUN MODE - No data will be modified\n");
      console.log("📝 Quests that WOULD be archived:");
      console.log("-".repeat(60));

      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   Quest ID: ${doc.id}`);
        console.log(`   Title: ${data.title || "Untitled"}`);
        console.log(`   Updated: ${data.updatedAt?.toDate?.() || "Unknown"}`);
        console.log(`   Members: ${data.members?.length || 0}`);
        console.log("-".repeat(60));
      });

      console.log(`\n💡 Total: ${totalQuests} quest(s) would be archived`);
      console.log(
        "   To execute actual archival, set DRY_RUN = false in questArchiver.js\n",
      );
      return;
    }

    // LIVE MODE: Execute batch operations
    console.log("⚡ LIVE MODE - Executing batch operations\n");

    let archivedCount = 0;
    let currentBatch = db.batch();
    let operationCount = 0;

    for (const doc of snapshot.docs) {
      const questId = doc.id;
      const questData = doc.data();

      try {
        // Step A: Copy to archived_quests collection
        const archiveRef = db.collection("archived_quests").doc(questId);
        currentBatch.set(archiveRef, {
          ...questData,
          archivedAt: new Date(),
          originalCollection: "quests",
        });

        // Step B: Delete from active quests collection
        currentBatch.delete(doc.ref);

        operationCount += 2; // One set + one delete

        // Commit batch if we reach the size limit
        if (operationCount >= BATCH_SIZE) {
          await currentBatch.commit();
          console.log(
            `   ✅ Batch committed (${operationCount / 2} quests archived)`,
          );
          archivedCount += operationCount / 2;
          currentBatch = db.batch();
          operationCount = 0;
        }
      } catch (error) {
        console.error(`   ⚠️  Failed to archive Quest ID: ${questId}`);
        console.error(`      Error: ${error.message}`);
        // Continue with other quests even if one fails
      }
    }

    // Commit any remaining operations in the final batch
    if (operationCount > 0) {
      await currentBatch.commit();
      archivedCount += operationCount / 2;
      console.log(
        `   ✅ Final batch committed (${operationCount / 2} quests archived)`,
      );
    }

    console.log(`\n✅ ARCHIVAL COMPLETE`);
    console.log(`   Total Archived: ${archivedCount} quest(s)`);
    console.log(`   Moved from: quests → archived_quests`);
  } catch (error) {
    console.error("❌ Error in archiveOldQuests:");
    console.error("   Message:", error.message);
    console.error("   Code:", error.code || "N/A");
    throw error; // Re-throw to be caught by the main cron handler
  }
}
