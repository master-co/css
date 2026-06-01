import type { Config } from '@master/css'

export default {
    utilities: [
        {
            name: 'custom',
            type: -4,
            layer: 'main',
            rules: [
                { selector: '&', declarations: { display: 'inline-flex' } }
            ]
        }
    ]
} as Config
