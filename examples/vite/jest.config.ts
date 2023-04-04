const esModules = ['strip-ansi'].join('|')

/** @type {import('jest').Config} */
export default {
    preset: '@techor/jest',
    transformIgnorePatterns: [`../../node_modules/(?:${esModules})`]
}
