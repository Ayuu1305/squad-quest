// Quick script to set isAdmin flag for a user
// Run this in browser console while logged in

import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const setAdminFlag = async () => {
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;

  if (!user) {
    console.error("❌ No user logged in");
    return;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      isAdmin: true,
    });
    console.log("✅ Admin flag set successfully for user:", user.uid);
    console.log("🔄 Please refresh the page for changes to take effect");
  } catch (error) {
    console.error("❌ Error setting admin flag:", error);
  }
};

setAdminFlag();
