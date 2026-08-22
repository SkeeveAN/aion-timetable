import { useMemo } from "react";
import type { ScheduleCategory, ScheduleResponse } from "@aion-timetable/shared";
import { formatCountdown, formatLocalTime, nextOccurrenceUtc } from "../lib/time";
import { matchesLevel } from "../lib/level";

const CATEGORY_SHORT: Record<ScheduleCategory, string> = {
  pvp_instances: "PvP",
  arenas: "Arena",
  siege: "Siege",
  rifts: "Rift",
};

const WINDOW_MS = 60 * 60_000;

interface Props {
  schedule: ScheduleResponse;
  myLevel: number | null;
}

export function UpcomingList({ schedule, myLevel }: Props) {
  const now = new Date();

  const upcoming = useMemo(() => {
    return schedule.events
      .filter((event) => matchesLevel(event, myLevel))
      .map((event) => ({
        event,
        next: nextOccurrenceUtc(event.weekday, event.startTime, schedule.serverTime.offsetMinutes, now),
      }))
      .filter(({ next }) => {
        const diff = next.getTime() - now.getTime();
        return diff >= 0 && diff <= WINDOW_MS;
      })
      .sort((a, b) => a.next.getTime() - b.next.getTime());
  }, [schedule, myLevel]);

  return (
    <ul className="upcoming-list">
      {upcoming.map(({ event, next }) => (
        <li key={`${event.id}-${next.getTime()}`} className="upcoming-item">
          <span className="upcoming-category">{CATEGORY_SHORT[event.category]}</span>
          <span className="upcoming-name">{event.name}</span>
          <span className="upcoming-time">
            {formatLocalTime(next)} &middot; {formatCountdown(next, now)}
          </span>
        </li>
      ))}
      {upcoming.length === 0 && (
        <li className="event-empty">Nichts in der nächsten Stunde.</li>
      )}
    </ul>
  );
}
