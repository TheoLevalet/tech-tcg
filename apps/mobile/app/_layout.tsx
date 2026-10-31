import { Slot } from "expo-router";
import { ApiProvider } from "../src/api.tsx";
import { AuthProvider } from "../src/auth/AuthProvider.tsx";
import { apiUrl } from "../src/config.ts";
import { auth } from "../src/firebase.ts";

export default function RootLayout() {
  return (
    <AuthProvider auth={auth}>
      <ApiProvider baseUrl={apiUrl}>
        <Slot />
      </ApiProvider>
    </AuthProvider>
  );
}
