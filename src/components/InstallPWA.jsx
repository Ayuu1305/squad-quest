import React, { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";

const InstallPWA = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault(); // Prevent standard browser banner
      setSupportsPWA(true); // Reveal our custom button
      setPromptInstall(e);  // Save event for click
    };
    
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = (e) => {
    e.preventDefault();
    if (!promptInstall) return;
    promptInstall.prompt();
  };

  if (!supportsPWA) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105 active:scale-95 text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg transition-all animate-pulse"
    >
      <Smartphone className="w-4 h-4" />
      <span>Install App</span>
    </button>
  );
};

export default InstallPWA;