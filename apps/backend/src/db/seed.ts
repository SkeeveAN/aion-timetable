import { eq } from "drizzle-orm";
import { db } from "./client.js";
import {
  worldBossTypes,
  worldBossLocations,
  instanceLevelRequirements,
  entityTranslations,
} from "./schema.js";

// Officially sourced from aioncodex.com's per-language site versions (see
// conversation history) - German/French/Russian names differ meaningfully
// from the English/US naming our scraper uses as canonical, so these are
// real in-game localizations, not guesses. Entries where a language keeps
// the same name as English are simply omitted (falls back correctly).
const OFFICIAL_TRANSLATIONS: { canonicalName: string; language: string; translatedName: string }[] = [
  // Terath Dredgion
  { canonicalName: "Terath Dredgion", language: "de", translatedName: "Sadha-Dredgion" },
  { canonicalName: "Terath Dredgion", language: "fr", translatedName: "Dredgion du Terath" },
  { canonicalName: "Terath Dredgion", language: "ru", translatedName: "Дерадикон Садх" },
  // Engulfed Ophidan Bridge (in-game: Ophidan Bridge / Jormungand's Bridge)
  { canonicalName: "Engulfed Ophidan Bridge", language: "de", translatedName: "Jormungand-Brücke" },
  { canonicalName: "Engulfed Ophidan Bridge", language: "fr", translatedName: "Pont de Jormungand" },
  { canonicalName: "Engulfed Ophidan Bridge", language: "ru", translatedName: "Мост Йормунганда" },
  // Iron Wall Warfront
  { canonicalName: "Iron Wall Warfront", language: "de", translatedName: "Schlachtfeld der Stahlmauerbastion" },
  { canonicalName: "Iron Wall Warfront", language: "fr", translatedName: "Champ de bataille du Bastion du mur d'acier" },
  { canonicalName: "Iron Wall Warfront", language: "ru", translatedName: "Неприступная твердыня" },
  // Kamar Battlefield
  { canonicalName: "Kamar Battlefield", language: "de", translatedName: "Schlachtfeld von Kamar" },
  { canonicalName: "Kamar Battlefield", language: "fr", translatedName: "Champ de bataille de Kamar" },
  { canonicalName: "Kamar Battlefield", language: "ru", translatedName: "Поле битвы Камара" },
  // Arenas
  { canonicalName: "Arena of Chaos", language: "de", translatedName: "Arena der Vehemenz" },
  { canonicalName: "Arena of Chaos", language: "fr", translatedName: "Arène du Chaos" },
  { canonicalName: "Arena of Chaos", language: "ru", translatedName: "Арена хаоса" },
  { canonicalName: "Arena of Discipline", language: "de", translatedName: "Arena der Disziplin" },
  { canonicalName: "Arena of Discipline", language: "fr", translatedName: "Arène de la Discipline" },
  { canonicalName: "Arena of Discipline", language: "ru", translatedName: "Арена доблести" },
  { canonicalName: "Arena of Harmony", language: "de", translatedName: "Arena der Kooperation" },
  { canonicalName: "Arena of Harmony", language: "fr", translatedName: "Arène de la coopération" },
  { canonicalName: "Arena of Harmony", language: "ru", translatedName: "Арена покровительства" },
  { canonicalName: "Arena of Glory", language: "de", translatedName: "Arena des Ruhms" },
  { canonicalName: "Arena of Glory", language: "fr", translatedName: "Arène de la Gloire" },
  { canonicalName: "Arena of Glory", language: "ru", translatedName: "Арена славы" },
  // Siege zones
  { canonicalName: "Sillus", language: "ru", translatedName: "Силлус" },
  { canonicalName: "Silona", language: "de", translatedName: "Bassen" },
  { canonicalName: "Silona", language: "fr", translatedName: "Bassen" },
  { canonicalName: "Silona", language: "ru", translatedName: "Базен" },
  { canonicalName: "Pradeth", language: "de", translatedName: "Prades" },
  { canonicalName: "Pradeth", language: "fr", translatedName: "Pradès" },
  { canonicalName: "Pradeth", language: "ru", translatedName: "Парадес" },
  { canonicalName: "Vorgaltem Citadel", language: "de", translatedName: "Vorgaltem-Turm" },
  { canonicalName: "Vorgaltem Citadel", language: "fr", translatedName: "Tour de Vorgaltem" },
  { canonicalName: "Vorgaltem Citadel", language: "ru", translatedName: "Запечатанная башня" },
  { canonicalName: "Crimson Temple", language: "de", translatedName: "Karmintempel" },
  { canonicalName: "Crimson Temple", language: "fr", translatedName: "Temple Pourpre" },
  { canonicalName: "Crimson Temple", language: "ru", translatedName: "Храм красной земли" },
  { canonicalName: "Altar of Avarice", language: "de", translatedName: "Altar der Gier" },
  { canonicalName: "Altar of Avarice", language: "fr", translatedName: "Autel de l'avidité" },
  { canonicalName: "Altar of Avarice", language: "ru", translatedName: "Алтарь алчности" },
  { canonicalName: "Temple of Scales", language: "de", translatedName: "Altdrachentempel" },
  { canonicalName: "Temple of Scales", language: "fr", translatedName: "Temple de l'Ancien dragon" },
  { canonicalName: "Temple of Scales", language: "ru", translatedName: "Храм древнего дракона" },
  { canonicalName: "Miren/Krotan/Kysis", language: "ru", translatedName: "Ра-Мирэн/Кротан/Ткисас" },
  // Rift zones - DE/FR keep the English name except Heiron (RU-only difference below applies to all)
  { canonicalName: "Heiron", language: "ru", translatedName: "Интердика" },
  { canonicalName: "Eltnen", language: "ru", translatedName: "Элтенен" },
  { canonicalName: "Morheim", language: "ru", translatedName: "Морхейм" },
  { canonicalName: "Beluslan", language: "ru", translatedName: "Белуслан" },
  { canonicalName: "Inggison", language: "ru", translatedName: "Ингисон" },
  { canonicalName: "Gelkmaros", language: "ru", translatedName: "Келькмарос" },
  // Keymasters (Dabra/Zumita)
  { canonicalName: "Dabra", language: "de", translatedName: "Davra" },
  { canonicalName: "Dabra", language: "fr", translatedName: "Davra" },
  { canonicalName: "Dabra", language: "ru", translatedName: "Дабра" },
  { canonicalName: "Zumita", language: "de", translatedName: "Jumita" },
  { canonicalName: "Zumita", language: "fr", translatedName: "Jumita" },
  { canonicalName: "Zumita", language: "ru", translatedName: "Джумита" },
];

