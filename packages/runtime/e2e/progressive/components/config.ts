import { Config } from '@master/css'

export default {
    utilities: [
        {
            name: 'btn',
            type: -4,
            layer: 'main',
            rules: [
                { selector: '&', declarations: { 'background-color': 'var(--color-foo)' } }
            ]
        }
    ],
    variables: [
        { namespace: 'color', key: 'foo', value: 'oklch(0% 0 none)' }
    ]
} satisfies Config
