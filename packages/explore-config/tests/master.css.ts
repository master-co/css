import { Config } from '@master/css'
import card from './card.css'

export default {
    extends: [
        card
    ],
    components: {
        btn: [
            { selector: '&', declarations: { display: 'inline-flex' } }
        ]
    }
} as Config