// AION never had an official Spanish, Italian, or Turkish client - there is
// no in-game source to copy these from. These are best-effort community-style
// translations (descriptive names translated for meaning; proper nouns left
// as-is), explicitly lower-confidence than OFFICIAL_TRANSLATIONS above.
const COMMUNITY_TRANSLATIONS: { canonicalName: string; language: string; translatedName: string }[] = [
  { canonicalName: "Terath Dredgion", language: "es", translatedName: "Dredgion de Terath" },
  { canonicalName: "Terath Dredgion", language: "it", translatedName: "Dredgion di Terath" },
  { canonicalName: "Engulfed Ophidan Bridge", language: "es", translatedName: "Puente de Jormungand" },
  { canonicalName: "Engulfed Ophidan Bridge", language: "it", translatedName: "Ponte di Jormungand" },
  { canonicalName: "Engulfed Ophidan Bridge", language: "tr", translatedName: "Jormungand Köprüsü" },
  { canonicalName: "Iron Wall Warfront", language: "es", translatedName: "Campo de Batalla del Bastión del Muro de Acero" },
  { canonicalName: "Iron Wall Warfront", language: "it", translatedName: "Campo di Battaglia del Bastione del Muro d'Acciaio" },
  { canonicalName: "Iron Wall Warfront", language: "tr", translatedName: "Çelik Duvar Kalesi Savaş Alanı" },
  { canonicalName: "Kamar Battlefield", language: "es", translatedName: "Campo de Batalla de Kamar" },
  { canonicalName: "Kamar Battlefield", language: "it", translatedName: "Campo di Battaglia di Kamar" },
  { canonicalName: "Kamar Battlefield", language: "tr", translatedName: "Kamar Savaş Alanı" },
  { canonicalName: "Arena of Chaos", language: "es", translatedName: "Arena del Caos" },
  { canonicalName: "Arena of Chaos", language: "it", translatedName: "Arena del Caos" },
  { canonicalName: "Arena of Chaos", language: "tr", translatedName: "Kaos Arenası" },
  { canonicalName: "Arena of Discipline", language: "es", translatedName: "Arena de la Disciplina" },
  { canonicalName: "Arena of Discipline", language: "it", translatedName: "Arena della Disciplina" },
  { canonicalName: "Arena of Discipline", language: "tr", translatedName: "Disiplin Arenası" },
  { canonicalName: "Arena of Harmony", language: "es", translatedName: "Arena de la Armonía" },
  { canonicalName: "Arena of Harmony", language: "it", translatedName: "Arena dell'Armonia" },
  { canonicalName: "Arena of Harmony", language: "tr", translatedName: "Uyum Arenası" },
  { canonicalName: "Arena of Glory", language: "es", translatedName: "Arena de la Gloria" },
  { canonicalName: "Arena of Glory", language: "it", translatedName: "Arena della Gloria" },
  { canonicalName: "Arena of Glory", language: "tr", translatedName: "Zafer Arenası" },
  { canonicalName: "Vorgaltem Citadel", language: "es", translatedName: "Ciudadela de Vorgaltem" },
  { canonicalName: "Vorgaltem Citadel", language: "it", translatedName: "Cittadella di Vorgaltem" },
  { canonicalName: "Vorgaltem Citadel", language: "tr", translatedName: "Vorgaltem Kalesi" },
  { canonicalName: "Crimson Temple", language: "es", translatedName: "Templo Carmesí" },
  { canonicalName: "Crimson Temple", language: "it", translatedName: "Tempio Cremisi" },
  { canonicalName: "Crimson Temple", language: "tr", translatedName: "Kızıl Tapınak" },
  { canonicalName: "Altar of Avarice", language: "es", translatedName: "Altar de la Avaricia" },
  { canonicalName: "Altar of Avarice", language: "it", translatedName: "Altare dell'Avidità" },
  { canonicalName: "Altar of Avarice", language: "tr", translatedName: "Hırs Sunağı" },
  { canonicalName: "Temple of Scales", language: "es", translatedName: "Templo de las Escamas" },
  { canonicalName: "Temple of Scales", language: "it", translatedName: "Tempio delle Squame" },
  { canonicalName: "Temple of Scales", language: "tr", translatedName: "Pullar Tapınağı" },
];

