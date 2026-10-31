import { type Firestore, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

export interface StoredProfile {
  pseudo: string;
  createdAt: Date;
}

export interface ProfileStore {
  get(uid: string): Promise<StoredProfile | null>;
  upsert(uid: string, pseudo: string): Promise<StoredProfile>;
}

const storedProfileSchema = z.object({
  pseudo: z.string(),
  createdAt: z.instanceof(Timestamp),
});

export function createFirestoreProfileStore(db: Firestore): ProfileStore {
  const users = db.collection("users");

  return {
    async get(uid) {
      const snapshot = await users.doc(uid).get();
      if (!snapshot.exists) return null;
      const { pseudo, createdAt } = storedProfileSchema.parse(snapshot.data());
      return { pseudo, createdAt: createdAt.toDate() };
    },

    upsert(uid, pseudo) {
      return db.runTransaction(async (transaction) => {
        const ref = users.doc(uid);
        const snapshot = await transaction.get(ref);
        const createdAt = snapshot.exists
          ? storedProfileSchema.parse(snapshot.data()).createdAt
          : Timestamp.now();
        transaction.set(ref, { pseudo, createdAt });
        return { pseudo, createdAt: createdAt.toDate() };
      });
    },
  };
}
