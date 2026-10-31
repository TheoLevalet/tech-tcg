import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { z } from "zod";

const envSchema = z.object({
  VITE_FIREBASE_API_KEY: z.string().min(1),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1),
  VITE_FIREBASE_APP_ID: z.string().min(1),
  VITE_USE_EMULATORS: z.enum(["true", "false"]).default("false"),
});

// En développement, projet de démonstration servi par les emulators : aucun service réel.
const developmentDefaults = {
  VITE_FIREBASE_API_KEY: "demo-key",
  VITE_FIREBASE_AUTH_DOMAIN: "demo-tech-tcg.firebaseapp.com",
  VITE_FIREBASE_PROJECT_ID: "demo-tech-tcg",
  VITE_FIREBASE_APP_ID: "demo-app",
  VITE_USE_EMULATORS: "true",
};

const parsed = envSchema.safeParse(
  import.meta.env.DEV ? { ...developmentDefaults, ...import.meta.env } : import.meta.env,
);
if (!parsed.success) {
  throw new Error(`Configuration Firebase incomplète : ${z.prettifyError(parsed.error)}`);
}
const env = parsed.data;

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});

export const auth = getAuth(app);

if (env.VITE_USE_EMULATORS === "true") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
}
