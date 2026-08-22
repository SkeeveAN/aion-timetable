import {
  sqliteTable,
  integer,
  text,
  real,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const teams = sqliteTable("teams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const teamMembers = sqliteTable("team_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id),
  displayName: text("display_name").notNull(),
  isOwner: integer("is_owner", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const scheduleEvents = sqliteTable(
  "schedule_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    category: text("category", {
      enum: ["pvp_instances", "arenas", "siege", "rifts"],
    }).notNull(),
    name: text("name").notNull(),
    imageUrl: text("image_url"),
    weekday: text("weekday", {
      enum: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
    }).notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    scrapedAt: text("scraped_at").notNull(),
  },
  (table) => ({
    uniqueSlot: uniqueIndex("schedule_events_unique_slot").on(
      table.category,
      table.name,
      table.weekday,
      table.startTime
    ),
  })
);

// Static reference data, independent of the scraper - matched onto scraped
// events by exact name. Not every instance has a level gate (e.g. sieges/rifts
// don't), so absence of a row here means "no restriction known".
export const instanceLevelRequirements = sqliteTable("instance_level_requirements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  minLevel: integer("min_level").notNull(),
  maxLevel: integer("max_level").notNull(),
});

// Localized display names for canonical (English, as-scraped) entity names -
// instance names, world boss names, etc. Missing rows simply fall back to the
// canonical name, so this table can be filled in incrementally per language.
export const entityTranslations = sqliteTable(
  "entity_translations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    canonicalName: text("canonical_name").notNull(),
    language: text("language").notNull(),
    translatedName: text("translated_name").notNull(),
  },
  (table) => ({
    uniqueEntry: uniqueIndex("entity_translations_unique").on(
      table.canonicalName,
      table.language
    ),
  })
);

export const serverTimeMeta = sqliteTable("server_time_meta", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  offsetLabel: text("offset_label").notNull(),
  offsetMinutes: integer("offset_minutes").notNull(),
  scrapedAt: text("scraped_at").notNull(),
});

// Shared game catalog - same for every team, not team-scoped.
export const worldBossTypes = sqliteTable("world_boss_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  displayName: text("display_name").notNull(),
  respawnMinSeconds: integer("respawn_min_seconds").notNull(),
  respawnMaxSeconds: integer("respawn_max_seconds").notNull(),
});

export const worldBossLocations = sqliteTable("world_boss_locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bossTypeId: integer("boss_type_id")
    .notNull()
    .references(() => worldBossTypes.id),
  label: text("label").notNull(),
  mapX: real("map_x"),
  mapY: real("map_y"),
});

// Team-scoped: each team tracks its own kills independently.
export const killRecords = sqliteTable("kill_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id),
  bossLocationId: integer("boss_location_id")
    .notNull()
    .references(() => worldBossLocations.id),
  killedAt: text("killed_at").notNull(),
  reportedByMemberId: integer("reported_by_member_id")
    .notNull()
    .references(() => teamMembers.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id),
  scheduleEventId: integer("schedule_event_id").references(
    () => scheduleEvents.id
  ),
  killRecordId: integer("kill_record_id").references(() => killRecords.id),
  authorMemberId: integer("author_member_id")
    .notNull()
    .references(() => teamMembers.id),
  body: text("body").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});
