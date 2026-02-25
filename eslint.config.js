// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const simpleImportSort = require("eslint-plugin-simple-import-sort");
const prettierPlugin = require("eslint-plugin-prettier");

/** Regeln, die für alle TypeScript-Dateien im Monorepo gelten */
const sharedTsRules = {
    quotes: ["error", "double", { avoidEscape: true }],
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
    "prettier/prettier": "error",
    "@typescript-eslint/member-ordering": ["error"],
    "@typescript-eslint/no-unused-expressions": "off",
    "@typescript-eslint/no-inferrable-types": "off",
    "@typescript-eslint/no-unused-vars": [
        "error",
        {
            args: "all",
            argsIgnorePattern: "^_",
            caughtErrors: "all",
            caughtErrorsIgnorePattern: "^_",
            destructuredArrayIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            ignoreRestSiblings: true
        }
    ]
};

module.exports = tseslint.config(
    // ── Frontend (Angular) ────────────────────────────────────────────────────
    {
        files: ["projects/frontend/**/*.ts"],
        plugins: {
            "simple-import-sort": simpleImportSort,
            prettier: prettierPlugin
        },
        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.recommended,
            ...tseslint.configs.stylistic,
            ...angular.configs.tsRecommended
        ],
        processor: angular.processInlineTemplates,
        rules: {
            ...sharedTsRules,
            "@angular-eslint/directive-selector": [
                "error",
                { type: "attribute", prefix: "", style: "camelCase" }
            ],
            "@angular-eslint/component-selector": [
                "error",
                { type: "element", prefix: "", style: "kebab-case" }
            ]
        }
    },
    {
        files: ["projects/frontend/**/*.html"],
        extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
        rules: {
            quotes: ["error", "double"]
        }
    },

    // ── Backend (NestJS) ──────────────────────────────────────────────────────
    {
        files: ["projects/backend/**/*.ts"],
        plugins: {
            "simple-import-sort": simpleImportSort,
            prettier: prettierPlugin
        },
        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.recommended,
            ...tseslint.configs.stylistic
            // Kein angular.configs.tsRecommended – nicht relevant für NestJS
        ],
        rules: {
            ...sharedTsRules,
            // Alle Angular-spezifischen Regeln deaktivieren
            "@angular-eslint/component-selector": "off",
            "@angular-eslint/directive-selector": "off",
            "@angular-eslint/component-class-suffix": "off",
            "@angular-eslint/directive-class-suffix": "off",
            "@angular-eslint/no-input-rename": "off",
            "@angular-eslint/no-output-rename": "off",
            "@angular-eslint/use-lifecycle-interface": "off",
            "@angular-eslint/contextual-lifecycle": "off",
            "@angular-eslint/prefer-inject": "off",
            "@angular-eslint/prefer-standalone": "off"
        }
    }
);
