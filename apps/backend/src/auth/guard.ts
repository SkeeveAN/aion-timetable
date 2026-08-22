import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyAccessToken, type AccessTokenPayload } from "./tokens.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: AccessTokenPayload;
  }
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return reply.code(401).send({ error: "Missing bearer token" });
  }

  try {
    request.user = await verifyAccessToken(header.slice("Bearer ".length));
  } catch {
    return reply.code(401).send({ error: "Invalid or expired token" });
  }
}
