import { db } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * Submit user feedback to Firestore
 * @param {Object} feedback - Feedback data
 * @param {string} feedback.userId - User ID
 * @param {string} feedback.userEmail - User email
 * @param {string} feedback.userName - User display name
 * @param {string} feedback.type - Feedback type (bug_report, feature_request, complaint, safety_issue)
 * @param {string} feedback.message - Feedback message
 * @param {string} feedback.city - User's city
 */
export const submitFeedback = async (feedback) => {
  try {
    const feedbackData = {
      ...feedback,
      status: "pending", // pending, reviewed, resolved
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "feedback"), feedbackData);
    console.log("✅ Feedback submitted:", docRef.id);

    return docRef.id;
  } catch (error) {
    console.error("❌ Failed to submit feedback:", error);
    throw error;
  }
};
