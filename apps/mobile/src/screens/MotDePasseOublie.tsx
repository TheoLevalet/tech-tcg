import { authErrorMessage } from "@tech-tcg/shared";
import { Link } from "expo-router";
import { useState } from "react";
import { useAuth } from "../auth/auth-context.ts";
import { Body, Button, ErrorMessage, Field, Screen, usePalette } from "../ui.tsx";

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
  const palette = usePalette();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (cause) {
      // Même réponse que le compte existe ou non.
      if (isUnknownAccount(cause)) setSent(true);
      else setError(authErrorMessage(cause));
    }
  }

  return (
    <Screen title="Mot de passe oublié">
      {sent ? (
        <Body>Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.</Body>
      ) : (
        <>
          <Field
            label="Email"
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <ErrorMessage message={error} />
          <Button label="Envoyer le lien" onPress={() => void onSubmit()} />
        </>
      )}
      <Link href="/connexion" style={{ color: palette.accent }}>
        Retour à la connexion
      </Link>
    </Screen>
  );
}
