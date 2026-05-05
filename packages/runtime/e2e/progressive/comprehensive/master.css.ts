import { Config } from '@master/css'

export default {
    variables: [
        { key: 'primary', value: '#000000', mode: 'light' },
        { key: 'primary', value: '#ffffff', mode: 'dark' }
    ],
    modes: ['light', 'dark'],
    components: {
        btn: ['inline-flex', 'bg:primary']
    }
} satisfies Config
