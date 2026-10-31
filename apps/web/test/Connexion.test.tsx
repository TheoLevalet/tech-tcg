import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Connexion } from "../src/pages/Connexion.tsx";
import { fakeAuth, Route, renderRoutes } from "./helpers.tsx";

afterEach(cleanup);

function fill(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Mot de passe"), { target: { value: password } });
}

describe("Connexion", () => {
  it("connecte avec l'email et le mot de passe saisis", async () => {
    const auth = fakeAuth();
    renderRoutes(<Route path="/connexion" element={<Connexion />} />, { path: "/connexion", auth });

    fill("theo@exemple.fr", "motdepasse");
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() => expect(auth.signIn).toHaveBeenCalledWith("theo@exemple.fr", "motdepasse"));
  });

  it("affiche un message qui ne révèle pas si le compte existe", async () => {
    const auth = fakeAuth({
      signIn: vi.fn().mockRejectedValue({ code: "auth/user-not-found" }),
    });
    renderRoutes(<Route path="/connexion" element={<Connexion />} />, { path: "/connexion", auth });

    fill("inconnu@exemple.fr", "motdepasse");
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Email ou mot de passe incorrect.",
    );
  });

  it("lance la connexion Google", async () => {
    const auth = fakeAuth();
    renderRoutes(<Route path="/connexion" element={<Connexion />} />, { path: "/connexion", auth });

    fireEvent.click(screen.getByRole("button", { name: "Continuer avec Google" }));

    await waitFor(() => expect(auth.signInWithGoogle).toHaveBeenCalled());
  });

  it("propose l'inscription et la réinitialisation du mot de passe", () => {
    renderRoutes(<Route path="/connexion" element={<Connexion />} />, { path: "/connexion" });
    expect(screen.getByRole("link", { name: "Créer un compte" }).getAttribute("href")).toBe(
      "/inscription",
    );
    expect(screen.getByRole("link", { name: "Mot de passe oublié ?" }).getAttribute("href")).toBe(
      "/mot-de-passe-oublie",
    );
  });
});
