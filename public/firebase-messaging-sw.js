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

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/logo.png", // Update if you have a logo
    badge: "/logo.png",
    vibrate: [200, 100, 200],
    tag: "squad-quest-notification",
    requireInteraction: false,
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
