import { describe, expect, it } from "vitest";
import { pseudoSchema, updateProfileRequestSchema, userProfileSchema } from "../src/index.ts";

describe("pseudoSchema", () => {
  it("accepte lettres, chiffres, tiret et underscore", () => {
    expect(pseudoSchema.parse("Theo_42-x")).toBe("Theo_42-x");
  });

  it("retire les espaces en bord", () => {
    expect(pseudoSchema.parse("  Theo  ")).toBe("Theo");
  });

  it("rejette moins de 3 caractères après nettoyage", () => {
    expect(pseudoSchema.safeParse("  ab ").success).toBe(false);
  });

  it("accepte 20 caractères et rejette 21", () => {
    expect(pseudoSchema.safeParse("a".repeat(20)).success).toBe(true);
    expect(pseudoSchema.safeParse("a".repeat(21)).success).toBe(false);
  });

  it("rejette les espaces internes et les accents", () => {
    expect(pseudoSchema.safeParse("Theo L").success).toBe(false);
    expect(pseudoSchema.safeParse("Théo").success).toBe(false);
  });
});

describe("updateProfileRequestSchema", () => {
  it("rejette un champ inconnu", () => {
    expect(updateProfileRequestSchema.safeParse({ pseudo: "Theo", uid: "x" }).success).toBe(false);
  });
});

describe("userProfileSchema", () => {
  it("accepte un profil sans email", () => {
    const profile = { uid: "u1", pseudo: "Theo", createdAt: "2026-10-31T10:00:00.000Z" };
    expect(userProfileSchema.parse(profile)).toEqual(profile);
  });

  it("rejette une date non ISO", () => {
    const profile = { uid: "u1", pseudo: "Theo", createdAt: "hier" };
    expect(userProfileSchema.safeParse(profile).success).toBe(false);
  });
});
