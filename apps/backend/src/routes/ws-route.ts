import type { FastifyInstance } from "fastify";
import { verifyAccessToken } from "../auth/tokens.js";
import { registerClient } from "../ws.js";

export async function wsRoute(app: FastifyInstance) {
  app.get("/ws", { websocket: true }, async (socket, request) => {
    const token = (request.query as Record<string, string | undefined>)
      ?.token;

    if (!token) {
      socket.close(1008, "Missing token");
      return;
    }

    try {
      const payload = await verifyAccessToken(token);
      registerClient(payload.teamId, socket);
    } catch {
      socket.close(1008, "Invalid token");
    }
  });
}
