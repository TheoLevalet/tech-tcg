import { pseudoSchema, type UserProfile } from "@tech-tcg/shared";
import { useCallback, useEffect, useState } from "react";
import { useApi } from "../api.tsx";
import { useAuth } from "../auth/auth-context.ts";
import { Body, Button, ErrorMessage, Field, pseudoError, Screen } from "../ui.tsx";

type State =
  | { status: "chargement" }
  | { status: "erreur" }
  | { status: "sans-profil" }
  | { status: "pret"; profile: UserProfile };

function ProfileForm({ onSaved }: { onSaved: (profile: UserProfile) => void }) {
  const api = useApi();
  const [pseudo, setPseudo] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    const parsed = pseudoSchema.safeParse(pseudo);
    if (!parsed.success) return setError(pseudoError);
    try {
      onSaved(await api.updateMe(parsed.data));
    } catch {
      setError("Impossible d'enregistrer le pseudo. Réessayez.");
    }
  }

  return (
    <>
      <Body>Choisissez un pseudo pour terminer votre inscription.</Body>
      <Field label="Pseudo" textContentType="nickname" value={pseudo} onChangeText={setPseudo} />
      <ErrorMessage message={error} />
      <Button label="Enregistrer" onPress={() => void onSubmit()} />
    </>
  );
}

export function Accueil() {
  const { signOut } = useAuth();
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
    <Screen title={state.status === "pret" ? `Bonjour ${state.profile.pseudo}` : undefined}>
      {state.status === "chargement" && <Body>Chargement…</Body>}
      {state.status === "erreur" && (
        <>
          <ErrorMessage message="Impossible de charger votre profil." />
          <Button label="Réessayer" onPress={retry} />
        </>
      )}
      {state.status === "sans-profil" && (
        <ProfileForm onSaved={(profile) => setState({ status: "pret", profile })} />
      )}
      {state.status === "pret" && <Body>{state.profile.email}</Body>}
      <Button label="Se déconnecter" secondary onPress={() => void signOut()} />
    </Screen>
  );
}
