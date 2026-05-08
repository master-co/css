import type { Config } from '@master/css'

export const config = {
    utilities: [
        {
            name: 'named',
            type: -4,
            layer: 'main',
            rules: [
                { selector: '&', declarations: { display: 'inline-flex' } }
            ]
        }
    ]
} as Config

export default {
    utilities: [
        {
            name: 'fallback',
            type: -4,
            layer: 'main',
            rules: [
                { selector: '&', declarations: { display: 'block' } }
            ]
        }
    ]
} as Config
