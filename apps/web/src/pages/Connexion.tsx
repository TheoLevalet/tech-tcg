import { authErrorMessage } from "@tech-tcg/shared";
import { type FormEvent, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/auth-context.ts";
import { ErrorMessage, Field } from "../ui.tsx";

export function Connexion() {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function run(action: () => Promise<void>) {
    setError(null);
    setPending(true);
    try {
      await action();
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void run(() => signIn(email, password));
  }

  return (
    <main className="card">
      <h1>Connexion</h1>
      <form onSubmit={onSubmit}>
        <Field
          label="Email"
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Field
          label="Mot de passe"
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <ErrorMessage message={error} />
        <button type="submit" disabled={pending}>
          Se connecter
        </button>
      </form>
      <button
        type="button"
        className="secondary"
        disabled={pending}
        onClick={() => void run(signInWithGoogle)}
      >
        Continuer avec Google
      </button>
      <p>
        <Link to="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
      </p>
      <p>
        Pas encore de compte ? <Link to="/inscription">Créer un compte</Link>
      </p>
    </main>
  );
}
