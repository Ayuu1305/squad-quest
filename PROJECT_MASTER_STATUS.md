# Project Master Status: Squad Quest

**Generated Date:** January 23, 2026
**Report Type:** Comprehensive Codebase Scan

---

## 1. Project Overview

**App Name:** Squad Quest  
**Description:** A real-world gamified social platform where users ("Heroes") form squads to complete IRL missions, earn XP, and compete on leaderboards.

### Tech Stack

| Component    | Technology        | Key Libraries                                                      |
| :----------- | :---------------- | :----------------------------------------------------------------- |
| **Frontend** | React (Vite)      | `react-router-dom`, `framer-motion`, `tailwindcss`, `lucide-react` |
| **Backend**  | Node.js (Express) | `firebase-admin`, `express-rate-limit`, `cors`                     |
| **Database** | Firestore         | NoSQL Document Store                                               |
| **Auth**     | Firebase Auth     | Google Sign-In, Email/Password                                     |
| **Images**   | html-to-image     | For generating shareable "Hero Cards"                              |

### Folder Structure

- **`/src`**: Frontend source code.
  - **`/components`**: Reusable UI (e.g., `HeroAvatar.jsx`, `QuestCard.jsx`).
  - **`/pages`**: Route views (e.g., `QuestBoard.jsx`, `Leaderboard.jsx`).
  - **`/data`**: Static game data (e.g., quests.js).
- **`/backend`**: Express API server.
  - **`/controllers`**: Business logic (e.g., `questController.js`, `shopController.js`).
  - **`/middleware`**: Auth verification (`auth.js`).

---

## 2. Feature Inventory & User Flows

This section details the major features discovered in the codebase and how they work.

### ⚔️ Quest System

The core loop of the application.

- **Create Quest:** Users can host their own activities.
- **Join Quest:**
  - **User Flow:** User enters Quest ID/Secret Code -> API `/api/quest/join` -> Backend validates Level & Capacity -> Updates `quests` & `users` collections.
  - **Logic:** Includes "Hot Zone" checks (75% full triggers notification).
- **Finalize Quest:**
  - **User Flow:** Host/Member submits photo proof -> API `/api/quest/finalize` -> XP awarded.
  - **Logic:** Calculates bonuses (Punctuality, Photo Evidence, Sunday Showdown).

### 🏆 Leaderboard

Tracks top performers.

- **Weekly:** Resets every week (Sunday night). Users compete for `thisWeekXP`.
- **All-Time:** Based on `lifetimeXP`.
- **Data Source:** Reads directly from the `users` collection (optimized for public read).

### 🛒 Shop & Economy

Hybrid marketplace for digital and physical rewards.

- **Items:**
  - **Real World:** Amazon/Starbucks Vouchers (Managed via `coupon_codes` collection).
  - **Power-Ups:** Streak Freeze, XP Boosts.
  - **Cosmetics:** Neon Frames, Profile Auras.
- **Purchase Flow:**
  - Transactional safety ensures XP is deducted only if the item is in stock (for vouchers).

### 🎭 Vibe Check (Peer Review)

After a quest, users review their squadmates.

- **Flow:** User selects tags (e.g., "Leader", "Funny") -> Backend updates `feedbackCounts`.
- **Badges:** Unlocks badges like "Squad Leader" or "Icebreaker" once threshold (5 votes) is met.

---

## 3. Database Schema (Firestore)

This schema is inferred from the active controller logic (Single Source of Truth).

### `users` (Public Profile)

_Used for Leaderboards and public viewing._

- `uid`: Unique ID
- `name`: Display Name
- `xp`: _Current_ Spendable XP (Wallet)
- `lifetimeXP`: Total XP earned forever (for All-Time Rank)
- `thisWeekXP`: XP earned this week (for Weekly Rank)
- `level`: Current Hero Level
- `reliabilityScore`: 0-100 rating based on quest completion/flaking
- `inventory.badges`: Array of earned badge IDs (e.g., `["FIRST_MISSION", "SQUAD_LEADER"]`)

### `userStats` (Private Data)

_Used for the User's private profile and deeper stats._

- `inventory`: Full inventory including consumables (`streak_freeze`) and cosmetics (`frames`).
- `feedbackCounts`: Counter for badges (e.g., `{ leader: 3, funny: 5 }`).

### `quests` (Active Missions)

- `title`, `description`, `location`
- `hostId`: UID of the creator
- `members`: Array of UIDs `["uid1", "uid2"]`
- `status`: `"open"` | `"completed"` | `"expired"`
- `secretCode`: (Optional) for private lobbies.

---

## 4. Integration Status

### API Architecture

- **Base URL:**
  - Local: `http://localhost:5000`
  - Prod: `https://[project-id].web.app` (Proxied) or Render URL.
- **Authentication:**
  - Frontend gets ID Token via `auth.currentUser.getIdToken()`.
  - Backend middleware `verifyToken` decodes this token to populate `req.user`.

### Critical Integrations

- **Cron Jobs:** `cronService.js` handles Weekly Reset (Sundays) and Quest archiving.
- **Notifications:** Custom localized notification service for "Hero Joined" or "Quest Full" alerts.

---

## 5. Recent Changes & Migration Status

- **Lifetime XP Fix:**
  - We recently introduced `lifetimeXP` to separate "Rank" from "Spendable Currency".
  - A migration script `fixLifetimeXP` was created to sync old users.
- **Badges Sync:**
  - Inventory badges are now synced to the public `users` document so they appear on the Leaderboard cards.
- **Zero-Loop Protocol:**
  - Frontend components (specifically `QuestCard` and `AuthContext`) were patched to prevent infinite read loops.

---

**Status:** ✅ Project is ACTIVE and STABLE.
