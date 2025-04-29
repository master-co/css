import type { Config } from '@master/css'

export default {
    modes: {
        light: {
            'yellow-ring': '$black/.1',
            'touch-yellow': '$yellow-30',
            text: {
                'yellow-contrast': '$yellow-90'
            }
        },
        dark: {
            'yellow-ring': '$white/.3',
            'touch-yellow': '$yellow-40',
            text: {
                'yellow-contrast': '$yellow-95'
            }
        }
    },
    components: {
        yellow: 'outline:1|yellow-ring bg:yellow fg:yellow-contrast',
        touch: {
            yellow: 'bg:touch-yellow:hover'
        }
    },
} as Config