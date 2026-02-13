import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  LogIn,
  Chrome,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import {
  signInWithEmail,
  signInWithGoogle,
  resetHeroPassword,
} from "../backend/services/auth.service";
import { toast } from "react-hot-toast";
import CyberGridBackground from "../components/CyberGridBackground";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/board";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmail(email, password);
      toast.success("Access Granted. Welcome back, Hero.");
      // navigate(from, { replace: true });
    } catch (err) {
      if (err.message === "EMAIL_NOT_VERIFIED") {
        const msg =
          "Verify your email before accessing the Hub.Check Spam Folder Too";
        setError(msg);
        toast.error(msg, { icon: "📧" });
      } else if (err.message === "VENDOR_ACCOUNT") {
        const msg = "This is a vendor account. Please use the Vendor Portal.";
        setError(msg);
        toast.error(msg, {
          icon: "🏪",
          duration: 5000,
        });
      } else {
        const msg = "Authorization Failed: Invalid Credentials";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast.error("Please enter your email address first");
      return;
    }
    try {
      await resetHeroPassword(email);
      toast.success("Password reset link sent to your email");
    } catch (error) {
      toast.error(error.message || "Failed to send reset link");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      // navigate(from, { replace: true });
    } catch (err) {
      setError("External Sync Failed");
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg relative flex items-center justify-center p-6 overflow-y-auto">
      <CyberGridBackground />

      {/* Background Decor - Optimized for 120Hz iOS */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-neon-purple/40 to-transparent rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-radial from-blue-600/40 to-transparent rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10 py-12"
      >
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-neon-purple/20 rounded-2xl mb-4 border border-neon-purple/50">
            <ShieldCheck className="w-12 h-12 text-neon-purple" />
          </div>
          <h1 className="text-4xl font-['Orbitron'] font-black text-white italic tracking-tighter uppercase mb-2">
            Hero Login
          </h1>
          <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.3em]">
            Protocol: Access Secure Hub
          </p>
        </div>

        <div className="glassmorphism p-8 rounded-3xl border border-white/10 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-xs font-black uppercase text-center italic tracking-wider">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-gray-500 ml-2 tracking-widest">
                Comms Address (Email)
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-purple transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 py-4 pl-12 pr-4 rounded-2xl text-white font-medium focus:border-neon-purple focus:outline-none transition-all"
                  placeholder="name@sector.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-gray-500 ml-2 tracking-widest">
                Security Key (Password)
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-purple transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 py-4 pl-12 pr-4 rounded-2xl text-white font-medium focus:border-neon-purple focus:outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="text-[10px] font-black uppercase text-neon-purple hover:text-white transition-colors tracking-widest italic"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-5 rounded-2xl font-black italic tracking-[0.2em] text-lg uppercase flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Decrypting..." : "Access Hub"}
              <LogIn className="w-5 h-5" />
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black text-gray-600">
              <span className="bg-[#0b0c10] px-4 tracking-[0.3em]">
                Ext-Sync
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full py-4 glassmorphism border border-white/5 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/5 transition-colors font-black uppercase tracking-widest text-[10px]"
          >
            <Chrome className="w-5 h-5" />
            Sync with Google
          </button>

          <p className="text-center text-gray-500 text-[10px] uppercase font-black tracking-widest">
            New Hero?{" "}
            <Link
              to="/signup"
              className="text-neon-purple hover:underline italic"
            >
              Create Profile <ArrowRight className="inline w-3 h-3" />
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
