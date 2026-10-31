import { authErrorMessage } from "@tech-tcg/shared";
import { Link } from "expo-router";
import { useState } from "react";
import { useAuth } from "../auth/auth-context.ts";
import { Button, ErrorMessage, Field, Screen, usePalette } from "../ui.tsx";

export function Connexion() {
  const { signIn } = useAuth();
  const palette = usePalette();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit() {
    setError(null);
    setPending(true);
    try {
      await signIn(email.trim(), password);
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen title="Connexion">
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
        textContentType="password"
        autoComplete="current-password"
        value={password}
        onChangeText={setPassword}
      />
      <ErrorMessage message={error} />
      <Button label="Se connecter" disabled={pending} onPress={() => void onSubmit()} />
      <Link href="/mot-de-passe-oublie" style={{ color: palette.accent }}>
        Mot de passe oublié ?
      </Link>
      <Link href="/inscription" style={{ color: palette.accent }}>
        Créer un compte
      </Link>
    </Screen>
  );
}
