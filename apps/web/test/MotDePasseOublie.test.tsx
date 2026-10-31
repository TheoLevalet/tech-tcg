import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MotDePasseOublie } from "../src/pages/MotDePasseOublie.tsx";
import { fakeAuth, Route, renderRoutes } from "./helpers.tsx";

afterEach(cleanup);

const confirmation =
  "Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.";

function submit(email: string) {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer le lien" }));
}

describe("MotDePasseOublie", () => {
  it("envoie le lien et affiche la confirmation", async () => {
    const auth = fakeAuth();
    renderRoutes(<Route path="/m" element={<MotDePasseOublie />} />, { path: "/m", auth });

    submit("theo@exemple.fr");

    expect(await screen.findByText(confirmation)).toBeTruthy();
    expect(auth.resetPassword).toHaveBeenCalledWith("theo@exemple.fr");
  });

  it("affiche la même confirmation quand le compte n'existe pas", async () => {
    const auth = fakeAuth({
      resetPassword: vi.fn().mockRejectedValue({ code: "auth/user-not-found" }),
    });
    renderRoutes(<Route path="/m" element={<MotDePasseOublie />} />, { path: "/m", auth });

    submit("inconnu@exemple.fr");

    expect(await screen.findByText(confirmation)).toBeTruthy();
  });

  it("affiche les autres erreurs", async () => {
    const auth = fakeAuth({
      resetPassword: vi.fn().mockRejectedValue({ code: "auth/invalid-email" }),
    });
    renderRoutes(<Route path="/m" element={<MotDePasseOublie />} />, { path: "/m", auth });

    submit("theo@exemple.fr");

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe("Adresse email invalide."),
    );
  });
});
