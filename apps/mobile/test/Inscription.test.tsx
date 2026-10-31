import { fireEvent, screen, waitFor } from "expo-router/testing-library";
import { fakeApi, fakeAuth, renderApp, user } from "./helpers.tsx";

async function fill({
  pseudo = "Theo",
  email = "theo@exemple.fr",
  password = "motdepasse",
  confirm,
}: {
  pseudo?: string;
  email?: string;
  password?: string;
  confirm?: string;
}) {
  await fireEvent.changeText(screen.getByLabelText("Pseudo"), pseudo);
  await fireEvent.changeText(screen.getByLabelText("Email"), email);
  await fireEvent.changeText(screen.getByLabelText("Mot de passe"), password);
  await fireEvent.changeText(screen.getByLabelText("Confirmation"), confirm ?? password);
  await fireEvent.press(screen.getByRole("button", { name: "Créer mon compte" }));
}

describe("Inscription", () => {
  it("crée le compte, enregistre le pseudo puis ouvre l'accueil", async () => {
    const auth = fakeAuth();
    const api = fakeApi();
    await renderApp("/inscription", { auth, api });

    await fill({ pseudo: " Theo " });

    await waitFor(() => expect(screen).toHavePathname("/accueil"));
    expect(auth.signUp).toHaveBeenCalledWith("theo@exemple.fr", "motdepasse");
    expect(api.updateMe).toHaveBeenCalledWith("Theo");
  });

  it("refuse un pseudo invalide sans créer de compte", async () => {
    const auth = fakeAuth();
    await renderApp("/inscription", { auth });

    await fill({ pseudo: "x" });

    expect(
      await screen.findByText("Pseudo invalide : 3 à 20 caractères, lettres, chiffres, _ ou -."),
    ).toBeTruthy();
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("refuse un mot de passe de moins de 8 caractères", async () => {
    await renderApp("/inscription");
    await fill({ password: "court" });
    expect(
      await screen.findByText("Le mot de passe doit faire au moins 8 caractères."),
    ).toBeTruthy();
  });

  it("refuse une confirmation différente", async () => {
    await renderApp("/inscription");
    await fill({ confirm: "autrechose" });
    expect(await screen.findByText("Les mots de passe ne correspondent pas.")).toBeTruthy();
  });

  it("affiche l'erreur Firebase traduite", async () => {
    const auth = fakeAuth({
      signUp: jest.fn().mockRejectedValue({ code: "auth/email-already-in-use" }),
    });
    await renderApp("/inscription", { auth });

    await fill({});

    expect(await screen.findByText("Un compte existe déjà avec cet email.")).toBeTruthy();
  });

  it("renvoie un utilisateur déjà connecté vers l'accueil", async () => {
    await renderApp("/inscription", { auth: fakeAuth({ user }) });
    expect(screen).toHavePathname("/accueil");
  });
});
