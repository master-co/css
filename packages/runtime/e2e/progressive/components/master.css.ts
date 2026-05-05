import { Config } from '@master/css'

export default {
    components: {
        btn: ['bg:foo']
    },
    variables: [
        { namespace: 'color', key: 'foo', value: 'oklch(0% 0 none)' }
    ]
} satisfies Config
