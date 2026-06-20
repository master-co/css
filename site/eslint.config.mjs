import common from 'internal/eslint.config.mjs'
import { includeIgnoreFile } from '@eslint/compat'
import { fileURLToPath } from 'node:url'

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url))

export default [
    includeIgnoreFile(gitignorePath),
    ...common,
    // {
    //     rules: {
    //         '@master/css/class-validation': ['error', {
    //             disallowUnknownClass: true
    //         }]
    //     }
    // }
]
