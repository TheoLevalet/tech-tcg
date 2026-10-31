import { authErrorMessage, pseudoSchema } from "@tech-tcg/shared";
import { Link, Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { useApi } from "../api.tsx";
import { useAuth } from "../auth/auth-context.ts";
import { Button, ErrorMessage, Field, pseudoError, Screen, usePalette } from "../ui.tsx";

export function Inscription() {
  const { user, loading, signUp } = useAuth();
  const api = useApi();
  const router = useRouter();
  const palette = usePalette();
  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pendant l'inscription, l'utilisateur est connecté avant que son pseudo soit enregistré.
  if (loading) return null;
  if (user && !submitting) return <Redirect href="/accueil" />;

  async function onSubmit() {
    const parsedPseudo = pseudoSchema.safeParse(pseudo);
    if (!parsedPseudo.success) return setError(pseudoError);
    if (password.length < 8) return setError("Le mot de passe doit faire au moins 8 caractères.");
    if (password !== confirm) return setError("Les mots de passe ne correspondent pas.");

    setError(null);
    setSubmitting(true);
    try {
      await signUp(email.trim(), password);
    } catch (cause) {
      setSubmitting(false);
      return setError(authErrorMessage(cause));
    }
    // En cas d'échec, l'accueil redemande le pseudo.
    await api.updateMe(parsedPseudo.data).catch(() => undefined);
    router.replace("/accueil");
  }

  return (
    <Screen title="Inscription">
      <Field label="Pseudo" textContentType="nickname" value={pseudo} onChangeText={setPseudo} />
      <Field
        label="Email"
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <Field
        label="Mot de passe"
        secureTextEntry
        textContentType="newPassword"
        autoComplete="new-password"
        value={password}
        onChangeText={setPassword}
      />
      <Field
        label="Confirmation"
        secureTextEntry
        textContentType="newPassword"
        autoComplete="new-password"
        value={confirm}
        onChangeText={setConfirm}
      />
      <ErrorMessage message={error} />
      <Button label="Créer mon compte" disabled={submitting} onPress={() => void onSubmit()} />
      <Link href="/connexion" style={{ color: palette.accent }}>
        Déjà un compte ? Se connecter
      </Link>
    </Screen>
  );
}
