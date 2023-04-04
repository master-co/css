const esModules = ['strip-ansi'].join('|')

/** @type {import('jest').Config} */
export default {
    preset: '@techor/jest-puppeteer',
    transformIgnorePatterns: [`../../node_modules/(?:${esModules})`]
}
