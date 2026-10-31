import { screen } from "expo-router/testing-library";
import { fakeAuth, renderApp, user } from "./helpers.tsx";

describe("navigation", () => {
  it("envoie un visiteur de / vers /connexion", async () => {
    await renderApp("/");
    expect(screen).toHavePathname("/connexion");
  });

  it("envoie un utilisateur connecté de / vers /accueil", async () => {
    await renderApp("/", { auth: fakeAuth({ user }) });
    expect(screen).toHavePathname("/accueil");
  });

  it("refuse /accueil à un visiteur", async () => {
    await renderApp("/accueil");
    expect(screen).toHavePathname("/connexion");
  });

  it("renvoie un utilisateur connecté de /connexion vers /accueil", async () => {
    await renderApp("/connexion", { auth: fakeAuth({ user }) });
    expect(screen).toHavePathname("/accueil");
  });

  it("n'affiche aucun écran tant que l'état est inconnu", async () => {
    await renderApp("/accueil", { auth: fakeAuth({ loading: true }) });
    expect(screen.queryByText("Se déconnecter")).toBeNull();
    expect(screen.queryByText("Se connecter")).toBeNull();
  });
});
