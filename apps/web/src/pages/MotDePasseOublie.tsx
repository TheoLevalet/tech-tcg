import { authErrorMessage } from "@tech-tcg/shared";
import { type FormEvent, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/auth-context.ts";
import { ErrorMessage, Field } from "../ui.tsx";

function isUnknownAccount(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "auth/user-not-found"
  );
}

export function MotDePasseOublie() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (cause) {
      // Même réponse que le compte existe ou non.
      if (isUnknownAccount(cause)) setSent(true);
      else setError(authErrorMessage(cause));
    }
  }

  return (
    <main className="card">
      <h1>Mot de passe oublié</h1>
      {sent ? (
        <p role="status">
          Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.
        </p>
      ) : (
        <form onSubmit={(event) => void onSubmit(event)}>
          <Field
            label="Email"
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <ErrorMessage message={error} />
          <button type="submit">Envoyer le lien</button>
        </form>
      )}
      <p>
        <Link to="/connexion">Retour à la connexion</Link>
      </p>
    </main>
  );
}
