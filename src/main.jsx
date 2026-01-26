import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import App from "./App.jsx";
import { GameProvider } from "./context/GameContext";
import { AuthProvider } from "./context/AuthContext";
import { RewardProvider } from "./context/RewardContext";

const helmetContext = {};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider context={helmetContext}>
      <BrowserRouter>
        <AuthProvider>
          <RewardProvider>
            <GameProvider>
              <App />
            </GameProvider>
          </RewardProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);
