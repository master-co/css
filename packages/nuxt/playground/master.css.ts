import type { Config } from '@master/css'

export default {
    components: {
        box: ['flex font:1em bg:cyan']
    },
    rules: [
        {
            name: 'foo',
            matcher: /^foo:/,
            declarations: {
                width: undefined
            }
        }
    ]
} as Config
