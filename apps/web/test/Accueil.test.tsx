import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Accueil } from "../src/pages/Accueil.tsx";
import { fakeApi, fakeAuth, Route, renderRoutes, user } from "./helpers.tsx";

afterEach(cleanup);

const profile = {
  uid: "u1",
  email: "theo@exemple.fr",
  pseudo: "Theo",
  createdAt: "2026-10-31T10:00:00.000Z",
};

describe("Accueil", () => {
  it("salue l'utilisateur avec son pseudo et son email", async () => {
    const api = fakeApi({ getMe: vi.fn().mockResolvedValue(profile) });
    renderRoutes(<Route path="/accueil" element={<Accueil />} />, {
      path: "/accueil",
      auth: fakeAuth({ user }),
      api,
    });

    expect(await screen.findByRole("heading", { name: "Bonjour Theo" })).toBeTruthy();
    expect(screen.getByText("theo@exemple.fr")).toBeTruthy();
  });

  it("déconnecte l'utilisateur", async () => {
    const auth = fakeAuth({ user });
    renderRoutes(<Route path="/accueil" element={<Accueil />} />, {
      path: "/accueil",
      auth,
      api: fakeApi({ getMe: vi.fn().mockResolvedValue(profile) }),
    });

    fireEvent.click(await screen.findByRole("button", { name: "Se déconnecter" }));

    await waitFor(() => expect(auth.signOut).toHaveBeenCalled());
  });

  it("demande un pseudo, prérempli depuis le nom Google, quand le profil n'existe pas", async () => {
    const api = fakeApi({
      getMe: vi.fn().mockResolvedValue(null),
      updateMe: vi.fn().mockResolvedValue({ ...profile, pseudo: "TheoLevalet" }),
    });
    renderRoutes(<Route path="/accueil" element={<Accueil />} />, {
      path: "/accueil",
      auth: fakeAuth({ user: { ...user, displayName: "Théo Levalet" } }),
      api,
    });

    const input = await screen.findByLabelText("Pseudo");
    expect((input as HTMLInputElement).value).toBe("TheoLevalet");
    fireEvent.change(input, { target: { value: "TheoLevalet" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(await screen.findByRole("heading", { name: "Bonjour TheoLevalet" })).toBeTruthy();
    expect(api.updateMe).toHaveBeenCalledWith("TheoLevalet");
  });

  it("refuse un pseudo invalide dans le formulaire", async () => {
    const api = fakeApi({ getMe: vi.fn().mockResolvedValue(null) });
    renderRoutes(<Route path="/accueil" element={<Accueil />} />, {
      path: "/accueil",
      auth: fakeAuth({ user }),
      api,
    });

    fireEvent.change(await screen.findByLabelText("Pseudo"), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Pseudo");
    expect(api.updateMe).not.toHaveBeenCalled();
  });

  it("propose de réessayer si le profil ne se charge pas", async () => {
    const getMe = vi.fn().mockRejectedValueOnce(new Error("réseau")).mockResolvedValue(profile);
    renderRoutes(<Route path="/accueil" element={<Accueil />} />, {
      path: "/accueil",
      auth: fakeAuth({ user }),
      api: fakeApi({ getMe }),
    });

    fireEvent.click(await screen.findByRole("button", { name: "Réessayer" }));

    expect(await screen.findByRole("heading", { name: "Bonjour Theo" })).toBeTruthy();
  });
});
