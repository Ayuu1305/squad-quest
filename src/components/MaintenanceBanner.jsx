import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const MaintenanceBanner = () => {
  const { isOverloaded } = useAuth();

  return (
    <AnimatePresence>
      {isOverloaded && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 shadow-2xl"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-center gap-3 text-white">
              {/* Pulsing Warning Icon */}
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <AlertTriangle
                  className="w-5 h-5 md:w-6 md:h-6"
                  fill="currentColor"
                />
              </motion.div>

              {/* Message */}
              <div className="flex flex-col md:flex-row md:items-center md:gap-2 text-center md:text-left">
                <span className="font-black text-sm md:text-base uppercase tracking-wider">
                  ⚠️ High Traffic Alert
                </span>
                <span className="hidden md:inline text-white/80">•</span>
                <span className="text-xs md:text-sm font-bold">
                  The System is cooling down. Some data may not load.
                </span>
              </div>

              {/* Time Notice */}
              <div className="hidden md:flex items-center gap-2 ml-auto bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-mono font-bold">
                  Check back at 1:30 PM
                </span>
              </div>
            </div>

            {/* Mobile Time Notice */}
            <div className="md:hidden flex items-center justify-center gap-2 mt-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full mx-auto w-fit">
              <Clock className="w-3 h-3" />
              <span className="text-[10px] font-mono font-bold">
                Check back at 1:30 PM
              </span>
            </div>

            {/* Animated Progress Bar */}
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-white/40"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MaintenanceBanner;
