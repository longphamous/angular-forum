// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const simpleImportSort = require("eslint-plugin-simple-import-sort");
const prettierPlugin = require("eslint-plugin-prettier");

module.exports = tseslint.config(
    {
        files: ["**/*.ts"],
        plugins: {
            "simple-import-sort": simpleImportSort,
            "prettier": prettierPlugin
        },
        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.recommended,
            ...tseslint.configs.stylistic,
            ...angular.configs.tsRecommended
        ],
        processor: angular.processInlineTemplates,
        rules: {
            "quotes": ["error", "double", { avoidEscape: true }],
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",
            "prettier/prettier": "error",
            "@angular-eslint/directive-selector": [
                "error",
                {
                    type: "attribute",
                    prefix: "",
                    style: "camelCase"
                }
            ],
            "@angular-eslint/component-selector": [
                "error",
                {
                    type: "element",
                    prefix: "",
                    style: "kebab-case"
                }
            ],
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
        }
    },
    {
        files: ["**/*.html"],
        extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
        rules: {
            quotes: ["error", "double"]
        }
    }
);
