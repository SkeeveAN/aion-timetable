import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  worldBossTypes,
  worldBossLocations,
  killRecords,
  teamMembers,
} from "../db/schema.js";
import { requireAuth } from "../auth/guard.js";
import { broadcast } from "../ws.js";
import type {
  WorldBossesResponse,
  WorldBossLocationState,
} from "@aion-timetable/shared";

const killSchema = z.object({
  killedAt: z.string().datetime().optional(),
});

function computeRespawnWindow(
  killedAt: string,
  minSeconds: number,
  maxSeconds: number
) {
  const base = new Date(killedAt).getTime();
  return {
    respawnEarliest: new Date(base + minSeconds * 1000).toISOString(),
    respawnLatest: new Date(base + maxSeconds * 1000).toISOString(),
  };
}

export async function worldBossRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireAuth);

  app.get("/world-bosses", async (request, reply) => {
    const teamId = request.user!.teamId;
    const bossTypes = db.select().from(worldBossTypes).all();
    const locations = db.select().from(worldBossLocations).all();

    const locationStates: WorldBossLocationState[] = locations.map((loc) => {
      const lastKillRow = db
        .select({
          id: killRecords.id,
          killedAt: killRecords.killedAt,
          createdAt: killRecords.createdAt,
          reportedByMemberId: killRecords.reportedByMemberId,
          reportedByDisplayName: teamMembers.displayName,
        })
        .from(killRecords)
        .innerJoin(teamMembers, eq(killRecords.reportedByMemberId, teamMembers.id))
        .where(
          and(
            eq(killRecords.bossLocationId, loc.id),
            eq(killRecords.teamId, teamId)
          )
        )
        .orderBy(desc(killRecords.killedAt))
        .limit(1)
        .get();

      if (!lastKillRow) {
        return {
          location: {
            id: loc.id,
            bossTypeId: loc.bossTypeId,
            label: loc.label,
            mapX: loc.mapX,
            mapY: loc.mapY,
          },
          lastKill: null,
          respawnEarliest: null,
          respawnLatest: null,
        };
      }

      const bossType = bossTypes.find((b) => b.id === loc.bossTypeId)!;
      const { respawnEarliest, respawnLatest } = computeRespawnWindow(
        lastKillRow.killedAt,
        bossType.respawnMinSeconds,
        bossType.respawnMaxSeconds
      );

      return {
        location: {
          id: loc.id,
          bossTypeId: loc.bossTypeId,
          label: loc.label,
          mapX: loc.mapX,
          mapY: loc.mapY,
        },
        lastKill: {
          id: lastKillRow.id,
          bossLocationId: loc.id,
          killedAt: lastKillRow.killedAt,
          reportedByMemberId: lastKillRow.reportedByMemberId,
          reportedByDisplayName: lastKillRow.reportedByDisplayName,
          createdAt: lastKillRow.createdAt,
        },
        respawnEarliest,
        respawnLatest,
      };
    });

    const response: WorldBossesResponse = {
      bossTypes: bossTypes.map((b) => ({
        id: b.id,
        key: b.key,
        displayName: b.displayName,
        respawnMinSeconds: b.respawnMinSeconds,
        respawnMaxSeconds: b.respawnMaxSeconds,
      })),
      locations: locationStates,
    };

    return reply.send(response);
  });

  app.post("/world-bosses/:locationId/kill", async (request, reply) => {
    const { locationId } = request.params as { locationId: string };
    const body = killSchema.parse(request.body ?? {});
    const killedAt = body.killedAt ?? new Date().toISOString();

    const location = db
      .select()
      .from(worldBossLocations)
      .where(eq(worldBossLocations.id, Number(locationId)))
      .get();

    if (!location) {
      return reply.code(404).send({ error: "Unknown location" });
    }

    const inserted = db
      .insert(killRecords)
      .values({
        teamId: request.user!.teamId,
        bossLocationId: location.id,
        killedAt,
        reportedByMemberId: request.user!.memberId,
      })
      .run();

    const killRecord = {
      id: Number(inserted.lastInsertRowid),
      bossLocationId: location.id,
      killedAt,
      reportedByMemberId: request.user!.memberId,
      reportedByDisplayName: request.user!.displayName,
      createdAt: new Date().toISOString(),
    };

    broadcast(request.user!.teamId, { type: "kill.created", payload: killRecord });

    return reply.send(killRecord);
  });
}
