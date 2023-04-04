const esModules = ['strip-ansi'].join('|')

/** @type {import('jest').Config} */
export default {
    ...require('@techor/jest'),
    preset: 'jest-puppeteer',
    transformIgnorePatterns: [`../../node_modules/(?:${esModules})`]
}
