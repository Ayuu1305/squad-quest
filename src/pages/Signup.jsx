import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Chrome,
  ArrowRight,
  UserPlus,
  ShieldCheck,
} from "lucide-react";
import { signUpWithEmail, signInWithGoogle } from "../backend/firebaseService";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signUpWithEmail(email, password, username);
      navigate("/board");
    } catch (err) {
      console.error("Signup Error Details:", err);
      setError(`${err.code || "Sync Failed"}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      navigate("/board");
    } catch (err) {
      setError("External Sync Failed");
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-neon-purple rounded-full blur-[100px]" />
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-blue-600 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-neon-purple/20 rounded-2xl mb-4 border border-neon-purple/50">
            <UserPlus className="w-12 h-12 text-neon-purple" />
          </div>
          <h1 className="text-4xl font-['Orbitron'] font-black text-white italic tracking-tighter uppercase mb-2">
            New Profile
          </h1>
          <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.3em]">
            Phase: Recruit Initialization
          </p>
        </div>

        <div className="glassmorphism p-8 rounded-3xl border border-white/10 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-xs font-black uppercase text-center italic tracking-wider">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-gray-500 ml-2 tracking-widest">
                Callsign (Username)
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-purple transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 py-4 pl-12 pr-4 rounded-2xl text-white font-medium focus:border-neon-purple focus:outline-none transition-all"
                  placeholder="HeroName_01"
                  required
                />
              </div>
            </div>

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
                Secure Key (Password)
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-5 rounded-2xl font-black italic tracking-[0.2em] text-lg uppercase flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Initializing..." : "Register Profile"}
              <UserPlus className="w-5 h-5" />
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
            Join with Google
          </button>

          <p className="text-center text-gray-500 text-[10px] uppercase font-black tracking-widest">
            Existing Hero?{" "}
            <Link
              to="/login"
              className="text-neon-purple hover:underline italic"
            >
              Access Hub <ArrowRight className="inline w-3 h-3" />
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
