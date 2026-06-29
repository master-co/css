import common from 'internal/eslint.config.js'
import { includeIgnoreFile } from '@eslint/compat'
import { fileURLToPath } from 'node:url'

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url))

export default [
    includeIgnoreFile(gitignorePath),
    ...common.flat(),
    // {
    //     rules: {
    //         '@master/css/no-invalid-classes': ['error', {
    //             disallowUnknownClass: true
    //         }]
    //     }
    // }
]
