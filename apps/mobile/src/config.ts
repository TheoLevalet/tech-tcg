import Constants from "expo-constants";
import { z } from "zod";

const envSchema = z.object({
  apiKey: z.string().min(1),
  authDomain: z.string().min(1),
  projectId: z.string().min(1),
  appId: z.string().min(1),
  useEmulators: z.enum(["true", "false"]),
  apiUrl: z.string().min(1).optional(),
});

// Expo n'injecte que les accès statiques à process.env.EXPO_PUBLIC_*.
const fromEnv = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  useEmulators: process.env.EXPO_PUBLIC_USE_EMULATORS,
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
};

// En développement, projet de démonstration servi par les emulators : aucun service réel.
const developmentDefaults = {
  apiKey: "demo-key",
  authDomain: "demo-tech-tcg.firebaseapp.com",
  projectId: "demo-tech-tcg",
  appId: "demo-app",
  useEmulators: "true",
};

function definedOnly(values: Record<string, string | undefined>) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
}

const parsed = envSchema.safeParse(
  __DEV__ ? { ...developmentDefaults, ...definedOnly(fromEnv) } : fromEnv,
);
if (!parsed.success) {
  throw new Error(`Configuration Firebase incomplète : ${z.prettifyError(parsed.error)}`);
}
const env = parsed.data;

// Le simulateur et un téléphone sur le même réseau joignent les emulators par l'hôte de Metro.
export const emulatorHost = Constants.expoConfig?.hostUri?.split(":")[0] ?? "127.0.0.1";

export const useEmulators = env.useEmulators === "true";

export const firebaseOptions = {
  apiKey: env.apiKey,
  authDomain: env.authDomain,
  projectId: env.projectId,
  appId: env.appId,
};

export const apiUrl = useEmulators
  ? `http://${emulatorHost}:5001/${env.projectId}/europe-west1/api`
  : env.apiUrl;
