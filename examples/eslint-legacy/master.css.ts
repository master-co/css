import type { Config } from '@master/css'

export default {
    components: {
        btn: [
            { selector: '&', declarations: { display: 'inline-flex' } },
            { selector: '&', declarations: { 'padding-left': '1rem', 'padding-right': '1rem' } },
            { selector: '&', declarations: { 'background-color': 'error' } }
        ]
    }
} as Config
