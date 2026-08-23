import { useMemo } from "react";
import type { LanguageCode, ScheduleCategory, ScheduleResponse } from "@aion-timetable/shared";
import { SCHEDULE_CATEGORIES } from "@aion-timetable/shared";
import { currentOrNextOccurrence, formatCountdown, formatLocalTime } from "../lib/time";
import { matchesLevel } from "../lib/level";
import { categoryLabel } from "../lib/categoryLabels";
import { riftLabel } from "../lib/riftZones";
import { groupByFamily } from "../lib/eventGroups";
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
    const withOccurrence = schedule.events
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
      }));

    return groupByFamily(
      withOccurrence,
      (i) => i.event,
      (i) => i.occurrence.start.getTime()
    )
      .sort(
        (a, b) => a.items[0].occurrence.start.getTime() - b.items[0].occurrence.start.getTime()
      )
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
        {upcoming.map((group) => {
          const { event, occurrence } = group.items[0];
          const name =
            activeCategory === "rifts" && group.items.length === 1
              ? riftLabel(event, schedule.events, strings.riftFromToTemplate)
              : group.displayName;

          return (
            <li
              key={`${group.items.map((i) => i.event.id).join("-")}-${occurrence.start.getTime()}`}
              className={occurrence.isActive ? "event-item active" : "event-item"}
            >
              <span className="event-name">{name}</span>
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
          );
        })}
        {upcoming.length === 0 && <li className="event-empty">{strings.scheduleEmpty}</li>}
      </ul>
    </div>
  );
}
