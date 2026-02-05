import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MessageSquare,
  Bug,
  Lightbulb,
  AlertTriangle,
  Send,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { submitFeedback } from "../backend/services/feedback.service";
import toast from "react-hot-toast";

const FeedbackModal = ({ onClose }) => {
  const { user } = useAuth();
  const [type, setType] = useState("bug_report");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const feedbackTypes = [
    { id: "bug_report", label: "Bug Report", icon: Bug, color: "red" },
    {
      id: "feature_request",
      label: "Feature Request",
      icon: Lightbulb,
      color: "yellow",
    },
    {
      id: "complaint",
      label: "Complaint",
      icon: AlertTriangle,
      color: "orange",
    },
    {
      id: "safety_issue",
      label: "Safety Issue",
      icon: AlertTriangle,
      color: "red",
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("Please write your feedback");
      return;
    }

    setLoading(true);
    try {
      await submitFeedback({
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.name,
        type,
        message: message.trim(),
        city: user.city || "Unknown",
      });

      toast.success("Feedback submitted! Thank you 🙏");
      onClose();
    } catch (error) {
      console.error("Feedback submission failed:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-dark-bg border-2 border-neon-purple/50 rounded-3xl p-6 max-w-lg w-full relative overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.3)]"
        >
          {/* Background Effects */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-neon-purple to-transparent" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-neon-purple blur-[80px] opacity-20" />

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neon-purple/20 rounded-xl flex items-center justify-center border border-neon-purple/50">
                <MessageSquare className="w-5 h-5 text-neon-purple" />
              </div>
              <div>
                <h2 className="text-xl font-['Orbitron'] font-black text-white uppercase tracking-tight">
                  Send Feedback
                </h2>
                <p className="text-xs text-gray-500 font-mono">
                  Help us improve Squad Quest
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Selector */}
            <div>
              <label className="text-xs text-gray-400 font-mono uppercase tracking-wider mb-3 block">
                Feedback Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {feedbackTypes.map((feedbackType) => {
                  const Icon = feedbackType.icon;
                  return (
                    <button
                      key={feedbackType.id}
                      type="button"
                      onClick={() => setType(feedbackType.id)}
                      className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        type === feedbackType.id
                          ? "border-neon-purple bg-neon-purple/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          type === feedbackType.id
                            ? "text-neon-purple"
                            : "text-gray-400"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          type === feedbackType.id
                            ? "text-white"
                            : "text-gray-400"
                        }`}
                      >
                        {feedbackType.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="text-xs text-gray-400 font-mono uppercase tracking-wider mb-2 block">
                Your Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's on your mind..."
                rows={6}
                maxLength={1000}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:border-neon-purple focus:outline-none resize-none font-mono text-sm"
              />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-600">
                  Max 1000 characters
                </span>
                <span className="text-xs text-gray-600">
                  {message.length}/1000
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className={`w-full py-4 rounded-xl font-['Orbitron'] font-black italic tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                loading || !message.trim()
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-neon-purple text-white hover:bg-neon-purple/80 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]"
              }`}
            >
              {loading ? (
                "Sending..."
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Feedback
                </>
              )}
            </button>
          </form>

          {/* Footer Note */}
          <p className="text-center text-xs text-gray-600 mt-4 font-mono">
            We read every submission and will respond if needed
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FeedbackModal;
