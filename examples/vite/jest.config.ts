const esModules = ['strip-ansi'].join('|')

/** @type {import('jest').Config} */
export default {
    preset: 'jest-puppeteer',
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
