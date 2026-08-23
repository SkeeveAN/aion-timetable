import { useMemo } from "react";
import type { LanguageCode, ScheduleResponse } from "@aion-timetable/shared";
import { currentOrNextOccurrence, formatCountdown, formatLocalTime } from "../lib/time";
import { matchesLevel } from "../lib/level";
import { categoryShortLabel } from "../lib/categoryLabels";
import { riftLabel } from "../lib/riftZones";
import { t } from "../lib/uiStrings";

const WINDOW_MS = 60 * 60_000;

interface Props {
  schedule: ScheduleResponse;
  myLevel: number | null;
  language: LanguageCode;
}

export function UpcomingList({ schedule, myLevel, language }: Props) {
  const strings = t(language);
  const now = new Date();

  const upcoming = useMemo(() => {
    return schedule.events
      .filter((event) => matchesLevel(event, myLevel))
      .map((event) => ({
        event,
        occurrence: currentOrNextOccurrence(
          event.weekday,
          event.startTime,
          event.endTime,
          schedule.serverTime.offsetMinutes,
          now
        ),
      }))
      .filter(({ occurrence }) => {
        if (occurrence.isActive) return true;
        const diff = occurrence.start.getTime() - now.getTime();
        return diff >= 0 && diff <= WINDOW_MS;
      })
      .sort((a, b) => a.occurrence.start.getTime() - b.occurrence.start.getTime());
  }, [schedule, myLevel]);

  return (
    <ul className="upcoming-list">
      {upcoming.map(({ event, occurrence }) => (
        <li
          key={`${event.id}-${occurrence.start.getTime()}`}
          className={occurrence.isActive ? "upcoming-item active" : "upcoming-item"}
        >
          <span className="upcoming-category">{categoryShortLabel(language, event.category)}</span>
          <span className="upcoming-name">
            {event.category === "rifts"
              ? riftLabel(event, schedule.events, strings.riftFromToTemplate)
              : event.displayName}
          </span>
          <span className="upcoming-time">
            {occurrence.isActive ? (
              <>
                {strings.upcomingRunning} &middot; {formatCountdown(occurrence.end, now)}
              </>
            ) : (
              <>
                {formatLocalTime(occurrence.start)} &middot;{" "}
                {formatCountdown(occurrence.start, now)}
              </>
            )}
          </span>
        </li>
      ))}
      {upcoming.length === 0 && (
        <li className="event-empty">{strings.upcomingEmpty}</li>
      )}
    </ul>
  );
}
