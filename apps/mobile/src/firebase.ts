import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getReactNativePersistence, initializeAuth } from "@firebase/auth";
import { emulatorHost, firebaseOptions, useEmulators } from "./config.ts";

const app = initializeApp(firebaseOptions);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

if (useEmulators) {
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
}
