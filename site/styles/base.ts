import type { Config } from '@master/css'

export default {
    variables: [
        { namespace: 'color', key: 'yellow-ring', value: '$color-black/.1', mode: 'light' },
        { namespace: 'color', key: 'touch-yellow', value: '$color-yellow-30', mode: 'light' },
        { namespace: 'color.text', key: 'yellow-contrast', value: '$color-yellow-90', mode: 'light' },
        { namespace: 'color', key: 'yellow-ring', value: '$color-white/.3', mode: 'dark' },
        { namespace: 'color', key: 'touch-yellow', value: '$color-yellow-40', mode: 'dark' },
        { namespace: 'color.text', key: 'yellow-contrast', value: '$color-yellow-95', mode: 'dark' }
    ],
    modes: ['light', 'dark'],
    components: {
        yellow: [
            { selector: '&', declarations: { outline: '0.0625rem var(--color-yellow-ring) solid' } },
            { selector: '&', declarations: { 'background-color': 'var(--color-yellow)' } },
            { selector: '&', declarations: { color: 'var(--color-text-yellow-contrast)' } }
        ],
        'touch-yellow': [
            { selector: '&:hover', declarations: { 'background-color': 'var(--color-touch-yellow)' } }
        ]
    },
} as Config
