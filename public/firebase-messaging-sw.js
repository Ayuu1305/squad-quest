// Firebase Cloud Messaging Service Worker
// This file enables background notifications when the app is not in focus

importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js",
);

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyCItLHoLCBCFJT_bNAuTmPpyo1VKjIsn8U",
  authDomain: "squad-quest-ca9f2.firebaseapp.com",
  projectId: "squad-quest-ca9f2",
  storageBucket: "squad-quest-ca9f2.firebasestorage.app",
  messagingSenderId: "673500736170",
  appId: "1:673500736170:web:6eedfea21215c306693ed3",
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message:",
    payload,
  );

  // ⚠️ FIX: Do NOT manually show notification if 'notification' key exists.
  // The browser automatically handles this for FCM messages with 'notification' payload.
  // We only manually show if it's a DATA-ONLY message.

  if (payload.notification) {
    return; // Let browser handle it
  }

  const notificationTitle = payload.data?.title || "Squad Update";
  const notificationOptions = {
    body: payload.data?.body || "New activity in your squad.",
    icon: "/logo.png",
    badge: "/logo.png",
    vibrate: [200, 100, 200],
    tag: "squad-quest-data-notification",
    data: payload.data,
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions,
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Notification clicked:", event);
  event.notification.close();

  // Open the app when notification is clicked
  event.waitUntil(clients.openWindow("/"));
});
