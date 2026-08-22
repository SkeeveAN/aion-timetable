import type { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { teams, teamMembers } from "../db/schema.js";
import { signAccessToken, generateInviteCode } from "./tokens.js";
import { requireAuth } from "./guard.js";

const createTeamSchema = z.object({
  name: z.string().min(1).max(60),
  description: z.string().max(500).default(""),
  password: z.string().min(4),
  displayName: z.string().min(1).max(60),
});

const joinTeamSchema = z.object({
  inviteCode: z.string().min(1),
  displayName: z.string().min(1).max(60),
});

const updateMemberSchema = z.object({
  displayName: z.string().min(1).max(60),
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/teams", async (request, reply) => {
    const body = createTeamSchema.parse(request.body);

    const existing = db.select().from(teams).where(eq(teams.name, body.name)).get();
    if (existing) {
      return reply.code(409).send({ error: "Team name already taken" });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const inviteCode = generateInviteCode();

    const teamId = Number(
      db
        .insert(teams)
        .values({
          name: body.name,
          description: body.description,
          passwordHash,
          inviteCode,
        })
        .run().lastInsertRowid
    );

    const memberId = Number(
      db
        .insert(teamMembers)
        .values({ teamId, displayName: body.displayName, isOwner: true })
        .run().lastInsertRowid
    );

    const accessToken = await signAccessToken({
      teamId,
      memberId,
      displayName: body.displayName,
      isOwner: true,
    });

    return reply.send({
      accessToken,
      team: { id: teamId, name: body.name, description: body.description, inviteCode },
      member: { id: memberId, displayName: body.displayName, isOwner: true },
    });
  });

  app.post("/teams/join", async (request, reply) => {
    const body = joinTeamSchema.parse(request.body);

    const team = db
      .select()
      .from(teams)
      .where(eq(teams.inviteCode, body.inviteCode.toUpperCase()))
      .get();

    if (!team) {
      return reply.code(404).send({ error: "Invalid invite code" });
    }

    const memberId = Number(
      db
        .insert(teamMembers)
        .values({ teamId: team.id, displayName: body.displayName, isOwner: false })
        .run().lastInsertRowid
    );

    const accessToken = await signAccessToken({
      teamId: team.id,
      memberId,
      displayName: body.displayName,
      isOwner: false,
    });

    return reply.send({
      accessToken,
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        inviteCode: team.inviteCode,
      },
      member: { id: memberId, displayName: body.displayName, isOwner: false },
    });
  });

  app.get("/team-members", async (request, reply) => {
    await requireAuth(request, reply);
    if (reply.sent) return;

    const members = db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, request.user!.teamId))
      .all();

    return reply.send(
      members.map((m) => ({ id: m.id, displayName: m.displayName, isOwner: m.isOwner }))
    );
  });

  app.patch("/team-members/:memberId", async (request, reply) => {
    await requireAuth(request, reply);
    if (reply.sent) return;

    const { memberId } = request.params as { memberId: string };
    const body = updateMemberSchema.parse(request.body);

    const target = db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.id, Number(memberId)))
      .get();

    if (!target || target.teamId !== request.user!.teamId) {
      return reply.code(404).send({ error: "Member not found" });
    }

    if (!request.user!.isOwner) {
      return reply.code(403).send({ error: "Only the team owner can rename members" });
    }

    db.update(teamMembers)
      .set({ displayName: body.displayName })
      .where(eq(teamMembers.id, target.id))
      .run();

    return reply.send({ ok: true });
  });
}
