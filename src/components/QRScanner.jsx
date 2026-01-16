import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { motion } from "framer-motion";
import { Scan, XCircle, Zap, ShieldCheck } from "lucide-react";

const QRScanner = ({ onScanSuccess, onCancel }) => {
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("qr-reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      aspectRatio: 1,
    });

    scanner.render(
      (decodedText) => {
        // Success
        setIsScanning(false);
        scanner.clear();
        onScanSuccess(decodedText);
      },
      (err) => {
        // Most errors are just "QR not found in frame"
        // We'll only show critical errors if needed
      }
    );

    return () => {
      scanner.clear().catch((e) => console.error("Scanner clear failed", e));
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6"
    >
      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full bg-neon-purple/10 mb-4 border border-neon-purple/20">
            <Scan className="w-12 h-12 text-neon-purple animate-pulse" />
          </div>
          <h2 className="text-3xl font-['Orbitron'] font-black italic neon-text mb-2">
            HUB SCAN
          </h2>
          <p className="text-gray-500 text-xs font-mono uppercase tracking-[0.3em]">
            Align QR with Protocol Frame
          </p>
        </div>

        <div className="relative rounded-3xl overflow-hidden glassmorphism border-2 border-neon-purple shadow-[0_0_30px_rgba(168,85,247,0.2)]">
          <div id="qr-reader" className="w-full bg-black"></div>

          {/* Decorative Corner Borders */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-neon-purple rounded-tl-xl m-4"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-neon-purple rounded-tr-xl m-4"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-neon-purple rounded-bl-xl m-4"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-neon-purple rounded-br-xl m-4"></div>

          {/* Scanning Line Animation */}
          <motion.div
            animate={{ top: ["10%", "90%"] }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="absolute left-[5%] right-[5%] h-0.5 bg-neon-purple/50 shadow-[0_0_10px_#a855f7]"
          />
        </div>

        <button
          onClick={onCancel}
          className="w-full mt-10 py-4 btn-secondary flex items-center justify-center gap-2 group"
        >
          <XCircle className="w-5 h-5 text-gray-500 group-hover:text-red-400 transition-colors" />
          Cancel Protocol
        </button>

        <div className="mt-8 flex items-center gap-3 justify-center text-[10px] text-gray-500 font-mono uppercase tracking-widest">
          <ShieldCheck className="w-3 h-3" />
          Instant Hub Verification
        </div>
      </div>
    </motion.div>
  );
};

export default QRScanner;
