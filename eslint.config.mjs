import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";

export default tseslint.config(
  {
    ignores: ["dist", "node_modules", "main.js"],
  },
  // Obsidian plugin recommended rules; provided as a flat-config iterable
  ...obsidianmd.configs.recommended,
  {
    files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
    rules: {
      // Avoid type-aware rules on plain JS files
      "@typescript-eslint/no-deprecated": "off",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  }
);

