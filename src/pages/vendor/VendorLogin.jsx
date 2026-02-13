import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Store, Mail, Lock, ArrowRight, Shield } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../backend/firebaseConfig";
import { getVendorProfile } from "../../backend/services/vendor.service";
import toast from "react-hot-toast";

const VendorLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );

      const user = userCredential.user;

      // 🎯 ROLE-BASED AUTH: Check user role first
      const { getDoc, doc } = await import("firebase/firestore");
      const { db } = await import("../../backend/firebaseConfig");

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      // Block regular users from vendor login (unless admin)
      if (userData?.role === "user" && !userData?.isAdmin) {
        await auth.signOut();
        toast.error("This is a user account. Please use the main app login.", {
          icon: "👤",
          duration: 5000,
        });
        setLoading(false);
        return;
      }

      // Check if user has vendor profile
      const vendorProfile = await getVendorProfile(user.uid);

      if (!vendorProfile) {
        // User exists but is not a vendor
        await auth.signOut();
        toast.error("This account is not registered as a vendor");
        setLoading(false);
        return;
      }

      if (!vendorProfile.isActive) {
        await auth.signOut();
        toast.error(
          "Your vendor account has been deactivated. Contact support.",
        );
        setLoading(false);
        return;
      }

      // Success - redirect to vendor dashboard
      toast.success(`Welcome back, ${vendorProfile.hubName}!`);
      navigate(`/vendor/dashboard`);
    } catch (error) {
      console.error("Login error:", error);

      switch (error.code) {
        case "auth/user-not-found":
          toast.error("No account found with this email");
          break;
        case "auth/wrong-password":
          toast.error("Incorrect password");
          break;
        case "auth/invalid-email":
          toast.error("Invalid email format");
          break;
        case "auth/too-many-requests":
          toast.error("Too many failed attempts. Try again later.");
          break;
        default:
          toast.error("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#0f0f23] flex items-center justify-center p-6">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-neon-purple/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-neon-purple to-blue-600 rounded-2xl mb-4 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-['Orbitron'] font-black text-white uppercase tracking-tight mb-2">
            Vendor Portal
          </h1>
          <p className="text-sm text-gray-400">
            Access your hub's mission dashboard
          </p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center gap-2">
                <Mail className="w-3 h-3" />
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="vendor@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-neon-purple focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center gap-2">
                <Lock className="w-3 h-3" />
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-neon-purple focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-neon-purple to-blue-600 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Access Dashboard
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-start gap-3 text-xs text-gray-500">
              <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="leading-relaxed">
                This portal is for registered venue partners only. Contact
                support if you need access.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-600">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/hub/signup")}
              className="text-neon-purple hover:underline font-bold"
            >
              Register Your Hub
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default VendorLogin;
