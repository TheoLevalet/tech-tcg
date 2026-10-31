const invalidCredentials = "Email ou mot de passe incorrect.";

const messages: Record<string, string> = {
  "auth/invalid-credential": invalidCredentials,
  "auth/wrong-password": invalidCredentials,
  "auth/user-not-found": invalidCredentials,
  "auth/email-already-in-use": "Un compte existe déjà avec cet email.",
  "auth/invalid-email": "Adresse email invalide.",
  "auth/weak-password": "Mot de passe trop faible : 8 caractères minimum.",
  "auth/too-many-requests": "Trop de tentatives. Réessayez dans quelques minutes.",
  "auth/network-request-failed": "Connexion au serveur impossible. Vérifiez votre réseau.",
  "auth/popup-closed-by-user": "Connexion Google annulée.",
  "auth/cancelled-popup-request": "Connexion Google annulée.",
  "auth/popup-blocked": "La fenêtre de connexion Google a été bloquée par le navigateur.",
  "auth/account-exists-with-different-credential":
    "Un compte existe déjà avec cet email, avec une autre méthode de connexion.",
};

// Traduit une erreur du SDK Firebase Auth sans dépendre du SDK.
export function authErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  return messages[code] ?? "Une erreur est survenue. Réessayez.";
}
