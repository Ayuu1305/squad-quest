import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize ONLY what is strictly necessary for the app to exist
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const functions = getFunctions(app);

// 🚀 PERFORMANCE: Enable Firestore persistence during browser idle time
if (typeof window !== "undefined") {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(
      () => {
        enableIndexedDbPersistence(db).catch(() => {});
      },
      { timeout: 3000 }
    );
  } else {
    // Fallback for older browsers
    setTimeout(() => {
      enableIndexedDbPersistence(db).catch(() => {});
    }, 2000);
  }
}


export { auth, db, googleProvider, functions };


