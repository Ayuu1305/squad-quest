import { loadFirebase } from "../firebase.lazy.js";
import { trackRead } from "../../utils/firestoreMonitor";

// --- CHAT LOGIC ---

export const sendSquadMessage = async (questId, userId, text, senderName) => {
  if (!text.trim()) return;

  const { db, collection, addDoc, serverTimestamp } = await loadFirebase();

  // Secure Path: quests/{id}/chat
  const messagesRef = collection(db, "quests", questId, "chat");
  await addDoc(messagesRef, {
    text: text,
    senderId: userId,
    senderName: senderName,
    createdAt: serverTimestamp(),
  });
};

export const subscribeToSquadChat = (questId, callback) => {
  let unsubscribe = () => {};

  loadFirebase().then(({ db, collection, query, orderBy, onSnapshot }) => {
    const q = query(
      collection(db, "quests", questId, "chat"),
      orderBy("createdAt", "asc"),
    );

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        trackRead("subscribeToSquadChat");
        const messages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(messages);
      },
      (error) => {
        console.error(
          `Error subscribing to squad chat for quest ${questId}:`,
          error,
        );
      },
    );
  });

  return () => unsubscribe && unsubscribe();
};
