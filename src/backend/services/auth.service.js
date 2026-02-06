import { loadFirebase } from "../firebase.lazy.js";

/**
 * Creates a User profile if it doesn't exist.
 * Use the UID from Firebase Authentication.
 * SECURITY UPDATE: Writes ONLY to 'users' collection (safe fields).
 * Stats are now server-managed or read-only default.
 * TRUST UPDATE: Tracks authProvider for trust scoring.
 */
export const onboardHero = async (user, provider = "email") => {
  if (!user || !user.uid) {
    console.error("onboardHero aborted: Invalid user object", user);
    return;
  }

  try {
    const { db, doc, getDoc, setDoc, serverTimestamp, addDoc, collection } =
      await loadFirebase();

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // 1. Create Public Profile
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName || "New Hero",
        email: user.email,
        avatar:
          user.photoURL ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        city: "Ahmedabad", // Default

        // 🚨 TRUST SCORING: Track auth method
        authProvider: provider, // "email" or "google.com"
        emailVerified: user.emailVerified || false,

        // ✅ Stats for Leaderboard & Indexing
        xp: 0,
        thisWeekXP: 0,
        lifetimeXP: 0, // ✅ All-Time leaderboard ranking
        level: 1,
        reliabilityScore: 100,
        questsCompleted: 0,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2. Create Private Stats Document
      const userStatsRef = doc(db, "userStats", user.uid);
      await setDoc(userStatsRef, {
        xp: 0,
        thisWeekXP: 0,
        lifetimeXP: 0, // ✅ Total XP earned (never decreases)
        level: 1,
        reliabilityScore: 100,
        badges: [],
        daily_streak: 0,
        questsCompleted: 0, // ✅ Standardized Count
        feedbackCounts: {
          // ✅ Standardized Feedback Map
          leader: 0,
          tactician: 0,
          listener: 0,
          fearless: 0,
          mvp: 0,
        },
        createdAt: serverTimestamp(),
      });

      // ✅ NEW: Log new hero signup to global activity
      try {
        await addDoc(collection(db, "global_activity"), {
          type: "hero_joined",
          userId: user.uid,
          user: user.displayName || "New Hero",
          action: "joined the squad",
          target: "Squad Quest",
          timestamp: serverTimestamp(),
        });
      } catch (err) {
        console.warn("Failed to log hero signup activity:", err);
      }

      console.log("New Hero Onboarded (Profile + Stats Locked)!");
    } else {
      console.log("Welcome back, Legend.");
    }
  } catch (error) {
    console.error("onboardHero failed:", error);
    // Don't throw, just log. allow login to proceed.
  }
};

export const updateHeroProfile = async (userId, data) => {
  const { db, doc, updateDoc } = await loadFirebase();
  const userRef = doc(db, "users", userId);
  // Security: Rules will only allow displayName, photoURL, city, class, gender
  await updateDoc(userRef, data);
};

// --- AUTHENTICATION ---
export const signUpWithEmail = async (email, password, name) => {
  try {
    const {
      auth,
      createUserWithEmailAndPassword,
      updateProfile,
      sendEmailVerification,
    } = await loadFirebase();

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    // Update name in Firebase Auth
    await updateProfile(userCredential.user, { displayName: name });
    // Pass the actual user object with provider
    await onboardHero(userCredential.user, "email");

    // 3. Send Verification Email
    await sendEmailVerification(userCredential.user);

    // 4. Sign out immediately to prevent auto-login before verification
    await auth.signOut();

    return userCredential.user;
  } catch (error) {
    console.error("signUpWithEmail failed:", error);
    throw error;
  }
};

export const signInWithEmail = async (email, password) => {
  const { auth, signInWithEmailAndPassword } = await loadFirebase();

  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );

  const user = userCredential.user;

  // ✅ ENFORCE EMAIL VERIFICATION
  if (!user.emailVerified) {
    // If not verified, we sign them out immediately to prevent session creation
    await auth.signOut();
    throw new Error("EMAIL_NOT_VERIFIED");
  }

  return user;
};

export const signInWithGoogle = async () => {
  const { auth, googleProvider, signInWithPopup } = await loadFirebase();

  const result = await signInWithPopup(auth, googleProvider);
  await onboardHero(result.user, "google.com");
  return result.user;
};

export const signOutUser = async () => {
  const { auth, signOut } = await loadFirebase();
  return signOut(auth);
};

export const onAuthStateChangedListener = async (callback) => {
  const { auth, onAuthStateChanged } = await loadFirebase();
  return onAuthStateChanged(auth, callback);
};

export const resetHeroPassword = async (email) => {
  try {
    const { auth, sendPasswordResetEmail } = await loadFirebase();
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error("resetHeroPassword failed:", error);
    throw error;
  }
};
