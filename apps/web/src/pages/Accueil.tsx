import { pseudoSchema, type UserProfile } from "@tech-tcg/shared";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useApi } from "../api.tsx";
import { useAuth } from "../auth/auth-context.ts";
import { ErrorMessage, Field, pseudoError } from "../ui.tsx";

type State =
  | { status: "chargement" }
  | { status: "erreur" }
  | { status: "sans-profil" }
  | { status: "pret"; profile: UserProfile };

function suggestPseudo(displayName: string | null): string {
  return (displayName ?? "")
    .normalize("NFD")
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 20);
}

function ProfileForm({
  initial,
  onSaved,
}: {
  initial: string;
  onSaved: (profile: UserProfile) => void;
}) {
  const api = useApi();
  const [pseudo, setPseudo] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = pseudoSchema.safeParse(pseudo);
    if (!parsed.success) return setError(pseudoError);
    try {
      onSaved(await api.updateMe(parsed.data));
    } catch {
      setError("Impossible d'enregistrer le pseudo. Réessayez.");
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)}>
      <p>Choisissez un pseudo pour terminer votre inscription.</p>
      <Field
        label="Pseudo"
        id="pseudo"
        autoComplete="nickname"
        value={pseudo}
        onChange={(event) => setPseudo(event.target.value)}
      />
      <ErrorMessage message={error} />
      <button type="submit">Enregistrer</button>
    </form>
  );
}

export function Accueil() {
  const { user, signOut } = useAuth();
  const api = useApi();
  const [state, setState] = useState<State>({ status: "chargement" });

  const fetchProfile = useCallback(() => {
    api
      .getMe()
      .then((profile) =>
        setState(profile ? { status: "pret", profile } : { status: "sans-profil" }),
      )
      .catch(() => setState({ status: "erreur" }));
  }, [api]);

  useEffect(fetchProfile, [fetchProfile]);

  function retry() {
    setState({ status: "chargement" });
    fetchProfile();
  }

  return (
    <main className="card">
      {state.status === "chargement" && <p>Chargement…</p>}
      {state.status === "erreur" && (
        <>
          <p role="alert" className="error">
            Impossible de charger votre profil.
          </p>
          <button type="button" onClick={retry}>
            Réessayer
          </button>
        </>
      )}
      {state.status === "sans-profil" && (
        <ProfileForm
          initial={suggestPseudo(user?.displayName ?? null)}
          onSaved={(profile) => setState({ status: "pret", profile })}
        />
      )}
      {state.status === "pret" && (
        <>
          <h1>Bonjour {state.profile.pseudo}</h1>
          <p>{state.profile.email}</p>
        </>
      )}
      <button type="button" className="secondary" onClick={() => void signOut()}>
        Se déconnecter
      </button>
    </main>
  );
}
