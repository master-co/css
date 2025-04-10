import { fileURLToPath } from 'node:url'
import common from 'internal/eslint.config.mjs'

export default [
    ...common,
    {
        settings: {
            '@master/css': {
                config: fileURLToPath(new URL('master.css.ts', import.meta.url))
            }
        }
    },
    // {
    //     rules: {
    //         '@master/css/class-validation': ['error', {
    //             disallowUnknownClass: true
    //         }]
    //     }
    // }
]