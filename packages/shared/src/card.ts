import { z } from "zod";

export const cardSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  cost: z.number().int().nonnegative(),
});

export type Card = z.infer<typeof cardSchema>;
