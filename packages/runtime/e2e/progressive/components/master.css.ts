import { Config } from '@master/css'

export default {
    components: {
        btn: [
            { selector: '&', declarations: { 'background-color': 'var(--color-foo)' } }
        ]
    },
    variables: [
        { namespace: 'color', key: 'foo', value: 'oklch(0% 0 none)' }
    ]
} satisfies Config
