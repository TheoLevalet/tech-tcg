import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/App.tsx";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("affiche le statut renvoyé par /api/health", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ status: "ok" })));
    render(<App />);
    expect(await screen.findByText("API : ok")).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/api/health");
  });

  it("affiche une erreur quand l'API ne répond pas", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    render(<App />);
    expect(await screen.findByText("API : injoignable")).toBeTruthy();
  });

  it("affiche une erreur quand la réponse est invalide", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ status: "ko" })));
    render(<App />);
    expect(await screen.findByText("API : injoignable")).toBeTruthy();
  });
});
