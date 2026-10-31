import type { AppDependencies } from "../src/app.ts";
import type { ProfileStore, StoredProfile } from "../src/profiles.ts";

// Jeton accepté : « valide:<uid> » ; tout autre jeton est rejeté.
export async function fakeVerifyIdToken(token: string) {
  const [prefix, uid] = token.split(":");
  if (prefix !== "valide" || !uid) throw new Error("jeton invalide");
  return { uid, email: `${uid}@exemple.fr` };
}

export function createInMemoryProfileStore(now = () => new Date()): ProfileStore {
  const profiles = new Map<string, StoredProfile>();
  return {
    async get(uid) {
      return profiles.get(uid) ?? null;
    },
    async upsert(uid, pseudo) {
      const profile = { pseudo, createdAt: profiles.get(uid)?.createdAt ?? now() };
      profiles.set(uid, profile);
      return profile;
    },
  };
}

export function fakeDependencies(): AppDependencies {
  return { verifyIdToken: fakeVerifyIdToken, profiles: createInMemoryProfileStore() };
}
