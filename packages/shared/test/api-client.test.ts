import { describe, expect, it, vi } from "vitest";
import { ApiError, createApiClient } from "../src/index.ts";

const profile = {
  uid: "u1",
  email: "a@b.c",
  pseudo: "Theo",
  createdAt: "2026-10-31T10:00:00.000Z",
};

function clientWith(response: Response, token: string | null = "jeton") {
  const fetch = vi.fn().mockResolvedValue(response);
  const client = createApiClient({ baseUrl: "/api", getIdToken: async () => token, fetch });
  return { client, fetch };
}

describe("createApiClient", () => {
  it("envoie le jeton dans l'en-tête Authorization", async () => {
    const { client, fetch } = clientWith(Response.json(profile));
    await client.getMe();
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/me");
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer jeton");
  });

  it("n'envoie pas d'en-tête Authorization sans jeton", async () => {
    const { client, fetch } = clientWith(Response.json({ status: "ok" }), null);
    await client.health();
    const [, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(new Headers(init.headers).has("Authorization")).toBe(false);
  });

  it("getMe renvoie le profil", async () => {
    const { client } = clientWith(Response.json(profile));
    expect(await client.getMe()).toEqual(profile);
  });

  it("getMe renvoie null quand le profil n'existe pas", async () => {
    const { client } = clientWith(Response.json({ error: "profile_not_found" }, { status: 404 }));
    expect(await client.getMe()).toBeNull();
  });

  it("updateMe envoie le pseudo en PUT", async () => {
    const { client, fetch } = clientWith(Response.json(profile));
    await client.updateMe("Theo");
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/me");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(String(init.body))).toEqual({ pseudo: "Theo" });
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
  });

  it("lève une ApiError avec le code renvoyé par l'API", async () => {
    const { client } = clientWith(Response.json({ error: "unauthenticated" }, { status: 401 }));
    await expect(client.getMe()).rejects.toEqual(new ApiError(401, "unauthenticated"));
  });

  it("lève une ApiError invalid_request sur un 400", async () => {
    const { client } = clientWith(Response.json({ error: "invalid_request" }, { status: 400 }));
    await expect(client.updateMe("x")).rejects.toMatchObject({
      status: 400,
      code: "invalid_request",
    });
  });

  it("lève une ApiError invalid_response si la réponse ne respecte pas le schéma", async () => {
    const { client } = clientWith(Response.json({ uid: "u1" }));
    await expect(client.getMe()).rejects.toMatchObject({ status: 200, code: "invalid_response" });
  });

  it("lève une ApiError unknown si une erreur n'a pas de corps JSON", async () => {
    const { client } = clientWith(new Response("Bad Gateway", { status: 502 }));
    await expect(client.getMe()).rejects.toMatchObject({ status: 502, code: "unknown" });
  });
});
