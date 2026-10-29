import { describe, expect, it } from "vitest";
import { cardSchema } from "../src/index.ts";

describe("cardSchema", () => {
  it("accepte une carte valide", () => {
    const card = { id: "c-1", name: "Dragon", cost: 3 };
    expect(cardSchema.parse(card)).toEqual(card);
  });

  it("rejette un coût négatif", () => {
    const result = cardSchema.safeParse({ id: "c-1", name: "Dragon", cost: -1 });
    expect(result.success).toBe(false);
  });

  it("rejette un nom vide", () => {
    const result = cardSchema.safeParse({ id: "c-1", name: "", cost: 1 });
    expect(result.success).toBe(false);
  });
});
