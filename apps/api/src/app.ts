import Fastify, { type FastifyInstance, type FastifyServerOptions } from "fastify";
import type { VerifyIdToken } from "./auth.ts";
import type { ProfileStore } from "./profiles.ts";
import { healthRoutes } from "./routes/health.ts";
import { meRoutes } from "./routes/me.ts";

export interface AppDependencies {
  verifyIdToken: VerifyIdToken;
  profiles: ProfileStore;
}

export function buildApp(
  deps: AppDependencies,
  options: FastifyServerOptions = {},
): FastifyInstance {
  const app = Fastify(options);
  app.register(healthRoutes);
  app.register(meRoutes, deps);
  return app;
}
