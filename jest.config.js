// eslint-disable-next-line no-undef
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
        '^.+\\.(t|j)sx?$': '@swc/jest',
    },
    modulePathIgnorePatterns: [
        '<rootDir>/src/package.json'
    ],
    testMatch: ['<rootDir>/tests/*.ts']
}