function seedEntityTranslations() {
  const existing = db.select().from(entityTranslations).all();
  if (existing.length > 0) {
    console.log("Entity translations already seeded, skipping.");
    return;
  }
  db.insert(entityTranslations)
    .values([...OFFICIAL_TRANSLATIONS, ...COMMUNITY_TRANSLATIONS])
    .run();
  console.log(
    `Seeded ${OFFICIAL_TRANSLATIONS.length + COMMUNITY_TRANSLATIONS.length} entity translations.`
  );
}

// Confirmed for originaion.com directly (see conversation history): Terath
// Dredgion runs under different in-game names depending on the level
// bracket, so it queues into all four 5-level brackets (46-50/51-55/56-60/
// 61-65) like the arenas below - overall eligible range 46-65. Engulfed
// Ophidan Bridge, Iron Wall Warfront and Kamar Battlefield are endgame-only
// (61-65), no lower-level bracket exists for them. Arena of Chaos (10-man
// free-for-all)/Discipline (1v1)/Harmony (3v3) queue into all four brackets
// like Terath Dredgion; Arena of Glory (4-man free-for-all) is the exception
// - only the top bracket (61-65) qualifies.
const LEVEL_REQUIREMENTS = [
  { name: "Terath Dredgion", minLevel: 46, maxLevel: 65 },
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

  // Note: Dabra and Zumita are "Keymaster" NPCs per aioncodex.com
  // (https://aioncodex.com/4x/npc/219193/ and .../219192/), not classic world
  // bosses - tracked the same way here regardless (spawn + respawn window).
  const zumitaId = db
    .insert(worldBossTypes)
    .values({
      key: "zumita",
      displayName: "Zumita",
      respawnMinSeconds: 30 * 60,
      respawnMaxSeconds: 30 * 60,
    })
    .run().lastInsertRowid;

  // Location labels only for now - map_x/map_y and the real spawn-point names
  // follow once pinned on the map (see plan / aioncodex research).
  db.insert(worldBossLocations)
    .values([
      { bossTypeId: Number(dabraId), label: "Dabra - Open", mapX: null, mapY: null },
      { bossTypeId: Number(dabraId), label: "Dabra - Unten", mapX: null, mapY: null },
      { bossTypeId: Number(zumitaId), label: "Zumita - Ort 1", mapX: null, mapY: null },
      { bossTypeId: Number(zumitaId), label: "Zumita - Ort 2", mapX: null, mapY: null },
      { bossTypeId: Number(zumitaId), label: "Zumita - Ort 3", mapX: null, mapY: null },
      { bossTypeId: Number(zumitaId), label: "Zumita - Ort 4", mapX: null, mapY: null },
      { bossTypeId: Number(zumitaId), label: "Zumita - Ort 5", mapX: null, mapY: null },
      { bossTypeId: Number(zumitaId), label: "Zumita - Ort 6", mapX: null, mapY: null },
    ])
    .run();

  console.log("Seeded world boss types and locations.");
}

