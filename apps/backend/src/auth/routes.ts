import type { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq, and } from "drizzle-orm";
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
  password: z.string().min(4),
});

const ownerLoginSchema = z.object({
  inviteCode: z.string().min(1),
  password: z.string().min(1),
});

const updateMemberSchema = z.object({
  displayName: z.string().min(1).max(60),
});

const setAdminSchema = z.object({
  isAdmin: z.boolean(),
});

function toMemberInfo(m: typeof teamMembers.$inferSelect) {
  return { id: m.id, displayName: m.displayName, isOwner: m.isOwner, isAdmin: m.isAdmin };
}

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
      isAdmin: false,
    });

    return reply.send({
      accessToken,
      team: { id: teamId, name: body.name, description: body.description, inviteCode },
      member: { id: memberId, displayName: body.displayName, isOwner: true, isAdmin: false },
    });
  });

  // The team password (set at creation) re-enters as the ORIGINAL owner
  // member - not a new member row - so ownership survives a lost session
  // (reinstall, new PC, ...).
  app.post("/teams/login", async (request, reply) => {
    const body = ownerLoginSchema.parse(request.body);

    const team = db
      .select()
      .from(teams)
      .where(eq(teams.inviteCode, body.inviteCode.toUpperCase()))
      .get();
    if (!team) {
      return reply.code(404).send({ error: "Invalid invite code" });
    }

    const valid = await bcrypt.compare(body.password, team.passwordHash);
    if (!valid) {
      return reply.code(401).send({ error: "Wrong team password" });
    }

    const owner = db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.isOwner, true)))
      .get();
    if (!owner) {
      return reply.code(500).send({ error: "Team has no owner on record" });
    }

    const accessToken = await signAccessToken({
      teamId: team.id,
      memberId: owner.id,
      displayName: owner.displayName,
      isOwner: true,
      isAdmin: owner.isAdmin,
    });

    return reply.send({
      accessToken,
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        inviteCode: team.inviteCode,
      },
      member: toMemberInfo(owner),
    });
  });

  // Joining with a display name that already exists in the team
  // re-authenticates as that member instead of creating a duplicate - the
  // password proves it's really them, not just someone who typed the right
  // name. A member with no password set yet (pre-dates this feature, or was
  // reset by an owner/admin) can be claimed by the next join under that
  // name, which then sets the password for good.
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

    const existingMember = db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.displayName, body.displayName)))
      .get();

    let member: typeof teamMembers.$inferSelect;

    if (existingMember) {
      if (existingMember.passwordHash) {
        const valid = await bcrypt.compare(body.password, existingMember.passwordHash);
        if (!valid) {
          return reply.code(409).send({ error: "That name is taken and the password doesn't match" });
        }
        member = existingMember;
      } else {
        const passwordHash = await bcrypt.hash(body.password, 12);
        db.update(teamMembers)
          .set({ passwordHash })
          .where(eq(teamMembers.id, existingMember.id))
          .run();
        member = { ...existingMember, passwordHash };
      }
    } else {
      const passwordHash = await bcrypt.hash(body.password, 12);
      const memberId = Number(
        db
          .insert(teamMembers)
          .values({ teamId: team.id, displayName: body.displayName, passwordHash })
          .run().lastInsertRowid
      );
      member = {
        id: memberId,
        teamId: team.id,
        displayName: body.displayName,
        isOwner: false,
        isAdmin: false,
        passwordHash,
        createdAt: new Date().toISOString(),
      };
    }

    const accessToken = await signAccessToken({
      teamId: team.id,
      memberId: member.id,
      displayName: member.displayName,
      isOwner: member.isOwner,
      isAdmin: member.isAdmin,
    });

    return reply.send({
      accessToken,
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        inviteCode: team.inviteCode,
      },
      member: toMemberInfo(member),
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

    return reply.send(members.map(toMemberInfo));
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

    if (!request.user!.isOwner && !request.user!.isAdmin) {
      return reply.code(403).send({ error: "Only the team owner or an admin can rename members" });
    }

    db.update(teamMembers)
      .set({ displayName: body.displayName })
      .where(eq(teamMembers.id, target.id))
      .run();

    return reply.send({ ok: true });
  });

  // Owner/admins can promote other members to admin (or demote them) -
  // admins get the same team-management rights as the owner, except the
  // single founding owner flag itself is never changed here.
  app.patch("/team-members/:memberId/admin", async (request, reply) => {
    await requireAuth(request, reply);
    if (reply.sent) return;

    const { memberId } = request.params as { memberId: string };
    const body = setAdminSchema.parse(request.body);

    const target = db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.id, Number(memberId)))
      .get();

    if (!target || target.teamId !== request.user!.teamId) {
      return reply.code(404).send({ error: "Member not found" });
    }

    if (!request.user!.isOwner && !request.user!.isAdmin) {
      return reply.code(403).send({ error: "Only the team owner or an admin can manage admins" });
    }

    db.update(teamMembers)
      .set({ isAdmin: body.isAdmin })
      .where(eq(teamMembers.id, target.id))
      .run();

    return reply.send({ ok: true });
  });

  // Clears a member's password so the next join under their name can claim
  // it again - for when someone lost access (reinstall, forgot password)
  // and an owner/admin has verified it's really them out-of-band.
  app.post("/team-members/:memberId/reset-password", async (request, reply) => {
    await requireAuth(request, reply);
    if (reply.sent) return;

    const { memberId } = request.params as { memberId: string };

    const target = db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.id, Number(memberId)))
      .get();

    if (!target || target.teamId !== request.user!.teamId) {
      return reply.code(404).send({ error: "Member not found" });
    }

    if (!request.user!.isOwner && !request.user!.isAdmin) {
      return reply.code(403).send({ error: "Only the team owner or an admin can reset access" });
    }

    db.update(teamMembers)
      .set({ passwordHash: null })
      .where(eq(teamMembers.id, target.id))
      .run();

    return reply.send({ ok: true });
  });
}
