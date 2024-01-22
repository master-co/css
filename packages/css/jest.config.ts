/** @type {import('jest').Config} */
export default {
    preset: '@techor/jest-dom',
    setupFilesAfterEnv: ['./jest-setup.ts'],
    transform: {
        '^.+\\.txt$': 'jest-text-transformer'
    }
}
