/**
 * 💤 FIREBASE LAZY LOADER (The Bridge)
 * * This file prevents the heavy Firebase SDK from being bundled into your
 * main 'index.js' file. It only loads Firebase when a component asks for it.
 */

let firebasePromise = null;

export function loadFirebase() {
  if (!firebasePromise) {
    // 1. Start the download immediately
    firebasePromise = Promise.all([
      import("./firebaseConfig"),
      import("firebase/firestore"),
      import("firebase/auth"),
      import("firebase/functions"),
    ]).then(([config, firestoreSDK, authSDK, functionsSDK]) => {
      // 2. Merge everything into one easy-to-use object
      return {
        // --- INSTANCES (From your config) ---
        auth: config.auth,
        db: config.db,
        googleProvider: config.googleProvider,

        // --- FIRESTORE METHODS (Data) ---
        doc: firestoreSDK.doc,
        getDoc: firestoreSDK.getDoc,
        getDocs: firestoreSDK.getDocs,
        setDoc: firestoreSDK.setDoc,
        updateDoc: firestoreSDK.updateDoc,
        deleteDoc: firestoreSDK.deleteDoc,
        addDoc: firestoreSDK.addDoc,
        collection: firestoreSDK.collection,
        collectionGroup: firestoreSDK.collectionGroup, // 🚨 NEW: For verified badge checking
        query: firestoreSDK.query,
        where: firestoreSDK.where,
        orderBy: firestoreSDK.orderBy,
        limit: firestoreSDK.limit,
        startAfter: firestoreSDK.startAfter,
        onSnapshot: firestoreSDK.onSnapshot,
        serverTimestamp: firestoreSDK.serverTimestamp,
        increment: firestoreSDK.increment,
        arrayUnion: firestoreSDK.arrayUnion,
        arrayRemove: firestoreSDK.arrayRemove,
        writeBatch: firestoreSDK.writeBatch,
        runTransaction: firestoreSDK.runTransaction,
        Timestamp: firestoreSDK.Timestamp, // ✅ FIX: Added for vendor stats queries

        // --- AUTH METHODS (Login/User) ---
        onAuthStateChanged: authSDK.onAuthStateChanged,
        signInWithEmailAndPassword: authSDK.signInWithEmailAndPassword,
        createUserWithEmailAndPassword: authSDK.createUserWithEmailAndPassword,
        signInWithPopup: authSDK.signInWithPopup,
        signOut: authSDK.signOut,
        updateProfile: authSDK.updateProfile,
        sendEmailVerification: authSDK.sendEmailVerification,
        sendPasswordResetEmail: authSDK.sendPasswordResetEmail,

        // --- FUNCTIONS (Backend) ---
        getFunctions: functionsSDK.getFunctions,
        httpsCallable: functionsSDK.httpsCallable,
      };
    });
  }

  return firebasePromise;
}
