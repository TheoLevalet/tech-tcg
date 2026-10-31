import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export const base = tseslint.config(
  { ignores: ["dist/**", "coverage/**", ".expo/**"] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: { globals: globals.node },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
);

export const react = tseslint.config(...base, reactHooks.configs.flat.recommended, {
  languageOptions: { globals: globals.browser },
});
