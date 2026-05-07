import type { Config } from '@master/css'

export default {
    components: {
        box: [
            { selector: '&', declarations: { display: 'flex' } },
            { selector: '&', declarations: { 'font-size': '1em' } },
            { selector: '&', declarations: { 'background-color': 'oklch(91.7% 0.08 205.041)' } }
        ]
    },
    utilities: [
        {
            name: 'foo',
            matcher: /^foo:/,
            declarations: {
                width: undefined
            }
        }
    ]
} as Config
