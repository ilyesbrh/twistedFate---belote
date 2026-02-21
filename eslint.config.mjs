// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: ["**/dist/", "**/node_modules/", "**/coverage/", "**/storybook-static/"],
  },

  js.configs.recommended,

  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "eslint.config.mjs",
            "vitest.config.ts",
            "packages/*/vite.config.ts",
            "packages/ui/.storybook/*.ts",
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    rules: {
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },

  // Story files: relax explicit return types (story API is loosely typed)
  {
    files: ["**/*.stories.ts"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },

  // Test files: relax rules that fight against natural test patterns
  {
    files: ["**/__tests__/**/*.ts", "**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/non-nullable-type-assertion-style": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/array-type": "off",
    },
  },

  // Disable type-checked rules for config files (no full tsconfig coverage)
  {
    files: [
      "eslint.config.mjs",
      "vitest.config.ts",
      "packages/*/vitest.config.ts",
      "packages/*/vite.config.ts",
      "packages/ui/.storybook/*.ts",
    ],
    ...tseslint.configs.disableTypeChecked,
  },

  prettierConfig,
);
