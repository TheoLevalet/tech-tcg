import { describe, expect, it } from "vitest";
import { authErrorMessage } from "../src/index.ts";

describe("authErrorMessage", () => {
  it.each(["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"])(
    "ne révèle pas si le compte existe pour %s",
    (code) => {
      expect(authErrorMessage({ code })).toBe("Email ou mot de passe incorrect.");
    },
  );

  it.each([
    ["auth/email-already-in-use", "Un compte existe déjà avec cet email."],
    ["auth/invalid-email", "Adresse email invalide."],
    ["auth/weak-password", "Mot de passe trop faible : 8 caractères minimum."],
    ["auth/too-many-requests", "Trop de tentatives. Réessayez dans quelques minutes."],
    ["auth/network-request-failed", "Connexion au serveur impossible. Vérifiez votre réseau."],
    ["auth/popup-closed-by-user", "Connexion Google annulée."],
    ["auth/popup-blocked", "La fenêtre de connexion Google a été bloquée par le navigateur."],
  ])("traduit %s", (code, message) => {
    expect(authErrorMessage({ code })).toBe(message);
  });

  it.each([{ code: "auth/inconnu" }, new Error("boum"), "texte", null])(
    "renvoie un message générique pour %o",
    (error) => {
      expect(authErrorMessage(error)).toBe("Une erreur est survenue. Réessayez.");
    },
  );
});
