import type { Config } from '@master/css'

export default {
    components: {
        box: 'flex font:1em bg:cyan'
    },
    rules: {
        foo: {
            match: /^foo:/,
            declarations: {
                width: undefined
            }
        }
    }
} as Config