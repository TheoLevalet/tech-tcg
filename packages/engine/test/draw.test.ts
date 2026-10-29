import type { Card } from "@tech-tcg/shared";
import { describe, expect, it } from "vitest";
import { draw } from "../src/index.ts";

const deck: Card[] = [
  { id: "a", name: "A", cost: 1 },
  { id: "b", name: "B", cost: 2 },
  { id: "c", name: "C", cost: 3 },
];

describe("draw", () => {
  it("déplace les premières cartes du deck vers la main", () => {
    const result = draw(deck, [], 2);
    expect(result.hand.map((c) => c.id)).toEqual(["a", "b"]);
    expect(result.deck.map((c) => c.id)).toEqual(["c"]);
  });

  it("ajoute les cartes piochées après la main existante", () => {
    const hand: Card[] = [{ id: "h", name: "H", cost: 0 }];
    expect(draw(deck, hand, 1).hand.map((c) => c.id)).toEqual(["h", "a"]);
  });

  it("pioche tout le deck quand count dépasse sa taille", () => {
    const result = draw(deck, [], 10);
    expect(result.hand).toHaveLength(3);
    expect(result.deck).toEqual([]);
  });

  it("ne change rien quand count vaut 0", () => {
    expect(draw(deck, [], 0)).toEqual({ hand: [], deck });
  });

  it("ne mute pas les entrées", () => {
    const hand: Card[] = [];
    draw(deck, hand, 2);
    expect(deck).toHaveLength(3);
    expect(hand).toHaveLength(0);
  });
});
