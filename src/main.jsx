import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { GameProvider } from "./context/GameContext";
import { AuthProvider } from "./context/AuthContext";
import { RewardProvider } from "./context/RewardContext";
import { VendorAuthProvider } from "./context/VendorAuthContext";

// 👇 1. IMPORT IT
import VConsole from 'vconsole';

// 👇 2. INITIALIZE IT (This adds the green button)
// We are adding a check so it doesn't annoy you on laptop, only shows on phones
if (window.innerWidth < 768) {
  const vConsole = new VConsole({ theme: 'dark' });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <VendorAuthProvider>
          <RewardProvider>
            <GameProvider>
              <App />
            </GameProvider>
          </RewardProvider>
        </VendorAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
