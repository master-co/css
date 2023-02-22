/** @type {import('jest').Config} */
// eslint-disable-next-line import/no-anonymous-default-export
export default {
    preset: 'jest-puppeteer',
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
