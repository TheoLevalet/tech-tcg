import type { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  useColorScheme,
  View,
} from "react-native";

export const pseudoError = "Pseudo invalide : 3 à 20 caractères, lettres, chiffres, _ ou -.";

const palettes = {
  light: {
    bg: "#f6f6f8",
    text: "#1c1c22",
    muted: "#5c5c6a",
    accent: "#4b3fd1",
    accentText: "#ffffff",
    border: "#d4d4dc",
    error: "#b42318",
  },
  dark: {
    bg: "#121216",
    text: "#ececf1",
    muted: "#a4a4b2",
    accent: "#8f86ff",
    accentText: "#121216",
    border: "#3a3a46",
    error: "#ff8a80",
  },
};

export function usePalette() {
  return palettes[useColorScheme() === "dark" ? "dark" : "light"];
}

export function Screen({ title, children }: { title?: string; children: ReactNode }) {
  const palette = usePalette();
  return (
    <ScrollView
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      {title && <Text style={[styles.title, { color: palette.text }]}>{title}</Text>}
      {children}
    </ScrollView>
  );
}

export function Field({ label, ...input }: { label: string } & TextInputProps) {
  const palette = usePalette();
  return (
    <View style={styles.field}>
      <Text style={{ color: palette.muted }}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        placeholderTextColor={palette.muted}
        style={[styles.input, { color: palette.text, borderColor: palette.border }]}
        {...input}
      />
    </View>
  );
}

export function Button({
  label,
  onPress,
  disabled,
  secondary,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  const palette = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        secondary
          ? { borderWidth: 1, borderColor: palette.border }
          : { backgroundColor: palette.accent },
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.buttonText, { color: secondary ? palette.text : palette.accentText }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Body({ children }: { children: ReactNode }) {
  return <Text style={{ color: usePalette().text }}>{children}</Text>;
}

export function ErrorMessage({ message }: { message: string | null }) {
  const palette = usePalette();
  if (!message) return null;
  return (
    <Text accessibilityRole="alert" style={{ color: palette.error }}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 16 },
  title: { fontSize: 24, fontWeight: "700" },
  field: { gap: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: { borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  buttonText: { fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.6 },
});
