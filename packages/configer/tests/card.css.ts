import { Config } from '@master/css'

export default {
    utilities: [
        {
            name: 'card',
            type: -4,
            layer: 'main',
            rules: [
                { selector: '&', declarations: { display: 'inline-flex' } }
            ]
        }
    ]
} as Config
