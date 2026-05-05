import type { Config } from '@master/css'
import preset from './preset.css'

export default {
    extends: [
        preset
    ],
    components: {
        'fixture-button': ['inline-flex fg:white bg:blue']
    }
} as Config
