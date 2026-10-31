import { Navigate, type RouteObject } from "react-router";
import { useAuth } from "./auth/auth-context.ts";
import { RedirectIfAuthenticated, RequireAuth } from "./auth/guards.tsx";
import { Accueil } from "./pages/Accueil.tsx";
import { Connexion } from "./pages/Connexion.tsx";
import { Inscription } from "./pages/Inscription.tsx";
import { MotDePasseOublie } from "./pages/MotDePasseOublie.tsx";

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? "/accueil" : "/connexion"} replace />;
}

export const routes: RouteObject[] = [
  { path: "/", element: <RootRedirect /> },
  {
    element: <RedirectIfAuthenticated />,
    children: [
      { path: "/connexion", element: <Connexion /> },
      { path: "/mot-de-passe-oublie", element: <MotDePasseOublie /> },
    ],
  },
  { path: "/inscription", element: <Inscription /> },
  { element: <RequireAuth />, children: [{ path: "/accueil", element: <Accueil /> }] },
  { path: "*", element: <Navigate to="/" replace /> },
];
