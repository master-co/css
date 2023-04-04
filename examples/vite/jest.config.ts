const esModules = ['strip-ansi'].join('|')

/** @type {import('jest').Config} */
export default {
    'globalSetup': 'jest-environment-puppeteer/setup',
    'globalTeardown': 'jest-environment-puppeteer/teardown',
    'testEnvironment': 'jest-environment-puppeteer',
    transformIgnorePatterns: [`../../node_modules/(?:${esModules})`],
    transform: {
        '^.+\\.(t|j)sx?$': '@swc/jest'
    },
    globals: {
        'ts-jest': {
            tsConfig: {
                importHelpers: true
            }
        }
    }
}
