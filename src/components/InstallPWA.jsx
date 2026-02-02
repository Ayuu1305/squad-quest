import React, { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if the app is already running in "App Mode" (Standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // 2. Listen for the "Install Event" from Chrome/Android
    const handler = (e) => {
      e.preventDefault(); // Prevent Chrome's mini-infobar
      setDeferredPrompt(e); // Save the event to trigger later
    };

    window.addEventListener("beforeinstallprompt", handler);

    // 3. Listen for successful installation to hide button immediately
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      // ✅ SCENARIO A: Browser is ready. Trigger the native popup.
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
      });
    } else {
      // ⚠️ SCENARIO B: Browser is in "Cooldown" or is iOS. Show Manual Instructions.
      alert("To install Squad Quest:\n\n1. Tap the 3 dots (⋮) or 'Share' icon in your browser.\n2. Tap 'Add to Home Screen' or 'Install App'.");
    }
  };

  // 🛑 Hide button ONLY if we are sure the app is already installed
  if (isInstalled) return null;

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