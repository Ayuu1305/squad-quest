# Squad Quest - Gamified Social Platform

## ⚔️ Project Overview

**Squad Quest** is a real-world Role-Playing Game (RPG) social platform that turns social interactions into localized quests. Users (Heroes) join squads, complete real-world missions, earn XP, and climb the leaderboard in their city.

## 🛠️ Tech Stack

- **Frontend library:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + Custom "Neon/Cyberpunk" Theme
- **Animations:** Framer Motion
- **Backend Service:** Firebase (Authentication, Firestore Database)
- **Icons:** Lucide React

---

## 🔐 Authentication & Security

### 1. Authentication Flow (`src/context/AuthContext.jsx`)

The application uses **Firebase Authentication** for secure user management.

- **Providers:** Email/Password and Google Sign-In.
- **State Management:** The `AuthContext` listens to `onAuthStateChanged`. When a user logs in, it automatically subscribes to their Firestore User Document (`users/{uid}`) to sync real-time stats (XP, Level, Class).
- **Protection:** All critical routes are wrapped in protection components.

### 2. Route Security (`src/App.jsx`)

We implement granular route protection to ensure data integrity and user flow requirements:

- **`AuthRoute`**: Redirects logged-in users away from Login/Signup pages (prevents duplicate auth).
- **`UserProtectedRoute`**: Requires a valid Firebase Auth session. Used for pages like `Profile` where city selection isn't strictly required yet.
- **`CitySelectionRoute`**: Ensures users select a city before entering the main game.
- **`ProtectedRoute`**: The strictest level. Requires **Auth + City Selection**. Protects the Core Game Loop (`/board`, `/leaderboard`, `/quest/:id`).

### 3. Backend Security Logic (`src/backend/firebaseService.js`)

Although running on the client, the service layer implements business logic intended to be mirrored by Firestore Security Rules:

- **Gender Verification**: `joinQuest` checks if a quest is restricted ("Females Only" / "Males Only") and validates the user's gender before allowing entry.
- **Transactional Updates**: Critical stats like `XP`, `ReliabilityScore`, and `DailyBounty` use `runTransaction` to prevent race conditions during concurrent updates.
- **Idempotency**: `onboardHero` checks if a profile exists before writing, preventing data overwrite.

---

## 📂 Key Components & Architecture

### 1. Core Services (`src/backend/`)

- **`firebaseConfig.jsx`**: Initializes the Firebase App instance.
- **`firebaseService.js`**: The monolithic service layer handling all database interactions.
  - `onboardHero(user)`: Creates the initial Hero profile with default stats (Level 1, Novice Class).
  - `joinQuest(questId, userId)`: Adds user to quest `members` array and logs valid activity.
  - `awardXP(userId, amount)`: Handles XP updates, including the **Weekly Lazy Reset** logic which resets `thisWeekXP` on the first interaction of a new week.
  - `checkLevelUp(userId)`: Calculates level progression based on `Level * 100` formula, handling XP carry-over.

### 2. Main Pages (`src/pages/`)

- **`Landing.jsx`**: The "Portal" where users select their city (e.g., Ahmedabad, Bangalore) to initialize the game scope.
- **`QuestBoard.jsx`**: The main hub. Displays active quests using a grid layout. Implements search and filtering.
- **`Leaderboard.jsx`**: Displays top heroes.
  - **Features**: Weekly vs. All-Time toggles, "Winner's Circle" modal, and "Sunday Showdown" countdown.
  - **Components**: Uses `LeaderboardPodium` for the top 3 visual display.
- **`Verification.jsx`**: The end-of-quest flow. Users scan QRs or upload photos to verify mission completion and earn rewards.

### 3. Shared Components (`src/components/`)

- **`HeroCardGenerator.jsx`**: Generates a downloadable, "Trading Card" style image of the user's profile with stats and QR code.
- **`HeroAvatar.jsx`**: A centralized avatar component that renders the correct border color and glow based on the user's Tier (Bronze, Silver, Gold, etc.).
- **`Navbar.jsx`**: Responsive navigation bar. Conditionally rendered based on the active route.

---

## ⚡ Game Mechanics (Utils)

### XP & Leveling (`src/utils/xp.js`)

- **Tiers**: Ranks are calculated dynamically based on XP (Apprentice -> Scout -> Vanguard -> Legend).
- **Class System**: Users earn titles like "Ranger" or "Paladin" based on their level.
- **Reliability**: A score (0-100%) that tracks quest completion rate. Dropping too low restricts quest access.

### Showdown Mode (`src/hooks/useShowdown.js`)

- **Sunday Night Showdown**: A special event mode active on Sundays (9 PM - 12 AM).
- **Multiplier**: XP earned during this window is doubled (`2x Multiplier` applied in `awardXP`).
- **UI**: Triggered by `useShowdown` hook, causing UI elements to glow red and show countdowns.

---

## 🚀 How to Run

1. **Install Dependencies**: `npm install`
2. **Start Dev Server**: `npm run dev`
3. **Build for Production**: `npm run build`
