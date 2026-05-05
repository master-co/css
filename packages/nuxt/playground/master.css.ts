import type { Config } from '@master/css'

export default {
    components: {
        box: ['flex font:1em bg:cyan']
    },
    utilities: [
        {
            name: 'foo',
            matcher: /^foo:/,
            declarations: {
                width: undefined
            }
        }
    ]
} as Config
