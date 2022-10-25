// eslint-disable-next-line no-undef
module.exports = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.(t|j)sx?$': '@swc/jest',
    },
    testMatch: [
        '<rootDir>/tests/*.ts',
        '<rootDir>/src/**/*.test.ts'
    ]
}
