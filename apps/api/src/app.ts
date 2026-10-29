import Fastify, { type FastifyInstance } from "fastify";
import { healthRoutes } from "./routes/health.ts";

export function buildApp(): FastifyInstance {
  const app = Fastify();
  app.register(healthRoutes);
  return app;
}
