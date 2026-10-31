import { z } from "zod";

export const pseudoSchema = z
  .string()
  .trim()
  .min(3)
  .max(20)
  .regex(/^[A-Za-z0-9_-]+$/);

export const updateProfileRequestSchema = z.strictObject({
  pseudo: pseudoSchema,
});

export const userProfileSchema = z.object({
  uid: z.string().min(1),
  email: z.string().optional(),
  pseudo: z.string(),
  createdAt: z.iso.datetime(),
});

export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
