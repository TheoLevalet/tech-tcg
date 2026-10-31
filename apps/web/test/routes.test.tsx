import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { ApiContext } from "../src/api.tsx";
import { AuthContext } from "../src/auth/auth-context.ts";
import { routes } from "../src/routes.tsx";
import { fakeApi, fakeAuth, user } from "./helpers.tsx";

afterEach(cleanup);

function renderAt(path: string, auth = fakeAuth()) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AuthContext.Provider value={auth}>
      <ApiContext.Provider value={fakeApi()}>
        <RouterProvider router={router} />
      </ApiContext.Provider>
    </AuthContext.Provider>,
  );
  return router;
}

describe("routes", () => {
  it("envoie un visiteur de / vers /connexion", () => {
    expect(renderAt("/").state.location.pathname).toBe("/connexion");
  });

  it("envoie un utilisateur connecté de / vers /accueil", () => {
    expect(renderAt("/", fakeAuth({ user })).state.location.pathname).toBe("/accueil");
  });

  it("ramène une adresse inconnue vers /", () => {
    expect(renderAt("/nulle-part").state.location.pathname).toBe("/connexion");
  });

  it("affiche le formulaire de connexion", () => {
    renderAt("/connexion");
    expect(screen.getByRole("heading", { name: "Connexion" })).toBeTruthy();
  });
});
