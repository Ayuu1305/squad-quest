/**
 * Mark all notifications as read for a vendor
 */
export const markAllNotificationsAsRead = async (vendorId) => {
  const { db, collection, query, where, getDocs, writeBatch } =
    await loadFirebase();

  const notificationsRef = collection(db, "vendor_notifications");
  const q = query(
    notificationsRef,
    where("vendorId", "==", vendorId),
    where("read", "==", false),
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return;
  }

  // Use batch write for better performance
  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { read: true });
  });

  await batch.commit();
};
