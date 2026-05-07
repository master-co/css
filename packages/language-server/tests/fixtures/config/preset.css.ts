import type { Config } from '@master/css'

export default {
    components: {
        'fixture-card': [
            { selector: '&', declarations: { display: 'block' } }
        ]
    }
} as Config
