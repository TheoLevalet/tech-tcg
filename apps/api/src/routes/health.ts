import type { HealthResponse } from "@tech-tcg/shared";
import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async (): Promise<HealthResponse> => ({ status: "ok" }));
}
