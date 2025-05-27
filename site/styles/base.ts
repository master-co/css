import type { Config } from '@master/css'

export default {
    modes: {
        light: {
            'yellow-ring': '$color-black/.1',
            'touch-yellow': '$color-yellow-30',
            text: {
                'yellow-contrast': '$color-yellow-90'
            }
        },
        dark: {
            'yellow-ring': '$color-white/.3',
            'touch-yellow': '$color-yellow-40',
            text: {
                'yellow-contrast': '$color-yellow-95'
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