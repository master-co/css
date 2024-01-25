import type { Config } from '@master/css'

export default {
    styles: {
        box: 'flex font:1em bg:blue-50'
    },
    rules: {
        foo: {
            match: /^foo:/,
            declare(value, unit) {
                return {
                    width: value + unit
                }
            }
        }
    }
} as Config