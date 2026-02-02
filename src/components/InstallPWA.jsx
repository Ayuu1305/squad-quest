import React, { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";

const InstallPWA = () => {
  const [promptInstall, setPromptInstall] = useState(null);
  const [status, setStatus] = useState("Checking..."); // Debug Status

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      console.log("PWA Install Event Fired!"); // Check console if possible
      setPromptInstall(e);
      setStatus("Ready");
    };
    
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = (e) => {
    e.preventDefault();
    if (!promptInstall) {
      alert("Browser says: Not ready to install yet. (Try refreshing or interacting with the page)");
      return;
    }
    promptInstall.prompt();
  };

  // ❌ REMOVED the "return null" check. 
  // Now we ALWAYS show the button to debug.

  return (
    <button
      onClick={handleInstallClick}
      className={`flex items-center gap-2 px-3 py-1.5 text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg transition-all ${
        promptInstall 
          ? "bg-gradient-to-r from-purple-600 to-blue-600 animate-pulse hover:scale-105" 
          : "bg-gray-600 opacity-50 cursor-not-allowed"
      }`}
    >
      <Smartphone className="w-4 h-4" />
      {/* Show Debug Status Text */}
      <span>{promptInstall ? "Install App" : status}</span>
    </button>
  );
};

export default InstallPWA;