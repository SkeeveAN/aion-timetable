import { db } from "../db/client.js";
import { scheduleEvents, serverTimeMeta } from "../db/schema.js";
import type { ScrapeResult } from "./schedule-scraper.js";
import { broadcastAll } from "../ws.js";

export function persistScrapeResult(result: ScrapeResult) {
  const scrapedAt = new Date().toISOString();

  db.transaction((tx) => {
    tx.delete(scheduleEvents).run();

    for (const event of result.events) {
      tx.insert(scheduleEvents)
        .values({ ...event, scrapedAt })
        .run();
    }

    tx.insert(serverTimeMeta)
      .values({ ...result.serverTime, scrapedAt })
      .run();
  });

  broadcastAll({ type: "schedule.updated", payload: { scrapedAt } });
}
