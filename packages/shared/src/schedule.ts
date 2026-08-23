export const SCHEDULE_CATEGORIES = [
  "pvp_instances",
  "arenas",
  "siege",
  "rifts",
  "duel",
] as const;

export type ScheduleCategory = (typeof SCHEDULE_CATEGORIES)[number];

export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

/** A single recurring weekly time window, e.g. Siege on Tiamaranta every Monday 20:00-21:00 server time. */
export interface ScheduleEvent {
  id: number;
  category: ScheduleCategory;
  /** Canonical (English, as-scraped) name - stable key, used for level-requirement matching etc. */
  name: string;
  /** Name to actually show in the UI, resolved server-side for the requested language. Falls back to `name`. */
  displayName: string;
  imageUrl: string | null;
  weekday: Weekday;
  /** "HH:MM" in server time */
  startTime: string;
  /** "HH:MM" in server time */
  endTime: string;
  scrapedAt: string;
  /** null when no level restriction is known for this instance (e.g. sieges/rifts) */
  minLevel: number | null;
  maxLevel: number | null;
}

export interface ServerTimeMeta {
  /** raw text scraped from the site, e.g. "GMT +2" */
  offsetLabel: string;
  /** offset from UTC in minutes, e.g. 120 */
  offsetMinutes: number;
  scrapedAt: string;
}

export interface ScheduleResponse {
  events: ScheduleEvent[];
  serverTime: ServerTimeMeta;
}
