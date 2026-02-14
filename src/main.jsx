import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { GameProvider } from "./context/GameContext";
import { AuthProvider } from "./context/AuthContext";
import { RewardProvider } from "./context/RewardContext";
import { VendorAuthProvider } from "./context/VendorAuthContext";




// 👇👇👇 PASTE THIS BLOCK HERE (THE CRITICAL FIX) 👇👇👇
if (!window.requestIdleCallback) {
  window.requestIdleCallback = function (cb) {
    var start = Date.now();
    return setTimeout(function () {
      cb({
        didTimeout: false,
        timeRemaining: function () {
          return Math.max(0, 50 - (Date.now() - start));
        }
      });
    }, 1);
  };
}

if (!window.cancelIdleCallback) {
  window.cancelIdleCallback = function (id) {
    clearTimeout(id);
  };
}
// 👆👆👆 END OF FIX 👆👆👆




createRoot(document.getElementById("root")).render(
  <>
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
  </>,
);
