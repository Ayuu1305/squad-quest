import cron from "node-cron";

// --------------------------------------------------------
// 🏆 COMPETITION ARCHIVER - AUTO END WAR JOB
// --------------------------------------------------------
// Purpose: Automatically end competitions when their endDate passes
// Schedule: Runs every Sunday at midnight IST (Weekly)
// Logic: Mirrors the manual "End War" button from AdminCompetition.jsx
// --------------------------------------------------------

/**
 * Initializes the Competition Archiver cron job
 * @param {FirebaseFirestore.Firestore} db - Firestore database instance
 */
export function initCompetitionArchiver(db) {
  console.log("🏆 Competition Archiver Job Initialized");
  console.log("   Schedule: Every Sunday at 00:00 IST (Weekly)");
  console.log("   Action: Auto-end weekly competitions\n");

  // 🗓️ SUNDAY MIDNIGHT (IST): Matches weekly XP reset pattern
  // All wars should run Monday → Sunday
  // Format: "0 0 * * 0" = minute hour day month weekday (0 = Sunday)
  cron.schedule(
    "0 0 * * 0",
    async () => {
      console.log("\n" + "=".repeat(60));
      console.log("🏆 WEEKLY COMPETITION ARCHIVER - SUNDAY MIDNIGHT");
      console.log(`   Timestamp: ${new Date().toISOString()}`);
      console.log("=".repeat(60) + "\n");

      try {
        await archiveExpiredCompetitions(db);
      } catch (error) {
        console.error("❌ CRITICAL ERROR in Competition Archiver:");
        console.error("   Error:", error.message);
        console.error("   Stack:", error.stack);
      }
    },
    {
      timezone: "Asia/Kolkata",
    },
  );

  console.log("✅ Competition Archiver cron job is now running\n");
}

/**
 * Main archival logic - mirrors AdminCompetition.jsx handleEndWar()
 * Finds active competitions past their endDate and archives them
 * @param {FirebaseFirestore.Firestore} db - Firestore database instance
 */
async function archiveExpiredCompetitions(db) {
  try {
    const now = new Date();
    console.log("🔍 Checking for expired competitions...");
    console.log(`   Current Time: ${now.toISOString()}\n`);

    // Query active competitions
    const competitionsRef = db.collection("competitions");
    const snapshot = await competitionsRef
      .where("status", "==", "active")
      .get();

    if (snapshot.empty) {
      console.log("✨ No active competitions found.");
      return;
    }

    console.log(`📋 Found ${snapshot.size} active competition(s)\n`);

    let archivedCount = 0;

    // Check each competition
    for (const doc of snapshot.docs) {
      const war = { id: doc.id, ...doc.data() };

      // Check if endDate has passed
      if (!war.endDate) {
        console.log(`⚠️  Skipping "${war.title}" - No endDate set`);
        continue;
      }

      const endDate = war.endDate.toDate();

      if (now < endDate) {
        // Competition still ongoing
        const timeLeft = Math.round((endDate - now) / 1000 / 60); // minutes
        console.log(`⏳ "${war.title}" - ${timeLeft} minutes remaining`);
        continue;
      }

      // Competition has expired - archive it!
      console.log(`\n🎯 ARCHIVING: "${war.title}"`);
      console.log(`   End Date: ${endDate.toISOString()}`);
      console.log(
        `   Time Overdue: ${Math.round((now - endDate) / 1000 / 60)} minutes`,
      );

      try {
        // === EXACT LOGIC FROM AdminCompetition.jsx handleEndWar() ===

        // 1. Calculate Final Scores AND Capture Top 3 Heroes for each college
        console.log("   📊 Calculating final scores...");
        const finalResults = await Promise.all(
          war.colleges.map(async (college) => {
            // ✅ FIX: Use db directly, not competitionsRef.parent
            const q = await db
              .collection("users")
              .where("college", "==", college)
              .get();

            // A. Calculate Total XP
            const totalXP = q.docs.reduce(
              (sum, userDoc) => sum + (userDoc.data().thisWeekXP || 0),
              0,
            );

            // B. Get Top 3 Heroes for the Podium (Frozen Data)
            const allStudents = q.docs.map((userDoc) => ({
              id: userDoc.id,
              ...userDoc.data(),
            }));
            const topHeroes = allStudents
              .sort((a, b) => (b.thisWeekXP || 0) - (a.thisWeekXP || 0))
              .slice(0, 3); // Keep top 3 for the podium

            return {
              college,
              totalXP,
              studentCount: q.size,
              topHeroes: topHeroes, // Saving the heroes forever!
            };
          }),
        );

        // 2. Sort to find the winner (Highest XP first)
        finalResults.sort((a, b) => b.totalXP - a.totalXP);

        console.log("   🏆 Final Standings:");
        finalResults.forEach((result, index) => {
          console.log(
            `      ${index + 1}. ${result.college} - ${result.totalXP} XP`,
          );
        });

        // 3. Update the Competition Document (Freeze it!)
        await competitionsRef.doc(war.id).update({
          status: "ended",
          finalStandings: finalResults, // Saving scores + heroes
          winner: finalResults[0].college,
          endedAt: new Date(),
        });

        console.log(`   ✅ Competition archived successfully!`);
        console.log(`   🥇 Winner: ${finalResults[0].college}\n`);
        archivedCount++;
      } catch (error) {
        console.error(`   ❌ Failed to archive "${war.title}"`);
        console.error(`      Error: ${error.message}\n`);
        // Continue with other competitions even if one fails
      }
    }

    if (archivedCount > 0) {
      console.log(`\n✅ ARCHIVAL COMPLETE`);
      console.log(`   Total Archived: ${archivedCount} competition(s)`);
      console.log(`   Status: active → ended`);
      console.log(`   Data: Scores \u0026 heroes frozen in finalStandings`);
    } else {
      console.log("✨ No competitions needed archiving at this time.");
    }
  } catch (error) {
    console.error("❌ Error in archiveExpiredCompetitions:");
    console.error("   Message:", error.message);
    console.error("   Code:", error.code || "N/A");
    throw error; // Re-throw to be caught by the main cron handler
  }
}
