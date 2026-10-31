import { fireEvent, screen, waitFor } from "expo-router/testing-library";
import { fakeAuth, renderApp } from "./helpers.tsx";

async function fill(email: string, password: string) {
  await fireEvent.changeText(screen.getByLabelText("Email"), email);
  await fireEvent.changeText(screen.getByLabelText("Mot de passe"), password);
  await fireEvent.press(screen.getByRole("button", { name: "Se connecter" }));
}

describe("Connexion", () => {
  it("connecte avec l'email et le mot de passe saisis", async () => {
    const auth = fakeAuth();
    await renderApp("/connexion", { auth });

    await fill("theo@exemple.fr", "motdepasse");

    await waitFor(() => expect(auth.signIn).toHaveBeenCalledWith("theo@exemple.fr", "motdepasse"));
  });

  it("affiche un message qui ne révèle pas si le compte existe", async () => {
    const auth = fakeAuth({ signIn: jest.fn().mockRejectedValue({ code: "auth/user-not-found" }) });
    await renderApp("/connexion", { auth });

    await fill("inconnu@exemple.fr", "motdepasse");

    expect(await screen.findByText("Email ou mot de passe incorrect.")).toBeTruthy();
  });

  it("mène à l'inscription", async () => {
    await renderApp("/connexion");
    await fireEvent.press(screen.getByText("Créer un compte"));
    expect(screen).toHavePathname("/inscription");
  });

  it("mène au mot de passe oublié", async () => {
    await renderApp("/connexion");
    await fireEvent.press(screen.getByText("Mot de passe oublié ?"));
    expect(screen).toHavePathname("/mot-de-passe-oublie");
  });
});
