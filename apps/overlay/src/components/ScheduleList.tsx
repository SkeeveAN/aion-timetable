import { useMemo } from "react";
import type { ScheduleCategory, ScheduleResponse } from "@aion-timetable/shared";
import { formatCountdown, formatLocalTime, nextOccurrenceUtc } from "../lib/time";
import { matchesLevel } from "../lib/level";

const CATEGORY_LABELS: Record<ScheduleCategory, string> = {
  pvp_instances: "PvP Instances",
  arenas: "Arenas",
  siege: "Siege",
  rifts: "Rifts",
};

interface Props {
  schedule: ScheduleResponse;
  activeCategory: ScheduleCategory;
  onCategoryChange: (category: ScheduleCategory) => void;
  myLevel: number | null;
}

export function ScheduleList({ schedule, activeCategory, onCategoryChange, myLevel }: Props) {
  const now = new Date();

  const upcoming = useMemo(() => {
    return schedule.events
      .filter((e) => e.category === activeCategory && matchesLevel(e, myLevel))
      .map((e) => ({
        event: e,
        next: nextOccurrenceUtc(e.weekday, e.startTime, schedule.serverTime.offsetMinutes, now),
      }))
      .sort((a, b) => a.next.getTime() - b.next.getTime())
      .slice(0, 8);
  }, [schedule, activeCategory, myLevel]);

  return (
    <div className="schedule-list">
      <div className="category-tabs">
        {(Object.entries(CATEGORY_LABELS) as [ScheduleCategory, string][]).map(
          ([key, label]) => (
            <button
              key={key}
              className={key === activeCategory ? "tab active" : "tab"}
              onClick={() => onCategoryChange(key)}
            >
              {label}
            </button>
          )
        )}
      </div>

      <ul className="event-items">
        {upcoming.map(({ event, next }) => (
          <li key={`${event.id}-${next.getTime()}`} className="event-item">
            <span className="event-name">{event.name}</span>
            <span className="event-time">
              {event.startTime} Server &middot; {formatLocalTime(next)} lokal &middot;{" "}
              {formatCountdown(next, now)}
            </span>
          </li>
        ))}
        {upcoming.length === 0 && <li className="event-empty">Keine Termine gefunden.</li>}
      </ul>
    </div>
  );
}
