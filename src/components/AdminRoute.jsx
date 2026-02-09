import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Debug logging
  console.log("🔐 [AdminRoute] User:", user?.uid);
  console.log("🔐 [AdminRoute] isAdmin:", user?.isAdmin);
  console.log("🔐 [AdminRoute] Loading:", loading);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!user || !user.emailVerified) {
    return <Navigate to="/login" replace />;
  }

  // ✅ CRITICAL: Check isAdmin flag from user object (AuthContext syncs from Firestore)
  if (!user.isAdmin) {
    console.warn("🚫 [AdminRoute] Access Denied - User is not admin");
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glassmorphism-dark p-12 rounded-3xl border border-red-500/30 text-center max-w-md"
        >
          <Lock className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-['Orbitron'] font-black text-red-500 uppercase mb-4">
            Access Denied
          </h1>
          <p className="text-gray-400 text-sm font-mono mb-6">
            You do not have administrator privileges.
          </p>
          <p className="text-gray-500 text-xs font-mono mb-4">
            User ID: {user.uid}
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors font-black uppercase text-xs tracking-wider"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  console.log("✅ [AdminRoute] Access Granted - User is admin");
  // ✅ User is admin → allow access
  return children;
};

export default AdminRoute;
