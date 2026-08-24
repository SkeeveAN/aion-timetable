import { useMemo } from "react";
import type { LanguageCode, ScheduleResponse } from "@aion-timetable/shared";
import { currentOrNextOccurrence, formatCountdown, formatLocalTime } from "../lib/time";
import { categoryShortLabel } from "../lib/categoryLabels";
import { levelRangeLabel } from "../lib/level";
import { riftLabel } from "../lib/riftZones";
import { groupByFamily } from "../lib/eventGroups";
import { t } from "../lib/uiStrings";

const WINDOW_MS = 60 * 60_000;

interface Props {
  schedule: ScheduleResponse;
  language: LanguageCode;
}

export function UpcomingList({ schedule, language }: Props) {
  const strings = t(language);
  const now = new Date();

  const upcoming = useMemo(() => {
    const withOccurrence = schedule.events
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
      });

    return groupByFamily(
      withOccurrence,
      (i) => i.event,
      (i) => i.occurrence.start.getTime()
    ).sort(
      (a, b) => a.items[0].occurrence.start.getTime() - b.items[0].occurrence.start.getTime()
    );
  }, [schedule]);

  return (
    <ul className="upcoming-list">
      {upcoming.map((group) => {
        const { event, occurrence } = group.items[0];
        const name =
          event.category === "rifts" && group.items.length === 1
            ? riftLabel(event, schedule.events, strings.riftFromToTemplate)
            : group.displayName;
        const level = levelRangeLabel(event);

        return (
          <li
            key={`${group.items.map((i) => i.event.id).join("-")}-${occurrence.start.getTime()}`}
            className={occurrence.isActive ? "upcoming-item active" : "upcoming-item"}
          >
            <span className="upcoming-category">{categoryShortLabel(language, event.category)}</span>
            <span className="upcoming-name">{name}</span>
            {level && <span className="upcoming-level">{level}</span>}
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
        );
      })}
      {upcoming.length === 0 && (
        <li className="event-empty">{strings.upcomingEmpty}</li>
      )}
    </ul>
  );
}
