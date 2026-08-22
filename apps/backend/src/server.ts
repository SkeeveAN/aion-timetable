import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { env } from "./env.js";
import { authRoutes } from "./auth/routes.js";
import { scheduleRoutes } from "./routes/schedule.js";
import { worldBossRoutes } from "./routes/world-bosses.js";
import { commentRoutes } from "./routes/comments.js";
import { wsRoute } from "./routes/ws-route.js";

export async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: env.CORS_ORIGIN });
  await app.register(websocket);

  await app.register(authRoutes);
  await app.register(scheduleRoutes);
  await app.register(worldBossRoutes);
  await app.register(commentRoutes);
  await app.register(wsRoute);

  return app;
}
