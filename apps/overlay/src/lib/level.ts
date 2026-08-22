import type { ScheduleEvent } from "@aion-timetable/shared";

/** Hides instances the player's level can't join; unknown/no restriction always passes. */
export function matchesLevel(event: ScheduleEvent, myLevel: number | null): boolean {
  if (myLevel === null) return true;
  if (event.minLevel === null || event.maxLevel === null) return true;
  return myLevel >= event.minLevel && myLevel <= event.maxLevel;
}
