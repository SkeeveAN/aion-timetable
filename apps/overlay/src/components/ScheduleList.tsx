import { useMemo } from "react";
import type { LanguageCode, ScheduleCategory, ScheduleResponse } from "@aion-timetable/shared";
import { SCHEDULE_CATEGORIES } from "@aion-timetable/shared";
import { currentOrNextOccurrence, formatCountdown, formatLocalTime } from "../lib/time";
import { matchesLevel } from "../lib/level";
import { categoryLabel } from "../lib/categoryLabels";
import { t } from "../lib/uiStrings";

interface Props {
  schedule: ScheduleResponse;
  activeCategory: ScheduleCategory;
  onCategoryChange: (category: ScheduleCategory) => void;
  myLevel: number | null;
  language: LanguageCode;
}

export function ScheduleList({
  schedule,
  activeCategory,
  onCategoryChange,
  myLevel,
  language,
}: Props) {
  const strings = t(language);
  const now = new Date();

  const upcoming = useMemo(() => {
    return schedule.events
      .filter((e) => e.category === activeCategory && matchesLevel(e, myLevel))
      .map((e) => ({
        event: e,
        occurrence: currentOrNextOccurrence(
          e.weekday,
          e.startTime,
          e.endTime,
          schedule.serverTime.offsetMinutes,
          now
        ),
      }))
      .sort((a, b) => a.occurrence.start.getTime() - b.occurrence.start.getTime())
      .slice(0, 8);
  }, [schedule, activeCategory, myLevel]);

  return (
    <div className="schedule-list">
      <div className="category-tabs">
        {SCHEDULE_CATEGORIES.map((key) => (
          <button
            key={key}
            className={key === activeCategory ? "tab active" : "tab"}
            onClick={() => onCategoryChange(key)}
          >
            {categoryLabel(language, key)}
          </button>
        ))}
      </div>

      <ul className="event-items">
        {upcoming.map(({ event, occurrence }) => (
          <li
            key={`${event.id}-${occurrence.start.getTime()}`}
            className={occurrence.isActive ? "event-item active" : "event-item"}
          >
            <span className="event-name">{event.displayName}</span>
            <span className="event-time">
              {occurrence.isActive ? (
                <>
                  {strings.upcomingRunning} &middot; {formatCountdown(occurrence.end, now)}
                </>
              ) : (
                <>
                  {event.startTime} {strings.scheduleServerSuffix} &middot;{" "}
                  {formatLocalTime(occurrence.start)} {strings.scheduleLocalSuffix} &middot;{" "}
                  {formatCountdown(occurrence.start, now)}
                </>
              )}
            </span>
          </li>
        ))}
        {upcoming.length === 0 && <li className="event-empty">{strings.scheduleEmpty}</li>}
      </ul>
    </div>
  );
}
