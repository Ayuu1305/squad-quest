import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { GameProvider } from "./context/GameContext";
import { AuthProvider } from "./context/AuthContext";
import { RewardProvider } from "./context/RewardContext";
import { VendorAuthProvider } from "./context/VendorAuthContext";

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
