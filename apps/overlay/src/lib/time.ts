import type { Weekday } from "@aion-timetable/shared";

const WEEKDAY_INDEX: Record<Weekday, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Given a recurring weekly slot expressed in server-local time (weekday + "HH:MM"),
 * returns the next UTC instant this slot occurs, computed relative to `now`.
 */
export function nextOccurrenceUtc(
  weekday: Weekday,
  time: string,
  serverOffsetMinutes: number,
  now = new Date()
): Date {
  const [hours, minutes] = time.split(":").map(Number);

  // Build "now" expressed as server-local wall-clock time.
  const nowServerMs = now.getTime() + serverOffsetMinutes * 60_000;
  const nowServer = new Date(nowServerMs);

  const targetServer = new Date(nowServer);
  targetServer.setUTCHours(hours, minutes, 0, 0);

  const currentDow = nowServer.getUTCDay();
  const targetDow = WEEKDAY_INDEX[weekday];
  let dayDiff = targetDow - currentDow;
  if (dayDiff < 0) dayDiff += 7;

  targetServer.setUTCDate(targetServer.getUTCDate() + dayDiff);

  if (dayDiff === 0 && targetServer.getTime() < nowServer.getTime()) {
    targetServer.setUTCDate(targetServer.getUTCDate() + 7);
  }

  // targetServer currently holds the wall-clock value as if it were UTC;
  // convert back to true UTC by subtracting the server offset.
  return new Date(targetServer.getTime() - serverOffsetMinutes * 60_000);
}

export function formatLocalTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCountdown(target: Date, now = new Date()): string {
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return "jetzt";

  const totalMinutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
