# 🛡️ SQUAD QUEST - PROJECT RULES & MEMORY

## 1. TECH STACK (STRICT)
- **Frontend:** React (Vite), Tailwind CSS, Framer Motion.
- **Backend:** Node.js v22 (ES Modules), Express.js.
- **Database:** Firebase Firestore (v9 Modular SDK).
- **Deployment:** Render (Backend), Firebase Hosting (Frontend).

## 2. CRITICAL CODING RULES (DO NOT BREAK)
1.  **Node v22 Imports:** NEVER import JSON files directly (e.g., `import key from './key.json'`). ALWAYS use `import fs from 'fs'` and `JSON.parse(fs.readFileSync(...))` for `serviceAccountKey.json`.
2.  **Firebase v9 Syntax:** NEVER use `db.FieldValue`. ALWAYS import modular functions: `arrayUnion`, `increment`, `serverTimestamp`, `doc`, `updateDoc`.
3.  **API URL Strategy:** Frontend MUST use the "Hybrid Switch" (checking `window.location.hostname`) to select between `localhost:5000` and `onrender.com`.
4.  **Image Handling:** NEVER save images to local disk (`./uploads`). Render wipes them. ALWAYS upload to Firebase Storage or use Base64 if necessary.

## 3. FEATURE SPECIFIC LOGIC
- **Create Quest:** The `createQuest` function in `firebaseService.js` must MANUALLY add the creator to the `participants` array. DO NOT call `joinQuest()` inside it (prevents circular dependency errors).
- **Leaderboard:** The Backend Controller (`leaderboardController.js`) must ALWAYS select/return the `badges` array.
- **Authentication:** `authMiddleware.js` must strip "Bearer " correctly and catch "Service Account" errors explicitly.

## 4. STABILITY PROTOCOL
- When asked to "Style" or "Refactor", **NEVER** remove existing logic, imports, or `useEffect` hooks.
- If editing a Component, keep all existing props and state unless explicitly told to remove them.