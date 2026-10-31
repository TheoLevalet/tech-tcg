import type { FastifyReply, FastifyRequest } from "fastify";

export interface AuthUser {
  uid: string;
  email?: string;
}

export type VerifyIdToken = (token: string) => Promise<AuthUser>;

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export function authenticate(verifyIdToken: VerifyIdToken) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const match = /^Bearer (.+)$/.exec(request.headers.authorization ?? "");
    try {
      if (!match?.[1]) throw new Error("jeton absent");
      const { uid, email } = await verifyIdToken(match[1]);
      request.user = { uid, email };
    } catch {
      return reply.code(401).send({ error: "unauthenticated" });
    }
  };
}

export function requireUser(request: FastifyRequest): AuthUser {
  if (!request.user) throw new Error("authenticate doit précéder la route");
  return request.user;
}
