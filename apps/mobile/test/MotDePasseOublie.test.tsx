import { fireEvent, screen } from "expo-router/testing-library";
import { fakeAuth, renderApp } from "./helpers.tsx";

const confirmation =
  "Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.";

async function submit(email: string) {
  await fireEvent.changeText(screen.getByLabelText("Email"), email);
  await fireEvent.press(screen.getByRole("button", { name: "Envoyer le lien" }));
}

describe("MotDePasseOublie", () => {
  it("envoie le lien et affiche la confirmation", async () => {
    const auth = fakeAuth();
    await renderApp("/mot-de-passe-oublie", { auth });

    await submit("theo@exemple.fr");

    expect(await screen.findByText(confirmation)).toBeTruthy();
    expect(auth.resetPassword).toHaveBeenCalledWith("theo@exemple.fr");
  });

  it("affiche la même confirmation quand le compte n'existe pas", async () => {
    const auth = fakeAuth({
      resetPassword: jest.fn().mockRejectedValue({ code: "auth/user-not-found" }),
    });
    await renderApp("/mot-de-passe-oublie", { auth });

    await submit("inconnu@exemple.fr");

    expect(await screen.findByText(confirmation)).toBeTruthy();
  });

  it("affiche les autres erreurs", async () => {
    const auth = fakeAuth({
      resetPassword: jest.fn().mockRejectedValue({ code: "auth/invalid-email" }),
    });
    await renderApp("/mot-de-passe-oublie", { auth });

    await submit("pas-un-email");

    expect(await screen.findByText("Adresse email invalide.")).toBeTruthy();
  });
});
