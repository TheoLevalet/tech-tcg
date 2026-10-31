import type { AddressInfo } from "node:net";
import express from "express";
import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.ts";
import { fakeDependencies } from "./fakes.ts";
import { stripApiPrefix, toRequestHandler } from "../src/request-handler.ts";

async function serveLikeCloudFunctions(handler: express.RequestHandler) {
  const server = express().use(express.json()).use(handler).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address() as AddressInfo;
  return { url: `http://127.0.0.1:${port}`, close: () => server.close() };
}

describe("toRequestHandler", () => {
  it("sert GET /health derrière un body déjà parsé", async () => {
    const handler = await toRequestHandler(buildApp(fakeDependencies()));
    const server = await serveLikeCloudFunctions(handler);
    try {
      const response = await fetch(`${server.url}/health`);
      expect(await response.json()).toEqual({ status: "ok" });
    } finally {
      server.close();
    }
  });

  it("transmet un body JSON déjà consommé par Express", async () => {
    const app = buildApp(fakeDependencies());
    app.post("/echo", async (request) => request.body);
    const server = await serveLikeCloudFunctions(await toRequestHandler(app));
    try {
      const response = await fetch(`${server.url}/echo`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ card: "a" }),
      });
      expect(await response.json()).toEqual({ card: "a" });
    } finally {
      server.close();
    }
  });
});

describe("stripApiPrefix", () => {
  it.each([
    ["/api/health", "/health"],
    ["/api", "/"],
    ["/health", "/health"],
    ["/apis", "/apis"],
  ])("%s → %s", (input, expected) => {
    expect(stripApiPrefix(input)).toBe(expected);
  });
});
