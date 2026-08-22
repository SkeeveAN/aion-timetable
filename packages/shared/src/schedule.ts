export const SCHEDULE_CATEGORIES = [
  "pvp_instances",
  "arenas",
  "siege",
  "rifts",
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
  name: string;
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
