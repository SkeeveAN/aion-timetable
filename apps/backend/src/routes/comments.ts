import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/client.js";
import { comments, teamMembers } from "../db/schema.js";
import { requireAuth } from "../auth/guard.js";
import { broadcast } from "../ws.js";

const listQuerySchema = z.object({
  scheduleEventId: z.coerce.number().int().optional(),
  killRecordId: z.coerce.number().int().optional(),
});

const createSchema = z.object({
  scheduleEventId: z.number().int().optional(),
  killRecordId: z.number().int().optional(),
  body: z.string().min(1).max(2000),
});

export async function commentRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireAuth);

  app.get("/comments", async (request, reply) => {
    const query = listQuerySchema.parse(request.query);
    const teamId = request.user!.teamId;

    let rows = db
      .select({
        id: comments.id,
        scheduleEventId: comments.scheduleEventId,
        killRecordId: comments.killRecordId,
        authorMemberId: comments.authorMemberId,
        authorDisplayName: teamMembers.displayName,
        body: comments.body,
        createdAt: comments.createdAt,
      })
      .from(comments)
      .innerJoin(teamMembers, eq(comments.authorMemberId, teamMembers.id))
      .where(eq(comments.teamId, teamId))
      .orderBy(desc(comments.createdAt))
      .all();

    if (query.scheduleEventId !== undefined) {
      rows = rows.filter((r) => r.scheduleEventId === query.scheduleEventId);
    }
    if (query.killRecordId !== undefined) {
      rows = rows.filter((r) => r.killRecordId === query.killRecordId);
    }

    return reply.send(rows);
  });

  app.post("/comments", async (request, reply) => {
    const body = createSchema.parse(request.body);
    const teamId = request.user!.teamId;

    const inserted = db
      .insert(comments)
      .values({
        teamId,
        scheduleEventId: body.scheduleEventId ?? null,
        killRecordId: body.killRecordId ?? null,
        authorMemberId: request.user!.memberId,
        body: body.body,
      })
      .run();

    const comment = {
      id: Number(inserted.lastInsertRowid),
      scheduleEventId: body.scheduleEventId ?? null,
      killRecordId: body.killRecordId ?? null,
      authorMemberId: request.user!.memberId,
      authorDisplayName: request.user!.displayName,
      body: body.body,
      createdAt: new Date().toISOString(),
    };

    broadcast(teamId, { type: "comment.created", payload: comment });

    return reply.send(comment);
  });
}
