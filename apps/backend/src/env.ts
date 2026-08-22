import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  PORT: Number(process.env.PORT ?? 3000),
  HOST: process.env.HOST ?? "127.0.0.1",
  DATABASE_PATH: required("DATABASE_PATH", "./data/timetable.sqlite"),
  JWT_SECRET: required("JWT_SECRET"),
  ACCESS_TOKEN_TTL_DAYS: Number(process.env.ACCESS_TOKEN_TTL_DAYS ?? 90),
  SCHEDULE_URL: process.env.SCHEDULE_URL ?? "https://originaion.com/schedule",
  SCRAPE_CRON: process.env.SCRAPE_CRON ?? "0 * * * *",
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "*",
};
