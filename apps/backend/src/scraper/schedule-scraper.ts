import { chromium } from "playwright";
import type { ScheduleCategory, Weekday } from "@aion-timetable/shared";
import { env } from "../env.js";

const CATEGORY_LABELS: Record<ScheduleCategory, string> = {
  pvp_instances: "PvP Instances",
  arenas: "Arenas",
  siege: "Siege",
  rifts: "Rifts",
};

// The weekly table's column headers, in DOM order, after the leading "Time" column.
const COLUMN_WEEKDAYS: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export interface ScrapedEvent {
  category: ScheduleCategory;
  name: string;
  imageUrl: string | null;
  weekday: Weekday;
  startTime: string;
  endTime: string;
}

export interface ScrapedServerTime {
  offsetLabel: string;
  offsetMinutes: number;
}

export interface ScrapeResult {
  events: ScrapedEvent[];
  serverTime: ScrapedServerTime;
}

function parseGmtOffset(label: string): number {
  const match = label.match(/GMT\s*([+-]\d+)/i);
  if (!match) {
    throw new Error(`Could not parse server time offset from label: "${label}"`);
  }
  return Number(match[1]) * 60;
}

export async function scrapeSchedule(): Promise<ScrapeResult> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(env.SCHEDULE_URL, { waitUntil: "networkidle" });

    const subtitleText = await page
      .locator('[class*="subtitle"]')
      .first()
      .innerText();
    const offsetMinutes = parseGmtOffset(subtitleText);

    // The weekly table shows the full recurring pattern for the whole week at once,
    // as opposed to "Today" which only shows a slice for the current day.
    await page.getByRole("button", { name: "Weekly", exact: true }).click();
    await page.waitForTimeout(300);

    const events: ScrapedEvent[] = [];

    for (const [category, label] of Object.entries(CATEGORY_LABELS) as [
      ScheduleCategory,
      string
    ][]) {
      await page.getByRole("button", { name: label, exact: true }).click();
      await page.waitForTimeout(300);

      const rows = page.locator('[class*="scheduleTable"] tbody tr');
      const rowCount = await rows.count();

      for (let r = 0; r < rowCount; r++) {
        const row = rows.nth(r);
        const cells = row.locator("td");
        const cellCount = await cells.count();
        if (cellCount === 0) continue;

        const timeRange = (await cells.nth(0).innerText()).trim();
        const [startTime, endTime] = timeRange.split("-").map((s) => s.trim());
        if (!startTime || !endTime) continue;

        // Columns 1..7 map to Monday..Sunday (see COLUMN_WEEKDAYS).
        for (let c = 1; c < cellCount && c <= COLUMN_WEEKDAYS.length; c++) {
          const weekday = COLUMN_WEEKDAYS[c - 1];
          const tags = cells.nth(c).locator('[class*="instanceTag"]');
          const tagCount = await tags.count();

          for (let t = 0; t < tagCount; t++) {
            const name = (await tags.nth(t).innerText()).trim();
            if (!name) continue;

            events.push({
              category,
              name,
              imageUrl: null,
              weekday,
              startTime,
              endTime,
            });
          }
        }
      }
    }

    return {
      events,
      serverTime: { offsetLabel: subtitleText.trim(), offsetMinutes },
    };
  } finally {
    await browser.close();
  }
}
