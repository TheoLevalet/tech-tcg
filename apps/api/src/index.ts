import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { buildApp } from "./app.ts";
import { createFirestoreProfileStore } from "./profiles.ts";
import { stripApiPrefix, toRequestHandler } from "./request-handler.ts";

const firebaseApp = initializeApp();

const handler = toRequestHandler(
  buildApp(
    {
      verifyIdToken: (token) => getAuth(firebaseApp).verifyIdToken(token),
      profiles: createFirestoreProfileStore(getFirestore(firebaseApp)),
    },
    { logger: true, rewriteUrl: (req) => stripApiPrefix(req.url ?? "/") },
  ),
);

export const api = onRequest(
  {
    region: "europe-west1",
    minInstances: 0,
    maxInstances: 2,
    serviceAccount: "api-runtime@",
    invoker: "public",
  },
  async (req, res) => {
    (await handler)(req, res);
  },
);
