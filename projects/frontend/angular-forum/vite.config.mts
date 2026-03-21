/// <reference types='vitest' />
import { defineConfig } from "vite";
import angular from "@analogjs/vite-plugin-angular";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";

export default defineConfig(() => ({
    root: __dirname,
    cacheDir: "../../../node_modules/.vite/projects/frontend/angular-forum",
    plugins: [angular(), nxViteTsPaths()],
    test: {
        name: "angular-forum",
        watch: false,
        globals: true,
        environment: "jsdom",
        include: ["{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
        setupFiles: ["src/test-setup.ts"],
        reporters: ["default"],
        coverage: {
            reportsDirectory: "../../../coverage/projects/frontend/angular-forum",
            provider: "v8" as const,
            include: [
                "src/app/core/services/**/*.ts",
                "src/app/core/guards/**/*.ts",
                "src/app/core/interceptors/**/*.ts",
                "src/app/facade/**/*.ts"
            ],
            exclude: ["**/*.spec.ts", "**/*.test.ts", "**/index.ts"],
            reporter: ["text", "text-summary", "lcov", "html"]
        }
    }
}));
