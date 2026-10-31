import type { Card } from "@tech-tcg/shared";

export interface DrawResult {
  hand: readonly Card[];
  deck: readonly Card[];
}

export function draw(deck: readonly Card[], hand: readonly Card[], count: number): DrawResult {
  const drawn = deck.slice(0, count);
  return { hand: [...hand, ...drawn], deck: deck.slice(drawn.length) };
}
