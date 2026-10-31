import { describe, expect, it } from "vitest";
import { healthResponseSchema } from "../src/index.ts";

describe("healthResponseSchema", () => {
  it("accepte le statut ok", () => {
    expect(healthResponseSchema.parse({ status: "ok" })).toEqual({ status: "ok" });
  });

  it("rejette un statut inconnu", () => {
    expect(healthResponseSchema.safeParse({ status: "ko" }).success).toBe(false);
  });
});
