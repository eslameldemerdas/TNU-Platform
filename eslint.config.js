import js from "@eslint/js";
import path from "path";
import { fileURLToPath } from "url";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  js.configs.recommended,
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/build/**",
      "**/coverage/**",
      "**/uploads/**",
      "**/.pgdata/**",
      "**/prisma/migrations/**",
      "**/tests/**",
      "**/*.js",
      "**/*.cjs",
      "**/*.mjs",
      "**/bun.lock",
      "**/package-lock.json",
      "**/*.config.ts",
      "audit_results.json",
      "baseline_before*.log",
      "empirical_audit_report.json",
      "focused_audit_evidence.json",
      "fk_check.mjs",
      "index.html",
      "metadata.json",
      "pglite_bridge.log",
      "run_deep_audit.ts",
      "run_focused_verification.ts",
      "run_full_empirical_audit.ts",
      "server_v*.log",
      "test_rbac_and_i18n.ts",
      "verify-*.mjs",
      "WORLD_CLASS_AUDIT_REPORT.json",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.es2022,
        ...globals.browser,
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        fetch: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        crypto: "readonly",
        FormData: "readonly",
        ReadableStream: "readonly",
        WritableStream: "readonly",
        TransformStream: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        Headers: "readonly",
        Request: "readonly",
        Response: "readonly",
        WebSocket: "readonly",
        performance: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      import: importPlugin,
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
        node: {
          extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
        },
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...importPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "import/no-unresolved": "off",
      "import/order": ["warn", { alphabetize: { order: "asc" } }],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}", "App.tsx", "main.tsx"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/jsx-uses-react": "off",
      "react/jsx-uses-vars": "error",
    },
    settings: {
      react: { version: "detect" },
    },
  },
  prettierConfig,
];
