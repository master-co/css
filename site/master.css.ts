import type { Config } from '@master/css'
import common from 'internal/master.css'
import base from './styles/base'
import btn from './styles/btn'

export default {
    extends: [
        common,
        base,
        btn,
    ]
} as Config