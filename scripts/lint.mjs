#!/usr/bin/env node
/**
 * lint.mjs – ESLint autofix runner für das MonoRepo
 *
 * Verwendung:
 *   node scripts/lint.mjs                  → alle Projekte
 *   node scripts/lint.mjs base             → nur "base"
 *   node scripts/lint.mjs angular-forum anime-db
 *
 * Optionen:
 *   --fix          ESLint mit --fix ausführen (Standard: true über npm-Skripte)
 *   --no-fix       Nur prüfen, keine Korrekturen vornehmen
 *   --max-warnings <n>  Maximale Anzahl Warnungen (Standard: 0)
 *
 * Bekannte Projekte:
 *   angular-forum  projects/frontend/angular-forum
 *   anime-db       projects/frontend/anime-db
 *   shared         projects/frontend/libs/shared
 *   base           projects/backend/base
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ─── Projektkatalog ──────────────────────────────────────────────────────────
// name → { root, eslintConfig, patterns }
const PROJECTS = {
  "angular-forum": {
    root: "projects/frontend/angular-forum",
    eslintConfig: "projects/frontend/angular-forum/eslint.config.js",
    patterns: [
      "projects/frontend/angular-forum/src/**/*.ts",
      "projects/frontend/angular-forum/src/**/*.html",
    ],
  },
  "anime-db": {
    root: "projects/frontend/anime-db",
    eslintConfig: "projects/frontend/anime-db/eslint.config.cjs",
    patterns: ["projects/frontend/anime-db/src/**/*.ts"],
  },
  shared: {
    root: "projects/frontend/libs/shared",
    eslintConfig: "projects/frontend/libs/shared/eslint.config.cjs",
    patterns: ["projects/frontend/libs/shared/src/**/*.ts"],
  },
  base: {
    root: "projects/backend/base",
    eslintConfig: "projects/backend/base/eslint.config.cjs",
    patterns: ["projects/backend/base/**/*.ts"],
  },
};

// ─── Argument-Parsing ────────────────────────────────────────────────────────
const rawArgs = process.argv.slice(2);

let fix = true; // Standard: autofix aktiv
let maxWarnings = 0;
const projectArgs = [];

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg === "--fix") {
    fix = true;
  } else if (arg === "--no-fix") {
    fix = false;
  } else if (arg === "--max-warnings") {
    maxWarnings = parseInt(rawArgs[++i] ?? "0", 10);
  } else if (!arg.startsWith("--")) {
    projectArgs.push(arg);
  }
}

// Projekte auflösen
let selectedProjects;
if (projectArgs.length === 0) {
  selectedProjects = Object.keys(PROJECTS);
} else {
  selectedProjects = projectArgs;
  const unknown = selectedProjects.filter((p) => !PROJECTS[p]);
  if (unknown.length > 0) {
    console.error(`\n❌  Unbekannte Projekte: ${unknown.join(", ")}`);
    console.error(`   Verfügbare Projekte: ${Object.keys(PROJECTS).join(", ")}\n`);
    process.exit(1);
  }
}

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────
function banner(text) {
  const line = "─".repeat(text.length + 4);
  console.log(`\n┌${line}┐`);
  console.log(`│  ${text}  │`);
  console.log(`└${line}┘`);
}

function run(cmd, cwd) {
  console.log(`\n$ ${cmd}\n`);
  execSync(cmd, { cwd, stdio: "inherit" });
}

// ─── Hauptlogik ──────────────────────────────────────────────────────────────
const total = selectedProjects.length;
const failed = [];

console.log(`\n🔍  ESLint${fix ? " (autofix)" : ""} für ${total === Object.keys(PROJECTS).length ? "alle" : total} Projekt(e): ${selectedProjects.join(", ")}`);

for (const name of selectedProjects) {
  const project = PROJECTS[name];
  banner(`${name}  (${project.root})`);

  const configPath = resolve(ROOT, project.eslintConfig);
  if (!existsSync(configPath)) {
    console.warn(`⚠️   ESLint-Konfiguration nicht gefunden: ${project.eslintConfig} – übersprungen`);
    continue;
  }

  const patterns = project.patterns.join(" ");
  const fixFlag = fix ? " --fix" : "";
  const cmd = `pnpm exec eslint${fixFlag} --max-warnings ${maxWarnings} ${patterns}`;

  try {
    run(cmd, ROOT);
    console.log(`✅  ${name} – erfolgreich`);
  } catch {
    console.error(`❌  ${name} – ESLint hat Fehler gemeldet`);
    failed.push(name);
  }
}

// ─── Zusammenfassung ─────────────────────────────────────────────────────────
banner("Zusammenfassung");

const passed = total - failed.length;
console.log(`\n  ✅ Bestanden : ${passed}/${total}`);
if (failed.length > 0) {
  console.log(`  ❌ Fehlerhaft: ${failed.join(", ")}`);
  process.exit(1);
} else {
  console.log(`\n  Alle Projekte ohne Fehler abgeschlossen.\n`);
}

