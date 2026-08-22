import cron from "node-cron";
import { env } from "../env.js";
import { scrapeSchedule } from "./schedule-scraper.js";
import { persistScrapeResult } from "./persist.js";

let isRunning = false;

export async function runScrapeJob() {
  if (isRunning) {
    console.warn("[scraper] Skipping run, previous scrape still in progress");
    return;
  }
  isRunning = true;
  try {
    console.log("[scraper] Starting schedule scrape...");
    const result = await scrapeSchedule();
    persistScrapeResult(result);
    console.log(
      `[scraper] Done. ${result.events.length} events, server offset ${result.serverTime.offsetLabel}`
    );
  } catch (err) {
    console.error("[scraper] Scrape failed:", err);
  } finally {
    isRunning = false;
  }
}

export function startScrapeCron() {
  cron.schedule(env.SCRAPE_CRON, () => {
    void runScrapeJob();
  });
  console.log(`[scraper] Cron scheduled: ${env.SCRAPE_CRON}`);
}
