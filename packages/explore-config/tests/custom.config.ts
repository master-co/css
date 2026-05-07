import type { Config } from '@master/css'

export default {
    components: {
        custom: [
            { selector: '&', declarations: { display: 'inline-flex' } }
        ]
    }
} as Config
