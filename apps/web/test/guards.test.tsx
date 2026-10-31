import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RedirectIfAuthenticated, RequireAuth } from "../src/auth/guards.tsx";
import { fakeAuth, Route, renderRoutes, user } from "./helpers.tsx";

afterEach(cleanup);

const routes = (
  <>
    <Route element={<RequireAuth />}>
      <Route path="/accueil" element={<p>Privé</p>} />
    </Route>
    <Route element={<RedirectIfAuthenticated />}>
      <Route path="/connexion" element={<p>Connexion</p>} />
    </Route>
  </>
);

describe("RequireAuth", () => {
  it("redirige un visiteur vers /connexion", () => {
    renderRoutes(routes, { path: "/accueil" });
    expect(screen.getByTestId("location").textContent).toBe("/connexion");
  });

  it("affiche la page à un utilisateur connecté", () => {
    renderRoutes(routes, { path: "/accueil", auth: fakeAuth({ user }) });
    expect(screen.getByText("Privé")).toBeTruthy();
  });

  it("n'affiche rien et ne redirige pas tant que l'état est inconnu", () => {
    renderRoutes(routes, { path: "/accueil", auth: fakeAuth({ loading: true }) });
    expect(screen.queryByText("Privé")).toBeNull();
    expect(screen.getByTestId("location").textContent).toBe("/accueil");
  });
});

describe("RedirectIfAuthenticated", () => {
  it("affiche la page à un visiteur", () => {
    renderRoutes(routes, { path: "/connexion" });
    expect(screen.getByText("Connexion")).toBeTruthy();
  });

  it("renvoie un utilisateur connecté vers /accueil", () => {
    renderRoutes(routes, { path: "/connexion", auth: fakeAuth({ user }) });
    expect(screen.getByTestId("location").textContent).toBe("/accueil");
  });
});

describe("retour après connexion", () => {
  it("transmet la page demandée à /connexion", () => {
    renderRoutes(
      <>
        {routes}
        <Route path="/collection" element={<p>Collection</p>} />
      </>,
      { path: "/accueil" },
    );
    expect(screen.getByTestId("location").textContent).toBe("/connexion");
  });

  it("renvoie l'utilisateur connecté vers la page demandée", () => {
    renderRoutes(
      <>
        {routes}
        <Route path="/collection" element={<p>Collection</p>} />
      </>,
      {
        path: { pathname: "/connexion", state: { from: "/collection" } },
        auth: fakeAuth({ user }),
      },
    );
    expect(screen.getByText("Collection")).toBeTruthy();
  });
});
