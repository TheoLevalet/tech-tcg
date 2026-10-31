import { type UserProfile, updateProfileRequestSchema } from "@tech-tcg/shared";
import type { FastifyInstance } from "fastify";
import type { AppDependencies } from "../app.ts";
import { authenticate, type AuthUser, requireUser } from "../auth.ts";
import type { StoredProfile } from "../profiles.ts";

function toUserProfile(user: AuthUser, profile: StoredProfile): UserProfile {
  return {
    uid: user.uid,
    email: user.email,
    pseudo: profile.pseudo,
    createdAt: profile.createdAt.toISOString(),
  };
}

export async function meRoutes(app: FastifyInstance, { verifyIdToken, profiles }: AppDependencies) {
  app.addHook("preHandler", authenticate(verifyIdToken));

  app.get("/me", async (request, reply) => {
    const user = requireUser(request);
    const profile = await profiles.get(user.uid);
    if (!profile) return reply.code(404).send({ error: "profile_not_found" });
    return toUserProfile(user, profile);
  });

  app.put("/me", async (request, reply) => {
    const user = requireUser(request);
    const body = updateProfileRequestSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_request" });
    return toUserProfile(user, await profiles.upsert(user.uid, body.data.pseudo));
  });
}
