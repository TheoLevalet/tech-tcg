import type { ApiClient } from "@tech-tcg/shared";
import { Slot } from "expo-router";
import { useMemo, useState } from "react";
import { renderRouter } from "expo-router/testing-library";
import { ApiContext } from "../src/api.tsx";
import { AuthContext, type AuthContextValue, type AuthUser } from "../src/auth/auth-context.ts";
import { AppLayout, AuthLayout, RootRedirect } from "../src/navigation.tsx";
import { Accueil } from "../src/screens/Accueil.tsx";
import { Connexion } from "../src/screens/Connexion.tsx";
import { Inscription } from "../src/screens/Inscription.tsx";
import { MotDePasseOublie } from "../src/screens/MotDePasseOublie.tsx";

export const user: AuthUser = { uid: "u1", email: "theo@exemple.fr", displayName: null };

export const profile = {
  uid: "u1",
  email: "theo@exemple.fr",
  pseudo: "Theo",
  createdAt: "2026-10-31T10:00:00.000Z",
};

export function fakeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    loading: false,
    signIn: jest.fn().mockResolvedValue(undefined),
    signUp: jest.fn().mockResolvedValue(undefined),
    resetPassword: jest.fn().mockResolvedValue(undefined),
    signOut: jest.fn().mockResolvedValue(undefined),
    getIdToken: jest.fn().mockResolvedValue("jeton"),
    ...overrides,
  };
}

export function fakeApi(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    health: jest.fn().mockResolvedValue({ status: "ok" }),
    getMe: jest.fn().mockResolvedValue(null),
    updateMe: jest.fn().mockResolvedValue(profile),
    ...overrides,
  };
}

// Même arborescence que app/, avec des dépendances factices à la place de Firebase.
export function renderApp(
  initialUrl: string,
  { auth = fakeAuth(), api = fakeApi() }: { auth?: AuthContextValue; api?: ApiClient } = {},
) {
  // Comme Firebase : l'utilisateur devient connecté une fois signUp ou signIn résolu.
  function Providers() {
    const [current, setCurrent] = useState(auth.user);
    const value = useMemo<AuthContextValue>(
      () => ({
        ...auth,
        user: current,
        signUp: async (email, password) => {
          await auth.signUp(email, password);
          setCurrent(user);
        },
        signIn: async (email, password) => {
          await auth.signIn(email, password);
          setCurrent(user);
        },
      }),
      [current],
    );
    return (
      <AuthContext.Provider value={value}>
        <ApiContext.Provider value={api}>
          <Slot />
        </ApiContext.Provider>
      </AuthContext.Provider>
    );
  }

  return renderRouter(
    {
      _layout: Providers,
      index: RootRedirect,
      "(auth)/_layout": AuthLayout,
      "(auth)/connexion": Connexion,
      "(auth)/mot-de-passe-oublie": MotDePasseOublie,
      inscription: Inscription,
      "(app)/_layout": AppLayout,
      "(app)/accueil": Accueil,
    },
    { initialUrl },
  );
}
