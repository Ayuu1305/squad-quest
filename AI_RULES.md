# 🛡️ SQUAD QUEST - MASTER PROJECT PROTOCOLS

## 1. TECH STACK (STRICT)
- **Frontend:** React (Vite), Tailwind CSS, Framer Motion.
- **Backend:** Node.js v22 (ES Modules), Express.js.
- **Database:** Firebase Firestore (v9 Modular SDK).
- **Deployment:** Render (Backend), Firebase Hosting (Frontend).
- **Plan:** Firebase Spark (Free Tier) - **STRICT QUOTA MANAGEMENT REQUIRED.**

---

## 2. CRITICAL CODING RULES (DO NOT BREAK)
1.  **Node v22 Imports:** NEVER import JSON files directly. ALWAYS use `import fs from 'fs'` and `JSON.parse(fs.readFileSync(...))` for `serviceAccountKey.json`.
2.  **Firebase v9 Syntax:** NEVER use `db.FieldValue`. ALWAYS import modular functions: `arrayUnion`, `increment`, `serverTimestamp`, `doc`, `updateDoc`.
3.  **API URL Strategy:** Frontend MUST use the "Hybrid Switch" to select between `localhost:5000` and `onrender.com`.
4.  **Image Handling:** NEVER save images to local disk (`./uploads`). Render wipes them. ALWAYS upload to Firebase Storage or use Base64.

---

## 3. INFINITE LOOP PREVENTION (THE 3 LAWS)
**⚠️ CONTEXT:** We operate under strict Zero-Loop Protocols due to past Quota Exhaustion events.

### 🚫 LAW 1: THE "ECHO CHAMBER" PREVENTION
**Rule:** Never allow a Firestore Write to trigger a Firestore Read that triggers the Write again.
**Implementation:**
* **Strict State Separation:** Do not use `useEffect` to listen to a document, update local state, and then write back to that *same* document.
* **Primitive Dependencies:** NEVER put whole objects in dependency arrays (e.g., `[user]`). ALWAYS use primitives: `[user?.uid, stats?.xp]`.
* **Guard Clauses:** All writes inside effects must be guarded by a `useRef` check or strict conditional logic.

### 🧟 LAW 2: THE "ZOMBIE LISTENER" PREVENTION
**Rule:** Every single subscription must be cleaned up.
**Implementation:**
* **BAD:** `useEffect(() => { onSnapshot(...) }, [])`
* **GOOD:**
    ```javascript
    useEffect(() => {
      const unsubscribe = onSnapshot(...);
      return () => unsubscribe(); // ✅ MUST HAVE THIS
    }, []);
    ```

### ⚡ LAW 3: EVENT vs. STREAM SEPARATION
**Rule:** Transactional Actions (Writes) must never be automatic.
**Implementation:**
* **Streams (Read):** Use `onSnapshot` for live updates (Chat, Feeds).
* **Actions (Write):** Joining, Claiming, Referrals must **ONLY** be triggered by a user `onClick`.
* **Never** put "Join Logic" or "Referral Logic" inside a `useEffect`.

---

## 4. FEATURE SPECIFIC LOGIC
-   **Create Quest:** `createQuest` in `firebaseService.js` must MANUALLY add the creator to the `members` subcollection. DO NOT call `joinQuest()` inside it.
-   **Leaderboard:** The Backend Controller must ALWAYS return the `badges` array.
-   **Referrals:** Must be a transactional function triggered by a button click, ensuring `referredBy` is empty before writing.
-   **Authentication:** `authMiddleware.js` must strip "Bearer " correctly.

## 5. STABILITY PROTOCOL
-   When asked to "Style" or "Refactor", **NEVER** remove existing logic, imports, or `useEffect` hooks unless they violate the 3 Laws.
-   **Debug First:** If "Quota Exceeded" occurs, scan `AuthContext` and `QuestBoard` for dependency violations first.