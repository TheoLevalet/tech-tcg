import type { IncomingMessage, ServerResponse } from "node:http";
import type { FastifyInstance } from "fastify";

type PreParsedRequest = IncomingMessage & { body?: unknown };

export type RequestHandler = (req: IncomingMessage, res: ServerResponse) => void;

// Cloud Functions consomme le flux de la requête et expose le résultat dans `req.body`.
export async function toRequestHandler(app: FastifyInstance): Promise<RequestHandler> {
  app.removeAllContentTypeParsers();
  app.addContentTypeParser("*", (request, _payload, done) => {
    done(null, (request.raw as PreParsedRequest).body);
  });
  await app.ready();
  return (req, res) => app.routing(req, res);
}

export function stripApiPrefix(url: string): string {
  return url.replace(/^\/api(?=\/|\?|$)/, "") || "/";
}
