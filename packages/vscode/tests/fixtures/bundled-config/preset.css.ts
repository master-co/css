import type { Config } from '@master/css'

export default {
    components: {
        'bundle-card': [
            { selector: '&', declarations: { display: 'block' } }
        ]
    }
} as Config
