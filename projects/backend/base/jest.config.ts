export default {
    displayName: "base",
    preset: "../../../jest.preset.js",
    testEnvironment: "node",
    transform: {
        "^.+\\.[tj]s$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.spec.json" }]
    },
    moduleFileExtensions: ["ts", "js", "html"],
    coverageDirectory: "../../../coverage/projects/backend/base",
    collectCoverageFrom: [
        "src/app/**/*.service.ts",
        "src/app/**/*.controller.ts",
        "src/app/**/*.guard.ts",
        "!src/app/**/*.module.ts",
        "!src/app/**/*.entity.ts",
        "!src/app/**/*.model.ts",
        "!src/app/**/*.dto.ts",
        "!src/app/**/index.ts"
    ],
    coverageReporters: ["text", "text-summary", "lcov", "html"],
    moduleNameMapper: {
        "^@backend/contracts$": "<rootDir>/../libs/contracts/src/index.ts",
        "^@backend/push$": "<rootDir>/../push/src/index.ts"
    }
};
