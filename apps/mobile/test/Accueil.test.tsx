import { fireEvent, screen, waitFor } from "expo-router/testing-library";
import { fakeApi, fakeAuth, profile, renderApp, user } from "./helpers.tsx";

describe("Accueil", () => {
  it("salue l'utilisateur avec son pseudo et son email", async () => {
    await renderApp("/accueil", {
      auth: fakeAuth({ user }),
      api: fakeApi({ getMe: jest.fn().mockResolvedValue(profile) }),
    });

    expect(await screen.findByText("Bonjour Theo")).toBeTruthy();
    expect(screen.getByText("theo@exemple.fr")).toBeTruthy();
  });

  it("déconnecte l'utilisateur", async () => {
    const auth = fakeAuth({ user });
    await renderApp("/accueil", {
      auth,
      api: fakeApi({ getMe: jest.fn().mockResolvedValue(profile) }),
    });

    await fireEvent.press(await screen.findByRole("button", { name: "Se déconnecter" }));

    await waitFor(() => expect(auth.signOut).toHaveBeenCalled());
  });

  it("demande un pseudo quand le profil n'existe pas", async () => {
    const api = fakeApi({ getMe: jest.fn().mockResolvedValue(null) });
    await renderApp("/accueil", { auth: fakeAuth({ user }), api });

    await fireEvent.changeText(await screen.findByLabelText("Pseudo"), "Theo");
    await fireEvent.press(screen.getByRole("button", { name: "Enregistrer" }));

    expect(await screen.findByText("Bonjour Theo")).toBeTruthy();
    expect(api.updateMe).toHaveBeenCalledWith("Theo");
  });

  it("propose de réessayer si le profil ne se charge pas", async () => {
    const getMe = jest.fn().mockRejectedValueOnce(new Error("réseau")).mockResolvedValue(profile);
    await renderApp("/accueil", { auth: fakeAuth({ user }), api: fakeApi({ getMe }) });

    await fireEvent.press(await screen.findByRole("button", { name: "Réessayer" }));

    expect(await screen.findByText("Bonjour Theo")).toBeTruthy();
  });
});
