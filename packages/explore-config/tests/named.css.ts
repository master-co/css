import type { Config } from '@master/css'

export const config = {
    components: {
        named: [
            { selector: '&', declarations: { display: 'inline-flex' } }
        ]
    }
} as Config

export default {
    components: {
        fallback: [
            { selector: '&', declarations: { display: 'block' } }
        ]
    }
} as Config
