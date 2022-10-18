module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    transform: {
        "^.+\\.(t|j)sx?$": ["@swc/jest"],
    },
};
