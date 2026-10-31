import type { ApiClient } from "@tech-tcg/shared";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { vi } from "vitest";
import { ApiContext } from "../src/api.tsx";
import { AuthContext, type AuthContextValue, type AuthUser } from "../src/auth/auth-context.ts";

export const user: AuthUser = { uid: "u1", email: "theo@exemple.fr", displayName: null };

export function fakeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    loading: false,
    signIn: vi.fn().mockResolvedValue(undefined),
    signUp: vi.fn().mockResolvedValue(undefined),
    signInWithGoogle: vi.fn().mockResolvedValue(undefined),
    resetPassword: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    getIdToken: vi.fn().mockResolvedValue("jeton"),
    ...overrides,
  };
}

export function fakeApi(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    health: vi.fn().mockResolvedValue({ status: "ok" }),
    getMe: vi.fn().mockResolvedValue(null),
    updateMe: vi.fn(),
    ...overrides,
  };
}

// Affiche le chemin courant pour vérifier les redirections.
export function LocationProbe() {
  return <p data-testid="location">{useLocation().pathname}</p>;
}

export function renderRoutes(
  routes: ReactNode,
  {
    path = "/",
    auth = fakeAuth(),
    api = fakeApi(),
  }: {
    path?: string | { pathname: string; state: unknown };
    auth?: AuthContextValue;
    api?: ApiClient;
  } = {},
) {
  return render(
    <AuthContext.Provider value={auth}>
      <ApiContext.Provider value={api}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>{routes}</Routes>
          <LocationProbe />
        </MemoryRouter>
      </ApiContext.Provider>
    </AuthContext.Provider>,
  );
}

export { Route };
