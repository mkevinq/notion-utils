const prettierConfig = require("./prettier.js");

module.exports = {
  env: {
    es2021: true,
    browser: true,
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:jsdoc/recommended",
    "plugin:prettier/recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "import", "jsdoc"],
  rules: {
    "arrow-body-style": "error",
    "sort-imports": [
      "error",
      {
        ignoreCase: true,
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
        allowSeparatedGroups: true,
      },
    ],
    "import/no-unresolved": "warn",
    "import/order": [
      "error",
      { "newlines-between": "always", alphabetize: { order: "asc" } },
    ],
    "jsdoc/require-jsdoc": [
      "warn",
      {
        require: {
          ArrowFunctionExpression: true,
          FunctionDeclaration: true,
          MethodDefinition: true,
        },
      },
    ],
    "jsdoc/require-param-type": "off",
    "jsdoc/require-returns-type": "off",
    "jsdoc/require-description-complete-sentence": "warn",
    "jsdoc/require-hyphen-before-param-description": [
      "warn",
      "always",
      { tags: { "*": "never" } },
    ],
    "prettier/prettier": ["warn", prettierConfig],
  },
};
