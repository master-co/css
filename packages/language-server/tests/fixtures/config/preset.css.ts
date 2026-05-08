import type { Config } from '@master/css'

export default {
    utilities: [
        {
            name: 'fixture-card',
            type: -4,
            layer: 'main',
            rules: [
                { selector: '&', declarations: { display: 'block' } }
            ]
        }
    ]
} as Config
