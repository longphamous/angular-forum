export default {
    displayName: "push",
    preset: "../../../jest.preset.js",
    testEnvironment: "node",
    transform: {
        "^.+\\.[tj]s$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.spec.json" }]
    },
    moduleFileExtensions: ["ts", "js", "html"],
    coverageDirectory: "../../../coverage/projects/backend/push",
    moduleNameMapper: {
        "^@backend/contracts$": "<rootDir>/../libs/contracts/src/index.ts"
    }
};
