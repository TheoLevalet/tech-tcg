import { onRequest } from "firebase-functions/v2/https";
import { buildApp } from "./app.ts";
import { stripApiPrefix, toRequestHandler } from "./request-handler.ts";

const handler = toRequestHandler(
  buildApp({ logger: true, rewriteUrl: (req) => stripApiPrefix(req.url ?? "/") }),
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
