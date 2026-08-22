import type { FastifyInstance } from "fastify";
import { db } from "../db/client.js";
import { scheduleEvents, serverTimeMeta, instanceLevelRequirements } from "../db/schema.js";
import { desc } from "drizzle-orm";
import type { ScheduleResponse } from "@aion-timetable/shared";

/** Public endpoint - powers the Standalone mode with no login required. */
export async function scheduleRoutes(app: FastifyInstance) {
  app.get("/schedule", async (_request, reply) => {
    const events = db.select().from(scheduleEvents).all();
    const meta = db
      .select()
      .from(serverTimeMeta)
      .orderBy(desc(serverTimeMeta.id))
      .limit(1)
      .get();
    const levelReqs = db.select().from(instanceLevelRequirements).all();
    const levelByName = new Map(levelReqs.map((l) => [l.name, l]));

    const response: ScheduleResponse = {
      events: events.map((e) => {
        const level = levelByName.get(e.name);
        return {
          id: e.id,
          category: e.category,
          name: e.name,
          imageUrl: e.imageUrl,
          weekday: e.weekday,
          startTime: e.startTime,
          endTime: e.endTime,
          scrapedAt: e.scrapedAt,
          minLevel: level?.minLevel ?? null,
          maxLevel: level?.maxLevel ?? null,
        };
      }),
      serverTime: meta
        ? {
            offsetLabel: meta.offsetLabel,
            offsetMinutes: meta.offsetMinutes,
            scrapedAt: meta.scrapedAt,
          }
        : { offsetLabel: "GMT +2", offsetMinutes: 120, scrapedAt: "" },
    };

    return reply.send(response);
  });
}
