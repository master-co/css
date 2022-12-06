/** @type {import('jest').Config} */
export default {
    extensionsToTreatAsEsm: ['.ts'],
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
