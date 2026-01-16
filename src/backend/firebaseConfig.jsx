import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCItLHoLCBCFJT_bNAuTmPpyo1VKjIsn8U",
  authDomain: "squad-quest-ca9f2.firebaseapp.com",
  projectId: "squad-quest-ca9f2",
  storageBucket: "squad-quest-ca9f2.firebasestorage.app",
  messagingSenderId: "673500736170",
  appId: "1:673500736170:web:6eedfea21215c306693ed3",
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize App Check (ONLY in PROD or if explicitly enabled in Dev)
// This prevents 403 errors on localhost if debug token is not configured.
const shouldInitAppCheck =
  !import.meta.env.DEV || import.meta.env.VITE_ENABLE_APP_CHECK === "true";

let appCheck;
if (shouldInitAppCheck) {
  appCheck = initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaV3Provider(
      "6LfnbUksAAAAABRUmqHmG6uhNZV-Td1wZ9ZA54x7"
    ),
    isTokenAutoRefreshEnabled: true,
  });
} else {
  if (import.meta.env.DEV) {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    console.log(
      "⚠️ App Check: Disabled in DEV to prevent 403 errors. Set VITE_ENABLE_APP_CHECK=true to enable."
    );
  }
}

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

export default firebaseApp;