interface AdditionalBossSpec {
  key: string;
  displayName: string;
  respawnMinSeconds: number;
  respawnMaxSeconds: number;
  locations: string[];
}

const HOUR = 3600;
const DAY = 86400;

// Respawn timers datamined from the beyond-aion/aion-server open-source
// emulator (branch 4.7.5, game-server/data/static_data/spawns/Npcs/*.xml,
// respawn_time attribute) - reverse-engineered from real spawn data, not
// official patch notes, so medium-high confidence rather than confirmed.
// Isbariya the Resolute, Hyperion and the Queen Modor variants were
// investigated and excluded: all three are instanced (dungeon/raid) bosses
// with weekly lockouts, not open-world spawns, matching the same reasoning
// that already excluded Ahbana. Kordac and "Dragon Lord's Champion" were
// searched for extensively and do not appear to exist in AION under any
// spelling - not seeded rather than inventing data.
const ADDITIONAL_WORLD_BOSSES: AdditionalBossSpec[] = [
  { key: "high_priest_yatri", displayName: "High Priest Yatri", respawnMinSeconds: 14000, respawnMaxSeconds: 14000, locations: ["Heiron"] },
  { key: "scout_dehavi", displayName: "Scout Dehavi", respawnMinSeconds: 4 * HOUR, respawnMaxSeconds: 4 * HOUR, locations: ["Heiron"] },
  { key: "bollvig_blackheart", displayName: "Bollvig Blackheart", respawnMinSeconds: 6 * HOUR, respawnMaxSeconds: 6 * HOUR, locations: ["Heiron"] },
  { key: "high_mage_brashuna", displayName: "High Mage Brashuna", respawnMinSeconds: 4 * HOUR, respawnMaxSeconds: 4 * HOUR, locations: ["Heiron"] },
  { key: "bulwark_jeshuchi", displayName: "Bulwark Jeshuchi", respawnMinSeconds: 4 * HOUR, respawnMaxSeconds: 4 * HOUR, locations: ["Heiron"] },
  { key: "guardian_vingeveu", displayName: "Guardian Vingeveu", respawnMinSeconds: 4 * HOUR, respawnMaxSeconds: 4 * HOUR, locations: ["Heiron"] },
  { key: "watcher_zapiel", displayName: "Watcher Zapiel", respawnMinSeconds: 6 * HOUR, respawnMaxSeconds: 6 * HOUR, locations: ["Heiron"] },
  { key: "deputy_hanuman", displayName: "Deputy Hanuman", respawnMinSeconds: 6 * HOUR, respawnMaxSeconds: 6 * HOUR, locations: ["Heiron"] },
  { key: "omega", displayName: "Omega", respawnMinSeconds: 20 * HOUR, respawnMaxSeconds: 20 * HOUR, locations: ["Inggison"] },
  { key: "ragnarok", displayName: "Ragnarok", respawnMinSeconds: 20 * HOUR, respawnMaxSeconds: 20 * HOUR, locations: ["Gelkmaros"] },
  { key: "menotios", displayName: "Menotios", respawnMinSeconds: 28 * HOUR, respawnMaxSeconds: 28 * HOUR, locations: ["Reshanta"] },
  { key: "debarim_the_omnipotent", displayName: "Debarim the Omnipotent", respawnMinSeconds: 21240, respawnMaxSeconds: 21240, locations: ["Sarpan"] },
  { key: "ativas_crystalline", displayName: "Ativas Crystalline", respawnMinSeconds: 4 * HOUR, respawnMaxSeconds: 4 * HOUR, locations: ["Tiamaranta"] },
  { key: "golden_tatar", displayName: "Golden Tatar", respawnMinSeconds: 4 * HOUR, respawnMaxSeconds: 4 * HOUR, locations: ["Tiamaranta"] },
  { key: "kradi_the_glutton", displayName: "Kradi the Glutton", respawnMinSeconds: 4 * HOUR, respawnMaxSeconds: 4 * HOUR, locations: ["Tiamaranta - Ort 1", "Tiamaranta - Ort 2"] },
  { key: "grand_chieftain_saendukal", displayName: "Grand Chieftain Saendukal", respawnMinSeconds: 6 * HOUR, respawnMaxSeconds: 6 * HOUR, locations: ["Eltnen"] },

  // Rough approximations, not a real kill->respawn cycle (see conversation):
  // Medeus spawns in a nightly window (~21:00-04:00 server time) rather than
  // on a fixed timer; Moltenus is a weekly event (Sunday ~20:00) at one of
  // three fortress locations, despawning after 1h if not killed. Modeled
  // here as a ~1 day / ~1 week window so the app still shows something
  // useful, clearly not the same confidence level as the timer-based bosses.
  { key: "medeus_the_vile", displayName: "Medeus the Vile", respawnMinSeconds: DAY, respawnMaxSeconds: DAY, locations: ["Heiron"] },
  { key: "moltenus", displayName: "Moltenus", respawnMinSeconds: 7 * DAY, respawnMaxSeconds: 7 * DAY, locations: ["Krotan Refuge", "Miren Fortress", "Kysis Fortress"] },

  // Sunayaka family - all three confirmed real NPCs in Tiamaranta's Eye;
  // exact spawn schedule conflicts between sources (daily window, exact
  // clock time unverified), so treated the same way as Medeus above.
  { key: "governor_sunayaka", displayName: "Governor Sunayaka", respawnMinSeconds: DAY, respawnMaxSeconds: DAY, locations: ["Tiamaranta's Eye"] },
  { key: "berserker_sunayaka", displayName: "Berserker Sunayaka", respawnMinSeconds: DAY, respawnMaxSeconds: DAY, locations: ["Tiamaranta's Eye"] },
  { key: "commander_sunayaka", displayName: "Commander Sunayaka", respawnMinSeconds: DAY, respawnMaxSeconds: DAY, locations: ["Tiamaranta's Eye"] },
];

function seedAdditionalWorldBosses() {
  const existing = db
    .select()
    .from(worldBossTypes)
    .where(eq(worldBossTypes.key, "omega"))
    .get();
  if (existing) {
    console.log("Additional world bosses already seeded, skipping.");
    return;
  }

  for (const spec of ADDITIONAL_WORLD_BOSSES) {
    const bossId = db
      .insert(worldBossTypes)
      .values({
        key: spec.key,
        displayName: spec.displayName,
        respawnMinSeconds: spec.respawnMinSeconds,
        respawnMaxSeconds: spec.respawnMaxSeconds,
      })
      .run().lastInsertRowid;

    db.insert(worldBossLocations)
      .values(
        spec.locations.map((label) => ({
          bossTypeId: Number(bossId),
          label,
          mapX: null,
          mapY: null,
        }))
      )
      .run();
  }

  console.log(`Seeded ${ADDITIONAL_WORLD_BOSSES.length} additional world bosses.`);
}

seedWorldBosses();
seedAdditionalWorldBosses();
seedLevelRequirements();
seedEntityTranslations();
