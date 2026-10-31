import { draw } from "@tech-tcg/engine";
import { type Card, healthResponseSchema } from "@tech-tcg/shared";
import { useEffect, useState } from "react";

const sampleDeck: Card[] = [
  { id: "c-1", name: "Dragon", cost: 3 },
  { id: "c-2", name: "Chevalier", cost: 2 },
  { id: "c-3", name: "Mage", cost: 1 },
];

type ApiStatus = "chargement" | "ok" | "injoignable";

export function App() {
  const [status, setStatus] = useState<ApiStatus>("chargement");
  const { hand } = draw(sampleDeck, [], 2);

  useEffect(() => {
    fetch("/api/health")
      .then((response) => response.json())
      .then((body) => setStatus(healthResponseSchema.parse(body).status))
      .catch(() => setStatus("injoignable"));
  }, []);

  return (
    <main>
      <h1>Tech TCG</h1>
      <p>API : {status}</p>
      <p>Main de départ : {hand.map((card) => card.name).join(", ")}</p>
    </main>
  );
}
