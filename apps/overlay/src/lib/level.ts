import type { ScheduleEvent } from "@aion-timetable/shared";

/** "61-65", or null when the event has no level requirement on record. */
export function levelRangeLabel(event: ScheduleEvent): string | null {
  if (event.minLevel === null || event.maxLevel === null) return null;
  if (event.minLevel === event.maxLevel) return `${event.minLevel}`;
  return `${event.minLevel}-${event.maxLevel}`;
}
