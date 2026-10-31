import { Redirect, Stack } from "expo-router";
import { useAuth } from "./auth/auth-context.ts";

export function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Redirect href={user ? "/accueil" : "/connexion"} />;
}

export function AuthLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Redirect href="/accueil" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}

export function AppLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect href="/connexion" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
