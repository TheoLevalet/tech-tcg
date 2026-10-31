import { authErrorMessage, pseudoSchema } from "@tech-tcg/shared";
import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { useApi } from "../api.tsx";
import { useAuth } from "../auth/auth-context.ts";
import { ErrorMessage, Field, pseudoError } from "../ui.tsx";

export function Inscription() {
  const { user, loading, signUp } = useAuth();
  const api = useApi();
  const navigate = useNavigate();
  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pendant l'inscription, l'utilisateur est connecté avant que son pseudo soit enregistré.
  if (loading) return null;
  if (user && !submitting) return <Navigate to="/accueil" replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsedPseudo = pseudoSchema.safeParse(pseudo);
    if (!parsedPseudo.success) return setError(pseudoError);
    if (password.length < 8) return setError("Le mot de passe doit faire au moins 8 caractères.");
    if (password !== confirm) return setError("Les mots de passe ne correspondent pas.");

    setError(null);
    setSubmitting(true);
    try {
      await signUp(email, password);
    } catch (cause) {
      setSubmitting(false);
      return setError(authErrorMessage(cause));
    }
    // En cas d'échec, l'accueil redemande le pseudo.
    await api.updateMe(parsedPseudo.data).catch(() => undefined);
    navigate("/accueil", { replace: true });
  }

  return (
    <main className="card">
      <h1>Inscription</h1>
      <form onSubmit={(event) => void onSubmit(event)}>
        <Field
          label="Pseudo"
          id="pseudo"
          autoComplete="nickname"
          value={pseudo}
          onChange={(event) => setPseudo(event.target.value)}
        />
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
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Field
          label="Confirmation"
          id="confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
        <ErrorMessage message={error} />
        <button type="submit" disabled={submitting}>
          Créer mon compte
        </button>
      </form>
      <p>
        Déjà un compte ? <Link to="/connexion">Se connecter</Link>
      </p>
    </main>
  );
}
