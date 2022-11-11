/** @type {import('jest').Config} */
export default {
    preset: 'jest-puppeteer',
    testEnvironment: 'jest-environment-jsdom',
    transform: {
        '^.+\\.(t|j)sx?$': '@swc/jest'
    }
} 