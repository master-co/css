import { Config } from '@master/css'

export default {
    selectors: {
        '::both': ['::before', '::after'],
    },
    components: {
        btn: 'bg:black block::both'
    }
} satisfies Config