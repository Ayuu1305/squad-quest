// import { db } from "./firebaseConfig";
// import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// export const seedSquadQuest = async () => {
//   try {
//     // 1. Create Hubs Collection (Ahmedabad Focus)
//     const hubs = [
//       {
//         id: "hub_cafe_connect",
//         name: "Café Connect",
//         city: "Ahmedabad",
//         lat: 23.0225,
//         long: 72.5714,
//         secretCode: "SQUAD2025",
//         category: "Café",
//         address: "CG Road, Ahmedabad",
//       },
//       {
//         id: "hub_game_arena",
//         name: "Game Arena",
//         city: "Ahmedabad",
//         lat: 23.0304,
//         long: 72.5662,
//         secretCode: "GAME2025",
//         category: "Gaming",
//         address: "SG Highway, Ahmedabad",
//       },
//     ];

//     console.log("Seeding Hubs...");
//     for (const hub of hubs) {
//       const { id, ...data } = hub;
//       await setDoc(doc(db, "hubs", id), data);
//     }

//     // 2. Create Sample Quests
//     const startTime1 = new Date();
//     startTime1.setMinutes(startTime1.getMinutes() + 10);

//     const startTime2 = new Date();
//     startTime2.setMinutes(startTime2.getMinutes() + 30);

//     console.log("Seeding Quests...");
//     const questId1 = "quest_coffee_meetup";
//     await setDoc(doc(db, "quests", questId1), {
//       title: "The Filter Coffee Meetup",
//       hubName: "Café Connect",
//       hubId: "hub_cafe_connect",
//       city: "Ahmedabad",
//       startTime: startTime1,
//       maxPlayers: 5,
//       members: ["sample_hero_1"],
//       status: "open",
//       difficulty: 1,
//       objective: "Discuss 3 movies that changed your life.",
//       loot: "10% Discount + Cinema Badge",
//       vibeCheck: "Chill",
//       createdAt: serverTimestamp(),
//     });

//     const questId2 = "quest_gaming_marathon";
//     await setDoc(doc(db, "quests", questId2), {
//       title: "eSports Qualifier Prep",
//       hubName: "Game Arena",
//       hubId: "hub_game_arena",
//       city: "Ahmedabad",
//       startTime: startTime2,
//       maxPlayers: 4,
//       members: [],
//       status: "open",
//       difficulty: 3,
//       objective: "Scrimmage 3 rounds of Tactical FPS.",
//       loot: "Free Hour Pass + Tactician Tag",
//       vibeCheck: "Competitive",
//       createdAt: serverTimestamp(),
//     });

//     // 3. Create Sample Heroes (Onboarding)
//     console.log("Seeding Hero Profiles...");
//     const heroes = [
//       {
//         uid: "sample_hero_1",
//         name: "Ahmedabad Avenger",
//         email: "avenger@squadquest.com",
//         avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Avenger`,
//         level: 5,
//         xp: 1250,
//         socialXP: 450,
//         energyXP: 800,
//         vibeXP: 300,
//         intelXP: 150,
//         heroClass: "Guardian",
//         reliabilityScore: 100,
//         totalQuests: 12,
//         joinedQuests: [questId1],
//         city: "Ahmedabad",
//         createdAt: serverTimestamp(),
//       },
//       {
//         uid: "sample_hero_2",
//         name: "Cyber Rogue",
//         email: "rogue@squadquest.com",
//         avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Rogue`,
//         level: 4,
//         xp: 950,
//         socialXP: 150,
//         energyXP: 400,
//         vibeXP: 600,
//         intelXP: 350,
//         heroClass: "Rogue",
//         reliabilityScore: 95,
//         totalQuests: 8,
//         joinedQuests: [],
//         city: "Ahmedabad",
//         createdAt: serverTimestamp(),
//       },
//       {
//         uid: "sample_hero_3",
//         name: "Neon Mage",
//         email: "mage@squadquest.com",
//         avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Mage`,
//         level: 3,
//         xp: 600,
//         socialXP: 800,
//         energyXP: 200,
//         vibeXP: 150,
//         intelXP: 900,
//         heroClass: "Mage",
//         reliabilityScore: 98,
//         totalQuests: 5,
//         joinedQuests: [],
//         city: "Ahmedabad",
//         createdAt: serverTimestamp(),
//       },
//     ];

//     for (const hero of heroes) {
//       await setDoc(doc(db, "users", hero.uid), hero);
//     }

//     // 4. Create Sample Chat Message
//     console.log("Seeding Squad Chat...");
//     const messageId = "sample_msg_1";
//     // Using direct path to seed message under the quest's chat sub-collection
//     const messageRef = doc(db, "chats", questId1, "messages", messageId);
//     await setDoc(messageRef, {
//       text: "Is anyone bringing extra dice for the meetup?",
//       senderId: sampleHeroId,
//       createdAt: serverTimestamp(),
//     });

//     console.log(
//       "Database Seeded/Updated Successfully (Hubs, Quests, Users, Chats)!"
//     );
//   } catch (e) {
//     console.error("Error seeding database: ", e);
//   }
// };
