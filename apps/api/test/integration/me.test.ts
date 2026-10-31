import { deleteApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.ts";
import { createFirestoreProfileStore } from "../../src/profiles.ts";

const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
if (!authHost || !process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error("Lancer via `firebase emulators:exec --only auth,firestore`");
}

const firebaseApp = initializeApp({ projectId: "demo-tech-tcg" }, "integration");
const db = getFirestore(firebaseApp);
const app = buildApp({
  verifyIdToken: (token) => getAuth(firebaseApp).verifyIdToken(token),
  profiles: createFirestoreProfileStore(db),
});

afterAll(async () => {
  await app.close();
  await deleteApp(firebaseApp);
});

async function signUp(email: string) {
  const response = await fetch(
    `http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "motdepasse", returnSecureToken: true }),
    },
  );
  return (await response.json()) as { idToken: string; localId: string };
}

describe("/me sur les emulators", () => {
  it("crée le profil dans Firestore et le relit avec un vrai jeton", async () => {
    const { idToken, localId } = await signUp(`joueur-${Date.now()}@exemple.fr`);
    const headers = { authorization: `Bearer ${idToken}` };

    const before = await app.inject({ method: "GET", url: "/me", headers });
    const put = await app.inject({
      method: "PUT",
      url: "/me",
      headers,
      payload: { pseudo: "Theo" },
    });
    const get = await app.inject({ method: "GET", url: "/me", headers });
    const document = await db.collection("users").doc(localId).get();

    expect(before.statusCode).toBe(404);
    expect(put.statusCode).toBe(200);
    expect(get.json()).toMatchObject({ uid: localId, pseudo: "Theo" });
    expect(document.data()).toMatchObject({ pseudo: "Theo" });
  });

  it("refuse un jeton signé par personne", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/me",
      headers: { authorization: "Bearer faux.jeton.signe" },
    });
    expect(response.statusCode).toBe(401);
  });
});
