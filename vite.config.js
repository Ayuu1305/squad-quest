import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    // Optional – enable only when you need it
    visualizer({
      open: true, // ✅ Auto-open stats.html after build
      filename: "stats.html",
      gzipSize: true,
      brotliSize: true,
    }),

    VitePWA({
      registerType: "autoUpdate",

      // 🔥 IMPORTANT for local testing: Lets you see PWA behavior in 'npm run dev'
      devOptions: {
        enabled: true,
      },

      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],

      manifest: {
        name: "Squad Quest",
        short_name: "SquadQuest",
        description:
          "Real World RPG. Complete Quests, Earn XP, Rule Your City.",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",

        display: "standalone", // 🚀 FULLSCREEN APP (Removes URL bar)
        orientation: "portrait",
        start_url: "/",

        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],

  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": ["framer-motion", "lucide-react"],
          "vendor-firebase": [
            "firebase/app",
            "firebase/auth",
            "firebase/firestore",
            "firebase/functions",
          ],
          "vendor-gsap": ["gsap", "lenis"],
        },
      },
    },
  },
});
