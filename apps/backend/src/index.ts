import { buildServer } from "./server.js";
import { env } from "./env.js";
import { startScrapeCron, runScrapeJob } from "./scraper/cron.js";

async function main() {
  const app = await buildServer();
  await app.listen({ port: env.PORT, host: env.HOST });

  startScrapeCron();
  // Prime the schedule on boot so the first request isn't served empty data.
  void runScrapeJob();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
