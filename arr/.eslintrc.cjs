module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  },
  settings: {
    react: {
      version: "detect"
    }
  },
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  overrides: [
    {
      files: ["*.js", "*.cjs"],
      parser: null,
      plugins: [],
      extends: ["eslint:recommended"]
    },
    {
      files: ["**/*.test.{ts,tsx,js,jsx}"],
      env: {
        jest: true
      }
    }
  ],
  rules: {
    "react/react-in-jsx-scope": "off"
  }
};


