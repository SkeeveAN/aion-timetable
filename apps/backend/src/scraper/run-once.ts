import { runScrapeJob } from "./cron.js";

runScrapeJob().then(() => process.exit(0));
