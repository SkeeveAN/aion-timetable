import { db } from "./client.js";
import {
  worldBossTypes,
  worldBossLocations,
  instanceLevelRequirements,
} from "./schema.js";

// Confirmed for originaion.com directly (see conversation history): Arena of
// Chaos (10-man free-for-all), Discipline (1v1) and Harmony (3v3) each queue
// players into one of four 5-level brackets (46-50/51-55/56-60/61-65), so the
// overall eligible range is 46-65. Arena of Glory (4-man free-for-all) is the
// exception - only the top bracket (61-65) qualifies. Dredgion/battlefield
// values are still sourced from euroaion.com/en-US/AboutServer - cross-check
// against originaion.com if they ever diverge.
const LEVEL_REQUIREMENTS = [
  { name: "Terath Dredgion", minLevel: 56, maxLevel: 65 },
  { name: "Engulfed Ophidan Bridge", minLevel: 61, maxLevel: 65 },
  { name: "Iron Wall Warfront", minLevel: 61, maxLevel: 65 },
  { name: "Kamar Battlefield", minLevel: 61, maxLevel: 65 },
  { name: "Arena of Chaos", minLevel: 46, maxLevel: 65 },
  { name: "Arena of Discipline", minLevel: 46, maxLevel: 65 },
  { name: "Arena of Harmony", minLevel: 46, maxLevel: 65 },
  { name: "Arena of Glory", minLevel: 61, maxLevel: 65 },
];

function seedLevelRequirements() {
  const existing = db.select().from(instanceLevelRequirements).all();
  if (existing.length > 0) {
    console.log("Level requirements already seeded, skipping.");
    return;
  }
  db.insert(instanceLevelRequirements).values(LEVEL_REQUIREMENTS).run();
  console.log("Seeded instance level requirements.");
}

function seedWorldBosses() {
  const existing = db.select().from(worldBossTypes).all();
  if (existing.length > 0) {
    console.log("World boss types already seeded, skipping.");
    return;
  }

  const dabraId = db
    .insert(worldBossTypes)
    .values({
      key: "dabra",
      displayName: "Dabra",
      respawnMinSeconds: 90 * 60,
      respawnMaxSeconds: 150 * 60,
    })
    .run().lastInsertRowid;

  const zumitasId = db
    .insert(worldBossTypes)
    .values({
      key: "zumitas",
      displayName: "Zumitas",
      respawnMinSeconds: 30 * 60,
      respawnMaxSeconds: 30 * 60,
    })
    .run().lastInsertRowid;

  // Location labels only for now - map_x/map_y follow once pinned on the map (see plan).
  db.insert(worldBossLocations)
    .values([
      { bossTypeId: Number(dabraId), label: "Dabra - Open", mapX: null, mapY: null },
      { bossTypeId: Number(dabraId), label: "Dabra - Unten", mapX: null, mapY: null },
      { bossTypeId: Number(zumitasId), label: "Zumitas - Ort 1", mapX: null, mapY: null },
      { bossTypeId: Number(zumitasId), label: "Zumitas - Ort 2", mapX: null, mapY: null },
      { bossTypeId: Number(zumitasId), label: "Zumitas - Ort 3", mapX: null, mapY: null },
      { bossTypeId: Number(zumitasId), label: "Zumitas - Ort 4", mapX: null, mapY: null },
      { bossTypeId: Number(zumitasId), label: "Zumitas - Ort 5", mapX: null, mapY: null },
      { bossTypeId: Number(zumitasId), label: "Zumitas - Ort 6", mapX: null, mapY: null },
    ])
    .run();

  console.log("Seeded world boss types and locations.");
}

seedWorldBosses();
seedLevelRequirements();
