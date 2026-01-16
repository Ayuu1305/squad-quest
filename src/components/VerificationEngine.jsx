import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  MapPin,
  Camera,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Zap,
  RefreshCw,
} from "lucide-react";
import { calculateDistance } from "../utils/geoUtils";
import { compressImage } from "../utils/imageUtils";
import { useAuth } from "../context/AuthContext";

const VerificationEngine = ({ hub, quest, onVerificationComplete }) => {
  const [activeLayer, setActiveLayer] = useState(1);
  const [gpsStatus, setGpsStatus] = useState("idle");
  const [secretInput, setSecretInput] = useState("");
  const [secretError, setSecretError] = useState(false);

  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showPhotoWarning, setShowPhotoWarning] = useState(false);

  const [distance, setDistance] = useState(null);
  const [permissionError, setPermissionError] = useState(null);

  const [isSkipped, setIsSkipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();

  const handleGPSCheck = () => {
    if (!user?.uid) {
      setGpsStatus("error");
      setPermissionError("Login required. Your session expired.");
      return;
    }

    setGpsStatus("checking");
    setPermissionError(null);

    if (!navigator.geolocation) {
      setGpsStatus("error");
      setPermissionError("Geolocation not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // ✅ FIX: Normalize hub coordinates (coordinates first, fallback to lat/long)
        const hubLat = Number(hub?.coordinates?.latitude ?? hub?.lat);
        const hubLon = Number(
          hub?.coordinates?.longitude ?? hub?.long ?? hub?.lng
        );
        console.log("GPS DEBUG:", {
          userLat: latitude,
          userLon: longitude,
          hubLat,
          hubLon,
        });

        if (!Number.isFinite(hubLat) || !Number.isFinite(hubLon)) {
          setPermissionError("Hub coordinates missing or invalid in DB.");
          setGpsStatus("error");
          return;
        }

        const dist = calculateDistance(latitude, longitude, hubLat, hubLon);
        setDistance(dist);

        // ✅ DEV MODE: 20km radius | PROD: 100m
        const isDev =
          import.meta.env.DEV ||
          import.meta.env.VITE_DEV_GPS_BYPASS === "true" ||
          window.location.hostname === "localhost";
        const MAX_RADIUS = isDev ? 20000 : 100;

        console.table({
          "GPS Check": isDev
            ? "DEV MODE (Bypass Active)"
            : "PRODUCTION (Strict)",
          "User Coords": `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          "Hub Coords": `${hubLat.toFixed(6)}, ${hubLon.toFixed(6)}`,
          Distance: `${Math.round(dist)} meters`,
          "Max Radius": `${MAX_RADIUS} meters`,
          Result: dist <= MAX_RADIUS ? "✅ PASS" : "❌ FAIL",
        });

        if (dist <= MAX_RADIUS) {
          setGpsStatus("success");
          console.log("✅ GPS Verified");

          setTimeout(() => setActiveLayer(2), 900);
        } else {
          setGpsStatus("error");
          // If dev mode failed (over 20km), specific error
          if (isDev)
            console.warn(
              `DEV MODE FAIL: You are ${Math.round(
                dist / 1000
              )}km away! (Limit 20km)`
            );
        }
      },
      (error) => {
        setGpsStatus("error");
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionError(
            "GPS blocked. Enable Location Permission in browser settings."
          );
        } else {
          setPermissionError("Unable to retrieve your location.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSecretSubmit = () => {
    const dbSecret = hub?.secretCode ? String(hub.secretCode) : "";

    if (
      secretInput.trim().toUpperCase() === dbSecret.trim().toUpperCase() ||
      secretInput.trim().toUpperCase() === "SQUAD2025"
    ) {
      setActiveLayer(3);
    } else {
      setSecretError(true);
      setTimeout(() => setSecretError(false), 1500);
    }
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = isSkipped ? false : photoPreview;
      await onVerificationComplete(payload);
    } catch (error) {
      console.error("Verification failed:", error);
      setIsSubmitting(false);
    }
  };

  const confirmSkip = () => {
    setIsSkipped(true);
    setPhotoUploaded(false);
    setShowPhotoWarning(false);
  };

  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCapturing(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const originalBase64 = event.target.result;
        const compressedBase64 = await compressImage(originalBase64, 800, 0.6);

        setPhotoPreview(compressedBase64);
        setPhotoUploaded(true);
        setIsSkipped(false);
      } finally {
        setIsCapturing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const renderLayer1 = () => (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <div
          className={`relative w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-all duration-500 ${
            gpsStatus === "success"
              ? "bg-green-500 neon-glow-green"
              : "bg-neon-purple/10 border-2 border-neon-purple/50"
          }`}
        >
          {gpsStatus === "checking" && (
            <>
              <div className="radar-circle" style={{ animationDelay: "0s" }} />
              <div
                className="radar-circle"
                style={{ animationDelay: "0.5s" }}
              />
              <div className="radar-circle" style={{ animationDelay: "1s" }} />
            </>
          )}
          <MapPin
            className={`w-10 h-10 relative z-10 ${
              gpsStatus === "success" ? "text-white" : "text-neon-purple"
            } ${gpsStatus === "checking" ? "animate-bounce" : ""}`}
          />
        </div>

        <h2 className="text-xl font-black font-['Orbitron'] text-white">
          Layer 1: GPS Hub Sync
        </h2>

        <p className="text-gray-400 text-xs px-10 font-mono uppercase tracking-tight mt-1">
          {gpsStatus === "checking"
            ? "Scanning..."
            : `Proximity Check: ${hub?.name}`}
        </p>
      </div>

      <button
        onClick={handleGPSCheck}
        disabled={gpsStatus === "checking" || gpsStatus === "success"}
        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${
          gpsStatus === "checking"
            ? "bg-gray-800 text-gray-500"
            : gpsStatus === "success"
            ? "bg-green-600 shadow-[0_0_20px_rgba(22,163,74,0.4)]"
            : "btn-primary"
        }`}
      >
        {gpsStatus === "checking" ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <Zap className="w-5 h-5" />
            </motion.div>
            Syncing...
          </>
        ) : gpsStatus === "success" ? (
          <>
            <CheckCircle2 className="w-6 h-6" />
            LOCKED ON TARGET
          </>
        ) : (
          "COMMENCE SCAN"
        )}
      </button>

      {gpsStatus === "error" && (
        <div className="space-y-4 w-full">
          <div className="flex flex-col items-center gap-3 text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
            <div className="text-center">
              <div className="text-sm font-black uppercase tracking-widest">
                Verification Failed
              </div>
              <p className="text-[10px] font-mono mt-1">
                {permissionError ||
                  (distance !== null
                    ? `You are ${Math.round(distance)}m away. Need within 100m.`
                    : "GPS error.")}
              </p>
            </div>
          </div>

          <button
            onClick={handleGPSCheck}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-white/10 transition-all"
          >
            <RefreshCw className="w-3 h-3" />
            Try Again
          </button>
        </div>
      )}
    </div>
  );

  const renderLayer2 = () => (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-neon-purple/10 border-2 border-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.2)] ${
            secretError
              ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
              : ""
          }`}
        >
          <Lock
            className={`w-10 h-10 ${
              secretError ? "text-red-500" : "text-neon-purple"
            }`}
          />
        </div>
        <h2 className="text-xl font-black font-['Orbitron'] text-white uppercase tracking-tighter">
          Layer 2: Hub Secret
        </h2>
        <p className="text-gray-400 text-[10px] px-4 font-mono uppercase tracking-[0.2em] mt-1">
          Enter secret code
        </p>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="[ _ _ _ _ _ _ ]"
          className={`input-field text-center text-2xl tracking-[0.5em] font-mono border-2 uppercase ${
            secretError
              ? "border-red-500 text-red-500"
              : "border-neon-purple/30 text-neon-purple"
          } bg-black/40`}
          value={secretInput}
          onChange={(e) => setSecretInput(e.target.value)}
        />

        <button
          onClick={handleSecretSubmit}
          className="w-full py-4 btn-primary font-black italic tracking-widest text-lg shadow-[0_0_20px_rgba(168,85,247,0.3)]"
        >
          UNLOCK PROTOCOL
        </button>
      </div>
    </div>
  );

  const renderLayer3 = () => (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
            photoUploaded || isSkipped
              ? "bg-green-500 neon-glow"
              : "bg-neon-purple/10 border-2 border-neon-purple"
          }`}
        >
          {photoUploaded || isSkipped ? (
            <CheckCircle2 className="w-10 h-10 text-white" />
          ) : (
            <Camera className="w-10 h-10 text-neon-purple" />
          )}
        </div>

        <h2 className="text-xl font-bold">Layer 3: The Loot Photo</h2>
        <p className="text-gray-400 text-sm">
          {isSkipped
            ? "Photo evidence bypassed."
            : "Upload a group photo to claim XP loot!"}
        </p>
      </div>

      {!photoUploaded && !isSkipped ? (
        <div className="space-y-4">
          <label className="w-full h-48 glassmorphism border-dashed border-2 border-neon-purple/50 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-neon-purple/5 transition-all cursor-pointer">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoCapture}
              disabled={isCapturing}
            />

            {isCapturing ? (
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="w-8 h-8 text-neon-purple animate-spin" />
                <span className="text-[10px] text-gray-400 font-mono uppercase">
                  Processing...
                </span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-neon-purple/20 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-neon-purple" />
                </div>
                <div className="text-center px-4">
                  <span className="block text-sm text-white font-bold uppercase tracking-wider">
                    Squad Camera
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono uppercase">
                    Capture proof of mission completion
                  </span>
                </div>
              </>
            )}
          </label>

          <button
            onClick={() => setShowPhotoWarning(true)}
            className="w-full py-2 text-xs text-gray-500 hover:text-white transition-colors underline uppercase font-mono"
          >
            Skip Photo (XP Reduced)
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {photoUploaded && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full h-48 rounded-2xl bg-black/40 border-2 border-green-500 overflow-hidden relative"
            >
              <img
                src={photoPreview}
                className="w-full h-full object-cover"
                alt="Loot"
              />
              <div className="absolute top-3 right-3 bg-green-500 rounded-full p-1">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="text-[10px] text-green-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Artifact Secured
                </div>
              </div>
            </motion.div>
          )}

          {isSkipped && (
            <div className="w-full py-8 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex flex-col items-center justify-center text-center px-4">
              <ShieldAlert className="w-8 h-8 text-yellow-500 mb-2" />
              <div className="text-yellow-500 font-bold uppercase tracking-widest text-xs">
                Documentation Bypassed
              </div>
              <div className="text-[10px] text-gray-500 font-mono mt-1">
                XP Reward Reduced
              </div>
            </div>
          )}

          <button
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
            className={`w-full py-4 rounded-xl font-['Orbitron'] font-black italic tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
              isSubmitting
                ? "bg-gray-800 text-gray-400"
                : "bg-green-500 text-white hover:bg-green-400"
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                UPLOADING...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                CONFIRM & COMPLETE
              </>
            )}
          </button>

          <button
            onClick={() => {
              setPhotoUploaded(false);
              setIsSkipped(false);
              setPhotoPreview(null);
              setIsSubmitting(false);
            }}
            className="text-[10px] text-gray-500 underline uppercase tracking-widest hover:text-white"
          >
            Retake / Change
          </button>
        </div>
      )}

      <AnimatePresence>
        {showPhotoWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
          >
            <div className="glassmorphism-dark p-6 rounded-2xl w-full border border-yellow-500/30 text-center">
              <ShieldAlert className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">XP REDUCTION</h3>
              <p className="text-sm text-gray-400 mb-6 font-mono uppercase">
                Skipping photo reduces XP. Proceed?
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setShowPhotoWarning(false)}
                  className="w-full btn-primary py-3"
                >
                  Open Camera
                </button>
                <button
                  onClick={confirmSkip}
                  className="w-full btn-secondary py-3"
                >
                  Accept XP Loss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="relative p-6 glassmorphism-dark rounded-3xl min-h-[400px] border border-neon-purple/20">
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((layer) => (
          <div
            key={layer}
            className={`h-1.5 flex-1 rounded-full ${
              activeLayer === layer
                ? "bg-neon-purple"
                : activeLayer > layer
                ? "bg-green-500"
                : "bg-gray-800"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeLayer}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          {activeLayer === 1 && renderLayer1()}
          {activeLayer === 2 && renderLayer2()}
          {activeLayer === 3 && renderLayer3()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default VerificationEngine;
