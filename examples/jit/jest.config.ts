const esModules = ['strip-ansi'].join('|')

/** @type {import('jest').Config} */
export default {
    ...require('@techor/jest'),
    transformIgnorePatterns: [`../../node_modules/(?:${esModules})`]
}
