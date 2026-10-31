import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./auth-context.ts";

export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

function redirectTarget(state: unknown): string {
  if (typeof state === "object" && state !== null && "from" in state) {
    const { from } = state;
    if (typeof from === "string" && from.startsWith("/")) return from;
  }
  return "/accueil";
}

export function RedirectIfAuthenticated() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (user) return <Navigate to={redirectTarget(location.state)} replace />;
  return <Outlet />;
}
