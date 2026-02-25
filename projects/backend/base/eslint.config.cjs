// @ts-check
const baseConfig = require('../../../eslint.base.config.js');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  // Alle base-Regeln übernehmen, aber Angular-spezifisches entfernen
  ...baseConfig
    .filter((config) => {
      // HTML-Template-Konfiguration weglassen (nicht relevant für NestJS)
      return !config.files?.some((f) => f.includes('*.html'));

    })
    .map((config) => {
      // Angular-Template-Prozessor komplett aus dem Objekt entfernen
      const { processor, ...rest } = config;
      return rest;
    }),
  // Angular-spezifische Regeln für das Backend deaktivieren
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/component-selector': 'off',
      '@angular-eslint/directive-selector': 'off',
      '@angular-eslint/component-class-suffix': 'off',
      '@angular-eslint/directive-class-suffix': 'off',
      '@angular-eslint/no-input-rename': 'off',
      '@angular-eslint/no-output-rename': 'off',
      '@angular-eslint/use-lifecycle-interface': 'off',
      '@angular-eslint/contextual-lifecycle': 'off',
    },
  }
);
