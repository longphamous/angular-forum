module.exports = {
  ignorePatterns: ["node_modules/*", ".idea/*", "dist/*", "*.js"],
  root: true,
  env: {
    es6: true,
    node: true,
    browser: true,
    mocha: true,
    jasmine: true
  },
  overrides: [
    {
      files: ["*.ts"],
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ["./tsconfig.json"],
        sourceType: "module",
        ecmaVersion: 2018
      },
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint", "jasmine", "import", "rxjs-angular"],
      rules: {
        "rxjs-angular/prefer-takeuntil": "error",
        "@typescript-eslint/explicit-function-return-type": ["error"],
        "@typescript-eslint/prefer-string-starts-ends-with": "error",
        "@typescript-eslint/naming-convention": [
          "error",
          { selector: "default", format: ["camelCase", "UPPER_CASE", "snake_case", "PascalCase"], leadingUnderscore: "allow" }
        ],
        "@typescript-eslint/explicit-member-accessibility": [
          "error",
          {
            accessibility: "no-public"
          }
        ],
        "@typescript-eslint/member-delimiter-style": [
          "error",
          {
            multiline: {
              delimiter: "semi",
              requireLast: true
            },
            singleline: {
              delimiter: "semi",
              requireLast: false
            }
          }
        ],
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/type-annotation-spacing": "error",
        "@typescript-eslint/semi": ["error", "always"],
        "@typescript-eslint/member-ordering": ["error"],
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            vars: "local",
            args: "after-used",
            ignoreRestSiblings: false
          }
        ],
        "@typescript-eslint/no-shadow": ["error"],
        "camelcase": "off",
        "curly": "error",
        "constructor-super": "error",
        "dot-notation": "off",
        "eol-last": "error",
        "eqeqeq": ["error", "always"],
        "guard-for-in": "error",
        "id-blacklist": "off",
        "id-match": "off",
        "import/order": ["error", { "newlines-between": "always" }],
        "import/newline-after-import": ["error", { count: 1 }],
        "jasmine/no-focused-tests": 2,
        "max-len": [
          "error",
          {
            code: 140
          }
        ],
        "no-undef": "off",
        "no-bitwise": "error",
        "no-caller": "error",
        "no-console": "error",
        "no-debugger": "error",
        "no-duplicate-imports": "error",
        "no-empty": "off",
        "no-eval": "error",
        "no-fallthrough": "error",
        "no-new-wrappers": "error",
        "no-redeclare": "error",
        "no-shadow": ["off"],
        "no-trailing-spaces": "error",
        "no-underscore-dangle": "off",
        "no-unused-expressions": "off",
        "no-unused-labels": "error",
        "no-unused-vars": "off",
        "no-var": "error",
        "no-use-before-define": ["error", { functions: true, classes: false }],
        "padding-line-between-statements": [
          "error",
          { blankLine: "always", prev: ["const", "let", "var"], next: "*" },
          { blankLine: "always", prev: "*", next: "return" },
          { blankLine: "any", prev: ["const", "let", "var"], next: ["const", "let", "var"] }
        ],
        "prefer-const": "error",
        "radix": "error",
        "prettier/prettier": [
          "error",
          {
            endOfLine: "auto"
          }
        ],
      },
      extends: ["prettier/@typescript-eslint", "plugin:prettier/recommended"],
    },
    {
      "files": ["*.html"],
      "rules": {}
    },
  ]
};
