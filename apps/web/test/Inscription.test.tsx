import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Inscription } from "../src/pages/Inscription.tsx";
import { fakeApi, fakeAuth, Route, renderRoutes, user } from "./helpers.tsx";

afterEach(cleanup);

const routes = (
  <>
    <Route path="/inscription" element={<Inscription />} />
    <Route path="/accueil" element={<p>Accueil</p>} />
  </>
);

function fill({
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
  fireEvent.change(screen.getByLabelText("Pseudo"), { target: { value: pseudo } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Mot de passe"), { target: { value: password } });
  fireEvent.change(screen.getByLabelText("Confirmation"), {
    target: { value: confirm ?? password },
  });
  fireEvent.click(screen.getByRole("button", { name: "Créer mon compte" }));
}

describe("Inscription", () => {
  it("crée le compte, enregistre le pseudo puis ouvre l'accueil", async () => {
    const auth = fakeAuth();
    const api = fakeApi({ updateMe: vi.fn().mockResolvedValue({}) });
    renderRoutes(routes, { path: "/inscription", auth, api });

    fill({ pseudo: "  Theo " });

    expect(await screen.findByText("Accueil")).toBeTruthy();
    expect(auth.signUp).toHaveBeenCalledWith("theo@exemple.fr", "motdepasse");
    expect(api.updateMe).toHaveBeenCalledWith("Theo");
  });

  it("ouvre l'accueil même si l'enregistrement du pseudo échoue", async () => {
    const api = fakeApi({ updateMe: vi.fn().mockRejectedValue(new Error("réseau")) });
    renderRoutes(routes, { path: "/inscription", api });

    fill({});

    expect(await screen.findByText("Accueil")).toBeTruthy();
  });

  it("refuse un pseudo invalide sans créer de compte", async () => {
    const auth = fakeAuth();
    renderRoutes(routes, { path: "/inscription", auth });

    fill({ pseudo: "x" });

    expect((await screen.findByRole("alert")).textContent).toContain("Pseudo");
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("refuse un mot de passe de moins de 8 caractères", async () => {
    const auth = fakeAuth();
    renderRoutes(routes, { path: "/inscription", auth });

    fill({ password: "court" });

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Le mot de passe doit faire au moins 8 caractères.",
    );
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("refuse une confirmation différente", async () => {
    const auth = fakeAuth();
    renderRoutes(routes, { path: "/inscription", auth });

    fill({ confirm: "autrechose" });

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Les mots de passe ne correspondent pas.",
    );
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("affiche l'erreur Firebase traduite", async () => {
    const auth = fakeAuth({
      signUp: vi.fn().mockRejectedValue({ code: "auth/email-already-in-use" }),
    });
    renderRoutes(routes, { path: "/inscription", auth });

    fill({});

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Un compte existe déjà avec cet email.",
    );
  });

  it("renvoie un utilisateur déjà connecté vers l'accueil", () => {
    renderRoutes(routes, { path: "/inscription", auth: fakeAuth({ user }) });
    expect(screen.getByText("Accueil")).toBeTruthy();
  });
});
