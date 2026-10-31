import { healthResponseSchema } from "@tech-tcg/shared";
import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.ts";
import { fakeDependencies } from "./fakes.ts";

describe("GET /health", () => {
  it("répond 200 avec le statut ok", async () => {
    const app = buildApp(fakeDependencies());
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(healthResponseSchema.parse(response.json())).toEqual({ status: "ok" });
  });

  it("répond 404 sur une route inconnue", async () => {
    const app = buildApp(fakeDependencies());
    const response = await app.inject({ method: "GET", url: "/inconnue" });
    expect(response.statusCode).toBe(404);
  });
});
