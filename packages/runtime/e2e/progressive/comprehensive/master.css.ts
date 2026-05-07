import { Config } from '@master/css'

export default {
    variables: [
        { key: 'primary', value: '#000000', mode: 'light' },
        { key: 'primary', value: '#ffffff', mode: 'dark' }
    ],
    modes: ['light', 'dark'],
    components: {
        btn: [
            { selector: '&', declarations: { display: 'inline-flex' } },
            { selector: '&', declarations: { 'background-color': 'var(--primary)' } }
        ]
    }
} satisfies Config
