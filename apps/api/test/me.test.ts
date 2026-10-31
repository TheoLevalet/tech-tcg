import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.ts";
import { createInMemoryProfileStore, fakeDependencies, fakeVerifyIdToken } from "./fakes.ts";

const auth = { authorization: "Bearer valide:u1" };

describe("GET /me", () => {
  it("répond 401 sans en-tête Authorization", async () => {
    const response = await buildApp(fakeDependencies()).inject({ method: "GET", url: "/me" });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: "unauthenticated" });
  });

  it("répond 401 avec un en-tête qui n'est pas Bearer", async () => {
    const response = await buildApp(fakeDependencies()).inject({
      method: "GET",
      url: "/me",
      headers: { authorization: "Basic dTE6cHc=" },
    });
    expect(response.statusCode).toBe(401);
  });

  it("répond 401 sans détail quand le jeton est refusé", async () => {
    const response = await buildApp(fakeDependencies()).inject({
      method: "GET",
      url: "/me",
      headers: { authorization: "Bearer expire" },
    });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: "unauthenticated" });
  });

  it("répond 404 quand le profil n'existe pas", async () => {
    const response = await buildApp(fakeDependencies()).inject({
      method: "GET",
      url: "/me",
      headers: auth,
    });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: "profile_not_found" });
  });

  it("renvoie le profil avec l'email du jeton", async () => {
    const profiles = createInMemoryProfileStore(() => new Date("2026-10-31T10:00:00.000Z"));
    await profiles.upsert("u1", "Theo");
    const app = buildApp({ verifyIdToken: fakeVerifyIdToken, profiles });

    const response = await app.inject({ method: "GET", url: "/me", headers: auth });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      uid: "u1",
      email: "u1@exemple.fr",
      pseudo: "Theo",
      createdAt: "2026-10-31T10:00:00.000Z",
    });
  });
});

describe("PUT /me", () => {
  it("crée le profil puis le renvoie", async () => {
    const app = buildApp(fakeDependencies());

    const put = await app.inject({
      method: "PUT",
      url: "/me",
      headers: auth,
      payload: { pseudo: "Theo" },
    });
    const get = await app.inject({ method: "GET", url: "/me", headers: auth });

    expect(put.statusCode).toBe(200);
    expect(put.json()).toMatchObject({ uid: "u1", pseudo: "Theo" });
    expect(get.json()).toEqual(put.json());
  });

  it("met à jour le pseudo sans changer createdAt", async () => {
    let clock = new Date("2026-10-31T10:00:00.000Z");
    const profiles = createInMemoryProfileStore(() => clock);
    const app = buildApp({ verifyIdToken: fakeVerifyIdToken, profiles });
    await app.inject({ method: "PUT", url: "/me", headers: auth, payload: { pseudo: "Theo" } });
    clock = new Date("2026-11-01T10:00:00.000Z");

    const response = await app.inject({
      method: "PUT",
      url: "/me",
      headers: auth,
      payload: { pseudo: "Theo2" },
    });

    expect(response.json()).toMatchObject({
      pseudo: "Theo2",
      createdAt: "2026-10-31T10:00:00.000Z",
    });
  });

  it("enregistre le pseudo nettoyé de ses espaces", async () => {
    const response = await buildApp(fakeDependencies()).inject({
      method: "PUT",
      url: "/me",
      headers: auth,
      payload: { pseudo: "  Theo  " },
    });
    expect(response.json()).toMatchObject({ pseudo: "Theo" });
  });

  it("répond 400 sur un pseudo invalide", async () => {
    const response = await buildApp(fakeDependencies()).inject({
      method: "PUT",
      url: "/me",
      headers: auth,
      payload: { pseudo: "x" },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: "invalid_request" });
  });

  it("répond 400 sur un champ inconnu", async () => {
    const response = await buildApp(fakeDependencies()).inject({
      method: "PUT",
      url: "/me",
      headers: auth,
      payload: { pseudo: "Theo", uid: "u2" },
    });
    expect(response.statusCode).toBe(400);
  });

  it("répond 400 sans corps", async () => {
    const response = await buildApp(fakeDependencies()).inject({
      method: "PUT",
      url: "/me",
      headers: auth,
    });
    expect(response.statusCode).toBe(400);
  });

  it("répond 401 sans jeton, avant toute validation", async () => {
    const response = await buildApp(fakeDependencies()).inject({
      method: "PUT",
      url: "/me",
      payload: { pseudo: "x" },
    });
    expect(response.statusCode).toBe(401);
  });
});
